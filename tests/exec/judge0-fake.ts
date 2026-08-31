import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Socket } from "node:net";

/**
 * A protocol-faithful fake Judge0 CE.
 *
 * ## What this is, and — more importantly — what it is not
 *
 * A real HTTP server speaking Judge0's published wire contract: async
 * `POST /submissions` returning a token, `GET /submissions/{token}` returning a
 * submission whose status is `In Queue`, then `Processing`, then something
 * terminal, `GET /languages` returning a catalogue, and the two batch
 * endpoints. Everything above the socket in `Judge0RapidApiProvider` stays real
 * when a test drives this: the language rule, the polling cadence and its
 * backoff, the retry policy, the concurrency gate, the normalisation, and every
 * consumer downstream of it.
 *
 * It proves NOTHING about RapidAPI. **There is no key in this repository and
 * nothing in this test suite has ever contacted `judge0-ce.p.rapidapi.com`.**
 * This server does not run Python — every result below is a fixture written to
 * match what CPython actually prints — it has no sandbox, no cgroups and no
 * isolate, and it will cheerfully accept a `cpu_time_limit` a real plan
 * refuses. Which Python the plan exposes, where its ceilings sit, whether the
 * batch endpoints exist on it and where the rate limit falls are all UNKNOWN
 * until somebody holds a key.
 *
 * The split is the one `tests/exec/fake-piston.ts` already draws: adapter
 * correctness and service correctness are different claims, and a fake that
 * pretended to be both would let a broken subscription pass a green suite.
 *
 * ## Why the server validates the request
 *
 * The dangerous adapter bug is not "returns the wrong status" — a test catches
 * that in one line. It is "sends a field the judge silently ignores":
 * `cpu_time_limit` in milliseconds, `memory_limit` in megabytes, `wait=true` on
 * a deployment where synchronous mode is off. A real judge accepts those
 * requests, substitutes its OWN defaults, and answers 200 — so a learner's
 * five-second budget quietly becomes two and a correct-but-unoptimised program
 * is recorded as too slow. Nothing downstream can detect that; it just looks
 * like the child was wrong.
 *
 * So every request is checked against the published schema and each deviation
 * is pushed onto `violations`, which the conformance suite asserts is empty.
 */

/* -------------------------------------------------------------------------- */
/* The programs, and what CPython really prints                               */
/* -------------------------------------------------------------------------- */

/**
 * Real Python, so the SAME suite can run against the real service.
 *
 * Nothing here is a fixture-only program: each one is written so that a live
 * Judge0 running CPython produces exactly the output the engine below fakes.
 * That is the property that makes `JUDGE0_LIVE_TEST=1` meaningful rather than
 * a second, differently-worded suite.
 */
export const PROGRAMS = {
  hello: 'print("hello, world")',
  /** Reads stdin. The fake COMPUTES its answer from what arrived — see `engine`. */
  sumPair: "a, b = map(int, input().split())\nprint(a + b)",
  square: "n = int(input())\nprint(n * n)",
  syntax: "print(",
  divZero: "print(1 / 0)",
  spin: "while True:\n    pass",
  /** ~220 KB of stdout: comfortably past our 64 KiB ceiling, comfortably under
      a judge's own file-size limit, so it is an OUTPUT test and not a SIGXFSZ
      test on either side. */
  bomb: 'for i in range(20000):\n    print("0123456789")',
  exit7: 'import sys\nprint("partial")\nsys.exit(7)',
  kazakh: 'print("Сәлем, әлем!")',
  bigInt: "print(10**100)",
} as const;

/** `print(10**100)` — 1 followed by a hundred zeros, exactly. */
export const BIG_INT_TEXT = `1${"0".repeat(100)}`;

const SYNTAX_STDERR =
  '  File "/box/script.py", line 1\n' +
  "    print(\n" +
  "         ^\n" +
  "SyntaxError: '(' was never closed\n";

const ZERO_DIVISION_STDERR =
  "Traceback (most recent call last):\n" +
  '  File "/box/script.py", line 1, in <module>\n' +
  "    print(1 / 0)\n" +
  "          ~~^~~\n" +
  "ZeroDivisionError: division by zero\n";

