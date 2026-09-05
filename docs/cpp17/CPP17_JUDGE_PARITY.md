# Local ↔ Judge parity

Two different compilers run the learner's C++, and the learner must not be able
to tell. Measured, both sides, same source.

| | Browser Run | Judge0 Submit |
|---|---|---|
| Compiler | Clang **8.0.1** (2019) | GCC **14.1** |
| Standard library | libc++ | libstdc++ |
| `__cplusplus` | **201703** | **201703** |
| Target | wasm32-wasi | native x86-64 |
| Judge0 `language_id` | — | **105** |

Neither `-std=` flag is left to chance. The browser passes `-std=c++17`
explicitly because `clang -cc1` defaults to C++14 here. Judge0 needs no flag —
GCC 14 already defaults to `gnu++17` — which was confirmed by asking the judge
rather than by reading a changelog. The product sends no `compiler_options`, so
the judge's default standard is the one that grades every child — which is why
`MIN_GNU_CXX17_MAJOR` is a hard floor.

> **Correction (measured 2026-09-01).** This paragraph used to state that
> `compiler_options` is refused with HTTP 403 on this RapidAPI plan. It is not:
> the option is accepted (HTTP 200) and honoured — `-std=c++11` yields
> `__cplusplus = 201103` — and `/config_info` reports
> `enable_compiler_options: true` with an empty allow-list. Nothing in the
> product changes, because it sends no options and GCC 14 defaults to
> `gnu++17` (measured `201703`); but the floor now rests on "the default is our
> contract", not on "the flag is unavailable".

## Verified identical

Same source, same stdin, both engines:

| Programme | Both produced |
|---|---|
| `sort` on `5 / 3 1 4 1 5` | `1 1 3 4 5` |
| `long long`, `3000000000LL * 2` | `6000000000` |
| Kazakh + Russian string literals | `Дұрыс/Привет` |
| `#include <bits/stdc++.h>` | compiles |
| `__cplusplus` | `201703` |
| optimisation | **differs** — see below |

## The one that matters most: integer division

```
-7 / 2  →  -3        -7 % 2  →  -1
```

Identical on both engines, and **different from Python**, which floors: `-7 // 2`
is `-4` and `-7 % 2` is `1`. Every September task carried over from the Python
curriculum has to be re-checked against this, not translated. It is the single
most likely way a task's expected output silently becomes wrong.

## `bits/stdc++.h`

GCC ships it; libc++ does not. Without intervention the same file is **accepted
on Submit and refuses to compile on Run** — the learner would conclude the
browser is broken, and would be right.

Resolved by giving the browser sysroot the header, at
`include/bits/stdc++.h`, where the existing include path already looks. One
source now compiles in both places, with no rewriting, no regex over the
learner's program, and no Judge0-only code path.

The contents were **derived, not written**: all 78 candidate headers were
compiled individually in the browser and only the 76 that built were kept.

- `csetjmp` — libc++'s wrapper needs a C `setjmp.h` the sysroot omits.
- `csignal` — no `signal`; WASI has no signals.

Absent from libc++ 8 entirely, so never candidates: `<execution>`,
`<memory_resource>`, `<coroutine>`, `<format>`, `<ranges>`, `<concepts>`. GCC has
some of these. A learner reaching for one gets a compile error in the browser,
which is the honest place to discover it — better than a header that pretends
and then behaves differently.

**Cost worth teaching around:** `bits/stdc++.h` takes **~4 s** to compile in the
browser against **~0.9 s** for targeted includes, because it really does pull in
76 headers. September should teach `#include <iostream>` and add headers as they
are needed; the omnibus header is a contest convenience to meet later, not a
starting habit.

## Known divergences, and why they are acceptable

**Diagnostic wording differs.** Clang and GCC phrase errors differently. The
brief accepts this and so does the product: the learner reads whichever compiler
they invoked, and both name a line and a cause.

**Clang 8 is six years older than GCC 14.** C++17 the *language* is complete in
Clang 8, but libc++ of that era is not complete for every C++17 *library*
feature. Nothing in Year 1 goes near the gap — the curriculum's surface is
`iostream`, `vector`, `string`, `algorithm`, `map`, `set`, `queue`, `stack`,
`cmath`, `numeric` — but this is the reason parity is tested per feature as
months are migrated, rather than assumed once here.

**Timing is not comparable, and now it is measured rather than asserted.**

The three engines do not agree about optimisation, and until this was checked
nobody knew which way:

| Engine | Flag | How this is known |
|---|---|---|
| Browser Run | **`-O2`** | `wasm-clang-shared.js` passes it to `clang -cc1` |
| CI / authoring harness | **`-O2`** | `tests/support/cpp-run.ts` |
| **Judge0 (what grades a child)** | **`-O0`** | asked the compiler: `__OPTIMIZE__` is **not defined**, `gcc 14.1`, `__cplusplus=201703` |

