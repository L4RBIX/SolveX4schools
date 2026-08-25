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
 */

const MIGRATIONS_DIR = path.join(process.cwd(), "database", "migrations");

/** Applied by PGlite only; a managed Postgres already has these roles. */
const LOCAL_ONLY = new Set(["0000_bootstrap_local.sql"]);

export interface MigrateOptions {
  /** True for the PGlite driver. */
  applyLocalBootstrap: boolean;
}

export async function migrate(
  sql: SqlExecutor,
  opts: MigrateOptions,
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
    if (LOCAL_ONLY.has(file) && !opts.applyLocalBootstrap) {
      skipped.push(file);
      continue;
    }

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
