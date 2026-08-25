"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Fragment } from "react";

import { AboutContainer } from "./container";
import { METHOD_ITEMS, type MethodSegment } from "./method-content";
import { SectionHeading } from "./section-heading";

const BODY_LINK_CLASS =
  "text-[#456dff] hover:underline hover:decoration-[#456dff] hover:decoration-2 hover:underline-offset-2 " +
  "active:underline active:decoration-[#456dff] active:decoration-2 active:underline-offset-2";

function Segment({ segment }: { segment: MethodSegment }) {
  if (segment.kind === "strong") {
    return <strong className="font-bold">{segment.text}</strong>;
  }
  if (segment.kind === "link") {
    return (
      <a
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
        className={BODY_LINK_CLASS}
      >
        {segment.text}
      </a>
    );
  }
  return <>{segment.text}</>;
}

function ChevronDown() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-6 shrink-0 text-b-ink transition-transform duration-200 group-data-[panel-open]/trigger:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * "Our method" — Base UI Accordion, single-open, everything closed on load and
 * every panel kept mounted. The height transition is driven by Base UI's
 * `--accordion-panel-height`; `data-starting-style` / `data-ending-style`
 * pin it to 0 at both ends of the 0.2s ease.
 *
 * The trigger carries `py-2.5 -my-2.5`: the negative margin cancels the extra
 * padding, so the row keeps the original's 24px rhythm while the touch target
 * measures a full 44px.
 */
export function OurMethod() {
  return (
    <section
      data-slot="section"
      className={
        "w-full px-6 py-16 " +
        "[background-image:linear-gradient(0deg,#fff8f6_0%,white_100%)] " +
        "min-[769px]:py-[108px] min-[769px]:[background-image:linear-gradient(90deg,white_0%,#fff8f6_100%)]"
      }
    >
      <AboutContainer>
        <div
          data-slot="flex"
          className="flex flex-col min-[769px]:flex-row"
        >
          <div data-slot="box" className="w-full min-[769px]:w-1/2">
            <SectionHeading>Our method</SectionHeading>
          </div>

          <div data-slot="box" className="w-full">
            <div
              data-slot="box"
              className="mx-auto w-full max-w-[800px] rounded-[20px] border-2 border-[rgba(0,0,0,0.04)] bg-b-white text-b-ink"
            >
              <Accordion.Root keepMounted className="w-full">
                <div className="px-5 min-[769px]:px-6">
                  {METHOD_ITEMS.map((item) => (
                    <Accordion.Item
                      key={item.value}
                      value={item.value}
                      className="border-t-2 border-[rgba(0,0,0,0.04)] px-0 py-6 first:border-t-0 min-[769px]:px-6"
                    >
                      <Accordion.Header>
                        <Accordion.Trigger className="group/trigger flex w-full cursor-pointer items-center border-none bg-none p-0 py-2.5 -my-2.5 text-left hover:bg-transparent">
                          <span className="flex-1 pr-5 text-[16px] leading-[1.5] font-bold text-b-ink">
                            {item.title}
                          </span>
                          <ChevronDown />
                        </Accordion.Trigger>
                      </Accordion.Header>

                      <Accordion.Panel
                        className={
                          "h-[var(--accordion-panel-height)] overflow-hidden " +
                          "transition-[height] duration-200 ease-[ease] " +
                          "data-[starting-style]:h-0 data-[ending-style]:h-0"
                        }
                      >
                        <div className="mt-4 mb-4 text-[rgba(0,0,0,0.6)]">
                          {item.paragraphs.map((paragraph, index) => (
                            <Fragment key={paragraph[0].text.slice(0, 40)}>
                              {index > 0 ? (
                                <>
                                  <br />
                                  <br />
                                </>
                              ) : null}
                              {paragraph.map((segment) => (
                                <Segment
                                  key={segment.text}
                                  segment={segment}
                                />
                              ))}
                            </Fragment>
                          ))}
                        </div>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </div>
              </Accordion.Root>
            </div>
          </div>
        </div>
      </AboutContainer>
    </section>
  );
}
