import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifier for statements the backend signed and the browser relayed.
 *
 * The TypeScript twin of `contestiq_api/learning_attestation.py`. Both sides
 * are exercised against the same fixtures, because a format disagreement here
 * fails closed — every event silently downgrades to browser trust and nobody
 * notices until Phase 2 asks why there is no evidence.
 *
 * WHY THIS EXISTS
 * `learning_events` lives in Supabase and is keyed on the Supabase auth uid.
 * The backend issues user ids from its own namespace and cannot write there,
 * so the judge's verdict has to travel through the browser — the one transport
 * we do not trust. Signing the statement rather than trusting the channel is
 * what lets `source_trust` say `judge` honestly.
 *
 * SERVER ONLY. `LEARNING_ATTESTATION_SECRET` has no `NEXT_PUBLIC_` prefix, so
 * if this module is ever pulled into a client bundle the key reads as
 * undefined and every verification fails rather than the key shipping to a
 * browser.
 */

/** Must match ATTESTATION_VERSION in learning_attestation.py. */
export const ATTESTATION_VERSION = 1;
const TTL_SECONDS = 6 * 60 * 60;
/** Tolerance for a backend clock slightly ahead of ours. */
const MAX_FUTURE_SKEW_SECONDS = 300;

export interface AttestedAttribution {
  failure_class: string;
  attribution_source: string;
  confidence: number;
  skill_refs: string[];
  failure_skill_refs: string[];
  evidence: Record<string, unknown>;
  attribution_version: number;
}

export interface AttestedSubmission {
  request_id: string;
  problem_id: string;
  submission_id: string;
  language: string;
  status: string;
  judged: boolean;
  tests_total: number | null;
  tests_passed: number | null;
  first_failing_test: number | null;
  /** Taxonomy skills for the problem. Present on accepted submissions too. */
  skill_refs: string[];
  attribution: AttestedAttribution | null;
}

function fromBase64Url(value: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  } catch {
    return null;
  }
}

export function attestationSecret(): string {
  if (typeof window !== "undefined") return "";
  return process.env.LEARNING_ATTESTATION_SECRET?.trim() ?? "";
}

/**
 * Recover the signed statement, or null if it cannot be trusted.
 *
 * Returns null — never throws and never partially trusts. Every failure mode
 * (no secret configured, malformed token, wrong key, tampered payload, expired,
 * future-dated, wrong version) lands in the same place: the caller treats the
 * event as browser-reported.
 */
export function verifyAttestation(
  token: unknown,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): AttestedSubmission | null {
  if (!secret) return null;
  if (typeof token !== "string" || token.length === 0 || token.length > 8192) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const raw = fromBase64Url(parts[0]);
  const provided = fromBase64Url(parts[1]);
  if (!raw || !provided) return null;

  const expected = createHmac("sha256", secret).update(raw).digest();
  // Length check first: timingSafeEqual throws on a length mismatch, and a
  // thrown error here would be an availability bug on the ingest path.
  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(raw.toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;

  const body = payload as Record<string, unknown>;
  if (body.v !== ATTESTATION_VERSION) return null;

  const issued = body.iat;
  if (typeof issued !== "number" || !Number.isFinite(issued)) return null;
  if (nowSeconds - issued > TTL_SECONDS) return null;
  if (issued - nowSeconds > MAX_FUTURE_SKEW_SECONDS) return null;

  if (typeof body.request_id !== "string" || typeof body.problem_id !== "string") return null;

  return {
    request_id: body.request_id,
    problem_id: body.problem_id,
    submission_id: typeof body.submission_id === "string" ? body.submission_id : "",
    language: typeof body.language === "string" ? body.language : "",
    status: typeof body.status === "string" ? body.status : "",
    judged: body.judged === true,
    tests_total: asCount(body.tests_total),
    tests_passed: asCount(body.tests_passed),
    first_failing_test: asCount(body.first_failing_test),
    // Optional: attestations signed before this field existed simply lack it,
    // and an empty list is the honest reading of "we were not told".
    skill_refs: asStringList(body.skill_refs),
    attribution: asAttribution(body.attribution),
  };
}

function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

function asAttribution(value: unknown): AttestedAttribution | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.failure_class !== "string" || !row.failure_class) return null;

  const source = row.attribution_source;
  // Only these two origins exist. Anything else means the signed payload was
  // produced by a version we do not understand, and guessing is not an option
  // for the field that decides `source_trust`.
  if (source !== "judge" && source !== "verifier") return null;

  const confidence =
    typeof row.confidence === "number" && Number.isFinite(row.confidence)
      ? Math.min(1, Math.max(0, row.confidence))
      : 0;

  return {
    failure_class: row.failure_class.slice(0, 64),
    attribution_source: source,
    confidence,
    skill_refs: asStringList(row.skill_refs),
    failure_skill_refs: asStringList(row.failure_skill_refs),
    evidence: asEvidence(row.evidence),
    attribution_version:
      typeof row.attribution_version === "number" ? row.attribution_version : 0,
  };
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.length > 0)
    .slice(0, 12)
    .map((item) => item.slice(0, 64));
}

/**
 * Evidence is bounded rather than trusted wholesale.
 *
 * It is signed, so it is ours — but it is also the one free-shaped field in the
 * payload, and it ends up in a jsonb column. Scalars only, capped in count and
 * length, so a future backend change cannot accidentally put a test case in
 * there.
 */
function asEvidence(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string | number | boolean> = {};
  let count = 0;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (count >= 12) break;
    if (key.length > 48) continue;
    if (typeof item === "boolean" || typeof item === "number") {
      if (typeof item === "number" && !Number.isFinite(item)) continue;
      out[key] = item;
    } else if (typeof item === "string") {
      out[key] = item.slice(0, 160);
    } else {
      continue;
    }
    count += 1;
  }
  return out;
}
