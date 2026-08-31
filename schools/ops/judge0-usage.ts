import "server-only";
import { bump, opsLog } from "./counters";
import { recordProviderQuota } from "./provider-quota";

/**
 * One line at the metered judge's HTTP boundary.
 *
 * ## Why this function exists rather than four `bump()` calls
 *
 * Because the four numbers have to agree. `judge0.requests` is the billable
 * total and `judge0.submissions + judge0.polls + judge0.language_lookups` is
 * supposed to be that same total, broken down. Two call sites incrementing the
 * total and the breakdown separately is how those quietly stop adding up, and a
 * cost figure that does not reconcile is a cost figure nobody trusts by
 * November. So the provider says WHAT it just did, once, and the accounting
 * happens here.
 *
 * The same call carries the response headers, because the only place a quota
 * header can be read is the response it arrived on, and a second hook for that
 * would be a second thing to forget.
 *
 * ## Where it belongs
 *
 * At the ONE place in `schools/exec/providers/judge0.ts` where a request
 * actually leaves — `httpJson` — and nowhere else. Counting at the call sites
 * above it (submit, poll, discovery) would miss retries, which are exactly the
 * requests that make a bill surprising.
 *
 * ## What crosses this boundary
 *
 * A kind, a numeric HTTP status, and a headers object that is read for three
 * integers and dropped. Nothing else may be passed and nothing else is
 * recorded: no URL, no token, no source, no stdin, no stdout, no body, no
 * header value outside the quota allowlist, no key or any part of one, no
 * learner. See `provider-quota.ts` for the refusal list in full.
 */
export type Judge0RequestKind =
  /** `POST /submissions` (or one entry of a batch) — a program being run. */
  | "submission"
  /** `GET /submissions/{token}` — waiting for an answer. */
  | "poll"
  /** `GET /languages` — discovery, which should happen once per process. */
  | "language_lookup";

export interface Judge0RequestOutcome {
  kind: Judge0RequestKind;
  /**
   * The status the judge replied with, or `null` when there never was one —
   * our fetch aborted, the connection failed, the deadline passed.
   *
   * `null` is a failure and is counted as one. It is deliberately not folded
   * into a fake 5xx: "the judge answered 502" and "the judge did not answer"
   * are different afternoons.
   */
  httpStatus: number | null;
  /**
   * The response's headers, read only for the quota allowlist and then dropped.
   * Absent when there was no response.
   */
  headers?: { get(name: string): string | null } | null;
}

const KIND_COUNTER = {
  submission: "judge0.submissions",
  poll: "judge0.polls",
  language_lookup: "judge0.language_lookups",
} as const;

/**
 * Record one request to the metered judge. Never throws, never awaits.
 *
 * It must not throw: this runs on the path that is already failing, and an
 * accounting bug that turns a 429 into a 500 would take the lesson down to
 * protect a counter.
 */
export function recordJudge0Request(outcome: Judge0RequestOutcome): void {
  try {
    bump("judge0.requests");
    bump(KIND_COUNTER[outcome.kind]);
    recordProviderQuota(outcome.headers);

    const { httpStatus } = outcome;
    if (httpStatus === 429) {
      /* Its own counter, for the same reason `provider_rate_limited` is its own
         `ExecutionStatus`: over quota self-heals and wants a different action
         from a dead judge. Nothing about the learner is recorded — the
         submission is abandoned — so without this number an over-quota
         afternoon is invisible everywhere. */
      bump("judge0.rate_limited");
      opsLog("judge0.rate_limited", { kind: outcome.kind });
      return;
    }
    if (httpStatus === null || httpStatus >= 400) {
      bump("judge0.failures");
      /* The kind and the number, and that is the whole line. A RapidAPI error
         body can name the plan, the subscription and occasionally a key prefix,
         and a log is the one store with no retention function and no erasure
         path — so the body is not read here and cannot be. */
      opsLog("judge0.request_failed", {
        kind: outcome.kind,
        http: httpStatus === null ? "no_response" : httpStatus,
      });
    }
  } catch {
    /* Counting is best-effort by construction. See above. */
  }
}
