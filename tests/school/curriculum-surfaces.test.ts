import { describe, expect, it } from "vitest";
import { PROGRAM } from "@schools/curriculum/program";
import { surfaceForBlock, trustSatisfies } from "@schools/execution/trust-policy";
import type { ExecutionSurface } from "@schools/execution/trust-policy";

/**
 * Every code block in the programme, and which half of the system may settle it.
 *
 * `surfaceForBlock` derives a surface from a block's id and type rather than
 * taking one from whatever component happens to be rendering it. That is the
 * design — a code task cannot be moved somewhere that quietly downgrades what
 * it requires — and it means the derivation is a piece of pattern matching over
 * ids that must actually be right about the real curriculum. A regex that
 * silently stopped matching `m1.pN` would move nine practice problems from
 * "needs the judge" to "a browser result will do", and nothing would fail.
 *
 * So this asserts against the authored content, not against invented ids.
 */

const CODE_BLOCKS = new Set(["write_code", "modify_code", "challenge", "verify"]);

function codeBlocksBySurface(): Map<ExecutionSurface, string[]> {
  const out = new Map<ExecutionSurface, string[]>();
  const add = (s: ExecutionSurface, id: string) => {
    if (!out.has(s)) out.set(s, []);
    out.get(s)!.push(id);
  };

  for (const month of PROGRAM.months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const b of lesson.blocks) {
          if (!CODE_BLOCKS.has(b.type)) continue;
          add(surfaceForBlock({ blockType: b.type, blockId: b.id, lessonId: lesson.id }), b.id);
        }
      }
    }
    for (const b of month.assessment?.blocks ?? []) {
      if (!CODE_BLOCKS.has(b.type)) continue;
      add(surfaceForBlock({ blockType: b.type, blockId: b.id, lessonId: "assessment" }), b.id);
    }
  }
  return out;
}

describe("what September's code blocks require", () => {
  const bySurface = codeBlocksBySurface();

  it("sends the monthly check to a surface the browser cannot settle", () => {
    const assessment = bySurface.get("assessment") ?? [];
    /* The three coding blocks of the 20-minute check. If this ever reaches
       zero, the check has stopped being derived as an assessment and a browser
       result would settle the thing the school is measured on. */
    expect(assessment.length).toBeGreaterThan(0);
    expect(assessment).toEqual(expect.arrayContaining(["m1.as.b1", "m1.as.b2"]));
    expect(trustSatisfies("assessment", "client_local")).toBe(false);
  });

  it("sends every independent-practice problem to the evidence surface", () => {
    const evidence = bySurface.get("independent_evidence") ?? [];
    /* `m1.p1`…`m1.p9` are what the approved programme counts toward its
       «~100 толық дербес шешім». Named individually rather than counted,
       because a count passes just as well when the regex matches the wrong
       nine things. */
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(evidence, `m1.p${n} must require the judge`).toContain(`m1.p${n}`);
    }
    /* The two lesson-8 challenges land here too, by block TYPE rather than by
       id — a challenge is a claim wherever it lives. */
    expect(evidence).toEqual(expect.arrayContaining(["m1.l8.b1", "m1.l8.b2"]));
    expect(trustSatisfies("independent_evidence", "client_local")).toBe(false);
  });

  it("leaves the teaching steps settleable in the browser", () => {
    const guided = bySurface.get("lesson_guided") ?? [];
    /* The payoff, and the reason the split is worth having at all: most of the
       month is a learner finding out whether their loop runs, and none of it
       needs to cost a sandbox slot. */
    expect(guided.length).toBeGreaterThan(10);
    expect(trustSatisfies("lesson_guided", "client_local")).toBe(true);
    /* And none of the ids that carry weight leaked into it. */
    for (const id of guided) {
      expect(id, "a practice problem must not be classified as guided").not.toMatch(/^m\d+\.p\d+/);
      expect(id, "an assessment block must not be classified as guided").not.toMatch(/\.as\./);
    }
  });

  it("classifies every code block in the programme, with nothing unreachable", () => {
    const all = [...bySurface.values()].flat();
    expect(all.length, "September has code tasks to classify").toBeGreaterThan(25);
    expect(new Set(all).size, "a block must land on exactly one surface").toBe(all.length);
  });
});
