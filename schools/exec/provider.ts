import "server-only";

/**
 * The code execution port.
 *
 * Everything above it — lesson blocks, Arena, the evidence pipeline, the
 * teacher projection — speaks this and nothing else. Swapping a self-hosted
 * judge for a managed one is a provider file and an environment variable.
 */

export interface ExecutionRequest {
  /** Only `python3` for year one. The curriculum teaches Python. */
  language: "python3";
  sourceCode: string;
  stdin: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  signal?: AbortSignal;
}

/**
 * What happened.
 *
 * ## The distinction this type exists to protect
 *
 * `time_limit_exceeded` means THE LEARNER'S PROGRAM was too slow. That is
 * evidence — December's entire month is about making a program fast enough.
 *
 * `provider_timeout` means the judge did not answer. That is infrastructure
 * noise and says nothing whatsoever about the learner.
 *
 * Collapsing them is not a cosmetic error. Recording infrastructure flakiness
 * as a learner's algorithmic failure teaches the model something false about a
 * child, and the child never finds out why the system thinks they are slow.
 * The two values are separate here, separate in `schools/learning/verdict.ts`,
 * and the word "timeout" alone is refused by `assertSandboxStatus`.
 */
export type ExecutionStatus =
  | "ok"
  | "compile_error"
  | "runtime_error"
  /** The learner's program exceeded its limit. Evidence. */
  | "time_limit_exceeded"
  /** The learner's program exceeded its memory. Evidence. */
  | "memory_limit_exceeded"
  /** The judge did not answer. NOT evidence. */
  | "provider_timeout"
  /** The judge is unreachable or broken. NOT evidence. */
  | "provider_error";

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  memoryKb: number | null;
  /** True for the two statuses that say nothing about the learner. */
  infrastructureError: boolean;
  /** Which provider produced this. Recorded so a bad judge is attributable. */
  providerId: string;
}

export function isInfrastructure(status: ExecutionStatus): boolean {
  return status === "provider_timeout" || status === "provider_error";
}

export interface CodeExecutionProvider {
  readonly id: string;
  /** Human-readable, for the health route and the dev lab. */
  readonly describe: string;
  run(request: ExecutionRequest): Promise<ExecutionResult>;
}

export const EXECUTION_LIMITS = {
  /** Generous for a beginner's program, tight enough to catch a runaway loop. */
  timeLimitMs: 5_000,
  memoryLimitMb: 256,
  /** Beyond this the output is not a result, it is a print statement in a loop. */
  maxOutputBytes: 64 * 1024,
  maxSourceBytes: 64 * 1024,
} as const;
