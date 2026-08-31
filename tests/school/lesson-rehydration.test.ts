import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * A refresh must not look like amnesia.
 *
 * ## The defect these tests are the fence around
 *
 * A learner answered a block. The server graded it, signed it, wrote the
 * events, settled the submission. They pressed F5 and the lesson came back as
 * though none of it had happened: `0/9` in the top bar for a learner who had
 * solved nine of nine, no settled cards, and a finish button that walked them
 * back to block 1 because `evaluateCompletion` was being run over an empty map.
 *
 * The record was intact the whole time. `SchoolLesson` opened with
 * `useState<Record<string, BlockState>>({})` and nothing on the page had ever
 * asked the server what it knew.
 *
 * Three consequences, and only the first is cosmetic:
 *
 *   * The lesson became unfinishable without redoing it, while
 *     `/api/learning/complete` would have accepted the completion on evidence
 *     it already held. Two halves of one policy, disagreeing, with only the
 *     wrong half reachable from the UI.
 *   * Every post-refresh Check minted a new episode, and the hint rung, the
 *     reveal counter and the attempt gate are all keyed on the episode. A
 *     reload mid-task reset all three.
 *   * Worse in the other direction: `solveEvidence` reads
 *     `assistance_delivered` on the episode. Hints in episode A, a refresh,
 *     then a solve in episode B, and the solve carries no record of the help —
 *     so `scheduleFor` filed it as an independent milestone and
 *     `activityBuckets` counted it as `solved_solo`. The product fabricated
 *     "solved independently" about a child who had been handed the answer.
 *
 * ## Why these drive the real route and the real store
 *
 * Every fixture below is created by POSTing to the actual submit handler
 * against real PGlite with the real migrations, and then read back through
 * `lessonHydration` — the same function the page calls. The defect was in the
 * WIRING between grading, the dedup table, the event stream and the player's
 * initial state; testing those separately would prove four correct pieces and
 * nothing about the seam between them.
 */

/* In-memory Postgres, set before any dynamic import: the store reads `config`,
   which reads `process.env` once at module load. */
process.env.LEARNING_DATA_DIR = "memory://";

/** Three learners. B proves state does not cross; C stays empty throughout. */
const ANON_A = "44444444-4444-4444-8444-444444444444";
const ANON_B = "55555555-5555-4555-8555-555555555555";
const ANON_C = "66666666-6666-4666-8666-666666666666";

let currentAnon = ANON_A;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: currentAnon } : undefined),
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;
type PublicBlock = import("@schools/curriculum/public").PublicBlock;
type LessonHydration = import("@schools/learning/hydration").LessonHydration;

let store: Store;
let submit: typeof import("../../src/app/api/learning/submit/route");
let rehydrate: typeof import("@schools/learning/rehydrate");
let publicMod: typeof import("@schools/curriculum/public");

/** A multiple choice with a knowable right and wrong answer. */
let mcq: { blockId: string; lessonId: string; correctId: string; wrongId: string };
/** A second one in the SAME lesson, so multi-block restore is testable. */
let mcq2: { blockId: string; correctId: string; wrongId: string } | null = null;
/** A trace block — the only authored type whose grader can return `partial`. */
let trace: { blockId: string; lessonId: string; partial: Record<string, string> } | null = null;
/** An explain block: never machine-graded, so it settles `unknown`. */
let explain: { blockId: string; lessonId: string } | null = null;

/** The public blocks of a lesson, as the page would compute them. */
function blocksOf(lessonId: string): PublicBlock[] {
  return publicMod.publicLesson(findLesson(lessonId), "core").blocks;
}

let findLesson: (lessonId: string) => import("@schools/curriculum/types").Lesson;

