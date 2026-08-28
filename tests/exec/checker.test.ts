import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  CheckerAuthoringError,
  DEFAULT_CHECKER,
  checkOutput,
  checkerProblem,
  type OutputChecker,
} from "@schools/exec/checker";
import { MONTHS, MONTH_BY_INDEX } from "../../schools/curriculum/months";
import type { LessonBlock } from "../../schools/curriculum/types";

/**
 * Output checking.
 *
 * Every assertion below is a rule a task author is entitled to rely on, so they
 * are written as the author would state them: this output, that key, this
 * checker, pass or fail. The pairs are small on purpose — the failure mode this
 * whole module exists to kill was a comparison nobody could state in a sentence.
 */

const EXACT: OutputChecker = { kind: "exact" };
const TOKEN: OutputChecker = { kind: "token" };

describe("the default", () => {
  it("is token, and is what an undeclared block gets", () => {
    expect(DEFAULT_CHECKER).toEqual({ kind: "token" });
    // Same call, one with the argument and one without: the default is resolved
    // in the module, not re-stated by each caller.
    expect(checkOutput("1  2", "1 2")).toBe(true);
    expect(checkOutput("1  2", "1 2", DEFAULT_CHECKER)).toBe(true);
  });
});

describe("trailing newline", () => {
  /* Python's `print` ends every program with one and no author writes it into
     the key, so this is the difference between the language and the answer. */
  it("is ignored by every kind", () => {
    expect(checkOutput("42\n", "42", EXACT)).toBe(true);
    expect(checkOutput("42\n", "42", TOKEN)).toBe(true);
    expect(checkOutput("42\n", "42", { kind: "numeric", absoluteTolerance: 0.001 })).toBe(true);
  });

  it("is ignored however many there are, and with \\r\\n", () => {
    expect(checkOutput("42\n\n\n", "42", EXACT)).toBe(true);
    expect(checkOutput("42\r\n", "42", EXACT)).toBe(true);
  });
});

describe("trailing spaces", () => {
  /* THE difference between exact and everything else, and the reason `exact`
     cannot be the default: this is a program that is arithmetically right. */
  it("fail under exact — it printed a space, and exact means the printing is the answer", () => {
    expect(checkOutput("42 ", "42", EXACT)).toBe(false);
    expect(checkOutput("42  \n", "42\n", EXACT)).toBe(false);
  });

  it("pass under token", () => {
    expect(checkOutput("42 ", "42", TOKEN)).toBe(true);
    expect(checkOutput("42  \n", "42\n", TOKEN)).toBe(true);
  });
});

describe("internal whitespace", () => {
  it("is accepted by token and rejected by exact", () => {
    expect(checkOutput("1  2   3", "1 2 3", TOKEN)).toBe(true);
    expect(checkOutput("1  2   3", "1 2 3", EXACT)).toBe(false);

    // A tab is whitespace too, and a learner who used one is not wrong about loops.
    expect(checkOutput("1\t2", "1 2", TOKEN)).toBe(true);
    expect(checkOutput("1\t2", "1 2", EXACT)).toBe(false);
  });

  it("includes the line break, which is why a layout task needs exact", () => {
    /* Under `token` a learner may print the three numbers down the page and
       pass a key that runs across it. That is the cost of the default and it is
       accepted knowingly: the alternative marks children wrong for a space. An
       author whose task is about the shape of the output declares `exact`. */
    expect(checkOutput("1\n2\n3", "1 2 3", TOKEN)).toBe(true);
    expect(checkOutput("1\n2\n3", "1 2 3", EXACT)).toBe(false);
  });
});

describe("token VALUES", () => {
  it("differ — every kind rejects, whitespace has nothing to do with it", () => {
    for (const checker of [EXACT, TOKEN, { kind: "numeric", absoluteTolerance: 0.5 } as const]) {
      expect(checkOutput("41", "42", checker)).toBe(false);
      expect(checkOutput("1 2 4", "1 2 3", checker)).toBe(false);
      expect(checkOutput("no", "yes", checker)).toBe(false);
    }
  });

  it("are missing or extra — a count mismatch fails", () => {
    expect(checkOutput("1 2", "1 2 3", TOKEN)).toBe(false);
    expect(checkOutput("1 2 3 4", "1 2 3", TOKEN)).toBe(false);
    // And joining two tokens into one is a different answer, not spacing.
    expect(checkOutput("123", "1 2 3", TOKEN)).toBe(false);
  });
});

