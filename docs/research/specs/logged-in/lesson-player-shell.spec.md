# Lesson Player — Shell Specification

**Source:** `https://brilliant.org/courses/algorithms-greedy-dp/scheduling-problem/scheduling-meetings/`
**Measured:** 2026-08-25, authenticated session, viewport **1470 × 776** (layout viewport; screen-clamped, see note)
**Method:** `getComputedStyle()` per element + live CSS rule inspection. No values estimated from screenshots.

> **Viewport note.** The host screen is 1470 CSS px wide, so a true 1440 viewport was not
> attainable. All measurements below were taken at 1470. The card is `position: fixed` with
> `left/right: 32px`, so its width is `viewport - 64`. At 1440 the card is 1376 wide, not 1406.
> Every horizontal value marked *(derived)* must be recomputed from the viewport, not hardcoded.

---

## Stack detected

- **Next.js** (`div#__next`, `/_next/static/…`)
- **Panda CSS** atomic classes (`panda-d_flex`, `panda-bg_bg.primary`, …) with `data-slot` semantics
- Fonts: **CoFo Brilliant** (UI), **Source Code Pro** (mono). 17 woff2 faces loaded.
- Component contract is driven by `data-*` attributes, not class names — mirror the attributes.

---

## Root layout

```
div#__next
└ div  [panda-d_flex panda-bg_bg.primary panda-flex-d_column panda-h_100dvh]   0,0,1470,776
  └ div [flex column, flex:1]                                                  32,0,1406,744
    ├ div [data-navbar="true"]            — top bar                            32,0,1406,64
    └ div [data-slot="fade"][data-visible]— page fade wrapper                  32,64,1406,680
```

- Root height: `100dvh` (dynamic viewport height — **not** `100vh`).
- Body background: `rgb(20, 20, 20)` (`#141414`).
- Body text: `rgb(255, 255, 255)`, `font-family: "CoFo Brilliant", sans-serif`, 16px / 24px.

---

## Page fade wrapper — `[data-slot="fade"]`

Measured box `32, 64, 1406, 680`. Display flex, column.

| `data-visible` | opacity | transition |
|---|---|---|
| `"true"`  | `1` | `opacity 0.2s cubic-bezier(0, 0, 0.2, 1)` |
| `"false"` | `0` | `opacity 0.1s cubic-bezier(0.4, 0, 1, 1)` |

Both values read from the live rule, not inferred: fade-in is 200ms *decelerate*, fade-out is
100ms *accelerate*.

---

## Top bar — `[data-navbar="true"]`

Outer wrapper `panda-flex-sh_0`, height **64px**. Inner `[data-slot="hstack"][data-navbar="true"]`:

- `display:flex; justify-content:space-between; align-items:center`
- `gap: 48px`
- `padding: 0 10.5px`
- `position: sticky`, `z-index: 855`
- `min-height: 64px`

### Left group — box `43, 8, 114, 48`

**Close button** — `[data-slot="icon-button"][aria-label="Close"]`
- `48 × 48`, `padding: 16px`, `min-width: 48px`
- `border-radius: 6px`
- `border: 2px solid rgba(0,0,0,0)` (transparent ring reserved for focus)
- `position: relative; overflow: clip; text-align: center; cursor: pointer`
- Icon `svg` `16 × 16`, `viewBox="0 0 16 16"`, `color: rgba(255,255,255,0.5)`
- Path: `M8.00006 6.58577L3.05027 1.63599L1.63606 3.0502L6.58585 7.99999L1.63605 12.9498L3.05026 14.364L8.00006 9.4142…`

**XP placeholder** — `[data-xp-placeholder="true"]`, `width: 66.2188px`, `height: 0`.
Reserves symmetric space so the centre group stays optically centred.

### Centre group — `[data-slot="center"][role="group"]`, box `205, 0, 1076, 64`
`justify-content: center; gap: 12px`.

**Prev / next arrows** — 52 × 52 containers at x `341` and `1093`.
- Inner: `opacity: 0`, `transition: opacity 0.3s ease-in-out`, `top:50%`, `z-index:2`
  (`left:40px` for prev, `right:40px` for next)
- Button `[aria-label="left"][data-navigation-arrow-prev="true"]` /
  `[aria-label="right"][data-navigation-arrow-next="true"]`
- `padding:16px; border-radius:9999px; border:2px solid transparent`
- Disabled state: `[data-disabled]`, `color: rgba(255,255,255,0.2)`, `cursor: default`

