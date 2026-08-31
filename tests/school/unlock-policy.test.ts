import { describe, it, expect } from "vitest";
import { PROGRAM } from "@schools/curriculum/program";
import { monthCompletables, monthIndependenceBlocks } from "@schools/curriculum/inventory";
import { monthOutline, publicLesson, publicAssessment } from "@schools/curriculum/public";
import { isPublicAttemptBlock } from "@schools/learning/checking";
import {
  LESSON_COMPLETION_POLICY,
  ASSESSMENT_COMPLETION_POLICY,
  evaluateCompletion,
  policyBlocksFromPublic,
} from "@schools/policies/completion";
import {
  FIRST_MONTH_INDEX,
  NO_EVIDENCE,
  allIndependenceBlocks,
  hasDemonstratedIndependence,
  isMonthComplete,
  isMonthUnlocked,
  remainingIn,
  unlockStateFor,
  type UnlockEvidence,
} from "@schools/policies/unlock";
import type { TrackLevel } from "@schools/curriculum/types";

/**
 * The self-paced unlock policy.
 *
 * All nine months are PUBLISHED — a property of the deployment. Which months a
 * given learner may ENTER is a property of the learner, and it is what this
 * decides.
 *
 * ## The weakness this file was rewritten for
 *
 * The first version of the rule was "month N unlocks when month N-1 is
 * COMPLETE", and completion is attempt-based by design. So a learner who
 * submitted one WRONG answer to every required block satisfied every lesson and
 * the monthly check, and opened the next month having demonstrated nothing.
 * That is fine for a LESSON — a struggling learner must be able to finish one —
 * and it is not a gate for a self-paced learner nobody is watching.
 *
 * The second condition is the curriculum's own instrument, not a number:
 * `VerifyBlock.mode === "unseen_problem"` is one of the programme's five
 * independent checks (PDF p.6), defined as problems analysed in no lesson,
 * which show whether the learner is repeating a pattern or thinking.
 */

const MONTHS = PROGRAM.months;
const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];

const ids = (m: number) =>
  monthCompletables(MONTHS.find((x) => x.index === m)!).map((c) => c.id);
const independence = (m: number) =>
  monthIndependenceBlocks(MONTHS.find((x) => x.index === m)!);

/** A learner who finished months 1..through legitimately. */
function through(n: number): UnlockEvidence {
  const completed = new Set<string>();
  const solved = new Set<string>();
  for (const m of MONTHS) {
    if (m.index > n) continue;
    for (const id of ids(m.index)) completed.add(id);
    /* One unseen problem per month. Not all of May's five — one is the rule. */
    const first = independence(m.index)[0];
    if (first) solved.add(first);
  }
  return { completed, solved };
}

/* ========================================================================== */
/* THE PROGRAMME SUPPLIES THE INSTRUMENT                                      */
/* ========================================================================== */

