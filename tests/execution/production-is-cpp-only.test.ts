import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

/**
 * Production ships C++17. Python stays in the repository as a backup.
 *
 * Those are two different statements and only one of them was ever enforced.
 * The curriculum became C++ months ago, but the Python RUNTIME kept shipping:
 * `prebuild` ran `sync-pyodide-assets.mjs`, which writes 13 MB of CPython into
 * `public/`, and Next serves that directory wholesale — anything sitting there
 * when `next build` runs is published whether or not a route can reach it.
 *
 * This file pins the difference. It is deliberately structural rather than a
 * scan of build output: a test that only inspects `.next/` cannot run before a
 * build, and the property worth defending is that the build was never told to
 * include Python in the first place.
 *
 * What is NOT asserted here, on purpose: that `src/lib/pyodide/**` is gone. It
 * is the backup and it stays. The rule is that production cannot reach it, not
 * that it cannot exist.
 */

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};

/** The two artefacts the Pyodide sync scripts write into `public/`. */
const PYTHON_ARTEFACT_SCRIPTS = ["sync-pyodide-assets.mjs", "build-python-worker.mjs"];

describe("the production build carries no Python runtime", () => {
  it("prebuild does not generate the Python assets", () => {
    for (const script of PYTHON_ARTEFACT_SCRIPTS) {
      expect(
        pkg.scripts.prebuild.includes(script),
        `prebuild runs ${script}, which writes CPython into public/ — and public/ ships wholesale`,
      ).toBe(false);
    }
  });

  it("prebuild actively strips them, rather than trusting they were never made", () => {
    /* Necessary because the sync step is not their only possible source. On a
       clean CI or Vercel checkout the assets are gitignored and absent, so
       removing the sync step is enough. On a developer machine `predev` writes
       them so the /dev lab can exercise the backup path, and they persist —
       `npm run build` there would publish them. */
    expect(pkg.scripts.prebuild).toContain("strip-python-assets.mjs");
    expect(existsSync("scripts/strip-python-assets.mjs")).toBe(true);
  });

  it("predev still provides them, so the backup path stays exercisable", () => {
    /* The point of keeping Python is that it remains runnable. If `predev`
       stopped producing the assets, `/dev/execution` would be a dead screen and
       the "backup" would be source nobody can execute. */
    for (const script of PYTHON_ARTEFACT_SCRIPTS) {
      expect(pkg.scripts.predev, `predev must keep the backup path usable`).toContain(script);
    }
  });

  it("no production module graph reaches the Python runtime", () => {
    /* `src/lib/pyodide` may be imported only from `/dev`, which
       `src/app/dev/layout.tsx` turns into a 404 in production.

       This caught a real leak: the lesson player's `run-state.ts` imported
       `RunnerPhase` from `@/lib/pyodide/runner`. The symbol was used in a
       COMMENT and nowhere else — a dead import left behind when the file grew
       its own `RunPhase` — but it kept every learner's module graph pointed at
       the Python runtime. */
    const offenders: string[] = [];
    const roots = ["src/components", "src/app", "schools", "packages"];
    for (const root of roots) {
      const found = grepImports(root);
      for (const hit of found) {
        if (hit.file.startsWith("src/app/dev/")) continue; // 404 in production
        offenders.push(`${hit.file}:${hit.line}`);
      }
    }
    expect(
      offenders,
      `\nthese ship to learners and import the Python runtime:\n  ${offenders.join("\n  ")}\n`,
    ).toEqual([]);
  });

  it("the dev lab, which may import it, is unreachable in production", () => {
    const layout = readFileSync("src/app/dev/layout.tsx", "utf8");
    expect(layout).toContain('process.env.NODE_ENV === "production"');
    expect(layout).toContain("notFound()");
  });
});

/** Every `lib/pyodide` import under a directory, as file + line. */
function grepImports(root: string): { file: string; line: number }[] {
  const out: { file: string; line: number }[] = [];
  const stack = [root];
  const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");
  while (stack.length) {
    const dir = stack.pop()!;
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        stack.push(full);
        continue;
      }
      if (!/\.(ts|tsx|mts|js|jsx)$/.test(entry.name)) continue;
      if (statSync(full).size > 2_000_000) continue;
      const text = readFileSync(full, "utf8");
      if (!text.includes("lib/pyodide")) continue;
      text.split("\n").forEach((line, i) => {
        if (/from\s+["'][^"']*lib\/pyodide|import\(["'][^"']*lib\/pyodide/.test(line)) {
          out.push({ file: full, line: i + 1 });
        }
      });
    }
  }
  return out;
}
