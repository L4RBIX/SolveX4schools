import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PROGRAM } from "@schools/curriculum/program";

/**
 * Run must never spend the money Submit depends on.
 *
 * ## The arithmetic this test exists to defend
 *
 * The cost model of the whole hybrid design is: a learner iterates twenty times
 * for free in their own browser, and pays for exactly one trusted verification.
 * Judge0 CE on RapidAPI is the first provider where "pays" is literal, and two
 * numbers decide whether the design survives contact with it.
 *
 * **Demand per Check.** Measured from the authored curriculum below, not
 * guessed: September's coding blocks declare a median of 5 test cases. One
 * press of Check is therefore ~5 Judge0 submissions, and eighteen learners
 * pressing Check once is ~87 — each of which is a POST plus several polling
 * GETs.
 *
 * **Demand from Run.** `/api/exec/run` is the fallback for a browser that
 * cannot load Pyodide, and it is rate limited at 20 per minute per learner. On
 * a metered provider that is up to **360 RapidAPI requests a minute of
 * untrusted, ungraded traffic** before anyone presses Check.
 *
 * The second number would consume the first's budget. And the failure is
 * ordered exactly wrong: the thing that breaks is SUBMIT — the trusted, graded
 * path a school's evidence depends on — because somebody was typing.
 *
 * So the Run fallback refuses a metered provider. A learner without WebAssembly
 * loses a convenience; the class keeps its course.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

describe("the cost model, measured from the curriculum", () => {
  it("one press of Check is several judge submissions, not one", () => {
    const CODE = new Set(["write_code", "modify_code", "challenge", "verify"]);
    const perBlock: number[] = [];
    for (const month of PROGRAM.months) {
      const all = [
        ...month.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
        ...(month.assessment?.blocks ?? []),
      ];
      for (const b of all) {
        if (!CODE.has(b.type)) continue;
        const cases = ("cases" in b && Array.isArray(b.cases) ? b.cases : []) as unknown[];
        if (cases.length > 0) perBlock.push(cases.length);
      }
    }
    perBlock.sort((a, b) => a - b);

    /* The multiplier is the point. If a Check were one submission, a free tier
       might carry a class; at five it cannot, and the setup doc's capacity
       section is written against this number rather than against a guess. */
    expect(perBlock.length, "September must have graded coding blocks").toBeGreaterThan(20);
    const median = perBlock[Math.floor(perBlock.length / 2)];
    expect(median, "a Check costs several submissions").toBeGreaterThan(1);
    expect(median * 18, "one classroom press is dozens of submissions").toBeGreaterThan(50);
  });
});

describe("the Run fallback refuses to spend graded-path quota", () => {
  it("the route checks `metered` before it runs anything", () => {
    const src = read("src/app/api/exec/run/route.ts");
    const guardAt = src.indexOf("if (provider.metered)");
    const runAt = src.indexOf("await provider.run(");
    expect(guardAt, "the Run route must consult the cost flag").toBeGreaterThan(-1);
    /* Position, not presence: a check placed AFTER the call would have spent
       the request it exists to save. */
    expect(runAt, "and must do it before spending a request").toBeGreaterThan(guardAt);
  });

  it("answers 503 without implying the learner's program failed", () => {
    const src = read("src/app/api/exec/run/route.ts");
    const guard = src.slice(src.indexOf("if (provider.metered)"), src.indexOf("await provider.run("));
    expect(guard).toContain("infrastructureError: true");
    expect(guard).toContain("503");
  });

  it("leaves SUBMIT free to spend, because that is what the money is for", () => {
    /* The complement, and the reason this is a flag rather than a ban. Submit
       is the trusted path; paying for it is the entire point of having a
       metered judge at all. */
    const submit = read("src/app/api/learning/submit/route.ts");
    expect(submit).toContain("getExecutionProvider");
    expect(submit, "Submit must not refuse a metered provider").not.toContain("provider.metered");
  });
});

describe("every provider declares its own cost", () => {
  it("marks the RapidAPI judge as metered and the self-hosted ones as free", () => {
    /* Read from source rather than by constructing providers: `judge0FromConfig`
       throws without a key, and `LocalExecutionProvider` refuses to exist in
       production. The declaration is what matters and it is one line each. */
    expect(read("schools/exec/providers/judge0.ts")).toMatch(/readonly metered = true/);
    expect(read("schools/exec/providers/piston.ts")).toMatch(/readonly metered = false/);
    expect(read("schools/exec/providers/local.ts")).toMatch(/readonly metered = false/);
  });

  it("forwards it through both decorators", () => {
    /* `sizeGuarded(counted(provider))` wraps every provider before any caller
       sees it. A decorator that dropped `metered` would make a metered judge
       look free to the Run route — which is the exact bug, arriving through the
       plumbing instead of the provider. */
    for (const rel of ["schools/exec/index.ts", "schools/exec/limits.ts"]) {
      expect(read(rel), `${rel} must forward metered`).toMatch(/metered: provider\.metered/);
    }
  });
});