describe("multi-line output", () => {
  const key = "1\n4\n9\n16";

  it("passes when it matches", () => {
    expect(checkOutput("1\n4\n9\n16\n", key, EXACT)).toBe(true);
    expect(checkOutput("1\n4\n9\n16\n", key, TOKEN)).toBe(true);
  });

  it("fails on a wrong line under both kinds", () => {
    expect(checkOutput("1\n4\n9\n15\n", key, EXACT)).toBe(false);
    expect(checkOutput("1\n4\n9\n15\n", key, TOKEN)).toBe(false);
  });

  it("fails on a missing line under both kinds", () => {
    expect(checkOutput("1\n4\n9\n", key, EXACT)).toBe(false);
    expect(checkOutput("1\n4\n9\n", key, TOKEN)).toBe(false);
  });

  it("keeps blank lines under exact and drops them under token", () => {
    expect(checkOutput("1\n\n4", "1\n4", EXACT)).toBe(false);
    expect(checkOutput("1\n\n4", "1\n4", TOKEN)).toBe(true);
  });
});

describe("empty output against whitespace-only output", () => {
  it("is a pass under token — both are zero tokens", () => {
    expect(checkOutput("", "", TOKEN)).toBe(true);
    expect(checkOutput("   \n  \n", "", TOKEN)).toBe(true);
    expect(checkOutput("", "  ", TOKEN)).toBe(true);
  });

  it("is a fail under exact once the whitespace is not newlines", () => {
    expect(checkOutput("", "", EXACT)).toBe(true);
    // Newlines only: still the language, still removed.
    expect(checkOutput("\n\n", "", EXACT)).toBe(true);
    // Spaces: the program printed something.
    expect(checkOutput("   ", "", EXACT)).toBe(false);
    expect(checkOutput("", "   ", EXACT)).toBe(false);
  });

  it("does not make a program that prints nothing pass a real key", () => {
    // The thing that would actually be dangerous about treating empty leniently.
    expect(checkOutput("", "42", TOKEN)).toBe(false);
    expect(checkOutput("\n \n", "42", TOKEN)).toBe(false);
  });
});

describe("numeric", () => {
  const ABS: OutputChecker = { kind: "numeric", absoluteTolerance: 1e-6 };
  const REL: OutputChecker = { kind: "numeric", relativeTolerance: 1e-3 };

  it("accepts a difference inside the declared absolute tolerance", () => {
    expect(checkOutput("0.3333334", "0.3333333", ABS)).toBe(true);
    expect(checkOutput("2.0000005", "2.0", ABS)).toBe(true);
  });

  it("rejects one outside it — the tolerance is a limit, not a shrug", () => {
    expect(checkOutput("0.3334", "0.3333333", ABS)).toBe(false);
    expect(checkOutput("2.01", "2.0", ABS)).toBe(false);
  });

  it("scales with the answer when the tolerance is relative", () => {
    // 0.05% of a million is 500, and 0.05% of 2 is 0.001. Same checker.
    expect(checkOutput("1000500", "1000000", REL)).toBe(true);
    expect(checkOutput("1002000", "1000000", REL)).toBe(false);
    expect(checkOutput("2.001", "2", REL)).toBe(true);
    expect(checkOutput("2.01", "2", REL)).toBe(false);
  });

  it("passes a token on EITHER tolerance when both are declared", () => {
    const both: OutputChecker = {
      kind: "numeric",
      absoluteTolerance: 0.5,
      relativeTolerance: 1e-9,
    };
    // Absolute saves it near zero, where a relative tolerance is meaningless.
    expect(checkOutput("0.4", "0", both)).toBe(true);
  });

  it("compares the words around the numbers exactly", () => {
    expect(checkOutput("Area: 3.14", "Area: 3.1400001", ABS)).toBe(true);
    expect(checkOutput("Areo: 3.14", "Area: 3.14", ABS)).toBe(false);
  });

  it("treats `nan` and `inf` as text, because a task printing them means the text", () => {
    expect(checkOutput("inf", "inf", ABS)).toBe(true);
    expect(checkOutput("inf", "1e400", ABS)).toBe(false);
    expect(checkOutput("nan", "nan", ABS)).toBe(true);
    // `nan == nan` is false as a number; as the string Python printed it is not.
    expect(checkOutput("nan", "0.0", ABS)).toBe(false);
  });

  it("still ignores whitespace, like token — it IS token plus a rule about numbers", () => {
    expect(checkOutput("1.0   2.0", "1 2", ABS)).toBe(true);
    expect(checkOutput("1.0 2.0", "1 2 3", ABS)).toBe(false);
  });
});

