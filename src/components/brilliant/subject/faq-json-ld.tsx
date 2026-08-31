import { FAQ_ITEMS } from "./data";

/**
 * `<script id="math-faq-json-ld">` — a FAQPage graph, one Question per
 * accordion item. In the original it is injected after hydration by
 * `next/script`, so it never appears in the SSR HTML; the object below is the
 * bundle's own, with the two answers carrying plain inline anchors.
 */
function answerHtml(runs: (typeof FAQ_ITEMS)[number]["answer"]) {
  return runs
    .map((run) => (run.kind === "link" ? `<a href="${run.href}">${run.text}</a>` : run.text))
    .join("");
}

export function FaqJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: answerHtml(item.answer) },
    })),
  };

  return (
    <script
      id="math-faq-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
