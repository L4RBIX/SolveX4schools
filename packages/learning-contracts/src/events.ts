/**
 * SolveX learning-stream event taxonomy.
 *
 * This is NOT beta analytics. `src/lib/analytics/` answers product questions —
 * did the funnel convert, is p95 submit latency acceptable — and its 24-key
 * prop allowlist is a privacy guarantee worth keeping intact. This stream
 * answers a different question: what was the learner actually doing?
 *
 * The admission rule, applied to every event below:
 *
 *   An event is admissible only if you can name the decision it changes.
 *   "It would be interesting to know" is not a decision. `button_clicked`
 *   does not appear in this file and never will.
 *
 * Imported by BOTH the browser and the ingest route, so the allowlists here
 * are the single source of truth. The server re-validates everything, because
 * a browser is not trusted to police itself.
 *
 * See docs/LEARNING_INTELLIGENCE.md §2 for the full rationale.
 */

// ─── Event names ─────────────────────────────────────────────────────────────

export const LEARNING_EVENTS = [
  // Lifecycle. `episode_opened` anchors everything that follows; without it a
  // later event cannot be attributed to a task attempt.
  "episode_opened",
  "episode_resumed",
  "episode_closed",

  // Comprehension. A statement revisit after a failing verdict reclassifies
  // that failure as a reading problem rather than an algorithmic one, which
  // is a distinction no verdict can make on its own.
  "statement_revisited",

  // Authoring — the reasoning trace. These four are the reason this stream
  // exists; everything else is context for them.
  "code_diff_classified",
  "idle_gap",
  "test_case_authored",

  // Execution and outcome.
  "run_executed",
  "verdict_received",
  // Why the submission failed, from the verification engine. The only event in
  // the taxonomy a browser cannot create: ingest drops it outright unless it
  // arrives with a valid backend signature. See attestation.ts.
  "failure_attributed",
  "solution_revealed",

  // Assistance. Paired: `requested` carries the state before we intervened,
  // `delivered` carries what we actually said.
  "assistance_requested",
  "assistance_delivered",
] as const;

export type LearningEventName = (typeof LEARNING_EVENTS)[number];

const EVENT_SET: ReadonlySet<string> = new Set(LEARNING_EVENTS);

export function isLearningEventName(value: unknown): value is LearningEventName {
  return typeof value === "string" && EVENT_SET.has(value);
}

/** Bump when the meaning of an existing event's payload changes. */
export const LEARNING_EVENT_VERSION = 1;

// ─── Trust ───────────────────────────────────────────────────────────────────

export type SourceTrust = "server" | "judge" | "verifier" | "browser";

/**
 * What the stored row is allowed to claim about where each event came from.
 *
 * Phase 1 is honest about a limitation: almost everything is reported by the
 * browser, because that is where the Arena runs. Only `code_diff_classified`
 * is marked `server`, and only because the *classification* is computed by the
 * ingest route from the submitted source — the fact that an edit happened is
 * still the browser's word.
 *
 * This matters for Phase 2, not Phase 1: there is no skill model yet, so
 * nothing can be inflated. When one arrives, its rule is that `browser` rows
 * may add colour and may lower confidence, but may never raise a belief. The
 * verdict events move behind the judge before that rule can bite.
 */
export const EVENT_TRUST: Record<LearningEventName, SourceTrust> = {
  episode_opened: "browser",
  episode_resumed: "browser",
  episode_closed: "browser",
  statement_revisited: "browser",
  code_diff_classified: "server",
  idle_gap: "browser",
  test_case_authored: "browser",
  run_executed: "browser",
  // Upgraded to `judge` by the ingest route when a valid attestation
  // accompanies it; `browser` is what an unsigned relay is worth.
  verdict_received: "browser",
  // Never downgraded, because an unsigned one is never stored at all.
  failure_attributed: "verifier",
  solution_revealed: "browser",
  assistance_requested: "server",
  assistance_delivered: "server",
};

