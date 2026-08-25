import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

import type { ValueProp } from "./data";

/**
 * Sections 3, 4, 5, 7 and 8 are one template with five sets of data. Purely
 * static: two stacked CSS gradients (one below `lg`, one above) and a
 * background-image painted by an absolutely positioned layer. No observers, no
 * scroll effects — the original has none here.
 */
export function ValuePropSection({ data }: { data: ValueProp }) {
  const assetLeft = data.assetAlignment === "left";

  return (
    <section
      className={cn(
        "relative max-w-[100vw] overflow-hidden px-6 py-16",
        "bg-[image:var(--vp-bg-base)]",
        "min-[769px]:bg-[image:var(--vp-bg-desktop)] min-[769px]:px-8 min-[769px]:py-0",
      )}
      style={
        {
          "--vp-bg-base": data.bgBase,
          "--vp-bg-desktop": data.bgDesktop,
          "--vp-image": `url(${data.image})`,
        } as CSSProperties
      }
    >
      <div
        className={cn(
          "mx-auto flex max-w-full flex-col items-start justify-center gap-4",
          "min-[360px]:max-w-[432px] min-[481px]:max-w-[432px]",
          "min-[769px]:max-w-[1216px] min-[769px]:items-center min-[769px]:justify-between min-[769px]:gap-6",
          assetLeft ? "min-[769px]:flex-row-reverse" : "min-[769px]:flex-row",
        )}
      >
        <div
          className={cn(
            "mb-4 flex max-w-full flex-1 flex-col items-start justify-start gap-6 text-left",
            "min-[769px]:mb-0 min-[769px]:max-w-[480px] min-[769px]:justify-center",
          )}
        >
          <h2
            className={cn(
              "font-b-serif w-full text-left text-[3rem] font-normal",
              "leading-[110%] tracking-[-0.025em] min-[769px]:text-[3.75rem]",
            )}
          >
            {data.headingLines[0]}
            <br />
            {data.headingLines[1]}
          </h2>
          <p className="text-[16px] leading-[1.5] text-black">{data.body}</p>
        </div>

        <div
          className={cn(
            "relative min-h-[300px] w-full flex-[1_0_0%]",
            "min-[769px]:min-h-[728px]",
            assetLeft ? "ml-0 min-[769px]:ml-6" : "ml-0 min-[769px]:-ml-6",
          )}
        >
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 h-full w-full bg-contain bg-center bg-no-repeat",
              "bg-[image:var(--vp-image)]",
              "min-[769px]:w-[90%]",
              assetLeft
                ? "min-[769px]:right-auto min-[769px]:left-0"
                : "min-[769px]:right-0 min-[769px]:left-auto",
            )}
          />
        </div>
      </div>
    </section>
  );
}
