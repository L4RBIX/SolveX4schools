import "server-only";
import { config } from "@schools/config";
import { LearningStore } from "./learning-store";
import { migrate } from "./migrate";
import { PgliteExecutor } from "./pglite-driver";
import type { SqlExecutor } from "./sql";

/**
 * The store singleton.
 *
 * Opened once per process and memoised on `globalThis`, because Next's dev
 * server re-evaluates modules on every hot reload and a fresh database handle
 * per reload would leak connections and re-run migrations forever.
 *
 * DEV GOTCHA: surviving hot reload is the point, and it means the memoised
 * instance also survives changes to `LearningStore` itself. Adding a method and
 * calling it immediately gives "x is not a function" against the old instance.
 * Restart the dev server after changing the class, not just the file that uses
 * it.
 *
 * ALSO: PGlite holds an exclusive lock on its data directory. A second process
 * opening the same directory — a script inspecting the database while the dev
 * server runs — reads a stale snapshot rather than failing, which makes it look
 * like writes are being lost. Read through the API instead.
 */

interface StoreHandle {
  sql: SqlExecutor;
  store: LearningStore;
}

const KEY = Symbol.for("solvex.learning.store");
type GlobalWithStore = typeof globalThis & { [KEY]?: Promise<StoreHandle> };

async function open(): Promise<StoreHandle> {
  if (config.databaseUrl) {
    /* Production path. Loaded lazily so `pg` is not pulled into a development
       install that will never open a socket.

       `applyLocalBootstrap: false`: migration 0000 creates the `anon` and
       `authenticated` roles that a managed Postgres already has, and running it
       against one fails. The other migrations are byte-identical to the ones
       PGlite runs — that sameness is the point, and is why a constraint that
       rejects a row in development rejects it here. */
    const { PostgresExecutor } = await import("./postgres-driver");
    const sql = await PostgresExecutor.open(config.databaseUrl);
    await migrate(sql, { applyLocalBootstrap: false });
    return { sql, store: new LearningStore(sql) };
  }

  const sql = await PgliteExecutor.open(config.dataDir);
  await migrate(sql, { applyLocalBootstrap: true });
  return { sql, store: new LearningStore(sql) };
}

export function getStoreHandle(): Promise<StoreHandle> {
  const g = globalThis as GlobalWithStore;
  g[KEY] ??= open();
  return g[KEY];
}

export async function getStore(): Promise<LearningStore> {
  return (await getStoreHandle()).store;
}

export { LearningStore } from "./learning-store";
export type { SqlExecutor } from "./sql";
