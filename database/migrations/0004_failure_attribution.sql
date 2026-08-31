-- SolveX learning intelligence — failure attribution.
--
-- WHY
-- Phase 1 could say what a learner did and never why they failed. The
-- verification engine already computes complexity separation, oracle trust and
-- test-set structure, and all of it was discarded once a verdict was emitted.
-- This migration gives the resulting attributions somewhere to be read from.
--
-- Additive only. No existing column is altered or dropped, and no backfill is
-- needed: `attempt_episodes` is a cache, so bumping REDUCER_VERSION (now 3)
-- recomputes every row from `learning_events` on the next sweep.
--
-- NOTHING NEW IS STORED ABOUT THE LEARNER. An attribution is a statement about
-- a submission's failure mode, derived from facts about the PROBLEM — which
-- tests exist, what size they are, whether a slower program was observed to
-- time out. No source code, no test content, no free text.

-- ─── Episode-level rollup ────────────────────────────────────────────────────
--
-- Both columns are derived from `failure_attributed` events and are therefore
-- recomputable. They exist so the replay index and any future consumer can read
-- coverage without opening every episode's raw stream.

alter table attempt_episodes
  add column if not exists attributions jsonb not null default '[]'::jsonb;

alter table attempt_episodes
  add column if not exists attributed_failures int not null default 0;

-- The first honest number Phase 2 can produce: of the episodes that failed, how
-- many can say why. Computable at any sample size, because it is a property of
-- the pipeline rather than of the population — unlike every per-task rate,
-- which needs 30+ episodes before it means anything.
create index if not exists idx_ae_attributed
  on attempt_episodes (attributed_failures)
  where outcome <> 'accepted';

-- ─── Reading attributions out of the raw stream ──────────────────────────────
--
-- A view rather than a table: attributions live in `learning_events`, which is
-- the source of truth, and materialising them again would create a second copy
-- to keep in sync.
--
-- `source_trust` is in the projection deliberately. Ingest refuses to store a
-- `failure_attributed` row without a valid backend signature, so every row here
-- is `judge` or `verifier` by construction — and a query that ever sees
-- `browser` has found a bug worth failing loudly over.

create or replace view learning_failure_attributions as
select e.event_id,
       e.subject_id,
       e.episode_id,
       e.received_at,
       e.source_trust,
       e.payload ->> 'failure_class'                            as failure_class,
       e.payload ->> 'attribution_source'                       as attribution_source,
       (e.payload ->> 'confidence')::numeric                    as confidence,
       (e.payload ->> 'attribution_version')::int               as attribution_version,
       e.payload ->> 'attribution_reason'                       as attribution_reason,
       e.payload ->> 'language'                                 as language,
       (e.payload ->> 'tests_passed')::int                      as tests_passed,
       (e.payload ->> 'tests_total')::int                       as tests_total,
       (e.payload ->> 'failing_test_index')::int                as failing_test_index
from   learning_events e
where  e.event_name = 'failure_attributed';

-- Attribution coverage, the one metric that is meaningful at twenty users.
-- Deliberately NOT per task and NOT per learner: those need sample sizes we do
-- not have, and rendering them would be noise with the authority of a chart.
create or replace view learning_attribution_coverage as
select date_trunc('day', ep.opened_at)                          as day,
       count(*)                                                 as failing_episodes,
       count(*) filter (where ep.attributed_failures > 0)        as episodes_with_attribution,
       round(
         100.0 * count(*) filter (where ep.attributed_failures > 0)
         / nullif(count(*), 0),
       1)                                                       as coverage_pct
from   attempt_episodes ep
where  ep.outcome <> 'accepted'
  and  ep.submissions > 0
group  by 1;
