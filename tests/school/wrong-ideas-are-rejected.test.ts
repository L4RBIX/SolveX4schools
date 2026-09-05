import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock, Month } from "@schools/curriculum/types";

/**
 * A wrong idea must not be marked correct.
 *
 * ## The defect
 *
 * `m1.p7` — "two of three numbers are equal, print the odd one out" — declared
 * three cases, and every one of them expected `7`. So
 * `int main(){ std::cout << 7; }` passed all three: a program that reads
 * nothing, compares nothing, and demonstrates neither skill the task credits.
 * A September learner who wrote it was told they were right.
 *
 * `m1.l8.b2` — the wardrobe through the doorway — accepted
 * `if (a * b <= x * y)`, which passed 4/4 by comparing AREAS. The very next
 * block asks the learner to explain why both orientations have to be checked;
 * this one marked them correct for checking neither.
 *
 * Both were content, and both were invisible to every gate in the repository:
 * `content-execution` proves the reference solution passes its own cases, which
 * is a different claim and says nothing about what else does.
 *
 * ## What this checks
 *
 * The one wrong idea that can be caught statically, without running anything:
 * **a case set whose expected outputs are all identical is a case set a
 * constant passes.** It is not every wrong idea — `a*b <= x*y` needs a case
 * chosen against it, and that is authoring rather than a rule — but it is the
 * cheapest and the most embarrassing, and it was in the pilot's live month.
 */

interface Case {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface Graded {
  id: string;
  where: string;
  cases: Case[];
}

function gradedBlocks(): Graded[] {
  const out: Graded[] = [];
  const take = (where: string, block: { id?: string; cases?: Case[] }) => {
    if (typeof block.id !== "string") return;
    if (!Array.isArray(block.cases) || block.cases.length === 0) return;
    out.push({ id: block.id, where, cases: block.cases });
  };
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) take(lesson.id, block as unknown as { id?: string; cases?: Case[] });
      }
    }
    for (const block of month.assessment?.blocks ?? []) {
      take(month.assessment!.id, block as unknown as { id?: string; cases?: Case[] });
    }
    /* Practice tasks live beside the lessons and are graded by the same route.
       They are where `m1.p7` was, which is the reason this walk includes them. */
    const practice = (month as unknown as { practice?: { id?: string; cases?: Case[] }[] }).practice;
    for (const task of practice ?? []) take(`m${month.index}/practice`, task);
  }
  return out;
}

/**
 * The one block where a constant IS the task.
 *
 * `m1.l1.b5` is the first program of the year: the learner types
 * `cout << 7 * 8;` and there is nothing to read and nothing to branch on. A
 * gate that failed it would be a gate somebody switches off in week one.
 *
 * Named individually rather than covered by a rule about "month one" or "one
 * case", because an exemption that generalises is an exemption that grows.
 */
const CONSTANT_IS_THE_TASK = new Set(["m1.l1.b5"]);

describe("a program that ignores its input", () => {
  const blocks = gradedBlocks();

  it("is looking at the graded tasks", () => {
    /* The floor. A walk that found nothing would report a clean run having
       checked nothing, which is the shape of the gate this file replaces. */
    expect(blocks.length, "the programme's graded blocks").toBeGreaterThan(200);
    expect(blocks.map((b) => b.id)).toContain("m1.p7");
    expect(blocks.map((b) => b.id)).toContain("m1.l8.b2");
  });

  it("cannot pass any task by printing one constant", () => {
    const offenders = blocks
      .filter((b) => !CONSTANT_IS_THE_TASK.has(b.id))
      .filter((b) => new Set(b.cases.map((c) => c.expectedOutput.trim())).size === 1)
      .map((b) => `${b.id} (${b.where}): ${b.cases.length} cases, all expect ${JSON.stringify(b.cases[0]!.expectedOutput)}`);

    expect(
      offenders,
      `these tasks are passed by a program that reads nothing:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("keeps the one exemption honest", () => {
    /* If `m1.l1.b5` ever grows a second distinct output, the exemption is dead
       weight and should go — an allow-list nobody re-reads is how the next hole
       gets dug. */
    const b = blocks.find((x) => x.id === "m1.l1.b5");
    expect(b, "the exempted block must exist").toBeDefined();
    expect(
      new Set(b!.cases.map((c) => c.expectedOutput.trim())).size,
      "m1.l1.b5 now has more than one expected output — drop the exemption",
    ).toBe(1);
  });
});

describe("the two tasks this file was written for", () => {
  const byId = new Map(gradedBlocks().map((b) => [b.id, b]));

  it("m1.p7 rejects a constant, the third number, and the largest", () => {
    /* Each of those passed the original three cases. The assertions are on the
       IDEAS rather than on the case list, so an author who rewrites the cases
       has to keep them all dead. */
    const cases = byId.get("m1.p7")!.cases;
    const outs = cases.map((c) => c.expectedOutput.trim());
    expect(new Set(outs).size, "a constant passed all three").toBeGreaterThan(1);

    const third = cases.every((c) => c.input.trim().split(/\s+/)[2] === c.expectedOutput.trim());
    expect(third, "printing the third number passed every case").toBe(false);

    const largest = cases.every(
      (c) =>
        String(Math.max(...c.input.trim().split(/\s+/).map(Number))) === c.expectedOutput.trim(),
    );
    expect(largest, "printing the largest passed every case").toBe(false);
  });

  it("m1.l8.b2 rejects comparing areas", () => {
    /* `if (a * b <= x * y)` passed 4/4 — 10≤18, 10≤18, 49≤48, 9≤9 — on the task
       whose whole point is that a wardrobe can be turned. The next block asks
       the learner to explain why both orientations matter. */
    const cases = byId.get("m1.l8.b2")!.cases;
    const areaHeuristic = cases.every((c) => {
      const [a, b, x, y] = c.input.trim().split(/\s+/).map(Number) as [number, number, number, number];
      return (a * b <= x * y ? "yes" : "no") === c.expectedOutput.trim();
    });
    expect(areaHeuristic, "comparing areas still passes every case").toBe(false);

    /* And the real rule must still pass all of them — a case that breaks the
       heuristic by breaking the task would be worse than the defect. */
    const correct = cases.every((c) => {
      const [a, b, x, y] = c.input.trim().split(/\s+/).map(Number) as [number, number, number, number];
      return ((a <= x && b <= y) || (a <= y && b <= x) ? "yes" : "no") === c.expectedOutput.trim();
    });
    expect(correct, "the reference solution must pass its own cases").toBe(true);
  });
});

/** Kept for the type import to be load-bearing rather than decorative. */
export type _Blocks = LessonBlock | Month;
