# Deploying the judge

How to stand up the Piston instance that grades learners' code, for someone who
has a Linux **x86_64** host and has never seen this repository.

**Read `docs/deployment/PRODUCTION_ENVIRONMENT.md` first.** It is the authority
on every environment variable the application reads, on the boot assertion that
refuses to start without a judge, and on sizing the judge for a class of N. This
document does not repeat any of it — it covers the one thing that document
explicitly leaves open:

> | A Piston deployment works | **UNPROVEN** | no instance exists; see the checklist at the end |

## Status of this document

**No instance has ever been reached from this repository.** Everything below is
a procedure, not a report. Where a step's outcome is a fact only a live judge can
establish, it is marked **VERIFY** and there is a command to run — because the
alternative is a document that sounds finished and a class that goes unmeasured.

An attempt to run Piston locally on the development machine failed for reasons
that are architectural rather than fixable. They are recorded in full at the end,
under [The local attempt, and why it failed](#the-local-attempt-and-why-it-failed).
**Read that section before spending a day on the same wall.**

---

## 1. What is being deployed, and why it is separate

Piston is an open-source code execution sandbox: an HTTP API in front of
`isolate`, which is the sandbox the IOI uses for its own contests. It runs one
submission per disposable job directory, under cgroup CPU and memory limits, with
no network.

The application never executes learner code itself. `schools/exec/providers/piston.ts`
speaks Piston's `/api/v2/execute` protocol and nothing else, so the judge is a
network dependency, not a library — which is what makes it replaceable and, more
to the point, what keeps a fourteen-year-old's `import os` on the other side of a
process boundary from the school's data.

The alternative in the tree, `LocalExecutionProvider`, runs Python as a child of
the application with the application's filesystem, network and environment. It
**refuses to run in production** and that refusal is deliberate. Do not deploy
around it.

## 2. Provider, host and region

### The region is not negotiable

The programme commits to **Kazakh data residency for learner-authored content**.
For most of this system that commitment is cheap: the ledger holds subject ids,
block ids, verdicts and counters — pseudonymous machine records. The judge is the
exception, and it is the only one.

**The judge is the single component that necessarily receives a child's own
writing, verbatim.** A learner's Python source is authored by them, it can carry
their name in a comment or a `print`, and it is the closest thing in this product
to a piece of schoolwork. Everything else can be described as telemetry. This
cannot. It is also the component most likely to be handed to a managed service
without thinking, because "run some code" sounds like a utility.

So: the judge runs on a machine physically in Kazakhstan, operated under Kazakh
jurisdiction, and `PISTON_URL` points at it and nowhere else. A managed execution
API — Judge0's hosted tier, a serverless runner, anything with "cloud" in the
name — sends every submission across a border and out of the programme's control,
and the sandboxing quality is not the reason to refuse it.

### Choosing the host

- A KZ-registered provider with a datacentre in **Almaty or Astana**. PS.KZ,
  Hoster.KZ and QazCloud (Kazakhtelecom) are the usual candidates for a pilot of
  this size; the programme, not this document, picks one.
- **VERIFY the physical location in writing.** A `.kz` domain, a KZ company
  registration and a KZ billing address prove nothing about where the disk is.
  Ask for the datacentre and get the answer on paper. This is the entire
  residency claim and it rests on nothing in this repository.
- **x86_64.** Not arm64 — see the failure section. If the only KZ option is
  arm64, stop and escalate; the fix is a different host, not a workaround.
- **A plain VPS or dedicated box**, not a managed container platform. Piston
  needs `--privileged` and its own cgroup and namespace control, which most
  managed runtimes will not grant.

### Size

Numbers and their derivation are in `PRODUCTION_ENVIRONMENT.md` §"Sizing the
judge for a class of N". The short version for the 18-learner pilot:

| | Minimum | Why |
|---|---|---|
| vCPU | **4** | each job needs a core slice for up to 5 s |
| RAM | **4 GB** | ceiling is not reservation; `max_concurrent_jobs` is the real backstop |
| Disk | **20 GB** | the image, one Python package, job scratch |
| OS | Debian 12 or Ubuntu 22.04/24.04, x86_64 | anything with a current kernel and cgroup v2 |

Peak concurrency is **2N, not N** — Run and Submit share the judge and neither
waits for the other. Size for 36 concurrent jobs for one class of 18.

## 3. The pinned Python runtime

**`3.12.0`, and it is declared in exactly one place:**

```
schools/execution/python-policy.ts  →  PYTHON_RUNTIME.version
```

`schools/config.ts` re-exports it as `config.exec.python`, the Piston provider
reads `PYTHON_RUNTIME.wireVersion` for the request it puts on the wire, and this
document names the file rather than repeating the number. If the number here and
the number in that file ever disagree, **the file is right and this line is
stale.** `tests/school/python-policy.test.ts` asserts the wiring, including that
the provider has not re-hardcoded the literal.

Two version strings, on purpose:

- **`version: "3.12.0"`** — what you INSTALL. Exact, because a verdict recorded
  in March is only comparable to one recorded in April if the interpreter
  underneath both is knowable.
- **`wireVersion: "3.*"`** — what the execute request ASKS FOR. A range, resolved
  by Piston against the packages the host has. Because you install exactly one
  Python, it can only resolve to the pin — while a patch-level rebuild of the
  judge stays a rebuild instead of becoming an outage.

The version is deliberately **not** an environment variable. An operator who can
change the Python version from a dashboard can make two months of a child's
evidence incomparable with no commit and no trace.

**Library policy: standard library only. No third-party packages.** Enforced by
absence — the judge has no network and nothing but CPython on it, so `import numpy`
fails with `ModuleNotFoundError` because numpy is not there. The full policy,
the stdlib modules later months may legitimately reach for, and the four gates a
package request must pass are in `schools/execution/python-policy.ts`.

## 4. Deployment procedure

Run as a user who can use Docker. Nothing below needs a secret, and nothing below
should be given one.

### 4.1 Host preparation

```
sudo apt-get update && sudo apt-get install -y docker.io curl jq
sudo systemctl enable --now docker
```

**VERIFY the architecture before going further.** One command, and it saves the
day the failure section describes:

```
uname -m          # must print x86_64
```

If it prints `aarch64` or `arm64`, stop. Read the failure section.

### 4.2 Create the persistent package directory

Piston keeps installed language packages under `/piston` in the container. Bind a
host directory so a container restart does not throw away the Python you
installed.

```
sudo mkdir -p /srv/piston
```

### 4.3 Run the container

This is the invocation. Every flag is load-bearing.

```
sudo docker run -d \
  --name piston_api \
  --restart unless-stopped \
  --privileged \
  -v /srv/piston:/piston \
  --tmpfs /piston/jobs:exec,uid=1000,gid=1000,mode=711 \
  -p 127.0.0.1:2000:2000 \
  -e PISTON_MAX_CONCURRENT_JOBS=48 \
  -e PISTON_OUTPUT_MAX_SIZE=65536 \
  -e PISTON_RUN_TIMEOUT=5000 \
  -e PISTON_COMPILE_TIMEOUT=10000 \
  -e PISTON_DISABLE_NETWORKING=true \
  ghcr.io/engineer-man/piston
```

**`--privileged`** — Piston's isolation is `isolate`, which needs to create
namespaces and control cgroups. Without it the sandbox cannot start. This is the
uncomfortable part of running a code judge and it is why the judge gets its own
machine: the container is privileged, so treat the host as if the container owned
it, because effectively it does.

**`--tmpfs /piston/jobs:exec,...`** — job scratch, in RAM, **mounted `exec`**.
Docker mounts tmpfs `noexec` by default, and Piston writes the compiled or
prepared program into a job directory and then runs it from there. On a `noexec`
mount every single job fails at launch, which the adapter reads as a runtime
error — so a wrong mount option would report an entire class as having written
broken programs. `uid`/`gid` `1000` matches the unprivileged user Piston runs jobs
as. `mode=711` lets jobs traverse into their own directory without listing each
other's.

**`-p 127.0.0.1:2000:2000`** — bound to loopback deliberately. Piston executes
arbitrary code by design and has no authentication of its own. Publishing it on
`0.0.0.0` puts a remote code execution endpoint on the public internet. See §6.

**`-v /srv/piston:/piston`** — the installed Python survives a restart.

**`--restart unless-stopped`** — the judge coming back after a host reboot
without anyone noticing is the desired behaviour; a judge that quietly stays down
means every code task settles unmeasured.

The `PISTON_*` values are Piston's own configuration names, taken from its
documentation rather than from a running instance here — **VERIFY** each against
`docs/configuration.md` in the Piston repository at the tag you deploy, and
against `docker logs piston_api` at start-up, which prints the configuration it
actually loaded. The four that matter and why:

| Setting | Value | Why this number |
|---|---|---|
| `MAX_CONCURRENT_JOBS` | 48 | 2N with headroom for 18 learners. Lower and jobs queue; our fetch ceiling is `5000 + 5000 = 10 s`, so anything queued longer comes back as `provider_timeout` and the learner is silently unmeasured |
| `OUTPUT_MAX_SIZE` | 65536 | Must be **at least** `EXECUTION_LIMITS.maxOutputBytes`. Piston enforces its own limit by killing the job with SIGKILL, and this adapter reads SIGKILL as `time_limit_exceeded` — so a correct but chatty program would be recorded as the learner's algorithm being too slow. **This is the most likely way for real evidence to be quietly wrong.** |
| `RUN_TIMEOUT` | 5000 | The per-request `run_timeout` we send is 5000 ms. A server-side cap **below** it would turn every genuine learner timeout into a judge that answered early, and December is the month that is entirely about making programs fast enough |
| `DISABLE_NETWORKING` | true | A sandbox with a network is not a sandbox. It is also what makes the stdlib-only policy self-enforcing |

### 4.4 Install the Python runtime

Piston ships with no languages. Install exactly one.

```
curl -s -X POST http://127.0.0.1:2000/api/v2/packages \
  -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"3.12.0"}' | jq
```

**VERIFY it is actually there** — the POST returning 200 is not the same as the
runtime resolving:

```
curl -s http://127.0.0.1:2000/api/v2/runtimes | jq '.[] | select(.language=="python")'
```

You want exactly one python entry, at `3.12.0`. **If `3.12.0` is not in
`GET /api/v2/packages`** — Piston's package index is built for specific versions
and yours may differ — do not silently install a neighbouring version. Pick the
closest available 3.x, change `PYTHON_RUNTIME.version` in
`schools/execution/python-policy.ts`, commit that change, and redeploy the app.
The point of the pin is that the number in the code is the number on the judge.

**VERIFY it runs:**

```
curl -s -X POST http://127.0.0.1:2000/api/v2/execute \
  -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"3.*","files":[{"name":"main.py","content":"print(input())"}],"stdin":"hi\n","run_timeout":5000,"run_memory_limit":268435456}' | jq
```

Expect `run.stdout == "hi\n"` and `run.code == 0`. This is the exact request
shape the adapter sends, including the range in `version` — if this call works
and the application's does not, the difference is network, not protocol.

### 4.5 Point the application at it

Set `EXEC_PROVIDER=piston` and `PISTON_URL` in the application's environment.
`PISTON_URL` carries **no trailing slash** — the adapter appends
`/api/v2/execute`. Both variables, what validates them and what breaks when they
are wrong are documented in `PRODUCTION_ENVIRONMENT.md`.

The application refuses to boot in production without them. That refusal is the
feature; it will still be somebody's first surprise.

### 4.6 Smoke test through the application

```
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
  'https://<app-host>/api/health?probe=1' | jq '.execution'
```

`probe=1` runs a two-line Python program through the configured provider and
reports `probeMs`, `probeStatus` and `probeOk`. It is admin-only and opt-in so an
unauthenticated caller cannot make the health endpoint put load on the judge.
**This is the deploy smoke check.** `probeOk: true` is the first evidence in the
history of this project that the whole path works.

Then run the pre-pilot checklist at the end of `PRODUCTION_ENVIRONMENT.md`. Every
line on it is a thing the conformance suite explicitly cannot cover.

## 5. Restart procedure

```
sudo docker restart piston_api
```

Then, always:

```
curl -s http://127.0.0.1:2000/api/v2/runtimes | jq
```

**Why that second command is not optional.** Piston's installed packages live
under `/piston/packages`, which is on the bind mount and survives. Job scratch
lives on the tmpfs and does not, which is correct — but if the bind mount is ever
missing or the container is recreated without `-v`, the API comes back healthy
with **zero runtimes installed**. Every execute request then fails with a 400,
which the adapter records as `provider_error`, which means every learner is
unmeasured and **nobody is marked wrong**. The failure is silent from the
classroom: the lesson works, the code tasks just stop being graded.

A restart drops in-flight jobs. Those submissions settle as unmeasured, which is
the honest outcome — but it is a reason to restart between lessons rather than
during one.

For the full operational surface — upgrade, rollback, log reading, load test,
failure recovery — see `JUDGE_RUNBOOK.md` beside this file.

## 6. Network exposure

Piston executes arbitrary code and has **no authentication**. Anyone who can
reach port 2000 can run anything on that host.

- Bind to loopback (as in §4.3) and reach it over a **private network or a
  WireGuard tunnel** from the application host. Do not publish 2000.
- If the app and the judge cannot share a private network, firewall 2000 to the
  application's egress IP and nothing else, and put a reverse proxy with a shared
  secret in front. That secret belongs in the application's environment, is a
  credential, and is subject to every rule in `PRODUCTION_ENVIRONMENT.md` about
  credentials — the adapter does not send one today, so this needs code.
- **VERIFY from outside**: from a machine that is not the app host,
  `curl --max-time 5 http://<judge-host>:2000/api/v2/runtimes` must fail to
  connect. Not 403 — fail to connect.

---

## The local attempt, and why it failed

Recorded so the next person does not spend a day rediscovering it. **This is a
report of a real attempt on an arm64 macOS development machine. It is not a
reason the deployment above will not work on an x86_64 Linux host — it is the
reason it was not tried here.**

### 1. The official image is amd64-only, and qemu-user cannot emulate it

`ghcr.io/engineer-man/piston` publishes an **amd64 image only**. Under Docker
Desktop on Apple silicon it runs through qemu-user emulation, and Piston's
sandbox fails immediately:

```
Cannot run proxy, clone failed: Invalid argument
```

That is not a Piston bug. `isolate` sets up its sandbox by calling `clone()` with
namespace flags (`CLONE_NEWNS`, `CLONE_NEWPID`, `CLONE_NEWNET` and friends), and
**qemu-user does not emulate `clone()` with namespace flags** — it translates
syscalls into host syscalls for a single process image and has no way to give the
guest its own namespaces. The isolation cannot start, so nothing runs. There is
no flag, no privileged mode and no seccomp profile that changes this; it is a
limit of the emulator, not a configuration.

### 2. Building Piston for arm64 from source does not work either

Two independent blockers, and the second is fatal on its own:

- **The API image is based on Debian buster, which is EOL.** Its apt
  repositories now return 404, so the Dockerfile fails during `apt-get` before
  anything is compiled. Rebasing it onto a supported Debian is a real fork of
  Piston, not a patch — and a forked judge is no longer "unmodified upstream",
  which was the reason to choose Piston.
- **Piston's language packages are prebuilt amd64 tarballs.** The package index
  distributes compiled runtimes, not build recipes for the target host. So even a
  working arm64 API would have **no Python runtime available to install**, and
  `POST /api/v2/packages` would have nothing to give it. Building CPython for
  arm64 into a Piston package by hand is possible and is a project.

### 3. Full-system x86_64 emulation would work, and was not usable here

A Linux VM under full-system emulation (colima/lima with qemu, `--arch x86_64`)
runs genuine unmodified Piston with real `isolate` isolation. **That is the
correct way to run Piston on an arm64 machine**, and it is the only local path
worth attempting.

It was not usable here for two reasons:

- The VM did not boot: **lima's DHCP driver timed out** during network setup, on
  this host, repeatedly.
- Even booted, full-system x86_64 emulation on arm64 is roughly **10–30× slower**
  than native. A judge that slow answers, so it would prove the protocol — but
  every timing number it produced would be meaningless, and the questions that
  actually need a real judge are timing questions: does 36 concurrent executions
  stay inside the 10 s ceiling, is a 4-case submit under two seconds, does
  `run_timeout` behave at the boundary. Measuring those under emulation would
  produce numbers that look like evidence and are not.

### What this means for the claims in this repository

Unchanged, and worth restating plainly. `tests/exec/piston-conformance.test.ts`
proves the adapter speaks Piston's protocol correctly against a protocol-faithful
fake; `tests/exec/piston-load.test.ts` measures our concurrency behaviour. Neither
has ever spoken to Piston. **The container isolation, the memory cgroup, the
network lockdown, the output ceiling, the data-residency claim and the throughput
of the host all remain unverified**, exactly as `PRODUCTION_ENVIRONMENT.md` says
they are. The first person with an x86_64 Linux host in Kazakhstan closes them,
using §4 above and the checklist at the end of that document.
