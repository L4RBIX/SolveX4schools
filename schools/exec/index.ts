import "server-only";
import { config } from "@schools/config";
import { bump, opsLog } from "@schools/ops/counters";
import { checkOutput, DEFAULT_CHECKER, type OutputChecker } from "./checker";
import { EXECUTION_LIMITS, type CodeExecutionProvider, type ExecutionRequest, type ExecutionResult } from "./provider";
import { sizeGuarded } from "./limits";
import { LocalExecutionProvider } from "./providers/local";

/**
 * `sizeGuarded` wraps `counted`, not the other way round.
 *
 * Outermost, so an oversized request is refused before the counting decorator
 * sees it: a refusal is neither an execution nor an outage, and counting it as
 * either turns a learner pasting a large file into a pager. It also means a
 * crafted request cannot reach a provider by way of some future call site that
 * forgot the route-level check — see `schools/exec/limits.ts`.
 */
export async function getExecutionProvider(): Promise<CodeExecutionProvider | null> {
  /*
   * `null` means "this deployment has no trusted judge", and it is a real
   * answer rather than an error.
   *
   * It returns null instead of throwing, and instead of handing back a
   * stub provider that fails every run, because those two alternatives both
   * produce the same bad outcome at the call site: a learner is told their
   * submission failed. It did not fail — it was never graded, and nobody ever
   * intended to grade it. The distinction is invisible if the absence is
   * expressed as an exception or a fake `provider_error`.
   *
   * Making it nullable is a deliberate compile-time cost. Every caller now has
   * to write the "no judge" branch, which is precisely the branch that gets
   * forgotten when the absence is signalled at runtime.
   */
  if (config.exec.provider === "none") return null;

  if (config.exec.provider === "piston") {
    const { pistonFromConfig } = await import("./providers/piston");
    return sizeGuarded(counted(pistonFromConfig()));
  }

  /* Dynamically imported, exactly like Piston, so a deployment that does not
     use it never loads it — and, more to the point, so nothing that merely
     imports this barrel pulls a module holding a RapidAPI key into whatever
     graph it is being bundled into. */
  if (config.exec.provider === "judge0_rapidapi") {
    const { judge0FromConfig } = await import("./providers/judge0");
    return sizeGuarded(counted(judge0FromConfig()));
  }

  return sizeGuarded(counted(new LocalExecutionProvider()));
}

/**
 * The one place execution is counted.
 *
 * A decorator here rather than a `bump()` in each provider, and rather than one
 * in each route. Both alternatives are places to forget: a third provider would
 * arrive uncounted, and RUN and SUBMIT would drift apart the first time someone
 * added a call site. Everything that executes learner code goes through
 * `getExecutionProvider`, so wrapping its return value is the only edit that
 * cannot be bypassed by adding a caller.
 *
 * ## What is counted, and what deliberately is not
 *
 * `exec.infra_failures` counts ONLY `infrastructureError` — the judge not
 * answering. A learner's program crashing or timing out is `exec.learner_errors`
 * and is not an outage; conflating them is the exact mistake
 * `ExecutionStatus` exists to prevent, and it would turn "December's whole
 * month is about making programs fast" into a pager alert.
 *
 * A thrown provider counts as infrastructure, because it is: the local provider
 * throws by design in production, and that failure previously reached nobody.
 *
 * The log line carries the status and the provider id. It carries no subject,
 * no source code and no stdout — see `opsLog`.
 */
function counted(provider: CodeExecutionProvider): CodeExecutionProvider {
  /* Bound once, so the spread below tests the same thing it forwards. */
  const batch = provider.runBatch?.bind(provider);

  const count = (result: ExecutionResult): ExecutionResult => {
    if (result.infrastructureError) {
      bump("exec.infra_failures");
      opsLog("exec.infra_failure", { provider: result.providerId, status: result.status });
    } else if (result.status !== "ok") {
      bump("exec.learner_errors");
    }
    return result;
  };

  const threw = (err: unknown): never => {
    bump("exec.infra_failures");
    opsLog("exec.provider_threw", {
      provider: provider.id,
      // The message only, truncated. A driver or fetch error can carry a URL.
      message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
    });
    throw err;
  };

  return {
    id: provider.id,
    describe: provider.describe,
    /* Forwarded, never re-decided. A decorator that dropped this would make a
       metered judge look free to the Run route. */
    metered: provider.metered,
    async run(request: ExecutionRequest): Promise<ExecutionResult> {
      bump("exec.requests");
      try {
        return count(await provider.run(request));
      } catch (err) {
        return threw(err);
      }
    },

    /* Forwarded only when the wrapped provider actually has it, so the presence
       of `runBatch` on the decorated object still answers the question
       `runCases` asks: can THIS judge do better than a loop? A decorator that
       always defined it would make every provider look batch-capable and route
       Piston through a path it does not implement.
       Each execution in the batch is counted exactly as one from the loop would
       be — the counters answer "how many programs did we run", and a provider
       choosing to run them in one HTTP call does not change that number. */
    ...(batch
      ? {
          async runBatch(requests: readonly ExecutionRequest[]): Promise<ExecutionResult[]> {
            bump("exec.requests", requests.length);
            try {
              const results = await batch(requests);
              results.forEach(count);
              return results;
            } catch (err) {
              return threw(err);
            }
          },
        }
      : {}),
  };
}

/**
 * One test case, run and compared.
 *
 * `actual` is raw stdout, untouched. It used to arrive here already stripped of
 * trailing whitespace, which was harmless while the comparison stripped the
 * same thing and is a trap now that `exact` exists: a learner failing on a
 * trailing space would be shown an output identical to the expected one.
 * Whatever is judged is what is stored.
 */
