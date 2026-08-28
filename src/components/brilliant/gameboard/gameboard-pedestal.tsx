"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRive } from "@rive-app/react-canvas";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { NovaAvatar } from "@/components/nova/nova-avatar";

/**
 * One stop on the course gameboard.
 *
 * The original renders the same node two different ways, and copying that is
 * what keeps a 48-node page cheap: every locked node is a **static SVG**, and
 * only the active node — plus whichever node the learner has clicked — is
 * swapped for a live **Rive canvas**. Clicking a node literally replaces its
 * `<svg>` with a `<canvas>` in the live DOM; that was verified, not guessed.
 *
 * Measured geometry: the pedestal is 128x134 CSS px drawn on a `0 0 186 195`
 * viewBox, the canvas backs it at 256x268 (DPR 2), and the node row is
 * `align-items: flex-end; gap: 8px` with a 138px label column.
 *
 * The Rive state machine is `node_all` on artboard `Gameboard Node`. Its input
 * names below are enumerated from the file, not invented:
 *   booleans  padlock, select, hover, completed, start_idle, level,
 *             premium_node, dark-mode, cursor_down, meter_locked
 *   numbers   icon, color, premium_color
 *   triggers  koji_appear, koji_disappear, koji_enter_lesson,
 *             koji_exit_lesson, koji_appear_enter
 */

const GAMEBOARD_RIV =
  "/assets/original/brilliant/brilliant.org/rive/koji-gameboard.e2320c48.riv";

const ARTBOARD = "Gameboard Node";
const STATE_MACHINE = "node_all";

export interface GameboardPedestalProps {
  /** Renders the live Rive node instead of the static SVG. */
  animated?: boolean;
  selected?: boolean;
  /** The learner's current node — Koji stands on it. */
  active?: boolean;
  /** A level's closing node: a cog-shaped medal on its own 120x117 viewBox. */
  review?: boolean;
  className?: string;
  /**
   * Render the product's own active node instead of the reference's Rive one.
   *
   * Two reasons, and either alone would be enough:
   *
   * 1. The Rive scene puts **Koji** on the learner's current node. Koji is
   *    Brilliant's character and this product has Nova.
   * 2. `koji-gameboard.riv` is Brilliant's file. See docs/THIRD_PARTY_ASSETS.md.
   *
   * Default off, so /brilliant/app/course keeps the measured behaviour it was
   * reverse-engineered against.
   */
  ownMascot?: boolean;
}

export function GameboardPedestal({
  animated,
  selected,
  active,
  review,
  className,
  ownMascot,
}: GameboardPedestalProps) {
  if (animated && ownMascot) {
    return <SolveXPedestal selected={selected} active={active} className={className} />;
  }
  if (animated) {
    return <RivePedestal selected={selected} active={active} className={className} />;
  }
  if (review) return <ReviewPedestal className={className} />;
  return <LockedPedestal className={className} />;
}

/**
 * The product's active node.
 *
 * The reference's own active pedestal is lit from beneath with a purple glow;
 * that reading is kept, because it is what tells a learner at a glance where
 * they are on a board of forty-eight identical discs. What changes is who
 * stands on it. Nova is lazy-loaded by `NovaAvatar`, so a board that scrolls
 * past thirty locked nodes still paints immediately.
 */
