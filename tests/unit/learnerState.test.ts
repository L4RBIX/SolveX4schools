import { describe, expect, it } from "vitest";

import type { ReducedEpisode } from "../../packages/learning-intelligence-core/src/episode";
import type { ComputedOutcome, InterventionOutcome } from "../../packages/learning-intelligence-core/src/interventionOutcome";
import {
  ACTIONABLE_CONFIDENCE,
  buildLearnerState,
  hintEffectiveness,
  observationConfidence,
  type EpisodeInput,
} from "../../packages/learning-intelligence-core/src/learnerState";
import { analyzeCoverage } from "../golden-fixtures/coverageAnalysis";
import { buildEpisode } from "../golden-fixtures/replayHarness";
import { LEARNER_SCENARIOS } from "../golden-fixtures/learnerScenarios";

/**
 * The rules under test are the honesty rules, not the arithmetic.
 *
 * A misconception must come from an observed failure class; confidence must
 * only rise from counted evidence, and must be zero when there is none; and an
 * unexplained failure must contribute nothing at all rather than a little.
 */

const BASE_EPISODE: ReducedEpisode = {
  task_ref: "solvex:1",
  task_kind: "cp_problem",
  opened_at: "2026-08-24T10:00:00.000Z",
  closed_at: "2026-08-24T10:10:00.000Z",
  active_seconds: 600,
  resume_count: 0,
  outcome: "accepted",
  verdict_sequence: [],
  diff_class_sequence: [],
  submissions: 0,
  runs: 0,
  self_authored_tests: 0,
  statement_revisits: 0,
  statement_revisits_after_failure: 0,
  language: "cpp17",
  skill_id: "binary_search",
  max_assistance_level: -1,
  intervention_count: 0,
  solution_revealed: false,
  independence_weight: 1,
  struggle_class: "flow",
  attributions: [],
  attributed_failures: 0,
  event_count: 5,
  reducer_version: 5,
};

function episode(
  id: string,
  overrides: Partial<ReducedEpisode> = {},
  outcomes: ComputedOutcome[] = [],
  skill: string | null = "binary_search",
  taskRef = `solvex:${id}`
): EpisodeInput {
  return {
    episodeId: id,
    skill,
    taskRef,
    episode: { ...BASE_EPISODE, ...overrides },
    outcomes,
  };
}

function attributed(failureClass: string, confidence: number, at = "2026-08-24T10:05:00.000Z") {
  return { failure_class: failureClass, attribution_source: "verifier", confidence, reason: null, at };
}

function failed(count: number) {
  return Array.from({ length: count }, () => ({
    verdict: "wrong_answer" as const,
    tests_passed: 2,
    tests_total: 10,
    failing_test: 3,
    progression_delta: null,
    at: "2026-08-24T10:05:00.000Z",
  }));
}

describe("observationConfidence", () => {
  it("rises with distinct episodes and never reaches certainty", () => {
    const p = 0.6;
    const two = observationConfidence(2, p);
    const three = observationConfidence(3, p);
    const twenty = observationConfidence(20, p);

    expect(two).toBeLessThan(three);
    expect(three).toBeLessThan(twenty);
    // Counting attributions is not running an experiment.
    expect(twenty).toBeLessThan(1);
    expect(twenty).toBeLessThanOrEqual(0.95);
  });

  it("says nothing from a single observation", () => {
    // One attributed failure is an incident, not a pattern.
    expect(observationConfidence(1, 0.95)).toBe(0);
  });

  it("lets repetition outgrow the per-failure confidence, but only with evidence", () => {
    // The bug this replaced: capping the pattern at the per-observation ceiling
    // meant a class always reported at 0.6 could never become actionable, no
    // matter how many separate episodes it appeared in.
    expect(observationConfidence(10, 0.6)).toBeGreaterThan(0.6);
    // ...and no amount of repetition manufactures confidence from nothing.
    expect(observationConfidence(50, 0)).toBe(0);
  });

  it("is zero without evidence", () => {
    expect(observationConfidence(0, 0.9)).toBe(0);
    expect(observationConfidence(5, 0)).toBe(0);
  });

  it("treats one observation as explicitly weak", () => {
    expect(observationConfidence(1, 1)).toBeLessThan(ACTIONABLE_CONFIDENCE);
  });
});

