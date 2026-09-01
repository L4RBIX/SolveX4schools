import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { Cpp17Runner, type RunnerWorker } from "../../src/lib/cpp17/runner";
import { CPP_STANDARD, DEFAULT_CPP17_BASE_URL, classifyFailure, stripProgress } from "../../src/lib/cpp17/worker";
import { LOCAL_LIMITS, isLearnerOutcome } from "@schools/execution/trust";
import { EXECUTION_LIMITS } from "@schools/exec/execution-limits";

/**
 * Contract pins for the browser C++17 sandbox.
 *
 * ## Read this before trusting anything in here
 *
 * `docs/cpp17/CPP17_SANDBOX_AUDIT.md` is the STRONGER evidence and stays the
 * primary record. It is seven adversarial probes run in a real Chrome against
 * the real lesson player as a signed-in learner — `ifstream` on `/etc/passwd`,
 * `system("ls /")`, `socket(AF_INET, …)`, `getenv` on six names, a 4 GB
 * allocation, `while (true) {}`, two million lines of output. Those are
 * *integration* results: they exercise the shipped worker, the shipped page and
 * a real browser's process boundary, and nothing in this file replaces them.
 *
 * These are **pins**. They exist because that audit had zero test-side
 * equivalents, which meant a refactor could quietly widen the sandbox and no
 * suite would notice until somebody thought to open Chrome again. Each one
 * fixes a contract in place so that *changing it becomes a failing test rather
 * than a silent regression*.
 *
 * ## What is deliberately NOT attempted
 *
 * No browser capability is faked. There is no jsdom `Worker`, no stub
 * `WebAssembly`, and no test here asserts that a `socket()` call is "blocked",
 * because in Node that would prove nothing about a browser and would be a
 * comforting lie in a green suite.
 *
 * What Node CAN do honestly is quite a lot, and it is what the rest of this
 * file does:
 *
 *   - load the **real pinned `memfs.wasm`** and read its import table, which is
 *     the whole of what that module can reach;
 *   - stand up the **real vendored runtime** (`wasm-clang-shared.js`) and run
 *     hand-assembled WASI programs through it, so the environment a learner's
 *     program sees is *measured from inside a running program* rather than read
 *     off a source line;
 *   - drive the **real runner** with a fake worker, which is legitimate because
 *     the runner's contract is precisely what it posts and when it terminates.
 *
 * ## The one thing to remember
 *
 * The audit's finding is that denial here is STRUCTURAL: "there is no socket
 * call to deny, no `exec` to sandbox, and no host path to traverse to. Denial
 * is not a policy that could be misconfigured; the capability was never
 * imported." Every pin below is aimed at that sentence — at the import table,
 * not at a runtime check — because that is where the property actually lives.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const ASSET_DIR = path.join(REPO, "public", "cpp17");
const VENDOR = path.join(REPO, "src", "lib", "cpp17", "vendor", "wasm-clang-shared.js");

/**
 * `public/cpp17/` is generated, not committed (`.gitignore`), by
 * `scripts/sync-cpp17-assets.mjs` — which `prebuild` and `predev` both run.
 *
 * So the binary-evidence block below is skipped on a clone that has never been
 * built. That skip is announced in the block's own name rather than being
 * silent, because a test that quietly evaporates is the exact failure mode this
 * whole file exists to prevent. Run `npm run cpp17:sync` and it comes back.
 */
const ASSETS = existsSync(path.join(ASSET_DIR, "memfs.wasm"));

/**
 * One pinned asset, as bytes `WebAssembly` will accept.
 *
 * A `Buffer` is a view onto a pooled `ArrayBufferLike`, which is not the
 * `ArrayBuffer` the WebAssembly signatures ask for. Copying into a fresh
 * `Uint8Array` is both the type fix and the correct one — a pooled buffer's
 * offsets are none of this test's business.
 */
