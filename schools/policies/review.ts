import type { BlockType } from "@schools/curriculum/types";
import type { SchoolTaskKind } from "@schools/learning/taskRef";

/**
 * Delayed re-solve — the programme's fifth independence check.
 *
 * The approved programme is unambiguous about it (PDF p.6):
 *
 *   «Көмекпен шешілген есеп бірнеше аптадан соң қайта беріледі және бұл жолы
 *    көмексіз орындалады»
 *
 *   — a task solved WITH HELP is given again after some weeks, and this time it
 *     is done WITHOUT help.
 *
 * and again on p.4: «бірнеше күннен кейін сол есепті көмексіз қайта шешуге
 * міндетті». The audit recorded it as the one requirement with nothing behind
 * it at all (`SEPTEMBER_REMEDIATION_REPORT.md` §7, item 1) and said why: it
 * needs scheduling infrastructure the product had no shape for, and inventing a
 * `delayed_resolve` enum value that nothing schedules would have been worse
 * than an honest gap.
 *
 * This module is the rule. It is pure: it decides whether a solved task earns a
 * re-solve and when that re-solve is due, and it neither reads a database nor
 * knows one exists.
 *
 * ## Eligibility comes from recorded evidence, never from a guess
 *
 * Two paths in, and both are things the ledger can prove happened:
 *
 * 1. **Solved with assistance.** An `assistance_delivered` event on the same
 *    episode that was accepted. That event is emitted by the hint route only
 *    once tokens have actually reached the learner — asking for help that never
 *    arrived is not assistance, and the route is explicit about the
 *    distinction. The `interventions` row carries the LEVEL, which is stored
 *    beside the schedule so a teacher can see how much help the original solve
 *    took.
 *
 * 2. **Solved independently, on a task that carries weight.** Re-solving
 *    everything would be a treadmill; the programme asks for old problems to
 *    come back, not for all of them to. So the independent path is narrow and
 *    declared in content rather than inferred: the monthly check's blocks, and
 *    `challenge` blocks — the two kinds September authored as "this is the one
 *    that proves it". Six blocks in September, which is a queue a
 *    fourteen-year-old will actually work through.
 *
 * A task that was never solved is not scheduled at all. Re-solving something
 * the learner never solved is not a re-solve, it is the same task again, and
 * the lesson already offers that.
 *
 * ## About the delay
 *
 * The numbers below are **product defaults**, not findings. The programme says
 * «бірнеше аптадан соң» — after several weeks — and says it about a course that
 * runs from September to May. The September pilot is one month long, so a
 * three-week delay would put every scheduled review past the end of the pilot
 * and the feature would ship without a single learner ever seeing one. Five
 * days is chosen so a review lands inside the same month, in the middle of the
 * 3–7 day band the pilot agreed. It is a compromise with the calendar, and it
 * is a knob so that a school running the full year can set it to what the
 * programme actually says.
 *
 * Nothing here claims a spacing interval is optimal, because nothing in this
 * product has measured one.
 */

export type ReviewReason = "solved_with_assistance" | "independent_milestone";

export interface ReviewPolicy {
  readonly id: string;
  /**
   * Days before a task solved WITH help comes back.
   *
   * Product default. See the note above: it is a pilot-calendar number, not a
   * research one.
   */
  readonly assistedDelayDays: number;
  /** Days before an independently-solved milestone comes back. */
  readonly independentDelayDays: number;
  /**
   * Block types whose independent solve is worth re-checking.
   *
   * Declared, not inferred. `challenge` is the type September uses for "this
   * is the one that proves it"; `verify` is the programme's own independence
   * check and is what the monthly assessment is built from.
   */
  readonly milestoneTypes: readonly BlockType[];
  /**
   * Task kinds whose independent solve is worth re-checking whatever the block
   * type. The monthly check is the obvious one.
   */
  readonly milestoneKinds: readonly SchoolTaskKind[];
}

export const REVIEW_POLICY: ReviewPolicy = {
  id: "review.v1",
  assistedDelayDays: 5,
  independentDelayDays: 14,
  milestoneTypes: ["challenge", "verify"],
  milestoneKinds: ["assessment"],
};

/** What the ledger says about the solve that just happened. */
export interface SolveEvidence {
  blockId: string;
  blockType: BlockType;
  taskKind: SchoolTaskKind;
  /** The verdict was `accepted`. Anything else is not a solve. */
  solved: boolean;
  /**
   * An `assistance_delivered` event exists on this episode.
   *
   * Delivery, not request. A hint the learner asked for and never received is
   * not help they had.
   */
  assistanceDelivered: boolean;
  /** Highest hint level actually delivered on this episode, or -1. */
  assistanceLevel: number;
}

export interface ReviewSchedule {
  reason: ReviewReason;
  /** ISO. `solvedAt` plus the policy's delay for that reason. */
  dueAt: string;
  assistanceLevel: number;
}

/**
 * Should this solve come back, and when?
 *
 * Returns null far more often than not — most practice tasks are solved
 * unaided and are not milestones, and that is the intended behaviour rather
 * than a gap. A review queue that fills with everything is a queue nobody
 * opens.
 */
export function scheduleFor(
  evidence: SolveEvidence,
  solvedAt: Date,
  policy: ReviewPolicy = REVIEW_POLICY,
): ReviewSchedule | null {
  if (!evidence.solved) return null;

  if (evidence.assistanceDelivered) {
    return {
      reason: "solved_with_assistance",
      dueAt: addDays(solvedAt, policy.assistedDelayDays),
      assistanceLevel: evidence.assistanceLevel,
    };
  }

  const isMilestone =
    policy.milestoneKinds.includes(evidence.taskKind) ||
    policy.milestoneTypes.includes(evidence.blockType);

  if (!isMilestone) return null;

  return {
    reason: "independent_milestone",
    dueAt: addDays(solvedAt, policy.independentDelayDays),
    /* -1 is the ledger's own "no assistance requested" sentinel, the same value
       `attempt_episodes.max_assistance_level` defaults to. Writing 0 here would
       claim a level-0 hint was given. */
    assistanceLevel: -1,
  };
}

/**
 * Is a scheduled review due?
 *
 * Trivial, and exported anyway: the store filters in SQL and the browser
 * filters in JavaScript, and "due" meaning two slightly different things at the
 * two ends is exactly the sort of drift that shows up as a count that does not
 * match its own list.
 */
export function isDue(dueAtIso: string, now: Date): boolean {
  return new Date(dueAtIso).getTime() <= now.getTime();
}

function addDays(from: Date, days: number): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
