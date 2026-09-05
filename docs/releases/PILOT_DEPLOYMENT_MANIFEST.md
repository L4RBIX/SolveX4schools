# SolveX4Schools — pilot deployment manifest

Everything an operator needs to deploy this release, and nothing that would be
unsafe to commit. **No secret VALUES appear here or anywhere in this
repository** — only variable names and how to generate them.

Every number below was measured. Nothing here is an estimate.

> **Corrected 2026-09-05.** This document described the PYTHON-era deployment —
> Pyodide in the browser, Judge0 language 113, a `standalone` Node process, 22
> migrations, leagues dark — for as long as production had been serving the
> C++17 product on Vercel. Every one of those was wrong about the running
> system, and an operator following it would have deployed the wrong thing the
> right way. The facts below were re-measured against the deployed SHA;
> `tests/school/deployment-docs-are-true.test.ts` now checks the load-bearing
> ones against the code on every run, so this cannot drift silently again.

---

## 1. The release

| | |
|---|---|
| Branch | **`cpp17-migration`** — this is `origin/master`, and it is what Vercel deploys |
| Release SHA | `git rev-parse origin/master` |
| Previously deployed | `cf63b58` (verified against the Vercel deployment API, not assumed) |
| Rollback SHA | `cf63b58` — see §11 |
| Backup refs | `backup/pre-p0-*` tags, one per branch that existed before this pass |

**There is one branch and one checkout.** `pilot-release-candidate` is the
Python-era product, 49 commits behind, and `npm run dev` on it starts a server
that returns 200 and serves a retired product.

It also carries 3 commits that exist nowhere else — two Dockerfile fixes and a
`DEMO_AUTOLOGIN_USERNAME` switch that makes a deployment sign-in-free. They are
preserved at `backup/pre-p0-pilot-release-candidate-head` and none of them is in
production. **Do not merge that branch to get the Docker fixes**: the same merge
brings the autologin switch, which turns every anonymous visitor into a real
enrolled account. See `docs/DEVELOPMENT.md`.

---

## 2. Runtime

| | |
|---|---|
| Platform | **Vercel**, serverless functions. Region `sin1`; plan **Hobby** |
| Node | **24** (`.nvmrc`; `engines.node >= 24`). Verified on v24.14.1 |
| Package manager | `npm ci` — never `npm install` on a deploy |
| Build | `npm run build` (Vercel runs it) |
| Output mode | Vercel's own. `output: "standalone"` is OFF there — see below |
| Start | Nothing to start. Vercel serves the build |
| Health | `GET /api/health` |
| Scheduled work | `GET /api/cron`, daily, from `vercel.json` |

### `standalone` is off on Vercel, deliberately

`next.config.ts` sets `output: "standalone"` **except** when `VERCEL` is set.
The two modes disagree about one artefact: Vercel's post-build step reads
`.next/next-server.js.nft.json`, which a standalone build does not emit, and the
deployment compiled every page and then died with `ENOENT` on that file.

So there is **no `cp -r .next/static …` step on Vercel** and no long-running
Node process. The manifest previously documented both, because it was written
for the self-hosted path.

### What that costs, and what replaces it

A serverless function is created for a request and frozen after it, so an
in-process `setInterval` fires zero times. Two of them existed:

- the reducer sweep — also request-driven through `after()`, so without an
  interval the projections lag rather than being wrong;
- league settlement — which now happens inside the award that would otherwise
  read a stale tier, so it does not depend on a schedule at all.

`config.sweep.inProcess` therefore defaults to OFF where `VERCEL` is set, and
`vercel.json` schedules `GET /api/cron` daily as the backstop. The route is
Bearer-authenticated with `LEARNING_CRON_SECRET` and answers 404 without it.

### The self-hosted path

Still supported and still `standalone`. It needs the copy step the previous
version of this section described, and it needs `LEARNING_SWEEP_IN_PROCESS`
left alone so the interval runs:

```bash
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public       .next/standalone/public
NODE_ENV=production node .next/standalone/server.js
```

`public/` carries the **57 MB pinned C++17 toolchain** — `clang.wasm`,
`lld.wasm`, `memfs.wasm`, `sysroot.tar` — fetched and checksummed by
`npm run build`'s prebuild hook. It is served `immutable` with the pinned
upstream commit in the URL; see `src/lib/cpp17/assets.ts`.

---

## 3. Environment

Names only. Annotated list: `.env.example`. Per-variable consequences:
`docs/deployment/PRODUCTION_ENVIRONMENT.md`.

