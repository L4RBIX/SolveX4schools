/**
 * The ladder.
 *
 * Ten tiers, and the names are PROPER NOUNS rendered in Latin script in both
 * languages — the same treatment `Nova`, `Strobi` and `SolveX4Schools` already
 * get. `labels.ts` writes «Nova — оқу көмекшісі» and «Nova — учебный помощник»,
 * embedding the Latin name inside a Kazakh and a Russian sentence rather than
 * transliterating it twice; a league name is the same kind of word.
 *
 * That decision is not cosmetic. `Singularity` has no shared Cyrillic form — it
 * is «Сингулярность» in Russian and «Сингулярлық» in Kazakh — and `Circuit` has
 * no internationalism at all. Transliterating would give a learner two
 * different names for the tier they are in depending on which language button
 * they last pressed. One Latin name in both, with the surrounding vocabulary
 * localised, is the only form that stays stable across the locale switch.
 *
 * Consequence for `tests/school/product-surface.test.ts`: none. That suite
 * scans `Localized` values in `labels.ts` and fails when `kk === ru`. These are
 * plain strings and never enter that object, so no allowlist entry is needed —
 * which is the point. Ten names on the shared-loanword list would have made the
 * next genuinely untranslated label invisible.
 *
 * This file is DATA. It has no database access and no dependency on the XP
 * policy, so a tier can be renamed without touching a rule and a rule can be
 * changed without touching a name.
 */

/** Lowest tier. A learner's first eligible XP puts them here. */
export const FIRST_TIER = 1;

/** Highest tier. Nothing promotes out of it. */
export const LAST_TIER = 10;

export interface LeagueTier {
  /**
   * 1-10, and it is the STORED value. The name is presentation; this is
   * identity. Renaming `Titan` must not move anybody, which is only true
   * because no row anywhere stores a name.
   */
  readonly tier: number;
  /** Rendered as-is in both locales. See the header. */
  readonly name: string;
  /**
   * The tier's hue, as an oklch triple used to build the badge.
   *
   * Deliberately NOT a `--color-*` token: ten more entries in the global
   * `@theme` block would be ten colours every other surface can reach for, and
   * the ladder is the only thing that may use them. They also must not collide
   * with the meanings the product has already fixed — green is `accepted`,
   * amber is `partial`, rose is `wrong`, and the three track colours
   * (`sx-support`, `sx-core`, `sx-advanced`) mean a route through a month, not
   * a rank. The ramp below walks blue -> violet -> gold and stays off the
   * verdict axis at every step.
   */
  readonly hue: string;
}

/**
 * The ladder, low to high.
 *
 * The arc is deliberate: `Pulse` is a single signal, `Singularity` is the point
 * everything converges on. The middle is engineering rather than fantasy —
 * nothing here is a dragon, a gemstone or a chemical element, and none of it is
 * borrowed from the reference product's ladder.
 *
 * `Nova` is absent and cannot be added: it is the name of this product's
 * tutor, and a learner who reads «Nova лигасы» on one screen and asks Nova for
 * a hint on the next has been handed one word for two things.
 */
export const LEAGUE_TIERS: readonly LeagueTier[] = [
  { tier: 1, name: "Pulse", hue: "oklch(0.62 0.13 235)" },
  { tier: 2, name: "Vector", hue: "oklch(0.63 0.15 250)" },
  { tier: 3, name: "Circuit", hue: "oklch(0.63 0.16 268)" },
  { tier: 4, name: "Matrix", hue: "oklch(0.62 0.18 286)" },
  { tier: 5, name: "Reactor", hue: "oklch(0.62 0.20 302)" },
  { tier: 6, name: "Titan", hue: "oklch(0.63 0.19 320)" },
  { tier: 7, name: "Nexus", hue: "oklch(0.65 0.18 338)" },
  { tier: 8, name: "Apex", hue: "oklch(0.70 0.16 45)" },
  { tier: 9, name: "Zenith", hue: "oklch(0.76 0.15 75)" },
  { tier: 10, name: "Singularity", hue: "oklch(0.83 0.14 92)" },
] as const;

/**
 * Clamp into the ladder.
 *
 * Every read of a stored tier goes through this. The column has a CHECK
 * constraint, so an out-of-range value should be impossible — but a settlement
 * that computed `tier + 1` at the top of the ladder would produce 11, and the
 * failure mode of a bare array index is `undefined.name` in a React render
 * rather than a caught error. Clamping is the behaviour that keeps a learner's
 * page rendering while the bug is found.
 */
export function tierAt(tier: number): LeagueTier {
  const i = Math.min(LAST_TIER, Math.max(FIRST_TIER, Math.trunc(tier))) - 1;
  return LEAGUE_TIERS[i];
}

export function isTier(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= FIRST_TIER &&
    value <= LAST_TIER
  );
}
