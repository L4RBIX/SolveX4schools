"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Section 11 — a centred serif heading over a horizontal row of testimonial
 * cards. The reference row is wider than the shell and was partly occluded at
 * capture, so it is built as an overflow row with scroll snapping rather than a
 * static grid. No arrows or dots: none were observed.
 *
 * Portraits are the extracted PNGs, which already ship as circular cut-outs on
 * a transparent ground — nothing is masked or redrawn here. Two of the five
 * attributions had no readable role; those cards render no role line.
 */

export interface Testimonial {
  quote: string;
  name: string;
  /** Absent where the capture could not read it. Nothing is rendered then. */
  role?: string;
  portrait: string;
}

export interface TestimonialsProps {
  heading: string;
  items: readonly Testimonial[];
}

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

export function Testimonials({ heading, items }: TestimonialsProps) {
  const reduced = useReducedMotion();
  const headingId = useId();

  return (
    <section className="bg-b-white py-20 lg:py-28" aria-labelledby={headingId}>
      <div className="b-shell">
        <motion.h2
          id={headingId}
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: EASE_OUT_QUINT }}
          className="mx-auto max-w-[840px] text-center font-b-serif text-[32px] font-medium leading-[35.2px] tracking-[-0.64px] text-b-ink sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px] lg:text-[50px] lg:leading-[55px] lg:tracking-[-1px]"
        >
          {heading}
        </motion.h2>

        {/* The row scrolls inside itself; the page never scrolls sideways. The
            scroll container is its own focusable region so the row stays
            reachable by keyboard without breaking the list semantics. */}
        <div
          role="region"
          aria-labelledby={headingId}
          tabIndex={0}
          className="-mx-5 mt-12 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mt-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <motion.ul
            initial={reduced ? "shown" : "hidden"}
            whileInView="shown"
            viewport={{ once: true, amount: 0.2, margin: "0px 0px -60px 0px" }}
            variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.06 } } }}
            className="flex snap-x snap-mandatory gap-5"
          >
            {items.map((item) => (
              <motion.li
                key={item.name}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  shown: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: EASE_OUT_QUINT },
                  },
                }}
                className="flex w-[280px] shrink-0 snap-start flex-col rounded-[20px] border border-b-line bg-b-white p-6 sm:w-[296px]"
              >
                <p className="text-[16px] leading-[24px] text-[rgba(0,0,0,0.6)]">
                  {item.quote}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  {/* The PNG is already a circular cut-out; the name below carries
                      the meaning, so the portrait is presentational. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.portrait}
                    width={100}
                    height={100}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[16px] leading-[24px] font-medium text-b-ink">
                      {item.name}
                    </p>
                    {item.role ? (
                      <p className="text-[16px] leading-[24px] text-b-muted">
                        {item.role}
                      </p>
                    ) : null}
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
