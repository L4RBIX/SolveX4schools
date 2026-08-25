import "server-only";
import { randomUUID } from "node:crypto";
import type {
  LearnerState,
  SkillState,
  ReducibleEvent,
  ReducedEpisode,
  InterventionRow,
  ComputedOutcome,
  EpisodeInput,
} from "@solvex/learning-intelligence-core";
import type { LearningEventName, LearningPayload } from "@solvex/learning-contracts";
import type { SqlExecutor } from "./sql";

/**
 * The learning store.
 *
 * The only thing any route touches. No route writes SQL, so the engine
 * underneath can change and the product does not notice.
 *
 * Two rules shape it:
 *
 * 1. **`learning_events` is the source of truth. Everything else is a cache.**
 *    Episodes, learner state and skill state are all recomputable by replay,
 *    which is what makes bumping a reducer version safe — stale rows get
 *    recomputed rather than reinterpreted. Deleting every projection row costs
 *    a sweep and loses no facts.
 *
 * 2. **Nothing authoritative may live in a browser.** A learner refreshes, logs
 *    out, and comes back on a different machine to the same progress. A teacher
 *    reading a class list is never reading something a student could edit in
 *    DevTools.
 */

export type SourceTrust = "server" | "judge" | "verifier" | "browser";
export type Cohort = "beta" | "internal" | "public";

export interface LearningEventRow {
  eventId: string;
  subjectId: string;
  episodeId: string | null;
  sessionId: string;
  seq: number;
  eventName: LearningEventName;
  occurredAt: string;
  sourceTrust: SourceTrust;
  environment: "production" | "preview" | "development";
  cohort: Cohort;
  route: string;
  payload: LearningPayload;
}

export interface EpisodeRow {
  episodeId: string;
  subjectId: string;
  taskRef: string;
  taskKind: string;
  reduced: ReducedEpisode;
}

export interface StaleEpisode {
  episodeId: string;
  subjectId: string;
}

export class LearningStore {
  constructor(private sql: SqlExecutor) {}

  /* --- identity --------------------------------------------------------- */

  /**
   * Resolve an anonymous device key to a subject, creating one if needed.
   *
   * The alias table is what lets a learner's work follow them onto an account
   * later without the account being retroactively handed someone else's
   * history — the migration's own comment calls this "merge, never reassign".
   */
  async resolveSubject(
    anonId: string,
    cohort: Cohort = "public",
    scope?: { schoolId: string; classId: string },
  ): Promise<string> {
    const existing = await this.sql.query<{ subject_id: string }>(
      `select subject_id from learning_subject_aliases
        where alias_kind = 'anon_id' and alias_value = $1`,
      [anonId],
    );
    if (existing.rows.length > 0) {
      const id = existing.rows[0].subject_id;
      await this.sql.query(
        `update learning_subjects set last_seen_at = now() where subject_id = $1`,
        [id],
      );
      return id;
    }

    const subjectId = randomUUID();
    await this.sql.tx(async (t) => {
      await t.query(
        `insert into learning_subjects (subject_id, primary_anon_id, cohort)
         values ($1, $2, $3)`,
        [subjectId, anonId, cohort],
      );
      await t.query(
        `insert into learning_subject_aliases (alias_kind, alias_value, subject_id)
         values ('anon_id', $1, $2)
         on conflict (alias_kind, alias_value) do nothing`,
        [anonId, subjectId],
      );
      /* Scoped at creation. A subject with no class is invisible to every
         teacher query — which is the safe default, and also means a learner
         whose scoping was forgotten silently vanishes from their own class
         list. Doing it here makes forgetting impossible. */
      if (scope) {
        await t.query(
          `insert into school_subject_scope (subject_id, school_id, class_id, created_at)
           values ($1, $2, $3, now())
           on conflict (subject_id) do nothing`,
          [subjectId, scope.schoolId, scope.classId],
        );
      }
    });
    return subjectId;
  }

  /* --- L1: ingest ------------------------------------------------------- */

