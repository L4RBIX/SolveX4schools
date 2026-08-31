-- 0022 — a teacher has read this, and what they decided to do about it
--
-- ── The gap this closes ─────────────────────────────────────────────────────
--
-- Migration 0021 gave `learning_submissions` an `answer` column, and the
-- teacher console learned to open it: a teacher can now read the explanation a
-- fourteen-year-old wrote. Nothing could record that they had.
--
-- The visible consequence was a counter that never moved. «Ждут проверки — 3»
-- counted SUBMISSIONS, because submissions were the only thing there was to
-- count, so a teacher could read all three and watch the number stay at three.
-- The console said so in words rather than pretending otherwise, which was the
-- honest thing to do with no table, and is the wrong thing to keep doing once
-- one exists.
--
-- ── What this table is NOT, and why the absences are the design ─────────────
--
-- There is no score. No grade, no percentage, no mark, no `correct` boolean, no
-- band, no rubric outcome, and no column for anything a model said about the
-- text. This is not caution, it is the same mechanism migration 0016 argues at
-- length for `post_help_explanations`:
--
--     "There is no score column. […] That absence is the mechanism […] a rule
--      that explanations are never auto-graded is a rule someone eventually
--      works around; a schema with nowhere to write a grade is not."
--
-- 0016's guarantee is untouched by this file: no column is added there, and a
-- row here is not evidence about a learner. Nothing downstream reads this table
-- to build a skill level, an independence weight, a NovaDirective or an
-- assessment verdict — `learning_events` remains the only evidence stream, and
-- this table is not in it.
--
-- What it records is an OPERATION performed by a member of staff: somebody read
-- this, on this date, and decided whether the class needs to come back to it.
-- That is a workflow fact about an adult's working day, not a measurement of a
-- child.
--
-- There is also no teacher NOTE. A note would be adult-authored free text about
-- a named minor, which is a different category of data from anything this
-- product currently stores — it raises disclosure questions (to the learner? to
-- a parent? on export?) that no existing table has had to answer. There is no
-- defensible storage path for it yet, so there is no column for it yet.
--
-- ── Why the key is (subject_id, submission_id) ──────────────────────────────
--
-- Because the reviewable unit is an ARTIFACT, not a task. `learning_submissions`
-- is keyed `(subject_id, submission_id)` and a submission id identifies one
-- (block, exact answer) pair — see 0019. So this key means "a teacher read
-- THIS text".
--
-- The alternative, keying on `(subject_id, block_id)`, would mean "a teacher
-- has dealt with this task for this learner", and it fails in a case that will
-- happen: a learner reads the teacher's feedback, rewrites their explanation
-- and submits again. Under this key the new artifact has no review row and
-- returns to the pending queue, which is correct — nobody has read the new
-- words. Under the other key it would stay silently marked as reviewed, and the
-- rewrite the teacher asked for would be the one thing they never saw.
--
-- The composite foreign key is what makes that true rather than conventional: a
-- review cannot name a submission that does not exist, and cannot name one
-- belonging to a different learner.
--
-- ── One row per artifact. No history, deliberately ─────────────────────────
--
-- The primary key is the same pair, so a re-review UPDATES rather than appends.
-- Two consequences, both wanted:
--
--   * Double-clicking «Прочитано» cannot produce two rows, and a retried
--     request settles to the same state as the first. The idempotency is
--     structural rather than a check somebody has to remember to write.
--   * Re-pressing the SAME disposition leaves the row entirely alone —
--     `reviewed_by` and `reviewed_at` both stay. They move together or not at
--     all: freezing the timestamp while overwriting the reviewer produced a row
--     saying teacher B read the work at teacher A's moment, which is a lie
--     about an adult in the one table whose whole content is who read this.
--   * Changing `reviewed` to `needs_followup` (or back) replaces the decision,
--     and reviewer and timestamp move with it — a teacher looking at a
--     follow-up flag wants to know who raised it and when, not who first
--     opened the answer.
--
-- History is not modelled because the product has no question that needs it.
-- Nothing reports on how a teacher's mind changed, and an append-only log of
-- staff decisions about named children is a surveillance surface nobody asked
-- for. If a school ever needs an audit trail, that is a deliberate second
-- table with its own retention argument, not a column added here.
--
-- ── Erasure ─────────────────────────────────────────────────────────────────
--
-- No new erasure path, and the chain is worth writing out because a broken link
-- would leave a deleted child's row behind:
--
--   learning_forget_user(target)
--     -> delete from learning_subjects where subject_id = subj      (0003)
--     -> learning_submissions.subject_id references learning_subjects
--        on delete cascade                                          (0019)
--     -> human_reviews (subject_id, submission_id) references
--        learning_submissions on delete cascade                     (here)
--
-- So a learner exercising consent revocation takes the reviews of their work
-- with them, and `learning_forget_user` needs no new statement — the same rule
-- 0010, 0011, 0014, 0016 and 0019 follow. A bare foreign key here would instead
-- make revocation fail outright, which is the defect 0007 had to go back and
-- fix.
--
-- `reviewed_by` is a BARE foreign key — no on-delete clause — and the choice is
-- deliberate enough to argue, because the nearest FKs to `school_accounts` all
-- cascade and copying them here would be wrong.
--
-- `class_teachers`, `class_enrolments` and `school_sessions` cascade because
-- they are MEMBERSHIP rows: a person who no longer exists is not in a class and
-- has no session, so those rows should die with the account. This is not one of
-- those. The closest precedent is `curriculum_publications.reviewer_id` (0013),
-- which is also bare, and for the reason that applies here: it records that a
-- named adult approved something for minors, and an approval that silently
-- disappears with its approver is not an approval record.
--
-- So deleting an account that has reviewed anything FAILS, loudly, instead of
-- erasing the fact that a child's work was read. That costs nothing
-- operationally: nothing in this codebase deletes an account row. 0012 says so
-- in terms — «Disabled, never deleted» — and a member of staff who leaves has
-- `disabled_at` set. The constraint forbids exactly one thing, and that thing
-- is the thing it should forbid.

