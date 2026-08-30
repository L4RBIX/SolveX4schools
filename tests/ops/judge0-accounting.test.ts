import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  Judge0RapidApiProvider,
  resetJudge0GateForTests,
} from "@schools/exec/providers/judge0";
import { counterSnapshot, resetCounters } from "@schools/ops/counters";
import { startFakeJudge0, type FakeJudge0 } from "../exec/judge0-fake";

/**
 * The judge's meter, wired to something.
 *
 * ## The defect this closes
 *
 * `recordJudge0Request` existed, `JUDGE0_RAPIDAPI_SETUP.md` documented it, and
 * `schools/ops/judge-probe.ts` named it twice as the thing feeding the quota
 * view — and **nothing ever called it**. Every `judge0.*` counter read zero and
 * `providerQuota()` stayed null however much a deployment actually spent.
 *
 * On a metered plan that is the one number an operator needs, and it was
 * permanently blank while the health view reported it as though it meant
 * something. It is also why the live validator meters at `fetch` instead of
 * reading these counters — it could not trust them.
 */

let fake: FakeJudge0 | null = null;

beforeEach(() => {
  resetJudge0GateForTests();
  resetCounters();
});

afterEach(async () => {
  await fake?.close();
  fake = null;
});

function provider(baseUrl: string) {
  return new Judge0RapidApiProvider({
    apiKey: "SECRET-KEY-DO-NOT-LEAK",
    host: "judge0-ce.p.rapidapi.com",
    baseUrl,
    maxConcurrentRequests: 4,
    pollIntervalMs: 5,
    queueWaitMs: 2_000,
    overheadBudgetMs: 3_000,
    batchEnabled: false,
  });
}

const REQ = {
  language: "python3" as const,
  sourceCode: "print(1)",
  stdin: "",
  timeLimitMs: 2_000,
  memoryLimitMb: 256,
};

describe("every request to the metered judge is counted", () => {
  it("counts the submission, its polls, and the language lookup separately", async () => {
    fake = await startFakeJudge0({ pendingRounds: 2 });
    const result = await provider(fake.url).run(REQ);
    expect(result.infrastructureError).toBe(false);

    const c = counterSnapshot().values;
    /* Separate numbers because they answer different questions: submissions is
       what Judge0 charges for, polls is what turns one submission into several
       billable HTTP calls, and a language lookup that happens more than once
       per process is a caching bug. */
    expect(c["judge0.submissions"], "one program, one submission").toBe(1);
    expect(c["judge0.polls"], "and the polls it took to get an answer").toBeGreaterThan(0);
    expect(c["judge0.language_lookups"], "discovery, once").toBe(1);
    expect(
      c["judge0.requests"],
      "the total is every HTTP call, which is what RapidAPI bills",
    ).toBe(
      (c["judge0.submissions"] ?? 0) +
        (c["judge0.polls"] ?? 0) +
        (c["judge0.language_lookups"] ?? 0),
    );
  });

  it("counts a 429 rather than losing it", async () => {
    /* The failures matter more than the successes here. An accounting that
       counted only 2xx would go blank at exactly the moment an operator needs
       to know what is happening — and would make "over quota" indistinguishable
       from "nobody submitted anything". */
    fake = await startFakeJudge0();
    fake.setHandler(() => ({ kind: "http", status: 429 }));
    const result = await provider(fake.url).run(REQ);

    expect(result.status).toBe("provider_rate_limited");
    const c = counterSnapshot().values;
    expect(c["judge0.requests"], "a refused request is still a request").toBeGreaterThan(0);
  });

  it("counts a request that never got an answer at all", async () => {
    fake = await startFakeJudge0();
    fake.setHandler(() => ({ kind: "hang" }));
    const result = await provider(fake.url).run({ ...REQ, timeLimitMs: 200 });

    expect(result.infrastructureError).toBe(true);
    expect(
      counterSnapshot().values["judge0.requests"],
      "no response is still a billable call",
    ).toBeGreaterThan(0);
  });
});
