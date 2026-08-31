# SolveX Leagues — release report

Companion to `LEAGUE_ARCHITECTURE_DISCOVERY.md`, which was written before any
code and records what the codebase actually contained.

---

## 1. Verdict

**READY WITH EXPLICIT BLOCKERS.**

The subsystem is complete and verified: 107 new tests, 3412 passing in the whole
suite, 42/42 browser E2E checks against real Chromium and real PostgreSQL 17,
migration applied on both engines, lint and typecheck clean, production build
green.

Two blockers stand between that and "production ready", and neither is a defect
in the league code:

1. **The release SHA cannot be produced honestly.** See §18.
2. **Leagues reverse a policy the project stated four times in writing.** The
   code is built to respect the conditions that refusal was narrowed to, but a
   person has to make that call. See §2.1.

Everything else in §17 is a gap I am naming, not a gap I am hiding.

---

## 2. Original state

No XP. No league. No streak. No points. No ranks. Nothing to migrate from.

What existed and is adjacent:

| Thing | What it actually was |
|---|---|
| `schools/teacher/leaderboard.ts` | Teacher-only, class-only, four counted lenses over `attempt_episodes`, derived at read time. No stored score. |
| `AppHeader.xp` | A prop whose doc comment says *"this product has no XP"*. Every call site passed `null`. |
| `HomeRail.xp` / `xpGoal` | Dead props from the Brilliant clone, defaulted `0` / `175`, never fed. |
| `HomeRail.streak` | A **count of active days**, explicitly not a streak. |

Two comments in the product stated the absence as a decision and are now false;
both were updated as part of this work rather than left to rot:

> *"An XP league is not part of this product and inventing one would be a
> fabricated metric."* — `home-rail.tsx:49-50`

### 2.1 The policy this reverses

The project refused student-visible ranking in writing four times
(`PRIVACY_DATA_FLOWS.md:318`, the deleted `classroom.ts:262-265`,
`leaderboard.ts:9-59`, `PRODUCTION_PRODUCT_AUDIT.md:127-132`). The existing
teacher leaderboard survives that refusal on four conditions, and **the league
was built to inherit all four**:

1. Rank only a counted, auditable quantity — never a composite invented score. ✓ XP is a sum of ledger rows, each traceable to one curriculum entity.
2. Publish the formula on screen. ✓ The rules panel renders `XP_AMOUNTS` from the API, including what does *not* earn XP.
3. Never add two different units together. ✓ Every award is XP; nothing else is summed into it.
4. Class-scoped only. ✓ A group is `(week, tier, school, class)`, and cross-school grouping is structurally impossible.

That is an argument, not an authorisation. Somebody has to decide.

---

## 3. Product design — the ladder

Ten tiers, chosen by you, rendered as **Latin proper nouns in both languages**:

```
01 Pulse    02 Vector   03 Circuit  04 Matrix   05 Reactor
06 Titan    07 Nexus    08 Apex     09 Zenith   10 Singularity
```

**Why Latin rather than Cyrillic.** `Singularity` has no shared Cyrillic form —
«Сингулярность» in Russian, «Сингулярлық» in Kazakh — and `Circuit` has no
internationalism at all. Transliterating would give a learner two different
names for their own tier depending on which language button they last pressed.
The product already does exactly this with `Nova`: «Nova — оқу көмекшісі» /
«Nova — учебный помощник». Tier names live in `schools/leagues/tiers.ts` as
plain strings and never enter the `Localized` label object.

**Why `Nova` is not tier 10.** Nova is this product's AI tutor, named in RU and
KK copy. A learner reading «Nova лигасы» on one screen and asking Nova for a
hint on the next has been handed one word for two things. Your original list had
this collision; the replacement does not.

The hue ramp walks blue → violet → gold and deliberately avoids the meanings the
product has already fixed: green is `accepted`, rose is `wrong`, amber is
`partial`, and the three track colours mean a route through a month, not a rank.

---

## 4. XP policy

One module — `schools/leagues/xp-policy.ts`. Version `xp.v1`, stamped on every
row.

