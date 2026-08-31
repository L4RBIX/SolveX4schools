# b-legal — brilliant.org `/terms-of-use/`

Forensic build spec. Every number, colour and word below was read out of the live
HTML and the live CSS bundles. Nothing here is inferred from taste, and nothing is
invented. Where something could not be determined it is listed under
**§13 Unavailable** and must be rendered as *nothing*.

---

## 1. Fetch record

| | |
|---|---|
| URL | `https://brilliant.org/terms-of-use/` |
| HTTP status | **200** |
| Final URL | `https://brilliant.org/terms-of-use/` (no redirect) |
| Bytes | 88,617 |
| Fetched | 2026-08-21, plain `curl` with a Chrome 131 UA |
| Renderer | Next.js **Pages Router** (`__NEXT_DATA__.page === "/terms-of-use"`), fully server-rendered |
| `buildId` | `78mQYyAURlk19iAhF14q5` |
| `pageProps` | `{}` — empty. The legal copy is **hard-coded in the page component**, not fetched from a CMS. |
| `<title>` | `Brilliant | Learn by doing` (generic site title — the page does **not** set its own) |
| Canonical | `https://brilliant.org/terms-of-use/` |
| CSS bundles | `/_next/static/chunks/157prbu77y-tm.css` (2,883 B)<br>`/_next/static/chunks/1fm-51vueb4hl.css` (1,083,281 B)<br>`/_next/static/chunks/25j833ur1vg3n.css` (24,957 B) |
| CSS engine | **Panda CSS** (atomic, `panda-` prefix, `:not(#\#)` specificity padding) |

All 117 utility classes used on the page were resolved against the real bundles.
Only 2 failed to resolve on the first pass and both were escape-sequence artefacts
(`.\32 xl\:…`); after correct unescaping **every class resolved**. There are no
un-styled classes on this page.

### Full-text copy source

The complete verbatim article text (99 blocks, inline `<strong>` / `<em>` / `<a>` /
`<br>` runs preserved) is checked in next to this spec as a machine-readable file:

```
docs/research/specs/b-legal.content.json
```

**The builder must render from that file and must not retype, paraphrase, shorten
or "clean up" any sentence.** This spec quotes headings, nav, ToC and footer in
full (they are short and structurally load-bearing) and quotes the long legal
paragraphs only as clearly-marked excerpts.

---

## 2. Design tokens actually resolved on this page

### 2.1 Breakpoints (Panda `@media screen and (min-width: …)`)

| prefix | declared | px |
|---|---|---|
| `sm` | `22.5rem` | **360** |
| `md` | `30.0625rem` | **481** |
| `lg` | `48.0625rem` | **769** |
| `xl` | `62rem` | **992** |
| `2xl` | `80rem` | **1280** |

> These are **not** Tailwind's defaults. Tailwind `sm/md/lg/xl/2xl` = 640/768/1024/1280/1536.
> Reproduce with arbitrary variants: `min-[360px]:`, `min-[481px]:`, `min-[769px]:`,
> `min-[992px]:`, `min-[1280px]:`. Do **not** substitute Tailwind's stops.

### 2.2 Spacing scale (only the steps this page uses)

| token | rem | px |
|---|---|---|
| `spacing-0` | 0 | 0 |
| `spacing-1.5` | .375rem | 6 |
| `spacing-2` | .5rem | 8 *(only on `/privacy/` — see §14)* |
| `spacing-3` | .75rem | 12 |
| `spacing-4` | 1rem | 16 |
| `spacing-6` | 1.5rem | 24 |
| `spacing-8` | 2rem | 32 |
| `spacing-10` | 2.5rem | 40 |
| `spacing-12` | 3rem | 48 |
| `spacing-16` | 4rem | 64 |
| `spacing-20` | 5rem | 80 |
| `spacing-32` | 8rem | 128 |

### 2.3 Sizes

| token | value |
|---|---|
| `sizes-5` | 1.25rem / 20px |
| `sizes-6` | 1.5rem / 24px |
| `sizes-8` | 2rem / 32px |
| `sizes-12` | 3rem / 48px |
| `sizes-full` | 100% |
| `sizes-app-bar` | **64px** |
| `z-index-app-bar` | **999** |

### 2.4 Colours (fully dereferenced)

| semantic token | resolves to | hex/rgba | where used on this page |
|---|---|---|---|
| `bg.primary` | `white` | `#ffffff` | header bar background |
| `bg.secondary` | `gray.50` | **`#f8f8f8`** | page root background (the article sits on this) |
| `border.primary` | `black-alpha-200` | **`#0000001a`** = `rgba(0,0,0,.10)` | 1px header bottom rule |
| `text.primary` | `black` | `#000000` | header logo, all body text |
| `text.link` | `blue.500` | **`#456dff`** | every in-article link, every ToC link |
| `text.onColor.primary` | `white` | `#ffffff` | footer "Privacy policy" link |
| `gray.500` | — | **`#999999`** | footer column labels, footer legal row, social icons, copyright |
| `blue.500` | — | **`#456dff`** | footer hover underline + social icon hover |
| `black` | — | `#000000` | footer background |
| `white` | — | `#ffffff` | footer nav links, footer logo |
| `transparent` | — | `transparent` | the "Do not sell…" button background |

Declared but **not used anywhere on this page** (do not introduce them):
`border.secondary` `#0000000d`, `text.secondary` `#0009`.

#### Mapping to this project's tokens

| measured | project token | verdict |
|---|---|---|
| `#ffffff` | `bg-b-white` / `text-b-white` | exact match — use the token |
| `#000000` | `bg-b-ink` / `text-b-ink` | exact match — use the token |
| `rgba(0,0,0,.10)` | `border-b-line` | exact match — use the token |
| `#f8f8f8` | — | **no token.** `b-paper` is `#f5f3f1`, which is a *different* colour. Use `bg-[#f8f8f8]`. |
| `#999999` | — | **no token.** `b-muted` is `rgba(0,0,0,.4)`; that composites to `#999999` on white but the footer is on **black**, where it would be invisible. Use `text-[#999999]`. |
| `#456dff` | — | **no token.** `b-blue` is `#4a5cd6`, a different colour. Use `text-[#456dff]` / `border-[#456dff]`. |

Per the brief, **define no new tokens in `globals.css`** — use Tailwind arbitrary
values for the three unmapped colours.

### 2.5 Typography — text styles used

Every text style on this page resolves to `--panda-fonts-brilliant` =
`"CoFo Brilliant", sans-serif` → project token **`font-b-sans`**. `CoFo Robert`
(`font-b-serif`) and `Source Code Pro` (`font-b-mono`) are loaded by the bundle but
**never applied on this page**.

| textStyle | font-size | line-height | weight | letter-spacing | used by |
|---|---|---|---|---|---|
| `heading.2xl` | **36px** | 1.25 | 700 | 0 | `<h1>Terms of Use</h1>` |
| `heading.lg` | **24px** | 1.25 | 700 | 0 | the 21 section `<h3>`s **and** the sidebar "Jump to…" `<h3>` |
| `heading.md` | **20px** | 1.25 | 700 | 0 | the 7 sub-section `<h4>`s |
| `body.base` | **16px** | 1.5 | 400 | 0 | ToC top-level links; footer column labels |
| `body.sm` | **14px** | 1.5 | 400 | 0 | the whole article column (set once on the two-column flex); ToC DMCA sub-links |
| `body.xs` | **12px** | 1.5 | 400 | 0 | footer legal row + copyright |

