import "server-only";
import { randomUUID } from "node:crypto";
import type { SqlExecutor } from "@schools/store/sql";
import { bump } from "@schools/ops/counters";
import { FIRST_TIER } from "./tiers";
import { MAX_GROUP_SIZE } from "./standings";
import { XP_POLICY_VERSION, type XpAchievement } from "./xp-policy";

/**
 * Awarding XP, and admitting a learner to a weekly group.
 *
 * ## This module takes a `SqlExecutor` and never opens a transaction
 *
 * Every function here takes `t: SqlExecutor` as its first parameter, exactly
 * like `insertEvents` in the store. That is not a style preference — it is the
 * only shape that is SAFE on this stack.
 *
 * `PgliteExecutor.tx` passes `this` to its callback and issues a bare `begin`,
 * which Postgres treats as a warning and a no-op. So a `sql.tx` nested inside
 * another `sql.tx` commits the outer transaction when the inner one finishes.
 * The Postgres driver uses savepoints and gets it right, which means the bug is
 * invisible in CI and live in development. A free function taking `t` cannot
 * express the mistake.
 *
 * The caller is `LearningStore.appendEventsAndSettle`, which is already inside
 * the one transaction that writes the events and settles the submission. XP
 * therefore commits with the evidence or not at all, and there is no window in
 * which a learner was graded but not credited.
 *
 * ## Nothing here reads a request body
 *
 * There is no `amount` parameter reachable from a route. Amounts come from
 * `XP_AMOUNTS` in the policy module, keyed by an achievement from a closed
 * union, and the achievement is chosen by the server from the block it just
 * graded. A client that posts `{ amount: 999999 }` is posting a field nothing
 * reads.
 */

export interface XpCredit {
  achievement: XpAchievement;
  entityId: string;
  amount: number;
}

export interface AwardContext {
  subjectId: string;
  /** Server-derived. See `weekIdForAward` — never from the client clock. */
  weekId: string;
  /** From `class_enrolments`, never from `school_subject_scope`. */
  schoolId: string;
  classId: string;
  /** For audit only. Nullable; nothing reads it to make a decision. */
  sourceEpisode?: string | null;
}

export interface AwardResult {
  /** Only the credits that were genuinely new. A repeat solve returns []. */
  granted: XpCredit[];
  /** Total newly-granted XP. Zero on any duplicate path. */
  gained: number;
  /** True when this award created the learner's membership for the week. */
  entered: boolean;
  /** The group they are in, once they are in one. */
  groupId: string | null;
  tier: number;
}

/**
 * Credit a learner, and admit them to the week if this is their first credit.
 *
 * Order matters and is the opposite of the obvious one: the awards are written
 * FIRST, and membership is created only if at least one of them was new.
 *
 * Doing it the other way — join, then award — would admit a learner to a
 * competition on the strength of re-solving a block they had already solved,
 * so a child who reloaded an old lesson would appear on the board holding zero
 * points. Awarding first means membership is created by a credit that actually
 * landed, which is what makes "every member holds at least one point" true, and
 * that in turn is why the ranking code never has to decide what a zero-XP
 * member means.
 */
