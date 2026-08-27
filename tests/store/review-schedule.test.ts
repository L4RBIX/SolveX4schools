import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { REVIEW_POLICY } from "@schools/policies/review";

/**
 * The delayed re-solve queue.
 *
 * The programme's fifth independence check (PDF p.6): «Көмекпен шешілген есеп
 * бірнеше аптадан соң қайта беріледі және бұл жолы көмексіз орындалады». The
 * audit recorded it as the one requirement with nothing behind it, because it
 * needed a queue, a due date and a way to re-open a settled block.
 *
 * Everything below runs against a real Postgres (PGlite) with the shipped
 * migrations applied, because what is being asserted is SQL: a unique
 * constraint, a CHECK, a partial index's predicate and a cascade. None of it is
 * checkable by reading the TypeScript around it, and one of them —
 * `review_schedule_fresh_episode` — is the constraint the entire feature rests
 * on.
 */

const SUBJECT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const ORIGIN = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const PAST = "2026-08-01T09:00:00.000Z";
const DUE_PAST = "2026-08-06T09:00:00.000Z";
const DUE_FUTURE = "2099-01-01T00:00:00.000Z";
const NOW = "2026-08-20T09:00:00.000Z";

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

function row(over: Partial<Parameters<LearningStore["scheduleReview"]>[0]> = {}) {
  return {
    subjectId: SUBJECT,
    blockId: "m1.l3.b4",
    reason: "solved_with_assistance" as const,
    originEpisodeId: ORIGIN,
    originAt: PAST,
    originLevel: 2,
    dueAt: DUE_PAST,
    policyId: REVIEW_POLICY.id,
    ...over,
  };
}

describe("scheduleReview", () => {
  it("queues a re-solve and reads it back as due", async () => {
    expect(await store.scheduleReview(row())).toBe(true);

    const due = await store.dueReviews(SUBJECT, NOW);
    expect(due).toHaveLength(1);
    expect(due[0]).toMatchObject({
      blockId: "m1.l3.b4",
      reason: "solved_with_assistance",
      originLevel: 2,
      originEpisodeId: ORIGIN,
      policyId: "review.v1",
      reviewEpisodeId: null,
      completedAt: null,
      outcome: null,
    });
  });

  it("is idempotent per solve, so a task run twice does not queue twice", async () => {
    /* `/api/learning/submit` calls this on EVERY accepted verdict. A learner
       who re-runs a task they already solved must not collect a review per run,
       and the natural key — subject, block, origin episode — is what makes that
       structural rather than a check somebody has to remember. */
    expect(await store.scheduleReview(row())).toBe(false);
    expect(await store.dueReviews(SUBJECT, NOW)).toHaveLength(1);
  });

  it("queues a SECOND review when the same block is solved in a new episode", async () => {
    /* Not a duplicate: a different episode is a different solve. This is how a
       re-solve that still needed help earns another one, which is the loop the
       programme describes and the reason it terminates when the learner no
       longer needs it. */
    const second = randomUUID();
    expect(
      await store.scheduleReview(row({ originEpisodeId: second, dueAt: DUE_FUTURE })),
    ).toBe(true);
    expect(await store.dueReviews(SUBJECT, NOW)).toHaveLength(1);
    expect(await store.pendingReviews(SUBJECT, NOW)).toHaveLength(1);
  });

  it("separates due from pending on the wall clock, not on a flag", async () => {
    const pending = await store.pendingReviews(SUBJECT, NOW);
    expect(pending.every((r) => new Date(r.dueAt).getTime() > new Date(NOW).getTime())).toBe(true);

    /* The same rows are due once the delay has elapsed. Nothing has to be
       swept, promoted or recomputed — a due date is a due date. */
    const later = await store.dueReviews(SUBJECT, "2099-06-01T00:00:00.000Z");
    expect(later).toHaveLength(2);
  });

  it("never returns another learner's queue", async () => {
    await store.scheduleReview(row({ subjectId: OTHER, blockId: "m1.l5.b3" }));
    const mine = await store.dueReviews(SUBJECT, "2099-06-01T00:00:00.000Z");
    expect(mine.map((r) => r.blockId)).not.toContain("m1.l5.b3");
    expect(await store.reviewFor(SUBJECT, (await store.dueReviews(OTHER, NOW))[0].reviewId)).toBeNull();
  });

  it("refuses a reason nobody declared", async () => {
    /* The CHECK is the guard against a third value meaning "the system thought
       it would be good for them". Both shipped reasons are facts the ledger can
       prove; there is deliberately no room for a guess. */
    await expect(
      sql.query(
        `insert into review_schedule
           (review_id, subject_id, block_id, reason, origin_episode_id, origin_at, due_at)
         values ($1,$2,'m1.l1.b2','system_thought_so',$3,$4,$5)`,
        [randomUUID(), SUBJECT, randomUUID(), PAST, DUE_PAST],
      ),
    ).rejects.toThrow();
  });
});

