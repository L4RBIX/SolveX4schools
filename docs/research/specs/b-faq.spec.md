# b-faq — brilliant.org/faq/ — UI Forensic Spec

**Target:** `https://brilliant.org/faq/`
**Key:** `b-faq`
**Captured:** 2026-08-21 via `curl` (Chrome 131 UA)
**HTTP status:** `200` · final URL `https://brilliant.org/faq/` · 82,007 bytes of HTML
**Reachable:** yes — full server-rendered markup, not an empty shell.

Source-of-truth artefacts used:
- SSR HTML (`/faq/`)
- CSS bundles: `/_next/static/chunks/1fm-51vueb4hl.css` (1,083,281 B — Panda CSS atomic bundle + tokens), `/_next/static/chunks/157prbu77y-tm.css` (2,883 B — `@font-face`), `/_next/static/chunks/25j833ur1vg3n.css` (24,957 B — KaTeX, unused on this page)
- Page JS module `/faq` → `static/chunks/3bkov1t39t18t.js` (contains the FAQ page component, the FAQ item data, the `Accordion` component and the `Upsell` component)
- Header/footer JS: `static/chunks/0wvm_gs0ell-f.js`, Button3D: `static/chunks/0krm0d2r20e_j.js`

Every value below is a **declared** value read out of those files. Nothing here is inferred from a screenshot and nothing is invented.

---

## 1. Overview

A stock Brilliant marketing page (`LearnerPage`, `fullWidth`) with four stacked full-bleed bands:

| # | Band | Interaction |
|---|------|-------------|
| 0 | Sticky app header (client-rendered) | static + sticky |
| 1 | Hero: `h1` + paragraph + green 3D "Get started" button (with animated shimmer) | static; button has hover/active states + a 6.4 s looping shimmer (time-driven) |
| 2 | "Frequently asked questions" — three independent accordion cards, 21 items total | **click-driven** (accordion) |
| 3 | `Upsell` band: dark navy, SVG line-art background, serif "Start your journey" + button + two app-store badges | static |
| 4 | Black global footer | static |

There is **no** scroll-driven behaviour on this page: no `IntersectionObserver`, no `position: sticky` except the header, no scroll-linked animation in any of the page's own components.

**Page root:** `<div data-slot="vstack">` — `display:flex; flex-direction:column; align-items:center; gap:0; min-height:100dvh; background-color:#f8f8f8` (`gray.50`).

### Document head (verbatim)
- `<html lang="en">`
- `<title>Brilliant | Learn by doing</title>`
- `<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover,interactive-widget=resizes-content">`
- `<link rel="canonical" href="https://brilliant.org/faq/">`
- `og:type` = `website`
- `og:image` = `https://brilliant.org/images/opengraph/learn-interactively.png`
- `og:description` = `Guided interactive problem solving that’s effective and fun. Try thousands of interactive lessons in math, programming, data analysis, AI, science, and more.`
- `twitter:site` = `@brilliantorg`, `twitter:card` = `summary_large_image`
- There is **no** `<meta name="description">` and **no** `og:title` on this page.

### JSON-LD
The page injects a `FAQPage` schema client-side (`next/script id="faq-json-ld"`, so it is **absent from the SSR HTML**). Shape:

```json
{ "@context": "https://schema.org", "@type": "FAQPage",
  "mainEntity": [ { "@type": "Question", "name": "<question>",
                    "acceptedAnswer": { "@type": "Answer", "text": "<answer, HTML allowed>" } }, … ] }
```
It contains all 21 questions. Note the JSON-LD array order is **About Brilliant → About Premium → About our courses**, which differs from the rendered order.

---

## 2. Design tokens actually declared (Panda CSS)

### Breakpoints (non-standard — read from the CSS, do not assume Tailwind defaults)

| Prefix | Media query | px |
|---|---|---|
| `sm` | `@media screen and (min-width:22.5rem)` | 360 |
| `md` | `@media screen and (min-width:30.0625rem)` | 481 |
| `lg` | `@media screen and (min-width:48.0625rem)` | **769** |
| `xl` | `@media screen and (min-width:62rem)` | 992 |
| `2xl` | `@media screen and (min-width:80rem)` | 1280 |

Everything this page calls `lg:` therefore flips at **769px**, not 1024px.

### Colors (light theme — the page's default)

| Token | Resolves to |
|---|---|
| `gray.50` | `#f8f8f8` |
| `gray.500` | `#999` |
| `gray.950` | `#141414` |
| `white` | `#fff` |
| `black` | `#000` |
| `blue.500` | `#456dff` |
| `blue.950` | `#080f28` |
| `green.500` | `#29cc57` |
| `green.600` | `#15b441` |
| `green.700` | `#009b2b` |
| `blackAlpha.100` | `#0000000d` = rgba(0,0,0,.05) |
| `blackAlpha.200` | `#0000001a` = rgba(0,0,0,.10) |
| `blackAlpha.700` | `#0009` = rgba(0,0,0,.60) |
| `bg.primary` | `white` |
| `bg.elevated` | `white` |
| `bg.green.primary` | `green.500` `#29cc57` |
| `bg.disabled` | `blackAlpha.100` |
| `border.primary` | `blackAlpha.200` rgba(0,0,0,.10) |
| `border.secondary` | `blackAlpha.100` rgba(0,0,0,.05) |
| `text.primary` | `#000` |
| `text.secondary` | `blackAlpha.700` rgba(0,0,0,.60) |
| `text.disabled` | `blackAlpha.300` |
| `text.placeholder` | `#999` |
| `text.onColor.primary` | `#fff` |
| `icon.onColor.primary` | `#fff` |

> **Token mapping warning for the builder.** The project palette is close but not identical. `bg-b-paper #F5F3F1` ≠ `gray.50 #f8f8f8`; `text-b-muted rgba(0,0,0,.4)` ≠ `text.secondary rgba(0,0,0,.6)`; `border-b-line rgba(0,0,0,.1)` matches `border.primary` but the **accordion borders use `border.secondary` = rgba(0,0,0,.05)**, which has no existing token. `bg-b-green #29CC57` is an exact match for `green.500`. Use the nearest existing token per the project rule and flag the delta; do not add new tokens.

### Radii
`none 0` · `sm .125rem` · `base .25rem` · `xs .375rem` · `md .5rem` · `lg .75rem` · `xl 1rem` · **`2xl 1.25rem` (20px — the accordion card)** · `3xl 2rem` · `full 9999px` · `circle 50%`

### Spacing scale (`--panda-spacing-*`, rem)
`0 0` · `0.5 .125` · `1 .25` · `1.5 .375` · `2 .5` · `2.5 .625` · `3 .75` · `3.5 .875` · `4 1` · `4.5 1.125` · `5 1.25` · `5.5 1.375` · `6 1.5` · `7 1.75` · `8 2` · `9 2.25` · `10 2.5` · `11 2.75` · `12 3` · `14 3.5` · `16 4` · `20 5` · `24 6` · `28 7` · `32 8` · `36 9` · `40 10` · `44 11` · `48 12` · `52 13` · `56 14` · `60 15` · `64 16` · `72 18` · `80 20` · `96 24`

`sizes` mirrors `spacing` (`--panda-sizes-6: 1.5rem`, `--panda-sizes-12: 3rem`). Named size: `--panda-sizes-app-bar: 64px`.

