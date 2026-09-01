import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PistonExecutionProvider } from "@schools/exec/providers/piston";
import { runCases, EXECUTION_LIMITS } from "@schools/exec";
import { isInfrastructure, type ExecutionStatus } from "@schools/exec/provider";
import { findBlock, gradeBlock, toLearningVerdictName, type GradeTarget } from "@schools/learning/grade";
import { checkCodeResult } from "@schools/learning/checking";
import {
  pistonCompileFailure,
  pistonKilled,
  pistonRun,
  startFakePiston,
  type FakePiston,
  type FakeReply,
  type PistonExecuteRequest,
} from "./fake-piston";

/**
 * Piston conformance — what is proven here, and what is not.
 *
 * ## PROVEN
 * That `PistonExecutionProvider` speaks Piston's `/api/v2/execute` contract:
 * the request body it sends is one Piston accepts, in Piston's units, and
 * every response Piston can produce is mapped to the right `ExecutionStatus` —
 * with the learner/infrastructure boundary intact on both sides.
 *
 * ## NOT PROVEN
 * That any Piston deployment works. There is no Piston instance behind these
 * tests: the fake is an HTTP server with fixtures, and it can no more prove a
 * container is isolated than a mock database can prove a disk exists. The
 * things a real judge is for — that `import os` cannot read the host, that a
 * fork bomb is contained, that 18 containers fit on the box, that the Kazakh
 * host is reachable from the app — are untested by this file and remain
 * untested until an instance exists.
 *
 * That boundary is the point of writing it down. A green run here means the
 * adapter is not the thing that will be wrong on pilot day.
 */

/* ---------------------------------------------------------------------------
 * C++ fixtures.
 *
 * These are what a real GCC toolchain actually produces, transcribed. They are
 * fixtures, not interpretation: real-compiler evidence for the same programs
 * lives in `tests/exec/execution.test.ts`, which runs them through an actual
 * `g++`.
 * ------------------------------------------------------------------------- */

const P = {
  hello: '#include <iostream>\nint main() { std::cout << "hello\\n"; }\n',
  square: "#include <iostream>\nint main() { long long n; std::cin >> n; std::cout << n * n << \"\\n\"; }\n",
  sumPair:
    "#include <iostream>\nint main() { long long a, b; std::cin >> a >> b; std::cout << a + b << \"\\n\"; }\n",
  /** A missing `;`. The COMPILE stage fails; nothing runs. */
  syntax: "#include <iostream>\nint main() { std::cout << 1 }\n",
  /** Compiles, then dies with the terminate handler's own sentence on stderr. */
  throwing:
    "#include <iostream>\n#include <vector>\nint main() { std::vector<int> v; std::cout << v.at(3); }\n",
  spin: "int main() { while (true) {} }\n",
  chatty:
    "#include <iostream>\nint main() { for (int i = 0; i < 300000; i++) std::cout << i << \"\\n\"; }\n",
  exit3:
    "#include <iostream>\n#include <cstdlib>\nint main() { std::cout << \"partial\\n\"; std::exit(3); }\n",
} as const;

const COMPILE_STDERR =
  "/piston/jobs/9f2c1a/main.cpp: In function 'int main()':\n" +
  "/piston/jobs/9f2c1a/main.cpp:2:28: error: expected ';' before '}' token\n" +
  "    2 | int main() { std::cout << 1 }\n" +
  "      |                            ^\n";

const UNCAUGHT_STDERR =
  "terminate called after throwing an instance of 'std::out_of_range'\n" +
  "  what():  vector::_M_range_check: __n (which is 3) >= this->size() (which is 0)\n";

/**
 * The fake's gcc runtime.
 *
 * The two input-reading programs are COMPUTED from the `stdin` that actually
 * arrived rather than answered from a lookup table. That is the only way a
 * test can tell "we sent stdin correctly" from "we sent nothing and the
 * fixture happened to be right" — and dropping stdin is the single most likely
 * way to grade an entire class wrong while every test still passes.
 *
 * ## What an exhausted stdin does now, and why there is no EOF fixture
 *
 * `input()` raised `EOFError` and CPython exited 1. `std::cin >> n` sets
 * `failbit` and, since C++11, VALUE-INITIALISES the target — so the program
 * carries on with zero, prints an answer and exits 0. A missing stdin is a
 * running, WRONG program rather than a crash. That is a real change in what a
 * learner sees and it is modelled here rather than papered over.
 */
