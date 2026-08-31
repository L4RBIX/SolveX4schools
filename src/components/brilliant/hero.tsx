"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const COURSES = "/assets/original/brilliant/brilliant.org/videos/homepage/courses";

/**
 * The reference plays a portrait clip here (`lohp-rebrand-hero.*`). That clip
 * was removed with the rest of the video; the Computer Science clip stands in.
 *
 * It is landscape — 1360x888 — so the card is given that exact aspect ratio
 * rather than the reference's portrait 44:60 frame. Dropping a 1.53 clip into a
 * 0.73 box would crop roughly half of it away.
 *
 * The clip runs 17.4s across four scenes — Neural networks, Python, Algorithms,
 * Thinking in code — and the homepage plays it in five places. The hero takes
 * the last scene, which nothing else uses, so it does not open on the same
 * frame as the first feature row.
 */
export interface HeroClipSource {
  webm: string;
  poster: string;
  /** Seconds to open on, for a clip shared by several cards. */
  startAt?: number;
  width: number;
  height: number;
}

const HERO_CLIP: HeroClipSource = {
  webm: `${COURSES}/cs-refresh.webm`,
  poster: `${COURSES}/posters/cs-refresh.png`,
  startAt: 16.5,
  width: 1360,
  height: 888,
};

/**
 * Autoplay can be refused; the poster frame is what stands in when it is.
 * `play()` is retried on `canplay` because calling it from a mount effect can
 * land before the element has any data and get dropped.
 */
function HeroClip({ clip }: { clip: HeroClipSource }) {
  const ref = useRef<HTMLVideoElement>(null);

  const start = () => {
    const node = ref.current;
    if (!node) return;
    if (clip.startAt && Number.isFinite(node.duration)) {
      /* Only seek when the clip has looped back past the offset, so a resumed
         playhead is not yanked backwards mid-scene. */
      if (node.currentTime < clip.startAt) {
        node.currentTime = clip.startAt % node.duration;
      }
    }
    void node.play().catch(() => {});
  };

  useEffect(start, []);

  return (
    <video
      ref={ref}
      width={clip.width}
      height={clip.height}
      poster={clip.poster}
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onLoadedMetadata={start}
      onCanPlay={start}
      onEnded={start}
      aria-hidden
    >
      <source src={clip.webm} type="video/webm" />
    </video>
  );
}

/* ------------------------------------------------------------------ awards */

function Laurel({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="14"
      height="34"
      viewBox="0 0 14 34"
      fill="none"
      aria-hidden
      className={cn("shrink-0 text-b-muted", flip && "-scale-x-100")}
    >
      <g stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" fill="none">
        <path d="M11 2C5.5 7 3 12.5 3 17s2.5 10 8 15" />
        <path d="M9.6 6.4C7.6 5.4 5.6 5.6 4.4 6.9" />
        <path d="M7.3 11.2C5.2 10.6 3.4 11.1 2.5 12.5" />
        <path d="M6.2 16.6C4.1 16.4 2.5 17.2 1.9 18.7" />
        <path d="M6.7 22C4.7 22.3 3.3 23.4 3 25" />
        <path d="M8.6 26.9C6.8 27.6 5.8 28.9 5.8 30.5" />
      </g>
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden className="text-b-muted">
      <path
        fill="currentColor"
        d="M9.8 7.9c0-1.7 1.3-2.5 1.4-2.6-.8-1.1-2-1.3-2.4-1.3-1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6c-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.7.9 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2.1-1.6.7-.9.9-1.8 1-1.9-.1 0-1.9-.7-2-2.6Z"
      />
      <path
        fill="currentColor"
        d="M8.2 2.9c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8.1 1.6-.4 2-1Z"
      />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden className="text-b-muted">
      <path fill="currentColor" d="M1.4.9 8.9 7.5 1.4 14.1A1.6 1.6 0 0 1 .8 12.8V2.2A1.6 1.6 0 0 1 1.4.9Z" />
      <path fill="currentColor" d="m10.2 5.6 1.9 1.1a1 1 0 0 1 0 1.7l-1.9 1.1L8 7.5l2.2-1.9Z" opacity={0.75} />
    </svg>
  );
}

function AwardBadge({ glyph, label }: { glyph: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <Laurel />
      <span className="flex w-[62px] flex-col items-center gap-0.5 text-center">
        {glyph}
        <span className="text-[11px] font-bold leading-[13px] text-b-muted">{label}</span>
      </span>
      <Laurel flip />
    </div>
  );
}

