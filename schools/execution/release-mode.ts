import type { ExecutionSurface } from "./trust-policy";
import { capabilityFor } from "./trust-policy";

/**
 * What this deployment can actually do — derived, never declared.
 *
 * ## Why a function and not an environment variable
 *
 * The obvious shape is `RELEASE_MODE=hybrid_production`, and it is the wrong
 * one. A mode set by hand is a claim an operator makes about their deployment,
 * and the claim that matters here — "submissions on this server become real
 * evidence about a child" — is exactly the one nobody should be able to make by
 * typing it. A school that sets `hybrid_production` with no judge behind it has
 * not configured a judge; it has written a word.
 *
 * So the mode is computed from what is actually configured, and there is no
 * setter. A deployment cannot lie about its own capability without changing the
 * capability.
 *
 * ## The three modes, and why exactly three
 *
 * They are the three combinations that can occur, given that browser execution
 * either works for a learner or does not, and a trusted judge is either
 * configured or is not. The fourth combination — no browser and no judge — is
 * not a mode, it is a deployment where nothing runs, and `capabilityFor`
 * already says so surface by surface.
 */
export type ReleaseMode =
  /**
   * Pyodide in the browser for Run, a trusted judge for Submit.
   *
   * The design this whole subsystem was built for. Iteration is free and
   * private, and the claims a school makes about a child come from our server.
   */
  | "HYBRID_PRODUCTION"
  /**
   * Pyodide for Run, and no trusted judge at all (`EXEC_PROVIDER=none`).
   *
   * A real, supported way to run the programme, and the honest name for what a
   * school has when nobody has stood up a sandbox yet. Learners write code, run
   * it, and see genuine Python output; every check that would produce evidence
   * becomes a teacher's job instead. Nothing is scored on a browser result.
   */
  | "LOCAL_PILOT"
  /**
   * No browser execution — the trusted judge does both Run and Submit.
   *
   * Not a configuration anyone chooses globally; it is what an individual
   * learner falls back to when Pyodide will not load in their browser. Named
   * here because the product must behave correctly in it: `/api/exec/run`
   * still exists for exactly this reason and must not be deleted.
   */
  | "SERVER_ONLY_FALLBACK";

export interface ReleaseCapability {
  mode: ReleaseMode;
  /** Can a learner run their own code without a server round trip? */
  localRun: boolean;
  /** Is there a judge whose verdict may become evidence? */
  trustedJudge: boolean;
  /**
   * The surfaces that CANNOT produce evidence right now.
   *
   * Empty in `HYBRID_PRODUCTION`. In `LOCAL_PILOT` it is every surface that
   * requires the server — which is most of what the programme measures, and is
   * the single most important thing for a school to be told before a pilot
   * rather than after one.
   */
  surfacesWithoutEvidence: readonly ExecutionSurface[];
  /** One sentence an operator can act on. */
  summary: string;
}

const EVERY_SURFACE: readonly ExecutionSurface[] = [
  "lesson_guided",
  "lesson_practice",
  "independent_evidence",
  "assessment",
  "contest",
  "final_tournament",
];

/**
 * Which mode a deployment is in, for a given learner.
 *
 * `localRunAvailable` is per-BROWSER, not per-deployment, which is why it is an
 * argument rather than a config read: the same server is `HYBRID_PRODUCTION`
 * for seventeen students and `SERVER_ONLY_FALLBACK` for the eighteenth whose
 * laptop will not run WebAssembly. A mode computed once at boot would describe
 * none of them accurately.
 */
export function releaseCapability(input: {
  trustedProviderConfigured: boolean;
  localRunAvailable: boolean;
}): ReleaseCapability {
  const { trustedProviderConfigured, localRunAvailable } = input;

  const surfacesWithoutEvidence = EVERY_SURFACE.filter(
    (surface) => !capabilityFor(surface, trustedProviderConfigured).checkProducesEvidence,
  );

  if (localRunAvailable && trustedProviderConfigured) {
    return {
      mode: "HYBRID_PRODUCTION",
      localRun: true,
      trustedJudge: true,
      surfacesWithoutEvidence,
      summary:
        "Run executes in the browser; Submit is judged on the server. Every surface " +
        "produces evidence.",
    };
  }

  if (localRunAvailable) {
    return {
      mode: "LOCAL_PILOT",
      localRun: true,
      trustedJudge: false,
      surfacesWithoutEvidence,
      summary:
        `No trusted judge is configured. Learners can write and run Python, but ` +
        `${surfacesWithoutEvidence.length} of ${EVERY_SURFACE.length} surfaces produce no ` +
        `evidence — those checks are a teacher's to mark, and contests cannot run.`,
    };
  }

  return {
    mode: "SERVER_ONLY_FALLBACK",
    localRun: false,
    trustedJudge: trustedProviderConfigured,
    surfacesWithoutEvidence,
    summary: trustedProviderConfigured
      ? "Python will not run in this browser; Run and Submit both go to the server judge."
      : "Python will not run in this browser and no judge is configured. Nothing can execute.",
  };
}
