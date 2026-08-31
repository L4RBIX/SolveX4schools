import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { creditsForSolve, XP_AMOUNTS } from "@schools/leagues/xp-policy";
import { MAX_GROUP_SIZE } from "@schools/leagues/standings";

/**
 * The award path, against a real Postgres with the shipped migrations.
 *
 * These are the adversarial cases from §35 of the brief that can be expressed
 * below the HTTP layer. The ones that need a route (forged bodies, forged
 * weeks, cross-school access) live in `tests/leagues/security.test.ts`.
 */

const WEEK = "2026-W37";
const CTX = { weekId: WEEK, schoolId: "pilot-school", classId: "grade-9a" };

let sql: PgliteExecutor;

const subj = (n: number) =>
  `${String(n).padStart(8, "0")}-0000-4000-8000-000000000000`;

async function makeSubject(id: string) {
  await sql.query(
    `insert into learning_subjects (subject_id, cohort) values ($1,'public')
     on conflict do nothing`,
    [id],
  );
}

async function weeklyXp(subjectId: string, week = WEEK) {
  const r = await sql.query<{ n: number }>(
    `select coalesce(sum(amount),0)::int as n from league_xp_awards
      where subject_id = $1 and week_id = $2`,
    [subjectId, week],
  );
  return Number(r.rows[0].n);
}

/** One solve of a normal block, through the real policy. */
const solve = (blockId: string, unaided = true) =>
  creditsForSolve({ blockId, blockType: "write_code", unaided });

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

describe("a normal first solve", () => {
  const S = subj(1);

  it("credits base + independence, and admits the learner to the week", async () => {
    await makeSubject(S);
    const r = await sql.tx((t) => awardXp(t, { ...CTX, subjectId: S }, solve("m1.l1.b1")));

    expect(r.gained).toBe(XP_AMOUNTS.block_solved + XP_AMOUNTS.block_solved_unaided);
    expect(r.entered).toBe(true);
    expect(r.tier).toBe(1);
    expect(r.groupId).not.toBeNull();
  });

  it("does not re-enter them on the next award of the same week", async () => {
    const r = await sql.tx((t) => awardXp(t, { ...CTX, subjectId: S }, solve("m1.l1.b2")));
    expect(r.entered).toBe(false);
    expect(r.gained).toBeGreaterThan(0);
  });
});

describe("anti-farming: the award key makes repetition worthless", () => {
  const S = subj(2);

  beforeAll(async () => {
    await makeSubject(S);
    await sql.tx((t) => awardXp(t, { ...CTX, subjectId: S }, solve("farm.b1")));
  });

  it("re-solving the same block earns nothing", async () => {
    const before = await weeklyXp(S);
    const r = await sql.tx((t) => awardXp(t, { ...CTX, subjectId: S }, solve("farm.b1")));
    expect(r.gained).toBe(0);
    expect(r.granted).toEqual([]);
    expect(await weeklyXp(S)).toBe(before);
  });

  it("re-solving it in a LATER week still earns nothing — solved is solved", async () => {
    const r = await sql.tx((t) =>
      awardXp(t, { ...CTX, subjectId: S, weekId: "2026-W38" }, solve("farm.b1")),
    );
    expect(r.gained).toBe(0);
    expect(await weeklyXp(S, "2026-W38")).toBe(0);
  });

  it("a hundred replays of the same solve move nothing", async () => {
    const before = await weeklyXp(S);
    for (let i = 0; i < 100; i += 1) {
      await sql.tx((t) => awardXp(t, { ...CTX, subjectId: S }, solve("farm.b1")));
    }
    expect(await weeklyXp(S)).toBe(before);
  });

  it("an empty credit list is a no-op and does not admit anybody", async () => {
    const fresh = subj(3);
    await makeSubject(fresh);
    const r = await sql.tx((t) => awardXp(t, { ...CTX, subjectId: fresh }, []));
    expect(r).toMatchObject({ gained: 0, entered: false, groupId: null });
    const m = await sql.query(
      `select 1 from league_memberships where subject_id = $1`, [fresh]);
    expect(m.rows.length).toBe(0);
  });
});

