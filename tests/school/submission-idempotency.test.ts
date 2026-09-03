import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * One press of Check, one graded attempt — whatever the network did.
 *
 * ## The defect these tests are the fence around
 *
 * `/api/learning/submit` had no idempotency key. It appended a fresh
 * `verdict_received` and, on a wrong answer, a fresh `failure_attributed` on
 * EVERY call, and it derives the learner's prior-failure count by counting
 * those rows. So a submission that reached the route twice was two attempts by
 * the same child, and the damage is specific rather than theoretical:
 *
 *   * the failure count inflates, and `buildLearnerState` reads solves and
 *     attempts out of the same rows — a doubled attempt is a halved solve rate
 *     for a learner who did nothing twice;
 *   * `revealFor` opens the answer at `ATTEMPTS_BEFORE_REVEAL` failures, and
 *     the programme requires the solution idea be withheld until several
 *     genuine attempts have passed (PDF p.4). A retry nobody made can hand a
 *     learner the answer;
 *   * the reducer folds an attempt that never happened.
 *
 * A double-click produces it. So does a mobile network that reconnects, and a
 * browser retrying a POST whose response was lost on the wire. None of that
 * requires an attacker and all of it happens in a classroom.
 *
 * ## Why these drive the real route
 *
 * Every assertion goes through `POST` on the actual App Router module against
 * the real PGlite store with the real migrations, for the same reason
 * `degradation.test.ts` does: the defect lives in the WIRING between grading,
 * the dedup table and the event append, and testing the pieces separately would
 * prove three correct pieces and nothing about the wiring.
 */

/* In-memory Postgres, set before any dynamic import: the store reads `config`,
   which reads `process.env` once at module load. */
process.env.LEARNING_DATA_DIR = "memory://";

/** Two learners. The second exists to prove ids do not cross between them. */
const ANON_A = "22222222-2222-4222-8222-222222222222";
const ANON_B = "33333333-3333-4333-8333-333333333333";

let currentAnon = ANON_A;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    /* Only `sx_anon`. These routes run on the anonymous development path, which
       is the one `checkLearningAccess` permits outside production; faking a
       session would exercise a path with no session store behind it. */
    get: (name: string) => (name === "sx_anon" ? { value: currentAnon } : undefined),
    set: () => {},
  }),
}));

/* `after()` needs a request scope Next only creates inside a real server. What
   it receives here is the opportunistic reducer sweep, which is not what any of
   this is about. */
vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;

let store: Store;
let submit: typeof import("../../src/app/api/learning/submit/route");
let counters: typeof import("@schools/ops/counters");

/** A keyed block whose wrong answer is unambiguous, so a failure is attributed. */
let optionBlockId: string;
let optionCorrectId: string;
let optionWrongId: string;
/** How many `verdict_received` rows ONE accepted attempt on it writes: one per
    credited skill. Read from the curriculum so the count is the block's, not a
    guess. */
let optionSkillCount: number;
/** A second attempt block, for the "one id, two blocks" case. */
let otherBlockId: string;

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  counters = await import("@schools/ops/counters");
  store = await (await import("@schools/store")).getStore();

  /* Derived from the curriculum rather than pinned to an id: September is
     frozen, but a hardcoded `m1.l1.b2` starts failing for the wrong reason the
     moment October is authored ahead of it. */
  const { PROGRAM } = await import("@schools/curriculum/program");
  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (block.type !== "multiple_choice" || block.options.length < 2) continue;
          if (!optionBlockId) {
            optionBlockId = block.id;
            optionCorrectId = block.correctOptionId;
            optionWrongId =
              block.options.find((o) => o.id !== block.correctOptionId)?.id ?? "";
            optionSkillCount = Math.max(1, block.skillRefs.length);
          } else if (!otherBlockId) {
            otherBlockId = block.id;
          }
        }
      }
    }
  }

  expect(optionBlockId, "the curriculum should contain a multiple choice block").toBeTruthy();
  expect(optionWrongId, "that block should have a wrong option to pick").toBeTruthy();
  expect(otherBlockId, "the curriculum should contain a second one").toBeTruthy();
}, 90_000);

afterAll(() => {
  currentAnon = ANON_A;
});

