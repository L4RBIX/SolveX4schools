# /league — Premium UI Redesign

## 1 VERDICT

**SHIPPED AND VERIFIED LIVE.** 45/45 production acceptance checks.

The acceptance question was: *does a learner open `/league` and immediately want
to move from Pulse toward Singularity?* The page now answers all eight of §1's
questions above the fold, and the target — Vector — is named in the hero instead
of only at the bottom of a ladder. I think it earns a yes.

The redesign also uncovered and fixed a regression that would have been **the
most-seen league state of the pilot's first week** (§4 below).

## 2 STARTING SHA — `7f3e2ff`
## 3 FINAL SHA — `88441a9` (deployed, `dpl_PSMcEzuvRFiKm4Uf1AH7GKBRmcsi`, and `origin/master`)

## 4 DESIGN PROBLEMS FOUND

The brief's list was verified against real screenshots at four widths in both
themes, not taken on trust. Every item held. Six more that were **not** in it:

1. **Horizontal overflow at 768px** — measured, real, and nobody had listed it.
2. **The countdown truncated to «4 дня …» at 375**, and «Поднимаешься» ran past
   the card's right edge.
3. **1440 and 1024 rendered at an identical 1617px** — the layout was not
   adapting at all between them.
4. **The zone separator appeared exactly once.** «поднимаются» sat between ranks
   2 and 3; ranks 3–10 carried no zone label, so a learner at rank 7 was told
   nothing about their own projected outcome.
5. **The countdown was the largest text in the hero** — larger than the rank,
   which was the smallest thing in it. The priority was inverted.
6. **«1 участников»** — ungrammatical Russian. `groupSize` is the count of
   learners who have earned XP *this week*, so it is 1 every Monday morning for
   the first child in the class to open a lesson.

And one that mattered more than all of them — §9.

## 5 INFORMATION ARCHITECTURE — before / after

**Before:** a `1fr / 340px` split. The left column ended at the "XP на этой
неделе" card around y1000; the right FAQ column ran to y1350. **The sidebar was
the dead space** — roughly 350px of nothing at 1440, structurally, every time.

**After:** four full-width bands, no sidebar.

    HERO ──────────── league identity, rank, XP, movement, clock, next tier
    LEADERBOARD ───── full width, zone-separated
    TIER ROAD ─────── full width, the signature
    RULES ─────────── compact, collapsed

## 6 HERO

`TierEmblem` at 96px, then **PULSE** at 40px — the name, not «Лига Pulse»; the
word «Лига» moved to the quiet line beneath. The rank is now the second-biggest
thing on the page («**1** место из 10»), inverted from before. Weekly XP sits
beside it, subordinate. Movement is a sentence a learner can act on —
«↑ Поднимаешься в Vector» — with icon **and** text, never colour alone, and the
next tier is named only when promotion is actually projected.

The countdown is quiet, top-right, formatted from the server-authoritative
`endsAt`: ≥24h → «4 дня 16 ч», <24h → «18 ч», <1h → «42 мин». Never seconds,
never a ticking interval, deliberately not in a live region — a value that
changes once an hour has no business interrupting a screen-reader user.

**The right column carries the clock AND the next tier.** That column was a
visible void at 1440 with a two-line countdown and nothing under it. Filling it
with decoration would have been worse than the gap; the next tier belongs there
on its own merits, because §14's target otherwise appeared only inside the
movement sentence and at the far bottom of the road. A learner who has to scroll
to find out what is above them is being asked to want something they cannot see.
Absent at tier 10, correctly — an empty «следующая» slot would promise a rung
that does not exist.

## 7 LEADERBOARD

Full width, semantic `<ol>`, `aria-current` on the learner's row, which is
lifted with the tier accent. Top 3 distinguished by rank typography weight
only — a class is 10–30 people, not a tournament final, and podium cards would
have been a lie about the scale. Tabular numerals, XP right-aligned, and the
unit printed **once** in a column header instead of on all ten rows.

## 8 ZONES

Every zone that exists now gets a labelled rule — «▲ ПОДНИМАЮТСЯ», «— ОСТАЮТСЯ»,
«▼ ОПУСКАЮТСЯ» — restrained, icon plus text. Before, ranks 3–10 had none.

Zones are read from `zones: {promoteThrough, relegateFrom}` and never recomputed
client-side; a test pins that `zonesFor` is not called from the client. At tier 1
no relegation band is drawn and at tier 10 the board prints «Это высшая лига —
выше подниматься некуда» rather than an empty promotion zone.

## 9 THE REGRESSION THIS FOUND — a ranked learner told they had not started

`awardXp` creates a week's membership on the **first** granted credit and never
consults `LEAGUE_UNLOCK_XP`. So a learner between their first XP and their 175th
is genuinely **ranked** — their classmates see them — while the new page-level
unlock gate refused to fetch the board and told them «Ещё N XP до первой
недельной лиги».

