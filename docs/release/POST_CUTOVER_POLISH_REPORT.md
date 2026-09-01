# Post-Cutover Product Polish — Report

## 1 VERDICT

**SHIPPED TO PRODUCTION AND VERIFIED LIVE.** 29/29 production smoke checks passed.

Two things the brief asked me to be careful about, answered honestly up front:

- **"Submit faster" — YES, measured, but not where anyone was looking.** A median
  Check went **9 746 ms → 2 668 ms**. A *one-case* Check is unchanged at ~3 s and
  always will be: it is Judge0's own queue and execution, and there is nothing to
  batch.
- **"Locked months fixed" — YES.** Official navigation reaches `/course/2` → 200.
  A direct `/lesson/m2.l1` still returns 404, because that is the security
  contract, not the bug.

## 2 STARTING SHA — `baf9a4a`
## 3 FINAL SHA — `2b214dc` (production + `origin/master`)

**SHA reconciliation, as required before touching anything:**

| | Before | After |
|---|---|---|
| LOCAL (`cpp17-migration`) | `baf9a4a`, clean | `2b214dc`, clean |
| GitHub `master` (default branch) | `92a9173` "Initial commit", **165 behind** | `2b214dc`, in sync |
| GitHub `main` | `2345bf1`, **unrelated history** (no common ancestor) | untouched |
| Vercel production | CLI upload from `aa0ed55` | `dpl_8xZsNknxLtX9FieQBcyDk6n4Cnb1` from `2b214dc` |

Production had been running code that existed on **no GitHub branch**. That is
now fixed by a clean 166-commit fast-forward to `master`. `main` is a squashed
snapshot from a different lineage; force-pushing over it would be destructive and
was not asked for, so it stands.

## 4 SUBMIT LATENCY — before / after / root cause

**Root cause: the measured example was the least representative block in the
product.** `m1.l1.b5` is the ONLY block of 249 with a single test case. Measured
distribution over all nine months: 263 blocks declare cases, 2 166 cases total,
min 1, p25 7, **median 8**, p75 10, p90 11, max 18.

`runCases` issues **one Judge0 submission per declared case**, and every one takes
a slot from a gate limited to `JUDGE0_MAX_CONCURRENT_REQUESTS = 2` in production.
A median Check was therefore 8 submissions in **4 sequential waves**, visible on
the wire at +1103, +3706, +5823, +8410 ms.

The batch endpoint already existed, behind `env("JUDGE0_BATCH") === "true"` —
opt-in, and **no deployment had ever opted in**. Probed against the real plan:
HTTP 201, correct per-case results, `max_submission_batch_size: 20`.

| `m2.l6.b6`, 8 cases | wall clock | billable requests | verdicts |
|---|---|---|---|
| before (gate 2, batch off) | **9 746 ms** | 30 (8 POST + 22 polls) | `P:ok` ×8 |
| after (batch on) | **2 668 ms** | 4 (1 POST + 3 polls) | `P:ok` ×8 |

**3.65× faster, 7.5× cheaper, verdicts byte-identical.**

Stage breakdown of a warm 1-case Check (p50 1 970.7 ms): SolveX's own work — auth,
curriculum resolution, claim, output checking, DB settlement, serialization,
client dispatch, client render — is **~20 ms, 1.0 %**. One POST is 177 ms; 1 760 ms
(89.3 %) is waiting for Judge0. A non-judge block round-trips in p50 **12.8 ms**.
There is nothing to win in our own code.

**`JUDGE0_MAX_CONCURRENT_REQUESTS` was deliberately NOT raised.** The plan sends
`x-ratelimit-submissions-limit: 0` with `remaining: -2268`; there is no readable
ceiling, so raising it is guessing. Batching bought the same latency while
*lowering* the request rate at the same gate — a slot is now one learner's whole
Check rather than one case.

Nothing traded for speed: same cases, same judge, same checker, no
`expected_output`, no case dropped, no attestation weakened.

Production measurement after deploy, 1-case block: **200 in 3 021 ms** — unchanged,
as expected.

## 5 SUBMIT UX

**The press was invisible and double-clicking cost real money.** `pending: true`
was set on every Check and read by nothing: the button stayed lit and clickable
for the whole wait, and a second press sent a second **graded, metered** submission.

Now, in the same frame as the press: repeat Submit blocked, the press
acknowledged, a compact progress line. Sequence `sent` 0 ms → `running` 700 ms →
`slow` 8 000 ms (≈3× the measured 2 668 ms Check).

- `busy` on `Button3D` keeps the variant's colour and the pressed geometry rather
  than going grey — grey says "not available to you", the wrong sentence for a
  press that landed. `aria-busy`, `motion-reduce:animate-none`.
