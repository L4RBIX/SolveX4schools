import { NextResponse } from "next/server";
import { config } from "@schools/config";
import { getStoreHandle } from "@schools/store";
import { deny, requireLearner } from "@schools/auth/guard";
import { bump, opsLog } from "@schools/ops/counters";
import { leaguesEnabledForSchool } from "@schools/leagues/gate";
import { leagueForLearner, lastSettledResult, xpBreakdown } from "@schools/leagues/queries";
import { settleDueWeeks } from "@schools/leagues/settle";
import { LEAGUE_TIERS } from "@schools/leagues/tiers";
import { TARGET_GROUP_SIZE } from "@schools/leagues/standings";
import { XP_AMOUNTS, XP_POLICY_VERSION } from "@schools/leagues/xp-policy";

/**
 * GET /api/league/me — the learner's own competition.
 *
 * ## Read-only, and there is no sibling that is not
 *
 * §41 of the brief asks that the client never choose XP. This route is the
 * whole student-facing API surface: there is no `POST /api/league/*` anywhere,
 * no action endpoint, and nothing that accepts an amount, a tier, a week or a
 * group id. XP is a side effect of being graded, and the only way to earn it is
 * to answer a question correctly on `/api/learning/submit`.
 *
 * ## `requireLearner`, and this is its first production caller
 *
 * Every other learning route uses `checkLearningAccess()` + `resolveIdentity()`,
 * which falls back to an anonymous subject in development. That is right for a
 * lesson — a developer should be able to open one without provisioning an
 * account — and wrong here: an anonymous subject has no class, so it has no
 * competition, and inventing one would put a developer's throwaway cookie on a
 * leaderboard beside eighteen children.
 *
 * `requireLearner` resolves the subject from the SESSION and 403s an unenrolled
 * caller. It has existed since migration 0012 with no callers outside tests;
 * this is the route it was written for.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireLearner();
  if (!guard.ok) return deny(guard.status, guard.reason);

  const { user, subjectId } = guard.value;

  /* 404, not 403, and not a body explaining that leagues are off.
     A refusal that distinguishes "you may not" from "there is nothing here"
     is an oracle for what other schools have enabled, and the product answers
     404 for exactly this class of question everywhere else — see
     `requireClassAccess`, which 404s a class a teacher does not teach so the
     endpoint cannot enumerate a school's classes. */
  if (!leaguesEnabledForSchool(config.leagues, user.schoolId)) {
    return deny(404, "not_found");
  }

  const { sql } = await getStoreHandle();
  const now = new Date();

  /*
   * Settle last week before reading this one.
   *
   * This is the lazy trigger, and in this deployment it is the PRIMARY one:
   * there is no cron. `LEARNING_CRON_SECRET` has no consumer and the route
   * `.env.example` tells operators to point a cron at does not exist. So a
   * learner opening this page on Monday morning is what closes Sunday's week.
   *
   * Guarded, because a settlement that throws must not cost the learner their
   * board. The week stays open, the next reader retries it, and the numbers
   * they see meanwhile are this week's — which are correct regardless.
   */
  try {
    const settled = await settleDueWeeks(sql, { now });
    if (settled.groupsSettled > 0) bump("league.settled_on_read");
  } catch (err) {
    bump("league.settlement_failed");
    opsLog("league.settlement_failed", {
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
  }

  const view = await leagueForLearner(sql, subjectId, now);
  const [last, breakdown] = await Promise.all([
    lastSettledResult(sql, subjectId),
    xpBreakdown(sql, subjectId, view.weekId),
  ]);

  return NextResponse.json(
    {
      ...view,
      /* The ladder, so the client renders tier names from ONE definition rather
         than holding its own copy that drifts when a tier is renamed. */
      ladder: LEAGUE_TIERS.map((t) => ({ tier: t.tier, name: t.name, hue: t.hue })),
      lastResult: last,
      /* The learner's OWN itemised XP. Never anybody else's — there is no
         parameter that could ask for another subject, because the id came from
         the session. */
      breakdown,
      /* The rules, shipped with the numbers so the screen can explain itself
         without a second copy of the policy in the client bundle. §27: a
         learner must be able to understand how XP is earned, and hiding the
         table is the dark pattern the brief forbids. */
      policy: { version: XP_POLICY_VERSION, amounts: XP_AMOUNTS, targetGroupSize: TARGET_GROUP_SIZE },
    },
    /* Same header the teacher console stamps. A leaderboard is per-learner and
       must not be cached by an intermediary and served to their classmate. */
    { headers: { "cache-control": "private, no-store" } },
  );
}
