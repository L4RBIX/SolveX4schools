import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";

/**
 * The numbers on `/you` and on the home rail.
 *
 * These run against a real Postgres (PGlite) with the shipped migrations
 * applied, because the thing being asserted is SQL: `count(*) filter (...)`,
 * `to_char(... at time zone 'UTC', ...)` and a half-open range. None of that
 * can be checked by reading the TypeScript around it.
 *
 * The reason this suite exists at all: the home rail used to show a hardcoded
 * streak of 0 and "0 of 40 min". Replacing invented numbers with real ones is
 * only an improvement if the real ones are right.
 */

const SUBJECT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  for (const id of [SUBJECT, OTHER]) {
    await sql.query(
      `insert into learning_subjects (subject_id, cohort)
       values ($1, 'public')
       on conflict do nothing`,
      [id],
    );
  }

  // Monday 2026-08-24 through Sunday 2026-08-30.
  await seed({ id: "a", subject: SUBJECT, day: "2026-08-24", outcome: "accepted", assist: -1, secs: 600 });
  await seed({ id: "b", subject: SUBJECT, day: "2026-08-24", outcome: "abandoned", assist: -1, secs: 300 });
  await seed({ id: "c", subject: SUBJECT, day: "2026-08-26", outcome: "accepted", assist: 2, secs: 900, interventions: 3 });
  await seed({ id: "d", subject: SUBJECT, day: "2026-08-26", outcome: "accepted", assist: 0, secs: 120, interventions: 1 });
  // Outside the week, and must never be counted into it.
  await seed({ id: "e", subject: SUBJECT, day: "2026-08-31", outcome: "accepted", assist: -1, secs: 999 });
  await seed({ id: "f", subject: SUBJECT, day: "2026-08-23", outcome: "accepted", assist: -1, secs: 999 });
  // Another child, same week. Nothing here may ever appear in SUBJECT's totals.
  await seed({ id: "z", subject: OTHER, day: "2026-08-25", outcome: "accepted", assist: -1, secs: 5000 });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

let n = 0;
async function seed(row: {
  id: string;
  subject: string;
  day: string;
  outcome: string;
  assist: number;
  secs: number;
  interventions?: number;
}) {
  n += 1;
  const episodeId = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  await sql.query(
    `insert into attempt_episodes
       (episode_id, subject_id, task_ref, task_kind, opened_at, outcome,
        active_seconds, max_assistance_level, intervention_count, reducer_version)
     values ($1, $2, $3, 'lesson', $4, $5, $6, $7, $8, 1)`,
    [
      episodeId,
      row.subject,
      `solvex:${row.id}`,
      `${row.day}T09:30:00Z`,
      row.outcome,
      row.secs,
      row.assist,
      row.interventions ?? 0,
    ],
  );
}

const WEEK_FROM = "2026-08-24T00:00:00.000Z";
const WEEK_TO = "2026-08-31T00:00:00.000Z";

describe("activityBuckets", () => {
  it("is the single source for the home rail's week too", async () => {
    /* `/api/learning/state/me` used to call a separate `weeklyActivity` method
       with only a start bound, so anything after the week (a clock-skewed
       episode, a device in a different timezone) counted as this week. Both
       surfaces now run the same query over the same half-open window, so they
       cannot disagree about what "this week" means. */
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    const activeDays = rows.filter((r) => r.attempted > 0).map((r) => r.bucket);
    expect(activeDays).toEqual(["2026-08-24", "2026-08-26"]);
    expect(rows.reduce((t, r) => t + r.activeSeconds, 0)).toBe(1920);
  });

  it("returns one row per day that has episodes, and none for empty days", async () => {
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    // Absent, not zero-filled: the route fills the window's shape, and a query
    // that invented seven rows would make "no data" indistinguishable from
    // "data that happens to be zero" one layer further down.
    expect(rows.map((r) => r.bucket)).toEqual(["2026-08-24", "2026-08-26"]);
  });

  it("counts a solo solve only when no assistance was ever requested", async () => {
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    const mon = rows.find((r) => r.bucket === "2026-08-24")!;
    const wed = rows.find((r) => r.bucket === "2026-08-26")!;

    expect(mon.solvedSolo).toBe(1);
    expect(mon.solvedAssisted).toBe(0);

    // Level 0 is still assistance. Treating `>= 0` as "no help" would let a
    // learner who took a hint be reported as having worked unaided, which is
    // the one claim this product must never make wrongly.
    expect(wed.solvedSolo).toBe(0);
    expect(wed.solvedAssisted).toBe(2);
  });

  it("counts every episode as attempted, solved or not", async () => {
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    expect(rows.find((r) => r.bucket === "2026-08-24")!.attempted).toBe(2);
  });

  it("sums active seconds and interventions per bucket", async () => {
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    expect(rows.find((r) => r.bucket === "2026-08-24")!.activeSeconds).toBe(900);
    expect(rows.find((r) => r.bucket === "2026-08-26")!.activeSeconds).toBe(1020);
    expect(rows.find((r) => r.bucket === "2026-08-26")!.helpRequests).toBe(4);
  });

  it("treats the range as half-open — `from` is in, `to` is out", async () => {
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    const days = rows.map((r) => r.bucket);
    expect(days).not.toContain("2026-08-23");
    expect(days).not.toContain("2026-08-31");
  });

  it("never reads another learner's episodes", async () => {
    const rows = await store.activityBuckets(SUBJECT, WEEK_FROM, WEEK_TO, "day");
    expect(rows.some((r) => r.bucket === "2026-08-25")).toBe(false);
    expect(rows.reduce((t, r) => t + r.activeSeconds, 0)).toBe(1920);
  });

  it("groups by month when asked", async () => {
    const rows = await store.activityBuckets(
      SUBJECT,
      "2026-01-01T00:00:00.000Z",
      "2027-01-01T00:00:00.000Z",
      "month",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].bucket).toBe("2026-08");
    // Everything seeded for SUBJECT in August, including the days outside the
    // week window above.
    expect(rows[0].attempted).toBe(6);
  });

  it("returns nothing for a window with no episodes", async () => {
    const rows = await store.activityBuckets(
      SUBJECT,
      "2025-01-01T00:00:00.000Z",
      "2025-02-01T00:00:00.000Z",
      "day",
    );
    expect(rows).toEqual([]);
  });
});
