-- 0014 — delayed re-solve
--
-- The approved programme's fifth independence check (PDF p.6):
--
--   «Көмекпен шешілген есеп бірнеше аптадан соң қайта беріледі және бұл жолы
--    көмексіз орындалады»
--
-- A task solved WITH HELP comes back after some weeks, and that time it is done
-- WITHOUT help. The forensic audit recorded it as the one requirement with
-- nothing at all behind it, and said why: it needs a queue, a due date and a
-- way to re-open a settled block, and the product had no shape for any of them.
-- This table is that shape.
--
-- ── Why a table and not a derivation ────────────────────────────────────────
--
-- Same reason as `lesson_completions`, and it is worth stating rather than
-- assuming. Eligibility IS derivable from `learning_events` — an accepted
-- verdict with an `assistance_delivered` on the same episode is a solve that
-- took help, and that is exactly how a row gets written. What is NOT derivable
-- is everything after that: when it fell due under the policy in force at the
-- time, whether the learner has since sat it, and which fresh episode carried
-- the re-solve. A queue whose contents are recomputed on every read also
-- silently re-opens work the learner has already done, because raw events are
-- purged at 180 days and the derivation would quietly change its mind.
--
-- What this table does NOT hold is the re-solve itself. That is an ordinary
-- attempt and it goes to `learning_events` under its own episode id like every
-- other attempt in the product. There is deliberately no second ledger here.
--
-- ── The assistance reset, which is the entire point of the feature ──────────
--
-- «бұл жолы көмексіз орындалады» is the requirement. A re-solve that inherits
-- the hint level of the original solve is not a re-solve, it is the same
-- session continued a week later, and it would produce evidence of independence
-- that the learner never demonstrated.
--
-- The mechanism is `review_episode_id`, and it is a SEPARATE COLUMN from
-- `origin_episode_id` rather than a flag on the original:
--
--   * `LearningStore.lastGrantedLevel` reads `max(level) from interventions
--     where episode_id = $1`. A new episode id has no interventions, so the
--     ladder reads -1 and `grantHintLevel` starts at the opening rung.
--   * `enforceHintPolicy` derives `hasAttempted` from that episode's own
--     events. A fresh episode has none, so the first hint request answers
--     `attempt_required` — the learner must try before help opens, exactly as
--     on a task they have never seen.
--   * `revealFor` counts failed attempts on the episode. Fresh episode, zero
--     prior failures, nothing revealed.
--   * The reducer folds the review episode into its own `attempt_episodes` row
--     with its own `max_assistance_level` and `independence_weight`, so the
--     re-solve's independence is measured on its own and never averaged into
--     the original attempt.
--
-- A CHECK below refuses to let the two ids be equal. That constraint is the
-- feature: without it, one careless assignment in a route turns the whole
-- independence check into a lie that nothing would notice.
--
-- ── What the columns may not become ─────────────────────────────────────────
--
-- There is no free-text column here and there must not be one. This table says
-- what happened — a task was solved with help, it was scheduled, it was
-- re-solved — and nothing about what that means about the learner. The rule is
-- the same one migration 0011 makes structural for the error dictionary.

begin;

create table if not exists review_schedule (
  review_id     uuid primary key,

  subject_id    uuid not null references learning_subjects(subject_id) on delete cascade,

  -- The curriculum block to be re-solved. Validated against the curriculum
  -- before it is written and resolved again on read: a review for a block that
  -- no longer exists is dropped from the listing rather than shown as a
  -- dangling id.
  block_id      text not null check (char_length(block_id) between 1 and 64),

  -- Why this task earns a re-solve. Both values are facts the ledger can prove:
  --   solved_with_assistance — an `assistance_delivered` event on the accepted
  --                            episode. Delivery, not request: help the learner
  --                            asked for and never received is not help.
  --   independent_milestone  — accepted with no assistance, on a block the
  --                            curriculum declares load-bearing (a `challenge`,
  --                            a `verify`, or a monthly-check block).
  -- There is deliberately no third value meaning "the system thought it would
  -- be good for them".
  reason        text not null check (reason in ('solved_with_assistance', 'independent_milestone')),

  -- Highest hint level actually DELIVERED on the original solve, or -1 for
  -- none. Mirrors `attempt_episodes.max_assistance_level`, including its
  -- sentinel, so the two cannot be read as disagreeing.
  origin_level  smallint not null default -1 check (origin_level between -1 and 4),

  -- The episode that produced the evidence. The ORIGINAL attempt.
  origin_episode_id uuid not null,
  origin_at         timestamptz not null,

  -- Product default at the time of scheduling, applied to `origin_at`. Stored
  -- rather than recomputed so changing the policy does not retroactively move
  -- every queued review — a learner's queue must not reorder itself under them.
  due_at        timestamptz not null,

  -- The policy that scheduled it, so a row can still be explained after the
  -- defaults change.
  policy_id     text not null default 'review.v1' check (char_length(policy_id) between 1 and 32),

  -- ── The re-solve ─────────────────────────────────────────────────────────
  --
  -- Null until the learner opens it. Minted on the SERVER: a browser that could
  -- name its own review episode could name the original one, and the whole
  -- independence reset would be a client-side suggestion.
  review_episode_id uuid,
  started_at        timestamptz,
  completed_at      timestamptz,

  -- Settled from the ledger's own verdict for the review episode, never from a
  -- claim. `unresolved` is a real outcome and is not a failure: it is what a
  -- re-solve of a written or oral block settles as, because no machine scores
  -- one.
  outcome       text check (outcome in ('resolved_independently', 'resolved_with_assistance', 'unresolved')),

  created_at    timestamptz not null default now(),

  -- The re-solve must not inherit the original's episode. See the header: this
  -- is the constraint that makes the independence reset structural instead of
  -- conventional.
  constraint review_schedule_fresh_episode
    check (review_episode_id is null or review_episode_id <> origin_episode_id),

  -- One review per solve. Scheduling is idempotent by construction, so the
  -- submit route can call it on every accepted verdict without a learner who
  -- re-runs a task collecting duplicate reviews of it.
  constraint review_schedule_one_per_solve
    unique (subject_id, block_id, origin_episode_id)
);

-- The queue read: "what is due for this learner". Partial, because a completed
-- review is never in it and the completed rows will outnumber the open ones
-- within a term.
create index if not exists idx_review_due
  on review_schedule (subject_id, due_at)
  where completed_at is null;

create index if not exists idx_review_block
  on review_schedule (subject_id, block_id);

comment on table review_schedule is
  'Delayed re-solve — the programme''s fifth independence check (PDF p.6). One '
  'row per solve that earns a re-solve. The re-solve itself is an ordinary '
  'attempt in learning_events under review_episode_id.';

comment on column review_schedule.review_episode_id is
  'A FRESH episode id, minted server-side. Being different from '
  'origin_episode_id is what resets the hint ladder, the reveal counter and the '
  'independence measurement. Enforced by review_schedule_fresh_episode.';

comment on column review_schedule.due_at is
  'origin_at plus the policy delay in force when the row was written. Stored, '
  'not recomputed: a change of default must not reorder a learner''s queue.';

-- ── Deletion ────────────────────────────────────────────────────────────────
--
-- The cascade from `learning_subjects` means `learning_forget_user` already
-- takes these rows with it — it ends by deleting the subject, and a bare
-- foreign key here would make that delete fail, which is the exact defect
-- migration 0007 had to go and repair.

alter table review_schedule enable row level security;
revoke all on review_schedule from anon, authenticated;

commit;
