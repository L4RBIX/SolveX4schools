import { describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MONTH_THEME,
  NEUTRAL_THEME,
  monthTheme,
  monthThemeFromDeckId,
  monthThemeVars,
} from "@schools/presentation/month-theme";
import { MONTH_ART } from "@schools/presentation/illustrations";
import { MONTHS } from "@schools/curriculum/months";

/**
 * Month visual identity.
 *
 * The registry exists because of one measurement: nine hues on one wheel cannot
 * encode nine months. This suite asserts the consequences of that finding
 * rather than the finding's prose.
 *
 *   1. every month carries a NON-COLOUR discriminator, and every surface that
 *      paints an accent also paints that discriminator;
 *   2. the accents clear their measured contrast floors in both theme arms, so
 *      an accent used as ink is legible and an accent used as a fill has ink
 *      that survives on it;
 *   3. month colour is IDENTITY and never leaks onto a surface that reports a
 *      VERDICT, which is the one place where a second meaning for green would
 *      cost a learner something real;
 *   4. league tiers stay independent — no import in either direction;
 *   5. the five light-theme defects this pass fixed stay fixed, and the
 *      reverse-engineering baseline keeps rendering exactly as measured.
 *
 * The colour maths below (WCAG contrast, CIEDE2000, Viénot tritanopia) is
 * re-derived here rather than trusted from a comment, so the numbers in
 * `month-theme.ts` are checked and not merely claimed.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const registry = read("schools/presentation/month-theme.ts");
const glyphComponent = read("src/components/brilliant/gameboard/month-glyph.tsx");
const board = read("src/components/brilliant/gameboard/course-gameboard.tsx");
const pedestal = read("src/components/brilliant/gameboard/sx-pedestal.tsx");
const milestone = read("src/components/brilliant/gameboard/sx-milestone.tsx");
const deck = read("src/components/brilliant/app/course-deck.tsx");
const home = read("src/components/brilliant/app/school-home.tsx");
const css = read("src/app/globals.css");
const tiers = read("schools/leagues/tiers.ts");

const INDEXES = Object.keys(MONTH_THEME).map(Number).sort((a, b) => a - b);
const THEMES = INDEXES.map((i) => MONTH_THEME[i]);

/* ---- colour maths, re-derived ------------------------------------------ */

