"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Localized } from "@schools/curriculum/types";
import type { Comparison, LearnerStatus } from "@schools/teacher/contracts";
import { TL, nOfM } from "@schools/teacher/labels";
import { EXTRA } from "@schools/teacher/labels-extra/shell";
import { EVIDENCE_LABEL, type EvidenceState } from "@schools/presentation/evidence";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { INK, LINE, MOTION, NUM, SURFACE, TYPE } from "./tokens";
import {
  countTone,
  niceCeiling,
  signed,
  toneChip,
  toneFill,
  toneText,
  type Tone,
} from "./format";

/**
 * The teacher command centre's primitive kit.
 *
 * Six pages are built on these, so the API is the contract and each export below
 * says what it is for. Three rules run through all of them and are worth stating
 * once rather than eleven times:
 *
 * 1. **`null` is a word, not a zero.** Every component that can receive a
 *    missing measurement renders `TL.emptyNotMeasured`. There is no path through
 *    this file that prints `0` for something nobody measured.
 * 2. **Colour never carries meaning alone.** Every tone is applied beside a
 *    word. A teacher who cannot separate green from amber loses nothing.
 * 3. **Nothing here holds a string.** Every visible word arrives as a
 *    `Localized` from `TL` or `EXTRA`, or as a `Localized` on the payload.
 */

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One band of the page: a heading, an optional sentence under it, an optional
 * control on the right, and the content.
 *
 * Separated from its neighbour by a **rule**, not by a card. A dashboard drawn
 * as a grid of bordered boxes spends its whole border budget on separation and
 * has none left for the two or three things that actually need a frame; this is
 * the construction `SettingsShell` uses and it is the one that reads as a
 * document rather than as a template.
 */
