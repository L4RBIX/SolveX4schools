/**
 * Where a decision becomes a constraint on what Nova may actually do.
 *
 * Everything upstream of this file describes. This one enforces: it sits on the
 * request path and returns the hint level Nova is permitted to give, which is
 * not always the one that was asked for.
 *
 * WHY IT HAS TO BE HERE
 * The Copilot ladder has been skippable since it shipped. `CopilotPanel`'s
 * buttons carry a hard-coded `helpLevel` — "Explain error" is 3, "Find bug" is
 * 3 — so the level is chosen by which button someone clicks, and nobody who is
 * stuck clicks "small hint". A ladder that exists and is skipped is not a
 * ladder.
 *
 * TWO RULES, and only the first needs anything from the learning pipeline:
 *
 * 1. A directive from the decision engine caps the level. `DIAGNOSE` caps at 0
 *    — questions only — because a hint given without a diagnosis is a guess in
 *    a confident voice.
 *
 * 2. Escalation is earned. You cannot climb a rung without having attempted
 *    something since the last hint. This needs no learner state at all: it is a
 *    rule over events the Arena already holds, and it works today.
 *
 * NOT A PREDICTOR. Nothing here forecasts anything. Every input is either an
 * observed event or a directive computed from counted evidence.
 */

import type { NovaDirective } from "@solvex/learning-intelligence-core";

export const NOVA_RUNTIME_VERSION = 1;

/** The ladder, as recorded in the learning stream. */
export const MIN_HINT_LEVEL = 0;
export const MAX_HINT_LEVEL = 4;

export type GrantReason =
  /** Asked for what the rules allow. */
  | "granted_as_requested"
  /** First hint of an episode always starts at a question. */
  | "opening_rung"
  /** Tried to climb more than one rung at once. */
  | "one_rung_at_a_time"
  /** No attempt since the last hint, so nothing new has been learned. */
  | "no_attempt_since_last_hint"
  /** The decision engine's directive caps it lower. */
  | "capped_by_directive"
  /** Struggle stopped being productive; the cap lifts. */
  | "unproductive_struggle_override"
  /** The learner explicitly overrode, and accepted the cost. */
  | "learner_override";

export interface GrantInput {
  /** The level the UI asked for. */
  requested: number;
  /** Highest level already delivered this episode, or -1 for none. */
  lastGranted: number;
  /**
   * Has the learner run, edited or submitted since the last hint?
   *
   * Derived from Arena events, not inferred. Without it, "escalation is earned"
   * has nothing to check.
   */
  hasAttemptSinceLastHint: boolean;
  /** From the decision engine. Null when no learner state is available yet. */
  directive: NovaDirective | null;
  /**
   * Lift the cap because struggle has stopped paying.
   *
   * Must be backed by an observed `struggle_class` of `thrash` or `stuck` — a
   * learner drowning at 1am does not need Socratic method. Never inferred from
   * message tone.
   */
  unproductiveStruggle?: boolean;
  /**
   * The learner said "just tell me".
   *
   * Always honoured, in one tap, with the cost stated once. A mentor you cannot
   * overrule is a wall, and learners route around walls by leaving.
   */
  learnerOverride?: boolean;
}

export interface GrantDecision {
  requested: number;
  granted: number;
  capped: boolean;
  reason: GrantReason;
  /** Shown to the learner when the answer is lower than the ask. */
  explanation: string | null;
  mayIncludeCode: boolean;
  mustNotSay: string[];
}

function clamp(level: number): number {
  if (!Number.isFinite(level)) return MIN_HINT_LEVEL;
  return Math.max(MIN_HINT_LEVEL, Math.min(MAX_HINT_LEVEL, Math.round(level)));
}

/**
 * Decide the hint level Nova may actually give.
 *
 * Order matters. The learner's own override wins over everything, because the
 * alternative is a product that refuses to help; the unproductive-struggle
 * override comes next, because it exists to catch exactly the case where the
 * rules would otherwise make things worse.
 */
