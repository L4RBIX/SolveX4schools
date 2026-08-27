import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { L } from "@schools/presentation/labels";

/**
 * What the product screen is allowed to contain.
 *
 * Three separate promises are asserted here, all of which were broken at some
 * point during this build and all of which look fine in a browser when they
 * break again:
 *
 *   1. Every visible string exists in both languages.
 *   2. No production surface reaches into the reverse-engineering baseline for
 *      its data — that is where the invented streaks, the fabricated
 *      testimonials and the hardcoded chart live.
 *   3. No production surface loads a commercially licensed font.
 *
 * The scan is over source text rather than a rendered DOM on purpose: it costs
 * nothing, it runs in CI, and the failure mode it guards is someone adding one
 * English literal to one component six months from now.
 */

const ROOT = join(import.meta.dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

/* The product's own surfaces. Everything under `src/components/brilliant/about`,
   `/faq`, `/wiki`, `/subject*` and `src/components/elice` is the measurement
   baseline and is deliberately excluded — it renders only under
   `/brilliant/*`, which 404s in production. */
const PRODUCT_FILES = [
  "src/app/page.tsx",
  "src/app/home/page.tsx",
  "src/app/program/page.tsx",
  "src/app/you/page.tsx",
  "src/app/schools/page.tsx",
  "src/app/course/[index]/page.tsx",
  "src/app/lesson/[lessonId]/page.tsx",
  ...walk(join(ROOT, "src/components/nova")).map((f) => relative(ROOT, f)),
  ...walk(join(ROOT, "src/components/brilliant/app")).map((f) => relative(ROOT, f)),
  ...walk(join(ROOT, "src/components/brilliant/lesson")).map((f) => relative(ROOT, f)),
  ...walk(join(ROOT, "src/components/brilliant/gameboard")).map((f) => relative(ROOT, f)),
];

const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("every label ships in both languages", () => {
  /* `L` holds a few helpers alongside the strings (`hiddenTests(n)` builds its
     sentence from a count). Only the plain localised pairs are scanned. */
  const entries: [string, { kk: string; ru: string }][] = [];
  for (const [key, value] of Object.entries(L as Record<string, unknown>)) {
    if (typeof value === "object" && value !== null && "kk" in value) {
      entries.push([key, value as { kk: string; ru: string }]);
    }
  }

  it("has more than a handful of them, so this test is actually scanning something", () => {
    expect(entries.length).toBeGreaterThan(60);
  });

  it("never leaves a language empty", () => {
    const missing = entries.filter(([, v]) => !v.kk?.trim() || !v.ru?.trim());
    expect(missing.map(([k]) => k)).toEqual([]);
  });

  it("never falls back to the other language by copying it", () => {
    /* A Kazakh string identical to the Russian one is almost always an untranslated
       placeholder. The exceptions are real and enumerated: a brand name, a unit
       abbreviation both languages share, and technical syntax.
     *
     * The five loanwords below are shared in the same way. Kazakh takes
     * `аккаунт`, `сессия`, `практика` and `авто` from Russian unchanged, and
     * writing a calque instead would be worse Kazakh, not better. They are
     * listed one at a time rather than as a wildcard so that the next label
     * that merely LOOKS like one still fails — which is how `prefAppearance`
     * was caught: it sat in this same group holding the Russian «Оформление»
     * while every label around it was properly Kazakh. */
    const shared = new Set([
      "brand",
      "minutes",
      "hours",
      "navYou",
      "footerAccount",
      "settingsAccount",
      "accountSession",
      "aboutFigPractice",
      "prefAuto",
    ]);
    const copied = entries
      .filter(([k, v]) => !shared.has(k) && v.kk === v.ru)
      .map(([k]) => k);
    expect(copied).toEqual([]);
  });

  it("carries the Kazakh letters the Russian alphabet does not have", () => {
    // `cyrillic` alone omits Ә Ғ Қ Ң Ө Ұ Ү Һ І, which is why the font subsets in
    // src/app/layout.tsx request `cyrillic-ext`. If no label uses them, that
    // request is unverified and a missing glyph would ship as a tofu box.
    const kk = entries.map(([, v]) => v.kk).join("");
    expect(/[ӘҒҚҢӨҰҮҺІәғқңөұүһі]/.test(kk)).toBe(true);
  });
});

describe("production surfaces do not read from the reverse-engineering baseline", () => {
  /* These modules hold the reference's own account data: a five-day streak, an
     11-question week, two named strengths with hardcoded counts, a seven-bar
     chart. Every number in them belongs to whoever's account was open during
     the reverse-engineering session. */
  const BASELINE_DATA = [
    "app/app-data",
    "app/paths-data",
    "gameboard/course-data",
    "app/you-dashboard",
    "school-landing",
  ];

  it("imports none of them", () => {
    const offenders: string[] = [];
    for (const file of PRODUCT_FILES) {
      const src = read(file);
      for (const mod of BASELINE_DATA) {
        const bare = mod.split("/").pop()!;
        // A default value inside a shared component is fine — that is what keeps
        // /brilliant/app/* rendering. An IMPORT from a product page is not.
        if (new RegExp(`from\\s+"[^"]*${bare}"`).test(src) && file.startsWith("src/app/")) {
          offenders.push(`${file} -> ${mod}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("routes /you at the product dashboard, not the clone of Brilliant's", () => {
    const page = read("src/app/you/page.tsx");
    expect(page).toContain("SchoolYou");
    expect(page).not.toContain("YouDashboard");
  });
});

describe("commercially licensed fonts stay out of the product", () => {
  it("declares CoFo only inside the baseline layout", () => {
    const baseline = read("src/app/brilliant/layout.tsx");
    expect(baseline).toContain("cofo_brilliant");
    // …and that layout refuses to render in production at all.
    expect(baseline).toContain('process.env.NODE_ENV === "production"');
    expect(baseline).toContain("notFound()");
  });

  it("keeps the root layout free of them", () => {
    const root = read("src/app/layout.tsx");
    expect(root).not.toContain("cofo_brilliant");
    expect(root).not.toContain("cofo_robert");
  });

  it("keeps the files out of public/, which is served whether or not a page links it", () => {
    const baseline = read("src/app/brilliant/layout.tsx");
    expect(baseline).toContain("reference/fonts/");
    expect(baseline).not.toMatch(/public\/assets\/original[^"]*cofo/);
  });

  it("falls back to a licensed family wherever the CoFo variable is undefined", () => {
    const css = read("src/app/globals.css");
    expect(css).toContain("--font-b-sans: var(--font-cofo-brilliant, var(--font-plex-sans))");
  });
});

describe("the product does not ship Brilliant's mascot", () => {
  /* Two modules under these directories are reachable ONLY from `/brilliant/*`
     and keep Koji on purpose, because they are the measurement baseline:
       lesson-player.tsx   — the reference player at /brilliant/lesson
       koji.tsx            — its dock
       you-dashboard.tsx   — the reference /brilliant/app/you, which the product
                             replaced with school-you.tsx
     `gameboard-pedestal.tsx` is shared: it still contains the Rive path for the
     baseline, and every product caller passes `ownMascot` to take the other
     branch. That flag is asserted below rather than assumed. */
  const BASELINE_ONLY = new Set([
    "src/components/brilliant/lesson/lesson-player.tsx",
    "src/components/brilliant/lesson/koji.tsx",
    "src/components/brilliant/app/you-dashboard.tsx",
    "src/components/brilliant/gameboard/gameboard-pedestal.tsx",
  ]);

  it("never imports or renders Koji outside the baseline components", () => {
    const rendering = PRODUCT_FILES.filter(
      (f) =>
        !BASELINE_ONLY.has(f) &&
        /(<Koji|koji[-_.][\w.-]*\.(riv|svg|png)|from "[^"]*koji)/i.test(read(f)),
    );
    expect(rendering).toEqual([]);
  });

  it("takes the product branch of the shared pedestal on the school gameboard", () => {
    // The reference branch fires `koji_appear` on the learner's current node.
    // Without this prop the mascot standing on the board is Brilliant's.
    expect(read("src/components/brilliant/gameboard/month-board.tsx")).toMatch(
      /ownMascot/,
    );
  });

  it("recolours the deck's active marker away from Brilliant's green", () => {
    // #29CC57 is the reference's. Green also means "correct" in this player, so
    // a permanent green gem on the current lesson congratulates a learner for
    // arriving.
    const home = read("src/components/brilliant/app/school-home.tsx");
    expect(home).toMatch(/markerColor=/);
    expect(home).not.toContain("#29CC57");
  });

  it("drives the avatar through semantic states, never a raw animation name", () => {
    /* The model must never be able to pick the mascot's animation. Product code
       says `state="thinking"`; only `NOVA_ANIMATION` knows that maps to a key in
       the definition file. */
    const consumers = PRODUCT_FILES.filter((f) => read(f).includes("<NovaAvatar"));
    expect(consumers.length).toBeGreaterThan(0);
    for (const f of consumers) {
      expect(read(f), f).not.toMatch(/<NovaAvatar[^>]*\banimation=/);
    }
  });
});