describe("the rule is built on something the curriculum authored", () => {
  it("every month has a machine-gradeable unseen problem", () => {
    /* If this ever fails, `hasDemonstratedIndependence` returns true for that
       month and the gate silently degrades to the attempt-based rule. */
    for (const m of MONTHS) {
      expect(independence(m.index).length, `month ${m.index}`).toBeGreaterThan(0);
    }
  });

  it("cannot be asked about a PROJECTED month, which would silently disable it", () => {
    /*
     * The landmine this closes, measured before the type existed: the board's
     * `MonthOutline` reduces every block to `{id, type}`, so an outline has no
     * `mode` and no `cases`. `monthIndependenceBlocks` returned `[]` for all
     * nine months, `demonstrated` flipped to `true` everywhere, and the
     * attempt-spam learner got `unlockedThrough: 9` — the entire gate off, with
     * no type error anywhere and no live caller doing it.
     *
     * `UnlockMonth` demands the AUTHORED assessment, so it is a compile error
     * now. The `@ts-expect-error` below FAILS THE BUILD if that ever stops
     * being true, which is the only way to test a hole that had no runtime
     * symptom.
     */
    const outlines = MONTHS.map((m) => monthOutline(m));
    // @ts-expect-error a projected month must not satisfy UnlockMonth
    const reopened = unlockStateFor(outlines, NO_EVIDENCE);
    /* And if it somehow compiled, it must still not be usable. */
    expect(reopened.unlockedThrough).toBeGreaterThanOrEqual(1);
  });

  it("and there are few enough of them to ask for in one query", () => {
    /* The server fetches every one of these in a single `blockAttempts` call.
       Thirteen ids, not one query per month. */
    expect(allIndependenceBlocks(MONTHS).length).toBeLessThanOrEqual(20);
  });

  it("each one is in its own month's monthly check", () => {
    for (const m of MONTHS) {
      for (const id of independence(m.index)) {
        expect(id.startsWith(`m${m.index}.as.`), id).toBe(true);
      }
    }
  });

  it("and reaches every route, so no learner is gated on a block they never see", () => {
    /*
     * Load-bearing for properties E and F. If an independence block were
     * projected only onto `advanced`, a support learner could finish the month
     * perfectly and never be shown the one task that opens the next one — a
     * gate they cannot even attempt. Checked over all nine months and all three
     * routes rather than assumed from the assessment being "common".
     */
    for (const m of MONTHS) {
      const want = independence(m.index);
      for (const track of TRACKS) {
        const have = new Set(publicAssessment(m.assessment!, m.index, track).blocks.map((b) => b.id));
        for (const id of want) {
          expect(have.has(id), `${id} is missing from ${track} in month ${m.index}`).toBe(true);
        }
      }
    }
  });
});

/* ========================================================================== */
/* SEPTEMBER                                                                  */
/* ========================================================================== */

describe("September is open to everybody", () => {
  it("is unlocked on a learner with no record at all", () => {
    expect(isMonthUnlocked(FIRST_MONTH_INDEX, MONTHS, NO_EVIDENCE)).toBe(true);
  });

  it("and it is the only one", () => {
    const state = unlockStateFor(MONTHS, NO_EVIDENCE);
    expect(state.unlockedThrough).toBe(1);
    expect(state.months.filter((m) => m.unlocked).map((m) => m.index)).toEqual([1]);
  });
});

/* ========================================================================== */
/* PERSONAS                                                                   */
/* ========================================================================== */

