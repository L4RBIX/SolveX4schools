import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The scheduled work has an entry point, and it is not open to the internet.
 *
 * ## What this replaces
 *
 * Two `setInterval`s in `src/instrumentation.ts`. On a long-running Node server
 * they are correct; on Vercel a lambda is created for a request and frozen
 * after it, so a twenty-second interval fires zero times, and every warm
 * instance that does exist runs its own copy of a job meant to run once.
 *
 * `LEARNING_CRON_SECRET` had been in `schools/config.ts` since it was written
 * with no consumer anywhere, and the operational docs told an operator to
 * schedule `POST /api/learning/reduce`, which does not exist.
 *
 * ## What these assert
 *
 * That the door is shut. A route that does scheduled work for anyone who finds
 * it is a route that lets a stranger settle a school's league whenever they
 * like — and, on a metered database, spend its budget.
 *
 * 404 rather than 401 throughout, matching the teacher routes: the existence of
 * an unguarded cron endpoint is itself the interesting fact.
 */

process.env.LEARNING_DATA_DIR = "memory://";
const SECRET = "a-long-enough-cron-secret-value";

async function call(headers: Record<string, string> = {}, method = "GET") {
  const route = await import("../../src/app/api/cron/route");
  const request = new Request("http://localhost/api/cron", { method, headers });
  return method === "GET" ? route.GET(request) : route.POST(request);
}

beforeAll(async () => {
  /* A store, so a successful call has something real to sweep. */
  await (await import("@schools/store")).getStore();
}, 90_000);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the cron endpoint", () => {
  it("does not exist when no secret is configured", async () => {
    vi.stubEnv("LEARNING_CRON_SECRET", "");
    vi.resetModules();
    const res = await call({ authorization: `Bearer ${SECRET}` });
    expect(
      res.status,
      "an unconfigured cron route must not do scheduled work for a stranger",
    ).toBe(404);
  });

  it("refuses a request with no credential", async () => {
    vi.stubEnv("LEARNING_CRON_SECRET", SECRET);
    vi.resetModules();
    expect((await call()).status).toBe(404);
  });

  it("refuses the wrong credential, and a near miss", async () => {
    vi.stubEnv("LEARNING_CRON_SECRET", SECRET);
    vi.resetModules();
    expect((await call({ authorization: "Bearer nope" })).status).toBe(404);
    /* One character out, same length — the case a non-constant-time compare
       would leak the position of. */
    expect((await call({ authorization: `Bearer ${SECRET.slice(0, -1)}X` })).status).toBe(404);
    /* And the scheme matters: a bare secret is not a Bearer token. */
    expect((await call({ authorization: SECRET })).status).toBe(404);
  });

  it("runs the scheduled work for the right credential", async () => {
    vi.stubEnv("LEARNING_CRON_SECRET", SECRET);
    vi.resetModules();
    const res = await call({ authorization: `Bearer ${SECRET}` });
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    /* Both jobs report, and each is guarded separately: one failing must not
       stop the other, because a league that cannot settle is no reason to
       leave a class's projections stale for another day. */
    expect(body.sweep, "the reducer sweep must report").toBeDefined();
    expect(body.leagues, "the league settlement must report").toBeDefined();
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("answers a POST as well, because a runbook uses curl", async () => {
    vi.stubEnv("LEARNING_CRON_SECRET", SECRET);
    vi.resetModules();
    expect((await call({ authorization: `Bearer ${SECRET}` }, "POST")).status).toBe(200);
  });
});

describe("the schedule itself", () => {
  it("is declared where the platform reads it", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const vercel = JSON.parse(readFileSync(`${root}vercel.json`, "utf8")) as {
      crons?: { path: string; schedule: string }[];
    };

    expect(vercel.crons, "nothing scheduled it, which is how it ran for a year").toBeDefined();
    const cron = vercel.crons!.find((c) => c.path === "/api/cron");
    expect(cron, "the route must be the one that is scheduled").toBeDefined();
    /* Daily is what the plan allows, and it is enough: settlement is weekly and
       the sweep is request-driven. Correctness does not depend on either — the
       league settles inside the award that would otherwise read a stale tier. */
    expect(cron!.schedule).toMatch(/^\d+ \d+ \* \* \*$/);
  });
});

describe("the in-process interval", () => {
  it("defaults off where the platform freezes it", async () => {
    /* `!== "false"` meant on unless somebody remembered to turn it off, and
       nobody had. On Vercel the interval fires zero times while every warm
       instance carries its own copy. */
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("LEARNING_SWEEP_IN_PROCESS", "");
    vi.resetModules();
    expect((await import("@schools/config")).config.sweep.inProcess).toBe(false);
  });

  it("stays on for a self-hosted deployment", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("LEARNING_SWEEP_IN_PROCESS", "");
    vi.resetModules();
    expect((await import("@schools/config")).config.sweep.inProcess).toBe(true);
  });

  it("still obeys an operator who says either word", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("LEARNING_SWEEP_IN_PROCESS", "true");
    vi.resetModules();
    expect((await import("@schools/config")).config.sweep.inProcess).toBe(true);

    vi.stubEnv("VERCEL", "");
    vi.stubEnv("LEARNING_SWEEP_IN_PROCESS", "false");
    vi.resetModules();
    expect((await import("@schools/config")).config.sweep.inProcess).toBe(false);
  });
});
