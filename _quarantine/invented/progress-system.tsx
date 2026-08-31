"use client";

import { motion, useReducedMotion } from "motion/react";

import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ProgressSystemProps {
  /** Number of screens in the lesson. */
  total: number;
  /** Zero-based index of the screen being shown. */
  current: number;
  className?: string;
}

/**
 * The lesson progress bar: one thin segment per screen, spanning the chrome.
 * Cleared segments fill solid green, the current one fills part-way.
 */
export function ProgressSystem({ total, current, className }: ProgressSystemProps) {
  const reduce = useReducedMotion();
  const position = Math.min(Math.max(current, 0), Math.max(total - 1, 0));

  return (
    <div
      role="group"
      aria-label="Lesson progress"
      className={cn("relative flex w-full items-center gap-1", className)}
    >
      {Array.from({ length: total }, (_, index) => {
        const done = index < position;
        const active = index === position;
        const state = done ? "complete" : active ? "in progress" : "not started";

        return (
          <div
            key={index}
            role="img"
            aria-label={`Question ${index + 1} of ${total}, ${state}`}
            className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-b-dim-2"
          >
            <motion.span
              className="absolute inset-y-0 left-0 block rounded-full bg-b-green-2"
              initial={false}
              animate={{ width: done ? "100%" : active ? "55%" : "0%" }}
              transition={
                reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT_QUINT }
              }
            />
          </div>
        );
      })}

      <p className="sr-only" aria-live="polite">
        {`Question ${position + 1} of ${total}`}
      </p>
    </div>
  );
}
