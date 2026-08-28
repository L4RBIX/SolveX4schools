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
  | "provider_error"
  /**
   * The request was refused on size and never ran. NOT evidence.
   *
   * A third kind, and it needed its own name rather than being folded into
   * `provider_error`. A learner who pasted a megabyte of code has not written a
   * wrong program, and the judge is not broken either — WE refused, on a rule of
   * ours, before anything executed. Calling it `provider_error` would put a
   * learner's oversized paste on the same pager as a dead sandbox; calling it
   * `runtime_error` would record it as their program crashing.
   *
   * `isInfrastructure` deliberately returns FALSE for it — nothing is down —
   * while `ExecutionResult.infrastructureError` is TRUE, because that field
   * answers a different question: may this be recorded as something the learner
   * did? It may not. That is the one place in this file where the two disagree,
   * and it is the reason the field's own comment says "says nothing about the
   * learner" rather than "the judge failed".
   */
  | "payload_too_large";

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  memoryKb: number | null;
  /**
   * May this result be recorded as something the learner did?
   *
   * `false` means yes — it is evidence, including the two failures that are
   * genuinely theirs (`time_limit_exceeded`, `memory_limit_exceeded`). `true`
   * means no, and there are three ways to get there: the judge did not answer,
   * the judge is broken, or we refused the request before it ran.
   *
   * Every consumer uses it as exactly that question. `runCases` stops the run
   * and reports nothing measured; `/api/exec/run` says "we could not run this"
   * instead of implying the program failed; the health probe treats it as its
   * own failure. The name predates the third case and is left alone rather than
   * churned through every provider — the comment is the contract.
   */
  infrastructureError: boolean;
  /** Which provider produced this. Recorded so a bad judge is attributable. */
  providerId: string;
}

/**
 * Did this stderr come from a program that never ran at all?
 *
 * CPython reports a syntax error before executing a single line, so "your
 * program did not compile" and "your program crashed while running" are
 * genuinely different events — and they are different things to say to a
 * fourteen-year-old, who needs to look at their punctuation in one case and
 * their logic in the other.
 *
 * It lives here rather than in a provider because BOTH providers have to reach
 * the same answer about the same program. They did not: the local subprocess
 * matched this pattern and Piston did not, so flipping `EXEC_PROVIDER` from
 * `local` to `piston` silently changed the message a learner got for a missing
 * bracket. One predicate, imported twice, cannot drift.
 *
 * Known imprecision, shared deliberately: a program that catches a SyntaxError
 * at runtime and prints it — `eval("(")` — is read as a compile error. Both
 * providers agree on that too, which is worth more than either being subtly
 * cleverer than the other.
 */
export function looksLikeCompileError(stderr: string): boolean {
  return /SyntaxError|IndentationError|TabError/.test(stderr);
}

/**
 * Is the JUDGE at fault?
 *
 * Deliberately still the two provider statuses and not the size refusal. This
 * predicate feeds "is the sandbox healthy" questions — the health route, the
 * ops counters, the dev lab — and a learner pasting a large file is not an
 * outage. Use `isLearnerEvidence` for the other question, "may I record this
 * against a child", which is the one with three no's rather than two.
 */
export function isInfrastructure(status: ExecutionStatus): boolean {
  return status === "provider_timeout" || status === "provider_error";
}

/** The request was refused on size and never reached the judge. */
export function isPayloadRejection(status: ExecutionStatus): boolean {
  return status === "payload_too_large";
}

/**
 * May a result with this status be recorded as something the learner did?
 *
 * The predicate form of `ExecutionResult.infrastructureError`, for the callers
 * that hold a status without a result. Three no's: the judge did not answer, the
 * judge is broken, or we refused to run it. Everything else — including a
 * program that was too slow or ran out of memory — is honest evidence.
 */
export function isLearnerEvidence(status: ExecutionStatus): boolean {
  return !isInfrastructure(status) && !isPayloadRejection(status);
}

export interface CodeExecutionProvider {
  readonly id: string;
  /** Human-readable, for the health route and the dev lab. */
  readonly describe: string;
  run(request: ExecutionRequest): Promise<ExecutionResult>;
}

/**
 * The ceilings, and the reasoning for each.
 *
 * Every one is generous by a factor nobody will ever notice and small enough
 * that no single request can cost the class its judge. They are enforced by
 * `schools/exec/limits.ts` — the numbers living here without an enforcer was
 * the actual defect, not the numbers.
 */
export const EXECUTION_LIMITS = {
  /** Generous for a beginner's program, tight enough to catch a runaway loop. */
  timeLimitMs: 5_000,
  memoryLimitMb: 256,
  /** Beyond this the output is not a result, it is a print statement in a loop. */
  maxOutputBytes: 64 * 1024,
  /**
   * 64 KiB of source — roughly 1,600 lines of ordinary Python at 40 bytes a
   * line, or 800 if it is commented in Kazakh at two bytes a character.
   *
   * Grade 9 does not write 1,600 lines. The longest reference solution in the
   * approved programme is under 20, and the longest thing a learner plausibly
   * pastes is a whole worked file from a lesson — a few hundred bytes. So this
   * sits about two orders of magnitude above anything legitimate: a learner
   * cannot reach it by working, and it cannot be used to push megabytes through
   * a judge sized for eighteen simultaneous presses of Check.
   *
   * Kept at the value it already had. It was never wrong — it was never
   * enforced, and it was compared against `String.length` in the one place it
   * was checked at all.
   */
  maxSourceBytes: 64 * 1024,
  /**
   * 16 KiB of stdin, and it had no limit at all before.
   *
   * The largest input any case in the curriculum declares is eight characters
   * («1000 100»). This is two thousand times that, which comfortably covers the
   * only legitimate large case — a learner on manual Run pasting a few hundred
   * lines to test a loop that reads until EOF — and still refuses a payload
   * designed to make a subprocess sit on a full pipe.
   *
   * A quarter of the source limit on purpose: a learner types stdin, they do
   * not paste a program into it, so the honest ceiling is lower.
   */
  maxStdinBytes: 16 * 1024,
} as const;
