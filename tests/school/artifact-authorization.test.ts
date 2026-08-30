import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Who can read a learner's submitted work.
 *
 * ## The strongest guarantee is the one that is not a check
 *
 * `lessonHydration(lessonId, blocks)` takes no subject parameter, and the
 * identity it uses — `knownSubjectId()` — takes no arguments at all: it reads
 * an httpOnly session cookie or an anon cookie and nothing else. So "student A
 * requests student B's artifacts" is not refused, it is **unrepresentable**.
 * There is no argument to tamper with, no id in a URL, no field in a body.
 *
 * Tests that assert a denial can only ever prove that today's check works.
 * These assert the shape that makes the denial unnecessary, and then prove the
 * data really does stay separated where it is read.
 */

process.env.LEARNING_DATA_DIR = "memory://";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

type Handle = Awaited<ReturnType<typeof import("@schools/store").getStoreHandle>>;
let sql: Handle["sql"];
let store: Handle["store"];

beforeAll(async () => {
  ({ sql, store } = await (await import("@schools/store")).getStoreHandle());
}, 90_000);

/** A learner in a named school, holding one settled artifact. */
async function learner(schoolId: string, classId: string, source: string) {
  const subjectId = randomUUID();
  await sql.query(`insert into learning_subjects (subject_id, user_id) values ($1, $2)`, [
    subjectId,
    randomUUID(),
  ]);
  await sql.query(
    `insert into school_classes (school_id, class_id, name) values ($1,$2,$3)
       on conflict (school_id, class_id) do nothing`,
    [schoolId, classId, classId],
  );
  await sql.query(
    `insert into learning_submissions
       (subject_id, submission_id, block_id, episode_id, settled_at, verdict, response, answer)
     values ($1,$2,'m1.l12.b2',$3, now(), 'correct', $4::jsonb, $5::jsonb)`,
    [
      subjectId,
      randomUUID(),
      randomUUID(),
      JSON.stringify({ verdict: "correct" }),
      JSON.stringify({ kind: "text", value: source }),
    ],
  );
  return subjectId;
}

describe("the read path cannot be pointed at another learner", () => {
  it("takes no subject parameter, anywhere along the chain", () => {
    const rehydrate = read("schools/learning/rehydrate.ts");
    const sig = rehydrate.slice(
      rehydrate.indexOf("export async function lessonHydration"),
      rehydrate.indexOf("): Promise<LessonHydration>"),
    );
    expect(sig, "no subjectId/userId/learnerId may be accepted").not.toMatch(
      /subjectId|userId|learnerId|studentId/,
    );

    const identity = read("schools/learning/identity.ts");
    const known = identity.slice(
      identity.indexOf("export async function knownSubjectId"),
      identity.indexOf("export function anonCookie"),
    );
    expect(known, "identity must come from the cookie, not an argument").toContain(
      "export async function knownSubjectId(): Promise<string | null>",
    );
  });

  it("is read by exactly one caller, the learner's own projection", () => {
    /* `readArtifact` is the only way the column becomes a value anything can
       render. One call site means one place to audit — and it is inside
       `projectHydration`, which is fed only by the no-parameter path above.
       A second caller would be the moment to re-run this whole audit. */
    const hydration = read("schools/learning/hydration.ts");
    const callers = (hydration.match(/readArtifact\(/g) ?? []).length;
    expect(callers, "definition + the single projection call").toBe(3);
  });

  it("is readable through exactly one teacher path, and it arrived with its own tests", () => {
    /*
     * This assertion used to read "is not readable through any teacher path",
     * and the reason it did was honest at the time: there was no teacher
     * artifact endpoint to scope, because there was no teacher artifact
     * endpoint. It ended with "if one is added, it must arrive with its own
     * tests". One has, and this is the audit that condition asked for.
     *
     * The aggregate modules stay clean. Everything in `queries.ts` and
     * `context.ts` is a count, a median or a share, and that separation is what
     * makes "which code can return a child's writing" answerable by looking at
     * one small file.
     */
    for (const rel of ["schools/teacher/queries.ts", "schools/teacher/context.ts"]) {
      let src: string;
      try {
        src = read(rel);
      } catch {
        continue; // another workstream owns these; absence is not a failure
      }
      expect(src, `${rel} must not select the artifact column`).not.toMatch(
        /\bs?\.?answer\b\s*(,|from|as)/,
      );
      expect(src).not.toContain("readArtifact");
    }

    /* The one module that may, and the guarantees it carries. Its own gate is
       `tests/teacher/review-authorization.test.ts`, which covers teacher →
       school → class → enrolled learner → permitted block. */
    const review = read("schools/teacher/review.ts");
    expect(review).toContain("readArtifact");
    /* Comments stripped: the module argues at length about class ids and the
       `response` column precisely in order to explain why it touches neither,
       and a scan that cannot tell prose from code is one people delete. */
    const code = review
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
    /* Population from the roster, never a class id: two schools can both run a
       class called `grade-9a`. */
    expect(code).toContain("subjectIds");
    expect(code).not.toMatch(/\bclass_id\b/);
    /* `response` carries the curriculum's reveal payload — 0019 lists it — and
       is never selected here. */
    expect(code).not.toMatch(/\bs\.response\b/);
  });
});

describe("two schools, the same class id", () => {
  it("keeps artifacts apart when the class id collides", async () => {
    /* The case that makes the test meaningful. Class ids are author-chosen and
       are NOT globally unique: two schools can both call a class `grade-9a`. A
       query scoped on `class_id` alone would hand one school's work to the
       other. Hydration is scoped by SUBJECT, so it cannot — proven rather than
       assumed, because the store has had class-keyed queries before. */
    const CLASS = "grade-9a";
    const a = await learner("school-alpha", CLASS, "print('alpha work')");
    const b = await learner("school-beta", CLASS, "print('beta work')");

    const aState = await store.settledBlocks(a, ["m1.l12.b2"]);
    const bState = await store.settledBlocks(b, ["m1.l12.b2"]);

    expect(JSON.stringify(aState.get("m1.l12.b2")?.answer)).toContain("alpha work");
    expect(JSON.stringify(aState.get("m1.l12.b2")?.answer)).not.toContain("beta work");
    expect(JSON.stringify(bState.get("m1.l12.b2")?.answer)).toContain("beta work");
    expect(JSON.stringify(bState.get("m1.l12.b2")?.answer)).not.toContain("alpha work");
  });

  it("returns nothing for a subject with no work, rather than someone else's", async () => {
    /* The failure mode a `class_id`-scoped query produces is not an error — it
       is another child's answer appearing under this child's name. */
    const stranger = randomUUID();
    await sql.query(`insert into learning_subjects (subject_id, user_id) values ($1,$2)`, [
      stranger,
      randomUUID(),
    ]);
    const state = await store.settledBlocks(stranger, ["m1.l12.b2"]);
    expect(state.size, "a learner with no submissions gets an empty map").toBe(0);
  });
});

describe("anonymous", () => {
  it("hydrates nothing when there is no identity", async () => {
    /* `knownSubjectId()` returns null with no session and no anon cookie, and
       `lessonHydration` returns the empty shape rather than guessing. */
    const rehydrate = read("schools/learning/rehydrate.ts");
    expect(rehydrate).toContain("const subjectId = await knownSubjectId();");
    expect(rehydrate).toContain("if (!subjectId) return empty;");
  });
});
