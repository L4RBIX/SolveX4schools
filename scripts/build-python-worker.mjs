#!/usr/bin/env node
/**
 * build-python-worker.mjs — compile the Python worker to a real module worker.
 *
 * ## Why the bundler cannot be allowed to emit this one
 *
 * `new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })` is
 * the documented way to ship a bundled worker, and Turbopack honours it in the
 * sense that it passes `{ type: "module" }` through to the constructor. What it
 * also does is wrap the worker in its own bootstrap, and that bootstrap ends:
 *
 *     importScripts.apply(self, t)
 *
 * `importScripts` exists only in a CLASSIC worker. A module worker does not
 * have it. So the emitted worker is classic in practice, and the first thing
 * our worker does inside it — `await import(baseUrl + "pyodide.mjs")` — fails
 * with the browser's own words:
 *
 *     Classic web workers are not supported
 *
 * Pyodide simply cannot be loaded from a Turbopack-bundled worker. This was
 * found by opening the dev lab in Chrome and reading the status line; every
 * unit test passes regardless, because they inject a fake worker and never
 * touch the real construction path. See `scripts/manual/pyodide-browser-probe.md`.
 *
 * ## The fix, and why it is the same one the runtime already uses
 *
 * Compile the worker ourselves, to a plain ESM file under `public/`, and load
 * it by URL. That is exactly what `sync-pyodide-assets.mjs` does with CPython
 * and for the same reason: some things must be fetched at runtime from a stable
 * path rather than resolved inside a hashed chunk.
 *
 * `worker.ts` stays the single source of truth — still TypeScript, still
 * type-checked by `tsc --noEmit`, still unit-tested through its exported pure
 * functions. Only the delivery changes.
 *
 * Wired to `prebuild` and `predev`, so `npm run build` and `npm run dev` both
 * get it without anyone having to know it exists. Output is gitignored.
 */
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(ROOT, "src", "lib", "pyodide", "worker.ts");
const OUTPUT = path.join(ROOT, "public", "pyodide-worker.js");

const result = await build({
  entryPoints: [ENTRY],
  outfile: OUTPUT,
  bundle: true,
  /* The whole point. Anything else and we are back to `importScripts`. */
  format: "esm",
  platform: "browser",
  /* WebAssembly and module workers arrived together; a browser that has one has
     the other. Targeting lower would only hide an incompatibility that Pyodide
     would hit two lines later anyway. */
  target: ["chrome94", "firefox114", "safari15"],
  minify: process.env.NODE_ENV !== "development",
  sourcemap: false,
  /* `worker.ts` imports two things and both are type-only, so this bundle has
     no runtime dependencies at all. Pyodide itself is fetched at RUN time from
     `/pyodide/pyodide.mjs` through a dynamic import esbuild cannot see and must
     not try to resolve — the path is a variable, so it is left alone. */
  logLevel: "silent",
  /* Resolve the `@schools/*` alias the same way tsconfig does, so the worker
     can keep importing its status type from the one file that defines it. */
  alias: {
    "@schools": path.join(ROOT, "schools"),
  },
});

if (result.errors.length > 0) {
  for (const e of result.errors) console.error(`[python-worker] ${e.text}`);
  process.exit(1);
}

const { size } = await stat(OUTPUT);
console.log(`[python-worker] built public/pyodide-worker.js (${(size / 1024).toFixed(1)} KB, esm)`);
