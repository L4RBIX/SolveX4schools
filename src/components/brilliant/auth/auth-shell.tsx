"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { LocaleToggle } from "../locale-toggle";
import { SolveXWordmark } from "../app/school-chrome";
import { PublicFooter } from "../public-shell";

/**
 * The chrome around signing in and changing a password.
 *
 * These two screens used to be a form centred on an otherwise empty page — no
 * wordmark, no way to change language, no way back. That is the wrong first
 * impression twice over: a learner cannot tell which product they are looking
 * at, and a Russian-reading learner who lands on the Kazakh default has no
 * control to fix it before typing a password.
 *
 * Deliberately still minimal. One column, one card, one action. What the
 * reference calls a sign-in page is a marketing page with a form on it; this is
 * a school machine at 08:55, and everything that is not the form is in the way.
 */
export function AuthShell({
  children,
  hint,
}: {
  children: ReactNode;
  /** A line under the card — where to go when the password does not work. */
  hint?: string;
}) {
  const { locale, setLocale } = usePreferences();
  const loc = locale as Locale;

  return (
    <div className="flex min-h-dvh flex-col bg-b-paper font-b-sans">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          aria-label={t(L.brand, loc)}
          className="text-b-ink"
        >
          <SolveXWordmark tone="light" />
        </Link>
        <LocaleToggle locale={loc} onChange={setLocale} />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="rounded-3xl border border-b-line bg-b-white p-7 shadow-[var(--shadow-soft)] sm:p-9">
            {children}
          </div>
          {hint ? (
            <p className="mt-5 text-center text-[14px] leading-[1.55] text-b-muted">
              {hint}
            </p>
          ) : null}
        </div>
      </main>

      <PublicFooter locale={loc} />
    </div>
  );
}
