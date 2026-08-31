import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { isContestLesson } from "@schools/curriculum/inventory";
import { publicLesson } from "@schools/curriculum/public";
import { isPublicAttemptBlock } from "@schools/learning/checking";
import { footerMode } from "@/components/brilliant/lesson/lesson-verdict";
import {
  LESSON_COMPLETION_POLICY,
  evaluateCompletion,
  policyBlocksFromPublic,
} from "@schools/policies/completion";
import type { TrackLevel } from "@schools/curriculum/types";

/**
 * The month that teaches not getting stuck, and enforced getting stuck.
 *
 * `m9.c1`–`m9.c4` are May's four 45-minute practice contests, five problems
 * each. Their own declared objectives are «Бір есепке тұрып қалмау» and
 * «Тұрып қалған есепті уақытында тастау» — do not get stuck on one problem,
 * drop a stuck problem in time.
 *
 * A wrong answer on a required attempt block put `footerMode` into `retry`,
 * which renders Try again and Get help and nothing else, and the top bar's
 * forward arrow is hardcoded off. So a learner who could not solve problem two
 * of five could not reach three, four or five. The product taught the opposite
 * of the lesson and then enforced it.
 *
 * The fix is NOT a waiver, and most of this file is about that distinction. The
 * problems stay required; `requirementFor` still demands `attempted`; skipping
 * one leaves it outstanding and the Finish button bounces the learner back to
 * it. What changed is that there is a way to come back.
 */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];

const contests = MONTHS.flatMap((month) =>
  month.units.flatMap((unit) => unit.lessons.filter((l) => isContestLesson(l.id))),
);

describe("the contests this is about actually exist", () => {
  it("finds May's four", () => {
    /* Guards the guard: a rename would otherwise make every assertion below
       vacuous, and the regex lives in one place precisely so it can move. */
    expect(contests.map((l) => l.id).sort()).toEqual(["m9.c1", "m9.c2", "m9.c3", "m9.c4"]);
  });

  it("and they are required work, not a bank", () => {
    /* The fix must not have quietly reclassified them. `roleOf` reads `bank`
       BEFORE position, so marking one optional would move it out of `contest`
       and shift every RoleCounts number the teacher console reports. */
    for (const lesson of contests) {
      for (const block of lesson.blocks) {
        expect(block.bank ?? false, `${block.id} must not be bank`).toBe(false);
      }
    }
  });
});

describe("a wrong answer leaves a way onward", () => {
  it("offers a contest problem a come-back-later control", () => {
    expect(footerMode("wrong", true, false, true)).toBe("retry-contest");
    expect(footerMode("partial", true, false, true)).toBe("retry-contest");
    expect(footerMode("unchecked", true, false, true)).toBe("check-contest");
  });

  it("changes nothing for an ordinary required task", () => {
    /* The parameter defaults to false, and every existing three-argument call
       site keeps its old answer. A required September task that a learner gets
       wrong still says Try again, because there is nowhere else to be. */
    expect(footerMode("wrong", true, false)).toBe("retry");
    expect(footerMode("unchecked", true, false)).toBe("check");
    expect(footerMode("wrong", true)).toBe("retry");
  });

  it("changes nothing for an optional task", () => {
    expect(footerMode("wrong", true, true, true)).toBe("retry-optional");
    expect(footerMode("unchecked", true, true, true)).toBe("check-optional");
  });

  it("still celebrates a correct answer, in a contest like anywhere else", () => {
    expect(footerMode("correct", true, false, true)).toBe("celebrate");
  });
});

describe("deferring a problem is not completing it", () => {
  /**
   * The property that makes this a deferral rather than a waiver.
   *
   * If skipping satisfied the policy, the come-back-later button would be a
   * way to finish a contest having answered nothing — which is what marking
   * the blocks optional would have done, and why that was the wrong fix.
   */
  it("leaves a skipped problem outstanding, on every route", () => {
    for (const lesson of contests) {
      for (const track of TRACKS) {
        const projected = publicLesson(lesson, track);
        const attempts = projected.blocks.filter(isPublicAttemptBlock);
        expect(attempts.length, `${lesson.id}/${track}`).toBeGreaterThan(1);

        /* Everything answered except the first. */
        const skipped = attempts[0];
        const answered = new Set(attempts.slice(1).map((b) => b.id));

        const decision = evaluateCompletion({
          policy: LESSON_COMPLETION_POLICY,
          blocks: policyBlocksFromPublic(projected.blocks),
          /* `measured` is what a WRONG answer reaches — `levelFromVerdict`
             maps both correct and wrong there. Deferring is the only thing
             this learner has not done. */
          reached: (id) => (answered.has(id) ? "measured" : "none"),
        });

        expect(decision.satisfied, `${lesson.id}/${track} must not complete`).toBe(false);
        expect(
          decision.outstanding.map((o) => o.blockId),
          `${lesson.id}/${track} must name the deferred problem`,
        ).toContain(skipped.id);
      }
    }
  });

  it("completes once every problem has been ATTEMPTED, right or wrong", () => {
    /* The other half. The shipped policies ask for `attempted`, never `passed`
       — a learner who tries all five and gets all five wrong has done the work
       a contest is for, and locking them out of the month would punish exactly
       the learner the contests are written for. */
    for (const lesson of contests) {
      for (const track of TRACKS) {
        const projected = publicLesson(lesson, track);
        const attempts = projected.blocks.filter(isPublicAttemptBlock);
        const decision = evaluateCompletion({
          policy: LESSON_COMPLETION_POLICY,
          blocks: policyBlocksFromPublic(projected.blocks),
          reached: () => "measured",
        });
        expect(decision.satisfied, `${lesson.id}/${track}`).toBe(true);
      }
    }
  });
});
