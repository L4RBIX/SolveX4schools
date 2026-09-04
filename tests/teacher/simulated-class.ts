import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "../../schools/store/pglite-driver";
import { migrate } from "../../schools/store/migrate";
import { LearningStore } from "../../schools/store/learning-store";
import { hashPassword } from "../../schools/auth/password";
import { runSweep } from "../../schools/reducer/sweep";
import type { SqlExecutor } from "../../schools/store/sql";
import { MONTH_01_SEPTEMBER } from "../../schools/curriculum/months/month-01-september";
import { MONTH_03_NOVEMBER } from "../../schools/curriculum/months/month-03-november";
import { ATTEMPT_BLOCK_TYPES } from "../../schools/curriculum/types";
import type { LessonBlock } from "../../schools/curriculum/types";
import {
  isHumanReviewable,
  type HumanReviewableBlock,
} from "../../schools/teacher/review";

/**
 * A realistic Grade 9 class, generated rather than asserted.
 *
 * ## Why this is not a fixture of dashboard numbers
 *
 * The tempting shape for a "simulated class" is a table of expected teacher-
 * console values. That proves nothing: the console sits downstream of grading,
 * the reducer, the event ledger and the identity model, and every one of those
 * is where a real pilot breaks. `scripts/simulate-pilot.ts` already makes this
 * argument for the HTTP path and it applies twice over here.
 *
 * So this writes EVENTS — the same rows `/api/learning/submit` and
 * `/api/nova/hint` write — into a real migrated Postgres, runs the REAL reducer
 * sweep, and lets the projection and the teacher analytics compute whatever they
 * compute. Nothing in this file writes an `attempt_episodes` row, a
 * `learner_state` row, or a dashboard figure. The assertions live in the test
 * files and they assert SEMANTICS ("the assistance-dependent learner is not
 * called independent"), never a specific number.
 *
 * ## Why the rows go in by raw SQL
 *
 * `store.appendEvents` does not accept `received_at` — the column defaults to
 * `now()`, correctly, because a browser must not be able to name the time its
 * own event arrived. But `reduceEpisode` reads `opened_at` from `received_at`
 * (`episode.ts:349`), and `lastActivityFor` reads `max(received_at)`, so a
 * simulation in which every event lands at `now()` cannot produce a learner who
 * has been inactive for twelve days, or a "last week versus this week"
 * comparison at all.
 *
 * The insert below is therefore explicit about a server clock the fixture
 * controls, which is exactly what a server that received these events over six
 * weeks would have written. Everything else — the schema, the constraints, the
 * reducer, the projection, the analytics — is the shipped code.
 *
 * ## Determinism
 *
 * No `Math.random` anywhere. Every profile is a fixed script and every
 * timestamp is derived from a fixed `NOW`. Two runs produce byte-identical
 * rows, which is what makes it possible to ask whether a change altered what a
 * teacher sees.
 */

/* -------------------------------------------------------------------------- */
/* Clock                                                                      */
/* -------------------------------------------------------------------------- */

/** A Wednesday, so the Monday-anchored week has three days behind it. */
export const NOW = Date.parse("2026-10-14T10:00:00.000Z");

export const DAY = 86_400_000;
export const MINUTE = 60_000;

/** `d` days before NOW, plus `m` minutes. Negative `d` is in the past. */
export function at(daysAgo: number, minutes = 0): string {
  return new Date(NOW - daysAgo * DAY + minutes * MINUTE).toISOString();
}

/* -------------------------------------------------------------------------- */
/* Curriculum handles                                                         */
/* -------------------------------------------------------------------------- */

/** Every attempt block in September, in teaching order. */
export function septemberTasks(): { lessonId: string; block: LessonBlock }[] {
  const out: { lessonId: string; block: LessonBlock }[] = [];
  for (const unit of MONTH_01_SEPTEMBER.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        if (ATTEMPT_BLOCK_TYPES.has(block.type)) out.push({ lessonId: lesson.id, block });
      }
    }
  }
  return out;
}

export function assessmentBlocks(): LessonBlock[] {
  return [...(MONTH_01_SEPTEMBER.assessment?.blocks ?? [])];
}

/**
 * The month whose check actually obliges a teacher to read something.
 *
 * NOT September, and that is the point. `review-policy.ts` classifies all
 * thirty-three `explain` blocks in the programme and makes exactly four
 * mandatory — `m3.as.b2`, `m6.as.b3`, `m7.as.b3`, `m8.as.b1` — none of them in
 * September. September's `m1.as.b3` is a SAMPLE and `m1.as.b4` is an oral
 * defence, and neither creates an asynchronous obligation.
 *
 * The rest of the fixture stays on September because that is where the
 * simulated class does its work. Only the review queue moves, because a review
 * test built on a month with nothing to review proves nothing — and, until the
 * teacher queue was made to obey the curriculum contract, it silently did.
 */
export const REVIEW_MONTH = MONTH_03_NOVEMBER;

/**
 * The blocks of the review month's check that a human has to read.
 *
 * Filtered through the SAME predicate the teacher console uses rather than a
 * hard-coded `["m3.as.b2"]`. A fixture that names block ids would keep
 * producing a queue after the curriculum changed shape, and the test built on
 * it would go on passing against work nobody is asked to mark.
 */
