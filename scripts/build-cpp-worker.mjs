#!/usr/bin/env node
/**
 * build-cpp-worker.mjs — compile the C++17 worker to a real module worker.
 *
 * Same reason as `build-python-worker.mjs`, which explains it at length: a
 * Turbopack-emitted worker ends up classic in practice, and a classic worker
 * cannot `import`. Our worker imports the vendored wasm-clang runtime, so it
 * has to be a genuine module — which means building it ourselves to a stable
 * path under `public/` and loading it by URL.
 *
 * `src/lib/cpp17/worker.ts` stays the single source of truth: still TypeScript,
 * still type-checked by `tsc --noEmit`, still unit-tested through its exported
 * pure functions. Only the delivery changes. Output is gitignored.
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { stat } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(root, "public", "cpp17-worker.js");

await build({
  entryPoints: [path.join(root, "src", "lib", "cpp17", "worker.ts")],
  outfile,
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  legalComments: "inline",
  /* The vendored runtime carries Apache-2.0 and LLVM notices; `legalComments:
     "inline"` keeps them in the shipped file rather than stripping attribution
     out of a binary-adjacent artefact. */
  alias: { "@schools": path.join(root, "schools") },
});

const { size } = await stat(outfile);
console.log(`[cpp17-worker] built public/cpp17-worker.js (${(size / 1024).toFixed(1)} KB, esm)`);
