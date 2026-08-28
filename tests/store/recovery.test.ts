import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Can the process recover from a database that was broken and then fixed?
 *
 * ## The incident this is a regression test for
 *
 * A local PGlite data directory became unusable. Every store-backed route
 * returned a bare 500. The obvious remedy — delete the corrupt directory —
 * changed nothing, and it took a while to work out why:
 *
 *     g[KEY] ??= open();
 *
 * `??=` writes only when the slot holds null or undefined, and a REJECTED
 * promise is neither. So the first failure was memoised for the life of the
 * process. Every later caller re-awaited that same rejection and re-threw the
 * error captured at the moment of first failure — long after the cause was
 * gone.
 *
 * The consequences ran further than one broken laptop. `/api/health` reads
 * through the same memo, so it kept reporting the store as down after the store
 * was fine, which is indistinguishable from a database that never came back. In
 * production, where `output: "standalone"` keeps one process alive across
 * requests, a transient blip bricked the deployment until a human restarted it
 * — and every learner in the meantime was told their answers were not being
 * saved.
 *
 * ## What this asserts
 *
 * That a failed open is retried rather than replayed. Not that PGlite is
 * durable, not that a particular corruption is recoverable — only that the
 * PROCESS is not permanently poisoned by one bad open, which is the property
 * that made a five-second fix take a restart nobody knew to perform.
 */

const KEY = Symbol.for("solvex.learning.store");

let dir: string;
const originalDataDir = process.env.LEARNING_DATA_DIR;
const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "solvex-store-"));
  /* PGlite decides to RESUME rather than initialise on the bare existence of
     `PG_VERSION`, and nothing ever re-runs initdb. So a directory holding that
     one file and nothing else is a cluster it will try to open and cannot —
     which is exactly the unrecoverable shape a kill during first boot leaves
     behind, and a far more faithful fixture than a mocked rejection. */
  mkdirSync(path.join(dir, "learning"), { recursive: true });
  writeFileSync(path.join(dir, "learning", "PG_VERSION"), "not a version\n");

  process.env.LEARNING_DATA_DIR = path.join(dir, "learning");
  /* Force the PGlite branch. A DATABASE_URL inherited from the environment
     would send this down the Postgres path and quietly test nothing. */
  delete process.env.DATABASE_URL;

  delete (globalThis as Record<symbol, unknown>)[KEY];
  vi.resetModules();
});

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[KEY];
  if (originalDataDir === undefined) delete process.env.LEARNING_DATA_DIR;
  else process.env.LEARNING_DATA_DIR = originalDataDir;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  rmSync(dir, { recursive: true, force: true });
});

describe("a store that failed to open", () => {
  it("is not remembered as failed forever", async () => {
    const { getStore } = await import("@schools/store");

    /* First open, against the broken directory. */
    await expect(getStore()).rejects.toBeTruthy();

    /* The slot must be empty again. If the rejected promise is still sitting
       there, every later caller replays this failure and the only remedy is a
       process restart — which is precisely the bug. */
    expect(
      (globalThis as Record<symbol, unknown>)[KEY],
      "a rejected open was memoised; the process is now permanently poisoned",
    ).toBeUndefined();

    /* Fix the underlying cause, exactly as an operator would. */
    rmSync(path.join(dir, "learning"), { recursive: true, force: true });

    /* Same process, same module instance, no restart. This is the assertion
       that would have saved the incident. */
    const store = await getStore();
    expect(store).toBeTruthy();
  }, 120_000);

  it("keeps the working handle once one is open", async () => {
    /* The complement, and the reason the eviction is guarded by identity: a
       late rejection from an abandoned attempt must not be able to evict a good
       handle a retry has already installed. */
    rmSync(path.join(dir, "learning"), { recursive: true, force: true });

    const { getStoreHandle } = await import("@schools/store");
    const first = await getStoreHandle();
    const second = await getStoreHandle();

    expect(second).toBe(first);
    expect((globalThis as Record<symbol, unknown>)[KEY]).toBeDefined();
  }, 120_000);
});
