import { JSON_LD_GROUP_ORDER } from "./faq-data";

/**
 * The `FAQPage` schema the original injects with `next/script id="faq-json-ld"`
 * (client-side, so it is absent from the SSR HTML). All 21 questions, in the
 * original's own array order: About Brilliant -> About Premium -> About our
 * courses, which is not the rendered order.
 */
export function FaqJsonLd() {
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: JSON_LD_GROUP_ORDER.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answerHtml },
      })),
    ),
  };

  return (
    <script
      id="faq-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