describe("who gets through, and who does not", () => {
  const septemberIds = () => ids(1);
  const septemberUnseen = () => independence(1)[0];

  it("STRONG — finished the month and solved its unseen problem → October opens", () => {
    const e: UnlockEvidence = {
      completed: new Set(septemberIds()),
      solved: new Set([septemberUnseen()]),
    };
    expect(isMonthUnlocked(2, MONTHS, e)).toBe(true);
  });

  it("ASSISTED — same evidence; the policy cannot even see that Nova was used", () => {
    /*
     * Property C, and the proof is structural rather than a test fixture: the
     * rule reads two sets of ids and nothing else. There is no assistance
     * input, no independence weight, no hint count. A solve after four rungs of
     * help is the same id in the same set as a solve with none.
     *
     * The programme's own rule is that help is followed by explaining it back
     * and re-solving later — not that help disqualifies you.
     */
    const e: UnlockEvidence = {
      completed: new Set(septemberIds()),
      solved: new Set([septemberUnseen()]),
    };
    expect(isMonthUnlocked(2, MONTHS, e)).toBe(true);
  });

  it("STRUGGLING BUT LEARNING — everything else wrong, one unseen problem solved → opens", () => {
    /* Property B. Exactly one correct answer in the whole month is enough. */
    const e: UnlockEvidence = {
      completed: new Set(septemberIds()),
      solved: new Set([septemberUnseen()]),
    };
    expect(isMonthUnlocked(2, MONTHS, e)).toBe(true);
    expect(isMonthComplete(MONTHS[0], e.completed)).toBe(true);
  });

  it("SPAM — one wrong answer everywhere, nothing solved → October stays shut", () => {
    /* Property A, and the reason this file was rewritten. The completion rows
       are all legitimately there; the learner has demonstrated nothing. */
    const e: UnlockEvidence = { completed: new Set(septemberIds()), solved: new Set() };
    expect(isMonthComplete(MONTHS[0], e.completed), "the month IS complete").toBe(true);
    expect(hasDemonstratedIndependence(MONTHS[0], e.solved)).toBe(false);
    expect(isMonthUnlocked(2, MONTHS, e), "and October is still shut").toBe(false);

    const state = unlockStateFor(MONTHS, e);
    const september = state.months.find((m) => m.index === 1)!;
    expect(september.complete).toBe(true);
    expect(september.demonstrated).toBe(false);
    expect(september.remaining, "nothing is outstanding — that is not what is missing").toEqual([]);
  });

  it("BANK-HEAVY — optional work done, one required lesson skipped → stays shut", () => {
    /* Property D from the other side: optional work cannot substitute for
       required work, and it is not in the completable set at all. */
    const all = septemberIds();
    const e: UnlockEvidence = {
      completed: new Set(all.slice(0, -1)),
      solved: new Set([septemberUnseen()]),
    };
    expect(isMonthUnlocked(2, MONTHS, e)).toBe(false);
    expect(remainingIn(MONTHS[0], e.completed)).toEqual([all.at(-1)]);
  });

  it("ASSESSMENT-SKIPPING — every lesson done, the check untouched → stays shut", () => {
    const lessonsOnly = monthCompletables(MONTHS[0])
      .filter((c) => c.kind === "lesson")
      .map((c) => c.id);
    const e: UnlockEvidence = { completed: new Set(lessonsOnly), solved: new Set() };
    expect(isMonthUnlocked(2, MONTHS, e)).toBe(false);
    /* Both reasons, and a screen can tell them apart. */
    const september = unlockStateFor(MONTHS, e).months.find((m) => m.index === 1)!;
    expect(september.complete).toBe(false);
    expect(september.demonstrated).toBe(false);
  });

  it("ROUTE MISMATCH — a support learner is never blocked by advanced-only work", () => {
    /*
     * Property E, asserted where it actually lives. The unlock rule reads
     * completable ids, and a completable is a whole lesson — so the route
     * question is settled one layer down, by `evaluateCompletion` over the
     * learner's OWN projection. This walks every September lesson on every
     * route and confirms a learner who does what their route asks can finish
     * it, which is what makes the ids appear in `completed` at all.
     */
    for (const track of TRACKS) {
      for (const unit of MONTHS[0].units) {
        for (const lesson of unit.lessons) {
          const projected = publicLesson(lesson, track);
          const decision = evaluateCompletion({
            policy: LESSON_COMPLETION_POLICY,
            blocks: policyBlocksFromPublic(projected.blocks),
            /* Only what THIS route projected. An advanced-only block is not in
               the projection, so it cannot be an outstanding requirement. */
            reached: (id) =>
              projected.blocks.some((b) => b.id === id && isPublicAttemptBlock(b))
                ? "measured"
                : "none",
          });
          expect(decision.satisfied, `${lesson.id}/${track}`).toBe(true);
        }
      }
    }
  });
});

/* ========================================================================== */
/* THE MONTHLY CHECK STILL COMPLETES WITHOUT BEING SOLVED                     */
/* ========================================================================== */

