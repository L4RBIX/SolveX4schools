import { ArticleList, ArticleListItem, WikiLink } from "../prose";

/** `#section-see-also` */
export function SeeAlso() {
  return (
    <ArticleList>
      <ArticleListItem>
        <WikiLink
          href="/wiki/solving-logarithmic-equations/"
          title="Solving Logarithmic Equations"
        >
          Solving Logarithmic Equations
        </WikiLink>
      </ArticleListItem>
      <ArticleListItem>
        <WikiLink
          href="/wiki/logarithmic-functions-graphs/"
          title="Graphs of Logarithmic Functions"
        >
          Graphs of Logarithmic Functions
        </WikiLink>
      </ArticleListItem>
      <ArticleListItem>
        <WikiLink
          href="/wiki/solving-logarithmic-inequalities/"
          title="Solving Logarithmic Inequalities"
        >
          Solving Logarithmic Inequalities
        </WikiLink>
      </ArticleListItem>
    </ArticleList>
  );
}