beforeAll(async () => {
  submit = await import("../../src/app/api/learning/submit/route");
  rehydrate = await import("@schools/learning/rehydrate");
  publicMod = await import("@schools/curriculum/public");
  store = await (await import("@schools/store")).getStore();

  const { PROGRAM } = await import("@schools/curriculum/program");

  const lessons = PROGRAM.months.flatMap((m) => m.units.flatMap((u) => u.lessons));
  findLesson = (lessonId) => {
    const hit = lessons.find((l) => l.id === lessonId);
    if (!hit) throw new Error(`no lesson ${lessonId}`);
    return hit;
  };

  /* Derived from the curriculum rather than pinned to ids. September is frozen,
     but a hardcoded `m1.l1.b2` starts failing for the wrong reason the moment
     October is authored ahead of it. */
  for (const lesson of lessons) {
    for (const block of lesson.blocks) {
      if (block.type === "multiple_choice" && block.options.length >= 2) {
        const wrongId = block.options.find((o) => o.id !== block.correctOptionId)?.id;
        if (!wrongId) continue;
        if (!mcq) {
          mcq = {
            blockId: block.id,
            lessonId: lesson.id,
            correctId: block.correctOptionId,
            wrongId,
          };
        } else if (!mcq2 && lesson.id === mcq.lessonId) {
          mcq2 = { blockId: block.id, correctId: block.correctOptionId, wrongId };
        }
      }
      if (!trace && block.type === "trace_code" && block.steps.length >= 2) {
        /* Exactly one cell right, so the grader returns `partial` rather than
           `wrong` — see `checkBlock`, which calls partial "a real outcome and
           not a consolation prize". */
        const cells: Record<string, string> = {};
        let filled = 0;
        for (const [row, step] of block.steps.entries()) {
          for (const [name, expected] of Object.entries(step.vars)) {
            cells[`${row}:${name}`] = filled === 0 ? expected : "";
            filled += 1;
          }
        }
        if (filled >= 2) trace = { blockId: block.id, lessonId: lesson.id, partial: cells };
      }
      if (!explain && block.type === "explain") {
        explain = { blockId: block.id, lessonId: lesson.id };
      }
    }
  }

  expect(mcq, "the curriculum should contain a multiple choice block").toBeTruthy();
  expect(explain, "the curriculum should contain an explain block").toBeTruthy();
  expect(trace, "the curriculum should contain a trace block").toBeTruthy();
}, 120_000);

afterAll(() => {
  currentAnon = ANON_A;
});

