import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { blocksForTrack, publicLesson } from "@schools/curriculum/public";
import { isPublicAttemptBlock } from "@schools/learning/checking";
import { footerMode } from "@/components/brilliant/lesson/lesson-verdict";
import {
  LESSON_COMPLETION_POLICY,
  evaluateCompletion,
  policyBlocksFromAuthored,
  policyBlocksFromPublic,
} from "@schools/policies/completion";
import type { Lesson, Month, TrackLevel } from "@schools/curriculum/types";

/**
 * Every month, every route, walked the way a learner walks it.
 *
 * `optional-tasks-are-skippable.test.ts` covers the lessons that contain a bank
 * task, which is where the defect was. This is the whole year: nine months,
 * three routes, every lesson and every monthly check, under both of the two
 * learners the bank field creates.
 *
 *   MINIMAL   does every required task and declines every optional one
 *   MAXIMAL   does everything, required and optional alike
 *
 * Both must reach the end of every lesson. The minimal learner is the one the
 * bank exists for and the one the interface used to trap; the maximal learner
 * is the check that nothing was fixed by making optional work unreachable.
 *
 * The walk uses the real projection, the real attempt predicate, the real
 * footer mode and the real completion policy — not `requirementFor` alone,
 * which was right the whole time the product was wrong.
 */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];

interface Walk {
  reachedEnd: boolean;
  stuckAt: string | null;
  completes: boolean;
  pages: number;
  required: number;
  optional: number;
}

/** Project a bag of authored blocks the way the lesson page projects a lesson. */
function project(id: string, blocks: Lesson["blocks"], track: TrackLevel) {
  const shell: Lesson = {
    id,
    title: { kk: "", ru: "" },
    estimatedMinutes: 0,
    objectives: [],
    skillRefs: [],
    blocks: [...blocks],
    sourceType: "product-authored",
    status: "implemented",
  };
  return publicLesson(shell, track).blocks;
}

function walkLesson(id: string, blocks: Lesson["blocks"], track: TrackLevel, mode: "minimal" | "maximal"): Walk {
  const pub = project(id, blocks, track);

  let required = 0;
  let optional = 0;
  const verdict = new Map<string, "unchecked" | "correct">();
  for (const b of pub) {
    if (!isPublicAttemptBlock(b)) continue;
    const isOptional = (b as { optional?: true }).optional === true;
    if (isOptional) optional += 1;
    else required += 1;
    const done = mode === "maximal" || !isOptional;
    verdict.set(b.id, done ? "correct" : "unchecked");
  }

  for (const b of pub) {
    const attempt = isPublicAttemptBlock(b);
    const isOptional = (b as { optional?: true }).optional === true;
    const v = verdict.get(b.id) ?? "unchecked";
    const m = footerMode(v, attempt, isOptional);
    /* The modes that put a forward control on screen. `check` does not: its one
       button submits an answer this learner has declined to give. */
    if (m !== "advance" && m !== "celebrate" && m !== "check-optional") {
      return { reachedEnd: false, stuckAt: b.id, completes: false, pages: pub.length, required, optional };
    }
  }

  const decision = evaluateCompletion({
    policy: LESSON_COMPLETION_POLICY,
    blocks: policyBlocksFromPublic(pub),
    reached: (id) => (verdict.get(id) === "correct" ? "passed" : "none"),
  });
  return { reachedEnd: true, stuckAt: null, completes: decision.satisfied, pages: pub.length, required, optional };
}

interface Unit {
  id: string;
  blocks: Lesson["blocks"];
  isAssessment: boolean;
}

function unitsOf(month: Month): Unit[] {
  const out: Unit[] = [];
  for (const u of month.units) {
    for (const l of u.lessons) out.push({ id: l.id, blocks: l.blocks, isAssessment: false });
  }
  if (month.assessment?.blocks.length) {
    out.push({ id: month.assessment.id, blocks: month.assessment.blocks, isAssessment: true });
  }
  return out;
}

const ALL_UNITS = MONTHS.flatMap(unitsOf);

describe("every lesson and every check is traversable on every route", () => {
  it("has a year to walk", () => {
    expect(ALL_UNITS.length).toBeGreaterThan(70);
    expect(MONTHS.filter((m) => m.units.some((u) => u.lessons.some((l) => l.blocks.length))).length).toBe(9);
  });

  for (const mode of ["minimal", "maximal"] as const) {
    describe(`the ${mode} learner`, () => {
      for (const track of TRACKS) {
        it(`${track} — reaches the end of all ${ALL_UNITS.length} lessons and checks`, () => {
          const stuck: string[] = [];
          const incomplete: string[] = [];
          const empty: string[] = [];
          for (const u of ALL_UNITS) {
            const w = walkLesson(u.id, u.blocks, track, mode);
            if (!w.pages) {
              empty.push(u.id);
              continue;
            }
            if (!w.reachedEnd) stuck.push(`${u.id} at ${w.stuckAt}`);
            else if (!w.completes) incomplete.push(u.id);
          }
          expect(empty, `lessons with no blocks on the ${track} route — a learner would find them blank`).toEqual([]);
          expect(stuck, `dead ends on the ${track} route for the ${mode} learner`).toEqual([]);
          expect(incomplete, `reachable but never completable on the ${track} route`).toEqual([]);
        });
      }
    });
  }

  it("the minimal learner really does skip something", () => {
    /* Without this the two learners could be identical and the whole file would
       pass vacuously. */
    let skipped = 0;
    for (const u of ALL_UNITS) {
      for (const track of TRACKS) skipped += walkLesson(u.id, u.blocks, track, "minimal").optional;
    }
    expect(skipped, "no optional task is reachable on any route — the bank is unreachable, not optional").toBeGreaterThan(20);
  });

  it("the server would accept the same completions the browser offers", () => {
    /* The browser decides whether to show Finish; the server decides whether to
       record it. A learner told they are done and then refused is the worst
       outcome available, so the two adapters are compared over the whole year
       rather than over the lessons that happen to have a bank. */
    for (const track of TRACKS) {
      for (const u of ALL_UNITS) {
        const routed = blocksForTrack(u.blocks, track);
        if (!routed.length) continue;
        const server = policyBlocksFromAuthored(routed);
        const browser = policyBlocksFromPublic(project(u.id, u.blocks, track));
        expect(
          browser.map((b) => `${b.id}:${b.optional}:${b.isAttempt}`),
          `${u.id} [${track}] — the server and the browser disagree`,
        ).toEqual(server.map((b) => `${b.id}:${b.optional}:${b.isAttempt}`));
      }
    }
  });
});
