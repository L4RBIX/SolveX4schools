import type { Metadata } from "next";

import { ClosingCta } from "@/components/brilliant/subject/closing-cta";
import { CourseTabs } from "@/components/brilliant/subject/course-tabs";
import { Experts } from "@/components/brilliant/subject/experts";
import { Faq } from "@/components/brilliant/subject/faq";
import { FaqJsonLd } from "@/components/brilliant/subject/faq-json-ld";
import { Hero } from "@/components/brilliant/subject/hero";
import { SocialProof } from "@/components/brilliant/subject/social-proof";
import { SubjectFooter } from "@/components/brilliant/subject/subject-footer";
import { SubjectHeader } from "@/components/brilliant/subject/subject-header";
import { ValuePropSection } from "@/components/brilliant/subject/value-prop";
import { VALUE_PROPS_BOTTOM, VALUE_PROPS_TOP } from "@/components/brilliant/subject/data";

/**
 * brilliant.org/math — the subject landing template.
 *
 * Composition order is the bundle's own:
 *   LohpHeader → LandingHeroInformational → RefreshSocialProofs
 *   → ValuePropSections (3 props → CourseSection → 2 props)
 *   → RefreshExperts → FAQ → RefreshUpsell → StaticPageSponsorModal → Footer
 *
 * `StaticPageSponsorModal` is a client-only, `ssr:false` import gated on a
 * sponsor discount anonymous visitors never have. It renders nothing here, and
 * nothing was invented in its place.
 *
 * The route is on the site's `forcedLightPaths` list, so it is light-only by
 * design — no dark variant.
 */

const TITLE = "Learn Math: Algebra, Geometry, Calculus, & More | Brilliant";
const DESCRIPTION =
  "Interactive problem solving that’s effective and fun. Master concepts in algebra, geometry, calculus, and beyond.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://brilliant.org/math",
    images: ["/assets/original/brilliant/brilliant.org/images/opengraph/learn-interactively.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@brilliantorg",
  },
  other: {
    "al:ios:url": "com.brilliant.Brilliant://math/",
    "al:ios:app_store_id": "913335252",
    "al:ios:app_name": "Brilliant.org",
    "al:android:url": "https://brilliant.org/math/",
    "al:android:package": "org.brilliant.android",
    "al:android:app_name": "Brilliant",
  },
};

export default function BrilliantMathPage() {
  return (
    <div className="bg-white text-black">
      <SubjectHeader />
      <Hero />
      <SocialProof />

      {VALUE_PROPS_TOP.map((prop) => (
        <ValuePropSection key={prop.id} data={prop} />
      ))}

      <CourseTabs />

      {VALUE_PROPS_BOTTOM.map((prop) => (
        <ValuePropSection key={prop.id} data={prop} />
      ))}

      <Experts />
      <Faq />
      <ClosingCta />
      <SubjectFooter />

      <FaqJsonLd />
    </div>
  );
}
