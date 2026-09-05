import { createServer, type Server } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CPP17_ASSETS } from "../../src/lib/cpp17/assets";
import {
  installCpp17Worker,
  type Cpp17WorkerScope,
  type WorkerInbound,
  type WorkerOutbound,
} from "../../src/lib/cpp17/worker";
import type { LocalExecutionStatus } from "@schools/execution/trust";

/**
 * The learner's OWN compiler, driven from node.
 *
 * ## The gap this closes
 *
 * RUN compiles in the browser with `clang.wasm`; SUBMIT compiles on Judge0 with
 * GCC 14. Every automated gate in this repository certified the curriculum
 * against a THIRD compiler — whatever `g++` resolves to on the machine running
 * the tests — and `tests/execution/engines.ts` said so plainly: "the browser is
 * not executed at all", with a manual pass recorded in
 * `docs/cpp17/CPP17_JUDGE_PARITY.md` as the only evidence the engines agree.
 *
 * That is the worst shape a content gate can have. A reference solution that
 * compiles under GCC and not under the shipped clang is green in CI and broken
 * in a classroom — the learner presses Run, gets a compile error in a program
 * they were given, and nothing in between explains it. libstdc++ and libc++
 * differ in exactly the places a beginner's program lands: `<bits/stdc++.h>`,
 * the transitive includes that come free with `<iostream>` on one and not the
 * other, `std::to_string` overloads, `abs`.
 *
 * ## Why this is not the "impossible" the old note described
 *
 * That note listed two blockers: `WebAssembly.compileStreaming` refuses
 * anything not served as `application/wasm`, and node's `fetch` cannot open a
 * `file:` URL. Both are about SERVING, not about the toolchain — so this
 * serves. Eighteen lines of `node:http` over `public/cpp17`, with the same
 * content types Next sends, and the shipped worker fetches from it exactly as
 * a browser does.
 *
 * The third blocker in that note — `wasi_unstable` being an ABI node's WASI
 * cannot drive — was never load-bearing: the shim in
 * `src/lib/cpp17/vendor/wasm-clang-shared.js` implements that ABI itself, in
 * JavaScript, and node runs JavaScript.
 *
 * ## What is real here, and what is not
 *
 * Real: the shipped 57.5 MB toolchain, the shipped worker module, the shipped
 * WASI shim with this repository's four patches, the same `-std=c++17`, the
 * same `bits/stdc++.h` shim, the same 8 MiB stack and 256 MB ceiling, the same
 * `OutputSink` splitting stdout from stderr, and the same status mapping the
 * lesson player shows.
 *
 * Not real: it is node's WebAssembly engine, not a browser's. Compilation
 * semantics are the module's, so a program that compiles here compiles there;
 * what differs is the host's call-stack depth and its scheduling. Deep
 * recursion and wall-clock timing therefore stay a browser assertion, and they
 * live in the Playwright acceptance run.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ASSET_DIR = path.join(ROOT, "public", "cpp17");

/** Are the 57.5 MB present? They are gitignored and fetched by a script. */
export function browserToolchainPresent(): boolean {
  return CPP17_ASSETS.every((a) => existsSync(path.join(ASSET_DIR, a.name)));
}

/** What is missing, for a failure message that says what to run. */
export function browserToolchainMissing(): string[] {
  return CPP17_ASSETS.filter((a) => !existsSync(path.join(ASSET_DIR, a.name))).map((a) => a.name);
}

/**
 * Serve the toolchain the way production serves it.
 *
 * `application/wasm` is not decoration: `compileStreaming` refuses every other
 * content type, and getting that wrong is the first thing that would break if
 * this harness drifted from `next.config.ts`.
 */
