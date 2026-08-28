import { describe, it, expect, vi } from "vitest";
import { LOCAL_LIMITS, isLearnerOutcome } from "@schools/execution/trust";
import type { PyodideAPI } from "pyodide";
import {
  CappedStream,
  classifyPythonError,
  installWorker,
  isWorkerDecidedStatus,
  stdinLines,
  stdinReader,
  type WorkerInbound,
  type WorkerOutbound,
} from "@/lib/pyodide/worker";
import { PythonRunner, type RunnerWorker } from "@/lib/pyodide/runner";

/**
 * Local Python, as far as node can honestly go.
 *
 * ## What this file can and cannot prove
 *
 * There is no WebAssembly Pyodide here and no real `Worker`, so nothing below
 * asserts that CPython produces the right answer — that is a browser fact and
 * it is stated as such in the handover rather than faked with a Python
 * emulator. What IS decidable here is everything around the interpreter, and
 * that is where the bugs live:
 *
 * - the stdin rule that decides whether `input()` raises `EOFError` or hands
 *   back a phantom blank line;
 * - the output cap's byte accounting, including a multi-byte character split
 *   across two writes;
 * - `SyntaxError` landing on `syntax_error` and not `runtime_error`, which is a
 *   bug the server side already had once;
 * - the worker's message protocol, driven against a scripted fake interpreter;
 * - and the lifecycle that makes a runaway program survivable — terminate,
 *   replace, and be runnable again immediately.
 */

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* -------------------------------------------------------------------------- */
/* stdin                                                                      */
/* -------------------------------------------------------------------------- */

