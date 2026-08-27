import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  ATTESTATION_TRANSPORT_KEY,
  isLearningEventName,
  sanitizePayload,
  toLearningVerdict,
  verifyAttestation,
  type AttestedSubmission,
  type LearningEventName,
  type PayloadValue,
} from "@solvex/learning-contracts";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import type { LearningEventRow, SourceTrust } from "@schools/store/learning-store";
import { checkLearningAccess } from "@schools/auth/policy";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { ownedEpisodeId } from "@schools/learning/episode-scope";
import { opsLog } from "@schools/ops/counters";
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
 *   is recorded as `browser` — trust is earned by a valid attestation, never
 *   asserted in a request body.
 * - **The OUTCOME events, entirely.** See below.
 * - **The episode.** `ownedEpisodeId` refuses one that belongs to another
 *   learner, exactly as the submit and hint routes already do.
 * - **The shape of every identifier.** Three columns here are `uuid` and one is
 *   `timestamptz`; see `parseRow`.
 * - **Environment and cohort.** Stamped from server config, so a preview deploy
 *   cannot claim to be production.
 * - **The subject.** Read from an httpOnly cookie, never from the body.
 *
 * ## The split that matters: witness versus outcome
 *
 * Eight of the thirteen event names describe something the browser is the only
 * witness to. Nobody but the page can see that a learner reopened the
 * statement, sat still for four minutes, or rewrote the body of a loop — the
 * server is not in the room. Those are taken at browser trust because the
 * alternative is not having them.
 *
 * The other five are outcomes, and an outcome carries evidential weight about a
 * child. `verdict_received` with `accepted` counts as an independent solve.
 * `failure_attributed` manufactures a misconception the Decision Engine will
 * act on — it will steer the next hint at a mistake nobody made.
 * `solution_revealed` and the two `assistance_*` events rewrite the hint ledger
 * that `independence_weight` is computed from. Every one of those is produced
 * on this server, by the submit route and the hint route, which is why the
 * browser never needs to author one.
 *
 * Before this split any logged-in browser could post all five. A single
 * `fetch()` in a console — the kind a fourteen-year-old shares with the class
 * by lunchtime — wrote a solve the learner never earned into the same table a
 * teacher reads the term's evidence out of. Stamping the row `browser` was not
 * a defence while nothing read the stamp back, and nothing did until
 * `eventsForEpisode` started selecting it.
 *
 * ## Why refusal is silent
 *
 * A rejected event is dropped and counted, never a 500 and never a 4xx. Ingest
 * is fire-and-forget from `keepalive: true` beacons that nobody awaits and no
 * learner sees fail; erroring on a batch would throw away the seven honest
 * events sitting beside the forged one. The count is the signal — a class where
 * this number leaves zero is a class where somebody found the console, and that
 * is a conversation for a teacher rather than an error for a browser.
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

/**
 * What each event name must PROVE before this route will store it.
 *
 * One table, and the value is doing two jobs at once: it is the trust the row
 * is stamped with, and it is the trust the request has to demonstrate.
 * `browser` means "the browser's word is the best evidence that exists, take
 * it". Anything else means "a signature or nothing".
 *
 * ## The eight that say `browser`
 *
 * A code edit happens client-side. An idle gap is the absence of anything
 * reaching us. A statement revisit is a tab the server never sees. Refusing
 * these would not make the ledger safer, it would make it empty — and the
 * reasoning trace they carry is the whole reason this stream exists. None of
 * them carries a verdict, a failure class or an assistance level, so the worst
 * a forged one achieves is a wrong active-seconds figure.
 *
 * `code_diff_classified` is `browser` here and `server` in the taxonomy's
 * `EVENT_TRUST`, and the divergence is real rather than an oversight: in the
 * system that shipped that constant, the ingest route computed the diff class
 * itself from submitted source. This one does not — the classification arrives
 * already made — so claiming `server` would be this route asserting it did work
 * it did not do.
 *
 * ## The five that do not
 *
 * `judge` for a verdict because a judge produced it, `verifier` for an
 * attribution because the verification engine did, `server` for the three only a
 * server has any business writing. Unattested, every one is dropped, and the
 * attestation is the only door through: `verifyAttestation` had zero production
 * call sites, so the mechanism the whole trust model is written around had never
 * once run outside a test.
 *
 * Note what the door does NOT open. The token is signed with
 * `LEARNING_ATTESTATION_SECRET`, which carries no `NEXT_PUBLIC_` prefix and
 * therefore never reaches a bundle. A browser can only relay one that a server
 * already holding the fact handed it.
 *
 * ## Why the table is total
 *
 * `satisfies Record<LearningEventName, SourceTrust>` — every name, no
 * exceptions. Add a fourteenth event to the taxonomy and this file stops
 * compiling until somebody decides whether a browser may author it. Two partial
 * sets and a lookup would instead have defaulted the new name to "allowed",
 * which is precisely the shape of the defect this route is being fixed for:
 * allowing is what happens when nobody writes the line that forbids.
 */
