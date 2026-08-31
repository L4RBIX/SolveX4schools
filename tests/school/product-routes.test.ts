import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HELP_ARTICLES } from "@schools/help/content";
import { PRIVACY, TERMS } from "@schools/legal/documents";
import { REFERENCE_ASSETS, referenceAsset, remainingReferenceAssets } from "@schools/assets/registry";

/**
 * The routes and surfaces added by the product-completion phase.
 *
 * Page modules are imported rather than rendered: there is no jsdom in this
 * project, and the failures worth catching here — a page that stopped
 * existing, a legal document that lost a section, an asset path inlined into a
 * component instead of registered — are all visible without a DOM.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("every new public route has a page module", () => {
  const routes = [
    "@/app/about/page",
    "@/app/help/page",
    "@/app/privacy/page",
    "@/app/terms/page",
    "@/app/login/page",
    "@/app/settings/account/page",
    "@/app/settings/preferences/page",
    "@/app/not-found",
    "@/app/error",
  ];

  /* 30s, not the 5s default. Several of these pull the store and its
     migrations in transitively, and on a loaded machine nine cold module
     graphs do not fit in five seconds. The test is not slow because anything
     is wrong; it is slow because it is importing real pages. */
  it("exports a component from each", async () => {
    for (const route of routes) {
      const mod = (await import(route)) as { default?: unknown };
      expect(typeof mod.default, route).toBe("function");
    }
  }, 30_000);

  it("pre-renders one page per help article", async () => {
    const mod = (await import("../../src/app/help/[article]/page")) as {
      generateStaticParams: () => { article: string }[];
    };
    const params = mod.generateStaticParams();
    expect(params.map((p) => p.article).sort()).toEqual(
      HELP_ARTICLES.map((a) => a.id).sort(),
    );
  });
});

describe("account settings gate on the session, server-side", () => {
  it("redirects rather than rendering a shell and hiding it", () => {
    // A client-side guard ships the markup of an account page to somebody who
    // is not signed in, and only then hides it.
    for (const page of [
      "src/app/settings/account/page.tsx",
      "src/app/settings/preferences/page.tsx",
    ]) {
      const src = read(page);
      expect(src, page).toContain("currentUser()");
      expect(src, page).toContain('redirect("/login")');
    }
  });
});

describe("learner pages require a session", () => {
  /* The APIs were already safe — `requireLearner` resolves the subject from
     the session. This is the other half: without it an anonymous visitor who
     follows "Start" lands on a dashboard of zeroes with nothing telling them
     to sign in. */
  const learnerPages = [
    "src/app/home/page.tsx",
    "src/app/program/page.tsx",
    "src/app/you/page.tsx",
    "src/app/review/page.tsx",
    "src/app/course/[index]/page.tsx",
    "src/app/lesson/[lessonId]/page.tsx",
    "src/app/assessment/[month]/page.tsx",
  ];

  it("calls the shared page guard", () => {
    for (const page of learnerPages) {
      expect(read(page), page).toContain("requirePageSession");
    }
  });

  it("defers to one policy rather than inventing a second", () => {
    // Two functions with two opinions about "may an anonymous caller learn"
    // is how a gate ends up open in the environment nobody checked.
    const guard = read("schools/auth/page-guard.ts");
    expect(guard).toContain("anonymousLearningAllowed");
  });

  it("sends a first-login password change before anything else", () => {
    expect(read("schools/auth/page-guard.ts")).toContain('redirect("/account/password")');
  });
});

describe("legal documents", () => {
  for (const [name, doc] of [
    ["privacy", PRIVACY],
    ["terms", TERMS],
  ] as const) {
    it(`${name}: has both languages everywhere`, () => {
      for (const loc of ["kk", "ru"] as const) {
        expect(doc.title[loc]?.trim()).toBeTruthy();
        expect(doc.intro[loc]?.trim()).toBeTruthy();
        for (const section of doc.sections) {
          expect(section.heading[loc]?.trim(), `${section.id}.${loc}`).toBeTruthy();
          for (const block of section.blocks) {
            if (block.kind === "p") expect(block.text[loc]?.trim()).toBeTruthy();
            if (block.kind === "list") {
              for (const i of block.items) expect(i[loc]?.trim()).toBeTruthy();
            }
            if (block.kind === "rows") {
              for (const r of block.rows) {
                expect(r.term[loc]?.trim()).toBeTruthy();
                expect(r.value[loc]?.trim()).toBeTruthy();
              }
            }
          }
        }
      }
    });

    it(`${name}: has unique anchor ids the table of contents can link to`, () => {
      const ids = doc.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it(`${name}: carries a real updated date`, () => {
      expect(doc.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(doc.updated))).toBe(false);
    });
  }

  it("privacy states what it cannot claim rather than inventing it", () => {
    /* There is no automated deletion job. A retention window described here
       would be a claim about a cron that does not exist — and a director
       repeats a privacy page to parents. */
    const retention = PRIVACY.sections.find((s) => s.id === "retention");
    expect(retention).toBeDefined();
    const text = JSON.stringify(retention);
    expect(text).toMatch(/автоматического удаления пока нет|Автоматты жою механизмі әлі жоқ/);
  });

  it("neither document claims a legal review that has not happened", () => {
    const all = JSON.stringify([PRIVACY, TERMS]).toLowerCase();
    for (const claim of ["gdpr", "соответствует закон", "юрист", "сертифицирован"]) {
      expect(all).not.toContain(claim);
    }
  });
});

describe("reference assets are registered, not inlined", () => {
  it("resolves a known id", () => {
    expect(referenceAsset("about-why")).toContain("/assets/original/");
  });

  it("throws on an unknown id instead of returning a broken URL", () => {
    // A missing illustration that renders as an empty box survives to
    // production because nobody notices one blank square.
    expect(() => referenceAsset("not-a-real-asset")).toThrow(/Unknown reference asset/);
  });

  it("marks every entry as temporary and needing replacement", () => {
    for (const a of REFERENCE_ASSETS) {
      expect(a.temporaryReferenceAsset, a.id).toBe(true);
      expect(a.replacementNeeded, a.id).toBe(true);
      expect(a.routes.length, a.id).toBeGreaterThan(0);
      expect(a.intent.length, a.id).toBeGreaterThan(20);
    }
  });

  it("reports a count that a status report can quote", () => {
    expect(remainingReferenceAssets()).toBe(REFERENCE_ASSETS.length);
  });

  it("keeps the new public pages free of raw asset paths", () => {
    for (const file of [
      "src/components/brilliant/about/about-page.tsx",
      "src/components/brilliant/help/help-center.tsx",
      "src/components/brilliant/legal/legal-doc.tsx",
    ]) {
      expect(read(file), file).not.toContain("/assets/original/");
    }
  });
});

describe("the account menu points only at pages that exist", () => {
  it("every href has a route", () => {
    const src = read("src/components/brilliant/app/account-menu.ts");
    const hrefs = [...src.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(3);
    const known = new Set([
      "/settings/account",
      "/settings/preferences",
      "/help",
      "/about",
      "/privacy",
      "/terms",
      "/schools",
      "/home",
      "/program",
      "/you",
    ]);
    for (const href of hrefs) expect(known.has(href), href).toBe(true);
  });
});
