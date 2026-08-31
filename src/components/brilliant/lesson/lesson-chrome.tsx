"use client";

import Link from "next/link";
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
  /**
   * Where the close button goes. Added for the school runtime, which needs to
   * return to a month board rather than call a handler.
   *
   * Optional with no default on purpose: the reference route at
   * /brilliant/lesson passes neither and keeps its plain button, so extending
   * this component cannot break the surface it was measured against.
   */
  closeHref?: string;
  /** Accessible label for the close control. Defaults to the original's. */
  closeLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
  /**
   * What sits in the right-hand group.
   *
   * Undefined keeps the reference's XP/streak readout, so /brilliant/lesson is
   * untouched. `null` removes it — and removes the 66.22px spacer on the left
   * with it, because that spacer exists only to balance this group and leaving
   * it behind pushes the progress bar off centre.
   *
   * The school player passes its own: a count of answers it has actually
   * checked. The reference's XP was 15 points per correct answer toward
   * nothing — a currency with no economy behind it.
   */
  readout?: React.ReactNode | null;
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
  closeHref,
  closeLabel = "Close",
  className,
  readout,
}: LessonTopBarProps) {
  const showReference = readout === undefined;
  const hasRight = readout !== null;
  const closeClass =
    "relative flex h-12 w-12 min-w-12 cursor-pointer items-center justify-center overflow-clip rounded-[6px] border-2 border-transparent text-b-fg/50 transition-colors hover:text-b-fg";
  return (
    <div
      data-navbar="true"
      className={cn(
        /* The reference is measured at 1470 and its fixed parts — a 66px
           spacer, two 52px arrows and a 48px gap — add up to more than a phone
           has. Below 640 the spacer and the arrows go (the footer's Continue
           already moves the lesson forward) and the gap collapses. */
        "sticky top-0 z-[855] flex min-h-16 shrink-0 items-center justify-between gap-2 px-[10.5px] sm:gap-12",
        className,
      )}
    >
      {/* ---- left ------------------------------------------------------ */}
      <div className="flex h-12 items-center">
        {closeHref ? (
          <Link href={closeHref} aria-label={closeLabel} className={closeClass}>
            <CloseIcon />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className={closeClass}
          >
            <CloseIcon />
          </button>
        )}
        {/* balances the right-hand group; intentionally empty */}
        {hasRight ? (
          <div data-xp-placeholder="true" className="hidden h-0 w-[66.22px] sm:block" />
        ) : null}
      </div>

      {/* ---- centre ---------------------------------------------------- */}
      <div role="group" className="flex min-w-0 flex-1 items-center justify-center gap-3">
        <NavArrow direction="prev" enabled={canPrev} onClick={onPrev} />

        <div className="h-3 w-full min-w-0 max-w-[592px]">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-3 w-full overflow-hidden rounded-full bg-b-fg/20"
          >
            <div
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
              className="h-full rounded-full bg-b-ok-progress transition-[width] duration-200"
            />
          </div>
        </div>

        <div className="hidden gap-3 sm:flex">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-3 w-4 rounded-full transition-all duration-200",
                i < segmentsComplete ? "bg-b-ok-progress" : "bg-b-fg/5",
              )}
            />
          ))}
        </div>

        <NavArrow direction="next" enabled={canNext} onClick={onNext} />
      </div>

      {/* ---- right ----------------------------------------------------- */}
      {hasRight ? (
        <div className="flex h-8 items-center justify-center">
          {showReference ? (
            <>
              <div
                className={cn(
                  "flex items-center justify-end",
                  xp > 0 ? "text-b-green" : "text-b-fg/20",
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
                  streak > 0 ? "text-b-green-2" : "text-b-fg/20",
                )}
              >
                <StreakBoltIcon completed={streak > 0} />
              </button>
            </>
          ) : (
            readout
          )}
        </div>
      ) : null}
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
    <div className="hidden h-[52px] w-[52px] shrink-0 sm:block">
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
            enabled ? "cursor-pointer text-b-fg/60 hover:text-b-fg" : "cursor-default text-b-fg/20",
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
