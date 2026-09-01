# C++17 Machine Closure — Report

**Verdict: CPP17 MACHINE CUTOVER READY — HUMAN GATES REMAIN.**

Both remaining machine blockers are closed with measured evidence and mutation
proofs. Production is untouched and still serves Python; the C++ curriculum is
still unpublished, and every human gate is still open.

| | |
|---|---|
| **Starting SHA** | `a21a5d1` |
| **Final SHA** | `d5f0d96` |
| Branch | `cpp17-migration` |
| Machine gate | lint 0 · typecheck 0 · curriculum 0 · **157 files / 6788 tests** · build green · bundle 0 hits |

---

## 1. Verdict

Two blockers were named. Both are closed:

- **Curriculum-version isolation** is now structural rather than filtered, with
  five mutation proofs.
- **Real-browser acceptance** is complete — and was never actually blocked.
  Playwright was already a devDependency of this repo. The previous report's
  "blocked on Preview SSO / Chrome MCP" was wrong.

Running it found a **defect that broke every C++ Run in a real browser**. That
is the single most important outcome of this session and it is section 12.

## 2. Starting SHA — `a21a5d1`

## 3. Final SHA — `d5f0d96`

Three commits: `5696114` version isolation, `44a924b` fixture correction,
`d5f0d96` the browser Run fix plus acceptance.

## 4. Curriculum-version data model

**The version scopes the SUBJECT, not each evidence row.**

    curriculum_version = "cpp17-year1-v1"    language = "cpp17"
    curriculum_version = "python-year1-v1"   language = "python"

Distinct from `language` on purpose: a future C++ revision that re-authors half
the assessments is still `cpp17` but is not the same curriculum, and overloading
the language field would make that unsayable.

The alternative — a `curriculum_version` column on `lesson_completions`,
`learning_submissions`, `learning_events`, artifacts and the rest, plus a
predicate on every query — was rejected. That design is only as strong as the
next query somebody writes; it leaks the day one forgets a `WHERE` clause, and
nothing fails loudly when they do.

One subject per `(account, curriculum version)` makes the leak
**unrepresentable**: a C++ subject id has no Python rows anywhere, so every
existing `where subject_id = $1` is correct by construction and there is no
predicate to forget. The evidence tables are untouched, which is also why the
migration is small enough to review.

Schema (`0024_curriculum_version.sql`):
- `learning_subjects.curriculum_version` — NOT NULL, CHECK constrained,
  `user_id unique` → `(user_id, curriculum_version) unique`
- `learning_subject_aliases` — PK `(alias_kind, alias_value)` →
  `(alias_kind, alias_value, curriculum_version)`. **The linchpin**: with the
  two-column key, one `user_id` resolved to one subject and the version could
  never be expressed at sign-in.
- `school_subject_scope` — deliberately unchanged; it keys on `subject_id`,
  which is now version-specific, so it inherits the scoping for free.

**The cost, stated plainly.** One account now has two subject rows, so anything
that assumed account→subject was 1:1 has to say which. Three did, and two were
live defects the adversarial sweep found rather than things anticipated:

- **`classRoster`** left-joined the alias table with no version predicate →
  every dual-curriculum learner appeared **twice** in the teacher roster with a
  different subject id each time. A class of eighteen renders as nineteen names
  and every aggregate double-counts one child.
- **`subjectIdForAlias`**, the read-only lookup hydration uses on a lesson
  render, returned an arbitrary one of the two → a learner opening C++
  `m1.l1.b5` could get their **Python source** back in the editor.
- **`learning_forget_user`** opened with `select subject_id into subj`. A
  plpgsql scalar `INTO` takes one row and does not complain when the query
  returns more. Erasure would have deleted one curriculum and left the other
  behind, still joinable to the device that produced it.

Erasure is a promise to a child, so that fix ships in the **same** migration —
there must be no window in which the version split exists and erasure half works.

## 5. Migration

Idempotent across three consecutive passes; 23/23 on a database built from zero.
Guarded with catalog checks because Postgres has no `add constraint if not
exists`, and a migration that only works once cannot be replayed onto a restored
snapshot — which is exactly when someone needs it.

