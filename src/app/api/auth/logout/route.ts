import { NextResponse } from "next/server";
import { clearedSessionCookie, endCurrentSession } from "@schools/auth/session";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";

/**
 * Sign out.
 *
 * Revokes server-side FIRST, then clears the cookie. The order matters on a
 * shared classroom machine: if only the cookie were cleared, the token would
 * still be valid for anyone who had a copy of it, and "I logged out" would be
 * a statement about one browser rather than about the session.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  /* `allDevices` is read before the session is ended, because ending it first
     would leave nobody to revoke sessions for. */
  let allDevices = false;
  try {
    const body = (await request.json()) as { allDevices?: unknown };
    allDevices = body?.allDevices === true;
  } catch {
    /* No body is the ordinary case — a plain sign-out. */
  }

  if (allDevices) {
    const user = await currentUser();
    if (user) {
      const store = await getStore();
      await store.revokeAllSessions(user.userId);
    }
  }

  await endCurrentSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearedSessionCookie());
  return res;
}
