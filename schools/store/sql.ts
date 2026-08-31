import "server-only";

/**
 * The SQL port.
 *
 * Deliberately tiny. Everything above it — the store, the reducer, every route
 * — speaks this and nothing else, so the engine underneath can change without
 * a single call site moving.
 *
 * ## Why raw SQL and not a client library
 *
 * The imported subsystem ships its schema as Postgres migrations. Those
 * migrations are the schema: their CHECK constraints, their indexes and their
 * plpgsql functions are behaviour the intelligence depends on. Re-expressing
 * them in a second dialect for development would create two definitions that
 * drift, and the one that drifts is always the one nobody runs in CI.
 *
 * So development runs the SAME Postgres SQL as production — PGlite is a real
 * Postgres compiled to WASM, not an emulation — and the migration files are
 * applied verbatim to both.
 */

export interface SqlResult<T> {
  rows: T[];
  rowCount: number;
}

export interface SqlExecutor {
  query<T = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[],
  ): Promise<SqlResult<T>>;
  /**
   * Run a multi-statement script with no parameters.
   *
   * Separate from `query` because the extended protocol accepts exactly one
   * statement per prepare, and a migration file is dozens. Never used with
   * untrusted input — the only caller is the migration runner, reading files
   * from the repository.
   */
  exec(script: string): Promise<void>;
  /** Runs `fn` inside a transaction, rolling back if it throws. */
  tx<T>(fn: (t: SqlExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
