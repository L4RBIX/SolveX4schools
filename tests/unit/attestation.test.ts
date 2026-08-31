import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { ATTESTATION_VERSION, verifyAttestation } from "../../packages/learning-contracts/src/attestation";

/**
 * The verifier is the trust boundary of the whole Phase 2 integration.
 *
 * If it accepts something it should not, a learner can write the reason they
 * failed. If it rejects something it should not, every event silently
 * downgrades to browser trust and nobody notices for weeks. Both directions are
 * tested here, plus the format agreement with
 * `contestiq_api/learning_attestation.py` — a mismatch there fails closed, which
 * is safe but invisible.
 */

const SECRET = "test-attestation-secret";

function b64url(raw: Buffer | string): string {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Canonical JSON, matching `json.dumps(..., sort_keys=True, separators=(",", ":"))`.
 *
 * Sorting has to be recursive. An earlier version of this helper used
 * `JSON.stringify(body, Object.keys(body).sort())`, which is a *replacer array*
 * — it filters keys at every level, so the nested attribution came out empty and
 * the test failed against a verifier that was working correctly.
 */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}

/** Reimplements the Python signer, so the two formats are pinned together. */
function sign(payload: Record<string, unknown>, secret = SECRET): string {
  const body = { ...payload, v: ATTESTATION_VERSION, iat: Math.floor(Date.now() / 1000) };
  const encoded = canonical(body);
  const mac = createHmac("sha256", secret).update(encoded).digest();
  return `${b64url(encoded)}.${b64url(mac)}`;
}

function submission(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    request_id: "req-1",
    problem_id: "1234A",
    submission_id: "sub-1",
    language: "cpp17",
    status: "time_limit",
    judged: true,
    tests_total: 12,
    tests_passed: 4,
    first_failing_test: 5,
    attribution: {
      failure_class: "complexity_asymptotic",
      attribution_source: "verifier",
      confidence: 0.9,
      skill_refs: ["binary_search"],
      failure_skill_refs: ["failure_mode.complexity_analysis"],
      evidence: { runtime_gate_status: "passed" },
      attribution_version: 1,
    },
    ...overrides,
  };
}

