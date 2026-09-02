"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import { L, leagueRemainingLabel, t } from "@schools/presentation/labels";

/**
 * The pieces the league screen is built from.
 *
 * Split out so the screen itself reads as a layout rather than as a thousand
 * lines of markup, and so each piece can state the one rule it exists to keep.
 *
 * Every colour here comes from a `b-*` token or from the tier's own hue, never
 * from a raw literal. `tests/school/theme.test.ts` walks all of `src/` and fails
 * any file that reaches for one, because the product has a light theme and the
 * literal is only a colour on one of them.
 *
 * Note that the suite scans SOURCE TEXT and does not strip comments, so naming
 * the forbidden utility in a sentence explaining why it is forbidden fails the
 * test. This paragraph is written the long way round for that reason.
 *
 * ## `TierBadge` is gone
 *
 * It rendered `01` in a rounded box — a numeral in a container, in ten hues
 * that adjacent tiers cannot be told apart by. `tier-emblem.tsx` replaced it
 * with ten drawn emblems that carry identity by SHAPE first, and every caller
 * now uses `TierEmblem` + `TierOrdinal`. Nothing here should grow a second
 * badge: if a surface needs one, it needs the emblem at a smaller size.
 */

export type Movement = "promoted" | "stayed" | "relegated";

/* -------------------------------------------------------------------------- */
/* Movement                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Which way this row is going.
 *
 * ## Never colour alone
 *
 * A glyph, a colour AND a screen-reader sentence, every time. The product states
 * the reason in `globals.css`: "8% of boys are red-green colourblind and this is
 * a class of 18" — and a promotion zone drawn only in green and a relegation
 * zone drawn only in red would be, for one or two children in every class, two
 * identical grey bands.
 *
 * ## And relegation is not red
 *
 * `b-warn` amber rather than `b-wrong` rose. Rose is the colour this product
 * uses to tell a fourteen-year-old their answer is wrong, and reusing it to say
 * "you will compete one tier lower next week" would make a league position feel
 * like a failed assessment. §22 asks for exactly this restraint.
 */
