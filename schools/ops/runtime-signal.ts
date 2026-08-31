/**
 * The only thing a learner's browser is allowed to say about local execution.
 *
 * ## The question this exists to answer, and the one it refuses to answer
 *
 * An operator needs to know one thing about the browser half of hybrid
 * execution: **can learners actually run code, or is Pyodide failing to load
 * across the school?** A 13 MB WASM download over a school link is the single
 * most likely thing to break, it breaks silently, and it breaks in a place no
 * server log can see. Nothing else about a local run is anybody's business.
 *
 * So this contract carries a boot OUTCOME and, when it failed, one word from a
 * closed list saying which way. It cannot carry source code, stdout, stderr, an
 * error message, a stack, a URL, a block id, a lesson id, a subject id, a
 * timing, or a free string of any kind — not because a reviewer would object,
 * but because there is no field of that shape and `parseLocalRuntimeSignal`
 * discards anything that is not exactly this.
 *
 * That is deliberate over-restriction. A `message: string` field would be
 * genuinely useful for debugging and would also, on the first bad afternoon,
 * contain a traceback with a learner's variable names in it — into `opsLog`,
 * which has no retention function and which `learning_forget_user` cannot
 * reach. The debugging value is not worth a store we cannot erase.
 *
 * ## Why this is not an event
 *
 * `learning_events` is the ledger of what a LEARNER did. A runtime that failed
 * to download is not something a learner did — `isLearnerOutcome` says so for
 * exactly this status — and putting it in the ledger would attach an
 * infrastructure fact to a child's row and make it erasable-but-needed. It is
 * counted in memory instead, next to `exec.infra_failures`, which is the
 * server's version of the same sentence.
 *
 * ## Why there is a wire contract at all rather than a per-run beacon
 *
 * Local execution being free and private is the feature. A beacon per Run would
 * be a network request per keystroke-cluster, would put a request on the path
 * whose whole point is that it has no request, and would let anyone with the
 * server logs reconstruct how often a particular class was struggling. Two
 * signals per page session — one when CPython came up, one when it did not —
 * answer the operator's question with a rounding error of traffic.
 *
 * ## No `server-only`
 *
 * Same reason as `schools/execution/trust.ts`: the browser is the producer, so
 * the browser must be able to import the shape and the closed reason list. This
 * module has no imports, touches no configuration and reads no environment, so
 * bundling it costs a few hundred bytes and leaks nothing. The validation that
 * matters happens on the server in `runtime-availability.ts`, which is where a
 * hostile client's payload is actually refused.
 */

/**
 * The ways local Python fails to come up, as three distinct operator problems.
 *
 * Closed, and small on purpose. Each value exists because it changes what an
 * operator would DO, which is the only test a reason code has to pass:
 *
 * - `no_worker` — this browser cannot construct a `Worker` at all. Nothing is
 *   down; a machine in the lab is too old or an extension is blocking workers.
 *   The fix is a browser, not a deploy. If this is the only non-zero one, the
 *   platform is fine.
 * - `boot_failed` — the runtime threw while loading. Assets missing from
 *   `public/pyodide/`, a bad deploy, a proxy rewriting a `.wasm`. This one is
 *   OURS and a school-wide spike means a broken release.
 * - `boot_timeout` — nothing answered inside the boot budget. The download did
 *   not finish: a saturated school link, a captive portal, a throttled tab.
 *   Ours in the sense that we chose to ship 13 MB, but the fix is bandwidth or
 *   caching rather than a rollback.
 *
 * A fourth value would need its own answer to "and then what would you do".
 */
export const LOCAL_RUNTIME_FAILURES = ["no_worker", "boot_failed", "boot_timeout"] as const;

export type LocalRuntimeFailure = (typeof LOCAL_RUNTIME_FAILURES)[number];

/**
 * One boot outcome from one browser.
 *
 * A discriminated union rather than `{ ready: boolean; reason?: string }` so
 * that a reason cannot be attached to a success and a success cannot be sent
 * without one being impossible — the shape says which fields exist, and the
 * parser below enforces exactly it.
 */
export type LocalRuntimeSignal =
  /** CPython came up in this browser. The denominator. */
  | { outcome: "ready" }
  /** It did not. `isLearnerOutcome` is false for this; nobody is marked wrong. */
  | { outcome: "unavailable"; reason: LocalRuntimeFailure };

/**
 * Where the browser posts it.
 *
 * Declared here so the producer and the route cannot disagree about the path.
 *
 * **The route does not exist yet.** `handleLocalRuntimeSignal` in
 * `./runtime-availability.ts` is the whole body of it; what is missing is the
 * three-line `src/app/api/ops/runtime/route.ts` that calls it, which is outside
 * the ownership of the unit that wrote this file. Nothing calls this constant
 * until that lands — see the unit report.
 */
export const LOCAL_RUNTIME_SIGNAL_PATH = "/api/ops/runtime";

/**
 * The hard ceiling on the request body, in bytes.
 *
 * A valid signal is under sixty bytes. The ceiling is small enough that an
 * attempt to smuggle a traceback through a field the parser would drop anyway
 * is refused before it is even parsed, and small enough that the endpoint
 * cannot be used to make the server hold anything.
 */
export const MAX_SIGNAL_BYTES = 256;

function isFailure(value: unknown): value is LocalRuntimeFailure {
  return (
    typeof value === "string" &&
    (LOCAL_RUNTIME_FAILURES as readonly string[]).includes(value)
  );
}

/**
 * Parse a signal, or refuse it.
 *
 * Allow-list, never sanitisation: the result is CONSTRUCTED from the two fields
 * that are understood rather than derived from the input object. A caller that
 * posts `{ outcome: "ready", stdout: "...", subjectId: "..." }` gets back
 * `{ outcome: "ready" }` and the extra fields are not dropped so much as never
 * picked up. There is no code path by which an unrecognised key reaches a
 * counter, a log line or a health payload.
 *
 * Returns `null` for anything malformed rather than throwing. A browser beacon
 * that arrives garbled is not an exception anybody should handle; it is a
 * number — `local_exec.signal_rejected` — and a 400.
 */
export function parseLocalRuntimeSignal(value: unknown): LocalRuntimeSignal | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;

  if (raw.outcome === "ready") return { outcome: "ready" };

  if (raw.outcome === "unavailable" && isFailure(raw.reason)) {
    return { outcome: "unavailable", reason: raw.reason };
  }

  /* Including "unavailable" with an unknown reason. A new reason string that
     this build does not know is not counted as a generic failure, because that
     would let a client mint categories by inventing words; the producer and
     this list ship in the same bundle, so a mismatch is a bug or an attack. */
  return null;
}