| Achievement | Awarded for | XP |
|---|---|---|
| `block_solved` | First server-verified solve of a block | **10** |
| `block_solved_unaided` | Same solve, no help and no reveal | **+5** |
| `challenge_solved` | First solve of a `challenge` block | **15** |
| `explanation_submitted` | An explanation reaching the teacher's queue | **8** |
| `lesson_completed` | A lesson finished under `LESSON_COMPLETION_POLICY` | **25** |
| `assessment_completed` | A month's assessment finished | **80** |
| `review_resolved` | A delayed re-solve, unaided | **12** |

A typical week — 12 blocks, 8 of them unaided, one lesson — is **185 XP**. An
assessment week adds 80.

**Nothing is ever subtracted.** There is no negative amount in the file, no code
path that removes XP, and a CHECK constraint (`amount > 0`) makes "XP as
punishment" a migration rather than a patch.

**No time, speed, streak or attempt term**, because the product already refused
each: *"No lens reads `active_seconds`. Time on screen is not ranked,
deliberately"* (`leaderboard.ts:45`), and the streak was removed in
`PRODUCTION_PRODUCT_AUDIT.md` because nothing recorded activity days. Nothing
records them yet, so §28 is honoured by adding no streak.

**Human-review blocks are credited on SUBMISSION, not on the teacher reading
it.** Two reasons, and the second is load-bearing: a fourteen-year-old must not
wait on an adult's Tuesday to find out what their Monday was worth; and
migrations 0016 and 0022 forbid scoring an explanation at all — `human_reviews`
has no score column *by design*. A flat credit for the act of writing is
therefore the only form this award can take.

---

## 5. Anti-farming — every invariant

**The one that does the work:**

> Every XP source is keyed to a **curriculum entity**, and the curriculum is
> finite and fixed. There is no repeatable source of XP anywhere.

Award identity is `(subject_id, achievement, entity_id)` — the **primary key** of
`league_xp_awards`. `entity_id` is a block, lesson or review id: never a
submission, never an episode, never a timestamp, never anything a learner can
mint twice. Lifetime XP is bounded by the curriculum.

This closes a vector that is **open in the product right now**:
`learning_submissions` dedups only identical `(subject_id, submission_id)`, the
id lives in a client ref that hydration does not restore, and `hydration.ts`
deliberately withholds the episode id once a block is accepted. So reload +
resubmit genuinely does write a second accepted verdict — and the E2E drives
exactly that sequence and asserts it earns nothing.

| Attack | Why it earns nothing |
|---|---|
| Press Run, ×20 | `/api/exec/run` writes no row at all. Verified in the browser E2E. |
| Pyodide execution | Never reaches the server as evidence. |
| Same submission replayed | Stored response replayed; carries no `league` key. |
| Reload, fresh submissionId, same block | Award key already exists. Insert refused. |
| Same block in a **later week** | Same key. Solved is solved. |
| 100 replays | Asserted: total unchanged. |
| Concurrent successful requests | 6 concurrent: all refused, total unchanged. |
| Wrong-answer spam | No accepted verdict, no credit, and nothing subtracted. |
| Hint spam | Asking for help is not an achievement. |
| Whitespace-changed resubmit | New submission id, same block key. Nothing. |
| Forged `{amount: 999999}` | No route reads an amount. Field is ignored. |
| Forged `weekId` / `tier` | Week comes from `received_at`; tier from the ledger. |
| Forged block id | 404 before identity resolves. |
| Cross-school access | No parameter names a group; scope comes from `class_enrolments`. |
| Reducer version bump | Awards are not written by the sweep. |
| Judge0 timeout then retry | Idempotent through the existing claim/settle ledger. |

**Structural, not checked:** the duplicate is refused by the database, so it
survives the next person in a hurry. `league.duplicate_blocked` counts refusals —
expected non-zero in normal use, since every reload of a finished lesson produces one.

---

## 6. Database

`database/migrations/0023_leagues.sql`. Applied and verified on **PGlite** and on
**PostgreSQL 17.10**.

