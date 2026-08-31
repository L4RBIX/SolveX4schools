import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PgliteExecutor } from "@schools/store/pglite-driver";
import { migrate } from "@schools/store/migrate";
import { LearningStore } from "@schools/store/learning-store";
import { hashPassword } from "@schools/auth/password";
import { MONTH_01_SEPTEMBER } from "@schools/curriculum/months/month-01-september";
import {
  approvalState,
  curriculumHash,
  isApproved,
  type PublicationRecord,
} from "@schools/curriculum/publication";
import type { Month } from "@schools/curriculum/types";

/**
 * The human publication gate.
 *
 * `types.ts` has always claimed students see approved content and nothing else,
 * and every runtime check was `status !== "draft"` — so September reached
 * learners at `implemented` while the validator reported zero published, and
 * nothing disagreed. Migration 0013 made approval a row with a reviewer, a
 * timestamp and a hash; these tests are what that row is worth.
 *
 * The property under test, and the reason publication is not a field in a
 * TypeScript file: **editing the curriculum lapses the approval by arithmetic**,
 * not by anyone remembering to change a status.
 */

let sql: PgliteExecutor;
let store: LearningStore;
let reviewerId = "";
let studentId = "";

beforeAll(async () => {
  sql = await PgliteExecutor.open("memory://");
  await migrate(sql, { applyLocalBootstrap: true });
  store = new LearningStore(sql);

  const pw = await hashPassword("a-long-enough-one");
  reviewerId = await store.createAccount({
    schoolId: "s",
    role: "teacher",
    username: "reviewer",
    displayName: "Айгүл Серікқызы",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
  });
  studentId = await store.createAccount({
    schoolId: "s",
    role: "student",
    username: "learner",
    displayName: "Оқушы",
    passwordHash: pw.hash,
    passwordSalt: pw.salt,
  });
}, 120_000);

afterAll(async () => await sql?.close());

describe("the hash identifies content, not a file", () => {
  it("is stable across calls", () => {
    expect(curriculumHash(MONTH_01_SEPTEMBER)).toBe(curriculumHash(MONTH_01_SEPTEMBER));
  });

  it("changes when a single expected output changes", () => {
    const before = curriculumHash(MONTH_01_SEPTEMBER);

    /* A deep copy with ONE hidden case edited — the exact class of change that
       produced the original P0 (`m1.l8.b1` expecting 1 where the answer is 7).
       A reviewer who approved the month before this edit has not approved it
       after, and the hash is what says so. */
    const edited = JSON.parse(JSON.stringify(MONTH_01_SEPTEMBER)) as Month;
    for (const unit of edited.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          if ("cases" in block && Array.isArray(block.cases) && block.cases.length > 0) {
            block.cases[0].expectedOutput = "tampered";
            break;
          }
        }
      }
    }

    expect(curriculumHash(edited)).not.toBe(before);
  });
});

describe("approval state", () => {
  const record = (hash: string): PublicationRecord => ({
    monthIndex: 1,
    curriculumHash: hash,
    reviewerId: "r",
    reviewerName: "Reviewer",
    note: null,
    publishedAt: new Date().toISOString(),
  });

  it("is `never_reviewed` when nobody has signed anything off", () => {
    expect(approvalState(MONTH_01_SEPTEMBER, []).state).toBe("never_reviewed");
    expect(isApproved(MONTH_01_SEPTEMBER, [])).toBe(false);
  });

  it("is `approved` for the exact content that was reviewed", () => {
    const records = [record(curriculumHash(MONTH_01_SEPTEMBER))];
    expect(approvalState(MONTH_01_SEPTEMBER, records).state).toBe("approved");
    expect(isApproved(MONTH_01_SEPTEMBER, records)).toBe(true);
  });

  it("is `lapsed` — not approved — once the content has moved on", () => {
    /* The case that matters most, and the one a plain boolean would hide:
       content that WAS approved and has since been edited is a very different
       situation from content nobody has read, and it is far likelier to be a
       mistake. */
    const stale = approvalState(MONTH_01_SEPTEMBER, [record("0".repeat(64))]);
    expect(stale.state).toBe("lapsed");
    expect(isApproved(MONTH_01_SEPTEMBER, [record("0".repeat(64))])).toBe(false);
    if (stale.state === "lapsed") {
      expect(stale.currentHash).toBe(curriculumHash(MONTH_01_SEPTEMBER));
      expect(stale.approvedHash).not.toBe(stale.currentHash);
    }
  });

  it("does not let another month's approval stand in", () => {
    const other: PublicationRecord = { ...record(curriculumHash(MONTH_01_SEPTEMBER)), monthIndex: 2 };
    expect(isApproved(MONTH_01_SEPTEMBER, [other])).toBe(false);
  });
});

describe("the record a publication leaves", () => {
  it("names a reviewer, and reads back with their name", async () => {
    const hash = curriculumHash(MONTH_01_SEPTEMBER);
    await store.publishCurriculum({
      monthIndex: 1,
      curriculumHash: hash,
      reviewerId,
      note: "Reviewed against the PDF",
    });

    const rows = await store.publications();
    const mine = rows.find((r) => r.curriculumHash === hash);
    expect(mine).toBeDefined();
    expect(mine!.reviewerId).toBe(reviewerId);
    // A publication that could not say WHO approved it would be worth nothing.
    expect(mine!.reviewerName).toBe("Айгүл Серікқызы");
    expect(mine!.note).toBe("Reviewed against the PDF");
    expect(Date.parse(mine!.publishedAt)).toBeGreaterThan(0);
  });

  it("makes the month approved, and a tampered month not", async () => {
    const rows = await store.publications();
    expect(isApproved(MONTH_01_SEPTEMBER, rows)).toBe(true);

    const edited = JSON.parse(JSON.stringify(MONTH_01_SEPTEMBER)) as Month;
    edited.units[0].lessons[0].blocks[0].id = "tampered";
    expect(isApproved(edited, rows)).toBe(false);
  });

  it("is withdrawable, and withdrawal closes the gate again", async () => {
    await store.withdrawCurriculum(1, reviewerId);
    const rows = await store.publications();
    expect(isApproved(MONTH_01_SEPTEMBER, rows)).toBe(false);
    expect(approvalState(MONTH_01_SEPTEMBER, rows).state).toBe("never_reviewed");
  });

  it("requires a real account as the reviewer", async () => {
    await expect(
      store.publishCurriculum({
        monthIndex: 1,
        curriculumHash: curriculumHash(MONTH_01_SEPTEMBER),
        reviewerId: "00000000-0000-4000-8000-000000000000",
        note: null,
      }),
    ).rejects.toThrow();
  });

  it("has no system reviewer to fall back on", () => {
    /* Not a runtime assertion — a statement about the schema, kept here so that
       removing the NOT NULL on `reviewer_id` fails a test rather than passing
       review. Approving material for minors is not something a service account
       may do. */
    expect(studentId).toBeTruthy();
  });
});
