"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * brilliant.org/you/ — the learner dashboard.
 *
 * All geometry and colour below is measured from the live page at a 1470
 * viewport; content is verbatim from the account that was open.
 *
 * Shell: a 1216px max-width box, inner vstack `gap: 32px; padding: 32px`,
 * sections stacked at `gap: 48px` inside a 1152px column.
 */

const KOJI_SUMMARY =
  "/assets/original/brilliant/brilliant.org/images/learnerDashboard/koji-weekly-summary.svg";

export interface YouDashboardProps {
  className?: string;
}

const PERIODS = ["Week", "Month", "Year"] as const;

/** Verbatim from the live dashboard. */
const RANGE = "Aug 19 – Aug 25, 2026";
const CHART = [
  { day: "Wed", date: "Aug 19, 2026", value: 0 },
  { day: "Thu", date: "Aug 20, 2026", value: 0 },
  { day: "Fri", date: "Aug 21, 2026", value: 4 },
  { day: "Sat", date: "Aug 22, 2026", value: 0 },
  { day: "Sun", date: "Aug 23, 2026", value: 0 },
  { day: "Mon", date: "Aug 24, 2026", value: 0 },
  { day: "Tue", date: "Aug 25, 2026", value: 2 },
];
const Y_TICKS = [0, 2, 4, 6, 8];
const PLOT_H = 161; // px, measured
const Y_MAX = 8;

export function YouDashboard({ className }: YouDashboardProps) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Week");

  return (
    <div className={cn("mx-auto w-full max-w-[1216px]", className)}>
      <div className="flex flex-col items-start gap-8 p-8">
        <h1 className="sr-only">Your progress</h1>

        {/* ---- period header ------------------------------------------ */}
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex shrink-0 items-center gap-1">
            <PeriodArrow direction="prev" />
            <span className="text-left text-white/60">Week of Aug 19–25, 2026</span>
            <PeriodArrow direction="next" />
          </div>

          <div
            role="radiogroup"
            aria-label="Report period"
            className="flex shrink-0 gap-1 rounded-full bg-b-elevated p-1"
          >
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex h-[37px] min-w-[60px] items-center justify-center rounded-full px-3 py-2 text-[14px] leading-[21px]",
                  "transition-[background-color,box-shadow,color] duration-150 ease-out",
                  period === p
                    ? "bg-b-bg text-white shadow-[0_0_15px_0_rgba(0,0,0,0.1)]"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ---- sections ------------------------------------------------ */}
        <div className="flex w-full flex-col gap-12">
          <WeeklySummary />
          <ActivitySnapshot />
          <LearningProgress />
          <LearningStrengths />
        </div>
      </div>
    </div>
  );
}

/** Both arrows ship disabled on the current week. */
function PeriodArrow({ direction }: { direction: "prev" | "next" }) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous period" : "Next period"}
      disabled
      className={cn(
        "flex h-11 w-11 shrink-0 cursor-default items-center justify-center overflow-clip rounded-full border-2 border-transparent p-3 text-white/20",
        direction === "prev" ? "-ml-3" : "-mr-3",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.55239 4.39646L7.97424 2.97461L13.5 8.5004L7.97424 14.0262L6.55239 12.6043L9.65089 9.50584H2.5L2.5 7.49504H9.65098L6.55239 4.39646Z"
          fill="currentColor"
          transform={direction === "prev" ? "rotate(180 8 8)" : undefined}
        />
      </svg>
    </button>
  );
}

/**
 * The green summary card. Its fill is a vertical gradient `#004E16 → #001F09`,
 * and Koji is an absolutely-positioned SVG that hangs off the card's left edge
 * with a mirrored, slightly rotated matrix — copied verbatim rather than
 * approximated as a rotation, because the matrix is a reflection.
 */
function WeeklySummary() {
  return (
    <section
      className="relative min-h-[176px] overflow-hidden rounded-[20px] border-2 border-white/20 p-9"
      style={{ backgroundImage: "linear-gradient(#004E16 0%, #001F09 100%)" }}
    >
      <div className="flex items-start gap-6">
        <div className="flex w-[263px] shrink-0 flex-col justify-center gap-1">
          <h2 className="text-[24px] leading-[30px] font-bold">This Week&rsquo;s Summary</h2>
          <span className="text-[14px] leading-[21px] text-white/60">{RANGE}</span>
        </div>
        <ul role="list" className="min-w-px flex-1 list-disc pl-6">
          <li>Steady progress! You practiced on 2 days this week and completed 0 lessons.</li>
          <li>
            You asked me 11 questions this week, which tells me you&rsquo;re working through
            problems instead of skipping past them.
          </li>
        </ul>
      </div>

      <div className="absolute -left-0.5 h-[76px] w-[99px]" style={{ top: 98 }}>
        <Image
          src={KOJI_SUMMARY}
          alt=""
          width={118}
          height={122}
          className="max-w-full"
          style={{
            height: "104.281px",
            transform: "matrix(-0.978473, -0.206375, -0.206375, 0.978473, 0, 0)",
          }}
        />
      </div>
    </section>
  );
}

