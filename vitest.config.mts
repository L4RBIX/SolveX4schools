import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * The one suite that runs alone.
 *
 * `npm run test:browser-cpp` sets `CPP_BROWSER_GATE=1` and this config then
 * runs that file and nothing else; every other invocation runs everything else
 * and not that file. One switch in one place, rather than a second config file
 * that would have to keep the aliases below in sync — two copies of an alias
 * table is how a suite starts resolving a different `@schools` than the app.
 */
const BROWSER_CPP_GATE = "tests/cpp17/curriculum-in-the-learners-compiler.test.ts";
const gateOnly = process.env.CPP_BROWSER_GATE === "1";

/**
 * Array form rather than object form: one entry needs a regex, and Vite does
 * not allow the two to be mixed. Order matters — Vite matches in sequence, so
 * the deep-import pattern must precede the bare package specifier or the bare
 * one swallows it.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: "@solvex/learning-contracts", replacement: r("./packages/learning-contracts/src/index.ts") },

      /* Deep-import escape hatch. `computeInterventionOutcome` is implemented,
         exported from its own module and unit-tested, but not re-exported from
         the package barrel. Adding it to index.ts would mean editing
         learning-intelligence-core, which the import forbids everywhere except
         starterTemplates.ts — and that file's behaviour is what the golden
         fixtures assert. A path alias reaches the same function without
         touching it. */
      {
        find: /^@solvex\/learning-intelligence-core\/internal\/(.*)$/,
        replacement: r("./packages/learning-intelligence-core/src/$1"),
      },
      { find: "@solvex/learning-intelligence-core", replacement: r("./packages/learning-intelligence-core/src/index.ts") },
      { find: "@solvex/nova-core", replacement: r("./packages/nova-core/src/index.ts") },

      // School code. Mirrors the `@schools/*` path alias in tsconfig.json.
      { find: "@schools", replacement: r("./schools") },
      { find: "@/", replacement: r("./src/") },

      /* `server-only` throws on import outside a React Server Component. Its
         job is to fail the NEXT BUILD if a secret-holding module is pulled into
         a client bundle — a guarantee this project depends on. It has nothing
         to say about a node test runner, where there is no client bundle to
         leak into, so it is stubbed here rather than removed from the sources. */
      { find: "server-only", replacement: r("./tests/stubs/server-only.ts") },

      /* `next/font/*` is compiled away by Next's own loader; imported directly
         it is not callable. Stubbed so a test can import a module that declares
         a font — which is how the route tests check that the baseline layout
         404s in production. */
      { find: "next/font/local", replacement: r("./tests/stubs/next-font.ts") },
      { find: "next/font/google", replacement: r("./tests/stubs/next-font.ts") },
    ],
  },
  test: {
    environment: "node",

    /*
     * The browser toolchain runs in its OWN command, not in this one.
     *
     * `tests/cpp17/curriculum-in-the-learners-compiler.test.ts` compiles all 263
     * reference solutions with the shipped `clang.wasm` — 145 seconds of one
     * core at 100%, inside a run that already spawns a real `g++` per reference
     * across every other core. Measured together: a single `g++ -std=c++17` on
     * a two-line snippet exceeded a TWO MINUTE timeout, and
     * `wrong-solutions-fail` exceeded thirty seconds. Neither is a defect in
     * the thing being tested; both are a laptop with nothing left to give, and
     * a suite that fails for that reason is a suite people stop believing.
     *
     * So it is excluded here and run by `npm run test:browser-cpp`, which CI
     * invokes as its own step after `npm test`. Sequential, uncontended, and
     * still a release gate: the file fails rather than skips when the assets
     * are missing under CI.
     */
    include: gateOnly ? [BROWSER_CPP_GATE] : ["tests/**/*.test.ts"],
    exclude: gateOnly
      ? ["**/node_modules/**", "**/dist/**"]
      : ["**/node_modules/**", "**/dist/**", BROWSER_CPP_GATE],

    /* 30 seconds, against defaults of 5 and 10.
     *
     * Not because anything here is slow. The curriculum suites execute real
     * Python — `content-execution` runs 262 reference solutions against 2143
     * cases, one process each — and vitest runs test FILES in parallel across
     * every core. So while those are running, the machine is saturated, and the
     * tests that lose are the ones that are CPU-bound for their own reasons:
     * `auth`'s deliberately-expensive password hashing, and `forged-outcomes`'
     * hook, which imports an API route and opens the store.
     *
     * The symptom was the worst kind. Both pass alone in 13 seconds; both
     * failed only in a full run, and not the same both times — so a full run
     * would report two or three failures that had nothing to do with the change
     * being tested, in a suite whose entire job is to be believed. One of them
     * even surfaced as a test FILE failing to load, which reads as a broken
     * import rather than a busy laptop.
     *
     * A real regression in any of these is orders of magnitude away from 30
     * seconds, so nothing slow is being hidden. The alternative — capping
     * `maxWorkers` — would make every run slower to fix a problem that only
     * appears in one. */
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
