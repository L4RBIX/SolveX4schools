/**
 * Where a result came from, and therefore what it is allowed to mean.
 *
 * ## The distinction this file exists to make unforgeable
 *
 * A learner presses Run and Python executes — in their own browser, under
 * Pyodide, on a runtime they can open DevTools and edit. It is real Python and
 * the output is genuinely useful; it is also a claim made by the party being
 * assessed. A learner presses Submit and the same source runs on our server
 * against cases they have never seen. Those two results can be byte-identical
 * and they are not the same kind of fact.
 *
 * Everything downstream — Learning Intelligence, the assessment, a contest
 * result, the sentence a teacher reads — depends on never confusing them. So
 * trust is a field on every result, it is named rather than inferred, and there
 * is no code path by which a browser can assert the trusted value.
 *
 * ## Why it is not derived from the status
 *
 * The tempting shortcut is `status === "ok" → trusted`. That is exactly the bug:
 * a Pyodide run that prints the right answer has `status: "ok"` and is worth
 * nothing as evidence. Trust is a property of the EXECUTOR, not of the outcome,
 * so it is set where the execution happened and carried, never recomputed.
 *
 * Kept free of `server-only` deliberately: the worker and the lesson player
 * need these types, and the safety comes from the server refusing to accept a
 * client's claim — not from the client being unable to spell the word.
 */

export type ExecutionTrust =
  /**
   * Ran in the learner's browser. Real Python, real output, and entirely under
   * the control of the person being measured. Good for feedback, iteration and
   * context for Nova. Never sufficient on its own for independent evidence.
   */
  | "client_local"
  /**
   * Ran on our server, against cases the learner has never seen, on identity we
   * established. The only value that may become independent evidence.
   */
  | "server_verified";

/**
 * The statuses a local run can produce.
 *
 * Deliberately a separate union from the server's `ExecutionStatus` rather than
 * a reuse of it. They overlap heavily and they are not the same domain: the
 * browser has no memory cgroup and no judge that can be unreachable, and it has
 * a failure mode the server does not — the runtime itself failing to load.
 * Sharing one union would mean every server switch growing a case it can never
 * see, and every client switch growing three.
 */
export type LocalExecutionStatus =
  | "ok"
  | "syntax_error"
  | "runtime_error"
  /** The learner's program was still running when the local budget expired. */
  | "time_limit_exceeded"
  /** The learner's program printed past the local cap. */
  | "output_limit_exceeded"
  /**
   * Pyodide did not start, or the worker died.
   *
   * NOT a statement about the learner's program — it is the local equivalent of
   * `provider_error`, and it must never be recorded as something they did.
   */
  | "runtime_unavailable";

export interface LocalRunRequest {
  /** The learner's own source. Never a reference solution. */
  source: string;
  /** What the learner typed into the input box. */
  stdin: string;
  /** Overrides the default budget; the caller rarely sets this. */
  timeLimitMs?: number;
  maxOutputBytes?: number;
}

export interface LocalRunResult {
  /** Always `client_local`. Present so a result is self-describing in a log. */
  trust: "client_local";
  status: LocalExecutionStatus;
  stdout: string;
  stderr: string;
  /** True when either stream hit the cap and was cut. */
  truncated: boolean;
  /** Wall time as the browser measured it. Not comparable to a server figure. */
  runtimeMs: number;
}

/**
 * Does this outcome say something about the learner?
 *
 * `runtime_unavailable` does not: Pyodide failing to download is our problem, in
 * the same way a dead judge is. The two systems use the same rule so that
 * neither can quietly become the exception.
 */
export function isLearnerOutcome(status: LocalExecutionStatus): boolean {
  return status !== "runtime_unavailable";
}

/**
 * Local budgets.
 *
 * The time limit is deliberately LOWER than the server's 5s. A browser tab is
 * the learner's whole working surface: five seconds of a frozen-feeling Run
 * button is worse than being told quickly that the program did not finish, and
 * a local run is not evidence, so cutting it early costs nothing but a retry.
 * `while True: pass` must stop being a mystery within a couple of seconds.
 *
 * The output cap matches the server's 64 KiB exactly, and that is not a
 * coincidence to be tidied away: a program whose output is truncated locally
 * must be truncated identically on submit, or the learner sees one thing and is
 * graded on another.
 */
export const LOCAL_LIMITS = {
  timeLimitMs: 3_000,
  maxOutputBytes: 64 * 1024,
  /** Bounds what the input box may hold, mirroring the server's stdin cap. */
  maxStdinBytes: 16 * 1024,
  /** Same source ceiling the server enforces, so a paste fails in one place. */
  maxSourceBytes: 64 * 1024,
} as const;