function gccJudge(req: PistonExecuteRequest): FakeReply {
  const source = req.files[0]?.content ?? "";
  const stdin = req.stdin ?? "";

  if (source === P.hello) return { kind: "piston", body: pistonRun({ stdout: "hello\n" }) };

  if (source === P.square) {
    const raw = stdin.split("\n")[0]?.trim() ?? "";
    const n = raw === "" ? 0 : Number(raw);
    return { kind: "piston", body: pistonRun({ stdout: `${n * n}\n` }) };
  }

  if (source === P.sumPair) {
    const parts = (stdin.split("\n")[0] ?? "").trim().split(/\s+/).filter(Boolean);
    const a = Number(parts[0] ?? 0);
    const b = Number(parts[1] ?? 0);
    return { kind: "piston", body: pistonRun({ stdout: `${a + b}\n` }) };
  }

  /* The COMPILE stage fails and the run stage is empty. Structural, and the
     reason the port no longer carries a prose-matching predicate. */
  if (source === P.syntax) {
    return { kind: "piston", body: pistonCompileFailure(COMPILE_STDERR) };
  }
  if (source === P.throwing) {
    return { kind: "piston", body: pistonRun({ stderr: UNCAUGHT_STDERR, code: 134 }) };
  }
  if (source === P.spin) {
    // Piston enforced ITS OWN `run_timeout` and killed the learner's program.
    return { kind: "piston", body: pistonKilled() };
  }
  if (source === P.chatty) {
    // 300k lines of decimal integers. Rounded to a flat 200 KB, which is all
    // that matters: it is comfortably past our 64 KB ceiling.
    return { kind: "piston", body: pistonRun({ stdout: "0123456789".repeat(20_000) }) };
  }
  if (source === P.exit3) {
    return { kind: "piston", body: pistonRun({ stdout: "partial\n", code: 3 }) };
  }

  return { kind: "piston", body: pistonRun({ stdout: "" }) };
}

/**
 * The body of the next `{ ... }` after `from`, by brace counting.
 *
 * Deliberately naive — a brace inside a string literal would break it — because
 * the alternative is a fixed-width regex window that silently matches the WRONG
 * block when a comment grows. It did exactly that once, which is why this
 * exists: a parser that throws is better than a matcher that lies.
 */
function braceBlockAfter(source: string, from: number): string {
  const open = source.indexOf("{", from);
  if (open === -1) throw new Error("no block found");
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error("unbalanced braces");
}

/* ------------------------------------------------------------------------ */

let fake: FakePiston;
let piston: PistonExecutionProvider;

/** Every status this file actually observed, printed at the end as the record. */
const observed: { scenario: string; status: ExecutionStatus; infra: boolean }[] = [];

function record(scenario: string, r: { status: ExecutionStatus; infrastructureError: boolean }) {
  observed.push({ scenario, status: r.status, infra: r.infrastructureError });
  /* Asserted on EVERY observation rather than once: the flag and the status are
     two encodings of the same fact, and the failure that matters is them
     disagreeing on one path while agreeing on the other nine. */
  expect(isInfrastructure(r.status), scenario).toBe(r.infrastructureError);
  return r;
}

const REQ = {
  language: "cpp17" as const,
  stdin: "",
  timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
  memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
};

beforeAll(async () => {
  fake = await startFakePiston(gccJudge);
  piston = new PistonExecutionProvider(fake.baseUrl);
});

beforeEach(() => {
  fake.setHandler(gccJudge);
  fake.reset();
});

afterAll(async () => {
  await fake.stop();
  const rows = observed.map((o) => `  ${o.scenario.padEnd(38)} ${o.status.padEnd(20)} infra=${o.infra}`);
  console.log(`\nOBSERVED STATUSES (${observed.length} observations)\n${rows.join("\n")}\n`);
});

/* =========================================================================
 * The request we put on the wire
 * ====================================================================== */

