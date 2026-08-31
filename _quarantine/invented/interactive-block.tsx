"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** The divider moves and reads out in sixteenths of the whole. */
const UNITS = 16;
const MIN_UNIT = 1;
const MAX_UNIT = UNITS - 1;
const MIN_FRACTION = MIN_UNIT / UNITS;
const MAX_FRACTION = MAX_UNIT / UNITS;
const START_UNIT = 5;
/** How close to halfway counts as equal. */
const EQUAL_TOLERANCE = 0.02;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

function asFraction(units: number): string {
  const divisor = greatestCommonDivisor(units, UNITS);
  return `${units / divisor}/${UNITS / divisor}`;
}

/**
 * Nearest sixteenth, except that it never claims the parts are equal before
 * the bar has actually snapped — otherwise there is a band where the readout
 * says 1/2 and 1/2 while the divider is still off-centre.
 */
function readoutUnit(fraction: number, solved: boolean): number {
  if (solved) return UNITS / 2;
  const nearest = clamp(Math.round(fraction * UNITS), MIN_UNIT, MAX_UNIT);
  if (nearest === UNITS / 2) return fraction < 0.5 ? nearest - 1 : nearest + 1;
  return nearest;
}

export interface InteractiveBlockProps {
  eyebrow?: string;
  title: string;
  hint?: string;
  /** Owned by the lesson so the answer survives leaving and re-entering. */
  solved: boolean;
  onSolved: () => void;
  className?: string;
}

/**
 * One whole drawn as a bar with a divider the learner moves. Snaps, flashes
 * green and locks once both parts are the same size.
 */
