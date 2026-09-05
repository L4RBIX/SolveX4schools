import "server-only";
import { recordJudge0Request, type Judge0RequestKind } from "@schools/ops/judge0-usage";
import { config } from "@schools/config";
import {
  JUDGE0_CPP_NAME,
  MIN_GNU_CXX17_MAJOR,
} from "@schools/execution/cpp-runtime";
import {
  EXECUTION_LIMITS,
  type CodeExecutionProvider,
  type ExecutionRequest,
  type ExecutionResult,
  type ExecutionStatus,
} from "../provider";

/**
 * Judge0 CE via RapidAPI — a rented judge for SUBMIT.
 *
 * A second implementation of the port Piston already implements. Nothing above
 * this file learns that RapidAPI exists: the key, the two vendor headers, the
 * async submit-then-poll dance, the status ids, the language catalogue and the
 * concurrency gate all stop here, and what leaves is the same `ExecutionResult`
 * the local subprocess and Piston produce.
 *
 * ## The cost model, which is the reason for half the decisions below
 *
 * RUN is the browser's own compiler and does not come through here. Twenty
 * presses of Run cost zero RapidAPI requests; only SUBMIT spends money.
 * That is not an optimisation to be revisited when someone wants a faster Run —
 * it is what makes a metered judge affordable for a class at all.
 *
 * Every HTTP call in this file is metered, INCLUDING the polls. A submission is
 * one POST plus however many `GET /submissions/{token}` it takes to see a
 * terminal status, so the polling cadence is a spending decision, not a latency
 * one. That is why the first poll waits a beat instead of firing immediately
 * (the answer to a poll sent a millisecond after the POST is known in advance:
 * "In Queue"), why the interval backs off, and why `runBatch` exists.
 *
 * ## The key
 *
 * Server-only, read from `schools/config.ts` like every other secret, carried
 * in a header and never in a URL, and never interpolated into any string this
 * file returns. `ExecutionResult.stderr` reaches a browser through
 * `/api/exec/run`, so every failure message below is a fixed sentence written
 * by hand — never `err.message`, never a response body, never a header.
 *
 * ## What we deliberately do NOT send
 *
 * `expected_output`. Judge0 will compare stdout for us and we refuse to let it:
 * `token`, `exact` and author-declared `numeric` tolerances are curriculum
 * decisions living in `schools/exec/checker.ts`, and Judge0 knows none of them.
 * It would also mean shipping the answer key for every hidden case to a
 * marketplace vendor. Judge0 executes; SolveX decides. Status 4 (Wrong Answer)
 * therefore cannot legitimately occur here, and the mapping below says so.
 *
 * ## The distinction this file is most able to break
 *
 * Judge0 reports the learner's slow program (status id 5) and its own bad day
 * (a 429, a 401, a dead worker, our own `fetch` giving up) over exactly one
 * HTTP channel. One of those is evidence about a child's algorithm and the
 * other says nothing about them whatsoever. They are different fields below and
 * must stay different — see `ExecutionStatus`.
 *
 * ## UNVERIFIED — read before believing anything here works
 *
 * No RapidAPI key exists in this repository and nothing in this file has ever
 * spoken to `judge0-ce.p.rapidapi.com`. The wire shapes are written from
 * Judge0's published API. What HAS since been measured against a real key is
 * narrow and is recorded in `docs/cpp17/CPP17_JUDGE_PARITY.md`: the C++
 * catalogue, that `language_id 105` is GCC 14.1 and reports `__cplusplus`
 * 201703 with no flag, and that `compiler_options` is refused with HTTP 403 on
 * this plan. Since measured too, and no longer unknown: `GET /config_info`
 * reports the plan's own ceilings (nothing we send is clamped;
 * `max_submission_batch_size` is 20), and **`POST /submissions/batch` works** —
 * HTTP 201 with correct per-case results, which is why `runBatch` defaults to
 * it. Still UNKNOWN, and the reason `JUDGE0_MAX_CONCURRENT_REQUESTS` has not
 * moved: **what the rate limit actually is.** The service sends
 * `x-ratelimit-submissions-limit: 0` with a negative `remaining` and none of
 * the nine headers `schools/ops/provider-quota.ts` reads, so there is no
 * ceiling to read. Where that matters, the code fails loudly rather than
 * guessing.
 *
 * ## Residency
 *
 * `docs/CODE_EXECUTION_DECISION.md` chose a self-hosted Kazakh Piston partly
 * because learner source code then does not leave the country. Routing SUBMIT
 * through RapidAPI sends it to a marketplace and on to Judge0's hosts. That is
 * a programme decision and not one this file can make; it is recorded here so
 * nobody discovers it from a network tab.
 */

/* -------------------------------------------------------------------------- */
/* Judge0's vocabulary, named once                                            */
/* -------------------------------------------------------------------------- */

/**
 * Judge0's status ids.
 *
 * Written out with names because `case 11:` in a switch is unreadable and
 * because these numbers appear in exactly one place in this repository — here.
 * They are normalised into `ExecutionStatus` before anything else sees them;
 * a Judge0 id must never escape this module.
 */
const JUDGE0 = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  SIGSEGV: 7,
  SIGXFSZ: 8,
  SIGFPE: 9,
  SIGABRT: 10,
  NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const;

/**
 * The two non-terminal ids. Everything else is an answer.
 *
 * Getting this wrong is the classic Judge0 integration bug: read status 1 as a
 * result and every submission comes back with empty stdout, which the checker
 * compares against the expected output and calls wrong. An entire class marked
 * incorrect because we did not wait.
 */
function isPending(statusId: number): boolean {
  return statusId === JUDGE0.IN_QUEUE || statusId === JUDGE0.PROCESSING;
}

/**
 * Only what we read, so the judge does not serialise a submission's source code
 * and language object back to us on every poll.
 *
 * `fields` is also a small privacy nicety: we never ask for `source_code` back,
 * so a poll response cannot carry a learner's program into a log.
 */
const POLL_FIELDS = "status_id,stdout,stderr,compile_output,message,time,memory,exit_code";

/** What a `GET /submissions/{token}` gives us back, once narrowed. */
interface Judge0Submission {
  status_id?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  compile_output?: unknown;
  message?: unknown;
  time?: unknown;
  memory?: unknown;
  exit_code?: unknown;
}

/**
 * Judge0 hands back a UUID and we then put it in a URL PATH.
 *
 * So it is validated before use, and the reason is not tidiness: a token is a
 * value from a remote service that becomes part of a request we make. A body
 * containing `../../languages` or a full URL turns our next poll into a request
 * we did not intend. The shape is fixed and cheap to assert, so we assert it
 * and treat anything else as the judge being broken rather than as something to
 * work around.
 */
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* -------------------------------------------------------------------------- */
/* Timing constants that are NOT knobs                                        */
/* -------------------------------------------------------------------------- */

/**
 * Wall time is the learner's CPU budget plus a small margin.
 *
 * `cpu_time_limit` is the number December's month is about — how fast the
 * algorithm is. `wall_time_limit` catches the different failure of a program
 * that is not burning CPU at all: blocked reading stdin that never comes,
 * sleeping, waiting on something. It has to sit ABOVE the CPU limit, because a
 * program that legitimately uses its whole CPU budget also spends real seconds
 * being scheduled, and a wall limit at or below the CPU limit would kill it
 * first — reporting the same status 5 for a program that was not actually slow.
 */
const WALL_TIME_MARGIN_SECONDS = 2;

/** Backoff for polling: gentle, because each poll is a billable request. */
const POLL_BACKOFF = 1.5;
const MAX_POLL_INTERVAL_MS = 1_000;