describe("the request Piston actually receives", () => {
  it("is a Piston v2 execute call, in Piston's units", async () => {
    await piston.run({ ...REQ, sourceCode: P.hello, timeLimitMs: 5_000, memoryLimitMb: 256 });

    const sent = fake.stats.requests[0];
    expect(sent.method).toBe("POST");
    expect(sent.path).toBe("/api/v2/execute");
    expect(sent.body).toEqual({
      language: "c++",
      // A semver RANGE, resolved by Piston against whatever gcc the host
      // installed. Pinning an exact version here makes a routine judge upgrade
      // an outage.
      version: "10.*",
      /* The NAME is load-bearing on this judge: the `.cpp` extension is what
         makes the gcc package build C++ rather than C. */
      files: [{ name: "main.cpp", content: P.hello }],
      stdin: "",
      /* Milliseconds. Piston's `run_timeout` is in ms and this is the learner's
         whole budget: send 5 instead of 5000 and Piston kills every program
         after five milliseconds, reporting a class of 18 as uniformly too slow
         with nothing anywhere logging a problem. */
      run_timeout: 5_000,
      // Bytes. 256 MB, not 256.
      run_memory_limit: 256 * 1024 * 1024,
    });
    expect(fake.stats.violations).toEqual([]);
  });

  it("leaves the judge more headroom than it gives the learner", async () => {
    /* The two limits are layered: Piston kills the learner's program at
       `run_timeout`, our fetch gives up 5s later. If that order ever inverted,
       every genuine learner timeout would arrive as `provider_timeout` and
       December — the month that is entirely about making a program fast
       enough — would produce no evidence at all. Proven here by making the
       judge answer LATE with a kill and checking the kill still wins. */
    fake.setHandler((req) => ({
      kind: "piston",
      body: pistonKilled(),
      delayMs: (req.run_timeout ?? 0) + 300,
    }));

    const r = await piston.run({ ...REQ, sourceCode: P.spin, timeLimitMs: 400 });
    expect(record("judge answers late with a kill", r).status).toBe("time_limit_exceeded");
    expect(r.infrastructureError).toBe(false);
  }, 20_000);
});

/* =========================================================================
 * The ten scenarios
 * ====================================================================== */

