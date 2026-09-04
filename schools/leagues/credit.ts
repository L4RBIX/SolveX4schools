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
 * ## The reveal, and why this still counts it itself
 *
 * `reduceEpisode` takes `solutionRevealed` from a `solution_revealed` EVENT.
 * When this file was written nothing emitted one — the producer did not exist,
 * `attempt_episodes.solution_revealed` was always false, and the teacher
 * leaderboard's header made a claim the data could not support:
 *
 *     "independence_weight is 0 for a revealed solution, so it is assisted
 *      everywhere."  — schools/teacher/leaderboard.ts
 *
 * That is TRUE NOW. `/api/learning/submit` emits `solution_revealed`,
 * server-authored, on the attempt that crosses `ATTEMPTS_BEFORE_REVEAL`, and
 * `tests/school/reveal-independence.test.ts` drives the real route and asserts
 * the whole chain: one event, `source_trust` server, `independence_weight` 0
 * through the reducer, and a later correct answer still `accepted` but no
 * longer independent.
 *
 * This function is left deriving the reveal from `priorFailures` anyway, and
 * that is deliberate rather than leftover. The two agree — both key off
 * `ATTEMPTS_BEFORE_REVEAL` — but they agree at different TIMES. XP is credited
 * inside the transaction that settles the verdict, and the reduced episode is
 * written later by the sweep, so at the moment of the award the reducer has not
 * run and `attempt_episodes` does not yet know. Waiting for it would mean
 * either awarding on stale state or making the league's write depend on the
 * reducer's schedule.
 *
 * `docs/leagues/LEAGUE_ARCHITECTURE_DISCOVERY.md` §6.1 describes the gap as
 * open. It was closed by the integration, and the file is a snapshot of what
 * was true when the League workstream branched.
 */
async function wasUnaided(
  t: SqlExecutor,
  input: { subjectId: string; blockId: string; episodeId: string; priorFailures: number },
): Promise<boolean> {
  /* The answer was already open to them before this submission. Not "a reveal
     was returned with this response" — a learner who has seen it once has seen
     it, and a later correct answer on the same block is not unaided. */
  if (input.priorFailures >= ATTEMPTS_BEFORE_REVEAL) return false;

  /*
   * Scoped to the BLOCK, across every episode — not to one episode.
   *
   * It was scoped to the episode, with a comment saying "that is the unit
   * assistance is scoped to". True of the ladder, and the wrong unit for this
   * question. `priorFailures` is per episode too, so both halves of "did they
   * do this on their own" reset together the moment a new episode id appears —
   * and a new episode id appears whenever the player mints one, which a reload
   * does.
   *
   * Measured: reveal the answer under E1, then submit the same block under E2,
   * and the solve is credited 15 XP instead of 10. Farmable on purpose, and
   * awarded wrongly to an honest learner who simply refreshed the page — which
   * is the half that matters more, because it corrupts the independence signal
   * the whole league is meant to reward.
   *
   * "On their own" is a property of a learner and a task. It cannot be a
   * property of a browser session.
   *
   * Two ways in, because `assistance_delivered` did not carry `task_ref` until
   * now: directly by task, and through the episodes this block was opened in.
   * The second covers rows written before the field was added.
   *
   * `source_trust <> 'browser'` throughout: a browser may post
   * `assistance_delivered` into its own episode, and without the filter the
   * cheapest way to look aided is to say you were.
   */
  const r = await t.query<{ level: number | null; revealed: boolean | null }>(
    `with episodes as (
       select distinct episode_id
         from learning_events
        where subject_id = $1
          and event_name = 'episode_opened'
          and source_trust <> 'browser'
          and episode_id is not null
          and split_part(payload ->> 'task_ref', ':', 2) = $2
     )
     select max((e.payload ->> 'level')::int)
              filter (where e.event_name = 'assistance_delivered')          as level,
            bool_or(e.event_name = 'solution_revealed')                     as revealed
       from learning_events e
      where e.subject_id = $1
        and e.source_trust <> 'browser'
        and e.event_name in ('assistance_delivered', 'solution_revealed')
        and (
          split_part(e.payload ->> 'task_ref', ':', 2) = $2
          or e.episode_id in (select episode_id from episodes)
        )`,
    [input.subjectId, input.blockId],
  );

  const level = r.rows[0]?.level;
  const maxAssistance = level === null || level === undefined ? -1 : Number(level);
  const revealed = r.rows[0]?.revealed === true;

  /* The core's own function. `solutionRevealed` is now a real argument rather
     than a constant false: the reveal is recorded in the ledger for the block,
     and this is the read that makes a fresh episode unable to forget it. */
  return independenceWeight(maxAssistance, revealed) >= 1;
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
    blockId: input.blockId,
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