export async function awardXp(
  t: SqlExecutor,
  ctx: AwardContext,
  credits: readonly XpCredit[],
): Promise<AwardResult> {
  const empty: AwardResult = {
    granted: [],
    gained: 0,
    entered: false,
    groupId: null,
    tier: FIRST_TIER,
  };
  if (credits.length === 0) return empty;

  const granted: XpCredit[] = [];

  for (const c of credits) {
    /* `on conflict do nothing returning` is the duplicate check. There is no
       preceding SELECT, deliberately: a read-then-write across two statements
       is the exact shape that served a fourteen-year-old a `duplicate key` 500
       on the first answer they ever submitted (see `resolveSubjectForUser`).
       Here the race simply loses and returns no row.

       `returning` rather than `rowCount` because the two drivers derive
       `rowCount` differently and an `on conflict do nothing` whose conflict was
       swallowed can still report a non-zero count. A row that comes back is a
       row that came back on both. */
    const r = await t.query<{ entity_id: string }>(
      `insert into league_xp_awards
         (subject_id, achievement, entity_id, amount, week_id, policy_version, source_episode)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (subject_id, achievement, entity_id) do nothing
       returning entity_id`,
      [
        ctx.subjectId,
        c.achievement,
        c.entityId,
        c.amount,
        ctx.weekId,
        XP_POLICY_VERSION,
        ctx.sourceEpisode ?? null,
      ],
    );
    if (r.rows.length > 0) granted.push(c);
    /* The refusal leaves no row, so this is the only place it can be counted.
       Non-zero is NORMAL — every reload of a finished lesson lands here. */
    else bump("league.duplicate_blocked");
  }

  if (granted.length === 0) return empty;

  const membership = await ensureMembership(t, ctx);

  return {
    granted,
    gained: granted.reduce((n, c) => n + c.amount, 0),
    entered: membership.created,
    groupId: membership.groupId,
    tier: membership.tier,
  };
}

interface Membership {
  groupId: string;
  tier: number;
  created: boolean;
}

/**
 * Put the learner in a group for this week, or find the one they are in.
 *
 * ## Why this is race-safe without a lock
 *
 * Three writes, each idempotent, each safe to lose:
 *
 *   1. `league_profiles` — `on conflict do nothing`. Two concurrent first
 *      awards both try to create the profile; one wins, and both then read the
 *      same tier.
 *   2. `league_groups` — `on conflict (week_id, tier, school_id, class_id,
 *      ordinal) do nothing`. Both try to open the same group; one wins, the
 *      loser re-reads the winner's row.
 *   3. `league_memberships` — `on conflict (subject_id, week_id) do nothing
 *      returning group_id`. This is the one that matters. The primary key makes
 *      "one learner, two groups, one week" impossible at the database, so the
 *      loser of the race gets back the group the winner chose and both requests
 *      agree.
 *
 * There is no `select … for update` anywhere, and that is deliberate: the only
 * use of it in this repository (`rate-limit.ts:35`) has the hole that it locks
 * nothing when the row does not exist, which is precisely the first-ever-award
 * case this function is for.
 *
 * ## Capacity is SOFT, and here is the exact reason
 *
 * Choosing a group means counting its members and picking one with room, which
 * is a read followed by a write and therefore racy: two learners can pass the
 * count check at the same instant and both join a group that had one seat.
 *
 * Closing that race properly needs a lock on the group row, which would
 * serialise every first award in a class through one row on Monday morning —
 * the exact moment eighteen children start at once. The cost of NOT closing it
 * is that a group can exceed `MAX_GROUP_SIZE` by roughly the number of
 * simultaneous joiners.
 *
 * That is why `MAX_GROUP_SIZE` (34) sits above `TARGET_GROUP_SIZE` (30): the
 * headroom absorbs the overshoot. A group of thirty-two is a slightly longer
 * leaderboard and changes nothing about fairness — `zonesFor` is a ratio of the
 * actual size, so a bigger group simply promotes and relegates proportionally
 * more. Nothing downstream assumes an exact size.
 */