> **There is no responsive typography on this page.** The h1 is 36px at 320px and at
> 2560px. Sections are 24px everywhere. Body is 14px everywhere. Do not add
> `md:text-…` steps.

### 2.6 Base / reset rules that materially change rendering

```css
html, :host {
  line-height: 1.5;
  font-family: var(--global-font-body, …);   /* --global-font-body: "CoFo Brilliant", sans-serif */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
  -webkit-tap-highlight-color: transparent;
}
html, body { background-color:#fff; color:#000; margin:0; padding:0 }
body       { background-color: var(--panda-colors-bg-primary); color: var(--panda-colors-text-primary);
             line-height: inherit; height: 100% }
*, ::before, ::after, ::backdrop {
  border-style: solid; border-width: 0; border-color: currentcolor;
  box-sizing: border-box; margin: 0; padding: 0;
}
h1,h2,h3,h4,h5,h6 { text-wrap: balance; font-size: inherit; font-weight: inherit }
p,h1,h2,h3,h4,h5,h6 { overflow-wrap: break-word }
ol, ul, menu      { list-style: none }
a                 { color: inherit; text-decoration: inherit }
b, strong         { font-weight: bolder }
img,svg,video,canvas,audio,iframe,embed,object { display: block; vertical-align: middle }
img, video        { max-width: 100%; height: auto }
```

Four consequences the builder must reproduce rather than "fix":

1. **`<ol>` renders with no numbers, no bullets and no indent.** The three DMCA
   lists carry only `panda-mt_4`; their `<li>`s have `class=""`. With
   `ol,ul,menu{list-style:none}` and `*{padding:0;margin:0}` in force, and *no*
   `.panda-lessonContent` wrapper on this page (the rule that would restore
   `list-style-type:decimal; padding-left:1.5rem` is scoped to
   `.panda-lessonContent ol` and that class is absent here), the items render as
   plain flush-left stacked lines with no gap between them. **This is how the live
   page looks. Do not add markers, indent or `space-y`.**
2. **Links are not underlined.** `a { text-decoration: inherit }` inherits `none`
   from the paragraph. Article and ToC links are blue `#456dff`, no underline, and
   have **no hover state at all** — no rule targets them.
3. `<strong>` is `font-weight: bolder`; inside 400 body text it computes to **700**.
4. `<h1>`–`<h6>` inherit size/weight, so **all** sizing comes from the explicit
   `textStyle` class. Heading elements carry no intrinsic size.

`text-wrap: balance` on headings is real — reproduce it (`text-balance`).

---

## 3. Page skeleton

```
body
└─ #__next
   └─ vstack   min-h:100dvh  bg:#f8f8f8  flex-col  items-center  gap:0
      ├─ [A] HEADER BAR          bg:#fff  border-b 1px rgba(0,0,0,.10)
      ├─ [B] vstack  max-w:100dvw  items-center
      │     └─ center  flex  items-center  justify-center  w-full
      │        └─ box (page gutter/cap)
      │           └─ flex  max-w:1200px  mx-auto   ← THE ARTICLE, two columns
      │              ├─ [C] main column  (99 blocks)
      │              └─ [D] sidebar "Jump to…"  (xl+ only)
      └─ [E] FOOTER              bg:#000  pt:80px
```

Section order, top to bottom: **A → C+D (side by side) → E**. There are five
sections total. There is no hero, no CTA band, no breadcrumb, no "last updated"
banner, no back-to-top button, no cookie bar in the SSR markup.

---

## 4. [A] Header bar — `static`

Identical byte-for-byte to the header on `/privacy/` (verified by diff).

**Outer** `<div data-slot="box">`
```
display:flex; flex-direction:column; align-items:center;
background:#ffffff;
border-bottom:1px solid rgba(0,0,0,.10);
padding-inline:24px;  md(481px+):32px;
max-width:100%; width:100%;
top:0;                 /* inert — no position property is ever set */
z-index:999;
```

**Inner** `<div data-slot="hstack">`
```
display:flex; flex-direction:row; flex-wrap:nowrap; align-items:center;
justify-content:space-between;
height:64px;
gap:24px;  md(481px+):32px;  lg(769px+):40px;
width:100%;
max-width:100%;  sm(360px+):432px;  md(481px+):432px;  lg(769px+):1216px;  xl(992px+):1216px;
```

**Only child:** `<a href="/">` with `color:#000000`, containing the Brilliant
wordmark SVG. There is **no nav, no search, no login link and no CTA button on this
page.** `justify-content:space-between` therefore has no visible effect — keep it
anyway for fidelity.

Logo SVG attributes: `width="114px" height="27px" viewBox="0 0 114 27" fill="none"`,
CSS `flex-shrink:0; height:24px; md(481px+):32px; max-height:48px; min-height:20px;
display:block`. Because the intrinsic `width` attribute (114px) is kept while CSS
sets the height, the glyph letterboxes inside a 114px-wide box at small sizes.
Reproduce the attributes exactly.

Interaction model: **static.** No sticky, no fixed, no scroll listener, no
hydration-driven state. Verified: the only `position` utility anywhere in the page
markup is `panda-pos_relative`.

---

## 5. [B] Article shell

```
vstack   display:flex; flex-direction:column; align-items:center; max-width:100dvw
 center  display:flex; align-items:center; justify-content:center; width:100%
  box    padding:0; width:100%;
         margin-inline:24px;  md(481px+):0;  lg(769px+):32px;  2xl(1280px+):0;
         max-width:100%;  sm(360px+):432px;  md(481px+):432px;  lg(769px+):1216px;  2xl(1280px+):1216px;
   flex  display:flex;                       ← row (default), never wraps
         max-width:1200px; margin-inline:auto;
         margin-block:32px;  lg(769px+):64px;  2xl(1280px+):80px;
         font: CoFo Brilliant 14px/1.5 400, letter-spacing 0   ← body.sm set ONCE here
```

Background behind the article is the root `#f8f8f8` — the article itself paints no
surface, has no card, no border, no radius and no shadow.

Note the `md` step: between 481px and 768px the box is capped at **432px** with
**zero** side margin, so the article is a narrow 432px column centred in the
viewport. That is the real behaviour; it is not a bug to smooth over.

---

## 6. [C] Main column — `static` long-form prose

```
flex-grow:1; max-width:100%;  xl(992px+):max-width:800px;
```

99 top-level blocks, in this exact order. Text below is quoted verbatim for
headings; long legal paragraphs are given as an opening excerpt with an explicit
elision marker — **the full text lives in `b-legal.content.json`**.

### 6.1 Block spacing rules (only two exist)

* every `<p>` and every `<ol>` → `margin-top: 16px`
* every `<h3>` and every `<h4>` → `margin-top: 48px`
* the `<h1>` → no margin at all

That is the entire vertical rhythm of the document.

### 6.2 Block sequence

