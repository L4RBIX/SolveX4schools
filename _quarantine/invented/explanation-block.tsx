"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { EASE_OUT_QUINT } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { DiagramKind } from "./lesson-data";

const EDGE = "#4C4C4C";
const BLUE = "#4A5CD6";

/* -------------------------------------------------------------------------- */
/*  Panel                                                                      */
/* -------------------------------------------------------------------------- */

/** #141414, radius 20, 2px rgba(255,255,255,.2) border, hard 4px edge. */
export function DiagramPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-[20px] border-2 border-b-dim-2 bg-b-dark p-5 shadow-[0_4px_0_0_rgba(255,255,255,0.2)] sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Diagram: halves                                                            */
/* -------------------------------------------------------------------------- */

function HalvesDiagram({ uid, reduce }: { uid: string; reduce: boolean }) {
  const clip = `${uid}-halves`;

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label="A circle split down the middle into two equal halves, the left half filled."
      className="mx-auto block h-auto w-full max-w-[260px]"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="120" cy="120" r="88" />
        </clipPath>
      </defs>

      <motion.rect
        x="32"
        y="32"
        width="88"
        height="176"
        fill={BLUE}
        clipPath={`url(#${clip})`}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.42, duration: 0.34, ease: EASE_OUT_QUINT }}
      />

      <circle cx="120" cy="120" r="88" fill="none" stroke={EDGE} strokeWidth="2" />

      <motion.line
        x1="120"
        y1="32"
        x2="120"
        y2="208"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.62, ease: EASE_OUT_QUINT }}
      />

      <text
        x="76"
        y="127"
        textAnchor="middle"
        className="fill-white text-[20px] font-medium"
      >
        1/2
      </text>
      <text
        x="164"
        y="127"
        textAnchor="middle"
        className="fill-white/40 text-[20px] font-medium"
      >
        1/2
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Diagram: unequal -> corrected                                              */
/* -------------------------------------------------------------------------- */

const UNEQUAL_DURATION = 0.95;
const UNEQUAL_START_W = 95;
const UNEQUAL_END_W = 140;

