import { describe, expect, it } from "vitest";

import { buildLearnerState, type EpisodeInput } from "../packages/learning-intelligence-core/src/learnerState";
import { decide, mayAssertMisconception, type ActionType } from "../packages/learning-intelligence-core/src/decisionEngine";
import { grantHintLevel } from "../packages/nova-core/src/novaRuntime";
import { buildEpisode } from "./golden-fixtures/replayHarness";
import { ARCHETYPE_BY_SUBJECT, LEARNER_SCENARIOS } from "./golden-fixtures/learnerScenarios";

/**
 * GOLDEN FIXTURES — the regression gate for SolveX4Schools.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  READ THIS BEFORE YOU CHANGE ANY CORE FILE.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Ten synthetic learners, ten episodes each, run through the REAL reducer, the
 * REAL diff classifier, the REAL learner-state projection and the REAL decision
 * engine. Nothing is mocked and nothing is hand-fed. Each learner was built to
 * exhibit one defining behaviour, so the ground truth is known — which is what
 * makes "did the pipeline notice?" a question with a checkable answer.
 *
 * These require NO Codeforces infrastructure, NO database, NO network and NO
 * LLM. They run in plain Node. If they pass in your repository, the extracted
 * intelligence behaves exactly as it does in SolveX.
 *
 * IF ONE OF THESE FAILS AFTER YOUR CHANGE, YOU CHANGED THE INTELLIGENCE.
 * That may be what you intended. It is never something to "fix" by editing the
 * expectation — first establish which behaviour is now different and why. The
 * pair L06 vs L01 (below) is the one to look at hardest.
 *
 * The fixtures are NOT data. No percentage computed over them describes any
 * real population; each one answers only "given a learner who really has this
 * property, does our code see it?"
 */

const built = LEARNER_SCENARIOS.map(buildEpisode);

