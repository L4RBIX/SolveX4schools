import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { config } from "@schools/config";
import { getStore } from "@schools/store";

/**
 * Who is this learner?
 *
 * Until auth exists, a device is identified by an httpOnly cookie. `httpOnly`
 * is the point: a subject id readable by page script is a subject id a student
 * can copy from a classmate, and the whole evidence model rests on events being
 * attributable to one person.
 *
 * This is explicitly a placeholder for enrolment, not a design. It is written
 * so that replacing it means changing this file: everything downstream takes a
 * `subjectId` and does not know where it came from.
 */

const COOKIE = "sx_anon";
/** 400 days is the maximum Chrome will honour. A school year is nine months. */
const MAX_AGE = 400 * 24 * 60 * 60;

export interface Identity {
  subjectId: string;
  anonId: string;
  /** True when this request minted the cookie — the caller must set it. */
  isNew: boolean;
}

export async function resolveIdentity(): Promise<Identity> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;

  /* `proxy.ts` guarantees the cookie exists and injects it into the forwarded
     request, so this is normally just a read. The fallback stays because a
     route reachable outside the proxy matcher would otherwise throw — but it
     mints a subject that no future request will find, so it is a last resort
     rather than the mechanism. */
  const anonId = existing && isUuid(existing) ? existing : randomUUID();

  const store = await getStore();
  const subjectId = await store.resolveSubject(anonId, "public", config.pilot);

  return { subjectId, anonId, isNew: anonId !== existing };
}

/** Applied by a route handler, since a Server Component cannot set a cookie. */
export function anonCookie(anonId: string) {
  return {
    name: COOKIE,
    value: anonId,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
