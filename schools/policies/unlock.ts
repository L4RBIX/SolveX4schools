import type { Completable } from "@schools/curriculum/inventory";
import {
  monthCompletables,
  monthIndependenceBlocks,
  type MonthCompletableShape,
} from "@schools/curriculum/inventory";
import type { LessonBlock, PublicationStatus } from "@schools/curriculum/types";

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
 * September is always unlocked. Month N unlocks when month N-1 is COMPLETE
 * **and** the learner has SOLVED at least one of that month's unseen problems.
 *
 * ### Why completion alone was not enough
 *
 * "Complete" is `monthCompletables()` — every authored lesson plus the monthly
 * check — each carrying a `lesson_completions` row, written only by
 * `/api/learning/complete` after `schools/policies/completion.ts` passes. Those
 * policies ask for `attempted` and `measured`, never `passed`, and that is
 * right for a LESSON: a learner who tries every task and gets half of them
 * wrong has done the work, and gating a lesson on correctness would lock a
 * struggling fourteen-year-old out of exactly the lesson they needed most.
 *
 * It is not right for opening the NEXT MONTH. Measured on the real curriculum:
 * a learner submitting one WRONG answer to every required block satisfies
 * 36 of 36 September lesson/route combinations and the monthly check as well.
 * Attempt-spam opened October. For a self-paced learner with no teacher
 * watching the pace, that is a gate in name only.
 *
 * ### Why THIS second condition, and not a percentage
 *
 * `VerifyBlock.mode` is the programme's own five independent checks (PDF p.6),
 * and `unseen_problem` is the one it defines as «Ешбір сабақта талданбаған
 * есептер. Олар оқушының үлгіні қайталап тұрғанын әлде шынымен ойлап тұрғанын
 * көрсетеді» — problems analysed in no lesson, which show whether the learner
 * is repeating a pattern or actually thinking.
 *
 * That is the curriculum answering this exact question in its own words, so the
 * gate uses it rather than a number somebody chose. Every month has at least
 * one, in its monthly check, and every one carries test cases. No threshold, no
 * percentage, no score.
 *
 * ### What it therefore does NOT require
 *
 *   - **Not correctness anywhere else.** One solved unseen problem. Everything
 *     else in the month may be wrong.
 *   - **Not solo work.** A solve after four rungs of Nova is a solve. The
 *     programme's own rule is that help is followed by explaining it back and
 *     re-solving later, not that help disqualifies you.
 *   - **Not optional or bank work**, ever.
 *   - **Not a teacher.** Every independence block is machine-graded, so nobody
 *     waits days for one of the four written reviews to be marked.
 *   - **Not speed, not time spent, not League XP.**
 *
 * ### What stops a browser claiming it
 *
 * `solved` comes from `blockAttempts`, whose `accepted` predicate is gated on
 * `source_trust = 'judge'` — only this server, having actually run the code,
 * may say a block was solved. It is ledger state, so it survives a refresh, a
 * re-login and a cleared cache.
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

/**
 * A month this policy may be asked about.
 *
 * `MonthCompletableShape` alone is not enough, and the difference is
 * load-bearing rather than pedantic. That shape's blocks are `readonly
 * unknown[]` so the presentation layer can pass the board's `MonthOutline`,
 * whose blocks are reduced to `{id, type}` — and an outline has no `mode` and
 * no `cases`, so `monthIndependenceBlocks` returns `[]` for every month,
 * `demonstrated` becomes `true` everywhere, and the attempt-spam learner is
 * handed `unlockedThrough: 9`. Measured, before this type existed.
 *
 * So the gate demands the AUTHORED assessment. `PROGRAM.months` satisfies it;
 * a projection does not, and says so at compile time.
 */
