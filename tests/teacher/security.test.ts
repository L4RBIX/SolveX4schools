import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PgliteExecutor } from "../../schools/store/pglite-driver";
import { migrate } from "../../schools/store/migrate";
import { LearningStore } from "../../schools/store/learning-store";
import { hashPassword } from "../../schools/auth/password";
import type { SqlExecutor } from "../../schools/store/sql";
import {
  classActivityBuckets,
  classBlockEvidence,
  classRoster,
  lastActivityFor,
  subjectIdsOf,
  windowedLearnerStats,
} from "../../schools/teacher/queries";
import { leaderboardCounts } from "../../schools/teacher/leaderboard";
import { runSweep } from "../../schools/reducer/sweep";
import { writeEvents, episodeEvents, at, NOW } from "./simulated-class";

/**
 * School and class isolation, at the layer that actually reads the data.
 *
 * ## Why this file exists and what it caught
 *
 * The audit found that EVERY class-keyed query in `LearningStore` filters on
 * `class_id` alone:
 *
 *     subjectsInClass      -> where class_id = $1
 *     isInClass            -> where subject_id = $1 and class_id = $2
 *     lastActivityForClass -> where s.class_id = $1
 *     learnerStatesForClass-> delegates to subjectsInClass
 *
 * `school_subject_scope` has `school_id` and `class_id` as plain text with no
 * foreign key to `school_classes` and no unique constraint spanning schools. So
 * two schools whose class is called «9А» — or two deployments both left on the
 * shipped default `grade-9a`, which is what `config.pilot.classId` is — share
 * that key, and a teacher at school A reads school B's children.
 *
 * Requirement 45 of the brief calls that a release gate. This file is the gate.
 *
 * ## Two schools, one class id
 *
 * The fixture deliberately gives both schools a class literally named `9a` and
 * puts real work in both, because a test that uses distinct class ids cannot
 * fail the way production would.
 */

let sql: SqlExecutor;
let store: LearningStore;

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";
/** The SAME class id in both schools. This is the whole point of the fixture. */
const CLASS_ID = "9a";

let subjectA = "";
let subjectB = "";
let teacherA = "";
let teacherB = "";

async function account(schoolId: string, role: "student" | "teacher", username: string) {
  const stored = await hashPassword("correct-horse-battery-staple");
  return store.createAccount({
    schoolId,
    role,
    username,
    displayName: username,
    passwordHash: stored.hash,
    passwordSalt: stored.salt,
    /* A person who has finished signing in.
       `createAccount` defaults `must_change_password` to true, which is right
       for a freshly provisioned child and wrong for a fixture that then drives
       the product: every guard now refuses a first-login session with 403
       `password_change_required`. The refusal itself is pinned in
       `tests/school/auth-enforcement.test.ts`; here it would only mean the
       fixture is not a user. */
    mustChangePassword: false,
  });
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  await store.upsertClass(SCHOOL_A, CLASS_ID, "9А");
  await store.upsertClass(SCHOOL_B, CLASS_ID, "9А");

  teacherA = await account(SCHOOL_A, "teacher", "teacher-a");
  teacherB = await account(SCHOOL_B, "teacher", "teacher-b");
  await store.assignTeacher(SCHOOL_A, CLASS_ID, teacherA);
  await store.assignTeacher(SCHOOL_B, CLASS_ID, teacherB);

  const studentA = await account(SCHOOL_A, "student", "student-a");
  const studentB = await account(SCHOOL_B, "student", "student-b");
  await store.enrol(SCHOOL_A, CLASS_ID, studentA);
  await store.enrol(SCHOOL_B, CLASS_ID, studentB);

  subjectA = await store.resolveSubjectForUser(studentA, {
    schoolId: SCHOOL_A,
    classId: CLASS_ID,
  });
  subjectB = await store.resolveSubjectForUser(studentB, {
    schoolId: SCHOOL_B,
    classId: CLASS_ID,
  });

  await writeEvents(sql, [
    ...episodeEvents(subjectA, {
      blockId: "m1.p1",
      daysAgo: 1,
      verdicts: [{ verdict: "accepted", testsPassed: 3, testsTotal: 3 }],
      editsBeforeVerdict: 1,
    }),
    ...episodeEvents(subjectB, {
      blockId: "m1.p2",
      daysAgo: 1,
      verdicts: [{ verdict: "accepted", testsPassed: 3, testsTotal: 3 }],
      editsBeforeVerdict: 1,
    }),
  ]);

  /* The windowed aggregates read `attempt_episodes`, which is a reducer
     projection — events alone are not enough. This is the real sweep. */
  await runSweep(store, { limit: 500, owner: "security-fixture" });
}, 120_000);

