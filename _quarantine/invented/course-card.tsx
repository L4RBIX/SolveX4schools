"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import type { Course } from "./lxp-data";

/**
 * Elice course card: 12px radius, 1px #E5E8EB hairline, white body, an
 * illustrated 120px gradient banner on top. Soft blurred shadow on hover —
 * never the hard offset edge the brilliant.org clone uses.
 */

export interface CourseCardProps {
  course: Course;
  /** Position in the grid, used for the 60ms entrance stagger. */
  index?: number;
  className?: string;
  /** AnimatePresence hands a ref to its children — pass it through. */
  ref?: React.Ref<HTMLElement>;
}

/** Yellow-green banners need dark type; everything else takes white. */
function bannerInk(hue: number): string {
  return hue >= 40 && hue <= 80 ? "#191F28" : "#FFFFFF";
}

function bannerGradient(hue: number): string {
  return `linear-gradient(135deg, hsl(${hue} 74% 62%) 0%, hsl(${hue + 22} 68% 45%) 100%)`;
}

export function CourseCard({ course, index = 0, className, ref }: CourseCardProps) {
  const reduce = useReducedMotion();
  const ink = bannerInk(course.hue);
  const onLight = ink !== "#FFFFFF";
  const label =
    course.progress >= 100 ? "Review" : course.progress <= 0 ? "Start" : "Continue";

  return (
    <motion.article
      ref={ref}
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reduce
          ? undefined
          : { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } }
      }
      transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.06, ease: [0.23, 1, 0.32, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-e-line bg-e-white",
        "shadow-[0_1px_2px_rgba(25,31,40,0.04)] transition-shadow duration-200",
        "hover:shadow-[0_12px_32px_rgba(25,31,40,0.10)]",
        className,
      )}
    >
      {/* Banner */}
      <div
        className="relative h-[120px] shrink-0 overflow-hidden"
        style={{ backgroundImage: bannerGradient(course.hue) }}
      >
        <svg
          viewBox="0 0 320 120"
          className="absolute inset-0 size-full"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <g fill="none" stroke={ink} strokeOpacity={onLight ? 0.18 : 0.28}>
            <circle cx="272" cy="26" r="46" />
            <circle cx="272" cy="26" r="30" />
            <circle cx="272" cy="26" r="14" />
          </g>
          <rect
            x="196"
            y="72"
            width="58"
            height="58"
            rx="16"
            fill={ink}
            fillOpacity={onLight ? 0.08 : 0.14}
            transform="rotate(-18 225 101)"
          />
          <path
            d="M-10 104 L64 62 L124 88 L200 34 L330 82"
            fill="none"
            stroke={ink}
            strokeOpacity={onLight ? 0.16 : 0.22}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <h3
          className="absolute top-4 left-4 max-w-[190px] text-[15px] leading-[1.35] font-bold"
          style={{ color: ink }}
        >
          {course.title}
        </h3>

        <ul className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
          {course.chips.map((chip) => (
            <li
              key={chip}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur-[2px]",
                onLight ? "bg-black/10" : "bg-white/22",
              )}
              style={{ color: ink }}
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[13px] text-e-faint">{course.category}</p>

        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-e-grey-2"
          role="progressbar"
          aria-valuenow={course.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${course.title} progress`}
        >
          <motion.div
            className="h-full rounded-full bg-e-violet"
            initial={reduce ? false : { width: 0 }}
            whileInView={{ width: `${course.progress}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : 0.1 }}
            style={reduce ? { width: `${course.progress}%` } : undefined}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[13px]">
          <span className="text-e-muted">
            {course.lessonsDone} / {course.lessonsTotal} lessons
          </span>
          <span className="font-semibold text-e-ink">{course.progress}%</span>
        </div>

        <p className="mt-3 line-clamp-2 text-[13px] leading-[1.5] text-e-muted">
          {course.progress >= 100 ? "Completed" : "Next"}
          <span className="text-e-faint"> · </span>
          {course.nextLesson}
        </p>

        <button
          type="button"
          className={cn(
            "mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-e-black px-5",
            "text-[15px] font-semibold text-e-white transition-colors duration-200 hover:bg-e-dark",
          )}
        >
          {label}
          <span className="sr-only"> {course.title}</span>
        </button>
      </div>
    </motion.article>
  );
}
