import "server-only";
import { grantHintLevel, type GrantDecision } from "@solvex/nova-core";
import { decide, type NovaDirective } from "@solvex/learning-intelligence-core";
import type { LearningStore } from "@schools/store/learning-store";
import {
  schoolHasAttemptSinceLedger,
  schoolHasAttemptedAtAll,
} from "@schools/learning/attempts";
import type { TrustedEvent } from "@schools/store/learning-store";
import { getStoreHandle } from "@schools/store";

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
 *
 * ## Three things this file used to get wrong
 *
 * 1. It owned a private four-name effort set, forking the guard that
 *    `schools/learning/attempts.ts` exists to be. Three of those four names are
 *    emitted nowhere in the product, so the test collapsed to "was a verdict
 *    written" — and a verdict is NOT written for a block no machine scores, or
 *    for any block while the judge is down. On those, help stayed locked at the
 *    opening rung for the whole episode. The bridge now answers instead, and it
 *    answers from server-trusted rows only.
 *
 * 2. It never passed `unproductiveStruggle`, which the core accepts and
 *    honours. `struggle_class` is computed on every reduction and persisted,
 *    and it was read by nothing but a dev page that 404s in production. That is
 *    the rule which lifts the cap for a learner who is genuinely stuck, and
 *    VERIFIED_COUPLING.md §1b names the consequence exactly: "a drowning
 *    learner stays capped."
 *
 * 3. It had no idea what kind of task it was on. The help centre tells learners
 *    in both languages that Nova gives no hints during the monthly check; the
 *    code had no such gate, so one attempt plus the panel's override button
 *    produced a level-4 hint with code on the programme's central independent
 *    assessment. The cap now arrives here, on the server, where a client button
 *    cannot reach it.
 */

export interface EnforceInput {
  store: LearningStore;
  subjectId: string;
  episodeId: string;
  requested: number;
  /** "Just tell me." Always honoured — except under assessment policy. */
  learnerOverride: boolean;
  /**
   * What kind of work this is.
   *
   * Resolved from the curriculum by the caller, never from the request body.
   * `assessment` is the monthly check and `verification` its coding half; both
   * are the thing the programme measures a learner BY, so help on them is
   * capped no matter what is asked or how.
   */
  taskKind?: "lesson" | "practice" | "assessment" | "verification";
}

export interface EnforceResult {
  grant: GrantDecision;
  directive: NovaDirective | null;
  /** Why the directive is null, when it is. Shown in the dev lab, never to a learner. */
  directiveNote: string | null;
  /** True when assessment policy lowered the ceiling. Drives the panel's wording. */
  assessmentCapped: boolean;
  /**
   * This episode's ledger rows, handed back rather than dropped.
   *
   * They are already loaded here to answer "has the learner attempted
   * anything", and the route needs the same rows to answer a different
   * question — has the judge ever graded this block (`lastServerCheck` in
   * `./execution-context`). Reading them twice would be two queries and, worse,
   * two chances for the hint ceiling and the execution context to disagree
   * about what this episode contains.
   */
  events: readonly TrustedEvent[];
}

/**
 * The ceiling under assessment.
 *
 * Not zero. A learner sitting the monthly check who cannot get a single word
 * from Nova learns that the tutor abandons them exactly when it is hardest,
 * and the programme's own help text does not promise silence — it promises no
 * HINTS. Level 1 is "point at the region: which line, which value, which case",
 * with no explanation and, below, no code at all. That is the most that can be
 * given without answering the thing being measured.
 */
const ASSESSMENT_MAX_LEVEL = 1;

