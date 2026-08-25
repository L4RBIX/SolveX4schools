/**
 * What can the pipeline actually tell about a learner?
 *
 * Runs the learner fixtures through the real reducer and outcome attribution
 * and reports, per category, whether the signal is DERIVABLE — meaning some
 * function of the events the pipeline stores could answer it — and whether it
 * is IMPLEMENTED — meaning something in the codebase actually computes it.
 *
 * Those two are very different and the gap between them is the finding. The
 * episode reducer is thorough; there is no layer above it, so every question
 * that spans episodes ("does this learner repeat this mistake?", "can they
 * finish anything without a level-3 hint?") is derivable and unimplemented.
 *
 * Nothing here is a measurement of learners. The inputs are fixtures with known
 * ground truth, so a percentage answers "does our code notice?" and nothing
 * else.
 */

import { buildEpisode, type BuiltEpisode } from "./replayHarness";
import {
  ARCHETYPE_BY_SUBJECT,
  LEARNER_SCENARIOS,
  type LearnerArchetype,
  type LearnerScenario,
} from "./learnerScenarios";

// ─── Episode-level coverage ──────────────────────────────────────────────────

export interface AttributionCoverage {
  failedSubmissions: number;
  attributionEvents: number;
  attributed: number;
  unattributed: number;
  attributedShare: number;
  byFailureClass: Record<string, number>;
  byUnknownReason: Record<string, number>;
  /** Failed submissions with no `failure_attributed` event at all. */
  unexplainedSubmissions: number;
}

export function attributionCoverage(built: readonly BuiltEpisode[]): AttributionCoverage {
  let failedSubmissions = 0;
  let attributionEvents = 0;
  let attributed = 0;
  let unattributed = 0;
  const byFailureClass: Record<string, number> = {};
  const byUnknownReason: Record<string, number> = {};

  for (const episode of built) {
    for (const event of episode.events) {
      if (event.event_name === "verdict_received" && event.payload.verdict !== "accepted") {
        failedSubmissions += 1;
      }
      if (event.event_name !== "failure_attributed") continue;
      attributionEvents += 1;
      const failureClass = String(event.payload.failure_class ?? "unattributed_failure");
      byFailureClass[failureClass] = (byFailureClass[failureClass] ?? 0) + 1;
      if (failureClass === "unattributed_failure") {
        unattributed += 1;
        const reason = String(event.payload.attribution_reason ?? "unspecified");
        byUnknownReason[reason] = (byUnknownReason[reason] ?? 0) + 1;
      } else {
        attributed += 1;
      }
    }
  }

  return {
    failedSubmissions,
    attributionEvents,
    attributed,
    unattributed,
    attributedShare: failedSubmissions ? attributed / failedSubmissions : 0,
    byFailureClass,
    byUnknownReason,
    unexplainedSubmissions: Math.max(0, failedSubmissions - attributionEvents),
  };
}

// ─── Learner-level signals ───────────────────────────────────────────────────
//
// Everything below is computed HERE, in the analyzer, from episode output. That
// is the point: none of it exists anywhere in the shipped pipeline, and writing
// it in a measurement file is how we find out whether the events already carry
// enough to support it.

export interface LearnerSignals {
  subject: string;
  archetype: LearnerArchetype;
  episodes: number;

  /** Distinct tasks, so "ten attempts" is not confused with "ten problems". */
  tasks: number;
  accepted: number;
  abandoned: number;

  /** Episodes ending accepted with no assistance above level -1. */
  soloSolves: number;
  /** Share of accepted episodes that needed a hint at level 2 or above. */
  hintDependency: number;
  /** Median seconds from the first failing verdict to the first hint request. */
  medianSecondsToFirstHint: number | null;

  /** Accepted episodes whose winning edit came straight off a code-bearing hint. */
  transferSolves: number;

  /** The most repeated (failure class, skill) pair, and how often. */
  topRepeatedFailure: { key: string; count: number } | null;
  /** Same, restricted to classes that actually name a cause. */
  topRepeatedAttributed: { key: string; count: number } | null;

