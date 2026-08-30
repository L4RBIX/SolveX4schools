# Brilliant course-gameboard forensics

Reference route, inspected live and logged in:

```
https://brilliant.org/courses/pixel-pusher/?from_llp=computer-science
```

Every value in the REFERENCE column was either read out of the live runtime with
`getBoundingClientRect()` / `getComputedStyle()` at `innerWidth: 1470`, quoted
from the served HTML, resolved out of the site's own Panda stylesheet, recovered
from its minified JS, or derived by rasterising its own SVG exports. Nothing
here was eyeballed from a screenshot.

## Evidence captured

| what | where |
| --- | --- |
| server-rendered HTML | `scratchpad/ref/course.html` (322 KB) |
| the site's 3 stylesheets | `scratchpad/ref/css/*.css` (1.1 MB, Panda CSS) |
| the site's 65 JS chunks | `scratchpad/ref/js/*.js` (3.3 MB) |
| 30 pedestal SVGs pulled from the HTML | `scratchpad/ref/parts/pedestal-NN.svg` |
| reference screenshots | `docs/design/reference/*` |
| our own captures + geometry report | `docs/design/reference/solvex/*` |

`scratchpad/` is outside the repo on purpose; `docs/` is not served by Next.js.
See [§ Licensing](#licensing).

> **Harness limits, and how one of them was lifted.** The browser-extension tab
> reports `document.hidden === true`, which suspends `requestAnimationFrame` and
> throttles timers, so nothing animated could be sampled through it and `:hover`
> would not latch. That blindness caused a real error in the first pass — it is
> why this document once claimed the board barely animates.
>
> It was lifted by rendering `koji-gameboard.riv` locally and capturing frames in
> Playwright, where rAF runs. That is how the rotating selection ring and the
> arrival particles were found. Where a value below says *captured*, frames were
> compared; where it says *quoted*, it came from the bundles.
>
> One limit remains: a docked panel held the extension's window at 1470 and 614
> CSS px, so reference *screenshots* exist only at those two widths. The five
> required viewports were verified on **our** build, where the harness sets the
> viewport exactly.

---

## 0. Three things that made it not look like the original

Matching every measurement at zero delta is not the same as looking right, and
for a while it did not look right. Captured properly — the reference loaded in
Playwright at 1440 rather than through the extension's cramped window — three
composition errors were obvious that no geometry table had caught:

| | reference | ours (before) | fix |
| --- | --- | --- | --- |
| course-card art | **100×100** | 197×154 | the illustration was half again too big, making the whole left card taller than the reference's and unbalancing the two columns |
| the "Start" card | **always on screen**, at `bottom: 40px`, from load | hidden until you scrolled | the board loaded with no call to action at all — the most prominent element of the reference's composition simply absent |
| above the first level header | **nothing** | our track switch | it occupied the head of the board column and pushed every level down ~150px; moved to the left column, where course-level meta belongs |

Side by side after the fixes: `docs/design/reference/compare-board.png`.

## 1. Page grid

| measurement | REFERENCE | SOLVEX (now) | DELTA |
| --- | --- | --- | --- |
| scroll owner | `fixed; inset: 65px 0 0; overflow: hidden auto` | same | 0 |
| scroller flex | `justify-content: center; align-items: flex-start; gap: 32px` | same | 0 |
| scroller padding | `20px 112px 0` | `20px`, `112px` at `xl` | 0 at ≥1280 |
| left card | `sticky; top: 41px`, basis 350, min-w 350 | same | 0 |
| left-card art | **100×100** | 100×100 | 0 |
| board column | 488px (a `max-w` cap resolved by flex, not a declared width) | same | 0 |
| **top scrim** | fixed 64px child of the scroller, `#141414 0% → 85% @40% → transparent`, `pointer-events: none`, above the sticky headers | **was absent — now present** | fixed |

The scrim is not decoration: the level headers are `position: sticky`, so
without it a row scrolls out from under a pinned header on a hard edge.

## 2. Level header

Three elements, not a bordered box:

```
div  sticky top:41px  488x64  padding:0 16px  z-index:1   margin-bottom:200px
├── button  456x64  radius:18px  background:#141414  z-index:1
└── div     460x72  radius:20px  background:#7139CC | #4C4C4C  z-index:0  (absolute)
```

| measurement | REFERENCE | SOLVEX (now) | DELTA |
| --- | --- | --- | --- |
| header wrapper | 488×64, `padding: 0 16px`, `top: 41px` | same | 0 |
| button | 456×64, radius 18px, `#141414` | same | 0 |
| slab box | 460×72, radius 20px | same | 0 |
| slab overhang | top 2, bottom 6, **left 2, right 2** | same | 0 |
| slab colour, current / other | `#7139CC` / `#4C4C4C` | same | 0 |
| header margin-bottom | 200px | 200px | 0 |
| eyebrow | 12px / 700 / lh 1.1 / ls 0.48px / uppercase | same | 0 |
| title | 16px / medium / lh 1.4 (22.4px) | same | 0 |
| **press** | button `translateY(4px)`; slab 72→68px and top `-2px`→`+2px`; no transition | **was absent — now present** | fixed |

The previous implementation's comment claimed the slab is "translated -230px on
x", so "the outline reads thicker on the right than the left". That misreads the
computed style: the live values are `inset: -2px -216px -6px 244px` **with**
`transform: translateX(-230px)`, and the two cancel to a symmetric `-2px`. The
old code's `left-0 right-0` made the slab 456 wide instead of 460, so the purple
outline vanished from the sides.

## 3. Vertical rhythm

Measured across all six of the reference's level sections:

| measurement | REFERENCE | SOLVEX before | SOLVEX now |
| --- | --- | --- | --- |
| column gap between sections | 30px | 56px | 30px |
| header → stack | `margin-bottom: 200px` | 40px | 200px |
| stack margin-top, level 1 | −120px | 0 | −120px |
| stack margin-top, levels 2+ | −200px | 0 | −200px |
| stack margin-bottom | 60px | 0 | 60px |
| gap between rows | 30px | 30px | 30px |
| first row margin-top | 45px | absent | 45px |
| row height | 134px (every row, every level) | 134px | 134px |
| row pitch | 164px | varied | 164px |

**This was the single biggest fidelity break.** The product route passed
`evenRhythm`, which replaced the reference's negative-margin collapse with a
flat `gap-14`. The comment justifying it claimed the reference's rows are "~230px
tall because a Rive pedestal is much taller than our static one". They are not:
every row in every level measures exactly **134px**, the same as ours. The
reference's numbers were always directly applicable. The prop is gone.

## 4. Node row

```
div  392x134  position:relative  scroll-snap-align:center   justify-content: center | flex-start | flex-end
├── div  392x76  absolute bottom:0  visibility:hidden        (scroll anchor)
└── div  274x134  display:flex  align-items:flex-end  gap:8px
    ├── div  128x134       (static <svg>, or <canvas> when current/selected)
    └── div  138x55   align-items:center  padding-bottom:29.5px
        └── p   -webkit-line-clamp: 3
```

| measurement | REFERENCE | SOLVEX (now) | DELTA |
| --- | --- | --- | --- |
| row width | 392px | **422px** | +30, deliberate |
| inner button | 274px | **304px** | +30, deliberate |
| label box | 138×55 | **168×55** | +30 wide, deliberate |
| **zig-zag amplitude** | **±59px** | **±59px** | **0** |
| pedestal box | 128×134, viewBox `0 0 186 195` | same | 0 |
| pedestal ↔ label gap | 8px | 8px | 0 |
| label clamp | 3 lines | 3 lines | 0 |

The one deliberate departure, and why it is safe: a 138px label is fine for
"Debugging Functions" and not fine for "Разобранный пример: прочитать,
преобразовать, посчитать". The brief allows widening the label provided the
rhythm survives, so the row was widened by the same 30px, which puts the swing
back at exactly the reference's ±59px. Verified across months 1–5 in both
locales: **0 labels clipped, 0 rows off 134px.**

## 5. Milestone states

The state vocabulary is not inferred — these are the names inside
`koji-gameboard.e2320c48.riv`:

```
node_INACTIVE-IDLE  node_ACTIVE-IDLE  node_idleIncomplete  node_idleComplete
select_TurnON  select_TurnOFF  select_OFF        hover_ON  hover_OFF
appear_PADLOCK  idle_PADLOCK  disappear_PADLOCK  icon_Padlock  icon_TimerLock
Blorb_idleComp  Blorb_idleIncomp  Blorb_disappear
Koji_Appear  Koji_Appear+Enter  koji_idle  Koji_FinishLesson  koji_enter_lesson
appear_particle  disappear_particle   Glow Opacity  Glow Position Y
```

The application binds exactly 12 inputs on state machine `node_all`, artboard
`Gameboard Node`: `color`, `icon`, `select`, `dark-mode`, `hover`, `level`,
`padlock`, `completed`, plus triggers `koji_appear`, `koji_appear_enter`,
`koji_disappear`, `koji_enter_lesson`. All except `select`, `hover` and
`dark-mode` are written once at load and never updated.

Its own semantics, quoted: `completed = isCompleted || isStarted`,
`padlock = !isCompleted && isMeterLocked`, `icon = isCompleted && !isLevelReview`.

**The decisive finding** — obtained by rendering the reference's own artboard
locally with each input set, since the public course page shows no completed
node: `completed` turns the whole disc **purple**. Selection is a separate
additive **halo ring**. So purple means "you have been here", and the ring means
"this is what you tapped". Those are independent, and our implementation now
models them independently.

The second, found only by capturing frames rather than reading code: **the
selection ring is not static and the mascot is not dropped in.** The ring turns
continuously on a 4087ms cycle, and the mascot's entrance begins with a spray of
particles out of which it coalesces. Both were missing from the first pass and
are the two things a learner notices most when they tap a milestone.

| state | REFERENCE | SOLVEX (now) |
| --- | --- | --- |
| FUTURE / unauthored | padlock states exist; not shown on this course | silver disc at `opacity: .35` — a padlock promises a key, ours means "not written yet" |
| AVAILABLE | silver disc; label `rgba(255,255,255,.4)` | same |
| ACTIVE (current) | the plate is blown out to **white** and blooms past its edge, ringed by a near-black trench — a well of light, not a coloured disc; the mascot's base sinks INTO it *(captured at 3x)* | same well; Nova at 52px with her base at 76px, washed by the glow |
| SELECTED | a purple arc sweeps around the disc over ~250ms, the groove flashes to pure white, and the ring then **rotates forever** — measured period **4087ms** *(captured)* | same, as a dashed ellipse stroke |
| COMPLETED | purple disc | purple disc + a 14px green check at the label's end |
| HOVER | `filter: brightness(0.9)`, no transition | same |
| PRESSED | **none in the app**; `cursor_down`/`cursor_up` exist in the artboard, unbound | 90ms compress, spring release — declared addition |

Label colour is the reference's own rule and it is simpler than ours was: every
unselected node shares `text.tertiary`, hover lifts to `text.secondary`, and
only the selected one is `#fff`. It does **not** colour-code completed vs locked
vs available — the disc carries that. We previously used four different greys.

## 6. The pedestal artwork

The reference's export is 20 paths under 6 luminance masks with 2 dead
gradients and a `mix-blend-mode: color` group — and most of it is fully
overpainted. Rasterised at 4× and histogrammed, the whole thing is **four flat
colours and four ellipses**:

```
silver   rim #999999   facet #ADADAD   face #E5E5E5   groove #CCCCCC
purple   rim #7E43E0   facet #9D62FF   face #C19CFF   groove #FFFFFF
```

Fitted geometry (viewBox `0 0 186 195`, ellipse-fit RMS 0.0003):

| shape | cx | cy | rx | ry | ry/rx |
| --- | --- | --- | --- | --- | --- |
| rim | 92.89 | 135.17 | 67.04 | 39.75 | 0.593 |
| top face | 92.89 | 126.34 | 53.93 | 32.39 | 0.601 |
| plate | 92.89 | 126.34 | 43.72 | 25.03 | 0.572 |
| inner | 92.72 | 126.37 | 33.73 | 19.14 | 0.567 |
| halo outer / inner | 93.00 | 138.70 / 137.71 | 93.00 / 81.58 | 57.10 / 48.13 | — |

Three things carry the whole illusion, and all three were missing from our
previous version:

1. **The side wall is an offset pair.** The face sits 8.83u above the rim and
   13.11u narrower. There is no drawn wall and — contrary to what the old
   implementation assumed — **no drop shadow and no gradient anywhere**.
2. **One triangle is the bevel.** White@0.2, apex above the disc on its centre
   line, base below it, clipped to the rim ellipse. The rim's two lower corners
   fall outside it and stay dark.
3. **The groove is broken, not a ring** — a 6.04u vertical strip knocked out at
   12 and 6 o'clock. That single detail is the difference between a machined
   platform and a coin.

`mix-blend-mode: color` over a grey stack is just a luminance map, so the purple
variant collapses to four more flats and needs no blend mode at all — which also
removes the failure where a `color` blend over a near-black page paints a dark
violet rectangle around the node. Verified: `#666666` under a purple `color`
blend resolves to exactly `#7E43E0`.

Our `sx-pedestal.tsx` is built from this table, not from their path data.

## 7. Selection card

| measurement | REFERENCE | SOLVEX (now) | DELTA |
| --- | --- | --- | --- |
| position | `sticky; bottom: 40px` | same | 0 |
| box / radius / border | 456×152, r40, 2px `#4C4C4C` | same | 0 |
| background | `#1E1E1E` | `--color-b-elevated` = `#1E1E1E` | 0 |
| padding / gap | `24px 16px 16px` / 16px | same | 0 |
| title | **20px** / 700 / 44px | 20px (was 24px) | fixed |
| CTA face | 420×48, radius 60px | same | 0 |
| CTA rest / transition | `translateY(-4px)`; `transform, box-shadow 0.1s ease-out` | same | 0 |
| CTA colour, "Start" | purple on a purple lip | same | 0 |
| CTA colour, "Jump here" | `rgba(255,255,255,.2)` on `rgba(255,255,255,.05)` | `b-fg/20` on `b-fg/8` | theme-safe equivalent |

The "Jump here" variant uses `b-fg` rather than literal white: the reference is
pinned to dark, this product supports both themes, and a hardcoded white pill is
invisible on the light surface. A repo test enforces that.

## 8. Interaction

Clicking a node in the reference does **not** navigate. It tracks the event,
sets `select`, calls `scrollIntoView({block:'center'})` — skipped when the node
is already within 140px of the viewport centre, and only on viewports ≥1280px
wide — and bounces the footer CTA if the node was already selected.

We now reproduce the selection, the centring, and the 140px bail. The CTA bounce
is not implemented.

## 9. Things the reference does that are worth NOT copying

- Nodes are `<div role="group">` with a bare `onClick`: not focusable, not
  announced, not keyboard-operable. Ours are real buttons with `aria-pressed`,
  `aria-current="step"`, and `aria-disabled` (rather than `disabled`, which
  would drop an unauthored node out of the tab order entirely).
- Rows carry `scroll-snap-align: center` but no ancestor sets
  `scroll-snap-type`, so the snapping is inert dead markup.
- `.panda-fw_medium { font-weight: medium }` and friends are invalid CSS — the
  theme ships no `fontWeights` scale, so Panda emitted the bare keyword.

## Licensing

| asset | class | status |
| --- | --- | --- |
| `koji-gameboard.e2320c48.riv` | REFERENCE_ONLY | in `public/`, so served; used only by `/brilliant/app/course` |
| `meet_koji.0dced838.riv` | REFERENCE_ONLY | same |
| Brilliant pedestal SVG paths | **replaced** | the product now draws `sx-pedestal.tsx` from the measured table above |
| `scratchpad/ref/**` | REFERENCE_ONLY | outside the repo, never committed |
| `docs/design/reference/*` | REFERENCE_ONLY | under `docs/`, which Next.js does not serve |

`scripts/gameboard-measure.mjs` enforces the product boundary at runtime: it
records every request `/course/1` makes at each of the five viewports and fails
if any touches `assets/original/brilliant` or a `.riv`. Current result: **0 at
every viewport**, against a positive control of **1** on `/brilliant/app/course`
— so the check is known to be capable of failing.

**Still open, and out of this phase's scope:** `public/assets/original/brilliant/`
is served by Next.js at `/assets/original/brilliant/...` whether or not a route
references it, and the whole `/brilliant/*` clone tree still renders Brilliant's
branding and art. That is a pre-existing release blocker for the clone routes,
not for the gameboard, and removing them is a product decision rather than a
fidelity fix.
