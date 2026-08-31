import { describe, it, expect } from "vitest";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  articlesInCategory,
  findArticle,
} from "@schools/help/content";
import { searchArticles } from "@schools/help/types";

/**
 * The Help Center.
 *
 * The failures worth catching here are the quiet ones: a cross-reference to an
 * article somebody renamed, a category with nothing in it, an article that
 * exists in Russian and not in Kazakh. All three render without an error and
 * all three are obvious to a reader.
 */

const LOCALES = ["kk", "ru"] as const;

describe("content integrity", () => {
  it("has articles", () => {
    expect(HELP_ARTICLES.length).toBeGreaterThanOrEqual(25);
  });

  it("gives every article a unique id", () => {
    const ids = HELP_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses url-safe ids, because a teacher writes them on a whiteboard", () => {
    for (const a of HELP_ARTICLES) {
      expect(a.id, a.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("puts every article in a real category", () => {
    const known = new Set(HELP_CATEGORIES.map((c) => c.id));
    for (const a of HELP_ARTICLES) {
      expect(known.has(a.category), `${a.id} -> ${a.category}`).toBe(true);
    }
  });

  it("leaves no category empty", () => {
    // An empty category heading reads as content that failed to load.
    for (const c of HELP_CATEGORIES) {
      expect(articlesInCategory(c.id).length, c.id).toBeGreaterThan(0);
    }
  });
});

describe("both languages, everywhere", () => {
  it("gives every category a title and a blurb in both", () => {
    for (const c of HELP_CATEGORIES) {
      for (const loc of LOCALES) {
        expect(c.title[loc]?.trim(), `${c.id}.title.${loc}`).toBeTruthy();
        expect(c.blurb[loc]?.trim(), `${c.id}.blurb.${loc}`).toBeTruthy();
      }
    }
  });

  it("gives every article a title, a summary and a body in both", () => {
    for (const a of HELP_ARTICLES) {
      for (const loc of LOCALES) {
        expect(a.title[loc]?.trim(), `${a.id}.title.${loc}`).toBeTruthy();
        expect(a.summary[loc]?.trim(), `${a.id}.summary.${loc}`).toBeTruthy();
        expect(a.keywords[loc].length, `${a.id}.keywords.${loc}`).toBeGreaterThan(0);

        for (const [i, block] of a.body.entries()) {
          if (block.kind === "p" || block.kind === "see") {
            expect(block.text[loc]?.trim(), `${a.id}.body[${i}].${loc}`).toBeTruthy();
          }
          if (block.kind === "list") {
            for (const item of block.items) {
              expect(item[loc]?.trim(), `${a.id}.body[${i}].${loc}`).toBeTruthy();
            }
          }
        }
      }
    }
  });

  it("never leaves Kazakh as a copy of the Russian", () => {
    /* An identical pair is almost always an untranslated placeholder. A single
       shared word ("Nova AI") is legitimate; a whole answer is not. */
    const copied = HELP_ARTICLES.filter(
      (a) => a.summary.kk === a.summary.ru && a.summary.kk.split(/\s+/).length > 2,
    );
    expect(copied.map((a) => a.id)).toEqual([]);
  });
});

describe("cross-references resolve", () => {
  it("every `see` block points at an article that exists", () => {
    // This is the one that breaks silently: rename an id, and a link 404s in
    // front of a learner with nothing failing in CI.
    for (const a of HELP_ARTICLES) {
      for (const block of a.body) {
        if (block.kind !== "see") continue;
        expect(findArticle(block.article), `${a.id} -> ${block.article}`).toBeDefined();
      }
    }
  });

  it("no article links to itself", () => {
    for (const a of HELP_ARTICLES) {
      for (const block of a.body) {
        if (block.kind === "see") expect(block.article).not.toBe(a.id);
      }
    }
  });
});

describe("search", () => {
  it("returns everything for an empty query", () => {
    expect(searchArticles(HELP_ARTICLES, "", "ru")).toHaveLength(HELP_ARTICLES.length);
    expect(searchArticles(HELP_ARTICLES, "   ", "kk")).toHaveLength(HELP_ARTICLES.length);
  });

  it("matches the title", () => {
    const hits = searchArticles(HELP_ARTICLES, "Nova", "ru");
    expect(hits.some((a) => a.id === "what-is-nova")).toBe(true);
  });

  it("matches the body, not only the title", () => {
    // "scrypt" appears nowhere in a title; the article about signing in
    // mentions the teacher handing out credentials.
    const hits = searchArticles(HELP_ARTICLES, "учитель", "ru");
    expect(hits.length).toBeGreaterThan(1);
  });

  it("matches keywords a learner types but the answer never says", () => {
    /* "забыл" appears in the change-password answer's keywords. This is the
       whole reason keywords exist. */
    const hits = searchArticles(HELP_ARTICLES, "забыл", "ru");
    expect(hits.some((a) => a.id === "change-password")).toBe(true);
  });

  it("is case-insensitive", () => {
    const lower = searchArticles(HELP_ARTICLES, "nova", "ru").map((a) => a.id);
    const upper = searchArticles(HELP_ARTICLES, "NOVA", "ru").map((a) => a.id);
    expect(upper).toEqual(lower);
  });

  it("searches the reader's language only", () => {
    /* Matching the Kazakh body while the interface is Russian would return
       results the reader cannot read. */
    const ru = searchArticles(HELP_ARTICLES, "құпиясөз", "ru");
    expect(ru).toHaveLength(0);
    const kk = searchArticles(HELP_ARTICLES, "құпиясөз", "kk");
    expect(kk.length).toBeGreaterThan(0);
  });

  it("returns nothing for a query about something the product does not do", () => {
    expect(searchArticles(HELP_ARTICLES, "квантовая физика", "ru")).toHaveLength(0);
  });

  it("does not mutate the corpus", () => {
    const before = HELP_ARTICLES.length;
    searchArticles(HELP_ARTICLES, "nova", "ru");
    expect(HELP_ARTICLES).toHaveLength(before);
  });
});
