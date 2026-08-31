"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button3D } from "./button-3d";
import { AboutContainer } from "./container";
import { BrilliantWordmark } from "./wordmark";

/**
 * AppHeaderContainer, as /about/ ships it.
 *
 * Server HTML contains ONE 64px bar holding only the wordmark — the auth query
 * has not resolved at render time, so the container has no children. After
 * hydration a logged-out visitor gets two copies of the bar: the in-flow one,
 * plus a `position: fixed` duplicate that slides down from `y: -100%` to `0%`
 * once `window.scrollY > 200`, over 0.2s easeInOut.
 *
 * That slide is the only scroll-driven behaviour anywhere on this route.
 */
const SCROLL_TRIGGER = 200;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function subscribeToNothing() {
  return () => {};
}

function HeaderBar({ showAuth }: { showAuth: boolean }) {
  return (
    <div
      data-slot="box"
      className="flex w-full max-w-full flex-col items-center border-b border-b-line bg-b-white px-6 min-[481px]:px-8"
    >
      <AboutContainer className="flex h-16 flex-nowrap items-center justify-between gap-6 min-[481px]:gap-8 min-[769px]:gap-10">
        <Link href="/" className="text-b-ink">
          <BrilliantWordmark className="h-6 max-h-12 min-h-5 w-auto min-[481px]:h-8" />
        </Link>

        {showAuth ? (
          <div data-slot="hstack" className="flex items-center gap-2">
            {/* The header JS calls `buildLoginUrl(asPath)`; the resolved URL is
                not in the served payload and was not extracted, so this control
                ships with no destination rather than a guessed one. */}
            <Button3D
              className="hidden min-[769px]:inline-flex"
              faceClassName="border-2 border-black bg-b-white px-6 py-3 text-b-ink shadow-[0_4px_0_0_#000]"
            >
              Sign in
            </Button3D>
            <Button3D
              href="/welcome/"
              faceClassName="bg-b-green px-5 text-b-ink shadow-[0_4px_0_0_#000]"
            >
              Sign up
            </Button3D>
          </div>
        ) : null}
      </AboutContainer>
    </div>
  );
}

export function AboutHeader() {
  const reduce = useReducedMotion();

  // False on the server and through hydration, true once mounted — the auth
  // buttons and the fixed duplicate are client-only on the original too.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > SCROLL_TRIGGER,
    () => false,
  );

  return (
    <>
      <HeaderBar showAuth={mounted} />

      {mounted ? (
        /* The duplicate is a literal copy on the live site. It is marked inert
           so the identical links are not announced or tabbed through twice. */
        <motion.div
          inert
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-[999]"
          initial={false}
          animate={{ y: scrolled ? "0%" : "-100%" }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }
          }
        >
          <HeaderBar showAuth />
        </motion.div>
      ) : null}
    </>
  );
}
