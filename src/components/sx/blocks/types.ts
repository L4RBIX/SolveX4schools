import type { LessonBlock } from "@schools/curriculum/types";
import type { Verdict } from "../primitives";

/**
 * What every block renderer receives.
 *
 * `onResult` is how a block reports what happened. It reports the **observed
 * fact** — the learner answered, and it was right or wrong — and nothing more.
 * It deliberately does not report a conclusion about the learner: attributing
 * a wrong answer to a cause is the Decision Engine's job, and only where the
 * content author declared the answer diagnostically unambiguous.
 */
export interface BlockResult {
  verdict: Verdict;
  /** The learner's raw answer, for diagnostic mapping lookup. */
  answer?: string;
  /** Only when the block's `diagnosticMapping` names this exact answer. */
  failureClass?: string;
}

export interface BlockProps<T extends LessonBlock = LessonBlock> {
  block: T;
  onResult: (result: BlockResult) => void;
  /** Set once the learner has committed; renderers become read-only. */
  settled: boolean;
  result: BlockResult | null;
}

/**
 * Look up a declared failure class for an answer.
 *
 * Returns undefined far more often than not, and that is the point. An absent
 * mapping means the pipeline records `unattributed_failure` and the engine
 * responds `DIAGNOSE` — it asks the learner what they were thinking instead of
 * asserting something about them.
 */
export function lookupFailureClass(
  block: LessonBlock,
  answer: string,
): string | undefined {
  return block.diagnosticMapping?.[answer]?.failureClass;
}
