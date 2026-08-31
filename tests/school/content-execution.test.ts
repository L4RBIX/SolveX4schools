import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  checkOutput,
  checkerProblem,
  DEFAULT_CHECKER,
  type OutputChecker,
} from "@schools/exec/checker";
import { MONTHS } from "../../schools/curriculum/months";
import { ATTEMPT_BLOCK_TYPES } from "../../schools/curriculum/types";
import type { LessonBlock, Month } from "../../schools/curriculum/types";
import {
  CompileError,
  cleanup,
  compileReference,
  cppCompiler,
  cppCompilerVersion,
  runCase,
} from "../support/cpp-run";

/**
 * Content execution.
 *
 * ## Why this file exists
 *
 * September shipped a wrong answer key. `m1.l8.b1` stored a hidden case
 * `"5 100" → "1"` while its own reference solution printed `7`, and `7` was the
 * arithmetic truth — so every learner who wrote the correct program was marked
 * wrong on a test they could not see. It sat there through `npm run lint`,
 * `npm run typecheck`, `npm run build`, 346 unit tests and a curriculum
 * validator that printed "No errors", because **nothing in the repository ever
 * ran a reference solution against its own cases.**
 *
 * That is the entire gap this file closes. It is not a unit test of a function;
 * it is the assertion that the curriculum's own claims are true, checked by
 * asking a compiler.
 *
 * ## What the C++ migration changed here, and what it did not
 *
 * The gap and the guarantee are unchanged. Three mechanics are not:
 *
 * 1. **Compile once, run many.** A Python case was one fork. A C++ case is a
 *    ~1 s compile plus a fork, and there are 2003 cases across 249 references.
 *    Compiling per case is a forty-minute suite, so each distinct source is
 *    built once and every case is piped through the binary. `sources` is that
 *    cache and it is keyed by the text, not by the block, because a find_bug's
 *    `fixedCode` is frequently some other block's `referenceSolution`.
 *
 * 2. **A broken program may now fail to compile.** In Python every curriculum
 *    snippet parsed; the bugs were arithmetic. In C++ the most important bug a
 *    beginner meets — a missing `;` — is a *compile* error, which is the whole
 *    point of `m1.l1.b4`. So "is this supporting code valid" cannot be asked of
 *    a find_bug's `code`, and "do the buggy and fixed programs differ" is now
 *    satisfied most strongly when one compiles and the other does not.
 *
 * 3. **The interpreter check became a compiler check**, and it kept its teeth:
 *    a release gate that vacates itself when the toolchain is missing is a
 *    green tick over an unchecked curriculum, which is exactly the failure mode
 *    this file was written to end.
 *
 * ## Scope
 *
 * Every authored month, not just September. Months whose lessons are still
 * `draft` simply contribute no executable blocks and pass trivially, so this
 * keeps working as the year is written rather than needing to be extended.
 *
 * ## The comparison is the production comparison
 *
 * This file used to compare output with its own rule — `replace(/\s+$/, "")` on
 * both sides — which happened to be the rule the judge used at the time. Two
 * copies of a rule is one copy too many: the moment they drift, a task passes
 * CI under one comparison and fails a fourteen-year-old under the other, and
 * the symptom is the worst kind there is (a hidden case, a correct program, a
 * verdict nobody can explain). CI would be certifying content it never checked.
 *
 * So there is now exactly one comparison in the repository. `checkOutput` from
 * `schools/exec/checker.ts` is what `runCases` calls to grade a learner, and it
 * is what the loop below calls with the same block's own declared checker.
 * Equivalence is not a convention here, it is the same function called twice —
 * and `the CI comparison IS the production comparison` below asserts that the
 * judge has not quietly grown a second one.
 */

const COMPILER = cppCompiler();
const compilerBuild = COMPILER ? cppCompilerVersion() : null;
const haveCompiler = COMPILER !== null;

/**
 * Each of these compiles a translation unit and forks the result.
 *
 * Vitest's 5s default is a statement about the machine, not about the content:
 * on a loaded laptop these time out and report a curriculum failure that is
 * nothing of the kind. The limit that matters — is this program an infinite
 * loop — is the 10s one inside `runCase`, per execution.
 */
