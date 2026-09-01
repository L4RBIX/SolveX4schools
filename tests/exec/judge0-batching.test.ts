import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Judge0RapidApiProvider, resetJudge0GateForTests } from "@schools/exec/providers/judge0";
import { runCases } from "@schools/exec";

/**
 * How a Check is SCHEDULED, and the one property that must survive changing it.
 *
 * ## The defect this file is about
 *
 * `runCases` issues one Judge0 submission per DECLARED case. The median code
 * block in the curriculum declares 8, and the process-wide gate is 2 in
 * production — so a median Check used to be eight submissions in four
 * sequential waves. Measured against the real service on `m2.l6.b6` (8 cases,
 * its own reference solution): **9 746 ms and 30 billable requests** with
 * `JUDGE0_BATCH=false`, **2 668 ms and 4 billable requests** with it on, the
 * eight verdicts byte-identical between the two runs.
 *
 * The batch endpoint is therefore now the default. It is a pure scheduling
 * change and this file's job is to keep it one:
 *
 * - the same number of cases is run, in the same order;
 * - each case is judged by the same judge on the same program and stdin;
 * - the verdict `runCases` produces is identical whichever path ran it.
 *
 * ## What is NOT proven here
 *
 * That the plan honours `POST /submissions/batch`. It does — HTTP 201 with
 * correct per-case results, measured 2026-09-01 — but the proof of that is a
 * live run against `judge0-ce.p.rapidapi.com`, not this fake. The fake below
 * compiles nothing and will accept anything; the same split
 * `judge0-adapter.test.ts` draws applies here.
 */

/* -------------------------------------------------------------------------- */
/* A fake judge that actually computes something                              */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic and stdin-dependent, on purpose.
 *
 * A fake that answers the same fixture to every request cannot tell "the batch
 * path returned the right answers" from "the batch path returned the same
 * answer eight times, and the cases happened to expect it". This one doubles
 * the number it is given, so an off-by-one in token/case alignment shows up as
 * a wrong verdict rather than as a green test.
 */
const b64 = (value: string): string => Buffer.from(value, "utf8").toString("base64");
const unb64 = (value: string): string => Buffer.from(value, "base64").toString("utf8");

const LANGS = [
  { id: 54, name: "C++ (GCC 9.2.0)" },
  { id: 105, name: "C++ (GCC 14.1.0)" },
];

interface FakeJudge {
  url: string;
  close: () => Promise<void>;
  /** Every POST that created submissions, in order, with how many each carried. */
  posts: { path: "single" | "batch"; count: number }[];
  /** Every poll, single or batch. */
  polls: number;
}

function startJudge(): Promise<FakeJudge> {
  const posts: FakeJudge["posts"] = [];
  let polls = 0;
  /** token -> the stdout this submission will answer with. */
  const answers = new Map<string, string>();
  let n = 0;
  const mint = (stdin: string): string => {
    n += 1;
    const token = `1111${String(n).padStart(4, "0")}-2222-4333-8444-555555555555`;
    /* The "program": double the number on stdin. */
    answers.set(token, `${Number(stdin.trim()) * 2}\n`);
    return token;
  };

  const server: Server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://fake");
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(body));
      };

      if (url.pathname === "/languages") return send(200, LANGS);

      if (req.method === "POST" && url.pathname === "/submissions/batch") {
        const subs = (JSON.parse(raw) as { submissions: { stdin: string }[] }).submissions;
        posts.push({ path: "batch", count: subs.length });
        return send(
          201,
          subs.map((s) => ({ token: mint(unb64(s.stdin)) })),
        );
      }

      if (req.method === "POST" && url.pathname === "/submissions") {
        const body = JSON.parse(raw) as { stdin: string };
        posts.push({ path: "single", count: 1 });
        return send(201, { token: mint(unb64(body.stdin)) });
      }

      if (req.method === "GET" && url.pathname === "/submissions/batch") {
        polls += 1;
        const tokens = (url.searchParams.get("tokens") ?? "").split(",").filter(Boolean);
        return send(200, {
          submissions: tokens.map((t) => ({
            token: t,
            status_id: 3,
            stdout: b64(answers.get(t) ?? ""),
          })),
        });
      }

      if (req.method === "GET" && url.pathname.startsWith("/submissions/")) {
        polls += 1;
        const token = url.pathname.slice("/submissions/".length);
        return send(200, { status_id: 3, stdout: b64(answers.get(token) ?? "") });
      }

      return send(404, {});
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
        posts,
        get polls() {
          return polls;
        },
      });
    });
  });
}

