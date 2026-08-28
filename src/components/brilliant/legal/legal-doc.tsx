"use client";

import type { Locale } from "@schools/curriculum/types";
import type { LegalDocBlock, LegalDocument } from "@schools/legal/documents";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { PublicShell } from "../public-shell";

/**
 * `/privacy` and `/terms`.
 *
 * ## What is reused from the measured legal page
 *
 * The two-column layout — a sticky table of contents beside a narrow reading
 * column — and its exact type scale: 36px h1, 24px h2, 16px between blocks and
 * 48px above a heading. Those numbers came out of `legal-article.tsx`, which
 * carries them from the original.
 *
 * ## Why this is not `LegalArticle` itself
 *
 * That component renders `LegalBlock[]`, a shape built to mirror the extracted
 * `b-legal.content.json` byte for byte — every block carries the original's
 * panda `class` string for traceability, and runs are a flat inline list. Our
 * documents are localised and structured, so feeding them through that shape
 * would mean inventing meaningless class strings and losing the language pair.
 * The typography is shared; the content model is ours.
 */
export function LegalDocPage({ doc }: { doc: LegalDocument }) {
  const { locale } = usePreferences();
  const loc = locale as Locale;

  return (
    <PublicShell>
      <main className="pt-[120px] pb-24">
        <div className="b-shell">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
            {/* ---- table of contents ---------------------------------- */}
            <nav
              aria-label={t(L.legalContents, loc)}
              /* `shrink-0` only from `lg`, where the two columns exist. Below
                 that the nav is a full-width block stacked above the article,
                 and keeping it un-shrinkable let a long section title set a
                 min-content width wider than a phone. */
              className="min-w-0 lg:sticky lg:top-28 lg:h-fit lg:w-[260px] lg:shrink-0"
            >
              <h2 className="text-[13px] font-semibold tracking-wide text-b-muted uppercase">
                {t(L.legalContents, loc)}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {doc.sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-[15px] leading-[1.4] text-b-muted transition-colors hover:text-b-ink"
                    >
                      {s.heading[loc]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ---- the document --------------------------------------- */}
            <article className="min-w-0 max-w-[720px] flex-1">
              {/* 28px below 640. "Политика конфиденциальности" is a single
                  26-character word; at 36px it is 386px wide and a 375px phone
                  cannot break it. `hyphens-auto` works because `<html lang>`
                  follows the learner's language. */}
              <h1 className="text-[28px] leading-[1.2] font-bold text-balance hyphens-auto text-b-ink sm:text-[36px] sm:leading-[1.25]">
                {doc.title[loc]}
              </h1>
              <p className="mt-4 text-[17px] leading-[1.65] text-b-ink/75">
                {doc.intro[loc]}
              </p>
              <p className="mt-3 text-[14px] text-b-muted">
                {t(L.legalUpdated, loc)}:{" "}
                <time dateTime={doc.updated}>
                  {new Date(doc.updated).toLocaleDateString(
                    loc === "kk" ? "kk-KZ" : "ru-RU",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </time>
              </p>

              {doc.sections.map((section) => (
                <section key={section.id} className="scroll-mt-28">
                  <h2
                    id={section.id}
                    className="mt-12 text-[21px] leading-[1.25] font-bold text-balance hyphens-auto text-b-ink sm:text-[24px]"
                  >
                    {section.heading[loc]}
                  </h2>
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} locale={loc} />
                  ))}
                </section>
              ))}
            </article>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}

function Block({ block, locale }: { block: LegalDocBlock; locale: Locale }) {
  if (block.kind === "p") {
    return (
      <p className="mt-4 text-[16px] leading-[1.7] text-b-ink/85">{block.text[locale]}</p>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-6 text-[16px] leading-[1.7] text-b-ink/85">
        {block.items.map((item, i) => (
          <li key={i}>{item[locale]}</li>
        ))}
      </ul>
    );
  }

  /*
    A definition table.

    `<dl>` rather than a `<table>`: these are term/meaning pairs, not tabular
    data, and a screen reader announces a description list as such. On a phone
    the two halves stack, which a table would not do without being told to.
  */
  return (
    <dl className="mt-4 flex flex-col divide-y divide-b-line border-y border-b-line">
      {block.rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
          <dt className="shrink-0 text-[16px] font-semibold text-b-ink sm:w-[180px]">
            {row.term[locale]}
          </dt>
          <dd className="min-w-0 flex-1 text-[16px] leading-[1.65] text-b-ink/80">
            {row.value[locale]}
          </dd>
        </div>
      ))}
    </dl>
  );
}
