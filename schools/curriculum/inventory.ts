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