const assetBytes = (file: string): Uint8Array<ArrayBuffer> => {
  const buf = readFileSync(path.join(ASSET_DIR, file));
  const copy = new Uint8Array(buf.byteLength);
  copy.set(buf);
  return copy;
};

/* -------------------------------------------------------------------------- */
/* Hand-assembled WASI programs                                                */
/* -------------------------------------------------------------------------- */

/*
 * Writing WebAssembly by hand needs a paragraph of justification, so here it
 * is: the alternative was to assert that a source line in the vendored file
 * still reads `this.environ = {USER : 'alice'}`, and a grep for a string
 * literal is not evidence about what a program receives. These modules are
 * ~150 bytes each, they import exactly the WASI functions under test, and they
 * are executed by the same `API` the worker uses. What comes back is what a
 * learner's program would get.
 */

function uleb(n: number): number[] {
  const out: number[] = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) byte |= 0x80;
    out.push(byte);
  } while (n !== 0);
  return out;
}

/** i32.const takes SIGNED LEB128. Using the unsigned encoder here reads 64 as -64. */
function sleb(n: number): number[] {
  const out: number[] = [];
  for (;;) {
    const byte = n & 0x7f;
    n >>= 7;
    const done = (n === 0 && (byte & 0x40) === 0) || (n === -1 && (byte & 0x40) !== 0);
    out.push(done ? byte : byte | 0x80);
    if (done) return out;
  }
}

const vec = (items: number[][]): number[] => [...uleb(items.length), ...items.flat()];
const section = (id: number, payload: number[]): number[] => [id, ...uleb(payload.length), ...payload];
const name = (s: string): number[] => {
  const bytes = [...Buffer.from(s, "utf8")];
  return [...uleb(bytes.length), ...bytes];
};
const fnType = (params: number[], results: number[]): number[] => [
  0x60,
  ...uleb(params.length),
  ...params,
  ...uleb(results.length),
  ...results,
];
const I32 = 0x7f;

interface WasmModuleSpec {
  types: number[][];
  /** `[module, field, typeIndex]`, all functions. */
  imports: [string, string, number][];
  /** Type index of the single defined function, exported as `_start`. */
  startType: number;
  body: number[];
}

function assemble(spec: WasmModuleSpec): Uint8Array<ArrayBuffer> {
  const startIndex = spec.imports.length;
  /* `new Uint8Array([...])` rather than `Uint8Array.from`: only the former is
     typed as backed by a plain `ArrayBuffer`, which is what `WebAssembly` asks
     for. Same bytes either way. */
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    ...section(1, vec(spec.types)),
    ...section(2, vec(spec.imports.map(([m, f, t]) => [...name(m), ...name(f), 0x00, ...uleb(t)]))),
    ...section(3, vec([[...uleb(spec.startType)]])),
    ...section(5, vec([[0x00, ...uleb(1)]])), // one page of linear memory
    ...section(7, vec([
      [...name("memory"), 0x02, ...uleb(0)],
      [...name("_start"), 0x00, ...uleb(startIndex)],
    ])),
    ...section(10, vec([[...uleb(spec.body.length), ...spec.body]])),
  ]);
}

/**
 * Ask WASI for the environment and print it to stdout.
 *
 * `environ_sizes_get(0, 8)` then `environ_get(64, 128)` then
 * `fd_write(1, iovec@16, 1, 24)` — the string leaves through the very
 * descriptor a learner's `std::cout` writes to, so what this returns is what
 * their program would print.
 */