| Table | Key | Purpose |
|---|---|---|
| `league_xp_awards` | `(subject_id, achievement, entity_id)` | The ledger. Append-only. |
| `league_profiles` | `subject_id` | Current rung, carried between weeks. |
| `league_groups` | `group_id`, unique `(week, tier, school, class, ordinal)` | One weekly group. |
| `league_memberships` | `(subject_id, week_id)` | One group per learner per week. |
| `league_settlements` | `(subject_id, week_id)` | Immutable result. |

Every table: `enable row level security` with **zero policies**, `revoke all from
anon, authenticated`, `comment on table`. Every learner-keyed table cascades from
`learning_subjects`, so `learning_forget_user` needed **no new statement** —
verified by a test that runs its final `delete` and asserts nothing survives.

**There is no `total_xp` column anywhere.** The ledger is authoritative; a cached
total would be unauditable, and the question the table exists to answer is not
"how much" but "why".

The ledger is **rebuildable** from `learning_events` plus a policy version: what
is awarded is a pure function of the ledger, which week it belongs to comes from
the immutable `received_at`, and how much it was worth is pinned by
`policy_version`. So it does not break the invariant that everything except
`learning_events` is a droppable cache.

---

## 7. Week model

**Reused, not forked.** `windowFor("week", 0, now)` — the product's single
definition, UTC, Monday-anchored, half-open.

Your brief recommended anchoring to `Asia/Almaty` and warned against "casually"
using UTC midnight. Using it here is not casual — it is what the boundary was
measured to mean:

```
UTC week starts  Mon 00:00Z  ->  Almaty  Mon 05:00
UTC week ends    Sun 23:59Z  ->  Almaty  Mon 04:59
```

Kazakhstan is UTC+5 with no DST (unified onto one zone in March 2024), so the
existing boundary **already rolls over at five in the morning local** — after any
plausible study session, before the school day.

Forking would have put five hours of every Sunday evening into the competition's
week but last week's progress chart, on two cards of the same screen. The
codebase forbids a second definition in three places. `COMPETITION_TIMEZONE =
"Asia/Almaty"` records the intent, and `tests/leagues/week.test.ts` pins the
Almaty meaning — if Kazakhstan ever moves, that test fails and names the thing to
reconsider.

Attribution is from `received_at` (our clock), never `occurred_at` (the client's,
which 0003 names as forgeable).

---

## 8. Grouping and concurrency

Lazy: a learner joins on their **first eligible award of the week**, in the same
transaction. No Monday job enrols anybody.

Three idempotent writes, no locks: profile (`on conflict do nothing`), group
(`on conflict (week,tier,school,class,ordinal) do nothing`), membership
(`on conflict (subject_id, week_id) do nothing returning`). The membership
primary key makes "one learner, two groups, one week" impossible at the database.

**Capacity is soft, deliberately.** `MAX_GROUP_SIZE` (34) sits above
`TARGET_GROUP_SIZE` (30) because choosing a group is a read-then-write and
closing that race needs a row lock that would serialise every first award in a
class through one row on Monday morning. The headroom absorbs the overshoot, and
`zonesFor` is a ratio of the actual size so a larger group simply promotes
proportionally more.

**Consequence of lazy entry:** every member holds at least one point. There is no
zero-XP member, so the ranking code never has to decide what one means.

Verified: 18 concurrent first-awards → one group, 18 memberships, no duplicates.

---

## 9. Promotion / relegation

`LEAGUE_POLICY_VERSION = "league.v1"`. Movers = `max(1, round(size / 5))` at each
end.

| Size | Up | Stay | Down |
|---|---|---|---|
| 30 | 6 | 18 | 6 |
| **18 (the pilot)** | **4** | **10** | **4** |
| 10 | 2 | 6 | 2 |
| 5 | 1 | 3 | 1 |
| 4 | 1 | 2 | 1 |
| 3 | 0 | 3 | 0 |
| 1 | 0 | 1 | 0 |

**Below four, nobody moves.** With two members any rule promotes half the group
and relegates the other half on one week's difference — noise presented as a
result, which is the failure the teacher leaderboard's evidence floors exist to
prevent. This answers your §13/§14 cases directly: one point then vanishing
cannot promote anybody in a two-person group.

