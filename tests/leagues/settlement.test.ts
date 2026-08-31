import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { settleDueWeeks } from "@schools/leagues/settle";
import { lastSettledResult } from "@schools/leagues/queries";

/**
 * Closing a week.
 *
 * §38 of the brief asks what happens on a retry, a race, a crash halfway and a
 * lazy settlement on the next read. The answer to all four is the same, and it
 * is the reason `settleGroup` is a pure function and every write is
 * `on conflict do nothing`: settlement CONVERGES rather than succeeding once.
 * These tests try to make it produce a second promotion and fail to.
 */

const SCHOOL = "pilot-school";
const CLASS = "grade-9a";
const LAST = "2026-W37";
/** Any instant inside the following week, so `LAST` is closed. */
const NOW = new Date("2026-09-16T12:00:00Z");

let sql: PgliteExecutor;

const subj = (n: number) => `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`;

async function seed(n: number, xpEach: (i: number) => number, week = LAST, tier = 1) {
  const ids: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const id = subj(1000 + i);
    ids.push(id);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')
       on conflict do nothing`,
      [id],
    );
    if (tier !== 1) {
      await sql.query(
        `insert into league_profiles (subject_id, tier) values ($1,$2)
         on conflict (subject_id) do update set tier = excluded.tier`,
        [id, tier],
      );
    }
    /* Awarded through the real engine, so membership and grouping are created
       the way production creates them rather than by hand. */
    const amount = xpEach(i);
    await sql.tx((t) =>
      awardXp(
        t,
        { subjectId: id, weekId: week, schoolId: SCHOOL, classId: CLASS },
        [{ achievement: "block_solved", entityId: `seed.${i}`, amount }],
      ),
    );
  }
  return ids;
}

async function reset() {
  for (const t of [
    "league_settlements",
    "league_memberships",
    "league_groups",
    "league_xp_awards",
    "league_profiles",
  ]) {
    await sql.query(`delete from ${t}`);
  }
  await sql.query(`delete from reducer_lease`);
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

async function movements(): Promise<Record<string, number>> {
  const r = await sql.query<{ movement: string; n: number }>(
    `select movement, count(*)::int as n from league_settlements group by movement`,
  );
  return Object.fromEntries(r.rows.map((x) => [x.movement, Number(x.n)]));
}

describe("a full group", () => {
  beforeAll(async () => {
    await reset();
    await seed(18, (i) => (18 - i) * 10, LAST, 5);
  }, 120_000);

  it("settles the pilot's eighteen into 4 up, 10 stay, 4 down", async () => {
    const r = await settleDueWeeks(sql, { now: NOW });
    expect(r.groupsSettled).toBe(1);
    expect(await movements()).toEqual({ promoted: 4, stayed: 10, relegated: 4 });
  }, 60_000);

  it("moves each learner's profile to the tier the settlement decided", async () => {
    const r = await sql.query<{ tier: number; n: number }>(
      `select tier, count(*)::int as n from league_profiles group by tier order by tier`,
    );
    expect(r.rows.map((x) => [Number(x.tier), Number(x.n)])).toEqual([
      [4, 4],
      [5, 10],
      [6, 4],
    ]);
  });

  it("marks the group settled so it is not picked up again", async () => {
    const r = await sql.query<{ n: number }>(
      `select count(*)::int as n from league_groups where settled_at is null`,
    );
    expect(Number(r.rows[0].n)).toBe(0);
  });

  it("stores every input to the decision, so history is never recomputed", async () => {
    const r = await sql.query<Record<string, unknown>>(
      `select final_xp, rank, group_size, tier_before, movement, tier_after, policy_version
         from league_settlements order by rank limit 1`,
    );
    expect(r.rows[0]).toMatchObject({
      rank: 1,
      group_size: 18,
      tier_before: 5,
      movement: "promoted",
      tier_after: 6,
      policy_version: "league.v1",
    });
  });
});

describe("settling twice cannot produce a second promotion", () => {
  it("is a no-op on the second call", async () => {
    const before = await movements();
    const again = await settleDueWeeks(sql, { now: NOW });
    expect(again.groupsSettled).toBe(0);
    expect(await movements()).toEqual(before);
  }, 60_000);

  it("does not drag a tier backwards when an old week is re-settled", async () => {
    /* Force the group open again and re-run. The settlement rows already exist,
       so `on conflict do nothing` returns nothing and the profile update is
       skipped — which is the guard that stops a learner promoted twice from
       being reset to where they were two weeks ago. */
    await sql.query(`update league_groups set settled_at = null`);
    await sql.query(`update league_profiles set tier = 9`);

    await settleDueWeeks(sql, { now: NOW });

    const r = await sql.query<{ n: number }>(
      `select count(*)::int as n from league_profiles where tier <> 9`,
    );
    expect(Number(r.rows[0].n)).toBe(0);
  }, 60_000);

  it("two concurrent settlements produce one result each", async () => {
    await reset();
    await seed(10, (i) => (10 - i) * 10, LAST, 5);

    const [a, b] = await Promise.all([
      settleDueWeeks(sql, { now: NOW, owner: "worker-a" }),
      settleDueWeeks(sql, { now: NOW, owner: "worker-b" }),
    ]);

    /* One does the work, the other finds the lease held and returns `skipped`.
       Either way the outcome is one settlement per learner. */
    expect(a.groupsSettled + b.groupsSettled).toBe(1);
    expect(a.skipped !== b.skipped).toBe(true);

    const r = await sql.query<{ n: number }>(
      `select count(*)::int as n from league_settlements`,
    );
    expect(Number(r.rows[0].n)).toBe(10);
  }, 120_000);
});

describe("an open week is never settled", () => {
  it("leaves the current week alone", async () => {
    await reset();
    /* Award into the week that CONTAINS `NOW`, so it is still open. */
    await seed(6, () => 50, "2026-W38", 5);
    const r = await settleDueWeeks(sql, { now: NOW });
    expect(r.groupsSettled).toBe(0);

    const s = await sql.query<{ n: number }>(`select count(*)::int as n from league_settlements`);
    expect(Number(s.rows[0].n)).toBe(0);
  }, 60_000);

  it("XP earned after a week closes lands in the NEW week, not the settled one", async () => {
    await reset();
    const [id] = await seed(1, () => 30, LAST, 5);
    await settleDueWeeks(sql, { now: NOW });

    await sql.tx((t) =>
      awardXp(
        t,
        { subjectId: id, weekId: "2026-W38", schoolId: SCHOOL, classId: CLASS },
        [{ achievement: "block_solved", entityId: "after.close", amount: 10 }],
      ),
    );

    const settled = await sql.query<{ final_xp: number }>(
      `select final_xp from league_settlements where subject_id = $1 and week_id = $2`,
      [id, LAST],
    );
    /* The closed week's result is untouched by work done after it. */
    expect(Number(settled.rows[0].final_xp)).toBe(30);
  }, 60_000);
});

describe("small and degenerate groups", () => {
  it("a group of one moves nobody", async () => {
    await reset();
    await seed(1, () => 500, LAST, 5);
    await settleDueWeeks(sql, { now: NOW });
    expect(await movements()).toEqual({ stayed: 1 });
  }, 60_000);

  it("a group of three moves nobody", async () => {
    await reset();
    await seed(3, (i) => (3 - i) * 100, LAST, 5);
    await settleDueWeeks(sql, { now: NOW });
    expect(await movements()).toEqual({ stayed: 3 });
  }, 60_000);

  it("a group of five moves one each way", async () => {
    await reset();
    await seed(5, (i) => (5 - i) * 10, LAST, 5);
    await settleDueWeeks(sql, { now: NOW });
    expect(await movements()).toEqual({ promoted: 1, stayed: 3, relegated: 1 });
  }, 60_000);

  it("never relegates anyone out of the bottom tier", async () => {
    await reset();
    await seed(10, (i) => (10 - i) * 10, LAST, 1);
    await settleDueWeeks(sql, { now: NOW });
    const m = await movements();
    expect(m.relegated).toBeUndefined();
    expect(m.promoted).toBe(2);
  }, 60_000);

  it("never promotes anyone out of the top tier", async () => {
    await reset();
    await seed(10, (i) => (10 - i) * 10, LAST, 10);
    await settleDueWeeks(sql, { now: NOW });
    const m = await movements();
    expect(m.promoted).toBeUndefined();
    expect(m.relegated).toBe(2);
  }, 60_000);
});

describe("the result a learner is shown", () => {
  it("is the most recent settled week, with every number it was decided on", async () => {
    await reset();
    const ids = await seed(10, (i) => (10 - i) * 10, LAST, 4);
    await settleDueWeeks(sql, { now: NOW });

    const top = await lastSettledResult(sql, ids[0]);
    expect(top).toMatchObject({
      weekId: LAST,
      rank: 1,
      groupSize: 10,
      tierBefore: 4,
      movement: "promoted",
      tierAfter: 5,
      finalXp: 100,
    });

    const bottom = await lastSettledResult(sql, ids[9]);
    expect(bottom).toMatchObject({ movement: "relegated", tierAfter: 3 });
  }, 60_000);

  it("is null for a learner who has never competed", async () => {
    const never = subj(9999);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')
       on conflict do nothing`,
      [never],
    );
    expect(await lastSettledResult(sql, never)).toBeNull();
  });
});
