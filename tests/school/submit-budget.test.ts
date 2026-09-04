import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * What one learner, and what one deployment, may spend on the judge.
 *
 * ## The defect
 *
 * `/api/learning/submit` was the one expensive route with no limiter of any
 * kind. `grep takeToken` found login, hint, explanation and exec/run; the route
 * that calls a metered third-party judge was not among them. So:
 *
 *   * a devtools loop posting fresh submission ids graded and billed
 *     indefinitely, bounded only by the judge's own concurrency gate — which
 *     means bounded by how many of everybody else's turns it could take;
 *   * omitting `submissionId` skipped the idempotency table entirely and still
 *     graded, so the one path with no dedup row was also the one with no cost
 *     ceiling.
 *
 * ## What is asserted here
 *
 * Four claims, and each one fails on the old route:
 *
 *   1. A learner's budget is finite: the (capacity + 1)th fresh Check inside a
 *      minute is a 429 carrying `retry-after`.
 *   2. **A duplicate costs nothing.** Pressing Check twice on the same answer —
 *      a double-click, a reconnecting phone, a browser retrying a POST whose
 *      response was lost — replays the stored verdict and does not touch the
 *      bucket. This is the property that makes the limit safe to impose at all.
 *   3. A refusal RELEASES the claim, so the retry after `retryAfterSeconds`
 *      grades normally. A rate limit is "not now", never "not this answer".
 *   4. In production, a submission with no id is refused rather than graded.
 *
 * The budgets are read from the environment at module load, so they are set
 * below before anything imports `config`.
 */

process.env.LEARNING_DATA_DIR = "memory://";
/* Small enough to exhaust in a test, large enough that nothing legitimate in
   this file trips it by accident. Refill is deliberately slow so the bucket
   does not silently top up between assertions. */
process.env.SUBMIT_BURST_PER_LEARNER = "4";
process.env.SUBMIT_PER_MINUTE_PER_LEARNER = "1";

const ANON = "55555555-5555-4555-8555-555555555555";
/** September, block 2 — unlocked for every learner from first login. */
const BLOCK = "m1.l1.b2";

let sessionToken: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "sx_session" && sessionToken) return { value: sessionToken };
      if (name === "sx_anon") return { value: ANON };
      return undefined;
    },
    set: () => {},
  }),
}));

vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

async function submit(body: Record<string, unknown>) {
  const route = await import("../../src/app/api/learning/submit/route");
  return route.POST(
    new Request("http://localhost/api/learning/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blockId: BLOCK, answer: { kind: "option", id: "x" }, ...body }),
    }),
  );
}

/** Empty the learner's bucket so each test starts from a known state. */
async function resetBucket() {
  const { getStoreHandle } = await import("@schools/store");
  const { sql } = await getStoreHandle();
  await sql.query("delete from rate_limit_bucket", []);
}

beforeAll(async () => {
  const { getStore } = await import("@schools/store");
  const { hashPassword } = await import("@schools/auth/password");
  const { hashToken, newToken } = await import("@schools/auth/session");
  const store = await getStore();

  const pw = await hashPassword("a-long-enough-one");
  const userId = await store.createAccount({
    schoolId: "s",
    role: "student",
    username: "budget-learner",
    displayName: "Оқушы",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
    /* A person who has finished signing in.
       `createAccount` defaults `must_change_password` to true, which is right
       for a freshly provisioned child and wrong for a fixture that then drives
       the product: every guard now refuses a first-login session with 403
       `password_change_required`. The refusal itself is pinned in
       `tests/school/auth-enforcement.test.ts`; here it would only mean the
       fixture is not a user. */
    mustChangePassword: false,
  });
  const token = newToken();
  await store.createSession(userId, hashToken(token), new Date(Date.now() + 3_600_000).toISOString());
  sessionToken = token;

  /* September, approved. The production case below has to get PAST the
     publication gate to reach the check it is about — a month nobody approved
     is a 404 before identity is even resolved, deliberately, and that ordering
     is not what this file is testing. */
  const { PROGRAM } = await import("@schools/curriculum/program");
  const { curriculumHash } = await import("@schools/curriculum/publication");
  await store.publishCurriculum({
    monthIndex: 1,
    curriculumHash: curriculumHash(PROGRAM.months[0]),
    reviewerId: userId,
    note: "submit-budget fixture",
  });
}, 90_000);

