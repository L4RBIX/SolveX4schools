import { cn } from "@/lib/utils";

import { GRAY_55_BG, SOCIAL_PROOF_HEADING, SOCIAL_PROOF_STARS_LABEL } from "./data";
import { GLYPHS, Glyph } from "./glyphs";

/**
 * Section 2. Two DOM variants of the same logo row: a stacked/wrapped one below
 * `xl` and a single divided row at `xl` and up. Both are in the markup; only
 * one is ever displayed.
 */

const GRAY = "text-[#b3b3b3]";

/** `border-inline-end: 1px #e5e5e5`, overshooting the row by 24px each way. */
function Divider() {
  return <div aria-hidden className="h-auto -my-6 self-stretch border-e border-[#e5e5e5]" />;
}

function FiveStars() {
  return (
    <Glyph
      src={GLYPHS.fiveStars}
      className="h-6 w-[134px] min-[769px]:h-7 min-[769px]:w-[156px]"
    />
  );
}

function StarsBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", GRAY, className)}>
      <FiveStars />
      <p className="text-center text-[16px]">{SOCIAL_PROOF_STARS_LABEL}</p>
    </div>
  );
}

export function SocialProof() {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-12 px-5 py-16",
        "min-[481px]:px-8 min-[481px]:py-20 min-[992px]:gap-[72px]",
      )}
      style={{ backgroundImage: GRAY_55_BG }}
    >
      <h2
        className={cn(
          "font-b-serif text-center text-[2.25rem] font-medium tracking-[-0.025em] text-black",
          "leading-[1.33] min-[360px]:leading-[1.2] min-[769px]:text-[3rem]",
          "[font-variant-numeric:lining-nums]",
        )}
      >
        {SOCIAL_PROOF_HEADING}
      </h2>

      {/* below xl */}
      <div className="flex flex-col gap-16 min-[769px]:flex-row min-[769px]:gap-9 min-[992px]:hidden">
        <StarsBlock className="flex-1" />

        <div className={cn("flex flex-col items-center gap-4", GRAY)}>
          <Glyph src={GLYPHS.newYorkTimes} width={185} height={25} />
          <Glyph src={GLYPHS.theAtlantic} width={170} height={27} />
        </div>

        <div className={cn("flex flex-row items-center gap-6", GRAY)}>
          <Glyph
            src={GLYPHS.appleEditorsChoice}
            width={139}
            height={45}
          />
          <Glyph
            src={GLYPHS.googlePlayFeatured}
            width={139}
            height={45}
          />
        </div>
      </div>

      {/* xl and up */}
      <div
        className={cn(
          "hidden w-full max-w-[1216px] flex-row items-center justify-between gap-4",
          GRAY,
          "min-[992px]:flex",
        )}
      >
        <div className="flex flex-1 justify-center">
          <Glyph src={GLYPHS.newYorkTimes} width={185} height={25} />
        </div>
        <Divider />
        <div className="flex flex-1 justify-center">
          <Glyph src={GLYPHS.theAtlantic} width={170} height={27} />
        </div>
        <Divider />
        <StarsBlock className="flex-1" />
        <Divider />
        <div className="flex flex-1 justify-center">
          <Glyph
            src={GLYPHS.appleEditorsChoice}
            width={139}
            height={45}
          />
        </div>
        <Divider />
        <div className="flex flex-1 justify-center">
          <Glyph
            src={GLYPHS.googlePlayFeatured}
            width={139}
            height={45}
          />
        </div>
      </div>
    </div>
  );
}