### Fonts
```
--panda-fonts-brilliant : "CoFo Brilliant", sans-serif      → font-b-sans
--panda-fonts-robert    : "CoFo Robert", sans-serif         → font-b-serif
--panda-fonts-code      : "Source Code Pro", monospace      → font-b-mono
--global-font-body      : "CoFo Brilliant", sans-serif      (html default)
```
`html` base: `line-height:1.5`, `-webkit-font-smoothing:antialiased`, `-moz-osx-font-smoothing:grayscale`, `tab-size:4`. Browser-default `font-size:16px` — nothing on this page overrides the root size.

Next.js font fallback metrics (declared in `157prbu77y-tm.css`, reproduce if matching the exact fallback matters):
- `coFoRobertFont Fallback` → `local(Arial)`, `ascent-override:92.49%`, `descent-override:28.93%`, `line-gap-override:0.0%`, `size-adjust:101.63%`; stack `coFoRobertFont, coFoRobertFont Fallback, Georgia, serif`
- `coFoBrilliantFont Fallback` → `local(Arial)`, `ascent-override:94.99%`, `descent-override:29.45%`, `line-gap-override:14.25%`, `size-adjust:105.27%`; stack `coFoBrilliantFont, coFoBrilliantFont Fallback, Arial, sans-serif`

### textStyles used on this page (exact declarations)

| textStyle | family | size | weight | line-height | letter-spacing |
|---|---|---|---|---|---|
| `display.4xl` | robert | 50px | 500 | 1.1 | -0.5px |
| `display.2xl` | robert | 36px | 500 | 1.1 | -0.36px |
| `display.xl` | robert | 30px | 500 | 1.1 | 0 |
| `heading.md` | brilliant | 20px | 700 | 1.25 | 0 |
| `heading.sm` | brilliant | 16px | 700 | 1.4 | 0 |
| `body.base` | brilliant | 16px | 400 | 1.5 | 0 |
| `body.xs` | brilliant | 12px | 400 | 1.5 | 0 |
| `ui.actions.base` | brilliant | 16px | 500 | 1.25 | 0 |
| `ui.nav.default` | brilliant | 16px | 400 | 1.5 | 0 |

(For reference, not used here: `display.3xl` robert/40px/500/1.1/-0.4px; `body.lg` brilliant/20px/400/1.5; `body.sm` brilliant/14px/400/1.5.)

### Shadows (fully resolved for the light theme)
```
elevation.subtle : 0 1px 3px #0000000a                 /* rgba(0,0,0,.04) */
elevation.base   : 0px 0px 15px 0px rgba(0,0,0,.10)    /* elevation.shadow.base  → blackAlpha.200 #0000001a */
elevation.md     : 0px 0px 25px 0px rgba(0,0,0,.20)    /* elevation.shadow.medium → blackAlpha.300 #0003 */
elevation.outline: 0px 0px 0px 3px #456dff             /* border.select → blue.500 */
```
Supporting alphas: `blackAlpha.300 #0003` (rgba(0,0,0,.20)), `blackAlpha.400 #0000004d` (rgba(0,0,0,.30)), `blackAlpha.800 #000000b3`, `blackAlpha.1000 #000`.
Token blocks are keyed `:where(:root,:host)` for light and `[data-theme=dark] :not(:is([data-theme=light] *,[data-theme=light]))` for dark; every value in this spec is the light one.

### z-index
`app-bar 999` · `sticky 1100` · `banner 1200` · `overlay 1300` · `modal 1400` · `popover 1500` · `shimmer-container 0` · `shimmer-svg 100` · `relative-front 1` · `relative-back -1`

### letter-spacings
`tighter -.05em` · `tight -.025em` · `normal 0em` · `wide .025em` · `wider .04em` · `widest .1em`

### Keyframes
```css
@keyframes shimmer { 0%{opacity:1;left:-100%} 25%{opacity:1;left:100%} 26%{opacity:0} to{opacity:0;left:100%} }
```

---

## 3. Section-by-section

### Section 0 — App header (`LearnerAppHeader`)

**Interaction model: static, `position:sticky; top:0`.**

The SSR HTML for `/faq/` contains only the *loading placeholder* — the real header hydrates client-side after a GraphQL `useGetCommonDataQuery`:

```html
<div data-slot="box" class="… panda-bd-b_1px_solid panda-bd-c_border.primary panda-h_appBar panda-w_full"></div>
```
i.e. `border-bottom:1px solid rgba(0,0,0,.10); height:64px; width:100%` and nothing inside.

Hydrated (logged-out) header, from `chunks/0wvm_gs0ell-f.js`:

Outer `Box`:
```
background: bg.elevated (#fff)
border-bottom: 1px solid border.primary (rgba(0,0,0,.10))
box-shadow: base → elevation.subtle (0 1px 3px #0000000a); lg(≥769px) → elevation.base
position: sticky; top: 0; z-index: app-bar (999)
padding-inline: base 1.5rem (24px), md(≥481px) 2rem (32px)
margin-inline: auto; width: 100%
transition-property: common; transition-duration: normal; transition-timing-function: ease-in
```
Inner `HStack`: `align-items:center; flex-wrap:nowrap; gap:2rem (8) at all sizes when logged out; height:64px; justify-content:space-between; max-width:1216px; margin-inline:auto; width:100%`.

Logged-out contents, left → right:
1. `BrilliantWordmark` link → `/` — `color:text.primary; height:1.5rem; max-height:3rem; min-height:1.25rem`, `text-decoration:none`, hover keeps `text.primary`.
2. `MainHeaderNav` — hidden below `lg` (769px). For an anonymous visitor it renders exactly **one** item: **`Courses`** → `/courses` (aria-label `View all courses`), with its icon. All other nav items (`Home`, `Koji`, `Family`, `You`, `Creator`) are gated on an active user and do not render here.
   Nav-link style: `align-items:center; border:0; border-radius:none; color:text.secondary; display:flex; height:calc(100% - 1px); overflow:hidden; position:relative; text-decoration:none; textStyle:ui.nav.default`, with `&::after { background:text.disabled; content:""; height:2px; position:absolute; top:100%; transition:transform 100ms linear; width:100% }`; on hover `color:text.primary` and the `::after` slides `translateY(-2px)`; when `[data-selected="true"]` → `color:text.primary; font-weight:medium` and `::after` is `text.primary` + `translateY(-2px)`.
   Nav icon box: `boxSize` base `1.5rem` → lg `1rem`; `min-width` base `3rem` → lg `1rem`. Label `<span>` is `display:none` below lg, `inline-block` at lg. Nav `HStack`: `flex:1; gap: base .25rem / lg 2rem; height:100%; margin-inline: base 0 / lg 1rem`.
