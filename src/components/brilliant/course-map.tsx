"use client";

import { ChevronUp } from "lucide-react";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import {
  type CourseData,
  FRACTIONS_COURSE,
} from "@/components/brilliant/courses-data";
import { CourseCard } from "@/components/brilliant/course-card";
import { LessonNode } from "@/components/brilliant/lesson-node";
import { LevelPill } from "@/components/brilliant/level-pill";
import { cn } from "@/lib/utils";

/**
 * The `/courses/<slug>` half of the page: a pinned course card on the left and
 * a snaking column of lesson nodes on the right.
 *
 * Level pills are scroll-driven, never clicked. Each level section owns its own
 * `position: sticky` pill, so the browser handles the pin/unpin hand-off, and an
 * IntersectionObserver watching a thin band across the middle of the viewport
 * decides which of them is highlighted.
 */

/** Loose zig-zag the reference walks the column through, in px. */
const NODE_OFFSETS = [-28, 24, 0, 32, -20, 8];

export interface CourseMapProps {
  course?: CourseData;
  className?: string;
}

export function CourseMap({
  course = FRACTIONS_COURSE,
  className,
}: CourseMapProps) {
  const [activeLevel, setActiveLevel] = useState<string>(course.levels[0].id);
  const [openNode, setOpenNode] = useState<string | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const visibility = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const sections = Array.from(
      column.querySelectorAll<HTMLElement>("[data-level-id]"),
    );
    if (sections.length === 0) return;

    const order = sections
      .map((section) => section.dataset.levelId)
      .filter((id): id is string => Boolean(id));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.levelId;
          if (id) visibility.current[id] = entry.isIntersecting;
        }
        const first = order.find((id) => visibility.current[id]);
        if (first) setActiveLevel(first);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [course.levels]);

  const toggleNode = useCallback((id: string) => {
    setOpenNode((previous) => (previous === id ? null : id));
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <section
      aria-labelledby="course-map-title"
      className={cn("b-shell-narrow", className)}
    >
      <h2
        id="course-map-title"
        className="text-[30px] leading-9 font-bold text-white"
      >
        Course map
      </h2>

      <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[487px_minmax(0,1fr)] lg:gap-16">
        <div className="lg:self-stretch">
          <CourseCard course={course} className="lg:sticky lg:top-24" />
        </div>

        <div ref={columnRef} className="flex flex-col lg:ps-8">
          {course.levels.map((level) => (
            <section
              key={level.id}
              data-level-id={level.id}
              aria-label={`Level ${level.index}: ${level.title}`}
              className="mb-16 last:mb-0 lg:mb-20"
            >
              <div className="sticky top-20 z-20 flex justify-center bg-b-dark py-3 lg:justify-start">
                <LevelPill
                  index={level.index}
                  title={level.title}
                  active={activeLevel === level.id}
                />
              </div>

              <div className="mt-10 flex flex-col items-center gap-14 pb-6 lg:mt-14 lg:items-start lg:gap-[88px] lg:pb-8">
                {level.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    style={
                      {
                        "--node-x": `${NODE_OFFSETS[index % NODE_OFFSETS.length]}px`,
                      } as CSSProperties
                    }
                    className="w-full max-w-[468px] lg:max-w-none lg:translate-x-[var(--node-x)]"
                  >
                    <LessonNode
                      node={node}
                      open={openNode === node.id}
                      onToggle={() => toggleNode(node.id)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="b-press sticky bottom-6 z-30 flex size-12 shrink-0 items-center justify-center self-start rounded-full border-2 border-white/20 bg-b-dark text-white hover:border-white/40 active:shadow-none"
          >
            <ChevronUp aria-hidden="true" className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}
