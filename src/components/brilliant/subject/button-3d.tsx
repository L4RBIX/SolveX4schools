import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * `Button3D` — brilliant.org's raised CTA.
 *
 * Two nested boxes. The outer anchor carries the elliptical 56px radius and the
 * hover fade; the inner face carries a *hard* 4px bottom shadow and sits 4px
 * above it. Pressing collapses both at once over 100ms, so the face drops onto
 * its own shadow. No blur anywhere.
 */

export type Button3DVariant = "green" | "outlineSecondary" | "outlineOnGray" | "whiteOnDark";

const FACE_BASE = cn(
  "relative inline-flex w-full items-center justify-center gap-2",
  "px-6 py-3.5",
  "font-b-sans text-[16px] font-medium leading-[1.25]",
  "-translate-y-1 transition-[transform,box-shadow] duration-100 ease-out",
  "group-active/b3d:translate-y-0 group-active/b3d:shadow-none",
);

const FACE_VARIANTS: Record<Button3DVariant, string> = {
  green: cn(
    "bg-[#29cc57] text-white shadow-[0_4px_0_0_#15b441]",
    "[text-shadow:0_0_3px_rgba(0,0,0,0.25)]",
  ),
  outlineSecondary: cn(
    "border-2 border-b-0 border-black/10 bg-white pt-3 pb-3.5 text-black",
    "shadow-[0_4px_0_0_rgba(0,0,0,0.10)]",
    "group-hover/b3d:border-black/30 group-hover/b3d:shadow-[0_4px_0_0_rgba(0,0,0,0.30)]",
    "group-active/b3d:border-b-2 group-active/b3d:border-black/30 group-active/b3d:bg-black/5 group-active/b3d:pb-3",
  ),
  outlineOnGray: cn(
    "border-2 border-b-0 border-black/10 bg-transparent pt-3 pb-3.5 text-black",
    "shadow-[0_4px_0_0_rgba(0,0,0,0.10)]",
    "group-hover/b3d:border-black/30 group-hover/b3d:shadow-[0_4px_0_0_rgba(0,0,0,0.30)]",
    "group-active/b3d:border-b-2 group-active/b3d:border-black/30 group-active/b3d:bg-black/5 group-active/b3d:pb-3",
  ),
  whiteOnDark: "bg-white text-black shadow-[0_4px_0_0_rgba(255,255,255,0.80)]",
};

interface Button3DProps {
  href: string;
  variant: Button3DVariant;
  children: ReactNode;
  /** Sizing / positioning for the outer anchor. */
  className?: string;
  /** Extra sizing for the face (the hero stretches it to `height: 100%`). */
  faceClassName?: string;
}

export function Button3D({ href, variant, children, className, faceClassName }: Button3DProps) {
  return (
    <a
      data-slot="button3d"
      href={href}
      className={cn(
        "group/b3d relative inline-flex cursor-pointer outline-none",
        "transition-opacity duration-100 ease-out hover:opacity-85",
        className,
      )}
      style={{ borderRadius: "calc(56px / var(--button3d-x-scale, 1)) / 56px" }}
    >
      <span
        data-slot="button3d-face"
        className={cn(FACE_BASE, FACE_VARIANTS[variant], faceClassName)}
        style={{ borderRadius: "calc(60px / var(--button3d-x-scale, 1)) / 60px" }}
      >
        <span data-slot="button3d-content">{children}</span>
      </span>
    </a>
  );
}
