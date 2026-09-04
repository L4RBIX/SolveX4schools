import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { config } from "@schools/config";
import { getStoreHandle, getStore } from "@schools/store";
import { runSweep } from "@schools/reducer/sweep";
import { settleDueWeeks } from "@schools/leagues/settle";
import { opsLog } from "@schools/ops/counters";

/**
 * The scheduled work, with an entry point something can actually call.
 *
 * ## What this replaces
 *
 * Two `setInterval`s in `src/instrumentation.ts`. On a long-running Node server
 * those are correct and this route is redundant. On Vercel they are neither:
 * a lambda is created for a request and frozen after it, so an interval that
 * fires every twenty seconds fires zero times, and every warm instance that
 * does exist runs its own copy of a job meant to run once.
 *
 * `LEARNING_CRON_SECRET` has been in `schools/config.ts` since it was written
 * and had no consumer anywhere in the product. The operational docs already
 * told an operator to schedule `POST /api/learning/reduce`, which does not
 * exist. This is the route those documents were describing.
 *
 * ## What it is NOT load-bearing for
 *
 * Correctness. Both jobs are backstops:
 *
 *   - the reducer sweep is request-driven through `after()`, so without a cron
 *     the projections merely lag rather than being wrong;
 *   - league settlement now happens inside `ensureMembership`, on the award
 *     that would otherwise have read a stale tier — see
 *     `schools/leagues/engine.ts`. A learner cannot be admitted to a new week
 *     at last week's tier whether or not this route is ever called.
 *
 * That ordering is deliberate. A correctness guarantee that depends on a
 * schedule is a guarantee that evaporates the first time somebody forgets to
 * configure one, and this deployment ran for its whole life without one.
 *
 * ## The Hobby plan allows one cron a day
 *
 * Which is why the two jobs share a route rather than having one each, and why
 * neither of them may need it. `vercel.json` schedules it just after the ISO
 * week boundary — 00:10 UTC on a Monday is 05:10 Almaty — which is when a
 * closed week has just become settleable.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Settling every group of a whole school is bounded, but it is not instant. */
export const maxDuration = 60;

/**
 * Constant-time, and a length check first.
 *
 * `timingSafeEqual` throws on a length mismatch rather than returning false,
 * and the length of a secret is not a secret worth a 500.
 */
function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handle(request: Request): Promise<Response> {
  const expected = config.cronSecret;
  if (!expected) {
    /*
     * Not configured. 404 rather than 503, and rather than running: a route
     * that does scheduled work for anyone who finds it is a route that lets a
     * stranger settle a school's league whenever they like.
     *
     * 404 rather than 401 for the same reason the teacher routes use it: the
     * existence of an unguarded cron endpoint is itself the interesting fact.
     */
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!presented || !secretMatches(presented, expected)) {
    opsLog("cron.refused", {});
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const now = new Date();
  const result: Record<string, unknown> = { at: now.toISOString() };

  /* Each job is guarded on its own. One failing must not stop the other: they
     are unrelated, and a league that cannot settle is not a reason to leave a
     class's projections stale for another day. */
  try {
    const store = await getStore();
    const swept = await runSweep(store, { limit: 500 });
    result.sweep = {
      episodes: swept.episodesReduced,
      decisions: swept.decisionsRecorded,
      errors: swept.errors.length,
      stateErrors: swept.stateErrors.length,
    };
  } catch (err) {
    result.sweep = { error: err instanceof Error ? err.message : String(err) };
  }

  if (config.leagues.enabled) {
    try {
      const { sql } = await getStoreHandle();
      const settled = await settleDueWeeks(sql, { now });
      result.leagues = {
        groups: settled.groupsSettled,
        moved: settled.learnersMoved,
        skipped: settled.skipped,
      };
    } catch (err) {
      result.leagues = { error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    result.leagues = "disabled";
  }

  opsLog("cron.ran", {});
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}

/** Vercel Cron issues a GET. */
export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

/**
 * POST too, because an operator with `curl` reaches for it and because the
 * runbooks have described a POST since before the route existed.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
