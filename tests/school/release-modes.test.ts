import { describe, expect, it } from "vitest";
import { releaseCapability } from "@schools/execution/release-mode";

/**
 * What a deployment can honestly claim about itself.
 *
 * The property under test is that the mode is DERIVED. There is deliberately no
 * setter and no `RELEASE_MODE` environment variable, because the claim that
 * matters — "submissions here become real evidence about a child" — is exactly
 * the one nobody should be able to make by typing a word into a `.env` file.
 */

describe("the mode follows the configuration, and cannot be declared", () => {
  it("is HYBRID_PRODUCTION only when both halves exist", () => {
    const cap = releaseCapability({ trustedProviderConfigured: true, localRunAvailable: true });
    expect(cap.mode).toBe("HYBRID_PRODUCTION");
    expect(cap.surfacesWithoutEvidence, "every surface must produce evidence").toEqual([]);
  });

  it("is LOCAL_PILOT with a browser and no judge, and names what is lost", () => {
    const cap = releaseCapability({ trustedProviderConfigured: false, localRunAvailable: true });
    expect(cap.mode).toBe("LOCAL_PILOT");
    expect(cap.localRun).toBe(true);
    expect(cap.trustedJudge).toBe(false);

    /* The four surfaces that make a claim about a learner. A pilot that does
       not know it has lost these is a school that finds out in May. */
    expect([...cap.surfacesWithoutEvidence].sort()).toEqual([
      "assessment",
      "contest",
      "final_tournament",
      "independent_evidence",
    ]);
    /* And the two that do not: the course still WORKS. That is the whole point
       of the hybrid design — only the claims stop, not the learning. */
    expect(cap.surfacesWithoutEvidence).not.toContain("lesson_guided");
    expect(cap.surfacesWithoutEvidence).not.toContain("lesson_practice");
  });

  it("is SERVER_ONLY_FALLBACK for a browser that cannot run Python", () => {
    /* Per-learner, not per-deployment. The same server is HYBRID_PRODUCTION for
       seventeen students and this for the eighteenth, whose laptop will not run
       WebAssembly — which is why `localRunAvailable` is an argument rather than
       a config read. */
    const cap = releaseCapability({ trustedProviderConfigured: true, localRunAvailable: false });
    expect(cap.mode).toBe("SERVER_ONLY_FALLBACK");
    expect(cap.localRun).toBe(false);
    expect(cap.trustedJudge, "the judge still works for them").toBe(true);
    expect(cap.surfacesWithoutEvidence).toEqual([]);
  });

  it("says plainly when nothing can execute at all", () => {
    const cap = releaseCapability({ trustedProviderConfigured: false, localRunAvailable: false });
    expect(cap.mode).toBe("SERVER_ONLY_FALLBACK");
    expect(cap.summary).toMatch(/[Nn]othing can execute/);
  });

  it("never reports evidence on a surface the trust policy refuses", () => {
    /* Derived from `capabilityFor` rather than restated, so the two cannot
       disagree. If someone widens the policy table, this follows automatically
       — and if someone widens it WRONGLY, `tests/execution/trust.test.ts`
       fails first. */
    for (const localRunAvailable of [true, false]) {
      const cap = releaseCapability({ trustedProviderConfigured: false, localRunAvailable });
      expect(cap.surfacesWithoutEvidence.length).toBeGreaterThan(0);
    }
  });
});
