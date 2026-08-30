import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore, type LearningEventRow } from "@schools/store/learning-store";
import { REVIEW_POLICY, isDue, scheduleFor } from "@schools/policies/review";
import { enforceHintPolicy } from "@schools/nova/enforce";
import { findBlock } from "@schools/learning/grade";
import { ATTEMPTS_BEFORE_REVEAL, revealFor } from "@schools/learning/reveal";
import { publicBlock } from "@schools/curriculum/public";

/**
 * Delayed re-solve — «бұл жолы көмексіз».
 *
 * The programme (PDF p.6): «Көмекпен шешілген есеп бірнеше аптадан соң қайта
 * беріледі және бұл жолы көмексіз орындалады» — a task solved with help comes
 * back later and this time it is done WITHOUT help.
 *
 * The scheduling half is ordinary infrastructure. The half that matters is the
 * second clause, and it is the whole reason this suite exists: a re-solve that
 * inherited the original's hint level, its failed-attempt count or its revealed
 * answer would not be a re-solve. It would be the same session continued a week
 * later, producing evidence of independence the learner never demonstrated —
 * which is the one class of defect this product treats as unacceptable.
 *
 * Four mechanisms carry the reset and every one of them is keyed on the episode
 * id. So the reset is one fact — the review runs in a FRESH episode — and the
 * assertions below check that fact through each of the four.
 */

const SUBJECT = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

/** A prediction, so `revealFor` has something it would open on the third failure. */
const BLOCK_ID = "m1.l1.b2";

const ORIGIN_EPISODE = "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0";

let sql: PgliteExecutor;
let store: LearningStore;
let reviewEpisode: string;
let reviewId: string;

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
  await sql.query(
    `insert into learning_subjects (subject_id, cohort) values ($1, 'public')`,
    [SUBJECT],
  );
}, 60_000);

afterAll(async () => {
  await sql?.close();
});

/* -------------------------------------------------------------------------- */
/* The rule, on its own                                                       */
/* -------------------------------------------------------------------------- */

