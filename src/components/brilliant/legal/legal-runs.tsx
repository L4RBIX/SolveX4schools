import { Fragment, type ReactNode } from "react";

import type { LegalRun } from "./legal-types";

/**
 * `#456dff` is `text.link` on the original. It is *not* `--color-b-blue`
 * (`#4a5cd6`), so it stays an arbitrary value rather than borrowing a token that
 * happens to be close (spec §2.4).
 *
 * There is deliberately no underline and no hover/focus/visited state here: no
 * rule in any of the three CSS bundles targets these anchors (spec §2.6, §13.2).
 */
const LINK_CLASS = "text-[#456dff]";

/**
 * Renders one inline run. Nesting order matches the original markup:
 * `<strong><em><a>…</a></em></strong>`.
 */
function renderRun(run: LegalRun, index: number): ReactNode {
  if (run.t === "br") {
    return <br key={index} />;
  }

  let node: ReactNode = run.text;

  if (run.href !== undefined) {
    node = (
      <a href={run.href} target={run.target} rel={run.rel} className={LINK_CLASS}>
        {node}
      </a>
    );
  }

  if (run.em === true) {
    node = <em>{node}</em>;
  }

  if (run.strong === true) {
    // `<strong>` is `font-weight: bolder`, which computes to 700 inside the
    // 400-weight body text. The `underline` class is on the <strong> in the
    // original, not on a wrapper.
    node = <strong className={run.underline === true ? "underline" : undefined}>{node}</strong>;
  }

  return <Fragment key={index}>{node}</Fragment>;
}

/** Renders a run array as inline children. */
export function LegalRuns({ runs }: { runs: readonly LegalRun[] }) {
  return <>{runs.map((run, index) => renderRun(run, index))}</>;
}
