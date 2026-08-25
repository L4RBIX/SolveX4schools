/**
 * Runs the replay traces through the real pipeline.
 *
 * Nothing here mocks the classifier, the reducer, or outcome attribution — the
 * whole reason the traces exist is to find out where those are blind, and a
 * mock would only reflect what we already assume.
 *
 * The builder deliberately reproduces the CLIENT's emission rules, including
 * the ones that lose information: the 5-second code-snapshot throttle and the
 * 45-second idle threshold. A harness that emitted a perfect event stream would
 * hide exactly the gaps we are looking for.
 */

import { classifyDiff, hashCode } from "../../packages/learning-intelligence-core/src/diff";
import {
  editDistanceBucket,
  secondsBucket,
  type IdleFollowedBy,
} from "../../packages/learning-contracts/src/events";
import {
  reduceEpisode,
  type ReducibleEvent,
  type ReducedEpisode,
} from "../../packages/learning-intelligence-core/src/episode";
import { buildInterventions, type InterventionRow } from "../../packages/learning-intelligence-core/src/interventions";
import {
  computeInterventionOutcome,
  type ComputedOutcome,
} from "../../packages/learning-intelligence-core/src/interventionOutcome";
import type { ReplayTrace, TraceStep } from "./replayTraces";
import { STARTER_TEMPLATES } from "../../packages/learning-intelligence-core/src/starterTemplates";

/** Mirrors client.ts. */
const IDLE_THRESHOLD_SECONDS = 45;
const CODE_MIN_INTERVAL_SECONDS = 5;

const EPOCH = Date.parse("2026-08-24T09:00:00.000Z");

export interface BuiltEpisode {
  trace: ReplayTrace;
  events: ReducibleEvent[];
  episode: ReducedEpisode | null;
  interventions: InterventionRow[];
  outcomes: ComputedOutcome[];
  /** Snapshots dropped by the client-side throttle. */
  droppedSnapshots: number;
}

function iso(seconds: number): string {
  return new Date(EPOCH + seconds * 1000).toISOString();
}

/**
 * Turn a trace into the event stream the ingest route would have stored.
 *
 * Diff classes are computed here by the same `classifyDiff` the route calls,
 * against the previous *stored* snapshot — so a throttled edit genuinely
 * disappears, exactly as it does in production.
 */
export function buildEpisode(trace: ReplayTrace): BuiltEpisode {
  const events: ReducibleEvent[] = [];
  let seq = 0;
  let lastEventAt = 0;
  let lastCodeAt = -Infinity;
  // The baseline is the starter template the editor loads, matching what the
  // ingest route falls back to. A learner never snapshots an untouched
  // template, so starting from null here would invent an `unknown` first edit
  // that production does not have.
  let previousCode: string | null =
    STARTER_TEMPLATES[trace.language] ?? null;
  let lastVerdict: string | null = null;
  let droppedSnapshots = 0;
  let interventionCounter = 0;

  const push = (
    name: string,
    at: number,
    payload: Record<string, string | number | boolean> = {}
  ) => {
    events.push({
      event_name: name,
      occurred_at: iso(at),
      received_at: iso(at),
      seq: seq++,
      payload,
    });
    lastEventAt = at;
  };

  /** The client only emits a gap once it resolves into an action. */
  const maybeGap = (at: number, followedBy: IdleFollowedBy) => {
    const gap = at - lastEventAt;
    if (gap < IDLE_THRESHOLD_SECONDS) return;
    push("idle_gap", at, {
      gap_seconds: Math.round(gap),
      seconds_bucket: secondsBucket(gap),
      followed_by: followedBy,
    });
  };

  push("episode_opened", 0, {
    task_ref: trace.taskRef,
    task_kind: "cp_problem",
    language: trace.language,
  });

  for (const step of trace.steps) {
    applyStep(step, trace, {
      at: step.at,
      push,
      maybeGap,
      state: {
        get previousCode() {
          return previousCode;
        },
        set previousCode(value: string | null) {
          previousCode = value;
        },
        get lastCodeAt() {
          return lastCodeAt;
        },
        set lastCodeAt(value: number) {
          lastCodeAt = value;
        },
        get lastVerdict() {
          return lastVerdict;
        },
        set lastVerdict(value: string | null) {
          lastVerdict = value;
        },
        nextInterventionId: () => `iv-${trace.id}-${++interventionCounter}`,
        dropSnapshot: () => {
          droppedSnapshots += 1;
        },
      },
    });
  }

  const episode = reduceEpisode(events);
  const interventions = buildInterventions(trace.id, "subject-internal", events);
  const outcomes = interventions.map((intervention) =>
    computeInterventionOutcome(
      {
        intervention_id: intervention.intervention_id,
        episode_id: trace.id,
        level: intervention.level,
        contains_code: intervention.contains_code,
        delivered_at: intervention.delivered_at,
        pre_tests_passed: intervention.pre_tests_passed,
      },
      events
    )
  );

  return { trace, events, episode, interventions, outcomes, droppedSnapshots };
}

