import type { LocalRunResult } from "@schools/execution/trust";
import { LocalExecutionProvider } from "@schools/exec/providers/local";
import { EXECUTION_LIMITS, type ExecutionResult } from "@schools/exec/provider";
import { cppCompiler, cppCompilerVersion } from "../support/cpp-run";

/**
 * The engines this harness can actually drive, and the one it cannot.
 *
 * ## What changed, and why the file lost half of itself
 *
 * Under Python this module drove BOTH engines. `runLocal` ran the shipped
 * Pyodide worker under node — the `pyodide` npm package loads in about a second
 * and `installWorker(scope, load)` exists precisely so the boot step can be
 * replaced — so the parity suite really did put one program through two
 * interpreters and compare.
 *
 * That is not available for C++, and the reason is not effort. The browser
 * engine is `clang.wasm` + `lld.wasm` + `memfs.wasm` + a WASI sysroot: **57.5 MB**
 * fetched over HTTP from `/cpp17/`, compiled with `WebAssembly.compileStreaming`
 * (which refuses anything not served as `application/wasm`), and driven through
 * `wasi_unstable` — an ABI that predates the `preview1` rename and that node's
 * built-in WASI cannot drive at all. `src/lib/cpp17/worker.ts` reaches those
 * assets with a bare `fetch(baseUrl + f)`, and node's `fetch` has no `file:`
 * support, so there is not even a URL to point it at without standing up a
 * static server inside the test runner.
 *
 * So the honest position is written down rather than worked around: **this
 * harness drives the SERVER engine only.** What the parity suite still checks
 * is real — September's own programs, compiled and run, producing the outputs
 * the curriculum declares, with the status vocabulary the judge will use — and
 * what it no longer checks is the browser half, which is stated in the fixtures
 * and again in the suite's closing section.
 *
 * `docs/cpp17/CPP17_JUDGE_PARITY.md` already records the two-engine suite as
 * still-to-do, and the manual pass it describes is currently the only evidence
 * the engines agree. Nothing here should be read as more than it is.
 *
 * ## Four things a green run still does not prove
 *
 * 1. **The compiler here is not the judge's.** This is whatever `EXEC_CPP_BIN`,
 *    `g++`, `clang++` or `c++` resolves to — on macOS, Apple clang with libc++.
 *    Judge0 is GCC 14 with libstdc++. Diagnostics are therefore not comparable
 *    and are not compared; statuses and stdout are.
 * 2. **`LocalExecutionProvider` is not Piston and is not Judge0.** It is the dev
 *    provider. Its status mapping is a usable stand-in for STATUS category
 *    parity — the thing this file compares — and for nothing else.
 * 3. **The browser is not executed at all.** See above. Every `local` column in
 *    the fixture table is a DECLARED correspondence, checked against
 *    `CATEGORY_PAIRS` for consistency and never against a running compiler.
 * 4. **It is one machine's toolchain.** A libstdc++/libc++ divergence in a
 *    library feature would show up as a fixture failing here, which is useful,
 *    but its ABSENCE proves nothing about the other engine.
 */

/* -------------------------------------------------------------------------- */
/* Server — the same subprocess judge the rest of the exec tests use          */
/* -------------------------------------------------------------------------- */

/** Mirrors `tests/support/cpp-run.ts` — no compiler, no run. */
export function hasServerCompiler(): boolean {
  return cppCompiler() !== null;
}

/** The compiler's own first line, for the report a failure needs. */
export function serverCompilerVersion(): string {
  return cppCompilerVersion();
}

const provider = new LocalExecutionProvider();

/**
 * Run the same program the way SUBMIT does.
 *
 * The stdin normalisation is `runCases`', copied deliberately: the server half
 * of the product appends a newline to a case input that lacks one, and a parity
 * test that skipped that would be comparing against something the judge never
 * does. It is the one transformation on this path, and the `empty-input-box`
 * fixture is about what it costs.
 */
export function runServer(
  source: string,
  stdin: string,
  /* Annotated `number` rather than inferred: `EXECUTION_LIMITS` is `as const`,
     so an inferred default would type this parameter as the literal 5000 and
     the runaway-loop fixture's shorter budget would not compile. */
  timeLimitMs: number = EXECUTION_LIMITS.timeLimitMs,
): Promise<ExecutionResult> {
  return provider.run({
    language: "cpp17",
    sourceCode: source,
    stdin: stdin.endsWith("\n") ? stdin : `${stdin}\n`,
    timeLimitMs,
    memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
  });
}

/**
 * The type the browser half WOULD return, re-exported so the fixture table can
 * keep speaking in it.
 *
 * Kept deliberately: the `local` column of every fixture is a
 * `LocalExecutionStatus`, and the whole value of the table is that the two
 * vocabularies stay related even while only one of them is executed here.
 */
export type { LocalRunResult };
