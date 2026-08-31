import Link from "next/link";

import { BrilliantWordmark } from "./icons";

/**
 * `LearnerAppHeader` in its logged-out shape.
 *
 * `position: sticky; top: 0; z-index: 999`, 64px inner row, 1216px max-width,
 * `elevation.subtle` below 769px and `elevation.base` at/above it. Below 769px
 * the nav and the "Sign in" control are both display:none — the bar collapses
 * to wordmark + "Get started".
 *
 * Two things could not be recovered from the bundle and are handled honestly:
 *  - the header's own wordmark component (h: 1.5rem) — its path data lives in
 *    an unresolved chunk, so the page's *own* footer wordmark geometry is
 *    reused at 24px rather than drawing a substitute;
 *  - the `Courses` nav icon — geometry unavailable, so nothing is drawn there.
 * The base `Button` recipe (`variant="secondaryOutline"` / `variant="primary"`)
 * was likewise only partially resolved; see the page notes.
 */
export function AppHeader() {
  return (
    <header
      data-slot="box"
      className="sticky top-0 z-[999] mx-auto w-full border-b border-b-line bg-b-white px-6 shadow-[0_1px_3px_#0000000a] transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-in min-[481px]:px-8 min-[769px]:shadow-[0px_0px_15px_0px_rgba(0,0,0,0.10)]"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1216px] flex-nowrap items-center justify-between gap-8">
        <Link
          href="/"
          aria-label="Brilliant"
          className="inline-flex h-6 max-h-12 min-h-5 shrink-0 items-center text-b-ink no-underline hover:text-b-ink"
        >
          <BrilliantWordmark className="h-full w-auto" />
        </Link>

        <nav className="hidden min-[769px]:mx-4 min-[769px]:flex min-[769px]:h-full min-[769px]:flex-1 min-[769px]:items-center min-[769px]:gap-8">
          <a
            href="/courses"
            aria-label="View all courses"
            className="relative flex h-[calc(100%-1px)] items-center overflow-hidden border-0 text-[16px] leading-[1.5] text-[rgba(0,0,0,0.6)] no-underline transition-colors hover:text-b-ink after:absolute after:top-full after:h-[2px] after:w-full after:bg-[rgba(0,0,0,0.2)] after:transition-transform after:duration-100 after:ease-linear hover:after:-translate-y-[2px]"
          >
            <span className="inline-block">Courses</span>
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {/* The original is an <a> to a login URL whose click is intercepted to
              open the login modal. The URL builder was not resolved, so this is
              rendered as the control it actually behaves like. */}
          <button
            type="button"
            className="hidden h-12 cursor-pointer items-center justify-center rounded-full border-2 border-b-line bg-transparent px-6 py-4 text-[16px] font-medium leading-[1.25] text-b-ink transition-shadow duration-200 hover:shadow-[0px_1px_3px_rgba(0,0,0,0.30)] min-[769px]:inline-flex"
          >
            Sign in
          </button>

          <a
            href="/welcome/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-b-green px-5 py-4 text-[16px] font-medium leading-[1.25] text-white no-underline transition-shadow duration-200 hover:shadow-[0px_1px_3px_rgba(0,0,0,0.30)]"
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}
