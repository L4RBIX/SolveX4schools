import "server-only";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { MONTH_BY_INDEX } from "./months";
import { approvalState, type ApprovalState, type PublicationRecord } from "./publication";
import type { Month } from "./types";

/**
 * The gate between authored content and a classroom.
 *
 * `types.ts` has always claimed students see `published` and nothing else.
 * Every runtime check was `status !== "draft"`, so September reached learners at
 * `implemented` with the validator reporting zero published, and nothing
 * disagreed. This is the check that makes the claim true.
 *
 * ## Development is explicitly different, and says so
 *
 * Authoring a month you cannot open is not a workflow. In development the gate
 * is open and every call reports `bypassedForDevelopment`, so a caller can
 * surface "you are seeing unapproved content" rather than the two environments
 * differing silently — which is how a developer ends up demonstrating a lesson
 * to a school that production would refuse to serve.
 *
 * ## What "approved" means
 *
 * A row in `curriculum_publications` whose hash matches the month's CURRENT
 * content. Editing the curriculum changes the hash and lapses the approval by
 * arithmetic rather than by anybody remembering. See migration 0013.
 */

export interface GateResult {
  open: boolean;
  /** True when development opened it, regardless of approval. */
  bypassedForDevelopment: boolean;
  approval: ApprovalState;
}

let cached: { at: number; records: PublicationRecord[] } | null = null;

/**
 * Approvals change roughly never and are read on every lesson request, so they
 * are cached for a few seconds. Short enough that a withdrawal takes effect
 * while a class is still in the room, which is the case that matters.
 */
const CACHE_MS = 5_000;

async function records(): Promise<PublicationRecord[]> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.records;
  try {
    const store = await getStore();
    const rows = await store.publications();
    cached = { at: now, records: rows };
    return rows;
  } catch {
    /* The database is unreachable. Fail CLOSED in production: serving
       unapproved material because a query failed is the exact outcome this file
       exists to prevent. The caller distinguishes it from "not approved" only
       in the sense that both refuse. */
    return [];
  }
}

export async function gateFor(month: Month): Promise<GateResult> {
  const approval = approvalState(month, await records());
  if (config.environment === "development") {
    return { open: true, bypassedForDevelopment: true, approval };
  }
  return { open: approval.state === "approved", bypassedForDevelopment: false, approval };
}

export async function gateForMonthIndex(monthIndex: number): Promise<GateResult | null> {
  const month = MONTH_BY_INDEX.get(monthIndex);
  if (!month) return null;
  return gateFor(month);
}

/**
 * May a learner open this lesson?
 *
 * Two conditions, both required: the lesson is authored, and the month it
 * belongs to has been approved. The first was always checked; the second is the
 * one that was missing.
 */
export async function lessonIsServable(lessonId: string): Promise<boolean> {
  for (const month of MONTH_BY_INDEX.values()) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id !== lessonId) continue;
        if (lesson.status === "draft" || lesson.blocks.length === 0) return false;
        return (await gateFor(month)).open;
      }
    }
  }
  return false;
}

/** Test seam. The cache is process-local and would otherwise outlive a fixture. */
export function resetGateCache(): void {
  cached = null;
}
