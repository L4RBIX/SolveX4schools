/**
 * Reset a demo credential.
 *
 * A development convenience for walking the product end to end without
 * re-provisioning a class. It talks to the database directly for the same
 * reason `provision-class.ts` does: `schools/store` is `server-only` and this
 * runs outside a request.
 *
 * It refuses to run against a real deployment. `DATABASE_URL` being set means
 * this is not the local PGlite directory, and a script that rewrites a
 * password by role is not something that should ever point at a school.
 *
 *   npx tsx scripts/reset-demo-password.ts --password solvex-demo-2026
 */
import { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "../schools/auth/password";

async function main() {
  if (process.env.DATABASE_URL) {
    console.error(
      "Refusing to run: DATABASE_URL is set, so this is not the local " +
        "development database. Reset a real password with provision-class.",
    );
    process.exit(1);
  }

  const argv = process.argv.slice(2);
  const at = argv.indexOf("--password");
  const password = at >= 0 ? argv[at + 1] : "solvex-demo-2026";

  const dir = process.env.LEARNING_DATA_DIR ?? ".data/learning";
  const db = new PGlite(dir);

  const rows = await db.query<Record<string, unknown>>(
    `select user_id, username, role, display_name
       from school_accounts order by role, username`,
  );
  console.log(`accounts: ${rows.rows.length}`);
  for (const r of rows.rows) {
    console.log(`  ${String(r.role).padEnd(8)} ${r.username}  ${r.display_name}`);
  }

  for (const role of ["teacher", "student"]) {
    const account = rows.rows.find((r) => r.role === role);
    if (!account) continue;
    const stored = await hashPassword(password);
    await db.query(
      `update school_accounts
          set password_hash = $2, password_salt = $3, must_change_password = false
        where user_id = $1`,
      [account.user_id, stored.hash, stored.salt],
    );
    console.log(`READY  ${role}: ${account.username} / ${password}`);
  }

  await db.close();
}

void main();
