import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { LearnerState, SkillState } from "@solvex/learning-intelligence-core";

/**
 * Class-scoped reads for the teacher command centre.
 *
 * ## Why a module beside the store rather than methods on it
 *
 * `schools/ops/observability.ts` and `schools/nova/budget.ts` already take a
 * `SqlExecutor` directly, and this follows them. `LearningStore` is a 2100-line
 * file several workstreams are editing at once, and every query here is a
 * class-scoped aggregate that no other caller wants. Routes get the executor
 * from `getStoreHandle()`, which already hands back `{ sql, store }`.
 *
 * ## Three rules every function in this file obeys
 *
 * **1. The population comes from `class_enrolments`, never from
 * `school_subject_scope`.**
 *
 * This is a security fix, not a style preference. `school_subject_scope` has
 * `school_id` and `class_id` as plain text with no foreign key to
 * `school_classes` and no unique constraint spanning schools, and every
 * class-keyed query in the store filters on `class_id` ALONE:
 *
 *     subjectsInClass    -> where class_id = $1
 *     isInClass          -> where subject_id = $1 and class_id = $2
 *     lastActivityForClass -> where s.class_id = $1
 *
 * Two schools whose class is called «9А» — or two deployments both left on the
 * shipped default `grade-9a`, which is what `config.pilot.classId` is and what
 * `.env.example` never mentions — collide on exactly that key. So a teacher at
 * school A would read school B's children.
 *
 * `class_enrolments` is keyed `(school_id, class_id, user_id)` with a foreign
 * key onto `school_classes(school_id, class_id)`. Sourcing the roster from
 * there makes the school predicate structural: every subject id that reaches
 * the aggregates below was resolved from an account enrolled in THIS school's
 * class, so no aggregate can reach across schools even though the tables it
 * reads have no school column.
 *
 * **2. Nothing here writes.**
 *
 * The route this replaces called `store.resolveSubjectForUser` once per roster
 * learner from a GET handler. That method updates `learning_subjects.last_seen_at`,
 * upserts `school_subject_scope`, and MINTS a subject when none exists — so
 * loading the dashboard bumped every learner's "last seen" to the teacher's
 * page load, and a learner enrolled in two classes had their scope row stolen
 * by whichever teacher refreshed last. `classRoster` resolves subjects with one
 * read-only join against `learning_subject_aliases`, whose primary key is
 * `(alias_kind, alias_value)`, and returns `null` for a learner who has never
 * been resolved rather than creating one.
 *
 * **3. One definition of independence, and it is the stored column.**
 *
 * `attempt_episodes.independence_weight >= 1` — the same predicate
 * `buildLearnerState` uses (`learnerState.ts:307`). NOT
 * `max_assistance_level < 0`, which is what `store.activityBuckets` uses and
 * which is wrong in one specific case: `reduceEpisode` sets `outcome='accepted'`
 * BEFORE it checks `solutionRevealed` (`episode.ts:334-335`), while
 * `independenceWeight` returns 0 for a revealed solution. So a learner who
 * reveals the answer and submits it is assisted to the learner projection and
 * "solo" to the activity chart. Everything on the teacher surface uses the
 * weight, so the dashboard and the learner's own page cannot disagree, and a
 * revealed answer can never be ranked as independent work.
 *
 * ## Windows
 *
 * Half-open `[fromIso, toIso)` on `attempt_episodes.opened_at`, in UTC, which
 * is exactly what `store.activityBuckets` does and what
 * `@schools/lib/activity-window` computes. There is no second definition of
 * "this week" in this file.
 */

/* -------------------------------------------------------------------------- */
/* Roster                                                                     */
/* -------------------------------------------------------------------------- */

export interface ClassMember {
  userId: string;
  displayName: string;
  /**
   * The learning subject behind the account, or null.
   *
   * Null is a real and common state: a subject is minted the first time a
   * learner does something, so an enrolled child who has never opened a lesson
   * has an account and no subject. That learner MUST still appear — a class
   * list that omits the child who has not started is the opposite of what a
   * teacher opens it for — which is why this is a LEFT join and why every
   * aggregate below tolerates a missing key.
   */
  subjectId: string | null;
  enrolledAt: string;
}

/**
 * Every learner enrolled in this class, with their subject id if they have one.
 *
 * One query. Withdrawn enrolments and disabled accounts are excluded, matching
 * `store.rosterForClass`; the count of what was excluded is deliberately not
 * returned, because a teacher asking "who is in my class" means the current
 * class.
 */
export async function classRoster(
  sql: SqlExecutor,
  schoolId: string,
  classId: string,
): Promise<ClassMember[]> {
  const r = await sql.query<{
    user_id: string;
    display_name: string;
    subject_id: string | null;
    enrolled_at: string;
  }>(
    `select a.user_id,
            a.display_name,
            al.subject_id,
            e.enrolled_at
       from class_enrolments e
       join school_accounts a on a.user_id = e.user_id
       left join learning_subject_aliases al
              on al.alias_kind = 'user_id'
             and al.alias_value = a.user_id::text
      where e.school_id = $1
        and e.class_id  = $2
        and e.withdrawn_at is null
        and a.disabled_at is null
      order by a.display_name asc`,
    [schoolId, classId],
  );
  return r.rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    subjectId: row.subject_id,
    enrolledAt: iso(row.enrolled_at),
  }));
}

