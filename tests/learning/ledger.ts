import { randomUUID } from "node:crypto";
import { sanitizePayload } from "@solvex/learning-contracts";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { checkCodeResult, type BlockAnswer } from "@schools/learning/checking";
import type { LessonBlock } from "@schools/curriculum/types";
import type { LearningEventRow, LearningStore } from "@schools/store/learning-store";
import type { SqlExecutor } from "@schools/store/sql";

/**
 * The ledger harness: one learner, one lesson, written the way the product
 * writes it.
 *
 * Every scenario in this directory has to START FROM EVENTS, because a
 * benchmark that hands `buildLearnerState` a state it made up earlier is only
 * testing the last function in the chain. So this module reproduces exactly one
 * thing — the event stream `POST /api/learning/submit` emits for one press of
 * Check — and reproduces it by CALLING the real grader (`gradeBlock`,
 * `checkCodeResult`, `toLearningVerdictName`) rather than by deciding verdicts
 * of its own. The rules therefore cannot drift from the route: if the grader
 * changes its mind about a distractor, every scenario here changes with it.
 *
 * The one thing it stands in for is the sandbox. `gradeBlock` settles a
 * `write_code` block as `unknown` because nothing ran it, which is the honest
 * answer and also the exact behaviour scenario L needs. `judged` supplies the
 * per-case tally a judge would have produced, and it is folded in with the same
 * `checkCodeResult` the route uses. Nothing else about a verdict is invented
 * here.
 *
 * ## Why the clock is explicit
 *
 * `learning_events.received_at` defaults to `now()`, so a test that only
 * inserts rows produces an episode in which everything happened in the same
 * millisecond. The reducer reads `received_at` for ordering, idle gaps, the
 * stuck threshold and the disengagement threshold, and the hint ladder reads it
 * to decide whether anything was attempted SINCE the last hint. None of those
 * can be exercised without a clock, and no amount of `setTimeout` gives a
 * five-day gap. So the rows are stamped after insert, from a virtual clock the
 * scenario drives. It is the server's own column being set by the only party
 * allowed to set it — the server — not a client claiming a time.
 */

/** A step in one episode, in the order the learner performed it. */
export type Step =
  /** Press Check. `judged` stands in for the sandbox on a code block. */
  | { kind: "submit"; answer: BlockAnswer; judged?: { passed: number; total: number } }
  /** Nova granted a hint at `level`. `containsCode` is what was DELIVERED. */
  | { kind: "hint"; level: number; containsCode?: boolean; requested?: number }
  /** A classified edit. Only the ingest route can produce these — see the note in the suites. */
  | { kind: "edit"; diffClass: string; bucket: string }
  /** Re-read the statement after a failing verdict. The one event the browser really sends. */
  | { kind: "reread" }
  /** Time passes. Seconds, on the server clock. */
  | { kind: "wait"; seconds: number }
  /** The episode ends. */
  | { kind: "close"; reason: "accepted" | "abandoned" | "navigated" | "expired" };

export interface EpisodeOptions {
  /** Reuse an id to append to an existing episode. Defaults to a fresh one. */
  episodeId?: string;
  /** Wall-clock start, ms since epoch. Defaults to a fixed date. */
  startedAt?: number;
}

export interface RecordedEpisode {
  episodeId: string;
  /** The primary skill the ledger attributed this episode to, or null. */
  skill: string | null;
  taskRef: string;
  taskKind: string;
  /** Verdicts as they were written, in order. */
  verdicts: ("accepted" | "wrong_answer")[];
  /** Failure classes as they were written, in order. */
  attributions: string[];
  endedAt: number;
}

/** A stable, boring start date. Nothing here depends on the real clock. */
const DEFAULT_START = Date.parse("2026-02-02T09:00:00.000Z");

/**
 * Play one episode into the ledger.
 *
 * Returns what was actually written rather than what was intended, so a
 * scenario asserting "three attributed failures" is asserting against the
 * grader's opinion and not against the test's.
 */
