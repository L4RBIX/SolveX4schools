import "server-only";
import { spawn } from "node:child_process";
import { config } from "@schools/config";
import {
  EXECUTION_LIMITS,
  looksLikeCompileError,
  type CodeExecutionProvider,
  type ExecutionRequest,
  type ExecutionResult,
} from "../provider";

/**
 * Local subprocess execution. DEVELOPMENT ONLY.
 *
 * ## Read this before considering it for production
 *
 * This is NOT a sandbox. It runs the learner's Python as a child of the
 * application process, with the application's filesystem access, the
 * application's network access and the application's credentials in its
 * environment. A student who works out that `import os` exists owns the server.
 *
 * It exists so the pipeline — grading, evidence, verdict semantics, the
 * learner-TLE distinction — can be built and tested without provisioning a
 * judge first. It refuses to run in production, and that refusal is the only
 * thing standing between this file and a genuinely dangerous deployment.
 *
 * The mitigations below narrow the blast radius. They do not make it safe:
 * a timeout and a scrubbed environment stop an accident, not an attempt.
 */
export class LocalExecutionProvider implements CodeExecutionProvider {
  readonly id = "local";
  readonly describe =
    "Local python3 subprocess — NOT a sandbox, development only, refuses to run in production";

  async run(request: ExecutionRequest): Promise<ExecutionResult> {
    if (config.environment === "production") {
      throw new Error(
        "LocalExecutionProvider must never run in production: it executes learner " +
          "code as a child of the app process, with the app's filesystem, network " +
          "and environment. Configure EXEC_PROVIDER=piston with a real judge.",
      );
    }

    const started = Date.now();

    return new Promise<ExecutionResult>((resolve) => {
      const child = spawn(config.exec.pythonBin, ["-I", "-S", "-c", request.sourceCode], {
        /* Scrubbed. Whatever else happens, the learner's program does not read
           DEEPSEEK_API_KEY or LEARNING_ATTESTATION_SECRET out of process.env.
           The cast is because ProcessEnv insists on NODE_ENV; handing it to a
           student's process is exactly what this is avoiding. */
        env: {
          PATH: process.env.PATH ?? "/usr/bin:/bin",
          HOME: "/tmp",
          PYTHONIOENCODING: "utf-8",
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
         algorithm, not infrastructure noise — see the type's own note. */
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
          stderr: `${config.exec.pythonBin} is not available`,
          exitCode: null,
          timeMs: Date.now() - started,
          memoryKb: null,
          // The interpreter being missing says nothing about the learner.
          infrastructureError: true,
          providerId: this.id,
        });
      });

      child.on("close", (code) => {
        if (truncated) stderr += "\n[output truncated]";
        /* Python reports a syntax error as exit 1 with SyntaxError on stderr.
           Distinguished because "your program did not compile" and "your
           program crashed while running" are different things to a learner. */
        const isSyntax = looksLikeCompileError(stderr);
        finish({
          status: code === 0 ? "ok" : isSyntax ? "compile_error" : "runtime_error",
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
