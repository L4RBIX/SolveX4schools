# Judge0 CE via RapidAPI — operator setup

For whoever has to make the rented judge work. The design decisions behind it are
`JUDGE0_RAPIDAPI_AUDIT.md` beside this file; the split between the browser half
and the server half is `HYBRID_EXECUTION.md`. This one is commands, arithmetic,
and the things that will bite.

## Read this before you subscribe

**Nothing in this document has ever been executed against RapidAPI.** There is
no key in this repository — `env | grep -i rapidapi` is empty — and no request
has ever been sent to `judge0-ce.p.rapidapi.com` from this codebase. The
provider is tested against a local fake HTTP server speaking Judge0's published
shapes (`tests/exec/judge0-adapter.test.ts`), which proves the adapter and
proves nothing about the service. Every number below that comes from the plan is
marked **UNKNOWN**, and where a number is arithmetic rather than a measurement,
it says so.

**This provider sends learner source code out of Kazakhstan.**
`docs/CODE_EXECUTION_DECISION.md` chose a self-hosted Piston on Kazakh hardware
partly because a child's code then does not cross a border, and this option is
scored in that same document as *"FAILS THE COMMITMENT — student source code,
stdin and stdout leave Kazakhstan and land on infrastructure in an undisclosed
jurisdiction, mediated by a second undisclosed jurisdiction."* Turning it on is a
programme decision with a written commitment on the other side of it. It is not
a deployment detail, and this file cannot make it for you.

**Run is not affected and must never become affected.** RUN is Pyodide in the
learner's browser. Twenty presses of Run cost zero RapidAPI requests. That is the
entire cost model — §5 stops being survivable the moment somebody routes Run
through a provider to "make the two engines agree".

---

## 1. Subscribe and get the key

1. Sign in at `rapidapi.com`, find the **Judge0 CE** listing, open **Pricing**,
   and subscribe to a plan.
2. On the **Endpoints** tab, copy the value RapidAPI shows for
   `X-RapidAPI-Key`. That single string is the credential; there is no separate
   secret, no OAuth, and no per-environment variant.
3. On the same **Pricing** page, write down four things. You will need all four
   in §5 and none of them is knowable from here:

   | Read off the dashboard | Why you need it |
   |---|---|
   | Requests included per month, and the overage price | §5's monthly demand is in the thousands |
   | The **rate limit** (requests per second, or per minute) | Sets the ceiling on `JUDGE0_MAX_CONCURRENT_REQUESTS` |
   | Whether a **poll** (`GET /submissions/{token}`) bills the same as a submission | Every submission is one POST plus three-to-five GETs |
   | Whether `POST /submissions/batch` is on the plan, and its `max_submission_batch_size` | The single biggest cost lever there is |

**The free tier's real limits are UNKNOWN to this repository and are not written
down anywhere in it.** Anyone who tells you a number for the free tier from
memory is guessing; the dashboard is the only source. Do not size a classroom
against a remembered figure.

Two things worth knowing while you are there, both from
`docs/CODE_EXECUTION_DECISION.md`:

- Judge0's **released CE image ships Python 3.8.1**, EOL. Whether the hosted
  RapidAPI deployment is newer is UNKNOWN. §6 is how you find out, and it is not
  optional.
- Judge0 CE ships with `enable_network` defaulting to **true** — the default
  behind CVE-2024-29021. This provider sends `enable_network: false` explicitly
  on every submission. Whether the hosted deployment honours it is untestable
  from here.

---

## 2. The environment

Server-side only. Set these where the Next.js server reads its environment — the
Vercel project's Environment Variables, the container's env file, whatever the
deployment uses. Not in `.env` in git, not in `next.config.ts`, not in a
component.

```
EXEC_PROVIDER=judge0_rapidapi
JUDGE0_RAPIDAPI_KEY=<ADD_ME>
```

That is the whole required set. Everything else has a working default:

```
# Only for a different host, or a proxy that speaks the same API.
JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
JUDGE0_RAPIDAPI_BASE_URL=https://judge0-ce.p.rapidapi.com

# Pin a runtime deliberately, skipping discovery. Read §6 first — an id with no
# name behind it means nothing in the system can say which interpreter produced
# a learner's evidence.
JUDGE0_LANGUAGE_ID=

# Capacity and timing. Read §5 before changing any of them.
JUDGE0_MAX_CONCURRENT_REQUESTS=2
JUDGE0_POLL_INTERVAL_MS=250
JUDGE0_QUEUE_WAIT_MS=30000
JUDGE0_OVERHEAD_BUDGET_MS=15000
JUDGE0_BATCH=false
```

### The key

**Never commit it.** `.env.example` carries the variable name and no value, and
that is the only place either belongs in git.

**Never prefix it `NEXT_PUBLIC_`.** A `NEXT_PUBLIC_` variable is inlined into the
client bundle at build time. Prefixing this one to "make something work" ships a
paid credential to every browser in the school, permanently, including the ones
belonging to fourteen-year-olds who will open DevTools. There is no way to
un-ship it except rotating the key.

