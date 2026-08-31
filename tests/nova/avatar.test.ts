import { describe, it, expect } from "vitest";
import {
  STROBI,
  ANIMATION_NAMES,
  isAnimation,
  validateDefinition,
} from "@/components/nova/strobi-definition";
import { NOVA_ANIMATION, type NovaState } from "@/components/nova/nova-avatar";

/**
 * The avatar definition is the source of truth, and these tests are what stop
 * the product drifting away from it.
 */

describe("strobi definition", () => {
  it("is the file we think it is", () => {
    expect(STROBI.schema).toBe("bible-strong/avatar-definition");
    expect(STROBI.name).toBe("Strobi");
    expect(STROBI.animationOrder.length).toBe(25);
    expect(STROBI.expressionOrder.length).toBe(28);
  });

  it("has no animation referencing an expression that does not exist", () => {
    expect(validateDefinition([])).toEqual([]);
  });

  it("carries the exact keys the product relies on", () => {
    // Hyphenated, and there is no `celebrating`. Both are easy to get wrong.
    expect(isAnimation("correct-animation")).toBe(true);
    expect(isAnimation("celebrate")).toBe(true);
    expect(isAnimation("celebrating")).toBe(false);
    expect(isAnimation("celebrating2")).toBe(false);
  });
});

describe("semantic mapping", () => {
  const mapped = Object.values(NOVA_ANIMATION);

  it("every state resolves to a real animation", () => {
    expect(validateDefinition(mapped)).toEqual([]);
  });

  it("covers every semantic state", () => {
    const states: NovaState[] = [
      "idle", "listening", "thinking", "searching", "working", "correct",
      "incorrect", "curious", "confused", "proud", "celebrating", "error",
      "drowsy", "sleeping", "waking",
    ];
    for (const s of states) {
      expect(NOVA_ANIMATION[s], `${s} must map to something`).toBeTruthy();
      expect(isAnimation(NOVA_ANIMATION[s]), `${s} → ${NOVA_ANIMATION[s]}`).toBe(true);
    }
  });

  it("never punishes a learner emotionally", () => {
    /* The definition offers these; the product refuses them. A wrong answer is
       expected several times per lesson by design — the programme is 70%
       practice — and meeting disappointment that often teaches avoidance. */
    for (const punitive of ["angry", "sad", "scared"]) {
      expect(ANIMATION_NAMES).toContain(punitive);
      expect(
        mapped,
        `"${punitive}" exists in the definition and must stay unmapped`,
      ).not.toContain(punitive);
    }
    expect(NOVA_ANIMATION.incorrect).toBe("confused");
  });
});
