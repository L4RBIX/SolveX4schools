-- SolveX learning intelligence — the learner projection (L4) and the action
-- ledger (L5/L6).
--
-- WHY THIS IS NOT A FOURTH PROFILE STORE
-- SolveX already holds three learner-level profiles, and adding a fourth beside
-- them would be the duplicate tracking system this work is meant to avoid:
--
--   user_solving_profiles   (Supabase, coach_service.py)  -- see below
--   engineering_skill_profile (Supabase, backend 035)     -- AI Engineering only
--   user_skill_profiles     (Railway SQLite)              -- Codeforces-derived
--
-- `learner_state` is not a peer of those. It SUPERSEDES `user_solving_profiles`
-- for the Arena, and the reason is a correctness one rather than a tidiness one.
-- `coach_service.update_user_solving_profile` computes `weak_tags` by taking
-- every problem tag on every failed event and incrementing all of them, so a
-- compile error on a problem tagged [graphs, dp, greedy] marks all three skills
-- weak. That is precisely the "unsupported weakness" this pipeline exists to
-- refuse, and it is currently rendered to learners in the Arena's coach panel.
--
-- Everything here instead carries the episodes it was derived from, so no claim
-- exists that cannot be traced back to attributed evidence.
--
-- WHAT IT IS
-- A PROJECTION. `learning_events` remains the source of truth; every row below
-- is recomputable by replay and is discarded rather than reinterpreted when
-- `state_version` moves. Deleting every row costs a sweep and loses no facts.
--
-- TARGET: the Supabase project behind SUPABASE_URL, written only by
-- /api/learning/reduce with the service role. RLS enabled, no policies, in the
-- style of 0003/0004 and backend 015/033/035.

-- ─── The learner ─────────────────────────────────────────────────────────────

create table if not exists learner_state (
  subject_id uuid primary key references learning_subjects(subject_id) on delete cascade,

  episodes            int not null default 0,
  -- Assistance, all measured. `hint_dependency` is the share of SOLVED episodes
  -- that needed level-2+ help; a learner who never solves has no dependency
  -- reading rather than a zero one, which is why it is nullable.
  interventions       int not null default 0,
  hint_dependency     real check (hint_dependency is null or (hint_dependency between 0 and 1)),
  median_seconds_to_first_hint int,
  transfer_solves     int not null default 0,
  intervention_outcome_counts jsonb not null default '{}'::jsonb,

  -- The honest denominator. At 75% this whole projection is built on a quarter
  -- of what happened, and a reader who cannot see that will over-trust it.
  unattributed_failures int not null default 0,
  attributed_failures   int not null default 0,

  state_version int not null,
  computed_at   timestamptz not null default now()
);

create index if not exists idx_learner_state_stale
  on learner_state (state_version, computed_at);

-- ─── The learner, per skill ──────────────────────────────────────────────────

create table if not exists learner_skill_state (
  subject_id uuid not null references learning_subjects(subject_id) on delete cascade,
  skill_id   text not null,

  -- Four coarse states, deliberately not a 0-100 score. Three quarters of
  -- failures carry no cause and there is no difficulty calibration, so nothing
  -- available supports a decimal. See docs/learning/INTELLIGENCE_ARCHITECTURE.md.
  level text not null default 'unknown'
        check (level in ('unknown', 'developing', 'competent', 'strong')),

  attempts            int not null default 0,
  solved              int not null default 0,
  solo_solved         int not null default 0,
  assisted_solved     int not null default 0,
  failures            int not null default 0,
  attributed_failures int not null default 0,
  distinct_tasks      int not null default 0,

  -- [{failure_class, occurrences, distinct_episodes, evidence_confidence,
  --   confidence, actionable, first_seen_at, last_seen_at, episode_ids}]
  --
  -- `episode_ids` is the load-bearing field: it is what makes a claim about a
  -- person auditable. A misconception nobody can trace to episodes is an
  -- opinion, and this table does not store opinions.
  misconceptions jsonb not null default '[]'::jsonb,

  -- Built from the same counts as `level`, so the sentence and the state cannot
  -- disagree.
  rationale text not null default '',

  state_version int not null,
  computed_at   timestamptz not null default now(),
  primary key (subject_id, skill_id)
);

create index if not exists idx_learner_skill_level
  on learner_skill_state (skill_id, level);
-- Supports "who has an unresolved misconception of this kind", which is the
-- only cohort query the dashboard needs.
create index if not exists idx_learner_skill_misconceptions
  on learner_skill_state using gin (misconceptions);

-- ─── Actions taken, and whether they worked ──────────────────────────────────
--
-- The decision engine is unfalsifiable without this. It would issue DIAGNOSE
-- forever to a learner it never learns anything about and nothing would notice.

