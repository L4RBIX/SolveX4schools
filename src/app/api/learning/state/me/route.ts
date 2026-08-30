import { decide } from "@solvex/learning-intelligence-core";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { resolveIdentity } from "@schools/learning/identity";
import { buildEvidence, evidenceSummary } from "@schools/presentation/evidence";
import { lastAuthoredMonth } from "@schools/curriculum/inventory";
import { windowFor, type ActivityWindow } from "@schools/lib/activity-window";
import { opsLog } from "@schools/ops/counters";

/**
 * The learner's own state.
 *
 * Read-only and computed on read: `decide()` runs here rather than being cached,
 * because a stale decision is worse than a slow one and the computation is
 * microseconds.
 *
 * Scoped to the caller by construction. There is no `subjectId` parameter, so
 * there is no version of this route that can be pointed at another child.
 *
 * ## When the store is not there
 *
 * It degrades the way `/api/health` degrades — 503, `no-store`, and a body that
 * says which kind of failure it was — rather than throwing an empty 500 at a
 * browser that has no way to tell an outage from a bug. See the guard in `GET`.
 */

export const runtime = "nodejs";

/**
 * Every store touch this route makes, in one function.
 *
 * Collected rather than scattered so the guard in `GET` cannot fall out of date
 * with the reads it is guarding: a read added here is inside the boundary by
 * construction, and a read added anywhere else is visibly in the wrong place.
 *
 * The awaits are serial, exactly as they were when they sat inline. The store
 * is one PGlite connection and the three queries are indexed lookups on a
 * table the size of a class; parallelising them would buy microseconds and cost
 * the ability to read this top to bottom.
 */
async function readSnapshot(week: ActivityWindow) {
  const { subjectId } = await resolveIdentity();
  const store = await getStore();

  return {
    persisted: await store.getLearnerState(subjectId),
    /* The same window arithmetic the progress page uses, deliberately — the
       home rail and `/you` must not be able to disagree about when the week
       started, and two functions that both compute "this week" eventually do. */
    buckets: await store.activityBuckets(
      subjectId,
      week.from.toISOString(),
      week.to.toISOString(),
      "day",
    ),
    completions: await store.completionsForSubject(subjectId),
  };
}

export async function GET() {
  // Pure, and above the guard: arithmetic on `new Date()` cannot fail, and
  // pretending it might would put a bug's symptoms in an outage's clothes.
  const week = windowFor("week", 0, new Date());

  let read: Awaited<ReturnType<typeof readSnapshot>>;
  try {
    /* Production and preview require a session; development may stay anonymous.
       See `schools/auth/policy.ts` — one place decides, so two routes cannot
       disagree about whether a stranger may accumulate learning evidence.

       It is INSIDE the guard because it is itself a store read: `currentUser`
       resolves the session cookie against a table. For anyone actually signed
       in — which in production is everyone, the anonymous branch is development
       only — this line is the FIRST thing to touch the store, so on a bad data
       directory it threw before the route reached a single learner read, and
       what came back was a 500 with nothing in it. */
    const access = await checkLearningAccess();
    if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

    read = await readSnapshot(week);
  } catch (err) {
    /*
     * A structured 503, never a bare empty 500.
     *
     * The shape is `schools/ops/health.ts`'s: name the failure, keep the status
     * machine-readable, and let nothing near the body that could carry a
     * connection string. `/api/health` holds the same fact in Kazakh and
     * Russian for the teacher who gets asked about it — a route that serves
     * JSON to a chart has no business inventing its own translation of it.
     *
     * `retryable: true` is a claim, and it is true by construction here rather
     * than by hope: everything inside the `try` is I/O and every pure
     * computation is below it, so a genuine bug in `decide()` or
     * `buildEvidence()` still surfaces as a 500 instead of being dressed up as
     * weather somebody should wait out.
     *
     * What the client does with it is unchanged for now — `useJson` in
     * `school-you.tsx` rejects any non-2xx and shows «Прогресті жүктеу мүмкін
     * болмады» with a Retry, and the home rail quietly keeps its rail empty.
     * What changes is that a teacher, a monitor or a log line can finally tell
     * "the database is gone" from "this route has a bug", which from an empty
     * 500 was not possible at all.
     */
    opsLog("learning.state_unavailable", {
      route: "learning/state/me",
      /* Truncated, and stripped of anything URL-shaped: a `pg` error message
         frequently carries the connection string and a PGlite one carries the
         data directory. Same rule, and the same regex, as `errText` in
         `schools/ops/health.ts`. */
      message: (err instanceof Error ? err.message : String(err))
        .replace(/[a-z+]+:\/\/\S*/gi, "(url)")
        .slice(0, 200),
    });

    return Response.json(
      { error: "store_unavailable", retryable: true },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const state = read.persisted?.state ?? null;
  const decision = state ? decide(state) : null;

  const activeDays = read.buckets.filter((b) => b.attempted > 0).map((b) => b.bucket);
  const activeSeconds = read.buckets.reduce((n, b) => n + b.activeSeconds, 0);

  return Response.json({
    hasState: state !== null,
    computedAt: read.persisted?.computedAt ?? null,
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
    completions: read.completions.map((c) => ({
      lessonId: c.lessonId,
      completedAt: c.completedAt,
      correct: c.correct,
      wrong: c.wrong,
      unmeasured: c.unmeasured,
      attempts: c.attempts,
    })),
    /* The whole year. This read `buildEvidence(state, 1)` with a comment saying
       later months had no authored content — true when written, and false since
       all nine months were authored. A learner in March saw evidence for ten
       September skills and nothing for the thirty-eight introduced since, on the
       page whose entire purpose is to show it. Derived from the curriculum
       rather than written as a literal, so authoring another month cannot make
       it stale again. */
    skills: buildEvidence(state, lastAuthoredMonth()),
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