**Progress bar** — box `405, 26, 592, 12`
- Wrapper `max-width: 592px`, `height: 12px`
- `[role="progressbar"][data-slot="progress"][data-progressing]`
- Track `[data-slot="progress-track"]`: `background: rgba(255,255,255,0.2)`,
  `border-radius: 9999px`, `position: relative`, `overflow: hidden`
- Fill is a child of the track (green — see Open items)

**Segment dots** — `[data-slot="hstack"]`, box `1009, 26, 72, 12`
- Exactly **3** dots, each `16 × 12`
- `background: rgba(255,255,255,0.05)` (empty state)
- `border-radius: 9999px`, `transition: 0.2s`
- x positions `1009 / 1037 / 1065` → pitch 28px → **gap: 12px**

> The bar + 3 dots together are the "segmented progress bar": one continuous bar for the
> current section, then 3 pills for the remaining sections.

### Right group — box `1328, 16, 99, 32`

**XP counter** — box `1328, 16, 67, 32`, `justify-content: flex-end`, `color: rgba(255,255,255,0.2)`
- Value `span` `35.18 × 22.4`: `font-weight: 500`, `line-height: 22.4px`, `text-align: right`,
  `min-width: 35.184px`, `position: relative`, with an **`position: absolute` inner span**
  → the number is an animated roll-up counter, not static text.
- Icon `svg` `32 × 32` (`viewBox="0 0 32 32"`), `margin-top: -2px`
  - Class encodes the state change: `panda-c_text.disabled` and
    **`[&[data-filled]]:panda-c_border.green.bold`** → grey at 0 XP, green once earned.

**Streak button** — `[data-slot="popover-trigger"][aria-label="Your current streak"][data-testid="streaks_button"]`
- `32 × 32`, `border-radius: 54px`, `gap: 8px`, `font-weight: 500`, `line-height: 20px`
- `margin-top: -2.5px`
- Contains a popover surface `200 × 185` at `z-index: 1800` (collapsed until opened)
- Inner `[data-slot="button-content"]` `26.23 × 26.23` — the lightning glyph

---

## Body: two-panel layout — `[data-panel="true"][data-panel-collapsed="true"]`

`display:flex; flex-direction:row; gap:32px; position:relative; flex:1`.

### A. Tutor sidebar (collapsed by default) — `[data-animated-in="true"]`

`width: 405px`, `flex: 0 0 auto`.

Inner column carries a **spring easing** used throughout the player — copy it verbatim:

```
transition: 0.833s linear(0 0%, 0.007 1.5%, 0.026 3%, 0.059 4.5%, 0.106 6.3%,
  0.209 9.5%, 0.558 19.3%, 0.658 22.4857%, 0.742 25.6714%, 0.812 28.8571%,
  0.87 32.0429%, 0.918 35.2286%, 0.957 38.4143%, 0.986 41.6%, 1.007 45.3%,
  1.021 49.4%, 1.027 54%, 1.027 60.9%, 1.007 83.2%, 1 100%);
```

Peak 1.027 → a real overshoot/settle spring. Do **not** substitute `ease-out`.

**Tutor toolbar** — `[data-slot="vstack"][data-tutor-toolbar="true"]`, box `32, 64, 64, 156`
- `padding: 20px 8px 32px`, `gap: 8px`, `position: absolute`, `z-index: 95`
- Button 1 `[data-slot="glass-button"][aria-label="report a problem"]` (flag icon)
  - `48 × 48`, `padding: 12px 22px`, `border-radius: 54px`,
    `border: 0.5px solid rgba(0,0,0,0)`, `color: rgba(255,255,255,0.2)`,
    `font-weight: 500`, `line-height: 20px`
- Button 2 — `48 × 48` (audio / speaker icon), same dock

**Scroll region** — `[data-slot="vstack"][data-scroll-container="true"][data-collapsed="true"]`
- `opacity: 0` while collapsed
- `transition: opacity 0.5s <spring easing above, 0.5s variant>`
- `min-height: calc(100% - 24px)`

**Top scrim** — `389 × 316`, `position:absolute`, `right:16px`, `bottom:280px`, `z-index:90`
- `background-image: linear-gradient(rgb(20,20,20) 0%, rgba(20,20,20,0) 100%)`

**Koji dock** — box `32, 660, 405, 84`
- `height: 84px`, `padding: 10px 8px 10px 0`
- `border-radius: 24px 24px 0 0`
- `z-index: 856`
- Inner `[data-slot="grid"]` `397 × 64`, `display:grid`, `gap: 12px 16px`
- Holds: Koji avatar, chat-bubble button, mic button

### B. Main lesson card — `[data-animate="true"][data-panel="true"]`

