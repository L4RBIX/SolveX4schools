import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { MONTHS } from "@schools/curriculum/months";
import type { LessonBlock, Localized, Month } from "@schools/curriculum/types";

/**
 * Content integrity: the things a compiler and a grader both wave through.
 *
 * ## Why this file exists
 *
 * `check-blocks` compiles every snippet and executes every reference solution
 * against every case, and `content-execution.test.ts` does the same in CI. Both
 * are about programs that are GRADED. Two whole classes sit outside that:
 *
 * 1. **A worked example is never run.** It has no cases and no reference
 *    solution, so nothing has ever checked that the output it CLAIMS is the
 *    output its code produces. A worked example is the one block a learner is
 *    told to trust — it is the model they reason from — and a wrong one teaches
 *    the wrong thing before they ever meet a grader.
 *
 * 2. **A placeholder is valid Python and valid prose.** `___` is a legal
 *    identifier; a stray `TODO` in a prompt is a legal sentence. Both compile,
 *    both render, and a learner meets them. One of these actually happened: a
 *    whole-file string replace put `___` inside `m5.l7.b2`'s worked example
 *    four hundred lines from the block being edited. `compile()` accepted it,
 *    the block is not a `fill_blank` so no blank-count rule applied, and it has
 *    no solution to execute. It was found by reading the file.
 *
 * ## What is asserted about worked examples
 *
 * All 38 are executed. That took a schema addition: 11 of them read stdin, and
 * `WorkedExampleBlock` had no field to say what with, so the sample lived in
 * the `problem` prose where no test could reach it. It now carries `stdin`, the
 * same field `PredictionBlock` has had for the same reason. The first version
 * of this file could check 27 and had to NAME the other 11 as unverifiable,
 * which is the honest way to ship a partial check — but a worked example is the
 * one block a learner is told to trust, so eleven unchecked ones was not a
 * state to leave.
 *
 * The guard against that quietly regressing is here too: a worked example that
 * reads input and declares no `stdin` fails the first test in this file, rather
 * than dropping out of the set and letting the suite report success over
 * whatever is left.
 *
 * The check is deliberately weak in one direction. `result` is Localized prose,
 * not a raw string, so it is asserted to CONTAIN the numbers the program prints
 * rather than to equal its output. That catches the failure that matters — a
 * stated answer the program does not produce — without demanding the prose be
 * a transcript.
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

function run(source: string, stdin: string): { ok: boolean; out: string; err: string } {
  try {
    const out = execFileSync(PYTHON, ["-I", "-S", "-c", source], {
      input: stdin.endsWith("\n") || stdin === "" ? stdin : `${stdin}\n`,
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

interface Located {
  block: LessonBlock;
  where: string;
}

function walk(month: Month): Located[] {
  const out: Located[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) out.push({ block, where: `${month.monthName.kk}/${lesson.id}` });
    }
  }
  for (const block of month.assessment?.blocks ?? []) {
    out.push({ block, where: `${month.monthName.kk}/${month.assessment!.id}` });
  }
  return out;
}

const ALL = MONTHS.flatMap(walk);
const python = hasPython();

/* -------------------------------------------------------------------------- */
/* Worked examples                                                            */
/* -------------------------------------------------------------------------- */

const WORKED = ALL.filter((e) => e.block.type === "worked_example");
/* A worked example is runnable when it reads nothing, or when it declares the
   input it is reasoned over. The eleven that read stdin now do — see the
   `stdin` field on `WorkedExampleBlock` and why it was added. */
const RUNNABLE = WORKED.filter((e) => {
  const b = e.block as { code: string; stdin?: string };
  return !b.code.includes("input(") || typeof b.stdin === "string";
});
const UNVERIFIABLE = WORKED.filter((e) => {
  const b = e.block as { code: string; stdin?: string };
  return b.code.includes("input(") && typeof b.stdin !== "string";
});

