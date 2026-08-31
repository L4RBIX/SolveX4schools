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
rather than by reading a changelog. `compiler_options` is refused with HTTP 403
on this RapidAPI plan, so being able to rely on the default is load-bearing, not
a convenience.

## Verified identical

Same source, same stdin, both engines:

| Programme | Both produced |
|---|---|
| `sort` on `5 / 3 1 4 1 5` | `1 1 3 4 5` |
| `long long`, `3000000000LL * 2` | `6000000000` |
| Kazakh + Russian string literals | `Дұрыс/Привет` |
| `#include <bits/stdc++.h>` | compiles |
| `__cplusplus` | `201703` |

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

**Timing is not comparable.** The browser budget is 3 s and the judge's is 5 s,
deliberately: a frozen-feeling tab is worse than a quick "did not finish", and a
local run is not evidence. A program near the limit can pass on one and not the
other, which is correct — only the judge's answer counts.

## Still to do

A per-feature parity suite running the same programme through both engines
automatically, covering BFS, DP-shaped `vector<vector<int>>`, binary-search
loops, and `double` formatting. The evidence above is a manual pass over the
core surface, not that suite.
