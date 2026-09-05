/**
 * Create (or re-password) the QA learner accounts that may open every month.
 *
 * ## Why this exists as its own tool
 *
 * Testing the year needs an account that can reach May without nine months of
 * real work. Every shortcut except this one damages the record: seeding
 * completions invents learning that never happened, forging accepted verdicts
 * fakes judge evidence, and opening `monthUnlockedFor` unlocks the year for the
 * whole school. So the override is an allowlist of ACCOUNT ids
 * (`FULL_CURRICULUM_QA_USERS`, read by `schools/config.ts`, applied only in
 * `schools/learning/access.ts`) and this creates the accounts it names.
 *
 * ## Why the accounts are new, and in their own class
 *
 * The pilot roster — `grade9a-01` … `grade9a-18` — belongs to a school. Taking
 * two of those would hand two real pupils permanent access to the whole year
 * and destroy a login somebody may already be using. These are separate
 * identities in a separate class with no teacher assigned, so they never appear
 * in a teacher's roster or analytics.
 *
 *   DATABASE_URL=… npx tsx --conditions=react-server scripts/create-qa-learners.ts \
 *     --school innovation-tech
 *
 * Passwords are generated here, printed ONCE, and written nowhere. `--rotate`
 * re-passwords accounts that already exist rather than creating duplicates.
 */
import { randomUUID, randomInt } from "node:crypto";
import pg from "pg";
import { hashPassword } from "../schools/auth/password";

const QA_CLASS_ID = "qa-full-access";
const QA_CLASS_NAME = "QA — толық қолжетімділік (тест)";
const QA_USERS = [
  { username: "qa-year-01", displayName: "QA тест 1 (толық жыл)" },
  { username: "qa-year-02", displayName: "QA тест 2 (толық жыл)" },
];

/** Typeable, and still 62 bits. No lookalike characters. */
function password(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const word = (n: number) =>
    Array.from({ length: n }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `${word(4)}-${word(4)}-${word(4)}-${word(4)}`;
}

function arg(flag: string): string | null {
  const i = process.argv.indexOf(`--${flag}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1]!.startsWith("--")
    ? process.argv[i + 1]!
    : null;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required — this is an operator tool");
  const school = arg("school") ?? process.env.SCHOOL_ID ?? "innovation-tech";

  const pool = new pg.Pool({ connectionString: url });
  try {
    await pool.query(
      `insert into school_classes (school_id, class_id, name) values ($1, $2, $3)
       on conflict do nothing`,
      [school, QA_CLASS_ID, QA_CLASS_NAME],
    );

    const created: { username: string; userId: string; password: string }[] = [];
    for (const qa of QA_USERS) {
      const pw = password();
      const { hash, salt } = await hashPassword(pw);

      const existing = await pool.query<{ user_id: string }>(
        `select user_id from school_accounts where school_id = $1 and username = $2`,
        [school, qa.username],
      );

      let userId: string;
      if (existing.rows.length > 0) {
        userId = existing.rows[0]!.user_id;
        /* Re-password rather than create a second identity with the same name.
           `must_change_password` stays false: a QA account that bounces to the
           password screen on every sign-in cannot be used to test anything. */
        await pool.query(
          `update school_accounts
              set password_hash = $2, password_salt = $3, must_change_password = false,
                  disabled_at = null
            where user_id = $1`,
          [userId, hash, salt],
        );
      } else {
        userId = randomUUID();
        await pool.query(
          `insert into school_accounts
             (user_id, school_id, role, username, display_name,
              password_hash, password_salt, must_change_password)
           values ($1, $2, 'student', $3, $4, $5, $6, false)`,
          [userId, school, qa.username, qa.displayName, hash, salt],
        );
      }

      await pool.query(
        `insert into class_enrolments (school_id, class_id, user_id) values ($1, $2, $3)
         on conflict do nothing`,
        [school, QA_CLASS_ID, userId],
      );
      created.push({ username: qa.username, userId, password: pw });
    }

    console.log(`\n  School ${school} · class ${QA_CLASS_ID} (${QA_CLASS_NAME})`);
    console.log("  No teacher is assigned to this class, so these accounts appear in no roster.\n");
    console.log("  TEMPORARY QA CREDENTIALS — ROTATE AFTER TESTING");
    console.log("  ------------------------------------------------------------");
    for (const c of created) {
      console.log(`  username: ${c.username}`);
      console.log(`  password: ${c.password}`);
      console.log(`  user id : ${c.userId}\n`);
    }
    console.log("  Set this in the deployment environment to grant them every month:");
    console.log(`  FULL_CURRICULUM_QA_USERS=${created.map((c) => c.userId).join(",")}\n`);
    console.log("  The override grants ACCESS only. It writes no completion, no XP, no");
    console.log("  submission and no verdict, and no other learner is affected.\n");
  } finally {
    await pool.end();
  }
}

void main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
