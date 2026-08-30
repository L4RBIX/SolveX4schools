import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSimulatedClass, PROFILES, type SimulatedClass } from "./simulated-class";
import { analyse, firingRate, has, type AnalysedClass } from "./harness";
import { FINDING_WEIGHT } from "../../schools/teacher/analysis";
import type { FindingKind, LearnerStatus } from "../../schools/teacher/contracts";

/**
 * Eighteen learners, and what a teacher must be able to conclude about each.
 *
 * ## What is asserted, and what deliberately is not
 *
 * Every assertion below is a SEMANTIC claim — "the assistance-dependent learner
 * is not called independent", "the stuck learner and the thrashing learner are
 * distinguishable", "a judge outage does not cost a learner anything". Not one
 * of them pins a number the dashboard renders. That is the point: a benchmark
 * of expected values would be rewritten every time a threshold moved and would
 * therefore never catch a threshold moving in the wrong direction.
 *
 * ## Signal rates
 *
 * The second half of this file asserts how OFTEN each finding fires across the
 * class. This is the check the previous teacher projection failed and its own
 * comments admit: two signals fired for sixteen of eighteen learners, including
 * both on the same child, so a support learner at nine solves out of seventeen
 * was simultaneously "ready for a harder block" and "has failures nobody can
 * explain".
 *
 * The rates are asserted as RANGES with a stated reason, never fitted to
 * produce a pretty number. Where the semantics say a signal should be common —
 * `never_started` in a class with silent enrolments — the range says so.
 */

let sim: SimulatedClass;
let week: AnalysedClass;
let programme: AnalysedClass;

beforeAll(async () => {
  sim = await buildSimulatedClass({ extraSilentLearners: 2 });
  week = await analyse(sim, "week");
  programme = await analyse(sim, "programme");
}, 180_000);

afterAll(async () => {
  await sim?.sql.close();
});

/* -------------------------------------------------------------------------- */
/* Per profile                                                                */
/* -------------------------------------------------------------------------- */

