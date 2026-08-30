import { FIRST_TIER, LAST_TIER } from "./tiers";

/**
 * Ranking, and what a week's result does to a learner's tier.
 *
 * Pure. No database, no clock, no config — everything is an argument, so every
 * rule below is testable at every group size without a fixture. That is not
 * tidiness: the rules that matter most here are the ones for groups of four and
 * of one, and those are the sizes a seeded database makes awkward to produce.
 */

/** Bumped with any change below. Stored on every settlement row. */
export const LEAGUE_POLICY_VERSION = "league.v1";

/**
 * Target group size. Not a hard cap — see `MAX_GROUP_SIZE`.
 *
 * The pilot is one class of eighteen, so in practice the first group is
 * underfilled and stays that way. That is stated rather than hidden: the
 * alternative is padding the table to thirty with accounts that belong to
 * nobody, and a league whose members are invented is a league whose result means
 * nothing. `docs/leagues/LEAGUE_ARCHITECTURE_DISCOVERY.md` §10 records the
 * refusal.
 */
export const TARGET_GROUP_SIZE = 30;

/**
 * The hard ceiling a group is closed at.
 *
 * Above target so that a late joiner on a Sunday afternoon does not open a
 * second group containing one child. A group of thirty-two is a slightly
 * crowded leaderboard; a group of one is a learner told they are competing and
 * shown a list with only themselves on it.
 */
export const MAX_GROUP_SIZE = 34;

/**
 * Below this, a week moves nobody.
 *
 * The brief asks what a two-person group should do, and the honest answer is
 * nothing. With two members, any promotion rule promotes half the group and
 * relegates the other half on a single week's difference — which is noise
 * presented as a result, and is the same failure the teacher leaderboard's
 * evidence floors exist to prevent ("Ranking on n=2 produces an ordering that
 * inverts the following week and teaches a class that the board is noise").
 *
 * Four is the smallest size at which the shape `1 up / at least 1 stays / 1
 * down` exists at all.
 */
export const MIN_GROUP_FOR_MOVEMENT = 4;

/** One in five moves, at each end. */
const MOVEMENT_DIVISOR = 5;

export type Movement = "promoted" | "stayed" | "relegated";

export interface Standing {
  subjectId: string;
  weeklyXp: number;
  /** Competition rank: 1, 1, 3. Shared by equal XP. */
  rank: number;
}

/**
 * Order a group, and assign competition ranks.
 *
 * ## Sorting on XP alone, and what breaks a tie
 *
 * XP descending is the whole ordering. Nothing reads solve time, active
 * seconds, attempt count or submission timestamp, and that is a design
 * constraint rather than an omission — every one of those rewards something the
 * product has already refused to reward. Two learners on the same XP had the
 * same week, and the board says so.
 *
 * `subjectId` breaks the tie for ARRAY ORDER only, never for rank. It is needed
 * because a stable order is required for a stable render and for a settlement
 * that produces the same rows on a retry; it is a uuid, so it carries no
 * meaning, no alphabetical advantage and nothing a learner could recognise as
 * being "sorted by name".
 *
 * ## Competition ranking, and why it is not dense
 *
 * Two learners on 120 XP are both 2nd, and the next is 4th — not 3rd. The
 * learner-facing rule is "same XP, same rank", and dense ranking (1, 2, 2, 3)
 * quietly contradicts the count of people ahead of you: a learner ranked 3rd
 * with three people above them would be right to complain.
 */
export function rankGroup(members: readonly { subjectId: string; weeklyXp: number }[]): Standing[] {
  const sorted = [...members].sort(
    (a, b) => b.weeklyXp - a.weeklyXp || (a.subjectId < b.subjectId ? -1 : a.subjectId > b.subjectId ? 1 : 0),
  );

  const out: Standing[] = [];
  let rank = 0;
  let previousXp: number | null = null;

  sorted.forEach((m, i) => {
    /* The index, not a counter: after a tie the next distinct score takes the
       position it actually occupies. A `rank += 1` here would produce dense
       ranking, which is the thing above says not to do. */
    if (previousXp === null || m.weeklyXp !== previousXp) {
      rank = i + 1;
      previousXp = m.weeklyXp;
    }
    out.push({ subjectId: m.subjectId, weeklyXp: m.weeklyXp, rank });
  });

  return out;
}

export interface ZoneShape {
  /** Ranks `1 .. promoteThrough` promote. Zero means nobody does. */
  promoteThrough: number;
  /** Ranks `relegateFrom .. size` relegate. `size + 1` means nobody does. */
  relegateFrom: number;
}

