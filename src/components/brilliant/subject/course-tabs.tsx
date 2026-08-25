"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import {
  COURSE_GROUPS,
  COURSE_SECTION_HEADING,
  LOHP_DARK_BG,
  type CourseGroup,
  type TabColorScheme,
} from "./data";

/**
 * Section 6 — "Reach your math goals and more".
 *
 * Click-driven only: `/math` passes `disableAutoSlide: true`, so the carousel
 * never advances on its own and there is no scroll trigger. Panels overlap in a
 * single grid cell and cross-fade — out over 100ms, in over 300ms after a 100ms
 * beat, so the outgoing panel is gone before the incoming one arrives.
 */

/** The two shared layers of the selected-pill gradient. */
const A = "linear-gradient(90deg, rgba(242,242,242,1) 0%, rgba(242,242,242,0) 100%)";
const Z = "linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)";

const SCHEME_BASE: Record<TabColorScheme, string> = {
  blue: "linear-gradient(0deg, #7491ff 0%, #eaf7f6 100%)",
  purple: "linear-gradient(0deg, #b689ff 0%, #fff0fb 100%)",
  orange: "linear-gradient(0deg, #ffa95a 0%, #fff0ed 100%)",
  yellow: "linear-gradient(0deg, #f9d25c 0%, #fff0ed 100%)",
};

function pillGradient(scheme: TabColorScheme) {
  return `${A}, ${SCHEME_BASE[scheme]}`;
}

function pillGradientHover(scheme: TabColorScheme) {
  return `${Z}, ${A}, ${SCHEME_BASE[scheme]}`;
}

const PANEL_BG =
  "linear-gradient(0deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.10) 100%), " +
  "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 97%)";

const PILL_BG =
  "linear-gradient(0deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)";

/* -------------------------------------------------------------------------- */

/**
 * The "N additional courses" affordance. At `xl` and up it is a hover popover
 * that closes 150ms after the pointer leaves; below `xl` it is a plain button
 * that expands the list in place.
 */
