import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HELP_ARTICLES, findArticle } from "@schools/help/content";
import {
  LEAGUE_EXPLAIN,
  LEAGUE_HELP_ARTICLE,
  LEAGUE_HELP_HREF,
  withUnlockXp,
} from "@schools/leagues/explain";
import { LEAGUE_TIERS } from "@schools/leagues/tiers";
import { LEAGUE_UNLOCK_XP } from "@schools/leagues/unlock";
import { XP_AMOUNTS } from "@schools/leagues/xp-policy";
import type { Locale } from "@schools/curriculum/types";

/**
 * The explanation, and the promise that there is only one of it.
 *
 * §19 and §22 both ask for the league to explain itself, and the obvious
 * failure is three screens carrying three paragraphs that drift — one saying
 * the week resets on Sunday, another on Monday. So the long answer is a single
 * Help Center article and the short lines are one exported object, and these
 * are the assertions that keep it that way.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const LOCALES: Locale[] = ["kk", "ru"];

const article = findArticle(LEAGUE_HELP_ARTICLE);

describe("the short lines ship in both languages", () => {
  const entries = Object.entries(LEAGUE_EXPLAIN);

  it("is actually scanning something", () => {
    expect(entries.length).toBeGreaterThanOrEqual(6);
  });

  it("never leaves a language empty", () => {
    for (const [key, value] of entries) {
      for (const loc of LOCALES) {
        expect(value[loc]?.trim(), `${key}.${loc}`).toBeTruthy();
      }
    }
  });

  it("never falls back to Russian by copying it into the Kazakh", () => {
    /* `product-surface.test.ts` gives `L` this guarantee and does not scan this
       file, so it is given here. An identical pair is an untranslated
       placeholder every time. */
    const copied = entries.filter(([, v]) => v.kk === v.ru).map(([k]) => k);
    expect(copied).toEqual([]);
  });

  it("carries Kazakh letters the Russian alphabet does not have", () => {
    const kk = entries.map(([, v]) => v.kk).join("");
    expect(/[ӘҒҚҢӨҰҮҺІәғқңөұүһі]/.test(kk)).toBe(true);
  });

  it("asserts no gender, because the product holds none", () => {
    /* «ты набрал» misgenders roughly half of every class every Monday.
       `school_accounts` has a name, a school, a role and a credential. */
    const ru = entries.map(([, v]) => v.ru).join(" ");
    for (const past of ["набрал", "поднялся", "опустился", "решил", "остался"]) {
      expect(ru.includes(past), past).toBe(false);
    }
  });

  it("substitutes the threshold rather than spelling it out twice", () => {
    expect(LEAGUE_EXPLAIN.unlock.ru).toContain("{xp}");
    expect(withUnlockXp(LEAGUE_EXPLAIN.unlock.ru)).toContain(String(LEAGUE_UNLOCK_XP));
    expect(withUnlockXp(LEAGUE_EXPLAIN.unlock.kk)).toContain(String(LEAGUE_UNLOCK_XP));
  });
});

describe("there is exactly one long explanation, and it exists", () => {
  it("resolves to a real Help Center article", () => {
    expect(article, LEAGUE_HELP_ARTICLE).toBeDefined();
    expect(LEAGUE_HELP_HREF).toBe(`/help/${LEAGUE_HELP_ARTICLE}`);
  });

  it("is one article, not three near-copies", () => {
    /* A second article titled «Как работают лиги» is the drift this test is
       here to catch. */
    const aboutLeagues = HELP_ARTICLES.filter((a) =>
      /^(лига|лиги|лигалар)/i.test(a.title.ru) || a.id.includes("league"),
    );
    expect(aboutLeagues.map((a) => a.id)).toEqual([LEAGUE_HELP_ARTICLE]);
  });

  it("quotes the shared lines rather than restating them", () => {
    /* Identity, not similarity: the article body holds the same objects the
       league page renders, so the two cannot describe different Mondays. */
    const texts = article!.body.flatMap((b) =>
      b.kind === "p" || b.kind === "see" ? [b.text] : [],
    );
    expect(texts).toContain(LEAGUE_EXPLAIN.weekBody);
    expect(texts).toContain(LEAGUE_EXPLAIN.weekSettles);
    expect(texts).toContain(LEAGUE_EXPLAIN.scope);
  });
});

describe("the article answers everything §22 asks it to", () => {
  const prose = (loc: Locale) =>
    article!.body
      .flatMap((b) => {
        if (b.kind === "p" || b.kind === "see") return [b.text[loc]];
        if (b.kind === "list") return b.items.map((i) => i[loc]);
        return [];
      })
      .join(" ");

  it("names the unlock threshold, from the constant", () => {
    for (const loc of LOCALES) {
      expect(prose(loc), loc).toContain(String(LEAGUE_UNLOCK_XP));
    }
  });

  it("prices every XP source from the policy, so the page cannot drift from the ledger", () => {
    const ru = prose("ru");
    for (const [achievement, amount] of Object.entries(XP_AMOUNTS)) {
      expect(ru.includes(String(amount)), achievement).toBe(true);
    }
  });

  it("says what earns nothing, which is the half a learner will actually test", () => {
    const ru = prose("ru");
    for (const never of ["Запустить", "скорость", "Nova", "повторное"]) {
      expect(ru.includes(never), never).toBe(true);
    }
  });

  it("lists all ten tiers, by the names the code holds", () => {
    for (const loc of LOCALES) {
      const text = prose(loc);
      for (const tier of LEAGUE_TIERS) {
        expect(text.includes(tier.name), `${tier.name} (${loc})`).toBe(true);
      }
    }
  });

  it("explains promotion, staying and relegation, and that tiny groups do not move", () => {
    const ru = prose("ru");
    expect(ru).toContain("поднимается");
    expect(ru).toContain("остаётся");
    expect(ru).toContain("ниже");
    expect(ru).toContain("четырёх");
  });

  it("states the class scope and that farming is not possible", () => {
    const ru = prose("ru");
    expect(ru).toContain("только ученики твоего класса");
    expect(ru).toContain("Накрутить");
  });
});

describe("the article is reachable", () => {
  it("is linked from the league page", () => {
    const page = read("src/components/brilliant/app/league/school-league.tsx");
    expect(page).toContain("LEAGUE_HELP_HREF");
    expect(page).toContain("LEAGUE_EXPLAIN");
  });

  it("is linked from the privacy answer a learner arrives through", () => {
    /* «Кто видит мою работу?» is where a learner goes when a leaderboard
       surprises them. It used to promise there was no ranking at all. */
    const privacy = findArticle("who-sees-my-work")!;
    const links = privacy.body.flatMap((b) => (b.kind === "see" ? [b.article] : []));
    expect(links).toContain(LEAGUE_HELP_ARTICLE);
  });

  it("no longer promises a learner that no ranking exists", () => {
    /* That sentence was true until leagues shipped. A help page that promises a
       child something the product no longer does is worse than a missing page:
       they find out by seeing their own name on a list. */
    const privacy = findArticle("who-sees-my-work")!;
    const ru = privacy.body
      .flatMap((b) => (b.kind === "p" ? [b.text.ru] : []))
      .join(" ");
    expect(ru).not.toContain("Ни рейтинга");
    expect(ru).toContain("XP");
  });
});
