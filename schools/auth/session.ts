import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "@schools/store";
import type { SessionUser } from "./types";

/**
 * Sessions.
 *
 * An opaque random token in an httpOnly cookie; the database stores only its
 * sha256. Two consequences, both deliberate:
 *
 * - A database dump is not a set of working logins. The token is already
 *   uniformly random, so hashing costs nothing and removes the whole class of
 *   "the backup was the credential store".
 * - There is no JWT and nothing self-describing. Revocation is a row update
 *   that takes effect on the next request, rather than something we wait out.
 *   For a school that must be able to cut off a device the same afternoon, a
 *   token we cannot recall is the wrong shape.
 *
 * `httpOnly` is what separates this from the anonymous cookie it replaces: a
 * session id readable by page script is a session id a student can copy from a
 * classmate's screen, and the whole evidence model rests on events being
 * attributable to one person.
 */

const COOKIE = "sx_session";

/**
 * Eight hours.
 *
 * A school day plus the evening a learner might practise in, and short enough
 * that a session forgotten on a shared classroom machine is dead by morning.
 * Renewed on use, so a working learner is never logged out mid-lesson.
 */
const TTL_SECONDS = 8 * 60 * 60;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionCookie(token: string, maxAgeSeconds = TTL_SECONDS) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Cleared by setting an empty value with maxAge 0 — the browser drops it. */
export function clearedSessionCookie() {
  return { ...sessionCookie("", 0), maxAge: 0 };
}

export async function startSession(userId: string): Promise<string> {
  const store = await getStore();
  const token = newToken();
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  await store.createSession(userId, hashToken(token), expiresAt);
  return token;
}

export async function endCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return;
  const store = await getStore();
  await store.revokeSession(hashToken(token));
}

/**
 * Who is making this request, or null.
 *
 * Every read goes through the store's `sessionByTokenHash`, which puts expiry
 * and revocation in the WHERE clause rather than leaving them to a caller to
 * remember. A disabled account resolves to null here too: disabling is
 * immediate, not "at next login".
 */
export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const store = await getStore();
  const session = await store.sessionByTokenHash(hashToken(token));
  if (!session) return null;

  const account = await store.findAccountById(session.userId);
  if (!account || account.disabledAt) return null;

  return {
    userId: account.userId,
    schoolId: account.schoolId,
    role: account.role,
    displayName: account.displayName,
    username: account.username,
    mustChangePassword: account.mustChangePassword,
  };
}

export const SESSION_COOKIE_NAME = COOKIE;
export const SESSION_TTL_SECONDS = TTL_SECONDS;