describe("assistance changes the bonus, never the base, and never subtracts", () => {
  const S = subj(4);

  it("an assisted solve still earns the base credit", async () => {
    await makeSubject(S);
    const r = await sql.tx((t) =>
      awardXp(t, { ...CTX, subjectId: S }, solve("assisted.b1", false)));
    expect(r.gained).toBe(XP_AMOUNTS.block_solved);
    expect(r.granted.map((c) => c.achievement)).toEqual(["block_solved"]);
  });

  it("the independence bonus can still land later and never removes the base", async () => {
    /* The base row already exists, so only the bonus inserts. This is why the
       bonus is a separate row rather than a larger amount on the first one. */
    const r = await sql.tx((t) =>
      awardXp(t, { ...CTX, subjectId: S }, solve("assisted.b1", true)));
    expect(r.gained).toBe(XP_AMOUNTS.block_solved_unaided);
    expect(await weeklyXp(S)).toBe(
      XP_AMOUNTS.block_solved + XP_AMOUNTS.block_solved_unaided);
  });

  it("never produces a negative total", async () => {
    expect(await weeklyXp(S)).toBeGreaterThan(0);
  });
});

describe("concurrent first awards cannot put one learner in two groups", () => {
  it("18 learners entering at once land in one group, each exactly once", async () => {
    const ids = Array.from({ length: 18 }, (_, i) => subj(100 + i));
    for (const id of ids) await makeSubject(id);

    await Promise.all(
      ids.map((id) =>
        sql.tx((t) => awardXp(t, { ...CTX, subjectId: id, weekId: "2026-W40" }, solve(`race.${id}`))),
      ),
    );

    const m = await sql.query<{ subject_id: string; group_id: string }>(
      `select subject_id, group_id from league_memberships where week_id = '2026-W40'`,
    );
    expect(m.rows.length).toBe(18);
    expect(new Set(m.rows.map((r) => r.subject_id)).size).toBe(18);
    expect(new Set(m.rows.map((r) => r.group_id)).size).toBe(1);
  }, 60_000);

  it("the same learner awarded twice concurrently is admitted once", async () => {
    const S = subj(200);
    await makeSubject(S);
    const [a, b] = await Promise.all([
      sql.tx((t) => awardXp(t, { ...CTX, subjectId: S, weekId: "2026-W41" }, solve("dup.b1"))),
      sql.tx((t) => awardXp(t, { ...CTX, subjectId: S, weekId: "2026-W41" }, solve("dup.b2"))),
    ]);
    const m = await sql.query(
      `select 1 from league_memberships where subject_id = $1 and week_id = '2026-W41'`, [S]);
    expect(m.rows.length).toBe(1);
    /* Exactly one of the two reports having created the membership. */
    expect([a.entered, b.entered].filter(Boolean).length).toBe(1);
    expect(a.groupId).toBe(b.groupId);
  }, 60_000);
});

describe("group capacity", () => {
  it("opens a second group once the first is full, and never exceeds it serially", async () => {
    const n = MAX_GROUP_SIZE + 3;
    const ids = Array.from({ length: n }, (_, i) => subj(300 + i));
    for (const id of ids) await makeSubject(id);
    for (const id of ids) {
      await sql.tx((t) =>
        awardXp(t, { ...CTX, subjectId: id, weekId: "2026-W42" }, solve(`cap.${id}`)));
    }

    const g = await sql.query<{ group_id: string; n: number }>(
      `select m.group_id, count(*)::int as n
         from league_memberships m where m.week_id = '2026-W42'
        group by m.group_id order by count(*) desc`,
    );
    expect(g.rows.length).toBe(2);
    expect(Number(g.rows[0].n)).toBe(MAX_GROUP_SIZE);
    expect(Number(g.rows[1].n)).toBe(3);
  }, 120_000);
});

describe("scope", () => {
  it("keeps two classes in different groups even at the same tier and week", async () => {
    const a = subj(400);
    const b = subj(401);
    await makeSubject(a);
    await makeSubject(b);
    await sql.tx((t) =>
      awardXp(t, { weekId: "2026-W43", schoolId: "school-a", classId: "9a", subjectId: a }, solve("s.a")));
    await sql.tx((t) =>
      awardXp(t, { weekId: "2026-W43", schoolId: "school-b", classId: "9a", subjectId: b }, solve("s.b")));

    const r = await sql.query<{ group_id: string }>(
      `select group_id from league_memberships where week_id = '2026-W43'`);
    expect(new Set(r.rows.map((x) => x.group_id)).size).toBe(2);
  });
});
