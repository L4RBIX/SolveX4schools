"use client";

import type { Locale } from "@schools/curriculum/types";
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
 * ## The month-direction switch is gone
 *
 * This board used to carry «Осы айдағы бағытың» — Қолдау / Негізгі /
 * Тереңдетілген — under the course card, with a second copy above the board on
 * narrow screens. It has been removed from the product on the owner's
 * instruction, and removed properly: no hidden element holding its height, no
 * mobile twin left behind, and no state written by a control nobody can see.
 *
 * What is NOT removed is the track underneath it. `resolveTrack` still decides
 * which blocks a lesson payload carries, the curriculum still authors
 * `tracks: ["support"]` on the tasks that have it, and every learner is on the
 * `core` default unless something server-side says otherwise. Deleting that
 * would change what a learner is given; deleting the control only changes who
 * chooses it.
 */
export function MonthBoard({
  month,
  completed,
  leagues = false,
}: {
  month: MonthOutline;
  /**
   * Lessons the SERVER records as finished.
   *
   * The board's ticks used to come from `localStorage` alone, so a second
   * device showed an empty year to a learner who had finished September.
   * `useProgress` unions this with the local copy — see there for why it is a
   * union and not a replacement.
   */
  completed?: readonly string[];
  leagues?: boolean;
}) {
  const { locale, setLocale } = useLocale();
  const progress = useProgress(completed);

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
        /* Nothing under the course card any more.
           The month-direction switch lived here — «Осы айдағы бағытың», three
           levels and two sentences of explanation — and it is gone from the
           product: the left column now ends where the month's own description
           and counts end. `CourseGameboard` keeps `asideExtra` and
           `beforeBoard`, which the reverse-engineering baseline uses; this
           surface simply passes neither. */
      />
    </div>
  );
}