Reproduced on the E2E database before the fix:

    vr-t1-10, 65 lifetime XP, membership 1
      own /league        ->  league-locked
      own API            ->  rank 10 of 10, weeklyXp 65
      classmate's board  ->  {"rank":10,"name":"Бекзат Т.","weeklyXp":65}

175 XP is roughly eighteen solved blocks. **Every learner in an eighteen-person
class spends their first days in exactly that state** — on each other's boards,
each individually told they have not started. Not an edge case.

The page now decides *after* the answer arrives, and shows the locked screen only
to somebody the board itself says is not competing (`you === null`) — which is
the case that screen was written for. Verified in a browser, all three branches:

| learner | state | screen | rank shown | rank in API |
|---|---|---|---|---|
| 174 XP, no membership | not competing | **locked** | — | null |
| 65 XP, ranked | competing | **board** | 10 | 10 |
| 525 XP | competing | board | 1 | 1 |

No engine logic changed: same XP amounts, same 175 constant, same award
identity, same anti-farming key, same membership rule. `git diff schools/leagues/`
is empty.

## 10 TIER BADGES

`src/components/brilliant/app/league/tier-emblem.tsx` — original SolveX, no
Brilliant or Duolingo vocabulary.

**One silhouette:** a rounded-square aperture, native to an app built on
large-radius cards, rather than a shield or crest imported from esports.

**Ten evolving interiors, and the arc is the idea.** The ladder is a signal
acquiring structure: Pulse is one point and its ring; Vector gains direction;
Circuit a route; Matrix a lattice; Reactor a core with orbits; Titan a monolith;
Nexus a network; Apex a peak; Zenith a peak with the arc above it; and
**Singularity collapses all of it back into one dense point with everything
converging on it.**

Complexity rises and then **resolves**. That is why tier 10 reads as aspirational
without one extra glow: it is the only emblem that is quiet again, and it earns
that quiet by being the densest thing on the ladder. "More strokes = higher rank"
was the obvious system and it makes the top of the ladder look like clutter.

**Colour is the last carrier, never the only one.** Identity is shape, then the
numeral, then the name; `hue` only reinforces. Ten oklch steps cannot separate
ten tiers, and adjacent tiers are close by construction — each emblem is
distinguishable in greyscale, which is the test they were drawn against. Geometry
on a 24×24 grid stays crisp at 32/48/72/96px with stroke weight scaled per size.

`TierOrdinal` keeps the numeral **outside** the aperture: inside, it fought the
shape at 32px and won, which is exactly how the old badge became a number in a
box.

## 11 TIER ROAD

Full width, an `<ol>`, and the page's signature. All ten tiers with emblem, name
and ordinal on a connected track: `behind` in ink (a tier you have left must not
compete with the one you are in), `current` larger and in colour, `next` a lit
target labelled «следующая», `ahead` dimmed but never invisible.

**Two fade defects fixed during verification.** The strip auto-centres the
learner, so for every tier above the first it opens with road hidden to the
**left** — and the only fade was pinned right. Measured: at tier 10, 593px hidden
left, 0px right, fade drawn on the right. The end of the road was marked and the
missing beginning was not. Both fades now derive from the strip's own
`scrollLeft`. Second, `lg:hidden` was a guess at when all ten fit and was off by
~35px — at 1000/1010/1023px the road was complete and the fade was still painted
over Singularity. 0 mismatches across 960–1100 now.

Only the road scrolls horizontally. Never the page.

## 12 XP RULES

Collapsed accordion: four headline amounts visible (+10 / +5 / +25 / +80),
everything else behind «Все правила». Amounts come from the canonical XP policy
the page already receives — a test pins that no second copy is hardcoded.

## 13 WEEK RULES

One line in the hero beside the clock: «ⓘ Как работает неделя», opening in place.
It was previously the tallest element on the page. Both disclosures are real
`<button>`s with `aria-expanded`.

## 14 LOCKED STATE

Dimmed Pulse emblem, «Открой лиги», a real `role="progressbar"` carrying the true
numbers, «Ещё N XP до первой недельной лиги», and a link to how to earn XP. No
empty leaderboard. At 175 it becomes the active state.

## 15 MOBILE

True mobile composition at 375: hero (stacked, countdown on its own row) →
leaderboard → XP breakdown chips → tier road (horizontally scrollable, with a
visible partial item so a learner knows there is more) → rules.

The page is **518px shorter** than before, the countdown renders «4 дня 16 ч» in
full, and «Поднимаешься в Vector» sits inside the card.

## 16 LIGHT THEME

