import type { Verdict as GridVerdict } from "./schedule-grid";

/**
 * The lesson verdict channel.
 *
 * ## Why this file exists
 *
 * Two verdict vocabularies meet here and they do not mean the same thing.
 *
 * The cloned runtime's `Verdict` is `"unchecked" | "wrong" | "right"`. It
 * describes *whether the UI has been checked* — a scheduling puzzle is either
 * untouched, or it is right, or it is not.
 *
 * The school's is `"correct" | "wrong" | "partial" | "unknown"`. It describes
 * *what was measured* — and `unknown` means nobody measured anything.
 *
 * Collapsing the second onto the first is the single most damaging thing this
 * migration could do, because it is silent. Nothing throws. A learner writes an
 * explanation in their own words — which by design is never auto-graded — and
 * the card border turns amber, Koji plays `incorrect`, and the footer says "Try
 * again". A 14-year-old is told they failed at something no one judged. The
 * same happens on a self-authored test case the author did not enumerate, on
 * every coding task while the sandbox is unbuilt, and on every reflection
 * prompt.
 *
 * So the runtime carries five states, not three, and `unmeasured` is routed to
 * the NEUTRAL arm of every channel: border, Koji, bubble and footer.
 */

export type LessonVerdict =
  /** Not yet checked. */
  | "unchecked"
  /** Measured, and right. */
  | "correct"
  /** Measured, and not right. */
  | "wrong"
  /** Measured, and right in part. A trace with 4 of 5 rows correct. */
  | "partial"
  /** Settled, and deliberately NOT measured. Never styled as failure. */
  | "unmeasured";

/** From `checkBlock`'s vocabulary into the runtime's. */
export function toLessonVerdict(
  v: "correct" | "wrong" | "partial" | "unknown",
): LessonVerdict {
  return v === "unknown" ? "unmeasured" : v;
}

/**
 * The card's 2px border, which in the original IS the verdict channel.
 *
 * `unmeasured` deliberately shares the resting white/20. That is the honest
 * rendering: the system has nothing to say about this answer.
 */
export function cardBorderClass(v: LessonVerdict): string {
  switch (v) {
    case "correct":
      return "border-b-ok";
    case "wrong":
      return "border-b-warn";
    case "partial":
      return "border-b-warn";
    case "unchecked":
    case "unmeasured":
      return "border-b-fg/20";
  }
}

/**
 * Koji's reaction.
 *
 * `null` means do not play anything — the idle keeps running. Reacting to an
 * ungraded answer would be the avatar asserting something the system does not
 * know.
 */
export function kojiReaction(v: LessonVerdict): "right" | "wrong" | null {
  switch (v) {
    case "correct":
      return "right";
    case "wrong":
    case "partial":
      return "wrong";
    case "unchecked":
    case "unmeasured":
      return null;
  }
}

/** Bridge to the ScheduleGrid's own three-state prop, for interactives that use it. */
export function toGridVerdict(v: LessonVerdict): GridVerdict {
  switch (v) {
    case "correct":
      return "right";
    case "wrong":
    case "partial":
      return "wrong";
    case "unchecked":
    case "unmeasured":
      return "unchecked";
  }
}

/** Has the learner committed an answer to this block? */
export function isSettled(v: LessonVerdict): boolean {
  return v !== "unchecked";
}

/**
 * Which footer CTA pair to render.
 *
 * `retry` is offered only where trying again is meaningful. An ungraded answer
 * has nothing to retry against, so `unmeasured` advances — the alternative
 * would be a dead-end button.
 */
export type FooterMode = "check" | "advance" | "retry" | "celebrate";

export function footerMode(v: LessonVerdict, isAttempt: boolean): FooterMode {
  if (v === "unchecked") return isAttempt ? "check" : "advance";
  if (v === "correct") return "celebrate";
  if (v === "wrong" || v === "partial") return "retry";
  return "advance";
}
