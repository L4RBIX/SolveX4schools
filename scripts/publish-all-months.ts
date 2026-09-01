/**
 * Publish every authored month, in one human act.
 *
 * `publish-curriculum.ts` publishes ONE month and prompts for the reviewer's
 * password each time. Nine invocations means typing a password nine times, and
 * an operator who does that reaches for a shell loop with the password in it —
 * which is the credential-in-`ps` problem the single-month script exists to
 * avoid.
 *
 * So this asks once, authenticates once, and publishes every month. What it
 * deliberately does NOT do is weaken the gate:
 *
 *   - `--i-am-the-reviewer` is still required, and still means what it says.
 *   - The password is still read from the terminal, never from a flag.
 *   - It still authenticates through `authenticateReviewer`, so a student
 *     account or a disabled one is refused exactly as before.
 *   - It still refuses any month that has draft lessons.
 *   - Each row still pins the sha256 of the exact month object approved, so
 *     editing the curriculum afterwards lapses that approval by arithmetic.
 *
 * The human assertion is the same assertion. Only the typing is shorter.
 *
 *   npx tsx scripts/publish-all-months.ts \
 *     --reviewer grade-9a-teacher --school innovation-tech \
 *     --note "C++17 curriculum, owner authorised" --i-am-the-reviewer
 */
import { randomUUID } from "node:crypto";
import { promptSecret } from "./prompt-secret";
import { MONTHS } from "../schools/curriculum/months";
import { curriculumHash } from "../schools/curriculum/publication";
import { authenticateReviewer, openOperatorDb } from "./operator";

function arg(flag: string, fallback?: string): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${flag}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`missing --${flag}`);
}
const has = (flag: string) => process.argv.slice(2).includes(`--${flag}`);

async function main() {
  const reviewerUsername = arg("reviewer");
  const note = arg("note", "");
  const schoolId = arg("school", process.env.SCHOOL_ID ?? "pilot-school");
  const dataDir = arg("data-dir", process.env.LEARNING_DATA_DIR ?? ".data/learning");

  /* Refuse the whole run if ANY month is unfinished, rather than publishing
     the first four and stopping. A half-published year is a worse state than
     an unpublished one: the gate would open some months and not others, and
     the operator would have to work out which. */
  const drafts = MONTHS.flatMap((m) =>
    m.units.flatMap((u) => u.lessons.filter((l) => l.status === "draft").map((l) => `m${m.index}:${l.id}`)),
  );
  if (drafts.length > 0) {
    throw new Error(`${drafts.length} draft lesson(s) still authored: ${drafts.join(", ")}`);
  }

  console.log(`\n  Publishing ${MONTHS.length} months as ${reviewerUsername} (school ${schoolId})\n`);
  for (const m of MONTHS) {
    const lessons = m.units.reduce((n, u) => n + u.lessons.length, 0);
    const blocks = m.units.reduce((n, u) => n + u.lessons.reduce((k, l) => k + l.blocks.length, 0), 0);
    console.log(
      `  ${String(m.index).padStart(2)}  ${m.monthName.ru.padEnd(12)} ` +
        `${String(lessons).padStart(2)} lessons ${String(blocks).padStart(3)} blocks  ${curriculumHash(m).slice(0, 16)}…`,
    );
  }

  console.log(`\n  Publishing records YOU as having reviewed exactly this content.`);
  console.log(`  If the curriculum changes afterwards, these approvals lapse automatically.\n`);

  if (!has("i-am-the-reviewer")) {
    console.log("  Refusing to continue without --i-am-the-reviewer.");
    console.log("  That flag is an assertion that a person read the material, not a formality.\n");
    process.exitCode = 2;
    return;
  }

  const password = await promptSecret(`  Password for ${reviewerUsername}: `);

  const db = await openOperatorDb(dataDir);
  const auth = await authenticateReviewer(db, schoolId, reviewerUsername, password);
  if (!auth.ok) {
    console.log(`\n  Not published: ${auth.reason}.\n`);
    await db.close();
    process.exitCode = 1;
    return;
  }

  let published = 0;
  for (const month of MONTHS) {
    const hash = curriculumHash(month);
    await db.query(
      `insert into curriculum_publications
         (publication_id, month_index, curriculum_hash, reviewer_id, note)
       values ($1,$2,$3,$4,$5)
       on conflict (month_index, curriculum_hash) where withdrawn_at is null do nothing`,
      [randomUUID(), month.index, hash, auth.reviewer.userId, note || null],
    );
    const live = await db.query<{ n: number }>(
      `select count(*)::int as n from curriculum_publications
        where month_index = $1 and curriculum_hash = $2 and withdrawn_at is null`,
      [month.index, hash],
    );
    const ok = Number(live.rows[0]?.n ?? 0) > 0;
    if (ok) published += 1;
    console.log(`  ${ok ? "✓" : "✗"} month ${month.index} — ${month.monthName.ru}`);
  }
  await db.close();

  console.log(
    `\n  ${published}/${MONTHS.length} months approved by ${auth.reviewer.displayName}.` +
      `\n  Students will now be served this content, and only this content.\n`,
  );
  if (published !== MONTHS.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`\n  publish failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
