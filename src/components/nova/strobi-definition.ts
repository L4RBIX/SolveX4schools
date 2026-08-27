import definition from "@/assets/strobi.avatar.json";

/**
 * Strobi — the avatar definition, and the types that keep it honest.
 *
 * ## Why we render this ourselves
 *
 * The reference renderer, `@bible-strong/avatar-react@0.1.0`, is
 * **AGPL-3.0-only** — verified from the package metadata, and there is no other
 * published version. For a paid, network-delivered school product that licence's
 * §13 would require offering the complete corresponding source of the whole
 * work to every user who interacts with it. That is not compatible with the
 * intended deployment, and shipping it quietly anyway is not an option.
 *
 * The definition file, however, is DATA: 28 expressions of head rotation and
 * eye geometry, and 25 animations expressed as step sequences with hold and
 * transition timings. Reading a documented data format with our own code
 * creates no obligation. The package is neither installed nor imported.
 *
 * `<StrobiAvatar>` is deliberately swappable: if the licence is ever resolved,
 * the official renderer drops in behind the same wrapper and nothing else in
 * the product changes.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface EyeShape {
  width: number;
  height: number;
  x: number;
  y: number;
  angle: number;
}

export interface Expression {
  head: Vec3;
  eyes: { left: EyeShape; right: EyeShape; spacing: number };
  perspective: number;
  motion: { eyes: EyeMotion; body: BodyMotion };
}

export type EyeMotion = "none" | "microSaccades" | "shake";
export type BodyMotion = "none" | "shake" | "slowDrift";

export interface AnimationStep {
  expression: string;
  holdMs: number;
  transitionMs: number;
  transition: "smooth";
}

export interface BlinkConfig {
  enabled: boolean;
  initialDelayMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  durationMs: number;
}

export interface Animation {
  playbackMode: "loop";
  steps: AnimationStep[];
  blink: BlinkConfig;
  metadata?: { label?: string; description?: string; group?: string };
}

export interface AvatarDefinition {
  schema: string;
  schemaVersion: number;
  name: string;
  body: { primary: { type: string; width: number; height: number; depth: number; roundness: number } };
  colors: { body: string; eyes: string };
  expressions: Record<string, Expression>;
  expressionOrder: string[];
  animations: Record<string, Animation>;
  animationOrder: string[];
}

export const STROBI = definition as unknown as AvatarDefinition;

/**
 * The animation names that actually exist in the file.
 *
 * Exported as a runtime value, not a hand-written union, so a semantic mapping
 * cannot reference a name that was never in the definition. The previous
 * failure mode this prevents is real and specific: writing
 * `animation="celebrating2"` because it sounds plausible, and getting a silent
 * no-op instead of an error.
 */
export const ANIMATION_NAMES: readonly string[] = STROBI.animationOrder;
export const EXPRESSION_NAMES: readonly string[] = STROBI.expressionOrder;

export function isAnimation(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(STROBI.animations, name);
}

/**
 * Validate the whole definition and every mapping into it.
 *
 * Called by a test rather than at import time — a school lesson must not fail
 * to render because a mascot definition drifted — but it throws loudly there,
 * which is where drift should be caught.
 */
export function validateDefinition(mappedAnimations: readonly string[]): string[] {
  const problems: string[] = [];

  if (STROBI.schema !== "bible-strong/avatar-definition") {
    problems.push(`unexpected schema "${STROBI.schema}"`);
  }
  if (STROBI.animationOrder.length !== Object.keys(STROBI.animations).length) {
    problems.push("animationOrder and animations disagree on how many exist");
  }

  for (const name of STROBI.animationOrder) {
    const anim = STROBI.animations[name];
    if (!anim) {
      problems.push(`animationOrder lists "${name}" but it has no definition`);
      continue;
    }
    if (anim.steps.length === 0) problems.push(`"${name}" has no steps`);
    for (const step of anim.steps) {
      if (!STROBI.expressions[step.expression]) {
        problems.push(`"${name}" references expression "${step.expression}", which does not exist`);
      }
    }
  }

  // The check that matters most: every semantic state the product maps to must
  // land on a name that is really in the file.
  for (const name of mappedAnimations) {
    if (!isAnimation(name)) {
      problems.push(
        `semantic mapping targets animation "${name}", which is not in the definition. ` +
          `Available: ${STROBI.animationOrder.join(", ")}`,
      );
    }
  }

  return problems;
}
