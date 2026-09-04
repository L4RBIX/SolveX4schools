/**
 * The toolchain the browser downloads, named and sized.
 *
 * ## Why the sizes are here
 *
 * The worker preloads the compiler and the linker before it says it is ready,
 * and a learner watching 17 MB arrive deserves to be told how much of it has.
 * A progress bar needs a total, and there is no honest way to get one at
 * runtime: `content-length` is the BROTLI-compressed length while the stream
 * `fetch` hands us is decoded, so a percentage built from those two counts to
 * about 300%. These are the exact decoded byte counts, which is what the
 * counter actually observes.
 *
 * ## Why they cannot drift
 *
 * `scripts/cpp17-assets.mjs` is the downloader's table — the same names, the
 * same sizes, and the SHA-256 of each file, which the build verifies before
 * writing anything. Two copies of a number is exactly the shape of defect this
 * audit keeps finding, so `tests/cpp17/asset-manifest.test.ts` imports both and
 * asserts they agree. The downloader's table stays the source of truth because
 * it is the one with the checksums; this is the projection a browser needs, and
 * a browser must not import a build script.
 *
 * ## Why the version is in the URL
 *
 * `CPP17_ASSET_VERSION` is the pinned upstream commit, and the worker appends
 * it as `?v=`. The files are served with `immutable` caching — see
 * `next.config.ts` — which is only safe if the URL changes when the bytes do.
 * The filenames never change; the commit does, and it is what makes a cached
 * 31 MB compiler from a previous pin impossible to serve.
 */

/** The pinned `binji/wasm-clang` commit, short. See `scripts/cpp17-assets.mjs`. */
export const CPP17_ASSET_VERSION = "648c4a89";

export interface Cpp17Asset {
  /** The served filename, under the base URL. */
  name: string;
  /** Exact decoded size on disk. What the download counter counts up to. */
  bytes: number;
}

/**
 * In the order the worker needs them.
 *
 * `memfs.wasm` and `sysroot.tar` come first because `api.ready` waits on them;
 * `clang.wasm` and `lld.wasm` are the 50 MB that used to be fetched lazily
 * inside the first Run's thirty-second build budget, which is the defect this
 * ordering exists to fix.
 */
export const CPP17_ASSETS: readonly Cpp17Asset[] = [
  { name: "memfs.wasm", bytes: 345442 },
  { name: "sysroot.tar", bytes: 9297920 },
  { name: "clang.wasm", bytes: 31214472 },
  { name: "lld.wasm", bytes: 19490094 },
];

/** Every byte a cold browser must download before the first Run can start. */
export const CPP17_TOTAL_BYTES = CPP17_ASSETS.reduce((n, a) => n + a.bytes, 0);

/**
 * The URL for one asset, version-stamped.
 *
 * A query rather than a path segment: the files are static under `public/`, a
 * static host ignores the query when resolving them, and the HTTP cache keys on
 * the whole URL. So the bytes stay where they are and a re-pin invalidates
 * every cache in the pilot without a directory move.
 */
export function cpp17AssetUrl(baseUrl: string, name: string): string {
  return `${baseUrl}${name}?v=${CPP17_ASSET_VERSION}`;
}
