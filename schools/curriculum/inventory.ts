/**
 * `server-only`, and it is load-bearing rather than decorative.
 *
 * This module reads `PROGRAM`. Importing any symbol from it — even a pure
 * one — makes the bundler follow that import to the whole authored year, and a
 * client component that did exactly that shipped 2.35 MB of hidden cases,
 * reference solutions and expected outputs to every learner. See `shape.ts`,
 * which now holds the three pure functions a browser legitimately needed, and
 * `scripts/check-client-bundle.mjs`, which fails the build if the answer key
 * ever reappears in `.next/static`.
 *
 * This line is the structural half of that fix: a client import is now a build
 * error, not a chunk nobody reads.
 */
import "server-only";

import type {
  ContentInventory,
  Lesson,
  LessonBlock,
  Month,
  PublicationStatus,
} from "./types";
import { ATTEMPT_BLOCK_TYPES } from "./types";
import { PROGRAM } from "./program";
import { CONTEST_LESSON, monthCompletables } from "./shape";
import type { Completable } from "./shape";

/**
 * Re-exported so every server caller and test that already imports these from
 * `inventory` keeps working. The definitions live in `shape.ts` because they
 * are pure and the browser needs two of them; this module is where the rest of
 * the counting lives, and it is the natural place to look for them.
 */
export {
  CONTEST_LESSON,
  isContestLesson,
  monthCompletables,
  type Completable,
  type MonthCompletableShape,
} from "./shape";

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

function lessonBlocks(
  month: Month,
): { block: LessonBlock; status: PublicationStatus; inAssessment: boolean }[] {
  const out: { block: LessonBlock; status: PublicationStatus; inAssessment: boolean }[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) out.push({ block, status: lesson.status, inAssessment: false });
    }
  }
  if (month.assessment) {
    for (const block of month.assessment.blocks) {
      out.push({ block, status: month.assessment.status, inAssessment: true });
    }
  }
  return out;
}

/**
 * What the month holds, counted in the PDF's own unit.
 *
 * `expected` is the month's «Практика: шамамен N тапсырма» figure, so anything
 * put beside it has to be the same thing that paragraph counts: attempt blocks a
 * single learner meets on the required path. That means ONE route rather than
 * all three summed, and it excludes the monthly check — which the PDF states in
 * a separate paragraph — and the optional bank, which p.11 anticipates as
 * «қосымша есептер» beyond the minimum.
 *
 * This used to count every attempt block in the month across every route with
 * the check folded in, and the report printed the result against `expected` as
 * a progress bar. October read 85 against 38 and the year read 587 against 279,
 * which is not over-delivery of 210% — it is two different quantities. That
 * comparison is the subject of docs/curriculum/TASK_COUNT_RECONCILIATION.md.
 */