export function humanMarkedAssessmentBlocks(): HumanReviewableBlock[] {
  return [...(REVIEW_MONTH.assessment?.blocks ?? [])].filter(isHumanReviewable);
}

/**
 * Task indices grouped so that a learner solving them accumulates SEVERAL
 * unaided solves on the SAME skill.
 *
 * This exists because the fixture's first attempt at a "strong" learner solved
 * eight different tasks and came out `on_track` rather than `ready_to_stretch`
 * — correctly. `isReadyToStretch` wants two skills with two unaided solves
 * each, and eight tasks spread across eight skills is one solve apiece. That is
 * the model working: breadth is not depth, and a learner who has done one thing
 * on each of eight topics has not demonstrated independence on any of them.
 *
 * So a realistic strong learner has to be built the way a real one behaves —
 * repeatedly, on the same material.
 */
export function tasksClusteredBySkill(minPerSkill = 2, skills = 3): number[] {
  const tasks = septemberTasks();
  const bySkill = new Map<string, number[]>();
  tasks.forEach((t, i) => {
    const skill = t.block.skillRefs?.[0];
    if (!skill) return;
    const list = bySkill.get(skill) ?? [];
    list.push(i);
    bySkill.set(skill, list);
  });
  const out: number[] = [];
  let taken = 0;
  for (const [, indices] of bySkill) {
    if (indices.length < minPerSkill) continue;
    out.push(...indices.slice(0, Math.max(minPerSkill, 3)));
    taken += 1;
    if (taken >= skills) break;
  }
  return out;
}

/** Blocks that are `challenge` or `verify` — the advanced set. */
export function challengeTasks(): { lessonId: string; block: LessonBlock }[] {
  return septemberTasks().filter(
    (t) => t.block.type === "challenge" || t.block.type === "verify",
  );
}

/* -------------------------------------------------------------------------- */
/* Event writing                                                              */
/* -------------------------------------------------------------------------- */

export interface RawEvent {
  subjectId: string;
  episodeId: string | null;
  seq: number;
  eventName: string;
  receivedAt: string;
  sourceTrust: "server" | "judge" | "verifier" | "browser";
  payload: Record<string, string | number | boolean>;
}

/**
 * Insert events with an explicit server clock.
 *
 * Batched into one multi-row statement per call so an 18-learner month is a
 * handful of round trips rather than thousands — PGlite is fast but not free,
 * and a fixture that takes ninety seconds is a fixture people stop running.
 */
