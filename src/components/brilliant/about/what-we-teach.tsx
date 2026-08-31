"use client";

import { Tabs } from "@base-ui/react/tabs";
import { motion, useReducedMotion } from "motion/react";

import { ABOUT_IMG } from "./assets";
import { AboutContainer } from "./container";
import { SectionHeading } from "./section-heading";
import { useMinWidth } from "./use-min-width";

interface TeachTab {
  title: string;
  body: string;
  desktopImage: string;
  mobileImage: string;
}

const TABS: readonly TeachTab[] = [
  {
    title: "Math",
    body: "After covering all concepts of Algebra, we’ll turn to building out our coverage of Geometry, Probability, Calculus, and beyond in 2026.",
    desktopImage: `${ABOUT_IMG}/what-we-teach-math.svg`,
    mobileImage: `${ABOUT_IMG}/what-we-teach-math-mobile.svg`,
  },
  {
    title: "Coding",
    body: "We will cover all of foundational algorithm design and data structures by the end of 2026. This will bridge complete beginners from their first program all the way through the end of college-level introductory computer science courses.",
    desktopImage: `${ABOUT_IMG}/what-we-teach-cs.svg`,
    mobileImage: `${ABOUT_IMG}/what-we-teach-cs-mobile.svg`,
  },
];

const TAB_CLASS =
  "flex h-auto w-1/2 cursor-pointer items-center justify-center rounded-xl border-none bg-none " +
  "px-3 py-3 text-[14px] font-bold text-[rgba(0,0,0,0.5)] " +
  "min-[481px]:px-5 min-[481px]:py-4 min-[481px]:text-[16px] min-[769px]:w-auto " +
  "hover:text-b-ink min-[481px]:hover:bg-[#e5e5e5] " +
  "data-[active]:bg-b-white data-[active]:text-b-ink data-[active]:shadow-[0px_1px_8px_0px_#0000000D] " +
  "data-[active]:hover:bg-b-white!";

/**
 * "What we teach" — Base UI Tabs, two panels, index 0 (Math) selected on load.
 * `activateOnFocus` matches the original, so arrow keys switch panels as focus
 * moves. Only the selected panel is mounted, which is why the 0.7s fade fires
 * on every switch.
 *
 * The illustration is chosen in JS, not by srcset: the mobile SVG renders on
 * the server and on first paint, then the desktop SVG replaces it above 769px.
 */
export function WhatWeTeach() {
  const reduce = useReducedMotion();
  const isDesktop = useMinWidth("(min-width: 769px)");

  return (
    <section
      data-slot="section"
      className="w-full px-6 py-16 min-[769px]:py-[108px]"
    >
      <AboutContainer>
        <Tabs.Root
          defaultValue={0}
          className="flex w-full flex-col items-center"
        >
          <div
            data-slot="flex"
            className="flex w-full flex-col min-[769px]:flex-row"
          >
            <div data-slot="box" className="w-full min-[769px]:w-1/2">
              <SectionHeading className="mb-8 min-[769px]:mb-0">
                What we teach
              </SectionHeading>
            </div>

            <div data-slot="box">
              <Tabs.List
                activateOnFocus
                className={
                  "z-[2] flex h-[58px] w-auto flex-nowrap justify-between gap-0 overflow-x-auto " +
                  "rounded-2xl bg-[#f2f2f2] p-1.5 whitespace-nowrap " +
                  "[scrollbar-width:none] [&::-webkit-scrollbar]:w-0 min-[481px]:gap-2"
                }
              >
                {TABS.map((tab, index) => (
                  <Tabs.Tab key={tab.title} value={index} className={TAB_CLASS}>
                    {tab.title}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </div>
          </div>

          {TABS.map((tab, index) => (
            <Tabs.Panel
              key={tab.title}
              value={index}
              className="w-full px-0 min-[481px]:px-4"
            >
              <div data-slot="flex" className="flex justify-end">
                <div data-slot="box" className="w-full min-[769px]:w-1/2">
                  <p
                    data-slot="p"
                    className="mt-5 mb-10 text-[16px] leading-[1.5] text-[rgba(0,0,0,0.6)] min-[769px]:mt-4 min-[769px]:mb-16"
                  >
                    {tab.body}
                  </p>
                </div>
              </div>

              <motion.img
                data-slot="img"
                src={isDesktop ? tab.desktopImage : tab.mobileImage}
                alt={tab.title}
                className="w-full"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.7,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              />
            </Tabs.Panel>
          ))}
        </Tabs.Root>
      </AboutContainer>
    </section>
  );
}
