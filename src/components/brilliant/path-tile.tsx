import type { ReactElement } from "react";

import type { ArtKind } from "@/components/brilliant/courses-data";
import { cn } from "@/lib/utils";

/**
 * Learning-path tile — 176x176, #141414 on the #1E1E1E panel, 20px radius,
 * 2px #4C4C4C border and the site's signature hard 4px bottom edge (no blur
 * anywhere on this surface). The label is deliberately *outside* the frame.
 *
 * This file also owns `TileArt`, the inline-SVG registry every illustration on
 * the course routes draws from — the live pages ship these as SVG too, so
 * there is nothing to download into /public.
 */

/* Only four inks appear on the dark course surfaces: white, the two accents
   and the #4C4C4C edge grey. */
const W = "#FFFFFF";
const G = "#5ED981";
const B = "#4A5CD6";
const E = "#4C4C4C";

const ART: Record<ArtKind, ReactElement> = {
  pie: (
    <>
      <path d="M36 36V10a26 26 0 0 1 26 26Z" fill={G} />
      <circle cx="36" cy="36" r="26" stroke={W} strokeWidth="3" />
      <path d="M36 10v52M10 36h52" stroke={W} strokeWidth="3" />
    </>
  ),
  numberline: (
    <>
      <path d="M6 42h60" stroke={E} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M18 34v16M36 30v20M54 34v16"
        stroke={E}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="18" cy="42" r="9" fill={B} />
      <path d="M14 42h8" stroke={W} strokeWidth="3" strokeLinecap="round" />
      <path
        d="M50 42h8M54 38v8"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  percent: (
    <>
      <rect x="11.5" y="11.5" width="15.5" height="15.5" fill={G} />
      <rect x="28.5" y="11.5" width="15.5" height="15.5" fill={G} />
      <rect x="11.5" y="28.5" width="15.5" height="15.5" fill={G} />
      <path d="M10 27h52M10 44h52M27 10v52M44 10v52" stroke={E} strokeWidth="2" />
      <rect
        x="10"
        y="10"
        width="52"
        height="52"
        rx="6"
        stroke={W}
        strokeWidth="3"
      />
    </>
  ),
  scale: (
    <>
      <path
        d="M36 14v44M18 58h36M12 24h48"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M12 24 6 36a10 10 0 0 0 12 0Z" fill={B} />
      <path d="M60 24 54 36a10 10 0 0 0 12 0Z" fill={G} />
      <circle cx="36" cy="14" r="4" fill={W} />
    </>
  ),
  axes: (
    <>
      <path
        d="M10 22h52M10 36h52M10 50h52M22 10v52M36 10v52M50 10v52"
        stroke={E}
        strokeWidth="2"
      />
      <path d="M8 50h56M22 64V8" stroke={W} strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="22" r="6" fill={G} />
    </>
  ),
  equation: (
    <>
      <rect x="6" y="24" width="24" height="24" rx="6" fill={B} />
      <path
        d="m13 31 10 10M23 31 13 41"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M36 30h8M36 42h8"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="50" y="24" width="16" height="24" rx="5" fill={G} />
    </>
  ),
  slope: (
    <>
      <path d="M10 50h52M10 36h52M24 10v52M48 10v52" stroke={E} strokeWidth="2" />
      <path d="M12 58 60 16" stroke={W} strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="47" r="5" fill={B} />
      <circle cx="48" cy="26" r="5" fill={G} />
    </>
  ),
  intersect: (
    <>
      <rect
        x="8"
        y="8"
        width="56"
        height="56"
        rx="10"
        stroke={E}
        strokeWidth="2"
      />
      <path
        d="M14 18 58 54M14 54 58 18"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="36" cy="36" r="7" fill={G} />
    </>
  ),
  power: (
    <>
      <path d="M6 62h60" stroke={E} strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="50" width="12" height="12" rx="3" fill={E} />
      <rect x="26" y="38" width="16" height="24" rx="4" fill={B} />
      <rect x="46" y="14" width="20" height="48" rx="5" fill={G} />
    </>
  ),
  parabola: (
    <>
      <path d="M8 56h56" stroke={E} strokeWidth="2" />
      <path
        d="M12 12Q36 74 60 12"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="36" cy="43" r="5" fill={B} />
    </>
  ),
  machine: (
    <>
      <path d="M4 36h14M54 36h14" stroke={E} strokeWidth="3" strokeLinecap="round" />
      <path
        d="m61 30 6 6-6 6"
        stroke={G}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="20"
        y="20"
        width="32"
        height="32"
        rx="8"
        stroke={W}
        strokeWidth="3"
      />
      <circle cx="36" cy="36" r="6" fill={B} />
    </>
  ),
  polynomial: (
    <>
      <path d="M4 58h64" stroke={E} strokeWidth="3" strokeLinecap="round" />
      <rect x="6" y="26" width="26" height="26" rx="5" fill={B} />
      <rect x="36" y="34" width="18" height="18" rx="4" fill={G} />
      <rect x="58" y="42" width="10" height="10" rx="3" fill={W} />
    </>
  ),
  triangle: (
    <>
      <path
        d="M12 56h46L12 18Z"
        stroke={W}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M12 44h12v12" stroke={E} strokeWidth="3" />
      <circle cx="58" cy="56" r="5" fill={G} />
    </>
  ),
  logcurve: (
    <>
      <path d="M10 58h54M14 62V10" stroke={E} strokeWidth="2" />
      <path
        d="M14 58C22 20 34 14 62 12"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="30.5" cy="21.5" r="5" fill={B} />
    </>
  ),
  sequence: (
    <>
      <circle cx="36" cy="14" r="5" fill={G} />
      <circle cx="26" cy="32" r="5" fill={W} />
      <circle cx="46" cy="32" r="5" fill={W} />
      <circle cx="16" cy="50" r="5" fill={B} />
      <circle cx="36" cy="50" r="5" fill={B} />
      <circle cx="56" cy="50" r="5" fill={B} />
    </>
  ),
  vector: (
    <>
      <path d="M10 62h54M10 10v52" stroke={E} strokeWidth="2" />
      <path d="M12 60 48 27" stroke={W} strokeWidth="4" strokeLinecap="round" />
      <path d="M56 20 49.6 33.8 41.6 25Z" fill={G} />
    </>
  ),
  limit: (
    <>
      <path d="M8 50h56" stroke={E} strokeWidth="2" />
      <path
        d="M56 10v52"
        stroke={G}
        strokeWidth="3"
        strokeDasharray="6 6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="46" r="5" fill={W} opacity="0.35" />
      <circle cx="30" cy="38" r="5" fill={W} opacity="0.6" />
      <circle cx="42" cy="30" r="5" fill={W} />
      <circle cx="50" cy="24" r="5" fill={B} />
    </>
  ),
  tangent: (
    <>
      <path
        d="M8 58C22 58 26 16 60 14"
        stroke={W}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M14 56 56 20" stroke={B} strokeWidth="3" strokeLinecap="round" />
      <circle cx="34" cy="35" r="5" fill={G} />
    </>
  ),
  blocks: (
    <>
      <rect x="8" y="40" width="24" height="24" rx="6" fill={B} />
      <rect x="36" y="40" width="24" height="24" rx="6" fill={G} />
      <rect x="22" y="10" width="24" height="24" rx="6" fill={W} />
    </>
  ),
  xy: (
    <>
      <path d="M8 30h56M8 46h56" stroke={W} strokeWidth="5" strokeLinecap="round" />
      <circle cx="20" cy="14" r="8" fill={G} />
      <rect x="44" y="52" width="18" height="18" rx="5" fill={B} />
    </>
  ),
  sigma: (
    <>
      <path
        d="M50 12H18l18 24-18 24h32"
        stroke={W}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="56" cy="52" r="6" fill={G} />
    </>
  ),
};

export interface TileArtProps {
  kind: ArtKind;
  className?: string;
}

export function TileArt({ kind, className }: TileArtProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("block", className)}
    >
      {ART[kind]}
    </svg>
  );
}