**Ties resolve in the learner's favour.** Competition ranking (1, 1, 3), and
because the board tells a learner that equal XP is equal rank, that promise
survives the boundary: everyone tied *across* the promotion line promotes;
everyone tied across the relegation line **stays**, because relegation is the
harsher answer and an ambiguous case must not deliver it.

No relegation from tier 1. No promotion from tier 10. Both clamped.

---

## 10. Privacy

Four fields reach another learner's browser, and that is the whole list:

```ts
interface LeagueRow { rank; name; weeklyXp; isYou; zone }
```

No subject id, no user id, no school, no class, no username, no attempts, no
failures, no hint usage, no skills, no misconceptions, no assessment result, no
teacher flag, no last-seen. Asserted by test against the serialised payload, and
again in the browser E2E against the real wire response.

**Display identity:** first name + last initial — «Айдана Смагулова» → «Айдана
С.». The learners in a group are, by construction, the learners in one class who
sit in a room together daily, so a first name discloses nothing the register does
not; what it does is keep the full name out of a payload that gets screenshotted
and pasted. `displayNameFor` is the **single** call site, so enabling cross-class
grouping is an edit there and nowhere else — at which point it must become a
system-issued alias, because a first name is not an acceptable disclosure to a
stranger.

Population comes from `class_enrolments`, never from `school_subject_scope` —
whose three store methods filter on `class_id` alone with no school predicate and
would have reopened a known cross-school leak. This also excludes teachers:
`resolveIdentity` mints a subject for any signed-in user with no role check, so a
league built from subject scope would rank the teacher beside the children.

**Erasure:** cascade from `learning_subjects`, nothing added to
`learning_forget_user`. A settled week's board loses the erased learner's row and
the ranks around them are *not* rewritten — each learner's own rank is stored, so
a history with a gap is the correct outcome rather than retaining a deleted
child's position for a leaderboard's convenience.

---

## 11. UI

`/league`, plus `GET /api/league/me`. Nav entry added to `AppTab` **and** the
`ICONS` map (missing either is a runtime crash, not a missing glyph).

Screenshots in `docs/leagues/screenshots/`, all captured from the running product
against real PostgreSQL with an 18-student class at Circuit (tier 3):

| File | What |
|---|---|
| `30-top-dark-ru.png` | Desktop dark, Russian, learner ranked 1st (promoting) |
| `31-top-light-ru.png` | Same in the light theme |
| `32-top-dark-kk.png` | Kazakh |
| `33-bottom-dark-ru.png` | Learner ranked 18th (relegating) — the state that matters most |
| `34-mid-375-ru.png` | Phone |
| `35-mid-768-ru.png` / `36-mid-1024-ru.png` | Tablet |
| `37-mid-dark-ru-full.png` | Whole page |

All six §19 questions are answerable in the first viewport at 1440. No
page-level horizontal scroll at 1440/1280/1024/768/375. Board is a semantic
`<ol>`; the learner's row carries `aria-current`; movement carries a glyph, a
colour **and** a screen-reader sentence, never colour alone. Relegation is amber,
not the rose this product uses to tell a child their answer is wrong.

---

## 12. RU / KK

~60 new `Localized` pairs. `Locale = "kk" | "ru"` and `Localized =
Record<Locale, string>`, so a missing translation is a **compile error** — there
is no completeness gap to report.

One entry, `navLeague` («Лига»), is identical in both and is on the
shared-loanword allowlist with its reason. It is deliberately **not** «Рейтинг»,
which is the teacher leaderboard's word — the two surfaces must not be verbally
indistinguishable to a bilingual reader.

**Russian past tense is gendered and none of these use it.** «Ты поднялся» is
masculine, «поднялась» feminine, and the product holds no gender for anybody —
`school_accounts` has a name, a school, a role and a credential. A past-tense
result banner would misgender roughly half of every class, every Monday. Every
result string is present tense or nominal: «Твоя новая лига — Vector», «Ты
остаёшься», «На этой неделе ты соревнуешься в лиге Circuit».

Zone labels are third person («Поднимаются») because they label a *band* of the
table; the learner's own status is second person («Поднимаешься») because it
labels *them*. A screenshot reviewer caught that distinction being wrong, and it
was fixed.