const INGEST_TRUST = {
  episode_opened: "browser",
  episode_resumed: "browser",
  episode_closed: "browser",
  statement_revisited: "browser",
  code_diff_classified: "browser",
  idle_gap: "browser",
  test_case_authored: "browser",
  run_executed: "browser",
  verdict_received: "judge",
  failure_attributed: "verifier",
  solution_revealed: "server",
  assistance_requested: "server",
  assistance_delivered: "server",
} as const satisfies Record<LearningEventName, SourceTrust>;

/**
 * Why an event did not reach the ledger.
 *
 * Counted per reason rather than as one total, because the four mean completely
 * different things operationally. `unknown_event_name` is a client running
 * ahead of a deploy. `malformed_identifier` is a client bug. `foreign_episode`
 * is a shared device or a copied request. `server_authored_event` is somebody
 * trying to write a verdict by hand, and it is the only one of the four that
 * should never be non-zero.
 */
type RefusalReason =
  | "unknown_event_name"
  | "server_authored_event"
  | "malformed_identifier"
  | "foreign_episode";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `seq` is an `int` column. Beyond this a "position in an episode" is a bug. */
const MAX_SEQ = 1_000_000;

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
    return NextResponse.json({ accepted: 0, inserted: 0, duplicates: 0, rejected: 0 });
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();
  const route = new URL(request.url).pathname;

  const refusals: Record<RefusalReason, number> = {
    unknown_event_name: 0,
    server_authored_event: 0,
    malformed_identifier: 0,
    foreign_episode: 0,
  };

  /* One ownership lookup per DISTINCT episode in the batch, not per event.
     A beacon carrying twenty edits from one attempt asks the same question
     twenty times otherwise, and this runs on the path a class of eighteen hits
     simultaneously when the bell goes. */
  const ownership = new Map<string, boolean>();
  const ownsEpisode = async (episodeId: string): Promise<boolean> => {
    const cached = ownership.get(episodeId);
    if (cached !== undefined) return cached;
    /* `ownedEpisodeId` SUBSTITUTES a fresh id when the episode is somebody
       else's, which is right for submit — a learner's graded answer has to land
       somewhere. It is wrong here: an ingest event is an observation ABOUT an
       episode, and relocating it into a freshly-minted one would fabricate an
       episode that never opened and file a stranger's keystrokes in it. So the
       substitution is read as the refusal it is, and the event is dropped. */
    const owned = (await ownedEpisodeId(subjectId, episodeId)) === episodeId;
    ownership.set(episodeId, owned);
    return owned;
  };

  const rows: LearningEventRow[] = [];

  for (const incomingEvent of incoming) {
    const name = incomingEvent.eventName;
    // Not on the taxonomy: dropped, not coerced. A reducer that switches on a
    // name it has never seen would fall through to a default and quietly
    // change the episode's event_count.
    if (typeof name !== "string" || !isLearningEventName(name)) {
      refusals.unknown_event_name += 1;
      continue;
    }

    const parsed = parseRow(incomingEvent);
    if (!parsed) {
      refusals.malformed_identifier += 1;
      continue;
    }

    if (parsed.episodeId !== null && !(await ownsEpisode(parsed.episodeId))) {
      refusals.foreign_episode += 1;
      continue;
    }

    const sourceTrust: SourceTrust = INGEST_TRUST[name];
    let payload: unknown = incomingEvent.payload;

    if (sourceTrust !== "browser") {
      const statement = attestedStatement(incomingEvent.payload, parsed.episodeId);
      const rewritten = statement && attestedPayload(name, statement, incomingEvent.payload);
      if (!rewritten) {
        refusals.server_authored_event += 1;
        continue;
      }
      payload = rewritten;
    }

    rows.push({
      eventId: parsed.eventId,
      subjectId,
      episodeId: parsed.episodeId,
      sessionId: parsed.sessionId,
      seq: parsed.seq,
      eventName: name,
      occurredAt: parsed.occurredAt,
      // Never from the body. Trust is earned by attestation, not claimed.
      sourceTrust,
      environment: config.environment,
      cohort: "public" as const,
      route,
      payload: sanitizePayload(payload),
    });
  }

  const rejected = Object.values(refusals).reduce((sum, n) => sum + n, 0);
  if (rejected > 0) {
    /* Counts and nothing else: no subject id, no episode id, no payload. See
       the header of `schools/ops/counters.ts` — a log line is the one store
       with no retention function, so anything identifying that lands here
       outlives the consent that put it there. */
    opsLog("ingest.refused", { ...refusals, batch: incoming.length });
  }

  const inserted = await store.appendEvents(rows);

  // After the response. A learner's Check must not wait for reduction.
  after(async () => {
    await maybeSweep(subjectId);
  });

  const res = NextResponse.json({
    accepted: rows.length,
    inserted,
    duplicates: rows.length - inserted,
    /* Reported back so a legitimate client can notice it is sending something
       this route will not keep. A forger learns nothing from it that the
       absence of their event would not already have told them. */
    rejected,
  });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}

