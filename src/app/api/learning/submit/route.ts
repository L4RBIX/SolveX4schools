import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sanitizePayload } from "@solvex/learning-contracts";
import { SubmissionAlreadySettledError, type LearningEventRow } from "@schools/store/learning-store";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { monthUnlockedFor } from "@schools/learning/access";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { gateFor } from "@schools/curriculum/gate";
import { ATTEMPTS_BEFORE_REVEAL, justificationFor, revealFor } from "@schools/learning/reveal";
import { signAttestation } from "@schools/learning/sign";
import { BLOCK_ANSWER_KINDS, parseBlockAnswer } from "@schools/learning/checking";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { claimSubmission, isSubmissionId } from "@schools/learning/submission";
import { takeToken } from "@schools/lib/rate-limit";
import { MAX_REQUEST_BYTES, checkPayloadSize, requestTooLarge } from "@schools/exec/limits";
import { bump, opsLog } from "@schools/ops/counters";
import { maybeSweep } from "@schools/reducer/trigger";
import { REVIEW_POLICY, scheduleFor } from "@schools/policies/review";
import { creditSolve } from "@schools/leagues/credit";
import { leagueScopeForCurrentUser } from "@schools/leagues/scope";
import type { AwardResult } from "@schools/leagues/engine";

/**
 * Submit — the trusted grading path.
 *
 * The client posts a block id and an answer. The server looks the block up in
 * the curriculum, grades it with the same pure function the client used, signs
 * the result, and writes the events itself. Nothing the browser said about the
 * outcome is taken on trust.
 *
 * Why the events are written here rather than posted back through `/events`:
 * `failure_attributed` is the one event a browser may never create, and the
 * ingest route drops it unless it arrives attested. Writing it on the same
 * server that graded it means the signature is verified by construction.
 *
 * ## Graded once, whatever the network did
 *
 * This route used to append its events on EVERY call and derive the learner's
 * prior-failure count by counting them, so a double-click or a browser retry
 * was recorded as a second attempt by the same child — inflating their failure
 * count and advancing the reveal policy that is meant to withhold the answer
 * until several genuine attempts have passed.
 *
 * `submissionId` closes that. The client mints one per Check press and holds it
 * while the answer is unchanged; this route claims it before grading and
 * settles it in the same transaction as the events. A second call with the same
 * id replays the first verdict and writes nothing — it does not even reach the
 * judge, which matters on a service sized for a class pressing Check at once.
 * See `schools/learning/submission.ts` for the rule and migration 0019 for the
 * table.
 *
 * ## And nothing oversized is graded at all
 *
 * A learner who pasted a megabyte has not written a wrong program. An oversized
 * answer is refused with a 413 BEFORE identity is resolved, before the judge is
 * called and before a single event exists — so it leaves no trace in the ledger
 * of any kind. See `schools/exec/limits.ts`.
 *
 * ## And nothing malformed is graded either
 *
 * The answer's runtime shape is checked by `parseBlockAnswer` before the block
 * is even looked up, and a body that is not one of the eight variants is a 400
 * that touches nothing. It used to be a cast, and four of the eight variants
 * turned a malformed body into a 500 — one of which threw after the submission
 * claim, burning a learner's Check press. See the guard below.
 */

export const runtime = "nodejs";

/**
 * Seconds this route may take, declared rather than inherited.
 *
 * It had none, and the platform default is not a number this route can live
 * inside: the legitimate worst case is a queue wait plus a batch of cases that
 * each burn their full five seconds of judge CPU. Below that ceiling the batch
 * is BILLED and the learner gets a gateway timeout — money spent, no verdict,
 * and a child told nothing happened.
 *
 * Sixty, and everything downstream is sized against it rather than guessed:
 * `JUDGE0_QUEUE_WAIT_MS` defaults to 38 s and the judge's own budget is the
 * per-case limit plus `overheadBudgetMs`, which leaves the reserve. If this
 * number changes, that one has to change with it — see `schools/config.ts`.
 */
export const maxDuration = 60;

/**
 * How much per-case feedback a wrong verdict carries.
 *
 * Four cases and 400 characters each. The ceiling is about the RESPONSE — a
 * block with eighteen visible cases would otherwise put its whole fixture in
 * every reply — and about the screen: a learner comparing more than about four
 * examples is reading a table rather than debugging.
 */
const MAX_VISIBLE_CASE_FEEDBACK = 4;
const MAX_CASE_TEXT = 400;

