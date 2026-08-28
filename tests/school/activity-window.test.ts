import { describe, it, expect } from "vitest";
import {
  clampOffset,
  MAX_OFFSET,
  windowFor,
} from "@schools/lib/activity-window";
import { isPeriod } from "@schools/lib/period";

/**
 * The window arithmetic behind `/you`.
 *
 * This is the part of the progress page that can be wrong without looking
 * wrong: a chart that renders beautifully over the wrong seven days still says
 * a learner did nothing. Every case below is a boundary the calendar actually
 * has — a Sunday, a January, a leap February — rather than a happy path.
 */

const utc = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("clampOffset", () => {
  it("refuses the future", () => {
    // Not clamped-and-served: an empty chart labelled "next week" reads as a bug.
    expect(clampOffset(3)).toBe(0);
    expect(clampOffset("1")).toBe(0);
  });

  it("bounds how far back a learner can walk", () => {
    expect(clampOffset(-1)).toBe(-1);
    expect(clampOffset(-MAX_OFFSET)).toBe(-MAX_OFFSET);
    expect(clampOffset(-999)).toBe(-MAX_OFFSET);
  });

  it("treats junk as the current window", () => {
    expect(clampOffset(null)).toBe(0);
    expect(clampOffset(undefined)).toBe(0);
    expect(clampOffset("not-a-number")).toBe(0);
    expect(clampOffset("NaN")).toBe(0);
    expect(clampOffset(Infinity)).toBe(0);
  });

  it("truncates rather than rounds", () => {
    expect(clampOffset(-1.9)).toBe(-1);
  });
});

describe("windowFor — week", () => {
  it("anchors on Monday, not Sunday", () => {
    // 2026-08-27 is a Thursday.
    const w = windowFor("week", 0, utc("2026-08-27"));
    expect(w.from.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(w.buckets[0]).toBe("2026-08-24");
    expect(w.buckets).toHaveLength(7);
    expect(w.buckets[6]).toBe("2026-08-30");
  });

  it("puts a Sunday in the week that just ended, not the one starting", () => {
    // The JS convention is 0 = Sunday. Rotating it wrong moves every Sunday
    // into the following week, which shows a learner an empty chart on the one
    // day of the week they are most likely to be looking at it.
    const w = windowFor("week", 0, utc("2026-08-30")); // a Sunday
    expect(w.from.toISOString().slice(0, 10)).toBe("2026-08-24");
    expect(w.buckets[6]).toBe("2026-08-30");
  });

  it("puts a Monday at the start of its own week", () => {
    const w = windowFor("week", 0, utc("2026-08-24"));
    expect(w.buckets[0]).toBe("2026-08-24");
  });

  it("steps back a whole week per offset, across a month boundary", () => {
    const w = windowFor("week", -1, utc("2026-09-02"));
    expect(w.buckets[0]).toBe("2026-08-24");
    expect(w.buckets[6]).toBe("2026-08-30");
  });

  it("steps back across a year boundary", () => {
    const w = windowFor("week", -1, utc("2027-01-06"));
    expect(w.buckets[0]).toBe("2026-12-28");
  });

  it("has an exclusive upper bound one day past the last bucket", () => {
    const w = windowFor("week", 0, utc("2026-08-27"));
    expect(w.to.toISOString().slice(0, 10)).toBe("2026-08-31");
  });
});

describe("windowFor — month", () => {
  it("covers exactly the calendar month", () => {
    const w = windowFor("month", 0, utc("2026-08-27"));
    expect(w.buckets[0]).toBe("2026-08-01");
    expect(w.buckets).toHaveLength(31);
    expect(w.buckets.at(-1)).toBe("2026-08-31");
  });

  it("knows February is short", () => {
    const w = windowFor("month", 0, utc("2026-02-10"));
    expect(w.buckets).toHaveLength(28);
  });

  it("knows a leap February is one day longer", () => {
    const w = windowFor("month", 0, utc("2028-02-10"));
    expect(w.buckets).toHaveLength(29);
    expect(w.buckets.at(-1)).toBe("2028-02-29");
  });

  it("rolls into the previous year in January", () => {
    const w = windowFor("month", -1, utc("2027-01-15"));
    expect(w.buckets[0]).toBe("2026-12-01");
    expect(w.buckets).toHaveLength(31);
  });

  it("walks back a full year without drifting", () => {
    const w = windowFor("month", -12, utc("2026-08-27"));
    expect(w.buckets[0]).toBe("2025-08-01");
  });

  it("never emits a day outside its own month", () => {
    for (let m = 0; m < 12; m++) {
      const w = windowFor("month", 0, new Date(Date.UTC(2026, m, 15)));
      const prefix = w.buckets[0].slice(0, 7);
      expect(w.buckets.every((b) => b.startsWith(prefix))).toBe(true);
    }
  });
});

describe("windowFor — year", () => {
  it("buckets by month, not by day", () => {
    const w = windowFor("year", 0, utc("2026-08-27"));
    expect(w.grain).toBe("month");
    expect(w.buckets).toHaveLength(12);
    expect(w.buckets[0]).toBe("2026-01");
    expect(w.buckets[11]).toBe("2026-12");
  });

  it("zero-pads the month so buckets sort lexically", () => {
    // The SQL side groups on `to_char(..., 'YYYY-MM')`, which pads. A bucket
    // list that did not would silently match nothing for January to September.
    const w = windowFor("year", 0, utc("2026-08-27"));
    expect(w.buckets[8]).toBe("2026-09");
    expect([...w.buckets].sort()).toEqual(w.buckets);
  });

  it("steps back a calendar year", () => {
    const w = windowFor("year", -1, utc("2026-08-27"));
    expect(w.from.toISOString().slice(0, 10)).toBe("2025-01-01");
    expect(w.to.toISOString().slice(0, 10)).toBe("2026-01-01");
  });
});

describe("window invariants", () => {
  it("every bucket falls inside [from, to)", () => {
    for (const period of ["week", "month", "year"] as const) {
      for (const offset of [0, -1, -7, -MAX_OFFSET]) {
        const w = windowFor(period, offset, utc("2026-08-27"));
        for (const b of w.buckets) {
          const t = new Date(`${b.length === 7 ? `${b}-01` : b}T00:00:00Z`).getTime();
          expect(t).toBeGreaterThanOrEqual(w.from.getTime());
          expect(t).toBeLessThan(w.to.getTime());
        }
      }
    }
  });

  it("`to` is exclusive — consecutive windows abut without overlapping", () => {
    const older = windowFor("week", -1, utc("2026-08-27"));
    const newer = windowFor("week", 0, utc("2026-08-27"));
    expect(older.to.getTime()).toBe(newer.from.getTime());
  });
});

describe("isPeriod", () => {
  it("accepts only the three real windows", () => {
    expect(isPeriod("week")).toBe(true);
    expect(isPeriod("month")).toBe(true);
    expect(isPeriod("year")).toBe(true);
    // Falls through to the default rather than reaching the query.
    expect(isPeriod("decade")).toBe(false);
    expect(isPeriod("")).toBe(false);
    expect(isPeriod(null)).toBe(false);
    expect(isPeriod(7)).toBe(false);
  });
});