interface ParsedRow {
  eventId: string;
  episodeId: string | null;
  sessionId: string;
  seq: number;
  occurredAt: string;
}

/**
 * The identifiers, checked against the COLUMN types rather than against
 * `typeof`.
 *
 * `event_id`, `episode_id` and `session_id` are `uuid`; `occurred_at` is
 * `timestamptz`. A string that is neither used to sail through
 * `typeof x === "string"` and fail in Postgres — 22P02 for the uuids, 22007 for
 * the timestamp — which on the PGlite path surfaces as a 500 on a learner's
 * Check. The row is refused here instead, where refusing costs one event rather
 * than the whole batch.
 *
 * Note the asymmetry on `episodeId`. Absent stays null, because pre-episode
 * events are legal and the column allows it. PRESENT but malformed is a
 * refusal, not a coercion to null: an event that names an episode and cannot be
 * attached to one is a client bug, and quietly detaching it would leave an
 * orphan row nothing will ever fold and nobody will ever notice.
 *
 * `eventId` has the same shape and a second reason behind it. Absent means the
 * client is not using idempotency at all — the current one does not — so a
 * fresh id is minted and nothing is lost. Malformed means the client BELIEVES
 * it is using idempotency and is broken, and substituting an id there would
 * hand it a false guarantee: its retry writes a second row, and attempt counts
 * are what the entire learner state is built from.
 */
function parseRow(event: IncomingEvent): ParsedRow | null {
  const eventId =
    typeof event.eventId === "string" ? (UUID.test(event.eventId) ? event.eventId : null) : randomUUID();
  if (eventId === null) return null;

  const sessionId =
    typeof event.sessionId === "string"
      ? UUID.test(event.sessionId)
        ? event.sessionId
        : null
      : randomUUID();
  if (sessionId === null) return null;

  let episodeId: string | null = null;
  if (event.episodeId !== undefined && event.episodeId !== null) {
    if (typeof event.episodeId !== "string" || !UUID.test(event.episodeId)) return null;
    episodeId = event.episodeId;
  }

  /* The client's clock, and it is allowed to be wrong — `received_at` is ours
     and is what anything ordered for analysis uses. What it is not allowed to
     be is unparseable. */
  let occurredAt = new Date().toISOString();
  if (typeof event.occurredAt === "string") {
    const at = new Date(event.occurredAt);
    if (Number.isNaN(at.getTime())) return null;
    occurredAt = at.toISOString();
  }

  const rawSeq = Number.isFinite(event.seq) ? Number(event.seq) : 0;
  const seq = Math.min(Math.max(Math.trunc(rawSeq), 0), MAX_SEQ);

  return { eventId, episodeId, sessionId, seq, occurredAt };
}

