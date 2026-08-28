/**
 * Python, in a Web Worker, in the learner's browser.
 *
 * This is the ONLY module that loads Pyodide. Nothing else may — not the lesson
 * player, not a route, not a convenience helper — because the single property
 * this whole subsystem is built to preserve is that `while True: pass` cannot
 * freeze the tab. A CPython interpreter compiled to WebAssembly runs
 * synchronously on whatever thread starts it, and there is no cooperative way
 * to interrupt it without a `SharedArrayBuffer` interrupt buffer (which needs
 * COOP/COEP headers this deployment does not set). So the only stop button is
 * `worker.terminate()` from the main thread, and that only exists if the
 * interpreter was never on the main thread to begin with.
 *
 * ## What this file is allowed to know
 *
 * The learner's source and the learner's stdin. Nothing else — no hidden test
 * cases, no reference solutions, no keys. That is not a convention, it is the
 * whole message protocol: `WorkerInbound` has three payload fields and none of
 * them can carry a secret. See `schools/execution/trust.ts` for why a result
 * from here can never be evidence.
 *
 * ## Why it exports pure functions as well as running as a worker
 *
 * The interesting logic — how a Python failure becomes a status, how the output
 * cap is accounted for, how a stdin string becomes lines that raise `EOFError`
 * at the right moment — is decidable without WebAssembly, and vitest has no
 * WASM Pyodide and no real `Worker`. So it lives in exported functions here and
 * is tested directly, and the message handler installs itself only when this
 * module genuinely is a worker global scope.
 */

import type { LocalExecutionStatus } from "@schools/execution/trust";
import type { PyodideAPI } from "pyodide";

/* -------------------------------------------------------------------------- */
/* The message protocol                                                       */
/* -------------------------------------------------------------------------- */

/** Where the runtime's own files are served from. Same origin — see `boot`. */
export const DEFAULT_PYODIDE_BASE_URL = "/pyodide/";

export type WorkerInbound =
  /** Start downloading and initialising. Sent once, before any run. */
  | { kind: "boot"; baseUrl: string }
  /**
   * Run this. `id` exists so a late message from a worker that is about to be
   * terminated cannot be mistaken for the answer to the learner's next press.
   */
  | { kind: "run"; id: number; source: string; stdin: string; maxOutputBytes: number };

/** The statuses this worker can decide on its own, without the main thread. */
export type WorkerDecidedStatus = Extract<
  LocalExecutionStatus,
  "ok" | "syntax_error" | "runtime_error" | "runtime_unavailable"
>;

export type WorkerOutbound =
  | { kind: "ready"; pyodideVersion: string; pythonVersion: string }
  /** Pyodide did not start. NEVER a statement about the learner's program. */
  | { kind: "boot_failed"; message: string }
  /**
   * Output so far, throttled. Exists so the two statuses the main thread
   * decides — timeout and output cap — can still show the learner what their
   * program printed before it was killed. Without it, `while True: print(i)`
   * would come back with an empty box, which is the least useful possible
   * answer to "why is my loop wrong".
   */
  | { kind: "progress"; id: number; stdout: string; stderr: string }
  /**
   * The program printed past the cap. The worker has already STOPPED
   * accumulating (so memory is bounded whatever happens next) but it cannot
   * stop Python; the main thread terminates on receipt of this.
   */
  | { kind: "output_limit"; id: number; stdout: string; stderr: string; runtimeMs: number }
  | {
      kind: "done";
      id: number;
      status: WorkerDecidedStatus;
      stdout: string;
      stderr: string;
      truncated: boolean;
      runtimeMs: number;
    };

/* -------------------------------------------------------------------------- */
/* Output accounting                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A stream with a hard byte ceiling.
 *
 * ## Why bytes, and why a streaming decoder
 *
 * Pyodide hands us raw UTF-8 out of the Emscripten filesystem, so the byte
 * count `LOCAL_LIMITS.maxOutputBytes` names is available exactly rather than
 * approximated by `String.length`. A Kazakh word is two bytes a character; a
 * cap counted in characters is a different cap depending on the language the
 * learner prints in, which is not a property anyone would choose on purpose.
 *
 * The decoder is stateful (`{ stream: true }`) because a multi-byte character
 * can straddle two writes from Python's buffer. Decoding each chunk
 * independently would put a replacement character in the middle of a Kazakh
 * word roughly whenever the output crossed 4 KiB.
 *
 * ## Why it keeps writing rather than throwing
 *
 * Throwing out of the write callback would surface inside Python as an
 * exception a learner's own `try/except` could swallow — and then the program
 * that was printing forever carries on printing forever, silently. So the sink
 * goes quiet instead: bytes past the cap are counted and dropped, memory stays
 * bounded at the cap, and the decision to kill the run is escalated to the main
 * thread, which is the only place that can actually carry it out.
 */
