import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The operational documents have to describe the running system.
 *
 * ## What went wrong
 *
 * `PILOT_DEPLOYMENT_MANIFEST.md` described the PYTHON-era deployment — Pyodide
 * in the browser, Judge0 language 113, `Python (3.14.0)`, a `standalone` Node
 * process with a `cp -r` step, 22 migrations, leagues dark — for as long as
 * production had been serving the C++17 product on Vercel. `DEVELOPMENT.md`
 * named a checkout as canonical that was 49 commits behind and served the
 * retired product. `.env.example` turned leagues on while the manifest said
 * they shipped off.
 *
 * None of that is a code defect and all of it is worse than one: an operator
 * following the manifest would have deployed the wrong thing the right way, and
 * an engineer following DEVELOPMENT.md would have audited a product nobody
 * runs. A previous audit did exactly that and lost its first hour to it.
 *
 * ## What this test is
 *
 * The load-bearing NUMBERS and NAMES, checked against the code they describe.
 * Not prose — a test that asserted wording would fail on every edit and be
 * deleted. What it holds is the handful of facts that were wrong: the runtime,
 * the compiler, the migration count, the deployment model, the league state,
 * and the branch.
 *
 * A doc that goes stale now fails a test rather than misleading somebody.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const MANIFEST = "docs/releases/PILOT_DEPLOYMENT_MANIFEST.md";
const DEVELOPMENT = "docs/DEVELOPMENT.md";

