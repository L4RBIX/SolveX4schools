"use client";

import Link from "next/link";
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

const LINKS: { id: AppTab; label: string; href: string; aria: string }[] = [
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
  xp?: number;
  className?: string;
}

export function AppHeader({ active, xp = 0, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[999] h-[65px] w-full border-b border-white/20 bg-b-panel px-8",
        "shadow-[0_0_15px_0_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1216px] items-center justify-between gap-6">
        <Link href="/brilliant/app/home" aria-label="Brilliant" className="block h-6 w-[114px] shrink-0">
          <BrilliantWordmark className="h-6 w-[114px]" />
        </Link>

        <nav className="flex flex-1 items-center gap-8">
          {LINKS.map((l) => {
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
                  on ? "text-white" : "text-white/60 hover:text-white",
                )}
              >
                <Icon className="min-w-4 shrink-0" />
                <span>{l.label}</span>
                {/* active underline, flush to the header's bottom edge */}
                {on && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/brilliant/app/home" aria-label="Gift Premium" className="shrink-0">
            <span
              className={cn(
                "grid h-[41px] place-items-center rounded-full border-2 border-transparent px-4 py-2",
                "text-[14px] leading-[21px] font-medium text-white",
                "[background-clip:padding-box,border-box] [background-origin:border-box,border-box]",
                "[background-image:linear-gradient(var(--color-b-dark),var(--color-b-dark)),linear-gradient(86deg,#7491FF_0%,#FF90E0_50%,#F9D25C_100%)]",
              )}
            >
              Gift Premium
            </span>
          </Link>

          <button
            type="button"
            aria-label="Your current streak"
            className="relative flex min-w-[60px] items-center justify-center gap-2 rounded-[54px] border-2 border-white/20 px-5 py-[9px] font-medium"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[16px] leading-[25px]">{xp}</span>
              <StreakBolt completed={xp > 0} className={xp > 0 ? "text-b-pear" : "text-white/40"} />
            </span>
          </button>

          <button
            type="button"
            aria-label="Menu"
            className="-mx-2 flex h-10 w-10 items-center justify-center rounded-lg p-3 transition-colors duration-100 hover:bg-white/10"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
