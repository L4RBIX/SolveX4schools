"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type FeedbackStatus = "correct" | "wrong";

export interface FeedbackState {
  status: FeedbackStatus;
  message: string;
  detail?: string;
}

export interface FeedbackBarProps extends FeedbackState {
  /** The chrome's action button, rendered on the right of the bar. */
  action: ReactNode;
  className?: string;
}

const BAR_HEIGHT = 88;

/**
 * Replaces the bottom bar once an answer is committed. Slides up from below,
 * leaves a little faster than it arrives.
 */
export function FeedbackBar({
  status,
  message,
  detail,
  action,
  className,
}: FeedbackBarProps) {
  const reduce = useReducedMotion();
  const correct = status === "correct";

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { y: BAR_HEIGHT }}
      animate={reduce ? { opacity: 1 } : { y: 0 }}
      exit={
        reduce
          ? { opacity: 0, transition: { duration: 0 } }
          : { y: BAR_HEIGHT, transition: { duration: 0.168, ease: EASE_OUT_QUINT } }
      }
      transition={{
        duration: reduce ? 0 : 0.24,
        ease: EASE_OUT_QUINT,
      }}
      className={cn(
        "absolute inset-0 z-10 flex h-[88px] items-center gap-3 border-t-2 bg-b-dark px-5 sm:gap-4 sm:px-8",
        correct ? "border-t-b-green-2" : "border-t-[#E05A4B]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-[0.12]",
          correct ? "bg-b-green-2" : "bg-[#E05A4B]",
        )}
      />

      <span
        aria-hidden="true"
        className={cn(
          "relative grid h-10 w-10 shrink-0 place-items-center rounded-full",
          correct ? "bg-b-green-2" : "bg-[#E05A4B]",
        )}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          {correct ? (
            <path
              d="M5 12.5 10 17.5 19 7"
              stroke="#141414"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
              stroke="#141414"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </span>

      <div className="relative min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium leading-6 text-white">
          {message}
        </p>
        {detail ? (
          <p className="hidden truncate text-[14px] leading-5 text-white/60 sm:block">
            {detail}
          </p>
        ) : null}
      </div>

      <div className="relative shrink-0">{action}</div>
    </motion.div>
  );
}
