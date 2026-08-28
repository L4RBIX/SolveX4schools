import { currentUser } from "@schools/auth/session";
import { buildAdminHealth, teacherHealth } from "@schools/ops/health";
import { resolveHealthView } from "@schools/ops/admin-gate";

/**
 * Health.
 *
 * ## Two audiences, one endpoint, and the split is in the payload
 *
 * The response always carries `view`, and it is either `"teacher"` or
 * `"admin"`. A caller can therefore never be confused about which one they got,
 * and a teacher UI that renders `view: "admin"` is a visible bug rather than a
 * silent disclosure.
 *
 * **Teacher (and anyone, including an unauthenticated monitor):** five
 * capabilities in Kazakh and Russian, each naming a consequence — "code
 * checking is temporarily unavailable; nobody is being marked wrong". No
 * provider names, no hostnames, no environment, no variable names, no counts of
 * internal tables. Nothing on this path would help someone attack the
 * deployment and nothing on it would confuse someone teaching.
 *
 * **Admin:** the whole report. Web, database, execution provider, Nova
 * provider, curriculum version and hash, reducer lag, ledger-derived activity,
 * and the in-process counters.
 *
 * ## Who reaches the admin view
 *
 * Either door in `schools/ops/admin-gate.ts`: a bearer token
 * (`LEARNING_ADMIN_TOKEN`, for a monitor that has no session), or the `admin`
 * role. The role check is passed IN rather than reached for, so the gate has no
 * hard dependency on the session subsystem and a change there is a one-line
 * change here.
 *
 * ## Why it is never cached and never 404s
 *
 * `force-dynamic` because a cached health check is a lie with a timestamp on
 * it. And the route exists in every environment, including production, because
 * the teacher view is the safe one — hiding health in production would remove
 * the one page that says "keep going, nobody is being marked wrong" on the
 * afternoon the judge falls over.
 *
 * ## Status codes
 *
 * 200 when everything is `ok`, 503 otherwise, so an uptime monitor needs to
 * parse nothing at all. `degraded` returns 503 too: Nova being offline is not
 * an outage for a learner, but it IS something somebody should be told about,
 * and a monitor that only wakes on total failure wakes too late.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE ROLE SEAM.
 *
 * One function, one line of substance. When the session subsystem's shape
 * changes, this is the only thing in the ops module that has to move.
 *
 * It is allowed to throw — `resolveHealthView` treats any failure as "not an
 * admin", because a health endpoint whose authorisation needs a working
 * database is a health endpoint that goes dark exactly when it is needed.
 */
async function adminRoleCheck(): Promise<boolean> {
  const user = await currentUser();
  return user?.role === "admin";
}

export async function GET(request: Request) {
  const view = await resolveHealthView(request, adminRoleCheck);

  /* An active judge probe is admin-only and opt-in. Unauthenticated callers
     cannot make this endpoint put load on the judge, and a monitor polling
     every thirty seconds does not either unless someone asks it to. */
  const probeExecution =
    view === "admin" && new URL(request.url).searchParams.get("probe") === "1";

  const admin = await buildAdminHealth({ probeExecution });
  const body = view === "admin" ? admin : teacherHealth(admin);

  return Response.json(body, {
    status: body.status === "ok" ? 200 : 503,
    // Belt and braces beside `force-dynamic`: a proxy in front of the app must
    // not serve yesterday's answer to "is it working right now".
    headers: { "cache-control": "no-store" },
  });
}
