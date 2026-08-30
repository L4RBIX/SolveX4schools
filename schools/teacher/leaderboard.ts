import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { Localized } from "@schools/curriculum/types";
import type { LeaderboardEntry, LeaderboardLens } from "./contracts";
import { TL } from "./labels";
import type { ClassMember } from "./queries";

/**
 * The classroom leaderboard.
 *
 * ## The decision this file records
 *
 * The project has written, in two places, that it does not rank children:
 * "The class list is not sorted by score, because there is no score"
 * (`PRIVACY_DATA_FLOWS.md:318`) and "ranking children by one is the thing this
 * whole model exists to avoid" (`classroom.ts:262-265`).
 *
 * That refusal is kept, and it is narrower than it first reads. What it refuses
 * is a COMPOSITE INVENTED SCORE — the `mastery: 0-100` and `averageScore: 0-100`
 * that got `_quarantine/invented/teacher-data.ts` quarantined, numbers with no
 * evidence under them that nonetheless sort a class from best to worst child.
 *
 * Ranking on a COUNTED, AUDITABLE quantity is a different act. Every value
 * below is an integer count of episodes a teacher can open and check, each lens
 * publishes its own formula on screen next to the table, and no lens adds two
 * different units together. Where a composite would be needed, there is no lens.
 *
 * It is class-only. There is no cross-class and no cross-school comparison
 * anywhere in this file, and `classSubjects` is the only way rows get in.
 *
 * ## Anti-gaming: the one idea that does most of the work
 *
 * **Every lens counts DISTINCT TASKS, never episodes.**
 *
 * `count(distinct ae.task_ref)` rather than `count(*)` defeats most of the
 * adversarial list in one predicate:
 *
 * | Attack | Why it fails |
 * |---|---|
 * | Submit the same answer repeatedly | An unchanged answer replays the stored verdict and writes nothing (migration 0019). No new episode, no new task. |
 * | Re-solve an already-solved trivial task | Already in the distinct set. The second solve adds zero. |
 * | Open and close lessons | An episode with no accepted verdict is not counted by any lens. |
 * | Ask Nova repeatedly | Assistance sets `independence_weight < 1`, and every lens except Consistency requires `>= 1`. Help cannot raise a rank; it can only remove a task from the independent set. |
 * | Replay a submission id | `learning_submissions` is idempotent on `(subject, submission_id)`; the replay settles to the same verdict on the same episode. |
 * | Sit with the tab open for hours | No lens reads `active_seconds`. Time on screen is not ranked, deliberately — see §21 of the brief and the streak the product already removed for the same reason. |
 * | Reveal the answer and submit it | `independence_weight` is 0 for a revealed solution, so it is assisted everywhere. This is the case `store.activityBuckets` gets wrong and this file does not. |
 *
 * Consistency is the one lens that does not count solves, so it gets its own
 * guard: it counts distinct DAYS on which the learner had an episode **with at
 * least one graded submission**, which is why an opened-and-closed lesson does
 * not register.
 *
 * ## Evidence floors
 *
 * A learner with two episodes is not "last"; they are unranked, and the UI
 * lists them separately. Ranking on n=2 produces an ordering that inverts the
 * following week and teaches a class that the board is noise.
 */

/* -------------------------------------------------------------------------- */
/* Floors                                                                     */
/* -------------------------------------------------------------------------- */

/** Distinct tasks attempted in the window before a learner can be ranked. */
export const MIN_TASKS_FOR_RANK = 3;
/** Distinct active days before the consistency lens will rank someone. */
export const MIN_DAYS_FOR_CONSISTENCY = 2;
/** Independent solves in the PREVIOUS window before improvement is meaningful. */
export const MIN_PREVIOUS_FOR_IMPROVEMENT = 1;

/* -------------------------------------------------------------------------- */
/* The counted quantities                                                     */
/* -------------------------------------------------------------------------- */