const EOF_STDERR =
  "Traceback (most recent call last):\n" +
  '  File "/box/script.py", line 1, in <module>\n' +
  "    n = int(input())\n" +
  "            ^^^^^^^\n" +
  "EOFError: EOF when reading a line\n";

/* -------------------------------------------------------------------------- */
/* Judge0's shapes                                                            */
/* -------------------------------------------------------------------------- */

/** The submission body the provider POSTs, once narrowed. */
export interface Judge0SubmitBody {
  language_id?: unknown;
  source_code?: unknown;
  stdin?: unknown;
  cpu_time_limit?: unknown;
  wall_time_limit?: unknown;
  memory_limit?: unknown;
  enable_network?: unknown;
  redirect_stderr_to_stdout?: unknown;
  /** Must NEVER be present. SolveX's checker is authoritative and the answer
      key does not go to a marketplace vendor. */
  expected_output?: unknown;
}

/** A terminal submission, as the judge would store it. */
export interface Judge0Terminal {
  status_id: number;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  exit_code: number | null;
}

const DESCRIPTIONS: Record<number, string> = {
  1: "In Queue",
  2: "Processing",
  3: "Accepted",
  4: "Wrong Answer",
  5: "Time Limit Exceeded",
  6: "Compilation Error",
  7: "Runtime Error (SIGSEGV)",
  8: "Runtime Error (SIGXFSZ)",
  9: "Runtime Error (SIGFPE)",
  10: "Runtime Error (SIGABRT)",
  11: "Runtime Error (NZEC)",
  12: "Runtime Error (Other)",
  13: "Internal Error",
  14: "Exec Format Error",
};

/**
 * The language catalogue.
 *
 * Shaped after Judge0 CE's real list and seeded with the two traps the
 * discovery rule exists to avoid: a Python 2, and a `Python for ML` whose
 * numpy-preloaded runtime would silently downgrade the "standard library only"
 * guarantee that `schools/execution/python-policy.ts` enforces BY ABSENCE.
 */
export const LANGUAGES: readonly { id: number; name: string }[] = [
  { id: 45, name: "Assembly (NASM 2.14.02)" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  { id: 70, name: "Python (2.7.17)" },
  { id: 71, name: "Python (3.8.1)" },
  { id: 92, name: "Python (3.11.2)" },
  { id: 100, name: "Python (3.12.5)" },
  { id: 127, name: "Python for ML (3.11.2)" },
];

/** The id the discovery rule must land on: the highest PLAIN Python 3. */
export const EXPECTED_PYTHON_ID = 100;

/**
 * Read a field the adapter may have base64-encoded.
 *
 * Tolerant of both so a test can still hand the engine a plain program, and so
 * this file does not become the only thing standing between a protocol change
 * and an unreadable diff.
 */
export function decodeMaybeBase64(value: unknown): string {
  if (typeof value !== "string" || value === "") return "";
  /* Base64 of ASCII Python is itself ASCII and round-trips; a plain program
     containing `(`, `"` or a newline does not, so the shape is decidable. */
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value.replace(/\s/g, ""))) return value;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return decoded.length > 0 ? decoded : value;
  } catch {
    return value;
  }
}

/** Encode a field the way the service does when `base64_encoded=true`. */
export function encodeBase64(value: string | null): string | null {
  return value === null ? null : Buffer.from(value, "utf8").toString("base64");
}

export function terminal(over: Partial<Judge0Terminal> = {}): Judge0Terminal {
  return {
    status_id: 3,
    stdout: null,
    stderr: null,
    compile_output: null,
    message: null,
    time: "0.012",
    memory: 3_200,
    exit_code: 0,
    ...over,
  };
}

/**
 * The fake's CPython.
 *
 * The stdin-reading programs COMPUTE their answer from the `stdin` that
 * actually arrived rather than answering from a lookup table. That is the only
 * way a test can tell "we sent stdin correctly" from "we sent nothing and the
 * fixture happened to be right" — and dropping stdin is the single most likely
 * way to grade an entire class wrong while every test stays green.
 *
 * An unknown program prints nothing and exits 0: a running, wrong program,
 * which is what evidence about a mistaken learner looks like.
 */
