import { checkerProblem } from "../exec/checker";
import type { LessonBlock, Month } from "./types";
import { ATTEMPT_BLOCK_TYPES } from "./types";
import { PROGRAM } from "./program";
import { costOf } from "./cost";
import { SKILL_BY_ID } from "./skills";
import { monthInventory, programInventory, isTask } from "./inventory";
import { TASK_TARGETS, PROGRAMME_FACTS } from "./source-of-truth";
import { secretStringsOf, templateWithoutBlanks } from "./public";

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

  /* Bank membership, enforced rather than merely documented.
   *
   * The field decides whether a fourteen-year-old has to do a piece of work, so
   * the bar for putting a task in the bank is that somebody wrote down why. The
   * two rules below are the ones that can be checked mechanically:
   *
   * A non-attempt block cannot be optional. A concept the learner reads is not
   * practice, so marking it `bank` says nothing and hides that the author meant
   * something else — usually that the lesson should not have contained it.
   *
   * A justification has to name the tasks that make this one spare. "Extra
   * practice" is a category, not a reason, and a reason that names no sibling
   * cannot be checked by the next person or falsified by anyone. `extension` is
   * exempt: a task that goes beyond the month's outcomes is justified by what
   * it needs rather than by what already covers it. */
  if (block.bank) {
    if (!isTask(block)) {
      err(where, `block "${block.id}" is not an attempt block but claims bank membership`);
    }
    const why = block.bank.why.trim();
    if (why.length < 40) {
      err(where, `block "${block.id}" is in the bank on a ${why.length}-character justification`);
    }
    if (block.bank.role !== "extension" && !/\bm\d+\.[a-z]\d+/.test(why)) {
      err(
        where,
        `block "${block.id}" is banked as "${block.bank.role}" but its justification names no ` +
          `task that already carries the evidence`,
      );
    }
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

  /*
   * The checker has to be usable BEFORE anyone is graded by it.
   *
   * The case this exists for is a `numeric` checker with no declared tolerance.
   * There is no global default and there deliberately never will be — a
   * tolerance is a statement about how wrong this particular answer is allowed
   * to be, and only the author of the task knows it. So the choice at runtime
   * is between inventing a number for them (which marks children right or wrong
   * on a rule nobody wrote) and refusing to grade. It refuses; this is the gate
   * that means it never has to.
   */
  if ("checker" in block && block.checker) {
    const problem = checkerProblem(block.checker);
    if (problem) err(where, `block "${block.id}" declares an unusable checker — ${problem}`);
    if (!("cases" in block) || !Array.isArray(block.cases) || block.cases.length === 0) {
      warn(where, `block "${block.id}" declares a checker but has no cases for it to check`);
    }
  }

  if (block.type === "fill_blank") checkFillBlank(block, where);
}

/**
 * Does an identifier-like needle occur in the haystack as a whole token?
 *
 * Plain `includes` is unusable for the same-line rule below. Sixty-seven
 * fill_blank blocks contain a template with `for (int i = 0; i < ___; i++)` and
 * a blank whose answer is `n`, and `"    for (int i = 0; i <  ; i++) {"`
 * contains `n` — inside `int`. A substring rule reports eighteen same-line
 * cases, eleven of which are that: a one-character answer hiding inside a
 * keyword. Token boundaries reduce it to seven, and all seven are real.
 *
 * The boundary is only required on an end that is itself identifier-like, so
 * `vector<int>` matches after `(` and before ` ` while `||` and `*` — which
 * cannot abut an identifier in any meaningful sense — match anywhere.
 */
const WORD_CHAR = /[A-Za-z0-9_]/;
function containsToken(haystack: string, needle: string): boolean {
  if (needle === "") return false;
  let from = 0;
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, from)) {
    from = at + 1;
    const before = at > 0 ? haystack[at - 1] : "";
    const after = at + needle.length < haystack.length ? haystack[at + needle.length] : "";
    const leftClear = !WORD_CHAR.test(needle[0]) || !WORD_CHAR.test(before);
    const rightClear = !WORD_CHAR.test(needle[needle.length - 1]) || !WORD_CHAR.test(after);
    if (leftClear && rightClear) return true;
  }
  return false;
}

