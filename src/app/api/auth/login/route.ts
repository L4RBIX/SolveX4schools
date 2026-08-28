import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { config } from "@schools/config";
import { verifyPassword } from "@schools/auth/password";
import { sessionCookie, startSession } from "@schools/auth/session";
import { takeToken } from "@schools/lib/rate-limit";

/**
 * Sign in.
 *
 * ## The two things this route is careful about
 *
 * **It does not say which half was wrong.** "No such user" and "wrong password"
 * are the same response, because the difference is a way to enumerate a
 * school's roster — and a roster of minors is exactly what should not be
 * enumerable from the internet.
 *
 * **It is rate limited per username, not per IP.** A school sits behind one NAT
 * gateway, so an IP bucket is a bucket for the whole class: one student
 * fat-fingering their password would lock out the other seventeen. Keying on
 * the username being attacked is what actually bounds guessing.
 *
 * The scrypt verification runs even when the account does not exist, so the
 * response time does not answer the question the response body refuses to.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  username?: string;
  password?: string;
  schoolId?: string;
}

/** A throwaway record so a missing account costs the same as a wrong password. */
const DUMMY = {
  hash: "scrypt$32768$8$1$" + "0".repeat(128),
  salt: "0".repeat(32),
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const schoolId = typeof body.schoolId === "string" && body.schoolId.trim()
    ? body.schoolId.trim()
    : config.pilot.schoolId;

  if (!username || !password) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }

  const limit = await takeToken(`login:${schoolId}:${username.toLowerCase()}`, {
    capacity: 8,
    refillPerMinute: 4,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const store = await getStore();
  const account = await store.findAccountByUsername(schoolId, username);

  const ok = await verifyPassword(
    password,
    account
      ? { hash: account.passwordHash, salt: account.passwordSalt }
      : DUMMY,
  );

  if (!account || !ok || account.disabledAt) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const token = await startSession(account.userId);
  await store.markLogin(account.userId);

  /* Where to go next is decided here rather than in the browser, so a tampered
     `next` parameter cannot be used to bounce someone into a route their role
     does not have. */
  const redirectTo = account.mustChangePassword
    ? "/account/password"
    : account.role === "student"
      ? "/home"
      : "/teacher";

  const res = NextResponse.json({
    ok: true,
    role: account.role,
    displayName: account.displayName,
    mustChangePassword: account.mustChangePassword,
    redirectTo,
  });
  res.cookies.set(sessionCookie(token));
  return res;
}