**Never pass it to a component, a prop, a page, or a fetch from the browser.**
`schools/exec/providers/judge0.ts` is `import "server-only"`, so a build that
pulls it into a client bundle fails rather than succeeding quietly. The key
travels in an `x-rapidapi-key` header and never appears in a URL, a query
string, a log line or an error message — `opsLog` is forbidden environment
values by construction (`schools/ops/counters.ts`), and every learner-facing and
admin-facing string the provider can produce is a fixed sentence written by
hand, never a response body.

If you find yourself needing the key in a browser, you have taken a wrong turn.
See §8.

### What happens if you set one and not the other

In **production**, `EXEC_PROVIDER=judge0_rapidapi` with no key is a **boot
failure** — `executionProviderProblems()` in `schools/config.ts` refuses to let
the app start. That is deliberate and it is the same rule Piston gets for a
missing `PISTON_URL`: a judge with no credential boots perfectly clean and then
fails every single submission, settling every attempt as unmeasured. A month of
a class's evidence disappears and nothing looks broken.

Outside production the app starts, `judge0FromConfig()` throws on the first
submission, the submit route catches it, and the learner is told verification is
temporarily unavailable. Correct behaviour, and a bad way to find out.

---

## 3. Restart, then confirm

Restarting is not optional and not a formality. Two things are read once per
process and cached on `globalThis`:

- the **Python language id**, discovered from `GET /languages`;
- the **concurrency gate**, whose width is fixed by the first construction —
  changing `JUDGE0_MAX_CONCURRENT_REQUESTS` on a running process does nothing.

So: set the environment, restart the deployment, then ask it.

```
# Anyone, no credential. The teacher view.
curl -s https://<app-host>/api/health | jq '.capabilities[] | select(.id=="code_checking")'

# Admin view. Configuration only, no judge is called.
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
  'https://<app-host>/api/health' | jq '.execution, .hybrid.evidence'

# Admin view WITH a real submission. `print(1)` goes through Judge0.
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
  'https://<app-host>/api/health?probe=1' | jq '.execution'
```

`LEARNING_ADMIN_TOKEN` is the door for a caller with no session — a monitor, a
deploy smoke check, this runbook. Generate with `openssl rand -hex 32`. Leave it
unset and the admin view is reachable only by a signed-in admin, which is the
safe direction to fail.

What the free call tells you, no request spent. **Shape, not observations — no
value in either block below has been read from RapidAPI:**

```json
{
  "status": "ok",
  "detail": {
    "provider": "judge0_rapidapi",
    "configured": true,
    "endpoint": "judge0-ce.p.rapidapi.com",
    "trustedProvider": true,
    "leavesProviderBoundary": true,
    "metered": true,
    "keyPresent": true,
    "languageIdPinned": null,
    "maxConcurrentRequests": 2,
    "batchEnabled": false,
    "quotaRemaining": null,
    "quotaLimit": null,
    "quotaResetSeconds": null,
    "quotaObservedAt": null,
    "probed": false
  },
  "problems": []
}
```

`configured` is per-provider and for Judge0 it means **the key is present** — it
used to answer "is it a configured Piston" and said `true` for everything else,
including a keyless Judge0. `leavesProviderBoundary: true` is stated rather than
inferred: RapidAPI is not in Kazakhstan, and that is the fact the programme
decision turns on. None of this costs a request, so a monitor may poll it.

The `quota*` fields are whatever the **last real submission** happened to read
off a RapidAPI `x-ratelimit-*` response header. That is the number that says
"the class is about to stop working", and it is deliberately free rather than
hidden behind the probe — the one call that costs money should not be the only
one that can warn you about running out of money. A `quotaRemaining` of `0`
turns the check `degraded`, not `down`: nothing is broken, it un-breaks itself
when the window rolls over, and every Submit until then reports that nothing
could be checked.

**`null` throughout does not mean "no quota left."** It means nothing has ever
observed a quota header — see the gap below.

With `?probe=1`, `detail` gains the paid half. The id and version here are
placeholders standing in for whatever discovery finds — **nobody has run this**:

```json
{
  "reachable": true,
  "runtimeId": 0,
  "runtimeName": "Python (3.x.y)",
  "runtimeVersion": "3.x.y",
  "runtimeOperatorOverride": false,
  "probeStatus": "ok",
  "probeOk": true,
  "probeMs": 1400,
  "probeRequests": 5
}
```

That is the fastest way to answer §6's question — **`runtimeVersion` is which
Python a learner's evidence will actually come from** — and `probeOk: true` is
the only line in the whole report that proves the subscription works end to end.
`runtimeOperatorOverride: true` means `JUDGE0_LANGUAGE_ID` was pinned and nothing
discovered anything, so `runtimeVersion` will be `null`.

