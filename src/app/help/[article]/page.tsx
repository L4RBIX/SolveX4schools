import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HELP_ARTICLES, findArticle } from "@schools/help/content";
import { HelpArticlePage } from "@/components/brilliant/help/help-article";

/**
 * One help article.
 *
 * Pre-rendered from the content module, so every id that exists has a page and
 * every id that does not is a real 404 — there is no route that renders an
 * empty article because a link went stale.
 */
export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ article: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ article: string }>;
}): Promise<Metadata> {
  const { article } = await params;
  const found = findArticle(article);
  if (!found) return { title: "Анықтама" };
  return { title: found.title.kk, description: found.summary.kk };
}

export default async function HelpArticleRoute({
  params,
}: {
  params: Promise<{ article: string }>;
}) {
  const { article } = await params;
  const found = findArticle(article);
  if (!found) notFound();
  return <HelpArticlePage article={found} />;
}
