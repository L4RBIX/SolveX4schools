import type { LessonBlock, Month } from "./types";
import { ATTEMPT_BLOCK_TYPES } from "./types";
import { PROGRAM } from "./program";
import { SKILL_BY_ID } from "./skills";
import { monthInventory, programInventory, isTask } from "./inventory";
import { TASK_TARGETS, PROGRAMME_FACTS } from "./source-of-truth";

/**
 * Curriculum validator.
 *
 * Its job is to make the gap between what the programme promises and what the
 * product actually contains **impossible to overlook**. It does not fail the
 * build for missing content — content genuinely is authored over the year —
 * but it fails hard on anything that would mislead: a broken skill reference,
 * a diagnostic mapping that guesses, a duplicate id, a month whose structure
 * contradicts the PDF.
 *
 * Run: `npm run curriculum:validate`
 */

export type Severity = "error" | "warning" | "info";

export interface Issue {
  severity: Severity;
  where: string;
  message: string;
}

const issues: Issue[] = [];

function err(where: string, message: string) {
  issues.push({ severity: "error", where, message });
}
function warn(where: string, message: string) {
  issues.push({ severity: "warning", where, message });
}
function info(where: string, message: string) {
  issues.push({ severity: "info", where, message });
}

/* -- 1. Structural integrity ------------------------------------------------ */

const seenIds = new Map<string, string>();
function claimId(id: string, where: string) {
  const prev = seenIds.get(id);
  if (prev) err(where, `duplicate id "${id}" — also used at ${prev}`);
  else seenIds.set(id, where);
}

function checkBlock(block: LessonBlock, where: string) {
  claimId(block.id, where);

  if (block.skillRefs.length === 0 && isTask(block)) {
    err(where, `attempt block "${block.id}" declares no skills — its evidence goes nowhere`);
  }
  for (const skill of block.skillRefs) {
    if (!SKILL_BY_ID.has(skill)) {
      err(where, `block "${block.id}" references unknown skill "${skill}"`);
    }
  }

  if (block.sourceType === "curriculum-derived" && block.pdfPage === undefined) {
    err(where, `block "${block.id}" claims curriculum provenance but cites no PDF page`);
  }

  // The diagnostic rule from types.ts, enforced rather than merely documented.
  if (block.diagnosticMapping) {
    if (!isTask(block)) {
      err(where, `block "${block.id}" is not an attempt block but carries a diagnostic mapping`);
    }
    for (const [answer, entry] of Object.entries(block.diagnosticMapping)) {
      if (!entry.justification || entry.justification.trim().length < 20) {
        err(
          where,
          `diagnostic mapping for "${answer}" in "${block.id}" has no real justification — ` +
            `a mapping without one is a guess about a child's mind`,
        );
      }
    }
  }

  // Reference solutions must never be exposed as learner-visible prose.
  if ("referenceSolution" in block && typeof block.referenceSolution === "string") {
    if (block.referenceSolution.trim() === "") {
      err(where, `block "${block.id}" has an empty referenceSolution`);
    }
  }

  // A code task with no hidden case can be passed by hardcoding the sample.
  if ("cases" in block && Array.isArray(block.cases)) {
    if (block.cases.length === 0) {
      err(where, `block "${block.id}" has no test cases`);
    } else if (!block.cases.some((c) => "hidden" in c && c.hidden)) {
      warn(
        where,
        `block "${block.id}" has no hidden case — a learner can pass it by printing the sample answer`,
      );
    }
  }
}

function checkMonth(month: Month) {
  const where = `month ${month.index} (${month.monthName.kk})`;
  claimId(`month:${month.index}`, where);

  if (month.units.length === 0) err(where, "has no units");
  if (!month.assessment) {
    err(where, "has no assessment — the programme requires a monthly check (PDF p.6)");
  }

  const monthSkills = new Set<string>();

  for (const unit of month.units) {
    claimId(unit.id, `${where} › ${unit.title.kk}`);
    if (unit.lessons.length === 0) err(`${where} › ${unit.id}`, "unit has no lessons");

    for (const lesson of unit.lessons) {
      const lw = `${where} › ${unit.id} › ${lesson.id}`;
      claimId(lesson.id, lw);

      if (lesson.objectives.length === 0) err(lw, "lesson declares no objectives");
      if (lesson.skillRefs.length === 0) err(lw, "lesson declares no skills");
      for (const skill of lesson.skillRefs) {
        if (!SKILL_BY_ID.has(skill)) err(lw, `unknown skill "${skill}"`);
        monthSkills.add(skill);
      }

      // PDF p.3: explanation is 5–8 minutes, one idea per lesson.
      if (lesson.estimatedMinutes > 12) {
        warn(
          lw,
          `estimated ${lesson.estimatedMinutes} min — the programme specifies short lessons ` +
            `of 5–8 minutes carrying one idea (PDF p.3)`,
        );
      }

      if (lesson.status !== "draft" && lesson.blocks.length === 0) {
        err(lw, `status "${lesson.status}" but contains no blocks`);
      }
      if (lesson.status !== "draft" && !lesson.blocks.some(isTask)) {
        err(lw, `status "${lesson.status}" but contains nothing the learner does`);
      }

      for (const block of lesson.blocks) checkBlock(block, lw);
    }
  }

  if (month.assessment) {
    const aw = `${where} › assessment`;
    claimId(month.assessment.id, aw);
    for (const block of month.assessment.blocks) checkBlock(block, aw);

    if (month.assessment.status !== "draft") {
      const modes = month.assessment.blocks
        .filter((b): b is Extract<LessonBlock, { type: "verify" }> => b.type === "verify")
        .map((b) => b.mode);
      if (!modes.includes("unseen_problem")) {
        err(aw, "no unseen problem — a solved-before task cannot establish understanding (PDF p.6)");
      }
      if (!modes.includes("oral_explanation")) {
        err(aw, "no oral explanation — required by the programme's verification set (PDF p.6)");
      }
    }
  }

  // Every skill the taxonomy says belongs to this month must be taught in it.
  for (const [id, skill] of SKILL_BY_ID) {
    if (skill.introducedInMonth === month.index && !monthSkills.has(id)) {
      err(where, `skill "${id}" is declared as introduced this month but no lesson teaches it`);
    }
  }

  // Progression: a month may not depend on a skill introduced later.
  for (const skill of monthSkills) {
    const def = SKILL_BY_ID.get(skill);
    if (def && def.introducedInMonth > month.index) {
      err(
        where,
        `uses skill "${skill}" which the taxonomy introduces in month ${def.introducedInMonth} — ` +
          `this breaks progression`,
      );
    }
  }
}

