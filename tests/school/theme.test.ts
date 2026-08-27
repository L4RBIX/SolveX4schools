import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The theme.
 *
 * A theme regression is invisible in a unit test and glaring on a projector, so
 * what is asserted here is the *mechanism* rather than a rendered colour: that
 * every themed token is authored once, that the three selectors exist, that the
 * baseline is pinned, and that no product component still hardcodes white.
 */

const ROOT = join(import.meta.dirname, "../..");
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

describe("the three theme states", () => {
  it("follows the operating system when nothing is stamped", () => {
    /* The un-stamped state is the common one — a viewer who has never opened
       preferences — so it must resolve on its own rather than defaulting to
       whichever arm happens to be written first. */
    expect(css).toMatch(/:root\s*\{[^}]*color-scheme:\s*light dark/);
  });

  it("honours an explicit choice in both directions", () => {
    expect(css).toMatch(/:root\[data-theme="light"\]\s*\{[^}]*color-scheme:\s*light/);
    expect(css).toMatch(/:root\[data-theme="dark"\]\s*\{[^}]*color-scheme:\s*dark/);
  });

  it("pins the reverse-engineering baseline to dark", () => {
    // /brilliant/* exists to be compared against screenshots of the original,
    // which is dark. Letting it follow a viewer preference would make the one
    // thing it is for depend on an OS setting.
    expect(css).toMatch(/\[data-site="brilliant"\]\s*\{[^}]*color-scheme:\s*dark/);
  });
});

describe("tokens are authored once", () => {
  it("uses light-dark() rather than two blocks of overrides", () => {
    // Two copies of every token drift the first time somebody edits one.
    const pairs = css.match(/--color-b-[a-z0-9-]+:\s*light-dark\(/g) ?? [];
    expect(pairs.length).toBeGreaterThan(40);
  });

  it("gives the page ground and the card surface different light values", () => {
    /* In dark they are the same colour and a 2px rule does the separating —
       that is how the reference is built. On a light surface a hairline alone
       reads flat, so the two diverge. */
    expect(css).toContain("--color-sx-page: light-dark(#f5f3f1,");
    expect(css).toContain("--color-b-bg: light-dark(#ffffff,");
  });

  it("moves the ink token, which is what carries the opacity utilities across", () => {
    expect(css).toMatch(/--color-b-fg:\s*light-dark\(#16181d,\s*#ffffff\)/);
  });

  it("defines the semantic vocabulary the rest of the app can use", () => {
    for (const token of [
      "--surface-page",
      "--surface-raised",
      "--surface-card",
      "--surface-interactive",
      "--surface-code",
      "--border-subtle",
      "--border-strong",
      "--text-primary",
      "--text-secondary",
      "--text-muted",
      "--accent",
      "--accent-soft",
      "--success",
      "--warning",
      "--danger",
      "--shadow-soft",
      "--shadow-raised",
    ]) {
      expect(css, token).toContain(`${token}:`);
    }
  });
});

describe("motion", () => {
  it("lets an explicit preference beat the operating system", () => {
    /* A learner who turns motion ON on a machine configured to reduce it must
       get motion; a learner who turns it OFF on a machine that does not must
       not. Both directions, or the setting is decorative. */
    expect(css).toContain('data-motion="reduce"');
    expect(css).toContain('html:not([data-motion="full"])');
  });
});

describe("no product component hardcodes white", () => {
  /* 206 `text-white/60` and 88 `border-white/20` were invisible on a light
     surface. They became `b-fg`, which the theme moves. The baselines keep
     literal white on purpose — they are pinned to dark. */
  const BASELINE = [
    "src/components/brilliant/about/",
    "src/components/brilliant/faq/",
    "src/components/brilliant/wiki/",
    "src/components/brilliant/subject/",
    "src/components/elice/",
    "src/app/brilliant/",
    "src/components/brilliant/lesson/lesson-player.tsx",
    "src/components/brilliant/lesson/koji.tsx",
    "src/components/brilliant/app/you-dashboard.tsx",
  ];

  it("uses the ink token instead", async () => {
    const { readdirSync, statSync } = await import("node:fs");
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.tsx?$/.test(full)) continue;
        const rel = full.slice(ROOT.length + 1);
        if (BASELINE.some((b) => rel.startsWith(b))) continue;
        const src = readFileSync(full, "utf8");
        if (/\b(text|bg|border)-white(\/\d+)?\b/.test(src)) offenders.push(rel);
      }
    };
    walk(join(ROOT, "src"));

    expect(offenders).toEqual([]);
  });
});

describe("no theme flash", () => {
  it("stamps <html> from a synchronous inline script before first paint", () => {
    /* Applying a theme from an effect paints one frame of the wrong palette.
       On a classroom projector that is a white flash, and it is the single
       most obvious "unfinished" tell a product can have. */
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layout).toContain("PREFERENCES_BOOT_SCRIPT");
    expect(layout).toContain("dangerouslySetInnerHTML");
    expect(layout).toContain("suppressHydrationWarning");
  });

  it("wraps every storage access, because school machines block site data", () => {
    const prefs = readFileSync(
      join(ROOT, "src/components/sx/preferences.tsx"),
      "utf8",
    );
    const script = prefs.slice(prefs.indexOf("PREFERENCES_BOOT_SCRIPT"));
    expect(script).toContain("try{");
    expect(script).toContain("catch(e){}");
  });
});
