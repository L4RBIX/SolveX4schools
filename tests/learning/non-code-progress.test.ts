import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { runSweep } from "@schools/reducer/sweep";
import { playEpisode, correctAnswer, unattributedWrongAnswer } from "./ledger";

/**
 * Progress evidence on the blocks nothing executes.
 *
 * ## Why an absent number was a bug
 *
 * 35 of the curriculum's 54 attempt blocks are run by a judge and report how
 * many checks passed. The other 19 — prediction, multiple choice, find the bug,
 * fill in the blank, reorder, test case, trace — are graded by comparison, and
 * they used to reach the ledger with no counts at all.
 *
 * That absence is load-bearing in a way it does not look:
 *
 *   * `computeInterventionOutcome` derives `progressed` and `regressed` by
 *     comparing `tests_passed` across two attempts. They are the only two of
 *     seven outcomes that can say whether a hint HELPED. With no counts on
 *     either attempt, neither can ever fire — so Nova's effectiveness was
 *     unmeasurable on more than a third of the tasks it hints on.
 *   * `isStagnant` keys each verdict as `verdict#tests_passed` and falls back
 *     to the bare verdict without counts, collapsing `thrash` into `stuck`.
 *     That split is what lifts the hint cap for a learner who is drowning
 *     rather than fiddling.
 *
 * A binary item has one thing to check, so it reports one: 1/1 accepted, 0/1
 * otherwise. Coarse, and true.
 *
 * ## The line that must not move
 *
 * Nothing is emitted where nothing measured the answer. An explanation block
 * settles `unknown` and writes no counts — inventing 0/1 there would file a
 * failure against a child for prose no human has read yet, purely to keep a
 * reducer field populated.
 */

let sql: PgliteExecutor;
let store: LearningStore;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
}, 60_000);

afterAll(async () => await sql?.close());

const freshSubject = () => store.resolveSubject(randomUUID());

/** A multiple-choice block: graded by comparison, never executed. */
const MCQ = "m1.l6.b2a";
/** An explanation. No machine marks it, and none should pretend to. */
const PROSE = "m1.l6.b3s";

/** Every `verdict_received` payload written for an episode, in order. */
async function countsFor(episodeId: string) {
  const events = await store.eventsForEpisode(episodeId);
  return events
    .filter((e) => e.event_name === "verdict_received")
    .map((e) => ({
      verdict: e.payload.verdict,
      passed: e.payload.tests_passed,
      total: e.payload.tests_total,
    }));
}

/* -------------------------------------------------------------------------- */

describe("a graded non-code block reports progress the core can read", () => {
  it("writes 0 of 1 for a wrong answer and 1 of 1 for a right one", async () => {
    const subjectId = await freshSubject();
    const episode = await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: correctAnswer(MCQ) },
      { kind: "close", reason: "accepted" },
    ]);

    const counts = await countsFor(episode.episodeId);
    expect(counts.length).toBeGreaterThanOrEqual(2);
    expect(counts[0]).toMatchObject({ passed: 0, total: 1 });
    expect(counts[counts.length - 1]).toMatchObject({ passed: 1, total: 1 });
  }, 60_000);

  it("makes a hint's effect measurable, which is the whole reason for the number", async () => {
    /* 0/1, a hint, then 1/1. That sequence is `progressed`, and before the
       counts existed it was indistinguishable from 'wrong then right', which
       the core cannot attribute to anything. */
    const subjectId = await freshSubject();
    const episode = await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "hint", level: 2 },
      { kind: "wait", seconds: 60 },
      { kind: "submit", answer: correctAnswer(MCQ) },
      { kind: "close", reason: "accepted" },
    ]);

    const counts = await countsFor(episode.episodeId);
    const passed = counts.map((c) => c.passed);
    /* The delta the core reads. Strictly increasing across the hint is what
       `computeInterventionOutcome` needs to say the hint helped. */
    expect(passed[0]).toBe(0);
    expect(passed[passed.length - 1]).toBe(1);
  }, 60_000);
});

