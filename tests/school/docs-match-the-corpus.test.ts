import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MONTHS } from "@schools/curriculum/months";
import { isTask, roleOf } from "@schools/curriculum/inventory";
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
          } else practice += 1;
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
  return { blocks, attempt, practice, bank, assessment, contest };
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
