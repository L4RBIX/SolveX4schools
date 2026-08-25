# b-subject — brilliant.org/math/ forensic spec

Target: `https://brilliant.org/math/`
Key: `b-subject`
Template also serves: `/cs`, `/ai`, `/data`, `/science`, `/tech` (see "Sibling routes" at the end).

## 0. Fetch result

| Item | Value |
| --- | --- |
| HTTP status | **200** |
| Bytes | 303,814 |
| Reachable | yes — fully server-rendered HTML, not an empty shell |
| Redirects | none (`url_effective` = requested URL) |
| Rendering | Next.js Pages Router, SSR'd markup present for every section except the 3 inactive course tabs |

CSS bundles (all HTTP 200):

- `https://brilliant.org/_next/static/chunks/1fm-51vueb4hl.css` — 1,083,281 B, the Panda CSS atomic sheet + tokens + preflight
- `https://brilliant.org/_next/static/chunks/25j833ur1vg3n.css` — 24,957 B, KaTeX fonts (not used by this page's visible markup)
- `https://brilliant.org/_next/static/chunks/157prbu77y-tm.css` — 2,883 B, next/font faces for CoFo Robert / CoFo Brilliant / Source Code Pro

The page uses **Panda CSS**. Every class is `panda-<prop>_<value>`, so class names in the SSR HTML encode literal declared values. All values below are read from those class names or from the token block in the CSS — none are eyeballed.

### Forced light mode

An inline `<script id="color-mode-with-system-script">` in `<body>` hard-codes a `forcedLightPaths` list that **includes `/math`**. On this route `document.documentElement.dataset.theme` is always `light` and `colorScheme` is `light`; the stored `bits-color-mode` preference is ignored. Build this page light-only. Do not add a dark variant.

A second inline script sets `documentElement.dataset.reducedMotion` from `localStorage['bits-motion-preference']` + `prefers-reduced-motion`.

### Head metadata (verbatim)

```
<title>Learn Math: Algebra, Geometry, Calculus, &amp; More | Brilliant</title>
<meta name="description" content="Interactive problem solving that’s effective and fun. Master concepts in algebra, geometry, calculus, and beyond.">
<meta property="og:title" content="Learn Math: Algebra, Geometry, Calculus, &amp; More | Brilliant">
<meta property="og:description" content="Interactive problem solving that’s effective and fun. Master concepts in algebra, geometry, calculus, and beyond.">
<meta property="og:type" content="website">
<meta property="og:image" content="https://brilliant.org/images/opengraph/learn-interactively.png">
<meta property="og:url" content="https://brilliant.org/math">
<meta name="twitter:site" content="@brilliantorg">
<meta name="twitter:card" content="summary_large_image">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover,interactive-widget=resizes-content">
<meta property="al:ios:url" content="com.brilliant.Brilliant://math/">
<meta property="al:ios:app_store_id" content="913335252">
<meta property="al:ios:app_name" content="Brilliant.org">
<meta property="al:android:url" content="https://brilliant.org/math/">
<meta property="al:android:package" content="org.brilliant.android">
<meta property="al:android:app_name" content="Brilliant">
```

There is **no `<main>` element and no skip-nav link** on this page. Do not add one to match the original; add one only if the project requires it for a11y (it is a deviation either way).

A FAQ JSON-LD block (`<script id="math-faq-json-ld" type="application/ld+json">`) is injected client-side by `next/script`, so it is absent from the SSR HTML. Its content is reproduced in §7.

---

## 1. Design tokens actually used by this page

All values below are the **declared** values pulled from the Panda token block in `1fm-51vueb4hl.css`.

### Breakpoints (Panda prefixes → media query)

| Prefix | Declared | px |
| --- | --- | --- |
| `xs` | `min-width: 20rem` | 320 |
| `sm` | `min-width: 22.5rem` | 360 |
| `md` | `min-width: 30.0625rem` | 481 |
| `lg` | `min-width: 48.0625rem` | 769 |
| `xl` | `min-width: 62rem` | 992 |
| `2xl` | `min-width: 80rem` | 1280 |

These are **not** Tailwind's defaults. `md` is 481px, `lg` is 769px, `xl` is 992px, `2xl` is 1280px. In a Tailwind v4 rebuild these must be redefined or the layout will break at the wrong widths.

### Raw palette

| Token | Hex | rgba |
| --- | --- | --- |
| `white` | `#fff` | |
| `black` | `#000` | |
| `gray.50` | `#f8f8f8` | |
| `gray.100` | `#f2f2f2` | |
| `gray.200` | `#e5e5e5` | |
| `gray.300` | `#ccc` | |
| `gray.400` | `#b3b3b3` | |
| `gray.500` | `#999` | |
| `gray.700` | `#666` | |
| `gray.900` | `#383838` | |
| `gray.950` | `#141414` | |
| `dark-gray` | `#1e1e1e` | |
| `teal.100` | `#eaf7f6` | |
| `teal.300` | `#a0dcd5` | |
| `teal.500` | `#2cb0a1` | |
| `blue.100` | `#ecf0ff` | |
| `blue.400` | `#7491ff` | |
| `blue.500` | `#456dff` | |
| `purple.100` | `#f5efff` | |
| `purple.400` | `#b689ff` | |
| `pink.100` | `#fff0fb` | |
| `yellow.50` | `#fffcf4` | |
| `yellow.400` | `#f9d25c` | |
| `orange.400` | `#ffa95a` | |
| `papaya.100` | `#fff0ed` | |
| `pear.50` | `#fdfef5` | |
| `pear.300` | `#edf5a1` | |
| `pear.500` | `#d8e82e` | |
| `green.400` | `#5ed981` | |
| `green.500` | `#29cc57` | |
| `green.600` | `#15b441` | |
| `green.700` | `#009b2b` | |
| `blackAlpha.50` | `#00000006` | rgba(0,0,0,0.024) |
| `blackAlpha.100` | `#0000000d` | rgba(0,0,0,0.05) |
| `blackAlpha.200` | `#0000001a` | rgba(0,0,0,0.10) |
| `blackAlpha.300` | `#0003` | rgba(0,0,0,0.20) |
| `blackAlpha.400` | `#0000004d` | rgba(0,0,0,0.30) |
| `blackAlpha.600` | `#00000080` | rgba(0,0,0,0.50) |
| `blackAlpha.700` | `#0009` | rgba(0,0,0,0.60) |
| `whiteAlpha.50` | `#ffffff06` | rgba(255,255,255,0.024) |
| `whiteAlpha.100` | `#ffffff0d` | rgba(255,255,255,0.05) |
| `whiteAlpha.200` | `#ffffff1a` | rgba(255,255,255,0.10) |
| `whiteAlpha.300` | `#fff3` | rgba(255,255,255,0.20) |
| `whiteAlpha.400` | `#ffffff4d` | rgba(255,255,255,0.30) |
| `whiteAlpha.600` | `#ffffff80` | rgba(255,255,255,0.50) |
| `whiteAlpha.700` | `#fff9` | rgba(255,255,255,0.60) |
| `whiteAlpha.900` | `#fffc` | rgba(255,255,255,0.80) |

### Semantic tokens (light values — the only ones this page uses)

| Semantic | Resolves to |
| --- | --- |
| `text.primary` | `black` `#000` |
| `text.secondary` | `blackAlpha.700` rgba(0,0,0,0.60) |
| `text.inverse` | `white` |
| `text.link` | `blue.500` `#456dff` |
| `text.disabled` | `blackAlpha.300` |
| `text.onColor.primary` | `white` |
| `bg.primary` | `white` |
| `bg.secondary` | `gray.50` |
| `bg.active` | `blackAlpha.300` |
| `bg.alpha` | `blackAlpha.100` |
| `bg.disabled` | `blackAlpha.100` |
| `bg.elevated` | `white` |
| `bg.green.primary` | `green.500` `#29cc57` |
| `bg.success.primary` | `green.500` `#29cc57` |
| `bg.success.hover` | `green.600` `#15b441` |
| `bg.success.active` | `green.700` `#009b2b` |
| `bg.inverse.secondary` | `gray.900` `#383838` |
| `border.primary` | `blackAlpha.200` rgba(0,0,0,0.10) |
| `border.secondary` | `blackAlpha.100` rgba(0,0,0,0.05) |
| `border.hover` | `blackAlpha.400` rgba(0,0,0,0.30) |
| `icon.onColor.primary` | `white` |
| `elevation.shadow.cta.default` | `black` |
| `elevation.shadow.cta.secondary.outline` | `blackAlpha.200` |

> **Project-token mapping note.** `text-b-muted` in `globals.css` is `rgba(0,0,0,.4)`, but this page's `text.secondary` is **rgba(0,0,0,0.60)**. `border-b-line` is `rgba(0,0,0,.1)`, which **matches** `border.primary` exactly. `bg-b-green #29CC57` **matches** `green.500`/`bg.green.primary` exactly. Where the existing token differs (muted text, and the whole gray/pastel ramp used by the value-prop gradients), use the literal value listed here — matching the original is the priority, and this page needs `gray.50/100/200/400/500/950`, `teal.100/300`, `pear.50/300`, `blue.100/400`, `purple.100`, `yellow.50` which have no existing project equivalents.

### Gradients

`lohpDarkBg` (used by the course-tabs section background and the closing CTA):

```css
linear-gradient(180deg, #141414 66%, rgba(20,20,20,0.70) 100%),
linear-gradient(90deg, #a0dcd5 0%, #edf5a1 100%)
```
(declared as `linear-gradient(180deg, var(--panda-colors-gray-950) 66%, #141414b3 100%), linear-gradient(90deg, var(--panda-colors-teal-300) 0%, var(--panda-colors-pear-300) 100%)`)

Value-prop gradients are generated by `getDirectionalGradient(color, direction, start = "white")`:

```js
right → linear-gradient(90deg, START 0%, COLOR 100%)
left  → linear-gradient(90deg, COLOR 0%, START 100%)
up    → linear-gradient(0deg,  COLOR 0%, START 100%)
```

Section-2 / section-9 background (built by `buildLinearGradient(55, …)`):
```css
linear-gradient(55deg, #f2f2f2 25%, white 70%)
```

### Radii

| Token | Value |
| --- | --- |
| `sm` | `.125rem` |
| `xs` | `.375rem` |
| `base` | `.25rem` |
| `md` | `.5rem` |
| `lg` | `.75rem` |
| `xl` | `1rem` |
| `2xl` | `1.25rem` |
| `3xl` | `2rem` |
| `full` | `9999px` |
| `circle` | `50%` |

### Spacing scale (rem)

`0`=0 · `0.5`=.125 · `1`=.25 · `1.5`=.375 · `2`=.5 · `2.5`=.625 · `3`=.75 · `3.5`=.875 · `4`=1 · `4.5`=1.125 · `5`=1.25 · `5.5`=1.375 · `6`=1.5 · `7`=1.75 · `8`=2 · `9`=2.25 · `10`=2.5 · `11`=2.75 · `12`=3 · `14`=3.5 · `16`=4 · `20`=5 · `24`=6 · `28`=7 · `32`=8 · `36`=9 · `40`=10 · `44`=11 · `48`=12 · `52`=13 · `56`=14 · `60`=15 · `64`=16 · `72`=18 · `80`=20 · `96`=24

Identical to Tailwind's scale, so `p-6` etc. map 1:1.

### Sizes

| Token | Value |
| --- | --- |
| `appBar` | `64px` |
| `container.sm` / `container.md` | `432px` |
| `container.lg` / `container.xl` | `1216px` |

### Z-index

`appBar` = 999 · `docked` = 10 · `hide` = -1 · `relativeBack` = -1 · `relativeFront` = 1 · `relativeFront2` = 2

### Letter spacing

`normal` 0em · `tight` **-.025em** · `tighter` -.05em · `wide` .025em · `wider` .04em · `widest` .1em

### Fonts

| Token | Stack |
| --- | --- |
| `brilliant` (body default) | `"CoFo Brilliant", sans-serif` |
| `robert` (display) | `"CoFo Robert", sans-serif` |
| `code` | `"Source Code Pro", monospace` |

Headings on this page carry an **inline** `style="font-family:'coFoRobertFont', 'coFoRobertFont Fallback', Georgia, serif"` (next/font). The `coFoRobertFont Fallback` face is `local(Arial)` with `ascent-override:92.49%; descent-override:28.93%; line-gap-override:0.0%; size-adjust:101.63%`.

Project mapping: `font-b-serif` = real CoFo Robert → use for every `<h1>/<h2>/<h3>` that carries the inline style. `font-b-sans` = real CoFo Brilliant → the `:root` body font.

Font files already present locally under `public/assets/original/brilliant/brilliant.org/_next/static/media/` (6 CoFo Brilliant weights, 2 CoFo Robert, 6 Source Code Pro).

### Text styles (composite)

| Name | Declaration |
| --- | --- |
| `ui.actions.base` | `font-family: CoFo Brilliant; letter-spacing: 0; font-size: 16px; font-weight: 500; line-height: 1.25` |
| `body.base` | `font-family: CoFo Brilliant; letter-spacing: 0; font-size: 16px; font-weight: 400; line-height: 1.5` |
| `body.xs` | `font-family: CoFo Brilliant; letter-spacing: 0; font-size: 12px; font-weight: 400; line-height: 1.5` |
| `display.2xl` | `font-family: CoFo Robert; letter-spacing: -.36px; font-size: 36px; font-weight: 500; line-height: 1.1` |

### Global reset (Panda preflight) — affects layout, reproduce it

```css
html, :host {
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  tab-size: 4;
  line-height: 1.5;
  font-family: "CoFo Brilliant", sans-serif;
  -webkit-tap-highlight-color: transparent;
}
*, ::before, ::after, ::backdrop { border-style: solid; border-width: 0; border-color: currentcolor; box-sizing: border-box; margin: 0; padding: 0; }
body { line-height: inherit; height: 100%; background-color: #fff; color: #000; }
img, svg, video, canvas, audio, iframe, embed, object { vertical-align: middle; display: block; }
img, video { max-width: 100%; height: auto; }
h1, h2, h3, h4, h5, h6 { text-wrap: balance; font-size: inherit; font-weight: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
ol, ul, menu { list-style: none; }
a { color: inherit; text-decoration: none; }
```

Consequences the builder must not miss: **all headings inherit font-size/weight** (every size is set explicitly per element), **all margins are zeroed** (including `<p>`), and **lists have no bullets by default** (the hero list re-enables `list-style-type: disc`).

---

## 2. Shared component recipes

### `Button3D` — the raised CTA

Two nested elements. Outer `<a data-slot="button3d" role="link">`, inner `<span data-slot="button3d-face">` wrapping `<span data-slot="button3d-content">`.

Outer:
```css
border-radius: calc(56px / var(--button3d-x-scale, 1)) / 56px;
cursor: pointer; display: inline-flex; position: relative;
outline: none; -webkit-tap-highlight-color: transparent;
```
`:hover { opacity: .85 }` · `[data-disabled] { cursor: default; opacity: 1 }` · `[data-loading] { cursor: default; opacity: 1; pointer-events: none }` · `:focus-visible { box-shadow: <elevation.outline> }`

Face:
```css
align-items: center;
border-radius: calc(60px / var(--button3d-x-scale, 1)) / 60px;
box-shadow: 0 var(--button3d-shadow-y, 4px) 0 0 var(--button3d-shadow-color);
display: inline-flex; gap: .5rem; justify-content: center;
padding: .875rem 1.5rem;                 /* py 3.5 / px 6 */
position: relative; width: 100%;
font: 500 16px/1.25 "CoFo Brilliant";    /* textStyle ui.actions.base */
transform: translateY(var(--button3d-translate-y, -4px));
transition: transform var(--button3d-transition-duration, 100ms) ease-out,
            box-shadow var(--button3d-transition-duration, 100ms) ease-out;
```
Pressed / disabled / loading (`:active > &`, `[data-active] > &`, `[data-disabled] > &`, `[data-loading] > &`): `box-shadow: none; transform: none;` — i.e. the face drops onto the shadow. This is Brilliant's hard-edge press, matching the project's `.b-physical` / `.b-press` idea but with a **4px** offset and a **56/60px** elliptical radius.

Variants used on this page:

| Variant | Face styles |
| --- | --- |
| green (hero "I'm a learner") | `--button3d-shadow-color: #15b441` (green.600); `background: #29cc57`; `color: #fff`; `text-shadow: 0 0 3px rgba(0,0,0,0.25)` |
| outline secondary (hero "I'm a parent or teacher") | `--button3d-shadow-color: rgba(0,0,0,0.10)`; `background: #fff`; `border: 2px solid rgba(0,0,0,0.10)` on top/left/right, `border-bottom-width: 0`; `padding-top: .75rem; padding-bottom: .875rem`; `color: #000`. Hover: `--button3d-shadow-color` and `border-color` → `rgba(0,0,0,0.30)`. Active: `background: rgba(0,0,0,0.05)`, `border-bottom-width: 2px`, `border-color: rgba(0,0,0,0.30)`, `padding-bottom: .75rem` |
| outline on gray ("Learn more", §6) | wrapper sets `--button3d-shadow-color: rgba(0,0,0,0.10)`, `background: transparent`, `border-color: rgba(0,0,0,0.10)`; hover → `rgba(0,0,0,0.30)` |
| white on dark ("Get started", §8) | `--button3d-shadow-color: rgba(255,255,255,0.80)`; `background: #fff`; `color: #000` |

### `Divider` (vertical)

`<div data-slot="divider">` with `border-inline-end-width: 1px; border-color: #e5e5e5; align-self: stretch; height: auto;` plus a negative `margin-block` to overshoot the row (`-24px` in §2, `-8px` in §6).

### Header buttons (non-3D)

`<button>`: `display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 3rem; padding: .75rem 1.375rem; border: 2px solid transparent; border-radius: 54px; cursor: pointer; font: 500 16px/1.25 "CoFo Brilliant";`
- Secondary ("Sign in"): `background: transparent; border-color: rgba(0,0,0,0.10); color: #000`. Hover → `border-color: rgba(0,0,0,0.30)`. Active → `background: rgba(0,0,0,0.20)`, `border-color: rgba(0,0,0,0.30)`.
- Primary ("Get started"): `background: #29cc57; color: #fff`. Hover → `#15b441`. Active → `#009b2b`.

---

## 3. Section order (top → bottom)

Thirteen top-level blocks inside `#__next`.

| # | Block | Container | Interaction model |
| --- | --- | --- | --- |
| 0 | Header (transparent) + sticky header | 1216px | scroll-driven (sticky reveal) |
| 1 | Hero | 1220px | static + autoplay video, hover-driven mascot |
| 2 | Social proof strip | 1216px | static |
| 3 | Value prop — "A better way to learn math" | 1216px | static |
| 4 | Value prop — "Personalized learning" | 1216px | static |
| 5 | Value prop — "Think like a mathematician" | 1216px | static |
| 6 | Course tabs — "Reach your math goals and more" | 1142px | click-driven tabs + hover popover |
| 7 | Value prop — "Guided math lessons" | 1216px | static |
| 8 | Value prop — "Stay motivated" | 1216px | static |
| 9 | "Designed by experts" | 1216px | static |
| 10 | FAQ accordion | 800px | click-driven |
| 11 | Closing CTA — "Everyone is a math person" | full-bleed | static |
| 12 | Footer | 1216px | static |

The page component (from the JS bundle, verbatim composition order):
`LohpHeader(hasTransparentBg) → LandingHeroInformational → RefreshSocialProofs → ValuePropSections(pageContext:"math", disableAutoSlide:true) → RefreshExperts → FAQ VStack → RefreshUpsell(href:"/welcome?sem=math") → StaticPageSponsorModal → Footer`

`ValuePropSections` expands to: **first 3 value props → CourseSection → last 2 value props**. That is why blocks 3–8 interleave.

`StaticPageSponsorModal` renders **nothing** in the SSR HTML — it is a client-only, `ssr:false` dynamic import gated on a `useGetMonetizationQuery` sponsor discount that is absent for anonymous visitors. **Render nothing for it.**

---

## 4. Section 0 — Header

Two headers coexist in the DOM.

**A. Transparent in-flow header** (`<div data-slot="flex">` → `<div data-slot="box">`):
- Outer: `display: flex; flex-direction: column; width: 100%; z-index: 999`
- Box: `background: transparent; border-bottom: none; display: flex; flex-direction: column; max-width: 100%; padding-inline: 1.5rem` (`md:` 2rem); `padding-top: .75rem` (`md:` 1.5rem); `top: 0; width: 100%; z-index: 999`
- Row (`data-slot="hstack"`): `align-items: center; flex-direction: row; flex-wrap: nowrap; gap: 1.5rem` (`md:` 2rem, `lg:` 2.5rem); `height: 64px; justify-content: space-between; width: 100%; max-width: 100%` → `sm/md:` 432px → `lg/xl:` **1216px**
- Left: `<a href="/">` + Brilliant wordmark SVG, `height: 1.5rem` (`md:` 2rem), `max-height: 3rem`, `min-height: 1.25rem`, inline `style="color:black"`
- Right: `<a href="/login/">` wrapping the secondary button, label **`Sign in`**. (No "Get started" here, and no nav links at all.)

Combined header height: `--header-h-base: 76px`, `--header-h-md: 88px` (64px bar + 12/24px top padding). These custom properties are set on the hero wrapper, not the header.

**B. Sticky reveal header** — `<div class="left-0 fixed right-0 top-0" style="z-index:10; transform: translateY(-100%)">` containing a solid copy of the bar:
- Box: `background: #fff; border-bottom: 1px solid rgba(0,0,0,0.10); padding-inline: 1.5rem` (`md:` 2rem); same 64px row, same 1216px max-width
- Right side is an `hstack` with `gap: .5rem`: `Sign in` (secondary, `display: none` below `md`) and `Get started` (primary green, `href="/welcome/"`, always visible)

Scroll logic, verbatim from the bundle:

```js
const onScroll = () => {
  if (window.scrollY > 200) setShown(true);
  else if (window.scrollY < 92) setShown(false);
};
useEffect(() => { window.addEventListener("scroll", onScroll); return () => window.removeEventListener("scroll", onScroll); }, []);

<motion.div
  className="fixed left-0 right-0 top-0"
  style={{ zIndex: 10 }}
  initial={{ y: "-100%" }}
  animate={shown ? { y: 0,        transition: { type: "spring", damping: 25, stiffness: 180 } }
                 : { y: "-100%",  transition: { duration: 0.15, ease: "easeInOut" } }}
/>
```

Note the hysteresis band: shows above 200px, hides only below 92px. Reproduce exactly with `motion/react`.

---

## 5. Section 1 — Hero

Wrapper `<div data-slot="flex" style="--header-h-base:76px; --header-h-md:88px">`:

```css
display: flex;
min-height: 90vh;
@supports (min-height: 100svh) { min-height: 100svh; }
background-color: #fff;
background-image: linear-gradient(180deg, #FFF 50%, rgba(255,255,255,0.00) 100%),
                  linear-gradient(270deg, rgba(249,232,215,0.50) 1.1%, rgba(222,208,254,0.50) 98.9%);
justify-content: center;
width: 100%;
margin-top: calc(var(--header-h-base) * -1);   /* pulls under the transparent header */
padding-top: var(--header-h-base);
padding-inline: 1.5rem;
@media (min-width: 481px) {                     /* md */
  margin-top: calc(var(--header-h-md) * -1);
  padding-top: var(--header-h-md);
  padding-inline: 2rem;
}
```

Two complete layouts live in the DOM, toggled by display:

### 5a. Desktop layout (`xl` ≥ 992px, `display: none` below)

Row `hstack`: `align-items: flex-start; flex: 1; gap: 2.5rem; justify-content: space-between; max-width: 1220px; width: 100%; padding-top: 5vh;`
plus `@media (min-height: 900px) { padding-top: 10vh }` and `@media (min-height: 1200px) { padding-top: 14vh }`.

**Left column** — `vstack`, `align-self: stretch; flex-shrink: 0; gap: 2.5rem; width: 590px`:

1. `<h1>` (CoFo Robert inline style):
   `font-size: 35px` → `md:` 44px → `lg:` 60px → `xl:` **76px**; `font-weight: 400; line-height: 1;`
   `max-width: 350px` → `md:` 430px → `lg:` 100%; `text-align: center` → `xl:` `left`.

   Copy, verbatim, with the scratch-highlight span around **math**:
   > Strengthen your <span>**math** skills</span>

   Markup shape: `Strengthen your` + `<span class="inline-block">` containing `<span class="scratch">math</span>` + ` skills`. The outer `inline-block` span (`PrettyWrap`) keeps "math skills" from breaking apart.

   **ScratchHighlight** — a hand-drawn underline SVG behind the word:
   ```css
   .scratch {
     display: inline-block; position: relative; z-index: 1;
     --scratch-image: url(/images/homepage/heroes/math-scratch.svg);
     --scratch-height: 120%;
     --scratch-top: -5%;
     --scratch-transform: translateX(-50%);
     --scratch-width: 113%;
   }
   .scratch::after {
     content: ""; position: absolute; z-index: -1;
     left: 50%; top: var(--scratch-top);
     width: var(--scratch-width); height: var(--scratch-height);
     transform: var(--scratch-transform);
     background-image: var(--scratch-image);
     background-position: center; background-repeat: no-repeat; background-size: contain;
   }
   ```

2. `vstack` (`align-items: flex-start; gap: 1.5rem; width: 100%`) containing:

   **Subtitle list** — `<ul>` with `font-size: 20px; list-style-type: disc; margin-inline-start: 1rem;` and `& > li + li { margin-top: .5rem }`. Four items, verbatim (`<strong>` = `font-weight: 700`):
   - Interactive problem solving that’s **effective and fun**
   - Step-by-step **thinking, not memorization**
   - For **grades 4-12, college, and adults**
   - **Comprehensive curriculum** designed by world-class teachers from MIT, Harvard, and more

   **Button block** (because `desktopButtonPosition: "top"`, it sits here, directly under the list) — `vstack`: `align-items: center; flex-shrink: 0; flex-wrap: wrap; gap: 1rem; height: auto` → `xl:` `height: 100px`; `justify-content: flex-end; position: relative; width: 100%`.
   Two `ButtonWithKoji`-wrapped Button3Ds, each `height: 45px; width: 100%` → `md:` `height: 60px; width: 353px` → `xl:` `width: 284px`; face `font-size: medium` → `md:` `large`, `height: 100%`.

   | Label (verbatim) | href | Variant |
   | --- | --- | --- |
   | `I’m a learner` | `/welcome/?cta_persona=learner&sem=math` | green |
   | `I’m a parent or teacher` | `/welcome/?cta_persona=parent_teacher&sem=math` | outline secondary |

   **Koji peek** (hover-driven, `xl` only). Each button is wrapped in:
   ```css
   .wrap { position: relative; width: 100%; }
   @media (min-width: 481px) { .wrap { width: auto } }         /* md */
   .wrap:hover [data-koji-peek] { transform: translateY(0); }

   .peek-window {                                              /* clips the mascot */
     display: none; position: absolute;
     bottom: calc(100% + 3px); left: 50%; transform: translateX(-50%);
     height: 30px; overflow: hidden; pointer-events: none;
   }
   @media (min-width: 992px) { .peek-window { display: block } } /* xl */

   [data-koji-peek] { transform: translateY(100%); transition: transform 0.2s ease-out; }
   ```
   The mascot is a 53×53 SVG (green diamond with a white/black face and a `#e2ee62` gradient overlay) — saved to `public/assets/original/brilliant/brilliant.org/inline-svg/koji-peek.svg`.

3. Badge row `hstack` (`gap: 1rem; width: 100%`):
   - Apple **Editors' Choice** laurel badge, 139×45, `color: text.secondary`
   - Google Play **Featured App** laurel badge, 139×45, `color: text.secondary`
   - `<p>` `font-size: 15px` → `md:` 16px, `color: rgba(0,0,0,0.60)`: **`Over 100,000 5-star reviews!`**

**Right column** — the video card:
```css
max-width: 440px;            /* inline style */
background: #fff;
border-radius: 28px;
filter: drop-shadow(0 0 109.913px rgba(0, 0, 0, 0.05));
height: 100%; overflow: hidden; position: relative;
```
Inside, stacked:
- `<video autoplay muted loop playsinline style="opacity:0">` `position: absolute; inset-block-start: 0; left: 0; width: 100%; height: 100%; object-fit: contain`
- `<img>` fallback, `width=880 height=1200`, `style="display:block; height:100%; object-fit:contain; width:100%"`, `alt=""`, `priority`

Video loading, verbatim from the bundle:
```jsx
const [ready, setReady] = useState(false);
<video ref={ref} style={{ opacity: ready ? 1 : 0 }} autoPlay muted loop playsInline
       onCanPlay={() => ref.current?.play().then(() => setReady(true)).catch(() => setReady(false))}>
  {shouldLoadVideo && <>
    <source src="/videos/homepage/math-sem-sizzle.webm" type="video/webm" />
    <source src="/videos/homepage/math-sem-sizzle.mp4"  type="video/mp4"  />
  </>}
</video>
```
`shouldLoadVideo = mounted && isXL` for the desktop card and `mounted && !isXL` for the mobile card, so **only one of the two videos ever downloads**. `mounted` comes from a `useEffect(() => setMounted(true), [])`. The `<source>` elements are therefore absent from SSR HTML — confirmed, both `<video>` tags in the fetched HTML are empty.

### 5b. Mobile/tablet layout (below `xl`, `xl:display:none`)

`vstack`: `display: flex; flex: 1; gap: 1.5rem; justify-content: space-between; max-height: 900px; padding-block: 2.5rem; width: 100%` plus `@media (max-height: 650px) { padding-top: 0 }`.

1. `<h1>` — identical markup and copy to desktop (rendered twice in the DOM).
2. Video card — `flex` wrapper `align-items: center; flex: 1 1 0px; justify-content: center; max-height: 350px; min-height: 150px`; card `max-width: 452px`, same 28px radius + drop-shadow; `<img width=660 height=480>`; sources `/videos/homepage/math-sem-sizzle-mobile.webm` + `.mp4`; fallback `/images/homepage/heroes/math-sizzle-mobile-fallback.png`.
3. `vstack` (`align-items: center; flex-shrink: 0; gap: 1.5rem; justify-content: center; width: 100%`):
   - `<p>` `font-size: 15px; font-weight: 700; text-align: center`, verbatim:
     > Interactive learning that’s <span class="inline-block">effective and fun.</span><br>Over 100,000 5-star reviews!
   - `hstack gap: 1rem` with the same two 139×45 badges, `color: text.secondary`
4. The same two Button3D CTAs (koji peek window is `display:none` below `xl`).

---

## 6. Sections 2–12 — full structure and copy

### Section 2 — Social proof

`<div data-slot="vstack" style="background: linear-gradient(55deg, #f2f2f2 25%, white 70%)">`
`align-items: center; padding: 4rem 1.25rem; gap: 48px;` → `md:` `padding: 5rem 2rem` → `xl:` `gap: 72px`; `width: 100%`.

**Heading** `<h2>` (CoFo Robert, `font-variant-numeric: lining-nums`):
`font-weight: 500; letter-spacing: -.025em; line-height: 1.33` → `sm:` `1.2`; `text-align: center; color: #000; font-size: 2.25rem` → `lg:` `3rem`.
> Join over 10 million learners worldwide

**Logo row.** Two DOM variants.

*Below `xl`* — `flex`, `flex-direction: column; gap: 4rem` → `lg:` `flex-direction: row; gap: 2.25rem`; hidden at `xl`:
1. `vstack flex:1 gap:.5rem` → FiveStars SVG (156×28, `color: #b3b3b3`, `height: 24px` → `lg:` `28px`, `width: auto`) + `<p>` (`color: #b3b3b3; font-size: 1rem; text-align: center`) **`Over 100,000 5-star app reviews`**
2. `vstack gap: 1rem` → **The New York Times** wordmark (185×25) and **The Atlantic** wordmark (170×27), both `color: #b3b3b3`
3. `hstack gap: 1.5rem` → Apple Editors' Choice (139×45) + Google Play Featured App (139×45), `color: #b3b3b3`

*At `xl`* — a single `hstack`, `display: none` → `xl: flex`; `gap: 1rem; justify-content: space-between; max-width: 1216px; width: 100%`, with vertical dividers between each item (`border-inline-end: 1px #e5e5e5; align-self: stretch; margin-block: -24px`). Order:
**The New York Times** │ **The Atlantic** │ (FiveStars + "Over 100,000 5-star app reviews") │ **Apple Editors' Choice** │ **Google Play Featured App** — each with `flex: 1`.

### Sections 3, 4, 5, 7, 8 — Value props (one repeated template)

```html
<section style="--vp-bg-base: …; --vp-bg-desktop: …; --vp-image: url(…)">
  <div class="flex">
    <div class="vstack"><h2>…</h2><p>…</p></div>
    <div class="box"><!-- ::before paints --vp-image --></div>
  </div>
</section>
```

Section:
```css
background-image: var(--vp-bg-base);
max-width: 100vw; overflow: hidden; position: relative;
padding: 4rem 1.5rem;                       /* pt 16 / px 6 / pb 16 */
@media (min-width: 769px) {                 /* lg */
  background-image: var(--vp-bg-desktop);
  padding-inline: 2rem; padding-block: 0;
}
```

Inner flex:
```css
display: flex; flex-direction: column; align-items: flex-start;
gap: 1rem; justify-content: center; margin-inline: auto; max-width: 100%;
@media (min-width: 360px)  { max-width: 432px; }   /* sm */
@media (min-width: 481px)  { max-width: 432px; }   /* md */
@media (min-width: 769px)  {                        /* lg */
  align-items: center; gap: 1.5rem; justify-content: space-between; max-width: 1216px;
  flex-direction: row-reverse;   /* when assetAlignment === "left"  */
  /* flex-direction: row;           when assetAlignment === "right" */
}
@media (min-width: 992px)  { max-width: 1216px; }  /* xl */
```

Text column:
```css
display: flex; flex-direction: column; align-items: flex-start;
flex: 1; gap: 1.5rem; justify-content: start;
margin-bottom: 1rem; max-width: 100%; text-align: left;
@media (min-width: 769px) {                 /* lg */
  justify-content: center; margin-bottom: 0; max-width: 480px;
  justify-self: start;   /* assetAlignment "left"  */
  /* justify-self: end;     assetAlignment "right" */
}
```

`<h2>` (CoFo Robert): `font-size: 3rem` → `lg:` **3.75rem**; `font-weight: 400; letter-spacing: -.025em; line-height: 110%; text-align: left; width: 100%`. Headings carry a hard `<br>` at the marked point.

`<p>`: **no class at all** → inherits `16px / 1.5 CoFo Brilliant`, `color: #000`, `margin: 0`.

Image column:
```css
flex: 1 0 0%; margin-left: 0; min-height: 300px; position: relative; width: 100%;
&::before {
  content: ""; position: absolute; inset: 0 0 0 0; width: 100%; height: 100%;
  background-image: var(--vp-image);
  background-position: center; background-repeat: no-repeat; background-size: contain;
}
@media (min-width: 769px) {                 /* lg */
  min-height: 728px;
  margin-left: 1.5rem;    /* assetAlignment "left"  */
  /* margin-left: -1.5rem;   assetAlignment "right" */
  &::before {
    background-position: center;
    width: 90%;
    left: 0; right: auto;      /* assetAlignment "left"  */
    /* left: auto; right: 0;      assetAlignment "right" */
  }
}
```

Per-section data (all values verbatim):

| # | assetAlignment | `--vp-bg-base` | `--vp-bg-desktop` | `--vp-image` |
| --- | --- | --- | --- | --- |
| 3 | left | `linear-gradient(0deg, #eaf7f6 0%, #f8f8f8 100%)` | `linear-gradient(90deg, #f8f8f8 0%, #eaf7f6 100%)` | `/images/homepage/refresh/math/better-way.png` |
| 4 | right | `linear-gradient(0deg, #ecf0ff 0%, white 100%)` | `linear-gradient(90deg, #ecf0ff 0%, white 100%)` | `/images/homepage/refresh/math/personalized-learning.png` |
| 5 | left | `linear-gradient(0deg, #fffcf4 0%, white 100%)` | `linear-gradient(90deg, white 0%, #fffcf4 100%)` | `/images/homepage/refresh/math/think-like-mathematician.png` |
| 7 | left | `linear-gradient(0deg, #f5efff 0%, white 100%)` | `linear-gradient(90deg, white 0%, #f5efff 100%)` | `/images/homepage/refresh/shared/guided-lessons.png` |
| 8 | right | `linear-gradient(0deg, #fdfef5 0%, white 100%)` | `linear-gradient(90deg, #fdfef5 0%, white 100%)` | `/images/homepage/refresh/shared/stay-motivated.png` |

Copy, verbatim (`⏎` = literal `<br>`):

**§3** — h2: `A better way to⏎learn math`
p: `Step-by-step interactive lessons make even complex concepts feel intuitive. Custom, intelligent feedback catches mistakes as you learn.`

**§4** — h2: `Personalized⏎learning`
p: `Start at your level and ramp up fast. Brilliant tracks the concepts you’ve mastered and designs practice sets based on your progress.`

**§5** — h2: `Think like a⏎mathematician`
p: `Build mathematical intuition as you learn through “aha” moments, not memorizing answers.`

**§7** — h2: `Guided math⏎lessons`
p: `From foundational algebra to calculus, we help you stay on track and build your problem-solving skills one concept at a time.`

**§8** — h2: `Stay⏎motivated`
p: `Finish every day smarter with engaging lessons, competitive features, and daily encouragement.`

### Section 6 — Course tabs

Outer `<div data-slot="vstack" style="background: var(--panda-gradients-lohp-dark-bg)">` (the `lohpDarkBg` gradient above):
`align-items: center; display: flex; flex-direction: column; gap: 0; padding: 4rem 1.25rem;` → `lg:` `padding-inline: 2rem` → `2xl:` `padding-inline: 0; padding-block: 5rem`.

Inner `vstack`: `gap: 0; max-width: 1142px; width: 100%`.

**Heading** `<h2>` (CoFo Robert): `font-weight: 500; letter-spacing: -.025em; line-height: 1.33` → `sm:` `1.2`; `text-align: center; color: #fff; font-size: 3rem; margin-bottom: 2.25rem` → `lg:` `font-size: 3.75rem; margin-bottom: 2.5rem` → `2xl:` `font-size: 3.75rem`.
> Reach your math goals and more

**Tab list** `role="tablist"`:
```css
align-items: stretch; border-radius: 1rem; display: flex; flex-wrap: nowrap;
height: 58px; justify-content: space-between; margin-bottom: 1rem;
overflow-x: auto; padding: .375rem; scrollbar-width: none; white-space: nowrap;
z-index: 2; background-color: transparent; gap: .5rem;
&::-webkit-scrollbar { width: 0 }
@media (min-width: 481px) { gap: .5rem }              /* md */
@media (min-width: 1280px) { margin-bottom: 2.5rem }  /* 2xl */
```

**Tab pill** (`<button role="tab" data-color-scheme="…">`):
```css
align-items: center; display: inline-flex; justify-content: center;
background-image: linear-gradient(0deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%);
border: none; border-radius: 38px; color: rgba(255,255,255,0.50);
cursor: pointer; font-size: 14px; font-weight: 500; height: 32px;
padding-inline: .75rem; position: relative; white-space: nowrap; z-index: 1;
@media (min-width: 481px) { font-size: 16px; height: 40px; padding-inline: 1.25rem; }  /* md */

&::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  opacity: 0; z-index: -1; transition: opacity 500ms ease-out;
}
&[aria-selected="false"]:hover { background-color: rgba(0,0,0,0.50); }
&[data-selected] { color: #000; }
&[data-selected]::before { opacity: 1; }
```

Per-colorScheme `::before` gradients. With
`A = linear-gradient(90deg, rgba(242,242,242,1) 0%, rgba(242,242,242,0) 100%)` and
`Z = linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)`:

| `data-color-scheme` | `::before` | `:hover::before` |
| --- | --- | --- |
| `blue` | `A, linear-gradient(0deg, #7491ff 0%, #eaf7f6 100%)` | `Z, A, linear-gradient(0deg, #7491ff 0%, #eaf7f6 100%)` |
| `purple` | `A, linear-gradient(0deg, #b689ff 0%, #fff0fb 100%)` | `Z, A, linear-gradient(0deg, #b689ff 0%, #fff0fb 100%)` |
| `orange` | `A, linear-gradient(0deg, #ffa95a 0%, #fff0ed 100%)` | `Z, A, linear-gradient(0deg, #ffa95a 0%, #fff0ed 100%)` |
| `yellow` | `A, linear-gradient(0deg, #f9d25c 0%, #fff0ed 100%)` | `Z, A, linear-gradient(0deg, #f9d25c 0%, #fff0ed 100%)` |

Tab labels — each pill holds two spans, a desktop label (`display:none` → `lg: inline`) and a mobile label (`lg: display:none` → `inline`):

| Order | colorScheme | Desktop label | Mobile label |
| --- | --- | --- | --- |
| 1 | `blue` | `Math` | `Math` |
| 2 | `purple` | `Computer Science` | `CS` |
| 3 | `orange` | `Data Analysis` | `Data` |
| 4 | `yellow` | `Science` | `Science` |

**Panel stack** — a CSS grid with a single named area so all four panels overlap:
```css
display: grid; grid-template-areas: "stack"; grid-template-columns: minmax(0, 1fr);
position: relative; width: 100%; z-index: 1;
```
Each panel:
```css
grid-area: stack; min-width: 0; opacity: 0; padding-inline: 0;
pointer-events: none; transition: opacity 100ms ease-out;
@media (min-width: 481px) { padding-inline: 1rem }   /* md */
&[data-active="true"] {
  opacity: 1; pointer-events: auto;
  transition: opacity 300ms ease-out 100ms;
}
```
**Only the Math panel has SSR content**; the other three are empty divs in the HTML and are filled on the client. Build all four with the same component — the data is in the table below.

**Panel card** (`data-slot="stack"`):
```css
display: flex; flex-direction: column-reverse; align-items: center;
gap: .75rem; justify-content: center; width: 100%; border-radius: 1.25rem;
background-image: linear-gradient(0deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.10) 100%),
                  linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 97%);
@media (min-width: 992px) {   /* xl */
  align-items: flex-start; flex-direction: row; gap: .5rem; justify-content: space-between;
}
```

Left half — `vstack`: `align-items: flex-start; gap: .5rem; margin-top: 1.25rem; padding: 1rem 2rem 2rem; width: 100%` → `lg:` `padding-inline: 4rem` → `xl:` `margin-top: 0; padding-top: 4rem`.
Inner `stack`: `align-items: flex-start; gap: .75rem; justify-content: center` → `xl:` `gap: 1rem; justify-content: flex-start`.

- `<h3>`: `color: #fff; font-size: 1rem; font-weight: 700` → `lg:` `1.25rem`. Text is `{title} Courses` → **`Math Courses`**, `Computer Science Courses`, `Data Analysis Courses`, `Science Courses`.
- `<ul>` `list-style-type: none; margin-left: 0`; each `<li>` `color: #fff; font-size: 1rem; margin-bottom: .25rem` → `lg:` `.5rem`. Shows the first `coursesVisibleCount` titles.
- "additional courses" affordance, shown only when `courses.length > coursesVisibleCount`. Trigger style:
  ```css
  background: none; border: none; border-bottom: 1px dashed rgba(255,255,255,0.50);
  border-radius: 0; color: rgba(255,255,255,0.50); cursor: pointer;
  font-weight: 400; height: unset; padding: 0;
  ```
  At `xl` and up it is a **hover popover** (`font-size: 1rem`, label `"{n} additional courses"`), opening on `mouseenter` and closing on `mouseleave` after a **150ms** timeout, positioned `side: "bottom"`, `align: "start"`, `sideOffset: 8`, `z-index: 10`. Popup:
  ```css
  background-color: #fff;          /* bg.inverse.secondary #383838 in the refresh variant */
  border-radius: 1.25rem;
  box-shadow: 0 0 15px rgba(0,0,0,0.10);
  padding: 1.5rem; width: fit-content; z-index: 10;
  ```
  (Declared: `backgroundColor: "bg.inverse.secondary"` → **`#383838`**, `borderRadius: "2xl"` → 1.25rem, `boxShadow: 0 0 15px {blackAlpha.200}`, `padding: 6`.)
  Grid inside: `display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem`; each entry a `<span>` `color: #fff; font-size: 14px; margin-bottom: .25rem` → `lg:` `font-size: 1rem`.
  Below `xl` it is a plain `<button>` (`font-size: 14px`) that expands the list in place (`setExpanded(true)` — reveals all courses, no popover).

Right half — `<div data-slot="center">`:
```css
align-items: center; display: flex; justify-content: center;
background-color: #fff; border-radius: 1.25rem; flex-shrink: 0;
max-width: 100%; width: 100%;
@media (min-width: 360px) { height: 260px }                       /* sm */
@media (min-width: 481px) { height: 375px }                       /* md */
@media (min-width: 992px) { height: 456px; width: 550px }         /* xl */
@media (min-width: 1280px) { width: 700px }                       /* 2xl */
```
containing `<video autoplay loop muted playsinline disableremoteplayback>`:
```css
width: 100%;
@media (min-width: 360px) { height: 240px }
@media (min-width: 481px) { height: 355px }
@media (min-width: 992px) { height: 430px }
[&::-webkit-media-controls] { display: none !important }
[&::-webkit-media-controls-enclosure] { display: none !important }
[&::-webkit-media-controls-panel] { width: 0px !important }
```

**Complete tab data** (verbatim from the bundle):

| Tab | colorScheme | visible | video | poster | Courses (in order) |
| --- | --- | --- | --- | --- | --- |
| Math | blue | 7 | `/videos/homepage/courses/math-refresh.webm` | `/videos/homepage/courses/posters/math-refresh.png` | Arithmetic Thinking · Proportional Reasoning · Probability and Chance · Visual Algebra · Solving Equations · Quadratics · Calculus · Exponential Functions · Coordinate Geometry · Everyday Statistics · Geometry and Measurement · Real-World Algebra · Coordinate Plane · Coordinate Transformations · Logic · Truth and Lies · Reasoning with Logic · Vectors · Infinity · Number Theory · Geometric Thinking · Bayesian Probability · Contest Math · Linear Functions · Exponents and Radicals · Introduction to Functions **(26 total → "19 additional courses")** |
| Computer Science | purple | 7 | `/videos/homepage/courses/cs-refresh.webm` | `/videos/homepage/courses/posters/cs-refresh.png` | Thinking in Code · Programming with Variables · Thinking in Python · Programming with Functions · Algorithmic Thinking · Computer Science Fundamentals · Introduction to Neural Networks · How AI Works · How Technology Works · Search Engines · Cryptocurrency **(11 total → "4 additional courses")** |
| Data Analysis | orange | 7 | `/videos/homepage/courses/data-refresh.webm` | `/videos/homepage/courses/posters/data-refresh.png` | Exploring Data Visually · Probability in Data · Clustering & Classification · Regression · Predicting with Probability **(5 total → no "additional" affordance)** |
| Science | yellow | 8 | `/videos/homepage/courses/science-refresh.webm` | `/videos/homepage/courses/posters/science-refresh.png` | Scientific Thinking · Circuits · Digital Circuits · Quantum Computing · Beyond the Nutshell **(5 total → no "additional" affordance)** |

Verbatim strings for the affordance: desktop popover trigger renders `"{count} additional courses"` (count then the literal `additional courses`); mobile button renders `"{coursesCount} additional courses"`. On the Math tab both read **`19 additional courses`**.

**Interaction model — click-driven only.** `disableAutoSlide: true` is passed on `/math`, so `useCarousel` gets `slideInterval: undefined` and never auto-advances. There is an `useIntersectionObserver` on the section that calls `setHasUserInteraction(!isIntersecting)`, but with auto-slide disabled it has no visible effect. Do not build a scroll-driven or timed carousel here. Default tab = index 0 (Math; `getRefreshCourseGroups("math")` hoists Math to the front, and it is already first).

### Section 9 — Designed by experts

`<div data-slot="box" style="background: linear-gradient(55deg, #f2f2f2 25%, white 70%)">`:
`color: #000; padding: 4rem 1.25rem; position: relative;` → `lg:` `padding: 5rem 7rem`.

Inner `flex`: `align-items: stretch; flex-direction: column; gap: 0; margin-inline: auto; max-width: 432px; width: 100%` → `lg:` `max-width: 1216px`.

`<h2>` (CoFo Robert): `font-weight: 500; letter-spacing: -.025em; line-height: 1.33` → `sm:` `1.2`; `text-align: center; font-size: 3rem; margin-bottom: 4rem` → `lg:` `font-size: 3.75rem; margin-bottom: 84px`.
> Designed by experts

Logo row `hstack` (`margin-bottom: 2.5rem` on its wrapper):
```css
align-items: center; column-gap: 0; flex-wrap: wrap; justify-content: center; row-gap: 3rem;
@media (min-width: 481px)  { justify-content: space-around }        /* md */
@media (min-width: 992px)  { row-gap: 1rem }                        /* xl */
@media (min-width: 1280px) { column-gap: 1.5rem; justify-content: space-between } /* 2xl */
```
Each logo sits in `<div>` `text-align: center; width: 100%` → `xs:` `50%` → `lg:` `25%` → `2xl:` `auto`, all `color: #b3b3b3` (gray.400), `display: inline-block; max-width: 100%`. Between every pair a `Divider` (`border-inline-end: 1px #e5e5e5; align-self: stretch; margin-block: -8px; display: none` → `2xl:` `block`).

Order and dimensions (verbatim from the bundle's `["stanford","mit","google","caltech","harvard","microsoft"]`):

| # | Logo | SVG size |
| --- | --- | --- |
| 1 | Stanford | 118×26 |
| 2 | MIT | 59×31 |
| 3 | Google | 100×33 |
| 4 | Caltech | 100×25 |
| 5 | Harvard University | 177×38 |
| 6 | Microsoft | 142×31 (in a 142×32 wrapper) |

`<p>`: `color: #999; font-size: 16px; margin-bottom: 3rem; text-align: center` → `md:` `font-size: 20px; margin-bottom: 3.5rem`.
> All of our courses are crafted by award-winning teachers and professionals from top institutions.

Button3D `href="/about/"`, outline-on-gray variant, `margin-inline: auto; max-width: 340px; width: 100%` → `md:` `max-width: 280px`.
> Learn more

### Section 10 — FAQ

Outer `<div data-slot="vstack">`: `align-items: center; padding: 4rem 1.25rem;` → `lg:` `padding-inline: 2rem` → `2xl:` `padding-inline: 0; padding-block: 5rem`.

`<h2>` (**no CoFo Robert inline style here — it uses `textStyle: display.2xl`, which already sets CoFo Robert**):
```css
font-size: 35px; letter-spacing: -.025em; line-height: 39px;
margin-bottom: 2.5rem; text-align: center;
/* textStyle display.2xl: font-family CoFo Robert; font-weight 500; */
@media (min-width: 769px)  { font-size: 48px; line-height: 55px; margin-bottom: 3.5rem }  /* lg */
@media (min-width: 1280px) { font-size: 60px }                                            /* 2xl */
```
> Frequently asked questions

Accordion shell:
```css
background: #fff; border: 2px solid rgba(0,0,0,0.05); border-radius: 1.25rem;
color: #000; margin-inline: auto; max-width: 800px; width: 100%;
```
Inner padding wrapper: `padding-inline: 1.25rem` → `lg:` `1.5rem`.

Each item:
```css
border-top: 2px solid rgba(0,0,0,0.05);
padding-block: 1.5rem; padding-inline: 0;
&:first-child { border-top-width: 0 }
@media (min-width: 769px) { padding-inline: 1.5rem }   /* lg */
```

Trigger — `<h3>` wrapping `<button type="button" aria-expanded="false">`:
```css
align-items: center; background: none; border: none; cursor: pointer;
display: flex; padding: 0; text-align: left; width: 100%;
&:hover { background: none }
```
Label `<span>`: `color: #000; flex: 1; font-weight: 700; padding-right: 1.25rem`.
Chevron: Lucide `chevron-down`, 24×24, `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`, `path d="m6 9 6 6 6-6"`, classes `color: #000; flex-shrink: 0; width: 1.5rem; transition: transform 0.2s;` and `[[data-panel-open] &] { transform: rotate(180deg) }`.

Panel — `<div role="region" aria-labelledby=… hidden style="--accordion-panel-height:auto; --accordion-panel-width:auto">`:
```css
height: var(--accordion-panel-height);
overflow: hidden;
transition: height 0.2s ease;
&[data-starting-style], &[data-ending-style] { height: 0 }
```
Answer body `<div>`: `color: rgba(0,0,0,0.60); margin-block: 1rem`.

Inline links inside answers: `color: inherit; margin-inline: 0; padding-inline: 0; text-decoration: underline;` and on hover/active `text-decoration-thickness: 2px; text-underline-offset: 2px; text-decoration-color: #456dff`.

All items ship **closed** (`aria-expanded="false"`, `data-closed`, `hidden`). Base UI Accordion; the DOM shows independent per-item state (no `data-` marker forcing single-open), so build it as click-toggle per item.

**FAQ content, verbatim (8 items):**

1. **`What math topics does Brilliant cover?`** *(value `math-topics`)*
   `Brilliant’s ` [`courses` → `https://brilliant.org/courses/`, `target="_blank" rel="noopener noreferrer"`] ` cover comprehensive math topics from basic arithmetic, algebra, and geometry to advanced subjects like calculus and vectors. Topics also include specialized areas like discrete math, statistics, number theory, and applied mathematics for data science and AI.`

2. **`What math learning paths does Brilliant offer?`** *(value `math-learning-paths`)*
   `Brilliant offers structured math ` [`learning paths` → `https://brilliant.org/courses/`, `target="_blank" rel="noopener noreferrer"`] `, including Foundational Math, Everyday Math, Advanced Math, Logical Reasoning, and Mind-Bending Math. Each path guides you through interconnected concepts in logical sequence, ensuring you build strong foundations before advancing to complex topics.`

3. **`Where should I start learning math?`** *(value `math-start`)*
   `Brilliant determines your optimal starting point on a math learning path after assessing your interests and skill level. Brilliant’s learning paths provide smooth transitions from arithmetic to algebra to calculus, with each lesson building naturally on previous concepts.`

4. **`How can I visualize complex mathematical concepts?`** *(value `math-visualize`)*
   `Brilliant uses interactive visualizations, animations, and hands-on simulations to make abstract math concepts tangible and understandable. You'll see calculus curves change in real-time and manipulate geometric shapes to grasp complex relationships.`

5. **`How can I connect math to real-world applications?`** *(value `math-real-world`)*
   `Brilliant demonstrates practical math applications throughout every course, showing how mathematical concepts solve real problems in physics, engineering, economics, and technology. You'll see math's relevance beyond the classroom through interactive examples.`

6. **`What math do I need for programming and computer science?`** *(value `math-programming`)*
   `Brilliant covers essential math for programming including discrete mathematics, algorithms, logic, and computational thinking. These courses connect mathematical concepts directly to programming applications, which learners can then explore further in Brilliant’s programming courses.`

7. **`What math topics should I learn for data science?`** *(value `math-data-science`)*
   `Brilliant offers courses in statistics, probability, and calculus—all essential math foundations for data science. Brilliant’s data courses then connect these mathematical concepts directly to real-world applications in data analysis.`

8. **`What math should I learn for artificial intelligence?`** *(value `math-ai`)*
   `Brilliant offers courses in statistics, calculus, and neural networks that provide the mathematical foundation for AI and machine learning, connecting mathematical theory directly to AI applications and algorithms.`

Note items 4 and 5 use a straight apostrophe (`You'll`, `math's`) while every other string uses the curly `’`. That is what the source says — copy it exactly.

**JSON-LD** (client-injected, `<script id="math-faq-json-ld" type="application/ld+json">`): `{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[…]}` with one `{"@type":"Question","name":<title>,"acceptedAnswer":{"@type":"Answer","text":<answer>}}` per item. In the JSON-LD the two links are plain inline anchors: `Brilliant’s <a href="https://brilliant.org/courses/">courses</a> cover…` and `Brilliant offers structured math <a href="https://brilliant.org/courses/">learning paths</a>, including…`.

### Section 11 — Closing CTA

`<div data-slot="vstack">`:
```css
align-items: center; display: flex; flex-direction: column;
background-image: var(--lohp-dark-bg);   /* same gradient as §6 */
color: #fff; gap: 3rem; justify-content: center;
padding: 90px 1.25rem 3rem; width: 100%;
@media (min-width: 481px) { padding-inline: 2rem }   /* md */
```

Inner `vstack` `align-items: center; gap: 2.25rem; text-align: center`:
- `<h2>` (CoFo Robert): `font-size: 48px` → `lg:` `60px`; `font-weight: 500; letter-spacing: -.025em; line-height: 110%; margin-bottom: 1.5rem`
  > Everyone is a math person
- `<p>`: `font-size: 16px` → `md:` `20px`; `font-weight: 400; margin-bottom: 0`
  > Join over 10 million people learning interactively.
- Button3D `href="/welcome/?sem=math"`, white-on-dark variant, `max-width: 340px; width: 100%` → `md:` `max-width: 280px`
  > Get started

App-store badges row: `align-items: center; display: flex; flex-direction: row; gap: 14px; justify-content: center` → `lg:` `gap: 22px`. Each `<a>` `border-radius: .75rem; display: inline-flex;` focus-visible ring `3px solid #456dff` at `2px` offset.

| Badge | href | img | alt |
| --- | --- | --- | --- |
| Google Play | `https://play.google.com/store/apps/details?id=org.brilliant.android&listing=try-brilliant-app` | `/images/app-store-badges/get-it-on-google-play.svg` | `Get it on Google Play` |
| App Store | `https://apps.apple.com/app/apple-store/id913335252?pt=105095803&ct=nux_qr_code&mt=8` | `/images/app-store-badges/download-on-the-app-store.svg` | `Download on the App Store` |

Both `<img>` `display: block; height: 44px` → `lg:` `48px`; `width: auto`.

Finally, a decorative full-width illustration: `<img src="/images/homepage/everyone-is-a-math-person.svg" alt="">` (no size classes; sits at the bottom of the flex column).

### Section 12 — Footer

`<div data-slot="flex">`: `display: flex; background: #000; justify-content: center; padding-top: 5rem; width: 100%`.

Inner box: `max-width: 100%` → `sm:` `432px` → `lg:` **1216px**; `margin-inline: 1.5rem` → `lg:` `2.5rem` → `2xl:` `2rem`; `width: 100%`.

**Top row** — `flex`: `align-items: flex-start; flex-direction: column; gap: 0; justify-content: space-between; margin-bottom: 5rem; width: 100%` → `lg:` `margin-bottom: 8rem` → `2xl:` `flex-direction: row`.

- Logo: `<a href="/">` `margin-bottom: 3rem; width: 40%` → `2xl:` `margin-bottom: 0; width: 25%`; wordmark SVG `color: #fff; height: 32px`.
- Link grid: `display: grid; align-items: flex-start; column-gap: 2rem; flex: 1; grid-template-columns: 1fr; row-gap: 3rem; max-width: 100%` → `md:` `width: 576px` → `lg:` `grid-template-columns: repeat(4, 140px); width: 100%` → `2xl:` `grid-template-columns: repeat(5, minmax(0, 1fr)); row-gap: 0`.

Column headings `<p>`: `color: #999; margin-bottom: 1rem;` textStyle `body.base` (16px/1.5 CoFo Brilliant, weight 400).
Links `<a>`: `border-bottom: 2px solid transparent; color: #fff; position: relative;` hover `border-bottom: 2px solid #456dff`. Stacks are `vstack gap: .75rem`.

| Column | Links (label → href) |
| --- | --- |
| **Product** | `Courses` → `/courses/` · `Pricing` → `/subscribe/` · `Gift Brilliant` → `/gift-premium/` · `Resources` → `/resources/` · `Help` → `/help/` |
| **Solutions** | `Educators` → `/educators/` · `Homeschools` → `/start/homeschool/` |
| **Company** | `About us` → `/about/` · `Careers` → `/careers/` |
| **Behind the scenes** | `A Tutor in Every Home` → `https://blog.brilliant.org/a-world-class-tutor-in-every-home/` · `AI at Brilliant` → `https://blog.brilliant.org/hand-crafted-machine-made/` · `AI Evals for Learning Games` → `https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/` · `Visual Algebra` → `https://blog.brilliant.org/visual-algebra/` · `Decomposition and Abstraction` → `https://blog.brilliant.org/decomposition-and-abstraction/` |

The 5th grid cell is the social row — `hstack gap: 1.5rem`, each `<a>` `color: #999; hover: color: #456dff`:

| aria-label | href | icon size |
| --- | --- | --- |
| `Brilliant on Facebook` | `https://www.facebook.com/brilliantorg` | 22×22 |
| `Brilliant on Instagram` | `https://www.instagram.com/brilliantorg` | 21×21 |
| `Brilliant on Twitter` | `https://twitter.com/brilliantorg` | 22×22 (X glyph, `viewBox="0 -1 20 19"`) |
| `Brilliant on LinkedIn` | `https://www.linkedin.com/company/brilliant-org/` | 20×21 |

**Bottom row** — `flex`: `flex-direction: column; gap: 2rem; justify-content: space-between; margin-bottom: 3rem; width: 100%` → `xl:` `margin-bottom: 5rem` → `2xl:` `flex-direction: row`.

Legal cluster: `flex; align-items: center; flex-direction: column; gap: .75rem` → `lg:` `flex-direction: row; gap: 1rem`. Each item wrapped in `flex; justify-content: flex-start; width: 100%` → `lg:` `width: initial`. All use textStyle `body.xs` (12px/1.5), `color: #999`, `border-bottom: 2px solid transparent`, hover `border-bottom: 2px solid #456dff`, `text-align: left`.

| Label (verbatim) | Element | href |
| --- | --- | --- |
| `Terms of service` | `<a>` | `/terms-of-use/` |
| `Do not sell my personal information` | `<button type="button">` (`background: transparent; cursor: pointer`) | — opens a consent UI, no href |
| `California privacy policy` | `<a>` | `/ccpa-policy/` |
| `Privacy policy` | `<a>` | `/privacy/` — `color: #fff` (not gray), `display: inline-flex; align-items: center; gap: .375rem; white-space: nowrap`, followed by an 8×8 external-link arrow SVG |

Copyright `<p>`: `color: #999; word-break: break-word;` textStyle `body.xs` → `2xl:` `width: 50%`.
> © 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.

*(The year is server-rendered from the current date — emit it dynamically or hard-code 2026 to match this capture.)*

---

## 7. Asset inventory

### Already present before this pass

`public/assets/original/brilliant/brilliant.org/…`

| Local path | Used by |
| --- | --- |
| `/_next/static/media/cofo_brilliant_{regular,medium,bold,italic,medium_italic,bold_italic}-s.p.*.woff2` | body font |
| `/_next/static/media/cofo_robert_{medium,medium_italic}-s.p.*.woff2` | headings |
| `/_next/static/media/source_code_pro_*.woff2` | not used by this page's visible markup |
| `/images/app-store-badges/get-it-on-google-play.svg` | §11 |
| `/images/app-store-badges/download-on-the-app-store.svg` | §11 |
| `/videos/homepage/courses/math-refresh.webm` + `/posters/math-refresh.png` | §6 Math tab |

### Downloaded during this pass (19 files, all HTTP 200)

Command used:
```
node scripts/download-original-assets.mjs <urls.txt> public/assets/original/brilliant
```

| Local path under `public/assets/original/brilliant/brilliant.org` | Bytes | Used by |
| --- | --- | --- |
| `/videos/homepage/math-sem-sizzle.webm` | 493,496 | §1 desktop hero video |
| `/videos/homepage/math-sem-sizzle.mp4` | 182,293 | §1 desktop hero video |
| `/videos/homepage/math-sem-sizzle-mobile.webm` | 256,744 | §1 mobile hero video |
| `/videos/homepage/math-sem-sizzle-mobile.mp4` | 125,216 | §1 mobile hero video |
| `/images/homepage/heroes/math-sem-sizzle-fallback.png` | 89,098 | §1 desktop poster, intrinsic **880×1200** |
| `/images/homepage/heroes/math-sizzle-mobile-fallback.png` | 42,142 | §1 mobile poster, intrinsic **660×480** |
| `/images/homepage/heroes/math-scratch.svg` | 3,829 | §1 scratch highlight under "math" |
| `/images/homepage/everyone-is-a-math-person.svg` | 115,867 | §11 bottom illustration |
| `/images/homepage/refresh/math/better-way.png` | 141,961 | §3 |
| `/images/homepage/refresh/math/personalized-learning.png` | 708,170 | §4 |
| `/images/homepage/refresh/math/think-like-mathematician.png` | 199,035 | §5 |
| `/images/homepage/refresh/shared/guided-lessons.png` | 233,537 | §7 |
| `/images/homepage/refresh/shared/stay-motivated.png` | 85,688 | §8 |
| `/videos/homepage/courses/cs-refresh.webm` | 529,353 | §6 CS tab |
| `/videos/homepage/courses/data-refresh.webm` | 692,567 | §6 Data tab |
| `/videos/homepage/courses/science-refresh.webm` | 751,321 | §6 Science tab |
| `/videos/homepage/courses/posters/cs-refresh.png` | 223,739 | §6 CS tab |
| `/videos/homepage/courses/posters/data-refresh.png` | 121,934 | §6 Data tab |
| `/videos/homepage/courses/posters/science-refresh.png` | 154,007 | §6 Science tab |

### Inline SVGs extracted from the page HTML

The page contains **41 inline `<svg>` elements** (no `<img>`-based logos). Each has been written out verbatim to `public/assets/original/brilliant/brilliant.org/inline-svg/`. They use `fill="currentcolor"`, so **inline them as JSX** to keep the `color:` styling — loading them via `<img src>` would render them all black.

| File | Size | Used by |
| --- | --- | --- |
| `brilliant-wordmark.svg` | 114×27 | header ×2, footer |
| `koji-peek.svg` | 53×53 | §1 hover mascot (has its own fills + a `#e2ee62` linear gradient) |
| `badge-apple-editors-choice.svg` | 139×45 | §1, §2 |
| `badge-google-play-featured-app.svg` | 139×45 | §1, §2 |
| `five-stars.svg` | 156×28 | §2 |
| `logo-the-new-york-times.svg` | 185×25 | §2 |
| `logo-the-atlantic.svg` | 170×27 | §2 |
| `logo-stanford.svg` | 118×26 | §9 |
| `logo-mit.svg` | 59×31 | §9 |
| `logo-google.svg` | 100×33 | §9 |
| `logo-caltech.svg` | 100×25 | §9 |
| `logo-harvard.svg` | 177×38 | §9 (largest, includes the shield) |
| `logo-microsoft.svg` | 142×31 | §9 |
| `icon-chevron-down.svg` | 24×24 | §10 accordion (Lucide `chevron-down` — can also be imported from `lucide-react`) |
| `icon-facebook.svg` | 22×22 | §12 |
| `icon-instagram.svg` | 21×21 | §12 |
| `icon-twitter-x.svg` | 22×22 | §12 |
| `icon-linkedin.svg` | 20×21 | §12 |
| `icon-external-link.svg` | 8×8 | §12 privacy-policy link |

**Note on `clipPath` ids.** Several extracted SVGs keep short local ids (`a`, `b`, `clip0_78_55633`). Inlining more than one on the same page risks id collisions — namespace them per component when converting to JSX.

### Image delivery

Photographic images are served through Cloudflare Image Resizing:
`/cdn-cgi/image/width=<w>,quality=75,format=auto/<original path>` with `srcSet` giving `width=1080` @1x + `width=1920` @2x on desktop, and `width=750` @1x + `width=1920` @2x on mobile. Locally, serve the plain originals and let `next/image` handle resizing.

---

## 8. Responsive summary

| Element | base | sm 360 | md 481 | lg 769 | xl 992 | 2xl 1280 |
| --- | --- | --- | --- | --- | --- | --- |
| Header row max-width | 100% | 432px | 432px | 1216px | 1216px | 1216px |
| Header padding-inline | 1.5rem | | 2rem | | | |
| Header padding-top | .75rem | | 1.5rem | | | |
| Hero layout | stacked | | | | **2-column** | |
| Hero h1 font-size | 35px | | 44px | 60px | **76px** | |
| Hero h1 max-width | 350px | | 430px | 100% | | |
| Hero h1 text-align | center | | | | **left** | |
| Hero CTA size | 45px × 100% | | 60px × 353px | | 60px × 284px | |
| Value-prop direction | column | | | **row / row-reverse** | | |
| Value-prop container | 100% | 432px | 432px | 1216px | 1216px | |
| Value-prop image min-height | 300px | | | **728px** | | |
| Value-prop h2 font-size | 3rem | | | **3.75rem** | | |
| Course-section h2 | 3rem | | | 3.75rem | | 3.75rem |
| Course panel direction | column-reverse | | | | **row** | |
| Course video box | h 260 (sm) | | h 375 | | h 456 / w 550 | w 700 |
| Course "additional" UI | inline expand button | | | | **hover popover** | |
| Experts logo width | 100% | | | 25% (`xs` 50%) | | auto |
| Experts h2 | 3rem | | | 3.75rem | | |
| FAQ h2 | 35px | | | 48px | | 60px |
| Footer link grid | 1 col | | 576px wide | repeat(4, 140px) | | repeat(5, 1fr) |
| Footer bottom row | column | | | | | **row** |

`xs` (320px) is used only once, for the experts logo width (`50%`).

---

## 9. Interaction model summary

| Section | Model | Detail |
| --- | --- | --- |
| Header sticky bar | **scroll-driven** | `scrollY > 200` → slide in (spring damping 25 / stiffness 180); `scrollY < 92` → slide out (150ms easeInOut). Framer Motion `y: "-100%" ↔ 0`. |
| Hero videos | **time-driven (autoplay loop)** | `autoPlay muted loop playsInline`; fade in via `opacity 0→1` on the `onCanPlay`+`play()` promise; poster `<img>` underneath; only the matching breakpoint's `<source>` list mounts. |
| Hero CTA mascot | **hover-driven** | `:hover` on the button wrapper slides `[data-koji-peek]` from `translateY(100%)` to `0` over `0.2s ease-out`, inside a 30px `overflow:hidden` window. `xl` and up only. |
| Value props | **static** | Pure CSS gradients and a `::before` background image. No scroll effects, no observers. |
| Course tabs | **click-driven** | Base UI `Tabs`; panels cross-fade in an overlapping grid (out `100ms ease-out`, in `300ms ease-out 100ms`). Auto-advance is explicitly disabled on `/math`. |
| "N additional courses" | **hover-driven (`xl`+) / click-driven (below)** | Popover opens on `mouseenter`, closes 150ms after `mouseleave`. Below `xl`, a button expands the list in place. |
| Tab pill hover/selected | **hover-driven** | `::before` gradient cross-fades over `500ms ease-out`. |
| FAQ | **click-driven** | Height animates `0 ↔ auto` over `0.2s ease` via `--accordion-panel-height`; chevron rotates 180° over `0.2s`. All closed initially. |
| Buttons (all) | **hover / active** | `:hover { opacity: .85 }` on the 3D wrapper; `:active` collapses the 4px shadow and the `-4px` translate simultaneously over `100ms ease-out`. |
| Footer links | **hover-driven** | Transparent 2px bottom border → `#456dff`. |
| Sponsor modal | **not rendered** | `ssr:false` + gated on a sponsor discount that anonymous visitors do not have. |

---

## 10. Sibling routes

`/cs`, `/ai`, `/data`, `/science`, `/tech` use the same page shell. Confirmed differences from the bundle:

- `ValuePropSections` picks a different 5-item array per `pageContext`. For `cs` the images live under `/images/homepage/refresh/cs/` (`better-way.png`, `personalized-learning.png`, `think-like-programmer.png`) and reuse `/images/homepage/refresh/shared/{guided-lessons,stay-motivated}.png`. Copy for `cs` (verbatim, for reference): "A better way to⏎learn CS", "Personalized⏎learning", "Think like a⏎programmer", "Guided CS⏎lessons", "Stay⏎motivated".
- `courseSectionHeading` is looked up per context: `math` → `Reach your math goals and more`; `cs` → `Reach your CS goals and more`; `algebra` → `Reach your algebra goals and more`; `calculus` → `Reach your calculus goals and more`; `coding` → `Reach your coding goals and more`; `logic` → `Reach your logic goals and more`; `python` → `Reach your Python goals and more`. **`ai`, `tech`, `data`, `science` are absent from that map**, which means they fall through to the older `ValuePropSections` branch rather than the refresh branch — their layout is not the same as `/math` and must be captured separately, not assumed.
- `getRefreshCourseGroups(pageContext)` hoists the matching tab to position 1 (`cs|ai|tech|python|coding|logic` → Computer Science; `math|algebra|calculus|geometry|collegemath|gradeschoolmath|fractions|equations|high-school-math|middle-school-math` → Math; `science` → Science; `data|statistics` → Data Analysis).
- The `sem=` query param on every hero/CTA link follows the route (`sem=math` here).

**Only `/math` was fetched for this spec.** Everything stated about sibling routes comes from reading the shared bundle, not from fetching those pages. Do not build them from this document without capturing them.

---

## 11. Unavailable / not extracted

Everything the page renders was extracted. The following are listed for completeness — render nothing for them, or note the limitation:

1. **FAQ JSON-LD in SSR HTML** — injected client-side by `next/script`, so absent from the fetched markup. Its exact object is reproduced in §7 from the JS bundle; that reproduction is verified, not inferred.
2. **Course tab panels for Computer Science, Data Analysis and Science** — the SSR HTML ships three *empty* panel divs. Their course lists, videos and posters were recovered verbatim from the JS bundle (§6) and the video/poster files have been downloaded, so nothing is actually missing; but note that a curl of the HTML alone would not show them.
3. **`<video>` `<source>` elements in the hero** — absent from SSR HTML because they mount only after hydration. URLs recovered from the bundle and verified with HTTP 200 (§7).
4. **`StaticPageSponsorModal`** — renders nothing for anonymous visitors. **Render nothing.** No sponsor markup, copy, or styling could be observed, and none should be invented.
5. **`/images/opengraph/learn-interactively.png`** — referenced by `og:image` only; never painted on the page. Not downloaded (not needed for the visual rebuild); download it only if the clone needs real OG metadata.
6. **`elevation.outline` focus-ring shadow value** — the `focusVisible:panda-bx-sh_elevation.outline` utility resolves through a shadow token that was not needed for any visible state. If focus rings matter, read `--panda-shadows-elevation-outline` from `1fm-51vueb4hl.css`.
7. **KaTeX** — `25j833ur1vg3n.css` loads 20 KaTeX font faces, but no math is typeset in this page's markup. Skip it.
8. **Hover/active screenshots** — no browser was used (shared instance), so every interaction above is derived from declared CSS and bundle source rather than observed rendering. All the underlying declarations are quoted, so nothing is guessed.

---

## 12. Working files

- Fetched HTML: `/private/tmp/claude-501/-Users-kydyrbekbekarys-SolveX4schools/673fb55d-204d-4123-9fe3-9a31bd6e2ca2/scratchpad/agent-b-subject-priv/math.html`
- CSS bundles: same directory, `1fm-51vueb4hl.css`, `25j833ur1vg3n.css`, `157prbu77y-tm.css`
- 56 JS chunks: `…/agent-b-subject-priv/js/`
  - page component: `2j8-g2wfwgp9y.js` (hero, scratch highlight, `/math` page composition)
  - sections: `2buwplfj_0k6u.js` (social proofs, value props, course section, experts)
  - header: `02rvqn-tom-1e.js` (`LohpHeader`, `RefreshUpsell`)
  - gradient helper: `16070` module in `0eko0do5w38hl.js`
- Download list: `…/agent-b-subject-priv/b-subject-urls.txt`
