#!/usr/bin/env node
/**
 * sync-pyodide-assets.mjs — put the Python runtime where the browser can fetch it.
 *
 * Copies the five files Pyodide needs at run time out of `node_modules/pyodide`
 * and into `public/pyodide/`, from where `src/lib/pyodide/worker.ts` loads them.
 *
 * ## Why a copy step instead of bundling, or a CDN
 *
 * Pyodide resolves `pyodide.asm.wasm` and `python_stdlib.zip` at run time,
 * relative to the URL its own entry script was served from. Bundled into a
 * hashed chunk, those resolutions point at a directory containing neither file.
 * A CDN would fix that and break three things this product has committed to:
 * lessons that survive a dropped school connection, a
 * `script-src 'self' 'wasm-unsafe-eval'` policy with no third-party host in it,
 * and the residency claim in `docs/CODE_EXECUTION_DECISION.md` that a Kazakh
 * student's code never leaves the laptop.
 *
 * ## Why the files are copied rather than committed
 *
 * 13 MB of WebAssembly in git is 13 MB in every clone forever, and it would be
 * a SECOND place the runtime version is recorded. Copying from node_modules
 * makes `package.json` the only pin: bumping the dependency bumps what is
 * served, with nothing to remember. `public/pyodide/` is gitignored.
 *
 * Wired to `prebuild` and `predev`, so `npm run build` and `npm run dev` both
 * get it without anyone having to know it exists. Idempotent — it skips files
 * that already match by size and mtime.
 *
 * Usage: node scripts/sync-pyodide-assets.mjs [--force]
 */
import { createRequire } from "node:module";
import { cp, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESTINATION = path.join(REPO_ROOT, "public", "pyodide");
const FORCE = process.argv.includes("--force");

/**
 * Exactly what a browser asks for, and nothing else.
 *
 * `pyodide.mjs` is the entry the worker imports; it then fetches `pyodide.asm.mjs`
 * (the Emscripten glue), `pyodide.asm.wasm` (CPython itself) and
 * `python_stdlib.zip` (the standard library). `pyodide-lock.json` is read on
 * startup even though we install no packages — it is how Pyodide decides it has
 * a coherent runtime.
 *
 * Not copied, deliberately: the source maps (2 MB of no use to a learner) and
 * the two console demo pages, which would publish an unauthenticated Python
 * REPL on the school's own origin.
 */
const ASSETS = [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

const require = createRequire(import.meta.url);

async function main() {
  let source;
  try {
    source = path.dirname(require.resolve("pyodide/package.json"));
  } catch {
    console.error(
      "[pyodide] the `pyodide` package is not installed. Run `npm install` first.",
    );
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(path.join(source, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(path.join(source, "pyodide-lock.json"), "utf8"));

  await mkdir(DESTINATION, { recursive: true });

  let copied = 0;
  for (const name of ASSETS) {
    const from = path.join(source, name);
    const to = path.join(DESTINATION, name);
    if (!FORCE && (await isCurrent(from, to))) continue;
    await cp(from, to);
    copied += 1;
  }

  console.log(
    `[pyodide] ${manifest.version} (Python ${lock.info.python}) → public/pyodide/ ` +
      `— ${copied} file(s) copied, ${ASSETS.length - copied} already current`,
  );
}

/** Same size and no older than the source. Cheap, and wrong only if someone
    edits a copied artifact by hand, which `--force` is for. */
async function isCurrent(from, to) {
  try {
    const [a, b] = await Promise.all([stat(from), stat(to)]);
    return a.size === b.size && b.mtimeMs >= a.mtimeMs;
  } catch {
    return false;
  }
}

await main();