const ENVIRON_TO_STDOUT = assemble({
  types: [
    fnType([I32, I32], [I32]),            // 0: environ_sizes_get, environ_get
    fnType([I32], []),                    // 1: proc_exit
    fnType([], []),                       // 2: _start
    fnType([I32, I32, I32, I32], [I32]),  // 3: fd_write
  ],
  imports: [
    ["wasi_unstable", "environ_sizes_get", 0],
    ["wasi_unstable", "environ_get", 0],
    ["wasi_unstable", "proc_exit", 1],
    ["wasi_unstable", "fd_write", 3],
  ],
  startType: 2,
  body: [
    ...uleb(0),
    0x41, ...sleb(0), 0x41, ...sleb(8), 0x10, ...uleb(0), 0x1a,      // environ_sizes_get(&count, &size)
    0x41, ...sleb(64), 0x41, ...sleb(128), 0x10, ...uleb(1), 0x1a,   // environ_get(&ptrs, &buf)
    0x41, ...sleb(16), 0x41, ...sleb(128), 0x36, 0x02, 0x00,         // iov.base = 128
    0x41, ...sleb(20), 0x41, ...sleb(8), 0x28, 0x02, 0x00, 0x36, 0x02, 0x00, // iov.len = size
    0x41, ...sleb(1), 0x41, ...sleb(16), 0x41, ...sleb(1), 0x41, ...sleb(24),
    0x10, ...uleb(3), 0x1a,                                          // fd_write(1, &iov, 1, &n)
    0x41, ...sleb(0), 0x10, ...uleb(2),                              // proc_exit(0)
    0x0b,
  ],
});

/**
 * The runtime's own escape hatch for a program that keeps running after `_start`
 * returns: exit with this code and `API.run` hands back the live `App` instead
 * of `null`. Upstream uses it for `requestAnimationFrame` demos. Used here to
 * get at the instance's linear memory, which is the only way to read the WHOLE
 * environment block.
 */
const RAF_PROC_EXIT_CODE = 0xc0c0a;

/**
 * Ask WASI for the environment and LEAVE IT IN MEMORY for the test to read.
 *
 * The stdout program above cannot do this job on its own: `readStr` in
 * `shared.js` stops at the first NUL, so anything printed through `fd_write`
 * shows only `environ[0]`. A second variable smuggled in behind the first would
 * be invisible to it. Reading the raw block is what makes "exactly one" a real
 * assertion instead of an assertion about the first one.
 *
 *   [0]  environ count   [8]  buffer size   [64] pointers   [128] the strings
 */
const ENVIRON_TO_MEMORY = assemble({
  types: [fnType([I32, I32], [I32]), fnType([I32], []), fnType([], [])],
  imports: [
    ["wasi_unstable", "environ_sizes_get", 0],
    ["wasi_unstable", "environ_get", 0],
    ["wasi_unstable", "proc_exit", 1],
  ],
  startType: 2,
  body: [
    ...uleb(0),
    0x41, ...sleb(0), 0x41, ...sleb(8), 0x10, ...uleb(0), 0x1a,
    0x41, ...sleb(64), 0x41, ...sleb(128), 0x10, ...uleb(1), 0x1a,
    0x41, ...sleb(RAF_PROC_EXIT_CODE), 0x10, ...uleb(2),
    0x0b,
  ],
});

/** A program whose only import is `wasi_unstable.<field>`, and which does nothing. */
function importOnly(field: string): Uint8Array<ArrayBuffer> {
  return assemble({
    types: [fnType([], [])],
    imports: [["wasi_unstable", field, 0]],
    startType: 0,
    body: [...uleb(0), 0x0b],
  });
}

/* -------------------------------------------------------------------------- */
/* Binary evidence: what the sandbox can actually reach                        */
/* -------------------------------------------------------------------------- */

interface RunningApp {
  mem: { u8: Uint8Array; check(): void };
}

interface VendorApi {
  ready: Promise<unknown>;
  memfs: { exports: Record<string, unknown> };
  /** The live `App` when the program exited with the rAF code, else null. */
  run(module: WebAssembly.Module, ...args: string[]): Promise<RunningApp | null>;
}