beforeEach(async () => {
  currentAnon = ANON_A;
  /* Empty the submit budget between cases.
   *
   * This file asks "how many times was this GRADED", and it deliberately posts
   * far more than a learner ever would to answer it — twenty duplicates, five
   * concurrent copies, a run of malformed keys. The route's per-learner budget
   * (twelve burst, eight a minute) is a real production limit and is tested on
   * its own in `submit-budget.test.ts`; leaving it armed here would make these
   * assertions depend on how many requests earlier cases in the same file had
   * already spent, which is a different question and a flaky way to ask it.
   *
   * Clearing the bucket rather than raising the budget, on purpose: a test that
   * turned the limit off would go on passing if somebody deleted it. */
  const { getStoreHandle } = await import("@schools/store");
  const { sql } = await getStoreHandle();
  await sql.query("delete from rate_limit_bucket", []);
});

async function postSubmit(body: Record<string, unknown>) {
  const res = await submit.POST(
    new Request("http://localhost/api/learning/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { res, body: (await res.json()) as Record<string, unknown> };
}

/** The learning events one episode holds, by name. The ledger, not a summary. */
async function eventNames(episodeId: string): Promise<string[]> {
  return (await store.eventsForEpisode(episodeId)).map((e) => e.event_name);
}

function countOf(names: string[], name: string): number {
  return names.filter((n) => n === name).length;
}

/* ========================================================================== */
/* 1. THE SAME SUBMISSION, TWICE                                              */
/* ========================================================================== */

describe("the same submission id is graded once", () => {
  it("writes ONE set of events and returns the SAME verdict on the second call", async () => {
    const episodeId = randomUUID();
    const submissionId = randomUUID();

    const first = await postSubmit({
      blockId: optionBlockId,
      episodeId,
      submissionId,
      answer: { kind: "option", id: optionWrongId },
    });
    expect(first.res.status).toBe(200);
    expect(first.body.verdict).toBe("wrong");
    expect(first.body.saved).toBe(true);

    const afterFirst = await eventNames(episodeId);
    expect(countOf(afterFirst, "verdict_received")).toBe(1);
    expect(countOf(afterFirst, "failure_attributed")).toBe(1);

    /* The retry. Same id, same answer — a double-click, a reconnect, or a
       learner pressing Check again because the response never arrived. */
    const second = await postSubmit({
      blockId: optionBlockId,
      episodeId,
      submissionId,
      answer: { kind: "option", id: optionWrongId },
    });

    expect(second.res.status).toBe(200);
    // The SAME verdict, not a fresh one. Re-grading would also mean re-running
    // a judge, which on a code block is a sandbox slot spent on a known answer.
    expect(second.body.verdict).toBe(first.body.verdict);
    expect(second.body.episodeId).toBe(first.body.episodeId);
    expect(second.body.saved).toBe(true);

    const afterSecond = await eventNames(episodeId);
    expect(
      afterSecond.length,
      "the retry appended events — the failure count and the reveal policy have both moved",
    ).toBe(afterFirst.length);
    expect(countOf(afterSecond, "verdict_received")).toBe(1);
    expect(countOf(afterSecond, "failure_attributed")).toBe(1);
  }, 60_000);

  it("replays the reveal decision rather than recomputing it", async () => {
    /* A duplicate must not be able to open an answer the original did not earn.
       `revealFor` reads a failure count that moves as the learner works, so a
       recomputed reveal on a late retry could reveal more than the submission
       it is a copy of. Replaying the stored body makes that impossible. */
    const episodeId = randomUUID();
    const submissionId = randomUUID();
    const answer = { kind: "option", id: optionWrongId };

    const first = await postSubmit({ blockId: optionBlockId, episodeId, submissionId, answer });
    expect(first.body.reveal).toBeNull();

    /* Three more GENUINE failures on the same block, each with its own id, so
       the ledger's failure count is now well past the reveal threshold. */
    for (let i = 0; i < 3; i += 1) {
      await postSubmit({
        blockId: optionBlockId,
        episodeId,
        submissionId: randomUUID(),
        answer,
      });
    }

    const replay = await postSubmit({ blockId: optionBlockId, episodeId, submissionId, answer });
    expect(
      replay.body.reveal,
      "the retry of a first attempt was handed the answer the learner had not yet earned",
    ).toBeNull();
  }, 60_000);

  it("a different answer is a NEW attempt and is counted", async () => {
    /* The other half of the rule. Idempotency that swallowed a genuine second
       attempt would be worse than the defect it fixes: a learner who corrected
       their answer would have no record of having done so. */
    const episodeId = randomUUID();

    await postSubmit({
      blockId: optionBlockId,
      episodeId,
      submissionId: randomUUID(),
      answer: { kind: "option", id: optionWrongId },
    });
    const wrong = await eventNames(episodeId);

    const corrected = await postSubmit({
      blockId: optionBlockId,
      episodeId,
      submissionId: randomUUID(),
      answer: { kind: "option", id: optionCorrectId },
    });

    expect(corrected.body.verdict).toBe("correct");
    const both = await eventNames(episodeId);
    expect(countOf(both, "verdict_received")).toBeGreaterThan(
      countOf(wrong, "verdict_received"),
    );
  }, 60_000);
});

/* ========================================================================== */
/* 2. THE RACE                                                                */
/* ========================================================================== */

describe("two copies of one submission, fired at the same time", () => {
  it("produces exactly ONE set of events and one verdict for both callers", async () => {
    /*
     * The double-click, as it actually happens: two requests in flight at once,
     * neither having seen the other's write. This is the case a `select` then
     * `insert` cannot survive — both find nothing, both grade, both append —
     * and it is why the claim is a single `insert … on conflict do nothing`.
     *
     * `Promise.all` is a genuine race here rather than a formality: both
     * handlers interleave at every `await`, which is the same interleaving two
     * concurrent requests get in a Node server.
     */
    const episodeId = randomUUID();
    const submissionId = randomUUID();
    const answer = { kind: "option", id: optionWrongId };

    const before = counters.counterSnapshot().values["submit.duplicates"] ?? 0;

    const [a, b] = await Promise.all([
      postSubmit({ blockId: optionBlockId, episodeId, submissionId, answer }),
      postSubmit({ blockId: optionBlockId, episodeId, submissionId, answer }),
    ]);

    expect(a.res.status).toBe(200);
    expect(b.res.status).toBe(200);

    /* Both callers got an answer, and it is the same answer. Neither is told
       "somebody else is doing this" — from the learner's side there was one
       press of Check and there is one verdict. */
    expect(a.body.verdict).toBe("wrong");
    expect(b.body.verdict).toBe(a.body.verdict);
    expect(b.body.episodeId).toBe(a.body.episodeId);
    expect(a.body.saved).toBe(true);
    expect(b.body.saved).toBe(true);

    /* And exactly one set of events. This is the assertion the whole feature
       exists for: one press of Check, one graded attempt in the ledger. */
    const names = await eventNames(episodeId);
    expect(countOf(names, "episode_opened")).toBe(1);
    expect(countOf(names, "verdict_received")).toBe(1);
    expect(countOf(names, "failure_attributed")).toBe(1);
    expect(countOf(names, "episode_closed")).toBe(1);

    /* One row in the dedup table too — the claim is what serialised them. */
    const record = await store.submissionRecord(await subjectOf(ANON_A), submissionId);
    expect(record).not.toBeNull();
    expect(record!.settledAt).not.toBeNull();
    expect(record!.verdict).toBe("wrong");

    /* And it was a real race, not two requests that happened to run in series:
       the second caller went down the duplicate path, which means it found the
       claim already taken and waited for the first one's verdict rather than
       grading its own. Without this the test would still pass on a runtime that
       serialised the two handlers, and would prove nothing about concurrency. */
    const after = counters.counterSnapshot().values["submit.duplicates"] ?? 0;
    expect(after - before, "neither caller took the duplicate path").toBe(1);
  }, 60_000);

  it("survives five concurrent copies, not just two", async () => {
    /* A tap on a laggy tablet is more than two. The claim is atomic, so the
       count of winners is one regardless of how many arrive. */
    const episodeId = randomUUID();
    const submissionId = randomUUID();
    const answer = { kind: "option", id: optionCorrectId };

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        postSubmit({ blockId: optionBlockId, episodeId, submissionId, answer }),
      ),
    );

    for (const r of results) {
      expect(r.res.status).toBe(200);
      expect(r.body.verdict).toBe("correct");
    }

    const names = await eventNames(episodeId);
    /* A correct answer credits one `verdict_received` per skill the task
       exercises, so the honest expectation is "the events of ONE attempt" —
       which is `skillRefs.length`, not one — and the point is that five
       requests wrote exactly that and no more. */
    expect(countOf(names, "verdict_received")).toBe(optionSkillCount);
    expect(countOf(names, "episode_opened")).toBe(1);
    expect(countOf(names, "episode_closed")).toBe(1);
    expect(countOf(names, "failure_attributed")).toBe(0);
  }, 60_000);
});

