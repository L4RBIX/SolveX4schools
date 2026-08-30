import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { isTask } from "@schools/curriculum/inventory";
import { classify, isProgramTask, rows } from "../../scripts/execution-classification";

/**
 * The classification is derived from the code that settles each block.
 *
 * It was twice derived from something else instead — first from whether the
 * answer is a program, which filed 263 machine-graded tasks under a human's
 * name, then from a list of `verify` modes, which missed `m1.as.b2` because it
 * is `verify:find_bug` and nobody expected that mode to carry cases.
 *
 * Both mistakes have the same shape: a label was read where a path should have
 * been traced. These assertions pin the paths.
 */

describe("every graded task is classified, exactly once", () => {
  const R = rows();

  it("covers every attempt block and nothing else", () => {
    let attempts = 0;
    for (const m of MONTHS) {
      for (const u of m.units) for (const l of u.lessons) attempts += l.blocks.filter(isTask).length;
      attempts += (m.assessment?.blocks ?? []).filter(isTask).length;
    }
    expect(R.length).toBe(attempts);
    expect(new Set(R.map((r) => r.blockId + r.lesson)).size).toBe(R.length);
  });

  it("asks what the submit route asks, not which verify mode it is", () => {
    /* `submit/route.ts:278`: a `verify` block is executed when it has cases,
       whatever its mode. Listing modes missed the one `verify:find_bug`. */
    for (const m of MONTHS) {
      for (const b of [...m.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)), ...(m.assessment?.blocks ?? [])]) {
        if (b.type !== "verify") continue;
        const cases = (b as unknown as { cases?: unknown[] }).cases ?? [];
        expect(isProgramTask(b), `${b.id} (${(b as { mode?: string }).mode})`).toBe(cases.length > 0);
      }
    }
  });

  it("puts every executed task in category 2 and gives it what a judge needs", () => {
    const server = R.filter((r) => r.klass === "2 SERVER_CODE_JUDGED");
    expect(server.length).toBeGreaterThanOrEqual(262);
    for (const r of server) {
      expect(r.cases, `${r.blockId} has no cases`).toBeGreaterThan(0);
      expect(r.reference, `${r.blockId} has no reference solution`).toBe(true);
    }
  });

  it("never calls a deterministic task human-reviewed", () => {
    /* The original defect, asserted directly: these six types are settled by
       `checkBlock` against a declared answer and must never need a teacher. */
    const DETERMINISTIC = ["prediction", "multiple_choice", "fill_blank", "reorder_code", "find_bug", "trace_code"];
    for (const r of R) {
      if (!DETERMINISTIC.includes(r.blockType)) continue;
      expect(r.klass, `${r.blockId} is ${r.blockType}`).toBe("1 DETERMINISTIC_AUTO_GRADED");
    }
  });

  it("requires a teacher only where nothing else can settle it", () => {
    for (const r of R.filter((x) => x.klass === "3 HUMAN_REVIEW_REQUIRED")) {
      expect(
        r.blockType === "explain" ||
          r.blockType === "verify:oral_explanation" ||
          r.blockType === "verify:manual_trace",
        `${r.blockId} is ${r.blockType} — why does it need a teacher?`,
      ).toBe(true);
      expect(r.cases, `${r.blockId} needs a teacher but carries cases`).toBe(0);
    }
  });

  it("classifies a verify block by its cases, so a new mode cannot slip through", () => {
    /* A mode nobody anticipated, carrying cases, must land in category 2. */
    const fake = {
      id: "fake.b1", type: "verify", mode: "some_future_mode",
      skillRefs: [], sourceType: "product-authored",
      prompt: { kk: "", ru: "" }, cases: [{ input: "1", expectedOutput: "1" }],
    } as unknown as Parameters<typeof classify>[0];
    expect(classify(fake, "m1.l1", false).klass).toBe("2 SERVER_CODE_JUDGED");
  });
});