describe.skipIf(!ASSETS)(
  "the capability surface handed to a learner's program (needs public/cpp17 — `npm run cpp17:sync`)",
  () => {
    let api: VendorApi;
    let written: string[];

    beforeAll(async () => {
      /* The vendored runtime, wired to the real pinned assets. `readBuffer` and
         `compileStreaming` are the two injection points the worker also uses —
         see `init()` in worker.ts — and pointing them at the same files on disk
         is the closest a Node process gets to what the browser does. */
      const { API } = (await import("../../src/lib/cpp17/vendor/wasm-clang-shared.js")) as {
        API: new (o: Record<string, unknown>) => VendorApi;
      };
      written = [];
      api = new API({
        readBuffer: (f: string) => Promise.resolve(assetBytes(f).buffer),
        compileStreaming: (f: string) => WebAssembly.compile(assetBytes(f)),
        hostWrite: (s: string) => void written.push(s),
        clang: "clang.wasm",
        lld: "lld.wasm",
        memfs: "memfs.wasm",
        sysroot: "sysroot.tar",
      });
      await api.ready;
    });

    describe("no environment secrets are exposed to the sandboxed program", () => {
      /**
       * The whole environment block, exactly as a running program receives it.
       *
       * Not read off a source line and not inferred from what printed: the
       * program calls `environ_sizes_get` and `environ_get` for real, and this
       * decodes the bytes those two wrote into its linear memory.
       */
      const readEnviron = async (): Promise<{ count: number; entries: string[]; raw: string }> => {
        const app = await api.run(await WebAssembly.compile(ENVIRON_TO_MEMORY), "environ-probe.wasm");
        expect(app, "the probe did not survive to expose its memory").not.toBeNull();
        app?.mem.check();
        const u8 = app!.mem.u8;
        const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        const count = view.getUint32(0, true);
        const size = view.getUint32(8, true);
        const raw = new TextDecoder().decode(u8.subarray(128, 128 + size));
        return { count, entries: raw.split("\0").filter((e) => e !== ""), raw };
      };

      it("a running WASI program sees exactly one variable, and it is a fabricated constant", async () => {
        const { count, entries } = await readEnviron();

        /* `USER = alice` is a hardcoded string in the vendored wasm-clang demo.
           It is not read from the machine and it is not the learner's name —
           the audit names it explicitly so nobody later mistakes it for a leak. */
        expect(count).toBe(1);
        expect(entries).toEqual(["USER=alice"]);
      });

      it("nothing the host knows reaches it", async () => {
        const { raw } = await readEnviron();

        /* The audit asked `getenv` for exactly these and got `(null)`. Asked
           from the other direction here: the whole block is inspected and none
           of them is in it. */
        for (const secret of [
          "HOME", "PATH", "AWS_SECRET_ACCESS_KEY", "DATABASE_URL",
          "JUDGE0_RAPIDAPI_KEY", "DEEPSEEK_API_KEY", "LEARNING_ATTESTATION_SECRET",
        ]) {
          expect(raw).not.toContain(secret);
        }

        /* And the environment THIS process is actually running in, which is the
           most direct form of the question: could a host variable get through?
           Every name here is genuinely set right now, so the assertion has
           something real to fail against. */
        const hostNames = Object.keys(process.env).filter((n) => n !== "USER");
        expect(hostNames.length).toBeGreaterThan(0);
        for (const hostName of hostNames) expect(raw).not.toContain(`${hostName}=`);
      });

      it("and that is also what a learner's program prints, through the real stdout path", async () => {
        /* The same fact one layer up: `fd_write` on descriptor 1 → memfs's
           `host_write` → `hostWrite` → what the lesson panel renders. This one
           can only ever show `environ[0]`, because `readStr` stops at the first
           NUL — which is exactly why the two tests above read memory instead. */
        written.length = 0;
        await api.run(await WebAssembly.compile(ENVIRON_TO_STDOUT), "environ-stdout.wasm");
        expect(stripProgress(written.join("")).replace(/\0/g, "").trim()).toBe("USER=alice");
      });
    });

    describe("no network bridge is exposed", () => {
      /*
       * The audit's browser probe was `socket(AF_INET, SOCK_STREAM, 0)`, which
       * did not even COMPILE — `use of undeclared identifier`. That is a fact
       * about the sysroot's headers. This is the same fact one layer down: even
       * a program that somehow contained the call could not be instantiated,
       * because the import does not exist to bind to.
       */
      it.each(["sock_send", "sock_recv", "sock_accept", "sock_shutdown"])(
        "a program importing wasi_unstable.%s cannot be linked at all",
        async (fn) => {
          const probe = await WebAssembly.compile(importOnly(fn));
          await expect(api.run(probe, "sock-probe.wasm")).rejects.toThrow();
        },
      );

      it("proves the negative above is about the NAME, not about the probe being malformed", async () => {
        /* The identical module shape, importing something that IS in the
           surface, links and runs. Without this row, every rejection above
           could be a bug in the assembler rather than an absent capability. */
        const control = await WebAssembly.compile(importOnly("proc_exit"));
        await expect(api.run(control, "control.wasm")).resolves.not.toThrow();
      });

      it("the surface a program is offered contains no socket call under any spelling", () => {
        /* `shared.js` builds `wasi_unstable` from eight named methods and then
           `Object.assign`s the memfs exports over it. The second half is a live
           object, read here rather than described. */
        const surface = new Set([
          "proc_exit", "environ_sizes_get", "environ_get", "args_sizes_get",
          "args_get", "random_get", "clock_time_get", "poll_oneoff",
          ...Object.keys(api.memfs.exports),
        ]);
        for (const fn of surface) {
          expect(fn).not.toMatch(/sock|socket|connect|bind|listen|send|recv|http|fetch/i);
        }
      });
    });

    describe("no host filesystem capability is configured", () => {
      it("memfs.wasm imports nothing that could reach a host filesystem", async () => {
        const memfs = await WebAssembly.compile(assetBytes("memfs.wasm"));
        const imports = WebAssembly.Module.imports(memfs);

        /*
         * THE structural fact. Every `fd_*` and `path_*` a learner's program
         * can call is implemented inside this module, against its own linear
         * memory, and this module's entire view of the outside world is these
         * five functions — two memory copies, stdin, stdout, and a log. There
         * is no host path to traverse to because there is no host call to
         * traverse with.
         */
        expect(imports.map((i) => `${i.module}.${i.name}`).sort()).toEqual([
          "env.copy_in",
          "env.copy_out",
          "env.host_read",
          "env.host_write",
          "env.memfs_log",
        ]);
      });

      it("its filesystem exports are all satisfied inside the sandbox", async () => {
        const memfs = await WebAssembly.compile(assetBytes("memfs.wasm"));
        const exported = WebAssembly.Module.exports(memfs).map((e) => e.name);

        /* It really does export the filesystem ABI — this is not an empty
           surface that happens to import nothing. `path_open` is the one the
           worker intercepts to decide whether to recycle. */
        expect(exported).toContain("path_open");
        expect(exported).toContain("fd_read");
        expect(exported).toContain("fd_write");
        expect(exported).toContain("path_unlink_file");
        /* And it exports no way to escape itself. */
        for (const fn of exported) expect(fn).not.toMatch(/sock|proc_|exec|spawn/i);
      });
    });
  },
);

