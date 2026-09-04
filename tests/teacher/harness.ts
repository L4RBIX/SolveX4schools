import { MONTH_01_SEPTEMBER } from "../../schools/curriculum/months/month-01-september";
import type { ClassBundle } from "../../schools/teacher/context";
import type { PeriodDescriptor, RosterRow, TeacherPeriod } from "../../schools/teacher/contracts";
import { resolvePeriod } from "../../schools/teacher/period";
import { classRoster, subjectIdsOf } from "../../schools/teacher/queries";
import { assembleClass } from "../../schools/teacher/build-class";
import { buildAssessmentSummary } from "../../schools/teacher/build-assessment";
import { NOW, type ProfileKey, type SimulatedClass } from "./simulated-class";

/**
 * The analytics, run against the simulated class.
 *
 * ## Why the bundle is constructed rather than loaded
 *
 * `loadClassBundle` calls `currentMonth()`, which calls `gateFor()`, which
 * reaches for the STORE SINGLETON (`getStore()`) to read publication records.
 * In a test that singleton would open the real development PGlite directory —
 * which the dev server holds an exclusive lock on — rather than the in-memory
 * instance the fixture built. The gate catches the failure and returns `[]`, so
 * it would not crash; it would just be slow, occasionally flaky, and testing
 * something other than what it looks like it is testing.
 *
 * So the bundle is built here from the fixture's own store. `currentMonth`'s
 * own behaviour is covered separately, and everything downstream of the bundle
 * — which is all of the analytics — is exercised exactly as it ships.
 */
export async function bundleFor(
  sim: SimulatedClass,
  overrides: Partial<ClassBundle> = {},
): Promise<ClassBundle> {
  const members = await classRoster(sim.sql, sim.schoolId, sim.classId);
  return {
    members,
    subjectIds: subjectIdsOf(members),
    month: MONTH_01_SEPTEMBER,
    context: {
      schoolId: sim.schoolId,
      classId: sim.classId,
      className: "9А",
      enrolled: members.length,
      monthIndex: MONTH_01_SEPTEMBER.index,
      monthTitle: MONTH_01_SEPTEMBER.title,
      /* Derived vs chosen, and what the selector may offer. The harness
         describes a September class — the state the live defect made
         unreachable, because the product analysed it as May. */
      monthSelected: false,
      availableMonths: [{ index: MONTH_01_SEPTEMBER.index, title: MONTH_01_SEPTEMBER.title }],
      curriculum: {
        open: true,
        bypassedForDevelopment: false,
        approval: "approved",
        approvedBy: "Айгүл Серікқызы",
        approvedAt: new Date(NOW - 30 * 86_400_000).toISOString(),
      },
    },
    freshness: { lastSweepAt: new Date(NOW).toISOString(), pendingEvents: 0, behind: false },
    ...overrides,
  };
}

export function periodFor(period: TeacherPeriod = "week"): PeriodDescriptor {
  return resolvePeriod(period, new Date(NOW));
}

export interface AnalysedClass {
  bundle: ClassBundle;
  period: PeriodDescriptor;
  rows: RosterRow[];
  byProfile: Map<ProfileKey, RosterRow>;
}

/** Run the shipped projection over the fixture and index it by profile. */
export async function analyse(
  sim: SimulatedClass,
  period: TeacherPeriod = "week",
): Promise<AnalysedClass> {
  const bundle = await bundleFor(sim);
  const p = periodFor(period);
  const assessment = await buildAssessmentSummary(sim.sql, bundle, NOW);
  const assembled = await assembleClass(sim.sql, bundle, p, NOW, assessment);

  const bySubject = new Map(assembled.rows.map((r) => [r.subjectId, r] as const));
  const byProfile = new Map<ProfileKey, RosterRow>();
  for (const [key, subjectId] of sim.subjectByProfile) {
    const row = bySubject.get(subjectId);
    if (row) byProfile.set(key, row);
  }

  return { bundle, period: p, rows: assembled.rows, byProfile };
}

/** Does this learner carry a finding of this kind? */
export function has(row: RosterRow | undefined, kind: string): boolean {
  return (row?.findings ?? []).some((f) => f.kind === kind);
}

/** How many of the class carry a finding of this kind. The signal-rate check. */
export function firingRate(rows: readonly RosterRow[], kind: string): number {
  return rows.filter((r) => r.findings.some((f) => f.kind === kind)).length;
}
