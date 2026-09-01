import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MONTHS } from "@schools/curriculum/months";
import { loadOf } from "../../scripts/workload";
import { isIndependent, isTask, monthInventory, roleOf } from "@schools/curriculum/inventory";
import type { LessonBlock, Month } from "@schools/curriculum/types";

/**
 * The audit documents state numbers. This asserts they are still true.
 *
 * Every figure in `docs/curriculum/` was correct when it was written and every
 * one of them describes content that keeps changing underneath it. Within one
 * afternoon the reconciliation doc, the release audit and the workload model all
 * drifted: fourteen tasks moved to the bank and one assessment block was
 * removed, and three documents went on reporting 457, 615 and 37.
 *
 * Nothing caught that. The scripts were right, the docs were wrong, and the
 * docs are what a person reads. A stale figure in a release audit is worse than
 * no figure, because it is quoted.
 *
 * This checks the load-bearing ones — the counts a reader would act on — by
 * recomputing them and looking for the number in the file. It is deliberately
 * not a full diff of generated tables: a document that cannot be edited without
 * a test failing stops being written in prose, and the prose is the point.
 *
 * When this fails, the fix is to regenerate:
 *
 *   npx tsx scripts/reconcile-counts.ts --markdown
 *   npx tsx scripts/workload.ts --markdown
 *   npx tsx scripts/skill-matrix.ts --markdown
 */

const DOCS = "docs/curriculum";
const read = (f: string) => readFileSync(`${DOCS}/${f}`, "utf8");

const CORE = "core";
const visible = (b: LessonBlock) => !b.tracks || (b.tracks as readonly string[]).includes(CORE);

function tally(months: readonly Month[]) {
  let blocks = 0;
  let attempt = 0;
  let practice = 0;
  let bank = 0;
  let assessment = 0;
  let contest = 0;
  /* The two columns that drifted with nothing watching them.
   *
   * `isIndependent` is `write_code && !starter?.trim()`. The C++ migration gave
   * eight September write_code blocks a frame starter — correctly, the pedagogy
   * doc says the frame is GIVEN as scaffold before it is required — so all
   * eight flipped independent -> guided: September 25 -> 17, the year 159 ->
   * 151. Three documents kept claiming 159 and stayed green, because the
   * headline "written from nothing against a promised ~100" was prose no
   * assertion covered. */
  let independent = 0;
  let guided = 0;
  for (const month of months) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const b of lesson.blocks) {
          if (!visible(b)) continue;
          blocks += 1;
          if (!isTask(b)) continue;
          attempt += 1;
          const role = roleOf(b, lesson.id, false);
          if (role === "bank") bank += 1;
          else if (role === "contest") {
            contest += 1;
            practice += 1;
            /* Contest blocks count as practice and are deliberately NOT split
               into independent/guided — `reconcile-counts.ts` `continue`s here
               and this must agree with it, or the two disagree by 20. */
          } else {
            practice += 1;
            /* `isIndependent` from the inventory, not a local predicate. It is
               broader than "write_code with no starter": a `challenge` and a
               `verify` in `unseen_problem` mode also count, and a second
               definition here would drift from the generator the documents are
               produced by — which is the failure this whole file exists to
               catch. */
            if (isIndependent(b)) independent += 1;
            else guided += 1;
          }
        }
      }
    }
    for (const b of month.assessment?.blocks ?? []) {
      if (!visible(b)) continue;
      blocks += 1;
      if (isTask(b)) {
        attempt += 1;
        assessment += 1;
      }
    }
  }
  return { blocks, attempt, practice, bank, assessment, contest, independent, guided };
}

const T = tally(MONTHS);

