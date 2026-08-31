import { describe, it, expect } from "vitest";
import { PROGRAM } from "@schools/curriculum/program";
import { monthCompletables } from "@schools/curriculum/inventory";
import {
  FIRST_MONTH_INDEX,
  isMonthComplete,
  isMonthUnlocked,
  remainingIn,
  unlockStateFor,
} from "@schools/policies/unlock";

/**
 * The self-paced unlock policy.
 *
 * All nine months are PUBLISHED. That is a property of the deployment. Which
 * months a given learner may ENTER is a property of the learner, and it is what
 * this decides — see the module header for why conflating the two is the defect
 * the previous release shipped.
 */

const MONTHS = PROGRAM.months;
const ids = (monthIndex: number) =>
  monthCompletables(MONTHS.find((m) => m.index === monthIndex)!).map((c) => c.id);

/** Everything finished up to and including `through`. */
const doneThrough = (through: number) =>
  new Set(MONTHS.filter((m) => m.index <= through).flatMap((m) => ids(m.index)));

describe("September is open to everybody", () => {
  it("is unlocked on a learner with no record at all", () => {
    expect(isMonthUnlocked(FIRST_MONTH_INDEX, MONTHS, new Set())).toBe(true);
  });

  it("and it is the only one", () => {
    const state = unlockStateFor(MONTHS, new Set());
    expect(state.unlockedThrough).toBe(1);
    expect(state.months.filter((m) => m.unlocked).map((m) => m.index)).toEqual([1]);
  });
});

describe("a month opens when the one before it is finished", () => {
  it("October stays shut until September's last completable is done", () => {
    const septemberIds = ids(1);
    expect(septemberIds.length).toBeGreaterThan(1);

    /* Everything but the last one. */
    const almost = new Set(septemberIds.slice(0, -1));
    expect(isMonthUnlocked(2, MONTHS, almost)).toBe(false);
    expect(remainingIn(MONTHS[0], almost)).toEqual([septemberIds.at(-1)]);

    const all = new Set(septemberIds);
    expect(isMonthComplete(MONTHS[0], all)).toBe(true);
    expect(isMonthUnlocked(2, MONTHS, all)).toBe(true);
  });

  /**
   * The monthly check is part of the month.
   *
   * `programmeToLearningPath` learned this the expensive way — a learner who
   * had finished all 72 lessons and none of the nine checks was shown 100%.
   * The gate uses the same set, so finishing every lesson is not finishing the
   * month.
   */
  it("finishing every LESSON but not the check does not open the next month", () => {
    const september = MONTHS[0];
    const lessonsOnly = new Set(
      monthCompletables(september).filter((c) => c.kind === "lesson").map((c) => c.id),
    );
    const check = monthCompletables(september).find((c) => c.kind === "assessment");
    expect(check, "September has a monthly check").toBeTruthy();

    expect(isMonthComplete(september, lessonsOnly)).toBe(false);
    expect(isMonthUnlocked(2, MONTHS, lessonsOnly)).toBe(false);
    expect(remainingIn(september, lessonsOnly)).toEqual([check!.id]);
  });
});

describe("progress is sequential, not a set of independent doors", () => {
  it("finishing September and November does not open December", () => {
    const skipped = new Set([...ids(1), ...ids(3)]);
    const state = unlockStateFor(MONTHS, skipped);
    expect(state.unlockedThrough, "October is the frontier").toBe(2);
    expect(isMonthUnlocked(4, MONTHS, skipped)).toBe(false);
  });

  it("walks the whole year one month at a time", () => {
    for (let through = 1; through <= 8; through += 1) {
      const completed = doneThrough(through);
      const state = unlockStateFor(MONTHS, completed);
      expect(state.unlockedThrough, `finished through month ${through}`).toBe(through + 1);
      expect(isMonthUnlocked(through + 1, MONTHS, completed)).toBe(true);
      if (through + 2 <= 9) {
        expect(isMonthUnlocked(through + 2, MONTHS, completed)).toBe(false);
      }
    }
  });

  it("opens May once April is done, and nothing beyond it exists", () => {
    const completed = doneThrough(8);
    expect(isMonthUnlocked(9, MONTHS, completed)).toBe(true);
    const state = unlockStateFor(MONTHS, doneThrough(9));
    expect(state.unlockedThrough).toBe(9);
    expect(state.months.every((m) => m.complete)).toBe(true);
  });
});

describe("what is NOT allowed to gate a learner", () => {
  /**
   * Optional and bank tasks are blocks inside a completable, never completables
   * themselves, so this policy is structurally incapable of requiring them. The
   * exclusion lives once, in `schools/policies/completion.ts`.
   */
  it("a month's requirements are only its lessons and its check", () => {
    for (const month of MONTHS) {
      const kinds = new Set(monthCompletables(month).map((c) => c.kind));
      expect([...kinds].sort(), `month ${month.index}`).toEqual(["assessment", "lesson"]);
    }
  });

  it("no completable is a draft or an empty shell", () => {
    for (const month of MONTHS) {
      for (const c of monthCompletables(month)) {
        expect(c.status, `${c.id}`).not.toBe("draft");
        expect(c.blockCount, `${c.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("every month in the shipped programme has something to finish", () => {
    /* If this ever fails, `isMonthComplete` returns true for an empty month and
       the year opens at once. That is the documented, deliberately-recoverable
       direction — but it should never actually happen, and this is what says so. */
    for (const month of MONTHS) {
      expect(monthCompletables(month).length, `month ${month.index}`).toBeGreaterThan(0);
    }
  });
});
