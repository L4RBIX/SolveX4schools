import { Fragment } from "react";

import { AboutContainer } from "./container";
import type { StyleWithVars } from "./css-vars";

/**
 * One component, three instances (What we do / Our approach / Our learners).
 *
 * Layout is `column-reverse` on mobile — the illustration sits ABOVE the copy —
 * and flips to a row (or row-reverse) at 769px. The illustration is painted by
 * a ::before rather than an <img>, exactly as the original does, which is why
 * the gradients and both image sources arrive as custom properties.
 */
export interface SplitSectionProps {
  /** React key only — the original emits no id on these sections. */
  id: string;
  heading: string;
  paragraphs: readonly string[];
  /** `--about-bg-base` — the mobile section gradient. */
  bgBase: string;
  /** `--about-bg-desktop` — the >=769px section gradient. */
  bgDesktop: string;
  image: string;
  mobileImage: string;
  /** Which side the illustration takes from 769px up. */
  assetSide: "left" | "right";
  /** Per-instance ::before placement, written out so Tailwind can see them. */
  assetBeforeClassName: string;
}

const ASSET_BEFORE_BASE =
  "before:absolute before:bottom-0 before:h-full before:content-[''] " +
  "before:bg-contain before:bg-no-repeat " +
  "before:[background-image:var(--about-mobile-image)] " +
  "min-[769px]:before:[background-image:var(--about-image)]";

export function SplitSection({
  heading,
  paragraphs,
  bgBase,
  bgDesktop,
  image,
  mobileImage,
  assetSide,
  assetBeforeClassName,
}: SplitSectionProps) {
  const style: StyleWithVars = {
    "--about-bg-base": bgBase,
    "--about-bg-desktop": bgDesktop,
    "--about-image": `url(${image})`,
    "--about-mobile-image": `url(${mobileImage})`,
  };

  return (
    <section
      data-slot="section"
      style={style}
      className={
        "relative max-w-[100vw] overflow-hidden px-6 py-16 " +
        "[background-image:var(--about-bg-base)] " +
        "min-[769px]:px-8 min-[769px]:py-0 min-[769px]:[background-image:var(--about-bg-desktop)]"
      }
    >
      <AboutContainer
        className={
          "flex flex-col-reverse items-start justify-center gap-4 " +
          "min-[769px]:items-center min-[769px]:justify-between min-[769px]:gap-6 " +
          (assetSide === "left"
            ? "min-[769px]:flex-row-reverse"
            : "min-[769px]:flex-row")
        }
      >
        <div
          data-slot="vstack"
          className="flex max-w-full flex-1 flex-col items-start justify-start gap-6 text-left min-[769px]:max-w-[480px] min-[769px]:justify-center"
        >
          <h2
            data-slot="heading"
            className="w-full font-b-serif text-[36px] leading-[110%] font-normal tracking-[-0.025em] text-b-ink min-[481px]:text-[48px]"
          >
            {heading}
          </h2>
          <p data-slot="p" className="text-[16px] leading-[1.5] text-b-ink">
            {paragraphs.map((paragraph, index) => (
              <Fragment key={paragraph.slice(0, 32)}>
                {index > 0 ? (
                  <>
                    <br />
                    <br />
                  </>
                ) : null}
                {paragraph}
              </Fragment>
            ))}
          </p>
        </div>

        <div
          data-slot="box"
          aria-hidden="true"
          className={
            "relative ml-0 min-h-[300px] w-full shrink-0 grow basis-0 min-[769px]:min-h-[728px] " +
            (assetSide === "left" ? "min-[769px]:ml-6 " : "min-[769px]:-ml-6 ") +
            ASSET_BEFORE_BASE +
            " " +
            assetBeforeClassName
          }
        />
      </AboutContainer>
    </section>
  );
}
