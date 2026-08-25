"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { GLYPHS, Glyph } from "./glyphs";

/**
 * Two headers coexist on `/math`.
 *
 * A. A transparent, in-flow bar the hero is pulled up underneath. It carries
 *    the wordmark and a single "Sign in".
 * B. A solid copy fixed to the top that slides in past 200px of scroll and only
 *    slides back out below 92px — a hysteresis band, not a threshold, so the
 *    bar does not flicker while you nudge the wheel around the trigger.
 */

const SHOW_AT = 200;
const HIDE_BELOW = 92;

/** Non-3D header button, 48px tall with a 54px pill radius. */
const HEADER_BUTTON = cn(
  "inline-flex h-12 cursor-pointer items-center justify-center gap-2",
  "rounded-[54px] border-2 border-transparent px-[1.375rem] py-3",
  "font-b-sans text-[16px] font-medium leading-[1.25] transition-colors duration-100 ease-out",
);

const HEADER_BUTTON_SECONDARY = cn(
  "border-black/10 bg-transparent text-black",
  "hover:border-black/30 active:border-black/30 active:bg-black/20",
);

const HEADER_BUTTON_PRIMARY = cn(
  "bg-[#29cc57] text-white hover:bg-[#15b441] active:bg-[#009b2b]",
);

function Wordmark() {
  return (
    <a href="/brilliant" className="inline-flex text-black">
      <Glyph
        src={GLYPHS.wordmark}
        className="h-6 w-[101px] min-[481px]:h-8 min-[481px]:w-[135px]"
      />
    </a>
  );
}

const ROW = cn(
  "flex h-16 w-full max-w-full flex-row flex-nowrap items-center justify-between gap-6",
  "min-[360px]:max-w-[432px] min-[481px]:gap-8 min-[769px]:max-w-[1216px] min-[992px]:gap-10",
);

export function SubjectHeader() {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > SHOW_AT) setShown(true);
      else if (window.scrollY < HIDE_BELOW) setShown(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* A — transparent, in flow */}
      <div className="z-[999] flex w-full flex-col">
        <div className="z-[999] flex w-full max-w-full flex-col border-b-0 bg-transparent px-6 pt-3 min-[481px]:px-8 min-[481px]:pt-6">
          <div className={cn(ROW, "mx-auto")}>
            <Wordmark />
            <a href="/login/" className="inline-flex">
              <span className={cn(HEADER_BUTTON, HEADER_BUTTON_SECONDARY)}>Sign in</span>
            </a>
          </div>
        </div>
      </div>

      {/* B — solid, fixed, scroll-revealed */}
      <motion.div
        className="fixed top-0 right-0 left-0 z-10"
        initial={{ y: "-100%" }}
        animate={
          shown
            ? {
                y: 0,
                transition: reduce
                  ? { duration: 0 }
                  : { type: "spring", damping: 25, stiffness: 180 },
              }
            : {
                y: "-100%",
                transition: reduce ? { duration: 0 } : { duration: 0.15, ease: "easeInOut" },
              }
        }
      >
        <div className="flex w-full max-w-full flex-col border-b border-black/10 bg-white px-6 min-[481px]:px-8">
          <div className={cn(ROW, "mx-auto")}>
            <Wordmark />
            <div className="flex flex-row items-center gap-2">
              <a href="/login/" className="hidden min-[481px]:inline-flex">
                <span className={cn(HEADER_BUTTON, HEADER_BUTTON_SECONDARY)}>Sign in</span>
              </a>
              <a href="/welcome/" className="inline-flex">
                <span className={cn(HEADER_BUTTON, HEADER_BUTTON_PRIMARY)}>Get started</span>
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