export class CappedStream {
  private readonly decoder = new TextDecoder("utf-8");
  private parts: string[] = [];
  private bytes = 0;
  /** True once anything was dropped. Becomes `LocalRunResult.truncated`. */
  overflowed = false;

  constructor(private readonly maxBytes: number) {}

  /** Returns the number of bytes ACCEPTED FROM PYTHON — always `chunk.length`. */
  write(chunk: Uint8Array): number {
    if (this.overflowed) return chunk.length;

    const room = this.maxBytes - this.bytes;
    if (chunk.length <= room) {
      this.parts.push(this.decoder.decode(chunk, { stream: true }));
      this.bytes += chunk.length;
      return chunk.length;
    }

    /* The budget is bytes, so the cut can land inside a character. The decoder
       keeps those orphan bytes and never emits them, which loses one character
       at the boundary rather than showing the learner a U+FFFD they cannot
       explain. */
    if (room > 0) {
      this.parts.push(this.decoder.decode(chunk.subarray(0, room), { stream: true }));
    }
    this.bytes = this.maxBytes;
    this.overflowed = true;
    return chunk.length;
  }

  /**
   * Everything kept so far.
   *
   * Deliberately does NOT flush the decoder: this is called on every progress
   * tick as well as at the end, and a final `decode()` resets the decoder's
   * state — so flushing mid-run would corrupt the next multi-byte character
   * that happened to straddle a write. Python only ever emits complete UTF-8,
   * so there is nothing legitimate left to flush at the end either.
   */
  text(): string {
    return this.parts.join("");
  }

  byteLength(): number {
    return this.bytes;
  }
}

/* -------------------------------------------------------------------------- */
/* stdin                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The learner's input box, as the lines `input()` will hand back.
 *
 * ## The one rule that is easy to get wrong
 *
 * A trailing newline TERMINATES the last line; it does not introduce an empty
 * one. `printf '3 7\n' | python` gives `input()` exactly one line and then
 * raises `EOFError` — it does not give a second, blank line. But `'3\n\n'` has
 * a genuinely empty second line and CPython returns `""` for it before the
 * EOFError. So exactly one trailing empty element is dropped, not all of them.
 *
 * Getting this wrong is not cosmetic: the learner's `a, b = map(int, input().split())`
 * would fail with an unhelpful `ValueError` on a blank line instead of running,
 * on the single most common shape of input in the whole curriculum.
 */
