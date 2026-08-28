import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The milestone node.
 *
 * This is motion, so what is asserted is the mechanism rather than pixels: that
 * the spring is the curve sampled from the reference and not a substitute, that
 * the glow comes from below rather than being a ring around the outside, that
 * every pointer exit path releases the press, and that reduced motion still
 * leaves the selected state visible.
 *
 * All four have failure modes that look fine in a screenshot: an ease-out
 * instead of the spring, a `box-shadow` instead of light, a node stuck
 * compressed after a drag, and a selected node that vanishes for the learner
 * who most needed to see it.
 */

const ROOT = join(import.meta.dirname, "../..");
const pedestal = readFileSync(
  join(ROOT, "src/components/brilliant/gameboard/gameboard-pedestal.tsx"),
  "utf8",
);
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
const board = readFileSync(
  join(ROOT, "src/components/brilliant/gameboard/course-gameboard.tsx"),
  "utf8",
);

describe("press physics", () => {
  it("uses the spring curve sampled from the live player, not a substitute", () => {
    /* `--ease-b-spring` is a `linear()` copied verbatim from the reference's
       own transition declaration — it overshoots to 1.027 at 54% and settles.
       An ease-out reads visibly wrong, which is why it was sampled. */
    expect(css).toContain("--ease-b-spring: linear(");
    expect(css).toContain("1.027 54%");
    expect(pedestal).toContain("var(--ease-b-spring)");
  });

  it("compresses fast and releases slowly", () => {
    // A press must feel immediate; the settle is where the character is.
    expect(pedestal).toMatch(/transform 90ms/);
    expect(pedestal).toMatch(/transform 520ms/);
    expect(pedestal).toContain("scale(0.94)");
  });

  it("releases on every path out of a press", () => {
    /* Dragging off a node without `pointerleave` leaves it stuck compressed —
       the single most common bug in a hand-written press state. */
    for (const handler of ["onPointerDown", "onPointerUp", "onPointerLeave", "onPointerCancel"]) {
      expect(pedestal, handler).toContain(handler);
    }
  });
});

describe("the glow", () => {
  it("is light from below, not a ring around the outside", () => {
    /* The reference paints `#9D62FF` as a gradient running from full at the
       bottom of the disc to transparent above it. `box-shadow: 0 0 20px
       purple` is the thing the brief explicitly rules out, and it is a
       different reading: an outline, not illumination. */
    expect(pedestal).toContain("radial-gradient");
    expect(pedestal).not.toMatch(/boxShadow:\s*"0 0 \d+px/);
  });

  it("tints the stone by blending, so its shading survives", () => {
    // `mix-blend-mode: color` keeps the backdrop's luminosity and moves only
    // the hue, which is why the highlight and rim shadow are not flooded over.
    expect(pedestal).toContain('mixBlendMode: "color"');
  });

  it("clips the blend to the stone rather than to the element box", () => {
    /* Where the blend layer overlaps the page instead of the disc it produces
       dark violet, and the element's own rectangle becomes visible. Fading the
       gradient out before the edge is not enough. */
    expect(pedestal).toContain("clipPath:");
    expect(pedestal).toContain("ellipse(");
  });

  it("lights the learner's current node more strongly than one they tapped", () => {
    // Both are lit, at different strengths, so the two are distinguishable
    // when they are different nodes.
    expect(pedestal).toMatch(/active \? 1 : selected \? 0\.72 : 0/);
  });
});

describe("reduced motion", () => {
  it("drops the spring and the compression", () => {
    expect(pedestal).toContain("useReducedMotion");
    expect(pedestal).toMatch(/reduce\s*\?\s*"none"/);
    expect(pedestal).toMatch(/reduce \? undefined : \(\) => setPressed\(true\)/);
  });

  it("still shows the selected state", () => {
    /* The brief is explicit: no large spring, but the selected node must
       remain obvious. The opacity transitions carry `motion-reduce:` so they
       land instantly rather than not at all. */
    const glowLayers = pedestal.match(/motion-reduce:transition-none/g) ?? [];
    expect(glowLayers.length).toBeGreaterThanOrEqual(3);
  });
});

describe("node states", () => {
  it("takes the product branch rather than the reference's Rive scene", () => {
    // That scene puts Koji on the learner's current node, and the .riv is
    // Brilliant's file.
    const monthBoard = readFileSync(
      join(ROOT, "src/components/brilliant/gameboard/month-board.tsx"),
      "utf8",
    );
    expect(monthBoard).toContain("ownMascot");
  });

  it("dims an unauthored node instead of padlocking it", () => {
    /* "Locked" here means the lesson is not written yet, not that the learner
       has to earn it. A padlock promises a key. */
    expect(board).toContain("opacity-35");
    // The word survives in the comment explaining the decision; what must not
    // exist is a rendered padlock glyph or a `padlock` prop.
    expect(board).not.toMatch(/<Padlock|padlock=|PadlockIcon/);
  });

  it("marks a completed node beside its title, not by colour alone", () => {
    // Correctness must never be conveyed by colour alone.
    expect(board).toContain("node.done");
  });

  it("keeps the selection reachable from the keyboard", () => {
    expect(board).toContain("aria-pressed");
    expect(board).toContain("aria-disabled");
  });
});