  /**
   * Append events. Returns how many were NEW.
   *
   * `on conflict do nothing` on `event_id` is the idempotency guarantee: a
   * retried beacon, a duplicated batch or a double-fired effect collapses to
   * one row. Attempt counts are what the entire learner state is built from, so
   * double-counting here corrupts everything downstream silently.
   */
  async appendEvents(rows: readonly LearningEventRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    let inserted = 0;
    await this.sql.tx(async (t) => {
      for (const r of rows) {
        const res = await t.query(
          `insert into learning_events
             (event_id, subject_id, episode_id, session_id, seq, event_name,
              occurred_at, source_trust, environment, cohort, route, payload)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
           on conflict (event_id) do nothing`,
          [
            r.eventId,
            r.subjectId,
            r.episodeId,
            r.sessionId,
            r.seq,
            r.eventName,
            r.occurredAt,
            r.sourceTrust,
            r.environment,
            r.cohort,
            r.route,
            JSON.stringify(r.payload),
          ],
        );
        if (res.rowCount > 0) inserted += 1;
      }
    });
    return inserted;
  }

  /* --- L2: episodes ----------------------------------------------------- */

  /**
   * Episodes with events the reducer has not folded in.
   *
   * "Stale" means either never reduced, or reduced by an older reducer, or
   * carrying events newer than the last reduction. All three are the same
   * remedy — replay — so they are one query.
   */
  async staleEpisodes(limit: number, reducerVersion: number): Promise<StaleEpisode[]> {
    const r = await this.sql.query<{ episode_id: string; subject_id: string }>(
      `select distinct e.episode_id, e.subject_id
         from learning_events e
         left join attempt_episodes a on a.episode_id = e.episode_id
        where e.episode_id is not null
          and (a.episode_id is null
               or a.reducer_version < $1
               or e.received_at > a.reduced_at)
        limit $2`,
      [reducerVersion, limit],
    );
    return r.rows.map((row) => ({ episodeId: row.episode_id, subjectId: row.subject_id }));
  }

  /** One episode's events, in the order the reducer expects. */
  async eventsForEpisode(episodeId: string): Promise<ReducibleEvent[]> {
    const r = await this.sql.query<{
      event_name: string;
      occurred_at: string;
      received_at: string;
      seq: number;
      payload: Record<string, string | number | boolean>;
    }>(
      `select event_name, occurred_at, received_at, seq, payload
         from learning_events
        where episode_id = $1
        order by received_at asc, seq asc`,
      [episodeId],
    );
    return r.rows.map((row) => ({
      event_name: row.event_name,
      occurred_at: toIso(row.occurred_at),
      received_at: toIso(row.received_at),
      seq: Number(row.seq),
      payload: row.payload ?? {},
    }));
  }

  /** Every event for one subject, ordered. Used by a full replay and the dev lab. */
  async eventsForSubject(subjectId: string): Promise<ReducibleEvent[]> {
    const r = await this.sql.query<{
      event_name: string; occurred_at: string; received_at: string;
      seq: number; payload: Record<string, string | number | boolean>;
    }>(
      `select event_name, occurred_at, received_at, seq, payload
         from learning_events where subject_id = $1
        order by received_at asc, seq asc`,
      [subjectId],
    );
    return r.rows.map((row) => ({
      event_name: row.event_name,
      occurred_at: toIso(row.occurred_at),
      received_at: toIso(row.received_at),
      seq: Number(row.seq),
      payload: row.payload ?? {},
    }));
  }

  async upsertEpisode(row: EpisodeRow): Promise<void> {
    const e = row.reduced;
    await this.sql.query(
      `insert into attempt_episodes
         (episode_id, subject_id, task_ref, task_kind, opened_at, closed_at,
          active_seconds, resume_count, outcome, verdict_sequence, diff_class_sequence,
          submissions, runs, self_authored_tests, statement_revisits, language,
          max_assistance_level, intervention_count, solution_revealed,
          independence_weight, struggle_class, event_count, reducer_version,
          skill_id, attributions, attributed_failures,
          statement_revisits_after_failure, reduced_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,
               $17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26,$27, now())
       on conflict (episode_id) do update set
         closed_at = excluded.closed_at,
         active_seconds = excluded.active_seconds,
         resume_count = excluded.resume_count,
         outcome = excluded.outcome,
         verdict_sequence = excluded.verdict_sequence,
         diff_class_sequence = excluded.diff_class_sequence,
         submissions = excluded.submissions,
         runs = excluded.runs,
         self_authored_tests = excluded.self_authored_tests,
         statement_revisits = excluded.statement_revisits,
         language = excluded.language,
         max_assistance_level = excluded.max_assistance_level,
         intervention_count = excluded.intervention_count,
         solution_revealed = excluded.solution_revealed,
         independence_weight = excluded.independence_weight,
         struggle_class = excluded.struggle_class,
         event_count = excluded.event_count,
         reducer_version = excluded.reducer_version,
         skill_id = excluded.skill_id,
         attributions = excluded.attributions,
         attributed_failures = excluded.attributed_failures,
         statement_revisits_after_failure = excluded.statement_revisits_after_failure,
         reduced_at = now()`,
      [
        row.episodeId, row.subjectId, row.taskRef, row.taskKind,
        e.opened_at, e.closed_at, e.active_seconds, e.resume_count, e.outcome,
        JSON.stringify(e.verdict_sequence), JSON.stringify(e.diff_class_sequence),
        e.submissions, e.runs, e.self_authored_tests, e.statement_revisits, e.language,
        e.max_assistance_level, e.intervention_count, e.solution_revealed,
        e.independence_weight, e.struggle_class, e.event_count, e.reducer_version,
        e.skill_id,
        JSON.stringify(e.attributions),
        e.attributed_failures,
        e.statement_revisits_after_failure,
      ],
    );
  }

