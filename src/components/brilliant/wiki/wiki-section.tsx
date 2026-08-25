"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One `h2` section: the `div.anchor.skill-heading.collapsed` that carries the
 * anchor id, immediately followed by its `div#section-<id>.section.collapsed`.
 *
 *   .summary-container .skill-heading .section-header
 *       padding-bottom 0; margin 16px 0 8px; no bottom border
 *   .summary-container .skill-heading h2
 *       inline; CoFo Robert 500 / 24px / 1.3 (colour #333 from the h1..h6 base)
 *   .summary-container .section          margin-bottom 40px
 *   .section:not(#section-pre-header-section)  clear: both
 *   .anchor:before  content ''; block; height 61px; margin-top -61px; hidden
 *       — the scroll offset that clears the 60px fixed header
 *
 * Interaction (`app/wiki:expandOrCollapse`): clicking the section `<header>`
 * toggles the class `collapsed` on both divs. No loaded desktop stylesheet
 * declares a `.collapsed` rule, so this is deliberately invisible here — the
 * class only does work in the mobile bundle, which this URL never serves. It
 * is reproduced rather than dropped because it is the page's real behaviour;
 * no aria-expanded is emitted because nothing expands or collapses on desktop
 * and announcing a state that never changes would be a lie.
 */
export function WikiSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <>
      <div
        id={id}
        className={cn(
          "clear-both before:invisible before:-mt-[61px] before:block before:h-[61px] before:content-['']",
          collapsed && "collapsed",
        )}
      >
        <header
          className="mt-4 mb-2 border-b-0 pb-0"
          onClick={() => setCollapsed((value) => !value)}
        >
          <h2 className="inline font-b-serif text-[24px] leading-[1.3] font-medium text-[#333]">
            {title}
          </h2>
        </header>
      </div>
      <div
        id={`section-${id}`}
        className={cn("mb-10 clear-both", collapsed && "collapsed")}
      >
        <div>{children}</div>
      </div>
    </>
  );
}
