import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { leagueForLearner } from "@schools/leagues/queries";
import {
  FIRST_TIER,
  LAST_TIER,
} from "@schools/leagues/tiers";
import {
  MIN_GROUP_FOR_MOVEMENT,
  movementFor,
  rankGroup,
  settleGroup,
  zonesFor,
} from "@schools/leagues/standings";

/**
 * What the pilot's own group actually does.
 *
 * `TARGET_GROUP_SIZE` is 30 and the pilot is one class of eighteen, so the
 * shape that will really run in September is a permanently underfilled group.
 * `standings.test.ts` covers eighteen at tier 5; it does not cover eighteen at
 * tier ONE, which is where every learner in the pilot starts and is therefore
 * the only shape that exists in the pilot's first week.
 *
 * It also pins the observation that prompted this file: a live read returned
 * `{ promoteThrough: 0, relegateFrom: 1 }`, which looks like "the whole group
 * relegates from rank 1". It is the EMPTY group — the learner had earned
 * nothing yet — and `relegateFrom = size + 1` at `size = 0` is 1. Nobody is
 * relegated because there is nobody. The tests below assert that in the two
 * places it could go wrong: the arithmetic, and the payload the browser gets.
 */

const shape = (n: number, tier: number) => {
  const z = zonesFor(n, tier);
  const promote = z.promoteThrough;
  const relegate = z.relegateFrom > n ? 0 : n - z.relegateFrom + 1;
  return { promote, stay: n - promote - relegate, relegate };
};

const g = (...xp: number[]) =>
  xp.map((weeklyXp, i) => ({ subjectId: `s${String(i).padStart(3, "0")}`, weeklyXp }));

describe("a class of eighteen, at the tier the pilot starts on", () => {
  it("promotes four, keeps fourteen, and relegates NOBODY at tier 1", () => {
    /* Tier 1 has no rung below it, so the whole class's first week can only go
       up or stay. This is the shape eighteen children will actually meet. */
    expect(shape(18, FIRST_TIER)).toEqual({ promote: 4, stay: 14, relegate: 0 });
  });

  it("becomes 4 up / 10 stay / 4 down once anybody has climbed off tier 1", () => {
    expect(shape(18, 2)).toEqual({ promote: 4, stay: 10, relegate: 4 });
  });

  it("moves about a fifth at each end — not a third, and not two people", () => {
    /* The ratio is what makes an underfilled group fair. A fixed "top 6" would
       promote a third of a class of eighteen every week. */
    const { promote, relegate } = shape(18, 5);
    expect(promote / 18).toBeGreaterThan(0.15);
    expect(promote / 18).toBeLessThan(0.3);
    expect(relegate).toBe(promote);
  });

  it("relegates nobody from the bottom of the ladder and promotes nobody off the top", () => {
    const bottom = settleGroup(g(...Array.from({ length: 18 }, (_, i) => 100 - i)), FIRST_TIER);
    expect(bottom.filter((x) => x.movement === "relegated")).toHaveLength(0);

    const top = settleGroup(g(...Array.from({ length: 18 }, (_, i) => 100 - i)), LAST_TIER);
    expect(top.filter((x) => x.movement === "promoted")).toHaveLength(0);
  });
});

describe("a group too small to rank", () => {
  it("moves nobody below four, at any tier", () => {
    for (let n = 0; n < MIN_GROUP_FOR_MOVEMENT; n += 1) {
      for (let tier = FIRST_TIER; tier <= LAST_TIER; tier += 1) {
        expect(shape(n, tier), `n=${n} tier=${tier}`).toEqual({
          promote: 0,
          stay: n,
          relegate: 0,
        });
      }
    }
  });

  it("tells a solo learner they are staying, never that they are going down", () => {
    /* The reported worry: one member, told they were relegated from a group of
       one. `movementFor` is the function a row's badge comes from. */
    for (let tier = FIRST_TIER; tier <= LAST_TIER; tier += 1) {
      const [only] = rankGroup(g(50));
      expect(movementFor(only, zonesFor(1, tier), tier), `tier=${tier}`).toBe("stayed");
    }
  });

  it("means nobody, not everybody, when the group is empty", () => {
    /* `relegateFrom` is «ranks relegateFrom..size go down». At size 0 that is
       `1..0`, which is the empty range — the value looks alarming and is the
       correct encoding of "no movement". Asserted so a well-meaning change to
       `size + 1` cannot quietly turn rank 1 into a relegation. */
    const z = zonesFor(0, 5);
    expect(z).toEqual({ promoteThrough: 0, relegateFrom: 1 });
    expect(z.relegateFrom).toBeGreaterThan(0);
  });
});

