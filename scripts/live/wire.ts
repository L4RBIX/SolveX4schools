/**
 * The meter: every HTTP request this process sends to the judge, counted and
 * bounded at the socket.
 *
 * ## Why this exists rather than reading the ops counters
 *
 * `schools/ops/judge0-usage.ts` counts the same traffic from inside the
 * provider. When this file was written it counted nothing at all —
 * `recordJudge0Request` had no caller, so every `judge0.*` counter read `0`
 * however much a deployment spent — and measuring at `fetch` was the only way
 * to get a number that was not a confident zero. That has since been wired
 * (`classifyJudge0Request` in `providers/judge0.ts`), so the original reason is
 * gone and a better one remains:
 *
 * The two meters are INDEPENDENT. This one sits below the adapter and counts
 * what actually left the process — including a retry, a batch path, or a phase
 * added next year that has never heard of it. The ops counters sit inside and
 * count what the adapter believes it did. A validator that read the adapter's
 * own opinion of its spend could not detect the adapter being wrong about it,
 * and a disagreement between the two is exactly the finding worth having.
 *
 * Wiring `recordJudge0Request` into `judge0.ts` would be the real fix. It is one
 * call site in a file this unit does not own, and it is reported rather than
 * made.
 *
 * ## The ceiling
 *
 * `--max-submissions` is enforced HERE and not only in the orchestrator, because
 * an orchestrator-only ceiling is a ceiling that a provider's retry, a batch
 * that fans out, or a phase somebody adds later can walk straight through. A
 * POST that would cross the line never reaches the network: the wrapper throws
 * before calling the real `fetch`, the adapter turns that into an ordinary
 * infrastructure failure, and the run records that it stopped rather than that
 * the judge broke.
 *
 * ## What is read off a response, and what is refused
 *
 * Read: the numeric status, the elapsed milliseconds, and header values whose
 * NAME begins with `x-ratelimit-` (plus `retry-after`). That allowlist is the
 * whole of it, and it is the same shape `schools/ops/provider-quota.ts` reasons
 * about.
 *
 * Never read, never stored, never returned: request headers of any kind — which
 * is where the key lives — request or response bodies, tokens, source code,
 * stdin, stdout. The meter's job is arithmetic, not evidence.
 */

/** What a request was for. Judge0's endpoints, in this system's words. */
export type RequestKind =
  /** `POST /submissions` — one program, one billable submission. */
  | "submission"
  /** `POST /submissions/batch` — N programs in one request, N submissions. */
  | "batch_submission"
  /** `GET /submissions/{token}` — waiting for an answer. Billable, not a submission. */
  | "poll"
  /** `GET /submissions/batch?tokens=…` — the same wait, for a batch. */
  | "batch_poll"
  /** `GET /languages` — discovery. */
  | "language_lookup"
  /** `GET /config_info` — the plan's own declared ceilings. */
  | "config_info"
  /** Anything else we sent to the judge's host. Should be empty; recorded if not. */
  | "other";

export interface WireRecord {
  kind: RequestKind;
  /** How many billable submissions this one request created. 0 for a poll. */
  submissions: number;
  /** The judge's HTTP status, or `null` when there never was a response. */
  status: number | null;
  /** When the request left, relative to the meter being installed. */
  startedAtMs: number;
  /** Round trip, as this process measured it. */
  elapsedMs: number;
}

/** Header values worth keeping, under the vendor's own names, verbatim. */
export type RateLimitHeaders = Readonly<Record<string, string>>;

export interface MeterState {
  /** Billable submissions created so far. The number the ceiling bounds. */
  submissions: number;
  /** Every HTTP request that left for the judge, whatever it was for. */
  apiRequests: number;
  polls: number;
  languageLookups: number;
  /** HTTP 429s seen. Its own number: over quota is not "the judge is broken". */
  rateLimited: number;
  /** Non-2xx that were not 429, plus requests that never got a response at all. */
  failures: number;
  /** POSTs the ceiling refused before they reached the network. */
  ceilingRefusals: number;
}

/**
 * The names of every `x-ratelimit-*` header seen on any response, and the last
 * value observed for each.
 *
 * Kept as the vendor wrote them, because "which headers does this plan actually
 * send" is one of the questions the run exists to answer, and normalising them
 * into our three fields — which `provider-quota.ts` rightly does for the health
 * view — would throw away exactly the finding.
 */
