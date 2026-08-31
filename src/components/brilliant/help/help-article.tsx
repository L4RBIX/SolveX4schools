"use client";

import Link from "next/link";
import type { Locale } from "@schools/curriculum/types";
import { HELP_CATEGORIES, articlesInCategory, findArticle } from "@schools/help/content";
import type { HelpArticle } from "@schools/help/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { PublicShell } from "../public-shell";

/**
 * `/help/[article]` — one answer.
 *
 * A reading column, not a documentation site: no sidebar tree, no breadcrumb
 * chain, no "was this helpful" widget that reports to nobody. One title, one
 * answer, and the rest of the category underneath it, because a learner who
 * opened "how do I change my password" is one click from "how do I log out".
 *
 * The article is passed in already resolved. The route does the lookup so a
 * missing id is a real 404 rather than a page that renders empty.
 */
export function HelpArticlePage({ article }: { article: HelpArticle }) {
  const { locale } = usePreferences();
  const loc = locale as Locale;

  const category = HELP_CATEGORIES.find((c) => c.id === article.category);
  const siblings = articlesInCategory(article.category).filter((a) => a.id !== article.id);

  return (
    <PublicShell>
      <main className="pt-[120px] pb-24">
        <div className="b-shell">
          <div className="mx-auto max-w-[680px]">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-b-muted transition-colors hover:text-b-ink"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M10 2 4 8l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t(L.helpTitle, loc)}
            </Link>

            {category ? (
              <p className="b-eyebrow mt-8 text-b-muted">{category.title[loc]}</p>
            ) : null}

            <h1 className="mt-2 font-b-sans text-[32px] leading-[1.15] font-semibold tracking-[-0.01em] text-b-ink sm:text-[40px]">
              {article.title[loc]}
            </h1>

            <p className="mt-4 text-[19px] leading-[1.6] text-b-ink/75">
              {article.summary[loc]}
            </p>

            <div className="mt-8 flex flex-col gap-5">
              {article.body.map((block, i) => (
                <Block key={i} block={block} locale={loc} />
              ))}
            </div>

            {siblings.length > 0 ? (
              <section className="mt-14 border-t border-b-line pt-8">
                <h2 className="text-[15px] font-semibold tracking-wide text-b-muted uppercase">
                  {t(L.helpMoreIn, loc)}
                </h2>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {siblings.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/help/${a.id}`}
                        className="text-[16px] text-b-ink underline decoration-b-line decoration-2 underline-offset-4 transition-colors hover:decoration-b-ink"
                      >
                        {a.title[loc]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </PublicShell>
  );
}

/**
 * One content block.
 *
 * A typed union rather than rendered markdown. The content is ours, so a
 * markdown parser would be safe today — and one pull request away from not
 * being. A union cannot express a `<script>`, so the question never arises.
 */
function Block({
  block,
  locale,
}: {
  block: HelpArticle["body"][number];
  locale: Locale;
}) {
  if (block.kind === "p") {
    return <p className="text-[17px] leading-[1.7] text-b-ink/85">{block.text[locale]}</p>;
  }

  if (block.kind === "list") {
    return (
      <ul className="flex list-disc flex-col gap-2 pl-6 text-[17px] leading-[1.7] text-b-ink/85">
        {block.items.map((item, i) => (
          <li key={i}>{item[locale]}</li>
        ))}
      </ul>
    );
  }

  if (block.kind === "code") {
    return (
      <pre className="overflow-x-auto rounded-xl bg-[var(--surface-code)] px-5 py-4 font-b-mono text-[15px] leading-[1.6] text-b-white">
        <code>{block.code}</code>
      </pre>
    );
  }

  /* `see` links to another article. The target's existence is asserted by
     `tests/school/help.test.ts`, so a broken cross-reference fails CI rather
     than 404ing in front of a learner. */
  return (
    <p className="text-[17px] leading-[1.7]">
      <Link
        href={`/help/${block.article}`}
        className="font-medium text-b-ink underline decoration-b-line decoration-2 underline-offset-4 transition-colors hover:decoration-b-ink"
      >
        {block.text[locale]} →
      </Link>
    </p>
  );
}

export { findArticle };
