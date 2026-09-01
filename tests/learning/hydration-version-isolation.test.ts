import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { CURRICULUM_VERSION, LEGACY_CURRICULUM_VERSION } from "@schools/curriculum/source-of-truth";

/**
 * A Python artifact must not hydrate into the C++ block of the same id.
 *
 * ## Why the block id alone is not enough
 *
 * `m1.l1.b5` exists in both curricula. It is a different task with a different
 * reference solution in a different language, and the only thing the two share
 * is the string. Hydration restores a learner's previously submitted source by
 * looking up their subject and then their settled blocks — so if the subject
 * lookup is not version-scoped, a learner opening the C++ lesson gets their
 * Python program back in the editor.
 *
 * That is worse than an empty editor in a specific way: the restored text
 * compiles as nothing, the learner did not write it in this course, and the
 * product is telling a fourteen-year-old that this is where they left off.
 *
 * ## The path this pins
 *
 * `schools/learning/identity.ts` hydrates through `subjectIdForAlias`, which is
 * READ-ONLY on purpose (a lesson render must not mint a subject — see that
 * method's own comment). It had no version predicate, so with one alias row per
 * curriculum it returned whichever row the planner reached first.
 *
 * ## What is deliberately NOT asserted
 *
 * That the Python artifact is gone. It is the backup and it stays queryable;
 * the last test asks for it explicitly and expects it back. Isolation is not
 * deletion, and a "fix" that destroyed the Python history would satisfy every
 * other assertion in this file while being a data-loss bug.
 */

let sql: PgliteExecutor;
let store: LearningStore;

const BLOCK = "m1.l1.b5";
const SCHOOL = "hydration-isolation-school";
const CLASS = "9A";

const PYTHON_SOURCE = 'n = int(input())\nprint(n * 2)\n';
const CPP_SOURCE = '#include <iostream>\nint main() { int n; std::cin >> n; std::cout << n * 2; }\n';

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);
}, 60_000);

afterAll(async () => await sql?.close());

/**
 * A settled submission carrying the learner's own source, as the submit route
 * writes one. `submitted_artifacts` arrived in migration 0021; the column is
 * nullable for rows older than it, which is why this seeds it explicitly.
 */
async function seedSettled(subjectId: string, source: string): Promise<void> {
  const submissionId = randomUUID();
  const episodeId = randomUUID();
  await sql.query(
    `insert into learning_submissions
       (subject_id, submission_id, block_id, episode_id, claimed_at, settled_at,
        verdict, response, answer)
     values ($1,$2,$3,$4, now(), now(), 'correct', $5::jsonb, $6::jsonb)`,
    [
      subjectId,
      submissionId,
      BLOCK,
      episodeId,
      JSON.stringify({ verdict: "correct" }),
      JSON.stringify({ kind: "code", source }),
    ],
  );
}

/** What hydration would put back in the editor for this subject. */
async function restoredSource(subjectId: string): Promise<string | null> {
  const settled = await store.settledBlocks(subjectId, [BLOCK]);
  const row = settled.get(BLOCK);
  if (!row) return null;
  const answer = row.answer as { kind?: string; source?: string } | null;
  return answer?.source ?? null;
}

describe("hydration is scoped to the active curriculum", () => {
  it("does not restore a Python artifact into the C++ block of the same id", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    await seedSettled(python, PYTHON_SOURCE);

    /* The Python artifact is genuinely there — otherwise this test passes for
       the boring reason that nothing was seeded. */
    expect(await restoredSource(python)).toBe(PYTHON_SOURCE);

    /* And the C++ lesson has nothing to restore. */
    expect(
      await restoredSource(cpp),
      "the same block id must not be enough to carry source across curricula",
    ).toBeNull();
  });

  it("resolves the hydration identity to the active curriculum's subject", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    /* This is the read-only lookup `schools/learning/identity.ts` uses on a
       lesson render. Unscoped, it returned an arbitrary one of the two.
       
       BOTH directions are asserted, and that is what makes this test honest.
       Checking only the active version passes by luck: an unscoped query has no
       ORDER BY, so whether it hands back the Python row or the C++ row is
       planner-dependent, and on this engine it happened to return the C++ one —
       the assertion held while the predicate was missing. Asking for each
       version and requiring a DIFFERENT answer cannot pass without the filter,
       because an unscoped query necessarily returns the same row for both. */
    expect(await store.subjectIdForAlias("user_id", userId, CURRICULUM_VERSION)).toBe(cpp);
    expect(await store.subjectIdForAlias("user_id", userId, LEGACY_CURRICULUM_VERSION)).toBe(python);

    /* And the default argument must be the active curriculum, since every
       production caller relies on it rather than passing one. */
    expect(await store.subjectIdForAlias("user_id", userId)).toBe(cpp);
  });

  it("restores C++ source into the C++ block", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    await seedSettled(cpp, CPP_SOURCE);

    /* Isolation must not become "hydration is broken". */
    expect(await restoredSource(cpp)).toBe(CPP_SOURCE);
  });

  it("keeps both artifacts side by side without either reaching the other", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    const cpp = await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    await seedSettled(python, PYTHON_SOURCE);
    await seedSettled(cpp, CPP_SOURCE);

    expect(await restoredSource(python)).toBe(PYTHON_SOURCE);
    expect(await restoredSource(cpp)).toBe(CPP_SOURCE);
  });

  it("preserves the Python artifact — isolated, not deleted", async () => {
    const userId = randomUUID();
    const scope = { schoolId: SCHOOL, classId: CLASS };

    const python = await store.resolveSubjectForUser(userId, scope, "public", LEGACY_CURRICULUM_VERSION);
    await seedSettled(python, PYTHON_SOURCE);
    await store.resolveSubjectForUser(userId, scope, "public", CURRICULUM_VERSION);

    /* Reachable by asking for the historical subject explicitly, which is what
       "backup" has to mean if the word is to mean anything. */
    expect(await store.subjectIdForAlias("user_id", userId, LEGACY_CURRICULUM_VERSION)).toBe(python);
    expect(await restoredSource(python)).toBe(PYTHON_SOURCE);
  });
});
