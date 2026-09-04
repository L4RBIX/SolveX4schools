import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { COMPILE_BUDGET_MS } from "../../src/lib/cpp17/runner";
import { CPP17_TOTAL_BYTES } from "../../src/lib/cpp17/assets";
import { installCpp17Worker, type Cpp17WorkerScope, type WorkerOutbound } from "../../src/lib/cpp17/worker";

/**
 * The measurement the audit made, made again — this time through the real
 * worker, with the real toolchain, on a deliberately slow link.
 *
 * ## What was measured before
 *
 * "Delay clang.wasm by 35 s in the harness: `runtime_unavailable` at 30 002 ms,
 * replacement worker fetched only memfs+sysroot." The 50 MB that is most of the
 * toolchain was downloaded INSIDE `COMPILE_BUDGET_MS`, so a link slower than
 * roughly 4.5 Mbit/s could never finish a first Run: the budget expired, the
 * worker was destroyed along with every byte it had, and the replacement began
 * again from zero.
 *
 * ## What this asserts
 *
 * The same shape of experiment, at a scale a test suite can afford. Every asset
 * fetch is delayed, and the assertion is about WHERE that delay is charged:
 *
 *   - `ready` arrives only after every byte has, so the delay is paid during
 *     init where there is a progress counter and a five-minute ceiling;
 *   - the first `run` afterwards compiles with the whole budget to itself, and
 *     posts `running` — which is the message that says the BUILD finished.
 *
 * Before the fix, the first `run` was where the download happened, and the
 * numbers below are what made that fatal.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const ASSET_DIR = path.join(REPO, "public", "cpp17");
const ASSETS = ["clang.wasm", "lld.wasm", "memfs.wasm", "sysroot.tar"].every((f) =>
  existsSync(path.join(ASSET_DIR, f)),
);

/** Per-asset delay. Small, because what is asserted is the ORDER, not seconds. */
const DELAY_MS = 120;

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe.skipIf(!ASSETS)(
  "a first Run on a slow link (needs public/cpp17 — `npm run cpp17:sync`)",
  () => {
    it(
      "pays for the download during init, and gives the compile its whole budget",
      async () => {
        const fetched: { name: string; at: number }[] = [];
        const started = Date.now();

        /* A slow origin. `worker.ts` builds its URLs with `cpp17AssetUrl`, so
           this also proves the version stamp does not break resolution. */
        globalThis.fetch = (async (input: RequestInfo | URL) => {
          const url = String(input);
          const name = url.split("/").pop()!.split("?")[0]!;
          fetched.push({ name, at: Date.now() - started });
          await new Promise((r) => setTimeout(r, DELAY_MS));
          const bytes = readFileSync(path.join(ASSET_DIR, name));
          return new Response(bytes, {
            status: 200,
            headers: { "content-type": name.endsWith(".wasm") ? "application/wasm" : "application/x-tar" },
          });
        }) as typeof fetch;

        const posted: WorkerOutbound[] = [];
        const scope: Cpp17WorkerScope = {
          onmessage: null,
          postMessage: (m) => void posted.push(m),
        };
        installCpp17Worker(scope);
        /* `post()` in the worker reaches for `self`. In Node there is none, so
           the scope stands in for it — the same substitution `installWorker`
           exists for. */
        (globalThis as unknown as { self: unknown }).self = scope;

        const send = (data: unknown) => scope.onmessage?.({ data } as MessageEvent);
        const waitFor = async (kind: string, budgetMs: number) => {
          const deadline = Date.now() + budgetMs;
          while (Date.now() < deadline) {
            const hit = posted.find((m) => m.kind === kind);
            if (hit) return hit;
            await new Promise((r) => setTimeout(r, 10));
          }
          throw new Error(`no ${kind} within ${budgetMs}ms; got ${posted.map((m) => m.kind).join(",")}`);
        };

        send({ kind: "init", baseUrl: `${ASSET_DIR}/` });
        const ready = (await waitFor("ready", 180_000)) as { kind: "ready"; initMs: number };
        const initFinishedAt = Date.now() - started;

        /* Every asset arrived before `ready`. This is the whole fix: it used to
           be two of four, and the other two were fetched inside the first Run. */
        const names = fetched.map((f) => f.name);
        expect(names, "the compiler must be resident before ready").toContain("clang.wasm");
        expect(names, "and so must the linker").toContain("lld.wasm");
        expect(names).toContain("memfs.wasm");
        expect(names).toContain("sysroot.tar");

        /* And the progress counter reported real bytes on the way. */
        const progress = posted.filter((m) => m.kind === "progress") as {
          kind: "progress";
          loadedBytes: number;
          totalBytes: number;
        }[];
        expect(progress.length, "a slow download must report progress").toBeGreaterThan(3);
        expect(progress[progress.length - 1]!.totalBytes).toBe(CPP17_TOTAL_BYTES);
        expect(
          progress[progress.length - 1]!.loadedBytes,
          "the counter must actually reach the total",
        ).toBe(CPP17_TOTAL_BYTES);
        /* Monotonic, and never past the total — a bar that overshoots is the
           `content-length` mistake this deliberately does not make. */
        for (let i = 1; i < progress.length; i += 1) {
          expect(progress[i]!.loadedBytes).toBeGreaterThanOrEqual(progress[i - 1]!.loadedBytes);
          expect(progress[i]!.loadedBytes).toBeLessThanOrEqual(progress[i]!.totalBytes);
        }
        expect(ready.initMs).toBeGreaterThan(0);

        /* Now the first Run. Nothing else may be fetched, and the build's own
           clock starts here — `running` is the message that says it finished. */
        const before = fetched.length;
        const runStarted = Date.now();
        send({
          kind: "run",
          id: 1,
          source: '#include <iostream>\nint main() { std::cout << 7 << "\\n"; }\n',
          stdin: "",
        });
        await waitFor("running", 180_000);
        const result = (await waitFor("result", 180_000)) as {
          kind: "result";
          status: string;
          stdout: string;
        };
        const buildAndRunMs = Date.now() - runStarted;

        expect(result.status, "the first Run must succeed").toBe("ok");
        expect(result.stdout).toContain("7");
        expect(
          fetched.length,
          "the first Run must not download anything — that was the defect",
        ).toBe(before);
        expect(
          buildAndRunMs,
          `first build+run took ${buildAndRunMs}ms of a ${COMPILE_BUDGET_MS}ms budget ` +
            `(init, which now carries the download, took ${initFinishedAt}ms)`,
        ).toBeLessThan(COMPILE_BUDGET_MS);
      },
      240_000,
    );
  },
);
