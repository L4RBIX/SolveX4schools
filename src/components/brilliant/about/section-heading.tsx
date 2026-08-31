import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The CoFo Robert section heading shared by "What we teach", "Our method",
 * "More reading" and "Great minds think here". The original applies the serif
 * through an inline font-family on every h2; here it comes from the
 * `font-b-serif` token, which resolves to the same CoFo Robert face.
 *
 * Panda emits an invalid `font-weight: medium` on these. CoFo Robert only ships
 * a 500 face, so 500 is what actually paints.
 */
export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      data-slot="heading"
      className={cn(
        "font-b-serif text-[32px] leading-[120%] font-medium tracking-normal text-b-ink min-[481px]:text-[48px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