/* -------------------------------------------------------------------- hero */

export interface HeroBadge {
  glyph: "apple" | "play";
  label: string;
}

export interface HeroProps {
  /**
   * All copy. Every field defaults to the reference route's own literal so
   * /brilliant renders byte-identically and stays usable as the visual
   * baseline; the product supplies its own.
   */
  heading?: string;
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Award laurels. `[]` removes them — SolveX4Schools has no app-store awards. */
  badges?: HeroBadge[];
  /**
   * Serif display face for the headline. The reference uses CoFo Robert, which
   * is commercially licensed and cannot ship; the product passes its own class.
   */
  headingFontClass?: string;
  /**
   * The clip this card plays, when the caller has its own.
   *
   * The clone keeps the default, because that is what it is a clone of. The
   * product passes a recording of a real SolveX lesson — the card is the one
   * place on the landing page that claims "this is the thing you are signing
   * up for", and a clip of someone else's course is the wrong claim to make
   * there. The three feature rows below it keep the reference footage.
   */
  clip?: HeroClipSource;
}

export function Hero({
  heading = "Your personal tutor for math and coding",
  body = "A world-class tutor for every home. Built by top learning experts from MIT and Harvard.",
  primary = { label: "I'm a learner", href: "/brilliant/courses" },
  secondary = { label: "I'm a parent or teacher", href: "/brilliant/courses" },
  badges = [
    { glyph: "apple", label: "Editors' Choice" },
    { glyph: "play", label: "Featured App" },
  ],
  headingFontClass = "font-b-serif",
  clip,
}: HeroProps = {}) {
  return (
    <section className="b-shell flex flex-col justify-center gap-8 py-12 lg:h-[760px] lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-0">
      {/* `lg:min-w-0` is the whole fix for the 1024 breakpoint: a flex item
          defaults to `min-width: auto`, so a 76px display line containing
          "программировать," refuses to shrink and pushes the 560px video off
          the page. The display size now reaches 76px at 1280, which is where
          the reference was measured, and holds at 60px between 1024 and 1280. */}
      <div className="contents lg:block lg:w-full lg:max-w-[640px] lg:min-w-0">
        <h1
          className={cn(
            "order-1 text-center text-[36px] font-medium leading-[39.6px] tracking-[-0.36px] text-b-ink sm:text-[56px] sm:leading-[58.8px] sm:tracking-[-1.05px] lg:order-none lg:text-left lg:text-[60px] lg:leading-[64px] lg:tracking-[-1.1px] xl:text-[76px] xl:leading-[79.8px] xl:tracking-[-1.4px]",
            headingFontClass,
          )}
        >
          {heading}
        </h1>

        <p className="order-3 mt-0 max-w-[420px] text-center text-[20px] leading-[29px] text-b-muted lg:order-none lg:mt-7 lg:text-left">
          {body}
        </p>

        <div className="order-5 mt-0 flex w-full flex-col gap-3 lg:order-none lg:mt-11 lg:w-auto lg:flex-row lg:flex-wrap">
          <a
            href={primary.href}
            className="b-press inline-flex w-full items-center justify-center rounded-full bg-b-green px-5 py-3 text-[20px] font-medium leading-[24px] text-b-white hover:-translate-y-px lg:w-auto"
          >
            {primary.label}
          </a>
          <a
            href={secondary.href}
            className="b-press inline-flex w-full items-center justify-center rounded-full border-2 border-b-line bg-b-white px-5 py-3 text-[20px] font-medium leading-[24px] text-b-muted hover:-translate-y-px hover:text-b-ink lg:w-auto"
          >
            {secondary.label}
          </a>
        </div>

        {badges.length > 0 ? (
          <div className="order-4 mt-0 flex flex-wrap items-center justify-center gap-6 lg:order-none lg:mt-6 lg:justify-start">
            {badges.map((b) => (
              <AwardBadge
                key={b.label}
                glyph={b.glyph === "apple" ? <AppleGlyph /> : <PlayGlyph />}
                label={b.label}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="order-2 flex w-full shrink-0 justify-center lg:order-none lg:w-[560px]">
        <div className="aspect-[1360/888] w-full max-w-[560px] overflow-hidden rounded-[20px] bg-b-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_16px_40px_rgba(0,0,0,0.06)]">
          <HeroClip clip={clip ?? HERO_CLIP} />
        </div>
      </div>
    </section>
  );
}