**The backfill is fail-closed and says so.** `python-year1-v1` is the bucket for
everything predating versioning. It is **not** a claim that every backfilled row
was written in Python: production contains rows created while acceptance-testing
C++ against the production database. Quarantining those is deliberate — they are
test data, they must not credit a real learner, and erring toward "does not
count" is the only safe default when provenance was never recorded.

Nothing infers the version from source syntax. No sniffing for `#include`.

The column default is the active curriculum, set **after** the backfill. Going
without one was the first attempt and was wrong: it made fourteen test files
hand-copy the same string rather than making anyone think. The hazard a default
carries is going stale, so a test pins it against `CURRICULUM_VERSION` — bump
the constant without writing the migration and the suite fails.

## 6. Python→C++ cross-credit adversarial proof

`tests/learning/curriculum-version-isolation.test.ts` — same user, same
`block_id` `m1.as.b1`:

| | |
|---|---|
| Python curriculum | accepted verdict at `source_trust='judge'` |
| C++ curriculum | no submissions |
| C++ block solved | **false** |
| C++ September demonstrated | **false** |
| C++ October unlocked | **false — stays LOCKED** |

Then a real accepted C++ verdict → demonstrated **true**, October unlocks.
Symmetric direction asserted too, and the Python evidence is asserted to
**survive** — isolation is not deletion.

**Mutation proofs**, each restoring the file byte-for-byte:

| # | Mutation | Result |
|---|---|---|
| 1 | resolver ignores the version | 4 tests fail |
| 2 | roster drops the version join | 2 fail |
| 3 | `classRoster` drops its predicate | 4 fail |
| 4 | hydration lookup unscoped | 2 fail |
| 5 | erasure back to single-subject `INTO` | 1 fail |
| 6 | frozen-exports fix reverted | browser Run fails; Node guard fails |

One test initially passed under mutation **for the wrong reason** — an unscoped
lookup has no `ORDER BY` and PGlite happened to return the C++ row. It now asks
for both versions and requires different answers, which cannot pass without the
predicate.

## 7. Hydration isolation

`tests/learning/hydration-version-isolation.test.ts`: a Python artifact for
`m1.l1.b5` cannot hydrate into C++ `m1.l1.b5`; C++ source restores into the C++
block; both artifacts sit side by side without either reaching the other; the
Python artifact stays reachable by asking for the historical subject.

## 8. Teacher analytics isolation

`tests/teacher/version-isolation.test.ts`: a dual-curriculum learner appears
**once**, with the C++ subject; no duplicate ids reach the aggregates; no
Python-era subject is attached to a current roster row; the historical roster is
still returnable when asked for explicitly.

## 9. Publication / version isolation

Measured against **production**, 2026-09-01: all nine Python-era rows are live
(`withdrawn_at is null`) and **0 of 9** hashes match a current C++ month.

    month 1  stored fc70b83383ea…  current c257be158b6a…  no
    …
    month 9  stored 9d1cba575584…  current 6741eb5b6feb…  no

The gate is **not** holding because anyone withdrew the Python approvals — they
are all still live. It holds because `approvalState` requires an exact hash
match and a hash of different content is a different hash.

**No `curriculum_version` column was added to publications**, deliberately: it
would be redundant with the hash and weaker than it. A version string is typed
by a human and can be typed wrongly; the hash is derived from the content being
approved and cannot disagree with it.

## 10. Current production-data measurement (re-verified)

| | |
|---|---|
| accounts | 19 |
| subjects | 3 |
| submissions | 12 |
| judge verdicts | 18 (12 accepted) |
| lesson completions | 1 |
| **accepted independence blocks** | **0** |
| artifacts (`code_blobs`) | 0 |
| publications | 9, none matching C++ |

Confirmed: the cross-credit defect never materialised. Every accepted verdict is
on `m1.l1.*`, `m1.l2.b1a` or `m1.l11.b2` — lesson blocks, no independence block.
The isolation was still built, because "currently zero" is a fact about today's
data and not an architecture.

## 11. Browser full-year sweep

All nine months, real Chromium, real server:

| Month | Statement | Editor C++ | Python leaked |
|---|---|---|---|
| September | 2541 chars | ✓ | none |
| October | 4931 | ✓ | none |
| November | 5775 | ✓ | none |
| December | 9194 | ✓ | none |
| January | 7481 | ✓ | none |
| February | 8519 | ✓ | none |
| March | 12013 | ✓ | none |
| April | 9749 | ✓ | none |
| May | 5489 | ✓ | none |

## 12. Run stress matrix — and the defect it found

**`watchForFileAccess` threw on every Run.** It wrapped `path_open` by assigning
to `api.memfs.exports.path_open`, and `shared.js` sets
`this.exports = instance.exports` — which the WebAssembly JS API **freezes**.
`worker.ts` is an ES module, so strict mode turned the assignment into:

    Cannot assign to read only property 'path_open' of object '[object Object]'

It fires **after compile and link succeed**, on the line that starts watching the
learner's own program. The symptom was therefore not "the compiler is broken"
but "the compiler works and nothing ever runs".

    unfixed worker  →  {"status":"failed","error":"Cannot assign to read only property 'path_open'"}
    fixed worker    →  {"status":"ok","stdout":"hello from wasm clang","ms":1961}

**Why no test caught it:** Node freezes the exports object identically, so this
was never browser-only — the suite simply never called the function.
`watchForFileAccess` is now exported and called against the real api. The first
version of that test asserted frozen-ness and stayed **green** under the
mutation: documentation, not a guard. It now fails.

With the fix, in a real browser:

| # | Scenario | Result |
|---|---|---|
| 1 | hello world | `hello` ✓ · 1829ms |
| 2 | cin/cout | `42` ✓ · 1825ms |
| 3 | vector + sort | `1 3 4 5` ✓ · 1909ms |
| 4 | `bits/stdc++.h` | `bits ok` ✓ · 2140ms |
| 5 | recursion | `6765` ✓ · 1832ms |
| 6 | BFS | `0 1 1 2 2` ✓ · 2406ms |
| 7 | compile error | `syntax_error` · 1145ms |
| 8 | runtime error | `runtime_error` · 1774ms |
| 9 | `while(true)` | `timeout` at 4835ms |
| 10 | 200k lines stdout | `output_limit_exceeded`, bounded at 64603 B |
| 11 | Run while Run active | supersedes; own output, no stale output |
| 12 | Run after forced termination | recovers, `ok` |

**Two of my own checks were wrong before they were right**, and both would have
reported success:

- The **responsive** checks passed on 404 pages — an error page has no
  horizontal overflow either. Sixteen green ticks measuring nothing. They now
  require HTTP 200.
- The **concurrency** check posted two runs to one worker, which the product
  cannot do: `Cpp17Runner.run` terminates the in-flight worker synchronously
  rather than queueing. It measured a fiction (the second source overwrote the
  first in memfs mid-compile, yielding `syntax_error`) and now models supersede.

## 13. Run/Submit live trust

Read from the database, not inferred.

**RUN** — five real in-browser C++ Runs:

| | |
|---|---|
| judge verdicts | **0** |
| lesson completions | **0** |
| submissions | **0** |
| XP | **0** |
| Judge0 requests from the browser | **0** |

**SUBMIT** — one live Judge0 submission:

    POST /api/learning/submit -> 200 in 2587ms
    {"verdict":"correct","cases":{"passed":1,"total":1},"saved":true,"attested":true}

Judge-trust verdict in the ledger; evidence scoped to `cpp17-year1-v1`; no
reference solution and no hidden case in the response.

## 14. Responsive

1440 / 1024 / 768 / 375 across September lesson, May contest, assessment, home,
program, teacher overview, teacher students — no page-level horizontal scroll
anywhere, every surface verified at HTTP 200 first.

## 15. Performance

| | |
|---|---|
| homepage cold | 108–148 ms |
| `clang.wasm` | 31 214 472 B · 717–747 ms |
| `lld.wasm` | 19 490 094 B · 464 ms |
| `sysroot.tar` | 9 297 920 B · 125–142 ms |
| `cpp17-worker.js` | 32 683 B · 3–4 ms |
| first Run (cold toolchain) | ~1980 ms |
| warm Run | 1825–2406 ms |
| Judge0 Submit | 2587 ms |

Toolchain total ≈ **60 MB**, served from our own origin (no CDN — that is part
of the security posture, since this is the compiler that runs learner code).

