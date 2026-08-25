"use client";

import { cn } from "@/lib/utils";
import { ArrowUpIcon, CloseIcon, SparkleIcon, StreakBoltIcon } from "./icons";

/**
 * The lesson player's top bar.
 *
 * Layout, all measured at a 1470 viewport: a 64px sticky strip at z-855 with
 * `padding: 0 10.5px`, `justify-content: space-between` and `gap: 48px`. It is
 * three groups — close, a centred navigation cluster, and the XP/streak
 * readout — and the left group carries a 66.22px-wide invisible spacer
 * (`data-xp-placeholder`) whose only job is to balance the right group so the
 * progress bar lands optically centred. Reproduced, because dropping it shifts
 * the bar.
 *
 * The "segmented progress bar" is a 592x12 track plus exactly three 16x12
 * pills at a 28px pitch (12px gap) — one continuous bar for the section in
 * progress, three dots for the sections still to come.
 */

export interface LessonTopBarProps {
  /** 0..1 for the active section. */
  progress?: number;
  /** How many of the three trailing sections are already done. */
  segmentsComplete?: number;
  xp?: number;
  streak?: number;
  canPrev?: boolean;
  canNext?: boolean;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

const SEGMENTS = 3;

export function LessonTopBar({
  progress = 0,
  segmentsComplete = 0,
  xp = 0,
  streak = 0,
  canPrev = false,
  canNext = false,
  onClose,
  onPrev,
  onNext,
  className,
}: LessonTopBarProps) {
  return (
    <div
      data-navbar="true"
      className={cn(
        "sticky top-0 z-[855] flex min-h-16 shrink-0 items-center justify-between gap-12 px-[10.5px]",
        className,
      )}
    >
      {/* ---- left ------------------------------------------------------ */}
      <div className="flex h-12 items-center">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="relative flex h-12 w-12 min-w-12 cursor-pointer items-center justify-center overflow-clip rounded-[6px] border-2 border-transparent text-white/50 transition-colors hover:text-white"
        >
          <CloseIcon />
        </button>
        {/* balances the right-hand group; intentionally empty */}
        <div data-xp-placeholder="true" className="h-0 w-[66.22px]" />
      </div>

      {/* ---- centre ---------------------------------------------------- */}
      <div role="group" className="flex flex-1 items-center justify-center gap-3">
        <NavArrow direction="prev" enabled={canPrev} onClick={onPrev} />

        <div className="h-3 w-full max-w-[592px]">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-3 w-full overflow-hidden rounded-full bg-white/20"
          >
            <div
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
              className="h-full rounded-full bg-b-ok-progress transition-[width] duration-200"
            />
          </div>
        </div>

        <div className="flex gap-3">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-3 w-4 rounded-full transition-all duration-200",
                i < segmentsComplete ? "bg-b-ok-progress" : "bg-white/5",
              )}
            />
          ))}
        </div>

        <NavArrow direction="next" enabled={canNext} onClick={onNext} />
      </div>

      {/* ---- right ----------------------------------------------------- */}
      <div className="flex h-8 items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-end",
            xp > 0 ? "text-b-green" : "text-white/20",
          )}
        >
          <span className="relative block min-w-[35.18px] text-right text-[16px] leading-[22.4px] font-medium">
            {xp}
          </span>
          <SparkleIcon className="-mt-0.5 shrink-0" />
        </div>
        <button
          type="button"
          aria-label="Your current streak"
          data-testid="streaks_button"
          className={cn(
            "relative -mt-[2.5px] flex h-8 w-8 min-w-8 cursor-pointer items-center justify-center gap-2 rounded-[54px] border-2 border-transparent",
            streak > 0 ? "text-b-green-2" : "text-white/20",
          )}
        >
          <StreakBoltIcon completed={streak > 0} />
        </button>
      </div>
    </div>
  );
}

/**
 * The nav arrows are always mounted and always 52x52; only opacity changes,
 * over `0.3s ease-in-out`. Keeping them mounted is what stops the progress bar
 * from jumping when navigation becomes available.
 */
function NavArrow({
  direction,
  enabled,
  onClick,
}: {
  direction: "prev" | "next";
  enabled: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="h-[52px] w-[52px] shrink-0">
      <div
        className={cn(
          "flex h-full w-full items-center justify-center transition-opacity duration-300 ease-in-out",
          enabled ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          type="button"
          aria-label={direction === "prev" ? "left" : "right"}
          disabled={!enabled}
          data-disabled={enabled ? undefined : ""}
          onClick={onClick}
          className={cn(
            "relative flex h-[52px] w-[52px] items-center justify-center overflow-clip rounded-full border-2 border-transparent p-4",
            enabled ? "cursor-pointer text-white/60 hover:text-white" : "cursor-default text-white/20",
          )}
        >
          <ArrowUpIcon
            className={direction === "prev" ? "rotate-270" : "rotate-90"}
          />
        </button>
      </div>
    </div>
  );
}
