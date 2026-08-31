/**
 * Did the action we took actually work?
 *
 * The intervention ledger already answers this for a single hint. This answers
 * it for a DECISION: we chose to DIAGNOSE this learner on this skill, and every
 * action carries a falsifiable `expectedOutcome` — so the honest thing is to go
 * back later and check.
 *
 * NOT A PREDICTOR. Nothing here forecasts whether an action will work. It
 * records what was decided, waits, and reads what happened, which is the only
 * way to find out.
 *
 * THE POINT OF CHECKING
 * Without it the decision engine is unfalsifiable. It would keep issuing
 * DIAGNOSE forever to a learner it never learns anything about, and nothing in
 * the system would notice. `verdict: "not_yet"` is a first-class result for
 * exactly that reason: an action with no follow-up episodes is unevaluated, not
 * failed, and conflating the two would make a quiet week look like a broken
 * engine.
 */

import type { ActionType } from "./decisionEngine";
import type { ReducedEpisode } from "./episode";

export const INTERVENTION_MEMORY_VERSION = 1;

/** One decision, as taken. Written when the action is issued. */
export interface ActionRecord {
  actionId: string;
  subject: string;
  actionType: ActionType;
  skill: string | null;
  /** Copied from the action so a later reading cannot quietly change the bar. */
  expectedOutcome: string;
  /** Misconception the action named, when it named one. */
  namedMisconception: string | null;
  /** Confidence the engine had when it decided. */
  confidence: number;
  issuedAt: string;
}

export type ActionVerdict =
  /** The expected observation happened. */
  | "worked"
  /** Enough follow-up to judge, and it did not. */
  | "did_not_work"
  /** Not enough follow-up yet. Never counted as a failure. */
  | "not_yet";

export interface ActionOutcome {
  actionId: string;
  actionType: ActionType;
  verdict: ActionVerdict;
  /** What was actually observed, in the same terms as the expectation. */
  observed: string;
  /** Episodes examined. Zero means `not_yet` by definition. */
  episodesConsidered: number;
  checkedAt: string;
}

/**
 * Follow-up episodes must be enough to judge on. Two is the smallest number
 * that can distinguish "the misconception is gone" from "they got lucky once".
 */
const MIN_FOLLOW_UP_EPISODES = 2;

export interface FollowUpEpisode {
  episodeId: string;
  skill: string | null;
  episode: ReducedEpisode;
}

function relevant(record: ActionRecord, episodes: readonly FollowUpEpisode[]): FollowUpEpisode[] {
  if (record.skill === null) return [...episodes];
  return episodes.filter((e) => e.skill === record.skill);
}

/**
 * Check one action against what the learner did afterwards.
 *
 * Each branch reads the same observation the action's `expectedOutcome` names —
 * these are not separate criteria, they are the criterion written twice so a
 * reader can see they match.
 */
