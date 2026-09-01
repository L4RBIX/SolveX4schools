#!/usr/bin/env node
/**
 * Remove the Python runtime from `public/` before a production build.
 *
 * ## Why this is a build step and not a `.gitignore` line
 *
 * The owner's rule is that production ships C++17 only, while the Python
 * runtime stays in the repository as a backup. Those two things are in tension
 * inside `public/`, because Next serves that directory wholesale — anything
 * sitting there when `next build` runs is published, whether or not a route
 * references it.
 *
 * Dropping the sync scripts from `prebuild` is necessary but NOT sufficient.
 * The assets are generated, gitignored artefacts, so a clean CI or Vercel
 * checkout never has them and the sync step was their only source. A developer
 * machine is different: `predev` writes them so the `/dev/execution` lab can
 * exercise the backup path, and they then persist. `npm run build` on that
 * machine would publish 13 MB of CPython that no production route can reach.
 *
 * So the production build removes them rather than trusting that they were
 * never made. `predev` puts them back for the next `npm run dev`.
 *
 * ## Deliberately narrow
 *
 * It deletes exactly the two paths the Pyodide sync scripts create, and nothing
 * else — no globs, no recursion into anything it was not told about. If the
 * paths are absent it says so and exits 0, because "already clean" is the
 * normal case on CI and is not a failure.
 *
 * The SOURCE under `src/lib/pyodide/` is untouched. That is the backup, it is
 * TypeScript rather than a 13 MB runtime, and nothing in the production module
 * graph imports it — `/dev` is the only importer and `src/app/dev/layout.tsx`
 * returns `notFound()` in production.
 */
import { existsSync, rmSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";

/** Exactly what `sync-pyodide-assets.mjs` and `build-python-worker.mjs` write. */
const PYTHON_ARTEFACTS = ["public/pyodide", "public/pyodide-worker.js"];

function sizeOf(target) {
  const stat = statSync(target);
  if (!stat.isDirectory()) return stat.size;
  let total = 0;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    total += sizeOf(path.join(target, entry.name));
  }
  return total;
}

let removed = 0;
let bytes = 0;

for (const target of PYTHON_ARTEFACTS) {
  if (!existsSync(target)) continue;
  bytes += sizeOf(target);
  rmSync(target, { recursive: true, force: true });
  removed += 1;
  console.log(`[strip-python] removed ${target}`);
}

console.log(
  removed === 0
    ? "[strip-python] public/ already carries no Python runtime"
    : `[strip-python] ${removed} artefact(s), ${(bytes / 1024 / 1024).toFixed(1)} MB — production ships C++17 only`,
);
