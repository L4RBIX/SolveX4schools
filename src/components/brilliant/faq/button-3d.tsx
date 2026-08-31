"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Brilliant's `Button3D`, transcribed from `chunks/0krm0d2r20e_j.js`.
 *
 * The face carries a HARD 4px bottom edge (`0 4px 0 0`, no blur) in
 * `green.600 #15b441`, sits at `translateY(-4px)`, and collapses both on
 * `:active`. Hover dims the whole root to `opacity: .85` — the fill never
 * changes colour. The radius is declared elliptically as
 * `calc(56px / var(--button3d-x-scale, 1)) / 56px`; nothing on /faq/ ever sets
 * `--button3d-x-scale`, so at its default of 1 it resolves to a plain 56px
 * (face: 60px) and is written that way here.
 */

const ROOT =
  "group relative inline-flex cursor-pointer rounded-[56px] outline-none " +
  "[-webkit-tap-highlight-color:transparent] hover:opacity-85 " +
  "focus-visible:shadow-[0px_0px_0px_3px_#456dff]";

const FACE =
  "relative inline-flex w-full items-center justify-center gap-2 rounded-[60px] " +
  "bg-b-green px-6 py-[14px] text-[16px] font-medium leading-[1.25] text-white " +
  "[text-shadow:0_0_3px_rgba(0,0,0,0.25)] shadow-[0_4px_0_0_#15b441] " +
  "-translate-y-1 transition-[transform,box-shadow] duration-100 ease-out " +
  "group-active:translate-y-0 group-active:shadow-none";

interface Button3DProps {
  href: string;
  /** The original sets `role="button"` on the hero CTA and `role="link"` on the Upsell CTA. */
  role: "button" | "link";
  label: string;
  /** `shimmer="animated"` — only the hero button has it. */
  shimmer?: boolean;
  className?: string;
  faceClassName?: string;
}

export function Button3D({
  href,
  role,
  label,
  shimmer = false,
  className,
  faceClassName,
}: Button3DProps) {
  return (
    <a
      href={href}
      role={role}
      tabIndex={0}
      data-slot="button3d"
      className={cn(ROOT, className)}
    >
      <span data-slot="button3d-face" className={cn(FACE, faceClassName)}>
        {shimmer ? <Shimmer /> : null}
        <span
          data-slot="button3d-content"
          className="relative z-[1] inline-flex items-center gap-2"
        >
          {label}
        </span>
      </span>
    </a>
  );
}

/**
 * The 6.4s looping sweep. The original is a CSS animation:
 *   0% {opacity:1; left:-100%} 25% {opacity:1; left:100%}
 *   26% {opacity:0} to {opacity:0; left:100%}
 * on `cubic-bezier(.16, 1, 0.7, 1)`, infinite. Reproduced here as a keyframe
 * track so `useReducedMotion` can park it off-stage instead of looping.
 */
function Shimmer() {
  const reduce = useReducedMotion();
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `shimmer-clip-${uid}`;
  const gradAId = `shimmer-grad-a-${uid}`;
  const gradBId = `shimmer-grad-b-${uid}`;

  return (
    <span
      data-slot="shimmer"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-clip rounded-[inherit]"
    >
      <motion.svg
        viewBox="0 0 150 56"
        width="150"
        height="56"
        fill="none"
        className="absolute top-0 z-[100]"
        style={{ left: "-100%" }}
        animate={
          reduce
            ? undefined
            : { left: ["-100%", "100%", "100%", "100%"], opacity: [1, 1, 0, 0] }
        }
        transition={{
          duration: 6.4,
          times: [0, 0.25, 0.26, 1],
          ease: [0.16, 1, 0.7, 1],
          repeat: Infinity,
        }}
      >
        <g clipPath={`url(#${clipId})`}>
          <rect
            opacity="0.4"
            x="75"
            y="-58.6328"
            width="51"
            height="150"
            transform="rotate(30 75 -58.6328)"
            fill={`url(#${gradAId})`}
          />
          <rect
            opacity="0.4"
            x="127.826"
            y="-28.1328"
            width="26"
            height="150"
            transform="rotate(30 127.826 -28.1328)"
            fill={`url(#${gradBId})`}
          />
        </g>
        <defs>
          <linearGradient
            id={gradAId}
            x1="100.5"
            y1="-58.6328"
            x2="100.5"
            y2="91.3672"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.27" stopColor="#F5EFFF" />
            <stop offset="0.71" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id={gradBId}
            x1="140.826"
            y1="-28.1328"
            x2="140.826"
            y2="121.867"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.081302" stopColor="#F5EFFF" />
            <stop offset="0.570844" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect width="150" height="56" fill="white" />
          </clipPath>
        </defs>
      </motion.svg>
    </span>
  );
}