  /* --- L3: assistance --------------------------------------------------- */

  async upsertInterventions(rows: readonly InterventionRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.sql.tx(async (t) => {
      for (const r of rows) {
        await t.query(
          `insert into interventions
             (intervention_id, subject_id, episode_id, kind, level, trigger, mode,
              pre_attempts, pre_runs, pre_active_seconds, pre_last_verdict,
              pre_diff_class, pre_code_hash, evidence_type, contains_code,
              content_len, delivered_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           on conflict (intervention_id) do nothing`,
          [
            r.intervention_id, r.subject_id, r.episode_id, r.kind, r.level, r.trigger,
            r.mode, r.pre_attempts, r.pre_runs, r.pre_active_seconds, r.pre_last_verdict,
            r.pre_diff_class, r.pre_code_hash, r.evidence_type, r.contains_code,
            r.content_len, r.delivered_at,
          ],
        );
      }
    });
  }

  async upsertOutcomes(rows: readonly ComputedOutcome[]): Promise<void> {
    if (rows.length === 0) return;
    await this.sql.tx(async (t) => {
      for (const o of rows) {
        await t.query(
          `insert into intervention_outcomes
             (intervention_id, window_spec, outcome, post_diff_class,
              delta_tests_passed, seconds_to_outcome, reducer_version)
           values ($1,$2,$3,$4,$5,$6,$7)
           on conflict (intervention_id) do update set
             outcome = excluded.outcome,
             post_diff_class = excluded.post_diff_class,
             delta_tests_passed = excluded.delta_tests_passed,
             seconds_to_outcome = excluded.seconds_to_outcome,
             reducer_version = excluded.reducer_version,
             computed_at = now()`,
          [
            o.intervention_id, o.window_spec, o.outcome, o.post_diff_class,
            o.delta_tests_passed, o.seconds_to_outcome, o.reducer_version,
          ],
        );
      }
    });
  }

