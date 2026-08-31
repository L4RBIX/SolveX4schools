import { NextResponse } from "next/server";
import { findCompletable, type Completable } from "@schools/curriculum/inventory";
import { getStore, getStoreHandle } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { monthUnlockedFor } from "@schools/learning/access";
import { bump, opsLog } from "@schools/ops/counters";
import { resolveTrack } from "@schools/learning/track";
import { completionTarget } from "@schools/policies/lookup";
import { evaluateCompletion, levelFromEvidence } from "@schools/policies/completion";
import { creditCompletion } from "@schools/leagues/credit";
import { leagueScopeForCurrentUser } from "@schools/leagues/scope";

/**
 * A finished lesson, recorded on the server.
 *
 * ## Why this route exists
 *
 * Completion lived in `localStorage` under `solvex.progress.v1` and nowhere
 * else. That is fine for painting the gameboard the instant a lesson ends, and
 * it is not a record: a school's account of who finished what cannot live in
 * one browser and die with a cleared cache.
 *
 * The browser copy stays. `markLessonComplete` still runs first in
 * `lesson-route.tsx`, because it is what makes the board change in the same
 * frame and it is the only copy the board reads today. This is the copy that
 * survives.
 *
 * ## The completion POLICY is checked here, and it is checked against evidence
 *
 * This route used to write a row for any real lesson id. The rule that made
 * that safe — "the footer forces Check on every attempt block, so a lesson
 * cannot be clicked through" — lived in the shape of a React callback, applied
 * only to learners using the UI, and was worth nothing against `curl`. The
 * audit's own words (§7, P1-10): completion is a policy the school should set,
 * not one the player should imply.
 *
 * So `schools/policies/completion.ts` states the rule, and this route evaluates
 * it against `learning_events` — the same ledger that holds every graded
 * verdict, written by `/api/learning/submit` on this server. The client's four
 * counts are still accepted as the tally of a screen, and they are still not
 * evidence; the evidence is what the learner actually submitted.
 *
 * A claim the ledger does not support is **409**, not a clamped row. Writing a
 * plausible completion for an implausible request is how a school record stops
 * meaning anything.
 *
 * ## What is not taken on trust
 *
 * - **The lesson id.** Looked up in the curriculum. An id nobody authored is a
 *   404, not a lesson we have yet to write. Draft lessons are not routable, so
 *   a completion for one did not come from a learner finishing it either.
 * - **The counts.** They are the player's own tally and cannot be re-derived
 *   here — but they have a ceiling: a lesson has N blocks and no block can be
 *   counted twice. A body claiming more is refused rather than clamped, because
 *   clamping writes a plausible number for a request that was never plausible.
 * - **Which blocks were required.** Taken from the curriculum and filtered by
 *   the learner's own track, not from the body. A support learner is never
 *   shown the blocks their route excludes, so requiring them would lock out
 *   exactly the learners differentiation exists to help.
 * - **The subject.** Read from the httpOnly cookie, never from the body.
 */

export const runtime = "nodejs";

