import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sanitizePayload } from "@solvex/learning-contracts";
import type { LearningEventRow } from "@schools/store/learning-store";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { signAttestation } from "@schools/learning/sign";
import type { BlockAnswer } from "@schools/learning/checking";
import { maybeSweep } from "@schools/reducer/trigger";

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
 */

export const runtime = "nodejs";

interface SubmitBody {
  blockId?: string;
  episodeId?: string;
  answer?: BlockAnswer;
  /** Milliseconds the learner spent on the block. Advisory only. */
  elapsedMs?: number;
}

export async function POST(request: Request) {
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
  let outcome = gradeBlock(target, answer);

  /* Code blocks are graded by running them, not by comparing strings. The pure
     grader returns `unknown` for them — correct when no judge is configured,
     and replaced here when one is.

     Note what happens when the judge is unreachable: the verdict stays
     `unknown`. NOT `wrong`. "We could not run this" and "your program is
     broken" are different things to say to a fourteen-year-old, and only one
     of them is true. */
  let caseSummary: { passed: number; total: number } | null = null;
  const codeBlock =
    target.block.type === "write_code" ||
    target.block.type === "modify_code" ||
    target.block.type === "challenge"
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
        codeBlock.cases,
      );
      if (!infrastructureFailed && results.length > 0) {
        const passed = results.filter((r) => r.passed).length;
        caseSummary = { passed, total: results.length };
        const graded = checkCodeResult(passed, results.length);
        outcome = {
          ...outcome,
          result: { ...outcome.result, verdict: graded.verdict },
          // Now that it IS measured, the skill applies.
          primarySkill: codeBlock.skillRefs[0] ?? null,
        };
      }
    } catch {
      /* Judge unavailable. `unknown` stands. */
    }
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();

  const episodeId = typeof body.episodeId === "string" ? body.episodeId : randomUUID();
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
        ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
        /* Per-test counts. Without them on two successive attempts the core
           can never reach `progressed` or `regressed`, and `thrash` collapses
           into `stuck` — two of seven intervention outcomes and one of five
           struggle classes become unreachable, silently. */
        ...(caseSummary
          ? { tests_passed: caseSummary.passed, tests_total: caseSummary.total }
          : {}),
      }),
    });

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

  await store.appendEvents(events);

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

  const res = NextResponse.json({
    verdict: outcome.result.verdict,
    reveal: outcome.result.reveal ?? null,
    episodeId,
    cases: caseSummary,
    /* The failure class is NOT returned. The learner is never told the system
       named their misconception — that is the Decision Engine's to act on
       through Nova, phrased as a question, not a label handed back as a score. */
    attested: attestation !== null,
  });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}
