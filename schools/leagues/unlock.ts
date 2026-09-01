import type { SqlExecutor } from "@schools/store/sql";

/**
 * When a learner's league becomes visible to them, and the one number that says so.
 *
 * ## There is no second XP system here
 *
 * `lifetimeXp` below is `sum(amount)` over `league_xp_awards` — the same ledger
 * `xpBreakdown` itemises on `/league` and the same rows `awardXp` writes inside
 * the transaction that settles a submission. Nothing in this file writes, and
 * nothing in it invents a source. If a learner asks "where did my 175 come
 * from", the answer is the same list of rows they can already read on their own
 * league page, one line per curriculum entity.
 *
 * That matters more than it looks. The obvious way to build a home-screen
 * unlock is a counter on the home screen — and a counter that lives next to the
 * thing it unlocks is a counter somebody eventually increments for opening the
 * page. Deriving it from the ledger means the unlock inherits every anti-farming
 * property the ledger already has: the primary key
 * `(subject_id, achievement, entity_id)` refuses a duplicate, the curriculum is
 * finite, and pressing Run is not a curriculum entity.
 *
 * ## Why the threshold is 175 and why it is written down once
 *
 * `xp-policy.ts` works out what an ordinary week is worth: twelve blocks solved,
 * eight of them unaided, one lesson finished — 185 XP. 175 is just under that,
 * so the gate opens at the end of a first REAL week of work rather than on a
 * first afternoon of it. A learner who has earned it has demonstrably done a
 * week; a learner who opened one lesson has not, and showing them a leaderboard
 * on their first day is showing them a list of people who are ahead.
 *
 * The number itself was already in the codebase as `HomeRail`'s `xpGoal`
 * default — an inert prop inherited from the reverse-engineered clone that
 * nothing fed. It is a constant here so that the home card, the help article and
 * any test all read the same one, rather than three copies drifting apart the
 * first time somebody tunes it.
 *
 * ## The unlock is one-way, structurally
 *
 * Nothing subtracts XP anywhere in the product — `xp-policy.ts` says so at
 * length and there is no negative amount in it — so `sum(amount)` over a
 * learner's awards is monotonically non-decreasing, and `unlocked` can never go
 * back to false once it is true. That is a property of the ledger, not a rule
 * this file enforces, which is why it needs no `unlocked_at` column and no
 * backfill. `tests/leagues/unlock.test.ts` pins it.
 *
 * ## No `import "server-only"`, deliberately
 *
 * The constant and `unlockFrom` are pure and the home card is a CLIENT
 * component: it renders «Ещё 40 XP» and needs the threshold to draw a progress
 * bar. `server-only` here would fail `check:bundle` for the one surface this
 * module exists to serve. The database read takes a `SqlExecutor` as an
 * argument and imports its type only, so nothing server-side is reachable from
 * a bundle that imports the constant — the same shape `gate.ts` and
 * `standings.ts` already use.
 */

/**
 * Lifetime XP at which the league becomes visible.
 *
 * ONE canonical definition. Nothing else in the product may write this number.
 */
export const LEAGUE_UNLOCK_XP = 175;

/**
 * The data contract the home card renders from.
 *
 * `needed` rather than a percentage, because the card has to be able to say a
 * sentence — «Ещё 40 XP» is something a fourteen-year-old can act on and «77%»
 * is not. A percentage is one division away for a progress bar that wants one.
 */
export interface LeagueUnlock {
  /** Every XP this learner has ever been credited, across all weeks. */
  lifetimeXp: number;
  /** Has the threshold been reached? Once true, never false again — see header. */
  unlocked: boolean;
  /** XP still to earn. Zero once unlocked, never negative. */
  needed: number;
}

/**
 * The unlock state for a lifetime total. Pure, so the card can be tested
 * without a database and the boundary can be pinned exactly.
 *
 * `Math.trunc` and the floor at zero are not defensive noise: `sum(amount)`
 * comes back from the driver as a string on one driver and a number on the
 * other, and a `needed` of `-12` rendered into «Ещё -12 XP» is the kind of
 * thing that reaches a child before it reaches a reviewer.
 */
export function unlockFrom(lifetimeXp: number): LeagueUnlock {
  const xp = Number.isFinite(lifetimeXp) ? Math.max(0, Math.trunc(lifetimeXp)) : 0;
  return {
    lifetimeXp: xp,
    unlocked: xp >= LEAGUE_UNLOCK_XP,
    needed: Math.max(0, LEAGUE_UNLOCK_XP - xp),
  };
}

/**
 * Read a learner's lifetime XP and answer the unlock question.
 *
 * Every week, not this week: the unlock is a one-time eligibility, so a learner
 * who earned 200 XP in September and nothing in October is still unlocked in
 * October. Scoping it to the current week would lock the league behind a fresh
 * 175 every Monday, which is the opposite of an unlock.
 *
 * Their OWN only. `subjectId` is resolved from the session by every caller;
 * there is no path here that could ask about somebody else, and the return value
 * carries no identifier that could be joined to one.
 */
export async function leagueUnlockFor(
  sql: SqlExecutor,
  subjectId: string,
): Promise<LeagueUnlock> {
  const r = await sql.query<{ xp: number }>(
    `select coalesce(sum(amount), 0)::int as xp
       from league_xp_awards
      where subject_id = $1`,
    [subjectId],
  );
  return unlockFrom(Number(r.rows[0]?.xp ?? 0));
}
