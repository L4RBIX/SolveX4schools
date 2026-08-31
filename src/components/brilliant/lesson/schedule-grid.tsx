"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ConstraintArrowIcon,
  ConstraintCheckIcon,
  ConstraintCrossIcon,
} from "./icons";

/**
 * "Client Meetings (hours)" — the scheduler interactive from the lesson
 * `scheduling-problem/scheduling-meetings`.
 *
 * INTERACTION MODEL: tap to toggle. Not drag.
 *
 * The original ships as an Elm app inside `<custom-interactive>`'s open shadow
 * root, and its own `aria-description` attributes state the model outright —
 * the root reads "toggleable scheduler timeline" and the prompt says "Tap
 * meeting blocks…". Blocks carry `cursor: pointer`, never `grab`, and there is
 * no pointer-move handling anywhere in the widget's stylesheet. This is
 * reimplemented as plain React; the shadow DOM bought the original nothing we
 * need.
 *
 * Two behaviours are easy to get wrong and were verified live:
 *   1. Overlapping blocks may both be selected. Nothing is rejected on tap —
 *      validation happens only on Check.
 *   2. Constraints evaluate in order and short-circuit. With "No conflicts"
 *      failing, "Accept 2 meetings" stayed "not yet checked" even though two
 *      meetings *were* selected.
 *
 * Geometry note: the original expresses vertical position over a denominator of
 * 108 (= the 216px grid box at half scale) rather than 100, which makes each
 * block overhang its hour line by exactly 1px at authored scale so the 2px
 * border sits centred on the line. `top`/`height` below reproduce that.
 */

export interface ScheduleEvent {
  id: string;
  /** Inclusive start hour on a 24h clock. */
  start: number;
  /** Exclusive end hour. */
  end: number;
  /** Horizontal column. Encodes overlap only — it carries no data meaning. */
  lane: number;
}

export type Verdict = "unchecked" | "wrong" | "right";

type ConstraintStatus = "unchecked" | "satisfied" | "unsatisfied";

export interface ScheduleGridProps {
  title?: string;
  /** First hour on the axis. */
  hourStart?: number;
  /** Last hour on the axis. */
  hourEnd?: number;
  /** How many lanes the plot is divided into. */
  lanes?: number;
  events?: ScheduleEvent[];
  /** Which hours get a written label. */
  labelledHours?: number[];
  verdict?: Verdict;
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  className?: string;
}

/* The live puzzle, read out of the widget's own scene graph. */
export const SCHEDULING_MEETINGS = {
  hourStart: 9,
  hourEnd: 17,
  lanes: 3,
  events: [
    { id: "event-0", start: 10, end: 12, lane: 0 },
    { id: "event-1", start: 11, end: 15, lane: 1 },
    { id: "event-2", start: 14, end: 16, lane: 2 },
  ] satisfies ScheduleEvent[],
  /** Non-overlapping, exactly two. Kept in module state, never rendered. */
  answer: ["event-0", "event-2"],
  labelledHours: [9, 13, 17],
} as const;

export const SCHEDULING_CONSTRAINTS = [
  {
    label: "No conflicts",
    test: (picked: ScheduleEvent[]) =>
      picked.every((a, i) =>
        picked.every((b, j) => i === j || a.end <= b.start || b.end <= a.start),
      ),
  },
  { label: "Accept 2 meetings", test: (picked: ScheduleEvent[]) => picked.length === 2 },
];