/**
 * Which events a BROWSER is allowed to create.
 *
 * ## The hole this closes
 *
 * `/api/learning/events` documented itself as refusing "the OUTCOME events,
 * entirely" and did not: its only filter was `isLearningEventName`, so any
 * signed-in learner could POST
 *
 *     {"eventName":"verdict_received",
 *      "payload":{"verdict":"accepted","task_ref":"block:m1.p3"}}
 *
 * and have it stored. It landed with `source_trust: 'browser'` — correctly
 * stamped, and stamping is only a defence if something downstream reads it.
 * Nothing did: `blockEvidence` and `solveEvidence` both counted
 * `verdict_received … = 'accepted'` with no trust predicate, so a forged row
 * was indistinguishable from a judge verdict in the teacher's console and in
 * the programme's independence evidence.
 *
 * ## Why the list is derived rather than typed out
 *
 * `EVENT_TRUST` already declares who may author each event. A second
 * hand-written list would be a second opinion, and the two would drift the
 * first time an event was added. So the rule is mechanical: **a browser may
 * report only what `EVENT_TRUST` already says is worth browser trust.**
 *
 * `verdict_received` is then excluded explicitly, and it is the one case worth
 * arguing. Its trust entry says `browser`, on the theory that ingest would
 * upgrade it to `judge` on a valid attestation. No such upgrade was ever
 * implemented, and meanwhile the real writer appeared elsewhere: the submit
 * route appends the verdict itself, server-side, stamped `judge`. So there is
 * no longer any legitimate reason for a verdict to arrive from a browser at
 * all, and the honest ingest rule is to refuse it.
 */
export const CLIENT_REPORTABLE_EVENTS: ReadonlySet<LearningEventName> = new Set(
  LEARNING_EVENTS.filter(
    (name) => EVENT_TRUST[name] === "browser" && name !== "verdict_received",
  ),
);

/**
 * May this event arrive in a request body from a learner's browser?
 *
 * The ingest route's whole authority question in one call. Everything it
 * refuses has a server-side writer that is the real source.
 */
export function isClientReportable(name: LearningEventName): boolean {
  return CLIENT_REPORTABLE_EVENTS.has(name);
}

// ─── Payload allowlist ───────────────────────────────────────────────────────
//
// A single global allowlist rather than a per-event one, for the same reason
// beta analytics uses one: the privacy guarantee should be a short list anyone
// can audit in one sitting. These keys are the ONLY things that can ever be
// written to learning_events.payload. Everything else is dropped server-side.
//
// Deliberately absent, and dropped even if a future call site sends them:
// source code (see CODE_TRANSPORT_KEY below), Codeforces handle, email,
// stdout/stderr, custom test input text, auth tokens, AI chat prose, opponent
// identity, raw query strings.

export const ALLOWED_PAYLOAD_KEYS = [
  // Task context
  "task_ref",            // 'cf:1234A' — public catalog id
  "task_kind",
  "entry_source",
  "language",

  // Lifecycle
  "close_reason",
  "gap_seconds",
  "resume_count",

  // Authoring
  "diff_class",
  "lines_added",
  "lines_removed",
  "edit_distance_bucket",
  "since_verdict",       // verdict this edit is responding to
  "blob_hash",           // content address; never content
  "prev_blob_hash",
  "seconds_bucket",
  "followed_by",

  // Self-authored tests
  "derived_from",
  "input_size_class",
  "targets_edge",

  // Execution
  "case_count",
  "passed_count",
  "failed_count",
  "first_failing_case",
  "is_custom_input",

  // Verdict
  "verdict",
  "failing_test_index",
  "tests_passed",
  "tests_total",
  "runtime_ms",
  "memory_kb",
  "progression_delta",   // this attempt's tests_passed minus the previous

  // Comprehension
  "is_revisit",
  "revisit_after",

  // Assistance
  "intervention_id",
  "level",
  "requested_level",
  "granted_level",
  "trigger",
  "mode",
  "evidence_type",
  "contains_code",
  "content_len",

  // Reveal
  "reveal_scope",

  // Failure attribution. Every one of these is written from a signed backend
  // statement, never from what the client sent — see the ingest route.
  "failure_class",
  "attribution_source",
  "confidence",
  "attribution_version",
  "attribution_reason",
  "submission_id",

  // The problem's primary taxonomy skill, written from the signed attestation.
  // Without it, learner-level aggregation can only be keyed by task: the
  // task -> skill map lives in the backend's SQLite and the ingest route cannot
  // reach it. A scalar rather than a list, because payload values are scalars
  // and the primary skill is what an aggregate keys on.
  "skill_id",
] as const;

export type AllowedPayloadKey = (typeof ALLOWED_PAYLOAD_KEYS)[number];

const PAYLOAD_KEY_SET: ReadonlySet<string> = new Set(ALLOWED_PAYLOAD_KEYS);

