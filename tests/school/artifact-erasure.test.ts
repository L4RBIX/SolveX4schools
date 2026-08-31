import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Submitted work is erased with the learner.
 *
 * ## Why this is a test and not a change
 *
 * `learning_forget_user` never mentions `learning_submissions`, so the obvious
 * reading is that migration 0021's `answer` column outlives erasure. It does
 * not: migration 0019 declares
 *
 *     subject_id uuid not null references learning_subjects(subject_id)
 *                on delete cascade
 *
 * and the function's last act is `delete from learning_subjects`. The cascade
 * takes the submissions — and therefore the artifacts — with it.
 *
 * That is the right design (one deletion path, not two), and it is also fragile
 * in a specific way: the ONLY thing standing between a forgotten learner and
 * their retained source code is that foreign key. Someone recreating the table,
 * or "tidying" the constraint to `no action` to fix a test, would silently turn
 * erasure into a lie. So the cascade is asserted directly, and the end-to-end
 * erasure is asserted through the real function.
 */

process.env.LEARNING_DATA_DIR = "memory://";

type Handle = Awaited<ReturnType<typeof import("@schools/store").getStoreHandle>>;
let sql: Handle["sql"];

beforeAll(async () => {
  ({ sql } = await (await import("@schools/store")).getStoreHandle());
}, 90_000);

const SOURCE = "a = int(input())  # Сәлем — құпия жұмыс\nprint(a * 2)";

async function learnerWithSubmittedWork() {
  const userId = randomUUID();
  const subjectId = randomUUID();
  await sql.query(
    `insert into learning_subjects (subject_id, user_id) values ($1, $2)`,
    [subjectId, userId],
  );
  await sql.query(
    `insert into learning_submissions
       (subject_id, submission_id, block_id, episode_id, settled_at, verdict, response, answer)
     values ($1, $2, 'm1.l12.b2', $3, now(), 'correct', $4::jsonb, $5::jsonb)`,
    [
      subjectId,
      randomUUID(),
      randomUUID(),
      JSON.stringify({ verdict: "correct" }),
      JSON.stringify({ kind: "text", value: SOURCE }),
    ],
  );
  return { userId, subjectId };
}

describe("the cascade that erasure depends on", () => {
  it("is a real ON DELETE CASCADE, not a comment", async () => {
    /* Postgres reports `c` for cascade. PGlite is Postgres, so this reads the
       same on both. If this ever returns `a`, erasure has quietly stopped
       removing submitted work and nothing else in the suite would notice. */
    const r = await sql.query<{ confdeltype: string }>(
      `select confdeltype from pg_constraint
        where conrelid = 'learning_submissions'::regclass and contype = 'f'`,
    );
    expect(r.rows.length, "the subject foreign key must exist").toBeGreaterThan(0);
    expect(r.rows.map((x) => x.confdeltype)).toContain("c");
  });
});

describe("learning_forget_user removes submitted work", () => {
  it("leaves no artifact behind for the erased learner", async () => {
    const { userId, subjectId } = await learnerWithSubmittedWork();

    const before = await sql.query<{ n: number }>(
      `select count(*)::int as n from learning_submissions
        where subject_id = $1 and answer is not null`,
      [subjectId],
    );
    expect(Number(before.rows[0].n), "the learner has stored work to erase").toBe(1);

    await sql.query(`select * from learning_forget_user($1)`, [userId]);

    const after = await sql.query<{ n: number }>(
      `select count(*)::int as n from learning_submissions where subject_id = $1`,
      [subjectId],
    );
    expect(Number(after.rows[0].n), "no submission row may survive").toBe(0);
  });

  it("leaves the SOURCE TEXT nowhere in the table", async () => {
    /* Stronger than counting rows for the erased subject, and it is the claim
       that actually matters to a school: after erasure, the child's writing is
       not in the database. Searched across every row, not just theirs. */
    const { userId } = await learnerWithSubmittedWork();
    await sql.query(`select * from learning_forget_user($1)`, [userId]);

    const leftovers = await sql.query<{ n: number }>(
      `select count(*)::int as n from learning_submissions
        where answer::text like '%құпия жұмыс%'`,
    );
    expect(Number(leftovers.rows[0].n), "the submitted text must be gone").toBe(0);
  });

  it("does not disturb another learner's work", async () => {
    /* The complement. An erasure that took everyone's submissions with it would
       pass both tests above and be catastrophic. */
    const victim = await learnerWithSubmittedWork();
    const bystander = await learnerWithSubmittedWork();

    await sql.query(`select * from learning_forget_user($1)`, [victim.userId]);

    const kept = await sql.query<{ n: number }>(
      `select count(*)::int as n from learning_submissions
        where subject_id = $1 and answer is not null`,
      [bystander.subjectId],
    );
    expect(Number(kept.rows[0].n), "the bystander keeps their work").toBe(1);
  });
});
