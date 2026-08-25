import type { Metadata } from "next";

import { AppHeader } from "@/components/brilliant/faq/app-header";
import { FaqJsonLd } from "@/components/brilliant/faq/faq-json-ld";
import { FaqSection } from "@/components/brilliant/faq/faq-section";
import { Hero } from "@/components/brilliant/faq/hero";
import { SiteFooter } from "@/components/brilliant/faq/site-footer";
import { Upsell } from "@/components/brilliant/faq/upsell";

/**
 * brilliant.org/faq/ — `LearnerPage`, `fullWidth`.
 *
 * Four stacked full-bleed bands under a sticky header. The only interaction on
 * the page is the click-driven accordion in section 2 (three independent
 * single-open roots) plus the hero button's 6.4s shimmer loop; there is no
 * scroll-driven behaviour anywhere on the original and none is added here.
 *
 * The head values below are the ones the original actually declares. It ships
 * no `<meta name="description">` and no `og:title`, so neither is emitted.
 */
export const metadata: Metadata = {
  title: "Brilliant | Learn by doing",
  alternates: { canonical: "https://brilliant.org/faq/" },
  openGraph: {
    type: "website",
    description:
      "Guided interactive problem solving that’s effective and fun. Try thousands of interactive lessons in math, programming, data analysis, AI, science, and more.",
    images: ["https://brilliant.org/images/opengraph/learn-interactively.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@brilliantorg",
  },
};

export default function BrilliantFaqPage() {
  return (
    <div
      data-slot="vstack"
      className="flex min-h-[100dvh] w-full flex-col items-center gap-0 bg-[#f8f8f8]"
    >
      <FaqJsonLd />
      <AppHeader />
      <Hero />
      <FaqSection />
      <Upsell />
      <SiteFooter />
    </div>
  );
}
