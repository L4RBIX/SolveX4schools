/**
 * The XP policy. The ONLY place an amount is written down.
 *
 * ## What XP is, and the sentence that bounds it
 *
 * XP is gamification data. It is not mastery, not independence evidence, not a
 * skill credit, not an assessment score, not teacher evidence, not lesson
 * completion and not a verdict. Nothing downstream may build a belief about a
 * learner out of it, and `LearnerState` never reads it — see
 * `tests/leagues/separation.test.ts`, which fails if this module ever appears in
 * an import path that reaches the reducer or the decision engine.
 *
 * The one-line version, because it is the thing that gets forgotten:
 *
 *     Learning Intelligence answers "what does this learner know?".
 *     XP answers "what did this learner do this week?".
 *     The second is a much smaller question and must never be mistaken for the first.
 *
 * ## The invariant the whole design rests on
 *
 * **Every XP source is keyed to a CURRICULUM ENTITY, and the curriculum is
 * finite and fixed. There is no repeatable source of XP anywhere in this file.**
 *
 * That single property does the work that a dozen anti-abuse checks would
 * otherwise have to do badly. It is not a rule the award path enforces — it is a
 * consequence of `awardKey()` below never returning a value that a learner can
 * make a second time. Pressing Run cannot earn XP because Run is not a
 * curriculum entity. Re-solving a block cannot earn XP because the key is the
 * block, not the solve. Submitting the same answer twice cannot earn XP because
 * both submissions produce the same key, and the primary key on
 * `league_xp_awards` rejects the second.
 *
 * The consequence to accept openly: a learner who has finished everything the
 * published month contains earns nothing further that week. Months are gated, so
 * it is bounded — but it is real, and it is why relegation is gentle and why the
 * bottom tier has no relegation at all.
 *
 * ## Why there is no time, speed, streak or attempt-count term
 *
 * Because the product already refused each of them, for reasons that have not
 * changed:
 *
 *   - Time on screen: `schools/teacher/leaderboard.ts:45` — "No lens reads
 *     `active_seconds`. Time on screen is not ranked, deliberately."
 *   - Streaks: `docs/PRODUCTION_PRODUCT_AUDIT.md:127-132` removed the learner's
 *     streak because nothing recorded activity days. Nothing records them yet.
 *   - Attempt counts: an attempt count rewards guessing, and the reveal ladder
 *     already depends on attempts meaning something honest.
 *
 * Rewarding speed would also be the one incentive most directly opposed to the
 * programme: a fourteen-year-old who races a task they do not understand has
 * done the thing the curriculum exists to prevent.
 *
 * ## Why nothing is ever subtracted
 *
 * There is no negative amount in this file and no code path that removes XP. A
 * wrong answer earns nothing; it does not cost anything. Asking Nova earns less
 * than not needing to; it does not cost anything either. This is a school
 * product and the league is meant to motivate a child who is behind, not to
 * charge them for being behind.
 */
import type { BlockType } from "@schools/curriculum/types";

/**
 * Bumped when any amount or rule below changes.
 *
 * Stored on every award row and every settlement row. History is then readable
 * under the policy that produced it, rather than being silently reinterpreted
 * under today's — the same reason `attempt_episodes` carries `reducer_version`
 * and `learning_events` carries `event_version`.
 *
 * A bump does NOT re-price existing rows. It cannot: the rows are the record of
 * what a learner was told they earned, and rewriting that would make a child's
 * own memory of their week wrong.
 */
export const XP_POLICY_VERSION = "xp.v1";

/**
 * What a learner can be credited for.
 *
 * A closed vocabulary, for the same reason the event taxonomy is closed: a
 * free-string achievement is one a route can invent, and an achievement nobody
 * declared is an amount nobody reviewed. Adding a member here is a deliberate
 * edit to a file with a `comment on column` mirroring it in migration 0023.
 */
