import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkSameSite, requestHost } from "@schools/auth/same-site";

/**
 * Identity, established once per browser before any route runs.
 *
 * ## The bug this exists to fix
 *
 * Minting the anonymous id inside route handlers looked fine and was not.
 * Every route that did not explicitly set the cookie on its response left the
 * browser without one, so the next request minted another id — and requests
 * that raced (a `keepalive` event beacon alongside a submit) each minted their
 * own before either response was stored. One learner produced five subjects,
 * their evidence scattered across all of them, and the dashboard showed zeros
 * while the database was full of their work.
 *
 * Nothing errored. The only way to see it was to read the subjects table.
 *
 * Doing it here fixes both halves: the cookie is set on the response of the
 * FIRST request whatever it was, and it is injected into the forwarded request
 * headers so the handler on that same request already sees it.
 *
 * `httpOnly` is load-bearing. A subject id readable by page script is one a
 * student can copy from a classmate, and every claim about who did what rests
 * on it.
 */

const COOKIE = "sx_anon";
/** The maximum Chrome honours. A school year is nine months. */
const MAX_AGE = 400 * 24 * 60 * 60;

export function proxy(request: NextRequest) {
  /*
   * Cross-site writes, refused in one place.
   *
   * The product relied on `SameSite=Lax` alone. Lax is a real defence and it is
   * one browser's policy applied by one browser, with no server-side statement
   * behind it — measured against production, `PUT /api/preferences` with
   * `Origin: https://evil.example` answered 200. Nothing was written for
   * anybody, because no session came with it; what it showed is that the server
   * had no opinion.
   *
   * Here rather than in each route, for the reason the teacher guard is one
   * helper: twenty-nine route handlers is twenty-nine chances for the thirtieth
   * to be missing it. The middleware already runs on everything but static
   * assets.
   *
   * Only `/api/*`, and only the verbs that change something. A page navigation
   * from another site is a link, and refusing links is not a security control.
   * A request carrying neither `Sec-Fetch-Site` nor `Origin` is allowed —
   * `curl`, a runbook, an uptime probe and Vercel Cron all send neither, and a
   * browser always sends at least one. See `checkSameSite`.
   */
  const method = request.method.toUpperCase();
  const mutating = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  if (mutating && request.nextUrl.pathname.startsWith("/api/")) {
    const verdict = checkSameSite(request.headers, requestHost(request.headers));
    if (!verdict.ok) {
      /* 403 with no detail. Which of the two signals refused it is our
         business, and a caller that cannot construct a same-site request does
         not become able to by being told which header was wrong. */
      return NextResponse.json({ error: "cross_site_request" }, { status: 403 });
    }
  }

  const existing = request.cookies.get(COOKIE)?.value;
  if (existing && isUuid(existing)) return NextResponse.next();

  const anonId = crypto.randomUUID();

  // Injected into the request the handler is about to see, so the very first
  // POST is already attributable rather than creating an orphan subject.
  const headers = new Headers(request.headers);
  const others = request.cookies
    .getAll()
    .filter((c) => c.name !== COOKIE)
    .map((c) => `${c.name}=${c.value}`);
  headers.set("cookie", [...others, `${COOKIE}=${anonId}`].join("; "));

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set({
    name: COOKIE,
    value: anonId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return response;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export const config = {
  /* Everything except static assets. The cookie must exist before the first
     API call, and the first API call can come from any page.

     `cpp17/` is excluded for a reason of its own: it is 57 MB of pinned
     compiler across four requests, and running an identity middleware on each
     of them adds a function invocation to a static file that is served
     `immutable` and needs no cookie. The worker fetches them with no
     credentials and nothing downstream reads a session for them. */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|cpp17/).*)"],
};
