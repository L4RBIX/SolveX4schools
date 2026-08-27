import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";

/**
 * Reading the learner's own mistakes out of the ledger, and keeping the ones
 * they chose to keep.
 *
 * Against real Postgres (PGlite), because what is asserted is SQL: a jsonb
 * filter, a grouped count, and a subquery whose only job is to stop three
 * retries being reported as nine mistakes.
 */

const SUBJECT = "66666666-6666-4666-8666-666666666666";
const OTHER = "77777777-7777-4777-8777-777777777777";

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

let seq = 0;

/** One graded attempt, written the way `/api/learning/submit` writes it. */
async function attempt(opts: {
  subject: string;
  episodeId: string;
  blockId: string;
  failureClass: string;
  attributed: boolean;
  at: string;
}) {
  const session = randomUUID();
  const common = {
    subject: opts.subject,
    episode: opts.episodeId,
    session,
    at: opts.at,
  };
  /* An `episode_opened` on EVERY attempt, because that is what the submit route
     actually does — the episode id is reused across retries of the same block.
     Seeding it faithfully is the point of this helper. */
  await event({
    ...common,
    name: "episode_opened",
    trust: "server",
    payload: { task_ref: `sx-lesson:${opts.blockId}`, task_kind: "lesson" },
  });
  await event({
    ...common,
    name: "verdict_received",
    trust: "judge",
    payload: { verdict: "wrong_answer", task_ref: `sx-lesson:${opts.blockId}` },
  });
  await event({
    ...common,
    name: "failure_attributed",
    trust: "verifier",
    payload: {
      failure_class: opts.attributed ? opts.failureClass : "unattributed_failure",
      attribution_source: opts.attributed
        ? "curriculum_diagnostic_mapping"
        : "no_declared_mapping",
      confidence: opts.attributed ? 0.9 : 0,
      attribution_version: 1,
    },
  });
}

async function event(row: {
  subject: string;
  episode: string;
  session: string;
  at: string;
  name: string;
  trust: string;
  payload: Record<string, unknown>;
}) {
  seq += 1;
  await sql.query(
    `insert into learning_events
       (event_id, subject_id, episode_id, session_id, seq, event_name,
        occurred_at, received_at, source_trust, environment, cohort, route, payload)
     values ($1,$2,$3,$4,$5,$6,$7,$7,$8,'development','public','/lesson/x',$9::jsonb)`,
    [
      randomUUID(),
      row.subject,
      row.episode,
      row.session,
      seq,
      row.name,
      row.at,
      row.trust,
      JSON.stringify(row.payload),
    ],
  );
}

const EPISODE_A = "aaaaaaaa-0000-4000-8000-000000000001";
const EPISODE_B = "aaaaaaaa-0000-4000-8000-000000000002";
const EPISODE_C = "aaaaaaaa-0000-4000-8000-000000000003";

describe("attributedMistakes", () => {
  beforeAll(async () => {
    // Three retries of the SAME block, all in one episode, all attributed.
    for (const n of [1, 2, 3]) {
      await attempt({
        subject: SUBJECT,
        episodeId: EPISODE_A,
        blockId: "m1.l3.b3",
        failureClass: "remainder_vs_quotient_swap",
        attributed: true,
        at: `2026-08-2${n}T10:00:00Z`,
      });
    }
    // A different block, once.
    await attempt({
      subject: SUBJECT,
      episodeId: EPISODE_B,
      blockId: "m1.l5.b2",
      failureClass: "elif_chain_short_circuit_missed",
      attributed: true,
      at: "2026-08-24T10:00:00Z",
    });
    // A failure nobody explained.
    await attempt({
      subject: SUBJECT,
      episodeId: EPISODE_C,
      blockId: "m1.l1.b2",
      failureClass: "irrelevant",
      attributed: false,
      at: "2026-08-25T10:00:00Z",
    });
    // Another learner, same mistake.
    await attempt({
      subject: OTHER,
      episodeId: "bbbbbbbb-0000-4000-8000-000000000001",
      blockId: "m1.l3.b3",
      failureClass: "remainder_vs_quotient_swap",
      attributed: true,
      at: "2026-08-26T10:00:00Z",
    });
  });

  it("counts a repeated mistake once per attempt, not once per pair of events", async () => {
    /* The reason the query collapses `episode_opened` to one row per episode
       first. The submit route writes an opened event on every retry, so a
       direct join between the two event streams turns three attempts into nine
       — and a dictionary that tells a fourteen-year-old they made the same
       mistake nine times when they made it three is a fabricated number with
       the authority of a count. */
    const rows = await store.attributedMistakes(SUBJECT);
    const hit = rows.find((r) => r.taskRef === "sx-lesson:m1.l3.b3")!;
    expect(hit.occurrences).toBe(3);
  });

  it("carries the task ref and the author's class", async () => {
    const rows = await store.attributedMistakes(SUBJECT);
    expect(rows.find((r) => r.taskRef === "sx-lesson:m1.l5.b2")).toMatchObject({
      failureClass: "elif_chain_short_circuit_missed",
      occurrences: 1,
    });
  });

  it("ignores a failure the author never explained", async () => {
    /* Every wrong answer emits an attribution, and most of them say only "we
       could not tell why". Those keep the unexplained-failure denominator
       honest and must never become an entry — the alternative is the product
       inventing a cause. */
    const rows = await store.attributedMistakes(SUBJECT);
    expect(rows.some((r) => r.taskRef === "sx-lesson:m1.l1.b2")).toBe(false);
  });

  it("never returns another learner's mistakes", async () => {
    const rows = await store.attributedMistakes(SUBJECT);
    expect(rows.find((r) => r.taskRef === "sx-lesson:m1.l3.b3")!.occurrences).toBe(3);
    expect(await store.attributedMistakes(OTHER)).toHaveLength(1);
  });

  it("orders the most repeated first", async () => {
    const counts = (await store.attributedMistakes(SUBJECT)).map((r) => r.occurrences);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });
});

