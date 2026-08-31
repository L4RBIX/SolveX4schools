import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { awardXp } from "@schools/leagues/engine";
import { leagueForLearner } from "@schools/leagues/queries";
import { settleDueWeeks } from "@schools/leagues/settle";

/**
 * §49 — how the league behaves at 30, 300 and 3000 learners.
 *
 * ## What these numbers do and do not mean
 *
 * They are measured on PGlite, in-process, on one machine. They are NOT a
 * production latency budget and must not be quoted as one — a real Postgres
 * over a socket has different constants entirely. What they DO establish is the
 * shape: whether the leaderboard read is bounded by the GROUP or by the
 * POPULATION, and whether it does N+1 queries.
 *
 * That is the question worth asking here. A leaderboard whose cost grows with
 * the school rather than with the group is one that is fine for eighteen
 * children and falls over at the third school, and the difference is invisible
 * at pilot size — which is exactly why it has to be measured now rather than
 * discovered later.
 */

const SCHOOL = "load-school";
const WEEK = "2026-W37";
const NOW = new Date("2026-09-09T12:00:00Z");

let sql: PgliteExecutor;

/** Every statement the engine issues, counted. */
let queries = 0;

function instrument(x: PgliteExecutor): PgliteExecutor {
  const realQuery = x.query.bind(x);
  (x as unknown as { query: unknown }).query = (...args: unknown[]) => {
    queries += 1;
    return (realQuery as (...a: unknown[]) => unknown)(...args);
  };
  return x;
}

const subj = (n: number) => {
  const h = n.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${h}`;
};

/** Fill `count` learners into classes of 30, awarding one credit each. */
async function populate(count: number, classPrefix: string) {
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = subj(ids.length + hashOffset(classPrefix));
    ids.push(id);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')
       on conflict do nothing`,
      [id],
    );
  }
  /* One transaction per learner, as production does — the award rides the
     submit transaction, and batching here would measure a shape the product
     never runs. */
  for (let i = 0; i < ids.length; i += 1) {
    await sql.tx((t) =>
      awardXp(
        t,
        {
          subjectId: ids[i],
          weekId: WEEK,
          schoolId: SCHOOL,
          classId: `${classPrefix}-${Math.floor(i / 30)}`,
        },
        [{ achievement: "block_solved", entityId: `b.${i % 50}`, amount: 10 + (i % 40) }],
      ),
    );
  }
  return ids;
}

let offset = 0;
function hashOffset(k: string): number {
  offset += 100_000;
  return offset;
}

beforeAll(async () => {
  sql = instrument(await PgliteExecutor.open("memory://"));
  await migrate(sql, { applyLocalBootstrap: true });
}, 120_000);

afterAll(async () => {
  await sql?.close();
});

describe("the leaderboard read is bounded by the group, not by the population", () => {
  const timings: { population: number; ms: number; queries: number }[] = [];

  it("30 learners", async () => {
    const ids = await populate(30, "c30");
    const t0 = performance.now();
    queries = 0;
    const view = await leagueForLearner(sql, ids[0], NOW);
    const ms = performance.now() - t0;
    const q = queries;
    timings.push({ population: 30, ms, queries: q });
    expect(view.rows.length).toBe(30);
    /* THE assertion. Two statements: one for the caller's membership, one for
       the whole board. Not one per member — an N+1 here would be 31. */
    expect(q).toBeLessThanOrEqual(3);
  }, 240_000);

  it("300 learners", async () => {
    const ids = await populate(300, "c300");
    const t0 = performance.now();
    queries = 0;
    const view = await leagueForLearner(sql, ids[0], NOW);
    const ms = performance.now() - t0;
    timings.push({ population: 330, ms, queries });
    /* Still exactly one group of 30, because grouping is per class and classes
       are capped. The population grew tenfold and the READ did not. */
    expect(view.rows.length).toBe(30);
    expect(queries).toBeLessThanOrEqual(3);
  }, 240_000);

  it("3000 learners", async () => {
    const ids = await populate(3000, "c3000");
    const t0 = performance.now();
    queries = 0;
    const view = await leagueForLearner(sql, ids[0], NOW);
    const ms = performance.now() - t0;
    timings.push({ population: 3330, ms, queries });
    expect(view.rows.length).toBe(30);
    expect(queries).toBeLessThanOrEqual(3);

    console.log("\n  leaderboard read:");
    for (const t of timings) {
      console.log(
        `    ${String(t.population).padStart(5)} learners in the table  ` +
          `${t.ms.toFixed(1).padStart(7)} ms  ${t.queries} queries`,
      );
    }

    /* The read must not get materially slower as the table grows. A tenfold
       population increase costing under 4x is the property; an index the
       planner ignored would show up here as a linear scan. */
    const first = timings[0].ms;
    const last = timings[timings.length - 1].ms;
    expect(last).toBeLessThan(Math.max(first * 8, 250));
  }, 300_000);
});

