import { cn } from "@/lib/utils";

import type { LegalTocEntry } from "./legal-types";

/**
 * [D] The "Jump to..." sidebar (spec §7).
 *
 *   display: none; xl(992px+): display: block;
 *   min-width: 276px; margin-left: 32px;
 *
 * Interaction model: static, native `#hash` anchors only. There is no
 * scroll-spy, no IntersectionObserver, no `aria-current`, no active class, no
 * `position: sticky` and no `scroll-margin-top` anywhere on the original — the
 * sidebar simply scrolls away with the page. Below 992px there is no mobile ToC
 * of any kind: no drawer, no <details>, no select.
 *
 * Two quirks that are real and must not be "fixed":
 *   1. ToC labels are Title Case while the body headings are ALL CAPS.
 *   2. Entries 2 and 3 are `Site Content` then `Fees and Payment`, but the body
 *      has FEES AND PAYMENT. before SITE CONTENT.
 *
 * Known deviation: this project's globals.css sets `scroll-behavior: smooth` on
 * <html>, so our jumps animate where the original snaps. globals.css is
 * off-limits and no JS workaround is warranted (spec §7).
 */

/**
 * `& > li { margin-top: 16px }` applies to the *first* li too, so the list
 * starts 16px below the heading. The nested <ul> carries the same class, so its
 * items get the same 16px.
 */
const LIST_CLASS = "ms-0 list-none [&>li]:mt-4";

const LINK_CLASS = "text-[#456dff]";

/** body.base = 16px/1.5, body.sm = 14px/1.5. */
function styleClass(style: LegalTocEntry["style"]): string {
  return style === "body.sm" ? "text-[14px] leading-[1.5]" : "text-[16px] leading-[1.5]";
}

export function LegalToc({
  heading,
  entries,
}: {
  heading: string;
  entries: readonly LegalTocEntry[];
}) {
  return (
    <div className="ml-8 hidden min-w-[276px] min-[992px]:block">
      {/* heading.lg, and no margin-top. */}
      <h3 className="text-[24px] leading-[1.25] font-bold text-balance">{heading}</h3>

      <ul role="list" className={LIST_CLASS}>
        {entries.map((entry) => (
          <li key={entry.href}>
            <a href={entry.href} className={cn(LINK_CLASS, styleClass(entry.style))}>
              {entry.label}
            </a>

            {entry.children === undefined ? null : (
              <ul role="list" className={LIST_CLASS}>
                {entry.children.map((child) => (
                  <li key={child.href}>
                    <a href={child.href} className={cn(LINK_CLASS, styleClass(child.style))}>
                      {child.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