export function MovementMark({
  movement,
  locale,
  className,
  silent = false,
}: {
  movement: Movement;
  locale: Locale;
  className?: string;
  /**
   * Drop the spoken sentence, for a caller whose own visible text already says
   * the same thing.
   *
   * The board needs the sentence: a row is a glyph and two numbers, and without
   * it a screen reader reads "1, Айдана С., 610" and never says which way that
   * row is going. The HERO does not: the arrow there sits immediately before
   * «Поднимаешься в Vector», so speaking both gives "переходит в лигу выше.
   * Поднимаешься в Vector." — the same fact twice, once in the third person
   * about a learner and once in the second person to them.
   */
  silent?: boolean;
}) {
  const spec = {
    promoted: { glyph: "▲", tone: "text-b-ok-edge", sr: L.leagueRowUp },
    stayed: { glyph: "—", tone: "text-b-fg/35", sr: L.leagueRowStay },
    relegated: { glyph: "▼", tone: "text-b-warn-edge", sr: L.leagueRowDown },
  }[movement];

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span aria-hidden="true" className={cn("text-[11px] leading-none", spec.tone)}>
        {spec.glyph}
      </span>
      {silent ? null : <span className="sr-only">{t(spec.sr, locale)}</span>}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Zone heading                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The label that opens a zone, with a rule running out of it.
 *
 * ## Why it opens a zone rather than separating two
 *
 * The old version drew a line BETWEEN zones, which sounds equivalent and is
 * not: at tier 1 nothing relegates, so exactly one line was ever drawn — the
 * promotion one — and ranks 3 through 10 carried no zone label at all. A
 * learner sitting at rank 7 was told nothing about what their week was
 * heading towards, which is the single question the board exists to answer.
 *
 * Heading a GROUP instead means every rank on the board sits underneath a
 * label that names its outcome, and a zone that does not exist simply has no
 * heading rather than silently swallowing the rows below it.
 *
 * ## A line, not a tinted band
 *
 * A band would put a wash of colour behind a child's name and make the board
 * read as a set of verdicts about people. A rule above a group says the same
 * thing about POSITIONS, which is what it is actually about.
 */
export function ZoneHeading({
  kind,
  locale,
}: {
  kind: "promotion" | "stay" | "relegation";
  locale: Locale;
}) {
  const spec = {
    promotion: {
      glyph: "▲",
      label: L.leagueZoneUp,
      tone: "text-b-ok-edge",
      rule: "bg-b-ok-edge/30",
    },
    stay: {
      glyph: "—",
      label: L.leagueZoneStay,
      tone: "text-b-fg/45",
      rule: "bg-b-fg/15",
    },
    relegation: {
      glyph: "▼",
      label: L.leagueZoneDown,
      tone: "text-b-warn-edge",
      rule: "bg-b-warn-edge/30",
    },
  }[kind];

  return (
    /*
      `aria-hidden` because every row already carries its own movement as a
      screen-reader sentence via `MovementMark`. Announcing the band as well
      would read "moves up, 1, Айдана С., 525 XP, moves up" on every row.
    */
    <li aria-hidden="true" className="flex items-center gap-3 px-1 pt-4 pb-1.5">
      <span
        className={cn(
          "b-eyebrow flex shrink-0 items-center gap-1.5 text-[11px] leading-[14px]",
          spec.tone,
        )}
      >
        <span>{spec.glyph}</span>
        {t(spec.label, locale)}
      </span>
      <span className={cn("h-px flex-1", spec.rule)} />
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Disclosure                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A real `<button aria-expanded>` over a panel that opens in place.
 *
 * Not a modal, not a tooltip, not a link away. §27 says the rules are never
 * hidden, and "in place, one press away, still on the page you were reading"
 * is the weakest form of hiding a screen can do while still being able to fit
 * a leaderboard above the fold.
 *
 * ## The height transition
 *
 * `grid-template-rows: 0fr → 1fr` rather than an animated `max-height`, so the
 * panel opens to its OWN height instead of to a guessed ceiling — a guess that
 * is wrong in Kazakh the moment a sentence wraps one line further than the
 * Russian it was measured against. `overflow: hidden` on the inner element is
 * what makes the row unit collapse; without it the content refuses to shrink.
 *
 * `motion-reduce:` turns the whole thing into an instant toggle.
 */
export function Disclosure({
  label,
  labelOpen,
  children,
  className,
  icon,
}: {
  label: string;
  /** What the button says once open. Defaults to `label`. */
  labelOpen?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-full border-2 border-b-fg/15 px-4 py-2",
          "text-[13px] leading-[18px] font-bold text-b-fg/80",
          "transition-colors duration-150 ease-out hover:bg-b-fg/[0.06] hover:text-b-fg",
          "motion-reduce:transition-none",
        )}
      >
        {icon}
        <span>{open && labelOpen ? labelOpen : label}</span>
        <span
          aria-hidden="true"
          className={cn(
            "text-[10px] transition-transform duration-200 ease-out motion-reduce:transition-none",
            open && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>

      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {/* Padding lives inside, so a closed panel really is zero-height. */}
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How long is left, from the SERVER's boundary.
 *
 * `endsAt` is an ISO string the API computed; nothing here works out when a
 * week ends, and `now` is passed in rather than read, so the value is fixed for
 * the life of a render instead of re-deriving on every paint.
 *
 * The formatting — days and hours, then hours, then minutes, never seconds —
 * and the reason for it live in `leagueRemainingLabel`.
 */
export function formatRemaining(endsAt: string, now: number, locale: Locale): string {
  const ms = new Date(endsAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return t(L.leagueEndsSoon, locale);
  return leagueRemainingLabel(ms, locale);
}

/** `{n}` → a number, for the sentences in `LEAGUE_UI` that carry one. */
export function fill(text: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, String(value)),
    text,
  );
}