/** Scalars only. An object or an array could smuggle a payload past review. */
export type PayloadValue = string | number | boolean;
export type LearningPayload = Partial<Record<AllowedPayloadKey, PayloadValue>>;

/**
 * The one key that may carry source code in transit and must never be stored.
 *
 * The ingest route extracts it, hashes it, writes the text to `code_blobs`
 * under retention, and puts only `blob_hash` in the payload. `sanitizePayload`
 * drops it unconditionally, so a route that forgets to extract it stores
 * nothing rather than leaking a file into a jsonb column.
 */
export const CODE_TRANSPORT_KEY = "__code" as const;

/**
 * The signed backend statement, carried in transit and never stored as sent.
 *
 * The ingest route verifies it, takes the verdict and attribution facts FROM
 * it rather than from the client's payload, and drops the key. A client that
 * omits it gets a browser-trusted verdict; a client that forges it gets
 * nothing.
 */
export const ATTESTATION_TRANSPORT_KEY = "__attestation" as const;

const MAX_PAYLOAD_STRING = 96;
const MAX_PAYLOAD_KEYS = 24;

/**
 * Above this, a duration is not a measurement.
 *
 * Beta analytics learned this the hard way: production recorded a 5.4-hour
 * `duration_ms` from a backgrounded tab whose request stalled until the user
 * came back. The same failure applies to `gap_seconds` here — a laptop lid
 * closed overnight produces an honest number that describes suspension, not
 * thinking. Dropped rather than clamped, because a clamped value reads as a
 * genuine gap. The episode reducer applies its own idle ceiling on top.
 */
const MAX_PLAUSIBLE_GAP_SECONDS = 60 * 60;

/**
 * Drop everything not on the allowlist and clamp what survives.
 *
 * Runs on the client, so a bad value never leaves the browser, and again on
 * the server, so a forged request cannot bypass it.
 */
export function sanitizePayload(input: unknown): Record<string, PayloadValue> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, PayloadValue> = {};
  let count = 0;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (count >= MAX_PAYLOAD_KEYS) break;
    // Drops CODE_TRANSPORT_KEY and ATTESTATION_TRANSPORT_KEY along with
    // everything else off the list: neither is a payload field, and a route
    // that forgot to extract one stores nothing rather than leaking it.
    if (!PAYLOAD_KEY_SET.has(key)) continue;

    if (typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      if (key === "gap_seconds" && (value < 0 || value > MAX_PLAUSIBLE_GAP_SECONDS)) continue;
      out[key] = Math.round(value * 1000) / 1000;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      out[key] = trimmed.slice(0, MAX_PAYLOAD_STRING);
    } else {
      continue; // null, undefined, objects, arrays, functions
    }
    count += 1;
  }
  return out;
}

// ─── Vocabularies ────────────────────────────────────────────────────────────

/**
 * How an edit relates to the one before it. The core reasoning signal: the
 * same verdict followed by a `constant_tweak` and by a `structural` rewrite
 * describes two completely different learners.
 */
export const DIFF_CLASSES = [
  "cosmetic",        // whitespace, comments, renames — not evidence
  "constant_tweak",  // one literal or comparison changed — guessing at a boundary
  "local_fix",       // <= 3 lines inside one existing block
  "extension",       // new block or function, existing structure intact
  "authored",        // boilerplate became a real solution — first authorship
  "structural",      // control flow of REAL code replaced — the model was abandoned
  "reset",           // back to boilerplate or emptied
  "unknown",         // classifier had no previous blob to compare against
] as const;
//
// `authored` was added after the twenty internal replays (see
// docs/LEARNING_REPLAY_FINDINGS.md). Without it, 18 of 20 episodes reported
// `structural` as their second edit — because writing your first solution over
// the starter template looks structurally identical to throwing away a working
// approach. One of those is the most informative event in an episode and the
// other happens every single time, and collapsing them made the class useless
// for the one question it exists to answer.

export type DiffClass = (typeof DIFF_CLASSES)[number];

export function isDiffClass(value: unknown): value is DiffClass {
  return typeof value === "string" && (DIFF_CLASSES as readonly string[]).includes(value);
}

export const CLOSE_REASONS = [
  "accepted",
  "abandoned",
  "navigated",
  "expired",
  "solution_revealed",
] as const;

export type CloseReason = (typeof CLOSE_REASONS)[number];

/**
 * What the learner did after an idle gap. The gap alone means nothing; the
 * gap plus the next action means everything — a pause followed by a structural
 * rewrite is insight, a pause followed by nothing is stuck.
 */
