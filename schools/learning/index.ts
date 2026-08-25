/**
 * The school adapter over the imported Learning Intelligence subsystem.
 *
 * Read `docs/integration/LI_ADAPTER.md` before changing anything here. The
 * short version: this layer exists because the export was built for a
 * competitive-programming product and a school is not one. Every module below
 * fixes a specific, verified coupling defect, and none of them edits the
 * export.
 *
 * The signer is deliberately NOT re-exported — importing `./sign` from a
 * client component would pull `node:crypto` and the secret's absence into a
 * browser bundle. Server code imports it by path.
 */

export {
  taskRef,
  parseTaskRef,
  problemId,
  taskKindFor,
  type SchoolTaskKind,
  type SchoolTaskRef,
} from "./taskRef";

export {
  SANDBOX_STATUSES,
  isSandboxStatus,
  assertSandboxStatus,
  sandboxVerdict,
  type SandboxStatus,
} from "./verdict";

export {
  schoolHasAttemptSince,
  toGuardEvents,
  isAttempt,
  type SchoolInteraction,
  type SchoolInteractionType,
} from "./attempts";

export {
  failureWord,
  ASSISTANT_DISCLOSURE,
  DIAGNOSE_OPENING,
  UNKNOWN_MASTERY,
  type FailureClass,
} from "./phrasing";
