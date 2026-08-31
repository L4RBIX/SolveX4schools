import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { hashPassword, passwordProblem, verifyPassword } from "@schools/auth/password";
import { clearedSessionCookie } from "@schools/auth/session";
import { requireUser } from "@schools/auth/guard";

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
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireUser();
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
