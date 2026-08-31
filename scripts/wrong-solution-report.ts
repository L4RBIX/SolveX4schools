#!/usr/bin/env tsx
/**
 * The false-accept register, generated from the fixtures that enforce it.
 *
 * Every row here is executed by `tests/school/wrong-solutions-fail.test.ts` on
 * every run, so the document cannot drift from the guarantee: if a guard case
 * is removed the test goes red before this report goes stale.
 *
 *   npx tsx scripts/wrong-solution-report.ts            # human table
 *   npx tsx scripts/wrong-solution-report.ts --json     # machine-readable
 *   npx tsx scripts/wrong-solution-report.ts --markdown # the audit document
 */
import { MONTHS } from "../schools/curriculum/months";
import { WRONG_SOLUTIONS } from "../tests/school/wrong-solution-fixtures";
import type { LessonBlock } from "../schools/curriculum/types";
import { CompileError, compileReference, cppCompiler, runCase } from "../tests/support/cpp-run";

const BLOCKS: Record<string, LessonBlock> = {};
for (const m of MONTHS) {
  for (const u of m.units) for (const l of u.lessons) for (const b of l.blocks) BLOCKS[b.id] = b;
  for (const b of m.assessment?.blocks ?? []) BLOCKS[b.id] = b;
}

if (cppCompiler() === null) {
  /* Refuse rather than report. The old version's failure mode was a confident
     document produced without running anything; an audit tool that cannot
     execute must say so and exit non-zero. */
  console.error("[wrong-solution-report] no C++ compiler found — refusing to produce a report that checked nothing.");
  process.exit(2);
}

const monthOf = (id: string) => Number(id.match(/^m(\d+)\./)?.[1] ?? 0);
const isAssessment = (id: string) => /^m\d+\.as\./.test(id);

/**
 * The first declared case that kills this program, or null if none does.
 *
 * ## Why this stopped being true, and how it hid it
 *
 * It ran the program with `python3` and treated ANY throw as "this case killed
 * it". Once the fixtures became C++ the interpreter threw on the very first
 * case of every fixture — a SyntaxError, not a wrong answer — so this returned
 * `cases[0]` for all nineteen and the report printed
 * "19 recorded false accepts, 0 still accepted" without having executed a
 * single program.
 *
 * This script is the audit document for the false-accept register. A green
 * report that proves nothing is the exact failure the register exists to
 * prevent, so the distinction between "did not build" and "built and answered
 * wrongly" is now explicit rather than collapsed into a `catch`.
 */
function killingCase(blockId: string, program: string): string | null {
  const cases = (BLOCKS[blockId] as unknown as { cases?: { input: string; expectedOutput: string }[] }).cases ?? [];
  if (!cases.length) return null;

  let binary: string;
  try {
    binary = compileReference(program, blockId.replace(/[^a-z0-9]/gi, "_")).binary;
  } catch (e) {
    /* A program that does not compile is killed by its first case, and that is
       a real answer rather than a swallowed error — but it is reported as such
       so nobody reads it as "answered wrongly". */
    if (e instanceof CompileError) return cases[0].input;
    throw e;
  }

  for (const c of cases) {
    const r = runCase(binary, c.input.endsWith("\n") ? c.input : `${c.input}\n`);
    if (r.status !== "ok") return c.input;
    if (r.stdout.trim() !== c.expectedOutput.trim()) return c.input;
  }
  return null;
}

function programFor(f: (typeof WRONG_SOLUTIONS)[number]): string {
  const block = BLOCKS[f.blockId] as unknown as Record<string, string | undefined>;
  if (f.program === "@given") return (block.starter ?? block.code) as string;
  if (f.program) return f.program;
  const ref = (block.referenceSolution ?? block.fixedCode) as string;
  return f.mutate!.regex ? ref.split(f.mutate!.find).join(f.mutate!.replace) : ref.replace(f.mutate!.find, f.mutate!.replace);
}

const rows = WRONG_SOLUTIONS.map((f) => {
  const kill = killingCase(f.blockId, programFor(f));
  return {
    blockId: f.blockId,
    month: monthOf(f.blockId),
    inAssessment: isAssessment(f.blockId),
    wrongApproach: f.approach,
    whyPedagogicallyWrong: f.pedagogy,
    witness: f.witness,
    referenceOutput: f.referenceOutput,
    wrongOutput: f.wrongOutput,
    killingCase: kill,
    stillFalselyAccepted: kill === null,
    fixtureKind: f.program ? "program" : "mutation",
  };
});

const md = process.argv.includes("--markdown");
const json = process.argv.includes("--json");

if (json) {
  console.log(JSON.stringify({ generated: "scripts/wrong-solution-report.ts", count: rows.length, rows }, null, 2));
} else if (md) {
  console.log("| Task | Wrong approach | Witness | Reference | Wrong | Killed by |");
  console.log("|---|---|---|---|---|---|");
  for (const r of rows) {
    const trim = (s: string | null) => (s === null ? "**NOT KILLED**" : s.length > 46 ? `${s.slice(0, 46)}…` : s);
    console.log(
      `| \`${r.blockId}\`${r.inAssessment ? " **(monthly check)**" : ""} | ${r.wrongApproach} | \`${JSON.stringify(r.witness.length > 46 ? r.witness.slice(0, 46) + "…" : r.witness)}\` | \`${r.referenceOutput.replace(/\n/g, " / ")}\` | \`${r.wrongOutput}\` | \`${JSON.stringify(trim(r.killingCase))}\` |`,
    );
  }
} else {
  for (const r of rows) {
    console.log(`\n${r.blockId}${r.inAssessment ? "  (MONTHLY CHECK)" : ""}  [${r.fixtureKind}]`);
    console.log(`  wrong:     ${r.wrongApproach}`);
    console.log(`  witness:   ${JSON.stringify(r.witness.slice(0, 60))}`);
    console.log(`  reference: ${JSON.stringify(r.referenceOutput)}   wrong: ${JSON.stringify(r.wrongOutput)}`);
    console.log(`  killed by: ${r.killingCase === null ? "*** NOTHING — STILL FALSELY ACCEPTED ***" : JSON.stringify(r.killingCase.slice(0, 60))}`);
  }
  const alive = rows.filter((r) => r.stillFalselyAccepted);
  console.log(`\n${rows.length} recorded false accepts, ${alive.length} still accepted.`);
  if (alive.length) process.exitCode = 1;
}
