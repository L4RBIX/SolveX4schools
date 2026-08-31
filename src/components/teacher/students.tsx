"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import {
  LEARNER_STATUSES,
  type ClassContext,
  type Freshness,
  type LearnerStatus,
  type PeriodDescriptor,
  type RosterRow,
} from "@schools/teacher/contracts";
import { TL, nOfM } from "@schools/teacher/labels";
import {
  EXTRA,
  daysAgoShort,
  moreFindings,
} from "@schools/teacher/labels-extra/roster";
import {
  EXTRA as SHELL_EXTRA,
  ofStudents,
} from "@schools/teacher/labels-extra/shell";
import { numericDateTime } from "@schools/presentation/dates";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { relativeDays, share } from "./format";
import { useTeacherView } from "./shell";
import { GAP, INK, LINE, MOTION, NUM, RADIUS, SURFACE, TYPE } from "./tokens";
import {
  EmptyState,
  Hint,
  Meter,
  Num,
  SearchInput,
  Section,
  StatusBadge,
} from "./ui";

/**
 * The class roster.
 *
 * One row per enrolled learner, sortable, filterable, and exportable. It
 * replaces the learner *cards* of the old panel, which fitted six children on a
 * screen and made a class of eighteen a scrolling exercise.
 *
 * ## Six columns, not eleven
 *
 * The first build gave attempts, practice minutes, active days and help taken
 * the same width and the same weight as status and current topic. All four are
 * drill-down facts — a teacher reaches for them once they have decided a child
 * is worth looking at, never while deciding. They now live behind a chevron in
 * the first cell, in a detail row that spans the table.
 *
 * Nothing is deleted by that move: the detail row is always in the DOM and is
 * hidden rather than unmounted, the CSV export is a server route that never
 * looked at the DOM in the first place, and the chevron is a real
 * `aria-expanded` button rather than a hover affordance.
 *
 * ## The three things it is careful about
 *
 * **Everyone appears.** A learner with `subjectId: null` has never opened
 * anything — they have no episodes, no subject and no detail page. The old
 * dashboard could not surface them at all (audit #3, #10: the never-started
 * count was structurally always zero and the inactivity signal was guarded by a
 * timestamp they do not have). Here they are an ordinary row with the
 * `not_started` badge and the never-started finding, and only their *name* stops
 * being a link. Their row is not dimmed and not tinted: not started is an
 * absence, and styling an absence as a failure is a judgement about a login.
 *
 * **A share never travels without its counts.** The independence column prints
 * «7/9 78%», not «78%», and when `independentShare` is `null` it prints
 * «Не измерено» rather than «0%» — a learner who has solved nothing and a
 * learner nobody measured are different facts and only one is about the learner.
 *
 * **Nothing here holds a string.** Every visible word comes from `TL`, from
 * `EXTRA`, or as a `Localized` on the payload. No status enum, no finding kind
 * and no failure class is rendered: a finding shows its `detail` sentence, and
 * the status shows through `StatusBadge`.
 */

/* -------------------------------------------------------------------------- */
/* Payload                                                                    */
/* -------------------------------------------------------------------------- */

interface RosterPayload {
  context: ClassContext;
  period: PeriodDescriptor;
  freshness: Freshness;
  rows: RosterRow[];
}

/* -------------------------------------------------------------------------- */
/* Status vocabulary                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The filter segments' labels, and the sort order of the status column.
 *
 * `ui.tsx` keeps its own copy of the label map for `StatusBadge`; this one
 * exists because the segments need the words *without* the badge chrome, and
 * exporting a private map for one caller would widen the primitive kit's API for
 * no gain.
 *
 * The rank is the order a teacher with three minutes wants: whoever a lesson
 * could change first. `ready_to_stretch` ranks below the three absences on
 * purpose — a child who is flying is not a reason to look past one who is stuck.
 */
