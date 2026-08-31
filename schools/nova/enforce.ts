import "server-only";
import { grantHintLevel, type GrantDecision } from "@solvex/nova-core";
import {
  decide,
  type NovaDirective,
  type ReducibleEvent,
} from "@solvex/learning-intelligence-core";
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
  /**
   * This episode's ledger rows, handed back rather than dropped.
   *
   * They are already loaded below to answer "has the learner attempted
   * anything", and the route needs the same rows to answer a different
   * question — has the judge ever graded this block (`lastServerCheck` in
   * `./execution-context`). Reading them twice would be two queries and, worse,
   * two chances for the hint ceiling and the execution context to disagree
   * about what this episode contains.
   */
  events: readonly ReducibleEvent[];
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
  const events = await store.eventsForEpisode(episodeId);

  /* Derived from the ledger, not claimed by the client. With no hint yet there
     is nothing to have attempted "since", so the opening rung is available. */
  const hasAttemptSinceLastHint =
    lastHintAt === null ? true : hasEffortAfter(events, lastHintAt);

  /* Has anything been tried on this task AT ALL?
   *
   * The line above answers "may they climb"; this one answers "may they start".
   * Without it, `hasAttemptSinceLastHint` is vacuously true on a cold episode,
   * and the programme's first rule about help — that it opens only after the
   * learner has made an attempt of their own — had nothing enforcing it. */
  const hasAttempted = hasEffortAfter(events, null);

  const grant = grantHintLevel({
    requested: input.requested,
    lastGranted,
    hasAttemptSinceLastHint,
    hasAttempted,
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

  return { grant: clamped, directive, directiveNote, events };
}

/**
 * Did the learner do anything since the last hint?
 *
 * Counts only events that constitute effort. Asking for another hint is not
 * effort — otherwise the ladder could be climbed by asking repeatedly, which is
 * the exact failure it exists to prevent.
 */
function hasEffortAfter(
  events: readonly { event_name: string; received_at: string }[],
  since: string | null,
): boolean {
  const EFFORT = new Set([
    "verdict_received",
    "run_executed",
    "code_diff_classified",
    "test_case_authored",
  ]);
  return events.some((e) => (since === null || e.received_at > since) && EFFORT.has(e.event_name));
}
