import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sanitizePayload } from "@solvex/learning-contracts";
import { SubmissionAlreadySettledError, type LearningEventRow } from "@schools/store/learning-store";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { ATTEMPTS_BEFORE_REVEAL, justificationFor, revealFor } from "@schools/learning/reveal";
import { signAttestation } from "@schools/learning/sign";
import type { BlockAnswer } from "@schools/learning/checking";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { claimSubmission, isSubmissionId } from "@schools/learning/submission";
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
 */

export const runtime = "nodejs";

interface SubmitBody {
  blockId?: string;
  episodeId?: string;
  answer?: BlockAnswer;
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

  const target = findBlock(blockId);
  if (!target) {
    return NextResponse.json({ error: "unknown block" }, { status: 404 });
  }

  const answer: BlockAnswer = body.answer ?? { kind: "none" };

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

  /* The episode is a second key into the ledger and it arrives in the request
     body. `ownedEpisodeId` refuses one that already belongs to another learner
     — see that function for what reading and writing a foreign episode would
     do. A legitimate client is unaffected; the id it gets back is the one that
     was used. */
  const episodeId = await ownedEpisodeId(subjectId, body.episodeId);

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
    /* No key, no deduplication — this behaves exactly as the route did before,
       which is what a browser tab loaded before this deployed will do. It is
       logged rather than refused because refusing it means a child mid-lesson
       gets an error instead of a graded answer, and the counter is how we know
       when the last such tab is gone. */
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

  let outcome = gradeBlock(target, answer);

  /* Code blocks are graded by running them, not by comparing strings. The pure
     grader returns `unknown` for them — correct when no judge is configured,
     and replaced here when one is.

     Note what happens when the judge is unreachable: the verdict stays
     `unknown`. NOT `wrong`. "We could not run this" and "your program is
     broken" are different things to say to a fourteen-year-old, and only one
     of them is true. */
  let caseSummary: { passed: number; total: number } | null = null;
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
        );
        judgeUnavailable = infrastructureFailed;
        if (!infrastructureFailed && results.length > 0) {
          const passed = results.filter((r) => r.passed).length;
          caseSummary = { passed, total: results.length };
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
  const priorEvents = await store.eventsForEpisode(episodeId);
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
         * `answer` is the `BlockAnswer` this route already received and
         * graded — the exact value, not a re-derivation — so what is stored is
         * by construction what was judged. It rides the same transaction as
         * the events and the settlement: a verdict without the work behind it,
         * or work with no verdict, are both states this cannot produce.
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
