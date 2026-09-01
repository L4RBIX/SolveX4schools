"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * brilliant.org's `button3d` — the CTA used everywhere in the app, including
 * every footer control in the lesson player.
 *
 * The mechanism is not a drop shadow. Reading the live Panda rules, the face
 * is lifted off a hard, blur-free lip and both halves are driven by two custom
 * properties:
 *
 *   transform:  translateY(var(--button3d-translate-y, -4px));
 *   box-shadow: 0 var(--button3d-shadow-y, 4px) 0 0 var(--button3d-shadow-color);
 *   transition: transform .1s ease-out, box-shadow .1s ease-out;
 *
 * Pressing sets both vars to 0, so the face travels exactly the height of its
 * own lip and lands flush. Driving it through the variables (rather than
 * hardcoding an :active transform) is what keeps the travel and the lip in
 * sync when a variant changes the lip height.
 *
 * `hover:opacity-[0.85]` is likewise from the original, not invented.
 */

export type Button3DVariant = "neutral" | "warn" | "ok" | "secondary" | "purple";

const VARIANTS: Record<Button3DVariant, string> = {
  /** Default CTA — "Check", "Continue" on a scene-setter page. */
  /* `b-cta` is near-white in dark and near-black in light, so the ink has to
     move with it. `b-bg` is the opposite of `b-fg` in both arms, which is
     exactly the relationship a filled button needs. */
  neutral: "bg-b-cta text-b-bg [--button3d-shadow-color:var(--color-b-cta-lip)]",
  /** Wrong answer — "Try again". */
  warn: "bg-b-warn-cta text-b-warn-cta-ink [--button3d-shadow-color:var(--color-b-warn)]",
  /** Right answer — "Continue". */
  ok: "bg-b-ok-fill text-b-on-fill [--button3d-shadow-color:var(--color-b-ok-fill)]",
  /** Paired secondary — "Get help", "Why?". */
  secondary:
    "bg-b-fg/15 text-b-fg [--button3d-shadow-color:color-mix(in_oklab,var(--color-b-fg)_8%,transparent)]",
  /** Course/home primary. */
  purple: "bg-b-blue text-b-on-fill [--button3d-shadow-color:var(--color-b-blue-2)]",
};

export interface Button3DProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: Button3DVariant;
  children: ReactNode;
  /** Wrapper class — width lives here, since the face is always 100%. */
  className?: string;
  /**
   * The control is doing the thing it was pressed for, and is not available
   * again until it finishes.
   *
   * A third state, and it had to be a third state rather than `disabled`.
   * `disabled` renders `bg-b-panel text-b-dim` — the grey of a control that is
   * not available to you — which is the wrong sentence for a Check that is
   * running: the learner did press it, it did work, and greying it out reads
   * as the press having been rejected. `busy` keeps the variant's own colour,
   * holds the face down on its lip (the press, still visibly held), and adds a
   * spinner. It also blocks the click, because a Check in flight is a graded
   * attempt against a metered judge and a second press buys a second one.
   *
   * Announced as `aria-busy` rather than by renaming the button. A control
   * whose label changes underneath a screen reader mid-press is harder to
   * follow, and the progress copy is a live region next to it.
   */
  busy?: boolean;
  /** What a screen reader should call the spinner. Required when `busy`. */
  busyLabel?: string;
}

export function Button3D({
  variant = "neutral",
  children,
  className,
  disabled,
  busy = false,
  busyLabel,
  ...rest
}: Button3DProps) {
  /* One derived flag so the DOM cannot end up clickable while it looks busy. */
  const inert = disabled === true || busy;
  return (
    <button
      type="button"
      data-slot="button3d"
      data-disabled={disabled ? "" : undefined}
      data-busy={busy ? "" : undefined}
      disabled={inert}
      aria-busy={busy || undefined}
      className={cn(
        "group relative inline-flex w-full cursor-pointer rounded-[56px] outline-none",
        "hover:opacity-[0.85]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-fg",
        inert && "cursor-default opacity-100",
        busy && "cursor-progress hover:opacity-100",
        className,
      )}
      {...rest}
    >
      <span
        data-slot="button3d-face"
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-[60px] px-6 py-[14px]",
          "text-[16px] leading-5 font-medium whitespace-nowrap",
          // the lift + lip, both variable-driven so a press collapses them together
          "translate-y-[var(--button3d-translate-y,-4px)]",
          "shadow-[0_var(--button3d-shadow-y,4px)_0_0_var(--button3d-shadow-color)]",
          "transition-[transform,box-shadow] duration-100 ease-out",
          // press: face drops onto its own lip
          "group-active:enabled:[--button3d-translate-y:0px] group-active:enabled:[--button3d-shadow-y:0px]",
          VARIANTS[variant],
          /* Busy holds the pressed geometry — the same two variables an
             `:active` press sets — so the acknowledgement of the press is
             literally the press, not a separate animation that has to be
             kept in sync with it. */
          busy && "[--button3d-translate-y:0px] [--button3d-shadow-y:0px] opacity-90",
          disabled && !busy && "bg-b-panel text-b-dim",
        )}
      >
        {busy ? <Button3DSpinner label={busyLabel} /> : null}
        <span data-slot="button3d-content" className="relative z-[1]">
          {children}
        </span>
      </span>
    </button>
  );
}

/**
 * An indeterminate spinner, and indeterminate on purpose.
 *
 * There is no honest percentage to draw here. The browser is waiting on a
 * trusted judge that reports once, at the end; a filling bar would be a number
 * this product invented about a child's work. A ring that turns says "still
 * working" and claims nothing else.
 *
 * `motion-reduce:animate-none` leaves a static ring for a learner who has asked
 * the OS for less motion — the button is already visibly held down, so the
 * spinner is not the only cue that the press landed.
 */
function Button3DSpinner({ label }: { label?: string }) {
  return (
    <svg
      data-slot="button3d-spinner"
      className="relative z-[1] size-4 shrink-0 animate-spin motion-reduce:animate-none"
      viewBox="0 0 16 16"
      fill="none"
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