begin;

create table if not exists human_reviews (
  -- Both halves of `learning_submissions`'s primary key. Named separately
  -- because `subject_id` also carries the erasure cascade above.
  subject_id    uuid not null,
  submission_id uuid not null,

  -- ── who ────────────────────────────────────────────────────────────────
  -- The member of staff who made the decision, resolved from their SESSION and
  -- never from a request body. The route that writes this checks
  -- `class_teachers` for the class the learner is enrolled in before it gets
  -- here; this column records the answer rather than establishing it.
  reviewed_by   uuid not null references school_accounts(user_id),

  -- ── when ───────────────────────────────────────────────────────────────
  -- When the CURRENT disposition was decided, not when the answer was first
  -- opened. A re-review moves it.
  reviewed_at   timestamptz not null default now(),

  -- ── what was decided ───────────────────────────────────────────────────
  --
  --   reviewed        a person has read this and nothing further is needed
  --   needs_followup  a person has read this and the class or the learner
  --                   needs to come back to it
  --
  -- Both mean READ. Neither is a judgement of the answer's quality, and there
  -- is deliberately no third value that could be — a vocabulary closed by a
  -- CHECK is one a route cannot quietly extend, which is the point. Adding a
  -- value is a migration with a reviewer.
  disposition   text not null check (disposition in ('reviewed', 'needs_followup')),

  -- One row per artifact: a re-review updates, and a double click cannot append.
  primary key (subject_id, submission_id),

  foreign key (subject_id, submission_id)
    references learning_submissions (subject_id, submission_id)
    on delete cascade
);

-- ── No secondary index, deliberately ────────────────────────────────────────
--
-- A partial index on `disposition = 'needs_followup'` was the obvious thing to
-- add and it would never have been used: both reads join this table on its
-- primary key — `h.subject_id = s.subject_id and h.submission_id =
-- s.submission_id` — and the pending / follow-up / reviewed split happens in
-- the application over an array that is already in memory. The primary key
-- serves every query there is.
--
-- An index whose comment claims a purpose no query has is worse than no index:
-- it tells the next reader a query shape exists somewhere, and they will go
-- looking for it. `idx_post_help_reviewable` in 0016 is exactly that, and this
-- file is not adding a second one.

comment on table human_reviews is
  'One row per submitted artifact a member of staff has read. Records WHO read '
  'it, WHEN, and whether the class needs to come back to it. Deliberately has '
  'no score, no grade and no note: it is an operational record of an adult''s '
  'action, never evidence about a learner, and nothing downstream reads it to '
  'build a skill level, an independence weight or an assessment verdict.';

comment on column human_reviews.disposition is
  'reviewed | needs_followup. Both mean a person has READ the answer. Neither '
  'is a judgement of its quality and there is no third value.';

comment on column human_reviews.reviewed_at is
  'When the current disposition was decided. A re-review moves it, because the '
  'question a follow-up flag raises is when it was raised.';

alter table human_reviews enable row level security;
revoke all on human_reviews from anon, authenticated;

-- ── 0020's retention contract, extended ─────────────────────────────────────
--
-- 0020 wrote the sweep rule into `learning_submissions`'s own table comment,
-- because a rule that lives only in a migration header is a rule the person
-- writing the sweep will not read. That comment now has a new dependency: this
-- table cascades from `learning_submissions`, so deleting a superseded
-- submission also deletes any record that a teacher read it.
--
-- Under 0020's stated rule — keep the latest settled row per
-- (subject_id, block_id) — that is the correct outcome: the reviews being
-- dropped are reviews of superseded text, and the artifact they refer to is
-- gone. It is restated here, on the table itself, so nobody writes the sweep
-- from a comment that predates this file.
comment on table learning_submissions is
  'Dedup ledger for POST /api/learning/submit AND the lesson page''s hydration '
  'source. One row per submission id per subject: claimed before the judge '
  'runs, settled with the response afterwards, so a retry replays the verdict '
  'instead of writing a second set of learning events, and a refresh restores '
  'what the learner was already shown. NOT evidence — the record of every '
  'attempt is learning_events, and that is what the teacher console and the '
  'reducer read. A retention sweep must keep the latest settled row per '
  '(subject_id, block_id); see migration 0020. Deleting a row also deletes any '
  'human_reviews row for it, by cascade; see migration 0022.';

commit;
