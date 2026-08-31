# Judge0 case batching — the economics, a design, and why not to ship it

**One press of Check costs five submissions because the block declares five test
cases. Collapsing those five into one submission is possible, is cheaper on one
of the two things we are billed for, and costs the per-case process boundary
that makes a judge a judge. This document does the arithmetic first, designs the
thing properly, then argues against building it.**

Design only. **Nothing here is implemented, and nothing in this document changes
behaviour.** `schools/exec/providers/judge0.ts` is untouched by it.

Companion to `JUDGE0_RAPIDAPI_SETUP.md` §5, which sizes the current path against
a plan. This one asks a narrower question: can a Check be made to cost less, and
should it.

---

## 0. What is measured here and what is not

**No RapidAPI key exists in this repository and nothing in it has ever contacted
`judge0-ce.p.rapidapi.com`.** Every case count, every block count and every
multiplication below is computed from the curriculum in this tree and is
therefore real. Every latency, every quota and every plan ceiling is **UNKNOWN**
and is written as UNKNOWN rather than estimated into a table where it would
later be quoted as a finding.

The one estimated quantity is `k`, the number of polls a submission takes, and it
is carried as a parameter with its arithmetic shown, exactly as in
`JUDGE0_RAPIDAPI_SETUP.md` §5.1.

---

## 1. What a Check costs today, counted

### 1.1 The unit is the case, not the hidden case

The natural assumption — the one everybody arrives with, because hidden cases are
what a judge is *for* — is "one hidden case, one Judge0 submission". It
undercounts by a third, and in the direction that matters.

`/api/learning/submit` passes `codeBlock.cases ?? []` to `runCases` — the whole
array. `runCases` builds one `ExecutionRequest` per element and never filters on
`hidden`. So **one press of Check is one submission per DECLARED case, visible
and hidden alike**, and it is that for a wrong answer as well as a right one:
`sequential` breaks only on `infrastructureError`, never on a failed case.

For September that is 150 submissions per learner per pass, not 99.

Two further facts about the same loop, both of which cost money and neither of
which is obvious from reading `runCases`:

- **Judge0 never takes the `sequential` path at all.** `runCases` uses
  `provider.runBatch` when the provider defines it, and `Judge0RapidApiProvider`
  always does. With `JUDGE0_BATCH` off — the default — `runBatch` is
  `Promise.all(requests.map(run))`. So the "stop asking at the first outage"
  property that `sequential` documents applies to the local provider and to
  Piston, and **not** to the metered one. A judge that dies on case 1 of 9 has
  already been asked for all nine.
- **A re-press on unchanged text costs nothing.** `claimSubmission` runs before
  the judge is reached and replays the first verdict verbatim. One submission id
  per (block, exact answer), minted client-side on the Check press. So a
  double-click, a browser retry and a sulky third press on the same wrong answer
  are free. Only a **changed answer** spends.

That second one is the single most important cost control in the system and it
is already shipped. It is also why the attempt multiplier in §1.5 is a count of
*distinct answers*, not of button presses.

### 1.2 Two currencies, and the plan meters only one of them

They are not the same number and the difference is the polling factor.

```
one Check on a block with C cases
  = C submissions                       ← Judge0's unit of work
  = C × (1 + k) HTTP requests           ← RapidAPI's unit of billing
```

`k` is polls per submission. `POST /submissions?wait=false` returns a token; the
poll sleeps **before** the first GET (an immediate poll spends a billable request
to be told "In Queue"), starts at `JUDGE0_POLL_INTERVAL_MS` = 250 ms, backs off
×1.5 and caps at 1 s:

| Judge answers within | polls `k` | requests per submission |
|---|---|---|
| 250 ms | 1 | 2 |
| 625 ms | 2 | 3 |
| 1.19 s | 3 | 4 |
| 2.03 s | 4 | 5 |
| 3.03 s | 5 | 6 |

Plus one `GET /languages` per server process, once, forever.