describe("ten scenarios, end to end against the wire protocol", () => {
  it("1. a hello-world program is ok", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.hello });
    expect(record("1 hello world", r).status).toBe("ok");
    expect(r.stdout).toBe("hello\n");
    expect(r.exitCode).toBe(0);
    expect(r.providerId).toBe("piston");
  });

  it("2. reads a single stdin value back", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.square, stdin: "7\n" });
    expect(record("2 single stdin value", r).status).toBe("ok");
    expect(r.stdout.trim()).toBe("49");
    // The answer was computed from what arrived, so this is the transport
    // assertion, not a fixture assertion.
    expect(fake.stats.requests[0].body.stdin).toBe("7\n");
  });

  it("2b. NEGATIVE CONTROL: dropping stdin does not silently pass", async () => {
    /* Without this, test 2 would keep passing if the adapter stopped sending
       stdin altogether and the fake fell back to a canned "49".

       ## The failure got QUIETER with the language, which is why it is asserted
       Under CPython a missing stdin raised `EOFError` and the program exited 1
       — a loud `runtime_error` nobody could miss. `std::cin >> n` on empty
       input sets `failbit` and leaves `n` zero-initialised, so the program runs
       to completion, prints `0`, and exits 0. A dropped stdin is now a
       PLAUSIBLE WRONG ANSWER rather than a crash: `ok` with the wrong number,
       which is exactly the shape of a learner's own mistake and would be
       recorded as one. So the assertion moved from the status to the OUTPUT. */
    const r = await piston.run({ ...REQ, sourceCode: P.square, stdin: "" });
    expect(record("2b stdin missing", r).status).toBe("ok");
    expect(r.stdout.trim()).toBe("0");
    expect(r.stdout.trim()).not.toBe("49");
  });

  it("3. reads several whitespace-separated values", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.sumPair, stdin: "3   4\n" });
    expect(record("3 multiple stdin values", r).status).toBe("ok");
    expect(r.stdout.trim()).toBe("7");
    expect(fake.stats.requests[0].body.stdin).toBe("3   4\n");
  });

  it("4. a program that never compiled is compile_error, not a crash", async () => {
    /* The gcc runtime HAS a compile stage, so a missing semicolon arrives with
       `compile.code` non-zero and an empty run stage. Structural: the adapter
       reads a field rather than matching prose.
       The python3 runtime had no compile stage at all, which is why this
       mapping was once a heuristic over stderr — and why it was once wrong,
       telling a learner with a missing bracket that their program crashed while
       running. It never ran. */
    const r = await piston.run({ ...REQ, sourceCode: P.syntax });
    expect(record("4 compile error", r).status).toBe("compile_error");
    expect(r.stderr).toContain("error:");
    expect(r.infrastructureError).toBe(false);
    expect(fake.stats.requests[0].body.files[0].content).toBe(P.syntax);
  });

  it("4b. NEGATIVE CONTROL: a crash whose stderr LOOKS like a diagnostic is not one", async () => {
    /* The regression the structural read replaces the old heuristic with. This
       program compiled — `compile.code` is 0 — and then printed something that
       matches every pattern a prose-matching predicate would have looked for.
       It RAN, so it is a runtime error, and the learner must be told to look at
       their logic rather than their punctuation. */
    fake.setHandler(() => ({
      kind: "piston",
      body: pistonRun({ stdout: "checking\n", stderr: "main.cpp: error: printed by the program\n", code: 1 }),
    }));
    const r = await piston.run({ ...REQ, sourceCode: P.hello });
    expect(record("4b crash that prints error:", r).status).toBe("runtime_error");
    expect(r.infrastructureError).toBe(false);
  });

  it("5. a runtime error is runtime_error", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.throwing });
    expect(record("5 uncaught exception", r).status).toBe("runtime_error");
    /* The terminate handler's own sentence. It is the only thing the learner
       has to work from, so it has to survive the adapter. */
    expect(r.stderr).toContain("std::out_of_range");
    expect(r.exitCode).toBe(134);
    expect(r.infrastructureError).toBe(false);
  });

  it("6. an infinite loop the judge kills is time_limit_exceeded — EVIDENCE", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.spin });
    expect(record("6 infinite loop", r).status).toBe("time_limit_exceeded");
    /* THE assertion of this file. A SIGKILL from Piston is the judge doing its
       job on the learner's program. It is not the judge failing. */
    expect(r.infrastructureError).toBe(false);
    expect(r.status).not.toBe("provider_timeout");
    expect(r.exitCode).toBeNull();
  });

  it("7. our own fetch ceiling is provider_timeout — NOT evidence", async () => {
    // The judge accepts the request and never answers. We know nothing about
    // the learner's program, including whether it was slow.
    fake.setHandler(() => ({ kind: "hang" }));

    const started = performance.now();
    const r = await piston.run({ ...REQ, sourceCode: P.hello, timeLimitMs: 100 });
    const elapsed = performance.now() - started;

    expect(record("7 judge never answers", r).status).toBe("provider_timeout");
    expect(r.infrastructureError).toBe(true);
    expect(r.status).not.toBe("time_limit_exceeded");
    /* The ceiling is `timeLimitMs + 5000`, so a 100ms limit still waits ~5.1s.
       Asserted numerically because the 5s grace is what lets a genuine learner
       timeout come back as evidence rather than as this. */
    expect(elapsed).toBeGreaterThan(4_800);
    expect(elapsed).toBeLessThan(9_000);
  }, 25_000);

  it("8. runaway output is capped at EXECUTION_LIMITS.maxOutputBytes", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.chatty });
    expect(record("8 runaway output", r).status).toBe("ok");
    /* Piston hands back a finished body rather than a stream, so nothing was
       enforcing our ceiling on this path: 200 KB per case, per learner, held in
       memory and returned verbatim to a browser by `/api/exec/run`. */
    expect(r.stdout.length).toBe(EXECUTION_LIMITS.maxOutputBytes);
    expect(r.stderr).toContain("[output truncated]");
  });

  it("9. a non-zero exit keeps the output the learner produced", async () => {
    const r = await piston.run({ ...REQ, sourceCode: P.exit3 });
    expect(record("9 exit code 3 with output", r).status).toBe("runtime_error");
    expect(r.exitCode).toBe(3);
    // Thrown away, a learner debugging an early `exit` loses their only clue.
    expect(r.stdout).toBe("partial\n");
    expect(r.infrastructureError).toBe(false);
  });

  describe("10. an unavailable judge is provider_error — NOT evidence", () => {
    const cases: { name: string; reply?: FakeReply; url?: string }[] = [
      { name: "connection refused", url: "http://127.0.0.1:1" },
      { name: "500 from the judge", reply: { kind: "http", status: 500, body: { message: "boom" } } },
      {
        // The likeliest real misconfiguration: the host has no gcc package
        // installed, so every request 400s. Not the learner's problem.
        name: "400 unknown runtime",
        reply: { kind: "http", status: 400, body: { message: "c++-10.* runtime is unknown" } },
      },
      {
        name: "a proxy error page instead of JSON",
        reply: { kind: "raw", status: 200, contentType: "text/html", text: "<html>502 Bad Gateway</html>" },
      },
      {
        /* 200, valid JSON, no `run` stage. This used to read as a successful
           empty run — status `ok`, stdout "" — which marked every one of a
           learner's test cases wrong because the JUDGE was broken. */
        name: "200 with no run stage",
        reply: { kind: "http", status: 200, body: { language: "c++", version: "10.2.0" } },
      },
    ];

    for (const c of cases) {
      it(c.name, async () => {
        if (c.reply) fake.setHandler(() => c.reply!);
        const provider = c.url ? new PistonExecutionProvider(c.url) : piston;
        const r = await provider.run({ ...REQ, sourceCode: P.hello });

        expect(record(`10 ${c.name}`, r).status).toBe("provider_error");
        expect(r.infrastructureError).toBe(true);
        // Nothing about the learner may be inferred from any of these.
        expect(r.stdout).toBe("");
        expect(r.exitCode).toBeNull();
      });
    }
  });
});