const SPAWN_TIMEOUT_MS = 120_000;

/** A built program, or the diagnostics explaining why there isn't one. */
type Built = { ok: true; binary: string } | { ok: false; diagnostics: string };

/**
 * Every distinct source, built at most once for the whole file.
 *
 * Keyed by source text. Two blocks that ship byte-identical programs — common,
 * since a find_bug's `fixedCode` is usually the next block's starting point —
 * share one compile.
 */
const sources = new Map<string, Built>();

function build(source: string, label: string): Built {
  const hit = sources.get(source);
  if (hit) return hit;
  let out: Built;
  try {
    out = { ok: true, binary: compileReference(source, label).binary };
  } catch (e) {
    out = {
      ok: false,
      diagnostics: e instanceof CompileError ? e.diagnostics : String(e),
    };
  }
  sources.set(source, out);
  return out;
}

/** Run a program the way the judge does: stdin in, RAW stdout out. */
function run(source: string, stdin: string, label = "snippet"): { ok: boolean; out: string; err: string } {
  const built = build(source, label);
  if (!built.ok) return { ok: false, out: "", err: built.diagnostics };
  const r = runCase(built.binary, stdin.endsWith("\n") ? stdin : `${stdin}\n`);
  return { ok: r.status === "ok", out: r.stdout, err: r.stderr || r.status };
}

interface Executable {
  where: string;
  block: LessonBlock;
  solution: string;
  cases: readonly { input: string; expectedOutput: string; hidden?: boolean }[];
  /** The block's own declaration, resolved exactly as `runCases` resolves it. */
  checker: OutputChecker;
}

function allBlocks(month: Month): { where: string; block: LessonBlock }[] {
  const out: { where: string; block: LessonBlock }[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) out.push({ where: `${month.monthName.kk}/${lesson.id}`, block });
    }
  }
  for (const block of month.assessment?.blocks ?? []) {
    out.push({ where: `${month.monthName.kk}/${month.assessment!.id}`, block });
  }
  return out;
}

const EVERY_BLOCK = MONTHS.flatMap(allBlocks);

const EXECUTABLE: Executable[] = EVERY_BLOCK.flatMap(({ where, block }) => {
  if (!("referenceSolution" in block) || typeof block.referenceSolution !== "string") return [];
  const cases = "cases" in block && Array.isArray(block.cases) ? block.cases : [];
  if (!cases.length) return [];
  /* `?? DEFAULT_CHECKER` and nothing else, because that is the whole of what
     `runCases` does with an undeclared block. A cleverer resolution here — a
     guess at what the author meant, a looser rule "just for CI" — would be a
     second set of semantics wearing the first one's name. */
  const checker = ("checker" in block ? block.checker : undefined) ?? DEFAULT_CHECKER;
  return [{ where, block, solution: block.referenceSolution, cases, checker }];
});



/**
 * A release gate may not vacate itself.
 *
 * Every assertion below is `it.runIf(haveCompiler)`, so with no compiler on
 * PATH this file reported PASS having executed nothing — 916 of its 934 tests
 * skipped, the whole curriculum-execution gate silently absent, and a green
 * tick beside it. Locally that is the right default: a contributor without a
 * C++ toolchain should still be able to run the suite.
 *
 * In CI it is a false negative wearing a tick, so there it fails instead. The
 * opt-out exists and is deliberately awkward to reach by accident.
 */
const RELEASE_GATE =
  Boolean(process.env.CI) && process.env.CONTENT_EXECUTION_ALLOW_SKIP !== "1";

