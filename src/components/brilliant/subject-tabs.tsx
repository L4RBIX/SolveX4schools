"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Section 8 — a centred serif heading over a click-driven subject tab bar and,
 * per tab, a warm-grey panel holding a single "Covered subjects" list on the
 * left and a white preview card on the right.
 *
 * The reference ships four subject clips (math, cs, science, data). This build
 * keeps only the coding one, so `SubjectClip` has a single member and the tab
 * bar renders a single tab.
 */

/** Named for the reference file each tab previews. */
export type SubjectClip = "cs";

export interface SubjectTab {
  /** Tab label, verbatim from the reference. */
  label: string;
  /** Course names for this tab, in reference order. */
  courses: readonly string[];
  /**
   * The muted, dotted-underlined count under the list. Absent on the tabs the
   * reference shows without one.
   */
  additional?: string;
  /** Which /videos/homepage/courses clip this tab previews. */
  clip: SubjectClip;
}

export interface SubjectTabsProps {
  heading: string;
  /** The "Covered subjects" sub-heading above each tab's list. */
  listHeading: string;
  tabs: readonly SubjectTab[];
}

const ORIGIN = "/assets/original/brilliant/brilliant.org";
const COURSES = `${ORIGIN}/videos/homepage/courses`;

/**
 * `startAt` staggers a clip that is reused elsewhere on the page. cs-refresh
 * runs 17.4s across four scenes — Neural networks, Python, Algorithms, Thinking
 * in code — and the homepage plays it in five places, so each one seeks to a
 * different scene instead of all opening on the same frame.
 */
const CLIP_SRC: Record<
  SubjectClip,
  { webm: string; poster: string; startAt?: number }
> = {
  cs: {
    webm: `${COURSES}/cs-refresh.webm`,
    poster: `${COURSES}/posters/cs-refresh.png`,
    /* Neural networks, a little past the row that opens on it. */
    startAt: 1.5,
  },
};

/**
 * Only the Math card's caption survived the capture, and Math is gone from
 * this build, so no card renders a caption. No stand-in name is invented.
 */
const CLIP_CAPTION: Partial<Record<SubjectClip, string>> = {};

const CLIP_W = 633;
const CLIP_H = 413;

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
const VIEWPORT = { once: true, amount: 0.3 } as const;

export function SubjectTabs({ heading, listHeading, tabs }: SubjectTabsProps) {
  const reduced = useReducedMotion();
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  /* Roving tabindex: arrows move between tabs, Home/End jump to the ends. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = tabs.length - 1;
      let next: number | null = null;

      if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
      else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = last;

      if (next === null) return;
      event.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    },
    [tabs.length],
  );

  /* Only the visible tab's clip runs; switching tabs stops the rest. */
  useEffect(() => {
    const nodes = videoRefs.current;
    const cleanups: (() => void)[] = [];

    nodes.forEach((node, index) => {
      if (!node) return;

      if (index === active && !reduced) {
        const offset = CLIP_SRC[tabs[index].clip].startAt ?? 0;

        /* Seek before the first play and again on every loop, so the offset
           survives instead of snapping back to 0. */
        const seek = () => {
          if (!offset || !Number.isFinite(node.duration)) return;
          node.currentTime = offset % node.duration;
        };

        if (node.readyState >= 1) seek();
        node.addEventListener("loadedmetadata", seek);
        node.addEventListener("ended", seek);
        cleanups.push(() => {
          node.removeEventListener("loadedmetadata", seek);
          node.removeEventListener("ended", seek);
        });

        void node.play().catch(() => {
          /* autoplay can be refused; the poster frame stands in */
        });
      } else {
        node.pause();
      }
    });

    return () => {
      cleanups.forEach((fn) => fn());
      nodes.forEach((node) => node?.pause());
    };
  }, [active, reduced, tabs]);

  return (
    <section className="bg-b-white py-20 lg:py-28" aria-labelledby={`${baseId}-heading`}>
      <div className="b-shell flex flex-col items-center">
        <motion.h2
          id={`${baseId}-heading`}
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.55, ease: EASE_OUT_QUINT }}
          className="max-w-[840px] text-center font-b-serif text-[32px] font-medium leading-[35.2px] tracking-[-0.64px] text-b-ink sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px] lg:text-[50px] lg:leading-[55px] lg:tracking-[-1px]"
        >
          {heading}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_QUINT }}
          className="mt-10 w-full lg:mt-12"
        >
          {/* The bar scrolls rather than wrapping so 390px never pushes the page wide. */}
          <div
            role="tablist"
            aria-label={heading}
            className="-mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:justify-center sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab, index) => {
              const isActive = index === active;
              return (
                <button
                  key={tab.label}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(index)}
                  aria-selected={isActive}
                  aria-controls={panelId(index)}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    "b-press relative isolate inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full px-5 text-[16px] font-medium leading-[24px] whitespace-nowrap",
                    isActive ? "text-b-white" : "text-b-muted hover:text-b-ink",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId={`${baseId}-pill`}
                      aria-hidden
                      className="absolute inset-0 -z-10 rounded-full bg-b-ink"
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 36, mass: 0.9 }
                      }
                    />
                  ) : null}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {tabs.map((tab, index) => {
            const src = CLIP_SRC[tab.clip];
            const caption = CLIP_CAPTION[tab.clip];

            return (
              <div
                key={tab.label}
                role="tabpanel"
                id={panelId(index)}
                aria-labelledby={tabId(index)}
                hidden={index !== active}
                tabIndex={0}
                className="mt-10 lg:mt-12"
              >
                {/* Warm grey, measurably lighter than the page behind it. */}
                <div className="mx-auto w-full max-w-[1116px] rounded-[24px] bg-[#E8E6E3] p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
                    <div className="w-full min-w-0 lg:max-w-[300px]">
                      <h3 className="text-[20px] font-bold leading-[26px] text-b-ink">
                        {listHeading}
                      </h3>

                      {tab.courses.length > 0 ? (
                        <ul className="mt-5 flex flex-col gap-3">
                          {tab.courses.map((course) => (
                            <li
                              key={course}
                              className="text-[16px] font-normal leading-[24px] text-[#000000]"
                            >
                              {course}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {tab.additional ? (
                        <p className="mt-5 text-[16px] leading-[24px]">
                          {/* dotted rule, not text-decoration — matches the reference */}
                          <span className="border-b border-dotted border-[rgba(0,0,0,0.4)] text-[rgba(0,0,0,0.4)]">
                            {tab.additional}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full min-w-0 shrink-0 lg:w-[633px]">
                      <div className="overflow-hidden rounded-[20px] bg-b-white">
                        <video
                          ref={(node) => {
                            videoRefs.current[index] = node;
                          }}
                          width={CLIP_W}
                          height={CLIP_H}
                          className="block h-auto w-full"
                          poster={src.poster}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-hidden
                        >
                          <source src={src.webm} type="video/webm" />
                        </video>

                        {caption ? (
                          <p className="px-5 py-4 text-[16px] font-medium leading-[24px] text-b-ink">
                            {caption}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