describe("the audit documents report the corpus that exists", () => {
  it("has a corpus to report", () => {
    expect(T.blocks).toBeGreaterThan(500);
    expect(T.practice).toBeGreaterThan(300);
  });

  const cases: { file: string; label: string; value: () => number }[] = [
    { file: "TASK_COUNT_RECONCILIATION.md", label: "total blocks", value: () => T.blocks },
    { file: "TASK_COUNT_RECONCILIATION.md", label: "attempt blocks", value: () => T.attempt },
    { file: "TASK_COUNT_RECONCILIATION.md", label: "comparable practice", value: () => T.practice },
    { file: "TASK_COUNT_RECONCILIATION.md", label: "assessment tasks", value: () => T.assessment },
    { file: "FULL_YEAR_RELEASE_AUDIT.md", label: "total blocks", value: () => T.blocks },
    { file: "FULL_YEAR_RELEASE_AUDIT.md", label: "comparable practice", value: () => T.practice },
    { file: "FULL_YEAR_RELEASE_AUDIT.md", label: "monthly-check tasks", value: () => T.assessment },
    { file: "FULL_YEAR_RELEASE_AUDIT.md", label: "contest problems", value: () => T.contest },
    { file: "FULL_YEAR_RELEASE_AUDIT.md", label: "bank", value: () => T.bank },
    /* The traceability manifest's Built column read nine zeros beside
       September's 36 for eight months of authoring, because nothing read it. */
    { file: "CURRICULUM_TRACEABILITY.md", label: "comparable practice", value: () => T.practice },

    /* The independent count, in all four documents that headline it. It is the
       one figure a reader checks against the PDF's «~100 толық дербес шешім»,
       and it is the one that went stale silently. Regenerate with
       `npx tsx scripts/reconcile-counts.ts --markdown`. */
    { file: "TASK_COUNT_RECONCILIATION.md", label: "independent solutions", value: () => T.independent },
    { file: "FULL_YEAR_RELEASE_AUDIT.md", label: "independent solutions", value: () => T.independent },
    { file: "RELEASE_VERDICT.md", label: "independent solutions", value: () => T.independent },
    { file: "FULL_YEAR_CONTENT_FREEZE.md", label: "independent solutions", value: () => T.independent },
  ];

  for (const c of cases) {
    it(`${c.file} states the current ${c.label}`, () => {
      const n = c.value();
      expect(
        read(c.file),
        `${c.file} does not mention ${n}, the current ${c.label} — regenerate it`,
      ).toContain(String(n));
    });
  }

  it("the redundancy audit lists every banked task", () => {
    /* This doc's table is the only place the bank is enumerated for a reader,
       and a task banked later without a row here is invisible to them. */
    const doc = read("FULL_YEAR_REDUNDANCY_AUDIT.md");
    const banked: string[] = [];
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const b of lesson.blocks) if (b.bank) banked.push(b.id);
        }
      }
    }
    expect(banked.length).toBeGreaterThan(10);
    const absent = banked.filter((id) => !doc.includes(`\`${id}\``));
    expect(absent, "banked tasks with no row in the redundancy audit").toEqual([]);
  });

  it("the content freeze is dated and says it is a snapshot", () => {
    /* The freeze doc is the ONE that must not track the corpus: it records a
       commit. So it is exempt from the checks above, and instead has to say so
       — otherwise a reader takes its table for the current state. */
    const freeze = read("FULL_YEAR_CONTENT_FREEZE.md");
    expect(freeze).toMatch(/deliberately not updated/i);
    expect(freeze).toMatch(/^\*\*Frozen at `[0-9a-f]{40}`/m);
  });
});

describe("the two things that count tasks agree", () => {
  /**
   * `monthInventory` (the validator's table) and `reconcile-counts.ts` (the
   * reconciliation doc) both answer "how many tasks does this month have", and
   * for most of this workstream they answered differently: the validator summed
   * all three routes with the monthly check and the bank folded in, and printed
   * the result against the PDF's figure as a progress bar. October read 85
   * against 38; the year read 587 against 279 and drew a full bar.
   *
   * That is the comparison TASK_COUNT_RECONCILIATION.md exists to refute, being
   * printed by a release gate the release audit reports as passing. Two code
   * paths for one question is how it survived, so this asserts they cannot part
   * again.
   */
  it("month by month, and for the year", () => {
    const bank = new Set<string>();
    for (const m of MONTHS) {
      for (const u of m.units) for (const l of u.lessons) for (const b of l.blocks) if (b.bank) bank.add(b.id);
    }
    for (const month of MONTHS) {
      const inv = monthInventory(month);
      let comparable = 0;
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const b of lesson.blocks) {
            if (!isTask(b) || bank.has(b.id)) continue;
            if (b.tracks && !(b.tracks as readonly string[]).includes("core")) continue;
            comparable += 1;
          }
        }
      }
      expect(
        inv.implemented,
        `month ${month.index}: the validator says ${inv.implemented} where the PDF-comparable count is ${comparable}`,
      ).toBe(comparable);
    }
  });
});

