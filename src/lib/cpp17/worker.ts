/**
 * The C++17 worker.
 *
 * Compiles and runs the learner's program off the UI thread: `clang.wasm`
 * emits an object, `lld.wasm` links it against the WASI sysroot, and the
 * resulting `program.wasm` runs with the learner's stdin piped in.
 *
 * ## Why the main thread may never do this
 *
 * A compile is 700–2000 ms of solid CPU. On the main thread that is 700–2000 ms
 * of a frozen page — no scrolling, no typing, no cancel button. Worse, a
 * learner's `while (true) {}` would hang the tab with no way back. Everything
 * expensive happens here, and the runner on the other side can always
 * `terminate()` this whole worker, which is the only reliable way to stop a
 * running WebAssembly instance.
 *
 * ## What this file does NOT decide
 *
 * The time limit. A worker cannot time itself out — the loop that needs
 * interrupting is the same loop that would check the clock. `runner.ts` owns
 * the deadline and kills the worker when it passes. This file bounds only what
 * it can bound from the outside of the program: how much it is allowed to
 * print.
 */

import { API } from "./vendor/wasm-clang-shared.js";
import { BITS_STDCPP_PATH, bitsStdcppSource } from "./bits-stdcpp";
import {
  LOCAL_LIMITS,
  type LocalExecutionStatus,
} from "@schools/execution/trust";

/** Where the pinned compiler assets are served from. */
export const DEFAULT_CPP17_BASE_URL = "/cpp17/";

/**
 * The standard, passed explicitly on every compile.
 *
 * `clang -cc1` defaults to C++14 here and the upstream reference sets no
 * standard at all, so structured bindings — which October onwards uses — would
 * fail with a diagnostic about a language feature the course has just taught.
 */
export const CPP_STANDARD = "-std=c++17";

export type WorkerInbound =
  | { kind: "init"; baseUrl?: string }
  | { kind: "run"; id: number; source: string; stdin: string; maxOutputBytes?: number };

export type WorkerOutbound =
  | { kind: "ready"; initMs: number }
  | { kind: "failed"; error: string }
  | {
      kind: "result";
      id: number;
      status: LocalExecutionStatus;
      stdout: string;
      stderr: string;
      truncated: boolean;
      runtimeMs: number;
    };

/* -------------------------------------------------------------------------- */
/* Output accounting                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Everything the compiler and the program wrote, bounded.
 *
 * `while (true) cout << "x";` produces output faster than any timeout notices,
 * and an unbounded accumulator is a tab that dies of memory exhaustion rather
 * than one that reports a runaway loop. Once the cap is passed the sink throws,
 * which unwinds out of the WASI write and stops the program — the same
 * mechanism `ProcExit` uses upstream.
 */
class OutputSink {
  private compileChunks: string[] = [];
  private runChunks: string[] = [];
  private bytes = 0;
  private phase: "compile" | "run" = "compile";
  truncated = false;

  constructor(private readonly maxBytes: number) {}

  enterRunPhase(): void {
    this.phase = "run";
  }

  write(text: string): void {
    if (this.truncated) return;
    /* UTF-8 bytes, not code units. The cap is shared with the server
       (`LOCAL_LIMITS.maxOutputBytes`) and the server counts bytes, so a Kazakh
       program must be cut at the same point in both places. */
    this.bytes += new TextEncoder().encode(text).length;
    if (this.bytes > this.maxBytes) {
      this.truncated = true;
      throw new OutputLimitExceeded();
    }
    (this.phase === "compile" ? this.compileChunks : this.runChunks).push(text);
  }

  /** Compiler diagnostics, with the reference's own progress lines removed. */
  compilerOutput(): string {
    return stripProgress(this.compileChunks.join(""));
  }

  programOutput(): string {
    return stripProgress(this.runChunks.join(""));
  }
}

export class OutputLimitExceeded extends Error {
  constructor() {
    super("output limit exceeded");
    this.name = "OutputLimitExceeded";
  }
}

/**
 * Strip the reference runtime's own chatter and colour.
 *
 * It narrates itself with `\x1b[1;93m>\x1b[0m Compiling test.wasm... done.`,
 * which is useful in its demo terminal and is noise in a lesson. The learner
 * asked what their program printed; they get exactly that.
 *
 * Exported for unit test: this is the function that decides what a learner
 * sees, and it must not eat a legitimate line of their output that happens to
 * begin with `>`.
 */
