import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "@schools/curriculum/types";
import { FIRST_TIER, LAST_TIER, LEAGUE_TIERS } from "@schools/leagues/tiers";
import { MIN_GROUP_FOR_MOVEMENT, zonesFor } from "@schools/leagues/standings";
import { LEAGUE_UI, leagueGroupSizeLabel, leagueRemainingLabel } from "@schools/presentation/labels";
import { EMBLEM_IDEAS } from "@/components/brilliant/app/league/tier-emblem";

/**
 * The recomposed `/league`.
 *
 * The page was rebuilt from a hero-over-a-sidebar into four full-width bands,
 * and the rebuild was driven by things that had been MEASURED on the live page
 * rather than by taste: a horizontal overflow at 768, a countdown truncating to
 * «4 дня …» at 375, roughly 350px of dead column at 1440, and a board on which
 * exactly one zone label was ever drawn so that a learner at rank 7 was told
 * nothing about their week.
 *
 * There is no React test renderer in this repository — `home-card.test.ts`
 * records why — so the component is pinned by source scan and by the browser
 * run in the change notes. What CAN be asserted directly is asserted directly:
 * the countdown's formatting, the copy's completeness, and the engine rules the
 * page claims to be reading rather than restating.
 *
 * These are regression pins, not a description. Each one is a thing that was
 * actually wrong, or a rule whose second copy would drift.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * The same file with its comments removed.
 *
 * Every "must NOT contain" assertion below runs against this rather than
 * against the raw source, and the reason is that these files EXPLAIN the things
 * they are forbidden to do. `school-league.tsx` names the `1fr / 340px` grid it
 * replaced and the `zonesFor` it must never call; `league-parts.tsx` names the
 * rose token it must never use. Scanning raw text turns every one of those
 * paragraphs into a failure and teaches the next person to delete the
 * explanation instead of keeping the rule — which is the worse outcome by a
 * long way. `league-parts.tsx` records having been bitten by exactly this.
 *
 * Strings are preserved, because a forbidden value hidden in one is still the
 * file doing the forbidden thing.
 */