const channels = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = channels(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

const toLab = (hex: string): [number, number, number] => {
  const [r, g, b] = channels(hex).map(toLinear);
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X / 0.95047), f(Y), f(Z / 1.08883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

/** CIEDE2000. Below ~2.3 two colours are the same colour to the eye. */
function deltaE(h1: string, h2: string): number {
  const [L1, a1, b1] = toLab(h1);
  const [L2, a2, b2] = toLab(h2);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360;
  const h2p = ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbp += hbp < 360 ? 360 : -360;
    hbp /= 2;
  }
  const T =
    1 -
    0.17 * Math.cos(((hbp - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * hbp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * hbp + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * hbp - 63) * Math.PI) / 180);
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin((2 * dTh * Math.PI) / 180) * Rc;
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

/** Viénot/Brettel tritanopia, the confusion this palette actually falls to. */
function tritan(hex: string): string {
  const [r, g, b] = channels(hex).map(toLinear);
  const R = 1.255528 * r - 0.076749 * g - 0.178779 * b;
  const G = -0.078411 * r + 0.930809 * g + 0.147602 * b;
  const B = 0.004733 * r + 0.691367 * g + 0.3039 * b;
  const enc = (v: number) => {
    const s = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, s)) * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${enc(R)}${enc(G)}${enc(B)}`;
}

/* The two page grounds, straight out of `--color-sx-page`. */
const PAGE_LIGHT = "#f5f3f1";
const PAGE_DARK = "#141414";

/* -------------------------------------------------------------------------- */

describe("the registry is complete and resolvable", () => {
  it("covers all nine months, September to May", () => {
    expect(INDEXES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const [key, theme] of Object.entries(MONTH_THEME)) {
      expect(theme.index, `month ${key} index`).toBe(Number(key));
    }
  });

  it("falls back rather than returning nothing for an unknown month", () => {
    /* The same rule `monthArt()` follows, and for the same reason: the failure
       mode of a bare index in a React render is a blank page for a learner. */
    expect(monthTheme(1)).toBe(MONTH_THEME[1]);
    expect(monthTheme(99)).toBe(NEUTRAL_THEME);
    expect(monthTheme(0)).toBe(NEUTRAL_THEME);
    expect(monthTheme(-1)).toBe(NEUTRAL_THEME);
  });

  it("resolves a deck card's month from its id, and nothing else", () => {
    expect(monthThemeFromDeckId("month-2")).toBe(MONTH_THEME[2]);
    /* The reverse-engineering baseline's cards are courses. They must resolve
       to NOTHING rather than to month 1, or the baseline changes colour. */
    expect(monthThemeFromDeckId("thinking-in-code")).toBeNull();
    expect(monthThemeFromDeckId("month-12")).toBeNull();
    expect(monthThemeFromDeckId("month-")).toBeNull();
  });

  it("names every month exactly as the curriculum names it", () => {
    /* The registry keeps its own copy of the month name so a surface holding
       only an index can say what a glyph means. A copy is only safe while it is
       checked: rename a month in the manifest and this fails here instead of
       drifting quietly onto a board. */
    for (const month of MONTHS) {
      expect(MONTH_THEME[month.index].name, `month ${month.index}`).toEqual(
        month.monthName,
      );
    }
  });
});

describe("identity does not rest on colour", () => {
  /**
   * The load-bearing pair of assertions.
   *
   * Colour cannot carry nine months — the numbers below prove it every time
   * this runs — so the identity has to be carried by shape. Both halves are
   * asserted: that the shapes are all different, and that no accent is ever
   * painted without one.
   */
  it("gives every month a glyph, and no two months the same glyph", () => {
    const ids = THEMES.map((t) => t.glyph.id);
    const paths = THEMES.map((t) => t.glyph.path);
    expect(new Set(ids).size, `glyph ids: ${ids.join(",")}`).toBe(9);
    expect(new Set(paths).size).toBe(9);
    for (const theme of THEMES) {
      /* A closed filled path, not a stroke that a `currentColor` change could
         erase and not an empty string that renders as nothing. */
      expect(theme.glyph.path, `month ${theme.index}`).toMatch(/^M[\d .,\-A-Za-z]+[zZ]$/);
      expect(theme.glyph.id).toMatch(/^[a-z]+$/);
    }
  });

  it("keeps each month on the glyph it was assigned", () => {
    /* Distinctness is not enough, and this assertion exists because the weaker
       one let a real defect through: a careless edit swapped September's disc
       with January's asterisk, all nine stayed unique, the suite stayed green,
       and the board shipped September wearing January's mark. A glyph is an
       identity, so the mapping is pinned, not just the uniqueness of it. */
    expect(THEMES.map((t) => t.glyph.id)).toEqual([
      "disc",
      "triangle",
      "square",
      "cross",
      "asterisk",
      "chevron",
      "diamond",
      "droplet",
      "star",
    ]);
  });

  it("gives every month a different picture as well as a different glyph", () => {
    /* The third carrier, and the one that was already shipping. If two months
       ever share artwork, the numeral and the glyph are all that is left. */
    const art = Object.values(MONTH_ART).map((a) => a.src);
    expect(new Set(art).size).toBe(art.length);
  });

  it("measures the collapse it is designed around, in both arms", () => {
    /* Not decoration: this is the evidence for the glyph being mandatory. If a
       future palette were somehow tritan-safe, this test would say so loudly
       rather than pretending the constraint still holds. */
    const report: string[] = [];
    for (const arm of ["light", "dark"] as const) {
      const hexes = THEMES.map((t) => t.accent[arm]);
      let normal = Infinity;
      let deficient = Infinity;
      for (let a = 0; a < hexes.length; a++) {
        for (let b = a + 1; b < hexes.length; b++) {
          normal = Math.min(normal, deltaE(hexes[a], hexes[b]));
          deficient = Math.min(deficient, deltaE(tritan(hexes[a]), tritan(hexes[b])));
        }
      }
      report.push(`${arm}: normal ${normal.toFixed(1)} / tritan ${deficient.toFixed(1)}`);
      /* Normal vision: the pairs are genuinely separated, so the accent is
         worth painting at all. */
      expect(normal, `${arm} arm, normal vision`).toBeGreaterThan(6);
      /* Tritanopia: they are not. This is why `glyph` is a required field. */
      expect(deficient, `${arm} arm, tritanopia — ${report.join("; ")}`).toBeLessThan(4);
    }
  });

  it("paints no accent without also rendering the glyph", () => {
    /* Mechanical version of the rule. Both surfaces that set the month's
       custom properties must import the mark that goes with them. */
    for (const [name, src] of [
      ["course-gameboard.tsx", board],
      ["course-deck.tsx", deck],
    ] as const) {
      expect(src, name).toContain("monthThemeVars");
      expect(src, name).toMatch(/from "(\.\.\/gameboard\/month-glyph|\.\/month-glyph)"/);
    }
    /* And the mark itself must announce WHICH silhouette it is, so a browser
       check can read it off the DOM instead of guessing from a fill. */
    expect(glyphComponent).toContain("data-month-glyph");
  });
});

describe("the accents were measured, not eyeballed", () => {
  it("stays legible as ink on its own page in both arms", () => {
    for (const theme of THEMES) {
      expect(theme.accent.light, `month ${theme.index} light`).toMatch(/^#[0-9a-f]{6}$/);
      expect(theme.accent.dark, `month ${theme.index} dark`).toMatch(/^#[0-9a-f]{6}$/);
      expect(
        contrast(theme.accent.light, PAGE_LIGHT),
        `month ${theme.index} light accent on the light page`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(theme.accent.dark, PAGE_DARK),
        `month ${theme.index} dark accent on the dark page`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("carries ink that survives on a filled accent", () => {
    /* `onAccent` is the whole reason that field exists. A month chip is a
       filled tile with a numeral and a glyph on it; if this floor slips, the
       numeral — one of the three non-colour carriers — disappears. */
    for (const theme of THEMES) {
      expect(
        contrast(theme.onAccent.light, theme.accent.light),
        `month ${theme.index} light ink`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(theme.onAccent.dark, theme.accent.dark),
        `month ${theme.index} dark ink`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives consecutive months more separation than the palette's floor", () => {
    /* The pair a learner sees together most often is a month and the one after
       it — on the deck's thumbnail rail they are literally adjacent. A palette
       can have an acceptable global minimum and still put September beside a
       near-identical October, so the neighbours get their own, much higher
       floor: 20 ΔE2000, about eight times the ~2.3 just-noticeable difference,
       which is "a different colour" rather than "a slightly different shade". */
    for (const arm of ["light", "dark"] as const) {
      for (let i = 1; i < 9; i++) {
        expect(
          deltaE(MONTH_THEME[i].accent[arm], MONTH_THEME[i + 1].accent[arm]),
          `${arm}: month ${i} vs ${i + 1}`,
        ).toBeGreaterThan(20);
      }
    }
  });
});

describe("month colour is identity; verdict colour is status", () => {
  it("keeps the month accent out of every surface that reports a verdict", () => {
    /* The containment rule. Nine months over one wheel cannot dodge green,
       amber and rose — March IS green — so the separation is contextual, and
       this is the mechanical form of it. A month accent reaching a lesson
       surface would put a second meaning on the colour that says "accepted". */
    const lesson = execSyncGrep("src/components/brilliant/lesson");
    expect(lesson, `files referencing the month accent: ${lesson.join(", ")}`).toEqual([]);
  });

  it("leaves the verdict tokens untouched", () => {
    for (const token of [
      "--color-sx-correct:",
      "--color-sx-wrong:",
      "--color-sx-partial:",
      "--color-b-ok-fill:",
      "--color-b-warn-fill:",
    ]) {
      expect(css, token).toContain(token);
    }
    /* No month theme may be reached from a token in the global block. Those are
       for every surface; these are for month surfaces only. */
    expect(css).not.toContain("--color-sx-month");
    expect(css.match(/--sx-month-accent/g)).toBeNull();
  });

  it("keeps the completion tick green, not the month's colour", () => {
    /* The one place the two systems meet. A finished node's DISC takes the
       month accent — that is identity, "this is September's board" — while the
       tick beside its label stays `b-green`, because it means "done" and must
       mean that in all nine months. Recolouring it per month would be the exact
       ambiguity this suite exists to prevent. */
    expect(milestone).toContain("text-b-green");
    expect(milestone).not.toContain("--sx-month");
  });
});

describe("league tiers stay independent of months", () => {
  it("has no import in either direction", () => {
    /* October being orange must not make a tier orange, and Apex going gold
       must not move May. Independence is structural, not a convention. */
    expect(registry).not.toMatch(/from "[^"]*leagues/);
    expect(tiers).not.toMatch(/month-theme/);
  });

  it("does not reuse a month accent as a tier colour", () => {
    for (const theme of THEMES) {
      expect(tiers, `month ${theme.index}`).not.toContain(theme.accent.light);
      expect(tiers).not.toContain(theme.accent.dark);
    }
  });
});

describe("the light-theme defects this registry replaced stay fixed", () => {
  it("no longer writes white text on the white page's level headers", () => {
    /* `rgba(255,255,255,0.6)` on the eyebrow of every non-current level header:
       invisible on a light page, and the header is how a learner knows which
       unit they are scrolling through. */
    expect(board).not.toContain('"rgba(255,255,255,0.6)"');
    expect(board).toContain("var(--color-b-text-2)");
  });

  it("no longer paints the header slab with two dark-arm literals", () => {
    expect(board).not.toContain("HEADER_SHADOW_ACTIVE");
    expect(board).not.toContain('"#4C4C4C"');
    expect(board).toContain("var(--sx-month-accent, #7139CC)");
    expect(board).toContain("var(--color-b-edge)");
  });

  it("no longer rings a lit milestone in near-black on a white page", () => {
    expect(pedestal).not.toContain('stroke="#0C0912"');
    expect(pedestal).toContain("var(--color-b-trench)");
    /* The token's dark arm must still BE the literal, or the reference baseline
       silently changed. */
    expect(css).toMatch(/--color-b-trench:\s*light-dark\([^,]+,\s*#0c0912\)/);
  });

  it("no longer punches a black hole through the review node's selection", () => {
    expect(pedestal).not.toContain('fill="#141414"');
    expect(pedestal).toContain('fill="var(--color-b-bg)"');
  });

  it("no longer hardcodes the deck's selected month and month name", () => {
    expect(deck).not.toContain('"border-[#7139CC] bg-[#170B29]"');
    expect(deck).not.toContain("text-[#7139CC]");
    expect(deck).not.toMatch(/className=.*#7139CC/);
    expect(home).not.toContain('markerColor="#a78bfa"');
  });
});

describe("the reverse-engineering baseline is untouched", () => {
  it("gives every month variable the literal it replaced as its fallback", () => {
    /* `/brilliant/*` never sets these properties. Every read of one must
       therefore name what it used to be, or the measurement baseline renders
       with a missing colour the moment this lands. */
    for (const [name, src] of [
      ["course-gameboard.tsx", board],
      ["sx-pedestal.tsx", pedestal],
      ["course-deck.tsx", deck],
      ["month-glyph.tsx", glyphComponent],
      ["school-home.tsx", home],
    ] as const) {
      const reads = src.match(/var\(--sx-month-[a-z-]+[^)]*/g) ?? [];
      for (const r of reads) {
        expect(r, `${name}: ${r} has no fallback`).toMatch(/var\(--sx-month-[a-z-]+,\s*\S/);
      }
    }
  });

  it("keeps the reference's four purple flats as the pedestal's fallback", () => {
    /* The existing milestone suite asserts these three appear in the file. They
       must appear as the DEFAULT arm of the variables — not merely somewhere in
       a comment — or an unthemed disc is a different object. */
    expect(pedestal).toContain("var(--sx-month-rim, #7E43E0)");
    expect(pedestal).toContain("var(--sx-month-facet, #9D62FF)");
    expect(pedestal).toContain("var(--sx-month-face, #C19CFF)");
  });

  it("emits five scoped properties and no global token", () => {
    const vars = monthThemeVars(MONTH_THEME[2]);
    expect(Object.keys(vars).sort()).toEqual([
      "--sx-month-accent",
      "--sx-month-face",
      "--sx-month-facet",
      "--sx-month-on-accent",
      "--sx-month-rim",
    ]);
    /* Hex inside `light-dark()`, the way the ~82 neighbours in globals.css are
       authored — not a raw oklch, and not one value for both themes. */
    expect(vars["--sx-month-accent"]).toBe("light-dark(#9f4600, #ffab6a)");
    expect(vars["--sx-month-facet"]).toContain("color-mix(in oklab, var(--sx-month-accent)");
  });
});

/** Files under a directory that reference the month accent. */
function execSyncGrep(dir: string): string[] {
  const out = execSync(
    `grep -rl -- '--sx-month\\|month-theme' ${JSON.stringify(join(ROOT, dir))} || true`,
    { encoding: "utf8" },
  );
  return out.split("\n").filter(Boolean);
}
