"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { FAQ_HEADING, FAQ_ITEMS, type FaqItem } from "./data";
import { ChevronDown } from "./glyphs";

/**
 * Section 10. Every item ships closed and toggles independently — the source
 * DOM carries no single-open marker. Height animates 0 ↔ auto over 200ms while
 * the chevron rotates 180°.
 */

/** CSS `ease` — the accordion's declared timing function. */
const EASE = [0.25, 0.1, 0.25, 1] as const;

function AnswerBody({ item }: { item: FaqItem }) {
  return (
    <div className="my-4 text-black/60">
      {item.answer.map((run, index) =>
        run.kind === "link" ? (
          <a
            key={index}
            href={run.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mx-0 px-0 text-inherit underline",
              "hover:decoration-[#456dff] hover:decoration-2 hover:underline-offset-2",
              "active:decoration-[#456dff] active:decoration-2 active:underline-offset-2",
            )}
          >
            {run.text}
          </a>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </div>
  );
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const triggerId = `b-faq-trigger-${item.value}`;
  const panelId = `b-faq-panel-${item.value}`;

  return (
    <div
      data-panel-open={open ? "" : undefined}
      className="border-t-2 border-black/5 px-0 py-6 first:border-t-0 min-[769px]:px-6"
    >
      <h3>
        <button
          type="button"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "flex w-full cursor-pointer items-center border-none bg-transparent text-left",
            // 44px hit area without moving anything: padding cancelled by margin.
            "-my-2.5 px-0 py-2.5",
          )}
        >
          <span className="flex-1 pr-5 font-bold text-black">{item.question}</span>
          <ChevronDown
            className={cn(
              "w-6 shrink-0 text-black transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            )}
          />
        </button>
      </h3>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE }}
        className="overflow-hidden"
      >
        <AnswerBody item={item} />
      </motion.div>
    </div>
  );
}

export function Faq() {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-5 py-16",
        "min-[769px]:px-8 min-[1280px]:px-0 min-[1280px]:py-20",
      )}
    >
      <h2
        className={cn(
          "font-b-serif mb-10 text-center text-[35px] leading-[39px] font-medium tracking-[-0.025em]",
          "min-[769px]:mb-14 min-[769px]:text-[48px] min-[769px]:leading-[55px]",
          "min-[1280px]:text-[60px]",
        )}
      >
        {FAQ_HEADING}
      </h2>

      <div className="mx-auto w-full max-w-[800px] rounded-[1.25rem] border-2 border-black/5 bg-white text-black">
        <div className="px-5 min-[769px]:px-6">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.value} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
