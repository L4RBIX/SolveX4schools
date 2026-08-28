#!/usr/bin/env tsx
/**
 * The full-year skill matrix, derived.
 *
 * The programme promises, on p.2, nine things a learner can do by the end of
 * the year, and `skills.ts` names the 46 skills those outcomes decompose into.
 * The question this script answers is the one a school actually asks: for each
 * of those skills, where is it **introduced**, where is it **practised**, where
 * does the learner produce **independent evidence** of it, and where is it
 * **assessed**?
 *
 * Every column is computed from the authored content. None of it is declared.
 * That matters because a hand-written matrix agrees with the curriculum on the
 * day it is written and then silently stops agreeing — and the failure it hides
 * is the one worth finding: a skill the taxonomy introduces, that some lesson
 * mentions in `skillRefs`, and that no task ever asks the learner to use alone.
 *
 * The four columns, and what each one means precisely:
 *
 * - **Introduced** — the month `skills.ts` assigns it to. This is the only
 *   declared column, and it comes from the PDF's own per-month paragraphs.
 * - **Practised** — every month containing an attempt block that references it.
 *   A `concept` mentioning a skill is not practice; the learner has to do
 *   something.
 * - **Independent** — every month containing a block that references it where
 *   the learner writes a whole program from nothing: `write_code` with no
 *   `starter`, `challenge`, or `verify` with mode `unseen_problem`. This is the
 *   column that backs the programme's «шамамен 100 толық дербес шешім».
 * - **Assessed** — every month whose *monthly check* references it. A skill
 *   practised all year and never assessed is a real gap; so is a skill that
 *   appears first in an assessment.
 *
 *   npx tsx scripts/skill-matrix.ts            # human-readable table
 *   npx tsx scripts/skill-matrix.ts --markdown # the table for the audit doc
 */
import { MONTHS } from "../schools/curriculum/months";
import { SKILLS } from "../schools/curriculum/skills";
import { ATTEMPT_BLOCK_TYPES } from "../schools/curriculum/types";
import type { LessonBlock, Month, SkillId } from "../schools/curriculum/types";

interface Located {
  block: LessonBlock;
  month: number;
  lessonId: string;
  inAssessment: boolean;
}

function walk(month: Month): Located[] {
  const out: Located[] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        out.push({ block, month: month.index, lessonId: lesson.id, inAssessment: false });
      }
    }
  }
  for (const block of month.assessment?.blocks ?? []) {
    out.push({ block, month: month.index, lessonId: month.assessment!.id, inAssessment: true });
  }
  return out;
}

/**
 * A block where the learner produces a whole program with nothing to start from.
 *
 * `modify_code` and `fill_blank` are excluded on purpose however much work they
 * involve: the programme counts «толық дербес шешім» — a complete independent
 * solution — and a task that hands over most of the program is not one, whatever
 * else it is good for.
 */
function isIndependent(block: LessonBlock): boolean {
  if (block.type === "challenge") return true;
  if (block.type === "write_code") return !block.starter?.trim();
  if (block.type === "verify") return block.mode === "unseen_problem";
  return false;
}

const ALL = MONTHS.flatMap(walk);

interface Row {
  id: SkillId;
  titleKk: string;
  introduced: number;
  practised: number[];
  independent: number[];
  assessed: number[];
  taskCount: number;
  independentCount: number;
}

const rows: Row[] = SKILLS.map((skill) => {
  const touching = ALL.filter((e) => e.block.skillRefs.includes(skill.id));
  const tasks = touching.filter((e) => ATTEMPT_BLOCK_TYPES.has(e.block.type));
  const independent = touching.filter((e) => isIndependent(e.block));
  const assessed = touching.filter((e) => e.inAssessment && ATTEMPT_BLOCK_TYPES.has(e.block.type));
  const months = (xs: Located[]) => [...new Set(xs.map((e) => e.month))].sort((a, b) => a - b);
  return {
    id: skill.id,
    titleKk: skill.title.kk,
    introduced: skill.introducedInMonth,
    practised: months(tasks),
    independent: months(independent),
    assessed: months(assessed),
    taskCount: tasks.length,
    independentCount: independent.length,
  };
});