let close: (() => Promise<void>) | null = null;
afterEach(async () => {
  await close?.();
  close = null;
  resetJudge0GateForTests();
});

function provider(
  baseUrl: string,
  over: Partial<ConstructorParameters<typeof Judge0RapidApiProvider>[0]> = {},
) {
  /* The gate is memoised on `globalThis` and first-limit-wins, so a suite that
     constructs providers at different limits measures the first one's bound
     unless it is reset. That is exactly the trap `resetJudge0GateForTests`
     exists for. */
  resetJudge0GateForTests();
  return new Judge0RapidApiProvider({
    apiKey: "SECRET-KEY-DO-NOT-LEAK",
    host: "judge0-ce.p.rapidapi.com",
    baseUrl,
    maxConcurrentRequests: 2,
    pollIntervalMs: 1,
    queueWaitMs: 2_000,
    overheadBudgetMs: 3_000,
    batchEnabled: true,
    ...over,
  });
}

/** Eight cases, the curriculum's median, with two the "program" gets wrong. */
const CASES = [
  { input: "1", expectedOutput: "2" },
  { input: "2", expectedOutput: "4" },
  { input: "3", expectedOutput: "6" },
  { input: "4", expectedOutput: "999", hidden: true }, // fails: fake answers 8
  { input: "5", expectedOutput: "10", hidden: true },
  { input: "6", expectedOutput: "12", hidden: true },
  { input: "7", expectedOutput: "0", hidden: true }, // fails: fake answers 14
  { input: "8", expectedOutput: "16", hidden: true },
];

const SOURCE = "#include <iostream>\nint main(){int x;std::cin>>x;std::cout<<x*2<<'\\n';}\n";

/* -------------------------------------------------------------------------- */

describe("batching is a scheduling change and nothing else", () => {
  it("gives byte-identical verdicts on both paths, from the same cases", async () => {
    const s = await startJudge();
    close = s.close;

    const off = await runCases(provider(s.url, { batchEnabled: false }), SOURCE, CASES);
    const on = await runCases(provider(s.url, { batchEnabled: true }), SOURCE, CASES);

    /* The whole claim, asserted on the object the submit route settles from —
       pass/fail, the status, the stored stdout and the hidden flag. */
    expect(on.results).toEqual(off.results);
    expect(on.infrastructureFailed).toBe(false);

    /* And the mix is real: a comparison over eight identical passes would hold
       even if alignment were broken. */
    expect(off.results.map((r) => r.passed)).toEqual([
      true, true, true, false, true, true, false, true,
    ]);
    expect(off.results.map((r) => r.actual)).toEqual([
      "2\n", "4\n", "6\n", "8\n", "10\n", "12\n", "14\n", "16\n",
    ]);
  });

  it("runs every declared case — batching never reduces what is judged", async () => {
    const s = await startJudge();
    close = s.close;

    const out = await runCases(provider(s.url), SOURCE, CASES);
    expect(out.results).toHaveLength(CASES.length);
    /* Counted at the fake, so it is what actually left the process rather than
       what the adapter believes it sent. Eight cases in, eight submissions
       created — in one POST instead of eight. */
    expect(s.posts.reduce((sum, p) => sum + p.count, 0)).toBe(8);
    expect(s.posts).toEqual([{ path: "batch", count: 8 }]);
  });

  it("collapses four sequential waves into one round trip", async () => {
    const s = await startJudge();
    close = s.close;
    await runCases(provider(s.url, { batchEnabled: false }), SOURCE, CASES);
    const singlePosts = s.posts.length;
    const singlePolls = s.polls;

    const t = await startJudge();
    const previous = close;
    close = async () => {
      await previous?.();
      await t.close();
    };
    await runCases(provider(t.url, { batchEnabled: true }), SOURCE, CASES);

    /* The lever, stated as a number rather than as a duration: a wall-clock
       assertion against a localhost fake would measure the fake. Eight POSTs
       through a gate of 2 is four waves; one POST is one. */
    expect(singlePosts).toBe(8);
    expect(t.posts.length).toBe(1);
    expect(t.polls).toBeLessThan(singlePolls);
  });
});

