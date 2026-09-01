"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { StreakBolt } from "./app-icons";

/**
 * The sticky left rail on the logged-in home page.
 *
 * Measured at 1470: `position: sticky; top: 105px; z-index: 10`, width and
 * min-width 384px, `gap: 20px`, `margin-top: 40px`, `padding-bottom: 28px`.
 * The whole rail is hidden below Panda's `lg` breakpoint.
 *
 * Account data is mocked. The live account showed 0 XP and no streak started;
 * the layout is the original's, the numbers are not the owner's.
 */

export interface HomeRailProps {
  /**
   * The learner's name, when one is known.
   *
   * `null` means nobody has told us — which is the truth until enrolment
   * exists. The greeting then drops the comma and the name rather than
   * addressing a fourteen-year-old by somebody else's.
   */
  name?: string | null;
  /**
   * Days active this week. Counted from real episodes, never a placeholder.
   *
   * The big numeral is the COUNT OF ACTIVE DAYS, not a consecutive-day streak:
   * nothing in the ledger records unbroken runs, and calling a count a streak
   * would be a claim the data cannot carry.
   */
  streak?: number;
  /** Which of the five day slots are already earned. */
  days?: { label: string; done: boolean }[];
  xp?: number;
  xpGoal?: number;
  className?: string;
  /**
   * Visible copy. Every label defaults to the reference route's English literal
   * so /brilliant/app/home is untouched; the product supplies Kazakh/Russian.
   */
  labels?: Partial<RailLabels>;
  /**
   * The goal card, replacing "Unlock Leagues".
   *
   * The programme's own weekly commitment is ~40 minutes of platform practice
   * (PDF p.2), which is a real target a learner can act on. An XP league is
   * not part of this product and inventing one would be a fabricated metric.
   */
  goal?: { eyebrow: string; detail: string; badge?: string } | null;
  /**
   * Stack above the deck on narrow screens instead of disappearing.
   *
   * The reference hides this rail entirely below 1024 because brilliant.org
   * serves a different mobile design there. We do not have a different mobile
   * design, so hiding it means a learner on a phone never sees their greeting,
   * their week or their goal — the whole left half of the product. Off by
   * default so /brilliant/app/home keeps the measured behaviour.
   */
  stackOnMobile?: boolean;
  /**
   * Rendered last in the rail, under the week.
   *
   * The league card is the only thing that uses it, and it is a slot rather
   * than a prop because whether a learner HAS a league is a server decision
   * (`leagueNavVisible`, resolved in `src/app/home/page.tsx`) and this
   * component must not learn how to ask it. Nothing here renders when the
   * caller passes nothing, so `/brilliant/app/home` is unchanged.
   */
  extra?: React.ReactNode;
}

export interface RailLabels {
  welcome: string;
  /** Used when no name is known. Not `welcome` with the name cut off. */
  welcomeAnonymous: string;
  streakPrompt: React.ReactNode;
  /** Screen-reader name for the week strip. */
  daysLabel: string;
}

const DEFAULT_LABELS: RailLabels = {
  welcome: "Welcome",
  welcomeAnonymous: "Welcome",
  streakPrompt: (
    <>
      Solve <strong className="font-bold">3 problems</strong> to start a streak
    </>
  ),
  daysLabel: "",
};

const DEFAULT_DAYS = [
  { label: "T", done: false },
  { label: "W", done: false },
  { label: "Th", done: false },
  { label: "F", done: false },
  { label: "S", done: false },
];

