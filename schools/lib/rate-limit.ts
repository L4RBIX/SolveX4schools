import "server-only";
import { getStoreHandle } from "@schools/store";

/**
 * Token buckets, keyed on the LEARNER.
 *
 * Never on client IP. A school sits behind one NAT gateway, so an IP bucket
 * makes the whole class share one allowance and the most active student
 * throttles everyone else — which reads to eighteen children as the platform
 * being broken, and to a teacher as the platform being unusable.
 */

export interface Budget {
  /** Burst size. */
  capacity: number;
  refillPerMinute: number;
}

export interface TakeResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function takeToken(
  key: string,
  budget: Budget,
  cost = 1,
): Promise<TakeResult> {
  const { sql } = await getStoreHandle();

  return sql.tx(async (t) => {
    const now = Date.now();
    const existing = await t.query<{ tokens: number; updated_at: string }>(
      `select tokens, updated_at from rate_limit_bucket where bucket_key = $1 for update`,
      [key],
    );

    let tokens = budget.capacity;
    if (existing.rows.length > 0) {
      const last = new Date(existing.rows[0].updated_at).getTime();
      const minutes = Math.max(0, (now - last) / 60_000);
      tokens = Math.min(
        budget.capacity,
        Number(existing.rows[0].tokens) + minutes * budget.refillPerMinute,
      );
    }

    if (tokens < cost) {
      const needed = cost - tokens;
      return {
        ok: false,
        remaining: Math.floor(tokens),
        retryAfterSeconds: Math.ceil((needed / budget.refillPerMinute) * 60),
      };
    }

    tokens -= cost;
    await t.query(
      `insert into rate_limit_bucket (bucket_key, tokens, updated_at)
       values ($1, $2, now())
       on conflict (bucket_key) do update set tokens = excluded.tokens, updated_at = now()`,
      [key, tokens],
    );
    return { ok: true, remaining: Math.floor(tokens), retryAfterSeconds: 0 };
  });
}