- `check()` asks `canPressCheck` before sending, because a `disabled` attribute
  can be one frame behind a click.
- One `aria-live="polite"` line in the footer strip. **No modal, no overlay** —
  the learner's code never moves. It waits 150 ms before drawing: a
  multiple-choice Check answers in ~13 ms, and a line of text for one frame is a
  flicker, not feedback.
- **No fake percentages. No invented "3/6 tests passed".** RU + KK via `Localized`.
- Every settle path clears `pending`, including both failure paths, so Try again
  survives a provider outage.

## 6 GLOBAL AI SEARCH — removed

It was duplicated verbatim in two components and led nowhere.

Removed: `AskBar` from `home-rail.tsx` and `learning-paths.tsx`; the
`askPlaceholder`/`ask` fields and defaults in both; the two label lines in
`school-home.tsx` and `year-roadmap.tsx`; `L.askPlaceholder` / `L.ask` from
`labels.ts`; the `lg:flex-row justify-between` wrapper on `/program` that existed
only to seat the bar beside the title. Docs updated
(`BRILLIANT_ADAPTATION_GAP.md`, `home-loggedin.spec.md`).

**The trap, avoided deliberately:** `L.ask` («Спросить») is the dead bar;
`L.askNova` («Спросить Nova») is the live in-lesson pill. One character apart in a
grep, opposite in meaning. Nova's four lesson entry points — `askNova`,
`chatWithTutor`, `getHelp`, `why` — are untouched, as is everything under
`src/components/nova/**`, `src/app/api/nova/**` and `schools/nova/**`.

**Rebalanced, not just deleted.** The bar was 72 px of the rail at both 1440 and
375. The greeting went 20/30 → 26/32 and the weekly-goal card was promoted above
the streak card into the freed space — it is the one card carrying a number a
learner can act on. Measured after: greeting y89 h32, goal y141 h108, streak y269
h247, league y536 h266; every gap exactly 20 px at both widths.

## 7 MONTH LOCK — the exact rule, unchanged

Month 1 is open. Month N opens when N−1 is **complete AND demonstrated**.
`hasDemonstratedIndependence` is `some`, not `every` — months 1–8 author exactly
one `verify:unseen_problem` block each so the two coincide, and May authors five
while gating nothing after it.

**Backend policy was not simplified to match simpler copy.**

## 8 LOCKED-MONTH UX

`/course/N` renders `MonthNotOpen` with a truthful checklist derived from
`UnlockState`: lessons done / lesson completables (12 for September, **not** the
13 that includes the check), check pending, independent task pending. No
percentages, no ids, no prompts, no cases, no hidden assessment content.

A locked deck row is a `<div aria-disabled="true">` — not a link, not
`pointer-events-none` — with a padlock replacing the completion dot and an sr-only
«Закрыто»/«Жабық». Shape and word, because `opacity-50` on that card already means
"not your active lesson". The CTA is a quiet `LockedButton` to `/course/N`.

**A false promise, fixed.** `monthLockedBody` told learners a month opens when
they complete the previous month's lessons and check.
`ASSESSMENT_COMPLETION_POLICY` never requires `passed`, so that was completable
while the month stayed shut. It now names both halves.

## 9 404 ROOT CAUSE

**Not the gate.** `src/app/lesson/[lessonId]/page.tsx:86` correctly `notFound()`s a
direct URL and is untouched. The home deck was **emitting `/lesson/<id>` hrefs for
months the learner cannot enter**, and `nextLesson`'s `?? all[0]` fallback pointed
the Start CTA at `/lesson/m2.l1`.

`monthToDeckCourse` now takes a **required** `{ unlocked }` — no safe default
exists, `true` ships the 404s back and `false` locks September — and when locked
it never calls `nextLesson`, so the fallback cannot fire.

Live production proof:

    home a[href] matching /lesson/m[2-9].  ->  []   (none emitted)
    official  /course/2                    ->  200
    direct    /lesson/m2.l1                ->  404  (contract holds)
    direct    /lesson/m1.l1                ->  200

## 10 LEAGUES BEFORE

`LEAGUES_ENABLED=false` in production, no `LEAGUES_SCHOOLS` row. Nine test files,
117 tests, 0 failed. Zero league rows ever written in production.

**There was no split-brain and no Unlock-Leagues card in the product.** The card
the brief describes lives on `/brilliant/app/home` — the untouched Brilliant
reference route, 404 in production.

**The real defect was the opposite: `/league` was unreachable.** The only
`href="/league"` was inside `SCHOOL_NAV_WITH_LEAGUE`, whose only consumer was the
league page itself. Every other surface called `SCHOOL_NAV(loc)`. Turning the flag
on would have shipped a complete, tested, **invisible** feature.

