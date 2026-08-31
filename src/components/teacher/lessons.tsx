"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Localized } from "@schools/curriculum/types";
import type {
  BlockSummary,
  ClassLessons,
  LessonDetail,
  LessonSummary,
  TeacherPeriod,
} from "@schools/teacher/contracts";
import { TL, nOfM } from "@schools/teacher/labels";
import {
  EXTRA,
  occurrences,
  outstandingTasks,
  startedByFew,
  taskNumber,
  tasksCount,
} from "@schools/teacher/labels-extra/lessons";
import { L } from "@schools/presentation/labels";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { percent } from "./format";
import { useTeacherView } from "./shell";
import { GAP, INK, LINE, MOTION, NUM, RADIUS, SURFACE, TYPE } from "./tokens";
import {
  Chip,
  DataTable,
  EmptyState,
  Hint,
  Meter,
  Num,
  Section,
  StatRow,
  StatTile,
  type DataColumn,
} from "./ui";

/**
 * The lessons view.
 *
 * ## The one question
 *
 * *Is the learner struggling, or is the lesson itself bad?* A per-learner
 * dashboard cannot answer it — every signal it produces is about a child. The
 * answer only appears when the block is held fixed and the learner varies: a
 * task fourteen of eighteen got wrong is a task, not fourteen learners.
 *
 * So the table is over lessons, the drill-down is over that lesson's blocks, and
 * the per-learner strip at the bottom of the drill-down is deliberately last —
 * it is the check on the conclusion, not the conclusion.
 *
 * ## What a row says first
 *
 * The first build gave eight numeric columns the same weight and left the
 * reader dividing «0 / 5» in their head once per row to find out which lesson
 * was the problem. The completion share is now a bar with both counts printed
 * beside it, so a short bar in a column of long ones is the answer to the
 * question the page exists to ask — found by scanning, not by arithmetic.
 *
 * Two things guard that bar. A lesson nobody has opened has no share at all and
 * says so in words, because a lesson that has not started is not a lesson that
 * failed. And where only a handful of learners have started, the row states
 * that in a neutral chip — `startedBy` read back as a sentence — because «0/1»
 * in a completion column reads as a verdict on the content when it is a
 * statement about the size of the measurement.
 *
 * ## Why a block is never named by its id
 *
 * `LessonSummary` carries `hardestBlockId` and `dropOffBlockId` and nothing
 * else about those blocks: the projection deliberately keeps authored content —
 * `cases`, `referenceSolution`, `expectedOutput` — off this wire, and it does
 * that by sending ids and titles only. `m1.l4.b3` is a handle, not a label, so
 * a block is rendered as its place in the lesson plus its localised kind
 * («3-тапсырма · Код жазу»), which needs the lesson's own block list.
 *
 * That list arrives with the drill-down (`?lesson=`), which is one request per
 * lesson a teacher actually opens. Prefetching all of them would put a dozen
 * class-wide aggregates on a page load, which is the exact defect the audit
 * records as S3, so the two columns say «Раскройте задания» until the lesson is
 * open rather than printing a handle or a blank.
 *
 * ## Nothing here reads the answer
 *
 * There is no fetch in this file for lesson content, only for these analytics
 * shapes. Hidden test cases, expected outputs and reference solutions are not on
 * the payload and no request here would bring them; the drill-down shows how
 * many learners a task defeated, never what the task's answer is.
 */

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

type Loaded<T> = { ok: true; value: T } | { ok: false; failure: TeacherLoadFailure };

/**
 * One GET, and no failure string ever leaves it.
 *
 * The body may not be JSON at all — a 502 behind a proxy answers HTML — so a
 * failure to read it is just another way of saying "unavailable", never
 * something to propagate. `catch` takes no parameter on purpose: there is
 * nothing in a network error a teacher can act on, and reading it is how
 * `SyntaxError: Unexpected token '<'` ends up rendered in front of a class.
 */
