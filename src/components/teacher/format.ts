import { cn } from "@/lib/utils";

/**
 * Number and tone formatting for the teacher command centre.
 *
 * Pure, no React, no locale. Everything here either returns a locale-free
 * numeral string or a class name — the *words* around a number always come from
 * `TL` / `EXTRA`, because a helper that returns «мин» has quietly become a
 * translation layer that no language test reflects over.
 *
 * The one rule every function keeps: **`null` in, `null` out.** Nothing in this
 * file substitutes a zero for an absent measurement. The caller renders
 * `TL.emptyNotMeasured` when it gets `null` back, and that is the whole point —
 * a learner who solved nothing and a learner nobody measured are different
 * facts, and only one of them is about the learner.
 */

/* -------------------------------------------------------------------------- */
/* Numbers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A minute count, as a numeral.
 *
 * Deliberately returns the bare number and no unit: the unit is
 * `TL.minutesShort`, which is a translated string, and burying it here would put
 * a visible word outside the catalogue. Values of 60 and above are still
 * rendered in minutes — a teacher comparing «45» against «125» wants one unit,
 * and «2 ч 5 мин» beside «45 мин» is two.
 *
 * Returns `null` for an unmeasured value, which is not the same as zero: nobody
 * practised is `0`, nobody was measured is `null`.
 */
export function minutes(n: number | null | undefined): string | null {
  if (n === null || n === undefined || !Number.isFinite(n) || n < 0) return null;
  return String(Math.round(n));
}

/**
 * A ratio, as a whole percentage.
 *
 * `null` when either side is missing **and** when the denominator is zero — 0/0
 * is not 0%, it is a question nobody has the evidence to answer. The caller is
 * expected to print the two counts beside whatever this returns; the contracts
 * ship the numerator and denominator with every share for exactly that reason.
 */
export function percent(
  value: number | null | undefined,
  denominator: number | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  if (denominator === null || denominator === undefined) return null;
  if (!Number.isFinite(value) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return `${Math.round((value / denominator) * 100)}%`;
}

/**
 * A share that already arrived as a 0–1 fraction (`independentShare` and its
 * kind), as a whole percentage. Same null discipline.
 */
export function share(fraction: number | null | undefined): string | null {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return null;
  return `${Math.round(fraction * 100)}%`;
}

/**
 * A signed delta, with a real minus sign rather than a hyphen.
 *
 * U+2212 lines up with the digits in a tabular-nums column; a hyphen does not,
 * and a column of deltas that jitters is a column a teacher stops reading.
 */
export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

/**
 * Whole days between an ISO timestamp and now.
 *
 * Floors, so "yesterday evening" from "this morning" is 0 rather than 1 — the
 * caller decides whether that reads as «сегодня». `null` for a learner who has
 * never appeared, which is the case the old panel could not render at all.
 */
export function relativeDays(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diff = now.getTime() - then;
  if (diff < 0) return 0;
  return Math.floor(diff / 86_400_000);
}

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The semantic vocabulary, and it is deliberately small.
 *
 * `lock` is the one worth naming: it means **not applicable or not measured**,
 * never "bad". A skill nobody has attempted is not a failing skill, and painting
 * it amber would put a judgement on an absence.
 *
 * Colour never travels alone anywhere in this surface — every tone below is
 * applied next to a word — because roughly one boy in twelve cannot separate the
 * green from the amber.
 */
export type Tone = "neutral" | "ok" | "warn" | "info" | "lock" | "accent" | "danger";

/** Ink only. For a numeral or a label that carries its meaning in the text. */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-b-fg",
  ok: "text-b-ok-edge",
  warn: "text-b-warn-icon",
  info: "text-b-blue",
  lock: "text-b-fg/45",
  accent: "text-b-purple",
  danger: "text-[var(--danger)]",
};

/** Border + wash + ink, for a pill or a bordered panel. */
export const TONE_CHIP: Record<Tone, string> = {
  neutral: "border-b-fg/15 bg-b-fg/5 text-b-fg/75",
  ok: "border-b-ok bg-b-ok-panel text-b-ok-edge",
  warn: "border-b-warn/50 bg-b-warn/10 text-b-warn-icon",
  info: "border-b-sched-edge bg-b-sched-fill text-b-fg/85",
  lock: "border-b-lock-edge bg-b-lock-fill text-b-fg/60",
  accent: "border-b-purple/40 bg-b-purple/10 text-b-purple",
  danger: "border-[var(--danger)] bg-b-fg/5 text-[var(--danger)]",
};

/** A solid fill, for a meter track or a legend swatch. */
export const TONE_FILL: Record<Tone, string> = {
  neutral: "bg-b-fg/40",
  ok: "bg-b-ok-progress",
  warn: "bg-b-warn-fill",
  info: "bg-b-chart",
  lock: "bg-b-fg/20",
  accent: "bg-b-purple",
  danger: "bg-[var(--danger)]",
};

/** `cn`-composed tone lookups, so a caller never indexes the maps by hand. */
export function toneText(tone: Tone = "neutral", ...extra: string[]): string {
  return cn(TONE_TEXT[tone], ...extra);
}

export function toneChip(tone: Tone = "neutral", ...extra: string[]): string {
  return cn(TONE_CHIP[tone], ...extra);
}

export function toneFill(tone: Tone = "neutral", ...extra: string[]): string {
  return cn(TONE_FILL[tone], ...extra);
}

/**
 * A count's ink.
 *
 * Zero is dimmed hard, because a dense table of counts is read by scanning for
 * what is *not* zero, and a column where every cell has equal weight defeats
 * that. `null` is dimmed the same way and rendered as a word, never as `0`.
 */
export function countTone(n: number | null, tone: Tone = "neutral"): string {
  if (n === null || n === 0) return "text-b-fg/25";
  return TONE_TEXT[tone];
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A y-axis ceiling divisible by four, so the four gridlines land on integers.
 *
 * Same function the learner chart uses (`school-you.tsx`), restated here rather
 * than exported across the two surfaces: it is four lines of arithmetic and a
 * shared import from a 900-line page component would be the wrong dependency.
 */
export function niceCeiling(peak: number): number {
  if (!Number.isFinite(peak) || peak <= 4) return 4;
  return Math.ceil(peak / 4) * 4;
}