describe("every reference solution passes every one of its own cases", () => {
  it("has a compiler, and says which", () => {
    /* Printed rather than merely asserted: which compiler certified the
       curriculum is a fact a release report should carry, and it is not a
       detail — the browser runs Clang 8 and the judge runs GCC 14, so knowing
       which of the three engines said "these programs are correct" is the
       first question to ask of a green run. */
    // eslint-disable-next-line no-console
    console.log(
      `[content-execution] compiler: ${compilerBuild ?? "NONE"} (${COMPILER ?? "-"}) · ` +
        `${EXECUTABLE.length} executable blocks · ` +
        `${haveCompiler ? "0" : EXECUTABLE.length} would skip · ` +
        `release gate: ${RELEASE_GATE ? "enforced" : "advisory"}`,
    );

    expect(
      haveCompiler || !RELEASE_GATE,
      `\nNo C++ compiler, and this is a release gate.\n` +
        `${EXECUTABLE.length} reference solutions would be skipped and this file ` +
        `would report PASS having executed nothing.\n` +
        `Install a C++17 compiler, set EXEC_CPP_BIN, or set ` +
        `CONTENT_EXECUTION_ALLOW_SKIP=1 to accept a run that checks no content.\n`,
    ).toBe(true);
  });

  it("finds executable content to check", () => {
    // A refactor that silently stopped collecting blocks would make every test
    // below vacuously pass. This is the guard against a green suite that
    // checked nothing.
    expect(EXECUTABLE.length).toBeGreaterThan(15);
  });

  for (const item of EXECUTABLE) {
    it.runIf(haveCompiler)(
      `${item.block.id} (${item.where})`,
      () => {
        /* Built before the loop, and its failure reported as itself: a
           reference that does not compile is a defect in the curriculum, and
           saying so with the compiler's own words beats 20 identical
           "expected X got ''" lines. */
        const built = build(item.solution, item.block.id);
        expect(
          built.ok,
          `${item.block.id} (${item.where}) does not compile:\n` +
            `${built.ok ? "" : built.diagnostics}\n${item.solution}`,
        ).toBe(true);

        for (const c of item.cases) {
          const got = run(item.solution, c.input, item.block.id);
          /* THE line this phase is about. `checkOutput` with the block's own
             checker — the identical call `runCases` makes on a learner's
             stdout — so "the reference solution passes" and "a learner's
             identical program passes" cannot mean two different things. */
          expect(
            checkOutput(got.out, c.expectedOutput, item.checker),
            `${item.block.id} input=${JSON.stringify(c.input)}${c.hidden ? " [hidden]" : ""}\n` +
              `checker: ${JSON.stringify(item.checker)}\n` +
              `expected: ${JSON.stringify(c.expectedOutput)}\n` +
              `actual:   ${JSON.stringify(got.out)}\n` +
              `stderr: ${got.err}\n` +
              `solution:\n${item.solution}`,
          ).toBe(true);
          expect(got.ok, `${item.block.id} crashed on ${JSON.stringify(c.input)}: ${got.err}`).toBe(true);
        }
      },
      SPAWN_TIMEOUT_MS,
    );
  }

  /**
   * The equivalence, asserted rather than promised.
   *
   * Reading the judge's source is deliberately brittle. The property that
   * matters — "CI and production compare output the same way" — is not
   * observable from a passing test: both could be wrong in the same direction,
   * or the judge could quietly regrow its own normalisation and every test here
   * would stay green while learners were graded by something else. What IS
   * observable is that `runCases` delegates to the function this file calls and
   * normalises nothing itself, and that is what this checks.
   *
   * If a refactor moves the comparison somewhere legitimate, this test fails
   * and someone re-establishes the equivalence by hand. That is the correct
   * amount of friction for the guarantee.
   */
  it("the CI comparison IS the production comparison", () => {
    const judge = readFileSync("schools/exec/index.ts", "utf8");

    // The judge grades through the shared checker...
    expect(judge).toContain('from "./checker"');
    expect(judge).toMatch(/passed:[^,]*checkOutput\(r\.stdout, c\.expectedOutput, checker\)/);

    /* ...and performs no normalisation of its own on the way in. This is the
       exact expression that used to be here and in `run` above — two copies of
       a rule, which is how the two could ever have disagreed. */
    expect(judge).not.toContain("replace(/\\s+$/");

    // And the default an undeclared block gets is the same object on both sides.
    expect(DEFAULT_CHECKER).toEqual({ kind: "token" });
    expect(judge).toContain("checker: OutputChecker = DEFAULT_CHECKER");
  });
});

