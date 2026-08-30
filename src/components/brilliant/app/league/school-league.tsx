"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import type { Locale, Localized } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";
import { AppHeader } from "../app-header";
import { accountMenu } from "../account-menu";
import { LocaleSwitch, SCHOOL_NAV_WITH_LEAGUE, SolveXWordmark } from "../school-chrome";
import { MovementMark, Stat, TierBadge, ZoneRule, formatRemaining, type Movement } from "./league-parts";

/**
 * /league — the weekly competition.
 *
 * ## What a learner must be able to answer in five seconds
 *
 * §19 lists six questions, and the layout is arranged around them rather than
 * around a grid:
 *
 *   1. What league am I in?        the badge and the name, top left, largest thing on the page
 *   2. How much XP this week?      first stat, in the accent colour
 *   3. What rank am I?             second stat
 *   4. Am I moving?                third stat, as a word — not only as a row position
 *   5. When does it reset?         fourth stat, in days
 *   6. How do I earn more?         the rules panel, open by default on desktop
 *
 * All six are above the fold at 1280 and in the first screen at 375.
 *
 * ## Adapted, not rebuilt
 *
 * Same 1216px column, same `px-6 py-8 sm:p-8` shell, same card construction —
 * `rounded-[20px] sx-card border-2 border-b-fg/20` — as `/you` and `/home`. The
 * `sx-*` type and radius scales are documented at length in `globals.css` and
 * are used by exactly one dev page; the student surface is built from measured
 * pixel values, and matching it matters more than matching a scale nothing else
 * follows.
 */

interface LadderTier {
  tier: number;
  name: string;
  hue: string;
}

interface Row {
  rank: number;
  name: string;
  weeklyXp: number;
  isYou: boolean;
  zone: Movement;
}

interface LeaguePayload {
  weekId: string;
  endsAt: string;
  tier: number;
  you: { rank: number; weeklyXp: number; zone: Movement } | null;
  rows: Row[];
  groupSize: number;
  zones: { promoteThrough: number; relegateFrom: number };
  ladder: LadderTier[];
  lastResult: {
    weekId: string;
    finalXp: number;
    rank: number;
    groupSize: number;
    tierBefore: number;
    movement: Movement;
    tierAfter: number;
  } | null;
  breakdown: { achievement: string; count: number; total: number }[];
  policy: { version: string; amounts: Record<string, number>; targetGroupSize: number };
}

