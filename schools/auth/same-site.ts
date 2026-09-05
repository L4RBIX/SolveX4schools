/**
 * Is this state-changing request coming from our own pages?
 *
 * ## What the product relied on, and why it was not enough
 *
 * `SameSite=Lax` on the session cookie, and nothing else. Lax is a real
 * defence and it covers the common case — a cross-site `fetch` or form POST
 * does not carry the cookie — but it is one browser's policy, applied by one
 * browser, with no server-side statement of intent behind it. Measured against
 * production: `PUT /api/preferences` with `Origin: https://evil.example` and
 * `Content-Type: text/plain` answered **200**.
 *
 * That request did not carry a session, so nothing was written for anybody in
 * particular. What it demonstrates is that the server had no opinion: the only
 * thing standing between a cross-site write and a child's record was the
 * browser choosing to withhold a cookie, and Lax has documented exceptions —
 * top-level navigations, and whatever the next release of a browser decides.
 *
 * ## The rule
 *
 * A state-changing request must come from us, and the browser has to say so.
 * Two independent signals, either of which is sufficient:
 *
 *   - `Sec-Fetch-Site`, which every browser this product supports sends and
 *     which a page cannot forge. `same-origin` and `none` (a typed URL, a
 *     bookmark) are ours; `cross-site` and `same-site` are not.
 *   - `Origin`, compared against the host the request arrived on.
 *
 * Absent BOTH, the request is allowed. That is deliberate and it is the whole
 * reason this is safe to turn on: `curl`, a runbook, an uptime probe and an
 * operator script send neither header, and refusing them would break the
 * operational surface to defend against a browser — which is the one client
 * that always sends at least one of the two.
 *
 * Pure, and free of `server-only`: it takes a `Headers` and returns a verdict,
 * so a test can ask it about any request shape without standing up a route.
 */

/** What the check concluded, and why — the reason goes to the ops counter. */
export type SameSiteVerdict =
  /** Ours: same-origin, a direct navigation, or a matching Origin. */
  | { ok: true; reason: "same_origin" | "no_browser_signal" }
  /** Not ours. Refuse. */
  | { ok: false; reason: "cross_site" | "origin_mismatch" };

/**
 * @param headers the request's own headers
 * @param host what the request arrived on — `Host`, or the forwarded host on a
 *   platform that terminates TLS in front of the app. Passed in rather than
 *   read here, because "which host am I" is a deployment fact and this is a
 *   pure function.
 */
export function checkSameSite(headers: Headers, host: string | null): SameSiteVerdict {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite !== null) {
    /* `same-site` is refused along with `cross-site`. A sibling subdomain is a
       different application; the session cookie is not scoped to one, and a
       school that later runs anything else under the same registrable domain
       should not inherit write access to this. */
    if (fetchSite === "same-origin" || fetchSite === "none") {
      return { ok: true, reason: "same_origin" };
    }
    return { ok: false, reason: "cross_site" };
  }

  const origin = headers.get("origin");
  if (origin !== null && origin !== "null") {
    if (host === null) {
      /* An Origin we cannot compare against anything. Refusing would break a
         deployment whose host header is stripped by a proxy; allowing it costs
         nothing that `Sec-Fetch-Site` does not already cover on any browser
         new enough to send an Origin. */
      return { ok: true, reason: "no_browser_signal" };
    }
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return { ok: false, reason: "origin_mismatch" };
    }
    return originHost === host
      ? { ok: true, reason: "same_origin" }
      : { ok: false, reason: "origin_mismatch" };
  }

  return { ok: true, reason: "no_browser_signal" };
}

/** The host this request arrived on, forwarded header first. */
export function requestHost(headers: Headers): string | null {
  return headers.get("x-forwarded-host") ?? headers.get("host");
}
