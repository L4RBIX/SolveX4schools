import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCHOOL_NAV, SCHOOL_NAV_WITH_LEAGUE } from "@/components/brilliant/app/school-chrome";
import { leaguesEnabledForSchool, parseSchoolAllowlist } from "@schools/leagues/gate";

/**
 * Whether a learner can GET to the league.
 *
 * The subsystem was complete, tested and invisible: the only `href="/league"`
 * in the product lived in `SCHOOL_NAV_WITH_LEAGUE`, whose only caller was the
 * league page itself. Turning the flag on shipped a working feature reachable
 * only by typing the URL. None of the 117 tests that already existed could
 * fail on that, because every one of them tested the subsystem rather than the
 * route to it.
 *
 * These do. They are source scans where they have to be — a nav link is a
 * property of what the pages PASS, and there is no unit that observes it.
 */

const ROOT = join(import.meta.dirname, "../..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("the nav function", () => {
  it("has no league link when the gate is off", () => {
    const hrefs = SCHOOL_NAV("ru").map((l) => l.href);
    expect(hrefs).toEqual(["/home", "/program", "/you"]);
  });

  it("defaults to off, so a surface that forgets the gate renders no dead tab", () => {
    /* The asymmetry matters: forgetting it renders today's nav, while the other
       default renders a tab that 404s for a school with no league. */
    expect(SCHOOL_NAV("kk").some((l) => l.href === "/league")).toBe(false);
  });

  it("adds the league before /you when the gate is on", () => {
    const hrefs = SCHOOL_NAV("ru", true).map((l) => l.href);
    expect(hrefs).toEqual(["/home", "/program", "/league", "/you"]);
  });

  it("keeps /you rightmost, where a learner's muscle memory already reaches", () => {
    expect(SCHOOL_NAV("kk", true).at(-1)?.href).toBe("/you");
  });

  it("labels the tab in the reader's language and gives it an accessible name", () => {
    const kk = SCHOOL_NAV("kk", true).find((l) => l.href === "/league");
    const ru = SCHOOL_NAV("ru", true).find((l) => l.href === "/league");
    expect(kk?.id).toBe("league");
    expect(kk?.label.trim()).not.toBe("");
    expect(kk?.aria.trim()).not.toBe("");
    expect(ru?.label.trim()).not.toBe("");
  });

  it("is the same list the league page renders for itself", () => {
    expect(SCHOOL_NAV_WITH_LEAGUE("ru")).toEqual(SCHOOL_NAV("ru", true));
  });
});

/**
 * The surfaces.
 *
 * `school-home.tsx` was the last one passing no gate — the home screen was the
 * only learner surface in the product without the league tab. It threads
 * `SCHOOL_NAV(loc, leagues)` now, with `leagues` resolved by
 * `leagueNavVisible(user)` in `src/app/home/page.tsx` exactly as every page
 * below does it, so the known-gap list is empty and the assertion is that it
 * stays empty.
 *
 * The list is asserted EXACTLY rather than as "no more than one", so that a
 * seventh surface added next month fails here instead of quietly shipping
 * without the tab.
 */
const NAV_SURFACES = [
  "src/components/brilliant/app/school-home.tsx",
  "src/components/brilliant/app/school-you.tsx",
  "src/components/brilliant/app/school-review.tsx",
  "src/components/brilliant/app/year-roadmap.tsx",
  "src/components/brilliant/gameboard/month-board.tsx",
  "src/components/brilliant/settings/settings-shell.tsx",
];

/**
 * Empty, and it is meant to stay empty.
 *
 * Kept as a named constant rather than inlined as `[]` so that the next surface
 * that forgets the argument fails against something that says what it is,
 * rather than against a bare literal.
 */
const STILL_UNGATED: string[] = [];

describe("every learner surface threads the gate into its nav", () => {
  it("scans the surfaces that actually exist", () => {
    for (const f of NAV_SURFACES) {
      expect(read(f), f).toContain("SCHOOL_NAV(");
    }
  });

  it("passes the second argument on every surface, with no known gap left", () => {
    /* `SCHOOL_NAV(loc)` with one argument is the defect: it renders three tabs
       whatever the school has enabled. */
    const ungated = NAV_SURFACES.filter((f) => /SCHOOL_NAV\(\s*loc\s*\)/.test(read(f)));
    expect(ungated).toEqual(STILL_UNGATED);
  });

  it("resolves the gate on the server, never in the client component", () => {
    /* `schools/config.ts` is server-only and every file above is a client
       component. A client import of it fails `npm run check:bundle`; this fails
       first, and says why. */
    for (const f of NAV_SURFACES) {
      const src = read(f);
      expect(src.includes('from "@schools/config"'), f).toBe(false);
      expect(src.includes("leaguesEnabledForSchool"), f).toBe(false);
    }
  });
});

