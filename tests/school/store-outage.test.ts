import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * What the product says when the store is gone.
 *
 * The incident this file exists for: the local PGlite data directory became
 * unusable, every store-backed route opened the store BEFORE its first
 * try/catch, and each one answered a bare 500 with an EMPTY body. The sign-in
 * form then called `res.json()` on that empty body, threw, fell into its
 * generic catch, and told a fourteen-year-old «Аты немесе құпиясөз дұрыс емес»
 * — a claim about a password nothing had read.
 *
 * `tests/school/degradation.test.ts` already covers the judge, Nova and a
 * failed WRITE. This is the other half: what the READ paths and the identity
 * path do when the store cannot be reached at all.
 */

/* Same as degradation.test.ts: the store resolves its data directory from
   `config`, which reads `process.env` once at import, so this must be set
   before any dynamic import below. */
process.env.LEARNING_DATA_DIR = "memory://";

const ANON = "22222222-2222-4222-8222-222222222222";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_anon" ? { value: ANON } : undefined),
    set: () => {},
  }),
}));

/* -------------------------------------------------------------------------- */

type Handle = Awaited<ReturnType<typeof import("@schools/store").getStoreHandle>>;

let handle: Handle;
let login: typeof import("../../src/app/api/auth/login/route");
let stateMe: typeof import("../../src/app/api/learning/state/me/route");
let activity: typeof import("../../src/app/api/learning/activity/route");
let labels: typeof import("@schools/presentation/labels");
let schoolId: string;

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

beforeAll(async () => {
  login = await import("../../src/app/api/auth/login/route");
  stateMe = await import("../../src/app/api/learning/state/me/route");
  activity = await import("../../src/app/api/learning/activity/route");
  labels = await import("@schools/presentation/labels");
  handle = await (await import("@schools/store")).getStoreHandle();
  schoolId = (await import("@schools/config")).config.pilot.schoolId;

  const { hashPassword } = await import("@schools/auth/password");
  const stored = await hashPassword("correct-horse-battery");
  await handle.store.createAccount({
    schoolId,
    role: "student",
    username: "aisha",
    displayName: "Aisha",
    passwordHash: stored.hash,
    passwordSalt: stored.salt,
  });
}, 120_000);

/**
 * A store that is there, and then is not.
 *
 * The executor object is shared — `getStoreHandle` builds `new
 * LearningStore(sql)` around the same `sql` — so breaking it here breaks the
 * rate limiter, the session lookup and every learner read at once, which is
 * exactly what a dead data directory does.
 */
async function withDeadStore<T>(fn: () => Promise<T>): Promise<T> {
  const realQuery = handle.sql.query.bind(handle.sql);
  const realTx = handle.sql.tx.bind(handle.sql);
  const dead = async () => {
    throw new Error(
      "connection to server at postgres://pilot:hunter2@db.internal:5432/solvex failed",
    );
  };
  handle.sql.query = dead as typeof handle.sql.query;
  handle.sql.tx = dead as typeof handle.sql.tx;
  try {
    return await fn();
  } finally {
    handle.sql.query = realQuery;
    handle.sql.tx = realTx;
  }
}

