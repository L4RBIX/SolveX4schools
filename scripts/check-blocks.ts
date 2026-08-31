#!/usr/bin/env tsx
/**
 * Authoring-time block checker.
 *
 * `tests/school/content-execution.test.ts` is the gate: it runs every reference
 * solution in the programme against every one of its own cases with real
 * Python, and it is what CI trusts. But it only sees blocks that are already
 * wired into a `Month`, and it runs the whole year — which is the wrong shape
 * for the moment that matters most, when someone has just written one lesson
 * and wants to know whether its Python is true before anybody else reads it.
 *
 * So this runs the same checks against a single file that exports
 * `LessonBlock[]`, before assembly. It is deliberately a SUPERSET of the test's
 * per-block checks and deliberately not a replacement for it: the test still
 * runs over the assembled programme, still owns duplicate-id detection across
 * months, and still asserts that CI's comparison is production's comparison.
 *
 * The comparison here is `checkOutput` — the same function the judge calls, for
 * the same reason the test file gives at length: two comparisons is one too
 * many, and the failure mode is a task that passes authoring and fails a
 * fourteen-year-old.
 *
 *   npx tsx scripts/check-blocks.ts schools/curriculum/months/m02/l1.ts
 *   npx tsx scripts/check-blocks.ts schools/curriculum/months/m02/*.ts
 *
 * Exit code 1 on any error. Warnings do not fail.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkOutput, checkerProblem, DEFAULT_CHECKER } from "../schools/exec/checker";
import type { OutputChecker } from "../schools/exec/checker";
import { ATTEMPT_BLOCK_TYPES } from "../schools/curriculum/types";
import type { LessonBlock } from "../schools/curriculum/types";
import { SKILL_BY_ID } from "../schools/curriculum/skills";
import { extractConstructs, CONSTRUCTS } from "../schools/curriculum/capability";
import type { ConstructId } from "../schools/curriculum/capability";

const PYTHON = process.env.EXEC_PYTHON_BIN ?? "python3";

/**
 * Two programs compared the way a learner would see them, not the way a byte
 * comparison would.
 *
 * Trailing whitespace and a final newline are invisible on screen, so two
 * programs differing only in those are the same program for the purpose of
 * "has the learner already been shown this". Nothing else is normalised —
 * renaming a variable really does make it a different program to read, and
 * treating those as duplicates would flag legitimate work.
 */
