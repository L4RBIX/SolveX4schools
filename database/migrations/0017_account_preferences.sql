-- 0017 — account preferences
--
-- Theme, language, reduced motion, Nova narration and sound effects, stored
-- against the account rather than only in the browser.
--
-- WHY THIS IS NOT JUST localStorage
--
-- A school runs shared machines. A learner who sets Kazakh and a light theme in
-- the computer lab on Tuesday and sits at a different machine on Thursday has,
-- with localStorage alone, set nothing — and the two settings most likely to be
-- changed are the two that matter most to a person who needs them: language,
-- and reduced motion for a learner who gets motion sick. Those are
-- accessibility settings, not decoration, and they must follow the person.
--
-- localStorage stays as the pre-login fallback and as the thing that paints the
-- first frame; the row here is what makes the choice survive a different desk.
--
-- WHY jsonb AND NOT FIVE COLUMNS
--
-- This is a preference bag read whole and written whole, never queried by
-- field. `parsePreferences` in schools/preferences/types.ts coerces whatever
-- comes out — an older shape, a hand-edited value, a field added next term —
-- into a valid object, so an unrecognised key is inert rather than a migration.
-- The CHECK below is deliberately shallow for the same reason: the shape is
-- validated in one place, in code, on both sides of the wire.

begin;

create table if not exists account_preferences (
  user_id    uuid        primary key references school_accounts(user_id) on delete cascade,
  prefs      jsonb       not null default '{}'::jsonb
             check (jsonb_typeof(prefs) = 'object'),
  updated_at timestamptz not null default now()
);

comment on table account_preferences is
  'Per-account UI preferences. Read and written whole; validated by '
  'schools/preferences/types.ts on both the client and the server.';

alter table account_preferences enable row level security;

commit;