export type UnlockMonth = MonthCompletableShape & {
  assessment?: { id: string; status: PublicationStatus; blocks: readonly LessonBlock[] } | null;
};

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
  /**
   * Has the learner solved one of this month's unseen problems?
   *
   * Separate from `complete` because they answer different questions and a
   * screen should be able to say which one is missing: "three lessons left" and
   * "the monthly check's new problem is not solved yet" are different sentences
   * and only one of them is discouraging by accident.
   */
  demonstrated: boolean;
  /** The month's independence blocks. Empty only if none is authored. */
  independenceBlocks: string[];
}

export interface UnlockState {
  /** Highest month index this learner may enter. Never below FIRST_MONTH_INDEX. */
  unlockedThrough: number;
  months: MonthUnlock[];
}

/**
 * Everything the rule reads. Both sets are ledger state.
 *
 * `completed` — completable ids with a `lesson_completions` row.
 * `solved`    — block ids with a judge-trusted accepted verdict. A browser
 *               cannot put an id in here; see `blockAttempts`.
 */
export interface UnlockEvidence {
  completed: ReadonlySet<string>;
  solved: ReadonlySet<string>;
}

/** Nothing recorded. The state every learner starts in. */
export const NO_EVIDENCE: UnlockEvidence = { completed: new Set(), solved: new Set() };

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

/**
 * Has this learner solved one of the month's unseen problems?
 *
 * A month that authors none returns `true`, for the same reason
 * `isMonthComplete` treats an empty month as complete: a month the curriculum
 * has not given an independence check cannot be a wall in front of a learner
 * who has finished everything in it. Every shipped month has one, and
 * `tests/school/unlock-policy.test.ts` asserts that stays true.
 */
export function hasDemonstratedIndependence(
  month: UnlockMonth,
  solved: ReadonlySet<string>,
): boolean {
  const blocks = monthIndependenceBlocks(month);
  if (blocks.length === 0) return true;
  /* `some`, and it is not a softened `every`. Months 1-8 author exactly one
     `verify:unseen_problem` block each, so the two coincide on every month that
     actually gates anything. May authors five and gates nothing after it, and
     requiring all five would be a per-month count the programme never states —
     p.11 gives «шамамен 100 толық дербес шешім» as a YEAR minimum and no
     monthly figure. Inventing one here is exactly what this rule avoids. */
  return blocks.some((id) => solved.has(id));
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
  months: readonly UnlockMonth[],
  evidence: UnlockEvidence,
): UnlockState {
  const ordered = [...months].sort((a, b) => a.index - b.index);
  const { completed, solved } = evidence;

  let open = true;
  const out: MonthUnlock[] = [];

  for (const month of ordered) {
    const required = completablesOf(month);
    const remaining = required.filter((c) => !completed.has(c.id)).map((c) => c.id);
    const complete = remaining.length === 0;
    const independenceBlocks = monthIndependenceBlocks(month);
    const demonstrated = hasDemonstratedIndependence(month, solved);
    /* The first month is open whatever came before it, because nothing did. */
    const unlocked = month.index === FIRST_MONTH_INDEX ? true : open;

    out.push({
      index: month.index,
      unlocked,
      complete,
      remaining,
      required: required.length,
      demonstrated,
      independenceBlocks,
    });

    /* Both conditions, and the order matters: a month that is unlocked and not
       yet FINISHED-AND-DEMONSTRATED closes the next one, so the learner always
       has exactly one frontier. Attempting everything without solving the
       month's unseen problem leaves them here — which is the whole point. */
    if (!complete || !demonstrated) open = false;
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
  months: readonly UnlockMonth[],
  evidence: UnlockEvidence,
): boolean {
  if (monthIndex === FIRST_MONTH_INDEX) return true;
  return unlockStateFor(months, evidence).months.some(
    (m) => m.index === monthIndex && m.unlocked,
  );
}

/**
 * Every block id the gate might need a verdict for, across the whole programme.
 *
 * Small — one per month, five in May — so the server can ask for all of them in
 * a single `blockAttempts` call rather than one per month. See
 * `schools/learning/access.ts`.
 */
export function allIndependenceBlocks(
  months: readonly UnlockMonth[],
): string[] {
  return months.flatMap((m) => monthIndependenceBlocks(m));
}
