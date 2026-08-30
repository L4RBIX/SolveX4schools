import { PROGRAM } from "@schools/curriculum/program";
import { blocksForTrack } from "@schools/curriculum/public";
import type { LessonBlock, PublicationStatus } from "@schools/curriculum/types";
import {
  policyBlocksFromAuthored,
  policyFor,
  type CompletableKind,
  type CompletionPolicy,
  type PolicyBlock,
} from "./completion";

/**
 * Resolving a completion claim against the curriculum.
 *
 * `findCompletable` in `schools/curriculum/inventory.ts` answers "is this id
 * real, and how many blocks does it have" and deliberately hands back nothing
 * else — it exists so the completion route cannot end up holding a `Lesson`
 * with every `referenceSolution` on it. This module answers the next question,
 * "which rule applies and to which blocks", and it is careful in the same way:
 * what comes out is `PolicyBlock[]`, which carries an id, a type, a verify mode
 * and two booleans. No prompt, no case, no key.
 *
 * ## Why the track matters here
 *
 * A support learner is never SHOWN the blocks their route excludes —
 * `publicLesson` filters them out of the payload before it is built. A
 * completion policy that required them would be unsatisfiable for exactly the
 * learners the differentiation exists to help, and the failure would look like
 * "the Finish button is broken for the weakest students in the class".
 *
 * So the same filter runs here, from the same function, against the same
 * cookie the lesson page read. If the two ever disagree, they disagree in one
 * place rather than two.
 */

export interface CompletionTarget {
  id: string;
  /** 1 = September … 9 = May. */
  monthIndex: number;
  kind: CompletableKind;
  status: PublicationStatus;
  policy: CompletionPolicy;
  /** The blocks this learner's route actually shows, in policy shape. */
  blocks: PolicyBlock[];
}

/**
 * Look up what the learner claims to have finished.
 *
 * Returns null for anything not in the curriculum, which is the whole point: a
 * completion for an id nobody authored is a forged request, not content we have
 * yet to write.
 */
export function completionTarget(id: string, track: string): CompletionTarget | null {
  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === id) {
          return build(id, month.index, "lesson", lesson.status, lesson.blocks, track);
        }
      }
    }
    if (month.assessment?.id === id) {
      return build(
        id,
        month.index,
        "assessment",
        month.assessment.status,
        month.assessment.blocks,
        track,
      );
    }
  }
  return null;
}

function build(
  id: string,
  monthIndex: number,
  kind: CompletableKind,
  status: PublicationStatus,
  blocks: readonly LessonBlock[],
  track: string,
): CompletionTarget {
  return {
    id,
    monthIndex,
    kind,
    status,
    policy: policyFor(kind),
    blocks: policyBlocksFromAuthored(blocksForTrack(blocks, track)),
  };
}