describe("-0.0 against 0.0", () => {
  /* Python prints `-0.0` for a good many innocent expressions (`-1 * 0.0`,
     `round(-0.4)` in some formulations). Whether that is a wrong answer is a
     question about the task, so the checkers answer it differently and both
     answers are declared, not inferred. */
  it("is a different string, so token and exact reject it", () => {
    expect(checkOutput("-0.0", "0.0", TOKEN)).toBe(false);
    expect(checkOutput("-0.0", "0.0", EXACT)).toBe(false);
  });

  it("is the same number, so numeric accepts it — the difference is exactly zero", () => {
    expect(checkOutput("-0.0", "0.0", { kind: "numeric", absoluteTolerance: 0 })).toBe(true);
    expect(checkOutput("-0.0", "0.0", { kind: "numeric", relativeTolerance: 0 })).toBe(true);
    expect(checkOutput("-0.000000", "0", { kind: "numeric", absoluteTolerance: 1e-9 })).toBe(true);
  });
});

describe("a numeric checker with no tolerance", () => {
  /* The single most important assertion in this file. There is no global
     default tolerance, so this checker cannot grade anything — and the failure
     must be OURS and loud, never a quiet pass or a quiet fail attached to a
     child's attempt. */
  const NO_TOLERANCE = { kind: "numeric" } as OutputChecker;

  it("is an authoring error the validator can report", () => {
    expect(checkerProblem(NO_TOLERANCE)).toMatch(/no tolerance/);
    expect(checkerProblem(TOKEN)).toBeNull();
    expect(checkerProblem(EXACT)).toBeNull();
    expect(checkerProblem({ kind: "numeric", absoluteTolerance: 1e-9 })).toBeNull();
  });

  it("throws rather than passing, even on output that is byte-identical", () => {
    expect(() => checkOutput("42", "42", NO_TOLERANCE)).toThrow(CheckerAuthoringError);
    expect(() => checkOutput("42", "42", NO_TOLERANCE)).toThrow(/no tolerance/);
  });

  it("throws rather than failing, so nobody is marked wrong for our bug", () => {
    // Both directions matter: a silent `false` here marks a correct learner
    // wrong, which is the exact harm the throw exists to prevent.
    expect(() => checkOutput("41", "42", NO_TOLERANCE)).toThrow(CheckerAuthoringError);
  });

  it("rejects a tolerance that is not a usable number", () => {
    expect(checkerProblem({ kind: "numeric", absoluteTolerance: -1 })).toMatch(/negative/);
    expect(checkerProblem({ kind: "numeric", relativeTolerance: Number.NaN })).toMatch(/finite/);
    expect(checkerProblem({ kind: "numeric", absoluteTolerance: Infinity })).toMatch(/finite/);
  });
});

/* -------------------------------------------------------------------------- */
/* The declaration has to reach the judge                                     */
/* -------------------------------------------------------------------------- */

/**
 * A checker on a block is worth nothing unless the grading path passes it.
 *
 * `runCases` takes the checker as its fourth argument and defaults it to
 * `token`. The submit route currently calls it with three, which is correct
 * TODAY for one reason only: no block in the programme declares a checker, so
 * every task is a `token` task and the default is the block's own declaration.
 *
 * The moment an author writes the first `{ kind: "exact" }` that stops being
 * true, and it stops being true SILENTLY — the block would say one thing and
 * the learner would be graded by another, which is the entire class of bug this
 * module exists to end. So the assertion is conditional on the content: as soon
 * as a checker is declared anywhere, the route must be passing it, and until
 * then this test states the debt out loud rather than leaving it in a comment.
 *
 * The fix, when that day comes, is one argument:
 *   `await runCases(provider, answer.value, codeBlock.cases ?? [], codeBlock.checker)`
 */