**The probe is off by default and must stay off.** Against a rented judge it is
not merely load, it is money: `GET /languages` on the first probe of a process,
a `POST /submissions`, and a poll per round until an answer arrives.
`probeRequests` says what pressing it spent. A monitor doing that twice a minute
would burn a free tier's allowance before the first lesson. It exists for the one
moment it is worth its cost — a human asking "is the judge actually up, and which
Python is it?" while a class waits.

### One known gap, and it is why the quota fields are null

`schools/ops/judge0-usage.ts` exports `recordJudge0Request()` — the single place
that counts a billable request, splits it into `judge0.submissions` /
`judge0.polls` / `judge0.language_lookups`, notices a 429, and reads the
`x-ratelimit-*` headers off the response. Its own doc comment says where it
belongs: *"at the ONE place in `schools/exec/providers/judge0.ts` where a request
actually leaves — `httpJson` — and nowhere else."*

**It is not called from there.** The receiver exists and the provider does not
feed it. Until that one call is wired, on a Judge0 deployment:

- every `judge0.*` counter stays at `0` no matter how much the plan is spent;
- `quotaRemaining` / `quotaLimit` / `quotaResetSeconds` / `quotaObservedAt` are
  permanently `null`, so the "about to stop working" warning never fires;
- `probeRequests` is `null`, and the probe pushes a problem sentence saying its
  cost figures are measuring nothing.

Nothing is *wrong* — no number is falsely reassuring, because `null` is not `0` —
but the entire cost-visibility half of §5 is dark. Until it is wired, the
RapidAPI dashboard is the only place your spend exists.

---

## 4. The live test

### 4.1 What CI does, and what it costs

**Nothing. Normal CI spends no quota.** `npm test` / `npx vitest run` drives the
provider against a local `node:http` server returning Judge0-shaped fixtures. It
never resolves `judge0-ce.p.rapidapi.com`, needs no key, and would fail closed if
it had one. That is not a limitation to be worked around — a test suite that
bills a marketplace on every push is a test suite people disable.

The gate is `JUDGE0_LIVE_TEST=1`. Without it, no live case runs, and a live case
that finds itself without a key must **skip loudly, never pass quietly**: a
suite that goes green because it did nothing is worse than one that goes red.

### 4.2 The gated command

```
JUDGE0_LIVE_TEST=1 JUDGE0_RAPIDAPI_KEY=<ADD_ME> npx vitest run tests/exec/judge0-live.test.ts
```

**At the time of writing, `tests/exec/judge0-live.test.ts` does not exist in this
tree.** It is a deliverable of the conformance work, not of this document, and
this file will not pretend otherwise. Check before you rely on it:

```
ls tests/exec/judge0-live.test.ts
```

If it is absent, §4.4 is the procedure, and it is runnable today with nothing but
`curl` and `jq`.

### 4.3 What the live matrix has to prove

Not "does it work" — the fake already answers that for the adapter. These are the
five claims the fake **cannot** make, in the order they will kill a pilot:

| # | Case | What it proves | Why the fake cannot |
|---|---|---|---|
| L1 | `GET /languages`, pick the highest `Python (3.x)` | Which interpreter a learner's evidence will actually come from, and its version | The fake serves the catalogue we wrote |
| L2 | Submit `import sys; print(sys.version)` | The runtime the id actually resolves to. L1 reads a label; this reads the interpreter | The fake runs no Python |
| L3 | Submit with `cpu_time_limit: 5`, `wall_time_limit: 7`, `memory_limit: 262144`, then compare against `GET /config_info` | That the plan **accepts** our limits rather than clamping them | **The most dangerous case in the list.** A tier that silently substitutes its own defaults shrinks a learner's five-second budget with no error anywhere, and a correct program is recorded as too slow |
| L4 | Submit `while True: pass`; expect status 5 | Learner TLE arrives as the learner's evidence, not as our timeout | The fake asserts our mapping, not the judge's behaviour |
| L5 | Submit N at once and watch for 429; note the body and any `Retry-After` | Where the rate limit actually falls, and whether backing off is better than failing fast | The limit is a property of a plan |

Two more that are cheap once the above pass:

- **L6** — `POST /submissions/batch` with two submissions, then
  `GET /submissions/batch?tokens=…`. Proves the endpoints exist on this plan and
  that results come back token-aligned. Until it passes, `JUDGE0_BATCH` stays
  `false`. §5 explains why you want it to pass.
- **L7** — submit a program that opens a socket, with `enable_network: false`.
  Proves nothing about sandbox isolation, which is untestable from here; proves
  only that the flag is not ignored outright.

Every live case must be written so a 401 or a 429 **fails the test rather than
being read as a result**. `provider_error` and `provider_rate_limited` both carry
`infrastructureError: true`, which above the port means "nothing may be recorded
about the learner" — and in a conformance run it means "you learned nothing,
do not write it down".

### 4.4 The manual matrix, runnable today

Keep the key out of your shell history. In `zsh`:

```
setopt localoptions histignorespace     # then prefix each command with a space
read -rs "JUDGE0_RAPIDAPI_KEY?key: "; export JUDGE0_RAPIDAPI_KEY
export H="judge0-ce.p.rapidapi.com"
```

