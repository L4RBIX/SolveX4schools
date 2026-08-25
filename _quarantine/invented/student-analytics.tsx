"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  CARD,
  CLASS_SIZE,
  CLASS_META,
  FLOAT_SHADOW,
  MISTAKES,
  SEMANTIC,
  SKILLS,
  SKILL_THRESHOLD,
  STATUS_COUNTS,
  STATUS_META,
  STATUS_ORDER,
  TREND,
} from "./teacher-data";

/** Fires once, the first time the element crosses into view. */
function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, threshold]);

  return [ref, seen] as const;
}

const EASE = [0.23, 1, 0.32, 1] as const;

export function StudentAnalytics() {
  return (
    <section aria-labelledby="analytics-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="analytics-heading" className="text-2xl leading-tight font-bold text-e-ink">
          Progress analytics
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-e-muted">
          {CLASS_META.unit} · auto-graded submissions across {CLASS_SIZE} students.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusDonut />
        <SkillMastery />
      </div>

      <TrendChart />
      <CommonMistakes />
    </section>
  );
}

/* ---- 1. status donut ----------------------------------------------------- */

const DONUT_SIZE = 176;
const DONUT_RADIUS = 64;
const DONUT_STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

function StatusDonut() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.3);
  const reduceMotion = useReducedMotion();

  const segments = STATUS_ORDER.map((status, index) => {
    const count = STATUS_COUNTS[status];
    const before = STATUS_ORDER.slice(0, index).reduce(
      (sum, earlier) => sum + STATUS_COUNTS[earlier],
      0,
    );
    const fraction = count / CLASS_SIZE;
    const startAngle = -90 + (before / CLASS_SIZE) * 360;
    const length = Math.max(0, fraction * CIRCUMFERENCE - 3);
    return { status, count, fraction, startAngle, length };
  });

  return (
    <div ref={ref} className={cn(CARD, "p-5")}>
      <h3 className="text-[17px] font-bold text-e-ink">Status split</h3>
      <p className="mt-0.5 text-[13px] text-e-muted">Where the class sits today.</p>

      <div className="mt-4 flex flex-col items-center gap-5">
        <div className="relative shrink-0" style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <svg
            viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
            width={DONUT_SIZE}
            height={DONUT_SIZE}
            role="presentation"
            aria-hidden="true"
          >
            <circle
              cx={DONUT_SIZE / 2}
              cy={DONUT_SIZE / 2}
              r={DONUT_RADIUS}
              fill="none"
              stroke="#EEF0F4"
              strokeWidth={DONUT_STROKE}
            />
            {segments.map((segment) => (
              <motion.circle
                key={segment.status}
                cx={DONUT_SIZE / 2}
                cy={DONUT_SIZE / 2}
                r={DONUT_RADIUS}
                fill="none"
                stroke={STATUS_META[segment.status].color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                initial={{ strokeDashoffset: reduceMotion ? 0 : segment.length }}
                animate={{ strokeDashoffset: seen ? 0 : segment.length }}
                transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE }}
                transform={`rotate(${segment.startAngle} ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[2rem] leading-none font-bold text-e-ink tabular-nums">
              {CLASS_SIZE}
            </span>
            <span className="mt-1 text-[13px] text-e-muted">students</span>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-2">
          {segments.map((segment) => {
            const meta = STATUS_META[segment.status];
            return (
              <li
                key={segment.status}
                className="flex items-center gap-2.5 rounded-lg bg-e-grey px-3 py-2"
              >
                <span
                  className={cn("size-2.5 shrink-0 rounded-full", meta.dotClass)}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-e-ink">
                  {meta.label}
                </span>
                <span className="font-mono text-[13px] font-bold text-e-ink tabular-nums">
                  {segment.count}
                </span>
                <span className="w-12 text-right font-mono text-[13px] text-e-muted tabular-nums">
                  {Math.round(segment.fraction * 100)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sr-only">
        <table>
        <caption>Student status split</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Students</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((segment) => (
            <tr key={segment.status}>
              <th scope="row">{STATUS_META[segment.status].label}</th>
              <td>{segment.count}</td>
              <td>{Math.round(segment.fraction * 100)}%</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- 2. skill mastery ---------------------------------------------------- */

const BANDS = [
  { id: "secure", label: "80–100 secure", color: SEMANTIC.good, barClass: "bg-[#0FA968]" },
  { id: "developing", label: "50–79 developing", color: SEMANTIC.brand, barClass: "bg-e-violet" },
  { id: "teach", label: "Below 50 re-teach", color: SEMANTIC.warn, barClass: "bg-[#F5A524]" },
] as const;

function bandFor(mastery: number) {
  if (mastery >= 80) return BANDS[0];
  if (mastery >= 50) return BANDS[1];
  return BANDS[2];
}

function SkillMastery() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.25);
  const reduceMotion = useReducedMotion();

  return (
    <div ref={ref} className={cn(CARD, "p-5")}>
      <h3 className="text-[17px] font-bold text-e-ink">Skill mastery</h3>
      <p className="mt-0.5 text-[13px] text-e-muted">
        Class average per skill. “Behind” counts students under {SKILL_THRESHOLD}%.
      </p>

      <ul className="mt-4 space-y-3">
        {SKILLS.map((skill, index) => {
          const band = bandFor(skill.mastery);
          return (
            <li key={skill.id} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[13px] font-medium text-e-ink sm:w-32">
                {skill.label}
              </span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-e-grey-2">
                <motion.span
                  className={cn("block h-full rounded-full", band.barClass)}
                  initial={{ width: reduceMotion ? `${skill.mastery}%` : 0 }}
                  animate={{ width: seen ? `${skill.mastery}%` : 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.7,
                    delay: reduceMotion ? 0 : index * 0.06,
                    ease: EASE,
                  }}
                />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-[13px] font-bold text-e-ink tabular-nums">
                {skill.mastery}%
              </span>
              <span className="w-[74px] shrink-0 rounded-full bg-e-grey-2 px-2 py-0.5 text-center font-mono text-[11px] font-semibold text-e-muted tabular-nums">
                {skill.behind} behind
              </span>
            </li>
          );
        })}
      </ul>

      <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-e-line pt-3">
        {BANDS.map((band) => (
          <li key={band.id} className="flex items-center gap-1.5 text-[13px] text-e-muted">
            <span
              className={cn("size-2 rounded-full", band.barClass)}
              aria-hidden="true"
            />
            {band.label}
          </li>
        ))}
      </ul>

      <div className="sr-only">
        <table>
        <caption>Class-average skill mastery</caption>
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Class average</th>
            <th scope="col">Students behind</th>
          </tr>
        </thead>
        <tbody>
          {SKILLS.map((skill) => (
            <tr key={skill.id}>
              <th scope="row">{skill.label}</th>
              <td>{skill.mastery}%</td>
              <td>{skill.behind}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- 3. class average trend ---------------------------------------------- */

const VB_WIDTH = 560;
const VB_HEIGHT = 220;
const PAD = { top: 12, right: 16, bottom: 30, left: 36 };
const TICKS = [0, 25, 50, 75, 100];

function TrendChart() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.25);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  const innerWidth = VB_WIDTH - PAD.left - PAD.right;
  const innerHeight = VB_HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (index * innerWidth) / (TREND.length - 1);
  const y = (value: number) => PAD.top + (1 - value / 100) * innerHeight;

  const line = TREND.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.average)}`).join(" ");
  const area = `${line} L ${x(TREND.length - 1)} ${PAD.top + innerHeight} L ${x(0)} ${PAD.top + innerHeight} Z`;

  const first = TREND[0].average;
  const last = TREND[TREND.length - 1].average;
  const delta = last - first;

  return (
    <div ref={ref} className={cn(CARD, "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-bold text-e-ink">Class average trend</h3>
          <p className="mt-0.5 text-[13px] text-e-muted">
            Mean auto-graded score, last {TREND.length} weeks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-5 rounded-full bg-e-violet" aria-hidden="true" />
          <span className="text-[13px] text-e-muted">Class average</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums",
              delta >= 0 ? "bg-[#0FA968]/12 text-[#0FA968]" : "bg-[#E5484D]/12 text-[#E5484D]",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          className="h-auto w-full"
          role="presentation"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SEMANTIC.brand} stopOpacity="0.22" />
              <stop offset="100%" stopColor={SEMANTIC.brand} stopOpacity="0" />
            </linearGradient>
          </defs>

          {TICKS.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={VB_WIDTH - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="#E5E8EB"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(tick) + 4}
                textAnchor="end"
                className="fill-[#8B95A1] font-mono text-[11px]"
              >
                {tick}
              </text>
            </g>
          ))}

          <motion.path
            d={area}
            fill={`url(#${gradientId})`}
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: seen ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          />

          <motion.path
            d={line}
            fill="none"
            stroke={SEMANTIC.brand}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            animate={{ pathLength: seen ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 1, ease: EASE }}
          />

          {TREND.map((point, index) => (
            <text
              key={point.week}
              x={x(index)}
              y={VB_HEIGHT - 8}
              textAnchor="middle"
              className="fill-[#6B7684] font-mono text-[11px]"
            >
              {point.week}
            </text>
          ))}
        </svg>

        {/* Focusable dots live in their own layer so each is a real control. */}
        <svg
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-label={`Class average by week, ${first} percent in ${TREND[0].label} rising to ${last} percent in ${TREND[TREND.length - 1].label}`}
          role="group"
        >
          {TREND.map((point, index) => (
            <g
              key={point.week}
              tabIndex={0}
              role="button"
              aria-label={`${point.label}, class average ${point.average} percent`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              className="cursor-pointer outline-offset-4"
            >
              <circle cx={x(index)} cy={y(point.average)} r={14} fill="transparent" />
              <circle
                cx={x(index)}
                cy={y(point.average)}
                r={active === index ? 6 : 4.5}
                fill="#FFFFFF"
                stroke={SEMANTIC.brand}
                strokeWidth={2.5}
                className="transition-all duration-150"
              />
            </g>
          ))}
        </svg>

        <AnimatePresence>
          {active !== null ? (
            <motion.div
              role="tooltip"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                left: `${(x(active) / VB_WIDTH) * 100}%`,
                top: `${(y(TREND[active].average) / VB_HEIGHT) * 100}%`,
              }}
              className={cn(
                CARD,
                FLOAT_SHADOW,
                "pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] px-3 py-2 whitespace-nowrap",
              )}
            >
              <p className="text-[13px] font-semibold text-e-ink">{TREND[active].label}</p>
              <p className="font-mono text-[13px] text-e-muted tabular-nums">
                {TREND[active].average}% class average
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="sr-only">
        <table>
        <caption>Class average score by week</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Class average</th>
          </tr>
        </thead>
        <tbody>
          {TREND.map((point) => (
            <tr key={point.week}>
              <th scope="row">{point.label}</th>
              <td>{point.average}%</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- common mistakes ----------------------------------------------------- */

function CommonMistakes() {
  const [open, setOpen] = useState<string | null>(MISTAKES[0].id);
  const reduceMotion = useReducedMotion();
  const baseId = useId();

  return (
    <div className={cn(CARD, "p-5")}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-[#E5484D]" aria-hidden="true" />
        <h3 className="text-[17px] font-bold text-e-ink">Common mistakes</h3>
      </div>
      <p className="mt-0.5 text-[13px] text-e-muted">
        Patterns the auto-grader clustered across this week&apos;s submissions.
      </p>

      <ul className="mt-4 divide-y divide-e-line border-t border-e-line">
        {MISTAKES.map((mistake) => {
          const isOpen = open === mistake.id;
          const panelId = `${baseId}-${mistake.id}`;
          return (
            <li key={mistake.id}>
              <h4>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : mistake.id)}
                  className="flex min-h-[56px] w-full items-center gap-3 py-3 text-left transition-colors duration-150 hover:bg-e-grey"
                >
                  <span className="shrink-0 rounded-full bg-[#E5484D]/12 px-2.5 py-1 font-mono text-[13px] font-bold text-[#E5484D] tabular-nums">
                    {mistake.students}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-semibold text-e-ink">
                    {mistake.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-e-faint transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </h4>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    key="panel"
                    id={panelId}
                    initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.33, 1, 0.68, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4">
                      <pre className="overflow-x-auto rounded-r-lg border-l-2 border-[#E5484D] bg-e-grey px-4 py-3 font-mono text-[13px] leading-relaxed text-e-ink">
                        <code>{mistake.code}</code>
                      </pre>
                      <p className="mt-2 text-[15px] leading-relaxed text-e-muted">
                        <span className="font-semibold text-[#0FA968]">Fix — </span>
                        {mistake.fix}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
