/**
 * The shapes that cross from the server half of this lab to the client half.
 *
 * A types-only module, and that is the point. `schools/ops/judge-probe.ts` is
 * `server-only` — importing it from a client component would throw at bundle
 * time, and rightly, because it can reach the key. A `import type` of it is
 * erased before the bundler ever sees a module graph, so the CLIENT gets the
 * exact same type the SERVER produced rather than a hand-copied mirror of it
 * that silently stops matching the first time a field is added.
 *
 * Nothing here has a runtime value. If anything in this file ever gains one, it
 * belongs somewhere else.
 */
import type { JudgeProbe, TrustedJudgeConfig } from "@schools/ops/judge-probe";

export type { JudgeProbe, TrustedJudgeConfig };

/**
 * What the probe action gives back.
 *
 * A refusal is a first-class outcome and not an exception: the action refuses
 * outright in a production build, and "we did not call the judge, and here is
 * why" is a different thing to render from "we called it and it failed".
 */
export type ProbeOutcome =
  | { kind: "probed"; probe: JudgeProbe }
  | { kind: "refused"; why: string };
