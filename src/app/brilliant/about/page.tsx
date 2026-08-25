import type { Metadata, Viewport } from "next";

import { AboutFooter } from "@/components/brilliant/about/about-footer";
import { AboutHeader } from "@/components/brilliant/about/about-header";
import { AccreditationBand } from "@/components/brilliant/about/accreditation-band";
import { CareersBand } from "@/components/brilliant/about/careers-band";
import { AboutHero } from "@/components/brilliant/about/hero";
import { MoreReading } from "@/components/brilliant/about/more-reading";
import { OurMethod } from "@/components/brilliant/about/our-method";
import { SplitSection } from "@/components/brilliant/about/split-section";
import { SPLIT_SECTIONS } from "@/components/brilliant/about/split-sections-data";
import { StatementBand } from "@/components/brilliant/about/statement-band";
import { WhatWeTeach } from "@/components/brilliant/about/what-we-teach";

/**
 * The page ships no <meta name="description"> — only an og:description — so
 * `description` is deliberately absent here.
 */
export const metadata: Metadata = {
  title: "About | Brilliant",
  description: null,
  alternates: { canonical: "https://brilliant.org/about/" },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

/**
 * brilliant.org/about/ — BasePage is a stretched VStack; every section owns its
 * own container, and everything between header and footer sits on one white box.
 */
export default function BrilliantAboutPage() {
  return (
    <div
      data-slot="vstack"
      className="flex min-h-[100dvh] flex-col items-stretch gap-0"
    >
      <AboutHeader />

      <div data-slot="box" className="bg-b-white">
        <AboutHero />
        <StatementBand />
        {SPLIT_SECTIONS.map((section) => (
          <SplitSection key={section.id} {...section} />
        ))}
        <WhatWeTeach />
        <AccreditationBand />
        <OurMethod />
        <MoreReading />
        <CareersBand />
      </div>

      <AboutFooter />
    </div>
  );
}