/**
 * The product's milestone node.
 *
 * ## What the reference actually does, and what is reused
 *
 * The reference drives one Rive state machine (`node_all`) whose inputs are
 * enumerated at the top of this file. Three of them are the whole interaction:
 *
 *   cursor_down   pointer held → the node compresses
 *   select        chosen       → a glow appears and stays
 *   completed     done         → a success state
 *
 * We cannot ship that file (it is Brilliant's, and it puts Koji on the node),
 * so the mechanism is reproduced rather than approximated:
 *
 * - **The spring is the reference's own curve.** `--ease-b-spring` in
 *   globals.css is a `linear()` sampled verbatim from the live player's
 *   `transition` declaration — it overshoots to 1.027 at 54% and settles. An
 *   ease-out substitute reads visibly wrong, which is why it was sampled in the
 *   first place.
 * - **The glow comes from BELOW.** The reference's own static active pedestal
 *   paints `#9D62FF` as a linear gradient running from full opacity at the
 *   bottom of the disc to transparent at the top — light from underneath, not a
 *   ring around the outside. That reading is what `box-shadow: 0 0 20px purple`
 *   gets wrong, so it is not what this does: there is a wide, soft elliptical
 *   pool under the node and a tighter core just beneath its base.
 *
 * ## Press physics
 *
 * Pointer down compresses fast (90ms, ease-out) because a press must feel
 * immediate. Release runs the spring over 520ms. `pointerleave` and
 * `pointercancel` both release, so dragging off a node does not leave it stuck
 * compressed — the single most common bug in hand-written press states.
 *
 * ## Reduced motion
 *
 * No compression and no spring. The glow still appears, at full strength and
 * without a transition: the brief is explicit that a learner who reduces motion
 * must still be able to see which node is selected.
 */
