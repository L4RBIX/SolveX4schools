import "server-only";
import { bump, counterSnapshot, opsLog, type OpsCounter } from "./counters";
import {
  LOCAL_RUNTIME_FAILURES,
  MAX_SIGNAL_BYTES,
  parseLocalRuntimeSignal,
  type LocalRuntimeFailure,
  type LocalRuntimeSignal,
} from "./runtime-signal";

/**
 * Is the browser half of hybrid execution actually working?
 *
 * ## The gap this closes
 *
 * Every other execution number in this product is a server number, because
 * until Pyodide there was no other kind. Local Run changed that: the primary
 * path a learner uses now runs entirely inside their laptop and touches no
 * route, so a school where CPython fails to download produces **exactly the
 * same server-side telemetry as a school where every lesson went perfectly** —
 * zero `exec.requests`, zero errors, silence. The failure is invisible in the
 * place people look.
 *
 * This module is the smallest thing that makes it visible: a boot outcome per
 * page session, in memory, with a denominator.
 *
 * ## What is deliberately NOT here
 *
 * No per-run reporting. No stdout, no stderr, no source, no timing, no block or
 * lesson id, no subject id, no user agent, no IP. A log of what children typed
 * is not an infrastructure signal and is not built — see `runtime-signal.ts`,
 * which has no field of that shape for anything to be smuggled into.
 *
 * The cost of that restraint is real and worth naming: when a school reports
 * "Python does not work", these counters say WHICH of three things broke and
 * how widely, and they cannot say on which machine or for whom. Answering that
 * requires standing next to the laptop, which is the trade.
 *
 * ## In memory, like every other counter here
 *
 * `counters.ts` explains why: a counter that needs the database to record that
 * something is broken records nothing. Everything below resets on deploy and is
 * reported against `since`, and the rate is meaningless without it.
 */

/* -------------------------------------------------------------------------- */
/* Ingest                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * How many signals this process will count per minute, across all learners.
 *
 * The endpoint is unauthenticated on purpose — requiring a session would mean a
 * database round trip on a path that exists to report that things are broken,
 * and would tie an infrastructure fact to a learner identity we have no reason
 * to know. The price is that anyone can POST to it.
 *
 * A ceiling is the cheap half of the answer: an attacker can waste 240 slots a
 * minute and skew the rate, and `local_exec.signal_dropped` says out loud that
 * the rate is then an undercount. It is not per-IP because a school is one NAT
 * gateway — the same reason `schools/lib/rate-limit.ts` refuses IP buckets.
 *
 * Sized against reality rather than roundness: eighteen learners booting Python
 * a few times an hour is single digits per minute, and a whole class opening a
 * lesson at 09:00 on the same bell is perhaps forty. 240 leaves an order of
 * magnitude of headroom and still caps the damage.
 */
const SIGNALS_PER_MINUTE = 240;

interface Ceiling {
  windowStartedAt: number;
  count: number;
}

const CEILING_KEY = Symbol.for("solvex.ops.local-runtime-ceiling");
type GlobalWithCeiling = typeof globalThis & { [CEILING_KEY]?: Ceiling };

/** Memoised on `globalThis` for the same reason the counters are: hot reload. */
function ceiling(): Ceiling {
  const g = globalThis as GlobalWithCeiling;
  g[CEILING_KEY] ??= { windowStartedAt: Date.now(), count: 0 };
  return g[CEILING_KEY];
}

function withinCeiling(): boolean {
  const c = ceiling();
  const now = Date.now();
  /* A fixed window, not a sliding one. A sliding window needs a list of
     timestamps — an unbounded allocation on a path whose entire justification
     is that it costs nothing. The imprecision at a window boundary is
     irrelevant to a number that exists to be read as "roughly half the school". */
  if (now - c.windowStartedAt >= 60_000) {
    c.windowStartedAt = now;
    c.count = 0;
  }
  if (c.count >= SIGNALS_PER_MINUTE) return false;
  c.count += 1;
  return true;
}

