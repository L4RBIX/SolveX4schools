#!/usr/bin/env tsx
/**
 * The localisation review package, and the pre-pass that makes it finishable.
 *
 * Every learner-facing string in this curriculum was written by an agent. Two
 * of them are in languages — Kazakh and Russian — that no automated check in
 * this repository can read. A native speaker has to, and «review the
 * curriculum» is not a task anybody completes: it is 615 blocks across nine
 * months, each carrying a prompt, often options, often expected points.
 *
 * So this splits the job into what a machine can settle and what only a person
 * can, and orders the rest by what it costs to get wrong.
 *
 * ## What a machine can settle
 *
 * Four signals, all of them about the RELATIONSHIP between the two languages
 * rather than about either one:
 *
 * - **identical** — kk and ru are the same string, and at least one of them
 *   contains Cyrillic. Without that second condition the signal is useless:
 *   `len(a) - 1` and `x >= 10 and x <= 20` are options that SHOULD be identical,
 *   and thirty of them buried everything else.
 * - **no Kazakh letters** — a `kk` string of real length containing none of
 *   ә ғ қ ң ө ұ ү һ і. Kazakh prose above a few words essentially always
 *   contains one; Russian pasted into the Kazakh field never does.
 * - **Kazakh letters in Russian** — the same test in reverse, which catches the
 *   opposite slip.
 * - **length outlier** — the two versions differ in length by more than half.
 *   Russian runs a little longer than Kazakh on average; a 2x gap usually means
 *   one side lost a sentence.
 *
 * None of these is a verdict. They are places to look first.
 *
 * ## What only a person can settle
 *
 * Whether the Kazakh is Kazakh a fourteen-year-old reads, whether the
 * terminology matches what Kazakh schools actually use for «цикл», «функция»,
 * «жиым», and whether a prompt that is grammatically fine says the thing the
 * task needs it to say. The ordering below exists for that pass:
 *
 *   1. prompts on graded tasks   — a learner who misreads one loses the mark
 *   2. options and blanks        — a mistranslated distractor is unanswerable
 *   3. concepts and worked steps — a learner who misreads one learns it wrong
 *   4. expected points           — read by a teacher, who can compensate
 *
 *   npx tsx scripts/l10n-review.ts             # the signal summary
 *   npx tsx scripts/l10n-review.ts --flags     # every flagged string
 *   npx tsx scripts/l10n-review.ts --worklist  # counts per month per priority
 */
import { MONTHS } from "../schools/curriculum/months";
import { isTask } from "../schools/curriculum/inventory";
import type { LessonBlock, Localized, Month } from "../schools/curriculum/types";

const KAZAKH_ONLY = /[әғқңөұүһі]/i;