3. Right `HStack` `gap:.5rem`:
   - **`Sign in`** — `Button` `variant="secondaryOutline"`, `display:none` below lg / `inline-flex` at lg, `height:3rem; padding-inline:1.5rem; padding-block:1rem`, `:hover { box-shadow: 0px 1px 3px rgba(0,0,0,.30) }  /* blackAlpha.400 #0000004d */`. Href: login URL built from the current path; click is intercepted to open the login modal.
   - **`Get started`** — `Button` `variant="primary" color="green"`, `height:3rem; padding-inline:1.25rem; padding-block:1rem`, same hover shadow. Href `/welcome/`. The label string is passed in by the FAQ page as `signUpButtonText: "Get started"` (the component's own default would be `Sign up` — on this page it is **Get started**).

A promotional `Banner` may render below the header, but it is data-driven (`useGetBannerQuery`), `ssr:false`, and **was not present** in this capture. Do not render one.

---

### Section 1 — Hero

Container `<div data-slot="vstack">`:
```
display:flex; flex-direction:column; align-items:center;
background: bg.primary (#fff)
gap: 0
padding-bottom: 3rem (48px)
padding-top: base 3rem (48px) → lg(≥769px) 5rem (80px)
padding-inline: 1.25rem (20px)
text-align: center
width: 100%
```
No max-width container — the band is full-bleed, only its children are constrained.

**`<h1>`** — `textStyle: display.2xl` → `lg: display.4xl`; `margin-bottom: 1.5rem (24px)`.
Computed: CoFo Robert, 36px/1.1/-0.36px/500 below 769px; 50px/1.1/-0.5px/500 at ≥769px. Color inherits `#000`.

> **Copy (verbatim):** `What is Brilliant?`

**`<p>`** — `color: text.secondary (rgba(0,0,0,.6)); margin-bottom: 2.5rem (40px); max-width: 906px; textStyle: body.base` (CoFo Brilliant 16px/1.5/400). Centered by the parent.

> **Copy (verbatim):** `Brilliant is a learning app for iOS, Android, and web that teaches STEM interactively. Whether you’re a student, professional, or curious lifelong learner, Brilliant’s lessons and personalized, hands-on problem solving approach help you build real understanding.`

**Button3D** — `<a role="button" tabindex="0" href="/welcome/">`, `colorPalette="green"`, `shimmer="animated"`.
Instance overrides: `width: 288px`, and `& [data-slot="button3d-face"] { width: 100% }`.

> **Copy (verbatim):** `Get started`

Full Button3D anatomy (from `chunks/0krm0d2r20e_j.js`) — reuse for both buttons on the page:

*Root (`[data-slot="button3d"]`)*
```
border-radius: calc(56px / var(--button3d-x-scale, 1)) / 56px   /* elliptical: 56px horiz / 56px vert */
cursor: pointer; display: inline-flex; outline: none; position: relative;
-webkit-tap-highlight-color: transparent;
&[data-disabled] { cursor: default; opacity: 1 }
&[data-loading]  { cursor: default; opacity: 1; pointer-events: none }
:focus-visible   { box-shadow: elevation.outline }
:hover           { opacity: .85 }
```
*Face (`[data-slot="button3d-face"]`)*
```
align-items: center; display: inline-flex; justify-content: center; gap: .5rem;
border-radius: calc(60px / var(--button3d-x-scale, 1)) / 60px;
padding-block: .875rem (14px); padding-inline: 1.5rem (24px);
position: relative; width: 100%;
textStyle: ui.actions.base  (CoFo Brilliant 16px / 500 / 1.25)
--button3d-shadow-color: var(--panda-colors-green-600)   /* green palette */
background: bg.green.primary (#29cc57)
color: icon.onColor.primary (#fff)
text-shadow: 0 0 3px rgba(0,0,0,0.25)
box-shadow: 0 var(--button3d-shadow-y, 4px) 0 0 var(--button3d-shadow-color)   /* HARD edge, no blur */
transform: translateY(var(--button3d-translate-y, -4px))
transition: transform var(--button3d-transition-duration, 100ms) ease-out,
            box-shadow var(--button3d-transition-duration, 100ms) ease-out
```
*Pressed / disabled / loading* — `:active > &, [data-active] > &, [data-disabled] > &, [data-loading] > & { box-shadow: none; transform: none }`.
*Disabled palette override* — `background-color: bg.disabled; background-image: none; border-color: transparent; box-shadow: none; color: text.disabled; text-shadow: none`.

This is exactly the project's `.b-physical` / `.b-press` idea (hard 4px bottom edge, no blur) but with **no border** and an **elliptical pill radius**; press collapses the 4px lift rather than translating down.

*Content span* — `[data-slot="button3d-content"]`: `align-items:center; display:inline-flex; gap:.5rem; position:relative; z-index: relative-front (1)`.

*Shimmer* (hero button only — the Upsell button does **not** have it):
```html
<span data-slot="shimmer">           <!-- border-radius:inherit; inset:0; height/width:100%;
                                          overflow:clip; pointer-events:none; position:absolute;
                                          z-index: shimmer-container (0) -->
  <svg viewBox="0 0 150 56" width="150" height="56" fill="none">   <!-- height:56px; width:150px;
       position:absolute; top:0; z-index: shimmer-svg (100);
       animation: shimmer 6400ms cubic-bezier(.16, 1, 0.7, 1) infinite -->
    <g clip-path="url(#CLIP)">
      <rect opacity="0.4" x="75"     y="-58.6328" width="51" height="150" transform="rotate(30 75 -58.6328)"      fill="url(#G1)"/>
      <rect opacity="0.4" x="127.826" y="-28.1328" width="26" height="150" transform="rotate(30 127.826 -28.1328)" fill="url(#G2)"/>
    </g>
    <defs>
      <linearGradient id="G1" x1="100.5"  y1="-58.6328" x2="100.5"  y2="91.3672"  gradientUnits="userSpaceOnUse">
        <stop offset="0.27"     stop-color="#F5EFFF"/>
        <stop offset="0.71"     stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="G2" x1="140.826" y1="-28.1328" x2="140.826" y2="121.867" gradientUnits="userSpaceOnUse">
        <stop offset="0.081302" stop-color="#F5EFFF"/>
        <stop offset="0.570844" stop-color="white" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="CLIP"><rect width="150" height="56" fill="white"/></clipPath>
    </defs>
  </svg>
</span>
```
Time-driven: one 6.4 s loop, sweeping `left: -100% → 100%` over the first 25 % then invisible for the rest. IDs must be unique per instance (`useId`).

---

### Section 2 — Frequently asked questions

**Interaction model: click-driven accordion. Three *separate* accordion roots — one per group. Each root is `multiple={false}`, i.e. single-open within its own card, and the three cards are independent of one another.** (`allowMultiple` defaults to `false` and the FAQ page never passes it.) Base UI `Accordion` with `keepMounted` — panels stay in the DOM and are toggled via the `hidden` attribute + a height transition.

Band container `<div data-slot="vstack">`:
```
display:flex; flex-direction:column; align-items:center;
gap: base 2.5rem (40px) → lg(≥769px) 4rem (64px)
padding-inline: 1.25rem (20px)
padding-block: base 3rem (48px) → lg 5rem (80px)
width: 100%
background: none → inherits page #f8f8f8
```

**`<h2>`** — `textStyle: display.xl` → `lg: display.2xl`; `text-align:center`.
Computed: CoFo Robert 30px/1.1/0/500 below 769px, 36px/1.1/-0.36px/500 at ≥769px.

> **Copy (verbatim):** `Frequently asked questions`

#### Accordion card (× 3, identical)
Outer `<div>`:
```
background: bg.primary (#fff)
border: 2px solid border.secondary (rgba(0,0,0,.05))
border-radius: 2xl (1.25rem / 20px)
color: text.primary (#000)
margin-left: auto; margin-right: auto
max-width: 800px; width: 100%
```
Inside it, `<Accordion.Root multiple={false} keepMounted>` renders `<div data-orientation="vertical" dir="ltr" role="region">`.

**Group title `<h3>`** (first child of the root):
```
border-bottom: 2px solid border.secondary (rgba(0,0,0,.05))
padding-block:  base 2.25rem (36px) → lg 2.25rem (36px)   /* unchanged */
padding-inline: base 1.5rem  (24px) → lg 3rem   (48px)
textStyle: base heading.sm (16px/700/1.4) → lg heading.md (20px/700/1.25)
```

**Items wrapper `<div>`:** `padding-inline: base 1.25rem (20px) → lg 1.5rem (24px)`.

**Item `<div>` (`Accordion.Item`, one per question):**
```
border-top: 2px solid border.secondary (rgba(0,0,0,.05))
&:first-child { border-top-width: 0 }
padding-inline: base 0 → lg 1.5rem (24px)
padding-block: 1.5rem (24px)
```
DOM attributes when closed: `data-orientation="vertical" data-index="-1" data-closed=""`.

**Header** — Base UI `Accordion.Header` renders an `<h3>` (so group `h3` and item `h3` are siblings/nested at the same level in the outline; reproduce as-is), wrapping the trigger `<button type="button">`:
```
align-items: center; background: none; border: none; cursor: pointer;
display: flex; padding: 0; text-align: left; width: 100%;
&:hover { background: none }
```
Trigger a11y attributes present in the SSR markup: `aria-expanded="false"`, `aria-disabled="false"`, `tabindex="0"`, `id="<generated>"`, `data-value="<slug>"`, `data-orientation="vertical"`, `data-index="-1"`.

**Question `<span>`:**
```
color: text.primary (#000)
flex: 1
font-weight: 700
padding-right: 1.25rem (20px)
```
No `textStyle` — inherits the document default (CoFo Brilliant, 16px, line-height 1.5).

**Chevron** — Lucide `chevron-down`, inline SVG (21 instances):
```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
     class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
```
CSS: `color: text.primary; flex-shrink: 0; width: 1.5rem (24px); transition: transform 0.2s;` and `[data-panel-open] & { transform: rotate(180deg) }`.

**Panel** — `<div role="region" aria-labelledby="<trigger id>" hidden style="--accordion-panel-height:auto;--accordion-panel-width:auto">`:
```
height: var(--accordion-panel-height)
overflow: hidden
transition: height 0.2s ease
&[data-starting-style], &[data-ending-style] { height: 0 }
```

**Panel body `<div>`:**
```
color: text.secondary (rgba(0,0,0,.6))
margin-top: 1rem (16px)
margin-bottom: 1rem (16px)
```
Inherits CoFo Brilliant 16px/1.5.

**Inline elements inside answers:**
- Link: `color: inherit; text-decoration: underline;` plus `target="_blank" rel="noopener noreferrer"`.
- List: `<ul>` `list-style-type: disc; margin-top: .25rem (4px); margin-bottom: .75rem (12px); padding-left: 1.25rem (20px)`; `<li>` `display: list-item`.

**Motion note for the Framer Motion / `motion/react` rebuild:** the original is a plain CSS height transition, 200 ms `ease`, from `0` to the measured content height, paired with a 200 ms chevron rotation. Match those two durations. Panels are kept mounted.


---

### Section 3 — `Upsell` band

**Interaction model: static.**

Container `<div data-slot="vstack">`:
```
display:flex; flex-direction:column; align-items:center; justify-content:center;
background-color: blue.950 (#080f28)
background-image: url(/images/homepage/upsell-bg.svg)
background-position: center
background-size: cover
color: #fff
gap: 3rem (48px)
height: auto;  md(≥481px) height: 94vh
min-height: 650px
padding-inline: base 1.25rem (20px) → md(≥481px) 2rem (32px) → lg(≥769px) 112px
padding-block: 80px
width: 100%
```

Inner `<div data-slot="vstack">`: `gap: 72px; text-align: center` (+ `display:flex; flex-direction:column; align-items:center`).

**`<h2>`** — inline `style="font-family:'coFoRobertFont', 'coFoRobertFont Fallback', Georgia, serif"` plus:
```
font-weight: 500
letter-spacing: tight (-.025em)
line-height: 1.33;  sm(≥360px) line-height: 1.2
text-align: center
font-size: 60px;  lg(≥769px) font-size: 96px
margin-bottom: 1.5rem (24px)
```
> **Copy (verbatim):** `Start your journey`

**`<p>`** — `font-size: 16px; md(≥481px) font-size: 20px; font-weight: normal; margin-bottom: 0`. Family inherits CoFo Brilliant. Color `#fff` from the band.
> **Copy (verbatim):** `Join over 10 million people learning interactively.`

**Button3D** — `<a role="link" tabindex="0" href="/welcome/">`, green palette, **no shimmer**.
Instance overrides:
```
height: 64px; max-width: 360px; min-width: 280px; width: 100%
& [data-slot=button3d-face] { font-size: 20px; height: 100%; line-height: 1.25; padding-inline: 1.5rem; padding-block: 1rem }
```
> **Copy (verbatim):** `Get started`

Behaviour: if a user session exists the click is intercepted and routed to the home URL; otherwise it navigates to `/welcome/`. An analytics event `get_started_clicked` fires with `cta_type: "footer"`, `cta_persona: "learner"`, `page_type: <asPath>`. For a static clone, a plain link to `/welcome/` is the faithful no-session behaviour.

**App store badges** — `<div data-slot>` `align-items:center; display:flex; flex-direction:row; justify-content:center; gap: base 14px → lg(≥769px) 22px`.
Each badge is `<a>` `border-radius: lg (.75rem); display:inline-flex; outline-color:transparent;` and on `:focus-visible` `outline: 3px solid blue.500` with `outline-offset: 2px`. Image: `display:block; height: base 44px → lg 48px; width:auto`.

| alt (verbatim) | src | href |
|---|---|---|
| `Get it on Google Play` | `/images/app-store-badges/get-it-on-google-play.svg` | `https://play.google.com/store/apps/details?id=org.brilliant.android&listing=try-brilliant-app` |
| `Download on the App Store` | `/images/app-store-badges/download-on-the-app-store.svg` | `https://apps.apple.com/app/apple-store/id913335252?pt=105095803&ct=nux_qr_code&mt=8` |

---

### Section 4 — Footer

**Interaction model: static.**

> ⚠️ **The footer currently in the repo (`src/components/brilliant/footer.tsx`) does not match this page.** Its column titles, link labels, glyphs and white background are all invented. The real footer is specified below. That file is owned by another agent — flag, do not silently diverge.

Outer `<div data-slot="flex">`: `display:flex; background: black (#000); justify-content:center; padding-top: 5rem (80px); width: 100%`.

Inner `<div data-slot="box">`:
```
max-width: 100%;  sm(≥360px) 432px;  lg(≥769px) 1216px
margin-left:  1.5rem (24px);  lg 2.5rem (40px);  2xl(≥1280px) 2rem (32px)
margin-right: 1.5rem (24px);  lg 2.5rem (40px);  2xl 2rem (32px)
width: 100%
```

**Top row** `<div data-slot="flex">`: `display:flex; align-items:flex-start; flex-direction:column; 2xl(≥1280px) flex-direction:row; gap:0; justify-content:space-between; margin-bottom: 5rem (80px); lg(≥769px) 8rem (128px); width:100%`.

**Wordmark link** `<a href="/">` — `margin-bottom: 3rem (48px); 2xl margin-bottom: 0; width: 40%; 2xl width: 25%`.
Inline SVG: `width="114px" height="27px" viewBox="0 0 114 27" fill="none"`, `flex-shrink:0; color:#fff; height:32px`. Eleven `<path fill="currentColor">` elements, in this order:
```
M39.6614 0H35.8083V3.84981H39.6614V0Z
M26.2288 9.53622H25.84V7.52301H21.9869V26.4895H25.84V16.2822C25.84 12.9622 27.8548 10.843 31.0009 10.843H33.546V7.52301H30.8948C28.9153 7.52301 27.36 8.19408 26.2288 9.53622Z
M39.6614 7.52301H35.8083V26.4895H39.6614V7.52301Z
M16.6493 11.9168C18.018 10.7533 18.8056 8.9962 18.8056 6.99324C18.8056 3.03747 15.7302 0 11.9833 0H0V26.4895H15.7302L19.0177 23.2402V14.5516L16.6493 12.2873V11.9171V11.9168ZM3.85302 3.35534H11.347C13.4679 3.35534 15.1293 4.98003 15.1293 7.06388C15.1293 9.14772 13.4679 10.8077 11.347 10.8077H3.85302V3.35534ZM15.0233 23.1342H3.85302V14.1984H15.0233V23.1342Z
M78.4744 9.39498H78.0856C76.2828 7.98221 74.3032 7.27582 72.1116 7.27582C66.5618 7.27582 62.1786 11.5495 62.1786 17.1299C62.1786 22.7104 66.3144 26.7368 71.9702 26.7368C74.3739 26.7368 76.3888 25.9951 78.0856 24.6176H78.4744V26.4896H82.3274V7.52305H78.4744V9.39498ZM72.1823 23.4168C68.6121 23.4168 65.7488 20.5912 65.7488 16.9887C65.7488 13.3861 68.6121 10.5958 72.1823 10.5958C75.7525 10.5958 78.5805 13.4214 78.5805 16.9887C78.5805 20.5559 75.7525 23.4168 72.1823 23.4168Z
M85.1199 7.52301V26.4895H88.9729V10.8784H97.3152V26.4895H101.168V10.7018L97.9868 7.52301H85.1199Z
M60.0576 0H56.2046V3.84981H60.0576V0Z
M46.4838 0H42.5601V26.4895H46.4838V0Z
M114 10.8431V7.52305H107.779V2.08386H103.926V22.4985C103.926 24.7589 105.622 26.4896 107.885 26.4896H114V23.1342H107.779V10.8431H114Z
M60.0576 7.52301H56.2046V26.4895H60.0576V7.52301Z
M53.306 0H49.3823V26.4895H53.306V0Z
```
(11 paths — count verified against the SSR HTML.)

**Link columns** `<div data-slot="box">`:
```
display: grid; align-items: flex-start
grid-template-columns: 1fr;  lg(≥769px) repeat(4, 140px);  2xl(≥1280px) repeat(5, minmax(0, 1fr))
column-gap: 2rem (32px);  row-gap: 3rem (48px);  2xl row-gap: 0
flex: 1; max-width: 100%
width: md(≥481px) 576px;  lg(≥769px) 100%
```
Column label `<p>`: `color: gray.500 (#999); margin-bottom: 1rem (16px); textStyle: body.base (16px/1.5/400)`.
Link list `<div data-slot="vstack">`: `align-items:flex-start; display:flex; flex-direction:column; gap: .75rem (12px)`.
Link `<a>`: `border-bottom: 2px solid transparent; color:#fff; position:relative;` and `:hover { border-bottom: 2px solid; border-color: blue.500 (#456dff) }`. No `textStyle` → inherits 16px/1.5.

Columns 3 and 4 are wrapped in an extra `<div data-slot="vstack">` with `align-items:flex-start; display:flex; flex-direction:column; gap:1.5rem (24px)`.

| Column label (verbatim) | Links (verbatim label → href) |
|---|---|
| `Product` | `Courses` → `/courses/` · `Pricing` → `/subscribe/` · `Gift Brilliant` → `/gift-premium/` · `Resources` → `/resources/` · `Help` → `/help/` |
| `Solutions` | `Educators` → `/educators/` · `Homeschools` → `/start/homeschool/` |
| `Company` | `About us` → `/about/` · `Careers` → `/careers/` |
| `Behind the scenes` | `A Tutor in Every Home` → `https://blog.brilliant.org/a-world-class-tutor-in-every-home/` · `AI at Brilliant` → `https://blog.brilliant.org/hand-crafted-machine-made/` · `AI Evals for Learning Games` → `https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/` · `Visual Algebra` → `https://blog.brilliant.org/visual-algebra/` · `Decomposition and Abstraction` → `https://blog.brilliant.org/decomposition-and-abstraction/` |

**Social row** — the fifth grid cell. `<div data-slot="hstack">` `align-items:center; display:flex; flex-direction:row; gap:1.5rem (24px)`. Each `<a target="_blank">` is `color: gray.500 (#999)` with `:hover { color: blue.500 (#456dff) }`, containing an inline SVG with `flex-shrink:0` and `fill="none"`, single `<path fill="currentColor">`:

| aria-label (verbatim) | href | svg size / viewBox |
|---|---|---|
| `Brilliant on Facebook` | `https://www.facebook.com/brilliantorg` | `22×22`, `0 0 22 22` |
| `Brilliant on Instagram` | `https://www.instagram.com/brilliantorg` | `21×21`, `0 0 21 21` |
| `Brilliant on Twitter` | `https://twitter.com/brilliantorg` | `22px×22px`, `0 -1 20 19` |
| `Brilliant on LinkedIn` | `https://www.linkedin.com/company/brilliant-org/` | `20px×21px`, `0 0 20 21` |

Path data (verbatim, in the same order):
```
Facebook:  M0 11.0662C0.00127985 16.5108 3.9361 21.1467 9.28038 22V14.2648H6.48977V11.0662H9.28368V8.6313C9.15878 7.47753 9.55044 6.32766 10.3524 5.49353C11.1544 4.6594 12.2837 4.22747 13.4338 4.31489C14.2594 4.32831 15.0829 4.40229 15.8977 4.53625V7.2578H14.5074C14.0287 7.19472 13.5475 7.35378 13.1993 7.69018C12.8511 8.02657 12.6735 8.5039 12.7167 8.98768V11.0662H15.7647L15.2774 14.2659H12.7167V22C18.4964 21.0809 22.5493 15.7697 21.9393 9.91413C21.3293 4.05853 16.2698 -0.291573 10.4263 0.0152787C4.58284 0.322131 0.000928892 5.17851 0 11.0662Z
Instagram: M10.4942 21C7.62576 21 7.28762 20.9849 6.16824 20.936C5.29533 20.9073 4.43371 20.7301 3.62049 20.412C2.21347 19.8652 1.10089 18.7538 0.553859 17.3486C0.247553 16.5336 0.0823418 15.6726 0.0652971 14.8022C0 13.6868 0 13.3212 0 10.479C0 7.60662 0.0151582 7.27129 0.0652971 6.15935C0.0827146 5.29019 0.24792 4.43031 0.553859 3.61643C1.10029 2.20937 2.21468 1.09701 3.62399 0.551896C4.43862 0.244747 5.29996 0.079343 6.17057 0.0628743C7.28412 0 7.65025 0 10.4942 0C13.3859 0 13.7182 0.0151364 14.8201 0.0628743C15.693 0.0794854 16.5566 0.244871 17.3737 0.551896C18.7826 1.09762 19.8968 2.20977 20.4438 3.61643C20.7553 4.44217 20.9214 5.3155 20.9347 6.19777C21 7.31321 21 7.67764 21 10.5186C21 13.3596 20.9837 13.7322 20.9347 14.8348C20.9173 15.706 20.7517 16.5679 20.445 17.3836C19.8965 18.7897 18.7823 19.9015 17.3737 20.4481C16.5578 20.7534 15.6959 20.9183 14.8248 20.936C13.7112 21 13.3463 21 10.4942 21ZM10.4545 1.84315C7.60244 1.84315 7.30627 1.85712 6.19273 1.90719C5.52808 1.91598 4.86985 2.03845 4.24664 2.26929C3.32636 2.62093 2.59815 3.34513 2.24225 4.26264C2.0093 4.89173 1.88663 5.5562 1.87962 6.22688C1.81782 7.35512 1.81782 7.65086 1.81782 10.479C1.81782 13.2735 1.82832 13.6123 1.87962 14.7335C1.89006 15.3974 2.01266 16.0548 2.24225 16.678C2.59868 17.5949 3.32676 18.3185 4.24664 18.6702C4.86943 18.9025 5.52792 19.0251 6.19273 19.0323C7.32143 19.0975 7.61877 19.0975 10.4545 19.0975C13.3148 19.0975 13.6109 19.0835 14.7152 19.0323C15.3803 19.0242 16.039 18.9017 16.6624 18.6702C17.5771 18.3155 18.3006 17.5935 18.6563 16.6803C18.8888 16.0507 19.0115 15.3859 19.0189 14.7149H19.0318C19.0819 13.6018 19.0819 13.3049 19.0819 10.4604C19.0819 7.61593 19.0691 7.3167 19.0189 6.20476C19.0085 5.54161 18.8859 4.88499 18.6563 4.26264C18.3014 3.34814 17.5778 2.62476 16.6624 2.26929C16.0391 2.03729 15.3803 1.91478 14.7152 1.90719C13.5876 1.84315 13.2926 1.84315 10.4545 1.84315ZM10.4942 15.8571C8.3137 15.8585 6.34713 14.5481 5.51161 12.537C4.67609 10.5258 5.1362 8.21013 6.67736 6.66986C8.21852 5.1296 10.5372 4.66815 12.5519 5.50072C14.5667 6.33329 15.8807 8.29589 15.8812 10.4732C15.878 13.4435 13.4688 15.8513 10.4942 15.8571ZM10.4942 6.97788C8.56225 6.97788 6.99611 8.54175 6.99611 10.4709C6.99611 12.4 8.56225 13.9639 10.4942 13.9639C12.4261 13.9639 13.9922 12.4 13.9922 10.4709C13.9877 8.54361 12.4242 6.98236 10.4942 6.97788ZM16.0911 6.14771C15.3978 6.14513 14.8375 5.58252 14.8388 4.89023C14.84 4.19794 15.4024 3.6374 16.0957 3.6374C16.789 3.6374 17.3514 4.19793 17.3527 4.89022C17.353 5.22422 17.2201 5.5446 16.9834 5.78056C16.7466 6.01652 16.4255 6.14863 16.0911 6.14771Z
Twitter:   M15.2718 1.58667H18.0831L11.9413 8.60625L19.1666 18.1583H13.5093L9.07828 12.365L4.00821 18.1583H1.19528L7.76445 10.6501L0.833252 1.58667H6.63418L10.6394 6.88195L15.2718 1.58667ZM14.2852 16.4757H15.8429L5.78775 3.18095H4.11614L14.2852 16.4757Z
LinkedIn:  M11.1111 21H6.66665V7H11.1111V9.33333C12.0585 8.0678 13.4951 7.31333 15.0277 7.2765C17.784 7.29257 20.008 9.64761 20 12.5417V21H15.5555V13.125C15.3778 11.8214 14.313 10.8542 13.0589 10.857C12.5103 10.8752 11.9925 11.1274 11.6249 11.5554C11.2573 11.9834 11.0718 12.5502 11.1111 13.125V21ZM4.44444 21H0V7H4.44444V21ZM2.22222 4.66667C0.994921 4.66667 0 3.622 0 2.33333C0 1.04467 0.994921 0 2.22222 0C3.44951 0 4.44444 1.04467 4.44444 2.33333C4.44444 2.95217 4.21031 3.54566 3.79356 3.98325C3.37682 4.42083 2.81159 4.66667 2.22222 4.66667Z
```

**Bottom row** `<div data-slot="flex">`: `display:flex; flex-direction:column; 2xl(≥1280px) flex-direction:row; gap:2rem (32px); justify-content:space-between; margin-bottom: 3rem (48px); xl(≥992px) 5rem (80px); width:100%`.

Legal cluster `<div data-slot="flex">`: `display:flex; align-items:center; flex-direction:column; lg(≥769px) flex-direction:row; gap:.75rem (12px); lg gap:1rem (16px)`. Each item sits in a `<div data-slot="flex">` with `display:flex; justify-content:flex-start; width:100%; lg width:initial`.

All legal items: `border-bottom:2px solid transparent; position:relative; text-align:left; textStyle: body.xs (12px/1.5/400)`; `:hover { border-bottom:2px solid; border-color: blue.500 }`.

| Label (verbatim) | Element | href | color |
|---|---|---|---|
| `Terms of service` | `<a>` | `/terms-of-use/` | `gray.500` #999 |
| `Do not sell my personal information` | `<button type="button">` (`background: transparent; cursor:pointer`) | — (opens a consent flow) | `gray.500` #999 |
| `California privacy policy` | `<a>` | `/ccpa-policy/` | `gray.500` #999 |
| `Privacy policy` | `<a>` + trailing external-arrow icon | `/privacy/` | `text.onColor.primary` **#fff** |

The `Privacy policy` link additionally has `align-items:center; display:inline-flex; gap:.375rem (1.5); justify-content:flex-start; white-space:nowrap` and this trailing icon:
```html
<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
  <path d="M0.707107 2H4.29289L0 6.29289L1.41421 7.70711L5.70711 3.41421V7H7.70711V0H0.707107V2Z" fill="currentColor"/>
</svg>
```

Copyright `<p>`: `color: gray.500 (#999); textStyle: body.xs (12px/1.5/400); 2xl(≥1280px) width: 50%; word-break: break-word`.
> **Copy (verbatim):** `© 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.`

---

## 4. ALL verbatim FAQ copy

Rendered group order is **About Brilliant → About our courses → About Premium**. Each group is its own single-open accordion.

#### Group 1 — group title: `About Brilliant`

1. `value="who-is-brilliant-best-for"`
   - **Question (verbatim):** Who is Brilliant best for?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant is designed for anyone looking to get smarter, faster. Students, professionals, and curious lifelong learners from ages 10 to 110 can sharpen their skills through Brilliant’s interactive problem solving at their own pace. Personalized learning paths featuring thousands of interactive lessons help beginners and advanced learners alike build a real understanding of concepts—rather than just memorizing facts and formulas.
   ```

2. `value="what-is-interactive-learning-and-why-is-it-effective"`
   - **Question (verbatim):** What is interactive learning and why is it effective?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   On Brilliant, you learn by doing—instead of watching videos or reading dense blocks of text, you learn interactively, which has been shown to be <a href="https://www.educationworld.com/a_news/interactive-learning-helps-students-learn-six-times-more-moocs-study-says-1058054973" target="_blank" rel="noopener noreferrer">6x more effective</a>. Hands-on lessons and instant, personalized feedback make even the most complex ideas easy to grasp. Rather than memorizing formulas or coding languages, you’ll learn to think logically and understand concepts from a first-principles approach, leading to deeper comprehension and better retention.
   ```

3. `value="how-does-brilliant-compare-to-other-learning-platforms-and-methods"`
   - **Question (verbatim):** How does Brilliant compare to other learning platforms and methods?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Unlike passive video lectures, dense textbooks, or long lists of practice problems, Brilliant uses interactive problem-solving where you learn STEM concepts by doing. This hands-on approach builds genuine understanding and better retention compared to traditional educational methods that rely on memorization.
   ```

4. `value="how-much-time-should-i-commit-to-learning"`
   - **Question (verbatim):** How much time should I commit to learning?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant recommends just 15 minutes per day for optimal learning progress, with bite-sized lessons designed to fit into any schedule. On busier days, you can maintain your streak with quick 2-minute practice sessions, ensuring consistent progress without overwhelming time commitments.
   ```

5. `value="can-i-learn-on-the-go"`
   - **Question (verbatim):** Can I learn on-the-go?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Yes. Brilliant’s native mobile apps for iOS and Android allow you to learn anywhere, with full progress syncing across all devices. Our bite-sized lessons are designed for mobile learning, letting you tackle complex concepts during your commute, on a break, or whenever you have a few minutes to spare.
   ```

6. `value="how-can-i-stay-motivated-to-learn"`
   - **Question (verbatim):** How can I stay motivated to learn?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant’s gamified features like daily streaks, competitive leagues, and progress tracking keep you engaged and make learning feel rewarding.
   ```

7. `value="can-learning-be-fun"`
   - **Question (verbatim):** Can learning be fun?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Absolutely. Brilliant transforms learning into an adventure with interactive puzzles, visual storytelling, and bite-sized lessons that make complex concepts click. Our gamified approach turns every subject into an exciting challenge that keeps you coming back for more. At Brilliant, we've cracked the code on making learning irresistibly fun.
   ```

8. `value="how-can-i-improve-my-problem-solving-skills"`
   - **Question (verbatim):** How can I improve my problem-solving skills?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant helps you improve your problem-solving skills through interactive courses that teach you to break down complex problems into smaller, solvable parts. Our hands-on approach develops critical reasoning skills you can apply to real-world challenges across any domain, from logic puzzles to problems at work.
   ```


#### Group 2 — group title: `About our courses`

9. `value="what-subjects-and-courses-does-brilliant-offer"`
   - **Question (verbatim):** What subjects and courses does Brilliant offer?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant offers <a href="https://brilliant.org/courses/" target="_blank" rel="noopener noreferrer">60+ interactive courses</a> covering math, science, computer science, programming, data analysis, AI, and more, with content spanning from foundational topics like algebra and logic to advanced subjects like machine learning and quantum computing. Whether you're building basic STEM foundations or advancing your career with cutting-edge skills, Brilliant has courses designed for your learning journey.
   ```

10. `value="are-courses-written-by-experts"`
   - **Question (verbatim):** Are courses written by experts?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   All of Brilliant’s courses are crafted by award-winning teachers, researchers, and professionals from top universities and leading tech companies. We maintain rigorous quality standards and regularly update our content library to ensure quality, accuracy, and relevance.
   ```

11. `value="can-i-start-learning-as-a-beginner"`
   - **Question (verbatim):** Can I start learning as a beginner?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant is designed for everyone from beginners to advanced learners, with learning paths that start from foundational concepts and progress to professional-level skills. Our adaptive learning approach meets you at your current level and guides you through increasingly complex topics at your own pace.
   ```

12. `value="can-i-learn-advanced-topics"`
   - **Question (verbatim):** Can I learn advanced topics?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant offers advanced courses in machine learning, neural networks, quantum computing, advanced algorithms, and more that push your skills to expert levels. Our curriculum includes cutting-edge topics designed for professionals and ambitious learners who want to master complex abilities.
   ```

13. `value="are-new-courses-on-cutting-edge-topics-coming-soon"`
   - **Question (verbatim):** Are new courses on cutting-edge topics coming soon?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant continuously releases new interactive courses to expand our coverage of math, science, computer science, data analysis, AI and more. We prioritize quickly releasing new content about cutting-edge advancements in technology to keep learners up-to-date with the latest developments in each field.
   ```

14. `value="how-long-does-it-take-to-complete-a-brilliant-course"`
   - **Question (verbatim):** How long does it take to complete a Brilliant course?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Most Brilliant courses can be completed in 2-6 weeks with just 15 minutes of daily learning, though completion time varies based on the course complexity and your learning pace. The platform's bite-sized lessons and flexible structure allow you to progress at your own speed, whether you prefer quick daily sessions or longer focused study periods.
   ```

15. `value="what-should-i-learn"`
   - **Question (verbatim):** What should I learn?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant uses personalized recommendations to suggest courses and lessons based on your interests, skill level, and learning progress. We adaptively recommend whether you should practice existing concepts or learn new content based on what you need, creating customized learning paths that help you build upon your knowledge at the optimal pace.
   ```

16. `value="can-i-follow-a-structured-curriculum-plan"`
   - **Question (verbatim):** Can I follow a structured curriculum plan?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant’s personalized learning paths guide you from foundational concepts to advanced topics, with each lesson building upon previous knowledge. These learning paths adapt to your pace and skill level, ensuring you follow the optimal sequence of courses and topics to build comprehensive understanding.
   ```


#### Group 3 — group title: `About Premium`

17. `value="can-i-use-brilliant-for-free"`
   - **Question (verbatim):** Can I use Brilliant for free?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Yes, all users can complete two lessons per day for free.
   ```

18. `value="what-is-the-difference-between-brilliants-free-and-premium-plans"`
   - **Question (verbatim):** What is the difference between Brilliant’s free and Premium plans?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   On Brilliant’s free plan, you:
   <ul>
     <li>Get access to all courses</li>
     <li>Can complete up to two lessons per day</li>
     <li>Must progress through courses sequentially</li>
     <li>See occasional ads</li>
     </ul>
   On Brilliant’s Premium plan, you:
   <ul>
     <li>Get access to all courses, plus personalized practice</li>
     <li>Can do unlimited lessons per day, learning at your pace</li>
     <li>Can start anywhere and jump ahead in courses, learning in whatever sequence you'd like</li>
     <li>Never see ads</li>
     <li>Get personalized tutoring by Koji</li>
     </ul>
   ```

19. `value="can-i-try-brilliant-premium-for-free"`
   - **Question (verbatim):** Can I try Brilliant Premium for free?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Yes, Brilliant offers a free trial of its Premium plan. Users on a free trial can cancel anytime. There is also a free plan with some restrictions available to all users.
   ```

20. `value="what-premium-plans-and-pricing-does-brilliant-offer"`
   - **Question (verbatim):** What Premium plans and pricing does Brilliant offer?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   Brilliant offers <a href="https://brilliant.org/subscribe/" target="_blank" rel="noopener noreferrer">individual subscriptions</a> with annual and monthly billing, and <a href="https://brilliant.org/subscribe/" target="_blank" rel="noopener noreferrer">Family subscriptions</a> with annual billing. Subscriptions can also be purchased as <a href="https://brilliant.org/gift-premium/" target="_blank" rel="noopener noreferrer">gifts</a>.
   ```

21. `value="how-do-i-cancel-my-brilliant-subscription"`
   - **Question (verbatim):** How can I cancel my Brilliant subscription?
   - **Answer (verbatim inner HTML of panel body):**
   ```html
   You can cancel your Brilliant subscription anytime from Subscription Settings
   ```


---

## 5. Assets

### Referenced by this page

| Asset | Kind | Status |
|---|---|---|
| `/images/homepage/upsell-bg.svg` | `background-image` of the Upsell band | **Downloaded** → `public/assets/original/brilliant/brilliant.org/images/homepage/upsell-bg.svg` (17,281 B) |
| `/images/app-store-badges/get-it-on-google-play.svg` | `<img>` | Already present → `public/assets/original/brilliant/brilliant.org/images/app-store-badges/get-it-on-google-play.svg` |
| `/images/app-store-badges/download-on-the-app-store.svg` | `<img>` | Already present → `public/assets/original/brilliant/brilliant.org/images/app-store-badges/download-on-the-app-store.svg` |
| `/favicon.ico` | favicon | Not mirrored locally; not needed for the page body |
| `/apple-touch-icon*-precomposed.png` (8 sizes) | head links | Already present under `public/assets/original/brilliant/brilliant.org/` |
| `https://brilliant.org/images/opengraph/learn-interactively.png` | `og:image` | Not mirrored; head-only |

The upsell background SVG is `3109×800`, `style="opacity:0.4"`, line art in `stroke="#142563"` at `stroke-width="1.845"`, `stroke-miterlimit="10"` — a grid of thin outlined rectangles, circles and dashed runs. It is used as `background-size: cover; background-position: center` over `#080f28`.

### Fonts (all already mirrored under `public/assets/original/brilliant/brilliant.org/_next/static/media/`)
Preloaded by this page: `cofo_robert_medium-s.p.3krozkcg6qt-u.woff2`, `cofo_robert_medium_italic-s.p.2b_znar3654ya.woff2`, `source_code_pro_regular.p.1nc1izk0q8l8t.woff2`, `source_code_pro_medium.p.0k2a2_pd11ndo.woff2`.
Also declared: `cofo_brilliant_regular / bold / italic / bold_italic / medium / medium_italic`, `source_code_pro_bold / italic / mediumitalic / bolditalic`. All present locally. KaTeX faces are declared in a third CSS bundle but **no KaTeX markup appears on this page**.

### Inline SVGs (28 in the SSR body)
- 1 × shimmer (hero button) — 2 `<rect>`, 2 `<linearGradient>`, 1 `<clipPath>`
- 21 × Lucide `chevron-down` (one per accordion item)
- 1 × Brilliant wordmark (footer, 12 paths)
- 4 × social glyphs (Facebook, Instagram, Twitter/X, LinkedIn)
- 1 × external-link arrow (Privacy policy)
The header wordmark and the header nav icon are additional inline SVGs that only appear after hydration.

**No images, videos, `<picture>`, `poster`, `srcset` or `<source>` elements exist on this page** beyond the two app-store badges. Nothing else needs downloading.

---

## 6. Responsive notes

Only three breakpoints are actually exercised on this page: **`md` 481px**, **`lg` 769px**, and **`sm` 360px / `xl` 992px / `2xl` 1280px** in the footer and Upsell heading.

| Element | < 360 | ≥ 360 (`sm`) | ≥ 481 (`md`) | ≥ 769 (`lg`) | ≥ 992 (`xl`) | ≥ 1280 (`2xl`) |
|---|---|---|---|---|---|---|
| Hero padding-top | 48px | | | 80px | | |
| Hero `h1` | 36px | | | 50px | | |
| FAQ band gap | 40px | | | 64px | | |
| FAQ band padding-block | 48px | | | 80px | | |
| FAQ `h2` | 30px | | | 36px | | |
| Group title padding-inline | 24px | | | 48px | | |
| Group title size | 16px/700 | | | 20px/700 | | |
| Items wrapper padding-inline | 20px | | | 24px | | |
| Item padding-inline | 0 | | | 24px | | |
| Upsell height | auto (min 650px) | | 94vh | | | |
| Upsell padding-inline | 20px | | 32px | 112px | | |
| Upsell `h2` | 60px, lh 1.33 | lh 1.2 | | 96px | | |
| Upsell `p` | 16px | | 20px | | | |
| Store badge height | 44px | | | 48px | | |
| Header padding-inline | 24px | | 32px | | | |
| Header shadow | `elevation.subtle` | | | `elevation.base` | | |
| Header nav / Sign in | hidden | | | visible | | |
| Footer inner max-width | 100% | 432px | | 1216px | | |
| Footer grid columns | `1fr` | | | `repeat(4,140px)` | | `repeat(5,minmax(0,1fr))` |
| Footer top-row direction | column | | | | | row |
| Footer top-row margin-bottom | 80px | | | 128px | | |
| Footer legal cluster | column | | | row | | |
| Footer bottom-row margin-bottom | 48px | | | | 80px | |

The accordion card is `max-width: 800px; width: 100%` at every size and is centred with `margin-inline: auto`; the FAQ band's own `padding-inline: 20px` is what keeps it off the viewport edge on mobile.

Other media queries present in the bundle (`(hover:hover) and (pointer:fine)`, various `max-height` rules) belong to lesson/app chrome, not to this page.

---

## 7. Rebuild checklist (what a builder must not get wrong)

1. **`lg` is 769px, not 1024px.** Every `lg:` value in this spec flips there.
2. **Three separate accordions, each single-open.** Opening a question in "About our courses" must not close one in "About Brilliant". Within a card, opening item B closes item A; clicking the open item closes it.
3. **Accordion borders are `rgba(0,0,0,.05)` at `2px`** — both the card outline and the item dividers and the group-title underline. The first item in each card has `border-top-width: 0`.
4. **Chevron rotates 180° over 200ms; panel height animates over 200ms `ease`.** Nothing else animates in this section.
5. **Answer body text is `rgba(0,0,0,.6)` at 16px/1.5, questions are `#000` at 16px/1.5 weight 700** — questions are *not* a heading textStyle despite living inside an `h3`.
6. **The green button has a hard 4px bottom edge with no blur and no border**, an elliptical `56px/56px` radius, sits `translateY(-4px)`, and collapses both on `:active`. Hover is `opacity: .85` on the root, not a colour change.
7. **The hero button has the shimmer; the Upsell button does not.**
8. **Page background is `#f8f8f8`, hero background is `#fff`, accordion cards are `#fff`, Upsell is `#080f28` + the SVG, footer is `#000`.**
9. **All 21 answers, 3 group titles, both headings, both button labels and every footer string are given verbatim above. Write none of your own.**

---

## 8. Unavailable / not extracted

- **Rendered pixel measurements.** Everything above is a *declared* value from the CSS/JS. No browser was used (shared instance), so no computed box metrics, no screenshots, and no visual diff were captured.
- **Header and nav-icon SVG path data.** `LearnerAppHeader` renders client-side only; the `BrilliantWordmark` component and the `Courses` nav icon live in chunks that were not resolved to their path data. The **footer** wordmark paths *were* extracted and are above — the header wordmark is a different component (`h: 1.5rem`) and its geometry is **Original asset/component unavailable**. Render nothing invented in its place; if the project already has a `src/components/brilliant/nav.tsx` wordmark, reuse that rather than drawing a new one.
- **`Button` (`variant="secondaryOutline"` / `variant="primary" color="green"`) full style recipe** used by the two header buttons — only the instance-level overrides (`h:12`, `px`, `py`, hover shadow `0px 1px 3px rgba(0,0,0,.30)` (`blackAlpha.400`)) were resolved. The base recipe lives in an unresolved chunk. **Partially unavailable.**
- **The promotional `Banner`.** `ssr:false`, data-driven, absent from this capture. Render nothing.
- **The `Do not sell my personal information` handler.** It is a `<button>` with no href; the consent SDK it opens was not traced. Render the button with its label and no destination.
- **Dark theme.** The bundle carries a full dark palette (`bg.primary → gray.950 #141414`, `bg.elevated → dark-gray`, `text.primary → #fff`, `text.secondary → whiteAlpha.700`, `border.primary → whiteAlpha.300`, `border.secondary → whiteAlpha.100`, `border.select → blue.600`), but `/faq/` is served with no `data-theme` attribute and renders light. Only light values were extracted; the individual `whiteAlpha.*` hex values were **not** resolved.
- **`--button3d-x-scale`** defaults to `1` and nothing on this page sets it. Whatever sets it (a squash/stretch interaction elsewhere) was not traced.
- **Analytics / experiment behaviour** (`get_started_clicked`, Amplitude, Sentry, OneTrust) — out of scope, deliberately not reproduced.
