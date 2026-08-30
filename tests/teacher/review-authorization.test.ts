import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PgliteExecutor } from "../../schools/store/pglite-driver";
import { migrate } from "../../schools/store/migrate";
import { LearningStore } from "../../schools/store/learning-store";
import { hashPassword } from "../../schools/auth/password";
import type { SqlExecutor } from "../../schools/store/sql";
import { classRoster, subjectIdsOf } from "../../schools/teacher/queries";
import {
  isHumanReviewable,
  reviewQueue,
  storedResponses,
  writtenness,
} from "../../schools/teacher/review";
import { assessmentBlocks, humanMarkedAssessmentBlocks, writeSubmissions } from "./simulated-class";

/**
 * Who may read a child's own words.
 *
 * ## Why this file is separate from `security.test.ts`
 *
 * That file proves the AGGREGATES are school-scoped: counts, medians, shares.
 * This one is about a different class of data. A leaked count is a leaked
 * number; a leaked artifact is a named fourteen-year-old's writing in the hands
 * of a stranger, and it deserves its own gate with its own fixture.
 *
 * ## The fixture: two schools, the same class id
 *
 * Both schools run a class literally called `9a`, and both have a learner in it
 * who has written an explanation. That collision is the whole point: class ids
 * are author-chosen, `config.pilot.classId` ships as `grade-9a`, and every
 * class-keyed query in `LearningStore` filters on `class_id` ALONE. A test
 * using distinct class ids cannot fail the way production would.
 *
 * ## The five cases the brief names
 *
 * | actor | target | expected |
 * |---|---|---|
 * | Teacher A | own class's learner | allowed |
 * | Teacher A | a class they do not teach | denied |
 * | Teacher A of school A | the SAME class id in school B | denied |
 * | a student | the review path | denied |
 * | anonymous | the review path | denied |
 *
 * The last three are decided by `requireClassAccess` and `memberBySubject`
 * before this module is reached, so they are asserted here at the layer that
 * makes them true — the route's guard chain, read from source — plus the data
 * assertion that the population itself cannot cross a school.
 */

let sql: SqlExecutor;
let store: LearningStore;

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";
/** The SAME class id in both schools. */
const CLASS_ID = "9a";
/** A second class in school A, which teacher A does not teach. */
const OTHER_CLASS = "9b";

let subjectA = "";
let subjectB = "";
let subjectOther = "";
let teacherA = "";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/**
 * Strip comments before scanning for a forbidden word.
 *
 * A guard that cannot tell prose from code is one people delete: `review.ts`
 * explains at length WHY it never reads a transcript, and a naive scan for the
 * word "transcript" fails on the explanation. Same technique as
 * `tests/school/theme.test.ts`.
 */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

async function account(schoolId: string, role: "student" | "teacher", username: string) {
  const stored = await hashPassword("correct-horse-battery-staple");
  return store.createAccount({
    schoolId,
    role,
    username,
    displayName: username,
    passwordHash: stored.hash,
    passwordSalt: stored.salt,
  });
}

async function learner(schoolId: string, classId: string, username: string, text: string) {
  const userId = await account(schoolId, "student", username);
  await store.enrol(schoolId, classId, userId);
  const subjectId = await store.resolveSubjectForUser(userId, { schoolId, classId });
  const [explain] = humanMarkedAssessmentBlocks();
  if (explain) {
    await writeSubmissions(sql, [
      { subjectId, spec: { blockId: explain.id, text, daysAgo: 1 } },
    ]);
  }
  return subjectId;
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  await store.upsertClass(SCHOOL_A, CLASS_ID, "9А");
  await store.upsertClass(SCHOOL_A, OTHER_CLASS, "9Б");
  await store.upsertClass(SCHOOL_B, CLASS_ID, "9А");

  teacherA = await account(SCHOOL_A, "teacher", "teacher-a");
  await store.assignTeacher(SCHOOL_A, CLASS_ID, teacherA);
  /* Deliberately NOT assigned to 9Б. "Teacher" is not a key to every class. */

  subjectA = await learner(SCHOOL_A, CLASS_ID, "student-a", "Школа А: я считал время в минутах.");
  subjectB = await learner(SCHOOL_B, CLASS_ID, "student-b", "Школа Б: границу проверял через <=.");
  subjectOther = await learner(SCHOOL_A, OTHER_CLASS, "student-c", "9Б: деление тут не нужно.");
}, 120_000);

afterAll(async () => await sql?.close());

/* -------------------------------------------------------------------------- */
/* The population                                                             */
/* -------------------------------------------------------------------------- */

