-- 0011 — the learner's own error dictionary
--
-- The approved programme promises «Жеке қателер журналы» — the platform
-- gathers a learner's repeated mistakes into a personal checklist — and
-- «Оқушы өзінің қателер сөздігін жинай бастайды»: the learner BEGINS TO
-- COLLECT their own dictionary. The verb is the specification. This is a
-- document a child assembles, not a report the system files about them.
--
-- ── What this table may hold, and what it must never hold ───────────────────
--
-- Exactly one column here can contain a sentence: `note`, and it is only ever
-- written from a request body — the learner's own words. There is deliberately
-- NO column for text the system produced.
--
-- The explanation an entry shows is not stored here at all. It is
-- `diagnosticMapping[answer].justification`, read from the curriculum module at
-- render time: prose the author of that task wrote for exactly that wrong
-- answer, which `DiagnosticMapping`'s own contract permits only where the
-- answer uniquely establishes the cause. Leaving it in the curriculum instead
-- of copying it into a per-learner row does two things — a correction to the
-- wording reaches every saved entry, and, the reason that matters, there is
-- nowhere in this schema to put a sentence about a child that nobody authored.
--
-- «Forgot int() after input» is a thing that happened. «You struggle with
-- types» is a claim about a fourteen-year-old's mind. The absent column is what
-- makes the second one unwriteable rather than merely discouraged.
--
-- ── Why the key is a failure class and not the answer ───────────────────────
--
-- The obvious key is the exact wrong answer. It is not available: the payload
-- allowlist in `packages/learning-contracts` keeps learner free text out of the
-- event stream on purpose, so the keystroke was never recorded and never will
-- be. What IS recorded is the failure class the author declared for the answer
-- that was given. That is the finest grain at which "this learner actually made
-- this mistake" can be proved, so it is the grain the key uses. Keying on
-- anything finer would mean storing a claim nothing can check.
--
-- ── Why a separate table from `lesson_completions` ──────────────────────────
--
-- A completion is a mechanical fact with a fixed shape, written by the runtime,
-- one row per lesson, never edited. An entry is a document the learner owns: it
-- exists because they chose to keep it and it carries their prose. Putting
-- learner-authored text into the table whose whole purpose is being an
-- automatic record is how the two rules above stop being separable.

begin;

create table if not exists learner_error_dictionary (
  subject_id    uuid not null references learning_subjects(subject_id) on delete cascade,

  -- The task the mistake happened on. Resolved against the curriculum on read;
  -- an entry whose block no longer exists is dropped from the listing rather
  -- than rendered with nothing true left to say.
  block_id      text not null check (char_length(block_id) between 1 and 64),

  -- The author's failure class for the answer that was given. An internal key
  -- and never rendered: the learner is shown the author's explanation, not the
  -- label the system filed it under. `/api/learning/state/me` already refuses
  -- to return a misconception name for the same reason.
  failure_class text not null check (char_length(failure_class) between 1 and 64),

  -- The learner's own words. Optional, and the ONLY free text this table can
  -- hold. Five hundred characters is a note, not an essay.
  note          text check (note is null or char_length(note) between 1 and 500),

  created_at    timestamptz not null default now(),

  -- One entry per mistake. Saving the same one twice adds words, never a row.
  primary key (subject_id, block_id, failure_class)
);

create index if not exists idx_error_dictionary_recent
  on learner_error_dictionary (subject_id, created_at desc);

comment on table learner_error_dictionary is
  'The learner''s own «қателер сөздігі». Holds a reference to a mistake they '
  'made and, optionally, their own words about it. No system-authored text: '
  'the explanation lives in the curriculum and is read at render time.';

comment on column learner_error_dictionary.note is
  'Learner-authored. Written by nothing except the learner''s own request.';

comment on column learner_error_dictionary.failure_class is
  'Internal key, never shown to the learner. See migration 0011''s header.';

-- ── Deletion ────────────────────────────────────────────────────────────────
--
-- The cascade from `learning_subjects` means `learning_forget_user` already
-- erases the dictionary along with everything else. A child asking to be
-- forgotten must not leave a list of their mistakes behind.

alter table learner_error_dictionary enable row level security;
revoke all on learner_error_dictionary from anon, authenticated;

commit;