export function engine(body: Judge0SubmitBody): Judge0Terminal {
  /* The adapter sends base64 now, as the service demands. Decoded here so the
     fixture engine below can still match on the program text — a fake that
     compared base64 blobs would be matching on our encoder, not on Python. */
  const source = decodeMaybeBase64(body.source_code);
  /* Base64 like the source, and for the same reason — a learner's input can be
     Kazakh too. Missing this decode made the fixture engine see an empty stdin
     and answer `runtime_error` for a program that reads two integers, which is
     exactly the failure mode a stdin test exists to catch. */
  const stdin = decodeMaybeBase64(body.stdin);
  const firstLine = (stdin.split("\n")[0] ?? "").trim();

  if (source === PROGRAMS.hello) return terminal({ stdout: "hello, world\n" });

  if (source === PROGRAMS.sumPair) {
    const parts = firstLine.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return terminal({ status_id: 11, stderr: EOF_STDERR, exit_code: 1 });
    return terminal({ stdout: `${Number(parts[0]) + Number(parts[1])}\n` });
  }

  if (source === PROGRAMS.square) {
    if (firstLine === "") return terminal({ status_id: 11, stderr: EOF_STDERR, exit_code: 1 });
    return terminal({ stdout: `${Number(firstLine) * Number(firstLine)}\n` });
  }

  /* CPython reports a SyntaxError BEFORE running a line, and Judge0 has no way
     to know that: it sees a non-zero exit and reports NZEC. The whole reason
     `looksLikeCompileError` is shared at the port. */
  if (source === PROGRAMS.syntax) {
    return terminal({ status_id: 11, stderr: SYNTAX_STDERR, exit_code: 1 });
  }
  if (source === PROGRAMS.divZero) {
    return terminal({ status_id: 11, stderr: ZERO_DIVISION_STDERR, exit_code: 1 });
  }
  /* THE LEARNER'S program, killed on ITS OWN cpu limit. Evidence. */
  if (source === PROGRAMS.spin) {
    return terminal({ status_id: 5, time: "5.000", exit_code: null });
  }
  if (source === PROGRAMS.bomb) {
    return terminal({ stdout: "0123456789\n".repeat(20_000) });
  }
  if (source === PROGRAMS.exit7) {
    return terminal({ status_id: 11, stdout: "partial\n", exit_code: 7 });
  }
  if (source === PROGRAMS.kazakh) return terminal({ stdout: "Сәлем, әлем!\n" });
  if (source === PROGRAMS.bigInt) return terminal({ stdout: `${BIG_INT_TEXT}\n` });

  return terminal({ stdout: "" });
}

/* -------------------------------------------------------------------------- */
/* Failure injection                                                          */
/* -------------------------------------------------------------------------- */

/**
 * What the fake should do with one request.
 *
 * `default` is the protocol engine. The rest are the ways a rented judge fails,
 * and every one of them is a failure the provider must turn into "nothing was
 * measured" rather than into a verdict.
 */
export type FakeAction =
  | { kind: "default" }
  /** A raw HTTP failure — 401, 403, 429, 500. `body` is echoed, so a test can
      put a secret in it and prove the provider never repeats it. */
  | { kind: "http"; status: number; body?: unknown }
  /** Accept the connection and never answer. OUR ceiling has to end it. */
  | { kind: "hang" }
  /** Answer this poll with `Processing` regardless of how many have gone by. */
  | { kind: "pending" }
  /** Serve this terminal submission instead of the engine's. */
  | { kind: "submission"; body: Partial<Judge0Terminal> };

export interface FakeContext {
  method: string;
  path: string;
  query: URLSearchParams;
  /** 0-based index of this POST /submissions among all of them. */
  postIndex: number;
  /** 0-based index of this GET poll among all of them. */
  pollIndex: number;
  /** The submitted body, for POSTs. */
  body: unknown;
}

