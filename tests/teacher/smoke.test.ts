import { afterAll, describe, expect, it } from "vitest";
import { buildSimulatedClass, NOW, PROFILES, type SimulatedClass } from "./simulated-class";
import { classRoster, subjectIdsOf, windowedLearnerStats } from "../../schools/teacher/queries";

/**
 * Does the harness actually produce a class?
 *
 * A smoke test, kept separate from the benchmark so that "the fixture is
 * broken" and "the analytics are wrong" are distinguishable failures.
 */
let sim: SimulatedClass;

describe("the simulated class", () => {
  it("provisions eighteen learners and reduces their histories", async () => {
    sim = await buildSimulatedClass();
    const roster = await classRoster(sim.sql, sim.schoolId, sim.classId);
    expect(roster).toHaveLength(PROFILES.length);
    expect(subjectIdsOf(roster)).toHaveLength(PROFILES.length);

    const episodes = await sim.sql.query<{ n: number }>(
      "select count(*)::int as n from attempt_episodes",
    );
    expect(Number(episodes.rows[0].n)).toBeGreaterThan(50);

    const states = await sim.sql.query<{ n: number }>(
      "select count(*)::int as n from learner_state",
    );
    expect(Number(states.rows[0].n)).toBeGreaterThan(10);
  }, 180_000);

  it("produces a windowed aggregate that distinguishes the profiles", async () => {
    const roster = await classRoster(sim.sql, sim.schoolId, sim.classId);
    const stats = await windowedLearnerStats(
      sim.sql,
      subjectIdsOf(roster),
      new Date(NOW - 7 * 86_400_000).toISOString(),
      new Date(NOW + 86_400_000).toISOString(),
    );

    const strong = stats.get(sim.subjectByProfile.get("strong_independent")!);
    const dependent = stats.get(sim.subjectByProfile.get("assistance_dependent")!);
    const inactive = stats.get(sim.subjectByProfile.get("inactive")!);

    expect(strong?.solvedIndependent ?? 0).toBeGreaterThan(0);
    expect(dependent?.solvedIndependent ?? 0).toBeLessThan(strong?.solvedIndependent ?? 0);
    // The inactive learner last worked three weeks ago: nothing in a 7-day window.
    expect(inactive).toBeUndefined();
  }, 60_000);
});

afterAll(async () => {
  await sim?.sql.close();
});