describe("the plan's max_submission_batch_size", () => {
  it("splits a block with more cases than one request may carry", async () => {
    const s = await startJudge();
    close = s.close;

    /* `max_submission_batch_size` is 20 on this plan and the largest block in
       the curriculum declares 18, so nothing chunks today. Forced here with a
       small ceiling, because the failure it prevents is a whole Check reported
       as unmeasured to a whole class the day an author adds a case. */
    const out = await runCases(provider(s.url, { maxBatchSize: 3 }), SOURCE, CASES);

    expect(s.posts).toEqual([
      { path: "batch", count: 3 },
      { path: "batch", count: 3 },
      { path: "batch", count: 2 },
    ]);
    /* Chunking must not reorder. The results still line up with the cases that
       asked for them, which is the property a wrong `flat()` would break. */
    expect(out.results.map((r) => r.actual)).toEqual([
      "2\n", "4\n", "6\n", "8\n", "10\n", "12\n", "14\n", "16\n",
    ]);
    expect(out.results.map((r) => r.passed)).toEqual([
      true, true, true, false, true, true, false, true,
    ]);
  });

  it("does not chunk a block that fits", async () => {
    const s = await startJudge();
    close = s.close;
    await runCases(provider(s.url, { maxBatchSize: 20 }), SOURCE, CASES);
    expect(s.posts).toEqual([{ path: "batch", count: 8 }]);
  });
});

/* -------------------------------------------------------------------------- */
/* The knobs, as an operator sets them                                        */
/* -------------------------------------------------------------------------- */

describe("the Judge0 batch configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function judge0Config(vars: Record<string, string>) {
    vi.resetModules();
    for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
    const { config } = await import("../../schools/config");
    return config.exec.judge0;
  }

  it("is ON when nobody has said anything, which is the change", async () => {
    /* It used to read `=== "true"`. A deployment that set nothing got the slow
       path, and every production deployment sets nothing. */
    expect((await judge0Config({})).batchEnabled).toBe(true);
  });

  it("is OFF only when an operator asks for it off", async () => {
    expect((await judge0Config({ JUDGE0_BATCH: "false" })).batchEnabled).toBe(false);
  });

  it("stays on for a stale JUDGE0_BATCH=true", async () => {
    expect((await judge0Config({ JUDGE0_BATCH: "true" })).batchEnabled).toBe(true);
  });

  it("defaults the batch size to the plan's declared ceiling", async () => {
    expect((await judge0Config({})).maxBatchSize).toBe(20);
  });

  it("takes an operator's smaller ceiling, and ignores a typo", async () => {
    expect((await judge0Config({ JUDGE0_MAX_BATCH_SIZE: "5" })).maxBatchSize).toBe(5);
    expect((await judge0Config({ JUDGE0_MAX_BATCH_SIZE: "lots" })).maxBatchSize).toBe(20);
  });

  it("leaves the concurrency gate where it was", async () => {
    /* Deliberate, and the reason is in `schools/config.ts`: the plan's real
       rate limit is still unreadable, and the batch already bought the latency
       that raising this would have bought. If someone raises it later, this
       test failing is the prompt to go and read the plan first. */
    expect((await judge0Config({})).maxConcurrentRequests).toBe(2);
  });
});
