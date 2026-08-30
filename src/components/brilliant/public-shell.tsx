"use client";

import type { ReactNode } from "react";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { Nav } from "./nav";
import { Footer } from "./footer";
import { LocaleToggle } from "./locale-toggle";
import { SolveXWordmark } from "./app/school-chrome";

/**
 * The chrome every public page wears.
 *
 * `/`, `/about`, `/schools`, `/help`, `/privacy` and `/terms` used to be — or
 * would have been — five pages each declaring their own header and footer. That
 * is how a product ends up with a "For schools" link that exists on three pages
 * out of five, and it is the specific thing that makes a site feel like a pile
 * of generated pages rather than one product.
 *
 * One nav definition, one footer definition, one language control, both
 * localised, both driven by the same `PUBLIC_LINKS` list. Adding a public page
 * means adding a line to that list.
 */

export const PUBLIC_LINKS = (loc: Locale) => [
  { label: t(L.navAbout, loc), href: "/about" },
  { label: t(L.navForSchools, loc), href: "/schools" },
  { label: t(L.navHelp, loc), href: "/help" },
];

export interface PublicShellProps {
  children: ReactNode;
  /**
   * The primary CTA's destination.
   *
   * Resolved per page rather than fixed, because "Start" means `/home` for a
   * signed-in learner and `/login` for everybody else. The pages that know the
   * session pass it; the rest get the honest default.
   */
  ctaHref?: string;
  /** Page ground. `paper` is the warm band the landing hero sits on. */
  surface?: "white" | "paper";
}

export function PublicShell({
  children,
  ctaHref = "/login",
  surface = "white",
}: PublicShellProps) {
  const { locale, setLocale } = usePreferences();
  const loc = locale as Locale;

  return (
    <div
      className={surface === "paper" ? "min-h-dvh bg-b-paper" : "min-h-dvh bg-b-white"}
    >
      <Nav
        wordmark={<SolveXWordmark tone="light" />}
        wordmarkHref="/"
        wordmarkLabel={t(L.brand, loc)}
        links={PUBLIC_LINKS(loc)}
        menuLabels={{ open: t(L.menu, loc), close: t(L.close, loc) }}
        /* "Sign in" is a real destination now — `/login` is a working form
           against a real session. It was removed from this bar in the previous
           phase precisely because it was not. */
        signIn={{ label: t(L.signIn, loc), href: "/login" }}
        getStarted={{ label: t(L.startLearning, loc), href: ctaHref }}
        trailing={<LocaleToggle locale={loc} onChange={setLocale} />}
      />

      {children}

      <PublicFooter locale={loc} />
    </div>
  );
}

/**
 * The public footer.
 *
 * Three columns and a legal line. No social icons: the product has no accounts
 * to link to, and a row of grey glyphs pointing at nothing is the cheapest
 * possible tell that a site is a template.
 */
export function PublicFooter({ locale }: { locale: Locale }) {
  return (
    <Footer
      wordmark={t(L.brand, locale)}
      social={false}
      legal={t(L.footerLegal, locale)}
      columns={[
        {
          title: t(L.footerProduct, locale),
          links: [
            { label: t(L.navAbout, locale), href: "/about" },
            { label: t(L.navForSchools, locale), href: "/schools" },
            { label: t(L.navHelp, locale), href: "/help" },
          ],
        },
        {
          title: t(L.footerLegalCol, locale),
          links: [
            { label: t(L.navPrivacy, locale), href: "/privacy" },
            { label: t(L.navTerms, locale), href: "/terms" },
          ],
        },
        {
          title: t(L.footerAccount, locale),
          links: [{ label: t(L.signIn, locale), href: "/login" }],
        },
      ]}
    />
  );
}