beforeEach(() => {
  currentAnon = ANON_A;
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

/** One press of Check, with a fresh submission id — a genuinely new answer. */
function answerOnce(blockId: string, answer: unknown, episodeId: string = randomUUID()) {
  return postSubmit({ blockId, episodeId, submissionId: randomUUID(), answer });
}

/** What the page would compute for this learner, on this lesson. */
function hydrate(lessonId: string): Promise<LessonHydration> {
  return rehydrate.lessonHydration(lessonId, blocksOf(lessonId));
}

/* -------------------------------------------------------------------------- */
/* What restores                                                              */
/* -------------------------------------------------------------------------- */

describe("a settled block comes back settled", () => {
  it("restores a correct answer", async () => {
    currentAnon = randomUUID();
    const graded = await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    expect(graded.body.verdict).toBe("correct");

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state, "the block the learner just solved was not restored at all").toBeTruthy();
    expect(state.verdict).toBe("correct");
    expect(state.attempts).toBe(1);
    expect(state.restored).toBe(true);
  }, 60_000);

  it("restores a wrong answer as wrong — not as untouched, and not as correct", async () => {
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId });

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state.verdict).toBe("wrong");
    expect(state.restored).toBe(true);
  }, 60_000);

  it("restores partial as partial", async () => {
    /* The ledger cannot tell partial from wrong — `toLearningVerdictName` folds
       both into `wrong_answer` — so this is the assertion that proves hydration
       reads the settled submission and not the event stream. Getting it wrong
       tells a learner who traced four of five rows that they failed outright. */
    currentAnon = randomUUID();
    const graded = await answerOnce(trace!.blockId, { kind: "grid", cells: trace!.partial });
    expect(graded.body.verdict, "fixture is not producing a partial verdict").toBe("partial");

    const state = (await hydrate(trace!.lessonId)).blocks[trace!.blockId];
    expect(state.verdict).toBe("partial");
  }, 60_000);

  it("keeps an unmeasured block unmeasured, and never converts it to wrong", async () => {
    /* An explanation in the learner's own words writes NO `verdict_received` at
       all, so an events-only hydration would render it as never attempted —
       the original bug, surviving inside its own fix. */
    currentAnon = randomUUID();
    const graded = await answerOnce(explain!.blockId, {
      kind: "text",
      value: "Себебі бүтін бөлу қалдықты тастайды.",
    });
    expect(graded.body.verdict).toBe("unknown");

    const state = (await hydrate(explain!.lessonId)).blocks[explain!.blockId];
    expect(state, "an ungraded explanation was not restored").toBeTruthy();
    expect(state.verdict).toBe("unmeasured");
    expect(state.note).toBe("not_machine_graded");
  }, 60_000);

  it("counts attempts by distinct answers, not by presses of Check", async () => {
    currentAnon = randomUUID();
    const held = randomUUID();
    const episode = randomUUID();
    const wrong = { kind: "option", id: mcq.wrongId };

    /* Same id, same answer, three times: a double-click, or a browser retrying
       a POST whose response was lost. One attempt. */
    await postSubmit({ blockId: mcq.blockId, episodeId: episode, submissionId: held, answer: wrong });
    await postSubmit({ blockId: mcq.blockId, episodeId: episode, submissionId: held, answer: wrong });
    await postSubmit({ blockId: mcq.blockId, episodeId: episode, submissionId: held, answer: wrong });

    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId].attempts).toBe(1);

    // A genuinely different answer is a second attempt.
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId }, episode);
    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId].attempts).toBe(2);
  }, 60_000);

  it("leaves an untouched block out entirely, so absent still means unattempted", async () => {
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });

    const state = await hydrate(mcq.lessonId);
    expect(state.blocks[mcq.blockId]).toBeTruthy();
    if (mcq2) {
      expect(
        state.blocks[mcq2.blockId],
        "a block nobody has answered came back with a state",
      ).toBeUndefined();
    }
  }, 60_000);

  it("restores several blocks at once and leaves the rest alone", async () => {
    if (!mcq2) return; // one-MCQ lesson; the single-block cases already cover it
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    await answerOnce(mcq2.blockId, { kind: "option", id: mcq2.wrongId });

    const state = await hydrate(mcq.lessonId);
    expect(state.blocks[mcq.blockId].verdict).toBe("correct");
    expect(state.blocks[mcq2.blockId].verdict).toBe("wrong");

    /* The progress readout is `solvedCount / attemptCount`, and `solvedCount`
       counts restored states with verdict `correct`. This is the `2/3` in the
       release gate, computed the way the top bar computes it. */
    const solved = Object.values(state.blocks).filter((b) => b.verdict === "correct").length;
    expect(solved).toBe(1);
  }, 60_000);

  it("says nothing about blocks that are not attempts", async () => {
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    const state = await hydrate(mcq.lessonId);
    const concepts = blocksOf(mcq.lessonId).filter((b) => b.type === "concept");
    for (const block of concepts) {
      expect(
        state.blocks[block.id],
        "the server invented an opinion about whether a paragraph was read",
      ).toBeUndefined();
    }
  }, 60_000);

  it("carries the lesson completion the server recorded", async () => {
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    await store.recordLessonCompletion({
      subjectId,
      lessonId: mcq.lessonId,
      correct: 1,
      wrong: 0,
      unmeasured: 0,
      attempts: 1,
      policyId: "lesson.v1",
    });
    expect((await hydrate(mcq.lessonId)).completedAt).toBeTruthy();
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Infrastructure honesty                                                     */
/* -------------------------------------------------------------------------- */

describe("an outage stays an outage", () => {
  it("restores judge_unavailable as unmeasured, never as a failure", async () => {
    /* Written straight into the dedup table rather than by taking a judge down
       mid-test: the point under test is the READ, and the response shape is the
       submit route's own, quoted from `route.ts`. A learner must never come
       back from an outage to find themselves marked wrong. */
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    const submissionId = randomUUID();
    const episodeId = randomUUID();
    await store.claimSubmission({ subjectId, submissionId, blockId: mcq.blockId, episodeId });
    await store.appendEventsAndSettle([], {
      subjectId,
      submissionId,
      verdict: "unknown",
      response: {
        verdict: "unknown",
        reveal: null,
        why: null,
        episodeId,
        cases: null,
        saved: true,
        unmeasuredReason: "judge_unavailable",
        attested: false,
      },
    });

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state.verdict).toBe("unmeasured");
    expect(state.verdict).not.toBe("wrong");
    expect(state.note).toBe("judge_unavailable");
  }, 60_000);

  it("keeps no_trusted_judge apart from an outage", async () => {
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    const submissionId = randomUUID();
    const episodeId = randomUUID();
    await store.claimSubmission({ subjectId, submissionId, blockId: mcq.blockId, episodeId });
    await store.appendEventsAndSettle([], {
      subjectId,
      submissionId,
      verdict: "unknown",
      response: { verdict: "unknown", episodeId, saved: true, unmeasuredReason: "no_trusted_judge" },
    });

    /* Two different sentences reach the learner — one promises "try later" and
       the other says a teacher will mark it. Collapsing them is a lie repeated
       daily on a deployment with no judge. */
    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId].note).toBe("no_trusted_judge");
  }, 60_000);

  it("does not restore a claim that never settled", async () => {
    /* A request that died between claiming and writing graded nothing and
       recorded nothing. Rendering it as a settled card would be the product
       claiming work was kept when it was not — the same lie `not_saved` exists
       to prevent, arriving a session later. */
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    await store.claimSubmission({
      subjectId,
      submissionId: randomUUID(),
      blockId: mcq.blockId,
      episodeId: randomUUID(),
    });
    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId]).toBeUndefined();
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Independence, the ladder, and the episode                                  */
/* -------------------------------------------------------------------------- */

describe("a refresh does not launder away help, or reset the ladder", () => {
  it("hands back the episode of an unsolved block, so a later attempt continues it", async () => {
    currentAnon = randomUUID();
    const episodeId = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId }, episodeId);

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(
      state.episodeId,
      "a wrong answer's episode was not returned, so the next Check opens a second one",
    ).toBe(episodeId);
  }, 60_000);

  it("does not hand back the episode of a solved block", async () => {
    /* The opposite bug, and it is permanent: `evaluateCompletionGate` computes
       `independent = solved && maxLevel < 0` and can never undo it, so an
       immortal episode would make one level-0 hint in September poison every
       future solve of that block for the rest of the year. An accepted verdict
       is the boundary — the route already closes the episode there. */
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId].episodeId).toBeUndefined();
  }, 60_000);

  it("reports delivered assistance, and keeps reporting it after a refresh", async () => {
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    const episodeId = randomUUID();

    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId }, episodeId);

    /* Both halves of the assistance record, written the way the hint route
       writes them: the intervention row carries HOW MUCH, the event proves the
       tokens actually reached the learner. */
    const interventionId = randomUUID();
    await store.recordIntervention({
      interventionId,
      subjectId,
      episodeId,
      kind: "hint",
      level: 2,
      trigger: "learner_requested",
      mode: "socratic",
      containsCode: false,
      contentLen: 120,
    });
    await store.appendEvents([
      {
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId: randomUUID(),
        seq: 0,
        eventName: "assistance_delivered",
        occurredAt: new Date().toISOString(),
        sourceTrust: "server",
        environment: "development",
        cohort: "public",
        route: `/lesson/${mcq.lessonId}`,
        payload: { intervention_id: interventionId, level: 2 },
      },
    ]);

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state.assisted, "help delivered on this block was not reported").toBe(true);
    expect(state.assistanceLevel).toBe(2);
  }, 60_000);

  it("reports an unaided attempt as unaided", async () => {
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId });
    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state.assisted).toBe(false);
    expect(state.assistanceLevel).toBe(-1);
  }, 60_000);

  it("keeps the reveal counter climbing across a refresh", async () => {
    /*
     * The pedagogy regression, stated as a sequence a learner can perform.
     *
     * `revealFor` opens the answer at three failed attempts, counted as
     * non-accepted `verdict_received` rows ON THE EPISODE. Before hydration the
     * client minted a new episode per mount, so failing twice and reloading put
     * the learner back at zero — «шешім идеясы бірнеше әрекеттен соң ғана
     * ашылады» turned into "after three failures with no reload".
     *
     * Here the third attempt runs in the episode hydration handed back, and the
     * reveal arrives. Rerun this test with `episodeId` re-minted between
     * attempts and it fails, which is the whole point.
     */
    currentAnon = randomUUID();
    const first = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId }, first);

    // The refresh. Everything the browser held is gone; the episode comes back.
    const resumed = (await hydrate(mcq.lessonId)).blocks[mcq.blockId].episodeId;
    expect(resumed).toBe(first);

    await answerOnce(mcq.blockId, { kind: "text", value: "second" }, resumed);
    const third = await answerOnce(mcq.blockId, { kind: "text", value: "third" }, resumed);

    expect(
      third.body.reveal,
      "three failures on one block did not open the reveal — the counter reset",
    ).toBeTruthy();
  }, 60_000);

  it("never hands the lesson page a delayed re-solve's episode", async () => {
    /* A review runs in a server-minted episode whose separateness IS the
       independence measurement — migration 0014 puts a CHECK constraint on it.
       Folding ordinary lesson work into it would destroy the one thing the
       fifth programme check measures. */
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    const originEpisode = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId }, originEpisode);

    await store.scheduleReview({
      subjectId,
      blockId: mcq.blockId,
      reason: "solved_with_assistance",
      originLevel: 2,
      originEpisodeId: originEpisode,
      originAt: new Date().toISOString(),
      dueAt: new Date().toISOString(),
      policyId: "review.v1",
    });
    const due = await store.dueReviews(subjectId, new Date(Date.now() + 1000).toISOString());
    expect(due.length, "the review fixture did not queue").toBeGreaterThan(0);

    const reviewEpisode = randomUUID();
    await store.startReview(subjectId, due[0].reviewId, reviewEpisode);
    await answerOnce(mcq.blockId, { kind: "text", value: "re-solve" }, reviewEpisode);

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state.verdict, "the re-solve is the learner's latest word and should show").toBe(
      "wrong",
    );
    expect(
      state.episodeId,
      "the lesson page was handed the review's own episode to write into",
    ).not.toBe(reviewEpisode);
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Authorization                                                              */
/* -------------------------------------------------------------------------- */

