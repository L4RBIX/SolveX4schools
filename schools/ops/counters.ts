import "server-only";

/**
 * Pilot counters and operational logging.
 *
 * ## What this is NOT
 *
 * It is not an analytics platform, and it must never become one. Eighteen
 * students and one teacher for nine months do not generate a volume that
 * justifies a metrics backend, a time-series database, or a second write path
 * into Postgres. What the pilot actually needs is the ability to answer five
 * questions on a Tuesday morning, and four of the five are already answerable
 * from the ledger — see `schools/ops/observability.ts`, which derives them with
 * `select` and adds no writes at all.
 *
 * This file exists for the fifth kind of question, the one the ledger
 * structurally cannot answer: **how often did something fail to be recorded?**
 * A failed write leaves no row. A judge that never answered produces no
 * `verdict_received`. There is nothing to count later, so it has to be counted
 * as it happens.
 *
 * ## In-process, and therefore RESET ON DEPLOY
 *
 * These live in memory. A redeploy, a crash, a container restart or a scale-out
 * to a second instance all zero them, and none of those events is recorded
 * anywhere — which is why every counter is reported alongside `since`, the
 * moment this process started counting. A number read without its window is a
 * number that will eventually be misread as a total.
 *
 * That is a deliberate trade, not an oversight. The alternative — persisting
 * counters — means a write on the failure path, which is exactly the path that
 * is failing. A counter that needs the database to record that the database is
 * broken records nothing.
 *
 * ## Memoised on `globalThis`
 *
 * Same reason as the store: Next's dev server re-evaluates modules on hot
 * reload, and a fresh counter object per reload would make every number reset
 * whenever a file was saved. Two importers of this module must also be looking
 * at one object, or the health route reports its own private zeroes.
 */

/**
 * The whole vocabulary. A closed list, for the same reason the event taxonomy
 * is closed: a counter nobody can name is a counter nobody reads, and a free
 * string key turns a fixed cost into an unbounded map.
 *
 * Every entry below answers a question someone will actually ask during the
 * pilot. If you cannot name that question, do not add the counter.
 */
export const OPS_COUNTERS = [
  /** SUBMIT and RUN both, counted at the provider boundary. */
  "exec.requests",
  /** The judge did not answer, or could not be reached. Says nothing about a learner. */
  "exec.infra_failures",
  /** The learner's own program failed to compile or crashed. NOT an outage. */
  "exec.learner_errors",
  /**
   * A request refused on size before it reached the judge.
   *
   * Its own counter and not `exec.infra_failures`, because nothing is broken —
   * a learner pasted something too big, or somebody probed the route. The
   * question it answers is "is anybody hitting the ceiling", which is a content
   * question if the number is small and steady and an abuse question if it is
   * not. Folding it into the outage counter would page for both.
   */
  "exec.payload_rejected",

  /*
   * The BROWSER half of hybrid execution, counted as a boot outcome and
   * nothing else.
   *
   * Local Run is free, instant and private, and that privacy is the feature —
   * there is deliberately no counter here for how many times a learner pressed
   * Run, how long their program took, or whether it worked. None of that is an
   * operator's question and all of it is a child's business.
   *
   * The one thing an operator legitimately cannot see from the server is
   * whether Pyodide is coming up at all: a 13 MB WASM download over a school
   * link fails silently, in a place no server log reaches, and the symptom is
   * eighteen learners who quietly cannot run anything. So the browser reports
   * ONE bit per page session — did CPython start — and `local_exec.ready` is
   * the denominator that makes the failures readable. Two failures means
   * nothing; two failures out of three means the release is broken.
   *
   * See `schools/ops/runtime-signal.ts` for what may cross the wire, and
   * `schools/ops/runtime-availability.ts` for the ingest.
   */
  /** CPython came up in a learner's browser. The denominator, not a success metric. */
  "local_exec.ready",
  /** It did not. NEVER recorded against the learner — `isLearnerOutcome` is false. */
  "local_exec.unavailable",
  /*
   * The same failures again, split by which one. Bumped in the same function
   * as the total so the two cannot drift, and kept separate from it because
   * the total is what someone reads and the breakdown is what they act on:
   * `no_worker` is one old machine in the lab, `boot_failed` is a broken
   * deploy, `boot_timeout` is the school's bandwidth. Different Tuesdays.
   */
  "local_exec.unavailable.no_worker",
  "local_exec.unavailable.boot_failed",
  "local_exec.unavailable.boot_timeout",
  /**
   * A posted signal that did not match the contract and was counted as nothing.
   *
   * Worth a number because the alternative is a silent zero: a producer that
   * starts sending a shape this build does not understand would look exactly
   * like a school where nobody opened a lesson.
   */
  "local_exec.signal_rejected",
  /**
   * A well-formed signal refused because the process-wide ceiling was already
   * spent — see `runtime-availability.ts`.
   *
   * The endpoint is unauthenticated by design, so it is spammable, and a
   * skewed availability rate that nothing admits to is worse than a capped one.
   * A non-zero value here means the rate above is an undercount.
   */
  "local_exec.signal_dropped",

  /** A hint reached a model provider. */
  "nova.requests",
  /** The provider threw. The learner saw a retry, not an answer. */
  "nova.failures",
  /** A burst limit refused a hint. Without this a throttled class looks like a quiet one. */
  "nova.rate_limited",
  /** The learner closed the panel or hit Stop, and the provider call was aborted. */
  "nova.cancelled",

  /*
   * The safety gate, by family and by nothing else.
   *
   * A count, never a message, never a subject, never an excerpt. A school can
   * be told "the crisis path fired twice this term" without anyone acquiring
   * the ability to read what a child typed — which is the only version of this
   * number that is safe to keep. These are NOT learning evidence and nothing
   * downstream reads them as if they were.
   */
  "nova.safety.self_harm",
  "nova.safety.abuse_disclosure",
  "nova.safety.sexual",
  "nova.safety.violence",
  "nova.safety.drugs",
  "nova.safety.illegal_access",
  "nova.safety.hate",
  "nova.safety.personal_data",
  "nova.safety.academic_integrity",
  "nova.safety.prompt_exfiltration",
  "nova.safety.extended_offtopic",

  /** The validator rejected a response and a stricter retry was attempted. */
  "nova.output_rejected",
  /** Both attempts were rejected. The learner got the deterministic fallback. */
  "nova.output_rejected_final",

  /** A ceiling stopped a request before the provider was called. */
  "nova.budget.daily_requests",
  "nova.budget.monthly_input_tokens",
  "nova.budget.monthly_output_tokens",
  "nova.budget.monthly_cost",
  /** The ceiling could not be read, so the request proceeded. Failing open, visibly. */
  "nova.budget_check_failures",
  /** Token accounting could not be written. The month row is under-counting. */
  "nova.spend_write_failures",

  /**
   * A submission id that had already been claimed. The stored verdict was
   * replayed and NO second set of learning events was written.
   *
   * Expected to be non-zero: a double-click and a reconnect both land here, and
   * that is the mechanism working. It is worth counting because the number is
   * the only visibility into how often it happens, and because a sudden jump
   * means a client is minting ids wrongly — which would look like nothing at
   * all from the ledger, since the whole point is that it writes nothing.
   */
  "submit.duplicates",
  /**
   * A duplicate whose original was still in flight when the wait ran out.
   *
   * Nothing was graded and nothing was written; the caller was told the
   * submission was not recorded and offered the check again. Should be zero. A
   * number here means the judge is running longer than the wait allows.
   */
  "submit.duplicate_timeouts",

  /** A graded attempt whose events could not be written. Progress was NOT saved. */
  "save.event_write_failures",
  /** A finished lesson that could not be recorded in the school's copy. */
  "save.completion_failures",

  /** A reducer sweep that threw outright. Projections are behind. */
  "sweep.failures",
] as const;

