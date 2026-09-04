"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import { L, t as translate } from "@schools/presentation/labels";
import { numericDate, numericDateTime } from "@schools/presentation/dates";
import {
  isTeacherPeriod,
  TEACHER_PERIODS,
  type ClassContext,
  type Freshness,
  type TeacherPeriod,
} from "@schools/teacher/contracts";
import { TL } from "@schools/teacher/labels";
import { EXTRA, pendingEvents } from "@schools/teacher/labels-extra/shell";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { INK, LINE, MOTION, RADIUS, SHELL, TYPE } from "./tokens";
import { AppHeader } from "@/components/brilliant/app/app-header";
import { accountMenu } from "@/components/brilliant/app/account-menu";
import { LocaleSwitch, SolveXWordmark } from "@/components/brilliant/app/school-chrome";
import { Chip, Hint } from "./ui";

/**
 * The teacher command centre's chrome.
 *
 * ## What it fixes
 *
 * The old teacher page had **no header at all** — a teacher could not switch
 * language, reach settings, or sign out from the one screen they use in front of
 * a class. It also printed the raw `class_id` («grade-9a») and never the
 * school's own name for the class, and it said nothing about how old its numbers
 * were. All four are chrome problems, so all four are fixed here rather than
 * six times over in the pages.
 *
 * ## Why class and period live in the URL
 *
 * `?class=&period=` rather than component state, so a view survives a refresh,
 * can be bookmarked, and can be pasted to a colleague — «посмотри 9А за месяц»
 * is a link, not a set of instructions. The pages read the same two values
 * through `useTeacherView()`, so there is exactly one resolution of "which class
 * am I looking at" on the screen.
 *
 * ## Freshness is not decoration
 *
 * Every cumulative number on this dashboard comes from `learner_state`, which
 * only moves when the reducer sweeps. A surface that does not say so invites a
 * teacher to read the past as the present, so the line is always rendered —
 * including, loudly, when the sweep is behind.
 */

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */

interface TeacherTab {
  id: string;
  href: string;
  label: Localized;
}

const TABS: readonly TeacherTab[] = [
  { id: "overview", href: "/teacher", label: TL.navOverview },
  { id: "students", href: "/teacher/students", label: TL.navStudents },
  { id: "skills", href: "/teacher/skills", label: TL.navSkills },
  { id: "lessons", href: "/teacher/lessons", label: TL.navLessons },
  { id: "assessments", href: "/teacher/assessments", label: TL.navAssessments },
  { id: "leaderboard", href: "/teacher/leaderboard", label: TL.navLeaderboard },
];

const PERIOD_LABEL: Record<TeacherPeriod, Localized> = {
  week: TL.periodWeek,
  month: TL.periodMonth,
  programme: TL.periodProgramme,
};

/* -------------------------------------------------------------------------- */
/* The view a page is looking at                                              */
/* -------------------------------------------------------------------------- */

/** One class this teacher actually teaches. `className` is «9А», never the id. */
export interface TeacherClassOption {
  classId: string;
  /** `school_classes.name`. The server has it; the old panel threw it away. */
  className: string;
}

export interface TeacherViewValue {
  classId: string;
  className: string;
  period: TeacherPeriod;
  /**
   * The curriculum month the teacher asked for, or null for "my class's own".
   *
   * Null is the normal case and the right default: the server derives the
   * lowest month at least half the class has not finished. This exists because
   * a teacher revisiting October in December has a real reason to, and because
   * the previous behaviour — one global month for the whole deployment — gave
   * a September class a May dashboard with no way to say otherwise.
   *
   * In the URL beside `class` and `period`, and in `query`, so every panel
   * moves together. A month that lived in one panel's state would produce the
   * failure this replaces in miniature: an overview describing September beside
   * a lesson table describing May.
   */
  month: number | null;
  setMonth: (next: number | null) => void;
  setPeriod: (next: TeacherPeriod) => void;
  setClassId: (next: string) => void;
  /**
   * Hand the chrome the context and freshness from a page's own payload.
   *
   * Every teacher endpoint returns both, so the shell does not fetch them a
   * seventh time — the page that already has them reports them up. Safe to call
   * from a `fetch` handler; it is a plain state write and it is stable across
   * renders.
   */
  report: (next: { context?: ClassContext | null; freshness?: Freshness | null }) => void;
  /** `class=…&period=…` for building an API URL or a link. */
  query: string;
}

