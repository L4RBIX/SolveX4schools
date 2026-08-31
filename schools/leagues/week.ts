import type { ActivityWindow } from "@schools/lib/activity-window";
import { windowFor } from "@schools/lib/activity-window";

/**
 * The competition week.
 *
 * ## There is one definition of "this week" and this is not a second one
 *
 * `windowFor(period, offset, now)` in `schools/lib/activity-window.ts` is the
 * product's only week, and three separate places say it must stay that way:
 * that file's own header ("two phones in one classroom must agree about when
 * the week started"), `schools/teacher/period.ts` which delegates to it rather
 * than redefining it, and `docs/teacher/TEACHER_METRICS.md`.
 *
 * This module CALLS it. It adds an identifier and a settlement boundary; it does
 * not add arithmetic. A fork would put five hours of every Sunday evening into
 * the competition's week but last week's progress chart, on two cards of the
 * same screen, and the learner would be right to say the product was lying on
 * one of them.
 *
 * ## Why UTC is the right anchor for a school in Almaty
 *
 * The brief this was built from recommends anchoring the competition to
 * `Asia/Almaty` and warns against "casually" using server UTC midnight. Using it
 * here is not casual — it is what the boundary was measured to mean:
 *
 *     UTC week starts  Mon 00:00Z   ->  Almaty  Mon 05:00
 *     UTC week ends    Sun 23:59Z   ->  Almaty  Mon 04:59
 *
 * Kazakhstan is UTC+5 with no DST — the country unified onto a single zone in
 * March 2024, retiring the old +5/+6 split. So the existing boundary already
 * rolls over at five in the morning, local: after any plausible study session
 * and roughly three hours before the school day. There is no hour at which a
 * learner is realistically working when the week silently changes underneath
 * them.
 *
 * The alternative — moving `windowFor` onto a tz identifier — reaches `/you`,
 * the home rail, the teacher console, the leaderboard, four SQL strings that
 * bake `at time zone 'UTC'` in as a literal, and every existing test's expected
 * bucket keys. That is a large, risky change to buy a boundary that is already
 * correct in practice.
 *
 * `COMPETITION_TIMEZONE` below records the intent so this stays a DECISION
 * rather than an accident, and `tests/leagues/week.test.ts` pins the Almaty
 * meaning of the boundary. If Kazakhstan ever moves, that test fails and names
 * the thing to reconsider, which is the point of writing it down.
 */

/**
 * The timezone the competition is FOR.
 *
 * Documentation and test fixture, deliberately not wired into the arithmetic —
 * see the header. Written as the IANA identifier rather than as `+5` because a
 * fixed offset bakes in an assumption a government decree breaks silently.
 */
export const COMPETITION_TIMEZONE = "Asia/Almaty";

/** `2026-W37`. Sorts lexicographically, which is why it is not `37/2026`. */
export type LeagueWeekId = string;

const WEEK_MS = 7 * 86_400_000;

/**
 * ISO-8601 week identity for the Monday a window starts on.
 *
 * ISO rather than "week 1 is the first Monday of September", and the difference
 * matters: `PROGRAMME_START_UTC` in `schools/teacher/period.ts` is a hardcoded
 * academic anchor with no equivalent in the curriculum model, and deriving a
 * competition week number from it would give the teacher console and the league
 * two different opinions about which week is week 1 the moment either moved. ISO
 * weeks are defined by the calendar and belong to nobody.
 */
export function weekIdOf(windowStart: Date): LeagueWeekId {
  /* ISO-8601: the week containing the Thursday determines the year, which is
     what makes 29 December and 2 January land in the same week when they should.
     `windowStart` is already a Monday, so Thursday is +3 days. */
  const thursday = new Date(windowStart.getTime() + 3 * 86_400_000);
  const year = thursday.getUTCFullYear();

  const jan4 = new Date(Date.UTC(year, 0, 4));
  /* Monday of the week containing 4 January IS week 1 by definition. */
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const week1Monday = new Date(jan4.getTime() - jan4Dow * 86_400_000);

  const week = Math.round((windowStart.getTime() - week1Monday.getTime()) / WEEK_MS) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export interface LeagueWeek {
  weekId: LeagueWeekId;
  /** Inclusive. */
  startsAt: Date;
  /** EXCLUSIVE, matching every other window in the product. */
  endsAt: Date;
}

function fromWindow(w: ActivityWindow): LeagueWeek {
  return { weekId: weekIdOf(w.from), startsAt: w.from, endsAt: w.to };
}

/**
 * The week `now` falls in.
 *
 * `now` is a parameter and never `Date.now()` read inside. That is the
 * codebase's clock convention — threaded from the route boundary into pure
 * functions — and it is the only reason a week-boundary test can exist at all.
 */
export function currentWeek(now: Date): LeagueWeek {
  return fromWindow(windowFor("week", 0, now));
}

/** The week before the one `now` falls in. Used by settlement. */
export function previousWeek(now: Date): LeagueWeek {
  return fromWindow(windowFor("week", -1, now));
}

/**
 * Is this week finished?
 *
 * The half-open comparison is deliberate and matches `ActivityWindow.to`: a week
 * ending at `T` is closed at `T`, not at `T + 1ms`. Getting this wrong by an
 * inclusive comparison would leave one millisecond in which a week is neither
 * open for awards nor eligible for settlement.
 */
export function isClosed(week: LeagueWeek, now: Date): boolean {
  return now.getTime() >= week.endsAt.getTime();
}

/**
 * Which week an award belongs to, from the moment the SERVER recorded it.
 *
 * Never from `occurred_at`, which migration 0003 names as "the client's and
 * forgeable". A browser with its clock wound back a week must not be able to
 * post work into a settled competition, and this function is the only place
 * that could let it.
 */
export function weekIdForAward(receivedAt: Date): LeagueWeekId {
  return currentWeek(receivedAt).weekId;
}
