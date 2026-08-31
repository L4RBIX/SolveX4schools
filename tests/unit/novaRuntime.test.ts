import { describe, expect, it } from "vitest";

import { decide } from "../../packages/learning-intelligence-core/src/decisionEngine";
import type { NovaDirective } from "../../packages/learning-intelligence-core/src/decisionEngine";
import { buildLearnerState } from "../../packages/learning-intelligence-core/src/learnerState";
import { grantHintLevel, hasAttemptSince, novaIndicator } from "../../packages/nova-core/src/novaRuntime";

/**
 * The gate is where a decision stops being advice.
 *
 * Two things are being proven: that the ladder cannot be skipped by pressing a
 * different button, and that a `DIAGNOSE` directive really does mean questions
 * only rather than "questions preferred".
 */

function directive(overrides: Partial<NovaDirective> = {}): NovaDirective {
  return {
    mode: "ask",
    mayNameMisconception: false,
    namedMisconception: null,
    maxHintLevel: 0,
    mayIncludeCode: false,
    mustNotSay: ["You don't understand this"],
    opening: "What's your plan?",
    ...overrides,
  };
}

describe("escalation is earned", () => {
  it("opens at a question however high the ask", () => {
    // "Explain error" is hard-coded to level 3. Nobody who is stuck presses
    // "small hint", which is how the ladder came to be skipped by everyone.
    const grant = grantHintLevel({
      requested: 3,
      lastGranted: -1,
      hasAttemptSinceLastHint: true,
      directive: null,
    });
    expect(grant.granted).toBe(0);
    expect(grant.capped).toBe(true);
    expect(grant.reason).toBe("opening_rung");
    expect(grant.explanation).toBeTruthy();
  });

  it("refuses to climb without an attempt since the last hint", () => {
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 1,
      hasAttemptSinceLastHint: false,
      directive: null,
    });
    expect(grant.granted).toBe(1);
    expect(grant.reason).toBe("no_attempt_since_last_hint");
  });

  it("climbs exactly one rung when something was tried", () => {
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 1,
      hasAttemptSinceLastHint: true,
      directive: null,
    });
    expect(grant.granted).toBe(2);
    expect(grant.reason).toBe("one_rung_at_a_time");
  });

  it("grants the ask when the ask is already the next rung", () => {
    const grant = grantHintLevel({
      requested: 2,
      lastGranted: 1,
      hasAttemptSinceLastHint: true,
      directive: null,
    });
    expect(grant.granted).toBe(2);
    expect(grant.capped).toBe(false);
    expect(grant.explanation).toBeNull();
  });

  it("imposes no cap when no learner history is loaded", () => {
    // Degrading to "no ladder at all" would be worse than degrading to the
    // escalation guard, which needs no learner state.
    const grant = grantHintLevel({
      requested: 3,
      lastGranted: 2,
      hasAttemptSinceLastHint: true,
      directive: null,
    });
    expect(grant.granted).toBe(3);
    expect(grant.mayIncludeCode).toBe(true);
  });
});

describe("directives constrain what the gate will grant", () => {
  it("means questions only under DIAGNOSE, not questions preferred", () => {
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 0,
      hasAttemptSinceLastHint: true,
      directive: directive({ maxHintLevel: 0 }),
    });
    expect(grant.granted).toBe(0);
    expect(grant.reason).toBe("capped_by_directive");
    expect(grant.explanation).toMatch(/rather ask than guess/);
  });

  it("withholds code when the directive withholds code", () => {
    const grant = grantHintLevel({
      requested: 2,
      lastGranted: 1,
      hasAttemptSinceLastHint: true,
      directive: directive({ mode: "withhold", maxHintLevel: 1, mayIncludeCode: false }),
    });
    expect(grant.mayIncludeCode).toBe(false);
    expect(grant.granted).toBe(1);
  });

  it("carries the forbidden sentences through to the caller", () => {
    const grant = grantHintLevel({
      requested: 1,
      lastGranted: 0,
      hasAttemptSinceLastHint: true,
      directive: directive({ maxHintLevel: 2 }),
    });
    expect(grant.mustNotSay.join(" ")).toMatch(/don't understand/);
  });
});

