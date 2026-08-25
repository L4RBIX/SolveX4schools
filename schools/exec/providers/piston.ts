import "server-only";
import { config } from "@schools/config";
import {
  type CodeExecutionProvider,
  type ExecutionRequest,
  type ExecutionResult,
} from "../provider";

/**
 * Piston — the production judge.
 *
 * Runs each submission in a disposable container with its own cgroup limits,
 * no network, and a scrubbed filesystem. Self-hosted on a Kazakh VPS, which is
 * how the programme's data-residency commitment (PDF p.4) is met for the one
 * part of the system that necessarily receives a student's own writing.
 *
 * ## The timeout distinction, in the one place it is easy to get wrong
 *
 * Piston reports a killed-on-time-limit run as a signal (`SIGKILL`) on the
 * `run` stage. That is the LEARNER'S program being too slow — evidence. Our own
 * `fetch` giving up is the JUDGE not answering — not evidence. They are
 * different fields below and must stay different.
 */
export class PistonExecutionProvider implements CodeExecutionProvider {
  readonly id = "piston";
  readonly describe: string;

  constructor(private baseUrl: string) {
    this.describe = `Piston at ${baseUrl}`;
  }

  async run(request: ExecutionRequest): Promise<ExecutionResult> {
    const started = Date.now();

    // Our own ceiling sits above the judge's, so the judge gets the chance to
    // report a learner timeout before we give up on the judge.
    const controller = new AbortController();
    const ourCeiling = setTimeout(() => controller.abort(), request.timeLimitMs + 5_000);
    request.signal?.addEventListener("abort", () => controller.abort());

    try {
      const res = await fetch(`${this.baseUrl}/api/v2/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          language: "python",
          version: "3.*",
          files: [{ name: "main.py", content: request.sourceCode }],
          stdin: request.stdin,
          run_timeout: request.timeLimitMs,
          run_memory_limit: request.memoryLimitMb * 1024 * 1024,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return infra(this.id, started, `judge returned ${res.status}`, "provider_error");
      }

      const body = (await res.json()) as {
        compile?: { stdout?: string; stderr?: string; code?: number };
        run?: { stdout?: string; stderr?: string; code?: number | null; signal?: string | null };
      };

      if (body.compile && (body.compile.code ?? 0) !== 0) {
        return {
          status: "compile_error",
          stdout: body.compile.stdout ?? "",
          stderr: body.compile.stderr ?? "",
          exitCode: body.compile.code ?? null,
          timeMs: Date.now() - started,
          memoryKb: null,
          infrastructureError: false,
          providerId: this.id,
        };
      }

      const run = body.run ?? {};
      // SIGKILL from the judge means IT killed the LEARNER'S program on the
      // limit. Evidence about the algorithm, not about the judge.
      const killed = run.signal === "SIGKILL";

      return {
        status: killed ? "time_limit_exceeded" : (run.code ?? 0) === 0 ? "ok" : "runtime_error",
        stdout: run.stdout ?? "",
        stderr: run.stderr ?? "",
        exitCode: run.code ?? null,
        timeMs: Date.now() - started,
        memoryKb: null,
        infrastructureError: false,
        providerId: this.id,
      };
    } catch (err) {
      // OUR fetch gave up. The judge said nothing, so we know nothing about the
      // learner's program — not that it was slow.
      const aborted = err instanceof Error && err.name === "AbortError";
      return infra(
        this.id,
        started,
        aborted ? "the judge did not answer in time" : "could not reach the judge",
        aborted ? "provider_timeout" : "provider_error",
      );
    } finally {
      clearTimeout(ourCeiling);
    }
  }
}

function infra(
  providerId: string,
  started: number,
  message: string,
  status: "provider_timeout" | "provider_error",
): ExecutionResult {
  return {
    status,
    stdout: "",
    stderr: message,
    exitCode: null,
    timeMs: Date.now() - started,
    memoryKb: null,
    infrastructureError: true,
    providerId,
  };
}

export function pistonFromConfig(): PistonExecutionProvider {
  if (!config.exec.pistonUrl) {
    throw new Error("EXEC_PROVIDER=piston but PISTON_URL is not set.");
  }
  return new PistonExecutionProvider(config.exec.pistonUrl);
}