function UnequalDiagram({ uid, reduce }: { uid: string; reduce: boolean }) {
  const clip = `${uid}-unequal`;

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <svg
        viewBox="0 0 320 200"
        role="img"
        aria-label="A rectangle split into two unequal parts, marked wrong, then the split slides to the middle and is marked correct."
        className="block h-auto w-full"
      >
        <defs>
          <clipPath id={clip}>
            <rect x="20" y="50" width="280" height="100" rx="12" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clip})`}>
          <motion.rect
            x="20"
            y="50"
            height="100"
            fill={BLUE}
            initial={false}
            animate={{
              width: reduce
                ? UNEQUAL_END_W
                : [UNEQUAL_START_W, UNEQUAL_START_W, UNEQUAL_END_W],
            }}
            transition={{
              duration: reduce ? 0 : UNEQUAL_DURATION,
              ease: EASE_OUT_QUINT,
              times: [0, 0.55, 1],
            }}
          />
        </g>

        <rect
          x="20"
          y="50"
          width="280"
          height="100"
          rx="12"
          fill="none"
          stroke={EDGE}
          strokeWidth="2"
        />

        <motion.line
          x1="115"
          y1="50"
          x2="115"
          y2="150"
          stroke="#FFFFFF"
          strokeWidth="2"
          initial={false}
          animate={{ x: reduce ? 45 : [0, 0, 45] }}
          transition={{
            duration: reduce ? 0 : UNEQUAL_DURATION,
            ease: EASE_OUT_QUINT,
            times: [0, 0.55, 1],
          }}
        />
      </svg>

      <div className="pointer-events-none absolute left-[91%] top-[25%] -translate-x-1/2 -translate-y-1/2 [perspective:600px]">
        <motion.div
          className="relative h-10 w-10 [transform-style:preserve-3d]"
          initial={reduce ? false : { opacity: 0, y: -8, rotateY: 0 }}
          animate={
            reduce
              ? { opacity: 1, y: 0, rotateY: 180 }
              : { opacity: [0, 1, 1, 1], y: [-8, 0, 0, 0], rotateY: [0, 0, 0, 180] }
          }
          transition={{
            duration: reduce ? 0 : UNEQUAL_DURATION,
            ease: EASE_OUT_QUINT,
            times: [0, 0.26, 0.6, 1],
          }}
        >
          <span className="absolute inset-0 grid place-items-center rounded-full bg-[#E05A4B] [backface-visibility:hidden]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"
                stroke="#141414"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="absolute inset-0 grid place-items-center rounded-full bg-b-green-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M5 12.5 10 17.5 19 7"
                stroke="#141414"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </motion.div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Diagram: quarters                                                          */
/* -------------------------------------------------------------------------- */

const QUARTERS_DURATION = 0.9;

function QuartersDiagram({ uid, reduce }: { uid: string; reduce: boolean }) {
  const clip = `${uid}-quarters`;
  const steps = ["1", "1/2", "1/4"];

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <svg
        viewBox="0 0 240 240"
        role="img"
        aria-label="A square subdivided once into halves and again into quarters, with one quarter filled."
        className="block h-auto w-full"
      >
        <defs>
          <clipPath id={clip}>
            <rect x="20" y="20" width="200" height="200" rx="12" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clip})`}>
          <motion.rect
            x="20"
            y="20"
            fill={BLUE}
            initial={false}
            animate={{
              width: reduce ? 100 : [200, 200, 100, 100],
              height: reduce ? 100 : [200, 200, 200, 100],
            }}
            transition={{
              width: {
                duration: reduce ? 0 : QUARTERS_DURATION,
                ease: EASE_OUT_QUINT,
                times: [0, 0.33, 0.5, 1],
              },
              height: {
                duration: reduce ? 0 : QUARTERS_DURATION,
                ease: EASE_OUT_QUINT,
                times: [0, 0.7, 0.78, 1],
              },
            }}
          />
        </g>

        <rect
          x="20"
          y="20"
          width="200"
          height="200"
          rx="12"
          fill="none"
          stroke={EDGE}
          strokeWidth="2"
        />

        <motion.line
          x1="120"
          y1="20"
          x2="120"
          y2="220"
          stroke="#FFFFFF"
          strokeWidth="2"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.05, duration: 0.35, ease: EASE_OUT_QUINT }}
        />
        <motion.line
          x1="20"
          y1="120"
          x2="220"
          y2="120"
          stroke="#FFFFFF"
          strokeWidth="2"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.45, duration: 0.35, ease: EASE_OUT_QUINT }}
        />
      </svg>

      <div className="mt-4 flex items-center justify-center gap-3">
        {steps.map((step, index) => (
          <span key={step} className="flex items-center gap-3">
            {index > 0 ? <span className="text-b-dim">&rarr;</span> : null}
            <motion.span
              className="text-[16px] font-medium text-white"
              initial={reduce ? false : { opacity: 0.25 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: reduce ? 0 : index * 0.4,
                duration: 0.3,
                ease: EASE_OUT_QUINT,
              }}
            >
              {step}
            </motion.span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public diagram entry points                                                */
/* -------------------------------------------------------------------------- */

export interface FractionDiagramProps {
  kind: DiagramKind;
  className?: string;
}

/** The three fraction figures, each animating once on mount. */
export function FractionDiagram({ kind, className }: FractionDiagramProps) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div className={cn("w-full", className)}>
      {kind === "halves" ? <HalvesDiagram uid={uid} reduce={reduce} /> : null}
      {kind === "unequal" ? <UnequalDiagram uid={uid} reduce={reduce} /> : null}
      {kind === "quarters" ? <QuartersDiagram uid={uid} reduce={reduce} /> : null}
    </div>
  );
}

export interface PartsBarProps {
  /** How many equal parts the bar is divided into. */
  parts: number;
  /** How many of those parts are filled, counted from the left. */
  shaded: number;
  caption?: string;
  className?: string;
}

/** A whole drawn as a bar of `parts` equal cells, carrying the hard edge. */
export function PartsBar({ parts, shaded, caption, className }: PartsBarProps) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        className="flex h-[72px] w-full overflow-hidden rounded-[16px] border-2 border-b-edge shadow-[0_4px_0_0_#4C4C4C]"
        role="img"
        aria-label={
          parts === 1
            ? "One whole, undivided."
            : `A bar of ${parts} equal parts, ${shaded} of them shaded.`
        }
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT_QUINT }}
      >
        {Array.from({ length: parts }, (_, index) => (
          <div
            key={index}
            className={cn(
              "flex-1",
              index < shaded ? "bg-b-blue" : "bg-transparent",
              index > 0 && "border-l-2 border-b-edge",
            )}
          />
        ))}
      </motion.div>
      {caption ? (
        <p className="mt-3 text-center text-[14px] leading-5 text-b-dim">{caption}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Explanation screen                                                         */
/* -------------------------------------------------------------------------- */

export interface ExplanationBlockProps {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  diagram: DiagramKind;
  className?: string;
}

/** Eyebrow, heading, diagram panel, one or two short paragraphs. */
export function ExplanationBlock({
  eyebrow,
  title,
  paragraphs,
  diagram,
  className,
}: ExplanationBlockProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      {eyebrow ? <p className="b-eyebrow text-b-dim">{eyebrow}</p> : null}
      <h2 className="mt-3 text-[24px] font-bold leading-[1.15] text-white sm:text-[30px]">
        {title}
      </h2>

      <DiagramPanel className="mt-7">
        <FractionDiagram kind={diagram} />
      </DiagramPanel>

      <div className="mt-6 max-w-[560px] space-y-3">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-[16px] leading-6 text-b-dim">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