/* ========================================================================== */
/* 3. SCOPING — ONE LEARNER'S ID IS NOT ANOTHER'S                             */
/* ========================================================================== */

describe("a submission id belongs to one learner", () => {
  it("does not let learner B's request be satisfied by learner A's id", async () => {
    /*
     * The submission id arrives in a request body, which is the browser's word.
     * A globally-keyed dedup table would mean posting a classmate's id returns
     * THEIR verdict and THEIR episode id while your own answer is never graded
     * and never recorded — a read of another child's work and a hole in your
     * own record, from one guessed field.
     *
     * The primary key is `(subject_id, submission_id)`, so this cannot happen:
     * the same id under a different subject is simply a different row. Same
     * reasoning as `ownedEpisodeId`.
     */
    const submissionId = randomUUID();
    const episodeA = randomUUID();
    const episodeB = randomUUID();

    currentAnon = ANON_A;
    const a = await postSubmit({
      blockId: optionBlockId,
      episodeId: episodeA,
      submissionId,
      answer: { kind: "option", id: optionCorrectId },
    });
    expect(a.body.verdict).toBe("correct");

    currentAnon = ANON_B;
    const b = await postSubmit({
      blockId: optionBlockId,
      episodeId: episodeB,
      submissionId,
      answer: { kind: "option", id: optionWrongId },
    });

    /* B was graded on B's own answer, not handed A's verdict. */
    expect(b.body.verdict).toBe("wrong");
    expect(b.body.episodeId).not.toBe(a.body.episodeId);

    /* And B's evidence is B's. A's episode is untouched by B's request. */
    const bNames = await eventNames(episodeB);
    expect(countOf(bNames, "verdict_received")).toBe(1);
    expect(countOf(bNames, "failure_attributed")).toBe(1);

    const aNames = await eventNames(episodeA);
    expect(countOf(aNames, "failure_attributed")).toBe(0);

    /* Two rows, two subjects, one id. */
    const recA = await store.submissionRecord(await subjectOf(ANON_A), submissionId);
    const recB = await store.submissionRecord(await subjectOf(ANON_B), submissionId);
    expect(recA!.verdict).toBe("correct");
    expect(recB!.verdict).toBe("wrong");
  }, 60_000);

  it("refuses an id already used for a different block rather than replaying it", async () => {
    /* Not a scenario a correct client produces — it is what a client with a
       broken key looks like. Replaying the other block's verdict would invent a
       result for a task the learner did not just answer, so it is a 409. */
    const submissionId = randomUUID();

    await postSubmit({
      blockId: optionBlockId,
      episodeId: randomUUID(),
      submissionId,
      answer: { kind: "option", id: optionCorrectId },
    });

    const clash = await postSubmit({
      blockId: otherBlockId,
      episodeId: randomUUID(),
      submissionId,
      answer: { kind: "option", id: optionWrongId },
    });

    expect(clash.res.status).toBe(409);
    expect(clash.body.verdict).toBeUndefined();
  }, 60_000);
});

