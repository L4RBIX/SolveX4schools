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
    /* The two generated Web Workers, built by `scripts/build-*-worker.mjs` and
       gitignored like the runtime they load. They are bundler output — the
       `module` assignment eslint objects to in `cpp17-worker.js` is the
       vendored clang shim inlined into it — and regenerated on every `predev`
       and `prebuild`, so nothing anyone edits here would survive. */
    "public/cpp17-worker.js",
    "public/pyodide-worker.js",
  ]),

  {
    /* The vendored wasm-clang shim, and ONE rule rather than the whole file.
     *
     * `src/lib/cpp17/vendor/wasm-clang-shared.js` is binji's wasm-clang copied
     * at a pinned commit and carrying three documented patches of our own, so
     * it is not ignorable the way `public/pyodide/**` is — we want lint on the
     * parts we wrote.
     *
     * What we do not want is a Next.js APP rule applied to it.
     * `no-assign-module-variable` exists because assigning to `module` breaks
     * Next's bundler in application code; here `const module = await
     * WebAssembly.compile(...)` is a local naming a WebAssembly.Module, in a
     * file that never enters the Next graph — it is fetched by a Web Worker.
     * Renaming it would diverge from upstream for a warning that does not
     * apply, and every re-vendoring would have to re-apply the rename. */
    files: ["src/lib/cpp17/vendor/**"],
    rules: { "@next/next/no-assign-module-variable": "off" },
  },
]);

export default eslintConfig;
