/**
 * The event contract: what the core will accept, and what it will refuse.
 *
 * This package has ZERO dependencies — not on the core, not on Nova, not on
 * React, Next.js, Supabase or Node. It is the file an adapter is written
 * against, and the only one an adapter strictly must read.
 *
 * The runtime types for LearnerState, NovaDirective and the action set are NOT
 * re-exported here. They are defined next to the code that computes them
 * (`learnerState.ts`, `decisionEngine.ts`) and were deliberately left there:
 * moving a type definition across a package boundary is a diff in a file whose
 * behaviour we are claiming parity for, and a barrel that re-exports them would
 * make `learning-contracts` depend on the core, inverting the arrow. Import
 * those types from their own packages. `contracts/*.schema.json` at the archive
 * root carries the same shapes language-neutrally.
 */

export {
  // Event taxonomy
  LEARNING_EVENTS,
  LEARNING_EVENT_VERSION,
  EVENT_TRUST,
  isLearningEventName,
  // Who may CREATE an event, as opposed to who may name one.
  CLIENT_REPORTABLE_EVENTS,
  isClientReportable,
  // Payload contract
  ALLOWED_PAYLOAD_KEYS,
  CODE_TRANSPORT_KEY,
  ATTESTATION_TRANSPORT_KEY,
  sanitizePayload,
  // Closed vocabularies the reducer switches on
  DIFF_CLASSES,
  isDiffClass,
  CLOSE_REASONS,
  IDLE_FOLLOWED_BY,
  TARGETS_EDGE,
  LEARNING_VERDICTS,
  isLearningVerdict,
  toLearningVerdict,
  FAILURE_CLASSES,
  isFailureClass,
  // Bucketing helpers. Buckets rather than raw numbers on purpose: a bucket
  // cannot be used to re-identify a session the way a precise duration can.
  editDistanceBucket,
  secondsBucket,
  inputSizeClass,
} from "./events";

export {
  ATTESTATION_VERSION,
  attestationSecret,
  verifyAttestation,
} from "./attestation";

export type { AttestedSubmission, AttestedAttribution } from "./attestation";

export type {
  LearningEventName,
  SourceTrust,
  AllowedPayloadKey,
  PayloadValue,
  LearningPayload,
  DiffClass,
  CloseReason,
  IdleFollowedBy,
  TargetsEdge,
  EditDistanceBucket,
  SecondsBucket,
  InputSizeClass,
  LearningVerdict,
  FailureClass,
} from "./events";