  struggleCounts: Record<string, number>;
  failureClassCounts: Record<string, number>;
  /** Raw verdict mix. Needed because most failures collapse to one class. */
  verdictCounts: Record<string, number>;
  failedSubmissions: number;
  /** Episodes where the learner went back to the statement after failing. */
  episodesWithStatementRevisit: number;
  /** Attempts where the passing-test count went UP against the previous one. */
  positiveProgressions: number;
  /** Attempts where a progression delta could be computed at all. */
  measuredProgressions: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function learnerSignals(
  scenarios: readonly LearnerScenario[],
  built: readonly BuiltEpisode[]
): LearnerSignals[] {
  const bySubject = new Map<string, { scenario: LearnerScenario; episode: BuiltEpisode }[]>();
  scenarios.forEach((scenario, index) => {
    const list = bySubject.get(scenario.subject) ?? [];
    list.push({ scenario, episode: built[index] });
    bySubject.set(scenario.subject, list);
  });

  const out: LearnerSignals[] = [];
  for (const [subject, rows] of bySubject) {
    const struggleCounts: Record<string, number> = {};
    const verdictCounts: Record<string, number> = {};
    let failedSubmissions = 0;
    let episodesWithStatementRevisit = 0;
    let positiveProgressions = 0;
    let measuredProgressions = 0;
    const failureClassCounts: Record<string, number> = {};
    const repeated: Record<string, number> = {};
    const repeatedAttributed: Record<string, number> = {};
    const secondsToHint: number[] = [];

    let accepted = 0;
    let abandoned = 0;
    let soloSolves = 0;
    let assistedSolves = 0;
    let transferSolves = 0;

    for (const { scenario, episode } of rows) {
      const reduced = episode.episode;
      if (!reduced) continue;

      if (reduced.outcome === "accepted") {
        accepted += 1;
        if (reduced.max_assistance_level < 0) soloSolves += 1;
        if (reduced.max_assistance_level >= 2) assistedSolves += 1;
      }
      if (reduced.outcome === "abandoned") abandoned += 1;

      // Only post-failure revisits. A revisit with no verdict behind it is
      // someone reading the problem, which every learner does.
      if (reduced.statement_revisits_after_failure > 0) episodesWithStatementRevisit += 1;

      for (const entry of reduced.verdict_sequence) {
        verdictCounts[entry.verdict] = (verdictCounts[entry.verdict] ?? 0) + 1;
        if (entry.verdict !== "accepted") failedSubmissions += 1;
        if (entry.progression_delta !== null) {
          measuredProgressions += 1;
          if (entry.progression_delta > 0) positiveProgressions += 1;
        }
      }

      const struggle = reduced.struggle_class ?? "none";
      struggleCounts[struggle] = (struggleCounts[struggle] ?? 0) + 1;

      for (const attribution of reduced.attributions) {
        failureClassCounts[attribution.failure_class] =
          (failureClassCounts[attribution.failure_class] ?? 0) + 1;
        const key = `${attribution.failure_class}@${scenario.skill}`;
        repeated[key] = (repeated[key] ?? 0) + 1;
        if (attribution.failure_class !== "unattributed_failure") {
          repeatedAttributed[key] = (repeatedAttributed[key] ?? 0) + 1;
        }
      }

      for (const outcome of episode.outcomes) {
        if (outcome.outcome === "resolved_by_transfer") transferSolves += 1;
      }

      // Time from the first failing verdict to the first hint request. The
      // ledger already stores `pre_active_seconds` per intervention, so this is
      // derivable from data the pipeline holds today.
      const firstFail = episode.events.find(
        (e) => e.event_name === "verdict_received" && e.payload.verdict !== "accepted"
      );
      const firstHint = episode.events.find((e) => e.event_name === "assistance_requested");
      if (firstFail && firstHint) {
        const gap = (Date.parse(firstHint.received_at) - Date.parse(firstFail.received_at)) / 1000;
        if (gap >= 0) secondsToHint.push(gap);
      }
    }

    const top = (counts: Record<string, number>) => {
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return entries.length ? { key: entries[0][0], count: entries[0][1] } : null;
    };

    out.push({
      subject,
      archetype: ARCHETYPE_BY_SUBJECT[subject],
      episodes: rows.length,
      tasks: new Set(rows.map((r) => r.scenario.taskRef)).size,
      accepted,
      abandoned,
      soloSolves,
      hintDependency: accepted ? assistedSolves / accepted : 0,
      medianSecondsToFirstHint: median(secondsToHint),
      transferSolves,
      topRepeatedFailure: top(repeated),
      topRepeatedAttributed: top(repeatedAttributed),
      struggleCounts,
      failureClassCounts,
      verdictCounts,
      failedSubmissions,
      episodesWithStatementRevisit,
      positiveProgressions,
      measuredProgressions,
    });
  }
  return out;
}

// ─── Detection ───────────────────────────────────────────────────────────────
//
// Can the signals above distinguish the archetype we know each learner has?
// A detector that fires for everybody is not a detector.

export interface DetectionResult {
  archetype: LearnerArchetype;
  detector: string;
  /** Subjects the detector fired on. */
  firedOn: string[];
  /** True when it fired on exactly the learner it describes. */
  precise: boolean;
}

const DETECTORS: {
  archetype: LearnerArchetype;
  detector: string;
  fires: (signals: LearnerSignals) => boolean;
}[] = [
  {
    archetype: "boundary_blind",
    // Repetition of `unattributed_failure` is not a repeated mistake: it is the
    // same absence of knowledge, repeated. Only attributed classes count.
    detector: "same ATTRIBUTED (failure_class, skill) pair >= 5 times",
    fires: (s) => (s.topRepeatedAttributed?.count ?? 0) >= 5,
  },
  {
    archetype: "hint_dependent",
    // The transfer clause is not padding: a copier is also hint-dependent, so
    // without it this fires on both and cannot tell them apart. They need
    // different responses -- one needs the ladder slowed down, the other needs
    // the code withheld.
    detector: "hint dependency > 0.8, fast time-to-hint, and NOT copying",
    fires: (s) =>
      s.hintDependency > 0.8 &&
      (s.medianSecondsToFirstHint ?? 999) < 60 &&
      s.transferSolves < s.episodes / 2,
  },
  {
    archetype: "solution_copier",
    detector: "resolved_by_transfer on >= half of episodes",
    fires: (s) => s.transferSolves >= s.episodes / 2,
  },
  {
    archetype: "complexity_naive",
    // Reads the verdict mix, not the attribution: with no runtime gate most
    // timeouts land in `unattributed_failure` and are indistinguishable from
    // wrong answers by class alone.
    detector: "time_limit_exceeded is the majority of failed submissions",
    fires: (s) =>
      s.failedSubmissions > 0 &&
      (s.verdictCounts.time_limit_exceeded ?? 0) / s.failedSubmissions > 0.5,
  },
  {
    archetype: "compile_fighter",
    detector: "compile_error is the most common attributed class",
    fires: (s) => (s.failureClassCounts.compile_error ?? 0) >= 4,
  },
  {
    archetype: "edge_case_misser",
    detector: "edge_case_handling repeats",
    fires: (s) => (s.failureClassCounts.edge_case_handling ?? 0) >= 4,
  },
  {
    archetype: "comprehension_gap",
    // `statement_revisited` fires on scroll after a failed submit, and the
    // reducer already counts it per episode. Aggregating it per learner is the
    // missing step, and it is one line.
    detector: "statement revisit after failure on >= 80% of episodes",
    fires: (s) => s.episodesWithStatementRevisit >= s.episodes * 0.8,
  },
  {
    archetype: "steady_improver",
    // `productive_struggle` is the reducer's fallthrough and covers most
    // episodes, so it cannot carry this on its own. What actually distinguishes
    // improvement is the passing-test count climbing between attempts, which
    // `progression_delta` measures directly.
    detector: "most measured attempts show a positive progression delta",
    fires: (s) =>
      s.measuredProgressions >= 5 && s.positiveProgressions / s.measuredProgressions > 0.5,
  },
  {
    archetype: "early_abandoner",
    detector: "abandonment on most episodes with no accepted",
    fires: (s) => s.abandoned >= s.episodes / 2 && s.accepted === 0,
  },
  {
    archetype: "fluent",
    // "Solved everything unaided" is not fluency if they fought the compiler to
    // get there. The failure count is the half that was missing.
    detector: "solo solve on every episode AND no failed submissions",
    fires: (s) => s.soloSolves === s.episodes && s.failedSubmissions === 0,
  },
];

export function runDetectors(signals: readonly LearnerSignals[]): DetectionResult[] {
  return DETECTORS.map(({ archetype, detector, fires }) => {
    const firedOn = signals.filter(fires).map((s) => s.subject);
    const target = signals.find((s) => s.archetype === archetype)?.subject;
    return {
      archetype,
      detector,
      firedOn,
      precise: firedOn.length === 1 && firedOn[0] === target,
    };
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export interface CoverageAnalysis {
  scenarios: number;
  subjects: number;
  attribution: AttributionCoverage;
  signals: LearnerSignals[];
  detection: DetectionResult[];
}

export function analyzeCoverage(
  scenarios: readonly LearnerScenario[] = LEARNER_SCENARIOS
): CoverageAnalysis {
  const built = scenarios.map(buildEpisode);
  const signals = learnerSignals(scenarios, built);
  return {
    scenarios: scenarios.length,
    subjects: signals.length,
    attribution: attributionCoverage(built),
    signals,
    detection: runDetectors(signals),
  };
}
