import { describe, expect, it } from "vitest";
import { L, TEACHER_FAILURE_CLASS } from "@schools/presentation/labels";
import { SKILLS } from "@schools/curriculum/skills";
import { YEAR_ONE_LANGUAGE_LABEL } from "@schools/curriculum/source-of-truth";

/**
 * No string a human reads may name a construct from the old language.
 *
 * Every instance this exists for was found by a person reading a screen, not
 * by a gate — which is the whole problem. Typecheck, lint and 6600 tests were
 * all green while:
 *
 *   - the stdin hint told learners their input arrived through `input()`
 *   - the teacher skills grid offered «Условия if / elif / else»
 *   - a diagnostic said a learner «меняет местами // и %», where `//` is not
 *     integer division in C++ but the start of a comment
 *   - `true_division_returns_float` described the OPPOSITE misconception: in
 *     Python the surprise is that `/` yields a float, in C++ that it discards
 *     the fraction
 *
 * The last one is the reason this is a test and not a lint rule. A grep for
 * "Python" finds none of these; they are all correct-looking sentences that
 * happen to describe a language the course no longer teaches.
 *
 * Ids are deliberately NOT checked. `cond.if_elif_else`, `logic.and_or_not`
 * and `io.print` are auditable keys that the ledger and every stored attempt
 * are filed under, and `capability.ts` uses `stmt.elif` / `builtin.print` as a
 * live detector for an unmigrated vocabulary. Renaming them would be a data
 * migration wearing a cosmetic hat. The id is a name; the title is the claim.
 */

/** Spellings that are Python and have a different C++ spelling. */
const PYTHON_ONLY: { pattern: RegExp; why: string }[] = [
  { pattern: /\belif\b/, why: "C++ spells it `else if`" },
  { pattern: /\bprint\s*\(/, why: "C++ prints with `cout <<`" },
  { pattern: /\binput\s*\(\s*\)/, why: "C++ reads with `cin >>`" },
  { pattern: /\brange\s*\(/, why: "C++ has no `range()`" },
  { pattern: /\.append\s*\(/, why: "C++ uses `push_back`" },
  { pattern: /\bint\s*\(\s*\)/, why: "C++ has no `int()` conversion call" },
  { pattern: /\bdef\s+\w/, why: "a C++ function declares its return type" },
  { pattern: /(^|[\s(])\/\/([\s)]|$)/, why: "`//` is a COMMENT in C++, not integer division" },
  { pattern: /\bTypeError\b|\bNameError\b|\bZeroDivisionError\b|\bIndexError\b|\bRecursionError\b/,
    why: "C++ has no named exception for these" },
  { pattern: /\bPython\b|\bPython\b|\bПитон\b|\bпитон\b/, why: "the course teaches C++17" },
];

/** Walks a nested label tree and yields every string a human could read. */
function* strings(node: unknown, path = ""): Generator<{ path: string; text: string }> {
  if (typeof node === "string") {
    yield { path, text: node };
    return;
  }
  if (typeof node === "function" || node === null || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    yield* strings(v, path ? `${path}.${k}` : k);
  }
}

describe("no learner- or teacher-facing string names a Python construct", () => {
  /* BOTH exports, and the second one is the reason this list exists rather
     than a single walk of `L`. `TEACHER_FAILURE_CLASS` is a separate top-level
     export, and the first version of this test walked only `L` — so it passed
     while «меняет местами // и %» sat in the catalogue, which is exactly the
     string that motivated writing it. Caught by mutating the source and
     watching the test stay green. */
  const CATALOGUES: [string, unknown][] = [
    ["L", L],
    ["TEACHER_FAILURE_CLASS", TEACHER_FAILURE_CLASS],
  ];

  it("checks a meaningful number of strings, so a broken walk cannot pass", () => {
    expect([...strings(L)].length).toBeGreaterThan(200);
    expect([...strings(TEACHER_FAILURE_CLASS)].length).toBeGreaterThan(20);
  });

  it("the label catalogues are clean", () => {
    const offences: string[] = [];
    for (const [name, catalogue] of CATALOGUES) {
      for (const { path, text } of strings(catalogue)) {
        for (const { pattern, why } of PYTHON_ONLY) {
          if (pattern.test(text)) offences.push(`${name}.${path}: ${JSON.stringify(text)} — ${why}`);
        }
      }
    }
    expect(offences, `\n${offences.join("\n")}\n`).toEqual([]);
  });

  it("every skill title a teacher reads is clean", () => {
    const offences: string[] = [];
    for (const skill of SKILLS) {
      for (const loc of ["kk", "ru"] as const) {
        const text = skill.title[loc];
        for (const { pattern, why } of PYTHON_ONLY) {
          if (pattern.test(text)) offences.push(`${skill.id}.${loc}: ${JSON.stringify(text)} — ${why}`);
        }
      }
    }
    expect(offences, `\n${offences.join("\n")}\n`).toEqual([]);
  });

  it("the language the product names is the one the source of truth declares", () => {
    expect(YEAR_ONE_LANGUAGE_LABEL).toBe("C++17");
  });
});