async function ensureMembership(t: SqlExecutor, ctx: AwardContext): Promise<Membership> {
  const existing = await t.query<{ group_id: string; tier: number }>(
    `select group_id, tier from league_memberships
      where subject_id = $1 and week_id = $2`,
    [ctx.subjectId, ctx.weekId],
  );
  if (existing.rows.length > 0) {
    return {
      groupId: existing.rows[0].group_id,
      tier: Number(existing.rows[0].tier),
      created: false,
    };
  }

  const tier = await currentTier(t, ctx.subjectId);
  const groupId = await openOrJoinGroup(t, ctx, tier);

  const joined = await t.query<{ group_id: string; tier: number }>(
    `insert into league_memberships (subject_id, week_id, group_id, tier)
     values ($1, $2, $3, $4)
     on conflict (subject_id, week_id) do nothing
     returning group_id, tier`,
    [ctx.subjectId, ctx.weekId, groupId, tier],
  );

  if (joined.rows.length > 0) {
    return { groupId, tier, created: true };
  }

  /* Lost the race. Somebody else admitted this learner between our SELECT and
     our INSERT, which is fine and is what the primary key is for — but we must
     return THEIR group, not ours, or the caller reports a group the learner is
     not in. */
  const settled = await t.query<{ group_id: string; tier: number }>(
    `select group_id, tier from league_memberships
      where subject_id = $1 and week_id = $2`,
    [ctx.subjectId, ctx.weekId],
  );
  return {
    groupId: settled.rows[0].group_id,
    tier: Number(settled.rows[0].tier),
    created: false,
  };
}

/**
 * The learner's rung on the ladder, creating it at the bottom on first sight.
 *
 * Every learner starts at `FIRST_TIER`. There is no seeding from past
 * performance and no placement week: a tier is a record of weeks competed, and
 * a learner who has competed in none has nothing to place them on.
 */
async function currentTier(t: SqlExecutor, subjectId: string): Promise<number> {
  await t.query(
    `insert into league_profiles (subject_id, tier) values ($1, $2)
     on conflict (subject_id) do nothing`,
    [subjectId, FIRST_TIER],
  );
  const r = await t.query<{ tier: number }>(
    `select tier from league_profiles where subject_id = $1`,
    [subjectId],
  );
  return Number(r.rows[0].tier);
}

/**
 * The group this learner belongs in: the lowest-numbered one with room, or a
 * new one.
 *
 * Scoped to `(week, tier, school, class)`. A learner never competes with a
 * child from another class or another school — see migration 0023's header and
 * the two migrations that refuse a cross-school read path.
 */
async function openOrJoinGroup(
  t: SqlExecutor,
  ctx: AwardContext,
  tier: number,
): Promise<string> {
  const open = await t.query<{ group_id: string }>(
    `select g.group_id
       from league_groups g
       left join league_memberships m on m.group_id = g.group_id
      where g.week_id = $1 and g.tier = $2
        and g.school_id = $3 and g.class_id = $4
      group by g.group_id, g.ordinal
     having count(m.subject_id) < $5
      order by g.ordinal
      limit 1`,
    [ctx.weekId, tier, ctx.schoolId, ctx.classId, MAX_GROUP_SIZE],
  );
  if (open.rows.length > 0) return open.rows[0].group_id;

  /* Every existing group is full, or there are none. Take the next ordinal.
     `coalesce(max(ordinal), 0) + 1` rather than a count, because a deleted
     group must not cause a new one to reuse a taken ordinal and collide. */
  const next = await t.query<{ ordinal: number }>(
    `select coalesce(max(ordinal), 0) + 1 as ordinal
       from league_groups
      where week_id = $1 and tier = $2 and school_id = $3 and class_id = $4`,
    [ctx.weekId, tier, ctx.schoolId, ctx.classId],
  );
  const ordinal = Number(next.rows[0].ordinal);
  const groupId = randomUUID();

  const created = await t.query<{ group_id: string }>(
    `insert into league_groups (group_id, week_id, tier, school_id, class_id, ordinal)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (week_id, tier, school_id, class_id, ordinal) do nothing
     returning group_id`,
    [groupId, ctx.weekId, tier, ctx.schoolId, ctx.classId, ordinal],
  );
  if (created.rows.length > 0) return groupId;

  /* Another request opened this exact group first. Use theirs. */
  const theirs = await t.query<{ group_id: string }>(
    `select group_id from league_groups
      where week_id = $1 and tier = $2 and school_id = $3
        and class_id = $4 and ordinal = $5`,
    [ctx.weekId, tier, ctx.schoolId, ctx.classId, ordinal],
  );
  return theirs.rows[0].group_id;
}