- **`position: fixed`**, `top: 64px; left: 32px; right: 32px; bottom: 32px`
- `z-index: 93`
- `background: rgb(20, 20, 20)`
- **`border-radius: 24px`**
- **`border: 2px solid rgba(255, 255, 255, 0.2)`**
- `transition: … 0.3s`

Because the card is fixed at `left/right: 32px` it **overlays** the collapsed sidebar; the
tutor toolbar (`z-index: 95`) and Koji dock (`z-index: 856`) sit above it.

**Sidebar open handle** — `[data-slot="icon-button"][aria-label="open sidebar"]`
- `24 × 676` at `left: -24px`, `opacity: 0`, spring transition (0.833s curve above)
- Grip: `4 × 34`, `background: rgba(255,255,255,0.3)`, `border-radius: 9999px`,
  `margin-right: 8px`

**Feedback bar** — grid `1402 × 429` at `top: 247px` (absolute) containing a
`1402 × 129` strip: `background-color: rgba(255,255,255,0)`, `opacity: 0`,
`transition: opacity 0.5s, background-color 0.5s`.
This is the correct/incorrect result banner; it fades **and** tints over 500ms.

**Footer / CTA row** — `[data-slot="box"][data-shake-stable="true"]`, box `34, 662, 1402, 80`
- `height: 80px`
- Inner `[data-visible="true"][data-chained="true"][data-animate="true"]`
- `data-shake-stable` is the anchor for the **wrong-answer shake**.

---

## Page transition model — **horizontal track, measured**

Lesson pages are **not** unmounted. Both remain in the DOM:

| page | `x` | note |
|---|---|---|
| page 1 | `-937` | previous, parked off-canvas left |
| page 2 | `465`  | current, centred |

Offset = `465 − (−937)` = **1402px** = exactly the card's inner width.
Pages are laid out on a horizontal track at a pitch of one card-width and the track is
translated on advance. URL hash tracks position: `#page-1`, `#page-2`, …

> **Open item:** whether the track moves via `transform` or a scroll container was not
> resolved before the session ended. Confirm before implementing (see Open items).

---

## Lesson content column

`[data-slot="box"][data-collapsed="true"]` → `[data-slot="vstack"][data-lesson-page-components="true"]`

- `max-width: 540px`, `width: 100%`, centred (measured `465 → 1005` in a 1470 viewport)
- `display:flex; flex-direction:column; align-items:center; gap: 16px`

### Illustration block
- `[data-slot="vstack"]`, `540 × 270`, `gap: 24px`, `margin: 0 0 24px`, `position: relative`
- `img` `540 × 270`, `[data-slot="img"]`

### Text block — `[data-slot="lesson-content"]`, `line-height: 25.6px`
- `h1` — `font-size: 32px`, `font-weight: 700`, `line-height: 42.88px`, `margin: 0 0 22.4px`
- `p`  — 16px / 25.6px, `margin: 0 0 22.4px`

### Scroll-down affordance — `[data-slot="icon-button"][data-hidden="true"]`
- `40 × 40`, `background: rgb(30,30,30)`, `border-radius: 9999px`
- `box-shadow: rgba(0,0,0,0.1) 0 0 15px 0`
- `position: absolute`, `z-index: 1300`, `opacity: 0`
- `transition: opacity 0.2s ease-out`
- Chevron-down `svg` 16 × 16, path `M1.89609 7.0524L0.474243 8.47424L8 16L15.5258 8.47424L14.1039 7.05…`

---

## 3D button — `[data-slot="button3d"]` (site-wide primitive)

Derived from the live Panda rules, not from appearance:

```css
[data-slot="button3d-face"] {
  transform:  translateY(var(--button3d-translate-y, -4px));
  box-shadow: 0 var(--button3d-shadow-y, 4px) 0 0 var(--button3d-shadow-color);
  transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
}
```

Pressing sets `--button3d-translate-y: 0` and `--button3d-shadow-y: 0` — the face drops onto
its lip. Measured rest state on the "Continue" CTA:

| token | value |
|---|---|
| button `border-radius` | `calc(56px / var(--button3d-x-scale, 1)) / 56px` (elliptical, compensates x-scale) |
| face `border-radius` | `60px` |
| face `padding` | `14px 24px` |
| face `background` | `rgb(229, 229, 229)` |
| face `color` | `rgb(0, 0, 0)` |
| face `box-shadow` | `rgb(179, 179, 179) 0 4px 0 0` |
| face `transform` | `translateY(-4px)` |
| face `font-weight` / `line-height` | `500` / `20px` |
| face `gap` | `8px` |
| button height | `48px` |
| hover | `opacity: 0.85`; `--button3d-shadow-color: black-alpha-400`; face bg `gray.800` (dark theme `gray.300`); `border-color: black-alpha-400` |
| disabled | face `background-color: bg.primary` + `background-image: linear-gradient(bg.disabled, bg.disabled)` |

