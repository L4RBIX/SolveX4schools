import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getStore } from "@schools/store";
import type { ReviewRow } from "@schools/store/learning-store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { findBlock } from "@schools/learning/grade";
import { publicBlock } from "@schools/curriculum/public";

/**
 * Delayed re-solve — the queue, and opening one.
 *
 * The programme's fifth independence check (PDF p.6): «Көмекпен шешілген есеп
 * бірнеше аптадан соң қайта беріледі және бұл жолы көмексіз орындалады». Rows
 * are written by `/api/learning/submit` the moment a solve earns one; this
 * route is how a learner meets them.
 *
 * ## Scoped by construction
 *
 * No `subjectId` parameter on either verb, the same shape
 * `/api/learning/state/me`, `/api/learning/activity` and
 * `/api/learning/dictionary` already use. Every store call takes the subject
 * from the cookie AND the review id, so there is no query here that can be
 * pointed at another child's queue.
 *
 * ## And gated, because scoping alone answers the wrong question
 *
 * Scoping decides whose queue you see; `checkLearningAccess` decides whether
 * you are entitled to a queue. Without it `resolveIdentity` minted a subject
 * for an unauthenticated caller — who then got an empty queue, which is
 * harmless, and a row in `learning_subjects`, which is not: the class list a
 * teacher reads is supposed to be the class.
 *
 * ## Why the block is not in the listing
 *
 * GET returns metadata only — what is due, when, and which lesson it came
 * from. The task itself arrives on `start`, and only for the review actually
 * being opened. Two reasons, and the second is the real one: a queue is a
 * short list a learner glances at, and sending eight tasks' worth of content to
 * paint it is waste; but also, `start` is where the fresh episode is minted, so
 * "you have the task" and "the re-solve has begun" become the same event rather
 * than two things that can drift apart.
 *
 * ## The assistance reset lives on `start`
 *
 * The episode id is generated HERE, on the server, per review, and stored. It
 * is never accepted from the body. That single fact is what makes
 * «бұл жолы көмексіз» true rather than aspirational:
 *
 *   * `LearningStore.lastGrantedLevel` reads the hint ladder from
 *     `interventions` by episode. A fresh episode has none, so the ladder is
 *     back at its opening rung.
 *   * `enforceHintPolicy` derives `hasAttempted` from that episode's own
 *     events, so the first hint request on a review answers `attempt_required`
 *     exactly as it would on an unseen task.
 *   * `revealFor` counts failed attempts on the episode, so nothing is revealed
 *     on a first wrong answer — the original attempt's three failures are not
 *     inherited.
 *   * The reducer folds the review into its own `attempt_episodes` row, so the
 *     independence it demonstrates is measured over the re-solve alone.
 *
 * A browser that could name the episode could name the ORIGINAL one and undo
 * all four. The database refuses that too — `review_schedule_fresh_episode` —
 * but the id never leaving the server is why it never gets that far.
 */

export const runtime = "nodejs";

/** How many rows a learner is shown at once. A queue, not an archive. */
const LIST_LIMIT = 20;

interface ReviewSummary {
  reviewId: string;
  blockId: string;
  lessonId: string;
  lessonTitle: { kk: string; ru: string };
  monthIndex: number;
  reason: ReviewRow["reason"];
  dueAt: string;
  /** True once the learner has opened it. A re-solve in progress is not a new one. */
  started: boolean;
}

export async function GET() {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  const now = new Date().toISOString();

  const [due, later] = await Promise.all([
    store.dueReviews(subjectId, now, LIST_LIMIT),
    store.pendingReviews(subjectId, now, LIST_LIMIT),
  ]);

  return Response.json({
    due: due.map(summarise).filter(isPresent),
    later: later.map(summarise).filter(isPresent),
  });
}