describe("a learner may hydrate only their own work", () => {
  it("does not show learner A's state to learner B", async () => {
    currentAnon = ANON_A;
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId]?.verdict).toBe("correct");

    currentAnon = ANON_B;
    expect(
      (await hydrate(mcq.lessonId)).blocks[mcq.blockId],
      "one learner's verdict reached another learner's lesson page",
    ).toBeUndefined();
  }, 60_000);

  it("has no parameter that could name another learner", async () => {
    /* Structural, not conventional: `lessonHydration(lessonId, blocks)` has no
       subject argument, so there is no version of this call that can be pointed
       at another child. Same shape as `/api/learning/state/me`. */
    expect(rehydrate.lessonHydration.length).toBe(2);
  });

  it("returns nothing for a caller with no identity at all", async () => {
    currentAnon = "not-a-uuid";
    const state = await hydrate(mcq.lessonId);
    expect(state.blocks).toEqual({});
    expect(state.completedAt).toBeNull();
  }, 60_000);

  it("returns nothing for a learner who has never submitted", async () => {
    currentAnon = ANON_C;
    expect((await hydrate(mcq.lessonId)).blocks).toEqual({});
  }, 60_000);

  it("does not mint a subject just because a page was rendered", async () => {
    /* `knownSubjectId` reads and never writes. The writing form returns `isNew`
       for the caller to set as a cookie, which a Server Component cannot do —
       using it here would create an orphan subject on every render, which is
       verbatim the defect `proxy.ts` exists to prevent. */
    const anon = randomUUID();
    currentAnon = anon;
    await hydrate(mcq.lessonId);
    expect(await store.subjectIdForAlias("anon_id", anon)).toBeNull();
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Privacy                                                                    */
/* -------------------------------------------------------------------------- */

describe("hydration leaks nothing the learner had not already been shown", () => {
  it("carries no reveal before the learner has earned one", async () => {
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId });
    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(
      state.reveal,
      "one wrong answer restored a reveal that opens at three",
    ).toBeUndefined();
  }, 60_000);

  it("never contains hidden cases, reference solutions or answer keys", async () => {
    /* The whole hydrated payload for a whole lesson, scanned against every
       withheld string the curriculum declares for its blocks. `publicBlock` is
       covered by `payload-privacy.test.ts`; this is the second door into the
       same page, and it opened after that test was written. */
    const { MONTHS } = await import("@schools/curriculum/months");
    const { secretStringsOf } = publicMod;

    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId });
    await answerOnce(mcq.blockId, { kind: "text", value: "b" });
    await answerOnce(mcq.blockId, { kind: "text", value: "c" });
    if (mcq2) await answerOnce(mcq2.blockId, { kind: "option", id: mcq2.correctId });

    const serialised = JSON.stringify(await hydrate(mcq.lessonId));

    const lesson = MONTHS.flatMap((m) => m.units.flatMap((u) => u.lessons)).find(
      (l) => l.id === mcq.lessonId,
    )!;
    let checked = 0;
    for (const block of lesson.blocks) {
      for (const secret of secretStringsOf(block)) {
        checked += 1;
        expect(serialised, `withheld string reached the hydration payload: ${secret}`).not.toContain(
          secret,
        );
      }
    }
    expect(checked, "the fixture lesson declares no secrets, so this proved nothing").toBeGreaterThan(0);
  }, 90_000);

  it("carries no subject id, no failure class and no attestation", async () => {
    /* Three separate rules. The subject id is `httpOnly` precisely so page
       script cannot read it — "a subject id readable by page script is a
       subject id a student can copy from a classmate". The failure class is the
       system's name for a child's misconception and is never handed back. The
       attestation is an HMAC; only the boolean `attested` ever travelled, and
       hydration drops even that. */
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.wrongId });

    const serialised = JSON.stringify(await hydrate(mcq.lessonId));
    expect(serialised).not.toContain(subjectId);
    for (const key of ["failureClass", "failure_class", "attestation", "answerKey", "subjectId"]) {
      expect(serialised, `${key} reached the hydration payload`).not.toContain(key);
    }
  }, 60_000);

  it("carries no credential of any kind", async () => {
    currentAnon = randomUUID();
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    const serialised = JSON.stringify(await hydrate(mcq.lessonId));

    for (const name of [
      "DEEPSEEK_API_KEY",
      "JUDGE0_RAPIDAPI_KEY",
      "LEARNING_ATTESTATION_SECRET",
      "LEARNING_CRON_SECRET",
      "LEARNING_ADMIN_TOKEN",
      "DATABASE_URL",
    ]) {
      const value = process.env[name];
      if (value && value.length >= 8) expect(serialised).not.toContain(value);
    }
    expect(serialised).not.toMatch(/sk-[A-Za-z0-9]{16,}/);
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Spend                                                                      */
/* -------------------------------------------------------------------------- */

describe("restoring state costs nothing", () => {
  it("reconstructs a verdict without going near the grader", async () => {
    /*
     * The release gate: "no second Judge0 call is required to reconstruct
     * state". `lessonHydration` reads the store and nothing else — it does not
     * import the execution provider, does not call `gradeBlock`, and cannot
     * reach either. This asserts the observable half: hydrating repeatedly adds
     * no submissions, no events and no attempts.
     */
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });

    const before = (await store.eventsForSubject(subjectId)).length;
    for (let i = 0; i < 5; i += 1) await hydrate(mcq.lessonId);
    const after = (await store.eventsForSubject(subjectId)).length;

    expect(after, "hydrating wrote to the ledger").toBe(before);
    expect((await hydrate(mcq.lessonId)).blocks[mcq.blockId].attempts).toBe(1);
  }, 60_000);
});

