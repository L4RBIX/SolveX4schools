import type { MonthTheme } from "@schools/presentation/month-theme";
import { cn } from "@/lib/utils";

/**
 * The month's mark, and the chip it travels in.
 *
 * This is the half of month identity that survives a colour-vision difference.
 * `month-theme.ts` explains why it has to exist: nine hues on one wheel collapse
 * to 2.0 ΔE under tritanopia, so the accent reinforces an identity carried by
 * the SILHOUETTE, the numeral and the month's own artwork.
 *
 * Which means one rule about this file: the glyph is never optional and never
 * decorative-only. Wherever a month accent is painted, this mark is painted
 * with it — and `data-month-glyph` carries the silhouette's name so a test or a
 * browser check can assert which mark is on screen rather than diffing a fill.
 */

export function MonthGlyphMark({
  theme,
  className,
  size = 14,
}: {
  theme: MonthTheme;
  className?: string;
  /** px. 14 is the size the mark was chosen to stay readable at. */
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      data-month-glyph={theme.glyph.id}
      className={cn("shrink-0", className)}
    >
      <path d={theme.glyph.path} fill="currentColor" />
    </svg>
  );
}

/**
 * Numeral, mark, name — the three non-colour carriers in one object, on the
 * month's accent.
 *
 * The numeral is inside the filled tile with the glyph rather than beside it,
 * because the tile is the thing that gets scaled down onto a 84x60 thumbnail
 * where a separate numeral would be lost. `label` is the accessible name: the
 * chip announces "Сентябрь", not "1 disc".
 */
export function MonthBadge({
  theme,
  label,
  className,
  compact = false,
}: {
  theme: MonthTheme;
  /** The month's name in the reader's language. Required — this is the a11y name. */
  label: string;
  className?: string;
  /** Drop the written name and keep the tile. For tight surfaces. */
  compact?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      data-month-badge={theme.index}
    >
      <span
        aria-hidden="true"
        className="flex h-7 items-center gap-1 rounded-[9px] px-1.5 text-[13px] leading-none font-bold tabular-nums"
        style={{
          backgroundColor: "var(--sx-month-accent, var(--color-b-purple))",
          color: "var(--sx-month-on-accent, var(--color-b-on-fill))",
        }}
      >
        {theme.index > 0 ? theme.index : null}
        <MonthGlyphMark theme={theme} />
      </span>
      {compact ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span
          className="b-eyebrow leading-[13.2px]"
          style={{ color: "var(--sx-month-accent, var(--color-b-purple))" }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