/** The subject ids from a roster, in roster order, skipping learners with none. */
export function subjectIdsOf(members: readonly ClassMember[]): string[] {
  const out: string[] = [];
  for (const m of members) if (m.subjectId) out.push(m.subjectId);
  return out;
}

/* -------------------------------------------------------------------------- */
/* Windowed per-learner episode statistics                                    */
/* -------------------------------------------------------------------------- */

/**
 * What one learner did inside a window.
 *
 * Every field is a count or a sum over `attempt_episodes` — there is no ratio,
 * no score and no model output here. Ratios are computed in
 * `schools/teacher/metrics.ts` where the denominator can be named.
 */
export interface WindowedLearnerStats {
  subjectId: string;
  /** Attempt episodes opened in the window. */
  episodes: number;
  /** Episodes that reached `accepted`. */
  solved: number;
  /** Of those, `independence_weight >= 1` — no assistance, no reveal. */
  solvedIndependent: number;
  /** Of those, everything else: any hint level, or a revealed solution. */
  solvedAssisted: number;
  /** Episodes where the solution was revealed, solved or not. */
  revealed: number;
  /** Wall-clock corrected. Idle gaps above the reducer's ceiling are excluded. */
  activeSeconds: number;
  /** Hints actually delivered, summed over episodes. */
  interventions: number;
  /** Graded submissions, summed over episodes. */
  submissions: number;
  /** Distinct tasks touched. The honest denominator for "breadth". */
  distinctTasks: number;
  /**
   * Distinct UTC dates on which an episode was opened.
   *
   * NOT a streak. `PRODUCTION_PRODUCT_AUDIT.md:127-132` removed the learner's
   * streak because "nothing records activity days" — that was true of the
   * counter it removed, which counted nothing. This one is
   * `count(distinct date)` over real episodes, and it must be labelled as days
   * on which work happened, never re-presented as a streak.
   */
  activeDays: number;
  /** Per-episode struggle classification, counted. Model output — label it. */
  struggle: Record<StruggleKind, number>;
  /** `attempt_episodes.attributed_failures`, summed. */
  attributedFailures: number;
  /** Most recent `opened_at` inside the window. */
  lastOpenedAt: string | null;
}

export const STRUGGLE_KINDS = [
  "flow",
  "productive_struggle",
  "thrash",
  "stuck",
  "disengaged",
] as const;

export type StruggleKind = (typeof STRUGGLE_KINDS)[number];

/**
 * One query for the whole class.
 *
 * Rides `school_subject_scope`-free: the subject list is passed in, already
 * school-scoped by `classRoster`. The planner reaches
 * `idx_ae_subject (subject_id, opened_at desc)` for each id, which is the right
 * shape at a class of 18 and degrades linearly rather than quadratically.
 *
 * Learners with no episodes in the window are ABSENT from the result, not
 * present with zeros — the same choice `activityBuckets` makes, and for the
 * same reason: "no data" and "zero" are different facts and the caller decides
 * how to render each.
 */
