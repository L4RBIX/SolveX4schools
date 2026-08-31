import { describe, expect, it } from "vitest";

import { analyzeCoverage } from "../golden-fixtures/coverageAnalysis";
import { LEARNER_SCENARIOS } from "../golden-fixtures/learnerScenarios";

/**
 * A hundred fixtures with known ground truth, used as a detection test.
 *
 * The value is in the failures. Two detectors cannot identify the learner they
 * describe, and both are pinned here deliberately: they are the architecture's
 * open gaps, and a test that quietly started passing would mean either the gap
 * closed (worth noticing) or the fixture drifted (worth catching).
 *
 * See docs/learning/COVERAGE_ANALYSIS.md.
 */

const analysis = analyzeCoverage();

describe("fixture set", () => {
  it("covers a hundred episodes across ten learners", () => {
    expect(LEARNER_SCENARIOS).toHaveLength(100);
    expect(analysis.subjects).toBe(10);
    expect(new Set(LEARNER_SCENARIOS.map((s) => s.id)).size).toBe(100);
  });

  it("gives every episode ten attempts at one archetype", () => {
    const counts = new Map<string, number>();
    for (const scenario of LEARNER_SCENARIOS) {
      counts.set(scenario.subject, (counts.get(scenario.subject) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual(Array(10).fill(10));
  });
});

describe("attribution coverage", () => {
  it("explains a minority of failures, and says so rather than guessing", () => {
    const { attributedShare, unattributed, attributed, failedSubmissions } = analysis.attribution;
    expect(attributed + unattributed).toBe(failedSubmissions);
    // Roughly a quarter. Pinned loosely: the exact figure is a property of the
    // fixture mix, not a measurement of learners.
    expect(attributedShare).toBeGreaterThan(0.15);
    expect(attributedShare).toBeLessThan(0.4);
  });

  it("never leaves a failed submission with no attribution row at all", () => {
    // `unattributed_failure` is an answer. Silence is not.
    expect(analysis.attribution.unexplainedSubmissions).toBe(0);
  });

  it("names why it could not attribute", () => {
    const reasons = analysis.attribution.byUnknownReason;
    expect(Object.keys(reasons).length).toBeGreaterThan(0);
    for (const reason of Object.keys(reasons)) {
      expect(reason).not.toBe("unspecified");
    }
    // Wrong answers with no counterexample analysis dominate the unknowns.
    expect(reasons.no_counterexample_analysis).toBeGreaterThan(0);
  });
});

describe("learner detection", () => {
  const byArchetype = new Map(analysis.detection.map((d) => [d.archetype, d]));

  it.each([
    "hint_dependent",
    "solution_copier",
    "complexity_naive",
    "compile_fighter",
    "edge_case_misser",
    "comprehension_gap",
    "early_abandoner",
    "fluent",
  ])("identifies %s and nobody else", (archetype) => {
    const result = byArchetype.get(archetype as never);
    expect(result?.firedOn).toHaveLength(1);
    expect(result?.precise).toBe(true);
  });

  it("CANNOT identify the learner who repeats one mistake", () => {
    // The most important pattern in the product, and the pipeline is blind to
    // it: every one of L01's thirty failures is `unattributed_failure`, so
    // "the same mistake again" has nothing to key on. Repeated-mistake
    // detection is gated on wrong-answer attribution, which is the open work.
    const result = byArchetype.get("boundary_blind");
    expect(result?.precise).toBe(false);
    expect(result?.firedOn).not.toContain("L01");

    const l01 = analysis.signals.find((s) => s.subject === "L01");
    expect(l01?.failedSubmissions).toBeGreaterThan(20);
    expect(l01?.topRepeatedAttributed).toBeNull();
  });

  it("CANNOT separate improvement from ordinary solving", () => {
    // Passing-test counts climbing within an episode is what almost everyone
    // who solves anything looks like. Real improvement is a cross-episode
    // property, and there is no cross-episode skill state to measure it in.
    const result = byArchetype.get("steady_improver");
    expect(result?.precise).toBe(false);
    expect(result!.firedOn.length).toBeGreaterThan(3);
  });
});

describe("signals the analyzer computes that the pipeline does not", () => {
  it("holds no learner-level state anywhere in the shipped code", () => {
    // Every field below is computed in coverageAnalysis.ts, from episode output.
    // Nothing persists it, nothing serves it, and Nova cannot read it.
    const l02 = analysis.signals.find((s) => s.subject === "L02")!;
    expect(l02.hintDependency).toBeGreaterThan(0.8);
    expect(l02.medianSecondsToFirstHint).toBeLessThan(60);

    const l03 = analysis.signals.find((s) => s.subject === "L03")!;
    expect(l03.transferSolves).toBeGreaterThan(0);
  });
});
