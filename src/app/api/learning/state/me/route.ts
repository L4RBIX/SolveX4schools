import { decide } from "@solvex/learning-intelligence-core";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { resolveIdentity } from "@schools/learning/identity";
import { buildEvidence, evidenceSummary } from "@schools/presentation/evidence";
import { windowFor } from "@schools/lib/activity-window";

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
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  const persisted = await store.getLearnerState(subjectId);

  const state = persisted?.state ?? null;
  const decision = state ? decide(state) : null;

  /* The same window arithmetic the progress page uses, deliberately — the home
     rail and `/you` must not be able to disagree about when the week started,
     and two functions that both compute "this week" eventually do. */
  const week = windowFor("week", 0, new Date());
  const buckets = await store.activityBuckets(
    subjectId,
    week.from.toISOString(),
    week.to.toISOString(),
    "day",
  );
  const activeDays = buckets.filter((b) => b.attempted > 0).map((b) => b.bucket);
  const activeSeconds = buckets.reduce((n, b) => n + b.activeSeconds, 0);

  const completions = await store.completionsForSubject(subjectId);

  return Response.json({
    hasState: state !== null,
    computedAt: persisted?.computedAt ?? null,
    summary: evidenceSummary(state),
    /* Real, or absent. Never a placeholder — the rail used to show a hardcoded
       streak of 0, which is a claim about a learner nobody measured. */
    week: {
      startIso: week.from.toISOString(),
      activeDays,
      activeMinutes: Math.round(activeSeconds / 60),
      /* The programme's own commitment: ~40 minutes of platform practice a week
         (PDF p.2). A target the learner can act on, not an invented score. */
      goalMinutes: 40,
    },
    /* The server's record of finished lessons.
     *
     * Additive, and nothing reads it yet. The gameboard still reads the browser
     * copy in `src/lib/progress.ts` — that is what makes a finished lesson
     * change the board in the same frame, and it deliberately stays. This is
     * the copy that survives a cleared cache, and it is here so that hydrating
     * from the server later is a client change rather than a schema one.
     *
     * The counts ride along because they are already on the row; they are the
     * player's own tally and are not evidence about the learner. See migration
     * 0010. */
    completions: completions.map((c) => ({
      lessonId: c.lessonId,
      completedAt: c.completedAt,
      correct: c.correct,
      wrong: c.wrong,
      unmeasured: c.unmeasured,
      attempts: c.attempts,
    })),
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
