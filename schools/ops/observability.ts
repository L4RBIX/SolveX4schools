import "server-only";
import type { SqlExecutor } from "@schools/store/sql";

/**
 * The five questions, answered from data that is already there.
 *
 * During the pilot someone will need to answer, on a Tuesday morning, with no
 * warning:
 *
 *   1. How many execution requests failed?
 *   2. How many Nova requests failed?
 *   3. How many lesson saves failed?
 *   4. How many students are active?
 *   5. Did the reducer fall behind?
 *
 * Four and five, and the durable halves of one to three, are answerable with
 * `select`. That is the point of this file: the ledger already records what
 * happened, so adding a second write path to record that it happened would
 * cost a write on every learner interaction to answer a question a query
 * already answers — and would introduce a way for the two to disagree.
 *
 * ## What a query genuinely cannot answer
 *
 * A write that failed leaves no row. A judge that never answered produces no
 * `verdict_received`. Those are counted in memory as they happen — see
 * `schools/ops/counters.ts` — and reported next to these figures with an
 * explicit note that they reset on deploy. The two are kept visibly separate
 * because they mean different things: the ledger numbers are durable history,
 * the counters are this process's recent experience.
 *
 * ## Why raw SQL rather than `LearningStore`
 *
 * `LearningStore`'s own header says routes speak to it and not to SQL. These
 * are not routes: they are read-only aggregates that exist for one operator and
 * would otherwise add eight methods to a class the whole product depends on,
 * every one of them used by exactly one caller. `/api/health/learning` already
 * reaches for `sql` directly for the same reason. Nothing here writes.
 */

export interface LearningActivity {
  /** Distinct learners with any event in the last 24 hours. */
  activeToday: number;
  /** Distinct learners with any event in the last 7 days. */
  activeThisWeek: number;
  /** Subjects scoped to a class at all. The pilot's denominator. */
  enrolledSubjects: number;
  /** Graded attempts in the last 24 hours. */
  verdictsToday: number;
  /** All-time graded attempts, and how many carry judge trust. */
  verdicts: { total: number; judged: number; judgedShare: number | null };
}

export interface AssistanceHealth {
  /** Hints asked for, all time. Written before the model is called. */
  requested: number;
  /**
   * Hints whose text actually reached a learner. Written only once tokens
   * streamed, which is what makes the gap below meaningful.
   */
  delivered: number;
  /**
   * Requests that produced nothing. A provider outage, a learner who closed
   * the panel, or a request still in flight. NOT a precise failure count — the
   * `nova.failures` counter is that — but it is the durable one, and it
   * survives the deploy that zeroes the counter.
   */
  undelivered: number;
}

export interface ReducerHealth {
  lastSweepAt: string | null;
  sweepAgeSeconds: number | null;
  /** Episode events the reducer has not folded in. */
  unreducedEvents: number;
  /**
   * True only when there is work waiting AND it has been waiting too long.
   *
   * `lastSweepAt` is the newest `reduced_at`, so it stops moving the moment the
   * queue empties. A quiet classroom is not a dead reducer, and reporting it as
   * one trains everybody to ignore this field.
   */
  behind: boolean;
}

const STALE_AFTER_MS = 5 * 60 * 1000;

export async function learningActivity(sql: SqlExecutor): Promise<LearningActivity> {
  const active = await sql.query<{ today: number; week: number }>(
    `select
       count(distinct subject_id) filter (where received_at > now() - interval '24 hours')::int as today,
       count(distinct subject_id) filter (where received_at > now() - interval '7 days')::int   as week
     from learning_events`,
  );

  /* Scoped subjects rather than accounts: this is the number the teacher
     projection can actually read, and a learner who has an account but was
     never scoped to a class is invisible to it. Reporting the two separately
     would be more precise and would also invite reading the larger one. */
  const enrolled = await sql.query<{ n: number }>(
    `select count(*)::int as n from school_subject_scope`,
  );

  const today = await sql.query<{ n: number }>(
    `select count(*)::int as n from learning_events
      where event_name = 'verdict_received'
        and received_at > now() - interval '24 hours'`,
  );

  const trust = await sql.query<{ source_trust: string; n: number }>(
    `select source_trust, count(*)::int as n from learning_events
      where event_name = 'verdict_received' group by 1`,
  );
  const total = trust.rows.reduce((n, r) => n + Number(r.n), 0);
  const judged = Number(trust.rows.find((r) => r.source_trust === "judge")?.n ?? 0);

  return {
    activeToday: Number(active.rows[0]?.today ?? 0),
    activeThisWeek: Number(active.rows[0]?.week ?? 0),
    enrolledSubjects: Number(enrolled.rows[0]?.n ?? 0),
    verdictsToday: Number(today.rows[0]?.n ?? 0),
    verdicts: { total, judged, judgedShare: total === 0 ? null : judged / total },
  };
}

export async function assistanceHealth(sql: SqlExecutor): Promise<AssistanceHealth> {
  const r = await sql.query<{ event_name: string; n: number }>(
    `select event_name, count(*)::int as n from learning_events
      where event_name in ('assistance_requested', 'assistance_delivered')
      group by 1`,
  );
  const requested = Number(r.rows.find((x) => x.event_name === "assistance_requested")?.n ?? 0);
  const delivered = Number(r.rows.find((x) => x.event_name === "assistance_delivered")?.n ?? 0);
  return { requested, delivered, undelivered: Math.max(0, requested - delivered) };
}

export async function reducerHealth(
  sql: SqlExecutor,
  lastSweepAt: string | null,
): Promise<ReducerHealth> {
  const stale = await sql.query<{ n: number }>(
    `select count(*)::int as n from learning_events e
      left join attempt_episodes a on a.episode_id = e.episode_id
     where e.episode_id is not null and a.episode_id is null`,
  );
  const unreducedEvents = Number(stale.rows[0]?.n ?? 0);
  const ageMs = lastSweepAt ? Date.now() - Date.parse(lastSweepAt) : null;

  return {
    lastSweepAt,
    sweepAgeSeconds: ageMs === null ? null : Math.round(ageMs / 1000),
    unreducedEvents,
    behind: unreducedEvents > 0 && ageMs !== null && ageMs > STALE_AFTER_MS,
  };
}
