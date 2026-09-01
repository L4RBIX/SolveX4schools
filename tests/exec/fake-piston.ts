import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

/**
 * A protocol-faithful fake Piston.
 *
 * ## What this is, and — more importantly — what it is not
 *
 * This is a real HTTP server that speaks Piston's actual `/api/v2/execute` wire
 * contract. It proves ONE thing: that `PistonExecutionProvider` sends what
 * Piston accepts and correctly interprets everything Piston can send back.
 *
 * It proves NOTHING about a deployed Piston. It compiles nothing, it does not
 * isolate anything, it has no cgroups and no containers. Every result below is
 * a fixture written to match what a real toolchain produces — the
 * real-compiler evidence lives in `tests/exec/execution.test.ts`, which drives
 * `LocalExecutionProvider` against an actual `g++`.
 *
 * ## The open question this fake CANNOT close
 *
 * Piston drives C, C++ and D from one `gcc` package, and whether that package's
 * run script passes `-std=c++17` is a property of the script rather than of
 * GCC. Nobody has asked a real Piston. This fake will happily accept a request
 * and answer with whatever fixture a test hands it, so a green run here says
 * nothing about which standard a deployed judge would compile with. See
 * `schools/execution/cpp-runtime.ts`, which records the question.
 *
 * The split is deliberate: adapter correctness and service correctness are
 * different claims, and a fake that pretended to be both would let a broken
 * deployment pass a green test suite.
 *
 * ## Why the server validates the request
 *
 * The dangerous adapter bug is not "returns the wrong status" — a test catches
 * that immediately. It is "sends a field Piston ignores": `run_timeout` in
 * seconds instead of milliseconds, memory in MB instead of bytes, stdin under
 * the wrong key. Piston answers those requests successfully, using ITS
 * defaults, and everything looks fine until a learner's five-second budget is
 * silently three. So every request is checked against the real schema and any
 * deviation is recorded as a violation the tests assert is empty.
 */

/** The request body Piston's v2 execute endpoint accepts. */
export interface PistonExecuteRequest {
  language: string;
  version: string;
  files: { name?: string; content: string }[];
  stdin?: string;
  args?: string[];
  run_timeout?: number;
  compile_timeout?: number;
  run_memory_limit?: number;
  compile_memory_limit?: number;
}

/** One stage of a Piston job. `compile` is absent for runtimes with no compile step. */
export interface PistonStage {
  stdout: string;
  stderr: string;
  /** Piston's interleaving of the two above. Our adapter ignores it; included for fidelity. */
  output: string;
  /** `null` when the process was killed by a signal rather than exiting. */
  code: number | null;
  /** `"SIGKILL"` when Piston enforced its own limit on the learner's program. */
  signal: string | null;
}

export interface PistonExecuteResponse {
  language: string;
  version: string;
  compile?: PistonStage;
  run: PistonStage;
}

/** What the fake should do with one request. */
export type FakeReply =
  /** A well-formed Piston job result. */
  | { kind: "piston"; body: PistonExecuteResponse; delayMs?: number }
  /** An HTTP-level failure. Piston's error shape is `{ message }`. */
  | { kind: "http"; status: number; body: unknown; delayMs?: number }
  /** Bytes on the wire that are not the JSON we expect — a proxy error page, a truncated body. */
  | { kind: "raw"; status: number; contentType: string; text: string; delayMs?: number }
  /** Accept the request and never answer. Models a judge that has stopped responding. */
  | { kind: "hang" };

export interface RecordedRequest {
  method: string;
  path: string;
  contentType: string | undefined;
  body: PistonExecuteRequest;
  /** `performance.now()` at the moment the body finished arriving. */
  startedAt: number;
  /** `performance.now()` when the response was flushed. `null` for a hung request. */
  endedAt: number | null;
}

export interface FakeStats {
  requests: RecordedRequest[];
  /** Every way the incoming request failed to look like a real Piston call. */
  violations: string[];
  /** The high-water mark of requests being served at the same instant. */
  peakConcurrent: number;
  inFlight: number;
}

export type FakeHandler = (
  request: PistonExecuteRequest,
  context: { index: number },
) => FakeReply | Promise<FakeReply>;