export function grantHintLevel(input: GrantInput): GrantDecision {
  const requested = clamp(input.requested);
  const directive = input.directive;
  const mayIncludeCode = directive ? directive.mayIncludeCode : true;
  const mustNotSay = directive ? [...directive.mustNotSay] : [];

  const base = {
    requested,
    mayIncludeCode,
    mustNotSay,
  };

  if (input.learnerOverride) {
    return {
      ...base,
      granted: requested,
      capped: false,
      reason: "learner_override",
      // Stated once, plainly, without guilt. The independence weight already
      // records the cost; saying it twice is nagging.
      explanation: "Going straight there. This one won't count toward your evidence.",
    };
  }

  if (input.unproductiveStruggle) {
    return {
      ...base,
      granted: requested,
      capped: false,
      reason: "unproductive_struggle_override",
      explanation: null,
    };
  }

  const directiveCap = directive ? clamp(directive.maxHintLevel) : MAX_HINT_LEVEL;

  // First hint of the episode. Everyone starts at a question, which is the
  // rung the button layout never offers.
  if (input.lastGranted < MIN_HINT_LEVEL) {
    const granted = Math.min(requested, directiveCap, MIN_HINT_LEVEL);
    return {
      ...base,
      granted,
      capped: granted < requested,
      reason: granted < requested ? "opening_rung" : "granted_as_requested",
      explanation:
        granted < requested
          ? "Starting with a question — tell me what you think is happening and I'll narrow it down."
          : null,
    };
  }

  // Nothing has been tried since the last hint, so there is nothing new to
  // respond to. Repeating ourselves one rung louder is not teaching.
  if (!input.hasAttemptSinceLastHint) {
    const granted = Math.min(input.lastGranted, directiveCap);
    return {
      ...base,
      granted,
      capped: granted < requested,
      reason: granted < requested ? "no_attempt_since_last_hint" : "granted_as_requested",
      explanation:
        granted < requested
          ? "Try something with the last hint first — then I'll go further."
          : null,
    };
  }

  const oneRungUp = Math.min(requested, input.lastGranted + 1);
  const granted = Math.min(oneRungUp, directiveCap);

  let reason: GrantReason = "granted_as_requested";
  let explanation: string | null = null;
  if (granted < requested) {
    if (directiveCap < oneRungUp) {
      reason = "capped_by_directive";
      explanation = directiveExplanation(directive);
    } else {
      reason = "one_rung_at_a_time";
      explanation = "One step at a time — try this before I say more.";
    }
  }

  return { ...base, granted, capped: granted < requested, reason, explanation };
}

function directiveExplanation(directive: NovaDirective | null): string {
  if (!directive) return "Holding back for now.";
  switch (directive.mode) {
    case "ask":
      // The honest register when we cannot say why they failed, which is most
      // of the time. See COVERAGE_ANALYSIS.md.
      return "I can't tell yet why this is failing, so I'd rather ask than guess.";
    case "withhold":
      return "You're close enough that a bigger hint would take this off you.";
    case "direct":
      return "You've done this unaided before — I'll keep it short.";
    case "explain":
    default:
      return "Here's the part worth looking at.";
  }
}

// ─── Arena-side derivation ───────────────────────────────────────────────────

/** The Arena event kinds that count as having attempted something. */
const ATTEMPT_EVENTS = new Set(["code_changed_debounced", "run_clicked", "submit_clicked"]);

/**
 * Did the learner actually try anything since a given moment?
 *
 * Reads the Arena's own in-memory event list. Deliberately excludes tab
 * switches and test-case edits: opening the console is not an attempt, and a
 * ladder guard that accepts it is not a guard.
 */
export function hasAttemptSince(
  events: readonly { type: string; timestamp: number }[],
  since: number | null
): boolean {
  if (since === null) return true;
  return events.some((event) => event.timestamp > since && ATTEMPT_EVENTS.has(event.type));
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type IndicatorTone = "neutral" | "measuring" | "teaching" | "holding" | "stretching";

export interface NovaIndicator {
  tone: IndicatorTone;
  label: string;
  /** One line, shown on hover. Always says what the state is FROM. */
  detail: string;
}

/**
 * What the Arena shows about Nova's current stance.
 *
 * A learner who is being given less help than they asked for is owed an
 * explanation, and "Nova is measuring" is a different thing from "Nova is
 * holding back". Silence here reads as the product being broken.
 */
export function novaIndicator(directive: NovaDirective | null): NovaIndicator {
  if (!directive) {
    return {
      tone: "neutral",
      label: "Copilot",
      detail: "No learner history loaded, so hints are unrestricted.",
    };
  }
  switch (directive.mode) {
    case "ask":
      return {
        tone: "measuring",
        label: "Working it out",
        detail: "Not enough evidence yet to say why this is failing — questions only for now.",
      };
    case "explain":
      return {
        tone: "teaching",
        label: directive.namedMisconception ? "Pattern spotted" : "Explaining",
        detail: directive.opening,
      };
    case "withhold":
      return {
        tone: "holding",
        label: "Holding back",
        detail: directive.opening,
      };
    case "direct":
      return {
        tone: "stretching",
        label: "Stretching",
        detail: directive.opening,
      };
  }
}
