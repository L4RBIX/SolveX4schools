import "server-only";

/**
 * What a metered provider has told us about how much of its plan is left.
 *
 * ## Why this is not a counter
 *
 * Everything in `counters.ts` is monotonic and ours: we increment it, it only
 * goes up, and it means whatever we decided it means. This is the opposite — a
 * number the VENDOR reports, that goes DOWN, that resets on a schedule we do
 * not control, and that is only ever as fresh as the last response we happened
 * to read. Storing it as a counter would make `remaining` look like a total,
 * which is precisely backwards.
 *
 * So it is a last-observed gauge, stamped with when it was observed, and it is
 * `null` until something has actually seen a header. Null means "nobody has
 * looked", never "zero left" — the difference matters on the afternoon somebody
 * is deciding whether the class can finish.
 *
 * ## What may be recorded, and what may not
 *
 * ONLY integers, and only from a fixed allowlist of header names. Three fields:
 * how many the window allows, how many are left, and how long until it resets.
 * That is the whole operational question — *will this class finish, and if not,
 * when does it un-break* — and nothing else is needed to answer it.
 *
 * Deliberately NOT recorded, from headers or anywhere else:
 *
 * - the plan or tier NAME, the subscription id, the application id, the
 *   developer id, the account or any billing identifier;
 * - any price, overage rate, spend or invoice figure;
 * - the key, any prefix or suffix of it, or its length;
 * - the response body, ever, in any form;
 * - the raw header names we matched, so a vendor renaming a header to something
 *   with a tier in it cannot smuggle the tier into a health payload.
 *
 * The values are stored under OUR names. Everything the vendor calls things
 * stays at the door.
 *
 * ## MEASURED, 2026-08-30
 *
 * This used to say UNVERIFIED, and it was: no live call had been made and the
 * names below were transcribed from RapidAPI's documentation. A live run since
 * then sent SIX `x-ratelimit-*` headers and NONE of the nine this file knew, so
 * `recordProviderQuota` found no families, returned early, and
 * `providerQuota()` was null for the life of every process while the numbers
 * were sitting on the wire. The health view reported "no quota information"
 * about a service that was sending quota information on every response.
 *
 * The `submissions` family below is those six. The nine stay: they are what
 * RapidAPI documents, a different plan may well send them, and deleting them
 * would trade one blind spot for another.
 *
 * ## The measured plan reports an OVERAGE, not headroom
 *
 * `limit` is `0` and `remaining` is NEGATIVE — `-1786` on submissions, `-19` on
 * batched. That is not a broken header. `limit: 0` is a plan publishing no
 * included allowance, and `remaining` counting past zero is overage already
 * incurred. In the same run the service accepted 42 submissions across 177
 * requests and returned zero 429s, so the number is a BILL and not a blockage.
 *
 * Two consequences are wired below rather than left to the reader. `remaining`
 * is parsed signed for this family only, so a real reading is not thrown away;
 * and `meaning` says which of the two things the figure is, so nothing
 * downstream can render `-1786` as an amount of headroom.
 */

/** Our three fields. The vendor's names never appear outside this file. */
type QuotaField = "limit" | "remaining" | "resetSeconds";

interface QuotaHeader {
  family: string;
  field: QuotaField;
  /**
   * This header's family may legitimately report a value BELOW zero.
   *
   * Opt-in per header rather than global, because a negative `remaining` on the
   * documented RapidAPI families is a value nobody has ever observed and would
   * more likely be a bug than a reading — `tests/ops/judge-observability.test.ts`
   * asserts that a `-1` there is refused, and that behaviour is deliberate and
   * stays. The measured `submissions` family is different: negative is its
   * normal state and discarding it is how the figure went missing.
   */
  signed?: true;
}

/**
 * Header name (lower-cased) → field, and a family key so two rate-limit windows
 * reported in the same response are not mixed into one nonsense triple.
 *
 * RapidAPI documents at least two families that can arrive together: the
 * subscription's own request quota, and the marketplace's hard ceiling. They
 * have different windows and different numbers, and reading `limit` from one
 * beside `remaining` from the other would produce a figure that is true of
 * neither.
 */
const QUOTA_HEADERS: ReadonlyMap<string, QuotaHeader> = new Map<string, QuotaHeader>([
  // The subscription's request quota.
  ["x-ratelimit-requests-limit", { family: "requests", field: "limit" }],
  ["x-ratelimit-requests-remaining", { family: "requests", field: "remaining" }],
  ["x-ratelimit-requests-reset", { family: "requests", field: "resetSeconds" }],
  // The marketplace's own ceiling, which can bite before the subscription does.
  ["x-ratelimit-rapid-free-plans-hard-limit-limit", { family: "hard", field: "limit" }],
  ["x-ratelimit-rapid-free-plans-hard-limit-remaining", { family: "hard", field: "remaining" }],
  ["x-ratelimit-rapid-free-plans-hard-limit-reset", { family: "hard", field: "resetSeconds" }],
  // The unqualified form, which some deployments send instead of either.
  ["x-ratelimit-limit", { family: "generic", field: "limit" }],
  ["x-ratelimit-remaining", { family: "generic", field: "remaining" }],
  ["x-ratelimit-reset", { family: "generic", field: "resetSeconds" }],
  /* What judge0-ce.p.rapidapi.com ACTUALLY sends, measured 2026-08-30. Signed,
     because on that plan `remaining` is negative and means overage. */
  ["x-ratelimit-submissions-limit", { family: "submissions", field: "limit", signed: true }],
  ["x-ratelimit-submissions-remaining", { family: "submissions", field: "remaining", signed: true }],
  ["x-ratelimit-submissions-reset", { family: "submissions", field: "resetSeconds", signed: true }],
  ["x-ratelimit-batched-submissions-limit", { family: "batched", field: "limit", signed: true }],
  ["x-ratelimit-batched-submissions-remaining", { family: "batched", field: "remaining", signed: true }],
  ["x-ratelimit-batched-submissions-reset", { family: "batched", field: "resetSeconds", signed: true }],
]);

