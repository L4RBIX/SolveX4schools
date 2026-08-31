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
 * ## UNVERIFIED
 *
 * **No live call has ever been made from this repository** — there is no
 * RapidAPI key here. The header names below are the ones RapidAPI's published
 * documentation describes; whether the subscribed plan actually sends any of
 * them, and with what casing, has not been observed. If none of them arrive,
 * `providerQuota()` stays `null` for the life of the process and the health
 * view says so rather than inventing a number.
 */

/** Our three fields. The vendor's names never appear outside this file. */
type QuotaField = "limit" | "remaining" | "resetSeconds";

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
const QUOTA_HEADERS: ReadonlyMap<string, { family: string; field: QuotaField }> = new Map([
  // The subscription's request quota.
  ["x-ratelimit-requests-limit", { family: "requests", field: "limit" as QuotaField }],
  ["x-ratelimit-requests-remaining", { family: "requests", field: "remaining" as QuotaField }],
  ["x-ratelimit-requests-reset", { family: "requests", field: "resetSeconds" as QuotaField }],
  // The marketplace's own ceiling, which can bite before the subscription does.
  ["x-ratelimit-rapid-free-plans-hard-limit-limit", { family: "hard", field: "limit" as QuotaField }],
  ["x-ratelimit-rapid-free-plans-hard-limit-remaining", { family: "hard", field: "remaining" as QuotaField }],
  ["x-ratelimit-rapid-free-plans-hard-limit-reset", { family: "hard", field: "resetSeconds" as QuotaField }],
  // The unqualified form, which some deployments send instead of either.
  ["x-ratelimit-limit", { family: "generic", field: "limit" as QuotaField }],
  ["x-ratelimit-remaining", { family: "generic", field: "remaining" as QuotaField }],
  ["x-ratelimit-reset", { family: "generic", field: "resetSeconds" as QuotaField }],
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

/** A header value is a quota figure only if it is a plain non-negative integer. */
function integer(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
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
  for (const [name, { family, field }] of QUOTA_HEADERS) {
    const value = integer(headers.get(name));
    if (value === null) continue;
    const bucket = families.get(family) ?? { limit: null, remaining: null, resetSeconds: null };
    bucket[field] = value;
    families.set(family, bucket);
  }

  if (families.size === 0) return;

  /* The tightest window wins. Two families that both report `remaining` are two
     independent ceilings, and the class stops at whichever runs out first, so
     the conservative one is the true answer to "can we finish". A family with
     no `remaining` at all cannot be compared and is only used as a fallback. */
  let best: { limit: number | null; remaining: number | null; resetSeconds: number | null } | null = null;
  for (const bucket of families.values()) {
    if (best === null) {
      best = bucket;
      continue;
    }
    if (bucket.remaining === null) continue;
    if (best.remaining === null || bucket.remaining < best.remaining) best = bucket;
  }
  if (best === null) return;

  state().current = {
    observedAt: new Date().toISOString(),
    limit: best.limit,
    remaining: best.remaining,
    resetSeconds: best.resetSeconds,
    windows: families.size,
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