export async function writeEvents(sql: SqlExecutor, events: readonly RawEvent[]): Promise<void> {
  if (events.length === 0) return;
  const CHUNK = 400;
  for (let i = 0; i < events.length; i += CHUNK) {
    const slice = events.slice(i, i + CHUNK);
    const values: unknown[] = [];
    const tuples: string[] = [];
    slice.forEach((e, j) => {
      const b = j * 9;
      tuples.push(
        `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, ` +
          `$${b + 7}, $${b + 7}, $${b + 8}, 'development', 'public', '/', $${b + 9}::jsonb)`,
      );
      values.push(
        randomUUID(),
        e.subjectId,
        e.episodeId,
        randomUUID(),
        e.seq,
        e.eventName,
        e.receivedAt,
        e.sourceTrust,
        JSON.stringify(e.payload),
      );
    });
    /* `occurred_at` and `received_at` are given the same value deliberately.
       The distinction between them exists because the first is the client's
       clock and forgeable; a fixture is not a client, and making them differ
       would only test the fixture's own arithmetic. */
    await sql.query(
      `insert into learning_events
         (event_id, subject_id, episode_id, session_id, seq, event_name,
          occurred_at, received_at, source_trust, environment, cohort, route, payload)
       values ${tuples.join(", ")}`,
      values,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Submitted artifacts                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One written answer, as the learner left it.
 *
 * The teacher console's human-review queue reads
 * `learning_submissions.answer` — the column migration 0021 added — so a
 * fixture that writes only `learning_events` produces a class whose written
 * explanations exist in the ledger and nowhere a teacher can open. That is a
 * real state (every submission settled before 0021 is exactly that) and it is
 * NOT the state a demo should show by default.
 */
export interface WrittenSpec {
  blockId: string;
  /** What the learner actually wrote. Real prose — a fixture of «lorem» proves nothing. */
  text: string;
  daysAgo: number;
  minute?: number;
  /**
   * Settle the row with no artifact, the way a pre-0021 submission looks.
   *
   * Kept as an option because the queue has to render that case correctly —
   * the learner did the work, the verdict survived, the words did not — and a
   * fixture that cannot produce it cannot test it.
   */
  artifactMissing?: boolean;
}

/**
 * Write settled submission rows carrying the learner's own words.
 *
 * `verdict` is always `unknown`, with no branch that can produce anything else.
 * That is not a fixture convenience: `checking.ts` settles every `explain`
 * block as `unknown` because prose in a learner's own words cannot be
 * machine-graded, and a fixture that wrote `correct` here would be seeding a
 * measurement the product refuses to take.
 *
 * The `learning_submissions_settled_together` CHECK requires `settled_at`,
 * `verdict` and `response` to arrive as a set, so all three are written even
 * for a row whose `answer` is deliberately null.
 */
export async function writeSubmissions(
  sql: SqlExecutor,
  rows: readonly { subjectId: string; spec: WrittenSpec }[],
  /**
   * Milliseconds to add to every timestamp.
   *
   * The generator is anchored to a fixed `NOW` so the benchmark is
   * deterministic; the demo seeder translates the whole history onto the real
   * calendar by one offset and has to translate these rows by the same one, or
   * a teacher opens the queue and finds work submitted in 2026.
   */
  shiftMs = 0,
): Promise<void> {
  for (const { subjectId, spec } of rows) {
    const when = new Date(Date.parse(at(spec.daysAgo, spec.minute ?? 0)) + shiftMs).toISOString();
    await sql.query(
      `insert into learning_submissions
         (subject_id, submission_id, block_id, episode_id,
          claimed_at, settled_at, verdict, response, answer)
       values ($1, $2, $3, $4, $5, $5, 'unknown', $6::jsonb, $7::jsonb)
       on conflict (subject_id, submission_id) do nothing`,
      [
        subjectId,
        randomUUID(),
        spec.blockId,
        randomUUID(),
        when,
        JSON.stringify({ verdict: "unknown", unmeasuredReason: "not_machine_graded" }),
        spec.artifactMissing ? null : JSON.stringify({ kind: "text", value: spec.text }),
      ],
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Episode scripts                                                            */
/* -------------------------------------------------------------------------- */

export interface EpisodeSpec {
  blockId: string;
  taskKind?: "cp_problem" | "assessment";
  skillId?: string | null;
  /** Days before NOW the episode happened. */
  daysAgo: number;
  /** Minutes past the top of that day. Keeps two episodes on one day apart. */
  minute?: number;
  /**
   * Verdicts in order. `accepted` ends the episode successfully.
   *
   * `failingTest` and `testsPassed` matter: `isStagnant` builds its signature
   * from them, so three failures with the SAME failing test are stagnation and
   * three with different ones are progress.
   */
  verdicts: {
    verdict: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded";
    testsPassed?: number;
    testsTotal?: number;
    failingTest?: number;
  }[];
  /** Hint levels delivered, in order. `[]` is an unaided attempt. */
  hints?: number[];
  /** Meaningful edits made AFTER the first verdict. Separates thrash from stuck. */
  editsAfterFirstVerdict?: number;
  /** Meaningful edits before any verdict. Separates productive struggle from stuck. */
  editsBeforeVerdict?: number;
  revealed?: boolean;
  /** A named diagnostic. Two distinct episodes with the same one is actionable. */
  failureClass?: string;
  /**
   * Emit `unattributed_failure` attributions instead of a named cause.
   *
   * The state the whole model is built to be honest about: the verifier saw the
   * failure and could not say why. It must reach the teacher as "the system
   * could not explain this", never as a claim about the learner.
   */
  unattributed?: boolean;
  /** Minutes between consecutive events. Drives `active_seconds`. */
  paceMinutes?: number;
  /** Leave the episode open (no `episode_closed`). */
  leaveOpen?: boolean;
  /** A long silence before the close, which reads as walking away. */
  disengage?: boolean;
  /** Submissions recorded but NO verdict — a judge outage. */
  unmeasuredSubmissions?: number;
}

/**
 * One episode's worth of events, in the shape the runtime actually writes.
 *
 * The event ORDER and the payload keys here are not decorative — they are what
 * `reduceEpisode` reads. Getting `failing_test` wrong turns a stuck learner
 * into a thrashing one; omitting `episode_closed` leaves the episode
 * `in_progress` and out of every solve count.
 */
export function episodeEvents(subjectId: string, spec: EpisodeSpec): RawEvent[] {
  const episodeId = randomUUID();
  const pace = spec.paceMinutes ?? 2;
  /* The prefix mirrors `schoolTaskRef` in run-state.ts: `sx-{kind}:{blockId}`.
     It matters that the assessment prefix differs, because that is exactly the
     mismatch (`sx-assessment:` written, `sx-assess:` declared in taskRef.ts)
     that makes `parseTaskRef` return null for every real assessment event and
     forces every query in this product to match on the suffix instead. */
  const taskKind = spec.taskKind ?? "cp_problem";
  const taskRef = `sx-${taskKind === "assessment" ? "assessment" : "lesson"}:${spec.blockId}`;
  let seq = 0;
  let minute = spec.minute ?? 0;
  const out: RawEvent[] = [];

  const push = (
    eventName: string,
    sourceTrust: RawEvent["sourceTrust"],
    payload: Record<string, string | number | boolean>,
  ) => {
    out.push({
      subjectId,
      episodeId,
      seq: seq++,
      eventName,
      receivedAt: at(spec.daysAgo, minute),
      sourceTrust,
      payload,
    });
    minute += pace;
  };

  push("episode_opened", "browser", {
    task_ref: taskRef,
    task_kind: taskKind === "assessment" ? "assessment" : "lesson",
    ...(spec.skillId ? { skill_id: spec.skillId } : {}),
  });

  for (let i = 0; i < (spec.editsBeforeVerdict ?? 0); i += 1) {
    push("code_diff_classified", "server", { diff_class: i === 0 ? "authored" : "local_fix" });
  }

  for (let i = 0; i < (spec.hints?.length ?? 0); i += 1) {
    const level = spec.hints![i];
    const interventionId = randomUUID();
    push("assistance_requested", "server", { intervention_id: interventionId, requested_level: level });
    push("assistance_delivered", "server", {
      intervention_id: interventionId,
      level,
      granted_level: level,
      contains_code: level >= 3,
    });
  }

  spec.verdicts.forEach((v, i) => {
    if (i > 0) {
      for (let e = 0; e < (spec.editsAfterFirstVerdict ?? 0); e += 1) {
        push("code_diff_classified", "server", { diff_class: "local_fix" });
      }
    }
    push("verdict_received", "judge", {
      task_ref: taskRef,
      verdict: v.verdict,
      ...(v.testsPassed !== undefined ? { tests_passed: v.testsPassed } : {}),
      ...(v.testsTotal !== undefined ? { tests_total: v.testsTotal } : {}),
      ...(v.failingTest !== undefined ? { failing_test_index: v.failingTest } : {}),
      ...(spec.skillId ? { skill_id: spec.skillId } : {}),
    });
    if (v.verdict !== "accepted" && (spec.failureClass || spec.unattributed)) {
      push("failure_attributed", "verifier", {
        task_ref: taskRef,
        failure_class: spec.unattributed ? "unattributed_failure" : spec.failureClass!,
        attribution_source: spec.unattributed
          ? "engine_default"
          : "curriculum_diagnostic_mapping",
        confidence: spec.unattributed ? 0.2 : 0.9,
        ...(spec.skillId ? { skill_id: spec.skillId } : {}),
      });
    }
  });

  /* Submissions the judge never answered. `episode_opened` carries the task ref
     and is what `levelFromEvidence` counts as a submission, so an extra one
     with no `verdict_received` is precisely the shape of a judge outage. */
  for (let i = 0; i < (spec.unmeasuredSubmissions ?? 0); i += 1) {
    push("episode_opened", "browser", {
      task_ref: taskRef,
      task_kind: taskKind === "assessment" ? "assessment" : "lesson",
    });
  }

  if (spec.revealed) {
    push("solution_revealed", "browser", { task_ref: taskRef, reveal_scope: "full" });
  }

  if (!spec.leaveOpen) {
    if (spec.disengage) minute += 20;
    const accepted = spec.verdicts.some((v) => v.verdict === "accepted");
    push("episode_closed", "browser", {
      task_ref: taskRef,
      close_reason: spec.revealed ? "solution_revealed" : accepted ? "accepted" : "abandoned",
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* The eighteen                                                               */
/* -------------------------------------------------------------------------- */

export type ProfileKey =
  | "new"
  | "inactive"
  | "strong_independent"
  | "assistance_dependent"
  | "productive_struggle"
  | "stuck"
  | "thrashing"
  | "assessment_incomplete"
  | "assessment_legacy_answer"
  | "advanced"
  | "delayed_resolve"
  | "boundary_error"
  | "busy_no_progress"
  | "efficient"
  | "improving"
  | "regressing"
  | "average"
  | "infrastructure_failures"
  | "unmeasured_work";

export interface Profile {
  key: ProfileKey;
  /**
   * An ordinary Kazakh name, and deliberately not a description.
   *
   * These were «Сая Тексеріс» (inspection), «Айсұлу Ақау» (defect), «Мұрат
   * Тұйық» (dead end), «Жанель Шекара» (boundary — and she is the learner
   * failing a boundary condition). Self-documenting in a fixture, and a
   * screenshot-only reviewer with no implementation context decoded the whole
   * list in about three seconds and concluded the product was a mock-up.
   *
   * A demo whose class list reads as a test harness teaches its reader to
   * distrust every real number beside it. The behaviour each profile encodes
   * belongs in `key` and `expectation`, which is where someone reading this
   * file will look for it.
   */
  displayName: string;
  /** What a teacher should be able to conclude. Asserted by the benchmark. */
  expectation: string;
  episodes: (tasks: ReturnType<typeof septemberTasks>) => EpisodeSpec[];
  /**
   * Written answers this learner left on human-marked assessment blocks.
   *
   * Separate from `episodes` because the two land in different tables and mean
   * different things: an episode is what the ledger recorded happening, and
   * this is the artifact the learner left behind. A class can have the first
   * without the second — that is every submission settled before migration
   * 0021 — and the console has to tell them apart.
   */
  written?: () => WrittenSpec[];
}

/** A task's block id and its primary skill, by index into September. */
function t(tasks: ReturnType<typeof septemberTasks>, i: number) {
  const task = tasks[i % tasks.length];
  return { blockId: task.block.id, skillId: task.block.skillRefs?.[0] ?? null };
}

/** A clean unaided solve. */
function solo(tasks: ReturnType<typeof septemberTasks>, i: number, daysAgo: number, minute = 0): EpisodeSpec {
  const { blockId, skillId } = t(tasks, i);
  return {
    blockId,
    skillId,
    daysAgo,
    minute,
    verdicts: [{ verdict: "accepted", testsPassed: 5, testsTotal: 5 }],
    editsBeforeVerdict: 2,
    paceMinutes: 3,
  };
}

/** A solve that needed a strong hint. `hintDependency` counts level >= 2. */
function helped(
  tasks: ReturnType<typeof septemberTasks>,
  i: number,
  daysAgo: number,
  level = 3,
  minute = 0,
): EpisodeSpec {
  const { blockId, skillId } = t(tasks, i);
  return {
    blockId,
    skillId,
    daysAgo,
    minute,
    hints: [level],
    verdicts: [
      { verdict: "wrong_answer", testsPassed: 1, testsTotal: 5, failingTest: 2 },
      { verdict: "accepted", testsPassed: 5, testsTotal: 5 },
    ],
    editsAfterFirstVerdict: 1,
    editsBeforeVerdict: 1,
    paceMinutes: 4,
  };
}

/** Three identical failures with no edits between them: out of ideas. */
function stuckOn(
  tasks: ReturnType<typeof septemberTasks>,
  i: number,
  daysAgo: number,
  minute = 0,
): EpisodeSpec {
  const { blockId, skillId } = t(tasks, i);
  return {
    blockId,
    skillId,
    daysAgo,
    minute,
    verdicts: [
      { verdict: "wrong_answer", testsPassed: 1, testsTotal: 5, failingTest: 3 },
      { verdict: "wrong_answer", testsPassed: 1, testsTotal: 5, failingTest: 3 },
      { verdict: "wrong_answer", testsPassed: 1, testsTotal: 5, failingTest: 3 },
    ],
    editsAfterFirstVerdict: 0,
    editsBeforeVerdict: 1,
    paceMinutes: 7,
  };
}

/** Three identical failures WITH edits between them: changing things at random. */
function thrashOn(
  tasks: ReturnType<typeof septemberTasks>,
  i: number,
  daysAgo: number,
  minute = 0,
): EpisodeSpec {
  return { ...stuckOn(tasks, i, daysAgo, minute), editsAfterFirstVerdict: 2, paceMinutes: 3 };
}

/** Failing, but passing more tests each time. The product working. */
function productiveOn(
  tasks: ReturnType<typeof septemberTasks>,
  i: number,
  daysAgo: number,
  minute = 0,
): EpisodeSpec {
  const { blockId, skillId } = t(tasks, i);
  return {
    blockId,
    skillId,
    daysAgo,
    minute,
    verdicts: [
      { verdict: "wrong_answer", testsPassed: 1, testsTotal: 5, failingTest: 2 },
      { verdict: "wrong_answer", testsPassed: 3, testsTotal: 5, failingTest: 4 },
      { verdict: "accepted", testsPassed: 5, testsTotal: 5 },
    ],
    editsAfterFirstVerdict: 2,
    editsBeforeVerdict: 2,
    paceMinutes: 5,
  };
}

/** The same named mistake, in separate episodes. Two makes it actionable. */
function boundaryMiss(
  tasks: ReturnType<typeof septemberTasks>,
  i: number,
  daysAgo: number,
  minute = 0,
): EpisodeSpec {
  const { blockId, skillId } = t(tasks, i);
  return {
    blockId,
    skillId,
    daysAgo,
    minute,
    failureClass: "strict_vs_inclusive_boundary",
    verdicts: [
      { verdict: "wrong_answer", testsPassed: 4, testsTotal: 5, failingTest: 5 },
      { verdict: "accepted", testsPassed: 5, testsTotal: 5 },
    ],
    editsAfterFirstVerdict: 1,
    editsBeforeVerdict: 1,
    paceMinutes: 4,
  };
}

/**
 * Names for the enrolled-but-never-started learners, for the same reason as
 * above: they sit at the TOP of the attention queue, so a placeholder-looking
 * name there is the first thing a reader sees.
 */
const SILENT_NAMES = ["Алишер Оспанов", "Камила Тұрғанова", "Диас Мұратбек"];

export const PROFILES: Profile[] = [
  {
    key: "new",
    displayName: "Айгерім Сәрсенова",
    expectation: "Enrolled with almost nothing recorded: not called weak, not called ready.",
    episodes: (tasks) => [solo(tasks, 0, 0, 5)],
  },
  {
    key: "inactive",
    displayName: "Бекзат Мұқанов",
    expectation: "Worked three weeks ago and nothing since: surfaced as inactive, not as failing.",
    episodes: (tasks) => [solo(tasks, 1, 22), solo(tasks, 2, 22, 30), helped(tasks, 3, 21)],
  },
  {
    key: "strong_independent",
    displayName: "Данияр Оралбек",
    expectation: "Repeated unaided solves on the same skills: ready to stretch, never flagged.",
    episodes: (tasks) =>
      tasksClusteredBySkill(2, 3).map((i, k) => solo(tasks, i, k < 5 ? 1 : 3, k * 20)),
  },
  {
    key: "assistance_dependent",
    displayName: "Ержан Сағындықов",
    expectation: "Solves, but nearly always after a level-3 hint: NOT counted as independent.",
    episodes: (tasks) => [
      helped(tasks, 0, 1, 3, 0),
      helped(tasks, 1, 1, 3, 30),
      helped(tasks, 2, 2, 4, 0),
      helped(tasks, 3, 2, 3, 30),
      helped(tasks, 4, 4, 3, 0),
      solo(tasks, 5, 4, 40),
    ],
  },
  {
    key: "productive_struggle",
    displayName: "Гүлнәз Байжанова",
    expectation: "Fails repeatedly then succeeds, passing more tests each time: NOT flagged as stuck.",
    episodes: (tasks) => [
      productiveOn(tasks, 6, 1, 0),
      productiveOn(tasks, 7, 2, 0),
      productiveOn(tasks, 8, 3, 0),
      solo(tasks, 9, 4),
    ],
  },
  {
    key: "stuck",
    displayName: "Мұрат Әбдіров",
    expectation: "Same failing test three times with no edits between: stuck, and distinct from thrashing.",
    episodes: (tasks) => [
      stuckOn(tasks, 10, 1, 0),
      stuckOn(tasks, 11, 2, 0),
      stuckOn(tasks, 12, 3, 0),
    ],
  },
  {
    key: "thrashing",
    displayName: "Нұрлан Естаев",
    expectation: "Same failing test three times WITH edits between: thrashing, and distinct from stuck.",
    episodes: (tasks) => [
      thrashOn(tasks, 13, 1, 0),
      thrashOn(tasks, 14, 1, 40),
      thrashOn(tasks, 15, 2, 0),
      thrashOn(tasks, 16, 3, 0),
    ],
  },
  {
    key: "assessment_incomplete",
    displayName: "Сая Жақыпова",
    expectation: "Ordinary lesson work done, monthly check started and not finished.",
    episodes: (tasks) => {
      const as = assessmentBlocks();
      const specs: EpisodeSpec[] = [solo(tasks, 0, 3), solo(tasks, 1, 3, 30), solo(tasks, 2, 5)];
      if (as[0]) {
        specs.push({
          blockId: as[0].id,
          taskKind: "assessment",
          skillId: as[0].skillRefs?.[0] ?? null,
          daysAgo: 2,
          verdicts: [{ verdict: "accepted", testsPassed: 4, testsTotal: 4 }],
          editsBeforeVerdict: 2,
          paceMinutes: 4,
        });
      }
      /* The written half, answered. `explain` blocks take no verdict — nothing
         machine-grades prose — so these episodes carry an open and no
         `verdict_received`, which is what `levelFromEvidence` reads as
         `answered` and what `humanMarkedAnswers` counts. */
      for (const block of humanMarkedAssessmentBlocks()) {
        specs.push({
          blockId: block.id,
          taskKind: "assessment",
          skillId: block.skillRefs?.[0] ?? null,
          daysAgo: 2,
          minute: 25,
          verdicts: [],
          paceMinutes: 5,
        });
      }
      return specs;
    },
    /*
     * A real answer to September's real question.
     *
     * `m1.as.b3` asks four things — why integers, what `//` changes, where the
     * 17:30 boundary falls, and what a very large hour does. This answers three
     * of them well and the fourth vaguely, which is the shape a teacher
     * actually has to read and judge. A fixture of lorem would let the review
     * panel look finished while proving nothing about whether a marker can use
     * it.
     */
    written: () => {
      const [explain, oral] = humanMarkedAssessmentBlocks();
      const out: WrittenSpec[] = [];
      if (explain) {
        out.push({
          blockId: explain.id,
          daysAgo: 2,
          minute: 25,
          text:
            "Я считал время в минутах целыми числами, потому что часы и минуты — целые, " +
            "дробные тут не нужны и с ними сравнивать было бы неудобно.\n\n" +
            "Если написать // вместо /, то получится целая часть от деления, а / даёт " +
            "дробное. Но у меня деления вообще нет, только умножение на 60.\n\n" +
            "Граница на 17*60+30 = 1050 минут. У меня стоит <=, поэтому 1050 входит, " +
            "а 1051 уже нет. Если бы поставил <, то 17:30 потерялось бы.\n\n" +
            "Про очень большие часы не уверен, наверное просто выведет no.",
        });
      }
      if (oral) {
        out.push({
          blockId: oral.id,
          daysAgo: 2,
          minute: 32,
          text:
            "Сказать про то, что or пропускает ученика, если верно хотя бы одно условие, " +
            "поэтому проходит и тот, у кого посещаемость 10. Нужно and — тогда оба.",
        });
      }
      return out;
    },
  },
  {
    /*
     * A second reader for the queue, and the case that is NOT a defect.
     *
     * Answered the written half before the platform kept answers — the verdict
     * survived and the words did not. Every submission settled before migration
     * 0021 looks exactly like this, permanently, and the console has to say so
     * rather than showing an empty panel that reads as a loading failure.
     */
    key: "assessment_legacy_answer",
    displayName: "Мадина Сейітова",
    expectation: "Wrote the explanation before artifacts were stored: queued, and honestly unreadable.",
    episodes: (tasks) => {
      const specs: EpisodeSpec[] = [solo(tasks, 0, 4), solo(tasks, 1, 4, 30)];
      const [explain] = humanMarkedAssessmentBlocks();
      if (explain) {
        specs.push({
          blockId: explain.id,
          taskKind: "assessment",
          skillId: explain.skillRefs?.[0] ?? null,
          daysAgo: 4,
          minute: 15,
          verdicts: [],
          paceMinutes: 6,
        });
      }
      return specs;
    },
    written: () => {
      const [explain] = humanMarkedAssessmentBlocks();
      return explain
        ? [{ blockId: explain.id, daysAgo: 4, minute: 15, text: "", artifactMissing: true }]
        : [];
    },
  },
  {
    key: "advanced",
    displayName: "Ләззат Қуанышева",
    expectation: "Unaided solves including challenge and verify blocks: ranks on the challenge lens.",
    episodes: () => {
      const all = septemberTasks();
      const challenge = challengeTasks();
      const specs = tasksClusteredBySkill(2, 2).map((i, k) => solo(all, i, 2, k * 20));
      challenge.slice(0, 3).forEach((c, i) => {
        specs.push({
          blockId: c.block.id,
          skillId: c.block.skillRefs?.[0] ?? null,
          daysAgo: 1,
          minute: i * 30,
          verdicts: [{ verdict: "accepted", testsPassed: 6, testsTotal: 6 }],
          editsBeforeVerdict: 3,
          paceMinutes: 5,
        });
      });
      return specs;
    },
  },
  {
    key: "delayed_resolve",
    displayName: "Азамат Ермеков",
    expectation: "Solved with help, then solved the same task unaided a fortnight later.",
    episodes: (tasks) => [
      helped(tasks, 17, 16, 3),
      solo(tasks, 17, 2),
      solo(tasks, 18, 2, 30),
      solo(tasks, 19, 3),
    ],
  },
  {
    key: "boundary_error",
    displayName: "Жанель Тәжібаева",
    expectation: "The same named boundary mistake in separate episodes: an actionable misconception.",
    episodes: (tasks) => [
      boundaryMiss(tasks, 20, 1, 0),
      boundaryMiss(tasks, 21, 2, 0),
      boundaryMiss(tasks, 22, 3, 0),
      solo(tasks, 23, 4),
    ],
  },
  {
    key: "busy_no_progress",
    displayName: "Ислам Досжанов",
    expectation: "Many episodes, few solves: activity alone must not read as progress.",
    episodes: (tasks) =>
      [24, 25, 26, 27, 28, 29, 30, 31].map((i, k) => ({
        ...stuckOn(tasks, i, k < 4 ? 1 : 3, (k % 4) * 25),
        editsAfterFirstVerdict: 1,
        /* Nobody could say why these failed. That is the commonest real state
           and the one `unattributedFailures` exists to keep visible. */
        unattributed: true,
      })),
  },
  {
    key: "efficient",
    displayName: "Аяулым Кәрімова",
    expectation: "Few episodes, almost all solved unaided, little time: efficiency is not inactivity.",
    episodes: (tasks) => [
      { ...solo(tasks, 32, 1), paceMinutes: 1 },
      { ...solo(tasks, 33, 1, 15), paceMinutes: 1 },
      { ...solo(tasks, 34, 3), paceMinutes: 1 },
    ],
  },
  {
    key: "improving",
    displayName: "Тимур Ғаббасов",
    expectation: "One unaided solve last week, five this week: improvement is visible.",
    episodes: (tasks) => [
      helped(tasks, 0, 5, 3),
      helped(tasks, 1, 6, 3),
      solo(tasks, 2, 7),
      solo(tasks, 3, 1, 0),
      solo(tasks, 4, 1, 25),
      solo(tasks, 5, 2, 0),
      solo(tasks, 6, 2, 25),
      solo(tasks, 7, 3),
    ],
  },
  {
    key: "regressing",
    displayName: "Аружан Смағұлова",
    expectation: "Six unaided solves last week, one this week: a drop that is named, not implied.",
    /* The four earlier solves sit at 5-8 days ago so they land in the PREVIOUS
       Monday-anchored week rather than the one before it. A regression signal
       whose two windows do not abut is not measuring a regression. */
    episodes: (tasks) => [
      solo(tasks, 8, 5, 0),
      solo(tasks, 9, 5, 30),
      solo(tasks, 10, 6, 0),
      solo(tasks, 11, 7, 0),
      solo(tasks, 12, 8, 0),
      solo(tasks, 13, 8, 30),
      solo(tasks, 14, 1),
    ],
  },
  {
    key: "average",
    displayName: "Санжар Бекмұратов",
    expectation: "Steady, mixed, unremarkable: the class's middle, and flagged for nothing.",
    episodes: (tasks) => [
      solo(tasks, 15, 1),
      helped(tasks, 16, 1, 2, 30),
      solo(tasks, 17, 3),
      helped(tasks, 18, 4, 2),
      solo(tasks, 19, 5),
    ],
  },
  {
    key: "infrastructure_failures",
    displayName: "Айсұлу Нұрланова",
    expectation:
      "Submitted repeatedly during a judge outage: nothing measured, and NOTHING counted against them.",
    episodes: (tasks) => [
      { ...solo(tasks, 20, 1), verdicts: [], unmeasuredSubmissions: 3, leaveOpen: false },
      { ...solo(tasks, 21, 2), verdicts: [], unmeasuredSubmissions: 2 },
      solo(tasks, 22, 3),
      solo(tasks, 23, 4),
    ],
  },
  {
    key: "unmeasured_work",
    displayName: "Дәурен Айтжанов",
    expectation:
      "Answered written tasks nothing grades: work that exists, is not failed, and is not claimed as mastery.",
    episodes: (tasks) => {
      const explains = septemberTasks().filter((x) => x.block.type === "explain");
      const specs: EpisodeSpec[] = [];
      explains.slice(0, 3).forEach((e, i) => {
        specs.push({
          blockId: e.block.id,
          skillId: e.block.skillRefs?.[0] ?? null,
          daysAgo: i + 1,
          verdicts: [],
          unmeasuredSubmissions: 1,
          editsBeforeVerdict: 1,
          paceMinutes: 6,
        });
      });
      specs.push(solo(tasks, 24, 4));
      return specs;
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Provisioning                                                               */
/* -------------------------------------------------------------------------- */

export interface SimulatedClass {
  sql: SqlExecutor;
  store: LearningStore;
  schoolId: string;
  classId: string;
  teacherId: string;
  /** Profile key -> subject id, for assertions that name a learner. */
  subjectByProfile: Map<ProfileKey, string>;
  userByProfile: Map<ProfileKey, string>;
}

export interface BuildOptions {
  schoolId?: string;
  classId?: string;
  /** Enrol the profiles but write no events. For the empty-class tests. */
  withoutEvents?: boolean;
  /** Enrol N extra learners with no events, to test the never-started path. */
  extraSilentLearners?: number;
}

/**
 * Build the class, write the histories, run the real reducer.
 *
 * Returns once `runSweep` reports no more stale episodes, so the projection is
 * settled before any assertion reads it. The sweep is looped rather than called
 * once because it processes at most `limit` episodes per run and an 18-learner
 * month is comfortably more than the default.
 */
export async function buildSimulatedClass(opts: BuildOptions = {}): Promise<SimulatedClass> {
  const schoolId = opts.schoolId ?? "benchmark-school";
  const classId = opts.classId ?? "9a";

  const sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  const store = new LearningStore(sql);

  await store.upsertClass(schoolId, classId, "9А");

  const stored = await hashPassword("correct-horse-battery-staple");
  const teacherId = await store.createAccount({
    schoolId,
    role: "teacher",
    username: "teacher-benchmark",
    displayName: "Айгүл Серікқызы",
    passwordHash: stored.hash,
    passwordSalt: stored.salt,
    /* A person who has finished signing in.
       `createAccount` defaults `must_change_password` to true, which is right
       for a freshly provisioned child and wrong for a fixture that then drives
       the product: every guard now refuses a first-login session with 403
       `password_change_required`. The refusal itself is pinned in
       `tests/school/auth-enforcement.test.ts`; here it would only mean the
       fixture is not a user. */
    mustChangePassword: false,
  });
  await store.assignTeacher(schoolId, classId, teacherId);

  const subjectByProfile = new Map<ProfileKey, string>();
  const userByProfile = new Map<ProfileKey, string>();
  const tasks = septemberTasks();
  const events: RawEvent[] = [];
  const written: { subjectId: string; spec: WrittenSpec }[] = [];

  for (const profile of PROFILES) {
    const userId = await store.createAccount({
      schoolId,
      role: "student",
      username: `s-${profile.key}`,
      displayName: profile.displayName,
      passwordHash: stored.hash,
      passwordSalt: stored.salt,
      /* A person who has finished signing in.
         `createAccount` defaults `must_change_password` to true, which is right
         for a freshly provisioned child and wrong for a fixture that then drives
         the product: every guard now refuses a first-login session with 403
         `password_change_required`. The refusal itself is pinned in
         `tests/school/auth-enforcement.test.ts`; here it would only mean the
         fixture is not a user. */
      mustChangePassword: false,
    });
    await store.enrol(schoolId, classId, userId);
    userByProfile.set(profile.key, userId);

    /* The "new" learner is the one case where a subject is minted and almost
       nothing follows; every other profile gets one because they have work. */
    const subjectId = await store.resolveSubjectForUser(userId, { schoolId, classId });
    subjectByProfile.set(profile.key, subjectId);

    if (opts.withoutEvents) continue;
    for (const spec of profile.episodes(tasks)) {
      events.push(...episodeEvents(subjectId, spec));
    }
    for (const spec of profile.written?.() ?? []) {
      written.push({ subjectId, spec });
    }
  }

  for (let i = 0; i < (opts.extraSilentLearners ?? 0); i += 1) {
    const userId = await store.createAccount({
      schoolId,
      role: "student",
      username: `s-silent-${i}`,
      displayName: SILENT_NAMES[i] ?? `Оқушы ${i + 1}`,
      passwordHash: stored.hash,
      passwordSalt: stored.salt,
      /* A person who has finished signing in.
         `createAccount` defaults `must_change_password` to true, which is right
         for a freshly provisioned child and wrong for a fixture that then drives
         the product: every guard now refuses a first-login session with 403
         `password_change_required`. The refusal itself is pinned in
         `tests/school/auth-enforcement.test.ts`; here it would only mean the
         fixture is not a user. */
      mustChangePassword: false,
    });
    await store.enrol(schoolId, classId, userId);
    /* Deliberately NOT resolved: an enrolled learner who has never done
       anything has an account and no subject, and the dashboard must still
       show them. This is the case the old panel structurally could not
       surface. */
  }

  await writeEvents(sql, events);
  await writeSubmissions(sql, written);

  for (let i = 0; i < 40; i += 1) {
    const result = await runSweep(store, { limit: 500, owner: `bench-${i}` });
    if (result.episodesReduced === 0) break;
  }

  return { sql, store, schoolId, classId, teacherId, subjectByProfile, userByProfile };
}
