"use client";

import Link from "next/link";
import type { Locale } from "@schools/curriculum/types";
import { daysLeftLabel, L, t } from "@schools/presentation/labels";
import {
  LEAGUE_EXPLAIN,
  LEAGUE_HELP_HREF,
  withUnlockXp,
} from "@schools/leagues/explain";
import { LEAGUE_UNLOCK_XP } from "@schools/leagues/unlock";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { TierEmblem } from "./tier-emblem";

/**
 * The league card on the learner home.
 *
 * ## Two states, and neither of them claims anything the ledger does not say
 *
 * BELOW the threshold: a meter, the real lifetime total, the real remainder,
 * one sentence saying what opens it, and a link to the article that explains
 * the whole thing. No tier, no leaderboard, no classmate, no rank — the
 * threshold exists precisely so that a fourteen-year-old's first afternoon does
 * not end with a list of people who are ahead of them, and a "preview" of that
 * list would defeat it while pretending not to.
 *
 * AT or ABOVE it: the tier, this week's XP, the position IF there is one, and
 * how much of the week is left. `LeagueView.you` is null until the learner has
 * earned XP in the current week, and this card renders that as
 * «Заработай XP на этой неделе, чтобы войти в таблицу» rather than as a
 * position. Open and ranked are different facts and the card keeps them apart.
 *
 * ## No leaderboard here
 *
 * The board lives on `/league`. A second copy on the home screen would be a
 * second thing to keep in step with settlement, and — more to the point — it
 * would put a ranked list of children on the first screen of the product.
 *
 * ## Everything numeric arrives from the server
 *
 * `lifetimeXp` is `sum(amount)` over `league_xp_awards`; `weeklyXp`, `rank` and
 * `groupSize` come from `leagueForLearner`; `daysLeft` is computed from the
 * week's own `endsAt` on the server so that this component does nothing with a
 * clock. There is no animation on the meter: a bar that fills on load suggests
 * something was just earned, and nothing was.
 */

export interface HomeLeagueActive {
  tier: number;
  /** From `LEAGUE_TIERS`. Latin in both languages — see `tiers.ts`. */
  tierName: string;
  tierHue: string;
  weeklyXp: number;
  /** Null when the learner has earned nothing this week. Not zero, and not 1. */
  rank: number | null;
  groupSize: number;
  /** Whole days until the week settles. Computed server-side; never negative. */
  daysLeft: number;
}

export interface HomeLeagueData {
  unlocked: boolean;
  lifetimeXp: number;
  /** XP still to earn. Zero once unlocked. */
  needed: number;
  /** Present only when `unlocked`. */
  active: HomeLeagueActive | null;
}

const CARD =
  "flex w-full flex-col gap-3 rounded-[20px] sx-card border-2 border-b-edge p-5";

export function HomeLeagueCard({ data }: { data: HomeLeagueData }) {
  const { locale } = useLocale();
  const loc = locale as Locale;

  return data.unlocked && data.active ? (
    <OpenCard active={data.active} loc={loc} />
  ) : (
    <LockedCard lifetimeXp={data.lifetimeXp} loc={loc} />
  );
}

/* -------------------------------------------------------------------------- */
/* Below the threshold                                                        */
/* -------------------------------------------------------------------------- */

