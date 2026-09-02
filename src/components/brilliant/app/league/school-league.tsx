"use client";

import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";
import type { Locale, Localized } from "@schools/curriculum/types";
import { L, LEAGUE_UI, leagueGroupSizeLabel, t } from "@schools/presentation/labels";
import { LEAGUE_EXPLAIN, LEAGUE_HELP_HREF, withUnlockXp } from "@schools/leagues/explain";
import { LEAGUE_UNLOCK_XP } from "@schools/leagues/unlock";
import { MIN_GROUP_FOR_MOVEMENT } from "@schools/leagues/standings";
import { LEAGUE_TIERS } from "@schools/leagues/tiers";
import { useLocale } from "@/components/sx/i18n";
import { AppHeader } from "../app-header";
import { accountMenu } from "../account-menu";
import { LocaleSwitch, SCHOOL_NAV_WITH_LEAGUE, SolveXWordmark } from "../school-chrome";
import { TierEmblem, TierOrdinal } from "./tier-emblem";
import {
  Disclosure,
  MovementMark,
  ZoneHeading,
  fill,
  formatRemaining,
  type Movement,
} from "./league-parts";

/**
 * /league — the weekly competition.
 *
 * ## Four full-width bands, and no sidebar
 *
 * The page used to be a hero over a `1fr / 340px` grid with the ladder beneath
 * it. That grid was measured and it was the page's biggest single defect: the
 * left column ended at the XP breakdown around y1000 while the right column ran
 * to y1350, so roughly 350px of the screen at 1440 was nothing at all. It also
 * made 1440 and 1024 render at exactly the same height — a layout that does not
 * adapt is a layout that was never asked to.
 *
 * So the page is four stacked full-width sections that read as one experience:
 *
 *   A. HERO      — which league, what rank, how much XP, which way you are going.
 *   B. BOARD     — the whole class, every rank under a labelled zone.
 *   C. TIER ROAD — the ten leagues as a route, with the emblems at a size you
 *                  can actually read. This is the page's signature.
 *   D. RULES     — how XP is earned, compact and collapsible.
 *
 * ## What a learner must be able to answer in five seconds
 *
 * §19's six questions, all answered in band A except the last:
 *
 *   1. What league am I in?     the EMBLEM and the NAME at display size
 *   2. What rank am I?          the second-biggest thing on the page
 *   3. How much XP this week?   beside the rank, clearly subordinate to it
 *   4. Am I moving?             a sentence with an arrow in it, not a colour
 *   5. When does it reset?      quiet, top right, in days and hours
 *   6. How do I earn more?      band D
 *
 * The old hero got the priority exactly inverted: the COUNTDOWN was its largest
 * text and the rank was its smallest. A clock is not what a learner opens this
 * page to find out.
 *
 * ## Adapted, not rebuilt
 *
 * Same 1216px column, same `px-6 py-8 sm:p-8` shell, same card construction —
 * `rounded-[20px] sx-card border-2 border-b-fg/20` — as `/you` and `/home`.
 * Tier colour arrives as one custom property, exactly as `TierEmblem` does it;
 * there is no second set of hardcoded hues anywhere on this screen.
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

/**
 * The unlock, resolved on the server by `src/app/league/page.tsx`.
 *
 * `null` means the read failed, and the page then behaves as it always has —
 * it fetches the board. That direction is deliberate: telling a learner who
 * has earned their league that they have not is a far worse failure than
 * showing the board to somebody a failed query could not vouch for, and the
 * API itself is the real gate on what they are allowed to see.
 */
export interface LeagueUnlockState {
  lifetimeXp: number;
  unlocked: boolean;
  needed: number;
}

