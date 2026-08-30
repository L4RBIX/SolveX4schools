import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { resolveIdentity } from "@schools/learning/identity";
import { clampOffset, windowFor, type ActivityWindow } from "@schools/lib/activity-window";
import { isPeriod, type Period } from "@schools/lib/period";
import { opsLog } from "@schools/ops/counters";

/**
 * The learner's own activity, bucketed for the progress page.
 *
 * Scoped by construction: there is no `subjectId` parameter, so no version of
 * this route can be pointed at another child. The only inputs are which window
 * to read and how far back, and both are bounded here rather than trusted.
 *
 * Scoped is not the same as gated, which is what this route used to miss.
 * `resolveIdentity` falls through to the anonymous cookie branch when there is
 * no session and MINTS a `learning_subjects` row for whoever asked — so an
 * unauthenticated caller got a subject of their own, an empty progress page,
 * and a row in the table a teacher's class list is built from. Nothing leaked;
 * a roster that quietly grows strangers is the problem.
 *
 * The window arithmetic lives in `@schools/lib/activity-window` so it can be
 * tested without a server; see `tests/school/activity-window.test.ts`.
 *
 * ## When the store is not there
 *
 * It degrades the way `/api/health` degrades — 503, `no-store`, and a body that
 * says which kind of failure it was. The long form of the reasoning is in
 * `src/app/api/learning/state/me/route.ts`; the two routes are the pair the
 * progress page loads together, and a page whose two halves disagreed about
 * what an outage looks like would be worse than either.
 */

export const runtime = "nodejs";

/**
 * Every store touch this route makes, in one function.
 *
 * Collected rather than scattered so the guard in `GET` cannot fall out of date
 * with the reads it is guarding. `resolveIdentity` is a store call in its own
 * right — it can MINT a subject row — which is easy to forget when it reads
 * like a lookup.
 */
async function readBuckets(span: ActivityWindow) {
  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  return store.activityBuckets(
    subjectId,
    span.from.toISOString(),
    span.to.toISOString(),
    span.grain,
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  /* Bounded before anything is read, and above the guard because none of it can
     fail: an unknown period falls back to the week and an out-of-range offset is
     clamped, so there is no input here that reaches the query unexamined. */
  const raw = url.searchParams.get("period");
  const period: Period = isPeriod(raw) ? raw : "week";
  const offset = clampOffset(url.searchParams.get("offset"));
  const span = windowFor(period, offset, new Date());

  let rows: Awaited<ReturnType<typeof readBuckets>>;
  try {
    /* Production and preview require a session; development may stay anonymous.
       See `schools/auth/policy.ts` — one place decides, so two routes cannot
       disagree about whether a stranger may accumulate learning evidence.

       Inside the guard because it is itself a store read: `currentUser` resolves
       the session cookie against a table, so for a signed-in learner this is the
       first line to touch the store and the first one to throw. */
    const access = await checkLearningAccess();
    if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

    rows = await readBuckets(span);
  } catch (err) {
    opsLog("learning.activity_unavailable", {
      route: "learning/activity",
      /* The period, because "the year view is the one that dies" is a real
         diagnosis and the period is curriculum-shaped rather than learner-shaped
         — it says nothing about who asked. No subject id, ever: `opsLog` writes
         to the one store `learning_forget_user` cannot reach. */
      period,
      /* Truncated, and stripped of anything URL-shaped: a `pg` error message
         frequently carries the connection string and a PGlite one carries the
         data directory. Same rule, and the same regex, as `errText` in
         `schools/ops/health.ts`. */
      message: (err instanceof Error ? err.message : String(err))
        .replace(/[a-z+]+:\/\/\S*/gi, "(url)")
        .slice(0, 200),
    });

    /* `retryable: true` is true by construction: everything inside the `try` is
       I/O, and the window arithmetic and the zero-fill below are pure, so a bug
       in either still surfaces as a 500 rather than as an outage a client will
       politely wait out forever. */
    return Response.json(
      { error: "store_unavailable", retryable: true },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const byBucket = new Map(rows.map((r) => [r.bucket, r]));

  return Response.json({
    period,
    offset,
    fromIso: span.from.toISOString(),
    toIso: span.to.toISOString(),
    grain: span.grain,
    /* Every bucket in the window, in order, zero-filled. The query returns only
       buckets that have something in them; the shape of the window is the
       caller's business, not the query's. */
    buckets: span.buckets.map((b) => {
      const hit = byBucket.get(b);
      return {
        bucket: b,
        attempted: hit?.attempted ?? 0,
        solvedSolo: hit?.solvedSolo ?? 0,
        solvedAssisted: hit?.solvedAssisted ?? 0,
        activeMinutes: Math.round((hit?.activeSeconds ?? 0) / 60),
        helpRequests: hit?.helpRequests ?? 0,
      };
    }),
  });
}
