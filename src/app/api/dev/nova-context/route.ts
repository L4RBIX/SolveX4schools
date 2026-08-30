import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getStore } from "@schools/store";
import { resolveIdentity } from "@schools/learning/identity";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { buildNovaContext, type DraftInput } from "@schools/nova/build-context";
import { buildNovaMessages } from "@schools/nova/prompt";
import { executionContextFor } from "@schools/nova/execution-context";
import { classifyMessage } from "@schools/nova/safety";
import { findBlock, taskKindOf } from "@schools/learning/grade";
import { capabilityFor } from "@schools/curriculum/capability";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { decide } from "@solvex/learning-intelligence-core";
import type { Locale } from "@schools/curriculum/types";

/**
 * Everything Nova would be told, without calling a model.
 *
 * Built by running the REAL pipeline — the same `enforceHintPolicy`, the same
 * `buildNovaContext`, the same `buildNovaMessages` the hint route uses — and
 * then stopping. That is the point: a debug view that assembles its own
 * approximation of the context would answer a question nobody asked, and would
 * go on answering it correctly long after the real path had drifted.
 *
 * It spends no provider credit and writes nothing to the ledger.
 *
 * ## Why it 404s rather than checking a role
 *
 * This returns a learner's evidence, the engine's reasoning and the assembled
 * prompt. There is no version of that which should be one guessed URL away from
 * a fourteen-year-old, so the route does not exist in production at all — the
 * same refusal `src/app/dev/layout.tsx` applies to the pages.
 */

export const runtime = "nodejs";

interface Body {
  blockId?: string;
  episodeId?: string;
  message?: string;
  requestedLevel?: number;
  override?: boolean;
  locale?: Locale;
  draft?: DraftInput;
  /** The learner's last local Run, in the shape `nova-chat.tsx` posts it. */
  lastRun?: unknown;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") notFound();

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const target = body.blockId ? findBlock(body.blockId) : null;
  if (!target) return Response.json({ error: "unknown block" }, { status: 404 });

  const locale: Locale = body.locale === "ru" ? "ru" : "kk";
  const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";

  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  const episodeId = await ownedEpisodeId(subjectId, body.episodeId ?? randomUUID());
  const taskKind = taskKindOf(target);

  const safety = classifyMessage(message);

  const { grant, directive, directiveNote, assessmentCapped, events } = await enforceHintPolicy({
    store,
    subjectId,
    episodeId,
    requested: Number.isFinite(body.requestedLevel) ? Number(body.requestedLevel) : 1,
    learnerOverride: body.override === true,
    taskKind,
  });

  const persisted = await store.getLearnerState(subjectId);
  const decision = persisted ? decide(persisted.state) : null;

  const context = await buildNovaContext({
    store,
    subjectId,
    episodeId,
    locale,
    target,
    grant,
    directive,
    directiveNote,
    action: decision?.primary.actionType ?? null,
    assessmentCapped,
    draft: body.draft,
  });

  /* The same execution wiring the hint route does, and it has to be the same
     or this page stops being an inspector and becomes a second opinion. The
     lab posts `lastRun` exactly as `nova-chat.tsx` does. */
  const runnable = "code" in target.block || "cases" in target.block;
  const execution = executionContextFor({
    reported: runnable ? body.lastRun : undefined,
    events,
    blockId: target.block.id,
  });

  const messages = buildNovaMessages(
    {
      locale,
      monthTitle: target.month.title[locale],
      lessonTitle: target.lesson.title[locale],
      blockPrompt: context.curriculum.prompt,
      blockCode: context.interaction.visible.code,
      skills: context.curriculum.skillIds,
      capability: capabilityFor(target.block.id),
      directive,
      grant,
      briefOffTopic: safety.verdict === "ALLOW_BRIEF_OFFTOPIC",
      context,
      execution,
    },
    message,
  );

  return Response.json({
    /* The subject id is the pseudonymous ledger key and it is shown here on
       purpose — this is the page you use to check WHICH learner you are looking
       at. It is never sent to a provider; see `docs/nova/PRIVACY.md`. */
    subjectId,
    episodeId,
    taskKind,
    safety,
    context,
    decision: decision
      ? {
          action: decision.primary.actionType,
          skill: decision.primary.skill,
          reason: decision.primary.reason,
          confidence: decision.primary.confidence,
          alternatives: decision.alternatives.map((a) => a.actionType),
        }
      : null,
    learnerState: persisted?.state ?? null,
    /* The exact array the provider would receive. Nothing is redacted, because
       nothing that needs redacting is in it — that is the claim
       `tests/nova/privacy-context.test.ts` holds, and this is where you check
       it by eye. */
    payload: messages,
    payloadChars: messages.reduce((n, m) => n + m.content.length, 0),
  });
}
