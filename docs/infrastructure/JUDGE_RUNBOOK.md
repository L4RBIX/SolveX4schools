# Judge Runbook

For whoever is on call for the code judge. Written to be read in a hurry, while a
class is waiting.

Everything here is a command you can run or a decision you can make. To stand the
judge up in the first place, see `JUDGE_DEPLOYMENT.md` beside this file; for the
application's environment variables and the sizing arithmetic, see
`docs/deployment/PRODUCTION_ENVIRONMENT.md`.

## The one thing to know before anything else

**A dead judge does not mark anybody wrong.** When the judge does not answer, the
submit route leaves the verdict `unknown`, and `unknown` is never scored as a
failure anywhere in this product. Learners are told their answer is saved but not
yet checked, and that is true.

So a judge outage is **urgent, not an emergency**. The lesson continues:
predictions, tracing, bug-finding, multiple choice and the written blocks all
still grade. What is lost is the code evidence for that period, and the monthly
assessment — which cannot complete without a judge, by design, because a
completed check with no evidence would be a lie in a school record.

Tell the teacher. Then fix it.

---

## Deployment

One command, and it is in `JUDGE_DEPLOYMENT.md` §4.3 — do not retype it from
memory. The flags that get dropped when someone does are `--tmpfs
/piston/jobs:exec` (every job then fails at launch and the whole class looks like
it wrote broken programs) and `-v /srv/piston:/piston` (the container comes back
with no Python installed and every submission goes unmeasured, silently).

After any deploy, always:

```
curl -s http://127.0.0.1:2000/api/v2/runtimes | jq
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
  'https://<app-host>/api/health?probe=1' | jq '.execution'
```

The first says Python is installed. The second says the application can reach it
and get a `1` back. Neither on its own is enough.

## Environment

### On the judge host

Set on the container, in `JUDGE_DEPLOYMENT.md` §4.3. Four matter:

| Setting | Value | If it is wrong |
|---|---|---|
| `PISTON_MAX_CONCURRENT_JOBS` | 48 | Lower, and jobs queue. Our fetch ceiling is 10 s, so anything queued past it returns `provider_timeout` and the learner is silently unmeasured |
| `PISTON_OUTPUT_MAX_SIZE` | ≥ 65536 | Piston enforces its limit with SIGKILL, and this adapter reads SIGKILL as `time_limit_exceeded`. A correct but chatty program is then recorded as the learner's algorithm being too slow. **This one corrupts evidence rather than breaking anything** |
| `PISTON_RUN_TIMEOUT` | ≥ 5000 | A cap below the per-request 5000 ms turns every genuine learner timeout into a judge that answered early, and December is the month that is entirely about program speed |
| `PISTON_DISABLE_NETWORKING` | true | A sandbox with a network is not a sandbox |

**None of these is a secret.** Nothing on the judge host is. If you find yourself
putting a credential in a `PISTON_*` variable, stop and read §6 of the deployment
document.

### On the application host

`EXEC_PROVIDER=piston` and `PISTON_URL` (no trailing slash — the adapter appends
`/api/v2/execute`). The application refuses to boot in production without both,
deliberately. `PRODUCTION_ENVIRONMENT.md` is the authority; do not maintain a
second copy of that table here.

## The Python runtime

**Pinned at one version, declared in one file:**
`schools/execution/python-policy.ts` → `PYTHON_RUNTIME.version`.

The application asks for the range `3.*` on every execute call, and the judge has
exactly one Python installed, so the range can only resolve to the pin. That is
why a patch-level rebuild of the judge is a rebuild and not an outage.

**Standard library only. No third-party packages**, and it is enforced by absence
— the judge has no network and nothing but CPython on it. A request to add one
goes through the four gates in that same file (curriculum need, security review,
runtime reproducibility, version pinning); all four are required and the standing
year-one answer is no.

To check what is installed:

```
curl -s http://127.0.0.1:2000/api/v2/runtimes | jq
```

To install (only ever the pinned version):

```
curl -s -X POST http://127.0.0.1:2000/api/v2/packages \
  -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"3.12.0"}' | jq
```

If that version is not offered by your Piston's package index, **do not quietly
install a neighbour.** Change the pin in the code, commit it, redeploy the app.
The number in the file has to be the number on the judge, or the reproducibility
claim is decoration.

## Restart

```
sudo docker restart piston_api
curl -s http://127.0.0.1:2000/api/v2/runtimes | jq     # never skip this
```

In-flight jobs are dropped. Those submissions settle as unmeasured — the honest
outcome, and the reason to restart between lessons rather than during one.

