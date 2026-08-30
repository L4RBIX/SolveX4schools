#!/usr/bin/env tsx
/**
 * How long the authored year takes, under three learners rather than one.
 *
 * The programme states its own budget twice, so this is a checkable question
 * and not an opinion:
 *
 *   PDF p.2  «Аптасына екі онлайн-сабақ, әрқайсысы 45 минут» plus «Аптасына
 *            кемінде шамамен 40 минут» on the platform
 *   PDF p.5  a month is «шамамен 2,5 сағат» theory and «шамамен 6 сағат»
 *            practice — 150 + 360 = 510 minutes
 *
 * 510 is what a month HAS. This script says what a month COSTS.
 *
 * ## What this script does not do
 *
 * It does not validate the workload. Nobody has watched a fourteen-year-old in
 * Kazakhstan work through any of these lessons, and until somebody has, every
 * absolute number below is an estimate about a child made by people who have
 * not met one. The three columns exist so that the uncertainty is visible in
 * the output instead of buried in a single figure that reads like a
 * measurement.
 *
 * An earlier version of this script reported one scenario and a September
 * ratio, and I described that ratio as showing that October's workload had come
 * down. It showed nothing of the kind — the bank field it depended on did not
 * affect completion at all until `bank-is-optional.test.ts` made it, so the
 * required path had not changed. That is the mistake these three columns are
 * meant to make harder: a single number invites a verdict, and the verdict is
 * not available yet.
 *
 * ## The three learners
 *
 * FAST — has understood the lesson, writes the loop correctly the first time,
 * makes one submission per task. This is the top of the class, and a curriculum
 * that overruns even here is broken.
 *
 * EXPECTED — understands after the worked example, gets a task wrong once or
 * twice, re-reads the statement. The learner the programme is aimed at.
 *
 * SLOW — needs the concept twice, meets a real bug on most from-scratch tasks,
 * and loses ten minutes to an off-by-one at least once a month. Not a struggling
 * outlier: the bottom third of an ordinary class. A school assigning this
 * curriculum is assigning it to these learners too.
 *
 * The spread is deliberately widest where production happens. Reading a concept
 * twice costs a small multiple; being stuck on a from-scratch problem is
 * unbounded, and 2.5x is already an optimistic way to model unbounded.
 *
 * Every number is in one table, in the open, so arguing with it is cheap and
 * the total is reproducible. What is not arguable is that somebody has to do the
 * sum: a curriculum that quietly costs twice its budget is not discovered by
 * reading it.
 *
 * Two conventions worth naming:
 *
 * - `explain` and `oral_explanation` are costed PER QUESTION. Four numbered
 *   sub-questions is four answers, and treating it as one block is exactly how
 *   September's monthly check came to cost thirty minutes against a stated
 *   twenty.
 * - Passive blocks are costed. Reading a concept is not free, and the 150
 *   theory minutes are what they are for.
 * - Bank tasks are never counted. They are the one part of the corpus a learner
 *   may skip, which `requirementFor` now enforces rather than merely documents.
 *
 *   npx tsx scripts/workload.ts             # three scenarios, per month, per route
 *   npx tsx scripts/workload.ts --markdown  # the table for the audit doc
 *   npx tsx scripts/workload.ts --relative  # the September-relative reading
 */
import { MONTHS } from "../schools/curriculum/months";
import { isTask, roleOf } from "../schools/curriculum/inventory";
import type { LessonBlock, Month, TrackLevel } from "../schools/curriculum/types";

import {
  MONTH_BUDGET as BUDGET,
  PASSIVE,
  SCENARIOS,
  costOf,
  type Scenario,
} from "../schools/curriculum/cost";

/* The cost table used to live here, and a near-copy of it lived in
   `schools/curriculum/validate.ts`. They disagreed by a minute or two, so
   January's check read 21 minutes in this script and 22 in the validator's
   warning. One table now, in `schools/curriculum/cost.ts`, which is library
   code because the validator is library code and a script importing a script
   is the wrong way round. */

export interface Load {
  theory: number;
  core: number;
  bank: number;
  assessment: number;
  contest: number;
  /** What a learner MUST do. Bank is excluded — that is what the field means. */
  required: number;
}

export function loadOf(month: Month, track: TrackLevel, s: Scenario): Load {
  const out: Load = { theory: 0, core: 0, bank: 0, assessment: 0, contest: 0, required: 0 };
  const visible = (b: LessonBlock) => !b.tracks || (b.tracks as readonly string[]).includes(track);

  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        if (!visible(block)) continue;
        const cost = costOf(block, s);
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
      out.theory += costOf(block, s);
      continue;
    }
    if (isTask(block)) out.assessment += costOf(block, s);
  }
  out.required = out.theory + out.core + out.assessment + out.contest;
  return out;
}

