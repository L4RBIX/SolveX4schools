import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { runtimeFaultNote, stderrIsCompilerOutput } from "../../src/components/brilliant/lesson/blocks/run-state";

/**
 * What a learner's program actually does, run through the toolchain we ship.
 *
 * ## Why this file exists
 *
 * 391 tests covered the browser runtime and **none of them compiled a single
 * C++ program through the wasm toolchain**. `tests/support/cpp-run.ts` shells
 * out to the host compiler, which is a different compiler with different flags;
 * the one suite that touched real wasm read an import table and never ran a
 * program. So the four defects below were invisible to a green suite and
 * visible to any learner who typed the obvious thing:
 *
 *   - Kazakh or Russian on stdin came back as mojibake. «Сәлем әлем» →
 *     `!�;5< �;5<`. Stdin was consumed with `substr` and written
 *     through a helper that truncates UTF-16 code units to their low byte.
 *   - `srand(time(0))` — the first line of every tutorial on the internet —
 *     threw `wasi_unstable.clock_time_get not implemented.` So did
 *     `chrono::steady_clock::now()`.
 *   - and the crash wrote a JAVASCRIPT STACK TRACE into the learner's output
 *     pane, naming this repository's paths on the machine that served the page.
 *     Nova received the same text as "the program's output".
 *   - a runtime fault was the single English word `unreachable`, captioned as
 *     the compiler's own words. It is a wasm trap, it is not a diagnostic, and
 *     it is the same word for an out-of-range `at()`, a failed assertion and an
 *     uncaught exception.
 *
 * ## What this proves and what it does not
 *
 * The real vendored runtime, the real pinned `clang.wasm`, `lld.wasm`,
 * `memfs.wasm` and `sysroot.tar`, compiling and running real C++17. That is the
 * same toolchain the browser loads, driven through the same three phases
 * `worker.ts` drives it through.
 *
 * It is NOT a browser. `Worker.terminate`, the 3-second deadline and the output
 * cap live in `runner.ts` and are covered by `runner.test.ts` and by the
 * Playwright acceptance run; nothing here replaces them.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..");
const ASSET_DIR = path.join(REPO, "public", "cpp17");

const ASSETS = ["clang.wasm", "lld.wasm", "memfs.wasm", "sysroot.tar"].every((f) =>
  existsSync(path.join(ASSET_DIR, f)),
);

const assetBytes = (f: string) => new Uint8Array(readFileSync(path.join(ASSET_DIR, f)));

interface VendorApi {
  ready: Promise<unknown>;
  clangCommonArgs: string[];
  memfs: {
    setStdinStr(s: string): void;
    getFileContents(name: string): Uint8Array;
    addFile(name: string, contents: string): void;
  };
  compile(o: { input: string; contents: string; obj: string }): Promise<unknown>;
  link(obj: string, wasm: string): Promise<unknown>;
  run(module: WebAssembly.Module, ...args: string[]): Promise<unknown>;
}

interface RunOutcome {
  /** Everything `hostWrite` received on fd 1 during the RUN phase. */
  stdout: string;
  /** Everything it received on fd 2 — the program's `cerr`, and the runtime's. */
  stderr: string;
  /** The thrown error's message, or null when the program exited cleanly. */
  error: string | null;
  /** Whether the build failed rather than the program. */
  buildFailed: boolean;
}

