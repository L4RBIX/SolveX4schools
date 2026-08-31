import { describe, it, expect } from "vitest";
import {
  MIN_GROUP_FOR_MOVEMENT,
  rankGroup,
  settleGroup,
  tierAfter,
  zonesFor,
} from "@schools/leagues/standings";

/**
 * The promotion rules, at every size the brief names and at the sizes that
 * actually break things.
 *
 * Pure functions, so no fixture and no database. That is the point of keeping
 * them pure: the cases that matter most are groups of one and of four, and
 * those are the sizes a seeded class makes awkward to produce.
 */

const g = (...xp: number[]) =>
  xp.map((weeklyXp, i) => ({ subjectId: `s${String(i).padStart(3, "0")}`, weeklyXp }));

describe("competition ranking", () => {
  it("shares a rank on equal XP and skips the ones consumed by the tie", () => {
    const r = rankGroup(g(100, 80, 80, 50));
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 4]);
  });

  it("is not dense — a learner is never ranked above the count of people ahead", () => {
    const r = rankGroup(g(10, 10, 10, 5));
    expect(r.map((x) => x.rank)).toEqual([1, 1, 1, 4]);
  });

  it("orders by XP alone, never by anything that would reward speed or volume", () => {
    const r = rankGroup(g(1, 999, 500));
    expect(r.map((x) => x.weeklyXp)).toEqual([999, 500, 1]);
  });

  it("is stable for equal XP, so a retried settlement produces identical rows", () => {
    const once = rankGroup(g(50, 50, 50)).map((x) => x.subjectId);
    const again = rankGroup([...g(50, 50, 50)].reverse()).map((x) => x.subjectId);
    expect(once).toEqual(again);
  });
});

describe("zone sizes at every group size the brief asks about", () => {
  const t = 5; // mid-ladder: both ends active
  const shape = (n: number) => {
    const z = zonesFor(n, t);
    const promote = z.promoteThrough;
    const relegate = z.relegateFrom > n ? 0 : n - z.relegateFrom + 1;
    return { promote, stay: n - promote - relegate, relegate };
  };

  it("30 learners → 6 up, 18 stay, 6 down", () => {
    expect(shape(30)).toEqual({ promote: 6, stay: 18, relegate: 6 });
  });

  it("18 learners (the pilot class) → 4 up, 10 stay, 4 down", () => {
    expect(shape(18)).toEqual({ promote: 4, stay: 10, relegate: 4 });
  });

  it("10 learners → 2 up, 6 stay, 2 down", () => {
    expect(shape(10)).toEqual({ promote: 2, stay: 6, relegate: 2 });
  });

  it("4 learners → 1 up, 2 stay, 1 down: the smallest size where the shape exists", () => {
    expect(shape(4)).toEqual({ promote: 1, stay: 2, relegate: 1 });
  });

  it("3 learners → nobody moves", () => {
    expect(shape(3)).toEqual({ promote: 0, stay: 3, relegate: 0 });
  });

  it("1 learner → nobody moves, so a solo learner cannot walk up the ladder", () => {
    expect(shape(1)).toEqual({ promote: 0, stay: 1, relegate: 0 });
  });

  it("always leaves at least one learner in the middle", () => {
    for (let n = MIN_GROUP_FOR_MOVEMENT; n <= 40; n += 1) {
      expect(shape(n).stay, `n=${n}`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("the ends of the ladder", () => {
  it("never relegates out of tier 1", () => {
    expect(settleGroup(g(90, 60, 30, 1), 1).map((x) => x.movement)).toEqual([
      "promoted", "stayed", "stayed", "stayed",
    ]);
  });

  it("never promotes out of tier 10", () => {
    expect(settleGroup(g(90, 60, 30, 1), 10).map((x) => x.movement)).toEqual([
      "stayed", "stayed", "stayed", "relegated",
    ]);
  });

  it("clamps the tier a settlement can write", () => {
    expect(tierAfter(10, "promoted")).toBe(10);
    expect(tierAfter(1, "relegated")).toBe(1);
  });
});

describe("ties on a boundary resolve in the learner's favour", () => {
  it("promotes everyone tied across the promotion line", () => {
    /* 10 learners at tier 5 promote 2. Ranks 1,2,2 — three learners tied into
       and across the cutoff. All three go up: the board told them equal XP is
       equal rank, and splitting them would contradict it on the strength of a uuid. */
    const r = settleGroup(g(100, 90, 90, 50, 40, 30, 20, 10, 5, 1), 5);
    expect(r.slice(0, 3).map((x) => x.movement)).toEqual(["promoted", "promoted", "promoted"]);
  });

  it("keeps everyone tied across the relegation line, because relegation is the harsher answer", () => {
    /* 10 learners, relegate 2 → ranks 9 and 10. Here ranks 8,8,8 straddle it,
       so nobody on that shared rank goes down. */
    const r = settleGroup(g(100, 90, 80, 70, 60, 50, 40, 5, 5, 5), 5);
    expect(r.slice(7).map((x) => x.movement)).toEqual(["stayed", "stayed", "stayed"]);
  });
});

describe("small-group degeneration", () => {
  it("a 2-person group moves nobody, so one point then vanishing is not a promotion", () => {
    const r = settleGroup(g(1, 0), 5);
    expect(r.map((x) => x.movement)).toEqual(["stayed", "stayed"]);
  });

  it("settling the same group twice gives byte-identical rows", () => {
    const members = g(70, 70, 40, 10, 5);
    expect(settleGroup(members, 4)).toEqual(settleGroup(members, 4));
  });
});