export interface LeaderboardCounts {
  subjectId: string;
  /** Distinct tasks with an accepted episode at `independence_weight >= 1`. */
  independentTasks: number;
  /** Distinct tasks accepted with any assistance, or with a revealed solution. */
  assistedTasks: number;
  /** Distinct tasks attempted at all. The evidence floor. */
  attemptedTasks: number;
  /** Distinct days with an episode carrying at least one graded submission. */
  workingDays: number;
  /** Distinct challenge/verify tasks solved unaided. */
  challengeTasks: number;
}

/**
 * One query for every lens.
 *
 * `filter (where …)` inside `count(distinct …)` is standard Postgres and PGlite
 * runs the same planner, so the five numbers come back in one pass over the
 * class's episodes rather than five.
 *
 * `challengeBlockIds` is passed in from the curriculum rather than derived from
 * a column, because "this task is a challenge" is a fact about content and
 * `attempt_episodes` has no block-kind column. An empty list means the
 * challenge lens has nothing to rank, which is the honest state for a month
 * with no advanced tasks authored.
 */
export async function leaderboardCounts(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
  challengeBlockIds: readonly string[],
): Promise<Map<string, LeaderboardCounts>> {
  if (subjectIds.length === 0) return new Map();

  const r = await sql.query<Record<string, unknown>>(
    `select ae.subject_id,
            count(distinct ae.task_ref) filter (
              where ae.outcome = 'accepted' and ae.independence_weight >= 1
            )::int                                                              as independent_tasks,
            count(distinct ae.task_ref) filter (
              where ae.outcome = 'accepted' and ae.independence_weight < 1
            )::int                                                              as assisted_tasks,
            count(distinct ae.task_ref)::int                                    as attempted_tasks,
            count(distinct ((ae.opened_at at time zone 'UTC')::date)) filter (
              where ae.submissions > 0
            )::int                                                              as working_days,
            count(distinct ae.task_ref) filter (
              where ae.outcome = 'accepted'
                and ae.independence_weight >= 1
                and split_part(ae.task_ref, ':', 2) = any($4::text[])
            )::int                                                              as challenge_tasks
       from attempt_episodes ae
      where ae.subject_id = any($1::uuid[])
        and ae.opened_at >= $2
        and ae.opened_at <  $3
      group by 1`,
    [subjectIds, fromIso, toIso, challengeBlockIds],
  );

  const out = new Map<string, LeaderboardCounts>();
  for (const row of r.rows) {
    out.set(row.subject_id as string, {
      subjectId: row.subject_id as string,
      independentTasks: num(row.independent_tasks),
      assistedTasks: num(row.assisted_tasks),
      attemptedTasks: num(row.attempted_tasks),
      workingDays: num(row.working_days),
      challengeTasks: num(row.challenge_tasks),
    });
  }
  return out;
}

