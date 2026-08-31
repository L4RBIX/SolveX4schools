import { describe, it, expect } from "vitest";
import {
  COMPETITION_TIMEZONE,
  currentWeek,
  isClosed,
  previousWeek,
  weekIdForAward,
  weekIdOf,
} from "@schools/leagues/week";

/**
 * The competition week.
 *
 * The clock is a parameter everywhere, so these are ordinary pure-function
 * tests with no fake-timer machinery — which is the reason the codebase threads
 * `now: Date` from the route boundary rather than calling `Date.now()` inside.
 *
 * The Almaty assertions are the load-bearing ones. They pin the DECISION
 * recorded in `week.ts`: that the product's existing UTC Monday boundary is
 * being reused because, measured, it lands at 05:00 in the country the pilot is
 * in. If Kazakhstan ever moves off UTC+5, these fail and name the thing to
 * reconsider — which is the whole reason to write them down.
 */

/* Parts rather than a formatted string: ICU versions disagree about whether a
   comma separates the weekday from the time, and this test is about the hour,
   not about ICU. */
const almaty = (d: Date) => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: COMPETITION_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("weekday")} ${get("hour")}:${get("minute")}`;
};

describe("what the boundary means in the country the pilot is in", () => {
  it("rolls over at 05:00 Almaty on Monday — after any study session, before school", () => {
    const w = currentWeek(new Date("2026-09-09T12:00:00Z"));
    expect(almaty(w.startsAt)).toBe("Mon 05:00");
  });

  it("ends the instant the next one starts, so no work falls between two weeks", () => {
    const w = currentWeek(new Date("2026-09-09T12:00:00Z"));
    const next = currentWeek(new Date("2026-09-16T12:00:00Z"));
    expect(w.endsAt.getTime()).toBe(next.startsAt.getTime());
  });
});

describe("boundary attribution", () => {
  const week = (iso: string) => currentWeek(new Date(iso)).weekId;

  it("Sunday 23:59:59 UTC and Monday 00:00:00 UTC are different weeks", () => {
    expect(week("2026-09-06T23:59:59Z")).not.toBe(week("2026-09-07T00:00:00Z"));
  });

  it("Monday 00:00:00 and 00:00:01 are the same week", () => {
    expect(week("2026-09-07T00:00:00Z")).toBe(week("2026-09-07T00:00:01Z"));
  });

  it("the whole school week lands in one week id", () => {
    const ids = [
      "2026-09-07T03:00:00Z", // Mon 08:00 Almaty
      "2026-09-09T09:00:00Z", // Wed 14:00
      "2026-09-11T15:00:00Z", // Fri 20:00
      "2026-09-13T18:00:00Z", // Sun 23:00
    ].map(week);
    expect(new Set(ids).size).toBe(1);
  });

  it("attributes an award from the SERVER clock, never the client's", () => {
    /* `weekIdForAward` takes `received_at`. A browser claiming an occurred_at
       from last week cannot reach this function — the route never passes one. */
    expect(weekIdForAward(new Date("2026-09-09T12:00:00Z"))).toBe("2026-W37");
  });
});

describe("ISO week identity", () => {
  it("pads so ids sort lexicographically, which is what settlement compares on", () => {
    const ids = ["2026-01-05", "2026-03-09", "2026-11-09"].map((d) =>
      weekIdOf(new Date(`${d}T00:00:00Z`)),
    );
    expect(ids).toEqual(["2026-W02", "2026-W11", "2026-W46"]);
    expect([...ids].sort()).toEqual(ids);
  });

  it("sorts correctly across a year boundary", () => {
    const dec = weekIdOf(new Date("2026-12-21T00:00:00Z"));
    const jan = weekIdOf(new Date("2027-01-04T00:00:00Z"));
    expect(dec < jan).toBe(true);
  });

  it("puts a week straddling New Year under the year owning its Thursday", () => {
    // Mon 2026-12-28 → the Thursday is 2026-12-31, so it is still 2026.
    expect(weekIdOf(new Date("2026-12-28T00:00:00Z"))).toBe("2026-W53");
  });
});

describe("closure", () => {
  const w = currentWeek(new Date("2026-09-09T12:00:00Z"));

  it("is open one millisecond before it ends", () => {
    expect(isClosed(w, new Date(w.endsAt.getTime() - 1))).toBe(false);
  });

  it("is closed at exactly its end, matching the half-open window everywhere else", () => {
    expect(isClosed(w, w.endsAt)).toBe(true);
  });

  it("previousWeek is the one that just closed", () => {
    expect(previousWeek(new Date("2026-09-16T12:00:00Z")).weekId).toBe(w.weekId);
  });
});

describe("the browser's timezone cannot change the answer", () => {
  it("gives the same week id whatever TZ the process is in", () => {
    const at = new Date("2026-09-07T02:00:00Z"); // Mon 07:00 Almaty
    const before = process.env.TZ;
    const seen = new Set<string>();
    for (const tz of ["UTC", "Asia/Almaty", "America/New_York", "Pacific/Kiritimati"]) {
      process.env.TZ = tz;
      seen.add(currentWeek(at).weekId);
    }
    process.env.TZ = before;
    expect(seen.size).toBe(1);
  });
});
