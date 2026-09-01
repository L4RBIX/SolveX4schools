"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  monthThemeFromDeckId,
  monthThemeVars,
  type MonthTheme,
} from "@schools/presentation/month-theme";
import { MonthGlyphMark } from "../gameboard/month-glyph";
import { PedestalActive, PedestalLocked } from "./pedestal";

/**
 * "Jump back in" — the stacked course deck on the logged-in home page.
 *
 * This is a real 3D stack, not overlapping 2D cards. Measured from the live
 * DOM: an ancestor carries `perspective: 1200px` with
 * `perspective-origin: 302px 270px`, the card wrappers are `preserve-3d`, and
 * each card behind the front one is pushed back a further **-100px on Z** with
 * a compensating X translate, so they shrink and inset as they recede:
 *
 *   front  z-5   556x540  border #4C4C4C          translateZ(0)
 *   2nd    z-4   513x498  border #4C4C4C          translate3d(-515.69, 0, -100)
 *   3rd    z-3   477x463  border rgba(255,255,255,.05)  translate3d(-1039.72, 0, -200)
 *   4th    z-2   445x432  border rgba(255,255,255,.05)  translate3d(-1572.09, 0, -300)
 *   5th          417x405  border rgba(255,255,255,.05)  translate3d(-2112.8, 0, -400)
 *
 * Note the border drops to 5% white from the third card back — only the top
 * two read as "real" cards.
 *
 * Here the same look is produced with `translateZ` steps under one
 * `perspective`, so the geometry stays correct at any width rather than being
 * pinned to the 1470 measurements above.
 */

export interface DeckCourse {
  id: string;
  title: string;
  level: string;
  href: string;
  image: string;
  thumb: string;
  /**
   * The learner may not enter this month yet.
   *
   * A locked card keeps its title, its art and its rows — the deck is where a
   * learner sees the shape of their year — but nothing on it navigates into the
   * month. Its one link is `href`, the month's own board at `/course/N`, which
   * renders a panel saying what opens it.
   */
  locked?: boolean;
  lessons: {
    title: string;
    /** Absent on a row that cannot be opened. Never substituted for. */
    href?: string;
    done: boolean;
    active: boolean;
    locked?: boolean;
  }[];
}

export interface CourseDeckProps {
  courses: DeckCourse[];
  className?: string;
  /** Section heading. Defaults to the reference route's own literal. */
  heading?: string;
  /** Primary CTA label on the front card. */
  startLabel?: string;
  /**
   * Copy for a locked card. Defaults to the reference route's English, which is
   * never reached in the product — every locked card is fed Kazakh or Russian.
   */
  lockedLabels?: {
    /** One short line under the rows: why nothing here opens. */
    reason: string;
    /** The CTA that replaces "Start". It goes to `/course/N`, and it says so. */
    cta: string;
    /** Read out on a row that is not a link. Never colour or opacity alone. */
    row: string;
  };
  /** Colour of the marker on the active lesson's pedestal. See `pedestal.tsx`. */
  markerColor?: string;
}

const DEFAULT_LOCKED_LABELS = {
  reason: "This month is not open yet",
  cta: "See what opens it",
  row: "Locked",
};

/**
 * Per-depth placement, taken straight off the live stack and expressed as
 * fractions of the front card so it survives any container width.
 *
 * The scales are exactly `1200 / (1200 + 100d)` — i.e. each card really is one
 * more `translateZ(-100px)` under the 1200px perspective. The x/y offsets are
 * the original's compensating translate, measured rather than derived, because
 * they do not resolve to a single vanishing point.
 *
 *   d  measured box (x,y,w,h)   scale
 *   0  675,155,556,540          1
 *   1  734,176,513,498          0.9231
 *   2  777,194,477,463          0.8571
 *   3  807,209,445,432          0.8
 *   4  828,223,417,405          0.75
 */
const DEPTHS = [
  { x: 0, y: 0, s: 1 },
  { x: 0.1061, y: 0.0389, s: 1200 / 1300 },
  { x: 0.1835, y: 0.0722, s: 1200 / 1400 },
  { x: 0.2374, y: 0.1, s: 1200 / 1500 },
  { x: 0.2752, y: 0.1259, s: 1200 / 1600 },
];

/**
 * A card's month identity, or nothing.
 *
 * The deck is fed a plain `DeckCourse[]` so the renderer stays independent of
 * the curriculum — which means the only month identity that reaches here is the
 * `month-<index>` id the adapter mints. `monthThemeFromDeckId` does the parse;
 * this wraps it into the scoped custom properties a card paints itself with.
 *
 * `null` on the reverse-engineering baseline, whose cards are courses and not
 * months. Every accented rule below falls back to the literal it used to be, so
 * that baseline renders exactly as measured.
 */
