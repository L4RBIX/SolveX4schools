#!/usr/bin/env tsx
/**
 * What the programme counts, and what we count.
 *
 * "475 authored against 279 promised" was an apples-to-oranges comparison and
 * this script exists to replace it. The two numbers were never the same unit:
 * 279 is the sum of the PDF's per-month «Практика: шамамен N тапсырма» figures,
 * and 475 was every attempt-bearing block in the repository — lesson practice,
 * monthly checks, May's contests and the optional extras all added together.
 *
 * ## What the PDF means by «тапсырма»
 *
 * The document is unusually explicit, in three places:
 *
 * 1. p.3, «Тапсырма түрлері» — the task types, enumerated: «Нөлден жазу ғана
 *    емес: дайын бөліктерден құрастыру, бөтен кодтан қате іздеу, нәтижені
 *    болжау, жетіспейтін жолды толықтыру.» Writing from scratch, assembling
 *    from ready parts, finding a bug in someone else's code, predicting the
 *    result, completing a missing line. That list is our block taxonomy:
 *    `write_code`, `reorder_code`, `find_bug`, `prediction`, `fill_blank`.
 *    So «тапсырма» is NOT "coding problem" — it is any block the learner acts
 *    on, which is exactly `ATTEMPT_BLOCK_TYPES`.
 *
 * 2. Each month states «Практика: шамамен N тапсырма» and then, in a SEPARATE
 *    paragraph, «Айлық сынақ». The monthly check is not inside the practice
 *    count.
 *
 * 3. p.11 gives the year as «шамамен 250 оқу тапсырмасы, оның ішінде шамамен
 *    100 толық дербес шешім» — of which about 100 are complete independent
 *    solutions. So the 250 is a mixed total with independence as a subset,
 *    which only makes sense on the reading above.
 *
 * The same page adds the qualifier that decides where the optional bank sits:
 * «Бұл минимум жиын; платформада **қосымша есептер** бар». The counts are a
 * floor, and additional problems beyond it are anticipated by the document
 * itself. That is what `bank` marks.
 *
 * ## The comparison this script makes
 *
 * PDF-comparable = attempt blocks, in LESSONS, on the core route, that are not
 * in the bank. Assessment blocks are excluded because the PDF excludes them.
 * May's contest problems are included, because May's own «Практика» paragraph
 * is the contest structure.
 *
 *   npx tsx scripts/reconcile-counts.ts
 *   npx tsx scripts/reconcile-counts.ts --markdown
 */
import { MONTHS } from "../schools/curriculum/months";
import { isTask } from "../schools/curriculum/inventory";
import { ATTEMPT_BLOCK_TYPES } from "../schools/curriculum/types";
import type { LessonBlock, Month } from "../schools/curriculum/types";

const TRACK = "core";
const CONTEST_LESSON = /^m\d+\.c\d+$/;

/** A complete program written from nothing — the PDF's «толық дербес шешім». */
function isIndependent(b: LessonBlock): boolean {
  if (b.type === "challenge") return true;
  if (b.type === "write_code") return !b.starter?.trim();
  if (b.type === "verify") return b.mode === "unseen_problem";
  return false;
}

/** Any block whose answer is a program the learner writes or edits. */
const CODING = new Set<LessonBlock["type"]>(["write_code", "modify_code", "challenge"]);

interface Row {
  month: number;
  name: string;
  promised: number;
  explanation: number;
  /** PDF-comparable: lesson attempt blocks, core route, not bank. */
  practice: number;
  guidedCoding: number;
  independentCoding: number;
  otherInteraction: number;
  assessment: number;
  contest: number;
  bank: number;
  totalBlocks: number;
  totalAttempt: number;
}