interface StepContext {
  at: number;
  push: (name: string, at: number, payload?: Record<string, string | number | boolean>) => void;
  maybeGap: (at: number, followedBy: IdleFollowedBy) => void;
  state: {
    previousCode: string | null;
    lastCodeAt: number;
    lastVerdict: string | null;
    nextInterventionId: () => string;
    dropSnapshot: () => void;
  };
}

function applyStep(step: TraceStep, trace: ReplayTrace, ctx: StepContext): void {
  const { at, push, maybeGap, state } = ctx;

  if (step.code !== undefined) {
    if (at - state.lastCodeAt < CODE_MIN_INTERVAL_SECONDS) {
      // Throttled away by the client. Recorded so the harness can report how
      // much of the edit history never leaves the browser.
      state.dropSnapshot();
      state.previousCode = step.code;
      return;
    }
    maybeGap(at, "local");
    const result = classifyDiff(state.previousCode, step.code, trace.language);
    push("code_diff_classified", at, {
      language: trace.language,
      diff_class: result.diffClass,
      lines_added: result.linesAdded,
      lines_removed: result.linesRemoved,
      edit_distance_bucket: editDistanceBucket(result.editDistance),
      blob_hash: hashCode(step.code),
      ...(state.lastVerdict ? { since_verdict: state.lastVerdict } : {}),
    });
    state.previousCode = step.code;
    state.lastCodeAt = at;
    return;
  }

  if (step.run) {
    maybeGap(at, "run");
    push("run_executed", at, {
      language: trace.language,
      case_count: step.run.cases,
      is_custom_input: step.run.custom === true,
    });
    return;
  }

  if (step.submit) {
    const { verdict, testsPassed, testsTotal, failingTest } = step.submit;
    push("verdict_received", at, {
      verdict,
      language: trace.language,
      ...(typeof testsPassed === "number" ? { tests_passed: testsPassed } : {}),
      ...(typeof testsTotal === "number" ? { tests_total: testsTotal } : {}),
      ...(typeof failingTest === "number" ? { failing_test_index: failingTest } : {}),
    });
    state.lastVerdict = verdict;
    return;
  }

  if (step.hint) {
    const id = state.nextInterventionId();
    maybeGap(at, "hint");
    push("assistance_requested", at, {
      intervention_id: id,
      requested_level: step.hint.requestedLevel ?? step.hint.level,
      granted_level: step.hint.level,
      trigger: "learner_requested",
      ...(step.hint.mode ? { mode: step.hint.mode } : {}),
    });
    push("assistance_delivered", at + 3, {
      intervention_id: id,
      level: step.hint.level,
      contains_code: step.hint.containsCode === true,
      ...(step.hint.evidenceType ? { evidence_type: step.hint.evidenceType } : {}),
      ...(step.hint.mode ? { mode: step.hint.mode } : {}),
      content_len: step.hint.containsCode ? 640 : 180,
    });
    return;
  }

  if (step.authoredTest) {
    push("test_case_authored", at, {
      derived_from: "invented",
      input_size_class: step.authoredTest.size <= 16 ? "tiny" : "small",
      targets_edge: step.authoredTest.edge,
      language: trace.language,
    });
    return;
  }

  if (step.statementRevisit) {
    push("statement_revisited", at, {
      is_revisit: true,
      ...(step.statementRevisit.after ? { revisit_after: step.statementRevisit.after } : {}),
    });
    return;
  }

  if (step.attribution) {
    // Mirrors what the ingest route writes from a verified attestation: the
    // payload is built from the signed statement, never from the client.
    push("failure_attributed", at, {
      failure_class: step.attribution.failureClass,
      attribution_source: step.attribution.source,
      confidence: step.attribution.confidence,
      attribution_version: 1,
      language: trace.language,
      ...(step.attribution.reason ? { attribution_reason: step.attribution.reason } : {}),
    });
    return;
  }

  if (step.reveal) {
    push("solution_revealed", at, { reveal_scope: step.reveal });
    return;
  }

  if (step.close) {
    push("episode_closed", at, { close_reason: step.close });
  }
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface TraceFinding {
  traceId: string;
  kind: "struggle_mismatch" | "outcome_mismatch" | "hint_outcome_mismatch";
  expected: string;
  actual: string;
}

export interface ReplayReport {
  built: BuiltEpisode[];
  findings: TraceFinding[];
  eventCounts: Record<string, number>;
  diffClassCounts: Record<string, number>;
  struggleCounts: Record<string, number>;
  outcomeCounts: Record<string, number>;
  hintOutcomeCounts: Record<string, number>;
  failureClassCounts: Record<string, number>;
  droppedSnapshots: number;
}

export function runReplayReport(traces: readonly ReplayTrace[]): ReplayReport {
  const built = traces.map(buildEpisode);
  const findings: TraceFinding[] = [];

  const eventCounts: Record<string, number> = {};
  const diffClassCounts: Record<string, number> = {};
  const struggleCounts: Record<string, number> = {};
  const outcomeCounts: Record<string, number> = {};
  const hintOutcomeCounts: Record<string, number> = {};
  const failureClassCounts: Record<string, number> = {};
  let droppedSnapshots = 0;

  for (const item of built) {
    droppedSnapshots += item.droppedSnapshots;

    for (const event of item.events) {
      eventCounts[event.event_name] = (eventCounts[event.event_name] ?? 0) + 1;
      if (event.event_name === "code_diff_classified") {
        const cls = String(event.payload.diff_class ?? "unknown");
        diffClassCounts[cls] = (diffClassCounts[cls] ?? 0) + 1;
      }
      if (event.event_name === "failure_attributed") {
        const cls = String(event.payload.failure_class ?? "unattributed_failure");
        failureClassCounts[cls] = (failureClassCounts[cls] ?? 0) + 1;
      }
    }

    const struggle = item.episode?.struggle_class ?? "none";
    struggleCounts[struggle] = (struggleCounts[struggle] ?? 0) + 1;

    const outcome = item.episode?.outcome ?? "none";
    outcomeCounts[outcome] = (outcomeCounts[outcome] ?? 0) + 1;

    for (const computed of item.outcomes) {
      hintOutcomeCounts[computed.outcome] = (hintOutcomeCounts[computed.outcome] ?? 0) + 1;
    }

    if (item.trace.wantStruggle && struggle !== item.trace.wantStruggle) {
      findings.push({
        traceId: item.trace.id,
        kind: "struggle_mismatch",
        expected: item.trace.wantStruggle,
        actual: struggle,
      });
    }
    if (item.trace.wantOutcome && outcome !== item.trace.wantOutcome) {
      findings.push({
        traceId: item.trace.id,
        kind: "outcome_mismatch",
        expected: item.trace.wantOutcome,
        actual: outcome,
      });
    }
    if (item.trace.wantHintOutcome) {
      const actual = item.outcomes[0]?.outcome ?? "none";
      if (actual !== item.trace.wantHintOutcome) {
        findings.push({
          traceId: item.trace.id,
          kind: "hint_outcome_mismatch",
          expected: item.trace.wantHintOutcome,
          actual,
        });
      }
    }
  }

  return {
    built,
    findings,
    eventCounts,
    diffClassCounts,
    struggleCounts,
    outcomeCounts,
    hintOutcomeCounts,
    failureClassCounts,
    droppedSnapshots,
  };
}
