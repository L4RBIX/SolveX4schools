import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import { LEAGUE_POLICY_VERSION, settleGroup } from "./standings";
import { currentWeek } from "./week";
import { bump } from "@schools/ops/counters";

/**
 * Closing a week.
 *
 * ## Three triggers, one implementation
 *
 * Copied deliberately from `schools/reducer/trigger.ts`, which already solved
 * this problem for the reducer and states the shape: an in-process interval, an
 * opportunistic hook, and an external cron, "All three take the same lease, so
 * extra triggers are harmless."
 *
 * Here the opportunistic hook is the important one. `settleDueWeeks` is called
 * on every read of the league screen, so **opening the page settles last week
 * if nobody else has**. A learner who signs in on Monday morning after a
 * weekend in which the server was asleep sees their result immediately, and the
 * product does not depend on a scheduled job having fired.
 *
 * That matters more here than it did for the reducer, because there IS no cron
 * in this deployment. `LEARNING_CRON_SECRET` has no consumer and the
 * `/api/learning/reduce` route `.env.example` advertises does not exist. A
 * settlement that only ran from a scheduler would be a settlement that never
 * ran.
 *
 * ## Why retrying is free
 *
 * `settleGroup` is pure and total: the same members at the same XP always
 * produce the same rows. Every write below is `on conflict do nothing`. So a
 * settlement that crashes halfway, or two that run at once, or one that is
 * simply run again, all converge on the same result and none of them can
 * produce a second promotion.
 *
 * The lease is therefore an efficiency measure, not a correctness one. That is
 * the right way round: a correctness guarantee that depends on a lease is a
 * guarantee that evaporates the first time the lease expires under a slow
 * query.
 */

export interface SettleOptions {
  /** Threaded from the caller, never read from the clock in here. */
  now: Date;
  /** Bounds one pass. A class settles in one group; this is a runaway guard. */
  limit?: number;
  /** Lease owner. Defaults to a per-process id. */
  owner?: string;
}

export interface SettleResult {
  groupsSettled: number;
  learnersMoved: { promoted: number; stayed: number; relegated: number };
  /** True when another worker held the lease. Not an error. */
  skipped: boolean;
}

const LEASE_ID = "league_settlement";
const LEASE_SECONDS = 60;

/**
 * Settle every group whose week has closed.
 *
 * "Closed" is `week_id < current week id`, compared as a string. ISO week ids
 * sort lexicographically — `2026-W09` before `2026-W10`, and `2026-W52` before
 * `2027-W01` — which is the whole reason `weekIdOf` pads the week number and
 * puts the year first. A numeric comparison would need parsing, and parsing a
 * week id in SQL is how the boundary ends up defined twice.
 */
export async function settleDueWeeks(
  sql: SqlExecutor,
  opts: SettleOptions,
): Promise<SettleResult> {
  const result: SettleResult = {
    groupsSettled: 0,
    learnersMoved: { promoted: 0, stayed: 0, relegated: 0 },
    skipped: false,
  };

  const owner = opts.owner ?? `league-${process.pid}`;
  if (!(await claimLease(sql, owner))) {
    bump("league.settlement_skipped");
    result.skipped = true;
    return result;
  }

  try {
    const thisWeek = currentWeek(opts.now).weekId;

    const due = await sql.query<{ group_id: string; tier: number; week_id: string }>(
      `select group_id, tier, week_id
         from league_groups
        where settled_at is null and week_id < $1
        order by week_id, tier
        limit $2`,
      [thisWeek, opts.limit ?? 200],
    );

    for (const g of due.rows) {
      const moved = await settleOneGroup(sql, g.group_id, Number(g.tier), g.week_id);
      result.groupsSettled += 1;
      result.learnersMoved.promoted += moved.promoted;
      result.learnersMoved.stayed += moved.stayed;
      result.learnersMoved.relegated += moved.relegated;
    }
  } finally {
    await releaseLease(sql, owner);
  }

  return result;
}

/**
 * One group, in one transaction.
 *
 * Per group rather than per pass, so a failure on the fourth group leaves the
 * first three settled rather than rolling back a whole evening's work. Each
 * group's result is independent — nothing in one group's settlement reads
 * another's — so there is no consistency argument for a wider transaction.
 */
