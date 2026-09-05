import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import {
  eraseLearner,
  findLearner,
  residualRows,
  TABLE_DISPOSITION,
} from "@schools/legal/erasure";

/**
 * "Данные удаляются вручную по запросу школы" — and now they are.
 *
 * ## What the promise was worth
 *
 * `schools/legal/documents.ts` tells parents, in both languages, that there is
 * no automatic deletion and that data is erased manually at the school's
 * request. The manual path did not exist either: no script, no runbook, and
 * `learning_forget_user` — the function anyone would find first — erased the
 * ledger and left the child.
 *
 * Measured, by seeding one learner with a row in every table and calling it:
 *
 *     school_accounts       1   username, display name, password hash
 *     school_sessions       1   a live session — an erased learner stays signed in
 *     class_enrolments      1
 *     account_preferences   1
 *     nova_usage            1   per-day request counts, keyed by subject
 *     rate_limit_bucket     2   keys built from the user and subject ids
 *
 * It removed the evidence of what a child did and kept the record of who they
 * were. Migration 0025 adds `school_forget_user`, points `solvex_forget_user`
 * at it, and `scripts/erase-learner.ts` wraps it in a dry run, a residual scan
 * and a rollback.
 *
 * ## Why the residual scan is the real assertion
 *
 * Everything below could be written as "and this table is empty", table by
 * table, and it would rot the day somebody adds the thirty-sixth. The scan asks
 * `information_schema` for every base table with a `subject_id`, a `user_id` or
 * a `bucket_key` and counts what still matches — so a table nobody remembered
 * is a failure rather than a silence. Both misses in 0025 were exactly that
 * kind of table.
 */

let sql: PgliteExecutor;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

interface Seeded {
  userId: string;
  subjectId: string;
  schoolId: string;
  classId: string;
  username: string;
}

/**
 * One learner with a row in every table erasure has to reach.
 *
 * Written against the real constraints — `task_kind`, `trigger`, the composite
 * key `human_reviews` needs — rather than through the store, so the fixture
 * cannot quietly stop covering a table because a product path changed.
 */
async function seedLearner(username: string): Promise<Seeded> {
  const userId = randomUUID();
  const subjectId = randomUUID();
  const schoolId = randomUUID();
  const classId = randomUUID();
  const episodeId = randomUUID();
  const submissionId = randomUUID();
  const q = (text: string, params: unknown[] = []) => sql.query(text, params);

  await q(`insert into school_classes (school_id, class_id, name) values ($1,$2,'9A')`, [schoolId, classId]);
  await q(
    `insert into school_accounts (user_id, school_id, role, username, display_name, password_hash, password_salt)
     values ($1,$2,'student',$3,'Айгүл','hash','salt')`,
    [userId, schoolId, username],
  );
  await q(`insert into class_enrolments (school_id, class_id, user_id) values ($1,$2,$3)`, [schoolId, classId, userId]);
  await q(
    `insert into school_sessions (session_id, token_hash, user_id, expires_at)
     values ($1,$2,$3, now() + interval '1 day')`,
    [randomUUID(), randomUUID(), userId],
  );
  await q(`insert into account_preferences (user_id, prefs) values ($1,'{"locale":"kk"}'::jsonb)`, [userId]);
  await q(`insert into learning_subjects (subject_id, user_id) values ($1,$2)`, [subjectId, userId]);
  await q(`insert into school_subject_scope (subject_id, school_id, class_id) values ($1,$2,$3)`, [subjectId, schoolId, classId]);
  await q(
    `insert into learning_events
       (event_id, subject_id, episode_id, session_id, seq, event_name, event_version,
        occurred_at, source_trust, environment, payload)
     values ($1,$2,$3,$4,1,'attempt_submitted',1, now(),'judge','development','{"code":"cout << 7 * 8;"}'::jsonb)`,
    [randomUUID(), subjectId, episodeId, randomUUID()],
  );
  await q(
    `insert into attempt_episodes
       (episode_id, subject_id, task_ref, task_kind, attempt_ordinal, opened_at, reducer_version)
     values ($1,$2,'sx-lesson:m1.l1.b5','lesson',1, now(), 1)`,
    [episodeId, subjectId],
  );
  await q(
    `insert into interventions
       (intervention_id, subject_id, episode_id, kind, level, trigger, mode, delivered_at)
     values ($1,$2,$3,'hint',1,'learner_requested','tutor', now())`,
    [randomUUID(), subjectId, episodeId],
  );
  await q(`insert into lesson_completions (subject_id, lesson_id, correct, wrong, unmeasured, attempts) values ($1,'m1.l1',1,0,0,1)`, [subjectId]);
  await q(
    `insert into learning_submissions (subject_id, submission_id, block_id, episode_id, answer)
     values ($1,$2,'m1.l1.b5',$3,'{"source":"cout << 7 * 8;"}'::jsonb)`,
    [subjectId, submissionId, episodeId],
  );
  await q(
    `insert into human_reviews (subject_id, submission_id, reviewed_by, disposition)
     values ($1,$2,$3,'reviewed')`,
    [subjectId, submissionId, userId],
  );
  await q(
    `insert into review_schedule
       (review_id, subject_id, block_id, reason, origin_level, origin_episode_id, origin_at, due_at)
     values ($1,$2,'m1.l1.b5','solved_with_assistance',3,$3, now(), now())`,
    [randomUUID(), subjectId, episodeId],
  );
  await q(`insert into learner_state (subject_id, episodes, state_version) values ($1,1,1)`, [subjectId]);
  await q(`insert into nova_usage (subject_id, usage_day, requests) values ($1, current_date, 3)`, [subjectId]);
  await q(`insert into rate_limit_bucket (bucket_key, tokens) values ($1, 5)`, [`submit:${subjectId}`]);
  await q(`insert into rate_limit_bucket (bucket_key, tokens) values ($1, 5)`, [`password-change:${userId}`]);

  return { userId, subjectId, schoolId, classId, username };
}