describe("stdin", () => {
  it("treats a trailing newline as a terminator, not a blank line", () => {
    /* THE assertion. `3 7\n` is one line. If it were two, the single most
       common program in the whole of September —
       `a, b = map(int, input().split())` followed by a second `input()` —
       would get `""` instead of the EOFError CPython gives, and the learner
       would be debugging a ValueError that is ours, not theirs. */
    expect(stdinLines("3 7\n")).toEqual(["3 7"]);
    expect(stdinLines("3 7")).toEqual(["3 7"]);
  });

  it("keeps a genuinely empty line in the middle and at the end", () => {
    expect(stdinLines("3\n\n")).toEqual(["3", ""]);
    expect(stdinLines("a\n\nb\n")).toEqual(["a", "", "b"]);
  });

  it("is empty for empty input, so the first input() is already EOF", () => {
    expect(stdinLines("")).toEqual([]);
    expect(stdinReader("")()).toBeUndefined();
  });

  it("normalises CRLF, because a pasted Windows input is not a syntax lesson", () => {
    expect(stdinLines("3\r\n7\r\n")).toEqual(["3", "7"]);
  });

  it("hands back successive lines and then EOF, exactly like CPython", () => {
    const read = stdinReader("3\n7\n");
    expect(read()).toBe("3");
    expect(read()).toBe("7");
    // undefined is what makes Pyodide report EOF, which makes input() raise.
    expect(read()).toBeUndefined();
    expect(read()).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/* The output cap                                                             */
/* -------------------------------------------------------------------------- */

const utf8 = new TextEncoder();

describe("output cap", () => {
  it("keeps everything under the ceiling", () => {
    const stream = new CappedStream(64);
    stream.write(utf8.encode("hello\n"));
    stream.write(utf8.encode("world\n"));
    expect(stream.text()).toBe("hello\nworld\n");
    expect(stream.overflowed).toBe(false);
    expect(stream.byteLength()).toBe(12);
  });

  it("cuts at the byte ceiling and stops accumulating", () => {
    const stream = new CappedStream(10);
    stream.write(utf8.encode("0123456789ABCDEF"));
    expect(stream.text()).toBe("0123456789");
    expect(stream.overflowed).toBe(true);
    expect(stream.byteLength()).toBe(10);
  });

  it("bounds memory no matter how long the program keeps printing", () => {
    /* The requirement, stated as a test: `while True: print("x")` must not
       buffer hundreds of megabytes while anyone works out what to do about it.
       Ten thousand writes past a 32-byte cap add nothing. */
    const stream = new CappedStream(32);
    for (let i = 0; i < 10_000; i += 1) stream.write(utf8.encode("xxxxxxxxxx\n"));
    expect(stream.byteLength()).toBe(32);
    expect(stream.text().length).toBe(32);
    expect(stream.overflowed).toBe(true);
  });

  it("counts bytes, not characters", () => {
    // «Жауап» is five characters and ten bytes. A cap named maxOutputBytes that
    // counted characters would be twice as generous in Kazakh as in English.
    const stream = new CappedStream(10);
    stream.write(utf8.encode("Жауап"));
    expect(stream.byteLength()).toBe(10);
    expect(stream.overflowed).toBe(false);
  });

  it("decodes a multi-byte character split across two writes", () => {
    const bytes = utf8.encode("Жауап");
    const stream = new CappedStream(64);
    // Split inside the first character's two bytes.
    stream.write(bytes.subarray(0, 1));
    stream.write(bytes.subarray(1));
    expect(stream.text()).toBe("Жауап");
  });

  it("reports every byte as accepted, so Python never sees a short write", () => {
    const stream = new CappedStream(4);
    expect(stream.write(utf8.encode("abcdefgh"))).toBe(8);
    expect(stream.write(utf8.encode("ijkl"))).toBe(4);
  });
});

/* -------------------------------------------------------------------------- */
/* Status mapping                                                             */
/* -------------------------------------------------------------------------- */

describe("status from a Python failure", () => {
  it("calls a SyntaxError a syntax error", () => {
    /* The regression the server already suffered: reported as runtime_error,
       this tells a fourteen-year-old to go and check their logic when what they
       have is a missing bracket. */
    expect(classifyPythonError("SyntaxError", "")).toBe("syntax_error");
  });

  it("puts IndentationError and TabError on the same side of the line", () => {
    // Both are SyntaxError subclasses in CPython; neither program ever ran.
    expect(classifyPythonError("IndentationError", "")).toBe("syntax_error");
    expect(classifyPythonError("TabError", "")).toBe("syntax_error");
  });

  it("calls a crash a runtime error", () => {
    expect(classifyPythonError("NameError", "")).toBe("runtime_error");
    expect(classifyPythonError("ZeroDivisionError", "")).toBe("runtime_error");
    expect(classifyPythonError("EOFError", "")).toBe("runtime_error");
  });

  it("does not read a program that merely prints the words as broken syntax", () => {
    /* `print("SyntaxError")` is a working program. The exception type is the
       fact; the text is prose. */
    expect(classifyPythonError("ZeroDivisionError", "SyntaxError: not really")).toBe(
      "runtime_error",
    );
  });

  it("falls back to the traceback only when there is no exception type", () => {
    expect(classifyPythonError(undefined, "  File \"main.py\", line 1\nSyntaxError: bad")).toBe(
      "syntax_error",
    );
    expect(classifyPythonError(undefined, "NameError: name 'x' is not defined")).toBe(
      "runtime_error",
    );
  });

  it("refuses a status the harness did not promise", () => {
    expect(isWorkerDecidedStatus("ok")).toBe(true);
    expect(isWorkerDecidedStatus("syntax_error")).toBe(true);
    expect(isWorkerDecidedStatus("runtime_unavailable")).toBe(true);
    // Decided by the main thread, never by the worker — it cannot see its clock.
    expect(isWorkerDecidedStatus("time_limit_exceeded")).toBe(false);
    expect(isWorkerDecidedStatus("nonsense")).toBe(false);
    expect(isWorkerDecidedStatus(undefined)).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* The worker's message protocol                                              */
/* -------------------------------------------------------------------------- */

interface StreamWriter {
  write(buffer: Uint8Array): number;
}

interface ScriptedIo {
  out: (text: string) => void;
  err: (text: string) => void;
  readLine: () => string | undefined;
}

/**
 * A scripted stand-in for a loaded Pyodide.
 *
 * It is honest about what it is: it does not interpret Python, it plays back a
 * scripted interaction with the stream and stdin plumbing the worker installs.
 * That is enough to drive every branch of the protocol — ready, run, output
 * cap, escape — without WebAssembly.
 */
function fakePyodide(script: (io: ScriptedIo) => string): PyodideAPI {
  let stdout: StreamWriter | null = null;
  let stderr: StreamWriter | null = null;
  let stdin: (() => string | undefined) | null = null;
  const globals = new Map<string, unknown>();

  const api = {
    version: "314.0.6",
    setStdout: (options: StreamWriter) => {
      stdout = options;
    },
    setStderr: (options: StreamWriter) => {
      stderr = options;
    },
    setStdin: (options: { stdin: () => string | undefined }) => {
      stdin = options.stdin;
    },
    globals: {
      set: (key: string, value: unknown) => globals.set(key, value),
      delete: (key: string) => globals.delete(key),
      get: (key: string) => globals.get(key),
    },
    runPython: (code: string): unknown => {
      if (code.includes("python_version")) return "3.14.2";
      if (!code.includes("_solvex_run")) return undefined; // installing the harness
      return script({
        out: (text) => void stdout?.write(utf8.encode(text)),
        err: (text) => void stderr?.write(utf8.encode(text)),
        readLine: () => stdin?.(),
      });
    },
  };
  return api as unknown as PyodideAPI;
}

function fakeScope() {
  const posted: WorkerOutbound[] = [];
  const scope = {
    posted,
    postMessage(message: WorkerOutbound) {
      posted.push(message);
    },
    onmessage: null as ((event: MessageEvent) => void) | null,
    send(message: WorkerInbound) {
      this.onmessage?.({ data: message } as unknown as MessageEvent);
    },
  };
  return scope;
}

describe("the worker protocol", () => {
  it("announces the runtime it actually loaded, not a number written down", async () => {
    const scope = fakeScope();
    installWorker(scope, async () => fakePyodide(() => "ok"));
    scope.send({ kind: "boot", baseUrl: "/pyodide/" });
    await flush();
    expect(scope.posted).toEqual([
      { kind: "ready", pyodideVersion: "314.0.6", pythonVersion: "3.14.2" },
    ]);
  });

  it("reports a failed load as runtime trouble, never as the learner's", async () => {
    const scope = fakeScope();
    installWorker(scope, async () => {
      throw new Error("Failed to load '/pyodide/pyodide.asm.wasm'");
    });
    scope.send({ kind: "boot", baseUrl: "/pyodide/" });
    await flush();
    expect(scope.posted).toEqual([
      { kind: "boot_failed", message: "Failed to load '/pyodide/pyodide.asm.wasm'" },
    ]);
    // The whole point of the separate status: nothing here is about a child.
    expect(isLearnerOutcome("runtime_unavailable")).toBe(false);
  });

  it("keeps stdout and stderr apart and passes the exception name through verbatim", async () => {
    const scope = fakeScope();
    installWorker(scope, async () =>
      fakePyodide((io) => {
        io.out("before\n");
        io.err('Traceback (most recent call last):\n  File "main.py", line 2\nNameError: x\n');
        return "runtime_error";
      }),
    );
    scope.send({ kind: "run", id: 7, source: "print(x)", stdin: "", maxOutputBytes: 1024 });
    await flush();

    const done = scope.posted.find((m) => m.kind === "done");
    expect(done).toMatchObject({
      kind: "done",
      id: 7,
      status: "runtime_error",
      stdout: "before\n",
      truncated: false,
    });
    // Not translated, not rewritten, not prefixed. NameError is the fact.
    expect(done && "stderr" in done && done.stderr).toContain("NameError: x");
  });

  it("feeds successive input() calls and then stops, which is what EOFError is", async () => {
    const scope = fakeScope();
    installWorker(scope, async () =>
      fakePyodide((io) => {
        io.out(`${io.readLine()}|${io.readLine()}|${String(io.readLine())}\n`);
        return "ok";
      }),
    );
    scope.send({ kind: "run", id: 1, source: "", stdin: "3 7\n", maxOutputBytes: 1024 });
    await flush();

    const done = scope.posted.find((m) => m.kind === "done");
    // One line, then nothing — not one line and a phantom blank one.
    expect(done).toMatchObject({ stdout: "3 7|undefined|undefined\n", status: "ok" });
  });

  it("escalates the moment output crosses the cap, instead of finishing quietly", async () => {
    const scope = fakeScope();
    installWorker(scope, async () =>
      fakePyodide((io) => {
        for (let i = 0; i < 500; i += 1) io.out("xxxxxxxxxx\n");
        return "ok";
      }),
    );
    scope.send({ kind: "run", id: 3, source: "", stdin: "", maxOutputBytes: 64 });
    await flush();

    const limit = scope.posted.find((m) => m.kind === "output_limit");
    expect(limit).toBeDefined();
    expect(limit && "stdout" in limit && limit.stdout.length).toBe(64);
    /* No `done` at all: a run that blew the cap is settled by the main thread,
       which is the only side that can stop the program. Two answers to one
       press would be worse than a slow one. */
    expect(scope.posted.some((m) => m.kind === "done")).toBe(false);
  });

  it("is handed the learner's source and stdin and nothing else", () => {
    /* Not a stylistic check. The worker is the untrusted side by construction
       (`schools/execution/trust.ts`), so a hidden test case or a reference
       solution reaching it would be readable in DevTools by the person being
       assessed. The protocol has no field to put one in. */
    const run: WorkerInbound = {
      kind: "run",
      id: 1,
      source: "print(1)",
      stdin: "",
      maxOutputBytes: 64,
    };
    expect(Object.keys(run).sort()).toEqual(["id", "kind", "maxOutputBytes", "source", "stdin"]);
  });
});

/* -------------------------------------------------------------------------- */
/* The runner's lifecycle                                                     */
/* -------------------------------------------------------------------------- */

class FakeWorker implements RunnerWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly sent: WorkerInbound[] = [];
  terminated = false;

  postMessage(message: WorkerInbound): void {
    this.sent.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: WorkerOutbound): void {
    this.onmessage?.({ data: message } as unknown as MessageEvent);
  }

  fail(message: string): void {
    this.onerror?.({ message } as unknown as ErrorEvent);
  }
}

function harness(options: { timeLimitMs?: number } = {}) {
  const workers: FakeWorker[] = [];
  const runner = new PythonRunner({
    timeLimitMs: options.timeLimitMs ?? 40,
    createWorker: () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    },
  });
  const boot = async () => {
    const ready = runner.ensureReady();
    workers[workers.length - 1].emit({
      kind: "ready",
      pyodideVersion: "314.0.6",
      pythonVersion: "3.14.2",
    });
    return ready;
  };
  return { runner, workers, boot };
}

describe("the runner", () => {
  it("downloads nothing until someone asks", () => {
    const { runner, workers } = harness();
    expect(workers).toHaveLength(0);
    expect(runner.status().phase).toBe("idle");
  });

  it("reports loading, so the UI can say so rather than pretend", async () => {
    const { runner, workers, boot } = harness();
    const ready = runner.ensureReady();
    // The worker exists and the download is in flight; nothing has run.
    expect(runner.status().phase).toBe("loading");
    expect(workers[0].sent[0]).toEqual({ kind: "boot", baseUrl: "/pyodide/" });
    workers[0].emit({ kind: "ready", pyodideVersion: "314.0.6", pythonVersion: "3.14.2" });
    await expect(ready).resolves.toBe(true);
    expect(runner.status()).toMatchObject({
      phase: "ready",
      pyodideVersion: "314.0.6",
      pythonVersion: "3.14.2",
    });
    void boot;
  });

  it("hands out a stable status object, or React would loop forever", async () => {
    const { runner, boot } = harness();
    await boot();
    expect(runner.status()).toBe(runner.status());
  });

  it("reuses one warm runtime across many runs", async () => {
    const { runner, workers, boot } = harness();
    await boot();

    for (let press = 1; press <= 3; press += 1) {
      const pending = runner.run({ source: `print(${press})`, stdin: "" });
      await flush();
      workers[0].emit({
        kind: "done",
        id: press,
        status: "ok",
        stdout: `${press}\n`,
        stderr: "",
        truncated: false,
        runtimeMs: 5,
      });
      await expect(pending).resolves.toMatchObject({ status: "ok", stdout: `${press}\n` });
    }
    // Three presses, one CPython. Reloading it per press is the thing to avoid.
    expect(workers).toHaveLength(1);
  });

  it("stamps every result as a browser result and nothing more", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    const pending = runner.run({ source: "print(1)", stdin: "" });
    await flush();
    workers[0].emit({
      kind: "done",
      id: 1,
      status: "ok",
      stdout: "1\n",
      stderr: "",
      truncated: false,
      runtimeMs: 5,
    });
    const result = await pending;
    /* A green local run is feedback, never evidence. `trust` is set where the
       execution happened and carried, never recomputed from the status. */
    expect(result.trust).toBe("client_local");
  });

  it("passes a syntax error through as a syntax error", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    const pending = runner.run({ source: "print(", stdin: "" });
    await flush();
    workers[0].emit({
      kind: "done",
      id: 1,
      status: "syntax_error",
      stdout: "",
      stderr: "SyntaxError: '(' was never closed\n",
      truncated: false,
      runtimeMs: 3,
    });
    await expect(pending).resolves.toMatchObject({ status: "syntax_error" });
  });

  it("kills a runaway program, replaces the worker, and can run again at once", async () => {
    const { runner, workers, boot } = harness({ timeLimitMs: 30 });
    await boot();

    const pending = runner.run({ source: "while True: pass", stdin: "" });
    await flush();
    // The worker is inside the loop and will never answer. Nobody can ask it to
    // stop; the only stop button is on this side.
    workers[0].emit({ kind: "progress", id: 1, stdout: "0\n1\n", stderr: "" });

    const result = await pending;
    expect(result.status).toBe("time_limit_exceeded");
    // Whatever it managed to print before it was killed is still worth showing.
    expect(result.stdout).toBe("0\n1\n");
    expect(workers[0].terminated).toBe(true);

    /* A replacement is already booting, not waiting for the next press. The
       learner reads the error while it warms. */
    expect(workers).toHaveLength(2);
    expect(workers[1].sent[0]).toEqual({ kind: "boot", baseUrl: "/pyodide/" });

    workers[1].emit({ kind: "ready", pyodideVersion: "314.0.6", pythonVersion: "3.14.2" });
    const second = runner.run({ source: "print(1)", stdin: "" });
    await flush();
    workers[1].emit({
      kind: "done",
      id: 2,
      status: "ok",
      stdout: "1\n",
      stderr: "",
      truncated: false,
      runtimeMs: 4,
    });
    // THE assertion behind terminate-and-replace: one broken program does not
    // poison the rest of the lesson.
    await expect(second).resolves.toMatchObject({ status: "ok", stdout: "1\n" });
  });

  it("kills a program that printed past the cap and marks the result truncated", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    const pending = runner.run({ source: 'while True: print("x")', stdin: "" });
    await flush();
    workers[0].emit({
      kind: "output_limit",
      id: 1,
      stdout: "x".repeat(64),
      stderr: "",
      runtimeMs: 11,
    });
    const result = await pending;
    expect(result.status).toBe("output_limit_exceeded");
    expect(result.truncated).toBe(true);
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(2);
  });

  it("ignores a dead worker's late answer", async () => {
    const { runner, workers, boot } = harness({ timeLimitMs: 20 });
    await boot();
    const pending = runner.run({ source: "while True: pass", stdin: "" });
    await flush();
    await expect(pending).resolves.toMatchObject({ status: "time_limit_exceeded" });

    /* A message from the terminated worker for run 1 arriving now must not be
       mistaken for the answer to run 2. Without the id check a learner would
       see the previous program's output attributed to the one they just ran. */
    workers[0].emit({
      kind: "done",
      id: 1,
      status: "ok",
      stdout: "stale\n",
      stderr: "",
      truncated: false,
      runtimeMs: 1,
    });
    workers[1].emit({ kind: "ready", pyodideVersion: "314.0.6", pythonVersion: "3.14.2" });
    const second = runner.run({ source: "print(2)", stdin: "" });
    await flush();
    workers[1].emit({
      kind: "done",
      id: 2,
      status: "ok",
      stdout: "2\n",
      stderr: "",
      truncated: false,
      runtimeMs: 2,
    });
    await expect(second).resolves.toMatchObject({ stdout: "2\n" });
  });

  it("says the runtime is unavailable when Pyodide will not start, and stays retryable", async () => {
    const { runner, workers } = harness();
    const ready = runner.ensureReady();
    workers[0].emit({ kind: "boot_failed", message: "network is unreachable" });
    await expect(ready).resolves.toBe(false);
    expect(runner.status()).toMatchObject({ phase: "unavailable", error: "network is unreachable" });
    expect(workers[0].terminated).toBe(true);
    // No respawn storm: a boot that failed is not retried until someone asks.
    expect(workers).toHaveLength(1);

    /* The press IS the retry, and it waits for the outcome.
     *
     * This test used to `await runner.run(...)` and expect an immediate
     * `runtime_unavailable` alongside a retry kicked off in the background. It
     * hung, and the hang was worth reading rather than silencing: the runner
     * spawns a second worker and waits for it, which is the better of the two
     * designs — with the "instant failure plus background retry" shape, the
     * first press after any hiccup can NEVER succeed, and a learner has to
     * press Run twice to find that out.
     *
     * So the retry is driven here instead of assumed. A second failure settles
     * the same way, which is what a learner sees when the Wi-Fi is still down. */
    const retried = runner.run({ source: "print(1)", stdin: "" });
    await flush();
    expect(workers, "the press must start a fresh attempt").toHaveLength(2);
    workers[1].emit({ kind: "boot_failed", message: "still unreachable" });

    const result = await retried;
    expect(result.status).toBe("runtime_unavailable");
    expect(isLearnerOutcome(result.status), "our outage, not their program").toBe(false);
  });

  it("succeeds on the retry when the connection comes back", async () => {
    /* The other half, and the reason the design above is worth the wait: the
       press that follows a recovered connection actually runs the program,
       rather than reporting failure and asking for a second press. */
    const { runner, workers } = harness();
    const first = runner.ensureReady();
    workers[0].emit({ kind: "boot_failed", message: "network is unreachable" });
    await expect(first).resolves.toBe(false);

    const pending = runner.run({ source: "print(1)", stdin: "" });
    await flush();
    workers[1].emit({ kind: "ready", pyodideVersion: "0.0.0", pythonVersion: "3.13.0" });
    await flush();
    const runMessage = workers[1].sent.find((m) => m.kind === "run");
    expect(runMessage, "the queued program must reach the new worker").toBeDefined();
    workers[1].emit({
      kind: "done",
      id: (runMessage as { id: number }).id,
      status: "ok",
      stdout: "1\n",
      stderr: "",
      truncated: false,
      runtimeMs: 3,
    });
    await expect(pending).resolves.toMatchObject({ status: "ok", stdout: "1\n" });
    expect(runner.status().phase).toBe("ready");
  });

  it("gives up on a boot that never answers at all", async () => {
    /* The failure `boot_failed` does not cover, and the one a school actually
       produces: the connection drops mid-download of a 13 MB WASM file, so the
       worker sends nothing — no error, no ready. Before the boot timeout
       existed, `ensureReady()` waited on a promise nobody would settle and the
       Run button span for the rest of the lesson.
       Fake timers, so the assertion costs no wall-clock. */
    vi.useFakeTimers();
    try {
      const { runner, workers } = harness();
      const pending = runner.run({ source: "print(1)", stdin: "" });
      await vi.advanceTimersByTimeAsync(1_000);
      expect(runner.status().phase, "still trying, a minute is not yet a failure").toBe("loading");

      await vi.advanceTimersByTimeAsync(30_000);
      const result = await pending;
      expect(result.status).toBe("runtime_unavailable");
      expect(isLearnerOutcome(result.status)).toBe(false);
      expect(runner.status().phase).toBe("unavailable");
      expect(workers[0].terminated, "a stalled worker must not be left running").toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats a worker that dies on its own as runtime trouble too", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    const pending = runner.run({ source: "print(1)", stdin: "" });
    await flush();
    workers[0].fail("out of memory");
    const result = await pending;
    expect(result.status).toBe("runtime_unavailable");
    // Not recorded against the learner — the same rule the server uses.
    expect(isLearnerOutcome(result.status)).toBe(false);
  });

  it("refuses an oversized paste before it reaches the worker", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    const result = await runner.run({
      source: "x".repeat(LOCAL_LIMITS.maxSourceBytes + 1),
      stdin: "",
    });
    expect(result.status).toBe("runtime_unavailable");
    // The important half: WE refused, so it is not something the learner did.
    expect(isLearnerOutcome(result.status)).toBe(false);
    expect(result.stderr).toMatch(/too large/);
    expect(workers[0].sent.filter((m) => m.kind === "run")).toHaveLength(0);
  });

  it("refuses oversized stdin on the same rule", async () => {
    const { runner, boot } = harness();
    await boot();
    const result = await runner.run({
      source: "print(1)",
      stdin: "x".repeat(LOCAL_LIMITS.maxStdinBytes + 1),
    });
    expect(result.status).toBe("runtime_unavailable");
  });

  it("runs one program at a time", async () => {
    const { runner, workers, boot } = harness({ timeLimitMs: 500 });
    await boot();

    const first = runner.run({ source: "print(1)", stdin: "" });
    const second = runner.run({ source: "print(2)", stdin: "" });
    await flush();

    /* One interpreter, one program. The second press must not be posted while
       the first is still executing, or its output would arrive interleaved with
       output from a program the learner has already moved on from. */
    expect(workers[0].sent.filter((m) => m.kind === "run")).toHaveLength(1);

    workers[0].emit({
      kind: "done",
      id: 1,
      status: "ok",
      stdout: "1\n",
      stderr: "",
      truncated: false,
      runtimeMs: 1,
    });
    await expect(first).resolves.toMatchObject({ stdout: "1\n" });
    await flush();

    expect(workers[0].sent.filter((m) => m.kind === "run")).toHaveLength(2);
    workers[0].emit({
      kind: "done",
      id: 2,
      status: "ok",
      stdout: "2\n",
      stderr: "",
      truncated: false,
      runtimeMs: 1,
    });
    await expect(second).resolves.toMatchObject({ stdout: "2\n" });
  });

  it("uses the shared budget when the caller does not override it", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    void runner.run({ source: "print(1)", stdin: "" });
    await flush();
    expect(workers[0].sent.at(-1)).toMatchObject({
      maxOutputBytes: LOCAL_LIMITS.maxOutputBytes,
    });
  });

  it("stops for good on dispose, without spawning a replacement", async () => {
    const { runner, workers, boot } = harness();
    await boot();
    runner.dispose();
    expect(workers[0].terminated).toBe(true);
    expect(workers).toHaveLength(1);
    const result = await runner.run({ source: "print(1)", stdin: "" });
    expect(result.status).toBe("runtime_unavailable");
    expect(workers).toHaveLength(1);
  });

  it("notifies subscribers when the phase changes", async () => {
    const { runner, workers } = harness();
    const seen = vi.fn();
    const unsubscribe = runner.subscribe(seen);
    const ready = runner.ensureReady();
    workers[0].emit({ kind: "ready", pyodideVersion: "314.0.6", pythonVersion: "3.14.2" });
    await ready;
    expect(seen).toHaveBeenCalled();
    unsubscribe();
  });

  it("does not blow the budget it was given", async () => {
    /* Guards the arithmetic rather than the mechanism: a timer armed with the
       wrong unit would still pass every test above, and only show up as a Run
       button that hangs for fifty minutes. */
    const { runner, boot } = harness({ timeLimitMs: 25 });
    await boot();
    const started = Date.now();
    const result = await runner.run({ source: "while True: pass", stdin: "" });
    expect(result.status).toBe("time_limit_exceeded");
    expect(Date.now() - started).toBeLessThan(1_000);
    await wait(1);
  });
});
