/**
 * L4: what we know about a learner, as opposed to an attempt.
 *
 * The coverage analysis found that every learner-level question — does this
 * person repeat a mistake, can they finish anything unaided, are they getting
 * better — is derivable from events the pipeline already stores, and that
 * nothing computes any of it. This is the missing layer, and it is deliberately
 * the smallest version that is honest.
 *
 * THREE RULES, and they are the whole design:
 *
 * 1. **A misconception is an OBSERVED failure class, never a new label.**
 *    `failureClass` here is a value the verification engine already emitted.
 *    Nothing in this file invents a category, infers one from code, or asks a
 *    model. If the engine could not say why a submission failed, that failure
 *    contributes nothing at all.
 *
 * 2. **Confidence only ever rises from counted evidence.** It is built from the
 *    number of distinct episodes an attribution recurred across and the
 *    confidence the engine assigned each one. Zero-confidence evidence stays at
 *    zero however often it repeats, and a single observation is never enough.
 *
 * 3. **`unknown` is a state, not a zero.** A learner we have not measured and a
 *    learner measured as weak must never render the same, because they need
 *    opposite responses: one needs a task, the other needs teaching.
 *
 * A pure function of episode output, like every other reducer here, so it is
 * replayable and `LEARNER_STATE_VERSION` can invalidate it wholesale.
 */

import type { ReducedEpisode } from "./episode";
import type { ComputedOutcome, InterventionOutcome } from "./interventionOutcome";

/** Bump when any derived field below changes meaning. */
export const LEARNER_STATE_VERSION = 1;

/** Below this, a misconception is recorded but not acted on. */
export const ACTIONABLE_CONFIDENCE = 0.6;

export type SkillLevel = "unknown" | "developing" | "competent" | "strong";

export interface MisconceptionObservation {
  /**
   * The failure class the verification engine emitted. One of the values in
   * `FAILURE_CLASSES`; never anything this module made up.
   */
  failureClass: string;
  skill: string;
  /** Total attributed failures of this kind. */
  occurrences: number;
  /** Episodes they were spread across. This is what confidence is built on. */
  distinctEpisodes: number;
  /** Mean confidence of the individual attributions underneath. */
  evidenceConfidence: number;
  /**
   * Confidence that the learner has a RECURRING problem of this kind — a
   * different quantity from `evidenceConfidence`, which is about one failure.
   * Zero on a single observation, and capped below certainty.
   */
  confidence: number;
  actionable: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  episodeIds: string[];
}

export interface SkillState {
  skill: string;
  level: SkillLevel;
  attempts: number;
  solved: number;
  soloSolved: number;
  assistedSolved: number;
  failures: number;
  /** Failures the engine could name. The rest are invisible to this layer. */
  attributedFailures: number;
  distinctTasks: number;
  misconceptions: MisconceptionObservation[];
  /** Plain-language justification, built from the same counts as `level`. */
  rationale: string;
}

export interface AssistanceProfile {
  interventions: number;
  /** Share of solved episodes that needed a hint at level 2 or above. */
  hintDependency: number;
  /** Median seconds from first failing verdict to first hint request. */
  medianSecondsToFirstHint: number | null;
  /** Solves where the winning edit came off a code-bearing hint. */
  transferSolves: number;
  outcomeCounts: Record<InterventionOutcome, number>;
}

export interface LearnerState {
  subject: string;
  episodes: number;
  skills: SkillState[];
  assistance: AssistanceProfile;
  /**
   * Failures the engine could not explain. Surfaced at the top level because
   * it is the honest denominator for everything else here: at 75% this state
   * is built on a quarter of what happened.
   */
  unattributedFailures: number;
  version: number;
}

export interface EpisodeInput {
  episodeId: string;
  /** Taxonomy skill for the task. Episodes without one are skipped. */
  skill: string | null;
  taskRef: string;
  episode: ReducedEpisode;
  outcomes: readonly ComputedOutcome[];
  /** Seconds from the first failing verdict to the first hint, when both exist. */
  secondsToFirstHint?: number | null;
}

