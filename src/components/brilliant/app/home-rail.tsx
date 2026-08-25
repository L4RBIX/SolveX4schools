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

const LEAGUES_BADGE =
  "/assets/original/brilliant/brilliant.org/images/loggedInHomepage/leagues-locked.svg";

export interface HomeRailProps {
  name?: string;
  streak?: number;
  /** Which of the five day slots are already earned. */
  days?: { label: string; done: boolean }[];
  xp?: number;
  xpGoal?: number;
  className?: string;
}

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
}: HomeRailProps) {
  return (
    <aside
      className={cn(
        "sticky top-[105px] z-10 hidden w-[384px] min-w-[384px] flex-col items-start gap-5 pb-7 lg:flex",
        className,
      )}
    >
      <p className="w-full text-[20px] leading-[30px] font-bold">Welcome, {name}</p>

      <AskBar />

      {/* streak card — 2px #4C4C4C border, radius 16 */}
      <div className="w-full rounded-2xl border-2 border-b-edge bg-b-bg">
        <div className="flex flex-col gap-2 p-6">
          <div className="mx-1 flex h-[60px] items-center justify-between">
            <div className="flex w-[68px] items-center">
              <span className="block w-9 text-[48px] leading-[60px] font-bold">{streak}</span>
              <StreakBolt size={32} completed={streak > 0} className={streak > 0 ? "text-b-pear" : "text-white/40"} />
            </div>
            <StreakCharges charges={2} />
          </div>

          <p className="mb-2">
            Solve <strong className="font-bold">3 problems</strong> to start a streak
          </p>

          <div className="flex flex-1 justify-between">
            {days.map((d) => (
              <div key={d.label} className="flex w-12 flex-col items-center gap-2">
                <DayBolt done={d.done} />
                <span className="p-1 text-center font-bold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* leagues card — radius 20, padding 20 */}
      <div className="flex w-full items-center rounded-[20px] border-2 border-b-edge bg-b-bg p-5">
        <Image
          src={LEAGUES_BADGE}
          alt="Locked Leagues Badge"
          width={64}
          height={64}
          className="mr-4 h-16 w-16 shrink-0"
        />
        <div>
          <p className="b-eyebrow leading-[18px]">Unlock Leagues</p>
          <p className="leading-6 text-white/60">
            {xp} of {xpGoal} XP
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * The ask field. It is a `<button>` in the original, not an input — the real
 * search UI opens elsewhere — so the "placeholder" is a span and the whole
 * row is clickable.
 */
function AskBar() {
  return (
    <button
      type="button"
      className="flex h-[52px] w-full items-center gap-2 rounded-full border-2 border-white/20 bg-b-bg py-1 pr-1 pl-4 text-left"
    >
      {/* lucide-search, 24 viewBox drawn at 16 */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-white/60"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className="flex-1 overflow-hidden text-[14px] leading-[21px] text-white/40">
        What do you want to learn?
      </span>
      <span className="flex h-10 items-center justify-center rounded-[54px] border-2 border-transparent bg-white/5 px-[14px] py-2 leading-5 font-medium text-white/20">
        Ask
      </span>
    </button>
  );
}

/**
 * "Streak Charges" — two battery glyphs. The label itself is visually hidden
 * in the original and exposed only to assistive tech, which is why the card
 * shows nothing but the two icons.
 */
function StreakCharges({ charges }: { charges: number }) {
  return (
    <button type="button" className="relative flex h-6 items-center justify-center gap-2">
      <span className="sr-only">Streak Charges</span>
      {Array.from({ length: charges }, (_, i) => (
        <svg
          key={i}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-white/20"
        >
          <mask id={`chg-${i}`} fill="white">
            <rect x="4.80029" y="2.39795" width="14.4" height="19.2009" rx="1.07939" />
          </mask>
          <rect
            x="4.80029"
            y="2.39795"
            width="14.4"
            height="19.2009"
            rx="1.07939"
            stroke="currentColor"
            strokeWidth="3.75925"
            mask={`url(#chg-${i})`}
          />
          <path
            d="M9.07959 0.938721L14.9214 0.938721C14.9982 0.938878 15.0609 1.00151 15.061 1.07837L15.061 1.45923L8.93994 1.45923L8.93994 1.07837L8.95166 1.02466C8.97278 0.974571 9.02184 0.938839 9.07959 0.938721Z"
            stroke="currentColor"
            strokeWidth="1.87963"
          />
          <path
            d="M9.0791 23.0598L14.9209 23.0598C14.9978 23.0597 15.0604 22.997 15.0605 22.9202L15.0605 22.5393L8.93945 22.5393L8.93945 22.9202L8.95117 22.9739C8.97229 23.024 9.02136 23.0597 9.0791 23.0598Z"
            stroke="currentColor"
            strokeWidth="1.87963"
          />
        </svg>
      ))}
    </button>
  );
}

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
        fill={done ? "var(--color-b-pear)" : "rgba(255,255,255,0.2)"}
      />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="15"
        stroke="#fff"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />
    </svg>
  );
}
