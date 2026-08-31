-- 0000 — local bootstrap
--
-- Applied ONLY by the PGlite driver. A managed Postgres (Supabase, RDS, or a
-- self-hosted cluster provisioned the same way) already has these roles, and
-- applying this there would be at best a no-op and at worst a conflict.
--
-- The later migrations do `revoke all on <table> from anon, authenticated`.
-- Those revokes are a real privacy guarantee — RLS is enabled with zero
-- policies precisely so that a browser holding a valid JWT gets zero rows — and
-- a plain Postgres has never heard of either role, so the statements error and
-- the migration fails halfway. Creating the roles locally means the SAME
-- migration files run in both places, which is the entire point: a constraint
-- that rejects a row in production rejects it in development too.
--
-- These roles are created NOLOGIN. Nothing can authenticate as them; they exist
-- so the grants have a subject to revoke from.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$$;
