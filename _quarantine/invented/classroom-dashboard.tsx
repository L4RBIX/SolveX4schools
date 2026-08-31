"use client";

import {
  BookOpen,
  ClipboardList,
  ListChecks,
  Play,
  TrendingUp,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CourseList } from "./course-list";
import {
  CURRENT_COURSE,
  DEADLINES,
  LECTURE,
  STAT_TILES,
  STUDENT,
  TODAY_LABEL,
  WEEKLY_ACTIVITY,
  WEEKLY_TOTAL_MINUTES,
  type StatIcon,
  type StatTile,
  type Urgency,
} from "./lxp-data";

/**
 * Student home. Lives inside EliceAppShell, which owns the sidebar, the 64px
 * top bar and the #F5F6F8 canvas — this file only fills the main column.
 */

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

const STAT_ICON: Record<StatIcon, typeof BookOpen> = {
  courses: BookOpen,
  lessons: ListChecks,
  assignments: ClipboardList,
  score: TrendingUp,
};

const URGENCY_BORDER: Record<Urgency, string> = {
  today: "border-l-[#F5A524]",
  soon: "border-l-e-violet",
  later: "border-l-e-line",
};

const URGENCY_TEXT: Record<Urgency, string> = {
  today: "text-[#F5A524]",
  soon: "text-e-violet",
  later: "text-e-faint",
};

export function ClassroomDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <WelcomeRow />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_TILES.map((tile, index) => (
          <StatCard key={tile.id} tile={tile} index={index} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8">
          <Reveal>
            <CourseList id="courses" />
          </Reveal>
          <Reveal>
            <ContinueLearning />
          </Reveal>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Reveal>
            <WeeklyActivity />
          </Reveal>
          <Reveal>
            <UpcomingDeadlines />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function WelcomeRow() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl leading-tight font-bold text-e-ink">
          Good morning, {STUDENT.firstName}
        </h2>
        <p className="mt-1 text-[15px] text-e-muted">
          {TODAY_LABEL} · {STUDENT.track}
        </p>
      </div>

      <button
        type="button"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-e-black px-6 text-[15px] font-semibold text-e-white transition-colors duration-200 hover:bg-e-dark"
      >
        <Play className="size-4 fill-current" aria-hidden="true" />
        Resume last lesson
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StatCard({ tile, index }: { tile: StatTile; index: number }) {
  const Icon = STAT_ICON[tile.icon];
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.06, ease: EASE_OUT_QUINT }}
      className="rounded-xl border border-e-line bg-e-white p-5"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-e-violet-soft text-e-violet">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <p className="mt-3 text-[13px] text-e-muted">{tile.label}</p>
      <p className="mt-1 text-[28px] leading-none font-bold text-e-ink">
        <CountUp value={tile.value} suffix={tile.suffix} />
      </p>
    </motion.div>
  );
}

