-- 0023 — SolveX Leagues: an XP ledger, a weekly group, and a settled result
--
-- ── What this is, and the one sentence that bounds it ───────────────────────
--
-- XP is GAMIFICATION DATA. It is not mastery, not independence evidence, not a
-- skill credit, not an assessment score, not teacher evidence, not lesson
-- completion and not a verdict. Nothing downstream builds a belief about a
-- learner out of any column below, and `learner_state` never reads one.
--
--     Learning Intelligence answers "what does this learner know?"
--     XP answers "what did this learner do this week?"
--
-- The second is a much smaller question. The tables below are shaped so it
-- cannot grow into the first: there is no score column, no percentage, no
-- level-of-understanding, no skill reference and nowhere to write one.
--
-- ── Why XP is a table and not an event ─────────────────────────────────────
--
-- The obvious design is an `xp_awarded` row in `learning_events`, and it would
-- have silently corrupted the reducer.
--
-- `reduceEpisode` derives three fields from the SHAPE and TIMING of the whole
-- ordered event array rather than from any named key: `event_count` is
-- `ordered.length`, `active_seconds` comes from `activeTime(ordered)`, and
-- `struggle_class` comes from `classifyStruggle(ordered, …)` by way of
-- `longestGap(ordered)`. An extra row in an episode's stream therefore moves
-- all three for a REAL episode, even though no branch anywhere reads the word
-- "xp". The ingest route already refuses unknown names for exactly this reason
-- — they are "dropped, not coerced", because a default would "quietly change
-- the episode's event_count".
--
-- The contracts file says the same thing from the other direction:
--
--     "An event is admissible only if you can name the decision it changes.
--      'It would be interesting to know' is not a decision."
--
-- XP changes no pedagogical decision. It fails that admission test by
-- construction, so it lives here instead and emits no event, ever.
--
-- ── Recomputability, and the invariant 0010 had to argue ───────────────────
--
-- `learning_events` is the source of truth and everything else in this schema
-- is a cache that can be dropped and replayed. Migration 0010 had to justify
-- being an exception. This one does not need to, and the reason is worth
-- stating because it is what keeps the exception list from growing:
--
--   * WHAT is awarded is a pure function of the ledger — the first trusted
--     accepted verdict for a block, the first completion of a lesson.
--   * WHICH WEEK it belongs to is derived from `learning_events.received_at`,
--     which is OUR clock and immutable.
--   * HOW MUCH it was worth is pinned by `policy_version`.
--
-- So `league_xp_awards` is fully rebuildable from `learning_events` plus a
-- policy version, and a rebuild produces the same rows in the same weeks for
-- the same amounts. It is a cache that happens to be written eagerly, not a
-- second source of truth. `league_settlements` is the one genuinely
-- non-recomputable table, and its header below says why that is deliberate.
--
-- ── The anti-farming design is the primary key ─────────────────────────────
--
-- There is no first-solve ledger in this product. `learning_submissions` dedups
-- only identical `(subject_id, submission_id)`, the id lives in a client ref
-- that hydration does not restore, and `hydration.ts` deliberately withholds
-- the episode id once a block is accepted. So today:
--
--     reload -> resubmit the same correct answer
--       -> new submissionId, new episodeId, a SECOND accepted verdict row
--
-- That is a real, open farming vector. It is closed here structurally rather
-- than by a check:
--
--     primary key (subject_id, achievement, entity_id)
--
-- `entity_id` is a CURRICULUM entity — a block id, a lesson id, a review id.
-- Never a submission, never an episode, never a timestamp, never anything a
-- learner can produce a second copy of. The second solve computes the same key
-- and the insert is refused by the database.
--
-- The consequence is the property the whole subsystem rests on: the curriculum
-- is finite, so LIFETIME XP IS BOUNDED and there is no repeatable source of it
-- anywhere. Pressing Run cannot earn XP because Run is not a curriculum entity
-- and writes no row at all. Nova cannot be farmed because asking for help is
-- not an achievement. Guessing an MCQ repeatedly cannot earn XP because only
-- the first accepted verdict has a key that inserts.
--
-- ── Erasure ────────────────────────────────────────────────────────────────
--
-- Every table here keys on `subject_id` with `on delete cascade`, so the chain
-- is the one six previous migrations already follow and `learning_forget_user`
-- needs NO new statement:
--
--   learning_forget_user(target)
--     -> delete from learning_subjects where subject_id = subj        (0003)
--     -> league_xp_awards.subject_id    references … on delete cascade (here)
--     -> league_memberships.subject_id  references … on delete cascade (here)
--     -> league_settlements.subject_id  references … on delete cascade (here)
--     -> league_profiles.subject_id     references … on delete cascade (here)
--
-- Keying on `user_id` instead would have put every one of these OUTSIDE the
-- erasure path, and not obviously: `learning_forget_user` never deletes the
-- `school_accounts` row, because 0012 disables accounts rather than deleting
-- them ("Disabled, never deleted"). A cascade from `school_accounts` therefore
-- never fires. `nova_usage` and `rate_limit_bucket` already leak this way and
-- are logged as open finding #6 in `docs/pilot/PRIVACY_DATA_FLOWS.md`. The
-- league is not the third.
--
-- A bare foreign key would have been worse still: it makes that final DELETE
-- throw, and consent revocation fails outright for the child exercising it —
-- which is the defect 0007 had to go back and repair.
--
-- NOTE on what erasure takes with it. A settled week's leaderboard loses the
-- erased learner's row entirely, and the ranks of the learners around them are
-- NOT rewritten — `league_settlements` stores each learner's own rank, so the
-- surviving rows keep the number they were given at the time. A history with a
-- gap in it is the correct outcome: the alternative is retaining a deleted
-- child's position so that other children's positions still add up, which is
-- keeping identifying data for the convenience of a leaderboard.
--
-- ── No school or class column, deliberately ────────────────────────────────
--
-- `league_groups` carries `school_id` and `class_id`; the learner-keyed tables
-- do not. This is the shape `attempt_episodes` already has — it has no school
-- column at all, and every class-scoped aggregate works by passing a
-- pre-filtered `subject_ids` array.
--
-- Copying it here is deliberate. A denormalised `class_id` on an award row
-- would go stale the moment a learner transfers class, and there is no FK that
-- could stop it: `school_subject_scope.class_id` is unregistered `text` with no
-- reference to `school_classes` and no cross-school uniqueness, which is why
-- `store.subjectsInClass` filters on `class_id` alone and why two deployments
-- both left on the default `grade-9a` read each other's children. Scope belongs
-- to the GROUP, which is created once for a known `(school_id, class_id)` pair
-- sourced from `class_enrolments`, and a learner's scope is then whichever
-- group they are a member of.