async function loadTeacherJson<T>(url: string): Promise<Loaded<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const reason = await response
        .json()
        .then((body: { error?: unknown }) => body?.error)
        .catch(() => null);
      return { ok: false, failure: teacherLoadFailure(reason) };
    }
    return { ok: true, value: (await response.json()) as T };
  } catch {
    return { ok: false, failure: "unavailable" };
  }
}

/** Which window the counts came from, stated under every count that is windowed. */
const WINDOW_LABEL: Record<TeacherPeriod, Localized> = {
  week: TL.windowWeek,
  month: TL.windowMonth,
  programme: TL.windowProgramme,
};

const PANEL_ID = "teacher-lesson-detail";

/* -------------------------------------------------------------------------- */
/* Request-keyed state                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Every piece of state on this page is stamped with the request it answers.
 *
 * `key` is `class|period`, so a class or window change makes the whole load
 * stale *during render* — the skeleton comes back, the block cache empties and
 * the open lesson closes without an effect having to reset five pieces of state
 * on its way in. That matters twice over here: every count in the block cache is
 * windowed, and a September block table sitting under a «Весь курс» heading
 * would be two different questions on one screen.
 *
 * It also means a slow response for the previous class can never paint over the
 * new one — it arrives under a key nothing is reading.
 */
interface LessonsLoad {
  key: string;
  payload: ClassLessons | null;
  /* A CLOSED union, never a caught error's message. See `loadTeacherJson`. */
  failure: TeacherLoadFailure | null;
}

interface DetailLoad {
  key: string;
  /** Lesson id → its blocks and per-learner progress, for lessons opened so far. */
  byLesson: Record<string, LessonDetail>;
  /** Which lesson failed, so a failed fetch is not retried on every render. */
  failed: { lessonId: string; failure: TeacherLoadFailure } | null;
}

/* Stable identities, so a stale key does not hand the effects a fresh object
   every render and re-trigger them. */
const NO_LESSONS: LessonsLoad = { key: "", payload: null, failure: null };
const NO_DETAILS: DetailLoad = { key: "", byLesson: {}, failed: null };

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

