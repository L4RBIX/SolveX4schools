import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isLearnerOutcome, LOCAL_LIMITS, type LocalRunResult } from "@schools/execution/trust";
import {
  capabilityFor,
  policyFor,
  surfaceForBlock,
  TRUST_POLICY,
  trustSatisfies,
  type ExecutionSurface,
} from "@schools/execution/trust-policy";
import { executionProviderProblems, trustedProviderConfigured } from "@schools/config";

/**
 * The trust boundary of hybrid execution.
 *
 * One sentence holds the whole subsystem up: **a result that ran in the
 * learner's browser may never become evidence about the learner.** Pyodide is
 * real Python and its output is genuinely useful, and it is also produced by
 * the party being measured, on a runtime they can edit in DevTools.
 *
 * Every test below is an attempt to break that sentence from a different angle.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const ALL_SURFACES = Object.keys(TRUST_POLICY) as ExecutionSurface[];

describe("the browser cannot declare itself trusted", () => {
  it("types a local result's trust as the literal, not the union", () => {
    /* `trust: ExecutionTrust` would compile for `server_verified` and the
       entire distinction would rest on nobody typing it. `trust: "client_local"`
       makes the wrong value a type error at every construction site — including
       ones written in a year by someone who has not read `trust.ts`.

       Asserted against the source because that is where the guarantee lives: a
       runtime check cannot observe a type that has already been erased. */
    const src = read("schools/execution/trust.ts");
    const iface = src.slice(
      src.indexOf("export interface LocalRunResult"),
      src.indexOf("export function isLearnerOutcome"),
    );
    expect(iface).toContain('trust: "client_local"');
    expect(iface, "the local result must not be able to spell the trusted value").not.toContain(
      "ExecutionTrust",
    );
  });

  it("gives a local result no field that could carry a verdict", () => {
    /* A `passed` boolean on `LocalRunResult` is the single change that would
       turn Pyodide into a fake judge. It cannot be computed honestly in the
       browser either — the browser has no expected output, and if it ever did,
       the answer key has already leaked. */
    const src = read("schools/execution/trust.ts");
    const iface = src.slice(
      src.indexOf("export interface LocalRunResult"),
      src.indexOf("export function isLearnerOutcome"),
    );
    for (const forbidden of ["passed", "correct", "verdict", "score", "accepted", "expected"]) {
      expect(iface, `a local run must not be able to report \`${forbidden}\``).not.toContain(
        forbidden,
      );
    }
  });

  it("compiles a well-formed local result and nothing more", () => {
    const ok: LocalRunResult = {
      trust: "client_local",
      status: "ok",
      stdout: "10\n",
      stderr: "",
      truncated: false,
      runtimeMs: 42,
    };
    expect(ok.trust).toBe("client_local");
    // @ts-expect-error — the browser may not claim server verification.
    const forged: LocalRunResult = { ...ok, trust: "server_verified" };
    /* Referenced so the assignment is not elided; the compile error above is
       the actual assertion and this only keeps the linter honest. */
    expect(forged.status).toBe("ok");
  });
});

describe("the policy table decides, and it decides consistently", () => {
  it("accepts a server result everywhere", () => {
    for (const s of ALL_SURFACES) {
      expect(trustSatisfies(s, "server_verified"), `${s} must accept a trusted result`).toBe(true);
    }
  });

  it("refuses a browser result on every surface that produces a claim", () => {
    for (const s of ["independent_evidence", "assessment", "contest", "final_tournament"] as const) {
      expect(trustSatisfies(s, "client_local"), `${s} must not settle on a browser result`).toBe(
        false,
      );
    }
  });

  it("accepts a browser result while the learner is only learning", () => {
    for (const s of ["lesson_guided", "lesson_practice"] as const) {
      expect(trustSatisfies(s, "client_local")).toBe(true);
    }
  });

  it("lets every surface run locally, because Run is not the thing being gated", () => {
    /* The distinction that keeps the cost model working. A learner iterating on
       a hard problem must not be pushed through the judge on every attempt —
       what is gated is the CHECK that produces evidence, never the Run. If this
       ever flips to false somewhere, the browser stopped being useful and every
       keystroke went back to costing a sandbox slot. */
    for (const s of ALL_SURFACES) {
      expect(policyFor(s).localRunAllowed, `${s} must still allow a local Run`).toBe(true);
    }
  });

  it("offers no way to say 'just use the browser then'", () => {
    /* `withoutTrustedProvider` is the degradation escape hatch, and the value
       it deliberately does not have is one that accepts a local result on a
       surface that requires a server. The type has three values; only surfaces
       that already accept local results may say `allow_local`. */
    for (const s of ALL_SURFACES) {
      const p = policyFor(s);
      if (p.requiredCheckTrust === "server_verified") {
        expect(p.withoutTrustedProvider, `${s} must not degrade to the browser`).not.toBe(
          "allow_local",
        );
      }
    }
  });

  it("is frozen, so nothing can widen it at runtime", () => {
    expect(Object.isFrozen(TRUST_POLICY)).toBe(true);
  });
});

