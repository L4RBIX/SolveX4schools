"use client";

import { Accordion } from "@base-ui/react/accordion";

import { FAQ_GROUPS, type FaqGroup } from "./faq-data";
import { ChevronDown } from "./icons";

/**
 * Section 2. Three *independent* accordion roots, one per group, each
 * `multiple={false}` — opening a question in "About our courses" leaves
 * "About Brilliant" alone, but within a card opening B closes A.
 *
 * Panels are `keepMounted` and animate `height` from 0 to the measured content
 * height over 200ms `ease`, driven by Base UI's `--accordion-panel-height`
 * plus the `data-starting-style` / `data-ending-style` hooks — exactly the
 * mechanism the original ships. The chevron rotates 180deg over the same 200ms.
 * Both are CSS transitions, so the project's `prefers-reduced-motion` block in
 * globals.css collapses them for users who ask for that.
 */

/** border.secondary — rgba(0,0,0,.05). No project token carries this value. */
const HAIRLINE = "border-[rgba(0,0,0,0.05)]";

export function FaqSection() {
  return (
    <section
      data-slot="vstack"
      className="flex w-full flex-col items-center gap-10 px-5 py-12 min-[769px]:gap-16 min-[769px]:py-20"
    >
      <h2 className="text-center font-b-serif text-[30px] leading-[1.1] font-medium tracking-normal text-b-ink min-[769px]:text-[36px] min-[769px]:tracking-[-0.36px]">
        Frequently asked questions
      </h2>

      {FAQ_GROUPS.map((group) => (
        <FaqCard key={group.title} group={group} />
      ))}
    </section>
  );
}

function FaqCard({ group }: { group: FaqGroup }) {
  return (
    <div
      className={`mx-auto w-full max-w-[800px] rounded-[20px] border-2 bg-b-white text-b-ink ${HAIRLINE}`}
    >
      <Accordion.Root multiple={false} keepMounted>
        <h3
          className={`border-b-2 px-6 py-9 text-[16px] leading-[1.4] font-bold min-[769px]:px-12 min-[769px]:text-[20px] min-[769px]:leading-[1.25] ${HAIRLINE}`}
        >
          {group.title}
        </h3>

        <div className="px-5 min-[769px]:px-6">
          {group.items.map((item) => (
            <Accordion.Item
              key={item.value}
              value={item.value}
              className={`border-t-2 py-6 first:border-t-0 min-[769px]:px-6 ${HAIRLINE}`}
            >
              <Accordion.Header>
                <Accordion.Trigger className="group/trigger flex w-full cursor-pointer items-center border-none bg-none p-0 text-left hover:bg-none">
                  <span className="flex-1 pr-5 text-[16px] leading-[1.5] font-bold text-b-ink">
                    {item.question}
                  </span>
                  <ChevronDown className="w-6 shrink-0 text-b-ink transition-transform duration-200 group-data-[panel-open]/trigger:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] data-[ending-style]:h-0 data-[starting-style]:h-0">
                <div
                  className="my-4 text-[16px] leading-[1.5] text-[rgba(0,0,0,0.6)] [&_a]:text-inherit [&_a]:underline [&_li]:list-item [&_ul]:mt-1 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                  // Static constants transcribed verbatim from the extracted
                  // page; the inline anchors and lists are part of the copy.
                  dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </div>
      </Accordion.Root>
    </div>
  );
}
