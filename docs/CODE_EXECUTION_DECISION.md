# Code execution — decision

Which runtime executes Python written by 14-year-olds, and why.

**Decision: split the two semantics, because the repository already did.**

| Path | Runtime | Trust | Produces evidence |
|---|---|---|---|
| **RUN** — the learner's own input | Pyodide in a Web Worker, in the browser | `browser` | No |
| **SUBMIT** — platform tests | Self-hosted Piston on a Kazakh VPS, signed server-side | `judge` | Yes |

This is not a hedge. `packages/learning-contracts/src/events.ts` assigns
`run_executed` browser trust and upgrades `verdict_received` to `judge` only
when a valid attestation arrives; `schools/learning/sign.ts` is server-only by
construction and throws rather than shipping a key to a browser. Two execution
paths at two trust levels is written down, tested and load-bearing. A single
judge serving both would make RUN needlessly network-dependent or make SUBMIT
untrustworthy.

---

## Existing infrastructure

```
CONFIRMED: there is NO code execution infrastructure in this repo. Zero. The previous scan was right.

What I searched: judge0, piston, emkc, rapidapi, pyodide, docker, sandbox, execution, compiler, nsjail, isolate, firecracker, gvisor, e2b, codesandbox, riju — across all *.ts/*.tsx/*.js/*.mjs/*.json/*.md/*.yml/*.sh/*.env* outside node_modules/.next/.git.

WHAT EXISTS (Docker files — all for the Next.js app itself, not for running code):
- /Users/kydyrbekbekarys/SolveX4schools/Dockerfile, Dockerfile.dev, docker-compose.yml — build/run the Next.js app (node:24.14.1-slim, standalone output, image name `ai-website-cloner:latest`). Nothing to do with executing Python.
- No API routes at all. `find src/app -name route.ts` returns nothing. There is no server boundary yet.
- package.json has zero execution-related deps. Nothing that could run Python.

WHAT EXISTS (the contract layer that a judge must satisfy — this is the real finding):
- /Users/kydyrbekbekarys/SolveX4schools/schools/learning/verdict.ts — the hard requirement, already written and tested. `SANDBOX_STATUSES` is a CLOSED vocabulary: accepted, wrong_answer, compile_error, runtime_error, time_limit_exceeded, memory_limit_exceeded, sandbox_unavailable, pending. `assertSandboxStatus()` THROWS on the bare string "timeout" and names both correct replacements. Any adapter that emits "timeout" fails loudly at the boundary. This 
```

---

## Options compared

### 1. Self-hosted Judge0 CE (Docker, KZ VPS)