describe("startReview — the fresh episode", () => {
  let reviewId: string;

  beforeAll(async () => {
    reviewId = (await store.dueReviews(SUBJECT, NOW))[0].reviewId;
  });

  it("binds a NEW episode, never the original", async () => {
    /* The entire independence reset in one assertion. Every mechanism that
       resets — `lastGrantedLevel`, `hasAttempted`, the reveal counter, the
       reducer's independence weight — is keyed on the episode id, so a review
       that reused the original would inherit all four. */
    const opened = await store.startReview(SUBJECT, reviewId, randomUUID());
    expect(opened).not.toBeNull();
    expect(opened!.reviewEpisodeId).not.toBeNull();
    expect(opened!.reviewEpisodeId).not.toBe(ORIGIN);
    expect(opened!.startedAt).not.toBeNull();
  });

  it("is idempotent — reopening returns the SAME episode", async () => {
    /* A learner who reloads the page must land back in the same re-solve.
       Minting a second episode per visit would fragment one attempt into
       several, each with no prior effort in it, so the hint ladder would reset
       mid-task and independence would be measured over a fragment. */
    const first = (await store.reviewFor(SUBJECT, reviewId))!.reviewEpisodeId;
    const again = await store.startReview(SUBJECT, reviewId, randomUUID());
    expect(again!.reviewEpisodeId).toBe(first);
  });

  it("cannot be pointed at another learner's review", async () => {
    expect(await store.startReview(OTHER, reviewId, randomUUID())).toBeNull();
  });

  it("is refused by the DATABASE when the two episodes are the same", async () => {
    /* Belt and braces, and worth the constraint: the reset is currently
       guaranteed by a route that mints a UUID, and one careless assignment
       there would turn the whole independence check into a lie that nothing
       else would notice. */
    await expect(
      sql.query(
        `update review_schedule set review_episode_id = origin_episode_id
          where review_id = $1`,
        [reviewId],
      ),
    ).rejects.toThrow();
  });
});

describe("completeReview", () => {
  it("settles once and only once", async () => {
    const reviewId = (await store.dueReviews(SUBJECT, NOW))[0].reviewId;
    expect(await store.completeReview(SUBJECT, reviewId, "resolved_independently")).toBe(true);
    expect(await store.completeReview(SUBJECT, reviewId, "resolved_with_assistance")).toBe(false);

    const settled = await store.reviewFor(SUBJECT, reviewId);
    expect(settled!.outcome).toBe("resolved_independently");
    expect(settled!.completedAt).not.toBeNull();
  });

  it("drops the settled review out of the queue", async () => {
    const due = await store.dueReviews(SUBJECT, NOW);
    expect(due).toHaveLength(0);
  });

  it("refuses to re-open a settled re-solve", async () => {
    /* A settled review's evidence IS the record. Letting it run again would let
       an independent solve be overwritten by an assisted one. */
    const settled = await sql.query<{ review_id: string }>(
      `select review_id from review_schedule where subject_id = $1 and completed_at is not null`,
      [SUBJECT],
    );
    expect(settled.rows).toHaveLength(1);
    expect(await store.startReview(SUBJECT, settled.rows[0].review_id, randomUUID())).toBeNull();
  });

  it("accepts `unresolved`, which is not a failure", async () => {
    /* What a written or oral re-solve settles as, because no machine scores
       one — the same honesty `unknown` carries everywhere else in this product. */
    const id = randomUUID();
    await store.scheduleReview(
      row({ blockId: "m1.as.b4", originEpisodeId: id, dueAt: DUE_PAST }),
    );
    const queued = (await store.dueReviews(SUBJECT, NOW))[0];
    await store.startReview(SUBJECT, queued.reviewId, randomUUID());
    expect(await store.completeReview(SUBJECT, queued.reviewId, "unresolved")).toBe(true);
  });
});

describe("the queue is erased with the learner", () => {
  it("cascades from learning_subjects, so consent revocation still works", async () => {
    /* Migration 0007 had to go and fix a `forget_user` that errored out on a
       bare foreign key. A child asking to be forgotten must not leave a list of
       the tasks they needed help with behind. */
    const doomed = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    await sql.query(
      `insert into learning_subjects (subject_id, cohort) values ($1, 'public')`,
      [doomed],
    );
    await store.scheduleReview(row({ subjectId: doomed, originEpisodeId: randomUUID() }));

    await sql.query(`delete from learning_subjects where subject_id = $1`, [doomed]);

    const left = await sql.query<{ n: number }>(
      `select count(*)::int as n from review_schedule where subject_id = $1`,
      [doomed],
    );
    expect(left.rows[0].n).toBe(0);
  });
});
