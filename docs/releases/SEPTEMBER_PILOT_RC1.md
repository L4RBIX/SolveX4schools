# September Pilot — Release Candidate 1

Not final. Not published. This records exactly what was built and verified, so
the human sign-off in `docs/reviews/SEPTEMBER_HUMAN_SIGNOFF.md` refers to
something specific.

## 1. Identity of the candidate

| | |
|---|---|
| Curriculum hash | `1f3e4640731ad7667db30ac38c0765a28c27f102e3df4e759df36ad81bd527e8` |
| September | 12 lessons · 72 blocks · **54 tasks** · 20-minute monthly check |
| Migrations | through `0016_post_help_explanations.sql` |
| **Git SHA** | **none yet — see §5** |

### The SHA does not exist, and that is a real gap

`HEAD` is `59bf26ba`, which predates all of this work: **165 paths are
uncommitted.** A release candidate without a commit is not immutable, so this
document identifies the candidate by the curriculum hash and the migration set
instead — enough to tell whether a deployment is running this content, not
enough to reproduce the build.

Committing is a decision for whoever owns the branch, and the tree also contains
concurrent work from another session that a blanket commit would sweep up. The
command is in §5.

## 2. What was verified, and how

| Gate | Result |
|---|---|
| `npm run lint` | **0 errors**, 14 warnings (all pre-existing `<img>` / unused-var) |
| `npm run typecheck` | **clean** |
| `npm run curriculum:validate` | **no errors** |
| `npm run curriculum:test-content` | **260 passed**, 2 skipped |
| `npm run test` | **874 passed**, 9 skipped, 45 files |
| `npm run build` | **success** |
| `npm run check:bundle` | no secrets in the client bundle |
| Answer-key leak scan, all built output | **0 leaks / 54 secrets / 120 files** |

Nine of the skips are the Postgres driver suite when `DATABASE_URL` is unset,
and the build-output privacy layer when there is no build. Both name themselves
as skipped so a green run never implies they ran.

## 3. Proven against a running system, not only in tests

Every line below was executed over HTTP against the app, with a real Python
judge and a real database.

**Identity and isolation.** Two students answered the same block in the same
server; one correct, one wrong. Their states stayed separate (`episodes=1
soloSolved=1` vs `0/0`). A teacher reads only classes they teach; a class they
do not teach answers **404, not 403**, so classes cannot be enumerated. A
student reaching a teacher endpoint gets 403. Wrong password and unknown user
are indistinguishable.

**Session lifecycle.** Sign-in routes by role; a first-login password change is
forced and, once done, `/teacher` opens. Logout revokes server-side, and a
password change revokes every session.

**Learning routes require a session** outside development — all five answer 401
anonymously and 200 with a session.

**First lesson, end to end.** Sign in → home → board → lesson → wrong prediction
(`wrong`, **no reveal**, the author's explanation shown) → Nova → correct retry →
code task judged by real Python **4/4** → wrong code **1/4 partial** → server
state persists → refresh identical.

**Monthly assessment, end to end.** Reachable (200), no hidden cases or
solutions in the page, both coding blocks judged by the real judge (**7/7** and
**6/6**), written and oral blocks correctly `unknown` — never machine-scored.

**The publication gate closes.** With no approval recorded, `/lesson/m1.l1` and
`/assessment/1` return 404 and `/course/1` renders "this month is not open yet"
rather than a board of dead links.

**Eighteen students.** Provisioned, then driven through September over real HTTP
with six distinct profiles. The teacher console distinguishes them: the strong
learner (50 episodes, 43 unaided), the high-assistance learner (the only one
with meaningful assisted solves), the inactive learner (shown, not hidden), and
the repeating learner (highest unexplained failures, correctly *not* flagged
ready to stretch).

**Real Postgres.** All 14 migrations applied to a live Postgres; the app booted
against it and completed the full slice — auth, grading, judge, persisted state.

## 4. Known blockers and limitations

**Not verifiable here, and it matters most:**

- **No Piston instance exists.** Docker will not start on this machine and there
  is no production URL. The *adapter* is proven against a protocol-faithful fake
  across all ten scenarios, and three real adapter bugs were found and fixed
  that way — a syntax error reported as a runtime error, an unenforced output
  cap, and a missing run-stage read as a successful empty run. **Container
  isolation, the memory cgroup, the network lockdown, data residency and host
  throughput are all untested.** `docs/deployment/PRODUCTION_ENVIRONMENT.md`
  ends with the checklist only a real instance can close.

**Operational:**

- **DeepSeek is outside Kazakhstan.** Enabling it breaks the programme's data
  residency commitment. Default is `echo`; nothing leaves today. The health view
  reports `leavesProviderBoundary`.
- **Retention and erasure functions exist and nothing calls them.**
  `learning_events_purge`, `code_blobs_drop_content` and `learning_forget_user`
  are all unreferenced. Consent revocation is therefore a manual SQL operation.
- **No backup mechanism exists in the repository.**
- **`LEARNING_CRON_SECRET` has no consumer**; with `LEARNING_SWEEP_IN_PROCESS=false`
  the reducer has no trigger at all.
- **PGlite is single-writer and corruptible by an ungraceful shutdown** — one was
  corrupted during this work. Use Postgres in production; the driver now exists.

**Pedagogical, disclosed to the reviewer:**

- Explanation is thin (~20 min against ~33 implied).
- Delayed re-solve is new and its 5-day default is a product choice, not research.
- `test_case` blocks accept one literal answer.
- Support students see a short lesson 11.
- Five tasks need a symbol (`!=`, `<=`, `abs()`) the month never shows on screen.
- Teacher signals are calibrated against a simulated class, not a real one.

## 5. To make this an immutable candidate

Review the diff first — the tree contains concurrent work from another session.

```
git status                       # read it; 165 paths
git checkout -b september-pilot-rc1
git add -A                       # or stage selectively
git commit -m "September pilot RC1"
git rev-parse --short HEAD       # <- the release SHA
```

Then record that SHA in §1 and in `docs/releases/SEPTEMBER_V1_FREEZE.md` §1.

**Do not tag this final or publish the curriculum until a human has signed off.**