afterAll(async () => await sql?.close());

/* -------------------------------------------------------------------------- */

describe("the store's own class-keyed queries are NOT school-scoped", () => {
  /*
   * These are not aspirational tests — they PIN THE DEFECT so that the teacher
   * analytics' own scoping is understood as load-bearing rather than
   * belt-and-braces. If someone later fixes the store, these two flip and the
   * failure is the reminder to simplify the layer above.
   */
  it("subjectsInClass returns both schools' learners for a shared class id", async () => {
    const subjects = await store.subjectsInClass(CLASS_ID);
    expect(subjects).toContain(subjectA);
    expect(subjects).toContain(subjectB);
  });

  it("isInClass says a foreign school's learner is in this class", async () => {
    expect(await store.isInClass(subjectB, CLASS_ID)).toBe(true);
  });
});

describe("the teacher analytics ARE school-scoped", () => {
  it("classRoster returns only this school's learners", async () => {
    const rosterA = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const rosterB = await classRoster(sql, SCHOOL_B, CLASS_ID);

    expect(rosterA).toHaveLength(1);
    expect(rosterB).toHaveLength(1);
    expect(subjectIdsOf(rosterA)).toEqual([subjectA]);
    expect(subjectIdsOf(rosterB)).toEqual([subjectB]);
  });

  it("every windowed aggregate is confined to the subjects it was handed", async () => {
    const rosterA = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const ids = subjectIdsOf(rosterA);

    const from = at(30);
    const to = at(-1);

    const stats = await windowedLearnerStats(sql, ids, from, to);
    expect([...stats.keys()]).toEqual([subjectA]);

    const activity = await lastActivityFor(sql, ids);
    expect([...activity.keys()]).toEqual([subjectA]);

    const buckets = await classActivityBuckets(sql, ids, from, to, "day");
    expect(buckets.reduce((n, b) => n + b.activeLearners, 0)).toBe(1);

    const evidence = await classBlockEvidence(sql, ids, ["m1.p1", "m1.p2"]);
    expect(evidence.every((e) => e.subjectId === subjectA)).toBe(true);
    /* School B's learner solved m1.p2. School A's teacher must not see it. */
    expect(evidence.some((e) => e.blockId === "m1.p2")).toBe(false);

    const board = await leaderboardCounts(sql, ids, from, to, []);
    expect([...board.keys()]).toEqual([subjectA]);
  });

  it("a class that does not exist in this school yields an empty roster", async () => {
    expect(await classRoster(sql, SCHOOL_A, "9z")).toHaveLength(0);
    expect(await classRoster(sql, "school-c", CLASS_ID)).toHaveLength(0);
  });
});

describe("class ownership", () => {
  it("teaches-this-class is read from class_teachers, not from the role", async () => {
    expect(await store.teachesClass(teacherA, SCHOOL_A, CLASS_ID)).toBe(true);
    /* Same class id, different school. "Teacher" is not a key to every class. */
    expect(await store.teachesClass(teacherA, SCHOOL_B, CLASS_ID)).toBe(false);
    expect(await store.teachesClass(teacherB, SCHOOL_A, CLASS_ID)).toBe(false);
  });

  it("classExists is keyed on BOTH school and class", async () => {
    /* Added for the admin branch of `requireClassAccess`, which accepted any
       string at all before this rebuild. A lookup on `class_id` alone would
       reintroduce exactly the hole it was added to close. */
    expect(await store.classExists(SCHOOL_A, CLASS_ID)).toBe(true);
    expect(await store.classExists(SCHOOL_A, "9z")).toBe(false);
    expect(await store.classExists("school-c", CLASS_ID)).toBe(false);
  });

  it("an archived class is not readable", async () => {
    await store.upsertClass(SCHOOL_A, "9x", "9Х");
    await sql.query("update school_classes set archived_at = now() where class_id = '9x'");
    expect(await store.classExists(SCHOOL_A, "9x")).toBe(false);
    expect(await store.classNameFor(SCHOOL_A, "9x")).toBeNull();
  });
});

