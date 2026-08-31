import type { Period } from "./period";

/**
 * The window a progress report covers.
 *
 * Server-side and UTC throughout, and both choices are load-bearing:
 *
 * - Server-side, because two phones in one classroom must agree about when the
 *   week started. Computed on the client they would not, and the same episode
 *   would fall in different weeks for two children sitting together.
 * - UTC, because a day boundary that follows the reader's timezone lets one
 *   episode land in two different weeks depending on who opens the page.
 *
 * `week` is Monday-anchored: a school week starts on Monday, and the JS
 * `getUTCDay()` convention (0 = Sunday) has to be rotated to say so.
 */

/** How far back the arrows may go. A year of history bounds the query. */
export const MAX_OFFSET = 52;

export interface ActivityWindow {
  from: Date;
  /** Exclusive. */
  to: Date;
  grain: "day" | "month";
  /** Every bucket key in the window, in order. 'YYYY-MM-DD' or 'YYYY-MM'. */
  buckets: string[];
}

/**
 * Offsets are backwards only, and bounded.
 *
 * Forward offsets are refused rather than clamped-and-served because there is
 * no data in the future: an empty chart labelled "next week" reads as a bug.
 */
export function clampOffset(raw: string | number | null | undefined): number {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(0, Math.max(-MAX_OFFSET, Math.trunc(n)));
}

export function windowFor(period: Period, offset: number, now: Date): ActivityWindow {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  if (period === "week") {
    const dow = (now.getUTCDay() + 6) % 7; // 0 = Monday
    const from = new Date(Date.UTC(y, m, d - dow + offset * 7));
    const to = new Date(from.getTime() + 7 * DAY);
    return { from, to, grain: "day", buckets: dayRange(from, 7) };
  }

  if (period === "month") {
    // Date.UTC normalises out-of-range months, so a negative offset in January
    // rolls into the previous year without any branch here.
    const from = new Date(Date.UTC(y, m + offset, 1));
    const to = new Date(Date.UTC(y, m + offset + 1, 1));
    const days = Math.round((to.getTime() - from.getTime()) / DAY);
    return { from, to, grain: "day", buckets: dayRange(from, days) };
  }

  const from = new Date(Date.UTC(y + offset, 0, 1));
  const to = new Date(Date.UTC(y + offset + 1, 0, 1));
  const buckets = Array.from(
    { length: 12 },
    (_, i) => `${from.getUTCFullYear()}-${String(i + 1).padStart(2, "0")}`,
  );
  return { from, to, grain: "month", buckets };
}

const DAY = 86_400_000;

/**
 * Days are stepped with `Date.UTC(y, m, d + i)` rather than by adding
 * milliseconds. UTC has no DST, so the arithmetic agrees either way today — but
 * a future move to local time would make millisecond stepping quietly skip or
 * repeat a day twice a year, and this is the function that would be wrong.
 */
function dayRange(from: Date, count: number): string[] {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const d = from.getUTCDate();
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(y, m, d + i)).toISOString().slice(0, 10),
  );
}
