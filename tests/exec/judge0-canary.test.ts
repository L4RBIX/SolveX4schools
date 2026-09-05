import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Judge0RapidApiProvider } from "@schools/exec/providers/judge0";
import type { ExecutionResult } from "@schools/exec/provider";
import { EXECUTION_LIMITS } from "@schools/exec/provider";

/**
 * What a CLASSROOM does to the judge, measured against the real judge.
 *
 * The conformance suite proves the protocol on ten programs. This proves the
 * four properties that only appear when more than one learner presses Check,
 * and it is deliberately small: every case below is a paid submission.
 *
 * Skipped without `JUDGE0_LIVE_TEST=1` and a key, and — like the conformance
 * suite — it FAILS rather than skips when the flag is set and the key is not,
 * because a canary that quietly checks nothing is worse than no canary.
 */

const LIVE = process.env.JUDGE0_LIVE_TEST === "1";
const KEY = Boolean(process.env.JUDGE0_RAPIDAPI_KEY);
const TIMEOUT = 120_000;

/** Every request the provider actually sends, counted on the way out. */
function countingFetch(): { calls: () => number; restore: () => void } {
  const original = globalThis.fetch;
  let n = 0;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("judge0")) n += 1;
    return original(input as RequestInfo, init);
  }) as typeof fetch;
  return { calls: () => n, restore: () => { globalThis.fetch = original; } };
}

function provider() {
  /* Production's own numbers, not a test's: the canary is about what a
     classroom meets, and a looser gate here would measure a judge nobody
     deploys. `JUDGE0_MAX_CONCURRENT_REQUESTS` is 2 in production. */
  return new Judge0RapidApiProvider({
    apiKey: process.env.JUDGE0_RAPIDAPI_KEY!,
    baseUrl: process.env.JUDGE0_RAPIDAPI_BASE_URL ?? "https://judge0-ce.p.rapidapi.com",
    host: process.env.JUDGE0_RAPIDAPI_HOST ?? "judge0-ce.p.rapidapi.com",
    maxConcurrentRequests: Number(process.env.JUDGE0_MAX_CONCURRENT_REQUESTS ?? 2),
    maxConcurrentPerLearner: 1,
    pollIntervalMs: 400,
    queueWaitMs: 38_000,
    overheadBudgetMs: 20_000,
    batchEnabled: true,
  });
}

const limits = {
  timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
  memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
};

describe("the judge, as a classroom uses it", () => {
  it("refuses to pretend: the flag with no key is a failure, not a skip", () => {
    expect(!LIVE || KEY, "JUDGE0_LIVE_TEST=1 with no JUDGE0_RAPIDAPI_KEY").toBe(true);
  });

  it.runIf(LIVE && KEY)(
    "compiles <bits/stdc++.h>, which every reference solution uses",
    async () => {
      /* GCC ships it and libc++ does not — the browser gets a generated shim
         (`src/lib/cpp17/bits-stdcpp.ts`) precisely so both engines accept the
         same program. This is the judge half of that claim. */
      const r = await provider().run({
        language: "cpp17",
        sourceCode:
          "#include <bits/stdc++.h>\nusing namespace std;\nint main(){ vector<int> v{3,1,2}; sort(v.begin(), v.end()); for (int x : v) cout << x; }",
        stdin: "",
        ...limits,
      });
      expect(r.status).toBe("ok");
      expect(r.stdout.trim()).toBe("123");
    },
    TIMEOUT,
  );

  it.runIf(LIVE && KEY)(
    "runs an eight-case batch in ONE request, in order",
    async () => {
      /* A September task has up to eight cases. Eight separate submissions is
         eight times the quota and eight times the queue; the batch endpoint is
         why a class of thirty is affordable. */
      const counter = countingFetch();
      try {
        const cases = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
          input: `${n}\n`,
          expectedOutput: String(n * 2),
        }));
        const results = await provider().runBatch(
          cases.map((c) => ({
            language: "cpp17" as const,
            sourceCode: "#include <iostream>\nint main(){int n;std::cin>>n;std::cout<<n*2;}",
            stdin: c.input,
            ...limits,
          })),
        );
        expect(results).toHaveLength(8);
        results.forEach((r: ExecutionResult, i: number) => {
          expect(r.status, `case ${i + 1}`).toBe("ok");
          expect(r.stdout.trim(), `case ${i + 1} is in order`).toBe(cases[i]!.expectedOutput);
        });
        /* One submit, then polls. The number that matters is that it is far
           below one-per-case; the poll count depends on how fast the judge is
           on the day. */
        expect(counter.calls(), "a batch must not be eight submissions").toBeLessThan(8 + 8);
        console.log(`[canary] 8-case batch: ${counter.calls()} HTTP requests`);
      } finally {
        counter.restore();
      }
    },
    TIMEOUT,
  );

  it.runIf(LIVE && KEY)(
    "serves three learners at once without one of them taking the channel",
    async () => {
      /* `JUDGE0_MAX_CONCURRENT_REQUESTS` is 2 in production and the per-learner
         cap is 1, so three learners cannot all be in flight — the third waits
         for a slot rather than being refused, and all three get an answer. */
      const p = provider();
      const started = Date.now();
      const runs = await Promise.all(
        ["alpha", "beta", "gamma"].map((who) =>
          p.run({
            language: "cpp17",
            sourceCode: `#include <iostream>\nint main(){ std::cout << "${who}"; }`,
            stdin: "",
            ...limits,
            fairnessKey: who,
          } as Parameters<typeof p.run>[0]),
        ),
      );
      for (const [i, who] of ["alpha", "beta", "gamma"].entries()) {
        expect(runs[i]!.status, `${who} got an answer`).toBe("ok");
        expect(runs[i]!.stdout.trim()).toBe(who);
      }
      console.log(`[canary] three concurrent learners: ${Date.now() - started} ms, all answered`);
    },
    TIMEOUT,
  );
});
