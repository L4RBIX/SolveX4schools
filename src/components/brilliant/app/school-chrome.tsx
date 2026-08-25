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
        tone === "dark" ? "text-white" : "text-b-ink",
        className,
      )}
    >
      Solve<span className="text-b-purple">X</span>
      {/* The suffix is deliberately quieter than the name, but it must still be
          READ. It was previously white-on-white on the landing surface. */}
      <span className={cn("ml-[3px]", tone === "dark" ? "text-white/50" : "text-b-muted")}>
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
    <div className="flex shrink-0 overflow-hidden rounded-full border-2 border-white/20">
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
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/80",
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
    { id: "home", label: t(L.navHome, locale), href: "/", aria: t(L.navHome, locale) },
    {
      id: "courses",
      label: t(L.navCourses, locale),
      href: "/paths",
      aria: t(L.navCourses, locale),
    },
    { id: "you", label: t(L.navYou, locale), href: "/you", aria: t(L.navYou, locale) },
  ];
}