  /** Interventions for one subject, in the shape `computeInterventionOutcome` wants. */
  async interventionsForSubject(subjectId: string): Promise<InterventionRow[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select * from interventions where subject_id = $1 order by delivered_at asc`,
      [subjectId],
    );
    return r.rows.map((row) => ({
      intervention_id: row.intervention_id as string,
      subject_id: row.subject_id as string,
      episode_id: row.episode_id as string,
      kind: row.kind as string,
      level: row.level === null ? null : Number(row.level),
      trigger: row.trigger as string,
      mode: (row.mode as string) ?? null,
      pre_attempts: Number(row.pre_attempts),
      pre_runs: Number(row.pre_runs),
      pre_active_seconds: Number(row.pre_active_seconds),
      pre_last_verdict: (row.pre_last_verdict as string) ?? null,
      pre_diff_class: (row.pre_diff_class as string) ?? null,
      pre_code_hash: (row.pre_code_hash as string) ?? null,
      pre_tests_passed: null,
      evidence_type: (row.evidence_type as string) ?? null,
      contains_code: Boolean(row.contains_code),
      content_len: Number(row.content_len),
      delivered_at: toIso(row.delivered_at as string),
    }));
  }

  /* --- L4: learner state ------------------------------------------------ */

  /**
   * Everything `buildLearnerState` needs, assembled from the projections.
   *
   * The `skill` field carries the rule that keeps ungraded work out of the
   * model: an episode with no verdict has no skill, so it contributes no
   * attempt. See `episodeInputs.ts` — dropping that rule is the one-line change
   * that would tell a child they are struggling at work nobody marked.
   */
  async episodeInputsFor(subjectId: string): Promise<EpisodeInput[]> {
    const eps = await this.sql.query<Record<string, unknown>>(
      `select * from attempt_episodes where subject_id = $1 order by opened_at asc`,
      [subjectId],
    );
    const outcomes = await this.sql.query<Record<string, unknown>>(
      `select o.*, i.episode_id from intervention_outcomes o
         join interventions i on i.intervention_id = o.intervention_id
        where i.subject_id = $1`,
      [subjectId],
    );

    const byEpisode = new Map<string, ComputedOutcome[]>();
    for (const o of outcomes.rows) {
      const key = o.episode_id as string;
      const list = byEpisode.get(key) ?? [];
      list.push({
        intervention_id: o.intervention_id as string,
        window_spec: o.window_spec as string,
        outcome: o.outcome as ComputedOutcome["outcome"],
        post_diff_class: (o.post_diff_class as string) ?? null,
        delta_tests_passed: o.delta_tests_passed === null ? null : Number(o.delta_tests_passed),
        seconds_to_outcome: o.seconds_to_outcome === null ? null : Number(o.seconds_to_outcome),
        reducer_version: Number(o.reducer_version),
      });
      byEpisode.set(key, list);
    }

    return eps.rows.map((row) => {
      const reduced = rowToReducedEpisode(row);
      return {
        episodeId: row.episode_id as string,
        skill: reduced.skill_id,
        taskRef: row.task_ref as string,
        episode: reduced,
        outcomes: byEpisode.get(row.episode_id as string) ?? [],
      };
    });
  }

  async putLearnerState(subjectId: string, state: LearnerState): Promise<void> {
    await this.sql.tx(async (t) => {
      await t.query(
        `insert into learner_state
           (subject_id, episodes, interventions, hint_dependency,
            median_seconds_to_first_hint, transfer_solves,
            intervention_outcome_counts, unattributed_failures,
            attributed_failures, state_version, computed_at)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, now())
         on conflict (subject_id) do update set
           episodes = excluded.episodes,
           interventions = excluded.interventions,
           hint_dependency = excluded.hint_dependency,
           median_seconds_to_first_hint = excluded.median_seconds_to_first_hint,
           transfer_solves = excluded.transfer_solves,
           intervention_outcome_counts = excluded.intervention_outcome_counts,
           unattributed_failures = excluded.unattributed_failures,
           attributed_failures = excluded.attributed_failures,
           state_version = excluded.state_version,
           computed_at = now()`,
        [
          subjectId,
          state.episodes,
          state.assistance.interventions,
          state.assistance.hintDependency,
          state.assistance.medianSecondsToFirstHint,
          state.assistance.transferSolves,
          JSON.stringify(state.assistance.outcomeCounts ?? {}),
          state.unattributedFailures,
          state.skills.reduce((n, s) => n + s.attributedFailures, 0),
          state.version,
        ],
      );

      // Skill rows are replaced wholesale rather than merged: the state is a
      // projection, and a skill that stopped appearing must stop being claimed.
      await t.query(`delete from learner_skill_state where subject_id = $1`, [subjectId]);
      for (const s of state.skills) {
        await t.query(
          `insert into learner_skill_state
             (subject_id, skill_id, level, attempts, solved, solo_solved,
              assisted_solved, failures, attributed_failures, distinct_tasks,
              misconceptions, rationale, state_version, computed_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13, now())`,
          [
            subjectId, s.skill, s.level, s.attempts, s.solved, s.soloSolved,
            s.assistedSolved, s.failures, s.attributedFailures, s.distinctTasks,
            JSON.stringify(s.misconceptions), s.rationale, state.version,
          ],
        );
      }
    });
  }

  async getLearnerState(
    subjectId: string,
  ): Promise<{ state: LearnerState; computedAt: string } | null> {
    const head = await this.sql.query<Record<string, unknown>>(
      `select * from learner_state where subject_id = $1`,
      [subjectId],
    );
    if (head.rows.length === 0) return null;
    const h = head.rows[0];

    const skills = await this.sql.query<Record<string, unknown>>(
      `select * from learner_skill_state where subject_id = $1 order by skill_id asc`,
      [subjectId],
    );

    const state: LearnerState = {
      subject: subjectId,
      episodes: Number(h.episodes),
      skills: skills.rows.map(rowToSkillState),
      assistance: {
        interventions: Number(h.interventions),
        /* The column is nullable and the type is not, and that gap is real:
           the migration's comment says a learner who never solves "has no
           dependency reading rather than a zero one", which is a distinction
           `AssistanceProfile.hintDependency: number` cannot express. The core
           only ever emits a number, so a null here can only have come from
           somewhere else; it reads as 0 and the type stays honest. */
        hintDependency: h.hint_dependency === null ? 0 : Number(h.hint_dependency),
        medianSecondsToFirstHint:
          h.median_seconds_to_first_hint === null ? null : Number(h.median_seconds_to_first_hint),
        transferSolves: Number(h.transfer_solves),
        outcomeCounts: (h.intervention_outcome_counts ?? {}) as never,
      },
      unattributedFailures: Number(h.unattributed_failures),
      version: Number(h.state_version),
    };

    return { state, computedAt: toIso(h.computed_at as string) };
  }

  /* --- Nova ladder ------------------------------------------------------
     Derived on the server from the ledger, never accepted from a client. A
     browser that could name its own last hint level could name level 4. */

  async lastGrantedLevel(episodeId: string): Promise<number> {
    const r = await this.sql.query<{ level: number | null }>(
      `select max(level) as level from interventions where episode_id = $1`,
      [episodeId],
    );
    const v = r.rows[0]?.level;
    return v === null || v === undefined ? -1 : Number(v);
  }

  async lastHintAt(episodeId: string): Promise<string | null> {
    const r = await this.sql.query<{ at: string | null }>(
      `select max(delivered_at) as at from interventions where episode_id = $1`,
      [episodeId],
    );
    const v = r.rows[0]?.at;
    return v ? toIso(v) : null;
  }

  async recordIntervention(row: {
    interventionId: string;
    subjectId: string;
    episodeId: string;
    kind: string;
    level: number | null;
    trigger: string;
    mode: string | null;
    containsCode: boolean;
    contentLen: number;
  }): Promise<void> {
    await this.sql.query(
      `insert into interventions
         (intervention_id, subject_id, episode_id, kind, level, trigger, mode,
          contains_code, content_len)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (intervention_id) do nothing`,
      [
        row.interventionId, row.subjectId, row.episodeId, row.kind, row.level,
        row.trigger, row.mode, row.containsCode, row.contentLen,
      ],
    );
  }

  /* --- school scoping ----------------------------------------------------
     Every teacher-facing read goes through here. There is deliberately no
     method that returns subjects without a class, because the shipped
     alternative — a flat `SOLVEX_ADMIN_USER_IDS` allowlist — grants one person
     every child in the database, which is exactly the access model a school
     cannot accept. */

  async putSubjectScope(scope: {
    subjectId: string;
    schoolId: string;
    classId: string;
  }): Promise<void> {
    await this.sql.query(
      `insert into school_subject_scope (subject_id, school_id, class_id, created_at)
       values ($1, $2, $3, now())
       on conflict (subject_id) do update set
         school_id = excluded.school_id, class_id = excluded.class_id`,
      [scope.subjectId, scope.schoolId, scope.classId],
    );
  }

  async getSubjectScope(
    subjectId: string,
  ): Promise<{ schoolId: string; classId: string } | null> {
    const r = await this.sql.query<{ school_id: string; class_id: string }>(
      `select school_id, class_id from school_subject_scope where subject_id = $1`,
      [subjectId],
    );
    if (r.rows.length === 0) return null;
    return { schoolId: r.rows[0].school_id, classId: r.rows[0].class_id };
  }

  async subjectsInClass(classId: string): Promise<string[]> {
    const r = await this.sql.query<{ subject_id: string }>(
      `select subject_id from school_subject_scope where class_id = $1 order by created_at asc`,
      [classId],
    );
    return r.rows.map((row) => row.subject_id);
  }

  /**
   * Is this subject inside this class?
   *
   * The single check every teacher route makes before returning anything. A
   * route that forgets it is a route that hands a teacher another school's
   * child, so it is one call rather than a pattern to remember.
   */
  async isInClass(subjectId: string, classId: string): Promise<boolean> {
    const r = await this.sql.query<{ n: number }>(
      `select count(*)::int as n from school_subject_scope
        where subject_id = $1 and class_id = $2`,
      [subjectId, classId],
    );
    return r.rows[0].n > 0;
  }

  /** Learner states for a whole class, in one round trip. */
  async learnerStatesForClass(
    classId: string,
  ): Promise<{ subjectId: string; state: LearnerState; computedAt: string }[]> {
    const subjects = await this.subjectsInClass(classId);
    const out: { subjectId: string; state: LearnerState; computedAt: string }[] = [];
    for (const subjectId of subjects) {
      const s = await this.getLearnerState(subjectId);
      if (s) out.push({ subjectId, state: s.state, computedAt: s.computedAt });
    }
    return out;
  }

  /** Last activity per subject, for the "no activity" signal. */
  async lastActivityForClass(classId: string): Promise<Map<string, string>> {
    const r = await this.sql.query<{ subject_id: string; at: string }>(
      `select e.subject_id, max(e.received_at) as at
         from learning_events e
         join school_subject_scope s on s.subject_id = e.subject_id
        where s.class_id = $1
        group by 1`,
      [classId],
    );
    return new Map(r.rows.map((row) => [row.subject_id, toIso(row.at)]));
  }

  /* --- ops -------------------------------------------------------------- */

  /**
   * Claim the sweep lease.
   *
   * One atomic statement, so exactly one of {interval, ingest hook, cron}
   * sweeps at a time and a crashed holder's lease expires rather than wedging
   * the reducer forever.
   */
  async claimReducerLease(owner: string, ttlSeconds: number): Promise<boolean> {
    const r = await this.sql.query<{ owner: string }>(
      `insert into reducer_lease (id, owner, expires_at)
       values ('sweep', $1, now() + make_interval(secs => $2))
       on conflict (id) do update set
         owner = excluded.owner,
         expires_at = excluded.expires_at
         where reducer_lease.expires_at < now()
       returning owner`,
      [owner, ttlSeconds],
    );
    return r.rows.length > 0 && r.rows[0].owner === owner;
  }

  async releaseReducerLease(owner: string): Promise<void> {
    await this.sql.query(
      `delete from reducer_lease where id = 'sweep' and owner = $1`,
      [owner],
    );
  }

  async lastSweepAt(): Promise<string | null> {
    const r = await this.sql.query<{ at: string | null }>(
      `select max(reduced_at) as at from attempt_episodes`,
    );
    return r.rows[0]?.at ? toIso(r.rows[0].at) : null;
  }
}

/* -------------------------------------------------------------------------- */

/** Postgres returns timestamps as Date under some drivers and string under others. */
function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  return new Date(0).toISOString();
}

function rowToReducedEpisode(row: Record<string, unknown>): ReducedEpisode {
  return {
    task_ref: row.task_ref as string,
    task_kind: row.task_kind as string,
    opened_at: toIso(row.opened_at),
    closed_at: row.closed_at ? toIso(row.closed_at) : null,
    active_seconds: Number(row.active_seconds),
    resume_count: Number(row.resume_count),
    outcome: row.outcome as ReducedEpisode["outcome"],
    verdict_sequence: (row.verdict_sequence ?? []) as ReducedEpisode["verdict_sequence"],
    diff_class_sequence: (row.diff_class_sequence ?? []) as ReducedEpisode["diff_class_sequence"],
    submissions: Number(row.submissions),
    runs: Number(row.runs),
    self_authored_tests: Number(row.self_authored_tests),
    statement_revisits: Number(row.statement_revisits),
    statement_revisits_after_failure: Number(row.statement_revisits_after_failure ?? 0),
    language: (row.language as string) ?? null,
    skill_id: (row.skill_id as string) ?? null,
    max_assistance_level: Number(row.max_assistance_level),
    intervention_count: Number(row.intervention_count),
    solution_revealed: Boolean(row.solution_revealed),
    independence_weight: Number(row.independence_weight),
    struggle_class: (row.struggle_class as ReducedEpisode["struggle_class"]) ?? null,
    /* Load-bearing. These are the ONLY source of every misconception
       downstream; reading them back as empty makes the model structurally
       incapable of learning anything, silently. */
    attributions: (row.attributions ?? []) as ReducedEpisode["attributions"],
    attributed_failures: Number(row.attributed_failures ?? 0),
    event_count: Number(row.event_count),
    reducer_version: Number(row.reducer_version),
  };
}

function rowToSkillState(row: Record<string, unknown>): SkillState {
  return {
    skill: row.skill_id as string,
    level: row.level as SkillState["level"],
    attempts: Number(row.attempts),
    solved: Number(row.solved),
    soloSolved: Number(row.solo_solved),
    assistedSolved: Number(row.assisted_solved),
    failures: Number(row.failures),
    attributedFailures: Number(row.attributed_failures),
    distinctTasks: Number(row.distinct_tasks),
    misconceptions: (row.misconceptions ?? []) as SkillState["misconceptions"],
    rationale: (row.rationale as string) ?? "",
  };
}
