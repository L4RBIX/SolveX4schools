import { cn } from "@/lib/utils";

/**
 * The ten league emblems.
 *
 * ## The idea, so the next person does not "improve" it into decoration
 *
 * The ladder is a signal acquiring structure. `Pulse` is one point of light.
 * Each tier builds more around it — a direction, a route, a grid, a core, a
 * network, a peak. Then `Singularity` collapses all of it back into a single
 * dense point with everything converging on it.
 *
 * So complexity RISES and then RESOLVES. That arc is why tier 10 reads as
 * aspirational without a single extra glow: it is the only emblem that is quiet
 * again, and it earns that quiet by being the densest thing on the ladder.
 * "More strokes = higher rank" would have been the obvious system and it makes
 * tier 10 look like clutter.
 *
 * ## One silhouette
 *
 * Every emblem sits in the same rounded-square aperture. That shape is native
 * here — the app is built on large-radius cards — rather than a shield or a
 * crest, which would import a vocabulary from esports that this product does
 * not speak. The aperture never changes; only what is inside it does, which is
 * what makes ten badges read as one system.
 *
 * ## Colour is the last carrier, never the only one
 *
 * `LEAGUE_TIERS[].hue` walks blue → violet → gold and deliberately avoids the
 * verdict axis (green accepted / amber partial / rose wrong) — see `tiers.ts`.
 * But hue alone cannot separate ten steps, and adjacent tiers are close by
 * construction. So identity is carried by SHAPE first, then the tier numeral,
 * then the name, and hue only reinforces. Each emblem is distinguishable in a
 * greyscale print-out; that is the test it was drawn against.
 *
 * ## Why paths and not an icon font or images
 *
 * Ten geometric emblems on a 24×24 grid stay crisp at 32, 48, 72 and 96px, cost
 * nothing to ship, inherit `currentColor`, and can be recoloured per theme
 * arm. A raster set would need four sizes × two themes × ten tiers.
 */

/** Stroke-based geometry, so weight scales with the badge rather than the DPI. */
interface Emblem {
  /** What the shape means, for the person reading this file later. */
  readonly idea: string;
  readonly draw: (s: number) => React.ReactNode;
}

/* All geometry is authored on a 24×24 grid and scaled by the aperture. `s` is
   the stroke width, widened a little at large sizes so a 96px badge does not
   look like a hairline drawing. */

