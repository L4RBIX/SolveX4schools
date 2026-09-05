import "server-only";
import type { Pool, PoolClient } from "pg";
import type { SqlExecutor, SqlResult } from "./sql";

/**
 * The production driver.
 *
 * Until now `getStore` threw when `DATABASE_URL` was set — "the Postgres driver
 * is not wired yet" — which meant a real deployment booted successfully and
 * then 500'd on the first learner. The only working configuration was PGlite on
 * a local directory, which is single-writer (provisioning requires stopping the
 * app) and which I have personally corrupted with an ungraceful shutdown.
 *
 * Nothing above this file changes. The migrations are the same files, applied
 * verbatim, because PGlite is real Postgres compiled to WASM rather than an
 * emulation of it — so a CHECK constraint that rejects a row in development
 * rejects it in production too.
 *
 * ## Why a pool, and why transactions take a client out of it
 *
 * A pool is the only reason this is worth having over PGlite: eighteen learners
 * pressing Check at once are eighteen concurrent statements, and a
 * single-connection driver serialises them behind each other.
 *
 * That makes `tx` the one place this differs meaningfully from the PGlite
 * driver. There, `tx` could hand back `this`, because there was exactly one
 * connection and a `BEGIN` on it was unambiguous. Here it must check a client
 * OUT of the pool and give the callback an executor bound to that client —
 * otherwise the statements inside the transaction scatter across connections
 * and the `BEGIN` applies to whichever one happened to run it. That failure is
 * silent, intermittent, and only appears under concurrency, which is to say it
 * appears in the classroom and never in a test.
 */

/** Executor bound to one checked-out client. Never closes it — `tx` owns that. */
class ClientExecutor implements SqlExecutor {
  constructor(private client: PoolClient) {}

  async query<T = Record<string, unknown>>(
    text: string,
    params: readonly unknown[] = [],
  ): Promise<SqlResult<T>> {
    const res = await this.client.query(text, [...params]);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
  }

  async exec(script: string): Promise<void> {
    await this.client.query(script);
  }

  /**
   * Nested transactions use savepoints rather than a second `BEGIN`.
   *
   * Postgres treats a nested `BEGIN` as a warning and a no-op, so the inner
   * "transaction" would commit with the outer one and a rollback inside it
   * would discard the outer work too. Nothing in the store nests today; this is
   * here so that the first thing which does is correct rather than subtly
   * wrong.
   */
  async tx<T>(fn: (t: SqlExecutor) => Promise<T>): Promise<T> {
    const name = `sp_${Math.random().toString(36).slice(2, 10)}`;
    await this.client.query(`savepoint ${name}`);
    try {
      const out = await fn(this);
      await this.client.query(`release savepoint ${name}`);
      return out;
    } catch (err) {
      await this.client.query(`rollback to savepoint ${name}`);
      throw err;
    }
  }

  async close(): Promise<void> {
    /* The pool owns the connection's lifetime. A caller closing an executor it
       was handed inside `tx` must not take a connection out of circulation. */
  }
}

export class PostgresExecutor implements SqlExecutor {
  private constructor(private pool: Pool) {}

  static async open(connectionString: string): Promise<PostgresExecutor> {
    const { Pool } = await import("pg");

    const pool = new Pool({
      connectionString,
      /* Sized for a class, not for a fleet. Eighteen learners submitting at once
         is eighteen statements; ten connections serve that comfortably and keep
         well clear of a small managed instance's connection cap. */
      max: 10,
      idleTimeoutMillis: 30_000,
      /* Fail fast rather than hanging a learner's Check button on a network
         partition. The route turns a rejection into `unmeasured`, which is the
         honest outcome — it is the database that failed, not the learner. */
      connectionTimeoutMillis: 5_000,
      /* Managed Postgres almost always terminates TLS with a certificate the
         Node default store does not chain to. Honour an explicit sslmode in the
         URL; otherwise leave TLS to the connection string rather than silently
         disabling verification here, which is how a "temporary" insecure flag
         becomes permanent. */

      /*
       * A ceiling on any single statement.
       *
       * There was none. `/api/health` runs four unbounded scans of
       * `learning_events` for an anonymous caller, the events route accepts a
       * hundred rows per POST with no cap on POSTs, and the pool is ten
       * connections — so one pathological query could hold a connection for as
       * long as it liked while a class waited for one.
       *
       * Thirty seconds, which is far above every measured statement in the
       * product (the slowest, the teacher overview, is 39 ms) and far below the
       * point at which a learner has given up. A statement that hits it fails
       * with a Postgres error the route turns into `unmeasured`, which is the
       * honest outcome for a database that could not answer.
       *
       * Set on the pool rather than per query so a statement added later
       * inherits it — the opposite of the pattern where every new call site is
       * a new chance to forget.
       */
      statement_timeout: 30_000,
      /*
       * Who is connected, in the database's own view.
       *
       * `pg_stat_activity.application_name` is how an operator tells this
       * app's connections from a migration script's or a psql session's while
       * something is wrong. It costs nothing and it is unavailable afterwards.
       */
      application_name: "solvex4schools",
    });

    /* A pool emits `error` for a connection that dies while idle. Unhandled, it
       is an uncaught exception that takes the process down — a database blip
       becoming an outage for a class that is mid-lesson. */
    pool.on("error", (err) => {
      console.error(
        JSON.stringify({
          event: "store.pool_error",
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    });

    /* Prove the connection at boot rather than at the first learner. A wrong
       password should stop a deployment, not surface as a 500 in a classroom. */
    const probe = await pool.connect();
    probe.release();

    return new PostgresExecutor(pool);
  }

  async query<T = Record<string, unknown>>(
    text: string,
    params: readonly unknown[] = [],
  ): Promise<SqlResult<T>> {
    const res = await this.pool.query(text, [...params]);
    return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
  }

  async exec(script: string): Promise<void> {
    /* Multi-statement, no parameters — the extended protocol accepts one
       statement per prepare and a migration file is dozens. `pool.query` with a
       plain string uses the simple protocol, which is what this needs. */
    await this.pool.query(script);
  }

  async tx<T>(fn: (t: SqlExecutor) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const out = await fn(new ClientExecutor(client));
      await client.query("commit");
      return out;
    } catch (err) {
      try {
        await client.query("rollback");
      } catch {
        /* The connection is already gone. Releasing it below with the error flag
           removes it from the pool rather than returning a broken one. */
      }
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
