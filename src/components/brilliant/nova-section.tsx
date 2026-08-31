"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { NovaAvatar } from "@/components/nova/nova-avatar";

/**
 * "Meet Nova" — the mascot band on the public landing.
 *
 * The section's rhythm is the cloned Koji band's, measured and kept: centred
 * column, the same 36/48/60px display scale with its negative tracking, and
 * heading and body rising on one quintic ease with the copy trailing by 80ms.
 *
 * ONE thing is deliberately not copied. Koji overflowed his wrapper downward,
 * *behind* the heading — which works because Koji is a tall character standing
 * on a pedestal, so the overlap reads as depth. Strobi is a sphere. Dropped
 * into the same overflow he simply lands on the words. So the avatar gets its
 * own full height and a clean gap, and the z-0/z-10 pairing that existed to
 * manage that overlap is gone with it.
 *
 * Copying the measurement and not the reason is how a faithful port turns into
 * a broken one.
 */

const AVATAR = 220;
const EASE = [0.23, 1, 0.32, 1] as const;

export interface NovaSectionProps {
  heading: string;
  body: string;
}

export function NovaSection({ heading, body }: NovaSectionProps) {
  const still = useReducedMotion();
  const headingId = useId();

  return (
    <section className="bg-b-white py-20 lg:py-28" aria-labelledby={headingId}>
      <div className="b-shell relative flex flex-col items-center text-center">
        {/* `curious` rather than `idle`: this is the first time a visitor meets
            Nova, and curiosity is the posture to open with. */}
        <motion.div
          initial={still ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: EASE }}
          aria-hidden
        >
          <NovaAvatar state="curious" size={AVATAR} />
        </motion.div>

        <motion.h2
          id={headingId}
          initial={still ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mt-10 max-w-[900px] font-sx-sans text-[36px] leading-[39.6px] font-semibold tracking-[-0.72px] text-b-ink sm:text-[48px] sm:leading-[52.8px] sm:tracking-[-0.96px] lg:text-[60px] lg:leading-[66px] lg:tracking-[-1.2px]"
        >
          {heading}
        </motion.h2>

        <motion.p
          initial={still ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
          className="mt-6 max-w-[560px] text-[18px] leading-[27px] text-b-muted sm:text-[20px] sm:leading-[29px]"
        >
          {body}
        </motion.p>
      </div>
    </section>
  );
}
