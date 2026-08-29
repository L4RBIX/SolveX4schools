#!/usr/bin/env tsx
/**
 * How long the authored year actually takes a learner.
 *
 * The programme states its own budget and states it twice, so this is a
 * checkable question rather than an opinion:
 *
 *   PDF p.2  «Аптасына екі онлайн-сабақ, әрқайсысы 45 минут» + «Аптасына
 *            кемінде шамамен 40 минут» on the platform
 *   PDF p.5  a month is «шамамен 2,5 сағат» theory and «шамамен 6 сағат»
 *            practice — 150 + 360 = 510 minutes
 *
 * The 510 is what a month has. This script says what a month costs.
 *
 * ## The estimates, and why they are stated rather than hidden
 *
 * Every number in `MINUTES` below is a guess about a fourteen-year-old, and
 * every one of them is arguable. They are in one table, in the open, so that
 * arguing with them is easy and so that the total is reproducible. What is NOT
 * arguable is that somebody has to do the sum: a curriculum that quietly costs
 * twice its budget is not discovered by reading it.
 *
 * Two conventions worth naming:
 *
 * - `explain` and `oral_explanation` are costed PER QUESTION. Four numbered
 *   sub-questions is four answers, and treating it as one block is exactly how
 *   September's monthly check came to cost thirty minutes against a stated
 *   twenty.
 * - Passive blocks are costed too. Reading a concept is not free, and the
 *   programme's 150 theory minutes are what they are for.
 *
 * ## Calibration
 *
 * September is the calibration month: it was authored, forensically audited and
 * remediated by people before this workstream began, so it is the one month
 * whose size somebody has already judged acceptable. A model that says
 * September overruns is wrong about the model, not about September.
 *
 *   npx tsx scripts/workload.ts             # per month, per route
 *   npx tsx scripts/workload.ts --markdown  # the table for the audit doc
 */
import { MONTHS } from "../schools/curriculum/months";
import { isTask, roleOf } from "../schools/curriculum/inventory";
import type { LessonBlock, Month, TrackLevel } from "../schools/curriculum/types";

/**
 * How pessimistic to be about a fourteen-year-old.
 *
 * `--slow` multiplies the two costs that carry the most uncertainty and the
 * most weight — writing a whole program from an empty editor, and the harder
 * standalone problems — by 1.5. A beginner in October is not the same learner
 * as one in March, and 12 minutes for a first from-scratch loop is the
 * optimistic end of plausible.
 *
 * The verdict this script gives is only worth something if it survives the
 * pessimistic run, so both are reported and the report states which one the
 * conclusion rests on.
 */
const SLOW = process.argv.includes("--slow");
const CODE_FACTOR = SLOW ? 1.5 : 1;

/** Minutes a block costs a learner who has been taught the topic. */
const MINUTES: Record<LessonBlock["type"], number> = {
  concept: 2,
  worked_example: 3,
  visual_simulation: 2,
  reflection: 2,
  prediction: 1.5,
  multiple_choice: 1.5,
  fill_blank: 3,
  reorder_code: 3,
  trace_code: 5,
  find_bug: 6,
  modify_code: 6,
  test_case: 4,
  explain: 2, // per question — see `costOf`
  write_code: 12 * CODE_FACTOR,
  challenge: 15 * CODE_FACTOR,
  arena_problem: 15 * CODE_FACTOR,
  verify: 12, // refined per mode in `costOf`
};

/** The programme's own monthly budget, PDF p.5. */
const BUDGET = { theory: 150, practice: 360, total: 510 };

/** Blocks the learner reads rather than does — the programme's «түсіндіру». */
const PASSIVE = new Set<LessonBlock["type"]>(["concept", "worked_example", "visual_simulation"]);

function questionsIn(text: string): number {
  return Math.max(1, (text.match(/\(\d\)/g) ?? []).length, (text.match(/\?/g) ?? []).length);
}

function costOf(block: LessonBlock): number {
  if (block.type === "explain") return MINUTES.explain * questionsIn(block.prompt.kk);
  if (block.type === "verify") {
    switch (block.mode) {
      case "unseen_problem":
        return 12 * CODE_FACTOR;
      case "manual_trace":
        return 6;
      case "find_bug":
        return 6;
      case "delayed_resolve":
        return 10 * CODE_FACTOR;
      case "oral_explanation":
        return 2 * questionsIn(block.prompt.kk);
    }
  }
  return MINUTES[block.type] ?? 5;
}

export interface Load {
  theory: number;
  core: number;
  bank: number;
  assessment: number;
  contest: number;
  /** What a learner must do: theory + core + assessment + contest. Bank is not counted. */
  required: number;
}

