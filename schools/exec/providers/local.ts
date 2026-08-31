import "server-only";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { config } from "@schools/config";
import { CPP_RUNTIME, CPP_STANDARD_FLAG } from "@schools/execution/cpp-runtime";
import { bitsStdcppSource } from "@/lib/cpp17/bits-stdcpp";
import {
  EXECUTION_LIMITS,
  type CodeExecutionProvider,
  type ExecutionRequest,
  type ExecutionResult,
} from "../provider";

/**
 * Local subprocess execution. DEVELOPMENT ONLY.
 *
 * ## Read this before considering it for production
 *
 * This is NOT a sandbox. It compiles the learner's C++ and then runs the
 * resulting NATIVE BINARY as a child of the application process, with the
 * application's filesystem access, the application's network access and the
 * application's credentials in its environment. A student who works out that
 * `<cstdlib>` has `system()` owns the server, and unlike the interpreter this
 * replaces there is not even a bytecode layer in the way.
 *
 * It exists so the pipeline — grading, evidence, verdict semantics, the
 * learner-TLE distinction — can be built and tested without provisioning a
 * judge first. It refuses to run in production, and that refusal is the only
 * thing standing between this file and a genuinely dangerous deployment.
 *
 * The mitigations below narrow the blast radius. They do not make it safe:
 * a timeout and a scrubbed environment stop an accident, not an attempt.
 *
 * ## Two stages, and only one of them is the learner's
 *
 * Compiling is OUR overhead and gets its own ceiling; running is the learner's
 * program and gets `request.timeLimitMs`. Folding them together would spend a
 * second of a learner's five-second budget on the toolchain and record a
 * correct-but-unoptimised program as too slow — the same unit-conversion class
 * of bug the Judge0 provider's own comments warn about, arriving through a
 * clock instead of a number.
 *
 * A compile that fails is `compile_error`, decided STRUCTURALLY from the
 * compiler's exit code. Nothing here reads diagnostic prose, and the shared
 * `looksLikeCompileError` heuristic the Python-era providers needed is gone —
 * see `../provider.ts` for why a compiled language does not want it back.
 */
export class LocalExecutionProvider implements CodeExecutionProvider {
  readonly id = "local";
  /** A subprocess on our own machine. Free, and refuses to run in production anyway. */
  readonly metered = false;
  readonly describe =
    "Local g++ compile-and-run — NOT a sandbox, development only, refuses to run in production";