async function settleOneGroup(
  sql: SqlExecutor,
  groupId: string,
  tier: number,
  weekId: string,
): Promise<{ promoted: number; stayed: number; relegated: number }> {
  return sql.tx(async (t) => {
    const members = await t.query<{ subject_id: string; xp: number }>(
      /* The group's members and what each of them earned in THAT week.
         A left join with coalesce rather than an inner join: a member with no
         surviving awards must still be ranked, because erasure or a future
         retention sweep could remove awards while leaving the membership. In
         practice every member has at least one award — membership is created by
         one — so this is a guard, not a live branch. */
      `select m.subject_id,
              coalesce(sum(a.amount), 0)::int as xp
         from league_memberships m
         left join league_xp_awards a
           on a.subject_id = m.subject_id and a.week_id = m.week_id
        where m.group_id = $1
        group by m.subject_id`,
      [groupId],
    );

    const settled = settleGroup(
      members.rows.map((r) => ({ subjectId: r.subject_id, weeklyXp: Number(r.xp) })),
      tier,
    );

    const counts = { promoted: 0, stayed: 0, relegated: 0 };

    for (const s of settled) {
      const written = await t.query<{ subject_id: string }>(
        `insert into league_settlements
           (subject_id, week_id, group_id, final_xp, rank, group_size,
            tier_before, movement, tier_after, policy_version)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (subject_id, week_id) do nothing
         returning subject_id`,
        [
          s.subjectId,
          weekId,
          groupId,
          s.weeklyXp,
          s.rank,
          s.groupSize,
          s.tierBefore,
          s.movement,
          s.tierAfter,
          LEAGUE_POLICY_VERSION,
        ],
      );

      /* The profile moves ONLY for a settlement row that was genuinely new.
         Without this guard, re-running an old week's settlement would drag a
         learner's tier back to what it was then — a learner promoted in W37 and
         again in W38 would be reset to tier 2 the moment W37 was re-settled.
         `returning` makes "this is the first time" a fact from the database
         rather than something the caller assumes. */
      if (written.rows.length > 0) {
        counts[s.movement] += 1;
        await t.query(
          `update league_profiles set tier = $2, updated_at = now()
            where subject_id = $1`,
          [s.subjectId, s.tierAfter],
        );
      }
    }

    /* Last, and inside the same transaction: the group is settled only if every
       result above committed. A group marked settled whose settlements rolled
       back would never be retried, and the week would silently have no result. */
    await t.query(
      `update league_groups set settled_at = now()
        where group_id = $1 and settled_at is null`,
      [groupId],
    );

    return counts;
  });
}

/**
 * The lease, in the shape migration 0008 argued for.
 *
 * Reuses `reducer_lease` under a second id rather than adding a table. The
 * table is `id text primary key`, so it was already a general single-row mutex;
 * its comment named the sweep only because the sweep was the only user.
 *
 * "A lease rather than an advisory lock: an advisory lock dies with its
 * session" — 0008. A crashed holder here expires after `LEASE_SECONDS` instead
 * of wedging settlement until someone restarts the process.
 */
async function claimLease(sql: SqlExecutor, owner: string): Promise<boolean> {
  const r = await sql.query<{ owner: string }>(
    `insert into reducer_lease (id, owner, expires_at)
     values ($1, $2, now() + make_interval(secs => $3))
     on conflict (id) do update set
       owner = excluded.owner,
       expires_at = excluded.expires_at
       where reducer_lease.expires_at < now()
     returning owner`,
    [LEASE_ID, owner, LEASE_SECONDS],
  );
  return r.rows.length > 0 && r.rows[0].owner === owner;
}

async function releaseLease(sql: SqlExecutor, owner: string): Promise<void> {
  await sql.query(`delete from reducer_lease where id = $1 and owner = $2`, [LEASE_ID, owner]);
}

/* -------------------------------------------------------------------------- */

let interval: ReturnType<typeof setInterval> | null = null;

/**
 * The scheduled trigger.
 *
 * Modelled on `startSweepInterval` in `schools/reducer/trigger.ts`, including
 * the `unref()` — this must never be the reason a process refuses to exit.
 *
 * ## Why hourly, and why that is not lazy
 *
 * A week boundary happens once every 168 hours. Polling for it every twenty
 * seconds, the way the reducer sweep does, would take the lease and issue a
 * query 30,000 times per boundary to do something once. The reducer has a real
 * reason for that cadence — episodes close continuously and a learner is
 * waiting for the projection. Nothing is waiting for a settlement except a
 * Monday.
 *
 * Hourly means a learner who opens the page before the interval has fired
 * settles it themselves through `settleDueWeeks` on the read path, and the
 * interval is the safety net for the case where nobody opens it at all. That is
 * the correct order of responsibility for this deployment, which HAS no cron:
 * `LEARNING_CRON_SECRET` is read into config and has no consumer, and the
 * `/api/learning/reduce` route `.env.example` advertises does not exist.
 */
export function startSettlementInterval(getSql: () => Promise<SqlExecutor>): void {
  if (interval) return;
  interval = setInterval(
    () => {
      void (async () => {
        try {
          const sql = await getSql();
          await settleDueWeeks(sql, { now: new Date() });
        } catch (err) {
          bump("league.settlement_failed");
          console.error("[league] scheduled settlement failed", err);
        }
      })();
    },
    60 * 60 * 1000,
  );
  interval.unref?.();
}