describe("the zone shape agrees with the movement every learner is given", () => {
  it("at every size from 0 to 34 and every tier", () => {
    /* The zones are what the BOARD draws its rules from and `movementFor` is
       what each ROW's badge comes from. If they ever disagree, a learner reads
       a line above their own name saying the opposite of the arrow beside it. */
    for (let n = 0; n <= 34; n += 1) {
      const members = g(...Array.from({ length: n }, (_, i) => 1000 - i));
      for (let tier = FIRST_TIER; tier <= LAST_TIER; tier += 1) {
        const zones = zonesFor(n, tier);
        const ranked = rankGroup(members);
        const moved = ranked.map((s) => movementFor(s, zones, tier));

        const promoted = moved.filter((m) => m === "promoted").length;
        const relegated = moved.filter((m) => m === "relegated").length;
        const expected = shape(n, tier);

        expect(promoted, `promote n=${n} tier=${tier}`).toBe(expected.promote);
        expect(relegated, `relegate n=${n} tier=${tier}`).toBe(expected.relegate);
        /* Somebody always stays, at every size that moves anyone at all. */
        if (n >= MIN_GROUP_FOR_MOVEMENT) {
          expect(n - promoted - relegated, `stay n=${n} tier=${tier}`).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});

/* -------------------------------------------------------------------------- */

const SCHOOL = "innovation-tech";
const CLASS = "grade-9a";
const WEEK = "2026-W37";
const NOW = new Date("2026-09-09T12:00:00Z");
const subj = (n: number) => `${String(n).padStart(8, "0")}-0000-4000-8000-00000000000a`;

let sql: PgliteExecutor;

describe("what the browser is actually handed", () => {
  beforeAll(async () => {
    sql = await PgliteExecutor.open("memory://");
    await migrate(sql, { applyLocalBootstrap: true });
  }, 60_000);

  afterAll(async () => {
    await sql?.close();
  });

  it("hands a learner who has not competed an empty board and no relegation", async () => {
    /* This is the exact payload the reported `{ promoteThrough: 0,
       relegateFrom: 1 }` came from. The learner is not in the competition yet,
       so there is no row for the page to mark, and `NotStarted` renders instead
       of a board with one 0 XP line on it. */
    const quiet = subj(1);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
      [quiet],
    );

    const view = await leagueForLearner(sql, quiet, NOW);
    expect(view.you).toBeNull();
    expect(view.rows).toEqual([]);
    expect(view.groupSize).toBe(0);
    expect(view.zones).toEqual({ promoteThrough: 0, relegateFrom: 1 });
    /* And nothing in the payload says anybody is going down. */
    expect(view.rows.filter((r) => r.zone === "relegated")).toHaveLength(0);
  });

  it("tells the first learner of the week they are staying, not falling", async () => {
    /* One member, a real membership row, tier 1. The board has one line on it
       and that line must not read «продолжит в лиге ниже». */
    const alone = subj(2);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
      [alone],
    );
    await sql.tx((t) =>
      awardXp(
        t,
        { subjectId: alone, weekId: WEEK, schoolId: SCHOOL, classId: CLASS },
        [{ achievement: "block_solved", entityId: "b.1", amount: 10 }],
      ),
    );

    const view = await leagueForLearner(sql, alone, NOW);
    expect(view.groupSize).toBe(1);
    expect(view.you?.rank).toBe(1);
    expect(view.you?.zone).toBe("stayed");
    expect(view.rows.map((r) => r.zone)).toEqual(["stayed"]);
    /* `relegateFrom` is past the end of the board, so the relegation rule the
       list draws between rows can never appear. */
    expect(view.zones.relegateFrom).toBeGreaterThan(view.groupSize);
  });

  it("gives a full class of eighteen four promotions and no relegations at tier 1", async () => {
    for (let i = 10; i < 28; i += 1) {
      const id = subj(i);
      await sql.query(
        `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
        [id],
      );
      await sql.tx((t) =>
        awardXp(
          t,
          { subjectId: id, weekId: WEEK, schoolId: SCHOOL, classId: `${CLASS}-full` },
          [{ achievement: "block_solved", entityId: `blk.${i}`, amount: 100 - i }],
        ),
      );
    }

    const view = await leagueForLearner(sql, subj(10), NOW);
    expect(view.groupSize).toBe(18);
    expect(view.tier).toBe(FIRST_TIER);
    expect(view.rows.filter((r) => r.zone === "promoted")).toHaveLength(4);
    expect(view.rows.filter((r) => r.zone === "relegated")).toHaveLength(0);
    expect(view.rows.filter((r) => r.zone === "stayed")).toHaveLength(14);
    /* Exactly one row is the reader's, and it is marked for assistive tech via
       `aria-current` on the strength of this flag. */
    expect(view.rows.filter((r) => r.isYou)).toHaveLength(1);
  }, 60_000);
});