If a restart does not fix it, do **not** immediately `docker rm` and recreate:
that is how the bind mount gets forgotten and the judge comes back healthy with
zero runtimes. Read the logs first.

## Health check

Three levels, cheapest first.

**Is the container up?**
```
sudo docker ps --filter name=piston_api
```

**Does the judge itself answer?**
```
curl -s -m 5 http://127.0.0.1:2000/api/v2/runtimes | jq
```

**Does the application get a right answer out of it?**
```
curl -s -H "Authorization: Bearer $LEARNING_ADMIN_TOKEN" \
  'https://<app-host>/api/health?probe=1' | jq '.execution'
```

Look for `probeOk: true` and a sane `probeMs`. The probe is admin-only and
opt-in because it puts a real submission through a judge sized for eighteen
students — **do not point a 30-second monitor at `probe=1`.** Point the monitor
at `/api/health` (no probe), which returns 200 when everything is `ok` and 503
otherwise, including `degraded`.

The teacher-facing `/api/health` view says "code checking is temporarily
unavailable; nobody is being marked wrong" and deliberately contains no provider
name, hostname or variable name. If a teacher reads you something that looks like
`provider_error` or `PISTON_URL`, that is a bug on our side, not a diagnosis —
report it.

## Load test

Do this **once**, before the first lesson, on a judge nobody is using. It answers
the question the health probe cannot: is it fast enough for a whole class at
once.

```
seq 1 36 | xargs -P 36 -I{} curl -s -o /dev/null -w '%{http_code} %{time_total}\n' \
  -X POST http://127.0.0.1:2000/api/v2/execute \
  -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"3.*","files":[{"name":"main.py","content":"a,b=map(int,input().split())\nprint(a//b, a%b)"}],"stdin":"17 5\n","run_timeout":5000,"run_memory_limit":268435456}'
```

**36, not 18.** Peak concurrency is `2N`, not `N`: Run and Submit share the judge
and neither waits for the other, so a lesson where half the class experiments
while the other half submits peaks at twice the class size. A judge tuned for
"18 students" is tuned for the wrong 18.

Read the output:

- **Every line `200`.** A single non-200 under load means jobs are being rejected
  or queued past the limit, and in the product that is a learner going unmeasured.
- **Every `time_total` under 10 s**, with margin. Ten seconds is our hard ceiling
  (`run_timeout` 5000 ms + 5000 ms of fetch patience); anything close to it will
  cross it on a bad day.
- **Under ~1 s each is comfortable.** Over ~2 s, a four-case submit makes a
  learner wait eight seconds and they will press the button again.

A submission costs the learner `cases × latency` of waiting, because cases run
serially — one learner's four-case submit is one execution in flight, not four.
September's practice blocks carry 3–4 cases; the monthly check carries nine
across two problems.

## Logs

```
sudo docker logs --tail 200 -f piston_api
```

What to look for:

| In the log | What it means |
|---|---|
| `clone failed: Invalid argument` at start-up | The sandbox cannot create namespaces. Almost always the wrong architecture or a missing `--privileged`. See the failure section of `JUDGE_DEPLOYMENT.md` |
| Job errors mentioning permission or exec on `/piston/jobs` | The tmpfs is mounted `noexec`. Every job fails; the product reports a class of broken programs |
| Nothing at all while the app reports failures | The app is not reaching this container. Network, not Piston |

**Learner source code is not in these logs and must not be put there.** Turning up
Piston's log verbosity to debug what a submission did means writing children's
schoolwork to a file nobody has a retention policy for. If you need to reproduce
a submission, do it with the learner's block id against a scratch judge.

On the application side, the counters `exec.requests`, `exec.infra_failures` and
`exec.learner_errors` are in the admin health payload. `infra_failures` is the
judge failing; `learner_errors` is programs crashing, which is Tuesday, not an
outage. Never page on the second.

## Failure recovery

Work down this list. Stop at the first thing that is wrong.

| Symptom | Check | Action |
|---|---|---|
| Every code task unmeasured, app reports the judge unreachable | `docker ps` | Container down → `docker start piston_api`, then check runtimes |
| Judge answers `/runtimes` with `[]` | Bind mount | The container was recreated without `-v /srv/piston:/piston`. Recreate it correctly (deployment §4.3), reinstall the pinned Python |
| Every execute returns 400 | `/api/v2/runtimes` | No python matching `3.*`. Reinstall the pinned version |
| Every job fails as a runtime error, trivially wrong programs included | `--tmpfs ... :exec` | The tmpfs is `noexec`. Recreate the container with the flag. **Until you do, the evidence being recorded is wrong**, not just missing |
| Correct-but-chatty programs recorded as too slow | `PISTON_OUTPUT_MAX_SIZE` | Below 65536. Raise it and restart. Affected submissions should be re-run with the learner |
| Intermittent `provider_timeout` under load | Load test above | Concurrency limit or an undersized host. Raise `MAX_CONCURRENT_JOBS`, or add CPU |
| App healthy, judge healthy, still unreachable | Firewall / private network | §6 of the deployment document |
| Nothing above fits | `docker logs` | Escalate with the log, not with a summary of it |

