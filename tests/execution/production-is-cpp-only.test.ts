import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

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

describe("no Python tool validates C++ content", () => {
  /**
   * The failure class that bit five times.
   *
   * Every gate that executes curriculum code was written against python3, and
   * each one had to be migrated separately: `content-execution`,
   * `content-integrity`, `check-blocks`, `wrong-solution-report` and
   * `may-complexity-guards`. The last two were the instructive ones, because
   * both stayed GREEN while checking nothing.
   *
   * `wrong-solution-report.ts` ran each wrong program with python3 and treated
   * ANY throw as "this case killed it" — so once the fixtures became C++ every
   * one threw a SyntaxError on its first case and the audit printed
   * "19 recorded false accepts, 0 still accepted" without executing anything.
   *
   * `may-complexity-guards` ran C++ through python3, got a SyntaxError in
   * ~140 ms, and a blanket catch mapped it to the timeout sentinel — so a
   * timing guard reported a timing verdict about a program that never ran.
   *
   * A Python interpreter cannot parse C++, so it fails on EVERY input. Any
   * tool that treats failure as a signal will therefore report that signal
   * uniformly and look decisive. That is worse than a crash, and it is why
   * this is a gate rather than a note.
   */
  const CURRICULUM_CODE_FIELDS = /referenceSolution|block\.code|fixedCode/;
  const RUNS_PYTHON = /execFileSync\(\s*["'`]?python3|EXEC_PYTHON_BIN|spawnSync\(\s*["'`]?python3/;

  it("every file that executes curriculum code uses the C++ harness", () => {
    const offenders: string[] = [];
    for (const file of walk(["tests", "scripts"])) {
      /* This file names both patterns as string literals in order to search
         for them, so it matches itself. Excluding the gate from its own sweep
         is the whole exception — nothing else is skipped. */
      if (file.endsWith("production-is-cpp-only.test.ts")) continue;
      const text = readFileSync(file, "utf8");
      if (!CURRICULUM_CODE_FIELDS.test(text)) continue;
      if (!RUNS_PYTHON.test(text)) continue;
      offenders.push(file);
    }
    expect(
      offenders,
      `\nthese reach curriculum code and can invoke python3 on it:\n  ${offenders.join("\n  ")}\n` +
        `A Python interpreter fails on every C++ input, so a tool that reads failure as a\n` +
        `signal reports that signal uniformly and looks decisive while checking nothing.\n`,
    ).toEqual([]);
  });

  it("finds the C++ harness in the gates that matter, so this is not vacuous", () => {
    /* If the walk were broken, or the gates stopped touching curriculum code,
       the assertion above would pass having examined nothing. */
    const gates = [
      "tests/school/content-execution.test.ts",
      "tests/school/content-integrity.test.ts",
      "tests/school/wrong-solutions-fail.test.ts",
      "tests/school/may-complexity-guards.test.ts",
      "scripts/check-blocks.ts",
      "scripts/wrong-solution-report.ts",
    ];
    for (const gate of gates) {
      const text = readFileSync(gate, "utf8");
      expect(CURRICULUM_CODE_FIELDS.test(text), `${gate} no longer reads curriculum code`).toBe(true);
      expect(text, `${gate} does not use the shared C++ harness`).toMatch(
        /support\/cpp-run|compileReference|cppCompiler/,
      );
    }
  });
});

/** Every .ts/.mjs file under the given roots. */
function walk(roots: string[]): string[] {
  const out: string[] = [];
  const stack = [...roots];
  while (stack.length) {
    const dir = stack.pop()!;
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        stack.push(full);
        continue;
      }
      if (!/\.(ts|tsx|mjs|js)$/.test(entry.name)) continue;
      if (statSync(full).size > 2_000_000) continue;
      out.push(full);
    }
  }
  return out;
}