| # | el | class | id | content |
|---|---|---|---|---|
| 0 | `h1` | `heading.2xl` | — | `Terms of Use` (followed by a stray trailing space in the markup — a React `{" "}`) |
| 1 | `p` | `mt-4` | — | `<strong>`**Effective as of February 9, 2026**`</strong>` |
| 2 | `p` | `mt-4` | — | `<strong class="underline">`**BRILLIANT.ORG WEBSITE TERMS OF USE**`<br/>`** AND COPYRIGHT NOTICE**`</strong>` — note the leading space before "AND" |
| 3 | `p` | `mt-4` | — | 772 chars — *"The following terms and conditions (the "Agreement") govern all use of the www.Brilliant.org website (the "Site"), the Brilliant mobile application(s), and any acce…"* […elided — see JSON] |
| 4 | `p` | `mt-4` | — | 346 chars — *"Brilliant reserves the right, at its sole discretion, to modify or replace any of the term…"* […elided] |
| 5 | `p` | `mt-4` | — | 742 chars, ALL CAPS — *"PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY, AS THEY CONTAIN AN AGREEMENT TO ARBITRAT…"* […elided] |
| 6 | `h3` | `mt-12 heading.lg` | `tou-access` | `ACCESS.` |
| 7–8 | `p` ×2 | `mt-4` | — | 907 + 1,577 chars […elided] |
| 9 | `h3` | `mt-12 heading.lg` | `tou-fees` | `FEES AND PAYMENT.` |
| 10 | `p` | `mt-4` | — | 231 chars […elided] |
| 11 | `h4` | `mt-12 heading.md` | — | `A. Billing and Payment.` |
| 12 | `p` | `mt-4` | — | 1,354 chars […elided] |
| 13 | `h4` | `mt-12 heading.md` | — | `B. Automatic Renewal` (no trailing period — verbatim) |
| 14 | `p` | `mt-4` | — | 799 chars, contains link → `/settings/subscription/` (`target="_blank" rel="noreferrer"`), label `Change / Cancel Subscription page` |
| 15–16 | `p` ×2 | `mt-4` | — | 460 (ALL CAPS) + 888 chars […elided] |
| 17 | `h4` | `mt-12 heading.md` | — | `C. Refunds` |
| 18 | `p` | `mt-4` | — | 466 chars […elided] |
| 19 | `h4` | `mt-12 heading.md` | — | `D. Promotions` |
| 20 | `p` | `mt-4` | — | 853 chars […elided] |
| 21 | `h3` | `mt-12 heading.lg` | `tou-content` | `SITE CONTENT.` |
| 22–23 | `p` ×2 | `mt-4` | — | 712 + 158 chars […elided] |
| 24 | `h3` | `mt-12 heading.lg` | `tou-user-content` | `USER CONTENT.` |
| 25–30 | `p` ×6 | `mt-4` | — | 240 / 482 / 959 / 1161 / 989 / 345 chars […elided] |
| 31 | `h3` | `mt-12 heading.lg` | `tou-ai-features` | `AI FEATURES AND FUNCTIONALITY` (no trailing period — verbatim) |
| 32–37 | `p` ×6 | `mt-4` | — | 170 / 1160 / 432 / 909 / 637 / 939 chars […elided] |
| 38 | `h3` | `mt-12 heading.lg` | `tou-software` | `SOFTWARE.` |
| 39 | `p` | `mt-4` | — | 912 chars […elided] |
| 40 | `h3` | `mt-12 heading.lg` | `tou-restrictions` | `RESTRICTIONS.` |
| 41–47 | `p` ×7 | `mt-4` | — | 1245 / 303 / 737 / 233 / 224 / 307 / 164 chars […elided] |
| 48 | `h3` | `mt-12 heading.lg` | `tou-registration` | `REGISTRATION; SECURITY.` |
| 49 | `p` | `mt-4` | — | 1,041 chars […elided] |
| 50 | `h3` | `mt-12 heading.lg` | `tou-third-party` | `THIRD PARTY SITES.` |
| 51 | `p` | `mt-4` | — | 768 chars […elided] |
| 52 | `h3` | `mt-12 heading.lg` | `tou-indemnification` | `INDEMNIFICATION.` |
| 53 | `p` | `mt-4` | — | 536 chars […elided] |
| 54 | `h3` | `mt-12 heading.lg` | `tou-warranty` | `WARRANTY DISCLAIMER.` |
| 55 | `p` | `mt-4` | — | 744 chars, ALL CAPS […elided] |
| 56 | `h3` | `mt-12 heading.lg` | `tou-limitation` | `LIMITATION OF LIABILITY.` |
| 57 | `p` | `mt-4` | — | 1,295 chars, ALL CAPS […elided] |
| 58 | `h3` | `mt-12 heading.lg` | `tou-termination` | `TERMINATION.` |
| 59–60 | `p` ×2 | `mt-4` | — | 278 + 408 chars […elided] |
| 61 | `h3` | `mt-12 heading.lg` | `tou-export` | `EXPORT AND TRADE CONTROLS.` |
| 62 | `p` | `mt-4` | — | 265 chars […elided] |
| 63 | `h3` | `mt-12 heading.lg` | `tou-privacy` | `PRIVACY.` |
| 64 | `p` | `mt-4` | — | `Brilliant's current privacy policy is available at ` + link `https://brilliant.org/privacy/` → `href="/privacy/" rel="noreferrer"` + ` (the "Privacy Policy"), which is incorporated by this reference.` |
| 65 | `h3` | `mt-12 heading.lg` | `tou-disputes` | `MEMBER DISPUTES.` |
| 66 | `p` | `mt-4` | — | 860 chars […elided] |
| 67 | `h3` | `mt-12 heading.lg` | `tou-copyright` | `COPYRIGHT.` |
| 68 | `p` | `mt-4` | — | 589 chars […elided] |
| 69 | `h3` | `mt-12 heading.lg` | `tou-communications` | `ELECTRONIC COMMUNICATIONS.` |
| 70 | `p` | `mt-4` | — | 991 chars […elided] |
| 71 | `h3` | `mt-12 heading.lg` | `tou-arbitration` | `DISPUTE RESOLUTION BY BINDING ARBITRATION` (no trailing period — verbatim) |
| 72 | `p` | `mt-4` | — | 1,178 chars, contains `<strong><em>Arbitration Agreement</em></strong>` […elided] |
| 73 | `p` | `mt-4` | — | 863 chars, ALL CAPS […elided] |
| 74 | `p` | `mt-4` | — | 1,028 chars, contains `<strong><em>Notice</em></strong>` and `<strong><em>Notice Address</em></strong>`; includes the plain-text address *Brilliant Worldwide, Inc., 2261 Market Street, Ste 4281, San Francisco, CA 94114* and the plain-text email *support@brilliant.org* (**not** a `mailto:` link) […elided] |
| 75–76 | `p` ×2 | `mt-4` | — | 1,639 + 1,312 chars […elided] |
| 77 | `p` | `mt-4` | — | 858 chars, contains `<strong><em>Batch</em></strong>` […elided] |
| 78–80 | `p` ×3 | `mt-4` | — | 158 / 764 / 643 chars […elided] |
| 81 | `h3` | `mt-12 heading.lg` | `tou-miscellaneous` | `MISCELLANEOUS.` |
| 82 | `p` | `mt-4` | — | 1,790 chars […elided] |
| 83 | `h3` | `mt-12 heading.lg` | `tou-dmca` | `DIGITAL MILLENNIUM COPYRIGHT ACT NOTICE.` |
| 84 | `p` | `mt-4` | — | `Brilliant has adopted the following general policy toward copyright infringement in accordance with the ` + link `Digital Millennium Copyright Act` → `http://lcweb.loc.gov/copyright/legislation/dmca.pdf` (plain `http`, **no** `target`/`rel`) + `. The address of Brilliant' Designated Agent to Receive Notification of Claimed Infringement ("Designated Agent") is listed at the end of this policy.` |
| 85 | `p` | `mt-4` | — | 305 chars […elided] |
| 86 | `h4` | `mt-12 heading.md` | `tou-dmca-a` | `A. Procedure for Reporting Copyright Infringements:` |
| 87 | `p` | `mt-4` | — | 230 chars […elided] |
| 88 | `ol` | `mt-4` | — | **6** `<li>` (see §6.3) |
| 89 | `h4` | `mt-12 heading.md` | `tou-dmca-b` | `B. Once Proper Bona Fide Infringement Notification is Received by the Designated Agent:` |
| 90 | `p` | `mt-4` | — | `It is Brilliant's policy:` |
| 91 | `ol` | `mt-4` | — | **4** `<li>` (see §6.3) |
| 92 | `h4` | `mt-12 heading.md` | `tou-dmca-c` | `C. Procedure to Supply a Counter-Notice to the Designated Agent:` |
| 93 | `p` | `mt-4` | — | 457 chars […elided] |
| 94 | `ol` | `mt-4` | — | **4** `<li>` (see §6.3) |
| 95–96 | `p` ×2 | `mt-4` | — | 515 chars […elided]; then verbatim: `Please contact Brilliant's Designated Agent to Receive Notification of Claimed Infringement at the following address:` |
| 97 | `p` | `mt-4` | — | address block, verbatim below |
| 98 | `p` | `mt-4` | — | `<em>The previous version of this document is located ` + link `here` → `/terms-of-use/01-13-2025/` (`target="_blank" rel="noreferrer"`) + `.</em>` |

