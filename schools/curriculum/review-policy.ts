/**
 * Which written explanations oblige a teacher, and which do not.
 *
 * Written responses persist and a teacher can mark them `reviewed` or
 * `needs_followup`. That makes every one of the 33 `explain` blocks *markable*,
 * and markable is not the same as *must be marked*: a class of eighteen turns
 * one obligation into eighteen reads a month, so the difference between four
 * obligations and thirty-three is the difference between forty minutes and a
 * second job.
 *
 * `expectedPoints` does not decide it. Every explain block carries them — they
 * are the author's rubric, and reading them as proof that marking is required
 * is what produced the claim that all 33 need a teacher.
 *
 * ## What earns an obligation
 *
 * One rule, and all four survivors meet it:
 *
 *   A written explanation is mandatory only when it is about the LEARNER'S OWN
 *   PROGRAM on an unseen problem, and the month's «Айлық сынақ» sentence names
 *   that explanation as the evidence.
 *
 * Nine per-month classifications and one adversarial pass produced this; the
 * adversary overturned six of ten, including two blocks whose case for being
 * mandatory rested on an oral twin that turned out to ask the same question.
 * The reasoning per block is in `docs/curriculum/EXPLAIN_REVIEW_NECESSITY.md`.
 *
 * ## Why this is data and not a field on the block
 *
 * The obligation is a property of the whole month — whether anything ELSE
 * measures the same thing — not of the block in isolation. Putting
 * `reviewRequired: true` on a block would invite an author to set it while
 * writing that block, which is exactly the judgement they are least placed to
 * make.
 */
import { PROGRAM } from "./program";
import type { LessonBlock } from "./types";

export type ReviewClass =
  /** A teacher must open the persisted response and act on it. */
  | "ASSESSMENT_HUMAN_REVIEW_REQUIRED"
  /** Human judgment establishes the outcome. None authored — kept so the vocabulary is complete. */
  | "REPAIR_OR_REASONING_REVIEW_REQUIRED"
  /** Writing it is the activity. None authored. */
  | "REFLECTION_NO_REQUIRED_REVIEW"
  /** Real evidence, available to analytics or a rotating sample. Never a queue item. */
  | "SAMPLE_FOR_TEACHER"
  /** Already measured objectively elsewhere in the month. No obligation. */
  | "REDUNDANT_HUMAN_REVIEW";

/**
 * The frozen classification of every `explain` block in the year.
 *
 * A block missing from this table is a block nobody has classified, which
 * `tests/school/review-policy.test.ts` treats as an error rather than as a
 * silent default.
 */
