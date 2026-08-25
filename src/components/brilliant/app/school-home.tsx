"use client";

import type { Locale, Month } from "@schools/curriculum/types";
import { monthsToDeck } from "@schools/presentation/adapters";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { useProgress } from "@/lib/progress";
import { AppHeader } from "./app-header";
import { CourseDeck } from "./course-deck";
import { HomeRail } from "./home-rail";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "./school-chrome";

/**
 * The student home.
 *
 * This is the cloned home page — the same rail, the same 3D perspective card
 * stack, the same thumbnail switcher — fed by the curriculum instead of by
 * `app-data.ts`. Nothing about the layout was redesigned; the months simply
 * arrived where the courses used to be.
 *
 * ## Numbers shown here are real or absent
 *
 * The streak is 0 and the weekly goal reads from the programme's own commitment
 * (~40 minutes of platform practice a week, PDF p.2). No XP league, no accuracy
 * percentage, no mastery score. Every figure on this screen is either something
 * the learner actually did or something the curriculum actually promises.
 */
export function SchoolHome({
  months,
  learnerName,
}: {
  months: Month[];
  learnerName: string;
}) {
  const { locale, setLocale } = useLocale();
  const progress = useProgress();
  const loc = locale as Locale;

  const deck = monthsToDeck(months, progress, loc);

  return (
    <div className="min-h-dvh bg-b-bg font-b-sans text-white">
      <AppHeader
        active="home"
        links={SCHOOL_NAV(loc)}
        homeHref="/"
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />

      <div className="mx-auto flex w-full max-w-[1216px] gap-8 px-8 pt-6">
        <HomeRail
          name={learnerName}
          streak={0}
          labels={{
            welcome: t(L.welcome, loc),
            askPlaceholder: t(L.askPlaceholder, loc),
            ask: t(L.ask, loc),
            streakPrompt: t(L.streakPrompt, loc),
          }}
          goal={{
            eyebrow: t(L.practiceGoal, loc),
            detail: `0 ${t(L.practiceOf, loc)} 40 ${t(L.minutes, loc)}`,
          }}
        />

        <CourseDeck
          courses={deck}
          heading={t(L.jumpBackIn, loc)}
          startLabel={t(L.start, loc)}
        />
      </div>
    </div>
  );
}