function stateFor(subject: string) {
  const inputs: EpisodeInput[] = [];
  LEARNER_SCENARIOS.forEach((scenario, index) => {
    if (scenario.subject !== subject) return;
    const reduced = built[index].episode;
    if (!reduced) return;

    // Seconds from the first failing verdict to the first hint, when both
    // exist. Reaching for help inside a minute is a different behaviour from
    // struggling first, and REDUCE_ASSISTANCE reads it.
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

const actionFor = (subject: string): ActionType => decide(stateFor(subject)).primary.actionType;

// ─── 1. Different histories must produce different interventions ─────────────

describe("golden: the benchmark", () => {
  const CASES: { subject: string; archetype: string; expected: ActionType; why: string }[] = [
    {
      subject: "L06",
      archetype: "edge_case_misser",
      expected: "REMEDIATE",
      why: "same bug ten times, and the verifier could NAME it — so we may teach",
    },
    {
      subject: "L01",
      archetype: "boundary_blind",
      expected: "DIAGNOSE",
      why: "same bug ten times, UNATTRIBUTED — so we may only ask",
    },
    { subject: "L09", archetype: "early_abandoner", expected: "DIAGNOSE", why: "no usable evidence at all" },
    { subject: "L02", archetype: "hint_dependent", expected: "REDUCE_ASSISTANCE", why: "improving, but leaning on hints" },
    { subject: "L03", archetype: "solution_copier", expected: "REDUCE_ASSISTANCE", why: "solves arrive off code-bearing hints" },
    { subject: "L10", archetype: "fluent", expected: "CHALLENGE", why: "strong independent evidence" },
    { subject: "L04", archetype: "complexity_naive", expected: "REMEDIATE", why: "recurring timeouts, attributed" },
    { subject: "L08", archetype: "steady_improver", expected: "CHALLENGE", why: "solves unaided across distinct tasks" },
  ];

  it.each(CASES)("$subject ($archetype) -> $expected — $why", ({ subject, expected }) => {
    expect(actionFor(subject)).toBe(expected);
  });

  it("does not give everyone the same answer", () => {
    // The cheapest way to fake intelligence is to always say the same thing.
    const actions = new Set(CASES.map((c) => actionFor(c.subject)));
    expect(actions.size).toBeGreaterThanOrEqual(4);
  });

  it("keeps ten distinct archetypes in the fixture set", () => {
    expect(Object.keys(ARCHETYPE_BY_SUBJECT)).toHaveLength(10);
    expect(LEARNER_SCENARIOS).toHaveLength(100);
  });
});

// ─── 2. The pair that matters most ───────────────────────────────────────────

describe("golden: attribution decides whether we may teach", () => {
  it("teaches the learner whose mistake we can name", () => {
    const decision = decide(stateFor("L06"));
    expect(decision.primary.actionType).toBe("REMEDIATE");
    expect(mayAssertMisconception(decision.primary)).toBe(true);
    expect(decision.primary.nova.namedMisconception).toBe("edge_case_handling");
    // The count is in the sentence because the count IS the justification.
    expect(decision.primary.nova.opening).toMatch(/time/);
    expect(decision.primary.evidence[0].episodeIds?.length).toBeGreaterThan(1);
  });

  it("refuses to teach the learner whose mistake we cannot name", () => {
    // L01 repeats one bug ten times. A system willing to guess would have
    // plenty to say here, and would be inventing all of it. THIS IS THE TEST
    // THAT MATTERS: if it ever goes green on REMEDIATE, the guardrail is gone.
    const decision = decide(stateFor("L01"));
    expect(decision.primary.actionType).toBe("DIAGNOSE");
    expect(mayAssertMisconception(decision.primary)).toBe(false);
    expect(decision.primary.nova.namedMisconception).toBeNull();
    expect(decision.primary.nova.maxHintLevel).toBe(0);
  });

  it("the two learners are otherwise indistinguishable", () => {
    // Same failure count, same repetition. Only the attribution differs, and
    // that alone changes the action.
    const a = stateFor("L06");
    const b = stateFor("L01");
    expect(a.episodes).toBe(b.episodes);
    expect(b.unattributedFailures).toBeGreaterThan(a.unattributedFailures);
  });
});

// ─── 3. No fabricated misconceptions, anywhere in the population ─────────────

describe("golden: incomplete evidence never becomes a claim", () => {
  it("never asserts a misconception the state does not carry", () => {
    let asserted = 0;
    for (const subject of Object.keys(ARCHETYPE_BY_SUBJECT)) {
      const state = stateFor(subject);
      const decision = decide(state);
      const actionable = state.skills.flatMap((s) => s.misconceptions.filter((m) => m.actionable));

      for (const action of [decision.primary, ...decision.alternatives]) {
        if (!mayAssertMisconception(action)) {
          expect(action.nova.namedMisconception).toBeNull();
          continue;
        }
        asserted += 1;
        expect(actionable.length).toBeGreaterThan(0);
        expect(actionable.map((m) => m.failureClass)).toContain(action.nova.namedMisconception);
      }
    }
    // Guard against passing because nothing ever asserts anything.
    expect(asserted).toBeGreaterThan(0);
  });

  it("gives an unexplained failure zero confidence, not a little", () => {
    for (const subject of Object.keys(ARCHETYPE_BY_SUBJECT)) {
      for (const skill of stateFor(subject).skills) {
        for (const m of skill.misconceptions) {
          // Either it cleared the bar on counted evidence, or it says nothing.
          if (!m.actionable) expect(m.confidence).toBeLessThan(0.6);
          expect(m.confidence).toBeLessThanOrEqual(0.95);
          if (m.distinctEpisodes <= 1) expect(m.confidence).toBe(0);
        }
      }
    }
  });

  it("surfaces the unexplained count, and reports zero honestly", () => {
    // L01 fails 30 times and NOT ONE of them can be explained. The denominator
    // must be visible, because everything else about this learner rests on it.
    expect(stateFor("L01").unattributedFailures).toBe(30);

    // L09 abandons before submitting, so there is nothing to attribute and
    // nothing to explain. Zero here means "never failed", not "never measured"
    // — a distinction the projection has to keep.
    const abandoner = stateFor("L09");
    expect(abandoner.unattributedFailures).toBe(0);
    expect(abandoner.skills.reduce((n, k) => n + k.failures, 0)).toBe(0);
    expect(abandoner.episodes).toBe(10);
  });

  it("pins the attribution profile of the whole fixture population", () => {
    // This is the single most important number in the system, so it is pinned
    // rather than described: 31 of 124 failures carry a cause. That is exactly
    // 25%, and it is a property of the TEST DATA, not of the model — the
    // fixtures' largest inputs are tiny, so complexity and boundary evidence
    // mostly cannot be produced. If your adapter changes this number, you have
    // changed what the engine is able to know about a learner.
    //
    //   L01 boundary_blind      30 failures,   0 attributed   <- the honest hole
    //   L02 hint_dependent      10 failures,   0 attributed
    //   L03 solution_copier     10 failures,   0 attributed
    //   L04 complexity_naive    16 failures,   3 attributed
    //   L05 compile_fighter     18 failures,  18 attributed   <- compiler said why
    //   L06 edge_case_misser    10 failures,  10 attributed   <- verifier said why
    //   L07 comprehension_gap   10 failures,   0 attributed
    //   L08 steady_improver     20 failures,   0 attributed
    //   L09 early_abandoner      0 failures,   0 attributed
    //   L10 fluent               0 failures,   0 attributed
    let failures = 0;
    let attributed = 0;
    for (const subject of Object.keys(ARCHETYPE_BY_SUBJECT)) {
      for (const skill of stateFor(subject).skills) {
        failures += skill.failures;
        attributed += skill.attributedFailures;
      }
    }
    expect(failures).toBe(124);
    expect(attributed).toBe(31);
    // Exactly 25%. Three quarters of what happens to a learner is unexplained,
    // and the engine is built around that fact rather than around wishing it
    // away — which is why DIAGNOSE is the default and REMEDIATE the exception.
    expect(attributed / failures).toBeCloseTo(0.25, 2);
  });
});

// ─── 4. The hint ladder is enforced, not merely declared ─────────────────────

describe("golden: hint escalation", () => {
  it("caps a DIAGNOSE learner at questions even when they ask for the answer", () => {
    const directive = decide(stateFor("L01")).primary.nova;
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 1,
      hasAttemptSinceLastHint: true,
      directive,
    });
    expect(grant.granted).toBeLessThanOrEqual(directive.maxHintLevel);
    expect(grant.capped).toBe(true);
    expect(grant.reason).toBe("capped_by_directive");
  });

  it("refuses to escalate without an attempt since the last hint", () => {
    // Needs no learner history at all — this rule reads events only, so it
    // works on day one of a new product.
    const grant = grantHintLevel({
      requested: 3,
      lastGranted: 1,
      hasAttemptSinceLastHint: false,
      directive: null,
    });
    expect(grant.granted).toBe(1);
    expect(grant.reason).toBe("no_attempt_since_last_hint");
  });

  it("climbs one rung at a time", () => {
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 1,
      hasAttemptSinceLastHint: true,
      directive: null,
    });
    expect(grant.granted).toBe(2);
    expect(grant.reason).toBe("one_rung_at_a_time");
  });

  it("opens every episode at a question", () => {
    const grant = grantHintLevel({
      requested: 3,
      lastGranted: -1,
      hasAttemptSinceLastHint: true,
      directive: null,
    });
    expect(grant.granted).toBe(0);
    expect(grant.reason).toBe("opening_rung");
  });

  it("honours a learner override — but still forbids a diagnosis", () => {
    // A mentor you cannot overrule is a wall, and learners route around walls
    // by leaving. The override buys a bigger hint, never a claim.
    const directive = decide(stateFor("L01")).primary.nova;
    const grant = grantHintLevel({
      requested: 4,
      lastGranted: 1,
      hasAttemptSinceLastHint: true,
      directive,
      learnerOverride: true,
    });
    expect(grant.granted).toBe(4);
    expect(grant.reason).toBe("learner_override");
    expect(grant.mustNotSay.length).toBeGreaterThan(0);
    expect(directive.namedMisconception).toBeNull();
  });

  it("carries the never-say list into every grant", () => {
    const directive = decide(stateFor("L01")).primary.nova;
    const joined = grantHintLevel({
      requested: 0,
      lastGranted: 0,
      hasAttemptSinceLastHint: true,
      directive,
    })
      .mustNotSay.join(" | ")
      .toLowerCase();
    expect(joined).toContain("you don't understand this");
    expect(joined).toContain("you always get this wrong");
  });
});