export interface CaseResult {
  passed: boolean;
  hidden: boolean;
  input: string;
  expected: string;
  actual: string;
  status: ExecutionResult["status"];
}

/**
 * SUBMIT: run every case, stop on infrastructure failure.
 *
 * Stopping matters. If the judge dies on case 2 of 5, the honest answer is "we
 * could not measure this", not "you passed 1 of 5" — and the difference decides
 * whether a learner is told they failed something nobody ran.
 *
 * ## The comparison
 *
 * `checker` is the block's own declaration (`WriteCodeBlock.checker` and its
 * three siblings), and the default is the same `token` default the curriculum
 * types document — resolved in one place so the judge and the content CI cannot
 * disagree about what an undeclared block means. Nothing is normalised here:
 * every rule lives in `./checker.ts`, where an author can read the one that
 * applies to their task.
 *
 * A malformed checker throws out of `checkOutput` rather than failing the case.
 * That is deliberate — see `CheckerAuthoringError`. It propagates to the submit
 * route, which settles the attempt as unmeasured instead of marking a learner
 * wrong for our authoring bug.
 *
 * ## Judge0's `expected_output` is not used, and never will be
 *
 * A judge that can compare stdout for us would make this loop shorter and would
 * be wrong: `token`, `exact` and author-declared `numeric` tolerances are
 * curriculum decisions that live in `./checker.ts`, and no provider knows them.
 * It would also mean sending every hidden case's answer to whoever runs the
 * judge. The provider executes; this function decides.
 *
 * ## The batch path
 *
 * A provider may implement `runBatch` when it can do better than one round trip
 * per case — see the port. What must NOT change when it does is the paragraph
 * above about stopping: an outage on case 2 is still "we could not measure
 * this", never "you passed 1 of 5".
 */
export async function runCases(
  provider: CodeExecutionProvider,
  sourceCode: string,
  cases: readonly { input: string; expectedOutput: string; hidden?: boolean }[],
  checker: OutputChecker = DEFAULT_CHECKER,
  options: {
    /**
     * Whose Check this is, for the provider's fair queueing. See
     * `ExecutionRequest.fairnessKey`: it never leaves this process, never
     * reaches a judge and never touches a verdict — it only stops one learner
     * holding every in-flight slot while the class is told the judge is
     * unavailable.
     */
    fairnessKey?: string;
  } = {},
): Promise<{ results: CaseResult[]; infrastructureFailed: boolean }> {
  const requests: ExecutionRequest[] = cases.map((c) => ({
    language: "cpp17",
    sourceCode,
    fairnessKey: options.fairnessKey,
    /* Every case's input ends in a newline, because a line-oriented read wants
       a terminated line: `getline` on an unterminated final line still yields
       it at EOF, but a program that reads with `getline` in a loop and a case
       declared without a newline differ from the same case declared with one,
       and the curriculum's inputs are written as lines. It costs one byte and
       removes a class of case-authoring surprise. */
    stdin: c.input.endsWith("\n") ? c.input : `${c.input}\n`,
    timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
    memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
  }));

  const executed = provider.runBatch
    ? await provider.runBatch(requests)
    : await sequential(provider, requests);

  /* One reading of the results, whichever path produced them, so the two cannot
     drift into disagreeing about what an outage looks like. The batch path has
     already spent its requests by the time we get here — the difference between
     the paths is money, not semantics. */
  const results: CaseResult[] = [];
  for (let i = 0; i < cases.length; i += 1) {
    const r = executed[i];
    /* A provider that answered with a different number of results than it was
       asked for cannot have its answers matched to the cases that asked, and
       guessing an alignment would attribute one case's output to another's
       expected value. Unmeasured, like any other broken judge. */
    if (r === undefined) return { results, infrastructureFailed: true };
    if (r.infrastructureError) return { results, infrastructureFailed: true };

    const c = cases[i];
    results.push({
      passed: r.status === "ok" && checkOutput(r.stdout, c.expectedOutput, checker),
      hidden: c.hidden === true,
      input: c.input,
      expected: c.expectedOutput,
      actual: r.stdout,
      status: r.status,
    });
  }

  return { results, infrastructureFailed: false };
}

/**
 * The default path: one case at a time, stopping at the first outage.
 *
 * Stops ASKING as well as stops reporting, which is the part a batch cannot do.
 * For a judge that answers in one round trip — the local subprocess, Piston —
 * this is strictly better: nothing is spent on cases that will not be read.
 *
 * The results it returns are positional, so a short array means "we stopped
 * here", and `runCases` reads the gap exactly as it reads an infrastructure
 * result: nothing after this point was measured.
 */
async function sequential(
  provider: CodeExecutionProvider,
  requests: readonly ExecutionRequest[],
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  for (const request of requests) {
    const r = await provider.run(request);
    results.push(r);
    if (r.infrastructureError) break;
  }
  return results;
}

export { EXECUTION_LIMITS, isInfrastructure, isLearnerEvidence, isPayloadRejection } from "./provider";
export {
  MAX_REQUEST_BYTES,
  byteLength,
  checkPayloadSize,
  requestTooLarge,
  sizeGuarded,
  type PayloadRejection,
  type PayloadRejectionReason,
} from "./limits";
export type { CodeExecutionProvider, ExecutionRequest, ExecutionResult, ExecutionStatus } from "./provider";
/* Re-exported from the judge's barrel so nothing has to reach past it to grade
   the same way the judge grades. */
export { checkOutput, checkerProblem, CheckerAuthoringError, DEFAULT_CHECKER } from "./checker";
export type { OutputChecker } from "./checker";