function cardTheme(id: string): { theme: MonthTheme; vars: CSSProperties } | null {
  const theme = monthThemeFromDeckId(id);
  if (!theme) return null;
  return { theme, vars: monthThemeVars(theme) as CSSProperties };
}

export function CourseDeck({
  courses,
  className,
  heading = "Jump back in",
  startLabel = "Start",
  lockedLabels,
  markerColor,
}: CourseDeckProps) {
  const locked = { ...DEFAULT_LOCKED_LABELS, ...lockedLabels };
  const [index, setIndex] = useState(0);
  const active = courses[index];

  /* `min-w-0` is load-bearing: the thumbnail rail's tiles are `shrink-0`, and a
     flex item defaults to `min-width: auto`, so without it the rail's
     min-content width (nine tiles ≈ 884px) becomes the deck's floor and the
     whole column pushes out of the page instead of scrolling inside it. */
  return (
    /* `overflow-x-clip`: the stack's back cards are translated up to +27.5% of
       the card width, which fits inside the reference's own 800px column and
       does not fit inside a phone. Clipping at the column edge loses a sliver
       of a decorative card; not clipping gives the whole page a horizontal
       scrollbar. */
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start gap-5 overflow-x-clip",
        className,
      )}
    >
      <h2 className="h-[30px] w-full text-[20px] leading-[25px] font-bold">{heading}</h2>

      <div className="h-[540px] max-h-[540px] min-h-[274px] w-full">
        <div className="relative h-full w-full">
          {courses.map((c, i) => {
            const depth = (i - index + courses.length) % courses.length;
            if (depth > 4) return null;
            const d = DEPTHS[depth];
            return (
              <div
                key={c.id}
                aria-hidden={depth !== 0}
                style={{
                  ...cardTheme(c.id)?.vars,
                  transform: `translate(${d.x * 100}%, ${d.y * 100}%) scale(${d.s})`,
                  transformOrigin: "top left",
                  zIndex: 5 - depth,
                }}
                className="absolute inset-0 overflow-hidden transition-transform duration-500 ease-b-spring"
              >
                <div
                  className={cn(
                    "h-full overflow-clip rounded-2xl border-2 bg-b-elevated pt-5",
                    depth < 2 ? "border-b-edge" : "border-b-fg/5",
                  )}
                >
                  {depth === 0 && (
                    <DeckCardBody
                      course={c}
                      startLabel={startLabel}
                      lockedLabels={locked}
                      markerColor={markerColor}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* thumbnail switcher — 84x60 tiles, 16px gap. The reference's active
          tile is `#170B29` on `#7139CC`; both are dark-arm literals and both
          are now derived from the month's accent instead. See the style below. */}
      {/* Nine month tiles need ~668px inside a 540px column. The original had no
          wrap and no scroll, so the overflow simply left the layout. Scrolls
          now, and stays centred while the set still fits. */}
      {/* `justify-center` on an overflowing scroll container clips BOTH ends and
          leaves the first tile unreachable, so the row starts flush left and
          only centres itself when the set genuinely fits (`justify-center` via
          `mx-auto` on the inner track instead of on the scroller). */}
      <div className="my-5 h-[60px] w-full overflow-x-auto overscroll-x-contain px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex h-[60px] w-max gap-4">
        {courses.map((c, i) => {
          const ct = cardTheme(c.id);
          return (
          <button
            key={c.id}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            onClick={() => setIndex(i)}
            style={ct?.vars}
            className="relative h-[60px] w-[84px] max-w-[84px] min-w-[60px] shrink-0 overflow-clip rounded-lg"
          >
            <div
              className={cn(
                "relative flex h-full w-full items-center justify-center rounded-lg border-2 transition-all duration-200",
                i !== index && "border-b-fg/20 bg-b-bg hover:border-b-fg/40",
              )}
              /*
                `border-[#7139CC] bg-[#170B29]` was the selected tile in both
                themes: a violet ring round a near-black box, sitting on a white
                page in the light theme. The border is now the month's accent,
                and the fill is that accent mixed into the page — derived, so it
                cannot be a dark box on a light ground in any month, and tinted,
                so nine tiles do not all light up the same.
              */
              style={
                i === index
                  ? {
                      borderColor: "var(--sx-month-accent, var(--color-b-deck-on-edge))",
                      backgroundColor:
                        "color-mix(in oklab, var(--sx-month-accent, var(--color-b-deck-on-edge)) 16%, var(--color-b-bg))",
                    }
                  : undefined
              }
            >
              <Image src={c.thumb} alt="" width={40} height={40} className="h-10 w-10" />
              {/*
                The tile's non-colour discriminator.

                Nine month accents collapse to ~2 ΔE under tritanopia (see
                `month-theme.ts`), so "which tile is selected" cannot rest on a
                ring colour. The glyph is a different SILHOUETTE per month and
                only the selected tile carries it, which is a shape difference
                rather than a hue difference.
              */}
              {i === index && ct ? (
                <span
                  className="absolute right-1 bottom-1"
                  style={{ color: "var(--sx-month-accent, var(--color-b-deck-on-edge))" }}
                >
                  <MonthGlyphMark theme={ct.theme} size={12} />
                </span>
              ) : null}
            </div>
          </button>
          );
        })}
        </div>
      </div>

      <span className="sr-only">Showing {active.title}</span>
    </div>
  );
}

/**
 * Card interior. The body is `space-between` in a column, which is what pushes
 * the 150px course art into the middle of the card without an explicit spacer.
 */
function DeckCardBody({
  course,
  startLabel,
  lockedLabels,
  markerColor,
}: {
  course: DeckCourse;
  startLabel: string;
  lockedLabels: typeof DEFAULT_LOCKED_LABELS;
  markerColor?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-between gap-4 p-5">
      <div className="flex w-full flex-1 flex-col items-center justify-between gap-2">
        <Link href={course.href} aria-label={`${course.title} level 1`} className="block w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-5 items-center justify-center" />
            <h3 className="text-center text-[24px] leading-[30px] font-bold">{course.title}</h3>
            {/* The month's name — the deck's "month name surface". `#7139CC`
                was a dark-arm literal painted in both themes; the accent it
                becomes is authored per arm and per month. */}
            <h5
              className="b-eyebrow min-h-[15px] text-center leading-[18px]"
              style={{ color: "var(--sx-month-accent, var(--color-b-deck-on-edge))" }}
            >
              {course.level}
            </h5>
          </div>
        </Link>

        <Image
          src={course.image}
          alt=""
          width={150}
          height={150}
          className="max-h-[150px] w-[150px] flex-1 object-contain"
        />

        {/* The card height is fixed and the original clipped anything past ~3
            rows. A curriculum month has eight lessons, so the list scrolls
            inside its own box rather than silently hiding two thirds of
            September. `overscroll-contain` keeps the scroll from escaping to
            the page behind the card. */}
        <div className="w-full max-h-[220px] overflow-y-auto overscroll-contain">
          {course.lessons.map((l) => (
            <LessonRow
              key={l.title}
              lesson={l}
              lockedRowLabel={lockedLabels.row}
              markerColor={markerColor}
            />
          ))}
          {/*
            One short line, once per card, rather than a sentence on every row.

            `opacity-50` on a row means "not the lesson you are on" and has
            meant that since the deck was cloned — the first row of a locked
            month was fully opaque, so the card carried no signal at all that
            none of it opened. This says it in words, which is the only channel
            that survives both colour blindness and a screen reader.
          */}
          {course.locked ? (
            <p className="pt-1 pb-1 text-[13px] leading-[18px] text-b-fg/60">
              {lockedLabels.reason}
            </p>
          ) : null}
        </div>
      </div>

      {/*
        The CTA resolves to the month's own board on a locked card.

        It used to be `lessons.find(active)?.href ?? course.href`, and on a
        locked month `nextLesson`'s `?? all[0]` fallback made the first row
        active — so the most prominent button on the card pointed at a lesson
        that answers 404. Now no row on a locked card is active and no row has
        an href, so this cannot resolve to one even if the fallback returns.
      */}
      {course.locked ? (
        <LockedButton href={course.href} label={lockedLabels.cta} />
      ) : (
        <StartButton
          href={course.lessons.find((l) => l.active)?.href ?? course.href}
          label={startLabel}
        />
      )}
    </div>
  );
}

/**
 * One row of the card's lesson list.
 *
 * A row with an `href` is a link. A row without one is a `<div>` — not a link
 * with `pointer-events: none`, not a link to somewhere else, and not a button
 * that does nothing. It is announced as closed and it is not in the tab order,
 * which is the same answer a sighted learner gets from the padlock.
 */
function LessonRow({
  lesson: l,
  lockedRowLabel,
  markerColor,
}: {
  lesson: DeckCourse["lessons"][number];
  lockedRowLabel: string;
  markerColor?: string;
}) {
  const body = (
    <>
      {l.active ? (
        <PedestalActive className="shrink-0" markerColor={markerColor} />
      ) : (
        <PedestalLocked className="shrink-0" />
      )}
      <div className="flex h-10 flex-1 items-center p-2">
        <p className={cn("flex-1", l.active && "font-bold")}>{l.title}</p>
        {l.locked ? (
          <>
            <LockMark />
            <span className="sr-only">{lockedRowLabel}</span>
          </>
        ) : (
          /* completion dot: a filled 24-circle drawn at 20px */
          /* `done` was declared on DeckCourse and read nowhere — the dot
             was a hardcoded grey rect, so the deck structurally could
             not show progress. Wired. */
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={cn("shrink-0", l.done ? "text-b-green" : "text-b-fg/20")}
          >
            <rect width="24" height="24" rx="12" fill="currentColor" />
            {l.done ? (
              <path
                d="M7 12.5l3.2 3.2L17 9"
                stroke="#141414"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </svg>
        )}
      </div>
    </>
  );

  const shape = cn(
    "flex min-h-[60px] items-end justify-between gap-2",
    !l.active && "opacity-50",
  );

  if (!l.href) {
    return (
      <div className={shape} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link href={l.href} className={shape}>
      {body}
    </Link>
  );
}

/**
 * The padlock that replaces the completion dot on a closed row.
 *
 * A SHAPE, not a colour and not an opacity. The row's own `opacity-50` already
 * means something else on this card, and the deck's nine month accents are ~2
 * ΔE apart under tritanopia — see `month-theme.ts` — so nothing on this surface
 * may rest on hue.
 */
function LockMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-b-fg/40"
    >
      <rect x="4" y="10.5" width="16" height="10" rx="3" fill="currentColor" />
      <path
        d="M8 10.5V8a4 4 0 0 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * The CTA on a card the learner cannot enter.
 *
 * Deliberately NOT the purple shimmer button. That control means "this is the
 * next thing you do", and a shimmering primary action in front of a door that
 * does not open is the exact dark pattern the brief refuses. This is a quiet
 * secondary link with a padlock on it, and it goes to a page that answers the
 * question it raises.
 */
function LockedButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-[56px]",
        "border-2 border-b-lock-edge bg-b-lock-fill",
        "leading-5 font-medium text-b-fg/70 transition-colors hover:text-b-fg",
      )}
    >
      <LockMark />
      {label}
    </Link>
  );
}

/**
 * The purple CTA. Same `button3d` lift as the lesson player, plus the shimmer
 * sweep: a 150x56 gradient blade that crosses the face over the first quarter
 * of a 6400ms cycle and then holds invisible.
 */
function StartButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      role="link"
      data-slot="button3d"
      className="group relative flex h-12 w-full rounded-[56px]"
    >
      <span
        data-slot="button3d-face"
        className={cn(
          "relative flex h-12 w-full items-center justify-center gap-2 overflow-clip rounded-[60px] px-6 py-[14px]",
          "leading-5 font-medium text-b-fg",
          "bg-b-purple shadow-[0_4px_0_0_var(--color-b-purple-2)]",
          "-translate-y-1 transition-[transform,box-shadow] duration-100 ease-out",
          "group-active:translate-y-0 group-active:shadow-[0_0_0_0_var(--color-b-purple-2)]",
        )}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
          <svg
            viewBox="0 0 150 56"
            width="150"
            height="56"
            fill="none"
            className="absolute top-0 z-[100] h-[56px] w-[150px] animate-[b-shimmer_6400ms_cubic-bezier(.16,1,0.7,1)_infinite]"
          >
            <g clipPath="url(#shimmer-clip)">
              <rect
                opacity="0.4"
                x="75"
                y="-58.6328"
                width="51"
                height="150"
                transform="rotate(30 75 -58.6328)"
                fill="url(#shimmer-a)"
              />
              <rect
                opacity="0.4"
                x="127.826"
                y="-28.1328"
                width="26"
                height="150"
                transform="rotate(30 127.826 -28.1328)"
                fill="url(#shimmer-b)"
              />
            </g>
            <defs>
              <linearGradient id="shimmer-a" x1="100.5" y1="-58.6328" x2="100.5" y2="91.3672" gradientUnits="userSpaceOnUse">
                <stop offset="0.27" stopColor="#F5EFFF" />
                <stop offset="0.71" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="shimmer-b" x1="140.826" y1="-28.1328" x2="140.826" y2="121.867" gradientUnits="userSpaceOnUse">
                <stop offset="0.081302" stopColor="#F5EFFF" />
                <stop offset="0.570844" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <clipPath id="shimmer-clip">
                <rect width="150" height="56" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </span>
        <span data-slot="button3d-content" className="relative z-[1]">
          {label}
        </span>
      </span>
    </Link>
  );
}
