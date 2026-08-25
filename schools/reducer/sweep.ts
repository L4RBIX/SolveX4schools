import "server-only";
import { randomUUID } from "node:crypto";
import {
  buildInterventions,
  buildLearnerState,
  decide,
  reduceEpisode,
  REDUCER_VERSION,
  type LearningDecision,
} from "@solvex/learning-intelligence-core";
/* Not on the package barrel — see the alias comment in vitest.config.mts.
   Reached by path rather than by adding an export to a file whose behaviour the
   golden fixtures assert. */
import { computeInterventionOutcome } from "@solvex/learning-intelligence-core/internal/interventionOutcome";
import type { LearningStore } from "@schools/store/learning-store";

/**
 * The reducer sweep.
 *
 * Pure orchestration over the imported core: no HTTP, no Next imports, no
 * framework. Three callers reach it — an in-process interval, an opportunistic
 * hook after ingest, and an external cron — and there is exactly one
 * implementation so they cannot drift.
 *
 * ## Why this exists at all
 *
 * The export is explicit that the original product has no scheduler:
 * `buildLearnerState`, `decide()` and everything downstream have only ever run
 * from a manual admin button. A school product cannot ship that. A teacher who
 * has to remember to press "recompute" before every lesson does not have an
 * intelligent system; they have a spreadsheet with extra steps.
 *
 * ## Idempotency
 *
 * Running this twice must produce byte-identical rows. Four things guarantee
 * it, and all four are load-bearing:
 *
 * 1. `learning_events.event_id` is the primary key and every insert is
 *    `on conflict do nothing`, so nothing downstream can double-count what was
 *    never doubly stored.
 * 2. The lease means one sweeper at a time.
 * 3. Every projection write is an upsert on a natural key.
 * 4. `reduceEpisode` is a pure function of the episode's events, so replaying
 *    the same events produces the same episode.
 */

export interface SweepOptions {
  /** Episodes to reduce per run. */
  limit?: number;
  /** Lease TTL. Long enough for a slow sweep, short enough that a crash frees it. */
  leaseSeconds?: number;
  owner?: string;
}

export interface SweepResult {
  claimed: boolean;
  episodesReduced: number;
  subjectsRebuilt: number;
  decisions: Record<string, LearningDecision>;
  errors: { episodeId: string; message: string }[];
}

export async function runSweep(
  store: LearningStore,
  opts: SweepOptions = {},
): Promise<SweepResult> {
  const owner = opts.owner ?? randomUUID();
  const limit = opts.limit ?? 200;
  const leaseSeconds = opts.leaseSeconds ?? 60;

  const result: SweepResult = {
    claimed: false,
    episodesReduced: 0,
    subjectsRebuilt: 0,
    decisions: {},
    errors: [],
  };

  // One sweeper at a time. Returning quietly rather than throwing: a sweep that
  // could not get the lease is not a failure, it is a sweep that was not needed.
  if (!(await store.claimReducerLease(owner, leaseSeconds))) return result;
  result.claimed = true;

  try {
    const stale = await store.staleEpisodes(limit, REDUCER_VERSION);
    const touchedSubjects = new Set<string>();

    for (const { episodeId, subjectId } of stale) {
      try {
        const events = await store.eventsForEpisode(episodeId);
        const reduced = reduceEpisode(events);
        // Null means no events. Nothing to record and nothing wrong.
        if (!reduced) continue;

        await store.upsertEpisode({
          episodeId,
          subjectId,
          taskRef: reduced.task_ref,
          taskKind: reduced.task_kind,
          reduced,
        });

        const interventions = buildInterventions(episodeId, subjectId, events);
        if (interventions.length > 0) {
          await store.upsertInterventions(interventions);
          await store.upsertOutcomes(
            interventions.map((i) => computeInterventionOutcome(i, events)),
          );
        }

        result.episodesReduced += 1;
        touchedSubjects.add(subjectId);
      } catch (err) {
        // One bad episode must not stop the sweep. It stays stale and is
        // retried next run, which is the right behaviour for a transient
        // failure and makes a persistent one visible in the error list.
        result.errors.push({
          episodeId,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const subjectId of touchedSubjects) {
      const inputs = await store.episodeInputsFor(subjectId);
      const state = buildLearnerState(subjectId, inputs);
      await store.putLearnerState(subjectId, state);
      result.decisions[subjectId] = decide(state);
      result.subjectsRebuilt += 1;
    }
  } finally {
    await store.releaseReducerLease(owner);
  }

  return result;
}
