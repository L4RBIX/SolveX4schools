import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { findBlock } from "@schools/learning/grade";
import { takeToken } from "@schools/lib/rate-limit";
import {
  MAX_EXPLANATION_CHARS,
  MIN_EXPLANATION_CHARS,
  POST_HELP_ASSISTANCE_THRESHOLD,
  canSubmitExplanation,
  classifyExplanation,
  explanationPromptKeyFor,
  explanationVerdict,
  markingPointsFor,
  requiresPostHelpExplanation,
} from "@schools/learning/post-help";

/**
 * The explanation a learner owes after substantial help.
 *
 * «Кез келген көмектен соң оқушы шешімді өз сөзімен түсіндіруге… міндетті».
 * GET says whether one is owed and which question to ask; POST records it.
 *
 * ## Scoped by construction
 *
 * No `subjectId` parameter on either verb, so no version of this route can be
 * pointed at another child — the same shape `/api/learning/dictionary` and
 * `/api/learning/state/me` already use.
 *
 * ## And gated, which scoping does not do
 *
 * `checkLearningAccess` decides whether the caller may be here at all.
 * Without it POST wrote a `post_help_explanations` row against a subject
 * `resolveIdentity` had just minted for an unauthenticated caller — the
 * programme's reflection obligation, recorded as satisfied, for a child who is
 * not in the class.
 *
 * ## The assistance level is never accepted from the browser
 *
 * It is read here from `interventions`, which the hint route writes on the
 * server. A client that could name its own assistance level could name -1 and
 * skip the obligation entirely, which is the whole of the requirement.
 *
 * ## Nothing here grades anything
 *
 * The response carries `verdict: "unknown"` and always will:
 * `explanationVerdict()` has no branch that returns anything else, and the
 * table this writes to has no column for a score. If Nova later comments on the
 * text, that comment is a message in a panel — it does not reach this route and
 * there is nowhere for it to land if it did. See migration 0016.
 */

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Shared parsing. Returns a 4xx response instead of a target when malformed. */
function parseTarget(
  episodeId: string | null,
  blockId: string | null,
): { error: NextResponse } | { episodeId: string; blockId: string } {
  if (!episodeId || !UUID.test(episodeId)) {
    return { error: NextResponse.json({ error: "episodeId required" }, { status: 400 }) };
  }
  if (!blockId || !findBlock(blockId)) {
    /* Validated against the curriculum, not merely for shape: an explanation
       filed against a block that does not exist is a forged request, not a task
       nobody told us about. */
    return { error: NextResponse.json({ error: "unknown block" }, { status: 404 }) };
  }
  return { episodeId, blockId };
}

export async function GET(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  const url = new URL(request.url);
  const parsed = parseTarget(url.searchParams.get("episodeId"), url.searchParams.get("blockId"));
  if ("error" in parsed) return parsed.error;

  const { subjectId } = await resolveIdentity();
  const store = await getStore();

  const assistance = await readAssistance(store, parsed.episodeId);
  const existing = await store.postHelpExplanation(subjectId, parsed.episodeId, parsed.blockId);
  const target = findBlock(parsed.blockId)!;

  return Response.json({
    required: requiresPostHelpExplanation(assistance),
    /* `unmeasured` is a row that exists and answers nothing, so it is not
       satisfaction. The distinction is what lets a teacher tell a learner who
       skipped the reflection from one who was never asked. */
    satisfied: existing !== null && existing.status !== "unmeasured",
    status: existing?.status ?? null,
    assistanceLevel: assistance.maxLevel,
    threshold: POST_HELP_ASSISTANCE_THRESHOLD,
    /* A label KEY, resolved to Kazakh or Russian by the caller from
       `schools/presentation/labels.ts`. The server does not pick a language:
       locale is the learner's setting and lives on the client. */
    promptKey: explanationPromptKeyFor(target.block),
    minChars: MIN_EXPLANATION_CHARS,
    maxChars: MAX_EXPLANATION_CHARS,
    /* Stated to the learner before they write, never after. */
    verdict: explanationVerdict(),
  });
}

interface PostBody {
  episodeId?: string;
  blockId?: string;
  response?: string;
  /** "I would rather not." Recorded as `unmeasured`, never as an answer. */
  skip?: boolean;
}

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = parseTarget(body.episodeId ?? null, body.blockId ?? null);
  if ("error" in parsed) return parsed.error;

  const { subjectId, anonId, isNew } = await resolveIdentity();

  /* Keyed on the learner rather than the address, for the same reason the hint
     route is: one classroom behind one NAT gateway is one address. */
  const limit = await takeToken(`explanation:${subjectId}`, {
    capacity: 20,
    refillPerMinute: 10,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const store = await getStore();
  const assistance = await readAssistance(store, parsed.episodeId);

  if (!requiresPostHelpExplanation(assistance)) {
    /* Refused rather than stored. A row here asserts "the gate fired on this
       episode", and writing one for an episode where it did not would put a
       fact in the record that never happened — and `assistance_level` has
       nothing legal to hold when no help was delivered. */
    return NextResponse.json(
      { error: "not_required", assistanceLevel: assistance.maxLevel },
      { status: 409 },
    );
  }

  const raw = typeof body.response === "string" ? body.response.trim() : "";
  const skipping = body.skip === true || raw.length === 0;

  if (!skipping && !canSubmitExplanation(raw)) {
    /* A length check, and the message says so. Refused rather than truncated:
       silently cutting a child's sentence in half is worse than telling them it
       was too long, which is the call `/api/learning/dictionary` already makes
       about a note. */
    return NextResponse.json(
      { error: "length", min: MIN_EXPLANATION_CHARS, max: MAX_EXPLANATION_CHARS },
      { status: 400 },
    );
  }

  const target = findBlock(parsed.blockId)!;
  const status = classifyExplanation({
    response: skipping ? null : raw,
    markingPoints: markingPointsFor(target.block).length,
  });

  const first = await store.recordPostHelpExplanation({
    subjectId,
    episodeId: parsed.episodeId,
    blockId: parsed.blockId,
    assistanceLevel: assistance.maxLevel,
    interventionId: assistance.interventionId,
    response: skipping ? null : raw,
    status,
  });

  const res = NextResponse.json({
    status,
    /* Recorded, not marked. Always `unknown`, always sent, so no client can
       develop the habit of inferring a pass from a 200. */
    verdict: explanationVerdict(),
    /* An explanation never buys back independence. Assistance was delivered;
       explaining is how a learner consolidates help, not how they un-receive
       it. Sent explicitly so a caller cannot read the absence as "maybe". */
    independent: false,
    /* False when a row was already there. The first answer is the one kept —
       see `recordPostHelpExplanation`. */
    recorded: first,
  });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}

/** The assistance context, read from the server's own ledger. */
async function readAssistance(
  store: Awaited<ReturnType<typeof getStore>>,
  episodeId: string,
): Promise<{ maxLevel: number; interventionId: string | null }> {
  const iv = await store.lastIntervention(episodeId);
  return iv
    ? { maxLevel: iv.level, interventionId: iv.interventionId }
    : { maxLevel: -1, interventionId: null };
}
