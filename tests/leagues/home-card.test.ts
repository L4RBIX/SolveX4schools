import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HELP_ARTICLES } from "@schools/help/content";
import {
  LEAGUE_EXPLAIN,
  LEAGUE_HELP_ARTICLE,
  LEAGUE_HELP_HREF,
  withUnlockXp,
} from "@schools/leagues/explain";
import { LEAGUE_TIERS } from "@schools/leagues/tiers";
import { LEAGUE_UNLOCK_XP, unlockFrom } from "@schools/leagues/unlock";
import { L } from "@schools/presentation/labels";

/**
 * The league card on the learner home.
 *
 * The subsystem, the threshold and the explanation all existed before this card
 * did. What is new is the SURFACE, and a surface is where the honesty problems
 * live: a meter that rounds, a link that 404s, a rank invented for a learner who
 * has not competed. These pin the four that were available to get wrong.
 *
 * There is no React test renderer in this repository, so the component itself is
 * asserted by source scan and by the browser run recorded in the change notes.
 * The arithmetic underneath it is asserted directly.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const CARD = "src/components/brilliant/app/league/home-league-card.tsx";
const PAGE = "src/app/home/page.tsx";

describe("the boundary the card switches on", () => {
  it("is locked at 174 and open at 175", () => {
    expect(LEAGUE_UNLOCK_XP).toBe(175);
    expect(unlockFrom(174).unlocked).toBe(false);
    expect(unlockFrom(175).unlocked).toBe(true);
  });

  it("says how much is left, and never a negative amount", () => {
    expect(unlockFrom(174).needed).toBe(1);
    expect(unlockFrom(175).needed).toBe(0);
    expect(unlockFrom(4000).needed).toBe(0);
  });

  it("prints the learner's real total on both sides of it", () => {
    expect(unlockFrom(0).lifetimeXp).toBe(0);
    expect(unlockFrom(174).lifetimeXp).toBe(174);
    expect(unlockFrom(175).lifetimeXp).toBe(175);
  });

  it("reads the threshold from the one definition, never from a literal", () => {
    const src = read(CARD);
    expect(src).toContain("LEAGUE_UNLOCK_XP");
    /* A hardcoded 175 anywhere in the card is a second copy of the threshold
       that stops agreeing with the ledger the first time somebody tunes it. */
    expect(src).not.toMatch(/\b175\b/);
  });
});

describe("what the card refuses to show before the unlock", () => {
  const src = read(CARD);

  it("has no leaderboard, no classmate and no rank in the locked state", () => {
    const locked = src.slice(src.indexOf("function LockedCard"), src.indexOf("function OpenCard"));
    expect(locked).not.toContain("rank");
    expect(locked).not.toContain("TierBadge");
    expect(locked).not.toContain("groupSize");
  });

  it("never renders the board itself, in either state", () => {
    /* The board lives on `/league`. A copy on the home screen would put a
       ranked list of children on the first page of the product. */
    expect(src).not.toContain("LeagueRow");
    expect(src).not.toContain("ZoneRule");
    expect(src).not.toContain(".rows");
  });

  it("fetches nothing beyond the unlock read while the card is locked", () => {
    const page = read(PAGE);
    const locked = page.slice(page.indexOf("if (!unlock.unlocked)"));
    expect(page.indexOf("leagueForLearner(")).toBeGreaterThan(page.indexOf("if (!unlock.unlocked)"));
    expect(locked.indexOf("return {")).toBeLessThan(locked.indexOf("leagueForLearner("));
  });
});

describe("what the card refuses to claim after it", () => {
  const src = read(CARD);

  it("treats a null rank as 'not in the table yet', not as a position", () => {
    expect(src).toContain("active.rank !== null");
    expect(src).toContain("leagueNotRankedYet");
  });

  it("takes the rank from the server view and never derives one", () => {
    const page = read(PAGE);
    expect(page).toContain("rank: view.you?.rank ?? null");
    expect(page).toContain("weeklyXp: view.you?.weeklyXp ?? 0");
  });

  it("never lets the week's remaining days go negative", () => {
    expect(read(PAGE)).toContain("Math.max(\n      0,\n      Math.ceil(");
  });
});

