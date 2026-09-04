import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * An episode is one learner AND one task. It was only ever one learner.
 *
 * ## C6 — evidence from block A decided what happened on block B
 *
 * Every read keyed on an episode is a read about a TASK. `priorFailures` in the
 * submit route counts wrong verdicts and opens the answer at three;
 * `lastGrantedLevel` decides which rung of the hint ladder the learner is on;
 * `readSettled` tells Nova how many attempts they have made. All of them counted
 * the whole episode, and nothing stopped one episode id spanning two blocks.
 *
 * Reproduced against a real Postgres by the audit: three wrong submits on block
 * A under episode E, then the FIRST wrong submit on block B under the same E,
 * and the response to that first attempt carried B's `reveal.correctId`. The
 * answer key to a task the learner had just met, opened by failures on a
 * different one.
 *
 * `attempt_episodes` has carried a single `task_ref` column since migration
 * 0003 and `attributedMistakes` reads the task with `min(task_ref)` — the
 * invariant was assumed everywhere and enforced nowhere.
 *
 * ## C7 — a browser could write its own evidence
 *
 * Ingest lets a browser author `episode_opened`; that is the client's own
 * telemetry for a lesson being opened. `blockAttempts` — what the completion
 * policy reads — counted those rows as submissions with no trust filter. Five
 * POSTs to `/api/learning/events` were five submissions and
 * `/api/learning/complete` answered 200 with `first: true` for a learner who
 * had written nothing.
 *
 * Month unlock held, because it wants a judge-signed verdict. The RECORDS did
 * not, which is the worse half: nothing looked wrong.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "66666666-6666-4666-8666-666666666666";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: ANON } : undefined),
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;
let store: Store;
let submit: typeof import("../../src/app/api/learning/submit/route");
let events: typeof import("../../src/app/api/learning/events/route");

/** Two multiple-choice blocks from the same lesson, read from the curriculum. */
let blockA = "";
let wrongA = "";
let blockB = "";
let wrongB = "";
let correctB = "";
/** A whole lesson's blocks, for the completion case. */
let lessonId = "";
let lessonBlockIds: string[] = [];

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  events = await import("../../src/app/api/learning/events/route");
  store = await (await import("@schools/store")).getStore();

  const { PROGRAM } = await import("@schools/curriculum/program");
  outer: for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        const choices = lesson.blocks.filter(
          (b) => b.type === "multiple_choice" && b.options.length > 1,
        );
        if (choices.length < 2) continue;
        const [a, b] = choices;
        if (a.type !== "multiple_choice" || b.type !== "multiple_choice") continue;
        blockA = a.id;
        wrongA = a.options.find((o) => o.id !== a.correctOptionId)!.id;
        blockB = b.id;
        wrongB = b.options.find((o) => o.id !== b.correctOptionId)!.id;
        correctB = b.correctOptionId;
        lessonId = lesson.id;
        lessonBlockIds = lesson.blocks.map((x) => x.id);
        break outer;
      }
    }
  }
  expect(blockA, "two multiple-choice blocks in one lesson").toBeTruthy();
  expect(blockB).toBeTruthy();
}, 90_000);

beforeEach(async () => {
  const { getStoreHandle } = await import("@schools/store");
  const { sql } = await getStoreHandle();
  await sql.query("delete from rate_limit_bucket", []);
});

