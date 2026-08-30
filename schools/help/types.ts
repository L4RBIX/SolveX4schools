import type { Locale, Localized } from "@schools/curriculum/types";

/**
 * The Help Center's content model.
 *
 * Data, not pages. Every article is one record with a stable id, a category, a
 * localised title and body, and search keywords — so `/help` can group them,
 * `/help/[article]` can render one, the search can filter them, and a test can
 * assert that both languages exist for all of them. A folder of hand-written
 * MDX pages would give the first two and none of the last two.
 *
 * ## Why `body` is an array of blocks and not a markdown string
 *
 * Two reasons, and the second is the real one:
 *
 * 1. The answers contain short code — `print`, `input()`, a two-line snippet —
 *    and the wiki renderer this reuses already distinguishes prose from code.
 * 2. Rendering author-supplied markdown means running a markdown parser over
 *    text and then trusting the HTML it produces. This content is ours, so that
 *    would be safe today; it is one pull request away from not being. A typed
 *    block union cannot express a `<script>`, so the question never comes up.
 */

export type HelpCategoryId =
  | "basics"
  | "nova"
  | "learning"
  | "account"
  | "schools"
  | "privacy";

export type HelpBlock =
  | { kind: "p"; text: Localized }
  | { kind: "list"; items: Localized[] }
  | { kind: "code"; code: string }
  /** A pointer to another article. Rendered as a link, validated by test. */
  | { kind: "see"; article: string; text: Localized };

export interface HelpArticle {
  /** URL segment. Stable — it is what a teacher writes on a whiteboard. */
  id: string;
  category: HelpCategoryId;
  title: Localized;
  /** One-line answer, shown under the title in the category list. */
  summary: Localized;
  body: HelpBlock[];
  /**
   * Extra search terms, per language.
   *
   * Search already covers title, summary and body. Keywords carry the words a
   * learner actually types that do not appear in the answer: "тёмная тема" for
   * an article titled "Как изменить оформление", "пароль забыл" for one about
   * changing it.
   */
  keywords: Record<Locale, string[]>;
}

export interface HelpCategory {
  id: HelpCategoryId;
  title: Localized;
  blurb: Localized;
}

/**
 * Search.
 *
 * Case- and diacritic-insensitive substring matching over every localised field
 * of the article, in the reader's language only — matching the Kazakh body when
 * the interface is Russian would return results the reader cannot read.
 *
 * Deliberately not fuzzy. A Help Center with six categories and thirty articles
 * does not need ranking; it needs "type three letters, see the four things that
 * contain them". Fuzzy matching at this size mostly produces confident wrong
 * answers.
 */
export function searchArticles(
  articles: readonly HelpArticle[],
  query: string,
  locale: Locale,
): HelpArticle[] {
  const needle = normalise(query);
  if (needle.length === 0) return [...articles];

  return articles.filter((a) => normalise(haystack(a, locale)).includes(needle));
}

function haystack(a: HelpArticle, locale: Locale): string {
  const parts: string[] = [a.title[locale], a.summary[locale], ...a.keywords[locale]];
  for (const block of a.body) {
    if (block.kind === "p" || block.kind === "see") parts.push(block.text[locale]);
    if (block.kind === "list") parts.push(...block.items.map((i) => i[locale]));
    if (block.kind === "code") parts.push(block.code);
  }
  return parts.join(" ");
}

/**
 * Fold case and strip combining marks.
 *
 * `toLocaleLowerCase` without a locale mishandles Turkish dotted I; Kazakh does
 * not have that problem, but the function is cheap to write correctly. The NFD
 * pass is what makes "ұ" and "у" not match each other while "Ә" and "ә" do.
 */
function normalise(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("kk").trim();
}