export interface QuotaObservation {
  /** Lower-cased header name → last value seen. */
  headers: RateLimitHeaders;
  /** When the response carrying them arrived. */
  observedAt: string | null;
  /** Which endpoint's response it came from. */
  fromKind: RequestKind | null;
}

export interface Meter {
  state(): Readonly<MeterState>;
  records(): readonly WireRecord[];
  quota(): QuotaObservation;
  /** Submissions still allowed under the ceiling. */
  remaining(): number;
  /** The ceiling itself, for reporting. */
  readonly maxSubmissions: number;
  /** Wall-clock ms since the meter was installed. */
  elapsedMs(): number;
  uninstall(): void;
}

/**
 * Thrown instead of sending a POST that would cross the ceiling.
 *
 * A named class so the orchestrator can tell "we stopped this" from "the judge
 * refused it". The adapter sees an ordinary rejected `fetch` and reports
 * `provider_error`, which is correct from where it stands — nothing was
 * measured — and the run's own record says who stopped it.
 */
export class SubmissionCeilingReached extends Error {
  constructor(readonly ceiling: number) {
    super(`the validator's own --max-submissions=${ceiling} ceiling was reached`);
    this.name = "SubmissionCeilingReached";
  }
}

/**
 * Thrown instead of sending a request that would cross the API-request ceiling.
 *
 * Separate from `SubmissionCeilingReached` because the two answer different
 * operator questions — "we created as many submissions as you allowed" versus
 * "we made as many billable calls as you allowed" — and on a plan metered by
 * request it is this one that will fire first.
 */
export class ApiRequestCeilingReached extends Error {
  constructor(readonly ceiling: number) {
    super(`the validator's own --max-api-requests=${ceiling} ceiling was reached`);
    this.name = "ApiRequestCeilingReached";
  }
}

type FetchFn = typeof globalThis.fetch;

/** `x-ratelimit-…` and `retry-after`, and nothing else, ever. */
function isQuotaHeader(name: string): boolean {
  return name.startsWith("x-ratelimit-") || name === "retry-after";
}

/**
 * Which endpoint is this, from the URL alone.
 *
 * Path-based rather than a flag the caller passes, so a request made by code
 * that has not heard of the meter — a retry inside the adapter, a phase added
 * later — is still classified and still counted.
 */
function classify(method: string, pathname: string): RequestKind {
  const m = method.toUpperCase();
  if (pathname.endsWith("/languages")) return "language_lookup";
  if (pathname.endsWith("/config_info")) return "config_info";
  if (pathname.endsWith("/submissions/batch")) {
    return m === "POST" ? "batch_submission" : "batch_poll";
  }
  if (pathname.endsWith("/submissions")) return m === "POST" ? "submission" : "other";
  if (pathname.includes("/submissions/")) return m === "GET" ? "poll" : "other";
  return "other";
}

/**
 * How many billable submissions one request creates.
 *
 * For a batch this is the length of the `submissions` array, which means
 * reading the request body — the only place in this file that does. It is
 * parsed, its length is taken, and the parsed value is dropped on the next
 * line: nothing about a learner's program crosses into the meter.
 */
function submissionCount(kind: RequestKind, body: unknown): number {
  if (kind === "submission") return 1;
  if (kind !== "batch_submission") return 0;
  if (typeof body !== "string") return 1;
  try {
    const parsed: unknown = JSON.parse(body);
    const list = (parsed as { submissions?: unknown }).submissions;
    return Array.isArray(list) ? list.length : 1;
  } catch {
    /* An unparseable batch body is still at least one submission's worth of
       spend, and guessing LOW is the direction that overspends. */
    return 1;
  }
}

export interface MeterOptions {
  /** Only requests to this origin are metered; everything else passes through. */
  baseUrl: string;
  /** The hard ceiling on billable submissions. `0` means "spend nothing". */
  maxSubmissions: number;
  /**
   * The hard ceiling on HTTP REQUESTS. The one RapidAPI actually meters.
   *
   * Submissions are the unit Judge0 thinks in; requests are the unit the
   * marketplace bills. They differ by the polling factor, and that factor is
   * not small: one submission is a POST plus however many `GET /submissions/{token}`
   * it takes to reach a terminal state — up to about twenty for a program that
   * runs its whole CPU budget.
   *
   * So a submission ceiling alone is not a spend ceiling. `--max-submissions=25`
   * bounds spend at twenty-five *submissions* and at something like five hundred
   * *requests*, against a plan whose limit is expressed in requests and is
   * UNKNOWN until someone reads it. That gap is the difference between a
   * validation run and an exhausted quota.
   */
  maxApiRequests: number;
}