describe("the link a learner is offered actually resolves", () => {
  it("points at a help article that exists", () => {
    expect(LEAGUE_HELP_HREF).toBe(`/help/${LEAGUE_HELP_ARTICLE}`);
    expect(HELP_ARTICLES.some((a) => a.id === LEAGUE_HELP_ARTICLE)).toBe(true);
  });

  it("is rendered by the card, in the reader's language", () => {
    const src = read(CARD);
    expect(src).toContain("LEAGUE_HELP_HREF");
    expect(src).toContain("LEAGUE_EXPLAIN.helpLink");
    expect(LEAGUE_EXPLAIN.helpLink.kk.trim()).not.toBe("");
    expect(LEAGUE_EXPLAIN.helpLink.ru.trim()).not.toBe("");
    expect(LEAGUE_EXPLAIN.helpLink.kk).not.toBe(LEAGUE_EXPLAIN.helpLink.ru);
  });

  it("names the real threshold in the sentence under the meter", () => {
    expect(withUnlockXp(LEAGUE_EXPLAIN.unlock.ru)).toContain(String(LEAGUE_UNLOCK_XP));
    expect(withUnlockXp(LEAGUE_EXPLAIN.unlock.kk)).toContain(String(LEAGUE_UNLOCK_XP));
    expect(withUnlockXp(LEAGUE_EXPLAIN.unlock.ru)).not.toContain("{xp}");
  });
});

describe("the meter is a meter", () => {
  const src = read(CARD);

  it("declares its role and all three values", () => {
    expect(src).toContain('role="progressbar"');
    expect(src).toContain("aria-valuemin={0}");
    expect(src).toContain("aria-valuemax={LEAGUE_UNLOCK_XP}");
    expect(src).toContain("aria-valuenow={lifetimeXp}");
  });

  it("carries the real XP in its accessible name, not a percentage", () => {
    expect(src).toContain("aria-label={meterLabel}");
    expect(src).toContain('.replace("{xp}", String(lifetimeXp))');
    expect(L.leagueUnlockMeter.ru).toContain("{xp}");
    expect(L.leagueUnlockMeter.ru).toContain("{goal}");
    expect(L.leagueUnlockMeter.kk).toContain("{xp}");
  });

  it("does not animate a bar for XP that was not just earned", () => {
    expect(src).not.toContain("transition-[width]");
    expect(src).not.toContain("animate-");
  });
});

describe("every string the card adds ships in both languages", () => {
  const added = {
    leagueUnlockEyebrow: L.leagueUnlockEyebrow,
    leagueUnlockMeter: L.leagueUnlockMeter,
    leagueNotRankedYet: L.leagueNotRankedYet,
    leagueOpenCta: L.leagueOpenCta,
  };

  it("has Kazakh and Russian for all of them, and they differ", () => {
    for (const [key, value] of Object.entries(added)) {
      expect(value.kk.trim(), key).not.toBe("");
      expect(value.ru.trim(), key).not.toBe("");
      expect(value.kk, key).not.toBe(value.ru);
    }
  });
});

describe("the tier the card badges", () => {
  it("comes from the ladder, so a rename cannot desync the home screen", () => {
    expect(read(PAGE)).toContain("LEAGUE_TIERS.find((t) => t.tier === view.tier)");
    expect(LEAGUE_TIERS).toHaveLength(10);
    expect(LEAGUE_TIERS[0].name).toBe("Pulse");
  });

  it("falls back to the lowest tier rather than rendering an empty badge", () => {
    expect(read(PAGE)).toContain("?? LEAGUE_TIERS[0]");
  });
});

describe("the card only exists where the league does", () => {
  it("is rendered behind the same predicate as the nav tab and the page", () => {
    const home = read("src/components/brilliant/app/school-home.tsx");
    expect(home).toContain("leagues && league ? <HomeLeagueCard");
    expect(read(PAGE)).toContain("leagueNavVisible(user) && subjectId");
  });

  it("degrades to no card, never to a false locked state, when the read fails", () => {
    /* Falling back to `unlocked: false` would tell a learner who has earned
       their league that they have not. */
    const page = read(PAGE);
    expect(page).toContain("} catch {\n    return null;\n  }");
  });
});