**Which of the two the plan actually charges for is UNKNOWN and it decides this
whole document.** The evidence in this repository points at the HTTP request:
`schools/ops/provider-quota.ts` reads `x-ratelimit-requests-limit` /
`-remaining` / `-reset`, and RapidAPI's published documentation calls that family
the subscription's **request** quota. If that is the meter, then everything below
about saving *submissions* saves nothing at all. If the underlying Judge0
deployment layers its own per-submission quota on top — plausible, unobserved —
then it is the other way round.

`GET /config_info` and one look at the RapidAPI dashboard settle it in about
ninety seconds. Nothing else in this document is worth acting on before that.

### 1.3 The curriculum, counted from the tree

Counted from `schools/curriculum/months/month-01-september.ts` by walking
`PROGRAM.months[0]`, not transcribed from an earlier document:

| | |
|---|---|
| Blocks carrying test cases | **31** — 25 `write_code`, 2 `modify_code`, 2 `challenge`, 2 `verify` |
| Total declared cases | **150** |
| Hidden / visible | **99 / 51** |
| Cases per block | min **3**, median **5**, mean **4.84**, max **9** (`m1.l5.b3`) |
| Hidden per block | min **1**, median **3**, mean **3.19**, max **7** |
| Lessons carrying cases | **12**, plus the monthly assessment |
| Cases per lesson | min **4**, median **9**, max **37** (`m1.l9`, the practice unit) |
| Monthly assessment | 2 blocks, **13** cases (7 + 6) |

Distribution, because a mean hides the tail that actually hurts:

```
3 cases │████                 4 blocks
4 cases │██████████          10 blocks
5 cases │█████████            9 blocks
6 cases │█████                5 blocks
7 cases │██                   2 blocks
9 cases │█                    1 block
```

**Eight of the nine months carry no cases at all.** Months 2–9 hold their unit
and lesson structure with zero blocks authored, every lesson `draft`. So there is
no such thing as a computed figure for the year, and anyone who produces one has
multiplied September by nine. September is the pilot; September is what can be
priced.

### 1.4 The multiplication

At `k = 3` — four requests per submission. One class of 18, every learner
pressing Check once per block, first answer accepted:

| Event | Submissions | HTTP requests |
|---|---|---|
| One learner, one Check, 3-case block (the floor) | 3 | 12 |
| One learner, one Check, median 5-case block | 5 | 20 |
| One learner, one Check, `m1.l5.b3` (9 cases) | 9 | 36 |
| **Class of 18, one press each, median block** | **90** | **360** |
| Class of 18, one press each, 9-case block | 162 | 648 |
| Class of 18, median lesson (9 cases) | 162 | 648 |
| Class of 18, `m1.l9` — the practice unit, 37 cases | 666 | 2 664 |
| Class of 18, the monthly assessment (13 cases) | 234 | 936 |
| **Class of 18, all of September, one attempt per block** | **2 700** | **10 800** |

At `k = 5` the right-hand column is **16 200**. At `k = 1` it is **5 400**. The
spread is a factor of three and it is entirely a function of a latency nobody
here has measured.

**The operator's division:** take the plan's monthly figure from the RapidAPI
dashboard, decide from §1.2 which column it applies to, and divide. If the plan
meters requests and grants fewer than roughly 11 000 a month, one class cannot
finish September once. Not with tuning, not with a longer timeout.

### 1.5 What multiplies the bottom row

- **Attempts.** The 2 700 assumes every learner is right first time, which is not
  what a coding course is. The multiplier counts *distinct answers*, because
  §1.1's idempotency makes re-presses free. `ATTEMPTS_BEFORE_REVEAL = 3` in
  `schools/learning/reveal.ts` is the programme's own statement that three failed
  attempts is normal before help is offered — it is a design assumption, **not a
  measurement**, and it is the only anchor this repository has. At 3 distinct
  answers per block: **8 100 submissions, 32 400 requests**.
