#!/usr/bin/env tsx
/**
 * Every requirement the programme states, and where the implementation meets it.
 *
 * `source-of-truth.ts` holds the PDF's own commitments — nine year-end outcomes
 * (p.2), five verification methods (p.6), three learner routes (p.4) — as data
 * rather than prose, so a machine can ask where each one is honoured.
 *
 * The distinction this script is careful about: it reports EVIDENCE, not
 * satisfaction. A verification method is present when blocks implement it, and
 * how many. Whether five `oral_explanation` blocks across nine months is enough
 * to make a learner able to defend a solution aloud is not a question a count
 * settles, and the output says so rather than printing a tick.
 *
 * The nine outcomes are the harder half. They are sentences about what a
 * fourteen-year-old can do in May, and nothing in the schema declares which
 * outcome a block serves. The mapping below is therefore AUTHORED — it is the
 * only hand-written thing in any of these audit scripts — and each row names
 * the block types or verify modes that constitute evidence for that outcome,
 * with the reason. Wrong mappings are possible and the reason is there to be
 * argued with; what is not possible is the mapping silently disagreeing with
 * the content, because the counts under it are computed.
 *
 *   npx tsx scripts/requirement-matrix.ts
 *   npx tsx scripts/requirement-matrix.ts --markdown
 */
import { MONTHS } from "../schools/curriculum/months";
import { isIndependent, isTask, roleOf } from "../schools/curriculum/inventory";
import {
  YEAR_END_OUTCOMES_KK,
  VERIFICATION_METHODS_KK,
  TRACK_DEFINITIONS_KK,
} from "../schools/curriculum/source-of-truth";
import type { LessonBlock, Month, TrackLevel } from "../schools/curriculum/types";

interface Located {
  block: LessonBlock;
  month: number;
  lesson: string;
  inAssessment: boolean;
}

function walk(month: Month): Located[] {
  const out: Located[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const b of lesson.blocks) out.push({ block: b, month: month.index, lesson: lesson.id, inAssessment: false });
    }
  }
  for (const b of month.assessment?.blocks ?? []) {
    out.push({ block: b, month: month.index, lesson: month.assessment!.id, inAssessment: true });
  }
  return out;
}

const ALL = walk_all();
function walk_all(): Located[] {
  return MONTHS.flatMap(walk);
}

/** On the required path — not bank, not a block nobody must do. */
const required = (e: Located) => roleOf(e.block, e.lesson, e.inAssessment) !== "bank";

/**
 * What counts as evidence for each of the nine year-end outcomes.
 *
 * Authored, and the `why` is the argument. Anything here can be wrong; nothing
 * here can be stale, because the counts beside it are computed from content.
 */
const OUTCOME_EVIDENCE: { match: (b: LessonBlock) => boolean; why: string }[] = [
  {
    // 1. reads a statement and separates what is given from what is asked
    match: (b) => b.type === "test_case" || (b.type === "verify" && b.mode === "unseen_problem"),
    why: "an unseen problem is where reading the statement is the whole first move, and a test_case forces the learner to say what the inputs actually are",
  },
  {
    // 2. plans before coding and can say the plan aloud
    match: (b) => b.type === "explain" || (b.type === "verify" && b.mode === "oral_explanation"),
    why: "the only blocks whose answer is a plan or an argument in words rather than a program",
  },
  {
    // 3. writes the program independently rather than copying
    match: isIndependent,
    why: "a whole program produced from an empty editor; a starter would be the copying this outcome rules out",
  },
  {
    // 4. hand-executes a program step by step
    match: (b) => b.type === "trace_code" || (b.type === "verify" && b.mode === "manual_trace"),
    why: "the two block types where the learner is the computer and the machine is not consulted",
  },
  {
    // 5. finds their own error, understands the cause, fixes it
    match: (b) => b.type === "find_bug" || (b.type === "verify" && b.mode === "find_bug") || b.type === "modify_code",
    why: "repairing a broken program, which is the same act on somebody else's code the outcome asks for on their own",
  },
  {
    // 6. constructs their own test cases including edge cases
    match: (b) => b.type === "test_case",
    why: "the only block whose answer IS an input the learner invented",
  },
  {
    // 7. judges whether a program fits the time budget, and speeds it up
    match: (b) => b.skillRefs.some((s) => s.startsWith("perf.")),
    why: "declared by skill rather than by type: the judgement appears as multiple_choice, explain and write_code alike, and what makes it this outcome is the subject",
  },
  {
    // 8. takes part in school programming contests and knows how they run
    match: (b) => b.skillRefs.some((s) => s.startsWith("contest.")),
    why: "May's contest skills, and the tournament blocks that carry them",
  },
  {
    // 9. argues aloud why the solution is correct
    match: (b) => b.type === "verify" && b.mode === "oral_explanation",
    why: "the programme's own named method for this outcome, and the only block a teacher must listen to",
  },
];

