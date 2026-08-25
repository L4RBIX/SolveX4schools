"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Full-bleed white band under the hero, 254px tall on desktop. Three equal
 * bordered cards, centred type, fading up on scroll with a 60ms stagger.
 */

function MedalMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <circle cx="17" cy="13" r="8.5" stroke="#000000" strokeWidth="1.6" />
      <path d="M17 8.6l1.6 3.2 3.5.5-2.6 2.5.6 3.5-3.1-1.7-3.1 1.7.6-3.5-2.6-2.5 3.5-.5z" fill="#29CC57" />
      <path d="M11.4 20.6 8.6 31l8.4-4.4 8.4 4.4-2.8-10.4" stroke="#000000" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function StarsMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <path d="M17 4.5l3.6 7.3 8 1.2-5.8 5.6 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.6 8-1.2z" fill="#29CC57" stroke="#000000" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden>
      <circle cx="17" cy="17" r="12.2" fill="#F0F8FA" stroke="#000000" strokeWidth="1.6" />
      <path d="M4.8 17h24.4M17 4.8c3.4 3.4 5.1 7.5 5.1 12.2s-1.7 8.8-5.1 12.2c-3.4-3.4-5.1-7.5-5.1-12.2S13.6 8.2 17 4.8Z" stroke="#000000" strokeWidth="1.4" />
    </svg>
  );
}

const STATS = [
  { mark: <MedalMark />, heading: "Award-winning", sub: "effective and fun learning" },
  { mark: <StarsMark />, heading: "100,000+", sub: "5-star app store reviews" },
  { mark: <GlobeMark />, heading: "10 million+", sub: "learners around the world" },
] as const;

export function StatsBand() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-b-white py-14 lg:h-[254px] lg:py-0" aria-label="Why learners choose Brilliant">
      <div className="b-shell flex h-full items-center">
        <motion.ul
          initial={reduce ? "shown" : "hidden"}
          whileInView="shown"
          viewport={{ once: true, amount: 0.3, margin: "0px 0px -60px 0px" }}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.06 } } }}
          className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5"
        >
          {STATS.map((stat) => (
            <motion.li
              key={stat.heading}
              variants={{
                hidden: { opacity: 0, y: 20 },
                shown: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
                },
              }}
              className="flex flex-col items-center rounded-[20px] border border-b-line px-6 py-7 text-center sm:px-8 sm:py-8"
            >
              <span className="mb-3 flex h-[34px] items-center justify-center">{stat.mark}</span>
              <h3 className="text-[30px] font-normal leading-[37.5px] tracking-[-0.3px] text-b-ink">
                {stat.heading}
              </h3>
              <p className="text-[16px] leading-[24px] text-b-muted">
                {stat.sub}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
