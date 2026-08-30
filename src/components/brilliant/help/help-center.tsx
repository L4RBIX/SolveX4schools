"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@schools/curriculum/types";
import { HELP_ARTICLES, HELP_CATEGORIES, articlesInCategory } from "@schools/help/content";
import { searchArticles, type HelpArticle } from "@schools/help/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { PublicShell } from "../public-shell";

/**
 * `/help` — the Help Center.
 *
 * Composition follows the reference's own help layout: a tall centred hero
 * carrying one large title and the search field, then the categories as a
 * three-column grid that stacks. What is NOT the reference is the search — the
 * reference's field is a link into a hosted support product, and a decorative
 * input that goes nowhere is the most irritating thing a help page can offer.
 *
 * Filtering runs client-side over `HELP_ARTICLES` because the whole corpus is
 * thirty records: shipping them costs less than one request would, and results
 * appear as the learner types rather than after a round trip.
 */
export function HelpCenter() {
  const { locale } = usePreferences();
  const loc = locale as Locale;
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => (query.trim() ? searchArticles(HELP_ARTICLES, query, loc) : null),
    [query, loc],
  );

  return (
    <PublicShell>
      <main className="pt-[120px] pb-24">
        <div className="b-shell">
          <div className="mx-auto max-w-[720px] text-center">
            <h1 className="font-b-sans text-[40px] leading-[1.08] font-semibold tracking-[-0.02em] text-b-ink sm:text-[56px]">
              {t(L.helpTitle, loc)}
            </h1>
            <p className="mt-4 text-[18px] leading-[1.6] text-b-muted">
              {t(L.helpSubtitle, loc)}
            </p>

            <div className="mt-8">
              <label htmlFor="help-search" className="sr-only">
                {t(L.helpSearchLabel, loc)}
              </label>
              <div className="relative">
                <SearchGlyph />
                <input
                  id="help-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(L.helpSearchPlaceholder, loc)}
                  autoComplete="off"
                  className="h-14 w-full rounded-full border-2 border-b-line bg-b-white pr-5 pl-13 text-[16px] text-b-ink placeholder:text-b-muted focus:border-b-ink focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-14">
            {results ? (
              <SearchResults results={results} query={query} locale={loc} />
            ) : (
              <CategoryGrid locale={loc} />
            )}
          </div>
        </div>
      </main>
    </PublicShell>
  );
}

function CategoryGrid({ locale }: { locale: Locale }) {
  return (
    <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {HELP_CATEGORIES.map((c) => {
        const articles = articlesInCategory(c.id);
        return (
          <section key={c.id}>
            <h2 className="font-b-sans text-[20px] leading-[1.3] font-bold text-b-ink">
              {c.title[locale]}
            </h2>
            <p className="mt-1 text-[15px] leading-[1.5] text-b-muted">{c.blurb[locale]}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/help/${a.id}`}
                    className="text-[16px] leading-[1.45] text-b-ink underline decoration-b-line decoration-2 underline-offset-4 transition-colors hover:decoration-b-ink"
                  >
                    {a.title[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SearchResults({
  results,
  query,
  locale,
}: {
  results: HelpArticle[];
  query: string;
  locale: Locale;
}) {
  if (results.length === 0) {
    return (
      /* An empty result is a real state with a way out of it, not a blank
         column: it names what was searched for and offers the categories. */
      <div className="mx-auto max-w-[560px] rounded-3xl border-2 border-b-line px-8 py-10 text-center">
        <p className="text-[18px] font-medium text-b-ink">{t(L.helpNoResults, locale)}</p>
        <p className="mt-2 text-[15px] text-b-muted">
          {t(L.helpNoResultsHint, locale)} “{query.trim()}”
        </p>
        <Link
          href="/help"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-b-ink px-6 text-[15px] font-medium text-b-white"
        >
          {t(L.helpAllTopics, locale)}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <p aria-live="polite" className="mb-5 text-[14px] text-b-muted">
        {t(L.helpFound, locale)}: {results.length}
      </p>
      <ul className="flex flex-col gap-3">
        {results.map((a) => (
          <li key={a.id}>
            <Link
              href={`/help/${a.id}`}
              className="block rounded-2xl border-2 border-b-line px-6 py-5 transition-colors hover:border-b-ink"
            >
              <span className="block text-[17px] font-semibold text-b-ink">
                {a.title[locale]}
              </span>
              <span className="mt-1 block text-[15px] leading-[1.5] text-b-muted">
                {a.summary[locale]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-b-muted"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
