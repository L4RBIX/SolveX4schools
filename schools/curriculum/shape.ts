import type { PublicationStatus } from "./types";

/**
 * Curriculum SHAPE — the handful of curriculum facts a browser is allowed to know.
 *
 * ## Why this module exists
 *
 * `inventory.ts` is where the counting lives, and it does that counting over
 * `PROGRAM` — the whole authored year, every hidden case, every
 * `referenceSolution`. Three of its exports, though, are pure functions of
 * their arguments: they never touch `PROGRAM` at all. Two client components
 * imported exactly those three, and a value import is a value import: the
 * bundler followed `inventory.ts` to `program.ts` to `months/` and emitted the
 * entire answer key as a 2.35 MB chunk on `/home`, `/lesson/*`, `/course/*`,
 * `/assessment/*`, `/program` and `/review`. Measured on the deployed commit:
 * 255 `referenceSolution`, 1,735 `hidden:!0`, 2,166 `expectedOutput`.
 *
 * `public.ts` had already stripped all of that out of the page props. The
 * bundle put it back, which is the specific way a trust boundary drawn in one
 * layer fails when a lower layer does not enforce it.
 *
 * So the pure half lives here, on its own, importing nothing but types, and
 * `inventory.ts` re-exports it for the server callers that were already using
 * it. `inventory.ts` and `program.ts` are now `server-only`, which turns "a
 * client component imported the curriculum" from a 2 MB chunk nobody looks at
 * into a build error.
 *
 * ## The rule for this file
 *
 * Nothing here may import a value from anything that reaches `program.ts`,
 * `months/`, or any month file. Types are fine — they are erased. If a function
 * needs to *read* the curriculum, it is not a shape function and it belongs in
 * `inventory.ts`.
 */

/** A contest lesson id, e.g. `m9.c1`. May's four practice contests. */
export const CONTEST_LESSON = /^m\d+\.c\d+$/;

/**
 * Is this lesson one of May's timed practice contests?
 *
 * `m9.c1`–`m9.c4`. Derived from the id rather than declared on the lesson,
 * matching `roleOf`, which already reads the same shape to classify a block as
 * `contest` rather than `core`. Pure, so the lesson player can use it in the
 * browser: a contest problem gets a come-back-later control that an ordinary
 * required task does not.
 */
export function isContestLesson(lessonId: string): boolean {
  return CONTEST_LESSON.test(lessonId);
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
 * The shape `monthCompletables` actually needs.
 *
 * Structural rather than `Month`, because the board renders `MonthOutline` —
 * the public projection, identical to `Month` except that its blocks are
 * reduced to `{id, type}`. This function only ever reads `blocks.length`, so
 * insisting on the full authored type would force the presentation layer to
 * keep its own copy of the definition, which is exactly what moving it here
 * was for.
 */
export interface MonthCompletableShape {
  index: number;
  units: readonly {
    lessons: readonly { id: string; status: PublicationStatus; blocks: readonly unknown[] }[];
  }[];
  assessment?: { id: string; status: PublicationStatus; blocks: readonly unknown[] } | null;
}

/**
 * Every lesson and monthly check in a month that a learner can be asked to finish.
 *
 * A draft lesson is not work a learner can be asked for, and a month whose
 * content is unwritten must not be a wall — so both are skipped.
 *
 * ## What deliberately does NOT count
 *
 * Optional and bank tasks. They are blocks INSIDE these completables, and
 * `schools/policies/completion.ts` already excludes them from a completable's
 * own requirement via `isMandatory`. Nothing here needs to know about them, and
 * a second exclusion rule at this level is how the two would eventually
 * disagree.
 */
export function monthCompletables(month: MonthCompletableShape): Completable[] {
  const out: Completable[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      if (lesson.status === "draft" || lesson.blocks.length === 0) continue;
      out.push({
        id: lesson.id,
        monthIndex: month.index,
        blockCount: lesson.blocks.length,
        status: lesson.status,
        kind: "lesson",
      });
    }
  }
  if (month.assessment && month.assessment.status !== "draft") {
    out.push({
      id: month.assessment.id,
      monthIndex: month.index,
      blockCount: month.assessment.blocks.length,
      status: month.assessment.status,
      kind: "assessment",
    });
  }
  return out;
}