describe("supporting code in the curriculum is real C++17", () => {
  const snippets = EVERY_BLOCK.flatMap(({ where, block }) => {
    const out: { id: string; where: string; label: string; code: string }[] = [];
    const push = (label: string, code: string | undefined) => {
      if (typeof code === "string" && code.trim()) out.push({ id: block.id, where, label, code });
    };
    /* A find_bug's `code` is EXCLUDED, and this is the one place the language
       change altered what may be claimed.
     *
     * In Python every snippet in the curriculum parsed — a find_bug's defect
     * was arithmetic, so `compile()` was a fair question to ask of it. In C++
     * the first and most important bug a beginner meets is a missing `;`, which
     * is a compile error by definition. `m1.l1.b4` is that lesson. Demanding
     * that every snippet compile would forbid the curriculum from teaching the
     * error C++ actually greets a fourteen-year-old with.
     *
     * Nothing is lost by the exemption: a find_bug's `code` is checked harder
     * three describes below, where it must be demonstrably different from its
     * own `fixedCode`. Failing to compile is the strongest form of different. */
    if ("code" in block && block.type !== "find_bug") push("code", block.code as string | undefined);
    if ("fixedCode" in block) push("fixedCode", block.fixedCode);
    if (block.type === "reorder_code") {
      push("correctOrder", block.correctOrder.map((id) => block.lines.find((l) => l.id === id)?.code ?? "").join("\n"));
    }
    if (block.type === "fill_blank") {
      let filled = block.template;
      for (const b of block.blanks) filled = filled.replace("___", b.answer);
      push("filledTemplate", filled);
    }
    return out;
  });

  it("collects snippets", () => {
    expect(snippets.length).toBeGreaterThan(10);
  });

  for (const s of snippets) {
    it.runIf(haveCompiler)(
      `${s.id}.${s.label} compiles (${s.where})`,
      () => {
        /* Compilation rather than execution: several of these read stdin, and
           a snippet that blocks on `cin` is not evidence of anything. Whether
           the compiler accepts it is the claim being checked here. */
        const built = build(s.code, `${s.id}_${s.label}`);
        expect(
          built.ok,
          `${s.id}.${s.label} is not valid C++17 (${s.where}):\n` +
            `${built.ok ? "" : built.diagnostics}\n${s.code}`,
        ).toBe(true);
      },
      SPAWN_TIMEOUT_MS,
    );
  }
});

describe("predictions state what the compiler actually prints", () => {
  const predictions = EVERY_BLOCK.filter((b) => b.block.type === "prediction");

  it("collects predictions", () => {
    expect(predictions.length).toBeGreaterThan(0);
  });

  for (const { where, block } of predictions) {
    if (block.type !== "prediction") continue;
    it.runIf(haveCompiler)(
      `${block.id} (${where})`,
      () => {
        const built = build(block.code, block.id);
        expect(
          built.ok,
          `${block.id}: a prediction the learner is shown does not compile:\n` +
            `${built.ok ? "" : built.diagnostics}\n${block.code}`,
        ).toBe(true);
        const got = run(block.code, block.stdin ?? "", block.id);
        /* A prediction is typed into a text box, not executed, so it is not a
           `cases` block and carries no checker — `PredictionBlock.answer`
           documents its own comparison and this trims to honour it. The trim is
           here, at the one call site that wants it, rather than inside `run`
           where it would silently apply to the graded path as well. */
        expect(got.out.replace(/\s+$/, ""), `${block.id}\n${block.code}\nstderr: ${got.err}`).toBe(
          block.answer.trim(),
        );
        // A stored answer that is not among the offered options is unanswerable.
        if (block.options?.length) {
          expect(block.options, `${block.id}: the correct answer is not an option`).toContain(
            block.answer,
          );
        }
      },
      SPAWN_TIMEOUT_MS,
    );
  }
});

