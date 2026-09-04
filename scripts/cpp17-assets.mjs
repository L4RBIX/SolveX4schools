/**
 * The pinned wasm-clang toolchain: what to fetch, how big it is, and its hash.
 *
 * Split out of `sync-cpp17-assets.mjs` so it can be imported without running a
 * download. `tests/cpp17/asset-manifest.test.ts` imports it to check that the
 * browser's own copy of the sizes — `src/lib/cpp17/assets.ts`, which the
 * download progress bar counts against — has not drifted from the table the
 * build actually verifies. Importing the CLI would have fetched 57 MB.
 */
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