export function stdinLines(stdin: string): string[] {
  if (stdin === "") return [];
  const lines = stdin.replace(/\r\n/g, "\n").split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * A cursor over those lines, in the shape Pyodide's `setStdin` wants.
 *
 * `undefined` means EOF, which is how `input()` comes to raise `EOFError`
 * exactly as CPython does when the learner reads more than they typed. Pyodide
 * appends the newline itself (`autoEOF`), so the lines must NOT carry one.
 */
export function stdinReader(stdin: string): () => string | undefined {
  const lines = stdinLines(stdin);
  let cursor = 0;
  return () => (cursor < lines.length ? lines[cursor++] : undefined);
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A Python failure that escaped the harness, mapped to a local status.
 *
 * ## Why `syntax_error` is checked first and by name
 *
 * The server had exactly one bug here and it is regression-tested there: a
 * `SyntaxError` reported as `runtime_error` tells a fourteen-year-old to go and
 * look at their logic when what they actually have is a missing bracket. Those
 * are different sentences and different afternoons.
 *
 * `IndentationError` and `TabError` are subclasses of `SyntaxError` in CPython
 * and belong on the same side of the line — a mis-indented block also never
 * ran. The names are matched rather than inferred because the exception TYPE
 * from Pyodide is a real fact about the interpreter, unlike a regex over
 * prose.
 *
 * ## Why this is only the escape hatch
 *
 * On the ordinary path the harness in `RUN_HARNESS` decides structurally — a
 * `SyntaxError` is what `compile()` raised, full stop, and a program that
 * catches one at runtime and prints it is not miscounted. This function exists
 * for the errors that get past the harness entirely (`MemoryError`, a
 * `RecursionError` deep enough to unwind through it), where a name is all there
 * is to go on.
 */
export function classifyPythonError(
  errorType: string | undefined,
  stderr: string,
): Extract<LocalExecutionStatus, "syntax_error" | "runtime_error"> {
  const syntactic = /^(SyntaxError|IndentationError|TabError)$/;
  if (errorType && syntactic.test(errorType)) return "syntax_error";
  /* No exception type available — Pyodide only attaches one to a PythonError.
     Falling back to the traceback's last line is the same imprecision the
     server accepts in `looksLikeCompileError`, and both are documented as
     such rather than one of them being quietly cleverer. */
  if (!errorType && /^(SyntaxError|IndentationError|TabError)\b/m.test(stderr)) {
    return "syntax_error";
  }
  return "runtime_error";
}

/** Guards the string the Python harness returns before it becomes a status. */
export function isWorkerDecidedStatus(value: unknown): value is WorkerDecidedStatus {
  return (
    value === "ok" ||
    value === "syntax_error" ||
    value === "runtime_error" ||
    value === "runtime_unavailable"
  );
}

/* -------------------------------------------------------------------------- */
/* The Python harness                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Installed once per worker; called once per Run.
 *
 * ## Why the learner's code is written to a file first
 *
 * `linecache` can only show the offending source line if the file it names
 * exists. Writing `main.py` into the in-memory filesystem buys the learner the
 * traceback they would get from any real Python —
 *
 *     Traceback (most recent call last):
 *       File "main.py", line 3, in <module>
 *         print(total / count)
 *     ZeroDivisionError: division by zero
 *
 * — with the line itself, instead of `File "<exec>"` and nothing to look at.
 * That is the single largest difference in the error message a beginner reads,
 * and it costs one write and a `checkcache` per run.
 *
 * ## Why `compile` is separate from `exec`
 *
 * It is what makes `syntax_error` STRUCTURAL. CPython refuses a syntactically
 * broken file before running a line of it, so the distinction is not "does the
 * word SyntaxError appear in stderr" — it is "did compilation succeed". A
 * learner whose program catches a SyntaxError and prints it has written a
 * working program, and this harness says so.
 *
 * ## Why a fresh namespace each run
 *
 * The worker is reused warm across an entire lesson — reloading CPython per
 * press would throw away the only thing that makes local execution feel
 * instant. But a variable from the previous Run still being defined would let a
 * broken program appear to work, so `exec` gets a new dict every time.
 *
 * Known and accepted limit of warm reuse: `sys.modules` is NOT reset, so a
 * previous run's `import` (or its monkeypatching of an imported module) is
 * still in effect. For a curriculum of `input`, `int`, `//` and `%` that is
 * invisible; it would matter to someone deliberately probing it, and someone
 * deliberately probing their own browser is not a threat this file defends
 * against — see `trust.ts`.
 */
const RUN_HARNESS = `
import sys, linecache, traceback

_SOLVEX_FILE = "main.py"

def _solvex_flush():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.flush()
        except Exception:
            pass

def _solvex_run(src):
    with open(_SOLVEX_FILE, "w") as handle:
        handle.write(src)
    linecache.checkcache(_SOLVEX_FILE)

    try:
        code = compile(src, _SOLVEX_FILE, "exec")
    except SyntaxError as exc:
        # No "Traceback (most recent call last):" header and no frames, which is
        # exactly what CPython prints for a syntax error in a script.
        sys.stderr.write("".join(traceback.format_exception_only(exc)))
        _solvex_flush()
        return "syntax_error"

    namespace = {"__name__": "__main__", "__file__": _SOLVEX_FILE}
    try:
        exec(code, namespace)
    except SystemExit as exc:
        status = exc.code
        if isinstance(status, str):
            sys.stderr.write(status + "\\n")
            _solvex_flush()
            return "runtime_error"
        _solvex_flush()
        return "ok" if status is None or status == 0 else "runtime_error"
    except BaseException as exc:
        # Drop this harness's own frame so the traceback starts at the learner's
        # first line. They did not write \`exec(code, namespace)\` and should not
        # have to read it.
        frames = exc.__traceback__
        traceback.print_exception(exc.with_traceback(frames.tb_next if frames else None))
        _solvex_flush()
        return "runtime_error"

    _solvex_flush()
    return "ok"
`;

/* -------------------------------------------------------------------------- */
/* Boot                                                                       */
/* -------------------------------------------------------------------------- */

type PyodideModule = typeof import("pyodide");

/**
 * Load CPython.
 *
 * ## Why the runtime is fetched from our own origin and not a CDN
 *
 * `scripts/sync-pyodide-assets.mjs` copies the five files Pyodide needs out of
 * `node_modules/pyodide` into `public/pyodide/` before every build, so the
 * version served is the version in `package.json` by construction rather than
 * by somebody remembering to bump a URL. Three consequences, all of them the
 * point:
 *
 * 1. A school whose connection drops mid-lesson keeps working — the browser has
 *    the runtime cached and there is no third-party host to be unreachable.
 * 2. The Content-Security-Policy this needs is `script-src 'self'
 *    'wasm-unsafe-eval'` and `connect-src 'self'`. No `cdn.jsdelivr.net`
 *    anywhere. (`'wasm-unsafe-eval'` is unavoidable — it is what compiling a
 *    WebAssembly module means.)
 * 3. Kazakh students' source never leaves the laptop, which is the residency
 *    claim in `docs/CODE_EXECUTION_DECISION.md` and stops being true the moment
 *    any part of this reaches somebody else's server.
 *
 * `packageBaseUrl` is set for the same reason: left unset, Pyodide's internal
 * `cdnUrl` defaults to jsDelivr, and a stray package load would silently punch
 * through the policy above.
 *
 * The import is hidden from the bundler on purpose. Pyodide resolves
 * `pyodide.asm.mjs`, `pyodide.asm.wasm` and `python_stdlib.zip` at runtime
 * relative to `indexURL`; bundled into a chunk, those resolutions point at a
 * hashed chunk directory that contains none of them.
 */
async function boot(baseUrl: string): Promise<PyodideAPI> {
  const entry = `${baseUrl}pyodide.mjs`;
  /* Named `entryModule`, not `module`: Next forbids assigning to `module`
     because in a CommonJS chunk it shadows the real one and breaks the module
     wrapper. Nothing here is CommonJS, but the rule cannot tell, and a lint
     suppression to keep a five-letter name is a worse trade than the name. */
  const entryModule = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ entry
  )) as PyodideModule;

  const pyodide = await entryModule.loadPyodide({
    indexURL: baseUrl,
    packageBaseUrl: baseUrl,
    args: [],
    env: { HOME: "/home/pyodide" },
    // Startup chatter belongs in the console, never in a learner's output box.
    stdout: () => {},
    stderr: () => {},
  });

  pyodide.runPython(RUN_HARNESS);
  return pyodide;
}