/* ========================================================================== */
/* 4. THE UNKEYED FALLBACK                                                    */
/* ========================================================================== */

describe("a request with no submission id", () => {
  it("is still graded, because a stale browser tab must not lose its answer", async () => {
    /* A tab loaded before this deployed sends no key. Refusing it means a child
       mid-lesson gets an error instead of a graded answer; the honest trade is
       to grade it with the old, un-deduplicated behaviour and log that it
       happened. */
    const episodeId = randomUUID();
    const { res, body } = await postSubmit({
      blockId: optionBlockId,
      episodeId,
      answer: { kind: "option", id: optionCorrectId },
    });

    expect(res.status).toBe(200);
    expect(body.verdict).toBe("correct");
    expect(body.saved).toBe(true);
    expect(countOf(await eventNames(episodeId), "episode_opened")).toBe(1);
  }, 60_000);

  it("ignores a malformed key rather than trusting it as one", async () => {
    /* `isSubmissionId` requires a v4-shaped uuid. Anything else is treated as
       absent — a non-uuid in a uuid column is a 500, and a 500 on the grading
       path is a learner's answer lost to a validation failure. */
    const episodeId = randomUUID();
    const { res, body } = await postSubmit({
      blockId: optionBlockId,
      episodeId,
      submissionId: "not-a-uuid",
      answer: { kind: "option", id: optionCorrectId },
    });

    expect(res.status).toBe(200);
    expect(body.verdict).toBe("correct");
  }, 60_000);
});

/* ========================================================================== */
/* 5. THE STORE PRIMITIVES                                                    */
/* ========================================================================== */