/* -------------------------------------------------------------------------- */
/* Source pins on the vendored artifact                                        */
/* -------------------------------------------------------------------------- */

describe("the vendored runtime is not wired to anything the host knows", () => {
  /*
   * Grep-shaped, and weaker than the executed pins above — which is why these
   * are the SECOND set and not the only set. They cover the one thing execution
   * cannot: that no *future* line quietly introduces a host source. A running
   * program can only demonstrate what today's code does.
   */
  const source = readFileSync(VENDOR, "utf8");

  it("reads no host environment, storage or credential source", () => {
    for (const pattern of [
      /process\s*\.\s*env/,
      /import\s*\.\s*meta\s*\.\s*env/,
      /document\s*\.\s*cookie/,
      /localStorage/,
      /sessionStorage/,
      /indexedDB/,
      /XMLHttpRequest/,
      /WebSocket/,
      /EventSource/,
      /navigator\s*\.\s*credentials/,
    ]) {
      expect(source).not.toMatch(pattern);
    }
  });

  it("performs no network access of its own — every byte comes from an injected reader", () => {
    /* The vendored file never calls `fetch`. `readBuffer` and
       `compileStreaming` are handed in by `worker.ts`, which is the only place
       a URL is decided, and it decides `baseUrl + filename` and nothing else. */
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).toMatch(/options\.readBuffer/);
    expect(source).toMatch(/options\.compileStreaming/);
  });

  it("hands a learner's program exactly the eight WASI functions the audit names", () => {
    /* The audit's claim — "the WASI surface handed to a learner's program is
       eight host functions ... plus whatever memfs.wasm exports" — pinned
       against the list that actually builds the import object. A ninth name
       appearing here is a widened sandbox and should fail a test. */
    const block = /getImportObject\(this,\s*\[([^\]]*)\]\)\s*;\s*\n\s*\n?\s*\/\/ Fill in some WASI implementations from memfs\./
      .exec(source);
    expect(block, "the wasi_unstable import list moved — re-read shared.js").not.toBeNull();
    const names = [...(block?.[1] ?? "").matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    expect(names).toEqual([
      "args_get", "args_sizes_get", "clock_time_get", "environ_get",
      "environ_sizes_get", "poll_oneoff", "proc_exit", "random_get",
    ]);
  });

  it("fabricates the one environment variable rather than sourcing it", () => {
    const assignments = [...source.matchAll(/this\.environ\s*=\s*([^;]*);/g)].map((m) => m[1].trim());
    expect(assignments).toEqual(["{USER : 'alice'}"]);
  });
});