Counts: **1 `h1`, 21 `h3`, 7 `h4`, 67 `p`, 3 `ol`** = 99 blocks.

### 6.3 The three `<ol>` lists — verbatim (short enough to quote in full)

`<ol data-slot="ol" role="list" class="panda-mt_4">`, each `<li data-slot="li" class="">`.
Rendered with **no marker and no indent** (see §2.6).

**Block 88 — 6 items**
1. `A physical or electronic signature of a person authorized to act on behalf of the owner of the copyright that has been allegedly infringed;`
2. `Identification of works or materials being infringed;`
3. `Identification of the content that is claimed to be infringing including information regarding the location of the content that the copyright owner seeks to have removed, with sufficient detail so that Brilliant is capable of finding and verifying its existence;`
4. `Contact information about the notifier including address, telephone number and, if available, e-mail address;`
5. `A statement that the notifier has a good faith belief that the content is not authorized by the copyright owner, its agent, or the law; and`
6. `A statement made under penalty of perjury that the information provided is accurate and the notifying party is authorized to make the complaint on behalf of the copyright owner.`

**Block 91 — 4 items**
1. `to remove or disable access to the infringing content;`
2. `to notify the content provider, member or user that it has removed or disabled access to the content;`
3. `that repeat offenders will have the infringing content removed from the system; and`
4. `to terminate such content provider's, member's or user's access to the service.`

**Block 94 — 4 items**
1. `A physical or electronic signature of the content provider, member or user;`
2. `Identification of the content that has been removed or to which access has been disabled and the location at which the content appeared before it was removed or disabled;`
3. `A statement that the content provider, member or user has a good faith belief that the content was removed or disabled as a result of mistake or a misidentification of the content; and`
4. `Content provider's, member's or user's name, address, telephone number, and, if available, email address and a statement that such person or entity consents to the jurisdiction of the Federal Court for the judicial district in which the content provider's, member's or user's address is located, or, if the content provider's, member's or user's address is located outside the United States, for any judicial district in which Brilliant is located, and that such person or entity will accept service of process from the person who provided notification of the alleged infringement.`

### 6.4 Block 97 — address block, verbatim

```html
<p class="mt-4">
  <strong class="underline">Designated Agent to Receive Notification of Claimed Infringement:</strong><br/>
  Brilliant DMCA Claims<br/>
  Brilliant Worldwide, Inc.<br/>
  2261 Market Street, Ste 4281<br/>
  San Francisco, CA 94114<br/>
</p>
```
Note the **trailing `<br/>`** after the last line — it is in the original.

### 6.5 Every link in the article column (4 total)

| block | label | href | target | rel | class |
|---|---|---|---|---|---|
| 14 | `Change / Cancel Subscription page` | `/settings/subscription/` | `_blank` | `noreferrer` | `panda-c_text.link` |
| 64 | `https://brilliant.org/privacy/` | `/privacy/` | — | `noreferrer` | `panda-c_text.link` |
| 84 | `Digital Millennium Copyright Act` | `http://lcweb.loc.gov/copyright/legislation/dmca.pdf` | — | — | `data-slot="a" panda-c_text.link` |
| 98 | `here` | `/terms-of-use/01-13-2025/` | `_blank` | `noreferrer` | `panda-c_text.link` |

All four: `color:#456dff`, **no underline**, **no hover state**.

Interaction model: **static.** No accordions, no tabs, no disclosure, no copy
button, no print button.

---

## 7. [D] Sidebar "Jump to…" — `static`, `xl` only

```
display:none;  xl(992px+):display:block;
min-width:276px;
margin-left:32px;
```

Hidden below 992px. **There is no mobile ToC of any kind** — no drawer, no
`<details>`, no select. Below 992px the reader simply gets the article.

Heading: `<h3 class="heading.lg">Jump to...</h3>` — three ASCII periods, not `…`.
No `margin-top`.

List: `<ul role="list">` with `list-style-type:none; margin-inline-start:0;` and
`& > li { margin-top: 16px }` — which applies to the **first** `li` too, so the
list starts 16px below the heading.

21 top-level entries at `body.base` (16px), plus 3 nested entries at `body.sm`
(14px) inside the DMCA `li` using an identical nested `<ul>` (same class, so its
items also get `margin-top:16px`). All links `color:#456dff`, no underline, no
hover, no active/current state.

Verbatim, in this order (labels are **Title Case here but ALL CAPS in the body** —
do not harmonise them):

