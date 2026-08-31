import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import type { AppNavLink } from "./app-header";

/**
 * SolveX4Schools' own chrome, plugged into the cloned header.
 *
 * The header component is unchanged — it takes a wordmark node and a link list
 * and it already knew how to render an active underline. Only what it is handed
 * differs.
 */

/**
 * The wordmark.
 *
 * Set in the product's own type rather than drawn as a logotype: there is no
 * commissioned mark yet, and a placeholder graphic would be worse than honest
 * lettering. `X` carries the accent so the name has a fixed point to be
 * recognised by at a glance.
 */
export function SolveXWordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  /** Which surface it sits on. The landing is a light surface; the app is dark. */
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "flex h-6 items-center text-[19px] leading-6 font-bold tracking-[-0.01em] whitespace-nowrap",
        tone === "dark" ? "text-b-fg" : "text-b-ink",
        className,
      )}
    >
      Solve<span className="text-b-purple">X</span>
      {/* The suffix is deliberately quieter than the name, but it must still be
          READ. It was previously white-on-white on the landing surface. */}
      <span className={cn("ml-[3px]", tone === "dark" ? "text-b-fg/50" : "text-b-muted")}>
        4Schools
      </span>
    </span>
  );
}

/**
 * The language switch.
 *
 * Two 34px targets in a bordered pill, sized to sit inside the 65px header
 * without crowding the XP readout. Kazakh first — it is the language of
 * instruction, not the alternate.
 */
export function LocaleSwitch({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (next: Locale) => void;
}) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-full border-2 border-b-fg/20">
      {(["kk", "ru"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={locale === code}
          aria-label={code === "kk" ? "Қазақша" : "Русский"}
          className={cn(
            "h-[37px] w-[42px] cursor-pointer text-[13px] font-bold uppercase transition-colors",
            locale === code
              ? "bg-b-fg/15 text-b-fg"
              : "text-b-fg/40 hover:text-b-fg/80",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function SCHOOL_NAV(locale: Locale): AppNavLink[] {
  return [
    { id: "home", label: t(L.navHome, locale), href: "/home", aria: t(L.navHome, locale) },
    {
      id: "courses",
      label: t(L.navCourses, locale),
      href: "/program",
      aria: t(L.navCourses, locale),
    },
    { id: "you", label: t(L.navYou, locale), href: "/you", aria: t(L.navYou, locale) },
  ];
}

/**
 * The nav, with the league in it.
 *
 * A separate function rather than a flag on `SCHOOL_NAV`, because the league is
 * feature-gated per school and the gate is a SERVER decision — `config` is
 * `server-only` and cannot be read from a client component. The page resolves
 * it and passes the right list down, so a school without leagues never renders
 * a tab that 404s.
 *
 * Placed before «Прогресс»/«Сен», not after: the league is a weekly thing a
 * learner checks in passing, and `/you` is the reflective page they arrive at
 * last. Ordering it that way also keeps `/you` in the rightmost position it has
 * always occupied, so the tab a learner's muscle memory reaches for has not
 * moved.
 */
export function SCHOOL_NAV_WITH_LEAGUE(locale: Locale): AppNavLink[] {
  const base = SCHOOL_NAV(locale);
  return [
    ...base.slice(0, 2),
    {
      id: "league",
      label: t(L.navLeague, locale),
      href: "/league",
      aria: t(L.navLeague, locale),
    },
    ...base.slice(2),
  ];
}
