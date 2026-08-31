import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import {
  generateInitialPassword,
  hashPassword,
  passwordProblem,
  verifyPassword,
} from "@schools/auth/password";

/**
 * Identity, roles and enrolment.
 *
 * Before migration 0012 there was no such thing as a person: an anonymous
 * cookie named a device, `config.pilot` carried a school and class as two
 * environment strings, and the teacher endpoint had to refuse in production
 * because nothing could establish that the caller taught the class it returned.
 *
 * These tests are the boundaries. They are written against the STORE rather
 * than the HTTP layer wherever possible, because that is where the authority
 * actually lives — a guard that consults the wrong table is wrong no matter how
 * the route is written.
 */

let sql: PgliteExecutor;
let store: LearningStore;

const SCHOOL = "test-school";
const CLASS_A = "9a";
const CLASS_B = "9b";

let teacherA = "";
let teacherB = "";
let studentA1 = "";
let studentA2 = "";

async function account(
  role: "student" | "teacher",
  username: string,
  password: string,
): Promise<string> {
  const stored = await hashPassword(password);
  return store.createAccount({
    schoolId: SCHOOL,
    role,
    username,
    displayName: username,
    passwordHash: stored.hash,
    passwordSalt: stored.salt,
  });
}

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  await store.upsertClass(SCHOOL, CLASS_A, "9А");
  await store.upsertClass(SCHOOL, CLASS_B, "9Б");

  teacherA = await account("teacher", "teacher-a", "correct-horse-battery");
  teacherB = await account("teacher", "teacher-b", "correct-horse-battery");
  studentA1 = await account("student", "student-a1", "correct-horse-battery");
  studentA2 = await account("student", "student-a2", "correct-horse-battery");

  await store.assignTeacher(SCHOOL, CLASS_A, teacherA);
  await store.assignTeacher(SCHOOL, CLASS_B, teacherB);
  await store.enrol(SCHOOL, CLASS_A, studentA1);
  await store.enrol(SCHOOL, CLASS_A, studentA2);
}, 120_000);

afterAll(async () => await sql?.close());

describe("passwords", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct-horse-battery");
    expect(await verifyPassword("correct-horse-battery", stored)).toBe(true);
    expect(await verifyPassword("correct-horse-batterX", stored)).toBe(false);
  });

  it("never stores the password, and salts each one differently", async () => {
    const a = await hashPassword("same-password-twice");
    const b = await hashPassword("same-password-twice");
    expect(a.hash).not.toContain("same-password-twice");
    expect(a.salt).not.toBe(b.salt);
    // Same input, different salt, therefore different digest. A shared digest
    // would mean the salt was decorative.
    expect(a.hash).not.toBe(b.hash);
  });

  it("carries its cost parameters so they can be raised later", async () => {
    const stored = await hashPassword("whatever-goes-here");
    expect(stored.hash.startsWith("scrypt$")).toBe(true);
    // A record whose cost is only known implicitly cannot be upgraded without
    // invalidating every existing credential.
    expect(stored.hash.split("$").length).toBe(5);
  });

  it("reads a corrupted record as a wrong password, not an exception", async () => {
    expect(await verifyPassword("x", { hash: "nonsense", salt: "zz" })).toBe(false);
    expect(await verifyPassword("x", { hash: "scrypt$1$1$1$ff", salt: "" })).toBe(false);
  });

  it("generates a first password a teacher can read aloud", () => {
    const p = generateInitialPassword();
    expect(p).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    // The characters that get misread on a card.
    expect(p).not.toMatch(/[01lIoO]/);
  });

  it("requires length rather than composition theatre", () => {
    expect(passwordProblem("short", "bek")).toBe("too_short");
    expect(passwordProblem("bek-is-here-now", "bek")).toBe("contains_username");
    expect(passwordProblem("a-long-enough-one", "bek")).toBeNull();
  });
});

describe("a teacher's authority is the classes they teach", () => {
  it("lists only their own classes", async () => {
    const a = await store.classesForTeacher(teacherA);
    expect(a.map((c) => c.classId)).toEqual([CLASS_A]);
    const b = await store.classesForTeacher(teacherB);
    expect(b.map((c) => c.classId)).toEqual([CLASS_B]);
  });

  it("answers false for a class they do not teach", async () => {
    expect(await store.teachesClass(teacherA, SCHOOL, CLASS_A)).toBe(true);
    expect(await store.teachesClass(teacherA, SCHOOL, CLASS_B)).toBe(false);
    // "Teacher" is not a key to every class in the school.
    expect(await store.teachesClass(teacherB, SCHOOL, CLASS_A)).toBe(false);
  });

  it("does not treat a student as a teacher of their own class", async () => {
    expect(await store.teachesClass(studentA1, SCHOOL, CLASS_A)).toBe(false);
  });
});

