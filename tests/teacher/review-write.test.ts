import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "../../schools/store/pglite-driver";
import { migrate } from "../../schools/store/migrate";
import { LearningStore } from "../../schools/store/learning-store";
import { hashPassword } from "../../schools/auth/password";
import type { SqlExecutor } from "../../schools/store/sql";
import { classRoster, subjectIdsOf } from "../../schools/teacher/queries";
import { recordReview, reviewQueue, storedResponses } from "../../schools/teacher/review";
import { humanMarkedAssessmentBlocks, writeSubmissions } from "./simulated-class";

/**
 * Recording that a teacher has read a learner's answer.
 *
 * ## Why this file asserts ROWS, not status codes
 *
 * Every other guard on this surface is a `readFileSync` source scan, which is
 * the honest substitute for a renderer this repo does not have. A source scan
 * cannot tell a POST that writes from a POST that returns 200 and writes
 * nothing, and that is exactly the defect a review button would have. So every
 * test here reads the row back out of the same handle it was written through.
 */

let sql: SqlExecutor;
let store: LearningStore;

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";
/** The SAME class id in both schools. Class ids are author-chosen and collide. */
const CLASS_ID = "9a";

let teacherA = "";
let teacherA2 = "";
let subjectA = "";
let subjectB = "";
let submissionA = "";
let submissionB = "";
let blockId = "";

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

/** A learner in a named school, holding one settled written answer. */
async function learner(schoolId: string, username: string, text: string) {
  const userId = await account(schoolId, "student", username);
  await store.enrol(schoolId, CLASS_ID, userId);
  const subjectId = await store.resolveSubjectForUser(userId, { schoolId, classId: CLASS_ID });
  await writeSubmissions(sql, [{ subjectId, spec: { blockId, text, daysAgo: 1 } }]);
  const r = await sql.query<{ submission_id: string }>(
    "select submission_id from learning_submissions where subject_id = $1",
    [subjectId],
  );
  return { subjectId, submissionId: r.rows[0].submission_id };
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  blockId = humanMarkedAssessmentBlocks()[0].id;

  await store.upsertClass(SCHOOL_A, CLASS_ID, "9А");
  await store.upsertClass(SCHOOL_B, CLASS_ID, "9А");

  teacherA = await account(SCHOOL_A, "teacher", "teacher-a");
  teacherA2 = await account(SCHOOL_A, "teacher", "teacher-a2");
  await store.assignTeacher(SCHOOL_A, CLASS_ID, teacherA);
  await store.assignTeacher(SCHOOL_A, CLASS_ID, teacherA2);

  const a = await learner(SCHOOL_A, "student-a", "Школа А: я считал время в минутах.");
  const b = await learner(SCHOOL_B, "student-b", "Школа Б: границу проверял через <=.");
  subjectA = a.subjectId;
  submissionA = a.submissionId;
  subjectB = b.subjectId;
  submissionB = b.submissionId;
}, 120_000);

afterAll(async () => await sql?.close());

/** The state of one artifact, straight from the table. */
async function rowFor(subjectId: string, submissionId: string) {
  const r = await sql.query<{
    disposition: string;
    reviewed_by: string;
    reviewed_at: string;
  }>(
    `select disposition, reviewed_by, reviewed_at from human_reviews
      where subject_id = $1 and submission_id = $2`,
    [subjectId, submissionId],
  );
  return r.rows[0] ?? null;
}

async function countRows(subjectId: string) {
  const r = await sql.query<{ n: number }>(
    "select count(*)::int as n from human_reviews where subject_id = $1",
    [subjectId],
  );
  return Number(r.rows[0].n);
}

/* -------------------------------------------------------------------------- */
/* It writes, and the write is visible to the reads                           */
/* -------------------------------------------------------------------------- */

