import type { Localized } from "@schools/curriculum/types";

/**
 * The month identity registry.
 *
 * ONE place that says what a month LOOKS like. It is the sibling of
 * `illustrations.ts` — same shape, same discipline: a `Record` keyed 1–9, pure
 * data, no React, no database, no import of anything that renders. A month can
 * be recoloured without touching a component, and a component can be rewritten
 * without touching a colour.
 *
 * ## The finding this file is built around: colour cannot encode nine months
 *
 * The nine accents below were measured, not eyeballed. Across all 36 pairs, in
 * both arms, the closest two months are September and January at **9.7 ΔE2000**
 * — comfortably distinguishable side by side. Simulate tritanopia (Viénot) and
 * the same palette collapses: the closest pair falls to **2.0 ΔE** in the dark
 * arm (September/December) and **2.4 ΔE** in the light arm (October/April).
 * Below roughly 2.3 ΔE two colours are the same colour to the eye looking at
 * them.
 *
 * Nine hues on one wheel cannot be made colour-blind-safe. That is arithmetic,
 * not a palette that needs more work. So colour here REINFORCES an identity it
 * does not carry, and the identity is carried jointly by three things a
 * learner can read without seeing hue at all:
 *
 *   1. the month's own artwork — `MONTH_ART` in `illustrations.ts`, nine
 *      different drawings, already shipping;
 *   2. the month NUMERAL, which the product already prints as `1. Қыркүйек`;
 *   3. the `glyph` below — a distinct SILHOUETTE per month, which is why it is
 *      a required field on this interface and not an optional one.
 *
 * The codebase already reached this conclusion twice and wrote it down both
 * times: `globals.css` ("Every verdict also carries an icon and a word") and
 * `sx-milestone.tsx` ("a purple disc alone does not survive a colour-vision
 * difference"). This is the same rule applied to the nine-month year.
 *
 * ## Why the hues collide with verdict hues, and why that is safe
 *
 * March is green and May is gold, and green already means `accepted` while
 * amber already means `partial`. Nine months spread over one wheel cannot avoid
 * three reserved hues without bunching, and bunching is what makes the palette
 * unreadable in the first place.
 *
 * The separation is CONTEXTUAL instead, and it is enforced by a test
 * (`tests/presentation/month-theme.test.ts`): a month accent may only reach a
 * month-identity surface — the board, the deck card, the milestone — and never
 * a surface that reports a verdict. Nothing under `src/components/brilliant/
 * lesson/` may reference `--sx-month-accent`, and the verdict tokens keep their
 * meanings untouched. A learner never sees a green that might mean March on the
 * same element as a green that means "accepted".
 *
 * League tiers are independent for the same reason and by the same rule: this
 * file does not import `schools/leagues/tiers.ts` and that file does not import
 * this one. October being orange must not make a tier orange.
 *
 * ## Why the values are hex inside `light-dark()`, and not tokens
 *
 * `globals.css` authors ~82 colours as `light-dark(<light>, <dark>)` hex pairs,
 * so these are written the same way and assembled by `monthThemeVars()` into a
 * handful of scoped custom properties on the board's own root. They are
 * deliberately NOT in the global `@theme` block — that is `tiers.ts`'s
 * precedent, and for the same reason: nine more `--color-*` entries are nine
 * more colours every unrelated surface can reach for, and only the month
 * surfaces may use these.
 *
 * ## Measured contrast
 *
 * Every light accent clears 4.5:1 against the light page (`#f5f3f1`) — lowest
 * is December at 4.65 — so an accent used as TEXT is legible. Every dark accent
 * clears 9.3:1 against the dark page (`#141414`). `onAccent` is the ink that
 * goes ON a filled accent: white on the light arm (≥5.15:1) and `#141414` on
 * the dark arm (≥9.38:1). Those floors are asserted, not asserted-by-comment.
 */

/**
 * A shape, not a colour.
 *
 * The whole point of this field: it is what still tells September from December
 * when hue has stopped working. Drawn on a `0 0 24 24` viewBox, centred on
 * (12,12), as a single filled path so any consumer can render it with one
 * `<path d>` and `fill="currentColor"`.
 *
 * `id` is the silhouette's name. It exists so a test and a browser check can
 * assert WHICH mark is on screen without diffing path strings, and so a data
 * attribute can carry it.
 */
export interface MonthGlyph {
  readonly id: string;
  readonly path: string;
}