/**
 * Replace `globalThis.fetch` for the duration of the run.
 *
 * Monkey-patching a global is not something to do lightly, and the alternative
 * was worse: injecting a `fetch` into `Judge0RapidApiProvider` would mean
 * changing the adapter — a file this unit is explicitly forbidden to refactor —
 * and would make the validator measure a code path production does not use.
 * The patch is narrow (one origin), reversible (`uninstall`), and installed only
 * inside the validator process.
 */
export function installMeter(options: MeterOptions): Meter {
  const origin = new URL(options.baseUrl).origin;
  const installedAt = Date.now();
  const original: FetchFn = globalThis.fetch.bind(globalThis);

  const counters: MeterState = {
    submissions: 0,
    apiRequests: 0,
    polls: 0,
    languageLookups: 0,
    rateLimited: 0,
    failures: 0,
    ceilingRefusals: 0,
  };
  const records: WireRecord[] = [];
  const quotaHeaders: Record<string, string> = {};
  let quotaObservedAt: string | null = null;
  let quotaFromKind: RequestKind | null = null;

  const wrapped: FetchFn = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return original(input, init);
    }
    /* Anything that is not the judge is none of this meter's business. */
    if (parsed.origin !== origin) return original(input, init);

    const method = init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET");
    const kind = classify(method ?? "GET", parsed.pathname);
    const willSpend = submissionCount(kind, init?.body);

    if (willSpend > 0 && counters.submissions + willSpend > options.maxSubmissions) {
      /* Refused BEFORE the network. Counted as a refusal, not as a request:
         nothing was sent, so nothing was billed. */
      counters.ceilingRefusals += 1;
      throw new SubmissionCeilingReached(options.maxSubmissions);
    }

    /* And the ceiling on the unit the marketplace actually bills.
       Checked for EVERY request, not only POSTs, because a poll is billable and
       a submission ceiling cannot see polls at all — a single program that runs
       its whole CPU budget can poll twenty times under a submission budget of
       one. This is the guard that fires first on a request-metered plan. */
    if (counters.apiRequests + 1 > options.maxApiRequests) {
      counters.ceilingRefusals += 1;
      throw new ApiRequestCeilingReached(options.maxApiRequests);
    }

    /* Counted as spent at the moment the request leaves, not when it succeeds.
       A POST that times out may well have created a submission — that is the
       whole reason the adapter never retries one — so the pessimistic count is
       the honest one. */
    counters.submissions += willSpend;
    counters.apiRequests += 1;
    if (kind === "poll" || kind === "batch_poll") counters.polls += 1;
    if (kind === "language_lookup") counters.languageLookups += 1;

    const startedAtMs = Date.now() - installedAt;
    const t0 = Date.now();
    try {
      const response = await original(input, init);
      const elapsedMs = Date.now() - t0;

      let sawQuotaHeader = false;
      response.headers.forEach((value, name) => {
        const lower = name.toLowerCase();
        if (!isQuotaHeader(lower)) return;
        quotaHeaders[lower] = value;
        sawQuotaHeader = true;
      });
      if (sawQuotaHeader) {
        quotaObservedAt = new Date().toISOString();
        quotaFromKind = kind;
      }

      if (response.status === 429) counters.rateLimited += 1;
      else if (!response.ok) counters.failures += 1;

      records.push({ kind, submissions: willSpend, status: response.status, startedAtMs, elapsedMs });
      return response;
    } catch (err) {
      counters.failures += 1;
      records.push({ kind, submissions: willSpend, status: null, startedAtMs, elapsedMs: Date.now() - t0 });
      throw err;
    }
  };

  globalThis.fetch = wrapped;

  return {
    state: () => ({ ...counters }),
    records: () => records.slice(),
    quota: () => ({ headers: { ...quotaHeaders }, observedAt: quotaObservedAt, fromKind: quotaFromKind }),
    remaining: () => Math.max(0, options.maxSubmissions - counters.submissions),
    maxSubmissions: options.maxSubmissions,
    elapsedMs: () => Date.now() - installedAt,
    uninstall: () => {
      globalThis.fetch = original;
    },
  };
}
