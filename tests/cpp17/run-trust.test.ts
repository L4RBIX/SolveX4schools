import { describe, expect, it } from "vitest";
import { Cpp17Runner, type RunnerWorker } from "../../src/lib/cpp17/runner";
import { isLearnerOutcome, type LocalRunResult } from "@schools/execution/trust";
import { CLIENT_REPORTABLE_EVENTS, EVENT_TRUST } from "@solvex/learning-contracts";

/**
 * A browser compile is not evidence.
 *
 * The learner owns the machine that ran it. They can edit the source between
 * compiling and reporting, patch the worker, or post a result for a program
 * that never existed. Everything downstream of Run therefore has to be built on
 * the assumption that its output is a claim, not a measurement — and the place
 * that assumption is enforced must not be the runtime, because the runtime is
 * the part under the learner's control.
 *
 * These tests pin that the switch from Python to C++ did not move the boundary.
 * It could not, because the boundary was never in the runtime: it is in the
 * event taxonomy and the attestation, both of which are language-blind. That is
 * worth an assertion rather than an assumption, since "we changed the execution
 * engine" is exactly the kind of change under which a trust rule quietly stops
 * applying.
 */

class SilentWorker implements RunnerWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  private ids: number[] = [];
  postMessage(m: unknown): void {
    const msg = m as { kind: string; id?: number };
    if (msg.kind === "init") queueMicrotask(() => this.onmessage?.({ data: { kind: "ready", initMs: 1 } } as MessageEvent));
    if (msg.kind === "run" && typeof msg.id === "number") this.ids.push(msg.id);
  }
  terminate(): void {}
  answer(status: string, stdout = ""): void {
    this.onmessage?.({
      data: { kind: "result", id: this.ids.at(-1), status, stdout, stderr: "", truncated: false, runtimeMs: 1 },
    } as MessageEvent);
  }
}

const flush = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

describe("a C++ Run result is self-describing as untrusted", () => {
  it("always carries trust: client_local, whatever the program did", async () => {
    for (const status of ["ok", "syntax_error", "runtime_error", "time_limit_exceeded", "output_limit_exceeded"]) {
      const worker = new SilentWorker();
      const runner = new Cpp17Runner({ createWorker: () => worker });
      const p = runner.run({ source: "int main(){}", stdin: "" });
      await flush();
      worker.answer(status, "whatever the learner wants");
      const result: LocalRunResult = await p;
      expect(result.trust, `a ${status} result claimed something other than client_local`).toBe("client_local");
    }
  });

  it("has no field a verdict could be read out of", async () => {
    /* `LocalRunResult` deliberately has no `verdict`, no `passed`, no `cases`.
       There is nothing here for a caller to mistake for a grade, which is the
       cheapest possible way to make the mistake impossible. */
    const worker = new SilentWorker();
    const runner = new Cpp17Runner({ createWorker: () => worker });
    const p = runner.run({ source: "int main(){}", stdin: "" });
    await flush();
    worker.answer("ok", "42");
    const result = await p;

    for (const forbidden of ["verdict", "passed", "cases", "correct", "solved", "xp", "score"]) {
      expect(result, `a local run result exposed "${forbidden}"`).not.toHaveProperty(forbidden);
    }
    expect(new Set(Object.keys(result))).toEqual(
      new Set(["trust", "status", "stdout", "stderr", "truncated", "runtimeMs"]),
    );
  });
});

describe("the event taxonomy, which is where the boundary actually lives", () => {
  it("a browser may report that it ran something, and may not report an outcome", () => {
    /* `run_executed` is the ONLY execution event a browser authors. The verdict
       is the server's, written by the submit route after Judge0 answered. */
    expect(EVENT_TRUST.run_executed).toBe("browser");
    expect(CLIENT_REPORTABLE_EVENTS.has("run_executed")).toBe(true);
  });

  it("failure attribution can never come from a browser", () => {
    expect(EVENT_TRUST.failure_attributed).not.toBe("browser");
    expect(CLIENT_REPORTABLE_EVENTS.has("failure_attributed")).toBe(false);
  });

  it("nothing that decides progress is client-reportable", () => {
    /* If any of these were, a learner could grant themselves a month. */
    for (const name of ["lesson_completed", "contest_started", "solution_revealed_by_server"] as const) {
      if (name in EVENT_TRUST) {
        expect(
          CLIENT_REPORTABLE_EVENTS.has(name as never),
          `${name} became client-reportable`,
        ).toBe(false);
      }
    }
  });
});

describe("a runtime failure is never the learner's failure", () => {
  it("runtime_unavailable is excluded from being recorded as something they did", async () => {
    /* The C++ toolchain failing to download is our outage. Recording it against
       a child would put "did not finish" in their record for a network they do
       not control — the same rule the server applies to a dead judge. */
    expect(isLearnerOutcome("runtime_unavailable")).toBe(false);
    expect(isLearnerOutcome("syntax_error")).toBe(true);
    expect(isLearnerOutcome("runtime_error")).toBe(true);
    expect(isLearnerOutcome("time_limit_exceeded")).toBe(true);
  });

  it("a superseded run reports as unavailable, not as a failed attempt", async () => {
    const runner = new Cpp17Runner({ createWorker: () => new SilentWorker() });
    const abandoned = runner.run({ source: "A", stdin: "" });
    await flush();
    void runner.run({ source: "B", stdin: "" });
    await flush();
    const result = await abandoned;
    expect(result.status).toBe("runtime_unavailable");
    expect(
      isLearnerOutcome(result.status),
      "pressing Run twice recorded an attempt the learner never made",
    ).toBe(false);
  });
});