**Recovering the lost work.** A learner whose submission went unmeasured still
has their code saved — it was graded and recorded as `unknown`, not lost. Re-run
the block with them when the judge is back. There is nothing to replay
server-side and no batch job to run; the ledger has no false entries to undo,
because the failure mode is always missing evidence and never false evidence.

**Do not add a retry.** Nothing in the execution path retries, and that is
deliberate. Retrying an *execution* would be harmless; retrying a *submission*
would not, and the two are one HTTP call apart — see the "no retries" section of
`PRODUCTION_ENVIRONMENT.md` before touching this.

## Upgrade

Never during a lesson. Between lessons at the earliest, out of hours by
preference.

1. **Note the current image digest**, so rollback is a command and not an
   archaeology exercise:
   ```
   sudo docker inspect --format '{{index .RepoDigests 0}}' piston_api
   ```
   Write it down. Somewhere that is not this terminal.
2. Pull, recreate, reinstall, verify:
   ```
   sudo docker pull ghcr.io/engineer-man/piston
   sudo docker stop piston_api && sudo docker rm piston_api
   # re-run the exact invocation from JUDGE_DEPLOYMENT.md §4.3
   curl -s http://127.0.0.1:2000/api/v2/runtimes | jq
   ```
   The package directory is on the bind mount and should survive. **Check
   anyway** — this is the single most common way to end up with a healthy judge
   that has no Python.
3. **VERIFY the three behaviours an upgrade can silently change**, because they
   are configuration defaults and a new image can ship new ones:
   - `OUTPUT_MAX_SIZE` is still ≥ 65536 (`docker logs` prints the loaded config
     at start-up)
   - a program that prints ~60 KB comes back whole rather than SIGKILLed
   - a deliberate `while True: pass` still comes back as a kill at ~5 s, not at
     some new default
4. Run the load test.
5. Then `/api/health?probe=1` from the application.

If the upgrade changes the available Python packages, the pin in
`schools/execution/python-policy.ts` changes with it — in a commit, before the
judge is upgraded, not after.

## Rollback

```
sudo docker stop piston_api && sudo docker rm piston_api
# same invocation as §4.3, with the digest you wrote down:
#   ghcr.io/engineer-man/piston@sha256:<digest>
curl -s http://127.0.0.1:2000/api/v2/runtimes | jq
```

Then reinstall the pinned Python if `/runtimes` is empty, and re-verify with
`/api/health?probe=1`.

**Rolling back the judge does not require rolling back the application**, and
usually should not. The adapter speaks a stable protocol and the version on the
wire is a range; a judge rollback is invisible to the app as long as a python
matching `3.*` is installed. The exception is if you changed the pin: roll that
commit back too, or the file and the judge now disagree about which interpreter
produced this month's evidence.

---

## Things that are true and worth knowing at 3am

- **The judge never marks anyone wrong.** Every failure mode here produces
  missing evidence, never false evidence. The one exception is a misconfigured
  `OUTPUT_MAX_SIZE`, which turns a chatty correct program into a recorded
  timeout — which is why it has a row in three tables in this document.
- **`time_limit_exceeded` and `provider_timeout` are different facts.** The first
  is the learner's program being too slow, which is real evidence about an
  algorithm. The second is the judge not answering, which says nothing about
  anybody. The code keeps them apart end to end; keep them apart when you talk
  about them too.
- **A teacher never sees a provider string.** Not `provider_error`, not an HTTP
  status, not a container id. If one reaches a classroom, that is a defect —
  `schools/presentation/teacher-outcome.ts` and
  `tests/school/teacher-language.test.ts` exist to prevent it.
- **`/api/learning/submit` has no rate limit.** One learner in a loop can
  generate unbounded judge load. Acceptable for a supervised pilot of 18;
  not acceptable at school scale.
- **The judge holds children's writing.** Their source code is authored by them
  and is the closest thing here to schoolwork, which is why the host is in
  Kazakhstan and why nothing on it should be logged casually.
- **None of this has been proven against a real Piston.** Every procedure in this
  runbook is written from the protocol and from Piston's documentation, not from
  an instance anyone has operated. The first person to run it should correct it.
