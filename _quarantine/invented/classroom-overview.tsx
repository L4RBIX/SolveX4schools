"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Download, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  CLASS_META,
  CLASS_SIZE,
  FLOAT_SHADOW,
  ROSTER,
  STATUS_COUNTS,
  STATUS_META,
  STATUS_ORDER,
  type Student,
} from "./teacher-data";

/* ---------------------------------------------------------------------------
   Shared local hooks. Both stay in this file rather than a shared module so the
   teacher surface owns its own files.
   ------------------------------------------------------------------------- */

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

/** Counts 0 -> target once `active` flips true. ~800ms, ease-out cubic. */
function useCountUp(target: number, active: boolean, duration = 800) {
  const reduceMotion = useReducedMotion();
  const [tweened, setTweened] = useState(0);

  useEffect(() => {
    if (!active || reduceMotion) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setTweened(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, reduceMotion, target]);

  if (reduceMotion) return active ? target : 0;
  return tweened;
}

/* ------------------------------------------------------------------------ */

export function ClassroomOverview() {
  const [toast, setToast] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  /** Hands off to the one modal trigger that owns the assignment form. */
  const openNewAssignment = () => {
    const trigger = document.getElementById("new-assignment-trigger");
    trigger?.scrollIntoView({ block: "center" });
    trigger?.click();
  };

  return (
    <section aria-labelledby="classroom-overview-heading" className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id="classroom-overview-heading"
            className="text-2xl leading-tight font-bold text-e-ink"
          >
            {CLASS_META.name}
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-e-muted">
            {CLASS_META.unit} · {CLASS_META.period} · {CLASS_META.teacher}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setToast(`${CLASS_META.name} report exported as CSV`)}
            className={BTN_SECONDARY}
          >
            <Download className="size-4" aria-hidden="true" />
            Export report
          </button>
          <button type="button" onClick={openNewAssignment} className={BTN_PRIMARY}>
            <Plus className="size-4" aria-hidden="true" />
            New assignment
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.p
            role="status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0FA968]/12 px-3 py-1.5 text-[13px] font-semibold text-[#0FA968]"
          >
            <Check className="size-3.5" aria-hidden="true" />
            {toast}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <StatusBand />
      <ClassGrid />
    </section>
  );
}

/* ---- live status band ---------------------------------------------------- */

function StatusBand() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-3">
      {STATUS_ORDER.map((status) => (
        <StatusTile key={status} status={status} active={seen} />
      ))}
    </div>
  );
}

function StatusTile({
  status,
  active,
}: {
  status: (typeof STATUS_ORDER)[number];
  active: boolean;
}) {
  const meta = STATUS_META[status];
  const target = STATUS_COUNTS[status];
  const value = useCountUp(target, active);

  return (
    <div className={cn(CARD, "p-5", meta.tileBorderClass)}>
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", meta.dotClass)} aria-hidden="true" />
        <span className="text-[13px] font-semibold tracking-[0.06em] text-e-muted uppercase">
          {meta.label}
        </span>
      </div>

      <p className="mt-2 font-mono text-[2rem] leading-none font-bold text-e-ink tabular-nums">
        <span aria-hidden="true">{value}</span>
        <span className="sr-only">{target}</span>
        <span className="ml-1.5 font-e-sans text-[13px] font-medium text-e-faint">
          of {CLASS_SIZE}
        </span>
      </p>

      <p className="mt-2 text-[13px] leading-relaxed text-e-muted">{meta.note}</p>
    </div>
  );
}

/* ---- class grid ---------------------------------------------------------- */

interface PopoverState {
  student: Student;
  x: number;
  y: number;
}

const POPOVER_WIDTH = 208;

