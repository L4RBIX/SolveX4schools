import "server-only";
import { config } from "@schools/config";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";
import {
  EXECUTION_LIMITS,
  looksLikeCompileError,
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
          /* Both read from `schools/execution/python-policy.ts` rather than
             written here. The literals were previously in this file, in the
             conformance test, in the runbook and in whatever the operator typed
             into `POST /api/v2/packages` — four copies of one decision, and the
             only one that could not be forgotten was the one nobody could see.
             `wireVersion` is a RANGE and stays one deliberately: it resolves
             against the single pinned package the judge has, so a patch-level
             rebuild is not an outage. See that file for the full argument. */
          language: PYTHON_RUNTIME.pistonLanguage,
          version: PYTHON_RUNTIME.wireVersion,
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
        const out = cap(body.compile.stdout ?? "", body.compile.stderr ?? "");
        return {
          status: "compile_error",
          stdout: out.stdout,
          stderr: out.stderr,
          exitCode: body.compile.code ?? null,
          timeMs: Date.now() - started,
          memoryKb: null,
          infrastructureError: false,
          providerId: this.id,
        };
      }

      /* A 200 with no `run` stage is not a Piston job result — it is a proxy,
         a version skew, or an error page wearing a JSON content-type. Reading
         it as `{}` made it indistinguishable from a program that printed
         nothing and exited 0, so a judge answering with a body we do not
         understand marked every one of a learner's test cases wrong. That is
         the exact conflation this file exists to prevent, arriving through the
         happy path instead of the catch. */
      if (!body.run || typeof body.run !== "object") {
        return infra(this.id, started, "the judge answered without a run stage", "provider_error");
      }

      const run = body.run;
      // SIGKILL from the judge means IT killed the LEARNER'S program on the
      // limit. Evidence about the algorithm, not about the judge.
      const killed = run.signal === "SIGKILL";
      const out = cap(run.stdout ?? "", run.stderr ?? "");
      const failed = (run.code ?? 0) !== 0;

      return {
        /* The python3 runtime has NO compile stage, so Piston never populates
           `body.compile` for it: a syntax error arrives here, as exit 1 with
           SyntaxError on stderr, and reading it as `runtime_error` told a
           learner their program crashed when it never started. The local
           provider always drew this distinction; Piston has to draw the same
           one from the same evidence or the two judges disagree about the same
           missing bracket. */
        status: killed
          ? "time_limit_exceeded"
          : !failed
            ? "ok"
            : looksLikeCompileError(out.stderr)
              ? "compile_error"
              : "runtime_error",
        stdout: out.stdout,
        stderr: out.stderr,
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

/**
 * The output ceiling, applied to what the judge hands back.
 *
 * `EXECUTION_LIMITS.maxOutputBytes` is the number the rest of the system is
 * written against and the local provider has always enforced it while
 * streaming. Piston hands over a finished body instead, so nothing was
 * enforcing it here: a `while True: print(x)` came back whole, went into
 * memory once per test case per learner, and `/api/exec/run` returned it
 * verbatim to a browser. Piston's own `output_max_size` is a server-side
 * setting on a host we may not control, which makes this the only ceiling we
 * can actually rely on.
 *
 * Truncating cannot turn a pass into a fail — no declared expected output is
 * within three orders of magnitude of 64 KB — and the marker is worded exactly
 * as the local provider's so a learner sees one explanation, not two.
 */
function cap(stdout: string, stderr: string): { stdout: string; stderr: string } {
  const limit = EXECUTION_LIMITS.maxOutputBytes;
  if (stdout.length <= limit && stderr.length <= limit) return { stdout, stderr };
  return {
    stdout: stdout.slice(0, limit),
    stderr: `${stderr.slice(0, limit)}\n[output truncated]`,
  };
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