describe("buildLearnerState", () => {
  it("records a misconception only from an observed failure class", () => {
    const state = buildLearnerState("L", [
      episode("e1", {
        outcome: "abandoned",
        verdict_sequence: failed(1),
        attributions: [attributed("edge_case_handling", 0.6)],
        attributed_failures: 1,
      }),
      episode("e2", {
        outcome: "abandoned",
        verdict_sequence: failed(1),
        attributions: [attributed("edge_case_handling", 0.6)],
        attributed_failures: 1,
      }, [], "binary_search", "solvex:e2"),
    ]);

    const skill = state.skills[0];
    expect(skill.misconceptions).toHaveLength(1);
    expect(skill.misconceptions[0].failureClass).toBe("edge_case_handling");
    expect(skill.misconceptions[0].distinctEpisodes).toBe(2);
  });

  it("gives an unexplained failure no weight whatsoever", () => {
    // The rule that keeps this layer honest: thirty failures nobody could name
    // produce zero misconceptions, not a low-confidence one.
    const state = buildLearnerState("L", [
      episode("e1", {
        outcome: "abandoned",
        verdict_sequence: failed(30),
        attributions: Array.from({ length: 30 }, () =>
          ({ failure_class: "unattributed_failure", attribution_source: "judge", confidence: 0.1, reason: "no_counterexample_analysis", at: "2026-08-24T10:05:00.000Z" })
        ),
        attributed_failures: 0,
      }),
    ]);

    expect(state.skills[0].misconceptions).toEqual([]);
    expect(state.skills[0].attributedFailures).toBe(0);
    expect(state.skills[0].failures).toBe(30);
    expect(state.unattributedFailures).toBe(30);
  });

  it("does not count one thrashing session as many observations", () => {
    const many = buildLearnerState("L", [
      episode("e1", {
        outcome: "abandoned",
        verdict_sequence: failed(5),
        attributions: Array.from({ length: 5 }, () => attributed("edge_case_handling", 0.6)),
        attributed_failures: 5,
      }),
    ]);
    const observation = many.skills[0].misconceptions[0];
    expect(observation.occurrences).toBe(5);
    expect(observation.distinctEpisodes).toBe(1);
    // Confidence tracks episodes, so five resubmissions in one sitting stay weak.
    expect(observation.actionable).toBe(false);
  });

  it("does not call a skill competent when most attempts fail", () => {
    // Two solves against eight abandonments is not competence, and reading only
    // the solve count said it was.
    const inputs = [
      ...Array.from({ length: 2 }, (_, i) =>
        episode(`ok${i}`, {}, [], "binary_search", `solvex:ok${i}`)
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        episode(`bad${i}`, { outcome: "abandoned", verdict_sequence: failed(3) }, [], "binary_search", `solvex:bad${i}`)
      ),
    ];
    const state = buildLearnerState("L", inputs);
    expect(state.skills[0].soloSolved).toBe(2);
    expect(state.skills[0].level).toBe("developing");
  });

  it("separates never-measured from measured-and-weak", () => {
    const unmeasured = buildLearnerState("L", [episode("e1")]);
    expect(unmeasured.skills[0].level).toBe("unknown");

    const weak = buildLearnerState("L", [
      episode("e1", { outcome: "abandoned", verdict_sequence: failed(1) }),
      episode("e2", { outcome: "abandoned", verdict_sequence: failed(1) }, [], "binary_search", "solvex:e2"),
    ]);
    expect(weak.skills[0].level).toBe("developing");
  });

  it("credits a solve to the learner only when it was theirs", () => {
    const assisted = buildLearnerState("L", [
      episode("e1", { max_assistance_level: 3, independence_weight: 0.2 }),
      episode("e2", { max_assistance_level: 3, independence_weight: 0.2 }, [], "binary_search", "solvex:e2"),
    ]);
    expect(assisted.skills[0].soloSolved).toBe(0);
    expect(assisted.skills[0].assistedSolved).toBe(2);
    expect(assisted.skills[0].level).toBe("developing");
  });

  it("requires breadth before calling a skill strong", () => {
    const repeated = buildLearnerState(
      "L",
      Array.from({ length: 4 }, (_, i) => episode(`e${i}`, {}, [], "binary_search", "solvex:same"))
    );
    // Four solves, all on the same task. Not evidence of a transferable skill.
    expect(repeated.skills[0].distinctTasks).toBe(1);
    expect(repeated.skills[0].level).toBe("competent");

    const varied = buildLearnerState(
      "L",
      Array.from({ length: 4 }, (_, i) => episode(`e${i}`, {}, [], "binary_search", `solvex:t${i}`))
    );
    expect(varied.skills[0].level).toBe("strong");
  });

  it("attaches nothing to a skill it cannot name", () => {
    const state = buildLearnerState("L", [
      episode("e1", { intervention_count: 2 }, [], null),
    ]);
    expect(state.skills).toEqual([]);
    expect(state.assistance.interventions).toBe(2);
  });

  it("states its rationale in the same terms as its level", () => {
    const state = buildLearnerState("L", [
      episode("e1", {
        outcome: "abandoned",
        verdict_sequence: failed(3),
        attributions: [attributed("edge_case_handling", 0.9)],
        attributed_failures: 1,
      }),
      episode("e2", {
        outcome: "abandoned",
        verdict_sequence: failed(2),
        attributions: [attributed("edge_case_handling", 0.9)],
        attributed_failures: 1,
      }, [], "binary_search", "solvex:e2"),
    ]);
    const skill = state.skills[0];
    expect(skill.rationale).toContain("edge_case_handling");
    // The failures with no known cause are named, not silently dropped.
    expect(skill.rationale).toContain("no known cause");
  });
});

