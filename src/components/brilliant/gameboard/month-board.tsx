"use client";

import type { Locale, Month } from "@schools/curriculum/types";
import { monthToGameboard } from "@schools/presentation/adapters";
import { L, lessonsLabel, t, tasksLabel } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { useProgress } from "@/lib/progress";
import { AppHeader } from "../app/app-header";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "../app/school-chrome";
import { CourseGameboard } from "./course-gameboard";

/**
 * A month, rendered on the cloned course gameboard.
 *
 * The board itself is untouched: sticky per-level headers, the zig-zag node
 * path, click-to-select swapping a node's static SVG for its Rive canvas, the
 * IntersectionObserver that hides the footer CTA while its own node is on
 * screen, and the scroll-to-top. Units became levels and lessons became nodes;
 * the monthly assessment became the `review` node that closes the last level,
 * which is exactly what a `review` node already meant.
 */
export function MonthBoard({ month }: { month: Month }) {
  const { locale, setLocale } = useLocale();
  const progress = useProgress();

  const loc = locale as Locale;
  const { course, levels } = monthToGameboard(month, progress, loc, {
    lessons: (n) => lessonsLabel(n, loc),
    tasks: (n) => tasksLabel(n, loc),
  });

  return (
    <div className="min-h-dvh bg-b-bg font-b-sans text-white">
      <AppHeader
        active="courses"
        links={SCHOOL_NAV(loc)}
        homeHref="/home"
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />

      <CourseGameboard
        course={{ ...course, activeHref: course.activeHref }}
        levels={levels}
        currentLevel={1}
        labels={{
          level: loc === "kk" ? "Бөлім" : "Раздел",
          start: t(L.start, loc),
          jumpHere: t(L.jumpHere, loc),
        }}
      />
    </div>
  );
}
