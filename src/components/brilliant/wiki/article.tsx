import { SelfCitation } from "./self-citation";
import { Applications } from "./sections/applications";
import { Lede } from "./sections/lede";
import { ProblemSolvingAdvanced } from "./sections/problem-solving-advanced";
import { ProblemSolvingBasic } from "./sections/problem-solving-basic";
import { ProblemSolvingIntermediate } from "./sections/problem-solving-intermediate";
import { PropertiesBasic } from "./sections/properties-basic";
import { PropertiesIntermediate } from "./sections/properties-intermediate";
import { SeeAlso } from "./sections/see-also";
import { WorkedExamples } from "./sections/worked-examples";
import { WikiToc } from "./toc";
import { WikiSection } from "./wiki-section";

/**
 * `.col.col-12.col-last.wiki-main-column` — the whole article.
 *
 *   .col.wiki-main-column   max-width 800px; margin-inline auto;
 *                           padding 24px 0; float none
 *   .wiki-header            position relative; margin-bottom 8px;
 *                           padding-right 116px; no bottom border
 *   .wiki-header h1         display inline; CoFo Robert 500 / 34px
 *                           (colour #333 and line-height 1.6em from the h1 base)
 *   #wiki-main              position relative
 *
 * `.wiki-header .pull-right` is an empty div on the original (edit controls for
 * logged-in editors) and `#cmp_wiki_top_editors_id.wiki-top-editors` is
 * `display: none` in wiki.css — neither is rendered here.
 */
export function WikiArticle() {
  return (
    <div className="mx-auto max-w-[800px] py-6">
      <header id="wiki-header" className="relative mb-2 pr-[116px] pb-0">
        <h1 className="inline font-b-serif text-[34px] leading-[1.6em] font-medium text-[#333]">
          Logarithms
        </h1>
      </header>

      <div id="wiki-main" className="relative">
        <div id="cmp_wiki_canonical_page_id">
          <div>
            <Lede />

            <WikiToc />

            <WikiSection
              id="logarithmic-functions-properties-easy"
              title="Properties of Logarithms - Basic"
            >
              <PropertiesBasic />
            </WikiSection>

            <WikiSection
              id="worked-examples-using-properties"
              title="Worked Examples Using Properties"
            >
              <WorkedExamples />
            </WikiSection>

            <WikiSection
              id="logarithmic-functions-properties-medium"
              title="Properties of Logarithms - Intermediate"
            >
              <PropertiesIntermediate />
            </WikiSection>

            <WikiSection
              id="logarithmic-functions-problem-solving-easy"
              title="Problem Solving - Basic"
            >
              <ProblemSolvingBasic />
            </WikiSection>

            <WikiSection
              id="logarithmic-functions-problem-solving-medium"
              title="Problem Solving - Intermediate"
            >
              <ProblemSolvingIntermediate />
            </WikiSection>

            <WikiSection
              id="logarithmic-functions-problem-solving-hard"
              title="Problem Solving - Advanced"
            >
              <ProblemSolvingAdvanced />
            </WikiSection>

            <WikiSection id="applications" title="Applications">
              <Applications />
            </WikiSection>

            <WikiSection id="see-also" title="See Also">
              <SeeAlso />
            </WikiSection>
          </div>
        </div>
      </div>

      <SelfCitation />
    </div>
  );
}
