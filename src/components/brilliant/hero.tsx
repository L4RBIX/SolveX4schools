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
const HERO_CLIP = {
  webm: `${COURSES}/cs-refresh.webm`,
  poster: `${COURSES}/posters/cs-refresh.png`,
  startAt: 16.5,
  width: 1360,
  height: 888,
} as const;

/**
 * Autoplay can be refused; the poster frame is what stands in when it is.
 * `play()` is retried on `canplay` because calling it from a mount effect can
 * land before the element has any data and get dropped.
 */
function HeroClip() {
  const ref = useRef<HTMLVideoElement>(null);

  const start = () => {
    const node = ref.current;
    if (!node) return;
    if (HERO_CLIP.startAt && Number.isFinite(node.duration)) {
      /* Only seek when the clip has looped back past the offset, so a resumed
         playhead is not yanked backwards mid-scene. */
      if (node.currentTime < HERO_CLIP.startAt) {
        node.currentTime = HERO_CLIP.startAt % node.duration;
      }
    }
    void node.play().catch(() => {});
  };

  useEffect(start, []);

  return (
    <video
      ref={ref}
      width={HERO_CLIP.width}
      height={HERO_CLIP.height}
      poster={HERO_CLIP.poster}
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
      <source src={HERO_CLIP.webm} type="video/webm" />
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

export function Hero() {
  return (
    <section className="b-shell flex flex-col justify-center gap-8 py-12 lg:h-[760px] lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-0">
      <div className="contents lg:block lg:w-full lg:max-w-[640px]">
        <h1 className="order-1 text-center font-b-serif text-[36px] font-medium leading-[39.6px] tracking-[-0.36px] text-b-ink sm:text-[56px] sm:leading-[58.8px] sm:tracking-[-1.05px] lg:order-none lg:text-left lg:text-[76px] lg:leading-[79.8px] lg:tracking-[-1.4px]">
          Your personal tutor for math and coding
        </h1>

        <p className="order-3 mt-0 max-w-[420px] text-center text-[20px] leading-[29px] text-b-muted lg:order-none lg:mt-7 lg:text-left">
          A world-class tutor for every home. Built by top learning experts from
          MIT and Harvard.
        </p>

        <div className="order-5 mt-0 flex w-full flex-col gap-3 lg:order-none lg:mt-11 lg:w-auto lg:flex-row lg:flex-wrap">
          <a
            href="/brilliant/courses"
            className="b-press inline-flex w-full items-center justify-center rounded-full bg-b-green px-5 py-3 text-[20px] font-medium leading-[24px] text-b-white hover:-translate-y-px lg:w-auto"
          >
            I&apos;m a learner
          </a>
          <a
            href="/brilliant/courses"
            className="b-press inline-flex w-full items-center justify-center rounded-full border-2 border-b-line bg-b-white px-5 py-3 text-[20px] font-medium leading-[24px] text-b-muted hover:-translate-y-px hover:text-b-ink lg:w-auto"
          >
            I&apos;m a parent or teacher
          </a>
        </div>

        <div className="order-4 mt-0 flex flex-wrap items-center justify-center gap-6 lg:order-none lg:mt-6 lg:justify-start">
          <AwardBadge glyph={<AppleGlyph />} label="Editors' Choice" />
          <AwardBadge glyph={<PlayGlyph />} label="Featured App" />
        </div>
      </div>

      <div className="order-2 flex w-full shrink-0 justify-center lg:order-none lg:w-[560px]">
        <div className="aspect-[1360/888] w-full max-w-[560px] overflow-hidden rounded-[20px] bg-b-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_16px_40px_rgba(0,0,0,0.06)]">
          <HeroClip />
        </div>
      </div>
    </section>
  );
}
