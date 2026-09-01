/**
 * The code execution port.
 *
 * Everything above it — lesson blocks, Arena, the evidence pipeline, the
 * teacher projection — speaks this and nothing else. Swapping a self-hosted
 * judge for a managed one is a provider file and an environment variable.
 *
 * ## No `server-only`, unlike every implementation of it
 *
 * This file is the port DEFINITION: an interface, two type unions, four pure
 * predicates and a re-export of some numbers. It imports nothing, reads no
 * configuration, holds no credential and touches no node API, so there is
 * nothing here for a client bundle to pull in and nothing to leak.
 *
 * The marker belongs on the IMPLEMENTATIONS, and they all still carry it:
 * `./index.ts` (which resolves the provider and can load a key-holding module),
 * `./limits.ts` (which counts and refuses), and every file under `./providers/`.
 * `tests/execution/pyodide-boundary.test.ts` asserts that, and names this file
 * and `./execution-limits.ts` as the two deliberate exceptions beside
 * `./checker.ts`.
 *
 * The concrete cost of the marker being here was a broken tool: it made
 * `scripts/check-blocks.ts` — which reads `EXECUTION_LIMITS` to tell a content
 * author their case input is oversized — throw on startup, so that check had not
 * run for several commits.
 */

export interface ExecutionRequest {
  /**
   * Only `cpp17` for year one. The curriculum teaches C++17.
   *
   * A one-member union rather than a `string`, deliberately. The port used to
   * say `python3` and every provider translated it; if it said `string` a
   * caller could ask for a language no provider can honestly supply and find
   * out from a learner's failed submission. Adding a second language means
   * adding it here, which makes every provider's `switch` a compile error until
   * someone decides what that provider does with it — see
   * `schools/execution/cpp-runtime.ts` for the vendor spellings this maps to.
   */
  language: "cpp17";
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

/*
 * ## The predicate that used to live here, and why it is gone
 *
 * `looksLikeCompileError(stderr)` matched `/SyntaxError|IndentationError|
 * TabError/` and existed because Python has no compile STAGE: CPython refuses a
 * file before executing a line of it, but it says so on stderr with a non-zero
 * exit, which is indistinguishable from a crash unless something reads the
 * prose. Both providers had to read the same prose or `EXEC_PROVIDER=local` and
 * `EXEC_PROVIDER=piston` would give a learner different words for one missing
 * bracket, so the guess was shared rather than duplicated.
 *
 * C++ has a compile stage, and every engine reports it structurally:
 *
 *   - Judge0 answers status id 6, `COMPILATION_ERROR`, with the diagnostics in
 *     `compile_output` — its own field, not stderr.
 *   - Piston populates `body.compile` with a non-zero code.
 *   - The local provider compiles and links as a separate child process, and
 *     only runs the binary if that succeeded.
 *   - The browser compiles with clang and links with lld before it executes.
 *
 * So "did not compile" is now OBSERVED on all four, and a heuristic over
 * diagnostic text would be strictly worse: `error:` appears in plenty of
 * programs' own runtime output, and a learner printing it would be told their
 * program never started. The distinction the old comment defended — punctuation
 * versus logic, which really are different afternoons for a fourteen-year-old —
 * is preserved exactly, by evidence instead of by pattern.
 */

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
   * cannot load the compiler. Until a metered judge existed those were the same
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

/* The ceilings live in a module with no `server-only` and no imports, so the
   authoring checker can read them — see `./execution-limits.ts`. Re-exported
   here because every consumer of the port already reads them from the port, and
   moving a constant should not move an import. */
export { EXECUTION_LIMITS } from "./execution-limits";
