import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { hashPassword, passwordProblem, verifyPassword } from "@schools/auth/password";
import { clearedSessionCookie } from "@schools/auth/session";
import { requireUser } from "@schools/auth/guard";
import { takeToken } from "@schools/lib/rate-limit";
import { opsLog } from "@schools/ops/counters";

/**
 * Change your own password.
 *
 * Requires the current one even though the caller is already authenticated: a
 * session left open on a classroom machine must not be enough to lock the owner
 * out of their own account.
 *
 * Every session is revoked on success, including this one. A password change is
 * usually a response to someone else knowing it, and leaving their session
 * alive would defeat the point — so the learner signs in again, once.
 *
 * ## The one route a first-login session may use
 *
 * `requireUser({ allowPasswordChange: true })`, and it is the only call site of
 * that option in the product. Every other guard now refuses a session that
 * still owes a password change with 403 `password_change_required` — see
 * `schools/auth/guard.ts` for what that used to cost. This route is the way
 * out, so it has to stay open; logout is the other, and it reads the session
 * directly rather than through a guard.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireUser({ allowPasswordChange: true });
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: guard.status });
  const user = guard.value;

  let body: { current?: string; next?: string };
  try {
    body = (await request.json()) as { current?: string; next?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const current = typeof body.current === "string" ? body.current : "";
  const next = typeof body.next === "string" ? body.next : "";

  const problem = passwordProblem(next, user.username);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  /*
   * The new password may not be the old one.
   *
   * This route accepted `{ current: X, next: X }` and answered `ok: true`,
   * clearing `must_change_password` — so the entire one-time-credential model
   * could be satisfied by echoing the printed slip back at it. Not a bypass
   * anyone had to find: it is what a tired fourteen-year-old does when a form
   * asks for a password twice and they already have one.
   *
   * Compared as strings BEFORE the current one is verified, so a wrong `current`
   * still costs an attempt rather than being told for free that it matched the
   * new one. `passwordProblem` above has already bounded the length, so this
   * comparison cannot be made expensive.
   *
   * Refused for a voluntary change too, not only a forced one. Re-setting your
   * own password to itself does nothing except revoke every session you have,
   * which is a confusing thing for a product to do silently.
   */
  if (next === current) {
    return NextResponse.json({ error: "same_as_current" }, { status: 400 });
  }

  /*
   * The current-password check is a password guess, and it was unmetered.
   *
   * Fifteen wrong values in a row returned fifteen 401s and never a 429, on a
   * route reachable with nothing but a session cookie — which is what a shared
   * classroom machine leaves behind. Login has had a bucket since it was
   * written; this is the same guess against the same hash through a different
   * door.
   *
   * Keyed on the user id rather than the username: this caller is already
   * authenticated, so there is no enumeration question here and no case-folding
   * question either — the id is what the session resolved to. It is also
   * bounded by construction, which the username was not.
   *
   * Charged before the hash is computed, because the cost being bounded is the
   * scrypt work. A legitimate person mistyping their own password twice is
   * nowhere near ten.
   */
  const limit = await takeToken(`password-change:${user.userId}`, {
    capacity: 10,
    refillPerMinute: 3,
  });
  if (!limit.ok) {
    opsLog("auth.password_change_rate_limited", {});
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const store = await getStore();
  const account = await store.findAccountByUsername(user.schoolId, user.username);
  if (!account) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ok = await verifyPassword(current, {
    hash: account.passwordHash,
    salt: account.passwordSalt,
  });
  if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const stored = await hashPassword(next);
  await store.setPassword(user.userId, stored.hash, stored.salt);
  await store.revokeAllSessions(user.userId);

  const res = NextResponse.json({ ok: true, signedOut: true });
  res.cookies.set(clearedSessionCookie());
  return res;
}