describe("the worker fetches its 57 MB from our own origin and nowhere else", () => {
  const source = readFileSync(path.join(REPO, "src", "lib", "cpp17", "worker.ts"), "utf8");

  it("builds every asset URL from the base URL it was given", () => {
    /* Two call sites, both `baseUrl + f`. A CDN here would mean a third party
       serving the compiler that runs a child's code. */
    expect([...source.matchAll(/fetch\(([^)]*)\)/g)].map((m) => m[1].trim())).toEqual([
      "baseUrl + f",
      "baseUrl + f",
    ]);
  });

  it("defaults to a same-origin, relative path", () => {
    expect(DEFAULT_CPP17_BASE_URL).toBe("/cpp17/");
    expect(DEFAULT_CPP17_BASE_URL.startsWith("/")).toBe(true);
    expect(DEFAULT_CPP17_BASE_URL).not.toMatch(/^https?:|^\/\//);
  });

  it("compiles at the standard the curriculum teaches, on every compile in the worker's life", () => {
    expect(CPP_STANDARD).toBe("-std=c++17");
    /* Set on `clangCommonArgs` after construction, with any inherited `-std=`
       filtered out first, so no call site can forget it or override it. */
    expect(source).toMatch(/filter\(\(a\) => !a\.startsWith\("-std="\)\)/);
  });
});

/* -------------------------------------------------------------------------- */
/* The ceilings, as the runner actually transmits and reports them             */
/* -------------------------------------------------------------------------- */

/** A worker that records what it was told and answers only when asked to. */
class RecordingWorker implements RunnerWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  terminated = false;
  posted: Record<string, unknown>[] = [];
  /** Messages this worker tried to deliver after being terminated. */
  postTerminate = 0;

  postMessage(message: unknown): void {
    this.posted.push(message as Record<string, unknown>);
    const m = message as { kind: string };
    if (m.kind === "init") queueMicrotask(() => this.emit({ kind: "ready", initMs: 1 }));
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(data: unknown): void {
    if (this.terminated) this.postTerminate += 1;
    this.onmessage?.({ data } as MessageEvent);
  }

  lastRun(): Record<string, unknown> {
    const runs = this.posted.filter((p) => p.kind === "run");
    return runs[runs.length - 1];
  }
}

