import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The shared content container used by 8 of the /about/ sections.
 *
 *   max-width: full · sm(360px) 432px · md(481px) 432px · lg(769px) 1216px · xl 1216px
 *   margin-inline: auto
 *
 * Brilliant's Panda breakpoints are NOT Tailwind's: lg is 769px, not 1024px.
 * Every responsive step on this page is therefore written as an explicit
 * `min-[…px]:` variant.
 */
export function AboutContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="box"
      className={cn(
        "mx-auto w-full max-w-full min-[360px]:max-w-[432px] min-[769px]:max-w-[1216px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