/* -- 2. Programme-level checks ---------------------------------------------- */

function checkProgramme() {
  const where = "programme";

  if (PROGRAM.months.length !== 9) {
    err(where, `has ${PROGRAM.months.length} months, the programme specifies 9`);
  }
  const indices = PROGRAM.months.map((m) => m.index);
  if (indices.join(",") !== "1,2,3,4,5,6,7,8,9") {
    err(where, `month indices are ${indices.join(",")}, expected 1..9 in order`);
  }

  const declared = PROGRAM.months
    .filter((m) => m.index <= 8) // May's count is derived, not quoted
    .reduce((n, m) => n + m.expectedTaskCount, 0);
  if (declared !== TASK_TARGETS.sumOfMonthlyCounts) {
    err(
      where,
      `per-month task counts sum to ${declared}; the PDF's monthly figures sum to ` +
        `${TASK_TARGETS.sumOfMonthlyCounts}`,
    );
  }

  const theory = PROGRAM.months.reduce((n, m) => n + m.theoryHours, 0);
  const practice = PROGRAM.months.reduce((n, m) => n + m.practiceHours, 0);
  const ratio = practice / (theory + practice);
  if (Math.abs(ratio - PROGRAMME_FACTS.practiceRatio) > 0.06) {
    err(
      where,
      `practice share is ${(ratio * 100).toFixed(1)}%, the programme mandates ` +
        `${PROGRAMME_FACTS.practiceRatio * 100}% (PDF p.2)`,
    );
  } else {
    info(where, `practice share ${(ratio * 100).toFixed(1)}% — within tolerance of the mandated 70%`);
  }

  for (const [id, skill] of SKILL_BY_ID) {
    if (skill.introducedInMonth < 1 || skill.introducedInMonth > 9) {
      err(where, `skill "${id}" claims month ${skill.introducedInMonth}`);
    }
  }
}

/* -- 3. Report -------------------------------------------------------------- */

export function validate(): Issue[] {
  issues.length = 0;
  seenIds.clear();
  checkProgramme();
  for (const month of PROGRAM.months) checkMonth(month);
  return [...issues];
}

function bar(done: number, total: number, width = 24): string {
  if (total === 0) return " ".repeat(width);
  const filled = Math.min(width, Math.round((done / total) * width));
  return "█".repeat(filled) + "·".repeat(width - filled);
}

export function report(): { issues: Issue[]; hasErrors: boolean } {
  const found = validate();
  const errors = found.filter((i) => i.severity === "error");
  const warnings = found.filter((i) => i.severity === "warning");

  const lines: string[] = [];
  lines.push("");
  lines.push("  Curriculum validation — SolveX4Schools");
  lines.push("  " + "─".repeat(66));
  lines.push("");
  lines.push("  Month                          promised  built  validated  published");

  for (const month of PROGRAM.months) {
    const inv = monthInventory(month);
    const name = `${month.index}. ${month.monthName.kk}`.padEnd(30);
    lines.push(
      `  ${name}${String(inv.expected).padStart(8)}${String(inv.implemented).padStart(7)}` +
        `${String(inv.validated).padStart(11)}${String(inv.published).padStart(11)}`,
    );
  }

  const total = programInventory();
  lines.push("  " + "─".repeat(66));
  lines.push(
    `  ${"Total".padEnd(30)}${String(total.expected).padStart(8)}` +
      `${String(total.implemented).padStart(7)}${String(total.validated).padStart(11)}` +
      `${String(total.published).padStart(11)}`,
  );
  lines.push("");
  lines.push(`  built     ${bar(total.implemented, total.expected)}  ${total.implemented}/${total.expected}`);
  lines.push(`  published ${bar(total.published, total.expected)}  ${total.published}/${total.expected}`);
  lines.push("");

  if (errors.length) {
    lines.push(`  ${errors.length} error${errors.length === 1 ? "" : "s"}`);
    for (const i of errors) lines.push(`    ✗ ${i.where}: ${i.message}`);
    lines.push("");
  }
  if (warnings.length) {
    lines.push(`  ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`);
    for (const i of warnings) lines.push(`    ! ${i.where}: ${i.message}`);
    lines.push("");
  }
  if (!errors.length) {
    lines.push("  No errors. Content coverage is reported above and is not an error —");
    lines.push("  months are authored across the year. Students only ever see `published`.");
    lines.push("");
  }

  // eslint-disable-next-line no-console
  console.log(lines.join("\n"));
  return { issues: found, hasErrors: errors.length > 0 };
}