async function post(body: Record<string, unknown>) {
  const res = await submit.POST(
    new Request("http://localhost/api/learning/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { res, body: (await res.json()) as Record<string, unknown> };
}

describe("failures on one block cannot open another block's answer", () => {
  it("withholds B's reveal on the first attempt, however many times A failed", async () => {
    const episodeId = randomUUID();
    const { ATTEMPTS_BEFORE_REVEAL } = await import("@schools/learning/reveal");

    /* Exhaust the reveal threshold on A, in one episode. */
    let usedEpisode: string = episodeId;
    for (let i = 0; i < ATTEMPTS_BEFORE_REVEAL; i += 1) {
      const r = await post({
        episodeId: usedEpisode,
        submissionId: randomUUID(),
        blockId: blockA,
        answer: { kind: "option", id: wrongA },
      });
      usedEpisode = r.body.episodeId as string;
    }

    /* A's own reveal is open — the threshold works, and this proves the
       fixture actually reached it rather than passing by doing nothing. */
    const aAgain = await post({
      episodeId: usedEpisode,
      submissionId: randomUUID(),
      blockId: blockA,
      answer: { kind: "option", id: wrongA },
    });
    expect(aAgain.body.reveal, "the threshold was never reached on A").not.toBeNull();

    /* Now B, first attempt, same episode id. */
    const first = await post({
      episodeId: usedEpisode,
      submissionId: randomUUID(),
      blockId: blockB,
      answer: { kind: "option", id: wrongB },
    });

    expect(
      first.body.reveal ?? null,
      "the answer key to a block the learner had just met was opened by failures on a different one",
    ).toBeNull();
    expect(
      first.body.episodeId,
      "an episode holding another block's work must be replaced, not inherited",
    ).not.toBe(usedEpisode);
  });

  it("keeps a legitimate client on the same episode for the same block", async () => {
    /* The complement. If the check fired on every request, every attempt would
       be a fresh episode, the reveal would never open, and the ladder would
       reset on every press — which is the same defect in the other direction. */
    const episodeId = randomUUID();
    const one = await post({
      episodeId,
      submissionId: randomUUID(),
      blockId: blockB,
      answer: { kind: "option", id: wrongB },
    });
    expect(one.body.episodeId).toBe(episodeId);

    const two = await post({
      episodeId,
      submissionId: randomUUID(),
      blockId: blockB,
      answer: { kind: "option", id: correctB },
    });
    expect(two.body.episodeId, "the same block under the same episode must stay put").toBe(episodeId);
  });
});

describe("a browser cannot write its own evidence", () => {
  it("does not count posted episode_opened rows as submissions", async () => {
    const { getStoreHandle } = await import("@schools/store");
    const { resolveIdentity } = await import("@schools/learning/identity");
    const { subjectId } = await resolveIdentity();

    /* Measured before and after, rather than against zero: earlier cases in this
       file made REAL submissions on the same block through the submit route,
       and those are server-written and must go on counting. What must not move
       is the number, when the only thing that happened was five fetch() calls. */
    const before = (await store.blockAttempts(subjectId, [blockA])).get(blockA)?.submissions ?? 0;

    const episodeId = randomUUID();
    const res = await events.POST(
      new Request("http://localhost/api/learning/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          events: Array.from({ length: 5 }, (_, i) => ({
            eventId: randomUUID(),
            episodeId,
            sessionId: randomUUID(),
            seq: i,
            eventName: "episode_opened",
            occurredAt: new Date().toISOString(),
            payload: { task_ref: `sx-lesson:${blockA}`, task_kind: "lesson" },
          })),
        }),
      }),
    );
    expect(res.status, "ingest still accepts the client's own telemetry").toBeLessThan(400);

    /* And the rows are there, at browser trust — this is not a test that ingest
       started refusing them. */
    const { sql } = await getStoreHandle();
    const written = await sql.query<{ n: number }>(
      `select count(*)::int as n from learning_events
        where episode_id = $1 and source_trust = 'browser'`,
      [episodeId],
    );
    expect(Number(written.rows[0]!.n), "the telemetry must still be recorded").toBe(5);

    /* What must NOT have happened: those rows counting as work. */
    const after = (await store.blockAttempts(subjectId, [blockA])).get(blockA)?.submissions ?? 0;
    expect(
      after,
      `five fetch() calls moved the submission count from ${before} to ${after}`,
    ).toBe(before);
  });

  it("refuses to complete a lesson built only from posted events", async () => {
    const complete = await import("../../src/app/api/learning/complete/route");
    const sessionId = randomUUID();

    for (const blockId of lessonBlockIds) {
      await events.POST(
        new Request("http://localhost/api/learning/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            events: [
              {
                eventId: randomUUID(),
                episodeId: randomUUID(),
                sessionId,
                seq: 0,
                eventName: "episode_opened",
                occurredAt: new Date().toISOString(),
                payload: { task_ref: `sx-lesson:${blockId}`, task_kind: "lesson" },
              },
            ],
          }),
        }),
      );
    }

    const res = await complete.POST(
      new Request("http://localhost/api/learning/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId }),
      }),
    );

    expect(
      res.status,
      "a lesson was recorded as finished from fetch() calls alone",
    ).toBe(409);
  });
});
