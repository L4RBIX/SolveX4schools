import { createHmac } from "node:crypto";
import { ATTESTATION_VERSION } from "@solvex/learning-contracts";
import { problemId, type SchoolTaskRef } from "./taskRef";
import type { SandboxStatus } from "./verdict";

/**
 * Server-side attestation signer.
 *
 * The import ships a verifier (`verifyAttestation`) but no TypeScript signer —
 * the signing side lives in `learning_attestation.py`, for a Python backend
 * this product does not have. This is that signer, written against the
 * verifier's exact expectations rather than against the Python source, so the
 * two are checked by round-tripping in `tests/school-attestation.test.ts`.
 *
 * ## Why signing at all
 *
 * The sandbox result has to reach the event store through the browser, which
 * is the one transport we do not trust. Signing the statement is what lets a
 * verdict be recorded as judge-trusted instead of browser-reported. Without it
 * every verdict silently downgrades and the evidence base is worthless.
 *
 * ## SERVER ONLY
 *
 * `LEARNING_ATTESTATION_SECRET` carries no `NEXT_PUBLIC_` prefix. If this
 * module is ever pulled into a client bundle the secret reads as undefined and
 * `signAttestation` throws at call time rather than shipping a key to a
 * browser. Never import this from a client component.
 */

export interface SchoolSubmissionFacts {
  requestId: string;
  task: SchoolTaskRef;
  submissionId: string;
  language: string;
  status: SandboxStatus;
  judged: boolean;
  testsTotal: number | null;
  testsPassed: number | null;
  firstFailingTest: number | null;
  /** Curriculum skills the block declares. Written into the signed statement. */
  skillRefs: string[];
}

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Fail at boot, not at the first submission.
 *
 * A missing secret makes `verifyAttestation` return `null`, which is
 * indistinguishable from a forged token — so a misconfigured deployment looks
 * exactly like an attack and silently records every verdict as browser-trusted.
 * Call this from server startup.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Validate a secret, wherever it came from.
 *
 * Called by `signAttestation` on every call, not only when the secret is taken
 * from the environment. An explicitly-passed weak key would otherwise sign
 * perfectly valid-looking statements — the verifier checks the HMAC, not the
 * key's strength, so nothing downstream would ever notice.
 */
function requireStrongSecret(secret: string, origin: string): string {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error(
      `${origin} is empty. Without it every judge verdict silently downgrades ` +
        "to browser trust and the evidence base is worthless. Refusing to sign.",
    );
  }
  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${origin} is shorter than ${MIN_SECRET_LENGTH} characters. Use a random ` +
        "256-bit value; the signer and verifier must hold the same one.",
    );
  }
  return trimmed;
}

export function assertAttestationSecret(): string {
  if (typeof window !== "undefined") {
    throw new Error("assertAttestationSecret called in a browser context");
  }
  return requireStrongSecret(
    process.env.LEARNING_ATTESTATION_SECRET ?? "",
    "LEARNING_ATTESTATION_SECRET",
  );
}

export function signAttestation(
  facts: SchoolSubmissionFacts,
  secret: string = assertAttestationSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000),
): string {
  const body = {
    v: ATTESTATION_VERSION,
    iat: nowSeconds,
    request_id: facts.requestId,
    // Required by the verifier — a statement without it is rejected outright.
    problem_id: problemId(facts.task),
    submission_id: facts.submissionId,
    language: facts.language,
    status: facts.status,
    judged: facts.judged,
    tests_total: facts.testsTotal,
    tests_passed: facts.testsPassed,
    first_failing_test: facts.firstFailingTest,
    skill_refs: facts.skillRefs,
    attribution: null,
  };

  const key = requireStrongSecret(secret, "attestation secret");
  const raw = Buffer.from(JSON.stringify(body), "utf8");
  const mac = createHmac("sha256", key).update(raw).digest();
  return `${toBase64Url(raw)}.${toBase64Url(mac)}`;
}