function norm(source: string): string {
  return source
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

function run(source: string, stdin: string): { ok: boolean; out: string; err: string } {
  try {
    const out = execFileSync(PYTHON, ["-I", "-S", "-c", source], {
      input: stdin.endsWith("\n") ? stdin : `${stdin}\n`,
      encoding: "utf8",
      timeout: 10_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, out, err: "" };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, out: err.stdout ?? "", err: (err.stderr ?? "").trim() };
  }
}

function compiles(code: string): { ok: boolean; err: string } {
  const probe = `import sys\ncompile(sys.stdin.read(), "<curriculum>", "exec")`;
  const got = run(probe, code);
  return { ok: got.ok, err: got.err };
}

/* -------------------------------------------------------------------------- */
/* Construct budget per month                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a learner has been shown by the END of each month.
 *
 * This duplicates nothing: `capability.ts` derives availability from authored
 * code, which is exactly what does not exist yet while a month is being
 * written. So the budget below is the AUTHORING-time statement of the same
 * sequencing, taken from the programme's per-month mastery paragraphs, and the
 * derived model in `capability.ts` is what checks it once the content lands.
 *
 * Being stricter here than the runtime is the point: catching «October used
 * sorted()» while October is open costs a minute, and catching it after the
 * month is frozen costs a re-review.
 */
const MONTH_BUDGET: Record<number, ConstructId[]> = {
  /* Derived from September's own shown code, computed via `teachingOrder()` +
     `shownCode()`.

     It used to carry four extras "its reference solutions use and therefore
     treat as available": abs(), <=, != and a float literal. That phrasing was
     the defect written down — a solution using something the month never shows
     is not a construct the month has, it is a task outrunning its month. Three
     of the four are now genuinely shown in September (`!=` and `<=` at
     m1.l6.b1, a float literal at m1.l10.b1) and belong here on their own
     merits. `abs()` is gone: `m1.p8` no longer uses it, September has no skill
     for it, and it is first shown in month four. */
  1: [
    "stmt.assign", "stmt.assign_unpack",
    "stmt.if", "stmt.elif", "stmt.else",
    "op.add", "op.sub", "op.mul", "op.truediv", "op.floordiv", "op.mod", "op.pow",
    "cmp.eq", "cmp.ne", "cmp.lt", "cmp.gt", "cmp.le", "cmp.ge",
    "logic.and", "logic.or", "logic.not",
    "builtin.print", "builtin.input", "builtin.int", "builtin.float", "builtin.str",
    "builtin.map",
    "method.split",
    "literal.int", "literal.float", "literal.str", "literal.bool",
  ],
  2: [
    "stmt.for", "stmt.while", "stmt.break", "stmt.continue",
    "stmt.assign_augmented",
    "builtin.range", "builtin.len", "builtin.list",
    "literal.list", "expr.subscript", "expr.slice",
    "logic.in", "method.append", "method.join",
  ],
  3: ["stmt.def", "stmt.return", "stmt.global"],
  /* Ordering and the aggregate builtins arrive together, and deliberately late:
     October's «тізімдегі максимум мен минимум», «қосынды және орташа мән» and
     «тізімді кері аудару» are the traversal being taught, and November asks for
     a max/min FUNCTION. min(), max(), sum(), sorted() and reversed() available
     any earlier would delete the exercise. */
  4: ["builtin.sorted", "builtin.reversed", "builtin.min", "builtin.max", "builtin.sum", "method.sort"],
  5: [],
  6: [],
  7: [],
  8: [],
  9: [],
};

function budgetFor(month: number): Set<string> {
  const out = new Set<string>();
  for (let m = 1; m <= month; m += 1) for (const c of MONTH_BUDGET[m] ?? []) out.add(c);
  return out;
}

const LABEL = new Map(CONSTRUCTS.map((c) => [c.id, c.label]));

/* -------------------------------------------------------------------------- */

const errors: string[] = [];
const warnings: string[] = [];
let checked = 0;
let solutionsRun = 0;
let casesRun = 0;

function err(id: string, msg: string) {
  errors.push(`✗ ${id}: ${msg}`);
}
function warn(id: string, msg: string) {
  warnings.push(`! ${id}: ${msg}`);
}

/** Month index inferred from the id, e.g. `m2.l3.b1` → 2. */
function monthOf(id: string): number | null {
  const m = /^m(\d+)\./.exec(id);
  return m ? Number(m[1]) : null;
}

function checkConstructs(id: string, label: string, code: string) {
  const month = monthOf(id);
  if (month === null) return;
  const allowed = budgetFor(month);
  const used = extractConstructs(code);
  const over = [...used].filter((c) => !allowed.has(c));
  for (const c of over) {
    err(
      id,
      `${label} uses ${LABEL.get(c) ?? c}, which month ${month} has not taught ` +
        `(construct ${c})`,
    );
  }
}

function checkBlock(block: LessonBlock, file: string) {
  checked += 1;
  const id = block.id;

  /* -- provenance and skills -------------------------------------------- */
  if (!block.sourceType) err(id, "no sourceType");
  if (block.sourceType === "curriculum-derived" && block.pdfPage === undefined) {
    err(id, "claims curriculum provenance but cites no PDF page");
  }
  if (ATTEMPT_BLOCK_TYPES.has(block.type) && block.skillRefs.length === 0) {
    err(id, "attempt block declares no skills — its evidence goes nowhere");
  }
  for (const s of block.skillRefs) {
    const skill = SKILL_BY_ID.get(s);
    if (!skill) err(id, `unknown skill "${s}"`);
    else {
      const month = monthOf(id);
      if (month !== null && skill.introducedInMonth > month) {
        err(id, `uses skill "${s}" introduced in month ${skill.introducedInMonth}`);
      }
    }
  }

  /* -- localisation ------------------------------------------------------ */
  const strings: [string, { kk?: string; ru?: string } | undefined][] = [];
  if ("prompt" in block) strings.push(["prompt", block.prompt as { kk: string; ru: string }]);
  if ("title" in block) strings.push(["title", block.title as { kk: string; ru: string }]);
  if ("body" in block) strings.push(["body", block.body as { kk: string; ru: string }]);
  if ("problem" in block) strings.push(["problem", block.problem as { kk: string; ru: string }]);
  for (const [name, v] of strings) {
    if (!v?.kk?.trim()) err(id, `${name} has no Kazakh`);
    if (!v?.ru?.trim()) err(id, `${name} has no Russian`);
    if (v?.kk && v.kk === v.ru) err(id, `${name}: ru is a byte copy of kk`);
  }

  /* -- diagnostic mappings ---------------------------------------------- */
  if (block.diagnosticMapping) {
    if (!ATTEMPT_BLOCK_TYPES.has(block.type)) {
      err(id, "carries a diagnostic mapping but is not an attempt block");
    }
    for (const [answer, entry] of Object.entries(block.diagnosticMapping)) {
      if (!entry.justification || entry.justification.trim().length < 20) {
        err(id, `diagnostic mapping for "${answer}" has no real justification`);
      }
      if (!entry.failureClass?.trim()) err(id, `mapping for "${answer}" names no failure class`);
    }
  }

  /* -- checker ----------------------------------------------------------- */
  const checker: OutputChecker =
    ("checker" in block ? (block.checker as OutputChecker | undefined) : undefined) ?? DEFAULT_CHECKER;
  if ("checker" in block && block.checker) {
    const problem = checkerProblem(block.checker);
    if (problem) err(id, `unusable checker — ${problem}`);
  }

  /* -- every snippet the learner sees must be real Python ---------------- */
  const snippets: [string, string][] = [];
  if ("code" in block && typeof block.code === "string" && block.code.trim()) {
    snippets.push(["code", block.code]);
  }
  if (block.type === "find_bug") snippets.push(["fixedCode", block.fixedCode]);
  if (block.type === "reorder_code") {
    const joined = block.correctOrder
      .map((lid) => block.lines.find((l) => l.id === lid)?.code ?? `# MISSING ${lid}`)
      .join("\n");
    snippets.push(["correctOrder", joined]);
    const ids = new Set(block.lines.map((l) => l.id));
    for (const lid of block.correctOrder) {
      if (!ids.has(lid)) err(id, `correctOrder names line "${lid}" that does not exist`);
    }
    if (block.correctOrder.length !== block.lines.length) {
      err(id, `correctOrder has ${block.correctOrder.length} ids for ${block.lines.length} lines`);
    }
  }
  if (block.type === "fill_blank") {
    let i = 0;
    const filled = block.template.replace(/___/g, () => block.blanks[i++]?.answer ?? "");
    const holes = (block.template.match(/___/g) ?? []).length;
    if (holes !== block.blanks.length) {
      err(id, `template has ${holes} blanks but ${block.blanks.length} answers`);
    }
    snippets.push(["filledTemplate", filled]);
  }
  if ("starter" in block && typeof block.starter === "string" && block.starter.trim()) {
    snippets.push(["starter", block.starter]);
  }
  for (const [label, code] of snippets) {
    const c = compiles(code);
    if (!c.ok) err(id, `${label} is not valid Python:\n${c.err}`);
    else checkConstructs(id, label, code);
    /*
     * A blank placeholder that escaped into a program.
     *
     * `___` is a legal Python identifier, so `compile()` accepts it without a
     * murmur and every other gate in this file passes. A careless whole-file
     * string replace put one inside a worked example's code four hundred lines
     * from the block being edited, and nothing caught it — the learner would
     * have met a fully reasoned example with a hole where a loop condition
     * belonged. Only `fill_blank.template` may contain them.
     */
    if (block.type !== "fill_blank" && code.includes("___")) {
      err(id, `${label} contains a \`___\` placeholder — only a fill_blank template may`);
    }
  }

  /* -- reference solutions, executed ------------------------------------- */
  if ("referenceSolution" in block && typeof block.referenceSolution === "string") {
    const sol = block.referenceSolution;
    if (!sol.trim()) err(id, "empty referenceSolution");
    else {
      const c = compiles(sol);
      if (!c.ok) err(id, `referenceSolution is not valid Python:\n${c.err}`);
      else checkConstructs(id, "referenceSolution", sol);
    }
    const cases = "cases" in block && Array.isArray(block.cases) ? block.cases : [];
    if (!cases.length) err(id, "has a reference solution but no cases");
    else {
      solutionsRun += 1;
      for (const cse of cases) {
        casesRun += 1;
        const got = run(sol, cse.input);
        if (!got.ok) {
          err(id, `reference solution crashed on ${JSON.stringify(cse.input)}: ${got.err}`);
          continue;
        }
        if (!checkOutput(got.out, cse.expectedOutput, checker)) {
          err(
            id,
            `reference solution fails its own case ${JSON.stringify(cse.input)}` +
              `${cse.hidden ? " [hidden]" : ""}\n    expected: ${JSON.stringify(cse.expectedOutput)}` +
              `\n    actual:   ${JSON.stringify(got.out)}`,
          );
        }
      }
    }
  }

  if ("cases" in block && Array.isArray(block.cases) && block.cases.length) {
    if (!block.cases.some((c) => c.hidden)) {
      err(id, "no hidden case — a learner passes it by printing the visible sample");
    }
    const seen = new Set<string>();
    for (const c of block.cases) {
      if (seen.has(c.input)) warn(id, `duplicate case input ${JSON.stringify(c.input)}`);
      seen.add(c.input);
    }

    /*
     * A layout the prompt asks for and the checker does not enforce.
     *
     * `m2.l3.b8` required one digit per line and showed a three-line sample,
     * but `token` splits on all whitespace — so a program printing every digit
     * on ONE line was graded correct against a prompt that forbids it. The
     * learner is told the format matters and then finds it does not, which is
     * the same lie in the other direction from marking them wrong on a space.
     *
     * A warning rather than an error: a multi-line answer whose prompt never
     * claims a layout is legitimately `token`. The author decides, but they
     * have to have decided.
     */
    const multiline = block.cases.some((c) => c.expectedOutput.includes("\n"));
    if (multiline && checker.kind === "token") {
      warn(
        id,
        "expected output spans several lines but the checker is `token`, which accepts " +
          "them all on one line. If the prompt states a layout, declare { kind: \"exact\" }",
      );
    }
  }

  /* -- predictions state what Python prints ------------------------------ */
  if (block.type === "prediction") {
    const got = run(block.code, block.stdin ?? "");
    const actual = got.out.replace(/\s+$/, "");
    if (actual !== block.answer.trim()) {
      err(
        id,
        `stored answer is not what Python prints\n    stored: ${JSON.stringify(block.answer)}` +
          `\n    actual: ${JSON.stringify(actual)}${got.err ? `\n    stderr: ${got.err}` : ""}`,
      );
    }
    if (block.options?.length && !block.options.includes(block.answer)) {
      err(id, "the correct answer is not among the options");
    }
    if (block.options && new Set(block.options).size !== block.options.length) {
      err(id, "duplicate options");
    }
  }

  /* -- find_bug: the defect must be real and reproducible ---------------- */
  if (block.type === "find_bug") {
    const lines = block.code.replace(/\n$/, "").split("\n");
    if (block.buggyLine < 1 || block.buggyLine > lines.length) {
      err(id, `buggyLine ${block.buggyLine} is out of range (1..${lines.length})`);
    }
    const probes = block.symptomInput
      ? [block.symptomInput]
      : ["0", "1", "5", "17", "18", "19", "49", "50", "69", "70", "84", "85", "90"];
    const differs = probes.some((p) => {
      const a = run(block.code, p);
      const b = run(block.fixedCode, p);
      return a.out.replace(/\s+$/, "") !== b.out.replace(/\s+$/, "") || a.ok !== b.ok;
    });
    if (!differs) {
      err(
        id,
        block.symptomInput
          ? `symptomInput ${JSON.stringify(block.symptomInput)} does not expose the bug`
          : "the buggy and fixed programs behave identically on the numeric probe — declare symptomInput",
      );
    }
  }

  /* -- multiple choice --------------------------------------------------- */
  if (block.type === "multiple_choice") {
    const ids = block.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) err(id, "duplicate option ids");
    if (!ids.includes(block.correctOptionId)) err(id, "correctOptionId is not among the options");
    if (block.options.length < 3) warn(id, `only ${block.options.length} options`);
    const kk = block.options.map((o) => o.label.kk.trim());
    if (new Set(kk).size !== kk.length) err(id, "two options are the same in Kazakh");
    const ru = block.options.map((o) => o.label.ru.trim());
    if (new Set(ru).size !== ru.length) err(id, "two options are the same in Russian");
  }

  /* -- trace_code -------------------------------------------------------- */
  if (block.type === "trace_code") {
    const n = block.code.replace(/\n$/, "").split("\n").length;
    for (const step of block.steps) {
      if (step.line < 1 || step.line > n) {
        err(id, `trace step names line ${step.line}, the program has ${n}`);
      }
    }
    if (!block.steps.length) err(id, "trace with no steps");
  }

  /* -- verify ------------------------------------------------------------ */
  if (block.type === "verify") {
    if ((block.mode === "find_bug" || block.mode === "manual_trace") && !block.code?.trim()) {
      err(id, `${block.mode} check with no program to show`);
    }
    if (block.mode === "oral_explanation" && !block.expectedPoints?.length) {
      warn(id, "oral explanation with no marking points — the teacher invents them per learner");
    }
  }

  /* -- explain ----------------------------------------------------------- */
  if (block.type === "explain" && !block.expectedPoints?.length) {
    err(id, "explain block with no expectedPoints");
  }

  /* -- test_case --------------------------------------------------------- */
  if (block.type === "test_case") {
    if (!block.breakingInputs.length) err(id, "test_case names no breaking input");
    const c = compiles(block.code);
    if (!c.ok) err(id, `test_case code is not valid Python:\n${c.err}`);
  }
}

