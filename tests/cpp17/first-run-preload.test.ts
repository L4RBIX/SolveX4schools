import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMPILE_BUDGET_MS,
  Cpp17Runner,
  INIT_BUDGET_MS,
  type RunnerWorker,
} from "../../src/lib/cpp17/runner";
import { CPP17_ASSETS, CPP17_TOTAL_BYTES, cpp17AssetUrl } from "../../src/lib/cpp17/assets";
import { runDownloadNote } from "../../src/components/brilliant/lesson/blocks/run-state";

/**
 * The first Run has to be able to finish on a school connection.
 *
 * ## The defect
 *
 * The preload fetched `memfs.wasm` and `sysroot.tar` — 9 MB of 57 — and said it
 * was ready. `clang.wasm` (31 MB) and `lld.wasm` (19 MB) are fetched lazily by
 * the reference runtime from inside `compile()` and `link()`, which is inside
 * the first Run, which is inside `COMPILE_BUDGET_MS`: the thirty seconds that
 * exist to bound a COMPILE.
 *
 * Below roughly 4.5 Mbit/s that budget expires mid-download. The runner then
 * destroys the worker — throwing away every byte that had arrived — and starts
 * a replacement from zero. So the learner sees «Компилятор C++ не запустился»
 * on every press, and pressing again makes it worse. At 20 Mbit/s shared by a
 * class of thirty, the first compile is about 224 seconds away.
 *
 * ## What is asserted here
 *
 * That the worker is not told it is ready until the compiler and the linker are
 * resident, that the byte counter is real, and that a download now has a
 * ceiling and a retry of its own instead of hanging forever.
 *
 * The wall-clock behaviour on a throttled connection is a browser measurement
 * and lives in the Playwright acceptance run; what a Node test can hold is the
 * ORDER of events, which is where the defect was.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const read = (rel: string) => readFileSync(path.join(REPO, rel), "utf8");

describe("the toolchain is resident before the runner says it is ready", () => {
  it("preloads the compiler and the linker inside init, not inside the first Run", () => {
    /*
     * Asserted on the source because the ORDER is the fix, and the order is
     * only observable in a real browser otherwise. `init` must reach for both
     * big modules before it posts `ready`; if it stops, the first Run pays for
     * 50 MB inside a thirty-second build budget again.
     */
    const worker = read("src/lib/cpp17/worker.ts");
    const init = worker.slice(worker.indexOf("async function init("), worker.indexOf("async function run("));

    expect(init, "clang must be fetched during init").toContain('getModule("clang.wasm")');
    expect(init, "and so must lld").toContain('getModule("lld.wasm")');

    const clangAt = init.indexOf('getModule("clang.wasm")');
    const readyAt = init.indexOf('post({ kind: "ready"');
    expect(clangAt, "the preload must happen").toBeGreaterThan(0);
    expect(readyAt, "and ready must be posted").toBeGreaterThan(0);
    expect(clangAt, "ready must come AFTER the compiler is resident").toBeLessThan(readyAt);
  });

  it("counts real decoded bytes against a real total", () => {
    /* The totals are exact decoded sizes. A percentage from `content-length`
       would be the BROTLI length against a decoded stream and would count past
       300%, which is why the panel renders megabytes instead. */
    expect(CPP17_TOTAL_BYTES).toBe(CPP17_ASSETS.reduce((n, a) => n + a.bytes, 0));
    expect(CPP17_TOTAL_BYTES).toBeGreaterThan(50 * 1024 * 1024);

    const note = runDownloadNote({ phase: "loading", loadedBytes: 12 * 1_048_576, totalBytes: CPP17_TOTAL_BYTES });
    expect(note, "a loading panel must say something").not.toBeNull();
    expect(note!.ru).toContain("12 / 58");
    expect(note!.ru, "never a percentage").not.toContain("%");
  });

  it("says nothing rather than something false before a total is known", () => {
    expect(runDownloadNote({ phase: "loading", loadedBytes: 0, totalBytes: null })).toBeNull();
    expect(runDownloadNote({ phase: "ready", loadedBytes: 1, totalBytes: 2 })).toBeNull();
    expect(runDownloadNote({ phase: "compiling", loadedBytes: 1, totalBytes: 2 })).toBeNull();
  });

  it("version-stamps every asset URL, so `immutable` is honest", () => {
    /* The files are served with a year of `immutable` caching. That is only
       safe because the URL carries the pinned upstream commit: the filenames
       never change and the bytes do. */
    for (const asset of CPP17_ASSETS) {
      const url = cpp17AssetUrl("/cpp17/", asset.name);
      expect(url).toContain(asset.name);
      expect(url, `${asset.name} must be version-stamped`).toMatch(/\?v=[0-9a-f]{8}$/);
    }
  });

  it("serves the toolchain immutable and keeps the identity middleware off it", () => {
    const config = read("next.config.ts");
    expect(config, "the toolchain must be cached for a year").toContain(
      "public, max-age=31536000, immutable",
    );
    expect(config).toContain("/cpp17/:file*");

    const proxy = read("proxy.ts");
    expect(
      proxy,
      "57 MB across four requests must not each run an identity middleware",
    ).toContain("cpp17/");
  });
});

describe("a download that never finishes", () => {
  it("gives up with a retry instead of hanging forever", async () => {
    vi.useFakeTimers();
    try {
      /* A worker that accepts `init` and never answers. `ensureWorker` had no
         ceiling at all, so this left `warm()` pending for the life of the page
         while the panel showed «C++ дайындалып жатыр…» with nothing behind it
         and no way to retry. */
      let terminated = 0;
      const runner = new Cpp17Runner({
        createWorker: (): RunnerWorker => ({
          postMessage: () => {},
          terminate: () => void (terminated += 1),
          onmessage: null,
          onerror: null,
        }),
      });

      const warming = runner.warm();
      expect(runner.status().phase).toBe("loading");

      await vi.advanceTimersByTimeAsync(INIT_BUDGET_MS + 10);
      await expect(warming).resolves.toBe(false);

      expect(terminated, "the stalled worker must be destroyed").toBe(1);
      expect(runner.status().phase, "and the panel must offer a retry").toBe("failed");
      expect(runner.status().error).toContain("did not finish");
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives the download its own budget, larger than a compile's", () => {
    /* Two different questions with two different answers. A build that takes
       thirty seconds is a slow machine; a download that takes thirty seconds is
       an ordinary school connection barely started. Billing the second to the
       first is the whole defect. */
    expect(INIT_BUDGET_MS).toBeGreaterThan(COMPILE_BUDGET_MS);
    expect(INIT_BUDGET_MS).toBeGreaterThanOrEqual(120_000);
  });

  it("reports progress from the loading worker only", async () => {
    /* A late message from a worker that has been superseded must not move a bar
       that now belongs to its replacement. */
    let post: ((m: unknown) => void) | null = null;
    const runner = new Cpp17Runner({
      createWorker: (): RunnerWorker => {
        const w: RunnerWorker = {
          postMessage: () => {},
          terminate: () => {},
          onmessage: null,
          onerror: null,
        };
        post = (m: unknown) => w.onmessage?.({ data: m } as MessageEvent);
        return w;
      },
    });

    const warming = runner.warm();
    post!({ kind: "progress", loadedBytes: 5, totalBytes: CPP17_TOTAL_BYTES });
    expect(runner.status().loadedBytes).toBe(5);
    expect(runner.status().totalBytes).toBe(CPP17_TOTAL_BYTES);

    post!({ kind: "ready", initMs: 1 });
    await expect(warming).resolves.toBe(true);
    expect(runner.status().phase).toBe("ready");
  });
});