export interface ProviderQuota {
  /** When the response that carried these numbers arrived. */
  observedAt: string;
  /** Requests the window allows. `null` when that header was not present. */
  limit: number | null;
  /** Requests left in the window. The number an operator is actually asking for. */
  remaining: number | null;
  /** Seconds until the window resets, as the header reported it. */
  resetSeconds: number | null;
  /**
   * How many distinct rate-limit windows the last response described.
   *
   * More than one means the figures above are the TIGHTEST of them — the one
   * that will stop the class first — and not a sum. Reported so nobody reads a
   * conservative number as the only number.
   */
  windows: number;
  /**
   * What `remaining` is measuring, because on the plan actually rented it is
   * NOT "requests left".
   *
   * - `"left"`    — `remaining >= 0`. A real ceiling, and the count still
   *                 available before it stops a class.
   * - `"overage"` — `remaining < 0`. The included allowance is spent and
   *                 `-remaining` is how far past it this account already is.
   *                 Measured: `limit: 0`, `remaining: -1786`, 42 submissions in
   *                 the same run, zero 429s. A bill, not a blockage.
   * - `null`      — no `remaining` header arrived; there is nothing to mean.
   *
   * Present so that nothing downstream can render `remaining` as headroom
   * without having been told which of the two it is holding.
   */
  meaning: "left" | "overage" | null;
}

interface QuotaState {
  current: ProviderQuota | null;
}

const KEY = Symbol.for("solvex.ops.provider_quota");
type GlobalWithQuota = typeof globalThis & { [KEY]?: QuotaState };

function state(): QuotaState {
  const g = globalThis as GlobalWithQuota;
  g[KEY] ??= { current: null };
  return g[KEY];
}

/**
 * A header value is a quota figure only if it is a plain integer.
 *
 * `signed` is opt-in per header and defaults OFF, so the nine documented names
 * keep refusing a negative exactly as they did — an asserted behaviour, and the
 * right one for a family where a negative would be a bug. `"0"` parses to `0`
 * in both modes: a zero that arrived is a zero, and only a header that did not
 * arrive is null.
 */
function integer(raw: string | null, signed = false): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!(signed ? /^-?\d+$/ : /^\d+$/).test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Read the quota headers off one response and keep the tightest window.
 *
 * Called for its side effect and never awaited. It reads named headers only —
 * it does not iterate the response's headers, so a header nobody here has heard
 * of cannot be recorded by accident, which is the whole reason the allowlist is
 * a lookup rather than a filter.
 *
 * Accepts anything header-shaped so a caller can pass a `Response`'s headers
 * without this module depending on `fetch`'s types being present.
 */
export function recordProviderQuota(headers: { get(name: string): string | null } | null | undefined): void {
  if (!headers) return;

  const families = new Map<string, { limit: number | null; remaining: number | null; resetSeconds: number | null }>();
  for (const [name, { family, field, signed }] of QUOTA_HEADERS) {
    const value = integer(headers.get(name), signed === true);
    if (value === null) continue;
    const bucket = families.get(family) ?? { limit: null, remaining: null, resetSeconds: null };
    bucket[field] = value;
    families.set(family, bucket);
  }

  if (families.size === 0) return;

  /*
   * The tightest window wins — but a REAL ceiling outranks an overage counter,
   * and that ordering is the whole of this block.
   *
   * Two families that both report a non-negative `remaining` are two
   * independent ceilings, and a class stops at whichever runs out first, so the
   * smaller is the true answer to "can we finish". That was the original rule
   * and it is unchanged.
   *
   * What the original rule could not survive is the plan measured on
   * 2026-08-30, where `remaining` is `-1786`. A plain `min` picks that every
   * time, so a plan sending BOTH a live ceiling (`remaining: 480`) and this
   * overage counter would have reported `-1786` and hidden the only number that
   * can actually stop a lesson. Nobody has hit it because no plan has yet sent
   * both — which is the reason to fix it now rather than after somebody does.
   *
   * So: prefer families that still have headroom, and take the tightest of
   * those. Fall back to an overage reading only when there is no ceiling to
   * report, because "-1786, and here is what that means" is worth more to an
   * operator than null.
   */
  const buckets = [...families.values()];
  const withCeiling = buckets.filter((b) => b.remaining !== null && b.remaining >= 0);
  const comparable = withCeiling.length > 0 ? withCeiling : buckets.filter((b) => b.remaining !== null);

  let best = comparable[0] ?? buckets[0] ?? null;
  for (const bucket of comparable) {
    if (bucket.remaining === null || best.remaining === null) continue;
    if (bucket.remaining < best.remaining) best = bucket;
  }
  if (best === null) return;

  state().current = {
    observedAt: new Date().toISOString(),
    limit: best.limit,
    remaining: best.remaining,
    resetSeconds: best.resetSeconds,
    windows: families.size,
    /* Said rather than left to be inferred from a sign. See `meaning`. */
    meaning: best.remaining === null ? null : best.remaining >= 0 ? "left" : "overage",
  };
}

/**
 * The last quota reading, or `null` when there has never been one.
 *
 * `null` is a real and common answer. It means either that nothing has called
 * the metered judge in this process, or that the plan does not send the headers
 * — and neither of those is "no quota left".
 */
export function providerQuota(): ProviderQuota | null {
  return state().current;
}

/** Tests only, and the same reason as `resetCounters`. */
export function resetProviderQuota(): void {
  (globalThis as GlobalWithQuota)[KEY] = { current: null };
}
