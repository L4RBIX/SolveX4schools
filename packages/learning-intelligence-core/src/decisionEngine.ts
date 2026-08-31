/**
 * L5: what should happen next?
 *
 * The layers below detect. This one decides. It adds no detectors, reads
 * nothing but `LearnerState`, and every branch below points at a count that
 * already exists.
 *
 * THE SHAPE OF THE PROBLEM
 * Three quarters of failures carry no cause (see COVERAGE_ANALYSIS.md). A
 * decision engine written for a world where we know why people fail would spend
 * most of its time guessing. So this one is built the other way round:
 * **DIAGNOSE is the default and the most common answer**, and remediation is
 * the exception that requires evidence to unlock.
 *
 * That inversion is the whole design. An engine that always has an opinion is
 * indistinguishable from one that is right, until you check.
 *
 * WHAT IT DOES NOT READ
 * Difficulty trend. The brief lists it as an input and `LearnerState` has no
 * such field, because per-task difficulty calibration does not exist yet
 * (see LEARNING_ATTRIBUTION_COVERAGE.md). `TaskRequest.difficulty` therefore
 * expresses a DIRECTION for a catalogue query to resolve, not a measured level.
 */

import type {
  LearnerState,
  MisconceptionObservation,
  SkillState,
} from "./learnerState";

export const DECISION_ENGINE_VERSION = 1;

// ─── Actions ─────────────────────────────────────────────────────────────────

export type ActionType =
  /** We do not know enough to act. Serve something that produces evidence. */
  | "DIAGNOSE"
  /** A named, recurring misconception. Teach that specific thing. */
  | "REMEDIATE"
  /** They can do it, but not yet reliably or unaided. */
  | "STRENGTHEN"
  /** Strong independent evidence. Raise the difficulty. */
  | "CHALLENGE"
  /** Their results are not attributable to them. Nothing else is meaningful. */
  | "REDUCE_ASSISTANCE";

/**
 * Priority when several apply.
 *
 * `REDUCE_ASSISTANCE` outranks everything including remediation, and that
 * ordering is deliberate: if a learner's accepted submissions came off a
 * code-bearing hint, every skill conclusion drawn from them is built on sand.
 * Teaching a misconception to someone who is pasting answers does not land.
 */
const PRIORITY: Record<ActionType, number> = {
  REDUCE_ASSISTANCE: 0,
  REMEDIATE: 1,
  DIAGNOSE: 2,
  STRENGTHEN: 3,
  CHALLENGE: 4,
};

export interface EvidenceRef {
  kind: string;
  detail: string;
  episodeIds?: string[];
}

export interface TaskRequest {
  skill: string | null;
  /** A direction for the catalogue to resolve, not a measured level. */
  difficulty: "easier" | "same" | "harder";
  /**
   * A property the task's own verification evidence must have. Without it the
   * action cannot produce the observation it is aiming for — asking someone to
   * practise edge cases on a pack with no degenerate test is not practice.
   */
  requires?: "degenerate_cases" | "complexity_gate" | "any";
  purpose: string;
}

export type NovaMode = "ask" | "explain" | "withhold" | "direct";

/**
 * What Nova is permitted to say, decided here rather than in a prompt.
 *
 * A prompt is a preference. This is a guarantee: `mayNameMisconception` is
 * false unless a misconception cleared the actionable threshold, so the
 * sentence "you don't understand X" is unreachable without evidence rather
 * than merely discouraged.
 */
export interface NovaDirective {
  mode: NovaMode;
  mayNameMisconception: boolean;
  namedMisconception: string | null;
  /** Ceiling on the hint ladder while this action stands. */
  maxHintLevel: number;
  mayIncludeCode: boolean;
  mustNotSay: string[];
  /** Opening line, filled from counts. Never a claim the evidence cannot carry. */
  opening: string;
}

export interface NextAction {
  actionType: ActionType;
  skill: string | null;
  reason: string;
  evidence: EvidenceRef[];
  /** Confidence in THIS DECISION, not in any misconception. See `decide`. */
  confidence: number;
  taskRequest: TaskRequest;
  /** What we expect to observe if this worked. Falsifiable on purpose. */
  expectedOutcome: string;
  nova: NovaDirective;
}

export interface LearningDecision {
  subject: string;
  primary: NextAction;
  /** Everything else considered, ranked. Kept so a decision can be argued with. */
  alternatives: NextAction[];
  version: number;
}