/**
 * The fill_blank rules — the block type that had none.
 *
 * ## Why it needed them
 *
 * `m3.l8.b8s` turned the payload-privacy sweep red on `vector<int>`, and the
 * sweep was wrong: the token reaches the browser inside `template`, which
 * `publicBlock` must ship because for a fill_blank the template IS the
 * question. `types.ts` now carries a `shown` flag so that excusal is declared
 * rather than inferred, and this is where the declaration is held to account.
 *
 * The interesting part is what the same block looks like once the false
 * positive is gone. Its first blank is on line 5:
 *
 *     ___ only_even(vector<int> a) {
 *
 * The answer is fifteen characters to the right of the slot it fills. That is
 * a real authoring defect, and it was invisible for as long as the only thing
 * anyone looked at was whether a string escaped. Rule (b) is the check that
 * sees it — and it sees six more like it that nobody had reported.
 *
 * ## Why the two directions of the `shown` rule have different severities
 *
 * They fail in opposite directions and only one of them can leak.
 *
 * A blank declared `shown` whose template does NOT display the answer is a
 * false declaration. `secretStringsOf` refuses to honour it — the flag alone
 * excuses nothing — but the block now asserts something untrue about itself,
 * and the next person to touch the excusal would be reading a lie. Error.
 *
 * A blank whose template displays the answer and which is NOT declared is only
 * a leak if the sweep would otherwise have withheld it, so that is exactly the
 * condition: ask `secretStringsOf` rather than re-deriving its rules here, and
 * the two can never drift apart. Error when it applies.
 *
 * ## Why the remaining 82 are silent, and must stay silent
 *
 * Eighty-two blanks answer a variable or constant their own template uses
 * elsewhere — `n`, `0`, `i`, `left`, `return`. Every one of them is undeclared
 * and none of them is a defect: naming the loop bound `n` in a program that
 * reads `n` is what a fill_blank IS.
 *
 * The first cut of this function warned on all of them, one line per block. It
 * added 48 warnings to a list of 19 and buried the 19 — and it bought nothing,
 * because the condition it pre-announced ("the sweep would flag this the day
 * the answer grows") is already caught the day it grows, by the sweep AND by
 * the error above, with the block named in both. Paying 48 lines of noise for
 * a warning about a future the errors already cover is the trade this file
 * argues against everywhere else. Do not add it back.
 */