export async function windowedLearnerStats(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<Map<string, WindowedLearnerStats>> {
  if (subjectIds.length === 0) return new Map();

  const r = await sql.query<Record<string, unknown>>(
    `select ae.subject_id,
            count(*)::int                                                       as episodes,
            count(*) filter (where ae.outcome = 'accepted')::int                as solved,
            count(*) filter (
              where ae.outcome = 'accepted' and ae.independence_weight >= 1
            )::int                                                              as solved_independent,
            count(*) filter (
              where ae.outcome = 'accepted' and ae.independence_weight < 1
            )::int                                                              as solved_assisted,
            count(*) filter (where ae.solution_revealed)::int                   as revealed,
            coalesce(sum(ae.active_seconds), 0)::int                            as active_seconds,
            coalesce(sum(ae.intervention_count), 0)::int                        as interventions,
            coalesce(sum(ae.submissions), 0)::int                               as submissions,
            count(distinct ae.task_ref)::int                                    as distinct_tasks,
            count(distinct ((ae.opened_at at time zone 'UTC')::date))::int      as active_days,
            count(*) filter (where ae.struggle_class = 'flow')::int             as s_flow,
            count(*) filter (where ae.struggle_class = 'productive_struggle')::int as s_productive,
            count(*) filter (where ae.struggle_class = 'thrash')::int           as s_thrash,
            count(*) filter (where ae.struggle_class = 'stuck')::int            as s_stuck,
            count(*) filter (where ae.struggle_class = 'disengaged')::int       as s_disengaged,
            coalesce(sum(ae.attributed_failures), 0)::int                       as attributed_failures,
            max(ae.opened_at)                                                   as last_opened_at
       from attempt_episodes ae
      where ae.subject_id = any($1::uuid[])
        and ae.opened_at >= $2
        and ae.opened_at <  $3
      group by 1`,
    [subjectIds, fromIso, toIso],
  );

  const out = new Map<string, WindowedLearnerStats>();
  for (const row of r.rows) {
    out.set(row.subject_id as string, {
      subjectId: row.subject_id as string,
      episodes: n(row.episodes),
      solved: n(row.solved),
      solvedIndependent: n(row.solved_independent),
      solvedAssisted: n(row.solved_assisted),
      revealed: n(row.revealed),
      activeSeconds: n(row.active_seconds),
      interventions: n(row.interventions),
      submissions: n(row.submissions),
      distinctTasks: n(row.distinct_tasks),
      activeDays: n(row.active_days),
      struggle: {
        flow: n(row.s_flow),
        productive_struggle: n(row.s_productive),
        thrash: n(row.s_thrash),
        stuck: n(row.s_stuck),
        disengaged: n(row.s_disengaged),
      },
      attributedFailures: n(row.attributed_failures),
      lastOpenedAt: row.last_opened_at ? iso(row.last_opened_at) : null,
    });
  }
  return out;
}

/** An empty stats record, for a learner with nothing in the window. */
export function emptyStats(subjectId: string): WindowedLearnerStats {
  return {
    subjectId,
    episodes: 0,
    solved: 0,
    solvedIndependent: 0,
    solvedAssisted: 0,
    revealed: 0,
    activeSeconds: 0,
    interventions: 0,
    submissions: 0,
    distinctTasks: 0,
    activeDays: 0,
    struggle: {
      flow: 0,
      productive_struggle: 0,
      thrash: 0,
      stuck: 0,
      disengaged: 0,
    },
    attributedFailures: 0,
    lastOpenedAt: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Class activity, bucketed                                                   */
/* -------------------------------------------------------------------------- */

export interface ClassActivityBucket {
  /** 'YYYY-MM-DD' or 'YYYY-MM', matching `ActivityWindow.buckets`. */
  bucket: string;
  /** Distinct learners with at least one episode in the bucket. */
  activeLearners: number;
  episodes: number;
  solvedIndependent: number;
  solvedAssisted: number;
  activeSeconds: number;
  interventions: number;
}

/**
 * The class activity series, in one query.
 *
 * The learner-facing chart calls `store.activityBuckets` once per subject; a
 * class chart that did the same would be 18 queries per period change. Buckets
 * with no episodes are absent — `ActivityWindow.buckets` supplies the shape and
 * the caller zero-fills, which is how an empty Tuesday renders as an empty
 * Tuesday rather than as missing.
 */
export async function classActivityBuckets(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
  grain: "day" | "month",
): Promise<ClassActivityBucket[]> {
  if (subjectIds.length === 0) return [];
  const fmt = grain === "day" ? "YYYY-MM-DD" : "YYYY-MM";

  const r = await sql.query<Record<string, unknown>>(
    `select to_char(ae.opened_at at time zone 'UTC', $4)                        as bucket,
            count(distinct ae.subject_id)::int                                  as active_learners,
            count(*)::int                                                       as episodes,
            count(*) filter (
              where ae.outcome = 'accepted' and ae.independence_weight >= 1
            )::int                                                              as solved_independent,
            count(*) filter (
              where ae.outcome = 'accepted' and ae.independence_weight < 1
            )::int                                                              as solved_assisted,
            coalesce(sum(ae.active_seconds), 0)::int                            as active_seconds,
            coalesce(sum(ae.intervention_count), 0)::int                        as interventions
       from attempt_episodes ae
      where ae.subject_id = any($1::uuid[])
        and ae.opened_at >= $2
        and ae.opened_at <  $3
      group by 1
      order by 1`,
    [subjectIds, fromIso, toIso, fmt],
  );

  return r.rows.map((row) => ({
    bucket: row.bucket as string,
    activeLearners: n(row.active_learners),
    episodes: n(row.episodes),
    solvedIndependent: n(row.solved_independent),
    solvedAssisted: n(row.solved_assisted),
    activeSeconds: n(row.active_seconds),
    interventions: n(row.interventions),
  }));
}

/* -------------------------------------------------------------------------- */
/* Last activity                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Last event per learner, from the ledger rather than the projection.
 *
 * `received_at` is the SERVER clock. `occurred_at` is the client's and migration
 * 0003 documents it as forgeable, so nothing that decides whether a child is
 * being chased may key on it.
 *
 * This reads ANY event, so it answers "when did this learner last touch the
 * product", not "when did they last do work". The distinction matters and the
 * dashboard states it: a learner whose last event is a page open is inactive in
 * the sense a teacher cares about, and `WindowedLearnerStats.lastOpenedAt`
 * answers that stricter question from `attempt_episodes`.
 *
 * Unlike `store.lastActivityForClass` this takes subject ids rather than a bare
 * `class_id`, so it cannot reach across schools.
 */
export async function lastActivityFor(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<Map<string, string>> {
  if (subjectIds.length === 0) return new Map();
  const r = await sql.query<{ subject_id: string; at: string }>(
    `select subject_id, max(received_at) as at
       from learning_events
      where subject_id = any($1::uuid[])
      group by 1`,
    [subjectIds],
  );
  return new Map(r.rows.map((row) => [row.subject_id, iso(row.at)]));
}

/* -------------------------------------------------------------------------- */
/* Learner state, in bulk                                                     */
/* -------------------------------------------------------------------------- */

export interface StoredLearnerState {
  state: LearnerState;
  /** When the reducer last rebuilt this row. The only staleness handle there is. */
  computedAt: string;
}

/**
 * Cumulative learner state for a whole class, in TWO queries.
 *
 * `store.learnerStatesForClass` says "in one round trip" in its doc comment and
 * is a JS loop calling `getLearnerState` per subject, at two queries each —
 * 2N+1 for N learners. This is the same data in 2.
 *
 * The state here is ALL-TIME by construction and there is no honest way to
 * window it: `buildLearnerState`'s thresholds (`attempts >= 2` for a level at
 * all, `soloSolved >= 3 && distinctTasks >= 3` for `strong`, `distinctEpisodes
 * >= 2` for an actionable misconception) are calibrated for a term's worth of
 * evidence and collapse to `unknown` inside a week. Windowed COUNTS come from
 * `windowedLearnerStats`; cumulative LEVELS and misconceptions come from here.
 * The two are never mixed into one ratio.
 */
export async function learnerStatesFor(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<Map<string, StoredLearnerState>> {
  if (subjectIds.length === 0) return new Map();

  const [heads, skills] = await Promise.all([
    sql.query<Record<string, unknown>>(
      `select * from learner_state where subject_id = any($1::uuid[])`,
      [subjectIds],
    ),
    sql.query<Record<string, unknown>>(
      `select * from learner_skill_state
        where subject_id = any($1::uuid[])
        order by subject_id asc, skill_id asc`,
      [subjectIds],
    ),
  ]);

  const bySubject = new Map<string, SkillState[]>();
  for (const row of skills.rows) {
    const key = row.subject_id as string;
    const list = bySubject.get(key) ?? [];
    list.push(rowToSkillState(row));
    bySubject.set(key, list);
  }

  const out = new Map<string, StoredLearnerState>();
  for (const h of heads.rows) {
    const subjectId = h.subject_id as string;
    out.set(subjectId, {
      computedAt: iso(h.computed_at),
      state: {
        subject: subjectId,
        episodes: n(h.episodes),
        skills: bySubject.get(subjectId) ?? [],
        assistance: {
          interventions: n(h.interventions),
          /* Null means "never solved, so no reading" — the migration is explicit
             that this is not the same as zero. The core only ever emits a
             number, so the type stays non-nullable and the caller that cares
             about the distinction reads `solved === 0` instead. */
          hintDependency: h.hint_dependency === null ? 0 : Number(h.hint_dependency),
          medianSecondsToFirstHint:
            h.median_seconds_to_first_hint === null
              ? null
              : Number(h.median_seconds_to_first_hint),
          transferSolves: n(h.transfer_solves),
          outcomeCounts: (h.intervention_outcome_counts ?? {}) as never,
        },
        unattributedFailures: n(h.unattributed_failures),
        version: n(h.state_version),
      },
    });
  }
  return out;
}

function rowToSkillState(row: Record<string, unknown>): SkillState {
  return {
    skill: row.skill_id as string,
    level: row.level as SkillState["level"],
    attempts: n(row.attempts),
    solved: n(row.solved),
    soloSolved: n(row.solo_solved),
    assistedSolved: n(row.assisted_solved),
    failures: n(row.failures),
    attributedFailures: n(row.attributed_failures),
    distinctTasks: n(row.distinct_tasks),
    misconceptions: (row.misconceptions ?? []) as SkillState["misconceptions"],
    rationale: (row.rationale as string) ?? "",
  };
}

/* -------------------------------------------------------------------------- */
/* Per-block evidence across a class                                          */
/* -------------------------------------------------------------------------- */

export interface ClassBlockEvidence {
  blockId: string;
  subjectId: string;
  submissions: number;
  verdicts: number;
  /** Judge-trusted acceptance. A browser-reported pass does not count. */
  accepted: boolean;
}

/**
 * Which learners have submitted, been judged, and been accepted, per block.
 *
 * The join to a block id is `split_part(payload->>'task_ref', ':', 2)`, copied
 * from `store.blockAttempts` rather than reinvented — the prefixes genuinely
 * disagree (`sx-assessment:` is written by `gradeBlock`, `sx-assess:` is what
 * `taskRef.ts` declares), so matching on the suffix is the only thing that
 * works for both. `parseTaskRef` returns null for every real assessment event
 * and must not be used here.
 *
 * This is an UNINDEXED jsonb expression. It is bounded here by an explicit
 * block-id list and by the subject list, which keeps it to the class's own
 * events; do not widen it to a whole month of blocks across a whole school.
 *
 * All-time, deliberately: "has this learner ever passed the assessment's second
 * task" is not a question about this week. Raw events are purged at 180 days,
 * so a September block read in May may under-report — that is a property of the
 * retention policy, not of this query.
 */
export async function classBlockEvidence(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  blockIds: readonly string[],
): Promise<ClassBlockEvidence[]> {
  if (subjectIds.length === 0 || blockIds.length === 0) return [];

  const r = await sql.query<Record<string, unknown>>(
    `select e.subject_id,
            split_part(e.payload->>'task_ref', ':', 2)                          as block_id,
            count(*) filter (where e.event_name = 'episode_opened')::int        as submissions,
            count(*) filter (where e.event_name = 'verdict_received')::int      as verdicts,
            coalesce(bool_or(
              e.event_name = 'verdict_received'
              and e.source_trust = 'judge'
              and e.payload->>'verdict' = 'accepted'
            ), false)                                                           as accepted
       from learning_events e
      where e.subject_id = any($1::uuid[])
        and split_part(e.payload->>'task_ref', ':', 2) = any($2::text[])
      group by 1, 2`,
    [subjectIds, blockIds],
  );

  return r.rows.map((row) => ({
    subjectId: row.subject_id as string,
    blockId: row.block_id as string,
    submissions: n(row.submissions),
    verdicts: n(row.verdicts),
    accepted: row.accepted === true,
  }));
}

/* -------------------------------------------------------------------------- */
/* Per-block difficulty across a class                                        */
/* -------------------------------------------------------------------------- */

export interface BlockDifficulty {
  blockId: string;
  /** Distinct learners who opened an episode on this block in the window. */
  attemptedBy: number;
  /** Distinct learners with a judge-accepted verdict. */
  acceptedBy: number;
  /** Distinct learners whose accept had `independence_weight >= 1`. */
  independentBy: number;
  /** Distinct learners who took at least one hint on this block. */
  assistedBy: number;
  /** Distinct learners who revealed the solution. */
  revealedBy: number;
  /** Total episodes, across learners. */
  episodes: number;
  /** Median graded submissions per episode. Integer-ish; see the note. */
  medianSubmissions: number;
  /** Median active seconds per episode. */
  medianActiveSeconds: number;
  /** Episodes classed `stuck` or `thrash`. */
  strugglingEpisodes: number;
}

/**
 * Which task is hard, measured over episodes rather than over opinions.
 *
 * `task_ref` on `attempt_episodes` carries the block, so this needs no jsonb
 * expression and rides `idx_ae_subject`. `percentile_cont` is a real Postgres
 * aggregate and PGlite runs the same one, so the median here is the median and
 * not an average wearing its name.
 *
 * `medianSubmissions` deliberately counts GRADED submissions, not Check
 * presses: an unchanged answer replays the first verdict and writes nothing
 * (migration 0019), so this is "how many different things did they try",
 * which is the number a teacher can act on.
 */
export async function blockDifficulty(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<BlockDifficulty[]> {
  if (subjectIds.length === 0) return [];

  const r = await sql.query<Record<string, unknown>>(
    `select split_part(ae.task_ref, ':', 2)                                     as block_id,
            count(distinct ae.subject_id)::int                                  as attempted_by,
            count(distinct ae.subject_id) filter (
              where ae.outcome = 'accepted'
            )::int                                                              as accepted_by,
            count(distinct ae.subject_id) filter (
              where ae.outcome = 'accepted' and ae.independence_weight >= 1
            )::int                                                              as independent_by,
            count(distinct ae.subject_id) filter (
              where ae.max_assistance_level >= 0
            )::int                                                              as assisted_by,
            count(distinct ae.subject_id) filter (
              where ae.solution_revealed
            )::int                                                              as revealed_by,
            count(*)::int                                                       as episodes,
            coalesce(percentile_cont(0.5) within group (order by ae.submissions), 0)
                                                                                as median_submissions,
            coalesce(percentile_cont(0.5) within group (order by ae.active_seconds), 0)
                                                                                as median_active_seconds,
            count(*) filter (
              where ae.struggle_class in ('stuck', 'thrash')
            )::int                                                              as struggling_episodes
       from attempt_episodes ae
      where ae.subject_id = any($1::uuid[])
        and ae.opened_at >= $2
        and ae.opened_at <  $3
      group by 1
      order by 1`,
    [subjectIds, fromIso, toIso],
  );

  return r.rows.map((row) => ({
    blockId: row.block_id as string,
    attemptedBy: n(row.attempted_by),
    acceptedBy: n(row.accepted_by),
    independentBy: n(row.independent_by),
    assistedBy: n(row.assisted_by),
    revealedBy: n(row.revealed_by),
    episodes: n(row.episodes),
    medianSubmissions: Math.round(Number(row.median_submissions ?? 0) * 10) / 10,
    medianActiveSeconds: Math.round(Number(row.median_active_seconds ?? 0)),
    strugglingEpisodes: n(row.struggling_episodes),
  }));
}

/* -------------------------------------------------------------------------- */
/* Per learner, per block                                                     */
/* -------------------------------------------------------------------------- */

export interface SubjectBlockStats {
  subjectId: string;
  blockId: string;
  episodes: number;
  accepted: boolean;
  /** Accepted with `independence_weight >= 1`: no hint, no reveal. */
  acceptedIndependently: boolean;
  /** Any hint was delivered on this block. */
  tookAssistance: boolean;
  revealed: boolean;
  activeSeconds: number;
  submissions: number;
  struggling: number;
  lastOpenedAt: string;
}

/**
 * The subject x block grid, windowed, in one query.
 *
 * This is what makes "who finished lesson 5 without help" answerable. The
 * class-level `blockDifficulty` aggregate cannot answer it — knowing that six
 * learners solved a block independently and four took a hint does not tell you
 * whether the SAME learner did both across the lesson's five blocks.
 *
 * Grouped on `task_ref` rather than on a jsonb expression, because
 * `attempt_episodes` carries the task on a real column. That keeps it on
 * `idx_ae_subject` instead of seq-scanning the class's events, which is what a
 * `payload->>'task_ref'` grouping would do.
 */
export async function subjectBlockStats(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<SubjectBlockStats[]> {
  if (subjectIds.length === 0) return [];
  const r = await sql.query<Record<string, unknown>>(
    `select ae.subject_id,
            split_part(ae.task_ref, ':', 2)                                     as block_id,
            count(*)::int                                                       as episodes,
            coalesce(bool_or(ae.outcome = 'accepted'), false)                   as accepted,
            coalesce(bool_or(
              ae.outcome = 'accepted' and ae.independence_weight >= 1
            ), false)                                                           as accepted_independently,
            coalesce(bool_or(ae.max_assistance_level >= 0), false)              as took_assistance,
            coalesce(bool_or(ae.solution_revealed), false)                      as revealed,
            coalesce(sum(ae.active_seconds), 0)::int                            as active_seconds,
            coalesce(sum(ae.submissions), 0)::int                               as submissions,
            count(*) filter (where ae.struggle_class in ('stuck','thrash'))::int as struggling,
            max(ae.opened_at)                                                   as last_opened_at
       from attempt_episodes ae
      where ae.subject_id = any($1::uuid[])
        and ae.opened_at >= $2
        and ae.opened_at <  $3
      group by 1, 2`,
    [subjectIds, fromIso, toIso],
  );
  return r.rows.map((row) => ({
    subjectId: row.subject_id as string,
    blockId: row.block_id as string,
    episodes: n(row.episodes),
    accepted: row.accepted === true,
    acceptedIndependently: row.accepted_independently === true,
    tookAssistance: row.took_assistance === true,
    revealed: row.revealed === true,
    activeSeconds: n(row.active_seconds),
    submissions: n(row.submissions),
    struggling: n(row.struggling),
    lastOpenedAt: iso(row.last_opened_at),
  }));
}

/* -------------------------------------------------------------------------- */
/* Lesson completions                                                         */
/* -------------------------------------------------------------------------- */

export interface ClassCompletion {
  subjectId: string;
  lessonId: string;
  completedAt: string;
  /** Null on rows written before migration 0015. Never backfill it. */
  policyId: string | null;
}

/**
 * Who has finished what, across a class.
 *
 * The four counts on `lesson_completions` (`correct`, `wrong`, `unmeasured`,
 * `attempts`) are deliberately NOT selected. Migration 0010's header forbids
 * building a level or a percentage from them — they are the browser's own tally
 * of a screen. What is a server fact is that the row EXISTS: `/api/learning/complete`
 * refuses to write one unless the policy in `schools/policies/completion.ts` is
 * satisfied against the ledger. So this returns the fact and the timestamp and
 * nothing that could be mistaken for a grade.
 */
export async function classCompletions(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<ClassCompletion[]> {
  if (subjectIds.length === 0) return [];
  const r = await sql.query<Record<string, unknown>>(
    `select subject_id, lesson_id, completed_at, policy_id
       from lesson_completions
      where subject_id = any($1::uuid[])
      order by completed_at desc`,
    [subjectIds],
  );
  return r.rows.map((row) => ({
    subjectId: row.subject_id as string,
    lessonId: row.lesson_id as string,
    completedAt: iso(row.completed_at),
    policyId: (row.policy_id as string) ?? null,
  }));
}

/* -------------------------------------------------------------------------- */
/* Assistance and its outcomes                                                */
/* -------------------------------------------------------------------------- */

export interface InterventionOutcomeRow {
  subjectId: string;
  interventionId: string;
  episodeId: string;
  level: number | null;
  deliveredAt: string;
  outcome: string;
  blockId: string | null;
}

/**
 * Every hint delivered in the window, with what the learner did next.
 *
 * This is the substrate for the assistance panel, and it already exists — the
 * sweep writes `intervention_outcomes` on every run and NOTHING has ever read
 * them back (`upsertOutcomes` is the only reference in the repo). Wiring it is
 * a query, not a pipeline.
 *
 * ## The window this data carries, which is not the dashboard's window
 *
 * `intervention_outcomes.window_spec` is stamped `same_episode/20min_active/3_submissions`
 * at write time, deliberately, so it cannot be widened after someone has seen
 * the numbers. A learner who comes back the next day and solves it is `stalled`
 * to this table. Any UI over it must say "within 20 minutes", not "after help".
 *
 * ## The escalation caveat
 *
 * `NovaChat` always posts `requestedLevel: 1` and the first grant is forced to
 * rung 0, so ANY second question inside the window classifies intervention #1
 * as `escalated` regardless of what was asked. An escalation rate at level 0 is
 * therefore not a quality judgement and the panel must not render it as one.
 */
export async function classInterventionOutcomes(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<InterventionOutcomeRow[]> {
  if (subjectIds.length === 0) return [];
  const r = await sql.query<Record<string, unknown>>(
    `select i.subject_id,
            i.intervention_id,
            i.episode_id,
            i.level,
            i.delivered_at,
            o.outcome,
            split_part(ae.task_ref, ':', 2) as block_id
       from interventions i
       join intervention_outcomes o on o.intervention_id = i.intervention_id
       left join attempt_episodes ae on ae.episode_id = i.episode_id
      where i.subject_id = any($1::uuid[])
        and i.delivered_at >= $2
        and i.delivered_at <  $3
      order by i.delivered_at asc`,
    [subjectIds, fromIso, toIso],
  );
  return r.rows.map((row) => ({
    subjectId: row.subject_id as string,
    interventionId: row.intervention_id as string,
    episodeId: row.episode_id as string,
    level: row.level === null ? null : Number(row.level),
    deliveredAt: iso(row.delivered_at),
    outcome: row.outcome as string,
    blockId: (row.block_id as string) || null,
  }));
}

export interface AssistanceDelivery {
  subjectId: string;
  /** `assistance_requested` events — help the policy let through. */
  requested: number;
  /** `assistance_delivered` events — help whose text actually streamed. */
  delivered: number;
}

/**
 * Asked for versus arrived, per learner, in the window.
 *
 * The gap is the honest "help that never came" number: a row lands in
 * `interventions` at GRANT time, before the provider is called, so a provider
 * outage still charges the rung. It is NOT the whole of demand — safety-blocked
 * and budget-blocked requests return before either event is written, on purpose,
 * so a learner throttled by the daily cap looks like a learner who never asked.
 * That is a deliberate privacy property and the panel says so rather than
 * inferring around it.
 */
export async function assistanceDelivery(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<Map<string, AssistanceDelivery>> {
  if (subjectIds.length === 0) return new Map();
  const r = await sql.query<Record<string, unknown>>(
    `select subject_id,
            count(*) filter (where event_name = 'assistance_requested')::int as requested,
            count(*) filter (where event_name = 'assistance_delivered')::int as delivered
       from learning_events
      where subject_id = any($1::uuid[])
        and event_name in ('assistance_requested', 'assistance_delivered')
        and received_at >= $2
        and received_at <  $3
      group by 1`,
    [subjectIds, fromIso, toIso],
  );
  const out = new Map<string, AssistanceDelivery>();
  for (const row of r.rows) {
    out.set(row.subject_id as string, {
      subjectId: row.subject_id as string,
      requested: n(row.requested),
      delivered: n(row.delivered),
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Delayed re-solves                                                          */
/* -------------------------------------------------------------------------- */

export interface ClassReviewRow {
  subjectId: string;
  reviewId: string;
  blockId: string;
  reason: string;
  dueAt: string;
  completedAt: string | null;
  /** `resolved_independently` | `resolved_with_assistance` | `unresolved` | null */
  outcome: string | null;
}

/**
 * The delayed re-solve queue AND its history.
 *
 * `store.dueReviews` and `store.pendingReviews` both filter `completed_at is
 * null`, so the programme's fifth independence check — "did they still have it
 * two weeks later?" — was unreadable even for one learner despite
 * `review_schedule.outcome` storing exactly that. This returns settled rows too.
 *
 * This is spaced repetition, NOT teacher review. Migration 0014 is a schedule
 * of re-solves the system sets itself; nothing here is a marking queue.
 */
export async function classReviews(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<ClassReviewRow[]> {
  if (subjectIds.length === 0) return [];
  const r = await sql.query<Record<string, unknown>>(
    `select subject_id, review_id, block_id, reason, due_at, completed_at, outcome
       from review_schedule
      where subject_id = any($1::uuid[])
      order by due_at asc`,
    [subjectIds],
  );
  return r.rows.map((row) => ({
    subjectId: row.subject_id as string,
    reviewId: row.review_id as string,
    blockId: row.block_id as string,
    reason: row.reason as string,
    dueAt: iso(row.due_at),
    completedAt: row.completed_at ? iso(row.completed_at) : null,
    outcome: (row.outcome as string) ?? null,
  }));
}

/* -------------------------------------------------------------------------- */
/* Misconceptions across the class                                            */
/* -------------------------------------------------------------------------- */

export interface ClassMistakeRow {
  subjectId: string;
  taskRef: string;
  failureClass: string;
  occurrences: number;
  lastAt: string;
}

/**
 * Author-explained mistakes, per learner per task, in the window.
 *
 * Read from `learning_events` rather than from the projection, so it is fresh
 * without waiting for a sweep — the same choice `store.attributedMistakes`
 * makes. `attribution_source = 'curriculum_diagnostic_mapping'` filters to
 * mistakes a human author actually named; the far commoner
 * `unattributed_failure` is excluded, which means this UNDERCOUNTS total
 * failures and must never be used as a denominator.
 *
 * `failure_attributed` is not client-reportable (`events.ts:96-98`), so no
 * source_trust predicate is needed — an unsigned one is never stored at all.
 */
export async function classMistakes(
  sql: SqlExecutor,
  subjectIds: readonly string[],
  fromIso: string,
  toIso: string,
): Promise<ClassMistakeRow[]> {
  if (subjectIds.length === 0) return [];
  const r = await sql.query<Record<string, unknown>>(
    `select e.subject_id,
            e.payload->>'task_ref'                as task_ref,
            e.payload->>'failure_class'           as failure_class,
            count(*)::int                         as occurrences,
            max(e.received_at)                    as last_at
       from learning_events e
      where e.subject_id = any($1::uuid[])
        and e.event_name = 'failure_attributed'
        and e.payload->>'attribution_source' = 'curriculum_diagnostic_mapping'
        and e.payload->>'failure_class' is not null
        and e.payload->>'failure_class' <> 'unattributed_failure'
        and e.received_at >= $2
        and e.received_at <  $3
      group by 1, 2, 3
      order by 4 desc`,
    [subjectIds, fromIso, toIso],
  );
  return r.rows.map((row) => ({
    subjectId: row.subject_id as string,
    taskRef: (row.task_ref as string) ?? "",
    failureClass: row.failure_class as string,
    occurrences: n(row.occurrences),
    lastAt: iso(row.last_at),
  }));
}

/* -------------------------------------------------------------------------- */
/* Where a learner is right now                                               */
/* -------------------------------------------------------------------------- */

/**
 * The most recent task each learner touched, all-time.
 *
 * Deliberately NOT windowed: the "current topic" column answers "where is this
 * child", and for a learner who has not worked this week the answer is still
 * the last thing they were on, not a blank. A blank there would read as "no
 * topic" rather than as "nothing recently", and the inactivity is already
 * carried by the status.
 *
 * `distinct on` is Postgres-specific and PGlite runs it; the `order by` inside
 * the same statement is what selects the row per subject, so the two clauses
 * must stay in step.
 */
export async function latestTaskPerSubject(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<Map<string, { taskRef: string; openedAt: string }>> {
  if (subjectIds.length === 0) return new Map();
  const r = await sql.query<{ subject_id: string; task_ref: string; opened_at: string }>(
    `select distinct on (ae.subject_id)
            ae.subject_id, ae.task_ref, ae.opened_at
       from attempt_episodes ae
      where ae.subject_id = any($1::uuid[])
      order by ae.subject_id, ae.opened_at desc`,
    [subjectIds],
  );
  const out = new Map<string, { taskRef: string; openedAt: string }>();
  for (const row of r.rows) {
    out.set(row.subject_id, { taskRef: row.task_ref, openedAt: iso(row.opened_at) });
  }
  return out;
}

/**
 * Per-episode rows for ONE learner, for the drill-down timeline.
 *
 * Bounded by `limit` and by the window. Nine months of raw episodes is not a
 * timeline anybody reads, and the brief is explicit that a browser must not be
 * handed the whole history.
 */
export interface EpisodeRowForTimeline {
  episodeId: string;
  taskRef: string;
  openedAt: string;
  closedAt: string | null;
  outcome: string;
  independenceWeight: number;
  maxAssistanceLevel: number;
  interventionCount: number;
  solutionRevealed: boolean;
  activeSeconds: number;
  submissions: number;
  struggleClass: string | null;
}

export async function episodesForSubject(
  sql: SqlExecutor,
  subjectId: string,
  fromIso: string,
  toIso: string,
  limit = 200,
): Promise<EpisodeRowForTimeline[]> {
  const r = await sql.query<Record<string, unknown>>(
    `select episode_id, task_ref, opened_at, closed_at, outcome,
            independence_weight, max_assistance_level, intervention_count,
            solution_revealed, active_seconds, submissions, struggle_class
       from attempt_episodes
      where subject_id = $1
        and opened_at >= $2
        and opened_at <  $3
      order by opened_at desc
      limit $4`,
    [subjectId, fromIso, toIso, limit],
  );
  return r.rows.map((row) => ({
    episodeId: row.episode_id as string,
    taskRef: row.task_ref as string,
    openedAt: iso(row.opened_at),
    closedAt: row.closed_at ? iso(row.closed_at) : null,
    outcome: row.outcome as string,
    independenceWeight: Number(row.independence_weight),
    maxAssistanceLevel: Number(row.max_assistance_level),
    interventionCount: n(row.intervention_count),
    solutionRevealed: row.solution_revealed === true,
    activeSeconds: n(row.active_seconds),
    submissions: n(row.submissions),
    struggleClass: (row.struggle_class as string) ?? null,
  }));
}

/* -------------------------------------------------------------------------- */
/* Freshness                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * When the reducer last wrote anything, deployment-wide.
 *
 * Every cumulative number on the dashboard is as old as this. It must be on
 * screen: between sweeps the panel is showing the past, and a teacher who
 * cannot see that will read a stale projection as live.
 */
export async function lastSweepAt(sql: SqlExecutor): Promise<string | null> {
  const r = await sql.query<{ at: string | null }>(
    `select max(reduced_at) as at from attempt_episodes`,
  );
  const v = r.rows[0]?.at;
  return v ? iso(v) : null;
}

/**
 * Events that have not yet been folded into an episode.
 *
 * A non-zero number here with an old `lastSweepAt` is the reducer being behind,
 * which is the one operational fact that changes how a teacher should read
 * every other number on the page.
 */
export async function unreducedEventCount(
  sql: SqlExecutor,
  subjectIds: readonly string[],
): Promise<number> {
  if (subjectIds.length === 0) return 0;
  const r = await sql.query<{ n: number }>(
    `select count(*)::int as n
       from learning_events e
      where e.subject_id = any($1::uuid[])
        and e.episode_id is not null
        and not exists (
          select 1 from attempt_episodes ae where ae.episode_id = e.episode_id
        )`,
    [subjectIds],
  );
  return n(r.rows[0]?.n);
}

/* -------------------------------------------------------------------------- */

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  return new Date(0).toISOString();
}
