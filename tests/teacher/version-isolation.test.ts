import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { classRoster, subjectIdsOf } from "@schools/teacher/queries";
import { CURRICULUM_VERSION, LEGACY_CURRICULUM_VERSION } from "@schools/curriculum/source-of-truth";

/**
 * A teacher console must describe ONE curriculum.
 *
 * ## The bug this was written to catch, and did
 *
 * `classRoster` resolves each enrolled account to a subject with a LEFT JOIN on
 * `learning_subject_aliases`. Before migration 0024 that alias table had one row
 * per account, so the join produced one row per learner and the query was
 * correct without anyone thinking about it.
 *
 * Version scoping gave an account one subject PER CURRICULUM. The same join then
 * matched twice, so every dual-curriculum learner appeared TWICE in the roster
 * with a different subject id each time — a class of eighteen rendering as
 * nineteen names, two of them the same child, and `subjectIdsOf` feeding a
 * doubled id list into every downstream aggregate.
 *
 * Nothing failed loudly. The numbers were simply wrong, which is the failure
 * mode this whole isolation effort exists to remove.
 *
 * ## What is deliberately NOT asserted
 *
 * That Python-era rows are gone. They are the backup and they stay; the rule is
 * that current metrics do not see them, not that they cease to exist. The last
 * test here asks for the historical roster explicitly and expects it back.
 */

let sql: PgliteExecutor;
let store: LearningStore;

/* Text, not uuid: migration 0009's reasoning is that a school is
   "gymnasium-5" and a class is "9А", named by the school rather than by us. */
const SCHOOL = "version-isolation-school";
const CLASS = "9A";

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  await sql.query(
    `insert into school_classes (school_id, class_id, name, created_at)
     values ($1, $2, '9А', now())
     on conflict do nothing`,
    [SCHOOL, CLASS],
  );
}, 60_000);

afterAll(async () => await sql?.close());

/** An enrolled account, resolved into BOTH curricula. */
async function dualCurriculumLearner(name: string): Promise<{
  userId: string;
  python: string;
  cpp: string;
}> {
  const userId = randomUUID();
  await sql.query(
    `insert into school_accounts (user_id, school_id, username, display_name, role,
                                  password_hash, password_salt, must_change_password, created_at)
     values ($1, $2, $3, $4, 'student', 'x', 'y', false, now())`,
    [userId, SCHOOL, `u-${name}`, name],
  );
  await sql.query(
    `insert into class_enrolments (school_id, class_id, user_id, enrolled_at)
     values ($1, $2, $3, now())`,
    [SCHOOL, CLASS, userId],
  );

  const scope = { schoolId: SCHOOL, classId: CLASS };
  const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
  const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);
  return { userId, python, cpp };
}

describe("teacher analytics read one curriculum", () => {
  it("lists a dual-curriculum learner once, with the C++ subject", async () => {
    const learner = await dualCurriculumLearner("Айгүл");

    const roster = await classRoster(sql, SCHOOL, CLASS);
    const mine = roster.filter((m) => m.userId === learner.userId);

    expect(mine.length, "one learner, one roster row").toBe(1);
    expect(mine[0].subjectId, "and it must be the C++ subject").toBe(learner.cpp);
  });

  it("feeds no duplicate subject ids to the aggregates built on the roster", async () => {
    await dualCurriculumLearner("Данияр");

    const ids = subjectIdsOf(await classRoster(sql, SCHOOL, CLASS));
    expect(
      new Set(ids).size,
      "a duplicated id double-counts one child in every number derived from it",
    ).toBe(ids.length);
  });

  it("never attaches a Python-era subject to a current roster row", async () => {
    const learner = await dualCurriculumLearner("Мадина");

    const roster = await classRoster(sql, SCHOOL, CLASS);
    const attached = new Set(roster.map((m) => m.subjectId));

    expect(attached.has(learner.python), "the Python subject must not appear").toBe(false);
    expect(attached.has(learner.cpp)).toBe(true);
  });

  it("still returns the historical roster when explicitly asked", async () => {
    /* Isolation, not destruction. If a product decision later wants the Python
       year back, the data and the query path are both still here. */
    const learner = await dualCurriculumLearner("Ерасыл");

    const historical = await classRoster(sql, SCHOOL, CLASS, LEGACY_CURRICULUM_VERSION);
    const mine = historical.filter((m) => m.userId === learner.userId);

    expect(mine.length).toBe(1);
    expect(mine[0].subjectId).toBe(learner.python);
  });

  it("keeps store-level roster reads on the active curriculum too", async () => {
    const learner = await dualCurriculumLearner("Нұрсұлтан");

    const subjects = await store.subjectsInClass(CLASS);
    expect(subjects).toContain(learner.cpp);
    expect(subjects).not.toContain(learner.python);
  });
});