describe("the block's declaration reaches the grading path", () => {
  const ROUTE = "src/app/api/learning/submit/route.ts";

  const declared = MONTHS.flatMap((month) => [
    ...month.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
    ...(month.assessment?.blocks ?? []),
  ]).filter((block) => "checker" in block && block.checker);

  it("is not needed yet, because nothing declares a checker", () => {
    expect(declared.map((b) => b.id)).toEqual([]);
  });

  it("is passed by the submit route as soon as anything does", () => {
    if (declared.length === 0) return;
    const route = readFileSync(ROUTE, "utf8");
    expect(
      /runCases\([\s\S]{0,200}?codeBlock\.checker/.test(route),
      `${declared.map((b) => b.id).join(", ")} declare a checker, but ${ROUTE} still grades ` +
        `with the default — pass codeBlock.checker to runCases`,
    ).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* September is frozen, and the default must not have moved under it          */
/* -------------------------------------------------------------------------- */

describe("September still passes under the default checker", () => {
  const september = MONTH_BY_INDEX.get(1)!;

  const casedBlocks: { id: string; block: LessonBlock }[] = [];
  for (const unit of september.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) casedBlocks.push({ id: block.id, block });
    }
  }
  for (const block of september.assessment?.blocks ?? []) casedBlocks.push({ id: block.id, block });

  const withCases = casedBlocks.filter(
    (b) => "cases" in b.block && Array.isArray(b.block.cases) && b.block.cases.length > 0,
  );

  it("finds September's graded tasks", () => {
    // Guard against a refactor that makes everything below vacuously true.
    expect(withCases.length).toBeGreaterThan(10);
  });

  it("declares no checker anywhere — the frozen month is governed by the default", () => {
    /* `docs/releases/SEPTEMBER_V1_FREEZE.md`. The month was not edited to make
       this feature work; if it ever is, this test says so out loud rather than
       letting the freeze quietly lapse. */
    for (const { id, block } of withCases) {
      expect("checker" in block ? block.checker : undefined, `${id} declares a checker`).toBeUndefined();
    }
  });

  it("accepts every expected output as its own answer, with and without Python's newline", () => {
    for (const { id, block } of withCases) {
      const cases = (block as { cases: { input: string; expectedOutput: string }[] }).cases;
      for (const c of cases) {
        expect(checkOutput(c.expectedOutput, c.expectedOutput), `${id}`).toBe(true);
        expect(checkOutput(`${c.expectedOutput}\n`, c.expectedOutput), `${id}`).toBe(true);
      }
    }
  });

  /**
   * The compatibility argument, stated as a property.
   *
   * The rule being replaced was `a.replace(/\s+$/,"") === b.replace(/\s+$/,"")`.
   * `token` accepts a superset of it: if two strings are equal after trailing
   * whitespace is removed then they have the same tokens in the same order, so
   * anything the old rule passed the new default passes too. That is why the
   * default could be turned on under frozen content without touching it — and
   * it is checked here against September's real keys rather than asserted in a
   * comment.
   *
   * The complementary half — that September's reference SOLUTIONS still pass
   * when actually executed — is `tests/school/content-execution.test.ts`, which
   * runs them through this same function.
   */
  it("accepts everything the rule it replaced accepted", () => {
    const legacy = (a: string, b: string) => a.replace(/\s+$/, "") === b.replace(/\s+$/, "");

    for (const { id, block } of withCases) {
      const cases = (block as { cases: { input: string; expectedOutput: string }[] }).cases;
      for (const c of cases) {
        const key = c.expectedOutput;
        const candidates = [key, `${key}\n`, `${key}   `, `${key}\n\n`, `${key} \n`, key.trim()];
        for (const candidate of candidates) {
          if (!legacy(candidate, key)) continue;
          expect(
            checkOutput(candidate, key),
            `${id}: the old comparison passed ${JSON.stringify(candidate)} and the default does not`,
          ).toBe(true);
        }
      }
    }
  });
});