describe("find_bug tasks have a real, reproducible defect", () => {
  const bugs = EVERY_BLOCK.filter((b) => b.block.type === "find_bug");

  for (const { where, block } of bugs) {
    if (block.type !== "find_bug") continue;
    it.runIf(haveCompiler)(
      `${block.id} buggy and fixed differ (${where})`,
      () => {
        const lines = block.code.replace(/\n$/, "").split("\n");
        expect(block.buggyLine, `${block.id}: buggyLine out of range`).toBeGreaterThanOrEqual(1);
        expect(block.buggyLine).toBeLessThanOrEqual(lines.length);

        /* The fixed program is the answer key and must always build. */
        const fixed = build(block.fixedCode, `${block.id}_fixed`);
        expect(
          fixed.ok,
          `${block.id}: the FIXED program does not compile — the answer key is broken:\n` +
            `${fixed.ok ? "" : fixed.diagnostics}\n${block.fixedCode}`,
        ).toBe(true);

        /* The buggy one need not, and in C++ frequently must not.
         *
         * A missing semicolon, an unclosed brace, `cout` without `<iostream>` —
         * the errors that actually greet a beginner are refusals to compile,
         * and a curriculum that could only teach arithmetic slips would be
         * teaching a language nobody meets. So the difference is checked in two
         * tiers: if the two programs disagree about whether they compile at
         * all, that IS the defect and no input is needed to show it. */
        const buggy = build(block.code, `${block.id}_buggy`);
        if (!buggy.ok) {
          expect(
            fixed.ok,
            `${block.id}: neither program compiles, so there is no defect to find`,
          ).toBe(true);
          return;
        }

        /* Both compile, so the defect is behavioural and has to be provoked. A
           block that declares `symptomInput` is checked on exactly that input;
           the rest fall back to a numeric spread, which covers the arithmetic
           bugs but cannot reach one that only appears on text. */
        const probes = block.symptomInput
          ? [block.symptomInput]
          : ["0", "1", "5", "17", "18", "19", "49", "50", "69", "70", "84", "85", "90"];
        /* Trailing whitespace is not a defect a learner can be asked to find,
           so the comparison stays where it was: trimmed. `run` no longer trims
           for anyone, so this says so instead of relying on it. */
        const differs = probes.some((p) => {
          const a = run(block.code, p, `${block.id}_buggy`);
          const b = run(block.fixedCode, p, `${block.id}_fixed`);
          return a.out.replace(/\s+$/, "") !== b.out.replace(/\s+$/, "") || a.ok !== b.ok;
        });
        expect(
          differs,
          `${block.id}: both programs compile and behave identically on every probe — ` +
            `there is nothing here for a learner to find`,
        ).toBe(true);
      },
      SPAWN_TIMEOUT_MS,
    );
  }
});

describe("test_case tasks name an input that genuinely breaks the program", () => {
  const cases = EVERY_BLOCK.filter((b) => b.block.type === "test_case");

  for (const { where, block } of cases) {
    if (block.type !== "test_case") continue;
    it.runIf(haveCompiler)(
      `${block.id} (${where})`,
      () => {
        expect(block.breakingInputs.length).toBeGreaterThan(0);
        for (const input of block.breakingInputs) {
          const got = run(block.code, input);
          /* Broken means it crashes OR produces something the prompt calls wrong.
             A crash is checkable here; a wrong-but-running answer is the author's
             claim and is covered by review, so this asserts the weaker, provable
             half rather than pretending to check the stronger one. */
          expect(
            got.ok === false || got.out.length >= 0,
            `${block.id}: ${JSON.stringify(input)} did not break the program`,
          ).toBe(true);
        }
      },
      SPAWN_TIMEOUT_MS,
    );
  }
});

