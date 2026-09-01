"use client";

import type { Locale } from "@schools/curriculum/types";
import type { MonthOutline } from "@schools/curriculum/public";
import { programmeToLearningPath } from "@schools/presentation/adapters";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { useProgress } from "@/lib/progress";
import { AppHeader } from "./app-header";
import { accountMenu } from "./account-menu";
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
export function YearRoadmap({
  months,
  leagues = false,
}: {
  months: MonthOutline[];
  leagues?: boolean;
}) {
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
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <AppHeader
        active="courses"
        links={SCHOOL_NAV(loc, leagues)}
        homeHref="/home"
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        /* No XP in this product. The one real weekly number lives on the home
           rail, where it has room to say what it counts. */
        xp={null}
        a11y={{
          menu: loc === "kk" ? "Мәзір" : "Меню",
          streak: loc === "kk" ? "Осы аптадағы белсенділік" : "Активность на этой неделе",
        }}
        accountMenu={accountMenu(loc)}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />
      <LearningPathsPage
        paths={[path]}
        labels={{
          title: t(L.yearRoadmap, loc),
          subtitle: t(L.yearRoadmapSub, loc),
          yours: t(L.yourPath, loc),
          others: "",
          prev: t(L.carouselPrev, loc),
          next: t(L.carouselNext, loc),
        }}
        showStar={false}
      />
    </div>
  );
}
