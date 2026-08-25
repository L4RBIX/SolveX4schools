import { decide } from "@solvex/learning-intelligence-core";
import { getStore } from "@schools/store";
import { resolveIdentity } from "@schools/learning/identity";
import { buildEvidence, evidenceSummary } from "@schools/presentation/evidence";

/**
 * The learner's own state.
 *
 * Read-only and computed on read: `decide()` runs here rather than being cached,
 * because a stale decision is worse than a slow one and the computation is
 * microseconds.
 *
 * Scoped to the caller by construction. There is no `subjectId` parameter, so
 * there is no version of this route that can be pointed at another child.
 */

export const runtime = "nodejs";

export async function GET() {
  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  const persisted = await store.getLearnerState(subjectId);

  const state = persisted?.state ?? null;
  const decision = state ? decide(state) : null;

  return Response.json({
    hasState: state !== null,
    computedAt: persisted?.computedAt ?? null,
    summary: evidenceSummary(state),
    // Through September only — later months have no authored content yet, and
    // listing their skills as "not started" would misrepresent the product.
    skills: buildEvidence(state, 1),
    /* The ACTION is returned; the misconception NAME is not. What the engine
       decided is the learner's business. Which failure class it matched is
       Nova's to act on, phrased as a question — never handed back as a label. */
    action: decision
      ? {
          type: decision.primary.actionType,
          skill: decision.primary.skill,
          confidence: decision.primary.confidence,
          expectedOutcome: decision.primary.expectedOutcome,
        }
      : null,
  });
}
