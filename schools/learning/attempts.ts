import { hasAttemptSince } from "@solvex/nova-core";
import { ATTEMPT_BLOCK_TYPES, type BlockType } from "@schools/curriculum/types";

/**
 * The attempt bridge — the single most consequential file in this adapter.
 *
 * ## What goes wrong without it
 *
 * `hasAttemptSince` gates the entire hint ladder. It recognises exactly three
 * event types, all from a code editor:
 *
 *     code_changed_debounced | run_clicked | submit_clicked
 *
 * A school lesson is mostly not a code editor. A learner who answers a
 * prediction, reorders lines, traces execution on paper or picks a multiple
 * choice has unquestionably attempted something — and produces none of those
 * three events. So `hasAttemptSince` stays false forever, every hint request is
 * capped at the lowest level, and Nova appears broken.
 *
 * The failure is **silent**. No exception, no log line, no red test. In a
 * classroom it looks like the assistant refusing to help a child who is
 * trying — which is precisely the opposite of the programme's first AI rule:
 * help unlocks *after* the learner has attempted something (PDF p.4).
 *
 * ## The fix
 *
 * Translate school interactions into the vocabulary the guard already speaks,
 * then delegate. Two properties matter:
 *
 * 1. **No fork.** We do not reimplement the guard. If the export tightens its
 *    definition of an attempt, we inherit the change instead of drifting.
 * 2. **No inflation.** Only genuine attempts translate. Opening a lesson,
 *    reading a concept and watching a simulation are not attempts and must not
 *    become one — a guard that accepts passive events is not a guard.
 */

/** A school-side interaction, before translation. */
export interface SchoolInteraction {
  type: SchoolInteractionType;
  timestamp: number;
  blockType: BlockType;
}

export type SchoolInteractionType =
  /** Learner committed an answer to a non-code block. */
  | "answer_submitted"
  /** Learner changed a non-code answer without committing (drag, reorder, typing). */
  | "answer_changed"
  /** Code editor events, already in the export's vocabulary. */
  | "code_changed_debounced"
  | "run_clicked"
  | "submit_clicked"
  /* --- Below this line: never attempts. --- */
  | "lesson_opened"
  | "block_viewed"
  | "concept_read"
  | "simulation_played"
  | "hint_requested"
  | "solution_revealed";

/**
 * The translation table. Explicit rather than a default, so adding an
 * interaction type forces a decision about whether it counts as trying.
 */
const TRANSLATION: Record<SchoolInteractionType, "submit_clicked" | "code_changed_debounced" | null> = {
  answer_submitted: "submit_clicked",
  answer_changed: "code_changed_debounced",
  code_changed_debounced: "code_changed_debounced",
  run_clicked: "run_clicked" as "code_changed_debounced", // already recognised; passthrough
  submit_clicked: "submit_clicked",

  lesson_opened: null,
  block_viewed: null,
  concept_read: null,
  simulation_played: null,
  // Asking for help is not attempting. Treating it as one would let a learner
  // climb the whole ladder by asking repeatedly, which is the failure mode the
  // ladder exists to prevent.
  hint_requested: null,
  solution_revealed: null,
};

/**
 * Translate school interactions into the guard's vocabulary.
 *
 * An interaction only survives translation if its block type is an attempt
 * block. That second condition is not redundant: `answer_changed` on a
 * reflection prompt is typing, not an attempt at a problem.
 */
export function toGuardEvents(
  interactions: readonly SchoolInteraction[],
): { type: string; timestamp: number }[] {
  const out: { type: string; timestamp: number }[] = [];
  for (const interaction of interactions) {
    if (!ATTEMPT_BLOCK_TYPES.has(interaction.blockType)) continue;
    const translated = TRANSLATION[interaction.type];
    if (!translated) continue;
    out.push({ type: translated, timestamp: interaction.timestamp });
  }
  return out;
}

/**
 * Did the learner actually try since `since`?
 *
 * The school-facing replacement for calling `hasAttemptSince` directly. Every
 * caller in this product must use this one; calling the export's version with
 * raw school events is the bug described at the top of this file.
 */
export function schoolHasAttemptSince(
  interactions: readonly SchoolInteraction[],
  since: number | null,
): boolean {
  return hasAttemptSince(toGuardEvents(interactions), since);
}

/** True when this interaction, on this block, constitutes a genuine attempt. */
export function isAttempt(interaction: SchoolInteraction): boolean {
  return (
    ATTEMPT_BLOCK_TYPES.has(interaction.blockType) &&
    TRANSLATION[interaction.type] !== null
  );
}