describe("teacher A, own class", () => {
  it("reads the learner's own words", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const [explain] = humanMarkedAssessmentBlocks();
    const responses = await storedResponses(sql, subjectA, [explain.id]);

    expect(subjectIdsOf(roster)).toEqual([subjectA]);
    expect(responses).toHaveLength(1);
    expect(responses[0].text).toBe("Школа А: я считал время в минутах.");
  });

  it("sees exactly one entry in the queue — their own class's", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const [explain] = humanMarkedAssessmentBlocks();
    const claims = await reviewQueue(sql, subjectIdsOf(roster), [explain.id]);

    expect(claims).toHaveLength(1);
    expect(claims[0].subjectId).toBe(subjectA);
    expect(claims[0].readable).toBe(true);
  });
});

describe("the same class id in another school", () => {
  it("does not appear in this school's roster, so it cannot reach the queue", async () => {
    const rosterA = await classRoster(sql, SCHOOL_A, CLASS_ID);
    const ids = subjectIdsOf(rosterA);

    expect(ids).not.toContain(subjectB);

    const [explain] = humanMarkedAssessmentBlocks();
    const claims = await reviewQueue(sql, ids, [explain.id]);
    expect(claims.map((c) => c.subjectId)).not.toContain(subjectB);
  });

  it("the store's own class-keyed query still crosses the boundary — which is why the roster is used", async () => {
    /* Pinned, not aspirational. `subjectsInClass` filters on `class_id` alone
       and returns BOTH schools' learners. If the review path ever sourced its
       population from there instead of from `class_enrolments`, school A's
       teacher would read school B's child. This assertion is the reason the
       module comment in `review.ts` says "population, never a class id". */
    const both = await store.subjectsInClass(CLASS_ID);
    expect(both).toContain(subjectA);
    expect(both).toContain(subjectB);
  });
});