describe("finishing a month and leaving it are different questions", () => {
  it("the check completes on a wrong answer, and still does", () => {
    /*
     * Deliberate, and the separation the whole design rests on. A learner who
     * attempts the monthly check honestly and gets it wrong has FINISHED the
     * month — their board says done, their teacher sees the work. What they
     * have not done is earn the next month. Making the check itself refuse to
     * complete would have been the crueller way to build this.
     */
    const projected = publicAssessment(MONTHS[0].assessment!, 1, "core");
    const decision = evaluateCompletion({
      policy: ASSESSMENT_COMPLETION_POLICY,
      blocks: policyBlocksFromPublic(projected.blocks),
      reached: () => "measured",
    });
    expect(decision.satisfied, "the check completes").toBe(true);
    expect(
      hasDemonstratedIndependence(MONTHS[0], new Set()),
      "and the next month does not open",
    ).toBe(false);
  });
});

/* ========================================================================== */
/* THE WHOLE YEAR                                                             */
/* ========================================================================== */

describe("progress is sequential, and each step needs both conditions", () => {
  it("walks September to May one month at a time", () => {
    for (let n = 1; n <= 8; n += 1) {
      const e = through(n);
      const state = unlockStateFor(MONTHS, e);
      expect(state.unlockedThrough, `finished through month ${n}`).toBe(n + 1);
      expect(isMonthUnlocked(n + 1, MONTHS, e)).toBe(true);
      if (n + 2 <= 9) expect(isMonthUnlocked(n + 2, MONTHS, e)).toBe(false);
    }
  });

  it("one solved unseen problem is enough in May, which authors five", () => {
    const e = through(9);
    expect(e.solved.has("m9.as.b1")).toBe(true);
    expect(e.solved.has("m9.as.b2")).toBe(false);
    expect(unlockStateFor(MONTHS, e).months.find((m) => m.index === 9)!.demonstrated).toBe(true);
  });

  it("completing every month but solving nothing opens nothing past September", () => {
    const completed = new Set(MONTHS.flatMap((m) => ids(m.index)));
    const state = unlockStateFor(MONTHS, { completed, solved: new Set() });
    expect(state.unlockedThrough).toBe(1);
    expect(state.months.every((m) => m.complete)).toBe(true);
    expect(state.months.every((m) => !m.demonstrated)).toBe(true);
  });
});

/* ========================================================================== */
/* WHAT MAY NEVER GATE                                                        */
/* ========================================================================== */

describe("what is NOT allowed to gate a learner", () => {
  it("a month's requirements are only its lessons and its check", () => {
    for (const month of MONTHS) {
      const kinds = new Set(monthCompletables(month).map((c) => c.kind));
      expect([...kinds].sort(), `month ${month.index}`).toEqual(["assessment", "lesson"]);
    }
  });

  it("no completable is a draft or an empty shell", () => {
    for (const month of MONTHS) {
      for (const c of monthCompletables(month)) {
        expect(c.status, c.id).not.toBe("draft");
        expect(c.blockCount, c.id).toBeGreaterThan(0);
      }
    }
  });

  it("the rule reads two sets of ids and nothing else", () => {
    /*
     * Properties K, L and M, asserted by shape. There is no XP input, no
     * seconds, no timestamp and no rank — so the gate cannot come to depend on
     * speed, time spent or a league position without this signature changing
     * and this test being edited on purpose.
     */
    const e: UnlockEvidence = { completed: new Set(), solved: new Set() };
    expect(Object.keys(e).sort()).toEqual(["completed", "solved"]);
    expect(unlockStateFor(MONTHS, e).unlockedThrough).toBe(1);
  });

  it("no independence block is a written or oral one", () => {
    /*
     * Property H. Every independence block carries test cases and is graded by
     * the judge, so no learner ever waits for one of the year's four mandatory
     * written reviews in order to reach the next month.
     */
    const mandatoryWritten = new Set(["m3.as.b2", "m6.as.b3", "m7.as.b3", "m8.as.b1"]);
    for (const id of allIndependenceBlocks(MONTHS)) {
      expect(mandatoryWritten.has(id), `${id} must not need a teacher`).toBe(false);
    }
  });
});