export function verifyAction(
  record: ActionRecord,
  followUp: readonly FollowUpEpisode[]
): ActionOutcome {
  const episodes = relevant(record, followUp);
  const base = {
    actionId: record.actionId,
    actionType: record.actionType,
    episodesConsidered: episodes.length,
    checkedAt: new Date(0).toISOString(),
  };

  if (episodes.length === 0) {
    return { ...base, verdict: "not_yet", observed: "No follow-up episodes on this skill yet." };
  }

  switch (record.actionType) {
    case "DIAGNOSE": {
      // Expected: one more episode ending in a solo solve OR an attributed
      // failure. Either outcome produces evidence, which is the entire aim —
      // an attributed failure is a better result here than a lucky solve.
      const attributed = episodes.filter((e) =>
        e.episode.attributions.some((a) => a.failure_class !== "unattributed_failure")
      ).length;
      const soloSolves = episodes.filter(
        (e) => e.episode.outcome === "accepted" && e.episode.independence_weight >= 1
      ).length;
      if (attributed > 0 || soloSolves > 0) {
        return {
          ...base,
          verdict: "worked",
          observed: `${attributed} attributed failure(s) and ${soloSolves} unaided solve(s) — evidence acquired.`,
        };
      }
      return {
        ...base,
        verdict: "did_not_work",
        observed: `${episodes.length} more episode(s) and still nothing attributable.`,
      };
    }

    case "REMEDIATE": {
      // Expected: the named class does not recur.
      if (episodes.length < MIN_FOLLOW_UP_EPISODES) {
        return { ...base, verdict: "not_yet", observed: "One episode is not enough to call it." };
      }
      const named = record.namedMisconception;
      const recurred = named
        ? episodes.filter((e) => e.episode.attributions.some((a) => a.failure_class === named)).length
        : 0;
      return recurred === 0
        ? { ...base, verdict: "worked", observed: `${named} did not recur in ${episodes.length} episodes.` }
        : { ...base, verdict: "did_not_work", observed: `${named} recurred ${recurred} more time(s).` };
    }

    case "STRENGTHEN": {
      // Expected: a solo solve on a task not seen before.
      const soloOnNewTask = episodes.filter(
        (e) => e.episode.outcome === "accepted" && e.episode.independence_weight >= 1
      ).length;
      if (soloOnNewTask > 0) {
        return { ...base, verdict: "worked", observed: `${soloOnNewTask} unaided solve(s) on new tasks.` };
      }
      return episodes.length < MIN_FOLLOW_UP_EPISODES
        ? { ...base, verdict: "not_yet", observed: "Only one follow-up so far." }
        : { ...base, verdict: "did_not_work", observed: "No unaided solve in the follow-up episodes." };
    }

    case "CHALLENGE": {
      // Expected: a solo solve at higher difficulty OR a first attributed
      // failure there. Both are useful and the second is more so — a challenge
      // that produces a nameable failure has taught us something a solve
      // would not.
      const informative = episodes.filter(
        (e) =>
          (e.episode.outcome === "accepted" && e.episode.independence_weight >= 1) ||
          e.episode.attributions.some((a) => a.failure_class !== "unattributed_failure")
      ).length;
      return informative > 0
        ? { ...base, verdict: "worked", observed: `${informative} informative episode(s) at the new level.` }
        : { ...base, verdict: "did_not_work", observed: "Nothing informative came back." };
    }

    case "REDUCE_ASSISTANCE": {
      // Expected: an accepted episode with independence_weight 1.0.
      const unaided = episodes.filter(
        (e) => e.episode.outcome === "accepted" && e.episode.independence_weight >= 1
      ).length;
      if (unaided > 0) {
        return { ...base, verdict: "worked", observed: `${unaided} accepted episode(s) with no assistance recorded.` };
      }
      return episodes.length < MIN_FOLLOW_UP_EPISODES
        ? { ...base, verdict: "not_yet", observed: "Only one follow-up so far." }
        : { ...base, verdict: "did_not_work", observed: "Still no unaided solve." };
    }
  }
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export interface ActionEffectiveness {
  actionType: ActionType;
  issued: number;
  worked: number;
  didNotWork: number;
  notYet: number;
  /**
   * `worked / (worked + didNotWork)`.
   *
   * `not_yet` is excluded from the denominator on purpose. Counting unevaluated
   * actions as failures would make a quiet week look like a regression, and
   * would push whoever reads this toward acting on noise.
   */
  successRate: number | null;
}

export function actionEffectiveness(
  outcomes: readonly ActionOutcome[]
): ActionEffectiveness[] {
  const byType = new Map<ActionType, ActionEffectiveness>();
  for (const outcome of outcomes) {
    const entry =
      byType.get(outcome.actionType) ??
      {
        actionType: outcome.actionType,
        issued: 0,
        worked: 0,
        didNotWork: 0,
        notYet: 0,
        successRate: null,
      };
    entry.issued += 1;
    if (outcome.verdict === "worked") entry.worked += 1;
    if (outcome.verdict === "did_not_work") entry.didNotWork += 1;
    if (outcome.verdict === "not_yet") entry.notYet += 1;
    byType.set(outcome.actionType, entry);
  }

  for (const entry of byType.values()) {
    const judged = entry.worked + entry.didNotWork;
    entry.successRate = judged > 0 ? entry.worked / judged : null;
  }
  return [...byType.values()].sort((a, b) => a.actionType.localeCompare(b.actionType));
}

// ─── Effect on the next decision ─────────────────────────────────────────────

/**
 * What a past outcome is allowed to change about the next decision.
 *
 * Deliberately narrow. The brief's example — "outcome: learner identified
 * mistake → next time increase confidence" — is the tempting version and it is
 * wrong: raising a misconception's confidence because an *intervention* went
 * well would let the engine talk itself into certainty it never observed.
 * Confidence in a misconception comes from attributed failures and nothing
 * else.
 *
 * What a past outcome legitimately changes is which action to try NEXT, which
 * is a different quantity:
 *
 *   REMEDIATE worked        -> the misconception may be resolved; re-measure
 *                              before naming it again
 *   REMEDIATE did not work  -> teaching it that way did not land; do not simply
 *                              repeat the same explanation
 *   DIAGNOSE did not work   -> the task did not produce evidence; a different
 *                              task is needed, not a louder hint
 *   REDUCE_ASSISTANCE worked-> the dependency reading is stale; re-measure
 *
 * Each is a hint about the ENGINE's next move, not a belief about the learner.
 */
export interface MemoryAdvice {
  /** Do not re-issue this action for this skill without new evidence. */
  avoidRepeat: boolean;
  /** Re-measure before asserting the misconception again. */
  remeasure: boolean;
  note: string;
}

export function adviseFromOutcome(outcome: ActionOutcome): MemoryAdvice {
  if (outcome.verdict === "not_yet") {
    return { avoidRepeat: false, remeasure: false, note: "Not evaluated yet; nothing to learn from." };
  }

  const worked = outcome.verdict === "worked";
  switch (outcome.actionType) {
    case "REMEDIATE":
      return worked
        ? {
            avoidRepeat: true,
            remeasure: true,
            note: "The named class stopped recurring. Re-measure before naming it again — it may be resolved.",
          }
        : {
            avoidRepeat: true,
            remeasure: false,
            note: "It recurred after being explained. Repeating the same explanation is unlikely to help.",
          };
    case "DIAGNOSE":
      return worked
        ? { avoidRepeat: false, remeasure: false, note: "Evidence acquired; the next decision has more to work with." }
        : {
            avoidRepeat: true,
            remeasure: false,
            note: "The task produced nothing attributable. Try a different task, not a bigger hint.",
          };
    case "REDUCE_ASSISTANCE":
      return worked
        ? { avoidRepeat: false, remeasure: true, note: "They solved something unaided; the dependency reading is stale." }
        : { avoidRepeat: false, remeasure: false, note: "Still leaning on help. Keep the cap." };
    case "STRENGTHEN":
    case "CHALLENGE":
      return worked
        ? { avoidRepeat: false, remeasure: false, note: "Held up. Continue." }
        : { avoidRepeat: true, remeasure: true, note: "Did not hold up at that level; re-measure before pushing again." };
  }
}
