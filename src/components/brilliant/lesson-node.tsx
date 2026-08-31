"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";

import type { LessonNodeData, NodeKind } from "@/components/brilliant/courses-data";
import { enter } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A single stop on the course map: a 3D "coin" token drawn entirely in SVG
 * (lighter top face, darker rim, soft cast ellipse) with its label to the
 * right, and an inline detail card that expands directly beneath it.
 *
 * The card is not a modal — the reference pushes the rest of the column down,
 * so the whole thing animates on height with the site's quint easing.
 */

interface DiscPalette {
  faceFrom: string;
  faceTo: string;
  rim: string;
  inner: string;
}

const REACHABLE: DiscPalette = {
  faceFrom: "#FFFFFF",
  faceTo: "#B7BDC9",
  rim: "#787F8D",
  inner: "#5F6674",
};

const LOCKED: DiscPalette = {
  faceFrom: "#8E8E8E",
  faceTo: "#5A5A5A",
  rim: "#3C3C3C",
  inner: "#2E2E2E",
};

const CENTER = 48;
const FACE_Y = 44;
const RIM_Y = 52;
const RADIUS = 31;

function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
}

/** Scalloped outline used by the `Level check` token instead of a plain disc. */
function rosettePath(cx: number, cy: number, r: number, lobes = 12): string {
  const valley = r * 0.79;
  let d = "";
  for (let i = 0; i < lobes; i += 1) {
    const a0 = ((i + 0) / lobes) * Math.PI * 2;
    const aMid = ((i + 0.5) / lobes) * Math.PI * 2;
    const a1 = ((i + 1) / lobes) * Math.PI * 2;
    const x0 = (cx + Math.cos(a0) * valley).toFixed(2);
    const y0 = (cy + Math.sin(a0) * valley).toFixed(2);
    const xm = (cx + Math.cos(aMid) * r).toFixed(2);
    const ym = (cy + Math.sin(aMid) * r).toFixed(2);
    const x1 = (cx + Math.cos(a1) * valley).toFixed(2);
    const y1 = (cy + Math.sin(a1) * valley).toFixed(2);
    if (i === 0) d += `M ${x0} ${y0}`;
    d += ` Q ${xm} ${ym} ${x1} ${y1}`;
  }
  return `${d} Z`;
}

function tokenPath(kind: NodeKind, cy: number, r: number): string {
  return kind === "check"
    ? rosettePath(CENTER, cy, r)
    : circlePath(CENTER, cy, r);
}

export interface LessonNodeProps {
  node: LessonNodeData;
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export function LessonNode({ node, open, onToggle, className }: LessonNodeProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const faceId = `disc-face-${uid}`;
  const castId = `disc-cast-${uid}`;
  const panelId = `lesson-panel-${uid}`;

  const locked = node.status === "locked";
  const current = node.status === "current";
  const palette = locked ? LOCKED : REACHABLE;

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <button
        type="button"
        disabled={locked}
        aria-disabled={locked}
        aria-expanded={locked ? undefined : open}
        aria-controls={locked ? undefined : panelId}
        title={locked ? node.unlockHint : undefined}
        onClick={locked ? undefined : onToggle}
        className="group flex items-center gap-5 text-left outline-offset-4 disabled:cursor-not-allowed"
      >
        <svg
          viewBox="0 0 96 96"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className={cn(
            "size-24 shrink-0 transition-transform duration-150 ease-out",
            !locked &&
              "group-hover:-translate-y-[2px] group-active:translate-y-[2px]",
          )}
        >
          <defs>
            <linearGradient id={faceId} x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0" stopColor={palette.faceFrom} />
              <stop offset="1" stopColor={palette.faceTo} />
            </linearGradient>
            <radialGradient id={castId}>
              <stop offset="0" stopColor="#000000" stopOpacity="0.6" />
              <stop offset="1" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx={CENTER} cy="80" rx="30" ry="9" fill={`url(#${castId})`} />

          {current ? (
            <>
              <circle
                cx={CENTER}
                cy={FACE_Y}
                r="42"
                fill="none"
                stroke="#4A5CD6"
                strokeWidth="2"
                opacity="0.3"
              />
              <circle
                cx={CENTER}
                cy={FACE_Y}
                r="36"
                fill="none"
                stroke="#4A5CD6"
                strokeWidth="3"
              />
            </>
          ) : null}

          <g opacity={locked ? 0.4 : 1}>
            <path d={tokenPath(node.kind, RIM_Y, RADIUS)} fill={palette.rim} />
            <path
              d={tokenPath(node.kind, FACE_Y, RADIUS)}
              fill={`url(#${faceId})`}
            />
            <path
              d={tokenPath(node.kind, FACE_Y, RADIUS - 8)}
              fill="none"
              stroke={palette.inner}
              strokeWidth="2"
              strokeOpacity="0.4"
            />
          </g>
        </svg>

        <span
          className={cn(
            "max-w-[200px] text-[16px] leading-6 font-normal sm:max-w-[240px]",
            locked ? "text-b-dim" : "text-b-fg",
          )}
        >
          {node.title}
        </span>
      </button>

      <div id={locked ? undefined : panelId} className="w-full">
        <AnimatePresence initial={false}>
          {open && !locked ? (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ ...enter, duration: 0.26 }}
              className="overflow-hidden"
            >
              <div className="mt-5 mb-1.5 w-[468px] max-w-full rounded-[16px] border-2 border-b-fg/20 bg-b-dark p-6 shadow-[0_4px_0_0_rgba(255,255,255,0.2)]">
                <p className="text-center text-[18px] leading-6 font-bold text-b-fg">
                  {node.title}
                </p>
                <button
                  type="button"
                  className="b-press mt-5 h-12 w-full rounded-[56px] bg-b-blue text-[16px] font-normal text-b-fg shadow-[0_4px_0_0_#3860be] hover:brightness-110 active:translate-y-[3px] active:shadow-[0_1px_0_0_#3860be]"
                >
                  Start
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
