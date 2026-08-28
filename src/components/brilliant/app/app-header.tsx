"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BrilliantWordmark,
  MenuIcon,
  NavCoursesIcon,
  NavHomeIcon,
  NavYouIcon,
  StreakBolt,
} from "./app-icons";

/**
 * The authenticated app header, shared by /home/, /you/ and /courses/.
 *
 * Measured at a 1470 viewport:
 *   outer   1470x65, padding 0 32px, background #1E1E1E,
 *           bottom border rgba(255,255,255,0.2),
 *           box-shadow rgba(0,0,0,0.1) 0 0 15px 0, sticky, z-999
 *   inner   max-width 1216, height 64, space-between, gap 24px
 *   links   gap 32px; inactive links are rgba(255,255,255,0.6),
 *           the active one is full white with an underline indicator
 *
 * The "Gift Premium" pill has no background — it is a **gradient border**, done
 * with two stacked background images and split clips:
 *
 *   background-image: linear-gradient(#141414, #141414),
 *                     linear-gradient(86deg, #7491FF 0%, #FF90E0 50%, #F9D25C 100%);
 *   background-clip: padding-box, border-box;
 *   background-origin: border-box, border-box;
 *   border: 2px solid transparent;
 *
 * The first (flat) layer fills the padding box so the card reads as dark; the
 * gradient only survives in the 2px border ring.
 */

export type AppTab = "home" | "courses" | "you";

export interface AppNavLink {
  id: AppTab;
  label: string;
  href: string;
  aria: string;
}

/**
 * Defaults preserve the reference route at /brilliant/app/* byte for byte, so
 * extending this header cannot disturb the surface the reverse-engineering work
 * is measured against. The product passes its own links and labels.
 */
const LINKS: AppNavLink[] = [
  { id: "home", label: "Home", href: "/brilliant/app/home", aria: "Go home" },
  { id: "courses", label: "Courses", href: "/brilliant/app/courses", aria: "View all courses" },
  { id: "you", label: "You", href: "/brilliant/app/you", aria: "You" },
];

const ICONS = {
  home: NavHomeIcon,
  courses: NavCoursesIcon,
  you: NavYouIcon,
} as const;

export interface AppHeaderProps {
  active: AppTab;
  /**
   * The bolt pill's numeral.
   *
   * `null` removes the pill. The reference shows an XP counter; this product
   * has no XP, and a pill that reads `0 ⚡` on every screen forever is a
   * counter for a mechanic that does not exist. Screens that have a real number
   * (days active this week) pass it; screens that do not pass `null`.
   */
  xp?: number | null;
  className?: string;
  /** Nav links. Defaults to the reference route's own three. */
  links?: AppNavLink[];
  /** Where the wordmark points. */
  homeHref?: string;
  /** Replaces the wordmark. The product passes its own. */
  wordmark?: React.ReactNode;
  wordmarkLabel?: string;
  /**
   * The gradient-bordered pill. Rendering nothing removes it — the product has
   * no premium tier to upsell, and "Gift Premium" in a school is nonsense.
   */
  accentPill?: { label: string; href: string } | null;
  /**
   * Extra controls in the right-hand group, before the XP pill.
   *
   * The product puts its language switch here. A bilingual interface whose
   * switch lives only on the marketing page is not bilingual — a learner who
   * hits a wall in Kazakh needs to reach Russian from wherever they are.
   */
  trailing?: React.ReactNode;
  /** Screen-reader names. Default to the reference route's English. */
  a11y?: { menu: string; streak: string };
  /**
   * The account menu's contents.
   *
   * Absent on the reference route, which has no account. When present the menu
   * button is shown at EVERY width rather than only below `md`, because it is
   * then the only route to settings and to signing out — a product where "log
   * out" exists only on a phone is a product that cannot be logged out of on a
   * classroom desktop.
   */
  accountMenu?: {
    items: readonly { label: string; href: string }[];
    signOut: { label: string } | null;
  } | null;
}

