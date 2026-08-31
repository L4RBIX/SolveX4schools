import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Brilliant's Button3D: an anchor wrapping a "face" span that sits 4px above a
 * hard, un-blurred 4px bottom edge. Pressing drops the face onto the edge.
 * Identical idiom to the repo's `.b-physical` / `.b-press`, spelled out here
 * because the measured radii (56px root / 60px face) and the 100ms ease-out
 * transition are specific to this page.
 */
const FACE_BASE =
  "relative inline-flex w-full items-center justify-center gap-2 rounded-[60px] px-6 py-[14px] font-b-sans text-[16px] font-medium leading-[1.25] " +
  "-translate-y-[4px] transition-[transform,box-shadow] duration-100 ease-out " +
  "group-active/b3d:translate-y-0 group-active/b3d:shadow-none";

interface Button3DProps {
  /** Omitted where the original's destination was not extractable. */
  href?: string;
  children: ReactNode;
  /** Face colour / border / edge classes — one per measured variant. */
  faceClassName: string;
  className?: string;
}

export function Button3D({
  href,
  children,
  faceClassName,
  className,
}: Button3DProps) {
  return (
    <a
      data-slot="button3d"
      href={href}
      role="link"
      className={cn(
        "group/b3d relative inline-flex cursor-pointer rounded-[56px] outline-none",
        "[-webkit-tap-highlight-color:transparent] hover:opacity-85",
        "focus-visible:shadow-[0_0_0_3px_#456dff]",
        className,
      )}
    >
      <span data-slot="button3d-face" className={cn(FACE_BASE, faceClassName)}>
        <span
          data-slot="button3d-content"
          className="relative z-[1] inline-flex items-center gap-2"
        >
          {children}
        </span>
      </span>
    </a>
  );
}