**L1 — which Python:**

```
curl -s -H "x-rapidapi-key: $JUDGE0_RAPIDAPI_KEY" -H "x-rapidapi-host: $H" \
  "https://$H/languages" | jq '.[] | select(.name | test("^Python"))'
```

Discovery accepts only names matching `^Python\s*\((3(?:\.\d+)*)\)$` — anchored,
so `Python for ML (3.11.2)` is **rejected** on purpose: `python-policy.ts`
guarantees a stdlib-only environment by absence, and landing on a
numpy-preloaded runtime would silently downgrade that guarantee. Of the names
that match, the highest version wins, compared numerically (3.11 beats 3.9).
Note the id for the winner.

**L2 — which interpreter that id really is** (substitute the id from L1):

```
TOKEN=$(curl -s -X POST -H "x-rapidapi-key: $JUDGE0_RAPIDAPI_KEY" -H "x-rapidapi-host: $H" \
  -H "content-type: application/json" \
  "https://$H/submissions?base64_encoded=false&wait=false" \
  -d '{"language_id":<ID>,"source_code":"import sys\nprint(sys.version)","stdin":"","cpu_time_limit":5,"wall_time_limit":7,"memory_limit":262144,"enable_network":false,"redirect_stderr_to_stdout":false}' \
  | jq -r .token)
sleep 2
curl -s -H "x-rapidapi-key: $JUDGE0_RAPIDAPI_KEY" -H "x-rapidapi-host: $H" \
  "https://$H/submissions/$TOKEN?base64_encoded=false" | jq '{status,stdout,time,memory}'
```

**Note what is absent from that body: `expected_output`.** It is absent here for
the same reason it is absent from the provider, and it must stay absent in
anything you paste from a tutorial. SolveX's own checker is authoritative —
`token` by default, with `exact` and author-declared `numeric` tolerances as
curriculum decisions Judge0 knows nothing about. Sending an expected output
would let a vendor's whitespace rules overrule the curriculum's, and would ship
the answer key to RapidAPI.

**L3 — are our limits accepted or clamped:**

```
curl -s -H "x-rapidapi-key: $JUDGE0_RAPIDAPI_KEY" -H "x-rapidapi-host: $H" \
  "https://$H/config_info" | jq '{cpu_time_limit,max_cpu_time_limit,wall_time_limit,max_wall_time_limit,memory_limit,max_memory_limit,enable_network,max_submission_batch_size}'
```

We send `cpu_time_limit: 5` seconds, `wall_time_limit: 7` seconds and
`memory_limit: 262144` **kilobytes**, converted from
`EXECUTION_LIMITS.timeLimitMs = 5000` and `memoryLimitMb = 256`. If any
`max_*` here is below what we send, one of two things happens and they are not
equally visible: the submission is **refused** with a 400 (which the provider
maps to `provider_error`, loud and ours to fix), or the plan **clamps** it and
runs with its own default — undetectable from our side, and it quietly shrinks
every learner's budget. Compare the numbers by hand. Do not skip this one.

**L4 — learner TLE:** rerun L2 with `"source_code":"while True:\n    pass"`.
Expect `status.id === 5`. If it comes back 13 or hangs past the wall limit, the
judge is not distinguishing the learner's slowness from its own — the single
distinction the whole `ExecutionStatus` union exists to protect.

**L5 — the rate limit:** issue L2's POST twenty times in a tight loop and record
the first status other than 201. Note the response headers verbatim, including
any `Retry-After`. We currently map 429 to `provider_rate_limited` and fail fast
rather than backing off, because the shape of the 429 is UNKNOWN; this is the
observation that would change that.

Write what you find into `JUDGE0_RAPIDAPI_AUDIT.md` §"After the key arrived".
The value of these runs is almost entirely in the numbers being written down.

---

## 5. Capacity — the arithmetic, and where it stops working

This section is arithmetic, not measurement. Two inputs are UNKNOWN and both
have to come from you: the plan's limits (§1) and `t`, the real end-to-end time
one submission occupies a slot.

### 5.1 One press of Check is not one request

`runCases` runs **every** case in the block, visible and hidden, and it does so
for a wrong answer as well as a right one — only an infrastructure failure
short-circuits. So one press of Check by one learner is `C` submissions, where
`C` is the block's total case count.

September, counted from `schools/curriculum/months/month-01-september.ts`:

| | |
|---|---|
| Code blocks carrying cases | **31** |
| Total cases across them | **150** (99 hidden, 51 visible) |
| Mean cases per block | **4.84** |
| Range | 3 to **9** (`m1.l5`) |
| Heaviest lesson | `m1.l9`, the practice unit — **9 blocks, 37 cases** |
| Monthly assessment | 2 code blocks (`m1.as.b1`, `m1.as.b2`), **13 cases** — 7 and 6 |

