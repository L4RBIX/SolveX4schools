"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * brilliant.org top bar. Measured on the live page at scrollY 2800:
 *   wrapper  position: fixed; top: 24px; z-index: 1100; width: 1296px (centred)
 *   nav      width 1296; height 58; background #FFF; border-radius 9999px;
 *            border: 1px solid rgb(228,228,228); box-shadow: none;
 *            padding: 8px 8px 8px 28px
 *
 * The 1px #E4E4E4 border is load-bearing: without it the white pill vanishes
 * against the white page sections.
 *
 * Scroll behaviour: only "Sign in" is present on load. Past ~600px of scroll a
 * "Get started" pill slides in beside it. The bar itself never changes colour
 * or shape. Below `sm` the bar collapses to wordmark + a single "Get started".
 */

const SCROLL_TRIGGER = 600;

const PILL_BASE =
  "b-press inline-flex items-center justify-center rounded-full px-5 py-3 text-[16px] font-medium leading-[1.25] hover:-translate-y-px";

export interface NavProps {
  /**
   * Every visible string and destination. Each defaults to the reference
   * route's own literal, so /brilliant renders byte-identically and stays
   * usable as the visual baseline while the product supplies its own.
   */
  wordmark?: React.ReactNode;
  wordmarkHref?: string;
  wordmarkLabel?: string;
  signIn?: { label: string; href: string } | null;
  getStarted?: { label: string; href: string };
  /** Extra controls before the CTAs. The product puts its language switch here. */
  trailing?: React.ReactNode;
}

export function Nav({
  wordmark,
  wordmarkHref = "/brilliant",
  wordmarkLabel = "Brilliant",
  signIn = { label: "Sign in", href: "/brilliant/courses" },
  getStarted = { label: "Get started", href: "/brilliant/courses" },
  trailing,
}: NavProps = {}) {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_TRIGGER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-[1100] px-3 sm:top-6 sm:px-6">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-[58px] w-full max-w-[1296px] items-center justify-between gap-4 rounded-full border border-[#E4E4E4] bg-b-white pr-2 pl-5 sm:pl-7"
      >
        <a
          href={wordmarkHref}
          aria-label={wordmarkLabel}
          className="font-b-sans text-[26px] font-bold leading-none tracking-[-0.02em] text-b-ink"
        >
          {wordmark ?? "Brilliant"}
        </a>

        <div className="flex items-center gap-2">
          {trailing}

          {signIn ? (
            <a
              href={signIn.href}
              className={cn(
                PILL_BASE,
                "hidden border-2 border-b-line bg-transparent text-b-muted hover:text-b-ink sm:inline-flex",
              )}
            >
              {signIn.label}
            </a>
          ) : null}

          {/* Below sm the bar is wordmark + one dark pill, always visible. */}
          <a
            href={getStarted.href}
            className={cn(PILL_BASE, "bg-b-ink text-b-white sm:hidden")}
          >
            {getStarted.label}
          </a>

          <div className="hidden sm:block">
            <AnimatePresence initial={false}>
              {scrolled ? (
                <motion.a
                  key="get-started"
                  href={getStarted.href}
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                  transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
                  className={cn(PILL_BASE, "bg-b-ink text-b-white")}
                >
                  {getStarted.label}
                </motion.a>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
