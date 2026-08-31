import type { Metadata } from "next";

import { LegalArticle } from "@/components/brilliant/legal/legal-article";
import { legalContent } from "@/components/brilliant/legal/legal-content";
import { LegalFooter } from "@/components/brilliant/legal/legal-footer";
import { LegalHeader } from "@/components/brilliant/legal/legal-header";
import { LegalToc } from "@/components/brilliant/legal/legal-toc";

/**
 * brilliant.org/terms-of-use/ — rebuilt from `docs/research/specs/b-legal.spec.md`.
 *
 * The original is a fully server-rendered Pages Router document with the legal
 * copy hard-coded in the page component. Every string here comes from
 * `b-legal.content.json`, the verbatim extraction.
 *
 * Nothing on this page is scroll-driven, time-driven or animated (spec §12), so
 * there is no `motion` work and no `useReducedMotion()` to honour — the whole
 * route is a server component. The only interactivity is CSS `:hover` in the
 * footer.
 *
 * Breakpoints are the original's, not Tailwind's: 360 / 481 / 769 / 992 / 1280,
 * written as `min-[…px]:` arbitrary variants throughout (spec §2.1).
 */

export const metadata: Metadata = {
  // The document does not set its own title; it reuses the generic site title.
  // Its meta description is the generic homepage og:description, which the spec
  // does not quote — so none is set here rather than authoring one (spec §13.4).
  title: "Brilliant | Learn by doing",
};

export default function BrilliantTermsOfUsePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center gap-0 bg-[#f8f8f8]">
      <LegalHeader />

      {/* [B] article shell — vstack / center / box, exactly as measured (§5). */}
      <div className="flex max-w-[100dvw] flex-col items-center">
        <div className="flex w-full items-center justify-center">
          {/*
            The `md` step is real: between 481px and 768px the box is capped at
            432px with zero side margin, so the article is a narrow 432px column
            centred in the viewport.
          */}
          <div className="mx-6 w-full max-w-full p-0 min-[360px]:max-w-[432px] min-[481px]:mx-0 min-[481px]:max-w-[432px] min-[769px]:mx-8 min-[769px]:max-w-[1216px] min-[1280px]:mx-0 min-[1280px]:max-w-[1216px]">
            {/*
              The two-column row. It never wraps and never becomes a column —
              below 992px the sidebar is display:none, so the article fills the
              row. `body.sm` is set once, here, and inherited by both columns.
            */}
            <div className="mx-auto my-8 flex max-w-[1200px] font-b-sans text-[14px] leading-[1.5] font-normal tracking-[0] text-b-ink min-[769px]:my-16 min-[1280px]:my-20">
              <LegalArticle blocks={legalContent.blocks} />
              <LegalToc heading={legalContent.tocHeading} entries={legalContent.toc} />
            </div>
          </div>
        </div>
      </div>

      <LegalFooter content={legalContent.footer} />
    </div>
  );
}
