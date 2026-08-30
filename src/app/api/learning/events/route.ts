import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  isClientReportable,
  isLearningEventName,
  sanitizePayload,
  type LearningEventName,
} from "@solvex/learning-contracts";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { checkLearningAccess } from "@schools/auth/policy";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { maybeSweep } from "@schools/reducer/trigger";

/**
 * Ingest.
 *
 * The one write path from an untrusted browser into the append-only ledger.
 *
 * ## What the server refuses to take the client's word for
 *
 * - **The event name.** Off the taxonomy, dropped. A browser cannot invent an
 *   event type and have the reducer switch on it.
 * - **The payload.** `sanitizePayload` runs again here even though it already
 *   ran on the client. The client copy stops a bad value leaving the browser;
 *   this copy stops a forged request bypassing it.
 * - **Trust.** `source_trust` is stamped server-side. A client claiming `judge`
 *   is recorded as `browser` — trust is earned by a valid attestation, which is
 *   checked on the submit route, not asserted in a request body.
 * - **The OUTCOME events, entirely.** `isClientReportable` refuses them.
 *   Stamping a forged verdict as `browser` is only a defence if something
 *   downstream reads the stamp, and nothing did — so the fix is in both
 *   places: ingest will not create the row, and the projections that count
 *   solves now require judge trust.
 * - **The episode.** `ownedEpisodeId` refuses one that belongs to another
 *   learner, exactly as the submit and hint routes already do. This sentence
 *   described an intention rather than the code until the Run button shipped:
 *   the field was simply copied out of the body, and nothing on this route sent
 *   an episode id, so the hole was unreachable rather than closed. It stopped
 *   being unreachable the moment `run_executed` began carrying one.
 * - **Environment and cohort.** Stamped from server config, so a preview deploy
 *   cannot claim to be production.
 * - **The subject.** Read from an httpOnly cookie, never from the body.
 *
 * ## Why it returns before reducing
 *
 * `after()` runs the sweep once the response is sent, so pressing Check is
 * never slowed by the intelligence catching up.
 */

export const runtime = "nodejs";

interface IncomingEvent {
  eventId?: string;
  episodeId?: string | null;
  sessionId?: string;
  seq?: number;
  eventName?: string;
  occurredAt?: string;
  payload?: unknown;
}

const MAX_BATCH = 100;

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  let body: { events?: IncomingEvent[] };
  try {
    body = (await request.json()) as { events?: IncomingEvent[] };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const incoming = Array.isArray(body.events) ? body.events.slice(0, MAX_BATCH) : [];
  if (incoming.length === 0) {
    return NextResponse.json({ accepted: 0, inserted: 0 });
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();

  /*
   * Episode ownership, resolved once per distinct id before any row is built.
   *
   * A batch is usually one episode and always a handful, so this is one indexed
   * lookup rather than one per event — and it happens BEFORE the map because
   * `ownedEpisodeId` is async and the row builder is not.
   *
   * A foreign id is replaced with a fresh one rather than refused, which is the
   * rule `episode-scope.ts` argues for: the caller's own events still land, in
   * an episode of their own, and the other learner's episode is neither read
   * nor written. A 403 would drop a legitimate client's work over a stale id.
   */
  const requestedIds = [
    ...new Set(
      incoming
        .map((e) => e.episodeId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const resolvedEpisodes = new Map<string, string>();
  for (const requested of requestedIds) {
    resolvedEpisodes.set(requested, await ownedEpisodeId(subjectId, requested));
  }

  const rows = incoming.flatMap((e) => {
    const name = e.eventName;
    // Not on the taxonomy: dropped, not coerced. A reducer that switches on a
    // name it has never seen would fall through to a default and quietly
    // change the episode's event_count.
    if (typeof name !== "string" || !isLearningEventName(name)) return [];

    /*
     * Not a browser's to create, even though it is a real event name.
     *
     * This block is what the comment at the top of the file has always claimed
     * and the code never did. Without it, any signed-in learner could POST
     * `verdict_received` with `verdict: "accepted"` and have it counted: the
     * row landed stamped `browser`, which was the correct stamp and no defence
     * at all, because the read paths did not look at the stamp.
     *
     * Dropped silently, along with everything else that fails validation here.
     * A 400 that names the refused event teaches whoever is probing exactly
     * which name to try next, and an honest client never sends these — they
     * have server-side writers.
     */
    if (!isClientReportable(name)) return [];

    return [
      {
        eventId: typeof e.eventId === "string" && e.eventId.length <= 64 ? e.eventId : randomUUID(),
        subjectId,
        /* Never the browser's value. `resolvedEpisodes` holds either the id
           they asked for — because it is theirs or brand new — or a fresh one
           minted in its place. */
        episodeId:
          typeof e.episodeId === "string" && e.episodeId.length > 0
            ? (resolvedEpisodes.get(e.episodeId) ?? null)
            : null,
        sessionId: typeof e.sessionId === "string" ? e.sessionId : randomUUID(),
        seq: Number.isFinite(e.seq) ? Number(e.seq) : 0,
        eventName: name as LearningEventName,
        occurredAt: typeof e.occurredAt === "string" ? e.occurredAt : new Date().toISOString(),
        // Never from the body. Trust is earned by attestation, not claimed.
        sourceTrust: "browser" as const,
        environment: config.environment,
        cohort: "public" as const,
        route: new URL(request.url).pathname,
        payload: sanitizePayload(e.payload),
      },
    ];
  });

  const inserted = await store.appendEvents(rows);

  // After the response. A learner's Check must not wait for reduction.
  after(async () => {
    await maybeSweep(subjectId);
  });

  const res = NextResponse.json({
    accepted: rows.length,
    inserted,
    duplicates: rows.length - inserted,
  });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}