describe("recording a review", () => {
  it("writes a row and returns what was stored", async () => {
    const out = await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: [blockId],
    });

    expect(out).not.toBeNull();
    expect(out!.disposition).toBe("reviewed");
    expect(out!.reviewedBy).toBe(teacherA);

    const row = await rowFor(subjectA, submissionA);
    expect(row?.disposition).toBe("reviewed");
    expect(row?.reviewed_by).toBe(teacherA);
  });

  it("is visible to the queue the teacher reads", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const claims = await reviewQueue(sql, subjectIdsOf(roster), [blockId]);
    expect(claims).toHaveLength(1);
    expect(claims[0].submissionId).toBe(submissionA);
    expect(claims[0].review?.disposition).toBe("reviewed");
  });

  it("is visible to the panel that shows the learner's words", async () => {
    const responses = await storedResponses(sql, subjectA, [blockId]);
    expect(responses[0].submissionId).toBe(submissionA);
    expect(responses[0].review?.disposition).toBe("reviewed");
    /* The words are still there. Recording a reading does not consume it. */
    expect(responses[0].text).toBe("Школа А: я считал время в минутах.");
  });

  it("stores no score, because there is no column for one", async () => {
    const cols = await sql.query<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_name = 'human_reviews' order by column_name`,
    );
    /* Migration 0016's argument, applied here: the absent column IS the
       guarantee. A rule that a teacher's reading is never a grade is a rule
       someone eventually works around; a schema with nowhere to write one is
       not. */
    expect(cols.rows.map((c) => c.column_name)).toEqual([
      "disposition",
      "reviewed_at",
      "reviewed_by",
      "subject_id",
      "submission_id",
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* Idempotency and the change contract                                        */
/* -------------------------------------------------------------------------- */

describe("a double click, and a change of mind", () => {
  it("marking the same thing twice leaves one row and does not move the clock", async () => {
    const before = await rowFor(subjectA, submissionA);
    await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: [blockId],
    });
    const after = await rowFor(subjectA, submissionA);

    expect(await countRows(subjectA)).toBe(1);
    /* The same decision again is a genuine no-op. A timestamp that crept
       forward on every retry would make "when was this decided" a function of
       how many times a button was pressed. */
    expect(after?.reviewed_at).toEqual(before?.reviewed_at);
  });

  it("concurrent identical requests settle to one row", async () => {
    await Promise.all(
      Array.from({ length: 6 }, () =>
        recordReview(sql, {
          subjectId: subjectA,
          submissionId: submissionA,
          reviewedBy: teacherA,
          disposition: "reviewed",
          blockIds: [blockId],
        }),
      ),
    );
    expect(await countRows(subjectA)).toBe(1);
  });

  it("a SECOND teacher re-pressing the same decision changes nothing at all", async () => {
    /*
     * The defect this pins was found by three independent reviewers and is the
     * one this table cannot afford. The upsert used to freeze `reviewed_at` on
     * an unchanged disposition while still overwriting `reviewed_by` — so on a
     * co-taught class, teacher B opening an artifact already marked «Прочитано»
     * and pressing the lit button (an ordinary click, not an attack) produced a
     * row asserting that B read the work at A's timestamp. An adult attributed
     * to a moment they did nothing, in the one table whose whole content is who
     * read this and when, with no history to recover A from.
     *
     * Reviewer and timestamp now move together or not at all.
     */
    const before = await rowFor(subjectA, submissionA);
    expect(before?.reviewed_by).toBe(teacherA);

    await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA2,
      disposition: "reviewed",
      blockIds: [blockId],
    });

    const after = await rowFor(subjectA, submissionA);
    expect(after?.reviewed_by).toBe(teacherA);
    expect(after?.reviewed_at).toEqual(before?.reviewed_at);
    expect(await countRows(subjectA)).toBe(1);
  });

  it("changing the decision replaces it, and moves the clock", async () => {
    const before = await rowFor(subjectA, submissionA);
    const out = await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA2,
      disposition: "needs_followup",
      blockIds: [blockId],
    });

    expect(out!.disposition).toBe("needs_followup");
    expect(await countRows(subjectA)).toBe(1);

    const after = await rowFor(subjectA, submissionA);
    expect(after?.disposition).toBe("needs_followup");
    /* A CHANGE moves reviewer and timestamp together — the person who raised
       the follow-up, and when they raised it. */
    expect(after?.reviewed_by).toBe(teacherA2);
    expect(new Date(after!.reviewed_at).getTime()).toBeGreaterThanOrEqual(
      new Date(before!.reviewed_at).getTime(),
    );
  });

  it("and back again, with no history left behind", async () => {
    await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: [blockId],
    });
    expect((await rowFor(subjectA, submissionA))?.disposition).toBe("reviewed");
    /* No history, deliberately: nothing in the product reports on how a
       teacher's mind changed, and an append-only log of staff decisions about
       named children is a surveillance surface nobody asked for. */
    expect(await countRows(subjectA)).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* What the statement itself refuses                                          */
/* -------------------------------------------------------------------------- */

describe("the write cannot be pointed somewhere else", () => {
  it("refuses a submission belonging to another school's learner", async () => {
    /* The case that makes the fixture meaningful: both schools run a class
       called `9a`, and School A's teacher is authorised for THEIR 9a. Naming
       School B's submission under School A's subject id selects nothing. */
    const out = await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionB,
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: [blockId],
    });
    expect(out).toBeNull();
    expect(await rowFor(subjectB, submissionB)).toBeNull();
  });

  it("refuses a block the curriculum does not ask a human to mark", async () => {
    const out = await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: ["m1.as.b1"], // the coding half
    });
    expect(out).toBeNull();
  });

  it("refuses an empty allowlist without touching the database", async () => {
    const out = await recordReview(sql, {
      subjectId: subjectA,
      submissionId: submissionA,
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: [],
    });
    expect(out).toBeNull();
  });

  it("refuses a submission id that does not exist", async () => {
    const out = await recordReview(sql, {
      subjectId: subjectA,
      submissionId: randomUUID(),
      reviewedBy: teacherA,
      disposition: "reviewed",
      blockIds: [blockId],
    });
    expect(out).toBeNull();
  });

  it("refuses a disposition outside the closed vocabulary", async () => {
    await expect(
      sql.query(
        `insert into human_reviews (subject_id, submission_id, reviewed_by, disposition)
         values ($1,$2,$3,'excellent')`,
        [subjectA, submissionA, teacherA],
      ),
    ).rejects.toThrow();
  });
});

/* -------------------------------------------------------------------------- */
/* A rewrite re-opens the queue                                               */
/* -------------------------------------------------------------------------- */

describe("a learner who rewrites their answer after feedback", () => {
  it("returns to the queue, because nobody has read the new words", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const ids = subjectIdsOf(roster);

    /* Reviewed, and therefore not pending. */
    expect((await reviewQueue(sql, ids, [blockId]))[0].review).not.toBeNull();

    await writeSubmissions(sql, [
      { subjectId: subjectA, spec: { blockId, text: "Переписал: граница на 1050 минутах.", daysAgo: 0 } },
    ]);

    const after = await reviewQueue(sql, ids, [blockId]);
    expect(after).toHaveLength(1);
    /* A new artifact, and no review of it. This is the whole reason the key is
       (subject_id, submission_id) and not (subject_id, block_id). */
    expect(after[0].submissionId).not.toBe(submissionA);
    expect(after[0].review).toBeNull();

    const panel = await storedResponses(sql, subjectA, [blockId]);
    expect(panel[0].text).toBe("Переписал: граница на 1050 минутах.");
    expect(panel[0].review).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* Erasure                                                                    */
/* -------------------------------------------------------------------------- */

describe("consent revocation takes the reviews with it", () => {
  it("erasing a learner deletes every review of their work, transitively", async () => {
    const userId = await account(SCHOOL_A, "student", "student-erase");
    await store.enrol(SCHOOL_A, CLASS_ID, userId);
    const subjectId = await store.resolveSubjectForUser(userId, {
      schoolId: SCHOOL_A,
      classId: CLASS_ID,
    });
    await writeSubmissions(sql, [
      { subjectId, spec: { blockId, text: "Стереть меня.", daysAgo: 1 } },
    ]);
    const s = await sql.query<{ submission_id: string }>(
      "select submission_id from learning_submissions where subject_id = $1",
      [subjectId],
    );
    await recordReview(sql, {
      subjectId,
      submissionId: s.rows[0].submission_id,
      reviewedBy: teacherA,
      disposition: "needs_followup",
      blockIds: [blockId],
    });
    expect(await countRows(subjectId)).toBe(1);

    /* The whole chain, and it must not need a new statement in the function:
       learning_forget_user deletes learning_subjects -> learning_submissions
       cascades -> human_reviews cascades. */
    await sql.query("select * from learning_forget_user($1)", [userId]);

    expect(await countRows(subjectId)).toBe(0);
    const left = await sql.query<{ n: number }>(
      "select count(*)::int as n from learning_submissions where subject_id = $1",
      [subjectId],
    );
    expect(Number(left.rows[0].n)).toBe(0);
  });

  it("and a bare foreign key would have made revocation fail outright", async () => {
    /* The defect migration 0007 had to go back and fix, and the reason five
       migrations repeat the same sentence. Asserted on the schema rather than
       trusted to the prose. */
    const r = await sql.query<{ confdeltype: string }>(
      `select c.confdeltype
         from pg_constraint c
        where c.conrelid = 'human_reviews'::regclass
          and c.contype = 'f'
          and c.confrelid = 'learning_submissions'::regclass`,
    );
    expect(r.rows[0]?.confdeltype).toBe("c"); // c = cascade
  });

  it("but the reviewer's own account cannot be deleted out from under it", async () => {
    /* A review is an approval record, not a membership row: the precedent is
       curriculum_publications.reviewer_id, which is a bare FK. Cascading here
       would erase the record of who read a child's work when a member of staff
       leaves — and staff are disabled, never deleted, so this forbids exactly
       one thing and it is the thing it should forbid. */
    const r = await sql.query<{ confdeltype: string }>(
      `select c.confdeltype
         from pg_constraint c
        where c.conrelid = 'human_reviews'::regclass
          and c.contype = 'f'
          and c.confrelid = 'school_accounts'::regclass`,
    );
    expect(r.rows[0]?.confdeltype).toBe("a"); // a = no action
  });
});

/* -------------------------------------------------------------------------- */
/* The counter must be able to reach zero                                     */
/* -------------------------------------------------------------------------- */

describe("the pending count", () => {
  it("counts only unresolved rows, and a follow-up is resolved", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const ids = subjectIdsOf(roster);
    const pending = async () =>
      (await reviewQueue(sql, ids, [blockId])).filter((c) => c.review === null).length;

    /* Everything in this school's class, unreviewed. */
    await sql.query("delete from human_reviews");
    const all = (await reviewQueue(sql, ids, [blockId])).length;
    expect(await pending()).toBe(all);

    for (const claim of await reviewQueue(sql, ids, [blockId])) {
      await recordReview(sql, {
        subjectId: claim.subjectId,
        submissionId: claim.submissionId,
        reviewedBy: teacherA,
        /* Alternating, because a follow-up must ALSO leave the pending count.
           A person read it and decided something; that is not outstanding. */
        disposition: claim.readable ? "reviewed" : "needs_followup",
        blockIds: [blockId],
      });
    }

    /* Zero. This is the whole point of migration 0022: the number that used to
       be stuck at the size of the class can now be worked down to nothing. */
    expect(await pending()).toBe(0);
  });

  it("an unreadable submission is still resolvable, or the count sticks forever", async () => {
    /*
     * A pre-0021 row has no text to read, and the first build gave it an inert
     * chip instead of a control — so a queue containing one could never reach
     * zero from the marking screen, which is exactly the defect this table was
     * added to remove. The learner did the work; the platform lost the words;
     * the teacher still owes them something and must be able to record it.
     */
    const userId = await account(SCHOOL_A, "student", "student-legacy-count");
    await store.enrol(SCHOOL_A, CLASS_ID, userId);
    const subjectId = await store.resolveSubjectForUser(userId, {
      schoolId: SCHOOL_A,
      classId: CLASS_ID,
    });
    await writeSubmissions(sql, [
      { subjectId, spec: { blockId, text: "", daysAgo: 1, artifactMissing: true } },
    ]);

    const [claim] = await reviewQueue(sql, [subjectId], [blockId]);
    expect(claim.readable).toBe(false);
    expect(claim.review).toBeNull();

    const out = await recordReview(sql, {
      subjectId,
      submissionId: claim.submissionId,
      reviewedBy: teacherA,
      disposition: "needs_followup",
      blockIds: [blockId],
    });
    expect(out).not.toBeNull();
    expect((await reviewQueue(sql, [subjectId], [blockId]))[0].review).not.toBeNull();
  });
});
