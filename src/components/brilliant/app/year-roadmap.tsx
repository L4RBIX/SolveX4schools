"use client";

import type { Locale, Month } from "@schools/curriculum/types";
import { programmeToLearningPath } from "@schools/presentation/adapters";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { useProgress } from "@/lib/progress";
import { AppHeader } from "./app-header";
import { LearningPathsPage } from "./learning-paths";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "./school-chrome";

/**
 * The year, on the cloned Learning Paths runtime.
 *
 * One path with nine ordered tiles, not nine sibling paths. That is the honest
 * shape: the months are a route, not a menu — month 5 depends on month 2 —
 * and rendering them as siblings would say a learner picks between them.
 *
 * The horizontal tile carousel, the category art, the per-tile progress bars
 * and the favourite star are all the original's.
 */
export function YearRoadmap({ months }: { months: Month[] }) {
  const { locale, setLocale } = useLocale();
  const progress = useProgress();

  const loc = locale as Locale;
  const path = programmeToLearningPath(months, progress, loc, {
    title: t(L.programme, loc),
    eyebrow: t(L.foundational, loc),
    sub: t(L.programmeSub, loc),
    grade: t(L.grade9, loc),
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
      <LearningPathsPage
        paths={[path]}
        labels={{
          title: t(L.yearRoadmap, loc),
          subtitle: t(L.yearRoadmapSub, loc),
          yours: t(L.yourPath, loc),
          others: "",
          askPlaceholder: t(L.askPlaceholder, loc),
          ask: t(L.ask, loc),
        }}
      />
    </div>
  );
}