function serveAssets(): Promise<{ baseUrl: string; server: Server }> {
  const server = createServer((req, res) => {
    const name = (req.url ?? "").split("?")[0]!.replace(/^\/cpp17\//, "");
    const file = path.join(ASSET_DIR, name);
    if (!CPP17_ASSETS.some((a) => a.name === name) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    const body = readFileSync(file);
    res.writeHead(200, {
      "content-type": name.endsWith(".wasm") ? "application/wasm" : "application/x-tar",
      "content-length": String(body.byteLength),
    });
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ baseUrl: `http://127.0.0.1:${port}/cpp17/`, server });
    });
  });
}

export interface BrowserRun {
  status: LocalExecutionStatus;
  stdout: string;
  stderr: string;
  truncated: boolean;
  runtimeMs: number;
}

/**
 * One booted worker, reused across cases.
 *
 * Boot is 57.5 MB read and compiled — about two seconds warm, and it is the
 * SAME cost the learner pays once per lesson open. Per case it would be
 * unusable, and it would also be a different test: the product boots once and
 * runs many, and the memfs persisting between runs is a property this harness
 * should share with it rather than paper over.
 */
export class BrowserToolchain {
  private scope: Cpp17WorkerScope | null = null;
  private server: Server | null = null;
  private waiting: ((m: WorkerOutbound) => void)[] = [];
  private nextId = 1;

  async start(): Promise<{ initMs: number }> {
    if (!browserToolchainPresent()) {
      throw new Error(
        `the shipped C++ toolchain is not present (${browserToolchainMissing().join(", ")}). ` +
          `Run: node scripts/sync-cpp17-assets.mjs`,
      );
    }
    const { baseUrl, server } = await serveAssets();
    this.server = server;

    const scope: Cpp17WorkerScope = {
      onmessage: null,
      postMessage: (m: WorkerOutbound) => {
        for (const w of this.waiting.splice(0)) w(m);
      },
    };
    /*
     * `self`, because the worker posts through the global rather than through
     * the scope it was installed on — `post()` is `self.postMessage`, which is
     * correct inside a real worker and is the one thing node does not provide.
     * Set rather than mocked: the module under test is the shipped one, and
     * changing it to suit a harness is how a harness stops proving anything.
     */
    (globalThis as unknown as { self?: unknown }).self = scope;
    installCpp17Worker(scope);
    this.scope = scope;

    const ready = await this.exchange({ kind: "init", baseUrl }, (m) => m.kind === "ready" || m.kind === "failed");
    if (ready.kind === "failed") throw new Error(`worker init failed: ${ready.error}`);
    return { initMs: ready.kind === "ready" ? ready.initMs : 0 };
  }

  /** Compile and run one program, exactly as a Run does. */
  async run(source: string, stdin: string, maxOutputBytes?: number): Promise<BrowserRun> {
    const id = this.nextId++;
    const result = await this.exchange(
      { kind: "run", id, source, stdin, maxOutputBytes },
      (m) => m.kind === "result" || m.kind === "failed",
    );
    if (result.kind !== "result") throw new Error(`run failed: ${JSON.stringify(result)}`);
    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      truncated: result.truncated,
      runtimeMs: result.runtimeMs,
    };
  }

  async stop(): Promise<void> {
    this.scope = null;
    delete (globalThis as unknown as { self?: unknown }).self;
    await new Promise<void>((resolve) => this.server?.close(() => resolve()) ?? resolve());
    this.server = null;
  }

  private exchange(
    message: WorkerInbound,
    accept: (m: WorkerOutbound) => boolean,
  ): Promise<WorkerOutbound> {
    const scope = this.scope;
    if (!scope?.onmessage) throw new Error("worker not installed");
    return new Promise<WorkerOutbound>((resolve) => {
      const listen = (m: WorkerOutbound) => {
        if (accept(m)) resolve(m);
        else this.waiting.push(listen);
      };
      this.waiting.push(listen);
      /* The shipped handler takes a `MessageEvent`; it reads `.data` and
         nothing else, so this is the whole of the event it needs. */
      scope.onmessage!({ data: message } as MessageEvent<WorkerInbound>);
    });
  }
}