/**
 * The plan's own `max_submission_batch_size`, measured — not chosen by us.
 *
 * `GET /config_info` on the subscribed plan reports 20, recorded in
 * `docs/infrastructure/JUDGE0_LIVE_VALIDATION.md` §3. A batch one over the
 * judge's ceiling is refused WHOLE, so this is the number `runBatch` chunks at
 * when a block declares more cases than one request may carry.
 */
const DEFAULT_MAX_BATCH_SIZE = 20;

/**
 * How many consecutive transient poll failures we ride out.
 *
 * A GET is idempotent, so retrying one is free of consequence — unlike the
 * POST, which is not retried at all (see `submit`). We ride out this many and
 * give up on the next: one dropped packet is noise, three in a row is a judge
 * that has stopped answering.
 */
const MAX_CONSECUTIVE_POLL_FAILURES = 2;

/* -------------------------------------------------------------------------- */
/* Failures                                                                    */
/* -------------------------------------------------------------------------- */

/** The three ways this provider can fail without the learner being involved. */
type InfrastructureStatus = Extract<
  ExecutionStatus,
  "provider_error" | "provider_timeout" | "provider_rate_limited"
>;

/**
 * An internal failure carrying the status it becomes and the sentence a learner
 * may see.
 *
 * The message is written at the throw site, by hand, and is the only thing that
 * travels. Nothing derived from a provider response — no body, no header, no
 * `message` field of Judge0's own — is ever attached, because this string ends
 * up in `ExecutionResult.stderr`, and `/api/exec/run` returns that to a browser.
 */
class Judge0Failure extends Error {
  constructor(
    readonly execStatus: InfrastructureStatus,
    readonly safeMessage: string,
  ) {
    super(safeMessage);
    this.name = "Judge0Failure";
  }
}

/**
 * The judge's own shell, removed from what a learner reads.
 *
 * ## Measured, live, on 2026-09-05
 *
 * `int main(){ int a = 17, b = 0; std::cout << a / b; }` came back with
 *
 *     run.sh: line 1:     3 Floating point exception(core dumped) ./a.out
 *
 * on `stderr`. This suite used to assert that field was EMPTY — it was, and
 * Judge0's sandbox has since started capturing the shell's own job-control
 * message. The verdict is right either way; the text is not ours and it is not
 * addressed to a fourteen-year-old. `run.sh`, `./a.out`, a PID and
 * "(core dumped)" are facts about a vendor's container, and the product's rule
 * for the browser runtime — no host paths, no implementation detail — cannot
 * stop being the rule because the sentence arrived over HTTP instead.
 *
 * What survives is the CAUSE: `Floating point exception`, which is the thing a
 * learner can act on and the thing a teacher would say out loud. Anything the
 * program itself wrote to `cerr` is untouched — it is on its own lines, and
 * only lines with the shell's shape are rewritten.
 */
export function sanitizeJudgeStderr(stderr: string): string {
  return stderr
    .split("\n")
    .map((line) => {
      /* `run.sh: line 1:     3 Floating point exception(core dumped) ./a.out` */
      const shell = /^\s*run\.sh:\s*line\s+\d+:\s*\d*\s*(.+?)\s*(?:\(core dumped\))?\s*(?:\.\/\S+)?\s*$/.exec(
        line,
      );
      if (shell) return shell[1]!.trim();
      return line;
    })
    .join("\n")
    .replace(/\s+$/u, "");
}

/* -------------------------------------------------------------------------- */
/* The process-wide concurrency gate                                          */
/* -------------------------------------------------------------------------- */

interface Waiter {
  wake: () => void;
  fail: (err: Error) => void;
  /** Whose submission this is. `undefined` means "not attributable" — see below. */
  key: string | undefined;
}

/**
 * A bound on how many submissions this process has in flight at once, and on
 * how many of them belong to one learner.
 *
 * Eighteen students pressing Submit inside the same ten seconds, times however
 * many hidden cases a task declares, is the real load — seventy-odd requests
 * arriving as one burst. Against a metered marketplace API that is how a class
 * discovers its plan's limit mid-lesson, and a 429 storm looks to a room of
 * fourteen-year-olds exactly like the platform being broken.
 *
 * A "slot" is one submission's whole lifecycle — the POST and every poll for it
 * — not one HTTP call. That is the unit Judge0's queue and the plan's
 * concurrency actually care about, and gating individual polls would let the
 * same eighteen submissions storm anyway.
 *
 * The default is deliberately LOW. The plan's real concurrency is still
 * unmeasured — the live run read `x-ratelimit-submissions-limit: 0` with a
 * negative remaining, which is not a readable ceiling — and the safe direction
 * for an unknown ceiling is to stay well under it: waiting is a slower Submit,
 * exceeding is a class of learners told nothing could be measured.
 *
 * ## Fair queueing, and the defect that required it
 *
 * This was pure FIFO with no idea who was waiting. Two slots, a 30-second
 * queue, and a browser loop posting fresh submission ids held both of them
 * five to seven seconds at a time — so every classmate behind it timed out and
 * was told the judge was unavailable. One learner could produce an outage that
 * was, to everyone else, indistinguishable from the judge being down.
 *
 * `perKeyLimit` fixes it structurally rather than by making the queue longer.
 * A waiter whose key already holds that many slots is SKIPPED when a slot frees
 * — not failed, not moved to the back — and the next admissible waiter takes it
 * instead. The monopolist keeps its place in line and gets the slot as soon as
 * its own submission finishes, which is the outcome it was entitled to; nobody
 * behind it waits on a queue position that was never going to be theirs.
 *
 * A waiter with no key is always admissible. That is deliberate: an
 * unattributable request — a health probe, a script, a future caller that has
 * no learner — must not be silently held back by a fairness rule about
 * learners. It still counts against the global `limit`.
 */
class RequestGate {
  private active = 0;
  private readonly waiting: Waiter[] = [];
  /** In-flight slots per fairness key. Absent means zero. */
  private readonly held = new Map<string, number>();

  constructor(
    readonly limit: number,
    readonly perKeyLimit: number = Number.POSITIVE_INFINITY,
  ) {}

  /**
   * What ops health reports: how deep the queue is and how loaded the gate is.
   *
   * `held` is per fairness key and is what makes the per-learner bound
   * *observable* rather than merely asserted. Ops health reports only the two
   * counts — a map keyed by subject id is learner data and does not belong in a
   * health payload — but a test can read it, which is the difference between a
   * bound that is claimed and one that is measured.
   */
  snapshot(): {
    limit: number;
    perKeyLimit: number;
    active: number;
    waiting: number;
    held: Record<string, number>;
  } {
    return {
      limit: this.limit,
      perKeyLimit: this.perKeyLimit,
      active: this.active,
      waiting: this.waiting.length,
      held: Object.fromEntries(this.held),
    };
  }

  private admissible(key: string | undefined): boolean {
    if (key === undefined) return true;
    return (this.held.get(key) ?? 0) < this.perKeyLimit;
  }

  private take(key: string | undefined): void {
    if (key === undefined) return;
    this.held.set(key, (this.held.get(key) ?? 0) + 1);
  }

  private give(key: string | undefined): void {
    if (key === undefined) return;
    const n = (this.held.get(key) ?? 1) - 1;
    if (n <= 0) this.held.delete(key);
    else this.held.set(key, n);
  }

  async acquire(waitMs: number, signal?: AbortSignal, key?: string): Promise<() => void> {
    if (this.active < this.limit && this.admissible(key)) {
      this.active += 1;
      this.take(key);
      return this.releaser(key);
    }

    await new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        key,
        wake: () => {
          cleanup();
          resolve();
        },
        fail: (err) => {
          cleanup();
          reject(err);
        },
      };

      const drop = () => {
        const i = this.waiting.indexOf(waiter);
        if (i >= 0) this.waiting.splice(i, 1);
      };