function hourLabel(hour: number) {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

/**
 * Evaluate in declaration order, stopping at the first failure so later
 * constraints stay "not yet checked" — matching the original.
 */
export function evaluateConstraints(
  picked: ScheduleEvent[],
  constraints = SCHEDULING_CONSTRAINTS,
): ConstraintStatus[] {
  const out: ConstraintStatus[] = [];
  let stopped = false;
  for (const c of constraints) {
    if (stopped) {
      out.push("unchecked");
      continue;
    }
    const ok = c.test(picked);
    out.push(ok ? "satisfied" : "unsatisfied");
    if (!ok) stopped = true;
  }
  return out;
}

export function ScheduleGrid({
  title = "Client Meetings (hours)",
  hourStart = SCHEDULING_MEETINGS.hourStart,
  hourEnd = SCHEDULING_MEETINGS.hourEnd,
  lanes = SCHEDULING_MEETINGS.lanes,
  events = [...SCHEDULING_MEETINGS.events],
  labelledHours = [...SCHEDULING_MEETINGS.labelledHours],
  verdict = "unchecked",
  selected,
  onToggle,
  className,
}: ScheduleGridProps) {
  const span = hourEnd - hourStart;
  // 108 units tall, so a 1-unit overhang == 1px at the authored 216px height.
  const unit = 108 / span;

  const geometry = useCallback(
    (ev: ScheduleEvent) => ({
      top: `${(((ev.start - hourStart) * unit - 0.5) / 108) * 100}%`,
      height: `${(((ev.end - ev.start) * unit + 1) / 108) * 100}%`,
      left: `calc(${(ev.lane * 100) / lanes}% + 4px)`,
      width: `calc(${100 / lanes}% - 8px)`,
    }),
    [hourStart, unit, lanes],
  );

  const locked = verdict !== "unchecked";

  return (
    <div
      data-scene-graph-name="scheduler"
      aria-description="toggleable scheduler timeline"
      className={cn("flex h-full w-full flex-col gap-5", className)}
    >
      {/* ---- timeline panel ------------------------------------------- */}
      <div
        data-scene-graph-name="scheduler-timeline"
        className={cn(
          "flex w-full flex-col overflow-auto rounded-[12px] border-2",
          "font-b-sans select-none [-webkit-tap-highlight-color:transparent]",
          "transition-colors duration-200",
          verdict === "unchecked" && "border-b-sched-edge bg-b-sched-fill",
          verdict === "wrong" && "border-b-lock-panel-edge bg-b-lock-panel",
          verdict === "right" && "border-b-ok bg-b-ok-panel",
        )}
      >
        <div
          data-scene-graph-name="scheduler-title"
          className="flex items-center justify-center pt-2 text-center text-[16px] font-medium"
        >
          {title}
        </div>

        <div className="m-2 flex h-[216px] flex-row rounded-[8px] bg-[#12141a] text-[#e8ecf4] pt-[14px] pr-2 pb-[18px]">
          {/* axis gutter */}
          <div className="relative mr-1 h-full w-auto min-w-[36px] overflow-visible">
            {labelledHours.map((h) => (
              <span
                key={h}
                style={{ top: `${((h - hourStart) / span) * 100}%` }}
                className="absolute right-0 -translate-y-1/2 text-[13px] whitespace-nowrap text-b-fg"
              >
                {hourLabel(h)}
              </span>
            ))}
          </div>

          {/* plot */}
          <div className="relative h-full flex-1 bg-[#12141a] text-[#e8ecf4]">
            {Array.from({ length: span + 1 }, (_, i) => (
              <div
                key={i}
                style={{ top: `${(i / span) * 100}%` }}
                className="absolute left-0 h-0 w-full border-b border-b-white/20"
              />
            ))}

            {events.map((ev) => {
              const on = selected?.has(ev.id) ?? false;
              return (
                <button
                  key={ev.id}
                  type="button"
                  data-scene-graph-name={ev.id}
                  aria-pressed={on}
                  aria-label={`${ev.start} to ${ev.end} hours — ${on ? "selected" : "unselected"}`}
                  disabled={locked}
                  onClick={() => onToggle?.(ev.id)}
                  style={geometry(ev)}
                  className={cn(
                    "absolute box-border overflow-hidden rounded-[4px] border-2",
                    "transition-colors duration-100",
                    !locked && "cursor-pointer",
                    locked && "cursor-default",
                    // resting
                    verdict === "unchecked" &&
                      !on &&
                      "border-b-sched-edge bg-b-sched-fill hover:border-b-sched-edge-hover hover:bg-b-sched-fill-hover",
                    verdict === "unchecked" &&
                      on &&
                      "border-b-sched-edge-on bg-b-sched-fill-on",
                    // checked
                    locked && !on && "border-b-lock-edge bg-b-lock-fill",
                    verdict === "wrong" && on && "border-b-warn-edge bg-b-warn-fill",
                    verdict === "right" && on && "border-b-ok-edge bg-b-ok-fill",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- constraint checklist ---------------------------------------------- */

export interface ConstraintListProps {
  labels: string[];
  statuses: ConstraintStatus[];
  className?: string;
}

export function ConstraintList({ labels, statuses, className }: ConstraintListProps) {
  return (
    <div
      data-scene-graph-name="scheduler-constraints"
      aria-description={`${labels.length} constraints that must be satisfied`}
      className={cn("flex flex-col gap-3", className)}
    >
      {labels.map((label, i) => {
        const status = statuses[i] ?? "unchecked";
        return (
          <div
            key={label}
            data-scene-graph-name={`constraint-${i}`}
            aria-description={`"${label}" — status: ${
              status === "unchecked" ? "not yet checked" : status
            }`}
            className={cn(
              "flex flex-row items-start gap-2 whitespace-normal",
              // 4 x 100ms, alternating, 0 -> 4px. Replays on each failed check
              // because the key below changes with the status.
              status === "unsatisfied" && "b-shake",
            )}
          >
            <span
              className={cn(
                "flex h-[19.5px] items-center",
                status === "unchecked" && "text-[#b3b3b3]",
                status === "unsatisfied" && "text-b-warn-icon",
                status === "satisfied" && "text-b-ok-edge",
              )}
            >
              {status === "unchecked" && <ConstraintArrowIcon />}
              {status === "unsatisfied" && <ConstraintCrossIcon />}
              {status === "satisfied" && <ConstraintCheckIcon />}
            </span>
            <span className="text-[16px] leading-6 text-b-fg">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- stateful wrapper --------------------------------------------------- */

export interface SchedulerProblemProps {
  onVerdict?: (v: Verdict) => void;
  className?: string;
}

/**
 * Owns selection + verdict for the shipped puzzle. Kept separate from
 * `ScheduleGrid` so the presentational grid stays drivable from a parent that
 * wants to script it (screenshots, tests, a guided walkthrough).
 */
export function useSchedulerProblem() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [verdict, setVerdict] = useState<Verdict>("unchecked");
  const [attempt, setAttempt] = useState(0);

  const events = useMemo(() => [...SCHEDULING_MEETINGS.events], []);
  const picked = useMemo(
    () => events.filter((e) => selected.has(e.id)),
    [events, selected],
  );

  const statuses = useMemo<ConstraintStatus[]>(
    () =>
      verdict === "unchecked"
        ? SCHEDULING_CONSTRAINTS.map(() => "unchecked" as const)
        : evaluateConstraints(picked),
    [verdict, picked],
  );

  const toggle = useCallback(
    (id: string) => {
      if (verdict !== "unchecked") return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [verdict],
  );

  const check = useCallback(() => {
    const results = evaluateConstraints(picked);
    const v: Verdict = results.every((r) => r === "satisfied") ? "right" : "wrong";
    setVerdict(v);
    setAttempt((a) => a + 1);
    return v;
  }, [picked]);

  const tryAgain = useCallback(() => setVerdict("unchecked"), []);
  const startOver = useCallback(() => {
    setSelected(new Set());
    setVerdict("unchecked");
  }, []);

  return {
    selected,
    verdict,
    statuses,
    attempt,
    canCheck: selected.size > 0,
    toggle,
    check,
    tryAgain,
    startOver,
  };
}