interface ReviewActionBody {
  action?: "start" | "finish";
  reviewId?: string;
}

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  let body: ReviewActionBody;
  try {
    body = (await request.json()) as ReviewActionBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const reviewId = typeof body.reviewId === "string" ? body.reviewId : "";
  if (!isUuid(reviewId)) {
    return NextResponse.json({ error: "reviewId required" }, { status: 400 });
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();

  const existing = await store.reviewFor(subjectId, reviewId);
  if (!existing) {
    /* Not "forbidden". A review id that does not resolve against this learner's
       own queue names nothing at all, and distinguishing "someone else's
       review" from "no such review" would leak the difference. */
    return NextResponse.json({ error: "unknown review" }, { status: 404 });
  }

  const res =
    body.action === "finish"
      ? await finish(store, subjectId, existing)
      : await start(store, subjectId, existing);

  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}

/**
 * Open a re-solve.
 *
 * Idempotent: reopening returns the episode already bound to this review rather
 * than minting a second one. A learner who reloads the page must land back in
 * the same re-solve, or the hint ladder would reset mid-task and the
 * independence measurement would be taken over a fragment of the work.
 */
async function start(
  store: Awaited<ReturnType<typeof getStore>>,
  subjectId: string,
  review: ReviewRow,
): Promise<NextResponse> {
  const target = findBlock(review.blockId);
  if (!target) {
    /* The block left the curriculum. There is nothing to re-solve, so the row
       is not rendered as a dangling id — the same treatment the error
       dictionary gives an entry whose block is gone. */
    return NextResponse.json({ error: "unknown review" }, { status: 404 });
  }

  const opened = await store.startReview(subjectId, review.reviewId, randomUUID());
  if (!opened || !opened.reviewEpisodeId) {
    /* Already completed. A settled re-solve does not re-open: the evidence it
       produced is the record, and letting it be run again would let a learner
       overwrite an independent solve with an assisted one. */
    return NextResponse.json({ error: "review already completed" }, { status: 409 });
  }

  return NextResponse.json({
    reviewId: opened.reviewId,
    /* The FRESH episode. Everything the learner does in this re-solve is
       recorded under it, separately from the original attempt. */
    episodeId: opened.reviewEpisodeId,
    lessonId: target.lesson.id,
    lessonTitle: target.lesson.title,
    monthIndex: target.month.index,
    reason: opened.reason,
    /* The public projection, exactly as a lesson page would send it: no
       reference solution, no hidden cases, no answer. A re-solve that shipped
       the key would be a re-solve of nothing. */
    block: publicBlock(target.block),
  });
}

/**
 * Settle a re-solve.
 *
 * The outcome is read from the review episode's own ledger and never from the
 * request. The browser says "I am done"; the server says what happened, and it
 * says it from `verdict_received` and `assistance_delivered` rows written by
 * `/api/learning/submit` and `/api/nova/hint` on this same server.
 *
 * `unresolved` is not a failure verdict. It is what a written or oral re-solve
 * settles as, because no machine scores one — the same honesty `unknown`
 * carries everywhere else in this product.
 */
async function finish(
  store: Awaited<ReturnType<typeof getStore>>,
  subjectId: string,
  review: ReviewRow,
): Promise<NextResponse> {
  if (!review.reviewEpisodeId) {
    return NextResponse.json({ error: "review not started" }, { status: 409 });
  }

  const evidence = await store.solveEvidence(subjectId, review.reviewEpisodeId);
  const outcome = evidence.accepted
    ? evidence.assistanceDelivered
      ? ("resolved_with_assistance" as const)
      : ("resolved_independently" as const)
    : ("unresolved" as const);

  const closed = await store.completeReview(subjectId, review.reviewId, outcome);
  return NextResponse.json({ reviewId: review.reviewId, outcome, closed });
}

/* -------------------------------------------------------------------------- */

function summarise(row: ReviewRow): ReviewSummary | null {
  const target = findBlock(row.blockId);
  if (!target) return null;
  return {
    reviewId: row.reviewId,
    blockId: row.blockId,
    lessonId: target.lesson.id,
    lessonTitle: target.lesson.title,
    monthIndex: target.month.index,
    reason: row.reason,
    dueAt: row.dueAt,
    started: row.reviewEpisodeId !== null,
    /* `originLevel` is deliberately NOT here. How much help the learner needed
       the first time is a fact a teacher may read from the ledger; handing it
       back to the child as a number beside the task is a label on them at the
       exact moment they are being asked to work without one. */
  };
}

function isPresent(row: ReviewSummary | null): row is ReviewSummary {
  return row !== null;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