      /* A queue with no ceiling is a queue that eventually holds a whole class
         waiting on a judge that is never going to answer. Giving up here is
         infrastructure — we never got to ask — and never a verdict. */
      const timer = setTimeout(() => {
        drop();
        waiter.fail(
          new Judge0Failure("provider_timeout", "the judge was too busy to take this in time"),
        );
      }, waitMs);

      const onAbort = () => {
        drop();
        waiter.fail(new Judge0Failure("provider_timeout", "the run was cancelled before it started"));
      };

      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };

      if (signal?.aborted) {
        cleanup();
        reject(new Judge0Failure("provider_timeout", "the run was cancelled before it started"));
        return;
      }
      signal?.addEventListener("abort", onAbort);
      this.waiting.push(waiter);
    });

    /* Woken by a release, which handed its slot straight over rather than
       decrementing — so `active` is already correct and must not be raised
       again here. The per-key count WAS incremented by the releaser on our
       behalf, for the same reason: the handover has to be atomic with respect
       to the next release, or two waiters for one key could both be woken. */
    return this.releaser(key);
  }

  private releaser(key: string | undefined): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.give(key);
      /* The first waiter this release can legitimately serve. Skipping rather
         than reordering: a waiter that is passed over stays exactly where it is
         and is reconsidered on the next release, so it loses no position — it
         is only ever skipped while its own earlier submission is still using
         the slot it would have taken. */
      const i = this.waiting.findIndex((w) => this.admissible(w.key));
      if (i >= 0) {
        const [next] = this.waiting.splice(i, 1);
        this.take(next.key);
        next.wake();
      } else {
        this.active -= 1;
      }
    };
  }
}

/*
 * Memoised on `globalThis`, for the same reason the ops counters are: Next's
 * dev server re-evaluates modules on hot reload, and `getExecutionProvider`
 * constructs a provider per request. A gate held in module scope alone would be
 * a fresh, empty gate for every submission — a bound that bounds nothing.
 *
 * Consequence worth knowing: the FIRST limit wins for the life of the process,
 * so changing `JUDGE0_MAX_CONCURRENT_REQUESTS` needs a restart, not a reload.
 */
const GATE_KEY = Symbol.for("solvex.exec.judge0.gate");
type GlobalWithGate = typeof globalThis & { [GATE_KEY]?: RequestGate };

function processGate(limit: number, perKeyLimit?: number): RequestGate {
  const g = globalThis as GlobalWithGate;
  g[GATE_KEY] ??= new RequestGate(limit, perKeyLimit ?? Number.POSITIVE_INFINITY);
  return g[GATE_KEY];
}

/** The live gate, for ops health. `null` before any provider has been built. */
export function judge0GateSnapshot(): ReturnType<RequestGate["snapshot"]> | null {
  const g = globalThis as GlobalWithGate;
  return g[GATE_KEY]?.snapshot() ?? null;
}

/**
 * Forget the process gate. **Tests only.**
 *
 * A production process has one configuration and wants first-limit-wins: that
 * is the whole point, and re-reading a changed limit mid-life would silently
 * widen a bound the operator believes is in force.
 *
 * A test process is not a production process. Several suites construct
 * providers at different limits inside one vitest worker, and without this the
 * first one to touch the gate decides for all of them — which made the gate
 * *untestable at a chosen limit*, and is exactly why "does it actually bound?"
 * went unproven until someone wrote the test and got a peak of 4 against a
 * limit of 2. The gate was working; the harness could not ask it a question.
 *
 * Deliberately not `if (NODE_ENV === "test")`-guarded. A guard would be a
 * second thing to get wrong, and the honest protection is that calling this in
 * a server would only reset a counter to a state it reaches whenever the
 * process restarts.
 */
export function resetJudge0GateForTests(): void {
  delete (globalThis as GlobalWithGate)[GATE_KEY];
}

/* -------------------------------------------------------------------------- */
/* Language discovery                                                          */
/* -------------------------------------------------------------------------- */

/** What we found, and can therefore honestly claim, about the interpreter. */
export interface Judge0Language {
  id: number;
  /** Judge0's own name for it, verbatim — e.g. `C++ (GCC 14.1.0)`. */
  name: string;
  /**
   * The version parsed out of `name`, or `null` when it could not be read.
   *
   * `null` is a real answer and is what an operator override produces: an id
   * with no name behind it means nothing in this system knows which compiler
   * produced a learner's evidence.
   */
  version: string | null;
  /** `true` when this came from `JUDGE0_LANGUAGE_ID` rather than from the judge. */
  operatorOverride: boolean;
}

/**
 * What the judge has to be offering, and why the rule is this narrow.
 *
 * The catalogue on this plan holds five C++ entries and exactly one of them can
 * run this course:
 *
 *     52  C++ (GCC 7.4.0)     default gnu++14  — unusable
 *     53  C++ (GCC 8.3.0)     default gnu++14  — unusable
 *     54  C++ (GCC 9.2.0)     default gnu++14  — unusable
 *     76  C++ (Clang 7.0.1)   default gnu++14  — unusable
 *    105  C++ (GCC 14.1.0)    default gnu++17  — this one
 *
 * `compiler_options` is refused with HTTP 403 here, so "unusable" is literal
 * rather than inconvenient: there is no way to ask the other four for C++17.
 * A submission routed to one of them would reject the syntax the course teaches
 * and the learner would read it as their own program being wrong.
 *
 * So the matcher is anchored to the GCC family and the version is checked
 * against `MIN_GNU_CXX17_MAJOR`, and both halves matter. Matching by family
 * alone would land on GCC 7; matching `C++` alone would land on Clang 7. See
 * `schools/execution/cpp-runtime.ts` for where those two constants live and
 * `docs/cpp17/CPP17_JUDGE_PARITY.md` for the measurement behind them.
 */

const LANGUAGE_KEY = Symbol.for("solvex.exec.judge0.language");
type GlobalWithLanguage = typeof globalThis & {
  [LANGUAGE_KEY]?: Map<string, Promise<Judge0Language>>;
};

function languageCache(): Map<string, Promise<Judge0Language>> {
  const g = globalThis as GlobalWithLanguage;
  g[LANGUAGE_KEY] ??= new Map();
  return g[LANGUAGE_KEY];
}

/* -------------------------------------------------------------------------- */
/* The provider                                                                */
/* -------------------------------------------------------------------------- */

export interface Judge0Options {
  /** RapidAPI key. Server-only, header-only, never logged. */
  apiKey: string;
  /** The `x-rapidapi-host` value, e.g. `judge0-ce.p.rapidapi.com`. */
  host: string;
  /** Where requests go. Normally `https://` + host. */
  baseUrl: string;
  /** Operator override for the C++ language id. Skips discovery entirely. */
  languageId?: number;
  maxConcurrentRequests: number;
  /**
   * How many of those slots one learner may hold. `undefined` means no
   * per-learner bound, which is what every caller that has no learner wants.
   * See `RequestGate` for the monopolisation this closes.
   */
  maxConcurrentPerLearner?: number;
  /** First poll delay; it backs off from here. */
  pollIntervalMs: number;
  /** How long a submission may wait for a slot before we give up on the judge. */
  queueWaitMs: number;
  /** How much longer than the learner's own limit we wait for an answer. */
  overheadBudgetMs: number;
  /** `POST /submissions/batch`. MEASURED to work on this plan — see `runBatch`. */
  batchEnabled: boolean;
  /**
   * The most submissions this judge will accept in one `POST /submissions/batch`.
   *
   * `GET /config_info` on the subscribed plan reports
   * `max_submission_batch_size: 20`, and the largest block in the curriculum
   * declares 18 cases — so today nothing chunks. The bound is here anyway
   * because the alternative failure is silent and expensive: a nineteenth case
   * added to a block by an author, or a plan whose ceiling is lowered, turns
   * one whole Check into "we could not measure this" for every learner who
   * presses it, and nothing in the content pipeline would catch it.
   *
   * Optional so that the several harnesses which construct this provider by
   * hand — the live validator, four suites — do not each have to restate the
   * plan's own number. `DEFAULT_MAX_BATCH_SIZE` is what they get, and it is the
   * measured one. Production passes it explicitly from `schools/config.ts`.
   */
  maxBatchSize?: number;
}

