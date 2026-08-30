import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The milestone node.
 *
 * This is motion and material, so what is asserted is the mechanism rather than
 * pixels: that the spring is the curve sampled from the reference and not a
 * substitute, that every pointer exit path releases the press, that the disc is
 * built the way the reference's is, and that reduced motion still leaves the
 * selected state visible.
 *
 * Those have failure modes that look fine in a screenshot: an ease-out instead
 * of the spring, a node stuck compressed after a drag, a purple oval instead of
 * a lit stone, and a selected node that vanishes for the learner who most
 * needed to see it.
 *
 * ## These tests moved, and one of them changed its mind
 *
 * They used to read `gameboard-pedestal.tsx`. That file is now the reference
 * baseline only — it renders Brilliant's artwork and drives Brilliant's Rive —
 * and the product's milestone lives in `sx-milestone.tsx` / `sx-pedestal.tsx`.
 *
 * Two old assertions have been inverted on better evidence, and both were wrong
 * for the same reason: they were read off the STATIC SVG export, while the node
 * a learner actually sees is rendered by Rive.
 *
 * 1. "light from below, not a ring around the outside" — rasterising the export
 *    shows four FLAT colours, no gradient and no shadow anywhere, and the ring
 *    is real.
 * 2. "selection is additive and leaves the disc alone" — sampling a settled
 *    `select=true` render shows selection swapping the whole grey set darker
 *    and whitening the groove, on top of adding a ring that TURNS.
 *
 * See docs/design/BRILLIANT_GAMEBOARD_FORENSICS.md.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const milestone = read("src/components/brilliant/gameboard/sx-milestone.tsx");
const pedestal = read("src/components/brilliant/gameboard/sx-pedestal.tsx");
const nova = read("src/components/brilliant/gameboard/gameboard-nova.tsx");
const board = read("src/components/brilliant/gameboard/course-gameboard.tsx");
const monthBoard = read("src/components/brilliant/gameboard/month-board.tsx");
const css = read("src/app/globals.css");

describe("press physics", () => {
  it("uses the spring curve sampled from the live player, not a substitute", () => {
    /* `--ease-b-spring` is a `linear()` copied verbatim from the reference's
       own transition declaration — it overshoots to 1.027 at 54% and settles.
       An ease-out reads visibly wrong, which is why it was sampled. */
    expect(css).toContain("--ease-b-spring: linear(");
    expect(css).toContain("1.027 54%");
    expect(milestone).toContain("var(--ease-b-spring)");
  });

  it("compresses fast and releases slowly", () => {
    // A press must feel immediate; the settle is where the character is.
    expect(milestone).toMatch(/transform 90ms/);
    expect(milestone).toMatch(/transform 520ms/);
    expect(milestone).toContain("scale(0.96)");
  });

  it("releases on every path out of a press", () => {
    /* Dragging off a node without `pointerleave` leaves it stuck compressed —
       the single most common bug in a hand-written press state. */
    for (const handler of ["onPointerDown", "onPointerUp", "onPointerLeave", "onPointerCancel"]) {
      expect(milestone, handler).toContain(handler);
    }
  });
});

