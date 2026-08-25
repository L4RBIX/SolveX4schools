import { describe, expect, it } from "vitest";

import type { ReducibleEvent } from "../../packages/learning-intelligence-core/src/episode";
import {
  WINDOW_SPEC,
  computeInterventionOutcome,
  type InterventionInput,
} from "../../packages/learning-intelligence-core/src/interventionOutcome";

/**
 * "Does the AI help?" — the question SolveX currently cannot answer at all.
 *
 * The cases that matter are the uncomfortable ones: a learner who reached
 * Accepted by pasting our code, and a learner our hint pushed backwards. Both
 * look like success on any naive count of "hint given, problem solved".
 */

const T0 = Date.parse("2026-08-24T10:00:00.000Z");
const DELIVERED_AT = new Date(T0).toISOString();

let seq = 0;

function event(
  name: string,
  offsetSeconds: number,
  payload: Record<string, string | number | boolean> = {}
): ReducibleEvent {
  const at = new Date(T0 + offsetSeconds * 1000).toISOString();
  return { event_name: name, occurred_at: at, received_at: at, seq: seq++, payload };
}

function intervention(overrides: Partial<InterventionInput> = {}): InterventionInput {
  return {
    intervention_id: "i1",
    episode_id: "e1",
    level: 2,
    contains_code: false,
    delivered_at: DELIVERED_AT,
    pre_tests_passed: null,
    ...overrides,
  };
}

describe("computeInterventionOutcome", () => {
  it("stamps the window spec on every row so it cannot be widened later", () => {
    const result = computeInterventionOutcome(intervention(), []);
    expect(result.window_spec).toBe(WINDOW_SPEC);
  });

  it("calls a solve after a code-free hint an independent resolution", () => {
    const result = computeInterventionOutcome(intervention(), [
      event("code_diff_classified", 60, { diff_class: "structural", edit_distance_bucket: "51-200" }),
      event("verdict_received", 120, { verdict: "accepted" }),
    ]);
    expect(result.outcome).toBe("resolved_independently");
    expect(result.seconds_to_outcome).toBe(120);
  });

  it("calls a solve after a large paste from a code-carrying hint transfer", () => {
    // A product success and a learning failure. They must never share a metric.
    const result = computeInterventionOutcome(intervention({ contains_code: true }), [
      event("code_diff_classified", 30, {
        diff_class: "structural",
        edit_distance_bucket: "200+",
      }),
      event("verdict_received", 60, { verdict: "accepted" }),
    ]);
    expect(result.outcome).toBe("resolved_by_transfer");
  });

  it("catches the commonest copy pattern: nothing written, then a pasted solution", () => {
    // Regression. `authored` was split out of `structural` after this rule was
    // written, which silently made the "learner had only the template and
    // pasted the hint's code" case unreachable. It fired on nobody.
    const result = computeInterventionOutcome(intervention({ contains_code: true }), [
      event("code_diff_classified", 30, {
        diff_class: "authored",
        edit_distance_bucket: "200+",
      }),
      event("verdict_received", 60, { verdict: "accepted" }),
    ]);
    expect(result.outcome).toBe("resolved_by_transfer");
  });

  it("still credits a first solution written after a code-free hint", () => {
    // Same edit shape, but the hint carried no code, so it is their own work.
    const result = computeInterventionOutcome(intervention({ contains_code: false }), [
      event("code_diff_classified", 30, {
        diff_class: "authored",
        edit_distance_bucket: "200+",
      }),
      event("verdict_received", 60, { verdict: "accepted" }),
    ]);
    expect(result.outcome).toBe("resolved_independently");
  });

  it("does not call a small edit after a code hint transfer", () => {
    // Under-reporting transfer is the intended bias while exact overlap needs
    // hint text we deliberately do not copy into this stream.
    const result = computeInterventionOutcome(intervention({ contains_code: true }), [
      event("code_diff_classified", 30, { diff_class: "local_fix", edit_distance_bucket: "2-10" }),
      event("verdict_received", 60, { verdict: "accepted" }),
    ]);
    expect(result.outcome).toBe("resolved_independently");
  });

  it("calls asking for the next rung an escalation", () => {
    const result = computeInterventionOutcome(intervention({ level: 1 }), [
      event("assistance_requested", 45, { intervention_id: "i2", requested_level: 3 }),
      event("verdict_received", 200, { verdict: "accepted" }),
    ]);
    expect(result.outcome).toBe("escalated");
  });

  it("calls a drop in passing tests a regression", () => {
    // The most expensive thing a confident wrong hint can do, and invisible
    // without comparing test counts across attempts.
    const result = computeInterventionOutcome(intervention({ pre_tests_passed: 8 }), [
      event("code_diff_classified", 40, { diff_class: "structural", edit_distance_bucket: "51-200" }),
      event("verdict_received", 90, { verdict: "wrong_answer", tests_passed: 2 }),
    ]);
    expect(result.outcome).toBe("regressed");
    expect(result.delta_tests_passed).toBe(-6);
  });

  it("calls more passing tests without a solve progress", () => {
    const result = computeInterventionOutcome(intervention({ pre_tests_passed: 2 }), [
      event("code_diff_classified", 40, { diff_class: "local_fix", edit_distance_bucket: "2-10" }),
      event("verdict_received", 90, { verdict: "wrong_answer", tests_passed: 7 }),
    ]);
    expect(result.outcome).toBe("progressed");
    expect(result.delta_tests_passed).toBe(5);
  });

  it("calls no meaningful edit a stall", () => {
    const result = computeInterventionOutcome(intervention(), [
      event("code_diff_classified", 60, { diff_class: "cosmetic" }),
    ]);
    expect(result.outcome).toBe("stalled");
    expect(result.post_diff_class).toBeNull();
  });

  it("calls acting on the hint and then leaving abandonment", () => {
    const result = computeInterventionOutcome(intervention(), [
      event("code_diff_classified", 60, { diff_class: "local_fix", edit_distance_bucket: "2-10" }),
      event("episode_closed", 120, { close_reason: "navigated" }),
    ]);
    expect(result.outcome).toBe("abandoned");
  });

  it("prefers stalled over abandoned when the hint produced no edit at all", () => {
    // The two overlap by construction — both are true of the same episode — and
    // the replays showed the more informative one losing. These rows describe
    // the hint: "nobody acted on it" points at the wording, while abandonment
    // is a fact about the episode and is recorded there.
    const result = computeInterventionOutcome(intervention(), [
      event("episode_closed", 120, { close_reason: "navigated" }),
    ]);
    expect(result.outcome).toBe("stalled");
  });

  it("ignores a solve that lands outside the attribution window", () => {
    // Accepting credit for an Accepted forty minutes later would make every
    // hint look effective.
    const result = computeInterventionOutcome(intervention(), [
      event("code_diff_classified", 60, { diff_class: "local_fix", edit_distance_bucket: "2-10" }),
      event("verdict_received", 40 * 60, { verdict: "accepted" }),
    ]);
    expect(result.outcome).not.toBe("resolved_independently");
  });

  it("ignores events that happened before the hint", () => {
    const before = {
      event_name: "verdict_received",
      occurred_at: new Date(T0 - 60_000).toISOString(),
      received_at: new Date(T0 - 60_000).toISOString(),
      seq: 0,
      payload: { verdict: "accepted" },
    };
    const result = computeInterventionOutcome(intervention(), [before]);
    expect(result.outcome).not.toBe("resolved_independently");
  });
});
