"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * The repeating two-column feature block: a 555x387 pastel media panel and a
 * text column, sides alternating down the page.
 *
 * A row shows either brilliant.org's own extracted still from
 * /loggedOutHomepage/*.png, served art-directed through `<picture>`, or a
 * looping clip. Nothing here is a redrawn approximation. Below `lg` everything
 * stacks with the media first.
 *
 * The reference gave each row its own clip. Those were removed with the rest of
 * the video, so rows that want motion now share the Computer Science clip. It
 * is 1360x888 against the panel's 555x387, so it is `object-contain` rather
 * than `cover` — cover would shave the sides off a clip it was not cut for.
 *
 * A row given neither `image` nor `video` drops the panel entirely and renders
 * as a single centred text column instead of an empty tinted box.
 */

export type FeatureTone = "sky" | "mint" | "peach";
/** One art-directed still. `desktop` is served above `lg`, `mobile` below. */
export interface FeatureImageSource {
  src: string;
  width: number;
  height: number;
}

export interface FeatureImage {
  desktop: FeatureImageSource;
  mobile: FeatureImageSource;
}

interface FeatureRowBase {
  heading: string;
  body: string;
  tone: FeatureTone;
  mediaSide: "left" | "right";
}

/** A looping clip for the media panel. */
export interface FeatureVideo {
  webm: string;
  /** Optional H.264 fallback where the reference ships one. */
  mp4?: string;
  poster: string;
  /**
   * Seconds to seek to before playing. Rows that share a clip stagger this so
   * they do not all show the same frame at the same moment.
   */
  startAt?: number;
}

/** A row carries at most one kind of media. */
export type FeatureRowProps = FeatureRowBase & {
  image?: FeatureImage;
  video?: FeatureVideo;
};

const TONE_CLASS: Record<FeatureTone, string> = {
  sky: "bg-b-sky",
  mint: "bg-b-mint",
  peach: "bg-b-peach",
};

const VIEWPORT = { once: true, amount: 0.4 } as const;
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

export function FeatureRow({
  heading,
  body,
  tone,
  mediaSide,
  image,
  video,
}: FeatureRowProps) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasMedia = Boolean(image || video);

  /* The reference only plays a clip while it is on screen; four rows autoplaying
     at once off-screen is wasted decode work. */
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (reduced) {
      node.pause();
      return;
    }

    const offset = video?.startAt ?? 0;

    /* Seek before the first play, and again on every loop, so a shared clip
       keeps its per-row offset instead of snapping back to 0. */
    const seek = () => {
      if (!offset || !Number.isFinite(node.duration)) return;
      node.currentTime = offset % node.duration;
    };

    if (node.readyState >= 1) seek();
    node.addEventListener("loadedmetadata", seek);
    node.addEventListener("ended", seek);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            void node.play().catch(() => {
              /* autoplay can be refused; the poster frame stands in */
            });
          } else {
            node.pause();
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeEventListener("loadedmetadata", seek);
      node.removeEventListener("ended", seek);
    };
  }, [reduced, video]);

  return (
    <section className="b-shell">
      <div
        className={cn(
          "flex flex-col items-center gap-10 lg:flex-row lg:gap-20",
          hasMedia ? "lg:justify-between" : "lg:justify-center",
          hasMedia && mediaSide === "right" && "lg:flex-row-reverse",
        )}
      >
        {hasMedia && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
            className={cn(
              "w-full max-w-[555px] shrink-0 overflow-hidden rounded-[20px] lg:h-[387px] lg:w-[555px]",
              TONE_CLASS[tone],
            )}
          >
            {image ? (
              <picture className="block h-full w-full">
                <source
                  media="(min-width: 1024px)"
                  srcSet={image.desktop.src}
                  width={image.desktop.width}
                  height={image.desktop.height}
                />
                {/* next/image cannot express art-directed <picture> sources. */}
                <img
                  src={image.mobile.src}
                  width={image.mobile.width}
                  height={image.mobile.height}
                  alt={heading}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </picture>
            ) : video ? (
              <video
                ref={videoRef}
                poster={video.poster}
                className="h-full w-full object-contain"
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={heading}
              >
                <source src={video.webm} type="video/webm" />
                {video.mp4 ? <source src={video.mp4} type="video/mp4" /> : null}
              </video>
            ) : null}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT_QUINT }}
          className={cn(
            "w-full",
            // Paired with the media panel the copy sits in a 336px column, as
            // measured. On its own it centres and widens, so the row reads as a
            // deliberate text block instead of a stranded sliver.
            hasMedia ? "max-w-[336px]" : "max-w-[680px] text-center",
          )}
        >
          <h2 className="text-[28px] leading-[33.6px] font-normal tracking-[-0.28px] text-b-ink lg:text-[36px] lg:leading-[43.2px] lg:tracking-[-0.36px]">
            {heading}
          </h2>
          {/* measured at rgba(0,0,0,0.6) — darker than the 0.4 used in the hero */}
          <p className="mt-4 text-[16px] leading-[24px] text-[rgba(0,0,0,0.6)] lg:mt-5">
            {body}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
