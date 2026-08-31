/**
 * The learning intelligence core: events in, a decision out.
 *
 * Dependencies: `node:crypto` (hashing in `diff.ts`) and
 * `@solvex/learning-contracts`. Nothing else — no framework, no database, no
 * HTTP, no LLM.
 *
 * The pipeline, in the order it runs:
 *
 *   raw events  ──reduceEpisode──►  ReducedEpisode
 *               ──buildLearnerState──►  LearnerState
 *               ──decide──►  LearningDecision { primary: NextAction }
 *                                              └── .nova is the directive
 *
 * `decide()` is the entry point most consumers want.
 */

// L2 — episode projection
export { reduceEpisode, REDUCER_VERSION, isTrustedOutcome } from "./episode";
export type { ReducedEpisode, ReducibleEvent } from "./episode";

// Diff classification (feeds the reducer)
export { classifyDiff, normalizeCode, astShape, hashCode, stripCommentsAndStrings } from "./diff";
export type { DiffResult, NormalizedCode } from "./diff";
export { STARTER_TEMPLATES } from "./starterTemplates";

// L3 — interventions and their outcomes
export { buildInterventions, INTERVENTION_REDUCER_VERSION } from "./interventions";
export type { InterventionRow } from "./interventions";
export { OUTCOME_REDUCER_VERSION } from "./interventionOutcome";
export type { ComputedOutcome, InterventionOutcome } from "./interventionOutcome";

// L4 — learner state
export {
  buildLearnerState,
  observationConfidence,
  hintEffectiveness,
  ACTIONABLE_CONFIDENCE,
  LEARNER_STATE_VERSION,
} from "./learnerState";
export type {
  LearnerState,
  SkillState,
  SkillLevel,
  MisconceptionObservation,
  AssistanceProfile,
  EpisodeInput,
} from "./learnerState";

// L5 — decision engine
export { decide, mayAssertMisconception, DECISION_ENGINE_VERSION } from "./decisionEngine";
export type {
  LearningDecision,
  NextAction,
  ActionType,
  NovaDirective,
  NovaMode,
  TaskRequest,
  EvidenceRef,
} from "./decisionEngine";

// L6 — action memory
export { INTERVENTION_MEMORY_VERSION } from "./interventionMemory";