describe("overrides", () => {
  /*
   * This test asserted that an override granted level 4 from `lastGranted: -1`
   * — i.e. as the FIRST thing that happens on a task. It passed, which is how
   * the hole stayed open: the panel's "just tell me" button posts
   * `requestedLevel: 4, override: true`, so one tap on an untouched task
   * returned the solution, with code, since a learner with no ledger has no
   * directive and `mayIncludeCode` then defaults to true.
   *
   * The approved programme rules that out in as many words (PDF p.4): help
   * «ешқашан дайын кодтан басталмайды» — never STARTS with ready code. Note the
   * word: not "never gives", never *starts with*. So the override survives; it
   * simply cannot be the opening move.
   */
  it("will not make ready code the first thing that happens", () => {
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: -1,
      hasAttemptSinceLastHint: false,
      directive: directive({ maxHintLevel: 0 }),
      learnerOverride: true,
    });
    expect(grant.granted).toBe(0);
    expect(grant.capped).toBe(true);
    expect(grant.reason).toBe("opening_rung");
  });

  it("always honours the learner once the ladder has started, and states the cost once", () => {
    // A mentor you cannot overrule is a wall, and learners route around walls
    // by leaving. Past the opening question the override is absolute — it
    // outranks even a directive capping the level at 0.
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 0,
      hasAttemptSinceLastHint: false,
      hasAttempted: true,
      directive: directive({ maxHintLevel: 0 }),
      learnerOverride: true,
    });
    expect(grant.granted).toBe(4);
    expect(grant.capped).toBe(false);
    expect(grant.explanation).toMatch(/won't count/);
  });

  it("lifts the cap when struggle has stopped paying", () => {
    const grant = grantHintLevel({
      requested: 3,
      lastGranted: 0,
      hasAttemptSinceLastHint: true,
      directive: directive({ maxHintLevel: 0 }),
      unproductiveStruggle: true,
    });
    expect(grant.granted).toBe(3);
    expect(grant.reason).toBe("unproductive_struggle_override");
  });

  it("keeps the ladder for a learner who is still making progress", () => {
    const grant = grantHintLevel({
      requested: 3,
      lastGranted: 0,
      hasAttemptSinceLastHint: true,
      directive: directive({ maxHintLevel: 0 }),
      unproductiveStruggle: false,
    });
    expect(grant.granted).toBe(0);
  });
});

describe("hasAttemptSince", () => {
  const events = [
    { type: "session_started", timestamp: 100 },
    { type: "code_changed_debounced", timestamp: 200 },
    { type: "test_case_added", timestamp: 300 },
  ];

  it("counts editing, running and submitting", () => {
    expect(hasAttemptSince(events, 150)).toBe(true);
    expect(hasAttemptSince([{ type: "run_clicked", timestamp: 400 }], 300)).toBe(true);
    expect(hasAttemptSince([{ type: "submit_clicked", timestamp: 400 }], 300)).toBe(true);
  });

  it("does not count opening a tab or adding an empty test row", () => {
    // A guard that accepts these is not a guard.
    expect(hasAttemptSince(events, 250)).toBe(false);
  });

  it("treats the first hint of an episode as unblocked", () => {
    expect(hasAttemptSince(events, null)).toBe(true);
  });
});

describe("indicator", () => {
  it("says nothing is loaded rather than implying a stance", () => {
    const indicator = novaIndicator(null);
    expect(indicator.tone).toBe("neutral");
    expect(indicator.detail).toMatch(/No learner history/);
  });

  it("distinguishes measuring from holding back", () => {
    // "Nova is measuring" and "Nova is holding back" are different things and a
    // learner given less than they asked for is owed the difference.
    expect(novaIndicator(directive({ mode: "ask" })).tone).toBe("measuring");
    expect(novaIndicator(directive({ mode: "withhold" })).tone).toBe("holding");
    expect(novaIndicator(directive({ mode: "explain" })).tone).toBe("teaching");
    expect(novaIndicator(directive({ mode: "direct" })).tone).toBe("stretching");
  });
});

describe("end to end from a real decision", () => {
  it("caps a learner we cannot diagnose at questions only", () => {
    // An empty learner: no evidence, so the engine says DIAGNOSE and the gate
    // makes that binding.
    const decision = decide(buildLearnerState("new", []));
    expect(decision.primary.actionType).toBe("DIAGNOSE");

    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 2,
      hasAttemptSinceLastHint: true,
      directive: decision.primary.nova,
    });
    expect(grant.granted).toBe(0);
    expect(grant.mayIncludeCode).toBe(false);
  });
});