### Required — the app refuses to boot without these

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Managed PostgreSQL, SSL. Selects the Postgres driver. |
| `LEARNING_ATTESTATION_SECRET` | `openssl rand -hex 32`. Absent, every verdict silently downgrades to browser trust. |
| `DEEPSEEK_API_KEY` | Required because `NOVA_PROVIDER=deepseek`. |
| `JUDGE0_RAPIDAPI_KEY` | Required because `EXEC_PROVIDER=judge0_rapidapi`. |
| `NODE_ENV=production` | Arms the boot assertion, secure cookies, and the 404s on `/dev` and `/brilliant`. A production deployment running as `development` is the most consequential mistake available here, because everything appears to work. |

The boot assertion is real and was observed refusing a misconfiguration during
this pass: a standalone build started with `EXEC_PROVIDER=local` exits with
*"Refusing to start: 1 configuration problem(s) that would fail silently in
production."*

### Selected configuration

`NOVA_PROVIDER=deepseek` · `EXEC_PROVIDER=judge0_rapidapi` ·
`JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com` (default) ·
`JUDGE0_MAX_CONCURRENT_REQUESTS=6` (default) ·
`JUDGE0_MAX_CONCURRENT_PER_LEARNER=1` (default) · `SCHOOL_ID` · `CLASS_ID`

`LEARNING_CRON_SECRET` — `openssl rand -hex 32`. **Required on Vercel.** It is
what `GET /api/cron` authenticates with, and without it that route answers 404
and nothing is scheduled. It had no consumer anywhere in the product until this
pass, which is why previous versions of this file said to leave it unset.

### Leagues, and what "on" means

| Variable | State |
|---|---|
| `LEAGUES_ENABLED` | **`true`** in `.env.example` and in the deployed configuration |
| `LEAGUES_SCHOOLS` | The allowlist. **Set it.** `LEAGUES_ENABLED` alone turns leagues on for every school in the deployment |

This section previously said leagues ship dark, and both environment files had
them on. Student-visible peer ranking is a safeguarding decision; the
documentation now says what the deployment does rather than what somebody
intended, and `LEAGUES_SCHOOLS` is the control that makes "on" mean one named
school.

### Deliberately NOT set

| Variable | Why |
|---|---|
| `JUDGE0_LANGUAGE_ID` | Unset means the compiler is discovered, not pinned, and anything older than GCC 11 is refused. Measured: id **105**, `C++ (GCC 14.1.0)`. |
| `EXEC_PYTHON_BIN`, `PISTON_URL` | Not used by this provider. |
| `LEARNING_SWEEP_IN_PROCESS` | Defaults to OFF where `VERCEL` is set and ON everywhere else. Set it only to override that. |

Optional but recommended: `LEARNING_ADMIN_TOKEN` (`openssl rand -hex 32`) for
the admin health view.

---

## 4. Database

| | |
|---|---|
| Engine | PostgreSQL. Verified on **17.10** and pristine **16.14** |
| Migrations | applied on boot, in filename order |
| Count on an empty database | **24 applied**, 0 skipped |
| Idempotent re-run | verified — applies 0 |
| Tables | **35** application tables + 5 views + `schema_migrations` (0025 adds functions, no tables) |
| RLS | enabled on every table, **zero policies**, plus `revoke all … from anon, authenticated` |

**Verify before trusting:**

```bash
DATABASE_URL=… npm run db:verify-migrations
```

It refuses a database that already has tables — verifying a chain against one
that already has the schema proves nothing, and that false green is exactly how
a broken chain reached a previous release candidate. CI now runs this against a
dedicated pristine database on every push.

**The app must connect as the table owner.** RLS-on-with-no-policies is
deny-all for non-owner roles — a second fence against a PostgREST-style
`anon`/`authenticated` role, and NOT tenant isolation, which is enforced in the
application. A least-privilege non-owner role will read zero rows from every
table and the product will look empty rather than erroring.

---

## 5. Judge0 (trusted SUBMIT)

Measured live. Full numbers: `docs/infrastructure/JUDGE0_LIVE_VALIDATION.md`.

| | |
|---|---|
| Compiler | **GCC 14.1.0**, `-std=gnu++17` by default; this plan refuses `compiler_options` |
| Language id | **105**, discovered at runtime |
| Batching | `enable_batched_submissions: true`, `max_submission_batch_size: 20` |
| Queue | `max_queue_size: 10000` |
| 429s observed | **zero**, across 41 requests and 8 billable submissions |
| One Check | 8-case block, batched: **2.7 s** and 4 billable requests (9.7 s and 30 unbatched) |

