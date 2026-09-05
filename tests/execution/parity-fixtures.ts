import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock } from "@schools/curriculum/types";
import type { LocalExecutionStatus } from "@schools/execution/trust";
import type { ExecutionStatus } from "@schools/exec/provider";

/**
 * The programs both engines must agree about.
 *
 * ## The assumption this table exists to stop being an assumption
 *
 * Hybrid execution rests on one sentence: **the same program produces the same
 * result in the browser and on the judge.** Where that is false a learner reads
 * one thing off the Run pane and is graded on another, and the gap is invisible
 * from inside the product — the failing case is hidden by design, so "it worked
 * when I pressed Run" is the only symptom anyone gets.
 *
 * ## What is EXECUTED here, and what is only DECLARED
 *
 * The server column is executed: every program below is compiled and run, and
 * its status and stdout are asserted. The local column is **declared** — the
 * browser engine is 57.5 MB of WebAssembly clang reached over `fetch` through
 * an ABI node cannot drive, so it is not runnable in a test process at all. See
 * `tests/execution/engines.ts` for the full reason.
 *
 * That makes this table weaker than its Python predecessor, which really did
 * run both engines, and the weakness is stated rather than papered over. What
 * the local column still buys: it keeps the two status vocabularies related, so
 * `CATEGORY_PAIRS` is checked for totality and consistency, and it records what
 * the browser is SUPPOSED to do so that a future two-engine suite has a table
 * to run rather than one to invent. `docs/cpp17/CPP17_JUDGE_PARITY.md` lists
 * that suite as still-to-do and carries the manual pass that is currently the
 * only evidence the engines agree.
 *
 * ## Why the programs are taken out of the curriculum
 *
 * A parity table of toy programs proves parity for toy programs. Nearly every
 * fixture below is a September `referenceSolution` verbatim, or a mutation of
 * one in a way a fourteen-year-old actually mutates it — a dropped semicolon, a
 * typo'd variable, an input the case set never covers. The `provenance` field is
 * checked against `MONTHS` at test time, so a fixture cannot quietly drift away
 * from the content it claims to be about.
 *
 * ## The row that matters most
 *
 * `negative-integer-division`. C++ truncates toward zero: `-7 / 2` is `-3` and
 * `-7 % 2` is `-1`. Python floors: `-4` and `1`. Every September task carried
 * over from the Python curriculum had to be re-checked against that rather than
 * translated, and it is the single most likely way a task's expected output
 * became quietly wrong. It is measured identical on both engines — that is in
 * the parity document — and it is pinned here.
 *
 * ## This file is test-only
 *
 * It reads hidden case inputs out of the curriculum and embeds a few of them as
 * fixture stdin. That is safe here for the same reason
 * `tests/school/payload-privacy.test.ts` may name `5 100`: nothing under
 * `tests/` is bundled, imported by a route, or served. Nothing in this file may
 * ever be imported from `src/`.
 */

/* -------------------------------------------------------------------------- */
/* Provenance                                                                 */
/* -------------------------------------------------------------------------- */

export type Provenance =
  /** The block's own solution, byte for byte. Asserted, not trusted. */
  | { kind: "verbatim"; blockId: string }
  /** That solution, changed in a named way a learner would change it. */
  | { kind: "derived"; blockId: string; how: string }
  /** No September program does this. The reason is required. */
  | { kind: "synthesised"; why: string };

/**
 * What both engines are expected to do with one program.
 *
 * `stdout` is `null` when the output is not the point (an output bomb, a
 * program killed mid-loop): asserting the exact bytes there would pin an
 * accident rather than a requirement.
 *
 * `divergence` is set when the two engines are NOT expected to agree. It is a
 * string rather than a boolean so the reason travels with the row, and the
 * parity test asserts the disagreement is exactly the one described — a fixture
 * that starts agreeing again is as much a change as one that stops.
 */