describe("the erasure plan and the schema", () => {
  it("has an answer for every table in the database", async () => {
    const tables = await sql.query<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'
        order by table_name`,
    );
    const known = new Set(Object.keys(TABLE_DISPOSITION));
    const unclassified = tables.rows.map((r) => r.table_name).filter((t) => !known.has(t));

    expect(tables.rows.length, "the walk must find the schema").toBeGreaterThan(30);
    expect(
      unclassified,
      `these tables have no erasure disposition. Add them to TABLE_DISPOSITION in\n` +
        `schools/legal/erasure.ts — as erased, or as retained WITH A REASON:\n  ${unclassified.join("\n  ")}`,
    ).toEqual([]);
  });

  it("does not carry a disposition for a table that no longer exists", async () => {
    /* The mirror. A stale entry is how a list stops describing the schema and
       starts describing what somebody remembered. */
    const tables = await sql.query<{ table_name: string }>(
      `select table_name from information_schema.tables
        where table_schema = 'public' and table_type = 'BASE TABLE'`,
    );
    const real = new Set(tables.rows.map((r) => r.table_name));
    expect(Object.keys(TABLE_DISPOSITION).filter((t) => !real.has(t))).toEqual([]);
  });

  it("gives a reason for everything it keeps", () => {
    for (const [table, disposition] of Object.entries(TABLE_DISPOSITION)) {
      if (disposition.startsWith("erased")) continue;
      expect(disposition.length, `${table}: "retained" needs a reason`).toBeGreaterThan(30);
    }
  });
});

describe("erasing one learner", () => {
  it("leaves nothing behind, checked against the live schema", async () => {
    const seeded = await seedLearner("pupil-01");
    const identity = await findLearner(sql, { schoolId: seeded.schoolId, username: "pupil-01" });
    expect(identity, "the learner must be found by school and username").not.toBeNull();
    expect(identity!.subjectIds).toContain(seeded.subjectId);

    const before = await residualRows(sql, identity!);
    /* The floor. An erasure test whose fixture wrote nothing would pass having
       deleted nothing, which is the exact shape of the gate this file replaces. */
    expect(before.map((r) => r.table)).toEqual(
      expect.arrayContaining([
        "school_accounts",
        "school_sessions",
        "class_enrolments",
        "account_preferences",
        "nova_usage",
        "rate_limit_bucket",
        "learning_events",
        "attempt_episodes",
        "learning_subjects",
      ]),
    );

    const counts = await eraseLearner(sql, identity!);
    expect(counts.find((c) => c.table === "school_accounts")?.rows).toBe(1);
    expect(counts.find((c) => c.table === "school_sessions")?.rows).toBe(1);
    expect(counts.find((c) => c.table === "learning_events")?.rows).toBe(1);

    const after = await residualRows(sql, identity!);
    expect(
      after,
      `rows still naming an erased learner:\n  ${after.map((r) => `${r.table}.${r.column}: ${r.rows}`).join("\n  ")}`,
    ).toEqual([]);
  });

  it("takes the tables the ledger function forgets", async () => {
    /*
     * The six that survived `learning_forget_user`, named individually. If a
     * later migration re-splits erasure and one of these falls out again, the
     * scan above would catch it — this catches WHICH, which is the difference
     * between a failure someone can fix and a failure someone reruns.
     */
    const seeded = await seedLearner("pupil-02");
    const identity = (await findLearner(sql, { userId: seeded.userId }))!;
    await eraseLearner(sql, identity);

    for (const [table, where, param] of [
      ["school_accounts", "user_id = $1", seeded.userId],
      ["school_sessions", "user_id = $1", seeded.userId],
      ["class_enrolments", "user_id = $1", seeded.userId],
      ["account_preferences", "user_id = $1", seeded.userId],
      ["nova_usage", "subject_id = $1", seeded.subjectId],
      ["rate_limit_bucket", "bucket_key like '%' || $1 || '%'", seeded.subjectId],
    ] as const) {
      const r = await sql.query<{ n: number }>(
        `select count(*)::int as n from ${table} where ${where}`,
        [param],
      );
      expect(Number(r.rows[0]!.n), `${table} survived erasure`).toBe(0);
    }
  });

  it("does not touch the learner sitting next to them", async () => {
    /* The property that makes this safe to run on a live pilot database. The
       two learners share a school and a class, and one of them asked to be
       forgotten. */
    const gone = await seedLearner("pupil-03");
    const stays = await seedLearner("pupil-04");
    const identity = (await findLearner(sql, { userId: gone.userId }))!;
    await eraseLearner(sql, identity);

    const other = (await findLearner(sql, { userId: stays.userId }))!;
    const left = await residualRows(sql, other);
    expect(left.map((r) => r.table)).toEqual(
      expect.arrayContaining(["school_accounts", "learning_events", "learning_subjects"]),
    );
  });

  it("refuses a teacher, and says what to do instead", async () => {
    /* `curriculum_publications.reviewer_id` is the record of which adult
       approved a month of curriculum for children. Deleting a teacher destroys
       that trail, and the operator needs to be told the alternative rather than
       left to work one out. */
    const seeded = await seedLearner("teacher-01");
    await sql.query(`update school_accounts set role = 'teacher' where user_id = $1`, [seeded.userId]);
    const identity = (await findLearner(sql, { userId: seeded.userId }))!;

    await expect(eraseLearner(sql, identity)).rejects.toThrow(/disabled_at/);

    /* And refusing means refusing: nothing was deleted on the way to the throw. */
    const still = await sql.query<{ n: number }>(
      `select count(*)::int as n from school_accounts where user_id = $1`,
      [seeded.userId],
    );
    expect(Number(still.rows[0]!.n)).toBe(1);
  });

  it("finds every subject an account has, not one of them", async () => {
    /*
     * The curriculum split gives one account a Python subject and a C++ one.
     * `findLearner` unions the direct binding with the alias table, because a
     * subject that lost its `user_id` in a merge is still that child's.
     */
    const seeded = await seedLearner("pupil-05");
    /* A second curriculum version, which is the real reason an account has two
       subjects — `learning_subjects_user_version_key` allows exactly one per
       version, and the Python-era subject is the other one. */
    const second = randomUUID();
    await sql.query(
      `insert into learning_subjects (subject_id, user_id, curriculum_version) values ($1,$2,'python-year1-v1')`,
      [second, seeded.userId],
    );
    const third = randomUUID();
    await sql.query(`insert into learning_subjects (subject_id) values ($1)`, [third]);
    await sql.query(
      `insert into learning_subject_aliases (alias_kind, alias_value, subject_id)
       values ('user_id', $1, $2)`,
      [seeded.userId, third],
    );

    const identity = (await findLearner(sql, { userId: seeded.userId }))!;
    expect(identity.subjectIds.sort()).toEqual([seeded.subjectId, second, third].sort());

    await eraseLearner(sql, identity);
    const left = await sql.query<{ n: number }>(
      `select count(*)::int as n from learning_subjects where subject_id = any($1::uuid[])`,
      [[seeded.subjectId, second, third]],
    );
    expect(Number(left.rows[0]!.n), "every subject goes, or none of it counts").toBe(0);
  });
});
