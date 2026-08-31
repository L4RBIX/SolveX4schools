import type { ExecutionTrust } from "./trust";

/**
 * Which product surfaces accept a browser result, and which demand the server.
 *
 * ## Why this is one file and not a condition in each component
 *
 * "May a browser pass count here?" is the single most consequential question in
 * the execution subsystem, and it has a different answer for a guided lesson
 * step than for a monthly check. Answered inline, it gets answered eight times
 * by eight people, and the seventh one — under deadline, on the contest screen
 * — gets it wrong in the direction that makes the feature work.
 *
 * So the answers live here as data, every caller reads them, and adding a
 * surface is a compile error until someone decides what it requires.
 */

/**
 * A place in the product where code gets executed.
 *
 * Named after what the learner is DOING, not after which component renders it:
 * a component can move, and the reason a contest needs server verification is
 * not that it is a contest route.
 */
export type ExecutionSurface =
  /** A worked step inside a lesson: try it, see what happens. */
  | "lesson_guided"
  /** Ordinary practice tasks — `m1.p1`…`m1.p9`, the independent-practice unit. */
  | "lesson_practice"
  /** A task whose result is claimed as evidence the learner solved it unaided. */
  | "independent_evidence"
  /** The monthly check. */
  | "assessment"
  /** A timed classroom contest. */
  | "contest"
  /** The May final tournament. */
  | "final_tournament";

export interface SurfacePolicy {
  /** May a local browser result settle this surface at all? */
  localRunAllowed: boolean;
  /**
   * The trust a CHECK on this surface must carry to count.
   *
   * `client_local` means a browser pass is a real outcome here. `server_verified`
   * means a browser pass is feedback and nothing more, however green it looks.
   */
  requiredCheckTrust: ExecutionTrust;
  /**
   * What happens on this surface when no trusted provider is configured.
   *
   * The honest options are to fall back to a human, or to refuse. Silently
   * accepting the local result is not among them, which is why this type has no
   * value meaning "just use the browser then".
   */
  withoutTrustedProvider: "allow_local" | "teacher_review" | "unavailable";
}

/**
 * The policy table.
 *
 * The shape of it is the argument: everything a learner does to LEARN accepts a
 * local result, and everything anyone will later CLAIM something about does not.
 * A lesson step exists to tell a fourteen-year-old whether their loop runs; a
 * monthly check exists to tell a school what the learner can do unaided. Those
 * need different guarantees and it is not a matter of degree.
 */
export const TRUST_POLICY: Readonly<Record<ExecutionSurface, SurfacePolicy>> = Object.freeze({
  lesson_guided: {
    localRunAllowed: true,
    requiredCheckTrust: "client_local",
    withoutTrustedProvider: "allow_local",
  },
  lesson_practice: {
    localRunAllowed: true,
    requiredCheckTrust: "client_local",
    withoutTrustedProvider: "allow_local",
  },

  /* From here down the browser stops being an acceptable witness. */

  independent_evidence: {
    /* Local Run is still ALLOWED — a learner iterating on a hard problem should
       not be forced through the judge on every attempt, and the programme's
       whole cost model depends on that. What changes is that the CHECK which
       produces the evidence must come from the server. */
    localRunAllowed: true,
    requiredCheckTrust: "server_verified",
    withoutTrustedProvider: "teacher_review",
  },
  assessment: {
    localRunAllowed: true,
    requiredCheckTrust: "server_verified",
    /* Not `unavailable`: a check the school has scheduled should not evaporate
       because a judge is down. It becomes a human's job, which is what the
       approved programme already says a monthly check partly is. */
    withoutTrustedProvider: "teacher_review",
  },
  contest: {
    localRunAllowed: true,
    requiredCheckTrust: "server_verified",
    /* A contest result is a ranking against other children. There is no honest
       degraded mode for that, so it does not run. */
    withoutTrustedProvider: "unavailable",
  },
  final_tournament: {
    localRunAllowed: true,
    requiredCheckTrust: "server_verified",
    withoutTrustedProvider: "unavailable",
  },
});

export function policyFor(surface: ExecutionSurface): SurfacePolicy {
  return TRUST_POLICY[surface];
}

/**
 * Would a result of this trust settle this surface?
 *
 * The whole point of the subsystem in one function. `server_verified` satisfies
 * everything; `client_local` satisfies only what the table says it may.
 */
export function trustSatisfies(surface: ExecutionSurface, trust: ExecutionTrust): boolean {
  if (trust === "server_verified") return true;
  return policyFor(surface).requiredCheckTrust === "client_local";
}

/**
 * Which surface a curriculum block belongs to.
 *
 * Derived from the block and its lesson rather than passed in by a component,
 * so a code task cannot be rendered somewhere that quietly downgrades what it
 * requires. `verify` blocks are the monthly check; the independent-practice
 * unit is `m1.l9` / the `m1.pN` ids; everything else in a lesson is guided.
 */
export function surfaceForBlock(input: {
  blockType: string;
  blockId: string;
  lessonId: string;
}): ExecutionSurface {
  if (input.blockType === "verify") return "assessment";
  if (input.blockType === "arena_problem") return "contest";

  /* `m1.p3` — the independent-practice lessons.
   *
   * This is a POSITIONAL rule and it is deliberately narrower than the
   * curriculum's own `isIndependent`, which asks a different question. That
   * predicate asks whether the learner produced a whole program from nothing —
   * a measure of evidence. This asks how much a browser-reported pass can be
   * trusted — a measure of integrity. They do not have to agree, and they do
   * not: 100 blocks that `isIndependent` counts sit on `lesson_guided`, where
   * a local browser pass settles them.
   *
   * The comment here used to justify this rule BY that count — "the programme
   * counts these toward its «~100 толық дербес шешім», so they are the evidence
   * surface" — which reads as one concept implemented twice and is not. Whether
   * the trust boundary SHOULD widen to match the count is a real question about
   * what a school can defend, and it is on the release register rather than
   * settled here: widening it would require a trusted provider for a hundred
   * ordinary lesson tasks. */
  if (/^m\d+\.p\d+/.test(input.blockId)) return "independent_evidence";

  if (input.blockType === "challenge") return "independent_evidence";
  return "lesson_guided";
}

/**
 * How the product should behave on a surface right now.
 *
 * Folds the policy together with whether a trusted provider actually exists, so
 * a caller asks one question instead of remembering to combine two facts.
 */
export interface SurfaceCapability {
  surface: ExecutionSurface;
  canRunLocally: boolean;
  /** True when a Check on this surface will produce real, countable evidence. */
  checkProducesEvidence: boolean;
  /** What to tell the learner when it will not. */
  degradedMode: "none" | "local_only" | "teacher_review" | "unavailable";
}

export function capabilityFor(
  surface: ExecutionSurface,
  trustedProviderConfigured: boolean,
): SurfaceCapability {
  const policy = policyFor(surface);

  if (policy.requiredCheckTrust === "client_local") {
    return {
      surface,
      canRunLocally: policy.localRunAllowed,
      checkProducesEvidence: true,
      degradedMode: "none",
    };
  }

  if (trustedProviderConfigured) {
    return {
      surface,
      canRunLocally: policy.localRunAllowed,
      checkProducesEvidence: true,
      degradedMode: "none",
    };
  }

  return {
    surface,
    canRunLocally: policy.localRunAllowed,
    /* The load-bearing line. With no trusted provider, a surface that requires
       one produces NO evidence — not weaker evidence, and not evidence with an
       asterisk. */
    checkProducesEvidence: false,
    degradedMode:
      policy.withoutTrustedProvider === "teacher_review" ? "teacher_review" : "unavailable",
  };
}
