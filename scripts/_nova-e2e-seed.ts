import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Module = require("node:module") as { _load: (r: string, p: unknown, m: boolean) => unknown };
const load = Module._load;
Module._load = function patched(r: string, p: unknown, m: boolean) {
  if (r === "server-only") return {};
  return load.call(this, r, p, m);
};

async function main() {
  const { PostgresExecutor } = await import("@schools/store/postgres-driver");
  const { LearningStore } = await import("@schools/store/learning-store");
  const { hashPassword } = await import("@schools/auth/password");
  const sql = await PostgresExecutor.open(process.env.DATABASE_URL!);
  const store = new LearningStore(sql);
  const h = await hashPassword("solvex-demo-2026");
  const SCHOOL = "pilot-school", CLASS = "grade-9a", USERNAME = "nova-e2e";

  const existing = await sql.query<{ user_id: string }>(
    "select user_id from school_accounts where school_id=$1 and username=$2", [SCHOOL, USERNAME]);
  let id = existing.rows[0]?.user_id;
  if (!id) {
    id = await store.createAccount({
      schoolId: SCHOOL, role: "student", username: USERNAME,
      displayName: "Нова Е2Е", passwordHash: h.hash, passwordSalt: h.salt,
    });
  }
  await store.setPassword(id, h.hash, h.salt);
  await sql.query("update school_accounts set must_change_password=false where user_id=$1", [id]);
  await store.enrol(SCHOOL, CLASS, id);
  await sql.query("delete from rate_limit_bucket where bucket_key like 'login:%'");
  console.log("seeded", USERNAME);
  await sql.close?.();
}
main().catch((e) => { console.error(e); process.exit(1); });