export function HomeRail({
  name = "bekarys",
  streak = 0,
  days = DEFAULT_DAYS,
  xp = 0,
  xpGoal = 175,
  className,
  labels,
  goal = { eyebrow: "Unlock Leagues", detail: "", badge: undefined },
  stackOnMobile = false,
  extra = null,
}: HomeRailProps) {
  const L = { ...DEFAULT_LABELS, ...labels };
  return (
    <aside
      className={cn(
        "flex-col items-start gap-5 pb-7",
        "lg:sticky lg:top-[105px] lg:z-10 lg:flex lg:w-[384px] lg:min-w-[384px]",
        stackOnMobile ? "flex w-full min-w-0" : "hidden",
        className,
      )}
    >
      {/*
        The greeting carries the top of the rail on its own now.

        It used to be a 30px line of text with a 52px ask control under it, and
        the control was removed because it led nowhere. At 20px it was the
        smallest thing in the column and the eye went straight past it to the
        246px streak card; at 26/32 it reads as the head of the rail, which is
        the job the two of them used to share. The weekly-goal card moved up
        into the rest of the space — see below.
      */}
      <p className="w-full text-[26px] leading-[32px] font-bold">
        {name ? `${L.welcome}, ${name}` : L.welcomeAnonymous}
      </p>

      {/*
        goal card — radius 20, padding 20.

        FIRST of the two cards, where the ask control used to sit. This is the
        one card on the rail carrying a number the learner can act on today
        («0 из 40 мин»), and it is 108px against the streak card's 246 — a
        mid-weight element between a line of text and a heavy bordered block,
        which is exactly the role the 52px control was playing structurally
        while doing nothing functionally.
      */}
      {goal ? (
        <div className="flex w-full items-center rounded-[20px] sx-card border-2 border-b-edge p-5">
          {goal.badge ? (
            <Image
              src={goal.badge}
              alt=""
              width={64}
              height={64}
              className="mr-4 h-16 w-16 shrink-0"
            />
          ) : (
            /* The reference puts `leagues-locked.svg` here — a padlocked
               shield. Two problems: it is Brilliant's file, and a padlock next
               to a weekly practice target says the target is something the
               learner has to unlock. It is not; it is 40 minutes. */
            <GoalRing
              filled={goalFraction(goal.detail)}
              className="mr-4 h-16 w-16 shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="b-eyebrow leading-[18px]">{goal.eyebrow}</p>
            <p className="leading-6 text-b-fg/60">
              {goal.detail || `${xp} of ${xpGoal} XP`}
            </p>
          </div>
        </div>
      ) : null}

      {/* streak card — 2px #4C4C4C border, radius 16 */}
      <div className="w-full rounded-2xl sx-card border-2 border-b-edge">
        <div className="flex flex-col gap-2 p-6">
          <div className="mx-1 flex h-[60px] items-center justify-between">
            <div className="flex w-[68px] items-center">
              <span className="block min-w-9 text-[48px] leading-[60px] font-bold tabular-nums">{streak}</span>
              <StreakBolt size={32} completed={streak > 0} className={streak > 0 ? "text-b-pear" : "text-b-fg/40"} />
            </div>
            {/* The reference shows "streak charges" — a freeze mechanic this
                product does not have. Removed rather than drawn inert. */}
          </div>

          <p className="mb-2">{L.streakPrompt}</p>

          <ul
            aria-label={L.daysLabel || undefined}
            className="flex flex-1 justify-between"
          >
            {days.map((d) => (
              <li key={d.label} className="flex w-11 flex-col items-center gap-2">
                <DayBolt done={d.done} />
                <span className="p-1 text-center text-[15px] font-bold">{d.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {extra}
    </aside>
  );
}

/**
 * "Streak Charges" — two battery glyphs. The label itself is visually hidden
 * in the original and exposed only to assistive tech, which is why the card
 * shows nothing but the two icons.
 */

/**
 * A day slot: a bolt inside a 30px ring, drawn on a 32 viewBox at 48px.
 * Unearned days fill the bolt with `bg.tertiary` (white @ 20%); the ring is
 * `text.primary` at 20% opacity, 1.5px.
 */
function DayBolt({ done }: { done: boolean }) {
  return (
    <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="max-w-12 shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.2903 16.2252L16.5654 8.24794C16.9417 7.76964 17.7079 8.10483 17.612 8.70578L16.7061 14.3834H20.5934C21.3322 14.3834 21.7459 15.2351 21.2891 15.8159L15.014 23.7931C14.6378 24.2714 13.8716 23.9362 13.9674 23.3353L14.8734 17.6577H10.9861C10.2472 17.6577 9.83354 16.8059 10.2903 16.2252Z"
        /* The unearned bolt is a token, not a literal: `rgba(255,255,255,0.2)`
           is invisible on a light card, and this is the one glyph on the rail
           that has to read as "not yet" rather than as "missing". */
        fill={done ? "var(--color-b-pear)" : "var(--color-b-text-off)"}
      />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="15"
        stroke="var(--color-b-fg)"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * The weekly-goal dial.
 *
 * Drawn here rather than loaded: it is two circles, and an inline one carries
 * no licence and no request. The arc is the fraction of the target actually
 * reached — nothing else on this card is decorative.
 */
function GoalRing({ filled, className }: { filled: number; className?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const shown = Math.max(0, Math.min(1, filled));
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r={r} stroke="currentColor" strokeWidth="6" className="text-b-fg/10" />
      {shown > 0 ? (
        <circle
          cx="32"
          cy="32"
          r={r}
          stroke="var(--color-b-pear)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * shown} ${c}`}
          transform="rotate(-90 32 32)"
        />
      ) : null}
      <circle cx="32" cy="32" r="4" className="fill-b-fg/25" />
    </svg>
  );
}

/**
 * Read the two numerals out of the detail line ("12 из 40 мин").
 *
 * The caller already builds that sentence per locale, and threading a second
 * numeric prop through for the same fact invites the two disagreeing. Anything
 * unparseable yields an empty ring, which is the safe direction to be wrong in.
 */
function goalFraction(detail: string): number {
  const nums = detail.match(/\d+/g);
  if (!nums || nums.length < 2) return 0;
  const [a, b] = nums.map(Number);
  // Kazakh puts the target first ("40 мин ішінен 12"), Russian puts it second.
  const done = Math.min(a, b);
  const target = Math.max(a, b);
  return target > 0 ? done / target : 0;
}