export type OpsCounter = (typeof OPS_COUNTERS)[number];

interface CounterState {
  since: number;
  values: Record<string, number>;
}

const KEY = Symbol.for("solvex.ops.counters");
type GlobalWithCounters = typeof globalThis & { [KEY]?: CounterState };

function state(): CounterState {
  const g = globalThis as GlobalWithCounters;
  g[KEY] ??= { since: Date.now(), values: Object.fromEntries(OPS_COUNTERS.map((c) => [c, 0])) };
  return g[KEY];
}

/** Cheap by construction: one property increment, no allocation, never awaited. */
export function bump(counter: OpsCounter, by = 1): void {
  const s = state();
  s.values[counter] = (s.values[counter] ?? 0) + by;
}

export interface CounterSnapshot {
  /** ISO time this process started counting. Every value below is since then. */
  since: string;
  /** Seconds this process has been counting. Zero after every deploy. */
  windowSeconds: number;
  /** Load-bearing, and stated in the payload rather than in a README nobody opens. */
  note: string;
  values: Record<OpsCounter, number>;
}

export function counterSnapshot(): CounterSnapshot {
  const s = state();
  return {
    since: new Date(s.since).toISOString(),
    windowSeconds: Math.round((Date.now() - s.since) / 1000),
    note:
      "In-process counters. They reset to zero on every deploy, restart or crash, " +
      "and a second instance keeps its own set. Read them against `since`, never " +
      "as lifetime totals.",
    values: Object.fromEntries(
      OPS_COUNTERS.map((c) => [c, s.values[c] ?? 0]),
    ) as Record<OpsCounter, number>,
  };
}

/** Tests only. Production has no reason to lie to itself about its own window. */
export function resetCounters(): void {
  const g = globalThis as GlobalWithCounters;
  g[KEY] = { since: Date.now(), values: Object.fromEntries(OPS_COUNTERS.map((c) => [c, 0])) };
}

/* -------------------------------------------------------------------------- */

/**
 * One structured line per operational event.
 *
 * JSON on stderr, because that is what every log collector already parses and
 * because a school pilot's logs are read by grepping a Docker log, not by a
 * query language. `console.error` rather than `console.log` so an ops event is
 * never interleaved into an output stream something else is parsing.
 *
 * ## What may never appear in a field
 *
 * No `subject_id`, no session id, no username, no display name, no learner
 * prose, no source code, no answer, no environment variable, no URL carrying
 * credentials. Logs are the one store with no schema, no retention function and
 * no erasure path — `learning_forget_user` cannot reach a log line — so
 * anything identifying that lands here outlives the consent that put it there.
 *
 * The consequence is accepted on purpose: these lines say WHAT broke and HOW
 * OFTEN, never TO WHOM. Tracing one child's bad afternoon is the ledger's job,
 * and the ledger can be erased.
 */
export function opsLog(
  event: string,
  fields: Record<string, string | number | boolean> = {},
): void {
  const line = { ts: new Date().toISOString(), scope: "ops", event, ...fields };
  console.error(JSON.stringify(line));
}