Two consequences, and the second is the one that can hurt a learner.

**A "too slow" demonstration can vanish where it is not supposed to.** At `-O2`
clang closes `for (i…) t += i;` into Gauss's formula and the loop is gone — 10⁹
iterations print instantly. At `-O0` on Judge0 the same loop really runs: **10⁹
additions in 0.775 s**, measured. So a lesson that shows a program being too
slow can be contradicted by the browser while remaining true on the judge.
December's `m4.l1.b5` was re-authored to trial division for exactly this reason,
because no optimiser can close-form a divisor count.

**A tight but correct solution can pass the browser and fail the judge.** This
is the dangerous direction: `-O0` does no inlining, no vectorising and no
register promotion, so real work runs several times slower than the `-O2` a
learner just watched succeed in 3 s — and then meets a 5 s limit on hardware
that is not theirs. Nothing in Year 1 goes near a limit deliberately, and
December's bounds were built to survive a factor of ten either way, which is
what makes that safe rather than lucky.

**Measured, on real curriculum code: `-O0` costs between 2x and 14x.** May's
two quadratic solutions, run against their own blocks' largest legal input,
medians of nine runs each, Apple clang 17 / arm64:

| programme | `-O2` | `-O0` | ratio |
|---|---|---|---|
| `m9.l3.b6` naive — all subarrays, `vector<long long>` | 0.071 s | 0.158 s | **2.2x** |
| `m9.c3.p4` naive — pairing scan over a `vector<bool>` | 0.046 s | 0.661 s | **14.4x** |
| `m9.l3.b6` reference — two pointers | 0.012 s | 0.015 s | 1.3x |
| `m9.c3.p4` reference — sort + two pointers | 0.012 s | 0.012 s | 1.0x |

So "several times slower" above is now a range rather than a hand-wave, and the
spread inside the range is the thing to take away: the two naive programmes do
the same ~3·10⁷ operations and differ by a factor of six in what `-O0` costs
them. The `vector<bool>` is why — it is a bit-packed proxy whose `operator[]`
is a function call that inlines away at `-O2` and does not at `-O0`. A bound
checked at `-O2` on a container-heavy solution can be wrong about the judge by
an order of magnitude, in the dangerous direction.

The references barely move, which is the reassuring half: a solution that is
the right shape has nothing for the optimiser to rescue.

**This is also what ended May's complexity guards.** Both naive programmes above
sit inside the 5 s judge budget by a factor of 7.6 at worst, and both print the
correct answer, so `m9.l3.b6` and `m9.c3.p4` are graded on the answer with
complexity unmeasured. `tests/school/may-complexity-guards.test.ts` records that
in executable form.

**The authoring harness deliberately still uses `-O2`,** and that is a choice
with a cost worth naming: it is the *less* faithful of the two, and the reason
it stays is that every month of this migration was verified under it. Moving it
to `-O0` mid-migration would invalidate ten agents' evidence at once. It should
move — matching the engine that grades children is the same argument that put
GCC 14 in CI — and it belongs in a change whose whole job is that switch, with a
full suite run to see what it surfaces.

The budgets themselves are unchanged and still deliberate: 3 s in the browser,
5 s on the judge. A frozen-feeling tab is worse than a quick "did not finish",
a local run is not evidence, and only the judge's answer counts.

## The browser engine is now executed by CI

`tests/support/cpp-browser.ts` stands up a static `node:http` server over
`public/cpp17` and drives the **shipped worker** — `src/lib/cpp17/worker.ts`,
the same `init`/`run` protocol the lesson player speaks — so the browser
toolchain runs in the test runner. The blocker recorded in
`tests/execution/engines.ts` was about SERVING the assets
(`compileStreaming` refuses anything not `application/wasm`, and node's `fetch`
cannot open a `file:` URL), not about the toolchain; the `wasi_unstable` shim is
plain JavaScript in the vendored runtime and node runs it unchanged.

`tests/cpp17/curriculum-in-the-learners-compiler.test.ts` puts **all 263
reference solutions** through it — one real case each, compared with the block's
own checker — in **145 s**, and CI runs it on every push (see the toolchain
cache step in `.github/workflows/ci.yml`).

It immediately earned its place. `printf("%.2Lf", x)` on a `long double`
compiles and prints on GCC and on Apple clang, and **aborts at runtime in the
browser**: `Support for formatting long double values is currently disabled` —
that libc is built without it. A reference solution written that way would have
been green in CI and broken on every learner's first Run.

## Still to do

The JOIN: one fixture table, both engines, one comparison — BFS, DP-shaped
`vector<vector<int>>`, binary-search loops and `double` formatting run through
the browser AND the judge and compared to each other, rather than each compared
to the curriculum separately. `tests/exec/parity-september.test.ts` declares its
`local` column and does not measure it; that is the remaining gap, and it is now
a narrower one than the manual pass this section used to describe.
