import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { PyodideAPI } from "pyodide";
import { installWorker } from "@/lib/pyodide/worker";
import { PythonRunner, type RunnerWorker } from "@/lib/pyodide/runner";
import type { LocalRunResult } from "@schools/execution/trust";
import { LocalExecutionProvider } from "@schools/exec/providers/local";
import { EXECUTION_LIMITS, type ExecutionResult } from "@schools/exec/provider";

/**
 * The two engines, both of them real, both driven through their production code.
 *
 * ## What this module makes possible, and what it does not
 *
 * `tests/exec/pyodide-runner.test.ts` says plainly that node has "no WebAssembly
 * Pyodide", and for the browser entry point that is true: `worker.ts`'s `boot`
 * fetches `/pyodide/pyodide.mjs` over HTTP and there is no server in a test run.
 *
 * But the *interpreter* runs here perfectly well. The `pyodide` npm package is
 * already a dependency of this repo, it loads under node in about a second, and
 * it is the same 314.0.6 build that `scripts/sync-pyodide-assets.mjs` copies
 * into `public/pyodide/`. And `installWorker(scope, load)` exists precisely so
 * the boot step can be replaced — its own comment says so. So the local engine
 * below is the shipped worker protocol, the shipped `CappedStream`, the shipped
 * stdin reader, the shipped status decision and the shipped `PythonRunner`,
 * running real CPython. Only the fetch is substituted.
 *
 * Four things it still cannot prove, stated here so nothing downstream reads
 * more into a green bar than it should:
 *
 * 1. **It is node's WebAssembly, not a browser's.** Same Pyodide build, same
 *    CPython, different host. A browser-specific divergence would not show up.
 * 2. **There is no real `Worker`.** The bridge below delivers messages
 *    synchronously on one thread. `terminate()` sets a flag rather than killing
 *    anything, so the time limit — which is enforced *by* termination — cannot
 *    be executed here. Attempting `while True: pass` would hang the suite
 *    forever, not fail it.
 * 3. **The server side is whatever `python3` is on this machine**, and the
 *    production judge is Piston running the pin in
 *    `schools/execution/python-policy.ts` (3.12.0). The two are frequently not
 *    the same interpreter, so error *messages* are not comparable and are not
 *    compared. Statuses and stdout are.
 * 4. **`LocalExecutionProvider` is not Piston, and it is the outlier of the
 *    three.** It is the dev subprocess provider. Its status mapping is the one
 *    `looksLikeCompileError` shares with Piston, which makes it a usable
 *    stand-in for STATUS category parity — the thing this file compares.
 *
 *    It is not a stand-in for anything else, and the hedge that used to live
 *    here ran only one way ("a Piston-specific divergence would not show up").
 *    The other direction is real and worth naming: the dev provider
 *    MANUFACTURES divergences the product does not have. It delivers the
 *    learner's source as `python3 -I -S -c <source>`
 *    (`schools/exec/providers/local.ts:47`), whereas Piston sends
 *    `files: [{ name: "main.py" }]` (`providers/piston.ts:59`) and the browser
 *    harness writes `main.py` and execs a compiled code object with `__file__`
 *    set. So browser and Piston AGREE, and this stand-in is the one that
 *    differs — visibly, in every traceback (`File "<string>"` here versus
 *    `File "main.py"` in both real engines) and in status category for any
 *    program that touches `__file__` or reads its own source.
 *
 *    Nothing in September does that, which is why the fixtures still hold. But
 *    a divergence reported by this harness must be checked against Piston
 *    before it is believed, and a fixture must never be written to match the
 *    dev provider's shape.
 */

/* -------------------------------------------------------------------------- */
/* The Python harness, taken from the shipped worker rather than copied        */
/* -------------------------------------------------------------------------- */

/**
 * `RUN_HARNESS` is a module-private const in `worker.ts`, and it is the thing
 * that decides `syntax_error` structurally, strips the harness frame out of a
 * traceback and writes `main.py` so `linecache` can show the failing line.
 *
 * It is read out of the source instead of being re-typed here, because a copy
 * would turn every assertion in the parity suite into a claim about the copy.
 * The extraction is deliberately brittle: if someone renames the const, this
 * throws at import with a message saying what to do, which is the correct
 * amount of friction for "the test no longer runs the code it says it runs".
 */
