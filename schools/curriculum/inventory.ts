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
      };
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Curriculum role — what a learner must do vs what is available to them       */
/* -------------------------------------------------------------------------- */

/**
 * The role a task plays in the year, derived rather than declared twice.
 *
 * `expectedTaskCount` and `monthInventory` count every attempt block equally,
 * which was right while the only question was "how much has been authored".
 * It is the wrong number to plan a school year with: the programme promises
 * «шамамен 250 оқу тапсырмасы» as a MINIMUM with «қосымша есептер» beyond it
 * (p.11), and a month holding 85 tasks against a promised 38 is not a month
 * that got 47 better — it is a month whose required path and whose optional
 * breadth have not been told apart.
 *
 * Only one of these five is stored. `assessment` and `contest` are positional
 * facts the curriculum already knows, and `bank` is one field on the block;
 * `core` is what is left, which is the right default because a task nobody has
 * argued out of the path is in it.
 */
export type TaskRole = "core" | "bank" | "assessment" | "contest";

/** A contest lesson id, e.g. `m9.c1`. May's four practice contests. */
const CONTEST_LESSON = /^m\d+\.c\d+$/;

export interface RoleCounts {
  /** Every block, including the passive ones a learner reads. */
  blocks: number;
  /** Attempt-bearing blocks — `isTask`. The denominator for everything below. */
  tasks: number;
  /** Tasks a learner on this route must do to complete the month. */
  core: number;
  /** Validated, addressable, and not required: extra practice, review, extension. */
  bank: number;
  /** Tasks in the month's own check. */
  assessment: number;
  /** Tasks inside a practice contest. */
  contest: number;
  /** Of the core tasks, the ones that are a whole program from a blank editor. */
  coreCoding: number;
}

const CODING: ReadonlySet<LessonBlock["type"]> = new Set(["write_code", "modify_code", "challenge"]);

export function roleOf(block: LessonBlock, lessonId: string, inAssessment: boolean): TaskRole {
  if (inAssessment) return "assessment";
  if (CONTEST_LESSON.test(lessonId)) return "contest";
  return block.bank ? "bank" : "core";
}

/**
 * Count a month by role, for one route.
 *
 * Per-route because the question a school asks is about a learner, and the
 * three routes get different months by design. Passing no track counts the
 * union, which is the authoring view rather than anybody's actual workload.
 */
export function roleCounts(month: Month, track?: string): RoleCounts {
  const out: RoleCounts = { blocks: 0, tasks: 0, core: 0, bank: 0, assessment: 0, contest: 0, coreCoding: 0 };
  const visible = (b: LessonBlock) =>
    !track || !b.tracks || (b.tracks as readonly string[]).includes(track);

  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        if (!visible(block)) continue;
        out.blocks += 1;
        if (!isTask(block)) continue;
        out.tasks += 1;
        const role = roleOf(block, lesson.id, false);
        out[role] += 1;
        if (role === "core" && CODING.has(block.type)) out.coreCoding += 1;
      }
    }
  }
  for (const block of month.assessment?.blocks ?? []) {
    if (!visible(block)) continue;
    out.blocks += 1;
    if (!isTask(block)) continue;
    out.tasks += 1;
    out.assessment += 1;
  }
  return out;
}