// ─── Thresholds ──────────────────────────────────────────────────────────────

/** Above this share of solves coming off code-bearing hints, results are not theirs. */
const COPYING_SHARE = 0.4;
/** Above this share of solves needing level-2+ help. */
const DEPENDENCY_SHARE = 0.7;
/** Reaching for help faster than this, measured in seconds after the first failure. */
const FAST_HELP_SECONDS = 60;
/** Solo solves across distinct tasks before difficulty goes up. */
const CHALLENGE_SOLO_SOLVES = 3;

const NEVER_SAY = [
  // The line the brief singles out, and the general form of it.
  "You don't understand this",
  "You always get this wrong",
  "This is basic",
];

// ─── Nova directives ─────────────────────────────────────────────────────────

function askDirective(skill: string | null, reason: string): NovaDirective {
  return {
    mode: "ask",
    mayNameMisconception: false,
    namedMisconception: null,
    // Questions only. We have no diagnosis, so a hint would be a guess with a
    // confident voice.
    maxHintLevel: 0,
    mayIncludeCode: false,
    mustNotSay: [...NEVER_SAY, `Any claim about why they failed at ${skill ?? "this"}`],
    opening: reason,
  };
}

function explainDirective(misconception: MisconceptionObservation): NovaDirective {
  return {
    mode: "explain",
    mayNameMisconception: true,
    namedMisconception: misconception.failureClass,
    maxHintLevel: 2,
    mayIncludeCode: false,
    mustNotSay: [...NEVER_SAY],
    // The count is in the sentence because the count is the justification.
    opening:
      `This is the ${ordinal(misconception.distinctEpisodes)} time ` +
      `${humanize(misconception.failureClass)} has cost you a submission on ` +
      `${misconception.skill}.`,
  };
}

function withholdDirective(skill: string | null, opening: string, allowCode: boolean): NovaDirective {
  return {
    mode: "withhold",
    mayNameMisconception: false,
    namedMisconception: null,
    maxHintLevel: 1,
    mayIncludeCode: allowCode,
    mustNotSay: [...NEVER_SAY, `Any solution code for ${skill ?? "this task"}`],
    opening,
  };
}

function directDirective(skill: string): NovaDirective {
  return {
    mode: "direct",
    mayNameMisconception: false,
    namedMisconception: null,
    maxHintLevel: 1,
    mayIncludeCode: false,
    mustNotSay: [...NEVER_SAY],
    opening: `You've done ${skill} unaided more than once. Here's a harder one.`,
  };
}

function ordinal(n: number): string {
  if (n === 1) return "first";
  if (n === 2) return "second";
  if (n === 3) return "third";
  return `${n}th`;
}

/** Learner-facing wording for a failure class. Never the raw identifier. */
function humanize(failureClass: string): string {
  switch (failureClass) {
    case "edge_case_handling":
      return "a boundary case";
    case "complexity_asymptotic":
      return "the running time";
    case "compile_error":
      return "a compile error";
    case "runtime_error":
      return "a crash";
    case "memory_limit":
      return "memory";
    default:
      return "the same kind of failure";
  }
}

// ─── Decisions ───────────────────────────────────────────────────────────────

function assistanceOverride(state: LearnerState): NextAction | null {
  const { assistance, episodes } = state;
  const transferShare = episodes ? assistance.transferSolves / episodes : 0;
  const copying = transferShare >= COPYING_SHARE;
  const dependent =
    assistance.hintDependency >= DEPENDENCY_SHARE &&
    (assistance.medianSecondsToFirstHint ?? Infinity) < FAST_HELP_SECONDS;

  if (!copying && !dependent) return null;

  const evidence: EvidenceRef[] = [];
  if (copying) {
    evidence.push({
      kind: "intervention_outcome",
      detail:
        `${assistance.transferSolves} of ${episodes} episodes resolved by transfer ` +
        `— the winning edit came off a hint that carried code`,
    });
  }
  if (dependent) {
    evidence.push({
      kind: "assistance_profile",
      detail:
        `${Math.round(assistance.hintDependency * 100)}% of solves needed level-2+ help, ` +
        `requested a median ${assistance.medianSecondsToFirstHint}s after the first failure`,
    });
  }

  return {
    actionType: "REDUCE_ASSISTANCE",
    skill: null,
    reason: copying
      ? "Accepted submissions are arriving off code-bearing hints, so no skill conclusion drawn from them is trustworthy."
      : "Help is being requested before the learner has attempted the problem, so their solves measure our hints rather than their skill.",
    evidence,
    // Confidence in the DECISION. These are measured rates, not inferences.
    confidence: Math.min(0.95, Math.max(transferShare, assistance.hintDependency)),
    taskRequest: {
      skill: null,
      difficulty: "easier",
      requires: "any",
      purpose:
        "A task they can finish unaided, so the next data point measures them rather than the hint ladder.",
    },
    expectedOutcome:
      "An accepted episode with independence_weight 1.0 — a solve with no assistance recorded.",
    nova: withholdDirective(
      null,
      copying
        ? "I'll hold off on code for this one — let's get the shape of it from you first."
        : "Give it a real attempt before I say anything. What have you tried?",
      false
    ),
  };
}