/* =========================================================================
 * The invariant
 * ====================================================================== */

describe("the invariant: a slow learner is never a broken judge", () => {
  const LEARNER_STATUSES: ExecutionStatus[] = [
    "ok",
    "compile_error",
    "runtime_error",
    "time_limit_exceeded",
    "memory_limit_exceeded",
  ];
  const INFRASTRUCTURE_STATUSES: ExecutionStatus[] = ["provider_timeout", "provider_error"];

  it("the two vocabularies are disjoint and `isInfrastructure` agrees", () => {
    for (const s of LEARNER_STATUSES) expect(isInfrastructure(s), s).toBe(false);
    for (const s of INFRASTRUCTURE_STATUSES) expect(isInfrastructure(s), s).toBe(true);
    expect(LEARNER_STATUSES).not.toContain("provider_timeout");
    expect(INFRASTRUCTURE_STATUSES).not.toContain("time_limit_exceeded");
  });

  it("every status this file observed carried the matching flag", () => {
    // `record` asserts this per observation; this is the sweep that proves the
    // observations happened at all rather than the loop being empty.
    expect(observed.length).toBeGreaterThanOrEqual(14);
    for (const o of observed) expect(isInfrastructure(o.status), o.scenario).toBe(o.infra);
  });

  it("both timeout paths were exercised, and they produced different statuses", () => {
    const learnerTimeout = observed.find((o) => o.scenario.startsWith("6 "));
    const judgeTimeout = observed.find((o) => o.scenario.startsWith("7 "));
    expect(learnerTimeout?.status).toBe("time_limit_exceeded");
    expect(judgeTimeout?.status).toBe("provider_timeout");
    /* The whole file in one line. Same word in English, opposite meanings for a
       child: one says "your algorithm is too slow", the other says "we could
       not measure you". */
    expect(learnerTimeout?.status).not.toBe(judgeTimeout?.status);
    expect(learnerTimeout?.infra).toBe(false);
    expect(judgeTimeout?.infra).toBe(true);
  });

  it("DOCUMENTED LIMITATION: this adapter never emits memory_limit_exceeded", () => {
    /* Piston reports an OOM kill the same way it reports a time kill — SIGKILL
       on the run stage — so the two are indistinguishable at this boundary and
       a memory-exhausted program is recorded as too slow. Both are learner
       evidence, so the load-bearing invariant holds, but nothing downstream may
       assume memory evidence exists. Asserted so the assumption cannot be made
       quietly. */
    expect(observed.map((o) => o.status)).not.toContain("memory_limit_exceeded");
  });
});

/* =========================================================================
 * Downstream: runCases
 * ====================================================================== */

const FOUR_CASES = [
  { input: "5", expectedOutput: "25" },
  { input: "0", expectedOutput: "0" },
  { input: "-3", expectedOutput: "9", hidden: true },
  { input: "1000", expectedOutput: "1000000", hidden: true },
];

