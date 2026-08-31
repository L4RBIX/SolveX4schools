import "server-only";
import type { SqlExecutor } from "@schools/store/sql";
import type { BlockType } from "@schools/curriculum/types";
import { ATTEMPTS_BEFORE_REVEAL } from "@schools/learning/reveal";
/* Deep import through the sanctioned `internal/*` alias, declared in both
   `tsconfig.json` and `vitest.config.mts`. `independenceWeight` is implemented
   and exported from its own module but is not on the package barrel, and adding
   it there would mean editing `packages/learning-intelligence-core`, which
   `docs/integration/LI_ADAPTER.md` forbids. The vitest config already documents
   this exact escape hatch for `computeInterventionOutcome`; this is the second
   user of it, and for the same reason. */
import { independenceWeight } from "@solvex/learning-intelligence-core/internal/episode";
import { awardXp, type AwardResult } from "./engine";
import { XP_ELIGIBLE_BLOCK_TYPES, XP_AMOUNTS, creditsForSolve, isExplanationBlock } from "./xp-policy";
import { weekIdForAward } from "./week";

/**
 * Turning one graded submission into XP.
 *
 * The layer between `POST /api/learning/submit` and the ledger. It decides
 * WHETHER a submission earns anything and WHAT; `engine.ts` decides whether the
 * credit is new; `xp-policy.ts` decides how much.
 *
 * Nothing here reads a request body. The block type comes from the curriculum
 * the server just graded against, the verdict from the server's own grading,
 * the week from the server's clock, and independence from the ledger.
 */

/**
 * Was this solve the learner's own work?
 *
 * ## One definition, borrowed rather than rewritten
 *
 * `independenceWeight` is exported from the learning-intelligence core and is
 * what the reducer itself uses. Calling it means the league cannot drift from
 * the teacher console's answer to the same question — and two definitions
 * already exist in this codebase and disagree (`activityBuckets` uses
 * `max_assistance_level < 0`, the teacher surface uses
 * `independence_weight >= 1`), so a third would not be a theoretical risk.
 *
 * ## The reveal, and a defect this deliberately does not inherit
 *
 * `reduceEpisode` takes `solutionRevealed` from a `solution_revealed` EVENT —
 * and nothing in `src/` or `schools/` ever emits one. The producer does not
 * exist. So `attempt_episodes.solution_revealed` is always false and
 * `independence_weight` never reaches 0 through the reveal path, despite the
 * teacher leaderboard's header stating that it does:
 *
 *     "independence_weight is 0 for a revealed solution, so it is assisted
 *      everywhere."  — schools/teacher/leaderboard.ts:46
 *
 * It is not. A learner who fails three times, is shown the answer, and submits
 * it is currently recorded as an independent solve.
 *
 * Rather than depend on that signal, this function derives the reveal from the
 * thing that actually drives it: `revealFor` opens the answer at
 * `ATTEMPTS_BEFORE_REVEAL` failures, and the prior-failure count is a fact in
 * the ledger the submit route has already computed. So the bonus is withheld
 * from a learner who has seen the answer, on this path, today — without
 * silently fixing a Learning Intelligence input that is not this feature's to
 * change, and without silently inheriting a hole.
 *
 * The defect is written up in `docs/leagues/LEAGUE_ARCHITECTURE_DISCOVERY.md` §6.1.
 */
async function wasUnaided(
  t: SqlExecutor,
  input: { subjectId: string; episodeId: string; priorFailures: number },
): Promise<boolean> {
  /* The answer was already open to them before this submission. Not "a reveal
     was returned with this response" — a learner who has seen it once has seen
     it, and a later correct answer on the same block is not unaided. */
  if (input.priorFailures >= ATTEMPTS_BEFORE_REVEAL) return false;

  const r = await t.query<{ level: number | null }>(
    /* `assistance_delivered` is written server-side by the hint route only once
       tokens actually reached the learner, so it is proof help ARRIVED rather
       than that it was asked for. Asking and then solving unaided before the
       answer came back is genuinely unaided, and this predicate says so.

       Scoped to the episode, because that is the unit assistance is scoped to. */
    `select max((payload->>'level')::int) as level
       from learning_events
      where subject_id = $1 and episode_id = $2
        and event_name = 'assistance_delivered'`,
    [input.subjectId, input.episodeId],
  );

  const level = r.rows[0]?.level;
  const maxAssistance = level === null || level === undefined ? -1 : Number(level);

  /* The core's own function, with `solutionRevealed` already handled above. */
  return independenceWeight(maxAssistance, false) >= 1;
}

export interface SolveCreditInput {
  subjectId: string;
  schoolId: string;
  classId: string;
  blockId: string;
  blockType: BlockType;
  episodeId: string;
  /** Server-graded. Only `"accepted"` earns a solve credit. */
  accepted: boolean;
  /** Failed attempts on this block before now, counted from the ledger. */
  priorFailures: number;
  /** `received_at` — our clock. Never the browser's `occurred_at`. */
  now: Date;
}

/**
 * Credit one graded submission, inside the caller's transaction.
 *
 * Returns `null` when the submission earns nothing, which is the common case:
 * a wrong answer, an ungraded block, a re-solve. `null` is not a failure and
 * the caller must not surface it as one.
 */
export async function creditSolve(
  t: SqlExecutor,
  input: SolveCreditInput,
): Promise<AwardResult | null> {
  if (!XP_ELIGIBLE_BLOCK_TYPES.has(input.blockType)) return null;

  const ctx = {
    subjectId: input.subjectId,
    schoolId: input.schoolId,
    classId: input.classId,
    weekId: weekIdForAward(input.now),
    sourceEpisode: input.episodeId,
  };

  /* An explanation is credited for being WRITTEN, not for being right — the
     server has no opinion on one and 0016 and 0022 both forbid it ever having
     one. So this branch does not consult `accepted`, which for `explain` and
     `verify` is always false anyway: they settle `unknown`. */
  if (isExplanationBlock(input.blockType)) {
    return awardXp(t, ctx, [
      {
        achievement: "explanation_submitted",
        entityId: input.blockId,
        amount: XP_AMOUNTS.explanation_submitted,
      },
    ]);
  }

  if (!input.accepted) return null;

  const unaided = await wasUnaided(t, {
    subjectId: input.subjectId,
    episodeId: input.episodeId,
    priorFailures: input.priorFailures,
  });

  return awardXp(
    t,
    ctx,
    creditsForSolve({ blockId: input.blockId, blockType: input.blockType, unaided }),
  );
}

export interface CompletionCreditInput {
  subjectId: string;
  schoolId: string;
  classId: string;
  /** A lesson id, or a month's assessment id. */
  entityId: string;
  kind: "lesson" | "assessment";
  now: Date;
}

/**
 * Credit a lesson or an assessment.
 *
 * Called from `POST /api/learning/complete`, and ONLY on the branch where
 * `recordLessonCompletion` reported `first`. That route's own
 * `on conflict do nothing returning lesson_id` already answers "has this ever
 * been completed before"; the award key answers it a second time, which is the
 * belt the braces make unnecessary and which stays because the two writes are
 * not in one transaction.
 */
export async function creditCompletion(
  t: SqlExecutor,
  input: CompletionCreditInput,
): Promise<AwardResult | null> {
  const achievement = input.kind === "assessment" ? "assessment_completed" : "lesson_completed";
  return awardXp(
    t,
    {
      subjectId: input.subjectId,
      schoolId: input.schoolId,
      classId: input.classId,
      weekId: weekIdForAward(input.now),
    },
    [{ achievement, entityId: input.entityId, amount: XP_AMOUNTS[achievement] }],
  );
}