/* -------------------------------------------------------------------------- */

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: tsx scripts/check-blocks.ts <file...>");
    process.exit(2);
  }

  try {
    execFileSync(PYTHON, ["--version"], { stdio: "pipe" });
  } catch {
    console.error(`[check-blocks] ${PYTHON} is not available — nothing would be executed.`);
    process.exit(2);
  }

  const ids = new Map<string, string>();

  /*
   * Every sibling in the same month directory is loaded too, even when only one
   * file was named on the command line.
   *
   * The most common defect the first adversarial review found was a task whose
   * answer is already on screen — and in several cases the program was on
   * screen in a DIFFERENT lesson of the same month. An author checking one file
   * cannot see that, and telling them to check by hand is how it got shipped
   * twice. Siblings are read for the duplicate-program comparison only; they
   * are not re-validated, so naming one file still reports on one file.
   */
  const named = new Set(files.map((f) => path.resolve(f)));
  const siblings = new Set<string>();
  for (const f of named) {
    const dir = path.dirname(f);
    if (!/[/\\]m\d\d$/.test(dir)) continue;
    for (const entry of readdirSync(dir)) {
      const abs = path.join(dir, entry);
      if (entry.endsWith(".ts") && !named.has(abs)) siblings.add(abs);
    }
  }

  /** Programs a learner is SHOWN, and programs that are an answer. */
  const shownBy = new Map<string, string>();
  const solutionOf: { id: string; program: string; own: boolean }[] = [];

  function collectPrograms(block: LessonBlock, own: boolean) {
    const shown: string[] = [];
    if ("code" in block && typeof block.code === "string" && block.code.trim()) shown.push(block.code);
    if (block.type === "find_bug") shown.push(block.fixedCode);
    if (block.type === "worked_example") shown.push(block.code);
    if (block.type === "reorder_code") {
      shown.push(block.correctOrder.map((l) => block.lines.find((x) => x.id === l)?.code ?? "").join("\n"));
    }
    if (block.type === "fill_blank") {
      let i = 0;
      shown.push(block.template.replace(/___/g, () => block.blanks[i++]?.answer ?? ""));
    }
    for (const s of shown) {
      const k = norm(s);
      if (k && !shownBy.has(k)) shownBy.set(k, block.id);
    }
    if ("referenceSolution" in block && typeof block.referenceSolution === "string") {
      solutionOf.push({ id: block.id, program: norm(block.referenceSolution), own });
    }
  }

  for (const file of files) {
    const abs = path.resolve(file);
    const mod = (await import(pathToFileURL(abs).href)) as Record<string, unknown>;
    const arrays = Object.entries(mod).filter(
      ([, v]) => Array.isArray(v) && v.every((b) => b && typeof b === "object" && "type" in b),
    );
    if (!arrays.length) {
      errors.push(`✗ ${file}: exports no LessonBlock[]`);
      continue;
    }
    for (const [name, value] of arrays) {
      for (const block of value as LessonBlock[]) {
        const prev = ids.get(block.id);
        if (prev) err(block.id, `duplicate id — also in ${prev}`);
        ids.set(block.id, `${file}:${name}`);
        checkBlock(block, file);
        collectPrograms(block, true);
      }
    }
  }

  for (const abs of siblings) {
    try {
      const mod = (await import(pathToFileURL(abs).href)) as Record<string, unknown>;
      for (const v of Object.values(mod)) {
        if (!Array.isArray(v)) continue;
        for (const block of v as LessonBlock[]) {
          if (block && typeof block === "object" && "type" in block) collectPrograms(block, false);
        }
      }
    } catch {
      /* A sibling that does not import is not this run's problem. */
    }
  }

  /*
   * The check itself. A reference solution that is byte-identical to a program
   * the learner has already been SHOWN is transcription, not a task — and the
   * review found it in October's palindrome, its vowel count, its primality
   * check and November's helper tasks, all of which had passed every gate.
   */
  /**
   * A support twin and the task it substitutes for are the SAME problem, so of
   * course they share an answer — and no learner ever sees both, because the
   * `tracks` arrays put them on different routes. `m2.l5.b6s` and `m2.l5.b6`
   * are not a duplicate; they are the mechanism.
   *
   * The defect is a task sharing its answer with something the SAME learner has
   * already been shown, which is what everything below is about.
   */
  const twinned = (a: string, b: string) => a === `${b}s` || b === `${a}s`;

  const seenSolutions = new Map<string, string>();
  for (const s of solutionOf) {
    if (!s.own || !s.program) continue;
    const shower = shownBy.get(s.program);
    if (shower && shower !== s.id && !twinned(shower, s.id)) {
      err(
        s.id,
        `its reference solution is byte-identical to a program the learner is SHOWN at ` +
          `${shower} — the task is transcription, not work`,
      );
    }
    const twin = seenSolutions.get(s.program);
    if (twin && twin !== s.id && !twinned(twin, s.id)) {
      err(s.id, `its reference solution is byte-identical to ${twin}'s — one of them is not a task`);
    }
    if (!seenSolutions.has(s.program)) seenSolutions.set(s.program, s.id);
  }

  const tasks = [...ids.keys()].length;
  console.log("");
  console.log(`  check-blocks — ${files.length} file(s)`);
  console.log(`  ${checked} blocks · ${solutionsRun} reference solutions · ${casesRun} cases executed`);
  console.log("");
  if (warnings.length) {
    console.log(`  ${warnings.length} warning(s)`);
    for (const w of warnings) console.log(`    ${w}`);
    console.log("");
  }
  if (errors.length) {
    console.log(`  ${errors.length} ERROR(S)`);
    for (const e of errors) console.log(`    ${e}`);
    console.log("");
    process.exit(1);
  }
  console.log(`  ✓ clean — ${tasks} block ids, every reference solution passes every case`);
  console.log("");
}

void main();
