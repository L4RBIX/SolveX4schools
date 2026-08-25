import { cn } from "@/lib/utils";

import { B } from "./data";

/**
 * The page ships 41 inline `<svg>` elements, all filled with `currentcolor` so
 * their colour comes from the `color:` of the surrounding box. The extracted
 * files live verbatim under `public/assets/original/.../inline-svg/`.
 *
 * `<img src>` would flatten every one of them to black, so each is painted as a
 * CSS mask over `background-color: currentColor` instead: same artwork, same
 * inheritance, no id collisions between the three files that carry `clipPath`
 * ids (`a`, `clip0_78_55633`, `:R2qfakm:`).
 */
export const GLYPHS = {
  wordmark: `${B}/inline-svg/brilliant-wordmark.svg`,
  appleEditorsChoice: `${B}/inline-svg/badge-apple-editors-choice.svg`,
  googlePlayFeatured: `${B}/inline-svg/badge-google-play-featured-app.svg`,
  fiveStars: `${B}/inline-svg/five-stars.svg`,
  newYorkTimes: `${B}/inline-svg/logo-the-new-york-times.svg`,
  theAtlantic: `${B}/inline-svg/logo-the-atlantic.svg`,
  externalLink: `${B}/inline-svg/icon-external-link.svg`,
} as const;

interface GlyphProps {
  src: string;
  /** Intrinsic width in px. Omit when `className` sizes the box responsively. */
  width?: number;
  /** Intrinsic height in px. Omit when `className` sizes the box responsively. */
  height?: number;
  className?: string;
}

/**
 * Always decorative. The original page carries no accessible name on any of
 * these marks — its only `aria-label`s are the four footer social links — so
 * none is invented here.
 */
export function Glyph({ src, width, height, className }: GlyphProps) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current align-middle", className)}
      style={{
        width,
        height,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

/**
 * The CTA mascot. Multi-colour (a green diamond, a white/black face and an
 * `#e2ee62` gradient overlay), so it is inlined rather than masked.
 * Source: `inline-svg/koji-peek.svg`, 53×53.
 */
export function KojiPeek({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="53"
      viewBox="0 0 53 53"
      width="53"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#koji-peek-clip)">
        <path
          clipRule="evenodd"
          d="M52.646 26.46v-.002c-.002-5.303-3.36-8.154-5.347-9.364-4.627-2.82-9.357-7.775-11.824-12.008-.926-1.588-3.805-4.95-9.152-4.95s-8.226 3.364-9.151 4.95C14.704 9.32 9.974 14.275 5.347 17.093 3.36 18.303.002 21.153 0 26.457v.006c.002 5.303 3.36 8.154 5.347 9.364 4.627 2.819 9.357 7.774 11.825 12.007.925 1.588 3.804 4.95 9.151 4.95s8.226-3.364 9.151-4.95c2.468-4.233 7.198-9.188 11.825-12.007 1.987-1.21 5.345-4.061 5.347-9.364z"
          fill="#29cc57"
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M52.646 26.46v-.002c-.002-5.303-3.36-8.154-5.347-9.364-4.627-2.82-9.357-7.775-11.824-12.008-.926-1.588-3.805-4.95-9.152-4.95s-8.226 3.364-9.151 4.95C14.704 9.32 9.974 14.275 5.347 17.093 3.36 18.303.002 21.153 0 26.457v.006c.002 5.303 3.36 8.154 5.347 9.364 4.627 2.819 9.357 7.774 11.825 12.007.925 1.588 3.804 4.95 9.151 4.95s8.226-3.364 9.151-4.95c2.468-4.233 7.198-9.188 11.825-12.007 1.987-1.21 5.345-4.061 5.347-9.364z"
          fill="url(#koji-peek-gradient)"
          fillRule="evenodd"
        />
        <path
          d="M37.309 17.205a5.265 5.265 0 0 0-5.265-5.265H20.321a5.265 5.265 0 0 0-5.265 5.265v9.39H37.31z"
          fill="#fff"
        />
        <path d="M21.57 26.595h9.572v-6.32H21.57z" fill="#000" />
      </g>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="koji-peek-gradient"
          x1="41.382"
          x2="10.669"
          y1="-.635"
          y2="39.14"
        >
          <stop offset=".49" stopColor="#e2ee62" stopOpacity="0" />
          <stop offset="1" stopColor="#e2ee62" />
        </linearGradient>
        <clipPath id="koji-peek-clip">
          <path d="M0 0h52.646v52.646H0z" fill="#fff" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Lucide `chevron-down`, 24×24 — the FAQ accordion marker. */
export function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
