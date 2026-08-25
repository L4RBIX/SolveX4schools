"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Code2,
  GraduationCap,
  Home,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Elice LXP application shell — 240px sidebar, sticky top bar, #F5F6F8 canvas.
 *
 * The live trial tenant (trial-qazaq-b2.elice.io/lxp/home) is behind a login
 * and serves an empty DOM, so this shell is reconstructed from Elice's public
 * product surface: the sub-nav geometry, 8px radii, violet #6C4FE0 primary,
 * #E5E8EB hairlines and Pretendard-class typography on elice.io/en/ax/lxp.
 */

const STUDENT_NAV = [
  { href: "/elice/classroom", label: "Home", icon: Home },
  { href: "/elice/classroom#courses", label: "My courses", icon: BookOpen },
  { href: "/elice/workspace", label: "Coding workspace", icon: Code2 },
  { href: "/elice/classroom#grades", label: "Grades", icon: GraduationCap },
];

const TEACHER_NAV = [
  { href: "/elice/teacher", label: "Classroom", icon: Users },
  { href: "/elice/teacher#assignments", label: "Assignments", icon: ClipboardList },
  { href: "/elice/teacher#analytics", label: "Analytics", icon: BarChart3 },
];

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Which nav group is highlighted. */
  role?: "student" | "teacher";
}

export function EliceAppShell({
  title,
  subtitle,
  actions,
  children,
  role = "student",
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-e-grey">
      <aside className="fixed inset-y-0 left-0 hidden w-60 shrink-0 flex-col border-r border-e-line bg-e-white lg:flex">
        <Link
          href="/elice"
          className="flex h-16 items-center gap-2 border-b border-e-line px-5"
        >
          <span className="rounded-full bg-e-violet px-2.5 py-1 font-mono text-[13px] font-bold text-e-white">
            /*elice*/
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Application">
          <NavGroup
            label="Student"
            items={STUDENT_NAV}
            pathname={pathname}
            active={role === "student"}
          />
          <NavGroup
            label="Teacher"
            items={TEACHER_NAV}
            pathname={pathname}
            active={role === "teacher"}
            className="mt-6"
          />
        </nav>

        <div className="border-t border-e-line p-3">
          <Link
            href="/elice"
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm text-e-muted transition-colors hover:bg-e-grey"
          >
            <Settings className="size-[18px]" aria-hidden="true" />
            Settings
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-e-line bg-e-white/95 px-5 backdrop-blur sm:px-7">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[1.0625rem] font-bold text-e-ink">
              {title}
            </h1>
            {subtitle ? (
              <p className="truncate text-[13px] text-e-muted">{subtitle}</p>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-e-line bg-e-grey px-3 py-2 md:flex">
            <Search className="size-4 text-e-faint" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search courses"
              aria-label="Search courses"
              className="w-40 bg-transparent text-sm text-e-ink outline-none placeholder:text-e-faint"
            />
          </div>

          {actions}

          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-11 shrink-0 place-items-center rounded-lg text-e-muted transition-colors hover:bg-e-grey"
          >
            <Bell className="size-[18px]" aria-hidden="true" />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-e-violet" />
          </button>

          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-e-violet-soft text-[13px] font-bold text-e-violet">
            AK
          </span>
        </header>

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-7 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  active,
  className,
}: {
  label: string;
  items: typeof STUDENT_NAV;
  pathname: string;
  active: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.06em] text-e-faint uppercase">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isCurrent = active && pathname === item.href.split("#")[0];
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
                  isCurrent
                    ? "bg-e-violet-soft font-semibold text-e-violet"
                    : "text-e-muted hover:bg-e-grey hover:text-e-ink",
                )}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
