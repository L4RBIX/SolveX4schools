import { describe, it, expect } from "vitest";
import { LocalExecutionProvider } from "@schools/exec/providers/local";
import { runCases, EXECUTION_LIMITS } from "@schools/exec";
import { isInfrastructure } from "@schools/exec/provider";
import { sandboxVerdict, assertSandboxStatus } from "@schools/learning/verdict";

/**
 * Execution, and the one distinction that must never collapse.
 */

const provider = new LocalExecutionProvider();

describe("code execution", () => {
  it("runs a correct program", async () => {
    const r = await provider.run({
      language: "python3",
      sourceCode: "n = int(input())\nprint(n * n)",
      stdin: "7\n",
      timeLimitMs: 5000,
      memoryLimitMb: 256,
    });
    expect(r.status).toBe("ok");
    expect(r.stdout.trim()).toBe("49");
    expect(r.infrastructureError).toBe(false);
  }, 20_000);

  it("distinguishes a syntax error from a crash", async () => {
    const syntax = await provider.run({
      language: "python3", sourceCode: "print(", stdin: "",
      timeLimitMs: 5000, memoryLimitMb: 256,
    });
    expect(syntax.status).toBe("compile_error");

    const crash = await provider.run({
      language: "python3", sourceCode: "print(1/0)", stdin: "",
      timeLimitMs: 5000, memoryLimitMb: 256,
    });
    expect(crash.status).toBe("runtime_error");
  }, 20_000);

  it("records a slow program as LEARNER evidence, not infrastructure noise", async () => {
    const r = await provider.run({
      language: "python3", sourceCode: "while True: pass", stdin: "",
      timeLimitMs: 1200, memoryLimitMb: 256,
    });
    expect(r.status).toBe("time_limit_exceeded");
    /* THE assertion. If this ever flips, a learner's too-slow algorithm gets
       thrown away as judge flakiness and December's entire month — which is
       about making a program fast enough — becomes unmeasurable. */
    expect(r.infrastructureError).toBe(false);
    expect(isInfrastructure(r.status)).toBe(false);
  }, 20_000);

  it("keeps the app's secrets out of the learner's process", async () => {
    const r = await provider.run({
      language: "python3",
      sourceCode: "import os\nprint(os.environ.get('DEEPSEEK_API_KEY'))\nprint(os.environ.get('LEARNING_ATTESTATION_SECRET'))",
      stdin: "", timeLimitMs: 5000, memoryLimitMb: 256,
    });
    expect(r.stdout.trim().split("\n")).toEqual(["None", "None"]);
  }, 20_000);

  it("caps runaway output instead of dying", async () => {
    const r = await provider.run({
      language: "python3", sourceCode: "for i in range(300000): print(i)", stdin: "",
      timeLimitMs: 8000, memoryLimitMb: 256,
    });
    expect(r.stdout.length).toBeLessThanOrEqual(EXECUTION_LIMITS.maxOutputBytes);
  }, 25_000);

  it("grades against hidden cases, so echoing the sample is not enough", async () => {
    const cases = [
      { input: "5", expectedOutput: "25" },
      { input: "-3", expectedOutput: "9", hidden: true },
    ];
    const cheat = await runCases(provider, "print(25)", cases);
    expect(cheat.results.filter((r) => r.passed).length).toBe(1);

    const real = await runCases(provider, "n = int(input())\nprint(n*n)", cases);
    expect(real.results.every((r) => r.passed)).toBe(true);
  }, 30_000);
});

describe("verdict vocabulary", () => {
  it("refuses the bare word `timeout`", () => {
    // It is ambiguous between "the learner was slow" and "the judge died",
    // and the contract maps it to null — silently discarding the evidence.
    expect(() => assertSandboxStatus("timeout")).toThrow(/time_limit_exceeded/);
  });

  it("keeps a slow program and a broken judge apart", () => {
    expect(sandboxVerdict("time_limit_exceeded")).toBe("time_limit_exceeded");
    expect(sandboxVerdict("sandbox_unavailable")).toBeNull();
  });
});
