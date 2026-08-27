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
export async function getExecutionProvider(): Promise<CodeExecutionProvider> {
  if (config.exec.provider === "piston") {
    const { pistonFromConfig } = await import("./providers/piston");
    return sizeGuarded(counted(pistonFromConfig()));
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
  return {
    id: provider.id,
    describe: provider.describe,
    async run(request: ExecutionRequest): Promise<ExecutionResult> {
      bump("exec.requests");
      try {
        const result = await provider.run(request);
        if (result.infrastructureError) {
          bump("exec.infra_failures");
          opsLog("exec.infra_failure", { provider: result.providerId, status: result.status });
        } else if (result.status !== "ok") {
          bump("exec.learner_errors");
        }
        return result;
      } catch (err) {
        bump("exec.infra_failures");
        opsLog("exec.provider_threw", {
          provider: provider.id,
          // The message only, truncated. A driver or fetch error can carry a URL.
          message: (err instanceof Error ? err.message : String(err)).slice(0, 200),
        });
        throw err;
      }
    },
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
 */
export async function runCases(
  provider: CodeExecutionProvider,
  sourceCode: string,
  cases: readonly { input: string; expectedOutput: string; hidden?: boolean }[],
  checker: OutputChecker = DEFAULT_CHECKER,
): Promise<{ results: CaseResult[]; infrastructureFailed: boolean }> {
  const results: CaseResult[] = [];

  for (const c of cases) {
    const r = await provider.run({
      language: "python3",
      sourceCode,
      stdin: c.input.endsWith("\n") ? c.input : `${c.input}\n`,
      timeLimitMs: EXECUTION_LIMITS.timeLimitMs,
      memoryLimitMb: EXECUTION_LIMITS.memoryLimitMb,
    });

    if (r.infrastructureError) {
      return { results, infrastructureFailed: true };
    }

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
