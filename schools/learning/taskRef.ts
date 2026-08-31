/**
 * School task references.
 *
 * The imported subsystem was built for a competitive-programming catalogue: it
 * speaks `problem_id` and `task_ref` like `cf:1234A`. A school lesson has
 * neither. Rather than bend the contract, this module mints references the
 * contract already accepts, from ids the curriculum already has.
 *
 * The mapping is total and reversible, which matters: an event recorded in
 * September must still resolve to a lesson block in May.
 */

import type { BlockType } from "@schools/curriculum/types";

/**
 * What kind of thing the learner is attempting.
 *
 * `cp_problem` is kept for Arena problems so that imported CP content and
 * school content share a vocabulary. The other three are new and require
 * migration `0004` — the shipped CHECK constraint on `attempt_episodes`
 * rejects them until it is applied. See `LI_ADAPTER.md` §2.
 */
export type SchoolTaskKind = "lesson" | "practice" | "assessment" | "contest" | "cp_problem";

export interface SchoolTaskRef {
  kind: SchoolTaskKind;
  /** Curriculum block id, e.g. `m1.l5.b3`. */
  blockId: string;
  /** Month index the block belongs to, 1–9. */
  month: number;
}

const PREFIX: Record<SchoolTaskKind, string> = {
  lesson: "sx-lesson",
  practice: "sx-practice",
  assessment: "sx-assess",
  contest: "sx-contest",
  cp_problem: "cp",
};

/**
 * The public reference, safe to store and to show in a URL.
 *
 * Format: `sx-lesson:m1.l5.b3`. Deliberately mirrors `cf:1234A` so anything
 * that already parses a `task_ref` on a colon keeps working.
 */
export function taskRef(ref: SchoolTaskRef): string {
  return `${PREFIX[ref.kind]}:${ref.blockId}`;
}

export function parseTaskRef(value: string): { kind: SchoolTaskKind; blockId: string } | null {
  const idx = value.indexOf(":");
  if (idx <= 0) return null;
  const prefix = value.slice(0, idx);
  const blockId = value.slice(idx + 1);
  if (!blockId) return null;
  const entry = (Object.entries(PREFIX) as [SchoolTaskKind, string][]).find(
    ([, p]) => p === prefix,
  );
  return entry ? { kind: entry[0], blockId } : null;
}

/**
 * The identifier the attestation contract requires.
 *
 * `verifyAttestation` rejects any payload whose `problem_id` is not a string —
 * a school submission that omits it is indistinguishable from a forgery, since
 * the verifier returns `null` for a missing secret, a malformed token and a bad
 * signature alike. So every school submission carries one, minted here.
 *
 * It is the task ref verbatim. A separate id space would create two names for
 * the same thing and guarantee that one of them eventually drifts.
 */
export function problemId(ref: SchoolTaskRef): string {
  return taskRef(ref);
}

/** Block types that Arena serves rather than the lesson runtime. */
const ARENA_TYPES: ReadonlySet<BlockType> = new Set<BlockType>(["arena_problem"]);

export function taskKindFor(blockType: BlockType, context: SchoolTaskKind): SchoolTaskKind {
  return ARENA_TYPES.has(blockType) ? "cp_problem" : context;
}
