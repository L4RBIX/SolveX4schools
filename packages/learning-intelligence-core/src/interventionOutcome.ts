/**
 * Did the hint help?
 *
 * The question SolveX currently cannot answer at all: `help_level` is written
 * to `copilot_messages` and never read back against what happened next. Not
 * under-measured — structurally unanswerable, because nothing records the
 * learner's state at the moment we intervened.
 *
 * The attribution window is fixed HERE, in code, and copied onto every row as
 * `window_spec`. That is deliberate: a window chosen after seeing the data can
 * be widened until the numbers flatter us, and a stored spec makes any later
 * change visible in a diff.
 */

import type { DiffClass, LearningVerdict } from "@solvex/learning-contracts";
import type { ReducibleEvent } from "./episode";

export const OUTCOME_REDUCER_VERSION = 1;

/** Same episode, at most 20 active minutes, at most 3 submissions. */
export const WINDOW_SPEC = "same_episode/20min_active/3_submissions";
const WINDOW_SECONDS = 20 * 60;
const WINDOW_SUBMISSIONS = 3;

export type InterventionOutcome =
  | "resolved_independently"
  | "resolved_by_transfer"
  | "progressed"
  | "escalated"
  | "stalled"
  | "regressed"
  | "abandoned";

export interface InterventionInput {
  intervention_id: string;
  episode_id: string;
  level: number | null;
  contains_code: boolean;
  delivered_at: string;
  /** Passing-test count at the moment of the hint, when the judge reported one. */
  pre_tests_passed: number | null;
}

export interface ComputedOutcome {
  intervention_id: string;
  window_spec: string;
  outcome: InterventionOutcome;
  post_diff_class: string | null;
  delta_tests_passed: number | null;
  seconds_to_outcome: number | null;
  reducer_version: number;
}

/** Edits at or above this size, following a hint that carried code, read as copying. */
const TRANSFER_DISTANCE_BUCKETS = new Set(["51-200", "200+"]);
/**
 * Edit shapes consistent with pasting the hint's code.
 *
 * `authored` is here because leaving it out made the commonest copy pattern
 * invisible: a learner with nothing but the starter template asks for
 * implementation-level help and pastes the answer. That edit used to classify
 * as `structural`, so the rule covered it — until `authored` was split out to
 * separate "wrote a first solution" from "abandoned an approach", at which
 * point this set silently stopped matching it. The learner fixtures caught it;
 * `resolved_by_transfer` was firing on nobody.
 *
 * Including it is safe because transfer additionally requires the hint to have
 * carried code: a learner who writes their own first solution after a
 * conceptual hint is `authored` too, and stays `resolved_independently`.
 */
const TRANSFER_DIFF_CLASSES = new Set<DiffClass>(["structural", "extension", "authored"]);

function payloadString(event: ReducibleEvent, key: string): string | null {
  const value = event.payload[key];
  return typeof value === "string" ? value : null;
}