const EMBLEMS: Readonly<Record<number, Emblem>> = {
  1: {
    idea: "one signal — a point and the ring it sends out",
    draw: (s) => (
      <>
        <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="7" strokeWidth={s} opacity={0.55} />
      </>
    ),
  },
  2: {
    idea: "direction acquired — the point now points",
    draw: (s) => (
      <>
        <circle cx="7" cy="17" r="2.4" fill="currentColor" stroke="none" />
        <path d="M8.8 15.2 L17 7" strokeWidth={s} strokeLinecap="round" />
        <path d="M17 12.5 V7 H11.5" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  3: {
    idea: "a route — two nodes and the track between them",
    draw: (s) => (
      <>
        <path
          d="M5 17 H10 A3 3 0 0 0 13 14 V10 A3 3 0 0 1 16 7 H19"
          strokeWidth={s}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="5" cy="17" r="2.2" fill="currentColor" stroke="none" />
        <circle cx="19" cy="7" r="2.2" fill="currentColor" stroke="none" />
      </>
    ),
  },
  4: {
    idea: "structure — a lattice of equals",
    draw: (s) => (
      <>
        <circle cx="8" cy="8" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="8" cy="16" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="2.1" fill="currentColor" stroke="none" />
        <path d="M8 8 H16 M8 16 H16 M8 8 V16 M16 8 V16" strokeWidth={s} opacity={0.5} />
      </>
    ),
  },
  5: {
    idea: "a core with something orbiting it",
    draw: (s) => (
      <>
        <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="9" ry="4.2" strokeWidth={s} opacity={0.6} />
        <ellipse
          cx="12"
          cy="12"
          rx="9"
          ry="4.2"
          strokeWidth={s}
          opacity={0.6}
          transform="rotate(60 12 12)"
        />
      </>
    ),
  },
  6: {
    idea: "mass — a monolith that does not move",
    draw: (s) => (
      <>
        <path d="M8 5 H16 V19 H8 Z" strokeWidth={s} strokeLinejoin="round" />
        <path d="M8 10 H16" strokeWidth={s} opacity={0.5} />
        <rect x="10.2" y="12" width="3.6" height="5" fill="currentColor" stroke="none" />
      </>
    ),
  },
  7: {
    idea: "a network — three held together by one centre",
    draw: (s) => (
      <>
        <path d="M12 12 L12 5 M12 12 L18 16 M12 12 L6 16" strokeWidth={s} opacity={0.55} />
        <circle cx="12" cy="5" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="18" cy="16" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="6" cy="16" r="2.1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
  8: {
    idea: "a peak — the structure now has a top",
    draw: (s) => (
      <>
        <path d="M5 15 L12 7 L19 15" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 19 H16" strokeWidth={s} opacity={0.5} strokeLinecap="round" />
        <circle cx="12" cy="7" r="1.9" fill="currentColor" stroke="none" />
      </>
    ),
  },
  9: {
    idea: "height — the peak, and the arc above it",
    draw: (s) => (
      <>
        <path d="M5 17 L12 10 L19 17" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 6.5 A8 8 0 0 1 18 6.5" strokeWidth={s} opacity={0.55} strokeLinecap="round" />
        <circle cx="12" cy="10" r="2.1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  10: {
    idea: "convergence — every line arrives at one dense point",
    draw: (s) => (
      <>
        <path
          d="M12 3.5 V7 M12 17 V20.5 M3.5 12 H7 M17 12 H20.5 M6.4 6.4 L8.7 8.7 M17.6 17.6 L15.3 15.3 M17.6 6.4 L15.3 8.7 M6.4 17.6 L8.7 15.3"
          strokeWidth={s}
          strokeLinecap="round"
          opacity={0.7}
        />
        <circle cx="12" cy="12" r="4.6" fill="currentColor" stroke="none" />
      </>
    ),
  },
};

/** What each emblem means, exported so a test can assert all ten are distinct. */
export const EMBLEM_IDEAS: Readonly<Record<number, string>> = Object.fromEntries(
  Object.entries(EMBLEMS).map(([k, v]) => [Number(k), v.idea]),
);

export type TierEmblemSize = 32 | 48 | 72 | 96;

/**
 * The badge.
 *
 * `hue` arrives from `LEAGUE_TIERS` and is set once as a custom property, so
 * every colour below is one `color-mix` away from it and a tier change is one
 * variable rather than six class swaps.
 *
 * `state` is the ladder's relationship to the learner, not a visual style:
 * - `current` — where they are. Full colour, ring, faint lift.
 * - `next` — where they are going. Coloured, quieter ring, no lift.
 * - `behind` — already passed. Ink, not colour: a tier you have left should not
 *   compete with the one you are in.
 * - `ahead` — not yet reachable. Dimmed, but never invisible; a ladder you
 *   cannot read is not a ladder.
 */
export function TierEmblem({
  tier,
  name,
  hue,
  size = 48,
  state = "current",
  className,
}: {
  tier: number;
  name: string;
  hue: string;
  size?: TierEmblemSize;
  state?: "current" | "next" | "behind" | "ahead";
  className?: string;
}) {
  const emblem = EMBLEMS[tier] ?? EMBLEMS[1];
  /* Heavier stroke at small sizes so the shape survives; lighter at 96 so the
     large badge reads as drawn rather than as a thick outline. */
  const stroke = size <= 32 ? 2.1 : size <= 48 ? 1.9 : size <= 72 ? 1.7 : 1.5;
  const radius = Math.round(size * 0.3);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center transition-[transform,box-shadow] duration-200",
        "motion-reduce:transition-none",
        state === "current" && "text-[var(--tier-hue)]",
        state === "next" && "text-[var(--tier-hue)]",
        state === "behind" && "text-b-text-2",
        state === "ahead" && "text-b-text-2 opacity-55",
        className,
      )}
      style={{
        ["--tier-hue" as string]: hue,
        width: size,
        height: size,
        borderRadius: radius,
        background:
          state === "current"
            ? "color-mix(in oklab, var(--tier-hue) 20%, transparent)"
            : state === "next"
              ? "color-mix(in oklab, var(--tier-hue) 11%, transparent)"
              : "color-mix(in oklab, var(--color-b-text-2) 9%, transparent)",
        boxShadow:
          state === "current"
            ? "inset 0 0 0 2px color-mix(in oklab, var(--tier-hue) 58%, transparent)"
            : state === "next"
              ? "inset 0 0 0 1.5px color-mix(in oklab, var(--tier-hue) 34%, transparent)"
              : "inset 0 0 0 1px color-mix(in oklab, var(--color-b-text-2) 22%, transparent)",
      }}
      /* The NAME, not "tier 5" and not the numeral — a screen-reader user hears
         the same word a sighted one reads beside it. */
      aria-label={name}
      data-tier={tier}
      data-tier-state={state}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        {emblem.draw(stroke)}
      </svg>
    </span>
  );
}

/**
 * The numeral, as a separate carrier.
 *
 * Kept out of the emblem on purpose: inside the aperture it fought the shape at
 * 32px and won, which is how the old badge ended up being a number in a box.
 * Beside it, both survive.
 */
export function TierOrdinal({ tier, className }: { tier: number; className?: string }) {
  return (
    <span className={cn("font-semibold tabular-nums", className)} aria-hidden="true">
      {String(tier).padStart(2, "0")}
    </span>
  );
}
