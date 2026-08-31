import type { Locale, Localized } from "@schools/curriculum/types";
import type {
  LessonOutline as Lesson,
  MonthOutline as Month,
  UnitOutline as Unit,
} from "@schools/curriculum/public";
import { ATTEMPT_BLOCK_TYPES } from "@schools/curriculum/types";
import { monthCompletables } from "@schools/curriculum/inventory";
import { ASSESSMENT_ART, monthArt, PROGRAMME_ART } from "./illustrations";

/**
 * Curriculum → presentation adapters.
 *
 * These translate the curriculum manifest into the data shapes the existing
 * course components already accept. They are the reason the runtime does not
 * have to be rewritten: `CourseDeck`, `LearningPaths` and `CourseGameboard`
 * keep their props, and only what flows into them changes.
 *
 * ## The rule that shapes this file
 *
 * Adapters go one way — curriculum out, presentation in. Nothing here reads
 * back into the curriculum model, and nothing in `schools/curriculum` imports
 * from here. That keeps the manifest and the Learning Intelligence pipeline
 * UI-independent, which was an explicit requirement: the same curriculum data
 * has to survive a future redesign untouched.
 *
 * ## Progress is not invented
 *
 * Every adapter takes an explicit `progress` argument. None of them derive
 * completion from the wall clock, from the month index, or from anything else
 * convenient. A learner who has done nothing shows nothing done.
 */

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/** What the learner has actually finished. Supplied by the caller, never guessed. */
export interface ProgressSnapshot {
  /** Lesson ids the learner has completed. */
  completedLessons: ReadonlySet<string>;
  /** The lesson the learner is on right now, if any. */
  currentLessonId: string | null;
  /** 1-based index of the month the class is currently teaching. */
  currentMonth: number;
}

export const EMPTY_PROGRESS: ProgressSnapshot = {
  completedLessons: new Set(),
  currentLessonId: null,
  currentMonth: 1,
};

function pick(value: Localized, locale: Locale): string {
  return value[locale];
}

/** A lesson is openable when it has been authored. Draft lessons are not. */
export function isLessonReady(lesson: Lesson): boolean {
  return lesson.status !== "draft" && lesson.blocks.length > 0;
}

export function monthIsReady(month: Month): boolean {
  return month.units.some((u) => u.lessons.some(isLessonReady));
}

/**
 * Tasks the learner is actually asked for.
 *
 * Optional ones are excluded, because this number is rendered to a learner as a
 * description of the month. Counting the bank made October advertise 85 tasks
 * where 75 are required — not as sharp as the in-lesson readout, which had a
 * numerator beside it and so read as a goal, but the same overstatement.
 *
 * `bank` on an authored block and `optional` on a projected one are the same
 * fact, and this is called with both.
 */
const isOptionalBlock = (b: { bank?: unknown; optional?: unknown }) =>
  b.bank !== undefined || b.optional === true;

export function countTasks(lesson: Lesson): number {
  return lesson.blocks.filter((b) => ATTEMPT_BLOCK_TYPES.has(b.type) && !isOptionalBlock(b)).length;
}

export function monthTaskCount(month: Month): number {
  const inLessons = month.units.reduce(
    (n, u) => n + u.lessons.reduce((m, l) => m + countTasks(l), 0),
    0,
  );
  const inAssessment =
    month.assessment?.blocks.filter((b) => ATTEMPT_BLOCK_TYPES.has(b.type) && !isOptionalBlock(b))
      .length ?? 0;
  return inLessons + inAssessment;
}

export function monthLessonCount(month: Month): number {
  return month.units.reduce((n, u) => n + u.lessons.length, 0);
}

/** All lessons of a month, flattened in teaching order. */
export function monthLessons(month: Month): { unit: Unit; lesson: Lesson }[] {
  return month.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ unit, lesson })),
  );
}

/**
 * The lesson a learner should be offered next.
 *
 * First unfinished authored lesson in teaching order. Returns null when the
 * month has nothing openable — which the UI must render as "not yet", never as
 * a dead link.
 */
