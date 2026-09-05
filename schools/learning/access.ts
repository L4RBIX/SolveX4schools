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
import { config } from "@schools/config";

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
 * TWO reads per request, issued in parallel — it was one before the gate grew
 * its second condition, and a stale cost note is how a performance claim
 * quietly stops being true. `completionsForSubject` is a single indexed read on
 * `(subject_id)` returning at most 83 rows for a learner who has finished the
 * whole year; `blockAttempts` is asked ONCE for every independence block in the
 * programme — thirteen ids, one per month plus May's five — rather than once
 * per month.
 *
 * Both are per page render and per state-changing request, never per block: a
 * check inside a render loop would be 73 queries on a September lesson, which
 * is the shape this note exists to forbid. September short-circuits before
 * either of them.
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


/* -------------------------------------------------------------------------- */
/* QA full-curriculum access                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Is this subject one of the named QA accounts?
 *
 * ## Why the check lives here and not at the call sites
 *
 * Four surfaces ask whether a month may be opened — the month board, the
 * assessment page, the submit route and the completion route — and every one
 * of them funnels through `monthUnlockedFor`. Putting the override anywhere
 * else would mean four copies of it, and the fourth would be the one somebody
 * forgets, which is how the publication gate came to be enforced on one
 * surface and not the others.
 *
 * ## Why it costs nothing for a normal learner
 *
 * An empty allowlist returns before touching the database, and the allowlist
 * is empty in every environment that has not deliberately set it. A learner
 * who IS named costs one indexed read on the subjects table's primary key.
 *
 * The list holds ACCOUNT ids rather than subject ids on purpose: a subject is
 * minted per curriculum version, so a subject-id allowlist would silently stop
 * matching the day a QA account was moved to a new curriculum, and the failure
 * would look like the override having been removed.
 */
async function isQaFullAccessSubject(subjectId: string): Promise<boolean> {
  const allow = config.qaFullCurriculumUsers;
  if (allow.length === 0) return false;
  const store = await getStore();
  const userId = await store.userIdForSubject(subjectId);
  return userId !== null && allow.includes(userId);
}

export async function unlockStateForSubject(subjectId: string): Promise<UnlockState> {
  const state = unlockStateFor(PROGRAM.months, await unlockEvidenceFor(subjectId));
  if (!(await isQaFullAccessSubject(subjectId))) return state;

  /*
   * A QA account sees every month as open, and every other field untouched.
   *
   * `unlocked` is the ACCESS answer and it is the only one overridden here.
   * `complete`, `remaining`, `demonstrated` and `independenceBlocks` keep
   * saying what the ledger says — so the home deck opens the year while a
   * teacher's view of that account still shows nothing was finished, which is
   * the truth and is the point of doing it this way.
   */
  return {
    unlockedThrough: PROGRAM.months.length,
    months: state.months.map((m) => ({ ...m, unlocked: true })),
  };
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
  /* The QA override, and the only place it is applied. It answers the ACCESS
     question and writes nothing; see `isQaFullAccessSubject`. */
  if (await isQaFullAccessSubject(subjectId)) return true;
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
