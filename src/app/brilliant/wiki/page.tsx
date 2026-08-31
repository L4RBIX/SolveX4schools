import type { Metadata } from "next";

import { ArchiveBar } from "@/components/brilliant/wiki/archive-bar";
import { WikiArticle } from "@/components/brilliant/wiki/article";
import { WIKI_CONTAINER, WIKI_MIN_WIDTH } from "@/components/brilliant/wiki/container";
import { WikiHeader } from "@/components/brilliant/wiki/wiki-header";

/**
 * brilliant.org/wiki/logarithms/ — the archived wiki article template.
 * ~1729 pages share this shell; only the h1, the TOC and the body differ.
 *
 * Head values are verbatim from the served document. `og:image`
 * (/site_media/images/open-graph/wiki.png) is not in the local asset mirror,
 * so it is left out rather than pointed at a file that does not exist.
 */
export const metadata: Metadata = {
  title: "Logarithms | Brilliant Math & Science Wiki",
  description:
    "A logarithm is the inverse of the exponential function. Specifically, a logarithm is the power to which a number (the base) must be raised to produce a given number. For example, ...",
};

/**
 * `body.wiki-page.hdr-big` resolved:
 *   margin 0; min-width 1200px (960px at 700–1200px);
 *   padding 60px 0 80px; background #fff; colour #161616;
 *   font 15px/1.7 'CoFo Brilliant'; -webkit-font-smoothing antialiased
 *
 * `#wrapper.container.clearfix` is the 1200px shell; the article column
 * centres itself at 800px inside it.
 */
export default function BrilliantWikiPage() {
  return (
    <div
      className={`${WIKI_MIN_WIDTH} bg-b-white pt-[60px] pb-20 font-b-sans text-[15px] leading-[1.7] text-[#161616] antialiased`}
    >
      <WikiHeader />

      <div id="wrapper" className={WIKI_CONTAINER}>
        <WikiArticle />
      </div>

      <ArchiveBar />
    </div>
  );
}
