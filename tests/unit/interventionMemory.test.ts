import { describe, expect, it } from "vitest";

import type { ReducedEpisode } from "../../packages/learning-intelligence-core/src/episode";
import {
  actionEffectiveness,
  adviseFromOutcome,
  verifyAction,
  type ActionRecord,
  type FollowUpEpisode,
} from "../../packages/learning-intelligence-core/src/interventionMemory";

/**
 * The property under test is falsifiability.
 *
 * Every action states what it expects to observe. If nothing ever checks, the
 * engine can issue DIAGNOSE forever to a learner it never learns anything about
 * and nothing notices. These tests pin that the check is real — and that
 * "not enough follow-up" stays distinct from "it failed".
 */

const BASE: ReducedEpisode = {
  task_ref: "solvex:1",
  task_kind: "cp_problem",
  opened_at: "2026-08-24T10:00:00.000Z",
  closed_at: "2026-08-24T10:10:00.000Z",
  active_seconds: 600,
  resume_count: 0,
  outcome: "accepted",
  verdict_sequence: [],
  diff_class_sequence: [],
  submissions: 1,
  runs: 1,
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
  event_count: 6,
  reducer_version: 5,
};

function follow(id: string, overrides: Partial<ReducedEpisode> = {}, skill = "binary_search"): FollowUpEpisode {
  return { episodeId: id, skill, episode: { ...BASE, ...overrides } };
}

function attribution(failureClass: string) {
  return {
    failure_class: failureClass,
    attribution_source: "verifier",
    confidence: 0.6,
    reason: null,
    at: "2026-08-24T10:05:00.000Z",
  };
}

function record(overrides: Partial<ActionRecord> = {}): ActionRecord {
  return {
    actionId: "a1",
    subject: "L",
    actionType: "DIAGNOSE",
    skill: "binary_search",
    expectedOutcome: "an attributed failure or a solo solve",
    namedMisconception: null,
    confidence: 0.9,
    issuedAt: "2026-08-24T09:00:00.000Z",
    ...overrides,
  };
}

describe("not_yet is not failure", () => {
  it("returns not_yet with no follow-up at all", () => {
    const outcome = verifyAction(record(), []);
    expect(outcome.verdict).toBe("not_yet");
    expect(outcome.episodesConsidered).toBe(0);
  });

  it("returns not_yet for REMEDIATE after a single episode", () => {
    // One clean episode does not show a misconception is gone; it shows one
    // episode went well.
    const outcome = verifyAction(
      record({ actionType: "REMEDIATE", namedMisconception: "edge_case_handling" }),
      [follow("e1")]
    );
    expect(outcome.verdict).toBe("not_yet");
  });

  it("ignores episodes on other skills", () => {
    const outcome = verifyAction(record(), [follow("e1", {}, "dynamic_programming")]);
    expect(outcome.verdict).toBe("not_yet");
  });
});

describe("DIAGNOSE", () => {
  it("worked when an attributed failure came back", () => {
    // The aim is evidence, so a nameable failure is a success — arguably a
    // better one than a lucky solve.
    const outcome = verifyAction(record(), [
      follow("e1", {
        outcome: "abandoned",
        attributions: [attribution("edge_case_handling")],
        attributed_failures: 1,
        independence_weight: 1,
      }),
    ]);
    expect(outcome.verdict).toBe("worked");
    expect(outcome.observed).toMatch(/attributed failure/);
  });

  it("worked when they simply solved it unaided", () => {
    expect(verifyAction(record(), [follow("e1")]).verdict).toBe("worked");
  });

  it("did not work when the follow-up is still unattributable", () => {
    const outcome = verifyAction(record(), [
      follow("e1", {
        outcome: "abandoned",
        attributions: [{ ...attribution("unattributed_failure"), confidence: 0.1 }],
      }),
    ]);
    expect(outcome.verdict).toBe("did_not_work");
    expect(outcome.observed).toMatch(/nothing attributable/);
  });
});

describe("REMEDIATE", () => {
  const remediate = record({
    actionType: "REMEDIATE",
    namedMisconception: "edge_case_handling",
  });

  it("worked when the named class stopped recurring", () => {
    const outcome = verifyAction(remediate, [follow("e1"), follow("e2")]);
    expect(outcome.verdict).toBe("worked");
    expect(outcome.observed).toContain("edge_case_handling");
  });

  it("did not work when it came back", () => {
    const outcome = verifyAction(remediate, [
      follow("e1", { attributions: [attribution("edge_case_handling")] }),
      follow("e2"),
    ]);
    expect(outcome.verdict).toBe("did_not_work");
  });

  it("is not fooled by a different misconception appearing", () => {
    const outcome = verifyAction(remediate, [
      follow("e1", { attributions: [attribution("compile_error")] }),
      follow("e2"),
    ]);
    expect(outcome.verdict).toBe("worked");
  });
});

