import { describe, expect, it } from "vitest";

import { decide, mayAssertMisconception, type ActionType } from "../../packages/learning-intelligence-core/src/decisionEngine";
import { buildLearnerState, type EpisodeInput } from "../../packages/learning-intelligence-core/src/learnerState";
import { buildEpisode } from "../golden-fixtures/replayHarness";
import { LEARNER_SCENARIOS } from "../golden-fixtures/learnerScenarios";

/**
 * The benchmark the brief asks for: five learner histories, five interventions.
 *
 * It runs on the real fixtures through the real reducer and the real learner
 * state — nothing is hand-fed to the engine. The strongest case in the set is
 * the pair A vs A′: two learners who repeat one mistake ten times, differing
 * only in whether the verification engine could name it. They must get
 * different actions, because we know different things about them.
 */

const built = LEARNER_SCENARIOS.map(buildEpisode);

function stateFor(subject: string) {
  const inputs: EpisodeInput[] = [];
  LEARNER_SCENARIOS.forEach((scenario, index) => {
    if (scenario.subject !== subject) return;
    const reduced = built[index].episode;
    if (!reduced) return;

    const events = built[index].events;
    const firstFail = events.find(
      (e) => e.event_name === "verdict_received" && e.payload.verdict !== "accepted"
    );
    const firstHint = events.find((e) => e.event_name === "assistance_requested");
    const secondsToFirstHint =
      firstFail && firstHint
        ? (Date.parse(firstHint.received_at) - Date.parse(firstFail.received_at)) / 1000
        : null;

    inputs.push({
      episodeId: scenario.id,
      skill: scenario.skill,
      taskRef: scenario.taskRef,
      episode: reduced,
      outcomes: built[index].outcomes,
      secondsToFirstHint,
    });
  });
  return buildLearnerState(subject, inputs);
}

function actionFor(subject: string): ActionType {
  return decide(stateFor(subject)).primary.actionType;
}

// ─── The benchmark ───────────────────────────────────────────────────────────

describe("benchmark: different histories produce different interventions", () => {
  const CASES: { label: string; subject: string; expected: ActionType }[] = [
    { label: "A  same bug 10 times, ATTRIBUTED", subject: "L06", expected: "REMEDIATE" },
    { label: "A′ same bug 10 times, UNATTRIBUTED", subject: "L01", expected: "DIAGNOSE" },
    { label: "B  no usable evidence at all", subject: "L09", expected: "DIAGNOSE" },
    { label: "C  improving, but leans on hints", subject: "L02", expected: "REDUCE_ASSISTANCE" },
    { label: "D  copying solutions", subject: "L03", expected: "REDUCE_ASSISTANCE" },
    { label: "E  high performer", subject: "L10", expected: "CHALLENGE" },
    // Two more the fixtures carry, kept because they exercise the other classes.
    { label: "F  recurring timeouts, attributed", subject: "L04", expected: "REMEDIATE" },
    { label: "G  solves everything unaided", subject: "L08", expected: "CHALLENGE" },
  ];

  it.each(CASES)("$label -> $expected", ({ subject, expected }) => {
    expect(actionFor(subject)).toBe(expected);
  });

  it("does not give everyone the same answer", () => {
    const actions = new Set(CASES.map((c) => actionFor(c.subject)));
    expect(actions.size).toBeGreaterThanOrEqual(4);
  });

  it("treats the hint-leaner and the copier differently despite one action type", () => {
    // Both need less assistance; they need it withheld in different ways. The
    // action type is the same because the goal is the same; the directive
    // differs because the failure mode does.
    const leaner = decide(stateFor("L02")).primary;
    const copier = decide(stateFor("L03")).primary;

    expect(leaner.actionType).toBe(copier.actionType);
    expect(leaner.nova.opening).not.toBe(copier.nova.opening);
    expect(copier.reason).toMatch(/code-bearing hints/);
    expect(leaner.reason).toMatch(/before the learner has attempted/);
  });
});

// ─── The pair that matters most ──────────────────────────────────────────────