export function loadOf(month: Month, track: TrackLevel): Load {
  const out: Load = { theory: 0, core: 0, bank: 0, assessment: 0, contest: 0, required: 0 };
  const visible = (b: LessonBlock) => !b.tracks || (b.tracks as readonly string[]).includes(track);

  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        if (!visible(block)) continue;
        const cost = costOf(block);
        if (PASSIVE.has(block.type)) {
          out.theory += cost;
          continue;
        }
        if (!isTask(block)) continue;
        const role = roleOf(block, lesson.id, false);
        if (role === "bank") out.bank += cost;
        else if (role === "contest") out.contest += cost;
        else out.core += cost;
      }
    }
  }
  for (const block of month.assessment?.blocks ?? []) {
    if (!visible(block)) continue;
    if (PASSIVE.has(block.type)) {
      out.theory += costOf(block);
      continue;
    }
    if (isTask(block)) out.assessment += costOf(block);
  }
  out.required = out.theory + out.core + out.assessment + out.contest;
  return out;
}

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];
const md = process.argv.includes("--markdown");
const h = (n: number) => (n / 60).toFixed(1);

const rows: string[] = [];
let worst = 0;

for (const month of MONTHS) {
  const any = month.units.some((u) => u.lessons.some((l) => l.blocks.length > 0));
  if (!any) continue;
  for (const track of TRACKS) {
    const l = loadOf(month, track);
    const over = l.required - BUDGET.total;
    worst = Math.max(worst, over);
    const verdict = over > 60 ? "OVER" : over > 0 ? "tight" : "fits";
    rows.push(
      md
        ? `| ${month.index} ${month.monthName.kk} | ${track} | ${Math.round(l.theory)} | ${Math.round(l.core)} | ${Math.round(l.assessment)} | ${Math.round(l.contest)} | **${Math.round(l.required)}** (${h(l.required)} h) | ${over > 0 ? "+" : ""}${Math.round(over)} | ${verdict} | ${Math.round(l.bank)} |`
        : `  ${String(month.index).padEnd(3)}${track.padEnd(10)}${String(Math.round(l.theory)).padStart(7)}${String(Math.round(l.core)).padStart(7)}${String(Math.round(l.assessment)).padStart(7)}${String(Math.round(l.contest)).padStart(8)}${String(Math.round(l.required)).padStart(10)}${(h(l.required) + " h").padStart(8)}${((over > 0 ? "+" : "") + Math.round(over)).padStart(7)}  ${verdict}`,
    );
  }
}

if (md) {
  console.log(`Programme budget per month (PDF p.5): **${BUDGET.theory} min theory + ${BUDGET.practice} min practice = ${BUDGET.total} min**.\n`);
  console.log("| Month | Route | Theory | Core | Assess | Contest | Required | vs budget | Verdict | Bank (not counted) |");
  console.log("|---|---|---|---|---|---|---|---|---|---|");
  rows.forEach((r) => console.log(r));
} else {
  console.log("");
  console.log(`  Monthly budget (PDF p.5): ${BUDGET.theory} theory + ${BUDGET.practice} practice = ${BUDGET.total} min`);
  console.log(`  coding cost factor: ${CODE_FACTOR}${SLOW ? "  (--slow: write_code 18 min, challenge 22.5)" : "  (baseline: write_code 12 min)"}`);
  console.log("  " + "─".repeat(76));
  console.log("  m  route      theory   core  assess contest  required          over");
  rows.forEach((r) => console.log(r));
  console.log("  " + "─".repeat(76));
  console.log(`  worst overrun: ${Math.round(worst)} min (${h(worst)} h) over the monthly budget`);
  console.log("");

  /*
   * The absolute verdict depends on minute estimates nobody has measured, and
   * the pessimistic run shows how much: at 18 minutes per from-scratch program
   * even SEPTEMBER overruns by 80-120, and September is the one month people
   * audited and accepted. That does not tell us September is too big; it tells
   * us the absolute numbers are not yet trustworthy in either direction.
   *
   * So there is a second reading that does not depend on them. September is the
   * calibration month. Whatever a fourteen-year-old really costs per block, a
   * month that is 40% heavier than September is 40% heavier than the size a
   * human already judged acceptable — and that ratio is stable under any
   * consistent set of estimates, because the same table prices both.
   */
  console.log("  Relative to September, the one month a human has judged:");
  console.log("  " + "─".repeat(76));
  const sept = MONTHS.find((m) => m.index === 1)!;
  for (const track of TRACKS) {
    const base = loadOf(sept, track).core;
    const parts: string[] = [];
    for (const month of MONTHS) {
      if (month.index === 1) continue;
      if (!month.units.some((u) => u.lessons.some((l) => l.blocks.length > 0))) continue;
      const ratio = loadOf(month, track).core / base;
      parts.push(`m${month.index} ${(ratio * 100).toFixed(0)}%`);
    }
    console.log(`  ${track.padEnd(10)}${parts.join("  ")}`);
  }
  console.log("");
  console.log("  A month above ~110% of September carries more required practice than the");
  console.log("  calibrated month does. That is the pruning signal, and it is the same");
  console.log("  signal whichever cost table is used.");
  console.log("");
}