export function Section({
  title,
  description,
  action,
  children,
  className,
  level = 2,
  titleId,
}: {
  title: string;
  description?: string;
  /** A control that belongs to this section — a lens picker, an export link. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Heading rank.
   *
   * `2` on a page, where the shell owns the `<h1>`. `3` inside a drawer or a
   * detail panel that already has an `<h2>` of its own — the skills page's skill
   * drawer is the first caller, and a document whose outline jumps h2 → h2 → h2
   * inside a dialog is one a screen-reader user cannot navigate by heading.
   */
  level?: 2 | 3;
  /** Set when something else must reference this heading, e.g. `aria-labelledby`. */
  titleId?: string;
}) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <section className={cn("border-t border-b-fg/10 py-8 first:border-t-0 first:pt-0", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <Heading id={titleId} className="text-[18px] leading-6 font-bold">
            {title}
          </Heading>
          {description ? (
            <p className="mt-1.5 max-w-[68ch] text-[14px] leading-5 text-b-fg/55">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Headline numbers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * A row of headline numbers, ruled apart.
 *
 * The rules are a 1px gap over a tinted parent rather than borders on the
 * children: it produces a clean grid in both axes at every breakpoint without
 * any nth-child arithmetic, and — the point — it never turns a metric into a
 * card. `columns` is written out as literal class strings because Tailwind
 * cannot see a computed one.
 */
export function StatRow({
  columns = 4,
  children,
}: {
  columns?: 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
}) {
  const wide =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-3"
        : columns === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : columns === 5
            ? "sm:grid-cols-3 lg:grid-cols-5"
            : "sm:grid-cols-3 lg:grid-cols-6";
  return <div className={cn("grid grid-cols-2 gap-px bg-b-fg/10", wide)}>{children}</div>;
}

/**
 * A headline number with its label under it.
 *
 * `value: null` renders `TL.emptyNotMeasured` — never `0`, never an em dash, and
 * never a spinner masquerading as a measurement. `denominator` prints the count
 * the value is out of, because a share whose denominator is off screen is a
 * number a teacher cannot check: «67%» over three events is not a measurement.
 *
 * Not a bordered card. It sits inside `StatRow` and the rules do the separating.
 */
export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
  denominator,
}: {
  /** Already localised — callers resolve `TL.kpi…` themselves. */
  label: string;
  /** `null` means unmeasured and renders as a word. */
  value: number | string | null;
  /** A second line: a window, a `TrendDelta`, the counts behind a share. */
  sub?: ReactNode;
  tone?: Tone;
  /** What the value is out of. Rendered beside it, quietly. */
  denominator?: number | null;
}) {
  const { t } = useLocale();
  return (
    <div className={cn("min-w-0 px-4 py-4 sm:px-5", SURFACE.page)}>
      {/* Sentence case, not `b-eyebrow`. Caps at 12px in Cyrillic — with ә ғ қ ң
          ө ұ ү һ і — is slower to read, and when every label shouts the
          hierarchy is flat. The numeral carries the emphasis instead. */}
      <p className={cn(TYPE.meta, INK.muted)}>{label}</p>
      {value === null ? (
        <p className={cn("mt-1", TYPE.rowTitle, "leading-[34px]", INK.muted)}>
          {t(TL.emptyNotMeasured)}
        </p>
      ) : (
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className={cn(NUM.hero, toneText(tone))}>{value}</span>
          {denominator !== null && denominator !== undefined ? (
            <span className={cn(NUM.figure, INK.muted, "font-normal")}>/ {denominator}</span>
          ) : null}
        </p>
      )}
      {sub ? <div className={cn("mt-1", TYPE.meta, INK.secondary)}>{sub}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges, chips and dots                                                     */
/* -------------------------------------------------------------------------- */

const STATUS_TONE: Record<LearnerStatus, { label: Localized; tone: Tone }> = {
  /* `not_started` and `dormant` are absences, not faults. Amber on a child who
     has never signed in would be a judgement about a login problem. */
  not_started: { label: TL.statusNotStarted, tone: "lock" },
  dormant: { label: TL.statusDormant, tone: "lock" },
  needs_attention: { label: TL.statusNeedsAttention, tone: "warn" },
  ready_to_stretch: { label: TL.statusReadyToStretch, tone: "ok" },
  /* Neutral on purpose: most of a healthy class is here, and a wall of green
     makes the four learners who need something harder to find, not easier. */
  on_track: { label: TL.statusOnTrack, tone: "neutral" },
};

/** The one status a learner has. Always the word; the colour is the second cue. */
export function StatusBadge({ status }: { status: LearnerStatus }) {
  const { t } = useLocale();
  const spec = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[12px] leading-4 font-medium whitespace-nowrap",
        toneChip(spec.tone),
      )}
    >
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {t(spec.label)}
    </span>
  );
}

/**
 * A small pill. Anything short that needs a frame and a tone.
 *
 * `title` is for a longer explanation of the same fact — never for the fact
 * itself, because a tooltip is not readable on a phone or by a screen reader
 * that is not hovering.
 */
export function Chip({
  tone = "neutral",
  children,
  title,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "text-[12px] leading-4 font-medium",
        toneChip(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Evidence state on one skill.
 *
 * **Why the tones are defined here.** `EVIDENCE_TONE` in
 * `schools/presentation/evidence.ts` gives `not_started` and `learning` the
 * two unthemed white inks, at 30% and 60% opacity. Those were written for a surface
 * pinned to dark; on the light theme they are white on near-white — invisible.
 * The audit records that as H4. Importing it would reproduce the bug, so the
 * two are re-stated against `b-fg`, which the theme actually moves.
 *
 * The dot is `bg-current` over one of those ink classes, so the swatch and any
 * text beside it are guaranteed the same colour.
 *
 * A bare coloured bullet with no word is what the old panel rendered and it
 * fails WCAG 1.4.1. `showLabel={false}` therefore does not remove the label — it
 * moves it to `aria-label` and `title`.
 */
/* Exported for the class × skill matrix, which paints the same five states as
   SHAPES rather than dots — thirty columns of `EvidenceDot` would be thirty
   columns of identical bullets — and must take its ink from the same place so
   the grid and its legend cannot drift apart. */
export const EVIDENCE_TONE_THEMED: Record<EvidenceState, string> = {
  not_started: "text-b-fg/55",
  learning: "text-b-fg/60",
  practicing: "text-b-chart",
  independent_evidence: "text-b-green-2",
  /* Amber, never red: `needs_review` means "worth another look", not "failed". */
  needs_review: "text-b-warn-icon",
};

export function EvidenceDot({
  state,
  showLabel = true,
}: {
  state: EvidenceState;
  showLabel?: boolean;
}) {
  const { t } = useLocale();
  const label = t(EVIDENCE_LABEL[state]);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", EVIDENCE_TONE_THEMED[state])}
      title={showLabel ? undefined : label}
      aria-label={showLabel ? undefined : label}
      role={showLabel ? undefined : "img"}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" />
      {showLabel ? (
        <span className="text-[13px] leading-[18px] whitespace-nowrap">{label}</span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty states                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Why there is nothing here.
 *
 * A real sentence, always. Four zeroes and a blank chart is the shape a teacher
 * reads as "the system is broken" — and half the time they are right, so the
 * dashboard has to be able to tell the two apart out loud.
 */
export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  /** A single restrained glyph. Optional, and never decorative filler. */
  icon?: ReactNode;
}) {
  return (
    /* No dashed border. A dashed rectangle reads as a slot something failed to
       load into; most of these states are correct outcomes — nobody needs
       attention, the month has not opened — and should look composed. */
    <div className={cn("flex items-start gap-3 px-1 py-6", SURFACE.page)}>
      {icon ? <span className={cn("mt-0.5 shrink-0", INK.muted)}>{icon}</span> : null}
      <div className="min-w-0">
        <p className={cn(TYPE.rowTitle, INK.primary)}>{title}</p>
        {hint ? (
          <p className={cn("mt-1 max-w-[62ch]", TYPE.body, INK.secondary)}>{hint}</p>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Meter                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * «N of M required work», as a thin rule.
 *
 * The numbers are rendered, not just the bar: a 70%-full bar over an unstated
 * denominator is the exact shape the contracts refuse. `total === 0` is not
 * zero progress — it is nothing published to make progress on — so it paints no
 * fill and takes the lock tone.
 */
export function Meter({
  value,
  total,
  tone = "ok",
  label,
  showValue = true,
  className,
}: {
  value: number;
  total: number;
  tone?: Tone;
  /** Accessible name. Defaults to `EXTRA.progressOf`. */
  label?: string;
  /**
   * Print «N/M» beside the bar. Default on.
   *
   * Turned off only where the same two counts are already rendered next to the
   * meter — the overview's required-work tile prints them as its headline
   * number — so the bar adds shape without repeating the figures. The counts
   * stay in `aria-valuenow`/`aria-valuemax` either way, so nothing is lost to a
   * screen reader.
   */
  showValue?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const nothingToDo = total <= 0;
  const pct = nothingToDo ? 0 : Math.min(100, Math.round((value / total) * 100));
  const name = label ?? t(EXTRA.progressOf);
  return (
    <div className={cn("flex min-w-[92px] items-center gap-2.5", className)}>
      <div
        role="progressbar"
        aria-label={name}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={Math.max(total, 0)}
        /* 6px, not 1.5px. A hairline meter is a decoration; this one is read. */
        className="h-[6px] min-w-[48px] flex-1 overflow-hidden rounded-full bg-b-fg/12"
      >
        {nothingToDo ? null : (
          <div className={cn("h-full rounded-full", toneFill(tone))} style={{ width: `${pct}%` }} />
        )}
      </div>
      {showValue ? (
        <span
          className={cn(
            "shrink-0 text-[13px] leading-[18px] tabular-nums",
            nothingToDo ? INK.faint : INK.secondary,
          )}
        >
          {nOfM(value, total)}
        </span>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Trend                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The threshold past which a percentage stops informing anybody.
 *
 * **100%.** A percentage exists to normalise a change so it can be compared to
 * another change, and that works while a reader has intuition for the figure.
 * At «+1970%» — which is what a real class produced going from 88 practice
 * minutes in a quiet first week to 1822 in a full one — nobody has any, and the
 * number reads as a data-corruption bug rather than as the true and rather good
 * news it is. Past a doubling, the two counts and their difference say more
 * than the ratio does.
 *
 * The rule is deterministic and applied in one place: `|changePct| < 100` shows
 * the percentage, everything else shows the absolute difference and moves the
 * percentage into the accessible name where a screen reader still reaches it.
 * Nothing is capped, rounded away or hidden — the underlying figures are
 * printed either way, which is the part a teacher can check.
 */
const PCT_LEGIBLE_LIMIT = 100;

/**
 * This window against the one before it.
 *
 * **The counts are always shown; the percentage only when it helps.**
 * `changePct: null` already means the previous window was too small to compare
 * against, and the honest rendering of that is silence — «+40%» on a base of
 * five is noise that reads as a trend. `PCT_LEGIBLE_LIMIT` handles the opposite
 * failure: a ratio so large it reads as a fault.
 *
 * `direction` exists because more is not always better: a rise in assisted
 * solves is not a green number. Left unset, the delta is tinted neutral and the
 * teacher supplies the judgement.
 */
export function TrendDelta({
  comparison,
  direction = "neutral",
  unit,
}: {
  comparison: Comparison;
  direction?: "higher_is_better" | "lower_is_better" | "neutral";
  /** The metric's unit, appended to the absolute difference — «мин», «задач». */
  unit?: string;
}) {
  const { t } = useLocale();
  const { current, previous, changePct } = comparison;
  const rising = current > previous;
  const flat = current === previous;

  const tone: Tone =
    direction === "neutral" || flat
      ? "neutral"
      : (direction === "higher_is_better") === rising
        ? "ok"
        : "warn";

  const legible = changePct !== null && Math.abs(changePct) < PCT_LEGIBLE_LIMIT;
  const difference = current - previous;
  const pctText = changePct === null ? null : `${signed(Math.round(changePct))}%`;

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      title={t(EXTRA.comparedToPrevious)}
    >
      <span className={cn("tabular-nums", INK.muted)}>{previous}</span>
      <span aria-hidden="true" className={INK.muted}>
        →
      </span>
      <span className={cn("tabular-nums", INK.secondary)}>{current}</span>
      {flat || changePct === null ? null : legible ? (
        <span className={cn("tabular-nums font-medium", toneText(tone))}>{pctText}</span>
      ) : (
        /* Beyond a doubling the difference is the readable quantity. The ratio
           survives in the accessible name so nothing is lost to a reader who
           wants it. */
        <span className={cn("tabular-nums font-medium", toneText(tone))}>
          {signed(difference)}
          {unit ? <span className="ml-0.5 font-normal">{unit}</span> : null}
        </span>
      )}
      <span className="sr-only">
        {t(EXTRA.comparedToPrevious)}
        {pctText && !legible ? `, ${pctText}` : ""}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

/** Find a learner by name. Controlled; the caller owns the filtering. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Already localised. Defaults to `TL.searchStudent`. */
  placeholder?: string;
  className?: string;
}) {
  const { t } = useLocale();
  const name = placeholder ?? t(TL.searchStudent);
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-b-fg/55"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={name}
        placeholder={name}
        className={cn(
          "h-10 w-full rounded-[10px] border border-b-fg/15 bg-sx-page pr-9 pl-9",
          "text-[14px] leading-5 text-b-fg placeholder:text-b-fg/55",
          "transition-colors hover:border-b-fg/25",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t(EXTRA.clearSearch)}
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-b-fg/55 transition-colors hover:bg-b-fg/10 hover:text-b-fg"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 2L10 10M10 2L2 10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Table                                                                      */
/* -------------------------------------------------------------------------- */

export type SortDirection = "asc" | "desc";

export interface DataColumn<T> {
  /** Stable id. Used for the sort state and as the React key. */
  key: string;
  header: Localized;
  /** Numeric columns go right. Everything else reads better left. */
  align?: "left" | "right";
  /** Sorting needs `sortValue` as well — a `ReactNode` cannot be compared. */
  sortable?: boolean;
  /**
   * What to sort on. `null` sorts LAST in both directions: an unmeasured
   * learner is not the smallest one, and burying them at the bottom of a
   * descending sort would hide exactly the row that needs a teacher.
   */
  sortValue?: (row: T) => number | string | null;
  render: (row: T) => ReactNode;
  /** A CSS width for the column, e.g. `"180px"` or `"22%"`. */
  width?: string;
}

/**
 * The dense table every list page uses.
 *
 * Real `<table>` semantics with `<th scope>`, `aria-sort` on the sorted column,
 * and a caption — a screen reader in a grid of `<div>`s cannot tell a teacher
 * which column a number is in.
 *
 * Zebra striping is deliberately absent: alternating fills at this density read
 * as noise and fight the tone colours that actually mean something. Rows are
 * separated by a hairline instead.
 *
 * The wrapper scrolls horizontally so a wide table never pushes the page into a
 * horizontal scroll. Pass `maxHeight` for a long table and the header becomes a
 * genuinely sticky one inside that scroll box.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  initialSort,
  empty,
  maxHeight,
  rowHref,
  rowSelected,
  className,
}: {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Screen-reader caption. Required — an unnamed table is a wall of numbers. */
  caption: string;
  initialSort?: { key: string; direction: SortDirection };
  /** What to show when there are no rows. Defaults to a real sentence. */
  empty?: ReactNode;
  /** Height cap in px. Set it and the header sticks while the body scrolls. */
  maxHeight?: number;
  /**
   * Where a row leads, or `null` for a row that leads nowhere.
   *
   * Added for the roster, where a learner with no subject — one who has never
   * opened anything — has no detail page but must still appear. Returning `null`
   * removes both the pointer cursor and the handler, so an unclickable row does
   * not advertise itself as clickable.
   *
   * **This is a mouse convenience and nothing more.** A `<tr>` cannot be
   * focused or activated from a keyboard, so the caller MUST also render a real
   * `<a>` inside one of the cells; that link is the accessible path and this
   * only saves a teacher aiming at it. Clicks that land on a link or a button
   * inside the row are left alone rather than handled twice.
   */
  rowHref?: (row: T) => string | null;
  /**
   * Which row's detail panel is open, if any.
   *
   * Selection is drawn in purple — on this product purple is navigation and
   * selection and carries no judgement — so it can never be confused with the
   * amber that means a learner needs attention or the green that means their
   * work is strong. It is a left spine plus a tint rather than a tint alone,
   * because a tint alone is colour carrying meaning by itself.
   */
  rowSelected?: (row: T) => boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(
    initialSort ?? null,
  );

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

  if (rows.length === 0) {
    return <>{empty ?? <EmptyState title={t(TL.noData)} hint={t(TL.emptyNoActivity)} />}</>;
  }

  return (
    <div
      /* The raised layer. A table is a container of rows a teacher puts their
         hands on, so it lifts off the page ground; sections around it stay
         flat, because a page of stacked cards makes every band look equally
         important. One fill for the whole table, never one per row. */
      className={cn(
        "w-full min-w-0 overflow-x-auto rounded-[14px] border",
        LINE.hair,
        SURFACE.raised,
        className,
      )}
      style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
    >
      <table className="w-full min-w-max border-collapse text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead
          className={cn(
            "bg-b-panel text-b-fg/55",
            maxHeight ? "sticky top-0 z-10" : undefined,
          )}
        >
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const canSort = column.sortable === true && column.sortValue !== undefined;
              const next: SortDirection =
                active && sort?.direction === "asc" ? "desc" : "asc";
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={
                    active ? (sort?.direction === "asc" ? "ascending" : "descending") : undefined
                  }
                  /* Sentence case, not small caps. Twelve-pixel capitals in
                     Cyrillic — and Kazakh adds ә ғ қ ң ө ұ ү һ і — are slower
                     to read than the same words set normally, and a header row
                     is read on every glance down the table. */
                  className={cn(
                    "border-b px-3 py-2.5 whitespace-nowrap",
                    LINE.hair,
                    TYPE.meta,
                    "font-semibold",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {canSort ? (
                    <button
                      type="button"
                      onClick={() => setSort({ key: column.key, direction: next })}
                      aria-label={`${t(column.header)} — ${t(
                        next === "asc" ? EXTRA.sortAscending : EXTRA.sortDescending,
                      )}`}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-b-fg",
                        column.align === "right" ? "flex-row-reverse" : undefined,
                        active ? "text-b-fg" : undefined,
                      )}
                    >
                      <span>{t(column.header)}</span>
                      <SortCaret direction={active ? (sort?.direction ?? null) : null} />
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
          {sorted.map((row) => {
            const href = rowHref ? rowHref(row) : null;
            const selected = rowSelected ? rowSelected(row) : false;
            return (
              <tr
                key={rowKey(row)}
                onClick={href ? (event) => followRow(event, href, (to) => router.push(to)) : undefined}
                aria-selected={rowSelected ? selected : undefined}
                className={cn(
                  "border-t border-b-fg/10",
                  MOTION.base,
                  selected ? SURFACE.selected : SURFACE.hover,
                  href ? "cursor-pointer" : undefined,
                )}
              >
                {columns.map((column, index) => (
                  <td
                    key={column.key}
                    className={cn(
                      "relative px-3 py-2.5 align-middle",
                      column.align === "right" ? "text-right tabular-nums" : "text-left",
                    )}
                  >
                    {/* The spine, on the first cell only. Selection has to be
                        legible without colour vision, and a 2px rule at the
                        row's edge is the same device the attention queue uses
                        for status. */}
                    {selected && index === 0 ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-[2px] bg-b-purple"
                      />
                    ) : null}
                    {column.render(row)}
                  </td>
                ))}
              </tr>
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
 * click is a trap. Selecting a learner's name to copy it must not navigate, and
 * a click that landed on the real `<a>` in the first cell is already handled.
 */
function followRow(event: MouseEvent<HTMLTableRowElement>, href: string, go: (to: string) => void) {
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

/**
 * A count inside a table cell.
 *
 * Zero is dimmed hard so a column is scanned for what is *not* zero, and `null`
 * becomes `TL.emptyNotMeasured` rather than a zero that would claim a
 * measurement nobody made.
 */
export function Num({
  value,
  tone = "neutral",
  suffix,
}: {
  value: number | null;
  tone?: Tone;
  /** A unit from the catalogue, e.g. `t(TL.minutesShort)`. Never a literal. */
  suffix?: string;
}) {
  const { t } = useLocale();
  if (value === null) {
    return <span className="text-[13px] text-b-fg/35">{t(TL.emptyNotMeasured)}</span>;
  }
  return (
    <span className={cn("tabular-nums", countTone(value, tone))}>
      {value}
      {suffix ? <span className="ml-0.5 text-[12px] text-b-fg/55">{suffix}</span> : null}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Chart                                                                      */
/* -------------------------------------------------------------------------- */

const PLOT_HEIGHT = 161;

export interface ChartBucket {
  /** Stable key — the bucket id from `PeriodDescriptor.buckets`. */
  key: string;
  /** The axis tick, already localised through `@schools/presentation/dates`. */
  label: string;
  independent: number;
  assisted: number;
}

export interface ChartSeries {
  independent: string;
  assisted: string;
}

/**
 * Independent over assisted, stacked, per bucket.
 *
 * Hand-rolled DOM and CSS — there is no charting library in this repo and none
 * is being added. Construction copied from the learner page's `SolvedChart`, so
 * the two surfaces plot the same quantity the same way: gridlines at 0, ¼, ½, ¾
 * and 1 of a ceiling derived from the data, a flex row of equal columns, and a
 * **2px neutral stub** on an empty bucket rather than nothing at all, because a
 * column with no base reads as a rendering failure.
 *
 * The stub is neutral rather than green on purpose: a green sliver on a day
 * nobody studied is a bar chart claiming a fraction of a solved task.
 *
 * The plot is `aria-hidden` and the same numbers are exposed as a real
 * `<table>` — a screen reader gets the data, not a description of a picture.
 */
export function BarChart({
  buckets,
  series,
  height = PLOT_HEIGHT,
  caption,
}: {
  buckets: readonly ChartBucket[];
  /** Legend labels. Defaults to `EXTRA.chartIndependent` / `chartAssisted`. */
  series?: ChartSeries;
  height?: number;
  /** Caption of the screen-reader table. Defaults to `EXTRA.chartCaption`. */
  caption?: string;
}) {
  const { t } = useLocale();
  const names: ChartSeries = series ?? {
    independent: t(EXTRA.chartIndependent),
    assisted: t(EXTRA.chartAssisted),
  };
  const title = caption ?? t(EXTRA.chartCaption);

  if (buckets.length === 0) {
    return <EmptyState title={t(TL.noData)} hint={t(TL.emptyNoActivity)} />;
  }

  const peak = Math.max(0, ...buckets.map((b) => b.independent + b.assisted));
  const yMax = niceCeiling(peak);
  const ticks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-2" style={{ gridTemplateColumns: "auto 1fr" }} aria-hidden="true">
        {/* y axis */}
        <div className="relative text-[12px] leading-[18px]" style={{ height }}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute translate-y-[9px] text-b-fg/55 tabular-nums"
              style={{ top: height - (tick / yMax) * height - 18 }}
            >
              {tick}
            </span>
          ))}
        </div>

        {/* plot */}
        <div className="min-w-px">
          <div className="relative" style={{ height }}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute w-full border-t border-b-fg/10"
                style={{ top: height - (tick / yMax) * height }}
              />
            ))}
            <div className="absolute inset-0 flex items-end justify-between gap-px">
              {buckets.map((b) => {
                const empty = b.independent + b.assisted === 0;
                return (
                  <div key={b.key} className="flex min-w-px flex-1 flex-col justify-end">
                    <div
                      className="mx-auto w-full max-w-[44px] rounded-t bg-b-chart"
                      style={{ height: (b.assisted / yMax) * height }}
                    />
                    <div
                      className={cn(
                        "mx-auto w-full max-w-[44px] bg-b-green-2",
                        b.assisted === 0 && "rounded-t",
                      )}
                      style={{ height: (b.independent / yMax) * height }}
                    />
                    {empty ? (
                      <div className="mx-auto h-0.5 w-full max-w-[44px] rounded-t bg-b-fg/15" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex">
            {buckets.map((b) => (
              <span
                key={b.key}
                className="min-w-px flex-1 overflow-hidden text-center text-[12px] leading-[18px] text-ellipsis whitespace-nowrap text-b-fg/55"
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The stack means nothing without this. */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-b-fg/60">
        <LegendKey className="bg-b-green-2" label={names.independent} />
        <LegendKey className="bg-b-chart" label={names.assisted} />
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">{t(EXTRA.chartBucket)}</th>
            <th scope="col">{names.independent}</th>
            <th scope="col">{names.assisted}</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.key}>
              <th scope="row">{b.label}</th>
              <td>{b.independent}</td>
              <td>{b.assisted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One legend swatch. Exported: the class-skill and lesson pages reuse it. */
export function LegendKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-3 shrink-0 rounded-sm", className)} aria-hidden="true" />
      {label}
    </span>
  );
}


/* -------------------------------------------------------------------------- */
/* Disclosure                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The sentence a teacher needs once.
 *
 * ## What this replaces
 *
 * Every band on the first build opened with two lines of explanatory prose —
 * how a window is computed, why `not_started` is not a bad result, what the
 * assistance outcome window covers. All of it true, all of it worth having
 * written, and all of it re-rendered at 14px on every visit forever. The audit
 * counted roughly 50px of documentation above the information on six routes.
 *
 * So the caveats that change how a number is READ stay in the layout, and the
 * ones that explain how it was BUILT move in here.
 *
 * ## Why `<details>` and not a tooltip
 *
 * A tooltip is not reachable on a touch screen, not readable by a screen reader
 * that is not hovering, and not printable. `<details>` is keyboard-operable,
 * announced as a disclosure, open-able on any input, and needs no JavaScript at
 * all — so it survives the page being server-rendered.
 */
export function Hint({
  label,
  children,
  className,
}: {
  /** The control's text. A question, short: «Бұл қалай есептеледі?» */
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group inline-block", className)}>
      <summary
        className={cn(
          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-[7px] px-1.5 py-1",
          "-mx-1.5 hover:bg-b-fg/[0.06]",
          TYPE.meta,
          INK.muted,
          MOTION.base,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[15px] shrink-0 place-items-center rounded-full border",
            "border-b-fg/30 text-[10px] leading-none font-semibold",
          )}
        >
          ?
        </span>
        {label}
      </summary>
      <div
        className={cn(
          "mt-2 max-w-[68ch] border-l-2 border-b-fg/15 py-0.5 pl-3",
          TYPE.body,
          INK.secondary,
        )}
      >
        {children}
      </div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* Distribution                                                               */
/* -------------------------------------------------------------------------- */

export interface DistributionSlice {
  key: string;
  label: string;
  value: number;
  tone: Tone;
}

/**
 * A small population, counted exactly.
 *
 * A full-width 4px stacked bar with four labels underneath is precise and
 * unreadable at a glance — the assessment page had one, and reading «19 / 1 / 0
 * / 0» off it required following four colours to four captions. This puts the
 * count first, at figure weight, with a proportional bar beside it that does the
 * comparing.
 *
 * Zero rows are KEPT. «Awaiting review 0» is a fact a teacher needs; dropping
 * empty rows would make the list's length depend on the data and stop it being
 * scannable in the same shape every time.
 */
export function Distribution({
  slices,
  total,
  caption,
}: {
  slices: readonly DistributionSlice[];
  /** The denominator. Usually the roster; stated rather than summed silently. */
  total: number;
  caption?: string;
}) {
  return (
    <div>
      <ul className="flex flex-col gap-2">
        {slices.map((slice) => {
          const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
          return (
            <li key={slice.key} className="flex items-center gap-3">
              {/* `title` because the label truncates: «Ждёт проверки человека» does
                  not fit 168px in Russian, and truncated text a reader cannot
                  recover is worse than a wrapped row. */}
              <span
                title={slice.label}
                className={cn("w-[132px] shrink-0 truncate sm:w-[196px]", TYPE.body, INK.secondary)}
              >
                {slice.label}
              </span>
              <span
                className={cn(
                  "w-[38px] shrink-0 text-right",
                  NUM.figure,
                  slice.value === 0 ? INK.faint : INK.primary,
                )}
              >
                {slice.value}
              </span>
              <span
                aria-hidden="true"
                className="h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-b-fg/10"
              >
                {slice.value > 0 ? (
                  <span
                    className={cn("block h-full rounded-full", toneFill(slice.tone))}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {caption ? <p className={cn("mt-3", TYPE.meta, INK.muted)}>{caption}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The attention row                                                          */
/* -------------------------------------------------------------------------- */

/**
 * One learner who needs something, and what to do about it.
 *
 * ## The signature element of this surface
 *
 * The first build rendered each of these as a bordered card containing a
 * full-width tinted panel for the recommendation. Five in a column read as a
 * stack of incident logs — the frame around every row competed with the row, and
 * the tinted box competed with the reason it was explaining.
 *
 * This replaces both with a 2px spine in the status tone. The colour is on the
 * left edge, where the eye picks it up while scanning the names, and nothing is
 * boxed. The recommendation keeps its own line, indented under an arrow, at
 * metadata weight — present, clearly secondary, and impossible to mistake for
 * the evidence above it.
 *
 * ## The reading order it enforces
 *
 * WHO (name, 15px medium) → WHAT (status, as a word) → WHY (the finding's own
 * sentence, in body ink) → CONTEXT (skill, when, muted) → WHAT TO DO (indented,
 * after the arrow). That is the order a teacher asks the questions in, and the
 * layout does not let a page author reorder it.
 */
export function SpineRow({
  tone = "warn",
  title,
  status,
  children,
  href,
  action,
}: {
  tone?: Tone;
  /** The learner's name. */
  title: ReactNode;
  /** The status badge. */
  status?: ReactNode;
  /** The findings. */
  children: ReactNode;
  /** Makes the whole row a link target. */
  href?: string;
  /** A trailing control, right-aligned on wide viewports. */
  action?: ReactNode;
}) {
  return (
    <li
      className={cn(
        "relative py-4 pl-4",
        SURFACE.hover,
        MOTION.base,
        href ? "cursor-pointer" : undefined,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-[2px] rounded-full",
          toneFill(tone === "neutral" ? "lock" : tone),
        )}
      />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={cn(TYPE.rowTitle, INK.primary)}>{title}</span>
          {status}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </li>
  );
}

/**
 * One finding inside a `SpineRow`.
 *
 * `reason` is the finding's own localised sentence and takes body ink, because
 * it is the thing being claimed. `context` is the skill and the date. `action`
 * is the deterministic recommendation, and it is indented behind an arrow
 * rather than boxed: a filled panel per finding is what made the first build
 * look like a log.
 */
export function Finding({
  reason,
  context,
  action,
  evidence,
}: {
  reason: ReactNode;
  context?: ReactNode;
  action?: ReactNode;
  /** The «show the evidence» disclosure, when the finding is auditable. */
  evidence?: ReactNode;
}) {
  return (
    <div>
      <p className={cn(TYPE.body, INK.primary)}>{reason}</p>
      {context ? <p className={cn("mt-0.5", TYPE.meta, INK.muted)}>{context}</p> : null}
      {action ? (
        <p className={cn("mt-1.5 flex gap-1.5", TYPE.meta, INK.secondary)}>
          <span aria-hidden="true" className={INK.muted}>
            →
          </span>
          <span>{action}</span>
        </p>
      ) : null}
      {evidence ? <div className="mt-1.5">{evidence}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Side panel                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A panel that slides in over the page to show one record in full.
 *
 * ## Why a native `<dialog>`
 *
 * Because `showModal()` gives, for free and correctly, the four things a
 * hand-rolled overlay gets wrong: focus moves into the panel, focus cannot
 * leave it while it is open, Escape closes it, and everything behind it is
 * inert to both the pointer and the screen reader. A `div` with
 * `role="dialog"` would need all four written by hand, and the one that always
 * gets skipped is the last.
 *
 * `close` is driven by the element's own `close` event rather than by each
 * dismissal path calling the callback, so Escape, the button and a click on the
 * backdrop all converge on one place and cannot drift apart.
 *
 * ## Why it is not a full-screen dialog
 *
 * A teacher marking three explanations is comparing them against the class they
 * can still see. The panel takes the right 520px on a laptop and the whole
 * width below 640, which is the honest breakpoint: at 375 there is no "beside".
 *
 * ## Motion
 *
 * The panel slides from the edge it is anchored to, at the surface's one
 * duration, and `motion-reduce` drops it to a fade. Nothing else animates —
 * the content inside is prose a teacher is about to read, and staggering it in
 * would delay the only thing they opened this for.
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** The record's own name — a learner's name, not "Details". */
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const ref = useRef<HTMLDialogElement | null>(null);
  /*
   * One frame behind `open`, and that is the whole animation.
   *
   * A `<dialog>` goes from `display:none` to `display:block`, and a CSS
   * transition cannot run across that — which is why overlays usually reach for
   * a `@keyframes`. This surface cannot add one: `globals.css` carries the
   * keyframe table and it is shared with two other workstreams. So the slide is
   * driven by a second render instead. `showModal()` paints the panel already
   * off-screen; `requestAnimationFrame` then flips this flag, the transform
   * transitions to zero, and `MOTION.transform` carries the reduced-motion
   * guarantee the same way it does everywhere else on this surface.
   */
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* `open` is the caller's intent; `el.open` is the DOM's state. Comparing
       them means a re-render for any other reason never re-opens a dialog the
       user just dismissed, and never calls showModal() on an open one — which
       throws. */
    if (open && !el.open) {
      el.showModal();
      const frame = requestAnimationFrame(() => setSettled(true));
      return () => cancelAnimationFrame(frame);
    }
    /* Closing does NOT reset `settled` here. `el.close()` fires the element's
       own `close` event, and the handler below resets it — which means Escape,
       the button, a click on the backdrop and the parent clearing its state all
       converge on one line instead of four that can drift. It also keeps this
       effect free of a synchronous setState, which cascades renders. */
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => {
        setSettled(false);
        onClose();
      }}
      /* The backdrop is part of the dialog's own box, so a click that lands on
         the element itself — rather than on the panel inside it — is a click
         outside. This is the standard way to make `::backdrop` dismissible
         without a second overlay element to keep in sync. */
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
      aria-label={title}
      className={cn(
        "m-0 ml-auto h-full max-h-none w-full max-w-[min(560px,100vw)] p-0",
        /* 45% is the low end of the 40–60% a scrim needs to isolate the panel;
           the page behind stays legible as context, which is the point of a
           drawer rather than a full-screen page. */
        "backdrop:bg-black/45",
        SURFACE.overlay,
        INK.primary,
        MOTION.transform,
        settled ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-full flex-col">
        <header
          className={cn(
            "flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6",
            LINE.hair,
          )}
        >
          <div className="min-w-0">
            <h2 className={cn(TYPE.section, INK.primary)}>{title}</h2>
            {subtitle ? <div className="mt-1">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={t(EXTRA.closePanel)}
            className={cn(
              "-mr-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-[9px]",
              INK.muted,
              SURFACE.hover,
              MOTION.base,
              "hover:text-b-fg",
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Quoted prose                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A learner's own words, rendered as what they are.
 *
 * An inset well rather than a raised card: this is CONTENT inside a panel, not
 * another piece of chrome sitting on it. `whitespace-pre-wrap` because a
 * fourteen-year-old's four-part answer has line breaks in it and collapsing
 * them silently reformats their work. The measure is capped at 68ch for the
 * same reason every other body text on this surface is.
 *
 * Never truncated and never scrolled inside its own box. It is short — the
 * column is capped at 1000 characters by migration 0016's sibling constraint —
 * and a teacher reading it should not have to open a second thing.
 */
export function QuotedResponse({ children }: { children: ReactNode }) {
  return (
    <blockquote
      className={cn(
        "max-w-[68ch] rounded-[10px] px-4 py-3 whitespace-pre-wrap",
        SURFACE.inset,
        TYPE.body,
        INK.primary,
      )}
    >
      {children}
    </blockquote>
  );
}