begin;

-- ── 1. The ledger ──────────────────────────────────────────────────────────
--
-- Append-only in practice: nothing in the product updates or deletes a row
-- here. There is no `total_xp` column on any account anywhere, and there must
-- not be — `users.total_xp += 10` is unauditable by construction, and the
-- question this table exists to answer is not "how much" but "WHY".

create table if not exists league_xp_awards (
  subject_id     uuid not null
                 references learning_subjects(subject_id) on delete cascade,

  -- Closed vocabulary, mirroring `XP_ACHIEVEMENTS` in
  -- `schools/leagues/xp-policy.ts`. A CHECK rather than a free string for the
  -- same reason `human_reviews.disposition` has one: a vocabulary a route
  -- cannot quietly extend is a vocabulary somebody had to review.
  achievement    text not null check (achievement in (
                   'block_solved',
                   'block_solved_unaided',
                   'challenge_solved',
                   'explanation_submitted',
                   'lesson_completed',
                   'assessment_completed',
                   'review_resolved'
                 )),

  -- The curriculum entity. A block id, a lesson id, a review id.
  --
  -- NEVER learner content. No answer text, no code, no prose, no hidden test
  -- case, no reference solution — this column is an identifier from published
  -- curriculum, which is the same class of data `opsLog` is allowed to carry
  -- and for the same reason: it is not personal.
  entity_id      text not null check (char_length(entity_id) between 1 and 128),

  -- Positive, always. There is no negative amount in the policy and no code
  -- path that removes XP: a wrong answer earns nothing, it does not cost
  -- anything, and asking for help does not either. The CHECK makes "XP as a
  -- punishment" a migration rather than a patch.
  amount         int not null check (amount > 0),

  -- ISO week, `2026-W37`, derived SERVER-SIDE from `received_at`.
  --
  -- Never from `occurred_at`, which 0003 names as "the client's and forgeable".
  -- A browser with its clock wound back must not be able to post work into a
  -- settled competition, and this column is the only place that could allow it.
  week_id        text not null check (week_id ~ '^[0-9]{4}-W[0-9]{2}$'),

  -- Which version of the policy priced this. History stays readable under the
  -- rules that produced it instead of being reinterpreted under today's — the
  -- same reason episodes carry `reducer_version`.
  policy_version text not null check (char_length(policy_version) between 1 and 32),

  awarded_at     timestamptz not null default now(),

  -- The episode this came from, for audit. Nullable, and a BARE reference
  -- would be wrong here in a way worth spelling out: `learning_forget_user`
  -- DELETEs `attempt_episodes` explicitly before dropping the subject, and a
  -- bare FK to it would make that delete throw and break erasure. `on delete
  -- set null` keeps the audit trail where it survives and gives it up where it
  -- must.
  source_episode uuid,

  -- THE anti-farming constraint. See the header.
  primary key (subject_id, achievement, entity_id)
);

