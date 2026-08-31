"use client";

import { useRive } from "@rive-app/react-canvas";
import { motion, useReducedMotion } from "motion/react";

/**
 * "Meet Koji, your personal tutor".
 *
 * Koji is brilliant.org's own Rive animation — /rive/meet_koji.0dced838.riv,
 * extracted and served locally. It is NOT a drawing: an earlier version of this
 * file substituted a hand-made SVG blob, which was invented content and wrong.
 *
 * Measured on the live page at 1470px:
 *   section background  #FFFFFF  (not the paper band)
 *   canvas              340 x 447, centred, top y1238
 *   canvas wrapper      340 x 108, position: relative, overflow visible
 *                       — the canvas overflows it by 339px, and that spill is
 *                         Koji's light trail passing behind the heading
 *   heading             60px, centred, top y1434 → 88px below the wrapper,
 *                       overlapping the canvas by 251px
 */

const KOJI_SRC =
  "/assets/original/brilliant/brilliant.org/rive/meet_koji.0dced838.riv";

/**
 * The file carries 24 artboards — every homepage animation Brilliant ships,
 * including the four feature-row scenes. The default artboard is a lesson
 * scene, not Koji, so both of these must be named explicitly.
 */
const KOJI_ARTBOARD = "MAIN_KojiEntrance";
/**
 * The KojiEntrance state machine parks in a pre-entrance state and exposes no
 * inputs to advance it, so the timelines are played directly: the entrance,
 * then the resting loop. Under reduced motion Koji holds on the still frame.
 */
const KOJI_INTRO = "Intro";
const KOJI_LOOP = "Loop";
const KOJI_REST = ["EndStill"];

const CANVAS_W = 340;
const CANVAS_H = 447;
/** The wrapper the original gives the canvas; the rest of the art overflows. */
const WRAPPER_H = 108;
/** Measured gap from the wrapper's bottom edge to the heading's top edge. */
const HEADING_GAP = 88;

export function KojiSection() {
  const reduce = useReducedMotion();
  const still = reduce === true;

  const { RiveComponent } = useRive({
    src: KOJI_SRC,
    artboard: KOJI_ARTBOARD,
    animations: still ? KOJI_REST : [KOJI_INTRO, KOJI_LOOP],
    autoplay: true,
  });

  return (
    <section className="bg-b-white py-20 lg:py-28" aria-labelledby="b-koji-heading">
      <div className="b-shell relative flex flex-col items-center text-center">
        {/*
          Koji sits in a short wrapper and deliberately overflows it downward,
          behind the heading — hence the explicit z-0 / z-10 pairing.
        */}
        <div
          className="relative z-0 w-[220px] sm:w-[280px] lg:w-[340px]"
          style={{ height: `${WRAPPER_H}px` }}
          aria-hidden
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2"
            style={{
              width: `${CANVAS_W}px`,
              height: `${CANVAS_H}px`,
              maxWidth: "100%",
            }}
          >
            <RiveComponent className="h-full w-full" />
          </div>
        </div>

        <motion.h2
          id="b-koji-heading"
          initial={still ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          style={{ marginTop: `${HEADING_GAP}px` }}
          className="relative z-10 max-w-[900px] font-b-serif text-[36px] leading-[39.6px] font-medium tracking-[-0.72px] text-b-ink sm:text-[48px] sm:leading-[52.8px] sm:tracking-[-0.96px] lg:text-[60px] lg:leading-[66px] lg:tracking-[-1.2px]"
        >
          Meet Koji, your personal tutor
        </motion.h2>

        <motion.p
          initial={still ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 mt-6 max-w-[560px] text-[18px] leading-[27px] text-b-muted sm:text-[20px] sm:leading-[29px]"
        >
          He asks the right question, waits while you think, and picks the next
          one based on how that went.
        </motion.p>
      </div>
    </section>
  );
}