// ─── 5. Assisted work does not count as independent evidence ─────────────────

describe("golden: assisted vs independent", () => {
  it("separates solo solves from assisted ones", () => {
    const copier = stateFor("L03");
    const fluent = stateFor("L10");
    const soloShare = (s: ReturnType<typeof stateFor>) => {
      const t = s.skills.reduce((n, k) => n + k.solved, 0);
      const solo = s.skills.reduce((n, k) => n + k.soloSolved, 0);
      return t === 0 ? 0 : solo / t;
    };
    // The copier's solves are not theirs; the fluent learner's are.
    expect(soloShare(copier)).toBeLessThan(soloShare(fluent));
  });

  it("ranks REDUCE_ASSISTANCE above remediation", () => {
    // If a learner's accepted work came off code-bearing hints, every skill
    // conclusion drawn from it is built on sand. Teaching a misconception to
    // someone who is pasting answers does not land.
    const decision = decide(stateFor("L03"));
    expect(decision.primary.actionType).toBe("REDUCE_ASSISTANCE");
  });

  it("treats the hint-leaner and the copier differently despite one action", () => {
    const leaner = decide(stateFor("L02")).primary;
    const copier = decide(stateFor("L03")).primary;
    expect(leaner.actionType).toBe(copier.actionType);
    // Same goal, different failure mode, so a different directive.
    expect(leaner.nova.opening).not.toBe(copier.nova.opening);
  });
});
