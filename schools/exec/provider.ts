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
   * A metered judge refused us on quota. NOT evidence.
   *
   * Its own member rather than a shade of `provider_error`, because "we asked
   * too much of a plan" and "the judge is down" want opposite reactions — wait
   * or buy more, versus wake somebody up — and because for a class on a rented
   * judge this is the single most likely way a lesson breaks. Folded together,
   * the health view could not tell an over-quota afternoon from an outage.
   *
   * It self-heals, which is the other half of the argument: a `provider_error`
   * that clears itself in a minute teaches an operator to ignore
   * `provider_error`.
   *
   * `isInfrastructure` includes it and `isLearnerEvidence` excludes it, with no
   * ambiguity at all: nothing whatsoever may be recorded about a learner whose
   * submission was refused before it ran. See
   * `docs/infrastructure/JUDGE0_RAPIDAPI_AUDIT.md`.
   */
  | "provider_rate_limited"
  /**
   * The request was refused on size and never ran. NOT evidence.
   *
   * A kind of its own, and it needed its own name rather than being folded into
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
   * means no, and there are four ways to get there: the judge did not answer,
   * the judge is broken, the judge refused us on quota, or we refused the
   * request before it ran.
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
 * Deliberately still the provider statuses and not the size refusal. This
 * predicate feeds "is the sandbox healthy" questions — the health route, the
 * ops counters, the dev lab — and a learner pasting a large file is not an
 * outage. Use `isLearnerEvidence` for the other question, "may I record this
 * against a child", which is the one with one more no than this.
 *
 * `provider_rate_limited` counts, and belongs on this side: a judge that will
 * not take our work is a judge that is not available to a class, whatever the
 * reason. The reason still matters — it is why it is a separate member — but
 * "can this deployment grade anything right now" has the same answer for all
 * three.
 */
export function isInfrastructure(status: ExecutionStatus): boolean {
  return (
    status === "provider_timeout" ||
    status === "provider_error" ||
    status === "provider_rate_limited"
  );
}

/** The request was refused on size and never reached the judge. */
export function isPayloadRejection(status: ExecutionStatus): boolean {
  return status === "payload_too_large";
}

/**
 * May a result with this status be recorded as something the learner did?
 *
 * The predicate form of `ExecutionResult.infrastructureError`, for the callers
 * that hold a status without a result. Four no's: the judge did not answer, the
 * judge is broken, the judge refused us on quota, or we refused to run it.
 * Everything else — including a program that was too slow or ran out of memory
 * — is honest evidence.
 */
export function isLearnerEvidence(status: ExecutionStatus): boolean {
  return !isInfrastructure(status) && !isPayloadRejection(status);
}

export interface CodeExecutionProvider {
  readonly id: string;
  /**
   * Does every call to this provider spend money or quota?
   *
   * ## Why the port has to know
   *
   * Two things call a provider: SUBMIT, which must be trusted and is worth
   * paying for, and `/api/exec/run` — the Run fallback for a browser that
   * cannot load Pyodide. Until a metered judge existed those were the same
   * kind of call. With Judge0 CE on RapidAPI they are not, and the arithmetic
   * is not close:
   *
   *   the Run fallback is rate limited at 20/minute per learner, so eighteen
   *   learners can generate **360 RapidAPI requests a minute** — of untrusted,
   *   ungraded, iterate-as-you-type traffic — before anyone presses Check.
   *
   * A commonly-cited Judge0 CE free tier is a few dozen submissions a DAY.
   * Run traffic would therefore exhaust the plan in seconds and take the
   * TRUSTED path down with it: the class could no longer Submit, because
   * someone was typing.
   *
   * That is the wrong thing to break. A learner whose browser cannot run
   * WebAssembly loses a convenience; a class that cannot Submit loses the
   * graded course. So the Run route refuses a metered provider outright, and
   * this flag is how it knows — see `src/app/api/exec/run/route.ts`.
   *
   * `local` and `piston` are free: a subprocess and a judge on our own host.
   */
  readonly metered: boolean;
  /** Human-readable, for the health route and the dev lab. */
  readonly describe: string;
  run(request: ExecutionRequest): Promise<ExecutionResult>;
  /**
   * Every case of one submission at once, for a provider that can do better
   * than a serial loop. OPTIONAL, and absent is the normal case.
   *
   * `runCases` uses it when it is there and falls back to calling `run` in a
   * loop when it is not, so the local subprocess and Piston need no change and
   * get no new behaviour — both answer in a single round trip, where a loop
   * costs nothing worth reclaiming.
   *
   * It exists for a judge that is POST-then-poll across a continent, where four
   * hidden cases mean four sequential submit-and-poll cycles and a learner
   * watching a spinner for the sum of them.
   *
   * ## The contract, which belongs to `runCases` and not to the provider
   *
   * The returned array MUST be the same length as `requests` and in the same
   * order — index `i` is the result for `requests[i]` — and a provider that
   * cannot honour that must fail rather than realign, because a misaligned
   * batch attributes one test case's result to another's. `runCases` still
   * stops at the first infrastructure failure in case order and still reports
   * whatever results preceded it, so an outage can never be rendered as a set
   * of wrong answers. What a batch changes is only what was already SPENT by
   * the time that is known.
   */
  runBatch?(requests: readonly ExecutionRequest[]): Promise<ExecutionResult[]>;
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
   * It used to say here that "the largest input any case in the curriculum
   * declares is eight characters («1000 100»)", which stopped being true the
   * moment May's complexity guards landed. It is now about 16 000 — those cases
   * are deliberately at the ceiling — and the second-largest is 670 bytes
   * (m9.c2.p5's 25×25 map). The limit still comfortably covers a learner on
   * manual Run pasting a few hundred lines to test a loop that reads until EOF,
   * and still refuses a payload designed to make a subprocess sit on a full pipe.
   *
   * A quarter of the source limit on purpose: a learner types stdin, they do
   * not paste a program into it, so the honest ceiling is lower.
   *
   * ## What this number costs the curriculum, measured
   *
   * At two bytes per value it caps a case at roughly 8 190 numbers, which caps
   * the work a naive solution can be made to do at about 3e7 operations. That
   * is enough to defeat an O(n²) solution inside the 5 s cpu budget — May's two
   * new guards run the reference in 0.1 s and the naive in 8-12 s — and it is
   * NOT enough to defeat an O(n·q) one: at the largest legal input `m9.c4.p3`'s
   * quadratic solution finishes in 2.9 s and `m9.c1.p4`'s in 4.5 s, both inside
   * the budget. So those two tasks cannot test the bound their own prompts
   * state, and raising this number is the only thing that would let them.
   *
   * That is a decision about the judge rather than about content, which is why
   * it is written down here rather than acted on: a bigger ceiling is a bigger
   * payload through a rented service for every learner, and the case for it
   * should be made deliberately.
   *
   * `runCases` appends a newline, so a case's `input` literal may be at most
   * 16 383 bytes.
   */
  maxStdinBytes: 16 * 1024,
} as const;
