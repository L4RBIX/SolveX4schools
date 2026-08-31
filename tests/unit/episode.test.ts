import { describe, expect, it } from "vitest";

import {
  REDUCER_VERSION,
  independenceWeight,
  reduceEpisode,
  type ReducibleEvent,
} from "../../packages/learning-intelligence-core/src/episode";

/**
 * The reducer is a cache-builder, so the property that matters most is that it
 * is a pure function of its input: the same events must always produce the
 * same row. Everything else here is about the one distinction Phase 1 exists
 * to make — productive struggle versus thrashing.
 */

const T0 = Date.parse("2026-08-24T10:00:00.000Z");

let seq = 0;

function event(
  name: string,
  offsetSeconds: number,
  payload: Record<string, string | number | boolean> = {}
): ReducibleEvent {
  const at = new Date(T0 + offsetSeconds * 1000).toISOString();
  return { event_name: name, occurred_at: at, received_at: at, seq: seq++, payload };
}

function opened(offset = 0) {
  return event("episode_opened", offset, { task_ref: "solvex:1234A", language: "cpp17" });
}

describe("independenceWeight", () => {
  it("gives full credit to an unaided solve", () => {
    expect(independenceWeight(-1, false)).toBe(1);
  });

  it("falls as the ladder is climbed", () => {
    const weights = [0, 1, 2, 3, 4].map((level) => independenceWeight(level, false));
    for (let i = 1; i < weights.length; i += 1) {
      expect(weights[i]).toBeLessThan(weights[i - 1]);
    }
  });

  it("zeroes a revealed solution regardless of hint level", () => {
    expect(independenceWeight(-1, true)).toBe(0);
    expect(independenceWeight(0, true)).toBe(0);
  });
});

describe("reduceEpisode", () => {
  it("returns null with no events", () => {
    expect(reduceEpisode([])).toBeNull();
  });

  it("is deterministic: the same events always give the same row", () => {
    const events = [
      opened(),
      event("code_diff_classified", 30, { diff_class: "extension" }),
      event("verdict_received", 60, { verdict: "accepted" }),
      event("episode_closed", 70, { close_reason: "accepted" }),
    ];
    expect(reduceEpisode(events)).toEqual(reduceEpisode([...events].reverse()));
  });

  it("counts the things the Arena throws away today", () => {
    const result = reduceEpisode([
      opened(),
      event("run_executed", 20, {}),
      event("run_executed", 40, {}),
      event("test_case_authored", 50, {}),
      event("statement_revisited", 55, {}),
      event("code_diff_classified", 60, { diff_class: "local_fix" }),
      event("verdict_received", 90, { verdict: "wrong_answer" }),
      event("verdict_received", 150, { verdict: "accepted" }),
    ]);

    expect(result?.runs).toBe(2);
    expect(result?.self_authored_tests).toBe(1);
    expect(result?.statement_revisits).toBe(1);
    expect(result?.submissions).toBe(2);
    expect(result?.outcome).toBe("accepted");
    expect(result?.diff_class_sequence).toEqual(["local_fix"]);
    expect(result?.reducer_version).toBe(REDUCER_VERSION);
  });

  it("excludes idle time above the ceiling from active seconds", () => {
    // A tab left open for two hours really did span two hours. Reporting that
    // as time-on-task would make every median meaningless.
    const result = reduceEpisode([
      opened(),
      event("code_diff_classified", 60, { diff_class: "local_fix" }),
      event("code_diff_classified", 7260, { diff_class: "local_fix" }),
    ]);
    expect(result?.active_seconds).toBe(60);
  });

  it("records assistance and drops independence accordingly", () => {
    const result = reduceEpisode([
      opened(),
      event("assistance_requested", 100, { intervention_id: "i1", requested_level: 2 }),
      event("assistance_delivered", 105, { intervention_id: "i1", level: 2 }),
      event("verdict_received", 200, { verdict: "accepted" }),
    ]);
    expect(result?.max_assistance_level).toBe(2);
    expect(result?.intervention_count).toBe(1);
    expect(result?.independence_weight).toBeLessThan(1);
  });

  it("marks a revealed solution and zeroes independence", () => {
    const result = reduceEpisode([
      opened(),
      event("solution_revealed", 300, { reveal_scope: "editorial" }),
      event("episode_closed", 310, { close_reason: "solution_revealed" }),
    ]);
    expect(result?.solution_revealed).toBe(true);
    expect(result?.independence_weight).toBe(0);
    expect(result?.outcome).toBe("solution_revealed");
  });

  it("prefers an accepted outcome over a reveal that came first", () => {
    // Revealing then solving is still a solve; the reveal is recorded and the
    // independence weight already carries the cost.
    const result = reduceEpisode([
      opened(),
      event("solution_revealed", 100, { reveal_scope: "editorial" }),
      event("verdict_received", 200, { verdict: "accepted" }),
    ]);
    expect(result?.outcome).toBe("accepted");
    expect(result?.independence_weight).toBe(0);
  });
});