export const XP_ACHIEVEMENTS = [
  /**
   * The first server-verified solve of a curriculum block.
   *
   * "First" is structural rather than checked: the award key is the block, so a
   * second solve produces a key that already exists.
   */
  "block_solved",
  /**
   * The same solve, unaided.
   *
   * A SEPARATE row rather than a larger `block_solved` amount, and that is the
   * whole reason independence is auditable: a teacher — or a learner — can ask
   * "which of these did I do on my own?" and the answer is a set of rows, not a
   * number somebody has to trust. It also means the base credit lands even when
   * the independence question is answered later or answered no.
   */
  "block_solved_unaided",
  /** A `challenge` block. Harder by the author's own declaration. */
  "challenge_solved",
  /**
   * A written explanation reaching the teacher's queue.
   *
   * Credited on SUBMISSION, never on the teacher having read it. Two reasons,
   * and the second is the load-bearing one:
   *
   *   1. A fourteen-year-old must not wait on an adult's Tuesday to find out
   *      what their Monday was worth.
   *   2. Migration 0016 and 0022 both forbid scoring an explanation —
   *      `human_reviews` has no score column BY DESIGN, and 0016 argues that "a
   *      rule that explanations are never auto-graded is a rule someone
   *      eventually works around; a schema with nowhere to write a grade is
   *      not". A flat credit for the act of writing is therefore the ONLY form
   *      this award can take. Anything conditional on quality would be a grade
   *      arriving through the back door.
   *
   * Farmable? No, and for the ordinary reason: the key is the block, and the
   * curriculum contains a fixed number of explanation blocks.
   */
  "explanation_submitted",
  /** A lesson finished, gated by `LESSON_COMPLETION_POLICY`. */
  "lesson_completed",
  /** A month's assessment finished, gated by `ASSESSMENT_COMPLETION_POLICY`. */
  "assessment_completed",
  /**
   * A delayed re-solve resolved without help.
   *
   * The one award that is about RETENTION rather than first contact: the review
   * schedule (migration 0014) brings a block back days later, and solving it
   * again unaided is the closest thing the ledger has to evidence that
   * something stuck. Credited once per review, and reviews are themselves
   * scheduled once per solve, so the chain stays finite.
   */
  "review_resolved",
] as const;

export type XpAchievement = (typeof XP_ACHIEVEMENTS)[number];

const ACHIEVEMENT_SET: ReadonlySet<string> = new Set(XP_ACHIEVEMENTS);

/** Exported beside the type, the way `isLeaderboardLens` and `isTrackLevel` are. */
export function isXpAchievement(value: unknown): value is XpAchievement {
  return typeof value === "string" && ACHIEVEMENT_SET.has(value);
}

/**
 * The amounts.
 *
 * ## How these were chosen
 *
 * A lesson in this curriculum runs 10-15 blocks, and the programme's own weekly
 * commitment is about forty minutes (PDF p.2) — roughly one lesson. So a normal
 * week is:
 *
 *     12 blocks solved              120
 *     8 of them unaided              40
 *     1 lesson completed             25
 *                                   ---
 *                                   185
 *
 * and an assessment week adds 80. Two consequences were wanted from that shape:
 *
 *   - **A steady week is worth more than a spectacular hour.** The completion
 *     awards are large enough to matter but small enough that they cannot
 *     replace the work; nobody reaches a good week without solving blocks.
 *   - **The independence bonus is 50% of the base, not 300%.** Large enough that
 *     a learner notices which solves were their own, small enough that a learner
 *     who needs help is not effectively locked out of their own league. An
 *     assisted solve is worth two thirds of an unaided one, which is the ratio
 *     the product is willing to say out loud to a child who is struggling.
 *
 * Round numbers on purpose. `+10 XP` is a number a fourteen-year-old can hold;
 * `+7` invites the question "why seven", and the honest answer would be "no
 * reason", which is a bad thing for a visible rule to have as its answer.
 */
export const XP_AMOUNTS: Readonly<Record<XpAchievement, number>> = {
  block_solved: 10,
  block_solved_unaided: 5,
  challenge_solved: 15,
  explanation_submitted: 8,
  lesson_completed: 25,
  assessment_completed: 80,
  review_resolved: 12,
};

/**
 * Which block types can earn a solve credit.
 *
 * Re-exported from the curriculum's own `ATTEMPT_BLOCK_TYPES` rather than
 * listed again here. That set already answers "is this a genuine learning
 * attempt", it already excludes reading a concept and watching a simulation,
 * and a second list beside it would be a second answer to the same question —
 * which is how `activityBuckets` and the teacher surface ended up disagreeing
 * about what a solo solve is.
 */
