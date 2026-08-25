import { getStore, getStoreHandle } from "@schools/store";
import { config } from "@schools/config";

/**
 * Health.
 *
 * Watches the two failures that are invisible from the outside:
 *
 * 1. **A dead sweep.** Every route keeps returning 200 with a stale projection,
 *    so a teacher reads last week's evidence mid-lesson and nothing complains.
 * 2. **A broken attestation secret.** Every verdict silently downgrades to
 *    browser trust, no misconception ever becomes actionable, and the product
 *    goes on looking like it works while it has stopped learning anything.
 *
 * Both report as numbers here rather than as an exception somewhere.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_AFTER_MS = 5 * 60 * 1000;

export async function GET() {
  const store = await getStore();
  const { sql } = await getStoreHandle();

  const lastSweep = await store.lastSweepAt();
  const sweepAgeMs = lastSweep ? Date.now() - Date.parse(lastSweep) : null;

  const stale = await sql.query<{ n: number }>(
    `select count(*)::int as n from learning_events e
      left join attempt_episodes a on a.episode_id = e.episode_id
     where e.episode_id is not null and a.episode_id is null`,
  );

  const trust = await sql.query<{ source_trust: string; n: number }>(
    `select source_trust, count(*)::int as n from learning_events
      where event_name = 'verdict_received' group by 1`,
  );
  const total = trust.rows.reduce((n, r) => n + r.n, 0);
  const judged = trust.rows.find((r) => r.source_trust === "judge")?.n ?? 0;

  const problems: string[] = [];
  /* An old sweep is only a problem when there is work waiting. `lastSweepAt` is
     the newest `reduced_at`, so it stops moving the moment the queue empties —
     a quiet classroom is not a dead reducer, and reporting it as one trains
     everyone to ignore this endpoint. The backlog is the real signal. */
  if (
    stale.rows[0].n > 0 &&
    sweepAgeMs !== null &&
    sweepAgeMs > STALE_AFTER_MS
  ) {
    problems.push(
      `${stale.rows[0].n} episode event(s) unreduced and the last sweep was ` +
        `${Math.round(sweepAgeMs / 1000)}s ago`,
    );
  }
  if (total > 0 && judged === 0) {
    problems.push("no verdict has judge trust — the attestation secret or the grading path is broken");
  }
  if (!config.attestationSecret && config.environment === "production") {
    problems.push("LEARNING_ATTESTATION_SECRET is unset in production");
  }

  return Response.json(
    {
      ok: problems.length === 0,
      problems,
      lastSweepAt: lastSweep,
      sweepAgeSeconds: sweepAgeMs === null ? null : Math.round(sweepAgeMs / 1000),
      unreducedEpisodeEvents: stale.rows[0].n,
      verdicts: { total, judged, judgedShare: total === 0 ? null : judged / total },
      providers: { nova: config.nova.provider, execution: config.exec.provider },
      environment: config.environment,
    },
    { status: problems.length === 0 ? 200 : 503 },
  );
}
