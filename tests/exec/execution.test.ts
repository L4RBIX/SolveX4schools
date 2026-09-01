import { describe, it, expect } from "vitest";
import { LocalExecutionProvider } from "@schools/exec/providers/local";
import { runCases, EXECUTION_LIMITS } from "@schools/exec";
import { isInfrastructure } from "@schools/exec/provider";
import { sandboxVerdict, assertSandboxStatus } from "@schools/learning/verdict";
import { cppCompiler } from "../support/cpp-run";

/**
 * Execution, and the one distinction that must never collapse.
 *
 * The provider under test compiles and then runs, so every case here costs a
 * real `g++` invocation — which is why the timeouts are generous and why the
 * whole file skips, loudly, on a machine with no compiler. A skipped suite that
 * says why is honest; one that quietly passes because it ran nothing is the
 * failure mode `tests/school/content-execution.test.ts` was written against.
 */

const provider = new LocalExecutionProvider();
const HAS_COMPILER = cppCompiler() !== null;
const withCompiler = HAS_COMPILER ? describe : describe.skip;

if (!HAS_COMPILER) {
  console.warn(
    "tests/exec/execution.test.ts: no C++ compiler on PATH (tried EXEC_CPP_BIN, g++, " +
      "clang++, c++), so the local provider was not exercised.",
  );
}

const SQUARE = `#include <iostream>
int main() {
    int n;
    std::cin >> n;
    std::cout << n * n << std::endl;
}
`;

withCompiler("code execution", () => {
  it("runs a correct program", async () => {
    const r = await provider.run({
      language: "cpp17",
      sourceCode: SQUARE,
      stdin: "7\n",
      timeLimitMs: 5000,
      memoryLimitMb: 256,
    });
    expect(r.status).toBe("ok");
    expect(r.stdout.trim()).toBe("49");
    expect(r.infrastructureError).toBe(false);
  }, 30_000);

  it("distinguishes a program that never compiled from one that crashed", async () => {
    /* The distinction is now STRUCTURAL — the compiler exits non-zero and the
       run stage never happens — where the Python-era provider had to guess it
       from the words on stderr. Same two outcomes, one fewer thing to get
       wrong. */
    const broken = await provider.run({
      language: "cpp17",
      sourceCode: "#include <iostream>\nint main() { std::cout << }\n",
      stdin: "",
      timeLimitMs: 5000,
      memoryLimitMb: 256,
    });
    expect(broken.status).toBe("compile_error");
    /* A compile error is the LEARNER'S, so it must be recordable as evidence.
       Marking it infrastructure would throw away the most common outcome of a
       beginner's first hour. */
    expect(broken.infrastructureError).toBe(false);
    expect(broken.stderr.length).toBeGreaterThan(0);

    const crash = await provider.run({
      language: "cpp17",
      /* `vector::at` throws, and an uncaught exception aborts. A program that
         compiled and then died. */
      sourceCode:
        "#include <iostream>\n#include <vector>\nint main() { std::vector<int> v; std::cout << v.at(3); }\n",
      stdin: "",
      timeLimitMs: 5000,
      memoryLimitMb: 256,
    });
    expect(crash.status).toBe("runtime_error");
    expect(crash.infrastructureError).toBe(false);
  }, 40_000);

  it("records a slow program as LEARNER evidence, not infrastructure noise", async () => {
    const r = await provider.run({
      language: "cpp17",
      sourceCode: "int main() { while (true) {} }\n",
      stdin: "",
      timeLimitMs: 1200,
      memoryLimitMb: 256,
    });
    expect(r.status).toBe("time_limit_exceeded");
    /* THE assertion. If this ever flips, a learner's too-slow algorithm gets
       thrown away as judge flakiness and December's entire month — which is
       about making a program fast enough — becomes unmeasurable. */
    expect(r.infrastructureError).toBe(false);
    expect(isInfrastructure(r.status)).toBe(false);
  }, 30_000);

  it("does not spend the learner's time budget on our compile", async () => {
    /* The budget is for the PROGRAM. A compile is roughly a second on a warm
       machine, so a 1 200 ms limit would classify every correct program as too
       slow if the two stages shared a clock — recording a child as having
       written a slow algorithm because our toolchain is not instant. */
    const r = await provider.run({
      language: "cpp17",
      sourceCode: SQUARE,
      stdin: "6\n",
      timeLimitMs: 1200,
      memoryLimitMb: 256,
    });
    expect(r.status).toBe("ok");
    expect(r.stdout.trim()).toBe("36");
  }, 30_000);

  it("keeps the app's secrets out of the learner's process", async () => {
    const r = await provider.run({
      language: "cpp17",
      sourceCode: `#include <iostream>
#include <cstdlib>
int main() {
    const char* a = std::getenv("DEEPSEEK_API_KEY");
    const char* b = std::getenv("LEARNING_ATTESTATION_SECRET");
    std::cout << (a ? a : "unset") << "\\n" << (b ? b : "unset") << std::endl;
}
`,
      stdin: "",
      timeLimitMs: 5000,
      memoryLimitMb: 256,
    });
    expect(r.stdout.trim().split("\n")).toEqual(["unset", "unset"]);
  }, 30_000);

  it("caps runaway output instead of dying", async () => {
    const r = await provider.run({
      language: "cpp17",
      sourceCode:
        "#include <iostream>\nint main() { for (int i = 0; i < 300000; i++) std::cout << i << \"\\n\"; }\n",
      stdin: "",
      timeLimitMs: 8000,
      memoryLimitMb: 256,
    });
    expect(r.stdout.length).toBeLessThanOrEqual(EXECUTION_LIMITS.maxOutputBytes);
  }, 35_000);

  it("grades against hidden cases, so echoing the sample is not enough", async () => {
    const cases = [
      { input: "5", expectedOutput: "25" },
      { input: "-3", expectedOutput: "9", hidden: true },
    ];
    const cheat = await runCases(
      provider,
      '#include <iostream>\nint main() { std::cout << 25 << std::endl; }\n',
      cases,
    );
    expect(cheat.results.filter((r) => r.passed).length).toBe(1);

    const real = await runCases(provider, SQUARE, cases);
    expect(real.results.every((r) => r.passed)).toBe(true);
  }, 60_000);
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
