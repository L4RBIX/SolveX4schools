import { describe, it, expect } from "vitest";
import { findBlock, gradeBlock, toLearningVerdictName } from "@schools/learning/grade";
import { MONTHS } from "@schools/curriculum/months";
import { ATTEMPT_BLOCK_TYPES } from "@schools/curriculum/types";

/**
 * Server-side grading, and the rules it must never relax.
 */

describe("curriculum lookup", () => {
  it("finds every authored block by id", () => {
    let checked = 0;
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const block of lesson.blocks) {
            expect(findBlock(block.id), `${block.id} must be findable`).not.toBeNull();
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(30);
  });

  it("refuses an unknown block rather than guessing", () => {
    expect(findBlock("m9.l99.b99")).toBeNull();
  });
});

describe("attribution", () => {
  it("attributes only where the author declared the answer unambiguous", () => {
    const target = findBlock("m1.l1.b2")!;
    const declared = gradeBlock(target, { kind: "option", id: "4" });
    expect(declared.result.failureClass).toBe("string_vs_number_confusion");

    const undeclared = gradeBlock(target, { kind: "option", id: '"2 + 2"' });
    expect(undeclared.result.verdict).toBe("wrong");
    /* No mapping means no claim. The pipeline records an unattributed failure
       and the engine answers DIAGNOSE — ask, do not assert. */
    expect(undeclared.result.failureClass).toBeUndefined();
  });

  it("every declared mapping carries a written justification", () => {
    // The justification is the review artefact. A mapping without one is a
    // guess about a child's mind wearing the costume of evidence.
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const block of lesson.blocks) {
            for (const [answer, entry] of Object.entries(block.diagnosticMapping ?? {})) {
              expect(
                entry.justification.trim().length,
                `${block.id} → "${answer}" needs a real justification`,
              ).toBeGreaterThan(20);
            }
          }
        }
      }
    }
  });
});

describe("the unmeasured rule", () => {
  it("assigns NO skill to an ungraded block", () => {
    // One line from being "simplified" away, and if it is, every explanation,
    // reflection and sandbox-down code task becomes an attempt with zero
    // solves — and the dashboard tells a child they are struggling at work
    // nobody marked.
    const explain = findBlock("m1.l6.b4")!;
    const graded = gradeBlock(explain, { kind: "text", value: "because of the quotes" });
    expect(graded.result.verdict).toBe("unknown");
    expect(graded.primarySkill).toBeNull();
  });

  it("emits no verdict name for an unmeasured result", () => {
    expect(toLearningVerdictName("unknown")).toBeNull();
  });

  it("maps partial onto wrong_answer, never onto accepted", () => {
    expect(toLearningVerdictName("partial")).toBe("wrong_answer");
    expect(toLearningVerdictName("correct")).toBe("accepted");
  });
});

describe("primary skill", () => {
  it("is the FIRST skillRef, and every attempt block declares at least one", () => {
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const block of lesson.blocks) {
            if (!ATTEMPT_BLOCK_TYPES.has(block.type)) continue;
            expect(
              block.skillRefs.length,
              `${block.id} produces evidence with nowhere to send it`,
            ).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
