import type { Transition, Variants } from "motion/react";

/**
 * One motion rhythm for the whole page. Every animation on the site pulls its
 * easing and duration from here, so nothing feels like it came from a
 * different product.
 */

export const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
export const EASE_OUT_CUBIC = [0.33, 1, 0.68, 1] as const;
export const EASE_IN_OUT = [0.645, 0.045, 0.355, 1] as const;

export const enter: Transition = {
  duration: 0.55,
  ease: EASE_OUT_QUINT,
};

export const exit: Transition = {
  duration: 0.24,
  ease: EASE_OUT_CUBIC,
};

/** Interruptible spring for anything a pointer can grab or re-trigger. */
export const spring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9,
};

export const softSpring: Transition = {
  type: "spring",
  stiffness: 160,
  damping: 22,
  mass: 1,
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: enter },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: enter },
};

/** Parent that releases its children in sequence. */
export const stagger = (gap = 0.06, delay = 0): Variants => ({
  hidden: {},
  shown: {
    transition: { staggerChildren: gap, delayChildren: delay },
  },
});

/** Standard viewport trigger — fires once, a little before the edge. */
export const inView = { once: true, amount: 0.25, margin: "0px 0px -80px 0px" };