/* -------------------------------------------------------------------------- */
/* The worker itself                                                          */
/* -------------------------------------------------------------------------- */

/** Progress is posted at most this often. Cheap enough to ignore, often */
/** enough that a timeout at 3 s still shows the learner ~20 snapshots. */
const PROGRESS_INTERVAL_MS = 150;

interface WorkerScope {
  postMessage(message: WorkerOutbound): void;
  onmessage: ((event: MessageEvent<WorkerInbound>) => void) | null;
}

/**
 * Wire the message protocol to a Pyodide instance.
 *
 * Exported and parameterised rather than inlined so the protocol is exercisable
 * without a browser: hand it a scope object and a boot function and every
 * transition — ready, boot failure, run, cap overflow — is reachable in node.
 */
export function installWorker(
  scope: WorkerScope,
  load: (baseUrl: string) => Promise<PyodideAPI> = boot,
): void {
  let runtime: Promise<PyodideAPI> | null = null;

  const start = (baseUrl: string): Promise<PyodideAPI> => {
    runtime ??= load(baseUrl).then(
      (pyodide) => {
        scope.postMessage({
          kind: "ready",
          pyodideVersion: pyodide.version,
          pythonVersion: readPythonVersion(pyodide),
        });
        return pyodide;
      },
      (error: unknown) => {
        /* `runtime_unavailable`, not a learner error. A school's Wi-Fi dropping
           during a 13 MB download is our problem; recording it against a child
           is the failure `isLearnerOutcome` exists to prevent. */
        scope.postMessage({ kind: "boot_failed", message: describe(error) });
        throw error;
      },
    );
    return runtime;
  };

  const execute = async (request: Extract<WorkerInbound, { kind: "run" }>): Promise<void> => {
    const started = performance.now();
    let pyodide: PyodideAPI;
    try {
      pyodide = await start(DEFAULT_PYODIDE_BASE_URL);
    } catch {
      // `start` already posted `boot_failed`; the run has nothing to add.
      return;
    }

    const stdout = new CappedStream(request.maxOutputBytes);
    const stderr = new CappedStream(request.maxOutputBytes);
    let capReported = false;
    let lastProgress = 0;

    /* Escalate ONCE, the instant the ceiling is crossed. The worker cannot stop
       Python; the main thread can, and it is already listening. Everything
       printed after this is dropped by CappedStream, so the wait costs bytes
       that were never going to be shown, not memory. */
    const escalate = () => {
      if (capReported || (!stdout.overflowed && !stderr.overflowed)) return;
      capReported = true;
      scope.postMessage({
        kind: "output_limit",
        id: request.id,
        stdout: stdout.text(),
        stderr: stderr.text(),
        runtimeMs: Math.round(performance.now() - started),
      });
    };

    const tick = () => {
      escalate();
      if (capReported) return;
      const now = performance.now();
      if (now - lastProgress < PROGRESS_INTERVAL_MS) return;
      lastProgress = now;
      scope.postMessage({
        kind: "progress",
        id: request.id,
        stdout: stdout.text(),
        stderr: stderr.text(),
      });
    };

    /* The `Writer` form of setStdout/setStderr rather than `batched`: it hands
       over the exact bytes Python wrote, newlines included. `batched` strips the
       trailing newline and cannot distinguish `print("a")` from
       `print("a", end="")`, which would make local output differ from the
       server's on the same program — the one divergence `trust.ts` explicitly
       refuses. */
    pyodide.setStdout({
      write: (buffer: Uint8Array) => {
        const written = stdout.write(buffer);
        tick();
        return written;
      },
    });
    pyodide.setStderr({
      write: (buffer: Uint8Array) => {
        const written = stderr.write(buffer);
        tick();
        return written;
      },
    });
    pyodide.setStdin({ stdin: stdinReader(request.stdin), autoEOF: true });

    let status: WorkerDecidedStatus;
    try {
      /* The source travels as a Python global rather than interpolated into a
         literal, so there is no escaping to get wrong and no way for a docstring
         full of quotes to become executable harness code. */
      pyodide.globals.set("_solvex_src", request.source);
      const decided: unknown = pyodide.runPython("_solvex_run(_solvex_src)");
      status = isWorkerDecidedStatus(decided) ? decided : "runtime_error";
    } catch (error: unknown) {
      /* The harness itself was unwound — MemoryError, a RecursionError deep
         enough to take it out, or a broken interpreter. The first two are the
         learner's program; a broken interpreter is not, and the main thread
         replaces the worker either way because we can no longer vouch for it. */
      const type = errorTypeOf(error);
      stderr.write(new TextEncoder().encode(describe(error)));
      status = classifyPythonError(type, describe(error));
    } finally {
      pyodide.globals.delete("_solvex_src");
    }

    escalate();
    if (capReported) return;

    scope.postMessage({
      kind: "done",
      id: request.id,
      status,
      stdout: stdout.text(),
      stderr: stderr.text(),
      truncated: stdout.overflowed || stderr.overflowed,
      runtimeMs: Math.round(performance.now() - started),
    });
  };

  scope.onmessage = (event: MessageEvent<WorkerInbound>) => {
    const message = event.data;
    if (message.kind === "boot") {
      void start(message.baseUrl).catch(() => {
        // Already reported as `boot_failed`; nothing here can improve on it.
      });
      return;
    }
    void execute(message);
  };
}

/** The interpreter's own answer, not a number written down somewhere. */
function readPythonVersion(pyodide: PyodideAPI): string {
  try {
    const version: unknown = pyodide.runPython(
      "__import__('platform').python_version()",
    );
    return typeof version === "string" ? version : "unknown";
  } catch {
    return "unknown";
  }
}

/** Pyodide attaches the Python exception class name to `PythonError.type`. */
function errorTypeOf(error: unknown): string | undefined {
  const type = (error as { type?: unknown } | null)?.type;
  return typeof type === "string" ? type : undefined;
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

/* -------------------------------------------------------------------------- */
/* Self-installation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Only when this module actually is a worker.
 *
 * `WorkerGlobalScope` is defined in a worker and nowhere else, which is what
 * lets vitest import this file for the pure functions above without a message
 * handler latching onto a global that is not a worker's. It is read off
 * `globalThis` rather than referenced directly because the project's `lib` is
 * `dom`, not `webworker` — the name would not type-check bare.
 */
const workerGlobal = globalThis as unknown as {
  WorkerGlobalScope?: unknown;
};

if (typeof workerGlobal.WorkerGlobalScope !== "undefined") {
  installWorker(globalThis as unknown as WorkerScope);
}
