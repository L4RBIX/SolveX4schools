"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import {
  EVIDENCE_TONE,
  evidenceLabel,
  type EvidenceState,
  type SkillEvidence,
} from "@schools/presentation/evidence";
import { L, t } from "@schools/presentation/labels";
import {
  dayRange,
  monthShort,
  monthYear,
  numericDateTime,
  weekdayShort,
} from "@schools/presentation/dates";
import { useLocale } from "@/components/sx/i18n";
import { NovaAvatar } from "@/components/nova/nova-avatar";
import { AppHeader } from "./app-header";
import { accountMenu } from "./account-menu";
import { ErrorDictionary } from "./error-dictionary";
import { ReviewQueue } from "./review-queue";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "./school-chrome";

/**
 * /you — the learner's own page.
 *
 * ## Adapted, not rebuilt
 *
 * This is `you-dashboard.tsx` — the measured clone of brilliant.org/you — with
 * its numbers replaced by evidence the learner actually produced. Same 1216px
 * column, same `gap: 32px; padding: 32px` shell, same 48px section rhythm, same
 * card construction (`rounded-[20px] border-2 border-b-fg/20`), same 161px
 * plot with its 2px stub for a zero bar, same sr-only data table beside the
 * chart. The period arrows and the Week/Month/Year control are the reference's
 * own controls — the difference is that here they query a real window.
 *
 * ## What is deliberately gone
 *
 * `Assessment accuracy 0.0%`. The reference shows it; we cannot. A percentage
 * needs difficulty calibration, and most failures here carry no attributed
 * cause, so the decimal would be a number invented to look like measurement.
 *
 * Koji. The summary card keeps its gradient and its shape; the character on it
 * is Nova.
 *
 * The two fabricated strength cards. `Resilience` and `Initiative` shipped with
 * hardcoded counts. The section below renders a card only where a count backs
 * it, and renders nothing at all when nothing does.
 *
 * ## What is deliberately still here
 *
 * The count of failures with no known cause. It is the honest denominator for
 * everything else on the page, and hiding it would let a reader over-trust the
 * rest.
 */

const PERIODS = ["week", "month", "year"] as const;
type Period = (typeof PERIODS)[number];

/** Measured from the live plot. */
const PLOT_H = 161;

interface Bucket {
  bucket: string;
  attempted: number;
  solvedSolo: number;
  solvedAssisted: number;
  activeMinutes: number;
  helpRequests: number;
}

interface ActivityPayload {
  period: Period;
  offset: number;
  fromIso: string;
  toIso: string;
  grain: "day" | "month";
  buckets: Bucket[];
}

interface StatePayload {
  hasState: boolean;
  computedAt: string | null;
  summary: {
    episodes: number;
    soloSolved: number;
    assistedSolved: number;
    interventions: number;
    unexplainedFailures: number;
  };
  skills: SkillEvidence[];
}