/* -------------------------------------------------------------------------- */
/* Agreement with the rest of the product                                     */
/* -------------------------------------------------------------------------- */

describe("the learner's page agrees with the evidence the teacher reads", () => {
  it("restores exactly the blocks the completion policy counts as reached", async () => {
    /* The bug was that these two disagreed and only the client half was
       reachable: `/api/learning/complete` would have accepted the lesson while
       the UI insisted every block was outstanding. */
    currentAnon = randomUUID();
    const subjectId = await subjectOf(currentAnon);
    await answerOnce(mcq.blockId, { kind: "option", id: mcq.correctId });
    if (mcq2) await answerOnce(mcq2.blockId, { kind: "option", id: mcq2.correctId });

    const hydrated = await hydrate(mcq.lessonId);
    const evidence = await store.blockAttempts(subjectId, Object.keys(hydrated.blocks));

    for (const [blockId, block] of Object.entries(hydrated.blocks)) {
      const seen = evidence.get(blockId);
      expect(seen, `${blockId} is settled for the learner and absent from the ledger`).toBeTruthy();
      expect(
        seen!.accepted,
        `${blockId}: the card says ${block.verdict} and the ledger says accepted=${seen!.accepted}`,
      ).toBe(block.verdict === "correct");
    }
  }, 60_000);

  it("falls back to the ledger for an attempt that carried no submission id", async () => {
    /* A tab loaded before migration 0019 shipped sends no key, so the route
       logs `submit.unkeyed` and writes events with no dedup row. Hydration must
       still show the work — coarsely, and flagged as coarse, but shown. */
    currentAnon = randomUUID();
    await postSubmit({
      blockId: mcq.blockId,
      episodeId: randomUUID(),
      answer: { kind: "option", id: mcq.correctId },
    });

    const state = (await hydrate(mcq.lessonId)).blocks[mcq.blockId];
    expect(state, "an unkeyed attempt vanished on refresh").toBeTruthy();
    expect(state.verdict).toBe("correct");
    expect(state.degraded).toBe(true);
    expect(state.reveal, "the degraded path cannot know a reveal").toBeUndefined();
  }, 60_000);
});

/** The subject id behind an anonymous cookie, resolved the way the route does. */
async function subjectOf(anonId: string): Promise<string> {
  return store.resolveSubject(anonId, "public");
}
