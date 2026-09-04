import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The two auth controls that were written down and not enforced.
 *
 * ## C5 — the forced password change was navigation, not a control
 *
 * `must_change_password` IS the one-time-credential model: a teacher hands out
 * a printed code, and the account belongs to the child from the moment they
 * choose a password. Until then the credential is on a slip of paper that has
 * been round a classroom.
 *
 * It was enforced in page guards. `src/app/teacher/*.tsx` and `page-guard.ts`
 * redirect to `/account/password`; **not one API route looked at the flag.**
 * Measured against a real deployment with a teacher's one-time session:
 * `GET /api/teacher/class/9i/students` answered 200 with the roster of a class
 * of children. A redirect is navigation, and the thing behind it is named
 * minors.
 *
 * The change endpoint also accepted `{current: X, next: X}` — the whole model
 * satisfied by echoing the printed slip back at it — and the current-password
 * check had no limiter at all: fifteen wrong values, fifteen 401s, never a 429.
 *
 * ## C11 — a correct password was refused
 *
 * The login limiter was charged on every attempt, before anything was verified,
 * and keyed on the username. `scripts/provision-class.ts` mints `<slug>-NN` and
 * `<class>-teacher`, so every username in a school is guessable: eight wrong
 * guesses locked a child out, the RIGHT password was then refused too, and
 * about nineteen requests every two minutes kept a whole class and its teacher
 * out of the product from anywhere on the internet.
 *
 * Unbounded body strings became bucket keys — a 60,000-character `schoolId`
 * produced a 60 KB row from an unauthenticated POST — and two spellings of one
 * username got two buckets, because JavaScript's `toLowerCase` and SQL's
 * `lower` disagree on dotted capitals.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const SCHOOL = "pilot-school";
const LEARNER = "auth-enforce-learner";
const TEACHER = "auth-enforce-teacher";
const PASSWORD = "a-long-enough-one";

let sessionToken: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === "sx_session" && sessionToken ? { value: sessionToken } : undefined),
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

type Store = Awaited<ReturnType<typeof import("@schools/store").getStore>>;
let store: Store;
let learnerId: string;
let teacherId: string;
let classId: string;

async function newSessionFor(userId: string) {
  const { hashToken, newToken } = await import("@schools/auth/session");
  const token = newToken();
  await store.createSession(userId, hashToken(token), new Date(Date.now() + 3_600_000).toISOString());
  sessionToken = token;
}

async function clearBuckets() {
  const { getStoreHandle } = await import("@schools/store");
  const { sql } = await getStoreHandle();
  await sql.query("delete from rate_limit_bucket", []);
}

async function login(body: Record<string, unknown>) {
  const route = await import("../../src/app/api/auth/login/route");
  return route.POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeAll(async () => {
  const { getStore } = await import("@schools/store");
  const { hashPassword } = await import("@schools/auth/password");
  store = await getStore();
  const pw = await hashPassword(PASSWORD);

  learnerId = await store.createAccount({
    schoolId: SCHOOL,
    role: "student",
    username: LEARNER,
    displayName: "Оқушы",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
  });
  teacherId = await store.createAccount({
    schoolId: SCHOOL,
    role: "teacher",
    username: TEACHER,
    displayName: "Мұғалім",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
  });

  classId = "auth-enforce-9i";
  await store.upsertClass(SCHOOL, classId, "9И");
  await store.assignTeacher(SCHOOL, classId, teacherId);
  await store.enrol(SCHOOL, classId, learnerId);
}, 90_000);

beforeEach(async () => {
  await clearBuckets();
});

afterEach(() => {
  sessionToken = null;
});

/* -------------------------------------------------------------------------- */
/* C5 — a session that has not finished signing in                             */
/* -------------------------------------------------------------------------- */

describe("a first-login session cannot use the product", () => {
  /* `createAccount` sets `must_change_password` by default, so both accounts
     above are in exactly the state a freshly provisioned child is in. */

  it("is refused the teacher roster", async () => {
    await newSessionFor(teacherId);
    const route = await import("../../src/app/api/teacher/class/[classId]/students/route");
    const res = await route.GET(new Request("http://localhost/x"), {
      params: Promise.resolve({ classId }),
    });
    expect(res.status, "a one-time session read a class of children").toBe(403);
    expect(((await res.json()) as { error?: string }).error).toBe("password_change_required");
  });

  it("is refused the learner's own state", async () => {
    await newSessionFor(learnerId);
    const route = await import("../../src/app/api/learning/state/me/route");
    const res = await route.GET();
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error?: string }).error).toBe("password_change_required");
  });

  it("is refused the preferences endpoint", async () => {
    await newSessionFor(learnerId);
    const route = await import("../../src/app/api/preferences/route");
    const res = await route.GET();
    expect(res.status).toBe(403);
  });

  it("cannot be graded", async () => {
    await newSessionFor(learnerId);
    const route = await import("../../src/app/api/learning/submit/route");
    const res = await route.POST(
      new Request("http://localhost/api/learning/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId: "m1.l1.b2",
          answer: { kind: "option", id: "x" },
          submissionId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );
    expect(res.status, "a one-time session wrote a child's ledger").toBe(403);
  });

  it("CAN still reach the route that lets it out", async () => {
    /* The complement, and the reason the option exists. A guard that closed
       every door would strand the learner on a page whose only action 403s. */
    await newSessionFor(learnerId);
    const route = await import("../../src/app/api/auth/password/route");
    const res = await route.POST(
      new Request("http://localhost/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current: PASSWORD, next: "a-different-long-one" }),
      }),
    );
    expect(res.status, "the way out must stay open").toBe(200);

    /* Put it back, so the rest of the file still faces a first-login account.
       `setPassword` clears the flag, which is its job; the raw update is how a
       fixture re-creates the state a freshly provisioned child is in. */
    const { hashPassword } = await import("@schools/auth/password");
    const { getStoreHandle } = await import("@schools/store");
    const pw = await hashPassword(PASSWORD);
    await store.setPassword(learnerId, pw.hash, pw.salt);
    const { sql } = await getStoreHandle();
    await sql.query(
      "update school_accounts set must_change_password = true where user_id = $1",
      [learnerId],
    );
  });
});

