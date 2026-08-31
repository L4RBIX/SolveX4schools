#!/usr/bin/env node
/**
 * sync-cpp17-assets.mjs — put the pinned C++17 toolchain under `public/cpp17/`.
 *
 * ## Why these are fetched and not committed
 *
 * The toolchain is 57 MB on disk. Committing it would put 57 MB into every
 * clone of a repository whose entire source is 3 MB, forever, for a binary that
 * changes when we deliberately change it and never otherwise. So it is fetched
 * once at build time and cached — the same decision `sync-pyodide-assets.mjs`
 * made for CPython, for the same reason.
 *
 * ## What makes that safe
 *
 * A pinned commit and a checksum, verified before anything is written. This is
 * a C++ compiler that will execute in a child's browser; "whatever the default
 * branch has today" is not an acceptable answer to where it came from.
 *
 *   - `UPSTREAM_COMMIT` is a 40-character SHA, never a tag or a branch.
 *   - Every asset carries its SHA-256. A mismatch throws and deletes the file.
 *     There is no "continue anyway" path and no fallback mirror: a build that
 *     cannot prove what it downloaded must fail, not guess.
 *   - Nothing is fetched at RUNTIME. These land under `public/` and are served
 *     from our own origin, so a learner's browser never talks to a third party
 *     to get a compiler.
 *
 * ## Licences
 *
 * Apache-2.0 (wasm-clang) and the LLVM Exception, vendored beside the runtime
 * at `src/lib/cpp17/vendor/`. `sysroot.tar` carries wasi-libc and libc++, both
 * Apache-2.0-with-LLVM-exception. See docs/cpp17/CPP17_BROWSER_RUNTIME.md.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "cpp17");

/** binji/wasm-clang. A commit, so the bytes cannot move under us. */
export const UPSTREAM_COMMIT = "648c4a89997a351eef75cdaec3ef5b89d4937dec";

/**
 * `local` is the served name; `upstream` is what the file is called in the
 * repository. The rename to `.wasm` is not cosmetic:
 * `WebAssembly.compileStreaming` refuses anything that is not served as
 * `application/wasm`, and the extension is what makes a static host say that.
 * Upstream ships them extensionless and works around it in its own server.
 */
export const CPP17_ASSETS = [
  {
    local: "clang.wasm",
    upstream: "clang",
    bytes: 31214472,
    sha256: "2a466f0e990329d3230b869d04fc20803eae96a7feb3a3f6c93e25a77b8aed1d",
  },
  {
    local: "lld.wasm",
    upstream: "lld",
    bytes: 19490094,
    sha256: "36419ed202011765222098d7701218378b67f634d50f0a4625059ae2c9860f48",
  },
  {
    local: "memfs.wasm",
    upstream: "memfs",
    bytes: 345442,
    sha256: "2c72ee42bd9430029dda8c6bafc9f37143f6fe88d5f1ea950a70259ab748bcfe",
  },
  {
    local: "sysroot.tar",
    upstream: "sysroot.tar",
    bytes: 9297920,
    sha256: "2435a7b549af30c2be7ec249c405bc2e911ab0c6003012f0909ec3c131bff867",
  },
];

const url = (name) =>
  `https://raw.githubusercontent.com/binji/wasm-clang/${UPSTREAM_COMMIT}/${name}`;

async function digest(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function current(target, asset) {
  try {
    const s = await stat(target);
    if (s.size !== asset.bytes) return false;
    return (await digest(target)) === asset.sha256;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let fetched = 0;
  let kept = 0;

  for (const asset of CPP17_ASSETS) {
    const target = path.join(OUT, asset.local);
    if (await current(target, asset)) {
      kept += 1;
      continue;
    }

    const from = url(asset.upstream);
    const res = await fetch(from);
    if (!res.ok) {
      throw new Error(`[cpp17] ${asset.local}: HTTP ${res.status} from ${from}`);
    }
    const body = Buffer.from(await res.arrayBuffer());
    const got = createHash("sha256").update(body).digest("hex");

    if (got !== asset.sha256) {
      /* Fail closed, and leave nothing behind. A half-written compiler on disk
         is worse than none: the next build would find a file of the right name
         and have to decide whether to trust it. */
      throw new Error(
        `[cpp17] CHECKSUM MISMATCH for ${asset.local}\n` +
          `  expected ${asset.sha256}\n` +
          `  actual   ${got}\n` +
          `  from     ${from}\n` +
          `  Refusing to write a compiler this build cannot identify.`,
      );
    }

    await writeFile(target, body);
    fetched += 1;
  }

  const total = CPP17_ASSETS.reduce((n, a) => n + a.bytes, 0);
  console.log(
    `[cpp17] wasm-clang @ ${UPSTREAM_COMMIT.slice(0, 8)} → public/cpp17/ — ` +
      `${fetched} fetched, ${kept} already current ` +
      `(${(total / 1048576).toFixed(1)} MB on disk, ~18 MB gzipped)`,
  );
}

main().catch(async (err) => {
  console.error(err.message ?? err);
  /* Do not leave a partial toolchain for the next run to trip over. */
  for (const a of CPP17_ASSETS) {
    await unlink(path.join(OUT, a.local)).catch(() => {});
  }
  process.exit(1);
});
