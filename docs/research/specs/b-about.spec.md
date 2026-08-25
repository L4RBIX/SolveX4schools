# b-about — `https://brilliant.org/about/`

Forensic spec for a 1:1 rebuild. Every value below was read out of the live HTML,
the live Panda CSS bundle, or the page's own JS chunk. Nothing here is invented.
Where something could not be extracted it is listed under **Unavailable**.

---

## 1. Overview

| Field | Value |
|---|---|
| URL | `https://brilliant.org/about/` |
| HTTP status | **200** (`curl -sL`, Chrome 131 UA), 73,585 bytes |
| `<title>` | `About | Brilliant` |
| Canonical | `https://brilliant.org/about/` |
| Framework | Next.js **Pages Router**, static export (`nextExport: true`, `autoExport: true`), buildId `78mQYyAURlk19iAhF14q5` |
| `__NEXT_DATA__.props.pageProps` | `{}` — the whole page is hard-coded in the page component, no CMS payload |
| Styling | **Panda CSS** atomic classes (`panda-*`) + design tokens on `:where(:root,:host)` |
| Accordion / Tabs primitives | **Base UI** (`base-ui-:R…:` ids, `data-panel-open`, `role="tablist"/"tabpanel"`) |
| Icons | one **lucide** `chevron-down`; every other icon is a hand-authored inline `<svg>` |
| Page component chunk | `/_next/static/chunks/39zrjfrd8rrbi.js` (40,945 B) — contains the entire page source |
| CSS bundles | `/_next/static/chunks/1fm-51vueb4hl.css` (1.08 MB, Panda), `157prbu77y-tm.css` (next/font faces), `25j833ur1vg3n.css` (KaTeX — unused by this page) |
| No `<meta name="description">` | only `og:description` (site-wide generic string, see §9) |
| Page render | fully server-rendered **except** the header's right-hand auth buttons (§4.0) |

There is **no video, no carousel, no scroll-driven animation, no IntersectionObserver
and no `position: sticky`** anywhere on this page. The only motion is: the accordion
height transition, the chevron rotation, a 0.7 s image fade-in on tab switch, and the
scroll-triggered sticky header duplicate (which lives in the shared header, §4.0).

---

## 2. Design tokens actually used by this page

All values are the **declared** values from the Panda `:root` block.

### 2.1 Palette

| Token | Hex | Where used |
|---|---|---|
| `white` | `#fff` | page background, header bg, tab selected bg |
| `black` | `#000` | body text, footer bg, Button3D hard edge |
| `gray.50` | `#f8f8f8` | "What we do" gradient, accreditation band bg, careers band bg |
| `gray.100` | `#f2f2f2` | "We help people" gradient end, tab list track |
| `gray.200` | `#e5e5e5` | tab hover bg (md+) |
| `gray.500` | `#999` | footer column labels, footer legal links, social icons |
| `gray.900` | `#383838` | `bg.inverse.secondary` — the "See Brilliant careers" button face |
| `blue.50` | `#f6f8ff` | "Our approach" gradient |
| `blue.100` | `#ecf0ff` | hero gradient stop 2 |
| `blue.500` | `#456dff` | footer link hover underline, `text.link`, focus ring |
| `purple.50` | `#faf7ff` | "Our learners" gradient |
| `papaya.50` | `#fff8f6` | "Our method" gradient |
| `papaya.300` | `#ffc3b8` | hero gradient stop 4 |
| `pink.200` | `#ffe1f7` | hero gradient stop 3 |
| `yellow.200` | `#fdf3d3` | hero gradient overlay |
| `blackAlpha.100` | `#0000000d` (4 %) | `border.secondary` — accordion card + row rules |
| `blackAlpha.200` | `#0000001a` (10 %) | `border.primary` — header bottom rule; accreditation divider |
| `blackAlpha.500` | `#0006` (40 %) | "OUR MISSION" eyebrow |
| `blackAlpha.600` | `#00000080` (50 %) | unselected tab label |
| `blackAlpha.700` | `#0009` (60 %) | `text.secondary` — accordion body copy, tab body copy, blog dates |

Semantic aliases: `bg.primary → white`, `text.primary → black`,
`text.secondary → blackAlpha.700`, `text.inverse → white`,
`text.onColor.primary → white`, `text.link → blue.500`,
`border.primary → blackAlpha.200`, `border.secondary → blackAlpha.100`,
`elevation.shadow.cta.default → black`.