describe("struggle classification", () => {
  it("calls a clean unaided solve flow", () => {
    const result = reduceEpisode([
      opened(),
      event("code_diff_classified", 60, { diff_class: "extension" }),
      event("verdict_received", 120, { verdict: "accepted" }),
    ]);
    expect(result?.struggle_class).toBe("flow");
  });

  it("calls repeated constant tweaks against a flat verdict thrashing", () => {
    // The situation the product currently cannot see: twenty minutes of
    // failure that is not teaching anybody anything.
    const result = reduceEpisode([
      opened(),
      event("verdict_received", 60, { verdict: "wrong_answer", tests_passed: 3 }),
      event("code_diff_classified", 80, { diff_class: "constant_tweak" }),
      event("verdict_received", 100, { verdict: "wrong_answer", tests_passed: 3 }),
      event("code_diff_classified", 120, { diff_class: "constant_tweak" }),
      event("verdict_received", 140, { verdict: "wrong_answer", tests_passed: 3 }),
      event("code_diff_classified", 160, { diff_class: "constant_tweak" }),
      event("verdict_received", 180, { verdict: "wrong_answer", tests_passed: 3 }),
    ]);
    expect(result?.struggle_class).toBe("thrash");
  });

  it("calls varied edits with rising test counts productive struggle", () => {
    // Same wall-clock failure count as the thrash case above, opposite meaning:
    // the learner is still generating new information.
    const result = reduceEpisode([
      opened(),
      event("verdict_received", 60, { verdict: "wrong_answer", tests_passed: 2 }),
      event("code_diff_classified", 90, { diff_class: "structural" }),
      event("verdict_received", 140, { verdict: "wrong_answer", tests_passed: 6 }),
      event("code_diff_classified", 170, { diff_class: "local_fix" }),
      event("verdict_received", 200, { verdict: "wrong_answer", tests_passed: 9 }),
    ]);
    expect(result?.struggle_class).toBe("productive_struggle");
  });

  it("does not call a long but productive episode thrashing", () => {
    const result = reduceEpisode([
      opened(),
      event("verdict_received", 100, { verdict: "wrong_answer", tests_passed: 1 }),
      event("code_diff_classified", 200, { diff_class: "constant_tweak" }),
      event("code_diff_classified", 260, { diff_class: "structural" }),
      event("verdict_received", 300, { verdict: "wrong_answer", tests_passed: 7 }),
    ]);
    expect(result?.struggle_class).toBe("productive_struggle");
  });

  it("calls a long silence before closing disengaged", () => {
    const result = reduceEpisode([
      opened(),
      event("verdict_received", 60, { verdict: "wrong_answer" }),
      event("episode_closed", 60 + 20 * 60, { close_reason: "navigated" }),
    ]);
    expect(result?.struggle_class).toBe("disengaged");
  });

  it("calls a long gap with no real edit stuck", () => {
    const result = reduceEpisode([
      opened(),
      event("verdict_received", 30, { verdict: "wrong_answer" }),
      event("code_diff_classified", 60, { diff_class: "cosmetic" }),
      event("code_diff_classified", 60 + 8 * 60, { diff_class: "cosmetic" }),
      event("verdict_received", 60 + 9 * 60, { verdict: "wrong_answer" }),
    ]);
    expect(result?.struggle_class).toBe("stuck");
  });
});