export interface ParityFixture {
  id: string;
  provenance: Provenance;
  source: string;
  /**
   * What the learner typed into the input box.
   *
   * Fed to the server through the same `input.endsWith("\n") ? input : input + "\n"`
   * normalisation `runCases` applies — the production path, not a test
   * convenience.
   */
  stdin: string;
  /** Bytes the server must print, or `null` when output is not the claim. */
  stdout: string | null;
  /** What the BROWSER is declared to produce. Not executed here. */
  local: LocalExecutionStatus;
  server: ExecutionStatus;
  /** Set when the engines are expected to disagree, and why. */
  divergence?: string;
  /**
   * Why the SERVER half must not be executed, or asserted, here.
   *
   * Exactly one fixture uses it and the reason is not a limitation of the
   * harness: the program's behaviour is UNDEFINED, so there is no portable
   * answer to pin. Running it would record whichever answer this machine's
   * architecture happens to give.
   */
  unexecutable?: { server?: string };
  /** Overrides the server's 5 s budget. Only the runaway-loop fixture needs it. */
  serverTimeLimitMs?: number;
}

/**
 * Why no fixture carries an `unexecutable.local`.
 *
 * It used to be a per-row field, because under Pyodide exactly one fixture — the
 * runaway loop — could not be run locally. Now none of them can, so a per-row
 * reason would be twenty-odd copies of one sentence. It is stated once, here,
 * and the parity suite asserts that it is stated.
 */
export const LOCAL_HALF_NOT_EXECUTED =
  "This table's `local` column is DECLARED, not measured: these fixtures run " +
  "one program through the server engine and compare it against a status " +
  "vocabulary, and nothing here starts the browser toolchain. That toolchain " +
  "is no longer unreachable — tests/support/cpp-browser.ts serves the 57.5 MB " +
  "over `node:http` and drives the shipped worker, and " +
  "tests/cpp17/curriculum-in-the-learners-compiler.test.ts compiles all 263 " +
  "reference solutions in it. What is still missing is the JOIN: one fixture, " +
  "both engines, one comparison. See tests/execution/engines.ts.";

/* -------------------------------------------------------------------------- */
/* Looking the September programs up                                          */
/* -------------------------------------------------------------------------- */

function everyBlock(): LessonBlock[] {
  return MONTHS.flatMap((m) => [
    ...m.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
    ...(m.assessment?.blocks ?? []),
  ]);
}

export const ALL_BLOCKS: LessonBlock[] = everyBlock();

/**
 * September's blocks alone.
 *
 * The migration runs month by month and only September is finished, so a scan
 * for leftover Python has to be scoped or it reports nine months of work in
 * progress as a defect in this one. `MONTHS[0]` rather than a filter on the id,
 * because the month object is the thing that owns its lessons.
 */
export const SEPTEMBER_BLOCKS: LessonBlock[] = [
  ...MONTHS[0].units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
  ...(MONTHS[0].assessment?.blocks ?? []),
];

/**
 * A block's solution, or a loud failure.
 *
 * Throws rather than returning undefined: a fixture whose origin block was
 * renamed is a fixture that has stopped being about the curriculum, and the
 * right outcome is a red test naming the id, not a table that quietly shrinks.
 *
 * Two field names, because the curriculum has two shapes for the same thing:
 * lesson blocks declare `referenceSolution` and the independent-practice
 * problems declare `solution`. Reading only the first made `m1.p3` unreachable
 * from here, which is the block the trust section is built on.
 */
export function septemberSolution(blockId: string): string {
  const block = ALL_BLOCKS.find((b) => b.id === blockId) as
    | (LessonBlock & { referenceSolution?: unknown; solution?: unknown })
    | undefined;
  if (!block) {
    throw new Error(
      `parity fixture names ${blockId}, which no longer exists in the curriculum. ` +
        `Re-point the fixture at whatever replaced it rather than deleting it — ` +
        `the whole value of this table is that the programs are real.`,
    );
  }
  const source = typeof block.referenceSolution === "string"
    ? block.referenceSolution
    : typeof block.solution === "string"
      ? block.solution
      : null;
  if (source === null) {
    throw new Error(`parity fixture names ${blockId}, which has no solution to run`);
  }
  return source;
}

/* The September programs the table leans on hardest, resolved once so a rename
   fails at import rather than inside one test. */
const FIXED = septemberSolution("m1.l1.b5"); //  cout << 7 * 8
const RECTANGLE = septemberSolution("m1.l2.b3"); //  a * b, 2 * (a + b)
const DIVMOD = septemberSolution("m1.l3.b5"); //  n / k, n % k
const MAX_OF_TWO = septemberSolution("m1.l4.b4"); //  if (a > b) ...
const PARITY = septemberSolution("m1.l4.b5"); //  n % 2 == 0 ? even : odd
const AVERAGE = septemberSolution("m1.l10.b5"); //  (a + b + c) / 3.0
const GREETING = septemberSolution("m1.l11.b2"); //  "Hello, " << name

