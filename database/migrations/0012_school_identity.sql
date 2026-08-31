-- 0012 — accounts, classes, enrolment, sessions
--
-- Until now there was no such thing as a person. `schools/learning/identity.ts`
-- minted an anonymous httpOnly cookie and called the device a subject, and
-- `config.pilot` carried a school and class as two environment strings. That is
-- honest scaffolding for a prototype and unusable for a school: a shared
-- classroom machine is one learner, a learner on a second device is two, and
-- the teacher endpoint had to refuse in production because there was no way to
-- establish that the caller was that class's teacher.
--
-- WHY PASSWORDS AND NOT AN IDENTITY PROVIDER
--
-- The pilot is one private school, eighteen 14-year-olds and one teacher. They
-- have no institutional SSO to federate with and no reliable personal email. A
-- teacher handing out credentials on paper is the mechanism the setting
-- actually supports, so that is what this models — including that the first
-- login must change the password, because a credential handed out on paper is
-- known to at least two people.
--
-- Scrypt, from node:crypto. No new dependency, memory-hard, and the parameters
-- live next to the verifier in `schools/auth/password.ts` so a future rehash
-- can read them off the stored record rather than guessing.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--
-- No password reset by email (there is no email), no self-registration (a
-- school roster is not self-serve), no cross-school admin view. A flat path
-- that reads across schools is the thing migration 0007 already refused to
-- build, and adding one here would undo that on the first day it existed.

begin;

-- ── Accounts ────────────────────────────────────────────────────────────────

create table if not exists school_accounts (
  user_id        uuid primary key,

  -- The school's own identifier, text, matching migration 0009's reasoning:
  -- a school is "gymnasium-5", not a uuid we invented for it.
  school_id      text not null check (char_length(school_id) between 1 and 64),

  role           text not null check (role in ('student', 'teacher', 'admin')),

  -- What the learner types. Case-insensitively unique per school, because a
  -- fourteen-year-old typing "Aidana" and "aidana" must not create a second
  -- account with an empty year of history behind it.
  username       text not null check (char_length(username) between 3 and 64),

  -- Shown to the teacher. The programme's data commitment is name, class and
  -- progress — this column and `school_id` are the whole of the identity we
  -- hold, and there is deliberately nowhere to put a birthday or an address.
  display_name   text not null check (char_length(display_name) between 1 and 128),

  password_hash  text not null,
  password_salt  text not null,

  -- A credential handed out on paper is known to whoever handed it out.
  must_change_password boolean not null default true,

  created_at     timestamptz not null default now(),
  last_login_at  timestamptz,
  -- Disabled, never deleted: a learner who leaves must stop being able to log
  -- in without their classmates' shared episodes losing a participant. Erasure
  -- is a separate, deliberate act — see `learning_forget_user`.
  disabled_at    timestamptz
);

create unique index if not exists school_accounts_username_idx
  on school_accounts (school_id, lower(username));
create index if not exists school_accounts_school_role_idx
  on school_accounts (school_id, role) where disabled_at is null;

comment on table school_accounts is
  'A person at a school. The only identity the product holds: name, school, '
  'role, and a credential. No email, no date of birth, no contact details.';

-- ── Classes ─────────────────────────────────────────────────────────────────

create table if not exists school_classes (
  school_id  text not null check (char_length(school_id) between 1 and 64),
  -- As the school names it — "9А", "grade-9a". Text for migration 0009's reason.
  class_id   text not null check (char_length(class_id) between 1 and 64),
  name       text not null check (char_length(name) between 1 and 128),
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  primary key (school_id, class_id)
);

comment on table school_classes is
  'A teaching group. Class size is not modelled and not bounded: the pilot has '
  'eighteen students, which is a fact about the pilot and not about the product.';

-- ── Who teaches, and who learns ─────────────────────────────────────────────

create table if not exists class_teachers (
  school_id  text not null,
  class_id   text not null,
  user_id    uuid not null references school_accounts(user_id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (school_id, class_id, user_id),
  foreign key (school_id, class_id) references school_classes(school_id, class_id) on delete cascade
);

comment on table class_teachers is
  'A join table rather than a column on the class, because co-teaching and '
  'handover are ordinary and a single teacher_id makes both a data migration.';

create table if not exists class_enrolments (
  school_id    text not null,
  class_id     text not null,
  user_id      uuid not null references school_accounts(user_id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  -- Withdrawn, not deleted: work done while enrolled stays attributable to the
  -- class it was done in, which is what a school report is.
  withdrawn_at timestamptz,
  primary key (school_id, class_id, user_id),
  foreign key (school_id, class_id) references school_classes(school_id, class_id) on delete cascade
);

create index if not exists class_enrolments_active_idx
  on class_enrolments (school_id, class_id) where withdrawn_at is null;

-- ── Sessions ────────────────────────────────────────────────────────────────

create table if not exists school_sessions (
  session_id  uuid primary key,

  -- The sha256 of the cookie value, never the value. A database dump is then
  -- not a set of working credentials, which is the entire reason to store a
  -- hash of something that is already random.
  token_hash  text not null unique,

  user_id     uuid not null references school_accounts(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  last_seen_at timestamptz not null default now(),
  -- Set on logout. Kept rather than deleted so "was this session used after the
  -- learner said they logged out" is answerable.
  revoked_at  timestamptz
);

create index if not exists school_sessions_user_idx
  on school_sessions (user_id) where revoked_at is null;
create index if not exists school_sessions_expiry_idx
  on school_sessions (expires_at) where revoked_at is null;

comment on column school_sessions.token_hash is
  'sha256 of the cookie value. The value itself is never stored, so a leaked '
  'backup is not a set of live sessions.';

-- ── Binding an account to its learning history ──────────────────────────────
--
-- `learning_subjects.user_id` and the 'user_id' alias kind have existed since
-- 0003 as a soft reference to a users table that lived elsewhere. This is that
-- table, so the reference stops being soft. The alias is what makes a learner
-- who signs in on a second device the same person rather than a new one.

comment on column learning_subjects.user_id is
  'References school_accounts(user_id) as of migration 0012. Deliberately not a '
  'foreign key: the ledger must survive an account being erased, with the '
  'events anonymised rather than cascaded away.';

-- ── Erasure ─────────────────────────────────────────────────────────────────
--
-- Consent revocation must not fail because a table was added later and nobody
-- remembered. Sessions, enrolments and teaching assignments cascade from
-- `school_accounts`; the account row itself is what an erasure removes, and the
-- learning ledger is detached rather than deleted so a class's shared history
-- does not develop holes.

alter table school_accounts  enable row level security;
alter table school_classes   enable row level security;
alter table class_teachers   enable row level security;
alter table class_enrolments enable row level security;
alter table school_sessions  enable row level security;

revoke all on school_accounts  from anon, authenticated;
revoke all on school_classes   from anon, authenticated;
revoke all on class_teachers   from anon, authenticated;
revoke all on class_enrolments from anon, authenticated;
revoke all on school_sessions  from anon, authenticated;

commit;
