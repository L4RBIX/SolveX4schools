import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock } from "@schools/curriculum/types";
import type { LocalExecutionStatus } from "@schools/execution/trust";
import type { ExecutionStatus } from "@schools/exec/provider";

/**
 * The programs both engines must agree about.
 *
 * ## The assumption this table exists to stop being an assumption
 *
 * Hybrid execution rests on one sentence nobody had checked: **the same program
 * produces the same result in Pyodide and on the server.** Where that is false a
 * learner reads one thing off the Run pane and is graded on another, and the
 * gap is invisible from inside the product — the failing case is hidden by
 * design, so "it worked when I pressed Run" is the only symptom anyone gets.
 *
 * So the claim is written down as data, here, and executed against both engines
 * in `tests/exec/parity-september.test.ts`.
 *
 * ## Why the programs are taken out of the curriculum
 *
 * A parity table of toy programs proves parity for toy programs. Every fixture
 * below is either a September `referenceSolution` verbatim, a mutation of one in
 * a way a fourteen-year-old actually mutates it (a dropped colon, a typo'd
 * variable, an input the case set never covers), or — in exactly two cases —
 * synthesised, with the reason stated and, where possible, asserted. The
 * `provenance` field is checked against `MONTHS` at test time, so a fixture
 * cannot quietly drift away from the content it claims to be about.
 *
 * ## Why the two status unions are related here and not inferred
 *
 * `LocalExecutionStatus` and `ExecutionStatus` are deliberately different
 * unions (see `schools/execution/trust.ts` for the argument), so "the same
 * result" cannot mean "the same string". It means *the same category*, and the
 * correspondence is written out in `CATEGORY_PAIRS` below rather than guessed at
 * by whoever reads a failure. Two of the correspondences are the whole point:
 * `syntax_error` ↔ `compile_error` must hold — the server shipped exactly the
 * bug where a missing bracket was reported as a crash, and it is regression-
 * tested there — and `output_limit_exceeded` has *no* server counterpart at all,
 * which is a real divergence and is recorded as one rather than smoothed over.
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
  /** The block's `referenceSolution`, byte for byte. Asserted, not trusted. */
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
   * Fed to the local engine verbatim, and to the server through the same
   * `input.endsWith("\n") ? input : input + "\n"` normalisation `runCases`
   * applies. Both production paths, not a shared convenience.
   */
  stdin: string;
  /** Bytes both engines must print, or `null` when output is not the claim. */
  stdout: string | null;
  local: LocalExecutionStatus;
  server: ExecutionStatus;
  /** Set when the engines are expected to disagree, and why. */
  divergence?: string;
  /** Why one side cannot be executed by a node test runner. */
  unexecutable?: { local?: string; server?: string };
  /** Overrides the server's 5 s budget. Only the runaway-loop fixture needs it. */
  serverTimeLimitMs?: number;
}

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
 * A block's reference solution, or a loud failure.
 *
 * Throws rather than returning undefined: a fixture whose origin block was
 * renamed is a fixture that has stopped being about the curriculum, and the
 * right outcome is a red test naming the id, not a table that quietly shrinks.
 */
export function septemberSolution(blockId: string): string {
  const block = ALL_BLOCKS.find((b) => b.id === blockId);
  if (!block) {
    throw new Error(
      `parity fixture names ${blockId}, which no longer exists in the curriculum. ` +
        `Re-point the fixture at whatever replaced it rather than deleting it — ` +
        `the whole value of this table is that the programs are real.`,
    );
  }
  if (!("referenceSolution" in block) || typeof block.referenceSolution !== "string") {
    throw new Error(`parity fixture names ${blockId}, which has no referenceSolution`);
  }
  return block.referenceSolution;
}

/* The four September programs the table leans on hardest, resolved once so a
   rename fails at import rather than inside one test. */
const SQUARE = septemberSolution("m1.l1.b5"); // n = int(input()); print(n * n)
const DIVMOD = septemberSolution("m1.l3.b5"); // print(n // k, n % k)
const RECTANGLE = septemberSolution("m1.l2.b3"); // print(a * b, 2 * (a + b))
const MAX_OF_TWO = septemberSolution("m1.l4.b4"); // if a > b: print(a) else: print(b)

/* -------------------------------------------------------------------------- */
/* The table                                                                  */
/* -------------------------------------------------------------------------- */