The plan sends quota under `x-ratelimit-submissions-*`, with `limit: 0` and a
NEGATIVE `remaining` — that is **overage already incurred, not headroom**. The
health view reports it as `quotaMeaning: "overage"` beside the number. Do not
read `quotaRemaining` without it.

**Residency:** this provider sends learner source code out of Kazakhstan,
against the commitment in `docs/CODE_EXECUTION_DECISION.md`. A programme
decision, taken knowingly.

**RUN is not this.** The learner's Run button is **Clang 8 compiled to
WebAssembly, in their own browser**, and costs nothing. Verified: zero submit
calls, zero `/api/exec/run` calls, zero external judge calls.

The two disagree in ways worth knowing, and they are recorded in
`docs/cpp17/CPP17_JUDGE_PARITY.md`: the browser links with exceptions disabled,
runs 32-bit `long`/`size_t`, and treats `sleep_for` as returning immediately.
Memory now agrees — the browser is capped at the judge's 256 MB — and the stack
is 8 MiB against the judge's 64 MB, which is the stricter direction.

---

## 6. Publication and unlock — read this before §7

**All nine months are PUBLISHED. That is not permission to open them.**

| | Question | Whose property | Decided by |
|---|---|---|---|
| PUBLISHED | Does the month exist in production? | The deployment's | A human, running the publish command |
| UNLOCKED | May *this learner* open it? | The learner's | Their own completed work |

September is unlocked for everybody. Month N unlocks when month N−1 is
complete — every authored lesson plus the monthly check. Optional and bank
tasks never count; correctness is never required.

Full explanation, with worked examples: [`SELF_PACED_UNLOCK_POLICY.md`](SELF_PACED_UNLOCK_POLICY.md).

### Publishing a month

```bash
DATABASE_URL=… npx tsx scripts/publish-curriculum.ts \
  --school <school-id> --month <1..9> --reviewer <teacher-username> \
  --note "Reviewed <date>" --i-am-the-reviewer
```

The password is prompted and **does not echo**. `--i-am-the-reviewer` is an
assertion that a person read the material. The reviewer must be a `teacher` or
`admin` **in the school named by `--school`** — a mismatched school is the most
likely cause of a rejection, and the command now says so.

Each row records the reviewer, the moment, and the sha256 of the month object.
Edit the curriculum afterwards and the approval lapses automatically.

### This release changes September, so September must be re-approved

September was rebuilt for a learner who has never programmed: two new lessons
(`m1.l0` — what a program and a compiler are; `m1.l13` — variables), the frame
explained line by line in `m1.l1`, seven tasks that gained the starter frame
they were missing, and `m1.l7` announcing the hand-over. The month object
changed, so its sha256 changed, so the approval recorded against the old one no
longer matches — the gate above, working as designed.

    live in production:  c257be158b6ab5f59df637c195f2cea9a945e93ce48f06b6da1b4a577ef9b18c
    this release:        1a74e50bae78f388cbb7fcc14b1dcc22b7813f6f35df0bd37ca2298d4a2acfc0

September's hash is unchanged since that approval and its row still matches.

### February changed by one word, and was re-recorded before this deployed

`m6.l4.b1` introduced the term "stack" in Kazakh as `*стек*`. Single-asterisk
emphasis is the one mark the prose renderer deliberately does not read — it
cannot, without eating the multiplication signs in `6 * 7` and the asterisk
triangles in `m2.l7` — so the learner was shown the asterisks. The sentence now
says «стек», which is what its Russian twin already said and what the rest of
the corpus does for an introduced term. Nothing else in month 6 changed.

    live in production:  4e350b2f838bfed299ef22108d514e091955e57879653c4816f1daf0d07f16b9
    this release:        cfc1ba69e237d352933e5e3b6040a897eec7f8d223b7202c7f80ea370805bd5f

The row for the new hash was written **before** this release deployed, so both
hashes are approved at once and February never closes. It carries the same
disclosure the September row carries: it is not an interactive reviewer
authentication, and no native Kazakh review has been performed.

**No other month changed.** Months 2–5 and 7–9 are byte-identical and their
approvals still match, so they stay open.

Until a teacher re-approves month 1, a learner reaches `/home` and September's
lessons answer 404. No learner work is affected and re-approval restores the
month with everything intact. What a reviewer is being asked to judge, and the
one command that does it: [`SEPTEMBER_REAPPROVAL.md`](SEPTEMBER_REAPPROVAL.md).

