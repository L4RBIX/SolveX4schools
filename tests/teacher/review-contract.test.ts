import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { EXPLAIN_REVIEW, reviewObligationFor } from "@schools/curriculum/review-policy";
import { isHumanReviewable } from "@schools/teacher/review";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * The seam between the curriculum's review contract and the teacher's queue.
 *
 * `tests/school/review-policy.test.ts` proves the CONTRACT is right — four
 * mandatory, four sampled on core, fifteen oral. This file proves the teacher
 * product OBEYS it, which is a different claim and the one that was false.
 *
 * The two lived apart for a while and disagreed. `review-policy.ts` classified
 * every `explain` block and said in its own header "do not infer from
 * `expectedPoints`"; `schools/teacher/review.ts` inferred from `expectedPoints`,
 * which is every block an author wrote marking criteria for. Nothing failed,
 * because no test crossed the seam.
 */

const ASSESSMENT_BLOCKS: LessonBlock[] = MONTHS.flatMap((m) => m.assessment?.blocks ?? []);
const ALL_BLOCKS: LessonBlock[] = MONTHS.flatMap((m) => [
  ...m.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
  ...(m.assessment?.blocks ?? []),
]);

const MANDATORY = ["m3.as.b2", "m6.as.b3", "m7.as.b3", "m8.as.b1"];

describe("the teacher's asynchronous written-review queue", () => {
  it("is exactly the four blocks the curriculum makes mandatory", () => {
    const queued = ASSESSMENT_BLOCKS.filter(isHumanReviewable).map((b) => b.id);
    expect(queued.sort()).toEqual([...MANDATORY].sort());
  });

  it("never queues an oral defence, which happens in the room", () => {
    /* The platform keeps the short note a learner types before speaking. That
       note is not the evidence — the defence is, and it was given on Monday.
       Ten of these used to sit in the queue. */
    const oral = ALL_BLOCKS.filter(
      (b) => b.type === "verify" && b.mode === "oral_explanation",
    );
    expect(oral.length).toBeGreaterThan(0);
    for (const b of oral) {
      expect(isHumanReviewable(b), `${b.id} is an oral defence and must not be queued`).toBe(false);
    }
  });

  it("never lets a sample become a queue item", () => {
    const sampled = ALL_BLOCKS.filter((b) => EXPLAIN_REVIEW[b.id] === "SAMPLE_FOR_TEACHER");
    expect(sampled.length).toBeGreaterThan(0);
    for (const b of sampled) {
      expect(isHumanReviewable(b), `${b.id} is sampled, not pending`).toBe(false);
    }
  });

  it("obliges nothing for a block the machine already settles", () => {
    const redundant = ALL_BLOCKS.filter(
      (b) => EXPLAIN_REVIEW[b.id] === "REDUNDANT_HUMAN_REVIEW",
    );
    expect(redundant.length).toBeGreaterThan(0);
    for (const b of redundant) {
      expect(isHumanReviewable(b), `${b.id} is redundant`).toBe(false);
    }
  });

  it("agrees with the curriculum contract on every block in the programme", () => {
    /* One predicate, two callers. A disagreement anywhere is the defect this
       file exists to prevent coming back by a different door. */
    for (const b of ALL_BLOCKS) {
      expect(
        isHumanReviewable(b),
        `${b.id}: teacher queue and reviewObligationFor disagree`,
      ).toBe(reviewObligationFor(b)?.mandatoryQueue === true);
    }
  });

  it("does not queue every block that merely carries marking criteria", () => {
    /* The specific regression. `expectedPoints` means an author wrote down what
       a marker looks for; it does not mean a marker must read all of them. That
       predicate queued sixteen blocks per learner per year over the nine
       assessments — 288 reads for a class of eighteen instead of 72. */
    const withCriteria = ASSESSMENT_BLOCKS.filter((b) => {
      if (b.type === "explain") return b.expectedPoints.length > 0;
      if (b.type === "verify" && b.mode === "oral_explanation") {
        return (b.expectedPoints?.length ?? 0) > 0;
      }
      return false;
    });
    expect(withCriteria.length).toBe(16);
    expect(ASSESSMENT_BLOCKS.filter(isHumanReviewable).length).toBe(4);
  });
});