describe("the deployment manifest", () => {
  const manifest = read(MANIFEST);

  it("names the branch the platform actually deploys", () => {
    /* `origin/master` is the deployed branch and `cpp17-migration` is the name
       it goes by. A manifest naming `pilot-release-candidate` sends an operator
       to a product 49 commits behind. */
    expect(manifest).toContain("cpp17-migration");
  });

  it("does not describe the retired Python runtime", () => {
    /* Each of these was a live claim in this file while production ran C++17.
       They are asserted as ABSENT because that is what the defect was — a
       document confidently describing a system that had been replaced. */
    const body = manifest.slice(manifest.indexOf("## 1. The release"));
    expect(body, "Judge0 language 113 is Python; C++ is 105").not.toContain("113");
    expect(body).not.toMatch(/Python \(3\.14/);
    expect(body, "the browser runs Clang, not CPython").not.toMatch(/Pyodide RUN/);
  });

  it("states the migration count the chain actually applies", () => {
    /* Counted from the directory rather than trusted: the manifest said 22 and
       the chain applies 23. A number in a runbook that is one out is a number
       an operator uses to decide whether a migration failed. */
    const applied = readdirSync(path.join(ROOT, "database", "migrations")).filter((f) =>
      f.endsWith(".sql"),
    ).length;
    expect(applied, "the fixture is reading the migration directory").toBeGreaterThan(20);
    expect(
      manifest,
      `the chain applies ${applied} migrations; the manifest must say so`,
    ).toContain(`**${applied} applied**`);
  });

  it("describes the deployment model the config selects", () => {
    /* `next.config.ts` turns `standalone` off where `VERCEL` is set, and the
       manifest called it "load-bearing" and documented a `cp -r` step that does
       not happen there. */
    const nextConfig = read("next.config.ts");
    expect(nextConfig, "standalone must still be conditional on VERCEL").toContain(
      'process.env.VERCEL ? {} : { output: "standalone"',
    );
    expect(manifest).toContain("Vercel");
    expect(manifest, "the two modes must be told apart").toMatch(/standalone.*is OFF/i);
  });

  it("says what the deployment does about leagues, not what somebody intended", () => {
    /* The manifest said leagues ship dark. `.env.example` had them on. A
       safeguarding decision documented as the opposite of its configuration is
       the one kind of drift that reaches a child. */
    const example = read(".env.example");
    const enabled = /^LEAGUES_ENABLED=true$/m.test(example);
    if (enabled) {
      expect(manifest, "the example config enables leagues; the manifest must not deny it").toMatch(
        /Leagues \| \*\*ON\*\*/,
      );
      expect(
        example,
        "LEAGUES_ENABLED without an allowlist turns leagues on for every school",
      ).toMatch(/LEAGUES_SCHOOLS/);
    } else {
      expect(manifest).toMatch(/Leagues \| \*\*OFF\*\*/);
    }
  });

  it("names the scheduled entry point that exists", () => {
    /* The runbooks told an operator to schedule `POST /api/learning/reduce`,
       which does not exist. */
    expect(manifest).not.toContain("/api/learning/reduce");
    expect(manifest).toContain("/api/cron");
    const vercel = JSON.parse(read("vercel.json")) as { crons?: { path: string }[] };
    expect(vercel.crons?.some((c) => c.path === "/api/cron")).toBe(true);
  });

  it("gives a rollback that names a real deployment and its cost", () => {
    const rollback = manifest.slice(manifest.indexOf("## 11. Rollback"));
    expect(rollback, "the platform's own rollback verb").toContain("vercel");
    expect(rollback, "and what going back re-opens").toMatch(/answer key/i);
  });
});

describe("the production environment table", () => {
  it("documents every variable the config actually reads", () => {
    /*
     * Twenty-three were missing. A knob that exists and is undocumented is a
     * knob somebody finds in the source and sets without knowing what it
     * bounds — `JUDGE0_MAX_CONCURRENT_PER_LEARNER` is the one that decides
     * whether a class can be starved by one browser loop.
     *
     * Read out of `config.ts` rather than listed here, so adding a variable
     * fails this test until it is written down.
     */
    const cfg = read("schools/config.ts");
    const doc = read("docs/deployment/PRODUCTION_ENVIRONMENT.md");
    const names = new Set(
      [...cfg.matchAll(/(?:^|[^A-Za-z_])(?:env|intEnv|optionalIntEnv)\("([A-Z0-9_]+)"/g)].map(
        (m) => m[1]!,
      ),
    );

    expect(names.size, "the extractor must find the variables at all").toBeGreaterThan(30);
    const missing = [...names].filter((n) => !doc.includes(n)).sort();
    expect(missing, `undocumented environment variables: ${missing.join(", ")}`).toEqual([]);
  });

  it("no longer says the Postgres driver is unimplemented", () => {
    /* It said "setting this today breaks the application … leave it unset and
       use an absolute LEARNING_DATA_DIR with PGlite" — advice that was true
       before the driver landed and became, once it had, an instruction to
       deploy a school on a single-writer embedded database. */
    const doc = read("docs/deployment/PRODUCTION_ENVIRONMENT.md");
    expect(doc).not.toContain("the Postgres driver is not wired yet");
    expect(read("schools/store/postgres-driver.ts").length).toBeGreaterThan(0);
  });

  it("no longer says Submit is unmetered", () => {
    const doc = read("docs/deployment/PRODUCTION_ENVIRONMENT.md");
    expect(doc).not.toContain("**no rate limit at all**");
    expect(doc).toContain("submit:provider");
  });
});

describe("the development document", () => {
  const dev = read(DEVELOPMENT);

  it("names one canonical branch, and it is the deployed one", () => {
    expect(dev).toContain("cpp17-migration");
    /* And it must say what the other branch is, rather than leaving somebody to
       find out by running it. */
    expect(dev).toContain("pilot-release-candidate");
    expect(dev).toMatch(/49 commits\s*\n?\s*behind|49\s*\n?\s*commits behind|\*\*49 commits/);
  });

  it("does not point at a worktree as the source of truth", () => {
    /* The split brain: two working copies of two different products, with the
       documentation naming the wrong one. A worktree path may appear — it must
       not be described as canonical. */
    const canonicalSection = dev.slice(dev.indexOf("## The canonical checkout"));
    const table = canonicalSection.slice(0, canonicalSection.indexOf("### Worktrees"));
    expect(table).not.toContain(".claude/worktrees");
  });

  it("carries the branch check that `predev` runs", () => {
    const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
    expect(
      pkg.scripts.predev,
      "starting a dev server must say which product it is about to serve",
    ).toContain("check-branch");
    expect(dev).toContain("check-branch.mjs");
  });
});