export const PARITY_FIXTURES: readonly ParityFixture[] = [
  /* ---------------------------------------------------------------------- */
  /* Ordinary stdin/stdout — the shape of nearly every task in the month     */
  /* ---------------------------------------------------------------------- */
  {
    id: "int-input-square",
    provenance: { kind: "verbatim", blockId: "m1.l1.b5" },
    source: SQUARE,
    stdin: "5",
    stdout: "25\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "int-input-square-negative",
    provenance: { kind: "verbatim", blockId: "m1.l1.b5" },
    source: SQUARE,
    /* The block's own hidden case. `-3` is where a learner who wrote
       `print(n ** 2)` and a learner who wrote `print(n * n)` still agree, and
       where a learner who wrote `print(abs(n) * n)` does not. */
    stdin: "-3",
    stdout: "9\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "map-int-split",
    provenance: { kind: "verbatim", blockId: "m1.l2.b3" },
    /* `a, b = map(int, input().split())` — the single most common first line in
       September, and the one that depends on the stdin rule being right. */
    source: RECTANGLE,
    stdin: "3 4",
    stdout: "12 14\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "string-input-concat",
    provenance: { kind: "verbatim", blockId: "m1.l11.b2" },
    /* The month's one program that does NOT wrap `input()` in `int()`. It fails
       differently if the stdin reader hands back a line with its newline still
       attached — the output would be `Hello, Aidana\n!`. */
    source: septemberSolution("m1.l11.b2"),
    stdin: "Aidana",
    stdout: "Hello, Aidana!\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "f-string",
    provenance: {
      kind: "synthesised",
      why:
        "September contains no f-string anywhere — not in a reference solution, " +
        "not in a worked example, not in a starter. That absence is asserted in " +
        "the parity test rather than claimed here. It is fixtured anyway because " +
        "learners paste f-strings from outside the course and the formatting " +
        "machinery behind them is exactly the kind of thing two interpreters of " +
        "different vintages can disagree about.",
    },
    source: 'n = int(input())\nprint(f"{n} * {n} = {n * n}")',
    stdin: "6",
    stdout: "6 * 6 = 36\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "print-end-empty",
    provenance: {
      kind: "synthesised",
      why:
        "Named in `worker.ts`'s own reasoning for using Pyodide's `Writer` form " +
        "of setStdout rather than `batched`: batched strips the trailing newline " +
        "and cannot tell `print(\"a\")` from `print(\"a\", end=\"\")`. That is a " +
        "divergence the file claims to have avoided, so it is executed here.",
    },
    source: 'print("a", end="")',
    stdin: "",
    stdout: "a",
    local: "ok",
    server: "ok",
  },
  {
    id: "kazakh-output",
    provenance: { kind: "derived", blockId: "m1.l1.b5", how: "prints a Kazakh label beside the answer" },
    /* Two bytes a character. The local cap counts bytes and the server's counts
       UTF-16 code units — which does not matter at this size and matters a great
       deal at 64 KiB. See `output-bomb-kazakh`. */
    source: 'n = int(input())\nprint("Жауап:", n * n)',
    stdin: "5",
    stdout: "Жауап: 25\n",
    local: "ok",
    server: "ok",
  },

  /* ---------------------------------------------------------------------- */
  /* Division, modulo, and what Python does with negatives                   */
  /* ---------------------------------------------------------------------- */
  {
    id: "true-division-float-repr",
    provenance: { kind: "verbatim", blockId: "m1.l10.b5" },
    /* `(a + b + c) / 3`. The hidden case expects `4.333333333333333` — sixteen
       significant digits of shortest-round-trip repr. Two interpreters that
       formatted floats differently would disagree here and nowhere else in the
       month, and the learner would see a passing Run and a failing Submit. */
    source: septemberSolution("m1.l10.b5"),
    stdin: "4 4 5",
    stdout: "4.333333333333333\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "true-division-recurring",
    provenance: { kind: "verbatim", blockId: "m1.l10.b5" },
    source: septemberSolution("m1.l10.b5"),
    stdin: "0 0 1",
    stdout: "0.3333333333333333\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "floor-div-and-mod",
    provenance: { kind: "verbatim", blockId: "m1.l3.b5" },
    source: DIVMOD,
    stdin: "17 5",
    stdout: "3 2\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "negative-floor-div-and-mod",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b5",
      how: "the block's own program, on a negative dividend its case set never covers",
    },
    /* Python floors toward negative infinity and gives the modulo the sign of
       the divisor: `-7 // 2` is `-4` and `-7 % 2` is `1`. C, JavaScript and most
       of what a WASM interpreter is built out of would say `-3` and `-1`. If any
       part of either engine ever computed this itself instead of asking CPython,
       this is the fixture that catches it. */
    source: DIVMOD,
    stdin: "-7 2",
    stdout: "-4 1\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "negative-modulo-parity",
    provenance: { kind: "verbatim", blockId: "m1.l4.b5" },
    /* `n % 2 == 0` with `n = -3`. The block ships `-3 → odd` and `-8 → even` as
       hidden cases, which is only correct under Python's sign convention. */
    source: septemberSolution("m1.l4.b5"),
    stdin: "-3",
    stdout: "odd\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "seconds-to-hms",
    provenance: { kind: "verbatim", blockId: "m1.p9" },
    /* `t // 3600, t % 3600 // 60, t % 60` on the month's largest hidden case.
       The expected output `23 59 59` is also the string `judge-secrets.test.ts`
       uses as its example of a value Nova must never say. */
    source: septemberSolution("m1.p9"),
    stdin: "86399",
    stdout: "23 59 59\n",
    local: "ok",
    server: "ok",
  },
  {
    id: "mixed-int-float-arithmetic",
    provenance: { kind: "verbatim", blockId: "m1.p8" },
    /* The clock-angle problem: `m * 0.5` promotes to float, `abs` and a
       comparison run on floats, and `int()` truncates at the end. The only
       program in September where an off-by-one-ulp difference between two
       interpreters could change the printed integer. */
    source: septemberSolution("m1.p8"),
    stdin: "9 30",
    stdout: "105\n",
    local: "ok",
    server: "ok",
  },

  /* ---------------------------------------------------------------------- */
  /* Errors — the categories that must land on the same side of the line     */
  /* ---------------------------------------------------------------------- */
  {
    id: "syntax-error-missing-colon",
    provenance: { kind: "derived", blockId: "m1.l4.b4", how: "the colon dropped from `if a > b:`" },
    source: MAX_OF_TWO.replace("if a > b:", "if a > b"),
    stdin: "3 4",
    stdout: "",
    /* THE assertion of this section. A missing colon is a program that never
       ran, and telling a fourteen-year-old to go and look at their logic when
       what they have is a punctuation error is a different afternoon. The server
       had exactly this bug; the browser must not reintroduce it. */
    local: "syntax_error",
    server: "compile_error",
  },
  {
    id: "syntax-error-unclosed-paren",
    provenance: { kind: "derived", blockId: "m1.l1.b5", how: "the closing bracket dropped from `print(n * n)`" },
    source: SQUARE.replace("print(n * n)", "print(n * n"),
    stdin: "5",
    stdout: "",
    local: "syntax_error",
    server: "compile_error",
  },
  {
    id: "name-error",
    provenance: { kind: "derived", blockId: "m1.l1.b5", how: "the variable typo'd in the second line" },
    source: SQUARE.replace("print(n * n)", "print(n * m)"),
    stdin: "5",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },
  {
    id: "zero-division-error",
    provenance: {
      kind: "derived",
      blockId: "m1.l3.b5",
      how: "the block's own program, on the divisor the prompt tells the learner not to pass",
    },
    source: DIVMOD,
    stdin: "17 0",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },
  {
    id: "index-error",
    provenance: {
      kind: "derived",
      blockId: "m1.l2.b3",
      how: "written with `split()` and indices instead of tuple unpacking, then given one number",
    },
    /* The shape a learner reaches for when unpacking has not clicked yet, run
       against an input with one value in it. */
    source: "p = input().split()\nprint(int(p[0]) * int(p[1]))",
    stdin: "3",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },
  {
    id: "value-error-int-of-text",
    provenance: { kind: "verbatim", blockId: "m1.l1.b5" },
    /* Not an error in the program at all — the learner typed a word into the
       input box. Both engines must call it the learner's runtime error rather
       than an infrastructure failure, or pressing Run with a typo looks like the
       product breaking. */
    source: SQUARE,
    stdin: "abc",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },
  {
    id: "eof-reading-past-the-input",
    provenance: {
      kind: "derived",
      blockId: "m1.l2.b3",
      how: "two `input()` calls where the case supplies one line",
    },
    /* The fixture the whole stdin rule exists for. `"3 4\\n"` is ONE line: the
       trailing newline terminates it rather than introducing a blank second one,
       so the second `input()` must raise `EOFError` exactly as CPython does on a
       pipe. If `stdinLines` kept a phantom empty line the local engine would
       print `3 4 ` and the server would crash — a divergence on the single most
       common input shape in the month. */
    source: "a = input()\nb = input()\nprint(a, b)",
    stdin: "3 4\n",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },
  {
    id: "eof-empty-input-box",
    provenance: { kind: "verbatim", blockId: "m1.l1.b5" },
    /* A learner who presses Run without typing anything.
       The two engines reach the same CATEGORY by different routes, and the
       difference is worth knowing about: locally the box is empty, so
       `stdinLines("")` is `[]` and the first `input()` raises `EOFError`. On the
       server, `runCases` turns an empty case input into `"\\n"` — one blank
       line — so `input()` returns `""` and `int("")` raises `ValueError`.
       Same status, same "this is the learner's error", different exception and
       different message. No September case declares an empty input, so nothing
       is graded through the server half of this today. */
    source: SQUARE,
    stdin: "",
    stdout: "",
    local: "runtime_error",
    server: "runtime_error",
  },

  /* ---------------------------------------------------------------------- */
  /* Limits — where the two engines are allowed to differ, and where not     */
  /* ---------------------------------------------------------------------- */
  {
    id: "runaway-loop",
    provenance: {
      kind: "synthesised",
      why:
        "September teaches no loops — `while` arrives in October — so the month " +
        "has no runaway program to borrow. It is fixtured because it is the " +
        "reason the worker exists at all: `while True: pass` cannot be " +
        "interrupted cooperatively, only terminated.",
    },
    source: "while True:\n    pass",
    stdin: "",
    stdout: null,
    local: "time_limit_exceeded",
    server: "time_limit_exceeded",
    serverTimeLimitMs: 1_200,
    unexecutable: {
      local:
        "Pyodide runs synchronously on whichever thread loads it, and node's " +
        "test runner has no Worker to terminate. Executing this fixture locally " +
        "would hang the suite forever rather than fail it. The local half is " +
        "pinned at the protocol level in tests/exec/pyodide-runner.test.ts, " +
        "which drives the runner's timer against a worker that never answers.",
    },
  },
  {
    id: "output-bomb-ascii",
    provenance: {
      kind: "synthesised",
      why: "the same reason as the runaway loop — September has no loop to print from",
    },
    /* 100 001 bytes in one write, so the cap is crossed without needing a loop
       and the program still terminates. */
    source: 'print("x" * 100000)',
    stdin: "",
    stdout: null,
    local: "output_limit_exceeded",
    server: "ok",
    divergence:
      "The server has no output-limit status. `ExecutionStatus` stops at " +
      "`time_limit_exceeded` and `memory_limit_exceeded`; both providers " +
      "silently truncate at 64 KiB, append `[output truncated]` to stderr and " +
      "report whatever the exit code said — `ok`. So a program that prints too " +
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
    source: 'print("Ж" * 40000)',
    stdin: "",
    stdout: null,
    local: "output_limit_exceeded",
    server: "ok",
    divergence:
      "The caps are counted in different units. `CappedStream` counts UTF-8 " +
      "bytes, which is what `LOCAL_LIMITS.maxOutputBytes` says; both server " +
      "providers compare `String.length` — UTF-16 code units — against the same " +
      "number. So this program is cut at 32 768 characters locally and not cut " +
      "at all on the server, and `HYBRID_EXECUTION_AUDIT.md`'s claim that the " +
      "cap is 'duplicated on purpose and identically' is false for any output " +
      "that is not ASCII. Reported, not fixed: schools/exec is another unit's.",
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
    why: "the program ran and finished",
  },
  {
    local: "syntax_error",
    server: "compile_error",
    isLearnerOutcome: true,
    why:
      "different words for one fact: CPython refused the file before executing a " +
      "line of it. The server reported this as `runtime_error` once and it is " +
      "regression-tested there; the browser decides it structurally, from whether " +
      "`compile()` raised, rather than by matching prose.",
  },
  {
    local: "runtime_error",
    server: "runtime_error",
    isLearnerOutcome: true,
    why: "the program ran and raised — NameError, ZeroDivisionError, IndexError, EOFError",
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
      "no server counterpart exists. Both providers truncate at 64 KiB and report " +
      "the exit code, so an output bomb is `ok` with a short answer on submit. See " +
      "the `output-bomb-*` fixtures.",
  },
  {
    local: "runtime_unavailable",
    server: "provider_error",
    isLearnerOutcome: false,
    why:
      "ours, not theirs. Pyodide failing to download is the local equivalent of a " +
      "dead judge, and neither may be recorded against a child. The runner also " +
      "returns it for an oversized paste, which the server calls " +
      "`payload_too_large` — a different name for the same refusal, and it carries " +
      "`infrastructureError: true` for exactly this reason.",
  },
] as const;
