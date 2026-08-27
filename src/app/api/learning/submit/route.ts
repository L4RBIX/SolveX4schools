import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sanitizePayload } from "@solvex/learning-contracts";
import type { LearningEventRow } from "@schools/store/learning-store";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { justificationFor, revealFor } from "@schools/learning/reveal";
import { signAttestation } from "@schools/learning/sign";
import type { BlockAnswer } from "@schools/learning/checking";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { claimSubmission, isSubmissionId } from "@schools/learning/submission";
import { MAX_REQUEST_BYTES, checkPayloadSize, requestTooLarge } from "@schools/exec/limits";
import { bump, opsLog } from "@schools/ops/counters";
import { maybeSweep } from "@schools/reducer/trigger";
import { REVIEW_POLICY, scheduleFor } from "@schools/policies/review";

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
 * See `schools/learning/submission.ts` for the rule and migration 0017 for the
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
      const { results, infrastructureFailed } = await runCases(
        provider,
        answer.value,
        codeBlock.cases ?? [],
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
    } catch {
      /* Judge unavailable. `unknown` stands — and the learner is told which
         kind of `unknown` it is. The local provider throwing in production
         lands here, which is the case that used to reach nobody at all. */
      judgeUnavailable = true;
    }
  }

  /* How many times this block has already been graded wrong, read from the
     ledger. Counted BEFORE this attempt's events are appended, so the number
     describes history rather than including the present. */
  const priorFailures = (await store.eventsForEpisode(episodeId)).filter(
    (e) =>
      e.event_name === "verdict_received" &&
      typeof e.payload === "object" &&
      e.payload !== null &&
      (e.payload as { verdict?: unknown }).verdict !== "accepted",
  ).length;
  const now = new Date().toISOString();
  const sessionId = randomUUID();
  const verdictName = toLearningVerdictName(outcome.result.verdict);

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
             struggle classes become unreachable, silently. */
          ...(caseSummary
            ? { tests_passed: caseSummary.passed, tests_total: caseSummary.total }
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
   */
  let saved = true;
  try {
    await store.appendEvents(events);
  } catch (err) {
    saved = false;
    bump("save.event_write_failures");
    opsLog("save.event_write_failed", {
      // The block, not the learner. A block id is curriculum, not personal data.
      block_id: blockId,
      events: events.length,
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
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

  // Signed so a downstream consumer can verify this server said it. Only
  // produced when a secret is configured — a missing one is a deployment
  // problem, not a reason to fail a fourteen-year-old's answer.
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

  after(async () => {
    await maybeSweep(subjectId);
  });

  /*
   * What the learner has earned the right to see.
   *
   * The answer keys are no longer in the browser, so this is the only route by
   * which a reveal can happen — which is what makes the policy enforceable
   * rather than advisory. `revealFor` withholds everything on a first wrong
   * answer; the programme requires it (PDF p.4: «шешім идеясы бірнеше
   * әрекеттен соң ғана ашылады. Дайын жауап берілмейді»).
   *
   * Failed attempts are counted from the ledger rather than trusted from the
   * request, for the same reason the verdict is.
   */
  const failedAttempts = priorFailures + (verdictName && verdictName !== "accepted" ? 1 : 0);
  const reveal = revealFor({
    block: target.block,
    verdict: outcome.result.verdict,
    failedAttempts,
  });

  /* The author's explanation of THIS wrong answer, where they established one.
     Eight were written for September and none had ever been rendered: a wrong
     answer produced a colour and a generic "not quite". This is the WHY. */
  const why = justificationFor(target.block, outcome.result.answerKey);

  const res = NextResponse.json({
    verdict: outcome.result.verdict,
    reveal: reveal ?? null,
    why: why ?? null,
    episodeId,
    cases: caseSummary,
    /* Whether this attempt reached the ledger. False means the answer was
       graded and NOT recorded, and the client must not present it as settled. */
    saved,
    /* Why nothing was measured, when nothing was. `null` whenever a verdict was
       actually produced. The client turns this into one of two very different
       sentences; see `schools/presentation/labels.ts`. */
    unmeasuredReason: verdictName
      ? null
      : judgeUnavailable
        ? ("judge_unavailable" as const)
        : ("not_machine_graded" as const),
    /* The failure class is NOT returned. The learner is never told the system
       named their misconception — that is the Decision Engine's to act on
       through Nova, phrased as a question, not a label handed back as a score. */
    attested: attestation !== null,
  });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}