interface CompleteBody {
  lessonId?: string;
  correct?: number;
  wrong?: number;
  unmeasured?: number;
  attempts?: number;
}

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  let body: CompleteBody;
  try {
    body = (await request.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const lessonId = body.lessonId;
  if (typeof lessonId !== "string") {
    return NextResponse.json({ error: "lessonId required" }, { status: 400 });
  }

  const target = findCompletable(lessonId);
  if (!target || !isRoutable(target)) {
    return NextResponse.json({ error: "unknown lesson" }, { status: 404 });
  }

  const counts = readCounts(body, target.blockCount);
  if (!counts) {
    return NextResponse.json({ error: "impossible counts" }, { status: 400 });
  }

  /* The learner's own route through the month, from the same cookie the lesson
     page read when it built the payload. Resolved after the id is known,
     because the track is per month and the month comes from the curriculum. */
  const track = await resolveTrack(target.monthIndex);
  const governed = completionTarget(lessonId, track);
  if (!governed) {
    return NextResponse.json({ error: "unknown lesson" }, { status: 404 });
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();

  /* A completion in a month this learner has not unlocked is not a completion.
     Without this a learner could not GRADE anything in March — `submit` refuses
     — but could still post a bare completion for a March lesson and have the
     row written, which would then unlock April. The gate that decides
     progression must not be reachable by the request that claims progression.

     Same 404 and same silence as `submit`; see `schools/policies/unlock.ts`. */
  if (!(await monthUnlockedFor(subjectId, target.monthIndex))) {
    return NextResponse.json({ error: "unknown lesson" }, { status: 404 });
  }

  /* Evidence, not assertion. Every block the policy governs is looked up in the
     ledger; a block with no submission recorded reaches `none` and the decision
     says so by name. */
  const evidence = await store.blockAttempts(
    subjectId,
    governed.blocks.filter((b) => b.isAttempt).map((b) => b.id),
  );

  const decision = evaluateCompletion({
    policy: governed.policy,
    blocks: governed.blocks,
    reached: (blockId) =>
      levelFromEvidence(
        evidence.get(blockId) ?? { blockId, submissions: 0, verdicts: 0, accepted: false },
      ),
  });

  if (!decision.satisfied) {
    /* 409, and the outstanding list is returned in full.
     *
     * The block ids are already in the learner's own lesson payload, so nothing
     * is disclosed by naming them — and a client that is told only "no" cannot
     * tell a learner what is left, which turns a policy into a mystery. The
     * rungs are the policy's own vocabulary, never a judgement: `answered` and
     * `measured` describe the record, not the child. */
    return NextResponse.json(
      {
        error: "policy_unsatisfied",
        policyId: decision.policyId,
        governed: decision.governed,
        met: decision.met,
        outstanding: decision.outstanding,
      },
      { status: 409 },
    );
  }

  /*
   * A failed write is reported, not swallowed.
   *
   * This throw used to escape the handler as an unhandled 500, and the caller
   * was `void fetch(...).catch(() => {})` — so a completion that never reached
   * the school's record produced exactly nothing: no error, no retry, no trace.
   * The learner saw the board tick over (that copy is `localStorage`, and it
   * did succeed) while the school's account of who finished what silently lost
   * a row.
   *
   * 503 with `retryable: true`, because that is precisely what it is: the
   * request was valid and the store was not available. The client queues it and
   * sends it again — see `src/lib/pending-writes.ts`.
   */
  let first: boolean;
  try {
    first = await store.recordLessonCompletion({
      subjectId,
      lessonId,
      ...counts,
      /* Stored, so a January row can still be explained after the rule changes.
         See migration 0015. */
      policyId: decision.policyId,
    });
  } catch (err) {
    bump("save.completion_failures");
    opsLog("save.completion_failed", {
      // The lesson, not the learner. A lesson id is curriculum, not personal data.
      lesson_id: lessonId,
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
    return NextResponse.json(
      { error: "not_recorded", retryable: true, lessonId },
      { status: 503 },
    );
  }

  /*
   * League XP for the completion.
   *
   * Only on `first`, and only outside the store call because
   * `recordLessonCompletion` owns its own transaction and this route has no way
   * to join it. That is a genuine difference from the submit path, where the
   * award rides the verdict's transaction — so here the award has to stand on
   * its own idempotency, and it does: the key is the lesson id, so a completion
   * replayed by `pending-writes` after a network failure credits nothing twice.
   *
   * Failure is swallowed on purpose and the shape of the swallow matters. A
   * lesson that IS recorded must never be reported as not recorded because a
   * game did not get its points — the learner would resend a completion the
   * school already has. The XP is the thing that can be missing here; the
   * record is not.
   */
  let leagueGained = 0;
  if (first) {
    const scope = await leagueScopeForCurrentUser();
    if (scope) {
      try {
        const { sql } = await getStoreHandle();
        const award = await sql.tx((t) =>
          creditCompletion(t, {
            subjectId,
            schoolId: scope.schoolId,
            classId: scope.classId,
            entityId: lessonId,
            kind: target.kind,
            now: new Date(),
          }),
        );
        leagueGained = award?.gained ?? 0;
      } catch (err) {
        opsLog("league.completion_award_failed", {
          lesson_id: lessonId,
          message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
        });
      }
    }
  }

  /* `first: false` is a successful, correct outcome — the learner has finished
     this lesson before and the original record stands. It is reported rather
     than hidden so a caller can tell "already known" from "just recorded"
     without inferring it from a status code. */
  const res = NextResponse.json({
    lessonId,
    first,
    policyId: decision.policyId,
    ...(leagueGained > 0 ? { league: { gained: leagueGained } } : {}),
  });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}

/** The same guard the lesson page applies: a draft or empty lesson has no URL. */
function isRoutable(target: Completable): boolean {
  return target.status !== "draft" && target.blockCount > 0;
}

/**
 * Read the four counts, or refuse the request.
 *
 * Absent is zero — an older client that posts only a lesson id still records a
 * completion, which is the part that matters. Present and impossible is a 400.
 */
function readCounts(
  body: CompleteBody,
  blockCount: number,
): { correct: number; wrong: number; unmeasured: number; attempts: number } | null {
  const correct = bounded(body.correct, blockCount);
  const wrong = bounded(body.wrong, blockCount);
  const unmeasured = bounded(body.unmeasured, blockCount);
  const attempts = bounded(body.attempts, blockCount);

  if (correct === null || wrong === null || unmeasured === null || attempts === null) {
    return null;
  }
  /* Every count is over block STATES, one per block, so their sum cannot exceed
     the lesson. The client's lesson is the track-filtered projection and is
     therefore never larger than the authored one, so the authored count is a
     safe ceiling. */
  if (correct + wrong + unmeasured > blockCount) return null;

  return { correct, wrong, unmeasured, attempts };
}

function bounded(value: unknown, max: number): number | null {
  if (value === undefined) return 0;
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > max) return null;
  return value;
}
