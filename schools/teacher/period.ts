import { windowFor } from "@schools/lib/activity-window";
import type { PeriodDescriptor, TeacherPeriod } from "./contracts";

/**
 * The teacher's window, resolved once per request.
 *
 * ## Why this delegates rather than computes
 *
 * `@schools/lib/activity-window` already owns "when did this week start", and
 * it owns it for a reason the brief restates: two phones in one classroom must
 * agree, so the boundary is server-side and UTC, and the week is Monday-
 * anchored because a school week is. A second definition here would put the
 * same episode in different weeks for the teacher and the learner looking at
 * the same screen. `week` and `month` therefore call `windowFor` unchanged.
 *
 * `programme` is the one window this file adds, and it deliberately has no
 * bucket list: nine months of daily buckets is not a chart anyone reads, and
 * the trend view falls back to monthly grain there.
 *
 * ## The comparison window
 *
 * `previousOf` returns the window of EQUAL LENGTH immediately before. Not "last
 * month" for a weekly view — a week compared against a month produces a number
 * that looks like a trend and is an artefact of the denominator.
 */

/** Where the programme starts, for the `programme` window. */
const PROGRAMME_START_UTC = Date.UTC(2026, 8, 1); // 1 September 2026

export function resolvePeriod(period: TeacherPeriod, now: Date): PeriodDescriptor {
  if (period === "programme") {
    const from = new Date(Math.min(PROGRAMME_START_UTC, now.getTime()));
    /* Exclusive end at the start of tomorrow, so today's work is in the window.
       Using `now` itself would exclude an episode opened one second ago. */
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    return {
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      grain: "month",
      buckets: monthRange(from, to),
    };
  }

  const w = windowFor(period, 0, now);
  return {
    period,
    from: w.from.toISOString(),
    to: w.to.toISOString(),
    grain: w.grain,
    buckets: w.buckets,
  };
}

/**
 * The equal-length window immediately before this one.
 *
 * Used only for `Comparison`. It carries no buckets: nothing charts it, and a
 * bucket list nobody reads is a bucket list that drifts out of step with the
 * one that is rendered.
 */
export function previousOf(p: PeriodDescriptor): { from: string; to: string } {
  const from = Date.parse(p.from);
  const to = Date.parse(p.to);
  const span = to - from;
  return {
    from: new Date(from - span).toISOString(),
    to: p.from,
  };
}

function monthRange(from: Date, to: Date): string[] {
  const out: string[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth();
  const end = to.getTime();
  while (Date.UTC(y, m, 1) < end) {
    out.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

/**
 * A percentage change that refuses to be computed on noise.
 *
 * Returns null below `floor` on the previous window. The brief asks for this
 * directly — "avoid meaningless tiny percentage changes where sample size is
 * too small" — and the failure it prevents is real: one learner going from 2
 * independent solves to 3 is not "+50% class independence", it is one learner
 * doing one more task.
 */
export function changePct(current: number, previous: number, floor = 5): number | null {
  if (previous < floor) return null;
  return Math.round(((current - previous) / previous) * 100);
}