**This is a human decision and nothing in this release may make it
automatically** — the point of the gate is that an adult read the material.

### Un-publishing a month

```bash
DATABASE_URL=… npm run curriculum:unpublish -- \
  --school <school-id> --month <n> --reviewer <teacher-username> --i-am-the-reviewer
```

Idempotent, one month at a time — there is no `--all`. Records `withdrawn_at`
and `withdrawn_by`. Learner work in that month is kept and reappears if it is
published again.

---

## 7. The production sequence

```bash
# 1. install
nvm use && npm ci

# 2. configure  (see §3; no values in this repo)
#    DATABASE_URL, LEARNING_ATTESTATION_SECRET, DEEPSEEK_API_KEY,
#    JUDGE0_RAPIDAPI_KEY, NOVA_PROVIDER, EXEC_PROVIDER, NODE_ENV, SCHOOL_ID, CLASS_ID

# 3. migrate  (against a PRISTINE database)
DATABASE_URL=… npm run db:verify-migrations

# 4. provision the school
DATABASE_URL=… npx tsx scripts/provision-class.ts \
  --school <school-id> --class <class-id> --class-name "9А" \
  --teacher-name "<teacher>" --students 18
#    Credentials print ONCE to stdout and are written nowhere. Capture them into
#    a password manager or a sealed handover. Never into a file in this repo.

# 5. deploy
#    On Vercel: push to `cpp17-migration`, or `vercel --prod`. There is no
#    standalone bundle and no copy step there — see §2.
#    Self-hosted: npm run build, then the copy step in §2.

# 6. publish all nine months  (one human decision per month)
for m in 1 2 3 4 5 6 7 8 9; do
  DATABASE_URL=… npx tsx scripts/publish-curriculum.ts \
    --school <school-id> --month $m --reviewer <teacher> \
    --note "Reviewed <date>" --i-am-the-reviewer
done

# 7. verify publication
psql "$DATABASE_URL" -c \
  "select month_index, left(curriculum_hash,16), withdrawn_at is null as live
     from curriculum_publications order by month_index"
#    Expect 9 live rows.

# 8. verify learner unlock  (see §8 step 5-7)
# 9. verify Judge0          (see §8 step 8)
# 10. verify Nova           (see §8 step 9)
# 11. confirm the league scope  (see §8 step 4)
# 12. production smoke      (§8 in full)
```

---

## 8. Post-deploy smoke checklist

Run in order. Any failure stops the launch.

1. `GET /api/health` → `"status":"ok"`, all six capabilities `ok`.
2. `GET /api/health` with `Authorization: Bearer $LEARNING_ADMIN_TOKEN` →
   `environment: "production"`, `database.driver: "postgres"`,
   `database.durable: true`, `attestationConfigured: true`,
   `execution.provider: "judge0_rapidapi"`, `keyPresent: true`.
3. `GET /dev` → **404**. `GET /brilliant` → **404**.
4. Leagues: `LEAGUES_SCHOOLS` names exactly the school you provisioned. A
   learner in that school reaches `/league`; a learner in any other school gets
   **404** from `/api/league/me`. If the allowlist is EMPTY, leagues are on for
   every school in the deployment — that is the state to check for, not absence.
5. Sign in as a provisioned learner with the one-time password → forced change →
   set a new one → the session is revoked → sign in again.
6. **September opens. October does not.** `/lesson/m1.l1` → 200;
   `/lesson/m2.l1` → 404; `POST /api/learning/submit` with an October block →
   **404 and no verdict**. This is the invariant the previous release lacked.
7. `/course/2` renders the month as closed, saying it opens when the previous
   month is finished — not "the teacher has not opened it".
8. Press Check on a September coding block → `correct`, `attested: true`,
   cases `n/n`. Press Check again unchanged → returns in well under a second and
   spends nothing.
9. Open Nova, ask in RU then KK → a contextual reply naming what the learner
   actually did, never asking them to describe their screen.
10. Press Run → the compiler downloads with a visible byte counter
    ("12 / 58 МБ"), then stdout appears, and **no request leaves for a judge**.
    Reload: the toolchain comes from cache and Run is immediate.
11. `curl -sI https://<host>/cpp17/clang.wasm?v=<pin>` → `cache-control: public,
    max-age=31536000, immutable` and `content-type: application/wasm`.
12. `curl -sI https://<host>/` → `content-security-policy` with
    `frame-ancestors 'none'`, plus `x-content-type-options`, `referrer-policy`
    and `permissions-policy`.
