import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { MONTHS } from "@schools/curriculum/months";
import { WRONG_SOLUTIONS, type WrongSolution } from "./wrong-solution-fixtures";
import type { LessonBlock } from "@schools/curriculum/types";

/**
 * Sixteen programs that must keep failing.
 *
 * Each one passed every declared case of the task named beside it, and a hidden
 * case was added to kill it. Asserting that the case EXISTS is not the same as
 * asserting that it WORKS: a later edit to the task, its reference solution or
 * its case list could restore the false accept with every other test green.
 *
 * So this runs the wrong program. For each fixture it asserts, in order:
 *
 *   1. the reference solution answers the witness correctly — otherwise the
 *      fixture is testing a claim about a task that has changed underneath it;
 *   2. the wrong program answers the witness differently, or crashes where the
 *      fixture says it crashes;
 *   3. the wrong program FAILS at least one declared case — which is the whole
 *      point, and the assertion that would go red if the guard case were
 *      deleted or weakened.
 *
 * And where a fixture records an alternative CORRECT algorithm, that it still
 * passes. A task tests correct behaviour, not authorship of the reference, and
 * a case set that rejected a valid alternative would be a defect of its own.
 */

const PYTHON = process.env.EXEC_PYTHON_BIN ?? "python3";

function hasPython(): boolean {
  try {
    execFileSync(PYTHON, ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
const python = hasPython();

interface Run {
  ok: boolean;
  out: string;
  err: string;
}

/**
 * Run one program against many inputs in a SINGLE interpreter.
 *
 * A process per case is the obvious way and it does not scale. This file wanted
 * 196 of them, running concurrently with the 825 of `content-execution`, and
 * the workers began to die — which surfaced as a different fixture failing on
 * each run and an unrelated test file failing to load at all. A heisenbug in a
 * suite whose whole job is to be believed is worse than a slow suite.
 *
 * `support/run-cases.py` gives each case a fresh globals dict, its own stdin
 * and its own stdout. Verified against per-process execution over all 164 case
 * results with zero disagreements before this replaced it.
 */
function runCases(source: string, inputs: string[]): Run[] {
  if (!inputs.length) return [];
  try {
    const out = execFileSync(PYTHON, ["tests/school/support/run-cases.py"], {
      input: JSON.stringify({ program: source, cases: inputs.map((input) => ({ input })) }),
      encoding: "utf8",
      timeout: 120_000,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return (JSON.parse(out) as { status: string; out: string }[]).map((r) => ({
      ok: r.status === "ok",
      out: r.out,
      err: r.status === "ok" ? "" : r.status,
    }));
  } catch (e) {
    const err = e as { stderr?: string };
    throw new Error(`the batched runner itself failed: ${(err.stderr ?? String(e)).slice(0, 400)}`);
  }
}

function run(source: string, stdin: string): Run {
  try {
    const out = execFileSync(PYTHON, ["-I", "-S", "-c", source], {
      input: stdin.endsWith("\n") ? stdin : `${stdin}\n`,
      encoding: "utf8",
      timeout: 20_000,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 8 * 1024 * 1024,
    });
    return { ok: true, out: out.trim(), err: "" };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, out: (err.stdout ?? "").trim(), err: (err.stderr ?? "").trim() };
  }
}

const BLOCKS: Record<string, LessonBlock> = {};
for (const m of MONTHS) {
  for (const u of m.units) for (const l of u.lessons) for (const b of l.blocks) BLOCKS[b.id] = b;
  for (const b of m.assessment?.blocks ?? []) BLOCKS[b.id] = b;
}

/** The block's own correct program. */
function referenceOf(b: LessonBlock): string {
  const any = b as unknown as Record<string, unknown>;
  const src = (any.referenceSolution ?? any.fixedCode) as string | undefined;
  if (!src) throw new Error(`${b.id} has no reference solution`);
  return src;
}

/** The program the learner starts from, for fixtures whose defect is changing nothing. */
function givenOf(b: LessonBlock): string {
  const any = b as unknown as Record<string, unknown>;
  const src = (any.starter ?? any.code) as string | undefined;
  if (!src) throw new Error(`${b.id} shows no starting program`);
  return src;
}

/** Build the wrong program named by a fixture. */
function wrongProgramFor(f: WrongSolution, block: LessonBlock): string {
  if (f.program === "@given") return givenOf(block);
  if (f.program) return f.program;
  if (!f.mutate) throw new Error(`${f.blockId}: fixture names neither a program nor a mutation`);
  const ref = referenceOf(block);
  const { find, replace, regex } = f.mutate;
  const mutated = regex ? ref.split(find).join(replace) : ref.replace(find, replace);
  /* A mutation that changed nothing means the anchor has gone — the task was
     edited and this fixture is now testing the reference against itself, which
     would pass silently and prove nothing. */
  if (mutated === ref) {
    throw new Error(
      `${f.blockId}: the mutation anchor ${JSON.stringify(find)} is no longer in the reference solution`,
    );
  }
  return mutated;
}

/** The witness input, resolving the one fixture that points at a declared case. */
function witnessFor(f: WrongSolution, block: LessonBlock): string {
  if (f.witness !== "@bigCase") return f.witness;
  const any = block as unknown as { cases?: { input: string }[] };
  const biggest = [...(any.cases ?? [])].sort((a, b) => b.input.length - a.input.length)[0];
  if (!biggest) throw new Error(`${f.blockId}: no cases to take a large witness from`);
  return biggest.input;
}

describe("programs that were wrongly accepted stay rejected", () => {
  it("has fixtures, and every one names a block that still exists", () => {
    expect(WRONG_SOLUTIONS.length).toBeGreaterThanOrEqual(16);
    const missing = WRONG_SOLUTIONS.filter((f) => !BLOCKS[f.blockId]).map((f) => f.blockId);
    expect(missing, "fixtures naming blocks that are gone").toEqual([]);
  });

  it("records why each one is wrong, not just that it is", () => {
    /* A fixture whose pedagogy line is a shrug is a fixture nobody can act on
       when it goes red. */
    for (const f of WRONG_SOLUTIONS) {
      expect(f.approach.length, `${f.blockId}: approach`).toBeGreaterThan(20);
      expect(f.pedagogy.length, `${f.blockId}: pedagogy`).toBeGreaterThan(60);
    }
  });

  for (const f of WRONG_SOLUTIONS) {
    describe(f.blockId, () => {
      it.runIf(python)("the reference still answers the witness correctly", () => {
        const block = BLOCKS[f.blockId];
        const got = run(referenceOf(block), witnessFor(f, block));
        expect(got.ok, `${f.blockId}: the reference crashed on the witness\n${got.err}`).toBe(true);
        expect(
          got.out,
          `${f.blockId}: the reference no longer answers ${JSON.stringify(f.referenceOutput)} on the witness — ` +
            `the task changed and this fixture needs revisiting`,
        ).toBe(f.referenceOutput);
      });

      it.runIf(python)("the wrong program is still wrong on the witness", () => {
        const block = BLOCKS[f.blockId];
        const got = run(wrongProgramFor(f, block), witnessFor(f, block));
        if (f.wrongOutput === "@crash") {
          expect(got.ok, `${f.blockId}: the wrong program no longer crashes`).toBe(false);
          expect(got.err, `${f.blockId}: crashed for the wrong reason`).toContain("RecursionError");
          return;
        }
        expect(got.ok, `${f.blockId}: the wrong program crashed instead of answering\n${got.err}`).toBe(true);
        expect(got.out, `${f.blockId}: the wrong program's answer moved`).toBe(f.wrongOutput);
        expect(got.out, `${f.blockId}: the wrong program now agrees with the reference`).not.toBe(
          f.referenceOutput,
        );
      });

      it.runIf(python)("the declared cases now reject it", () => {
        /* The assertion that goes red if the guard case is deleted. */
        const block = BLOCKS[f.blockId];
        const cases = (block as unknown as { cases?: { input: string; expectedOutput: string }[] }).cases ?? [];
        expect(cases.length, `${f.blockId} declares no cases`).toBeGreaterThan(0);

        const src = wrongProgramFor(f, block);
        const results = runCases(src, cases.map((c) => c.input));
        const failed = cases
          .filter((c, i) => !results[i].ok || results[i].out !== c.expectedOutput.trim())
          .map((c) => (c.input.length > 40 ? `${c.input.slice(0, 40)}…` : c.input));
        expect(
          failed.length,
          `${f.blockId}: the wrong program passes every declared case again — ` +
            `the guard case has been removed or weakened`,
        ).toBeGreaterThan(0);
      });

      if (f.alternative) {
        it.runIf(python)("an alternative CORRECT algorithm still passes", () => {
          const block = BLOCKS[f.blockId];
          const cases = (block as unknown as { cases?: { input: string; expectedOutput: string }[] }).cases ?? [];
          const results = runCases(f.alternative!, cases.map((c) => c.input));
          cases.forEach((c, i) => {
            expect(results[i].ok, `${f.blockId}: the alternative crashed on ${JSON.stringify(c.input.slice(0, 40))}`).toBe(true);
            expect(
              results[i].out,
              `${f.blockId}: the case set rejects a correct alternative algorithm — ` +
                `a task tests correct behaviour, not authorship of the reference`,
            ).toBe(c.expectedOutput.trim());
          });
        });
      }
    });
  }
});