/**
 * Tests only, and a sibling of `resetCounters` for a reason.
 *
 * The ceiling is process-global and independent of the counters, so a test that
 * spends it stays spent for the rest of the minute and every later test silently
 * counts nothing. Resetting one without the other is exactly the kind of
 * half-clean state that makes a suite pass for the wrong reason.
 */
export function resetLocalRuntimeCeiling(): void {
  const g = globalThis as GlobalWithCeiling;
  g[CEILING_KEY] = { windowStartedAt: Date.now(), count: 0 };
}

/** The counter each failure reason lands in. Exhaustive by the type, not by luck. */
const REASON_COUNTER: Record<LocalRuntimeFailure, OpsCounter> = {
  no_worker: "local_exec.unavailable.no_worker",
  boot_failed: "local_exec.unavailable.boot_failed",
  boot_timeout: "local_exec.unavailable.boot_timeout",
};

export type SignalOutcome = "counted" | "dropped";

/**
 * Count one boot outcome.
 *
 * The total and the per-reason breakdown are bumped together, here, so they
 * cannot drift: a reason added to the union without a line in `REASON_COUNTER`
 * is a compile error, and there is no second call site to forget.
 *
 * A failure also writes one `opsLog` line, carrying the reason and nothing
 * else. That is the difference between "the rate is 60%" and "the rate went to
 * 60% at 09:04 on Tuesday", and the reason string is a member of a closed list
 * that ships in this build — it cannot contain anything a learner wrote.
 * Success is NOT logged: it is the common case, it would be one line per lesson
 * page, and the counter already holds the denominator.
 */
export function recordLocalRuntimeSignal(signal: LocalRuntimeSignal): SignalOutcome {
  if (!withinCeiling()) {
    bump("local_exec.signal_dropped");
    return "dropped";
  }

  if (signal.outcome === "ready") {
    bump("local_exec.ready");
    return "counted";
  }

  bump("local_exec.unavailable");
  bump(REASON_COUNTER[signal.reason]);
  opsLog("local_exec.runtime_unavailable", { reason: signal.reason });
  return "counted";
}

/* -------------------------------------------------------------------------- */
/* The route body                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The whole of `POST /api/ops/runtime`.
 *
 * Written here rather than in the route file so the validation, the ceiling and
 * the counters live next to the contract they enforce, and so the route is a
 * three-line delegation that nobody has to read. It is also why this is
 * testable without a server.
 *
 * ## Why it does not require `content-type: application/json`
 *
 * The producer is a browser reporting that its own runtime failed, possibly
 * while the page is being unloaded, which is what `navigator.sendBeacon` is
 * for — and `sendBeacon` sends `text/plain` unless the caller wraps the body in
 * a typed `Blob`. Refusing on content type would reject exactly the signal that
 * matters most and would look, from the server, like the failure never
 * happened. The body is parsed as JSON and validated on its shape; the header
 * adds nothing a strict parser does not already do.
 *
 * ## Why every refusal is still a 2xx-ish cheap answer
 *
 * There is nothing a browser can do about being refused. It must not retry —
 * a retry loop from a broken runtime is a second outage — so the response
 * carries no `retry-after` and the client is expected to fire and forget.
 */
export async function handleLocalRuntimeSignal(request: Request): Promise<Response> {
  /* Before the body is read, on the declared length. Same order as
     `/api/exec/run`: the cheapest refusal of a large POST is one that happens
     before it is buffered. */
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_SIGNAL_BYTES) {
    bump("local_exec.signal_rejected");
    return refusal("too_large");
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    bump("local_exec.signal_rejected");
    return refusal("unreadable");
  }

  /* And again on what actually arrived, because `content-length` is a claim.
     Compared in bytes rather than in UTF-16 units — the mistake `/api/exec/run`
     already had to fix once. */
  if (new TextEncoder().encode(text).length > MAX_SIGNAL_BYTES) {
    bump("local_exec.signal_rejected");
    return refusal("too_large");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    bump("local_exec.signal_rejected");
    return refusal("invalid_json");
  }

  const signal = parseLocalRuntimeSignal(parsed);
  if (signal === null) {
    bump("local_exec.signal_rejected");
    return refusal("unrecognised_signal");
  }

  const outcome = recordLocalRuntimeSignal(signal);
  /* 204 whether it was counted or dropped by the ceiling. The client cannot
     act on the difference and must not treat it as a reason to try again; the
     drop is visible where it belongs, in `local_exec.signal_dropped`. */
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store", "x-signal": outcome },
  });
}

