import type { Locale } from "@schools/curriculum/types";

/**
 * Dates, without trusting the browser to know Kazakh.
 *
 * ## Why this file exists
 *
 * `Intl.DateTimeFormat` is the right answer everywhere except here. Chromium
 * ships without CLDR data for `kk`, and instead of failing it falls back to the
 * root locale — which formats months as bare identifiers and weekdays in
 * English. Measured in the browser this product actually runs in:
 *
 *   new Intl.DateTimeFormat("kk-KZ", { day:"numeric", month:"short" })
 *     .format(2026-08-24)                       ->  "M08 24"
 *   new Intl.DateTimeFormat("kk-KZ", { weekday:"short" })
 *     .format(2026-08-24)                       ->  "Mon"
 *
 * `resolvedOptions().locale` reports `"kk"`, so nothing throws and nothing
 * warns — the progress page simply rendered «M08 24 – M08 30 2026» with an
 * English weekday axis to every Kazakh-speaking learner. Node's ICU is complete,
 * so it formatted correctly on the server and wrongly in the browser, which is
 * the worst possible way for this to fail: invisible in tests that run on Node.
 *
 * Kazakh month and weekday names are twelve and seven fixed strings. Spelling
 * them out is smaller than the bug.
 *
 * Russian data IS present in every engine, but it is written out here too. One
 * table means one behaviour on the server and in the browser, and it removes
 * the class of bug where two locales take two different code paths.
 */

/** Nominative — used when the month stands alone. */
const MONTHS_LONG: Record<Locale, readonly string[]> = {
  kk: [
    "қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым",
    "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан",
  ],
  ru: [
    "январь", "февраль", "март", "апрель", "май", "июнь",
    "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
  ],
};

/**
 * Russian needs the genitive after a day number — «24 августа», not
 * «24 август». Kazakh does not inflect here, so it reuses the nominative.
 */
const MONTHS_OF: Record<Locale, readonly string[]> = {
  kk: MONTHS_LONG.kk,
  ru: [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ],
};

const MONTHS_SHORT: Record<Locale, readonly string[]> = {
  kk: [
    "қаң.", "ақп.", "нау.", "сәу.", "мам.", "мау.",
    "шіл.", "там.", "қыр.", "қаз.", "қар.", "жел.",
  ],
  ru: [
    "янв.", "февр.", "мар.", "апр.", "мая", "июн.",
    "июл.", "авг.", "сент.", "окт.", "нояб.", "дек.",
  ],
};

/** Monday-first, matching the streak strip on the home rail. */
const WEEKDAYS_SHORT: Record<Locale, readonly string[]> = {
  kk: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

/** `Date.getUTCDay()` is Sunday-first; the tables above are Monday-first. */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

export function monthLong(loc: Locale, monthIndex: number): string {
  return MONTHS_LONG[loc][monthIndex] ?? "";
}

export function monthShort(loc: Locale, monthIndex: number): string {
  return MONTHS_SHORT[loc][monthIndex] ?? "";
}

export function weekdayShort(loc: Locale, date: Date): string {
  return WEEKDAYS_SHORT[loc][mondayIndex(date)] ?? "";
}

/** «24 там.» / «24 авг.» */
export function dayMonthShort(loc: Locale, date: Date): string {
  return `${date.getUTCDate()} ${monthShort(loc, date.getUTCMonth())}`;
}

/** «24 тамыз» / «24 августа» */
export function dayMonthLong(loc: Locale, date: Date): string {
  return `${date.getUTCDate()} ${MONTHS_OF[loc][date.getUTCMonth()]}`;
}

/** «тамыз 2026» / «август 2026» */
export function monthYear(loc: Locale, date: Date): string {
  return `${monthLong(loc, date.getUTCMonth())} ${date.getUTCFullYear()}`;
}

/**
 * «24 там. – 30 там. 2026»
 *
 * The year is stated once, at the end, because a range that crosses no year
 * boundary does not need it twice — and when it does cross one, both dates
 * carry their own.
 */
export function dayRange(loc: Locale, from: Date, to: Date): string {
  const sameYear = from.getUTCFullYear() === to.getUTCFullYear();
  if (sameYear) {
    return `${dayMonthShort(loc, from)} – ${dayMonthShort(loc, to)} ${to.getUTCFullYear()}`;
  }
  return (
    `${dayMonthShort(loc, from)} ${from.getUTCFullYear()} – ` +
    `${dayMonthShort(loc, to)} ${to.getUTCFullYear()}`
  );
}

/**
 * «24.08.2026» — a plain numeric date.
 *
 * Both locales write day-first with dots, so one form serves both and there is
 * nothing here for a missing locale to get wrong.
 */
export function numericDate(loc: Locale, date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}.${m}.${date.getFullYear()}`;
}

/** «24.08.2026, 14:05» — local time, for "last active" style stamps. */
export function numericDateTime(loc: Locale, date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${numericDate(loc, date)}, ${h}:${min}`;
}
