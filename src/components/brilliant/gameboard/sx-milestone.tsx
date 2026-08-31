"use client";

import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { SxPedestal, SxReviewPedestal, type PedestalState } from "./sx-pedestal";
import { GameboardNova } from "./gameboard-nova";
import type { GameboardNode } from "./course-data";

/**
 * One milestone on the board: pedestal, mascot, label.
 *
 * ## Row geometry, and the one place it deliberately departs
 *
 * The reference row is 392px wide holding a 274px button (128 pedestal + 8 gap
 * + 138 label), so the zig-zag swings ±59px either side of centre.
 *
 * A 138px label is a fine box for "Debugging Functions". It is not a fine box
 * for "Разобранный пример: прочитать, преобразовать, посчитать", which is 54
 * characters and would be cut off by the reference's own 3-line clamp. The
 * brief is explicit that the label may be widened for RU/KK as long as the
 * rhythm survives — so the label grows to 168px AND the row grows to 422px,
 * which puts the swing back at exactly ±59px:
 *
 *   reference   (392 − 274) / 2 = 59px
 *   ours        (422 − 304) / 2 = 59px
 *
 * The amplitude is the thing the eye reads as "the path", so it is the thing
 * held fixed. Row height stays 134px because the label box is a fixed 55px
 * whatever the text does — which is also why a three-line title cannot push
 * the board's vertical rhythm around.
 */

export const ROW_W = 422;
export const LABEL_W = 168;
export const BUTTON_W = 128 + 8 + LABEL_W;

/** The node model's flags, resolved to one pedestal state. */
export function pedestalStateOf(node: GameboardNode): PedestalState {
  if (node.locked) return "future";
  if (node.done) return "complete";
  if (node.active) return "active";
  return "available";
}

export interface SxMilestoneProps {
  node: GameboardNode;
  selected: boolean;
  onSelect: () => void;
  /** Changing this replays Nova's arrival — pass the current node's title. */
  arrivalKey?: string | number;
  labels: { done: string };
}

export function SxMilestone({
  node,
  selected,
  onSelect,
  arrivalKey,
  labels,
}: SxMilestoneProps) {
  const reduce = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const state = pedestalStateOf(node);
  const release = () => setPressed(false);

  return (
    <div
      data-node={node.title}
      data-state={state}
      className="relative flex w-full"
      style={{ maxWidth: ROW_W, justifyContent: node.side }}
    >
      <button
        type="button"
        onClick={node.locked ? undefined : onSelect}
        /* `aria-disabled` rather than `disabled`: a disabled button drops out
           of the tab order entirely, so a keyboard learner cannot even reach
           the node to discover that it is not ready yet. This keeps it
           focusable and announced, and the handler is simply not wired. */
        aria-disabled={node.locked || undefined}
        aria-pressed={selected}
        aria-current={node.active ? "step" : undefined}
        /* The reference's nodes are bare `<div role="group">` with an onClick —
           not focusable, not announced, not operable from a keyboard. That is a
           defect, not a spec, and it is not reproduced: a real button costs
           nothing visually and makes the board usable without a mouse. */
        className={cn(
          "group flex items-end gap-2 text-left",
          node.locked ? "cursor-default" : "cursor-pointer",
        )}
        style={{ width: BUTTON_W }}
        onPointerDown={reduce || node.locked ? undefined : () => setPressed(true)}
        onPointerUp={reduce ? undefined : release}
        onPointerLeave={reduce ? undefined : release}
        onPointerCancel={reduce ? undefined : release}
      >
        <span
          className="relative block h-[134px] w-32 shrink-0 origin-bottom will-change-transform"
          style={{
            transform: pressed ? "scale(0.96) translateY(1px)" : "none",
            transition: reduce
              ? undefined
              : pressed
                ? "transform 90ms cubic-bezier(0.4, 0, 1, 1)"
                : "transform 520ms var(--ease-b-spring)",
          }}
        >
          {node.review ? (
            <SxReviewPedestal state={state} selected={selected} />
          ) : (
            <SxPedestal state={state} selected={selected} />
          )}

          {node.active ? <GameboardNova state="idle" arrivalKey={arrivalKey} /> : null}
        </span>

        {/*
          Fixed 55px so a three-line title cannot change the row's height, and
          `line-clamp-3` so it cannot change it by growing either. The reference
          uses exactly this pair.
        */}
        <span
          data-label
          className="flex h-[55px] items-center pb-[29.5px]"
          style={{ width: LABEL_W }}
        >
          <span
            className={cn(
              /* The reference gives every unselected node the same tertiary
                 grey and only lifts the selected one to full white. It does
                 NOT colour-code completed vs locked vs available — the disc
                 carries that, the text does not. Reproduced, because four
                 shades of grey in a column is noise. */
              "line-clamp-3 transition-colors",
              selected || node.active
                ? "text-b-fg"
                : "text-b-fg/40 group-hover:text-b-fg/60",
              node.locked && "text-b-fg/25 group-hover:text-b-fg/25",
            )}
          >
            {node.title}
          </span>
          {node.done ? <DoneMark label={labels.done} /> : null}
        </span>
      </button>
    </div>
  );
}

/**
 * The completion mark.
 *
 * The reference marks completion on the pedestal — a finished node's disc turns
 * purple — and puts nothing at all beside the label. That is reproduced by
 * `SxPedestal`, so this is a small addition rather than the whole signal: a
 * purple disc alone does not survive a colour-vision difference, and the board
 * is the learner's record of a school year. It is 14px and sits at the label's
 * end so it never competes with the disc.
 */
function DoneMark({ label }: { label: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={label}
      className="ml-1.5 shrink-0 self-center text-b-green"
    >
      <path
        d="M4 12.5l5 5L20 6.5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