/** The sentence with its code taken out — backticked spans and bare symbols. */
function prose(text: string): string {
  return text
    .replace(/`[^`]*`/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Str {
  blockId: string;
  month: number;
  lesson: string;
  field: string;
  priority: 1 | 2 | 3 | 4;
  kk: string;
  ru: string;
}

function stringsOf(block: LessonBlock, month: number, lesson: string): Str[] {
  const out: Str[] = [];
  const any = block as unknown as Record<string, unknown>;
  const graded = isTask(block);
  const push = (field: string, priority: 1 | 2 | 3 | 4, v: unknown) => {
    if (!v || typeof v !== "object" || !("kk" in (v as object))) return;
    const l = v as Localized;
    out.push({ blockId: block.id, month, lesson, field, priority, kk: l.kk, ru: l.ru });
  };

  push("prompt", graded ? 1 : 3, any.prompt);
  push("problem", graded ? 1 : 3, any.problem);
  push("title", 3, any.title);
  push("body", 3, any.body);
  push("result", 3, any.result);
  if (Array.isArray(any.steps)) any.steps.forEach((s, i) => push(`steps[${i}]`, 3, s));
  if (Array.isArray(any.options)) {
    (any.options as { id: string; label?: Localized }[]).forEach((o) => push(`option ${o.id}`, 2, o.label));
  }
  if (Array.isArray(any.expectedPoints)) {
    any.expectedPoints.forEach((s, i) => push(`expectedPoints[${i}]`, 4, s));
  }
  return out;
}

/**
 * Strings that belong to the month, the unit or the lesson rather than a block.
 *
 * The first version of this script walked blocks only, and reported that it
 * covered every learner-facing string pair in the programme. It covered 1441 of
 * 1768. The 327 it missed were lesson titles, lesson objectives, unit titles,
 * month names, the month's own title, its mastery and explanation lines, its
 * end-of-month capability and practice outline, and both assessment titles and
 * descriptions — several of which a learner reads before they reach a single
 * block. A native reviewer working the published worklist would never have read
 * one lesson title.
 */
function structuralStrings(month: Month): Str[] {
  const out: Str[] = [];
  const at = (label: string, priority: 1 | 2 | 3 | 4, lesson: string, v: unknown) => {
    if (!v || typeof v !== "object" || !("kk" in (v as object))) return;
    const l = v as Localized;
    out.push({ blockId: `${lesson}·${label}`, month: month.index, lesson, field: label, priority, kk: l.kk, ru: l.ru });
  };
  const m = month as unknown as Record<string, unknown>;
  const id = `m${month.index}`;
  /* Priority 3: a learner reads these, and a wrong one misdescribes the work
     rather than making a task unanswerable. */
  for (const key of ["monthName", "title", "mastery", "explanation", "endOfMonthCapability", "practiceOutline"]) {
    at(key, 3, id, m[key]);
  }
  for (const unit of month.units) {
    at("unit title", 3, unit.id, (unit as unknown as Record<string, unknown>).title);
    for (const lesson of unit.lessons) {
      at("lesson title", 3, lesson.id, lesson.title);
      lesson.objectives.forEach((o, i) => at(`objective[${i}]`, 3, lesson.id, o));
    }
  }
  if (month.assessment) {
    at("assessment title", 3, month.assessment.id, month.assessment.title);
    at("assessment description", 3, month.assessment.id, month.assessment.description);
  }
  return out;
}

function walk(month: Month): Str[] {
  const out: Str[] = [...structuralStrings(month)];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const b of lesson.blocks) out.push(...stringsOf(b, month.index, lesson.id));
    }
  }
  for (const b of month.assessment?.blocks ?? []) {
    out.push(...stringsOf(b, month.index, month.assessment!.id));
  }
  return out;
}

const ALL = MONTHS.flatMap(walk);

type Flag = "identical" | "no Kazakh letters" | "Kazakh letters in Russian" | "length outlier";

function flagsFor(s: Str): Flag[] {
  const f: Flag[] = [];
  const kk = s.kk.trim();
  const ru = s.ru.trim();
  /* A string with no Cyrillic in it is code — `len(a) - 1`, `x >= 10 and x <=
     20`, `119 → no, 120 → yes`. Those SHOULD be identical in both languages,
     and flagging them buried the cases that matter under thirty that did not. */
  const isProse = /[\u0400-\u04FF]/.test(kk) || /[\u0400-\u04FF]/.test(ru);
  if (kk && kk === ru && isProse) f.push("identical");
  /* The letter tests run on PROSE, so backticked code and the symbols around it
     come out first. Without that, an option that is nine tenths Python and one
     Kazakh word gets flagged for having no Kazakh in it, which was true of
     every hit the first version produced. Short strings are exempt too: a
     two-word label may legitimately contain none of the nine. */
  const kkProse = prose(kk);
  const ruProse = prose(ru);
  if (kkProse.length > 30 && !KAZAKH_ONLY.test(kkProse)) f.push("no Kazakh letters");
  if (ruProse.length > 30 && KAZAKH_ONLY.test(ruProse)) f.push("Kazakh letters in Russian");
  if (kk.length > 40 && ru.length > 40) {
    const ratio = Math.max(kk.length, ru.length) / Math.min(kk.length, ru.length);
    if (ratio > 1.5) f.push("length outlier");
  }
  return f;
}

const flagged = ALL.map((s) => ({ s, f: flagsFor(s) })).filter((x) => x.f.length > 0);
const mode = process.argv.includes("--flags")
  ? "flags"
  : process.argv.includes("--worklist")
    ? "worklist"
    : "summary";

if (mode === "flags") {
  for (const { s, f } of flagged) {
    console.log(`\n${s.blockId} · ${s.field} · p${s.priority} · ${f.join(", ")}`);
    console.log(`  kk: ${s.kk.slice(0, 200)}`);
    console.log(`  ru: ${s.ru.slice(0, 200)}`);
  }
  console.log(`\n${flagged.length} flagged of ${ALL.length} strings`);
} else if (mode === "worklist") {
  const NAMES = ["", "graded prompts", "options and blanks", "concepts and worked steps", "expected points"];
  console.log("| Month | " + NAMES.slice(1).join(" | ") + " | Total | Flagged |");
  console.log("|---|---|---|---|---|---|---|");
  for (const m of MONTHS) {
    const mine = ALL.filter((s) => s.month === m.index);
    if (!mine.length) continue;
    const per = [1, 2, 3, 4].map((p) => mine.filter((s) => s.priority === p).length);
    const fl = flagged.filter((x) => x.s.month === m.index).length;
    console.log(`| ${m.index} ${m.monthName.kk} | ${per.join(" | ")} | ${mine.length} | ${fl} |`);
  }
  const per = [1, 2, 3, 4].map((p) => ALL.filter((s) => s.priority === p).length);
  console.log(`| **Year** | ${per.map((n) => `**${n}**`).join(" | ")} | **${ALL.length}** | **${flagged.length}** |`);
} else {
  console.log("");
  console.log(`  ${ALL.length} learner-facing string pairs across ${MONTHS.filter((m) => m.units.some((u) => u.lessons.some((l) => l.blocks.length))).length} months`);
  console.log("");
  const counts = new Map<Flag, number>();
  for (const { f } of flagged) for (const x of f) counts.set(x, (counts.get(x) ?? 0) + 1);
  console.log("  mechanical signals (places to look first, not verdicts):");
  for (const k of ["identical", "no Kazakh letters", "Kazakh letters in Russian", "length outlier"] as Flag[]) {
    console.log(`    ${k.padEnd(28)}${counts.get(k) ?? 0}`);
  }
  console.log(`    ${"— flagged pairs".padEnd(28)}${flagged.length}`);
  console.log("");
  const NAMES = ["", "graded prompts", "options and blanks", "concepts and worked steps", "expected points"];
  console.log("  by review priority:");
  for (const p of [1, 2, 3, 4]) {
    console.log(`    ${p}. ${NAMES[p].padEnd(26)}${ALL.filter((s) => s.priority === p).length}`);
  }
  console.log("");
}
