# SolveX4Schools — pilot deployment manifest

Everything an operator needs to deploy this release, and nothing that would be
unsafe to commit. **No secret VALUES appear here or anywhere in this
repository** — only variable names and how to generate them.

Produced by the final production-acceptance pass. Every number in the
"measured" column was observed against the real service or a real database
during that pass; nothing here is an estimate.

---

## 1. The release

| | |
|---|---|
| Branch | `pilot-release-candidate` |
| Base SHA (integration complete) | `41d9bb428875dfb5d7b3c6d52564b8fad37a19b1` |
| Acceptance commit | `fe48ab770f265ad956cf1510525ce156ca2de8f6` — "Four gates that only fail against the real thing" |
| Release SHA | this commit (the manifest cannot name its own hash; `git rev-parse HEAD`) |
| Release tag | see §12 — **not tagged while a blocker is open** |
| Rollback SHA | `41d9bb428875dfb5d7b3c6d52564b8fad37a19b1` |
| Backup ref | `refs/backup/pre-final-launch-20260831` |

The rollback SHA is the pre-acceptance integration commit. It is **not a
safe production target on its own**: it carries the migration defect in §11,
so rolling the code back to it is only correct on a database that has already
been migrated. See §11 before using it.

---

## 2. Runtime

| | |
|---|---|
| Node | **24** (`.nvmrc`; `engines.node >= 24`). Verified on v24.14.1 |
| Package manager | `npm ci` — never `npm install` on a deploy |
| Build | `npm run build` |
| Output mode | `standalone` (`next.config.ts`), i.e. a long-running Node process |
| Start | `node .next/standalone/server.js` |
| Health | `GET /api/health` |

`output: "standalone"` is load-bearing rather than an optimisation: the reducer
runs on an in-process interval and the store may be an on-disk database, and
both need a process that stays alive. **Do not deploy this to a
request-scoped serverless runtime without first wiring an external cron to
`POST /api/learning/reduce`** — every teacher projection freezes at its last
sweep otherwise, silently.

### The standalone copy step, which is easy to miss

Next does not copy static assets into the standalone bundle. Without these two
lines the app boots and serves unstyled HTML with no Pyodide:

```bash
npm ci
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public       .next/standalone/public
NODE_ENV=production node .next/standalone/server.js
```

`public/` carries the ~9.6 MB Pyodide wasm and the Python stdlib. `npm run
build` regenerates them via its `prebuild` hook; a fresh checkout that skips
the build will not have them.

---

## 3. Environment

Names only. The authoritative annotated list is `.env.example`; the per-variable
consequences are `docs/deployment/PRODUCTION_ENVIRONMENT.md`.

### Required — the app refuses to boot without these

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Managed PostgreSQL, SSL. Selects the Postgres driver; absent, the app uses on-disk PGlite and loses everything on redeploy. |
| `LEARNING_ATTESTATION_SECRET` | `openssl rand -hex 32`. Signer and verifier hold the same value. Absent, every verdict silently downgrades to browser trust. Rotating it invalidates every attestation issued before the rotation. |
| `DEEPSEEK_API_KEY` | Required because `NOVA_PROVIDER=deepseek`. |
| `JUDGE0_RAPIDAPI_KEY` | Required because `EXEC_PROVIDER=judge0_rapidapi`. |
| `NODE_ENV=production` | Arms the boot assertion, the secure cookie flags, and the 404s on `/dev` and `/brilliant`. A production deployment running as `development` is the most consequential mistake available here, because everything appears to work. |

### Selected configuration

| Variable | Value |
|---|---|
| `NOVA_PROVIDER` | `deepseek` |
| `EXEC_PROVIDER` | `judge0_rapidapi` |
| `JUDGE0_RAPIDAPI_HOST` | `judge0-ce.p.rapidapi.com` (default) |
| `JUDGE0_RAPIDAPI_BASE_URL` | `https://judge0-ce.p.rapidapi.com` (default) |
| `JUDGE0_MAX_CONCURRENT_REQUESTS` | `2` (default) |
| `SCHOOL_ID` | the pilot school id |
| `CLASS_ID` | the pilot class id |

### Deliberately NOT set

| Variable | Why |
|---|---|
| `LEAGUES_ENABLED` | Leagues ship dark. Student-visible peer ranking needs explicit product/safeguarding authorisation, which has not been given. Unset means `/league` is unreachable, no nav entry, no XP written, and no settlement interval started. |
| `JUDGE0_LANGUAGE_ID` | Unset means the interpreter is discovered, not pinned. See §5. |
| `EXEC_PYTHON_BIN`, `PISTON_URL` | Not used by this provider. |

### Optional but recommended

`LEARNING_ADMIN_TOKEN` (`openssl rand -hex 32`) — the machine door to the admin
health view, for an uptime monitor that has no session and should hold no
password. Absent, that view is reachable only by a signed-in admin, which is the
safe direction to fail.

---

## 4. Database