function remediate(skill: SkillState, top: MisconceptionObservation): NextAction {
  return {
    actionType: "REMEDIATE",
    skill: skill.skill,
    reason:
      `${top.failureClass} recurred in ${top.distinctEpisodes} separate episodes on ` +
      `${skill.skill}, which is enough to act on.`,
    evidence: [
      {
        kind: "misconception",
        detail:
          `${top.failureClass} observed ${top.occurrences} times across ` +
          `${top.distinctEpisodes} episodes (pattern confidence ${top.confidence.toFixed(2)})`,
        episodeIds: top.episodeIds,
      },
      {
        kind: "skill_state",
        detail: skill.rationale,
      },
    ],
    // The decision inherits the misconception's confidence: acting on it is
    // exactly as justified as believing it.
    confidence: top.confidence,
    taskRequest: {
      skill: skill.skill,
      difficulty: "same",
      requires:
        top.failureClass === "edge_case_handling"
          ? "degenerate_cases"
          : top.failureClass === "complexity_asymptotic"
            ? "complexity_gate"
            : "any",
      purpose:
        `Practice that actually exercises ${humanize(top.failureClass)} — a task whose ` +
        `own test data cannot distinguish it would not measure the fix.`,
    },
    expectedOutcome:
      `${top.failureClass} does not recur in the next two episodes on ${skill.skill}.`,
    nova: explainDirective(top),
  };
}

function diagnose(skill: SkillState | null, state: LearnerState): NextAction {
  const evidence: EvidenceRef[] = [];
  let reason: string;

  if (!skill) {
    reason = "No skill has enough attempts to say anything.";
    evidence.push({ kind: "coverage", detail: `${state.episodes} episodes, no skill measured twice` });
  } else if (skill.level === "unknown") {
    reason = `Only ${skill.attempts} attempt(s) at ${skill.skill}.`;
    evidence.push({ kind: "skill_state", detail: skill.rationale });
  } else {
    // The common case, and the one worth being explicit about.
    reason =
      `${skill.failures} failure(s) on ${skill.skill} and ` +
      `${skill.failures - skill.attributedFailures} of them carry no cause, so there is ` +
      `nothing specific to teach.`;
    evidence.push({
      kind: "attribution_gap",
      detail:
        `${skill.attributedFailures} of ${skill.failures} failures attributed; ` +
        `the rest are unattributed_failure`,
    });
    evidence.push({ kind: "skill_state", detail: skill.rationale });
  }

  return {
    actionType: "DIAGNOSE",
    skill: skill?.skill ?? null,
    reason,
    evidence,
    // High on purpose. This is confidence that DIAGNOSING is right, and it is
    // high precisely because the evidence is thin — we are certain we do not
    // know. Reporting low confidence here would be the wrong quantity: it
    // would read as "we are unsure whether to measure", which we are not.
    confidence: 0.9,
    taskRequest: {
      skill: skill?.skill ?? null,
      difficulty: skill && skill.failures > 0 ? "easier" : "same",
      requires: "any",
      purpose:
        "A task that produces an attributable outcome — either a clean solo solve or a " +
        "failure the verification engine can name.",
    },
    expectedOutcome:
      "One more episode on this skill that ends in a solo solve or an attributed failure.",
    nova: askDirective(
      skill?.skill ?? null,
      skill && skill.failures > 0
        ? "I can see it isn't passing, but not why yet. What did you expect that test to print?"
        : "What's your plan for this one?"
    ),
  };
}

