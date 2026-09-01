import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  Judge0RapidApiProvider,
  resetJudge0GateForTests,
} from "@schools/exec/providers/judge0";
import { runCases } from "@schools/exec";
import { isLearnerEvidence } from "@schools/exec/provider";
import { startFakeJudge0, type FakeJudge0 } from "./judge0-fake";

/**
 * The three claims where being wrong costs real money or fabricates evidence.
 *
 * Written because the adversarial review of this integration never ran — the
 * agents that would have attacked it died on a session limit — and these are
 * the properties whose failure is silent. A wrong status shows up the first
 * time anyone looks; a retried POST shows up on an invoice, and an unbounded
 * fan-out shows up as a class that cannot Submit.
 *
 * Everything here runs against the protocol-faithful fake in `judge0-fake.ts`.
 * **Nothing in this file has ever contacted RapidAPI**, and none of it proves
 * the service behaves as the fake does — only that our adapter does what it
 * claims when the service behaves that way.
 */

let fake: FakeJudge0 | null = null;

/* The gate is process-global and first-limit-wins by design — correct for a
   server, and it means whichever suite touches it first decides the limit for
   every other one in this vitest worker. Without this reset the concurrency
   test below silently measures somebody else's limit. */
beforeEach(() => resetJudge0GateForTests());

afterEach(async () => {
  await fake?.close();
  fake = null;
});

const LANGS = [{ id: 54, name: "C++ (GCC 9.2.0)" }, { id: 105, name: "C++ (GCC 14.1.0)" }];

function provider(baseUrl: string, over: Record<string, unknown> = {}) {
  return new Judge0RapidApiProvider({
    apiKey: "SECRET-KEY-DO-NOT-LEAK",
    host: "judge0-ce.p.rapidapi.com",
    baseUrl,
    maxConcurrentRequests: 4,
    pollIntervalMs: 5,
    queueWaitMs: 2_000,
    overheadBudgetMs: 3_000,
    batchEnabled: false,
    ...over,
  });
}

/** One trivial C++ program, shared by the request fixture and the case runs. */
const CANARY = '#include <iostream>\nint main() { std::cout << 1 << "\\n"; }\n';

const REQ = {
  language: "cpp17" as const,
  sourceCode: CANARY,
  stdin: "",
  timeLimitMs: 5_000,
  memoryLimitMb: 256,
};

const posts = (f: FakeJudge0) =>
  f.requests.filter((r) => r.method === "POST" && r.path.startsWith("/submissions")).length;

describe("a submission is never created twice", () => {
  it("does not retry the POST after the judge hangs up on it", async () => {
    /* The expensive mistake. A POST whose response is lost is AMBIGUOUS — the
       submission may well have been created. Retrying it runs a
       fourteen-year-old's program a second time, bills for it a second time,
       and on a plan measured in dozens per day that is the difference between
       a working class and an exhausted quota.
       GETs are idempotent and ARE retried; the POST must not be. */
    fake = await startFakeJudge0();
    fake.setHandler((ctx) =>
      ctx.method === "POST" ? { kind: "hang" } : { kind: "default" },
    );
    /* The provider's deadline is `timeLimitMs + overheadBudgetMs`, so both have
       to fit inside vitest's default 5s or the TEST times out first and proves
       nothing about the provider. */
    const result = await provider(fake.url, { overheadBudgetMs: 300 }).run({
      ...REQ,
      timeLimitMs: 300,
    });

    expect(result.infrastructureError, "a hung POST is ours, not the learner's").toBe(true);
    expect(isLearnerEvidence(result.status)).toBe(false);
    expect(
      posts(fake),
      "exactly one submission may be created for one press of Check",
    ).toBe(1);
  });

  it("does not retry the POST after a 500 either", async () => {
    /* A 5xx is less ambiguous than a hang and still not safe: Judge0 can create
       the row and fail while answering. One press, one submission. */
    fake = await startFakeJudge0();
    fake.setHandler((ctx) =>
      ctx.method === "POST" ? { kind: "http", status: 500 } : { kind: "default" },
    );
    const result = await provider(fake.url).run(REQ);

    expect(result.infrastructureError).toBe(true);
    expect(posts(fake)).toBe(1);
  });
});

describe("the concurrency gate actually bounds", () => {
  it("never has more submissions in flight than it was told to allow", async () => {
    /* The gate is what stands between eighteen simultaneous presses of Check
       and a plan's rate limit. A gate that is declared and not enforced looks
       identical in every other test — every result is still correct, and the
       bill is not.

       Measured by watching the fake: a POST that has been received and not yet
       answered terminally is a submission in flight. */
    /* `pendingRounds: 0` so one POST is answered by exactly one terminal GET.
       That makes "in flight" countable: up on the POST, down on the GET. The
       first version of this test only ever incremented and duly reported a
       peak of 8 for 8 submissions — it was measuring throughput and calling it
       concurrency. */
    fake = await startFakeJudge0({ pendingRounds: 0 });

    let inFlight = 0;
    let peak = 0;
    fake.setHandler((ctx) => {
      if (ctx.method === "POST") {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
      } else if (ctx.method === "GET" && ctx.path.startsWith("/submissions/")) {
        inFlight -= 1;
      }
      return { kind: "default" };
    });

    const p = provider(fake.url, { maxConcurrentRequests: 2 });
    const cases = Array.from({ length: 8 }, (_, i) => ({
      input: String(i),
      expectedOutput: "1",
    }));
    /* `runCases` drives it exactly as a real submission does, so this is the
       real path and not a hand-rolled fan-out. */
    const { infrastructureFailed } = await runCases(p, CANARY, cases);

    expect(infrastructureFailed).toBe(false);
    expect(posts(fake), "every case must actually have been submitted").toBe(8);
    expect(peak, `peak concurrent submissions was ${peak}, gate said 2`).toBeLessThanOrEqual(2);
  });
});

