/**
 * L2: reduce a raw event stream into one episode row.
 *
 * A pure function, deliberately. `attempt_episodes` is a CACHE — every column
 * here is recomputable from `learning_events` by replay, which is what makes
 * `REDUCER_VERSION` safe: bump it and stale rows are recomputed rather than
 * reinterpreted. Deleting the whole table costs a recomputation and loses no
 * facts.
 *
 * That property is the reason this file has no database access in it. If the
 * reducer could read anything but its own input, "replay produces the same
 * row" would stop being true, and the first time a rule changed we would be
 * back to writing backfill scripts against data we could not reconstruct.
 */

import {
  type CloseReason,
  type DiffClass,
  type LearningVerdict,
} from "@solvex/learning-contracts";

/**
 * Bump when the meaning of any derived column changes.
 *
 * Rows whose `reducer_version` is below this are recomputed on the next sweep.
 * A row is never reinterpreted under new rules while keeping its old values.
 *
 * v5 — `skill_id` surfaced. The problem's taxonomy skill arrives signed on
 * verdict and attribution events; before this the reducer dropped it, and a
 * learner projection could only be keyed by task because the task -> skill map
 * lives in the backend's SQLite where the ingest route cannot reach it.
 *
 * v4 — `statement_revisits_after_failure` split out. The event has carried
 * `revisit_after` since it shipped, and the reducer was throwing it away: a
 * learner re-reading the statement because their submission failed and a
 * learner skimming it once before abandoning both counted as "a revisit". The
 * learner fixtures showed a comprehension detector firing on the abandoner.
 *
 * v3 — verdict entries carry `progression_delta`, and episodes carry the
 * failure attributions the verification engine produced. Both are derived from
 * signed judge/verifier events; neither is computed from anything the browser
 * said.
 *
 * v2 — struggle classification rewritten after the twenty internal replays
 * (docs/LEARNING_REPLAY_FINDINGS.md). It now reads verdict stagnation, which
 * only became possible once the practice judge started returning per-test
 * counts: before that there was nothing to stagnate.
 */
export const REDUCER_VERSION = 5;

/** A gap longer than this is not work. Wall clock is not time-on-task. */
const IDLE_CEILING_SECONDS = 10 * 60;
/** Silence longer than this before a close reads as walking away. */
const DISENGAGE_SECONDS = 15 * 60;
/** No real edit for this long, with gaps dominating, is stuck rather than thinking. */
const STUCK_SECONDS = 6 * 60;
/** Consecutive constant tweaks against an unchanged failing test. */
const THRASH_RUN = 3;

export interface ReducibleEvent {
  event_name: string;
  occurred_at: string;
  received_at: string;
  seq: number;
  payload: Record<string, string | number | boolean>;
}

export interface ReducedEpisode {
  task_ref: string;
  task_kind: string;
  opened_at: string;
  closed_at: string | null;
  active_seconds: number;
  resume_count: number;
  outcome: "in_progress" | "accepted" | "abandoned" | "expired" | "solution_revealed";
  verdict_sequence: VerdictEntry[];
  diff_class_sequence: DiffClass[];
  submissions: number;
  runs: number;
  self_authored_tests: number;
  statement_revisits: number;
  /**
   * Revisits that followed a failing verdict, which is the only kind that says
   * anything: it means the learner suspects they misread the problem rather
   * than mis-implemented it. A revisit with no verdict behind it is reading.
   */
  statement_revisits_after_failure: number;
  language: string | null;
  /** Taxonomy skill for the task, from the signed attestation. Null when unsigned. */
  skill_id: string | null;
  max_assistance_level: number;
  intervention_count: number;
  solution_revealed: boolean;
  independence_weight: number;
  struggle_class: StruggleClass | null;
  /**
   * Why the failures happened, in order, from `failure_attributed` events.
   *
   * Empty when nothing could say — which is the common case today and is not
   * the same as "no failures". `attributed_failures` counts how many of the
   * submissions got an attribution stronger than `unattributed_failure`, so
   * coverage is readable without parsing the list.
   */
  attributions: AttributionEntry[];
  attributed_failures: number;
  event_count: number;
  reducer_version: number;
}

export interface VerdictEntry {
  verdict: LearningVerdict;
  tests_passed: number | null;
  tests_total: number | null;
  /** 1-based index of the first failing test, when the judge reported one. */
  failing_test: number | null;
  /**
   * Tests passed here minus tests passed on the previous attempt.
   *
   * Null unless BOTH attempts reported a count — a judge outage reports null
   * rather than zero precisely so this cannot manufacture a regression out of
   * downtime. Derived rather than sent: the counts it is computed from arrive
   * signed, and a client-computed delta would not.
   */
  progression_delta: number | null;
  at: string;
}

