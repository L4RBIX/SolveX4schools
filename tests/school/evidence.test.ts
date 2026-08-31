import { describe, it, expect } from "vitest";
import { buildEvidence, skillEvidence, evidenceSummary } from "@schools/presentation/evidence";
import type { LearnerState, SkillState } from "@solvex/learning-intelligence-core";

/**
 * The learner-facing evidence model.
 *
 * The tests that matter here are the ones about what is NOT said.
 */

function skill(over: Partial<SkillState>): SkillState {
  return {
    skill: "io.print", level: "unknown", attempts: 0, solved: 0, soloSolved: 0,
    assistedSolved: 0, failures: 0, attributedFailures: 0, distinctTasks: 0,
    misconceptions: [], rationale: "", ...over,
  };
}

function state(skills: SkillState[]): LearnerState {
  return {
    subject: "s", episodes: skills.length, skills,
    assistance: { interventions: 0, hintDependency: 0, medianSecondsToFirstHint: null, transferSolves: 0, outcomeCounts: {} as never },
    unattributedFailures: 0, version: 1,
  };
}

describe("evidence states", () => {
  it("calls an untouched skill not_started, not zero", () => {
    expect(skillEvidence(skill({}))).toBe("not_started");
  });

  it("does not claim independence from an assisted solve", () => {
    expect(
      skillEvidence(skill({ level: "competent", solved: 3, soloSolved: 0, assistedSolved: 3, attempts: 3 })),
    ).toBe("practicing");
  });

  it("claims independence only from an unaided solve at a real level", () => {
    expect(
      skillEvidence(skill({ level: "competent", solved: 2, soloSolved: 2, attempts: 2 })),
    ).toBe("independent_evidence");
  });

  it("surfaces an actionable misconception ahead of solves", () => {
    // Someone can pass three tasks and still reliably get the boundary wrong.
    const s = skill({
      level: "competent", solved: 3, soloSolved: 3, attempts: 4, failures: 1, attributedFailures: 1,
      misconceptions: [{
        failureClass: "strict_vs_inclusive_boundary", skill: "io.print", occurrences: 2,
        distinctEpisodes: 2, evidenceConfidence: 0.9, confidence: 0.81, actionable: true,
        firstSeenAt: "", lastSeenAt: "", episodeIds: ["a", "b"],
      }],
    });
    expect(skillEvidence(s)).toBe("needs_review");
  });

  it("does NOT treat a single unexplained failure as a misconception", () => {
    const s = skill({ attempts: 1, failures: 1, attributedFailures: 0, level: "unknown" });
    expect(skillEvidence(s)).toBe("learning");
  });
});

describe("what the dashboard refuses to invent", () => {
  it("emits no percentage anywhere", () => {
    const built = buildEvidence(
      state([skill({ attempts: 5, solved: 3, soloSolved: 2, level: "competent" })]),
      1,
    );
    const json = JSON.stringify(built);
    expect(json).not.toMatch(/%/);
    // No field that could be read as a score out of 100.
    expect(json).not.toMatch(/"mastery"/);
    expect(json).not.toMatch(/"score"/);
  });

  it("shows unexplained failures rather than hiding them", () => {
    const summary = evidenceSummary({ ...state([]), unattributedFailures: 7 });
    expect(summary.unexplainedFailures).toBe(7);
  });

  it("lists curriculum skills the learner has never touched", () => {
    const built = buildEvidence(null, 1);
    expect(built.length).toBeGreaterThan(5);
    expect(built.every((s) => s.state === "not_started")).toBe(true);
  });

  it("does not leak the failure class into the learner-facing sentence", () => {
    const built = buildEvidence(
      state([skill({
        attempts: 3, failures: 2, attributedFailures: 2, level: "developing",
        misconceptions: [{
          failureClass: "string_vs_number_confusion", skill: "io.print", occurrences: 2,
          distinctEpisodes: 2, evidenceConfidence: 0.9, confidence: 0.81, actionable: true,
          firstSeenAt: "", lastSeenAt: "", episodeIds: ["a", "b"],
        }],
      })]),
      1,
    );
    const row = built.find((s) => s.skillId === "io.print")!;
    // The engine's own rationale keeps it, for audit.
    expect(row.state).toBe("needs_review");
    // The learner's sentence does not: naming it hands back a label instead of
    // asking a question, which is Nova's job and only with the right framing.
    expect(row.summary.kk).not.toContain("string_vs_number");
    expect(row.summary.ru).not.toContain("string_vs_number");
  });
});
