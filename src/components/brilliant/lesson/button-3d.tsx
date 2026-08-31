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
}

export function Button3D({
  variant = "neutral",
  children,
  className,
  disabled,
  ...rest
}: Button3DProps) {
  return (
    <button
      type="button"
      data-slot="button3d"
      data-disabled={disabled ? "" : undefined}
      disabled={disabled}
      className={cn(
        "group relative inline-flex w-full cursor-pointer rounded-[56px] outline-none",
        "hover:opacity-[0.85]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-fg",
        disabled && "cursor-default opacity-100",
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
          disabled && "bg-b-panel text-b-dim",
        )}
      >
        <span data-slot="button3d-content" className="relative z-[1]">
          {children}
        </span>
      </span>
    </button>
  );
}