/**
 * Which kind of billable request this is, from the URL and method alone.
 *
 * ## Why it is derived and not passed in
 *
 * `recordJudge0Request` existed, was documented in the setup runbook, was named
 * by `judge-probe.ts` as the thing feeding the quota view — and was never
 * called from anywhere. Every `judge0.*` counter read zero and
 * `providerQuota()` stayed null no matter what a deployment actually spent, so
 * the one number an operator needs on a metered plan was permanently blank.
 *
 * The obvious fix is a `kind` parameter threaded down from each caller. This is
 * better for the reason `scripts/live/wire.ts` gives for doing the same thing:
 * a request made by code that has not heard of the accounting — a retry, a
 * batch path, a phase somebody adds next year — is still classified. A
 * parameter is a thing to forget; a URL is a thing that is already there.
 *
 * Returns null for anything that is not billable-and-interesting, so
 * `/config_info` and any future endpoint are counted as requests without being
 * miscounted as submissions.
 */
function classifyJudge0Request(method: string, url: string): Judge0RequestKind | null {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return null;
  }
  if (path.endsWith("/languages")) return "language_lookup";
  if (!path.includes("/submissions")) return null;
  /* A POST creates work and is the billable unit; a GET is waiting for it.
     Batch is the same distinction at a different granularity. */
  return method.toUpperCase() === "POST" ? "submission" : "poll";
}

export class Judge0RapidApiProvider implements CodeExecutionProvider {
  readonly id = "judge0_rapidapi";
  /** Every POST and every poll is billed against a RapidAPI plan. This is the flag's whole reason for existing. */
  readonly metered = true;
  readonly describe: string;
  private readonly gate: RequestGate;

  constructor(private readonly options: Judge0Options) {
    /* Host only. `describe` is rendered by the health view and the dev lab, so
       it must be safe to put on a screen: no key, no query, no headers. */
    this.describe = `Judge0 CE via RapidAPI at ${options.host}`;
    this.gate = processGate(options.maxConcurrentRequests, options.maxConcurrentPerLearner);
  }

  /* ---------------------------------------------------------------------- */
  /* One submission                                                          */
  /* ---------------------------------------------------------------------- */