Counted from the curriculum as it stands, not transcribed. Two older files say
the monthly check carries **nine** cases across its two problems —
`src/app/api/learning/submit/route.ts`'s comment and
`docs/deployment/PRODUCTION_ENVIRONMENT.md` §"Sizing the judge". Both predate an
edit to `month-01-september.ts`; thirteen is the current number. Recount rather
than quote, and if you are sizing against a different month, recount that one.

And one submission is not one request either. Judge0 is asynchronous by design
and this provider never uses `wait=true` — Judge0's own documentation says it may
be disabled and is not recommended at scale. So each submission is:

```
1 × POST /submissions
k × GET  /submissions/{token}
```

`k` depends on how fast the judge answers. The poll sleeps **before** the first
GET (an immediate poll spends a billable request to be told "In Queue"), starts
at 250 ms, backs off ×1.5, and caps at 1 s:

| Judge answers within | polls `k` | requests per case |
|---|---|---|
| 250 ms | 1 | 2 |
| 625 ms | 2 | 3 |
| 1.19 s | 3 | 4 |
| 2.03 s | 4 | 5 |
| 3.03 s | 5 | 6 |

`docs/CODE_EXECUTION_DECISION.md` estimates 300–800 ms end to end from
Kazakhstan to EU-hosted infrastructure through the marketplace hop, before
Judge0's own queue. That puts `k` at **3 to 5** as an estimate, which is what the
table below uses. **It is an estimate. Measure it.**

### 5.2 The multiplication

At `k = 3` (four requests per case):

| Event | Submissions | Requests |
|---|---|---|
| One learner, one Check, mean 5-case block | 5 | 20 |
| One learner, one Check, the 9-case block | 9 | 36 |
| **Class of 18, one Check each, 5-case block** | **90** | **360** |
| Class of 18, the monthly assessment (13 cases) | 234 | 936 |
| Class of 18, all of September once, nobody retries | 2 700 | 10 800 |
| Class of 18, all of September at 2.5 attempts per block | 6 750 | **27 000** |

The last row is the one to take to the dashboard. 2.5 attempts per block is a
guess and probably a low one — a learner who is failing presses Check more than
one who is passing, and the practice unit is where the programme's «~100 толық
дербес шешім» are supposed to come from. Two classes double it. Add one
`GET /languages` per server process and nothing else.

**Compare that number against your plan's monthly quota before the pilot
starts.** If it does not fit, that is a **PLAN CAPACITY BLOCKER** — not a tuning
problem, not something a longer timeout fixes. Quota exhausted mid-lesson looks
to eighteen children exactly like the platform being broken.

### 5.3 The concurrency gate, which is the tighter constraint

`JUDGE0_MAX_CONCURRENT_REQUESTS` defaults to **2** and is **process-global**: one
slot is one submission's whole POST-and-poll lifecycle, not one HTTP call, and
it is shared by every learner on the server. A burst of `S` submissions drains in

```
S × t / G      seconds
```

and a submission that cannot get a slot within `JUDGE0_QUEUE_WAIT_MS` (default
**30 s**) comes back `provider_timeout` — infrastructure, so that learner's whole
Check is unmeasured. Nobody is marked wrong; nothing is recorded either.

Take the middle row of §5.2: 18 learners, one 5-case block, `S = 90`. At `G = 2`
and an optimistic `t = 1.5 s`:

| | |
|---|---|
| Time to drain the burst | `90 × 1.5 / 2` = **67 s** |
| Submissions that fit inside the 30 s queue wait | `2 × 30 / 1.5` = **40** |
| Submissions that do not | **50** |
| Learners left unmeasured | roughly **10 of 18** |

**At the shipped defaults, a class of eighteen pressing Check at the same moment
does not fit.** That is arithmetic from two knobs in this repository and one
estimated `t`; it is not a measurement, and a real `t` moves it in either
direction. It is written here in full because "we sized it low to be safe"
sounds prudent right up until it is the reason ten children's work went
unrecorded.

The gate width needed to drain a burst inside the queue-wait window is

```
G ≥ S × t / W        e.g. 90 × 1.5 / 30 = 4.5, so 5
```

**Do not just set it to 5.** `G` is bounded above by the plan's rate limit, and
each in-flight submission generates up to four requests per second while
polling. `G = 5` is therefore up to ~20 requests/second at the marketplace. If
the plan's limit is below that you have traded silent unmeasured Checks for
silent 429s, which are also unmeasured Checks.

### 5.4 What to actually do, cheapest first

1. **Stagger.** Eighteen learners genuinely pressing Check in the same second is
   the worst case, not the normal one — a lesson has them arriving at a task over
   several minutes. Real, and not a guarantee. Do not build the sizing on it.
2. **Turn on batch, if the plan has it.** `JUDGE0_BATCH=true` collapses a whole
   Check into one POST and one shared poll loop: for a 5-case block at `k = 3`
   that is **20 requests down to 4**, a 5× cut in both quota and gate occupancy.
   It is OFF by default and **UNVERIFIED** — L6 in §4.3 is the check that earns
   it. This is the single largest lever available.