/**
 * Let the boot handshake finish.
 *
 * Starting a run is several microtask turns — spawn, wire `onmessage`, post
 * `init`, let the fake answer `ready`, resolve `booting`, then post the job.
 * Same helper and same reason as `runner.test.ts`: counting turns by hand is
 * how these tests first failed, with a timeout that looked like a product bug.
 */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

describe("the output ceiling", () => {
  it("is the same number the server truncates at, so one program is cut in one place", () => {
    /* `LOCAL_LIMITS` and `EXECUTION_LIMITS` deliberately keep separate copies —
       see the comment in execution-limits.ts — which makes "they agree" a thing
       to test rather than a thing to assume. A learner whose output is cut at
       64 KiB on Run and at some other number on Submit would see two different
       programs. */
    expect(LOCAL_LIMITS.maxOutputBytes).toBe(EXECUTION_LIMITS.maxOutputBytes);
    expect(LOCAL_LIMITS.maxSourceBytes).toBe(EXECUTION_LIMITS.maxSourceBytes);
    expect(LOCAL_LIMITS.maxStdinBytes).toBe(EXECUTION_LIMITS.maxStdinBytes);
  });

  it("is transmitted on every single run, never left to a default the worker guesses", async () => {
    const worker = new RecordingWorker();
    const runner = new Cpp17Runner({ createWorker: () => worker });
    const pending = runner.run({ source: "int main(){}", stdin: "" });
    await flush();

    expect(worker.lastRun().maxOutputBytes).toBe(LOCAL_LIMITS.maxOutputBytes);

    worker.emit({
      kind: "result",
      id: worker.lastRun().id,
      status: "ok",
      stdout: "",
      stderr: "",
      truncated: false,
      runtimeMs: 1,
      filesystemTouched: false,
    });
    await pending;
    runner.dispose();
  });

  it("reports truncation as a fact about the output, never as a verdict about the learner", async () => {
    const worker = new RecordingWorker();
    const runner = new Cpp17Runner({ createWorker: () => worker });
    const pending = runner.run({ source: "int main(){}", stdin: "" });
    await flush();
    worker.emit({
      kind: "result",
      id: worker.lastRun().id,
      status: "ok",
      stdout: "x".repeat(16),
      stderr: "",
      truncated: true,
      runtimeMs: 1,
      filesystemTouched: false,
    });
    const result = await pending;

    /* The audit's browser probe printed two million lines and got its output
       truncated at 64 KiB with «Слишком много вывода». Truncating is not
       failing: the status is still whatever the program did. */
    expect(result.truncated).toBe(true);
    expect(result.status).toBe("ok");
    expect(result.stdout).toBe("x".repeat(16));
    runner.dispose();
  });

  it("classifies a program stopped BY the ceiling as its own outcome", () => {
    /* The sink throws `OutputLimitExceeded` out through the WASI write, which
       unwinds the program. That is not a crash the learner wrote. */
    expect(classifyFailure("run", "OutputLimitExceeded: output limit exceeded")).toBe(
      "output_limit_exceeded",
    );
    expect(classifyFailure("run", "unreachable")).toBe("runtime_error");
    expect(classifyFailure("compile", "expected ';'")).toBe("syntax_error");
  });
});

