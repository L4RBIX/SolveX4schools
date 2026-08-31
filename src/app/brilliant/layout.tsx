import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";

/**
 * The reverse-engineering baseline.
 *
 * DEVELOPMENT ONLY, and the 404 below is a refusal rather than an omission.
 * Two reasons, either sufficient on its own:
 *
 * 1. These routes carry Brilliant's branding, marketing copy and testimonials.
 *    Shipping them inside a paid product is passing off someone else's work.
 * 2. They load CoFo Brilliant and CoFo Robert, commercially licensed by
 *    Contrast Foundry. Those two `localFont` declarations live in this file
 *    rather than in the root layout precisely so a production build never emits
 *    their `@font-face` rules.
 *
 * They stay in the repository because visual regressions are measured against
 * them: when a production surface starts looking cheaper than the runtime it
 * was derived from, this is what you compare it to.
 */

/**
 * The reference's real display and UI faces.
 *
 * Declared HERE and nowhere else, and the files themselves live in
 * `reference/fonts/` rather than under `public/`. Anything in `public/` is
 * served at its own URL whether or not a page links it, so leaving two
 * commercially licensed woff2 sets there would have kept them downloadable from
 * a production deployment even after no page referenced them. `next/font/local`
 * reads from the filesystem at build time and emits its own hashed copy, so the
 * source never needs to be public.
 *
 * Declared HERE and nowhere else. Next generates the `@font-face` rules and the
 * `--font-cofo-*` custom properties into the CSS of the tree that uses them, so
 * keeping them inside this layout is what stops two commercially licensed
 * Contrast Foundry families from being served to a paying school. This layout
 * 404s in production, so in a production build these never load.
 */
const cofoBrilliant = localFont({
  variable: "--font-cofo-brilliant",
  display: "swap",
  src: [
    { path: "../../../reference/fonts/cofo_brilliant_regular-s.p.0x-1wd4a7iit8.woff2", weight: "400", style: "normal" },
    { path: "../../../reference/fonts/cofo_brilliant_italic-s.p.01uthtfhv3qu6.woff2", weight: "400", style: "italic" },
    { path: "../../../reference/fonts/cofo_brilliant_medium-s.p.1vop2d5y_jpw2.woff2", weight: "500", style: "normal" },
    { path: "../../../reference/fonts/cofo_brilliant_medium_italic-s.p.30ni91w93hr35.woff2", weight: "500", style: "italic" },
    { path: "../../../reference/fonts/cofo_brilliant_bold-s.p.00peqb48xfqwb.woff2", weight: "700", style: "normal" },
    { path: "../../../reference/fonts/cofo_brilliant_bold_italic-s.p.3orrcir-ph8bn.woff2", weight: "700", style: "italic" },
  ],
});

const cofoRobert = localFont({
  variable: "--font-cofo-robert",
  display: "swap",
  src: [
    { path: "../../../reference/fonts/cofo_robert_medium-s.p.3krozkcg6qt-u.woff2", weight: "500", style: "normal" },
    { path: "../../../reference/fonts/cofo_robert_medium_italic-s.p.2b_znar3654ya.woff2", weight: "500", style: "italic" },
  ],
});


export const metadata: Metadata = {
  title: "Reference baseline",
  robots: { index: false, follow: false },
};

export default function BrilliantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div
      data-site="brilliant"
      className={`${cofoBrilliant.variable} ${cofoRobert.variable} font-b-sans text-b-ink`}
    >
      {children}
    </div>
  );
}
