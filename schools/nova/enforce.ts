import "server-only";
import { grantHintLevel, type GrantDecision } from "@solvex/nova-core";
import { decide, type NovaDirective } from "@solvex/learning-intelligence-core";
import type { LearningStore } from "@schools/store/learning-store";

/**
 * Server-side enforcement of the hint ladder.
 *
 * Every input to `grantHintLevel` is derived here, on the server, from the
 * ledger. None of it is accepted from the client — a browser that could name
 * its own `lastGranted` could name 4, and a browser that could assert
 * `hasAttemptSinceLastHint` could assert it without attempting anything.
 *
 * The one input that does come from the learner is `learnerOverride`, and that
 * is correct: the override exists precisely so the learner can overrule the
 * system. It is honoured in one tap, and it costs them the independence weight
 * on that episode — a price the reducer applies whether or not anyone
 * remembers to mention it.
 */

export interface EnforceInput {
  store: LearningStore;
  subjectId: string;
  episodeId: string;
  requested: number;
  /** "Just tell me." Always honoured. */
  learnerOverride: boolean;
}

export interface EnforceResult {
  grant: GrantDecision;
  directive: NovaDirective | null;
  /** Why the directive is null, when it is. Shown in the dev lab, never to a learner. */
  directiveNote: string | null;
}

export async function enforceHintPolicy(input: EnforceInput): Promise<EnforceResult> {
  const { store, subjectId, episodeId } = input;

  const persisted = await store.getLearnerState(subjectId);
  let directive: NovaDirective | null = null;
  let directiveNote: string | null = null;

  if (!persisted) {
    directiveNote = "no learner state yet — the sweep has not seen an attempt from this subject";
  } else {
    const decision = decide(persisted.state);
    directive = decision.primary.nova;
  }

  const lastGranted = await store.lastGrantedLevel(episodeId);
  const lastHintAt = await store.lastHintAt(episodeId);

  /* Derived from the ledger, not claimed by the client. With no hint yet there
     is nothing to have attempted "since", so the opening rung is available. */
  const hasAttemptSinceLastHint =
    lastHintAt === null ? true : await hasAttemptSince(store, episodeId, lastHintAt);

  const grant = grantHintLevel({
    requested: input.requested,
    lastGranted,
    hasAttemptSinceLastHint,
    directive,
    learnerOverride: input.learnerOverride,
  });

  /* The core's branch for "no directive, already granted 3, asked for 1"
     returns 3 — more than the learner asked for. Handing someone a bigger hint
     than they wanted costs them independence weight for nothing, so the grant
     is clamped to the ask. Never raised, only lowered. */
  const clamped: GrantDecision = {
    ...grant,
    granted: Math.min(grant.granted, grant.requested),
  };

  return { grant: clamped, directive, directiveNote };
}

/**
 * Did the learner do anything since the last hint?
 *
 * Counts only events that constitute effort. Asking for another hint is not
 * effort — otherwise the ladder could be climbed by asking repeatedly, which is
 * the exact failure it exists to prevent.
 */
async function hasAttemptSince(
  store: LearningStore,
  episodeId: string,
  since: string,
): Promise<boolean> {
  const events = await store.eventsForEpisode(episodeId);
  const EFFORT = new Set(["verdict_received", "run_executed", "code_diff_classified", "test_case_authored"]);
  return events.some((e) => e.received_at > since && EFFORT.has(e.event_name));
}