export interface RecordedRequest {
  method: string;
  path: string;
  query: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface FakeJudge0Options {
  /**
   * How many polls answer `In Queue`/`Processing` before a terminal status.
   *
   * Two by default, so the polling loop is genuinely exercised: a provider that
   * read status 1 as an answer would return empty stdout, the checker would
   * compare it against the expected output, and a whole class would be marked
   * wrong because we did not wait.
   */
  pendingRounds?: number;
  /**
   * Whether `?fields=` is honoured.
   *
   * `honour` projects the requested fields, so `fields=status_id,...` yields a
   * FLAT `status_id` — which is what the provider reads. `ignore` returns
   * Judge0's default payload instead, where the status is only the nested
   * `{id, description}` object. Whether the hosted deployment honours `fields`
   * is UNVERIFIED, and `ignore` exists to pin down what happens if it does not.
   */
  fields?: "honour" | "ignore";
}

export interface FakeJudge0 {
  url: string;
  requests: RecordedRequest[];
  violations: string[];
  setHandler(handler: (ctx: FakeContext) => FakeAction): void;
  setFields(mode: "honour" | "ignore"): void;
  reset(): void;
  close(): Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* The server                                                                 */
/* -------------------------------------------------------------------------- */

export async function startFakeJudge0(options: FakeJudge0Options = {}): Promise<FakeJudge0> {
  const pendingRounds = options.pendingRounds ?? 2;
  let fields: "honour" | "ignore" = options.fields ?? "honour";
  let handler: (ctx: FakeContext) => FakeAction = () => ({ kind: "default" });

  const requests: RecordedRequest[] = [];
  const violations: string[] = [];
  const submissions = new Map<string, { body: Judge0SubmitBody; polls: number }>();
  let postIndex = 0;
  let pollIndex = 0;

  /* Every socket is tracked so a HANGING request cannot keep `server.close()`
     waiting forever — the test that proves our own ceiling works must not also
     hang the suite. */
  const sockets = new Set<Socket>();

  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      const url = new URL(req.url ?? "/", "http://fake.judge");
      const method = req.method ?? "GET";
      let body: unknown;
      try {
        body = raw ? JSON.parse(raw) : undefined;
      } catch {
        body = raw;
      }

      requests.push({
        method,
        path: url.pathname,
        query: url.search,
        headers: req.headers,
        body,
      });

      checkVendorHeaders(req, violations);

      const isPollPath =
        method === "GET" && url.pathname.startsWith("/submissions/") && url.pathname !== "/submissions/batch";
      const isBatchPoll = method === "GET" && url.pathname === "/submissions/batch";
      const ctx: FakeContext = {
        method,
        path: url.pathname,
        query: url.searchParams,
        postIndex: method === "POST" ? postIndex : -1,
        pollIndex: isPollPath || isBatchPoll ? pollIndex : -1,
        body,
      };
      if (method === "POST") postIndex += 1;
      if (isPollPath || isBatchPoll) pollIndex += 1;

      const action = handler(ctx);
      if (action.kind === "hang") return; // never answers; the socket is torn down on close
      if (action.kind === "http") {
        return send(res, action.status, action.body ?? { error: DESCRIPTIONS[13] ?? "error" });
      }

      route({ url, method, body, res, action });
    });
  });

  server.on("connection", (socket: Socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  function route(input: {
    url: URL;
    method: string;
    body: unknown;
    res: ServerResponse;
    action: FakeAction;
  }) {
    const { url, method, body, res, action } = input;

    if (url.pathname === "/languages" && method === "GET") {
      return send(res, 200, LANGUAGES);
    }

    if (url.pathname === "/submissions" && method === "POST") {
      const submitted = (body ?? {}) as Judge0SubmitBody;
      checkSubmission(submitted, url, violations);
      const token = randomUUID();
      submissions.set(token, { body: submitted, polls: 0 });
      return send(res, 201, { token });
    }

    if (url.pathname === "/submissions/batch" && method === "POST") {
      const list = (body as { submissions?: unknown })?.submissions;
      if (!Array.isArray(list)) {
        violations.push("POST /submissions/batch without a `submissions` array");
        return send(res, 400, { error: "submissions required" });
      }
      const created = list.map((entry) => {
        const submitted = (entry ?? {}) as Judge0SubmitBody;
        checkSubmission(submitted, url, violations);
        const token = randomUUID();
        submissions.set(token, { body: submitted, polls: 0 });
        return { token };
      });
      return send(res, 201, created);
    }

    if (url.pathname === "/submissions/batch" && method === "GET") {
      const tokens = (url.searchParams.get("tokens") ?? "").split(",").filter(Boolean);
      const payload = tokens.map((token) => {
        const view = poll(token, action);
        return view === null ? { token, status: { id: 13, description: DESCRIPTIONS[13] } } : { ...view, token };
      });
      return send(res, 200, { submissions: payload });
    }

    if (method === "GET" && url.pathname.startsWith("/submissions/")) {
      const token = decodeURIComponent(url.pathname.slice("/submissions/".length));
      const view = poll(token, action, url.searchParams);
      if (view === null) return send(res, 404, { error: "not found" });
      return send(res, 200, view);
    }

    return send(res, 404, { error: "no such endpoint" });
  }

  /**
   * One poll of one submission.
   *
   * Returns `In Queue` then `Processing` for `pendingRounds` polls before the
   * terminal body, so nothing can pass by reading the first answer it gets.
   */
  function poll(
    token: string,
    action: FakeAction,
    query?: URLSearchParams,
  ): Record<string, unknown> | null {
    const entry = submissions.get(token);
    if (!entry) return null;
    entry.polls += 1;

    let state: Judge0Terminal;
    if (action.kind === "pending") {
      state = terminal({ status_id: 2 });
    } else if (entry.polls <= pendingRounds) {
      state = terminal({ status_id: entry.polls === 1 ? 1 : 2, stdout: null, time: null, memory: null, exit_code: null });
    } else if (action.kind === "submission") {
      state = terminal(action.body);
    } else {
      state = engine(entry.body);
    }
    return project(state, token, query);
  }

  /**
   * Judge0's response, as the `fields` parameter shapes it.
   *
   * With `fields` honoured, `status_id` comes back as a flat number — the
   * documented behaviour, and what the provider reads. With it ignored, the
   * caller gets Judge0's DEFAULT payload, whose status is only the nested
   * object. The difference is the whole hazard, so it is modelled rather than
   * assumed away.
   */
  function project(
    state: Judge0Terminal,
    token: string,
    query?: URLSearchParams,
  ): Record<string, unknown> {
    /* The four text fields come back base64-encoded, because that is what the
       real service does under `base64_encoded=true` — which it insists on. A
       fake that returned them as plain strings would let an adapter that
       forgot to decode pass every offline test and then show a learner a wall
       of base64 in production. */
    const full: Record<string, unknown> = {
      token,
      status_id: state.status_id,
      status: { id: state.status_id, description: DESCRIPTIONS[state.status_id] ?? "Unknown" },
      stdout: encodeBase64(state.stdout),
      stderr: encodeBase64(state.stderr),
      compile_output: encodeBase64(state.compile_output),
      message: encodeBase64(state.message),
      time: state.time,
      memory: state.memory,
      exit_code: state.exit_code,
    };

    if (fields === "ignore") {
      const { status_id: _dropped, ...rest } = full;
      void _dropped;
      return rest;
    }

    const requested = query?.get("fields");
    if (!requested) return full;
    const wanted = new Set(requested.split(",").map((f) => f.trim()));
    const out: Record<string, unknown> = {};
    for (const key of wanted) if (key in full) out[key] = full[key];
    return out;
  }

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    violations,
    setHandler(next) {
      handler = next;
    },
    setFields(mode) {
      fields = mode;
    },
    reset() {
      handler = () => ({ kind: "default" });
      fields = options.fields ?? "honour";
      requests.length = 0;
      violations.length = 0;
      submissions.clear();
      postIndex = 0;
      pollIndex = 0;
    },
    close() {
      return new Promise<void>((resolve) => {
        for (const socket of sockets) socket.destroy();
        server.close(() => resolve());
      });
    },
  };
}

