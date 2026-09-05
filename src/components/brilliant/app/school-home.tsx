"use client";

import type { Locale } from "@schools/curriculum/types";
import type { MonthOutline } from "@schools/curriculum/public";
import { monthsToDeck } from "@schools/presentation/adapters";
import { useEffect, useState } from "react";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { useProgress } from "@/lib/progress";
import { AppHeader } from "./app-header";
import { accountMenu } from "./account-menu";
import { CourseDeck } from "./course-deck";
import { HomeRail } from "./home-rail";
import { FirstRun } from "./first-run";
import { HomeLeagueCard, type HomeLeagueData } from "./league/home-league-card";
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
interface Week {
  startIso: string;
  activeDays: string[];
  activeMinutes: number;
  goalMinutes: number;
}

/** Real activity, or nothing. There is no placeholder shape. */
function useWeeklyActivity(): Week | null {
  const [week, setWeek] = useState<Week | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/learning/state/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { week?: Week } | null) => live && d?.week && setWeek(d.week))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return week;
}

/**
 * Monday through Sunday, in the learner's language.
 *
 * The reference ships English abbreviations — T W Th F S — and five of them,
 * because it counts a five-day streak. A school week is seven days and this one
 * is read in Kazakh or Russian.
 */
function weekDays(locale: Locale, activeDays: string[]) {
  const labels =
    locale === "kk"
      ? ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"]
      : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const now = new Date();
  const dow = (now.getUTCDay() + 6) % 7;
  const monday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dow);
  const active = new Set(activeDays);

  return labels.map((label, i) => {
    const d = new Date(monday + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    return { label, done: active.has(key) };
  });
}

export function SchoolHome({
  months,
  learnerName = null,
  unlockedThrough,
  leagues = false,
  league = null,
  completed,
}: {
  months: MonthOutline[];
  /** `null` until enrolment exists. See HomeRailProps.name. */
  learnerName?: string | null;
  /**
   * The highest month index this learner may enter.
   *
   * Resolved on the SERVER by `unlockStateForSubject` and passed down as a
   * number. This component cannot work it out: `useProgress()` is localStorage
   * and the policy needs the ledger, and `schools/policies/unlock.ts` documents
   * what happens when the rule is handed a presentation-layer projection —
   * `demonstrated` becomes true everywhere and the whole year opens.
   */
  unlockedThrough: number;
  /**
   * Lessons the SERVER records as finished.
   *
   * The deck's "Start"/"Continue" copy and its month progress came from
   * `localStorage` alone, so a learner on a second device was told to start a
   * lesson they had finished. `useProgress` unions this with the local copy —
   * see there for why it is a union and not a replacement.
   */
  completed?: readonly string[];
  /** Does this learner's school have a league? `leagueNavVisible`, server-side. */
  leagues?: boolean;
  /** The league card's data, or null when this school has no league. */
  league?: HomeLeagueData | null;
}) {
  const { locale, setLocale } = useLocale();
  const progress = useProgress(completed);
  const loc = locale as Locale;
  const week = useWeeklyActivity();

  const deck = monthsToDeck(months, progress, loc, unlockedThrough);

  return (
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <FirstRun />
      <AppHeader
        active="home"
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

      {/* The rail is `hidden lg:flex`, so below 1024 this is a single column
          and the horizontal padding drops to 16 rather than 32. */}
      <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-8 px-4 pt-6 sm:px-8 lg:flex-row">
        <HomeRail
          stackOnMobile
          name={learnerName}
          /* Days active this week, counted from real episodes. Zero is an
             honest zero — the rail used to show a hardcoded one. */
          streak={week?.activeDays.length ?? 0}
          days={weekDays(loc, week?.activeDays ?? [])}
          labels={{
            welcome: t(L.welcome, loc),
            welcomeAnonymous: t(L.welcomeAnonymous, loc),
            streakPrompt:
              (week?.activeDays.length ?? 0) > 0
                ? t(L.weekActive, loc)
                : t(L.weekNothingYet, loc),
            daysLabel: t(L.thisWeek, loc),
          }}
          goal={{
            eyebrow: t(L.practiceGoal, loc),
            /* "0 минут из 40 мин" says the unit twice. Built per locale so
               each reads like the language it is in. */
            detail:
              loc === "kk"
                ? `${week?.goalMinutes ?? 40} ${t(L.minutes, loc)} ішінен ${week?.activeMinutes ?? 0}`
                : `${week?.activeMinutes ?? 0} из ${week?.goalMinutes ?? 40} ${t(L.minutes, loc)}`,
          }}
          /* Only when this school actually has a league. `leagues` and `league`
             are resolved by the same server predicate, so a card cannot appear
             without a page behind it, and the nav tab cannot appear without the
             card. */
          extra={leagues && league ? <HomeLeagueCard data={league} /> : null}
        />

        <CourseDeck
          courses={deck}
          heading={t(L.jumpBackIn, loc)}
          startLabel={t(L.start, loc)}
          lockedLabels={{
            reason: t(L.monthLockedTitle, loc),
            /* The rule, in the product's own canonical words — the same pair
               the month board shows. The deck used to say only "closed" and
               made a learner open another page to find out why. */
            body: t(L.monthLockedBody, loc),
            cta: t(L.deckLockedCta, loc),
            row: t(L.deckLockedRow, loc),
          }}
          /* Not Brilliant's green: green means "correct" in this player and the
             marker only means "you are here". It was the literal `#a78bfa` —
             one violet for all nine months, and the same value in both themes.
             `--sx-month-accent` is scoped per card by `CourseDeck`, so the
             marker now wears the month whose card is in front, and falls back
             to the product purple where a card has no month. */
          markerColor="var(--sx-month-accent, var(--color-b-purple))"
        />
      </div>
    </div>
  );
}
