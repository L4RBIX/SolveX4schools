"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CourseCard } from "./course-card";
import { COURSES, type Course, courseStatus } from "./lxp-data";

/**
 * "My courses" — a filter row of pills over a responsive card grid.
 * 3 columns at 1440, 2 at 768, 1 at 390; cards enter 60ms apart.
 */

const FILTERS = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "not-started", label: "Not started" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export interface CourseListProps {
  courses?: Course[];
  className?: string;
  id?: string;
}

export function CourseList({ courses = COURSES, className, id }: CourseListProps) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const [filter, setFilter] = useState<FilterId>("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? courses
        : courses.filter((course) => courseStatus(course) === filter),
    [courses, filter],
  );

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = FILTERS.length - 1;
    let next = -1;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next < 0) return;
    event.preventDefault();
    setFilter(FILTERS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id={id} className={cn("scroll-mt-20", className)} aria-labelledby={`${baseId}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${baseId}-title`} className="text-2xl leading-tight font-bold text-e-ink">
          My courses
          <span className="ml-2 align-middle text-[13px] font-semibold text-e-faint">
            {visible.length} of {courses.length}
          </span>
        </h2>
      </div>

      <div
        role="tablist"
        aria-label="Filter courses by progress"
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {FILTERS.map((item, index) => {
          const selected = filter === item.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              onClick={() => setFilter(item.id)}
              className={cn(
                "relative flex min-h-[44px] items-center rounded-full px-4 text-[14px] font-semibold transition-colors duration-200",
                selected ? "text-e-violet" : "text-e-muted hover:bg-e-grey-2 hover:text-e-ink",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={`${baseId}-pill`}
                  className="absolute inset-0 rounded-full bg-e-violet-soft"
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34, mass: 0.9 }
                  }
                />
              ) : null}
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${filter}`}
        className="mt-5"
      >
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {visible.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-e-line bg-e-white p-8 text-center">
            <p className="text-[15px] text-e-muted">
              Nothing here yet — no courses match this filter.
            </p>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 inline-flex h-11 items-center rounded-lg border border-e-line bg-e-white px-5 text-[15px] font-semibold text-e-ink transition-colors duration-200 hover:bg-e-grey"
            >
              Show all
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
