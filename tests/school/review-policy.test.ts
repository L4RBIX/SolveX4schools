import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import {
  EXPLAIN_REVIEW,
  reviewObligationFor,
  reviewObligations,
} from "@schools/curriculum/review-policy";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * The contract the teacher workstream consumes.
 *
 * Its value is entirely in the two numbers it keeps apart: four blocks oblige a
 * teacher and eleven merely interest one. If a `SAMPLE_FOR_TEACHER` block ever
 * starts counting as pending, a class of eighteen goes from 72 mandatory reads
 * a year to 270, and nothing in the product would announce it.
 */

const ALL: LessonBlock[] = MONTHS.flatMap((m) => [
  ...m.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
  ...(m.assessment?.blocks ?? []),
]);

describe("every explain block is classified", () => {
  it("leaves none unclassified, and classifies nothing that does not exist", () => {
    const explains = ALL.filter((b) => b.type === "explain").map((b) => b.id);
    const classified = Object.keys(EXPLAIN_REVIEW);
    expect(explains.length).toBe(33);
    expect(
      explains.filter((id) => !EXPLAIN_REVIEW[id]),
      "explain blocks with no review classification — an unclassified block silently obliges nobody",
    ).toEqual([]);
    expect(
      classified.filter((id) => !explains.includes(id)),
      "classifications for blocks that no longer exist",
    ).toEqual([]);
  });

  it("holds the frozen counts", () => {
    const n = (c: string) => Object.values(EXPLAIN_REVIEW).filter((v) => v === c).length;
    expect(n("ASSESSMENT_HUMAN_REVIEW_REQUIRED")).toBe(4);
    expect(n("REPAIR_OR_REASONING_REVIEW_REQUIRED")).toBe(0);
    expect(n("REFLECTION_NO_REQUIRED_REVIEW")).toBe(0);
    expect(n("SAMPLE_FOR_TEACHER")).toBe(11);
    expect(n("REDUNDANT_HUMAN_REVIEW")).toBe(18);
  });

  it("makes every mandatory block a monthly-check block on every route", () => {
    /* The rule the classification rests on. A mandatory read that landed in a
       lesson would be a queue item outside the session a teacher is already
       running, which is the shape this whole audit exists to avoid. */
    const mandatory = Object.entries(EXPLAIN_REVIEW)
      .filter(([, c]) => c === "ASSESSMENT_HUMAN_REVIEW_REQUIRED")
      .map(([id]) => id);
    for (const id of mandatory) {
      expect(id, `${id} is mandatory but is not an assessment block`).toMatch(/^m\d+\.as\./);
      const block = ALL.find((b) => b.id === id)!;
      expect(block.tracks, `${id} is mandatory but not on every route`).toBeUndefined();
    }
  });
});

describe("the production contract", () => {
  it("queues only the mandatory four, on every route", () => {
    for (const track of ["support", "core", "advanced"]) {
      const q = reviewObligations(track).filter((o) => o.mandatoryQueue);
      expect(q.length, `${track} mandatory queue`).toBe(4);
      expect(q.every((o) => o.reviewClass === "ASSESSMENT_HUMAN_REVIEW_REQUIRED")).toBe(true);
    }
  });

  it("never lets a sample become a queue item", () => {
    /* The one invariant the teacher product must not break. */
    for (const track of ["support", "core", "advanced"]) {
      for (const o of reviewObligations(track)) {
        expect(
          o.sampleEligible && o.mandatoryQueue,
          `${o.blockId} is both sampled and mandatory — a sample that counts as pending is a queue`,
        ).toBe(false);
      }
    }
  });

  it("gives oral work no queue and no sample", () => {
    for (const o of reviewObligations("core").filter((x) => x.oralInClass)) {
      expect(o.mandatoryQueue, `${o.blockId}`).toBe(false);
      expect(o.sampleEligible, `${o.blockId}`).toBe(false);
    }
    expect(reviewObligations("core").filter((o) => o.oralInClass).length).toBe(15);
  });

  it("obliges nothing for a redundant block", () => {
    const redundant = ALL.find((b) => EXPLAIN_REVIEW[b.id] === "REDUNDANT_HUMAN_REVIEW")!;
    const o = reviewObligationFor(redundant)!;
    expect(o.mandatoryQueue).toBe(false);
    expect(o.sampleEligible).toBe(false);
    expect(o.oralInClass).toBe(false);
  });

  it("creates no obligation for a graded task", () => {
    /* A write_code is settled by a judge and must never reach a teacher's
       queue, whatever else changes. */
    const code = ALL.find((b) => b.type === "write_code")!;
    expect(reviewObligationFor(code)).toBeNull();
  });
});

describe("the workload the contract implies", () => {
  it("is 4 mandatory, 4 sampled and 15 oral on core, per learner per year", () => {
    const o = reviewObligations("core");
    expect(o.filter((x) => x.mandatoryQueue).length).toBe(4);
    expect(o.filter((x) => x.sampleEligible).length).toBe(4);
    expect(o.filter((x) => x.oralInClass).length).toBe(15);
    /* Class of 18: 72 mandatory reads a year, 8 a month. Stated here because
       the number is the point of the classification, not a by-product. */
    expect(o.filter((x) => x.mandatoryQueue).length * 18).toBe(72);
  });
});
