import "server-only";
import { timingSafeEqual } from "node:crypto";
import { config } from "@schools/config";

/**
 * Who may see infrastructure detail.
 *
 * ## The split this exists to enforce
 *
 * A teacher standing in front of eighteen children needs one thing from a
 * health page: *can they work right now, and if not, what do I do instead?*
 * "EXEC_PROVIDER=piston but PISTON_URL is not set" is not that. It names a
 * variable they cannot set, on a host they cannot reach, and it is also a
 * description of the deployment's shape handed to whoever is holding the
 * laptop.
 *
 * An admin needs exactly the opposite: the variable, the provider, the
 * reachability, the counters. So there are two shapes, and which one a caller
 * gets is decided here rather than by each route inventing its own idea of
 * "sensitive".
 *
 * ## Two doors, both real today
 *
 * 1. **A bearer token.** For machines: an uptime monitor, a deploy smoke check,
 *    a `curl` in a runbook. None of them has a session and none of them should
 *    have a password. Compared in constant time, because a token compared with
 *    `===` leaks its prefix to anyone patient enough to measure.
 *
 * 2. **The `admin` role**, when a role check is wired in. This is the SEAM:
 *    `resolveHealthView` takes the check as a parameter rather than importing
 *    it, so the ops module does not hard-depend on a session subsystem that is
 *    being built alongside it, and so this file is testable without a database.
 *    `src/app/api/health/route.ts` passes the real one in a single line —
 *    see `adminRoleCheck` there.
 *
 * There is deliberately no third door. In particular there is no
 * "development is open" branch: a developer who wants the admin view sets
 * `LEARNING_ADMIN_TOKEN` in `.env.local`, which takes ten seconds and means the
 * gate that runs in the pilot is the same gate that runs on a laptop. A gate
 * with an environment-shaped hole in it is a gate nobody has ever tested.
 */

export type HealthView = "teacher" | "admin";

/**
 * A role check. Returns true when the caller is an admin.
 *
 * Deliberately allowed to throw or reject — `resolveHealthView` treats any
 * failure as "not an admin". A health endpoint whose authorisation check needs
 * a working database is a health endpoint that goes down exactly when it is
 * needed most, and the safe direction to fail is toward LESS disclosure.
 */
export type AdminRoleCheck = () => Promise<boolean>;

function tokenMatches(presented: string): boolean {
  const expected = config.ops.adminToken;
  if (!expected) return false;

  const a = Buffer.from(presented, "utf8");
  const b = Buffer.from(expected, "utf8");
  /* Length is compared first because `timingSafeEqual` throws on a mismatch,
     and a thrown exception is itself a timing signal. Length is not the secret;
     the bytes are. */
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** `Authorization: Bearer <token>`, and nothing else. No query parameter. */
function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function resolveHealthView(
  request: Request,
  isAdmin?: AdminRoleCheck,
): Promise<HealthView> {
  const presented = bearer(request);
  if (presented && tokenMatches(presented)) return "admin";

  if (isAdmin) {
    try {
      if (await isAdmin()) return "admin";
    } catch {
      /* The session store is unreachable. Fall through to the teacher view:
         the endpoint still answers — which is the whole point of a health
         endpoint during an outage — it just answers with less. */
    }
  }

  return "teacher";
}

/**
 * A URL reduced to the one part an admin can act on.
 *
 * `PISTON_URL` and `DEEPSEEK_BASE_URL` are configuration, not secrets — but a
 * URL is a string a human wrote, and humans put credentials in URLs. `https://`
 * with a `user:pass@` prefix is a supported and commonly used form, and echoing
 * it into a health payload would publish the credential to whoever can read the
 * payload. So the userinfo, the path, the query and the fragment are all
 * dropped and only host and port survive: enough to tell "pointing at the wrong
 * judge" from "pointing at the right one", and not enough to be a credential.
 *
 * A URL that will not parse yields `"(unparseable)"` rather than the raw
 * string, because the un-parseable cases are exactly the malformed ones most
 * likely to have something odd embedded in them.
 */
export function redactUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.host || "(no host)";
  } catch {
    return "(unparseable)";
  }
}