function LockedCard({ lifetimeXp, loc }: { lifetimeXp: number; loc: Locale }) {
  /* Clamped for the BAR only. `lifetimeXp` itself is printed exactly as it
     arrived: a learner somehow above the threshold in this state must be shown
     their own total, not the threshold.

     (The numeral is deliberately absent from this file, comments included.
     `tests/leagues/home-card.test.ts` scans the source text and does not strip
     comments — the same trap `league-parts.tsx` writes around for the forbidden
     colour utility — so naming it even in prose would fail the assertion that
     there is only one definition of it.) */
  const fraction = Math.max(0, Math.min(1, lifetimeXp / LEAGUE_UNLOCK_XP));
  const meterLabel = t(L.leagueUnlockMeter, loc)
    .replace("{xp}", String(lifetimeXp))
    .replace("{goal}", String(LEAGUE_UNLOCK_XP));

  return (
    <section className={CARD} aria-labelledby="home-league-eyebrow">
      <p id="home-league-eyebrow" className="b-eyebrow leading-[18px]">
        {t(L.leagueUnlockEyebrow, loc)}
      </p>

      <p className="text-[24px] leading-[30px] font-bold tabular-nums">
        {lifetimeXp} / {LEAGUE_UNLOCK_XP} XP
      </p>

      {/*
        A real meter over a real total.

        `role="progressbar"` with the three values, because the visible bar is
        the only thing carrying "how far along" and a div with a width is
        nothing to a screen reader. The accessible name repeats both numbers
        rather than a percentage — «77%» is not something a learner can act on
        and «Ещё 40 XP» is.
      */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={LEAGUE_UNLOCK_XP}
        aria-valuenow={lifetimeXp}
        aria-label={meterLabel}
        className="h-2 w-full overflow-hidden rounded-full bg-b-fg/10"
      >
        <div
          className="h-full rounded-full bg-b-purple"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <p className="text-[14px] leading-5 text-b-fg/60">
        {withUnlockXp(t(LEAGUE_EXPLAIN.unlock, loc))}
      </p>

      <HelpLink loc={loc} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* At or above it                                                             */
/* -------------------------------------------------------------------------- */

function OpenCard({ active, loc }: { active: HomeLeagueActive; loc: Locale }) {
  return (
    <section className={CARD} aria-labelledby="home-league-title">
      <div className="flex items-center gap-3">
        {/* The emblem, not the old `01`-in-a-box badge. `tier-emblem.tsx`
            carries the argument: ten hues cannot separate ten tiers, so
            identity is shape first and the numeral second — and at 48px inside
            a home card there is room for the shape and not for both. */}
        <TierEmblem
          tier={active.tier}
          name={active.tierName}
          hue={active.tierHue}
          size={48}
          state="current"
        />
        <div className="min-w-0">
          <p id="home-league-title" className="leading-6 font-bold">
            {t(L.leagueOf, loc).replace("{name}", active.tierName)}
          </p>
          <p className="text-[14px] leading-5 text-b-fg/60">
            {active.daysLeft <= 1
              ? t(L.leagueEndsSoon, loc)
              : `${t(L.leagueEndsIn, loc)} — ${daysLeftLabel(active.daysLeft, loc)}`}
          </p>
        </div>
      </div>

      <dl className="flex items-end gap-6">
        <div>
          <dt className="b-eyebrow leading-[18px]">{t(L.leagueXpThisWeek, loc)}</dt>
          <dd className="text-[22px] leading-[28px] font-bold tabular-nums">
            {active.weeklyXp}
          </dd>
        </div>
        {/*
          The rank, only when there IS one.

          `rank === null` means the learner has earned no XP this week, which is
          an ordinary Monday and not a position. The alternative — printing the
          bottom of the group — would tell a child they are last at a competition
          that has not started.
        */}
        {active.rank !== null ? (
          <div>
            <dt className="b-eyebrow leading-[18px]">{t(L.leagueYourRank, loc)}</dt>
            <dd className="text-[22px] leading-[28px] font-bold tabular-nums">
              {active.rank}
              <span className="text-[14px] font-medium text-b-fg/50">
                {" "}
                / {active.groupSize}
              </span>
            </dd>
          </div>
        ) : null}
      </dl>

      {active.rank === null ? (
        <p className="text-[14px] leading-5 text-b-fg/60">
          {t(L.leagueNotRankedYet, loc)}
        </p>
      ) : null}

      <Link
        href="/league"
        className={cn(
          "flex h-11 w-full items-center justify-center rounded-[56px]",
          "border-2 border-b-sched-edge bg-b-sched-fill",
          "leading-5 font-medium text-b-fg transition-colors hover:bg-b-fg/10",
        )}
      >
        {t(L.leagueOpenCta, loc)}
      </Link>

      <HelpLink loc={loc} />
    </section>
  );
}

/**
 * One link, to the one explanation.
 *
 * `LEAGUE_HELP_HREF` is `/help/leagues`, which is a real article in
 * `schools/help/content.ts` and is asserted to resolve by
 * `tests/leagues/home-card.test.ts`. The label comes from `LEAGUE_EXPLAIN` so
 * that this card and `/league` name the same article with the same words.
 */
function HelpLink({ loc }: { loc: Locale }) {
  return (
    <Link
      href={LEAGUE_HELP_HREF}
      className="text-[14px] leading-5 font-medium text-b-fg/70 underline underline-offset-2 hover:text-b-fg"
    >
      {t(LEAGUE_EXPLAIN.helpLink, loc)}
    </Link>
  );
}