function code(rel: string): string {
  const src = read(rel);
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      out += " ";
    } else if (c === "/" && d === "/") {
      const end = src.indexOf("\n", i);
      i = end === -1 ? src.length : end;
      out += " ";
    } else if (c === '"' || c === "'" || c === "`") {
      /* Copy the whole literal verbatim, honouring escapes, so that a `//`
         inside a URL does not swallow the rest of the line. */
      out += c;
      i += 1;
      while (i < src.length && src[i] !== c) {
        if (src[i] === "\\") {
          out += src[i] + (src[i + 1] ?? "");
          i += 2;
          continue;
        }
        out += src[i];
        i += 1;
      }
      out += c;
      i += 1;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

const DIR = "src/components/brilliant/app/league";
const PAGE = `${DIR}/school-league.tsx`;
const PARTS = `${DIR}/league-parts.tsx`;
const EMBLEM = `${DIR}/tier-emblem.tsx`;
const HOME_CARD = `${DIR}/home-league-card.tsx`;
const LOCALES: Locale[] = ["kk", "ru"];

/* -------------------------------------------------------------------------- */

/**
 * The stripper itself, because everything below leans on it.
 *
 * A "must not contain" assertion that runs against accidentally-empty text
 * passes for the wrong reason and keeps passing forever. So: the stripped
 * output must still balance, must still hold code that is definitely code, and
 * must have actually removed something that is definitely prose.
 */
describe("the comment stripper the scans depend on", () => {
  const FILES = [PAGE, PARTS, EMBLEM, HOME_CARD];

  it("removes prose without eating code", () => {
    for (const rel of FILES) {
      const raw = read(rel);
      const stripped = code(rel);

      /* Something was removed — every one of these files is heavily commented. */
      expect(stripped.length, rel).toBeLessThan(raw.length);
      /* But not so much that the file stopped being a component. */
      expect(stripped.length, rel).toBeGreaterThan(raw.length / 4);
      expect(stripped, rel).toContain("return");

      /* The real guard. A quote inside JSX prose that swallowed the rest of the
         file would show up here immediately as an unbalanced brace. */
      const count = (s: string, ch: string) => s.split(ch).length - 1;
      expect(count(stripped, "{") - count(stripped, "}"), `${rel} braces`).toBe(0);
      expect(count(stripped, "(") - count(stripped, ")"), `${rel} parens`).toBe(0);
    }
  });

  it("keeps string literals, where a forbidden value would still be real", () => {
    /* `data.zones` is code and survives; `340px` exists only in the paragraph
       explaining the grid that was removed, and must not. */
    expect(code(PAGE)).toContain("data.zones");
    expect(read(PAGE)).toContain("340px");
    expect(code(PAGE)).not.toContain("340px");
  });
});

/* -------------------------------------------------------------------------- */

describe("the countdown, which used to be the largest text on the page", () => {
  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;

  it("prints days and hours above a day", () => {
    expect(leagueRemainingLabel(4 * DAY + 18 * HOUR, "ru")).toBe("4 дня 18 ч");
    expect(leagueRemainingLabel(4 * DAY + 18 * HOUR, "kk")).toBe("4 күн 18 сағ");
  });

  it("drops the hours when there are none, rather than printing a zero", () => {
    expect(leagueRemainingLabel(3 * DAY, "ru")).toBe("3 дня");
    expect(leagueRemainingLabel(3 * DAY, "kk")).toBe("3 күн");
  });

  it("prints hours alone under a day", () => {
    expect(leagueRemainingLabel(18 * HOUR, "ru")).toBe("18 ч");
    expect(leagueRemainingLabel(18 * HOUR, "kk")).toBe("18 сағ");
  });

  it("prints minutes alone under an hour", () => {
    expect(leagueRemainingLabel(42 * 60_000, "ru")).toBe("42 мин");
    expect(leagueRemainingLabel(42 * 60_000, "kk")).toBe("42 мин");
  });

  it("inflects the Russian day in all three forms", () => {
    const day = (n: number) => leagueRemainingLabel(n * DAY, "ru");
    expect(day(1)).toBe("1 день");
    expect(day(2)).toBe("2 дня");
    expect(day(5)).toBe("5 дней");
    expect(day(11)).toBe("11 дней");
    expect(day(21)).toBe("21 день");
  });

  /*
   * §44: no manufactured urgency. A ticking clock on a product aimed at
   * fourteen-year-olds pressures them to work NOW rather than to work well,
   * which is the incentive the whole XP model was shaped to avoid. The unit is
   * the enforcement point — a value that cannot be expressed in seconds cannot
   * be animated into a countdown by the next person to touch this file.
   */
  it("never reaches for seconds, at any remaining time", () => {
    for (let ms = 0; ms <= 8 * DAY; ms += 7 * 60_000 + 1) {
      for (const loc of LOCALES) {
        expect(leagueRemainingLabel(ms, loc)).not.toMatch(/сек|сек\.|\bс\b/);
      }
    }
  });

  it("never prints a negative amount when the boundary has passed", () => {
    for (const loc of LOCALES) {
      expect(leagueRemainingLabel(-1, loc)).toBe("0 мин");
      expect(leagueRemainingLabel(-99 * DAY, loc)).toBe("0 мин");
    }
  });

  it("is anchored to a passed-in instant, never to the clock it runs on", () => {
    const src = read(PARTS);
    /* `formatRemaining(endsAt, now, locale)` — `now` is an argument. A
       `Date.now()` inside would make the value re-derive on every paint and
       make the week boundary a client opinion rather than the server's. */
    expect(src).toMatch(/formatRemaining\(\s*endsAt: string,\s*now: number/);
    expect(code(PARTS)).not.toContain("Date.now()");
  });

  it("is not re-rendered on a timer, and is not announced as it changes", () => {
    /* A repaint every second for a string that changes every hour, and a live
       region that interrupts a screen-reader user to say the same thing again. */
    expect(code(PAGE)).not.toContain("setInterval");
    /* The one live region on the page is last week's RESULT, which is news
       that arrives once. The countdown must not have grown a second one. */
    expect(code(PAGE).match(/aria-live/g) ?? []).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */

describe("the copy the recomposition needed", () => {
  const entries = Object.entries(LEAGUE_UI);

  it("carries both languages for every string, so a missing locale cannot ship", () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, value] of entries) {
      for (const loc of LOCALES) {
        expect(value[loc], `${key}.${loc}`).toBeTruthy();
        expect(value[loc].trim(), `${key}.${loc}`).not.toBe("");
      }
    }
  });

  it("says something different in each language, except for the unit", () => {
    for (const [key, value] of entries) {
      /* `XP` is Latin in both, like every other appearance of the unit in the
         product. Everything else being identical would mean an untranslated
         string got past review as a placeholder. */
      if (key === "boardXpCol") continue;
      expect(value.kk, key).not.toBe(value.ru);
    }
  });

  it("uses the same placeholders in both languages", () => {
    const marks = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [key, value] of entries) {
      expect(marks(value.kk), key).toEqual(marks(value.ru));
    }
  });

  /*
   * Russian past participles carry gender and the product holds none for
   * anybody, so «ты поднялся» misgenders roughly half of every class. The
   * league block inside `L` argues it at length; this pins it for the new copy.
   */
  it("keeps the Russian in the present tense, never a gendered participle", () => {
    for (const [key, value] of entries) {
      expect(value.ru, key).not.toMatch(/\b\w+(?:ся|лась|лись|ла|ло)\b(?<!ешься)/);
    }
    expect(LEAGUE_UI.moveUpTo.ru).toBe("Поднимаешься в {name}");
    expect(LEAGUE_UI.moveStay.ru).toBe("Остаёшься в {name}");
  });

  it("names a tier only where a tier is actually being entered", () => {
    /* Relegation deliberately does not name where you land: putting a proper
       noun next to a demotion is what makes the line read as a verdict. */
    expect(LEAGUE_UI.moveDown.ru).not.toContain("{name}");
    expect(LEAGUE_UI.moveDown.kk).not.toContain("{name}");
    expect(LEAGUE_UI.moveUpTo.ru).toContain("{name}");
  });
});

/* -------------------------------------------------------------------------- */

/**
 * «1 участников» was the first sentence the league said to the first child in
 * the class to open a lesson on a Monday.
 *
 * `groupSize` is the number of learners who have earned XP THIS week, so it
 * starts at 1 every Monday and climbs. The hero rendered `{groupSize}` beside a
 * fixed «участников», which is right for 5..20 and wrong at both ends —
 * including the whole of the first morning of every week, and including the
 * group of one that `standings.ts` explicitly contemplates.
 */
describe("the group size, which is 1 on Monday morning", () => {
  it("inflects the Russian noun in all three forms", () => {
    expect(leagueGroupSizeLabel(1, "ru")).toBe("1 участник");
    expect(leagueGroupSizeLabel(2, "ru")).toBe("2 участника");
    expect(leagueGroupSizeLabel(4, "ru")).toBe("4 участника");
    expect(leagueGroupSizeLabel(5, "ru")).toBe("5 участников");
    expect(leagueGroupSizeLabel(18, "ru")).toBe("18 участников");
  });

  it("uses the many-form for the eleven-to-fourteen exception", () => {
    for (const n of [11, 12, 13, 14]) {
      expect(leagueGroupSizeLabel(n, "ru"), String(n)).toBe(`${n} участников`);
    }
  });

  it("inflects on the last digit above twenty, up to the engine's ceiling", () => {
    expect(leagueGroupSizeLabel(21, "ru")).toBe("21 участник");
    expect(leagueGroupSizeLabel(22, "ru")).toBe("22 участника");
    expect(leagueGroupSizeLabel(25, "ru")).toBe("25 участников");
    /* MAX_GROUP_SIZE is 34, so this is a reachable board. */
    expect(leagueGroupSizeLabel(34, "ru")).toBe("34 участника");
  });

  it("does not inflect in Kazakh, which does not inflect after a numeral", () => {
    for (const n of [1, 2, 5, 11, 22, 34]) {
      expect(leagueGroupSizeLabel(n, "kk"), String(n)).toBe(`${n} қатысушы`);
    }
  });

  it("is what the page actually calls, rather than a number beside a fixed noun", () => {
    const src = code(PAGE);
    expect(src).toContain("leagueGroupSizeLabel");
    /* The exact shape of the defect: groupSize interpolated next to a label. */
    expect(src).not.toMatch(/\{data\.groupSize\}\s*\{t\(/);
  });
});

describe("the engine rules the page reads rather than restates", () => {
  it("has no promotion zone at the top of the ladder, which is what the copy claims", () => {
    expect(zonesFor(10, LAST_TIER).promoteThrough).toBe(0);
    /* The board branches on that zero to say why there is no band, instead of
       drawing an empty one. */
    expect(read(PAGE)).toContain("promoteThrough === 0");
    expect(read(PAGE)).toContain("topOfLadder");
  });

  it("has no relegation zone at the bottom of it", () => {
    const z = zonesFor(10, FIRST_TIER);
    expect(z.relegateFrom).toBe(11);
    /* Which is the case that left ranks 3-10 with no label at all on the old
       board: exactly one rule was drawn, between ranks 2 and 3, and everything
       below it was unlabelled. */
    expect(z.promoteThrough).toBe(2);
  });

  it("moves nobody below the engine's own minimum, and the page reads that constant", () => {
    for (let size = 1; size < MIN_GROUP_FOR_MOVEMENT; size++) {
      const z = zonesFor(size, 5);
      expect(z.promoteThrough).toBe(0);
      expect(z.relegateFrom).toBe(size + 1);
    }
    expect(zonesFor(MIN_GROUP_FOR_MOVEMENT, 5).promoteThrough).toBeGreaterThan(0);

    const src = read(PAGE);
    expect(src).toContain("MIN_GROUP_FOR_MOVEMENT");
    /* A literal four here would be a second copy of a rule that lives in
       `standings.ts`, and the two would disagree the first time it moved. */
    expect(code(PAGE)).not.toMatch(/groupSize\s*[<>]=?\s*4\b/);
  });

  it("never works the zones out for itself", () => {
    const src = read(PAGE);
    /* The boundary is a settlement rule. A client that recomputes it is a
       second implementation of it, and the two drift silently — the board
       would say "you are promoting" for a week that settles otherwise. */
    expect(code(PAGE)).not.toContain("zonesFor");
    expect(src).toContain("data.zones");
  });

  it("reads the unlock threshold from its one definition", () => {
    const src = read(PAGE);
    expect(src).toContain("LEAGUE_UNLOCK_XP");
    expect(code(PAGE)).not.toMatch(/\b175\b/);
  });

  it("prints the XP amounts from the shipped policy, not from a copy in the view", () => {
    const src = read(PAGE);
    expect(src).toContain("data.policy.amounts");
    /* The four headline amounts (+10, +5, +25, +80) must appear on screen
       having been READ, so none of them may be written here as a literal. */
    for (const n of [10, 5, 25, 80]) {
      expect(code(PAGE)).not.toMatch(new RegExp(`\\+${n}\\b`));
    }
  });
});

/* -------------------------------------------------------------------------- */

describe("the emblems, which are the page's signature", () => {
  it("draws every tier the ladder actually has", () => {
    expect(LEAGUE_TIERS).toHaveLength(LAST_TIER);
    for (const t of LEAGUE_TIERS) {
      expect(EMBLEM_IDEAS[t.tier], `tier ${t.tier}`).toBeTruthy();
    }
  });

  it("gives each one a different idea, so no two are the same drawing", () => {
    const ideas = LEAGUE_TIERS.map((t) => EMBLEM_IDEAS[t.tier]);
    expect(new Set(ideas).size).toBe(LEAGUE_TIERS.length);
  });

  it("carries identity by shape and numeral, not by hue alone", () => {
    const src = read(EMBLEM);
    /* Ten oklch steps cannot separate ten tiers; adjacent ones are close by
       construction. The numeral is a separate export for exactly that reason. */
    expect(src).toContain("export function TierOrdinal");
    /* Every emblem inherits `currentColor`, so a state change is one colour
       rather than ten path rewrites. */
    expect(src).toContain('stroke="currentColor"');
  });

  it("drives tier colour off `hue` through a custom property, never a second palette", () => {
    for (const rel of [EMBLEM, PAGE]) {
      const src = read(rel);
      expect(src, rel).toContain("--tier-hue");
      /* A raw hex is a colour on one theme only, and this product has two.
         `tests/school/theme.test.ts` enforces it across `src/`; this says it
         again where the temptation is highest. */
      expect(code(rel), rel).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  /*
   * `TierBadge` rendered `01` in a rounded box — a numeral in a container, in
   * ten hues that adjacent tiers cannot be told apart by. It was the thing the
   * brief called a placeholder, and it is gone from every caller.
   */
  it("has replaced the old numeral-in-a-box badge everywhere", () => {
    for (const rel of [PAGE, HOME_CARD]) {
      expect(read(rel), rel).toContain("TierEmblem");
    }
    /* The component is deleted, not merely unused: the only surviving mention
       is the paragraph in `league-parts.tsx` explaining why. */
    expect(code(PARTS)).not.toMatch(/export function TierBadge/);
    expect(code(HOME_CARD)).not.toMatch(/\bTierBadge\b/);
  });
});

/* -------------------------------------------------------------------------- */

describe("the layout defects that were measured on the live page", () => {
  it("has no sidebar column left to leave 350px of nothing beside it", () => {
    /* The `1fr / 340px` split was the direct cause: the left column ended at
       the XP card around y1000 while the right ran to y1350. */
    expect(code(PAGE)).not.toMatch(/lg:grid-cols-\[[^\]]*340px/);
    expect(code(PAGE)).not.toContain("340px");
  });

  it("lets every long string wrap instead of pushing the card open", () => {
    const src = read(PAGE);
    /* The four 30px stats in one `sm:flex` row did not fit 664px of card at
       768, which is where the horizontal overflow came from — and at 375 the
       same row truncated the countdown and pushed the movement sentence past
       the right edge. Both now sit in `min-w-0` boxes and wrap. */
    expect(src).toContain("break-words");
    expect(src).toContain("flex-wrap");
    /* A tier name must never end in an ellipsis: `Singularity` is one long
       word and it is somebody's own league. */
    expect(code(PAGE)).not.toMatch(/truncate[^"]*"\s*\n?\s*>\s*\n?\s*\{tier\.name\}/);
  });

  it("scrolls the tier road and nothing else, and says that it can", () => {
    const src = read(PAGE);
    expect(src).toContain("overflow-x-auto");
    /* The old strip clipped in silence, so a learner at 375 saw three tiers and
       no reason to think there were seven others. */
    expect(src).toContain("linear-gradient(to_left");
    /* Never on the page itself. Blanket-hiding the overflow would have buried
         the 768 bug instead of fixing it. */
    expect(code(PAGE)).not.toMatch(/<main[^>]*overflow-hidden/);
  });

  /**
   * The road auto-centres the learner's tier, so for every tier above the
   * first it opens with road hidden to the LEFT — and the fade used to exist
   * only on the right. Measured in the browser at 375: tier 5 hid 253px to the
   * left and 340px to the right with one right-hand fade; tier 10 hid 593px to
   * the left and nothing at all to the right, and still drew that fade on the
   * right. The end of the road was marked and the missing beginning was not.
   */
  it("marks BOTH ends of the tier road, because it opens scrolled into the middle", () => {
    const src = code(PAGE);
    expect(src).toContain("linear-gradient(to_left");
    expect(src).toContain("linear-gradient(to_right");
  });

  /**
   * And it decides from the strip's own scroll offset rather than from a
   * breakpoint. `lg:hidden` was a guess at when all ten tiers fit and it was
   * off by about 35px: between roughly 988 and 1023 the road was complete and
   * a fade was still painted over `Singularity`, claiming more road that was
   * not there.
   */
  it("decides the fades from measured scroll, never from a breakpoint", () => {
    const src = code(PAGE);
    expect(src).toMatch(/scrollLeft/);
    expect(src).toMatch(/scrollWidth\s*-\s*\w+\.clientWidth/);
    /* The specific regression: a fade whose visibility is a media query. */
    expect(src).not.toMatch(/pointer-events-none[^"]*lg:hidden/);
  });
});

/* -------------------------------------------------------------------------- */

describe("what a screen reader and a still-image reader get", () => {
  it("marks the learner's own row and their own tier", () => {
    expect(code(PAGE).match(/aria-current/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    /* Both the board and the road are ordered lists, because both are
       positions — which is what `<ol>` means. */
    expect(code(PAGE).match(/<ol\b/g) ?? []).toHaveLength(2);
  });

  it("never says which way a row is going with colour alone", () => {
    const src = read(PARTS);
    /* A glyph, a colour AND a sentence, every time. 8% of boys are red-green
       colourblind and this is a class of eighteen. */
    expect(src).toContain("sr-only");
    expect(src).toMatch(/glyph: "▲"/);
    expect(src).toMatch(/glyph: "▼"/);
    /* Relegation is amber, never the rose this product uses to tell a learner
       their answer is wrong. */
    expect(src).toContain("text-b-warn-edge");
    expect(code(PARTS)).not.toContain("b-wrong");
  });

  it("opens the rules with a real button, not a clickable div", () => {
    const src = read(PARTS);
    expect(src).toMatch(/<button\b[\s\S]{0,200}aria-expanded=\{open\}/);
    expect(src).toContain("aria-controls");
  });

  it("gives the unlock meter its real numbers, not just a width", () => {
    const src = read(PAGE);
    expect(src).toContain('role="progressbar"');
    for (const attr of ["aria-valuemin", "aria-valuemax", "aria-valuenow"]) {
      expect(src, attr).toContain(attr);
    }
  });

  it("lets every animation be turned off", () => {
    for (const rel of [PAGE, PARTS, EMBLEM]) {
      const src = read(rel);
      const transitions = (src.match(/transition-\[|transition-colors|transition-transform|transition-opacity/g) ?? [])
        .length;
      if (transitions === 0) continue;
      expect(src, rel).toContain("motion-reduce:");
    }
  });
});