export function emptyCounts(subjectId: string): LeaderboardCounts {
  return {
    subjectId,
    independentTasks: 0,
    assistedTasks: 0,
    attemptedTasks: 0,
    workingDays: 0,
    challengeTasks: 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Ranking                                                                    */
/* -------------------------------------------------------------------------- */

export interface RankInput {
  member: ClassMember;
  current: LeaderboardCounts;
  previous: LeaderboardCounts;
}

export const LENS_EXPLANATION: Record<LeaderboardLens, Localized> = {
  independent: TL.lensIndependentExplain,
  improvement: TL.lensImprovementExplain,
  consistency: TL.lensConsistencyExplain,
  challenge: TL.lensChallengeExplain,
};

/**
 * Rank the class under one lens.
 *
 * Returns ranked entries and, separately, everyone below that lens's evidence
 * floor. Nobody is silently dropped and nobody unrankable is placed last.
 *
 * Ties share a rank (`1, 1, 3`) rather than being broken arbitrarily. Two
 * learners with four independent solves each are tied, and inventing a
 * tiebreak — who did it faster, who did it first — would smuggle a second
 * unstated criterion into a board whose whole claim is that its formula is on
 * screen.
 */
export function rank(lens: LeaderboardLens, inputs: readonly RankInput[]): {
  entries: LeaderboardEntry[];
  unranked: { subjectId: string | null; displayName: string; reason: Localized }[];
} {
  const rankable: { input: RankInput; value: number; components: LeaderboardEntry["components"] }[] = [];
  const unranked: { subjectId: string | null; displayName: string; reason: Localized }[] = [];

  for (const input of inputs) {
    const scored = scoreFor(lens, input);
    if (scored === null) {
      unranked.push({
        subjectId: input.member.subjectId,
        displayName: input.member.displayName,
        reason: TL.leaderboardUnrankedReason,
      });
      continue;
    }
    rankable.push({ input, ...scored });
  }

  rankable.sort((a, b) => {
    const d = b.value - a.value;
    return d !== 0 ? d : a.input.member.displayName.localeCompare(b.input.member.displayName);
  });

  const entries: LeaderboardEntry[] = [];
  let lastValue: number | null = null;
  let lastRank = 0;
  rankable.forEach((r, i) => {
    if (lastValue === null || r.value !== lastValue) {
      lastRank = i + 1;
      lastValue = r.value;
    }
    entries.push({
      rank: lastRank,
      subjectId: r.input.member.subjectId,
      displayName: r.input.member.displayName,
      value: r.value,
      components: r.components,
      insufficientEvidence: false,
    });
  });

  return { entries, unranked };
}

/**
 * The value and its parts, or null when this learner cannot be ranked here.
 *
 * Each branch is deliberately one counted quantity. The components array exists
 * so the number can be checked by hand against the row above it — a rank whose
 * arithmetic is invisible is a score by another name.
 */
function scoreFor(
  lens: LeaderboardLens,
  { current, previous }: RankInput,
): { value: number; components: LeaderboardEntry["components"] } | null {
  switch (lens) {
    /* Distinct tasks solved with no assistance and no reveal. The primary
       board, and the only one that claims anything about independence. */
    case "independent": {
      if (current.attemptedTasks < MIN_TASKS_FOR_RANK) return null;
      return {
        value: current.independentTasks,
        components: [
          { label: TL.kpiIndependent, value: current.independentTasks },
          { label: TL.kpiAssisted, value: current.assistedTasks },
          { label: TL.colAttempts, value: current.attemptedTasks },
        ],
      };
    }

    /* The delta in independent tasks against the previous window of equal
       length. This is the lens that matters for a learner who is not already
       strongest, and it is a SUBTRACTION of two counted quantities rather than
       a black-box "improvement score" — the brief's §20 requirement that a
       composite must document its formula is met by not having a composite. */
    case "improvement": {
      if (current.attemptedTasks < MIN_TASKS_FOR_RANK) return null;
      if (previous.attemptedTasks < MIN_PREVIOUS_FOR_IMPROVEMENT) return null;
      return {
        value: current.independentTasks - previous.independentTasks,
        components: [
          { label: TL.windowMonth, value: current.independentTasks },
          { label: TL.windowWeek, value: previous.independentTasks },
        ],
      };
    }

    /* Distinct days on which work was actually submitted. NOT minutes, NOT
       episodes: rewarding screen time rewards leaving a tab open, and the
       product already removed a streak counter for claiming what it could not
       measure. */
    case "consistency": {
      if (current.workingDays < MIN_DAYS_FOR_CONSISTENCY) return null;
      return {
        value: current.workingDays,
        components: [
          { label: TL.colDays, value: current.workingDays },
          { label: TL.colAttempts, value: current.attemptedTasks },
        ],
      };
    }

    /* Advanced work solved unaided. The floor is the challenge set itself: a
       learner who has attempted no challenge task is not ranked low here, they
       are simply not in this board — which is the fair reading for a Support
       learner whose route does not include them (§22). */
    case "challenge": {
      if (current.challengeTasks === 0) return null;
      return {
        value: current.challengeTasks,
        components: [{ label: TL.lensChallenge, value: current.challengeTasks }],
      };
    }
  }
}

function num(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