function strengthen(skill: SkillState): NextAction {
  return {
    actionType: "STRENGTHEN",
    skill: skill.skill,
    reason:
      `${skill.skill} has been solved ${skill.solved} time(s) but only across ` +
      `${skill.distinctTasks} task(s); it has not been shown to transfer.`,
    evidence: [
      { kind: "skill_state", detail: skill.rationale },
      {
        kind: "independence",
        detail: `${skill.soloSolved} unaided solve(s), ${skill.assistedSolved} assisted`,
      },
    ],
    confidence: Math.min(0.85, 0.4 + 0.15 * skill.soloSolved),
    taskRequest: {
      skill: skill.skill,
      difficulty: "same",
      requires: "any",
      purpose: "A different task on the same skill, to see whether the result repeats.",
    },
    expectedOutcome: `A solo solve on a ${skill.skill} task they have not attempted before.`,
    nova: withholdDirective(
      skill.skill,
      `You've got this once. Try this one without help and let's see if it sticks.`,
      false
    ),
  };
}

function challenge(skill: SkillState): NextAction {
  return {
    actionType: "CHALLENGE",
    skill: skill.skill,
    reason:
      `${skill.soloSolved} unaided solves across ${skill.distinctTasks} distinct ` +
      `${skill.skill} tasks, with no unresolved misconception.`,
    evidence: [
      { kind: "skill_state", detail: skill.rationale },
      {
        kind: "independence",
        detail: `${skill.soloSolved} unaided solves across ${skill.distinctTasks} tasks`,
      },
    ],
    confidence: Math.min(0.9, 0.5 + 0.1 * skill.soloSolved),
    taskRequest: {
      skill: skill.skill,
      difficulty: "harder",
      requires: "any",
      purpose: "Difficulty above the band they have been working in.",
    },
    expectedOutcome:
      `Either a solo solve at higher difficulty, or the first attributed failure at ` +
      `that level — both are useful, and the second is more so.`,
    nova: directDirective(skill.skill),
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

function decideForSkill(skill: SkillState): NextAction | null {
  const actionable = skill.misconceptions.filter((m) => m.actionable);
  if (actionable.length > 0) return remediate(skill, actionable[0]);

  if (skill.level === "unknown") return null; // handled by the global diagnose path
  if (skill.level === "developing") return null; // ditto: nothing specific to teach
  if (skill.level === "strong" && skill.soloSolved >= CHALLENGE_SOLO_SOLVES) {
    return challenge(skill);
  }
  if (skill.solved > 0) return strengthen(skill);
  return null;
}

/**
 * Decide what should happen next for one learner.
 *
 * Returns a primary action plus every alternative considered, ranked, so a
 * decision can be argued with rather than merely obeyed.
 */
export function decide(state: LearnerState): LearningDecision {
  const candidates: NextAction[] = [];

  const override = assistanceOverride(state);
  if (override) candidates.push(override);

  for (const skill of state.skills) {
    const action = decideForSkill(skill);
    if (action) candidates.push(action);
  }

  // Skills we cannot say anything specific about. The dominant case today, so
  // it gets a real decision rather than a fallback.
  const undiagnosed = state.skills.filter(
    (s) =>
      s.misconceptions.every((m) => !m.actionable) &&
      (s.level === "unknown" || s.level === "developing")
  );
  if (undiagnosed.length > 0) {
    // Most attempts first: the skill they are actually spending time on.
    const target = [...undiagnosed].sort((a, b) => b.attempts - a.attempts)[0];
    candidates.push(diagnose(target, state));
  }

  if (candidates.length === 0) candidates.push(diagnose(null, state));

  candidates.sort((a, b) => {
    const byPriority = PRIORITY[a.actionType] - PRIORITY[b.actionType];
    return byPriority !== 0 ? byPriority : b.confidence - a.confidence;
  });

  return {
    subject: state.subject,
    primary: candidates[0],
    alternatives: candidates.slice(1),
    version: DECISION_ENGINE_VERSION,
  };
}

/**
 * The guard the brief asks for, as a function rather than a guideline.
 *
 * Nova may assert a misconception only where one cleared the actionable
 * threshold. Everywhere else the honest register is a question, which at 75%
 * unattributed is most of the time.
 */
export function mayAssertMisconception(action: NextAction): boolean {
  return action.nova.mayNameMisconception && action.nova.namedMisconception !== null;
}