| | |
|---|---|
| Engine | PostgreSQL. Verified on **17.10** and **16.14** |
| Driver | `pg`, pooled, selected by the presence of `DATABASE_URL` |
| Migrations | `database/migrations/*.sql`, applied in filename order on boot |
| Count on an empty database | **22 applied**, 0 skipped |
| Idempotent re-run | verified — applies 0 |
| Tables created | 34 application tables + `schema_migrations` |
| RLS | enabled on every application table, **zero policies**, plus `revoke all … from anon, authenticated` |

### What the RLS posture does and does not do

RLS-on-with-no-policies is deny-all for any non-owner role, and the app connects
as the owner, which bypasses it. So it is a **second fence** against a
PostgREST-style anon/authenticated role reaching the tables directly — the
Supabase failure mode — and it is **not** tenant isolation. All cross-school
isolation is enforced in the application, at the route and query layer.

Consequence for deployment: **the app must connect as the table owner.** A
least-privilege non-owner role will read zero rows from every table and the
product will appear empty rather than erroring.

### Migrations run on boot

There is no separate migrate command. The first request after a deploy opens the
store, which migrates. To migrate ahead of traffic, hit `GET /api/health` once.

`scripts/provision-class.ts` also applies any missing migrations, so provisioning
a brand-new database is one command rather than three.

---

## 5. Judge0 (trusted SUBMIT)

Measured live against `judge0-ce.p.rapidapi.com` on 2026-08-30. Full numbers in
`docs/infrastructure/JUDGE0_LIVE_VALIDATION.md`.

| | |
|---|---|
| Python | **3.14.0**, confirmed from `sys.version`, not the catalogue label |
| Language id | **113**, discovered at runtime and cached, not pinned |
| Conformance | **11 / 11** |
| September parity | **25 / 25** |
| Sandbox | network **closed**, filesystem **closed**, `os.environ` **closed**; tempfile and subprocess **open** |
| `enable_network` | `false` |
| Plan ceilings | every limit the adapter sends is inside the plan's maximum — no silent clamping |
| One Check, measured through the product | ~**6.2 s**, 6 hidden cases = 6 billable submissions |

**Residency.** This provider sends learner source code out of Kazakhstan, against
the commitment recorded in `docs/CODE_EXECUTION_DECISION.md`. That is a programme
decision, taken knowingly, and no measurement changes it.

**RUN is not this.** The learner's Run button is Pyodide in their own browser and
costs nothing. Verified in a real browser: Run makes no call to `/api/learning/submit`,
no call to `/api/exec/run`, and no external judge0/rapidapi call — repeatedly.

---

## 6. Publication state for launch day

| Month | State |
|---|---|
| September | **PUBLISHED** |
| October – May | technically ready, **UNPUBLISHED** |

Publication is a row in `curriculum_publications` carrying the reviewer, the
moment, and the **sha256 of the exact month object approved**. Editing the
curriculum afterwards changes the hash, the approval stops matching, and the gate
closes — a review cannot silently outlive the content it reviewed.

### Publishing a month

```bash
DATABASE_URL=… npx tsx scripts/publish-curriculum.ts \
  --school <school-id> --month <1..9> --reviewer <teacher-username> \
  --note "Reviewed <date>" --i-am-the-reviewer
```

The password is prompted, never passed as a flag. `--i-am-the-reviewer` is an
assertion that a person read the material; the command refuses to run without it.
The reviewer must be a `teacher` or `admin` **in the school named by `--school`**
— a mismatched school is the most likely reason for "credentials rejected".

### Un-publishing a month

**There is no command.** `withdrawCurriculum()` exists in the store and is
tested, but nothing operator-facing calls it. Until that gap is closed the
rollback is hand-written SQL:

```sql
update curriculum_publications
   set withdrawn_at = now(),
       withdrawn_by = (select user_id from school_accounts
                        where school_id = '<school-id>' and username = '<reviewer>')
 where month_index = <n> and withdrawn_at is null;
```

Verified working. Learners are served only published months, so this closes the
month at the next request.

---

## 7. Pilot provisioning

```bash
DATABASE_URL=… npx tsx scripts/provision-class.ts \
  --school <school-id> --class <class-id> --class-name "9А" \
  --teacher-name "<teacher>" --students 18
```

Creates the school, the class, one teacher and N students; applies any missing
migrations first. Every account is created with `must_change_password`, so the
printed value is a one-time code a teacher reads out, not a password anyone keeps.

**Credentials are printed to stdout once and written nowhere.** Capture them into
a password manager or a sealed handover, never into a file in this repository.
Do not commit them, paste them into a ticket, or include them in a report.

Measured: 300 accounts in ~43 s (password hashing dominates, deliberately).

---

## 8. Feature state at launch

| | |
|---|---|
| Nova (DeepSeek) | ON |
| Judge0 SUBMIT | ON |
| Pyodide RUN | ON (needs no configuration) |
| Teacher dashboard | ON |
| Human review | ON |
| Leagues | **OFF** |
| `/dev/*` routes | 404 in production — verified |
| `/brilliant` baseline | 404 in production — verified |
| Development publication bypass | off — teacher payload reports `bypassedForDevelopment: false` |

