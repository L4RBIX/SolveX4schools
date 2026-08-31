import type { Completable } from "@schools/curriculum/inventory";
import { monthCompletables, type MonthCompletableShape } from "@schools/curriculum/inventory";

/**
 * Which months this learner may enter.
 *
 * ## Why this exists: PUBLISHED is not UNLOCKED
 *
 * All nine months are published. That was a product decision, and it is the
 * right one — SolveX is self-paced as well as taught, so a learner who is ahead
 * of their class must not have to wait for an engineer to publish October.
 *
 * But publication and authorisation are different questions, and the release
 * before this one proved what happens when a product answers only the first:
 * the publication gate lived on the page, `POST /api/learning/submit` did not
 * consult it, and May could be graded and attested against a learner on a
 * database where only September was published. Publishing everything without a
 * second gate would turn that from a bypass into the default.
 *
 * So:
 *
 *   PUBLISHED  — the month exists in production and passed the machine gates.
 *                A property of the deployment. One row per month.
 *   UNLOCKED   — THIS learner may enter it. A property of the learner, computed
 *                from their own record, here.
 *   COMPLETED  — this learner finished it. What unlocks the next one.
 *
 * ## The rule
 *
 * September is always unlocked. Month N unlocks when month N-1 is COMPLETE.
 *
 * "Complete" is not defined here. It is `monthCompletables()` — every authored
 * lesson plus the monthly check — each carrying a `lesson_completions` row.
 * That row is written only by `/api/learning/complete`, which evaluates
 * `schools/policies/completion.ts` against the ledger and refuses a claim the
 * evidence does not support. So this policy inherits, without restating:
 *
 *   - optional and bank tasks never count (`isMandatory` excludes them);
 *   - correctness is never required — the shipped policies ask for `attempted`,
 *     not `passed`, because gating progress on getting it right would lock a
 *     struggling fourteen-year-old out at exactly the lesson they needed most;
 *   - a learner's route (Support/Core/Advanced) is honoured by the completion
 *     target, so an Advanced-only task cannot block a Support learner.
 *
 * There is deliberately no second definition of "required" in this file. Every
 * time this product has had two, they have disagreed.
 *
 * ## Sequential, and why
 *
 * The programme is one ordered path — month 5 depends on month 2 — and
 * `programmeToLearningPath` already says so in those words. So this walks
 * upward and stops at the first month that is not complete. A learner cannot
 * open March by finishing September twice.
 */

/** September. Always open, to everybody, from the first login. */
export const FIRST_MONTH_INDEX = 1;

export interface MonthUnlock {
  index: number;
  unlocked: boolean;
  complete: boolean;
  /** Completables still outstanding. Empty when the month is complete. */
  remaining: string[];
  /** Total completables in the month. `0` means nothing is authored yet. */
  required: number;
}

export interface UnlockState {
  /** Highest month index this learner may enter. Never below FIRST_MONTH_INDEX. */
  unlockedThrough: number;
  months: MonthUnlock[];
}

function completablesOf(month: MonthCompletableShape): Completable[] {
  return monthCompletables(month);
}

/**
 * Is every completable in this month recorded as finished?
 *
 * A month with nothing authored returns `true`, and that is deliberate rather
 * than an oversight. The alternative — an empty month is never complete — makes
 * an unwritten or accidentally-emptied month a permanent wall in front of every
 * learner in the school, which is the failure that produces a support call at
 * 08:00 on a Monday and cannot be resolved by anyone in the building. Opening
 * one month too many is visible, recoverable, and caught by the curriculum
 * validator long before a deploy. Locking a class out is neither.
 *
 * In practice it never fires: all nine months are authored and the validator
 * gates on it.
 */
export function isMonthComplete(
  month: MonthCompletableShape,
  completed: ReadonlySet<string>,
): boolean {
  return completablesOf(month).every((c) => completed.has(c.id));
}

/** What is left of a month, in authored order. */
export function remainingIn(
  month: MonthCompletableShape,
  completed: ReadonlySet<string>,
): string[] {
  return completablesOf(month)
    .filter((c) => !completed.has(c.id))
    .map((c) => c.id);
}

/**
 * The whole picture, computed once.
 *
 * Takes the months rather than reading `PROGRAM` itself, so a test can pose a
 * two-month programme and the caller decides whether it is the authored month
 * or the public outline being asked about.
 */
export function unlockStateFor(
  months: readonly MonthCompletableShape[],
  completed: ReadonlySet<string>,
): UnlockState {
  const ordered = [...months].sort((a, b) => a.index - b.index);

  let open = true;
  const out: MonthUnlock[] = [];

  for (const month of ordered) {
    const required = completablesOf(month);
    const remaining = required.filter((c) => !completed.has(c.id)).map((c) => c.id);
    const complete = remaining.length === 0;
    /* The first month is open whatever came before it, because nothing did. */
    const unlocked = month.index === FIRST_MONTH_INDEX ? true : open;

    out.push({ index: month.index, unlocked, complete, remaining, required: required.length });

    /* Once a month is unlocked and unfinished, everything after it is closed.
       Note the order: an unlocked-but-incomplete month closes the NEXT one, so
       the learner always has exactly one frontier. */
    if (!complete) open = false;
  }

  const unlockedThrough = out.reduce(
    (max, m) => (m.unlocked ? Math.max(max, m.index) : max),
    FIRST_MONTH_INDEX,
  );
  return { unlockedThrough, months: out };
}

/** The one question every server-side gate actually asks. */
export function isMonthUnlocked(
  monthIndex: number,
  months: readonly MonthCompletableShape[],
  completed: ReadonlySet<string>,
): boolean {
  if (monthIndex === FIRST_MONTH_INDEX) return true;
  return unlockStateFor(months, completed).months.some(
    (m) => m.index === monthIndex && m.unlocked,
  );
}
