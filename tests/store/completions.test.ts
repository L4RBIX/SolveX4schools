import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { findCompletable } from "@schools/curriculum/inventory";

/**
 * Lesson completion, on the server.
 *
 * The defect this replaces was total and silent: `completedLessons` lived in
 * `localStorage` under `solvex.progress.v1` and nothing ever reached the
 * server, so a school's record of who finished what died with a cleared cache
 * and nothing anywhere raised an error, because there was never a second copy
 * to disagree with.
 *
 * Everything below runs against real Postgres (PGlite) with the shipped
 * migrations applied, because what is being asserted is a primary key, a
 * cascade and a swallowed conflict — none of which can be checked by reading
 * the TypeScript around them.
 */

const SUBJECT = "33333333-3333-4333-8333-333333333333";
const OTHER = "44444444-4444-4444-8444-444444444444";

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  for (const id of [SUBJECT, OTHER]) {
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1, 'public')
       on conflict do nothing`,
      [id],
    );
  }
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

describe("recordLessonCompletion", () => {
  it("writes a completion and reads it back", async () => {
    const first = await store.recordLessonCompletion({
      subjectId: SUBJECT,
      lessonId: "m1.l1",
      correct: 3,
      wrong: 1,
      unmeasured: 2,
      attempts: 6,
    });
    expect(first).toBe(true);

    const rows = await store.completionsForSubject(SUBJECT);
    expect(rows.map((r) => r.lessonId)).toContain("m1.l1");
    const row = rows.find((r) => r.lessonId === "m1.l1")!;
    expect(row).toMatchObject({ correct: 3, wrong: 1, unmeasured: 2, attempts: 6 });
    expect(new Date(row.completedAt).getTime()).toBeGreaterThan(0);
  });

  it("is idempotent, and a replay cannot rewrite the pass that happened", async () => {
    /* The whole point of `do nothing`. If this ever became `do update`, a
       learner replaying a lesson they got half wrong would silently overwrite
       the record with a clean sheet — and the record is what a school reads. */
    const again = await store.recordLessonCompletion({
      subjectId: SUBJECT,
      lessonId: "m1.l1",
      correct: 6,
      wrong: 0,
      unmeasured: 0,
      attempts: 6,
    });
    expect(again).toBe(false);

    const row = (await store.completionsForSubject(SUBJECT)).find((r) => r.lessonId === "m1.l1")!;
    expect(row).toMatchObject({ correct: 3, wrong: 1 });
  });

  it("never returns another learner's completions", async () => {
    await store.recordLessonCompletion({
      subjectId: OTHER,
      lessonId: "m1.l2",
      correct: 1,
      wrong: 0,
      unmeasured: 0,
      attempts: 1,
    });
    expect((await store.completionsForSubject(SUBJECT)).map((r) => r.lessonId)).not.toContain(
      "m1.l2",
    );
  });

  it("orders most recent first", async () => {
    await store.recordLessonCompletion({
      subjectId: SUBJECT,
      lessonId: "m1.l3",
      correct: 0,
      wrong: 0,
      unmeasured: 0,
      attempts: 0,
    });
    const rows = await store.completionsForSubject(SUBJECT);
    const times = rows.map((r) => new Date(r.completedAt).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("the row is erased with the learner", () => {
  it("cascades from learning_subjects, so consent revocation still works", async () => {
    /* Migration 0007 had to go and fix a `forget_user` that errored out. A
       completion row holding a bare foreign key would break it the same way:
       the delete at the end of `learning_forget_user` would fail on the
       reference and the child would not be forgotten. */
    const doomed = "55555555-5555-4555-8555-555555555555";
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1, 'public')`,
      [doomed],
    );
    await store.recordLessonCompletion({
      subjectId: doomed,
      lessonId: "m1.l1",
      correct: 0,
      wrong: 0,
      unmeasured: 0,
      attempts: 0,
    });

    await sql.query(`delete from learning_subjects where subject_id = $1`, [doomed]);

    const left = await sql.query<{ n: number }>(
      `select count(*)::int as n from lesson_completions where subject_id = $1`,
      [doomed],
    );
    expect(left.rows[0].n).toBe(0);
  });
});

describe("findCompletable — what the route validates the id against", () => {
  it("resolves an authored lesson", () => {
    const found = findCompletable("m1.l1");
    expect(found).not.toBeNull();
    expect(found!.monthIndex).toBe(1);
    expect(found!.blockCount).toBeGreaterThan(0);
  });

  it("resolves a monthly check, which is recorded under its own id", () => {
    /* `assessment-route.tsx` marks the check complete by its own id so the
       board can show it done without it counting as a tenth lesson. A lookup
       that only walked units would 404 every monthly check. */
    const found = findCompletable("m1.assessment");
    expect(found).not.toBeNull();
    expect(found!.blockCount).toBeGreaterThan(0);
  });

  it("returns null for an id nobody authored", () => {
    expect(findCompletable("m1.l999")).toBeNull();
    expect(findCompletable("")).toBeNull();
    expect(findCompletable("../../etc/passwd")).toBeNull();
  });

  it("hands back no answer keys", () => {
    /* Deliberately not the `Lesson` object. `public.ts` exists because handing
       a route the authored lesson once put every reference solution in the page
       source; this lookup cannot repeat that because it never holds one. */
    /* `kind` joined this list with the league work. It is a two-value union —
       "lesson" | "assessment" — derived by the lookup that just walked the
       curriculum, and it carries no authored content of any kind. The list is
       still pinned exactly, which is the point of the test: a field that DOES
       carry content has to be added here by somebody, in a diff that says so. */
    expect(Object.keys(findCompletable("m1.l1")!).sort()).toEqual([
      "blockCount",
      "id",
      "kind",
      "monthIndex",
      "status",
    ]);
  });
});