- **Delayed re-solve.** `schools/policies/review.ts` schedules a second pass over
  every assisted solve, plus every independently solved `challenge` and
  assessment block — six blocks in September before assistance is counted. Those
  come back as fresh Checks with fresh answers, and they are not in the table.
- **A second class.** Doubles everything. The pilot is sized at one.
- **Nothing else, and this was checked.** `getExecutionProvider` has exactly
  three callers: `/api/learning/submit`, `/api/exec/run` — which refuses a
  metered provider outright, so it spends nothing — and `schools/ops/judge-probe.ts`,
  which is opt-in (`GET /api/health?probe=1`, admin credential) and spends one
  `print(1)` submission per call. No background job, no warm-up, no scheduled
  health check touches the judge.

### 1.6 The four UNKNOWNs, in the order they matter

1. What the plan meters — requests or submissions (§1.2).
2. The plan's monthly ceiling and its per-second rate limit.
3. `k`, which needs one real round trip to Kazakhstan and back.
4. Whether `POST /submissions/batch` exists on the plan, and its
   `max_submission_batch_size`.

All four come from one key and one afternoon. None of them can be inferred.

---

## 2. Two completely different things are called "batching"

They are routinely confused, they save different currencies, and one of them is
already written.

### 2.1 Judge0's batch endpoint — saves round trips, not work

`POST /submissions/batch` takes an array of submission bodies and returns an
array of tokens; `GET /submissions/batch?tokens=a,b,c` polls all of them at once.
Implemented in `runBatchEndpoint`, behind `JUDGE0_BATCH=true`, **off by default
and unverified**.

What changes:

| | before | after |
|---|---|---|
| Submissions created | C | **C** |
| POSTs | C | **1** |
| Poll GETs | C × k | **k'** |
| Concurrency-gate slots held | C | **1** |
| Sandboxes | C | **C**, one per case, unchanged |
| Per-case `cpu_time_limit` | 5 s each | **5 s each, unchanged** |
| Per-case `memory_limit` | 256 MB each | **256 MB each, unchanged** |

**Every case is still its own submission, its own isolate box, its own process,
its own limits.** Nothing about grading, isolation or evidence changes. What
changes is that we stop paying for C round trips to arrange it.