---

## 9. Backup and recovery

Take the backup **before** the first production migration, and before every
subsequent deploy that carries a migration.

**Managed Postgres (Supabase, RDS, Neon):** enable automated daily backups and
point-in-time recovery in the provider console, and confirm the retention window
covers the pilot. PITR is what turns "we lost this morning" into "we lost four
minutes". Verify the setting is on — do not assume the default.

**Explicit dump, on any engine:**

```bash
pg_dump --format=custom --no-owner --file=solvex-$(date +%Y%m%d-%H%M).dump "$DATABASE_URL"
pg_restore --clean --if-exists --no-owner --dbname "$TARGET_DATABASE_URL" <file>.dump
```

Expected recovery point: the moment of the dump, or the PITR window for a managed
engine. Store dumps outside the repository — they contain learner work and
password hashes.

---

## 10. Post-deploy smoke checklist

Run in order. Any failure stops the launch.

1. `GET /api/health` → `"status":"ok"`, all six capabilities `ok`.
2. `GET /api/health` with `Authorization: Bearer $LEARNING_ADMIN_TOKEN` →
   `environment: "production"`, `database.driver: "postgres"`,
   `database.durable: true`, `attestationConfigured: true`,
   `execution.provider: "judge0_rapidapi"`, `keyPresent: true`.
3. `GET /dev` → **404**. `GET /brilliant` → **404**.
4. `GET /league` → unreachable. `GET /api/league/me` → **401**.
5. Sign in as a provisioned learner with the one-time password → forced password
   change → set a new one → the session is revoked → sign in again.
6. Open a September lesson. Answer one MCQ wrong → truthful feedback, learner can
   continue. Answer it right → `correct`.
7. Open a coding block. Press Run → stdout appears from the browser interpreter,
   and no request leaves for a judge.
8. Press Check on a coding block → `correct`, `attested: true`, cases `n/n`.
   Press Check again unchanged → returns in well under a second and spends nothing.
9. Open Nova and ask a question in RU, then in KK → a contextual reply that names
   what the learner actually did, and never asks them to describe their screen.
10. Sign in as the teacher → the roster is the provisioned class → the learner
    from step 6 appears with truthful independent/assisted counts.
11. Confirm no page scrolls horizontally at 375 px.

---

## 11. Known blocker carried by the rollback target

`41d9bb4` — the rollback SHA — **cannot migrate a fresh non-Supabase PostgreSQL.**
`schools/store/migrate.ts` skipped `0000_bootstrap_local.sql` on the Postgres
path, so `anon` / `authenticated` / `service_role` were never created, and twelve
later migrations that `revoke … from anon, authenticated` failed. Measured on a
pristine PostgreSQL 16.14: migration 0003 dies with `role "anon" does not exist`,
1 of 21 applied, one table, no product.

Fixed on the acceptance commit; regression test in `tests/store/migrate.test.ts`
("applies the whole chain the way production calls it, with no Supabase roles
present").

**Therefore:** roll the code back to `41d9bb4` only on a database that has already
been migrated by the fixed build. Never point `41d9bb4` at an empty database.

---

## 12. Tagging

`v0.1.0-pilot` is to be created **only** when every blocking gate is green and
the tree is clean, on the acceptance commit, with `git tag -a`. Do not
force-push. Do not deploy automatically: no hosting target has been authorised
for this release, so the deliverable is a validated artifact plus the
requirements above, not a running deployment.

**NOT TAGGED.** Blockers remain and they are named in the acceptance report:

1. **Nineteen brilliant.org reference assets still render on production routes**
   — `/`, `/about`, `/program`, `/home`, `/course/*`, `/lesson/*`. Count read
   from `productionReferenceAssets()`, not remembered. `schools/assets/registry.ts`
   states the problem in its own words: "Downloading a competitor's assets to
   measure a design is legitimate; serving them from a product a school pays for
   is redistribution." No code change fixes this — it needs commissioned art.
2. **No human content gate has been performed** for any month: native Kazakh
   review, student timing validation, and curriculum-owner sign-off are all
   NOT PERFORMED. Nothing automated can substitute for them and nothing here
   claims to.
3. **September's monthly check is priced at 30 minutes against the 20 it tells
   the learner** — a 50% overrun, on the one month that ships. A curriculum
   decision, not a code defect.
4. **Two September tasks require constructs September never teaches**
   (`m1.p8` needs `abs()` and an unshown float literal; `m1.l6.b3s` asks the
   SUPPORT route for `!=`). Worst on the support route, which carries the
   learners least able to absorb it.
5. **No operator-facing way to un-publish a month.** `withdrawCurriculum()`
   exists and is tested; nothing calls it. Rollback is the hand-written SQL in
   §6 until that is closed.

Every one of those is a decision for the curriculum owner or a commissioning
budget. None is a defect this pass could close by editing code, and none should
be closed by anyone pretending otherwise.
