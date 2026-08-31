import "server-only";
import { config } from "@schools/config";
import { getStoreHandle } from "@schools/store";

/**
 * The ceilings above the token bucket.
 *
 * `schools/lib/rate-limit.ts` stops a burst — twenty requests, refilling ten a
 * minute, keyed on the learner. It cannot see the two shapes that actually cost
 * money: one learner asking for a hint every forty seconds all afternoon, which
 * never trips a per-minute bucket; and eighteen learners each staying politely
 * under their own limit while together spending the term's budget in a week.
 *
 * So there are two more ceilings, in the two units that matter:
 *
 *   requests per learner per day — a shape a bucket cannot see
 *   tokens and dollars per month per deployment — the number somebody chose
 *
 * Both are checked BEFORE the provider is called. A cap that is enforced after
 * the request is a report.
 *
 * ## Failing open, on purpose
 *
 * If the counters cannot be read the request proceeds. This is the one place in
 * Nova where the safe direction is forward: the alternative is that a database
 * hiccup silently switches the tutor off for a whole class mid-lesson, and the
 * cost of the mistake in the other direction is a few cents. The failure is
 * counted so it is visible rather than assumed.
 */

export type BudgetBlock =
  | "daily_requests"
  | "monthly_input_tokens"
  | "monthly_output_tokens"
  | "monthly_cost";

export interface BudgetVerdict {
  readonly ok: boolean;
  /** Which ceiling stopped it. Internal — the learner sees a friendly line. */
  readonly blockedBy: BudgetBlock | null;
}

const OK: BudgetVerdict = { ok: true, blockedBy: null };

/** `YYYY-MM` in UTC. The month a school day belongs to is never ambiguous. */
function monthKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface MonthlySpend {
  readonly requests: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
}

/** Money from tokens, at read time, so a price change is an env var. */
export function costOf(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * config.nova.inputUsdPerMTok +
    (outputTokens / 1_000_000) * config.nova.outputUsdPerMTok
  );
}

export async function monthlySpend(month = monthKey()): Promise<MonthlySpend> {
  const { sql } = await getStoreHandle();
  const res = await sql.query<{
    requests: string;
    input_tokens: string;
    output_tokens: string;
  }>(
    `select requests, input_tokens, output_tokens from nova_spend where usage_month = $1`,
    [month],
  );
  const row = res.rows[0];
  const inputTokens = Number(row?.input_tokens ?? 0);
  const outputTokens = Number(row?.output_tokens ?? 0);
  return {
    requests: Number(row?.requests ?? 0),
    inputTokens,
    outputTokens,
    costUsd: costOf(inputTokens, outputTokens),
  };
}

/**
 * May this learner make one more request?
 *
 * The daily counter is incremented as part of the check, in the same statement,
 * so two requests racing cannot both read 59 and both proceed. A limit of zero
 * disables the ceiling rather than blocking everything — the number nobody set
 * should not be the number that switches the tutor off.
 */
export async function checkAndConsumeBudget(subjectId: string): Promise<BudgetVerdict> {
  const {
    dailyRequestLimit,
    monthlyInputTokenLimit,
    monthlyOutputTokenLimit,
    monthlyCostLimitUsd,
  } = config.nova;

  const spend = await monthlySpend();
  if (monthlyInputTokenLimit > 0 && spend.inputTokens >= monthlyInputTokenLimit) {
    return { ok: false, blockedBy: "monthly_input_tokens" };
  }
  if (monthlyOutputTokenLimit > 0 && spend.outputTokens >= monthlyOutputTokenLimit) {
    return { ok: false, blockedBy: "monthly_output_tokens" };
  }
  if (monthlyCostLimitUsd > 0 && spend.costUsd >= monthlyCostLimitUsd) {
    return { ok: false, blockedBy: "monthly_cost" };
  }

  if (dailyRequestLimit <= 0) return OK;

  const { sql } = await getStoreHandle();
  /* Increment and read back in one statement. The returned value already
     includes this request, so the comparison is `>` rather than `>=`. */
  const res = await sql.query<{ requests: number }>(
    `insert into nova_usage (subject_id, usage_day, requests, updated_at)
     values ($1, current_date, 1, now())
     on conflict (subject_id, usage_day) do update
       set requests = nova_usage.requests + 1, updated_at = now()
     returning requests`,
    [subjectId],
  );
  const used = Number(res.rows[0]?.requests ?? 0);
  if (used > dailyRequestLimit) return { ok: false, blockedBy: "daily_requests" };
  return OK;
}

/**
 * Record what the call actually cost.
 *
 * Called after the stream ends, with whatever the provider reported. DeepSeek
 * returns `usage` in its final frame only when asked to; when it says nothing,
 * nothing is recorded rather than estimated, and the month row under-counts
 * honestly instead of accumulating a guess that looks like a measurement.
 */
export async function recordSpend(
  inputTokens: number,
  outputTokens: number,
  month = monthKey(),
): Promise<void> {
  const { sql } = await getStoreHandle();
  await sql.query(
    `insert into nova_spend (usage_month, requests, input_tokens, output_tokens, updated_at)
     values ($1, 1, $2, $3, now())
     on conflict (usage_month) do update
       set requests      = nova_spend.requests + 1,
           input_tokens  = nova_spend.input_tokens + excluded.input_tokens,
           output_tokens = nova_spend.output_tokens + excluded.output_tokens,
           updated_at    = now()`,
    [month, Math.max(0, Math.trunc(inputTokens)), Math.max(0, Math.trunc(outputTokens))],
  );
}