function AdditionalCourses({
  extra,
  onExpand,
  expanded,
}: {
  extra: readonly string[];
  onExpand: () => void;
  expanded: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => setOpen(false), 150);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  const label = `${extra.length} additional courses`;

  const triggerBase = cn(
    "cursor-pointer border-0 border-b border-dashed border-white/50 bg-none p-0",
    "h-auto rounded-none font-normal text-white/50",
  );

  return (
    <>
      {/* xl and up — hover popover */}
      <div
        className="relative hidden min-[992px]:block"
        onMouseEnter={() => {
          cancel();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="true"
          className={cn(triggerBase, "text-[1rem]")}
          onFocus={() => setOpen(true)}
          onBlur={scheduleClose}
        >
          {label}
        </button>
        {open ? (
          <div
            className={cn(
              // `width: fit-content` in the original, but that popover is portalled to
              // the body; anchored here it would shrink to the trigger, so take the
              // max-content width the portalled version actually resolves to.
              "absolute top-[calc(100%+8px)] left-0 z-10 w-max rounded-[1.25rem] bg-[#383838] p-6",
              "shadow-[0_0_15px_rgba(0,0,0,0.10)]",
            )}
          >
            {/*
              True `1fr` tracks, not Tailwind's `minmax(0,1fr)`: the popup is
              `width: fit-content`, so the columns have to take their intrinsic
              max-content contribution or every course name collapses on top of
              its neighbour.
            */}
            <div className="grid gap-3 [grid-template-columns:repeat(3,1fr)]">
              {extra.map((course) => (
                <span key={course} className="mb-1 text-[14px] text-white min-[769px]:text-[1rem]">
                  {course}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* below xl — expands the list in place */}
      {expanded ? null : (
        <button
          type="button"
          onClick={onExpand}
          className={cn(triggerBase, "text-[14px] min-[992px]:hidden")}
        >
          {label}
        </button>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function CoursePanel({ group, active }: { group: CourseGroup; active: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();

  const extra = group.courses.slice(group.visibleCount);
  const shown = expanded ? group.courses : group.courses.slice(0, group.visibleCount);

  return (
    <div
      role="tabpanel"
      id={`b-course-panel-${group.id}`}
      aria-labelledby={`b-course-tab-${group.id}`}
      data-active={active}
      className={cn(
        "col-start-1 row-start-1 min-w-0 px-0 min-[481px]:px-4",
        active
          ? "pointer-events-auto opacity-100 transition-opacity delay-100 duration-300 ease-out"
          : "pointer-events-none opacity-0 transition-opacity duration-100 ease-out",
      )}
    >
      <div
        className={cn(
          "flex w-full flex-col-reverse items-center justify-center gap-3 rounded-[1.25rem]",
          "min-[992px]:flex-row min-[992px]:items-start min-[992px]:justify-between min-[992px]:gap-2",
        )}
        style={{ backgroundImage: PANEL_BG }}
      >
        <div
          className={cn(
            "mt-5 flex w-full flex-col items-start gap-2 px-8 pt-4 pb-8",
            "min-[769px]:px-16 min-[992px]:mt-0 min-[992px]:pt-16",
          )}
        >
          <div
            className={cn(
              "flex flex-col items-start justify-center gap-3",
              "min-[992px]:justify-start min-[992px]:gap-4",
            )}
          >
            <h3 className="text-[1rem] font-bold text-white min-[769px]:text-[1.25rem]">
              {group.title} Courses
            </h3>
            <ul className="ml-0 list-none">
              {shown.map((course) => (
                <li
                  key={course}
                  className="mb-1 text-[1rem] text-white min-[769px]:mb-2"
                >
                  {course}
                </li>
              ))}
            </ul>
            {extra.length > 0 ? (
              <AdditionalCourses
                extra={extra}
                expanded={expanded}
                onExpand={() => setExpanded(true)}
              />
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "flex w-full max-w-full shrink-0 items-center justify-center rounded-[1.25rem] bg-white",
            "min-[360px]:h-[260px] min-[481px]:h-[375px]",
            "min-[992px]:h-[456px] min-[992px]:w-[550px] min-[1280px]:w-[700px]",
          )}
        >
          {group.video ? (
            <video
              autoPlay={!reduce}
              loop
              muted
              playsInline
              disableRemotePlayback
              poster={group.poster}
              className={cn(
                "w-full min-[360px]:h-[240px] min-[481px]:h-[355px] min-[992px]:h-[430px]",
                "[&::-webkit-media-controls-enclosure]:!hidden [&::-webkit-media-controls-panel]:!w-0 [&::-webkit-media-controls]:!hidden",
              )}
            >
              {reduce ? null : <source src={group.video} type="video/webm" />}
            </video>
          ) : (
            /* No clip for this group — the reference's own poster still stands in. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.poster}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full object-contain min-[360px]:h-[240px] min-[481px]:h-[355px] min-[992px]:h-[430px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function CourseTabs() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % COURSE_GROUPS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + COURSE_GROUPS.length) % COURSE_GROUPS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = COURSE_GROUPS.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-0 px-5 py-16",
        "min-[769px]:px-8 min-[1280px]:px-0 min-[1280px]:py-20",
      )}
      style={{ backgroundImage: LOHP_DARK_BG }}
    >
      <div className="flex w-full max-w-[1142px] flex-col gap-0">
        <h2
          className={cn(
            "font-b-serif mb-9 text-center text-[3rem] font-medium tracking-[-0.025em] text-white",
            "leading-[1.33] min-[360px]:leading-[1.2] min-[769px]:mb-10 min-[769px]:text-[3.75rem]",
          )}
        >
          {COURSE_SECTION_HEADING}
        </h2>

        <div
          role="tablist"
          className={cn(
            "z-[2] mb-4 flex h-[58px] flex-nowrap items-stretch justify-between gap-2",
            "overflow-x-auto rounded-2xl bg-transparent p-1.5 whitespace-nowrap",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:w-0",
            "min-[1280px]:mb-10",
          )}
        >
          {COURSE_GROUPS.map((group, index) => {
            const selected = index === active;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                id={`b-course-tab-${group.id}`}
                aria-selected={selected}
                aria-controls={`b-course-panel-${group.id}`}
                tabIndex={selected ? 0 : -1}
                data-color-scheme={group.colorScheme}
                data-selected={selected ? "" : undefined}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                onClick={() => setActive(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "group/pill relative z-[1] inline-flex h-8 cursor-pointer items-center justify-center",
                  "rounded-[38px] border-0 px-3 text-[14px] font-medium whitespace-nowrap",
                  "min-[481px]:h-10 min-[481px]:px-5 min-[481px]:text-[16px]",
                  selected ? "text-black" : "text-white/50 hover:bg-black/50",
                )}
                style={
                  {
                    backgroundImage: PILL_BG,
                    "--pill-grad": pillGradient(group.colorScheme),
                    "--pill-grad-hover": pillGradientHover(group.colorScheme),
                  } as CSSProperties
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 -z-10 rounded-[inherit] transition-opacity duration-500 ease-out",
                    "bg-[image:var(--pill-grad)] group-hover/pill:bg-[image:var(--pill-grad-hover)]",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="relative hidden min-[769px]:inline">{group.desktopLabel}</span>
                <span className="relative inline min-[769px]:hidden">{group.mobileLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="relative z-[1] grid w-full grid-cols-[minmax(0,1fr)]">
          {COURSE_GROUPS.map((group, index) => (
            <CoursePanel key={group.id} group={group} active={index === active} />
          ))}
        </div>
      </div>
    </div>
  );
}
