import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import { FIRST_TIER } from "./tiers";
import { type Movement, type ZoneShape, movementFor, rankGroup, zonesFor } from "./standings";
import { currentWeek } from "./week";

/**
 * Reading a league.
 *
 * ## This file is the privacy boundary
 *
 * Every field that reaches a fourteen-year-old's browser about ANOTHER
 * fourteen-year-old is declared in `LeagueRow` below, and there are four of
 * them: a rank, a display name, an XP total, and whether the row is theirs.
 *
 * That is the whole list, and the absences are the design. There is no
 * `subjectId` and no `userId` — a stable per-learner identifier in a payload is
 * a join key for anyone who collects two of them. There is no school, no class,
 * no username, no attempts, no failures, no hint usage, no skills, no
 * misconceptions, no assessment result, no teacher flag and no last-seen time.
 *
 * A league is deliberately SHALLOW. It says how much work somebody did this
 * week and nothing whatsoever about how well they understand it, which is the
 * difference between a competition and a disclosure.
 *
 * ## Cross-school reads are structurally impossible here
 *
 * Not because a predicate remembers to exclude them, but because a group is
 * created for one `(school_id, class_id)` and every read below starts from the
 * caller's OWN membership row, resolved from their session. There is no group
 * id parameter on any function in this file. A learner cannot ask about a group
 * they are not in, because there is no way to name one.
 */

export interface LeagueRow {
  rank: number;
  /** Derived by `displayNameFor`. Never a username, never a legal full name. */
  name: string;
  weeklyXp: number;
  /** The one row the UI highlights. */
  isYou: boolean;
  /** What happens to this row if the week ended now. Never colour-only in the UI. */
  zone: Movement;
}

export interface LeagueView {
  weekId: string;
  /** ISO. The client renders a countdown from it; it never computes the boundary. */
  endsAt: string;
  tier: number;
  /** Null when the learner has earned no XP this week — they are not competing yet. */
  you: { rank: number; weeklyXp: number; zone: Movement } | null;
  rows: LeagueRow[];
  groupSize: number;
  zones: ZoneShape;
}

/**
 * A learner's own league for the current week.
 *
 * Returns `you: null` and an empty board when they have not yet earned XP this
 * week. That is not an error state and the UI must not render it as one: it is
 * "the week has started and you have not competed in it yet", which is an
 * ordinary Monday.
 */
export async function leagueForLearner(
  sql: SqlExecutor,
  subjectId: string,
  now: Date,
): Promise<LeagueView> {
  const week = currentWeek(now);

  const mine = await sql.query<{ group_id: string; tier: number }>(
    `select group_id, tier from league_memberships
      where subject_id = $1 and week_id = $2`,
    [subjectId, week.weekId],
  );

  if (mine.rows.length === 0) {
    const tier = await tierOf(sql, subjectId);
    return {
      weekId: week.weekId,
      endsAt: week.endsAt.toISOString(),
      tier,
      you: null,
      rows: [],
      groupSize: 0,
      zones: zonesFor(0, tier),
    };
  }

  const groupId = mine.rows[0].group_id;
  const tier = Number(mine.rows[0].tier);

  /* One query for the whole board. The join to `school_accounts` goes through
     `learning_subjects.user_id`, which migration 0012 deliberately leaves as a
     soft reference rather than a foreign key — so a subject whose account has
     been erased simply produces a null name, and `displayNameFor` turns that
     into the neutral fallback rather than dropping the row. A missing row would
     renumber everybody else's rank. */
  const board = await sql.query<{
    subject_id: string;
    display_name: string | null;
    xp: number;
  }>(
    `select m.subject_id,
            acc.display_name,
            coalesce(sum(a.amount), 0)::int as xp
       from league_memberships m
       left join learning_subjects ls on ls.subject_id = m.subject_id
       left join school_accounts acc on acc.user_id = ls.user_id
       left join league_xp_awards a
         on a.subject_id = m.subject_id and a.week_id = m.week_id
      where m.group_id = $1
      group by m.subject_id, acc.display_name`,
    [groupId],
  );

  const ranked = rankGroup(
    board.rows.map((r) => ({ subjectId: r.subject_id, weeklyXp: Number(r.xp) })),
  );
  const zones = zonesFor(ranked.length, tier);
  const nameBySubject = new Map(board.rows.map((r) => [r.subject_id, r.display_name]));

  const rows: LeagueRow[] = ranked.map((s) => ({
    rank: s.rank,
    name: displayNameFor(nameBySubject.get(s.subjectId) ?? null),
    weeklyXp: s.weeklyXp,
    isYou: s.subjectId === subjectId,
    zone: movementFor(s, zones, tier),
  }));

  const you = ranked.find((s) => s.subjectId === subjectId);

  return {
    weekId: week.weekId,
    endsAt: week.endsAt.toISOString(),
    tier,
    you: you
      ? { rank: you.rank, weeklyXp: you.weeklyXp, zone: movementFor(you, zones, tier) }
      : null,
    rows,
    groupSize: ranked.length,
    zones,
  };
}