/**
 * A refusal that says which rule was broken and nothing else.
 *
 * The reason is one of four literals written in this file. It never echoes the
 * body, which is the point: an endpoint that reflected what it was sent would
 * be a way to get arbitrary text back out of the server, and the bodies this
 * endpoint refuses are precisely the ones that contain something unexpected.
 */
function refusal(reason: string): Response {
  return Response.json({ error: reason }, { status: 400, headers: { "cache-control": "no-store" } });
}

/* -------------------------------------------------------------------------- */
/* The read side                                                              */
/* -------------------------------------------------------------------------- */

/**
 * How many signals before a rate means anything.
 *
 * One failure out of one signal is a 100% failure rate and is also one learner
 * with a broken extension. Judging the platform on that is how a health field
 * trains people to ignore it — the same mistake as reporting an idle reducer as
 * a stalled one.
 */
const MIN_SIGNALS_TO_JUDGE = 5;

/**
 * The share of failures at which "some machines are old" becomes "the release
 * is broken".
 *
 * Half is deliberately high. A school with a lab of ten-year-old machines will
 * sit at a steady non-zero rate forever, and that is not an outage; a rate over
 * half means the learners who CAN run Python are the minority, which is a
 * different sentence.
 */
const BROKEN_RATE = 0.5;

export interface LocalRuntimeAvailability {
  /** ISO time this process started counting. Every number below is since then. */
  since: string;
  windowSeconds: number;
  /** Browsers that got a working CPython. The denominator. */
  ready: number;
  /** Browsers that did not. Never attributed to a learner. */
  unavailable: number;
  /** `ready + unavailable`. Page sessions, not runs. */
  signals: number;
  /** `null` when nothing has reported — which is not the same as zero failures. */
  unavailableRate: number | null;
  byReason: Record<LocalRuntimeFailure, number>;
  /** Malformed posts. A non-zero value means a producer and this build disagree. */
  rejected: number;
  /** Signals refused by the per-minute ceiling. Non-zero means the rate is low. */
  dropped: number;
  /**
   * Enough signals AND most of them failed. The only field worth alerting on.
   *
   * False while `signals` is small, on purpose — see `MIN_SIGNALS_TO_JUDGE`.
   */
  broken: boolean;
  note: string;
}

export function localRuntimeAvailability(): LocalRuntimeAvailability {
  const snap = counterSnapshot();
  const v = snap.values;

  const ready = v["local_exec.ready"];
  const unavailable = v["local_exec.unavailable"];
  const signals = ready + unavailable;
  const rate = signals === 0 ? null : unavailable / signals;

  const byReason = Object.fromEntries(
    LOCAL_RUNTIME_FAILURES.map((r) => [r, v[REASON_COUNTER[r]]]),
  ) as Record<LocalRuntimeFailure, number>;

  return {
    since: snap.since,
    windowSeconds: snap.windowSeconds,
    ready,
    unavailable,
    signals,
    unavailableRate: rate,
    byReason,
    rejected: v["local_exec.signal_rejected"],
    dropped: v["local_exec.signal_dropped"],
    broken: signals >= MIN_SIGNALS_TO_JUDGE && rate !== null && rate > BROKEN_RATE,
    note:
      "Boot outcomes reported by learners' browsers, one per page session — not " +
      "per Run, and carrying no source, output, timing or identity. In-process: " +
      "resets on every deploy, so read it against `since`.",
  };
}