describe("a class the teacher does not teach", () => {
  it("is refused by the guard, before any query runs", () => {
    const guard = read("schools/auth/guard.ts");
    const fn = guard.slice(
      guard.indexOf("export async function requireClassAccess"),
      guard.indexOf("export async function requireLearner"),
    );
    /* Authority comes from `class_teachers`, not from the role, and the refusal
       is 404 rather than 403 — 403 would confirm the class exists and turn the
       endpoint into an oracle for enumerating a school's classes. */
    expect(fn).toContain("store.teachesClass(user.userId, user.schoolId, classId)");
    expect(fn).toMatch(/if \(!teaches\) return \{ ok: false, status: 404/);
  });

  it("holds in the data too: 9Б's learner is not on 9А's roster", async () => {
    const roster = await classRoster(sql, SCHOOL_A, CLASS_ID);
    expect(subjectIdsOf(roster)).not.toContain(subjectOther);
  });
});

describe("a student, and anonymous", () => {
  const guard = read("schools/auth/guard.ts");
  const fn = guard.slice(
    guard.indexOf("export async function requireClassAccess"),
    guard.indexOf("export async function requireLearner"),
  );

  it("anonymous is 401 before anything else happens", () => {
    expect(fn).toMatch(/if \(!user\) return \{ ok: false, status: 401, reason: "not_authenticated" \}/);
  });

  it("a student is refused outright, whatever class id they name", () => {
    expect(fn).toMatch(/if \(user\.role === "student"\) return \{ ok: false, status: 403/);
  });
});

/* -------------------------------------------------------------------------- */
/* The route's own chain                                                      */
/* -------------------------------------------------------------------------- */

describe("the review route resolves the whole chain", () => {
  const route = read("src/app/api/teacher/class/[classId]/review/[subjectId]/route.ts");

  it("guards the class before reading anything", () => {
    /* The order in the BODY, not in the imports — which are alphabetical and
       put `buildStudentReview` first. What matters is that no read happens
       until the guard has returned. */
    const body = route.slice(route.indexOf("export async function GET"));
    expect(body).toContain("openTeacherRequest(request, classId)");
    expect(body.indexOf("openTeacherRequest")).toBeLessThan(body.indexOf("buildStudentReview"));
  });

  it("checks the learner against THIS class's roster, and 404s", () => {
    expect(route).toContain("memberBySubject(bundle, subjectId)");
    expect(route).toMatch(/if \(!member\) return deny\(404, "not_found"\)/);
  });

  it("the write is guarded by the same five statements as the read", () => {
    /*
     * This assertion used to read "has no write path", and it was correct:
     * nothing could record a marking outcome, so a POST would have been a
     * button that looked like it worked and changed nothing. Migration 0022
     * added `human_reviews` and the button is real — so the guard this test
     * exists for moves from "there is no write" to "the write authorises
     * itself exactly like the read beside it".
     *
     * Compared statement by statement rather than by eye, because a mutation
     * that drifts from the read next to it is how one of them ends up missing
     * a check.
     */
    const post = route.slice(route.indexOf("export async function POST"));
    const get = route.slice(
      route.indexOf("export async function GET"),
      route.indexOf("export async function POST"),
    );
    const prologue = (fn: string) =>
      fn
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /openTeacherRequest|opened\.ok|memberBySubject|!member|await params/.test(l));

    expect(prologue(post)).toEqual(prologue(get));
    expect(prologue(post).length).toBe(5);
  });

  it("only PUT, PATCH and DELETE remain absent", () => {
    /* One verb was added, deliberately. A DELETE would be «снять отметку», and
       there is none: once a teacher has read a child's answer the platform has
       no honest way to un-know it. */
    expect(route).toMatch(/export async function POST/);
    expect(route).not.toMatch(/export async function (PUT|PATCH|DELETE)/);
  });

  it("re-derives the block allowlist rather than trusting the body", () => {
    /* The GET gets `isHumanReviewable` for free by building from the
       curriculum. A POST names a block, so the filter has to be re-run or a
       teacher could record a review against a coding block, an MCQ, or any
       lesson block in the course. */
    const post = route.slice(route.indexOf("export async function POST"));
    expect(post).toContain("isHumanReviewable(block)");
    expect(post).toContain("bundle.month.assessment?.blocks.find");
  });

  it("refuses a disposition outside the closed vocabulary before writing", () => {
    const post = route.slice(route.indexOf("export async function POST"));
    expect(post).toContain("isReviewDisposition(body.disposition)");
    expect(post).toMatch(/deny\(400, "invalid_disposition"\)/);
  });

  it("answers the same 404 for an unknown submission as for an unknown learner", () => {
    /* A different answer would confirm which of the two was wrong, and turn the
       endpoint into an oracle for testing whether a submission id exists. */
    const post = route.slice(route.indexOf("export async function POST"));
    const notFound = post.match(/deny\(404, "not_found"\)/g) ?? [];
    expect(notFound.length).toBeGreaterThanOrEqual(3);
  });

  it("checks the submission id's shape before it reaches a uuid cast", () => {
    /* A non-UUID string fails `::uuid` inside Postgres with 22P02 and leaves
       the handler as a 500 with a stack trace — not the uniform 404 this route
       promises for every bad submission id. */
    const post = route.slice(route.indexOf("export async function POST"));
    expect(post).toContain("UUID.test(submissionId)");
    expect(route).toMatch(/const UUID = \/\^\[0-9a-f\]\{8\}/);
  });

  it("sends the reviewer from the session, never from the body", () => {
    /* `userId` comes off `openTeacherRequest`, which resolved it from the
       session cookie. A body field would let a teacher record a colleague's
       name against their own reading. */
    const post = route.slice(route.indexOf("export async function POST"));
    expect(post).toContain("reviewedBy: userId");
    expect(post).not.toMatch(/reviewedBy:\s*body\./);
  });
});

/* -------------------------------------------------------------------------- */
/* What the payload may contain                                               */
/* -------------------------------------------------------------------------- */

describe("the read path cannot return answer-key material", () => {

  it("selects the learner's answer and never the submit response", () => {
    const src = code("schools/teacher/review.ts");
    /* `learning_submissions.response` carries the curriculum's own reveal
       payload and the author's justification prose — migration 0019 lists them.
       `answer` is defined by 0021 as the learner's `BlockAnswer` and "never
       contains answer-key material". Only one of those may be selected here. */
    expect(src).toContain("s.answer");
    expect(src).not.toMatch(/\bs\.response\b/);
  });

  it("never reaches for a reference solution or a hidden case", () => {
    const body = code("schools/teacher/review.ts");
    expect(body).not.toContain("referenceSolution");
    expect(body).not.toContain("hiddenCase");
    expect(body).not.toMatch(/\bcases\b/);
  });

  it("only blocks the curriculum declares a human marks are reachable", () => {
    const blocks = assessmentBlocks();
    const reviewable = blocks.filter(isHumanReviewable);

    /* Positive: September's written explanation and its oral note qualify. */
    expect(reviewable.length).toBeGreaterThan(0);
    /* Negative: the two coding blocks do not. A learner's SOURCE is not
       something this route may hand to anyone. */
    for (const block of blocks) {
      if (block.type === "verify" && block.mode !== "oral_explanation") {
        expect(isHumanReviewable(block)).toBe(false);
      }
    }
  });

  it("requires authored marking criteria, the same gate post-help uses", () => {
    /* Without `expectedPoints` a teacher is being asked to invent a standard
       per learner, which is what `classifyExplanation` in `post-help.ts`
       refuses to do. A block with prose and no criteria is not queued. */
    const withoutCriteria = {
      id: "x1",
      type: "explain" as const,
      prompt: { kk: "", ru: "" },
      expectedPoints: [],
      skillRefs: [],
      sourceType: "curriculum-derived" as const,
      pdfPage: 1,
    };
    expect(isHumanReviewable(withoutCriteria)).toBe(false);
  });
});

describe("Nova conversations are unreachable rather than filtered", () => {
  it("no query in the review module touches an intervention or a message", () => {
    const src = code("schools/teacher/review.ts").toLowerCase();
    expect(src).not.toContain("interventions");
    expect(src).not.toContain("message");
    expect(src).not.toContain("transcript");
    expect(src).not.toContain("nova");
  });

  it("nothing anywhere stores chat text to leak", () => {
    /* The stronger guarantee: the payload allowlist has no key for free text,
       so a Nova conversation is not somewhere this route declines to look — it
       is nowhere at all. */
    const contracts = read("packages/learning-contracts/src/events.ts");
    expect(contracts).not.toMatch(/["']message_text["']/);
    expect(contracts).not.toMatch(/["']content["']/);
  });
});

/* -------------------------------------------------------------------------- */
/* Written and oral, told apart                                               */
/* -------------------------------------------------------------------------- */

describe("the oral block is never presented as a recording", () => {
  it("classifies September's oral check as a written note, not an answer", () => {
    /* Found through the predicate the console itself uses, so this narrows
       rather than casting — a cast here would be the one construct that could
       let a block with no prompt reach the panel. */
    const oral = humanMarkedAssessmentBlocks().find(
      (b) => b.type === "verify" && b.mode === "oral_explanation",
    );
    expect(oral).toBeDefined();
    expect(writtenness(oral!)).toBe("spoken_note");
  });

  it("no audio is captured anywhere in the product", () => {
    /* The claim the copy rests on, asserted rather than assumed. If a recorder
       ever ships, this fails and the sentence about the oral defence has to be
       rewritten in the same commit. */
    const migrations = read("database/migrations/0021_submitted_artifacts.sql");
    expect(migrations).not.toContain("audio");
    const renderer = read("src/components/brilliant/lesson/blocks/index.tsx");
    expect(renderer).not.toContain("MediaRecorder");
    expect(renderer).not.toContain("getUserMedia");
  });

  it("the teacher copy says written is readable and oral happens in person", () => {
    const labels = read("schools/teacher/labels.ts");
    expect(labels).toContain("assessmentWrittenStored");
    expect(labels).toContain("assessmentOralInPerson");
    /* The stale claim, gone. It was true until migration 0021 and is now false
       for half of what it describes. */
    expect(labels).not.toContain("Письменные и устные ответы пока не сохраняются");
  });
});

/* -------------------------------------------------------------------------- */
/* The residue                                                                */
/* -------------------------------------------------------------------------- */

describe("a submission settled before artifacts were stored", () => {
  it("stays in the queue, marked unreadable rather than dropped", async () => {
    const userId = await account(SCHOOL_A, "student", "student-legacy");
    await store.enrol(SCHOOL_A, CLASS_ID, userId);
    const subjectId = await store.resolveSubjectForUser(userId, {
      schoolId: SCHOOL_A,
      classId: CLASS_ID,
    });
    const [explain] = humanMarkedAssessmentBlocks();
    await writeSubmissions(sql, [
      { subjectId, spec: { blockId: explain.id, text: "", daysAgo: 2, artifactMissing: true } },
    ]);

    const claims = await reviewQueue(sql, [subjectId], [explain.id]);
    expect(claims).toHaveLength(1);
    /* The learner did the work. The platform lost the words. Dropping the row
       would blame the child for the platform's gap. */
    expect(claims[0].readable).toBe(false);

    const responses = await storedResponses(sql, subjectId, [explain.id]);
    expect(responses[0].text).toBeNull();
    expect(responses[0].submittedAt).not.toBeNull();
  });
});

describe("an empty allowlist returns nothing", () => {
  it("no subjects, no blocks, no rows — without touching the database", async () => {
    expect(await reviewQueue(sql, [], ["m1.as.b3"])).toEqual([]);
    expect(await reviewQueue(sql, [subjectA], [])).toEqual([]);
    expect(await storedResponses(sql, subjectA, [])).toEqual([]);
  });
});
