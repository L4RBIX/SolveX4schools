# Gameboard animation inventory

Reference: `https://brilliant.org/courses/pixel-pusher/?from_llp=computer-science`

> **Corrected after review.** An earlier version of this document claimed the
> gameboard barely animates. That was wrong, and it was wrong because of the
> method: I only had the *app's* CSS and JS, which really do contain almost no
> animation — but the motion lives inside the Rive artboard, where app-level
> greps cannot see it. Rendering `koji-gameboard.riv` locally and capturing it
> frame by frame showed two substantial animations I had missed: the selection
> ring **rotates continuously**, and the mascot's arrival **sprays particles**
> and coalesces out of them. Both are now implemented. The sections below are
> rewritten from those captures.

The headline about the CSS layer still holds: **the reference gameboard has
almost no CSS animation.** All 6,600 rules of its 1.1 MB Panda stylesheet
were parsed, the 149 classes actually present on gameboard elements were
extracted from the served HTML, and intersected against the 319 rules containing
`transition` or `animation`. **Zero matches.** The level-header press, the
pedestal hover, the label colour change and the board's reveal all *snap*.

Everything that does move is either a Rive state machine or one `motion` spring
on the footer card. That means an easing curve added to a CSS state is a
fidelity bug — *and* that "no CSS animation" says nothing about what the Rive
scene does. The two must be measured separately.

> Method. CSS/JS values are quoted from the site's own bundles. **Rive values
> are captured**: the artboard is rendered locally, an input is driven, and
> frames are screenshotted back-to-back in a real browser (Playwright, where
> `requestAnimationFrame` actually runs — the extension's automation tab reports
> `document.hidden === true`, which suspends rAF and is what made the first pass
> blind to all of this). Periods below are measured by finding the frame at
> which the image returns to its starting state.

---

## 1. Node hover

| | |
| --- | --- |
| TRIGGER | pointer over a node |
| REFERENCE | `filter: brightness(0.9)` on the pedestal `<svg>`, via `groupHover:panda-filter_brightness(0.9)` |
| DURATION | none — no transition rule exists on that class |
| EASING | n/a |
| SOLVEX | `group-hover:brightness-90` on `SxPedestal`, no transition |
| VERIFIED | yes — class quoted from the served HTML; absence of a transition confirmed by full-stylesheet intersection |

For a node already rendered by Rive (current or selected), hover additionally
sets the state machine's `hover` boolean, which drives `hover_ON` / `hover_OFF`.
We have no Rive, so the brightness change is the whole hover.

## 2. Node press

| | |
| --- | --- |
| TRIGGER | pointer down on a node |
| REFERENCE | **no CSS press state at all.** No `:active`, no transform, no transition on the node, its 128×134 box or its SVG. A `translateY` grep across all 65 JS chunks returns exactly one hit, and it belongs to the level header. |
| RIVE | the artboard *does* declare `cursor_down` and `cursor_up` inputs — but the application binds neither. They are reachable only through Rive Listeners inside the file, which we cannot inspect. |
| SOLVEX | `scale(0.96) translateY(1px)`, 90 ms `cubic-bezier(0.4,0,1,1)` in; release on `--ease-b-spring` over 520 ms |
| VERIFIED | **declared divergence.** This is ours, not a measurement. |

The brief asked for a press that feels tactile and warned against inventing a
generic one. Both halves are honoured by saying plainly which this is: the
reference's *app* ships no press, its *artboard* carries press inputs, and ours
is a deliberate addition sized to the artboard's own vocabulary. Removing it is
a one-line change if exact parity is preferred over feel.

## 3. Node selection

| | |
| --- | --- |
| TRIGGER | click |
| REFERENCE | swaps the static `<svg>` for a Rive `<canvas>` (128×134 CSS, 256×268 backing at DPR 2) and sets the `select` boolean → `select_TurnON`. **Captured:** a purple arc sweeps around the disc over ~250 ms, the broken groove flashes from `#CCCCCC` to pure white, and the ring then **rotates forever** — its gaps travelling the ellipse with a measured period of **4087 ms** (the frame at which the image returns to its start, 0.13% pixel delta). |
| ALSO | tracks `clicked_lesson_node`; calls `scrollIntoView({block:'center'})`, **skipped** when the node is already within 140 px of the viewport centre and only on viewports ≥1280 px wide; bounces the footer CTA if the node was already selected. It does **not** navigate. |
| DURATION | inside the `.riv`; not readable from the file's string table |
| SOLVEX | segmented purple ellipse stroke: `sx-ring-in` 260 ms draws the arc on, then `sx-ring-spin` 4087 ms linear infinite travels the dash. Groove whitens on select. Centring reproduced including the 140 px bail. |
| VERIFIED | **yes, from captured frames** — sweep, groove flash, and the 4087 ms rotation |

Rotation is `stroke-dashoffset`, never a `rotate` transform: the ring is an
ellipse, and rotating it in 2D tilts it off the board's isometric horizon. A
test enforces that the keyframe touches nothing but the dash.

## 4. Mascot arrival