export interface MonthTheme {
  /** 1–9, September to May. The stored identity; everything else is presentation. */
  readonly index: number;
  /**
   * The month's accent, per theme arm. Hex, assembled into `light-dark()` by
   * `monthThemeVars()`.
   *
   * Reinforcement only. Nothing in the product may depend on a learner telling
   * two of these apart — see the header.
   */
  readonly accent: { readonly light: string; readonly dark: string };
  /** Ink for text or a mark placed ON `accent`. Measured, not guessed. */
  readonly onAccent: { readonly light: string; readonly dark: string };
  /** The non-colour discriminator. Mandatory. See `MonthGlyph`. */
  readonly glyph: MonthGlyph;
  /**
   * The calendar month, in both languages.
   *
   * A duplicate of the curriculum's own `monthName`, and deliberately so: a
   * surface that holds only an index (a legend, a thumbnail's accessible name)
   * must be able to say what the glyph means without loading the manifest. The
   * duplication is safe because it is ASSERTED equal to the manifest for all
   * nine months, so a rename in the curriculum fails this file's test rather
   * than drifting quietly.
   */
  readonly name: Localized;
}

/* ---- the glyphs ---------------------------------------------------------
   Nine silhouettes, chosen so no two share an outline at 14px: round, angular,
   orthogonal, radial and pointed marks rather than nine variations on a
   polygon. A hexagon was rejected for reading as a circle at that size. */

