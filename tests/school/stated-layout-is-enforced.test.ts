import { describe, expect, it } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import { isTask } from "@schools/curriculum/inventory";
import { checkOutput } from "@schools/exec/checker";

/**
 * A task that promises a layout must grade one.
 *
 * The default `token` checker tokenises on whitespace, which is right for most
 * tasks: whether the learner separated two numbers with a space or a newline is
 * not what any of them teach. It is wrong for the tasks whose prompt says «әр
 * жауап жеке жолда» — each answer on its own line. Eleven of those existed, and
 * a program printing everything on one line passed every one of them.
 *
 * `check-blocks` has always warned about a multi-line expectation under a token
 * checker. What it could not know is whether the PROMPT claimed a layout, which
 * is what turns a forgiving checker into a broken promise.
 */

/** Phrases a Kazakh or Russian prompt uses to promise a line layout. */
const CLAIMS_LAYOUT = /жеке жолда|әр жол|жолда шығар|отдельной строке|каждой строк|построчно/i;

describe("a prompt that promises a layout gets a checker that enforces one", () => {
  it("has tasks to check", () => {
    let n = 0;
    for (const m of MONTHS) for (const u of m.units) for (const l of u.lessons) n += l.blocks.length;
    expect(n).toBeGreaterThan(500);
  });

  it("never accepts flattened output where the prompt promised lines", () => {
    const broken: string[] = [];
    for (const month of MONTHS) {
      const all = [
        ...month.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks.map((b) => ({ b, l: l.id })))),
        ...(month.assessment?.blocks ?? []).map((b) => ({ b, l: month.assessment!.id })),
      ];
      for (const { b, l } of all) {
        const blk = b as unknown as Record<string, unknown>;
        if (!isTask(b) || !Array.isArray(blk.cases)) continue;
        const cases = blk.cases as { expectedOutput: string }[];
        const multi = cases.filter((c) => c.expectedOutput.includes("\n"));
        if (!multi.length) continue;

        const prompt = (blk.prompt as { kk?: string } | undefined)?.kk ?? "";
        if (!CLAIMS_LAYOUT.test(prompt)) continue;

        const checker = blk.checker as never;
        /* Would a program printing every line on ONE line still pass? */
        const flattenedPasses = multi.every((c) =>
          checkOutput(c.expectedOutput.split("\n").join(" "), c.expectedOutput, checker),
        );
        if (flattenedPasses) {
          broken.push(`${b.id} (${l}) promises a line layout and accepts it flattened`);
        }
      }
    }
    expect(broken, `\n${broken.map((x) => `  · ${x}`).join("\n")}\n`).toEqual([]);
  });
});