describe("a block's surface is derived, never chosen by the component rendering it", () => {
  it("sends the monthly check to the assessment surface", () => {
    expect(surfaceForBlock({ blockType: "verify", blockId: "a1.b3", lessonId: "m1.a" })).toBe(
      "assessment",
    );
  });

  it("sends independent practice to the evidence surface", () => {
    /* `m1.pN` are the ids the approved programme counts toward its
       «~100 толық дербес шешім». They are the evidence, so they need the judge. */
    expect(surfaceForBlock({ blockType: "write_code", blockId: "m1.p3", lessonId: "m1.l9" })).toBe(
      "independent_evidence",
    );
    expect(
      trustSatisfies(
        surfaceForBlock({ blockType: "write_code", blockId: "m1.p3", lessonId: "m1.l9" }),
        "client_local",
      ),
      "a practice problem the programme counts must not settle in the browser",
    ).toBe(false);
  });

  it("leaves an ordinary worked step guided", () => {
    expect(surfaceForBlock({ blockType: "write_code", blockId: "m1.l3.b2", lessonId: "m1.l3" })).toBe(
      "lesson_guided",
    );
  });

  it("sends a contest problem to the contest surface", () => {
    expect(
      surfaceForBlock({ blockType: "arena_problem", blockId: "c1.p1", lessonId: "arena" }),
    ).toBe("contest");
  });
});

describe("with no trusted provider, a required check produces NO evidence", () => {
  it("says so rather than quietly weakening the claim", () => {
    const cap = capabilityFor("assessment", false);
    /* Not "weaker evidence", not "evidence with an asterisk". None. A monthly
       check run without a judge is a thing a teacher must mark, and the product
       has to hand it to them rather than absorb it. */
    expect(cap.checkProducesEvidence).toBe(false);
    expect(cap.degradedMode).toBe("teacher_review");
    expect(cap.canRunLocally, "the learner may still write and run code").toBe(true);
  });

  it("refuses a contest outright instead of ranking children on browser results", () => {
    const cap = capabilityFor("contest", false);
    expect(cap.checkProducesEvidence).toBe(false);
    expect(cap.degradedMode).toBe("unavailable");
  });

  it("leaves the lesson surfaces fully working", () => {
    /* The payoff for the whole hybrid design: a school with no judge at all
       still has a working course. Only the claims stop. */
    for (const s of ["lesson_guided", "lesson_practice"] as const) {
      const cap = capabilityFor(s, false);
      expect(cap.checkProducesEvidence).toBe(true);
      expect(cap.degradedMode).toBe("none");
      expect(cap.canRunLocally).toBe(true);
    }
  });

  it("restores evidence on every surface once a judge exists", () => {
    for (const s of ALL_SURFACES) {
      expect(capabilityFor(s, true).checkProducesEvidence, s).toBe(true);
      expect(capabilityFor(s, true).degradedMode, s).toBe("none");
    }
  });
});

