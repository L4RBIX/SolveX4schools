# Where to run SolveX

```
cd /Users/kydyrbekbekarys/SolveX4schools
npm run dev
```

http://localhost:3000

That is the whole answer. Nothing else is required — no worktree, no alternate
port, no exported database URL, no second checkout.

## Why this file exists

For most of this project's life the answer was not that. Work happened in
parallel git worktrees under `.claude/worktrees/`, and the repository root sat
on an older branch with several hundred uncommitted files. `npm run dev` from
the root started a server, returned 200, and served a product several weeks
behind the one being released — which is the worst kind of wrong, because
nothing about it looks broken.

The root is now the canonical checkout. If you are reading this because you
found a `.claude/worktrees/...` path in a command somewhere, that command is
either historical or a deliberate exception; see "Worktrees" below.

## The canonical checkout

| | |
|---|---|
| Path | `/Users/kydyrbekbekarys/SolveX4schools` |
| Branch | `pilot-release-candidate` |
| Default port | 3000 |
| Database | `postgres://localhost/solvex_dev` |
| Config | `.env.local` (gitignored, never committed) |

`npm run dev` runs `predev` first, which copies the Pyodide runtime out of
`node_modules` and compiles the Python worker. Both are generated and both are
gitignored; you do not need to run them by hand.

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