No «проиграл», no «последний», no «слабый».

---

## 13. E2E — exact observed result

**42/42 checks passed.** Real headless Chromium, real accounts signing in through
the real form, real HTTP, **real PostgreSQL 17** (mandatory — PGlite hands a
second process a stale snapshot rather than an error).

```
A learner starts the week with no membership
  ✓ GET /api/league/me is 200 for an enrolled student
  ✓ they are not competing yet
  ✓ the board is empty rather than showing a zero row
  ✓ they still have a tier, so the ladder renders
Running Python does not produce XP
  ✓ 20 Run requests awarded nothing
A server-verified Submit awards XP exactly once
  ✓ graded correct · XP announced once · learner entered · board shows them
  ✓ weekly XP equals what was announced (15) · rank 1 of 1
A duplicate Submit changes nothing
  ✓ replayed response announces no XP · weekly XP unchanged
  ✓ fresh submission id on a solved block is still graded, but announces no XP
Forged client claims are ignored
  ✓ forged amount/week/tier ignored · XP unmoved · tier unmoved
State survives a refresh and a re-login
  ✓ renders after hard reload · XP survives logout and login
Another learner earning more changes the ordering
  ✓ second learner ahead and ranked first · first learner now second · group of two
What the browser is told about a classmate
  ✓ no uuid · no username · no surname · no school/class · "Ерболат А."
Both languages · Responsive (1440/1280/1024/768/375) · Accessibility
  ✓ all
```

Run it: seed with `scripts/league-e2e-seed.ts`, then
`E2E_BLOCKS=… BASE=… node scripts/league-e2e.mjs`.

---

## 14. Security

- **No write API.** There is no `POST /api/league/*`. XP is a side effect of being graded; the only student-facing endpoint is a GET.
- **No client-supplied amount is read anywhere.** Amounts come from `XP_AMOUNTS`, keyed by an achievement the server chose from the block it just graded.
- **Subject resolved from the session**, never a parameter — so there is nothing to tamper with.
- **404, not 403**, when leagues are off for a school, so the endpoint is not an oracle for what other schools have enabled.
- **`cache-control: private, no-store`**, so no intermediary serves one learner's board to their classmate.
- **No new secret**, and no league value is `NEXT_PUBLIC_`.
- Forged amount, week, tier, block id and cross-school access all verified in the browser against the running server.

---

## 15. Load — measured

PGlite, in-process, one machine. **Not** a production latency budget; what these
establish is *shape*.

```
leaderboard read
     30 learners in the table    14.8 ms   2 queries
    330 learners in the table     5.9 ms   2 queries
   3330 learners in the table     8.1 ms   2 queries

settlement   111 groups / 3330 learners in 20733 ms (2.1 queries per learner)
re-settlement                          43 ms, 0 groups
award        first 68.0 ms (11 statements) · duplicate 8.1 ms (3 statements)
```

**Two queries, flat.** The read is bounded by the group, not the population — a
tenfold increase changed nothing. No N+1 anywhere. The duplicate path is one
league statement, which matters because every reload of a finished lesson takes
it.

---

## 16. Tests

```
npm run lint          0 errors (27 pre-existing warnings)
npm run typecheck     clean
npm run build         green, /league routed
npx vitest run        101 files · 3412 passed · 0 failed · 22 skipped
node scripts/league-e2e.mjs   42/42
```

107 new tests in `tests/leagues/`:

| File | Tests | Covers |
|---|---|---|
| `schema.test.ts` | 15 | Constraints, RLS, erasure cascade |
| `standings.test.ts` | 18 | Ranking and zones at every size |
| `week.test.ts` | 13 | Boundaries, ISO ids, Almaty meaning, tz-independence |
| `engine.test.ts` | 13 | Awards, anti-farming, 18-way concurrency, capacity |
| `settlement.test.ts` | 16 | Settle, retry, race, small groups, immutability |
| `submit-integration.test.ts` | 11 | §35 through the real route with a real session |
| `privacy.test.ts` | 12 | Payload, display names, cross-school, erasure |
| `separation.test.ts` | 13 | XP is not evidence — enforced by source scan |
| `load.test.ts` | 6 | 30/300/3000, query counts |