function post(body: Record<string, unknown>) {
  return login.POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/* ========================================================================== */
/* 1. SIGN IN, WITH NO STORE                                                  */
/* ========================================================================== */

describe("sign in during a store outage", () => {
  it("never tells the learner their password was wrong", async () => {
    const res = await withDeadStore(() => post({ username: "aisha", password: "whatever" }));

    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;

    /* The whole point. `invalid_credentials` is a statement about a child, and
       the rate limiter — the first store touch on this route — throws before a
       single character of the password is read. */
    expect(body.error).not.toBe("invalid_credentials");
    expect(body.error).toBe("service_unavailable");
    expect(body.retryable).toBe(true);
  }, 60_000);

  it("answers with a body, so the form has something to parse", async () => {
    const res = await withDeadStore(() => post({ username: "aisha", password: "whatever" }));
    const text = await res.text();
    // The empty body is what made `res.json()` throw and the form lie.
    expect(text.length).toBeGreaterThan(0);
    expect(() => JSON.parse(text) as unknown).not.toThrow();
    expect(res.headers.get("cache-control")).toBe("no-store");
  }, 60_000);

  it("says nothing about which subsystem is down", async () => {
    const res = await withDeadStore(() => post({ username: "aisha", password: "whatever" }));
    const text = await res.text();
    /* An unauthenticated endpoint. No connection string, no host, no table, no
       driver — that detail lives behind the admin gate on `/api/health`. */
    expect(text).not.toMatch(/postgres|pglite|hunter2|db\.internal|rate_limit|sql/i);
  }, 60_000);

  it("gives the same answer whichever username is sent", async () => {
    const known = await withDeadStore(() => post({ username: "aisha", password: "x" }));
    const unknown = await withDeadStore(() =>
      post({ username: "no-such-child", password: "x" }),
    );
    /* The enumeration property, on the outage path: a 503 is a fact about the
       store, so a prober gets no bit out of the difference between a name that
       exists and one that does not. */
    expect(known.status).toBe(unknown.status);
    expect(await known.text()).toBe(await unknown.text());
  }, 60_000);
});

/* ========================================================================== */
/* 2. SIGN IN, WITH A WORKING STORE — the properties that must not regress    */
/* ========================================================================== */

describe("sign in with a working store", () => {
  it("still refuses a wrong password and an unknown name identically", async () => {
    const wrong = await post({ username: "aisha", password: "not-the-password" });
    const missing = await post({ username: "no-such-child", password: "not-the-password" });

    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(await wrong.text()).toBe(await missing.text());
  }, 60_000);

  it("still signs a real learner in", async () => {
    const res = await post({ username: "aisha", password: "correct-horse-battery" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    // First password, so the password change comes before anything else.
    expect(body.redirectTo).toBe("/account/password");
  }, 60_000);
});

/* ========================================================================== */
/* 3. THE LEARNER'S OWN READS                                                 */
/* ========================================================================== */

describe("the learner reads during a store outage", () => {
  it("state/me answers 503 with a typed body rather than an empty 500", async () => {
    const res = await withDeadStore(() => stateMe.GET());
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("store_unavailable");
    expect(body.retryable).toBe(true);
    expect(res.headers.get("cache-control")).toBe("no-store");
  }, 60_000);

  it("activity answers 503 with a typed body rather than an empty 500", async () => {
    const res = await withDeadStore(() =>
      activity.GET(new Request("http://localhost/api/learning/activity?period=week&offset=0")),
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("store_unavailable");
    expect(body.retryable).toBe(true);
  }, 60_000);

  it("neither leaks the connection string into the body", async () => {
    const a = await withDeadStore(() => stateMe.GET());
    const b = await withDeadStore(() =>
      activity.GET(new Request("http://localhost/api/learning/activity")),
    );
    for (const text of [await a.text(), await b.text()]) {
      expect(text).not.toMatch(/hunter2|db\.internal|postgres:\/\//i);
    }
  }, 60_000);

  it("both still work when the store comes back", async () => {
    const a = await stateMe.GET();
    expect(a.status).toBe(200);
    const b = await activity.GET(
      new Request("http://localhost/api/learning/activity?period=week&offset=0"),
    );
    expect(b.status).toBe(200);
    const body = (await b.json()) as { buckets: unknown[] };
    expect(body.buckets).toHaveLength(7);
  }, 60_000);
});

/* ========================================================================== */
/* 4. WHAT THE FORM RENDERS                                                   */
/* ========================================================================== */

describe("the sign-in form", () => {
  const SRC = "src/components/brilliant/auth/sign-in-form.tsx";

  it("parses the body defensively", () => {
    /* There is no jsdom in this project, so the assertion is over source text —
       the same idiom as `tests/school/product-routes.test.ts`. The defect being
       guarded is a one-line regression: dropping the `.catch` puts the lie back. */
    expect(read(SRC)).toContain("res.json().catch(() => ({}))");
  });

  it("branches on the status, not on the body", () => {
    const src = read(SRC);
    expect(src).toContain("status >= 500");
    expect(src).toContain("signInError(res.status)");
  });

  it("blames a password from exactly one place", () => {
    const src = read(SRC);
    /* `L.signInFailed` may appear only inside `signInError`, which reaches it
       only after 5xx and 429 have been ruled out. The old code had it in the
       network catch as well, which is how a dead Wi-Fi became a wrong
       password. */
    const hits = src.match(/L\.signInFailed/g) ?? [];
    expect(hits).toHaveLength(1);
  });

  it("has a service-unavailable sentence in both languages, and they differ", () => {
    const down = labels.L.signInUnavailable;
    const wrong = labels.L.signInFailed;
    for (const locale of ["kk", "ru"] as const) {
      expect(down[locale].length).toBeGreaterThan(20);
      expect(down[locale]).not.toBe(wrong[locale]);
    }
    expect(down.kk).not.toBe(down.ru);
    /* The promise the string has to carry: nothing was checked, so this is not
       about you. */
    expect(down.ru).toMatch(/не проверял/i);
    expect(down.kk).toMatch(/тексерілген жоқ/i);
  });
});