export function SchoolYou() {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;

  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);

  const state = useJson<StatePayload>("/api/learning/state/me");
  const activity = useJson<ActivityPayload>(
    `/api/learning/activity?period=${period}&offset=${offset}`,
  );

  // Changing the window resets the arrows; otherwise "3 weeks back" silently
  // becomes "3 years back" when the learner switches to Year.
  const choosePeriod = useCallback((p: Period) => {
    setPeriod(p);
    setOffset(0);
  }, []);

  return (
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <AppHeader
        active="you"
        links={SCHOOL_NAV(loc)}
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

      <main className="mx-auto w-full max-w-[1216px]">
        <div className="flex flex-col items-start gap-8 px-6 py-8 sm:p-8">
          <div>
            <h1 className="text-[32px] leading-[42px] font-bold">{t(L.yourProgress, loc)}</h1>
            <p className="mt-1 text-b-fg/60">{t(L.progressSub, loc)}</p>
          </div>

          {/* ---- period header ------------------------------------------ */}
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <div className="flex shrink-0 items-center gap-1">
              <PeriodArrow
                direction="prev"
                label={t(L.periodPrev, loc)}
                onClick={() => setOffset((o) => o - 1)}
              />
              <span className="text-left text-b-fg/60 tabular-nums">
                {activity.data
                  ? windowLabel(activity.data, loc)
                  : " "}
              </span>
              <PeriodArrow
                direction="next"
                label={t(L.periodNext, loc)}
                /* There is no data in the future. The reference ships both
                   arrows disabled on the current period; ours disables only
                   the one that would leave the record. */
                disabled={offset >= 0}
                onClick={() => setOffset((o) => Math.min(0, o + 1))}
              />
            </div>

            <div
              role="radiogroup"
              aria-label={t(L.reportPeriod, loc)}
              /* The track is the page ground, not `b-elevated`: in the light
                 theme `b-elevated` and `b-bg` are both white, so the selected
                 pill would be white on white and the control would look
                 disabled. */
              className="flex shrink-0 gap-1 rounded-full bg-sx-page p-1"
            >
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={period === p}
                  onClick={() => choosePeriod(p)}
                  className={cn(
                    "flex h-[37px] min-w-[60px] cursor-pointer items-center justify-center rounded-full px-3 py-2 text-[14px] leading-[21px]",
                    "transition-[background-color,box-shadow,color] duration-150 ease-out",
                    period === p
                      ? "bg-b-bg text-b-fg shadow-[var(--shadow-soft)]"
                      : "text-b-fg/40 hover:text-b-fg/70",
                  )}
                >
                  {t(PERIOD_LABEL[p], loc)}
                </button>
              ))}
            </div>
          </div>

          {/* ---- sections ------------------------------------------------ */}
          <div className="flex w-full flex-col gap-12">
            {activity.failed || state.failed ? (
              <LoadFailed
                loc={loc}
                onRetry={() => {
                  activity.retry();
                  state.retry();
                }}
              />
            ) : (
              <>
                <PeriodSummary data={activity.data} loc={loc} />
                <ActivitySnapshot
                  activity={activity.data}
                  unexplained={state.data?.summary.unexplainedFailures ?? null}
                  loc={loc}
                />
                <Skills skills={state.data?.skills ?? null} loc={loc} />
                {/* «Жеке қателер журналы» (PDF). Reads its own endpoint rather
                    than a slice of this page's state: the dictionary is the
                    learner's document and it writes, which is a different
                    lifecycle from two read-only windows that reset together
                    when the period control moves. */}
                <ErrorDictionary loc={loc} />
                {/* «Қайталау» — the programme's fifth independence check (PDF
                    p.6). Its own endpoint for the same reason the dictionary
                    has one: the queue changes when a task is solved with help,
                    not when the period control above it moves. */}
                <ReviewQueue loc={loc} />
                <Observations data={activity.data} loc={loc} />
              </>
            )}
          </div>

          {state.data?.computedAt ? (
            <p className="text-[13px] text-b-fg/30">
              {t(L.lastComputed, loc)}:{" "}
              {numericDateTime(loc, new Date(state.data.computedAt))}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}

const PERIOD_LABEL = {
  week: L.periodWeek,
  month: L.periodMonth,
  year: L.periodYear,
} as const;

/* -------------------------------------------------------------------------- */
/* fetching                                                                    */

/**
 * One JSON read, with the three states a screen in front of a class actually
 * needs: pending, failed-with-a-way-back, and loaded. `null` data plus no
 * failure is the skeleton; there is no fourth state where the page shows zeroes
 * it has not read.
 */
function useJson<T>(url: string) {
  const [result, setResult] = useState<Result<T>>({ url, data: null, failed: false });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: T) => live && setResult({ url, data: d, failed: false }))
      .catch(() => live && setResult({ url, data: null, failed: true }));
    return () => {
      live = false;
    };
  }, [url, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  /* Derived, not reset from an effect. Clearing state in the effect body would
     paint one frame of the OLD period's numbers under the NEW period's header —
     a chart that briefly lies is worse than one that briefly waits. */
  return result.url === url
    ? { ...result, retry }
    : { url, data: null, failed: false, retry };
}