export async function playEpisode(
  ctx: { store: LearningStore; sql: SqlExecutor; subjectId: string },
  blockId: string,
  steps: readonly Step[],
  options: EpisodeOptions = {},
): Promise<RecordedEpisode> {
  const target = findBlock(blockId);
  if (!target) throw new Error(`no such block: ${blockId} — the curriculum moved under the test`);

  const episodeId = options.episodeId ?? randomUUID();
  const sessionId = randomUUID();
  const route = `/lesson/${target.lesson.id}`;
  let clock = options.startedAt ?? DEFAULT_START;

  const rows: LearningEventRow[] = [];
  /** event_id -> received_at, applied after insert. See the header note. */
  const stamps = new Map<string, number>();
  const verdicts: RecordedEpisode["verdicts"] = [];
  const attributions: string[] = [];
  const interventions: { id: string; level: number; containsCode: boolean; at: number }[] = [];

  let seq = 0;
  let skill: string | null = null;
  let taskRef = "";
  let taskKind = "";
  let opened = false;

  const push = (
    eventName: LearningEventRow["eventName"],
    sourceTrust: LearningEventRow["sourceTrust"],
    payload: Record<string, unknown>,
  ): void => {
    const eventId = randomUUID();
    rows.push({
      eventId,
      subjectId: ctx.subjectId,
      episodeId,
      sessionId,
      seq: seq++,
      eventName,
      // The client's clock. Forgeable, and nothing downstream orders by it.
      occurredAt: new Date(clock).toISOString(),
      sourceTrust,
      environment: "development",
      cohort: "public",
      route,
      payload: sanitizePayload(payload),
    });
    stamps.set(eventId, clock);
  };

  for (const step of steps) {
    switch (step.kind) {
      case "wait":
        clock += step.seconds * 1000;
        break;

      case "submit": {
        /* The grader, not the test. `gradeBlock` decides the verdict, the
           primary skill, the credited skills and whether the author declared
           this exact wrong answer diagnostically unambiguous. */
        let outcome = gradeBlock(target, step.answer);

        if (step.judged) {
          /* The sandbox half, folded in the way the submit route folds it: the
             judge's tally goes through `checkCodeResult`, and only THEN does the
             block's skill apply — an unmeasured code block credits nothing. */
          const graded = checkCodeResult(step.judged.passed, step.judged.total);
          const codeBlock = target.block as LessonBlock;
          outcome = {
            ...outcome,
            result: { ...outcome.result, verdict: graded.verdict },
            primarySkill: codeBlock.skillRefs[0] ?? null,
            creditedSkills:
              graded.verdict === "correct"
                ? [...codeBlock.skillRefs]
                : codeBlock.skillRefs.slice(0, 1),
          };
        }

        skill ??= outcome.primarySkill;
        taskRef = outcome.taskRef;
        taskKind = outcome.taskKind;
        const verdictName = toLearningVerdictName(outcome.result.verdict);

        if (!opened) {
          /* Written BEFORE grading by the real route, and that ordering is the
             whole reason an unmeasured block still counts as an attempt. */
          push("episode_opened", "server", {
            task_ref: outcome.taskRef,
            task_kind: outcome.taskKind,
            entry_source: "lesson",
            ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
          });
          opened = true;
        } else {
          push("episode_resumed", "server", { task_ref: outcome.taskRef });
        }

        if (verdictName) {
          /* Binary items report 1 of 1 or 0 of 1. Without counts on successive
             attempts the core can never reach `progressed`, `regressed` or
             `thrash` — see the submit route's own note. */
          const counts = step.judged
            ? { passed: step.judged.passed, total: step.judged.total }
            : { passed: verdictName === "accepted" ? 1 : 0, total: 1 };

          const credited = outcome.creditedSkills.length ? outcome.creditedSkills : [null];
          for (const skillId of credited) {
            push("verdict_received", "judge", {
              verdict: verdictName,
              task_ref: outcome.taskRef,
              ...(skillId ? { skill_id: skillId } : {}),
              tests_passed: counts.passed,
              tests_total: counts.total,
            });
          }
          verdicts.push(verdictName);

          if (verdictName !== "accepted") {
            const attributed = Boolean(outcome.result.failureClass);
            const failureClass = attributed
              ? outcome.result.failureClass!
              : "unattributed_failure";
            push("failure_attributed", "verifier", {
              failure_class: failureClass,
              attribution_source: attributed
                ? "curriculum_diagnostic_mapping"
                : "no_declared_mapping",
              confidence: attributed ? 0.9 : 0,
              attribution_version: 1,
              ...(outcome.primarySkill ? { skill_id: outcome.primarySkill } : {}),
            });
            attributions.push(failureClass);
          }
        }
        break;
      }

      case "hint": {
        const interventionId = randomUUID();
        push("assistance_requested", "server", {
          intervention_id: interventionId,
          requested_level: step.requested ?? step.level,
          granted_level: step.level,
          trigger: "learner_requested",
        });
        push("assistance_delivered", "server", {
          intervention_id: interventionId,
          level: step.level,
          evidence_type: "hint",
          contains_code: step.containsCode === true,
          content_len: 120,
        });
        interventions.push({
          id: interventionId,
          level: step.level,
          containsCode: step.containsCode === true,
          at: clock,
        });
        break;
      }

      case "edit":
        push("code_diff_classified", "server", {
          diff_class: step.diffClass,
          edit_distance_bucket: step.bucket,
          blob_hash: randomUUID().replace(/-/g, ""),
        });
        break;

      case "reread":
        push("statement_revisited", "browser", { is_revisit: true, revisit_after: "verdict" });
        break;

      case "close":
        push("episode_closed", "server", { close_reason: step.reason, task_ref: taskRef });
        break;
    }
  }

  await ctx.store.appendEvents(rows);

  /* The interventions table, which is what the hint ladder reads back as
     `lastGrantedLevel`. The route writes it separately from the event stream and
     so does this. */
  for (const i of interventions) {
    await ctx.store.recordIntervention({
      interventionId: i.id,
      subjectId: ctx.subjectId,
      episodeId,
      kind: "hint",
      level: i.level,
      trigger: "learner_requested",
      mode: null,
      containsCode: i.containsCode,
      contentLen: 120,
    });
  }

  await stampClock(ctx.sql, stamps, interventions);

  return {
    episodeId,
    skill,
    taskRef,
    taskKind,
    verdicts,
    attributions,
    endedAt: clock,
  };
}