export function TeacherLessons() {
  const { t } = useLocale();
  const { classId, period, report } = useTeacherView();

  const [load, setLoad] = useState<LessonsLoad>(NO_LESSONS);
  const [detailLoad, setDetailLoad] = useState<DetailLoad>(NO_DETAILS);
  const [opened, setOpened] = useState<{ key: string; lessonId: string } | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const requestKey = `${classId}|${period}`;
  const current = load.key === requestKey ? load : NO_LESSONS;
  const details = detailLoad.key === requestKey ? detailLoad : NO_DETAILS;
  const data = current.payload;
  const failure = current.failure;
  const loading = current === NO_LESSONS && classId !== "";
  const openLessonId = opened?.key === requestKey ? opened.lessonId : null;

  useEffect(() => {
    if (!classId) return;
    let live = true;

    void loadTeacherJson<ClassLessons>(
      `/api/teacher/class/${encodeURIComponent(classId)}/lessons?period=${period}`,
    ).then((result) => {
      if (!live) return;
      if (!result.ok) {
        setLoad({ key: requestKey, payload: null, failure: result.failure });
        return;
      }
      setLoad({ key: requestKey, payload: result.value, failure: null });
      /* The chrome's context bar and freshness line come from here rather than
         from a seventh fetch of their own. */
      report({ context: result.value.context, freshness: result.value.freshness });
    });

    return () => {
      live = false;
    };
  }, [classId, period, requestKey, report]);

  /**
   * One lesson's blocks, fetched when a teacher opens it and not before.
   *
   * `?lesson=` on the same route, so the list and the drill-down cannot disagree
   * about what "completed" means. Prefetching every lesson would put a dozen
   * class-wide aggregates on a page load, which is the shape the audit records
   * as S3.
   */
  useEffect(() => {
    if (!classId || !openLessonId) return;
    if (details.byLesson[openLessonId]) return;
    if (details.failed?.lessonId === openLessonId) return;
    let live = true;

    void loadTeacherJson<LessonDetail>(
      `/api/teacher/class/${encodeURIComponent(classId)}/lessons` +
        `?period=${period}&lesson=${encodeURIComponent(openLessonId)}`,
    ).then((result) => {
      if (!live) return;
      setDetailLoad((prev) => {
        const base = prev.key === requestKey ? prev : NO_DETAILS;
        if (!result.ok) {
          return {
            key: requestKey,
            byLesson: base.byLesson,
            failed: { lessonId: openLessonId, failure: result.failure },
          };
        }
        return {
          key: requestKey,
          byLesson: { ...base.byLesson, [result.value.lessonId]: result.value },
          failed: null,
        };
      });
    });

    return () => {
      live = false;
    };
  }, [classId, period, requestKey, openLessonId, details]);

  /* The drill-down opens below a table that can be a screen tall. Moving to it
     is the whole point of the click, so the panel is brought into view — gently,
     and never when the reader has asked for less motion. */
  useEffect(() => {
    if (!openLessonId) return;
    const panel = panelRef.current;
    if (!panel) return;
    const still =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "nearest" });
  }, [openLessonId, details]);

  const toggle = useCallback(
    (lessonId: string) => {
      setOpened((prev) =>
        prev?.key === requestKey && prev.lessonId === lessonId
          ? null
          : { key: requestKey, lessonId },
      );
    },
    [requestKey],
  );

  const closePanel = useCallback(() => setOpened(null), []);

  /* A teacher with no classes at all. Checked before the loading branch, because
     the fetch never starts and the skeleton would otherwise spin for ever. */
  if (!classId) {
    return (
      <Section title={t(TL.lessonsTitle)}>
        <EmptyState title={t(L.teacherNoClasses)} />
      </Section>
    );
  }

  if (failure) {
    return (
      <Section title={t(TL.lessonsTitle)}>
        <EmptyState title={t(teacherLoadFailureLabel(failure))} />
      </Section>
    );
  }

  if (loading || !data) {
    return (
      <Section title={t(TL.lessonsTitle)} description={t(EXTRA.lessonsQuestion)}>
        <div
          role="status"
          aria-label={t(TL.loading)}
          className={cn("h-64 animate-pulse border", RADIUS.panel, LINE.hair, SURFACE.raised)}
        />
      </Section>
    );
  }

  const { lessons, unauthoredLessons, context } = data;
  const enrolled = context.enrolled;
  const windowLabel = t(WINDOW_LABEL[period]);
  const openLesson = openLessonId
    ? (lessons.find((l) => l.lessonId === openLessonId) ?? null)
    : null;
  const openDetail = openLesson ? (details.byLesson[openLesson.lessonId] ?? null) : null;

  const nobodyStarted = lessons.filter((l) => l.startedBy === 0).length;
  const nobodyCompleted = lessons.filter((l) => l.startedBy > 0 && l.completedBy === 0).length;

  return (
    <>
      <Section title={t(TL.lessonsTitle)} description={t(EXTRA.lessonsQuestion)}>
        <StatRow columns={4}>
          <StatTile
            label={t(EXTRA.lessonsAuthored)}
            value={lessons.length}
            sub={t(context.monthTitle)}
          />
          <StatTile
            label={t(EXTRA.lessonsNobodyStarted)}
            value={nobodyStarted}
            tone={nobodyStarted > 0 ? "lock" : "neutral"}
            sub={windowLabel}
          />
          <StatTile
            label={t(EXTRA.lessonsNobodyCompleted)}
            value={nobodyCompleted}
            tone={nobodyCompleted > 0 ? "warn" : "neutral"}
            sub={windowLabel}
          />
          <StatTile
            label={t(EXTRA.lessonsUnwritten)}
            value={unauthoredLessons.length}
            tone="lock"
            sub={t(EXTRA.notOpenToStudents)}
          />
        </StatRow>

        <div className="mt-6">
          {/* Which denominator the share uses is a fact about how the number was
              BUILT, so it folds away. The counts it describes are printed in
              every row, beside the bar, on every visit — the disclosure hides
              the explanation, never the evidence. */}
          <Hint label={t(EXTRA.howCounted)}>{t(EXTRA.completionDenominator)}</Hint>

          <div className="mt-3">
            <LessonTable
              lessons={lessons}
              enrolled={enrolled}
              details={details.byLesson}
              openLessonId={openLessonId}
              onToggle={toggle}
            />
          </div>
        </div>
      </Section>

      {openLesson ? (
        <>
          {/* The scroll target is an anchor rather than a wrapper: `Section`
              drops its own top rule when it is a first child, and wrapping it
              would silently remove the line that separates the drill-down from
              the table above it. */}
          <div ref={panelRef} aria-hidden="true" className="scroll-mt-24" />
          <Section
            title={t(openLesson.title)}
            description={t(openLesson.unitTitle)}
            action={
              <button
                type="button"
                onClick={closePanel}
                aria-controls={PANEL_ID}
                className={cn(
                  "cursor-pointer border px-3.5 py-1.5",
                  RADIUS.pill,
                  LINE.edge,
                  TYPE.body,
                  INK.secondary,
                  "hover:border-b-fg/30 hover:text-b-fg",
                  MOTION.base,
                )}
              >
                {t(EXTRA.close)}
              </button>
            }
          >
            <div id={PANEL_ID}>
              {openDetail ? (
                <LessonPanel detail={openDetail} enrolled={enrolled} />
              ) : details.failed?.lessonId === openLesson.lessonId ? (
                <EmptyState title={t(teacherLoadFailureLabel(details.failed.failure))} />
              ) : (
                <div
                  role="status"
                  aria-label={t(TL.loading)}
                  className={cn("h-40 animate-pulse border", RADIUS.panel, LINE.hair, SURFACE.raised)}
                />
              )}
            </div>
          </Section>
        </>
      ) : null}

      {unauthoredLessons.length > 0 ? (
        <Section title={t(EXTRA.unauthoredTitle)} description={t(TL.lessonsUnauthoredNote)}>
          {/*
            Calm on purpose. Months 2–9 ship structure with no authored blocks,
            and a progress view that silently counted them would read as broken
            content rather than as unwritten content. Lock tone, never warn:
            nothing here has gone wrong.
          */}
          <ul className={cn("overflow-hidden border", RADIUS.panel, LINE.hair)}>
            {unauthoredLessons.map((lesson) => (
              <li
                key={lesson.lessonId}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
                  "border-t bg-b-lock-fill/40 px-4 py-3 first:border-t-0",
                  LINE.hair,
                )}
              >
                <span className={cn("min-w-0", TYPE.body, INK.secondary)}>{t(lesson.title)}</span>
                <Chip tone="lock">{t(TL.lessonNotAuthored)}</Chip>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The lesson table                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Below this many starters, a row says so beside its completion share.
 *
 * Not a threshold on the lesson and not a quality tier: the chip it triggers
 * makes exactly one claim — that few learners started — which is `startedBy`
 * restated as a sentence, and the share stays on screen unchanged next to it.
 * Below five starters one learner moves the share by more than twenty points,
 * which is the arithmetic the sentence is there to make visible.
 */
const SMALL_SAMPLE = 5;

function LessonTable({
  lessons,
  enrolled,
  details,
  openLessonId,
  onToggle,
}: {
  lessons: readonly LessonSummary[];
  enrolled: number;
  details: Record<string, LessonDetail>;
  openLessonId: string | null;
  onToggle: (lessonId: string) => void;
}) {
  const { t } = useLocale();

  const columns: DataColumn<LessonSummary>[] = [
    {
      key: "lesson",
      header: TL.colLesson,
      width: "26%",
      sortable: true,
      sortValue: (l) => t(l.title),
      render: (l) => {
        const open = openLessonId === l.lessonId;
        const fewStarted = l.startedBy > 0 && l.startedBy < SMALL_SAMPLE;
        return (
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => onToggle(l.lessonId)}
              aria-expanded={open}
              /* Only while the panel exists — `aria-controls` pointing at an id
                 that is not in the document is worse than none at all. */
              aria-controls={open ? PANEL_ID : undefined}
              title={t(EXTRA.showBlocks)}
              className="group flex w-full cursor-pointer flex-col items-start gap-0.5 text-left"
            >
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  TYPE.rowTitle,
                  MOTION.base,
                  open ? "text-b-purple" : cn(INK.primary, "group-hover:text-b-purple"),
                )}
              >
                <Caret open={open} />
                <span className="min-w-0">{t(l.title)}</span>
              </span>
              {/* Unit and size, at metadata weight. The lesson's name is what a
                  teacher scans; this is what they read once they have stopped. */}
              <span className={cn("pl-[15px]", TYPE.meta, INK.muted)}>
                {t(l.unitTitle)} · <span className="tabular-nums">{t(tasksCount(l.requiredBlocks))}</span>
              </span>
            </button>
            {fewStarted ? (
              /* Neutral, never warn. Nothing has gone wrong with a lesson four
                 people have opened; the sentence exists so the share beside it
                 is not read as a verdict on the content. */
              <Chip tone="neutral" className="ml-[15px] whitespace-nowrap">
                {t(startedByFew(l.startedBy))}
              </Chip>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "started",
      header: TL.colStarted,
      align: "right",
      sortable: true,
      sortValue: (l) => l.startedBy,
      /* Kept, and kept quiet. This is the OTHER denominator — how much of the
         class is in the measurement at all — and `completionDenominator` in the
         disclosure above promises it is on screen. */
      render: (l) => (
        <span className="whitespace-nowrap">
          <Num value={l.startedBy} />
          <span className={cn(NUM.cell, INK.muted)}> / {enrolled}</span>
        </span>
      ),
    },
    {
      key: "completion",
      header: EXTRA.colCompletionRate,
      align: "right",
      width: "18%",
      sortable: true,
      /* Unmeasured, not zero: a lesson nobody opened has no completion share,
         and `DataTable` sorts null last in both directions for that reason. */
      sortValue: (l) => (l.startedBy > 0 ? l.completedBy / l.startedBy : null),
      render: (l) => <Completion lesson={l} />,
    },
    {
      key: "independent",
      header: EXTRA.colCompletedIndependently,
      align: "right",
      sortable: true,
      sortValue: (l) => l.completedIndependentlyBy,
      render: (l) => (
        <span className="whitespace-nowrap">
          <Num value={l.completedIndependentlyBy} tone="ok" />
          <span className={cn(NUM.cell, INK.muted)}> / {l.completedBy}</span>
        </span>
      ),
    },
    {
      key: "minutes",
      header: TL.colMedianTime,
      align: "right",
      sortable: true,
      sortValue: (l) => l.medianMinutes,
      render: (l) => <Num value={l.medianMinutes} suffix={t(TL.minutesShort)} />,
    },
    {
      key: "hardest",
      header: TL.colHardestBlock,
      render: (l) => (
        <BlockRef
          blockId={l.hardestBlockId}
          detail={details[l.lessonId] ?? null}
          tone="warn"
          absent={EXTRA.notAttemptedYet}
        />
      ),
    },
    {
      key: "dropoff",
      header: TL.colDropOff,
      render: (l) => (
        <BlockRef
          blockId={l.dropOffBlockId}
          detail={details[l.lessonId] ?? null}
          tone="info"
          absent={EXTRA.noDropOff}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={lessons}
      rowKey={(l) => l.lessonId}
      caption={t(EXTRA.lessonsTableCaption)}
      empty={
        <EmptyState title={t(EXTRA.noAuthoredLessons)} hint={t(TL.lessonsUnauthoredNote)} />
      }
    />
  );
}

/**
 * How far the people who started this lesson got.
 *
 * The share, the two counts it is built from, and a bar — in that order, and
 * the bar last because it is the shape rather than the figure. It replaces the
 * division a teacher was doing per row to find the lesson that stalled.
 *
 * A lesson nobody has started gets a word instead, in muted ink. `0/0` is not a
 * completion share of zero, and an empty bar in a column of full ones is a
 * picture of a failure that has not happened: not started is an absence of
 * measurement, never a poor result.
 */
function Completion({ lesson }: { lesson: LessonSummary }) {
  const { t } = useLocale();

  if (lesson.startedBy === 0) {
    return (
      <span className={cn("whitespace-nowrap", TYPE.meta, INK.muted)}>
        {t(EXTRA.lessonsNobodyStarted)}
      </span>
    );
  }

  return (
    <div className="flex min-w-[124px] flex-col items-end gap-1.5">
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={cn(NUM.figure, INK.primary)}>
          {percent(lesson.completedBy, lesson.startedBy)}
        </span>
        {/* The counts, always. A share whose denominator is off screen is a
            number a teacher cannot check. */}
        <span className={cn("tabular-nums", TYPE.meta, INK.muted)}>
          {nOfM(lesson.completedBy, lesson.startedBy)}
        </span>
      </span>
      <Meter
        value={lesson.completedBy}
        total={lesson.startedBy}
        tone="ok"
        showValue={false}
        label={t(EXTRA.colCompletionRate)}
        className="w-full"
      />
    </div>
  );
}

/**
 * A block named by its place in the lesson, or a sentence saying why it is not.
 *
 * Three states and each is a different fact: there is no such block
 * (`absent` — nobody attempted anything, or nobody stopped anywhere), the
 * lesson's task list has not been loaded yet, and the resolved block.
 */
function BlockRef({
  blockId,
  detail,
  tone,
  absent,
}: {
  blockId: string | null;
  detail: LessonDetail | null;
  tone: "warn" | "info";
  absent: Localized;
}) {
  const { t } = useLocale();

  if (blockId === null) {
    return <span className={cn(TYPE.meta, INK.muted)}>{t(absent)}</span>;
  }
  if (!detail) {
    return <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.expandToSee)}</span>;
  }

  const index = detail.blocks.findIndex((b) => b.blockId === blockId);
  if (index < 0) {
    /* The lesson's governed block list and this id disagree — which happens when
       the track filter drops a block between two requests. Say nothing rather
       than print the handle. */
    return <span className={cn(TYPE.meta, INK.muted)}>{t(TL.emptyNotMeasured)}</span>;
  }

  const block = detail.blocks[index];
  return (
    <Chip tone={tone} className="whitespace-nowrap">
      <span className="tabular-nums">{t(taskNumber(index + 1))}</span>
      <span className="opacity-50">·</span>
      <span>{t(block.kindLabel)}</span>
    </Chip>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", MOTION.transform, open && "rotate-90")}
    >
      <path
        d="M3 1.5L7 5L3 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* One lesson: its blocks, then its learners                                  */
/* -------------------------------------------------------------------------- */

interface BlockRow extends BlockSummary {
  /** Its place in the lesson. The only name a block gets on this screen. */
  ordinal: number;
  isHardest: boolean;
  isDropOff: boolean;
}

function LessonPanel({ detail, enrolled }: { detail: LessonDetail; enrolled: number }) {
  const { t } = useLocale();

  const rows: BlockRow[] = detail.blocks.map((block, index) => ({
    ...block,
    ordinal: index + 1,
    isHardest: block.blockId === detail.hardestBlockId,
    isDropOff: block.blockId === detail.dropOffBlockId,
  }));

  const anyHumanChecked = rows.some((b) => !b.machineGradable);
  const ordinalOf = new Map(rows.map((b) => [b.blockId, b.ordinal]));

  const columns: DataColumn<BlockRow>[] = [
    {
      key: "block",
      header: TL.colBlock,
      width: "22%",
      render: (b) => (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={cn(TYPE.rowTitle, "tabular-nums", INK.primary)}>
              {t(taskNumber(b.ordinal))}
            </span>
            <span className={cn(TYPE.meta, INK.muted)}>{t(b.kindLabel)}</span>
          </span>
          {b.isHardest || b.isDropOff || !b.machineGradable ? (
            <span className="flex flex-wrap gap-1.5">
              {b.isHardest ? <Chip tone="warn">{t(TL.colHardestBlock)}</Chip> : null}
              {b.isDropOff ? <Chip tone="info">{t(TL.colDropOff)}</Chip> : null}
              {!b.machineGradable ? (
                <Chip tone="lock" title={t(TL.blockNotMachineGraded)}>
                  {t(EXTRA.humanChecked)}
                </Chip>
              ) : null}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "attempted",
      header: TL.colAttemptedBy,
      align: "right",
      sortable: true,
      sortValue: (b) => b.attemptedBy,
      render: (b) => (
        <span className="whitespace-nowrap">
          <Num value={b.attemptedBy} />
          <span className={cn(NUM.cell, INK.muted)}> / {enrolled}</span>
        </span>
      ),
    },
    {
      key: "accepted",
      header: TL.colAcceptRate,
      align: "right",
      sortable: true,
      /* A block a machine cannot grade has no accept rate to sort on — and it is
         not the lowest one, so it sorts with the other unmeasured rows. */
      sortValue: (b) =>
        b.machineGradable && b.attemptedBy > 0 ? b.acceptedBy / b.attemptedBy : null,
      render: (b) => {
        if (!b.machineGradable) return <NotApplicable />;
        if (b.attemptedBy === 0) return <Num value={null} />;
        return (
          <span className="whitespace-nowrap">
            <span className={cn(NUM.figure, INK.primary)}>
              {percent(b.acceptedBy, b.attemptedBy)}
            </span>
            <span className={cn("ml-1.5 tabular-nums", TYPE.meta, INK.muted)}>
              {nOfM(b.acceptedBy, b.attemptedBy)}
            </span>
          </span>
        );
      },
    },
    {
      key: "independent",
      header: TL.colIndependent,
      align: "right",
      sortable: true,
      sortValue: (b) => (b.machineGradable ? b.independentBy : null),
      render: (b) => (b.machineGradable ? <Num value={b.independentBy} tone="ok" /> : <NotApplicable />),
    },
    {
      key: "assisted",
      header: TL.colAssisted,
      align: "right",
      sortable: true,
      sortValue: (b) => b.assistedBy,
      render: (b) => <Num value={b.assistedBy} />,
    },
    {
      key: "revealed",
      header: TL.colRevealed,
      align: "right",
      sortable: true,
      sortValue: (b) => b.revealedBy,
      render: (b) => <Num value={b.revealedBy} tone="warn" />,
    },
    {
      key: "submissions",
      header: EXTRA.colMedianSubmissions,
      align: "right",
      sortable: true,
      sortValue: (b) => (b.machineGradable ? b.medianSubmissions : null),
      render: (b) =>
        b.machineGradable ? <Num value={b.medianSubmissions} /> : <NotApplicable />,
    },
    {
      key: "minutes",
      header: TL.colMedianTime,
      align: "right",
      sortable: true,
      sortValue: (b) => b.medianMinutes,
      render: (b) => <Num value={b.medianMinutes} suffix={t(TL.minutesShort)} />,
    },
    {
      key: "struggling",
      header: EXTRA.colStruggling,
      align: "right",
      sortable: true,
      sortValue: (b) => b.strugglingEpisodes,
      render: (b) => <Num value={b.strugglingEpisodes} tone="warn" />,
    },
    {
      key: "failure",
      header: TL.colTopMistake,
      width: "18%",
      render: (b) =>
        b.topFailure ? (
          <span className="flex min-w-0 flex-col gap-0.5">
            {/* The localised sentence, never `failureClass`. */}
            <span className={cn(TYPE.body, INK.primary)}>{t(b.topFailure.label)}</span>
            <span className={cn("tabular-nums", TYPE.meta, INK.muted)}>
              {t(occurrences(b.topFailure.occurrences))}
            </span>
          </span>
        ) : (
          <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.noNamedMistake)}</span>
        ),
    },
  ];

  return (
    <div className={GAP.band}>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className={cn(TYPE.subsection, INK.primary)}>{t(TL.blocksTitle)}</h3>
          {/* What «қиналған әрекет» counts is how a column was BUILT. Folded. */}
          <Hint label={t(EXTRA.howCounted)}>{t(EXTRA.blocksNote)}</Hint>
        </div>

        {anyHumanChecked ? (
          /* Stated once in full, in lock tone, and ABOVE the table it explains —
             it is the reason several cells read «Қолданылмайды» and a reader who
             meets it afterwards has already misread them. This is correct and
             permanent: an `explain` block is read by a person by design, and it
             must not look like an outage. */
          <p className={cn("mt-3 flex items-start gap-2", TYPE.meta, INK.secondary)}>
            <span
              aria-hidden="true"
              className="mt-1.5 size-1.5 shrink-0 rounded-full border border-b-lock-edge bg-b-lock-fill"
            />
            {t(TL.blockNotMachineGraded)}
          </p>
        ) : null}

        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(b) => b.blockId}
            caption={t(EXTRA.blocksTableCaption)}
            empty={<EmptyState title={t(EXTRA.noAuthoredLessons)} hint={t(TL.lessonNotAuthored)} />}
          />
        </div>
      </div>

      <LearnerProgress detail={detail} ordinalOf={ordinalOf} />
    </div>
  );
}

/** A grading column on a task no machine grades. Not zero, not unmeasured. */
function NotApplicable() {
  const { t } = useLocale();
  return <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.notApplicable)}</span>;
}

/**
 * Who is where inside this one lesson.
 *
 * The counterweight to the block table: the block table says whether the task is
 * hard for everyone, this says whether it is hard for three named people.
 * `completedAt` is deliberately not rendered — the projection returns it as a
 * constant `null` today, and a «Завершено: никогда» column would be a claim the
 * data does not make.
 */
function LearnerProgress({
  detail,
  ordinalOf,
}: {
  detail: LessonDetail;
  ordinalOf: Map<string, number>;
}) {
  const { t } = useLocale();
  if (detail.learners.length === 0) {
    return <EmptyState title={t(TL.emptyNoStudents)} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className={cn(TYPE.subsection, INK.primary)}>{t(EXTRA.learnerProgressTitle)}</h3>
        <Hint label={t(EXTRA.howCounted)}>{t(EXTRA.learnerProgressNote)}</Hint>
      </div>

      <ul className="mt-4 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
        {detail.learners.map((learner, index) => {
          const outstanding = learner.outstanding
            .map((blockId) => ordinalOf.get(blockId))
            .filter((n): n is number => n !== undefined)
            .sort((a, b) => a - b);
          const done = learner.total > 0 && learner.reached >= learner.total;
          return (
            <li
              key={learner.subjectId ?? `row-${index}`}
              className={cn("flex flex-col gap-1 border-t py-2.5", LINE.hair)}
            >
              <div className="flex items-center justify-between gap-4">
                <span className={cn("min-w-0 truncate", TYPE.body, INK.primary)}>
                  {learner.displayName}
                </span>
                <Meter
                  value={learner.reached}
                  total={learner.total}
                  tone={done ? "ok" : "info"}
                  label={t(EXTRA.learnerProgressTitle)}
                  className="max-w-[140px] shrink-0"
                />
              </div>
              {outstanding.length > 0 ? (
                <span className={cn("tabular-nums", TYPE.meta, INK.muted)}>
                  {t(outstandingTasks(outstanding))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
