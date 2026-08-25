import { cn } from "@/lib/utils";

import { LOHP_DARK_BG, STORE_BADGES, UPSELL } from "./data";
import { Button3D } from "./button-3d";

/** Section 11 — the closing upsell, on the same dark gradient as section 6. */
export function ClosingCta() {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-12",
        "px-5 pt-[90px] pb-12 text-white min-[481px]:px-8",
      )}
      style={{ backgroundImage: LOHP_DARK_BG }}
    >
      <div className="flex flex-col items-center gap-9 text-center">
        <h2
          className={cn(
            "font-b-serif mb-6 text-[48px] font-medium tracking-[-0.025em]",
            "leading-[110%] min-[769px]:text-[60px]",
          )}
        >
          {UPSELL.heading}
        </h2>
        <p className="mb-0 text-[16px] font-normal min-[481px]:text-[20px]">{UPSELL.body}</p>
        <Button3D
          href={UPSELL.cta.href}
          variant="whiteOnDark"
          className="w-full max-w-[340px] min-[481px]:max-w-[280px]"
        >
          {UPSELL.cta.label}
        </Button3D>
      </div>

      <div className="flex flex-row items-center justify-center gap-[14px] min-[769px]:gap-[22px]">
        {STORE_BADGES.map((badge) => (
          <a
            key={badge.href}
            href={badge.href}
            className={cn(
              "inline-flex rounded-xl",
              "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#456dff]",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badge.src}
              alt={badge.alt}
              className="block h-11 w-auto min-[769px]:h-12"
            />
          </a>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={UPSELL.illustration} alt="" />
    </div>
  );
}