export function SchoolLeague({ unlock = null }: { unlock?: LeagueUnlockState | null }) {
  const { locale, setLocale } = useLocale();
  const loc = locale as Locale;

  const locked = unlock !== null && !unlock.unlocked;

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
    /*
     * Always ask, even below the threshold.
     *
     * This used to `return` when `locked`, and that produced a state the
     * product cannot defend: `awardXp` creates a week's membership on the FIRST
     * granted credit and never consults `LEAGUE_UNLOCK_XP`, so a learner
     * between their first XP and their 175th is genuinely RANKED — their
     * classmates see them on the board — while their own page refused to fetch
     * it and told them they had not unlocked leagues yet.
     *
     * Reproduced on the E2E database: a learner with 65 lifetime XP held
     * membership, the API answered `rank 10 of 10, weeklyXp 65`, a classmate's
     * board listed them by name, and their own screen said «Ещё 110 XP».
     *
     * 175 XP is roughly eighteen solved blocks, so this is not an edge case for
     * the pilot — it is the state every learner in the class is in for their
     * first days. The screen now decides AFTER the answer arrives, and only
     * shows the locked state to somebody the board itself says is not competing
     * (`you === null`). That is the case the locked screen was written for.
     */
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
        <div className="flex flex-col gap-6 px-6 py-8 sm:p-8">
          <h1 className="text-[32px] leading-[42px] font-bold">{t(L.leagueTitle, loc)}</h1>

          {/* Order matters, and the condition on `Locked` is the whole fix.
              Below the threshold AND not on the board => they have not started,
              which is exactly what the locked screen was written to say. Below
              the threshold but RANKED => show them the board their classmates
              are already looking at. */}
          {failed ? <Failed locale={loc} onRetry={retry} /> : null}
          {!failed && !data ? <Skeleton /> : null}
          {!failed && data && locked && unlock && !data.you ? (
            <Locked unlock={unlock} locale={loc} />
          ) : null}
          {!failed && data && !(locked && unlock && !data.you) ? (
            <Loaded data={data} locale={loc} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Loaded({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const tier = data.ladder.find((x) => x.tier === data.tier) ?? data.ladder[0];
  const next = data.ladder.find((x) => x.tier === data.tier + 1) ?? null;

  return (
    <>
      <ResultBanner data={data} locale={locale} />
      <Hero data={data} tier={tier} next={next} locale={locale} />
      {data.you === null ? (
        <NotStarted locale={locale} />
      ) : (
        <>
          <Board data={data} tier={tier} locale={locale} />
          {data.breakdown.length > 0 ? <Breakdown data={data} locale={locale} /> : null}
        </>
      )}
      <TierRoad data={data} locale={locale} />
      <Rules data={data} locale={locale} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* A · The hero                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The league is the main character.
 *
 * ## Order of size, which is the whole point of this band
 *
 *   1. the emblem and `PULSE` — WHICH league
 *   2. the rank                — WHERE in it
 *   3. this week's XP          — what that rank is made of
 *   4. the movement sentence   — what happens on Sunday
 *   5. the countdown           — when Sunday is
 *
 * The old hero ran that list backwards. `4 дня 18 часов` was set at 30px and
 * `1 / 10` at 30px with a `/ 10` suffix at 15px, which made the clock and the
 * rank the same size and the clock the wider of the two. It was also the
 * string that broke the layout: four 30px stats in one `sm:flex` row do not
 * fit 664px of card at 768, which is where the measured horizontal overflow
 * came from, and at 375 the same row truncated the countdown to «4 дня …» and
 * pushed «Поднимаешься» past the card's right edge.
 *
 * Nothing in here is a fixed-width row any more. The identity block and the
 * countdown are one wrapping flex line; the three facts are another. Every
 * text node that could be long — a tier name, a movement sentence — sits in a
 * `min-w-0` box and is allowed to wrap rather than to truncate or to push.
 *
 * ## The word «Лига» is not part of the name
 *
 * `Лига Pulse` set the article and the proper noun at the same weight, so the
 * thing a learner actually recognises — `Pulse` — was half of a phrase. The
 * name gets display size on its own line and «Лига 1 из 10» goes underneath in
 * the small type, where it belongs: it is a POSITION, not a title.
 */
function Hero({
  data,
  tier,
  next,
  locale,
}: {
  data: LeaguePayload;
  tier: LadderTier;
  next: LadderTier | null;
  locale: Locale;
}) {
  /* Read once on mount rather than on a ticking interval. The value is rendered
     in days and hours, so a timer would repaint the same string for an hour —
     and a live countdown is the urgency §44 forbids. It is also deliberately
     NOT in a live region: a value that changes once an hour has no business
     interrupting a screen-reader user mid-sentence. */
  const [now] = useState(() => Date.now());

  const you = data.you;
  const movement: Localized | null = !you
    ? null
    : you.zone === "promoted" && next
      ? LEAGUE_UI.moveUpTo
      : you.zone === "relegated"
        ? LEAGUE_UI.moveDown
        : LEAGUE_UI.moveStay;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[20px] sx-card border-2 border-b-fg/20 p-5 sm:p-7",
      )}
      style={{ ["--tier-hue" as string]: tier.hue }}
      aria-labelledby="league-now"
    >
      {/* The tier's colour, once, as a wash behind the emblem. Decorative, and
          the only place on the page where the hue is used as an area rather
          than as an outline — everything else keeps it to strokes so that tier
          identity never starts competing with verdict colour. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,color-mix(in_oklab,var(--tier-hue)_16%,transparent),transparent_70%)]"
      />

      <div className="relative flex flex-col gap-6">
        {/* Identity, and the clock. One wrapping line: at 375 the countdown
            drops to its own row instead of squeezing the name. */}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <TierEmblem
              tier={tier.tier}
              name={tier.name}
              hue={tier.hue}
              size={72}
              state="current"
              className="sm:hidden"
            />
            <TierEmblem
              tier={tier.tier}
              name={tier.name}
              hue={tier.hue}
              size={96}
              state="current"
              className="hidden sm:grid"
            />
            <div className="min-w-0">
              <h2
                id="league-now"
                /* `break-words` rather than `truncate`: `Singularity` is one
                   long word and a learner's own league name must not end in an
                   ellipsis on the narrowest phone in the class. */
                className="text-[28px] leading-[34px] font-bold break-words sm:text-[40px] sm:leading-[46px]"
              >
                {tier.name}
              </h2>
              <p className="mt-1 text-[14px] leading-[20px] text-b-fg/55">
                {fill(t(LEAGUE_UI.tierLine, locale), {
                  tier: tier.tier,
                  total: data.ladder.length,
                })}
                {" · "}
                {/* Not `{n} {noun}`: Russian inflects the noun after a numeral
                    and `groupSize` is 1 on Monday morning. See
                    `leagueGroupSizeLabel`. */}
                {leagueGroupSizeLabel(data.groupSize, locale)}
              </p>
            </div>
          </div>

          {/*
            The right column: the clock, and the thing the clock is counting
            toward.

            The clock alone left a visible void here at 1440 — the left two
            thirds carried the emblem, the name, three facts and a disclosure,
            and the right third held one two-line block at the top and nothing
            under it. Filling it with decoration would have been worse than the
            gap.

            The next tier belongs here on its own merits: §14 asks the page to
            name the target, and until now it appeared only inside the movement
            sentence and at the far bottom of the road. A learner who has to
            scroll to find out what is above them is being asked to want
            something they cannot see.

            Absent at tier 10, and correctly so — there is nothing above
            Singularity, and an empty «следующая» slot would be the page
            promising a rung that does not exist.
          */}
          <div className="flex shrink-0 flex-col items-start gap-5 sm:items-end">
            <div>
              <p className="b-eyebrow leading-[16px] text-b-fg/40 sm:text-right">
                {t(L.leagueEndsIn, locale)}
              </p>
              <p className="mt-1 text-[15px] leading-[20px] font-bold tabular-nums text-b-fg/75 sm:text-right">
                {formatRemaining(data.endsAt, now, locale)}
              </p>
            </div>

            {next ? (
              <div className="hidden sm:block">
                <p className="b-eyebrow leading-[16px] text-b-fg/40 text-right">
                  {t(LEAGUE_UI.roadNext, locale)}
                </p>
                <div className="mt-1.5 flex items-center justify-end gap-2.5">
                  <p className="text-[15px] leading-[20px] font-bold text-b-fg/75">
                    {next.name}
                  </p>
                  <TierEmblem
                    tier={next.tier}
                    name={next.name}
                    hue={next.hue}
                    size={32}
                    state="next"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* The three facts. `flex-wrap` with a `basis-full` movement block below
            `sm`, so a long sentence gets the card's whole width instead of a
            third of it. */}
        {you ? (
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
            <RankFact rank={you.rank} groupSize={data.groupSize} locale={locale} />

            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] leading-[32px] font-bold tabular-nums text-b-purple">
                  {you.weeklyXp}
                </span>
                <span className="text-[14px] font-medium text-b-fg/45">XP</span>
              </div>
              <p className="mt-0.5 text-[13px] leading-[18px] text-b-fg/55">
                {t(L.leagueXpThisWeek, locale)}
              </p>
            </div>

            {movement ? (
              <div className="min-w-0 basis-full sm:basis-auto">
                <p
                  className={cn(
                    "flex items-start gap-2 text-[17px] leading-[24px] font-bold",
                    you.zone === "promoted" && "text-b-ok-edge",
                    you.zone === "relegated" && "text-b-warn-edge",
                    you.zone === "stayed" && "text-b-fg/75",
                  )}
                >
                  {/* `silent`: the sentence to the right of this arrow already
                      says which way the week is going, in the second person.
                      Speaking the mark as well reads it twice. */}
                  <MovementMark
                    movement={you.zone}
                    locale={locale}
                    silent
                    className="mt-[7px] shrink-0"
                  />
                  {/* No truncation and no `whitespace-nowrap`: this is the
                      sentence that used to run off the right edge of the card
                      at 375. It wraps now. */}
                  <span className="min-w-0">
                    {fill(t(movement, locale), {
                      name: you.zone === "promoted" && next ? next.name : tier.name,
                    })}
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] leading-[18px] text-b-fg/55">
                  {t(L.leagueYourZone, locale)}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/*
          What a week IS, one press away, in the same card as the clock that
          says how much of it is left.

          §19's sixth question is the one a number cannot answer: «4 дня» tells
          a learner the clock is running and nothing about what the clock is
          FOR. Without this the first Monday of the pilot is eighteen children
          opening a page that says 0 XP, with no statement anywhere that last
          week's total was supposed to go away.

          Collapsed rather than always-open because it is three paragraphs of
          prose that a learner reads once and then never again, and it was
          previously the tallest element on the page. The long version is still
          a real page at `/help/leagues`, linked from inside.
        */}
        <div className="border-t-2 border-b-fg/10 pt-5">
          <Disclosure
            label={t(LEAGUE_UI.weekToggle, locale)}
            icon={
              <span aria-hidden="true" className="text-[13px] leading-none text-b-fg/45">
                ⓘ
              </span>
            }
          >
            <div id="league-week">
              <p className="text-[14px] leading-[21px] text-b-fg/75">
                {t(LEAGUE_EXPLAIN.weekBody, locale)}
              </p>
              <p className="mt-2.5 text-[14px] leading-[21px] text-b-fg/75">
                {t(LEAGUE_EXPLAIN.weekSettles, locale)}
              </p>
              <p className="mt-2.5 text-[13px] leading-[19px] text-b-fg/55">
                {t(LEAGUE_EXPLAIN.scope, locale)}
              </p>
              <HelpLink locale={locale} />
            </div>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}

/**
 * «1 место из 10», with the numeral at display size inside its own sentence.
 *
 * Split on the `{rank}` placeholder rather than assembled from fragments,
 * because the two languages put the numeral in different places: Russian opens
 * with it («1 место из 10») and Kazakh closes with it («10 қатысушының ішінде
 * 1-орын»). One authored sentence per language, one big number, and no word
 * order baked into the JSX.
 */
function RankFact({
  rank,
  groupSize,
  locale,
}: {
  rank: number;
  groupSize: number;
  locale: Locale;
}) {
  /* Split on the placeholder itself. Splitting the SUBSTITUTED string on a
     space would cut «10 қатысушының ішінде» into three pieces; the marker is
     the only stable seam. `whitespace-pre-wrap` keeps the space Russian needs
     after the numeral, and the absence of one Kazakh needs before «-орын». */
  const [head = "", tail = ""] = t(LEAGUE_UI.rankLine, locale).split("{rank}");

  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-baseline text-[17px] leading-[24px] font-medium text-b-fg/70">
        <span className="whitespace-pre-wrap">{fill(head, { n: groupSize })}</span>
        <span className="text-[40px] leading-[44px] font-bold tabular-nums text-b-fg">
          {rank}
        </span>
        <span className="whitespace-pre-wrap">{fill(tail, { n: groupSize })}</span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* B · The board                                                               */
/* -------------------------------------------------------------------------- */

/**
 * An ordered list, not a table.
 *
 * A `<table>` would be defensible and is what the teacher console uses — but
 * that console has eight columns and a header row that a screen reader needs in
 * order to make sense of a cell. This has four fields and one of them is a
 * position, which is exactly what `<ol>` means. A list also degrades correctly
 * at 375, where a four-column table has to become a list anyway.
 *
 * ## Every rank gets a zone, and that is a real fix
 *
 * The zones come from `data.zones` and from nowhere else — never recomputed
 * here, because the boundary is a settlement rule and a client that works it
 * out itself is a second implementation of it.
 *
 * The old board drew a rule BETWEEN zones. At tier 1 nothing relegates, so
 * exactly one rule was ever drawn and ranks 3 through 10 carried no zone label
 * at all: a learner at rank 7 was shown a number and told nothing about what it
 * meant for Sunday. Grouping the rows and heading each group means every rank
 * sits under a label that names its outcome, and a zone that does not exist for
 * this tier simply has no group rather than an empty band.
 *
 * ## And when nothing moves at all
 *
 * Below `MIN_GROUP_FOR_MOVEMENT` the engine moves nobody, so there are no zones
 * to head. The board says so in a sentence, with the threshold read from the
 * engine's own constant rather than written here as a four.
 */
function Board({
  data,
  tier,
  locale,
}: {
  data: LeaguePayload;
  tier: LadderTier;
  locale: Locale;
}) {
  const { promoteThrough, relegateFrom } = data.zones;
  const moves = data.groupSize >= MIN_GROUP_FOR_MOVEMENT;

  const zoneOf = (rank: number): "promotion" | "stay" | "relegation" =>
    promoteThrough > 0 && rank <= promoteThrough
      ? "promotion"
      : rank >= relegateFrom
        ? "relegation"
        : "stay";

  return (
    <section
      className="rounded-[20px] sx-card border-2 border-b-fg/20 p-3 sm:p-4"
      /* `--tier-ink` is the hue pulled toward the page's ink so that it stays
         legible on a tinted row in BOTH themes: `b-fg` is near-black in light
         and white in dark, so the same mix darkens the hue on paper and lifts
         it on the dark surface. One declaration, two arms. */
      style={{
        ["--tier-hue" as string]: tier.hue,
        ["--tier-ink" as string]: `color-mix(in oklab, ${tier.hue} 76%, var(--color-b-fg))`,
      }}
      aria-label={t(L.leagueTitle, locale)}
    >
      {/* Column labels. The XP unit is printed HERE, once, instead of ten
          times down the right-hand edge — every row still carries it for a
          screen reader, where repetition costs nothing and omission is a bare
          number with no unit. */}
      <div
        aria-hidden="true"
        className="b-eyebrow flex items-center gap-3 px-3 pt-1 pb-2 text-[10px] leading-[14px] text-b-fg/35 sm:gap-4 sm:px-4"
      >
        <span className="w-10 shrink-0 text-right sm:w-11">
          {t(LEAGUE_UI.boardRankCol, locale)}
        </span>
        <span className="min-w-0 flex-1">{t(LEAGUE_UI.boardWhoCol, locale)}</span>
        <span className="shrink-0">{t(LEAGUE_UI.boardXpCol, locale)}</span>
      </div>

      {!moves ? (
        <p className="px-3 pb-2 text-[13px] leading-[19px] text-b-fg/55 sm:px-4">
          {fill(t(LEAGUE_UI.tooSmallToMove, locale), { n: MIN_GROUP_FOR_MOVEMENT })}
        </p>
      ) : promoteThrough === 0 ? (
        /* Tier 10. `zonesFor` returns no promotion zone there, so rather than
           drawing an empty band the board says why there is not one. */
        <p className="px-3 pb-2 text-[13px] leading-[19px] text-b-fg/55 sm:px-4">
          {t(LEAGUE_UI.topOfLadder, locale)}
        </p>
      ) : null}

      <ol className="flex flex-col">
        {data.rows.map((row, i) => {
          const zone = zoneOf(row.rank);
          const opensZone = moves && (i === 0 || zoneOf(data.rows[i - 1].rank) !== zone);
          return (
            /* A Fragment, not a `display: contents` wrapper: the rows and the
               zone headings are all `<li>` and they belong to the `<ol>`
               directly. The old version put a div between them and relied on
               `contents` to unmake it. */
            <Fragment key={`${row.rank}-${row.name}-${i}`}>
              {opensZone ? <ZoneHeading kind={zone} locale={locale} /> : null}
              <BoardRow row={row} locale={locale} />
            </Fragment>
          );
        })}
      </ol>
    </section>
  );
}

function BoardRow({ row, locale }: { row: Row; locale: Locale }) {
  /* Top three, distinguished by weight alone. Not podium cards and not medals:
     a league here is one class of ten to thirty people, and a tournament
     final's furniture would make an ordinary Tuesday look like a prize-giving. */
  const top = row.rank <= 3;

  return (
    <li
      /* The learner's own row is marked for assistive tech as well as visually.
         `aria-current` is the standard way to say "this one is you" and needs no
         extra sentence in the accessible name. */
      aria-current={row.isYou ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[12px] px-3 py-2.5 sm:gap-4 sm:px-4",
        "transition-colors duration-150 ease-out motion-reduce:transition-none",
        row.isYou
          ? "bg-[color-mix(in_oklab,var(--tier-hue)_16%,transparent)] ring-2 ring-[color-mix(in_oklab,var(--tier-hue)_45%,transparent)]"
          : "hover:bg-b-fg/[0.04]",
      )}
    >
      <span
        className={cn(
          "w-10 shrink-0 text-right tabular-nums sm:w-11",
          row.isYou
            ? "text-[16px] font-bold text-[var(--tier-ink)]"
            : top
              ? "text-[16px] font-bold text-b-fg"
              : "text-[15px] font-semibold text-b-fg/40",
        )}
      >
        {row.rank}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate text-[15px] leading-[22px] sm:text-[16px]">
          {row.name}
        </span>
        {row.isYou ? (
          <span className="b-eyebrow shrink-0 rounded-full bg-[color-mix(in_oklab,var(--tier-hue)_24%,transparent)] px-2 py-0.5 text-[10px] leading-[16px] text-[var(--tier-ink)]">
            {t(L.leagueRowYou, locale)}
          </span>
        ) : null}
      </span>

      <MovementMark movement={row.zone} locale={locale} className="shrink-0" />

      <span className="shrink-0 text-[15px] font-bold tabular-nums sm:text-[16px]">
        {row.weeklyXp}
        {/* Visible once in the column header; spoken on every row, where a bare
            number would be an unlabelled quantity. */}
        <span className="sr-only"> XP</span>
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
 *
 * A row of chips rather than a card of its own: it is an annotation on the
 * number in the hero, and giving it a full panel is what left the left column
 * ending 350px above the right one.
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
    <section aria-labelledby="league-breakdown" className="flex flex-col gap-2">
      <h2 id="league-breakdown" className="b-eyebrow px-1 text-b-fg/40">
        {t(L.leagueBreakdownTitle, locale)}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {data.breakdown.map((b) => (
          <li
            key={b.achievement}
            className="flex items-baseline gap-2 rounded-full border-2 border-b-fg/12 px-3.5 py-1.5 text-[13px] leading-[19px]"
          >
            <span className="text-b-fg/70">
              {NAMES[b.achievement] ? t(NAMES[b.achievement], locale) : b.achievement}
            </span>
            <span className="text-b-fg/35 tabular-nums">×{b.count}</span>
            <span className="font-bold tabular-nums">
              {b.total}
              <span className="sr-only"> XP</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* C · The tier road                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Ten tiers as a route, and this is the page's signature.
 *
 * It used to be a footnote: ten 32px badges reading `01`…`10` in a strip at the
 * bottom of the page, which is a legend, not a progression. `tier-emblem.tsx`
 * argues the system at length — the ladder is a signal acquiring structure,
 * `Pulse` is one point of light, and `Singularity` collapses all of it back
 * into a single dense point, so complexity rises and then RESOLVES. None of
 * that is visible at 32px inside a rounded box with a numeral in it.
 *
 * ## States, not styles
 *
 * `behind` renders in INK rather than in colour: a tier a learner has left must
 * not compete with the one they are in. `next` is the only other coloured
 * emblem on the road, which makes the target unambiguous without a badge, an
 * arrow or a word like LOCKED. `ahead` is dimmed and never invisible — a ladder
 * you cannot read is not a ladder — and there is no padlock anywhere, because a
 * padlock frames the ladder as content being withheld, which is the battle-pass
 * register §23 rules out.
 *
 * ## The track
 *
 * A hairline runs from each emblem to the next at the emblems' shared centre
 * line. Behind the learner it is solid ink — road already travelled; ahead of
 * them it is faint. `Singularity` has no outgoing segment, which is what makes
 * it read as the end of a journey rather than as item ten of a list.
 *
 * ## Scrolling
 *
 * The items are flexible with a floor, so at 1440 and 1024 all ten fit and the
 * road is a complete picture; below that the STRIP scrolls, never the page.
 * §32's rule. A fade at each edge says out loud that there is more — the old
 * strip clipped in silence, so a learner at 375 saw three tiers and no reason
 * to think there were seven others.
 *
 * ## Both edges, and measured rather than assumed
 *
 * The fade used to be one element pinned to the right and hidden with
 * `lg:hidden`, which was wrong in both directions and measurably so:
 *
 *   - The strip AUTO-CENTRES the learner's own tier, so for every tier above
 *     the first it opens with road hidden to the LEFT and nothing saying so.
 *     Measured at 375: tier 5 hides 253px left and 340px right; tier 10 hides
 *     593px to the left and NOTHING to the right — and the only fade drawn was
 *     the right-hand one, over the end of a road whose beginning was the part
 *     actually out of view.
 *   - `lg:hidden` is a guess at when the road fits, and it is off by about
 *     35px: between roughly 988 and 1023 all ten tiers fit with room to spare
 *     and the fade was still painted over `Singularity`, claiming more.
 *
 * So both fades are driven by the strip's own scroll offset instead. `left`
 * appears once something is scrolled past, `right` while something remains —
 * which is the same test in both directions and cannot disagree with the
 * layout, because it IS the layout.
 */
function TierRoad({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const strip = useRef<HTMLOListElement | null>(null);
  /* Which ends have road beyond them. Both false is a complete picture, which
     is what 1024 and 1440 render. */
  const [edges, setEdges] = useState({ left: false, right: false });

  /* Read from the element, never from a breakpoint. `2px` of slack because a
     fractional `scrollLeft` at the far end of a smooth scroll would otherwise
     leave the fade flickering on at rest. */
  const measure = useCallback(() => {
    const el = strip.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 });
  }, []);

  /* On mount, and on resize — a phone turned to landscape can take the road
     from scrolling to complete, and a fade left over from the old width would
     be a lie about the new one. */
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /*
   * Bring the learner's own tier into view.
   *
   * `scrollLeft` on the strip, NOT `scrollIntoView` on the node.
   * `scrollIntoView` walks every scrollable ancestor, and the road sits below
   * the fold — so it scrolled the DOCUMENT and the page loaded already past
   * the learner's rank and XP. `block: "nearest"` does not prevent that; it
   * only stops it overshooting once the element is on screen. Setting
   * `scrollLeft` directly cannot move the page, which is the property actually
   * wanted.
   *
   * `prefers-reduced-motion` is honoured, and the product's own `data-motion`
   * stamp beats the OS setting because a learner set it in preferences.
   */
  const current = useCallback(
    (node: HTMLLIElement | null) => {
      if (!node) return;
      const el = node.parentElement;
      if (!el) return;

      const target = node.offsetLeft - (el.clientWidth - node.clientWidth) / 2;
      const left = Math.max(0, target);
      /* Already where it wants to be — but the fades still have to be told,
         because this is the path taken at tier 1 and at every width where the
         whole road fits. */
      if (Math.abs(el.scrollLeft - left) < 2) return measure();

      const reduce =
        document.documentElement.dataset.motion === "reduce" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
      measure();
    },
    [measure],
  );

  return (
    <section
      className="rounded-[20px] sx-card border-2 border-b-fg/20 p-5 sm:p-6"
      aria-labelledby="league-road"
    >
      <h2 id="league-road" className="text-[17px] leading-[24px] font-bold">
        {t(LEAGUE_UI.roadTitle, locale)}
      </h2>

      <div className="relative mt-5">
        <ol
          ref={strip}
          onScroll={measure}
          className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {data.ladder.map((x, i) => {
            const isCurrent = x.tier === data.tier;
            const isNext = x.tier === data.tier + 1;
            const behind = x.tier < data.tier;
            const state = isCurrent ? "current" : isNext ? "next" : behind ? "behind" : "ahead";
            const last = i === data.ladder.length - 1;

            return (
              <li
                key={x.tier}
                ref={isCurrent ? current : undefined}
                aria-current={isCurrent ? "true" : undefined}
                className="relative flex min-w-[84px] flex-1 shrink-0 flex-col items-center gap-2 px-1"
              >
                {/* The segment to the next tier, at the emblems' centre line.
                    Absent on the last item — Singularity is where the road
                    ends, and a line running off its right edge would say the
                    opposite. */}
                {!last ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-[35px] left-1/2 h-0.5 w-full",
                      behind || isCurrent ? "bg-b-fg/20" : "bg-b-fg/8",
                    )}
                  />
                ) : null}

                <span className="relative grid h-[72px] place-items-center">
                  <TierEmblem
                    tier={x.tier}
                    name={x.name}
                    hue={x.hue}
                    size={isCurrent ? 72 : 48}
                    state={state}
                  />
                </span>

                <TierOrdinal
                  tier={x.tier}
                  className={cn(
                    "text-[10px] leading-[13px] tabular-nums",
                    isCurrent ? "text-b-fg/60" : "text-b-fg/35",
                  )}
                />
                <span
                  className={cn(
                    "text-center text-[11px] leading-[14px] font-bold break-words",
                    isCurrent
                      ? "text-b-fg"
                      : isNext
                        ? "text-b-fg/75"
                        : behind
                          ? "text-b-fg/50"
                          : "text-b-fg/45",
                  )}
                >
                  {x.name}
                </span>

                {isCurrent || isNext ? (
                  <span
                    className={cn(
                      "b-eyebrow max-w-full text-center text-[9px] leading-[12px]",
                      isCurrent ? "text-[var(--tier-here)]" : "text-b-fg/45",
                    )}
                    style={
                      isCurrent
                        ? {
                            ["--tier-here" as string]:
                              `color-mix(in oklab, ${x.hue} 76%, var(--color-b-fg))`,
                          }
                        : undefined
                    }
                  >
                    {t(isCurrent ? L.leagueLadderCurrent : LEAGUE_UI.roadNext, locale)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* "The road continues this way." Each edge is drawn only while there
            is actually road past it — see the note on the component. Both are
            decorative: the ladder itself is a list a screen reader walks in
            full, and scroll position means nothing to it. */}
        {edges.left ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(to_right,var(--color-b-bg),transparent)]"
          />
        ) : null}
        {edges.right ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(to_left,var(--color-b-bg),transparent)]"
          />
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* D · The rules                                                               */
/* -------------------------------------------------------------------------- */

/** The four a learner actually acts on, in the order they meet them. */
const HEADLINE_EARN = [
  "block_solved",
  "block_solved_unaided",
  "lesson_completed",
  "assessment_completed",
] as const;

type HeadlineKey = (typeof HEADLINE_EARN)[number];

const EARN_LABELS: Record<string, Localized> = {
  block_solved: L.xpBlockSolved,
  block_solved_unaided: L.xpBlockUnaided,
  challenge_solved: L.xpChallengeSolved,
  explanation_submitted: L.xpExplanationSubmitted,
  lesson_completed: L.xpLessonCompleted,
  assessment_completed: L.xpAssessmentCompleted,
  review_resolved: L.xpReviewResolved,
};

/** The order the full table is read in, headline entries first. */
const EARN_ORDER = [
  "block_solved",
  "block_solved_unaided",
  "challenge_solved",
  "explanation_submitted",
  "lesson_completed",
  "assessment_completed",
  "review_resolved",
];

const NEVER: Localized[] = [L.xpNotRun, L.xpNotRepeat, L.xpNotHints, L.xpNotTime, L.xpNotSpeed];

/**
 * How XP works, with the amounts, and none of it invented here.
 *
 * §27: the rules are never hidden, and a gamification system a learner cannot
 * audit is one they will assume is rigged the first time somebody else's number
 * goes up faster than theirs. So the four amounts a learner actually acts on
 * are on the page, unconditionally, and the remaining three plus the «XP не
 * начисляется» list are one press away — visible, not removed.
 *
 * Every number comes from `data.policy.amounts`, which is `XP_AMOUNTS` shipped
 * by the API. There is no second copy of the policy in this file: an entry the
 * policy does not carry is dropped rather than rendered as a zero, because a
 * screen that shows `+0` for a rule the ledger has never heard of is worse than
 * a screen that shows one rule fewer.
 */
function Rules({ data, locale }: { data: LeaguePayload; locale: Locale }) {
  const amount = (key: string): number | null => {
    const value = data.policy.amounts[key];
    return typeof value === "number" ? value : null;
  };

  /* Key and amount carried together, so nothing downstream can render a
     `+null` for a rule the shipped policy does not contain. */
  const priced = (keys: readonly string[]) =>
    keys
      .map((key) => ({ key, xp: amount(key) }))
      .filter((e): e is { key: string; xp: number } => e.xp !== null);

  const headline = priced(HEADLINE_EARN);
  const rest = priced(EARN_ORDER.filter((k) => !HEADLINE_EARN.includes(k as HeadlineKey)));

  return (
    <section
      className="rounded-[20px] sx-card border-2 border-b-fg/20 p-5 sm:p-6"
      aria-labelledby="league-rules"
    >
      <h2 id="league-rules" className="text-[17px] leading-[24px] font-bold">
        {t(L.leagueRulesTitle, locale)}
      </h2>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((e) => (
          <li
            key={e.key}
            className="flex items-baseline gap-2.5 rounded-[14px] border-2 border-b-fg/12 px-3.5 py-3"
          >
            <span className="shrink-0 text-[17px] leading-[22px] font-bold tabular-nums text-b-purple">
              +{e.xp}
            </span>
            <span className="min-w-0 text-[13px] leading-[18px] text-b-fg/75">
              {t(EARN_LABELS[e.key], locale)}
            </span>
          </li>
        ))}
      </ul>

      <Disclosure
        className="mt-4"
        label={t(LEAGUE_UI.rulesShowAll, locale)}
        labelOpen={t(LEAGUE_UI.rulesHideAll, locale)}
      >
        {rest.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {rest.map((e) => (
              <li
                key={e.key}
                className="flex items-baseline justify-between gap-3 text-[14px] leading-[20px]"
              >
                <span className="text-b-fg/80">{t(EARN_LABELS[e.key], locale)}</span>
                <span className="shrink-0 font-bold tabular-nums text-b-purple">+{e.xp}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <h3 className="mt-5 b-eyebrow text-b-fg/45">{t(L.leagueRulesNever, locale)}</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {NEVER.map((n, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 text-[14px] leading-[20px] text-b-fg/60"
            >
              <span aria-hidden="true" className="text-b-fg/30">
                —
              </span>
              {t(n, locale)}
            </li>
          ))}
        </ul>

        <p className="mt-5 border-t-2 border-b-fg/10 pt-4 text-[13px] leading-[19px] text-b-fg/60">
          {t(L.leagueXpNeverLost, locale)}
        </p>
      </Disclosure>
    </section>
  );
}

/**
 * One link, to the one explanation.
 *
 * `next/link` to a route that exists, not a modal and not a tooltip. §27's rule
 * that the rules are never hidden applies to the explanation as much as to the
 * amounts, and a learner who wants the whole thing gets a page they can read,
 * search and send to a parent.
 */
function HelpLink({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <Link
      href={LEAGUE_HELP_HREF}
      className={cn(
        "mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-b-purple underline-offset-4 hover:underline",
        className,
      )}
    >
      {t(LEAGUE_EXPLAIN.helpLink, locale)}
      {/* Decorative: the link already reads as a link and already says where it
          goes. An arrow announced by a screen reader would just be noise after
          the sentence that carries the meaning. */}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Below the threshold.
 *
 * Not an empty leaderboard, and not a 404. A learner can reach `/league` with
 * fewer than the unlock's XP — the nav gate is per-SCHOOL, the tab is shown to
 * every student at an enabled school, and a bookmark or a stale tab needs no
 * gate at all — and what they used to find was the board's own loading shape
 * followed by a table with one row on it. That is a picture of losing, shown to
 * somebody who has not started.
 *
 * ## No padlock
 *
 * The first tier's emblem, dimmed, is the lock. `tier-emblem.tsx` argues why:
 * `ahead` means "not yet reachable, but readable", and a padlock would frame
 * the league as content being withheld — the battle-pass register §23 rules
 * out. A learner sees `Pulse` and the real distance to it.
 *
 * ## Real numbers, and a real meter
 *
 * `lifetimeXp` is `sum(amount)` over `league_xp_awards`, resolved on the server
 * by the page. `role="progressbar"` carries all three values because the
 * visible bar is the only thing saying "how far along" and a div with a width
 * is nothing to a screen reader — the same construction, and the same reason,
 * as the home card's meter.
 */
function Locked({ unlock, locale }: { unlock: LeagueUnlockState; locale: Locale }) {
  const first = LEAGUE_TIERS[0];
  /* Clamped for the BAR only. The printed total is exactly what arrived: a
     learner somehow above the threshold in this state must be shown their own
     number, not the threshold. */
  const fraction = Math.max(0, Math.min(1, unlock.lifetimeXp / LEAGUE_UNLOCK_XP));
  const meterLabel = fill(t(L.leagueUnlockMeter, locale), {
    xp: unlock.lifetimeXp,
    goal: LEAGUE_UNLOCK_XP,
  });

  return (
    <section
      className="relative overflow-hidden rounded-[20px] sx-card border-2 border-b-fg/20 p-6 sm:p-8"
      style={{ ["--tier-hue" as string]: first.hue }}
      aria-labelledby="league-locked"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,color-mix(in_oklab,var(--tier-hue)_10%,transparent),transparent_70%)]"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
        <TierEmblem
          tier={first.tier}
          name={first.name}
          hue={first.hue}
          size={96}
          state="ahead"
        />

        <div className="min-w-0 flex-1">
          <h2 id="league-locked" className="text-[26px] leading-[32px] font-bold">
            {t(LEAGUE_UI.lockedTitle, locale)}
          </h2>

          <p className="mt-3 text-[28px] leading-[34px] font-bold tabular-nums">
            {unlock.lifetimeXp} / {LEAGUE_UNLOCK_XP}{" "}
            <span className="text-[16px] font-medium text-b-fg/45">XP</span>
          </p>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={LEAGUE_UNLOCK_XP}
            aria-valuenow={unlock.lifetimeXp}
            aria-label={meterLabel}
            className="mt-3 h-2.5 w-full max-w-[420px] overflow-hidden rounded-full bg-b-fg/10"
          >
            {/* No transition. A bar that fills on load suggests something was
                just earned, and nothing was. */}
            <div
              className="h-full rounded-full bg-[var(--tier-hue)]"
              style={{ width: `${fraction * 100}%` }}
            />
          </div>

          <p className="mt-3 text-[16px] leading-[23px] font-bold">
            {fill(t(LEAGUE_UI.lockedRemaining, locale), { xp: unlock.needed })}
          </p>
          <p className="mt-1.5 max-w-[520px] text-[14px] leading-[21px] text-b-fg/60">
            {withUnlockXp(t(LEAGUE_EXPLAIN.unlock, locale))}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/home"
              className="inline-flex h-11 items-center justify-center rounded-[56px] border-2 border-b-sched-edge bg-b-sched-fill px-5 leading-5 font-medium text-b-fg transition-colors hover:bg-b-fg/10"
            >
              {t(LEAGUE_UI.lockedGoLearn, locale)}
            </Link>
            <HelpLink locale={locale} className="mt-0" />
          </div>
        </div>
      </div>
    </section>
  );
}

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
        "flex flex-col gap-4 rounded-[20px] border-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6",
        r.movement === "promoted"
          ? "border-b-ok-edge/40 bg-b-ok-edge/[0.08]"
          : "sx-card border-b-fg/20",
      )}
      /* Polite, not assertive: it is news, not an alert, and it must not
         interrupt whatever a screen-reader user was already reading. */
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-4">
        <TierEmblem tier={after.tier} name={after.name} hue={after.hue} size={48} state="current" />
        <div className="min-w-0">
          <p className="b-eyebrow text-b-fg/45">{t(L.leagueResultTitle, locale)}</p>
          <p className="mt-0.5 text-[19px] leading-[26px] font-bold break-words">
            {fill(t(line, locale), { name: after.name })}
          </p>
          <p className="mt-0.5 text-[13px] leading-[19px] text-b-fg/60">
            {fill(t(L.leagueResultRank, locale), { rank: r.rank, n: r.groupSize })}
            {" · "}
            {r.finalXp} XP
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 cursor-pointer self-start rounded-full border-2 border-b-fg/20 px-4 py-2 text-[14px] font-bold transition-colors hover:bg-b-fg/[0.06] motion-reduce:transition-none sm:self-auto"
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
        className="mt-5 cursor-pointer rounded-full bg-b-purple px-6 py-2.5 text-[14px] font-bold text-b-on-fill transition-opacity hover:opacity-90 motion-reduce:transition-none"
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
      <div className="h-[188px] animate-pulse rounded-[20px] bg-b-fg/[0.06]" />
      <div className="h-[420px] animate-pulse rounded-[20px] bg-b-fg/[0.06]" />
      <div className="h-[168px] animate-pulse rounded-[20px] bg-b-fg/[0.06]" />
    </div>
  );
}
