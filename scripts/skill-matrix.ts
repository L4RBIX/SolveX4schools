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

/**
 * Evidence only counts when every learner on the route actually produces it.
 *
 * A bank task is validated, addressable and optional — so a skill whose only
 * independent evidence sits in the bank has no evidence for the learner who
 * does the required path and stops, which is the learner this matrix is about.
 * Counting it would let a month look covered because of work nobody has to do.
 */
function isCore(block: LessonBlock): boolean {
  return !block.bank;
}

const ALL = MONTHS.flatMap(walk);

interface Row {
  id: SkillId;
  titleKk: string;
  introduced: number;
  practised: number[];
  independent: number[];
  assessed: number[];
  guided: number[];
  optionalIndependent: number[];
  monthlyAssessed: number[];
  finalAssessed: boolean;
  taskCount: number;
  independentCount: number;
  bankCount: number;
}

const rows: Row[] = SKILLS.map((skill) => {
  const touching = ALL.filter((e) => e.block.skillRefs.includes(skill.id));
  const tasks = touching.filter((e) => ATTEMPT_BLOCK_TYPES.has(e.block.type));
  const independent = touching.filter((e) => isIndependent(e.block) && isCore(e.block));
  const bankOnly = touching.filter((e) => !isCore(e.block));
  const assessed = touching.filter((e) => e.inAssessment && ATTEMPT_BLOCK_TYPES.has(e.block.type));
  /* GUIDED: the learner acts, but the program is not theirs to produce whole —
     a starter, a template, someone else's code to repair or reorder. Real
     evidence of understanding, and not the «толық дербес шешім» the programme
     counts separately. */
  const guided = tasks.filter(
    (e) => !isIndependent(e.block) && isCore(e.block) && !e.inAssessment,
  );
  /* Independent evidence that a learner may skip. It is evidence, and it is
     not evidence the required path produces. */
  const optionalIndependent = touching.filter((e) => isIndependent(e.block) && !isCore(e.block));
  /* May's «қорытынды турнир» is not a monthly check. It is the year's final
     assessment, it declares twenty skills where a monthly check declares five
     or six, and a skill it covers is assessed even though no month's own check
     named it. Collapsing the two is what turned three different findings into
     one word. */
  const monthlyAssessed = assessed.filter((e) => e.month !== 9);
  const finalAssessed = assessed.filter((e) => e.month === 9);
  const months = (xs: Located[]) => [...new Set(xs.map((e) => e.month))].sort((a, b) => a - b);
  return {
    id: skill.id,
    titleKk: skill.title.kk,
    introduced: skill.introducedInMonth,
    practised: months(tasks),
    independent: months(independent),
    assessed: months(assessed),
    guided: months(guided),
    optionalIndependent: months(optionalIndependent),
    monthlyAssessed: months(monthlyAssessed),
    finalAssessed: finalAssessed.length > 0,
    taskCount: tasks.length,
    independentCount: independent.length,
    bankCount: bankOnly.length,
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
  /* THE BLOCKER, and it is a different thing from a check not sampling a skill.
     A skill with no whole-program evidence anywhere on the required path is one
     the curriculum cannot show a learner can use unaided — which is the
     programme's own headline promise. A skill missing from one 20-minute check
     is a sampling question. Reported separately, and in that order. */
  if (r.independentCount === 0) {
    problems.push({
      skill: r.id,
      kind: r.optionalIndependent.length
        ? "independent evidence ONLY in the optional bank"
        : "no independent evidence anywhere",
      detail:
        `${r.taskCount} task(s), none of them a whole program written from nothing on the ` +
        `required path` +
        (r.optionalIndependent.length
          ? ` — month(s) ${r.optionalIndependent.join(", ")} have one, but a learner may skip it`
          : "") +
        (r.guided.length ? `. Guided evidence in month(s) ${r.guided.join(", ")}` : ""),
    });
  }
  /* Three different findings, which an earlier version of this script reported
     as one. They have different severities and different remedies:

     - NOT MONTHLY ASSESSED but covered by May's final tournament. The learner
       does produce assessed evidence of it; no single month's check asked. A
       real observation about the monthly checks, not a hole in the year.
     - NEVER ASSESSED ANYWHERE. Nothing the learner is graded on, all year,
       declares this skill. That is a hole.
     - NO INDEPENDENT EVIDENCE. Practised, possibly assessed, but never in a
       whole program written from nothing on the required path. */
  if (r.assessed.length === 0) {
    problems.push({
      skill: r.id,
      kind: "never assessed anywhere",
      detail: `practised in month(s) ${r.practised.join(", ")}; no monthly check and not the final tournament`,
    });
  } else if (r.monthlyAssessed.length === 0) {
    problems.push({
      skill: r.id,
      kind: "not monthly assessed",
      detail: `practised in month(s) ${r.practised.join(", ")}; covered only by May's final tournament`,
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
  console.log(
    "| Skill | Taught | Guided | Core independent | Optional independent | Monthly assessed | Later assessed |",
  );
  console.log("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const later = r.assessed.filter((m) => !r.monthlyAssessed.includes(m));
    console.log(
      `| \`${r.id}\` — ${r.titleKk} | m${r.introduced} | ${fmt(r.guided)} | ${fmt(r.independent)} | ` +
        `${fmt(r.optionalIndependent)} | ${fmt(r.monthlyAssessed)} | ${fmt(later)} |`,
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
  /* Deliberately NOT compared against the programme's ~250 and ~100. These
     totals sum all three routes and fold in assessment, contest and bank, so
     they are not the same unit as the PDF's figures — see
     docs/curriculum/TASK_COUNT_RECONCILIATION.md, which exists because that
     comparison was made for months and was wrong every time.
     `scripts/reconcile-counts.ts` is the script that may make it. */
  const totalIndependent = ALL.filter((e) => isIndependent(e.block)).length;
  const totalTasks = ALL.filter((e) => ATTEMPT_BLOCK_TYPES.has(e.block.type)).length;
  console.log(`  ${SKILLS.length} skills · ${totalTasks} skill-bearing blocks · ${totalIndependent} from-nothing`);
  console.log(`  (all routes summed, assessment and contest included — NOT the PDF-comparable figures)`);
  console.log("");
  /* Two questions, and only one of them can block a release.
   *
   * A skill with no whole-program evidence anywhere on the required path is one
   * the curriculum cannot show a learner can use unaided, which is the
   * programme's own headline promise. A skill missing from one 20-minute check
   * is a sampling question about what a check is for. Reporting them as one
   * number — "20 never assessed skills" — is what this script used to do, and
   * it made the second look like the first. */
  const BLOCKING = new Set(["no independent evidence anywhere", "independent evidence ONLY in the optional bank", "never practised", "practised before introduced"]);
  const blockers = problems.filter((p) => BLOCKING.has(p.kind));
  const sampling = problems.filter((p) => !BLOCKING.has(p.kind));

  console.log("  ── EVIDENCE (can block a release) ──");
  if (blockers.length) {
    for (const p of blockers) console.log(`    ! ${p.skill}: ${p.kind} — ${p.detail}`);
  } else {
    console.log("    none — every skill has whole-program evidence on the required path");
  }
  console.log("");
  console.log("  ── SAMPLING (a question about what a monthly check is for) ──");
  if (sampling.length) {
    for (const p of sampling) console.log(`    · ${p.skill}: ${p.kind} — ${p.detail}`);
  } else {
    console.log("    none");
  }
  console.log("");
  console.log(`  ${blockers.length} evidence finding(s), ${sampling.length} sampling finding(s).`);
  console.log("");
}
