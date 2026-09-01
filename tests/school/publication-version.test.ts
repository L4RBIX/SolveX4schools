import { describe, it, expect } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { approvalState, curriculumHash, type PublicationRecord } from "@schools/curriculum/publication";

/**
 * A Python-era approval must never open the C++ gate.
 *
 * ## What actually holds the line, and what only looks like it does
 *
 * The publication record carries `(month_index, curriculum_hash)` and
 * `approvalState` requires an EXACT hash match against the month's current
 * content. The hash is taken over the serialised month — every prompt, case,
 * answer and ordering — so re-authoring September from Python to C++ changes it
 * by arithmetic rather than by anybody remembering to withdraw the old row.
 *
 * That is a real structural guarantee and it is worth pinning, because the
 * obvious alternative reading is wrong: the gate is NOT holding because
 * somebody withdrew the Python approvals. They are all still live. It holds
 * because a hash of different content is a different hash.
 *
 * ## Measured against production, 2026-09-01
 *
 * All nine Python-era rows are live (`withdrawn_at is null`) and NONE of their
 * hashes matches the current C++ month:
 *
 *     month 1  stored fc70b83383ea…  current c257be158b6a…  no
 *     month 2  stored b1a6527e5b25…  current ceda1fbdd131…  no
 *     …
 *     month 9  stored 9d1cba575584…  current 6741eb5b6feb…  no
 *
 *     0 / 9 rows approve the current curriculum.
 *
 * Which is why an authenticated learner hitting `/lesson/m1.l1` on a production
 * build gets a 404 rather than a C++ lesson.
 *
 * ## Why there is no `curriculum_version` column on publications
 *
 * It would be redundant with the hash and weaker than it. A version string is
 * something a human types and can type wrongly; the hash is derived from the
 * content being approved and cannot disagree with it. Adding the column would
 * create a second, softer answer to "what did this person approve", and the two
 * could drift.
 */

const september = () => MONTHS.find((m) => m.index === 1)!;

/** A publication row for a month whose content has since been re-authored. */
function pythonEraRecord(monthIndex: number): PublicationRecord {
  return {
    monthIndex,
    /* A real-shaped hash that is not the current one — this is what every
       production row looks like from the C++ curriculum's point of view. */
    curriculumHash: "fc70b83383ea".padEnd(64, "0"),
    reviewerId: "00000000-0000-0000-0000-000000000002",
    reviewerName: "Curriculum owner",
    note: "September, Python year",
    publishedAt: new Date("2026-06-01").toISOString(),
  };
}

describe("a Python-era publication cannot approve the C++ curriculum", () => {
  it("reports the month as lapsed, not approved", () => {
    const state = approvalState(september(), [pythonEraRecord(1)]);
    expect(state.state, "an approval of different content is not an approval").toBe("lapsed");
  });

  it("names both hashes, so the reason is legible rather than a bare refusal", () => {
    const state = approvalState(september(), [pythonEraRecord(1)]);
    if (state.state !== "lapsed") throw new Error("expected lapsed");
    expect(state.approvedHash).not.toBe(state.currentHash);
    expect(state.currentHash).toBe(curriculumHash(september()));
  });

  it("stays lapsed for a row that is still live", () => {
    /* `PublicationRecord` has no `withdrawnAt`: the store filters withdrawn
       rows out before the policy sees them, so every record reaching
       `approvalState` is by definition a LIVE approval.

       That is what makes this test worth writing. All nine production rows are
       live today. If the gate depended on somebody having withdrawn them it
       would be open right now — it is closed because a hash of different
       content is a different hash, and nothing else. */
    expect(approvalState(september(), [pythonEraRecord(1)]).state).toBe("lapsed");
  });

  it("approves only an exact match against the current content", () => {
    const exact: PublicationRecord = {
      ...pythonEraRecord(1),
      curriculumHash: curriculumHash(september()),
    };
    expect(approvalState(september(), [exact]).state).toBe("approved");
  });

  it("is per month: approving one month approves no other", () => {
    /* A row carrying September's CURRENT hash but October's index must not
       approve either month — not September (wrong index) and not October
       (wrong hash). */
    const misfiled: PublicationRecord = {
      ...pythonEraRecord(2),
      curriculumHash: curriculumHash(september()),
    };
    const october = MONTHS.find((m) => m.index === 2)!;
    expect(approvalState(september(), [misfiled]).state).toBe("never_reviewed");
    expect(approvalState(october, [misfiled]).state).toBe("lapsed");
  });

  it("every current C++ month hash differs from every other", () => {
    /* Guards the premise the whole gate rests on: if two months hashed the
       same, one approval would open two. */
    const hashes = MONTHS.map((m) => curriculumHash(m));
    expect(new Set(hashes).size).toBe(MONTHS.length);
    for (const h of hashes) expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
