/**
 * Real output from the two compilers this course actually runs.
 *
 * Nothing here was typed from memory. Every string below was produced by
 * compiling the `source` beside it:
 *
 *   - the Clang half by running `clang++ -std=c++17` locally, which is the
 *     standard the browser passes explicitly (`src/lib/cpp17/worker.ts` sets
 *     `CPP_STANDARD = "-std=c++17"` into `clangCommonArgs`, and adds no `-W`
 *     flags at all);
 *   - the GCC half by POSTing the same source once to Judge0 with
 *     `language_id: 105` — GCC 14.1, `-O0`, defaults to `gnu++17`, and refuses
 *     `compiler_options` with HTTP 403, so no `-Wall` either. The text is the
 *     `compile_output` field of the response, verbatim.
 *
 * ## Why this file exists
 *
 * `schools/nova/diagnostics.ts` used to assert, as a fact about C++, that a
 * missing semicolon "is almost always at the END OF THE LINE ABOVE the line the
 * compiler names", and told Nova the fix was "usually one line earlier".
 *
 * That is a description of one compiler's habit. The pair below is the
 * counterexample, and it is not a hypothetical: it is the same eight-line
 * program, with one semicolon missing, compiled by both engines a learner can
 * reach from the same editor.
 *
 *     Clang  ->  line 4, the line that is actually missing the semicolon
 *     GCC    ->  line 5, the following line
 *
 * A learner who presses Run and then Submit sees two different line numbers for
 * one typo. Any rule of the form "subtract one" is wrong for one of them, and
 * the rule that was in the file was wrong for the browser — the engine that
 * produced the text they are staring at when they open the tutor panel.
 */

export interface CompilerOutputFixture {
  /** Which engine produced it, and under what flags. */
  readonly engine: "clang-8-browser" | "gcc-14.1-judge";
  /** How this text was obtained. Provenance, not decoration. */
  readonly provenance: string;
  /** The exact stderr / `compile_output`. */
  readonly text: string;
  /**
   * The 1-based source line this diagnostic's `file:line:col:` prefix names.
   *
   * Recorded so a test can assert the two engines DISAGREE without parsing.
   */
  readonly namesLine: number;
}

/**
 * The program. One semicolon missing, at the end of line 4.
 *
 * Line 4 is `int a = 5` — the defective line. Line 5 is the `if`, which is
 * correct C++ and is where GCC stops reading.
 */
export const MISSING_SEMICOLON_SOURCE = [
  "#include <iostream>", // 1
  "using namespace std;", // 2
  "int main() {", // 3
  "    int a = 5", // 4  <- the semicolon belongs here
  "    if (a > 3) {", // 5  <- and this line is correct
  "        cout << a;", // 6
  "    }", // 7
  "    return 0;", // 8
  "}", // 9
].join("\n");

/** The 1-based line that is genuinely unfinished. Neither engine is "right"; this is. */
export const MISSING_SEMICOLON_DEFECTIVE_LINE = 4;

/**
 * Clang names the defective line.
 *
 * Produced by `clang++ -std=c++17 -fno-color-diagnostics -c` on the source
 * above. Clang's recovery stops at the point the declaration should have
 * ended, so the caret is on line 4 — the line that is wrong.
 */
export const CLANG_MISSING_SEMICOLON: CompilerOutputFixture = {
  engine: "clang-8-browser",
  provenance: "clang++ -std=c++17, run locally on MISSING_SEMICOLON_SOURCE",
  namesLine: 4,
  text: [
    "decl.cpp:4:14: error: expected ';' at end of declaration",
    "    4 |     int a = 5",
    "      |              ^",
    "      |              ;",
    "1 error generated.",
  ].join("\n"),
};

/**
 * GCC names the FOLLOWING line.
 *
 * Returned by Judge0 `language_id: 105` for the same source, verbatim. GCC keeps
 * reading the declaration until it meets a token that cannot continue one — the
 * `if` on line 5 — and reports there. Line 5 is not wrong.
 */
export const GCC_MISSING_SEMICOLON: CompilerOutputFixture = {
  engine: "gcc-14.1-judge",
  provenance: "Judge0 language_id 105 (GCC 14.1, -O0), compile_output verbatim",
  namesLine: 5,
  text: [
    "main.cpp: In function 'int main()':",
    "main.cpp:5:5: error: expected ',' or ';' before 'if'",
    "    5 |     if (a > 3) {",
    "      |     ^~",
  ].join("\n"),
};

/** The pair, for tests that want to walk both engines over one defect. */
export const MISSING_SEMICOLON_BOTH_ENGINES: readonly CompilerOutputFixture[] = [
  CLANG_MISSING_SEMICOLON,
  GCC_MISSING_SEMICOLON,
];

/**
 * A second measured pair, kept because it fails a DIFFERENT way.
 *
 * Here the statement is `cout << a + b` with the `}` on the next line. Both
 * engines put the `file:line:col` prefix on line 6 — so on this program the
 * old "one line earlier" rule would have been wrong for BOTH of them, not just
 * for Clang — but GCC's message text still names a token from line 7.
 *
 * The point of keeping it: the offset is not merely different per compiler, it
 * is different per program on the SAME compiler. There is no constant to learn.
 */