describe("a provider failure never reaches a learner as a wrong answer", () => {
  /* The trust claim, asserted at the level that matters: not "the status is
     right" but "what `runCases` hands the submit route cannot be graded". Each
     of these is a real thing RapidAPI does. */
  const OUTAGES: [string, number][] = [
    ["over the plan's rate limit", 429],
    ["a rejected key", 401],
    ["a forbidden subscription", 403],
    ["the judge broken", 500],
  ];

  for (const [name, status] of OUTAGES) {
    it(`reports ${name} as unmeasured, with no cases graded`, async () => {
      fake = await startFakeJudge0();
      fake.setHandler(() => ({ kind: "http", status, body: { message: "SECRET-KEY-DO-NOT-LEAK" } }));

      const { results, infrastructureFailed } = await runCases(
        provider(fake.url),
        CANARY,
        [
          { input: "1", expectedOutput: "1" },
          { input: "2", expectedOutput: "1" },
        ],
      );

      expect(infrastructureFailed, "the submit route must settle this as unmeasured").toBe(true);
      expect(
        results.filter((r) => !r.passed),
        "not one case may come back failed — that is a learner being marked wrong for our outage",
      ).toEqual([]);
    });
  }

  it("never repeats what the judge said back to the learner", async () => {
    /* The fake echoes its body, so a key placed in it proves the point: the
       provider must report a fixed sentence, not the vendor's payload. A body
       is where a misconfigured gateway puts a request header. */
    fake = await startFakeJudge0();
    fake.setHandler(() => ({
      kind: "http",
      status: 401,
      body: { error: "bad key SECRET-KEY-DO-NOT-LEAK" },
    }));
    const result = await provider(fake.url).run(REQ);

    expect(result.stderr).not.toContain("SECRET-KEY-DO-NOT-LEAK");
    expect(result.stdout).not.toContain("SECRET-KEY-DO-NOT-LEAK");
    expect(JSON.stringify(result), "not anywhere in the result at all").not.toContain(
      "SECRET-KEY-DO-NOT-LEAK",
    );
  });
});

describe("what the judge is asked for, on the wire", () => {
  it("cannot echo the judge's body, because it never reads it", () => {
    /* Stronger than "does not leak the body": the failure classifier takes a
       STATUS CODE and nothing else, so there is no body in scope to echo. That
       was found by trying to break the runtime test above and discovering the
       injection would not even compile — which is the better guarantee, and is
       worth pinning as a shape rather than as a behaviour.

       A body is where a misconfigured gateway echoes request headers, so "we
       never read it" is a real defence and not pedantry. */
    const src = readFileSync(
      path.join(process.cwd(), "schools/exec/providers/judge0.ts"),
      "utf8",
    );
    /* Asserted on the SIGNATURE, which is where the guarantee actually lives.
       `httpFailure(status: number, fallback: string)` has no response and no
       body in scope, so echoing one is not a discipline anybody has to keep —
       it is a thing that does not compile. Checking the signature is also
       stable against the body being reformatted, which a character-window
       search over the method is not. */
    const decl = src.match(/private httpFailure\(([^)]*)\)/);
    expect(decl, "the failure classifier must be findable").not.toBeNull();
    const params = decl![1];
    expect(params).toContain("status: number");
    for (const forbidden of ["Response", "res", "body", "json", "text"]) {
      expect(
        params,
        `the classifier must not be handed \`${forbidden}\` — a RapidAPI error body ` +
          "can name the plan, the subscription and occasionally the key prefix",
      ).not.toContain(forbidden);
    }

    /* And the branch it exists for really is in there. */
    expect(src).toContain('if (status === 401 || status === 403)');
  });

  it("sends the key as a header and never in a URL", async () => {
    /* A key in a query string is logged by every proxy between here and there,
       and appears in the fake's recorded `query` if it ever happened. */
    fake = await startFakeJudge0();
    fake.setHandler((ctx) =>
      ctx.path === "/languages" ? { kind: "http", status: 200, body: LANGS } : { kind: "default" },
    );
    await provider(fake.url).run(REQ);

    for (const r of fake.requests) {
      expect(r.query, `${r.method} ${r.path} must not carry the key`).not.toContain("SECRET");
      expect(r.path).not.toContain("SECRET");
      expect(r.headers["x-rapidapi-key"], "and must carry it as a header").toBe(
        "SECRET-KEY-DO-NOT-LEAK",
      );
    }
  });

  it("asks the judge not to grade, ever", async () => {
    /* `expected_output` is how Judge0 offers to decide correctness. Accepting
       that would put the answer key on RapidAPI and let a vendor's whitespace
       rules overrule the curriculum's `token`/`exact`/`numeric` checkers. */
    fake = await startFakeJudge0();
    await provider(fake.url).run(REQ);

    const post = fake.requests.find((r) => r.method === "POST");
    expect(post).toBeDefined();
    expect(Object.keys(post!.body as object)).not.toContain("expected_output");
  });
});
