import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Judge0RapidApiProvider } from "@schools/exec/providers/judge0";
import { runCases } from "@schools/exec";
import { isInfrastructure, isLearnerEvidence } from "@schools/exec/provider";

/**
 * Judge0 adapter conformance — what is proven here, and what is not.
 *
 * ## PROVEN
 *
 * That `Judge0RapidApiProvider` speaks the shape Judge0 publishes: the body it
 * POSTs carries JUDGE0'S units (seconds, kilobytes) for a request written in
 * OURS (milliseconds, megabytes), the two RapidAPI headers are present, `wait`
 * is false, `expected_output` is absent, queued and processing are not read as
 * answers, and every failure the marketplace can return maps to the right
 * `ExecutionStatus` with the learner/infrastructure boundary intact.
 *
 * ## NOT PROVEN — and it cannot be, here
 *
 * That any of it works against RapidAPI. **There is no key in this repository
 * and nothing in this suite has ever contacted `judge0-ce.p.rapidapi.com`.**
 * The fake below is an HTTP server returning fixtures; it does not run Python,
 * it has no sandbox, and it will happily accept a `cpu_time_limit` that a real
 * plan refuses. Which Python the plan exposes, what its real ceilings are,
 * whether `POST /submissions/batch` exists on it, and where the rate limit
 * actually falls are all UNKNOWN until someone holds a key.
 *
 * The split is the same one `tests/exec/fake-piston.ts` draws: adapter
 * correctness and service correctness are different claims, and a fake that
 * pretended to be both would let a broken subscription pass a green suite.
 *
 * The dangerous bug this file is aimed at is not "returns the wrong status" —
 * that is caught immediately. It is "sends a field the judge ignores": limits
 * in the wrong unit, which a judge accepts, silently substitutes its own
 * default for, and answers successfully. A learner's five-second budget
 * quietly becomes two and a correct program is recorded as too slow.
 */

interface Recorded { method: string; url: string; headers: Record<string, string | string[] | undefined>; body: unknown }

function start(handler: (req: { method: string; url: string; body: unknown }, respond: (status: number, body: unknown) => void) => void) {
  const recorded: Recorded[] = [];
  const server: Server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : undefined;
      recorded.push({ method: req.method ?? "", url: req.url ?? "", headers: req.headers, body });
      handler({ method: req.method ?? "", url: req.url ?? "", body }, (status, out) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(out));
      });
    });
  });
  return new Promise<{ url: string; recorded: Recorded[]; close: () => Promise<void> }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        recorded,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

const TOKEN = "11111111-2222-4333-8444-555555555555";
const REQ = { language: "python3" as const, sourceCode: 'print("hi")', stdin: "1\n", timeLimitMs: 5_000, memoryLimitMb: 256 };

let close: (() => Promise<void>) | null = null;
afterEach(async () => { await close?.(); close = null; });