| # | label | href |
|---|---|---|
| 1 | `Access` | `#tou-access` |
| 2 | `Site Content` | `#tou-content` |
| 3 | `Fees and Payment` | `#tou-fees` |
| 4 | `User Content` | `#tou-user-content` |
| 5 | `AI Features and Functionality` | `#tou-ai-features` |
| 6 | `Software` | `#tou-software` |
| 7 | `Restrictions` | `#tou-restrictions` |
| 8 | `Registration; Security` | `#tou-registration` |
| 9 | `Third Party Sites` | `#tou-third-party` |
| 10 | `Indemnification` | `#tou-indemnification` |
| 11 | `Warranty Disclaimer` | `#tou-warranty` |
| 12 | `Limitation of Liability` | `#tou-limitation` |
| 13 | `Termination` | `#tou-termination` |
| 14 | `Export and Trade Controls` | `#tou-export` |
| 15 | `Privacy` | `#tou-privacy` |
| 16 | `Member Disputes` | `#tou-disputes` |
| 17 | `Copyright` | `#tou-copyright` |
| 18 | `Electronic Communications` | `#tou-communications` |
| 19 | `Dispute Resolution by Binding Arbitration` | `#tou-arbitration` |
| 20 | `Miscellaneous` | `#tou-miscellaneous` |
| 21 | `Digital Millennium Copyright Act Notice` | `#tou-dmca` |
| 21a | `Procedure for Reporting Copyright Infringements:` | `#tou-dmca-a` |
| 21b | `Once Proper Bona Fide Infringement Notification is Received by the Designated Agent:` | `#tou-dmca-b` |
| 21c | `Procedure to Supply a Counter-Notice to the Designated Agent:` | `#tou-dmca-c` |

Sub-items 21a/21b/21c keep their trailing colons and drop the leading `A. `/`B. `/`C. `
that the body headings carry. Verbatim as shown.

**ToC ordering quirk (real, reproduce it):** entries 2 and 3 are `Site Content`
then `Fees and Payment`, but in the document body `FEES AND PAYMENT.` comes
**before** `SITE CONTENT.`. The ToC does not match document order. Do not "fix" it.

**Interaction model: static, native anchors only.**
* No `position: sticky` — the sidebar scrolls away with the page.
* No scroll-spy: no `IntersectionObserver`, no `aria-current`, no active class, no
  `data-*` state attribute anywhere in the markup (the only `data-` attribute on the
  entire page is `data-slot`).
* No `scroll-margin-top` / `scroll-padding-top` is applied to any heading on this
  page, and the header is not sticky, so no offset is needed or wanted.
* brilliant.org declares no `scroll-behavior`, so jumps are instant.
  **Note:** this project's `src/app/globals.css` sets `scroll-behavior: smooth` on
  `html`. That file is off-limits, so our clone will animate the jump where the
  original snaps. Accept this deviation; do **not** add JS to work around it and do
  **not** edit `globals.css`.

---

## 8. [E] Footer — `static`

Byte-for-byte identical to the footer on `/privacy/` (verified by diff), so it
should be a shared component. `src/components/brilliant/footer.tsx` already exists
in this repo — **check whether it already matches this markup before writing a new
one, and do not edit another agent's file.** If it differs, build a local copy
inside your own component directory rather than editing theirs.

**Outer** `display:flex; background:#000000; justify-content:center; padding-top:80px; width:100%`

**Inner box**
```
width:100%;
max-width:100%;  sm(360px+):432px;  lg(769px+):1216px;
margin-left:24px;  lg(769px+):40px;  2xl(1280px+):32px;
margin-right:24px; lg(769px+):40px;  2xl(1280px+):32px;
```

### 8.1 Top row
```
display:flex; align-items:flex-start; flex-direction:column;  2xl(1280px+):row;
justify-content:space-between; gap:0;
margin-bottom:80px;  lg(769px+):128px;
width:100%;
```

**Left:** `<a href="/">` — `margin-bottom:48px; 2xl:0; width:40%; 2xl:25%` — holds the
same Brilliant wordmark SVG, this time `color:#ffffff; height:32px; flex-shrink:0`.

**Right:** link grid
```
display:grid; flex:1; align-items:flex-start;
grid-template-columns:1fr;  lg(769px+):repeat(4, 140px);  2xl(1280px+):repeat(5, minmax(0,1fr));
column-gap:32px;  row-gap:48px;  2xl(1280px+):row-gap:0;
max-width:100%;  md(481px+):width:576px;  lg(769px+):width:100%;
```
Grid children, in order: **Product**, **Solutions**, **Company** (wrapped in a
`vstack gap:24px`), **Behind the scenes** (wrapped in a `vstack gap:24px`), then the
social-icon `hstack`. Reproduce the two extra `vstack` wrappers — they exist in the
original even though each holds a single group.

Group label: `<p class="body.base" style="color:#999999; margin-bottom:16px">`
Group links: `<div class="vstack gap:12px">` of `<a>` with
`color:#ffffff; border-bottom:2px solid transparent; position:relative;`
hover → `border-bottom:2px solid #456dff`. **No transition is declared — the change
is instant.** Do not add one.

| group | link | href |
|---|---|---|
| **Product** | `Courses` | `/courses/` |
| | `Pricing` | `/subscribe/` |
| | `Gift Brilliant` | `/gift-premium/` |
| | `Resources` | `/resources/` |
| | `Help` | `/help/` |
| **Solutions** | `Educators` | `/educators/` |
| | `Homeschools` | `/start/homeschool/` |
| **Company** | `About us` | `/about/` |
| | `Careers` | `/careers/` |
| **Behind the scenes** | `A Tutor in Every Home` | `https://blog.brilliant.org/a-world-class-tutor-in-every-home/` |
| | `AI at Brilliant` | `https://blog.brilliant.org/hand-crafted-machine-made/` |
| | `AI Evals for Learning Games` | `https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/` |
| | `Visual Algebra` | `https://blog.brilliant.org/visual-algebra/` |
| | `Decomposition and Abstraction` | `https://blog.brilliant.org/decomposition-and-abstraction/` |

Group links carry **no** `target` or `rel`, including the external blog ones.

**Social row:** `<div class="hstack gap:24px items-center">`, four `<a data-slot="a">`
with `color:#999999`, hover `color:#456dff`, `target="_blank"`, no `rel`:

| aria-label | href | svg size / viewBox |
|---|---|---|
| `Brilliant on Facebook` | `https://www.facebook.com/brilliantorg` | `22 × 22`, `0 0 22 22` |
| `Brilliant on Instagram` | `https://www.instagram.com/brilliantorg` | `21 × 21`, `0 0 21 21` |
| `Brilliant on Twitter` | `https://twitter.com/brilliantorg` | `22px × 22px`, **`0 -1 20 19`** |
| `Brilliant on LinkedIn` | `https://www.linkedin.com/company/brilliant-org/` | `20px × 21px`, `0 0 20 21` |

All four are single-`path`, `fill="currentColor"`, `fill="none"` on the root,
`class="flex-shrink:0"`. The Twitter mark is the **X** glyph with the unusual
`0 -1 20 19` viewBox — copy it exactly. Full path data is in §11.