function ClassGrid() {
  const [wrapRef, seen] = useInViewOnce<HTMLDivElement>(0.1);
  const gridRef = useRef<HTMLUListElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const reduceMotion = useReducedMotion();

  const openPopover = useCallback((student: Student, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const half = POPOVER_WIDTH / 2;
    const centred = rect.left + rect.width / 2 - half;
    const max = window.innerWidth - POPOVER_WIDTH - 8;
    setPopover({
      student,
      x: Math.min(Math.max(8, centred), Math.max(8, max)),
      y: rect.top - 10,
    });
  }, []);

  useEffect(() => {
    if (!popover) return;
    const dismiss = () => setPopover(null);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [popover]);

  /** Roving tabindex: the grid is one tab stop, arrows move between cells. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const grid = gridRef.current;
    if (!grid) return;
    const columns = window
      .getComputedStyle(grid)
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length;

    let next = activeIndex;
    switch (event.key) {
      case "ArrowRight":
        next = Math.min(CLASS_SIZE - 1, activeIndex + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, activeIndex - 1);
        break;
      case "ArrowDown":
        next = Math.min(CLASS_SIZE - 1, activeIndex + columns);
        break;
      case "ArrowUp":
        next = Math.max(0, activeIndex - columns);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = CLASS_SIZE - 1;
        break;
      case "Escape":
        setPopover(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActiveIndex(next);
    const cell = grid.querySelectorAll<HTMLButtonElement>("button")[next];
    cell?.focus();
  };

  return (
    <div ref={wrapRef} className={cn(CARD, "p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-bold text-e-ink">Class at a glance</h3>
          <p className="mt-0.5 text-[13px] text-e-muted">
            One tile per student. Arrow keys move between tiles.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {STATUS_ORDER.map((status) => (
            <li key={status} className="flex items-center gap-1.5 text-[13px] text-e-muted">
              <span
                className={cn("size-2 rounded-full", STATUS_META[status].dotClass)}
                aria-hidden="true"
              />
              {STATUS_META[status].label}
              <span className="font-mono tabular-nums">{STATUS_COUNTS[status]}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="sr-only">
        {CLASS_SIZE} students: {STATUS_COUNTS.advanced} advanced,{" "}
        {STATUS_COUNTS.progressing} progressing, {STATUS_COUNTS.struggling} struggling.
      </p>

      <ul
        ref={gridRef}
        onKeyDown={onKeyDown}
        aria-label={`${CLASS_META.name} student tiles`}
        className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-10"
      >
        {ROSTER.map((student, index) => {
          const meta = STATUS_META[student.status];
          return (
            <motion.li
              key={student.id}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={seen ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.28, delay: index * 0.012, ease: [0.33, 1, 0.68, 1] }}
            >
              <button
                type="button"
                tabIndex={index === activeIndex ? 0 : -1}
                onFocus={(event) => {
                  setActiveIndex(index);
                  openPopover(student, event.currentTarget);
                }}
                onBlur={() => setPopover(null)}
                onMouseEnter={(event) => openPopover(student, event.currentTarget)}
                onMouseLeave={() => setPopover(null)}
                aria-label={`${student.name}, ${meta.label}, ${student.progress} percent of ${CLASS_META.unit} complete, currently on ${student.currentLesson}`}
                className={cn(
                  "relative flex h-11 w-full flex-col items-center justify-center rounded-lg transition-colors duration-150",
                  meta.cellClass,
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 right-1 size-1.5 rounded-full",
                    meta.dotClass,
                  )}
                  aria-hidden="true"
                />
                <span
                  className="font-mono text-[10px] font-bold text-e-ink"
                  aria-hidden="true"
                >
                  {student.initials}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <AnimatePresence>
        {popover ? (
          <motion.div
            role="tooltip"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.33, 1, 0.68, 1] }}
            style={{ left: popover.x, top: popover.y, width: POPOVER_WIDTH }}
            className={cn(
              CARD,
              FLOAT_SHADOW,
              "pointer-events-none fixed z-50 -translate-y-full p-3",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold",
                  STATUS_META[popover.student.status].avatarClass,
                )}
              >
                {popover.student.initials}
              </span>
              <p className="truncate text-[13px] font-bold text-e-ink">
                {popover.student.name}
              </p>
            </div>
            <p className="mt-2 truncate text-[13px] text-e-muted">
              {popover.student.currentLesson}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5 text-[13px] text-e-muted">
              <span className="font-mono font-bold text-e-ink tabular-nums">
                {popover.student.progress}%
              </span>
              of unit complete
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
