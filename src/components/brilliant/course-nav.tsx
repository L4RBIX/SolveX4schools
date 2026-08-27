import { BookOpen } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Fixed 64px chrome for the dark course routes: wordmark, the active `Courses`
 * tab with its 2px underline sitting on the nav's own bottom edge, and the
 * Sign in / Sign up pair. `Sign in` folds away below `sm` so the row still
 * fits a 390px viewport without a horizontal scrollbar.
 */

export interface CourseNavProps {
  className?: string;
}

export function CourseNav({ className }: CourseNavProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-16 border-b border-b-fg/10 bg-b-dark text-b-fg",
        className,
      )}
    >
      <nav
        aria-label="Primary"
        className="b-shell-narrow flex h-full items-center justify-between gap-3"
      >
        <div className="flex h-full items-center gap-4 sm:gap-8">
          <Link
            href="/brilliant"
            className="text-[26px] leading-none font-bold tracking-[-0.02em] text-b-fg"
          >
            Brilliant
          </Link>

          <Link
            href="/brilliant/courses"
            aria-current="page"
            className="relative flex h-full items-center gap-2 text-[16px] leading-none font-medium text-b-fg"
          >
            <BookOpen aria-hidden="true" className="size-5" strokeWidth={2} />
            Courses
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[2px] bg-b-fg"
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="b-press hidden h-12 items-center rounded-full border-2 border-b-fg/20 px-5 text-[16px] font-medium text-b-fg hover:border-b-fg/40 active:shadow-none sm:inline-flex"
          >
            Sign in
          </button>
          <button
            type="button"
            className="b-press inline-flex h-12 items-center rounded-[54px] bg-b-green-2 px-5 text-[16px] font-medium text-b-fg hover:brightness-95 active:shadow-none"
          >
            Sign up
          </button>
        </div>
      </nav>
    </header>
  );
}