describe("verifyAttestation", () => {
  it("recovers a correctly signed statement", () => {
    const result = verifyAttestation(sign(submission()), SECRET);
    expect(result?.request_id).toBe("req-1");
    expect(result?.tests_passed).toBe(4);
    expect(result?.attribution?.failure_class).toBe("complexity_asymptotic");
    expect(result?.attribution?.attribution_source).toBe("verifier");
  });

  it("rejects a statement signed with a different key", () => {
    expect(verifyAttestation(sign(submission(), "not-the-secret"), SECRET)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    // The exact attack this exists to stop: rewrite the verdict, keep the mac.
    const token = sign(submission());
    const [, signature] = token.split(".");
    const forged = b64url(canonical({ ...submission(), tests_passed: 12 }));
    expect(verifyAttestation(`${forged}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects everything when no secret is configured", () => {
    // Fails closed: an unconfigured deployment records browser trust rather
    // than accepting unsigned claims.
    expect(verifyAttestation(sign(submission()), "")).toBeNull();
  });

  it("rejects an expired statement", () => {
    const token = sign(submission());
    const wayLater = Math.floor(Date.now() / 1000) + 7 * 60 * 60;
    expect(verifyAttestation(token, SECRET, wayLater)).toBeNull();
  });

  it("rejects a statement dated in the future beyond clock skew", () => {
    const token = sign(submission());
    const wayEarlier = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyAttestation(token, SECRET, wayEarlier)).toBeNull();
  });

  it("rejects an unknown version rather than reinterpreting it", () => {
    const body = { ...submission(), v: 99, iat: Math.floor(Date.now() / 1000) };
    const encoded = canonical(body);
    const mac = createHmac("sha256", SECRET).update(encoded).digest();
    expect(verifyAttestation(`${b64url(encoded)}.${b64url(mac)}`, SECRET)).toBeNull();
  });

  it("never throws on malformed input", () => {
    for (const bad of ["", "nodot", "a.b.c", "!!!.???", ".", null, 42, {}, undefined]) {
      expect(() => verifyAttestation(bad, SECRET)).not.toThrow();
      expect(verifyAttestation(bad, SECRET)).toBeNull();
    }
  });

  it("rejects an attribution whose source is not a known origin", () => {
    // `attribution_source` decides `source_trust`. A value we do not recognise
    // means a payload from a version we do not understand, and guessing is not
    // an option for that field.
    const result = verifyAttestation(
      sign(submission({ attribution: { ...(submission().attribution as object), attribution_source: "browser" } })),
      SECRET
    );
    expect(result).not.toBeNull();
    expect(result?.attribution).toBeNull();
  });

  it("bounds the evidence object rather than trusting it wholesale", () => {
    const huge: Record<string, unknown> = {};
    for (let i = 0; i < 40; i += 1) huge[`k${i}`] = "x".repeat(500);
    huge.nested = { should: "be dropped" };

    const result = verifyAttestation(
      sign(submission({ attribution: { ...(submission().attribution as object), evidence: huge } })),
      SECRET
    );
    const evidence = result?.attribution?.evidence ?? {};
    expect(Object.keys(evidence).length).toBeLessThanOrEqual(12);
    expect(evidence.nested).toBeUndefined();
    for (const value of Object.values(evidence)) {
      expect(String(value).length).toBeLessThanOrEqual(160);
    }
  });

  it("carries a null attribution for an accepted submission", () => {
    const result = verifyAttestation(
      sign(submission({ status: "accepted", attribution: null })),
      SECRET
    );
    expect(result?.attribution).toBeNull();
  });
});

describe("cross-language format agreement", () => {
  /**
   * Produced by `contestiq_api.learning_attestation.sign_attestation` with a
   * pinned `iat`, then pasted here.
   *
   * This is the test that actually matters. The two implementations fail
   * CLOSED on disagreement — a format drift makes every verification return
   * null, the whole stream quietly falls back to browser trust, and nothing
   * errors. Without a fixture from the real signer, both sides can be
   * self-consistently wrong.
   */
  const PYTHON_TOKEN =
    "eyJhdHRyaWJ1dGlvbiI6eyJhdHRyaWJ1dGlvbl9zb3VyY2UiOiJ2ZXJpZmllciIsImF0dHJpYnV0aW9uX3ZlcnNpb24iOjEsImNvbmZpZGVuY2UiOjAuOSwiZXZpZGVuY2UiOnsicnVudGltZV9nYXRlX3N0YXR1cyI6InBhc3NlZCJ9LCJmYWlsdXJlX2NsYXNzIjoiY29tcGxleGl0eV9hc3ltcHRvdGljIiwiZmFpbHVyZV9za2lsbF9yZWZzIjpbImZhaWx1cmVfbW9kZS5jb21wbGV4aXR5X2FuYWx5c2lzIl0sInNraWxsX3JlZnMiOlsiYmluYXJ5X3NlYXJjaCJdfSwiZmlyc3RfZmFpbGluZ190ZXN0Ijo1LCJpYXQiOjE3NTYwMDAwMDAsImp1ZGdlZCI6dHJ1ZSwibGFuZ3VhZ2UiOiJjcHAxNyIsInByb2JsZW1faWQiOiIxMjM0QSIsInJlcXVlc3RfaWQiOiJyZXEtY3Jvc3MiLCJzdGF0dXMiOiJ0aW1lX2xpbWl0Iiwic3VibWlzc2lvbl9pZCI6InN1Yi1jcm9zcyIsInRlc3RzX3Bhc3NlZCI6NCwidGVzdHNfdG90YWwiOjEyLCJ2IjoxfQ.i2bsc16MHS7Imdqw2Dy3kHPdfj0yuVdneD45HLGhMgg";
  const PYTHON_SECRET = "cross-language-secret";
  const PYTHON_IAT = 1756000000;

  it("verifies a token produced by the Python signer", () => {
    const result = verifyAttestation(PYTHON_TOKEN, PYTHON_SECRET, PYTHON_IAT);
    expect(result).not.toBeNull();
    expect(result?.request_id).toBe("req-cross");
    expect(result?.status).toBe("time_limit");
    expect(result?.tests_passed).toBe(4);
    expect(result?.first_failing_test).toBe(5);
    expect(result?.attribution?.failure_class).toBe("complexity_asymptotic");
    expect(result?.attribution?.attribution_source).toBe("verifier");
    expect(result?.attribution?.confidence).toBeCloseTo(0.9);
    expect(result?.attribution?.failure_skill_refs).toContain(
      "failure_mode.complexity_analysis"
    );
  });

  it("rejects the Python token under the wrong key", () => {
    expect(verifyAttestation(PYTHON_TOKEN, "wrong", PYTHON_IAT)).toBeNull();
  });
});
