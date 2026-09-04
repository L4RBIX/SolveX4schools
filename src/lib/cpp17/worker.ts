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
import { cpp17AssetUrl, CPP17_TOTAL_BYTES } from "./assets";
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
  /**
   * Bytes of the toolchain that have arrived, while it is arriving.
   *
   * Real decoded bytes against the real total from `assets.ts`, never a
   * percentage computed from `content-length` — that header carries the BROTLI
   * length while `fetch` hands us the decoded stream, and a bar built from the
   * two counts past 300%. A learner on a school connection is entitled to know
   * whether anything is happening; they are not entitled to a made-up number.
   */
  | { kind: "progress"; loadedBytes: number; totalBytes: number }
  /**
   * Compilation and linking are done; the learner's program is about to run.
   *
   * The runner cannot infer this moment, and it has to know it: the deadline
   * that means "your program did not finish" must start HERE, not when the
   * job was posted. Sending it is the only way the two sides can agree on
   * where compiling stops and running starts.
   */
  | { kind: "running"; id: number; compileMs: number }
  | {
      kind: "result";
      id: number;
      status: LocalExecutionStatus;
      stdout: string;
      stderr: string;
      truncated: boolean;
      runtimeMs: number;
      /** The learner's program opened a file. The memfs is no longer pristine
       *  and this worker must not be reused — see `watchForFileAccess`. */
      filesystemTouched: boolean;
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
  /**
   * The program's own `cerr`, kept apart from its `cout`.
   *
   * It was not. `host_write` dropped the file descriptor, so both streams
   * arrived here as one and the panel's two panes had one thing to put in them.
   * A learner who cannot tell a printed answer from a diagnostic cannot debug,
   * and Nova's `program_stderr` slot was permanently empty for the same reason.
   */
  private runErrChunks: string[] = [];
  private bytes = 0;
  private phase: "compile" | "run" = "compile";
  truncated = false;

  constructor(private readonly maxBytes: number) {}

  enterRunPhase(): void {
    this.phase = "run";
  }

  /** `fd` is 1 for stdout and 2 for stderr; the runtime's own lines use 2. */
  write(text: string, fd = 1): void {
    if (this.truncated) return;
    /* UTF-8 bytes, not code units. The cap is shared with the server
       (`LOCAL_LIMITS.maxOutputBytes`) and the server counts bytes, so a Kazakh
       program must be cut at the same point in both places.

       ONE budget across both streams, deliberately: the ceiling is about what
       this worker will hold and post, and a program flooding `cerr` costs the
       same memory as one flooding `cout`. */
    this.bytes += new TextEncoder().encode(text).length;
    if (this.bytes > this.maxBytes) {
      this.truncated = true;
      throw new OutputLimitExceeded();
    }
    if (this.phase === "compile") {
      this.compileChunks.push(text);
      return;
    }
    (fd === 2 ? this.runErrChunks : this.runChunks).push(text);
  }

  /** Compiler diagnostics, with the reference's own progress lines removed. */
  compilerOutput(): string {
    return stripProgress(this.compileChunks.join(""));
  }

  programOutput(): string {
    return stripProgress(this.runChunks.join(""));
  }

  /** What the program wrote to `cerr`, plus anything the runtime said. */
  programErrorOutput(): string {
    return stripProgress(this.runErrChunks.join(""));
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

/**
 * Did the learner's program touch the filesystem?
 *
 * ## Why this exists
 *
 * The in-memory filesystem is built once, at init, and every Run after that
 * shares it. Verified in a real browser: a program that writes `planted.txt`
 * finds it again on the next Run, and a program that opens
 * `include/bits/stdc++.h` for writing can put `#error` in it and break every
 * compile that follows until the page is reloaded.
 *
 * That is NOT a sandbox escape and it was checked rather than assumed. The
 * same session also proved the host filesystem is unreachable (`/etc/passwd`
 * and four others: denied), `system` does not link, `socket` is not even
 * declared, and the environment is empty. The memfs lives in one Worker, in
 * one tab, for one learner; nothing in it can reach the host, the page, or
 * another child.
 *
 * What it is, is a footgun with a baffling symptom: the compiler starts
 * complaining about a header the learner never opened, in a lesson unrelated
 * to the one where they experimented, and the only cure is a reload nobody
 * would think to try. It also quietly breaks the promise Run makes — that it
 * shows you what YOUR program does — because the second run of the same source
 * can behave differently from the first.
 *
 * ## Why "any open at all" is the right trigger
 *
 * Decoding WASI's `oflags` and `fs_rights_base` to distinguish reads from
 * writes would couple this file to the vendored ABI for no benefit. Year 1
 * teaches no file I/O whatsoever — `ifstream` and `ofstream` appear nowhere in
 * the curriculum, and stdin/stdout/stderr are already-open descriptors that
 * never call `path_open`. So for every real lesson this flag is false and
 * costs nothing, and the only learners who pay for a worker recycle are the
 * ones who went looking. Over-recycling is a warm restart; under-recycling is
 * the bug.
 */
export function watchForFileAccess(a: WasmClangApi): { touched: () => boolean; release: () => void } {
  /*
   * The exports object of a WebAssembly instance is FROZEN.
   *
   * The JS API spec freezes it, and this file is an ES module — so strict mode
   * turns `exports.path_open = …` below into a thrown TypeError rather than a
   * silent no-op:
   *
   *     Cannot assign to read only property 'path_open' of object '[object Object]'
   *
   * `shared.js` sets `this.exports = instance.exports` directly, so that is
   * exactly what arrives here. The throw happened AFTER compile and link
   * succeeded, on the line that starts watching the learner's own program —
   * which is why it presented as "the compiler works but nothing ever runs"
   * rather than as a compiler failure.
   *
   * Swapping in a mutable shallow copy is safe and is the smallest fix that
   * does not touch vendored code: WebAssembly exported functions do not close
   * over `this`, `shared.js` re-reads `this.memfs.exports` on every run (it
   * spreads them into the `wasi_unstable` import object), and `memory` was
   * already captured by `new Memory(this.exports.memory)` during init. Done
   * once, and only when the object is actually frozen, so a future vendored
   * change that hands over a plain object costs nothing.
   */
  if (Object.isFrozen(a.memfs.exports)) {
    a.memfs.exports = { ...a.memfs.exports };
  }
  const exports = a.memfs.exports;
  const original = exports.path_open;
  if (typeof original !== "function") {
    /* The vendored memfs changed shape. Report "touched" rather than pretend
       to know: a false recycle is cheap, a missed one is the defect. */
    return { touched: () => true, release: () => {} };
  }
  let seen = false;
  exports.path_open = (...args: unknown[]) => {
    seen = true;
    return (original as (...a: unknown[]) => unknown).apply(exports, args);
  };
  return {
    touched: () => seen,
    release: () => {
      exports.path_open = original;
    },
  };
}

export interface WasmClangApi {
  ready: Promise<unknown>;
  clangCommonArgs: string[];
  memfs: {
    setStdinStr(s: string): void;
    addFile(path: string, contents: string): void;
    getFileContents(path: string): Uint8Array;
    /* The memfs wasm instance's own exports. `shared.js` spreads these into the
       `wasi_unstable` import object of every program it runs, which is what
       makes `path_open` interceptable from here. */
    exports: Record<string, unknown>;
  };
  compile(o: { input: string; contents: string; obj: string }): Promise<unknown>;
  link(obj: string, wasm: string): Promise<unknown>;
  run(mod: WebAssembly.Module, ...args: string[]): Promise<unknown>;
  /**
   * Fetch, compile and cache one module by name.
   *
   * The reference calls this lazily from `compile` and `link`. `init` calls it
   * eagerly, which is the whole of the preload fix — see there.
   */
  getModule(name: string): Promise<WebAssembly.Module>;
}

let api: WasmClangApi | null = null;
let sink: OutputSink | null = null;

function post(message: WorkerOutbound): void {
  (self as unknown as { postMessage(m: WorkerOutbound): void }).postMessage(message);
}

/**
 * Bring the whole toolchain up, and say how far along it is.
 *
 * ## The defect
 *
 * This awaited `api.ready`, which is `memfs.wasm` and `sysroot.tar` — 9 MB of
 * the 57. `clang.wasm` and `lld.wasm` are 50 MB more, and the reference fetches
 * them lazily from inside `compile()` and `link()`. So the "preparing C++"
 * preload finished having downloaded a sixth of the compiler, and the other
 * five sixths were downloaded INSIDE the first Run — inside
 * `COMPILE_BUDGET_MS`, the thirty seconds that exist to bound a COMPILE.
 *
 * Below roughly 4.5 Mbit/s that budget expires mid-download. The runner then
 * destroys the worker, which throws away every byte that had arrived, and
 * starts a replacement that begins again from zero — so the learner sees
 * «Компилятор C++ не запустился» on every press, forever, and pressing again
 * makes it worse rather than better. A class of thirty on a 20 Mbit/s school
 * connection is about 224 seconds for the first compile.
 *
 * ## The fix
 *
 * Everything is resident before `ready` is posted. A download is not a build
 * and must not be billed to a build's clock; the runner's build budget now
 * starts when the build does.
 *
 * The cost is stated: the first lesson open fetches 57 MB rather than 9. It was
 * always going to fetch 57 — the question was only whether it did so under a
 * timer that kills it. `next.config.ts` serves these `immutable` and the URL
 * carries the pinned commit, so it happens once per learner per pin.
 */
async function init(baseUrl: string): Promise<void> {
  const started = Date.now();

  /*
   * Bytes, counted as they are decoded.
   *
   * `WebAssembly.compileStreaming` wants a `Response`, so the body is piped
   * through a counter and handed on — the stream is not buffered, so streaming
   * compilation still overlaps the download exactly as it did.
   */
  let loadedBytes = 0;
  const report = () => post({ kind: "progress", loadedBytes, totalBytes: CPP17_TOTAL_BYTES });

  const counted = async (name: string): Promise<Response> => {
    const res = await fetch(cpp17AssetUrl(baseUrl, name));
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    if (!res.body) return res;
    const reader = res.body.getReader();
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        loadedBytes += value.byteLength;
        report();
        controller.enqueue(value);
      },
      cancel(reason) {
        void reader.cancel(reason);
      },
    });
    /* The content type is carried over deliberately: `compileStreaming` refuses
       anything that is not `application/wasm`, and a hand-built Response with
       no headers would fail there rather than here. */
    return new Response(stream, { status: res.status, headers: res.headers });
  };

  const Ctor = API as unknown as new (o: Record<string, unknown>) => WasmClangApi;
  api = new Ctor({
    /* Everything is fetched from our own origin under `baseUrl`. No CDN, no
       third-party host: these are 57 MB of compiler that runs the learner's
       code, and where they come from is part of the security posture. */
    readBuffer: (f: string) => counted(f).then((r) => r.arrayBuffer()),
    compileStreaming: (f: string) => WebAssembly.compileStreaming(counted(f)),
    hostWrite: (s: string, fd?: number) => sink?.write(s, fd ?? 1),
    clang: "clang.wasm",
    lld: "lld.wasm",
    memfs: "memfs.wasm",
    sysroot: "sysroot.tar",
  });
  report();
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

  /*
   * The compiler and the linker, resident before anyone is told this is ready.
   *
   * Sequential rather than parallel, and that is not an oversight. They are
   * 31 MB and 19 MB; fetching both at once on a shared school connection halves
   * each one's throughput and delays the moment either is usable, while the
   * progress the learner watches becomes two bars racing. Sequential also means
   * a failure names which asset failed.
   */
  await api.getModule("clang.wasm");
  await api.getModule("lld.wasm");

  post({ kind: "ready", initMs: Date.now() - started });
}