describe("who earns a re-solve", () => {
  const at = new Date("2026-09-01T09:00:00.000Z");

  const solve = (over: Partial<Parameters<typeof scheduleFor>[0]> = {}) => ({
    blockId: "m1.l3.b4",
    blockType: "write_code" as const,
    taskKind: "lesson" as const,
    solved: true,
    assistanceDelivered: false,
    assistanceLevel: -1,
    ...over,
  });

  it("schedules a task that was solved WITH help", () => {
    const s = scheduleFor(solve({ assistanceDelivered: true, assistanceLevel: 2 }), at);
    expect(s).not.toBeNull();
    expect(s!.reason).toBe("solved_with_assistance");
    expect(s!.assistanceLevel).toBe(2);
    /* The product default, not a research finding — see the module header. Five
       days is a pilot-calendar number chosen so a review lands inside a
       one-month pilot, and it is a knob for exactly that reason. */
    expect(s!.dueAt).toBe("2026-09-06T09:00:00.000Z");
    expect(REVIEW_POLICY.assistedDelayDays).toBe(5);
  });

  it("does NOT schedule an ordinary practice task solved unaided", () => {
    /* A queue that fills with everything is a queue nobody opens. The
       independent path is narrow on purpose. */
    expect(scheduleFor(solve(), at)).toBeNull();
  });

  it("schedules an independently-solved milestone, declared in content", () => {
    /* `challenge` and `verify` are the types September authored as "this is the
       one that proves it", and the monthly check qualifies whatever its blocks
       are. Six blocks in September — a queue a fourteen-year-old works through. */
    const challenge = scheduleFor(solve({ blockType: "challenge" }), at);
    expect(challenge!.reason).toBe("independent_milestone");
    expect(challenge!.dueAt).toBe("2026-09-15T09:00:00.000Z");

    const check = scheduleFor(solve({ taskKind: "assessment" }), at);
    expect(check!.reason).toBe("independent_milestone");

    /* -1, the ledger's own "no assistance requested" sentinel. Writing 0 would
       claim a level-0 hint had been given. */
    expect(challenge!.assistanceLevel).toBe(-1);
  });

  it("never schedules a task that was not solved", () => {
    /* Re-solving something the learner never solved is not a re-solve. It is
       the same task again, which the lesson already offers. */
    expect(scheduleFor(solve({ solved: false, assistanceDelivered: true }), at)).toBeNull();
  });

  it("agrees with the store about what 'due' means", () => {
    expect(isDue("2026-09-06T09:00:00.000Z", new Date("2026-09-06T09:00:01.000Z"))).toBe(true);
    expect(isDue("2026-09-06T09:00:00.000Z", new Date("2026-09-05T09:00:00.000Z"))).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* The original solve, as the ledger records it                               */
/* -------------------------------------------------------------------------- */

describe("eligibility comes from recorded evidence, never from a guess", () => {
  beforeAll(async () => {
    /* A learner who tried three times, took a level-2 hint that actually
       streamed, and then solved it. Written exactly as `/api/nova/hint` and
       `/api/learning/submit` write it: an `interventions` row carrying the
       LEVEL, and an `assistance_delivered` event proving it ARRIVED. */
    await append(ORIGIN_EPISODE, [
      ["episode_opened", "server", { task_ref: `sx-lesson:${BLOCK_ID}`, task_kind: "lesson" }],
      ["verdict_received", "judge", { verdict: "wrong_answer", task_ref: `sx-lesson:${BLOCK_ID}` }],
      ["verdict_received", "judge", { verdict: "wrong_answer", task_ref: `sx-lesson:${BLOCK_ID}` }],
      ["verdict_received", "judge", { verdict: "wrong_answer", task_ref: `sx-lesson:${BLOCK_ID}` }],
      ["assistance_requested", "server", { requested_level: 2, granted_level: 2 }],
    ]);
    await store.recordIntervention({
      interventionId: randomUUID(),
      subjectId: SUBJECT,
      episodeId: ORIGIN_EPISODE,
      kind: "hint",
      level: 2,
      trigger: "learner_requested",
      mode: null,
      containsCode: false,
      contentLen: 140,
    });
    await append(ORIGIN_EPISODE, [
      ["assistance_delivered", "server", { level: 2, content_len: 140 }],
      ["verdict_received", "judge", { verdict: "accepted", task_ref: `sx-lesson:${BLOCK_ID}` }],
    ]);
  });

  it("reads the solve out of both halves of the assistance record", async () => {
    /* Two tables, two different jobs. The EVENT proves the help arrived — the
       hint route writes `assistance_requested` up front and
       `assistance_delivered` only once tokens have reached the learner, so a
       provider outage is not recorded as help the learner had. The
       `interventions` row carries how much. */
    const evidence = await store.solveEvidence(SUBJECT, ORIGIN_EPISODE);
    expect(evidence).toEqual({
      accepted: true,
      assistanceDelivered: true,
      assistanceLevel: 2,
    });
  });

  it("reports no assistance for an episode where nothing was delivered", async () => {
    const clean = randomUUID();
    await append(clean, [
      ["episode_opened", "server", { task_ref: "sx-lesson:m1.l1.b4", task_kind: "lesson" }],
      ["verdict_received", "judge", { verdict: "accepted", task_ref: "sx-lesson:m1.l1.b4" }],
    ]);
    expect(await store.solveEvidence(SUBJECT, clean)).toEqual({
      accepted: true,
      assistanceDelivered: false,
      assistanceLevel: -1,
    });
  });

  it("queues the re-solve from that evidence", async () => {
    const evidence = await store.solveEvidence(SUBJECT, ORIGIN_EPISODE);
    const schedule = scheduleFor(
      {
        blockId: BLOCK_ID,
        blockType: findBlock(BLOCK_ID)!.block.type,
        taskKind: "lesson",
        solved: evidence.accepted,
        assistanceDelivered: evidence.assistanceDelivered,
        assistanceLevel: evidence.assistanceLevel,
      },
      new Date("2026-09-01T09:00:00.000Z"),
    )!;

    expect(
      await store.scheduleReview({
        subjectId: SUBJECT,
        blockId: BLOCK_ID,
        reason: schedule.reason,
        originEpisodeId: ORIGIN_EPISODE,
        originAt: "2026-09-01T09:00:00.000Z",
        originLevel: schedule.assistanceLevel,
        dueAt: schedule.dueAt,
        policyId: REVIEW_POLICY.id,
      }),
    ).toBe(true);

    const due = await store.dueReviews(SUBJECT, "2026-09-10T09:00:00.000Z");
    expect(due).toHaveLength(1);
    reviewId = due[0].reviewId;
    expect(due[0].originLevel).toBe(2);
  });
});

/* -------------------------------------------------------------------------- */
/* The reset — the assertion this phase is for                                */
/* -------------------------------------------------------------------------- */

describe("a re-solve starts clean", () => {
  beforeAll(async () => {
    const opened = await store.startReview(SUBJECT, reviewId, randomUUID());
    reviewEpisode = opened!.reviewEpisodeId!;
  });

  it("runs in an episode that is not the original", async () => {
    expect(reviewEpisode).not.toBe(ORIGIN_EPISODE);
  });

  it("inherits NO hint level", async () => {
    /* `lastGrantedLevel` is `max(level) from interventions where episode_id`.
       Per episode, which is why a fresh one reads the sentinel. If this ever
       became per subject-and-block, the ladder would open at rung 2 on a task
       the learner is being asked to do alone. */
    expect(await store.lastGrantedLevel(ORIGIN_EPISODE)).toBe(2);
    expect(await store.lastGrantedLevel(reviewEpisode)).toBe(-1);
    expect(await store.lastHintAt(reviewEpisode)).toBeNull();
  });

  it("puts even «just tell me» back at the opening rung", async () => {
    /* The strongest form of the assertion. `learnerOverride` is honoured in one
       tap — that is deliberate and it is what keeps the tutor from being a wall
       — but only once the learner has attempted something in THIS episode. On
       the original, the same request hands over level 4. On the review it hands
       over nothing, for the same reason it would on a task never seen before. */
    const onOriginal = await enforceHintPolicy({
      store,
      subjectId: SUBJECT,
      episodeId: ORIGIN_EPISODE,
      requested: 4,
      learnerOverride: true,
    });
    expect(onOriginal.grant.granted).toBe(4);
    expect(onOriginal.grant.reason).toBe("learner_override");

    const onReview = await enforceHintPolicy({
      store,
      subjectId: SUBJECT,
      episodeId: reviewEpisode,
      requested: 4,
      learnerOverride: true,
    });
    expect(onReview.grant.granted).toBe(0);
    expect(onReview.grant.reason).toBe("attempt_required");
  });

  it("inherits NO failed attempts, so nothing is revealed on a first wrong answer", async () => {
    /* `revealFor` opens the answer from the third failure on the same block,
       counted from the episode's own ledger. The original episode is already
       past that line. The review must not be — a re-solve that hands back the
       answer on the first mistake measures nothing. */
    const block = findBlock(BLOCK_ID)!.block;

    const priorOnOriginal = await failedAttempts(ORIGIN_EPISODE);
    expect(priorOnOriginal).toBeGreaterThanOrEqual(ATTEMPTS_BEFORE_REVEAL);
    expect(revealFor({ block, verdict: "wrong", failedAttempts: priorOnOriginal + 1 })).toBeDefined();

    const priorOnReview = await failedAttempts(reviewEpisode);
    expect(priorOnReview).toBe(0);
    expect(revealFor({ block, verdict: "wrong", failedAttempts: priorOnReview + 1 })).toBeUndefined();
  });

  it("surfaces no previous solution and no answer key", () => {
    /* The re-solve is served the same public projection a lesson page sends —
       there is no separate "review payload" that could quietly carry more.
       `public.ts` exists because a reference solution and a hidden input were
       once provably in the page source, and a re-solve that shipped either
       would be a re-solve of nothing.

       The block this review serves is a prediction. Its key is checked
       STRUCTURALLY rather than by substring, because its expected output is
       literally the text inside the program it asks about — that string is the
       QUESTION and must stay. */
    const projected = publicBlock(findBlock(BLOCK_ID)!.block);
    expect(Object.keys(projected)).not.toContain("answer");
    expect(JSON.stringify(projected)).not.toContain(ORIGIN_EPISODE);

    /* And a code task, where the secrets are strings that could only have come
       from the key. `m1.l3.b4` carries a reference solution and withholds two
       of its four cases. */
    const coded = findBlock("m1.l3.b4")!.block;
    if (coded.type !== "write_code") throw new Error("m1.l3.b4 is no longer a write_code block");

    const hidden = coded.cases.filter((c) => c.hidden);
    expect(hidden.length).toBeGreaterThan(0);

    const payload = JSON.stringify(publicBlock(coded));
    for (const secret of [coded.referenceSolution, ...hidden.map((c) => c.expectedOutput)]) {
      expect(payload.includes(secret), `leaked: ${secret}`).toBe(false);
    }
    /* The COUNT survives, deliberately: "there are 2 more tests you cannot see"
       is true, useful, and impossible to exploit. */
    expect(payload).toContain(`"hiddenCaseCount":${hidden.length}`);
  });

  it("records the re-solve separately from the original attempt", async () => {
    /* Fresh independence evidence, on its own rows. The reducer folds by
       episode, so the review gets its own `attempt_episodes` row with its own
       `max_assistance_level` and `independence_weight` — the re-solve's
       independence is never averaged into the assisted original, and the
       original is never rewritten by the re-solve. */
    const originalBefore = (await store.eventsForEpisode(ORIGIN_EPISODE)).length;

    await append(reviewEpisode, [
      ["episode_opened", "server", { task_ref: `sx-lesson:${BLOCK_ID}`, task_kind: "lesson" }],
      ["verdict_received", "judge", { verdict: "accepted", task_ref: `sx-lesson:${BLOCK_ID}` }],
    ]);

    const reviewEvents = await store.eventsForEpisode(reviewEpisode);
    expect(reviewEvents).toHaveLength(2);
    expect((await store.eventsForEpisode(ORIGIN_EPISODE)).length).toBe(originalBefore);
  });

  it("settles the outcome from the review's own ledger, not from a claim", async () => {
    /* The browser says "I am done"; the server says what happened. A client
       that could name the outcome could name `resolved_independently` for a
       task it never opened, and independence is the one thing this feature
       exists to measure honestly. */
    const evidence = await store.solveEvidence(SUBJECT, reviewEpisode);
    expect(evidence.accepted).toBe(true);
    expect(evidence.assistanceDelivered).toBe(false);

    const outcome = evidence.accepted
      ? evidence.assistanceDelivered
        ? "resolved_with_assistance"
        : "resolved_independently"
      : "unresolved";

    expect(await store.completeReview(SUBJECT, reviewId, outcome)).toBe(true);
    const settled = await store.reviewFor(SUBJECT, reviewId);
    expect(settled!.outcome).toBe("resolved_independently");
    expect(await store.dueReviews(SUBJECT, "2099-01-01T00:00:00.000Z")).toHaveLength(0);
  });
});

/* -------------------------------------------------------------------------- */

type EventSpec = [string, "server" | "judge" | "verifier", Record<string, unknown>];

async function append(episodeId: string, specs: readonly EventSpec[]): Promise<void> {
  const sessionId = randomUUID();
  const rows: LearningEventRow[] = specs.map(([eventName, sourceTrust, payload], seq) => ({
    eventId: randomUUID(),
    subjectId: SUBJECT,
    episodeId,
    sessionId,
    seq,
    eventName: eventName as LearningEventRow["eventName"],
    occurredAt: new Date().toISOString(),
    sourceTrust,
    environment: "development",
    cohort: "public",
    route: "/lesson/m1.l1",
    payload: payload as LearningEventRow["payload"],
  }));
  await store.appendEvents(rows);
}

/** The same count `/api/learning/submit` derives before deciding on a reveal. */
async function failedAttempts(episodeId: string): Promise<number> {
  const events = await store.eventsForEpisode(episodeId);
  return events.filter(
    (e) =>
      e.event_name === "verdict_received" &&
      typeof e.payload === "object" &&
      e.payload !== null &&
      (e.payload as { verdict?: unknown }).verdict !== "accepted",
  ).length;
}
