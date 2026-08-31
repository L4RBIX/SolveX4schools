/**
 * The teacher surface's own scale.
 *
 * ## Why this file exists
 *
 * The first build of this dashboard set type and ink inline at every call site.
 * It worked, and it produced `text-b-fg/40`, `/45`, `/50`, `/55`, `/60`, `/70`
 * and `/75` all carrying content, plus five different heading sizes for the same
 * rank. The UX audit's F3 and F4 are both symptoms of that: nothing was wrong
 * with any single choice, and there was no scale for them to be wrong against.
 *
 * These are string constants rather than `@theme` tokens deliberately. Tailwind
 * v4 generates utilities from `@theme`, and `globals.css` is shared with the
 * learner surface and the reverse-engineering baseline; a teacher-only type ramp
 * does not belong in the global token space. Composed here, they stay one import
 * away from every teacher component and nowhere else.
 *
 * ## The ink floor
 *
 * Nothing that carries content goes below `/55`. On the light theme
 * `text-b-fg/40` over `--color-sx-page` (#f5f3f1) is about 2.6:1 — under the
 * 4.5:1 the text it was being used for needs. `MUTED` is the floor for a real
 * sentence; `FAINT` is for a zero in a dense column, where the *absence* of
 * emphasis is the information and the value is repeated in the row's own label.
 */

/* -------------------------------------------------------------------------- */
/* Type                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Five ranks, and no more.
 *
 * `PAGE` appears once per route, in the shell. `SECTION` names a band.
 * `SUBSECTION` is for a panel inside one. `BODY` is every sentence a teacher
 * reads. `META` is the only place small caps are allowed, and even there it is
 * used for a metric's name, never for a sentence.
 */
export const TYPE = {
  /** The class name in the control bar. One per page. */
  page: "text-[22px] leading-[28px] font-semibold tracking-[-0.01em]",
  /** A band heading: «Назар аудару керек». */
  section: "text-[17px] leading-[24px] font-semibold tracking-[-0.005em]",
  /** A panel heading inside a band. */
  subsection: "text-[15px] leading-[20px] font-semibold",
  /** Every sentence. 14px, because this is a dense professional surface. */
  body: "text-[14px] leading-[20px]",
  /** A row title — a learner's name in a queue, a skill in a list. */
  rowTitle: "text-[15px] leading-[20px] font-medium",
  /** Supporting detail under a row title. */
  meta: "text-[13px] leading-[18px]",
  /** The only small-caps in the system. A metric's name, never a sentence. */
  label: "text-[11px] leading-[14px] font-semibold uppercase tracking-[0.06em]",
} as const;

/**
 * Numerals.
 *
 * Always `tabular-nums`: a column of counts that shifts as the digits change is
 * a column the eye cannot scan down. `hero` is the four headline figures;
 * `figure` is a number inside a row.
 */
export const NUM = {
  hero: "text-[30px] leading-[34px] font-semibold tabular-nums tracking-[-0.02em]",
  figure: "text-[15px] leading-[20px] font-medium tabular-nums",
  cell: "text-[14px] leading-[20px] tabular-nums",
} as const;

/* -------------------------------------------------------------------------- */
/* Ink                                                                        */
/* -------------------------------------------------------------------------- */

export const INK = {
  /** Anything a teacher is meant to read and act on. */
  primary: "text-b-fg",
  /** Supporting sentences, metadata, denominators. The floor for content. */
  secondary: "text-b-fg/70",
  /** Labels, window names, table headers. Still legible on both themes. */
  muted: "text-b-fg/55",
  /**
   * A zero in a dense column, or a value the row explicitly names as absent.
   *
   * Never the only carrier of a fact. The point of dimming a zero is that a
   * teacher scans a column for what is NOT zero.
   */
  faint: "text-b-fg/35",
} as const;

/* -------------------------------------------------------------------------- */
/* Surface                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Five layers, and a rule for when each one applies.
 *
 * The first build had two — page and inset — so a section, a table and the page
 * behind them were within a few percent of each other and the eye had nothing
 * to hold onto down a long screen. The fix is NOT a card per section: a page of
 * stacked bordered boxes is heavier than the flat one it replaces and it makes
 * every band look equally important. The fix is to raise the things a teacher
 * puts their hands on.
 *
 *   page      the ground. Sections sit directly on it, ruled apart, no fill.
 *   raised    a container of ROWS — a table, a queue, the control bar. One
 *             fill per container, never per row.
 *   inset     a well INSIDE something raised: a code sample, a quoted answer.
 *             Recessed rather than lifted, so it reads as content, not chrome.
 *   hover     the row under the cursor.
 *   selected  the row whose panel is open. Purple, because on this product
 *             purple is navigation and selection and nothing else — it must
 *             not be confused with amber (needs attention) or green (strong).
 *
 * `overlay` is the sixth and is a different thing: a surface that floats above
 * the page rather than being part of it, so it is the only one that carries a
 * shadow.
 */
export const SURFACE = {
  /** The page ground. Themed; never `bg-sx-bg`, which has no light arm. */
  page: "bg-sx-page",
  /** A container of rows: a table, a queue, the control bar. */
  raised: "bg-b-panel",
  /** A well inside a raised surface: quoted prose, a code sample. */
  inset: "bg-b-fg/[0.035]",
  /** Hover on an interactive row. Deliberately quiet. */
  hover: "hover:bg-b-fg/[0.045]",
  /** The row whose detail is currently open. */
  selected: "bg-b-purple/[0.09]",
  /** A panel floating above the page. The only surface with a shadow. */
  overlay: "bg-b-panel shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)]",
} as const;

export const LINE = {
  /** Between rows in a table. */
  hair: "border-b-fg/12",
  /** Around a panel, and between bands. */
  edge: "border-b-fg/15",
  /** The left spine on a selected row. Selection, not status. */
  selected: "border-b-purple",
} as const;

/* -------------------------------------------------------------------------- */
/* Rhythm                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One vertical rhythm, so a page does not alternate between 24px and 44px gaps
 * for the same rank of separation.
 */
export const GAP = {
  /** Between top-level bands. */
  band: "space-y-10",
  /** Between components inside a band. */
  block: "space-y-5",
  /** Between a heading and its content. */
  heading: "mt-4",
  /** Inside a row: the gap between a title and its metadata. */
  tight: "space-y-1",
} as const;

export const RADIUS = {
  panel: "rounded-[14px]",
  control: "rounded-[9px]",
  pill: "rounded-full",
} as const;

/**
 * Motion.
 *
 * 140ms is the whole vocabulary. Everything on this surface is a state change on
 * something already on screen — a row highlighting, a tab moving, a disclosure
 * opening — and none of it is a journey. `ease-out` because every one of them is
 * an arrival.
 *
 * `motion-reduce:transition-none` is on the token rather than left to each
 * caller: the global `prefers-reduced-motion` block in `solvex.css` only reaches
 * elements under `.sx-root`, which this surface is not.
 */
export const MOTION = {
  base: "transition-[background-color,color,border-color,opacity] duration-140 ease-out motion-reduce:transition-none",
  transform: "transition-transform duration-140 ease-out motion-reduce:transition-none",
} as const;

/**
 * The page grid.
 *
 * Wider than `b-shell` (1296px), which is sized for the learner's one-thing-at-
 * a-time surface. A class of thirty against forty-eight skills is a genuinely
 * wider problem, and at 1440 the old shell left the matrix scrolling inside a
 * container with 150px of unused page on either side.
 */
export const SHELL = "mx-auto w-full max-w-[1400px] px-5 sm:px-8";