export interface PathTileProps {
  label: string;
  grade: string;
  art: ArtKind;
  isNew?: boolean;
  className?: string;
}

export function PathTile({
  label,
  grade,
  art,
  isNew = false,
  className,
}: PathTileProps) {
  return (
    <button
      type="button"
      aria-label={`${label}, ${grade}`}
      className={cn(
        "group flex w-[140px] shrink-0 flex-col items-center outline-offset-4 sm:w-[176px]",
        className,
      )}
    >
      <span
        className={cn(
          "b-physical b-press relative flex size-[140px] items-center justify-center rounded-[20px] bg-b-dark text-b-edge sm:size-[176px]",
          "group-hover:border-white/70 group-hover:text-white/70 group-hover:shadow-[0_4px_0_0_rgba(255,255,255,0.7)]",
          "group-active:translate-y-[3px] group-active:shadow-[0_1px_0_0_currentColor]",
        )}
      >
        <span className="b-eyebrow absolute top-3 left-3 text-b-dim sm:top-4 sm:left-4">
          {grade}
        </span>
        {isNew ? (
          <span className="absolute top-3 right-3 rounded-full bg-b-green-2 px-2 py-0.5 text-[11px] leading-4 font-bold text-white uppercase sm:top-4 sm:right-4">
            New
          </span>
        ) : null}
        <TileArt kind={art} className="size-14 sm:size-[72px]" />
      </span>
      <span className="mt-4 text-center text-[16px] leading-[22px] font-normal text-white">
        {label}
      </span>
    </button>
  );
}
