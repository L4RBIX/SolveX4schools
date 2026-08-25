import Link from "next/link";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

import {
  BrilliantWordmark,
  IconExternalArrow,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconTwitter,
} from "./legal-icons";
import type { LegalFooterContent, LegalFooterGroup, LegalFooterLink } from "./legal-types";

/**
 * [E] The footer (spec §8). Byte-for-byte identical to the footer on /privacy/.
 *
 * This is deliberately NOT `src/components/brilliant/footer.tsx`: that file is a
 * white footer with a different link set, different columns and a different
 * bottom bar. Per the spec's own instruction, a local copy lives here rather
 * than another agent's component being edited.
 *
 * Hover model: instant. `:hover` swaps `border-bottom-color` to #456dff (links)
 * or `color` to #456dff (social icons). **No transition is declared in the
 * original**, so none is added here (spec §12).
 */

/** Shared by every hover-underlined footer link. */
const UNDERLINE_ON_HOVER =
  "relative border-b-2 border-transparent hover:border-b-[#456dff]";

const SOCIAL_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Brilliant on Facebook": IconFacebook,
  "Brilliant on Instagram": IconInstagram,
  "Brilliant on Twitter": IconTwitter,
  "Brilliant on LinkedIn": IconLinkedIn,
};

/** One label + its stack of links. `body.base` label in #999999, white links. */
function FooterGroup({ group }: { group: LegalFooterGroup }) {
  return (
    <div>
      <p className="mb-4 text-[16px] leading-[1.5] text-[#999999]">{group.label}</p>
      <div className="flex flex-col gap-3">
        {group.links.map(([label, href]) => (
          <a key={label} href={href} className={cn("text-b-white", UNDERLINE_ON_HOVER)}>
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function SocialRow({ social }: { social: readonly LegalFooterLink[] }) {
  return (
    <div className="flex items-center gap-6">
      {social.map(([label, href]) => {
        const Icon = SOCIAL_ICONS[label];
        return (
          <a
            key={label}
            href={href}
            aria-label={label}
            target="_blank"
            className="text-[#999999] hover:text-[#456dff]"
          >
            <Icon className="shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

/**
 * The legal cluster. Item 2 is a real `<button type="button">` whose click
 * handler lives in a JS chunk that was never retrieved, and no consent-modal
 * markup exists anywhere in the server-rendered HTML — so it is rendered with
 * its exact label and styling and **no action** (spec §13.1). Nothing is
 * invented in its place: no modal, no toast, no link target.
 */
function LegalRow({ items }: { items: LegalFooterContent["legalRow"] }) {
  return (
    <div className="flex flex-col items-center gap-3 min-[769px]:flex-row min-[769px]:gap-4">
      {items.map(([label, href], index) => {
        const isPrivacyPolicy = index === 3;
        const base = cn(
          "text-left text-[12px] leading-[1.5]",
          UNDERLINE_ON_HOVER,
          isPrivacyPolicy ? "text-b-white" : "text-[#999999]",
        );

        return (
          <div
            key={label}
            className="flex w-full justify-start min-[769px]:w-auto"
          >
            {href === null ? (
              <button type="button" className={cn(base, "cursor-pointer bg-transparent")}>
                {label}
              </button>
            ) : (
              <a
                href={href}
                className={cn(
                  base,
                  isPrivacyPolicy &&
                    "inline-flex items-center justify-start gap-1.5 whitespace-nowrap",
                )}
              >
                {label}
                {isPrivacyPolicy ? <IconExternalArrow className="shrink-0" /> : null}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LegalFooter({ content }: { content: LegalFooterContent }) {
  const [product, solutions, company, behindTheScenes] = content.groups;

  return (
    <div className="flex w-full justify-center bg-b-ink pt-20">
      <div className="mx-6 w-full max-w-full min-[360px]:max-w-[432px] min-[769px]:mx-10 min-[769px]:max-w-[1216px] min-[1280px]:mx-8">
        {/* 8.1 top row */}
        <div className="mb-20 flex w-full flex-col items-start justify-between gap-0 min-[769px]:mb-32 min-[1280px]:flex-row">
          <Link
            href="/"
            className="mb-12 w-[40%] text-b-white min-[1280px]:mb-0 min-[1280px]:w-[25%]"
          >
            <BrilliantWordmark className="block h-8 shrink-0" />
          </Link>

          <div className="grid max-w-full flex-1 grid-cols-1 items-start gap-x-8 gap-y-12 min-[481px]:w-[576px] min-[769px]:w-full min-[769px]:grid-cols-[repeat(4,140px)] min-[1280px]:grid-cols-5 min-[1280px]:gap-y-0">
            <FooterGroup group={product} />
            <FooterGroup group={solutions} />
            {/* The original wraps these two groups in a vstack apiece, even
                though each holds a single group. Reproduced as measured. */}
            <div className="flex flex-col gap-6">
              <FooterGroup group={company} />
            </div>
            <div className="flex flex-col gap-6">
              <FooterGroup group={behindTheScenes} />
            </div>
            <SocialRow social={content.social} />
          </div>
        </div>

        {/* 8.2 bottom row — its margin-bottom is the footer's bottom padding. */}
        <div className="mb-12 flex w-full flex-col justify-between gap-8 min-[992px]:mb-20 min-[1280px]:flex-row">
          <LegalRow items={content.legalRow} />
          <p className="text-[12px] leading-[1.5] break-words text-[#999999] min-[1280px]:w-1/2">
            {content.copyright}
          </p>
        </div>
      </div>
    </div>
  );
}