-- The leaderboard's only hot query: sum a week's XP for a set of learners.
-- Covering, so the sum never touches the heap.
create index if not exists idx_league_xp_week
  on league_xp_awards (week_id, subject_id) include (amount);

-- "Why do I have this?" — a learner's own ledger, newest first.
create index if not exists idx_league_xp_subject
  on league_xp_awards (subject_id, awarded_at desc);

comment on table league_xp_awards is
  'Append-only XP ledger. One row per (learner, achievement, curriculum entity), '
  'and that primary key is the anti-farming design: a second solve of the same '
  'block computes a key that already exists and is refused by the database. XP '
  'is gamification data and is NEVER evidence — nothing builds a skill level, an '
  'independence belief or an assessment verdict from it, and no learning event '
  'is written for it. Rebuildable from learning_events plus a policy version.';

comment on column league_xp_awards.entity_id is
  'A curriculum identifier: block, lesson, or review. Never learner content, '
  'never an answer, never a submission or episode id — those are not stable '
  'and a key a learner can mint twice is a key that can be farmed.';

comment on column league_xp_awards.week_id is
  'ISO week derived server-side from received_at, never from the client clock.';

-- ── 2. The learner's place on the ladder ───────────────────────────────────
--
-- Carried BETWEEN weeks, which is the only reason it is a table rather than a
-- derivation. Recomputing "which tier am I in" by replaying every settlement
-- from September would work and would get slower every month, and the ladder
-- is read on every page load of the league screen.

create table if not exists league_profiles (
  subject_id uuid primary key
             references learning_subjects(subject_id) on delete cascade,

  -- 1..10. The STORED identity of a tier; the name is presentation and lives
  -- in `schools/leagues/tiers.ts`. Renaming a tier must not move anybody, which
  -- is only true because no row anywhere stores a name.
  tier       smallint not null default 1 check (tier between 1 and 10),

  updated_at timestamptz not null default now()
);

comment on table league_profiles is
  'A learner''s current rung on the ladder, carried between weeks. Created by '
  'their first eligible XP, moved only by a settlement. Not evidence: a tier '
  'says how recent weeks went, never what a learner understands.';

