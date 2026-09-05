import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkSameSite, requestHost } from "@schools/auth/same-site";
import { proxy } from "../../proxy";

/**
 * A write has to come from our own pages.
 *
 * ## What the product relied on
 *
 * `SameSite=Lax` on the session cookie, and nothing else. Lax is a real defence
 * and it is one browser's policy, applied by one browser, with no server-side
 * statement behind it. Measured against production: `PUT /api/preferences` with
 * `Origin: https://evil.example` and `Content-Type: text/plain` answered
 * **200**.
 *
 * No session came with it, so nothing was written for anybody in particular.
 * What it showed is that the server had no opinion — the only thing between a
 * cross-site write and a child's record was a browser choosing to withhold a
 * cookie, and Lax has documented exceptions.
 *
 * ## Why the middleware and not each route
 *
 * Twenty-nine route handlers is twenty-nine chances for the thirtieth to be
 * missing it. The same argument that made `openTeacherRequest` one helper.
 *
 * ## The thing that makes this safe to turn on
 *
 * A request carrying NEITHER `Sec-Fetch-Site` nor `Origin` is allowed. `curl`,
 * a runbook, an uptime probe and Vercel Cron all send neither; a browser always
 * sends at least one. Refusing the header-less case would break the operational
 * surface to defend against the one client that cannot reach it.
 */

const url = (path: string) => `https://solvex4schools.vercel.app${path}`;

function request(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(url(path), {
    method: init.method ?? "POST",
    headers: { host: "solvex4schools.vercel.app", ...(init.headers ?? {}) },
  });
}

/** The middleware's answer: null when it let the request through. */
function refusal(req: NextRequest): number | null {
  const res = proxy(req);
  return res.status === 403 ? 403 : null;
}

describe("the same-site rule itself", () => {
  const H = (h: Record<string, string>) => new Headers(h);

  it("trusts what the browser says about where the request came from", () => {
    expect(checkSameSite(H({ "sec-fetch-site": "same-origin" }), "a.example").ok).toBe(true);
    /* `none` is a typed URL or a bookmark — a person, not a page. */
    expect(checkSameSite(H({ "sec-fetch-site": "none" }), "a.example").ok).toBe(true);
    expect(checkSameSite(H({ "sec-fetch-site": "cross-site" }), "a.example").ok).toBe(false);
    /* `same-site` is refused with `cross-site`: a sibling subdomain is a
       different application, and the session cookie is not scoped to one. */
    expect(checkSameSite(H({ "sec-fetch-site": "same-site" }), "a.example").ok).toBe(false);
  });

  it("falls back to Origin, compared against the host it arrived on", () => {
    expect(checkSameSite(H({ origin: "https://a.example" }), "a.example").ok).toBe(true);
    expect(checkSameSite(H({ origin: "https://evil.example" }), "a.example").ok).toBe(false);
    expect(checkSameSite(H({ origin: "not a url" }), "a.example").ok).toBe(false);
  });

  it("lets a request with no browser signal through", () => {
    /* The property that makes this deployable. Every operator tool lands here. */
    const verdict = checkSameSite(H({}), "a.example");
    expect(verdict.ok).toBe(true);
    expect(verdict.reason).toBe("no_browser_signal");
  });

  it("prefers the forwarded host, because the platform terminates TLS", () => {
    expect(requestHost(H({ host: "internal:3000", "x-forwarded-host": "a.example" }))).toBe(
      "a.example",
    );
    expect(requestHost(H({ host: "a.example" }))).toBe("a.example");
    expect(requestHost(H({}))).toBeNull();
  });
});

describe("the middleware", () => {
  it("refuses a cross-site write to an API route", () => {
    /* The measured request, restated: a POST from somebody else's page. */
    expect(
      refusal(request("/api/preferences", { method: "PUT", headers: { origin: "https://evil.example" } })),
      "a cross-site write was accepted",
    ).toBe(403);
    expect(
      refusal(request("/api/learning/submit", { headers: { "sec-fetch-site": "cross-site" } })),
    ).toBe(403);
  });

  it("allows our own pages", () => {
    expect(refusal(request("/api/learning/submit", { headers: { "sec-fetch-site": "same-origin" } }))).toBeNull();
    expect(
      refusal(request("/api/preferences", { method: "PUT", headers: { origin: "https://solvex4schools.vercel.app" } })),
    ).toBeNull();
  });

  it("allows a client with no browser headers, so runbooks keep working", () => {
    /* `curl`, an uptime probe, and Vercel Cron calling `/api/cron`. */
    expect(refusal(request("/api/cron", { method: "GET" }))).toBeNull();
    expect(refusal(request("/api/learning/events"))).toBeNull();
  });

  it("does not police reads, or navigations to pages", () => {
    /* A GET from another site is a link. Refusing links is not a security
       control, and the session cookie's own `SameSite` still applies. */
    expect(refusal(request("/api/learning/state/me", { method: "GET", headers: { "sec-fetch-site": "cross-site" } }))).toBeNull();
    /* And a page, not an API route — a cross-site POST to a form-less page has
       nothing to change. */
    expect(refusal(request("/lesson/m1.l1", { headers: { "sec-fetch-site": "cross-site" } }))).toBeNull();
  });
});