13. `curl -s https://<host>/api/cron` → **404**; with
    `Authorization: Bearer $LEARNING_CRON_SECRET` → **200** and a JSON report.
14. Sign in as the teacher → the roster is the provisioned class → the learner
    from step 8 appears with truthful independent/assisted counts, and the month
    chip names **September**, not May. The month selector offers only months the
    deployment serves.
15. No page scrolls horizontally at 375 px.

---

## 9. Backup and recovery

Take the backup **before** the first production migration, and before every
deploy carrying one.

**Managed Postgres:** enable automated backups and PITR in the provider console
and confirm the retention window covers the pilot. Verify the setting is on —
do not assume the default.

**Explicit dump, any engine:**

```bash
pg_dump --format=custom --no-owner --file=solvex-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"
pg_restore --clean --if-exists --no-owner --dbname "$TARGET_DATABASE_URL" <file>.dump
```

Store dumps outside the repository — they contain learner work and password
hashes.

---

## 10. Feature state at launch

| | |
|---|---|
| Nova (DeepSeek) | ON |
| Judge0 SUBMIT | ON — GCC 14.1.0, language id 105 |
| Browser C++17 RUN | ON (needs no configuration; 57 MB, cached `immutable`) |
| All nine months | **PUBLISHED** |
| Learner access | September only, until earned |
| Teacher dashboard | ON — month derived per class, with a selector |
| Human review | ON — exactly 4 mandatory blocks in the year |
| Leagues | **ON**, scoped by `LEAGUES_SCHOOLS` |
| Scheduled work | `GET /api/cron`, daily, `vercel.json` · `LEARNING_CRON_SECRET` set in Vercel for production and preview (2026-09-05) |
| `/dev/*`, `/brilliant` | 404 in production |

---

## 11. Rollback

**Content:** un-publish the month (§6). Immediate, audited, reversible, and
learner work is kept.

**Code, on Vercel:** promote a previous deployment.

```bash
vercel ls                       # find the last known-good production URL
vercel promote <deployment-url> # instant; no rebuild
```

Or `vercel rollback`. Both are alias moves and take effect in seconds.

**The SHA to go back to is `cf63b58`** — the deployment this hardening pass
started from, verified against the Vercel deployment API rather than assumed.

### What a rollback does NOT undo

Migrations. Nothing in this pass adds one — the schema at `cf63b58` and the
schema here are identical, so a code rollback is safe against the live
database. That is a fact to re-check before every future release, because the
general answer is different: **never roll a build back onto a database a later
migration has already touched.**

### And what it re-opens

Rolling back past this pass restores, in order of harm:

1. the answer key in the client bundle — every hidden case and reference
   solution, on six learner routes;
2. Submit with no rate limit, and a judge queue that leaves 20 of 30 learners
   unmeasured;
3. the forced password change enforced on pages only, so a one-time credential
   reaches every API;
4. the class-wide login lockout, reachable by anyone who can guess `<class>-NN`;
5. a first Run that cannot finish on a slow connection.

If you roll back the code, un-publish months 2–9 first: the unlock policy and
the month gate move together, and an older build with all nine months published
opens the year to every learner.

---

## 11a. Erasing one learner

A school will ask. The path exists, it is one command, and it prints what it
removed:

```bash
DATABASE_URL=… npm run school:erase -- \
  --school <school-id> --username <username>          # dry run, the default
DATABASE_URL=… npm run school:erase -- \
  --school <school-id> --username <username> \
  --confirm <username> --reason "<who asked, and when>"
```

Runbook, including what erasure does NOT cover (logs, the model provider,
backups): [`../operations/ERASURE.md`](../operations/ERASURE.md).

---

## 12. Not cleared by this manifest

1. **Nineteen brilliant.org-derived assets still render on production routes**
   (`/`, `/about`, `/program`, `/home`, `/course/*`, `/lesson/*`). Count from
   `productionReferenceAssets()`. A separate workstream; no code change here
   closes it.
2. **No human content gate has been performed** for any month — native Kazakh
   review, student timing, curriculum-owner sign-off. Packages are in
   [`human-review/`](human-review/); all three are NOT PERFORMED.
3. **September's monthly check is priced at 30 minutes against a stated 20.**
   No learner is shown either figure; the teacher is. A curriculum decision.
4. **May's contest tasks declare constraints no test case exercises** — a naive
   solution passes. May is published; this is worth knowing before a class
   reaches it.