describe("enrolment", () => {
  it("puts the enrolled learners on the roster and nobody else", async () => {
    const roster = await store.rosterForClass(SCHOOL, CLASS_A);
    expect(roster.map((r) => r.username).sort()).toEqual(["student-a1", "student-a2"]);
    expect(await store.rosterForClass(SCHOOL, CLASS_B)).toEqual([]);
  });

  it("resolves the learner's own class", async () => {
    const classes = await store.classesForLearner(studentA1);
    expect(classes).toEqual([{ schoolId: SCHOOL, classId: CLASS_A }]);
  });
});

describe("a learner is one subject, whatever device they sign in from", () => {
  it("returns the same subject twice for the same account", async () => {
    const first = await store.resolveSubjectForUser(studentA1, { schoolId: SCHOOL, classId: CLASS_A });
    const second = await store.resolveSubjectForUser(studentA1, { schoolId: SCHOOL, classId: CLASS_A });
    expect(second).toBe(first);
  });

  it("gives two accounts two subjects", async () => {
    const one = await store.resolveSubjectForUser(studentA1, { schoolId: SCHOOL, classId: CLASS_A });
    const two = await store.resolveSubjectForUser(studentA2, { schoolId: SCHOOL, classId: CLASS_A });
    // The property the whole evidence model rests on: one learner's work can
    // never land on another learner's record.
    expect(one).not.toBe(two);
  });

  it("scopes the subject to its class so the teacher query can find it", async () => {
    const subject = await store.resolveSubjectForUser(studentA1, { schoolId: SCHOOL, classId: CLASS_A });
    const inClass = await store.subjectsInClass(CLASS_A);
    expect(inClass).toContain(subject);
  });
});

describe("sessions", () => {
  it("resolves a live session and refuses an unknown token", async () => {
    const hash = `hash-${randomUUID()}`;
    const future = new Date(Date.now() + 3_600_000).toISOString();
    await store.createSession(studentA1, hash, future);

    const found = await store.sessionByTokenHash(hash);
    expect(found?.userId).toBe(studentA1);
    expect(await store.sessionByTokenHash(`hash-${randomUUID()}`)).toBeNull();
  });

  it("refuses an expired session without the caller having to check", async () => {
    const hash = `hash-${randomUUID()}`;
    const past = new Date(Date.now() - 1_000).toISOString();
    await store.createSession(studentA1, hash, past);
    // Expiry lives in the WHERE clause precisely so there is no code path where
    // somebody forgets to compare a date.
    expect(await store.sessionByTokenHash(hash)).toBeNull();
  });

  it("refuses a revoked session immediately", async () => {
    const hash = `hash-${randomUUID()}`;
    await store.createSession(studentA1, hash, new Date(Date.now() + 3_600_000).toISOString());
    expect(await store.sessionByTokenHash(hash)).not.toBeNull();

    await store.revokeSession(hash);
    expect(await store.sessionByTokenHash(hash)).toBeNull();
  });

  it("revokes every session when a password changes", async () => {
    const a = `hash-${randomUUID()}`;
    const b = `hash-${randomUUID()}`;
    const future = new Date(Date.now() + 3_600_000).toISOString();
    await store.createSession(studentA2, a, future);
    await store.createSession(studentA2, b, future);

    await store.revokeAllSessions(studentA2);

    // A password change is usually a response to someone else knowing it.
    // Leaving their session alive would defeat the point.
    expect(await store.sessionByTokenHash(a)).toBeNull();
    expect(await store.sessionByTokenHash(b)).toBeNull();
  });
});

describe("accounts", () => {
  it("is case-insensitively unique per school", async () => {
    const stored = await hashPassword("a-long-enough-one");
    await expect(
      store.createAccount({
        schoolId: SCHOOL,
        role: "student",
        username: "STUDENT-A1",
        displayName: "collision",
        passwordHash: stored.hash,
        passwordSalt: stored.salt,
      }),
    ).rejects.toThrow();
  });

  it("requires a password change on a credential handed out on paper", async () => {
    const account = await store.findAccountByUsername(SCHOOL, "student-a1");
    expect(account?.mustChangePassword).toBe(true);
  });

  it("clears that flag when the learner sets their own", async () => {
    const stored = await hashPassword("a-brand-new-password");
    await store.setPassword(studentA1, stored.hash, stored.salt);
    const account = await store.findAccountByUsername(SCHOOL, "student-a1");
    expect(account?.mustChangePassword).toBe(false);
    expect(
      await verifyPassword("a-brand-new-password", {
        hash: account!.passwordHash,
        salt: account!.passwordSalt,
      }),
    ).toBe(true);
  });
});