const STATUS_LABEL: Record<LearnerStatus, Localized> = {
  needs_attention: TL.statusNeedsAttention,
  dormant: TL.statusDormant,
  not_started: TL.statusNotStarted,
  ready_to_stretch: TL.statusReadyToStretch,
  on_track: TL.statusOnTrack,
};

const STATUS_RANK: Record<LearnerStatus, number> = {
  needs_attention: 0,
  dormant: 1,
  not_started: 2,
  ready_to_stretch: 3,
  on_track: 4,
};

/** Segment order. `LEARNER_STATUSES` is declaration order; this is teaching order. */
const FILTER_ORDER: readonly LearnerStatus[] = [...LEARNER_STATUSES].sort(
  (a, b) => STATUS_RANK[a] - STATUS_RANK[b],
);

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

export function TeacherRoster() {
  const { locale, t } = useLocale();
  const loc = locale as Locale;
  const { classId, period, query, report } = useTeacherView();

  /*
   * One state for the whole load, stamped with the request it answers.
   *
   * Stamping it is what lets the effect stay a pure subscription: a class or
   * period change makes `load.key` stale *during render*, so the skeleton comes
   * back without the effect having to reset three pieces of state on its way in
   * — and a slow response for the previous class can never paint over the new
   * one, because it arrives under a key nothing is reading.
   *
   * `failure` is a CLOSED union, never a caught message. The old panel typed it
   * as `string | null` and fed it from the error it caught, so an expired
   * session put `not_authenticated` on a teacher's screen and a 500 behind an
   * HTML-serving proxy put the JSON parser's own `SyntaxError: Unexpected token
   * '<'` there. The union means no failure can carry a value that reaches the
   * page: the sentence is chosen here, from three we wrote.
   *
   * `loadedAt` is stamped when the payload lands, so «3 дня назад» is measured
   * against the load rather than against a `new Date()` that moves every render.
   */
  const [load, setLoad] = useState<{
    key: string;
    payload: RosterPayload | null;
    failure: TeacherLoadFailure | null;
    loadedAt: Date | null;
  }>({ key: "", payload: null, failure: null, loadedAt: null });

  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<readonly LearnerStatus[]>([]);
  /* Which rows have their secondary numbers open. Keyed by `userId`, which is
     unique across classes, so switching class cannot re-open someone else's. */
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const requestKey = `${classId}|${period}`;
  const current = load.key === requestKey ? load : null;
  const payload = current?.payload ?? null;
  const failure = current?.failure ?? null;
  const loadedAt = current?.loadedAt ?? null;

  useEffect(() => {
    if (!classId) return;
    let live = true;

    fetch(
      `/api/teacher/class/${encodeURIComponent(classId)}/students?period=${period}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          /* The body may not be JSON at all — that is exactly the case that
             produced the parser error above — so failing to read it is just
             another way of saying "unavailable", never something to propagate. */
          const reason = await response
            .json()
            .then((body: { error?: unknown }) => body?.error)
            .catch(() => null);
          if (!live) return;
          setLoad({
            key: requestKey,
            payload: null,
            failure: teacherLoadFailure(reason),
            loadedAt: null,
          });
          return;
        }
        const data = (await response.json()) as RosterPayload;
        if (!live) return;
        setLoad({
          key: requestKey,
          payload: data,
          failure: null,
          loadedAt: new Date(),
        });
        /* The chrome does not fetch a seventh time: the page that already has
           the context and the freshness reports them up. */
        report({ context: data.context, freshness: data.freshness });
      })
      /* No parameter, deliberately. There is nothing in a network error a
         teacher can act on, and reading it is how it ends up rendered. */
      .catch(() => {
        if (live) {
          setLoad({
            key: requestKey,
            payload: null,
            failure: "unavailable",
            loadedAt: null,
          });
        }
      });

    return () => {
      live = false;
    };
  }, [classId, period, requestKey, report]);

  const rows = useMemo(() => payload?.rows ?? [], [payload]);

  const counts = useMemo(() => {
    const tally: Record<LearnerStatus, number> = {
      not_started: 0,
      dormant: 0,
      needs_attention: 0,
      ready_to_stretch: 0,
      on_track: 0,
    };
    for (const row of rows) tally[row.status] += 1;
    return tally;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statuses.length > 0 && !statuses.includes(row.status)) return false;
      if (needle && !row.displayName.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [rows, search, statuses]);

  const columns = useMemo(
    () => rosterColumns({ t, loc, now: loadedAt, query }),
    [t, loc, loadedAt, query],
  );

  const toggleRow = useCallback((userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(userId)) next.add(userId);
      return next;
    });
  }, []);

  const exportHref = classId
    ? `/api/teacher/class/${encodeURIComponent(classId)}/export?kind=students`
    : null;

  return (
    <Section
      title={t(TL.navStudents)}
      action={exportHref ? <ExportCsv href={exportHref} /> : undefined}
    >
      {!classId ? (
        <EmptyState title={t(SHELL_EXTRA.noClassSelected)} />
      ) : failure ? (
        <EmptyState title={t(teacherLoadFailureLabel(failure))} />
      ) : !payload ? (
        <RosterSkeleton />
      ) : rows.length === 0 ? (
        /* Zero rows means zero enrolled — the rows ARE the roster. The old
           panel's empty state fired on the same condition and said "nobody has
           done any work", which is a different and much more alarming claim. */
        <EmptyState title={t(TL.emptyNoStudents)} />
      ) : (
        <div className={GAP.block}>
          <div>
            <Hint label={t(EXTRA.howToRead)}>
              <p>{t(EXTRA.rosterDescription)}</p>
              <p className="mt-2">{t(EXTRA.detailsHint)}</p>
            </Hint>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              className="w-full sm:w-[236px]"
            />
            <StatusFilter
              counts={counts}
              total={rows.length}
              selected={statuses}
              onToggle={(status) =>
                setStatuses((prev) =>
                  prev.includes(status)
                    ? prev.filter((s) => s !== status)
                    : [...prev, status],
                )
              }
              onClear={() => setStatuses([])}
            />
            <p
              className={cn(
                "ml-auto shrink-0 tabular-nums",
                TYPE.meta,
                INK.muted,
              )}
            >
              {t(ofStudents(filtered.length, rows.length))}
            </p>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title={t(
                search.trim() ? SHELL_EXTRA.searchNoMatch : EXTRA.filterNoMatch,
              )}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatuses([]);
                  }}
                  className={cn(
                    "cursor-pointer rounded-full border px-3.5 py-1.5",
                    LINE.edge,
                    TYPE.meta,
                    INK.secondary,
                    "hover:border-b-fg/35 hover:text-b-fg",
                    MOTION.base,
                  )}
                >
                  {t(EXTRA.clearFilters)}
                </button>
              }
            />
          ) : (
            <RosterTable
              columns={columns}
              rows={filtered}
              caption={t(EXTRA.rosterCaption)}
              initialSort={{ key: "status", direction: "asc" }}
              rowHref={(row) => studentHref(row, query)}
              expanded={expanded}
              onToggle={toggleRow}
              detail={(row) => <SecondaryNumbers row={row} t={t} />}
            />
          )}
        </div>
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Where a learner's detail page is, or `null` when there is not one.
 *
 * `subjectId === null` is a learner with no episodes at all. Every drill-down
 * keys on the subject, so there is nothing behind the link — and a link that
 * lands on a 404 is worse than a name that is plainly not a link.
 */
function studentHref(row: RosterRow, query: string): string | null {
  if (!row.subjectId) return null;
  const path = `/teacher/students/${encodeURIComponent(row.subjectId)}`;
  return query ? `${path}?${query}` : path;
}

interface RosterColumn {
  /** Stable id. Used for the sort state and as the React key. */
  key: string;
  header: Localized;
  align?: "left" | "right";
  sortable?: boolean;
  /**
   * What to sort on. `null` sorts LAST in both directions: an unmeasured
   * learner is not the smallest one, and burying them at the bottom of a
   * descending sort would hide exactly the row that needs a teacher.
   */
  sortValue?: (row: RosterRow) => number | string | null;
  render: (row: RosterRow) => ReactNode;
  width?: string;
}

/**
 * The six a teacher scans: who, how they are, what they are on, how much of the
 * required work is done, how much of it they did alone, and when they were last
 * here.
 *
 * Everything the old grid also carried is one chevron away — see
 * `SecondaryNumbers` — and nothing about how any of it is computed changed.
 */
function rosterColumns({
  t,
  loc,
  now,
  query,
}: {
  t: (value: Localized) => string;
  loc: Locale;
  now: Date | null;
  query: string;
}): readonly RosterColumn[] {
  return [
    {
      key: "student",
      header: TL.colStudent,
      width: "268px",
      sortable: true,
      sortValue: (row) => row.displayName,
      render: (row) => <StudentCell row={row} query={query} t={t} />,
    },
    {
      key: "status",
      header: TL.colStatus,
      width: "156px",
      sortable: true,
      sortValue: (row) => STATUS_RANK[row.status],
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "topic",
      header: TL.colTopic,
      width: "192px",
      render: (row) =>
        row.currentTopic ? (
          <span
            title={t(row.currentTopic.title)}
            className={cn(
              "block max-w-[178px] truncate",
              TYPE.body,
              INK.secondary,
            )}
          >
            {t(row.currentTopic.title)}
          </span>
        ) : (
          /* Not «не измерено»: the topic is not a measurement that failed, it
             is a lesson that was never opened. */
          <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.noTopic)}</span>
        ),
    },
    {
      key: "required",
      header: TL.colRequired,
      width: "156px",
      sortable: true,
      /* Nothing published is not zero progress, so it sorts as unmeasured
         rather than as the worst row in the class. */
      sortValue: (row) =>
        row.requiredWork.total > 0
          ? row.requiredWork.completed / row.requiredWork.total
          : null,
      render: (row) => (
        <Meter
          value={row.requiredWork.completed}
          total={row.requiredWork.total}
          label={t(TL.colRequired)}
        />
      ),
    },
    {
      key: "independent",
      header: TL.colIndependent,
      align: "right",
      width: "124px",
      sortable: true,
      sortValue: (row) => row.independentShare,
      render: (row) => <IndependenceCell row={row} t={t} />,
    },
    {
      key: "lastActive",
      header: TL.colLastActive,
      width: "136px",
      sortable: true,
      /* Newest first when descending. `null` — never seen at all — sorts last in
         both directions by the table's rule, which is right here: they are not
         the least recently active learner, they are a learner with no clock. */
      sortValue: (row) =>
        row.lastActiveAt ? Date.parse(row.lastActiveAt) : null,
      render: (row) => <LastActiveCell row={row} loc={loc} now={now} t={t} />,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The name, and the reasons the badge beside it says what it says.
 *
 * The findings' `detail` is prose written by the projection — never a
 * `FindingKind`, never a `failureClass`. It is the WHY, so it is rendered at
 * metadata size in secondary ink rather than at the 13px `/50` the audit found
 * it at; two of them show, and anything beyond that is counted in words by
 * `moreFindings` rather than left as a bare «+3» nobody can interpret.
 */
function StudentCell({
  row,
  query,
  t,
}: {
  row: RosterRow;
  query: string;
  t: (value: Localized) => string;
}) {
  const href = studentHref(row, query);
  /* A never-started learner is the one row the projection might send with no
     findings attached, and an empty second line would make them look ordinary. */
  const details =
    row.findings.length > 0
      ? row.findings.slice(0, 2).map((finding) => t(finding.detail))
      : row.status === "not_started"
        ? [t(TL.findingNeverStarted)]
        : [];
  const extra = Math.max(0, row.findings.length - 2);

  return (
    <div className="min-w-0">
      {href ? (
        <Link
          href={href}
          title={t(EXTRA.openStudent)}
          className={cn(
            "underline-offset-2 hover:text-b-purple hover:underline",
            TYPE.rowTitle,
            INK.primary,
            MOTION.base,
          )}
        >
          {row.displayName}
        </Link>
      ) : (
        /* Not dimmed to a whisper and not tinted: this learner has not failed,
           they have no page to open, and the title says exactly that. */
        <span
          title={t(EXTRA.noStudentPage)}
          className={cn("cursor-default", TYPE.rowTitle, INK.secondary)}
        >
          {row.displayName}
        </span>
      )}
      {details.length > 0 ? (
        <div className={cn("mt-1", TYPE.meta, INK.secondary)}>
          {details.map((detail, index) => (
            <p key={detail} className="max-w-[232px] truncate" title={detail}>
              {detail}
              {index === details.length - 1 && extra > 0 ? (
                <span className={cn("ml-1.5", INK.muted)}>
                  {t(moreFindings(extra))}
                </span>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * When this learner was last seen, in days, with the exact stamp on hover.
 *
 * The relative form is what a teacher reads at a glance and the absolute one is
 * what they need when they disagree with it, so both are present rather than
 * one being chosen for them.
 *
 * A week or more takes the warn tone — and the tone is redundant, which is the
 * point: the cell already *says* «14 дней назад», so nothing is lost to a
 * teacher who cannot separate the colours.
 */
function LastActiveCell({
  row,
  loc,
  now,
  t,
}: {
  row: RosterRow;
  loc: Locale;
  now: Date | null;
  t: (value: Localized) => string;
}) {
  const days = now ? relativeDays(row.lastActiveAt, now) : null;
  if (days === null || !row.lastActiveAt) {
    return <span className={cn(TYPE.meta, INK.muted)}>{t(TL.never)}</span>;
  }
  const label =
    days === 0
      ? t(EXTRA.today)
      : days === 1
        ? t(EXTRA.yesterday)
        : t(daysAgoShort(days));
  return (
    <span
      title={numericDateTime(loc, new Date(row.lastActiveAt))}
      className={cn(
        "whitespace-nowrap tabular-nums",
        TYPE.body,
        days >= 7 ? "text-b-warn-icon" : INK.secondary,
      )}
    >
      {label}
    </span>
  );
}

/**
 * «7/9 78%» — the counts first, the share second, and neither without the other.
 *
 * `independentShare === null` means nothing was solved in this window, which is
 * not 0% independence. It prints «Не измерено», because 0% is a claim about the
 * learner and «не измерено» is a claim about the evidence.
 */
function IndependenceCell({
  row,
  t,
}: {
  row: RosterRow;
  t: (value: Localized) => string;
}) {
  const pct = share(row.independentShare);
  if (pct === null) {
    return (
      <span className={cn(TYPE.meta, INK.muted)}>{t(TL.emptyNotMeasured)}</span>
    );
  }
  const solved = row.solvedIndependent + row.solvedAssisted;
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className={cn(NUM.figure, INK.primary)}>
        {nOfM(row.solvedIndependent, solved)}
      </span>
      <span className={cn(TYPE.meta, "tabular-nums", INK.muted)}>{pct}</span>
    </span>
  );
}

/**
 * The four counts that left the main grid, plus the assisted solves the
 * independence ratio already implies.
 *
 * A labelled inline list rather than five more columns: they are read one row
 * at a time, by someone who has already decided this learner is worth a look,
 * and a column that is scanned by nobody still costs every other column width.
 *
 * `Num` keeps the two rules that matter here — a zero is dimmed so the eye finds
 * what is not zero, and nothing prints `0` for a measurement nobody made.
 */
function SecondaryNumbers({
  row,
  t,
}: {
  row: RosterRow;
  t: (value: Localized) => string;
}) {
  const items: { key: string; label: string; value: ReactNode }[] = [
    {
      key: "assisted",
      label: t(TL.colAssisted),
      value: <Num value={row.solvedAssisted} />,
    },
    {
      key: "attempts",
      label: t(TL.colAttempts),
      value: <Num value={row.submissions} />,
    },
    {
      key: "practice",
      label: t(TL.colPractice),
      value: <Num value={row.practiceMinutes} suffix={t(TL.minutesShort)} />,
    },
    {
      key: "days",
      label: t(TL.colDays),
      value: <Num value={row.activeDays} />,
    },
    {
      key: "help",
      label: t(TL.colHelp),
      value: <Num value={row.interventions} />,
    },
  ];
  return (
    <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-baseline gap-2">
          <dt className={cn(TYPE.meta, INK.muted)}>{item.label}</dt>
          <dd className={NUM.cell}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* The table                                                                  */
/* -------------------------------------------------------------------------- */

type SortDirection = "asc" | "desc";

/**
 * The roster's own table.
 *
 * `DataTable` in `ui.tsx` renders exactly one `<tr>` per row and has nowhere to
 * put a second one, so the expandable detail this page needs cannot be
 * expressed through it. Everything else it guarantees is kept, deliberately, to
 * the letter: real `<table>` semantics, `<th scope="col">`, `aria-sort` on the
 * sorted column, a `<caption>`, `null` sorting last in both directions, no zebra
 * striping, and a wrapper that takes the horizontal scroll so a wide table can
 * never push the page into one.
 *
 * Headers are sentence case at metadata size. `DataTable` sets them in 12px
 * caps, which in Cyrillic — with ә ғ қ ң ө ұ ү һ і — is slower to read, and a
 * header row that shouts competes with the names underneath it.
 */
function RosterTable({
  columns,
  rows,
  caption,
  initialSort,
  rowHref,
  expanded,
  onToggle,
  detail,
}: {
  columns: readonly RosterColumn[];
  rows: readonly RosterRow[];
  /** Screen-reader caption. An unnamed table is a wall of numbers. */
  caption: string;
  initialSort?: { key: string; direction: SortDirection };
  /**
   * Where a row leads, or `null` for a row that leads nowhere.
   *
   * **A mouse convenience and nothing more.** A `<tr>` cannot be focused or
   * activated from a keyboard, so the learner's name in the first cell is a
   * real `<a>` and that link is the accessible path. Clicks that land on a link
   * or a button inside the row are left alone rather than handled twice.
   */
  rowHref: (row: RosterRow) => string | null;
  expanded: ReadonlySet<string>;
  onToggle: (userId: string) => void;
  detail: (row: RosterRow) => ReactNode;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [sort, setSort] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const read = column.sortValue;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = read(a);
      const right = read(b);
      /* Unmeasured last, whichever way the arrow points. */
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      if (typeof left === "string" || typeof right === "string") {
        return factor * String(left).localeCompare(String(right));
      }
      return factor * (left - right);
    });
  }, [rows, columns, sort]);

  return (
    <div
      className={cn(
        "w-full min-w-0 overflow-x-auto rounded-[14px] border",
        LINE.hair,
      )}
    >
      <table
        className={cn(
          "w-full min-w-[1000px] border-collapse text-left",
          TYPE.body,
        )}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className={SURFACE.raised}>
          <tr>
            {columns.map((column, index) => {
              const active = sort?.key === column.key;
              const canSort =
                column.sortable === true && column.sortValue !== undefined;
              const next: SortDirection =
                active && sort?.direction === "asc" ? "desc" : "asc";
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={
                    active
                      ? sort?.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className={cn(
                    "border-b px-3 py-2.5 font-medium whitespace-nowrap",
                    LINE.hair,
                    TYPE.meta,
                    INK.muted,
                    /* Aligns the header over the name, not over the chevron. */
                    index === 0 ? "pl-[41px]" : undefined,
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSort({ key: column.key, direction: next })
                      }
                      aria-label={`${t(column.header)} — ${t(
                        next === "asc"
                          ? SHELL_EXTRA.sortAscending
                          : SHELL_EXTRA.sortDescending,
                      )}`}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded hover:text-b-fg",
                        column.align === "right"
                          ? "flex-row-reverse"
                          : undefined,
                        active ? INK.primary : undefined,
                        MOTION.base,
                      )}
                    >
                      <span>{t(column.header)}</span>
                      <SortCaret
                        direction={active ? (sort?.direction ?? null) : null}
                      />
                    </button>
                  ) : (
                    t(column.header)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => {
            const href = rowHref(row);
            const open = expanded.has(row.userId);
            const detailId = `roster-detail-${row.userId}`;
            return (
              <Fragment key={row.userId}>
                <tr
                  onClick={
                    href
                      ? (event) =>
                          followRow(event, href, (to) => router.push(to))
                      : undefined
                  }
                  className={cn(
                    index > 0 ? cn("border-t", LINE.hair) : undefined,
                    SURFACE.hover,
                    MOTION.base,
                    href ? "cursor-pointer" : undefined,
                  )}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-3",
                        columnIndex === 0 ? "align-top" : "align-middle",
                        column.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      {columnIndex === 0 ? (
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => onToggle(row.userId)}
                            aria-expanded={open}
                            aria-controls={detailId}
                            aria-label={`${t(EXTRA.moreNumbers)} — ${row.displayName}`}
                            className={cn(
                              "mt-0.5 grid size-5 shrink-0 cursor-pointer place-items-center",
                              "rounded-[6px] hover:bg-b-fg/10 hover:text-b-fg",
                              INK.muted,
                              MOTION.base,
                            )}
                          >
                            <Chevron open={open} />
                          </button>
                          <div className="min-w-0 flex-1">
                            {column.render(row)}
                          </div>
                        </div>
                      ) : (
                        column.render(row)
                      )}
                    </td>
                  ))}
                </tr>
                {/*
                  Always rendered, hidden rather than unmounted. The secondary
                  numbers left the grid; they did not leave the document.
                */}
                <tr id={detailId} hidden={!open} className={SURFACE.inset}>
                  <td colSpan={columns.length} className="px-3 py-3 pl-[41px]">
                    {detail(row)}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A click on a row body follows the row's link; a click on anything that is
 * already a control does not.
 *
 * Two guards, both for the same reason — a row-wide handler that fires on every
 * click is a trap. Selecting a learner's name to copy it must not navigate, the
 * chevron must expand rather than navigate, and a click that landed on the real
 * `<a>` in the first cell is already handled.
 */
function followRow(
  event: MouseEvent<HTMLTableRowElement>,
  href: string,
  go: (to: string) => void,
) {
  const target = event.target as Element | null;
  if (target?.closest("a, button, input, label, [role='button']")) return;
  if (window.getSelection()?.toString()) return;
  go(href);
}

function SortCaret({ direction }: { direction: SortDirection | null }) {
  return (
    <svg
      width="9"
      height="11"
      viewBox="0 0 9 11"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M4.5 0.8L7.5 4.2H1.5L4.5 0.8Z"
        fill="currentColor"
        opacity={direction === "asc" ? 1 : 0.28}
      />
      <path
        d="M4.5 10.2L1.5 6.8H7.5L4.5 10.2Z"
        fill="currentColor"
        opacity={direction === "desc" ? 1 : 0.28}
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={cn(open ? "rotate-90" : undefined, MOTION.transform)}
    >
      <path
        d="M4 2L8.5 6L4 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter bar                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Five statuses and a reset, as one segmented control with the class's own
 * counts on it.
 *
 * The first build drew six pills at the same weight as each other and as the
 * search field beside them, so the filter row read as six competing calls to
 * action. One bordered group with quiet segments reads as what it is: a set of
 * choices, of which one is currently taken.
 *
 * Still multi-select, and an empty selection still means «all» rather than
 * «none» — `aria-pressed` on real buttons rather than a `radiogroup`, because
 * «needs attention» and «inactive» together is a question a teacher asks.
 */
function StatusFilter({
  counts,
  total,
  selected,
  onToggle,
  onClear,
}: {
  counts: Record<LearnerStatus, number>;
  total: number;
  selected: readonly LearnerStatus[];
  onToggle: (status: LearnerStatus) => void;
  onClear: () => void;
}) {
  const { t } = useLocale();
  return (
    <div
      role="group"
      aria-label={t(EXTRA.filterByStatus)}
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-0.5 border p-1",
        LINE.edge,
        RADIUS.control,
        SURFACE.inset,
      )}
    >
      <FilterSegment
        label={t(EXTRA.filterAll)}
        count={total}
        pressed={selected.length === 0}
        onClick={onClear}
      />
      {FILTER_ORDER.map((status) => (
        <FilterSegment
          key={status}
          label={t(STATUS_LABEL[status])}
          count={counts[status]}
          pressed={selected.includes(status)}
          onClick={() => onToggle(status)}
        />
      ))}
    </div>
  );
}

function FilterSegment({
  label,
  count,
  pressed,
  onClick,
}: {
  label: string;
  count: number;
  pressed: boolean;
  onClick: () => void;
}) {
  /* An empty bucket stays visible and goes inert rather than disappearing: a
     filter row that changes length as the class changes is a filter row a
     teacher cannot build a habit on. */
  const empty = count === 0 && !pressed;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={empty}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 whitespace-nowrap",
        TYPE.meta,
        MOTION.base,
        pressed
          ? "bg-b-purple/12 font-medium text-b-purple"
          : empty
            ? cn("cursor-not-allowed", INK.muted)
            : cn(
                "cursor-pointer hover:bg-b-fg/[0.06] hover:text-b-fg",
                INK.muted,
              ),
      )}
    >
      {label}
      {/* `faint` is for a zero, where the absence of emphasis IS the
          information. A non-zero count is content and stays at the floor. */}
      <span
        className={cn(
          "tabular-nums",
          pressed ? "text-b-purple" : count === 0 ? INK.faint : INK.muted,
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The roster as CSV, with the note about what is in it standing beside it.
 *
 * A quiet text control in the band header, not a bordered button: exporting is
 * something a teacher does occasionally and deliberately, and the first build
 * gave it a 36px framed button at the top right of the page, where it outranked
 * the class it was exporting.
 *
 * The note stays visible. It is not fine print — a teacher exporting a file
 * about named children should be able to see, before they click, that Nova
 * transcripts and hidden tests are not in it — and that guarantee is structural
 * (the payload allowlist has no text key), so the sentence is one the product
 * can actually keep.
 */
function ExportCsv({ href }: { href: string }) {
  const { t } = useLocale();
  return (
    <div className="flex max-w-[38ch] flex-col items-start gap-1 sm:items-end">
      <a
        href={href}
        download
        className={cn(
          "-mx-1.5 inline-flex items-center gap-1.5 rounded-[7px] px-1.5 py-1",
          "hover:bg-b-fg/[0.06] hover:text-b-fg",
          TYPE.meta,
          INK.secondary,
          MOTION.base,
        )}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 2v8m0 0L4.75 6.75M8 10l3.25-3.25M2.5 13h11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t(TL.exportCsv)}
      </a>
      <p className={cn(TYPE.meta, INK.muted, "sm:text-right")}>
        {t(TL.exportNote)}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The table's shape while it loads.
 *
 * Deliberately NOT a set of zeroes: a skeleton that renders `0` in every numeric
 * column for half a second teaches a teacher to distrust the numbers that
 * replace it. `aria-busy` plus a live word carries it to a screen reader, which
 * a shimmer alone does not.
 */
function RosterSkeleton() {
  const { t } = useLocale();
  return (
    <div
      aria-busy="true"
      className={cn("rounded-[14px] border p-4", LINE.hair)}
    >
      <p className="sr-only" role="status">
        {t(TL.loading)}
      </p>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-[180px] animate-pulse rounded bg-b-fg/10" />
            <div className="h-4 w-[110px] animate-pulse rounded bg-b-fg/10" />
            <div className="h-4 flex-1 animate-pulse rounded bg-b-fg/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