## 11 LEAGUES AFTER — flags and pilot scope

    LEAGUES_ENABLED=true
    LEAGUES_SCHOOLS=innovation-tech

Scoped, so a future school does not get peer ranking by surprise. The
`=== "true"` spelling is kept: `!== "false"` would switch a feature that shows
children to each other on for every school at the next deploy.

Every learner surface now resolves `leagueNavVisible(user)` **server-side** and
passes it down as a prop — a client component importing `config` fails
`check:bundle`, which is why the two-function split exists. A test asserts no
surface is left ungated.

**A second defect fixed:** a teacher at an enabled school got the page and then a
"board did not load" screen, because `/api/league/me` 403s a non-student. The role
gate now refuses up front — still `notFound()`, never 403, because a refusal that
distinguishes "you may not" from "there is nothing here" is an oracle for what
other schools have enabled.

## 12 175 XP UNLOCK

`LEAGUE_UNLOCK_XP = 175`, one canonical constant in `schools/leagues/unlock.ts`
(deliberately not `server-only`, so the client card can import it).
`unlockFrom(lifetimeXp) → {lifetimeXp, unlocked, needed}` is pure;
`leagueUnlockFor(sql, subjectId)` sums the **existing** `league_xp_awards` ledger
across all weeks. No second XP system, no new source, no writes.

Measured boundary in a real browser against the real ledger:

    0 XP   → locked, "0 / 175 XP",   aria-valuenow=0  aria-valuemax=175
    174 XP → still LOCKED, "174 / 175 XP", no rank anywhere
    175 XP → FLIPS open, tier badge + week status + "Открыть лигу"

## 13 LEAGUE XP / ANTI-FARMING

Unchanged and inherited, not reimplemented. The anti-farming property is the
primary key of `league_xp_awards`: **`(subject_id, achievement, entity_id)`**.
`awardKey` binds an award to a finite curriculum entity, so lifetime XP is bounded
by the curriculum. **Run awards nothing — structurally: it is not a curriculum
entity, so `awardKey` has nothing to give.** No time-based, streak-based or
attempt-based term was added.

## 14 LEAGUE PAGE

`/league` carries tier, weekly XP, rank, the class-scoped leaderboard, promotion /
stay / relegation zones, the week explanation and the ten-tier ladder. Movement is
legible by **text + icon, not colour alone**; `aria-current` marks the learner; the
board is a semantic ordered structure.

Ladder verified in code, not assumed: Pulse · Vector · Circuit · Matrix · Reactor ·
Titan · Nexus · Apex · Zenith · Singularity. Not renamed.

**The measurement agent's zone alarm was wrong and the build agent caught it.**
`{promoteThrough: 0, relegateFrom: 1}` is the **empty** group, not a one-member
group, and means "nobody" — not "the only member is relegated". No defect, no
mathematics changed.

## 15 LEAGUE PRIVACY

The audited contract is preserved and the actual privacy suite was run. A peer row
carries rank, display name, weekly XP, `isYou`, zone — and nothing else. No UUID,
username, email, school id, class id, attempts, wrong answers, hint usage,
misconceptions, assessment score or last-seen.

## 16 INFO / ABOUT

One stable explanation, not three pages: `schools/leagues/explain.ts` feeding the
existing help content at **`/help/leagues`** (live, 200). It covers the 175 XP
unlock, weekly competition, XP sources, promotion / stay / relegation, privacy and
class scope, no farming, and the ten tiers. Linked from the locked home card and
from the league page. Month-unlock rules are documented in learner language beside
it.

## 17 MONTH THEMES — the token registry

One source of truth: **`schools/presentation/month-theme.ts`**, modelled on
`illustrations.ts` — `Record` keyed 1..9, pure data, no React, no DB, with
`monthTheme(index)` and a `NEUTRAL_THEME` fallback. Fields: `index`,
`accent {light,dark}`, `onAccent {light,dark}`, `glyph {id,path}` (**mandatory**),
`name: Localized`. Values are hex assembled into `light-dark()` by
`monthThemeVars()`, deliberately **not** in the global `@theme` block, following
the `tiers.ts` precedent.

**THE LOAD-BEARING FINDING: colour alone cannot encode nine months.** Nine hues at
oklch L .50 / L .82 give a global pairwise minimum of 9.7 ΔE2000 — but under Viénot
tritanopia the same palette collapses to **2.0 ΔE**, below the JND. So identity is
carried **jointly** by nine silhouettes (disc, triangle, square, cross, asterisk,
chevron, diamond, droplet, star), the month numeral, and the existing per-month
art. **Colour reinforces; shape encodes.** The codebase already argued this twice
(`globals.css:46`, `sx-milestone.tsx:156`).