  async run(request: ExecutionRequest): Promise<ExecutionResult> {
    if (config.environment === "production") {
      throw new Error(
        "LocalExecutionProvider must never run in production: it compiles learner " +
          "code and executes the resulting native binary as a child of the app " +
          "process, with the app's filesystem, network and environment. Configure " +
          "EXEC_PROVIDER=judge0_rapidapi or EXEC_PROVIDER=piston with a real judge.",
      );
    }

    const started = Date.now();
    const workspace = mkdtempSync(path.join(tmpdir(), "solvex-exec-"));

    try {
      const built = this.compile(workspace, request.sourceCode);
      if (!built.ok) {
        return {
          status: built.status,
          stdout: "",
          /* The compiler's own words. A learner reading `expected ';' before
             '}'` is being told something true and actionable; a message we
             paraphrased would be neither. */
          stderr: built.stderr,
          exitCode: built.exitCode,
          timeMs: Date.now() - started,
          memoryKb: null,
          /* A compile error is the LEARNER'S. A missing compiler is OURS. The
             two arrive on the same failed spawn and must not be conflated:
             `compile_error` is evidence and `provider_error` says nothing about
             anybody. */
          infrastructureError: built.status === "provider_error",
          providerId: this.id,
        };
      }

      return await this.execute(built.binary, request, started);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Stage one: build                                                        */
  /* ---------------------------------------------------------------------- */

  /**
   * Compile one program, with the same standard and the same `bits/stdc++.h`
   * both real engines see.
   *
   * The shim is generated from `src/lib/cpp17/bits-stdcpp.ts`, the single
   * definition the browser sysroot also gets, and it is here for a reason a
   * developer will otherwise hit in their first hour: `g++` on macOS is Apple
   * clang with libc++, which — exactly like the browser and unlike Judge0's GCC
   * — does not ship the header. Without it, a program that compiles on both of
   * the engines that matter fails on the one that does not.
   *
   * Synchronous, deliberately. It is bounded by `COMPILE_CEILING_MS`, it runs
   * only in development, and an async build would need its own cancellation
   * path for no benefit a developer would ever notice.
   */
  private compile(
    workspace: string,
    sourceCode: string,
  ):
    | { ok: true; binary: string }
    | { ok: false; status: "compile_error" | "provider_error"; stderr: string; exitCode: number | null } {
    const source = path.join(workspace, CPP_RUNTIME.sourceFileName);
    const binary = path.join(workspace, "program");
    writeFileSync(source, sourceCode, "utf8");

    const include = path.join(workspace, "include");
    mkdirSync(path.join(include, "bits"), { recursive: true });
    writeFileSync(path.join(include, "bits", "stdc++.h"), bitsStdcppSource(), "utf8");

    const built = spawnSync(
      config.exec.cppBin,
      [CPP_STANDARD_FLAG, "-O2", `-I${include}`, "-o", binary, source],
      { encoding: "utf8", timeout: COMPILE_CEILING_MS },
    );

    if (built.error) {
      const missing = (built.error as NodeJS.ErrnoException).code === "ENOENT";
      return {
        ok: false,
        /* The compiler not being installed says nothing about the learner, and
           neither does us giving up on a build that would not finish. */
        status: "provider_error",
        stderr: missing
          ? `${config.exec.cppBin} is not available`
          : `${config.exec.cppBin} did not finish within ${COMPILE_CEILING_MS} ms`,
        exitCode: null,
      };
    }

    if (built.status !== 0) {
      const diagnostics = `${built.stderr ?? ""}${built.stdout ?? ""}`.trim();
      return {
        ok: false,
        status: "compile_error",
        stderr: capText(diagnostics || "the compiler failed and said nothing"),
        exitCode: built.status,
      };
    }

    return { ok: true, binary };
  }

  /* ---------------------------------------------------------------------- */
  /* Stage two: run                                                          */
  /* ---------------------------------------------------------------------- */

  private execute(
    binary: string,
    request: ExecutionRequest,
    started: number,
  ): Promise<ExecutionResult> {
    return new Promise<ExecutionResult>((resolve) => {
      const child = spawn(binary, [], {
        /* Scrubbed. Whatever else happens, the learner's program does not read
           DEEPSEEK_API_KEY or LEARNING_ATTESTATION_SECRET out of the
           environment. The cast is because ProcessEnv insists on NODE_ENV;
           handing it to a student's process is exactly what this is avoiding. */
        env: {
          PATH: process.env.PATH ?? "/usr/bin:/bin",
          HOME: "/tmp",
        } as unknown as NodeJS.ProcessEnv,
        cwd: "/tmp",
      });

      let stdout = "";
      let stderr = "";
      let truncated = false;
      let settled = false;

      const finish = (r: ExecutionResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(r);
      };

      /* The learner's program was too slow. This is EVIDENCE about their
         algorithm, not infrastructure noise — see the type's own note. The
         compile is NOT inside this budget; see the class comment. */
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        finish({
          status: "time_limit_exceeded",
          stdout, stderr,
          exitCode: null,
          timeMs: Date.now() - started,
          memoryKb: null,
          infrastructureError: false,
          providerId: this.id,
        });
      }, request.timeLimitMs);

      const cap = (buf: string, chunk: string) => {
        if (buf.length >= EXECUTION_LIMITS.maxOutputBytes) {
          truncated = true;
          return buf;
        }
        return (buf + chunk).slice(0, EXECUTION_LIMITS.maxOutputBytes);
      };

      child.stdout.on("data", (d: Buffer) => { stdout = cap(stdout, d.toString("utf8")); });
      child.stderr.on("data", (d: Buffer) => { stderr = cap(stderr, d.toString("utf8")); });

      child.on("error", () => {
        finish({
          status: "provider_error",
          stdout: "",
          /* The binary was built a moment ago, so failing to start it is our
             machine misbehaving rather than anything the learner wrote. */
          stderr: "the compiled program could not be started",
          exitCode: null,
          timeMs: Date.now() - started,
          memoryKb: null,
          infrastructureError: true,
          providerId: this.id,
        });
      });

      child.on("close", (code) => {
        if (truncated) stderr += "\n[output truncated]";
        finish({
          /* It compiled — stage one returned before this — so a non-zero exit
             or a fatal signal is the program crashing. There is nothing to
             infer from the text of stderr, and nothing here tries to. */
          status: code === 0 ? "ok" : "runtime_error",
          stdout, stderr,
          exitCode: code,
          timeMs: Date.now() - started,
          memoryKb: null,
          infrastructureError: false,
          providerId: this.id,
        });
      });

      child.stdin.on("error", () => { /* closed early; the close handler settles */ });
      child.stdin.end(request.stdin);
    });
  }
}

/**
 * How long a build may take before we stop waiting on it.
 *
 * Generous by an order of magnitude: a September program is a few hundred
 * milliseconds and `#include <bits/stdc++.h>` is a second or two even on a
 * warm machine. It exists so a pathological template expansion pastes into the
 * dev lab and fails, instead of holding a development server open forever.
 * Exceeding it is a `provider_error`, not a verdict: we stopped, the learner
 * did not do anything.
 */
const COMPILE_CEILING_MS = 20_000;

/** The same ceiling the run stage applies, for diagnostics that run long. */
function capText(text: string): string {
  if (text.length <= EXECUTION_LIMITS.maxOutputBytes) return text;
  return `${text.slice(0, EXECUTION_LIMITS.maxOutputBytes)}\n[output truncated]`;
}