export const TAIL_SEMICOLON_SOURCE = [
  "#include <iostream>", // 1
  "using namespace std;", // 2
  "int main() {", // 3
  "    int a, b;", // 4
  "    cin >> a >> b;", // 5
  "    cout << a + b", // 6  <- the semicolon belongs here
  "}", // 7
].join("\n");

export const CLANG_TAIL_SEMICOLON: CompilerOutputFixture = {
  engine: "clang-8-browser",
  provenance: "clang++ -std=c++17, run locally on TAIL_SEMICOLON_SOURCE",
  namesLine: 6,
  text: [
    "tail.cpp:6:18: error: expected ';' after expression",
    "    6 |     cout << a + b",
    "      |                  ^",
    "      |                  ;",
    "1 error generated.",
  ].join("\n"),
};

export const GCC_TAIL_SEMICOLON: CompilerOutputFixture = {
  engine: "gcc-14.1-judge",
  provenance: "Judge0 language_id 105 (GCC 14.1, -O0), compile_output verbatim",
  namesLine: 6,
  text: [
    "main.cpp: In function 'int main()':",
    "main.cpp:6:18: error: expected ';' before '}' token",
    "    6 |     cout << a + b",
    "      |                  ^",
    "      |                  ;",
    "    7 | }",
    "      | ~",
  ].join("\n"),
};

/**
 * Both engines finding the unclosed brace, and SAYING SO.
 *
 * Measured the same two ways. Kept because `unbalanced_braces` used to tell
 * Nova that "the reported line is almost never where the mistake is" — which
 * threw away the `note: to match this '{'` line that BOTH engines print and
 * that names the opening brace exactly (line 3 here).
 */
export const UNCLOSED_BRACE_SOURCE = [
  "#include <iostream>", // 1
  "using namespace std;", // 2
  "int main() {", // 3  <- this is the brace that is never closed
  "    int a = 5;", // 4
  "    if (a > 3) {", // 5
  "        cout << a;", // 6
  "    return 0;", // 7
  "}", // 8
].join("\n");

export const UNCLOSED_BRACE_OPENING_LINE = 3;

export const CLANG_UNCLOSED_BRACE: CompilerOutputFixture = {
  engine: "clang-8-browser",
  provenance: "clang++ -std=c++17, run locally on UNCLOSED_BRACE_SOURCE",
  namesLine: 8,
  text: [
    "brace.cpp:8:2: error: expected '}'",
    "    8 | }",
    "      |  ^",
    "brace.cpp:3:12: note: to match this '{'",
    "    3 | int main() {",
    "      |            ^",
    "1 error generated.",
  ].join("\n"),
};

export const GCC_UNCLOSED_BRACE: CompilerOutputFixture = {
  engine: "gcc-14.1-judge",
  provenance: "Judge0 language_id 105 (GCC 14.1, -O0), compile_output verbatim",
  namesLine: 8,
  text: [
    "main.cpp: In function 'int main()':",
    "main.cpp:8:2: error: expected '}' at end of input",
    "    8 | }",
    "      |  ^",
    "main.cpp:3:12: note: to match this '{'",
    "    3 | int main() {",
    "      |            ^",
  ].join("\n"),
};

/**
 * What the judge says about the three warning families: NOTHING.
 *
 * Measured, one submission, on a program containing all three of `if (a = b)`,
 * a read of an uninitialised `int`, and `"5" + 5`. Judge0 returned
 * `status: {"id": 3, "description": "Accepted"}` with `compile_output: null`.
 *
 * The reason is the flags, and they are not ours to change: GCC gates
 * `-Wparentheses` and `-Wuninitialized` behind `-Wall`, Judge0 compiles at
 * `-O0` with no `-Wall`, and `compiler_options` comes back 403 on this plan.
 * Clang in the browser has `-Wparentheses` and `-Wstring-plus-int` on by
 * default and so DOES report two of the three — but its `-Wuninitialized` is
 * also `-Wall`-gated, so that one is silent on both engines.
 *
 * This is recorded rather than acted on: it is a fact about which diagnostics
 * ever reach `recogniseDiagnostics`, not a defect in what it says about them.
 */
export const JUDGE_WARNING_SILENCE = {
  provenance: "Judge0 language_id 105, one submission; status Accepted, compile_output null",
  source: [
    "#include <iostream>",
    "using namespace std;",
    "int main() {",
    "    int a = 1, b = 2;",
    "    if (a = b) cout << \"yes\";",
    "    int c;",
    "    cout << c;",
    "    cout << \"5\" + 5;",
    "    return 0;",
    "}",
  ].join("\n"),
  /** Verbatim: the judge produced no compiler output at all. */
  compileOutput: "",
  /** Clang, same source, default flags — two of the three, and not the uninitialised read. */
  clangDefaultFlags: [
    "warn.cpp:5:11: warning: using the result of an assignment as a condition without parentheses [-Wparentheses]",
    "warn.cpp:8:17: warning: adding 'int' to a string does not append to the string [-Wstring-plus-int]",
    "2 warnings generated.",
  ].join("\n"),
} as const;