Contrast floors, measured and asserted: every light accent ≥4.65:1 on `#f5f3f1`,
every dark accent ≥9.38:1 on `#141414`.

**Month colour is identity; verdict colour is status.** Both separations asserted
by test. League tier colour stays independent of month colour.

**Five pre-existing light-theme defects fixed on the way:**
`course-gameboard.tsx:411` was `rgba(255,255,255,0.6)` — white text on a white page,
so the eyebrow of every non-current level header was invisible;
`sx-pedestal.tsx` painted `#141414` fill and `#0C0912` stroke in both themes.

## 18 MILESTONES

Milestones inherit month identity through five scoped CSS custom properties: ring,
active glow, path/connector highlight, selected outline, icon accent, completion
ornament. Restrained accents, not neon.

## 19 RU / KK

All new copy is RU **and** KK through the existing `Localized` type, so a missing
locale fails compile. No English in the RU interface: «РАЗБЛОКИРУЙ ЛИГИ», «0 / 175 XP».
Tier proper nouns stay Latin — the existing intentional contract.

**Kazakh remains DRAFT. Native review is NOT marked complete.**

## 20 RESPONSIVE

1440 / 1024 / 768 / 375 on home, program, locked month, active month, league
locked, league active, league rules, lesson Submit pending, milestones. No
horizontal page scroll anywhere. No blank area where the ask bar was — the rail
was re-laid out and measured.

## 21 TESTS

    lint            0 errors (50 pre-existing warnings)
    typecheck       0
    curriculum      0 errors
    vitest          167 files · 6 946 passed · 23 skipped · 0 failed
    leagues         9 files · 117 passed
    build           green
    check:bundle    85 client files · 0 hits

Up from 157 files / 6 788 tests. Every new assertion was mutation-tested: the
Judge0 unit ran 7 mutations, month themes 8, home integration 5.

## 22 BUILD

`next build` exit 0. `check:bundle` clean, no server-only leak into the client.

## 23 PRODUCTION DEPLOYMENT

`dpl_8xZsNknxLtX9FieQBcyDk6n4Cnb1`, `target: production`, READY, from `2b214dc`.
Leagues enabled for the pilot school only. `origin/master` fast-forwarded 166
commits to the same SHA, so GitHub, local and production finally agree.

## 24 LIVE SMOKE — 29/29 on https://solvex4schools.vercel.app

    ✓ login                              ✓ /home renders
    ✓ no dead AI search bar              ✓ league card present
    ✓ home emits NO locked lesson href   ✓ /course/2 → 200, not 404
    ✓ /lesson/m2.l1 → 404 (contract)     ✓ /lesson/m1.l1 → 200
    ✓ locked page explains the lock      ✓ not the generic 404
    ✓ /league → 200                      ✓ /api/league/me agrees
    ✓ /help/leagues → 200                ✓ 16/16 responsive checks

Production Submit measured live: 200 in 3 021 ms (1-case block — judge-bound,
unchanged by design). The temporary smoke learner was created, used and erased
through `learning_forget_user`; production ends at 19 accounts, 4 subjects,
0 league rows, 18 live publications.

## 25 REMAINING GAPS

1. **The 8-case improvement is not yet measured *in production*.** It was measured
   against a local production build with the real judge (9 746 → 2 668 ms). The
   live check above used the 1-case block deliberately, to avoid spending judge
   quota. First real multi-case Check on production will confirm it.
2. **`JUDGE0_MAX_CONCURRENT_REQUESTS` is still 2** and the plan's real rate ceiling
   is still unreadable. Batching made this much less pressing.
3. **No league settlement has ever run against real pilot data.** The first learner
   to open `/league` on a Monday triggers `settleDueWeeks`. The path is covered by
   the suite but has never executed on production rows.
4. **Known light-theme defects left alone, deliberately, reported not hidden:**
   `sx-pedestal.tsx:183-184`'s silver/grey milestone discs are low-contrast on the
   light page, but `tests/school/milestone.test.ts` asserts those exact four
   literals; `gameboard-nova.tsx:119,192` draws a white glow that vanishes on
   white; `app/pedestal.tsx:99-100`'s `#9D62FF` glow is not month-themed, so an
   orange marker can sit on a purple glow.
5. **Kazakh copy is DRAFT** throughout, including every string added here.
6. **Brilliant assets still ship on production routes** — a copyright risk, out of
   scope for this workstream and unchanged.
7. **GitHub `main` (`2345bf1`) is still an unrelated squashed snapshot.** `master`
   is now canonical. Someone should decide whether `main` is deleted, or made an
   alias of `master`.