create table if not exists learning_actions (
  action_id  uuid primary key,
  subject_id uuid not null references learning_subjects(subject_id) on delete cascade,

  action_type text not null check (action_type in
    ('DIAGNOSE', 'REMEDIATE', 'STRENGTHEN', 'CHALLENGE', 'REDUCE_ASSISTANCE')),
  skill_id text,

  -- Copied at issue time so a later reading cannot quietly move the bar.
  expected_outcome     text not null,
  named_misconception  text,
  reason               text not null default '',
  confidence           real not null check (confidence between 0 and 1),

  -- What Nova was permitted to do while this action stood. Recorded so a
  -- transcript can be read against the constraint that produced it.
  nova_mode      text,
  max_hint_level smallint,

  engine_version int not null,
  issued_at      timestamptz not null default now()
);

create index if not exists idx_learning_actions_subject
  on learning_actions (subject_id, issued_at desc);
-- The sweep's hot query: the oldest actions, so it can left-join outcomes and
-- pick up the unverified ones. A partial index on "has no outcome" is not
-- expressible -- Postgres forbids subqueries in an index predicate -- so the
-- ordering index plus the outcome table's primary key does the work.
create index if not exists idx_learning_actions_issued
  on learning_actions (issued_at);

create table if not exists learning_action_outcomes (
  action_id uuid primary key references learning_actions(action_id) on delete cascade,

  -- `not_yet` is a first-class verdict, not a null. An action with no follow-up
  -- is unevaluated, and counting that as failure would make a quiet week read
  -- as a regression.
  verdict text not null check (verdict in ('worked', 'did_not_work', 'not_yet')),
  observed text not null default '',
  episodes_considered int not null default 0,

  memory_version int not null,
  checked_at     timestamptz not null default now()
);

create index if not exists idx_action_outcomes_verdict
  on learning_action_outcomes (verdict, checked_at desc);

-- ─── RLS: server-only, matching every other learning table ───────────────────

alter table learner_state             enable row level security;
alter table learner_skill_state       enable row level security;
alter table learning_actions          enable row level security;
alter table learning_action_outcomes  enable row level security;

revoke all on learner_state            from anon, authenticated;
revoke all on learner_skill_state      from anon, authenticated;
revoke all on learning_actions         from anon, authenticated;
revoke all on learning_action_outcomes from anon, authenticated;

-- ─── Deletion ────────────────────────────────────────────────────────────────
--
-- All four cascade from `learning_subjects`, which `learning_forget_user`
-- already deletes — so forgetting a learner forgets their projection without a
-- second deletion path to keep in sync. `solvex_forget_user` needs no change.

-- ─── Metrics ─────────────────────────────────────────────────────────────────
--
-- Views rather than tables: every number is derivable, and materialising them
-- would create a second copy to keep current.
--
-- Deliberately absent: solved count and message volume. Both rise when we
-- simply answer, which is the failure mode this pipeline exists to detect. A
-- board showing solve rate without independence beside it is worse than none.

create or replace view learning_outcomes_daily as
select date_trunc('day', ep.opened_at)                                   as day,
       count(*)                                                          as episodes,
       count(*) filter (where ep.outcome = 'accepted')                    as solved,
       -- The primary metric. Not "solved" — solved WITHOUT help.
       count(*) filter (where ep.outcome = 'accepted'
                          and ep.independence_weight >= 1)                as independent_solves,
       round(100.0 * count(*) filter (where ep.outcome = 'accepted'
                                        and ep.independence_weight >= 1)
             / nullif(count(*) filter (where ep.outcome = 'accepted'), 0), 1)
                                                                          as independence_pct,
       count(*) filter (where ep.intervention_count > 0)                  as episodes_with_help,
       count(*) filter (where ep.solution_revealed)                       as reveals,
       -- Counter-metric. Solves rising while this rises means we are writing
       -- their code.
       sum(ep.attributed_failures)                                        as attributed_failures
from   attempt_episodes ep
group  by 1;

create or replace view learning_action_effectiveness as
select a.action_type,
       count(*)                                                     as issued,
       count(*) filter (where o.verdict = 'worked')                 as worked,
       count(*) filter (where o.verdict = 'did_not_work')           as did_not_work,
       count(*) filter (where o.verdict = 'not_yet' or o.verdict is null) as not_yet,
       -- `not_yet` is excluded from the denominator on purpose.
       round(100.0 * count(*) filter (where o.verdict = 'worked')
             / nullif(count(*) filter (where o.verdict in ('worked', 'did_not_work')), 0), 1)
                                                                     as success_pct
from   learning_actions a
left   join learning_action_outcomes o on o.action_id = a.action_id
group  by a.action_type;

-- Hint dependency over time, per learner. The metric that should go DOWN.
create or replace view learning_dependency_trend as
select ls.subject_id,
       ls.hint_dependency,
       ls.median_seconds_to_first_hint,
       ls.transfer_solves,
       ls.episodes,
       ls.computed_at
from   learner_state ls
where  ls.hint_dependency is not null;