> **Token mapping for this repo.** `globals.css` has no equivalents for
> `#f8f8f8 / #f2f2f2 / #f6f8ff / #faf7ff / #fff8f6 / #ffc3b8 / #ffe1f7 / #fdf3d3 / #ecf0ff / #999 / #383838 / #456dff`.
> Do **not** add tokens (that file is off-limits). Use Tailwind arbitrary values with
> the exact hex above, e.g. `bg-[#f8f8f8]`, `text-[#999]`. `text-b-ink` (#000),
> `bg-b-white`, `border-b-line` (rgba(0,0,0,.1) ≡ `blackAlpha.200`) do match and
> should be used where they apply.

### 2.2 Type scale (declared `textStyle` rules)

| textStyle | family | size | weight | line-height | letter-spacing |
|---|---|---|---|---|---|
| `body.xs` | CoFo Brilliant | 12px | 400 | 1.5 | 0 |
| `body.sm` | CoFo Brilliant | 14px | 400 | 1.5 | 0 |
| `body.base` | CoFo Brilliant | 16px | 400 | 1.5 | 0 |
| `heading.sm` | CoFo Brilliant | 16px | 700 | 1.4 | 0 |
| `heading.md` | CoFo Brilliant | 20px | 700 | 1.25 | 0 |
| `ui.actions.base` | CoFo Brilliant | 16px | 500 | 1.25 | 0 |

Global base (`@layer reset`): `font-family: "CoFo Brilliant", sans-serif`,
`line-height: 1.5`, `-webkit-font-smoothing: antialiased`.
`h1–h6 { font-size: inherit; font-weight: inherit; text-wrap: balance }` — headings
carry **no** implicit size; every size on this page is explicit.
`a { color: inherit; text-decoration: none }`. `ol, ul, menu { list-style: none }`.

Letter-spacing tokens: `tight = -.025em`, `normal = 0em`.

### 2.3 Spacing / radii / sizes

Panda spacing scale is `n × 0.25rem` (`4 = 1rem`, `6 = 1.5rem`, `8 = 2rem`,
`10 = 2.5rem`, `12 = 3rem`, `16 = 4rem`, `20 = 5rem`, `24 = 6rem`, `32 = 8rem`,
`40 = 10rem`; `1.5 = .375rem`, `3.5 = .875rem`).

Radii: `lg = .75rem (12px)`, `xl = 1rem (16px)`, `2xl = 1.25rem (20px)`,
`3xl = 2rem (32px)`, `full = 9999px`.

Sizes: `appBar = 64px`, `containerLg/Xl = 1216px`, `containerSm/Md = 432px`.
z-index: `appBar = 999`, `relativeBack = -1`, `relativeFront = 1`, `relativeFront2 = 2`.

Shadows on this page: only `elevation.outline = 0 0 0 3px #456dff` (focus-visible)
and the Button3D hard edge `0 4px 0 0 <color>` (no blur, matches `.b-physical`).

### 2.4 Fonts

Two families are actually used:

- **CoFo Brilliant** (default body/sans) → repo `font-b-sans`.
  Faces preloaded: regular 400, medium 500, bold 700, plus italics.
- **CoFo Robert** medium 500 → repo `font-b-serif`. Applied via an **inline style**
  on every `<h2>`: `font-family:'coFoRobertFont', 'coFoRobertFont Fallback', Georgia, serif`.
  Fallback metrics: `local(Arial); ascent-override:92.49%; descent-override:28.93%; line-gap-override:0%; size-adjust:101.63%`.

`Source Code Pro` and `KaTeX_*` are preloaded site-wide but **unused on this page**.

All font files already exist locally under
`public/assets/original/brilliant/brilliant.org/_next/static/media/`.

### 2.5 Breakpoints (exact, from `breakpoints` export + emitted media queries)

| name | min-width | emitted as |
|---|---|---|
| `xs` | 320px | — |
| `sm` | 360px | `@media screen and (min-width:22.5rem)` |
| `md` | 481px | `@media screen and (min-width:30.0625rem)` |
| `lg` | **769px** | `@media screen and (min-width:48.0625rem)` |
| `xl` | 992px | `@media screen and (min-width:62rem)` |
| `2xl` | 1280px | `@media screen and (min-width:80rem)` |

**`lg` is 769px, not Tailwind's 1024px.** Every `lg:` in this spec means ≥769px.
`md` = 481px, `sm` = 360px, `2xl` = 1280px. The builder must map these explicitly
(e.g. `min-[769px]:`) or the layout will break at the wrong widths.

One height-based query exists: `@media (max-height: 550px)` on the hero.

---

## 3. Layout primitives (so the markup matches)

| Component | Element | Base styles |
|---|---|---|
| `Box` | `div[data-slot=box]` | none |
| `Flex` | `div[data-slot=flex]` | `display:flex` |
| `HStack` | `div[data-slot=hstack]` | `display:flex; flex-direction:row; align-items:center` |
| `VStack` | `div[data-slot=vstack]` | `display:flex; flex-direction:column; align-items:center` |
| `Section` | `section[data-slot=section]` | none |
| `Heading` | `h1…h6[data-slot=heading]` | none |
| `P` | `p[data-slot=p]` | none |
| `Img` | `img[data-slot=img]` | none |
| `Span` | `span[data-slot=span]` | none |

Page shell: `BasePage` = `VStack{gap:0; min-height:100dvh}` + `align="stretch"`
→ `align-items:stretch`. `fullWidth` is set, so page content is **not** wrapped in
the site's centred container; each section owns its own container.

The shared content container used by 8 of the sections:

```
maxWidth: full;  sm:432px;  md:432px;  lg:1216px;  xl:1216px;  margin-inline:auto
```

That 1216px matches the repo's `.b-shell-narrow`.

---

## 4. Section-by-section structure

Top-to-bottom order (verbatim from the page component's JSX):
**header → hero → "We help people" → "What we do" → "Our approach" → "Our learners" → "What we teach" → accreditation → "Our method" → "More reading" → "Great minds think here" → footer.**

All page content between header and footer is wrapped in one `Box{background:white}`.

---

### 4.0 Header — `AppHeaderContainer`

Interaction model: **static shell + scroll-driven duplicate (client-only)**

Server-rendered markup (what the HTML actually contains — the auth query is still
loading, so `AppHeaderContainer` renders with **no children**):

```
div[data-slot=box]
  align-items:center; background:#fff; border-bottom:1px solid rgba(0,0,0,.10);
  display:flex; flex-direction:column; max-width:100%;
  padding-inline:24px (md:32px); top:0; width:100%; z-index:999
  └ div[data-slot=hstack]
      align-items:center; flex-wrap:nowrap;
      gap:24px (md:32px, lg:40px);
      height:64px; justify-content:space-between;
      max-width: full / sm 432 / md 432 / lg 1216 / xl 1216; width:100%
      └ a[href="/"] { color:#000 }
          └ svg  Brilliant wordmark, height:24px (md:32px), max-height:48px, min-height:20px
```

After hydration, for a logged-out visitor the JS renders **two** copies of that bar:

1. the in-flow bar, with an `HStack{gap:8px}` on the right containing
   - `Sign in` → `buildLoginUrl(asPath)`, Button3D `secondaryOutline`, `height:48px`,
     `padding-inline:24px`, `display:none` below `lg`, `inline-flex` at `lg+`
   - `Sign up` → `/welcome/`, Button3D `primary` / green, `height:48px`, `padding-inline:20px`
2. a duplicate wrapped in `motion.div` with
   `position:fixed; left:0; right:0; top:0; z-index:999`,
   `initial={false}`, `animate={{ y: scrolled ? "0%" : "-100%" }}`,
   `transition={{ duration: 0.2, ease: "easeInOut" }}`,
   where `scrolled = window.scrollY > 200`.

So: **the sticky header slides in from above once you pass 200px of scroll.**
That is the only scroll-driven behaviour on the route. Reproduce it with
`motion/react` (`motion.div`, same 0.2 s `easeInOut`, same 200px threshold).

Wordmark SVG (verbatim, `viewBox="0 0 114 27"`, `fill="none"`, 11 `<path fill="currentColor">`):

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

---

### 4.1 Hero — "Our Mission / Making a world of great problem solvers"

Interaction model: **static**

```
VStack (outer)
  align-items:center; justify-content:center; gap:0; width:100%; position:relative
  min-height: calc(96.5vh - 64px);   lg: calc(95vh - 64px)
  background:
    linear-gradient(246deg, transparent 38.81%, #fdf3d3 100%),
    linear-gradient(144deg, #fff 34.94%, #ecf0ff 57.88%, #ffe1f7 80.83%, #ffc3b8 104.47%),
    #fff
  ::before {
    content:""; position:absolute; left:0; right:0; bottom:0; height:100%;
    background-image: url(/images/about/hero-mobile.svg);
    lg: background-image: url(/images/about/hero.svg);
    background-position-x:center; background-position-y:bottom;
    background-repeat:no-repeat;
    /* NO background-size → images render at intrinsic size */
  }
  └ VStack (inner)
      max-width:926px; padding-inline:16px; text-align:center; z-index:1
      margin-top:-50%;   lg: margin-top:-160px;   @media (max-height:550px){ margin-top:0 }
      ├ p   color:rgba(0,0,0,.4); font-weight:medium*; letter-spacing:3px;
      │     margin-bottom:16px; text-transform:uppercase; font-size:16px/1.5
      │     → "Our Mission"
      └ h1  color:#000; font-size:36px (md:48px, lg:72px); font-weight:700;
            letter-spacing:-.025em; line-height:100%; family: CoFo Brilliant
            → "Making a world of great problem solvers"
```

\* `font-weight: medium` is what Panda emits verbatim — an **invalid** CSS value, so
the eyebrow computes to the inherited 400. Reproduce with `font-weight:400`
(or omit) to match the rendered result; do not "fix" it to 500.

The hero `<h1>` is the page's only `h1`. It uses the **sans** face, not the serif.

---

### 4.2 "We help people…" statement band

Interaction model: **static**

```
Box  background-image: linear-gradient(180deg, #fff 0%, #f2f2f2 100.02%)
     padding-inline:24px (lg:32px); padding-block:64px (lg:96px)
  └ Box  max-width: full / sm 432 / md 432 / lg 957px; margin-inline:auto
      └ h2  font-family: CoFo Robert (inline style); color:#000; text-align:center;
            font-size:30px (lg:48px); font-weight:medium*; line-height:120% (md:110%)
```

Copy, with three `ScratchHighlight` spans inline:

> We help people **⟨excel⟩** in STEM, in **⟨less time,⟩** with more **⟨purpose and joy⟩**

Each highlighted span is `display:inline-block; position:relative; z-index:1` with:

```
::after {
  content:""; position:absolute; left:50%; z-index:-1;
  background-image: var(--scratch-image);
  background-position:center; background-repeat:no-repeat; background-size:contain;
  top: var(--scratch-top); transform: var(--scratch-transform);
  width: var(--scratch-width); height: var(--scratch-height);
}
```

| word(s) | `--scratch-image` | top | transform | width | height |
|---|---|---|---|---|---|
| `excel` | `/images/about/excel-scratch.svg` | `50%` | `translate(-50%, -50%)` | `120%` | `120%` |
| `less time,` | `/images/about/less-time-scratch.svg` | `50%` | `translateX(-50%)` | `110%` | `120%` |
| `purpose and joy` | `/images/about/purpose-and-joy-scratch.svg` | `40%` | `translateX(-50%)` | `110%` | `120%` |

---

### 4.3–4.5 Three split sections (shared component)

Interaction model: **static**. Same component, three instances.

```
section  padding-inline:24px (lg:32px); padding-block:64px (lg:0);
         max-width:100vw; overflow:hidden; position:relative
         background-image: var(--about-bg-base)      /* mobile */
         lg: background-image: var(--about-bg-desktop)
  └ Flex  max-width: full / sm 432 / md 432 / lg 1216 / xl 1216; margin-inline:auto
          align-items:flex-start (lg:center)
          flex-direction: column-reverse;  lg: row  (or row-reverse when asset is left)
          gap:16px (lg:24px);  justify-content:center (lg:space-between)
      ├ VStack  align-items:flex-start; flex:1; gap:24px;
      │         justify-content:start (lg:center);
      │         justify-self:auto (lg: end | start);
      │         max-width:100% (lg:480px); text-align:left
      │   ├ h2  font-family: CoFo Robert (inline); color:#000; text-align:left; width:100%
      │   │     font-size:36px (md:48px); font-weight:400; letter-spacing:-.025em; line-height:110%
      │   └ p   color:#000; 16px/1.5 CoFo Brilliant; paragraphs separated by <br><br>
      └ Box (asset)  flex:1 1 0%; flex-shrink:0; min-height:300px (lg:728px);
                     position:relative; width:100%;
                     margin-left:0;  lg: -1.5rem (asset right) | 1.5rem (asset left)
            ::before { content:""; position:absolute; inset-block-end:0; height:100%;
                       background-image: var(--about-mobile-image);
                       lg: background-image: var(--about-image);
                       background-repeat:no-repeat; background-size:contain;
                       object-fit:cover; … per-instance values below }
```

| # | heading | gradient color | `--about-bg-base` | `--about-bg-desktop` | asset side | image (desktop / mobile) | ::before extras |
|---|---|---|---|---|---|---|---|
| 4.3 | **What we do** | `gray.50` | `linear-gradient(0deg,#f8f8f8 0%,white 100%)` | `linear-gradient(90deg,white 0%,#f8f8f8 100%)` | right (`lg:row`) | `what-we-do.svg` / same | `background-position:center`; `left:0 (lg:auto)`, `right:0`, `width:100% (lg:90%)` |
| 4.4 | **Our approach** | `blue.50` | `linear-gradient(0deg,#f6f8ff 0%,white 100%)` | `linear-gradient(90deg,#f6f8ff 0%,white 100%)` | left (`lg:row-reverse`) | `lesson-completions-chart.svg` / same | `background-position:center (lg:right)`; `left:0`, `right:0 (lg:auto)`, `width:100% (lg:70%)`, `lg:max-width:468px` |
| 4.5 | **Our learners** | `purple.50` | `linear-gradient(0deg,#faf7ff 0%,white 100%)` | `linear-gradient(90deg,white 0%,#faf7ff 100%)` | right (`lg:row`) | `our-learners.svg` / `our-learners-mobile.svg` | `background-position:bottom`; `left:0 (lg:auto)`, `right:0`, `width:100% (lg:90%)` |

---

### 4.6 "What we teach" — tabs

Interaction model: **click-driven** (Base UI `Tabs`, `activateOnFocus: true`, so
arrow-key focus also switches). Controlled by an index in `useState(0)`.
Only the active panel is in the DOM.

```
section  padding-inline:24px; padding-block:64px (lg:108px); width:100%
  └ Box (shared container, lg 1216)
      └ Tabs.Root  display:flex; flex-direction:column; align-items:center; width:100%
          ├ Flex  flex-direction:column (lg:row); width:100%
          │   ├ Box  width:100% (lg:50%)
          │   │   └ h2 "What we teach"  → §4.11 heading style, margin-bottom:32px (lg:0)
          │   └ Box
          │       └ Tabs.List  role="tablist"
          │           background:#f2f2f2; border-radius:16px; display:flex; flex-wrap:nowrap;
          │           gap:0 (md:8px); height:58px; justify-content:space-between;
          │           overflow-x:auto; scrollbar-width:none; [&::-webkit-scrollbar]{width:0};
          │           padding:6px; white-space:nowrap; width:auto; z-index:2
          │           └ 2 × button[role=tab]
          │               background:none; border:none; border-radius:12px; cursor:pointer;
          │               display:flex; align-items:center; justify-content:center;
          │               color:rgba(0,0,0,.5); font-size:14px (md:16px); font-weight:bold;
          │               padding:12px 12px (md:16px 20px); height:auto;
          │               width:50% (lg:auto)
          │               hover → color:#000;  md:hover → background-color:#e5e5e5
          │               selected → background:#fff; color:#000;
          │                          box-shadow:0px 1px 8px 0px #0000000D;
          │                          selected:hover → background:#fff
          └ Tabs.Panel  padding-inline:0 (md:16px); width:100%
              ├ Flex justify-content:flex-end
              │   └ Box width:100% (lg:50%)
              │       └ p  color:rgba(0,0,0,.6); margin-top:20px (lg:16px);
              │             margin-bottom:40px (lg:64px); 16px/1.5
              └ img  animation: fadeIn 0.7s ease; width:100%
                     @keyframes fadeIn { 0%{opacity:0} to{opacity:1} }
```

Image source is **JS-selected, not `srcset`**:
`useMediaQuery("(min-width: 769px)", { initializeWithValue: false })` →
renders the *mobile* SVG on the server and on first paint, then swaps to the desktop
SVG after mount at ≥769px.

| tab (`title`) | desktop image | mobile image | body copy (verbatim) |
|---|---|---|---|
| `Math` | `what-we-teach-math.svg` | `what-we-teach-math-mobile.svg` | After covering all concepts of Algebra, we’ll turn to building out our coverage of Geometry, Probability, Calculus, and beyond in 2026. |
| `Coding` | `what-we-teach-cs.svg` | `what-we-teach-cs-mobile.svg` | We will cover all of foundational algorithm design and data structures by the end of 2026. This will bridge complete beginners from their first program all the way through the end of college-level introductory computer science courses. |

Tab labels are literal strings `"Math"` and `"Coding"` (not translated messages).
`img alt` = the tab title.

---

### 4.7 Accreditation band

Interaction model: **static**

```
Box  background:#f8f8f8; padding-inline:24px (lg:32px); padding-block:72px (lg:108px)
  └ Box (shared container, lg 1216)
      └ Flex  flex-direction:column (lg:row); gap:0
          ├ Box  display:flex; align-items:center; justify-content:center;
          │      border-style:solid; border-color:rgba(0,0,0,.10);
          │      border-bottom-width:1px (lg:0);  border-right-width:0 (lg:1px);
          │      padding-bottom:32px (lg:0);  padding-right:0 (lg:32px)
          │   └ img  src=/images/about/math-counts.png  (491×153)
          │          alt="Math Counts Foundation Partner"
          │          margin-inline:auto; max-width:232px (lg:auto)
          └ Flex  align-items:center; flex-direction:column (lg:row); gap:20px;
                  padding-left:0 (lg:32px); padding-top:32px (lg:0)
              ├ img  src=/images/about/wasc-logo.png  (550×209)
              │      alt="WASC Accredited"; margin-inline:auto; max-width:232px (lg:auto)
              └ VStack  align-items:center (lg:flex-start)
                  └ p  color:#000; text-align:center (lg:left); 16px/1.5
                       → "<strong>Brilliant is fully accredited</strong> by the
                          Accrediting Commission for Schools, Western Association
                          of Schools and Colleges."
```

The `<strong>` here is a plain `<strong>` (no extra class).

---

### 4.8 "Our method" — accordion

Interaction model: **click-driven accordion**, `multiple: false` (one open at a time),
`keepMounted: true` (all panels present in the DOM, `hidden` + `data-closed` when
closed), **all four closed on load**. Base UI `Accordion`.

```
section  background-image: var(--about-method-bg-base)
         lg: background-image: var(--about-method-bg-desktop); lg:padding-block:108px
         padding-inline:24px; padding-block:64px; width:100%
  --about-method-bg-base    = linear-gradient(0deg, #fff8f6 0%, white 100%)
  --about-method-bg-desktop = linear-gradient(90deg, white 0%, #fff8f6 100%)
  └ Box (shared container, lg 1216)
      └ Flex  flex-direction:column (lg:row)
          ├ Box  width:100% (lg:50%)  →  h2 "Our method" (§4.11 heading style)
          └ Box  width:100%
              └ div  (accordion card)
                  background:#fff; border:2px solid rgba(0,0,0,.04);
                  border-radius:20px; color:#000;
                  margin-inline:auto; max-width:800px; width:100%
                  └ Accordion.Root  role="region" dir="ltr" data-orientation="vertical"
                      └ div  padding-inline:20px (lg:24px)
                          └ 4 × Accordion.Item
                              padding-inline:0 (lg:24px); padding-block:24px;
                              border-top:2px solid rgba(0,0,0,.04);
                              &:first-child { border-top-width:0 }
                              ├ h3 > button (Trigger)
                              │   align-items:center; background:none; border:none;
                              │   cursor:pointer; display:flex; padding:0;
                              │   text-align:left; width:100%; hover{background:none}
                              │   ├ span  color:#000; flex:1; font-weight:700;
                              │   │       padding-right:20px; 16px/1.5
                              │   └ svg  lucide chevron-down, 24×24, stroke:currentColor,
                              │          stroke-width:2, stroke-linecap/join:round,
                              │          width:24px; flex-shrink:0; color:#000;
                              │          transition: transform 0.2s;
                              │          [data-panel-open] & { transform: rotate(180deg) }
                              │          path d="m6 9 6 6 6-6"
                              └ Accordion.Panel  role="region"
                                  height: var(--accordion-panel-height);
                                  overflow:hidden; transition: height 0.2s ease;
                                  &[data-starting-style], &[data-ending-style] { height:0 }
                                  └ div  color:rgba(0,0,0,.6);
                                         margin-top:16px; margin-bottom:16px
```

Note the card has **no** `title` prop here, so there is no header row inside the card
(unlike the FAQ page's accordions) — the section `h2` sits outside it in the left column.

Item `value`s (for keys / anchors): `a-personal-tutor-for-all`,
`targeted-practice-and-review`, `designed-to-be-fun`, `visual-and-interactive`.

---

### 4.9 "More reading"

Interaction model: **static**

```
section  padding-inline:24px; padding-block:64px (lg:108px); width:100%
  └ Box (shared container, lg 1216)
      ├ h2 "More reading"  (§4.11 heading style, margin-bottom:32px (lg:60px))
      └ Flex  align-items:center; flex-direction:column (lg:row); gap:40px (lg:64px)
          ├ img  src=/images/about/more-reading.svg  alt=""
          │      border-radius:32px; width:100% (lg:50%)
          └ VStack  align-items:flex-start; gap:20px; width:100% (lg:50%)
              └ 4 × Box
                  ├ a  target="_blank" rel="noopener noreferrer"
                  │    color:#000; font-size:16px (lg:20px); font-weight:bold;
                  │    margin-bottom:4px; margin-inline:-4px; padding-inline:4px;
                  │    text-decoration:none;
                  │    hover/active → text-decoration:underline; text-underline-offset:2px;
                  │                   text-decoration-thickness:2px;
                  │                   text-decoration-color:#456dff (border.select);
                  │                   (active also sets color:#456dff)
                  │    focus-visible → box-shadow:0 0 0 3px #456dff; overflow:clip;
                  │                    background:#fff
                  └ p  color:rgba(0,0,0,.6); 14px/1.5 (lg:16px/1.5)
```

Template for the meta line: `{date} • {length} min read`.

| # | title | href | date | length |
|---|---|---|---|---|
| 1 | Hand-crafted, Machine made: How we make learning games | `https://blog.brilliant.org/hand-crafted-machine-made/` | Jan 30 | 5 |
| 2 | Programming in 2025: A preview of our upcoming CS courses | `https://blog.brilliant.org/decomposition-and-abstraction/` | Jan 10 | 3 |
| 3 | Game on: Solving for x-citement with interactive Algebra | `https://blog.brilliant.org/solving-equations/` | Nov 8 | 2 |
| 4 | Coding rebooted: Computer Science on Brilliant | `https://blog.brilliant.org/thinking-in-code/` | Nov 4 | 2 |

---

### 4.10 "Great minds think here" — careers

Interaction model: **static**

```
section  background:#f8f8f8; padding-inline:24px; padding-block:64px (lg:108px); width:100%
  └ Box (shared container, lg 1216)
      └ Flex  align-items:center; flex-direction:column (lg:row); gap:40px (lg:64px)
          ├ Box  width:100% (lg:50%)
          │   ├ h2 "Great minds think here" (§4.11 style, margin-bottom:24px (lg:32px))
          │   ├ p  color:#000; margin-bottom:24px (lg:32px); 16px/1.5
          │   └ a[data-slot=button3d] href="/careers/" role="link"
          └ img  src=/images/about/careers.svg  alt=""  width:100% (lg:50%)
```

**Button3D** (the only button in the page body):

```
a[data-slot=button3d]
  border-radius: calc(56px / var(--button3d-x-scale, 1)) / 56px;
  cursor:pointer; display:inline-flex; position:relative; outline:none;
  -webkit-tap-highlight-color:transparent;
  hover { opacity:.85 }
  focus-visible { box-shadow: 0 0 0 3px #456dff }
  └ span[data-slot=button3d-face]
      --button3d-shadow-color: #000;                       /* elevation.shadow.cta.default */
      box-shadow: 0 var(--button3d-shadow-y, 4px) 0 0 var(--button3d-shadow-color);
      transform: translateY(var(--button3d-translate-y, -4px));
      transition: transform 100ms ease-out, box-shadow 100ms ease-out;
      border-radius: calc(60px / var(--button3d-x-scale, 1)) / 60px;
      align-items:center; display:inline-flex; justify-content:center; gap:8px;
      padding:14px 24px; position:relative; width:100%;
      background:#383838;  color:#fff;
      font: 500 16px/1.25 "CoFo Brilliant";
      :active > &, [data-active] > &, [data-disabled] > &, [data-loading] > & {
        box-shadow:none; transform:none;
      }
      └ span[data-slot=button3d-content]
          align-items:center; display:inline-flex; gap:8px; position:relative; z-index:1
          → "See Brilliant careers"
```

Rendered height = 14 + 20 + 14 = **48px**; the hard 4px bottom edge and the −4px lift
are exactly the repo's `.b-physical` / `.b-press` idiom (no blur).
This instance has **no** shimmer overlay and **no** text-shadow.

---

### 4.11 Shared section-heading style (`What we teach`, `Our method`, `More reading`, `Great minds think here`)

```
h2[data-slot=heading]
  style="font-family:'coFoRobertFont','coFoRobertFont Fallback',Georgia,serif"
  color:#000; font-size:32px (md:48px); font-weight:medium*;
  letter-spacing:normal (0); line-height:120%;
  margin-bottom: (per instance — 32px/0, 32px/60px, 24px/32px)
```

\* again the literal invalid `font-weight: medium`; CoFo Robert ships only a 500 face,
so it renders as the 500 face. Use `font-weight:500` with `font-b-serif`.

---

### 4.12 Footer

Interaction model: **static** (one link fires an external consent widget, §9).

```
Flex  background:#000; justify-content:center; padding-top:80px; width:100%
  └ Box  max-width: full / sm 432 / lg 1216;
         margin-left:24px (lg:40px, 2xl:32px);
         margin-right:24px (lg:40px, 2xl:32px);  width:100%
      ├ Flex  align-items:flex-start; flex-direction:column (2xl:row); gap:0;
      │       justify-content:space-between; margin-bottom:80px (lg:128px); width:100%
      │   ├ a[href="/"]  margin-bottom:48px (2xl:0); width:40% (2xl:25%)
      │   │   └ svg wordmark  color:#fff; height:32px   (same paths as §4.0)
      │   └ Box  display:grid; align-items:flex-start; flex:1; max-width:100%;
      │          grid-template-columns: 1fr | lg: repeat(4, 140px) | 2xl: repeat(5, minmax(0,1fr));
      │          column-gap:32px; row-gap:48px (2xl:0); width: md 576px / lg full
      │       (5 grid children, in order: Product, Solutions, Company, Behind the scenes, Socials)
      └ BottomLinks
          Flex  flex-direction:column (2xl:row); gap:32px;
                justify-content:space-between; margin-bottom:48px (xl:80px); width:100%
```

**Link column** (`LinkVStack`): label `p` = `color:#999; margin-bottom:16px; 16px/1.5`;
list = `VStack{align-items:flex-start; gap:12px}`; each item wrapped in a `Box`.
Link style: `border-bottom:2px solid transparent; color:#fff; position:relative;`
hover → `border-bottom:2px solid #456dff`.
The Company and "Behind the scenes" columns are additionally wrapped in
`VStack{align-items:flex-start; gap:24px}`.

| Column | Items (label → href) |
|---|---|
| **Product** | Courses → `/courses/` · Pricing → `/subscribe/` · Gift Brilliant → `/gift-premium/` · Resources → `/resources/` · Help → `/help/` |
| **Solutions** | Educators → `/educators/` · Homeschools → `/start/homeschool/` |
| **Company** | About us → `/about/` · Careers → `/careers/` |
| **Behind the scenes** | A Tutor in Every Home → `https://blog.brilliant.org/a-world-class-tutor-in-every-home/` · AI at Brilliant → `https://blog.brilliant.org/hand-crafted-machine-made/` · AI Evals for Learning Games → `https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/` · Visual Algebra → `https://blog.brilliant.org/visual-algebra/` · Decomposition and Abstraction → `https://blog.brilliant.org/decomposition-and-abstraction/` |

**Socials** — `HStack{gap:24px}`; each `a[target=_blank]` with `color:#999; hover{color:#456dff}`,
`aria-label` as given, icon `flex-shrink:0`:

| aria-label | href | svg |
|---|---|---|
| Brilliant on Facebook | `https://www.facebook.com/brilliantorg` | 22×22, `viewBox="0 0 22 22"` |
| Brilliant on Instagram | `https://www.instagram.com/brilliantorg` | 21×21, `viewBox="0 0 21 21"` |
| Brilliant on Twitter | `https://twitter.com/brilliantorg` | 22px×22px, `viewBox="0 -1 20 19"` |
| Brilliant on LinkedIn | `https://www.linkedin.com/company/brilliant-org/` | 20px×21px, `viewBox="0 0 20 21"` |

Path data (single `<path fill="currentColor">` each):

- **Facebook** — `M0 11.0662C0.00127985 16.5108 3.9361 21.1467 9.28038 22V14.2648H6.48977V11.0662H9.28368V8.6313C9.15878 7.47753 9.55044 6.32766 10.3524 5.49353C11.1544 4.6594 12.2837 4.22747 13.4338 4.31489C14.2594 4.32831 15.0829 4.40229 15.8977 4.53625V7.2578H14.5074C14.0287 7.19472 13.5475 7.35378 13.1993 7.69018C12.8511 8.02657 12.6735 8.5039 12.7167 8.98768V11.0662H15.7647L15.2774 14.2659H12.7167V22C18.4964 21.0809 22.5493 15.7697 21.9393 9.91413C21.3293 4.05853 16.2698 -0.291573 10.4263 0.0152787C4.58284 0.322131 0.000928892 5.17851 0 11.0662Z`
- **Instagram** — `M10.4942 21C7.62576 21 7.28762 20.9849 6.16824 20.936C5.29533 20.9073 4.43371 20.7301 3.62049 20.412C2.21347 19.8652 1.10089 18.7538 0.553859 17.3486C0.247553 16.5336 0.0823418 15.6726 0.0652971 14.8022C0 13.6868 0 13.3212 0 10.479C0 7.60662 0.0151582 7.27129 0.0652971 6.15935C0.0827146 5.29019 0.24792 4.43031 0.553859 3.61643C1.10029 2.20937 2.21468 1.09701 3.62399 0.551896C4.43862 0.244747 5.29996 0.079343 6.17057 0.0628743C7.28412 0 7.65025 0 10.4942 0C13.3859 0 13.7182 0.0151364 14.8201 0.0628743C15.693 0.0794854 16.5566 0.244871 17.3737 0.551896C18.7826 1.09762 19.8968 2.20977 20.4438 3.61643C20.7553 4.44217 20.9214 5.3155 20.9347 6.19777C21 7.31321 21 7.67764 21 10.5186C21 13.3596 20.9837 13.7322 20.9347 14.8348C20.9173 15.706 20.7517 16.5679 20.445 17.3836C19.8965 18.7897 18.7823 19.9015 17.3737 20.4481C16.5578 20.7534 15.6959 20.9183 14.8248 20.936C13.7112 21 13.3463 21 10.4942 21ZM10.4545 1.84315C7.60244 1.84315 7.30627 1.85712 6.19273 1.90719C5.52808 1.91598 4.86985 2.03845 4.24664 2.26929C3.32636 2.62093 2.59815 3.34513 2.24225 4.26264C2.0093 4.89173 1.88663 5.5562 1.87962 6.22688C1.81782 7.35512 1.81782 7.65086 1.81782 10.479C1.81782 13.2735 1.82832 13.6123 1.87962 14.7335C1.89006 15.3974 2.01266 16.0548 2.24225 16.678C2.59868 17.5949 3.32676 18.3185 4.24664 18.6702C4.86943 18.9025 5.52792 19.0251 6.19273 19.0323C7.32143 19.0975 7.61877 19.0975 10.4545 19.0975C13.3148 19.0975 13.6109 19.0835 14.7152 19.0323C15.3803 19.0242 16.039 18.9017 16.6624 18.6702C17.5771 18.3155 18.3006 17.5935 18.6563 16.6803C18.8888 16.0507 19.0115 15.3859 19.0189 14.7149H19.0318C19.0819 13.6018 19.0819 13.3049 19.0819 10.4604C19.0819 7.61593 19.0691 7.3167 19.0189 6.20476C19.0085 5.54161 18.8859 4.88499 18.6563 4.26264C18.3014 3.34814 17.5778 2.62476 16.6624 2.26929C16.0391 2.03729 15.3803 1.91478 14.7152 1.90719C13.5876 1.84315 13.2926 1.84315 10.4545 1.84315ZM10.4942 15.8571C8.3137 15.8585 6.34713 14.5481 5.51161 12.537C4.67609 10.5258 5.1362 8.21013 6.67736 6.66986C8.21852 5.1296 10.5372 4.66815 12.5519 5.50072C14.5667 6.33329 15.8807 8.29589 15.8812 10.4732C15.878 13.4435 13.4688 15.8513 10.4942 15.8571ZM10.4942 6.97788C8.56225 6.97788 6.99611 8.54175 6.99611 10.4709C6.99611 12.4 8.56225 13.9639 10.4942 13.9639C12.4261 13.9639 13.9922 12.4 13.9922 10.4709C13.9877 8.54361 12.4242 6.98236 10.4942 6.97788ZM16.0911 6.14771C15.3978 6.14513 14.8375 5.58252 14.8388 4.89023C14.84 4.19794 15.4024 3.6374 16.0957 3.6374C16.789 3.6374 17.3514 4.19793 17.3527 4.89022C17.353 5.22422 17.2201 5.5446 16.9834 5.78056C16.7466 6.01652 16.4255 6.14863 16.0911 6.14771Z`
- **Twitter/X** — `M15.2718 1.58667H18.0831L11.9413 8.60625L19.1666 18.1583H13.5093L9.07828 12.365L4.00821 18.1583H1.19528L7.76445 10.6501L0.833252 1.58667H6.63418L10.6394 6.88195L15.2718 1.58667ZM14.2852 16.4757H15.8429L5.78775 3.18095H4.11614L14.2852 16.4757Z`
- **LinkedIn** — `M11.1111 21H6.66665V7H11.1111V9.33333C12.0585 8.0678 13.4951 7.31333 15.0277 7.2765C17.784 7.29257 20.008 9.64761 20 12.5417V21H15.5555V13.125C15.3778 11.8214 14.313 10.8542 13.0589 10.857C12.5103 10.8752 11.9925 11.1274 11.6249 11.5554C11.2573 11.9834 11.0718 12.5502 11.1111 13.125V21ZM4.44444 21H0V7H4.44444V21ZM2.22222 4.66667C0.994921 4.66667 0 3.622 0 2.33333C0 1.04467 0.994921 0 2.22222 0C3.44951 0 4.44444 1.04467 4.44444 2.33333C4.44444 2.95217 4.21031 3.54566 3.79356 3.98325C3.37682 4.42083 2.81159 4.66667 2.22222 4.66667Z`
- **ArrowUpRight** (8×8, `viewBox="0 0 8 8"`, `aria-hidden="true"`) — `M0.707107 2H4.29289L0 6.29289L1.41421 7.70711L5.70711 3.41421V7H7.70711V0H0.707107V2Z`

**Bottom links row** — inner `Flex{align-items:center; flex-direction:column (lg:row); gap:12px (lg:16px)}`,
each item in `Flex{justify-content:flex-start; width:100% (lg:initial)}`.
All four use `color:#999; text-align:left; 12px/1.5` plus the shared
`border-bottom:2px solid transparent; hover{border-bottom:2px solid #456dff}`:

1. `Terms of service` → `/terms-of-use/`
2. `Do not sell my personal information` → **`<button type="button">`**, `background:transparent; cursor:pointer`; onClick calls `window.OneTrust.ToggleInfoDisplay()`
3. `California privacy policy` → `/ccpa-policy/`
4. `Privacy policy` → `/privacy/` — overrides `color:#fff`, `display:inline-flex; align-items:center; justify-content:flex-start; gap:6px; white-space:nowrap`, followed by the 8×8 ArrowUpRight icon

Copyright `p`: `color:#999; 12px/1.5; word-break:break-word; 2xl:width:50%`
→ `© {year} Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.`
(`{year}` = `new Date().getFullYear()`; the fetched page rendered **2026**.)

---

## 5. Verbatim copy deck

Every string on the page, in DOM order. `⏎⏎` marks a `<br><br>` paragraph break.
Curly apostrophes (’) and en/em dashes (– —) are as published — do not straighten them.

### Header
```
Sign in
Sign up
```
*(client-rendered only; absent from the server HTML)*

### Hero
```
Our Mission
Making a world of great problem solvers
```

### Statement band
```
We help people excel in STEM, in less time, with more purpose and joy
```
(highlighted fragments: `excel` · `less time,` · `purpose and joy`)

### What we do
```
What we do

At Brilliant, we help our learners achieve much higher levels of ability in STEM, in less time, with more purpose and joy.⏎⏎We do this by designing learning that’s interactive, adaptive, and fun — and delivering it through a personal tutor at an accessible price.⏎⏎Our focus is on math and coding, and the problem-solving skills those subjects imbue.
```

### Our approach
```
Our approach

What’s the best way to teach variables to a beginner? This is the kind of question that everyone at Brilliant – from math PhDs to engineers and designers – obsesses over.⏎⏎We read every piece of feedback. We measure everything. Knowing how many users practice every day, and whether people solve problems of increasing difficulty over time, allows us to get the learning experience just right.⏎⏎This is what’s driving our exponential growth. With millions of problem tries every day, we’re rapidly increasing the pace at which we’re able to test our pedagogical ideas.
```

### Our learners
```
Our learners

As an ethos, we teach people who take pride in having a well-trained mind. Our learners ask “how far can I go?” not “what will be on the test?”. They know the future belongs to people who don’t wait for permission to set their own bar.⏎⏎In a world with AI, we need even more critical thinkers, not fewer. We help create them across a range of learners: students seeking to excel in STEM, homeschools seeking an engaging curriculum, and lifelong learners staying sharp.⏎⏎We’ve grown on the strength of being so good that you’ll voluntarily learn each day. This is very hard to do for math. But we’re demonstrating that it’s possible.
```

### What we teach
```
What we teach

Math
Coding

[Math]   After covering all concepts of Algebra, we’ll turn to building out our coverage of Geometry, Probability, Calculus, and beyond in 2026.

[Coding] We will cover all of foundational algorithm design and data structures by the end of 2026. This will bridge complete beginners from their first program all the way through the end of college-level introductory computer science courses.
```

### Accreditation
```
Math Counts Foundation Partner        (img alt)
WASC Accredited                       (img alt)
Brilliant is fully accredited by the Accrediting Commission for Schools, Western Association of Schools and Colleges.
```
(`Brilliant is fully accredited` is wrapped in `<strong>`.)

### Our method — accordion

**Item 1 — `A personal tutor for all`**
```
Brilliant’s tutor, Koji, is personalized, rigorous, and built to help learners prove to themselves they can do hard things. Koji is infinitely patient, asks instead of tells, builds confidence instead of dependency, and never, ever just hands you the answer.⏎⏎Koji can see what’s on your screen, so we know where you’re stuck and can intervene in the ideal way. Some of how Koji does this is:⏎⏎**User knowledge modeling**. Teaching well requires having an understanding of what the learner does and doesn’t know. We’re combining techniques from intelligent tutoring systems, classic ML recommender systems, and natural language conversations to identify exactly where a learner’s misconception lies.⏎⏎**On-the-fly visual and interactive generation**. Learners get lost in a wall of text. They want a visual or a manipulable interactive, problems that exactly match the question they have, and the ability to practice on near-neighbor problems just like it. Our content has been built over many years to enable [precisely this functionality](https://blog.brilliant.org/hand-crafted-machine-made/).⏎⏎Good tutoring makes itself unnecessary. Our goal is for Koji’s actions to gradually become things the student initiates themselves, until Koji is barely needed at all. The point is to make the student feel seen while they do the thinking themselves.
```
`**…**` = `<strong style="font-weight:700">`.
The link is `target="_blank" rel="noopener noreferrer"`, `color:#456dff`,
hover/active → `text-decoration:underline; text-decoration-thickness:2px; text-underline-offset:2px; text-decoration-color:#456dff`.

**Item 2 — `Targeted practice and review`**
```
Every lesson has associated practice sets. These practice sets are designed to feel like low-stakes quizzes. The frequency, timing, and composition of practice sets are an area of active experimentation, to maximize effective retrieval and automaticity.⏎⏎In practice sets, the scaffolding falls away — you’re being tested on your independent ability to answer the questions, so there are no more visual aids or hints.⏎⏎For constructing personalized practice, we predict the optimal next problem X to ask, so that you are adequately prepared to answer a future question Y. This is also a generalized testing umbrella within which we test spaced repetition (especially in weak areas), mixing practice problems from different concepts (so that the learner must identify what approach to use to solve each problem, rather than just applying the same procedure to every problem), determining level of effective automaticity (fast solving speed with no mistakes), and optimal length and difficulty per set.⏎⏎Review sets that combine problems from preceding lessons are currently being rolled out on a course-by-course basis (we human-review everything, which is why this has a gradual rollout).
```

**Item 3 — `Designed to be fun`**
```
To learn math well requires many, many reps. The precise amount required varies among individuals, but everyone needs practice. We design a variety of mechanisms to make it fun to practice, and satisfying to progress to more challenging sets.⏎⏎Our gamification layer provides scaffolding for motivation and habit formation. This provides another tool to help learners stick with learning even in the absence of tutors or parents who help foster motivation.⏎⏎On Brilliant, the content itself is designed to feel fun — from the pedagogical design of the interactives and problem progression, to the types of sounds, feedback, and haptics we provide as you interact.⏎⏎Most of the increase in usage and learner retention has come from excellent content delivery, but gamification helps. We avoid packing too many game incentives into the product to keep the focus on the learning content, but aim to execute well on a few core habit formation loops. These include Streaks and Leagues.⏎⏎Learners progress through levels of progressively more difficult problem solving in a topic. The leveling system intentionally displays a more reductive view of concept connections and prerequisites than the underlying reality. It is focused on providing learners with clear and satisfying milestones to work toward.⏎⏎Progress is also gamified — including in how we structure XP and pass/fail feedback and routing. Currently, we’re working on testing various mechanics to extend your learning session, i.e., motivate learners to continue with the next appropriate practice, review, or lesson.⏎⏎Overall, approaches to building both intrinsic and extrinsic motivation are an area of active investigation and testing.
```

**Item 4 — `Visual and interactive`**
```
Our lessons prioritize visual representations and active learning.⏎⏎Each lesson focuses on a single concept and has a mix of direct instruction and blocked problem solving (i.e., practicing similar problems). ⏎⏎We first build intuition with visual explanations, hands-on manipulation, and concrete computation. We start with the simplest version of an idea, minimizing cognitive load. Each interactive problem gives instant, custom feedback based on your answer.⏎⏎As concepts build on one another, we challenge learners to try more advanced computations and combine ideas to solve problems.⏎⏎We don’t teach how to do something before asking questions. Instead, we pretest on the material, letting the learner try to find a solution before learning the procedure. Based on our testing to date, we believe this is the optimal approach.
```
*(the trailing space after "similar problems). " is in the source — keep or drop, it is not rendered.)*

### More reading
```
More reading

Hand-crafted, Machine made: How we make learning games
Jan 30 • 5 min read

Programming in 2025: A preview of our upcoming CS courses
Jan 10 • 3 min read

Game on: Solving for x-citement with interactive Algebra
Nov 8 • 2 min read

Coding rebooted: Computer Science on Brilliant
Nov 4 • 2 min read
```

### Careers
```
Great minds think here

Come work alongside a team of diverse talents – multiple IMO medalists, ex-Editor-in-Chief at The Onion, Cannes Lion winner, knitwear designer for Marvel, an Amazon top 50 book of the year writer, and PhDs and dropouts from MIT, Caltech, Stanford, and Harvard to name a few.

See Brilliant careers
```

### Footer
```
Product
Courses
Pricing
Gift Brilliant
Resources
Help
Solutions
Educators
Homeschools
Company
About us
Careers
Behind the scenes
A Tutor in Every Home
AI at Brilliant
AI Evals for Learning Games
Visual Algebra
Decomposition and Abstraction
Brilliant on Facebook          (aria-label)
Brilliant on Instagram         (aria-label)
Brilliant on Twitter           (aria-label)
Brilliant on LinkedIn          (aria-label)
Terms of service
Do not sell my personal information
California privacy policy
Privacy policy
© 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.
```

---

## 6. Asset inventory

All 17 raster/vector assets referenced by this page were downloaded and now exist at
`public/assets/original/brilliant/brilliant.org/images/about/`
(serve them as `/assets/original/brilliant/brilliant.org/images/about/<file>`).

| File | Intrinsic size | Used by | Notes |
|---|---|---|---|
| `hero.svg` | 2108 × 561 | §4.1 `::before` at `lg` | no `background-size` → renders at intrinsic size, anchored bottom-centre |
| `hero-mobile.svg` | 1259 × 529 | §4.1 `::before` below `lg` | same |
| `excel-scratch.svg` | 131 × 59 | §4.2 highlight | |
| `less-time-scratch.svg` | 188 × 24 | §4.2 highlight | |
| `purpose-and-joy-scratch.svg` | 366 × 18 | §4.2 highlight | |
| `what-we-do.svg` | 808 × 668 | §4.3 (desktop **and** mobile) | |
| `lesson-completions-chart.svg` | 468 × 502 | §4.4 (desktop and mobile) | |
| `our-learners.svg` | 741 × 727 | §4.5 desktop | |
| `our-learners-mobile.svg` | 345 × 361 | §4.5 mobile | |
| `what-we-teach-math.svg` | 1082 × 605 | §4.6 Math ≥769px | 218 KB |
| `what-we-teach-math-mobile.svg` | 353 × 440 | §4.6 Math <769px + SSR | 253 KB |
| `what-we-teach-cs.svg` | 1081 × 604 | §4.6 Coding ≥769px | 245 KB |
| `what-we-teach-cs-mobile.svg` | 353 × 440 | §4.6 Coding <769px | 263 KB |
| `math-counts.png` | 491 × 153 | §4.7 | |
| `wasc-logo.png` | 550 × 209 | §4.7 | |
| `more-reading.svg` | 534 × 350 | §4.9 | rendered with `border-radius:32px` |
| `careers.svg` | 518 × 376 | §4.10 | |

Fonts — already present at
`public/assets/original/brilliant/brilliant.org/_next/static/media/`:
`cofo_brilliant_regular / medium / bold (+italics)`, `cofo_robert_medium (+italic)`.

Inline SVG count in the served HTML: **11** (2 × wordmark, 4 × chevron-down,
4 × social, 1 × arrow-up-right). All path data is reproduced in §4.

**Not needed for this page** (referenced only site-wide): `/favicon.ico`,
`apple-touch-icon-*.png` (already local), `/images/opengraph/learn-interactively.png`,
`source_code_pro_*` and `KaTeX_*` faces.

---

## 7. Interaction model summary

| Element | Model | Exact behaviour |
|---|---|---|
| Sticky header duplicate | **scroll-driven** | fixed copy of the header; `y: -100% → 0%` when `window.scrollY > 200`; `duration 0.2s`, `ease easeInOut`; `motion.div` with `initial={false}` |
| Header `Sign in` / `Sign up` | static (client-only render) | absent from SSR HTML; `Sign in` hidden below `lg` |
| "What we teach" tabs | **click-driven** (+ focus) | Base UI `Tabs`, `activateOnFocus: true`, controlled index `0 \| 1`, default `0` (Math); only the active panel is mounted |
| Tab panel image | **breakpoint-driven swap** | `useMediaQuery("(min-width: 769px)", {initializeWithValue:false})`; mobile SVG on server + first paint, desktop after mount |
| Tab panel image entry | time-driven | `animation: fadeIn 0.7s ease` (`0%{opacity:0} → to{opacity:1}`) on every panel mount |
| "Our method" accordion | **click-driven** | single-open (`multiple:false`), all closed initially, `keepMounted:true`; panel `transition: height 0.2s ease` via `--accordion-panel-height`; chevron `transform: rotate(180deg)` on `[data-panel-open]`, `transition: transform 0.2s`; arrow-up/down/Home/End move focus between triggers (loops) |
| Button3D (`See Brilliant careers`) | hover / active | hover `opacity:.85`; `:active` removes both the `translateY(-4px)` and the `0 4px 0 0 #000` edge |
| Blog title links | hover / active / focus | 2px underline in `#456dff` at 2px offset; focus-visible `0 0 0 3px #456dff` + white bg |
| Footer links | hover | 2px bottom border swaps `transparent → #456dff` |
| `Do not sell my personal information` | click → 3rd-party | calls `window.OneTrust.ToggleInfoDisplay()`; no OneTrust in this repo — render the button and make the handler a no-op |
| Social links | click | plain `target="_blank"`. The live site *conditionally* interposes a "You’re about to leave Brilliant’s website to visit {siteName}." modal, but **only for authenticated minors** (`session.privacy.isMinorAge`) — unreachable on a static clone; omit it |

Nothing on the page uses IntersectionObserver, `position: sticky`, or scroll-linked
reveal animations.

---

## 8. Responsive notes

- **Mobile-first.** Content column stacks; the three split sections use
  `flex-direction: column-reverse`, i.e. the **illustration renders above the text**
  on small screens, and beside it from 769px.
- Section horizontal padding: `24px` everywhere; four sections widen to `32px` at `lg`
  (statement band, the three split sections, accreditation band). "What we teach",
  "Our method", "More reading" and "Great minds" stay at `24px` at all widths.
- Section vertical rhythm: `64px` base → `108px` at `lg` for the four full-width
  sections; the accreditation band is `72px → 108px`; the statement band `64px → 96px`;
  the split sections are `64px` block padding on mobile and **`0`** at `lg`
  (their height then comes from the `min-height: 728px` asset column).
- The split-section asset column is `min-height:300px` on mobile, `728px` at `lg`.
- Container ladder: `full → 432px (sm/md) → 1216px (lg/xl)`. The statement band caps
  at `957px` at `lg`; the accordion card caps at `800px` at all widths.
- Footer grid: 1 column → `repeat(4, 140px)` at `lg` → `repeat(5, minmax(0,1fr))` at `2xl`.
  The wordmark is `40%` wide and stacked above until `2xl`, then `25%` beside.
  Footer gutters: `24px → 40px (lg) → 32px (2xl)`.
- Tab buttons are `50%` wide each below `769px` (filling the pill), `auto` above.
- The hero uses viewport-height math (`96.5vh`/`95vh` minus the 64px bar) plus a
  `@media (max-height: 550px)` escape that zeroes the negative top margin.

---

## 9. Head / metadata (for the route file)

```
<title>About | Brilliant</title>
canonical      https://brilliant.org/about/
og:type        website
og:image       https://brilliant.org/images/opengraph/learn-interactively.png
og:description Guided interactive problem solving that’s effective and fun. Try thousands of interactive lessons in math, programming, data analysis, AI, science, and more.
twitter:card   summary_large_image
twitter:site   @brilliantorg
viewport       width=device-width,initial-scale=1.0,viewport-fit=cover,interactive-widget=resizes-content
```
There is **no** `<meta name="description">` on this page.
App-link meta (`al:ios:*`, `al:android:*`) and `<link rel="alternate" href="android-app://…">`
are site-wide; not needed for the clone.

---

## 10. Unavailable / not extractable

- **Header `Sign in` / `Sign up` buttons** — not in the server HTML. Their labels,
  hrefs, sizes and variants were read out of the header JS chunk (§4.0) and are
  reliable; their *exact rendered pixel* padding/colour for the `secondaryOutline`
  and `primary/green` Button3D variants was **not** measured, because those recipe
  rules were not reachable from this page's CSS payload. Build them from the
  documented props (`height:48px`, `padding-inline:24px` / `20px`) and the
  Button3D geometry in §4.10; if a variant's exact fill is needed, it must be
  measured on a page that ships it.
- **Banner slot** — `MarketingPage` can render a `Banner` above the header
  (`ssr:false`, GraphQL `useGetBannerQuery`). The fetched page returned none, so
  there is nothing to reproduce. Render nothing.
- **Illustration internals** — the 17 SVG/PNG assets are used as-is from
  `public/assets/original/…`. Their internal artwork is not described here and must
  not be redrawn or substituted.
- **`window.OneTrust`** — third-party consent widget; not present in this repo.
- **The minor-age external-link modal** (§7) — gated behind an authenticated GraphQL
  field that a static clone cannot reach.
- **Hover/active screenshots** — no browser was used for this extraction (shell only),
  so all interaction values above come from declared CSS and JS, not from observation.
- **Rendered pixel heights** of the hero and split sections — they depend on
  viewport height (`vh`) and on intrinsic SVG size, so no fixed number exists.