describe("the claim itself", () => {
  it("is atomic: exactly one of many concurrent claims wins", async () => {
    const subjectId = await subjectOf(ANON_A);
    const submissionId = randomUUID();
    const input = { subjectId, submissionId, blockId: optionBlockId, episodeId: randomUUID() };

    const won = await Promise.all(Array.from({ length: 8 }, () => store.claimSubmission(input)));
    expect(won.filter(Boolean)).toHaveLength(1);
  }, 60_000);

  it("releases a claim whose write failed, so the learner's retry can grade", async () => {
    /* The path the route takes when `appendEventsAndSettle` throws: nothing was
       persisted, so the id must become claimable again. Leaving the row would
       have the retry wait out the duplicate window and be told a second time
       that nothing was recorded — for a submission never recorded at all. */
    const subjectId = await subjectOf(ANON_A);
    const submissionId = randomUUID();
    const input = { subjectId, submissionId, blockId: optionBlockId, episodeId: randomUUID() };

    expect(await store.claimSubmission(input)).toBe(true);
    expect(await store.claimSubmission(input)).toBe(false);

    await store.releaseSubmission(subjectId, submissionId);
    expect(await store.submissionRecord(subjectId, submissionId)).toBeNull();
    expect(await store.claimSubmission(input)).toBe(true);
  }, 60_000);

  it("never releases a SETTLED claim", async () => {
    /* A settled claim is a record that events exist. Deleting it would reopen
       the double-write it was created to prevent. */
    const subjectId = await subjectOf(ANON_A);
    const submissionId = randomUUID();
    await store.claimSubmission({
      subjectId,
      submissionId,
      blockId: optionBlockId,
      episodeId: randomUUID(),
    });
    await store.appendEventsAndSettle([], {
      subjectId,
      submissionId,
      verdict: "correct",
      response: { verdict: "correct", saved: true },
    });

    await store.releaseSubmission(subjectId, submissionId);
    const still = await store.submissionRecord(subjectId, submissionId);
    expect(still).not.toBeNull();
    expect(still!.settledAt).not.toBeNull();
  }, 60_000);

  it("only takes over a claim that is genuinely abandoned", async () => {
    /* A process that dies between claiming and writing would otherwise lock the
       learner out of that exact answer forever. The takeover is conditional on
       age so it can never race a live request that is merely slow. */
    const subjectId = await subjectOf(ANON_A);
    const submissionId = randomUUID();
    const base = { subjectId, submissionId, blockId: optionBlockId, episodeId: randomUUID() };
    await store.claimSubmission(base);

    const fresh = await store.reclaimSubmission({ ...base, staleAfterSeconds: 60 });
    expect(fresh, "a claim seconds old was taken from a request that is still working").toBe(
      false,
    );

    const abandoned = await store.reclaimSubmission({ ...base, staleAfterSeconds: 0 });
    expect(abandoned).toBe(true);
  }, 60_000);

  it("settles once and keeps the first answer", async () => {
    const subjectId = await subjectOf(ANON_A);
    const submissionId = randomUUID();
    await store.claimSubmission({
      subjectId,
      submissionId,
      blockId: optionBlockId,
      episodeId: randomUUID(),
    });

    await store.appendEventsAndSettle([], {
      subjectId,
      submissionId,
      verdict: "wrong",
      response: { verdict: "wrong" },
    });

    /*
     * The second settle THROWS. It used to return quietly.
     *
     * The `settled_at is null` guard always stopped the row being overwritten,
     * so the stored verdict was safe either way — but the events beside it were
     * not. `appendEventsAndSettle` returns the EVENT insert count, so a settle
     * that matched zero rows was indistinguishable from one that matched, and
     * the caller went on to report `saved: true` for a second complete set of
     * `verdict_received` and `failure_attributed` rows written behind a single
     * settled row.
     *
     * That is reachable: `reclaimSubmission` above hands one submission id to a
     * second owner when the first outlives `STALE_CLAIM_SECONDS`, and the first
     * can still come back and settle. The ledger then says a child tried twice
     * and the settled row says once — the learner's restored card and the
     * teacher's console disagreeing about the same answer.
     *
     * Throwing rolls the duplicate events back with the failed settle. The
     * route turns it into `saved: false`, the learner presses Check again, and
     * the duplicate path hands them the verdict already stored for the answer
     * they already gave.
     */
    await expect(
      store.appendEventsAndSettle([], {
        subjectId,
        submissionId,
        verdict: "correct",
        response: { verdict: "correct" },
      }),
    ).rejects.toThrow(/already settled/);

    const record = await store.submissionRecord(subjectId, submissionId);
    expect(
      record!.verdict,
      "a second settle overwrote the first — the events beside it cannot be rewritten to match",
    ).toBe("wrong");
  }, 60_000);
});

/* -------------------------------------------------------------------------- */

/** The subject id behind an anonymous cookie, resolved the way the route does. */
async function subjectOf(anonId: string): Promise<string> {
  const { config } = await import("@schools/config");
  return store.resolveSubject(anonId, "public", config.pilot);
}
