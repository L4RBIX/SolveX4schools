"use client";

import Link from "next/link";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { SolveXWordmark } from "./app/school-chrome";

/**
 * What a learner sees when a route does not exist or a render fails.
 *
 * Deliberately not a marketing page and deliberately not a stack trace. Two
 * sentences, one button, the wordmark so they can tell they are still in the
 * right product, and — on the error variant — a retry, because the most common
 * cause in a school is a laptop that lost the network for four seconds.
 *
 * No error text, no digest, no "contact support with this code". A
 * fourteen-year-old cannot act on any of that, and the digest is in the server
 * log where whoever can act on it will look.
 */
export function StatusPage({
  kind,
  onRetry,
}: {
  kind: "not-found" | "error";
  /** Present only on the error variant — `reset()` from the error boundary. */
  onRetry?: () => void;
}) {
  const { locale } = usePreferences();
  const loc = locale as Locale;

  const title = kind === "not-found" ? t(L.notFoundTitle, loc) : t(L.errorTitle, loc);
  const body = kind === "not-found" ? t(L.notFoundBody, loc) : t(L.errorBody, loc);

  return (
    <div className="flex min-h-dvh flex-col bg-b-paper font-b-sans">
      <header className="px-5 py-5 sm:px-8">
        <Link href="/" aria-label={t(L.brand, loc)} className="inline-block text-b-ink">
          <SolveXWordmark tone="light" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="max-w-[440px] text-center">
          <p
            aria-hidden="true"
            className="font-b-serif text-[64px] leading-none font-medium text-b-ink/15"
          >
            {kind === "not-found" ? "404" : "!"}
          </p>
          <h1 className="mt-4 font-b-serif text-[32px] leading-[1.15] font-medium text-b-ink">
            {title}
          </h1>
          <p className="mt-3 text-[17px] leading-[1.6] text-b-muted">{body}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="b-press inline-flex h-12 cursor-pointer items-center rounded-full bg-b-ink px-7 text-[16px] font-medium text-b-white"
              >
                {t(L.retry, loc)}
              </button>
            ) : null}
            <Link
              href="/"
              className={
                onRetry
                  ? "b-press inline-flex h-12 items-center rounded-full border-2 border-b-line px-7 text-[16px] font-medium text-b-ink"
                  : "b-press inline-flex h-12 items-center rounded-full bg-b-ink px-7 text-[16px] font-medium text-b-white"
              }
            >
              {t(L.goHome, loc)}
            </Link>
            <Link
              href="/help"
              className="inline-flex h-12 items-center px-4 text-[16px] font-medium text-b-muted transition-colors hover:text-b-ink"
            >
              {t(L.navHelp, loc)}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