export function InteractiveBlock({
  eyebrow,
  title,
  hint = "Drag the divider until both parts are equal.",
  solved,
  onSolved,
  className,
}: InteractiveBlockProps) {
  const reduce = useReducedMotion() ?? false;
  const helpId = useId();

  const trackRef = useRef<HTMLDivElement>(null);
  const fractionRef = useRef(solved ? 0.5 : START_UNIT / UNITS);
  const placedRef = useRef(false);

  const [width, setWidth] = useState(0);
  const [unit, setUnit] = useState(() =>
    solved ? UNITS / 2 : readoutUnit(START_UNIT / UNITS, false),
  );

  const x = useMotionValue(0);
  const leftWidth = useTransform(x, (value) => `${Math.max(value, 0)}px`);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;

    const measure = () => setWidth(node.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (width <= 0) return;
    if (solved) {
      fractionRef.current = 0.5;
    }
    const target = fractionRef.current * width;

    if (!placedRef.current || reduce) {
      placedRef.current = true;
      x.set(target);
      return;
    }

    const controls = animate(x, target, { duration: 0.24, ease: EASE_OUT_QUINT });
    return () => controls.stop();
  }, [width, solved, reduce, x]);

  const settleAtHalf = () => {
    fractionRef.current = 0.5;
    setUnit(UNITS / 2);
    if (width > 0) {
      if (reduce) {
        x.set(width / 2);
      } else {
        animate(x, width / 2, { duration: 0.24, ease: EASE_OUT_QUINT });
      }
    }
    onSolved();
  };

  const handleDrag = () => {
    if (solved || width <= 0) return;
    const raw = clamp(x.get() / width, MIN_FRACTION, MAX_FRACTION);
    fractionRef.current = raw;

    if (Math.abs(raw - 0.5) <= EQUAL_TOLERANCE) {
      settleAtHalf();
      return;
    }
    setUnit(readoutUnit(raw, false));
  };

  const moveByUnits = (delta: number) => {
    if (solved || width <= 0) return;
    const current = clamp(Math.round(fractionRef.current * UNITS), MIN_UNIT, MAX_UNIT);
    const next = clamp(current + delta, MIN_UNIT, MAX_UNIT);
    const fraction = next / UNITS;
    fractionRef.current = fraction;

    if (reduce) {
      x.set(fraction * width);
    } else {
      animate(x, fraction * width, { duration: 0.18, ease: EASE_OUT_QUINT });
    }

    if (Math.abs(fraction - 0.5) <= EQUAL_TOLERANCE) {
      settleAtHalf();
      return;
    }
    setUnit(readoutUnit(fraction, false));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (solved) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      moveByUnits(-1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      moveByUnits(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveByUnits(MIN_UNIT - Math.round(fractionRef.current * UNITS));
    } else if (event.key === "End") {
      event.preventDefault();
      moveByUnits(MAX_UNIT - Math.round(fractionRef.current * UNITS));
    }
  };

  const leftLabel = asFraction(unit);
  const rightLabel = asFraction(UNITS - unit);

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      {eyebrow ? <p className="b-eyebrow text-b-dim">{eyebrow}</p> : null}
      <h2 className="mt-3 text-[24px] font-bold leading-[1.15] text-white sm:text-[30px]">
        {title}
      </h2>

      <motion.div
        className="mt-8 w-full"
        animate={reduce ? undefined : { scale: solved ? [1, 1.02, 1] : 1 }}
        transition={{ duration: 0.36, ease: EASE_OUT_QUINT }}
      >
        <div
          ref={trackRef}
          className="relative h-[88px] w-full overflow-visible rounded-[16px] border-2 border-b-edge shadow-[0_4px_0_0_#4C4C4C]"
        >
          <div className="absolute inset-0 overflow-hidden rounded-[14px]">
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{ width: leftWidth }}
              animate={{
                backgroundColor: solved
                  ? ["#5ED981", "#9CEEB6", "#5ED981"]
                  : "#4A5CD6",
              }}
              transition={{ duration: reduce ? 0 : 0.45, ease: EASE_OUT_QUINT }}
            />
            <motion.div
              className="absolute inset-y-0 right-0"
              style={{ left: leftWidth }}
              animate={{
                backgroundColor: solved
                  ? ["rgba(94,217,129,0.3)", "rgba(156,238,182,0.5)", "rgba(94,217,129,0.3)"]
                  : "rgba(255,255,255,0.06)",
              }}
              transition={{ duration: reduce ? 0 : 0.45, ease: EASE_OUT_QUINT }}
            />
          </div>

          <motion.div
            role="slider"
            tabIndex={0}
            aria-label="Divider position"
            aria-orientation="horizontal"
            aria-valuemin={MIN_UNIT}
            aria-valuemax={MAX_UNIT}
            aria-valuenow={unit}
            aria-valuetext={`${leftLabel} and ${rightLabel}`}
            aria-disabled={solved}
            aria-describedby={helpId}
            onKeyDown={handleKeyDown}
            drag={solved ? false : "x"}
            dragConstraints={{
              left: MIN_FRACTION * width,
              right: MAX_FRACTION * width,
            }}
            dragElastic={0}
            dragMomentum={false}
            onDrag={handleDrag}
            onDragEnd={handleDrag}
            style={{ x }}
            className={cn(
              "absolute inset-y-0 left-0 -ml-[22px] flex w-11 items-center justify-center",
              solved ? "cursor-default" : "cursor-ew-resize",
            )}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-[-8px] left-1/2 w-1 -translate-x-1/2 rounded-full bg-white"
            />
            <span
              aria-hidden="true"
              className="relative flex h-7 w-7 items-center justify-center gap-[3px] rounded-full border-2 border-white bg-b-panel"
            >
              <span className="h-2.5 w-[2px] rounded-full bg-white/50" />
              <span className="h-2.5 w-[2px] rounded-full bg-white/50" />
            </span>
          </motion.div>
        </div>
      </motion.div>

      <div
        aria-live="polite"
        className="mt-5 flex w-full items-center justify-between gap-3"
      >
        <span
          className={cn(
            "inline-flex h-10 items-center rounded-full border-2 px-4 text-[16px] font-medium",
            solved ? "border-b-green-2 text-b-green-2" : "border-b-blue text-white",
          )}
        >
          {leftLabel}
        </span>
        <span className="text-[14px] leading-5 text-b-dim">and</span>
        <span
          className={cn(
            "inline-flex h-10 items-center rounded-full border-2 px-4 text-[16px] font-medium",
            solved ? "border-b-green-2 text-b-green-2" : "border-b-dim-2 text-b-dim",
          )}
        >
          {rightLabel}
        </span>
      </div>

      <p className="mt-5 max-w-[420px] text-[16px] leading-6 text-b-dim">{hint}</p>
      <p id={helpId} className="sr-only">
        Focus the divider and use the left and right arrow keys to move it one
        sixteenth at a time.
      </p>
    </div>
  );
}
