"use client";

import { type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button3D, type Button3DVariant } from "./button-3d";
import {
  HERO_BULLETS,
  HERO_CTAS,
  HERO_REVIEWS_LINE,
  HERO_POSTER,
  SCRATCH_IMAGE,
} from "./data";
import { GLYPHS, Glyph, KojiPeek } from "./glyphs";

/**
 * Section 1. Two complete layouts live in the DOM at once and are swapped by
 * `display`, exactly as the original does: a two-column desktop layout at
 * `xl` (992px) and up, a stacked one below it. Only the matching breakpoint's
 * `<source>` list is ever mounted, so only one of the two videos downloads.
 */

const HERO_BG =
  "linear-gradient(180deg, #FFF 50%, rgba(255,255,255,0.00) 100%), " +
  "linear-gradient(270deg, rgba(249,232,215,0.50) 1.1%, rgba(222,208,254,0.50) 98.9%)";

/* -------------------------------------------------------------------------- */

/** The hand-drawn underline that sits behind a single word of the headline. */
function ScratchHighlight({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-block">
      <span
        aria-hidden
        className="pointer-events-none absolute top-[-5%] left-1/2 h-[120%] w-[113%] -translate-x-1/2 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${SCRATCH_IMAGE})` }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

function HeroHeading({ className }: { className?: string }) {
  return (
    <h1
      className={cn(
        "font-b-serif text-[35px] leading-none font-normal",
        "max-w-[350px] text-center",
        "min-[481px]:max-w-[430px] min-[481px]:text-[44px]",
        "min-[769px]:max-w-full min-[769px]:text-[60px]",
        "min-[992px]:text-left min-[992px]:text-[76px]",
        className,
      )}
    >
      Strengthen your{" "}
      <span className="inline-block">
        <ScratchHighlight>math</ScratchHighlight> skills
      </span>
    </h1>
  );
}

/* -------------------------------------------------------------------------- */

interface PosterSource {
  poster: string;
  width: number;
  height: number;
}

/**
 * The reference layers a looping clip over an always-painted poster. Video was
 * removed from this build, so only the poster remains and the card is static.
 */
function HeroPosterCard({
  source,
  className,
}: {
  source: PosterSource;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-[28px] bg-white",
        "[filter:drop-shadow(0_0_109.913px_rgba(0,0,0,0.05))]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source.poster}
        width={source.width}
        height={source.height}
        alt=""
        className="block h-full w-full object-contain"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The mascot peeks over the top edge of a CTA on hover. A 30px window clips it;
 * the SVG itself starts translated fully out of that window and slides to 0.
 * `xl` and up only — below that the window is `display: none`.
 */
function KojiButton({
  href,
  variant,
  label,
}: {
  href: string;
  variant: Button3DVariant;
  label: string;
}) {
  return (
    <div className="group/koji relative w-full min-[481px]:w-auto">
      <div className="pointer-events-none absolute bottom-[calc(100%+3px)] left-1/2 hidden h-[30px] -translate-x-1/2 overflow-hidden min-[992px]:block">
        <KojiPeek className="translate-y-full transition-transform duration-200 ease-out group-hover/koji:translate-y-0" />
      </div>
      <Button3D
        href={href}
        variant={variant}
        className="h-[45px] w-full min-[481px]:h-[60px] min-[481px]:w-[353px] min-[992px]:w-[284px]"
        faceClassName="h-full"
      >
        {label}
      </Button3D>
    </div>
  );
}

function HeroCtas({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex w-full shrink-0 flex-col flex-wrap items-center justify-end gap-4",
        "h-auto min-[992px]:h-[100px]",
        className,
      )}
    >
      {HERO_CTAS.map((cta) => (
        <KojiButton key={cta.href} href={cta.href} variant={cta.variant} label={cta.label} />
      ))}
    </div>
  );
}

function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-row items-center gap-4 text-black/60", className)}>
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
  );
}

/* -------------------------------------------------------------------------- */

export function Hero() {

  return (
    <div
      className={cn(
        "flex w-full justify-center bg-white px-6",
        "min-h-[90vh] supports-[min-height:100svh]:min-h-svh",
        "mt-[calc(var(--header-h-base)*-1)] pt-[var(--header-h-base)]",
        "min-[481px]:mt-[calc(var(--header-h-md)*-1)] min-[481px]:px-8 min-[481px]:pt-[var(--header-h-md)]",
      )}
      style={
        {
          "--header-h-base": "76px",
          "--header-h-md": "88px",
          backgroundImage: HERO_BG,
        } as CSSProperties
      }
    >
      {/* -------- desktop, xl and up -------- */}
      <div
        className={cn(
          "hidden w-full max-w-[1220px] flex-1 flex-row items-start justify-between gap-10",
          "pt-[5vh] [@media(min-height:900px)]:pt-[10vh] [@media(min-height:1200px)]:pt-[14vh]",
          "min-[992px]:flex",
        )}
      >
        <div className="flex w-[590px] shrink-0 flex-col gap-10 self-stretch">
          <HeroHeading />

          <div className="flex w-full flex-col items-start gap-6">
            <ul className="ms-4 list-disc text-[20px] [&>li+li]:mt-2">
              {HERO_BULLETS.map((bullet) => (
                <li key={bullet.strong}>
                  {bullet.lead}
                  <strong className="font-bold">{bullet.strong}</strong>
                  {bullet.tail}
                </li>
              ))}
            </ul>

            <HeroCtas />
          </div>

          <div className="flex w-full flex-row items-center gap-4">
            <StoreBadges />
            <p className="text-[15px] text-black/60 min-[481px]:text-[16px]">
              {HERO_REVIEWS_LINE}
            </p>
          </div>
        </div>

        <HeroPosterCard
          source={HERO_POSTER.desktop}
          className="max-w-[440px]"
        />
      </div>

      {/* -------- mobile / tablet, below xl -------- */}
      <div
        className={cn(
          "flex w-full max-h-[900px] flex-1 flex-col items-center justify-between gap-6 py-10",
          "[@media(max-height:650px)]:pt-0",
          "min-[992px]:hidden",
        )}
      >
        <HeroHeading />

        <div className="flex max-h-[350px] min-h-[150px] flex-1 items-center justify-center">
          <HeroPosterCard
            source={HERO_POSTER.mobile}
            className="max-w-[452px]"
          />
        </div>

        <div className="flex w-full shrink-0 flex-col items-center justify-center gap-6">
          <p className="text-center text-[15px] font-bold">
            Interactive learning that’s <span className="inline-block">effective and fun.</span>
            <br />
            {HERO_REVIEWS_LINE}
          </p>
          <StoreBadges />
        </div>

        <HeroCtas />
      </div>
    </div>
  );
}
