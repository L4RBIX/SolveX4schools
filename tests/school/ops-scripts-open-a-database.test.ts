import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The two operations scripts have to be able to open a database.
 *
 * `provision-class.ts` and `publish-curriculum.ts` are how a school is set up
 * and how content reaches a classroom. Both carry their own tiny `openDb`,
 * because `schools/store` is `server-only` and these run outside a request —
 * and both were written by copying the same function.
 *
 * The copy had a defect: on the PGlite branch — the one with no early return —
 * it called `openDb(dataDir)` again instead of constructing PGlite. It recursed
 * until the heap died. `provision-class.ts` was fixed and carries a paragraph
 * about it; `publish-curriculum.ts` was not, so the documented PGlite
 * deployment could never publish a month.
 *
 * The tell is the same in both: `PGlite` imported on one line and unused on the
 * next. So that is what this asserts, over both files at once — a source check
 * because the failure is unbounded recursion, and a test that reproduces it
 * exhausts the heap rather than reporting anything.
 */

const SCRIPTS = ["scripts/provision-class.ts", "scripts/publish-curriculum.ts"];

describe.each(SCRIPTS)("%s opens PGlite instead of calling itself", (rel) => {
  const src = readFileSync(path.join(process.cwd(), rel), "utf8");

  it("constructs PGlite on the branch that has no DATABASE_URL", () => {
    expect(src, "the PGlite import must have a consumer").toContain("PGlite.create(");
  });

  it("does not call openDb from inside its own PGlite branch", () => {
    const decl = src.indexOf("async function openDb(");
    expect(decl, "openDb should exist").toBeGreaterThan(-1);

    /* The PGlite branch specifically: from the dynamic import of PGlite to the
       `return` that hands back the wrapper. That span is where the defect was,
       and bounding it this way needs no parser — the whole bug is one
       self-referential call sitting between those two lines. */
    const branch = src.indexOf('await import("@electric-sql/pglite")', decl);
    expect(branch, "the PGlite branch should exist").toBeGreaterThan(-1);
    const end = src.indexOf("return {", branch);
    /* Comments stripped first. Both files now carry a paragraph explaining the
       defect, and those paragraphs QUOTE the offending line — so a naive scan
       matches the fix's own description of the bug and fails the file that is
       correct. */
    const body = src
      .slice(branch, end)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

    expect(
      /\bawait\s+openDb\s*\(/.test(body),
      "openDb calls itself on the PGlite path — unbounded recursion until the heap dies",
    ).toBe(false);
  });
});