function SolveXPedestal({
  selected,
  active,
  className,
}: {
  selected?: boolean;
  active?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  /* `active` is the learner's current node and is always lit. `selected` is a
     node they tapped to inspect; it lights too, a little less, so the two are
     distinguishable when they are different nodes. */
  const strength = active ? 1 : selected ? 0.72 : 0;

  const release = () => setPressed(false);

  return (
    <div
      className={cn("relative h-[134px] w-32 shrink-0", className)}
      onPointerDown={reduce ? undefined : () => setPressed(true)}
      onPointerUp={reduce ? undefined : release}
      onPointerLeave={reduce ? undefined : release}
      onPointerCancel={reduce ? undefined : release}
    >
      {/* ---- the pool: wide, soft, and under the node -------------------- */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-1/2 h-16 w-[150px] -translate-x-1/2 rounded-[50%] blur-2xl transition-opacity duration-300 ease-out motion-reduce:transition-none"
        style={{
          opacity: strength * 0.55,
          background:
            "radial-gradient(closest-side, var(--color-b-purple), transparent 72%)",
        }}
      />
      {/* ---- the core: tight, just beneath the disc's base ---------------- */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 left-1/2 h-8 w-[92px] -translate-x-1/2 rounded-[50%] blur-md transition-opacity duration-300 ease-out motion-reduce:transition-none"
        style={{
          opacity: strength * 0.75,
          background:
            "radial-gradient(closest-side, var(--color-b-purple), transparent 78%)",
        }}
      />

      {/* ---- the node ---------------------------------------------------- */}
      <div
        className="relative origin-bottom will-change-transform"
        style={{
          transform: pressed ? "scale(0.94)" : "scale(1)",
          transition: reduce
            ? "none"
            : pressed
              ? "transform 90ms cubic-bezier(0.4, 0, 1, 1)"
              : "transform 520ms var(--ease-b-spring)",
        }}
      >
        <LockedPedestal />

        {/*
          The disc itself, tinted from below.

          This is the reference's own device: its active pedestal paints
          `#9D62FF` as a gradient running from full at the bottom edge of the
          disc to transparent above it, so the stone reads as lit from
          underneath rather than outlined. `mix-blend-mode: color` keeps the
          disc's own shading and moves only its hue, which is why the highlight
          and the rim shadow survive instead of being flooded over.

          Clipped to the disc's ellipse — `LockedPedestal` draws a 128×134 SVG
          whose stone occupies roughly the lower half of the box.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out motion-reduce:transition-none"
          style={{
            opacity: strength,
            mixBlendMode: "color",
            /*
              Clipped to the stone, not to the element box.

              `mix-blend-mode: color` keeps the BACKDROP's luminosity and takes
              the source's hue — so wherever this layer overlaps the near-black
              page instead of the grey disc, it produces dark violet and the
              element's own rectangle becomes visible. Fading the gradient out
              before the edge is not enough; the fix is to make the layer the
              shape of the thing it is tinting.

              The ellipse is the disc's outer rim measured off `LockedPedestal`:
              its stone spans roughly x 25…160 and y 95…175 of the 186×195
              viewBox, which is `38% 21% at 50% 69%` of the rendered 128×134 box.
            */
            clipPath: "ellipse(38% 21% at 50% 69%)",
            background:
              "radial-gradient(70% 80% at 50% 95%, var(--color-b-purple) 0%, var(--color-b-purple) 35%, transparent 100%)",
          }}
        />

        {active ? (
          <span className="absolute inset-x-0 top-1 flex justify-center">
            <NovaAvatar state="idle" size={46} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The node that closes a level. The original swaps the disc for a cog-edged
 * medal drawn on a different viewBox entirely — `0 0 120 117` against the
 * regular node's `0 0 186 195` — so it cannot be a recolour of the disc.
 */
function ReviewPedestal({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width="128"
      height="134"
      viewBox="0 0 120 117"
      fill="none"
      aria-hidden="true"
      className={cn(
        "shrink-0 transition-[filter] duration-150 group-hover:brightness-90",
        className,
      )}
    >
      <path d="M92.961 59.1426L89.8008 56.8008H59.9688H30.2031L27.0401 59.1426C25.0982 60.5645 23.7338 62.6389 23.1983 64.9853L21.9932 70.2656C21.7896 70.9181 21.387 71.545 20.8037 72.1162L15.7061 77.1074C13.9156 78.8609 13.9158 81.0375 15.7061 82.791L20.8037 87.7832C21.387 88.3543 21.7896 88.9813 21.9932 89.6338L24.0283 96.1572C24.7542 98.4842 27.9357 100.297 31.9756 100.686L42.6758 101.715C44.1837 101.86 45.6111 102.209 46.8409 102.733L54.2774 105.903C55.9369 106.611 58.0045 106.974 59.9688 106.995V106.997C59.9792 106.997 59.9896 106.996 60 106.996C60.0106 106.996 60.0217 106.997 60.0323 106.997V106.995C61.9962 106.974 64.0634 106.611 65.7227 105.903L73.1592 102.733C74.389 102.209 75.8163 101.86 77.3242 101.715L88.0254 100.686C92.0651 100.297 95.2459 98.4841 95.9717 96.1572L98.0069 89.6338C98.2104 88.9813 98.6131 88.3543 99.1963 87.7832L104.294 82.791C106.084 81.0375 106.085 78.8609 104.294 77.1074L99.1963 72.1162C98.6131 71.545 98.2104 70.9181 98.0069 70.2656L96.8018 64.9853C96.2663 62.639 94.9026 60.5645 92.961 59.1426Z" fill="#999999" />
      <g opacity="0.2">
        <path d="M47.8721 90.21L44.2373 101.953C43.7199 101.849 43.1865 101.77 42.6426 101.718L31.9414 100.688C29.7467 100.476 27.8067 99.8433 26.375 98.9375L31.6377 88.0586L47.8721 90.21Z" fill="white" />
        <path d="M93.627 98.9385C92.1954 99.8436 90.2563 100.476 88.0625 100.688L77.3613 101.718C76.8164 101.77 76.282 101.849 75.7637 101.953L72.1299 90.21L88.3643 88.0586L93.627 98.9385Z" fill="white" />
      </g>
      <path d="M89.7969 56.7994L93.1452 66.5535L101.139 74.0011L93.1452 81.4487L89.7969 91.2029L72.9008 92.9812L60 98.3281L47.0992 92.9812L30.2031 91.2029L26.8548 81.4487L18.8609 74.0011L26.8548 66.5535L30.2031 56.7994L47.0992 55.021L60 49.6742L72.9008 55.021L89.7969 56.7994Z" fill="#E5E5E5" />
      <mask id={`${id}-r0`} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="18" y="49" width="84" height="50">
        <path d="M89.7969 56.7994L93.1452 66.5535L101.139 74.0011L93.1452 81.4487L89.7969 91.2029L72.9008 92.9812L60 98.3281L47.0992 92.9812L30.2031 91.2029L26.8548 81.4487L18.8609 74.0011L26.8548 66.5535L30.2031 56.7994L47.0992 55.021L60 49.6742L72.9008 55.021L89.7969 56.7994Z" fill="#E5E5E5" />
      </mask>
      <g mask={`url(#${id}-r0)`}>
        <path d="M33.8371 89.5563C48.2864 98.1479 71.7136 98.1479 86.163 89.5563C100.612 80.9648 100.612 67.0352 86.163 58.4437C71.7136 49.8521 48.2864 49.8521 33.8371 58.4437C19.3877 67.0352 19.3877 80.9648 33.8371 89.5563Z" fill="#E5E5E5" />
        <path d="M38.7868 61.9792C50.5025 55.3403 69.4975 55.3403 81.2132 61.9792C92.9289 68.6181 92.9289 79.3819 81.2132 86.0208C69.4975 92.6597 50.5025 92.6597 38.7868 86.0208C27.0711 79.3819 27.0711 68.6181 38.7868 61.9792Z" fill="white" />
        <mask id={`${id}-r1`} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="23" y="52" width="74" height="44">
          <path d="M33.8371 89.5563C48.2864 98.1479 71.7136 98.1479 86.163 89.5563C100.612 80.9648 100.612 67.0352 86.163 58.4437C71.7136 49.8521 48.2864 49.8521 33.8371 58.4437C19.3877 67.0352 19.3877 80.9648 33.8371 89.5563Z" fill="#E5E5E5" />
        </mask>
        <g mask={`url(#${id}-r1)`}>
          <path d="M58 52.0312C49.2081 52.3125 40.5527 54.4483 33.8369 58.4414C19.3876 67.0329 19.3876 80.9632 33.8369 89.5547C40.5527 93.5479 49.2081 95.6826 58 95.9639V86.9463C52.797 86.6911 47.7181 85.441 43.7363 83.1904C34.7545 78.1136 34.7545 69.8825 43.7363 64.8057C47.7182 62.5551 52.797 61.304 58 61.0488V52.0312Z" fill="#CCCCCC" />
        </g>
        <path d="M62 52.0312C70.7919 52.3125 79.4473 54.4483 86.1631 58.4414C100.612 67.0329 100.612 80.9632 86.1631 89.5547C79.4473 93.5479 70.7919 95.6826 62 95.9639V86.9463C67.203 86.6911 72.2819 85.441 76.2637 83.1904C85.2455 78.1136 85.2455 69.8825 76.2637 64.8057C72.2818 62.5551 67.203 61.304 62 61.0488V52.0312Z" fill="#CCCCCC" />
        <path d="M76.2635 83.1924C67.2814 88.2692 52.7186 88.2692 43.7365 83.1924C34.7545 78.1156 34.7545 69.8844 43.7365 64.8076C52.7186 59.7308 67.2814 59.7308 76.2635 64.8076C85.2455 69.8844 85.2455 78.1156 76.2635 83.1924Z" fill="#E5E5E5" />
      </g>
      <path d="M86.1631 58.4434C71.7137 49.8519 48.2863 49.8519 33.8369 58.4434C19.3875 67.0349 19.3875 80.9651 33.8369 89.5566C48.2863 98.1482 71.7137 98.1482 86.1631 89.5566C100.612 80.9651 100.612 67.0349 86.1631 58.4434ZM38.7871 61.9795C50.5028 55.3407 69.4972 55.3407 81.2129 61.9795C92.9286 68.6184 92.9286 79.3816 81.2129 86.0205C69.4972 92.6594 50.5028 92.6594 38.7871 86.0205C27.0714 79.3816 27.0714 68.6184 38.7871 61.9795Z" fill="#E5E5E5" />
    </svg>
  );
}

/** The cheap variant: no canvas, no runtime, just the shipped artwork. */
function LockedPedestal({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width="128"
      height="134"
      viewBox="0 0 186 195"
      fill="none"
      aria-hidden="true"
      className={cn(
        "shrink-0 transition-[filter] duration-150 group-hover:brightness-90",
        className,
      )}
    >
      <path d="M131.025 149.242C109.966 161.892 75.8224 161.891 54.7634 149.242C33.704 136.592 33.704 116.083 54.7634 103.434C75.8224 90.7845 109.966 90.7844 131.025 103.434C152.084 116.084 152.084 136.592 131.025 149.242ZM140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5383 114.119 91.5383 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="black" />
      <path d="M140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5382 114.119 91.5382 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="#999999" />
      <path d="M54.7632 149.242C75.8222 161.892 109.966 161.892 131.025 149.242C152.084 136.593 152.084 116.084 131.025 103.435C109.966 90.785 75.8222 90.7852 54.7632 103.435C33.7039 116.084 33.7039 136.593 54.7632 149.242Z" fill="#999999" />
      <path d="M54.7632 149.242C75.8222 161.892 109.966 161.892 131.025 149.242C152.084 136.593 152.084 116.084 131.025 103.435C109.966 90.785 75.8222 90.7852 54.7632 103.435C33.7039 116.084 33.7039 136.593 54.7632 149.242Z" fill="white" fillOpacity="0.74902" />
      <path d="M140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5382 114.119 91.5382 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="#999999" />
      <mask id={`${id}-m0`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="25" y="95" width="135" height="80">
        <path d="M140.3 163.282C114.118 178.805 71.6697 178.805 45.4882 163.282C19.3067 147.757 19.3067 122.588 45.4882 107.063C71.6697 91.5386 114.118 91.5386 140.3 107.063C166.481 122.588 166.481 147.757 140.3 163.282Z" fill="white" />
      </mask>
      <g mask={`url(#${id}-m0)`}>
        <path d="M92.8941 88.0577L162.851 182.286H22.937L92.8941 88.0577Z" fill="white" fillOpacity="0.2" />
      </g>
      <mask id={`${id}-m1`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="38" y="93" width="109" height="66">
        <path d="M131.025 149.242C109.966 161.892 75.8223 161.892 54.7633 149.242C33.7041 136.592 33.7041 116.084 54.7633 103.434C75.8223 90.785 109.966 90.785 131.025 103.434C152.084 116.084 152.084 136.592 131.025 149.242Z" fill="white" />
      </mask>
      <g mask={`url(#${id}-m1)`}>
        <path d="M25.5834 93.5382H159.852V159.046H25.5834V93.5382Z" fill="#999999" />
        <path d="M25.5834 93.5382H159.852V159.046H25.5834V93.5382Z" fill="white" fillOpacity="0.74902" />
      </g>
      <path d="M61.9771 108.64C79.052 98.866 106.736 98.866 123.811 108.64C140.886 118.414 140.886 134.262 123.811 144.037C106.736 153.811 79.052 153.811 61.9771 144.037C44.9022 134.262 44.9022 118.414 61.9771 108.64Z" fill="white" />
      <mask id={`${id}-m2`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="49" y="101" width="88" height="51">
        <path d="M61.9772 108.64C79.0521 98.865 106.736 98.865 123.811 108.64C140.886 118.414 140.886 134.262 123.811 144.036C106.736 153.811 79.0521 153.811 61.9772 144.036C44.9023 134.262 44.9023 118.414 61.9772 108.64Z" fill="white" />
      </mask>
      <g mask={`url(#${id}-m2)`}>
        <path d="M46.092 101.071H89.8596V151.604H46.092V101.071Z" fill="#999999" />
        <path d="M46.092 101.071H89.8596V151.604H46.092V101.071Z" fill="white" fillOpacity="0.74902" />
        <path d="M89.6631 101.071H137.031V151.604H89.6631V101.071ZM116.57 139.901C103.396 147.376 82.0377 147.376 68.8642 139.901C55.6908 132.427 55.6908 120.308 68.8642 112.833C82.0377 105.359 103.396 105.359 116.57 112.833C129.743 120.308 129.743 132.427 116.57 139.901Z" fill="#999999" />
        <path d="M89.6631 101.071H137.031V151.604H89.6631V101.071ZM116.57 139.901C103.396 147.376 82.0377 147.376 68.8642 139.901C55.6908 132.427 55.6908 120.308 68.8642 112.833C82.0377 105.359 103.396 105.359 116.57 112.833C129.743 120.308 129.743 132.427 116.57 139.901Z" fill="white" fillOpacity="0.74902" />
        <path d="M89.6631 101.071H137.031V151.604H89.6631V101.071ZM116.57 139.901C103.396 147.376 82.0377 147.376 68.8642 139.901C55.6908 132.427 55.6908 120.308 68.8642 112.833C82.0377 105.359 103.396 105.359 116.57 112.833C129.743 120.308 129.743 132.427 116.57 139.901Z" fill="#E5E5E5" />
      </g>
      <mask id={`${id}-m3`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="49" y="101" width="88" height="51">
        <path d="M95.9184 151.374C103.911 151.374 121.817 148.128 131.12 138.73C138.411 131.364 138.488 121.539 131.12 114.097C122.945 105.838 106.585 101.419 95.9044 101.419V107.299C100.706 107.298 110.602 109.355 116.692 112.833C129.644 120.322 129.644 132.44 116.692 139.9C110.889 143.214 100.205 145.434 95.9044 145.434L95.9184 151.374ZM89.8455 151.375C81.8532 151.375 63.9464 148.129 54.6435 138.731C47.3528 131.365 47.2763 121.541 54.6435 114.099C62.8185 105.84 79.1787 101.421 89.8594 101.421V107.3C85.8477 107.3 75.1618 109.357 69.0716 112.834C55.9807 120.309 55.9807 132.427 69.0716 139.902C74.8748 143.216 85.1746 145.436 89.8594 145.436L89.8455 151.375Z" fill="white" />
      </mask>
      <g mask={`url(#${id}-m3)`}>
        <path d="M61.9771 108.697C79.052 98.9236 106.736 98.9236 123.811 108.697C140.886 118.472 140.886 134.32 123.811 144.095C106.736 153.869 79.052 153.869 61.9771 144.095C44.9022 134.32 44.9022 118.472 61.9771 108.697Z" fill="#999999" />
        <path d="M61.9771 108.697C79.052 98.9236 106.736 98.9236 123.811 108.697C140.886 118.472 140.886 134.32 123.811 144.095C106.736 153.869 79.052 153.869 61.9771 144.095C44.9022 134.32 44.9022 118.472 61.9771 108.697Z" fill="white" fillOpacity="0.501961" />
      </g>
    </svg>
  );
}

/** The live variant, driven by the file's own state machine. */
function RivePedestal({
  selected,
  active,
  className,
}: {
  selected?: boolean;
  active?: boolean;
  className?: string;
}) {
  const { RiveComponent, rive } = useRive({
    src: GAMEBOARD_RIV,
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    autoplay: true,
  });

  const fired = useRef(false);

  /*
   * Inputs are read off the instance rather than through
   * `useStateMachineInput`, because driving Rive means assigning to
   * `input.value` and the hook's return is treated as immutable by lint. Same
   * API, no rule fight.
   */
  useEffect(() => {
    if (!rive) return;
    const inputs = rive.stateMachineInputs(STATE_MACHINE) ?? [];
    const byName = (name: string) => inputs.find((i) => i.name === name);

    const set = (name: string, value: boolean) => {
      const input = byName(name);
      if (input) input.value = value;
    };

    set("select", Boolean(selected));
    set("padlock", false);
    set("dark-mode", true);
    set("start_idle", Boolean(active));

    if (active && !fired.current) {
      fired.current = true;
      byName("koji_appear")?.fire?.();
    }
  }, [rive, selected, active]);

  return (
    <div className={cn("h-[134px] w-32 shrink-0", className)} aria-hidden="true">
      <RiveComponent className="h-full w-full" />
    </div>
  );
}