beforeEach(async () => {
  await resetBucket();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("one learner cannot spend the class's judge", () => {
  it("refuses the fifth fresh Check in a minute, with a retry-after", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const res = await submit({ submissionId: randomUUID() });
      statuses.push(res.status);
    }

    expect(
      statuses.slice(0, 4),
      "the learner's first four Checks are ordinary work and must be graded",
    ).toEqual([200, 200, 200, 200]);

    const refused = statuses[4];
    expect(refused, `the fifth Check was ${refused}, not a refusal`).toBe(429);
  });

  it("carries a retry-after a client can act on", async () => {
    for (let i = 0; i < 4; i += 1) await submit({ submissionId: randomUUID() });
    const res = await submit({ submissionId: randomUUID() });

    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after"), "no retry-after header").toBeTruthy();
    const body = (await res.json()) as { retryAfterSeconds?: number };
    expect(typeof body.retryAfterSeconds).toBe("number");
    expect(body.retryAfterSeconds!).toBeGreaterThan(0);
    /* And nothing was graded. A 429 is about load, and must never look to the
       player like an answer. */
    expect((body as Record<string, unknown>).verdict).toBeUndefined();
    expect((body as Record<string, unknown>).saved).toBeUndefined();
  });

  it("charges nothing for a duplicate, however many times it arrives", async () => {
    /* The double-click, the reconnecting phone, the browser retrying a POST
       whose response was lost on the wire. All three send the SAME id, and a
       limiter that charged for them would make the network's flakiness the
       learner's problem. */
    const id = randomUUID();
    const first = await submit({ submissionId: id });
    expect(first.status).toBe(200);

    for (let i = 0; i < 20; i += 1) {
      const again = await submit({ submissionId: id });
      expect(again.status, `duplicate ${i + 2} was refused`).toBe(200);
    }

    /* Three fresh Checks must still be available: the budget is 4 and exactly
       one has been spent, whatever the other twenty requests did. */
    for (let i = 0; i < 3; i += 1) {
      const fresh = await submit({ submissionId: randomUUID() });
      expect(fresh.status, `fresh Check ${i + 1} after 20 duplicates`).toBe(200);
    }
    const overBudget = await submit({ submissionId: randomUUID() });
    expect(overBudget.status, "the budget should now be exactly spent").toBe(429);
  });

  it("releases the claim it refused, so the same answer grades on retry", async () => {
    /* A rate limit is "not now". If the refusal left the submission claimed,
       the learner would be locked out of that exact text until the stale-claim
       takeover fired sixty seconds later — and the id is stable while their
       answer is unchanged, so every retry would find the same dead claim. */
    for (let i = 0; i < 4; i += 1) await submit({ submissionId: randomUUID() });

    const id = randomUUID();
    const refused = await submit({ submissionId: id });
    expect(refused.status).toBe(429);

    await resetBucket(); // stands in for waiting out retryAfterSeconds

    const retried = await submit({ submissionId: id });
    expect(retried.status, "the refused answer must grade cleanly on retry").toBe(200);
    const body = (await retried.json()) as { saved?: boolean; verdict?: unknown };
    expect(body.saved, "and it must actually be recorded").toBe(true);
    expect(body.verdict).toBeDefined();
  });
});

describe("a submission with no id", () => {
  it("is refused in production, where it would skip deduplication and metering", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { resetGateCache } = await import("@schools/curriculum/gate");
    resetGateCache();
    try {
      const res = await submit({});
      expect(res.status, "an unkeyed submission must not be graded in production").toBe(400);
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.error).toBe("submissionId required");
      expect(body.reason).toBe("stale_client");
      /* Nothing graded, nothing recorded. */
      expect(body.verdict).toBeUndefined();
      expect(body.saved).toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
      (await import("@schools/curriculum/gate")).resetGateCache();
    }
  });

  it("is still graded in development, so the suite and local work are unaffected", async () => {
    vi.resetModules();
    await resetBucket();
    const res = await submit({});
    expect(res.status, "development keeps the old behaviour deliberately").toBe(200);
  });
});