/**
 * The signed statement riding on this event, if it is ours and it is about THIS
 * episode.
 *
 * The episode binding is the part worth spelling out. `signAttestation` sets
 * `request_id` to the episode id, so a token is a statement about one attempt.
 * Without the check a learner who ever held a valid token — say a future route
 * returns one so a client can prove a verdict offline — could replay it onto
 * every subsequent episode for its six-hour lifetime, and each replay would be
 * written at `judge` trust. Binding it costs a string comparison.
 *
 * An event with no episode can never be attested, which is deliberate: an
 * outcome that is not attached to an attempt is not evidence about anything.
 */
function attestedStatement(payload: unknown, episodeId: string | null): AttestedSubmission | null {
  if (episodeId === null) return null;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const token = (payload as Record<string, unknown>)[ATTESTATION_TRANSPORT_KEY];
  const statement = verifyAttestation(token, config.attestationSecret ?? "");
  if (!statement) return null;
  return statement.request_id === episodeId ? statement : null;
}

/**
 * The payload, taken from the SIGNATURE rather than from beside it.
 *
 * Verifying the token and then storing the client's own numbers would be the
 * whole hole reopened one field lower down: possess any valid attestation for
 * your episode and you could staple `verdict: accepted` to it and have the row
 * written at `judge` trust. The signature proves a statement, so the statement
 * is what gets stored, and the client's copy contributes only the context keys
 * `sanitizePayload` will keep anyway.
 *
 * Returns null where the signed statement does not actually support the event —
 * a verdict whose status names no verdict (`running`, `internal_error`), or an
 * attribution event on a token carrying no attribution. Our own signer sets
 * `attribution: null` on every statement it produces, which means a relayed
 * `failure_attributed` is refused today and should be: the submit route writes
 * that event directly, on the server that graded the answer.
 */
function attestedPayload(
  name: LearningEventName,
  statement: AttestedSubmission,
  clientPayload: unknown,
): Record<string, PayloadValue> | null {
  if (name === "verdict_received") {
    const verdict = toLearningVerdict(statement.status);
    if (!verdict) return null;
    return signedFirst(
      {
        verdict,
        ...(statement.tests_passed !== null ? { tests_passed: statement.tests_passed } : {}),
        ...(statement.tests_total !== null ? { tests_total: statement.tests_total } : {}),
        ...(statement.first_failing_test !== null
          ? { failing_test_index: statement.first_failing_test }
          : {}),
        ...(statement.skill_refs[0] ? { skill_id: statement.skill_refs[0] } : {}),
      },
      clientPayload,
    );
  }

  if (name === "failure_attributed") {
    const attribution = statement.attribution;
    if (!attribution) return null;
    return signedFirst(
      {
        failure_class: attribution.failure_class,
        attribution_source: attribution.attribution_source,
        confidence: attribution.confidence,
        attribution_version: attribution.attribution_version,
        ...(attribution.skill_refs[0] ? { skill_id: attribution.skill_refs[0] } : {}),
      },
      clientPayload,
    );
  }

  /* `solution_revealed`, `assistance_requested`, `assistance_delivered`.
     Nothing in the signed statement describes a reveal or a hint rung, so there
     is nothing to overwrite the client's context with — and nothing needs to
     be, because none of the three can be forged into a claim that FLATTERS a
     learner. Each one lowers their recorded independence. They are admitted
     behind an attestation for uniformity rather than because any signer in this
     codebase produces one: our own reveals and hints are written server-side by
     the submit and hint routes, which never travel through a browser. */
  return sanitizePayload(clientPayload);
}

/**
 * The signed facts first, the client's context after — never the other way
 * round, and the order is load-bearing twice over.
 *
 * `sanitizePayload` keeps the first 24 allowlisted keys it meets and silently
 * drops the rest. Spreading the client's copy first would let a payload padded
 * with two dozen legal-but-irrelevant keys push the verdict itself off the end,
 * and what would land in the ledger is a `verdict_received` naming no verdict.
 *
 * And the signed value wins any collision, which is the entire reason the facts
 * are read out of the signature instead of from beside it. Deleting the key
 * from the context rather than relying on spread order says so explicitly: a
 * later reorder of these two lines cannot quietly hand the field back to the
 * browser.
 */
function signedFirst(
  signed: Record<string, PayloadValue>,
  clientPayload: unknown,
): Record<string, PayloadValue> {
  const context = sanitizePayload(clientPayload);
  for (const key of Object.keys(signed)) delete context[key];
  return { ...signed, ...context };
}
