"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ATTEMPT_BLOCK_TYPES, type Locale, type Month } from "@schools/curriculum/types";
import { LocaleProvider, UI, useLocale } from "./i18n";
import { Card, Chip } from "./primitives";
import {
  IconArrowLeft,
  IconArrowRight,
  IconClock,
  IconSpark,
  IconTarget,
} from "./icons";

/**
 * One month: what it teaches, its units, and its end-of-month check.
 *
 * The "what you will be able to do" line sits at the top rather than a list of
 * topic names, because that sentence is the one a 14-year-old can actually
 * evaluate themselves against. It is the programme's own wording (PDF p.11),
 * not a paraphrase.
 */
export function MonthDetail({
  month,
  initialLocale = "kk",
}: {
  month: Month;
  initialLocale?: Locale;
}) {
  return (
    <LocaleProvider initial={initialLocale}>
      <MonthDetailInner month={month} />
    </LocaleProvider>
  );
}

function MonthDetailInner({ month }: { month: Month }) {
  const { t } = useLocale();

  return (
    <div className="sx-root min-h-dvh">
      <header className="border-b border-sx-line">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-5 py-4">
          <Link
            href="/"
            aria-label={t(UI.back)}
            className="grid size-11 shrink-0 place-items-center rounded-sx-md text-sx-text-2 transition-colors hover:bg-sx-raised hover:text-sx-text"
          >
            <IconArrowLeft size={20} />
          </Link>
          <p className="text-sx-micro font-semibold tracking-wide text-sx-text-3 uppercase">
            {month.index}. {t(month.monthName)}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <h1 className="text-sx-h1 leading-tight font-semibold">{t(month.title)}</h1>

        <Card className="mt-6 border-sx-primary/25 bg-sx-primary-soft">
          <p className="flex items-center gap-2 text-sx-micro font-semibold tracking-wide text-sx-primary uppercase">
            <IconTarget size={14} />
            {t({ kk: "Ай соңында сен", ru: "К концу месяца ты" })}
          </p>
          <p className="mt-2 text-sx-body leading-relaxed">
            {t(month.endOfMonthCapability)}
          </p>
        </Card>

        <div className="mt-4 flex flex-wrap gap-3">
          <Stat
            label={t({ kk: "Практика", ru: "Практика" })}
            value={`${month.practiceHours} ${t({ kk: "сағат", ru: "ч" })}`}
          />
          <Stat
            label={t({ kk: "Түсіндіру", ru: "Объяснение" })}
            value={`${month.theoryHours} ${t({ kk: "сағат", ru: "ч" })}`}
          />
          <Stat
            label={t(UI.tasks)}
            value={String(month.expectedTaskCount)}
          />
        </div>

        {/* Units */}
        <div className="mt-10 flex flex-col gap-8">
          {month.units.map((unit) => (
            <section key={unit.id}>
              <h2 className="text-sx-micro font-semibold tracking-[0.14em] text-sx-text-3 uppercase">
                {t(unit.title)}
              </h2>

              <ul className="mt-3 flex flex-col gap-2">
                {unit.lessons.map((lesson) => {
                  const taskCount = lesson.blocks.filter((b) =>
                    ATTEMPT_BLOCK_TYPES.has(b.type),
                  ).length;
                  const ready = lesson.status !== "draft" && lesson.blocks.length > 0;

                  const inner = (
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-sx-md border p-4 transition-colors duration-200",
                        ready
                          ? "border-sx-line bg-sx-surface hover:border-sx-line-strong"
                          : "border-sx-line/60 bg-sx-surface/40",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-sx-meta font-semibold",
                            ready ? "text-sx-text" : "text-sx-text-2",
                          )}
                        >
                          {t(lesson.title)}
                        </p>
                        <p className="sx-tabular mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sx-small text-sx-text-3">
                          <span className="flex items-center gap-1">
                            <IconClock size={13} />
                            {lesson.estimatedMinutes} {t(UI.minutes)}
                          </span>
                          {taskCount > 0 ? (
                            <span>
                              {taskCount} {t(UI.tasks)}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      {ready ? (
                        <IconArrowRight size={18} className="shrink-0 text-sx-text-3" />
                      ) : (
                        <Chip tone="unknown">{t(UI.inProgress)}</Chip>
                      )}
                    </div>
                  );

                  return (
                    <li key={lesson.id}>
                      {ready ? (
                        <Link href={`/lesson/${lesson.id}`} className="block">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Assessment */}
        {month.assessment ? (
          <section className="mt-10">
            <h2 className="text-sx-micro font-semibold tracking-[0.14em] text-sx-text-3 uppercase">
              {t(UI.assessment)}
            </h2>
            <Card className="mt-3">
              <div className="flex items-start gap-3">
                <IconSpark size={20} className="mt-0.5 shrink-0 text-sx-advanced" />
                <div className="min-w-0">
                  <p className="text-sx-meta font-semibold">
                    {t(month.assessment.title)}
                  </p>
                  <p className="mt-2 text-sx-meta leading-relaxed text-sx-text-2">
                    {t(month.assessment.description)}
                  </p>
                  <p className="sx-tabular mt-3 flex items-center gap-1 text-sx-small text-sx-text-3">
                    <IconClock size={13} />
                    {month.assessment.minutes} {t(UI.minutes)}
                  </p>
                </div>
              </div>
            </Card>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-sx-md border border-sx-line bg-sx-surface px-4 py-3">
      <p className="text-sx-micro tracking-wide text-sx-text-3 uppercase">{label}</p>
      <p className="sx-tabular mt-1 text-sx-lead font-semibold">{value}</p>
    </div>
  );
}
