"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Locale, Month } from "@schools/curriculum/types";
import { LocaleProvider, UI, useLocale } from "./i18n";
import { Chip } from "./primitives";
import {
  IconArrowRight,
  IconBook,
  IconCheck,
  IconLock,
  IconTarget,
} from "./icons";

/**
 * The year.
 *
 * Nine months, September to May, in a single vertical spine. Not a grid: the
 * programme is a sequence and the shape should say so — month 5 depends on
 * month 2, and a grid quietly denies that.
 *
 * ## Honesty rule
 *
 * A month whose lessons are still `draft` says so, in words, and cannot be
 * opened. It is not dressed as "coming soon" and it is not hidden. A parent or
 * teacher looking at this screen in October must be able to see exactly how
 * much of the year exists, because they are paying for the year.
 */

export interface MonthMapProps {
  months: Month[];
  /** 1-based index of the month the class is currently in. */
  currentMonth: number;
  initialLocale?: Locale;
}

export function MonthMap(props: MonthMapProps) {
  return (
    <LocaleProvider initial={props.initialLocale ?? "kk"}>
      <MonthMapInner {...props} />
    </LocaleProvider>
  );
}

type MonthState = "ready" | "draft" | "locked";

function stateOf(month: Month, currentMonth: number): MonthState {
  const built = month.units.some((u) =>
    u.lessons.some((l) => l.status !== "draft" && l.blocks.length > 0),
  );
  if (!built) return "draft";
  return month.index <= currentMonth ? "ready" : "locked";
}

function MonthMapInner({ months, currentMonth }: MonthMapProps) {
  const { t, locale, setLocale } = useLocale();

  return (
    <div className="sx-root min-h-dvh">
      <header className="border-b border-sx-line">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-sx-micro font-semibold tracking-[0.14em] text-sx-text-3 uppercase">
              SolveX4Schools
            </p>
            <h1 className="mt-1 text-sx-h3 font-semibold">
              {t({
                kk: "Спорттық бағдарламалау",
                ru: "Спортивное программирование",
              })}
            </h1>
          </div>

          <div className="flex overflow-hidden rounded-sx-sm border border-sx-line">
            {(["kk", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={locale === code}
                className={cn(
                  "h-9 w-10 cursor-pointer text-sx-micro font-bold uppercase transition-colors",
                  locale === code
                    ? "bg-sx-primary text-white"
                    : "text-sx-text-3 hover:text-sx-text",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <ol className="relative flex flex-col gap-3">
          {/* The spine. Behind the cards, so the year reads as one line. */}
          <span
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-[27px] w-px bg-sx-line-strong"
          />

          {months.map((month) => (
            <MonthRow
              key={month.index}
              month={month}
              state={stateOf(month, currentMonth)}
              isCurrent={month.index === currentMonth}
            />
          ))}
        </ol>
      </main>
    </div>
  );
}

function MonthRow({
  month,
  state,
  isCurrent,
}: {
  month: Month;
  state: MonthState;
  isCurrent: boolean;
}) {
  const { t } = useLocale();

  const lessonCount = month.units.reduce((n, u) => n + u.lessons.length, 0);

  const marker = {
    ready: {
      Icon: isCurrent ? IconTarget : IconCheck,
      className: isCurrent
        ? "border-sx-primary bg-sx-primary text-white"
        : "border-sx-correct/50 bg-sx-correct-soft text-sx-correct",
    },
    draft: {
      Icon: IconBook,
      className: "border-sx-line-strong bg-sx-surface text-sx-text-3",
    },
    locked: {
      Icon: IconLock,
      className: "border-sx-line-strong bg-sx-surface text-sx-text-3",
    },
  }[state];

  const body = (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-start gap-4 rounded-sx-lg border p-4",
        "transition-[border-color,background-color] duration-200",
        state === "ready"
          ? "border-sx-line bg-sx-surface hover:border-sx-line-strong"
          : "border-sx-line/60 bg-sx-surface/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sx-micro font-semibold tracking-wide text-sx-text-3 uppercase">
            {month.index}. {t(month.monthName)}
          </span>
          {isCurrent ? (
            <Chip tone="core">{t({ kk: "Ағымдағы ай", ru: "Текущий месяц" })}</Chip>
          ) : null}
          {state === "draft" ? (
            <Chip tone="unknown">{t(UI.inProgress)}</Chip>
          ) : null}
        </div>

        <h2
          className={cn(
            "mt-1 text-sx-lead font-semibold",
            state === "ready" ? "text-sx-text" : "text-sx-text-2",
          )}
        >
          {t(month.title)}
        </h2>

        <p className="mt-2 line-clamp-2 text-sx-meta leading-relaxed text-sx-text-2">
          {t(month.endOfMonthCapability)}
        </p>

        <p className="sx-tabular mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sx-small text-sx-text-3">
          <span>
            {lessonCount} {t(UI.lessons)}
          </span>
          <span>
            {month.expectedTaskCount} {t(UI.tasks)}
          </span>
          <span>
            {month.practiceHours} / {month.theoryHours} {t({ kk: "сағат", ru: "часов" })}
          </span>
        </p>
      </div>

      {state === "ready" ? (
        <IconArrowRight size={20} className="mt-1 shrink-0 text-sx-text-3" />
      ) : null}
    </div>
  );

  return (
    <li className="relative flex items-start gap-4">
      <span
        className={cn(
          "z-10 mt-4 grid size-14 shrink-0 place-items-center rounded-full border-2",
          marker.className,
        )}
      >
        <marker.Icon size={20} />
      </span>

      {state === "ready" ? (
        <Link href={`/month/${month.index}`} className="flex min-w-0 flex-1">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}