function payloadNumber(event: ReducibleEvent, key: string): number | null {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Classify one intervention against the events that followed it.
 *
 * `episodeEvents` must be the full ordered event list for the intervention's
 * episode — the same input the episode reducer sees, so both derive from one
 * replayable source.
 */
export function computeInterventionOutcome(
  intervention: InterventionInput,
  episodeEvents: readonly ReducibleEvent[]
): ComputedOutcome {
  const deliveredAt = Date.parse(intervention.delivered_at);

  const after = episodeEvents
    .filter((e) => Date.parse(e.received_at) > deliveredAt)
    .sort((a, b) => Date.parse(a.received_at) - Date.parse(b.received_at));

  const base = {
    intervention_id: intervention.intervention_id,
    window_spec: WINDOW_SPEC,
    reducer_version: OUTCOME_REDUCER_VERSION,
  };

  let submissions = 0;
  let firstMeaningfulDiff: DiffClass | null = null;
  let firstMeaningfulDistance: string | null = null;
  let lastTestsPassed: number | null = null;
  let closed = false;

  for (const event of after) {
    const elapsed = (Date.parse(event.received_at) - deliveredAt) / 1000;
    if (elapsed > WINDOW_SECONDS) break;

    if (event.event_name === "episode_closed") {
      closed = true;
      break;
    }

    if (event.event_name === "assistance_requested") {
      const requested = payloadNumber(event, "requested_level");
      // Asking for more means this rung did not land — regardless of what
      // happens afterwards, which is why it short-circuits.
      if (requested === null || intervention.level === null || requested > intervention.level) {
        return {
          ...base,
          outcome: "escalated",
          post_diff_class: firstMeaningfulDiff,
          delta_tests_passed: null,
          seconds_to_outcome: Math.round(elapsed),
        };
      }
    }

    if (event.event_name === "code_diff_classified") {
      const cls = payloadString(event, "diff_class") as DiffClass | null;
      if (cls && cls !== "cosmetic" && cls !== "unknown" && firstMeaningfulDiff === null) {
        firstMeaningfulDiff = cls;
        firstMeaningfulDistance = payloadString(event, "edit_distance_bucket");
      }
    }

    if (event.event_name === "verdict_received") {
      submissions += 1;
      const verdict = payloadString(event, "verdict") as LearningVerdict | null;
      const testsPassed = payloadNumber(event, "tests_passed");
      if (testsPassed !== null) lastTestsPassed = testsPassed;

      if (verdict === "accepted") {
        return {
          ...base,
          outcome: resolvedHow(intervention, firstMeaningfulDiff, firstMeaningfulDistance),
          post_diff_class: firstMeaningfulDiff,
          delta_tests_passed: delta(intervention.pre_tests_passed, testsPassed),
          seconds_to_outcome: Math.round(elapsed),
        };
      }

      if (submissions >= WINDOW_SUBMISSIONS) break;
    }
  }

  const deltaTests = delta(intervention.pre_tests_passed, lastTestsPassed);

  // Getting worse is the most expensive thing a confident wrong hint can do,
  // and it is invisible without comparing passing-test counts across attempts.
  if (deltaTests !== null && deltaTests < 0) {
    return { ...base, outcome: "regressed", post_diff_class: firstMeaningfulDiff, delta_tests_passed: deltaTests, seconds_to_outcome: null };
  }

  if (deltaTests !== null && deltaTests > 0) {
    return { ...base, outcome: "progressed", post_diff_class: firstMeaningfulDiff, delta_tests_passed: deltaTests, seconds_to_outcome: null };
  }

  // `stalled` beats `abandoned` when nothing was edited, even though the
  // learner also left.
  //
  // The two overlapped by construction — "no edit in the window" and "closed
  // without an accept" are both true of the same episode — and the replays
  // showed the more informative one losing. These rows describe the HINT: that
  // it produced no action at all points at how it was worded, while
  // abandonment is a fact about the episode and is already recorded there.
  // `abandoned` is now reserved for a learner who acted on the hint and gave
  // up anyway.
  if (firstMeaningfulDiff === null) {
    return {
      ...base,
      outcome: "stalled",
      post_diff_class: null,
      delta_tests_passed: deltaTests,
      seconds_to_outcome: null,
    };
  }

  return {
    ...base,
    outcome: closed ? "abandoned" : "stalled",
    post_diff_class: firstMeaningfulDiff,
    delta_tests_passed: deltaTests,
    seconds_to_outcome: null,
  };
}

/**
 * Independent solve, or did they just paste what we gave them?
 *
 * A learner who reaches Accepted by copying the hint's code is a product
 * success and a learning failure, and the two must never share a metric.
 *
 * Phase 1 can only approximate this. Exact token overlap needs the hint text,
 * which stays in `copilot_messages` under its consent gate and is deliberately
 * not copied into this stream. So transfer is asserted only when the hint
 * carried code AND the edit that followed was large and structural — a lower
 * bound. Real overlap measurement arrives with consented text in Phase 4;
 * until then this number under-reports transfer and never over-reports it.
 */
function resolvedHow(
  intervention: InterventionInput,
  diffClass: DiffClass | null,
  distanceBucket: string | null
): InterventionOutcome {
  if (!intervention.contains_code) return "resolved_independently";
  if (
    diffClass !== null &&
    TRANSFER_DIFF_CLASSES.has(diffClass) &&
    distanceBucket !== null &&
    TRANSFER_DISTANCE_BUCKETS.has(distanceBucket)
  ) {
    return "resolved_by_transfer";
  }
  return "resolved_independently";
}

function delta(before: number | null, after: number | null): number | null {
  if (before === null || after === null) return null;
  return after - before;
}
