import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * Revealing the answer costs the solve its independence — through the ledger.
 *
 * ## Why this file exists
 *
 * `revealFor` has opened answer keys since the day it was written, and for a
 * long time nothing recorded that it had. The consequence ran the whole depth
 * of the model: `reduceEpisode`'s `solutionRevealed` stayed false forever,
 * `independenceWeight` never took its return-0 branch, and the episode outcome
 * `solution_revealed` — which the reducer, the store schema and the teacher
 * projection all carry a column for — could not occur. A learner who failed
 * three times, was shown the answer, typed it back and was marked correct was
 * recorded, in the table a school reads at the end of term, as having solved it
 * alone.
 *
 * The submit route emits the event now. Two separate consumers depend on it and
 * neither had a test crossing from the route to the consequence:
 *
 *   - `schools/teacher/leaderboard.ts` prints, in its own header, "Reveal the
 *     answer and submit it | `independence_weight` is 0 for a revealed
 *     solution, so it is assisted everywhere."
 *   - `schools/leagues/credit.ts` withholds the unaided XP bonus.
 *
 * ## Solved, and solved alone, are different questions
 *
 * Nothing here takes the solve away. The learner finished the block and the
 * ledger says so; what it also says is that the answer was open when they did.
 * A product that answered those two with one number would either punish a child
 * for using help it offered them, or tell a school a child worked alone when
 * they did not.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "44444444-4444-4444-8444-444444444444";

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
let reduceEpisode: typeof import("@solvex/learning-intelligence-core").reduceEpisode;
let ATTEMPTS_BEFORE_REVEAL: number;

/* A keyed block the policy will actually open. Derived from the curriculum, not
   pinned: `revealFor` never opens a code task, so an id hardcoded here would
   start proving nothing the moment the block behind it changed type. */
let blockId = "";
let correctOptionId = "";
let wrongOptionId = "";

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  store = await (await import("@schools/store")).getStore();
  ({ reduceEpisode } = await import("@solvex/learning-intelligence-core"));
  ({ ATTEMPTS_BEFORE_REVEAL } = await import("@schools/learning/reveal"));

  const { PROGRAM } = await import("@schools/curriculum/program");
  const { revealFor } = await import("@schools/learning/reveal");
  outer: for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (block.type !== "multiple_choice" || block.options.length < 2) continue;
          /* Only a block the policy genuinely reveals. Asserting on one it
             withholds would pass for the wrong reason forever. */
          const opened = revealFor({
            block,
            verdict: "wrong",
            failedAttempts: ATTEMPTS_BEFORE_REVEAL,
          });
          if (!opened) continue;
          blockId = block.id;
          correctOptionId = block.correctOptionId;
          wrongOptionId = block.options.find((o) => o.id !== block.correctOptionId)?.id ?? "";
          break outer;
        }
      }
    }
  }
  expect(blockId, "the curriculum should contain a revealable keyed block").toBeTruthy();
  expect(wrongOptionId).toBeTruthy();
}, 90_000);

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

const answer = (id: string) => ({ kind: "option" as const, id });

async function names(episodeId: string): Promise<string[]> {
  return (await store.eventsForEpisode(episodeId)).map((e) => e.event_name);
}

const count = (xs: string[], x: string) => xs.filter((n) => n === x).length;

/** Wrong answers, each with its own submission id so each is a real attempt. */
async function failTimes(episodeId: string, n: number) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(
      await post({
        episodeId,
        submissionId: randomUUID(),
        blockId,
        answer: answer(wrongOptionId),
      }),
    );
  }
  return out;
}

describe("before the threshold, nothing is opened and nothing is claimed", () => {
  it("withholds the answer and writes no reveal on the first wrong attempts", async () => {
    const episodeId = randomUUID();
    const attempts = await failTimes(episodeId, ATTEMPTS_BEFORE_REVEAL - 1);

    for (const a of attempts) expect(a.body.reveal ?? null).toBeNull();

    const ev = await names(episodeId);
    expect(count(ev, "solution_revealed")).toBe(0);

    const reduced = reduceEpisode(await store.eventsForEpisode(episodeId));
    expect(reduced?.solution_revealed).toBe(false);
    expect(reduced?.independence_weight).toBe(1);
  }, 60_000);
});

describe("at the threshold the answer opens, and the ledger says so once", () => {
  it("emits exactly one solution_revealed, server-authored", async () => {
    const episodeId = randomUUID();
    await failTimes(episodeId, ATTEMPTS_BEFORE_REVEAL);

    const events = await store.eventsForEpisode(episodeId);
    const revealed = events.filter((e) => e.event_name === "solution_revealed");
    expect(revealed).toHaveLength(1);
    /* The browser cannot author one. The only way this row exists is that the
       server opened the answer. */
    expect(revealed[0].source_trust).toBe("server");
  }, 60_000);

  it("drives independence to zero through the reducer, not through a second rule", async () => {
    const episodeId = randomUUID();
    await failTimes(episodeId, ATTEMPTS_BEFORE_REVEAL);

    const reduced = reduceEpisode(await store.eventsForEpisode(episodeId));
    expect(reduced?.solution_revealed).toBe(true);
    /* The number the teacher leaderboard and the League both read. */
    expect(reduced?.independence_weight).toBe(0);
  }, 60_000);

  it("does not re-reveal on a further wrong answer", async () => {
    const episodeId = randomUUID();
    await failTimes(episodeId, ATTEMPTS_BEFORE_REVEAL + 2);

    expect(count(await names(episodeId), "solution_revealed")).toBe(1);
  }, 60_000);

  it("does not re-reveal when the same submission is replayed", async () => {
    const episodeId = randomUUID();
    await failTimes(episodeId, ATTEMPTS_BEFORE_REVEAL - 1);

    const submissionId = randomUUID();
    const body = { episodeId, submissionId, blockId, answer: answer(wrongOptionId) };
    await post(body);
    await post(body);

    /* A retried POST is one attempt. Two reveals would mean the replay was
       graded again — which is what migration 0019 exists to prevent. */
    expect(count(await names(episodeId), "solution_revealed")).toBe(1);
  }, 60_000);
});

describe("solving it afterwards", () => {
  it("marks the block correct and still records that the answer was open", async () => {
    const episodeId = randomUUID();
    await failTimes(episodeId, ATTEMPTS_BEFORE_REVEAL);

    const { body } = await post({
      episodeId,
      submissionId: randomUUID(),
      blockId,
      answer: answer(correctOptionId),
    });

    /* Solved: yes. The learner finished the block and nothing here takes that
       away — completion is not the same question as independence. */
    expect(body.verdict).toBe("correct");

    /* Solved independently: no, and this is the assertion the teacher
       leaderboard's header and the League's unaided bonus both rest on. */
    const reduced = reduceEpisode(await store.eventsForEpisode(episodeId));
    expect(reduced?.solution_revealed).toBe(true);
    expect(reduced?.independence_weight).toBe(0);
    expect(reduced?.outcome).toBe("accepted");
  }, 60_000);
});

describe("a learner who never needed the answer", () => {
  it("keeps full independence, so the reveal path cannot punish an unaided solve", async () => {
    const episodeId = randomUUID();
    const { body } = await post({
      episodeId,
      submissionId: randomUUID(),
      blockId,
      answer: answer(correctOptionId),
    });

    expect(body.verdict).toBe("correct");
    const reduced = reduceEpisode(await store.eventsForEpisode(episodeId));
    expect(reduced?.solution_revealed).toBe(false);
    expect(reduced?.independence_weight).toBe(1);
    expect(count(await names(episodeId), "solution_revealed")).toBe(0);
  }, 60_000);
});
