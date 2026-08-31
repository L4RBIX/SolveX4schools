import Link from "next/link";

import { BrilliantWordmark } from "./legal-icons";

/**
 * [A] The header bar (spec §4). Byte-for-byte identical to the header on
 * /privacy/.
 *
 * Interaction model: **static**. No sticky, no fixed, no scroll listener, no
 * hydration-driven state — the only `position` utility anywhere in the page
 * markup is `position: relative`. `top: 0` and `z-index: 999` are declared on a
 * statically positioned box, so `top` is inert; both are kept for fidelity.
 *
 * The bar's only child is the logo link. There is no nav, no search, no login
 * link and no CTA on this page, so `justify-content: space-between` has no
 * visible effect — also kept as measured.
 *
 * This is intentionally not `src/components/brilliant/nav.tsx`: that component
 * is the homepage's floating pill bar, which is a different element.
 */
export function LegalHeader() {
  return (
    <div className="top-0 z-[999] flex w-full max-w-full flex-col items-center border-b border-b-line bg-b-white px-6 min-[481px]:px-8">
      <div className="flex h-16 w-full max-w-full flex-row flex-nowrap items-center justify-between gap-6 min-[360px]:max-w-[432px] min-[481px]:max-w-[432px] min-[481px]:gap-8 min-[769px]:max-w-[1216px] min-[769px]:gap-10 min-[992px]:max-w-[1216px]">
        <Link href="/" className="text-b-ink">
          <BrilliantWordmark className="block h-6 max-h-12 min-h-5 shrink-0 min-[481px]:h-8" />
        </Link>
      </div>
    </div>
  );
}
