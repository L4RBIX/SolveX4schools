# Where to run SolveX

```
git switch cpp17-migration        # the deployed product; see below
npm ci
npm run dev
```

http://localhost:3000

## The one thing this file exists to say

**`cpp17-migration` is the product.** It is `origin/master`, it is what Vercel
deploys, and it is the only branch a change should be made on.

`pilot-release-candidate` is not. It is the Python-era product, **49 commits
behind**, and `npm run dev` on it starts a server, returns 200, and serves a
retired product. Nothing about that looks broken, which is what makes it the
worst available failure: a previous audit spent its first hour reading it.

It is not simply an old copy, though, and the difference matters before anybody
deletes it. It carries **3 commits that exist nowhere else**:

| Commit | What it is |
|---|---|
| `fedf979` | Three fixes to the Dockerfile and `.dockerignore` — the self-hosted build path, which cannot run without them |
| `7d88cc9` | Cache mounts in the Dockerfile, made portable |
| `cda6673` | `DEMO_AUTOLOGIN_USERNAME` — a deployment with no sign-in at all |

They are preserved at `backup/pre-p0-pilot-release-candidate-head`. None has
been ported to `cpp17-migration` by this pass, and the third should not be
without a decision: set, `DEMO_AUTOLOGIN_USERNAME` makes every anonymous
visitor a real enrolled account with that account's class and work. It is
unset by default and is absent from the deployed branch, so it is not in
production — and it must not arrive there by a merge nobody read.

Verify rather than trust this paragraph:

```
git rev-parse --abbrev-ref HEAD                     # expect cpp17-migration
git rev-list --left-right --count origin/master...HEAD
#   0<TAB>N   → you are N ahead, nothing behind. Good.
#   M<TAB>0   → you are M BEHIND and have no unique work. Wrong branch.
```

`npm run dev` prints the same answer at startup — see `scripts/check-branch.mjs`,
which `predev` runs. It does not refuse to start: a feature branch is a normal
thing to be on. It says loudly which branch you are on and how far behind
`origin/master` it is, because the failure this replaces was silent.

## The canonical checkout

| | |
|---|---|
| Path | `/Users/kydyrbekbekarys/SolveX4schools` |
| Branch | **`cpp17-migration`** (= `origin/master` = deployed) |
| Default port | 3000 |
| Database | `postgres://localhost/solvex_dev` |
| Config | `.env.local` (gitignored, never committed) |

`npm run dev` runs `predev`, which fetches and checksums the 57 MB pinned C++17
toolchain into `public/cpp17/` and builds the worker. Both are generated and
gitignored; you do not need to run them by hand. The first run downloads;
later ones do not.

### Worktrees

`.claude/worktrees/*` are working copies of the same repository on other
branches. They are for parallel work, not for a second source of truth: a path
under `.claude/worktrees/` in a command is either historical or a deliberate
exception, and a document that names one as canonical is wrong.

## Database

Development uses a **local PostgreSQL** database named `solvex_dev`.

Not PGlite. PGlite holds a single-writer lock and hands a second process a stale
snapshot rather than an error, so anything that seeds from outside the server —
E2E harnesses, provisioning scripts, a `psql` session — silently disagrees with
what the app sees.

Do not point `DATABASE_URL` at any of these, whatever a shell history suggests:

| Database | What it is |
|---|---|
| `solvex_e2e` | wiped by the browser E2E harness |
| `solvex_league_e2e` | wiped by the League harness |
| `solvex_nova`, `solvex_sim`, `solvex_pilot*` | one-off verification runs |
| `solvex_fresh_*`, `solvex_release_*`, `solvex_ped_*` | throwaway migration gates |
| `solvex_dev_archive_20260831` | the pre-canonical dev database, kept for reference |

Migrations apply themselves. `schools/store` runs the chain when it first opens
a connection, which is what the server does at boot — so starting the app is
the migration path, and there is no separate migrate command to forget.

To verify the chain from zero against a database that has never seen it:

```
createdb solvex_scratch
DATABASE_URL=postgres://localhost/solvex_scratch npm run db:verify-migrations
dropdb solvex_scratch
```