describe("termination is the only stop, and the recovery after it", () => {
  /*
   * The deadline itself, and that a fresh worker follows it, are covered in
   * `runner.test.ts` ("the deadline"). Pinned here are the three properties
   * that are about the SANDBOX rather than about the clock, and that nothing
   * else asserts.
   */

  it("a dying worker cannot deliver anything: its handlers are detached before terminate()", async () => {
    /* A FRESH worker per spawn, unlike the tests above. The runner re-warms
       immediately after a deadline kill, and a factory that hands back the same
       object would have the replacement re-wire the corpse's handlers — the
       test would then be asserting about the new worker while claiming to
       assert about the dead one. */
    const workers: RecordingWorker[] = [];
    const runner = new Cpp17Runner({
      createWorker: () => {
        const w = new RecordingWorker();
        workers.push(w);
        return w;
      },
    });
    const worker = (): RecordingWorker => workers[0];
    const pending = runner.run({ source: "int main(){for(;;);}", stdin: "", timeLimitMs: 10 });
    await flush();
    worker().emit({ kind: "running", id: worker().lastRun().id, compileMs: 1 });

    const result = await pending;
    expect(result.status).toBe("time_limit_exceeded");
    expect(worker().terminated).toBe(true);

    /* The killed worker now tries to answer. There is nothing listening: `kill`
       nulls `onmessage` and `onerror` BEFORE calling terminate, so a message
       already in flight from a worker being destroyed cannot settle a job or
       overwrite a newer run's answer. */
    expect(worker().onmessage).toBeNull();
    expect(worker().onerror).toBeNull();
    worker().emit({
      kind: "result",
      id: worker().lastRun().id,
      status: "ok",
      stdout: "output from a worker that was already killed",
      stderr: "",
      truncated: false,
      runtimeMs: 1,
      filesystemTouched: false,
    });
    expect(result.stdout).toBe("");
    runner.dispose();
  });

  it("the replacement worker is initialised with the same sandbox configuration", async () => {
    /* A recycle must not quietly hand the next program a different runtime.
       Both `init` messages carry the same base URL, so the fresh memfs is built
       from the same pinned assets as the one it replaced. */
    const workers: RecordingWorker[] = [];
    const runner = new Cpp17Runner({
      baseUrl: "/cpp17/",
      createWorker: () => {
        const w = new RecordingWorker();
        workers.push(w);
        return w;
      },
    });

    const pending = runner.run({ source: "int main(){for(;;);}", stdin: "", timeLimitMs: 10 });
    await flush();
    workers[0].emit({ kind: "running", id: workers[0].lastRun().id, compileMs: 1 });
    await pending;
    await flush();

    expect(workers.length).toBe(2);
    const inits = workers.map((w) => w.posted.find((p) => p.kind === "init"));
    expect(inits[0]).toEqual({ kind: "init", baseUrl: "/cpp17/" });
    expect(inits[1]).toEqual(inits[0]);
    runner.dispose();
  });

  it("a timed-out run carries no partial output — recorded in the audit as deliberate", async () => {
    /*
     * `docs/cpp17/CPP17_SANDBOX_AUDIT.md` § "Deliberately not fixed": a program
     * killed by the deadline shows an empty output box, because the worker is
     * terminated and its buffer dies with it. Showing what it printed first
     * would teach a beginner more, and doing so means streaming output across
     * the message port — a real protocol change, not attempted.
     *
     * Pinned so that the day somebody DOES stream it, this test fails and the
     * audit gets updated with it, rather than the two silently disagreeing.
     */
    const worker = new RecordingWorker();
    const runner = new Cpp17Runner({ createWorker: () => worker });
    const pending = runner.run({ source: 'int main(){for(;;)std::cout<<"x";}', stdin: "", timeLimitMs: 10 });
    await flush();
    worker.emit({ kind: "running", id: worker.lastRun().id, compileMs: 1 });
    const result = await pending;

    expect(result.status).toBe("time_limit_exceeded");
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.truncated).toBe(false);
    /* And it IS the learner's outcome — their loop, not our outage. */
    expect(isLearnerOutcome(result.status)).toBe(true);
    expect(result.trust).toBe("client_local");
    runner.dispose();
  });
});