Verified on production at all four widths. No white-on-white, no invisible zone
boundary, no washed-out tier. The hero's tier wash is the only place on the page
where hue is used as an *area* — everywhere else it stays on strokes, so tier
identity never starts competing with verdict colour.

## 17 ACCESSIBILITY

Two `<ol>`s (board and road), `aria-current` on the learner, movement as icon +
text, real `<button>`s with `aria-expanded`, countdown outside any live region,
`motion-reduce:` on every transition. **Impeccable detector: `[]` — no findings.**

One duplication fixed: the hero announced movement twice, and in the wrong
grammatical person — a screen reader heard "переходит в лигу выше" (third person,
about a learner) and then "Поднимаешься в Vector" (second person, to them). The
arrow is now `silent` in the hero; board rows keep the sentence, because there a
row is a glyph and two numbers.

## 18 SCREENSHOT REVIEW

Before: 4 widths × 2 themes on production. After: 8 states × 4 widths × 2 themes
locally, plus a production round.

**A harness lesson worth keeping.** The first "after" screenshots were all eight
the loading **skeleton**. The shot script drove `127.0.0.1`; Next 16 dev blocks
`/_next/static/*` as cross-origin from that host; every chunk 403'd; the client
never hydrated; and a fixed `waitForTimeout(1400)` photographed the skeleton and
filed it as a layout measurement. Anyone reading those PNGs would have concluded
the page was broken. The replacement harness drives `localhost`, waits on a real
selector, and reports a `skeleton` flag so that class of failure cannot pass
silently again.

**And I made the same class of mistake myself.** My production acceptance first
reported 37/45, with 8 "clipped text" failures at every width including 1440.
Investigated rather than assumed:

    total flagged                         31
    sr-only (1px by construction)         22
    inside the road's deliberate strip     9
    GENUINELY CLIPPED                       0

I had written a quick check and dropped exactly the two filters the harness
documented. The page was right; my detector was wrong. **True score: 45/45.**

## 19 FUNCTIONAL REGRESSION — engine untouched

    /league 200 for an authenticated pilot learner   ✓
    rank unchanged (1)                               ✓
    weekly XP unchanged (525)                        ✓
    tier unchanged (1)                               ✓
    promotion zone unchanged (promoteThrough 2)      ✓
    peer row keys ["rank","name","weeklyXp","isYou","zone"]  ✓ and nothing else
    175 boundary still flips at 174 -> 175           ✓
    git diff schools/leagues/                        empty

## 20 TESTS

    lint         0 errors (50 pre-existing warnings)
    typecheck    0
    curriculum   0 errors
    vitest       168 files · 6 988 passed · 23 skipped · 0 failed
    build        green
    check:bundle 85 client files · 0 hits

`tests/leagues/page-shape.test.ts` (42 tests) pins the countdown thresholds and
all three Russian plural forms, both locales of every new string, and the engine
rules the page *reads* rather than restates. It scans sources with comments
stripped — these files **explain** the things they are forbidden to do, so a raw
scan would have taught the next person to delete the explanation instead of
keeping the rule.

## 21 BUILD

`next build` exit 0. Bundle scan clean, no server-only leak.

## 22 DEPLOYMENT

`dpl_PSMcEzuvRFiKm4Uf1AH7GKBRmcsi`, target production, READY, from `88441a9`.
`origin/master` at the same SHA. The first attempt built successfully in 42s and
then failed on `EADDRNOTAVAIL` polling the status API — a network fault on this
machine, not a build fault; retried.

## 23 REMAINING VISUAL GAPS

1. **The home card and the league page still disagree below 175 XP.** A learner
   with 65 XP now sees their real board on `/league`, but the home card still
   says «РАЗБЛОКИРУЙ ЛИГИ · 65 / 175». I did not touch it, because a previous
   brief specified that locked card explicitly. The underlying product question
   is real and yours: **should a learner be joinable to a league below the
   unlock threshold at all?** Either answer is coherent — gate membership in the
   engine, or make 175 purely an onboarding announcement — but the current split
   is not.
2. **Relegation is unverifiable on live data.** At tier 1 nothing relegates, and
   reaching tier 2 requires a real Monday settlement. The zone renders correctly
   in a forced tier-5 state; nobody has seen it happen for real yet.
3. **Test coverage is source-scan based**, because there is no React test
   renderer in this repo. It pins structure and copy, not rendered output — a
   runtime rendering regression would pass. The browser run is the only coverage
   for that, which is precisely why the skeleton screenshots went unnoticed. A
   renderer is the fix if you want real protection.
4. **In light theme the road's `ahead` emblems are low-contrast** — readable, and
   far better than the washed-out circles they replaced, but they are the
   weakest thing on the page.
5. **"Оқушы 1." appears at both rank 1 and rank 10** in the pilot data. That is
   name truncation on test accounts colliding, not a UI defect; real surnames
   resolve it.