describe("hintEffectiveness", () => {
  const row = (level: number, outcome: InterventionOutcome) => ({ level, outcome });

  it("counts only independent resolution as success", () => {
    const report = hintEffectiveness([
      row(2, "resolved_independently"),
      row(2, "resolved_by_transfer"),
      row(2, "resolved_by_transfer"),
      row(2, "stalled"),
    ]);
    const level2 = report.byLevel[0];
    expect(level2.delivered).toBe(4);
    // Three of four reached Accepted, but only one of those was learning.
    expect(level2.successRate).toBe(0.25);
    expect(level2.resolvedByTransfer).toBe(2);
  });

  it("flags a rung most learners immediately escalate past", () => {
    const report = hintEffectiveness([
      row(0, "escalated"),
      row(0, "escalated"),
      row(0, "escalated"),
      row(0, "resolved_independently"),
    ]);
    expect(report.flagged.some((f) => f.level === 0 && f.reason.includes("more help"))).toBe(true);
  });

  it("flags a rung that costs learners progress", () => {
    const report = hintEffectiveness([
      row(3, "regressed"),
      row(3, "resolved_independently"),
      row(3, "resolved_independently"),
    ]);
    expect(report.flagged.some((f) => f.level === 3 && f.reason.includes("fewer tests"))).toBe(true);
  });

  it("ignores interventions with no level", () => {
    expect(hintEffectiveness([{ level: null, outcome: "stalled" }]).totalDelivered).toBe(0);
  });
});

describe("against the learner fixtures", () => {
  const built = LEARNER_SCENARIOS.map(buildEpisode);

  function stateFor(subject: string) {
    const inputs: EpisodeInput[] = [];
    LEARNER_SCENARIOS.forEach((scenario, index) => {
      if (scenario.subject !== subject) return;
      const reduced = built[index].episode;
      if (!reduced) return;
      inputs.push({
        episodeId: scenario.id,
        skill: scenario.skill,
        taskRef: scenario.taskRef,
        episode: reduced,
        outcomes: built[index].outcomes,
      });
    });
    return buildLearnerState(subject, inputs);
  }

  it("names the edge-case learner's misconception with real confidence", () => {
    const state = stateFor("L06");
    const skill = state.skills.find((s) => s.misconceptions.length > 0)!;
    const top = skill.misconceptions[0];
    expect(top.failureClass).toBe("edge_case_handling");
    expect(top.distinctEpisodes).toBe(10);
    expect(top.actionable).toBe(true);
  });

  it("stays silent about the learner whose failures nobody could explain", () => {
    // L01 repeats one mistake thirty times. This layer refuses to name it,
    // because naming it would mean inventing it. See COVERAGE_ANALYSIS.md §3.
    const state = stateFor("L01");
    const named = state.skills.flatMap((s) => s.misconceptions);
    expect(named).toEqual([]);
    expect(state.unattributedFailures).toBe(30);
  });

  it("measures the copier's transfer rate off the real ledger", () => {
    const state = stateFor("L03");
    expect(state.assistance.transferSolves).toBeGreaterThan(0);
    expect(state.assistance.outcomeCounts.resolved_by_transfer).toBeGreaterThan(0);
  });

  it("agrees with the coverage analyzer on hint dependency", () => {
    const analysis = analyzeCoverage();
    const signal = analysis.signals.find((s) => s.subject === "L02")!;
    expect(stateFor("L02").assistance.hintDependency).toBeCloseTo(signal.hintDependency);
  });
});