-- ── 3. The weekly group ────────────────────────────────────────────────────
--
-- Scoped to ONE class. Not to a school, and certainly not globally.
--
-- Migrations 0007 and 0012 both state that "there is deliberately no flat admin
-- path that reads across schools", and a cross-school leaderboard would be
-- exactly that path wearing a game's clothes. The teacher leaderboard reached
-- the same conclusion independently: "It is class-only. There is no cross-class
-- and no cross-school comparison anywhere in this file."
--
-- `ordinal` exists so a class larger than one group splits deterministically
-- rather than growing without bound. The pilot is eighteen children in one
-- class and will only ever have ordinal 1; the column is here so that the
-- second class to arrive does not need a migration.

create table if not exists league_groups (
  group_id   uuid primary key,

  week_id    text not null check (week_id ~ '^[0-9]{4}-W[0-9]{2}$'),
  tier       smallint not null check (tier between 1 and 10),

  -- Text, like every other id a school recognises. Migration 0009 exists solely
  -- because 0007 made these uuids.
  school_id  text not null check (char_length(school_id) between 1 and 64),
  class_id   text not null check (char_length(class_id) between 1 and 64),

  ordinal    int not null default 1 check (ordinal >= 1),

  created_at timestamptz not null default now(),

  -- Set once, by settlement. `is null` is the whole "has this week been dealt
  -- with" question, and the partial index below is what makes asking it cheap.
  settled_at timestamptz,

  -- One group per (week, tier, class, ordinal). This is what makes group
  -- creation race-safe: two learners earning their first XP at the same instant
  -- both try to create the same group, one wins, and the loser's
  -- `on conflict do nothing` re-reads the winner's row.
  unique (week_id, tier, school_id, class_id, ordinal)
);

-- Settlement's only query: which groups have closed and not been dealt with.
-- Partial, so it holds only the rows that are ever selected — the same shape as
-- `idx_le_closed` and `idx_learning_submissions_inflight`.
create index if not exists idx_league_groups_unsettled
  on league_groups (week_id) where settled_at is null;

comment on table league_groups is
  'One weekly competition group, scoped to a single class. Cross-school and '
  'cross-class grouping are deliberately impossible: migrations 0007 and 0012 '
  'both refuse a query path that reads across schools, and children competing '
  'with strangers is that path. Underfilled groups are normal and are never '
  'padded with synthetic members.';

-- ── 4. Membership ──────────────────────────────────────────────────────────
--
-- Created LAZILY, by the learner's first eligible award of the week, in the
-- same transaction as that award.
--
-- Not by a Monday job that enrols everybody. A row per learner per week whether
-- or not they turned up would mean a leaderboard mostly full of zeroes, a
-- settlement relegating children for a week in which the product never saw
-- them, and — for a class where several are absent — a public list of who was
-- away. Lazy entry makes "did not compete" and "competed badly" different
-- states, which they are.
--
-- It also gives the ranking code a property it would otherwise have to defend:
-- EVERY MEMBER HOLDS AT LEAST ONE POINT. There is no zero-XP member to decide
-- what to do with, because membership is created by an award.

create table if not exists league_memberships (
  subject_id uuid not null
             references learning_subjects(subject_id) on delete cascade,

  week_id    text not null check (week_id ~ '^[0-9]{4}-W[0-9]{2}$'),

  group_id   uuid not null references league_groups(group_id) on delete cascade,

  -- Copied from the profile at join time and FROZEN.
  --
  -- Denormalised on purpose: a settlement must rank a learner in the tier they
  -- competed in, and reading it back from `league_profiles` would read the tier
  -- they are in NOW — which the settlement of an earlier week may already have
  -- moved. A learner whose Monday settlement promoted them would otherwise have
  -- last week's result recomputed against this week's tier.
  tier       smallint not null check (tier between 1 and 10),

  joined_at  timestamptz not null default now(),

  -- One group per learner per week, structurally.
  --
  -- This is the constraint that makes concurrent first-awards safe. Two
  -- requests racing to admit the same learner both insert; one wins, the other
  -- conflicts and re-reads. There is no window in which a learner is in two
  -- groups, and no application check that has to remember to prevent it.
  primary key (subject_id, week_id)
);