describe("the pedestal is built the way the reference's is", () => {
  it("is flat colour, not a gradient wash", () => {
    /* The reference's disc rasterises to exactly four flat colours. A gradient
       fill is what makes a hand-drawn version read as a purple oval, so the
       four flats are named explicitly and asserted. */
    for (const flat of ["#999999", "#ADADAD", "#E5E5E5", "#CCCCCC"]) {
      expect(pedestal, flat).toContain(flat);
    }
    for (const flat of ["#7E43E0", "#9D62FF", "#C19CFF"]) {
      expect(pedestal, flat).toContain(flat);
    }
  });

  it("gets its depth from an offset ellipse pair, not a drawn wall", () => {
    /* The top face sits ~9u above the rim and ~13u narrower; that offset IS
       the side wall. The reference has no shadow layer at all. */
    expect(pedestal).toMatch(/rim:\s*\{[^}]*cy:\s*135/);
    expect(pedestal).toMatch(/face:\s*\{[^}]*cy:\s*126/);
  });

  it("keeps the groove broken at 12 and 6 o'clock", () => {
    /* A continuous ring reads as a coin; the 6.04u notch is what makes it read
       as a machined platform. It is the detail most likely to be dropped. */
    expect(pedestal).toContain("GAP_W");
    expect(pedestal).toMatch(/GAP_W\s*=\s*6\.04/);
  });

  it("swaps the grey set on selection, and adds the ring", () => {
    /* Sampled off a settled `select=true` render of the reference's artboard,
       unquantised, along the disc's centre row: the disc gets DARKER and the
       groove goes pure white.

         plate/face  #E5E5E5 -> #B3B3B3
         rim         #999999 -> #666666
         groove      #CCCCCC -> #FFFFFF

       An earlier pass asserted the opposite — that selection was purely
       additive and left the disc alone. That was read off the static SVG
       export; the live node, which is what a learner sees, is Rive. */
    expect(pedestal).toContain("#B3B3B3");
    expect(pedestal).toContain("#666666");
    expect(pedestal).toMatch(/selected\s*$/m);
    expect(pedestal).toContain("RING");
  });

  it("keeps the selection ring TURNING, which is the thing you notice", () => {
    /* Captured frame by frame off the reference's own artboard: selecting a
       node sweeps a purple arc around the disc and the ring then rotates
       forever, its gaps travelling the ellipse on a 4087ms cycle. A static
       halo — which is what this was first built as — misses the single most
       visible thing the reference does on click.

       It must be `stroke-dashoffset`, not a `rotate` transform: the ring is an
       ellipse, and rotating it in 2D tilts it off the board's isometric
       horizon. */
    expect(css).toContain("@keyframes sx-ring-spin");
    expect(css).toContain("stroke-dashoffset");
    expect(css).toContain("@keyframes sx-ring-in");
    expect(pedestal).toContain("sx-ring-spin 4087ms linear infinite");
    expect(pedestal).toContain("strokeDasharray");
    // the keyframe itself must move the dash, and nothing else
    const spin = css.slice(css.indexOf("@keyframes sx-ring-spin"));
    const body = spin.slice(0, spin.indexOf("}\n}") + 3);
    expect(body).toContain("stroke-dashoffset");
    expect(body).not.toMatch(/rotate|transform/);
  });

  it("whitens the groove on selection", () => {
    /* The reference drops the ring's fill-opacity when selected, resolving
       #CCCCCC to pure white — a visible flash the instant you click. It now
       travels with the rest of the selected colour set rather than as a
       separate branch. */
    const selectedSet = pedestal.slice(pedestal.indexOf(": selected"));
    expect(selectedSet.slice(0, 220)).toContain('groove: "#FFFFFF"');
  });

  it("turns the disc purple once a node has been reached", () => {
    // The reference's own rule: its `completed` input is `completed || started`.
    expect(pedestal).toMatch(/IS_LIT/);
    expect(pedestal).toMatch(/active:\s*true/);
    expect(pedestal).toMatch(/complete:\s*true/);
    expect(pedestal).toMatch(/available:\s*false/);
  });
});

