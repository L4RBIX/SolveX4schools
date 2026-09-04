import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { settleDueWeeks } from "@schools/leagues/settle";
import { weekIdOf } from "@schools/leagues/week";

/**
 * A promotion has to affect the week it was won for.
 *
 * ## The defect
 *
 * `ensureMembership` reads the learner's tier from `league_profiles`, and that
 * row only moves when a week SETTLES. Settlement ran when somebody opened
 * /league, and on an hourly in-process interval that fires zero times on a
 * serverless host.
 *
 * So the first award of a new week — a learner submitting at 05:10 Almaty on a
 * Monday, before anyone has looked at the board — admitted them at the tier
 * they held BEFORE the week they had just won. The settlement that ran later
 * wrote the promotion into a profile the membership had already been derived
 * from. The promotion was real, it was recorded in `league_settlements`, and it
 * had no effect on the week it was for: the learner played the next week
 * against the same people, one tier below where they had earned their place.
 *
 * ## The fix these pin
 *
 * `ensureMembership` settles every week of this learner's that has closed,
 * inside the award's own transaction, before it reads the tier. The moment the
 * tier is read is the only moment at which it has to be right, and it is the
 * one moment the product is certainly executing.
 */

const SCHOOL = "settle-school";
const CLASS = "settle-9a";

/** Monday of an ISO week, at 06:00 UTC — inside the week, not on its edge. */
function mondayOf(weekOffset: number): Date {
  const base = Date.UTC(2026, 8, 7, 6, 0, 0); // 2026-09-07 is a Monday
  return new Date(base + weekOffset * 7 * 86_400_000);
}

describe("a learner who won last week", () => {
  let sql: PgliteExecutor;

  /* A fresh database per case: these are about what a learner's FIRST award of
     a week does, and a shared store would carry the previous case's tiers. */
  beforeEach(async () => {
    sql = await PgliteExecutor.open("memory://");
    await migrate(sql, { applyLocalBootstrap: true });
  }, 60_000);

  const makeSubject = (id: string) =>
    sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')
       on conflict do nothing`,
      [id],
    );

  it("is admitted to the new week at the tier they earned", async () => {
    const winner = randomUUID();
    const others = [randomUUID(), randomUUID(), randomUUID()];

    const lastWeek = mondayOf(0);
    const thisWeek = mondayOf(1);
    const lastWeekId = weekIdOf(lastWeek);
    const thisWeekId = weekIdOf(thisWeek);
    expect(lastWeekId, "the two dates must be different weeks").not.toBe(thisWeekId);

    /* Last week: everyone plays, the winner earns the most. */
    for (const s of [winner, ...others]) await makeSubject(s);
    await sql.tx(async (t) => {
      for (const [i, subjectId] of [winner, ...others].entries()) {
        await awardXp(
          t,
          { subjectId, schoolId: SCHOOL, classId: CLASS, weekId: lastWeekId, sourceEpisode: randomUUID() },
          [{ achievement: "block_solved", entityId: `b${i}`, amount: 100 - i * 10 }],
        );
      }
    });

    const before = await sql.query<{ tier: number }>(
      "select tier from league_profiles where subject_id = $1",
      [winner],
    );
    const startingTier = Number(before.rows[0]!.tier);

    /*
     * Monday morning of the new week, and NOBODY has opened /league. This is
     * the whole scenario: the only thing that happens is one learner earning
     * their first XP of the week.
     */
    const award = await sql.tx(async (t) =>
      awardXp(
        t,
        { subjectId: winner, schoolId: SCHOOL, classId: CLASS, weekId: thisWeekId, sourceEpisode: randomUUID() },
        [{ achievement: "block_solved", entityId: "b-new", amount: 10 }],
      ),
    );

    /* Last week must now be settled — by that award, not by a page view. */
    const settlement = await sql.query<{ movement: string; tier_after: number }>(
      "select movement, tier_after from league_settlements where subject_id = $1 and week_id = $2",
      [winner, lastWeekId],
    );
    expect(settlement.rows.length, "the closed week must have been settled").toBe(1);
    expect(settlement.rows[0]!.movement, "the top of the group goes up").toBe("promoted");
    const earned = Number(settlement.rows[0]!.tier_after);
    expect(earned, "the promotion must be a real move").toBeGreaterThan(startingTier);

    /* And the new week's membership must be AT that tier. */
    expect(
      award.tier,
      "the learner was admitted to the new week at the tier they had already left",
    ).toBe(earned);

    const membership = await sql.query<{ tier: number }>(
      "select tier from league_memberships where subject_id = $1 and week_id = $2",
      [winner, thisWeekId],
    );
    expect(Number(membership.rows[0]!.tier)).toBe(earned);
  });

  it("does not move the profile backwards when the week is settled again", async () => {
    /* The other half of the same defect. A settlement that ran after the
       membership was created used to write its own `tier_after` into the
       profile — so re-running it, or running it late, dragged a learner back to
       where they were. Every write is `on conflict do nothing` and the profile
       moves only for a genuinely new settlement row; this proves it. */
    const winner = randomUUID();
    const others = [randomUUID(), randomUUID(), randomUUID()];
    const lastWeekId = weekIdOf(mondayOf(0));
    const thisWeekId = weekIdOf(mondayOf(1));

    for (const s of [winner, ...others]) await makeSubject(s);
    await sql.tx(async (t) => {
      for (const [i, subjectId] of [winner, ...others].entries()) {
        await awardXp(
          t,
          { subjectId, schoolId: SCHOOL, classId: CLASS, weekId: lastWeekId, sourceEpisode: randomUUID() },
          [{ achievement: "block_solved", entityId: `b${i}`, amount: 100 - i * 10 }],
        );
      }
    });

    await sql.tx(async (t) =>
      awardXp(
        t,
        { subjectId: winner, schoolId: SCHOOL, classId: CLASS, weekId: thisWeekId, sourceEpisode: randomUUID() },
        [{ achievement: "block_solved", entityId: "b-new", amount: 10 }],
      ),
    );

    const afterAward = await sql.query<{ tier: number }>(
      "select tier from league_profiles where subject_id = $1",
      [winner],
    );

    /* The cron, running later, over a week that is already settled. */
    const swept = await settleDueWeeks(sql, { now: mondayOf(1) });
    expect(swept.groupsSettled, "nothing is left to settle").toBe(0);

    const afterCron = await sql.query<{ tier: number }>(
      "select tier from league_profiles where subject_id = $1",
      [winner],
    );
    expect(
      Number(afterCron.rows[0]!.tier),
      "a second settlement pass moved a learner's tier",
    ).toBe(Number(afterAward.rows[0]!.tier));
  });
});