function checkFillBlank(block: Extract<LessonBlock, { type: "fill_blank" }>, where: string) {
  const lines = block.template.split("\n");

  /* The i-th blank fills the i-th `___`: that is the contract `template`
     documents and the only thing that makes `blanks` orderable against the
     template at all. Every rule below indexes on it, and the client draws one
     input per blank, so a mismatch means the learner is shown the wrong number
     of boxes AND every rule here is comparing an answer against someone else's
     slot. Check it first and skip the rest when it fails, rather than
     reporting nonsense derived from a broken mapping. */
  const markerLine: number[] = [];
  lines.forEach((line, i) => {
    for (let k = (line.match(/___/g) ?? []).length; k > 0; k -= 1) markerLine.push(i);
  });
  if (markerLine.length !== block.blanks.length) {
    err(
      where,
      `block "${block.id}" has ${markerLine.length} \`___\` marker(s) but ${block.blanks.length} ` +
        `blank(s) — the i-th blank fills the i-th marker, so the two cannot disagree`,
    );
    return;
  }

  const shipped = templateWithoutBlanks(block.template);
  const withheld = new Set(secretStringsOf(block));

  block.blanks.forEach((blank, i) => {
    const displayed = shipped.includes(blank.answer);

    if (blank.shown && !displayed) {
      err(
        where,
        `blank "${blank.id}" of "${block.id}" is declared \`shown\` but its template never ` +
          `displays ${JSON.stringify(blank.answer)} — the declaration says the learner reads this ` +
          `token off the screen, and they cannot`,
      );
    }

    if (displayed && !blank.shown && withheld.has(blank.answer)) {
      err(
        where,
        `blank "${blank.id}" of "${block.id}" answers ${JSON.stringify(blank.answer)}, which its ` +
          `own template displays, but is not declared \`shown\` — the payload-privacy sweep will ` +
          `withhold a token the projection has to ship, and go red on it`,
      );
    }

    /* Rule (b): the answer is readable on the same line as the slot it fills.
     *
     * `shown` says the token appears somewhere in the program, which is a fair
     * thing to ask a learner to read. On the SAME line as its own slot is a
     * different claim — it can be copied sideways without understanding
     * anything, and the block stops measuring what it says it measures.
     *
     * ## A warning, not an error, and the seven findings are why
     *
     * It was an error first. Three of its seven findings are real giveaways —
     * `vector<int>` beside `___ only_even(vector<int> a)`, `||` with three more
     * `||` to its right, `*` echoed by `2 * (a ___ b)`. The other four are
     * coincidence: `0` matching inside `nr >= 0`, `sr` and `sc` matching their
     * own array subscripts, `2` matching the index in `dp[2] = ___;`. In every
     * one of those the token carries a different meaning in the two places, and
     * a learner reading `dp[2] = ___;` learns nothing from the `2` in the
     * subscript.
     *
     * Telling those apart needs the semantic role of a token, which needs a
     * parser this validator does not have. The available proxy is length, and
     * length is exactly the lottery that let `vector<int>` through the privacy
     * sweep while 82 shorter answers sailed past — reintroducing it here would
     * repeat the mistake one layer down.
     *
     * So it reports rather than blocks. A false error stops a release for a
     * coincidence; a warning puts seven real lines in front of a curriculum
     * author, three of which are worth acting on, and the two rules above stay
     * errors because they are correctness claims rather than taste. */
    const line = lines[markerLine[i]];
    if (containsToken(line.replace(/___/g, " "), blank.answer)) {
      warn(
        where,
        `blank "${blank.id}" of "${block.id}" answers ${JSON.stringify(blank.answer)} and line ` +
          `${markerLine[i] + 1} of its template already shows that token beside the slot: ` +
          `${JSON.stringify(line.trim())} — the answer is copyable sideways`,
      );
    }
  });
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

      /* A lesson that names a skill none of its blocks names.
       *
       * A warning rather than an error, because the two declarations answer
       * different questions and are allowed to differ. A block's `skillRefs`
       * says what the learner is graded on; a lesson's says what the lesson is
       * ABOUT, and May's contest lessons legitimately declare
       * `contest.time_split` — splitting your time is what a contest IS — while
       * no single problem inside grades it.
       *
       * It is worth saying out loud all the same. Nothing derives coverage from
       * the lesson-level list, so a stale entry inflates no reported figure; it
       * misleads a READER, and it misled an audit into calling `m7.l6` a
       * coverage gap because the lesson advertises route restoration that none
       * of its ten blocks carries. */
      const carried = new Set(lesson.blocks.flatMap((b) => b.skillRefs));
      const unevidenced = lesson.skillRefs.filter((s) => !carried.has(s));
      if (lesson.blocks.length > 0 && unevidenced.length > 0) {
        warn(
          lw,
          `lesson declares ${unevidenced.map((s) => `"${s}"`).join(", ")} but no block in it does — ` +
            `the lesson advertises coverage its blocks do not carry`,
        );
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

      /*
       * Does the check fit the minutes it claims?
       *
       * September's original monthly check carried four graded tasks against a
       * stated twenty minutes and timed at over thirty. An adversarial review
       * found the same shape in October and November: four graded blocks, and
       * November's amounted to a from-scratch three-function program plus
       * roughly eighteen separate written or spoken sub-answers.
       *
       * A learner cannot be told a check is twenty minutes and then handed
       * forty, so this is arithmetic rather than judgement. Every number is
       * arguable and meant to be argued with; what is not arguable is that
       * somebody should have done the sum. An `explain` prompt is costed per
       * QUESTION — four numbered questions is four answers — because that is
       * where the September check quietly doubled.
       *
       * The table lives in `./cost`, and used to live here as well. Two copies
       * disagreed by a minute or two throughout, so January read 21 minutes in
       * `scripts/workload.ts` and 22 here and a reader could not tell which was
       * the curriculum's answer. `expected` is the scenario a warning should
       * fire on: a check sized for the fast learner is a check most of the
       * class cannot finish.
       */
      let estimate = 0;
      for (const block of month.assessment.blocks) estimate += costOf(block, "expected");

      if (estimate > month.assessment.minutes) {
        warn(
          aw,
          `estimated ${Math.round(estimate)} min against a stated ${month.assessment.minutes} — ` +
            `${month.assessment.blocks.length} blocks. A check that overruns is one a learner ` +
            `cannot finish, and the part they do not reach is recorded as the part they could not do`,
        );
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
