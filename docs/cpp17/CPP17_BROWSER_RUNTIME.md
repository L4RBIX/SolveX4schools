# Browser C++17 runtime — measured feasibility

**Status: PROVEN VIABLE.** Every number here was measured in headless Chromium
against a served prototype, not estimated.

Prototype: `clang.wasm` + `lld.wasm` + `memfs.wasm` + WASI sysroot, driven from a
Web Worker. Reference base: [binji/wasm-clang](https://github.com/binji/wasm-clang),
Apache-2.0, with LLVM and vasm notices alongside.

## What works

```
__cplusplus = 201703
```

Compiled and executed in the browser, with piped stdin:

| Programme | Result |
|---|---|
| `iostream`, `cout` | ✅ |
| `cin >> n`, `cin >> a >> b` | ✅ piped stdin, no terminal needed |
| `vector`, `string` | ✅ |
| `algorithm` — `sort`, `stable_sort` | ✅ *(after a fix, below)* |
| `map`, `set` | ✅ ordered iteration correct |
| `queue<pair<int,int>>` | ✅ with C++17 structured bindings |
| `numeric` — `accumulate` | ✅ |
| `cmath` — `round` | ✅ |
| recursion (`fib(20)` → `6765`) | ✅ |
| `long long` (`3e9 * 2` → `6000000000`) | ✅ no truncation |
| Kazakh/Russian in comments and output | ✅ *(after a fix, below)* |
| compile error | ✅ real clang diagnostic with line:column |
| runtime error (`vector::at` out of range) | ✅ traps |

## Measured performance

| | |
|---|---|
| Assets transferred, cold | **57.5 MB** |
| `clang.wasm` | 29.8 MB |
| `lld.wasm` | 18.6 MB |
| `sysroot.tar` | 8.9 MB |
| `memfs.wasm` | 0.3 MB |
| Worker init (memfs + untar sysroot) | 78–127 ms |
| **First** compile + link + run | **2151 ms** |
| **Warm** compile + link + run | **~890 ms** (996, 892, 866, 846) |

For comparison the Pyodide runtime this replaces is 13 MB — C++ costs **4.4× the
download**. It caches, so it is a first-visit cost, but on a school connection it
is the single largest number in this document and the one to design around.

## Three defects found in the reference, and fixed

These were found by running programmes the curriculum actually needs, not by
reading the code. Each would have shipped as a mystery.

**1. `sort()` did not link.**

```
wasm-ld: error: libc++.a(algorithm.cpp.obj): undefined symbol: __lttf2
```

`__lttf2` is a compiler-rt builtin for 128-bit float comparison, referenced by
libc++'s `algorithm.cpp`. The reference's link line does not include
`libclang_rt.builtins-wasm32.a`, though the sysroot ships it at
`lib/clang/8.0.1/lib/wasi/`. Added `-L/lib/clang/8.0.1/lib/wasi` and
`-lclang_rt.builtins-wasm32`. December teaches `std::sort`; without this the
month does not run.

**2. Output was decoded as latin-1.** `readStr` built strings with
`String.fromCharCode(byte)`, one code point per *byte*, so a program printing
Kazakh returned mojibake. Now `TextDecoder('utf-8')`.

**3. Source was encoded as latin-1, with the wrong length.** `addFile` measured a
string with `.length` (JS code units, not UTF-8 bytes) and wrote it through the
same `charCodeAt` path. A file with a Kazakh comment reached clang truncated and
mis-encoded; clang said so — *"illegal character encoding in string literal"* —
and the learner saw a warning about their own alphabet. Now `TextEncoder`.

Two of the three are about Kazakh and Russian text. This course is taught in
those languages; they are not cosmetic bugs.

## Known constraints

- **Clang 8.0.1 (2019).** `-std=c++17` is complete for the *language*; the libc++
  of that era is not complete for every C++17 *library* feature. Anything the
  curriculum uses must be parity-tested against Judge0's GCC rather than assumed.
  See `CPP17_JUDGE_PARITY.md`.
- **`-std=c++17` must be passed explicitly.** `clang -cc1` defaults to C++14 here,
  and the reference sets no standard at all.
- **`bits/stdc++.h` is absent.** It is a libstdc++ (GCC) extension and libc++ does
  not ship it. Judge0's GCC will accept it. That asymmetry is a trap: a learner
  who writes it would compile on Submit and fail on Run. Requires a compatibility
  header in the sysroot — see `CPP17_JUDGE_PARITY.md`.
- **`wasi_unstable`, not `wasi_snapshot_preview1`.** These binaries predate the
  preview1 rename and the ABI differs (`fd_seek` among others). Node's built-in
  WASI cannot drive them; aliasing the import silently corrupts calls and the
  process exits 71 with no diagnostic. The bundled `memfs` is the WASI
  implementation, and it is not optional.
- **MIME matters.** `WebAssembly.compileStreaming` refuses anything that is not
  `application/wasm`. The assets ship extensionless in the reference; they must
  be served with a `.wasm` extension or an explicit content type.

## Not yet built

This document records feasibility, not the shipped runtime. Still to do:
cancellation, hard timeout for `while(true){}`, output ceiling, the lifecycle
state machine, worker recycling, asset pinning with checksums, and the
integration that replaces Pyodide in the lesson player.