function isAssessment(kind: EnforceInput["taskKind"]): boolean {
  return kind === "assessment" || kind === "verification";
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
  /* Fetched once, from the store the caller gave us, and handed to the bridge.
     The bridge deliberately does not fetch for itself — see the note on
     `LedgerAttemptRow`; a second connection is a second database as soon as
     anyone injects a store, which is what the ladder's own tests do. */
  const events = await store.eventsForEpisode(episodeId);

  /* Derived from the ledger, not claimed by the client, and delegated to the
     school attempt bridge rather than decided here. With no hint yet there is
     nothing to have attempted "since", so the opening rung is available — the
     separate question of whether help may open at all is `hasAttempted`. */
  const hasAttemptSinceLastHint =
    lastHintAt === null ? true : schoolHasAttemptSinceLedger(events, lastHintAt);

  /* Has anything been tried on this task AT ALL?
   *
   * The line above answers "may they climb"; this one answers "may they start".
   * Without it, `hasAttemptSinceLastHint` is vacuously true on a cold episode,
   * and the programme's first rule about help — that it opens only after the
   * learner has made an attempt of their own — had nothing enforcing it. */
  const hasAttempted = schoolHasAttemptedAtAll(events);

  /*
   * Struggle, but only when it was observed.
   *
   * `unproductiveStruggle` lifts the cap, so inferring it would be inventing a
   * reason to give a learner more than the ladder allows. It is passed only
   * when the reducer has classified the episode as `thrash` or `stuck` from
   * actual attempt progression — never from how long they have been there and
   * never from anything they said.
   */
  const struggleClass = await struggleClassFor(episodeId);
  const unproductiveStruggle = struggleClass === "thrash" || struggleClass === "stuck";

  const assessment = isAssessment(input.taskKind);

  const grant = grantHintLevel({
    requested: input.requested,
    lastGranted,
    hasAttemptSinceLastHint,
    hasAttempted,
    directive,
    unproductiveStruggle,
    /* Under assessment the override is not honoured. It is a learner's right to
       overrule a tutor's pacing; it is not a right to overrule the conditions
       of the thing being marked. */
    learnerOverride: input.learnerOverride && !assessment,
  });

  /* The core's branch for "no directive, already granted 3, asked for 1"
     returns 3 — more than the learner asked for. Handing someone a bigger hint
     than they wanted costs them independence weight for nothing, so the grant
     is clamped to the ask. Never raised, only lowered. */
  let granted = Math.min(grant.granted, grant.requested);

  /*
   * The assessment ceiling, applied last.
   *
   * Last on purpose: every rule above can only lower the number, and this one
   * must not be reachable past any of them — including the unproductive-struggle
   * override, which exists to lift a cap and would otherwise lift this one.
   */
  const assessmentCapped = assessment && granted > ASSESSMENT_MAX_LEVEL;
  if (assessment) granted = Math.min(granted, ASSESSMENT_MAX_LEVEL);

  const clamped: GrantDecision = {
    ...grant,
    granted,
    capped: granted < grant.requested,
    /* Code is refused outright under assessment, independently of the level.
       `mayIncludeCode` and the level are separate permissions in the core and
       a future rung could carry one without the other. */
    mayIncludeCode: grant.mayIncludeCode && !assessment,
  };

  return { grant: clamped, directive, directiveNote, assessmentCapped, events };
}

/**
 * This episode's struggle classification, as the reducer last computed it.
 *
 * Read here rather than through `LearningStore` because it is one column on one
 * row and the store's episode reader returns a whole subject's history joined
 * against intervention outcomes — an expensive way to ask a cheap question on
 * the path a learner is waiting on.
 *
 * Null is the normal answer, not an error: the sweep may not have reached this
 * episode yet, and "no classification" must never be read as "not struggling".
 * The caller only lifts the cap on an explicit `thrash` or `stuck`.
 */
async function struggleClassFor(episodeId: string): Promise<string | null> {
  try {
    const { sql } = await getStoreHandle();
    const res = await sql.query<{ struggle_class: string | null }>(
      `select struggle_class from learning_episodes where episode_id = $1`,
      [episodeId],
    );
    return res.rows[0]?.struggle_class ?? null;
  } catch {
    /* A projection that cannot be read is not a learner who is stuck. Failing
       to null keeps the cap ON, which is the safe direction: the cost is one
       learner not getting a lift they had earned, against the alternative of
       every learner getting one they had not. */
    return null;
  }
}
