import { getStore } from "@schools/store";
import { resolveIdentity } from "@schools/learning/identity";
import { clampOffset, windowFor } from "@schools/lib/activity-window";
import { isPeriod, type Period } from "@schools/lib/period";

/**
 * The learner's own activity, bucketed for the progress page.
 *
 * Scoped by construction: there is no `subjectId` parameter, so no version of
 * this route can be pointed at another child. The only inputs are which window
 * to read and how far back, and both are bounded here rather than trusted.
 *
 * The window arithmetic lives in `@schools/lib/activity-window` so it can be
 * tested without a server; see `tests/school/activity-window.test.ts`.
 */

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const raw = url.searchParams.get("period");
  const period: Period = isPeriod(raw) ? raw : "week";
  const offset = clampOffset(url.searchParams.get("offset"));

  const { subjectId } = await resolveIdentity();
  const store = await getStore();

  const { from, to, grain, buckets } = windowFor(period, offset, new Date());
  const rows = await store.activityBuckets(
    subjectId,
    from.toISOString(),
    to.toISOString(),
    grain,
  );

  const byBucket = new Map(rows.map((r) => [r.bucket, r]));

  return Response.json({
    period,
    offset,
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    grain,
    /* Every bucket in the window, in order, zero-filled. The query returns only
       buckets that have something in them; the shape of the window is the
       caller's business, not the query's. */
    buckets: buckets.map((b) => {
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