/**
 * Put the server's clock where the scenario says it was.
 *
 * See the header. Done as one statement per row rather than a bulk update so a
 * failure names the event that could not be stamped.
 */
async function stampClock(
  sql: SqlExecutor,
  stamps: ReadonlyMap<string, number>,
  interventions: readonly { id: string; at: number }[],
): Promise<void> {
  for (const [eventId, at] of stamps) {
    await sql.query(`update learning_events set received_at = $2 where event_id = $1`, [
      eventId,
      new Date(at).toISOString(),
    ]);
  }
  for (const i of interventions) {
    await sql.query(`update interventions set delivered_at = $2 where intervention_id = $1`, [
      i.id,
      new Date(i.at).toISOString(),
    ]);
  }
}

/* ── Answers, derived from the curriculum rather than typed out ───────────── */

/**
 * The right answer for a block, read off the block itself.
 *
 * Hardcoding "o1" in a test means the test passes when the curriculum author
 * changes the correct option and the lesson silently breaks. Reading it means
 * the scenario is about the learner being right, not about a string.
 */
export function correctAnswer(blockId: string): BlockAnswer {
  const target = findBlock(blockId);
  if (!target) throw new Error(`no such block: ${blockId}`);
  const block = target.block;

  switch (block.type) {
    case "multiple_choice":
      return { kind: "option", id: block.correctOptionId };
    case "prediction":
      return block.options?.length
        ? { kind: "option", id: block.answer }
        : { kind: "text", value: block.answer };
    case "fill_blank":
      return { kind: "blanks", values: block.blanks.map((b) => b.answer) };
    case "reorder_code":
      return { kind: "order", ids: [...block.correctOrder] };
    case "find_bug":
      return { kind: "line", line: block.buggyLine };
    case "trace_code":
      return {
        kind: "grid",
        cells: Object.fromEntries(
          block.steps.flatMap((step, row) =>
            Object.entries(step.vars).map(([name, value]) => [`${row}:${name}`, value]),
          ),
        ),
      };
    default:
      throw new Error(
        `correctAnswer does not know how to answer a ${block.type} block; ` +
          `if it is a code block, supply a judged tally instead`,
      );
  }
}

/**
 * A wrong answer the curriculum author declared diagnostically unambiguous,
 * together with the class it establishes.
 *
 * Returns null when the block declares no mapping — which is the common and
 * correct case, and is exactly what scenario D is built on.
 */
export function attributedWrongAnswer(
  blockId: string,
  failureClass: string,
): { answer: BlockAnswer; failureClass: string } | null {
  const target = findBlock(blockId);
  if (!target) throw new Error(`no such block: ${blockId}`);
  const mapping = target.block.diagnosticMapping ?? {};
  for (const [key, entry] of Object.entries(mapping)) {
    if (entry.failureClass !== failureClass) continue;
    const block = target.block;
    if (block.type === "multiple_choice") return { answer: { kind: "option", id: key }, failureClass };
    if (block.type === "prediction") return { answer: { kind: "option", id: key }, failureClass };
    if (block.type === "find_bug") return { answer: { kind: "line", line: Number(key) }, failureClass };
  }
  return null;
}

/** A wrong answer with NO declared cause. The honest majority of real failures. */
export function unattributedWrongAnswer(blockId: string): BlockAnswer {
  const target = findBlock(blockId);
  if (!target) throw new Error(`no such block: ${blockId}`);
  const block = target.block;
  const mapped = new Set(Object.keys(block.diagnosticMapping ?? {}));

  if (block.type === "multiple_choice") {
    const option = block.options.find((o) => o.id !== block.correctOptionId && !mapped.has(o.id));
    if (!option) throw new Error(`${blockId} has no unmapped wrong option`);
    return { kind: "option", id: option.id };
  }
  if (block.type === "prediction") {
    const option = (block.options ?? []).find((o) => o !== block.answer && !mapped.has(o));
    if (!option) throw new Error(`${blockId} has no unmapped wrong option`);
    return { kind: "option", id: option };
  }
  if (block.type === "find_bug") {
    for (let line = 1; line <= 12; line += 1) {
      if (line !== block.buggyLine && !mapped.has(String(line))) return { kind: "line", line };
    }
  }
  throw new Error(`unattributedWrongAnswer does not handle a ${block.type} block`);
}