interface Result<T> {
  url: string;
  data: T | null;
  failed: boolean;
}

/* -------------------------------------------------------------------------- */
/* sections                                                                    */

function LoadFailed({ loc, onRetry }: { loc: Locale; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] sx-card border-2 border-b-fg/20 p-9">
      <p className="text-b-fg/60">{t(L.loadFailed, loc)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-11 shrink-0 cursor-pointer rounded-full border-2 border-b-fg/20 px-5 font-medium transition-colors hover:border-b-fg/40"
      >
        {t(L.retry, loc)}
      </button>
    </div>
  );
}

/**
 * The reference's green summary card: vertical gradient `#004E16 → #001F09`,
 * 176px minimum, character hanging off the left edge.
 *
 * Every sentence in it is assembled from the period's own counts. When the
 * period is empty it says so in one line rather than manufacturing an
 * encouragement, because a card that congratulates a learner for a week they
 * did not study is the exact thing a director notices.
 */
function PeriodSummary({ data, loc }: { data: ActivityPayload | null; loc: Locale }) {
  if (!data) return <Skeleton className="min-h-[176px]" />;

  const solo = sum(data.buckets, (b) => b.solvedSolo);
  const assisted = sum(data.buckets, (b) => b.solvedAssisted);
  const minutes = sum(data.buckets, (b) => b.activeMinutes);
  const days = data.buckets.filter((b) => b.attempted > 0).length;

  const lines: string[] = [];
  if (days > 0) lines.push(sentenceDays(days, minutes, loc));
  if (solo + assisted > 0) lines.push(sentenceSolved(solo, assisted, loc));
  if (lines.length === 0) lines.push(t(L.summaryEmpty, loc));

  return (
    <section
      className="relative min-h-[176px] overflow-hidden rounded-[20px] border-2 border-b-fg/20 p-9"
      /* `light-dark()` rather than the reference's fixed pair. The dark arm is
         its measured gradient; the light arm is a pale wash of the same hue,
         because a near-black green card sits under `text-b-fg` — which is dark
         ink in the light theme — and the heading became unreadable. */
      style={{
        backgroundImage:
          "linear-gradient(light-dark(#e8f4ec, #004E16) 0%, light-dark(#dcecdf, #001F09) 100%)",
      }}
    >
      <div className="flex items-start gap-6">
        <div className="flex w-[263px] shrink-0 flex-col justify-center gap-1">
          <h2 className="text-[24px] leading-[30px] font-bold">{t(L.summaryTitle, loc)}</h2>
          <span className="text-[14px] leading-[21px] text-b-fg/60">
            {windowLabel(data, loc)}
          </span>
        </div>
        <ul role="list" className="min-w-px flex-1 list-disc pl-6">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {/* Nova stands where Koji did. The reference hangs its character off the
          card's left edge at top:98; Nova is a sphere rather than a tall
          character, so she sits on the corner instead of overlapping the copy. */}
      <div className="pointer-events-none absolute right-6 bottom-4 hidden sm:block">
        <NovaAvatar state={days > 0 ? "proud" : "idle"} size={72} />
      </div>
    </section>
  );
}

