import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { config } from "@schools/config";
import { verifyPassword } from "@schools/auth/password";
import { sessionCookie, startSession } from "@schools/auth/session";
import { takeToken } from "@schools/lib/rate-limit";
import { opsLog } from "@schools/ops/counters";

/**
 * Sign in.
 *
 * ## The three things this route is careful about
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
 * **It never blames a learner for an outage.** When the store is unreachable
 * this route compares nothing at all, and it says so: 503, `service_unavailable`,
 * and not one word about credentials. See the guard in `POST`.
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

  /*
   * EVERYTHING that can touch the store is inside this guard, and the boundary
   * is drawn around the whole credential path rather than around each call.
   *
   * ## The failure it exists for
   *
   * The first store touch on this route is `takeToken` — the rate limiter is
   * itself a table — so when the local data directory went bad it threw before a
   * single character of the password had been looked at. The throw escaped as a
   * bare 500 with an EMPTY body; the form called `res.json()` on that empty
   * body, which threw in turn, fell into its generic catch, and rendered
   * «Аты немесе құпиясөз дұрыс емес» / «Неверный логин или пароль».
   *
   * So the product asserted to a fourteen-year-old that they had mistyped a
   * password nothing had read. They retry, they doubt the card the teacher wrote
   * it on, and then they fetch the teacher — who cannot sign in either, and who
   * has been given no reason to look at `/api/health`, which knew exactly what
   * was wrong the whole time.
   *
   * ## Why one guard and not three
   *
   * Three small try blocks around `takeToken`, the lookup and the session write
   * would work today and rot tomorrow: the next store call somebody adds here —
   * an audit row, a device record, a failed-attempt counter — lands outside them
   * and re-opens exactly this hole, silently, with the same symptom. One
   * boundary means a store call added anywhere in this handler is covered by
   * construction.
   *
   * `verifyPassword` sits inside it deliberately. It does not throw — a
   * malformed stored record returns `false` by design, see
   * `schools/auth/password.ts` — so nothing that reaches the catch below is a
   * statement about a credential.
   *
   * ## Why this does not become an enumeration oracle
   *
   * A 503 here is a fact about the STORE, never about the username: the store
   * answers for every account or for none, so a prober sees the same status
   * whichever name it sends, and gets no bit out of the difference.
   *
   * The 401 path is untouched — same status and same body for a missing account
   * as for a wrong password, with the scrypt cost paid either way. Nothing was
   * added that returns early for one name and not another, and the outage path
   * is fast for ALL names rather than fast for the interesting ones.
   */
  try {
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
  } catch (err) {
    /* Logged, because a whole class failing to sign in at 09:00 is something
       somebody has to be told about, and a 503 the browser renders as one
       sentence tells nobody who can fix it.

       No username in the line, and no school id. `opsLog` writes to the one
       store with no schema, no retention and no erasure path —
       `learning_forget_user` cannot reach a log line — and "who tried to sign in
       and when" is precisely what must not outlive the term. */
    opsLog("auth.login_unavailable", {
      /* Truncated, and stripped of anything URL-shaped: a `pg` error message
         frequently carries the connection string and a PGlite one carries the
         data directory. Same rule, and the same regex, as `errText` in
         `schools/ops/health.ts`. */
      message: (err instanceof Error ? err.message : String(err))
        .replace(/[a-z+]+:\/\/\S*/gi, "(url)")
        .slice(0, 200),
    });

    /* `service_unavailable`, and deliberately not `store_unavailable` as the
       learning routes say. This endpoint answers unauthenticated callers, and
       which subsystem is down is not something a stranger needs; that detail
       lives behind the admin gate on `/api/health`.

       The client branches on the 5xx, not on this string, so a proxy that
       replaces the body with its own HTML still produces the right sentence —
       see `signInError` in `src/components/brilliant/auth/sign-in-form.tsx`. */
    return NextResponse.json(
      { error: "service_unavailable", retryable: true },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
