import { afterEach, describe, expect, it, vi } from "vitest";
import { executionProviderProblems } from "../../schools/config";

/**
 * Production configuration — the judge.
 *
 * ## Why this file exists
 *
 * A school deployment used to boot perfectly clean with no judge at all.
 * `EXEC_PROVIDER` defaulted to `local`, `LocalExecutionProvider.run` threw in
 * production exactly as designed, the submit route caught that throw and left
 * the verdict `unknown`, and `assertProductionConfig` — which already checked
 * the attestation secret, the database and the Nova key — never looked at the
 * judge. Net effect: nineteen September code tasks silently stopped being
 * graded, and every learner was told the sandbox was not connected. Nothing
 * anywhere said the deployment was wrong.
 *
 * These tests are the thing that keeps that a boot failure. They assert the
 * matrix on the pure helper, then assert once — through a genuine module
 * reload — that the helper is actually wired into the boot assertion, because
 * a correct check nobody calls is the same bug in a different file.
 */

describe("executionProviderProblems — production", () => {
  const PROD = "production";

  it("refuses `local`, which cannot run there at all", () => {
    const problems = executionProviderProblems(PROD, { provider: "local" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("EXEC_PROVIDER=local");
    // The message has to carry the consequence, not just the fact. An operator
    // reading a boot log needs to know this means ungraded work, not a warning.
    expect(problems[0]).toMatch(/ungraded/);
  });

  it("refuses `piston` with no PISTON_URL — a judge with no address is no judge", () => {
    const problems = executionProviderProblems(PROD, { provider: "piston" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("PISTON_URL");
  });

  it("accepts `piston` with a URL — the one configuration the decision doc names", () => {
    expect(
      executionProviderProblems(PROD, {
        provider: "piston",
        pistonUrl: "http://127.0.0.1:2000",
      }),
    ).toEqual([]);
  });

  it("refuses an unrecognised value, because a typo fails exactly like `local`", () => {
    /* `getExecutionProvider` returns the local subprocess for everything that
       is not literally "piston", so `pistion` is not an unknown provider at
       runtime — it is `local` wearing a different name, with the same silence. */
    const problems = executionProviderProblems(PROD, { provider: "pistion" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("pistion");
    expect(problems[0]).toMatch(/ungraded/);
  });

  it("refuses an empty provider the same way", () => {
    expect(executionProviderProblems(PROD, { provider: "" })).toHaveLength(1);
  });
});

describe("executionProviderProblems — everywhere else", () => {
  /* Development and preview run `local` on purpose: it is how the grading
     pipeline is built and tested without provisioning a judge first. Flagging
     it outside production would make the check noise, and a noisy check is one
     everybody learns to ignore. */
  for (const environment of ["development", "preview"]) {
    it(`says nothing in ${environment}, whatever the provider`, () => {
      expect(executionProviderProblems(environment, { provider: "local" })).toEqual([]);
      expect(executionProviderProblems(environment, { provider: "piston" })).toEqual([]);
      expect(executionProviderProblems(environment, { provider: "nonsense" })).toEqual([]);
    });
  }
});

describe("assertProductionConfig calls it", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  /**
   * `config` resolves `process.env` once, at import. Reaching the production
   * branch therefore means reloading the module, not mutating an object — so
   * this test costs a module reload, which is why the matrix above does not.
   *
   * The other three checks are satisfied with obvious fakes so that whatever
   * comes back is attributable to the judge and nothing else.
   */
  async function problemsWith(vars: Record<string, string>): Promise<string[]> {
    vi.resetModules();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("LEARNING_ATTESTATION_SECRET", "x".repeat(64));
    vi.stubEnv("DATABASE_URL", "postgres://example.invalid/not-a-real-database");
    vi.stubEnv("NOVA_PROVIDER", "echo");
    for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
    const { assertProductionConfig } = await import("../../schools/config");
    return assertProductionConfig();
  }

  it("fails a production boot whose only fault is the judge", async () => {
    const problems = await problemsWith({ EXEC_PROVIDER: "local", PISTON_URL: "" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("EXEC_PROVIDER=local");
  });

  it("passes a production boot with a reachable judge configured", async () => {
    const problems = await problemsWith({
      EXEC_PROVIDER: "piston",
      PISTON_URL: "http://127.0.0.1:2000",
    });
    expect(problems).toEqual([]);
  });
});