const TeacherViewContext = createContext<TeacherViewValue | null>(null);

/**
 * The class and period the teacher is looking at, plus the reporting channel.
 *
 * Only valid inside `<TeacherShell>`, which is where every teacher page renders.
 */
export function useTeacherView(): TeacherViewValue {
  const value = useContext(TeacherViewContext);
  if (!value) {
    throw new Error("useTeacherView must be used inside TeacherShell");
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

export interface TeacherShellProps {
  /**
   * Every class this teacher teaches, from `class_teachers` on the server.
   *
   * There is no picker that could be pointed somewhere else: a class that is not
   * in this array is not selectable, and the API answers 404 for it regardless.
   */
  classes: readonly TeacherClassOption[];
  /**
   * The class context, when a server component already has it.
   *
   * Client pages leave this unset and call `report()` from their fetch instead.
   */
  context?: ClassContext | null;
  freshness?: Freshness | null;
  children: ReactNode;
}

export function TeacherShell({
  classes,
  context: contextProp,
  freshness: freshnessProp,
  children,
}: TeacherShellProps) {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;
  const t = useCallback((value: Localized) => translate(value, loc), [loc]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [reported, setReported] = useState<{
    context: ClassContext | null;
    freshness: Freshness | null;
  }>({ context: null, freshness: null });

  const report = useCallback(
    (next: { context?: ClassContext | null; freshness?: Freshness | null }) => {
      setReported((prev) => ({
        context: next.context !== undefined ? next.context : prev.context,
        freshness: next.freshness !== undefined ? next.freshness : prev.freshness,
      }));
    },
    [],
  );

  /* A `?class=` naming a class this teacher does not teach falls back to the
     first one rather than being passed to the API — the guard would answer 404
     anyway, and a 404 for a typo in a bookmark is a worse screen than the right
     class. */
  const requestedClass = searchParams.get("class");
  const classId =
    classes.find((c) => c.classId === requestedClass)?.classId ?? classes[0]?.classId ?? "";
  const className =
    classes.find((c) => c.classId === classId)?.className ?? reported.context?.className ?? "";

  const requestedPeriod = searchParams.get("period");
  const period: TeacherPeriod = isTeacherPeriod(requestedPeriod) ? requestedPeriod : "week";

  /* A month index, or null. Validated against the nine the curriculum has;
     whether a given one is SERVABLE is the server's answer, and it falls back
     to the class's own month rather than erroring on a stale bookmark. */
  const requestedMonthParam = Number(searchParams.get("month"));
  const month =
    Number.isInteger(requestedMonthParam) && requestedMonthParam >= 1 && requestedMonthParam <= 9
      ? requestedMonthParam
      : null;

  /** Only the three the whole surface shares. Page-local params stay page-local. */
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (classId) params.set("class", classId);
    params.set("period", period);
    if (month !== null) params.set("month", String(month));
    return params.toString();
  }, [classId, period, month]);

  /* Navigating keeps every other query parameter — the leaderboard's `lens`
     must survive a period change on the leaderboard page. */
  const navigate = useCallback(
    (patch: { class?: string; period?: TeacherPeriod; month?: number | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.class !== undefined) params.set("class", patch.class);
      if (patch.period !== undefined) params.set("period", patch.period);
      if (patch.month !== undefined) {
        /* Removed rather than set to a sentinel: absent means "my class's own
           month", which is a different statement from any particular month and
           has to survive a bookmark. */
        if (patch.month === null) params.delete("month");
        else params.set("month", String(patch.month));
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const view = useMemo<TeacherViewValue>(
    () => ({
      classId,
      className,
      period,
      month,
      setMonth: (next) => navigate({ month: next }),
      setPeriod: (next) => navigate({ period: next }),
      setClassId: (next) => navigate({ class: next }),
      report,
      query,
    }),
    [classId, className, period, month, navigate, report, query],
  );

  const context = contextProp ?? reported.context ?? null;
  const freshness = freshnessProp ?? reported.freshness ?? null;

  return (
    <TeacherViewContext.Provider value={view}>
      <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
        <AppHeader
          /* A teacher is not on one of the three learner tabs, so nothing in the
             nav is highlighted — and there is no nav: `links={[]}` leaves the
             account menu and the language switch, which are the two controls
             this surface was missing entirely. */
          active="home"
          links={[]}
          homeHref="/teacher"
          wordmark={<SolveXWordmark />}
          wordmarkLabel={t(L.brand)}
          accentPill={null}
          xp={null}
          a11y={{ menu: t(L.menu), streak: t(L.thisWeek) }}
          accountMenu={accountMenu(loc)}
          trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
        />

        {/*
          ONE control bar.

          The first build stacked seven bands here — an eyebrow, a 32px class
          name, a month chip, a publication chip, a labelled period row, a
          freshness sentence and the tabs — about 250px before a single fact
          about a child, repeated identically on all seven routes. On a 768px
          viewport that was a third of the screen spent re-stating what the
          teacher knew when they clicked.

          Two rows now. Identity and controls on the first, navigation and
          freshness on the second. Sticky, because the class and the period are
          exactly what you lose track of halfway down a thirty-row table.
        */}
        <div
          className={cn(
            "sticky top-0 z-30 border-b",
            LINE.edge,
            "border-b-fg/15 bg-b-panel/95 backdrop-blur-sm",
          )}
        >
          <div className={SHELL}>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className={cn(TYPE.page, INK.primary)}>
                  {className || t(EXTRA.noClassSelected)}
                </h1>
                {context ? <MonthChip context={context} loc={loc} /> : null}
                {context ? <CurriculumChip context={context} loc={loc} /> : null}
                {/* The approval bypass. A chip, not the band it used to be: it
                    outranked the attention queue. It never renders in
                    production — `gateFor` only sets the flag outside it — and
                    it says «демонстрация» rather than «режим разработки»,
                    because the person reading it is a teacher and what matters
                    to them is that the safeguard is off, not what engineering
                    calls the build. */}
                {context?.curriculum.bypassedForDevelopment ? (
                  <span className="inline-flex items-center gap-2">
                    <Chip tone="warn">{t(EXTRA.devMode)}</Chip>
                    {/* A different question from the gate chip's «Почему?»
                        beside it — that one asks why the material is closed,
                        this one asks what the demo changes. Two identical
                        disclosures side by side read as a repeat. */}
                    <Hint label={t(EXTRA.whatDemoChanges)}>
                      <p>{t(TL.curriculumDevBypass)}</p>
                    </Hint>
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {classes.length > 1 ? (
                  <Segmented
                    label={t(TL.classLabel)}
                    value={classId}
                    options={classes.map((c) => ({ value: c.classId, label: c.className }))}
                    onChange={(next) => view.setClassId(next)}
                  />
                ) : null}
                <Segmented
                  label={t(TL.periodLabel)}
                  value={period}
                  options={TEACHER_PERIODS.map((p) => ({ value: p, label: t(PERIOD_LABEL[p]) }))}
                  onChange={(next) => view.setPeriod(next)}
                />
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
              {/* `min-w-0`, and the whole tab bar depends on it.

                  This nav is a flex item, and a flex item's `min-width` is
                  `auto` — it refuses to shrink below its content. So the six
                  tabs measured 520px wide inside a 375px phone, the `ul`'s
                  `overflow-x-auto` never had a narrower box to scroll inside,
                  and the nav pushed the whole document instead: every teacher
                  page scrolled sideways at 375px, the header and the tables
                  drifting off with it.

                  `overflow-x-auto` on the child is not enough on its own and
                  never was — it only clips once something upstream is allowed
                  to be narrower than the content. */}
              <nav aria-label={t(EXTRA.sections)} className="min-w-0 max-w-full">
                <ul className="-mb-px flex gap-0.5 overflow-x-auto">
                  {TABS.map((tab) => {
                    const active =
                      tab.href === "/teacher"
                        ? pathname === "/teacher"
                        : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                    return (
                      <li key={tab.id} className="shrink-0">
                        <Link
                          href={query ? `${tab.href}?${query}` : tab.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative block rounded-t-[7px] px-3 py-2.5",
                            TYPE.body,
                            "whitespace-nowrap",
                            MOTION.base,
                            active
                              ? cn("font-semibold", INK.primary)
                              : cn(INK.muted, "hover:text-b-fg hover:bg-b-fg/[0.04]"),
                          )}
                        >
                          {t(tab.label)}
                          {active ? (
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-b-purple"
                            />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <FreshnessLine freshness={freshness} loc={loc} />
            </div>
          </div>
        </div>

        <main className={cn(SHELL, "pt-8 pb-20")}>{children}</main>
      </div>
    </TeacherViewContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Context bar pieces                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A segmented control.
 *
 * `radiogroup` with `aria-checked`, the construction `SettingsChoice` uses: the
 * browser gives arrow-key movement for free once the roles are right, and three
 * one-word options are faster to read and to hit than a dropdown.
 */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    /* The visible caps label is gone. «7 күн / Ағымдағы ай / Бүкіл курс» says
       what it is; «КЕЗЕҢ» above it was a caption on a self-describing control,
       and it cost a row of height on every route. It survives as the
       radiogroup's accessible name, which is where a screen reader wants it. */
    <div className="flex items-center">
      <div
        role="radiogroup"
        aria-label={label}
        className={cn("flex w-fit gap-0.5 border border-b-fg/15 p-0.5", RADIUS.pill)}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "cursor-pointer whitespace-nowrap px-3 py-1.5",
              RADIUS.pill,
              TYPE.body,
              MOTION.base,
              value === option.value
                ? "bg-b-fg font-medium text-b-bg"
                : cn(INK.secondary, "hover:bg-b-fg/[0.06] hover:text-b-fg"),
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Which curriculum month this screen is describing, and a way to change it.
 *
 * ## Why it became a control
 *
 * It was a read-only chip over a number that was wrong for every class: the
 * highest month the DEPLOYMENT had published, which the pilot runbook sets to
 * nine in one act. A September class was analysed as May — every lesson at
 * zero, required work 0 of 168, the review queue empty — and there was nothing
 * on screen to say so or to get out of it.
 *
 * The number is now derived from the class's own completions. This is the
 * escape hatch: a teacher revisiting October in December has a real reason to,
 * and the default stays "my class's month" so that leaving it alone is the
 * right answer for everyone else.
 *
 * A native `<select>`, deliberately. It is one of the few controls a teacher
 * will use on a phone in a corridor, it is keyboard-operable without any work
 * on our part, and this surface has no design language for a custom listbox
 * that would be worth the accessibility debt.
 */
function MonthChip({ context, loc }: { context: ClassContext; loc: Locale }) {
  const { month, setMonth } = useTeacherView();
  const options = context.availableMonths;

  return (
    <Chip tone="neutral">
      <label className="sr-only" htmlFor="teacher-month">
        {translate(TL.monthPickerLabel, loc)}
      </label>
      <select
        id="teacher-month"
        value={month === null ? "" : String(month)}
        onChange={(e) => setMonth(e.target.value === "" ? null : Number(e.target.value))}
        className={cn(
          "cursor-pointer bg-transparent tabular-nums outline-none",
          MOTION.base,
          "focus-visible:ring-2 focus-visible:ring-b-fg/40",
        )}
      >
        {/* First, and selected when nothing was asked for. The label names the
            CLASS rather than a month, because that is what it means. */}
        <option value="">{translate(TL.monthAuto, loc)}</option>
        {options.map((m) => (
          <option key={m.index} value={m.index}>
            {translate(TL.monthLabel, loc)} {m.index} · {translate(m.title, loc)}
          </option>
        ))}
      </select>
      {/* A separator, not content — but it takes the muted token like
          everything else, so there is one grey scale on this surface. */}
      <span aria-hidden="true" className={INK.muted}>
        ·
      </span>
      {/* The month actually being described, whether it was chosen or derived.
          Rendered beside the control rather than inside it so that "my class's
          month" still tells a teacher WHICH month that is. */}
      <span>
        {context.monthIndex} · {translate(context.monthTitle, loc)}
      </span>
    </Chip>
  );
}

/**
 * The curriculum gate.
 *
 * Three approval states and one separate fact — whether the month is actually
 * being served. They are separate because content can be signed off and still
 * not published, and a chip that merged them would let a teacher read «Утверждено»
 * as «ученики это видят».
 *
 * `bypassedForDevelopment` is NOT rendered here. It is a band across the page,
 * because it means a development build opened content that production would
 * refuse, and a demo that tucks that into a pill is a demo that lies.
 */
function CurriculumChip({ context, loc }: { context: ClassContext; loc: Locale }) {
  const { approval, open, approvedAt } = context.curriculum;
  const approved = approval === "approved";
  const label = approved
    ? TL.curriculumApproved
    : approval === "lapsed"
      ? TL.curriculumLapsed
      : TL.curriculumNeverReviewed;
  /*
   * The reason, one keypress away.
   *
   * The chip used to carry both halves — «Не проверено — ученикам не
   * открывается» — which is two internal facts joined by a dash. A teacher
   * needs the consequence first, in their own words; WHY the approval is
   * missing is a second question, and it is the sort a teacher asks once.
   */
  const why = approved
    ? null
    : approval === "lapsed"
      ? TL.curriculumLapsedWhy
      : TL.curriculumNeverReviewedWhy;
  const tone = approved ? "ok" : "warn";

  return (
    <span
      className="inline-flex flex-wrap items-center gap-2"
      aria-label={translate(EXTRA.curriculumStatus, loc)}
    >
      <Chip tone={tone}>
        {translate(label, loc)}
        {approved && approvedAt ? (
          <span className="tabular-nums opacity-70">
            {numericDate(loc, new Date(approvedAt))}
          </span>
        ) : null}
      </Chip>
      {why ? (
        <Hint label={translate(EXTRA.why, loc)}>
          <p>{translate(why, loc)}</p>
        </Hint>
      ) : null}
      {/* Whether students can see the month is a SEPARATE fact from whether it
          was approved, and it is driven by `open` alone. Gating this on
          `approved` as well meant a demo build — where the gate is bypassed and
          `open` is true without approval — showed an approval chip a teacher
          read as "closed", above an assessment chip that said "open". */}
      {!open ? <Chip tone="lock">{translate(EXTRA.curriculumClosed, loc)}</Chip> : null}
    </span>
  );
}

/**
 * How old the numbers are.
 *
 * Always rendered, in three shapes: never swept, swept and behind, swept and
 * current. The explanation sentence stays on all three — «итоговые числа на
 * момент последнего расчёта» is the sentence that keeps a teacher from reading a
 * stale projection as live, and it is not less true on a good day.
 */
function FreshnessLine({ freshness, loc }: { freshness: Freshness | null; loc: Locale }) {
  if (!freshness) {
    /* The chrome renders before a page's fetch resolves. A reserved line keeps
       the tab row from jumping under the pointer when it lands. */
    return <p className="h-[30px]" aria-hidden="true" />;
  }

  const { lastSweepAt, behind } = freshness;
  const stamp = lastSweepAt ? numericDateTime(loc, new Date(lastSweepAt)) : null;
  const wrong = behind || !stamp;

  return (
    <div className="flex items-center gap-1.5 pb-1">
      <span className={cn(TYPE.meta, wrong ? "font-medium text-b-warn-icon" : INK.muted)}>
        {stamp ? (
          <>
            {translate(TL.computedAt, loc)} <span className="tabular-nums">{stamp}</span>
          </>
        ) : (
          translate(TL.freshnessNever, loc)
        )}
        {behind ? ` · ${translate(TL.freshnessBehind, loc)}` : ""}
      </span>
      {/*
        The explanation moves into a disclosure.

        «Жиынтық сандар соңғы есептеу сәтіне сай» is the sentence that stops a
        teacher reading a stale projection as live — it has to stay reachable,
        and it does not have to occupy a row on every route forever. The
        timestamp beside it is the part that changes.
      */}
      <Hint label={translate(EXTRA.whatIsThis, loc)}>
        <p>{translate(TL.freshnessExplain, loc)}</p>
        {freshness.pendingEvents > 0 ? (
          <p className="mt-1.5 tabular-nums">
            {translate(pendingEvents(freshness.pendingEvents), loc)}
          </p>
        ) : null}
      </Hint>
    </div>
  );
}
