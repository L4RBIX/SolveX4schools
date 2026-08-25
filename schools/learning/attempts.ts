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
