import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Article-body primitives. Every value is a declared rule from
 * brilliant_desktop.css / wiki.css:
 *
 *   .summary-container p            margin-bottom: 20px  (last-child 0)
 *   hr                              margin: 20px 0; border: 0;
 *                                   border-top: 1px solid #bbb;
 *                                   border-bottom: 1px solid #fff
 *   .summary-container ol, ul       margin: 20px 24px
 *   .summary-container li           margin-bottom: 6px
 *   li                              line-height: 1.6em
 *   body.wiki-page a                colour #456DFF, hover #1245ff
 *   h3                              15px / 400 / 1.5em / #161616
 */

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-5 last:mb-0", className)}>{children}</p>;
}

export function Rule() {
  return <hr className="my-5 border-x-0 border-t border-t-[#bbb] border-b border-b-[#fff]" />;
}

export function WikiLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#456DFF] transition-colors hover:text-[#1245ff]"
    >
      {children}
    </a>
  );
}

/** `<h3>` inside a `blockquote.example` — the problem statement. */
export function ProblemStatement({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-[0.25em] font-b-sans text-[15px] leading-[1.5em] font-normal text-[#161616]">
      {children}
    </h3>
  );
}

export function ArticleList({ children }: { children: ReactNode }) {
  return <ul className="mx-6 my-5 list-disc p-0">{children}</ul>;
}

export function ArticleListItem({ children }: { children: ReactNode }) {
  return <li className="mb-1.5 leading-[1.6em] last:mb-1.5">{children}</li>;
}