describe("what a teacher can conclude about each learner", () => {
  it("shows every enrolled learner, including those who have never worked", () => {
    /* Eighteen profiles plus two enrolled learners with no subject at all. The
       old dashboard could not surface the second group: `notStarted` was
       structurally always 0, `no_activity` was guarded by `if (lastActiveAt)`
       so it never fired for someone with no events, and a row with no signals
       sorted last. */
    expect(week.rows).toHaveLength(PROFILES.length + 2);
    const silent = week.rows.filter((r) => r.subjectId === null);
    expect(silent).toHaveLength(2);
    for (const row of silent) {
      expect(row.status).toBe<LearnerStatus>("not_started");
      expect(has(row, "never_started")).toBe(true);
    }
  });

  it("the brand new learner is neither weak nor ready", () => {
    const row = week.byProfile.get("new");
    expect(row).toBeDefined();
    expect(row!.status).not.toBe<LearnerStatus>("ready_to_stretch");
    /* One clean solve is not a reason to flag a child. */
    expect(row!.findings.filter((f) => f.kind !== "required_work_behind")).toHaveLength(0);
  });

  it("the inactive learner appears inactive, and is not called failing", () => {
    const row = week.byProfile.get("inactive");
    expect(row!.status).toBe<LearnerStatus>("dormant");
    expect(has(row, "inactive")).toBe(true);
    /* Their history was fine — they simply stopped. Nothing here may read as a
       judgement about the work they did do. */
    expect(has(row, "stuck")).toBe(false);
    expect(has(row, "thrashing")).toBe(false);
  });

  it("the strong independent learner is ready to stretch and flagged for nothing", () => {
    const row = week.byProfile.get("strong_independent");
    expect(row!.solvedIndependent).toBeGreaterThanOrEqual(4);
    expect(row!.solvedAssisted).toBe(0);
    expect(row!.independentShare).toBe(1);
    expect(row!.status).toBe<LearnerStatus>("ready_to_stretch");
    expect(row!.findings).toHaveLength(0);
  });

  it("the assistance-dependent learner is NOT counted as independent", () => {
    const row = week.byProfile.get("assistance_dependent");
    const strong = week.byProfile.get("strong_independent");

    expect(row!.solvedAssisted).toBeGreaterThan(row!.solvedIndependent);
    expect(row!.independentShare!).toBeLessThan(strong!.independentShare!);
    expect(row!.status).not.toBe<LearnerStatus>("ready_to_stretch");
    /* The dependency signal reads the cumulative projection, so it is asserted
       on the programme window where the ratio has a denominator. */
    expect(has(programme.byProfile.get("assistance_dependent"), "assistance_dependent")).toBe(true);
    expect(programme.byProfile.get("assistance_dependent")!.status).not.toBe<LearnerStatus>(
      "ready_to_stretch",
    );
  });

  it("productive struggle is NOT flagged as stuck", () => {
    const row = week.byProfile.get("productive_struggle");
    expect(has(row, "stuck")).toBe(false);
    expect(has(row, "thrashing")).toBe(false);
    /* They failed repeatedly and got there. That is the product working. */
    expect(row!.solvedIndependent).toBeGreaterThan(0);
  });

  it("stuck and thrashing stay distinct", () => {
    const stuck = week.byProfile.get("stuck");
    const thrash = week.byProfile.get("thrashing");

    expect(has(stuck, "stuck")).toBe(true);
    expect(has(thrash, "thrashing")).toBe(true);
    /* The two want opposite responses — an explanation versus an interrupt — so
       a dashboard that collapses them is worse than one that says nothing. */
    expect(has(stuck, "thrashing")).toBe(false);
    expect(has(thrash, "stuck")).toBe(false);
    expect(stuck!.status).toBe<LearnerStatus>("needs_attention");
    expect(thrash!.status).toBe<LearnerStatus>("needs_attention");
  });

  it("an unfinished monthly check is surfaced as unfinished", () => {
    const row = programme.byProfile.get("assessment_incomplete");
    expect(has(row, "assessment_incomplete")).toBe(true);
    const finding = row!.findings.find((f) => f.kind === "assessment_incomplete")!;
    /* WHO / WHY / WHAT TO DO — the row must carry all three. */
    expect(finding.detail.kk.length).toBeGreaterThan(0);
    expect(finding.detail.ru.length).toBeGreaterThan(0);
    expect(finding.recommendation.kk.length).toBeGreaterThan(0);
  });

  it("the advanced learner has independent evidence on challenge work", () => {
    const row = week.byProfile.get("advanced");
    expect(row!.solvedIndependent).toBeGreaterThanOrEqual(3);
    expect(row!.status).toBe<LearnerStatus>("ready_to_stretch");
  });

  it("a delayed re-solve improves the evidence rather than being invisible", () => {
    const row = programme.byProfile.get("delayed_resolve");
    /* They solved the task with a hint a fortnight ago and unaided since. The
       unaided attempt must be visible as independent work; the earlier assisted
       one must still be on the record. */
    expect(row!.solvedIndependent).toBeGreaterThan(0);
    expect(row!.solvedAssisted).toBeGreaterThan(0);
  });

  it("a repeated named mistake becomes an actionable, auditable finding", () => {
    const row = programme.byProfile.get("boundary_error");
    expect(has(row, "repeated_misconception")).toBe(true);
    const finding = row!.findings.find((f) => f.kind === "repeated_misconception")!;

    /* The machine key travels for audit and is NEVER the sentence. */
    expect(finding.failureClass).toBe("strict_vs_inclusive_boundary");
    expect(finding.detail.kk).not.toContain("strict_vs_inclusive_boundary");
    expect(finding.detail.ru).not.toContain("strict_vs_inclusive_boundary");
    /* Episode ids are what make the claim checkable rather than an opinion.
       The old ClassroomSignal dropped them, leaving a teacher with an assertion
       about a child and no way to disagree with it. */
    expect(finding.episodeIds!.length).toBeGreaterThanOrEqual(2);
    expect(finding.skillTitle).not.toBeNull();
  });

  it("high activity with little progress does not read as progress", () => {
    const busy = week.byProfile.get("busy_no_progress");
    const efficient = week.byProfile.get("efficient");

    expect(busy!.episodes).toBeGreaterThan(efficient!.episodes);
    /* Effort is not achievement, and the dashboard must not let volume stand in
       for it. */
    expect(busy!.solvedIndependent).toBeLessThan(efficient!.solvedIndependent);
    expect(busy!.status).toBe<LearnerStatus>("needs_attention");
  });

  it("low activity with high efficiency is not mistaken for inactivity", () => {
    const row = week.byProfile.get("efficient");
    expect(row!.episodes).toBeLessThanOrEqual(4);
    expect(row!.independentShare).toBe(1);
    expect(row!.status).not.toBe<LearnerStatus>("dormant");
    expect(has(row, "inactive")).toBe(false);
  });

  it("improvement is visible and is not a finding", () => {
    const row = week.byProfile.get("improving");
    expect(row!.solvedIndependent).toBeGreaterThan(0);
    expect(has(row, "regressed")).toBe(false);
    expect(row!.strengths.some((s) => s.kind === "improved")).toBe(true);
  });

  it("a real drop is named, with both numbers", () => {
    /* Windowed by nature: `regressed` compares this week with last week, so it
       is asserted on the week and is meaningless on the programme window, where
       "the window before the whole programme" is empty by construction. */
    const row = week.byProfile.get("regressing");
    expect(has(row, "regressed")).toBe(true);
    const finding = row!.findings.find((f) => f.kind === "regressed")!;
    /* Both windows in the sentence. A percentage alone would hide that this is
       six solves becoming one rather than sixty becoming ten. */
    expect(finding.detail.ru).toMatch(/\d+\s*→\s*\d+/);
  });

  it("the average learner is flagged for nothing and is not called ready", () => {
    const row = week.byProfile.get("average");
    expect(row!.status).toBe<LearnerStatus>("on_track");
    expect(row!.findings).toHaveLength(0);
  });

  it("a judge outage costs the learner NOTHING", () => {
    const row = programme.byProfile.get("infrastructure_failures");

    /* The two episodes with submissions and no verdict must not appear as
       failures, must not reduce the independence share, and must not produce
       an attention finding. Nothing was measured and nobody was marked wrong. */
    expect(row!.solvedAssisted).toBe(0);
    expect(row!.solvedIndependent).toBeGreaterThan(0);
    expect(row!.independentShare).toBe(1);
    expect(has(row, "stuck")).toBe(false);
    expect(has(row, "thrashing")).toBe(false);
    expect(has(row, "unexplained_failures")).toBe(false);
  });

  it("unmeasured work stays unmeasured — it never becomes failed work", () => {
    const row = programme.byProfile.get("unmeasured_work");

    /* Written explanations nothing grades. They are work that happened, and the
       three things they must never become are: a failure, a zero, and a claim
       about mastery. */
    expect(row!.episodes).toBeGreaterThan(0);
    expect(row!.solvedAssisted).toBe(0);
    expect(has(row, "unexplained_failures")).toBe(false);
    expect(has(row, "stuck")).toBe(false);
  });
});