async function run(msg: Extract<WorkerInbound, { kind: "run" }>): Promise<void> {
  const started = Date.now();
  const cap = msg.maxOutputBytes ?? LOCAL_LIMITS.maxOutputBytes;
  sink = new OutputSink(cap);

  if (!api) {
    post({ kind: "result", id: msg.id, status: "runtime_unavailable",
           stdout: "", stderr: "", truncated: false, runtimeMs: 0,
           filesystemTouched: false });
    return;
  }

  /* Set by the run phase. A compile that never reached `api.run` cannot have
     let the learner's code near the filesystem, so it stays false. */
  let filesystemTouched = false;

  const done = (status: LocalExecutionStatus, stdout: string, stderr: string) =>
    post({ kind: "result", id: msg.id, status, stdout, stderr,
           truncated: sink?.truncated ?? false, runtimeMs: Date.now() - started,
           filesystemTouched });

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
    /* Both sides now agree the build is over. Anything after this line is the
       learner's program, and so is anything the clock says about it. */
    post({ kind: "running", id: msg.id, compileMs: Date.now() - started });

    let mod: WebAssembly.Module;
    try {
      mod = await WebAssembly.compile(api.memfs.getFileContents("main.wasm").slice().buffer as ArrayBuffer);
    } catch (err) {
      return done("runtime_unavailable", "", String(err));
    }

    /* Watch only the learner's program. The compile and link phases above open
       dozens of sysroot headers legitimately, and watching those would recycle
       the worker on every single Run. */
    const watch = watchForFileAccess(api);
    try {
      await api.run(mod, "main.wasm");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      filesystemTouched = watch.touched();
      watch.release();
      if (sink.truncated) {
        return done("output_limit_exceeded", sink.programOutput(), sink.programErrorOutput());
      }
      /* `ProcExit` with a non-zero code is the program's own `return 1`, not a
         crash of ours. Everything else — a trap, an unhandled exception, a
         failed `vector::at` — is a runtime error the learner caused. */
      if (/exited with code 0\b/.test(message)) {
        return done("ok", sink.programOutput(), sink.programErrorOutput());
      }
      /* The program's own `cerr` FIRST, then what the runtime said about the
         crash. That order is the learner's: whatever their program managed to
         report is the thing most likely to name the bug, and the trap's word
         is what `runtimeFaultNote` turns into a sentence. */
      const errText = sink.programErrorOutput();
      return done("runtime_error", sink.programOutput(), errText ? `${errText}${message}` : message);
    }
    filesystemTouched = watch.touched();
    watch.release();

    void compilerText;
    return done("ok", sink.programOutput(), sink.programErrorOutput());
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