const DISC: MonthGlyph = { id: "disc", path: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" };
const TRIANGLE: MonthGlyph = { id: "triangle", path: "M12 2.6 21.8 20.4H2.2z" };
const SQUARE: MonthGlyph = { id: "square", path: "M3.6 3.6h16.8v16.8H3.6z" };
const CROSS: MonthGlyph = {
  id: "cross",
  path: "M9.6 2.2h4.8v7.4h7.4v4.8h-7.4v7.4H9.6v-7.4H2.2V9.6h7.4z",
};
const ASTERISK: MonthGlyph = {
  id: "asterisk",
  path: "M12.00 2.00L13.45 9.49L20.66 7.00L14.90 12.00L20.66 17.00L13.45 14.51L12.00 22.00L10.55 14.51L3.34 17.00L9.10 12.00L3.34 7.00L10.55 9.49Z",
};
const CHEVRON: MonthGlyph = {
  id: "chevron",
  path: "M12 3.6 22 13.6l-3.4 3.4L12 10.4 5.4 17 2 13.6z",
};
const DIAMOND: MonthGlyph = { id: "diamond", path: "M12 2 22 12 12 22 2 12z" };
const DROPLET: MonthGlyph = {
  id: "droplet",
  path: "M12 2c4.6 5.3 7 8.8 7 11.7A7 7 0 0 1 5 13.7C5 10.8 7.4 7.3 12 2z",
};
const STAR: MonthGlyph = {
  id: "star",
  path: "M12.00 2.00L14.53 8.52L21.51 8.91L16.09 13.33L17.88 20.09L12.00 16.30L6.12 20.09L7.91 13.33L2.49 8.91L9.47 8.52Z",
};

/**
 * The nine months.
 *
 * Hues walk the wheel in large steps rather than in order — September blue,
 * October orange, November violet — because the pair a learner most often sees
 * together is a month and the one after it, and on the deck's thumbnail rail
 * they are literally adjacent. Every consecutive pair clears 20 ΔE2000, against
 * a global floor of 9.7; the tightest neighbours are December and January at
 * 24.7, which is the price of keeping the seasons in the right order. The light
 * arm is a mid-dark saturated tone (oklch L .50) so it can be used as ink on
 * the warm off-white page; the dark arm is a bright one (L .82) so it reads on
 * `#141414`. That is the same two-arm shape `--color-b-purple` already has.
 */
export const MONTH_THEME: Record<number, MonthTheme> = {
  1: {
    index: 1,
    accent: { light: "#00739b", dark: "#3ed8ff" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: DISC,
    name: { kk: "Қыркүйек", ru: "Сентябрь" },
  },
  2: {
    index: 2,
    accent: { light: "#9f4600", dark: "#ffab6a" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: TRIANGLE,
    name: { kk: "Қазан", ru: "Октябрь" },
  },
  3: {
    index: 3,
    accent: { light: "#5d53b1", dark: "#bbb7ff" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: SQUARE,
    name: { kk: "Қараша", ru: "Ноябрь" },
  },
  4: {
    index: 4,
    accent: { light: "#007a7d", dark: "#25dfdf" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: CROSS,
    name: { kk: "Желтоқсан", ru: "Декабрь" },
  },
  5: {
    index: 5,
    accent: { light: "#0065b1", dark: "#7dcaff" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: ASTERISK,
    name: { kk: "Қаңтар", ru: "Январь" },
  },
  6: {
    index: 6,
    accent: { light: "#8f3e8a", dark: "#f5a3ee" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: CHEVRON,
    name: { kk: "Ақпан", ru: "Февраль" },
  },
  7: {
    index: 7,
    accent: { light: "#007932", dark: "#7fdd95" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: DIAMOND,
    name: { kk: "Наурыз", ru: "Март" },
  },
  8: {
    index: 8,
    accent: { light: "#a6383c", dark: "#ff9f9c" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: DROPLET,
    name: { kk: "Сәуір", ru: "Апрель" },
  },
  9: {
    index: 9,
    accent: { light: "#7d5f00", dark: "#dfc351" },
    onAccent: { light: "#ffffff", dark: "#141414" },
    glyph: STAR,
    name: { kk: "Мамыр", ru: "Май" },
  },
};

/**
 * The theme used when a surface has no month — the reverse-engineering baseline
 * at `/brilliant/*`, and any future surface that is course-level rather than
 * month-level.
 *
 * It is the product's existing purple and a neutral glyph, so an unthemed board
 * renders exactly as it does today rather than as month 1 by accident. Index 0
 * is not a month and never will be, which is what makes it a safe sentinel.
 */
export const NEUTRAL_THEME: MonthTheme = {
  index: 0,
  accent: { light: "#6d3fd4", dark: "#9d62ff" },
  onAccent: { light: "#ffffff", dark: "#141414" },
  glyph: DISC,
  name: { kk: "Курс", ru: "Курс" },
};

/**
 * Resolve a month index to its identity.
 *
 * Mirrors `monthArt()`: an out-of-range index falls back rather than returning
 * `undefined`, because the failure mode of a bare index here is
 * `undefined.accent` inside a React render — a blank page for a learner —
 * rather than a caught error.
 */
export function monthTheme(monthIndex: number): MonthTheme {
  return MONTH_THEME[monthIndex] ?? NEUTRAL_THEME;
}

/**
 * The custom properties a themed surface sets on its own root.
 *
 * Scoped, not global. Everything downstream reads
 * `var(--sx-month-accent, <today's literal>)`, so a surface that never sets
 * these keeps its current colour exactly — which is how the `/brilliant`
 * measurement baseline survives this change untouched.
 *
 * The three pedestal channels are derived here rather than stored, so a month's
 * disc cannot drift out of tune with its own accent: the reference's own purple
 * set is `#7E43E0` rim / `#9D62FF` facet / `#C19CFF` face, i.e. the rim mixed
 * ~22% and ~52% toward white, and those are the ratios reproduced below.
 *
 * They are written as `var(--sx-month-accent)` rather than by substituting the
 * `light-dark()` expression into each `color-mix()`, so the pair is authored
 * once. Custom properties resolve by cascade, not by declaration order, so all
 * five landing in one inline `style` object is well-defined.
 */
export function monthThemeVars(theme: MonthTheme): Record<string, string> {
  return {
    "--sx-month-accent": `light-dark(${theme.accent.light}, ${theme.accent.dark})`,
    "--sx-month-on-accent": `light-dark(${theme.onAccent.light}, ${theme.onAccent.dark})`,
    "--sx-month-rim": "var(--sx-month-accent)",
    "--sx-month-facet": "color-mix(in oklab, var(--sx-month-accent) 78%, #ffffff)",
    "--sx-month-face": "color-mix(in oklab, var(--sx-month-accent) 48%, #ffffff)",
  };
}

/**
 * The month a deck card stands for, or `null` when the card is not a month.
 *
 * `monthToDeckCourse` mints `month-<index>` ids and nothing else in the deck
 * does, so the id is the only month identity that reaches `CourseDeck` — which
 * is fed a plain `DeckCourse[]` on purpose, so the renderer stays independent
 * of the curriculum. Parsing it here rather than inside the component keeps
 * that one piece of shared knowledge in the same file as the themes it selects.
 *
 * Returns `null`, not the neutral theme, so a caller can tell "this card has no
 * month" from "this card is month 0".
 */
export function monthThemeFromDeckId(id: string): MonthTheme | null {
  const m = /^month-(\d+)$/.exec(id);
  if (!m) return null;
  const index = Number(m[1]);
  return MONTH_THEME[index] ?? null;
}
