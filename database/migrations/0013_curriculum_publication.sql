-- 0013 — the human publication gate
--
-- `types.ts` has always said "Students see `published` and nothing else", and
-- every runtime gate has always been `status !== "draft"`. September therefore
-- shipped at `implemented`, with the validator reporting 0 validated and 0
-- published, and nothing anywhere disagreed. The claim was decoration.
--
-- WHY PUBLICATION IS A DATABASE FACT AND NOT A FIELD IN THE CURRICULUM
--
-- Because the field cannot record who approved it. `status: "published"` in a
-- TypeScript file is a line anybody — including an automated agent — can write,
-- and it carries no reviewer, no timestamp, and no statement about WHICH
-- content was approved. A month that was reviewed and then edited would still
-- read "published".
--
-- So publication is a row: a reviewer, a moment, and a hash of exactly the
-- content they approved. The consequence is the property that matters —
--
--   **editing the curriculum silently un-publishes it.**
--
-- The hash stops matching, `isMonthPublished` returns false, and students stop
-- being served content nobody has read. That is not a policy someone has to
-- remember; it is arithmetic.
--
-- WHAT THIS DELIBERATELY CANNOT DO
--
-- There is no way to publish without an authenticated reviewer, and no
-- "system" or "automation" reviewer id. Approving educational material for
-- fourteen-year-olds is a human act, and a schema that allows a service account
-- to perform it would eventually have one do so.

begin;

create table if not exists curriculum_publications (
  publication_id  uuid primary key,

  -- 1 = September … 9 = May.
  month_index     int not null check (month_index between 1 and 12),

  -- sha256 of the serialised month object. Over the DATA, not the file, so
  -- reformatting and comment edits do not lapse a review — but any change to a
  -- prompt, a case, an answer or an ordering does.
  curriculum_hash text not null check (char_length(curriculum_hash) = 64),

  -- The person. `school_accounts`, restricted at the application layer to a
  -- teacher or admin, and never null.
  reviewer_id     uuid not null references school_accounts(user_id),

  -- What they are willing to put their name to. Free text, shown back in the
  -- teacher console and in the release record.
  note            text check (note is null or char_length(note) <= 2000),

  published_at    timestamptz not null default now(),

  -- Withdrawal is a row update, not a delete: "this was published between these
  -- two dates" must stay answerable after a month is pulled.
  withdrawn_at    timestamptz,
  withdrawn_by    uuid references school_accounts(user_id)
);

-- One live publication per (month, hash). Re-publishing the same content after
-- a withdrawal is allowed and creates a new row; two simultaneous live
-- approvals of the same bytes are not.
create unique index if not exists curriculum_publications_live_idx
  on curriculum_publications (month_index, curriculum_hash)
  where withdrawn_at is null;

create index if not exists curriculum_publications_month_idx
  on curriculum_publications (month_index) where withdrawn_at is null;

comment on table curriculum_publications is
  'A human approval of exactly one version of one month. Editing the curriculum '
  'changes the hash and therefore lapses the approval — see migration 0013.';

comment on column curriculum_publications.curriculum_hash is
  'sha256 of the serialised month. The reason a review cannot silently outlive '
  'the content it reviewed.';

comment on column curriculum_publications.reviewer_id is
  'A person. There is deliberately no system reviewer: approving material for '
  'minors is not something a service account may do.';

alter table curriculum_publications enable row level security;
revoke all on curriculum_publications from anon, authenticated;

commit;
