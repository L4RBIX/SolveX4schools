import { describe, expect, it } from "vitest";

import { runReplayReport } from "../golden-fixtures/replayHarness";
import { REPLAY_TRACES } from "../golden-fixtures/replayTraces";

/**
 * The twenty internal replays, run through the real pipeline as a regression.
 *
 * They are not data and no rate computed over them means anything. What they
 * are is twenty situations a human has already read and labelled, so a change
 * that starts reading one of them differently shows up here instead of in
 * production six weeks later.
 *
 * See docs/LEARNING_REPLAY_FINDINGS.md for what the first run of this found.
 */

describe("internal replay sessions", () => {
  const report = runReplayReport(REPLAY_TRACES);

  it("covers twenty distinct sessions", () => {
    expect(REPLAY_TRACES).toHaveLength(20);
    expect(new Set(REPLAY_TRACES.map((t) => t.id)).size).toBe(20);
  });

  it("reads every trace the way a human reading the replay does", () => {
    expect(report.findings).toEqual([]);
  });

  it("distinguishes first authorship from abandoning an approach", () => {
    // The finding that forced a schema change: before `authored` existed, 18 of
    // 20 episodes reported `structural` as their second edit, purely because
    // writing your first solution replaces the template's control flow.
    expect(report.diffClassCounts.authored).toBeGreaterThan(10);
    expect(report.diffClassCounts.structural ?? 0).toBeLessThan(10);
  });

  it("produces every struggle class across the set", () => {
    for (const cls of ["flow", "productive_struggle", "thrash", "stuck", "disengaged"]) {
      expect(report.struggleCounts[cls] ?? 0).toBeGreaterThan(0);
    }
  });

  it("produces every hint outcome the ledger can express except progressed", () => {
    // `progressed` needs a hint followed by partial improvement without an
    // accept, which none of the twenty happen to contain.
    for (const outcome of [
      "resolved_independently",
      "resolved_by_transfer",
      "regressed",
      "escalated",
      "stalled",
    ]) {
      expect(report.hintOutcomeCounts[outcome] ?? 0).toBeGreaterThan(0);
    }
  });

  it("carries failure attribution where the verification engine could give one", () => {
    expect(report.failureClassCounts.complexity_asymptotic ?? 0).toBeGreaterThan(0);
    expect(report.failureClassCounts.edge_case_handling ?? 0).toBeGreaterThan(0);
    expect(report.failureClassCounts.compile_error ?? 0).toBeGreaterThan(0);
  });

  it("records refusing to attribute as a real answer, not a gap", () => {
    // The common case today, and the one that must stay visible: the engine
    // looked and nothing it holds could say why.
    expect(report.failureClassCounts.unattributed_failure ?? 0).toBeGreaterThan(0);
  });

  it("computes progression only between attempts that reported counts", () => {
    const deltas = report.built
      .flatMap((built) => built.episode?.verdict_sequence ?? [])
      .map((entry) => entry.progression_delta);
    // The first attempt of every episode has nothing to compare against.
    expect(deltas.some((delta) => delta === null)).toBe(true);
    expect(deltas.some((delta) => typeof delta === "number")).toBe(true);
  });

  it("counts attributed failures separately from unattributed ones", () => {
    const attributed = report.built.filter(
      (built) => (built.episode?.attributed_failures ?? 0) > 0
    );
    expect(attributed.length).toBeGreaterThan(0);

    // r02 is attributed-attempted but unattributable, so it has attribution
    // events and a zero count. That distinction is the point.
    const r02 = report.built.find((built) => built.trace.id === "r02-productive-struggle");
    expect(r02?.episode?.attributions.length).toBe(1);
    expect(r02?.episode?.attributed_failures).toBe(0);
  });

  it("never leaves an episode unreduced", () => {
    for (const built of report.built) {
      expect(built.episode).not.toBeNull();
    }
  });
});
