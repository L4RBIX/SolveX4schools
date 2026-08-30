import "server-only";
import { MONTHS } from "@schools/curriculum/months";
import type { Lesson, LessonBlock, Month } from "@schools/curriculum/types";
import { checkBlock, type BlockAnswer, type CheckResult } from "./checking";

/**
 * Server-side grading.
 *
 * The client already ran `checkBlock` — that is what turns the card border
 * green without a round trip, and it should keep doing so. But the client's
 * answer is not evidence. A learner with DevTools open can post whatever
 * verdict they like, and a system that records it has no evidence base at all.
 *
 * So the same pure function runs again here, against the curriculum loaded on
 * the server, and the row that reaches the ledger is this one. The rules cannot
 * drift between the two because there is only one implementation of them.
 */

export interface GradeTarget {
  month: Month;
  lesson: Lesson;
  block: LessonBlock;
}

/** Curriculum lookup by block id. The client sends an id, never a block. */
export function findBlock(blockId: string): GradeTarget | null {
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if (block.id === blockId) return { month, lesson, block };
        }
      }
    }
    if (month.assessment) {
      for (const block of month.assessment.blocks) {
        if (block.id === blockId) {
          // An assessment has no parent lesson. Synthesised so the caller has
          // one shape to handle rather than two.
          return {
            month,
            lesson: {
              id: month.assessment.id,
              title: month.assessment.title,
              estimatedMinutes: month.assessment.minutes,
              objectives: [],
              skillRefs: [],
              blocks: month.assessment.blocks,
              sourceType: month.assessment.sourceType,
              status: month.assessment.status,
            },
            block,
          };
        }
      }
    }
  }
  return null;
}

export interface GradeOutcome {
  result: CheckResult;
  /**
   * The skill this evidence is about.
   *
   * The FIRST of the block's `skillRefs`, and that ordering is a content
   * decision rather than an accident: a block declaring
   * `["io.read", "io.print", "arith.basic"]` sends all its evidence to
   * `io.read`. The curriculum validator surfaces the primary skill per block so
   * the choice is reviewed rather than typed.
   */
  primarySkill: string | null;
  /**
   * Every skill this attempt is legitimate evidence about.
   *
   * Only `skillRefs[0]` used to be credited, and the consequence was concrete:
   * across all 36 September blocks, `compare.operators` (declared on five
   * tasks) and `types.int_float` were never first on a measured block, so a
   * learner could do the whole month and both would still read `not_started`.
   * Both are named mastery requirements in the approved programme.
   *
   * **Success only.** A correct answer is honest evidence for everything the
   * task genuinely exercised. A WRONG answer is not evidence against all of
   * them — a learner who nails the comparison and fumbles the remainder has not
   * shown weakness in comparison. Crediting every tag on a failure is the
   * "failed problem → all tags weak" bug, and this list is empty on failure so
   * that it cannot come back.
   */
  creditedSkills: string[];
  taskRef: string;
  taskKind: "lesson" | "practice" | "assessment" | "contest";
}

/**
 * Grade one answer.
 *
 * `primarySkill` is null whenever the block produced no verdict. That is the
 * rule that keeps ungraded work out of the skill model, and it is one line from
 * being "simplified" away: pass the skill for an unmeasured block and every
 * explanation, reflection and sandbox-down code task becomes an attempt with
 * zero solves, `levelFor` returns `developing`, and the dashboard tells a child
 * they are struggling at work nobody marked.
 */
export function gradeBlock(target: GradeTarget, answer: BlockAnswer): GradeOutcome {
  const { block, month } = target;
  const result = checkBlock(block, answer);

  const measured = result.verdict !== "unknown";
  const primarySkill = measured ? (block.skillRefs[0] ?? null) : null;
  /* Failure attribution keeps its existing, deliberately narrow rules: the
     primary skill only, and a named cause only where the author established
     one. Breadth is granted to success, never to failure. */
  const creditedSkills =
    measured && result.verdict === "correct" ? [...block.skillRefs] : primarySkill ? [primarySkill] : [];

  const kind = target.lesson.id.endsWith("assessment")
    ? ("assessment" as const)
    : block.id.startsWith(`m${month.index}.p`)
      ? ("practice" as const)
      : ("lesson" as const);

  return {
    result,
    primarySkill,
    creditedSkills,
    taskRef: `sx-${kind}:${block.id}`,
    taskKind: kind,
  };
}

/** Maps a school verdict onto the contract's closed vocabulary. */
export function toLearningVerdictName(
  verdict: CheckResult["verdict"],
): "accepted" | "wrong_answer" | null {
  if (verdict === "correct") return "accepted";
  if (verdict === "wrong" || verdict === "partial") return "wrong_answer";
  // `unknown` is not a verdict. Recording one would be inventing a measurement.
  return null;
}