function extractRunHarness(): string {
  const source = readFileSync("src/lib/pyodide/worker.ts", "utf8");
  const match = source.match(/const RUN_HARNESS = `([\s\S]*?)`;\n/);
  if (!match) {
    throw new Error(
      "RUN_HARNESS could not be found in src/lib/pyodide/worker.ts. The parity " +
        "suite runs the shipped harness rather than a copy of it — re-point this " +
        "extraction at whatever it was renamed to.",
    );
  }
  /* Undo the ONE level of escaping a template literal applies: `\\n` in the
     source is a two-character `\n` the Python source wants, and `` \` `` is a
     backtick inside a Python comment. Everything else is passed through
     unchanged, which is why this is a replace rather than an eval. */
  return match[1].replace(/\\(.)/g, (_, char: string) =>
    char === "\\" ? "\\" : char === "`" ? "`" : `\\${char}`,
  );
}

/* -------------------------------------------------------------------------- */
/* Local — Pyodide, through the shipped worker protocol                       */
/* -------------------------------------------------------------------------- */

/**
 * One interpreter for the whole suite.
 *
 * Warm reuse is what the product does too — the worker is kept alive across a
 * lesson — and reloading CPython per fixture would add a second to each one. The
 * harness gives every run a fresh namespace, so nothing leaks between fixtures
 * except `sys.modules`, which is the same known limit the worker documents.
 */
let interpreter: Promise<PyodideAPI> | null = null;

function loadInterpreter(): Promise<PyodideAPI> {
  interpreter ??= (async () => {
    const { loadPyodide } = await import("pyodide");
    const pyodide = await loadPyodide({
      // Startup chatter belongs nowhere near a fixture's stdout.
      stdout: () => {},
      stderr: () => {},
    });
    pyodide.runPython(extractRunHarness());
    return pyodide as unknown as PyodideAPI;
  })();
  return interpreter;
}

/**
 * A `RunnerWorker` that is the worker, on one thread.
 *
 * `installWorker` writes to a `WorkerScope`; `PythonRunner` talks to a
 * `RunnerWorker`. The bridge crosses the two message ports over to each other
 * and honours `terminate()` by refusing to deliver anything further — which is
 * what makes the replace-the-worker path after an output-cap overflow behave the
 * way it does in a browser, right down to a late `done` from the dead worker
 * being dropped instead of answering the next press.
 */
function bridgedWorker(): RunnerWorker {
  let alive = true;

  const worker: RunnerWorker = {
    postMessage: () => {},
    terminate: () => {
      alive = false;
    },
    onmessage: null,
    onerror: null,
  };

  const scope: Parameters<typeof installWorker>[0] = {
    postMessage: (message) => {
      if (alive) worker.onmessage?.({ data: message } as MessageEvent);
    },
    onmessage: null,
  };

  installWorker(scope, loadInterpreter);
  worker.postMessage = (message) => {
    if (alive) scope.onmessage?.({ data: message } as MessageEvent);
  };
  return worker;
}

const runner = new PythonRunner({ createWorker: bridgedWorker });

/** Run the learner's program the way the Run button does. */
export function runLocal(source: string, stdin: string): Promise<LocalRunResult> {
  return runner.run({ source, stdin });
}

/** The interpreter's own answer, once something has booted it. */
export function localPythonVersion(): string | null {
  return runner.status().pythonVersion;
}

export function localPyodideVersion(): string | null {
  return runner.status().pyodideVersion;
}

/* -------------------------------------------------------------------------- */
/* Server — the same subprocess judge the rest of the exec tests use          */
/* -------------------------------------------------------------------------- */

const PYTHON = process.env.EXEC_PYTHON_BIN ?? "python3";

/** Mirrors `tests/school/content-execution.test.ts` — no interpreter, no run. */
export function hasServerPython(): boolean {
  try {
    execFileSync(PYTHON, ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function serverPythonVersion(): string | null {
  try {
    return execFileSync(PYTHON, ["-c", "import sys; print(sys.version.split()[0])"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

const provider = new LocalExecutionProvider();

/**
 * Run the same program the way SUBMIT does.
 *
 * The stdin normalisation is `runCases`', copied deliberately: the server half
 * of the product appends a newline to a case input that lacks one, and a parity
 * test that skipped that would be comparing the browser against something the
 * judge never does. It is the one transformation on this path, and the
 * `eof-empty-input-box` fixture is about what it costs.
 */
export function runServer(
  source: string,
  stdin: string,
  /* Annotated `number` rather than inferred: `EXECUTION_LIMITS` is `as const`,
     so an inferred default would type this parameter as the literal 5000 and
     the runaway-loop fixture's 1 200 would not compile. */
  timeLimitMs: number = EXECUTION_LIMITS.timeLimitMs,
): Promise<ExecutionResult> {
  return provider.run({
    language: "python3",
    sourceCode: source,
    stdin: stdin.endsWith("\n") ? stdin : `${stdin}\n`,
    timeLimitMs,
    memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
  });
}