/* ==========================================================================
 * The live half.
 *
 * Everything above this line is pure, tested, and — until now — called by
 * nothing. It was written for a client-side interaction stream that was never
 * built, so the guard it exists to protect was quietly reimplemented in
 * `schools/nova/enforce.ts` as a private set of four ledger event names. That
 * fork is what this section removes, and it removes it in the direction the
 * file's own header demanded: translate, then delegate.
 *
 * ## The bug the fork was hiding
 *
 * Three of those four names — `run_executed`, `code_diff_classified`,
 * `test_case_authored` — are emitted nowhere in the product. So the effort test
 * reduced, in practice, to "has a `verdict_received` been written for this
 * episode".
 *
 * And `verdict_received` is written only `if (verdictName)`, which is null
 * whenever a block settles `unknown` — an oral explanation, a block no machine
 * scores, or ANY block at all while the judge is unreachable. On those blocks a
 * learner can answer, press Check, be told their answer was received, and still
 * have no attempt on record. `hasAttempted` stays false, `grantHintLevel`
 * returns the opening rung and refuses to move, and Nova sits there declining
 * to help a child who is visibly trying — for the rest of the episode, with no
 * error anywhere.
 *
 * That is the same silent-degradation shape the archive's VERIFIED_COUPLING.md
 * warned about, relocated one layer down.
 *
 * ## Why trust is part of the answer
 *
 * The fix cannot simply be "count `episode_opened` too". `episode_opened` is on
 * the taxonomy the ingest route accepts from a browser, so counting it by name
 * would hand every learner a one-line `fetch()` that unlocks the hint ladder
 * without answering anything — trading a lock-out for a bypass.
 *
 * So the filter is on TRUST, not on name. Migration 0003 already wrote the rule
 * down at `learning_events.source_trust`: *"a browser may add colour, never
 * proof."* Nothing had ever enforced it. Here, an attempt counts when the
 * SERVER witnessed it — which is exactly the set of rows the submit route wrote
 * itself, graded or not.
 * ========================================================================== */

/**
 * A ledger row, in the only shape this bridge needs.
 *
 * Structural, so this module stays pure and the caller supplies rows it already
 * had to fetch. That is not a stylistic preference. The first version of this
 * code opened its own connection through `getStoreHandle()` while
 * `enforceHintPolicy` was handed a `LearningStore` as a parameter — and in the
 * tests those are two different databases, because the suite constructs an
 * in-memory PGlite and injects it. The bridge queried an empty one, found no
 * attempts, and reported that a learner who had just submitted an answer had
 * never tried anything.
 *
 * In production the two handles happen to coincide, which is the worst version
 * of that bug: it would have passed every test that used the real path and
 * failed only where a store was injected — i.e. exactly where the ladder is
 * tested.
 */
export interface LedgerAttemptRow {
  event_name: string;
  received_at: string;
  sourceTrust: string;
}

/**
 * Ledger event names that mean the learner did something, mapped into the
 * guard's vocabulary.
 *
 * `episode_opened` is here because the submit route writes exactly one per
 * press of Check, and it writes it BEFORE grading — which is the only record
 * that survives when grading produces no verdict. It is admitted only under
 * server trust, which is what makes that safe.
 *
 * Asking for help is absent, and its absence is load-bearing: `assistance_*`
 * events would let a learner climb the ladder by asking repeatedly, which is
 * the single failure the ladder exists to prevent.
 */
const LEDGER_ATTEMPT: Record<string, "submit_clicked" | "code_changed_debounced" | "run_clicked"> = {
  episode_opened: "submit_clicked",
  verdict_received: "submit_clicked",
  run_executed: "run_clicked",
  code_diff_classified: "code_changed_debounced",
  test_case_authored: "code_changed_debounced",
};

/** Only the server's own word counts. See the note on trust above. */
const TRUSTED = new Set(["server", "judge", "verifier"]);

/**
 * The episode's attempts, in the guard's vocabulary.
 *
 * Reads `received_at` — the server's clock — rather than `occurred_at`, which
 * is the client's and is forgeable. Migration 0003 says so at the column
 * itself: "anything ordered for analysis uses received_at".
 */
function attemptEventsFrom(
  rows: readonly LedgerAttemptRow[],
): { type: string; timestamp: number }[] {
  const out: { type: string; timestamp: number }[] = [];
  for (const row of rows) {
    if (!TRUSTED.has(row.sourceTrust)) continue;
    const translated = LEDGER_ATTEMPT[row.event_name];
    if (!translated) continue;
    out.push({ type: translated, timestamp: new Date(row.received_at).getTime() });
  }
  return out;
}

/**
 * Has the learner tried anything on this episode since `since`?
 *
 * Delegates to the core's `hasAttemptSince` rather than reimplementing it, so a
 * future tightening of what counts as an attempt is inherited instead of
 * drifting. `since` is an ISO string because that is what the ledger stores;
 * null means "since the beginning", which the core answers with `true` — see
 * `hasAttemptedAtAll` for the question that actually needs asking then.
 */
export function schoolHasAttemptSinceLedger(
  rows: readonly LedgerAttemptRow[],
  since: string | null,
): boolean {
  return hasAttemptSince(
    attemptEventsFrom(rows),
    since === null ? null : new Date(since).getTime(),
  );
}

/**
 * Has the learner tried anything on this episode AT ALL?
 *
 * A separate question from the one above, and the core cannot answer it:
 * `hasAttemptSince(events, null)` returns `true` unconditionally, which is
 * correct for "has anything happened since the dawn of time" and useless for
 * "may help open yet". The programme is explicit that it must be earned —
 * «көмек оқушы өзі бір әрекет жасап көргеннен кейін ғана ашылады» — so this is
 * asked directly.
 */
export function schoolHasAttemptedAtAll(rows: readonly LedgerAttemptRow[]): boolean {
  return attemptEventsFrom(rows).length > 0;
}