describe("one cost model, not two", () => {
  /**
   * `validate.ts` warns when an assessment overruns its stated duration, and
   * `scripts/workload.ts` prices the year. Both used to carry their own minute
   * table and they disagreed: January's check read 21 minutes in one and 22 in
   * the other, and nothing said which was the curriculum's answer.
   *
   * Both now read `schools/curriculum/cost.ts`. This asserts the arithmetic on
   * top of it still agrees, which a shared table makes likely but does not make
   * certain — the validator sums assessment blocks and `loadOf` sums them by
   * role, and those are different code paths over the same numbers.
   */
  it("the validator's assessment estimate matches the workload model's", async () => {
    const { costOf } = await import("@schools/curriculum/cost");
    for (const month of MONTHS) {
      const a = month.assessment;
      if (!a?.blocks.length) continue;
      const direct = a.blocks.reduce((n, b) => n + costOf(b, "expected"), 0);
      const viaLoad = loadOf(month, "core", "expected").assessment;
      /* `loadOf` counts only attempt blocks in the assessment; the validator
         counts every block. Assessments hold no passive blocks today, so the
         two must agree — and if one ever gains a concept card, this is where
         that shows up rather than in a silent one-minute drift. */
      expect(
        Math.round(viaLoad),
        `month ${month.index}: validator says ${direct}, the workload model says ${viaLoad}`,
      ).toBe(Math.round(direct));
    }
  });
});

describe("one definition of independent evidence", () => {
  /**
   * «толық дербес шешім» decides a headline number — the ~100 complete
   * independent solutions the programme promises — and it was defined four
   * times: identically in skill-matrix.ts and reconcile-counts.ts, and inline
   * again in requirement-matrix.ts and in the tests.
   *
   * They all agreed, which is why nothing caught it. Four copies of a
   * definition agree until one of them is edited, and the first symptom would
   * have been two documents reporting different counts for the same promise.
   */
  it("lives in inventory.ts and nowhere else re-implements it", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const files = [
      ...readdirSync("scripts").filter((f) => f.endsWith(".ts")).map((f) => `scripts/${f}`),
      ...readdirSync("tests/school").filter((f) => f.endsWith(".ts")).map((f) => `tests/school/${f}`),
    ];
    const forks: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      /* A FORK is the whole predicate rebuilt: all three arms together —
         `challenge`, a `write_code` with no starter, and `verify` with mode
         `unseen_problem`.
         Mentioning one arm is not a fork. `scripts/requirement-matrix.ts` maps
         the programme's first year-end outcome — reading a statement and
         separating what is given from what is asked — onto `test_case` and
         `verify:unseen_problem`, which is a genuinely different concept that
         happens to share a clause. Forcing that through the shared helper would
         be abstraction for its own sake and would make it wrong. */
      const arms = [
        /"challenge"/.test(src),
        /starter\?\.trim\(\)/.test(src),
        /mode\s*===\s*"unseen_problem"/.test(src),
      ].filter(Boolean).length;
      if (arms === 3) forks.push(f);
    }
    expect(
      forks,
      "these re-implement isIndependent — import it from @schools/curriculum/inventory instead",
    ).toEqual([]);
  });

  it("agrees with what the programme means by it", async () => {
    const { isIndependent, isGuided, isTask } = await import("@schools/curriculum/inventory");
    let independent = 0;
    let guided = 0;
    for (const month of MONTHS) {
      for (const unit of month.units) {
        for (const lesson of unit.lessons) {
          for (const b of lesson.blocks) {
            if (!isTask(b)) {
              /* A block the learner does not act on is neither. */
              expect(isIndependent(b), `${b.id}`).toBe(false);
              expect(isGuided(b), `${b.id}`).toBe(false);
              continue;
            }
            /* Every task is exactly one of the two. */
            expect(isIndependent(b) !== isGuided(b), `${b.id} is both or neither`).toBe(true);
            if (isIndependent(b)) independent += 1;
            else guided += 1;
          }
        }
      }
    }
    expect(independent).toBeGreaterThan(100);
    expect(guided).toBeGreaterThan(100);
  });
});