export const IDLE_FOLLOWED_BY = [
  "structural",
  "local",
  "hint",
  "statement",
  "run",
  "nothing",
  "close",
] as const;

export type IdleFollowedBy = (typeof IDLE_FOLLOWED_BY)[number];

/** Which boundary a self-authored test is probing. */
export const TARGETS_EDGE = [
  "empty",
  "min",
  "max",
  "duplicate",
  "negative",
  "none",
] as const;

export type TargetsEdge = (typeof TARGETS_EDGE)[number];

// ─── Buckets ─────────────────────────────────────────────────────────────────
//
// Raw values are avoided for the same reason beta analytics avoids them: in a
// 20-person beta an exact number is close to a fingerprint, and the coarse
// bucket answers the same question.

export type EditDistanceBucket = "1" | "2-10" | "11-50" | "51-200" | "200+";

export function editDistanceBucket(distance: number): EditDistanceBucket {
  if (!Number.isFinite(distance) || distance <= 1) return "1";
  if (distance <= 10) return "2-10";
  if (distance <= 50) return "11-50";
  if (distance <= 200) return "51-200";
  return "200+";
}

export type SecondsBucket = "<30s" | "30-60s" | "1-2m" | "2-5m" | "5-10m" | "10m+";

export function secondsBucket(seconds: number): SecondsBucket {
  if (!Number.isFinite(seconds) || seconds < 30) return "<30s";
  if (seconds < 60) return "30-60s";
  if (seconds < 120) return "1-2m";
  if (seconds < 300) return "2-5m";
  if (seconds < 600) return "5-10m";
  return "10m+";
}

export type InputSizeClass = "empty" | "tiny" | "small" | "medium" | "large";

export function inputSizeClass(length: number): InputSizeClass {
  if (!Number.isFinite(length) || length <= 0) return "empty";
  if (length <= 16) return "tiny";
  if (length <= 128) return "small";
  if (length <= 2048) return "medium";
  return "large";
}

// ─── Verdicts ────────────────────────────────────────────────────────────────
//
// The same distinction beta analytics rests on, restated because it is the
// failure that silently turns "solve rate" into "uptime": a Wrong Answer is
// the product working and the learner being wrong; a Judge0 timeout is the
// product failing. `toLearningVerdict` returns null for the second kind, and
// a null verdict is never recorded as a learning outcome.

export const LEARNING_VERDICTS = [
  "accepted",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "time_limit_exceeded",
  "memory_limit_exceeded",
  "other",
] as const;

export type LearningVerdict = (typeof LEARNING_VERDICTS)[number];

export function isLearningVerdict(value: unknown): value is LearningVerdict {
  return typeof value === "string" && (LEARNING_VERDICTS as readonly string[]).includes(value);
}

export function toLearningVerdict(status: string | null | undefined): LearningVerdict | null {
  const normalized = (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return null;

  if (normalized === "accepted" || normalized === "ok") return "accepted";
  if (normalized.includes("wrong_answer")) return "wrong_answer";
  if (normalized.includes("compil")) return "compile_error";
  if (normalized.includes("runtime")) return "runtime_error";
  if (normalized.includes("time_limit") || normalized === "tle") return "time_limit_exceeded";
  if (normalized.includes("memory_limit") || normalized === "mle") return "memory_limit_exceeded";

  if (
    normalized === "error" ||
    normalized === "not_run" ||
    normalized === "running" ||
    normalized === "no_tests" ||
    normalized.includes("internal") ||
    normalized.includes("unavailable") ||
    normalized.includes("timeout") ||
    normalized.includes("queue") ||
    normalized.includes("pending") ||
    normalized.includes("processing")
  ) {
    return null;
  }

  return "other";
}

// ─── Failure attribution ─────────────────────────────────────────────────────
//
// Mirrors `contestiq_api/practice_packs/attribution.py`. Listed here so the
// replay UI and any future consumer can be exhaustive over the set, and so a
// backend that starts emitting an unknown class is visible rather than silently
// rendered as a blank label.

export const FAILURE_CLASSES = [
  "compile_error",
  "runtime_error",
  "memory_limit",
  "complexity_asymptotic",
  "edge_case_handling",
  "unattributed_failure",
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];

export function isFailureClass(value: unknown): value is FailureClass {
  return typeof value === "string" && (FAILURE_CLASSES as readonly string[]).includes(value);
}