interface SubmitBody {
  blockId?: string;
  episodeId?: string;
  /**
   * `unknown`, and that is the point.
   *
   * This field was declared `BlockAnswer`, which made `body.answer` look
   * already-checked to every reader of this file — including the code that
   * dereferenced `.value`, `.values`, `.ids` and `.cells` on it. Nothing had
   * checked it; the declaration was an assertion about a JSON body, and the
   * compiler had no way to keep it. Typing it honestly is what forces the call
   * to `parseBlockAnswer` below, and forces the next person to keep it.
   */
  answer?: unknown;
  /**
   * The idempotency key. A v4 uuid the client mints on the Check press and
   * keeps for as long as the answer is unchanged, so "this submission again" and
   * "a new attempt" are distinguishable. See `schools/learning/submission.ts`.
   */
  submissionId?: string;
  /** Milliseconds the learner spent on the block. Advisory only. */
  elapsedMs?: number;
}

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  /* Before the body is read, not after. `request.json()` buffers whatever
     arrives, so a hundred-megabyte POST is a hundred megabytes of heap in a
     process serving a class — spent before any field-level limit gets a look.
     Reading `content-length` costs nothing and refuses it for nothing. */
  if (requestTooLarge(request)) {
    return NextResponse.json(
      { error: "request too large", limitBytes: MAX_REQUEST_BYTES },
      { status: 413 },
    );
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const blockId = body.blockId;
  if (typeof blockId !== "string") {
    return NextResponse.json({ error: "blockId required" }, { status: 400 });
  }

  /*
   * The answer's runtime shape, and why the check is HERE.
   *
   * `body.answer` used to be cast to `BlockAnswer` and handed straight to code
   * that dereferences its fields — `checkPayloadSize({ sourceCode:
   * answer.value })` below, and `checkBlock`'s per-block branches after it.
   * Four of the eight variants turned a malformed body into an unhandled
   * `TypeError` and a 500 for an ordinary signed-in learner. See
   * `parseBlockAnswer` for the four and for why the parser lives beside the
   * type instead of here.
   *
   * ## Before `findBlock`, deliberately
   *
   * This route answers 404 with one body for three different states — no such
   * block, month not published, month not unlocked for this learner — because
   * distinguishing them lets a caller map the year and other people's progress.
   * The crash broke that: a malformed answer returned 500 for a block that was
   * reachable and 404 for one that was not, which answers the question the 404s
   * refuse. Validating the body BEFORE anything is looked up keeps the 400 a
   * function of the request alone, so it reveals nothing about server state.
   *
   * It is also the earliest point at which it can run, which is what makes a
   * refusal free: no identity has been resolved, no store opened, no cookie
   * set, no row claimed. A 400 from here cannot leave a trace in a child's
   * ledger, for the same reason the 413 below cannot.
   *
   * ## A missing `answer` is a malformed request, not an empty one
   *
   * It used to default to `NO_ANSWER`. Every client sends the field — all three
   * call sites type it as required, and the player's own initial state is an
   * explicit `{ kind: "none" }` — so the default only ever covered a caller
   * that was already broken, and covering it meant grading a block for a
   * learner whose answer never arrived. An explicit `{ kind: "none" }` is still
   * accepted and still means what it always did.
   */
  const answer = parseBlockAnswer(body.answer);
  if (answer === null) {
    /* The kind only, and only when it is one this server knows. The point of
       the counter is "is a stale client sending garbage, and which shape" —
       echoing an arbitrary string from the body into the ops log would make
       this line a place learner input lands in a log file.

       `blockId` is truncated for the same reason, and this is the one branch
       that needs it: every other `opsLog` in this route runs after `findBlock`
       succeeded, so what they log is a curriculum id. This one runs before, by
       design, so `blockId` here is still whatever the caller sent — bounded
       only by the 256 KiB envelope. A real id is under 32 characters. */
    const kind = typeof body.answer === "object" && body.answer !== null
      ? (body.answer as { kind?: unknown }).kind
      : undefined;
    opsLog("submit.invalid_answer", {
      block_id: blockId.slice(0, 64),
      kind: BLOCK_ANSWER_KINDS.has(kind as string) ? String(kind) : "unrecognised",
    });
    /* No detail. Which field was wrong, which kinds exist and what the union
       looks like are all schema internals, and a caller that cannot construct a
       valid answer does not become able to by being told the shape. */
    return NextResponse.json({ error: "invalid answer" }, { status: 400 });
  }

  const target = findBlock(blockId);
  if (!target) {
    return NextResponse.json({ error: "unknown block" }, { status: 404 });
  }

  /*
   * The month has to be one a human approved.
   *
   * The publication gate was enforced on the PAGE and nowhere else, so
   * `/lesson/m9.l1` redirected while `POST /api/learning/submit` with
   * `blockId: "m9.l1.b2"` returned 200, `verdict: "wrong"` and
   * `attested: true` — measured, on a database where only September was
   * published. Every control the pilot's release process is built on runs
   * through this row: the curriculum hash a reviewer signs, the "only
   * September on day one" commitment, the monthly procedure that opens October
   * later. All of it was navigational, and a learner with the network tab open
   * could be graded on material nobody had read.
   *
   * 404 rather than 403, matching the teacher routes: a distinct refusal for
   * "exists but is closed" tells an unauthenticated caller which months are
   * authored, and that is not a question this endpoint should answer.
   *
   * `gateFor` returns `open: true` with `bypassedForDevelopment` outside
   * production, so development and the test suite are unaffected — the same
   * bypass the lesson page already relies on.
   */
  const gate = await gateFor(target.month);
  if (!gate.open) {
    opsLog("submit.unpublished_month", { block_id: blockId, month: String(target.month.index) });
    return NextResponse.json({ error: "unknown block" }, { status: 404 });
  }

  /*
   * Size, and why it is refused HERE.
   *
   * This sits above identity, above the store and above the judge on purpose.
   * An oversized answer must produce NO learner evidence — not a wrong verdict,
   * not an `unknown` one, not even the `episode_opened` / `episode_closed` pair
   * an ungraded block writes. A refusal is ours, not the learner's, and the
   * ledger is a record of what a child did.
   *
   * Applied to every text answer rather than only to code, because the ceiling
   * is about what this service will hold and grade, and a 64 KiB "explanation"
   * is not an explanation either. `checkPayloadSize` is the same function the
   * provider decorator uses, so the route and the judge cannot disagree about
   * what is too big — and it counts UTF-8 bytes, which is what would actually
   * cross the boundary. The check this replaced compared `String.length`
   * against a limit named in bytes, so Kazakh source was measured at half its
   * real size.
   */
  if (answer.kind === "text") {
    const rejection = checkPayloadSize({ sourceCode: answer.value });
    if (rejection) {
      opsLog("submit.payload_rejected", {
        block_id: blockId,
        reason: rejection.reason,
        bytes: rejection.actualBytes,
        limit: rejection.limitBytes,
      });
      return NextResponse.json(
        {
          error: "answer too large",
          reason: rejection.reason,
          limitBytes: rejection.limitBytes,
          actualBytes: rejection.actualBytes,
        },
        { status: 413 },
      );
    }
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();

  /*
   * PUBLISHED is not UNLOCKED, and this is the boundary where that distinction
   * has to hold.
   *
   * All nine months are published, so the gate above no longer restricts
   * anything by itself — it only rejects a month nobody approved. Which months
   * THIS learner may work in is their own record's business, and
   * `schools/policies/unlock.ts` decides it.
   *
   * It sits here rather than beside the publication gate because the answer
   * depends on the learner, and the learner is not known until `resolveIdentity`
   * three lines above. It sits BEFORE grading, before the judge and before any
   * ledger write, so a request for a locked month costs nothing and records
   * nothing — the whole point being that a learner cannot accumulate evidence
   * in March by posting to it.
   *
   * 404 with the same body as an unknown block, for the same reason the
   * publication gate uses one: a distinct "locked" would let anyone enumerate
   * the shape of the year and of other learners' progress.
   */
  if (!(await monthUnlockedFor(subjectId, target.month.index))) {
    opsLog("submit.locked_month", { block_id: blockId, month: String(target.month.index) });
    return NextResponse.json({ error: "unknown block" }, { status: 404 });
  }

  /* The episode is a second key into the ledger and it arrives in the request
     body. `ownedEpisodeId` refuses one that already belongs to another learner,
     and — passed this block — one that already holds work on a DIFFERENT block.

     The second half is what closes the reveal: `priorFailures` below counts
     wrong verdicts on this episode, and three of them open the answer. Without
     the block bound, three failures on block A opened block B's answer key on
     the learner's FIRST attempt at it. See `episode-scope.ts`.

     A legitimate client is unaffected; the id it gets back is the one that was
     used, and both routes already return `episodeId`. */
  const episodeId = await ownedEpisodeId(subjectId, body.episodeId, blockId);

  /*
   * The claim, and it happens BEFORE grading.
   *
   * Deliberately before, not after. A duplicate that re-ran the judge and then
   * discovered it was a duplicate would have burned a sandbox slot to compute a
   * verdict it was about to throw away — on a service sized for eighteen
   * learners pressing Check at the same moment, that is the difference between
   * a double-click being free and a double-click costing somebody else their
   * turn.
   */
  const submissionId = isSubmissionId(body.submissionId) ? body.submissionId : null;
  if (!submissionId) {
    /*
     * No key, no deduplication — and in production that is now a refusal.
     *
     * It used to be logged and graded, which meant the one path that skips the
     * idempotency table also skipped every protection built on it: a loop
     * omitting the field graded and billed the judge indefinitely with no row
     * to collide against, and a genuine double-click on such a client counted
     * twice against the reveal policy. Every client in this repository sends
     * the field — all three call sites type it as required and the player mints
     * it on the Check press — so the only caller this can refuse is a tab
     * loaded before the field existed, or something hand-rolled.
     *
     * 400 with a machine-readable reason and copy the player can act on. The
     * learner's text is untouched: nothing was claimed, nothing was graded,
     * nothing was written, and a reload sends the same answer with a key.
     *
     * Outside production it is logged and graded, exactly as before, because
     * the test suites and the dev harness post without one and refusing them
     * would be a change to what this route MEANS rather than to what it costs.
     */
    if (config.environment === "production") {
      opsLog("submit.unkeyed_refused", { block_id: blockId });
      return NextResponse.json(
        {
          error: "submissionId required",
          reason: "stale_client",
        },
        { status: 400 },
      );
    }
    opsLog("submit.unkeyed", { block_id: blockId });
  } else {
    const claim = await claimSubmission(store, {
      subjectId,
      submissionId,
      blockId,
      episodeId,
    });

    if (claim.kind === "duplicate") {
      /* The first verdict, replayed verbatim. Not recomputed: `revealFor`
         consults a failure count that may have moved on since, so recomputing
         could open an answer this submission had not earned. */
      const replay = NextResponse.json(claim.response as Record<string, unknown>);
      if (isNew) replay.cookies.set(anonCookie(anonId));
      return replay;
    }

    if (claim.kind === "conflict") {
      /* One id, two blocks. Replaying the other block's verdict would invent a
         result for a task the learner did not just answer. */
      return NextResponse.json(
        { error: "submissionId already used for a different block" },
        { status: 409 },
      );
    }

    if (claim.kind === "unresolved") {
      /* The original is still grading. Nothing was measured and nothing may be
         written, so this says exactly that: no verdict, and `saved: false` so
         the player keeps the answer in the editor and offers Check again. The
         retry will find the settled row. */
      const pending = NextResponse.json({
        verdict: "unknown" as const,
        reveal: null,
        why: null,
        episodeId,
        cases: null,
        saved: false,
        unmeasuredReason: null,
        attested: false,
      });
      if (isNew) pending.cookies.set(anonCookie(anonId));
      return pending;
    }
  }

  /*
   * What this Check costs, charged HERE and not a line earlier.
   *
   * Everything above this point either refused the request for free or replayed
   * a verdict that was already computed. Only from here does the request do
   * work: grade it, and — for a code block — spend a slot on a metered judge.
   * So this is where the budget is taken, and the consequence is the one that
   * matters in a classroom: **a duplicate costs nothing.** A double-click, a
   * reconnecting mobile network, a browser retrying a POST whose response was
   * lost — all of them land on `duplicate` above and never reach this line.
   * Charging before the claim would have made the network's flakiness the
   * learner's problem, which is precisely backwards.
   *
   * Two buckets, because there are two different failures to prevent, and both
   * live in the database rather than in this process — Vercel runs as many
   * processes as it likes, so a per-instance counter bounds nothing.
   *
   *   `submit:<subject>`  one child cannot spend the class's judge.
   *   `submit:provider`   one class cannot spend the school's month.
   *
   * The global bucket is charged only when the provider is metered. `local`
   * and `none` cost nothing real, and billing a test run against a shared
   * ceiling would make the suite's parallelism a rate-limit failure.
   *
   * On refusal the claim is RELEASED. Holding it would lock the learner out of
   * that exact answer until the stale-claim takeover fired sixty seconds later
   * — a rate limit is "not now", never "not this answer, ever". Released, the
   * retry after `retryAfterSeconds` claims it cleanly.
   */
  const budget = config.submit;
  const metered = config.exec.provider === "judge0_rapidapi" || config.exec.provider === "piston";
  const releaseClaim = async () => {
    if (submissionId) await store.releaseSubmission(subjectId, submissionId);
  };

  const perLearner = await takeToken(`submit:${subjectId}`, budget.perLearner);
  if (!perLearner.ok) {
    await releaseClaim();
    opsLog("submit.rate_limited", { block_id: blockId, scope: "learner" });
    bump("submit.rate_limited");
    return NextResponse.json(
      { error: "too many submissions", retryAfterSeconds: perLearner.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(perLearner.retryAfterSeconds) } },
    );
  }

  if (metered) {
    const global = await takeToken("submit:provider", budget.global);
    if (!global.ok) {
      await releaseClaim();
      opsLog("submit.rate_limited", { block_id: blockId, scope: "deployment" });
      bump("submit.rate_limited_global");
      return NextResponse.json(
        { error: "too many submissions", retryAfterSeconds: global.retryAfterSeconds },
        { status: 429, headers: { "retry-after": String(global.retryAfterSeconds) } },
      );
    }
  }

  let outcome = gradeBlock(target, answer);

  /* Code blocks are graded by running them, not by comparing strings. The pure
     grader returns `unknown` for them — correct when no judge is configured,
     and replaced here when one is.

     Note what happens when the judge is unreachable: the verdict stays
     `unknown`. NOT `wrong`. "We could not run this" and "your program is
     broken" are different things to say to a fourteen-year-old, and only one
     of them is true. */
  let caseSummary: { passed: number; total: number } | null = null;
  /** Per-visible-case feedback. Never a hidden case — see where it is built. */
  let visibleCases:
    | { input: string; expected: string; actual: string; passed: boolean; status: string }[]
    | null = null;
  /* WHY the verdict is `unknown`, when it is.
   *
   * `unknown` already meant two completely different things and the learner was
   * shown one sentence for both: "this task is not machine-graded, a teacher
   * will read it" and "we could not reach the judge". The first is permanent
   * and correct; the second is an outage, and telling a class mid-lesson that
   * the sandbox «әлі қосылмаған» — not connected YET — reads as an unfinished
   * product rather than a service that is down for twenty minutes.
   *
   * Neither one is ever `wrong`. That is the invariant this whole branch
   * protects, and it is unchanged: the flag decides what the learner is TOLD,
   * never what they are scored. */
  let judgeUnavailable = false;
  /* A THIRD reason, and not a variant of the second.
   *
   * `judgeUnavailable` is an outage: something that should have answered did
   * not, and it will answer again later. `noTrustedJudge` is a standing
   * property of the deployment — `EXEC_PROVIDER=none`, meaning nobody ever
   * intended to grade this on a server. Learners can still write and RUN code
   * in their browser; what the school does not get is evidence.
   *
   * Merging the two would be the cheap option and it would produce a lie that
   * repairs itself never: a class told "the checker is down" every single day
   * for a month, waiting for an outage to end that is not an outage. The
   * teacher needs to know their pilot is configured without a judge, and needs
   * to know it in the product rather than by reading an env file. */
  let noTrustedJudge = false;
  /*
   * `verify` belongs here too.
   *
   * It used to be excluded, so the September monthly check — two coding
   * problems carrying nine declared test cases between them — was never run.
   * Every block of it settled `unknown`, a perfect performance reduced to
   * `outcome: "abandoned"`, and the assessment produced no evidence at all.
   *
   * The semantic type is preserved rather than renamed to `write_code`: a
   * `verify` block is a different thing from a practice task and the teacher
   * console, the episode reducer and the evidence model all care which it is.
   * What it needed was to be executable, not to be something else.
   *
   * The modes that no machine should score have no `cases` and fall through
   * this branch untouched, which is exactly right: an oral explanation settles
   * `unknown` because nothing measured it, not because nobody tried.
   */
  const codeBlock =
    target.block.type === "write_code" ||
    target.block.type === "modify_code" ||
    target.block.type === "challenge" ||
    (target.block.type === "verify" && !!target.block.cases?.length)
      ? target.block
      : null;

  if (codeBlock && answer.kind === "text" && answer.value.trim()) {
    const { getExecutionProvider, runCases } = await import("@schools/exec");
    const { checkCodeResult } = await import("@schools/learning/checking");
    try {
      const provider = await getExecutionProvider();
      /* No judge configured. Nothing runs, and — this is the whole point of
         the hybrid split having a `none` mode at all — nothing is invented.
         There is a perfectly good Python result sitting in the learner's
         browser and it is NOT consulted here, because the browser is the party
         being assessed. A local pass is feedback; it is not a grade, and the
         one line of code that would make it one is the line this branch
         exists to not write. */
      if (provider === null) {
        noTrustedJudge = true;
      } else {
        const { results, infrastructureFailed } = await runCases(
          provider,
          answer.value,
          codeBlock.cases ?? [],
          /* The task's OWN checker, not the default.
             Omitting this argument is correct only for as long as no block
             declares one — every September task is a token task today. The moment
             an author writes `checker: { kind: "numeric", ... }`, a missing
             argument here would grade them under `token` and reject a correct
             float, so the argument goes in now rather than after the first
             numeric task exists. */
          codeBlock.checker,
          /* Fair queueing, not identification. The judge never sees this — it
             only stops one learner holding every in-flight slot while the rest
             of the class is told the judge is unavailable. See
             `ExecutionRequest.fairnessKey`. */
          { fairnessKey: subjectId },
        );
        judgeUnavailable = infrastructureFailed;
        if (!infrastructureFailed && results.length > 0) {
          const passed = results.filter((r) => r.passed).length;
          caseSummary = { passed, total: results.length };
          /*
           * The VISIBLE cases, with what their program actually printed.
           *
           * A wrong code verdict said «Әзірге дұрыс емес» and nothing else —
           * no input, no expected output, and not even the learner's own
           * output. A fourteen-year-old who printed `55` for `7 * 8` was told
           * they were wrong and shown nothing to compare, on a screen whose
           * editor had just been greyed out. There is no way to debug from
           * that, and the loop the whole lesson is built on has no hinge.
           *
           * `hidden !== true` is the whole of the safety argument: a visible
           * case's input and expected output are already in the page props —
           * `public.ts` sends them, the block renders them — so returning them
           * beside the run adds nothing a learner could not already read. A
           * hidden case's pairing is the measurement, and it stays a count.
           *
           * `actual` is their own program's output, which is theirs. Truncated
           * because a runaway loop prints megabytes and the first line is where
           * the answer is.
           */
          visibleCases = results
            .filter((r) => !r.hidden)
            .slice(0, MAX_VISIBLE_CASE_FEEDBACK)
            .map((r) => ({
              input: r.input.slice(0, MAX_CASE_TEXT),
              expected: r.expected.slice(0, MAX_CASE_TEXT),
              actual: r.actual.slice(0, MAX_CASE_TEXT),
              passed: r.passed,
              status: r.status,
            }));
          const graded = checkCodeResult(passed, results.length);
          outcome = {
            ...outcome,
            result: { ...outcome.result, verdict: graded.verdict },
            // Now that it IS measured, the skills apply.
            primarySkill: codeBlock.skillRefs[0] ?? null,
            creditedSkills:
              graded.verdict === "correct"
                ? [...codeBlock.skillRefs]
                : codeBlock.skillRefs.slice(0, 1),
          };
        }
      }
    } catch {
      /* Judge unavailable. `unknown` stands — and the learner is told which
         kind of `unknown` it is. The local provider throwing in production
         lands here, which is the case that used to reach nobody at all.

         "No judge configured" does NOT land here — it is an `if`, not a throw,
         because it is an expected configuration rather than a failure, and
         routing it through the outage path would erase the distinction the
         flags above exist to make. */
      judgeUnavailable = true;
    }
  }

  /* How many times this block has already been graded wrong, read from the
     ledger. Counted BEFORE this attempt's events are appended, so the number
     describes history rather than including the present.

     And counted only from rows THIS SERVER wrote. The filter on `sourceTrust`
     is what makes the number mean anything: this count is the input to
     `revealFor`, so three verdicts decide whether a fourteen-year-old is handed
     the answer key. A browser can post `verdict_received` into its own episode,
     and without this line three `fetch()` calls opened the answer to a task
     nobody had attempted. */
  /* Narrowed to THIS block. `ownedEpisodeId` above already guarantees the
     episode holds nothing else, so on new data this changes nothing; it is the
     filter at the point of use, for rows written before that check existed and
     for the next write path somebody adds. Three wrong verdicts here open the
     answer key, so "which task were they wrong about" is not a question this
     count may get wrong. */
  const priorEvents = await store.eventsForEpisode(episodeId, blockId);
  const priorFailures = priorEvents.filter(
    (e) =>
      e.event_name === "verdict_received" &&
      e.sourceTrust !== "browser" &&
      typeof e.payload === "object" &&
      e.payload !== null &&
      (e.payload as { verdict?: unknown }).verdict !== "accepted",
  ).length;
  /* Has this episode already had its answer opened?
   *
   * From the SAME read as the failure count, so this costs nothing. Once the
   * key is open it stays open, and `revealFor` goes on returning it on every
   * later wrong answer — correctly, because the learner can still see it. What
   * must not repeat is the EVENT.
   *
   * `reduceEpisode` reads `solution_revealed` as a boolean, so a second row
   * tells it nothing it does not already know. What a second row does change is
   * everything the reducer derives from the SHAPE of the stream: `event_count`
   * is `ordered.length`, and `struggle_class` comes from `classifyStruggle`
   * over the same array. Migration 0023 refuses to put XP in `learning_events`
   * for precisely this reason — "an extra row in an episode's stream therefore
   * moves all three for a REAL episode, even though no branch anywhere reads
   * the word xp". A learner who keeps trying after the reveal was accumulating
   * one of these per attempt and drifting their own struggle classification. */
  const alreadyRevealed = priorEvents.some((e) => e.event_name === "solution_revealed");
  const now = new Date().toISOString();
  const sessionId = randomUUID();
  const verdictName = toLearningVerdictName(outcome.result.verdict);

  /*
   * Per-test counts for the LEDGER, including for the blocks nothing executes.
   *
   * `caseSummary` exists only when the judge ran something, which is 35 of the
   * curriculum's 54 attempt blocks. The other 19 — prediction, multiple choice,
   * find the bug, fill in the blank, reorder, test case, trace — are graded by
   * comparison and reached the ledger with no counts at all, and that absence
   * is load-bearing in a way it does not look:
   *
   *   * `computeInterventionOutcome` derives `progressed` and `regressed` by
   *     comparing `tests_passed` across two attempts. They are the only two of
   *     seven outcomes that can say whether a hint HELPED, and with no counts
   *     on either attempt neither can ever fire. Nova's own effectiveness was
   *     unmeasurable on more than a third of the tasks it hints on.
   *   * `isStagnant` keys each verdict as `verdict#tests_passed` and falls back
   *     to the verdict alone without counts, which collapses `thrash` into
   *     `stuck` — and `thrash` versus `stuck` is the split that lifts the hint
   *     cap for a learner who is drowning rather than fiddling.
   *
   * A binary item has exactly one thing to check, so it reports one: 1 of 1 on
   * an accepted answer, 0 of 1 otherwise. That is coarse and it is true. Two
   * successive 0/1s are now stagnation the core can see; 0/1 then 1/1 is
   * progress it can attribute to the hint in between.
   *
   * Deliberately NOT emitted where nothing measured the answer. An explanation
   * block settles `unknown`, `verdictName` is null, and no counts are written —
   * inventing 0/1 there would file a failure against a child for prose a human
   * has not read yet.
   *
   * Kept separate from `caseSummary` rather than folded into it, because the
   * two answer different questions. `cases` in the response means "the judge
   * ran N test cases" and the player renders it as such; the attestation signs
   * it as a statement about a sandbox run. Neither is true of a multiple-choice
   * question, and saying so would be a small lie told in two more places.
   */
  const ledgerCounts: { passed: number; total: number } | null =
    caseSummary ?? (verdictName ? { passed: verdictName === "accepted" ? 1 : 0, total: 1 } : null);

  /*
   * What the learner has earned the right to see — computed HERE, before the
   * events are built, because handing the answer over is itself an event.
   *
   * The answer keys are no longer in the browser, so this is the only route by
   * which a reveal can happen, which is what makes the policy enforceable
   * rather than advisory. `revealFor` withholds everything on a first wrong
   * answer; the programme requires it (PDF p.4: «шешім идеясы бірнеше
   * әрекеттен соң ғана ашылады. Дайын жауап берілмейді»).
   *
   * Failed attempts are counted from the ledger rather than trusted from the
   * request, for the same reason the verdict is — and `priorFailures` is now a
   * count of attempts that genuinely happened, because a retried submission no
   * longer adds a row to it. That is the concrete thing idempotency buys the
   * learner: the reveal opens on the third answer they actually gave, not on
   * the third time a flaky connection delivered the first one.
   */
  const failedAttempts = priorFailures + (verdictName && verdictName !== "accepted" ? 1 : 0);
  const reveal = revealFor({
    block: target.block,
    verdict: outcome.result.verdict,
    failedAttempts,
  });

  /*
   * Which reveals are the ANSWER, and which are not.
   *
   * `revealFor` returns three different things and only one of them is the
   * answer key opening after repeated failure. It also returns the marking
   * points for a written block the moment the learner commits their own words,
   * and the repaired program beside a find-the-bug answer the learner got
   * RIGHT. Emitting `solution_revealed` for either of those would be a
   * catastrophe of exactly the kind this file exists to prevent:
   * `independenceWeight` returns 0 the instant `solution_revealed` is true, so
   * a learner who found the bug unaided would be recorded as having been shown
   * it — the ledger asserting a child cheated when they did not.
   *
   * So all three conditions, not one: the answer was wrong, the attempt count
   * has crossed the threshold, and something was actually handed over.
   */
  const answerKeyRevealed =
    reveal !== undefined &&
    verdictName === "wrong_answer" &&
    failedAttempts >= ATTEMPTS_BEFORE_REVEAL &&
    /* The transition, not the state. See `alreadyRevealed`. */
    !alreadyRevealed;

  /* The event stream for one graded attempt. Deliberately minimal: three
     events, none of them passive. Reading the block, viewing it and opening the
     lesson produce nothing — a ledger that records attention as if it were
     effort makes every downstream number softer. */
  let seq = 0;
  const events: LearningEventRow[] = [
    {
      eventId: randomUUID(),
      subjectId,
      episodeId,
      sessionId,
      seq: seq++,
      eventName: "episode_opened",
      occurredAt: now,
      sourceTrust: "server",
      environment: config.environment,
      cohort: "public",
      route: `/lesson/${target.lesson.id}`,
      payload: sanitizePayload({
        task_ref: outcome.taskRef,
        task_kind: outcome.taskKind,
        entry_source: "lesson",
        ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
      }),
    },
  ];

  if (verdictName) {
    /* One verdict per skill this attempt is evidence about.
     *
     * The payload carries a single `skill_id`, so breadth means several events
     * rather than a list — which is also the honest shape: each row says "this
     * attempt, this skill, this verdict" and the reducer folds them
     * independently. On a wrong answer `creditedSkills` holds the primary skill
     * alone, so failure stays as narrowly attributed as it was. */
    const skillsToCredit = outcome.creditedSkills.length ? outcome.creditedSkills : [null];
    for (const skillId of skillsToCredit) {
      events.push({
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId,
        seq: seq++,
        eventName: "verdict_received",
        occurredAt: now,
        // `judge` because THIS server graded it against the curriculum. The claim
        // is ours, not the browser's.
        sourceTrust: "judge",
        environment: config.environment,
        cohort: "public",
        route: `/lesson/${target.lesson.id}`,
        payload: sanitizePayload({
          verdict: verdictName,
          task_ref: outcome.taskRef,
          ...(skillId ? { skill_id: skillId } : {}),
          /* Per-test counts. Without them on two successive attempts the core
             can never reach `progressed` or `regressed`, and `thrash` collapses
             into `stuck` — two of seven intervention outcomes and one of five
             struggle classes become unreachable, silently. `ledgerCounts` is
             the judge's tally where a judge ran and the binary 1/1 or 0/1 of a
             compared answer where none did; see its declaration. Reading
             `caseSummary` directly here emitted nothing at all for a
             multiple-choice block, so the core could never see a learner
             progress or thrash on the block types most of September is made
             of. */
          ...(ledgerCounts
            ? { tests_passed: ledgerCounts.passed, tests_total: ledgerCounts.total }
            : {}),
        }),
      });
    }

    /* Attribution.
     *
     * A named failure class ONLY where the curriculum author declared this
     * exact answer diagnostically unambiguous. But EVERY wrong answer gets an
     * attribution event, because "we graded this and could not tell why it was
     * wrong" is itself a fact — and it is the one the whole model is calibrated
     * against.
     *
     * `buildLearnerState` counts `unattributedFailures` from attributions
     * carrying `unattributed_failure`, not from the absence of an attribution.
     * Emitting nothing therefore leaves the counter permanently at zero, and
     * that counter is the honest denominator: at three quarters unexplained,
     * every other number in the state is built on a quarter of what happened.
     * Silently reporting zero would make thin evidence look complete. */
    if (verdictName !== "accepted") {
      const attributed = Boolean(outcome.result.failureClass);
      events.push({
        eventId: randomUUID(),
        subjectId,
        episodeId,
        sessionId,
        seq: seq++,
        eventName: "failure_attributed",
        occurredAt: now,
        sourceTrust: "verifier",
        environment: config.environment,
        cohort: "public",
        route: `/lesson/${target.lesson.id}`,
        payload: sanitizePayload({
          failure_class: attributed
            ? outcome.result.failureClass!
            : "unattributed_failure",
          attribution_source: attributed
            ? "curriculum_diagnostic_mapping"
            : "no_declared_mapping",
          // Zero, not a small number. There is no partial belief here — the
          // author declared nothing, so nothing is believed.
          confidence: attributed ? 0.9 : 0,
          attribution_version: 1,
          ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
        }),
      });
    }
  }

  /*
   * The answer was handed over, and the ledger now says so.
   *
   * `revealFor` has returned answer keys since the day it was written and
   * NOTHING recorded that it had. The consequence ran all the way through the
   * model: `reduceEpisode`'s `solutionRevealed` stayed false forever,
   * `independenceWeight` never once took its return-0 branch, and the episode
   * outcome `solution_revealed` — a value the reducer, the store schema and the
   * teacher projection all carry a column for — could not occur. A learner who
   * failed three times, was shown the answer, typed it back and was marked
   * correct was recorded, in the table the school reads at the end of the term,
   * as having solved it alone. That is the single worst thing this product can
   * assert about a child, and it was the default.
   *
   * Emitted from the route that performs the reveal rather than from the client
   * that displays it, for the reason every outcome event is: the browser cannot
   * author one, so the only way this row exists is that the server actually
   * opened the answer.
   *
   * `reveal_scope: "answer_key"` rather than the archive's `editorial` — an
   * editorial is a competitive-programming write-up, and what opens here is the
   * key itself. Code tasks are never revealed at all (`revealFor` returns
   * nothing for them; the hint ladder does that job properly), so this event
   * can only ever describe one of the compared blocks.
   */
  if (answerKeyRevealed) {
    events.push({
      eventId: randomUUID(),
      subjectId,
      episodeId,
      sessionId,
      seq: seq++,
      eventName: "solution_revealed",
      occurredAt: now,
      // This server decided the policy had been met and this server opened it.
      sourceTrust: "server",
      environment: config.environment,
      cohort: "public",
      route: `/lesson/${target.lesson.id}`,
      payload: sanitizePayload({
        reveal_scope: "answer_key",
        task_ref: outcome.taskRef,
        ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
      }),
    });
  }

  events.push({
    eventId: randomUUID(),
    subjectId,
    episodeId,
    sessionId,
    seq: seq++,
    eventName: "episode_closed",
    occurredAt: now,
    sourceTrust: "server",
    environment: config.environment,
    cohort: "public",
    route: `/lesson/${target.lesson.id}`,
    payload: sanitizePayload({
      close_reason: verdictName === "accepted" ? "solved" : "navigated_away",
      task_ref: outcome.taskRef,
    }),
  });

  /* The author's explanation of THIS wrong answer, where they established one.
     Eight were written for September and none had ever been rendered: a wrong
     answer produced a colour and a generic "not quite". This is the WHY. */
  const why = justificationFor(target.block, outcome.result.answerKey);

  // Signed so a downstream consumer can verify this server said it. Only
  // produced when a secret is configured — a missing one is a deployment
  // problem, not a reason to fail a fourteen-year-old's answer.
  //
  // Computed BEFORE the write rather than after it, so the whole response body
  // exists before anything is persisted and the events and the record of them
  // can commit in one transaction. Nothing here depends on the write.
  let attestation: string | null = null;
  if (config.attestationSecret && verdictName) {
    try {
      attestation = signAttestation(
        {
          requestId: episodeId,
          task: { kind: outcome.taskKind, blockId, month: target.month.index },
          submissionId: episodeId,
          language: "none",
          status: verdictName === "accepted" ? "accepted" : "wrong_answer",
          judged: true,
          testsTotal: caseSummary?.total ?? null,
          testsPassed: caseSummary?.passed ?? null,
          firstFailingTest: null,
          skillRefs: target.block.skillRefs,
        },
        config.attestationSecret,
      );
    } catch {
      /* A weak or absent secret must not break grading. */
    }
  }

  /*
   * The response, built before the write so it can BE the stored record.
   *
   * `saved: true` is written into it here and is true by construction: this
   * object only reaches `learning_submissions` inside the transaction that
   * appends the events, so a stored response is a response whose events
   * committed. The failure path below never stores it and returns a copy with
   * `saved: false` instead.
   */
  const graded = {
    verdict: outcome.result.verdict,
    reveal: reveal ?? null,
    why: why ?? null,
    episodeId,
    cases: caseSummary,
    /* What each VISIBLE case did, so a wrong verdict is something a learner can
       act on rather than a sentence. Hidden cases are in `cases` as a count and
       nowhere else. Null when nothing ran. */
    visibleCases,
    /* Whether this attempt reached the ledger. False means the answer was
       graded and NOT recorded, and the client must not present it as settled. */
    saved: true,
    /* Why nothing was measured, when nothing was. `null` whenever a verdict was
       actually produced. The client turns this into one of two very different
       sentences; see `schools/presentation/labels.ts`. */
    unmeasuredReason: verdictName
      ? null
      : noTrustedJudge
        ? ("no_trusted_judge" as const)
        : judgeUnavailable
          ? ("judge_unavailable" as const)
          : ("not_machine_graded" as const),
    /* The failure class is NOT returned. The learner is never told the system
       named their misconception — that is the Decision Engine's to act on
       through Nova, phrased as a question, not a label handed back as a score. */
    attested: attestation !== null,
  };

  /*
   * The write, and whether it happened.
   *
   * This used to be unguarded, so a database failure threw out of the handler,
   * became a 500, and reached the browser as "the round trip failed" — which
   * the player rendered as `unmeasured`, the same neutral card an ungraded
   * explanation gets. The learner was shown a settled block for an answer
   * nothing had recorded.
   *
   * The verdict is still returned, because it is real: the answer WAS graded,
   * on this server, against the curriculum. What is no longer implied is that
   * it was kept. `saved: false` travels to the client, which offers the check
   * again rather than moving on.
   *
   * ## Why the settle is in the same transaction
   *
   * `appendEventsAndSettle` commits the events and the record that this
   * submission produced them together, or commits neither. Settling first would
   * let a duplicate replay a response claiming the work was saved when the
   * write then failed; settling second would leave a window in which the events
   * exist and nothing knows it, so a retry re-grades and appends a second set —
   * which is the whole defect. There is no ordering that makes two separate
   * writes safe, so there is one write.
   *
   * ## Why a failed write RELEASES the claim
   *
   * Nothing was persisted, so the learner's retry — same answer, therefore the
   * same submission id — must be allowed to grade properly. Leaving the claim
   * in place would have that retry wait out the duplicate window and be told a
   * second time that nothing was recorded, for a submission that has never
   * been recorded at all.
   */
  /*
   * The learner's competition, resolved from ENROLMENT and from their session.
   *
   * Read here rather than inside the transaction: it is two reads that do not
   * need to be atomic with the write, and holding a transaction open across
   * them would serialise a class pressing Check at once for no gain. `null`
   * means this learner has no league — not enrolled, not a student, or the
   * feature is off for their school — and every one of those simply skips the
   * award.
   */
  const leagueScope = await leagueScopeForCurrentUser();

  /* Captured from inside the transaction below. The store returns an event
     count and should keep doing so; the gamification result is not its
     business.

     A holder object rather than a bare `let`, because TypeScript's control-flow
     analysis cannot see an assignment made inside a callback and narrows the
     variable to `null` at every later read. The object makes the mutation
     visible to the type system instead of requiring a cast that would also
     silence a real mistake. */
  const league: { award: AwardResult | null } = { award: null };

  let saved = true;
  try {
    if (submissionId) {
      await store.appendEventsAndSettle(events, {
        subjectId,
        submissionId,
        verdict: outcome.result.verdict,
        response: graded,
        /*
         * The learner's work, kept beside the verdict it earned.
         *
         * `answer` is the `BlockAnswer` this route graded — the same object,
         * so what is stored is by construction what was judged. It rides the
         * same transaction as the events and the settlement: a verdict without
         * the work behind it, or work with no verdict, are both states this
         * cannot produce.
         *
         * It is the parser's output rather than the request body, and that is
         * the point: `parseBlockAnswer` rebuilt it field by field, so a
         * property the contract does not declare cannot arrive here and be
         * written into `jsonb` unread. Grading and storage still see one
         * value — it is simply a value that was checked before either did.
         *
         * Bounded already: `checkPayloadSize` refused anything over
         * `EXECUTION_LIMITS.maxSourceBytes` before we got here, and it measures
         * BYTES rather than trusting a client-reported length. That is the
         * whole size policy — there is no second ceiling for storage to
         * disagree with.
         *
         * It carries no answer-key material. `BlockAnswer` has no field for
         * one, which is why this is safe to hand back to the same learner on
         * hydration.
         */
        answer,
      },
      /*
       * League XP, in the same transaction as the evidence.
       *
       * Here and nowhere else. This is the only point in the product at which
       * "the server graded this, the server settled it, and this request owns
       * that settlement" are all true at once — the settle guard has already
       * thrown for a racing owner by the time this runs. Awarding anywhere
       * later would credit a verdict that could still roll back; awarding
       * earlier would credit one somebody else already owned.
       *
       * `leagueAward` is captured rather than returned because the store's
       * contract is an event count and should stay that way — the transaction
       * boundary is the store's business, the gamification result is not.
       *
       * A throw in here rolls the events back with it, which is deliberate and
       * is the same trade `appendEventsAndSettle` already makes: the route
       * turns it into `saved: false`, the learner presses Check again, and the
       * retry re-grades and re-credits. The alternative — swallowing it — is a
       * ledger holding a verdict whose XP silently never happened.
       */
      leagueScope
        ? async (t) => {
            league.award = await creditSolve(t, {
              subjectId,
              schoolId: leagueScope.schoolId,
              classId: leagueScope.classId,
              blockId,
              blockType: target.block.type,
              episodeId,
              accepted: verdictName === "accepted",
              priorFailures,
              /* Our clock. `occurred_at` is the browser's and is forgeable, so
                 a client cannot post work into a settled week. */
              now: new Date(),
            });
          }
        : undefined,
      );
    } else {
      await store.appendEvents(events);
    }
  } catch (err) {
    saved = false;
    /*
     * Two different facts land here and only one of them is a fault.
     *
     * `SubmissionAlreadySettledError` means the settle found the row already
     * settled — another owner of the same submission id got there first, which
     * `schools/learning/submission.ts` describes as the takeover race. Nothing
     * broke: the learner's answer IS recorded, under that owner's write, and
     * this transaction rolled its duplicate events back rather than leaving two
     * sets in the ledger behind one settled row. That silent double-write used
     * to be possible because the UPDATE's row count was discarded, and it is
     * the one way the learner's card and the teacher's console could come to
     * disagree about how many times a child tried.
     *
     * Counted separately so a pilot can see it happening without it inflating
     * the counter that means "the database is in trouble".
     */
    const alreadySettled = err instanceof SubmissionAlreadySettledError;
    bump(alreadySettled ? "save.settle_races" : "save.event_write_failures");
    opsLog(alreadySettled ? "save.settle_race" : "save.event_write_failed", {
      // The block, not the learner. A block id is curriculum, not personal data.
      block_id: blockId,
      events: events.length,
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
    if (submissionId) {
      try {
        await store.releaseSubmission(subjectId, submissionId);
      } catch {
        /* Best effort. A claim left behind costs the learner one round trip and
           then expires into `STALE_CLAIM_SECONDS`; throwing here would cost
           them the verdict, and the two are not comparable. */
      }
    }
  }

  /*
   * Delayed re-solve — the programme's fifth independence check (PDF p.6).
   *
   *   «Көмекпен шешілген есеп бірнеше аптадан соң қайта беріледі және бұл жолы
   *    көмексіз орындалады»
   *
   * A solve is where the evidence exists, so a solve is where the queue entry
   * is written. Eligibility is read back out of the ledger this request just
   * appended to — `verdict_received: accepted` on this episode, and whether an
   * `assistance_delivered` sits beside it — so it is derived from what happened
   * rather than from anything the client claimed. See
   * `schools/policies/review.ts` for the rule and migration 0014 for the table.
   *
   * Guarded, and silent on failure. A queue entry that does not get written
   * costs the learner a review; a throw here would cost them a graded answer,
   * and the two are not comparable.
   *
   * Note that this fires on a RE-SOLVE too, and that is correct: a review that
   * still needed help earns another one, and a review done unaided on an
   * ordinary practice task earns none. The loop terminates exactly when the
   * learner no longer needs it, which is the behaviour the programme describes.
   *
   * Outside the transaction above deliberately: it reads the events back, so it
   * needs them committed, and a duplicate submission never reaches this line —
   * which is correct, because the review it would schedule is already queued by
   * the original.
   */
  if (saved && verdictName === "accepted") {
    try {
      const evidence = await store.solveEvidence(subjectId, episodeId);
      const schedule = scheduleFor(
        {
          blockId,
          blockType: target.block.type,
          taskKind: outcome.taskKind,
          solved: evidence.accepted,
          assistanceDelivered: evidence.assistanceDelivered,
          assistanceLevel: evidence.assistanceLevel,
        },
        new Date(now),
      );
      if (schedule) {
        await store.scheduleReview({
          subjectId,
          blockId,
          reason: schedule.reason,
          originEpisodeId: episodeId,
          originAt: now,
          originLevel: schedule.assistanceLevel,
          dueAt: schedule.dueAt,
          policyId: REVIEW_POLICY.id,
        });
      }
    } catch (err) {
      bump("save.event_write_failures");
      opsLog("save.review_schedule_failed", {
        block_id: blockId,
        message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
      });
    }
  }

  after(async () => {
    await maybeSweep(subjectId);
  });

  /*
   * The XP feedback, and why it is NOT part of `graded`.
   *
   * `graded` is the object stored in `learning_submissions.response` and
   * replayed verbatim to a duplicate submission. Putting the XP in it would
   * make a retried request — a double click, a flaky connection, a refresh —
   * announce «+15 XP» a second time for a credit that was granted once. The
   * learner would be told they earned something they did not.
   *
   * So the delta rides the RESPONSE, not the record. A replay carries no
   * `league` key at all, which is the truth about a replay: it earned nothing.
   *
   * `gained: 0` is also omitted rather than sent as a zero, for the reason the
   * whole codebase repeats — a zero and an absence are different claims, and a
   * lesson block that quietly renders «+0 XP» is worse than one that renders
   * nothing.
   */
  const payload = saved ? graded : { ...graded, saved: false };
  const withLeague =
    league.award && league.award.gained > 0
      ? {
          ...payload,
          league: {
            gained: league.award.gained,
            /* True only on the award that created this week's membership, so
               the client can show the one-time onboarding line and never show
               it twice. */
            entered: league.award.entered,
            tier: league.award.tier,
          },
        }
      : payload;

  const res = NextResponse.json(withLeague);
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}