create index if not exists idx_league_memberships_group
  on league_memberships (group_id);

comment on table league_memberships is
  'One row per learner per week, created by their FIRST eligible XP award of '
  'that week and never by a scheduled enrolment. The primary key makes a '
  'learner in two groups impossible rather than merely unlikely. tier is frozen '
  'at join time so a settlement ranks the learner in the tier they competed in.';

-- ── 5. The settled result ──────────────────────────────────────────────────
--
-- The one table here that is NOT recomputable, and that is the point.
--
-- A settlement is a SNAPSHOT of a judgement made under a specific policy at a
-- specific moment. Recomputing last September's promotions under whatever the
-- thresholds are in March would silently rewrite what a child was told, so
-- every input to the decision is stored beside the decision: the XP, the rank,
-- the group size, the tier they were in, what happened, the tier they ended in,
-- and the policy version that decided it.
--
-- Immutable in practice. The write is `on conflict do nothing`, so a retried or
-- concurrent settlement produces no second result and no changed one. Combined
-- with `settleGroup` being pure and total, a settlement that crashes halfway
-- can simply be run again: it recomputes identical rows and re-inserts the ones
-- that are missing.

create table if not exists league_settlements (
  subject_id     uuid not null
                 references learning_subjects(subject_id) on delete cascade,

  week_id        text not null check (week_id ~ '^[0-9]{4}-W[0-9]{2}$'),

  -- Not a foreign key, deliberately. A settlement outlives its group: dropping
  -- a stale `league_groups` row for storage must not take a learner's history
  -- with it, and this column's job is to say which group the result came from,
  -- not to guarantee that group still exists.
  group_id       uuid not null,

  final_xp       int not null check (final_xp >= 0),
  rank           int not null check (rank >= 1),
  group_size     int not null check (group_size >= 1),

  tier_before    smallint not null check (tier_before between 1 and 10),
  movement       text not null check (movement in ('promoted', 'stayed', 'relegated')),
  tier_after     smallint not null check (tier_after between 1 and 10),

  policy_version text not null check (char_length(policy_version) between 1 and 32),
  settled_at     timestamptz not null default now(),

  -- One result per learner per week. A second settlement of the same week
  -- cannot produce a second promotion.
  primary key (subject_id, week_id)
);

-- "What happened last week?" on the learner's own page, and the result banner.
create index if not exists idx_league_settlements_subject
  on league_settlements (subject_id, week_id desc);

comment on table league_settlements is
  'The immutable result of one closed week for one learner. Stores every input '
  'to the decision — xp, rank, group size, tier before, movement, tier after, '
  'policy version — so history is never recomputed under later rules. The '
  'primary key makes a double promotion impossible; the write is on-conflict-do-'
  'nothing so a retried or crashed settlement is safe to simply run again.';

comment on column league_settlements.group_id is
  'Which group produced this result. Deliberately NOT a foreign key: a '
  'learner''s history must outlive the pruning of an old group row.';

-- ── Row level security ─────────────────────────────────────────────────────
--
-- Enabled with ZERO policies on every table, and `revoke all` beside it. That
-- combination is the product's standing rule since 0008 had to go back and fix
-- `school_subject_scope` for shipping without either: a browser holding a valid
-- JWT gets zero rows, and the service role the app connects as bypasses RLS.
-- Nothing here is ever read by an anonymous or authenticated Postgres role.

alter table league_xp_awards   enable row level security;
alter table league_profiles    enable row level security;
alter table league_groups      enable row level security;
alter table league_memberships enable row level security;
alter table league_settlements enable row level security;

revoke all on league_xp_awards   from anon, authenticated;
revoke all on league_profiles    from anon, authenticated;
revoke all on league_groups      from anon, authenticated;
revoke all on league_memberships from anon, authenticated;
revoke all on league_settlements from anon, authenticated;

commit;