export const EXPLAIN_REVIEW: Readonly<Record<string, ReviewClass>> = {
  /* --- A: mandatory. All four are monthly-check blocks about the learner's
     own program, in a session where a teacher is already conducting an oral
     defence. Zero lesson blocks are mandatory. ------------------------------ */
  "m3.as.b2": "ASSESSMENT_HUMAN_REVIEW_REQUIRED",
  "m6.as.b3": "ASSESSMENT_HUMAN_REVIEW_REQUIRED",
  "m7.as.b3": "ASSESSMENT_HUMAN_REVIEW_REQUIRED",
  "m8.as.b1": "ASSESSMENT_HUMAN_REVIEW_REQUIRED",

  /* --- D: worth a teacher's eye, never an obligation ---------------------- */
  "m1.as.b3": "SAMPLE_FOR_TEACHER",
  "m2.l8.b9": "SAMPLE_FOR_TEACHER",
  "m3.l6.b8": "SAMPLE_FOR_TEACHER",
  "m4.l6.b9": "SAMPLE_FOR_TEACHER",
  "m5.l5.b9": "SAMPLE_FOR_TEACHER",
  "m6.l4.b10": "SAMPLE_FOR_TEACHER",
  "m6.l5.b9": "SAMPLE_FOR_TEACHER",
  "m7.l4.b10": "SAMPLE_FOR_TEACHER",
  "m8.l2.b10": "SAMPLE_FOR_TEACHER",
  "m9.l3.b5": "SAMPLE_FOR_TEACHER",
  "m9.l4.b5": "SAMPLE_FOR_TEACHER",

  /* --- E: the same skill is already measured objectively in the month ----- */
  "m1.l6.b4": "REDUNDANT_HUMAN_REVIEW",
  "m1.l8.b3": "REDUNDANT_HUMAN_REVIEW",
  "m2.l2.b8": "REDUNDANT_HUMAN_REVIEW",
  "m3.l5.b9": "REDUNDANT_HUMAN_REVIEW",
  "m3.l7.b8": "REDUNDANT_HUMAN_REVIEW",
  "m4.l2.b8": "REDUNDANT_HUMAN_REVIEW",
  "m4.as.b2": "REDUNDANT_HUMAN_REVIEW",
  "m5.l7.b9": "REDUNDANT_HUMAN_REVIEW",
  "m6.l3.b10": "REDUNDANT_HUMAN_REVIEW",
  "m6.l6.b9": "REDUNDANT_HUMAN_REVIEW",
  "m7.l1.b11": "REDUNDANT_HUMAN_REVIEW",
  "m7.l3.b10": "REDUNDANT_HUMAN_REVIEW",
  "m7.l5.b10": "REDUNDANT_HUMAN_REVIEW",
  "m8.l1.b10": "REDUNDANT_HUMAN_REVIEW",
  "m8.l4.b11": "REDUNDANT_HUMAN_REVIEW",
  "m9.l1.b5": "REDUNDANT_HUMAN_REVIEW",
  "m9.l2.b8": "REDUNDANT_HUMAN_REVIEW",
  "m9.l4.b4": "REDUNDANT_HUMAN_REVIEW",
};

/** What the teacher product must do about one block. */
export interface ReviewObligation {
  blockId: string;
  reviewClass: ReviewClass | "ORAL_IN_CLASS" | "NONE";
  /** Put it in the teacher's pending queue, and count it there. */
  mandatoryQueue: boolean;
  /**
   * May appear in analytics or a rotating sample.
   *
   * **It must never increase a mandatory pending-review count.** A sample that
   * counts as pending is not a sample; it is a queue with a softer name, and
   * the whole point of the classification is that eleven of these do not become
   * thirty-three reads a month.
   */
  sampleEligible: boolean;
  /** The evidence is a live exchange. Nothing to queue, nothing to read later. */
  oralInClass: boolean;
}

/** A block whose evidence is spoken or written on paper, in the room. */
function isOral(block: LessonBlock): boolean {
  return block.type === "verify" && (block.mode === "oral_explanation" || block.mode === "manual_trace");
}

/**
 * The obligation for one block, or `null` if it creates none.
 *
 * The single entry point for the teacher workstream: ask this, do not infer
 * from the block type, and do not infer from `expectedPoints`.
 */
export function reviewObligationFor(block: LessonBlock): ReviewObligation | null {
  if (isOral(block)) {
    return {
      blockId: block.id,
      reviewClass: "ORAL_IN_CLASS",
      mandatoryQueue: false,
      sampleEligible: false,
      oralInClass: true,
    };
  }
  if (block.type !== "explain") return null;

  const cls = EXPLAIN_REVIEW[block.id];
  if (!cls) return null;

  return {
    blockId: block.id,
    reviewClass: cls,
    mandatoryQueue: cls === "ASSESSMENT_HUMAN_REVIEW_REQUIRED",
    sampleEligible: cls === "SAMPLE_FOR_TEACHER",
    oralInClass: false,
  };
}

/** Every obligation in the year, for a given route. */
export function reviewObligations(track: string): ReviewObligation[] {
  const out: ReviewObligation[] = [];
  const visible = (b: LessonBlock) => !b.tracks || (b.tracks as readonly string[]).includes(track);
  for (const month of PROGRAM.months) {
    const blocks = [
      ...month.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
      ...(month.assessment?.blocks ?? []),
    ];
    for (const b of blocks) {
      if (!visible(b)) continue;
      const o = reviewObligationFor(b);
      if (o) out.push(o);
    }
  }
  return out;
}