describe.skipIf(!ASSETS)(
  "the shipped C++17 runtime, compiling and running real programs (needs public/cpp17 — `npm run cpp17:sync`)",
  () => {
    let api: VendorApi;
    let written: { text: string; fd: number }[];

    beforeAll(async () => {
      const { API } = (await import("../../src/lib/cpp17/vendor/wasm-clang-shared.js")) as {
        API: new (o: Record<string, unknown>) => VendorApi;
      };
      written = [];
      api = new API({
        readBuffer: (f: string) => Promise.resolve(assetBytes(f).buffer),
        compileStreaming: (f: string) => WebAssembly.compile(assetBytes(f)),
        hostWrite: (s: string, fd?: number) => void written.push({ text: s, fd: fd ?? 1 }),
        clang: "clang.wasm",
        lld: "lld.wasm",
        memfs: "memfs.wasm",
        sysroot: "sysroot.tar",
      });
      await api.ready;
      /* The same standard the worker sets. Without it the vendored default
         applies and the programs below would be compiled as something no
         learner is ever compiled as. */
      api.clangCommonArgs = [
        ...api.clangCommonArgs.filter((a) => !a.startsWith("-std=")),
        "-std=c++17",
      ];
    }, 180_000);

    /** Compile, link and run, exactly as `worker.ts` does. */
    async function runProgram(source: string, stdin = ""): Promise<RunOutcome> {
      api.memfs.setStdinStr(stdin);
      try {
        await api.compile({ input: "main.cc", contents: source, obj: "main.o" });
        await api.link("main.o", "main.wasm");
      } catch (err) {
        return {
          stdout: "",
          stderr: "",
          error: err instanceof Error ? err.message : String(err),
          buildFailed: true,
        };
      }
      const first = written.length;
      const since = (fd: number) =>
        written
          .slice(first)
          .filter((w) => w.fd === fd)
          .map((w) => w.text)
          .join("");
      try {
        const mod = await WebAssembly.compile(
          api.memfs.getFileContents("main.wasm").slice().buffer as ArrayBuffer,
        );
        await api.run(mod, "main.wasm");
        return { stdout: since(1), stderr: since(2), error: null, buildFailed: false };
      } catch (err) {
        return {
          stdout: since(1),
          stderr: since(2),
          error: err instanceof Error ? err.message : String(err),
          buildFailed: false,
        };
      }
    }

    it(
      "reads Kazakh and Russian from stdin without corrupting it",
      async () => {
        /* The measured failure: «Сәлем әлем» arrived as `!�;5< �;5<`.
           Every character above U+00FF lost its high byte, and the byte count
           was computed in UTF-16 units against a program asking for bytes. */
        const KK = "Сәлем әлем";
        const RU = "Привет, мир";
        const out = await runProgram(
          `#include <iostream>
#include <string>
int main() {
  std::string a, b;
  std::getline(std::cin, a);
  std::getline(std::cin, b);
  std::cout << a << "|" << b << "\\n";
}
`,
          `${KK}\n${RU}\n`,
        );

        expect(out.error, "the program must not crash").toBeNull();
        expect(out.stdout).toContain(`${KK}|${RU}`);
      },
      180_000,
    );

    it(
      "gives a program a clock instead of throwing at it",
      async () => {
        /* `srand(time(0))` and `chrono::now()` both threw
           `wasi_unstable.clock_time_get not implemented.` */
        const out = await runProgram(
          `#include <iostream>
#include <ctime>
#include <chrono>
#include <cstdlib>
int main() {
  std::time_t t = std::time(nullptr);
  std::srand(static_cast<unsigned>(t));
  auto a = std::chrono::steady_clock::now();
  auto b = std::chrono::steady_clock::now();
  std::cout << (t > 0 ? "epoch ok" : "epoch zero") << "\\n";
  std::cout << (b >= a ? "monotonic ok" : "monotonic went backwards") << "\\n";
  std::cout << (std::rand() >= 0 ? "rand ok" : "rand bad") << "\\n";
}
`,
        );

        expect(out.error, "time() and chrono must not crash a learner's program").toBeNull();
        expect(out.stdout).toContain("epoch ok");
        expect(out.stdout).toContain("monotonic ok");
        expect(out.stdout).toContain("rand ok");
      },
      180_000,
    );

    it(
      "never writes a JavaScript stack trace into the learner's output",
      async () => {
        /* The crash channel, on a program that genuinely faults. What reached
           the pane was about a kilobyte of frames naming this file's absolute
           path on the server — the wrong language, no help with the learner's
           own C++, and a filesystem layout nobody asked for. */
        const out = await runProgram(
          `#include <iostream>
#include <vector>
int main() { std::vector<int> v; std::cout << v.at(5); }
`,
        );

        expect(out.error, "the program must still fail").not.toBeNull();
        const pane = out.stdout + out.stderr;
        expect(pane, "a stack frame reached the learner").not.toMatch(/\n\s+at\s/);
        expect(pane, "an absolute path reached the learner").not.toContain(REPO);
        expect(pane).not.toContain("wasm-clang-shared.js");
        expect(pane).not.toContain("node_modules");
      },
      180_000,
    );

    it(
      "turns the trap the learner sees into a sentence they can act on",
      async () => {
        /* `unreachable` is the whole message, for every abort the toolchain
           produces. The raw text stays on screen; what changes is that it is no
           longer the ONLY thing on screen, and that it is no longer captioned
           as the compiler's own words. */
        const out = await runProgram(
          `#include <iostream>
#include <vector>
int main() { std::vector<int> v; std::cout << v.at(5); }
`,
        );
        expect(out.error).toContain("unreachable");

        const note = runtimeFaultNote("runtime_error", out.error ?? "");
        expect(note, "a bare `unreachable` must not be all a learner is given").not.toBeNull();
        expect(note!.ru).toContain("v.at(5)");

        expect(
          stderrIsCompilerOutput("runtime_error"),
          "a wasm trap is not the compiler talking",
        ).toBe(false);
        expect(stderrIsCompilerOutput("syntax_error")).toBe(true);
      },
      180_000,
    );

    it(
      "keeps the program's cerr out of its cout",
      async () => {
        /* The panel has had two panes since it was written and one stream to
           put in them: `host_write` dropped the file descriptor, so `cerr` and
           `cout` arrived as one buffer. Nova's `program_stderr` slot was
           permanently empty for the same reason. */
        const out = await runProgram(
          `#include <iostream>
int main() {
  std::cout << "out1\\n";
  std::cerr << "err1\\n";
  std::cout << "out2\\n";
}
`,
        );
        expect(out.error).toBeNull();
        expect(out.stdout).toContain("out1");
        expect(out.stdout).toContain("out2");
        expect(out.stdout, "cerr must not be in the stdout pane").not.toContain("err1");
        expect(out.stderr, "and it must be somewhere").toContain("err1");
      },
      180_000,
    );

    it(
      "refuses the memory the judge would refuse",
      async () => {
        /* There was no ceiling at all. Measured: a `std::vector<char>` of
           800 MB, with every 4096th byte written so nothing could be optimised
           away, allocated and ran to completion — and the same program is a
           memory-limit failure on Judge0, which sets `memory_limit: 262144` KB.
           A Run that disagrees with the judge in the PERMISSIVE direction is
           worse than one that refuses: it teaches the wrong thing about a
           learner's own program, and they find out at Check. */
        const touch = (mb: string) =>
          [
            "#include <iostream>",
            "#include <vector>",
            "int main(){",
            `  std::vector<char> v(${mb});`,
            "  long long s = 0;",
            "  for (size_t i = 0; i < v.size(); i += 4096) { v[i] = (char)(i & 0x7f); s += v[i]; }",
            '  std::cout << s << "\\n";',
            "}",
            "",
          ].join("\n");

        const tooBig = await runProgram(touch("800u*1024u*1024u"));
        expect(tooBig.error, "800 MB must not be allocatable when the judge caps at 256").not.toBeNull();

        /* And the ceiling has to leave room for real work. */
        const fine = await runProgram(touch("64u*1024u*1024u"));
        expect(fine.error, "64 MB is inside the judge's limit and must still run").toBeNull();
      },
      180_000,
    );

    it(
      "names a runaway recursion as one",
      async () => {
        /* At the old 1 MiB stack this surfaced as `memory access out of
           bounds`, which reads as a bad array index and sends a learner to the
           wrong line. The stack sits at the bottom of linear memory, so
           overrunning it looks exactly like an out-of-range write.

           Measured across four stack sizes: past 8 MiB the binding constraint
           is the host engine's own call-stack limit, which says so in words. */
        const out = await runProgram(
          [
            "#include <iostream>",
            "volatile long long sink = 0;",
            "long long f(long long n){",
            "  volatile long long pad[16];",
            "  for (int i = 0; i < 16; ++i) pad[i] = n + i;",
            "  if (n == 0) return pad[0];",
            "  long long r = f(n-1) + pad[1];",
            "  sink += r;",
            "  return r;",
            "}",
            'int main(){ std::cout << f(200000) << "\\n"; }',
            "",
          ].join("\n"),
        );

        expect(out.error, "a recursion this deep must still fail").not.toBeNull();
        expect(
          out.error,
          "it must not be reported as an out-of-range array access",
        ).toMatch(/call stack/i);

        const note = runtimeFaultNote("runtime_error", out.error ?? "");
        expect(note, "and the learner must be told what to look at").not.toBeNull();
        expect(note!.ru).toContain("рекурсия");
      },
      180_000,
    );

    it(
      "still reports a compile error as one, with the compiler's own words",
      async () => {
        /* The complement. The diagnostic pathway that WAS right must stay
           right: clang names a line and a cause, and that is worth reading. */
        const out = await runProgram(`int main() { std::cout << 1 }\n`);
        expect(out.buildFailed).toBe(true);
        expect(written.map((w) => w.text).join("")).toContain("main.cc:1");
        expect(runtimeFaultNote("syntax_error", "anything")).toBeNull();
      },
      180_000,
    );
  },
);