/** Counts 0 → value over ~800ms the first time it scrolls into view. */
function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let started = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const step = (now: number) => {
          if (!started) started = now;
          const progress = Math.min((now - started) / 800, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reduce, value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {reduce ? value : display}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ContinueLearning() {
  const reduce = useReducedMotion();
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-2xl leading-tight font-bold text-e-ink">
        Continue learning
      </h2>

      <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-e-line bg-e-white p-5 sm:flex-row sm:items-center">
        <div
          className="relative h-[104px] w-full shrink-0 overflow-hidden rounded-xl sm:w-[168px]"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(${CURRENT_COURSE.hue} 74% 62%) 0%, hsl(${CURRENT_COURSE.hue + 22} 68% 45%) 100%)`,
          }}
        >
          <svg viewBox="0 0 168 104" className="absolute inset-0 size-full" aria-hidden="true">
            <g fill="none" stroke="#FFFFFF" strokeOpacity="0.3">
              <circle cx="140" cy="22" r="34" />
              <circle cx="140" cy="22" r="20" />
            </g>
          </svg>
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-11 place-items-center rounded-full bg-white/25 backdrop-blur-[2px]">
              <Play className="size-4 fill-white text-white" aria-hidden="true" />
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-e-faint">{LECTURE.courseTitle}</p>
          <h3 className="mt-1 text-[17px] leading-snug font-bold text-e-ink">
            {LECTURE.lessonTitle}
          </h3>

          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-e-grey-2"
            role="progressbar"
            aria-valuenow={LECTURE.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          >
            <motion.div
              className="h-full rounded-full bg-e-violet"
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${LECTURE.progress}%` }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
              style={reduce ? { width: `${LECTURE.progress}%` } : undefined}
            />
          </div>

          <p className="mt-2 text-[13px] text-e-muted">
            Lesson {LECTURE.lessonNumber} of {LECTURE.lessonTotal} · {LECTURE.progress}% complete
          </p>
        </div>

        <button
          type="button"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-e-violet px-6 text-[15px] font-semibold text-e-white transition-colors duration-200 hover:bg-e-violet-2"
        >
          Continue
        </button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function WeeklyActivity() {
  const reduce = useReducedMotion();
  const titleId = useId();
  const peak = Math.max(...WEEKLY_ACTIVITY.map((day) => day.minutes), 1);
  const today = WEEKLY_ACTIVITY.find((day) => day.isToday);

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-xl border border-e-line bg-e-white p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titleId} className="text-[17px] font-bold text-e-ink">
          This week
        </h2>
        <span className="text-[13px] text-e-muted">
          {Math.floor(WEEKLY_TOTAL_MINUTES / 60)}h {WEEKLY_TOTAL_MINUTES % 60}m total
        </span>
      </div>

      <div className="mt-5 flex h-[132px] items-end gap-2" aria-hidden="true">
        {WEEKLY_ACTIVITY.map((day, index) => (
          <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-[104px] w-full items-end">
              <motion.div
                className={cn(
                  "w-full rounded-md",
                  day.isToday ? "bg-e-violet" : "bg-e-violet-soft",
                )}
                initial={reduce ? false : { height: "0%" }}
                whileInView={{
                  height: `${Math.max((day.minutes / peak) * 100, 4)}%`,
                }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.6,
                  delay: reduce ? 0 : index * 0.05,
                  ease: EASE_OUT_QUINT,
                }}
                style={
                  reduce
                    ? { height: `${Math.max((day.minutes / peak) * 100, 4)}%` }
                    : undefined
                }
              />
            </div>
            <span
              className={cn(
                "text-[12px] font-semibold",
                day.isToday ? "text-e-violet" : "text-e-faint",
              )}
            >
              {day.initial}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-e-line pt-4 text-[13px] text-e-muted">
        Today
        <span className="ml-2 font-semibold text-e-ink">{today?.minutes ?? 0} min</span>
      </p>

      <table className="sr-only">
        <caption>Study minutes per day this week</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Minutes</th>
          </tr>
        </thead>
        <tbody>
          {WEEKLY_ACTIVITY.map((day) => (
            <tr key={day.day}>
              <th scope="row">{day.day}</th>
              <td>{day.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function UpcomingDeadlines() {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-xl border border-e-line bg-e-white p-5"
    >
      <h2 id={titleId} className="text-[17px] font-bold text-e-ink">
        Upcoming deadlines
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {DEADLINES.map((deadline) => (
          <li key={deadline.id}>
            <button
              type="button"
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-r-lg border-l-2 bg-e-grey px-3 py-3 text-left transition-colors duration-200 hover:bg-e-grey-2",
                URGENCY_BORDER[deadline.urgency],
              )}
            >
              <span className="text-[14px] leading-snug font-semibold text-e-ink">
                {deadline.title}
              </span>
              <span className="text-[13px] text-e-muted">{deadline.course}</span>
              <span
                className={cn("text-[13px] font-semibold", URGENCY_TEXT[deadline.urgency])}
              >
                {deadline.due}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/** Fade + 20px rise, once, on scroll into view. */
function Reveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: EASE_OUT_QUINT }}
    >
      {children}
    </motion.div>
  );
}