/* -------------------------------------------------------------------------- */
/* The table                                                                  */
/* -------------------------------------------------------------------------- */

export const PARITY_FIXTURES: readonly ParityFixture[] = [
  /* ---------------------------------------------------------------------- */
  /* Ordinary stdin/stdout — the shape of nearly every task in the month     */
  /* ---------------------------------------------------------------------- */
  {
    id: "fixed-expression",
    provenance: { kind: "verbatim", blockId: "m1.l1.b5" },
    /* The month's first program, and the one the language change reshaped:
       reading input needs a declared type, so l1 can only ask for a fixed
       expression. It is here because it is the only fixture with no `cin` at
       all, which makes it the control for every stdin claim below. */
    source: FIXED,
    stdin: "",
    stdout: "56",
    local: "ok",
    server: "ok",
  },
  {
    id: "read-two-ints",
    provenance: { kind: "verbatim", blockId: "m1.l2.b3" },
    /* `cin >> a >> b` — the single most common opening in September, and the
       one that depends on the stdin rule being right. `>>` skips whitespace
       itself, so this is also the fixture that would catch a harness inventing
       its own tokenisation. */
    source: RECTANGLE,
    stdin: "3 4",
    stdout: "12 14",
    local: "ok",
    server: "ok",
  },
  {
    id: "read-two-ints-hidden-case",
    provenance: { kind: "verbatim", blockId: "m1.l2.b3" },
    /* The block's own hidden case. A learner cannot have seen this input. */
    source: RECTANGLE,
    stdin: "10 7",
    stdout: "70 34",
    local: "ok",
    server: "ok",
  },
  {
    id: "string-input",
    provenance: { kind: "verbatim", blockId: "m1.l11.b2" },
    /* The month's one program that reads TEXT rather than a number. `cin >> s`
       stops at whitespace and consumes no newline, so it fails differently if a
       harness hands the program a line with its terminator still attached — the
       output would be `Hello, Aidana\n!`. */
    source: GREETING,
    stdin: "Aidana",
    stdout: "Hello, Aidana!",
    local: "ok",
    server: "ok",
  },
  {
    id: "kazakh-output",
    provenance: {
      kind: "derived",
      blockId: "m1.l1.b5",
      how: "prints a Kazakh label beside the answer",
    },
    /* Two bytes a character. Both of the three defects found in the browser
       runtime were about this alphabet — output decoded as latin-1, source
       encoded as latin-1 with the wrong length — and this course is taught in
       it. See `docs/cpp17/CPP17_BROWSER_RUNTIME.md`. */
    source:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Жауап: " << 7 * 8;\n    return 0;\n}',
    stdin: "",
    stdout: "Жауап: 56",
    local: "ok",
    server: "ok",
  },

  /* ---------------------------------------------------------------------- */
  /* Division, modulo, and what C++ does with negatives                      */
  /* ---------------------------------------------------------------------- */
  {
    id: "integer-division-and-modulo",
    provenance: { kind: "verbatim", blockId: "m1.l3.b5" },
    source: DIVMOD,
    stdin: "17 5",
    stdout: "3 2",
    local: "ok",
    server: "ok",
  },
  {
    id: "negative-integer-division",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b5",
      how: "the block's own program, on a negative dividend its case set never covers",
    },
    /* THE fixture of this table.

       C++ truncates toward zero: `-7 / 2` is `-3` and `-7 % 2` is `-1`. Python
       FLOORS: `-4` and `1`. Every September task inherited from the Python
       curriculum had to be re-checked against this rather than translated, and
       it is the single most likely way an expected output became quietly wrong.

       Measured identical on the browser's Clang 8 and the judge's GCC 14 — see
       `docs/cpp17/CPP17_JUDGE_PARITY.md`. If either engine ever computed this
       itself instead of asking the compiler, this is the row that catches it. */
    source: DIVMOD,
    stdin: "-7 2",
    stdout: "-3 -1",
    local: "ok",
    server: "ok",
  },
  {
    id: "negative-modulo-parity",
    provenance: { kind: "verbatim", blockId: "m1.l4.b5" },
    /* The curriculum's own consequence of the row above. `-3 % 2` is `-1` in
       C++, which is NOT `0`, so `n % 2 == 0` is still false and the answer is
       still `odd` — the block ships `-3 → odd` and `-8 → even` as hidden cases
       and both survive the language change. They would not have survived a
       program written as `n % 2 == 1`, which is correct in Python and wrong in
       C++ for every negative odd number. */
    source: PARITY,
    stdin: "-3",
    stdout: "odd",
    local: "ok",
    server: "ok",
  },
  {
    id: "comparison-on-negatives",
    provenance: { kind: "verbatim", blockId: "m1.l4.b4" },
    /* The block's own hidden case: `-5 -9 → -5`. Two negative numbers through
       an `if`, which is where a learner who reached for `abs` gets a different
       answer from one who did not. */
    source: MAX_OF_TWO,
    stdin: "-5 -9",
    stdout: "-5",
    local: "ok",
    server: "ok",
  },

  /* ---------------------------------------------------------------------- */
  /* Doubles, and the formatting nobody chose deliberately                   */
  /* ---------------------------------------------------------------------- */
  {
    id: "double-default-precision",
    provenance: { kind: "verbatim", blockId: "m1.l10.b5" },
    /* `(a + b + c) / 3.0`, and the block's hidden case expects `4.33333` —
       SIX significant digits, because that is `cout`'s default precision and
       nobody wrote it down. It is the most engine-sensitive line in September:
       two standard libraries that formatted doubles differently would disagree
       here and nowhere else in the month, and the learner would see a passing
       Run and a failing Submit.
       Under Python this fixture expected `4.333333333333333` — sixteen digits
       of shortest-round-trip repr. Same task, same arithmetic, different
       answer, and the curriculum's expected outputs had to change with it. */
    source: AVERAGE,
    stdin: "4 4 5",
    stdout: "4.33333",
    local: "ok",
    server: "ok",
  },
  {
    id: "double-recurring",
    provenance: { kind: "verbatim", blockId: "m1.l10.b5" },
    source: AVERAGE,
    stdin: "0 0 1",
    stdout: "0.333333",
    local: "ok",
    server: "ok",
  },
  {
    id: "double-that-prints-as-an-integer",
    provenance: { kind: "verbatim", blockId: "m1.l10.b5" },
    /* `(4 + 5 + 3) / 3.0` is 4.0, and `cout` prints it as `4` with no decimal
       point at all. The block's own visible case says `4`. This is the trap on
       the other side of the previous two: a learner who expects `4.0` because
       the division was floating-point is wrong, and an author who writes `4.0`
       into an expected output ships a task nobody can pass. */
    source: AVERAGE,
    stdin: "4 5 3",
    stdout: "4",
    local: "ok",
    server: "ok",
  },
  {
    id: "long-long-past-32-bits",
    provenance: {
      kind: "synthesised",
      why:
        "September's numbers all fit in an `int` and the syllabus does not " +
        "reach `long long` until the range of the type is taught. It is " +
        "fixtured anyway because it is the first thing a learner meets that " +
        "Python simply did not have: an integer with a WIDTH. A program that " +
        "silently truncated at 32 bits would produce a plausible wrong answer " +
        "rather than an error, and both engines are measured agreeing on it in " +
        "docs/cpp17/CPP17_JUDGE_PARITY.md.",
    },
    source:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n = 3000000000LL;\n    cout << n * 2;\n    return 0;\n}',
    stdin: "",
    stdout: "6000000000",
    local: "ok",
    server: "ok",
  },
  {
    id: "bits-stdcpp-compiles",
    provenance: {
      kind: "synthesised",
      why:
        "September teaches `#include <iostream>` and nothing else, so no block " +
        "supplies this. It is fixtured because it is the asymmetry most likely " +
        "to make a learner think the product is broken: `bits/stdc++.h` is a " +
        "libstdc++ extension, GCC ships it and libc++ does not, so without the " +
        "sysroot shim the SAME FILE compiles on Submit and refuses to compile " +
        "on Run. The shim is generated from src/lib/cpp17/bits-stdcpp.ts and " +
        "the local provider injects it too, which is what this row checks.",
    },
    source:
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    vector<int> v = {5, 3, 1, 4, 1};\n    sort(v.begin(), v.end());\n    for (int x : v) cout << x << \" \";\n    return 0;\n}",
    stdin: "",
    stdout: "1 1 3 4 5 ",
    local: "ok",
    server: "ok",
  },

  /* ---------------------------------------------------------------------- */
  /* Errors — the categories that must land on the same side of the line     */
  /* ---------------------------------------------------------------------- */
  {
    id: "compile-error-missing-semicolon",
    provenance: {
      kind: "derived",
      blockId: "m1.l1.b5",
      how: "the semicolon dropped from `cout << 7 * 8;`",
    },
    /* THE assertion of this section. A missing semicolon is a program that
       never ran, and telling a fourteen-year-old to go and look at their logic
       when what they have is a punctuation error is a different afternoon.

       It is now decided STRUCTURALLY on every engine — the compiler exits
       non-zero and the run stage never happens — where the Python era had to
       match `SyntaxError` in prose with a predicate shared at the port. */
    source: FIXED.replace("cout << 7 * 8;", "cout << 7 * 8"),
    stdin: "",
    stdout: "",
    local: "syntax_error",
    server: "compile_error",
  },
  {
    id: "compile-error-undeclared-identifier",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b5",
      how: "the variable typo'd in the output line",
    },
    /* The fixture that moved CATEGORY between languages, and the reason it is
       kept rather than dropped.

       In Python a typo'd variable is a `NameError` — a RUNTIME error, raised
       when the line executes, so a program with a typo in a branch nobody takes
       runs fine. In C++ it is a COMPILE error: the program does not exist at
       all, and the mistake is caught before any input is read.

       That is strictly better for a learner and it is a real change to what the
       product records. This row is what stops it being an accident. */
    source: DIVMOD.replace("cout << n / k", "cout << n / kk"),
    stdin: "17 5",
    stdout: "",
    local: "syntax_error",
    server: "compile_error",
  },
  {
    id: "runtime-error-uncaught-exception",
    provenance: {
      kind: "synthesised",
      why:
        "September has no container and no exception, so no block supplies " +
        "one. It is fixtured because it is the ONLY C++ crash that leaves the " +
        "learner a readable sentence: libstdc++'s terminate handler prints " +
        "`terminate called after throwing an instance of ...` before aborting. " +
        "Every other crash in this month's reach — a divide by zero, a bad " +
        "pointer — dies on a signal and prints nothing at all.",
    },
    source:
      "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v;\n    cout << v.at(3);\n    return 0;\n}",
    stdin: "",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },
  {
    id: "division-by-zero",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b5",
      how: "the block's own program, on the divisor the prompt tells the learner not to pass",
    },
    /* ## Measured, and it is worse than "it crashes"
       Integer division by zero is UNDEFINED BEHAVIOUR in C++, and the two
       architectures this product runs on do not agree about it:
         - x86-64 (the judge, and most laptops): `idiv` raises #DE, the process
           dies on SIGFPE and prints nothing. `runtime_error`.
         - AArch64 (an Apple Silicon developer machine, and this harness):
           `SDIV` is defined to return 0 and does not trap. The program prints
           an answer and exits 0. `ok`.
       Running this fixture on a Mac produced `0 17` and exit 0 — a plausible
       wrong ANSWER where the judge would report a crash.

       So there is no portable expectation to assert, and asserting the one this
       machine gives would pin an accident. The row is kept because the hazard
       is real and worth a learner-facing decision one day: a task whose case
       set can reach a zero divisor grades differently depending on where it
       ran. Under Python this was a clean `ZeroDivisionError` everywhere.

       The declared columns below are the JUDGE's behaviour, which is what
       matters for evidence; the harness is told not to run it. */
    source: DIVMOD,
    stdin: "17 0",
    stdout: null,
    local: "runtime_error",
    server: "runtime_error",
    unexecutable: {
      server:
        "integer division by zero is undefined behaviour and is not portable: " +
        "x86-64 traps with SIGFPE, AArch64's SDIV returns 0 and the program " +
        "exits normally. Measured `0 17` and exit 0 on Apple Silicon. Pinning " +
        "either answer would pin the architecture the suite happened to run on.",
    },
  },
  {
    id: "non-numeric-input",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b4",
      how: "the block's own program, given a word where it expects a number",
    },
    /* A learner types their name into the input box.
       `cin >> t` constructs a sentry, which SUCCEEDS (there is input), then
       fails to convert it — and C++11 specifies that a failed conversion sets
       the target to ZERO. So the program prints `0 0` and exits 0: a running,
       wrong program rather than a crash.
       Under Python this was `ValueError` and a non-zero exit. Same mistake,
       loud there and silent here — and this row is the SPECIFIED half of that
       change. The unspecified half is the fixture below it. */
    source: septemberSolution("m1.l3.b4"),
    stdin: "abc",
    stdout: "0 0",
    local: "ok",
    server: "ok",
  },
  {
    id: "empty-input-box",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b4",
      how: "the block's own program, with nothing typed into the input box",
    },
    /* The behavioural change that got QUIETER, which is why it is a fixture and
       not a footnote.

       `input()` on an exhausted stdin raised `EOFError` and CPython exited 1 —
       a loud `runtime_error` a learner could not miss. `cin >> n` sets
       `failbit` and, since C++11, VALUE-INITIALISES the target, so the program
       carries on with two zeros, prints `0 0` and exits 0.

       A learner who presses Run with an empty box now gets a plausible wrong
       ANSWER instead of an error. There is nothing to fix — it is what the
       language does — but nothing downstream may assume an empty input
       produces a failure, and this row is where that is written down.

       It uses `m1.l3.b4` (seconds → minutes) rather than the divmod block
       beside it, and deliberately: with an empty box the divmod program has no
       divisor either and would then divide by it, so that fixture would be
       testing a second undefined behaviour on top of this one.

       ## MEASURED, and worse than "it prints zero"

       The obvious reading — "extraction fails, so C++11 sets the target to
       zero" — is WRONG for an empty box, and the difference is the sentry:

         - Input `abc`: the sentry succeeds (there IS input), the CONVERSION
           fails, and the target is set to 0. Specified, portable, and pinned by
           `non-numeric-input` above.
         - Input empty: the sentry fails at EOF and `operator>>` RETURNS WITHOUT
           TOUCHING THE VARIABLE. September declares `int t;` with no
           initialiser, so the program then reads indeterminate memory.

       Measured on Apple clang 17 / libc++: a variable pre-set to 12345 still
       held 12345 after the failed read, and the program printed `12345 205 45`.
       With a genuinely uninitialised `int` the answer is whatever was on the
       stack — undefined behaviour, and a different number on a different
       build.

       So `stdout` is `null` here: there is no portable answer to assert, only a
       portable STATUS. A learner who presses Run with an empty box gets a
       confident, arbitrary wrong number — no error, no zero, no clue. That is a
       genuine regression against `EOFError` and it is a curriculum decision to
       make (teach `if (cin >> t)`, or initialise in the starter), not something
       this table can fix. It is recorded so the decision is available. */
    source: septemberSolution("m1.l3.b4"),
    stdin: "",
    stdout: null,
    local: "ok",
    server: "ok",
  },

  /* ---------------------------------------------------------------------- */
  /* Limits — where the two engines are allowed to differ, and where not     */
  /* ---------------------------------------------------------------------- */
  {
    id: "runaway-loop",
    provenance: {
      kind: "synthesised",
      why:
        "September teaches no loops — `while` arrives in October — so the " +
        "month has no runaway program to borrow. It is fixtured because it is " +
        "the reason the browser worker exists at all: `while (true) {}` cannot " +
        "be interrupted cooperatively, only terminated.",
    },
    source: "int main() {\n    while (true) {}\n    return 0;\n}",
    stdin: "",
    stdout: null,
    local: "time_limit_exceeded",
    server: "time_limit_exceeded",
    serverTimeLimitMs: 1_200,
  },
  {
    id: "output-bomb-ascii",
    provenance: {
      kind: "synthesised",
      why: "the same reason as the runaway loop — September has no loop to print from",
    },
    /* 100 001 bytes in one statement, so the cap is crossed and the program
       still terminates. */
    source:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    cout << string(100000, \'x\') << "\\n";\n    return 0;\n}',
    stdin: "",
    stdout: null,
    local: "output_limit_exceeded",
    server: "ok",
    divergence:
      "The server has no output-limit status. `ExecutionStatus` stops at " +
      "`time_limit_exceeded` and `memory_limit_exceeded`; every provider " +
      "silently truncates at 64 KiB, appends `[output truncated]` to stderr and " +
      "reports whatever the exit code said — `ok`. So a program that prints too " +
      "much is a named, terminal outcome locally and a wrong answer on submit. " +
      "The truncation POINT agrees here (65 536 of each), because the output is " +
      "ASCII and one byte is one code unit.",
  },
  {
    id: "output-bomb-kazakh",
    provenance: {
      kind: "synthesised",
      why: "the ASCII bomb again, in the language half the product is written in",
    },
    /* 40 000 characters, 80 000 bytes. Over the local cap, under the server's. */
    source:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string zh = "Ж";\n    for (int i = 0; i < 40000; i++) cout << zh;\n    cout << "\\n";\n    return 0;\n}',
    stdin: "",
    stdout: null,
    local: "output_limit_exceeded",
    server: "ok",
    divergence:
      "The caps are counted in different units. The browser's sink counts UTF-8 " +
      "bytes, which is what `LOCAL_LIMITS.maxOutputBytes` says; every server " +
      "provider compares `String.length` — UTF-16 code units — against the same " +
      "number. So this program is cut at 32 768 characters locally and not cut " +
      "at all on the server, and the claim that the cap is 'duplicated on " +
      "purpose and identically' is false for any output that is not ASCII. " +
      "Reported, not fixed: it is a change to every provider's `cap`, and it " +
      "predates the language migration rather than arriving with it.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* The correspondence between the two status vocabularies                     */
/* -------------------------------------------------------------------------- */

export interface CategoryPair {
  local: LocalExecutionStatus;
  /** `null` when the server vocabulary has nothing that means this. */
  server: ExecutionStatus | null;
  /** Also true on the server side, for the pairs that have one. */
  isLearnerOutcome: boolean;
  why: string;
}

/**
 * What "the same result" means when the two vocabularies are different unions.
 *
 * Total over `LocalExecutionStatus` — the parity test asserts that, so a new
 * local status has to be given a server counterpart (or an explicit `null` and
 * a reason) before it can ship.
 *
 * The `isLearnerOutcome` column is the invariant that matters most and it is
 * checked against BOTH systems' own predicates: `isLearnerOutcome` on the local
 * status and `isLearnerEvidence` on the server one must agree, because the
 * question they answer — *may this be recorded as something a child did* — has
 * to have one answer whichever engine happened to run the code.
 */
export const CATEGORY_PAIRS: readonly CategoryPair[] = [
  {
    local: "ok",
    server: "ok",
    isLearnerOutcome: true,
    why: "the program compiled, ran and finished",
  },
  {
    local: "syntax_error",
    server: "compile_error",
    isLearnerOutcome: true,
    why:
      "different words for one fact: the compiler refused the file and nothing " +
      "ran. The local name is a misnomer inherited from the Python era — clang " +
      "reports a missing semicolon, a type error and an undeclared identifier " +
      "all through it — and it is kept because renaming it is a change to the " +
      "trust boundary's vocabulary rather than to the execution engine. Both " +
      "sides now decide it STRUCTURALLY, from whether the compile stage " +
      "succeeded, rather than by matching diagnostic prose.",
  },
  {
    local: "runtime_error",
    server: "runtime_error",
    isLearnerOutcome: true,
    why:
      "the program compiled, ran, and died — an uncaught exception, a signal, " +
      "or a non-zero exit",
  },
  {
    local: "time_limit_exceeded",
    server: "time_limit_exceeded",
    isLearnerOutcome: true,
    why:
      "the learner's program was too slow. Evidence on both sides — December's " +
      "whole month is about making a program fast enough — though the local " +
      "budget is 3 s against the server's 5 s, so a program between the two is " +
      "killed locally and passes on submit. That is deliberate (see LOCAL_LIMITS) " +
      "and it is a difference in BUDGET, not in meaning.",
  },
  {
    local: "output_limit_exceeded",
    server: null,
    isLearnerOutcome: true,
    why:
      "no server counterpart exists. Every provider truncates at 64 KiB and " +
      "reports the exit code, so an output bomb is `ok` with a short answer on " +
      "submit. See the `output-bomb-*` fixtures.",
  },
  {
    local: "runtime_unavailable",
    server: "provider_error",
    isLearnerOutcome: false,
    why:
      "ours, not theirs. 57.5 MB of compiler failing to download is the local " +
      "equivalent of a dead judge, and neither may be recorded against a child. " +
      "The runner also returns it for an oversized paste, which the server calls " +
      "`payload_too_large` — a different name for the same refusal, and it carries " +
      "`infrastructureError: true` for exactly this reason.",
  },
] as const;