| | |
|---|---|
| **Python** | THE TRAP: the released open-source image ships Python 3.8.1 and 2.7.17 only. Verified in judge0/compilers Dockerfile: `ENV PYTHON_VERSIONS 3.8.1 2.7.17`. Python 3.8 went EOL October 2024. The hosted ce.judge0.com endpoint advertises Python 3.11.2 (id 92), 3.12.5 (100), 3.13.2 (109) and 3.14.0 (113) — but those live in a cloud build that is NOT in the public repo. Self-hosting the released artifact |
| **Sandbox** | isolate (the IOI/CMS sandbox — namespaces, cgroups, per-box UID) inside a --privileged Docker container. Strongest server-side isolation on paper of the two OSS judges. In practice: Tanto Security found three sandbox escapes in 2024 — CVE-2024-28185 (CVSS 10.0, symlink in sandbox dir), CVE-2024-28189 (CVSS 10.0, chown patch bypass), CVE-2024-29021 (CVSS 9.1, SSRF from inside the sandbox to Judge0' |
| **Limits** | Per-submission and per-request: cpu_time_limit (default 2s), cpu_extra_time (0.5s), wall_time_limit (5s), memory_limit (128000 KB), stack_limit (64000 KB), max_processes_and_or_threads (60), enable_network (default true — turn it OFF), max_file_size, number_of_runs. stdin: yes. expected_output: yes, with built-in stdout comparison. Returns stdout, stderr, compile_output, exit_code, exit_signal, ti |
| **Cost** | VPS only. hoster.kz Cloud 2-4-100 (2 vCPU / 4 GB / 100 GB NVMe) = 9,600 ₸/mo; Cloud 4-4-200 (4 vCPU / 4 GB / 200 GB) = 16,400 ₸/mo. At ~525 ₸/USD that is roughly US$18 and US$31 per month. Software is GPLv3, self-hosted submissions are unlimited and free. Plus: Postgres + Redis + N workers all on the same box, so size for 4 GB minimum. Real cost is the engineer-hours, not the tenge. |
| **Latency** | From a school in Almaty/Astana to a KZ VPS: ~5-30 ms RTT. Judge0 is async by default (POST then poll), but supports `?wait=true` for synchronous responses. Realistic end-to-end for a 50 ms Python script: 150-400 ms. Good enough for interactive RUN, comfortably good for SUBMIT. |
| **Concurrency** | Configurable worker count. On 2 vCPU expect 2-4 concurrent submissions; a class of 18 all pressing Submit in the same 10 seconds queues, and with a 2s limit the queue drains in ~10-20s worst case. 4 vCPU makes it a non-issue. JUDGE0_MAX_QUEUE_SIZE guards against pile-up; queue-full must map to sandbox_unavailable, not to a learner verdict. |
| **KZ data residency** | BEST AVAILABLE. Runs entirely on hardware you rent in Kazakhstan (hoster.kz, ps.kz, or Yandex Cloud's Karaganda region, live since April 2024). Student source code never crosses a border. Satisfies the execution half of the PDF p.4 commitment honestly. |
| **Learner TLE vs infra timeout** | YES — best in class, no reconstruction needed. Status id 5 = 'Time Limit Exceeded' is a first-class, distinct status. id 13 = 'Internal Error'. Mapping is a 14-line switch onto SANDBOX_STATUSES: 3→accepted, 4→wrong_answer, 5→time_limit_exceeded, 6→compile_error, 7-12→runtime_error, 13/14→sandbox_unavailable, 1/2→pending. Memory limit shows as status 7 (SIGSEGV) or 11 (NZEC) with `memory` at the ca |
| **Operational burden** | HIGHEST OF ALL SEVEN OPTIONS, and the reason I am not recommending it first. (a) It requires cgroup v1. The documented deployment step is adding `systemd.unified_cgroup_hierarchy=0` to GRUB_CMDLINE_LINUX and rebooting. (b) systemd disabled cgroup v1 by default in v256 (June 2024) and REMOVED it in v258 (September 2025). Ubuntu 26.04 ships systemd 259, has no v1 hierarchy at all, and will literally |

**For:** Status id 5 'Time Limit Exceeded' is a native, distinct status — the single hardest requirement in schools/learning/verdict.ts is satisfied with zero cleverness; Reports time, wall_time AND memory per submission — every field the requirement list asks for, no reconstruction; expected_output + built-in stdout comparison, and batch submissions: one HTTP call runs N platform tests, which is literally the SUBMIT semantic; Full KZ data residency, PDF p.4 satisfiable for the execution path

**Against:** Released image ships Python 3.8.1 — EOL, three minor versions behind what the curriculum author would type. Getting 3.12+ means building your own compilers image or running an unreleased cloud build you can't download; Requires cgroup v1, which systemd removed in v258 and Ubuntu 26.04 deleted outright. This stack is on a dead-end OS branch as of 2026; No upstream release since 2024-04-18. A security-critical component, unmaintained in public for 2+ years; Three CVSS 9.1-10.0 sandbox escapes in 2024, one of which worked precisely because enable_network defaults to TRUE. Default config is not safe config

### 2. Self-hosted Piston (Docker, KZ VPS)

| | |
|---|---|
| **Python** | You choose it. Runtimes install through the ppman package manager (`ppman install python=3.12.0`), and the version you pin is the version students get, permanently. The public package index has historically carried 3.5.x through 3.12.x. VERIFY on your own instance with `cli/index.js ppman list` before committing to a number — I could not confirm the current ceiling from the docs, and I am not goin |
| **Sandbox** | Weaker than isolate on paper, adequate in practice for this threat model. Per-job isolation is by UID/GID from a pool (default 1001-1500, so 500 concurrent identities); every process owned by that UID is killed at cleanup, which kills fork bombs. Networking is blocked by disallowing socket syscalls — `disable_networking: true` IS THE DEFAULT, unlike Judge0. prlimit caps processes (64), open files  |
| **Limits** | run_timeout default 3000 ms, compile_timeout 10000 ms, both settable per request. run_memory_limit and compile_memory_limit default -1 (UNLIMITED — you must set these). output_max_size default 1024 BYTES, which will truncate a chatty student program; raise it. max_process_count 64, max_open_files 64, max_file_size 10 MB. stdin: yes, plus args. Response carries stdout, stderr, combined output, exit |
| **Cost** | Same VPS as Judge0, but a smaller one works: hoster.kz Cloud 2-4-100 at 9,600 ₸/mo (~US$18) is comfortable; 2-2-50 at 6,200 ₸/mo (~US$12) would probably do for 18 students. No Postgres, no Redis, no queue — one container. MIT-adjacent OSS, free, unlimited. |
| **Latency** | From a KZ school to a KZ VPS: ~5-30 ms RTT. Piston is fully synchronous — one POST, one JSON response, no polling, no job id. A short Python program round-trips in roughly 100-300 ms. The fastest server-side option in this list, by a clear margin, because there is no queue and no second round trip. |
| **Concurrency** | max_concurrent_jobs default 64, UID pool of 500. Eighteen simultaneous submissions is nothing. No queue to wedge, no worker pool to starve. |
| **KZ data residency** | BEST AVAILABLE, identical to option 1. All execution on rented KZ hardware. Source code never leaves the country. |
| **Learner TLE vs infra timeout** | YES, but you reconstruct it rather than reading it off. You set run_timeout explicitly on every request, so when a run comes back killed you know which clock fired. On the widely-deployed build a timeout surfaces as `signal: "SIGKILL"` with `code: null` — the same shape as an OOM kill, so the rule is: SIGKILL + wall_time ≈ run_timeout → time_limit_exceeded; SIGKILL + memory at the cap → memory_lim |
| **Operational burden** | LOWEST of any server-side option. Standalone deploy is one command: a single --privileged container from ghcr.io. It wants cgroup v2 ENABLED and cgroup v1 DISABLED — the exact opposite of Judge0, and the exact configuration every currently-supported Linux ships by default. That single fact means Piston runs on Ubuntu 24.04/26.04 and will keep running, while Judge0 is stranded on 22.04. Backups are |

**For:** cgroup v2 native — runs on currently-supported Linux and stays there. This is the single biggest operational difference from Judge0; One stateless privileged container. No Postgres, no Redis, no worker pool, no queue, nothing to back up; disable_networking defaults to TRUE — the safe default, whereas Judge0 ships the unsafe one; Synchronous request/response, no polling. Lowest server-side latency of anything here

**Against:** Time-limit-exceeded is INFERRED (SIGKILL + wall_time ≈ run_timeout) on the common build rather than stated. Correct, but it is reconstruction and must be documented as such; Two conflicting sources on whether your build exposes the richer `status`/`cpu_time`/`memory` fields. Must be verified against the actual pinned image before writing the adapter — do not design on the assumption; run_memory_limit defaults to -1 (unlimited) and output_max_size to 1024 bytes. Both defaults are wrong for this product and must be set explicitly; memory_limit_exceeded is the weakest verdict here — Python usually raises MemoryError (reads as runtime_error) rather than being killed

### 3. Judge0 via RapidAPI (hosted marketplace)

| | |
|---|---|
| **Python** | Whatever the operator runs. The public ce.judge0.com endpoint currently advertises Python 3.11.2 (id 92), 3.12.5 (100), 3.13.2 (109), 3.14.0 (113) alongside the legacy 3.8.1 (71) — so the hosted build is far ahead of the released self-host image. Genuinely modern Python is the one real advantage of hosted Judge0. But you do not control when it moves. |
| **Sandbox** | Someone else's isolate deployment, patched by them. Given the 2024 escape history, 'patched by them' is worth something — but you have no visibility into their config, no way to confirm enable_network is off for your submissions, and no contractual security posture beyond a marketplace's boilerplate. |
| **Limits** | Same submission attributes as self-hosted, but each plan caps what you may request (max cpu_time_limit, max memory_limit, max submissions per batch). Plan-dependent, published per tier. On top of Judge0's own limits you inherit RapidAPI's gateway rate limiting and quota enforcement. |
| **Cost** | RapidAPI's Judge0 listing has a free Basic tier (historically a shared key at ~50 requests/day, which is nowhere near enough for one class-hour, let alone a term) and paid tiers on top. BUT: Judge0 now sells DIRECTLY at judge0.com — Pro €27/mo for 2,000 submissions/day, Ultra €54/mo for 5,000/day, Mega €107/mo for 10,000/day, with pay-per-use overage at €0.001/submission, all plans including suppo |
| **Latency** | Trans-continental. From Kazakhstan to EU-hosted infrastructure, expect ~80-150 ms RTT before execution, plus Judge0's queue, plus the RapidAPI hop. Realistic 300-800 ms end-to-end, with a long tail. Fine for SUBMIT, noticeably laggy for interactive RUN on a school connection. |
| **Concurrency** | Gateway-enforced, plan-dependent. Eighteen students is trivially within any paid tier. The free tier is not viable for even one lesson. |
| **KZ data residency** | FAILS THE COMMITMENT. Student source code, stdin and stdout leave Kazakhstan and land on infrastructure in an undisclosed jurisdiction, mediated by a second undisclosed jurisdiction (the marketplace). Two vendors, two ToS, two logs you cannot inspect, for a product whose PDF promises the opposite on page 4. |
| **Learner TLE vs infra timeout** | YES at the verdict layer — status id 5 is still 'Time Limit Exceeded', same as self-hosted. But you now have TWO infra failure sources to fold into sandbox_unavailable: Judge0's own status 13 (Internal Error), and the RapidAPI gateway's 429/5xx/quota-exhausted responses. That is fine, and arguably the honest reading: a 429 IS the sandbox being unavailable. The added risk is latency-driven false TL |
| **Operational burden** | Near zero. That is the entire pitch and it is a real pitch. One API key, no box, no patching, no cgroups, no 2 AM. |

**For:** Zero operational burden — no VPS, no patching, no cgroup archaeology; Modern Python (3.11/3.12/3.13/3.14) available today, unlike the released self-host image; Same first-class 'Time Limit Exceeded' status id 5 — the verdict.ts requirement is met natively; Trivial to spike in an afternoon to validate the adapter shape before committing to infrastructure

**Against:** Breaks the PDF p.4 Kazakhstan residency commitment outright — student code leaves the country; Adds a SECOND vendor between you and the judge for no functional gain, since Judge0 sells direct at €27/mo; Two rate limiters, two sets of terms, two failure modes, two support paths, two places to look when a lesson breaks mid-class; Marketplace quota exhaustion mid-lesson looks to 18 kids like the platform is broken

### 4. Piston public API (emkc.org)

| | |
|---|---|
| **Python** | Whatever emkc.org has installed. Not under your control and not announced when it changes. |
| **Sandbox** | Same Piston isolation model as option 2 — but on someone else's box, shared with the entire internet. |
| **Limits** | Historically 5 requests/second across all users of the public instance, plus Piston's own defaults (run_timeout 3000 ms, output 1024 bytes). |
| **Cost** | Free — and that is the whole problem. |
| **Latency** | Wherever emkc.org is hosted, plus whatever load the public internet is putting on it. Unpredictable by construction. |
| **Concurrency** | 5 req/s SHARED GLOBALLY. A class of 18 hitting Run within the same few seconds will be throttled by strangers' traffic. |
| **KZ data residency** | FAILS. Code leaves Kazakhstan to a hobby-operated endpoint in an undisclosed location, with no processor agreement, no DPA, and no operator you can serve a deletion request on. The programme also commits (PDF p.4) to deleting a child's data on request; you cannot honour that against emkc.org. |
| **Learner TLE vs infra timeout** | Technically yes (same SIGKILL/wall_time reconstruction as self-hosted Piston), plus 429s map cleanly to sandbox_unavailable. But at 5 req/s shared with the world, 429 would be a routine occurrence during a class of 18 pressing Run at once — meaning the most common verdict during a lesson would be 'the sandbox is broken'. The mechanism works; the substrate makes it useless. |
| **Operational burden** | Zero, in the sense that there is nothing to operate and nothing you can fix when it breaks. |

**For:** Free; Zero setup — useful for a 20-minute proof that your adapter's request/response shape is right; Same API as self-hosted Piston, so a spike here transfers directly to option 2

**Against:** DEAD AS A PUBLIC OPTION. The readme states plainly: 'The Piston API is no longer freely available to the public (as of Feb 15, 2026).' Access now requires personally asking EngineerMan on Discord, granted only for good-cause non-commercial educational projects, and explicitly denied for commercial projects and student assignments; Even with a granted key, this is a school's ASSESSMENT path riding on one volunteer's hobby endpoint with a bus factor of one; 5 req/s shared globally cannot serve 18 simultaneous learners; Breaks residency, and there is no deletion mechanism to honour the PDF p.4 commitment

### 5. Pyodide — CPython on WASM, in the student's browser

| | |
|---|---|
| **Python** | Excellent and current. Pyodide is a genuine CPython port to WebAssembly/Emscripten; the 314.x line released through 2026 tracks Python 3.13/3.14. Newer than the released Judge0 self-host image by a wide margin. Full stdlib (some modules unvendored by default, loadable on demand), and micropip installs any pure-Python wheel — irrelevant for a year-one procedural curriculum, but it means you will ne |
| **Sandbox** | THE STRONGEST GUARANTEE IN THIS ENTIRE LIST, and it is not close. The code runs inside the browser's WASM sandbox, on the student's own laptop. There is no server to escape onto. No filesystem beyond a virtual one, no sockets, no host. The worst outcome of a malicious or runaway program is that one 14-year-old crashes their own tab. Compare that to two options in this list whose failure mode is ro |
| **Limits** | You own the clock and you enforce it yourself. Run in a Web Worker, arm a wall-time budget on the main thread, and either write 2 into a SharedArrayBuffer interrupt buffer (pyodide.setInterruptBuffer — raises KeyboardInterrupt inside Python, so you get a clean stack) or terminate() the worker outright. stdin is synthesised: you feed a string and monkeypatch input()/sys.stdin. stdout/stderr are cap |
| **Cost** | ZERO marginal cost, forever. No VPS, no per-execution billing, no quota, no vendor. The only cost is bandwidth for the runtime download — on the order of 6-10 MB compressed for the core (pyodide.asm.wasm is ~13 MB raw, plus the stdlib archive), served once per browser and then cached. Eighteen students × one cold load is a rounding error on Vercel bandwidth. |
| **Latency** | THE BEST IN THIS LIST BY AN ORDER OF MAGNITUDE, after the first load. Zero network round trip. A short program executes in ~10-50 ms — genuinely instant, the feel a 14-year-old should get from pressing Run. First load costs 2-8 seconds for the runtime download on a decent connection, worse on school Wi-Fi shared by 18 laptops; then it is cached in the browser and every subsequent lesson starts war |
| **Concurrency** | Infinite and free. Every laptop is its own execution node. Eighteen students is eighteen independent runtimes. Thirty schools would be identical. There is no shared resource to contend for, no queue, no rate limit, no scaling story at all. |
| **KZ data residency** | PERFECT, AND UNIQUELY SO. Student source code NEVER LEAVES THE LAPTOP. Not to Kazakhstan, not to a VPS, not anywhere. There is no data to be resident. Every other option in this list is an argument about which jurisdiction the code lands in; this one deletes the question. For a programme with a written residency commitment and a written deletion commitment, that is worth taking seriously rather th |
| **Learner TLE vs infra timeout** | THIS IS WHERE IT BREAKS, AND HONESTLY SO. You can enforce a wall-clock budget and report time_limit_exceeded — the mechanism works. But you cannot tell a slow ALGORITHM from a slow SITUATION, and the situations are common in a real classroom: the tab was backgrounded (browsers throttle timers in background tabs to once a minute — a 2-second budget fires spuriously and instantly), the student close |
| **Operational burden** | Effectively zero servers, but NOT zero engineering. There is no box, no patching, no cgroups, no CVEs, no 2 AM page. But you write real code: a Worker harness, stdin synthesis, stream capture, the interrupt-buffer timeout, COOP/COEP headers, and careful handling of the 'the worker died and I don't know why' case. Call it a week of focused work, then near-zero maintenance forever. |

**For:** Data residency is not merely satisfied but eliminated — code never leaves the laptop. Uniquely honest against the PDF p.4 commitment; Strongest sandbox in the list: browser WASM, with no server to escape onto. A hostile student can at worst crash their own tab; Instant feedback (~10-50 ms) with zero network round trip — the correct interaction feel for RUN; Works offline. A dropped school connection does not stop the lesson

**Against:** CANNOT PRODUCE TRUSTED EVIDENCE — this is disqualifying for SUBMIT and nothing fixes it. sign.ts is server-only by design; a browser verdict can never be attested and lands as source_trust 'browser'; Learner-TLE is contaminated by environment: backgrounded tabs are timer-throttled, so a 2-second budget fires spuriously on a tab the student switched away from. The exact false positive verdict.ts exists to prevent, arriving through a different door; memory_limit_exceeded is essentially unmeasurable — no per-heap cap, and WASM OOM kills the worker with no diagnosable signal; No real exit code, no real process, no real signal. Those fields are fabrications you construct

### 6a. Cloudflare Containers / Sandboxes SDK

| | |
|---|---|
| **Python** | The Sandbox SDK ships persistent code interpreters for Python, JS and TS with structured outputs; you can also bring any OCI image, so you pin whatever Python you want. Containers and Sandboxes went generally available on 2026-04-13. |
| **Sandbox** | Professionally operated container isolation on Cloudflare's edge, purpose-built for 'run untrusted or model-generated code'. Maintained and patched by a company with a security team. Strongest server-side guarantee-per-effort-spent in this list — you inherit their isolation rather than configuring your own. |
| **Limits** | Instance types: lite (1/16 vCPU, 256 MiB, 2 GB disk), basic (1/4 vCPU, 1 GiB, 4 GB), standard-1 (1/2 vCPU, 4 GiB, 8 GB), up to standard-4 (4 vCPU, 12 GiB, 20 GB). Time and memory limits inside the container are YOURS to enforce (resource.setrlimit, a `timeout` wrapper, whatever you write). Containers sleep after a timeout and scale to zero. stdin, stdout, stderr, exit code all available through th |
| **Cost** | Effectively $5/month. Cloudflare Workers Paid ($5/mo) INCLUDES 375 vCPU-minutes, 25 GiB-hours of memory and 200 GB-hours of disk. Eighteen students at ~5,000 executions/month × ~1 s CPU each is about 83 vCPU-minutes — comfortably inside the included allowance. Beyond that: $0.000020/vCPU-second, $0.0000025/GiB-second, $0.00000007/GB-second. Billed in 10 ms increments, CPU charged only when actuall |
| **Latency** | Workers are edge-local (Cloudflare has a PoP in Almaty), but Containers run in a subset of regions — expect ~100-300 ms RTT to wherever your container lands, plus wake-from-sleep on the first request of a lesson, which is seconds not milliseconds. Bursty classroom traffic (nothing for 40 minutes, then 18 requests at once) is close to the worst-case shape for scale-to-zero. |
| **Concurrency** | Excellent and elastic. Eighteen concurrent is nothing; Cloudflare handles the scaling. |
| **KZ data residency** | FAILS THE COMMITMENT. Cloudflare's docs do not commit containers to a Kazakhstan location, and Cloudflare has no KZ compute region. Workers run near Almaty; CONTAINERS do not. Student code executes outside the country. |
| **Learner TLE vs infra timeout** | YES, but only because you build it. There is no judge here — you are writing one. The standard and correct trick: enforce the learner's limit INSIDE the container (a wrapper that SIGKILLs at N seconds, or resource.setrlimit), set it well below the platform's own timeout, and then platform-timeout-fired means infrastructure while wrapper-fired means the learner. That distinction is clean and defens |
| **Operational burden** | Low on infrastructure, MODERATE-TO-HIGH on engineering. Nothing to patch, nothing to reboot, no cgroups. But you are writing the judge yourself: test harness, limit enforcement, status derivation, output capture, the whole thing that Judge0 and Piston hand you for free. Budget a week or two, plus ongoing ownership of judge semantics you invented. |

**For:** Best isolation-per-effort of any server option — professionally maintained, purpose-built for untrusted code; Cheapest managed option: almost certainly $5/mo flat at this volume, inside the Workers Paid allowance; Scales to zero and back with no capacity planning; Generally available since April 2026, actively developed, real vendor behind it

**Against:** Breaks the PDF p.4 Kazakhstan residency commitment — no KZ container region; YOU ARE WRITING A JUDGE. Test running, limit enforcement, verdict derivation, output capture — all of it. Judge0 and Piston give you that for free; Cold start from scale-to-zero is seconds, and classroom traffic (idle 40 minutes, then 18 at once) is exactly the pattern that maximises cold starts; Real vendor lock-in: the Sandbox SDK, Durable Object bindings and Workers runtime are not portable. Migrating means a rewrite, not a config change

### 6b. AWS Lambda (Firecracker) — the other serverless option

| | |
|---|---|
| **Python** | Whatever you ship. Managed Python runtimes, or a container image with any version pinned. |
| **Sandbox** | Firecracker microVM — genuine hardware-assisted virtualisation, the strongest isolation primitive in this list on paper, operated by AWS. But Lambda is a function platform, not a sandbox product: you must still stop the student's code from doing things the function's own IAM role permits. Run with an empty role, no VPC, no secrets in the environment. |
| **Limits** | Up to 15 minutes, 128 MB-10 GB memory, 512 MB-10 GB ephemeral storage. stdin/stdout/stderr are not native — you build them around subprocess. Timeouts, memory caps and output capture are all yours to implement. |
| **Cost** | $0. Genuinely. The always-free tier (1M requests + 400,000 GB-seconds per month, non-expiring) swallows 18 students without noticing. Beyond it: $0.20 per million requests, $0.0000166667/GB-second on x86, ~20% less on Graviton/ARM. This pilot will never leave the free tier. |
| **Latency** | Warm invocations ~50-200 ms plus execution; cold starts 1-3 s. From Kazakhstan to Frankfurt or Dubai, ~60-120 ms RTT on top. Bursty classroom traffic maximises cold starts, same as 6a. |
| **Concurrency** | Effectively unlimited (1,000 concurrent by default, raisable). Eighteen is noise. |
| **KZ data residency** | FAILS THE COMMITMENT. AWS has no Kazakhstan region. Nearest are eu-central-1 (Frankfurt), me-central-1 (UAE), ap-south-1 (Mumbai). Student code leaves the country. |
| **Learner TLE vs infra timeout** | YES, with the same discipline as 6a and it works well. Enforce the learner's limit inside the handler (signal.alarm or a subprocess with its own timeout) at a value comfortably below the function's configured timeout. Learner-limit fires → time_limit_exceeded. Function timeout fires → sandbox_unavailable. Lambda's own timeout is a distinct, observable event (the invocation is killed and reported a |
| **Operational burden** | Low infrastructure, moderate-to-high engineering, plus the AWS tax: IAM, deployment tooling, CloudWatch, and a billing account someone has to own. Same as 6a, you are writing the judge from scratch. |

**For:** Genuinely free at this scale — the always-free tier covers it with room to spare, permanently; Firecracker microVM isolation, maintained by AWS; Effectively unlimited concurrency and no capacity planning; Total control of the Python version and the harness

**Against:** Breaks the PDF p.4 Kazakhstan residency commitment — no AWS KZ region, nearest is Frankfurt or Dubai; You are writing a judge from scratch, same as 6a, with none of Judge0's or Piston's semantics for free; Lambda is a function runtime, not a sandbox product — untrusted code inherits the function's IAM identity unless you deliberately strip it. Easy to get subtly wrong; Cold starts of 1-3 s hit exactly when a class starts working simultaneously

### 7. Vercel Sandbox — the option nobody asked about but the deployment target implies

| | |
|---|---|
| **Python** | Python 3.13 built in, plus Node 22/24/26; or any OCI image. |
| **Sandbox** | Firecracker microVMs, operated by Vercel, explicitly marketed for running untrusted and model-generated code. Solid, maintained, not your problem. |
| **Limits** | Up to 45 minutes on Hobby, 24 hours on Pro/Enterprise; 8 vCPUs on Pro, 32 on Enterprise, 2 GB memory per vCPU. Default sandbox lifetime 5 minutes. Time and memory limits for the LEARNER are yours to enforce inside. |
| **Cost** | Trivial at this volume: $0.128 per vCPU-hour of ACTIVE CPU (I/O wait is not billed) plus $0.0212/GB-hour of provisioned memory. Five thousand executions at ~2 s each is under 3 vCPU-hours — under a dollar a month in CPU, plus memory-hours. Requires a Pro plan for the useful limits. |
| **Latency** | WORST FIT FOR INTERACTIVE RUN. A fresh Firecracker microVM per execution costs roughly 1-3 seconds before a single line of Python runs. You can keep sandboxes warm across a lesson to amortise it, which is more state to manage. Acceptable for SUBMIT, poor for the press-Run-and-see-it feel. |
| **Concurrency** | Fine for 18. Pro-plan vCPU caps are the ceiling and you are nowhere near them. |
| **KZ data residency** | FAILS THE COMMITMENT. Vercel has no Kazakhstan region. Student code leaves the country. |
| **Learner TLE vs infra timeout** | YES, with the same inside-the-sandbox discipline as 6a/6b. But microVM creation latency (~1-3 s per fresh sandbox) makes caller-side timing worthless — every measurement must come from inside. |
| **Operational burden** | Lowest of the serverless three IF you are already on Vercel — same dashboard, same billing, same auth, one SDK. But same as 6a/6b, you are still writing the judge. |

**For:** Already your deployment platform — no new vendor, no new billing relationship, no new account to own; Firecracker isolation, maintained by Vercel, built for untrusted code; Python 3.13 built in, or any OCI image; Sub-dollar monthly cost at this volume; active-CPU-only billing suits bursty classroom traffic

**Against:** Breaks the PDF p.4 Kazakhstan residency commitment; MicroVM creation of 1-3 s per run makes it a poor fit for interactive RUN unless you keep sandboxes warm, which is extra state; You are writing the judge yourself — no TLE status, no test comparison, no batch, none of it; Requires a Pro plan for useful limits

---

## Reasoning

THE ARCHITECTURE ALREADY DECIDED THIS. packages/learning-contracts/src/events.ts assigns `run_executed` a trust level of "browser" and `verdict_received` a trust level of "browser" with the note that ingest upgrades it to "judge" only when a valid attestation arrives. schools/learning/sign.ts is server-only by deliberate construction — its own docstring says that if it is ever pulled into a client bundle the secret reads as undefined and it throws rather than shipping a key to a browser. Two execution paths with two trust levels is not something I am proposing; it is written down, tested, and load-bearing. A single judge serving both would either make RUN needlessly expensive and network-dependent, or make SUBMIT untrustworthy. Neither is acceptable.

WHY PYODIDE FOR RUN. RUN produces no evidence by contract, so the browser's untrustworthiness costs nothing — you are already recording it as browser-trust whatever executes it. In exchange you get: ~10-50 ms feedback with no network round trip (the correct feel for a 14-year-old pressing Run, versus 150-800 ms and a spinner); it keeps working when the school's connection drops mid-lesson, which in Kazakhstan is a real Tuesday and not a hypothetical; zero marginal cost and infinite parallelism, so a second school costs nothing; the strongest sandbox in the entire comparison, because there is no server to escape onto and the worst case is one student crashing their own tab; and student code never leaves the laptop, which is the only residency story in this list that is not an argument about jurisdictions. Modern CPython (3.13/3.14 line) — ahead of what a released self-hosted Judge0 would give you. The engineering is real but bounded: a Worker harness, stdin synthesis, stream capture, an interrupt-buffer timeout, COOP/COEP headers. About a week, then near-zero maintenance forever.

WHY PISTON FOR SUBMIT, AND NOT JUDGE0. Judge0 has the better verdict vocabulary — status id 5 is literally "Time Limit Exceeded", it reports time and wall_time and memory per submission, it has expected_output comparison and batch submissions, which is exactly the SUBMIT shape. On paper it is the right answer and I want to be clear that I considered it seriously. But three verified facts kill it for a two-person team:

(1) THE CGROUP DEAD END. Judge0 requires cgroup v1 — the documented install step is adding `systemd.unified_cgroup_hierarchy=0` to GRUB and rebooting. systemd disabled cgroup v1 by default in v256 (June 2024) and REMOVED it in v258 (September 2025). Ubuntu 26.04 ships systemd 259, has no v1 hierarchy at all, and refuses to upgrade a machine with cgroup-v1 containers, with no flag to turn it back on. Self-hosting Judge0 in 2026 pins you to Ubuntu 22.04, whose standard support ends April 2027 — inside the life of a multi-year school programme. Piston requires the OPPOSITE (cgroup v2 enabled, v1 disabled), which is what every currently-supported Linux ships by default. One of these runs on the OS you will actually be running in 2028. The other does not.

(2) NO UPSTREAM RELEASE SINCE 2024-04-18. Judge0 CE v1.13.1 is the newest tag, and it exists because Tanto Security found three sandbox escapes: CVE-2024-28185 (CVSS 10.0), CVE-2024-28189 (CVSS 10.0, a bypass of the first patch) and CVE-2024-29021 (CVSS 9.1, SSRF from inside the sandbox to Judge0's own Postgres → command injection → root on host). Two-plus years of public silence on a security-critical component that had three CVSS-9-10 escapes in its last release. And the third one worked precisely because `enable_network` defaults to TRUE — the shipped default is not the safe default. Note also that the released compilers image ships Python 3.8.1 and 2.7.17 (verified in the Dockerfile: `ENV PYTHON_VERSIONS 3.8.1 2.7.17`). Python 3.8 is EOL. The 3.11/3.12/3.13/3.14 you see on ce.judge0.com lives in a cloud build that is not in the public repo. Self-host and you get EOL Python unless you build your own image, which is a project.

(3) FOUR MOVING PARTS VERSUS ONE. Judge0 is server + workers + Postgres + Redis, privileged, patched by you. Piston is one stateless privileged container from ghcr.io. No database, no queue, nothing to back up. If the box dies you `docker run` on a new one and you are back — which for a team with no SRE is the difference between a bad afternoon and a lost lesson.

PISTON MEETS EVERY STATED REQUIREMENT. stdin: yes. stdout, stderr, exit code, signal: yes. Wall time, CPU time, memory: yes on builds that expose them — VERIFY THIS AGAINST YOUR PINNED IMAGE FIRST, because the readthedocs v2 page does not document those fields while a source-level reading does, and I could not settle it from documentation alone. Do not design the adapter on the assumption; spend twenty minutes confirming it. Time limit and memory limit: per-request via run_timeout and run_memory_limit — note that run_memory_limit defaults to -1 (unlimited) and output_max_size to 1024 BYTES, both of which are wrong for this product and mu

---

## Second choice

SELF-HOSTED JUDGE0 CE ON THE SAME KZ VPS, for SUBMIT (keeping Pyodide for RUN either way).

Take it if — and only if — a specific named person will own that box. Judge0 genuinely has the better judge semantics: status id 5 is a first-class "Time Limit Exceeded" so the hardest requirement in verdict.ts needs no inference at all; it reports time, wall_time and memory per submission; expected_output does stdout comparison for you; and batch submissions run N platform tests in one HTTP call, which IS the SUBMIT semantic rather than an approximation of it. If the team had an SRE, this would be my first choice and it would not be close.

What you accept in exchange: Ubuntu 22.04 pinned forever because of cgroup v1 (systemd removed v1 in v258, Ubuntu 26.04 deleted it and blocks upgrades, no flag brings it back — 22.04's standard support ends April 2027); an upstream that has shipped nothing since 2024-04-18; three CVSS 9.1-10.0 sandbox escapes in that last release; `enable_network` shipping as TRUE and needing to be turned off by hand; Python 3.8.1 in the released compilers image, meaning you build your own to get 3.12+; and Postgres + Redis + workers + server in privileged containers, all yours to patch.

THIRD, if residency loses the argument at the programme level: Cloudflare Containers/Sandboxes at ~$5/month (Workers Paid includes 375 vCPU-minutes and 25 GiB-hours; ~5,000 executions × 1 s CPU is about 83 vCPU-minutes, comfortably inside), or Judge0 Cloud direct at €27/month. Both are operationally trivial. Both put Kazakh students' code outside Kazakhstan, and that is a decision for whoever signed the PDF, not for the engineer picking a judge.

NOT UNDER ANY CIRCUMSTANCES: the Piston public API at emkc.org. It stopped being publicly available on 15 February 2026 — access now means personally asking one maintainer on Discord, granted only for non-commercial educational use and explicitly denied for student assignments. Even with a key, it is 5 requests/second shared wit

---

## Was RapidAPI necessary?

**No.**

NOT NECESSARY. Nothing in this repository requires it, references it, or implies it. It was mentioned by you, not by the codebase.

The evidence: the ONLY "rapid*" string anywhere in the project is /Users/kydyrbekbekarys/SolveX4schools/docs/assets/sponsors/rapidproxy-banner.png — an unrelated sponsor image inherited from the upstream ai-website-cloner-template, and not RapidAPI at all. Zero source references. Zero config. Zero environment variables (docs/integration/LI_SECRETS_REQUIRED.md lists the required secrets and there is no RapidAPI key among them).

More to the point, the reason RapidAPI historically mattered for Judge0 has evaporated. Judge0 now sells directly at judge0.com: Pro €27/month for 2,000 submissions/day, Ultra €54 for 5,000/day, Mega €107 for 10,000/day, pay-per-use overage at €0.001/submission, support included. Routing through RapidAPI to buy the same product adds a marketplace middleman for zero functional gain: a second vendor, a second API key, a second rate limiter, a second set of terms, a second failure mode to debug mid-lesson, and — the part that actually matters here — a second undisclosed jurisdiction that 14-year-olds' source code passes through, for a programme whose PDF promises the opposite on page 4.

The free Basic tier is not a real option either. Historically a shared key at roughly 50 requests/day, which does not survive a single 45-minute lesson with 18 students, let alone a term.

Where RapidAPI is legitimately useful: as a throwaway spike. Grab the free key, POST one submission, confirm your status-id mapping onto SANDBOX_STATUSES is right, confirm the attestation payload shape round-trips through signAttestation and verifyAttestation, then throw it away and never mention it in an architecture document. That is worth an afternoon. It is not worth a dependency.

One honest caveat on my own recommendation, since it cuts the same way: hosted Judge0 (whether via RapidAPI or direct) is the one place you can get modern Python 3.12/3.13/3.14 on Judge0 semantics today without building your own compilers image. If someone argues for it on those grounds, that argument is real. It just loses to residency, and it loses entirely to Piston, which gives you a pinned modern Python inside Kazakhstan for the price of a VPS.

---

## The abstraction that makes this reversible

Nothing above reaches lesson blocks, Arena, Learning Intelligence or the
teacher projection. Everything goes through one port:

```ts
interface CodeExecutionProvider {
  readonly id: string;
  run(request: ExecutionRequest): Promise<ExecutionResult>;
}
```
Swapping Piston for Judge0, or a self-hosted box for a managed one, is a
provider file and an environment variable. That is the point of writing it
this way before the first line of provider code exists.