function provider(baseUrl: string, over: Partial<ConstructorParameters<typeof Judge0RapidApiProvider>[0]> = {}) {
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

/**
 * Encode a fixture field the way the real service does.
 *
 * These fixtures used to carry plain strings, which was a faithful model of a
 * protocol RapidAPI does not offer. Measured: `base64_encoded=false` makes a
 * poll for a program printing Kazakh return HTTP 400 —
 * "some attributes for this submission cannot be converted to UTF-8, use
 * base64_encoded=true". So the adapter now asks for base64 and the judge
 * answers in it, and a fixture that answers in plain text is testing nothing
 * that exists.
 */
const b64 = (value: string): string => Buffer.from(value, "utf8").toString("base64");

const LANGS = [
  { id: 71, name: "Python (3.8.1)" },
  { id: 92, name: "Python (3.11.2)" },
  { id: 109, name: "Python (3.13.2)" },
  { id: 99, name: "Python for ML (3.11.2)" },
  { id: 63, name: "JavaScript (Node.js 22)" },
];

describe("judge0 adapter", () => {
  it("discovers python 3, sends judge0 units, polls past in-queue, and returns ok", async () => {
    let polls = 0;
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      if (req.method === "POST") return respond(201, { token: TOKEN });
      polls += 1;
      if (polls === 1) return respond(200, { status_id: 1 });
      if (polls === 2) return respond(200, { status_id: 2 });
      return respond(200, { status_id: 3, stdout: b64("hi\n"), stderr: null, time: "0.01", memory: 3200, exit_code: 0 });
    });
    close = s.close;

    const r = await provider(s.url).run(REQ);
    expect(r.status).toBe("ok");
    expect(r.stdout).toBe("hi\n");
    expect(r.memoryKb).toBe(3200);
    expect(r.infrastructureError).toBe(false);

    const post = s.recorded.find((x) => x.method === "POST")!;
    /* `base64_encoded=true`, and it is load-bearing rather than cosmetic: the
       real service returns HTTP 400 for a program printing Kazakh without it.
       This assertion used to pin `false` and so guarded the wrong protocol. */
    expect(post.url).toBe("/submissions?base64_encoded=true&wait=false");
    expect(post.headers["x-rapidapi-key"]).toBe("SECRET-KEY-DO-NOT-LEAK");
    expect(post.headers["x-rapidapi-host"]).toBe("judge0-ce.p.rapidapi.com");
    const body = post.body as Record<string, unknown>;
    expect(body.language_id).toBe(109);          // highest plain Python 3, not "for ML"
    expect(body.cpu_time_limit).toBe(5);          // ms -> SECONDS
    expect(body.wall_time_limit).toBe(7);
    expect(body.memory_limit).toBe(262144);       // MB -> KILOBYTES
    expect(body.enable_network).toBe(false);
    expect(body.redirect_stderr_to_stdout).toBe(false);
    expect(body).not.toHaveProperty("expected_output");
    expect(polls).toBe(3);
    // Language discovery is cached per process: a second run asks once only.
    await provider(s.url).run(REQ);
    expect(s.recorded.filter((x) => x.url.startsWith("/languages"))).toHaveLength(1);
  });

  it("reads a python SyntaxError arriving as a runtime failure as compile_error", async () => {
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      if (req.method === "POST") return respond(201, { token: TOKEN });
      return respond(200, { status_id: 11, stdout: null, stderr: b64("  File \"main.py\", line 1\nSyntaxError: '(' was never closed\n"), exit_code: 1 });
    });
    close = s.close;
    const r = await provider(s.url).run(REQ);
    expect(r.status).toBe("compile_error");
    expect(r.infrastructureError).toBe(false);
  });

  it("keeps the learner's TLE and the judge's failures apart", async () => {
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      if (req.method === "POST") return respond(201, { token: TOKEN });
      return respond(200, { status_id: 5, stdout: b64("partial\n"), stderr: null, time: "5.0" });
    });
    close = s.close;
    const r = await provider(s.url).run(REQ);
    expect(r.status).toBe("time_limit_exceeded");
    expect(r.infrastructureError).toBe(false);   // EVIDENCE about the algorithm
  });

  it("maps 429 to provider_rate_limited and 401 to provider_error, leaking nothing", async () => {
    for (const [http, expected] of [[429, "provider_rate_limited"], [401, "provider_error"]] as const) {
      const s = await start((req, respond) => {
        if (req.url.startsWith("/languages")) return respond(200, LANGS);
        respond(http, { message: b64("key SECRET-KEY-DO-NOT-LEAK is not subscribed") });
      });
      const r = await provider(s.url).run(REQ);
      expect(r.status).toBe(expected);
      expect(r.infrastructureError).toBe(true);
      expect(r.stderr).not.toContain("SECRET");
      expect(r.stderr).not.toContain("subscribed");
      await s.close();
    }
  });

  it("refuses a token that is not a token rather than putting it in a URL", async () => {
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      respond(201, { token: "../../languages" });
    });
    close = s.close;
    const r = await provider(s.url).run(REQ);
    expect(r.status).toBe("provider_error");
    expect(s.recorded.filter((x) => x.method === "GET" && x.url.includes("languages"))).toHaveLength(1);
  });

  it("fails discovery loudly rather than guessing an id", async () => {
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, [{ id: 63, name: "JavaScript (Node.js 22)" }]);
      respond(201, { token: TOKEN });
    });
    close = s.close;
    const r = await provider(s.url).run(REQ);
    expect(r.status).toBe("provider_error");
    expect(r.infrastructureError).toBe(true);
    expect(s.recorded.some((x) => x.method === "POST")).toBe(false);
  });

  it("honours JUDGE0_LANGUAGE_ID without asking", async () => {
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(500, {});
      if (req.method === "POST") return respond(201, { token: TOKEN });
      return respond(200, { status_id: 3, stdout: b64("hi\n") });
    });
    close = s.close;
    const r = await provider(s.url, { languageId: 92 }).run(REQ);
    expect(r.status).toBe("ok");
    expect((s.recorded.find((x) => x.method === "POST")!.body as Record<string, unknown>).language_id).toBe(92);
  });

  it("runs a submission's cases through runBatch and stops at the first outage", async () => {
    let n = 0;
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      if (req.method === "POST") {
        n += 1;
        return respond(201, { token: `1111111${n}-2222-4333-8444-555555555555` });
      }
      // Case 2's submission is the one the judge dies on.
      if (req.url.includes("11111112")) return respond(503, {});
      return respond(200, { status_id: 3, stdout: b64("7\n") });
    });
    close = s.close;
    const p = provider(s.url);
    expect(typeof p.runBatch).toBe("function");
    const out = await runCases(p, "print(7)", [
      { input: "1", expectedOutput: "7" },
      { input: "2", expectedOutput: "7" },
      { input: "3", expectedOutput: "7" },
    ]);
    expect(out.infrastructureFailed).toBe(true);
    expect(out.results).toHaveLength(1);
    expect(out.results[0].passed).toBe(true);
  });

  it("uses one POST for a whole batch when the endpoint is enabled, and keeps the order", async () => {
    /* UNVERIFIED against a real plan — see the file header. What this asserts is
       only that our own mapping from tokens back to cases is right, which is
       the part that would silently attribute one case's output to another. */
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      if (req.method === "POST") {
        const submissions = (req.body as { submissions: unknown[] }).submissions;
        expect(submissions).toHaveLength(3);
        return respond(201, submissions.map((_, i) => ({ token: `1111111${i}-2222-4333-8444-555555555555` })));
      }
      return respond(200, {
        submissions: [
          { token: "11111110-2222-4333-8444-555555555555", status_id: 3, stdout: b64("a\n") },
          { token: "11111111-2222-4333-8444-555555555555", status_id: 3, stdout: b64("b\n") },
          { token: "11111112-2222-4333-8444-555555555555", status_id: 3, stdout: b64("c\n") },
        ],
      });
    });
    close = s.close;

    const results = await provider(s.url, { batchEnabled: true }).runBatch([
      { ...REQ, stdin: "a\n" },
      { ...REQ, stdin: "b\n" },
      { ...REQ, stdin: "c\n" },
    ]);
    expect(results.map((r) => r.stdout)).toEqual(["a\n", "b\n", "c\n"]);
    expect(s.recorded.filter((x) => x.method === "POST")).toHaveLength(1);
  });

  it("reports a case the batch endpoint would not create as unmeasured, not as wrong", async () => {
    const s = await start((req, respond) => {
      if (req.url.startsWith("/languages")) return respond(200, LANGS);
      if (req.method === "POST") {
        return respond(201, [
          { token: "11111110-2222-4333-8444-555555555555" },
          { error: "the plan's batch size is smaller than this" },
        ]);
      }
      return respond(200, {
        submissions: [{ token: "11111110-2222-4333-8444-555555555555", status_id: 3, stdout: b64("a\n") }],
      });
    });
    close = s.close;

    const results = await provider(s.url, { batchEnabled: true }).runBatch([REQ, REQ]);
    expect(results[0].status).toBe("ok");
    expect(results[1].status).toBe("provider_error");
    expect(results[1].infrastructureError).toBe(true);
  });
});

describe("the status a metered judge needed", () => {
  it("is infrastructure, and is never evidence about a learner", () => {
    /* The whole reason `provider_rate_limited` is a member rather than a shade
       of `provider_error`: an operator can tell "over quota" from "down". What
       it must never buy is a different answer to the only question that touches
       a child — nothing ran, so nothing may be recorded. */
    expect(isInfrastructure("provider_rate_limited")).toBe(true);
    expect(isLearnerEvidence("provider_rate_limited")).toBe(false);
    // And the distinction it must not blur, restated at the port.
    expect(isLearnerEvidence("time_limit_exceeded")).toBe(true);
  });
});