describe("attribution decides whether we may teach", () => {
  it("teaches the learner whose mistake we can name", () => {
    const decision = decide(stateFor("L06"));
    expect(decision.primary.actionType).toBe("REMEDIATE");
    expect(mayAssertMisconception(decision.primary)).toBe(true);
    expect(decision.primary.nova.namedMisconception).toBe("edge_case_handling");
    // The count is the justification, so it is in the sentence.
    expect(decision.primary.nova.opening).toMatch(/time/);
    expect(decision.primary.evidence[0].episodeIds?.length).toBeGreaterThan(1);
  });

  it("refuses to teach the learner whose mistake we cannot name", () => {
    // L01 repeats one bug thirty times. A system willing to guess would have
    // plenty to say here, and would be inventing it.
    const decision = decide(stateFor("L01"));
    expect(decision.primary.actionType).toBe("DIAGNOSE");
    expect(mayAssertMisconception(decision.primary)).toBe(false);
    expect(decision.primary.nova.namedMisconception).toBeNull();
    expect(decision.primary.nova.mode).toBe("ask");
    expect(decision.primary.reason).toMatch(/no cause/);
  });

  it("is confident about diagnosing precisely because evidence is thin", () => {
    // Confidence in the DECISION, not in a diagnosis. We are certain we do not
    // know, and reporting that as low confidence would be the wrong quantity.
    const decision = decide(stateFor("L01"));
    expect(decision.primary.confidence).toBeGreaterThan(0.8);
  });
});

// ─── Nova's constraints ──────────────────────────────────────────────────────

describe("Nova directives", () => {
  it("never permits the forbidden sentence", () => {
    for (const subject of ["L01", "L02", "L03", "L06", "L08", "L10"]) {
      const { primary } = decide(stateFor(subject));
      expect(primary.nova.mustNotSay.join(" ")).toMatch(/don't understand/);
    }
  });

  it("allows no hints at all while diagnosing", () => {
    // A hint given without a diagnosis is a guess in a confident voice.
    const { primary } = decide(stateFor("L01"));
    expect(primary.nova.maxHintLevel).toBe(0);
    expect(primary.nova.mayIncludeCode).toBe(false);
  });

  it("withholds code from a learner who copies", () => {
    const { primary } = decide(stateFor("L03"));
    expect(primary.nova.mode).toBe("withhold");
    expect(primary.nova.mayIncludeCode).toBe(false);
    expect(primary.nova.mustNotSay.join(" ")).toMatch(/solution code/);
  });

  it("speaks directly only to a learner with independent evidence", () => {
    const { primary } = decide(stateFor("L10"));
    expect(primary.actionType).toBe("CHALLENGE");
    expect(primary.nova.mode).toBe("direct");
  });

  it("uses learner-facing wording, never the raw failure class", () => {
    const { primary } = decide(stateFor("L06"));
    expect(primary.nova.opening).toContain("boundary case");
    expect(primary.nova.opening).not.toContain("edge_case_handling");
  });
});

// ─── Structure ───────────────────────────────────────────────────────────────

describe("decision structure", () => {
  it("carries evidence and a falsifiable expectation on every action", () => {
    for (const subject of ["L01", "L02", "L03", "L04", "L05", "L06", "L08", "L09", "L10"]) {
      const { primary } = decide(stateFor(subject));
      expect(primary.evidence.length).toBeGreaterThan(0);
      expect(primary.reason.length).toBeGreaterThan(10);
      expect(primary.expectedOutcome.length).toBeGreaterThan(10);
      expect(primary.confidence).toBeGreaterThan(0);
      expect(primary.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("ranks assistance problems above everything else", () => {
    // A learner who copies AND has a nameable misconception gets the copying
    // addressed first: remediation does not land on someone pasting answers.
    const state = stateFor("L03");
    const decision = decide(state);
    expect(decision.primary.actionType).toBe("REDUCE_ASSISTANCE");
  });

  it("keeps the alternatives it did not take, ranked below the primary", () => {
    // Alternatives may share an action type — the same decision on a different
    // skill is a genuine alternative — but never outrank the primary.
    const decision = decide(stateFor("L02"));
    expect(decision.alternatives.length).toBeGreaterThan(0);
    const rank = { REDUCE_ASSISTANCE: 0, REMEDIATE: 1, DIAGNOSE: 2, STRENGTHEN: 3, CHALLENGE: 4 };
    for (const alternative of decision.alternatives) {
      expect(rank[alternative.actionType]).toBeGreaterThanOrEqual(rank[decision.primary.actionType]);
    }
  });

  it("asks a task for the property the action needs", () => {
    // Remediating a boundary miss on a pack with no degenerate test would not
    // measure the fix.
    const { primary } = decide(stateFor("L06"));
    expect(primary.taskRequest.requires).toBe("degenerate_cases");
    expect(primary.taskRequest.skill).toBe("sequence_search");
  });

  it("still decides something for a learner who never submits", () => {
    const decision = decide(stateFor("L09"));
    expect(decision.primary.actionType).toBe("DIAGNOSE");
    expect(decision.primary.taskRequest.difficulty).not.toBe("harder");
  });

  it("returns a decision for an empty learner without inventing one", () => {
    const empty = buildLearnerState("new", []);
    const decision = decide(empty);
    expect(decision.primary.actionType).toBe("DIAGNOSE");
    expect(decision.primary.skill).toBeNull();
    expect(mayAssertMisconception(decision.primary)).toBe(false);
  });
});
