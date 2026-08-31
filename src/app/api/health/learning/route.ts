import { currentUser } from "@schools/auth/session";
import { buildAdminHealth, teacherHealth } from "@schools/ops/health";
import { resolveHealthView } from "@schools/ops/admin-gate";

/**
 * Health, learning subsystem.
 *
 * ## What it watches
 *
 * The two failures that are invisible from the outside:
 *
 * 1. **A dead sweep.** Every route keeps returning 200 with a stale projection,
 *    so a teacher reads last week's evidence mid-lesson and nothing complains.
 * 2. **A broken attestation secret.** Every verdict silently downgrades to
 *    browser trust, no misconception ever becomes actionable, and the product
 *    goes on looking like it works while it has stopped learning anything.
 *
 * Both report as numbers rather than as an exception somewhere.
 *
 * ## What changed, and why
 *
 * This used to answer everybody with the full detail — provider names, the
 * environment, and the configuration-problem strings, which name the exact
 * variables a deployment is missing. That is an admin's report published at an
 * unauthenticated URL. It is now gated exactly like `/api/health`: an admin
 * (bearer token or role) gets the detail, everyone else gets the teacher view.
 *
 * The admin shape keeps its original field names — `lastSweepAt`,
 * `sweepAgeSeconds`, `unreducedEpisodeEvents`, `verdicts`, `providers`,
 * `environment` — so a runbook or a monitor that already reads them keeps
 * working once it presents its token. What it does not keep is answering them
 * to anyone who asks.
 *
 * `/api/health` is the whole picture. This route is the learning subsystem on
 * its own, kept because that is what an alert on "the intelligence stopped"
 * should point at.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The role seam. See `src/app/api/health/route.ts` for the full note. */
async function adminRoleCheck(): Promise<boolean> {
  const user = await currentUser();
  return user?.role === "admin";
}

export async function GET(request: Request) {
  const view = await resolveHealthView(request, adminRoleCheck);
  const admin = await buildAdminHealth();

  if (view !== "admin") {
    /* The teacher projection of the whole report, not of this subsystem alone.
       A teacher asking "is it working" while the judge is down must be told
       about the judge, and which endpoint they happened to hit is not a
       distinction they should have to know about. */
    const teacher = teacherHealth(admin);
    return Response.json(teacher, {
      status: teacher.status === "ok" ? 200 : 503,
      headers: { "cache-control": "no-store" },
    });
  }

  /* Every problem the report found, flattened. The subsystem-specific ones
     first because this endpoint is what an intelligence alert points at, then
     the configuration ones, because a dead reducer and a misconfigured judge
     produce the same symptom — 200s all the way down and nothing graded — and
     an operator reading this needs both in one place. */
  const problems = [
    ...admin.reducer.problems,
    ...admin.learning.problems,
    ...admin.web.problems,
    ...admin.database.problems,
    ...admin.execution.problems,
    ...admin.nova.problems,
    ...admin.curriculum.problems,
  ];

  return Response.json(
    {
      view: "admin" as const,
      ok: problems.length === 0,
      problems,

      // Original field names, unchanged, so an existing runbook still reads.
      lastSweepAt: admin.reducer.reducer.lastSweepAt,
      sweepAgeSeconds: admin.reducer.reducer.sweepAgeSeconds,
      unreducedEpisodeEvents: admin.reducer.reducer.unreducedEvents,
      verdicts: admin.learning.activity?.verdicts ?? {
        total: 0,
        judged: 0,
        judgedShare: null,
      },
      providers: {
        nova: admin.nova.detail.provider,
        execution: admin.execution.detail.provider,
      },
      environment: admin.web.detail.environment,

      // Added: the questions the pilot actually has to answer on the day.
      activity: admin.learning.activity,
      assistance: admin.learning.assistance,
      curriculum: {
        version: admin.curriculum.fingerprint.version,
        contentHash: admin.curriculum.fingerprint.contentHash,
      },
      counters: admin.counters,
    },
    {
      status: problems.length === 0 ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
