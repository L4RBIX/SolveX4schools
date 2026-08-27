import type { Metadata } from "next";
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
 *    Contrast Foundry — see the RELEASE BLOCKER note in `src/app/layout.tsx`.
 *
 * They stay in the repository because visual regressions are measured against
 * them: when a production surface starts looking cheaper than the runtime it
 * was derived from, this is what you compare it to.
 */

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
    <div data-site="brilliant" className="font-b-sans text-b-ink">
      {children}
    </div>
  );
}
