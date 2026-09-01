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

/**
 * The product's three tabs, plus the league when this school has one.
 *
 * ## `leagues` is an ARGUMENT, and that is the whole design
 *
 * The league is feature-gated per school and the gate is a SERVER decision:
 * `schools/config.ts` is `server-only`, and a client component importing it
 * fails `npm run check:bundle`. Every surface below the header is a client
 * component. So the page resolves `leagueNavVisible(user)` — one predicate,
 * `schools/leagues/scope.ts` — and passes the answer down as a prop, and this
 * function takes it as a plain boolean it cannot get wrong.
 *
 * ## Why it defaults to false rather than to "add it"
 *
 * A surface that forgets to thread the gate renders the nav it renders today:
 * three tabs, no league, nothing broken. The failure mode of the other default
 * is a tab that 404s, shown to a school that never agreed to a competition —
 * which is the same asymmetry `LEAGUES_ENABLED === "true"` exists to protect,
 * one layer up. The gate is off by default at every level or it is not a gate.
 *
 * ## Position
 *
 * Before «Прогресс»/«Сен», not after: the league is a weekly thing a learner
 * checks in passing, and `/you` is the reflective page they arrive at last.
 * That also keeps `/you` rightmost, where it has always been, so the tab a
 * learner's muscle memory reaches for has not moved.
 */
export function SCHOOL_NAV(locale: Locale, leagues = false): AppNavLink[] {
  const home: AppNavLink = {
    id: "home",
    label: t(L.navHome, locale),
    href: "/home",
    aria: t(L.navHome, locale),
  };
  const courses: AppNavLink = {
    id: "courses",
    label: t(L.navCourses, locale),
    href: "/program",
    aria: t(L.navCourses, locale),
  };
  const you: AppNavLink = {
    id: "you",
    label: t(L.navYou, locale),
    href: "/you",
    aria: t(L.navYou, locale),
  };

  if (!leagues) return [home, courses, you];

  return [
    home,
    courses,
    {
      id: "league",
      label: t(L.navLeague, locale),
      href: "/league",
      aria: t(L.navLeague, locale),
    },
    you,
  ];
}

/**
 * The nav as `/league` itself renders it.
 *
 * Kept as its own name because on that page the gate is not a prop to thread —
 * the page has already `notFound()` unless leagues are on for this learner, so
 * `true` is a fact about the render rather than a value that could be wrong.
 * Everywhere else, pass the resolved gate to `SCHOOL_NAV`.
 */
export function SCHOOL_NAV_WITH_LEAGUE(locale: Locale): AppNavLink[] {
  return SCHOOL_NAV(locale, true);
}