That gate **requires a pristine database** and refuses a populated one on
purpose: a chain "verified" against a database that already had the tables
proves nothing.

## Provisioning a local class

A fresh database has no school, no class and no accounts, so nobody can log in.

```
npm run school:provision -- \
  --school innovation-tech --class grade-9a --class-name "9А" \
  --teacher-name "<name>" --students 18
```

One-time passwords print to stdout **once** and are written nowhere. Every
account is created with `must_change_password`, so what prints is a code a
teacher reads out, not a password anyone keeps. Do not redirect that output into
the repository.

Then tell the app which school it is serving, in `.env.local`:

```
SCHOOL_ID=innovation-tech
CLASS_ID=grade-9a
```

Without those the login form defaults to `pilot-school` and every credential is
rejected as invalid — which looks like a bad password and is not.

## Publication

Publishing is separate from unlocking, and both are separate from authoring.

- **Authored** — the month exists in `schools/curriculum/`.
- **Published** — a human ran the publish command with their own credentials.
  Students can only ever reach published content.
- **Unlocked** — that individual learner has earned the month. Server-owned,
  per learner, and unrelated to the calendar.

```
npm run curriculum:publish -- \
  --school innovation-tech --month 1 --reviewer grade-9a-teacher \
  --note "..." --i-am-the-reviewer
```

The password is read from the terminal, never from a flag. `--i-am-the-reviewer`
is an assertion that a person read the material; the command refuses to run
without it, because a publish step that can be scripted is one an automation
will eventually perform. Repeat for months 1–9.

Publishing records the sha256 of exactly the month being approved. Edit the
curriculum afterwards and the approval stops matching, so a review cannot
outlive the content it reviewed.

`npm run curriculum:unpublish` withdraws a month.

## Unlock, for anyone debugging "why can't I see October"

```
unlocked(1) = true
unlocked(N) = unlocked(N-1) AND complete(N-1) AND demonstrated(N-1)
```

`complete` means every completable in the month has a completion row.
`demonstrated` means the learner solved at least one of that month's own
`unseen_problem` assessment blocks, judged server-side with `source_trust =
'judge'`. Attempting everything and answering nothing correctly satisfies the
first and not the second.

A locked month returns **404**, not 403 — the route does not confirm what
exists.

## Verification

```
npm run check
```

is lint → typecheck → curriculum:validate → curriculum:test-content → test →
build → check:bundle.

Two things worth knowing before you trust a green run:

- **`npm run typecheck` is not a superset of what `next build` checks.** A build
  has failed on type errors that `tsc --noEmit` passed. Run both.
- The suite runs test files in parallel and the curriculum suites execute real
  Python, so the machine saturates. Do not run a dev server, a build and the
  tests at once and then believe a timeout.

Postgres-backed tests skip when `DATABASE_URL` is unset, which is the normal
case — vitest does not read `.env.local`. To include them, set it explicitly,
and set it to a throwaway database.

## Worktrees

`.claude/worktrees/` holds checkouts of other branches. They are gitignored and
eslint-ignored, for the same reason in both places: a worktree is a *different
branch* living inside this directory, and linting or committing it reports
another branch's problems against this one.

They are historical. Nothing in normal development needs them.

## Deliberate exceptions

Two harnesses do **not** default to this server, and should not:

- `scripts/league-e2e.mjs` needs `LEAGUES_ENABLED=true`, which the pilot
  configuration deliberately does not set.
- `scripts/pilot-e2e.mjs` needs a separately seeded pilot database.

Both take `BASE` and `DATABASE_URL` from the environment. Everything else
defaults to `http://localhost:3000`.

## See also

- `docs/pilot/PILOT_RUNBOOK.md` — running the pilot day to day
- `docs/deployment/PRODUCTION_ENVIRONMENT.md` — production configuration
- `docs/releases/MONTHLY_PUBLICATION_PROCEDURE.md` — the publication ritual
- `docs/releases/SELF_PACED_UNLOCK_POLICY.md` — the unlock rule and its evidence
