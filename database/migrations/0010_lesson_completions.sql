-- 0010 — lesson completions
--
-- Which lessons a learner has finished lived in `localStorage` under
-- `solvex.progress.v1` and nowhere else. That is enough to paint the gameboard
-- and useless as a school's record: a cleared cache, a shared classroom
-- machine, a second device — and the year is gone, with nothing raising an
-- error, because there was never a second copy to disagree with.
--
-- WHY A TABLE AND NOT A DERIVATION
--
-- Every other projection in this schema is recomputable from `learning_events`
-- by replay, and that is deliberate. This one is not, and the reason is
-- specific rather than lazy: "the learner reached the last block of the lesson"
-- is not an event anybody records. The ledger holds graded attempts, and
-- walking to the end of a lesson that is half concept blocks produces none. So
-- finishing is written down when it happens or it is not knowable afterwards.
--
-- WHAT THE COUNTS ARE, AND WHAT THEY ARE NOT
--
-- `correct`, `wrong`, `unmeasured` and `attempts` are the player's own tally,
-- posted by the browser. They are a summary of a screen, NOT evidence: every
-- authoritative verdict already sits in `learning_events`, graded server-side
-- by the same pure function the client ran. Nothing downstream may build a
-- skill level, a percentage or any claim about the learner out of these four
-- columns. They are here so the record of a finished lesson carries the shape
-- of the session that finished it, and for nothing else.
--
-- The route bounds them against the lesson's own block count before they arrive
-- — see `src/app/api/learning/complete/route.ts`. A count larger than the
-- number of blocks did not come from a learner finishing a lesson.

begin;

create table if not exists lesson_completions (
  subject_id   uuid not null references learning_subjects(subject_id) on delete cascade,

  -- 'm1.l3', or a monthly check's own id ('m1.assessment'). Validated against
  -- the curriculum before it gets here: a completion for a lesson that does not
  -- exist is a forged request, not a lesson nobody told us about.
  lesson_id    text not null check (char_length(lesson_id) between 1 and 64),

  correct      int not null default 0 check (correct    >= 0),
  wrong        int not null default 0 check (wrong      >= 0),
  unmeasured   int not null default 0 check (unmeasured >= 0),
  attempts     int not null default 0 check (attempts   >= 0),

  completed_at timestamptz not null default now(),

  -- Idempotent by construction, and the write is `do nothing` rather than
  -- `do update`: finishing the same lesson twice is one row, recording the
  -- FIRST time it was finished. Every later pass is still in `learning_events`
  -- in full, so refusing to overwrite loses nothing — and it means a replay
  -- cannot quietly turn two wrong answers into none.
  primary key (subject_id, lesson_id)
);

create index if not exists idx_lesson_completions_recent
  on lesson_completions (subject_id, completed_at desc);

comment on table lesson_completions is
  'One row per lesson a learner finished. Written when it happens: reaching the '
  'end of a lesson is not an event, so unlike every other projection here this '
  'cannot be recomputed from learning_events.';

comment on column lesson_completions.attempts is
  'The player''s own tally, not evidence. Authoritative verdicts live in '
  'learning_events. See the note at the top of this migration.';

-- ── Deletion ────────────────────────────────────────────────────────────────
--
-- No new erasure path: the cascade from `learning_subjects` means
-- `learning_forget_user` already takes these rows with it. A completion table
-- with a bare foreign key would instead make consent revocation fail outright,
-- which is the defect migration 0007 had to go and fix.

alter table lesson_completions enable row level security;
revoke all on lesson_completions from anon, authenticated;

commit;