describe("an unmeasured block stays unmeasured", () => {
  it("writes no verdict and no counts for prose nobody has marked", async () => {
    /* The complement, and the more important half. A reducer field is not a
       reason to invent evidence about a child. */
    const subjectId = await freshSubject();
    const episode = await playEpisode({ store, sql, subjectId }, PROSE, [
      { kind: "submit", answer: { kind: "text", value: "мне кажется, условие неверное" } },
      { kind: "close", reason: "navigated" },
    ]);

    expect(episode.verdicts).toEqual([]);
    expect(await countsFor(episode.episodeId)).toEqual([]);
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Stuck and thrash, which the counts are what make separable                  */
/* -------------------------------------------------------------------------- */

describe("stuck is not thrash", () => {
  /**
   * Both are repeated failure. The difference is whether anything is MOVING.
   *
   * A stuck learner submits the same wrong thing and gets the same result: no
   * progression, nothing changing, and the right response is a bigger scaffold.
   * A thrashing learner is changing their answer constantly and going nowhere,
   * which needs a different intervention — and telling them apart is impossible
   * without a per-attempt number to compare.
   *
   * These assert the EVIDENCE the classifier reads rather than the label it
   * produces: `struggle_class` is the core's to decide, and a test that pins
   * its output would be re-implementing the core's thresholds in a test file
   * and then calling the agreement a pass.
   */

  it("records an unchanging sequence for a learner who keeps submitting the same wrong answer", async () => {
    const subjectId = await freshSubject();
    const episode = await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 90 },
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 90 },
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
    ]);

    const counts = await countsFor(episode.episodeId);
    expect(counts).toHaveLength(3);
    /* Identical every time: same verdict, same count. This is what stagnation
       looks like to the reducer, and with no counts every one of these rows
       was identical for a different and useless reason — they were all empty. */
    expect(new Set(counts.map((c) => `${c.verdict}#${c.passed}`)).size).toBe(1);

    await runSweep(store, { limit: 100 });
    const state = await store.getLearnerState(subjectId);
    expect(state).not.toBeNull();
  }, 60_000);

  it("records a moving sequence for a learner who is getting somewhere", async () => {
    const subjectId = await freshSubject();
    const episode = await playEpisode({ store, sql, subjectId }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 60 },
      { kind: "submit", answer: correctAnswer(MCQ) },
      { kind: "close", reason: "accepted" },
    ]);

    const counts = await countsFor(episode.episodeId);
    /* Two DIFFERENT keys. The sequence moved, so this is not stagnation — and
       `wrong then right` must never be classified as thrash, which is the
       specific over-diagnosis the brief calls out. */
    expect(new Set(counts.map((c) => `${c.verdict}#${c.passed}`)).size).toBe(2);
  }, 60_000);

  it("gives the core a distinguishable signal for the two, on the same block", async () => {
    /* The pair, side by side, so the assertion is about the DIFFERENCE rather
       than about either sequence on its own. */
    const stuckSubject = await freshSubject();
    const movingSubject = await freshSubject();

    const stuck = await playEpisode({ store, sql, subjectId: stuckSubject }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 60 },
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 60 },
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
    ]);
    const moving = await playEpisode({ store, sql, subjectId: movingSubject }, MCQ, [
      { kind: "submit", answer: unattributedWrongAnswer(MCQ) },
      { kind: "wait", seconds: 60 },
      { kind: "submit", answer: correctAnswer(MCQ) },
      { kind: "close", reason: "accepted" },
    ]);

    const keys = async (id: string) =>
      new Set((await countsFor(id)).map((c) => `${c.verdict}#${c.passed}`));

    expect((await keys(stuck.episodeId)).size).toBe(1);
    expect((await keys(moving.episodeId)).size).toBe(2);
  }, 60_000);
});
