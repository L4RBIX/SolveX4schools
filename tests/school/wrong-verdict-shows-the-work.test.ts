import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MONTHS } from "@schools/curriculum/months";
import { secretStringsOf } from "@schools/curriculum/public";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * A wrong code verdict has to show the learner something to act on.
 *
 * ## The screen this replaces
 *
 * Measured in Chromium, printing `55` for "7 * 8": the card said
 * «Әзірге дұрыс емес… «Көмек» түймесін бас» — not right yet, press Help — and
 * that was all of it. No input, no expected output, and not even the learner's
 * own output. The editor and the Run button were greyed out in the same frame.
 *
 * So the one screen where a fourteen-year-old most needs to change something
 * and try it was the one screen where they could not, and the one moment they
 * most need a comparison was the one moment they were given none. The loop the
 * whole lesson is built on had no hinge.
 *
 * ## The thing that makes this safe
 *
 * VISIBLE cases only. A visible case's input and expected output are already in
 * the page props — `public.ts` sends them and the block renders them — so
 * returning them beside the run adds nothing a learner could not already read.
 * A HIDDEN case's pairing of input to output IS the measurement, and it stays
 * a count.
 *
 * That is the assertion this file exists for: the new response must not become
 * a second route for the answer key, which is the mistake C1 was.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("the submit route's per-case feedback", () => {
  const route = read("src/app/api/learning/submit/route.ts");

  it("is built from visible cases only", () => {
    /* Asserted on the filter itself. The value of this check is that it is
       impossible to add hidden cases to the response without deleting a line
       whose only purpose is to exclude them. */
    const built = route.slice(route.indexOf("visibleCases = results"));
    expect(built.slice(0, 400)).toContain("filter((r) => !r.hidden)");
  });

  it("bounds what it sends", () => {
    /* A block with eighteen visible cases would otherwise put its whole fixture
       in every reply, and a runaway loop prints megabytes. */
    expect(route).toContain("MAX_VISIBLE_CASE_FEEDBACK");
    expect(route).toContain("MAX_CASE_TEXT");
  });

  it("returns the field the player reads", () => {
    expect(route).toMatch(/visibleCases,/);
  });
});

describe("what a visible case can reveal", () => {
  /**
   * The C1 test, applied to this new surface.
   *
   * `secretStringsOf` is the same collector `payload-privacy` and the built-
   * bundle scan use, so all three agree about what a secret is. If a visible
   * case's input or expected output were ever a withheld string, sending it
   * back with the verdict would be a second route to the answer key.
   */
  it("never carries a string the curriculum withholds", () => {
    const offenders: string[] = [];
    const visit = (where: string, block: LessonBlock) => {
      const cases = (block as unknown as { cases?: { input: string; expectedOutput: string; hidden?: boolean }[] })
        .cases;
      if (!Array.isArray(cases)) return;
      const secrets = new Set(secretStringsOf(block));
      if (secrets.size === 0) return;
      for (const c of cases.filter((x) => !x.hidden)) {
        if (secrets.has(c.input)) offenders.push(`${where}/${block.id}: visible input is withheld`);
        if (secrets.has(c.expectedOutput)) {
          offenders.push(`${where}/${block.id}: visible expected output is withheld`);
        }
      }
    };

    let seen = 0;
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const block of lesson.blocks) {
            seen += 1;
            visit(lesson.id, block);
          }
        }
      }
      for (const block of month.assessment?.blocks ?? []) {
        seen += 1;
        visit(month.assessment!.id, block);
      }
    }

    expect(seen, "the walk must find the blocks").toBeGreaterThan(600);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("the editor after a wrong verdict", () => {
  const blocks = read("src/components/brilliant/lesson/blocks/index.tsx");

  it("stays live on a code task", () => {
    /*
     * `locked(verdict)` is `verdict !== "unchecked"`, so a wrong Check greyed
     * the editor and disabled Run. `editorLocked` excludes `wrong` and
     * `partial`, which are precisely the two verdicts that mean "try again".
     */
    const view = blocks.slice(blocks.indexOf("function CodeTaskView("));
    expect(view).toContain("const editorLocked =");
    expect(view.slice(0, 3000)).toMatch(/verdict !== "wrong" && verdict !== "partial"/);
  });

  it("still locks on a correct one", () => {
    /* Settled work is settled. Editing it afterwards would produce a screen
       that disagrees with the ledger. */
    const view = blocks.slice(blocks.indexOf("function CodeTaskView("));
    expect(view.slice(0, 3000)).toContain("locked(verdict) &&");
  });

  it("does not unlock a quiz", () => {
    /* A multiple-choice block that unlocked on a wrong answer would let a
       learner walk the options. The reveal policy — three attempts, then the
       answer — is what models that instead, and it is server-side. */
    const optionView = blocks.slice(blocks.indexOf("function OptionList("));
    expect(optionView.slice(0, 2000)).not.toContain("editorLocked");
  });
});

describe("the comparison the learner is shown", () => {
  const blocks = read("src/components/brilliant/lesson/blocks/index.tsx");

  it("puts their output beside the expectation, on the case that failed", () => {
    const table = blocks.slice(blocks.indexOf("function CaseTable("), blocks.indexOf("function MarkingPoints("));
    expect(table).toContain("yourOutput");
    /* Only where it differs: repeating a correct answer under itself is noise,
       and the whole value of the row is the comparison on the failing case. */
    expect(table).toContain("got && !got.passed");
    /* Matched by INPUT, not by index — the server caps how many results it
       returns, and an index match would put one case's output beside another's
       expectation, which is worse than showing nothing. */
    expect(table).toContain("byInput");
  });

  it("has a word for a program that printed nothing", () => {
    /* An empty cell reads as "the platform did not tell me", and printing
       nothing is a specific, common bug: a missing `cout`, or a `cin` that ate
       the line. */
    const labels = read("schools/presentation/labels.ts");
    expect(labels).toContain("yourOutputEmpty");
    expect(blocks).toContain("yourOutputEmpty");
  });
});
