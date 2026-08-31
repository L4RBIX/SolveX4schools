import "server-only";
import { PROGRAM } from "@schools/curriculum/program";
import {
  allIndependenceBlocks,
  isMonthUnlocked,
  unlockStateFor,
  type UnlockEvidence,
  type UnlockState,
} from "@schools/policies/unlock";
import { resolveIdentity } from "@schools/learning/identity";
import { getStore } from "@schools/store";

/**
 * May this learner enter this month?
 *
 * ## The gate the previous release did not have
 *
 * All nine months are published, so publication no longer answers "may I open
 * this". `schools/policies/unlock.ts` decides that from the learner's own
 * completions, and this is the thin server-side wrapper that fetches them.
 *
 * The policy is pure and the fetch is here, deliberately: the rule is testable
 * without a database, and every route that has to enforce it calls one function
 * rather than each assembling the set itself. The last time a rule in this
 * product was assembled at three call sites, two of them disagreed.
 *
 * ## Cost
 *
 * One query per request — `completionsForSubject` is a single indexed read on
 * `(subject_id)` returning at most 81 rows for a learner who has finished the
 * whole year. It is called once per page render and once per state-changing
 * request, never per block: a check inside a render loop would be 73 queries on
 * a September lesson, which is the shape this note exists to forbid.
 */
export async function unlockEvidenceFor(subjectId: string): Promise<UnlockEvidence> {
  const store = await getStore();

  /* Two reads, not two per month. `completionsForSubject` is one indexed scan
     returning at most 83 rows for a learner who has finished the whole year;
     `blockAttempts` is asked ONCE for every independence block in the
     programme — thirteen ids in total, one per month plus May's five — rather
     than once per month. A check inside a render loop would be dozens of
     queries on one page, which is the shape this note exists to forbid. */
  const [completions, attempts] = await Promise.all([
    store.completionsForSubject(subjectId),
    store.blockAttempts(subjectId, allIndependenceBlocks(PROGRAM.months)),
  ]);

  const solved = new Set<string>();
  for (const [blockId, evidence] of attempts) {
    /* `accepted` and nothing else. It is computed with
       `source_trust = 'judge'` in the query itself, so only this server —
       having actually run the learner's code — can put an id in this set. */
    if (evidence.accepted) solved.add(blockId);
  }

  return { completed: new Set(completions.map((c) => c.lessonId)), solved };
}

export async function unlockStateForSubject(subjectId: string): Promise<UnlockState> {
  return unlockStateFor(PROGRAM.months, await unlockEvidenceFor(subjectId));
}

/**
 * The one question the gates ask.
 *
 * September short-circuits without touching the database. It is unlocked for
 * everybody from the first login, so a learner opening their first lesson pays
 * for nothing, and a store that is briefly unavailable cannot lock a class out
 * of the only month they are supposed to be in.
 */
export async function monthUnlockedFor(subjectId: string, monthIndex: number): Promise<boolean> {
  if (monthIndex === 1) return true;
  return isMonthUnlocked(monthIndex, PROGRAM.months, await unlockEvidenceFor(subjectId));
}

/**
 * The same question, for a page that has a session but has not resolved a
 * subject yet.
 *
 * Server Components read cookies the same way a route handler does, so this is
 * `resolveIdentity` plus the check. It exists so the three read surfaces —
 * lesson, assessment, month board — ask in one line rather than each deciding
 * how to reach the learner, which is how the publication gate came to be
 * enforced on one of them and not the others.
 *
 * September short-circuits before `resolveIdentity`, so opening the first
 * lesson of the year touches neither the cookie jar nor the store for this.
 */
export async function currentLearnerMayEnter(monthIndex: number): Promise<boolean> {
  if (monthIndex === 1) return true;
  const { subjectId } = await resolveIdentity();
  return monthUnlockedFor(subjectId, monthIndex);
}