const md = process.argv.includes("--markdown");
const monthsOf = (xs: Located[]) => [...new Set(xs.map((e) => e.month))].sort((a, b) => a - b);

/* -------------------------------------------------------------------------- */

const outcomeRows = YEAR_END_OUTCOMES_KK.map((text, i) => {
  const hits = ALL.filter(required).filter((e) => OUTCOME_EVIDENCE[i].match(e.block));
  const assessed = hits.filter((e) => e.inAssessment);
  return {
    n: i + 1,
    text,
    why: OUTCOME_EVIDENCE[i].why,
    count: hits.length,
    months: monthsOf(hits),
    assessedIn: monthsOf(assessed),
  };
});

const methodRows = VERIFICATION_METHODS_KK.map((m) => {
  const hits = ALL.filter(required).filter((e) => e.block.type === "verify" && e.block.mode === m.key);
  return {
    key: m.key,
    title: m.title,
    count: hits.length,
    months: monthsOf(hits),
    assessedIn: monthsOf(hits.filter((e) => e.inAssessment)),
  };
});

const TRACKS: readonly TrackLevel[] = ["support", "core", "advanced"];
const trackRows = TRACKS.map((t) => {
  const seen = ALL.filter(required).filter(
    (e) => isTask(e.block) && (!e.block.tracks || (e.block.tracks as readonly string[]).includes(t)),
  );
  const only = ALL.filter(required).filter(
    (e) => isTask(e.block) && e.block.tracks?.length === 1 && e.block.tracks[0] === t,
  );
  return { track: t, label: TRACK_DEFINITIONS_KK[t]?.title ?? t, tasks: seen.length, exclusive: only.length };
});

if (md) {
  console.log("### Nine year-end outcomes (PDF p.2)\n");
  console.log("| # | Outcome | Evidence counted as | Blocks | Months | Assessed in |");
  console.log("|---|---|---|---|---|---|");
  for (const r of outcomeRows) {
    console.log(
      `| ${r.n} | ${r.text} | ${r.why} | ${r.count} | ${r.months.join(", ")} | ${r.assessedIn.join(", ") || "—"} |`,
    );
  }
  console.log("\n### Five verification methods (PDF p.6)\n");
  console.log("| Method | Blocks | Months | In a monthly check |");
  console.log("|---|---|---|---|");
  for (const r of methodRows) {
    console.log(`| \`${r.key}\` — ${r.title} | ${r.count} | ${r.months.join(", ")} | ${r.assessedIn.join(", ") || "—"} |`);
  }
  console.log("\n### Three routes (PDF p.4)\n");
  console.log("| Route | Required tasks visible | Exclusive to this route |");
  console.log("|---|---|---|");
  for (const r of trackRows) console.log(`| ${r.track} — ${r.label} | ${r.tasks} | ${r.exclusive} |`);
} else {
  console.log("\n  Nine year-end outcomes (p.2) — EVIDENCE, not satisfaction\n");
  for (const r of outcomeRows) {
    console.log(`  ${r.n}. ${r.count.toString().padStart(3)} blocks · months ${r.months.join(",")} · assessed ${r.assessedIn.join(",") || "—"}`);
    console.log(`     ${r.text}`);
  }
  console.log("\n  Five verification methods (p.6)\n");
  for (const r of methodRows) {
    console.log(`  ${r.key.padEnd(18)}${r.count.toString().padStart(4)} blocks · months ${r.months.join(",")} · in checks ${r.assessedIn.join(",") || "—"}`);
  }
  console.log("\n  Three routes (p.4)\n");
  for (const r of trackRows) console.log(`  ${r.track.padEnd(10)}${r.tasks.toString().padStart(4)} required tasks · ${r.exclusive} exclusive`);
  console.log("\n  These are counts of evidence. Whether the amount is ENOUGH is not a");
  console.log("  question a count answers, and this script does not print a verdict.\n");
}
