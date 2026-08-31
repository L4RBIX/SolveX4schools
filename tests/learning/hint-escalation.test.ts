import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { playEpisode, correctAnswer, unattributedWrongAnswer } from "./ledger";

/**
 * The ladder, walked against the real store.
 *
 * `tests/nova/policy.test.ts` covers the rungs in isolation. This file covers
 * the thing that isolation cannot: whether the ladder can be climbed at all
 * from evidence a real lesson actually produces. Every step here goes through
 * `playEpisode`, which writes what `POST /api/learning/submit` writes, using
 * the same grader.
 *
 * The distinction matters because the defect this phase fixed was invisible to
 * a unit test. `enforceHintPolicy` looked correct, `grantHintLevel` was correct,
 * and the ladder was nonetheless shut for the whole episode on a large class of
 * real blocks — because the only event it counted as effort was one the submit
 * route does not always write.
 */

let sql: PgliteExecutor;
let store: LearningStore;
let subjectId: string;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  subjectId = await store.resolveSubject(randomUUID());
}, 60_000);

afterAll(async () => await sql?.close());

const GRADED = "m1.l6.b2a";
/** A code block. With no judged tally it settles `unknown`, like a dead judge. */
const UNMEASURED = "m1.l6.b3s";

function ask(episodeId: string, requested: number, extra: Partial<Parameters<typeof enforceHintPolicy>[0]> = {}) {
  return enforceHintPolicy({
    store,
    subjectId,
    episodeId,
    requested,
    learnerOverride: false,
    ...extra,
  });
}

/* -------------------------------------------------------------------------- */

describe("the ladder opens only after the learner has tried", () => {
  it("refuses a cold episode, and refuses it under override too", async () => {
    const episodeId = randomUUID();

    const plain = await ask(episodeId, 3);
    expect(plain.grant.granted).toBe(0);
    expect(plain.grant.reason).toBe("attempt_required");

    /* The override is the learner's right to overrule the tutor's pacing. It is
       not a way to skip having tried anything — the panel's "just tell me"
       button posts level 4 with override true, and before this gate existed a
       learner who had opened a task and typed nothing could have the full
       solution WITH CODE in one tap, because a subject with no ledger has no
       directive and `mayIncludeCode` defaults to true. */
    const forced = await ask(episodeId, 4, { learnerOverride: true });
    expect(forced.grant.granted).toBe(0);
    expect(forced.grant.reason).toBe("attempt_required");
  });

  it("opens at a question once something has been attempted", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
    ]);

    const { grant } = await ask(episode.episodeId, 4);
    expect(grant.granted).toBe(0);
    expect(grant.reason).toBe("opening_rung");
    expect(grant.capped).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */

describe("the lock-out this phase fixed", () => {
  it("opens on a block the judge never returned a verdict for", async () => {
    /* THE regression test.
     *
     * A code block submitted with no judged tally settles `unknown`, so
     * `toLearningVerdictName` is null and NO `verdict_received` is written —
     * which is exactly what happens for a block no machine scores, and for
     * every block during a sandbox outage.
     *
     * The old effort test counted four event names, three of which the product
     * never emits; in practice it reduced to "has a verdict been written". So
     * on this episode the learner had answered, pressed Check, been told their
     * answer was received — and help stayed shut at the opening rung for the
     * rest of the episode, with no error anywhere.
     *
     * `episode_opened` is written on every press of Check, before grading, and
     * is admitted as effort only under server trust. That is what makes this
     * pass without also handing a browser a one-line `fetch()` that unlocks the
     * ladder. */
    const episode = await playEpisode({ store, sql, subjectId }, UNMEASURED, [
      { kind: "submit", answer: { kind: "text", value: "y = int(input())\nprint('yes')" } },
    ]);
    expect(episode.verdicts, "this block must NOT have produced a verdict").toEqual([]);

    const { grant } = await ask(episode.episodeId, 2);
    expect(grant.reason).not.toBe("attempt_required");
    expect(grant.granted).toBe(0);
    expect(grant.reason).toBe("opening_rung");
  });

  it("does not open on an episode where only a hint was requested", async () => {
    /* The complement, and the reason the fix is a trust filter rather than a
       longer list of event names. Asking for help is not effort; a ladder that
       counted it could be climbed by asking repeatedly, which is the single
       failure it exists to prevent. */
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "hint", level: 0 },
    ]);

    const { grant } = await ask(episode.episodeId, 3);
    expect(grant.granted).toBe(0);
    expect(grant.reason).toBe("attempt_required");
  });
});

/* -------------------------------------------------------------------------- */

describe("climbing costs a new attempt each time", () => {
  it("refuses to escalate when nothing has happened since the last hint", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 0 },
    ]);

    const { grant } = await ask(episode.episodeId, 1);
    expect(grant.granted).toBe(0);
    expect(grant.reason).toBe("no_attempt_since_last_hint");
  });

  it("unlocks the next rung after a further attempt", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 0 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
    ]);

    const { grant } = await ask(episode.episodeId, 1);
    expect(grant.granted).toBe(1);
    expect(grant.reason).toBe("granted_as_requested");
  });

  it("hands over one rung at a time, however high the ask", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 0 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
    ]);

    const { grant } = await ask(episode.episodeId, 4);
    expect(grant.granted).toBe(1);
    expect(grant.capped).toBe(true);
    expect(grant.reason).toBe("one_rung_at_a_time");
  });

  it("never grants more than was asked for", async () => {
    /* The core's own branch for "already at 3, asked for 1" returns 3. Handing
       someone a bigger hint than they wanted costs them the independence weight
       on that episode for nothing, so the adapter clamps down — never up. */
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 3 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
    ]);

    const { grant } = await ask(episode.episodeId, 1);
    expect(grant.granted).toBeLessThanOrEqual(1);
  });
});

/* -------------------------------------------------------------------------- */

describe("the monthly assessment is not a lesson", () => {
  it("caps help at a pointer, and refuses code, whatever is asked", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 0 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 1 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
    ]);

    /* The help centre states in both languages that Nova gives no hints during
       the monthly check. Until this phase nothing enforced it: one attempt plus
       the override button produced a level-4 hint with working code on the
       programme's central independent measurement. */
    const { grant, assessmentCapped } = await ask(episode.episodeId, 4, {
      taskKind: "assessment",
    });
    expect(grant.granted).toBeLessThanOrEqual(1);
    expect(grant.mayIncludeCode).toBe(false);
    expect(assessmentCapped).toBe(true);
  });

  it("ignores the override entirely under assessment", async () => {
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 0 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
    ]);

    const { grant } = await ask(episode.episodeId, 4, {
      taskKind: "assessment",
      learnerOverride: true,
    });
    expect(grant.granted).toBeLessThanOrEqual(1);
    expect(grant.mayIncludeCode).toBe(false);
  });

  it("leaves an ordinary lesson alone", async () => {
    /* The complement. A cap that fired everywhere would be a tutor that never
       helps, and would be just as wrong in the other direction. */
    const episode = await playEpisode({ store, sql, subjectId }, GRADED, [
      { kind: "submit", answer: unattributedWrongAnswer(GRADED) },
      { kind: "hint", level: 0 },
      { kind: "wait", seconds: 40 },
      { kind: "submit", answer: correctAnswer(GRADED) },
    ]);

    const { grant, assessmentCapped } = await ask(episode.episodeId, 1, {
      taskKind: "lesson",
    });
    expect(assessmentCapped).toBe(false);
    expect(grant.granted).toBe(1);
  });
});
