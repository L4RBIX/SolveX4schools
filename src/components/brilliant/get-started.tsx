"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Section 12 — the closing band: heading, one button, then a full-bleed photo.
 *
 * The reference has no sub-copy between the heading and the button, so none is
 * rendered. The photo is the extracted asset served through `<picture>` in the
 * original's format order: avif first, jpg as the fallback.
 */

export interface GetStartedProps {
  heading: string;
  cta: string;
  ctaHref: string;
}

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;
const VIEWPORT = { once: true, amount: 0.4 } as const;

const PHOTO = "/assets/original/brilliant/brilliant.org/images/homepage/get-started";

export function GetStarted({ heading, cta, ctaHref }: GetStartedProps) {
  const reduced = useReducedMotion();
  const headingId = useId();

  return (
    <section className="bg-b-white pt-20 lg:pt-28" aria-labelledby={headingId}>
      <div className="b-shell flex flex-col items-center">
        <motion.h2
          id={headingId}
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.55, ease: EASE_OUT_QUINT }}
          className="max-w-[840px] text-center font-b-serif text-[32px] font-medium leading-[35.2px] tracking-[-0.64px] text-b-ink sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px] lg:text-[50px] lg:leading-[55px] lg:tracking-[-1px]"
        >
          {heading}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT_QUINT }}
          className="mt-8 lg:mt-10"
        >
          <a
            href={ctaHref}
            className="b-press inline-flex min-h-[44px] items-center justify-center rounded-full bg-b-green px-5 py-3 text-[20px] font-medium leading-[24px] text-b-white hover:-translate-y-px"
          >
            {cta}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, delay: 0.12, ease: EASE_OUT_QUINT }}
        className="mt-16 w-full lg:mt-20"
      >
        <picture className="block w-full">
          <source
            media="(min-width: 1440px)"
            type="image/avif"
            srcSet={`${PHOTO}/photo-desktop-wide.avif`}
            width={2152}
            height={650}
          />
          <source
            media="(min-width: 1440px)"
            type="image/jpeg"
            srcSet={`${PHOTO}/photo-desktop-wide.jpg`}
            width={2152}
            height={650}
          />
          <source
            media="(min-width: 640px)"
            type="image/avif"
            srcSet={`${PHOTO}/photo-desktop.avif`}
            width={1440}
            height={650}
          />
          <source
            media="(min-width: 640px)"
            type="image/jpeg"
            srcSet={`${PHOTO}/photo-desktop.jpg`}
            width={1440}
            height={650}
          />
          <source type="image/avif" srcSet={`${PHOTO}/photo-mobile.avif`} width={393} height={664} />
          {/* Art-directed <picture>; next/image cannot express these sources. */}
          <img
            src={`${PHOTO}/photo-mobile.jpg`}
            width={393}
            height={664}
            alt=""
            loading="lazy"
            decoding="async"
            className="block h-auto w-full object-cover"
          />
        </picture>
      </motion.div>
    </section>
  );
}
