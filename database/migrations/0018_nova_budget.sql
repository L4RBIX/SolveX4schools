-- Nova cost control.
--
-- Two ceilings, because two different things can go wrong and they need
-- different units.
--
-- PER LEARNER, PER DAY — `nova_usage`
--
-- The token bucket in schools/lib/rate-limit.ts already stops a burst: twenty
-- requests, refilling ten a minute. It does nothing about a learner who asks
-- for a hint every forty seconds for six hours, which is not an attack and not
-- even unreasonable behaviour for a bored fourteen-year-old, and which costs
-- real money. A day counter is the only thing that sees that shape.
--
-- PER DEPLOYMENT, PER MONTH — `nova_spend`
--
-- The per-learner limit multiplied by eighteen learners is still a number
-- nobody chose. The month row is the number somebody chose: input tokens,
-- output tokens and a hard dollar cap, checked before every call. It is keyed
-- by month rather than accumulated forever so that the cap resets on its own
-- and a pilot that overspends in September is not dark in October.
--
-- WHY TOKENS ARE STORED AND NOT JUST MONEY
--
-- Price changes. DeepSeek moved model names and prices twice this year, and a
-- table holding only dollars cannot be re-costed after the fact. Tokens are the
-- measurement; the dollar figure is derived from schools/config.ts at read
-- time, so correcting a rate is an env var rather than a data migration.

begin;

create table if not exists nova_usage (
  subject_id uuid        not null,
  usage_day  date        not null,
  requests   integer     not null default 0,
  updated_at timestamptz not null default now(),
  primary key (subject_id, usage_day)
);

comment on table nova_usage is
  'Per-learner Nova request counts, one row per subject per day. Read by the '
  'daily ceiling in schools/nova/budget.ts. Not learning evidence: nothing '
  'here describes what a learner understands, and nothing reads it as if it '
  'did.';

create table if not exists nova_spend (
  usage_month   text        primary key,
  requests      bigint      not null default 0,
  input_tokens  bigint      not null default 0,
  output_tokens bigint      not null default 0,
  updated_at    timestamptz not null default now()
);

comment on table nova_spend is
  'Deployment-wide Nova token consumption, one row per calendar month keyed '
  'YYYY-MM. Money is derived from tokens at read time so a price change is a '
  'config edit, never a backfill.';

alter table nova_usage enable row level security;
alter table nova_spend enable row level security;

commit;
