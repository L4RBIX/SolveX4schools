import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";

/**
 * The publication gate has to hold on the API, not only on the page.
 *
 * ## What was measured
 *
 * Against the real production build, on a database where September was the
 * only published month, signed in as a real provisioned learner:
 *
 *   GET  /lesson/m9.l1                                  -> 307   (gated)
 *   POST /api/learning/submit { blockId: "m9.l1.b2" }   -> 200
 *        { "verdict": "wrong", "saved": true, "attested": true }
 *
 * May was graded, recorded, and ATTESTED — trusted evidence about a child,
 * against material no human had approved — because the gate lived in
 * `src/app/lesson/[lessonId]/page.tsx` and nowhere else.
 *
 * Everything the pilot's release process rests on runs through that approval
 * row: the curriculum hash a reviewer signs, the "September only on day one"
 * commitment, the monthly procedure for opening October later. All of it was
 * navigational. A learner with the network tab open — and this codebase
 * repeatedly, correctly, assumes fourteen-year-olds open the network tab —
 * could be graded on anything in the year.
 *
 * ## Why this test signs in
 *
 * An anonymous caller is refused with 401 in production before the gate is
 * ever reached, so an anonymous test would have passed against the broken
 * code. The bug needed a real session to reach, and so does its regression.
 */

const ANON = "44444444-4444-4444-8444-444444444444";
/** May, block 2. Never published, in this fixture or anywhere else. */
const UNPUBLISHED_BLOCK = "m9.l1.b2";

process.env.LEARNING_DATA_DIR = "memory://";

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

/* `after()` schedules the reducer sweep and needs a request scope. Inline, as
   the other route suites do. */
vi.mock("next/server", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return { ...real, after: (fn: () => unknown) => void fn };
});

async function submit(blockId: string) {
  const route = await import("../../src/app/api/learning/submit/route");
  return route.POST(
    new Request("http://localhost/api/learning/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blockId,
        answer: { kind: "option", id: "whatever" },
        submissionId: randomUUID(),
      }),
    }),
  );
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
    username: "gate-api-learner",
    displayName: "Оқушы",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
  });
  const token = newToken();
  await store.createSession(userId, hashToken(token), new Date(Date.now() + 3_600_000).toISOString());
  sessionToken = token;
}, 90_000);

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("a signed-in learner cannot be graded on a month nobody approved", () => {
  it("is refused in production, where the gate is real", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    try {
      const res = await submit(UNPUBLISHED_BLOCK);

      /* 404, not 403, matching the teacher routes: a distinct "exists but is
         closed" tells an unauthenticated caller which months are authored. */
      expect(res.status, "an unapproved month must not be gradeable").toBe(404);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.verdict, "nothing may be graded").toBeUndefined();
      expect(body.attested, "least of all attested").toBeUndefined();
      expect(body.saved, "and nothing may be recorded").toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  it("still grades in development, so the suite and local work are unaffected", async () => {
    /* The complement. A gate that closed everywhere would be removed within a
       week, and the real one would go with it. `gateFor` returns
       `bypassedForDevelopment: true` outside production, which is what lets the
       rest of this suite grade every month of the year. */
    vi.resetModules();
    const res = await submit(UNPUBLISHED_BLOCK);
    expect(res.status, "development keeps the documented bypass").not.toBe(404);
  });
});