3. **Raise `JUDGE0_QUEUE_WAIT_MS`** before raising the gate. It costs a longer
   spinner and buys drain time; a learner waiting 60 s for a Check is having a
   bad time, but a learner whose Check was never measured has lost the evidence.
4. **Raise `JUDGE0_MAX_CONCURRENT_REQUESTS`** to the headroom the plan's rate
   limit actually allows, measured, not guessed. Restart afterwards — the width
   is fixed at first construction.
5. **Go back to self-hosted Piston.** `JUDGE_DEPLOYMENT.md` and
   `JUDGE_RUNBOOK.md`. Unlimited submissions, no marketplace, and it satisfies
   the residency commitment this option breaks. If §5.2's monthly number does
   not fit a plan you are willing to pay for, this is the answer rather than a
   fallback.

`JUDGE0_OVERHEAD_BUDGET_MS` is **not** a capacity knob and should not be touched
for load. It is how much longer than the learner's own 5 s limit we wait for an
answer, and it must stay generous: give up before the judge does and a genuinely
slow program is recorded as the judge not answering, which loses exactly the
evidence December's month is about.

---

## 6. The Python version skew

### What is known

| | |
|---|---|
| Browser, RUN — `pyodide@314.0.6` | **CPython 3.14.2** |
| `PYTHON_RUNTIME.version`, the server pin | **3.12.0** |
| Judge0 via RapidAPI, SUBMIT | **UNKNOWN** |

`tests/school/python-version-skew.test.ts` asserts the first two as
`{ local: "3.14", server: "3.12" }` — deliberately asserting the *known* skew
rather than demanding equality, so that changing either side, including fixing
it, forces somebody to come and decide. It reads Pyodide's version out of
`node_modules/pyodide/pyodide-lock.json` rather than from a constant, so it
cannot go stale behind an `npm update`.

The third row is the problem. `PYTHON_RUNTIME.version = "3.12.0"` describes the
Piston pin — an intention, not a running service. **It is not a claim about
Judge0, and turning Judge0 on does not make it one.** Nothing in the system
currently knows which Python a Judge0 deployment is running.

### How to find out

Fastest, from a running deployment — one command, and it is what the health
probe was built for:

```
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
  'https://<app-host>/api/health?probe=1' \
  | jq '.execution.detail | {runtimeId, runtimeName, runtimeVersion, runtimeOperatorOverride}'
```

`runtimeName` is what the catalogue calls it; `runtimeVersion` is that name
parsed. `runtimeOperatorOverride: true` means `JUDGE0_LANGUAGE_ID` was pinned,
discovery never ran, and `runtimeVersion` is `null` — an id with no name behind
it, which is exactly the cost of pinning.

**A catalogue label is not an interpreter.** `runtimeName` is a string Judge0
wrote next to an id; it can be stale or wrong, and nothing above the port checks
it against reality. When the answer matters — and for a version this is the one
time it does — run **L2 from §4.4** and read `sys.version` out of the
interpreter itself. If the two disagree, the interpreter wins and the disagreement
is itself the finding.

### What to do about what you find

- **3.12 or 3.13.** Best available. The existing skew widens or narrows by a
  minor version and September's semantics are unaffected. Update the skew test's
  expectation and the table in `HYBRID_EXECUTION.md` §7, deliberately.
- **3.14.** Judge0 and the browser agree, and the *server pin* becomes the
  outlier. Good problem to have; still write it down.
- **3.8 or 3.9 — treat as a finding, not a footnote.** Judge0 CE's released image
  ships Python 3.8.1. Language discovery has **no minimum-version floor**: it
  picks the highest `Python (3.x)` on offer and would take 3.8.1 without
  complaint if that is all there is. September's `input()`, `int()`, `//`, `%`,
  f-strings and loops all work on 3.8, so nothing would visibly break — which is
  precisely what makes it dangerous. Pin it with `JUDGE0_LANGUAGE_ID` only if you
  have a better id to pin, and escalate: an EOL interpreter is a security
  question as well as a curriculum one.

### What the skew actually costs, at any width

Language semantics are identical across 3.12 and 3.14 for everything September
teaches. **What differs is error message wording.** CPython rewrote diagnostics
substantially across 3.13 and 3.14 — "did you mean" suggestions, better pointers
into the offending line. A learner therefore reads a materially more helpful
traceback from their own browser than the judge produces for the same mistake,
and Nova sees whichever one the learner got. That is a real product consequence
of a rented judge and it does not go away by being ignored.

---

## 7. When it breaks

The one thing to know first, and it is the same as the Piston runbook's: **a dead
judge does not mark anybody wrong.** Every infrastructure status carries
`infrastructureError: true`, `runCases` stops at the first one, the submit route
leaves the verdict `unknown`, and `unknown` is never scored as a failure
anywhere. An outage is urgent, not an emergency. Tell the teacher, then fix it.

The learner sees `L.executionUnavailable`, and it is a promise the code keeps:

> «Кодты тексеру уақытша қолжетімсіз. Жауабың сақталды — саған қате қойылған
> жоқ, кейінірек қайта тексере аласың.»
> «Проверка кода временно недоступна. Ответ сохранён — ошибка тебе не
> поставлена, можно проверить позже.»

