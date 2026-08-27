# Production product audit

Taken before any edit. Classifies every piece of the student product for the
route inversion and the Nova/Strobi integration.

**Date:** 2026-08-27 · **SHA at audit:** `f036d92`

---

## 1. Route tree, as found

| Route | What it is | Verdict |
|---|---|---|
| `/` | Student dashboard | **REDIRECT** — becomes the public landing; app moves to `/home` |
| `/welcome` | Second landing (hero only, no other sections) | **REMOVE** — duplicate |
| `/brilliant` | The full original landing: 9 sections | **ADAPT** — this becomes `/` |
| `/brilliant/*` (12 more) | Cloned marketing/app pages | **DEVELOPMENT_ONLY** |
| `/paths` | Year roadmap | **REDIRECT** → `/program` |
| `/course/[index]` | Month gameboard | **KEEP** as alias; canonical `/program` |
| `/lesson/[lessonId]` | Lesson player | **KEEP** |
| `/you` | Progress | **ADAPT** — rebuild on `you-dashboard.tsx` |
| `/study` | Index of the reverse-engineering study | **REMOVE** from product |
| `/teacher` | Class projection | **DEVELOPMENT_ONLY** (no auth) |
| `/dev/*` (3) | Labs | **DEVELOPMENT_ONLY** |
| `/api/*` (7) | Learning, Nova, exec, teacher | **KEEP** |

## 2. The landing gap — the central finding

`/brilliant/page.tsx` composes **nine** sections:

`Nav · Hero · StatsBand · KojiSection · FeatureRow×N · SubjectTabs · FeatureRow×N · Testimonials · GetStarted · Footer`

`/welcome` composes **two**: a hand-written nav and `Hero`.

So the previous phase adapted the hero and left seven sections of finished,
animated, measured work unused. That is the same mistake the last correction
was about, at a smaller scale. This phase adapts the whole page.

Per-section disposition:

| Section | Verdict | Why |
|---|---|---|
| `Nav` | ADAPT | Floating pill, `AnimatePresence` CTA revealed past 600px of scroll |
| `Hero` | KEEP | Already prop-extracted; clip, seek-and-retry, `.b-press` physics intact |
| `StatsBand` | **REMOVE** | Three hardcoded marketing numbers. We have no such figures and inventing them is prohibited |
| `KojiSection` | ADAPT | Becomes the Nova section — the mascot band is where Strobi belongs |
| `FeatureRow` | KEEP | Zero Brilliant strings; framer-motion reveal + IntersectionObserver-gated video. The most reusable component in the tree |
| `SubjectTabs` | ADAPT | Course tabs → the nine months |
| `Testimonials` | **REMOVE** | Quotes from people who do not exist. Fabricated outcomes |
| `GetStarted` | ADAPT | CTA band, prop-driven already |
| `Footer` | ADAPT | Brilliant links throughout |

## 3. Mascot

| Piece | Verdict |
|---|---|
| `lesson/koji.tsx` — Rive `NEST_Koji_Built` | **REMOVE from product.** Brilliant's character, and the asset is theirs |
| Its placement, z-index, bubble, verdict wiring | **KEEP** — that machinery is ours to reuse |
| `gameboard-pedestal.tsx`, `app/pedestal.tsx` Rive | **BLOCKED** — `koji-gameboard.riv` is a Brilliant asset. Needs replacement before deploy |
| `koji-section.tsx` | ADAPT → Nova section |

## 4. Strobi — licence, established from package metadata

```
@bible-strong/avatar-react  version 0.1.0  license AGPL-3.0-only
versions available: ["0.1.0"]   ← no newer release
```

**AGPL-3.0-only is incompatible with a paid, network-delivered proprietary
school product.** §13 requires offering the complete corresponding source of
the whole work to every user who interacts with it over a network.

**Resolution: the renderer is ours; the definition is data.**

`strobi.avatar-2.json` is a data document — 28 expressions of head rotation and
eye geometry, 25 animations as step sequences with hold/transition timings. The
measured ranges:

```
head.x/y/z   -20.9 … 35.3      eye.width   19.1 … 56.1
eye.height   12.4 … 85.3       eye.y      -20.5 … 40.0
eye.angle   -36.2 … 28.8       spacing    35.0 … 70.9
perspective  always 1          playback   all 25 loop
transitions  all smooth        body       sphere 240³ #77bb41
```

Reading a documented data format with our own code creates no AGPL obligation.
The package is not installed and not imported. The adapter stays swappable, so
if the licence is resolved the official renderer drops in behind the same
wrapper.

**The 25 animation keys are authoritative and validated at build:**
`sleeping waking idle listening thinking searching working excited bored
suspicious angry drowsy happy curious confused surprised proud shy sad laughing
scared playful celebrate correct-animation error`

Note `correct-animation` is hyphenated and there is no `celebrating`.

## 5. Fonts

`layout.tsx` carries its own RELEASE BLOCKER note: CoFo Brilliant and CoFo
Robert are commercially licensed by Contrast Foundry. They are loaded only for
`/brilliant/*`. **Verdict: the product surface uses IBM Plex Sans + JetBrains
Mono (SIL OFL, Cyrillic incl. Kazakh); the CoFo declarations must go when the
reference routes do.**

## 6. Auth

**Does not exist.** Identity is an httpOnly `sx_anon` cookie minted in
`proxy.ts`. There is no sign-in, no account, no display name.

Consequences accepted for this phase:
- `/home`, `/program`, `/you`, `/lesson/*` cannot be *gated*; they are scoped to
  the cookie's subject and show that subject's own data only.
- The greeting must not hardcode a name. `"Bekarys"` is removed.
- `/teacher` and `/dev/*` refuse in production, which is the only defensible
  position without auth.

## 7. Persistence classification

| State | Status |
|---|---|
| Lesson completion, attempts, evidence | **PERSISTED** — PGlite/Postgres via the ledger |
| LearnerState, decisions | **PERSISTED** — projection, rebuilt by the sweep |
| Locale | **SESSION_ONLY → must become PERSISTED** (localStorage is acceptable here: it is a UI preference) |
| Lesson position within a lesson | **UNIMPLEMENTED** — a refresh mid-lesson restarts it |
| Streak, weekly goal | **DEMO** — hardcoded 0 and "0 of 40 min". No activity-day table exists |
| Display name | **UNIMPLEMENTED** |

Streak and weekly goal are the two visible fabrications. Either wire them to
real activity days or remove them. This phase wires the weekly minutes from
real episodes and **removes the streak**, because nothing records activity days.

## 8. Learning Intelligence

Present, imported, wired, and **must not be forked**: `packages/*` (209 tests),
`schools/learning/*` adapters, `schools/reducer/sweep.ts`, `schools/nova/*`.
Nova's policy route already enforces `grantHintLevel` server-side. This phase
consumes it; it does not touch it.

## 9. Nova backend

`POST /api/nova/hint` exists and streams SSE with a policy frame. Providers:
`echo` (default, offline) and `deepseek` (server-side key). **REUSE.** No second
provider stack.

## 10. Blocked

| Item | Blocker |
|---|---|
| `@bible-strong/avatar-react` | AGPL-3.0-only — own renderer instead |
| `koji-gameboard.riv`, `meet_koji.riv` | Brilliant assets — pedestals still use one |
| CoFo fonts | Contrast Foundry licence — confined to `/brilliant/*` |
| Real auth | Not built; gating is impossible until it is |
| Data residency (PDF p.4) | Deployment decision, not code |