/**
 * What a classmate is called on the board.
 *
 * ## First name, then the initial of whatever follows
 *
 * «Айдана Смагулова» becomes «Айдана С.». The rule is narrow on purpose.
 *
 * The learners in a group are, by construction, the learners in one class —
 * they sit in a room together every day and already know each other's names, so
 * a first name discloses nothing to them that the register does not. What it
 * does do is keep the FULL name out of a JSON payload, which is a different
 * question: a payload is copied, screenshotted and pasted, and «Айдана С.» is
 * materially harder to search for than the whole name.
 *
 * If cross-class or cross-school grouping is ever enabled, this function is the
 * one that must change first — a first name is not an acceptable disclosure to
 * a stranger, and the replacement is a system-issued alias with no relationship
 * to the learner's name at all. The single call site is deliberate: that change
 * would be an edit here and nowhere else.
 *
 * ## The fallback is neutral, not empty
 *
 * A learner with no account row (erased, or an anonymous development subject)
 * renders as «Оқушы» / a dash rather than as a blank cell. Dropping the row
 * instead would renumber the ranks of everybody around them, which is a worse
 * outcome than an unnamed row: the other children's positions would silently
 * change because of something that happened to a classmate.
 */
export function displayNameFor(displayName: string | null): string {
  const full = (displayName ?? "").trim();
  if (full.length === 0) return "—";

  const parts = full.split(/\s+/);
  if (parts.length === 1) return parts[0];

  /* `Array.from` rather than `[0]`: a surname beginning with a surrogate pair
     would be sliced in half by index access and render as a replacement
     character. Kazakh does not need this; a learner with an emoji or an
     extended-plane character in their name does. */
  const initial = Array.from(parts[parts.length - 1])[0];
  return `${parts[0]} ${initial}.`;
}

async function tierOf(sql: SqlExecutor, subjectId: string): Promise<number> {
  const r = await sql.query<{ tier: number }>(
    `select tier from league_profiles where subject_id = $1`,
    [subjectId],
  );
  return r.rows.length > 0 ? Number(r.rows[0].tier) : FIRST_TIER;
}

export interface LastResult {
  weekId: string;
  finalXp: number;
  rank: number;
  groupSize: number;
  tierBefore: number;
  movement: Movement;
  tierAfter: number;
}

/**
 * The most recent settled week, for the result banner.
 *
 * Ordered by `week_id desc`, which works because ISO week ids sort
 * lexicographically — the same property `settleDueWeeks` relies on to find due
 * weeks with a string comparison.
 */
export async function lastSettledResult(
  sql: SqlExecutor,
  subjectId: string,
): Promise<LastResult | null> {
  const r = await sql.query<{
    week_id: string;
    final_xp: number;
    rank: number;
    group_size: number;
    tier_before: number;
    movement: Movement;
    tier_after: number;
  }>(
    `select week_id, final_xp, rank, group_size, tier_before, movement, tier_after
       from league_settlements
      where subject_id = $1
      order by week_id desc
      limit 1`,
    [subjectId],
  );
  if (r.rows.length === 0) return null;
  const x = r.rows[0];
  return {
    weekId: x.week_id,
    finalXp: Number(x.final_xp),
    rank: Number(x.rank),
    groupSize: Number(x.group_size),
    tierBefore: Number(x.tier_before),
    movement: x.movement,
    tierAfter: Number(x.tier_after),
  };
}

/**
 * A learner's own XP for a week, itemised.
 *
 * Their own only — there is no subject parameter a caller could point at
 * somebody else, because every caller passes the id resolved from the session.
 * This is what makes "why do I have this?" answerable, which §27 of the brief
 * asks for and which the product's own standard demands anyway: every claim
 * shown to a learner must be traceable to something they could check against
 * their own history.
 */
export async function xpBreakdown(
  sql: SqlExecutor,
  subjectId: string,
  weekId: string,
): Promise<{ achievement: string; count: number; total: number }[]> {
  const r = await sql.query<{ achievement: string; n: number; total: number }>(
    `select achievement, count(*)::int as n, sum(amount)::int as total
       from league_xp_awards
      where subject_id = $1 and week_id = $2
      group by achievement
      order by sum(amount) desc`,
    [subjectId, weekId],
  );
  return r.rows.map((x) => ({
    achievement: x.achievement,
    count: Number(x.n),
    total: Number(x.total),
  }));
}