describe("a worked example prints what it says it prints", () => {
  it("has worked examples to check, and says how many it cannot", () => {
    expect(WORKED.length).toBeGreaterThan(10);
    /* Every worked example that reads input must say what with. Without this
       the set below silently shrinks and the suite reports success over
       whatever happens to be left. */
    expect(
      UNVERIFIABLE.map((e) => e.block.id),
      "worked examples that read stdin but declare no `stdin` cannot be checked " +
        "against real Python — add the sample their `problem` already states",
    ).toEqual([]);
    // Not an assertion about the content — a statement of this file's reach.
    // eslint-disable-next-line no-console
    console.log(
      `  worked examples: ${WORKED.length} total · ${RUNNABLE.length} executed against real Python`,
    );
  });

  for (const { block, where } of RUNNABLE) {
    if (block.type !== "worked_example") continue;
    it.runIf(python)(`${block.id} (${where})`, () => {
      const got = run(block.code, block.stdin ?? "");
      expect(got.ok, `${block.id} crashed:\n${got.err}\n${block.code}`).toBe(true);

      const printed = got.out.trim();
      if (!printed) return; // A worked example that prints nothing states no result to check.

      /* Every distinct number the program prints must appear somewhere in the
         stated result. Numbers rather than the whole transcript, because the
         result is a sentence in two languages and the claim being checked is
         "the answer it names is the answer it computes". */
      const numbers = [...new Set(printed.match(/-?\d+(?:\.\d+)?/g) ?? [])];
      const stated = `${block.result.kk} ${block.result.ru}`;
      const missing = numbers.filter((n) => !stated.includes(n));
      expect(
        missing,
        `${block.id} (${where}) prints ${JSON.stringify(printed)} but its stated result ` +
          `never mentions ${missing.join(", ")}:\n  kk: ${block.result.kk}\n  ru: ${block.result.ru}`,
      ).toEqual([]);
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Placeholders and truncation                                                */
/* -------------------------------------------------------------------------- */

/** Every learner-facing string on a block, with a label saying where it lives. */
function textsOf(block: LessonBlock): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  const push = (label: string, v: unknown) => {
    if (v && typeof v === "object" && "kk" in (v as object)) {
      const l = v as Localized;
      out.push({ label: `${label}.kk`, text: l.kk }, { label: `${label}.ru`, text: l.ru });
    }
  };
  const any = block as unknown as Record<string, unknown>;
  for (const key of ["prompt", "title", "body", "problem", "result"]) push(key, any[key]);
  for (const key of ["steps", "expectedPoints"]) {
    const v = any[key];
    if (Array.isArray(v)) v.forEach((s, i) => push(`${key}[${i}]`, s));
  }
  if (Array.isArray(any.options)) {
    (any.options as { id: string; label?: Localized }[]).forEach((o) => push(`option ${o.id}`, o.label));
  }
  if (any.diagnosticMapping && typeof any.diagnosticMapping === "object") {
    for (const [answer, entry] of Object.entries(any.diagnosticMapping as Record<string, { justification: string }>)) {
      out.push({ label: `diagnostic[${answer}]`, text: entry.justification });
    }
  }
  return out;
}

/** Every Python string on a block. */
function codesOf(block: LessonBlock): { label: string; code: string }[] {
  const out: { label: string; code: string }[] = [];
  const any = block as unknown as Record<string, unknown>;
  for (const key of ["code", "fixedCode", "starter", "referenceSolution", "template"]) {
    const v = any[key];
    if (typeof v === "string" && v.trim()) out.push({ label: key, code: v });
  }
  if (block.type === "reorder_code") {
    out.push({ label: "lines", code: block.lines.map((l) => l.code).join("\n") });
  }
  return out;
}

/**
 * Markers that mean an author was interrupted.
 *
 * Deliberately narrow. A rule that fires on legitimate curriculum prose is a
 * rule the next person disables, so this looks only for tokens that no Kazakh
 * or Russian sentence about programming would contain by accident.
 */
const ABANDONED = [
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bXXX\b/,
  /\bTBD\b/,
  /<INSERT[^>]*>/i,
  /\bPLACEHOLDER\b/i,
  /\bLorem ipsum\b/i,
  /\bWRITE ME\b/i,
];

describe("nothing half-written reached a learner", () => {
  it("has content to scan", () => {
    expect(ALL.length).toBeGreaterThan(100);
  });

  it("carries no abandoned-work marker in any learner-facing string", () => {
    const found: string[] = [];
    for (const { block, where } of ALL) {
      for (const { label, text } of textsOf(block)) {
        for (const re of ABANDONED) {
          if (re.test(text)) found.push(`${block.id} (${where}) ${label}: matches ${re}`);
        }
      }
      for (const { label, code } of codesOf(block)) {
        for (const re of ABANDONED) {
          if (re.test(code)) found.push(`${block.id} (${where}) ${label}: matches ${re}`);
        }
      }
    }
    expect(found, `\n${found.map((f) => `  · ${f}`).join("\n")}\n`).toEqual([]);
  });

  it("carries no blank placeholder outside a fill_blank template", () => {
    /* The regression test for the actual incident. `___` is a legal Python
       identifier, so it survives compile(); it is only wrong because of WHERE
       it is. `check-blocks` enforces the same rule at authoring time — this is
       the CI half, so the guarantee does not depend on anyone running a script. */
    const found: string[] = [];
    for (const { block, where } of ALL) {
      for (const { label, code } of codesOf(block)) {
        if (block.type === "fill_blank" && label === "template") continue;
        if (code.includes("___")) found.push(`${block.id} (${where}) ${label} contains \`___\``);
      }
    }
    expect(found, `\n${found.map((f) => `  · ${f}`).join("\n")}\n`).toEqual([]);
  });

  it("has no learner-facing string that stops mid-sentence", () => {
    /* An ASCII "..." at the very end is what a truncated paste looks like. The
       typographic ellipsis "…" is excluded on purpose: the curriculum uses it
       constantly and correctly — «1 + 2 + … + n» — and flagging it would make
       this rule noise. */
    const found: string[] = [];
    for (const { block, where } of ALL) {
      for (const { label, text } of textsOf(block)) {
        if (/\.\.\.\s*$/.test(text)) found.push(`${block.id} (${where}) ${label} ends in "..."`);
        if (text.trim() === "") found.push(`${block.id} (${where}) ${label} is empty`);
      }
    }
    expect(found, `\n${found.map((f) => `  · ${f}`).join("\n")}\n`).toEqual([]);
  });

  it("closes every inline-code span it opens", () => {
    /* Prompts are rendered as text with markdown-ish backticks by convention.
       An odd count means one span swallowed the rest of the sentence in every
       reader's head, if not in the DOM. */
    const found: string[] = [];
    for (const { block, where } of ALL) {
      for (const { label, text } of textsOf(block)) {
        const ticks = (text.match(/`/g) ?? []).length;
        if (ticks % 2 !== 0) found.push(`${block.id} (${where}) ${label} has ${ticks} backticks`);
      }
    }
    expect(found, `\n${found.map((f) => `  · ${f}`).join("\n")}\n`).toEqual([]);
  });
});
