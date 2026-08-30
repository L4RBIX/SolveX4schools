import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Discarded work kept for reference only. It is excluded from tsconfig
    // too; linting it reports errors nothing will ever fix.
    "_quarantine/**",
    // Git worktrees. A worktree is a checkout of a DIFFERENT branch living
    // inside this directory; linting it reports another branch's problems
    // against this one's build, and no edit here could ever fix them.
    ".claude/worktrees/**",
    // The Python runtime, copied verbatim out of node_modules by
    // `scripts/sync-pyodide-assets.mjs`. It is Emscripten's generated output —
    // one 1.2 MB line of it — and every complaint eslint has about it (aliasing
    // `this`, assigning to `module`, an OpenGL function whose name happens to
    // start with "use") is a complaint about a compiler, not about code anyone
    // here can change. Gitignored and regenerated on every build.
    "public/pyodide/**",
  ]),
]);

export default eslintConfig;