describe("the pages resolve it", () => {
  const PAGES = [
    "src/app/home/page.tsx",
    "src/app/you/page.tsx",
    "src/app/program/page.tsx",
    "src/app/review/page.tsx",
    "src/app/course/[index]/page.tsx",
    "src/app/settings/account/page.tsx",
    "src/app/settings/preferences/page.tsx",
  ];

  it("calls one predicate, so the tab and the page can never disagree", () => {
    for (const p of PAGES) {
      const src = read(p);
      expect(src.includes("leagueNavVisible"), p).toBe(true);
      expect(src.includes("leagues={leagueNavVisible("), p).toBe(true);
    }
  });

  it("uses that same predicate to decide whether /league exists at all", () => {
    /* The exact guard, not just a mention of the name: the import line alone
       satisfies a `toContain("leagueNavVisible")`, so a page that reverted to
       gating on `!user` would still pass a looser assertion. `tests/leagues/
       nav-visibility.test.ts` covers what the predicate answers; this covers
       that the page asks it. */
    const page = read("src/app/league/page.tsx");
    expect(page).toContain("if (!leagueNavVisible(user)) notFound();");
  });
});

describe("the gate keeps the spelling it was argued into", () => {
  it("is `=== \"true\"`, so an upgrade cannot switch peer ranking on", () => {
    /* Two files argue at length that `!== \"false\"` here would enable a
       competition for every existing deployment at the next deploy. This is
       the assertion that notices the edit. */
    const config = read("schools/config.ts");
    expect(config).toContain('enabled: env("LEAGUES_ENABLED") === "true"');
    expect(config).not.toContain('env("LEAGUES_ENABLED") !== "false"');
  });

  it("still means ALL schools when the allowlist is empty", () => {
    const off = { enabled: false, schools: [] as string[] };
    const openToAll = { enabled: true, schools: [] as string[] };
    expect(leaguesEnabledForSchool(off, "innovation-tech")).toBe(false);
    expect(leaguesEnabledForSchool(openToAll, "some-other-school")).toBe(true);
  });

  it("scopes to the pilot when the allowlist names it", () => {
    const pilot = { enabled: true, schools: parseSchoolAllowlist("innovation-tech") };
    expect(leaguesEnabledForSchool(pilot, "innovation-tech")).toBe(true);
    expect(leaguesEnabledForSchool(pilot, "some-other-school")).toBe(false);
  });
});

describe("the pilot's environment says both halves out loud", () => {
  /*
   * An enabled flag with an EMPTY allowlist is the one combination that quietly
   * enrols every school the deployment ever serves, so wherever the switch is
   * turned on the school has to be named beside it.
   *
   * `.env.example` is checked into the repository and is what a deployer
   * copies, so it is asserted unconditionally. `.env.local` is gitignored and
   * simply does not exist on a fresh clone or in CI — reading it there would
   * fail this suite for a reason that has nothing to do with leagues — so it is
   * asserted only when the developer running this actually has one.
   */
  it(".env.example names the school beside the switch", () => {
    const src = read(".env.example");
    expect(/^LEAGUES_ENABLED=true$/m.test(src), "LEAGUES_ENABLED").toBe(true);
    expect(/^LEAGUES_SCHOOLS=innovation-tech$/m.test(src), "LEAGUES_SCHOOLS").toBe(true);
  });

  it("never turns the switch on without an allowlist, in any env file present", () => {
    for (const file of [".env.example", ".env.local"]) {
      let src: string;
      try {
        src = read(file);
      } catch {
        continue; // gitignored and absent — see above.
      }
      if (!/^LEAGUES_ENABLED=true$/m.test(src)) continue;
      const schools = /^LEAGUES_SCHOOLS=(.*)$/m.exec(src)?.[1] ?? "";
      expect(schools.trim(), `${file}: enabled with an empty allowlist`).not.toBe("");
    }
  });
});