/* -------------------------------------------------------------------------- */

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];
const md = process.argv.includes("--markdown");
const relativeOnly = process.argv.includes("--relative");
const AUTHORED = MONTHS.filter((m) => m.units.some((u) => u.lessons.some((l) => l.blocks.length)));
const h = (n: number) => (n / 60).toFixed(1);

if (!relativeOnly) {
  if (md) {
    console.log(
      `Programme budget per month (PDF p.5): **${BUDGET.theory} min theory + ${BUDGET.practice} min practice = ${BUDGET.total} min**. ` +
        `Bank tasks are excluded — a learner may skip them.\n`,
    );
    console.log("| Month | Route | Fast | Expected | Slow | Expected vs budget | Slow vs budget |");
    console.log("|---|---|---|---|---|---|---|");
  } else {
    console.log("");
    console.log(`  Monthly budget (PDF p.5): ${BUDGET.theory} theory + ${BUDGET.practice} practice = ${BUDGET.total} min`);
    console.log("  Required minutes. Bank excluded — a learner may skip it.");
    console.log("  " + "─".repeat(78));
    console.log("  m  route        fast  expected      slow    exp vs 510   slow vs 510");
  }

  for (const month of AUTHORED) {
    for (const track of TRACKS) {
      const v = Object.fromEntries(SCENARIOS.map((s) => [s, loadOf(month, track, s).required])) as Record<
        Scenario,
        number
      >;
      const de = v.expected - BUDGET.total;
      const ds = v.slow - BUDGET.total;
      const sign = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}`;
      if (md) {
        console.log(
          `| ${month.index} ${month.monthName.kk} | ${track} | ${Math.round(v.fast)} | **${Math.round(v.expected)}** | ${Math.round(v.slow)} | ${sign(de)} | ${sign(ds)} |`,
        );
      } else {
        console.log(
          `  ${String(month.index).padEnd(3)}${track.padEnd(10)}` +
            `${String(Math.round(v.fast)).padStart(6)}${String(Math.round(v.expected)).padStart(10)}` +
            `${String(Math.round(v.slow)).padStart(10)}` +
            `${sign(de).padStart(14)}${sign(ds).padStart(14)}`,
        );
      }
    }
  }

  if (!md) {
    const overExpected = AUTHORED.flatMap((m) =>
      TRACKS.filter((t) => loadOf(m, t, "expected").required > BUDGET.total).map((t) => `m${m.index}/${t}`),
    );
    const overSlow = AUTHORED.flatMap((m) =>
      TRACKS.filter((t) => loadOf(m, t, "slow").required > BUDGET.total).map((t) => `m${m.index}/${t}`),
    );
    const overFast = AUTHORED.flatMap((m) =>
      TRACKS.filter((t) => loadOf(m, t, "fast").required > BUDGET.total).map((t) => `m${m.index}/${t}`),
    );
    console.log("  " + "─".repeat(78));
    console.log(`  over budget, FAST:     ${overFast.length}/${AUTHORED.length * 3}  ${overFast.join(" ") || "—"}`);
    console.log(`  over budget, EXPECTED: ${overExpected.length}/${AUTHORED.length * 3}  ${overExpected.join(" ") || "—"}`);
    console.log(`  over budget, SLOW:     ${overSlow.length}/${AUTHORED.length * 3}  ${overSlow.join(" ") || "—"}`);
    console.log("");
    console.log("  NOT VALIDATED. Every minute above is an estimate about a fourteen-year-old");
    console.log("  made by people who have not watched one. The three columns are the honest");
    console.log("  width of that uncertainty, not three measurements.");
    console.log("");
  }
}

if (relativeOnly || !md) {
  /*
   * A second reading that does not depend on the absolute estimates at all.
   *
   * September is the only month a human has audited, remediated and accepted.
   * Whatever a learner really costs per block, a month priced 40% above
   * September by the same table is 40% heavier than the size somebody already
   * judged acceptable — and that ratio is stable under any consistent cost
   * table, because one table prices both.
   *
   * This is RELATIVE DENSITY. It says a month is heavier or lighter than
   * September. It does not say September is the right size, it does not say any
   * month fits in 510 minutes, and it cannot: September itself has never been
   * timed. Treating it as workload validation is a mistake this workstream
   * already made once.
   */
  console.log("  Required practice relative to September — RELATIVE DENSITY ONLY.");
  console.log("  September has never been timed either, so 100% is not a pass mark.");
  console.log("  " + "─".repeat(78));
  const sept = AUTHORED.find((m) => m.index === 1)!;
  for (const track of TRACKS) {
    const base = loadOf(sept, track, "expected").core;
    const parts = AUTHORED.filter((m) => m.index !== 1).map(
      (m) => `m${m.index} ${((loadOf(m, track, "expected").core / base) * 100).toFixed(0)}%`,
    );
    console.log(`  ${track.padEnd(10)}${parts.join("  ")}`);
  }
  console.log("");
}