/**
 * How many move, at this size and this tier.
 *
 * Ratios rather than fixed counts, because the pilot's groups are underfilled
 * and a fixed "top 6" would promote a third of a group of eighteen.
 *
 *     size   promote   stay   relegate
 *        1         0      1          0     no movement below four
 *        3         0      3          0
 *        4         1      2          1
 *       10         2      6          2
 *       18         4     10          4
 *       30         6     18          6
 *
 * Both ends are computed identically, so the zones stay symmetric and the
 * middle never disappears: `promote + relegate <= size - 1` is enforced below,
 * which guarantees at least one learner stays at every size that moves anyone.
 */
export function zonesFor(size: number, tier: number): ZoneShape {
  const none: ZoneShape = { promoteThrough: 0, relegateFrom: size + 1 };
  if (size < MIN_GROUP_FOR_MOVEMENT) return none;

  const movers = Math.max(1, Math.round(size / MOVEMENT_DIVISOR));

  /* Nothing promotes out of the top and nothing relegates out of the bottom.
     Checked here rather than at the call site so that a group at tier 10 shows
     no promotion zone in the UI at all, instead of showing one that silently
     does nothing. */
  let promote = tier >= LAST_TIER ? 0 : movers;
  let relegate = tier <= FIRST_TIER ? 0 : movers;

  /* Leave somebody in the middle. Only reachable at size 4 with both ends
     active (1 + 1 = 2 <= 3), so this is a guard against a future divisor
     change rather than a live branch — but a rule that depends on arithmetic
     staying put is a rule that breaks quietly when the arithmetic moves. */
  while (promote + relegate > size - 1 && (promote > 0 || relegate > 0)) {
    if (relegate >= promote && relegate > 0) relegate -= 1;
    else if (promote > 0) promote -= 1;
  }

  return { promoteThrough: promote, relegateFrom: relegate === 0 ? size + 1 : size - relegate + 1 };
}

/**
 * What happens to one learner.
 *
 * ## Ties on a boundary resolve in the learner's favour
 *
 * The board tells a learner that equal XP is equal rank. That promise has to
 * survive the boundary, so the zones are widened or narrowed to respect it
 * rather than splitting a tie to hit an exact count:
 *
 *   - Tied ACROSS the promotion line: everyone on that rank promotes. Five
 *     learners tie for 6th in a group promoting six, and all five go up. The
 *     alternative is telling two children with identical weeks that one of them
 *     was better, on the strength of a uuid.
 *   - Tied ACROSS the relegation line: everyone on that rank stays. Relegation
 *     is the harsher outcome, so an ambiguous case must not deliver it.
 *
 * Both follow from comparing RANK to the boundary rather than comparing array
 * position, because a shared rank is a single number that either clears the line
 * or does not.
 */
export function movementFor(standing: Standing, zones: ZoneShape, tier: number): Movement {
  if (tier < LAST_TIER && zones.promoteThrough > 0 && standing.rank <= zones.promoteThrough) {
    return "promoted";
  }
  if (tier > FIRST_TIER && standing.rank >= zones.relegateFrom) {
    return "relegated";
  }
  return "stayed";
}

/** Clamped, so a settlement can never write an eleventh tier or a zeroth one. */
export function tierAfter(tier: number, movement: Movement): number {
  if (movement === "promoted") return Math.min(LAST_TIER, tier + 1);
  if (movement === "relegated") return Math.max(FIRST_TIER, tier - 1);
  return tier;
}

export interface SettledStanding extends Standing {
  movement: Movement;
  tierBefore: number;
  tierAfter: number;
  groupSize: number;
}

/**
 * Settle one group. Pure, total, and the same input always gives the same rows.
 *
 * Determinism is what makes settlement safely retryable: a crashed settlement
 * that is re-run produces byte-identical results, so the write can be an
 * `on conflict do nothing` and a partial failure needs no repair path.
 *
 * A member with zero XP is not a case this function has to handle, and the
 * reason is structural rather than defensive: membership is created by the FIRST
 * eligible award, in the same transaction, so every member holds at least one
 * point. There is no "entered the league and did nothing" state to rank.
 */
export function settleGroup(
  members: readonly { subjectId: string; weeklyXp: number }[],
  tier: number,
): SettledStanding[] {
  const ranked = rankGroup(members);
  const zones = zonesFor(ranked.length, tier);
  return ranked.map((s) => {
    const movement = movementFor(s, zones, tier);
    return {
      ...s,
      movement,
      tierBefore: tier,
      tierAfter: tierAfter(tier, movement),
      groupSize: ranked.length,
    };
  });
}