/* -------------------------------------------------------------------------- */
/* Problems the matrix can see                                                */
/* -------------------------------------------------------------------------- */

interface Problem {
  skill: SkillId;
  kind: string;
  detail: string;
}

const problems: Problem[] = [];
for (const r of rows) {
  if (r.taskCount === 0) {
    problems.push({
      skill: r.id,
      kind: "never practised",
      detail: `introduced in month ${r.introduced}; no attempt block anywhere references it`,
    });
    continue;
  }
  if (r.practised.length && r.practised[0] < r.introduced) {
    problems.push({
      skill: r.id,
      kind: "practised before introduced",
      detail: `first practised in month ${r.practised[0]}, taxonomy introduces it in month ${r.introduced}`,
    });
  }
  if (r.independentCount === 0) {
    problems.push({
      skill: r.id,
      kind: "no independent evidence",
      detail: `${r.taskCount} task(s), none of them a whole program written from nothing`,
    });
  }
  if (r.assessed.length === 0) {
    problems.push({
      skill: r.id,
      kind: "never assessed",
      detail: `practised in month(s) ${r.practised.join(", ")}; no monthly check references it`,
    });
  }
  if (r.practised.length === 1 && r.practised[0] === r.introduced && r.taskCount < 3) {
    problems.push({
      skill: r.id,
      kind: "taught once, never revisited",
      detail: `${r.taskCount} task(s), all in month ${r.introduced}`,
    });
  }
}

/* -------------------------------------------------------------------------- */

const md = process.argv.includes("--markdown");
const fmt = (xs: number[]) => (xs.length ? xs.join(", ") : "—");

if (md) {
  console.log("| Skill | Introduced | Practised | Independent evidence | Assessed | Tasks |");
  console.log("|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| \`${r.id}\` — ${r.titleKk} | ${r.introduced} | ${fmt(r.practised)} | ${fmt(r.independent)} | ${fmt(r.assessed)} | ${r.taskCount} |`,
    );
  }
  console.log("");
  if (problems.length) {
    console.log(`**${problems.length} gap(s) the matrix can see:**`);
    console.log("");
    for (const p of problems) console.log(`- \`${p.skill}\` — **${p.kind}**: ${p.detail}`);
  } else {
    console.log("No gaps: every skill is introduced, practised, evidenced independently and assessed.");
  }
} else {
  console.log("");
  console.log("  Full-year skill matrix");
  console.log("  " + "─".repeat(96));
  console.log(
    "  " + "skill".padEnd(28) + "intro".padEnd(7) + "practised".padEnd(20) + "independent".padEnd(20) + "assessed",
  );
  for (const r of rows) {
    console.log(
      "  " +
        r.id.padEnd(28) +
        String(r.introduced).padEnd(7) +
        fmt(r.practised).padEnd(20) +
        fmt(r.independent).padEnd(20) +
        fmt(r.assessed),
    );
  }
  console.log("  " + "─".repeat(96));
  const totalIndependent = ALL.filter((e) => isIndependent(e.block)).length;
  const totalTasks = ALL.filter((e) => ATTEMPT_BLOCK_TYPES.has(e.block.type)).length;
  console.log(`  ${SKILLS.length} skills · ${totalTasks} tasks · ${totalIndependent} independent solutions`);
  console.log(`  (the programme promises ~250 tasks and ~100 independent solutions, PDF p.11)`);
  console.log("");
  if (problems.length) {
    console.log(`  ${problems.length} gap(s):`);
    for (const p of problems) console.log(`    ! ${p.skill}: ${p.kind} — ${p.detail}`);
  } else {
    console.log("  No gaps.");
  }
  console.log("");
}
