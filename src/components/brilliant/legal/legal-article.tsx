import { Fragment, type ReactNode } from "react";

import { LegalRuns } from "./legal-runs";
import type { LegalBlock } from "./legal-types";

/**
 * [C] The main article column.
 *
 *   flex-grow: 1; max-width: 100%; xl(992px+): max-width: 800px
 *
 * The whole column inherits `body.sm` (CoFo Brilliant 14px/1.5, weight 400) from
 * the two-column flex above it — there is no responsive typography anywhere on
 * this page, so no `md:text-…` steps exist here (spec §2.5).
 *
 * The entire vertical rhythm is two rules (spec §6.1):
 *   every <p> and every <ol> → margin-top: 16px
 *   every <h3> and every <h4> → margin-top: 48px
 *   the <h1> → no margin at all
 */

/** heading.2xl — 36px/1.25/700, identical at 320px and at 2560px. */
const H1_CLASS = "text-[36px] leading-[1.25] font-bold text-balance";
/** heading.lg — 24px/1.25/700. */
const H3_CLASS = "mt-12 text-[24px] leading-[1.25] font-bold text-balance";
/** heading.md — 20px/1.25/700. */
const H4_CLASS = "mt-12 text-[20px] leading-[1.25] font-bold text-balance";

function renderBlock(block: LegalBlock, index: number): ReactNode {
  const runs = block.runs ?? [];

  switch (block.tag) {
    case "h1":
      return (
        <Fragment key={index}>
          <h1 id={block.id} className={H1_CLASS}>
            <LegalRuns runs={runs} />
          </h1>
          {/* A stray `{" "}` sits after the h1 in the original markup. */}
          {" "}
        </Fragment>
      );

    case "h3":
      return (
        <h3 key={index} id={block.id} className={H3_CLASS}>
          <LegalRuns runs={runs} />
        </h3>
      );

    case "h4":
      return (
        <h4 key={index} id={block.id} className={H4_CLASS}>
          <LegalRuns runs={runs} />
        </h4>
      );

    case "ol":
      // No markers, no indent, no gap between items. The rule that would
      // restore `list-style-type: decimal; padding-left: 1.5rem` is scoped to
      // `.panda-lessonContent ol`, and that class is absent on this page — so
      // the live list really does render as flush-left stacked lines
      // (spec §2.6.1). Every <li> carries `class=""`.
      return (
        <ol key={index} role="list" className="mt-4 list-none">
          {(block.items ?? []).map((itemRuns, itemIndex) => (
            <li key={itemIndex}>
              <LegalRuns runs={itemRuns} />
            </li>
          ))}
        </ol>
      );

    case "p":
    default:
      return (
        <p key={index} id={block.id} className="mt-4">
          <LegalRuns runs={runs} />
        </p>
      );
  }
}

export function LegalArticle({ blocks }: { blocks: readonly LegalBlock[] }) {
  return (
    <div className="max-w-full grow min-[992px]:max-w-[800px]">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
