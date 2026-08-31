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
  /**
   * How many decisions were newly written to `learning_actions`.
   *
   * Almost always 0 on a quiet sweep, and that is the point: a row is written
   * only when the decision CHANGES. The sweep runs every twenty seconds, so
   * recording every pass would put thousands of identical DIAGNOSE rows against
   * one learner in an afternoon and bury the question the table exists to
   * answer.
   */
  decisionsRecorded: number;
  errors: { episodeId: string; message: string }[];
  /**
   * Subjects whose projection could not be rebuilt.
   *
   * A separate list rather than a wider `errors`, because the two failures land
   * on different people. A failed episode is one attempt that stays unreduced
   * and gets replayed in twenty seconds. A failed projection is one LEARNER
   * whose class-view row, skill levels and misconception list stop moving while
   * every route around them keeps answering 200 — which is the failure mode
   * this whole subsystem exists to make visible.
   */
  stateErrors: { subjectId: string; message: string }[];
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
    decisionsRecorded: 0,
    errors: [],
    stateErrors: [],
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

    /*
     * Rebuild the projection for every subject an episode moved under.
     *
     * ## Guarded, for the same reason the episode loop is
     *
     * Unguarded, one learner whose `buildLearnerState` throws — a skill row
     * with a shape the core does not expect, a transaction that deadlocks
     * against a concurrent read — abandoned the whole loop. Every subject after
     * them in iteration order kept the projection they had before the sweep
     * started, silently and for as long as the bad row survived, while
     * `episodesReduced` still reported a healthy number. The teacher's class
     * view then shows real evidence for the first few learners and last week's
     * for the rest, with nothing on the page distinguishing them.
     *
     * Recorded per subject rather than thrown, so a persistent failure is
     * visible in `stateErrors` and a transient one is simply retried on the
     * next tick — the same bargain the episode loop already makes.
     *
     * ## What this loop still does NOT cover
     *
     * Only subjects reached through `staleEpisodes`, which is keyed on
     * `REDUCER_VERSION`. Bumping `LEARNER_STATE_VERSION` alone changes nothing
     * here: every existing learner keeps the projection built by the old code
     * forever, because no episode of theirs became stale. Migration 0006 even
     * creates `idx_learner_state_stale (state_version, computed_at)` for the
     * query that would find them, and nothing issues it.
     *
     * Closing that needs one read on `LearningStore` —
     * `staleLearnerStates(limit, stateVersion)`, the projection half of
     * `staleEpisodes` — which is outside this file. Until it lands, a state
     * version bump must be followed by deleting `learner_state` and
     * `learner_skill_state` and letting the sweep rebuild them, and
     * `reducerHealth` in `schools/ops/observability.ts` now counts and reports
     * exactly how many learners are in that position so the gap is at least
     * visible rather than silent.
     */
    for (const subjectId of touchedSubjects) {
      try {
        const inputs = await store.episodeInputsFor(subjectId);
        const state = buildLearnerState(subjectId, inputs);
        await store.putLearnerState(subjectId, state);
        const decision = decide(state);
        result.decisions[subjectId] = decision;

        /*
         * Persist it, but only when it has changed.
         *
         * Migration 0006 created `learning_actions` for exactly this and said
         * why: the decision engine is unfalsifiable without it — it would issue
         * DIAGNOSE forever to a learner it never learns anything about and
         * nothing would notice. The table was never written to; this line
         * computed a decision and every caller threw it away.
         *
         * Guarded separately from the state rebuild above. A decision that
         * cannot be logged is a gap in the audit trail; a projection that
         * cannot be written is a learner whose evidence has stopped moving.
         * Letting the first take down the second would trade something
         * important for something merely useful.
         */
        try {
          const wrote = await store.recordDecision({
            actionId: randomUUID(),
            subjectId,
            actionType: decision.primary.actionType,
            skillId: decision.primary.skill,
            expectedOutcome: decision.primary.expectedOutcome,
            namedMisconception: decision.primary.nova.namedMisconception ?? null,
            reason: decision.primary.reason,
            confidence: decision.primary.confidence,
            novaMode: decision.primary.nova.mode,
            maxHintLevel: decision.primary.nova.maxHintLevel,
            engineVersion: decision.version,
          });
          if (wrote) result.decisionsRecorded += 1;
        } catch (err) {
          result.stateErrors.push({
            subjectId,
            message: `decision not recorded: ${err instanceof Error ? err.message : String(err)}`,
          });
        }

        result.subjectsRebuilt += 1;
      } catch (err) {
        result.stateErrors.push({
          subjectId,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    await store.releaseReducerLease(owner);
  }

  return result;
}