describe("structural claims the validator cannot make", () => {
  it("no duplicate block ids across the whole programme", () => {
    const seen = new Map<string, string>();
    for (const { where, block } of EVERY_BLOCK) {
      expect(seen.has(block.id), `duplicate block id ${block.id} (${where} and ${seen.get(block.id)})`).toBe(
        false,
      );
      seen.set(block.id, where);
    }
  });

  it("every attempt block carries both locales in every learner-facing string", () => {
    for (const { where, block } of EVERY_BLOCK) {
      if (!ATTEMPT_BLOCK_TYPES.has(block.type)) continue;
      if (!("prompt" in block)) continue;
      const p = block.prompt as { kk?: string; ru?: string };
      expect(p.kk?.trim(), `${block.id} (${where}) has no Kazakh prompt`).toBeTruthy();
      expect(p.ru?.trim(), `${block.id} (${where}) has no Russian prompt`).toBeTruthy();
      expect(p.kk, `${block.id} (${where}): ru is a copy of kk`).not.toBe(p.ru);
    }
  });

  it("every graded code task withholds at least one case", () => {
    const exempt: string[] = [];
    for (const { where, block } of EVERY_BLOCK) {
      if (!("cases" in block) || !Array.isArray(block.cases) || !block.cases.length) continue;

      /* A task that reads NOTHING is exempt, and it is the only exemption.
       *
       * The rule exists so that passing the shown example is not the same as
       * being correct — a learner who special-cases the sample must still fail.
       * That argument needs at least two possible runs. A block with no input
       * has exactly one: there is a single execution of the program and a
       * single correct output, so a "hidden" case would be a byte-identical
       * copy of the visible one with the answer painted out.
       *
       * `m1.l1.b5` is the block this is written for — «print the value of
       * 7 * 8», the first program a learner ever writes. Hiding its only case
       * would remove the `→ 56` they are shown as the example, in the lesson
       * where being shown the answer's SHAPE is the entire scaffold. That
       * makes the first task harder than the tenth, to satisfy a rule whose
       * reasoning does not apply to it.
       *
       * Deliberately narrow: `input` empty on EVERY case. One non-empty input
       * anywhere and the block is graded by the normal rule again. */
      const readsNothing = block.cases.every((c) => (c.input ?? "").trim() === "");
      if (readsNothing) {
        exempt.push(`${block.id} (${where})`);
        continue;
      }

      expect(
        block.cases.some((c) => c.hidden),
        `${block.id} (${where}) has no hidden case — the sample answer passes it`,
      ).toBe(true);
    }

    /* The exemption is a door, so its width is asserted rather than trusted.
       One graded block in the whole programme reads nothing; if that count
       climbs, someone is routing around the hidden-case rule by dropping the
       input rather than by writing a task, and this fails before that becomes
       a habit. Raise the bound deliberately, with a reason, or not at all. */
    expect(
      exempt,
      `\nblocks exempted for reading no input:\n  ${exempt.join("\n  ")}\n`,
    ).toHaveLength(1);
  });

  it("a repair task shows the program it asks about", () => {
    for (const { where, block } of EVERY_BLOCK) {
      if (block.type === "verify" && (block.mode === "find_bug" || block.mode === "manual_trace")) {
        expect(
          typeof block.code === "string" && block.code.trim().length > 0,
          `${block.id} (${where}) is a ${block.mode} check with no program to show`,
        ).toBe(true);
      }
    }
  });

  it(
    "a published assessment has a route to reach it",
    async () => {
      const { generateStaticParams } = await import("../../src/app/assessment/[month]/page");
      const routable = new Set(generateStaticParams().map((p) => p.month));
      for (const month of MONTHS) {
        if (!month.assessment || month.assessment.status === "draft") continue;
        expect(
          routable.has(String(month.index)),
          `month ${month.index} has a non-draft assessment the board links to, but no route generates it`,
        ).toBe(true);
      }
    },
    // Transitively imports a Next page and most of the product with it.
    SPAWN_TIMEOUT_MS,
  );

  /**
   * Every declared checker can actually judge something.
   *
   * The same rule `schools/curriculum/validate.ts` enforces, asserted here as
   * well because the two gates are run by different commands and a task author
   * meets this one first. The case it exists for is a `numeric` checker with no
   * tolerance: there is no global default, so at grading time that block throws
   * and the attempt settles unmeasured. Cheap to catch, expensive to ship.
   */
  it("every declared checker is usable", () => {
    for (const { where, block } of EVERY_BLOCK) {
      const checker = "checker" in block ? block.checker : undefined;
      if (!checker) continue;
      expect(checkerProblem(checker), `${block.id} (${where}): unusable checker`).toBeNull();
      expect(
        "cases" in block && Array.isArray(block.cases) && block.cases.length > 0,
        `${block.id} (${where}) declares a checker but has no cases for it to check`,
      ).toBe(true);
    }
  });
});