export function AppHeader({
  active,
  xp = 0,
  className,
  links = LINKS,
  homeHref = "/brilliant/app/home",
  wordmark,
  wordmarkLabel = "Brilliant",
  accentPill = { label: "Gift Premium", href: "/brilliant/app/home" },
  trailing,
  a11y = { menu: "Menu", streak: "Your current streak" },
  accountMenu = null,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[999] h-[65px] w-full border-b border-b-fg/20 bg-b-panel px-8",
        "shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1216px] items-center justify-between gap-6">
        <Link href={homeHref} aria-label={wordmarkLabel} className="block h-6 shrink-0">
          {wordmark ?? <BrilliantWordmark className="h-6 w-[114px]" />}
        </Link>

        <nav className="hidden flex-1 items-center gap-8 md:flex">
          {links.map((l) => {
            const Icon = ICONS[l.id];
            const on = active === l.id;
            return (
              <Link
                key={l.id}
                href={l.href}
                aria-label={l.aria}
                data-selected={on}
                className={cn(
                  "relative flex h-[63px] items-center gap-2 overflow-hidden transition-colors",
                  on ? "text-b-fg" : "text-b-fg/60 hover:text-b-fg",
                )}
              >
                <Icon className="min-w-4 shrink-0" />
                <span>{l.label}</span>
                {/* active underline, flush to the header's bottom edge */}
                {on && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-b-fg" />}
              </Link>
            );
          })}
        </nav>

        {/* The inline nav is hidden below 768; the menu button below carries it
            instead. Above 768 the button is gone, because a control that
            duplicates links already on screen is a control with nothing to do. */}
        <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
          {trailing}
{accentPill ? (
          <Link href={accentPill.href} aria-label={accentPill.label} className="shrink-0">
            <span
              className={cn(
                "grid h-[41px] place-items-center rounded-full border-2 border-transparent px-4 py-2",
                "text-[14px] leading-[21px] font-medium text-b-fg",
                "[background-clip:padding-box,border-box] [background-origin:border-box,border-box]",
                "[background-image:linear-gradient(var(--color-b-dark),var(--color-b-dark)),linear-gradient(86deg,#7491FF_0%,#FF90E0_50%,#F9D25C_100%)]",
              )}
            >
              {accentPill.label}
            </span>
          </Link>
          ) : null}

          {xp === null ? null : (
            <span
              aria-label={a11y.streak}
              className="relative hidden min-w-[60px] items-center justify-center gap-2 rounded-[54px] border-2 border-b-fg/20 px-5 py-[9px] font-medium sm:flex"
            >
              <span className="flex items-center gap-1.5">
                <span className="text-[16px] leading-[25px] tabular-nums">{xp}</span>
                <StreakBolt
                  completed={xp > 0}
                  className={xp > 0 ? "text-b-pear" : "text-b-fg/40"}
                />
              </span>
            </span>
          )}

          <ProductMenu
            links={links}
            active={active}
            label={a11y.menu}
            account={accountMenu}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * The nav, below 768.
 *
 * The reference ships this button inert — it is a hamburger that does nothing,
 * because the reference's nav never collapses at the widths it was measured at.
 * Ours collapses, so the button opens the links it hid. A dead control in front
 * of a class is worse than no control.
 */
function ProductMenu({
  links,
  active,
  label,
  account,
}: {
  links: AppNavLink[];
  active: AppTab;
  label: string;
  account: AppHeaderProps["accountMenu"];
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative md:hidden">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="-mx-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg p-3 transition-colors duration-100 hover:bg-b-fg/10"
      >
        <MenuIcon />
      </button>

      {open ? (
        <div className="absolute top-12 right-0 z-10 flex w-56 flex-col overflow-hidden rounded-2xl border-2 border-b-fg/20 sx-raised py-2">
          {links.map((l) => {
            const Icon = ICONS[l.id];
            return (
              <Link
                key={l.id}
                href={l.href}
                aria-label={l.aria}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors",
                  active === l.id ? "bg-b-fg/5 text-b-fg" : "text-b-fg/70 hover:bg-b-fg/5",
                )}
              >
                <Icon className="min-w-4 shrink-0" />
                <span>{l.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
