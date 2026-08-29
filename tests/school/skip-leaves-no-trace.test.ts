import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { publicLesson } from "@schools/curriculum/public";
import { isPublicAttemptBlock } from "@schools/learning/checking";
import { footerMode } from "@/components/brilliant/lesson/lesson-verdict";
import { L } from "@schools/presentation/labels";
import type { Lesson, TrackLevel } from "@schools/curriculum/types";

/**
 * What declining an optional task must NOT do.
 *
 * Skip advances the page and changes nothing else. That is easy to state and
 * easy to break: any future version that marks the block seen, settles it
 * `unmeasured`, records an attempt or files it as evidence would still let the
 * learner through, so every navigation test in the suite would stay green while
 * a task the learner explicitly declined started counting as work they did.
 *
 * The block's state after Skip is the state it had before: `verdict:
 * "unchecked"`, no answer, no reveal. Everything below follows from that, and
 * each consequence is asserted separately because they have different
 * consequences if they break.
 */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];

/** Exactly what `advance()` leaves behind: nothing. */
const AFTER_SKIP = { verdict: "unchecked" as const, answer: undefined, reveal: undefined };

describe("skipping an optional task leaves no trace", () => {
  it("does not settle the block", () => {
    expect(AFTER_SKIP.verdict).toBe("unchecked");
  });

  it("shows no celebration and no green success", () => {
    /* `celebrate` is the only mode that congratulates, and it needs `correct`.
       An unchecked optional block cannot reach it. */
    expect(footerMode(AFTER_SKIP.verdict, true, true)).toBe("check-optional");
    expect(footerMode(AFTER_SKIP.verdict, true, true)).not.toBe("celebrate");
  });

  it("is not counted as solved", () => {
    /* `solvedCount` in school-lesson.tsx filters on `verdict === "correct"`, so
       a skipped block is excluded twice over: by verdict, and by the
       required-only filter beside it. */
    const solved = (verdict: string) => verdict === "correct";
    expect(solved(AFTER_SKIP.verdict)).toBe(false);
  });

  it("produces no evidence of any kind", () => {
    /* Independent evidence, assisted evidence and an attempt are all recorded
       from a submission. `advance()` calls neither `check` nor `onSubmit`, so a
       skipped block never enters the ledger at all — there is no verdict to
       grade, no episode to open and no attempt to count. */
    const submitted = AFTER_SKIP.answer !== undefined;
    expect(submitted, "skip must not submit an answer").toBe(false);
    expect(AFTER_SKIP.reveal, "skip must not reveal the answer").toBeUndefined();
  });

  it("keeps the learner able to come back to it", () => {
    /* Skip moves forward; `canPrev` is `page > 0`, so the block is still there.
       The projection keeps it too — this is the assertion that fails if someone
       ever "fixes" optionality by filtering bank tasks out of the route, which
       would make them unreachable rather than optional. */
    let reachable = 0;
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          if (!lesson.blocks.some((b) => b.bank)) continue;
          for (const track of TRACKS) {
            const pub = publicLesson(lesson as Lesson, track).blocks;
            reachable += pub.filter((b) => (b as { optional?: true }).optional === true).length;
          }
        }
      }
    }
    expect(reachable, "optional tasks are not on any route — deleted, not optional").toBeGreaterThan(20);
  });
});

describe("the learner is told what the Skip is for", () => {
  it("names the control in both languages, and does not say 'bank'", () => {
    for (const lang of ["kk", "ru"] as const) {
      expect(L.skipOptional[lang].length, `skipOptional.${lang}`).toBeGreaterThan(3);
      expect(L.optionalNote[lang].length, `optionalNote.${lang}`).toBeGreaterThan(30);
      /* The curriculum's internal word for this is "bank". A learner is told
         the task is extra practice they may skip, which is what it means to
         them; the classification is ours. */
      expect(L.optionalNote[lang].toLowerCase()).not.toContain("bank");
      expect(L.skipOptional[lang].toLowerCase()).not.toContain("bank");
    }
  });

  it("keeps Check available on an optional task", () => {
    /* Optional means the choice exists, not that the task is withdrawn. A
       learner who wants the practice must still be able to take it, so the
       mode is check-optional — Check AND Skip — rather than plain advance. */
    expect(footerMode("unchecked", true, true)).toBe("check-optional");
  });

  it("offers no Skip on a required task", () => {
    expect(footerMode("unchecked", true, false)).toBe("check");
  });

  it("offers no Skip on a block that is not a task at all", () => {
    /* A concept card already advances; giving it a Skip would imply there was
       something to decline. */
    expect(footerMode("unchecked", false, true)).toBe("advance");
    expect(footerMode("unchecked", false, false)).toBe("advance");
  });
});
