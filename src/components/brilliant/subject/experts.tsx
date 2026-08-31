import { Fragment } from "react";

import { cn } from "@/lib/utils";

import { EXPERTS_BODY, EXPERTS_CTA, EXPERTS_HEADING, EXPERT_LOGOS, GRAY_55_BG } from "./data";
import { Button3D } from "./button-3d";
import { Glyph } from "./glyphs";

/** Section 9 — six institution marks on the same 55° gray wash as section 2. */
export function Experts() {
  return (
    <div
      className="relative px-5 py-16 text-black min-[769px]:px-28 min-[769px]:py-20"
      style={{ backgroundImage: GRAY_55_BG }}
    >
      <div className="mx-auto flex w-full max-w-[432px] flex-col items-stretch gap-0 min-[769px]:max-w-[1216px]">
        <h2
          className={cn(
            "font-b-serif mb-16 text-center text-[3rem] font-medium tracking-[-0.025em]",
            "leading-[1.33] min-[360px]:leading-[1.2]",
            "min-[769px]:mb-[84px] min-[769px]:text-[3.75rem]",
          )}
        >
          {EXPERTS_HEADING}
        </h2>

        <div className="mb-10">
          <div
            className={cn(
              "flex flex-row flex-wrap items-center justify-center gap-x-0 gap-y-12",
              "min-[481px]:justify-around min-[992px]:gap-y-4",
              "min-[1280px]:justify-between min-[1280px]:gap-x-6",
            )}
          >
            {EXPERT_LOGOS.map((logo, index) => (
              <Fragment key={logo.name}>
                {index > 0 ? (
                  <div
                    aria-hidden
                    className="hidden -my-2 self-stretch border-e border-[#e5e5e5] min-[1280px]:block"
                  />
                ) : null}
                <div
                  className={cn(
                    "w-full text-center text-[#b3b3b3]",
                    "min-[320px]:w-1/2 min-[769px]:w-1/4 min-[1280px]:w-auto",
                  )}
                >
                  <Glyph
                    src={logo.file}
                    width={logo.width}
                    height={logo.height}
                    className="max-w-full"
                  />
                </div>
              </Fragment>
            ))}
          </div>
        </div>

        <p
          className={cn(
            "mb-12 text-center text-[16px] text-[#999]",
            "min-[481px]:mb-14 min-[481px]:text-[20px]",
          )}
        >
          {EXPERTS_BODY}
        </p>

        <Button3D
          href={EXPERTS_CTA.href}
          variant="outlineOnGray"
          className="mx-auto w-full max-w-[340px] min-[481px]:max-w-[280px]"
        >
          {EXPERTS_CTA.label}
        </Button3D>
      </div>
    </div>
  );
}