describe("EXEC_PROVIDER=none is a supported deployment, not a misconfiguration", () => {
  it("does not fail production boot", () => {
    /* Making `none` a boot failure would push an operator to set
       `EXEC_PROVIDER=piston` with a dead URL just to start the app — turning an
       honest "no evidence" into a judge that appears configured and times out
       on every single submission. Strictly worse. */
    expect(executionProviderProblems("production", { provider: "none" })).toEqual([]);
  });

  it("still refuses a subprocess judge in production", () => {
    expect(executionProviderProblems("production", { provider: "local" }).length).toBeGreaterThan(0);
  });

  it("still refuses piston with no URL", () => {
    expect(executionProviderProblems("production", { provider: "piston" }).length).toBeGreaterThan(
      0,
    );
  });

  it("still refuses a value the build cannot honour", () => {
    expect(executionProviderProblems("production", { provider: "pyodide" }).length).toBeGreaterThan(
      0,
    );
  });

  it("reports no trusted provider for `none` and one for the others", () => {
    /* "Trusted" is about WHO ran it, not how well the sandbox isolates. A
       subprocess on our server is dangerous for hostile code — which is why it
       refuses to start in production — but a learner cannot forge its output,
       so it is trusted in the evidential sense. Conflating the two axes gives
       the wrong answer in both directions. */
    expect(trustedProviderConfigured("none")).toBe(false);
    expect(trustedProviderConfigured("piston")).toBe(true);
    expect(trustedProviderConfigured("local")).toBe(true);
  });
});

describe("runtime failure is not a learner outcome", () => {
  it("counts every real outcome and excludes the runtime failing to load", () => {
    for (const s of [
      "ok",
      "syntax_error",
      "runtime_error",
      "time_limit_exceeded",
      "output_limit_exceeded",
    ] as const) {
      expect(isLearnerOutcome(s), `${s} is something the learner's program did`).toBe(true);
    }
    /* Pyodide failing to download is our problem, exactly as a dead judge is.
       Recording it against a child is the local version of marking someone
       wrong for an outage, and the two systems use the same rule so neither can
       quietly become the exception. */
    expect(isLearnerOutcome("runtime_unavailable")).toBe(false);
  });
});

describe("the local budget agrees with the server where it must", () => {
  it("truncates output at exactly the server's cap", async () => {
    /* Imported lazily and read as a number: `@schools/exec` is `server-only`,
       and this file must not become a client-side import path for it. */
    const { EXECUTION_LIMITS } = await import("@schools/exec/provider");
    /* Not a coincidence to be tidied away. A program truncated locally must be
       truncated identically on submit, or the learner reads one output and is
       graded on another. */
    expect(LOCAL_LIMITS.maxOutputBytes).toBe(EXECUTION_LIMITS.maxOutputBytes);
    expect(LOCAL_LIMITS.maxSourceBytes).toBe(EXECUTION_LIMITS.maxSourceBytes);
    expect(LOCAL_LIMITS.maxStdinBytes).toBe(EXECUTION_LIMITS.maxStdinBytes);
  });

  it("cuts the local run off sooner than the server would", async () => {
    const { EXECUTION_LIMITS } = await import("@schools/exec/provider");
    /* Deliberately stricter. A browser tab is the learner's whole working
       surface; five seconds of a frozen-feeling Run is worse than being told
       quickly that the program did not finish, and a local run is not evidence,
       so cutting it early costs a retry and nothing else. */
    expect(LOCAL_LIMITS.timeLimitMs).toBeLessThan(EXECUTION_LIMITS.timeLimitMs);
  });
});

describe("the trust modules stay importable from a browser bundle", () => {
  it("carries no server-only import", () => {
    /* The inverse of the usual assertion, and just as load-bearing. The worker
       and the lesson player need these types; marking them `server-only` would
       force a duplicate client copy, and two copies of a trust model is how the
       two halves end up disagreeing about what `client_local` means. */
    for (const rel of ["schools/execution/trust.ts", "schools/execution/trust-policy.ts"]) {
      expect(read(rel)).not.toMatch(/^import "server-only";/m);
    }
  });

  it("pulls in nothing that could drag a secret along", () => {
    for (const rel of ["schools/execution/trust.ts", "schools/execution/trust-policy.ts"]) {
      const src = read(rel);
      const imports = [...src.matchAll(/^import .*?from "(.*?)";/gm)].map((m) => m[1]);
      for (const spec of imports) {
        expect(
          spec.startsWith("./") || spec.startsWith("@schools/execution/"),
          `${rel} must not import ${spec} — it is bundled into the client`,
        ).toBe(true);
      }
    }
  });
});
