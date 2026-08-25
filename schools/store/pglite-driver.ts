import "server-only";
import type { SqlExecutor, SqlResult } from "./sql";

/**
 * Development and single-school driver.
 *
 * PGlite is Postgres compiled to WebAssembly. That is what makes it usable as
 * more than a mock: the migrations that ship with the intelligence subsystem
 * apply to it verbatim, CHECK constraints and plpgsql included, so a constraint
 * that would reject a row in production rejects it here too.
 *
 * Persisted to a directory rather than memory, because "progress survives a
 * refresh" is a requirement and an in-memory database restarts with the dev
 * server.
 */
export class PgliteExecutor implements SqlExecutor {
  private db: unknown;

  private constructor(db: unknown) {
    this.db = db;
  }

  static async open(dataDir: string): Promise<PgliteExecutor> {
    const { PGlite } = await import("@electric-sql/pglite");

    /* PGlite creates its data directory with a non-recursive mkdir, so a path
       whose parent does not exist fails with ENOENT — and it fails at the first
       write, not at boot, which means the app serves lessons happily while
       every event is dropped. Create the tree first. */
    let target = dataDir;
    if (!dataDir.startsWith("memory://")) {
      const { mkdir } = await import("node:fs/promises");
      const nodePath = await import("node:path");
      /* Absolute, and resolved here rather than left relative. Under Turbopack
         a relative path reaches PGlite's node filesystem layer as a URL and
         `mkdir` rejects it with a message that names neither this file nor the
         path — so the failure looks like a bundler bug rather than a
         configuration one. */
      target = nodePath.resolve(process.cwd(), dataDir);
      await mkdir(target, { recursive: true });
    }

    const db = await PGlite.create(target);
    return new PgliteExecutor(db);
  }

  async query<T = Record<string, unknown>>(
    text: string,
    params: readonly unknown[] = [],
  ): Promise<SqlResult<T>> {
    const db = this.db as {
      query: (t: string, p?: unknown[]) => Promise<{ rows: unknown[]; affectedRows?: number }>;
    };
    const res = await db.query(text, [...params]);
    const rows = (res.rows ?? []) as T[];
    return { rows, rowCount: res.affectedRows ?? rows.length };
  }

  async exec(script: string): Promise<void> {
    await (this.db as { exec: (s: string) => Promise<unknown> }).exec(script);
  }

  /**
   * PGlite is single-connection, so a transaction is just BEGIN/COMMIT on the
   * same handle. The nested executor is `this` — correct here precisely because
   * there is no pool to hand out a different connection.
   */
  async tx<T>(fn: (t: SqlExecutor) => Promise<T>): Promise<T> {
    await this.query("begin");
    try {
      const out = await fn(this);
      await this.query("commit");
      return out;
    } catch (err) {
      await this.query("rollback");
      throw err;
    }
  }

  async close(): Promise<void> {
    await (this.db as { close: () => Promise<void> }).close();
  }
}
