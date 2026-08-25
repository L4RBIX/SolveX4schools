import "server-only";
import { config } from "@schools/config";
import { EXECUTION_LIMITS, type CodeExecutionProvider, type ExecutionRequest, type ExecutionResult } from "./provider";
import { LocalExecutionProvider } from "./providers/local";

export async function getExecutionProvider(): Promise<CodeExecutionProvider> {
  if (config.exec.provider === "piston") {
    const { pistonFromConfig } = await import("./providers/piston");
    return pistonFromConfig();
  }
  return new LocalExecutionProvider();
}

/** One test case, run and compared. Output is compared after trimming trailing whitespace. */
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
 */
export async function runCases(
  provider: CodeExecutionProvider,
  sourceCode: string,
  cases: readonly { input: string; expectedOutput: string; hidden?: boolean }[],
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

    const actual = r.stdout.replace(/\s+$/, "");
    results.push({
      passed: r.status === "ok" && actual === c.expectedOutput.replace(/\s+$/, ""),
      hidden: c.hidden === true,
      input: c.input,
      expected: c.expectedOutput,
      actual,
      status: r.status,
    });
  }

  return { results, infrastructureFailed: false };
}

export { EXECUTION_LIMITS, isInfrastructure } from "./provider";
export type { CodeExecutionProvider, ExecutionRequest, ExecutionResult, ExecutionStatus } from "./provider";