/** One attribution, as the verification engine stated it. */
export interface AttributionEntry {
  failure_class: string;
  attribution_source: string;
  confidence: number;
  reason: string | null;
  at: string;
}

export type StruggleClass =
  | "flow"
  | "productive_struggle"
  | "thrash"
  | "stuck"
  | "disengaged";

// ─── Independence ────────────────────────────────────────────────────────────

/**
 * How much of this result was the learner's.
 *
 * Phase 1 only records the number; nothing reads it yet. It ships now because
 * the alternative is discovering in Phase 2 that six months of episodes cannot
 * say whether a solve was earned — and that is not recoverable after the fact.
 *
 * Zero is not the same as absent. A revealed solution still produces an
 * episode; it simply cannot contribute support to any future skill belief.
 */
const INDEPENDENCE_BY_LEVEL: readonly number[] = [0.9, 0.7, 0.45, 0.2, 0.08];

export function independenceWeight(
  maxAssistanceLevel: number,
  solutionRevealed: boolean
): number {
  if (solutionRevealed) return 0;
  if (maxAssistanceLevel < 0) return 1;
  const capped = Math.min(maxAssistanceLevel, INDEPENDENCE_BY_LEVEL.length - 1);
  return INDEPENDENCE_BY_LEVEL[capped];
}

// ─── Reduction ───────────────────────────────────────────────────────────────

