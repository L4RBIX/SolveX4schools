import { randomUUID } from "node:crypto";
import { getStore } from "@schools/store";
import { resolveIdentity } from "@schools/learning/identity";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { buildSystemPrompt } from "@schools/nova/prompt";
import { getNovaProvider, NovaProviderError } from "@schools/nova";
import { findBlock } from "@schools/learning/grade";
import { takeToken } from "@schools/lib/rate-limit";
import type { Locale } from "@schools/curriculum/types";

/**
 * Nova.
 *
 * The order of operations here IS the pedagogy, and it only works one way
 * round:
 *
 *   1. Derive the learner's state from the ledger.
 *   2. Run the Decision Engine. It chooses the action.
 *   3. Run `grantHintLevel`. It sets the ceiling.
 *   4. Only then build a prompt, and only then call a model.
 *
 * A language model asked to decide whether it may give away the answer will
 * eventually decide yes. It is never asked.
 */

export const runtime = "nodejs";

interface HintBody {
  blockId?: string;
  episodeId?: string;
  message?: string;
  requestedLevel?: number;
  override?: boolean;
  locale?: Locale;
}

const MAX_MESSAGE = 2000;

export async function POST(request: Request) {
  let body: HintBody;
  try {
    body = (await request.json()) as HintBody;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const target = body.blockId ? findBlock(body.blockId) : null;
  if (!target) return Response.json({ error: "unknown block" }, { status: 404 });

  const { subjectId } = await resolveIdentity();
  const store = await getStore();

  /* Keyed on the learner, never on the client IP. One school behind one NAT
     gateway is one address, so an IP bucket would let the most active student
     throttle the whole classroom — which reads to eighteen children as the
     platform being broken. */
  const limit = await takeToken(`nova:${subjectId}`, { capacity: 20, refillPerMinute: 10 });
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const episodeId = typeof body.episodeId === "string" ? body.episodeId : randomUUID();
  const requested = Number.isFinite(body.requestedLevel) ? Number(body.requestedLevel) : 0;

  const { grant, directive } = await enforceHintPolicy({
    store,
    subjectId,
    episodeId,
    requested,
    learnerOverride: body.override === true,
  });

  const locale: Locale = body.locale === "ru" ? "ru" : "kk";
  const block = target.block;

  const system = buildSystemPrompt({
    locale,
    monthTitle: target.month.title[locale],
    lessonTitle: target.lesson.title[locale],
    blockPrompt: "prompt" in block ? block.prompt[locale] : target.lesson.title[locale],
    blockCode: "code" in block && typeof block.code === "string" ? block.code : undefined,
    learnerAnswer: typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE) : undefined,
    skills: block.skillRefs,
    directive,
    grant,
  });

  const provider = await getNovaProvider();

  // Recorded BEFORE the model is called. An intervention that was granted is an
  // intervention, whether or not the provider then fell over — and the
  // independence cost is owed either way.
  const interventionId = randomUUID();
  await store.recordIntervention({
    interventionId,
    subjectId,
    episodeId,
    kind: "hint",
    level: grant.granted,
    trigger: body.override === true ? "learner_requested" : "learner_requested",
    mode: directive?.mode ?? null,
    containsCode: grant.mayIncludeCode && grant.granted >= 4,
    contentLen: 0,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      // The learner sees the policy decision immediately, before any token.
      send("policy", {
        granted: grant.granted,
        requested: grant.requested,
        capped: grant.capped,
        reason: grant.reason,
        explanation: grant.explanation,
        action: directive?.mode ?? null,
        /* The model's identity comes from configuration, never from the model.
           Asking an LLM what it is produces confident fiction. */
        provider: provider.id,
      });

      try {
        for await (const chunk of provider.stream({
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content:
                typeof body.message === "string" && body.message.trim()
                  ? body.message.slice(0, MAX_MESSAGE)
                  : "Маған осы тапсырмада көмектесе аласың ба?",
            },
          ],
          maxTokens: 500,
          temperature: 0.4,
        })) {
          send("token", { text: chunk });
        }
        send("done", { interventionId });
      } catch (err) {
        const kind = err instanceof NovaProviderError ? err.kind : "unknown";
        // Never leave the UI spinning. An error is a state, not a silence.
        send("error", { kind, retryable: err instanceof NovaProviderError && err.retryable });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
