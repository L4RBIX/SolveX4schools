import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { SqlExecutor } from "./sql";

/**
 * Migration runner.
 *
 * Applies `database/migrations/*.sql` in filename order and records what it
 * applied, so it is safe to call on every boot. The files are the schema —
 * there is deliberately no second definition anywhere in this repository.
 *
 * EVERY file, on EVERY engine. There used to be an exception — 0000 was
 * skipped on Postgres — and it is why the app could not boot on any Postgres
 * that was not Supabase. See `MigrateOptions.applyLocalBootstrap`.
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "database", "migrations");

export interface MigrateOptions {
  /**
   * Retained so existing call sites keep compiling; NO LONGER CONSULTED.
   *
   * It used to skip `0000_bootstrap_local.sql` on the Postgres path, on the
   * belief — written down in `schools/store/index.ts` — that "a managed
   * Postgres already has these roles, and running it against one fails".
   * Both halves were wrong, and together they made the app unbootable on any
   * Postgres that is not Supabase.
   *
   * `anon`, `authenticated` and `service_role` are SUPABASE roles. RDS, Neon,
   * Railway, Fly and a self-hosted cluster have never heard of them. Twelve
   * later migrations do `revoke all on <table> from anon, authenticated`, so
   * on such a cluster migration 0003 dies with `role "anon" does not exist`
   * and the deployment gets one table and no product. Measured on a pristine
   * PostgreSQL 16.14: 1 of 21 migrations applied.
   *
   * And applying 0000 where the roles DO exist does not fail — it is a
   * `do $$ ... if not exists ... $$` block, i.e. a no-op.
   * `scripts/provision-class.ts` has always applied every file for exactly
   * this reason and says so in its own comment.
   *
   * So there is no engine that should skip it, and the option has no meaning
   * left. Removing the field outright would touch ~40 call sites during a
   * release freeze; it should go in the follow-up that can afford them.
   */
  applyLocalBootstrap?: boolean;
}

export async function migrate(
  sql: SqlExecutor,
  _opts: MigrateOptions = {},
): Promise<{ applied: string[]; skipped: string[] }> {
  await sql.query(`
    create table if not exists schema_migrations (
      filename    text primary key,
      applied_at  timestamptz not null default now()
    )
  `);

  const done = new Set(
    (await sql.query<{ filename: string }>("select filename from schema_migrations")).rows.map(
      (r) => r.filename,
    ),
  );

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    if (done.has(file)) continue;

    const text = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");

    // Each migration is its own transaction: a half-applied schema is worse
    // than an unapplied one, and the failure message names the file.
    try {
      // `exec`, not `query`: a migration file is many statements and the
      // extended protocol prepares exactly one. `exec` wraps the script in its
      // own implicit transaction, so a failure leaves nothing half-applied.
      await sql.exec(text);
      await sql.query("insert into schema_migrations (filename) values ($1)", [file]);
      applied.push(file);
    } catch (err) {
      throw new Error(
        `Migration ${file} failed: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  }

  return { applied, skipped };
}
