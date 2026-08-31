import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { config } from "@schools/config";
import { isContestLesson } from "@schools/curriculum/inventory";
import { getStore } from "@schools/store";
import { resolveIdentity } from "./identity";

/**
 * The clock on May's timed practice contests.
 *
 * ## Why the server owns it
 *
 * `m9.c1`–`m9.c4` are authored at 45 minutes each and the number reached no
 * learner: `PublicLesson` has no `minutes` field, and no countdown component
 * existed anywhere in the product. A month whose declared skills are
 * «уақытты бөлу» and «тұрып қалған есепті уақытында тастау» — allocate the
 * time, drop a stuck problem in time — was four untimed exercise sets.
 *
 * Every obvious place to keep the start instant is somewhere the learner can
 * reach: `localStorage`, `sessionStorage`, a cookie and `src/lib/progress.ts`
 * are all per-device and learner-writable, so a second tab or a cleared cache
 * restarts the clock — which is exactly the property a timer must not have.
 * `account_preferences` is documented as read and written whole by the client
 * and is keyed on a user id an anonymous learner does not have.
 *
 * So it lives in the ledger, as one `contest_started` event with an id DERIVED
 * from (subject, lesson). `insertEvents` ends `on conflict (event_id) do
 * nothing`, so the second tab, the refresh, the re-login and the cleared cache
 * are all no-ops that read the first row back. No migration: `event_name` is a
 * text column and the event is `server` trust, so a browser cannot author one.
 *
 * ## What it deliberately does NOT do
 *
 * Nothing is enforced at zero. The contest does not lock, submissions are not
 * refused, and no score depends on the clock — the curriculum asks learners to
 * practise allocating time, not to be cut off by a machine, and a timer that
 * confiscated a fourteen-year-old's work mid-sentence would teach something
 * else entirely. It is a clock on the wall.
 */

/** A v5-shaped uuid from (subject, lesson), so the insert is exactly-once. */
function contestEventId(subjectId: string, lessonId: string): string {
  const digest = createHash("sha256")
    .update(`contest_started|${subjectId}|${lessonId}`)
    .digest();
  const b = Buffer.from(digest.subarray(0, 16));
  /* Version 5, variant RFC 4122 — so the value is a legal uuid for the column
     rather than sixteen bytes that happen to fit. */
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Seconds left on this learner's contest, or `null` if this is not one.
 *
 * Starts the clock on first read, which is the only moment that is both after
 * the learner has opened the contest and before they can have worked on it.
 * Returns a floor of 0 rather than a negative: overrun is a real state and the
 * display says 0:00, but no caller should have to reason about a negative
 * duration.
 */
export async function contestRemainingSeconds(
  lessonId: string,
  estimatedMinutes: number | undefined,
): Promise<number | null> {
  if (!isContestLesson(lessonId)) return null;
  if (!estimatedMinutes || estimatedMinutes <= 0) return null;

  try {
    const { subjectId } = await resolveIdentity();
    const store = await getStore();
    const startedAt = await store.contestStartedAt(subjectId, lessonId, {
      eventId: contestEventId(subjectId, lessonId),
      sessionId: randomUUID(),
      environment: config.environment,
      route: `/lesson/${lessonId}`,
    });

    const elapsedMs = Date.now() - Date.parse(startedAt);
    const remaining = Math.round((estimatedMinutes * 60_000 - elapsedMs) / 1000);
    return Math.max(0, remaining);
  } catch {
    /* Degrade to no clock, never to a broken page. A contest without a visible
       timer is the state this product shipped in for its whole life; a lesson
       that 500s because the ledger hiccuped is worse than that by a distance. */
    return null;
  }
}
