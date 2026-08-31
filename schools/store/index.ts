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
 * ALSO — and this comment used to say the opposite, which is worse than saying
 * nothing: PGlite does NOT hold an exclusive lock on its data directory. It was
 * tested against the pinned 0.5.7 by opening one directory from two processes
 * and writing to both. Neither failed. Roughly 8 600 rows were inserted and
 * acknowledged; about 5 000 survived.
 *
 * That is not a stale snapshot. Those are COMMITTED writes being lost, because
 * two postmasters over one cluster keep independent shared buffers, WAL insert
 * pointers and transaction-id counters, and the second one to flush wins.
 *
 * So: never point two processes at one `LEARNING_DATA_DIR`. `config.dataDir`
 * defaults to the RELATIVE `.data/learning`, which resolves per working
 * directory — that is what keeps a git worktree's dev server off the main
 * checkout's data — but two servers started from the same directory will
 * quietly destroy each other's evidence, and nothing today stops them.
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

       EVERY migration, including 0000. This used to pass `false` to skip
       0000 "because a managed Postgres already has these roles, and running it
       against one fails" — and both halves of that sentence were wrong.
       `anon` / `authenticated` / `service_role` are SUPABASE roles; on RDS,
       Neon, Railway, Fly or a self-hosted cluster they do not exist, twelve
       later migrations revoke against them, and 0003 died with
       `role "anon" does not exist` — one table applied, no product, on first
       boot. And 0000 is an `if not exists` block, so applying it where the
       roles already exist is a no-op. All the migrations are byte-identical to
       the ones PGlite runs — that sameness is the point, and is why a
       constraint that rejects a row in development rejects it here. */
    const { PostgresExecutor } = await import("./postgres-driver");
    const sql = await PostgresExecutor.open(config.databaseUrl);
    return migrated(sql, true);
  }

  const sql = await PgliteExecutor.open(config.dataDir);
  return migrated(sql, true);
}

/**
 * Migrate, and close the driver if that fails.
 *
 * Opening is two steps — start a database, then migrate it — and when the
 * second threw, the handle from the first was simply dropped. A WASM Postgres
 * stayed alive holding descriptors into the data directory, unreachable and
 * unkillable short of ending the process; and because the rejection was then
 * cached (see `getStoreHandle`), nothing could ever get back to it to close it.
 *
 * Observed live during the incident this was written for: the dev server held
 * two descriptors on `pg_wal` and on `base/5/16786` inside a directory that had
 * already been deleted from disk.
 *
 * The close is itself swallowed. A driver that will not shut down cleanly is
 * not a reason to replace the migration error — which says what actually went
 * wrong — with a second error about tidying up after it.
 */
async function migrated(sql: SqlExecutor, applyLocalBootstrap: boolean): Promise<StoreHandle> {
  try {
    await migrate(sql, { applyLocalBootstrap });
  } catch (err) {
    await sql.close().catch(() => {});
    throw err;
  }
  return { sql, store: new LearningStore(sql) };
}

export function getStoreHandle(): Promise<StoreHandle> {
  const g = globalThis as GlobalWithStore;

  const cached = g[KEY];
  if (cached) return cached;

  /*
   * A FAILED open must not be remembered.
   *
   * This was `g[KEY] ??= open()`, and `??=` writes only when the slot is null
   * or undefined — a rejected promise is neither. So the first failure was
   * cached forever: every later caller re-awaited the same rejection and
   * re-threw the original error, captured at the moment of first failure.
   *
   * The consequence is the part worth remembering. Repairing the database did
   * nothing. Deleting the corrupt directory did nothing. `/api/health` reads
   * through this same memo, so it went on reporting the store as down long
   * after it was fine — which reads exactly like a database that never
   * recovered. In production, where `output: "standalone"` keeps one process
   * alive, a transient blip bricked the deployment until somebody restarted it
   * by hand, and every learner in the meantime was told their answers were not
   * being saved.
   *
   * The identity check before deleting matters: without it, a late failure from
   * an abandoned attempt could evict a good handle that a retry had already
   * installed.
   */
  const attempt = open().catch((err: unknown) => {
    if (g[KEY] === attempt) delete g[KEY];
    throw err;
  });
  g[KEY] = attempt;
  return attempt;
}

export async function getStore(): Promise<LearningStore> {
  return (await getStoreHandle()).store;
}

export { LearningStore } from "./learning-store";
export type { SqlExecutor } from "./sql";
