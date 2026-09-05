import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { bitsStdcppSource } from "../../src/lib/cpp17/bits-stdcpp";

/**
 * Compile and run C++17 reference solutions, for the suites that check the
 * curriculum's claims are true.
 *
 * This is the C++ replacement for the `python3 -I -S -c` call that
 * `content-execution.test.ts` used, and it exists for the same reason that file
 * does: September once shipped a hidden case whose expected output disagreed
 * with its own reference solution, and nothing in the repository ever ran one.
 *
 * ## Compile once, run many
 *
 * A compile is ~1 s and there are 156 cases across 32 references in September
 * alone. Compiling per case would turn a two-minute suite into a twenty-minute
 * one, and the thing being tested — does this program produce this output for
 * this input — does not change between cases. So each reference is built once
 * into a temporary binary and every case is piped through it.
 *
 * ## `bits/stdc++.h`
 *
 * Generated from `src/lib/cpp17/bits-stdcpp.ts`, the same single definition the
 * browser sysroot gets. The developer machine's compiler is usually Apple clang
 * with libc++, which — exactly like the browser and unlike Judge0's GCC — does
 * not ship the header. Without the shim a reference that compiles for a learner
 * on both of the engines that matter would fail here, on the one that does not.
 */

export const CPP_STANDARD_FLAG = "-std=c++17";

/** Bounded for the same reason the browser and the judge are bounded. */
export const HARNESS_LIMITS = {
  timeoutMs: 10_000,
  maxOutputBytes: 64 * 1024,
} as const;

export interface CompiledReference {
  /** Absolute path to the built binary. */
  binary: string;
  /** Compiler diagnostics, if any survived a successful build (warnings). */
  compileOutput: string;
}

export interface CaseRun {
  status: "ok" | "runtime_error" | "timeout" | "output_limit";
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

let cachedCompiler: string | null | undefined;

/**
 * The compiler this machine has, or `null`.
 *
 * Never guessed from the platform: it is asked for its version, because
 * `g++` on macOS is Apple clang and a suite that assumed GNU semantics from the
 * name would be wrong about integer division on the first task that has any.
 */
export function cppCompiler(): string | null {
  if (cachedCompiler !== undefined) return cachedCompiler;
  for (const candidate of [process.env.EXEC_CPP_BIN, "g++", "clang++", "c++"]) {
    if (!candidate) continue;
    try {
      execFileSync(candidate, ["--version"], { encoding: "utf8", stdio: "pipe" });
      cachedCompiler = candidate;
      return candidate;
    } catch {
      /* try the next one */
    }
  }
  cachedCompiler = null;
  return null;
}

export function cppCompilerVersion(): string {
  const bin = cppCompiler();
  if (!bin) return "none";
  return execFileSync(bin, ["--version"], { encoding: "utf8", stdio: "pipe" })
    .split("\n")[0]
    .trim();
}

/** A working directory holding the `bits/stdc++.h` shim, made once per process. */
let shimDir: string | null = null;
function ensureShim(): string {
  if (shimDir) return shimDir;
  const dir = mkdtempSync(path.join(tmpdir(), "solvex-cpp-shim-"));
  mkdirSync(path.join(dir, "bits"), { recursive: true });
  writeFileSync(path.join(dir, "bits", "stdc++.h"), bitsStdcppSource());
  shimDir = dir;
  return dir;
}

export class CompileError extends Error {
  constructor(readonly diagnostics: string) {
    super(diagnostics.split("\n").slice(0, 3).join("\n"));
    this.name = "CompileError";
  }
}

/**
 * Build one reference solution.
 *
 * Throws `CompileError` with the compiler's own words. A reference that does
 * not compile is a defect in the curriculum, not a skipped test, so this is
 * loud by construction.
 */
export function compileReference(source: string, label = "ref"): CompiledReference {
  const bin = cppCompiler();
  if (!bin) throw new Error("no C++ compiler available");

  const dir = mkdtempSync(path.join(tmpdir(), "solvex-cpp-"));
  const src = path.join(dir, `${label.replace(/[^a-z0-9]/gi, "_")}.cpp`);
  const out = path.join(dir, "prog");
  writeFileSync(src, source);

  const res = spawnSync(
    bin,
    [CPP_STANDARD_FLAG, "-O2", `-I${ensureShim()}`, "-o", out, src],
    { encoding: "utf8", timeout: 60_000 },
  );

  if (res.status !== 0) {
    const diagnostics = `${res.stderr ?? ""}${res.stdout ?? ""}`.trim();
    rmSync(dir, { recursive: true, force: true });
    throw new CompileError(diagnostics || "compiler failed with no output");
  }
  return { binary: out, compileOutput: (res.stderr ?? "").trim() };
}

/** Run a built reference against one case's stdin. */
export function runCase(binary: string, stdin: string, timeoutMs?: number): CaseRun {
  const res = spawnSync(binary, [], {
    input: stdin,
    encoding: "utf8",
    /*
     * `timeoutMs` overrides the harness ceiling, and there is one caller.
     *
     * `content-execution` verifies that two blocks' declared breaking inputs
     * make the program loop forever. Ten seconds proves nothing that one and a
     * half does, and five of them inside one test is what made that file time
     * out under a saturated machine and report a curriculum failure that was
     * nothing of the kind.
     *
     * It is an override rather than a lowered default because everywhere else
     * the ceiling is the QUESTION — "is this reference solution fast enough" —
     * and shortening it there would fail a correct program on a busy laptop.
     */
    timeout: timeoutMs ?? HARNESS_LIMITS.timeoutMs,
    maxBuffer: HARNESS_LIMITS.maxOutputBytes,
  });

  if (res.error && (res.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
    return { status: "timeout", stdout: "", stderr: "", exitCode: null };
  }
  if (res.error && /maxBuffer/i.test(res.error.message)) {
    return { status: "output_limit", stdout: "", stderr: "", exitCode: null };
  }
  return {
    status: res.status === 0 ? "ok" : "runtime_error",
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
    exitCode: res.status,
  };
}

/** Remove a compiled reference's directory. */
export function cleanup(ref: CompiledReference): void {
  rmSync(path.dirname(ref.binary), { recursive: true, force: true });
}
