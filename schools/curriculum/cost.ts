/**
 * What a block costs a learner, in minutes.
 *
 * One table, because there used to be two. `validate.ts` warned that an
 * assessment overran its stated duration and `scripts/workload.ts` priced the
 * whole year, and they disagreed by a minute or two throughout — enough that
 * January read 21 in one and 22 in the other, and a reader could not tell which
 * was the curriculum's answer. That is the same defect as two things counting
 * tasks differently, and it has the same fix.
 *
 * ## Three learners, not one
 *
 * FAST has understood the lesson and writes the loop correctly first time.
 * EXPECTED gets a task wrong once or twice and re-reads the statement — who the
 * programme is aimed at, and the scenario `validate.ts` warns on.
 * SLOW needs the concept twice and meets a real bug on most from-scratch work:
 * the bottom third of an ordinary class, not an outlier.
 *
 * The spread is widest where production happens. Re-reading a concept costs a
 * small multiple; being stuck on a from-scratch problem has no ceiling, and
 * 2.5x is already an optimistic way to model no ceiling.
 *
 * ## Not validated
 *
 * Every number here is an estimate about a fourteen-year-old made by people who
 * have not watched one. They are in one table, in the open, so that arguing
 * with them is cheap and the totals are reproducible — not because anybody has
 * measured them. See `docs/curriculum/FULL_YEAR_WORKLOAD.md`.
 */
import type { LessonBlock } from "./types";

export type Scenario = "fast" | "expected" | "slow";
export const SCENARIOS: readonly Scenario[] = ["fast", "expected", "slow"];

/** The programme's own monthly budget, PDF p.5: 2.5 h theory + 6 h practice. */
export const MONTH_BUDGET = { theory: 150, practice: 360, total: 510 } as const;

/** Blocks the learner reads rather than does — the programme's «түсіндіру». */
export const PASSIVE = new Set<LessonBlock["type"]>([
  "concept",
  "worked_example",
  "visual_simulation",
]);

export const MINUTES: Record<LessonBlock["type"], Record<Scenario, number>> = {
  /* Reading. A slow learner re-reads; nobody reads it in half the time. */
  concept: { fast: 1.5, expected: 2, slow: 3.5 },
  worked_example: { fast: 2, expected: 3, slow: 5 },
  visual_simulation: { fast: 1.5, expected: 2, slow: 3.5 },
  reflection: { fast: 1.5, expected: 2, slow: 3 },

  /* Recognition. Fast is nearly instant; slow re-reads the code twice. */
  prediction: { fast: 1, expected: 1.5, slow: 3 },
  multiple_choice: { fast: 1, expected: 1.5, slow: 3 },

  /* Filling in and assembling. Bounded by how much is already on screen. */
  fill_blank: { fast: 2, expected: 3, slow: 6 },
  reorder_code: { fast: 2, expected: 3, slow: 6 },

  /* Reading someone else's execution, or someone else's mistake. */
  trace_code: { fast: 3, expected: 5, slow: 11 },
  find_bug: { fast: 3.5, expected: 6, slow: 13 },
  modify_code: { fast: 3.5, expected: 6, slow: 13 },
  test_case: { fast: 2.5, expected: 4, slow: 8 },

  /* Writing. Per question — see `costOf`. */
  explain: { fast: 1.5, expected: 2, slow: 3.5 },

  /* From nothing. The widest spread, because being stuck has no ceiling. */
  write_code: { fast: 7, expected: 12, slow: 30 },
  challenge: { fast: 9, expected: 15, slow: 37 },
  arena_problem: { fast: 9, expected: 15, slow: 37 },
  verify: { fast: 7, expected: 12, slow: 30 }, // refined per mode in `costOf`
};

/**
 * How many separate answers a written prompt asks for.
 *
 * Numbered `(1)` markers first, then question marks. Four numbered
 * sub-questions is four answers, and treating it as one block is exactly how
 * September's monthly check came to cost thirty minutes against a stated twenty.
 */
export function questionsIn(text: string): number {
  return Math.max(1, (text.match(/\(\d\)/g) ?? []).length, (text.match(/\?/g) ?? []).length);
}

export function costOf(block: LessonBlock, scenario: Scenario = "expected"): number {
  if (block.type === "explain") return MINUTES.explain[scenario] * questionsIn(block.prompt.kk);
  if (block.type === "verify") {
    switch (block.mode) {
      case "unseen_problem":
        return MINUTES.write_code[scenario];
      case "manual_trace":
        return MINUTES.trace_code[scenario];
      case "find_bug":
        return MINUTES.find_bug[scenario];
      case "delayed_resolve":
        /* An unaided re-solve of something met weeks ago: cheaper than a new
           problem for a learner who remembers it, dearer for one who does not,
           which is most of the spread. */
        return { fast: 6, expected: 10, slow: 26 }[scenario];
      case "oral_explanation":
        return MINUTES.explain[scenario] * questionsIn(block.prompt.kk);
    }
  }
  return MINUTES[block.type][scenario];
}