describe("the dictionary rows", () => {
  it("saves an entry with no note", async () => {
    await store.saveErrorEntry({
      subjectId: SUBJECT,
      blockId: "m1.l3.b3",
      failureClass: "remainder_vs_quotient_swap",
      note: null,
    });
    const rows = await store.errorDictionary(SUBJECT);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ blockId: "m1.l3.b3", note: null });
  });

  it("adds the learner's words to an entry that already exists", async () => {
    await store.saveErrorEntry({
      subjectId: SUBJECT,
      blockId: "m1.l3.b3",
      failureClass: "remainder_vs_quotient_swap",
      note: "% қалдық, // бүтін бөлігі",
    });
    const rows = await store.errorDictionary(SUBJECT);
    expect(rows).toHaveLength(1);
    expect(rows[0].note).toBe("% қалдық, // бүтін бөлігі");
  });

  it("does not erase them when the same entry is saved again with none", async () => {
    /* Pressing save a second time is not a request to forget what the learner
       wrote the first time. */
    await store.saveErrorEntry({
      subjectId: SUBJECT,
      blockId: "m1.l3.b3",
      failureClass: "remainder_vs_quotient_swap",
      note: null,
    });
    expect((await store.errorDictionary(SUBJECT))[0].note).toBe("% қалдық, // бүтін бөлігі");
  });

  it("keeps two failure classes on the same block apart", async () => {
    await store.saveErrorEntry({
      subjectId: SUBJECT,
      blockId: "m1.l3.b3",
      failureClass: "some_other_class",
      note: null,
    });
    expect(await store.errorDictionary(SUBJECT)).toHaveLength(2);
  });

  it("never returns another learner's dictionary", async () => {
    expect(await store.errorDictionary(OTHER)).toEqual([]);
  });

  it("refuses a note longer than the column allows", async () => {
    /* The route rejects it first with a 400. The CHECK is the second line of
       defence, and it is here so that a future caller which forgets the first
       one fails loudly rather than truncating a child's sentence. */
    await expect(
      store.saveErrorEntry({
        subjectId: SUBJECT,
        blockId: "m1.l5.b2",
        failureClass: "elif_chain_short_circuit_missed",
        note: "ұ".repeat(501),
      }),
    ).rejects.toThrow();
  });

  it("is erased with the learner", async () => {
    const doomed = "88888888-8888-4888-8888-888888888888";
    await sql.query(`insert into learning_subjects (subject_id, cohort) values ($1, 'public')`, [
      doomed,
    ]);
    await store.saveErrorEntry({
      subjectId: doomed,
      blockId: "m1.l3.b3",
      failureClass: "remainder_vs_quotient_swap",
      note: "менің сөзім",
    });
    await sql.query(`delete from learning_subjects where subject_id = $1`, [doomed]);

    /* A child asking to be forgotten must not leave a list of their mistakes
       behind. The cascade is what makes `learning_forget_user` take this table
       with it without a second erasure path to keep in sync. */
    const left = await sql.query<{ n: number }>(
      `select count(*)::int as n from learner_error_dictionary where subject_id = $1`,
      [doomed],
    );
    expect(left.rows[0].n).toBe(0);
  });
});

describe("the schema itself", () => {
  it("gives the table exactly one column that can hold a sentence", async () => {
    /* The guarantee stated as a schema fact: `note` is the only free-text
       column, and it is only ever written from a request body. There is
       nowhere for a system-composed claim about a child to be stored, which is
       a stronger promise than any code review. */
    const r = await sql.query<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_name = 'learner_error_dictionary'
          and data_type = 'text'
          and character_maximum_length is null
        order by column_name`,
    );
    /* `block_id` and `failure_class` are text too, and both are bounded to 64
       characters by a CHECK and are identifiers rather than prose. `note` is
       the only column the learner's own words go into. */
    expect(r.rows.map((row) => row.column_name)).toEqual([
      "block_id",
      "failure_class",
      "note",
    ]);

    const checks = await sql.query<{ c: string }>(
      `select pg_get_constraintdef(oid) as c from pg_constraint
        where conrelid = 'learner_error_dictionary'::regclass and contype = 'c'`,
    );
    const all = checks.rows.map((row) => row.c).join(" ");
    expect(all).toContain("note");
    expect(all).toContain("500");
  });

  it("keeps RLS on with no policies, like every other learner table", async () => {
    const r = await sql.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class
        where relname in ('learner_error_dictionary', 'lesson_completions')
          and relnamespace = 'public'::regnamespace`,
    );
    expect(r.rows).toHaveLength(2);
    for (const row of r.rows) {
      expect(row.relrowsecurity, `${row.relname} must have RLS enabled`).toBe(true);
    }
  });
});
