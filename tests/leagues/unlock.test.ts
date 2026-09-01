import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { LEAGUE_UNLOCK_XP, leagueUnlockFor, unlockFrom } from "@schools/leagues/unlock";
import { XP_AMOUNTS } from "@schools/leagues/xp-policy";

/**
 * The one-time unlock the home card is built on.
 *
 * §13: one canonical constant, computed from the EXISTING auditable ledger.
 * The failure this file guards is not an off-by-one — it is a second XP system
 * growing next to the first, which looks fine until a teacher is asked why the
 * home screen and the league page disagree about the same week.
 */

const SUBJECT = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER = "bbbbbbbb-0000-4000-8000-000000000002";
const SCHOOL = "innovation-tech";
const CLASS = "grade-9a";

let sql: PgliteExecutor;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  for (const id of [SUBJECT, OTHER]) {
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
      [id],
    );
  }
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

/** Credit `n` distinct blocks in `weekId`, each worth `block_solved`. */
async function solve(subjectId: string, weekId: string, blocks: string[]) {
  await sql.tx((t) =>
    awardXp(
      t,
      { subjectId, weekId, schoolId: SCHOOL, classId: CLASS },
      blocks.map((entityId) => ({
        achievement: "block_solved" as const,
        entityId,
        amount: XP_AMOUNTS.block_solved,
      })),
    ),
  );
}

describe("the threshold", () => {
  it("is 175, and nothing else may write that number", () => {
    /* The value is not arbitrary: `xp-policy.ts` works out an ordinary week at
       185 XP, so 175 opens the league at the end of a first real week of work
       rather than during a first afternoon of it. If this changes, the help
       article, the league page and the home card all follow it, because all
       three read this constant. */
    expect(LEAGUE_UNLOCK_XP).toBe(175);
  });

  it("opens ON the threshold, not one point past it", () => {
    expect(unlockFrom(LEAGUE_UNLOCK_XP - 1).unlocked).toBe(false);
    expect(unlockFrom(LEAGUE_UNLOCK_XP).unlocked).toBe(true);
  });

  it("counts down in XP a learner can act on, and never past zero", () => {
    expect(unlockFrom(135)).toEqual({ lifetimeXp: 135, unlocked: false, needed: 40 });
    expect(unlockFrom(175)).toEqual({ lifetimeXp: 175, unlocked: true, needed: 0 });
    /* «Ещё -25 XP» is the kind of string that reaches a child before it reaches
       a reviewer. */
    expect(unlockFrom(200).needed).toBe(0);
  });

  it("survives the shapes a driver actually returns", () => {
    /* `sum(amount)` comes back as a string on one driver and a number on the
       other, and an empty ledger sums to null. */
    expect(unlockFrom(Number("140")).lifetimeXp).toBe(140);
    expect(unlockFrom(Number(null)).lifetimeXp).toBe(0);
    expect(unlockFrom(Number(undefined)).lifetimeXp).toBe(0);
    expect(unlockFrom(-50).lifetimeXp).toBe(0);
  });
});

describe("the number comes from the existing ledger and nowhere else", () => {
  it("is zero for a learner who has earned nothing", async () => {
    expect(await leagueUnlockFor(sql, SUBJECT)).toEqual({
      lifetimeXp: 0,
      unlocked: false,
      needed: LEAGUE_UNLOCK_XP,
    });
  });

  it("sums the awards a learner actually holds", async () => {
    await solve(SUBJECT, "2026-W37", ["b1", "b2", "b3"]);
    const u = await leagueUnlockFor(sql, SUBJECT);
    expect(u.lifetimeXp).toBe(3 * XP_AMOUNTS.block_solved);
    expect(u.unlocked).toBe(false);
    expect(u.needed).toBe(LEAGUE_UNLOCK_XP - 30);
  });

  it("adds a second week rather than restarting — the unlock is lifetime, not weekly", async () => {
    await solve(SUBJECT, "2026-W38", ["b4", "b5"]);
    /* If this were scoped to the current week, the answer here would be 20 and
       the league would re-lock itself every Monday. */
    expect((await leagueUnlockFor(sql, SUBJECT)).lifetimeXp).toBe(50);
  });

  it("adds nothing for re-solving a block already credited", async () => {
    const before = await leagueUnlockFor(sql, SUBJECT);
    await solve(SUBJECT, "2026-W39", ["b1", "b2"]);
    /* The primary key `(subject_id, achievement, entity_id)` refuses the row,
       so the unlock inherits the ledger's anti-farming property without
       implementing one of its own. This is the assertion that fails if somebody
       ever gives the home card its own counter. */
    expect((await leagueUnlockFor(sql, SUBJECT)).lifetimeXp).toBe(before.lifetimeXp);
  });

  it("crosses the threshold on real work and then stays crossed", async () => {
    const blocks = Array.from({ length: 20 }, (_, i) => `big.${i}`);
    await solve(SUBJECT, "2026-W40", blocks);
    const crossed = await leagueUnlockFor(sql, SUBJECT);
    expect(crossed.lifetimeXp).toBeGreaterThanOrEqual(LEAGUE_UNLOCK_XP);
    expect(crossed.unlocked).toBe(true);
    expect(crossed.needed).toBe(0);

    /* Nothing in the product subtracts XP — `xp-policy.ts` has no negative
       amount and no removal path — so a week of doing nothing cannot re-lock
       it. That is why there is no `unlocked_at` column to keep in step. */
    await solve(SUBJECT, "2026-W41", []);
    expect((await leagueUnlockFor(sql, SUBJECT)).unlocked).toBe(true);
  });

  it("counts only the caller's own awards", async () => {
    /* `OTHER` has earned nothing. If the query dropped its `where` clause this
       would return SUBJECT's total, and the home card would tell an untouched
       learner they had unlocked a league. */
    expect((await leagueUnlockFor(sql, OTHER)).lifetimeXp).toBe(0);
  });
});