describe("reduced motion", () => {
  it("drops the spring and the compression", () => {
    expect(milestone).toContain("useReducedMotion");
    expect(milestone).toMatch(/reduce \|\| node\.locked \? undefined : \(\) => setPressed\(true\)/);
  });

  it("drops Nova's arrival rather than her presence", () => {
    /* A learner who reduces motion still has to see where they are. The beam,
       the particles and the coalesce go; the mascot stays. */
    expect(nova).toContain("useReducedMotion");
    expect(nova).toMatch(/reduce\s*\?\s*undefined/);
    expect(nova).toMatch(/!reduce && \(/);
    expect(nova).toMatch(/!reduce &&\s*\n\s*PARTICLES/);
  });
});

describe("the mascot's arrival", () => {
  it("sprays particles before the mascot resolves", () => {
    /* The reference does not drop its mascot in — `koji_appear` scatters dots
       in the mascot's own colour above the pedestal and the mascot coalesces
       out of them inside the beam. Verified by capturing that clip frame by
       frame from the artboard. */
    expect(css).toContain("@keyframes sx-particle");
    expect(nova).toContain("PARTICLES");
    expect(nova).toContain("sx-particle");
  });

  it("uses a fixed particle table, never randomness", () => {
    /* The board server-renders. A random scatter mismatches on hydration. */
    expect(nova).not.toMatch(/Math\.random/);
  });

  it("coalesces rather than falling, and waits for the spray", () => {
    // Grows from 0.35 after a 320ms lead, which is the reference's own order.
    expect(css).toMatch(/scale\(0\.35\)/);
    expect(nova).toContain("sx-nova-arrive 620ms var(--ease-b-spring) 320ms both");
  });
});

describe("node states", () => {
  it("takes the product branch rather than the reference's Rive scene", () => {
    // That scene puts Koji on the learner's current node, and the .riv is
    // Brilliant's file.
    expect(monthBoard).toContain("ownMascot");
  });

  it("never reaches Brilliant's artwork from the product milestone", () => {
    for (const src of [milestone, pedestal, nova]) {
      expect(src).not.toMatch(/assets\/original\/brilliant/);
      expect(src).not.toMatch(/\.riv["']/);
    }
  });

  it("dims an unauthored node instead of padlocking it", () => {
    /* "Locked" here means the lesson is not written yet, not that the learner
       has to earn it. A padlock promises a key. */
    expect(pedestal).toContain("opacity-35");
    // The word survives in the comment explaining the decision; what must not
    // exist is a rendered padlock glyph or a `padlock` prop.
    expect(pedestal).not.toMatch(/<Padlock|padlock=|PadlockIcon/);
  });

  it("marks a completed node beside its title, not by colour alone", () => {
    /* The reference marks completion only by turning the disc purple. A
       purple-only signal does not survive a colour-vision difference, so the
       check stays — small, and at the end of the label. */
    expect(milestone).toContain("node.done");
    expect(milestone).toContain("DoneMark");
    expect(milestone).toMatch(/aria-label=\{label\}/);
  });

  it("keeps the selection reachable from the keyboard", () => {
    /* `aria-disabled`, not `disabled`: a disabled button leaves the tab order,
       so a keyboard learner cannot reach the node to learn it is not ready. */
    expect(milestone).toContain("aria-pressed");
    expect(milestone).toContain("aria-disabled");
    expect(milestone).not.toMatch(/\n\s*disabled=\{/);
  });

  it("marks the learner's current node for assistive tech", () => {
    expect(milestone).toContain('aria-current={node.active ? "step" : undefined}');
  });
});

describe("board rhythm", () => {
  it("runs one rhythm system, the reference's", () => {
    /* The product route used to pass `evenRhythm`, which replaced the measured
       negative-margin collapse with a flat gap. Both the prop and the second
       system are gone; these are the reference's own numbers. */
    expect(board).not.toContain("evenRhythm?");
    expect(board).toContain("mb-50");
    expect(board).toContain("-mt-30");
    expect(board).toContain("-mt-50");
    expect(board).toContain("mb-15");
    expect(board).toContain("mt-[45px]");
  });

  it("keeps the level-header slab 2px proud on both sides", () => {
    /* 460x72 against a 456x64 button. `left-0 right-0` makes it 456 and the
       purple outline disappears from the sides. */
    expect(board).toContain("-inset-x-0.5");
    expect(board).toContain("-bottom-1.5");
  });

  it("paints the scrim that lets rows dissolve under a pinned header", () => {
    expect(board).toContain("linear-gradient(180deg, var(--color-sx-page)");
  });
});