describe("the roster excludes what a class roll should exclude", () => {
  it("drops withdrawn enrolments and disabled accounts", async () => {
    const withdrawn = await account(SCHOOL_A, "student", "student-withdrawn");
    const disabled = await account(SCHOOL_A, "student", "student-disabled");
    await store.enrol(SCHOOL_A, CLASS_ID, withdrawn);
    await store.enrol(SCHOOL_A, CLASS_ID, disabled);

    expect(await classRoster(sql, SCHOOL_A, CLASS_ID)).toHaveLength(3);

    await sql.query(
      "update class_enrolments set withdrawn_at = now() where user_id = $1",
      [withdrawn],
    );
    await sql.query("update school_accounts set disabled_at = now() where user_id = $1", [
      disabled,
    ]);

    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    expect(roster).toHaveLength(1);
    expect(roster[0].userId).not.toBe(withdrawn);
    expect(roster[0].userId).not.toBe(disabled);
  });
});

describe("the teacher read path does not write", () => {
  it("loading a class leaves last_seen_at and the scope table untouched", async () => {
    /*
     * The endpoint this replaces called `store.resolveSubjectForUser` once per
     * roster learner from a GET handler — 54 writes for eighteen learners. That
     * method bumps `learning_subjects.last_seen_at` and upserts
     * `school_subject_scope`, so a teacher opening the dashboard rewrote every
     * learner's "last seen" and, for a learner enrolled in two classes, STOLE
     * their scope row for whichever class was loaded most recently.
     */
    const before = await sql.query<{ subject_id: string; last_seen_at: string }>(
      "select subject_id, last_seen_at from learning_subjects order by subject_id",
    );
    const scopeBefore = await sql.query<{ subject_id: string; class_id: string }>(
      "select subject_id, class_id from school_subject_scope order by subject_id",
    );

    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const ids = subjectIdsOf(roster);
    await windowedLearnerStats(sql, ids, at(30), at(-1));
    await lastActivityFor(sql, ids);
    await classBlockEvidence(sql, ids, ["m1.p1"]);
    await leaderboardCounts(sql, ids, at(30), at(-1), []);

    const after = await sql.query<{ subject_id: string; last_seen_at: string }>(
      "select subject_id, last_seen_at from learning_subjects order by subject_id",
    );
    const scopeAfter = await sql.query<{ subject_id: string; class_id: string }>(
      "select subject_id, class_id from school_subject_scope order by subject_id",
    );

    expect(after.rows).toEqual(before.rows);
    expect(scopeAfter.rows).toEqual(scopeBefore.rows);
  });

  it("a learner who has never worked is on the roster with no subject", async () => {
    const silent = await account(SCHOOL_B, "student", "student-silent");
    await store.enrol(SCHOOL_B, CLASS_ID, silent);

    const roster = await classRoster(sql, SCHOOL_B, CLASS_ID);
    const row = roster.find((m) => m.userId === silent);

    /* Present, and with a null subject rather than a freshly minted one. A
       read that mints a subject is a read that writes. */
    expect(row).toBeDefined();
    expect(row!.subjectId).toBeNull();
  });
});

describe("the window arithmetic", () => {
  it("is half-open: from is included, to is excluded", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const ids = subjectIdsOf(roster);

    /* The episode is one day before NOW. A window ending exactly at its start
       must not contain it; one starting exactly there must. */
    const episodeDay = new Date(NOW - 86_400_000);
    const dayStart = new Date(
      Date.UTC(
        episodeDay.getUTCFullYear(),
        episodeDay.getUTCMonth(),
        episodeDay.getUTCDate(),
      ),
    ).toISOString();
    const dayEnd = new Date(Date.parse(dayStart) + 86_400_000).toISOString();

    const inside = await windowedLearnerStats(sql, ids, dayStart, dayEnd);
    const before = await windowedLearnerStats(sql, ids, at(30), dayStart);

    expect(inside.get(subjectA)?.episodes ?? 0).toBeGreaterThan(0);
    expect(before.get(subjectA)).toBeUndefined();
  });
});