export function SchoolLeague() {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;

  /* One state object rather than three, set ONCE per outcome.
     The obvious shape — `setFailed(false)` at the top of the effect, then
     `setData` or `setFailed(true)` when it resolves — is a synchronous setState
     inside an effect, which React 19 flags because it triggers a cascading
     render on every mount. Carrying the attempt number in the same object means
     the reset and the result are the same write, and a stale response can be
     recognised and dropped rather than racing a newer one. */
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    attempt: number;
    data: LeaguePayload | null;
    failed: boolean;
  }>({ attempt: 0, data: null, failed: false });

  useEffect(() => {
    let live = true;
    fetch("/api/league/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: LeaguePayload) => live && setState({ attempt, data: d, failed: false }))
      .catch(() => live && setState({ attempt, data: null, failed: true }));
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /* Derived, not reset in an effect — the same reasoning `/you`'s `useJson`
     records: a screen that briefly shows the previous attempt's numbers under a
     retry spinner is a screen that briefly lies. */
  const fresh = state.attempt === attempt;
  const data = fresh ? state.data : null;
  const failed = fresh && state.failed;

  return (
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <AppHeader
        active="league"
        links={SCHOOL_NAV_WITH_LEAGUE(loc)}
        homeHref="/home"
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        /* No bolt pill on this page. The XP number has a whole stat block of its
           own six inches below, and a second copy in the header would be the
           `0 ⚡` the header's own comment argues against — a counter repeated
           until it stops meaning anything. */
        xp={null}
        a11y={{
          menu: loc === "kk" ? "Мәзір" : "Меню",
          streak: loc === "kk" ? "Осы аптадағы белсенділік" : "Активность на этой неделе",
        }}
        accountMenu={accountMenu(loc)}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />

      <main className="mx-auto w-full max-w-[1216px]">
        <div className="flex flex-col gap-8 px-6 py-8 sm:p-8">
          <h1 className="text-[32px] leading-[42px] font-bold">{t(L.leagueTitle, loc)}</h1>

          {failed ? <Failed locale={loc} onRetry={retry} /> : null}
          {!failed && !data ? <Skeleton /> : null}
          {data ? <Loaded data={data} locale={loc} /> : null}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Loaded({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const tier = data.ladder.find((x) => x.tier === data.tier) ?? data.ladder[0];

  /* Read once on mount rather than on a ticking interval. The value is rendered
     in days and hours, so a timer would repaint the same string for an hour —
     and a live countdown is the urgency §44 forbids. */
  const [now] = useState(() => Date.now());

  return (
    <>
      <ResultBanner data={data} locale={locale} />

      <section
        className="rounded-[20px] sx-card border-2 border-b-fg/20 p-6 sm:p-7"
        aria-labelledby="league-now"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <TierBadge tier={tier.tier} name={tier.name} hue={tier.hue} size="lg" />
            <div className="min-w-0">
              <h2 id="league-now" className="text-[26px] leading-[32px] font-bold">
                {t(L.leagueOf, locale).replace("{name}", tier.name)}
              </h2>
              <p className="mt-0.5 text-[14px] leading-[20px] text-b-fg/55">
                {data.groupSize} {t(L.leagueGroupSize, locale)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:flex sm:items-start sm:gap-10">
            <Stat
              label={t(L.leagueXpThisWeek, locale)}
              value={String(data.you?.weeklyXp ?? 0)}
              suffix="XP"
              emphasis
            />
            <Stat
              label={t(L.leagueYourRank, locale)}
              value={data.you ? `${data.you.rank}` : "—"}
              suffix={data.you ? `/ ${data.groupSize}` : undefined}
            />
            <Stat
              label={t(L.leagueEndsIn, locale)}
              value={formatRemaining(data.endsAt, now, locale)}
            />
            {data.you ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[17px] leading-[38px] font-bold">
                  <MovementMark movement={data.you.zone} locale={locale} />
                  <span
                    className={cn(
                      data.you.zone === "promoted" && "text-b-ok-edge",
                      data.you.zone === "relegated" && "text-b-warn-edge",
                      data.you.zone === "stayed" && "text-b-fg/70",
                    )}
                  >
                    {t(
                      data.you.zone === "promoted"
                        ? L.leagueYouUp
                        : data.you.zone === "relegated"
                          ? L.leagueYouDown
                          : L.leagueYouStay,
                      locale,
                    )}
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] leading-[18px] text-b-fg/55">
                  {t(L.leagueYourZone, locale)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/*
        The board and the rules sit together because they answer the same
        question — "where am I this week, and how do I move" — and a learner
        reading a rank wants the earning table in the same glance.

        `minmax(0, 1fr)` rather than `1fr`: a grid item defaults to
        `min-width: auto`, which is its MIN-CONTENT width, and a long display
        name would otherwise refuse to shrink and push the rules panel past the
        viewport. §32 says the page must never scroll sideways; this is the
        declaration that makes that true rather than lucky.
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {data.you === null ? <NotStarted locale={locale} /> : <Board data={data} locale={locale} />}
          {data.you !== null && data.breakdown.length > 0 ? (
            <Breakdown data={data} locale={locale} />
          ) : null}
        </div>
        <div className="min-w-0">
          <Rules data={data} locale={locale} />
        </div>
      </div>

      {/*
        The ladder gets the FULL width, on its own row.
        Not a design preference — a correctness one. Ten tiles at 92px plus
        gaps is about 990px, and in a 1fr column beside a 340px panel it had
        740px to work with, so three tiers scrolled out of sight. The three that
        disappeared were Apex, Zenith and Singularity: the top of the ladder,
        which is the part that has to feel worth climbing. A progression whose
        summit is off-screen is not a progression.
      */}
      <Ladder data={data} locale={locale} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The board                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * An ordered list, not a table.
 *
 * A `<table>` would be defensible and is what the teacher console uses — but
 * that console has eight columns and a header row that a screen reader needs in
 * order to make sense of a cell. This has four fields and one of them is a
 * position, which is exactly what `<ol>` means. A list also degrades correctly
 * at 375, where a four-column table has to become a list anyway.
 */
function Board({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const rows = data.rows;
  const { promoteThrough, relegateFrom } = data.zones;

  return (
    <section
      className="rounded-[20px] sx-card border-2 border-b-fg/20 p-3 sm:p-4"
      aria-label={t(L.leagueTitle, locale)}
    >
      <ol className="flex flex-col">
        {rows.map((row, i) => {
          const prev = rows[i - 1];
          return (
            <div key={`${row.rank}-${row.name}-${i}`} className="contents">
              {promoteThrough > 0 && prev && prev.rank <= promoteThrough && row.rank > promoteThrough ? (
                <ZoneRule kind="promotion" locale={locale} />
              ) : null}
              {relegateFrom <= rows.length && prev && prev.rank < relegateFrom && row.rank >= relegateFrom ? (
                <ZoneRule kind="relegation" locale={locale} />
              ) : null}
              <BoardRow row={row} locale={locale} />
            </div>
          );
        })}
      </ol>
    </section>
  );
}

function BoardRow({ row, locale }: { row: Row; locale: Locale }) {
  return (
    <li
      /* The learner's own row is marked for assistive tech as well as visually.
         `aria-current` is the standard way to say "this one is you" and needs no
         extra sentence in the accessible name. */
      aria-current={row.isYou ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-3 py-2.5 sm:gap-4 sm:px-4",
        row.isYou
          ? "bg-[color-mix(in_oklab,var(--color-b-purple)_14%,transparent)] ring-2 ring-b-purple/45"
          : "hover:bg-b-fg/[0.04]",
      )}
    >
      <span
        className={cn(
          "w-7 shrink-0 text-right text-[15px] font-bold tabular-nums sm:w-8",
          row.isYou ? "text-b-purple" : "text-b-fg/45",
        )}
      >
        {row.rank}
      </span>

      <span className="min-w-0 flex-1 truncate text-[15px] leading-[22px] sm:text-[16px]">
        {row.name}
        {row.isYou ? (
          <span className="ml-2 rounded-full bg-b-purple/20 px-2 py-0.5 align-middle text-[11px] font-bold text-b-purple">
            {t(L.leagueRowYou, locale)}
          </span>
        ) : null}
      </span>

      <MovementMark movement={row.zone} locale={locale} className="shrink-0" />

      <span className="shrink-0 text-[15px] font-bold tabular-nums sm:text-[16px]">
        {row.weeklyXp}
        <span className="ml-1 text-[12px] font-medium text-b-fg/45">XP</span>
      </span>
    </li>
  );
}

/**
 * Where this week's XP actually came from.
 *
 * §27 and §17: for every point, the learner can ask WHY. The ledger stores an
 * achievement and a curriculum entity per row, and this is the reader for it —
 * grouped by achievement, so «За верно решённую задачу ×4 · 40 XP» is a claim a
 * fourteen-year-old can check against their own week.
 *
 * Their OWN only. There is no parameter that could ask for somebody else's, and
 * `xpBreakdown` takes the subject id resolved from the session.
 */
function Breakdown({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const NAMES: Record<string, Localized> = {
    block_solved: L.xpBlockSolved,
    block_solved_unaided: L.xpBlockUnaided,
    challenge_solved: L.xpChallengeSolved,
    explanation_submitted: L.xpExplanationSubmitted,
    lesson_completed: L.xpLessonCompleted,
    assessment_completed: L.xpAssessmentCompleted,
    review_resolved: L.xpReviewResolved,
  };

  return (
    <section className="mt-6 rounded-[20px] sx-card border-2 border-b-fg/20 p-6">
      <h2 className="text-[17px] leading-[24px] font-bold">
        {t(L.leagueBreakdownTitle, locale)}
      </h2>
      <ul className="mt-4 flex flex-col gap-2">
        {data.breakdown.map((b) => (
          <li
            key={b.achievement}
            className="flex items-baseline justify-between gap-4 text-[14px] leading-[20px]"
          >
            <span className="min-w-0 text-b-fg/80">
              {NAMES[b.achievement] ? t(NAMES[b.achievement], locale) : b.achievement}
              <span className="ml-2 text-b-fg/40 tabular-nums">×{b.count}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums">
              {b.total}
              <span className="ml-1 text-[12px] font-medium text-b-fg/45">XP</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* The ladder                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Ten tiers, low to high.
 *
 * Horizontally scrollable rather than wrapped, so the ladder stays a LINE at
 * every width — a ladder that reflows into two rows of five stops reading as a
 * progression. The container scrolls; the page never does, which is §32's rule.
 *
 * Future tiers are quiet, not locked-looking. A padlock would frame the ladder
 * as content being withheld, which is the battle-pass register §23 rules out.
 */
function Ladder({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  /*
   * Bring the learner's own tier into view.
   *
   * At 1440 the whole ladder fits and this does nothing. At 375 it scrolls, and
   * without this a learner in Nexus opens the page to a strip starting at Pulse
   * and has to go looking for themselves in the one component whose job is to
   * say where they are.
   *
   * `block: "nearest"` so it only ever scrolls the strip, never the page —
   * the default would jump the whole document to the ladder on load.
   * `prefers-reduced-motion` is honoured: `behavior: "auto"` is an instant
   * jump, and the product stamps `data-motion` for a learner who turned motion
   * off in preferences, which beats the OS setting.
   */
  const current = useCallback((node: HTMLLIElement | null) => {
    if (!node) return;
    const strip = node.parentElement;
    if (!strip) return;

    /*
     * `scrollLeft` on the strip, NOT `scrollIntoView` on the node.
     *
     * `scrollIntoView` walks every scrollable ancestor, and the ladder sits
     * below the fold — so it scrolled the DOCUMENT to bring the strip into
     * view and the page loaded already scrolled past the learner's rank and
     * XP. `block: "nearest"` does not prevent that; it only stops it
     * overshooting once the element is on screen. Setting `scrollLeft`
     * directly cannot move the page, which is the property actually wanted.
     */
    const target = node.offsetLeft - (strip.clientWidth - node.clientWidth) / 2;
    const left = Math.max(0, target);
    if (Math.abs(strip.scrollLeft - left) < 2) return;

    const reduce =
      document.documentElement.dataset.motion === "reduce" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, []);

  return (
    <section className="rounded-[20px] sx-card border-2 border-b-fg/20 p-6">
      <h2 className="text-[17px] leading-[24px] font-bold">{t(L.leagueLadderTitle, locale)}</h2>

      <ol className="-mx-2 mt-4 flex gap-2 overflow-x-auto px-2 pb-2">
        {data.ladder.map((x) => {
          const isCurrent = x.tier === data.tier;
          const passed = x.tier < data.tier;
          return (
            <li
              key={x.tier}
              ref={isCurrent ? current : undefined}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "flex min-w-[96px] shrink-0 flex-col items-center gap-2 rounded-[14px] px-3 py-3",
                isCurrent && "bg-b-fg/[0.06] ring-2 ring-b-purple/40",
              )}
            >
              <TierBadge
                tier={x.tier}
                name={x.name}
                hue={x.hue}
                size={isCurrent ? "md" : "sm"}
                className={cn(!isCurrent && !passed && "opacity-45", !isCurrent && passed && "opacity-70")}
              />
              <span
                className={cn(
                  "text-center text-[12px] leading-[16px] font-bold",
                  isCurrent ? "text-b-fg" : passed ? "text-b-fg/55" : "text-b-fg/35",
                )}
              >
                {x.name}
              </span>
              {isCurrent ? (
                <span className="max-w-full truncate text-[10px] leading-[13px] font-bold tracking-[0.02em] text-b-purple uppercase">
                  {t(L.leagueLadderCurrent, locale)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* The rules                                                                   */
/* -------------------------------------------------------------------------- */

const EARN: { key: string; label: Localized }[] = [
  { key: "block_solved", label: L.xpBlockSolved },
  { key: "block_solved_unaided", label: L.xpBlockUnaided },
  { key: "challenge_solved", label: L.xpChallengeSolved },
  { key: "explanation_submitted", label: L.xpExplanationSubmitted },
  { key: "lesson_completed", label: L.xpLessonCompleted },
  { key: "assessment_completed", label: L.xpAssessmentCompleted },
  { key: "review_resolved", label: L.xpReviewResolved },
];

const NEVER: Localized[] = [L.xpNotRun, L.xpNotRepeat, L.xpNotHints, L.xpNotTime, L.xpNotSpeed];

/**
 * How XP works, in full, with the amounts.
 *
 * Not behind a modal and not behind a tooltip. §27: the rules are never hidden,
 * and a gamification system a learner cannot audit is one they will assume is
 * rigged the first time somebody else's number goes up faster than theirs.
 *
 * The amounts come from the API rather than being written here, so the screen
 * and the ledger cannot disagree — there is one policy and this renders it.
 */
function Rules({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  return (
    <section className="rounded-[20px] sx-card border-2 border-b-fg/20 p-6">
      <h2 className="text-[17px] leading-[24px] font-bold">{t(L.leagueRulesTitle, locale)}</h2>

      <h3 className="mt-4 text-[12px] font-bold tracking-[0.06em] text-b-fg/45 uppercase">
        {t(L.leagueRulesEarn, locale)}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {EARN.map((e) => (
          <li key={e.key} className="flex items-baseline justify-between gap-3 text-[14px] leading-[20px]">
            <span className="text-b-fg/80">{t(e.label, locale)}</span>
            <span className="shrink-0 font-bold tabular-nums text-b-purple">
              +{data.policy.amounts[e.key]}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-[12px] font-bold tracking-[0.06em] text-b-fg/45 uppercase">
        {t(L.leagueRulesNever, locale)}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {NEVER.map((n, i) => (
          <li key={i} className="flex items-baseline gap-2 text-[14px] leading-[20px] text-b-fg/60">
            <span aria-hidden="true" className="text-b-fg/30">—</span>
            {t(n, locale)}
          </li>
        ))}
      </ul>

      <p className="mt-5 border-t-2 border-b-fg/10 pt-4 text-[13px] leading-[19px] text-b-fg/60">
        {t(L.leagueXpNeverLost, locale)}
      </p>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The week has started and this learner has not.
 *
 * Not an error, not an empty table, and not a zero. `/you` already establishes
 * that "a chart that briefly lies is worse than one that briefly waits", and the
 * same instinct applies to a leaderboard with one row on it reading `0 XP` —
 * that is a picture of losing, shown to somebody who has not started.
 */
function NotStarted({ locale }: { locale: Locale }) {
  return (
    <section className="rounded-[20px] sx-card border-2 border-b-fg/20 px-6 py-10 text-center">
      <p className="text-[17px] leading-[24px] font-bold">{t(L.leagueNotStarted, locale)}</p>
      <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-[21px] text-b-fg/60">
        {t(L.leagueNotStartedBody, locale)}
      </p>
    </section>
  );
}

/**
 * Last week's result, shown once.
 *
 * Dismissal is remembered in `localStorage`, keyed by the week. A per-viewer
 * convenience with no server meaning is exactly what browser storage is for, and
 * a column on `league_settlements` would be storing a UI fact in the table whose
 * whole content is an immutable record of a decision.
 *
 * Wrapped in try/catch because a private window, a cleared profile or a browser
 * blocking site data all make the accessor throw rather than return null — and
 * a learner in a locked-down school browser must still see their result.
 */
/** No external store to subscribe to; see `ResultBanner`. */
const NO_SUBSCRIPTION = () => () => {};

function ResultBanner({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const r = data.lastResult;
  const key = r ? `sx.league.seen.${r.weekId}` : null;

  /* `useSyncExternalStore` rather than a read inside an effect.
     Browser storage is external state, and this is what React added the hook
     for: the server snapshot is `true` (hidden), so the banner never flashes in
     before hydration decides it has already been seen, and there is no
     synchronous setState in an effect for the linter to object to.
     The subscribe callback is a no-op because nothing else in this tab writes
     the key — a `storage` listener would fire only for OTHER tabs, and a second
     tab dismissing the banner is not a case worth a subscription. */
  const seen = useSyncExternalStore(
    NO_SUBSCRIPTION,
    () => {
      if (!key) return true;
      try {
        return window.localStorage.getItem(key) === "1";
      } catch {
        /* A private window, a cleared profile, or a browser configured to block
           site data all THROW here rather than returning null. Showing the
           banner is the right failure direction: a learner in a locked-down
           school browser must still see their result. */
        return false;
      }
    },
    () => true,
  );

  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = seen || dismissedNow;

  const dismiss = useCallback(() => {
    setDismissedNow(true);
    try {
      if (key) window.localStorage.setItem(key, "1");
    } catch {
      /* Nothing to do. The banner reappears next visit, which is a smaller
         problem than not showing it at all. */
    }
  }, [key]);

  const after = useMemo(
    () => (r ? data.ladder.find((x) => x.tier === r.tierAfter) : undefined),
    [r, data.ladder],
  );

  if (!r || !after || dismissed) return null;

  const line =
    r.movement === "promoted"
      ? L.leagueResultUp
      : r.movement === "relegated"
        ? L.leagueResultDown
        : L.leagueResultStay;

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[20px] border-2 p-6 sm:flex-row sm:items-center sm:justify-between",
        r.movement === "promoted"
          ? "border-b-ok-edge/40 bg-b-ok-edge/[0.08]"
          : "sx-card border-b-fg/20",
      )}
      /* Polite, not assertive: it is news, not an alert, and it must not
         interrupt whatever a screen-reader user was already reading. */
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <TierBadge tier={after.tier} name={after.name} hue={after.hue} size="md" />
        <div>
          <p className="text-[12px] font-bold tracking-[0.06em] text-b-fg/45 uppercase">
            {t(L.leagueResultTitle, locale)}
          </p>
          <p className="mt-0.5 text-[19px] leading-[26px] font-bold">
            {t(line, locale).replace("{name}", after.name)}
          </p>
          <p className="mt-0.5 text-[13px] leading-[19px] text-b-fg/60">
            {t(L.leagueResultRank, locale)
              .replace("{rank}", String(r.rank))
              .replace("{n}", String(r.groupSize))}
            {" · "}
            {r.finalXp} XP
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 cursor-pointer self-start rounded-full border-2 border-b-fg/20 px-4 py-2 text-[14px] font-bold transition-colors hover:bg-b-fg/[0.06] sm:self-auto"
      >
        {t(L.leagueResultDismiss, locale)}
      </button>
    </section>
  );
}

/**
 * The board did not load.
 *
 * Two changes from the obvious version, both from watching somebody read it
 * cold:
 *
 *   1. It says the XP is SAFE. The failure is a read of the leaderboard; the
 *      ledger was written on the submit path and is untouched. Without that
 *      sentence a learner who spent a week earning points is told "failed to
 *      load the league" and reasonably concludes the week did not count.
 *   2. The retry is a FILLED button, not a ghost one. The single action on a
 *      failure screen must not be the lowest-contrast element on it.
 *
 * The ladder still renders below this — a learner can see which league they are
 * in even when the list of names cannot load, so the screen is never empty.
 */
function Failed({ locale, onRetry }: { locale: Locale; onRetry: () => void }) {
  return (
    <section className="rounded-[20px] sx-card border-2 border-b-fg/20 px-6 py-9 text-center">
      <p className="text-[16px] leading-[23px] font-bold">{t(L.leagueLoadFailed, locale)}</p>
      <p className="mx-auto mt-1.5 max-w-[380px] text-[14px] leading-[20px] text-b-fg/60">
        {t(L.leagueLoadFailedSafe, locale)}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 cursor-pointer rounded-full bg-b-purple px-6 py-2.5 text-[14px] font-bold text-b-on-fill transition-opacity hover:opacity-90"
      >
        {t(L.leagueRetry, locale)}
      </button>
    </section>
  );
}

/** Pending renders a shape, never a zero. See `/you`'s `useJson`. */
function Skeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-[132px] animate-pulse rounded-[20px] bg-b-fg/[0.06]" />
      <div className="h-[320px] animate-pulse rounded-[20px] bg-b-fg/[0.06]" />
    </div>
  );
}
