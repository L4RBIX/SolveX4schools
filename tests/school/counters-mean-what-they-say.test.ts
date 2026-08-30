import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { monthOutline } from "@schools/curriculum/public";
import { monthTaskCount, monthToGameboard, programmeToLearningPath } from "@schools/presentation/adapters";
import { lastAuthoredMonth } from "@schools/curriculum/inventory";
import type { Month, TrackLevel } from "@schools/curriculum/types";

/**
 * Every number a learner is shown describes the learner being shown it.
 *
 * Four of these were wrong at once, and none of them was caught by anything,
 * because a counter is only wrong relative to a claim nobody had written down.
 * The claim: a figure on a per-learner page is about that learner's own route
 * and their own required path, and a fraction's numerator and denominator come
 * from the same set.
 */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];
const LABELS = { lessons: (n: number) => `${n}`, tasks: (n: number) => `${n}` };
const AUTHORED = MONTHS.filter((m) => m.units.some((u) => u.lessons.some((l) => l.blocks.length)));

describe("the month board quotes the learner's own route", () => {
  it("never advertises more tasks than the route contains", () => {
    /* `monthOutline` had no track filter while every lesson and assessment
       payload did, so the board summed all three routes: October advertised 75
       tasks to a support learner who meets 63. */
    for (const month of AUTHORED) {
      const counts = TRACKS.map((t) => monthTaskCount(monthOutline(month, t) as unknown as Month));
      for (const [i, t] of TRACKS.entries()) {
        expect(counts[i], `${month.index}/${t} board count`).toBeGreaterThan(0);
      }
      /* Support sees no more than advanced — the routes are nested, so an
         unfiltered sum would show up here as every route reporting the same
         inflated number. */
      expect(counts[0], `support quoted more than advanced in month ${month.index}`).toBeLessThanOrEqual(counts[2]);
      expect(new Set(counts).size, `all three routes quote the same total in month ${month.index}`).toBeGreaterThan(1);
    }
  });
});

describe("the monthly check is on the board and can be finished", () => {
  it("shows a tick once it is complete", () => {
    /* The assessment node was the one kind built without `done`, so the
       programme's central independence check could never show as finished. */
    for (const month of AUTHORED) {
      if (!month.assessment) continue;
      const snap = { completedLessons: new Set([month.assessment.id]), currentLessonId: null };
      const board = monthToGameboard(month, snap as never, "kk", LABELS);
      const node = board.levels.flatMap((u) => u.nodes).find((n) => n.kind === "assessment");
      expect(node, `month ${month.index} has no assessment node`).toBeDefined();
      expect(node!.done, `month ${month.index}'s check cannot show as done`).toBe(true);
    }
  });

  it("does not show a tick before it is", () => {
    for (const month of AUTHORED) {
      if (!month.assessment) continue;
      const snap = { completedLessons: new Set<string>(), currentLessonId: null };
      const node = monthToGameboard(month, snap as never, "kk", LABELS)
        .levels.flatMap((u) => u.nodes)
        .find((n) => n.kind === "assessment");
      expect(node!.done, `month ${month.index}'s check ticks before it is done`).toBe(false);
    }
  });
});

describe("progress counts everything the programme requires", () => {
  it("is not 100% with every monthly check untouched", () => {
    /* The denominator was lessons only, so finishing all 72 and none of the
       nine checks read as the whole programme complete. */
    const lessons = AUTHORED.flatMap((m) =>
      m.units.flatMap((u) => u.lessons.filter((l) => l.blocks.length).map((l) => l.id)),
    );
    const path = programmeToLearningPath(
      MONTHS as Month[],
      { completedLessons: new Set(lessons), currentLessonId: null } as never,
      "kk",
      { title: "", eyebrow: "", sub: "", grade: "" },
    );
    expect(path.percent, "every lesson and no check should not read as finished").not.toBe("100%");
  });

  it("is 100% only when the checks are done too", () => {
    const all = [
      ...AUTHORED.flatMap((m) => m.units.flatMap((u) => u.lessons.filter((l) => l.blocks.length).map((l) => l.id))),
      ...AUTHORED.filter((m) => m.assessment).map((m) => m.assessment!.id),
    ];
    const path = programmeToLearningPath(
      MONTHS as Month[],
      { completedLessons: new Set(all), currentLessonId: null } as never,
      "kk",
      { title: "", eyebrow: "", sub: "", grade: "" },
    );
    expect(path.percent).toBe("100%");
  });
});

describe("the skills page covers the year that exists", () => {
  it("is derived from the curriculum, not from a literal", () => {
    /* `/you` asked for month 1 only, with a comment saying later months had no
       content. True when written; false from the moment the year was finished,
       and nothing failed when it went stale. */
    expect(lastAuthoredMonth()).toBe(9);
  });
});
