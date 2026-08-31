import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dayMonthLong,
  dayMonthShort,
  dayRange,
  monthShort,
  monthYear,
  numericDate,
  weekdayShort,
} from "@schools/presentation/dates";

/**
 * Dates.
 *
 * The bug these guard against was invisible on Node and only appeared in the
 * browser: Chromium ships no CLDR data for `kk`, silently falls back to the
 * root locale, and renders «M08 24 – M08 30 2026» with an English weekday axis.
 * `resolvedOptions().locale` still reports "kk", so nothing throws.
 *
 * A test that called `Intl` would therefore have PASSED on Node while the
 * product was broken for every Kazakh-speaking learner. So the rule asserted
 * here is structural: the product must not ask `Intl` for Kazakh at all.
 */

const ROOT = join(import.meta.dirname, "../..");
const D = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));

describe("Kazakh dates", () => {
  it("names months in Kazakh, not as ICU identifiers", () => {
    expect(dayMonthShort("kk", D(2026, 7, 24))).toBe("24 там.");
    expect(dayMonthLong("kk", D(2026, 7, 24))).toBe("24 тамыз");
    expect(monthYear("kk", D(2026, 7, 24))).toBe("тамыз 2026");
    expect(monthShort("kk", 0)).toBe("қаң.");
    expect(monthShort("kk", 11)).toBe("жел.");
  });

  it("names weekdays in Kazakh, not in English", () => {
    // 2026-08-24 is a Monday.
    expect(weekdayShort("kk", D(2026, 7, 24))).toBe("Дс");
    expect(weekdayShort("kk", D(2026, 7, 30))).toBe("Жс");
  });

  it("never emits the root-locale fallback", () => {
    for (const m of [0, 5, 7, 11]) {
      expect(monthShort("kk", m)).not.toMatch(/^M\d/);
      expect(monthShort("ru", m)).not.toMatch(/^M\d/);
    }
  });
});

describe("Russian dates", () => {
  it("uses the genitive after a day number", () => {
    // «24 августа», not «24 август» — the first thing a reader notices.
    expect(dayMonthLong("ru", D(2026, 7, 24))).toBe("24 августа");
    expect(dayMonthLong("ru", D(2026, 0, 1))).toBe("1 января");
  });

  it("names weekdays Monday-first", () => {
    expect(weekdayShort("ru", D(2026, 7, 24))).toBe("Пн");
    expect(weekdayShort("ru", D(2026, 7, 30))).toBe("Вс");
  });
});

describe("ranges", () => {
  it("states the year once when the range does not cross one", () => {
    expect(dayRange("kk", D(2026, 7, 24), D(2026, 7, 30))).toBe("24 там. – 30 там. 2026");
  });

  it("states both years when it does", () => {
    expect(dayRange("ru", D(2026, 11, 28), D(2027, 0, 3))).toBe(
      "28 дек. 2026 – 3 янв. 2027",
    );
  });

  it("writes numeric dates day-first in both locales", () => {
    const d = new Date(2026, 7, 4);
    expect(numericDate("kk", d)).toBe("04.08.2026");
    expect(numericDate("ru", d)).toBe("04.08.2026");
  });
});

describe("the product does not ask Intl for Kazakh", () => {
  /* This is the assertion that actually prevents a regression. Chromium
     answers a `kk` request with root-locale output instead of throwing, so the
     only reliable guard is to keep the request from being made. */
  const FILES = [
    "src/components/brilliant/app/school-you.tsx",
    "src/components/brilliant/app/review-queue.tsx",
    /* The teacher panel moved to src/components/teacher/, where
       tests/teacher/language.test.ts scans every file rather than a named one. */
    "src/components/teacher/shell.tsx",
    "src/components/brilliant/legal/legal-doc.tsx",
  ];

  it.each(FILES)("%s formats dates through the product's own tables", (file) => {
    const src = readFileSync(join(ROOT, file), "utf8");
    expect(src).not.toMatch(/kk-KZ/);
    expect(src).not.toMatch(/Intl\.DateTimeFormat/);
    expect(src).not.toMatch(/toLocaleDateString|toLocaleTimeString|toLocaleString/);
  });
});
