import type {
  ContentInventory,
  Lesson,
  LessonBlock,
  Month,
  PublicationStatus,
} from "./types";
import { ATTEMPT_BLOCK_TYPES } from "./types";
import { PROGRAM } from "./program";

/**
 * Counting, kept separate from validation so the same numbers back the
 * validator, the teacher console and the month cards. There is exactly one
 * definition of "a task", and it is the one below.
 *
 * A task is an **attempt-bearing block**. Reading a concept is not a task.
 * A visual simulation is not a task. This matters because inflating the count
 * with passive blocks would make a half-built month look finished.
 */

export function isTask(block: LessonBlock): boolean {
  return ATTEMPT_BLOCK_TYPES.has(block.type);
}

function rank(status: PublicationStatus): number {
  return { draft: 0, implemented: 1, validated: 2, published: 3 }[status];
}

function lessonBlocks(month: Month): { block: LessonBlock; status: PublicationStatus }[] {
  const out: { block: LessonBlock; status: PublicationStatus }[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) out.push({ block, status: lesson.status });
    }
  }
  if (month.assessment) {
    for (const block of month.assessment.blocks) {
      out.push({ block, status: month.assessment.status });
    }
  }
  return out;
}

export function monthInventory(month: Month): ContentInventory {
  const tasks = lessonBlocks(month).filter((e) => isTask(e.block));
  return {
    expected: month.expectedTaskCount,
    implemented: tasks.filter((e) => rank(e.status) >= 1).length,
    validated: tasks.filter((e) => rank(e.status) >= 2).length,
    published: tasks.filter((e) => rank(e.status) >= 3).length,
  };
}

export function programInventory(): ContentInventory {
  return PROGRAM.months.reduce<ContentInventory>(
    (acc, month) => {
      const inv = monthInventory(month);
      return {
        expected: acc.expected + inv.expected,
        implemented: acc.implemented + inv.implemented,
        validated: acc.validated + inv.validated,
        published: acc.published + inv.published,
      };
    },
    { expected: 0, implemented: 0, validated: 0, published: 0 },
  );
}

export function allLessons(): { month: Month; lesson: Lesson }[] {
  return PROGRAM.months.flatMap((month) =>
    month.units.flatMap((unit) => unit.lessons.map((lesson) => ({ month, lesson }))),
  );
}

/**
 * Something a learner can finish: a lesson, or a month's own check.
 *
 * Deliberately NOT the `Lesson` object. The one caller is the completion route,
 * which needs to know that an id is real and how many blocks it has — and
 * handing it the authored lesson would put every `referenceSolution` one
 * careless `Response.json` away from a browser. `public.ts` exists because that
 * has already happened once.
 */
export interface Completable {
  id: string;
  /** 1 = September … 9 = May. */
  monthIndex: number;
  /** Blocks in the authored object. The ceiling for any count a client reports. */
  blockCount: number;
  status: PublicationStatus;
  /**
   * Which of the two things this is.
   *
   * Both are completed through the same route and recorded in the same table
   * under their own id, so the caller could only tell them apart by matching
   * the id against a pattern — and `task_ref` already shows what an implicit
   * string contract costs when the shape drifts. This is derived at the one
   * place that actually knows, which is the lookup that just walked the
   * curriculum to find it.
   */
  kind: "lesson" | "assessment";
}

/**
 * Look one up by the id the lesson player reports on completion.
 *
 * Covers assessments as well as lessons, because the monthly check is recorded
 * under its own id — `assessment-route.tsx` marks `m1.assessment` complete so
 * the board can show it done without it being counted as a tenth lesson.
 *
 * Returns null for anything not in the curriculum. That is the whole point: a
 * completion for an id nobody authored is a forged request, not content we have
 * yet to write.
 */
export function findCompletable(id: string): Completable | null {
  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === id) {
          return {
            id,
            monthIndex: month.index,
            blockCount: lesson.blocks.length,
            status: lesson.status,
            kind: "lesson",
          };
        }
      }
    }
    if (month.assessment?.id === id) {
      return {
        id,
        monthIndex: month.index,
        blockCount: month.assessment.blocks.length,
        status: month.assessment.status,
        kind: "assessment",
      };
    }
  }
  return null;
}
