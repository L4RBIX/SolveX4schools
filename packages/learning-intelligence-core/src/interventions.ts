/**
 * Materialise the intervention ledger from the raw event stream.
 *
 * The pre-state columns are DERIVED here rather than sent by the client, and
 * that is the point. If the browser reported "the learner had made 4 attempts
 * when I gave this hint", the counterfactual anchor would be forgeable by the
 * same party whose help is being evaluated. Counting the `verdict_received`
 * events that precede the hint in the stream costs nothing and cannot be
 * gamed.
 *
 * Pairs `assistance_requested` with `assistance_delivered` on `intervention_id`.
 * A request with no delivery is a hint that failed to arrive — recorded as an
 * unpaired request and skipped, because an intervention that never reached the
 * learner should not be scored as one that did.
 */

import type { ReducibleEvent } from "./episode";

export const INTERVENTION_REDUCER_VERSION = 1;

export interface InterventionRow {
  intervention_id: string;
  subject_id: string;
  episode_id: string;
  kind: string;
  level: number | null;
  trigger: string;
  mode: string | null;
  pre_attempts: number;
  pre_runs: number;
  pre_active_seconds: number;
  pre_last_verdict: string | null;
  pre_diff_class: string | null;
  pre_code_hash: string | null;
  pre_tests_passed: number | null;
  evidence_type: string | null;
  contains_code: boolean;
  content_len: number;
  delivered_at: string;
}

const IDLE_CEILING_SECONDS = 10 * 60;

function str(event: ReducibleEvent, key: string): string | null {
  const value = event.payload[key];
  return typeof value === "string" ? value : null;
}

function num(event: ReducibleEvent, key: string): number | null {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(event: ReducibleEvent, key: string): boolean {
  return event.payload[key] === true;
}

export function buildInterventions(
  episodeId: string,
  subjectId: string,
  events: readonly ReducibleEvent[]
): InterventionRow[] {
  const ordered = [...events].sort((a, b) => {
    const byTime = Date.parse(a.received_at) - Date.parse(b.received_at);
    return byTime !== 0 ? byTime : a.seq - b.seq;
  });

  const requests = new Map<string, ReducibleEvent>();
  const rows: InterventionRow[] = [];

  // Running pre-state, advanced as we walk the stream. Reading it at the
  // moment a delivery lands is exactly "what did we know when we intervened".
  let attempts = 0;
  let runs = 0;
  let activeSeconds = 0;
  let lastVerdict: string | null = null;
  let lastTestsPassed: number | null = null;
  let lastDiffClass: string | null = null;
  let lastCodeHash: string | null = null;
  let previousAt: number | null = null;

  for (const event of ordered) {
    const at = Date.parse(event.received_at);
    if (previousAt !== null) {
      const gap = (at - previousAt) / 1000;
      if (gap > 0 && gap <= IDLE_CEILING_SECONDS) activeSeconds += gap;
    }
    previousAt = at;

    switch (event.event_name) {
      case "run_executed":
        runs += 1;
        break;

      case "verdict_received": {
        attempts += 1;
        lastVerdict = str(event, "verdict");
        const passed = num(event, "tests_passed");
        if (passed !== null) lastTestsPassed = passed;
        break;
      }

      case "code_diff_classified":
        lastDiffClass = str(event, "diff_class");
        lastCodeHash = str(event, "blob_hash");
        break;

      case "assistance_requested": {
        const id = str(event, "intervention_id");
        if (id) requests.set(id, event);
        break;
      }

      case "assistance_delivered": {
        const id = str(event, "intervention_id");
        if (!id) break;
        const request = requests.get(id) ?? null;

        rows.push({
          intervention_id: id,
          subject_id: subjectId,
          episode_id: episodeId,
          kind: "hint",
          level: num(event, "level") ?? (request ? num(request, "granted_level") : null),
          trigger: (request ? str(request, "trigger") : null) ?? "learner_requested",
          mode: str(event, "mode") ?? (request ? str(request, "mode") : null),
          // Snapshotted from the running state, not from the payload.
          pre_attempts: attempts,
          pre_runs: runs,
          pre_active_seconds: Math.round(activeSeconds),
          pre_last_verdict: lastVerdict,
          pre_diff_class: lastDiffClass,
          pre_code_hash: lastCodeHash,
          pre_tests_passed: lastTestsPassed,
          evidence_type: str(event, "evidence_type"),
          contains_code: bool(event, "contains_code"),
          content_len: num(event, "content_len") ?? 0,
          delivered_at: event.received_at,
        });
        requests.delete(id);
        break;
      }

      default:
        break;
    }
  }

  return rows;
}