  async run(request: ExecutionRequest): Promise<ExecutionResult> {
    const started = Date.now();
    try {
      const release = await this.gate.acquire(
        this.options.queueWaitMs,
        request.signal,
        request.fairnessKey,
      );
      try {
        /* The clock for the JUDGE starts once we hold a slot. Queue time is our
           own capacity problem and has its own bound above; folding it in here
           would spend a learner's answer budget on other learners' submissions
           and then blame the judge for not answering. */
        const deadline = Date.now() + request.timeLimitMs + this.options.overheadBudgetMs;
        const language = await this.language(request.signal, deadline);
        const token = await this.submit(request, language.id, deadline);
        const submission = await this.poll(token, deadline, request.signal);
        return this.normalise(submission, started);
      } finally {
        release();
      }
    } catch (err) {
      return this.infra(err, started);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Many submissions                                                        */
  /* ---------------------------------------------------------------------- */

  /**
   * SUBMIT's hidden cases, run without paying for four serial round trips.
   *
   * Piston answers in one request, so `runCases`' sequential loop costs one RTT
   * per case. Judge0 is POST-then-poll across a continent, so the same loop
   * costs four post-and-poll cycles end to end — enough that a learner watches
   * a spinner for several seconds after pressing Check.
   *
   * Two implementations, and the one that is ON is now the batch:
   *
   * - **Bounded parallelism (`JUDGE0_BATCH=false`).** N ordinary submissions
   *   issued at once, held to `JUDGE0_MAX_CONCURRENT_REQUESTS` by the same
   *   process-wide gate as everything else. Uses only endpoints this file
   *   already depends on. Kept as the escape hatch, not as the default.
   * - **`POST /submissions/batch` (default ON).** One POST for every case and
   *   one poll loop for all of them.
   *
   * ## Why the default flipped, measured
   *
   * The bounded-parallelism path takes one gate slot PER CASE, and the gate is
   * 2 in production. The median code block declares 8 cases, so a median Check
   * was 8 submissions in 4 sequential waves. Measured end to end against the
   * real service on `m2.l6.b6` (8 cases, its own reference solution, the same
   * `runCases` and the same checker):
   *
   * | | wall clock | billable HTTP requests |
   * |---|---|---|
   * | `JUDGE0_BATCH=false`, gate 2 | **9 746 ms** | 30 (8 POST + 22 polls) |
   * | `JUDGE0_BATCH=true` | **2 668 ms** | 4 (1 POST + 3 polls) |
   *
   * Same eight cases, same judge, same output checking, and the eight verdicts
   * were byte-identical between the two runs. Nothing is skipped, nothing is
   * trusted that was not trusted before, and no case is dropped — the only
   * thing that changed is how many round trips the same work is spread over.
   * `docs/infrastructure/JUDGE0_LIVE_VALIDATION.md` §3 records the plan
   * advertising `enable_batched_submissions: true`; the run above is the plan
   * actually honouring it (HTTP 201, correct results, no 429).
   *
   * Note which counter it spends: the service decremented
   * `x-ratelimit-batched-submissions-remaining` and left
   * `x-ratelimit-submissions-remaining` alone, so a batch is not simply N
   * singles as far as the marketplace is concerned.
   *
   * ## What the batch costs, honestly
   *
   * Both paths preserve what `runCases` promises. The visible result of an
   * outage is identical — the first infrastructure failure, in case order,
   * stops the report and nothing is recorded about the learner. What differs is
   * spend: a batch has already paid for case 4 by the time it learns case 1
   * failed. That is a handful of requests during an outage, traded for a Check
   * that answers in one round trip instead of four.
   *
   * The gate also changes meaning, and for the better. A slot used to be one
   * CASE; it is now one learner's whole Check. Eighteen learners pressing Check
   * at once used to queue 144 submissions through a gate of 2 (72 waves); they
   * now queue 18 batches through it (9 waves), and each wave sends four
   * requests rather than thirty. Raising `JUDGE0_MAX_CONCURRENT_REQUESTS` is
   * therefore NOT part of this change: the plan's real rate limit is still
   * unknown (`x-ratelimit-*-limit` arrives as `0` with a negative
   * `remaining`, which is unreadable), and the safe direction for an unknown
   * ceiling is still well under it. This change lowers the request rate at the
   * same gate; raising the gate would raise it against a ceiling nobody has
   * read.
   */
  async runBatch(requests: readonly ExecutionRequest[]): Promise<ExecutionResult[]> {
    if (requests.length === 0) return [];
    if (requests.length === 1) return [await this.run(requests[0])];
    if (!this.options.batchEnabled) {
      return Promise.all(requests.map((r) => this.run(r)));
    }

    /*
     * Chunked at the plan's declared ceiling.
     *
     * `max_submission_batch_size` is 20 on this plan and the largest block in
     * the curriculum declares 18 cases, so in practice there is exactly one
     * chunk and this loop is a no-op. It exists because the failure it prevents
     * is invisible until it happens to a class: a batch one case over the
     * ceiling is refused WHOLE, which `runCases` reads as "the judge did not
     * answer" and reports to every learner as unmeasured. Chunking turns a
     * cliff into a second round trip.
     */
    const size = Math.max(1, Math.floor(this.options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE));
    if (requests.length <= size) return this.runBatchEndpoint(requests);

    const chunks: ExecutionRequest[][] = [];
    for (let i = 0; i < requests.length; i += size) chunks.push(requests.slice(i, i + size));
    /* Through the gate, like everything else — `runBatchEndpoint` acquires its
       own slot per chunk, so a 41-case block is three queued batches and not
       three simultaneous ones on a gate of 2. */
    const settled = await Promise.all(chunks.map((chunk) => this.runBatchEndpoint(chunk)));
    return settled.flat();
  }

  /* ---------------------------------------------------------------------- */
  /* What language are we even running                                       */
  /* ---------------------------------------------------------------------- */

  /**
   * Which Judge0 language id is a C++17-capable GCC — asked once per process,
   * of the judge.
   *
   * **Not hardcoded, deliberately.** The id differs between Judge0 deployments
   * and moves as the hosted catalogue is rebuilt; a constant copied out of a
   * blog post is how a submission ends up on GCC 7 and reports structured
   * bindings as a syntax error. `MEASURED_JUDGE0_CPP_LANGUAGE_ID` records what
   * this deployment answered so a probe can compare, and nothing submits with
   * it.
   *
   * A failure here is a PROVIDER ERROR, never a fallback to a guess. A judge
   * that cannot tell us what it runs is a judge whose results we cannot
   * attribute to a compiler, and evidence recorded about a child under an
   * unknown toolchain is worth less than no evidence at all. That is also why
   * `discoverLanguage` refuses an old GCC outright rather than taking the best
   * of a bad catalogue: see its own comment.
   *
   * ## The version, honestly
   *
   * Local Run is Clang 8.0.1 targeting wasm32-wasi with `-std=c++17` passed
   * explicitly; this side is GCC, relying on its default. They are two
   * compilers six years apart and the evidence that they agree on the
   * curriculum's surface is a manual pass recorded in
   * `docs/cpp17/CPP17_JUDGE_PARITY.md`, not a property this function can
   * assert. It reports what it found rather than what we would like it to be.
   */
  async language(signal?: AbortSignal, deadline?: number): Promise<Judge0Language> {
    const override = this.options.languageId;
    if (override !== undefined) {
      /* An id with no name behind it. Supported because an operator may need to
         pin a runtime the discovery rule would not pick, but it costs the one
         thing discovery buys: nothing here can then say which interpreter
         produced a learner's evidence. */
      return { id: override, name: `language id ${override}`, version: null, operatorOverride: true };
    }

    const cache = languageCache();
    const key = this.options.baseUrl;
    const cached = cache.get(key);
    if (cached) return cached;

    const inFlight = this.discoverLanguage(signal, deadline);
    cache.set(key, inFlight);
    /* Only SUCCESS is cached. A discovery that failed on a 429 or a dead
       gateway must not poison the process for its whole lifetime — the next
       submission asks again. */
    inFlight.catch(() => cache.delete(key));
    return inFlight;
  }

  private async discoverLanguage(
    signal?: AbortSignal,
    deadline?: number,
  ): Promise<Judge0Language> {
    const body = await this.httpJson(
      `${this.options.baseUrl}/languages`,
      { method: "GET" },
      deadline ?? Date.now() + this.options.overheadBudgetMs,
      signal,
    );

    if (!Array.isArray(body)) {
      throw new Judge0Failure("provider_error", "the judge did not list its languages");
    }

    const candidates: Judge0Language[] = [];
    /* Kept only to tell two failures apart below: a judge with no C++ at all is
       a different problem from a judge whose C++ is all too old to be told
       which standard to use. */
    let rejectedForAge = 0;

    for (const entry of body) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as { id?: unknown; name?: unknown };
      if (typeof record.id !== "number" || typeof record.name !== "string") continue;
      const match = JUDGE0_CPP_NAME.exec(record.name.trim());
      if (!match) continue;

      /* The floor, and it is a REFUSAL rather than a preference.
         `compiler_options` is 403 on this plan, so a GCC older than 11 cannot
         be asked for `-std=c++17`; it would compile the course's own syntax as
         C++14 and report the learner wrong for writing what they were taught.
         Silently taking it because it was the only C++ on offer is the exact
         shape of failure this whole function exists to prevent. */
      const major = Number.parseInt(match[1].split(".")[0], 10);
      if (!Number.isFinite(major) || major < MIN_GNU_CXX17_MAJOR) {
        rejectedForAge += 1;
        continue;
      }

      candidates.push({
        id: record.id,
        name: record.name.trim(),
        version: match[1],
        operatorOverride: false,
      });
    }

    if (candidates.length === 0) {
      throw new Judge0Failure(
        "provider_error",
        rejectedForAge > 0
          ? "the judge offers no GCC new enough to default to C++17, and this plan " +
            "refuses compiler_options, so the standard cannot be requested"
          : "the judge offers no GNU C++ runtime",
      );
    }

    /* Highest version wins, compared numerically rather than as strings —
       "9.2" must not beat "14.1". Newest is the right default for a course
       whose browser half is C++17 throughout; an operator who needs a
       different one has `JUDGE0_LANGUAGE_ID`. */
    candidates.sort((a, b) => compareVersions(b.version ?? "", a.version ?? ""));
    return candidates[0];
  }

  /* ---------------------------------------------------------------------- */
  /* POST                                                                    */
  /* ---------------------------------------------------------------------- */

  private submissionBody(request: ExecutionRequest, languageId: number): Record<string, unknown> {
    return {
      language_id: languageId,
      /* The SOURCE is encoded too, not only the output read back: a learner's
         program carries Kazakh in its string literals and its comments. */
      source_code: b64encode(request.sourceCode),
      stdin: b64encode(request.stdin),

      /* ── The unit conversions, which are the classic silent bug ──────────
         `ExecutionRequest` speaks MILLISECONDS and MEGABYTES, because that is
         what the rest of this system speaks. Judge0 speaks SECONDS (a float)
         and KILOBYTES. Send 5000 where 5 was meant and the judge either
         refuses the submission or — worse, on a plan that clamps — silently
         applies its own default, so a learner's five-second budget quietly
         becomes two and a correct-but-unoptimised program is recorded as too
         slow. Nothing downstream can detect that; it just looks like the
         child was wrong. */
      cpu_time_limit: request.timeLimitMs / 1000,
      wall_time_limit: request.timeLimitMs / 1000 + WALL_TIME_MARGIN_SECONDS,
      memory_limit: request.memoryLimitMb * 1024,

      /* Judge0 CE's shipped default for this is TRUE — the unsafe direction,
         and the mechanism behind CVE-2024-29021 (SSRF out of the sandbox into
         Judge0's own Postgres). We send it explicitly on every submission
         rather than trusting a hosted deployment's configuration. It also
         matters pedagogically: `schools/execution/cpp-runtime.ts` enforces
         "standard library only" by the judge having nothing to fetch a library
         from. */
      enable_network: false,

      /* Explicit, because the default flipping would be invisible and fatal:
         merged stderr would put a compiler warning into the stdout our checker
         compares, and a program that printed the right answer would be marked
         wrong for something the toolchain wrote to the other stream. */
      redirect_stderr_to_stdout: false,

      /* `compiler_options` is NOT here, and cannot be.
         It is refused with HTTP 403 on this RapidAPI plan — measured, not
         assumed. The standard therefore has to come from the compiler's own
         default, which is the entire reason `discoverLanguage` insists on
         GCC 11 or newer: `gnu++17` by default is the only way this product
         gets C++17 out of this judge. If a future plan allows the field, the
         floor can be relaxed — but not before, and not by adding the option
         here and hoping. */

      /* `expected_output` is NOT here and must never be. See the file header:
         SolveX's checker is authoritative, and the answer key does not go to a
         marketplace vendor. */
    };
  }

  private async submit(
    request: ExecutionRequest,
    languageId: number,
    deadline: number,
  ): Promise<string> {
    /* `wait=false` is not a preference. Judge0's own documentation says the
       synchronous mode may be disabled by the operator and is not recommended
       at scale — on a plan where it is off, `wait=true` silently returns a
       queued submission with empty stdout, which the checker then compares
       against the expected output and calls wrong. Async plus polling is the
       mode that behaves the same everywhere.

       `base64_encoded=true` because the service demands it: a poll for a program
       printing Kazakh comes back HTTP 400 without it, with the judge itself
       naming base64 as the remedy. Measured against RapidAPI, not inferred —
       see `b64encode`. */
    const body = await this.httpJson(
      `${this.options.baseUrl}/submissions?base64_encoded=true&wait=false`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(this.submissionBody(request, languageId)),
      },
      deadline,
      request.signal,
      /* A POST is NOT retried, at any level, ever. A network error after the
         request left us is ambiguous — the submission may well have been
         created — and a blind retry then runs the learner's program twice,
         spends twice the quota, and leaves an orphan running against the plan's
         concurrency. An ambiguous POST is reported as an infrastructure failure
         and the learner presses Check again, which is the one retry that is
         actually informed. */
      "the judge did not accept the submission",
    );

    const token = (body as { token?: unknown })?.token;
    if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
      throw new Judge0Failure("provider_error", "the judge answered without a usable token");
    }
    return token;
  }

  /* ---------------------------------------------------------------------- */
  /* Poll                                                                    */
  /* ---------------------------------------------------------------------- */

  private async poll(
    token: string,
    deadline: number,
    signal?: AbortSignal,
  ): Promise<Judge0Submission> {
    /* `encodeURIComponent` on top of `TOKEN_PATTERN`, which already forbids
        anything that would need escaping. Two guards on a value from a remote
        service that becomes part of our next URL is not paranoia, it is cheap. */
    const url =
      `${this.options.baseUrl}/submissions/${encodeURIComponent(token)}` +
      `?base64_encoded=true&fields=${POLL_FIELDS}`;

    let interval = this.options.pollIntervalMs;
    let consecutiveFailures = 0;

    for (;;) {
      /* Wait BEFORE the first GET. A submission accepted a millisecond ago has
         not run yet, so an immediate poll spends a billable request to be told
         "In Queue" — a fact we already know. */
      await sleep(Math.min(interval, remaining(deadline)), signal);
      if (Date.now() >= deadline) {
        throw new Judge0Failure("provider_timeout", "the judge did not answer in time");
      }

      let body: unknown;
      try {
        body = await this.httpJson(url, { method: "GET" }, deadline, signal, "the judge stopped answering");
      } catch (err) {
        /* A GET is idempotent, so a dropped connection is worth one more try —
           but a rate limit, a bad key or a timeout are answers, not noise, and
           retrying them spends quota to be refused again. */
        if (!(err instanceof Judge0Failure) || err.execStatus !== "provider_error") throw err;
        consecutiveFailures += 1;
        if (consecutiveFailures > MAX_CONSECUTIVE_POLL_FAILURES) throw err;
        interval = Math.min(interval * POLL_BACKOFF, MAX_POLL_INTERVAL_MS);
        continue;
      }
      consecutiveFailures = 0;

      if (typeof body !== "object" || body === null) {
        throw new Judge0Failure("provider_error", "the judge answered with something unreadable");
      }
      const submission = body as Judge0Submission;
      const statusId = submission.status_id;
      if (typeof statusId !== "number") {
        throw new Judge0Failure("provider_error", "the judge answered without a status");
      }
      if (!isPending(statusId)) return submission;

      interval = Math.min(interval * POLL_BACKOFF, MAX_POLL_INTERVAL_MS);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Normalisation — Judge0's vocabulary in, ours out                        */
  /* ---------------------------------------------------------------------- */

  private normalise(submission: Judge0Submission, started: number): ExecutionResult {
    const statusId = typeof submission.status_id === "number" ? submission.status_id : -1;
    /* Decoded BEFORE the cap, so `maxOutputBytes` bounds what the learner
       actually printed rather than its base64 inflation — 64 KiB of base64 is
       48 KiB of output, and a ceiling that shrank by a third depending on the
       wire format would be a different promise on each provider. */
    const rawStdout = b64decode(submission.stdout);
    const rawStderr = b64decode(submission.stderr);
    const compileOutput = b64decode(submission.compile_output);
    const out = cap(rawStdout, rawStderr);

    const base = {
      stdout: out.stdout,
      /* The judge's shell is not the learner's error. See
         `sanitizeJudgeStderr` — measured live, not assumed. */
      stderr: sanitizeJudgeStderr(out.stderr),
      exitCode: typeof submission.exit_code === "number" ? submission.exit_code : null,
      /* The round trip, as every other provider reports it — deliberately NOT
         Judge0's `time`, which is the learner's CPU seconds. A field that means
         "how long the judge took" for two providers and "how long the program
         took" for a third is a field nobody can read. `memory` below has no
         such ambiguity, so it IS reported: this is the first provider in the
         system that can answer it at all. */
      timeMs: Date.now() - started,
      memoryKb: typeof submission.memory === "number" ? submission.memory : null,
      infrastructureError: false,
      providerId: this.id,
    };

    switch (statusId) {
      case JUDGE0.ACCEPTED:
        return { ...base, status: "ok" };

      /* Judge0 compares stdout to `expected_output` and reports id 4 when they
         differ — a comparison we never ask for, because our checker owns it.
         Reaching this case therefore means someone started sending
         `expected_output`, and the safe reading is that the program RAN: `ok`,
         and SolveX's checker decides pass or fail exactly as it does for id 3.
         Mapping it to a failure would let a vendor's whitespace rules quietly
         overrule the curriculum's. */
      case JUDGE0.WRONG_ANSWER:
        return { ...base, status: "ok" };

      /* THE LEARNER'S program, over its own limit. Evidence — December's whole
         month is about making programs fast — and never to be confused with our
         `fetch` giving up, which is `provider_timeout` and says nothing about
         anybody. */
      case JUDGE0.TIME_LIMIT_EXCEEDED:
        return { ...base, status: "time_limit_exceeded" };

      /* The ordinary way a C++ mistake arrives. Judge0 puts the compiler's own
         diagnostics in `compile_output`, its own field, rather than on stderr —
         so this is STRUCTURAL evidence that the program never ran, and no
         heuristic over error prose is needed on any path (see the note where
         `looksLikeCompileError` used to be, in `../provider.ts`).
         The diagnostics are the useful text here, so they take the place of a
         stderr that is empty anyway. */
      case JUDGE0.COMPILATION_ERROR: {
        const compiled = cap(rawStdout, compileOutput || rawStderr);
        return { ...base, stdout: compiled.stdout, stderr: compiled.stderr, status: "compile_error" };
      }

      /* SIGXFSZ: the program wrote more than the judge allows.
         `ExecutionStatus` has no output-limit member — the browser runtime
         has `output_limit_exceeded` and the server side deliberately does not,
         a divergence recorded in `tests/execution/parity-fixtures.ts`. So this
         lands on `runtime_error`, which is at least honest about the half that
         matters: it is the learner's program that did it, so it is evidence.
         Giving the port its own member would be a change to the port and to
         both other providers, not something for this file to invent. */
      case JUDGE0.SIGXFSZ:
        return { ...base, status: "runtime_error" };

      case JUDGE0.SIGSEGV:
      case JUDGE0.SIGFPE:
      case JUDGE0.SIGABRT:
      case JUDGE0.NZEC:
      case JUDGE0.RUNTIME_ERROR_OTHER: {
        /* Judge0 CE has no memory-limit status of its own: a program killed on
           `memory_limit` surfaces as one of these signals with the reason in
           `message`, and a C++ program whose allocation fails surfaces as an
           uncaught `std::bad_alloc` — an ordinary abort. Both are the learner's
           program asking for more memory than it may have, which is what
           `memory_limit_exceeded` means. The
           heuristic is narrow and both branches are evidence either way, so
           getting it wrong costs precision, not truthfulness. */
        /* Also base64 under this flag. Read raw it would never match
           /memory limit/i, and an MLE would normalise as a plain runtime
           error — the learner told their program crashed when it ran out of
           memory. */
        if (looksLikeMemoryLimit(b64decode(submission.message), rawStderr)) {
          return { ...base, status: "memory_limit_exceeded" };
        }
        /* A non-zero exit or a signal from a program that DID compile — the
           judge would have answered status 6 otherwise. So this is the
           learner's program crashing, and there is nothing to guess: a C++
           compile error cannot reach this branch.
           This used to consult a shared `looksLikeCompileError` heuristic over
           stderr, which existed because CPython reports a SyntaxError as an
           ordinary non-zero exit. With a real compile stage that reading would
           now be a liability rather than a safeguard — a program that prints
           the word `error:` would be reported as never having started. */
        return { ...base, status: "runtime_error" };
      }

      /* Judge0's own bad day. NOT the learner's, so nothing here is recorded
         about them — and `message` is Judge0's internal text, which is exactly
         the sort of string `teacherOutcome` exists to keep out of a classroom.
         It is dropped, not forwarded. */
      case JUDGE0.INTERNAL_ERROR:
        return infraResult(this.id, started, "the judge failed to run this", "provider_error");
      case JUDGE0.EXEC_FORMAT_ERROR:
        return infraResult(this.id, started, "the judge could not start the program", "provider_error");

      default:
        /* A status id this build does not know. It must not become a verdict:
           an unknown answer from a judge is an unknown, and the only safe thing
           to say about a learner is nothing. */
        return infraResult(this.id, started, "the judge answered with an unknown status", "provider_error");
    }
  }

  /* ---------------------------------------------------------------------- */
  /* The batch endpoints — off by default, UNVERIFIED                        */
  /* ---------------------------------------------------------------------- */

  private async runBatchEndpoint(requests: readonly ExecutionRequest[]): Promise<ExecutionResult[]> {
    const started = Date.now();
    const signal = requests.find((r) => r.signal)?.signal;
    /* One batch is one learner's Check, so every request in it carries the same
       fairness key. Taking the first rather than asserting they agree: a caller
       that mixed learners into one batch has a bigger problem than fairness,
       and `runCases` — the only caller — builds a batch from one submission. */
    const fairnessKey = requests[0]?.fairnessKey;
    try {
      const release = await this.gate.acquire(this.options.queueWaitMs, signal, fairnessKey);
      try {
        /* Every case in the batch may need its own full time limit, and the
           judge may well run them one after another on a single worker, so the
           budget is the sum rather than the maximum. Bounded either way — this
           cannot wait forever. */
        const budget = requests.reduce((ms, r) => ms + r.timeLimitMs, 0);
        const deadline = Date.now() + budget + this.options.overheadBudgetMs;
        const language = await this.language(signal, deadline);

        const created = await this.httpJson(
          `${this.options.baseUrl}/submissions/batch?base64_encoded=true`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              submissions: requests.map((r) => this.submissionBody(r, language.id)),
            }),
          },
          deadline,
          signal,
          "the judge did not accept the submissions",
        );

        if (!Array.isArray(created) || created.length !== requests.length) {
          /* A batch that came back the wrong length cannot be mapped onto the
             cases that asked for it, and guessing an alignment would attribute
             one learner's result to another's test case. */
          throw new Judge0Failure("provider_error", "the judge answered with the wrong number of results");
        }

        const tokens = created.map((entry) => {
          const token = (entry as { token?: unknown })?.token;
          return typeof token === "string" && TOKEN_PATTERN.test(token) ? token : null;
        });

        const submissions = await this.pollBatch(tokens, deadline, signal);
        return submissions.map((submission) =>
          submission === null
            ? infraResult(this.id, started, "the judge did not run this case", "provider_error")
            : this.normalise(submission, started),
        );
      } finally {
        release();
      }
    } catch (err) {
      /* One failure, repeated per case. `runCases` stops at the first one, so
         what a learner sees is a single "nothing was measured" — which is the
         truth about all of them. */
      return requests.map(() => this.infra(err, started));
    }
  }

  private async pollBatch(
    tokens: readonly (string | null)[],
    deadline: number,
    signal?: AbortSignal,
  ): Promise<(Judge0Submission | null)[]> {
    const wanted = tokens.filter((t): t is string => t !== null);
    if (wanted.length === 0) {
      throw new Judge0Failure("provider_error", "the judge created no submissions");
    }
    const url =
      `${this.options.baseUrl}/submissions/batch?base64_encoded=true` +
      `&tokens=${wanted.map(encodeURIComponent).join(",")}&fields=${POLL_FIELDS},token`;

    let interval = this.options.pollIntervalMs;
    const byToken = new Map<string, Judge0Submission>();

    for (;;) {
      await sleep(Math.min(interval, remaining(deadline)), signal);
      if (Date.now() >= deadline) {
        throw new Judge0Failure("provider_timeout", "the judge did not answer in time");
      }

      const body = await this.httpJson(url, { method: "GET" }, deadline, signal, "the judge stopped answering");
      const list = (body as { submissions?: unknown })?.submissions;
      if (!Array.isArray(list)) {
        throw new Judge0Failure("provider_error", "the judge answered with something unreadable");
      }

      let pending = false;
      for (const entry of list) {
        if (typeof entry !== "object" || entry === null) continue;
        const submission = entry as Judge0Submission & { token?: unknown };
        const statusId = submission.status_id;
        if (typeof statusId !== "number") continue;
        if (isPending(statusId)) {
          pending = true;
          continue;
        }
        if (typeof submission.token === "string") byToken.set(submission.token, submission);
      }

      if (!pending && byToken.size >= wanted.length) {
        return tokens.map((t) => (t === null ? null : byToken.get(t) ?? null));
      }
      interval = Math.min(interval * POLL_BACKOFF, MAX_POLL_INTERVAL_MS);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* HTTP                                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * One request, with the vendor headers, our own ceiling, and every HTTP
   * failure turned into a `Judge0Failure` carrying a sentence written here.
   *
   * The key goes in a header and only in a header — never a query parameter,
   * never a log line, never a message. Nothing derived from the response body
   * is put into a thrown message, because those messages end up in
   * `ExecutionResult.stderr` and that reaches a browser.
   */
  private async httpJson(
    url: string,
    init: { method: string; headers?: Record<string, string>; body?: string },
    deadline: number,
    signal?: AbortSignal,
    failureMessage = "could not reach the judge",
  ): Promise<unknown> {
    const kind = classifyJudge0Request(init.method, url);
    const controller = new AbortController();
    const ourCeiling = setTimeout(() => controller.abort(), Math.max(remaining(deadline), 1));
    const onAbort = () => controller.abort();
    signal?.addEventListener("abort", onAbort);

    try {
      const res = await fetch(url, {
        method: init.method,
        headers: {
          ...init.headers,
          /* The two RapidAPI headers, and the only place either appears. */
          "x-rapidapi-key": this.options.apiKey,
          "x-rapidapi-host": this.options.host,
        },
        body: init.body,
        signal: controller.signal,
      });

      /* Counted on the way past, before the status is judged, so a 429 and a
         401 are counted exactly like a 200. The quota headers ride on the
         failures too — often only on them — and an accounting that skipped
         them would go blank at the moment an operator most needs it.
         `recordJudge0Request` never throws and never awaits; see its own
         comment for why that is a requirement and not a convenience. */
      if (kind) recordJudge0Request({ kind, httpStatus: res.status, headers: res.headers });

      if (!res.ok) throw this.httpFailure(res.status, failureMessage);
      return (await res.json()) as unknown;
    } catch (err) {
      if (err instanceof Judge0Failure) throw err;
      /* OUR request gave up. The judge said nothing, so we know nothing about
         the learner's program — in particular, not that it was slow. */
      const aborted = err instanceof Error && err.name === "AbortError";
      /* A request that never got a response is still a request. `httpStatus:
         null` is the honest record and `judge0-usage.ts` counts it as a
         failure rather than inventing a 5xx — "the judge answered 502" and
         "the judge did not answer" are different afternoons. */
      if (kind) recordJudge0Request({ kind, httpStatus: null, headers: null });
      throw new Judge0Failure(
        aborted ? "provider_timeout" : "provider_error",
        aborted ? "the judge did not answer in time" : failureMessage,
      );
    } finally {
      clearTimeout(ourCeiling);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  /**
   * HTTP status → our vocabulary, with a sentence that carries no secret.
   *
   * The response BODY is never read here. A RapidAPI error body can name the
   * plan, the subscription and occasionally the key prefix, and this string
   * ends up in `ExecutionResult.stderr`, which `/api/exec/run` returns to a
   * browser. The numeric status is enough for whoever is on call, and
   * `teacherOutcome` keeps even that away from a classroom.
   */
  private httpFailure(status: number, fallback: string): Judge0Failure {
    /* 429 gets its own `ExecutionStatus` member, and it earns it: over quota is
       not "the judge is broken". It self-heals, it is the single most likely
       failure for a class on a marketplace plan, and the operator action —
       wait, or buy more — is the opposite of the one for a dead judge. Folding
       it into `provider_error` would leave the health view unable to tell those
       apart. It is still not evidence: nothing is recorded about the learner. */
    if (status === 429) {
      return new Judge0Failure("provider_rate_limited", "the judge is over its request limit");
    }
    /* A key that is missing, wrong, or not subscribed to this API. A
       configuration failure that will affect every learner identically until
       someone fixes it — and the one place where echoing the provider's own
       body would be most tempting and most dangerous. */
    if (status === 401 || status === 403) {
      return new Judge0Failure("provider_error", "the judge refused our credentials");
    }
    /* Most likely a limit above what the plan allows — `cpu_time_limit` or
       `memory_limit` over its ceiling. Ours to fix, not the learner's. */
    if (status === 400 || status === 422) {
      return new Judge0Failure("provider_error", `the judge refused the request (${status})`);
    }
    return new Judge0Failure("provider_error", `${fallback} (${status})`);
  }

  /** Every failure path ends here, as a result that records nothing about anybody. */
  private infra(err: unknown, started: number): ExecutionResult {
    if (err instanceof Judge0Failure) {
      return infraResult(this.id, started, err.safeMessage, err.execStatus);
    }
    return infraResult(this.id, started, "could not reach the judge", "provider_error");
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The output ceiling, applied to what the judge hands back.
 *
 * `EXECUTION_LIMITS.maxOutputBytes` is the number the rest of the system is
 * written against, and a remote judge hands over a finished body rather than a
 * stream — so without this a `while True: print(x)` comes back whole, goes into
 * memory once per test case per learner, and `/api/exec/run` returns it
 * verbatim to a browser.
 *
 * Truncating cannot turn a pass into a fail — no declared expected output is
 * within three orders of magnitude of 64 KB — and the marker is worded exactly
 * as the local provider's and Piston's so a learner sees one explanation, not
 * three.
 */
function cap(stdout: string, stderr: string): { stdout: string; stderr: string } {
  const limit = EXECUTION_LIMITS.maxOutputBytes;
  if (stdout.length <= limit && stderr.length <= limit) return { stdout, stderr };
  return {
    stdout: stdout.slice(0, limit),
    stderr: `${stderr.slice(0, limit)}\n[output truncated]`,
  };
}

function infraResult(
  providerId: string,
  started: number,
  message: string,
  status: InfrastructureStatus,
): ExecutionResult {
  return {
    status,
    stdout: "",
    stderr: message,
    exitCode: null,
    timeMs: Date.now() - started,
    memoryKb: null,
    infrastructureError: true,
    providerId,
  };
}

/**
 * Judge0 speaks base64, and it is not optional.
 *
 * ## Measured against the real service, not assumed
 *
 * With `base64_encoded=true` the service answers a poll for
 * `print("Сәлем, әлем!")` with **HTTP 400** and its own explanation:
 *
 *     some attributes for this submission cannot be converted to UTF-8,
 *     use base64_encoded=true query parameter
 *
 * The same program under `base64_encoded=true` returns `Сәлем, әлем!` exactly.
 *
 * For a Kazakh curriculum this is not an edge case — it is most of what a
 * learner will ever print. Unfixed, every program printing Kazakh comes back
 * `provider_error`, and the learner is told verification is unavailable for a
 * program that ran perfectly.
 *
 * This file used to argue that base64 "would be a change to both the query
 * string and the decoding, not a flag". That was right, and it is the change
 * made here — in both directions, because a request encoded one way and read
 * the other is worse than either alone.
 */
function b64encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

/**
 * Decode one field the judge base64-encoded.
 *
 * Lenient on purpose: Judge0 sends `null` for a field a run never produced, and
 * a decode that threw would turn a formatting surprise into a failed
 * submission. What arrives is either valid base64 or is read as empty — never
 * as a reason to mark a learner wrong.
 */
function b64decode(value: unknown): string {
  if (typeof value !== "string" || value === "") return "";
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return "";
  }
}

/**
 * Did the judge kill this for memory?
 *
 * Narrow on purpose. `std::bad_alloc` is the C++ runtime's own, thrown when an
 * allocation fails and printed by the default terminate handler; "memory limit
 * exceeded" is isolate's wording when the cgroup ceiling is hit. Anything
 * vaguer would start reading ordinary crashes as memory failures, and both
 * readings are learner evidence anyway — so the cost of being conservative is a
 * less precise message, and the cost of being greedy is a wrong one.
 */
function looksLikeMemoryLimit(message: string, stderr: string): boolean {
  return /memory limit/i.test(message) || /\bbad_alloc\b/.test(stderr);
}

/** `14.1` beats `9.2`. String comparison gets that backwards. */
function compareVersions(a: string, b: string): number {
  const left = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const right = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Milliseconds left before we stop waiting on the judge. Never negative. */
function remaining(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

/** A pause that a cancelled request can cut short, rather than sitting out. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      done();
      reject(new Judge0Failure("provider_timeout", "the run was cancelled"));
    };
    const timer = setTimeout(() => {
      done();
      resolve();
    }, ms);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort);
  });
}

/* -------------------------------------------------------------------------- */
/* Construction                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Built from configuration, and refuses to exist without a key.
 *
 * Throwing here rather than constructing a provider that 401s on every
 * submission: `executionProviderProblems` already makes a missing key a boot
 * failure in production, and this is the same refusal for the deployments that
 * check is not asked about. A judge that cannot authenticate is not a judge
 * with a problem, it is not a judge.
 */
export function judge0FromConfig(): Judge0RapidApiProvider {
  const { judge0 } = config.exec;
  if (!judge0.apiKey) {
    throw new Error("EXEC_PROVIDER=judge0_rapidapi but JUDGE0_RAPIDAPI_KEY is not set.");
  }
  return new Judge0RapidApiProvider({
    apiKey: judge0.apiKey,
    host: judge0.host,
    baseUrl: judge0.baseUrl,
    languageId: judge0.languageId,
    maxConcurrentRequests: judge0.maxConcurrentRequests,
    maxConcurrentPerLearner: judge0.maxConcurrentPerLearner,
    pollIntervalMs: judge0.pollIntervalMs,
    queueWaitMs: judge0.queueWaitMs,
    overheadBudgetMs: judge0.overheadBudgetMs,
    batchEnabled: judge0.batchEnabled,
    maxBatchSize: judge0.maxBatchSize,
  });
}
