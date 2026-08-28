import { createHash } from "node:crypto";
import type { Month } from "./types";

/**
 * What a reviewer approved, and how we know it is still that.
 *
 * ## The hash
 *
 * Over the serialised month OBJECT, not the source file. Comments, formatting
 * and the order of keys in the file are not the content a reviewer read; the
 * prompts, cases, answers and sequence are. So a comment fix does not lapse an
 * approval, and changing a hidden expected output does — which is the exact
 * discrimination the freeze document promises.
 *
 * `JSON.stringify` over the object is stable here because the curriculum is a
 * literal: property order is source order and does not vary between runs. That
 * is a real dependency and it is why this function lives beside the curriculum
 * rather than in a utility module where someone would later "improve" it by
 * sorting keys.
 *
 * Kept free of `server-only` so the CLI, the tests and the freeze document can
 * all compute the same number without a running server.
 */
export function curriculumHash(month: Month): string {
  return createHash("sha256").update(JSON.stringify(month)).digest("hex");
}

/** The shape a publication record has, wherever it is read from. */
export interface PublicationRecord {
  monthIndex: number;
  curriculumHash: string;
  reviewerId: string;
  reviewerName: string;
  note: string | null;
  publishedAt: string;
}

/**
 * Is this month, as it stands right now, approved?
 *
 * The comparison is against the CURRENT content's hash, so this answers "has a
 * human read what we are about to serve" rather than "did anybody ever approve
 * anything called September".
 */
export function isApproved(month: Month, records: readonly PublicationRecord[]): boolean {
  const hash = curriculumHash(month);
  return records.some((r) => r.monthIndex === month.index && r.curriculumHash === hash);
}

/**
 * Why a month is not being served, in words a developer can act on.
 *
 * Three distinguishable cases, because "not published" hides the interesting
 * one: content that WAS approved and has since been edited is a very different
 * situation from content nobody has looked at, and it is the case most likely
 * to be a mistake.
 */
export type ApprovalState =
  | { state: "approved"; record: PublicationRecord }
  | { state: "never_reviewed" }
  | { state: "lapsed"; approvedHash: string; currentHash: string; record: PublicationRecord };

export function approvalState(
  month: Month,
  records: readonly PublicationRecord[],
): ApprovalState {
  const hash = curriculumHash(month);
  const forMonth = records.filter((r) => r.monthIndex === month.index);

  const exact = forMonth.find((r) => r.curriculumHash === hash);
  if (exact) return { state: "approved", record: exact };

  const previous = forMonth[0];
  if (previous) {
    return {
      state: "lapsed",
      approvedHash: previous.curriculumHash,
      currentHash: hash,
      record: previous,
    };
  }
  return { state: "never_reviewed" };
}