export function nextLesson(month: Month, progress: ProgressSnapshot): Lesson | null {
  const all = monthLessons(month).map((e) => e.lesson).filter(isLessonReady);
  if (progress.currentLessonId) {
    const current = all.find((l) => l.id === progress.currentLessonId);
    if (current) return current;
  }
  return all.find((l) => !progress.completedLessons.has(l.id)) ?? all[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Home — the "Jump back in" 3D deck                                          */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors `DeckCourse` in `src/components/brilliant/app/course-deck.tsx`.
 *
 * Redeclared here rather than imported so this module stays free of React and
 * of the component tree — the adapter layer must not depend on the renderer it
 * feeds, or the separation it exists to protect is gone. A structural mismatch
 * surfaces at the call site as a type error, which is where it belongs.
 */
export interface DeckCourseData {
  id: string;
  title: string;
  level: string;
  href: string;
  image: string;
  thumb: string;
  lessons: { title: string; href: string; done: boolean; active: boolean }[];
}

/**
 * One month becomes one card in the deck.
 *
 * `level` carries the month name rather than a fabricated difficulty label:
 * "Қыркүйек" is a true statement about where the learner is, and "Level 1"
 * would not be.
 *
 * The deck shows at most `maxLessons` rows because the card has a fixed height
 * and the original truncates rather than scrolls. The remainder are reachable
 * from the month's own board.
 */
export function monthToDeckCourse(
  month: Month,
  progress: ProgressSnapshot,
  locale: Locale,
  maxLessons = 3,
): DeckCourseData {
  const upcoming = nextLesson(month, progress);

  const rows = monthLessons(month)
    .filter((e) => isLessonReady(e.lesson))
    .slice(0, maxLessons)
    .map(({ lesson }) => ({
      title: pick(lesson.title, locale),
      href: `/lesson/${lesson.id}`,
      done: progress.completedLessons.has(lesson.id),
      active: upcoming?.id === lesson.id,
    }));

  return {
    id: `month-${month.index}`,
    title: pick(month.title, locale),
    level: pick(month.monthName, locale),
    href: `/course/${month.index}`,
    image: monthArt(month.index),
    thumb: monthArt(month.index),
    lessons: rows,
  };
}

/**
 * The deck, ordered so the current month leads.
 *
 * Draft months are included — the deck is where a learner sees the shape of
 * their year — but they carry no lesson rows, so the card reads as "not open
 * yet" instead of offering a link that 404s.
 */
export function monthsToDeck(
  months: Month[],
  progress: ProgressSnapshot,
  locale: Locale,
): DeckCourseData[] {
  const ordered = [
    ...months.filter((m) => m.index >= progress.currentMonth),
    ...months.filter((m) => m.index < progress.currentMonth),
  ];
  return ordered.map((m) => monthToDeckCourse(m, progress, locale));
}

/* -------------------------------------------------------------------------- */
/* Courses — the learning-path rows and their tiles                           */
/* -------------------------------------------------------------------------- */

/** Mirrors `PathTile` / `LearningPath` in `app/paths-data.ts`. */
export interface PathTileData {
  title: string;
  href: string;
  img: string;
  progress?: number;
}

export interface LearningPathData {
  title: string;
  eyebrow: string;
  sub: string;
  age?: string;
  percent?: string;
  catImg: string;
  starred: boolean;
  tiles: PathTileData[];
}

/**
 * The whole nine-month programme is ONE learning path; each month is a tile.
 *
 * This is the honest shape. Rendering nine sibling paths would say the months
 * are alternatives a learner picks between, and they are not — month 5 depends
 * on month 2. One path with nine ordered tiles says "this is a route", which is
 * what the programme is.
 *
 * `percent` is per-tile completion aggregated over authored lessons only. A
 * month with no authored content contributes nothing rather than counting as
 * 0% of a large denominator, which would make the year look abandoned.
 */
export function programmeToLearningPath(
  months: Month[],
  progress: ProgressSnapshot,
  locale: Locale,
  labels: { title: string; eyebrow: string; sub: string; grade: string },
): LearningPathData {
  /* The monthly check counts. It was outside the denominator, so a learner who
     had finished all 72 lessons and not one of the nine checks was shown 100%
     on /program and a full bar on every tile — the programme's own independence
     check excluded from the measure of whether the programme was done.

     This used to be computed here. It now comes from `monthCompletables`,
     because the self-paced unlock policy needs the SAME set to decide whether
     the next month opens: a gate that disagreed with the bar directly above it
     would be this very defect again, in the direction that locks a learner out
     rather than flattering them. */
  const requiredIds = (month: Month): string[] =>
    monthCompletables(month).map((c) => c.id);

  const tiles = months.map<PathTileData>((month) => {
    const ready = requiredIds(month);
    const done = ready.filter((id) => progress.completedLessons.has(id));
    return {
      title: `${month.index}. ${pick(month.monthName, locale)}`,
      href: `/course/${month.index}`,
      img: monthArt(month.index),
      progress: ready.length > 0 ? done.length / ready.length : undefined,
    };
  });

  const allReady = months.flatMap(requiredIds);
  const allDone = allReady.filter((id) => progress.completedLessons.has(id));

  return {
    title: labels.title,
    eyebrow: labels.eyebrow,
    sub: labels.sub,
    age: labels.grade,
    percent:
      allReady.length > 0
        ? `${Math.round((allDone.length / allReady.length) * 100)}%`
        : undefined,
    catImg: PROGRAMME_ART,
    starred: true,
    tiles,
  };
}

/* -------------------------------------------------------------------------- */
/* Gameboard — the milestone path                                             */
/* -------------------------------------------------------------------------- */

/** Mirrors `GameboardNode` / `GameboardLevel` in `gameboard/course-data.ts`. */
export type NodeSide = "center" | "flex-start" | "flex-end";

export type NodeKind =
  | "lesson"
  | "practice"
  | "checkpoint"
  | "assessment"
  | "contest";

export interface GameboardNodeData {
  title: string;
  side: NodeSide;
  active?: boolean;
  review?: boolean;
  href?: string;
  done?: boolean;
  locked?: boolean;
  kind: NodeKind;
}

export interface GameboardLevelData {
  index: number;
  title: string;
  nodes: GameboardNodeData[];
}

export interface GameboardCourseData {
  title: string;
  blurb: string;
  lessons: string;
  exercises: string;
  art: string;
  activeHref: string;
}

/**
 * The zig-zag.
 *
 * In the original the side is not a pixel offset — each row sets
 * `justify-content: center | flex-start | flex-end`, and the pattern repeats
 * `center, flex-start, center, flex-end`. Reproduced exactly, because the path
 * only reads as a path if the rhythm is right: two consecutive `center` nodes
 * make it look like a list again.
 */
const SIDE_CYCLE: NodeSide[] = ["center", "flex-start", "center", "flex-end"];

function sideAt(i: number): NodeSide {
  return SIDE_CYCLE[i % SIDE_CYCLE.length];
}

/**
 * A month becomes a board: units are levels, lessons are nodes, and the monthly
 * check is a `review` node closing the last level.
 *
 * `review` is the original's own flag for a level-closing node — it is drawn
 * with a cog outline rather than a plain pedestal. Mapping the programme's
 * monthly assessment onto it means the check *looks* like the end of something,
 * which is what it is.
 */
export function monthToGameboard(
  month: Month,
  progress: ProgressSnapshot,
  locale: Locale,
  labels: { lessons: (n: number) => string; tasks: (n: number) => string },
): { course: GameboardCourseData; levels: GameboardLevelData[] } {
  const upcoming = nextLesson(month, progress);

  let cursor = 0;
  const levels: GameboardLevelData[] = month.units.map((unit, unitIndex) => {
    const nodes = unit.lessons.map<GameboardNodeData>((lesson) => {
      const ready = isLessonReady(lesson);
      const node: GameboardNodeData = {
        title: pick(lesson.title, locale),
        side: sideAt(cursor++),
        kind: unit.id.endsWith("u5") ? "practice" : "lesson",
        done: progress.completedLessons.has(lesson.id),
        active: ready && upcoming?.id === lesson.id,
        locked: !ready,
        href: ready ? `/lesson/${lesson.id}` : undefined,
      };
      return node;
    });

    // The monthly check closes the final level.
    const isLast = unitIndex === month.units.length - 1;
    if (isLast && month.assessment) {
      nodes.push({
        title: pick(month.assessment.title, locale),
        side: "center",
        review: true,
        kind: "assessment",
        /* The check is marked complete under its own id by
           `assessment-route.tsx`, and the board drew no tick because this node
           was the one kind built without a `done` — so the programme's central
           independence check was the only thing on the board that could never
           show as finished. */
        done: progress.completedLessons.has(month.assessment.id),
        locked: month.assessment.status === "draft",
        href:
          month.assessment.status === "draft"
            ? undefined
            : `/assessment/${month.index}`,
      });
      cursor++;
    }

    return { index: unit.id === "" ? unitIndex + 1 : unitIndex + 1, title: pick(unit.title, locale), nodes };
  });

  return {
    course: {
      title: pick(month.title, locale),
      blurb: pick(month.endOfMonthCapability, locale),
      lessons: labels.lessons(monthLessonCount(month)),
      /* The BUILT count, not `expectedTaskCount`.
         The board used to print the number the programme promises, which for a
         month with nothing authored yet would advertise 38 tasks over an empty
         board. `monthTaskCount` has always computed the truth and was called by
         nothing. The gap between promised and built belongs in the validator
         and the teacher console, where someone can act on it — not on a card a
         learner reads as a description of what is in front of them. */
      exercises: labels.tasks(monthTaskCount(month)),
      art: monthArt(month.index),
      activeHref: upcoming ? `/lesson/${upcoming.id}` : `/course/${month.index}`,
    },
    levels,
  };
}

export { ASSESSMENT_ART };