export function monthInventory(month: Month): ContentInventory {
  const tasks = lessonBlocks(month).filter(
    (e) =>
      isTask(e.block) &&
      !e.inAssessment &&
      !e.block.bank &&
      (!e.block.tracks || (e.block.tracks as readonly string[]).includes("core")),
  );
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

/*
 * `monthCompletables` and `MonthCompletableShape` moved to `shape.ts` and are
 * re-exported at the top of this file. They are pure functions of their
 * argument, two client components needed them, and importing them from here
 * dragged `PROGRAM` — every hidden case and reference solution — into the
 * browser bundle. The definition and the reasoning went with them.
 */

/**
 * The blocks that carry the month's own proof of independent thinking.
 *
 * `VerifyBlock.mode` is the programme's five independent checks (PDF p.6), and
 * `unseen_problem` is the one it describes as
 * «Ешбір сабақта талданбаған есептер. Олар оқушының үлгіні қайталап тұрғанын
 * әлде шынымен ойлап тұрғанын көрсетеді» — problems analysed in no lesson,
 * which show whether the learner is repeating a pattern or actually thinking.
 * See `VERIFICATION_METHODS_KK` in `source-of-truth.ts`.
 *
 * Every one of the nine months has at least one, in its monthly check, and
 * every one carries test cases — so this is a machine-gradeable question the
 * curriculum itself nominates as the measure of independence. It is not a
 * threshold anybody here invented, which is the whole reason the month-unlock
 * rule is built on it rather than on a percentage.
 *
 * Only blocks with cases are returned. An `unseen_problem` a machine cannot
 * grade could never be *solved* in the sense the gate needs, and requiring one
 * would make the month impossible to leave.
 *
 * ## Why the AUTHORED block type is demanded, not a structural shape
 *
 * This took `readonly unknown[]` and cast its way to `mode` and `cases`, so
 * that the board's `MonthOutline` — which `MonthCompletableShape` explicitly
 * invites, and whose `outlineBlocks` reduces every block to `{id, type}` —
 * satisfied it. Measured: passing outlines returns `[]` for all nine months,
 * which flips `demonstrated` to `true` everywhere and hands the attempt-spam
 * learner `unlockedThrough: 9`. The whole gate off, silently, with no type
 * error anywhere.
 *
 * No live caller did that. The type accepted it, which for a function that
 * decides whether a learner has demonstrated anything is close enough to a
 * defect. Demanding `LessonBlock[]` makes it a compile error instead, and the
 * narrowing on `block.type` then gives `mode` and `cases` for free.
 */
export function monthIndependenceBlocks(month: {
  assessment?: { blocks: readonly LessonBlock[] } | null;
}): string[] {
  const assessment = month.assessment;
  if (!assessment) return [];
  const out: string[] = [];
  for (const block of assessment.blocks) {
    if (block.type !== "verify" || block.mode !== "unseen_problem") continue;
    if (!Array.isArray(block.cases) || block.cases.length === 0) continue;
    out.push(block.id);
  }
  return out;
}

/**
 * Is this lesson one of May's timed practice contests?
 *
 * `m9.c1`–`m9.c4`. Derived from the id rather than declared on the lesson,
 * matching `roleOf`, which already reads the same shape to classify a block as
 * `contest` rather than `core`. Pure and free of `server-only`, because the
 * lesson player needs it in the browser: a contest problem gets a
 * come-back-later control that an ordinary required task does not.
 */


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
/**
 * Does the learner produce a whole program with nothing to start from?
 *
 * This is the programme's «толық дербес шешім» — a complete independent
 * solution, the thing p.11 promises about a hundred of. It is the sharpest
 * measure of evidence the curriculum has, and it was defined four times: twice
 * identically in `scripts/skill-matrix.ts` and `scripts/reconcile-counts.ts`,
 * and inline again in `scripts/requirement-matrix.ts` and in the tests. Four
 * copies of a definition that decides a headline number is three too many.
 *
 * `modify_code` and `fill_blank` are excluded however much work they involve:
 * a task that hands over most of the program is not a complete independent
 * solution, whatever else it is good for. `isGuided` is what they are.
 */
/**
 * The highest month index that actually has authored lessons.
 *
 * Derived, because it was a literal `1` in the `/you` payload with a comment
 * explaining that later months had no content — true when written, false from
 * the moment the year was finished, and nothing failed when it went stale. A
 * learner in March saw ten September skills and none of the thirty-eight
 * introduced since.
 */
export function lastAuthoredMonth(): number {
  const authored = PROGRAM.months.filter((m) =>
    m.units.some((u) => u.lessons.some((l) => l.blocks.length > 0)),
  );
  return authored.length ? Math.max(...authored.map((m) => m.index)) : 0;
}

export function isIndependent(block: LessonBlock): boolean {
  if (block.type === "challenge") return true;
  if (block.type === "write_code") return !block.starter?.trim();
  if (block.type === "verify") return block.mode === "unseen_problem";
  return false;
}

/**
 * The learner acts, but the program is not theirs to produce whole.
 *
 * A starter to extend, a template to fill, someone else's code to repair or
 * reorder. Real evidence of understanding and a different kind from the above,
 * which is why the skill matrix reports them in separate columns rather than
 * folding both into "practised".
 */
export function isGuided(block: LessonBlock): boolean {
  return isTask(block) && !isIndependent(block);
}

/**
 * Is this task on the required path?
 *
 * Absent `bank` means core. Stated as a function because "is it required" is
 * asked in a dozen places and `!block.bank` reads like a null check rather than
 * like the curriculum decision it is.
 */
export function isRequired(block: LessonBlock): boolean {
  return !block.bank;
}

export type TaskRole = "core" | "bank" | "assessment" | "contest";

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
  /* `bank` is asked before position. A banked task in a contest lesson would
     otherwise be counted as contest work while `requirementFor` went on
     exempting it — the reporting-against-policy disagreement this field exists
     to end, reintroduced by an ordering. No contest lesson carries one today. */
  if (block.bank) return "bank";
  if (CONTEST_LESSON.test(lessonId)) return "contest";
  return "core";
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