function ActivitySnapshot() {
  return (
    <section className="flex flex-col items-stretch gap-6">
      <SectionHeading>Your activity snapshot</SectionHeading>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <StatTile label="Activities completed" value="0" hint="About activities completed" />
          <StatTile label="Assessment accuracy" value="0.0%" hint="About assessment accuracy" />
        </div>
        <ProblemsSolvedChart />
      </div>
    </section>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex min-h-[107px] min-w-px flex-1 flex-col items-start justify-center gap-2 rounded-[20px] border-2 border-white/20 bg-b-bg px-6 py-4">
      <div className="flex w-full items-center justify-between text-[14px] leading-[21px] text-white/60">
        <span>{label}</span>
        <button
          type="button"
          aria-label={hint}
          className="flex h-3 w-3 shrink-0 items-center justify-center rounded-md text-white/30"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM7 6V4H9V6H7ZM9 12V9V7H7H6V9H7V12H9Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-center">
        <span className="text-[30px] leading-[37.5px] font-bold">{value}</span>
      </div>
    </div>
  );
}

/**
 * The bar chart is plain DOM, not a charting library: an absolutely-positioned
 * gridline per tick, a flex row of columns, and one 56px bar each.
 *
 * A zero value still paints a **2px stub** rather than nothing — measured, and
 * easy to get wrong by treating 0 as "no bar".
 */
function ProblemsSolvedChart() {
  return (
    <div className="rounded-[20px] border-2 border-white/20 bg-b-bg">
      <div className="flex flex-col items-stretch gap-8 px-8 py-6">
        <div className="flex flex-col items-start">
          <h3 className="text-[20px] leading-[25px] font-bold">Problems solved</h3>
          <p className="text-[14px] leading-[21px] text-white/60">{RANGE}</p>
        </div>

        <div
          role="img"
          aria-label="Bar chart of problems solved. A data table follows"
          className="grid gap-2"
          style={{ gridTemplateColumns: "auto 1fr" }}
        >
          {/* y axis */}
          <div className="relative text-[12px] leading-[18px]" style={{ height: PLOT_H }}>
            {Y_TICKS.map((t) => (
              <span
                key={t}
                className="absolute translate-y-[9px] text-white/60"
                style={{ top: PLOT_H - (t / Y_MAX) * PLOT_H - 18 }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* plot */}
          <div>
            <div className="relative" style={{ height: PLOT_H }}>
              {Y_TICKS.map((t) => (
                <div
                  key={t}
                  className="absolute w-full border-t border-white/5"
                  style={{ top: PLOT_H - (t / Y_MAX) * PLOT_H }}
                />
              ))}
              <div className="absolute inset-0 flex items-end justify-between">
                {CHART.map((d) => (
                  <div key={d.day} className="flex min-w-px flex-1 justify-center">
                    <div
                      className="w-14 max-w-[56px] rounded-t bg-b-chart"
                      style={{ height: Math.max((d.value / Y_MAX) * PLOT_H, 2) }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex">
              {CHART.map((d) => (
                <span
                  key={d.day}
                  className="min-w-px flex-1 text-center text-[12px] leading-[18px] text-white/60"
                >
                  {d.day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* the original exposes the same data as a real table for screen readers */}
        <table className="sr-only">
          <caption>Problems solved over the selected period</caption>
          <thead>
            <tr>
              <th scope="col">Starting</th>
              <th scope="col">Problems solved</th>
            </tr>
          </thead>
          <tbody>
            {CHART.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LearningProgress() {
  return (
    <section className="flex flex-col items-stretch gap-6">
      <SectionHeading>Your learning progress</SectionHeading>
      <p className="text-white/60">No course progress in this period.</p>
    </section>
  );
}

function LearningStrengths() {
  return (
    <section className="flex flex-col items-stretch gap-6">
      <SectionHeading>Your learning strengths</SectionHeading>
      <div className="grid grid-cols-2 gap-4">
        <StrengthCard
          title="Resilience"
          chip="bg-b-green-deep text-b-ok-edge"
          icon={
            <>
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </>
          }
        >
          You asked for help <strong className="font-bold">3 times</strong> after getting a wrong
          answer
        </StrengthCard>
        <StrengthCard
          title="Initiative"
          chip="bg-b-lilac-deep text-b-lilac"
          icon={<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />}
        >
          You asked Koji a question on your own <strong className="font-bold">2 times</strong>
        </StrengthCard>
      </div>
    </section>
  );
}

function StrengthCard({
  title,
  chip,
  icon,
  children,
}: {
  title: string;
  chip: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-5 rounded-2xl border-2 border-white/20 bg-b-bg p-9">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", chip)}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </div>
      <div className="flex flex-col items-start gap-1">
        <h3 className="text-[20px] leading-[25px] font-bold">{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[20px] leading-[25px] font-bold">{children}</h2>
    </div>
  );
}
