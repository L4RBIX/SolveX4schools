import { describe, expect, it } from "vitest";
import { CPP17_ASSETS, CPP17_ASSET_VERSION, CPP17_TOTAL_BYTES } from "../../src/lib/cpp17/assets";
import {
  CPP17_ASSETS as DOWNLOADER_ASSETS,
  UPSTREAM_COMMIT,
} from "../../scripts/cpp17-assets.mjs";

/**
 * The browser's copy of the asset sizes and the downloader's must agree.
 *
 * ## Why there are two copies at all
 *
 * The downloader's table carries the SHA-256 of every file and is what the
 * build verifies before writing a compiler that will run in a child's browser.
 * That table is the source of truth and it lives in a build script, which a
 * browser must not import.
 *
 * `src/lib/cpp17/assets.ts` is the projection the WORKER needs: the exact
 * decoded byte counts the download progress bar counts against, and the pinned
 * commit that version-stamps every URL so a year of `immutable` caching is
 * honest. It cannot be derived at runtime — `content-length` is the compressed
 * length, so a percentage built from it counts past 300%.
 *
 * ## Why this test
 *
 * Two copies of a number is the exact shape of defect this whole hardening pass
 * keeps finding: a hand-written table that was right when it was written and
 * silently wrong afterwards. This is the one thing that makes a second copy
 * acceptable — re-pinning the toolchain fails here until both are updated.
 */

describe("the toolchain manifest", () => {
  it("names the same files, at the same sizes, as the downloader verifies", () => {
    const byName = new Map(
      (DOWNLOADER_ASSETS as { local: string; bytes: number }[]).map((a) => [a.local, a.bytes]),
    );

    expect(CPP17_ASSETS.length, "every asset the build fetches must be listed").toBe(byName.size);
    for (const asset of CPP17_ASSETS) {
      expect(byName.has(asset.name), `${asset.name} is not one the build fetches`).toBe(true);
      expect(asset.bytes, `${asset.name} size has drifted from the verified table`).toBe(
        byName.get(asset.name),
      );
    }
  });

  it("stamps URLs with the commit the build actually pinned", () => {
    /* A year of `immutable` caching is only safe if the URL changes when the
       bytes do. The filenames never change; this is what does. */
    expect(UPSTREAM_COMMIT.startsWith(CPP17_ASSET_VERSION), "the pin has moved").toBe(true);
    expect(CPP17_ASSET_VERSION).toMatch(/^[0-9a-f]{8}$/);
  });

  it("adds up to the total the progress bar counts to", () => {
    const sum = (DOWNLOADER_ASSETS as { bytes: number }[]).reduce((n, a) => n + a.bytes, 0);
    expect(CPP17_TOTAL_BYTES).toBe(sum);
  });
});