### 8.2 Bottom row
```
display:flex; flex-direction:column;  2xl(1280px+):row;
gap:32px; justify-content:space-between;
margin-bottom:48px;  xl(992px+):80px;
width:100%;
```
(the footer's bottom padding is this `margin-bottom`, not a `padding-bottom`)

**Legal cluster:** `display:flex; align-items:center; flex-direction:column;
lg(769px+):row; gap:12px; lg(769px+):16px`. Each item sits in its own
`div{display:flex; justify-content:flex-start; width:100%; lg(769px+):width:initial}`.

| # | element | label | href | colour |
|---|---|---|---|---|
| 1 | `a` | `Terms of service` | `/terms-of-use/` | `#999999` |
| 2 | **`button type="button"`** | `Do not sell my personal information` | — | `#999999`, `background:transparent`, `cursor:pointer` |
| 3 | `a` | `California privacy policy` | `/ccpa-policy/` | `#999999` |
| 4 | `a` | `Privacy policy` | `/privacy/` | **`#ffffff`** — brighter than its neighbours |

All four: `body.xs` (12px), `text-align:left`, `border-bottom:2px solid transparent`,
`position:relative`, hover → `border-bottom:2px solid #456dff`.

Item 4 additionally: `display:inline-flex; align-items:center; gap:6px;
justify-content:flex-start; white-space:nowrap`, and is followed inside the anchor
by an 8×8 external-link arrow SVG (`aria-hidden="true"`, `fill="currentColor"`,
`flex-shrink:0`) — path in §11.

Item 2 is a real `<button>` with **no handler in the SSR markup**; its click
behaviour lives in a JS chunk that was not retrieved. See §13.

**Copyright:** `<p class="body.xs" style="color:#999999; word-break:break-word;
2xl(1280px+):width:50%">`

> `© 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.`

(single `©` character, no `(c)`, no "All rights reserved")

---

## 9. Assets

**The page references zero raster and zero video assets.** Verified: no `<img>`, no
`<video>`, no `<source>`, no `poster`, and no `background-image: url(...)` from any
class used on this page. Every graphic is inline SVG.

| asset | kind | status |
|---|---|---|
| Brilliant wordmark (header) | inline SVG, 11 paths, `0 0 114 27` | in markup — §11 |
| Brilliant wordmark (footer) | **identical** SVG, different classes | in markup — §11 |
| Facebook / Instagram / X / LinkedIn icons | inline SVG, 1 path each | in markup — §11 |
| External-link arrow (8×8) | inline SVG, 1 path | in markup — §11 |

### Fonts — all 14 preloaded faces already exist locally

The page preloads 14 `.woff2` files. Every one is already mirrored under
`public/assets/original/brilliant/brilliant.org/_next/static/media/`:

```
cofo_brilliant_regular-s.p.0x-1wd4a7iit8.woff2
cofo_brilliant_medium-s.p.1vop2d5y_jpw2.woff2
cofo_brilliant_bold-s.p.00peqb48xfqwb.woff2
cofo_brilliant_italic-s.p.01uthtfhv3qu6.woff2
cofo_brilliant_medium_italic-s.p.30ni91w93hr35.woff2
cofo_brilliant_bold_italic-s.p.3orrcir-ph8bn.woff2
cofo_robert_medium-s.p.3krozkcg6qt-u.woff2
cofo_robert_medium_italic-s.p.2b_znar3654ya.woff2
source_code_pro_regular.p.1nc1izk0q8l8t.woff2
source_code_pro_medium.p.0k2a2_pd11ndo.woff2
source_code_pro_bold.p.05unrvrd219vv.woff2
source_code_pro_italic.p.2uutxim5qrm63.woff2
source_code_pro_mediumitalic.p.15pt67uudl65v.woff2
source_code_pro_bolditalic.p.447_bjs8ef4vm.woff2
```

**Nothing needs downloading.** This page only ever renders **CoFo Brilliant** at
weights **400** (body, ToC, footer) and **700** (h1/h3/h4, `<strong>`), plus
**400 italic** (the `<em>` runs in blocks 72/74/77/98 — note block 72/74/77 use
`<strong><em>` = **700 italic**). Use `font-b-sans`.

`@font-face` in the original (weights the page needs):
```css
@font-face { font-family:"CoFo Brilliant"; src:url(cofo-brilliant-regular.woff2) format("woff2"); font-display:swap }
@font-face { font-family:"CoFo Brilliant"; font-weight:700; src:url(cofo-brilliant-bold.woff2) format("woff2") }
@font-face { font-family:"CoFo Brilliant"; font-style:italic; src:url(cofo-brilliant-italic.woff2) format("woff2") }
@font-face { font-family:"CoFo Brilliant"; font-weight:700; font-style:italic; src:url(cofo-brilliant-bold-italic.woff2) format("woff2") }
```
Metric-compatible fallback declared by the original (worth matching):
```css
@font-face { font-family:"coFoBrilliantFont Fallback"; src:local(Arial);
             ascent-override:94.99%; descent-override:29.45%;
             line-gap-override:14.25%; size-adjust:105.27% }
```

---

## 10. Responsive behaviour — full matrix

| viewport | article box | article column | sidebar | footer grid | footer logo | legal row |
|---|---|---|---|---|---|---|
| < 360 | mx 24, max-w 100% | full width | hidden | 1 col | w 40%, mb 48 | column, gap 12 |
| 360–480 | mx 24, **max-w 432** | full width | hidden | 1 col | w 40%, mb 48 | column, gap 12 |
| 481–768 | **mx 0**, max-w 432 | full width | hidden | 1 col, box w **576** | w 40%, mb 48 | column, gap 12 |
| 769–991 | mx 32, max-w 1216 | full width | hidden | **4 × 140px**, box w 100% | w 40%, mb 48 | **row, gap 16**, items `w:initial` |
| 992–1279 | mx 32, max-w 1216 | **max-w 800** | **visible**, min-w 276, ml 32 | 4 × 140px | w 40%, mb 48 | row, gap 16 |
| ≥ 1280 | **mx 0**, max-w 1216 | max-w 800 | visible | **5 × minmax(0,1fr)**, row-gap 0 | **w 25%, mb 0**, logo row goes `flex-direction:row` | row, gap 16 |

Vertical margins on the article flex: **32 → 64 (769+) → 80 (1280+)**.
Header horizontal padding: **24 → 32 (481+)**. Header inner gap: **24 → 32 (481+) → 40 (769+)**.
Footer top-row bottom margin: **80 → 128 (769+)**. Footer bottom-row bottom margin: **48 → 80 (992+)**.

The article flex never wraps and never becomes a column — below 992px the sidebar
is `display:none`, so the single remaining child fills the row.

Note the mismatched prefixes in the original: the header inner caps at 1216px via
`xl`, the article box via `2xl`. Same value, so no behavioural difference, but the
article box's *margin* genuinely resets to 0 at 1280 while the header's padding does
not. Reproduce as measured.

---

## 11. Verbatim SVG source

**Brilliant wordmark** — used twice.
Header: `class="shrink-0 h-6 min-[481px]:h-8 max-h-12 min-h-5"` + `color:#000`.
Footer: `class="shrink-0 h-8"` + `color:#fff`. Root attrs identical in both:
`width="114px" height="27px" viewBox="0 0 114 27" fill="none"`.

```html
<path d="M39.6614 0H35.8083V3.84981H39.6614V0Z" fill="currentColor"/>
<path d="M26.2288 9.53622H25.84V7.52301H21.9869V26.4895H25.84V16.2822C25.84 12.9622 27.8548 10.843 31.0009 10.843H33.546V7.52301H30.8948C28.9153 7.52301 27.36 8.19408 26.2288 9.53622Z" fill="currentColor"/>
<path d="M39.6614 7.52301H35.8083V26.4895H39.6614V7.52301Z" fill="currentColor"/>
<path d="M16.6493 11.9168C18.018 10.7533 18.8056 8.9962 18.8056 6.99324C18.8056 3.03747 15.7302 0 11.9833 0H0V26.4895H15.7302L19.0177 23.2402V14.5516L16.6493 12.2873V11.9171V11.9168ZM3.85302 3.35534H11.347C13.4679 3.35534 15.1293 4.98003 15.1293 7.06388C15.1293 9.14772 13.4679 10.8077 11.347 10.8077H3.85302V3.35534ZM15.0233 23.1342H3.85302V14.1984H15.0233V23.1342Z" fill="currentColor"/>
<path d="M78.4744 9.39498H78.0856C76.2828 7.98221 74.3032 7.27582 72.1116 7.27582C66.5618 7.27582 62.1786 11.5495 62.1786 17.1299C62.1786 22.7104 66.3144 26.7368 71.9702 26.7368C74.3739 26.7368 76.3888 25.9951 78.0856 24.6176H78.4744V26.4896H82.3274V7.52305H78.4744V9.39498ZM72.1823 23.4168C68.6121 23.4168 65.7488 20.5912 65.7488 16.9887C65.7488 13.3861 68.6121 10.5958 72.1823 10.5958C75.7525 10.5958 78.5805 13.4214 78.5805 16.9887C78.5805 20.5559 75.7525 23.4168 72.1823 23.4168Z" fill="currentColor"/>
<path d="M85.1199 7.52301V26.4895H88.9729V10.8784H97.3152V26.4895H101.168V10.7018L97.9868 7.52301H85.1199Z" fill="currentColor"/>
<path d="M60.0576 0H56.2046V3.84981H60.0576V0Z" fill="currentColor"/>
<path d="M46.4838 0H42.5601V26.4895H46.4838V0Z" fill="currentColor"/>
<path d="M114 10.8431V7.52305H107.779V2.08386H103.926V22.4985C103.926 24.7589 105.622 26.4896 107.885 26.4896H114V23.1342H107.779V10.8431H114Z" fill="currentColor"/>
<path d="M60.0576 7.52301H56.2046V26.4895H60.0576V7.52301Z" fill="currentColor"/>
<path d="M53.306 0H49.3823V26.4895H53.306V0Z" fill="currentColor"/>
```

**Facebook** — `width="22" height="22" viewBox="0 0 22 22" fill="none"`
```html
<path d="M0 11.0662C0.00127985 16.5108 3.9361 21.1467 9.28038 22V14.2648H6.48977V11.0662H9.28368V8.6313C9.15878 7.47753 9.55044 6.32766 10.3524 5.49353C11.1544 4.6594 12.2837 4.22747 13.4338 4.31489C14.2594 4.32831 15.0829 4.40229 15.8977 4.53625V7.2578H14.5074C14.0287 7.19472 13.5475 7.35378 13.1993 7.69018C12.8511 8.02657 12.6735 8.5039 12.7167 8.98768V11.0662H15.7647L15.2774 14.2659H12.7167V22C18.4964 21.0809 22.5493 15.7697 21.9393 9.91413C21.3293 4.05853 16.2698 -0.291573 10.4263 0.0152787C4.58284 0.322131 0.000928892 5.17851 0 11.0662Z" fill="currentColor"/>
```

**Instagram** — `width="21" height="21" viewBox="0 0 21 21" fill="none"`
```html
<path d="M10.4942 21C7.62576 21 7.28762 20.9849 6.16824 20.936C5.29533 20.9073 4.43371 20.7301 3.62049 20.412C2.21347 19.8652 1.10089 18.7538 0.553859 17.3486C0.247553 16.5336 0.0823418 15.6726 0.0652971 14.8022C0 13.6868 0 13.3212 0 10.479C0 7.60662 0.0151582 7.27129 0.0652971 6.15935C0.0827146 5.29019 0.24792 4.43031 0.553859 3.61643C1.10029 2.20937 2.21468 1.09701 3.62399 0.551896C4.43862 0.244747 5.29996 0.079343 6.17057 0.0628743C7.28412 0 7.65025 0 10.4942 0C13.3859 0 13.7182 0.0151364 14.8201 0.0628743C15.693 0.0794854 16.5566 0.244871 17.3737 0.551896C18.7826 1.09762 19.8968 2.20977 20.4438 3.61643C20.7553 4.44217 20.9214 5.3155 20.9347 6.19777C21 7.31321 21 7.67764 21 10.5186C21 13.3596 20.9837 13.7322 20.9347 14.8348C20.9173 15.706 20.7517 16.5679 20.445 17.3836C19.8965 18.7897 18.7823 19.9015 17.3737 20.4481C16.5578 20.7534 15.6959 20.9183 14.8248 20.936C13.7112 21 13.3463 21 10.4942 21ZM10.4545 1.84315C7.60244 1.84315 7.30627 1.85712 6.19273 1.90719C5.52808 1.91598 4.86985 2.03845 4.24664 2.26929C3.32636 2.62093 2.59815 3.34513 2.24225 4.26264C2.0093 4.89173 1.88663 5.5562 1.87962 6.22688C1.81782 7.35512 1.81782 7.65086 1.81782 10.479C1.81782 13.2735 1.82832 13.6123 1.87962 14.7335C1.89006 15.3974 2.01266 16.0548 2.24225 16.678C2.59868 17.5949 3.32676 18.3185 4.24664 18.6702C4.86943 18.9025 5.52792 19.0251 6.19273 19.0323C7.32143 19.0975 7.61877 19.0975 10.4545 19.0975C13.3148 19.0975 13.6109 19.0835 14.7152 19.0323C15.3803 19.0242 16.039 18.9017 16.6624 18.6702C17.5771 18.3155 18.3006 17.5935 18.6563 16.6803C18.8888 16.0507 19.0115 15.3859 19.0189 14.7149H19.0318C19.0819 13.6018 19.0819 13.3049 19.0819 10.4604C19.0819 7.61593 19.0691 7.3167 19.0189 6.20476C19.0085 5.54161 18.8859 4.88499 18.6563 4.26264C18.3014 3.34814 17.5778 2.62476 16.6624 2.26929C16.0391 2.03729 15.3803 1.91478 14.7152 1.90719C13.5876 1.84315 13.2926 1.84315 10.4545 1.84315ZM10.4942 15.8571C8.3137 15.8585 6.34713 14.5481 5.51161 12.537C4.67609 10.5258 5.1362 8.21013 6.67736 6.66986C8.21852 5.1296 10.5372 4.66815 12.5519 5.50072C14.5667 6.33329 15.8807 8.29589 15.8812 10.4732C15.878 13.4435 13.4688 15.8513 10.4942 15.8571ZM10.4942 6.97788C8.56225 6.97788 6.99611 8.54175 6.99611 10.4709C6.99611 12.4 8.56225 13.9639 10.4942 13.9639C12.4261 13.9639 13.9922 12.4 13.9922 10.4709C13.9877 8.54361 12.4242 6.98236 10.4942 6.97788ZM16.0911 6.14771C15.3978 6.14513 14.8375 5.58252 14.8388 4.89023C14.84 4.19794 15.4024 3.6374 16.0957 3.6374C16.789 3.6374 17.3514 4.19793 17.3527 4.89022C17.353 5.22422 17.2201 5.5446 16.9834 5.78056C16.7466 6.01652 16.4255 6.14863 16.0911 6.14771Z" fill="currentColor"/>
```

**X / Twitter** — `width="22px" height="22px" viewBox="0 -1 20 19" fill="none"`
```html
<path d="M15.2718 1.58667H18.0831L11.9413 8.60625L19.1666 18.1583H13.5093L9.07828 12.365L4.00821 18.1583H1.19528L7.76445 10.6501L0.833252 1.58667H6.63418L10.6394 6.88195L15.2718 1.58667ZM14.2852 16.4757H15.8429L5.78775 3.18095H4.11614L14.2852 16.4757Z" fill="currentColor"/>
```

**LinkedIn** — `width="20px" height="21px" viewBox="0 0 20 21" fill="none"`
```html
<path d="M11.1111 21H6.66665V7H11.1111V9.33333C12.0585 8.0678 13.4951 7.31333 15.0277 7.2765C17.784 7.29257 20.008 9.64761 20 12.5417V21H15.5555V13.125C15.3778 11.8214 14.313 10.8542 13.0589 10.857C12.5103 10.8752 11.9925 11.1274 11.6249 11.5554C11.2573 11.9834 11.0718 12.5502 11.1111 13.125V21ZM4.44444 21H0V7H4.44444V21ZM2.22222 4.66667C0.994921 4.66667 0 3.622 0 2.33333C0 1.04467 0.994921 0 2.22222 0C3.44951 0 4.44444 1.04467 4.44444 2.33333C4.44444 2.95217 4.21031 3.54566 3.79356 3.98325C3.37682 4.42083 2.81159 4.66667 2.22222 4.66667Z" fill="currentColor"/>
```

**External-link arrow** — `width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true"`
```html
<path d="M0.707107 2H4.29289L0 6.29289L1.41421 7.70711L5.70711 3.41421V7H7.70711V0H0.707107V2Z" fill="currentColor"/>
```

---

## 12. Interaction model — summary

| section | model | evidence |
|---|---|---|
| Header | **static** | no `position` utility other than `relative`; no JS state; single child |
| Article | **static** | no `data-*` beyond `data-slot`; no `aria-expanded`; no buttons |
| ToC sidebar | **static**, native `#hash` anchors | no IntersectionObserver marker, no `aria-current`, no sticky, no `scroll-margin` |
| Footer links | **hover-driven**, instant | `:hover` → `border-bottom-color:#456dff`; no `transition` declared |
| Social icons | **hover-driven**, instant | `:hover` → `color:#456dff`; no `transition` |
| "Do not sell…" | **click-driven**, behaviour unknown | real `<button>`, handler not in SSR markup (see §13) |

**Nothing on this page is scroll-driven, time-driven or animated.** There is no
`motion` / Framer Motion work to do here. Do not add entrance animations, reveals,
parallax, counters or a progress bar — the original has none, and adding any would
be inventing.

Total interactive elements on the page: **51 `<a>` + 1 `<button>`** —
1 header logo, 4 in-article links, 24 ToC links (21 top-level + 3 nested),
1 footer logo, 14 footer nav links, 4 social icons, 3 legal-row links,
1 legal-row button.

---

## 13. Unavailable — render nothing in its place

1. **"Do not sell my personal information" click behaviour.** The element is a real
   `<button type="button">` with no `onClick`, `data-*`, `aria-controls` or `id` in
   the server-rendered HTML. Its handler lives in a JS chunk that was not fetched,
   and no consent-modal markup exists anywhere in the SSR output.
   → **Render the button with its exact label and styling and give it no action.**
   Do not invent a modal, a toast, a link target or a placeholder dialog.
2. **Hover, focus, active and visited states for article and ToC links.** No CSS
   rule in any of the three bundles targets them. → Render none. Note that
   `globals.css` supplies a project-wide `:focus-visible` outline; that is
   pre-existing and out of scope.
3. **Dark mode.** The bundle contains a `[data-theme=dark]` ruleset, but the page
   ships no theme attribute and no toggle. → Light only. Do not build a dark variant.
4. **Page-specific `<title>` / meta description.** The document reuses the generic
   site title `Brilliant | Learn by doing` and the generic homepage `og:description`.
   → Copy them verbatim rather than authoring new ones.
5. **`/terms-of-use/01-13-2025/`** (the "previous version" archive link, block 98)
   was not fetched. → Render the link exactly as specified; do not build the target
   page.
6. **Screenshots / rendered reference images.** Not captured — this analysis was
   shell-only by instruction, and the shared browser was off-limits. All geometry
   above is from declared CSS, not from measured layout.

---

## 14. Correction to the brief: `/privacy/` does **not** share this template

The task note said this template is "also used by `/privacy/`". Fetched
`https://brilliant.org/privacy/` (**HTTP 200**) and diffed. The truth:

**Shared, byte-for-byte identical** — the header bar and the entire footer, plus
the outer `vstack / center / box` page shell and the whole token set.

**Different — the article body is a separate layout:**

| | `/terms-of-use/` | `/privacy/` |
|---|---|---|
| article wrapper | `flex`, `max-w:1200px`, `my:32/64/80` | `vstack items-start gap:8px`, `max-w:800px`, `mx:auto`, `my:48/64/80`, `px:16` → `lg(769+):0` |
| columns | **two** (article + ToC sidebar) | **one** |
| "Jump to…" sidebar | **yes** | **no** — the string does not appear |
| section heading el | `h3` @ `heading.lg` **24px** | `h2` @ `heading.xl` **30px** |
| paragraph margin | `mt:16px` | `mt:12px` |
| section margin | `mt:48px` | `mt:48px` (same) |
| lists | 3 × `ol` with no class on `li` | `ul` with `pl:24px` and `& > li + li { mt:8px }` inside an `mt:8px` box |
| h1 | `Terms of Use` | `Privacy Policy` |
| effective date | `Effective as of February 9, 2026` | `Effective as of: August 18, 2026` (note the colon) |
| in-page anchors | 21 sections + 3 sub | 9 of 14 `h2`s have ids; 5 have none |

Build `/terms-of-use/` from this spec. **Do not reuse this article component for
`/privacy/`** — it needs its own spec and its own extraction.

---

## 15. Suggested file placement

Not assigned to me explicitly; matching the existing `src/app/brilliant/*` convention:

* route → `src/app/brilliant/terms-of-use/page.tsx`
* components → `src/components/brilliant/legal/` (`legal-article.tsx`,
  `legal-toc.tsx`, `legal-header.tsx`, and a footer only if
  `src/components/brilliant/footer.tsx` turns out not to match §8)
* content → import `docs/research/specs/b-legal.content.json`, or copy it to
  `src/app/brilliant/terms-of-use/content.json`. **Import it — do not retype it.**

Reminder from the brief: do not touch `globals.css`, `layout.tsx`, `page.tsx`,
`src/lib/*`, `_quarantine/`, or any other agent's directory, and do not run
`npm run build` (use `npx tsc --noEmit`).