const EMPTY_OUTCOMES: Record<InterventionOutcome, number> = {
  resolved_independently: 0,
  resolved_by_transfer: 0,
  progressed: 0,
  escalated: 0,
  stalled: 0,
  regressed: 0,
  abandoned: 0,
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * How confident are we that this learner has a RECURRING problem of this kind?
 *
 * Note carefully what this is not. `evidenceConfidence` answers "how sure are we
 * that this particular failure was an edge case?" — a property of one
 * attribution. This answers something different: "does this person keep doing
 * it?" Conflating the two was the first version's bug. It capped pattern
 * confidence at the per-observation ceiling, so a class the engine always
 * reports at 0.6 could be seen in ten separate episodes and still never become
 * actionable at a 0.6 threshold. Ten independent observations plainly say more
 * than one.
 *
 * The model: each observation is a true positive with probability
 * `evidenceConfidence`; a pattern needs at least two. So confidence is
 * 1 − P(fewer than two true positives) under Binomial(n, p), which rises with
 * evidence, is zero on a single observation, and cannot be manufactured — with
 * p = 0 it stays 0 no matter how many times it repeats.
 *
 * Capped below certainty: we are counting attributions, not running an
 * experiment, and the observations are not fully independent.
 */
const MAX_PATTERN_CONFIDENCE = 0.95;

export function observationConfidence(
  distinctEpisodes: number,
  evidenceConfidence: number
): number {
  const n = distinctEpisodes;
  const p = evidenceConfidence;
  if (n <= 1 || p <= 0) return 0;
  if (p >= 1) return MAX_PATTERN_CONFIDENCE;

  const noneTrue = Math.pow(1 - p, n);
  const exactlyOneTrue = n * p * Math.pow(1 - p, n - 1);
  return Math.min(MAX_PATTERN_CONFIDENCE, 1 - noneTrue - exactlyOneTrue);
}

interface SkillAccumulator {
  attempts: number;
  solved: number;
  soloSolved: number;
  assistedSolved: number;
  failures: number;
  attributedFailures: number;
  tasks: Set<string>;
  byClass: Map<
    string,
    {
      occurrences: number;
      episodes: Set<string>;
      confidenceSum: number;
      firstSeenAt: string;
      lastSeenAt: string;
    }
  >;
}

function emptySkill(): SkillAccumulator {
  return {
    attempts: 0,
    solved: 0,
    soloSolved: 0,
    assistedSolved: 0,
    failures: 0,
    attributedFailures: 0,
    tasks: new Set(),
    byClass: new Map(),
  };
}

/**
 * Coarse, and deliberately not a 0–100 score.
 *
 * The brief asked for `mastery: 0.62`. Nothing available supports a second
 * decimal place: three quarters of failures carry no cause, and there is no
 * difficulty calibration to weight a solve by. A number would be a shape
 * without evidence behind it — the exact thing this pipeline exists to avoid.
 * Four states can be defended from counts alone, so four states is what this
 * returns.
 */
function levelFor(acc: SkillAccumulator, blocking: MisconceptionObservation[]): SkillLevel {
  if (acc.attempts < 2) return "unknown";
  if (acc.soloSolved === 0) return "developing";
  if (blocking.length > 0) return "developing";
  // Competence has to survive the failures, not just count the wins. Without
  // this clause a learner who abandoned eight problems and finished two came
  // out `competent`, because the level read solve counts and never looked at
  // what it cost to get them. Finishing more often than not is the floor.
  if (acc.solved * 2 < acc.attempts) return "developing";
  if (acc.soloSolved >= 3 && acc.tasks.size >= 3) return "strong";
  return "competent";
}

function rationaleFor(
  skill: string,
  acc: SkillAccumulator,
  level: SkillLevel,
  blocking: MisconceptionObservation[]
): string {
  if (level === "unknown") {
    return `Only ${acc.attempts} attempt(s) at ${skill}; not enough to say anything.`;
  }
  const parts: string[] = [
    `${acc.soloSolved} unaided solve(s) and ${acc.assistedSolved} assisted, across ${acc.tasks.size} task(s)`,
  ];
  if (blocking.length > 0) {
    const top = blocking[0];
    parts.push(
      `${top.failureClass} seen in ${top.distinctEpisodes} separate episode(s)`
    );
  }
  if (acc.failures > acc.attributedFailures) {
    parts.push(`${acc.failures - acc.attributedFailures} failure(s) with no known cause`);
  }
  return `${parts.join("; ")}.`;
}

/**
 * Build a learner's state from their episodes.
 *
 * Episodes with no skill mapping are counted toward assistance but contribute
 * to no skill: attaching evidence to a skill we cannot name is how a belief
 * ends up describing the wrong thing.
 */
export function buildLearnerState(subject: string, inputs: readonly EpisodeInput[]): LearnerState {
  const skills = new Map<string, SkillAccumulator>();
  const outcomeCounts: Record<InterventionOutcome, number> = { ...EMPTY_OUTCOMES };
  const hintDelays: number[] = [];

  let interventions = 0;
  let transferSolves = 0;
  let solvedEpisodes = 0;
  let assistedSolvedEpisodes = 0;
  let unattributedFailures = 0;

  for (const input of inputs) {
    const { episode } = input;
    const solved = episode.outcome === "accepted";
    if (solved) {
      solvedEpisodes += 1;
      if (episode.max_assistance_level >= 2) assistedSolvedEpisodes += 1;
    }

    interventions += episode.intervention_count;
    if (typeof input.secondsToFirstHint === "number" && input.secondsToFirstHint >= 0) {
      hintDelays.push(input.secondsToFirstHint);
    }
    for (const outcome of input.outcomes) {
      outcomeCounts[outcome.outcome] += 1;
      if (outcome.outcome === "resolved_by_transfer") transferSolves += 1;
    }

    const failures = episode.verdict_sequence.filter((v) => v.verdict !== "accepted").length;
    const attributed = episode.attributions.filter(
      (a) => a.failure_class !== "unattributed_failure"
    );
    unattributedFailures += episode.attributions.filter(
      (a) => a.failure_class === "unattributed_failure"
    ).length;

    if (!input.skill) continue;
    const acc = skills.get(input.skill) ?? emptySkill();
    skills.set(input.skill, acc);

    acc.attempts += 1;
    acc.tasks.add(input.taskRef);
    acc.failures += failures;
    acc.attributedFailures += attributed.length;
    if (solved) {
      acc.solved += 1;
      // Assistance provenance decides whether a solve is theirs. A revealed
      // solution or a Builder patch is recorded and credited to nobody.
      if (episode.independence_weight >= 1) acc.soloSolved += 1;
      else acc.assistedSolved += 1;
    }

    for (const attribution of attributed) {
      const entry = acc.byClass.get(attribution.failure_class) ?? {
        occurrences: 0,
        episodes: new Set<string>(),
        confidenceSum: 0,
        firstSeenAt: attribution.at,
        lastSeenAt: attribution.at,
      };
      entry.occurrences += 1;
      entry.episodes.add(input.episodeId);
      entry.confidenceSum += attribution.confidence;
      if (attribution.at < entry.firstSeenAt) entry.firstSeenAt = attribution.at;
      if (attribution.at > entry.lastSeenAt) entry.lastSeenAt = attribution.at;
      acc.byClass.set(attribution.failure_class, entry);
    }
  }

  const skillStates: SkillState[] = [];
  for (const [skill, acc] of skills) {
    const misconceptions: MisconceptionObservation[] = [];
    for (const [failureClass, entry] of acc.byClass) {
      const evidenceConfidence = entry.confidenceSum / entry.occurrences;
      const confidence = observationConfidence(entry.episodes.size, evidenceConfidence);
      misconceptions.push({
        failureClass,
        skill,
        occurrences: entry.occurrences,
        distinctEpisodes: entry.episodes.size,
        evidenceConfidence,
        confidence,
        actionable: confidence >= ACTIONABLE_CONFIDENCE,
        firstSeenAt: entry.firstSeenAt,
        lastSeenAt: entry.lastSeenAt,
        episodeIds: [...entry.episodes],
      });
    }
    misconceptions.sort((a, b) => b.confidence - a.confidence);
    const blocking = misconceptions.filter((m) => m.actionable);
    const level = levelFor(acc, blocking);

    skillStates.push({
      skill,
      level,
      attempts: acc.attempts,
      solved: acc.solved,
      soloSolved: acc.soloSolved,
      assistedSolved: acc.assistedSolved,
      failures: acc.failures,
      attributedFailures: acc.attributedFailures,
      distinctTasks: acc.tasks.size,
      misconceptions,
      rationale: rationaleFor(skill, acc, level, blocking),
    });
  }
  skillStates.sort((a, b) => a.skill.localeCompare(b.skill));

  return {
    subject,
    episodes: inputs.length,
    skills: skillStates,
    assistance: {
      interventions,
      hintDependency: solvedEpisodes ? assistedSolvedEpisodes / solvedEpisodes : 0,
      medianSecondsToFirstHint: median(hintDelays),
      transferSolves,
      outcomeCounts,
    },
    unattributedFailures,
    version: LEARNER_STATE_VERSION,
  };
}

// ─── Hint effectiveness ──────────────────────────────────────────────────────
//
// Pure counting over the existing ledger. No inference, nothing invented: every
// input is an outcome the attribution window already computed.

export interface HintLevelEffectiveness {
  level: number;
  delivered: number;
  /** AC after a real edit that was not largely the hint's own code. */
  resolvedIndependently: number;
  /** AC by pasting. A product success and a learning failure. */
  resolvedByTransfer: number;
  escalated: number;
  stalled: number;
  regressed: number;
  /** `resolvedIndependently / delivered`. The only success worth the name. */
  successRate: number;
  /** Share that pushed the learner backwards. The most expensive outcome. */
  harmRate: number;
  /**
   * Share where the learner immediately asked for more. A high value means the
   * rung was too weak or arrived too early — this is the bad-hint signal.
   */
  escalationRate: number;
}

export interface HintEffectivenessReport {
  byLevel: HintLevelEffectiveness[];
  totalDelivered: number;
  /** Levels whose escalation or harm rate exceeds the flag threshold. */
  flagged: { level: number; reason: string }[];
}

/** Above this share of escalations, a rung is not doing its job. */
const ESCALATION_FLAG = 0.4;
/** Any measurable harm rate is worth surfacing; hints should not cost progress. */
const HARM_FLAG = 0.1;

export function hintEffectiveness(
  rows: readonly { level: number | null; outcome: InterventionOutcome }[]
): HintEffectivenessReport {
  const byLevel = new Map<number, HintLevelEffectiveness>();

  for (const row of rows) {
    if (row.level === null) continue;
    const entry =
      byLevel.get(row.level) ??
      {
        level: row.level,
        delivered: 0,
        resolvedIndependently: 0,
        resolvedByTransfer: 0,
        escalated: 0,
        stalled: 0,
        regressed: 0,
        successRate: 0,
        harmRate: 0,
        escalationRate: 0,
      };
    entry.delivered += 1;
    if (row.outcome === "resolved_independently") entry.resolvedIndependently += 1;
    if (row.outcome === "resolved_by_transfer") entry.resolvedByTransfer += 1;
    if (row.outcome === "escalated") entry.escalated += 1;
    if (row.outcome === "stalled") entry.stalled += 1;
    if (row.outcome === "regressed") entry.regressed += 1;
    byLevel.set(row.level, entry);
  }

  const flagged: { level: number; reason: string }[] = [];
  for (const entry of byLevel.values()) {
    entry.successRate = entry.delivered ? entry.resolvedIndependently / entry.delivered : 0;
    entry.harmRate = entry.delivered ? entry.regressed / entry.delivered : 0;
    entry.escalationRate = entry.delivered ? entry.escalated / entry.delivered : 0;
    if (entry.escalationRate > ESCALATION_FLAG) {
      flagged.push({
        level: entry.level,
        reason: `${Math.round(entry.escalationRate * 100)}% of these are followed by a request for more help`,
      });
    }
    if (entry.harmRate > HARM_FLAG) {
      flagged.push({
        level: entry.level,
        reason: `${Math.round(entry.harmRate * 100)}% left the learner passing fewer tests than before`,
      });
    }
  }

  return {
    byLevel: [...byLevel.values()].sort((a, b) => a.level - b.level),
    totalDelivered: rows.filter((r) => r.level !== null).length,
    flagged,
  };
}
