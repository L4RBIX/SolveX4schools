/**
 * Prove the migration chain works on a database that has never seen it.
 *
 * ## Why this is a script and not three lines of YAML
 *
 * CI already attached a real PostgreSQL service and ran the driver suite
 * against it — and never applied a single migration to it. That gap is exactly
 * how the release before this one shipped a chain that died at 0003 on any
 * Postgres that was not Supabase: `tests/store/migrate.test.ts` runs on PGlite
 * with `applyLocalBootstrap: true`, the driver suite creates no tables, and
 * nothing anywhere applied the shipped files to a real server the way the app
 * does at boot.
 *
 *   DATABASE_URL=postgres://… npx tsx --conditions=react-server scripts/verify-migrations.ts
 *
 * The `--conditions=react-server` flag is required: the runner is imported
 * straight out of `schools/store`, which carries `import "server-only"`, and
 * importing the REAL runner rather than a transcription of it is the entire
 * point. A copy of the logic here would be a fourth definition of the schema
 * and would have passed happily while the app's own path was broken.
 *
 * ## What it asserts
 *
 * That the target starts empty — a chain "verified" against a database that
 * already had the tables proves nothing, and a leftover cluster is precisely
 * how the first local run of this passed while a pristine one failed. Then the
 * full apply, the tables and columns that have actually broken before, and an
 * idempotent second pass.
 */
import { migrate } from "../schools/store/migrate";
import { PostgresExecutor } from "../schools/store/postgres-driver";

/** Things that have gone wrong here before, in the order they went wrong. */
const REQUIRED_TABLES = [
  "schema_migrations",
  "school_accounts",
  "school_classes",
  "class_enrolments",
  "learning_subjects",
  "learning_events",
  "learning_submissions",
  "lesson_completions",
  "curriculum_publications",
  "human_reviews",
  "league_groups",
  "league_memberships",
  "league_xp_awards",
];

/** `answer` was added by 0021 and is what a teacher reads a learner's words from. */
const REQUIRED_COLUMNS: [string, string, string][] = [
  ["learning_submissions", "answer", "jsonb"],
  ["learning_submissions", "response", "jsonb"],
  ["curriculum_publications", "withdrawn_at", "timestamp with time zone"],
  ["curriculum_publications", "withdrawn_by", "uuid"],
  ["school_accounts", "must_change_password", "boolean"],
];

function fail(message: string): never {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) fail("DATABASE_URL is not set. This gate needs a real PostgreSQL.");

  const sql = await PostgresExecutor.open(url);

  const existing = await sql.query<{ n: number }>(
    `select count(*)::int as n from pg_tables where schemaname = 'public'`,
  );
  const before = Number(existing.rows[0]?.n ?? 0);
  if (before !== 0) {
    fail(
      `the target database already has ${before} table(s) in public. ` +
        `This gate must run against a PRISTINE database — verifying the chain ` +
        `against one that already has the schema proves nothing, and a leftover ` +
        `cluster is how a broken chain passed locally while failing on a fresh one.`,
    );
  }

  const first = await migrate(sql, {});
  console.log(`\n  Applied ${first.applied.length} migration(s) to an empty database.`);
  for (const f of first.applied) console.log(`    + ${f}`);
  if (first.skipped.length) console.log(`  Skipped: ${first.skipped.join(", ")}`);

  if (first.applied.length < 20) {
    fail(`only ${first.applied.length} migrations applied; the chain is incomplete.`);
  }

  const tables = new Set(
    (
      await sql.query<{ tablename: string }>(
        `select tablename from pg_tables where schemaname = 'public'`,
      )
    ).rows.map((r) => r.tablename),
  );
  const missingTables = REQUIRED_TABLES.filter((t) => !tables.has(t));
  if (missingTables.length) fail(`missing table(s): ${missingTables.join(", ")}`);

  const columns = await sql.query<{ table_name: string; column_name: string; data_type: string }>(
    `select table_name, column_name, data_type
       from information_schema.columns where table_schema = 'public'`,
  );
  const seen = new Map(
    columns.rows.map((r) => [`${r.table_name}.${r.column_name}`, r.data_type]),
  );
  const missingColumns = REQUIRED_COLUMNS.filter(
    ([t, c, type]) => seen.get(`${t}.${c}`) !== type,
  ).map(([t, c, type]) => `${t}.${c} (${type}, got ${seen.get(`${t}.${c}`) ?? "nothing"})`);
  if (missingColumns.length) fail(`wrong or missing column(s): ${missingColumns.join("; ")}`);

  const second = await migrate(sql, {});
  if (second.applied.length !== 0) {
    fail(
      `re-running applied ${second.applied.length} more migration(s) — the chain is ` +
        `not idempotent: ${second.applied.join(", ")}`,
    );
  }

  await sql.close();
  console.log(
    `  ✓ ${tables.size} tables · ${REQUIRED_TABLES.length} required present · ` +
      `${REQUIRED_COLUMNS.length} required columns correct · re-run applied 0.\n`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