describe("the password change itself", () => {
  it("refuses a new password identical to the current one", async () => {
    await newSessionFor(learnerId);
    const route = await import("../../src/app/api/auth/password/route");
    const res = await route.POST(
      new Request("http://localhost/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current: PASSWORD, next: PASSWORD }),
      }),
    );
    expect(res.status, "echoing the printed slip back satisfied the whole model").toBe(400);
    expect(((await res.json()) as { error?: string }).error).toBe("same_as_current");

    const account = await store.findAccountById(learnerId);
    expect(account?.mustChangePassword, "and the flag must still be set").toBe(true);
  });

  it("rate-limits guesses at the current password", async () => {
    await newSessionFor(learnerId);
    const route = await import("../../src/app/api/auth/password/route");
    const attempt = () =>
      route.POST(
        new Request("http://localhost/api/auth/password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ current: "wrong-guess-here", next: "a-different-long-one" }),
        }),
      );

    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) statuses.push((await attempt()).status);

    expect(statuses.filter((s) => s === 401).length, "the first guesses are ordinary 401s").toBe(10);
    expect(statuses.filter((s) => s === 429).length, "and then it must stop answering").toBe(2);
  });
});

/* -------------------------------------------------------------------------- */
/* C11 — the login limiter                                                     */
/* -------------------------------------------------------------------------- */

describe("guessing at a username cannot lock its owner out", () => {
  it("lets the right password through after the allowance is spent", async () => {
    /* The attack, exactly as measured: eight wrong guesses at a username
       anybody can derive from the class list. */
    for (let i = 0; i < 10; i += 1) {
      await login({ username: LEARNER, password: `wrong-${i}` });
    }

    const res = await login({ username: LEARNER, password: PASSWORD });
    expect(
      res.status,
      "the owner was refused their own password because a stranger had been guessing",
    ).toBe(200);
  });

  it("still refuses further wrong guesses once the allowance is spent", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      statuses.push((await login({ username: LEARNER, password: `wrong-${i}` })).status);
    }
    expect(statuses.slice(0, 8), "eight failures are allowed").toEqual(Array(8).fill(401));
    expect(statuses.slice(8), "and then guessing stops").toEqual(Array(4).fill(429));
  });

  it("keys the allowance on the account, not on how the name was spelled", async () => {
    /*
     * The bucket key used to be `login:<school>:<username.toLowerCase()>`, and
     * the lookup uses SQL `lower()`. Those two disagree on dotted capitals — on
     * glibc, `lower('9İ-02')` is `9i-02` while JavaScript gives `9i` + a
     * combining dot — so one account had two allowances and `9İ-02` arrived
     * unlocked while `9i-02` was locked out.
     *
     * Asserted on the KEY rather than by sending both spellings, because
     * "which spellings collide" is a property of the database's collation and
     * this suite runs on PGlite. What must hold everywhere is that the key is
     * derived from the resolved account and never from the string that was
     * typed — with that true, no folding rule anywhere can produce two buckets
     * for one account.
     */
    for (let i = 0; i < 3; i += 1) {
      await login({ username: LEARNER, password: `wrong-${i}` });
    }

    const { failureKeyForAccount } = await import("@schools/auth/rate-keys");
    const { getStoreHandle } = await import("@schools/store");
    const { sql } = await getStoreHandle();
    const rows = await sql.query<{ bucket_key: string }>(
      "select bucket_key from rate_limit_bucket",
      [],
    );
    const keys = rows.rows.map((r) => r.bucket_key);

    expect(keys, "the failure count must be filed under the account").toContain(
      failureKeyForAccount(learnerId),
    );
    for (const key of keys) {
      expect(
        key.toLowerCase(),
        `bucket key "${key}" carries the typed username, so a second spelling gets a second allowance`,
      ).not.toContain(LEARNER.toLowerCase());
    }
  });

  it("writes nothing a stranger chose the size of", async () => {
    const huge = "x".repeat(60_000);
    const res = await login({ username: huge, password: "whatever", schoolId: huge });
    expect(res.status).toBe(401);

    const { getStoreHandle } = await import("@schools/store");
    const { sql } = await getStoreHandle();
    const rows = await sql.query<{ bucket_key: string }>(
      "select bucket_key from rate_limit_bucket",
      [],
    );
    for (const row of rows.rows) {
      expect(
        row.bucket_key.length,
        `a ${row.bucket_key.length}-character bucket key reached the database`,
      ).toBeLessThan(128);
    }
  });

  it("ignores a school id from the request body", async () => {
    /* It was read from the body and used for both the lookup and the key, so
       `{"schoolId":"other-school"}` was accepted and got its own bucket. */
    const res = await login({
      username: LEARNER,
      password: PASSWORD,
      schoolId: "some-other-school",
    });
    expect(res.status, "the deployment's own school is a server fact").toBe(200);
  });
});