The teacher sees the `code_checking` capability go amber on `/api/health`:

> «Кодты тексеру уақытша қолжетімсіз. Оқушылар жазуын жалғастыра береді;
> ешкімге қате қойылмайды.»
> «Проверка кода временно недоступна. Ученики продолжают писать; никому не
> ставится ошибка.»

**Every failure below produces those same two sentences.** That is deliberate —
a learner has no use for the difference between a 401 and a 429, and a product
that explains its billing to a fourteen-year-old has lost the plot. Which one it
actually was lives in the ops log, on stderr, as one JSON line per event:

```
docker logs <container> 2>&1 | grep '"event":"exec.infra_failure"' | tail -20
```

```json
{"ts":"…","scope":"ops","event":"exec.infra_failure","provider":"judge0_rapidapi","status":"provider_rate_limited"}
```

The `status` field is the diagnosis. The `exec.infra_failures` counter in the
admin health view tells you *how many*; only this line tells you *which*, because
the counter deliberately does not fan out by status.

### 401 or 403 — the judge refused our credentials

| | |
|---|---|
| Status | `provider_error`, infrastructure |
| Learner | «Кодты тексеру уақытша қолжетімсіз…» |
| Admin | `?probe=1` → `probeStatus: "provider_error"`, `probeOk: false`; ops log `status: "provider_error"` |

The response body is **never read** and never logged — a 401 body from a
marketplace can echo the credential back. So the log line will not tell you which
of these it is; check them in order:

1. The subscription lapsed or the card failed. RapidAPI dashboard, first.
2. The key was rotated and the deployment still holds the old one.
3. `JUDGE0_RAPIDAPI_HOST` and the key disagree — the key is issued per listing,
   and pointing it at a different Judge0 listing gets a 403.
4. The variable never reached the process. `EXEC_PROVIDER=judge0_rapidapi` with
   no key is a production boot failure, so if the app is *running* in production
   the key was present at boot; a restart after an env change is still the thing
   to verify.

Fix the key, **restart**, re-probe. This one does not self-heal.

### 429 — over the plan's request limit

| | |
|---|---|
| Status | `provider_rate_limited`, infrastructure |
| Learner | «Кодты тексеру уақытша қолжетімсіз…» |
| Admin | ops log `status: "provider_rate_limited"`; `execution.detail.quotaRemaining` — **once the counting is wired, see §3** |

It has its own status precisely so this moment is distinguishable from "Judge0 is
down", because the two need opposite actions: wait or buy, versus page somebody.
The same distinction exists one layer down: `judge0.rate_limited` is its own
counter, separate from `judge0.failures`, and `opsLog` emits a
`judge0.rate_limited` line carrying only the request kind. Both are `0` and
silent until `recordJudge0Request` is called from the provider (§3), which is
today's state — so **for now the ops log's `exec.infra_failure` line with
`status: "provider_rate_limited"` is the only in-product evidence you will get,
and the RapidAPI dashboard is the only place your spend exists.**

We do **not** retry a 429. Whether the plan sends `Retry-After`, and what its 429
body looks like, are UNKNOWN (§4.3 L5) — and a client that retries blind into a
rate limit makes the rate limit worse.

In the moment: tell the teacher the class can keep writing and running code, and
that Checks will start working again. Nothing is being recorded wrong.

Afterwards, in order: read the dashboard and find out whether you hit the
per-second limit or the monthly quota — they are different failures with
different fixes. If it was per-second, **lower** `JUDGE0_MAX_CONCURRENT_REQUESTS`
and raise `JUDGE0_QUEUE_WAIT_MS`. If it was the monthly quota, §5.2 is the
conversation, and §5.4's ladder is the order to try things in. A teacher who
notices "it always breaks in fourth period" has found a per-second limit; one who
notices "it broke on the 24th and stayed broken" has found a quota.

### Judge0 Internal Error (status 13) or Exec Format Error (14)

| | |
|---|---|
| Status | `provider_error`, infrastructure |
| Learner | «Кодты тексеру уақытша қолжетімсіз…» |
| Admin | ops log `status: "provider_error"` |

The judge accepted the submission and then failed to run it. Judge0's own
`message` field is dropped rather than forwarded — it is vendor text of unknown
content on a learner's screen, and it is not ours to show.

This is the vendor's problem, not the deployment's, and there is nothing to
configure. If it is a handful, it is noise: retrying the Check works. If it is
every submission, check RapidAPI's listing status and Judge0's own status page,
tell the teacher the afternoon's code evidence is lost, and let the lesson
continue — predictions, tracing, bug-finding, multiple choice and the written
blocks all still grade. Only the monthly assessment cannot complete without a
judge, and that is by design: a completed check with no evidence would be a lie
in a school record.

### "Verification is unavailable" and nothing is in the log

The learner sees the outage string, `exec.infra_failures` is not moving, and
there is no `exec.infra_failure` line. Then it is not an outage. Three
possibilities, in the order they occur:

