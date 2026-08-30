import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import type { SqlExecutor } from "@schools/store/sql";

/**
 * The production driver, against a real Postgres.
 *
 * ## Why this exists
 *
 * `getStore` used to THROW when `DATABASE_URL` was set — "the Postgres driver
 * is not wired yet" — so a real deployment booted clean and then 500'd on the
 * first learner. The only working configuration was PGlite on a local
 * directory: single-writer (provisioning requires stopping the app) and, as we
 * found the hard way, corruptible by an ungraceful shutdown.
 *
 * ## Why it skips rather than fails without a database
 *
 * A test that demands a running Postgres turns every developer's first
 * `npm test` into a setup problem. It skips loudly instead — the suite name
 * says so — and CI is where it must actually run, with `DATABASE_URL` set.
 *
 * Set `DATABASE_URL` to exercise it:
 *   createdb solvex_test && DATABASE_URL=postgres://localhost/solvex_test npx vitest run tests/store/postgres-driver.test.ts
 */

const URL = process.env.DATABASE_URL;
const enabled = Boolean(URL);

let sql: SqlExecutor | null = null;
let table = "";

beforeAll(async () => {
  if (!enabled) return;
  const { PostgresExecutor } = await import("@schools/store/postgres-driver");
  sql = await PostgresExecutor.open(URL!);
  table = `drivertest_${randomUUID().replace(/-/g, "")}`;
  await sql.exec(`create table ${table} (id int primary key, note text)`);
}, 60_000);

afterAll(async () => {
  if (sql && table) await sql.exec(`drop table if exists ${table}`);
  await sql?.close();
});

describe.skipIf(!enabled)("PostgresExecutor (DATABASE_URL is set)", () => {
  it("runs a parameterised query and reports a row count", async () => {
    const inserted = await sql!.query(`insert into ${table} (id, note) values ($1, $2)`, [1, "a"]);
    expect(inserted.rowCount).toBe(1);

    const read = await sql!.query<{ id: number; note: string }>(
      `select id, note from ${table} where id = $1`,
      [1],
    );
    expect(read.rows).toEqual([{ id: 1, note: "a" }]);
  });

  it("runs a multi-statement script through `exec`", async () => {
    /* The extended protocol accepts one statement per prepare and a migration
       file is dozens; `exec` exists for exactly that and nothing else. */
    await sql!.exec(`insert into ${table} (id) values (10); insert into ${table} (id) values (11);`);
    const r = await sql!.query<{ n: string }>(`select count(*)::int as n from ${table} where id >= 10`);
    expect(Number(r.rows[0].n)).toBe(2);
  });

  it("commits a transaction", async () => {
    await sql!.tx(async (t) => {
      await t.query(`insert into ${table} (id, note) values ($1, $2)`, [20, "committed"]);
    });
    const r = await sql!.query(`select 1 from ${table} where id = 20`);
    expect(r.rows.length).toBe(1);
  });

  it("rolls a transaction back when the callback throws", async () => {
    await expect(
      sql!.tx(async (t) => {
        await t.query(`insert into ${table} (id, note) values ($1, $2)`, [30, "doomed"]);
        throw new Error("deliberate");
      }),
    ).rejects.toThrow("deliberate");

    const r = await sql!.query(`select 1 from ${table} where id = 30`);
    expect(r.rows.length).toBe(0);
  });

  it("keeps a transaction's statements on ONE connection", async () => {
    /* The property that makes this driver different from the PGlite one, and
       the one whose absence fails only under concurrency — i.e. in a classroom
       and never in a test written casually.
       Reading back inside the transaction proves the SELECT ran on the same
       connection as the INSERT: on a different pooled connection the row would
       not be visible before commit. */
    await sql!.tx(async (t) => {
      await t.query(`insert into ${table} (id, note) values ($1, $2)`, [40, "same-conn"]);
      const inside = await t.query<{ note: string }>(`select note from ${table} where id = 40`);
      expect(inside.rows[0]?.note).toBe("same-conn");
    });
  });

  it("uses savepoints for a nested transaction rather than a second BEGIN", async () => {
    /* Postgres treats a nested `begin` as a warning and a no-op: the inner
       rollback would discard the OUTER work too. Nothing nests today; this is
       here so the first thing that does is correct. */
    await sql!.tx(async (outer) => {
      await outer.query(`insert into ${table} (id, note) values ($1, $2)`, [50, "outer"]);
      await expect(
        outer.tx(async (inner) => {
          await inner.query(`insert into ${table} (id, note) values ($1, $2)`, [51, "inner"]);
          throw new Error("inner fails");
        }),
      ).rejects.toThrow("inner fails");
    });

    const outer = await sql!.query(`select 1 from ${table} where id = 50`);
    const inner = await sql!.query(`select 1 from ${table} where id = 51`);
    expect(outer.rows.length, "the outer transaction must survive").toBe(1);
    expect(inner.rows.length, "the inner savepoint must have rolled back").toBe(0);
  });

  it("serves concurrent queries from the pool", async () => {
    /* The whole reason to have this over PGlite. Eighteen learners pressing
       Check are eighteen concurrent statements; a single-connection driver
       serialises them behind one another. */
    const results = await Promise.all(
      Array.from({ length: 18 }, (_, i) => sql!.query<{ n: number }>(`select $1::int as n`, [i])),
    );
    expect(results.map((r) => Number(r.rows[0].n))).toEqual([...Array(18).keys()]);
  });
});

describe.skipIf(enabled)("PostgresExecutor (skipped — DATABASE_URL is not set)", () => {
  it("is only exercised when a database is available", () => {
    // Visible in the report, so a green suite never implies this ran.
    expect(enabled).toBe(false);
  });
});
