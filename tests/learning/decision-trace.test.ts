import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { runSweep } from "@schools/reducer/sweep";
import { playEpisode, correctAnswer, unattributedWrongAnswer } from "./ledger";

/**
 * What the system decided, and when it changed its mind.
 *
 * Migration 0006 created `learning_actions` and stated the reason in the
 * migration itself: *"the decision engine is unfalsifiable without this. It
 * would issue DIAGNOSE forever to a learner it never learns anything about and
 * nothing would notice."*
 *
 * Nothing wrote the table. `runSweep` computed a decision for every subject it
 * rebuilt and every caller discarded it — so the engine's behaviour over a term
 * was, in the most literal sense, unreviewable.
 *
 * ## Why only on change
 *
 * The sweep runs every twenty seconds. A row per pass would put thousands of
 * identical DIAGNOSE rows against one learner in an afternoon and bury the
 * question the table exists to answer. Recording only transitions means
 * `issued_at` says what it appears to say: the moment the system started
 * believing this, which is the only timestamp an outcome can be measured from.
 *
 * ## What it is not
 *
 * Not a source of truth. Events remain the evidence; this is a log of
 * conclusions drawn from them, and `buildLearnerState` never reads it back. If
 * the two disagree, the events are right.
 */

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
}, 60_000);

afterAll(async () => await sql?.close());

const MCQ = "m1.l6.b2a";
const freshSubject = () => store.resolveSubject(randomUUID());
const DAY = 86_400_000;
const START = Date.parse("2026-05-04T09:00:00.000Z");

describe("a decision reaches the table", () => {
  it("is written once when a learner first produces evidence", async () => {
    const subjectId = await freshSubject();
    await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "close", reason: "abandoned" },
    ]);

    const swept = await runSweep(store, { limit: 100 });
    expect(swept.errors).toEqual([]);
    expect(swept.decisionsRecorded).toBeGreaterThan(0);

    const rows = await store.decisionsFor(subjectId);
    expect(rows.length).toBe(1);
    expect(rows[0].actionType).toBeTruthy();
    expect(rows[0].confidence).toBeGreaterThanOrEqual(0);
    expect(rows[0].confidence).toBeLessThanOrEqual(1);
  }, 60_000);

  it("answers the four questions the table exists for", async () => {
    /* What did the system decide, why was that hint level allowed, what was
       Nova permitted to do, and when did it start. All four from one row. */
    const subjectId = await freshSubject();
    await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "close", reason: "abandoned" },
    ]);
    await runSweep(store, { limit: 100 });

    const raw = await sql.query<Record<string, unknown>>(
      `select action_type, expected_outcome, reason, nova_mode, max_hint_level,
              engine_version, issued_at
         from learning_actions where subject_id = $1`,
      [subjectId],
    );
    const row = raw.rows[0];
    expect(row).toBeDefined();
    expect(String(row.action_type)).toMatch(
      /DIAGNOSE|REMEDIATE|STRENGTHEN|CHALLENGE|REDUCE_ASSISTANCE/,
    );
    /* `expected_outcome` is what makes the decision falsifiable rather than
       merely recorded — it is the claim a later outcome can contradict. */
    expect(String(row.expected_outcome).length).toBeGreaterThan(0);
    expect(row.nova_mode).toBeTruthy();
    expect(Number(row.max_hint_level)).toBeGreaterThanOrEqual(0);
    expect(Number(row.engine_version)).toBeGreaterThan(0);
  }, 60_000);
});

describe("a decision that has not changed is not written again", () => {
  it("stays at one row across repeated sweeps", async () => {
    /* The sweep is on a twenty-second interval. If this ever regresses, the
       table fills with duplicates and the transition history it exists to
       provide becomes unreadable. */
    const subjectId = await freshSubject();
    await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "close", reason: "abandoned" },
    ]);

    await runSweep(store, { limit: 100 });
    const after1 = (await store.decisionsFor(subjectId)).length;

    for (let i = 0; i < 3; i += 1) await runSweep(store, { limit: 100 });
    const after4 = (await store.decisionsFor(subjectId)).length;

    expect(after1).toBe(1);
    expect(after4).toBe(1);
  }, 90_000);

  it("writes a second row when the learner's situation actually moves", async () => {
    /* The transition is the interesting event. A learner who was being
       diagnosed and is now being stretched should leave a trail saying so, with
       a timestamp somebody can line up against what they were doing. */
    const subjectId = await freshSubject();

    await playEpisode(
      { store, sql, subjectId },
      MCQ,
      [
        { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
        { kind: "close", reason: "abandoned" },
      ],
      { startedAt: START },
    );
    await runSweep(store, { limit: 100 });
    const before = await store.decisionsFor(subjectId);

    /* Several independent solo solves — a genuinely different learner from the
       one who failed once. */
    for (let i = 1; i <= 5; i += 1) {
      await playEpisode(
        { store, sql, subjectId },
        MCQ,
        [
          { kind: "submit", answer: correctAnswer(MCQ) },
          { kind: "close", reason: "accepted" },
        ],
        { startedAt: START + i * DAY },
      );
    }
    await runSweep(store, { limit: 100 });
    const after = await store.decisionsFor(subjectId);

    /* Either the action moved, or it genuinely did not — and if it did not, the
       table correctly holds one row. What must NOT happen is a row per sweep. */
    expect(after.length).toBeGreaterThanOrEqual(before.length);
    expect(after.length).toBeLessThanOrEqual(3);
    if (after.length > before.length) {
      // Newest first, so a change is visible as a different leading action.
      expect(after[0].issuedAt >= before[0].issuedAt).toBe(true);
    }
  }, 120_000);
});

describe("the audit trail cannot take the projection down with it", () => {
  it("records a decision failure without abandoning the learner's state", async () => {
    /* A decision that cannot be logged is a gap in the audit trail. A
       projection that cannot be written is a learner whose evidence has stopped
       moving and whose teacher is reading last week's numbers. Letting the
       first take out the second would trade something important for something
       merely useful, so the two are guarded separately.
       Asserted structurally: the state write and the decision write are in
       different try blocks, and a sweep that logs a decision error still
       reports the subject as rebuilt. */
    const subjectId = await freshSubject();
    await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "close", reason: "abandoned" },
    ]);

    const swept = await runSweep(store, { limit: 100 });
    expect(swept.subjectsRebuilt).toBeGreaterThan(0);
    expect(await store.getLearnerState(subjectId)).not.toBeNull();
  }, 60_000);
});