function ActivitySnapshot({
  activity,
  unexplained,
  loc,
}: {
  activity: ActivityPayload | null;
  unexplained: number | null;
  loc: Locale;
}) {
  return (
    <section className="flex flex-col items-stretch gap-6">
      <SectionHeading>{t(L.activitySnapshot, loc)}</SectionHeading>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label={t(L.solvedSolo, loc)}
            value={activity && sum(activity.buckets, (b) => b.solvedSolo)}
            tone="text-b-green-2"
          />
          <StatTile
            label={t(L.solvedAssisted, loc)}
            value={activity && sum(activity.buckets, (b) => b.solvedAssisted)}
          />
          <StatTile
            label={t(L.minutesPractised, loc)}
            value={activity && sum(activity.buckets, (b) => b.activeMinutes)}
          />
          {/* Shown, never folded away — see the note at the top of this file. */}
          <StatTile
            label={t(L.unexplained, loc)}
            value={unexplained}
            tone="text-b-fg/50"
            hint={t(L.unexplainedHint, loc)}
          />
        </div>
        <SolvedChart data={activity} loc={loc} />
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number | null;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[107px] min-w-px flex-1 flex-col items-start justify-center gap-2 rounded-[20px] sx-card border-2 border-b-fg/20 px-6 py-4">
      <span className="text-[14px] leading-[21px] text-b-fg/60">{label}</span>
      {value === null ? (
        <span className="h-[37.5px] w-12 animate-pulse rounded bg-b-fg/10" />
      ) : (
        <span className={cn("text-[30px] leading-[37.5px] font-bold tabular-nums", tone)}>
          {value}
        </span>
      )}
      {hint ? <span className="text-[13px] leading-4 text-b-fg/40">{hint}</span> : null}
    </div>
  );
}

/**
 * The chart is plain DOM, not a charting library — one absolutely-positioned
 * gridline per tick, a flex row of columns, one bar each.
 *
 * Two things carried over verbatim from the measurement: a zero value paints a
 * **2px stub** rather than nothing, and the same numbers are exposed as a real
 * `<table>` for screen readers. Two things are ours: bars are stacked
 * solo-over-assisted, because the distinction between the two is the whole
 * point of the independence model, and the y axis is derived from the data
 * rather than pinned at 8.
 */