**Shadow-colour variants available:** `green.600`, `orange.600`, `pear.600`, `pink.600`,
`red.600`, `yellow.700`, `purple.600`, `blue.600`, `teal.600`, `papaya.600`, `mint.800`,
`elevation.shadow.cta.default`, `elevation.shadow.cta.secondary.fill`,
`elevation.shadow.cta.secondary.outline`, `blackAlpha.200`, `blackAlpha.400`,
`whiteAlpha.900`, `transparent`.

**Width:** `width: 100%` with `max-width: var(--content-controls-width-lg, 340px)` at `lg`
and an `xl` variant; measured **367px** at 1470. Treat 340px as the `lg` default.

Container: `[data-slot="center"][data-gamer="true"][data-tutor="true"]`,
`padding: 16px 0`, `background: rgb(20,20,20)`, `z-index: 40`.

---

## Verified content (page 1 — scene setter)

- `h1`: `The Scheduling Problem`
- `p`: `Let's dive into a classic algorithmic problem — building a schedule without conflicts.`
  (em dash U+2014, straight apostrophe)
- CTA: `Continue`
- Image: `https://ds055uzetaobb.cloudfront.net/brioche/uploads/lessons/scene-setter-final-FtktQS.png`

Koji speech-bubble variant of the same beat (separate DOM node):
`Let's explore a classic algorithmic problem, building a schedule without conflicts.`

Tutor input hints rendered near the dock: `to type / / key .` and `for voice v v key`.

---

## Resolved since first draft

1. **Progress-bar fill** — `background-color: #9FE8B3`, `border-radius: 9999px`,
   **`transition: width 0.2s`**. Measured at 113 / 592 px (≈19.1%) after solving page 2.
2. **Koji dock** — grid `397 × 64` at the page's left padding,
   `grid-template-columns: 64px 317px`, `gap: 12px 16px`.
   - Koji is a **Rive canvas**, 128 × 168 CSS px, backing store 256 × 336 (DPR 2), flush to
     the viewport's left edge — so it overhangs its own 64px cell.
   - Chat/mic control: a **split pill** `120 × 52`, `border-radius: 9999px`, containing
     `[aria-label="chat with tutor"]` `60 × 52` (`radius: 9999px 0 0 9999px`), a `1 × 44`
     hairline divider, then the mic half. Icon colour `rgba(255,255,255,0.2)`.
   - The pill is **glassmorphic**, not a flat panel:
     ```css
     background-image:
       radial-gradient(49.79% 249.89% at 0.21% 54.81%,
                       rgba(41,204,87,0.2) 0%, rgba(41,204,87,0) 50%),
       linear-gradient(270deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.024) 100%);
     backdrop-filter: blur(18.36px) saturate(1.408);
     ```
     The green bleed is `#29CC57` — Koji's own hue, so he appears to tint the glass he
     stands beside.
3. **Tutor toolbar icons** — flag + speaker paths extracted in full; see
   `src/components/brilliant/lesson/icons.tsx`.
4. **Top-bar icons** — close, directional arrow (one up-path rotated 270°/90°), XP sparkle
   (32 × 32), and the streak bolt (19 × 25 viewBox at 26.24px, fill/stroke driven by
   `data-completed`). All extracted verbatim.

## Open items — must be measured, not guessed

1. Page-track mechanism: `transform` vs scroll container. The 1402px pitch is confirmed;
   the driver is not. *(Clone currently uses a `translateX(-index * 100%)` track, which
   reproduces the geometry but may not match the original's mechanism.)*
2. `button3d` **pressed** state is derived from the CSS variables, not observed — synthetic
   `pointerdown` does not trigger React's press state. Confirm with a real press.
3. The **green halo** around the card on a correct answer: `boxShadow` computed to `none` on
   the card, so it is painted by something else. Source unidentified.
4. Streak popover contents (`200 × 185` Rive canvas at `z-1800`).
5. Responsive behaviour at 768 / 390 — **not captured**. The clone is desktop-only so far.
6. `Start over` icon — the live SVG was never captured; the shipped icon is hand-drawn and
   flagged as such in `icons.tsx`.
7. Lesson page types beyond the scene-setter and the scheduler (multiple-choice, free
   response, the `Why?` and `Get help` panels) — not explored.