describe("runCases: infrastructure stops the run, the learner's failures do not", () => {
  it("stops on the first infrastructure failure and reports nothing about the rest", async () => {
    fake.setHandler((req, ctx) =>
      ctx.index === 0 ? gccJudge(req) : { kind: "http", status: 503, body: { message: "down" } },
    );

    const { results, infrastructureFailed } = await runCases(piston, P.square, FOUR_CASES);

    expect(infrastructureFailed).toBe(true);
    /* One case ran. The honest report is "we could not measure this", never
       "you passed 1 of 4" — and `results` is discarded by the caller precisely
       because a partial count would look like a real score. */
    expect(results).toHaveLength(1);
    expect(fake.stats.requests).toHaveLength(2);
  });

  it("does NOT stop when the learner's own program is too slow", async () => {
    fake.setHandler((req, ctx) =>
      ctx.index === 1 ? { kind: "piston", body: pistonKilled() } : gccJudge(req),
    );

    const { results, infrastructureFailed } = await runCases(piston, P.square, FOUR_CASES);

    expect(infrastructureFailed).toBe(false);
    expect(results).toHaveLength(4);
    expect(results.filter((r) => r.passed)).toHaveLength(3);
    expect(results[1].status).toBe("time_limit_exceeded");
    expect(results[1].passed).toBe(false);
    // All four cases ran: a timeout on one input says nothing about the others.
    expect(fake.stats.requests).toHaveLength(4);
  });

  it("passes every case for a correct program, hidden ones included", async () => {
    const { results, infrastructureFailed } = await runCases(piston, P.square, FOUR_CASES);
    expect(infrastructureFailed).toBe(false);
    expect(results.every((r) => r.passed)).toBe(true);
    // Each case's stdin reached the judge with its trailing newline.
    expect(fake.stats.requests.map((r) => r.body.stdin)).toEqual(["5\n", "0\n", "-3\n", "1000\n"]);
  });

  it("marks a wrong-but-running program wrong, which is what evidence looks like", async () => {
    const constant = '#include <iostream>\nint main() { std::cout << 25 << "\\n"; }\n';
    const { results, infrastructureFailed } = await runCases(piston, constant, FOUR_CASES);
    expect(infrastructureFailed).toBe(false);
    /* Not a fixture the fake knows, so its gcc prints nothing at all — a
       running program with no output, which fails every case including the one
       whose expected answer is 25. */
    expect(results.every((r) => !r.passed)).toBe(true);
  });

  const MATRIX: { name: string; reply: FakeReply; expected: ExecutionStatus; infra: boolean }[] = [
    { name: "ok", reply: { kind: "piston", body: pistonRun({ stdout: "25\n" }) }, expected: "ok", infra: false },
    { name: "compile_error", reply: { kind: "piston", body: pistonCompileFailure(COMPILE_STDERR) }, expected: "compile_error", infra: false },
    { name: "runtime_error", reply: { kind: "piston", body: pistonRun({ stderr: UNCAUGHT_STDERR, code: 134 }) }, expected: "runtime_error", infra: false },
    { name: "time_limit_exceeded", reply: { kind: "piston", body: pistonKilled() }, expected: "time_limit_exceeded", infra: false },
    { name: "provider_error", reply: { kind: "http", status: 500, body: { message: "x" } }, expected: "provider_error", infra: true },
  ];

  for (const row of MATRIX) {
    it(`sets infrastructureFailed=${row.infra} for ${row.name}`, async () => {
      fake.setHandler(() => row.reply);
      const { results, infrastructureFailed } = await runCases(piston, P.square, [FOUR_CASES[0]]);
      expect(infrastructureFailed).toBe(row.infra);
      if (!row.infra) expect(results[0].status).toBe(row.expected);
      else expect(results).toHaveLength(0);
    });
  }
});

/* =========================================================================
 * Downstream: what the submit route does with it
 * ====================================================================== */