## 16. Teacher browser acceptance

`/teacher`, `/students`, `/skills`, `/lessons`, `/assessments`, `/leaderboard`
all HTTP 200 with **no Python terminology**, in both production and dev mode.

## 17. Full test counts

    lint            0 errors (48 pre-existing warnings)
    typecheck       0
    curriculum      0 errors
    vitest          157 files · 6788 passed · 23 skipped · 0 failed
    build           green
    check:bundle    85 client files · 0 hits

## 18. Build

`next build` green. Production build serves `/cpp17-worker.js` 200 and
`/pyodide-worker.js` **404** — C++ only, no Python runtime shipped.

## 19. Python backup status

**PRESERVED, as required.** `src/lib/pyodide/` (3 files), the Pyodide sync
scripts, `tests/python/`, and the historical Python curriculum in git all
remain. Production cannot reach them: `prebuild` strips the assets and
`src/app/dev/layout.tsx` returns `notFound()` in production. This is not a
dual-language learner UI — it is a backup that still exists.

## 20. Human gates — UNCHANGED

- **COPYRIGHT ASSET REPLACEMENT: PENDING**
- **Native Kazakh linguistic review: NOT PERFORMED**
- **Real student timing validation: NOT PERFORMED**
- **Curriculum-owner C++ sign-off: NOT PERFORMED**
- **C++ publication: NOT PERFORMED**

`--i-am-the-reviewer` was never passed and no publication row was created.
Decisive evidence the gate holds: on the production build an authenticated
learner hitting `/lesson/m1.l1` gets **404**.

## 21. Production state

Unchanged, verified at the end of this run:

    solvex4schools.vercel.app/pyodide-worker.js  ->  200
    solvex4schools.vercel.app/cpp17-worker.js    ->  404

No deploy, no domain move, no publication, no release tag. Production remains
Python.

## 22. Exact remaining blockers

**No machine blockers remain.** What is left is human:

1. Curriculum-owner reviews the C++ curriculum and authorises publication (B2).
2. A native Kazakh speaker reviews the Kazakh copy, which is DRAFT throughout —
   including this session's new strings.
3. Brilliant art/video replaced on production routes.
4. Real-student timing validation.

Two engineering notes that are **not** blockers but should be decided:

- The dev-mode gate bypass also enables `anonymousLearningAllowed()`. Lesson
  acceptance therefore ran under `next dev`; every check signed in properly and
  never used the anonymous path. `next build` **inlines** `NODE_ENV`, so a
  standalone build is permanently `production` — there is no way to open the
  gate on a production build without a publication row, which is the correct
  design and is why the two acceptance runs are reported separately.
- `LEARNING_CRON_SECRET` remains excused by name in CI. It has no consumer;
  self-corrects the moment it gets a value.

## 23. Exact future cutover procedure

Nothing below has been done.

1. **Human sign-off.** Curriculum owner reviews the C++ curriculum. Native
   Kazakh review of all copy. Replace Brilliant assets.
2. **Publish**, month by month, as the reviewing human:
   `npx tsx scripts/publish-month.ts --month N --i-am-the-reviewer`
   — only after step 1, and only by the person who actually reviewed it. Each
   row pins a content hash; any later edit lapses that approval by arithmetic.
3. **Verify the gate flipped**: on a production build, `/lesson/m1.l1` must go
   404 → 200 for an authenticated learner.
4. **Decide the cohort question.** Every existing subject is
   `python-year1-v1`. Learners continuing into C++ get a NEW subject on first
   sign-in after cutover, starting at September with no history. That is correct
   isolation and it is also a product decision — if any Python-era progress
   should carry across, it must be an explicit, audited migration, not the
   absence of one.
5. **Deploy to production** and move `solvex4schools.vercel.app`.
6. **Confirm** `/cpp17-worker.js` 200 and `/pyodide-worker.js` 404 in production.
7. **Tag** `v0.1.0-pilot`.
8. **Keep the Python backup** in the repository. Rollback is redeploying the
   previous production build; the Python runtime source and tooling stay.

---

**CPP17 MACHINE CUTOVER READY — HUMAN GATES REMAIN.**