function str(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function num(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function reduceEpisode(events: readonly ReducibleEvent[]): ReducedEpisode | null {
  if (events.length === 0) return null;

  // Order by the server clock, then by the client's sequence number as a
  // tie-break. Two events in the same flush share a received_at, and only the
  // client knows which came first.
  const ordered = [...events].sort((a, b) => {
    const byTime = Date.parse(a.received_at) - Date.parse(b.received_at);
    return byTime !== 0 ? byTime : a.seq - b.seq;
  });

  const opened = ordered.find((e) => e.event_name === "episode_opened") ?? ordered[0];
  const closed = [...ordered].reverse().find((e) => e.event_name === "episode_closed") ?? null;

  const verdicts: VerdictEntry[] = [];
  const diffClasses: DiffClass[] = [];
  let submissions = 0;
  let runs = 0;
  let selfTests = 0;
  let statementRevisits = 0;
  let statementRevisitsAfterFailure = 0;
  let interventionCount = 0;
  let maxAssistance = -1;
  let solutionRevealed = false;
  let resumeCount = 0;
  let language: string | null = null;
  let skillId: string | null = null;
  const attributions: AttributionEntry[] = [];

  for (const event of ordered) {
    const p = event.payload;
    if (!language) language = str(p, "language");
    if (!skillId) skillId = str(p, "skill_id");

    switch (event.event_name) {
      case "episode_resumed":
        resumeCount += 1;
        break;
      case "statement_revisited":
        statementRevisits += 1;
        if (str(p, "revisit_after")) statementRevisitsAfterFailure += 1;
        break;
      case "code_diff_classified": {
        const cls = str(p, "diff_class");
        if (cls) diffClasses.push(cls as DiffClass);
        break;
      }
      case "test_case_authored":
        selfTests += 1;
        break;
      case "run_executed":
        runs += 1;
        break;
      case "verdict_received": {
        const verdict = str(p, "verdict");
        if (verdict) {
          submissions += 1;
          const testsPassed = num(p, "tests_passed");
          const previousPassed = lastReportedTestsPassed(verdicts);
          verdicts.push({
            verdict: verdict as LearningVerdict,
            tests_passed: testsPassed,
            tests_total: num(p, "tests_total"),
            failing_test: num(p, "failing_test_index"),
            progression_delta:
              testsPassed !== null && previousPassed !== null
                ? testsPassed - previousPassed
                : null,
            at: event.received_at,
          });
        }
        break;
      }
      case "assistance_delivered": {
        interventionCount += 1;
        const level = num(p, "level");
        if (level !== null) maxAssistance = Math.max(maxAssistance, level);
        break;
      }
      case "failure_attributed": {
        const failureClass = str(p, "failure_class");
        if (failureClass) {
          attributions.push({
            failure_class: failureClass,
            attribution_source: str(p, "attribution_source") ?? "unknown",
            confidence: num(p, "confidence") ?? 0,
            reason: str(p, "attribution_reason"),
            at: event.received_at,
          });
        }
        break;
      }
      case "solution_revealed":
        solutionRevealed = true;
        break;
      default:
        break;
    }
  }

  const closeReason = closed ? (str(closed.payload, "close_reason") as CloseReason | null) : null;
  const accepted = verdicts.some((v) => v.verdict === "accepted");

  let outcome: ReducedEpisode["outcome"] = "in_progress";
  if (accepted) outcome = "accepted";
  else if (solutionRevealed) outcome = "solution_revealed";
  else if (closeReason === "expired") outcome = "expired";
  else if (closed) outcome = "abandoned";

  const activeSeconds = activeTime(ordered);

  return {
    task_ref: str(opened.payload, "task_ref") ?? "unknown",
    task_kind: str(opened.payload, "task_kind") ?? "cp_problem",
    opened_at: opened.received_at,
    closed_at: closed ? closed.received_at : null,
    active_seconds: activeSeconds,
    resume_count: resumeCount,
    outcome,
    verdict_sequence: verdicts,
    diff_class_sequence: diffClasses,
    submissions,
    runs,
    self_authored_tests: selfTests,
    statement_revisits: statementRevisits,
    statement_revisits_after_failure: statementRevisitsAfterFailure,
    language,
    skill_id: skillId,
    max_assistance_level: maxAssistance,
    intervention_count: interventionCount,
    solution_revealed: solutionRevealed,
    independence_weight: independenceWeight(maxAssistance, solutionRevealed),
    struggle_class: classifyStruggle(ordered, verdicts, diffClasses, maxAssistance),
    attributions,
    attributed_failures: attributions.filter(
      (entry) => entry.failure_class !== "unattributed_failure"
    ).length,
    event_count: ordered.length,
    reducer_version: REDUCER_VERSION,
  };
}

/**
 * The most recent attempt that actually reported a count.
 *
 * Skips attempts the judge could not measure rather than treating them as
 * zero, so an outage in the middle of a session does not show up as the
 * learner losing every test they had passed.
 */
function lastReportedTestsPassed(verdicts: readonly VerdictEntry[]): number | null {
  for (let i = verdicts.length - 1; i >= 0; i -= 1) {
    if (verdicts[i].tests_passed !== null) return verdicts[i].tests_passed;
  }
  return null;
}

/**
 * Time actually spent on the task.
 *
 * Gaps above the idle ceiling are excluded rather than clamped. A tab left
 * open overnight really did span eight hours, but reporting that as
 * time-on-task would make every median meaningless — and clamping it to ten
 * minutes would silently assert ten minutes of work that never happened.
 */
function activeTime(ordered: readonly ReducibleEvent[]): number {
  let total = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    const gap = (Date.parse(ordered[i].received_at) - Date.parse(ordered[i - 1].received_at)) / 1000;
    if (Number.isFinite(gap) && gap > 0 && gap <= IDLE_CEILING_SECONDS) total += gap;
  }
  return Math.round(total);
}

// ─── Struggle ────────────────────────────────────────────────────────────────

/**
 * Which of five situations this episode was.
 *
 * The distinction that earns its keep is `productive_struggle` versus
 * `thrash`. Both look identical from the outside — a learner failing
 * repeatedly for twenty minutes — and they call for opposite responses.
 * Struggle is productive while the learner is still generating new
 * information: changing approach, getting further, writing their own tests.
 * It stops being productive when the edits repeat and the verdict does not
 * move.
 *
 * Time alone never decides this. Twenty minutes of productive struggle is the
 * product working; four minutes of thrashing is not.
 */
export function classifyStruggle(
  ordered: readonly ReducibleEvent[],
  verdicts: readonly VerdictEntry[],
  diffClasses: readonly DiffClass[],
  maxAssistance: number
): StruggleClass | null {
  if (ordered.length <= 1) return null;

  const failures = verdicts.filter((v) => v.verdict !== "accepted").length;
  const meaningfulEdits = diffClasses.filter(
    (cls) => cls !== "cosmetic" && cls !== "unknown"
  ).length;

  // Edits made in RESPONSE to a verdict, which is the only window in which
  // "are they still trying things?" is a meaningful question. Counting the
  // whole episode included the learner's first authorship and so read three
  // identical failures with nothing but comment edits between them as active
  // problem-solving.
  const editsAfterFirstVerdict = countMeaningfulEditsAfterFirstVerdict(ordered);

  // Walked away: a long silence immediately before the close.
  const last = ordered[ordered.length - 1];
  if (last.event_name === "episode_closed" && ordered.length >= 2) {
    const previous = ordered[ordered.length - 2];
    const silence = (Date.parse(last.received_at) - Date.parse(previous.received_at)) / 1000;
    if (silence >= DISENGAGE_SECONDS) return "disengaged";
  }

  // Nobody submitted anything.
  //
  // This used to fall into `flow`, which read an episode where a learner typed
  // the template, stared at it for eight minutes and left as the product
  // working perfectly. `flow` is a claim about succeeding easily and cannot be
  // made about someone who never produced a verdict.
  if (verdicts.length === 0) {
    if (meaningfulEdits === 0) {
      return longestGap(ordered) >= STUCK_SECONDS ? "stuck" : "disengaged";
    }
    return "productive_struggle";
  }

  if (failures === 0) return "flow";

  // Stagnation: the judge keeps saying the same thing.
  //
  // This is the real signature of unproductive struggle, and it only became
  // observable when the practice judge started returning per-test counts. The
  // previous rule looked at edit classes alone and missed the case the replays
  // were built around — a learner changing two things at once, over and over,
  // while the verdict never moved off test 3.
  if (isStagnant(verdicts)) {
    // No real edits between identical failures means they are not trying
    // things, they are out of ideas. Different problem, different response:
    // thrashing wants an interrupt, being out of ideas wants an explanation.
    return editsAfterFirstVerdict === 0 ? "stuck" : "thrash";
  }

  // Long stretches with nothing above a cosmetic edit.
  const meaningful = ordered.filter(
    (e) =>
      (e.event_name === "code_diff_classified" &&
        e.payload.diff_class !== "cosmetic" &&
        e.payload.diff_class !== "unknown") ||
      e.event_name === "run_executed" ||
      e.event_name === "verdict_received"
  );
  if (longestGap(meaningful.length > 0 ? meaningful : ordered) >= STUCK_SECONDS) return "stuck";

  // Still generating new information: the target state.
  if (progressionImproving(verdicts) || meaningfulEdits > 0 || maxAssistance < 0) {
    return "productive_struggle";
  }

  return "stuck";
}

/**
 * Meaningful edits made after the first verdict came back.
 *
 * Cosmetic and unknown edits do not count, and neither does anything before
 * the first submission — writing the initial solution is not a response to
 * feedback that had not arrived yet.
 */
function countMeaningfulEditsAfterFirstVerdict(ordered: readonly ReducibleEvent[]): number {
  let seenVerdict = false;
  let count = 0;
  for (const event of ordered) {
    if (event.event_name === "verdict_received") {
      seenVerdict = true;
      continue;
    }
    if (!seenVerdict || event.event_name !== "code_diff_classified") continue;
    const cls = event.payload.diff_class;
    if (cls !== "cosmetic" && cls !== "unknown") count += 1;
  }
  return count;
}

/**
 * Has the judge said the same thing THRASH_RUN times in a row?
 *
 * "The same thing" means the same verdict AND the same progress — identical
 * failing test where the judge reports one, otherwise identical passing count.
 * Two wrong answers that fail at different tests are progress of a kind; two
 * that die on test 3 both times are not.
 *
 * Falls back to comparing verdicts alone when the judge reported no counts at
 * all, which is deliberately weak: an outage must not manufacture a diagnosis.
 */
function isStagnant(verdicts: readonly VerdictEntry[]): boolean {
  if (verdicts.length < THRASH_RUN) return false;

  const signature = (v: VerdictEntry): string => {
    if (v.failing_test !== null) return `${v.verdict}@${v.failing_test}`;
    if (v.tests_passed !== null) return `${v.verdict}#${v.tests_passed}`;
    return v.verdict;
  };

  let run = 1;
  for (let i = 1; i < verdicts.length; i += 1) {
    if (verdicts[i].verdict === "accepted") return false;
    if (signature(verdicts[i]) === signature(verdicts[i - 1])) {
      run += 1;
      if (run >= THRASH_RUN) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

/** Did the number of passing tests trend upward across attempts? */
function progressionImproving(verdicts: readonly VerdictEntry[]): boolean {
  const withCounts = verdicts.filter((v) => typeof v.tests_passed === "number");
  if (withCounts.length < 2) return false;
  const first = withCounts[0].tests_passed ?? 0;
  const last = withCounts[withCounts.length - 1].tests_passed ?? 0;
  return last > first;
}

function longestGap(ordered: readonly ReducibleEvent[]): number {
  let longest = 0;
  for (let i = 1; i < ordered.length; i += 1) {
    const gap = (Date.parse(ordered[i].received_at) - Date.parse(ordered[i - 1].received_at)) / 1000;
    if (Number.isFinite(gap) && gap > longest && gap <= IDLE_CEILING_SECONDS * 3) longest = gap;
  }
  return longest;
}