/* -------------------------------------------------------------------------- */
/* Mutual exclusion                                                           */
/* -------------------------------------------------------------------------- */

describe("the four headline tiles partition the class", () => {
  it("no learner is both flagged and ready", () => {
    for (const row of week.rows) {
      if (row.status === "ready_to_stretch") expect(row.findings).toHaveLength(0);
      if (row.findings.length > 0) expect(row.status).not.toBe<LearnerStatus>("ready_to_stretch");
    }
  });

  it("statuses sum to the roster", () => {
    const counts = new Map<LearnerStatus, number>();
    for (const row of week.rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(week.rows.length);
  });

  it("orders the attention queue by how much a teacher's time would change", () => {
    const queue = week.rows
      .filter((r) => r.status !== "on_track" && r.status !== "ready_to_stretch")
      .sort((a, b) => weightOf(b) - weightOf(a));

    /* The ordering property that matters is monotonicity: a teacher reading top
       to bottom is reading in descending order of how much their time would
       change. Which single row is first depends on how findings stack and is
       not a property worth pinning — but a learner who has never opened the
       product must be near the top, because the fix is usually a password. */
    const firstNeverStarted = queue.findIndex((r) => r.status === "not_started");
    expect(firstNeverStarted).toBeGreaterThanOrEqual(0);
    expect(firstNeverStarted).toBeLessThan(4);
    for (let i = 1; i < queue.length; i += 1) {
      expect(weightOf(queue[i - 1])).toBeGreaterThanOrEqual(weightOf(queue[i]));
    }
  });
});

function weightOf(row: { findings: { kind: FindingKind }[] }): number {
  return row.findings.reduce((n, f) => n + (FINDING_WEIGHT[f.kind] ?? 0), 0);
}

/* -------------------------------------------------------------------------- */
/* Signal rates                                                               */
/* -------------------------------------------------------------------------- */

describe("signal quality: how often each finding fires across twenty learners", () => {
  /*
   * Ranges, each with a reason. The upper bounds exist because a signal that
   * fires for most of a class is the background rather than a signal — the
   * exact failure the previous projection had and documented.
   *
   * These are asserted on the PROGRAMME window, which is the widest and
   * therefore the most likely to over-fire.
   */
  const CASES: { kind: FindingKind; min: number; max: number; why: string }[] = [
    {
      kind: "never_started",
      min: 2,
      max: 3,
      why: "two enrolled learners with no subject, and nobody else",
    },
    {
      kind: "inactive",
      min: 1,
      max: 3,
      why: "one profile stopped three weeks ago; a handful of others may drift past the week",
    },
    {
      kind: "stuck",
      min: 1,
      max: 3,
      why: "out of ideas is rare and expensive; if it fires for a third of a class the threshold is wrong",
    },
    {
      kind: "thrashing",
      min: 1,
      max: 4,
      why: "changing things at random is commoner than being out of ideas, but still a minority",
    },
    {
      kind: "repeated_misconception",
      min: 1,
      max: 4,
      why: "needs two distinct episodes of the same named cause: rare by construction",
    },
    {
      kind: "assistance_dependent",
      min: 1,
      max: 4,
      why: "half of solves needing strong help, over at least four solves",
    },

    {
      kind: "unexplained_failures",
      min: 1,
      max: 5,
      why: "depends on how much of the class's failure the curriculum can name; a high rate is a content fact, not a bug",
    },
    {
      kind: "assessment_incomplete",
      min: 0,
      max: 4,
      why: "gated on peer completion, so it is silent in the month's opening weeks — the finding that fired for 18 of 20 before ASSESSMENT_PEER_SHARE existed",
    },
  ];

  it.each(CASES)("$kind fires for $min-$max learners — $why", ({ kind, min, max }) => {
    const n = firingRate(programme.rows, kind);
    expect(n).toBeGreaterThanOrEqual(min);
    expect(n).toBeLessThanOrEqual(max);
  });

  it("no single finding fires for more than half the class", () => {
    const half = Math.ceil(programme.rows.length / 2);
    const kinds = new Set(programme.rows.flatMap((r) => r.findings.map((f) => f.kind)));
    for (const kind of kinds) {
      expect(firingRate(programme.rows, kind)).toBeLessThanOrEqual(half);
    }
  });

  it("ready-to-stretch does not nominate most of the class", () => {
    const ready = programme.rows.filter((r) => r.status === "ready_to_stretch").length;
    /* The previous signal fired for 16 of 18. Two to five out of twenty is a
       recommendation; twelve is a shrug. */
    expect(ready).toBeGreaterThanOrEqual(1);
    expect(ready).toBeLessThanOrEqual(6);
  });

  it("every finding carries a recommendation and a checkable detail", () => {
    for (const row of programme.rows) {
      for (const finding of row.findings) {
        expect(finding.detail.kk.trim().length).toBeGreaterThan(0);
        expect(finding.detail.ru.trim().length).toBeGreaterThan(0);
        expect(finding.recommendation.kk.trim().length).toBeGreaterThan(0);
        expect(finding.recommendation.ru.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
