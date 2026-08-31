import type { ReactNode } from "react";

/**
 * `blockquote.definition` / `blockquote.example` inside `.wiki-content`.
 *
 * Resolved box: padding 16px; background #f7f7f7; border 1px solid #d4d4d4;
 * box-shadow 0 0 0 1px #f3f3f3; margin-bottom 20px; overflow hidden.
 *
 * The label is a CSS `::before` on the original
 * (`.definition:before { content: 'Definition' }`): block, margin-bottom 10px,
 * 9px / 500 / 1.2em, #919191, uppercase, letter-spacing .6px. It is emitted as
 * a real element here so assistive tech reads it too.
 */
export function Callout({
  label,
  children,
}: {
  label: "Definition" | "Example";
  children: ReactNode;
}) {
  return (
    <blockquote className="mb-5 overflow-hidden border border-[#d4d4d4] bg-[#f7f7f7] p-4 shadow-[0_0_0_1px_#f3f3f3]">
      <span className="mb-[10px] block text-[9px] leading-[1.2em] font-medium tracking-[0.6px] text-[#919191] uppercase">
        {label}
      </span>
      {children}
    </blockquote>
  );
}