describe("submit: a learner is never recorded as wrong because the judge failed", () => {
  /**
   * A real, executable September block, and NOT the month's first one.
   *
   * It used to be `m1.l1.b5`, which under Python was "square the number you
   * read" and had four cases. In C++ that task cannot be the first lesson's:
   * reading input needs a DECLARED TYPE, so `cin` arrives at l3 and l1 can only
   * ask for a fixed expression. `m1.l1.b5` is now `cout << 7 * 8;` with one
   * case and no input — useless for this suite, which needs a program whose
   * answer varies with stdin so that "the judge measured something" is
   * distinguishable from "the judge echoed a constant".
   *
   * `m1.l3.b4` is the first block that has both: four cases, two of them
   * hidden, and a reference solution that reads. Naming it here rather than
   * searching for "any block with four cases" keeps the failure legible — if
   * the curriculum moves it, this suite says which block it lost.
   */
  const BLOCK_ID = "m1.l3.b4";

  /** The block's own reference solution — never a program written here. */
  function solutionOf(block: GradeTarget["block"]): string {
    const source = (block as { referenceSolution?: unknown }).referenceSolution;
    if (typeof source !== "string") {
      throw new Error(`${BLOCK_ID} has no referenceSolution to submit`);
    }
    return source;
  }

  /**
   * A judge that answers the block's own cases, keyed BY THE STDIN IT RECEIVED.
   *
   * Not a lookup by call order and not a constant: if the adapter stopped
   * sending stdin, or sent it for the wrong case, nothing here would match and
   * every case would fail. That keeps the transport assertion alive through a
   * handler that does not have to model a compiler.
   */
  function answersFor(cases: readonly { input: string; expectedOutput: string }[]) {
    return (req: PistonExecuteRequest): FakeReply => {
      const stdin = (req.stdin ?? "").trim();
      const match = cases.find((c) => c.input.trim() === stdin);
      if (!match) return { kind: "piston", body: pistonRun({ stdout: "" }) };
      return { kind: "piston", body: pistonRun({ stdout: `${match.expectedOutput}\n` }) };
    };
  }

  /**
   * The route's own narrowing, reproduced rather than cast.
   *
   * `src/app/api/learning/submit/route.ts` decides what is executable with
   * exactly this predicate. A cast here would let the test keep passing if the
   * route's set of executable block types and the curriculum's drifted apart —
   * which is the bug that once left nine declared test cases unrun.
   */
  function executableCases(block: GradeTarget["block"]) {
    if (
      block.type === "write_code" ||
      block.type === "modify_code" ||
      block.type === "challenge" ||
      (block.type === "verify" && !!block.cases?.length)
    ) {
      return block.cases ?? [];
    }
    return [];
  }

  it("the block this is grounded in is a real, executable curriculum block", () => {
    const target = findBlock(BLOCK_ID);
    expect(target).not.toBeNull();
    expect(target!.block.type).toBe("write_code");
    expect(executableCases(target!.block)).toHaveLength(4);
    /* And it READS, which is what makes the rest of this describe mean
       anything: a task with a fixed answer cannot tell a judge that measured
       the learner from one that echoed a constant. */
    expect(solutionOf(target!.block)).toContain("cin");
    expect(executableCases(target!.block).some((c) => c.hidden)).toBe(true);
  });

  it("an unmeasured code block settles `unknown`, which produces NO verdict event", () => {
    const target = findBlock(BLOCK_ID)!;
    // Exactly what the route does before it consults the judge.
    const outcome = gradeBlock(target, { kind: "text", value: solutionOf(target.block) });

    expect(outcome.result.verdict).toBe("unknown");
    /* `null` means the route writes no `verdict_received` and no
       `failure_attributed` at all. Not "wrong with low confidence" — nothing.
       An attempt nobody could measure leaves no trace in the ledger, which is
       the only honest thing to record about it. */
    expect(toLearningVerdictName(outcome.result.verdict)).toBeNull();
  });

  it("infrastructure failure leaves that `unknown` standing", async () => {
    fake.setHandler(() => ({ kind: "http", status: 502, body: { message: "gateway" } }));
    const target = findBlock(BLOCK_ID)!;
    const outcome = gradeBlock(target, { kind: "text", value: solutionOf(target.block) });

    const { results, infrastructureFailed } = await runCases(
      piston,
      solutionOf(target.block),
      executableCases(target.block),
    );

    // The route's guard, reproduced. The verdict is only ever replaced inside it.
    const measured = !infrastructureFailed && results.length > 0;
    expect(measured).toBe(false);

    const verdict = measured ? checkCodeResult(0, 0).verdict : outcome.result.verdict;
    expect(verdict).toBe("unknown");
    expect(verdict).not.toBe("wrong");
    expect(toLearningVerdictName(verdict)).toBeNull();
  });

  it("a learner timeout DOES become a verdict — it is evidence", async () => {
    const target = findBlock(BLOCK_ID)!;
    const answer = answersFor(executableCases(target.block));
    fake.setHandler((req, ctx) =>
      ctx.index === 1 ? { kind: "piston", body: pistonKilled() } : answer(req),
    );

    const { results, infrastructureFailed } = await runCases(
      piston,
      solutionOf(target.block),
      executableCases(target.block),
    );
    expect(infrastructureFailed).toBe(false);

    const passed = results.filter((r) => r.passed).length;
    const graded = checkCodeResult(passed, results.length);
    expect(passed).toBe(3);
    expect(graded.verdict).toBe("partial");
    // Recorded, attributed, and countable. The opposite of the case above.
    expect(toLearningVerdictName(graded.verdict)).toBe("wrong_answer");
  });

  it("a clean pass becomes `accepted`", async () => {
    const target = findBlock(BLOCK_ID)!;
    fake.setHandler(answersFor(executableCases(target.block)));
    const { results } = await runCases(piston, solutionOf(target.block), executableCases(target.block));
    const graded = checkCodeResult(results.filter((r) => r.passed).length, results.length);
    expect(graded.verdict).toBe("correct");
    expect(toLearningVerdictName(graded.verdict)).toBe("accepted");
  });

  /**
   * Asserted against the route's SOURCE.
   *
   * Deliberately brittle. The route needs a live store, a request scope and
   * cookies to call, so the alternative to reading it is not testing this at
   * all — and the guard below is a single `!` whose deletion silently converts
   * every judge outage into a class full of wrong answers. A test that fails
   * when someone reformats this line is a cheap price for one that fails when
   * someone removes it.
   */
  it("the route's own source still gates the verdict on infrastructure", () => {
    const source = readFileSync("src/app/api/learning/submit/route.ts", "utf8");

    expect(source).toContain("const { results, infrastructureFailed } = await runCases(");

    /* THE GUARD. One `!`, and deleting it converts every judge outage into a
       class full of wrong answers. */
    const guardAt = source.indexOf("if (!infrastructureFailed && results.length > 0)");
    expect(guardAt).toBeGreaterThan(-1);

    /* The verdict is replaced in exactly one place, and that place is inside
       the guard. Position rather than text, so rewording a comment does not
       fail this but moving the assignment out does. */
    const verdictAt = source.indexOf("verdict: graded.verdict");
    expect(verdictAt).toBeGreaterThan(guardAt);
    expect(source.indexOf("verdict: graded.verdict", verdictAt + 1)).toBe(-1);

    // And a judge that throws outright is swallowed without touching the verdict.
    const region = source.slice(source.indexOf("await runCases("));
    const catchBody = braceBlockAfter(region, region.indexOf("catch"));
    expect(catchBody).not.toMatch(/verdict/);

    /* Measured with comments stripped.
     *
     * This assertion used to count raw characters, which contradicted the rule
     * stated ten lines above — "rewording a comment does not fail this" — and
     * it duly failed when a comment was added explaining why the `no judge
     * configured` case does NOT come through here. What the budget is actually
     * for is that the catch body stays trivial: a handler that grows logic is a
     * handler that will eventually decide something about the verdict. Prose
     * was never the risk, so prose is no longer measured. */
    const catchCode = catchBody
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "")
      .trim();
    expect(catchCode.length, `catch body must stay trivial, got: ${catchCode}`).toBeLessThan(120);
  });

  it("and tells the learner WHICH kind of unmeasured they got", () => {
    /* `unknown` has THREE causes and they are three different sentences to a
       fourteen-year-old: "we could not run this, and nobody is being marked
       wrong"; "this class has no automatic checker at all, your teacher grades
       it"; and "no machine scores an explanation you wrote in words". The route
       distinguishes them on the wire, and it can only do that because
       `infrastructureFailed` reached it intact — which is what everything above
       this line is about.

       This test previously named two, from when there were two. The third
       arrived with hybrid execution: a deployment can now run entirely on
       browser Python, and telling that class "the checker is down, try later"
       every day for a month would be a promise the product never keeps. */
    const source = readFileSync("src/app/api/learning/submit/route.ts", "utf8");
    expect(source).toContain("unmeasuredReason");
    expect(source).toContain("judge_unavailable");
    expect(source).toContain("not_machine_graded");
    expect(source).toContain("no_trusted_judge");
  });
});