export { ATTEMPT_BLOCK_TYPES as XP_ELIGIBLE_BLOCK_TYPES } from "@schools/curriculum/types";

/** Blocks whose credit is `challenge_solved` rather than `block_solved`. */
export function isChallengeBlock(type: BlockType): boolean {
  return type === "challenge";
}

/**
 * Blocks that are credited for being WRITTEN rather than for being right.
 *
 * `explain` and `verify` settle `unknown` — the server has no opinion on an
 * explanation and deliberately never will. They therefore cannot go through the
 * accepted-verdict path at all, and they get their own achievement.
 */
export function isExplanationBlock(type: BlockType): boolean {
  return type === "explain" || type === "verify";
}

/**
 * The identity of one credit.
 *
 * This function IS the anti-farming design. Everything it returns is
 * `(who, what kind, which curriculum entity)` — never a timestamp, never an
 * episode, never a submission, never an attempt number, never anything a
 * learner can produce a second copy of.
 *
 * It is the primary key of `league_xp_awards`, so a duplicate is refused by the
 * DATABASE rather than by a check somebody has to remember to write. That
 * distinction is the whole point and is the same one migration 0016 draws about
 * grade columns: a rule enforced by a constraint is a rule that survives the
 * next person who is in a hurry.
 *
 * `entityId` is a curriculum identifier — a block id, a lesson id, a review id.
 * It is never learner content, never an answer, never prose.
 */
export function awardKey(
  achievement: XpAchievement,
  entityId: string,
): { achievement: XpAchievement; entityId: string } {
  return { achievement, entityId };
}

/**
 * What a single trusted solve is worth, as a list of credits to attempt.
 *
 * Returns EVERY credit the event could earn; the caller inserts them all and
 * lets the primary key drop the ones already held. Deciding here which are
 * "new" would mean reading the table first, and a read-then-write across a
 * transaction boundary is the exact shape that served a fourteen-year-old a
 * `duplicate key` 500 on the first answer they ever submitted — see
 * `resolveSubjectForUser`'s header.
 *
 * `unaided` is passed in rather than derived here because this file has no
 * database access. The caller computes it with the core's own
 * `independenceWeight()`, so there is one definition of independence in the
 * product and this is not a second.
 */
export function creditsForSolve(input: {
  blockId: string;
  blockType: BlockType;
  unaided: boolean;
}): { achievement: XpAchievement; entityId: string; amount: number }[] {
  const credits: { achievement: XpAchievement; entityId: string; amount: number }[] = [];

  const base: XpAchievement = isChallengeBlock(input.blockType)
    ? "challenge_solved"
    : "block_solved";

  credits.push({
    achievement: base,
    entityId: input.blockId,
    amount: XP_AMOUNTS[base],
  });

  /* The bonus is a second row on the same block, never a multiplier on the
     first. A multiplier would make the base amount unreadable in the ledger
     ("why is this one 15?") and would make the independence question
     unanswerable after the fact. */
  if (input.unaided) {
    credits.push({
      achievement: "block_solved_unaided",
      entityId: input.blockId,
      amount: XP_AMOUNTS.block_solved_unaided,
    });
  }

  return credits;
}

/**
 * Total XP a learner could hold if they completed everything, once.
 *
 * Not used by the award path. It exists so a test can assert that the ceiling is
 * FINITE and so the pilot can be told what the maximum possible weekly number
 * looks like — a league whose top score is unbounded is a league that rewards
 * time rather than work, and the only way to know which one this is is to
 * compute the bound.
 */
export function maxAwardableXp(counts: {
  solvableBlocks: number;
  challengeBlocks: number;
  explanationBlocks: number;
  lessons: number;
  assessments: number;
  reviews: number;
}): number {
  return (
    counts.solvableBlocks * (XP_AMOUNTS.block_solved + XP_AMOUNTS.block_solved_unaided) +
    counts.challengeBlocks * (XP_AMOUNTS.challenge_solved + XP_AMOUNTS.block_solved_unaided) +
    counts.explanationBlocks * XP_AMOUNTS.explanation_submitted +
    counts.lessons * XP_AMOUNTS.lesson_completed +
    counts.assessments * XP_AMOUNTS.assessment_completed +
    counts.reviews * XP_AMOUNTS.review_resolved
  );
}
