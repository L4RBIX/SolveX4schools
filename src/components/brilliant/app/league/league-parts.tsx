"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";

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
 */

export type Movement = "promoted" | "stayed" | "relegated";

/* -------------------------------------------------------------------------- */
/* Tier badge                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The tier's mark.
 *
 * The hue arrives as a CSS custom property rather than a class, because it is a
 * computed value from data — the same category as the bar heights in
 * `school-you.tsx`, which set `style={{ height }}` for the same reason. Ten
 * hardcoded Tailwind classes would be a second copy of the ladder that drifts
 * the first time a tier is recoloured.
 *
 * The numeral is inside the mark deliberately. A learner three weeks in knows
 * `Reactor` is above `Matrix`; a learner on their first Monday does not, and a
 * shape with no number in it makes them work it out from the ladder at the
 * bottom of the page. `05` answers it in place.
 */
export function TierBadge({
  tier,
  name,
  hue,
  size = "lg",
  className,
}: {
  tier: number;
  name: string;
  hue: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "lg" ? "h-16 w-16" : size === "md" ? "h-11 w-11" : "h-8 w-8";
  const text = size === "lg" ? "text-[22px]" : size === "md" ? "text-[15px]" : "text-[11px]";
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-[14px] font-bold tabular-nums",
        "bg-[color-mix(in_oklab,var(--tier-hue)_22%,transparent)]",
        "text-[var(--tier-hue)] ring-2 ring-[color-mix(in_oklab,var(--tier-hue)_55%,transparent)]",
        dim,
        text,
        className,
      )}
      style={{ ["--tier-hue" as string]: hue }}
      /* The name, not the number, and not "tier 5" — a screen reader user gets
         the same word a sighted one reads next to it. */
      aria-label={name}
    >
      {String(tier).padStart(2, "0")}
    </span>
  );
}

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
}: {
  movement: Movement;
  locale: Locale;
  className?: string;
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
      <span className="sr-only">{t(spec.sr, locale)}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Zone rule                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The line between two zones, with its name on it.
 *
 * A labelled rule rather than a tinted band behind the rows. A band would put a
 * wash of colour under a child's name and make the board read as a set of
 * verdicts about people; a line between rows says the same thing about
 * POSITIONS, which is what it is actually about.
 */
export function ZoneRule({
  kind,
  locale,
}: {
  kind: "promotion" | "relegation";
  locale: Locale;
}) {
  const up = kind === "promotion";
  return (
    <li aria-hidden="true" className="flex items-center gap-3 py-2">
      <span
        className={cn(
          "h-px flex-1",
          up ? "bg-b-ok-edge/35" : "bg-b-warn-edge/35",
        )}
      />
      <span
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-bold tracking-[0.06em] uppercase",
          up ? "text-b-ok-edge/80" : "text-b-warn-edge/80",
        )}
      >
        <span aria-hidden="true">{up ? "▲" : "▼"}</span>
        {t(up ? L.leagueZoneUp : L.leagueZoneDown, locale)}
      </span>
      <span
        className={cn(
          "h-px flex-1",
          up ? "bg-b-ok-edge/35" : "bg-b-warn-edge/35",
        )}
      />
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat                                                                        */
/* -------------------------------------------------------------------------- */

/** One number in the hero, with the word for what it is underneath it. */
export function Stat({
  label,
  value,
  suffix,
  emphasis,
}: {
  label: string;
  value: string;
  suffix?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "flex items-baseline gap-1 font-bold tabular-nums",
          emphasis ? "text-[30px] leading-[38px] text-b-purple" : "text-[30px] leading-[38px]",
        )}
      >
        <span className="truncate">{value}</span>
        {suffix ? (
          <span className="text-[15px] font-medium text-b-fg/45">{suffix}</span>
        ) : null}
      </div>
      <div className="mt-0.5 text-[13px] leading-[18px] text-b-fg/55">{label}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Countdown                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * How long is left, in days and hours. Never seconds.
 *
 * §44 forbids fake countdown urgency, and a ticking second-by-second timer on a
 * school product aimed at fourteen-year-olds is exactly that — it manufactures
 * pressure to work now rather than to work well, which is the incentive this
 * whole XP model was shaped to avoid.
 *
 * Days and hours also happen to be the only honest resolution: the boundary is
 * a server fact and the client's clock may be minutes out.
 */
export function formatRemaining(endsAt: string, now: number, locale: Locale): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return t(L.leagueEndsSoon, locale);

  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    const h = hours % 24;
    return locale === "kk"
      ? `${days} күн${h > 0 ? ` ${h} сағат` : ""}`
      : `${days} ${plural(days, "день", "дня", "дней")}${h > 0 ? ` ${h} ${plural(h, "час", "часа", "часов")}` : ""}`;
  }
  if (hours >= 1) {
    return locale === "kk"
      ? `${hours} сағат`
      : `${hours} ${plural(hours, "час", "часа", "часов")}`;
  }
  return t(L.leagueEndsSoon, locale);
}

/* `pluralRu` lives in labels.ts and is exported; re-deriving it here would be a
   second copy of a rule the product already got wrong once («Ещё 1 скрытых
   теста»). Imported rather than reimplemented. */
import { pluralRu } from "@schools/presentation/labels";
const plural = (n: number, one: string, few: string, many: string) =>
  pluralRu(n, one, few, many);
