import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

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
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