If the plan meters requests, this is a **4.84× cut** — the mean case count,
exactly, because C × (1 + k) collapses to 1 × (1 + k'). If the plan meters
submissions, it is a **0× cut**: still 150 submissions per learner per pass.

It also fixes the drain problem in `JUDGE0_RAPIDAPI_SETUP.md` §5.3 as a side
effect, because a whole Check now occupies one gate slot instead of C.

### 2.2 Harness batching — saves submissions, not round trips

One submission whose `source_code` is a **harness**: a program we generate
server-side that carries the learner's source and all C inputs, runs the source
once per input, and prints a framed report of the C results.

| | before | after |
|---|---|---|
| Submissions created | C | **1** |
| POSTs | C | **1** |
| Poll GETs | C × k | **k''** |
| Concurrency-gate slots held | C | **1** |
| Sandboxes | C | **1** |
| Per-case `cpu_time_limit` | 5 s each | **one budget, shared** |
| Per-case `memory_limit` | 256 MB each | **one budget, shared** |
| Per-case `time` / `memory` telemetry | Judge0's, per case | **self-reported, in-process** |

### 2.3 The table that decides it

One class of 18, all of September, one attempt per block, `k = k' = 3` and
`k'' = 4` (the harness polls a little longer because one submission now runs C
programs one after another):

| Path | Submissions | HTTP requests | New failure modes |
|---|---|---|---|
| Today, `JUDGE0_BATCH=false` | 2 700 | 10 800 | — |
| **`JUDGE0_BATCH=true`** (already written) | 2 700 | **≈ 2 232** | none to isolation; endpoint availability UNKNOWN |
| Harness | **558** | ≈ 2 790 | §3, and there are a lot of them |

**The harness saves nothing in HTTP requests over the batch endpoint.** Both
collapse a Check to one POST and one poll loop; that is the whole of the request
saving and the batch endpoint already has it. The harness's *only* additional
gain is the submission count — 2 700 → 558 — which is worth exactly zero if
§1.2's metering question comes back "requests".

The harness is also **slower**, not faster, than the batch endpoint whenever
Judge0 has a free worker: `submissions/batch` lets C programs run in parallel
across the judge's workers, and the harness runs them strictly serially inside
one box. It is faster than today's default path, which is a different and much
weaker claim.

---

## 3. The harness, designed properly, then attacked

Written out because "we could batch the cases into one submission" is easy to say
and the objections only appear once it is concrete. Everything in this section is
a sketch on paper. None of it is in the tree.

### 3.1 The shape

```python
# generated server-side, per Check; never rendered, never sent to a browser
import base64, json, os, signal, sys, tempfile, traceback

_SRC    = base64.b64decode("...").decode()          # the learner's program
_INPUTS = [base64.b64decode(b) for b in [...]]      # C stdins, in case order
_REAL   = os.dup(1)                                 # the only path to the report

# Compiled once, outside the loop: a SyntaxError is a property of the PROGRAM,
# not of a case, and the right report is the same compile_error for all C of
# them. This is the same compile/exec split `src/lib/pyodide/worker.ts` uses,
# and for the same reason — the distinction is structural, not a substring
# search for "SyntaxError" in stderr.
code = compile(_SRC, "main.py", "exec")

for i, stdin_bytes in enumerate(_INPUTS):
    out = tempfile.TemporaryFile()
    err = tempfile.TemporaryFile()
    inp = tempfile.TemporaryFile(); inp.write(stdin_bytes); inp.seek(0)

    os.dup2(inp.fileno(), 0)                        # fd-level, not sys.stdin
    os.dup2(out.fileno(), 1)
    os.dup2(err.fileno(), 2)
    _restore_builtins(); _reset_streams()

    signal.setitimer(signal.ITIMER_VIRTUAL, 5.0)    # soft per-case CPU cut
    status = "ok"
    try:
        exec(code, {"__name__": "__main__", "__file__": "main.py"})
    except _CaseTimeout:      status = "time_limit_exceeded"
    except SystemExit as e:   status = "ok" if not e.code else "runtime_error"
    except BaseException:     status = "runtime_error"; traceback.print_exc()
    finally:
        signal.setitimer(signal.ITIMER_VIRTUAL, 0)

    os.dup2(_REAL, 1)                               # report on the real stdout
    os.write(_REAL, (json.dumps({
        "i": i, "status": status,
        "out": base64.b64encode(_read(out)).decode(),
        "err": base64.b64encode(_read(err)).decode(),
    }) + "\n").encode())
```

Four design choices in there are load-bearing, and each of them is the answer to
an attack:

**Capture at the file descriptor, not at `sys.stdout`.** The obvious
implementation is `contextlib.redirect_stdout(io.StringIO())`. It captures
`print` and `sys.stdout.write` and captures nothing else: `os.write(1, b"7")`,
`print(x, file=sys.__stdout__)` and anything a C extension writes go straight
past it. Today those all work — fd 1 *is* the submission's stdout and Judge0
collects it. Under a `StringIO` harness the learner's output vanishes from the
case capture and lands in the middle of the report instead, which is both a wrong
verdict and a corrupted frame. `dup2` on fd 1 catches everything a process can
emit, because it is the same mechanism Judge0 itself uses.

**Base64 inside JSON, never a delimiter.** A framing of the form
`===CASE 3===` is forgeable by `print("===CASE 3===")`, which a learner will do
by accident inside the first week of a course that prints things. Base64 has no
byte in common with the JSON envelope, so the learner cannot emit structure at
all — only payload. This also preserves the bytes the checker needs: `exact`
strips trailing newlines and nothing else, so per-case stdout must survive the
round trip byte for byte, embedded newlines included.

**Stream each case's record as it completes, do not buffer to the end.** A report
assembled in memory and printed at the end is lost entirely to an `os._exit()` in
case 4. Streamed, cases 1–3 are on stdout and readable, and the server treats the
absent tail as unmeasured. This converts an all-or-nothing failure into a partial
one, which is the difference between "nothing about this learner was recorded"
and "the first three cases were".

**Hold the real stdout as a dup'd fd, opened before any learner code runs.**
During a case, fd 1 is a temp file; the learner cannot reach the report stream
through `/dev/stdout`, `/proc/self/fd/1` or a saved `os.dup(1)`, because all of
those resolve to the temp file. §3.5 explains why this is a speed bump and not a
boundary.

### 3.2 What it genuinely does not break

Three of the five obvious objections are answered cleanly, and it is worth saying
so before the two that are not.

**Hidden tests do not reach the browser.** The harness is generated server-side
inside `runBatch` and goes to Judge0. Nothing about `publicBlock()` changes;
`visibleCases` and `hiddenCaseCount` are still what the client receives. The
learner's browser never sees a harness, an input or a token.

**Checker semantics are untouched.** The harness returns C raw stdout strings.
`runCases` builds the same `CaseResult[]` and `checkOutput` compares exactly what
it compares now, under the block's own `checker`. Judge0 still never receives
`expected_output` — the harness carries inputs, and the answer key stays on our
server. `passed === total → correct`, `passed === 0 → wrong`, else `partial`,
unchanged.

**The learner's program is not modified.** `compile(_SRC, "main.py", "exec")`
with `__name__ == "__main__"` and `__file__ == "main.py"` reproduces what CPython
does to a script, which is what `src/lib/pyodide/worker.ts` already relies on for
its tracebacks to carry the learner's own line numbers. Same trick, same reason.

One real and new exposure, though: **every hidden input for the block now lives
in the address space of the program being assessed.** Today a submission sees one
stdin and nothing else. Under a harness, `_INPUTS` is readable from the learner's
code — `sys.modules["__main__"].__dict__`, `sys._getframe(1).f_globals`,
`gc.get_objects()`. It is a weak leak (the expected *outputs* are never sent, so
knowing the inputs does not produce the answers) and it cannot be exfiltrated
through the submit response, which returns only `{passed, total}`. It is still a
property we have today and would be giving up, and it should be given up
knowingly rather than discovered.

### 3.3 Per-case timeouts — the hard one

Judge0 gives **one** `cpu_time_limit` and **one** `wall_time_limit` per
submission. `EXECUTION_LIMITS.timeLimitMs` is 5 s per case, so the submission has
to ask for `C × 5` — **45 s for `m1.l5.b3`** — with `wall_time_limit` above it
by at least the `WALL_TIME_MARGIN_SECONDS` the provider already adds, so 47 s.

Three separate problems, in descending order of how much they hurt.

**(a) The ceiling may refuse it, silently.** Judge0 exposes `max_cpu_time_limit`
and a plan may clamp rather than reject — the exact failure `JUDGE0_RAPIDAPI_SETUP.md`
§4.3 L3 calls the most dangerous case in its list. A plan capping at, say, 15 s
turns a 9-case block's 45 s request into 15 s, and every learner on that block
silently gets 1.67 s per case instead of 5. A correct-but-unoptimised program is
then recorded as too slow, on a hidden case, with nothing anywhere saying why.
**The actual ceiling is UNKNOWN.** Today this cannot happen: 5 s is 5 s and it is
the same number for every case.

**(b) One slow case eats the others' budget.** A learner whose case 1 loops
forever burns all 45 s and cases 2–9 never run. Today: case 1 comes back
`time_limit_exceeded` (which is *evidence*, and December's entire month is about
it) and cases 2–9 run normally and may well pass. Under a naive harness that
learner gets one whole-submission TLE and eight unmeasured cases. The `partial`
verdict — the one that tells a teacher "the algorithm is right and slow" rather
than "the child cannot do this" — disappears exactly where it is most
informative.

The mitigation is the `setitimer(ITIMER_VIRTUAL, 5)` in §3.1, and it works better
than it has any right to: a pure-Python loop checks for pending signals between
bytecodes, so an honest slow program is cut at 5 s of CPU, recorded
`time_limit_exceeded` for that case, and the harness moves to case 2. **Per-case
TLE evidence survives for honest programs.** It does not survive:

- `except BaseException: pass` around the loop — swallows the timeout exception
  and keeps going. A Grade 9 learner writes this by accident with surprising
  frequency.
- `signal.signal(signal.SIGVTALRM, signal.SIG_IGN)` — disables it outright.
- A long call inside a single C function that does not return to the eval loop.
- Anything blocking on I/O rather than burning CPU, unless `ITIMER_REAL` is armed
  as well — which is a second signal with the same two defeats.

So the per-case CPU limit stops being **enforced** and becomes **advisory**. The
hard ceiling is the submission's own `cpu_time_limit`, which is shared, and past
it the whole batch dies at once.

**(c) Per-case memory isolation is lost, and there is no mitigation.**
`memory_limit` is one number for the process. A case that allocates 200 MB and
does not release it leaves cases 2..C running in a shrunken heap — and CPython
does not reliably return freed memory to the OS anyway, so even a well-behaved
case degrades the ones after it. Today each case gets a fresh 256 MB in a fresh
box. There is no in-process trick that recovers this. It is simply given up.

And the reporting degrades with it: `ExecutionResult.memoryKb` comes from
Judge0's own measurement of the box. Under a harness there is one number for C
programs, and any per-case figure would have to be `resource.getrusage()` read
inside the process being measured — i.e. a number the assessed program can
falsify. On the speed month, that is the signal, not a decoration.

### 3.4 State between cases, enumerated

`src/lib/pyodide/worker.ts` already solves the easy half of this, because a warm
worker runs many programs in one interpreter. Its comment is the honest
precedent, and also the warning: it resets the `exec` namespace per run and
records that **`sys.modules` is not reset**, accepting it explicitly because the
browser's trust value is `client_local` and "someone deliberately probing their
own browser is not a threat this file defends against". On the server that
sentence does not apply — the whole point of the submission is that it is the
thing we *do* defend.

| Leak | Survives a fresh namespace? | Fixable in-process? |
|---|---|---|
| Module-level globals from case *n* | no — fresh `exec` dict fixes it | **yes**, cheap |
| `builtins.print` / `int` / `input` monkeypatched | yes | **yes** — snapshot and restore `builtins.__dict__` |
| `sys.stdin` / `sys.stdout` reassigned | yes | **yes** — we re-point fds and rebuild the streams anyway |
| `sys.modules` — an `import` from case *n* | yes | **partly.** Deleting added entries is easy; undoing `math.sqrt = ...` on a module you keep is not |
| Files written to the box's filesystem | yes | **no.** Judge0 gives one box per submission, so C cases now share a filesystem that used to be fresh each time |
| Threads started in case *n* | yes | **no.** Python cannot kill a thread; it keeps running during case *n+1* and can write to fd 1 |
| `atexit` handlers | yes | **yes** — end with `os._exit()` after an explicit flush, which skips them |
| `signal` handlers, `sys.settrace`, recursion limit, `locale`, `random` seed | yes | mostly yes, one by one, forever |
| A C-level crash — `ctypes`, stack overflow, `os.abort()` | — | **no.** Takes the process, and with it every case after it |

The pattern is the point: the cheap ones are cheap, and the list has no end. Each
new one is discovered in production by a learner who did something ordinary.

### 3.5 A hostile program owns the harness, and this is not fixable

Everything in §3.1 is a **convention between two pieces of code in the same
interpreter**, and Python has no in-process privilege boundary. A program that
wants to forge results has, at minimum:

- `sys.modules["__main__"].__dict__` — the harness's own globals, including
  `_REAL`, `_INPUTS` and the loop counter. Readable and **writable**.
- `sys._getframe(n).f_globals` and `f_locals` — the same thing if the harness
  hides its state in a closure instead.
- `gc.get_objects()` — every live object in the process, closure cells included.
- `os.write(fd, ...)` on a small integer. `_REAL` is a low fd; a program that
  simply tries 3, 4, 5 finds it in microseconds and appends
  `{"i": 4, "status": "ok", "out": "<correct answer>"}` to the report.
- `sys.settrace`, `atexit.register`, `threading.Thread` — three more ways to run
  code at a moment the harness thinks is its own.

Hiding `_REAL` does not help; guessing fds does not need it. Validating the
report server-side does not help either — the harness's output *is* the report,
and a forged record is well-formed by construction.

**Today this class of attack does not exist, because the boundary is a process
and the kernel enforces it.** Judge0's isolate gives each submission its own box;
a learner's program can do whatever it likes inside and cannot reach anything
that decides its verdict. The harness replaces that with a promise.

Is a fourteen-year-old going to do this? Almost certainly not. But
`schools/execution/trust.ts` exists because this system takes seriously that
**the party producing an artefact is the party being assessed**, and `client_local`
is a whole trust value invented to say so. A harness re-creates `client_local`
semantics on the server and keeps calling the result `server_verified`. That is
precisely the confusion the subsystem was built to prevent, and it would be
invisible in the data.

### 3.6 Two smaller things that would also need doing

- **`sizeGuarded` would be measuring the wrong thing.** `checkPayloadSize`
  compares `EXECUTION_LIMITS.maxSourceBytes` (64 KiB) against the learner's
  source. Under a harness, `source_code` is harness + base64(source) + base64 of
  C inputs — a ~4/3 expansion on a wrapper. September's largest declared input is
  eight characters so nothing is close to the ceiling, but a 413 would then name a
  limit that has no relation to the file the learner wrote.
- **`ExecutionResult.timeMs` changes meaning.** It is currently the round trip
  for one case. For C cases inside one submission it is the round trip for all of
  them, and dividing by C would be an invention.

---

## 4. Verdict

### 4.1 Do not build this for the September pilot

Not "not yet, we're busy". The arithmetic says it, not the schedule:

1. **It saves nothing over a feature that is already written.** §2.3: the batch
   endpoint and the harness produce the same HTTP request count, because both
   collapse a Check to one POST and one poll loop. The harness's only extra gain
   is the submission count, and `x-ratelimit-requests-*` — the only metering
   evidence in this repository — says the meter is requests.
2. **It buys the smaller half of an unknown.** Until `GET /config_info` and the
   dashboard have been read, we do not know whether submissions are billed at
   all. Building the harder, riskier lever to save a currency that may not be
   charged is spending a fortnight on a coin flip.
3. **It gives up the per-case process boundary**, which is the thing that makes a
   rented judge worth renting: per-case CPU limit (§3.3a, §3.3b), per-case memory
   limit (§3.3c), per-case telemetry, a fresh filesystem, and a kernel-enforced
   separation between the program and the report on it (§3.5).
4. **It is slower than the batch endpoint** whenever the judge has a free worker,
   because C programs run serially in one box instead of in parallel across
   several.
5. **It is a lot of code in the part of the system with the least margin for
   error.** §3.4's table has no last row, and each row that is discovered late is
   discovered as a learner's correct program being marked wrong.

The honest summary: harness batching is the right answer to a question this
pilot has not been asked. If a metered judge on a submission-priced plan were the
only option, it would be worth the work. That is not the situation, and there is
a cheaper answer at every level.

### 4.2 What would have to be true before revisiting it

All five, not any of them:

1. `GET /config_info` and the dashboard show the plan meters **submissions**, so
   §2.3's 2 700 → 558 is a real saving rather than a cosmetic one.
2. `POST /submissions/batch` is absent from the plan, or
   `max_submission_batch_size` is smaller than 9 — otherwise the safe lever
   already covers the request half.
3. `max_cpu_time_limit` is **≥ 45 s**, confirmed by a submission that comes back
   with our limits intact rather than clamped, so the worst September block fits.
4. Somebody with authority over the programme has said, in writing, that per-case
   memory isolation and Judge0-measured per-case timing are expendable — because
   §3.3c has no mitigation and December's month is built on the second one.
5. Self-hosted Piston has been evaluated and rejected on grounds other than
   money. It is unmetered, it removes this entire question, and it satisfies the
   residency commitment in `docs/CODE_EXECUTION_DECISION.md` that routing through
   a marketplace breaks. If the September bill is the problem, Piston is the
   answer and the harness is an elaborate way to avoid it.

If those all hold, the design in §3 is the one to build — fd-level capture,
base64-in-JSON framing, streamed records, `ITIMER_VIRTUAL` soft cuts — with §3.5
written on the front page in full, so nobody later mistakes the result for
something the kernel guaranteed.

### 4.3 The cheaper levers, in the order to try them

1. **Read `GET /config_info` and the dashboard.** Free, five minutes, and it
   resolves the question this document could not.
2. **Turn on `JUDGE0_BATCH`, once a live check proves the endpoint exists.**
   ~4.84× on requests, one gate slot per Check instead of C, and **no change to
   isolation at all**. It is already written. This is the whole saving the
   harness offers, minus every risk in §3.
3. **Re-examine 150 cases for 31 blocks.** 51 of them are visible — the learner
   has already run those in the browser for free before pressing Check. Sending
   them to the judge again is 34 % of the spend and buys one real thing: the
   `partial` verdict's denominator covers the cases the learner was shown. That
   is a curriculum decision about what `passed / total` should mean, not a
   provider optimisation, and it belongs to whoever owns the content. **Priced
   here, not proposed.**
4. **Raise `JUDGE0_QUEUE_WAIT_MS` before `JUDGE0_MAX_CONCURRENT_REQUESTS`**, per
   `JUDGE0_RAPIDAPI_SETUP.md` §5.4. Costs a longer spinner, buys drain time.
5. **Self-host Piston.** `JUDGE_DEPLOYMENT.md`, `JUDGE_RUNBOOK.md`. Unmetered,
   in-country, and it makes §1 an academic exercise.

---

## 5. What is not proven here

- **Nothing in this document has been tested against Judge0.** There is no key.
  Every §1 figure derived from the curriculum is real and re-derivable from the
  tree; every figure involving latency, quota or a plan ceiling is UNKNOWN and is
  labelled as such.
- **`k = 3` is an estimate**, carried from `JUDGE0_RAPIDAPI_SETUP.md` §5.1 so the
  two documents cannot disagree. `k = 5` and `k = 1` are both plausible and the
  bottom line moves by 3×.
- **`k'' = 4` for the harness is a guess about a thing that does not exist.** It
  is used only in §2.3 and only to make the point that the harness is not cheaper
  in requests than the batch endpoint — a conclusion that holds for any `k''`
  within 1 of `k'`.
- **The attempt multiplier is not measured.** `ATTEMPTS_BEFORE_REVEAL = 3` is a
  programme design decision being borrowed as a cost assumption. The ledger
  already records what would settle it; nobody has run a class through it.
- **`POST /submissions/batch` has never been called from this repository**, so
  §2.1's table is what Judge0's documentation describes, not what the plan does.
  §2.3's middle row is therefore a projection.
- **The §3 harness has never been executed anywhere.** The attacks in §3.3–§3.5
  are reasoned from CPython's semantics, not demonstrated. They are, if anything,
  an under-count: `tests/exec/judge0-fake.ts` could model the framing offline and
  would find the boring bugs, and none of the interesting ones.