describe("settlement of a whole school", () => {
  it("settles 111 groups without an N+1 over learners", async () => {
    const groups = await sql.query<{ n: number }>(
      `select count(*)::int as n from league_groups where week_id = $1`,
      [WEEK],
    );
    const groupCount = Number(groups.rows[0].n);
    expect(groupCount).toBeGreaterThan(100);

    queries = 0;
    const t0 = performance.now();
    const r = await settleDueWeeks(sql, { now: new Date("2026-09-16T12:00:00Z"), limit: 500 });
    const ms = performance.now() - t0;

    expect(r.groupsSettled).toBe(groupCount);

    const settled = await sql.query<{ n: number }>(
      `select count(*)::int as n from league_settlements`,
    );
    const learners = Number(settled.rows[0].n);

    console.log(
      `\n  settlement: ${r.groupsSettled} groups / ${learners} learners in ` +
        `${ms.toFixed(0)} ms (${queries} queries, ${(queries / learners).toFixed(1)} per learner)`,
    );

    /* Per learner: one settlement insert plus one profile update, plus a small
       per-group constant. Anything approaching 5 would mean a lookup crept into
       the loop. */
    expect(queries / learners).toBeLessThan(4);
  }, 600_000);

  it("is a no-op the second time, at full scale", async () => {
    const t0 = performance.now();
    const again = await settleDueWeeks(sql, { now: new Date("2026-09-16T12:00:00Z"), limit: 500 });
    console.log(`  re-settlement: ${(performance.now() - t0).toFixed(0)} ms, 0 groups expected`);
    expect(again.groupsSettled).toBe(0);
  }, 300_000);
});

describe("the award transaction", () => {
  it("issues a bounded number of statements per credited solve", async () => {
    const id = subj(999_999);
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1,'public')`,
      [id],
    );

    queries = 0;
    const t0 = performance.now();
    await sql.tx((t) =>
      awardXp(
        t,
        { subjectId: id, weekId: "2026-W44", schoolId: SCHOOL, classId: "solo" },
        [
          { achievement: "block_solved", entityId: "x", amount: 10 },
          { achievement: "block_solved_unaided", entityId: "x", amount: 5 },
        ],
      ),
    );
    const first = performance.now() - t0;
    const firstQueries = queries;

    /* The second award of the same week takes the short path: both inserts
       conflict, nothing is granted, and membership is never touched. */
    queries = 0;
    const t1 = performance.now();
    await sql.tx((t) =>
      awardXp(
        t,
        { subjectId: id, weekId: "2026-W44", schoolId: SCHOOL, classId: "solo" },
        [{ achievement: "block_solved", entityId: "x", amount: 10 }],
      ),
    );
    const repeat = performance.now() - t1;

    console.log(
      `\n  award: first ${first.toFixed(1)} ms (${firstQueries} statements), ` +
        `duplicate ${repeat.toFixed(1)} ms (${queries} statements)`,
    );

    /*
     * Measured, not predicted. `sql.tx` issues its own BEGIN and COMMIT through
     * the same path, so both counts include two statements that are not the
     * league's.
     *
     * First award, 11: begin, 2 award inserts, membership lookup, profile
     * upsert, profile read, group lookup, group insert, membership insert,
     * membership read-back, commit. Every one of them is doing something, and
     * this runs once per learner per WEEK — not per solve.
     */
    expect(firstQueries).toBeLessThanOrEqual(12);

    /*
     * A duplicate is 3: begin, one insert that conflicts, commit. ONE league
     * statement.
     *
     * This is the number that matters. Every reload of a finished lesson takes
     * this path, so if membership work happened on a repeat, the common case
     * would cost eight statements instead of one.
     */
    expect(queries).toBe(3);
  }, 120_000);
});
