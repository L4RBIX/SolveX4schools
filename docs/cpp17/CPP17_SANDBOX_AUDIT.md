# What a learner's C++ can and cannot reach

Adversarial pass against the browser runtime, run in Chrome against the real
lesson player as a signed-in learner. Every line below is an observed result,
not a reading of the source.

The threat model is a curious or hostile fourteen-year-old with a text editor
and the Run button. They control the source completely, and they can edit the
page's JavaScript too — which is why nothing here is a grading control. Run has
never been evidence; the judge is. What this audit asks is narrower and still
worth asking: **can their program reach anything outside its own tab?**

## Result: no

| Probe | Program | Observed |
|---|---|---|
| Host filesystem | `ifstream` on `/etc/passwd`, `/etc/hosts`, `../../../etc/passwd`, `/Users`, `/proc/self/environ` | all five **denied** |
| Process spawn | `system("ls /")` | **does not link** — `wasm-ld: undefined symbol: system` |
| Network | `socket(AF_INET, SOCK_STREAM, 0)` | **does not compile** — `use of undeclared identifier 'socket'` |
| Environment | `getenv` on `HOME`, `PATH`, `USER`, `AWS_SECRET_ACCESS_KEY`, `DATABASE_URL`, `JUDGE0_RAPIDAPI_KEY` | all `(null)` except `USER`, and that one is a fabricated constant — see below |
| Memory exhaustion | allocate 4 GB in 1 MB steps | killed by the 3 s deadline, tab unaffected |
| Infinite loop | `while (true) {}` | killed at 3 s, Run button returns by itself |
| Output flood | 2,000,000 lines | truncated at 64 KiB, «Слишком много вывода» |

The reason this is structural rather than lucky: the WASI surface handed to a
learner's program is eight host functions — `args_get`, `args_sizes_get`,
`clock_time_get`, `environ_get`, `environ_sizes_get`, `poll_oneoff`,
`proc_exit`, `random_get` — plus whatever `memfs.wasm` exports. There is no
socket call to deny, no `exec` to sandbox, and no host path to traverse to.
Denial is not a policy that could be misconfigured; the capability was never
imported.

`USER = alice` is a hardcoded string in the vendored `wasm-clang` demo. It is
not read from the machine and it is not the learner's name. Harmless, but named
here so nobody later mistakes it for a leak.

## The one real finding, and it is not an escape

**The in-memory filesystem persisted across Runs.** It is built once at init and
every subsequent Run shared it. Two consequences, both demonstrated:

- a program that wrote `planted.txt` found it again on the next Run
- a program that opened `include/bits/stdc++.h` for writing could put `#error`
  in it, after which **every compile for the rest of the page's life failed**,
  in lessons unrelated to the one where the learner experimented, with a
  diagnostic naming a header they never touched

This crosses no trust boundary. The memfs lives in one Worker, in one tab, for
one learner; it cannot reach the host, the page, the server, or another child.
Judge0 grades in a fresh container per submission, so it cannot affect a mark.

It is still a defect, for two reasons that have nothing to do with security.
It is a footgun whose symptom is incomprehensible and whose only cure is a
reload nobody would think to try. And it breaks the promise Run makes — that it
shows you what *your* program does — because the second run of one source could
behave differently from the first.

**Fixed** by recycling the worker after any Run in which the learner's program
opened a file. The trigger is deliberately blunt: Year 1 teaches no file I/O at
all, `ifstream` and `ofstream` appear nowhere in the curriculum, and
stdin/stdout/stderr are already-open descriptors that never call `path_open`.
So the flag is false for every real lesson and costs nothing, and the only
learners who pay for a rebuild are the ones who went looking. Over-recycling is
a warm restart; under-recycling is the bug.

## Deliberately not fixed

**A timed-out program shows no partial output.** `while (true) { cout << i; }`
reports the timeout and an empty output box, because the worker is terminated
and its buffer dies with it. Showing what it managed to print first would teach
a beginner more than silence does. Fixing it means streaming output from the
worker rather than collecting it at the end, which is a real change to the
protocol and is not attempted here. Recorded as a product improvement, not a
defect.

## What this audit does not cover

The Judge0 side. Submissions run in Judge0's own containers under their
isolation, which is theirs to make good and is not observable from here.
Nothing above should be read as a statement about it.

## Test-side coverage

`tests/cpp17/sandbox-contracts.test.ts` pins the contracts behind this audit so
that widening the sandbox becomes a failing test rather than something you only
find by opening Chrome again. **The probes above remain the stronger evidence** —
they are integration results against a real browser, a real Worker and a real
process boundary, and nothing in a Node test replaces them.

What the pins can honestly do, and do:

- run **hand-assembled WASI programs through the real vendored runtime**, so the
  environment a learner's program receives is read out of a running program's
  linear memory — `environ count = 1`, `USER=alice`, and nothing this machine
  knows;
- read the **import table of the pinned `memfs.wasm`**, which is five `env.*`
  functions and no host filesystem call at all — the structural reason the
  denial above is not a policy that could be misconfigured;
- link programs importing `sock_send`, `sock_recv`, `sock_accept` and
  `sock_shutdown` and watch them **fail to instantiate**, with a control row
  proving the failure is about the name and not about the probe;
- pin the output ceiling, the same-origin asset base, `-std=c++17`, and the
  termination-and-recovery behaviour the deadline depends on;
- pin the two things this document records as **deliberate**: that a timed-out
  run shows no partial output, and that `USER=alice` is a fabricated constant.

No browser capability is faked. There is no test asserting that `system()` or
`socket()` is "blocked", because in Node that would prove nothing and would be
a comforting lie in a green suite.