function SolvedChart({ data, loc }: { data: ActivityPayload | null; loc: Locale }) {
  if (!data) return <Skeleton className="h-[300px]" />;

  const peak = Math.max(...data.buckets.map((b) => b.solvedSolo + b.solvedAssisted), 0);
  const yMax = niceCeiling(peak);
  const ticks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  return (
    <div className="rounded-[20px] sx-card border-2 border-b-fg/20">
      <div className="flex flex-col items-stretch gap-8 px-5 py-6 sm:px-8">
        <div className="flex flex-col items-start">
          <h3 className="text-[20px] leading-[25px] font-bold">{t(L.solvedChart, loc)}</h3>
          <p className="text-[14px] leading-[21px] text-b-fg/60">{windowLabel(data, loc)}</p>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: "auto 1fr" }} aria-hidden="true">
          {/* y axis */}
          <div className="relative text-[12px] leading-[18px]" style={{ height: PLOT_H }}>
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute translate-y-[9px] text-b-fg/60 tabular-nums"
                style={{ top: PLOT_H - (tick / yMax) * PLOT_H - 18 }}
              >
                {tick}
              </span>
            ))}
          </div>

          {/* plot */}
          <div className="min-w-px">
            <div className="relative" style={{ height: PLOT_H }}>
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute w-full border-t border-b-fg/5"
                  style={{ top: PLOT_H - (tick / yMax) * PLOT_H }}
                />
              ))}
              <div className="absolute inset-0 flex items-end justify-between gap-px">
                {data.buckets.map((b) => {
                  const empty = b.solvedSolo + b.solvedAssisted === 0;
                  return (
                    <div key={b.bucket} className="flex min-w-px flex-1 flex-col justify-end">
                      <div
                        className="mx-auto w-full max-w-[56px] rounded-t bg-b-chart"
                        style={{ height: (b.solvedAssisted / yMax) * PLOT_H }}
                      />
                      <div
                        className={cn(
                          "mx-auto w-full max-w-[56px] bg-b-green-2",
                          b.solvedAssisted === 0 && "rounded-t",
                        )}
                        style={{ height: (b.solvedSolo / yMax) * PLOT_H }}
                      />
                      {/* The reference paints a 2px stub on a zero day. Kept —
                          an empty column with nothing at its base reads as a
                          rendering failure — but in the neutral rule colour,
                          not the solo green: a green sliver on a day nobody
                          studied is a bar chart claiming a fraction of a task. */}
                      {empty ? <div className="mx-auto h-0.5 w-full max-w-[56px] rounded-t bg-b-fg/15" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex">
              {data.buckets.map((b, i) => (
                <span
                  key={b.bucket}
                  className="min-w-px flex-1 overflow-hidden text-center text-[12px] leading-[18px] text-ellipsis whitespace-nowrap text-b-fg/60"
                >
                  {axisLabel(b.bucket, data.grain, data.period, i, loc)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* legend — the stack means nothing without it */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-b-fg/60">
          <LegendKey className="bg-b-green-2" label={t(L.chartColSolo, loc)} />
          <LegendKey className="bg-b-chart" label={t(L.chartColAssisted, loc)} />
        </div>

        {/* the reference exposes the same data as a real table; so do we */}
        <table className="sr-only">
          <caption>{t(L.chartTableCaption, loc)}</caption>
          <thead>
            <tr>
              <th scope="col">{t(L.chartColDate, loc)}</th>
              <th scope="col">{t(L.chartColSolo, loc)}</th>
              <th scope="col">{t(L.chartColAssisted, loc)}</th>
            </tr>
          </thead>
          <tbody>
            {data.buckets.map((b) => (
              <tr key={b.bucket}>
                <td>{b.bucket}</td>
                <td>{b.solvedSolo}</td>
                <td>{b.solvedAssisted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LegendKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-sm", className)} aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * Skills, from the Learning Intelligence core.
 *
 * Not a percentage and not a bar — a state and one sentence built from the same
 * counts the engine used. `not_started` renders greyed with no sentence, which
 * is what "we have not measured this" should look like.
 */
function Skills({ skills, loc }: { skills: SkillEvidence[] | null; loc: Locale }) {
  return (
    <section className="flex flex-col items-stretch gap-6">
      <SectionHeading>{t(L.skillsTitle, loc)}</SectionHeading>
      {skills === null ? (
        <Skeleton className="h-40" />
      ) : skills.length === 0 ? (
        <p className="text-b-fg/60">{t(L.skillsEmpty, loc)}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {skills.map((s) => (
            <li key={s.skillId}>
              <div className="flex items-start gap-4 rounded-2xl sx-card border-2 border-b-fg/20 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[16px] leading-6 font-medium",
                      s.state === "not_started" ? "text-b-fg/40" : "text-b-fg",
                    )}
                  >
                    {s.title ? s.title[loc] : s.skillId}
                  </p>
                  {/* The localised summary, not the core's English sentence.
                      Both come from the same counts, so they cannot disagree. */}
                  {s.state !== "not_started" ? (
                    <p className="mt-1 text-[14px] leading-5 text-b-fg/50">{s.summary[loc]}</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[13px] leading-5 font-semibold tracking-wide uppercase",
                    EVIDENCE_TONE[s.state as EvidenceState],
                  )}
                >
                  {evidenceLabel(s.state, loc)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The reference's "learning strengths", rebuilt.
 *
 * It shipped two cards with hardcoded counts. Here a card exists only when a
 * count backs it, and the whole section disappears when none do — an empty
 * section heading reads as content that failed to load, and an invented
 * compliment reads as a product that does not know the learner.
 */
function Observations({ data, loc }: { data: ActivityPayload | null; loc: Locale }) {
  if (!data) return null;

  const solo = sum(data.buckets, (b) => b.solvedSolo);
  const afterHelp = sum(data.buckets, (b) => b.solvedAssisted);
  const days = data.buckets.filter((b) => b.attempted > 0).length;

  const cards: { key: string; title: string; body: string; chip: string; icon: React.ReactNode }[] =
    [];

  if (days >= 3) {
    cards.push({
      key: "persistence",
      title: t(L.strengthPersistence, loc),
      body:
        loc === "kk"
          ? `Осы кезеңде ${days} күн жұмыс істедің.`
          : `Ты занимался ${days} ${plural(days, "день", "дня", "дней")} за этот период.`,
      chip: "bg-b-green-deep text-b-ok-edge",
      icon: (
        <>
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </>
      ),
    });
  }

  /*
   * Asking for help, counted by what came of it.
   *
   * This card used to render unconditionally off `helpRequests` — the raw,
   * monotonic count of Nova interventions — and call it "the right move". Three
   * things were wrong with that, and they compound.
   *
   * It rewards the wrong number. `helpRequests` has no ceiling and no relation
   * to whether anything was learned, so the card grew every time a learner
   * clicked "hint", and grew fastest for the learner who was clicking instead
   * of thinking. The spec forbids that implication in as many words: more Nova
   * messages must never read as better learning.
   *
   * It said the opposite of the teacher's screen. The same underlying
   * assistance shows up in `schools/presentation/classroom.ts` as a
   * `high_assistance` concern — "% of solutions needed a strong hint". One
   * fourteen-year-old being congratulated for exactly what their teacher is
   * being warned about is not a difference in tone, it is the product
   * contradicting itself in front of the two people who have to talk to each
   * other about it.
   *
   * And the praise was unearned in the ordinary case. "You asked when you were
   * stuck" is only true if being stuck is what happened.
   *
   * So it is gated on an outcome instead: `solvedAssisted` counts episodes that
   * were ACCEPTED and had assistance in them — the learner asked, and then
   * finished the task. That is the honest half of the spec's "a solve that
   * followed the hint without further assistance"; the second half is not
   * computable from this payload, because the bucket query aggregates whole
   * episodes and does not carry what happened after the last hint. Reading it
   * would need a new shape from `/api/learning/activity`, which is not this
   * file's to change. The wording is kept factual for exactly that reason — it
   * reports the sequence, and leaves the compliment out.
   */
  if (afterHelp > 0) {
    cards.push({
      key: "help",
      title: t(L.strengthAsksForHelp, loc),
      body:
        loc === "kk"
          ? `Көмек сұрағаннан кейін ${afterHelp} есепті аяғына дейін шештің.`
          : `После подсказки ты довёл до конца ${afterHelp} ${plural(afterHelp, "задачу", "задачи", "задач")}.`,
      chip: "bg-b-lilac-deep text-b-lilac",
      icon: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
    });
  }

  if (solo > 0) {
    cards.push({
      key: "independence",
      title: t(L.strengthIndependence, loc),
      body:
        loc === "kk"
          ? `${solo} есепті ешкімнің көмегінсіз шештің.`
          : `${solo} ${plural(solo, "задачу", "задачи", "задач")} ты решил без подсказок.`,
      chip: "bg-b-green-deep text-b-ok-edge",
      icon: <path d="m4 12 5 5L20 6" />,
    });
  }

  if (cards.length === 0) return null;

  return (
    <section className="flex flex-col items-stretch gap-6">
      <SectionHeading>{t(L.strengthsTitle, loc)}</SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-5 rounded-2xl sx-card border-2 border-b-fg/20 p-7 sm:p-9"
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                c.chip,
              )}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {c.icon}
              </svg>
            </div>
            <div className="flex flex-col items-start gap-1">
              <h3 className="text-[20px] leading-[25px] font-bold">{c.title}</h3>
              <p className="text-b-fg/70">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* chrome                                                                      */

function PeriodArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center overflow-clip rounded-full border-2 border-transparent p-3 transition-colors",
        direction === "prev" ? "-ml-3" : "-mr-3",
        disabled
          ? "cursor-default text-b-fg/20"
          : "cursor-pointer text-b-fg/60 hover:text-b-fg",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.55239 4.39646L7.97424 2.97461L13.5 8.5004L7.97424 14.0262L6.55239 12.6043L9.65089 9.50584H2.5L2.5 7.49504H9.65098L6.55239 4.39646Z"
          fill="currentColor"
          transform={direction === "prev" ? "rotate(180 8 8)" : undefined}
        />
      </svg>
    </button>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[20px] leading-[25px] font-bold">{children}</h2>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[20px] border-2 border-b-fg/10 bg-b-fg/[0.03]", className)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* formatting                                                                  */

function sum<T>(rows: readonly T[], pick: (row: T) => number): number {
  return rows.reduce((n, row) => n + pick(row), 0);
}

/** A y axis that ends on a round number, and never on 0. */
function niceCeiling(peak: number): number {
  if (peak <= 4) return 4;
  return Math.ceil(peak / 4) * 4;
}


function windowLabel(data: ActivityPayload, loc: Locale): string {
  const from = new Date(data.fromIso);
  // `toIso` is exclusive; the label wants the last day inside the window.
  const last = new Date(new Date(data.toIso).getTime() - 86_400_000);

  if (data.period === "year") return String(from.getUTCFullYear());

  if (data.period === "month") return monthYear(loc, from);

  return dayRange(loc, from, last);
}

/**
 * Axis labels, thinned so they stay readable.
 *
 * A week gets all seven weekday initials; a month has 28–31 columns, which is
 * far too many to label, so every fifth day carries its number and the rest are
 * blank; a year gets twelve short month names.
 */
function axisLabel(
  bucket: string,
  grain: "day" | "month",
  period: Period,
  index: number,
  loc: Locale,
): string {
  if (grain === "month") {
    return monthShort(loc, Number(bucket.slice(5, 7)) - 1).replace(".", "");
  }

  const date = new Date(`${bucket}T00:00:00Z`);

  if (period === "week") {
    return weekdayShort(loc, date);
  }

  const dayOfMonth = date.getUTCDate();
  return index === 0 || dayOfMonth % 5 === 0 ? String(dayOfMonth) : "";
}

/**
 * The minutes clause is dropped when the figure is zero.
 *
 * `active_seconds` is the reducer's own number and an episode that is still
 * open has none yet, so "you studied 2 days, 0 minutes in total" is a true
 * sentence that reads as a broken one. Saying less is the honest fix; inventing
 * a duration is not.
 */
function sentenceDays(days: number, minutes: number, loc: Locale): string {
  if (loc === "kk") {
    return minutes > 0
      ? `${days} күн жұмыс істедің, барлығы ${minutes} минут.`
      : `${days} күн жұмыс істедің.`;
  }
  const d = `Ты занимался ${days} ${plural(days, "день", "дня", "дней")}`;
  return minutes > 0
    ? `${d}, всего ${minutes} ${plural(minutes, "минуту", "минуты", "минут")}.`
    : `${d}.`;
}

function sentenceSolved(solo: number, assisted: number, loc: Locale): string {
  if (loc === "kk") {
    return assisted > 0
      ? `${solo} есепті өз бетіңше, ${assisted} есепті көмекпен шештің.`
      : `${solo} есепті өз бетіңше шештің.`;
  }
  const soloText = `${solo} ${plural(solo, "задачу", "задачи", "задач")} самостоятельно`;
  return assisted > 0
    ? `Решено: ${soloText} и ${assisted} ${plural(assisted, "задача", "задачи", "задач")} с помощью.`
    : `Решено: ${soloText}.`;
}

/**
 * Russian needs three plural forms. Kazakh does not inflect after a numeral,
 * which is why every caller above branches on locale before reaching this.
 */
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