function rowFor(month: Month): Row {
  const r: Row = {
    month: month.index,
    name: month.monthName.kk,
    promised: month.expectedTaskCount,
    explanation: 0,
    practice: 0,
    guidedCoding: 0,
    independentCoding: 0,
    otherInteraction: 0,
    assessment: 0,
    contest: 0,
    bank: 0,
    totalBlocks: 0,
    totalAttempt: 0,
  };
  const visible = (b: LessonBlock) => !b.tracks || (b.tracks as readonly string[]).includes(TRACK);

  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const b of lesson.blocks) {
        if (!visible(b)) continue;
        r.totalBlocks += 1;
        if (!isTask(b)) {
          r.explanation += 1;
          continue;
        }
        r.totalAttempt += 1;
        if (b.bank) {
          r.bank += 1;
          continue;
        }
        if (CONTEST_LESSON.test(lesson.id)) {
          r.contest += 1;
          r.practice += 1; // May's own «Практика» paragraph IS the contest structure
          continue;
        }
        r.practice += 1;
        if (isIndependent(b)) r.independentCoding += 1;
        else if (CODING.has(b.type)) r.guidedCoding += 1;
        else r.otherInteraction += 1;
      }
    }
  }
  for (const b of month.assessment?.blocks ?? []) {
    if (!visible(b)) continue;
    r.totalBlocks += 1;
    if (!isTask(b)) {
      r.explanation += 1;
      continue;
    }
    r.totalAttempt += 1;
    r.assessment += 1;
  }
  return r;
}

const rows = MONTHS.filter((m) => m.units.some((u) => u.lessons.some((l) => l.blocks.length))).map(rowFor);
const sum = (k: keyof Row) => rows.reduce((n, r) => n + (r[k] as number), 0);
const md = process.argv.includes("--markdown");

const header = [
  "Month",
  "PDF «тапсырма»",
  "Practice (comparable)",
  "· independent",
  "· guided coding",
  "· other interaction",
  "Explanation",
  "Assessment",
  "Contest",
  "Bank",
  "All blocks",
];

if (md) {
  console.log(`| ${header.join(" | ")} |`);
  console.log(`|${header.map(() => "---").join("|")}|`);
  for (const r of rows) {
    const delta = r.practice - r.promised;
    console.log(
      `| ${r.month} ${r.name} | ${r.promised} | **${r.practice}** (${delta >= 0 ? "+" : ""}${delta}) | ${r.independentCoding} | ${r.guidedCoding} | ${r.otherInteraction} | ${r.explanation} | ${r.assessment} | ${r.contest} | ${r.bank} | ${r.totalBlocks} |`,
    );
  }
  console.log(
    `| **Year** | **${sum("promised")}** | **${sum("practice")}** | **${sum("independentCoding")}** | ${sum("guidedCoding")} | ${sum("otherInteraction")} | ${sum("explanation")} | ${sum("assessment")} | ${sum("contest")} | ${sum("bank")} | ${sum("totalBlocks")} |`,
  );
} else {
  console.log("");
  console.log("  Core route. PDF-comparable practice = lesson attempt blocks, excluding bank and assessment.");
  console.log("  " + "─".repeat(94));
  console.log("  m  name        PDF  practice  indep  guided  other  expl  assess  contest  bank  blocks");
  for (const r of rows) {
    const d = r.practice - r.promised;
    console.log(
      `  ${String(r.month).padEnd(3)}${r.name.padEnd(11)}${String(r.promised).padStart(4)}` +
        `${(String(r.practice) + (d >= 0 ? ` (+${d})` : ` (${d})`)).padStart(10)}` +
        `${String(r.independentCoding).padStart(7)}${String(r.guidedCoding).padStart(8)}` +
        `${String(r.otherInteraction).padStart(7)}${String(r.explanation).padStart(6)}` +
        `${String(r.assessment).padStart(8)}${String(r.contest).padStart(9)}` +
        `${String(r.bank).padStart(6)}${String(r.totalBlocks).padStart(8)}`,
    );
  }
  console.log("  " + "─".repeat(94));
  console.log(
    `  YEAR       ${String(sum("promised")).padStart(4)}${String(sum("practice")).padStart(10)}` +
      `${String(sum("independentCoding")).padStart(7)}${String(sum("guidedCoding")).padStart(8)}` +
      `${String(sum("otherInteraction")).padStart(7)}${String(sum("explanation")).padStart(6)}` +
      `${String(sum("assessment")).padStart(8)}${String(sum("contest")).padStart(9)}` +
      `${String(sum("bank")).padStart(6)}${String(sum("totalBlocks")).padStart(8)}`,
  );
  console.log("");
  console.log(`  PDF p.11 promises ~250 tasks of which ~100 are «толық дербес шешім».`);
  console.log(`  Implemented, core route: ${sum("practice")} comparable tasks, ${sum("independentCoding")} independent.`);
  console.log("");
}