export interface FakePiston {
  readonly baseUrl: string;
  setHandler(handler: FakeHandler): void;
  reset(): void;
  readonly stats: FakeStats;
  stop(): Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Piston fills `output` itself; a fixture that forgot to would not be faithful. */
export function stage(partial: {
  stdout?: string;
  stderr?: string;
  code?: number | null;
  signal?: string | null;
}): PistonStage {
  const stdout = partial.stdout ?? "";
  const stderr = partial.stderr ?? "";
  return {
    stdout,
    stderr,
    output: stdout + stderr,
    code: partial.code === undefined ? 0 : partial.code,
    signal: partial.signal ?? null,
  };
}

/**
 * A job that compiled and then ran to completion.
 *
 * The `compile` stage is present and successful, which is the shape that
 * changed with the language: the python3 runtime had NO compile stage at all,
 * so `body.compile` was always absent and a program that failed to start
 * arrived indistinguishable from one that crashed. A gcc job always has one.
 */
export function pistonRun(partial: Parameters<typeof stage>[0]): PistonExecuteResponse {
  return {
    language: "c++",
    version: "10.2.0",
    compile: stage({ code: 0 }),
    run: stage(partial),
  };
}

/**
 * A job Piston killed on its own `run_timeout`.
 *
 * This is the single most consequential response shape in the file: `code` is
 * null and the kill arrives as a SIGNAL. The learner's program was too slow —
 * evidence — and it must never be read as the judge failing to answer.
 */
export function pistonKilled(partialStdout = ""): PistonExecuteResponse {
  return {
    language: "c++",
    version: "10.2.0",
    compile: stage({ code: 0 }),
    run: stage({ stdout: partialStdout, code: null, signal: "SIGKILL" }),
  };
}

/**
 * A job that never compiled.
 *
 * No longer a shape "kept for adapters other than python3" — it is now the
 * ORDINARY way a beginner's mistake arrives, and the run stage is empty because
 * nothing ran. The adapter reads the compile stage's code and nothing else; it
 * has no heuristic over the diagnostics, and this fixture is what makes that
 * safe to rely on.
 */
export function pistonCompileFailure(stderr: string): PistonExecuteResponse {
  return {
    language: "c++",
    version: "10.2.0",
    compile: stage({ stderr, code: 1 }),
    // Piston still sends a run stage; it is empty because the job never ran.
    run: stage({ code: null }),
  };
}

export async function startFakePiston(handler: FakeHandler): Promise<FakePiston> {
  let current = handler;
  const stats: FakeStats = { requests: [], violations: [], peakConcurrent: 0, inFlight: 0 };
  /** Held so `stop()` can tear down a deliberately hung request instead of hanging the runner. */
  const openResponses = new Set<ServerResponse>();

  const server: Server = createServer((req, res) => {
    void serve(req, res);
  });

  async function serve(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const rawBody = Buffer.concat(chunks).toString("utf8");

    stats.inFlight += 1;
    stats.peakConcurrent = Math.max(stats.peakConcurrent, stats.inFlight);
    const startedAt = performance.now();
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      stats.inFlight -= 1;
    };

    const path = (req.url ?? "").split("?")[0];
    const contentType = req.headers["content-type"];

    /* Route exactly as Piston does. A 404 here means the adapter built the URL
       wrong, which in production reads as "the judge is down" forever. */
    if (req.method !== "POST" || path !== "/api/v2/execute") {
      stats.violations.push(`unexpected route ${req.method} ${path}`);
      done();
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "Not Found" }));
      return;
    }

    let parsed: PistonExecuteRequest;
    try {
      parsed = JSON.parse(rawBody) as PistonExecuteRequest;
    } catch {
      stats.violations.push("request body was not JSON");
      done();
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ message: "invalid json" }));
      return;
    }

    stats.violations.push(...schemaViolations(parsed, contentType));

    const record: RecordedRequest = {
      method: req.method,
      path,
      contentType,
      body: parsed,
      startedAt,
      endedAt: null,
    };
    const index = stats.requests.push(record) - 1;

    const reply = await current(parsed, { index });

    if (reply.kind === "hang") {
      // Left in flight on purpose. `inFlight` stays incremented so a load test
      // that hangs requests still sees them in the peak.
      openResponses.add(res);
      res.on("close", () => {
        openResponses.delete(res);
        done();
      });
      return;
    }

    if (reply.delayMs && reply.delayMs > 0) await sleep(reply.delayMs);

    if (reply.kind === "raw") {
      res.writeHead(reply.status, { "content-type": reply.contentType });
      res.end(reply.text);
    } else if (reply.kind === "http") {
      res.writeHead(reply.status, { "content-type": "application/json" });
      res.end(JSON.stringify(reply.body));
    } else {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(reply.body));
    }
    record.endedAt = performance.now();
    done();
  }

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    setHandler(h) {
      current = h;
    },
    reset() {
      stats.requests.length = 0;
      stats.violations.length = 0;
      stats.peakConcurrent = 0;
      stats.inFlight = 0;
    },
    stats,
    async stop() {
      for (const res of openResponses) res.destroy();
      openResponses.clear();
      // Undici keeps connections alive; without this the close never resolves.
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

/**
 * The Piston schema, checked the way Piston checks it.
 *
 * Units are named in the messages because the units are the whole point: a
 * `run_timeout` of 5 instead of 5000 is a request Piston happily accepts and
 * runs with a five-MILLISECOND budget, and every learner then looks slow.
 */
function schemaViolations(body: PistonExecuteRequest, contentType: string | undefined): string[] {
  const out: string[] = [];
  const add = (m: string) => out.push(m);

  if (!contentType || !contentType.includes("application/json")) {
    add(`content-type was ${JSON.stringify(contentType)}, expected application/json`);
  }
  if (typeof body.language !== "string" || body.language.length === 0) {
    add("`language` must be a non-empty string");
  }
  if (typeof body.version !== "string" || body.version.length === 0) {
    add("`version` must be a non-empty string (Piston resolves it as a semver range)");
  }
  if (!Array.isArray(body.files) || body.files.length === 0) {
    add("`files` must be a non-empty array");
  } else {
    for (const [i, f] of body.files.entries()) {
      if (typeof f?.content !== "string") add(`files[${i}].content must be a string`);
    }
  }
  if (body.stdin !== undefined && typeof body.stdin !== "string") {
    add("`stdin` must be a string when present");
  }
  for (const key of ["run_timeout", "compile_timeout"] as const) {
    const v = body[key];
    if (v === undefined) continue;
    if (!Number.isInteger(v) || v <= 0) add(`\`${key}\` must be a positive integer of MILLISECONDS`);
  }
  for (const key of ["run_memory_limit", "compile_memory_limit"] as const) {
    const v = body[key];
    if (v === undefined) continue;
    if (!Number.isInteger(v) || v < -1) add(`\`${key}\` must be an integer of BYTES (or -1)`);
  }
  return out;
}
