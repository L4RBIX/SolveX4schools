import { toLearningVerdict, type LearningVerdict } from "@solvex/learning-contracts";

/**
 * Verdict translation for the school execution sandbox.
 *
 * ## The bug this exists to prevent
 *
 * `toLearningVerdict` maps any status containing `timeout` to `null`, on the
 * reasonable assumption that a timeout is infrastructure noise — a judge that
 * did not answer. In a school sandbox the same word is the natural thing to
 * call *the learner's program taking too long*, which is the exact opposite:
 * genuine, attributable evidence about an algorithm that is too slow.
 *
 * If the sandbox emits `"timeout"`, that evidence is discarded silently. No
 * error, no log, no verdict — the reducer simply never learns that the learner
 * writes quadratic code. December's entire month is about this skill.
 *
 * So the sandbox's vocabulary is **closed and enumerated below**, the learner's
 * too-slow program is `time_limit_exceeded`, and infrastructure failure is
 * `sandbox_unavailable`. Nothing in this codebase may emit the bare word
 * `timeout` as a verdict.
 */

/** Everything the sandbox is permitted to report. Closed on purpose. */
export const SANDBOX_STATUSES = [
  /** All cases passed. */
  "accepted",
  /** Ran, produced output, output was wrong. */
  "wrong_answer",
  /** Did not compile / raised at import time. */
  "compile_error",
  /** Raised while running. */
  "runtime_error",
  /** The learner's program exceeded the time limit. Evidence, not noise. */
  "time_limit_exceeded",
  /** The learner's program exceeded the memory limit. */
  "memory_limit_exceeded",
  /** The sandbox itself failed. NOT the learner's fault, NOT evidence. */
  "sandbox_unavailable",
  /** Queued or still running. */
  "pending",
] as const;

export type SandboxStatus = (typeof SANDBOX_STATUSES)[number];

const STATUS_SET: ReadonlySet<string> = new Set(SANDBOX_STATUSES);

export function isSandboxStatus(value: unknown): value is SandboxStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

/**
 * Sandbox status → learning verdict.
 *
 * Returns `null` only for the two cases that genuinely carry no information
 * about the learner: the sandbox broke, or it has not answered yet.
 *
 * Delegates the actual mapping to the contract rather than reimplementing it,
 * so if the export's vocabulary changes we follow rather than diverge.
 */
export function sandboxVerdict(status: SandboxStatus): LearningVerdict | null {
  if (status === "sandbox_unavailable" || status === "pending") return null;

  const verdict = toLearningVerdict(status);
  if (verdict === null) {
    // Unreachable given the closed vocabulary above. If it ever fires, the two
    // lists have drifted apart and silence would be the worst possible outcome.
    throw new Error(
      `sandboxVerdict: "${status}" is an allowed sandbox status but the learning ` +
        `contract maps it to null. The vocabularies have drifted — fix this ` +
        `rather than dropping the evidence.`,
    );
  }
  return verdict;
}

/**
 * Guard for anything that produces a status string at runtime.
 *
 * Used by the sandbox boundary so a stray `"timeout"` from a container runtime
 * fails loudly here instead of vanishing into `toLearningVerdict`.
 */
export function assertSandboxStatus(value: unknown): SandboxStatus {
  if (!isSandboxStatus(value)) {
    throw new Error(
      `Unknown sandbox status ${JSON.stringify(value)}. Allowed: ` +
        `${SANDBOX_STATUSES.join(", ")}. Note that "timeout" is deliberately not ` +
        `allowed — use "time_limit_exceeded" for a slow program or ` +
        `"sandbox_unavailable" for infrastructure failure.`,
    );
  }
  return value;
}