describe("REDUCE_ASSISTANCE", () => {
  const reduce = record({ actionType: "REDUCE_ASSISTANCE", skill: null });

  it("worked only on a solve with no assistance recorded", () => {
    const outcome = verifyAction(reduce, [follow("e1", { independence_weight: 1 })]);
    expect(outcome.verdict).toBe("worked");
  });

  it("does not count an assisted solve as success", () => {
    // The whole point was to get a result that measures them.
    const outcome = verifyAction(reduce, [
      follow("e1", { independence_weight: 0.2, max_assistance_level: 3 }),
      follow("e2", { independence_weight: 0.08, max_assistance_level: 4 }),
    ]);
    expect(outcome.verdict).toBe("did_not_work");
  });
});

describe("CHALLENGE", () => {
  it("counts a nameable failure at the new level as informative", () => {
    const outcome = verifyAction(record({ actionType: "CHALLENGE" }), [
      follow("e1", {
        outcome: "abandoned",
        independence_weight: 1,
        attributions: [attribution("complexity_asymptotic")],
      }),
    ]);
    expect(outcome.verdict).toBe("worked");
  });
});

describe("aggregation", () => {
  it("keeps unevaluated actions out of the success rate", () => {
    // Counting `not_yet` as failure would make a quiet week read as a
    // regression and push someone into acting on noise.
    const rates = actionEffectiveness([
      { actionId: "1", actionType: "DIAGNOSE", verdict: "worked", observed: "", episodesConsidered: 1, checkedAt: "" },
      { actionId: "2", actionType: "DIAGNOSE", verdict: "did_not_work", observed: "", episodesConsidered: 2, checkedAt: "" },
      { actionId: "3", actionType: "DIAGNOSE", verdict: "not_yet", observed: "", episodesConsidered: 0, checkedAt: "" },
      { actionId: "4", actionType: "DIAGNOSE", verdict: "not_yet", observed: "", episodesConsidered: 0, checkedAt: "" },
    ]);
    const diagnose = rates[0];
    expect(diagnose.issued).toBe(4);
    expect(diagnose.notYet).toBe(2);
    expect(diagnose.successRate).toBe(0.5);
  });

  it("reports null rather than zero when nothing has been judged", () => {
    const rates = actionEffectiveness([
      { actionId: "1", actionType: "REMEDIATE", verdict: "not_yet", observed: "", episodesConsidered: 0, checkedAt: "" },
    ]);
    expect(rates[0].successRate).toBeNull();
  });
});

describe("what memory is allowed to change", () => {
  it("never raises misconception confidence from an intervention going well", () => {
    // The tempting version of this feature, and the wrong one: confidence in a
    // misconception comes from attributed failures, not from a hint landing.
    const advice = adviseFromOutcome({
      actionId: "1",
      actionType: "REMEDIATE",
      verdict: "worked",
      observed: "",
      episodesConsidered: 2,
      checkedAt: "",
    });
    expect(advice.remeasure).toBe(true);
    expect(advice.avoidRepeat).toBe(true);
    expect(advice.note).toMatch(/may be resolved/);
  });

  it("does not repeat an explanation that already failed to land", () => {
    const advice = adviseFromOutcome({
      actionId: "1",
      actionType: "REMEDIATE",
      verdict: "did_not_work",
      observed: "",
      episodesConsidered: 3,
      checkedAt: "",
    });
    expect(advice.avoidRepeat).toBe(true);
    expect(advice.note).toMatch(/unlikely to help/);
  });

  it("sends a failed diagnosis to a different task, not a bigger hint", () => {
    const advice = adviseFromOutcome({
      actionId: "1",
      actionType: "DIAGNOSE",
      verdict: "did_not_work",
      observed: "",
      episodesConsidered: 2,
      checkedAt: "",
    });
    expect(advice.note).toMatch(/different task, not a bigger hint/);
  });

  it("learns nothing from an unevaluated action", () => {
    const advice = adviseFromOutcome({
      actionId: "1",
      actionType: "DIAGNOSE",
      verdict: "not_yet",
      observed: "",
      episodesConsidered: 0,
      checkedAt: "",
    });
    expect(advice.avoidRepeat).toBe(false);
    expect(advice.remeasure).toBe(false);
  });
});
