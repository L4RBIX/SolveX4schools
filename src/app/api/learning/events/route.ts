import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  isLearningEventName,
  sanitizePayload,
  type LearningEventName,
} from "@solvex/learning-contracts";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
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

  const rows = incoming.flatMap((e) => {
    const name = e.eventName;
    // Not on the taxonomy: dropped, not coerced. A reducer that switches on a
    // name it has never seen would fall through to a default and quietly
    // change the episode's event_count.
    if (typeof name !== "string" || !isLearningEventName(name)) return [];

    return [
      {
        eventId: typeof e.eventId === "string" && e.eventId.length <= 64 ? e.eventId : randomUUID(),
        subjectId,
        episodeId: typeof e.episodeId === "string" ? e.episodeId : null,
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
