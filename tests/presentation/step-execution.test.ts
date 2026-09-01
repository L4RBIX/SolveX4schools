import { describe, expect, it } from "vitest";
import {
  buildStepProgram,
  type StepProgram,
} from "../../src/components/brilliant/lesson/blocks/step-execution";
import { L, t } from "../../schools/presentation/labels";

/**
 * The step visualiser, held to C++17's arithmetic rather than Python's.
 *
 * This is the block the programme calls «түсінудің басты құралы» — the main
 * instrument of understanding for September — so what it draws is not
 * decoration, it is a claim about what the machine does. Under Python that
 * claim was `//` and `%` on a four-line snippet. Under C++17 three separate
 * things about it changed, and each one is a number a learner can check on
 * their own screen with the Run button:
 *
 *   - `/` on two `int`s TRUNCATES toward zero. `Math.floor` agreed with Python
 *     and disagrees with C++ on every negative operand.
 *   - the program is not four lines, because four lines of C++ do not compile;
 *     a demonstration without `#include <iostream>` and `int main()` is not the
 *     program the learner has in their own editor.
 *   - `int` has an edge at 2^31−1 and crossing it is silent.
 *
 * The narration itself lives in `L.stepQuotient` / `L.stepRemainder` and is
 * asserted through `t()` rather than by string literal, so this file pins the
 * ARITHMETIC and the label catalogue stays free to reword.
 */

const built = (config: Record<string, unknown>): StepProgram => {
  const program = buildStepProgram(config);
  expect(program, `refused ${JSON.stringify(config)}`).not.toBeNull();
  return program as StepProgram;
};

const lines = (program: StepProgram): string[] => program.code.split("\n");

describe("the program on screen is a whole C++ program", () => {
  const program = built({ total: 17, groups: 5 });

  it("compiles as written: include, namespace, main, return, close", () => {
    /* Not a cosmetic preference. September's scaffold stages hand the learner
       this exact frame, already written, from lesson one — so a visualiser that
       shows a bare four-line body is showing a program that would not build if
       they pasted it into the editor two cards away. */
    expect(lines(program)).toEqual([
      "#include <iostream>",
      "using namespace std;",
      "",
      "int main() {",
      "    int n = 17;",
      "    int k = 5;",
      "    cout << n / k << endl;",
      "    cout << n % k << endl;",
      "    return 0;",
      "}",
    ]);
  });

  it("contains no Python", () => {
    for (const token of ["print(", "input(", "//", "def ", "elif"]) {
      expect(program.code, `still writes ${token}`).not.toContain(token);
    }
  });

  it("highlights the real line numbers, not the body's own count", () => {
    /* The frame is GIVEN, not taught, so it gets no step. The numbers still
       have to be the ones printed down the left of the code panel, or the
       highlight lands on `using namespace std;` while the panel says a
       variable was written. */
    expect(program.steps.map((s) => s.line)).toEqual([5, 6, 7, 8]);

    const src = lines(program);
    for (const step of program.steps) {
      expect(src[step.line - 1], `line ${step.line}`).toMatch(/^ {4}\S/);
    }
  });

  it("declares a type on every variable it shows", () => {
    /* `n = 17` was the whole truth in Python. In C++ the `int` is the reason
       the next line answers 3 and not 3.4, so the panel that shows the value
       has to show what it was declared as. */
    for (const step of program.steps) {
      for (const v of step.vars) expect(v.type, v.name).toBe("int");
    }
  });
});

describe("integer division is C++'s, not Python's", () => {
  it("truncates rather than floors", () => {
    /* Equal on the non-negative operands September actually uses — which is
       exactly why a floor left in place would never be caught by the content —
       and different everywhere else. The guard below keeps negatives out for a
       wording reason, so this asserts the rule directly. */
    expect(Math.trunc(-7 / 2)).toBe(-3);
    expect(Math.floor(-7 / 2)).toBe(-4);
    expect(-7 % 2).toBe(-1);
  });

  it.each([
    [17, 5, "3", "2"],
    [7, 2, "3", "1"],
    [10, 5, "2", "0"],
    [3, 4, "0", "3"],
    [0, 7, "0", "0"],
  ])("prints %i / %i as %s then %s", (total, groups, quotient, remainder) => {
    const program = built({ total, groups });
    const last = program.steps[program.steps.length - 1];
    expect(last.output).toEqual([quotient, remainder]);
  });

  it("narrates the same numbers it printed, in both languages", () => {
    const program = built({ total: 17, groups: 5 });
    const [, , divide, modulo] = program.steps;

    for (const locale of ["kk", "ru"] as const) {
      expect(t(divide.note, locale)).toBe(t(L.stepQuotient(17, 5, 3), locale));
      expect(t(modulo.note, locale)).toBe(t(L.stepRemainder(17, 5, 2), locale));
    }
  });
});

describe("what it refuses to draw, and why each one is refused", () => {
  it("refuses a zero divisor, because C++ has no defined behaviour to show", () => {
    /* Python raised `ZeroDivisionError` — a definite thing, drawable. C++
       leaves division by zero UNDEFINED: the program may print anything, print
       nothing, or not finish. There is no honest trace of it. */
    expect(buildStepProgram({ total: 17, groups: 0 })).toBeNull();
    expect(buildStepProgram({ total: 17, groups: -5 })).toBeNull();
  });

  it("refuses a value an `int` cannot hold", () => {
    /* The rendered program says `int n`. Drawing a value outside the 32-bit
       signed range beside that declaration would be the silent overflow the
       pedagogy's audit rule exists to forbid. */
    expect(buildStepProgram({ total: 2147483647, groups: 7 })).not.toBeNull();
    expect(buildStepProgram({ total: 2147483648, groups: 7 })).toBeNull();
    expect(buildStepProgram({ total: 17, groups: 2147483648 })).toBeNull();
  });

  it("refuses anything that is not a whole number", () => {
    for (const config of [
      {},
      { total: 17 },
      { groups: 5 },
      { total: 1.5, groups: 5 },
      { total: "many", groups: 5 },
      { total: 17, groups: null },
    ]) {
      expect(buildStepProgram(config), JSON.stringify(config)).toBeNull();
    }
  });

  it("reads a whole number written as a string, because config is untyped", () => {
    const program = built({ total: "17", groups: "5" });
    expect(program.steps[program.steps.length - 1].output).toEqual(["3", "2"]);
  });
});