export function stripProgress(text: string): string {
  /* The runtime narrates itself through the SAME `hostWrite` the learner's
     program prints to, so the two arrive interleaved in one stream and have to
     be told apart here.

     It is told apart by the escape sequence, not by the words. `hostLog`
     prefixes every line with a yellow arrow — `\x1b[1;93m>\x1b[0m ` — and a
     learner's `cout << "> done"` has no colour in it. Matching on the text
     would eat their line; matching on the marker cannot. */
  const withoutNarration = text
    .split("\n")
    .filter((line) => !/^\x1b\[1;9[0-9]m>\x1b\[0m /.test(line))
    .join("\n");

  return (
    withoutNarration
      .replace(/\x1b\[[0-9;]*m/g, "")
      /* The reference also writes its own post-mortem when a program traps or
         exits non-zero. We already report that as a status, so repeating it
         inside the learner's output is telling them twice, in our words, about
         something the UI is about to say properly. Anchored to the end because
         that is where it is appended, so a program that prints the same text
         mid-run keeps it. */
      .replace(/\n?(Error: unreachable\n?)?(RuntimeError:[\s\S]*)?$/u, (m) =>
        /^\n?(Error: unreachable|RuntimeError:)/.test(m) ? "" : m,
      )
      .replace(/\n?Error: process exited with code \d+\.\s*$/u, "")
      .replace(/\s+$/u, "")
  );
}

/* -------------------------------------------------------------------------- */
/* Diagnosis                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Which of the shared statuses this failure is.
 *
 * The distinction that matters most is the first one: a program that did not
 * COMPILE is `syntax_error`, and a program that compiled and then died is
 * `runtime_error`. Collapsing them would tell a beginner their working idea was
 * a crash, or their crash was a typo.
 *
 * Exported and pure so the mapping is tested without a browser.
 */
export function classifyFailure(
  phase: "compile" | "link" | "run",
  message: string,
): LocalExecutionStatus {
  if (phase === "compile" || phase === "link") return "syntax_error";
  if (/OutputLimitExceeded|output limit/i.test(message)) return "output_limit_exceeded";
  return "runtime_error";
}

/* -------------------------------------------------------------------------- */
/* The worker                                                                 */
/* -------------------------------------------------------------------------- */

interface WasmClangApi {
  ready: Promise<unknown>;
  clangCommonArgs: string[];
  memfs: {
    setStdinStr(s: string): void;
    addFile(path: string, contents: string): void;
    getFileContents(path: string): Uint8Array;
  };
  compile(o: { input: string; contents: string; obj: string }): Promise<unknown>;
  link(obj: string, wasm: string): Promise<unknown>;
  run(mod: WebAssembly.Module, ...args: string[]): Promise<unknown>;
}

let api: WasmClangApi | null = null;
let sink: OutputSink | null = null;

function post(message: WorkerOutbound): void {
  (self as unknown as { postMessage(m: WorkerOutbound): void }).postMessage(message);
}

async function init(baseUrl: string): Promise<void> {
  const started = Date.now();
  const Ctor = API as unknown as new (o: Record<string, unknown>) => WasmClangApi;
  api = new Ctor({
    /* Everything is fetched from our own origin under `baseUrl`. No CDN, no
       third-party host: these are 57 MB of compiler that runs the learner's
       code, and where they come from is part of the security posture. */
    readBuffer: (f: string) =>
      fetch(baseUrl + f).then((r) => {
        if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`);
        return r.arrayBuffer();
      }),
    compileStreaming: (f: string) => WebAssembly.compileStreaming(fetch(baseUrl + f)),
    hostWrite: (s: string) => sink?.write(s),
    clang: "clang.wasm",
    lld: "lld.wasm",
    memfs: "memfs.wasm",
    sysroot: "sysroot.tar",
  });
  await api.ready;
  /* Set once, after construction, so every compile in this worker's life is
     C++17 and no call site can forget. */
  api.clangCommonArgs = [
    ...api.clangCommonArgs.filter((a) => !a.startsWith("-std=")),
    CPP_STANDARD,
  ];
  /* `bits/stdc++.h`, which GCC has and libc++ does not. Without it the same
     source compiles on Judge0 and fails here, which would read to a learner as
     a broken browser. The sysroot already has an `/include/bits/` directory, so
     this lands on the existing include path with no extra flag. */
  api.memfs.addFile(BITS_STDCPP_PATH, bitsStdcppSource());
  post({ kind: "ready", initMs: Date.now() - started });
}

async function run(msg: Extract<WorkerInbound, { kind: "run" }>): Promise<void> {
  const started = Date.now();
  const cap = msg.maxOutputBytes ?? LOCAL_LIMITS.maxOutputBytes;
  sink = new OutputSink(cap);

  if (!api) {
    post({ kind: "result", id: msg.id, status: "runtime_unavailable",
           stdout: "", stderr: "", truncated: false, runtimeMs: 0 });
    return;
  }

  const done = (status: LocalExecutionStatus, stdout: string, stderr: string) =>
    post({ kind: "result", id: msg.id, status, stdout, stderr,
           truncated: sink?.truncated ?? false, runtimeMs: Date.now() - started });

  /*
   * Three explicit steps rather than the reference's `compileLinkRun`.
   *
   * That convenience wrapper is one await, so there is no moment at which this
   * file knows whether the bytes arriving at `hostWrite` are a clang diagnostic
   * or the learner's own `cout`. Both then land in the same buffer, and a
   * compile error gets reported as program output. Running the phases here
   * costs three lines and makes "did it compile" a fact rather than a guess.
   */
  try {
    api.memfs.setStdinStr(msg.stdin);

    try {
      await api.compile({ input: "main.cc", contents: msg.source, obj: "main.o" });
    } catch (err) {
      if (sink.truncated) return done("output_limit_exceeded", "", sink.compilerOutput());
      return done("syntax_error", "", sink.compilerOutput() || String(err));
    }

    try {
      await api.link("main.o", "main.wasm");
    } catch (err) {
      /* A link failure is still "your program did not build". The learner is
         not shown wasm-ld's vocabulary if clang already said something. */
      return done("syntax_error", "", sink.compilerOutput() || String(err));
    }

    const compilerText = sink.compilerOutput();
    sink.enterRunPhase();

    let mod: WebAssembly.Module;
    try {
      mod = await WebAssembly.compile(api.memfs.getFileContents("main.wasm").slice().buffer as ArrayBuffer);
    } catch (err) {
      return done("runtime_unavailable", "", String(err));
    }

    try {
      await api.run(mod, "main.wasm");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (sink.truncated) return done("output_limit_exceeded", sink.programOutput(), "");
      /* `ProcExit` with a non-zero code is the program's own `return 1`, not a
         crash of ours. Everything else — a trap, an unhandled exception, a
         failed `vector::at` — is a runtime error the learner caused. */
      if (/exited with code 0\b/.test(message)) return done("ok", sink.programOutput(), "");
      return done("runtime_error", sink.programOutput(), message);
    }

    void compilerText;
    return done("ok", sink.programOutput(), "");
  } finally {
    sink = null;
  }
}

/**
 * Wire the worker into a scope.
 *
 * Installed rather than assigned at module top level, and only when there IS a
 * worker scope. `tests/cpp17/runner.test.ts` imports this module for its pure
 * helpers, and a bare `self.onmessage = ...` makes that import throw
 * `ReferenceError: self is not defined` under Node. Same shape and same reason
 * as `installWorker` in the Pyodide worker beside it.
 */
export interface Cpp17WorkerScope {
  onmessage: ((event: MessageEvent<WorkerInbound>) => void) | null;
  postMessage(message: WorkerOutbound): void;
}

export function installCpp17Worker(scope: Cpp17WorkerScope): void {
  scope.onmessage = (event: MessageEvent<WorkerInbound>) => {
    const msg = event.data;
    void (async () => {
      try {
        if (msg.kind === "init") return void (await init(msg.baseUrl ?? DEFAULT_CPP17_BASE_URL));
        if (msg.kind === "run") return void (await run(msg));
      } catch (err) {
        post({ kind: "failed", error: err instanceof Error ? err.message : String(err) });
      }
    })();
  };
}

/* `WorkerGlobalScope` is reached through `globalThis` because this project's
   `lib` is `dom`, not `webworker`, so the bare name would not type-check. */
const workerGlobal = globalThis as unknown as { WorkerGlobalScope?: unknown };
if (typeof workerGlobal.WorkerGlobalScope !== "undefined") {
  installCpp17Worker(globalThis as unknown as Cpp17WorkerScope);
}