| | |
| --- | --- |
| TRIGGER | mount, for the node that is current and not completed |
| REFERENCE | fires `koji_appear` once Rive reports ready — a load-time entrance, **not** a click response. **Captured order:** a spray of ~9 dots in the mascot's own colour rises and drifts above the pedestal; a beam column opens; the disc turns silver → purple with a white-hot core; the mascot then **coalesces out of the spray** inside the beam, growing from roughly a third of its size, and settles. It is assembled, not dropped. |
| DURATION | inside the `.riv`. The app's own `router.push` delays of 800 / 1200 / 500 ms are upper bounds on the clips they wait for, and nothing tighter is knowable. |
| SOLVEX | `sx-particle` — 9 fixed dots, 900–1150 ms staggered 0–340 ms, rising and fading; `sx-nova-beam` 900 ms `ease-out`; then `sx-nova-arrive` 620 ms on `--ease-b-spring` after a 320 ms lead, growing from `scale(0.35)` so Nova coalesces rather than falls |
| VERIFIED | **order and composition yes, from captured frames**; absolute clip durations are still ours, since the `.riv`'s internal timings are not readable |

The particle table is fixed rather than random: the board server-renders, and a
random scatter mismatches on hydration.

`--ease-b-spring` is a `linear()` sampled from the reference player's own
`transition` declaration; it overshoots to 1.027 at 54% and settles at 100%.

## 5. Level header press

| | |
| --- | --- |
| TRIGGER | pointer down on a level header |
| REFERENCE | button `translateY(4px)`; the slab behind it shrinks 72 → 68 px and moves its top edge from `-2px` to `+2px`, so the purple lip is swallowed. Hover drops slab opacity to `.8`. |
| DURATION | none — snaps |
| EASING | n/a |
| SOLVEX | `active:translate-y-1` on the button, `group-active:top-0.5` on the slab, no transition |
| VERIFIED | yes — recovered from the header's source style object in `js/3ofbbah1jeseb.js` |

This one is easy to miss entirely, and it is the board's only real CSS press.

## 6. Footer card

| | |
| --- | --- |
| TRIGGER | selection changes; and a bounce when an already-selected node is re-clicked |
| REFERENCE | the container animates `bottom` with `transition: bottom 0.3s ease`. The only spring on the page is the re-click bounce: `{type:'spring', bounce:0.7, duration:1.8}`, `y: [-8, 0]`, flag reset at 250 ms |
| VISIBILITY | the card shows whenever a node is selected. The reference's `-150px 0px -100px 0px` / threshold `.5` observer drives its **jump-back-to-current** button, not this card. |
| SOLVEX | 300 ms `ease-out` slide-in, matching the 0.3s; card now shows on selection (see below); bounce not implemented |
| VERIFIED | yes for visibility and duration; bounce not built |

**A bug this uncovered.** Our board hid the card whenever its node was on
screen, on the reading that "the original hides the CTA while its own node is on
screen". Applied to a *selection*, that suppressed the card with the very node
the learner had just tapped to summon it — clicking a milestone produced no
"Jump here" at all. The rule now applies only to the default card offering the
learner's current lesson, which is the case the original comment described.

## 7. CTA button

| | |
| --- | --- |
| TRIGGER | pointer down on Start / Jump here |
| REFERENCE | face rests at `translateY(-4px)` over a `0 4px 0 0` shadow; pressing collapses both. `transition: transform, box-shadow 0.1s ease-out` |
| COLOURS | primary "Start" is purple; secondary "Jump here" is `rgba(255,255,255,.2)` on a `rgba(255,255,255,.05)` lip |
| SOLVEX | identical transform, shadow and timing; both colour variants now implemented |
| VERIFIED | yes — measured live off both rendered cards |

The reference also runs a `shimmer` keyframe over its primary CTAs
(`6.4s cubic-bezier(.16,1,.7,1) infinite`, a 150×56 SVG sweeping `left: -100% →
100%` in the first 25% then hiding). It is the *only* keyframe of the 47 in the
stylesheet that the gameboard can reach. Not implemented here.

## 8. Scroll

| | |
| --- | --- |
| REFERENCE | `scroll-behavior` appears nowhere; smooth scrolling is `scrollIntoView` in JS. The rows carry `scroll-snap-align: center` but **no ancestor sets `scroll-snap-type`**, so snapping is inert — dead markup. |
| SOLVEX | JS smooth scroll on select; no snap |
| VERIFIED | yes |

## 9. The scrim

Not an animation, but it is what makes scrolling read correctly: a 64 px fixed
gradient at the top of the scroller, page colour → transparent, `pointer-events:
none`, above the sticky headers. Without it, rows collide with a pinned header
on a hard edge. It was missing from our board entirely and is now present.

---

## Remaining differences

| # | difference | why |
| --- | --- | --- |
| 2 | we add a node press the reference's app does not have | brief asked for tactility; artboard carries `cursor_down`/`cursor_up`; **driving `cursor_down` on the real artboard produced zero pixel change**, so the reference genuinely has no press — ours is a declared addition |
| 4 | mascot arrival timing is ours | the `.riv`'s internal clip durations are not readable; the ORDER and the coalesce are captured, the millisecond values are not |
| 6 | footer card bounce on re-click not implemented | reference values known (`spring`, bounce 0.7, 1.8 s); simply not built yet |
| 7 | CTA shimmer not implemented | deliberate — a looping shimmer on a school product's primary action is noise |
| — | completed node also carries a small green check | the reference marks completion only by turning the disc purple; a purple-only signal does not survive a colour-vision difference |