function send(res: ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(text, "utf8"),
  });
  res.end(text);
}

/* -------------------------------------------------------------------------- */
/* Schema checks — the silent-bug detector                                    */
/* -------------------------------------------------------------------------- */

function checkVendorHeaders(req: IncomingMessage, violations: string[]) {
  const key = req.headers["x-rapidapi-key"];
  const host = req.headers["x-rapidapi-host"];
  if (typeof key !== "string" || key.length === 0) {
    violations.push(`${req.method} ${req.url}: no x-rapidapi-key header`);
  }
  if (typeof host !== "string" || host.length === 0) {
    violations.push(`${req.method} ${req.url}: no x-rapidapi-host header`);
  }
  /* A key in a URL ends up in every proxy log between here and the vendor, and
     in ours. It belongs in a header and nowhere else. */
  if ((req.url ?? "").toLowerCase().includes("key=")) {
    violations.push(`${req.method} ${req.url}: a key appears in the URL`);
  }
}

/**
 * The units, and the two flags whose defaults are dangerous.
 *
 * A real judge accepts every one of these mistakes and answers 200 using its
 * own defaults, which is exactly why they are checked here rather than left to
 * be noticed in a classroom.
 */
function checkSubmission(body: Judge0SubmitBody, url: URL, violations: string[]) {
  const where = `${url.pathname}${url.search}`;

  if (url.pathname === "/submissions") {
    if (url.searchParams.get("wait") !== "false") {
      /* Judge0's own docs say synchronous mode may be disabled and is not
         recommended at scale; where it is off, `wait=true` returns a QUEUED
         submission with empty stdout that the checker then calls wrong. */
      violations.push(`${where}: wait must be false`);
    }
  }
  /* `true`, not `false`, and this is a measurement rather than a preference.
     The real service answers a poll for a program printing Kazakh with HTTP
     400 — "some attributes for this submission cannot be converted to UTF-8,
     use base64_encoded=true query parameter". This check previously demanded
     the opposite and so pinned the adapter to a protocol RapidAPI refuses; the
     whole offline suite was green while every Kazakh program in the curriculum
     would have failed in production. */
  if (url.searchParams.get("base64_encoded") !== "true") {
    violations.push(`${where}: base64_encoded must be explicitly true`);
  }

  if (typeof body.language_id !== "number") violations.push(`${where}: language_id must be a number`);
  if (typeof body.source_code !== "string") violations.push(`${where}: source_code must be a string`);
  if (typeof body.stdin !== "string") violations.push(`${where}: stdin must be a string`);

  const cpu = body.cpu_time_limit;
  if (typeof cpu !== "number") violations.push(`${where}: cpu_time_limit must be a number`);
  else if (cpu > 60) violations.push(`${where}: cpu_time_limit ${cpu} looks like MILLISECONDS`);

  const wall = body.wall_time_limit;
  if (typeof wall !== "number") violations.push(`${where}: wall_time_limit must be a number`);
  else if (typeof cpu === "number" && wall <= cpu) {
    /* A wall limit at or below the cpu limit kills a program that legitimately
       used its whole budget — and reports the same status 5, so it reads as the
       learner being slow. */
    violations.push(`${where}: wall_time_limit ${wall} must exceed cpu_time_limit ${cpu}`);
  }

  const memory = body.memory_limit;
  if (typeof memory !== "number") violations.push(`${where}: memory_limit must be a number`);
  else if (memory < 2_048) violations.push(`${where}: memory_limit ${memory} looks like MEGABYTES`);

  if (body.enable_network !== false) {
    /* Judge0 CE ships this TRUE — the CVE-2024-29021 default. It is also the
       mechanism behind "standard library only": the judge has no network to
       pip from. */
    violations.push(`${where}: enable_network must be explicitly false`);
  }
  if (body.redirect_stderr_to_stdout !== false) {
    violations.push(`${where}: redirect_stderr_to_stdout must be explicitly false`);
  }
  if ("expected_output" in body && body.expected_output !== undefined) {
    /* The answer key must never leave this system, and SolveX's checker — not a
       vendor's whitespace rules — decides pass or fail. */
    violations.push(`${where}: expected_output must NEVER be sent`);
  }
}
