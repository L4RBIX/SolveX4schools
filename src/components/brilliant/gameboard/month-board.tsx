"use client";

import type { Locale, TrackLevel } from "@schools/curriculum/types";
import type { MonthOutline } from "@schools/curriculum/public";
import { monthToGameboard } from "@schools/presentation/adapters";
import { L, lessonsLabel, t, tasksLabel } from "@schools/presentation/labels";
import { monthTheme } from "@schools/presentation/month-theme";
import { useLocale } from "@/components/sx/i18n";
import { useProgress } from "@/lib/progress";
import { AppHeader } from "../app/app-header";
import { accountMenu } from "../app/account-menu";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "../app/school-chrome";
import { CourseGameboard } from "./course-gameboard";
import { TrackSwitch } from "./track-switch";

/**
 * A month, rendered on the cloned course gameboard.
 *
 * The board itself is untouched: sticky per-level headers, the zig-zag node
 * path, click-to-select swapping a node's static SVG for its Rive canvas, the
 * IntersectionObserver that hides the footer CTA while its own node is on
 * screen, and the scroll-to-top. Units became levels and lessons became nodes;
 * the monthly assessment became the `review` node that closes the last level,
 * which is exactly what a `review` node already meant.
 *
 * The one addition is the track switch above the first level. It sits here
 * rather than in the lesson player because a route is a property of the MONTH
 * — the programme is explicit that a learner can be advanced in loops and
 * support in binary search — and because the choice has to be visible before
 * the first lesson opens, not buried inside one. `track` arrives as a prop:
 * the cookie is read by `resolveTrack` on the server, so this component never
 * has to guess what the payload it is about to receive was filtered by.
 */
export function MonthBoard({
  month,
  track,
  leagues = false,
}: {
  month: MonthOutline;
  track: TrackLevel;
  leagues?: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const progress = useProgress();

  const loc = locale as Locale;
  const theme = monthTheme(month.index);
  const { course, levels } = monthToGameboard(month, progress, loc, {
    lessons: (n) => lessonsLabel(n, loc),
    tasks: (n) => tasksLabel(n, loc),
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

      <CourseGameboard
        course={{ ...course, activeHref: course.activeHref }}
        levels={levels}
        currentLevel={1}
        labels={{
          level: loc === "kk" ? "Бөлім" : "Раздел",
          start: t(L.start, loc),
          jumpHere: t(L.jumpHere, loc),
          scrollTop: loc === "kk" ? "Жоғарыға" : "Наверх",
          done: loc === "kk" ? "Аяқталды" : "Пройдено",
        }}
        ownMascot
        /* Month identity. The board paints five scoped custom properties from
           this and nothing else on the page changes colour.

           `monthLabel` is resolved here because `CourseGameboard` is shared
           with the reference baseline and has no locale. It comes from the
           theme rather than from `month.monthName` on purpose: the registry's
           copy is the one a surface holding only an index can reach, and a test
           asserts the two are identical, so using it is what keeps that
           assertion honest rather than decorative. */
        theme={theme}
        monthLabel={t(theme.name, loc)}
        /* The reference puts nothing above its first level header, so the
           track switch lives in the left column beside the course card, where
           course-level meta belongs. Below `lg` that column is hidden, so the
           same control is rendered above the board instead — one instance is
           visible at any width. */
        asideExtra={
          <TrackSwitch monthIndex={month.index} track={track} locale={loc} />
        }
        beforeBoard={
          <div className="w-full lg:hidden">
            <TrackSwitch monthIndex={month.index} track={track} locale={loc} />
          </div>
        }
      />
    </div>
  );
}