**One flake observed, not caused by leagues.**
`tests/ops/judge-observability.test.ts` failed once in a full parallel run and
passed in isolation and on two subsequent full runs. It is pre-existing
cross-file `process.env` pollution — `config` resolves env once at import, and
that file documents the workaround cost at line 237.

---

## 17. Remaining gaps

Nothing here is hidden.

1. **CI does not run tests.** `.github/workflows/ci.yml` runs lint, typecheck and build only. This suite is green in CI whether it passes or not. **Adding a `npm test` step is the single highest-value follow-up.**
2. **`solution_revealed` is never emitted by anything** (pre-existing). The reducer reads it but no producer exists, so `attempt_episodes.solution_revealed` is always false and `independence_weight` never reaches 0 via reveal — despite `leaderboard.ts:46` stating that it does. The league does **not** inherit this: it derives the reveal from the prior-failure count that `revealFor` itself uses. But the teacher leaderboard's claim is currently untrue.
3. **A latent 500 in `resolveSubjectForUser` was found and fixed.** A `learning_subjects` row existing for a user with no `user_id` alias made the alias insert violate its foreign key *inside* the transaction, so the function's own recovery re-read was never reached and the throw escaped as a 500 on page load. Not reachable from shipped code paths today (both writers write both rows), but reachable by a backfill, restore or seed — which is how it surfaced. Fixed with `returning` plus adoption of the existing row's id.
4. **Group capacity is soft** by design (§8). A group can exceed 34 by roughly the number of simultaneous joiners.
5. **No cron.** Settlement runs from a lazy trigger on page read plus an hourly in-process interval. `LEARNING_CRON_SECRET` still has no consumer anywhere in the product.
6. **A learner who exhausts the published month earns nothing further that week.** Months are gated so it is bounded, but it is real, and it is why relegation is gentle and tier 1 has none.
7. **Concurrency tested on PGlite is interleaving, not true contention.** PGlite is single-writer. The Postgres-backed E2E exercises the real driver, but a dedicated multi-connection race test against `DATABASE_URL` would be stronger.
8. **`config.pilot.classId` still defaults to `"grade-9a"`** (pre-existing). Two deployments on that default collide in `school_subject_scope`. Leagues do not read that table, so they are unaffected — but the defect is still there and still pinned by two tests.
9. **Screenshot reviewers, given no context, asked for avatars, a "gap to next rank" number, and promotion celebrations.** All three were deliberately not built: §21 keeps rows shallow, a distance-to-next-place number edges toward "everyone is ahead of you" (§44), and §46 scopes v1. Worth revisiting with you, not worth deciding alone.
10. **`docs/deployment/PRODUCTION_ENVIRONMENT.md` is stale** in at least three places (pre-existing). `.env.example` now documents the league variables correctly.

---

## 18. Release SHA — **not produced, and here is why**

I did not commit, because no honest commit exists yet.

`HEAD` is `59bf26b`, dated 27 August. The working tree carries **311 uncommitted
changes** that predate this work — the entire auth layer, the teacher console,
`schools/ops/`, `schools/legal/`, and **migrations 0010 through 0022**, all
untracked.

That is decisive rather than merely untidy: **migration 0023 references
`school_accounts` and `learning_subjects`, and 0012 is untracked.** A
league-only commit would not apply against `HEAD`. And several files I edited
(`schools/config.ts`, `learning-store.ts`, `labels.ts`, `submit/route.ts`) were
*already modified* before I started, so committing them necessarily carries
somebody else's in-flight work.

So the two available options are both wrong to take unilaterally:

- **Commit everything** → a commit labelled "SolveX Leagues" that actually
  contains three days of unrelated product work by someone else.
- **Commit leagues only** → a commit that does not build, because its migration's
  dependencies are not in the repository.

**What I recommend:** commit the pre-existing work as its own commit first, with
a message its author writes, then commit leagues on top. I can do both on your
say-so, in either order, and I have the exact file lists ready.

Nothing is lost meanwhile — every league file is on disk and the full suite is
green against it.
