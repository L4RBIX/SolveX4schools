import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { config } from "@schools/config";
import { verifyPassword } from "@schools/auth/password";
import { sessionCookie, startSession } from "@schools/auth/session";
import { takeToken } from "@schools/lib/rate-limit";
import {
  attemptKeyForAddress,
  clientAddress,
  failureKeyForAccount,
  failureKeyForMissingAccount,
  identifierTooLong,
} from "@schools/auth/rate-keys";
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
 * **A correct password is never refused.** The limiter used to be charged on
 * every attempt, before anything was verified, and keyed on the username. Since
 * `scripts/provision-class.ts` mints `<class-slug>-NN` and `<class>-teacher`,
 * every username in a school is guessable — so eight wrong guesses locked a
 * child out, the right password was then refused too, and about nineteen
 * requests every two minutes kept a whole class and its teacher out of the
 * product from anywhere on the internet. Measured live.
 *
 * The order is now: verify, THEN count. The bucket counts failures, so a
 * learner who types the password on the card is let in no matter how many
 * strangers have been guessing at their name. The bucket is keyed on the
 * resolved user id, so `9i-02` and `9İ-02` cannot be two buckets for one
 * account — JavaScript's `toLowerCase` and SQL's `lower` disagree on that pair
 * and the second spelling used to arrive unlocked.
 *
 * **The failure bucket is per account, never per IP.** A school sits behind one
 * NAT gateway, so an IP bucket for FAILURES is a bucket for the whole class:
 * one student fat-fingering their password would lock out the other seventeen.
 * There is a second, much larger, per-address bucket that counts ATTEMPTS —
 * because verify-first means a wrong guess now costs a full scrypt hash, and
 * that CPU needs a ceiling. It is sized for a class, and it is only trusted on
 * a platform that writes the header itself. See `schools/auth/rate-keys.ts`.
 *
 * **Nothing a stranger sends becomes a database key.** `username` and
 * `schoolId` went into the bucket key unbounded; a 60,000-character school id
 * produced a 60 KB row from an unauthenticated POST. Lengths are checked before
 * anything is stored, and the school is the deployment's own rather than the
 * body's.
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

  /*
   * The school is the DEPLOYMENT'S, not the body's.
   *
   * `schoolId` was read from the request and used for both the lookup and the
   * bucket key, so `{"schoolId":"other-school"}` was accepted and got its own
   * bucket. Nothing in the product ever sends the field — the sign-in form
   * posts `{username, password}` — so the only caller it ever served was one
   * hand-rolling a request.
   *
   * A multi-school deployment needs a real school selector on the login page
   * and a decision about what a stranger may learn from choosing one. Until
   * that exists, this is a server fact.
   */
  const schoolId = config.pilot.schoolId;

  if (!username || !password) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }

  /*
   * Bounded before anything is looked up, hashed or stored.
   *
   * Same status and body as a wrong password, so this cannot be used to probe
   * where the boundary is — and there is nothing to probe: no username this
   * product issues is over sixty-four characters, and no password over two
   * hundred, which is the ceiling `passwordProblem` already enforces on the way
   * in. An over-long value is not a credential that could ever have been right.
   */
  if (identifierTooLong(username) || password.length > 200) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
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
    /*
     * The CPU ceiling, charged on every attempt whatever its outcome.
     *
     * This is the cost of "verify first": a wrong guess now runs scrypt at
     * N=2^15 before it is refused, so something has to bound how much of that
     * one source may ask for. It is deliberately large — sized for a class
     * behind one NAT gateway, not for a person — and it is only consulted where
     * the platform writes the header itself. Off such a platform
     * `clientAddress` returns null and this bucket does not exist, because a
     * key a stranger chooses is a key a stranger can exhaust on somebody else's
     * behalf.
     */
    const address = clientAddress(request.headers, config.environment !== "development");
    if (address) {
      const attempts = await takeToken(attemptKeyForAddress(address), {
        capacity: 60,
        refillPerMinute: 30,
      });
      if (!attempts.ok) {
        return NextResponse.json(
          { error: "rate_limited", retryAfterSeconds: attempts.retryAfterSeconds },
          { status: 429, headers: { "retry-after": String(attempts.retryAfterSeconds) } },
        );
      }
    }

    const store = await getStore();
    const account = await store.findAccountByUsername(schoolId, username);

    const ok = await verifyPassword(
      password,
      account
        ? { hash: account.passwordHash, salt: account.passwordSalt }
        : DUMMY,
    );

    /*
     * Counted only now, and only if it failed.
     *
     * This is the whole of the fix for the class-wide lockout. The bucket used
     * to be charged before anything was compared, so a learner holding the
     * password printed on their card was refused for as long as a stranger kept
     * guessing at their username — and every username in a school is
     * `<class-slug>-NN`. Verification happens above; the counter is here, on the
     * failure path, and a correct password never reaches it.
     *
     * The bucket is NOT reset on success. A login that worked says nothing
     * about whether the guessing has stopped, and clearing it would let an
     * attacker who knows one password top up their allowance against the rest.
     *
     * Keyed on the user id when the account exists, so two spellings of one
     * username cannot be two buckets — `9İ-02` used to arrive with a fresh
     * allowance while `9i-02` was locked, because JavaScript's `toLowerCase`
     * and SQL's `lower` disagree on that pair. Keyed on a fixed-length hash of
     * the name when it does not exist, because probing names nobody has must
     * not be free and an unbounded name must not become a row.
     *
     * A disabled account counts as a failure rather than being called out:
     * "exists but switched off" is exactly the bit the 401 refuses to give up.
     */
    if (!account || !ok || account.disabledAt) {
      const failures = await takeToken(
        account
          ? failureKeyForAccount(account.userId)
          : failureKeyForMissingAccount(schoolId, username),
        { capacity: 8, refillPerMinute: 4 },
      );
      if (!failures.ok) {
        /* 429 rather than 401 once the allowance is gone, and it leaks nothing
           about whether the account exists: the count is entirely a function of
           failures this caller produced themselves. */
        return NextResponse.json(
          { error: "rate_limited", retryAfterSeconds: failures.retryAfterSeconds },
          { status: 429, headers: { "retry-after": String(failures.retryAfterSeconds) } },
        );
      }
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