1. **There is no judge configured at all.** `EXEC_PROVIDER=none`, or a *typo* in
   the value. A typo falls through to the local subprocess provider, which
   refuses to run in production — so the app boots and every code task goes
   ungraded. The admin view catches it in two places now:
   `execution.detail.provider` echoes the string as given, and
   `execution.detail.configured` is `false` for any value this build does not
   recognise — a health view that called a typo "configured" would report a
   deployment as fine while it silently ran learner code in a subprocess nobody
   chose. Note that a
   `none` deployment produces a **different** learner string —
   `L.noTrustedJudge`, "your code really ran, the teacher will grade it" — and
   never promises «кейінірек қайта тексере аласың», because that promise would be
   false every day of the month.
2. **The payload was refused before the judge was called.**
   `exec.payload_rejected` is its own counter for exactly this reason — nothing
   is broken. `sizeGuarded()` refuses over 64 KiB of source or 16 KiB of stdin,
   measured in **bytes**, before anything reaches RapidAPI, which is also why a
   refused payload costs no request. Kazakh and Russian text is two bytes per
   character; a learner who pasted something enormous has not written a wrong
   program.
3. **The block is not machine-graded.** An explanation block settles `unknown`
   because nothing measured it, not because anything failed.

### The failure amplification nobody expects

A Check is graded only if **every** case reaches the judge. With a per-execution
failure rate `f` over `C` cases, the chance a learner is left unmeasured is
`1 - (1-f)^C`. At `f = 1%` and 5 cases that is ~5%; at the 9-case block, ~9%. The
failure mode is always missing evidence and never false evidence — but it is not
free, and it scales with the block, not with the learner.

---

## 8. The security boundary

**Every call to RapidAPI is server-side.** The chain is: browser POSTs the
learner's source to `/api/learning/submit` on our own origin → the route calls
`getExecutionProvider()` → `judge0.ts` (`server-only`) makes the HTTPS calls to
`judge0-ce.p.rapidapi.com` with the key in a header → the result goes to SolveX's
checker → a verdict → a trusted `LearningEvent` → Learning Intelligence.

Three consequences worth stating plainly:

**The browser must never contact `judge0-ce.p.rapidapi.com`.** Not for Run, which
is Pyodide; not for Submit, which goes through our route. If you ever see that
hostname in a browser's Network tab, something is very wrong — stop and find out
what, because the only way a browser reaches it is with a credential.

**RapidAPI therefore never needs to appear in a `connect-src`.** The CSP that
`HYBRID_EXECUTION.md` §7 proposes — and which this app does not yet set — is

```
connect-src 'self';
```

and adding this provider does not change that by one character. A future change
that needs to add a marketplace hostname to `connect-src` has moved execution
into the browser and should be refused on that basis alone.

**The provider never writes learner state.** It returns an `ExecutionResult` and
nothing else. Trust is stamped server-side by `schools/execution/trust.ts` and is
never read from a request body; a provider that could write a `verdict_received`
event would be the bug. `runBatch` returning a different number of results than it
was asked for is read as an outage rather than realigned, because guessing an
alignment would attribute one case's output to another case's expected value.

What Judge0 **is** given: the learner's source, the case's stdin, and three
limits. What it is never given: `expected_output`, the block id, the learner's
identity, the episode, or anything from the ledger. It is a trusted execution
engine and nothing more, and the answer key stays on our side of the boundary.

---

## 9. What is not proven

Restated here so it is not buried:

- **No live call has ever been made from this repository.** The adapter is
  proven against a fake HTTP server; the service is not proven at all.
- **Which Python.** UNKNOWN until §6 is run. `PYTHON_RUNTIME.version = "3.12.0"`
  describes Piston and says nothing about Judge0.
- **Whether the plan accepts our limits or clamps them.** §4.4 L3. The clamping
  case is silent and would shrink every learner's time budget.
- **Whether the batch endpoints exist on the plan**, and their maximum size.
  `JUDGE0_BATCH=false` is the default for this reason.
- **Where the rate limit falls**, what a 429 body looks like, and whether
  `Retry-After` is sent.
- **Whether polls bill the same as submissions.** The entire poll cadence —
  sleep-first, backoff, batch — assumes they do.
- **Whether `enable_network: false` is honoured**, and whether the sandbox is
  what Judge0 claims. Nothing here can test isolation.
- **Real latency and real queue depth under eighteen learners.** §5.3's numbers
  are arithmetic over an estimated `t`, not a load test.
- **Your own spend.** `recordJudge0Request` is not called from the provider's
  HTTP layer (§3), so every `judge0.*` counter reads `0` and every `quota*` field
  reads `null` regardless of what the plan is actually doing. One call site fixes
  it; until then the dashboard is the only meter.
- **Residency.** Not unknown — known and unresolved. This provider sends learner
  source code out of Kazakhstan, against the commitment in
  `docs/CODE_EXECUTION_DECISION.md`.
