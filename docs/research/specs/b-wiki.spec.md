# b-wiki — Brilliant Wiki Article Template

**Target:** `https://brilliant.org/wiki/logarithms/`
**Key:** `b-wiki`
**Template scope:** Wiki article page. ~1729 pages share this exact shell; only `<h1>`, the TOC list, the section headings/ids and the article body differ.
**Captured:** 2026-08-21 via `curl` (shell only — no browser).

---

## 0. Fetch evidence

| Item | Value |
|---|---|
| HTTP status | **200** |
| Final URL | `https://brilliant.org/wiki/logarithms/` (no redirect) |
| Body size | 52,455 bytes |
| Reachable | **yes** |
| Rendering | **Fully server-rendered Django HTML.** Not Next.js. All article copy is present in the initial HTML. |
| CSS bundles | 3, all HTTP 200 (see §7) |
| JS bundles | `brilliant_vendors.f0f4763dc0b33761cdf7.js`, `brilliant_entry.a7794d022940133d74fa.js` (2.63 MB), plus `https://browser.sentry-cdn.com/7.46.0/bundle.min.js` |

**Critical:** this is an *archived* wiki. The site itself says so in the sticky footer bar (verbatim copy in §6.7). Do not add anything that implies the wiki is live.

---

## 1. Document head (verbatim)

```
<title>Logarithms | Brilliant Math &amp; Science Wiki</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<meta name="description" content="A logarithm is the inverse of the exponential function. Specifically, a logarithm is the power to which a number (the base) must be raised to produce a given number. For example, ...">
<link rel="canonical" href="https://brilliant.org/wiki/logarithms/">
<meta property="og:type" content="website">
<meta property="og:title" content="Logarithms | Brilliant Math &amp; Science Wiki">
<meta property="og:description" content="A logarithm is the inverse of the exponential function. Specifically, a logarithm is the power to which a number (the base) must be raised to produce a given number. For example, ...">
<meta property="og:image" content="https://brilliant.org/site_media/images/open-graph/wiki.png">
<meta property="og:url" content="https://brilliant.org/wiki/logarithms/">
<meta name="twitter:site" content="@brilliantorg">
<meta name="twitter:card" content="summary_large_image">
<meta name="google" content="notranslate">
<meta http-equiv="Content-Language" content="en_US">
```

JSON-LD (`application/ld+json`), verbatim:

```json
{"@context": "https://schema.org", "@type": "LearningResource", "name": "Logarithms", "description": "A logarithm is the inverse of the exponential function. Specifically, a logarithm is the power to which a number (the base) must be raised to produce a given number. For example, ...", "url": "https://brilliant.org/wiki/logarithms/", "inLanguage": "en", "learningResourceType": "article", "educationalUse": ["self-study", "reference"], "isAccessibleForFree": true, "publisher": {"@type": "Organization", "name": "Brilliant", "url": "https://brilliant.org", "logo": {"@type": "ImageObject", "url": "https://brilliant.org/site_media/images/open-graph/koji-for-wiki.png"}}, "isPartOf": {"@type": "WebSite", "name": "Brilliant Wiki", "url": "https://brilliant.org/wiki/"}}
```

Also present: 8 `apple-touch-icon` links (72/76/114/120/144/152/180 + default `-precomposed.png`), `fb:app_id`, `al:ios:*` / `al:android:*` app-link meta, `<link rel="alternate" href="android-app://org.brilliant.android/http/brilliant.org/wiki/logarithms/">`.

---

## 2. Body element and global chrome

```html
<body class="no-js enable-remind-share-buttons wiki-page logged-out instant-try-it-yourself fonts hdr-big"
      data-is-mobile="false" data-app-version="0.0.0" data-user="None"
      data-media-host="https://ds055uzetaobb.cloudfront.net" data-third-party-cookies-enabled="true">
```

Resolved body computed values (after cascade across all 3 bundles, wiki.css loading last):

| Property | Value | Source |
|---|---|---|
| `margin` | `0` | `body` |
| `min-width` | `1200px` (→ `960px` at 700–1200px) | `body` |
| `padding-top` | `60px` | `.hdr-big` (beats `body{padding-top:45px}`) |
| `padding-bottom` | `80px` | `body.wiki-page` |
| `font-family` | `'CoFo Brilliant', Arial, sans-serif` | `body.fonts` |
| `font-size` | `15px` | `body` |
| `line-height` | `1.7` | `body.wiki-page` (beats `body{1.6em}`) |
| `color` | `#161616` | `body` |
| `background` | `#fff` | `body.wiki-page` (beats `body{#f7f7f7}`) |
| `-webkit-font-smoothing` | `antialiased` | `body` |
| `-moz-osx-font-smoothing` | `grayscale` | `body` |
| `box-sizing` | `border-box` on `body, body *` | `body, body *` |
| link color | `#456DFF`, hover `#1245ff` | `body.wiki-page a` (beats global `a{color:#0277bd}`) |

Global element defaults used by this page:

```css
html { touch-action: manipulation; }
p  { margin: 0 0 0.8em; }
a  { color: #0277bd; text-decoration: none; }        /* overridden to #456DFF by body.wiki-page a */
strong { font-weight: bold; font-weight: 600; }
em { font-style: italic; }
ul, ol { padding: 0; margin: 0 0 0.8em 25px; }
ul { list-style: disc; }  ol { list-style: decimal; }
li { line-height: 1.6em; }
hr { margin: 20px 0; border: 0; border-top: 1px solid #bbb; border-bottom: 1px solid #fff; }
h1,h2,h3,h4,h5,h6 { margin: 0; font-family: 'CoFo Brilliant', Arial, sans-serif; color: #333; text-rendering: optimizeLegibility; }
h1 { margin-bottom: 0.26666667em; font-weight: 500; font-size: 28px; line-height: 1.6em; }
h2 { margin-bottom: 0.23333333em; font-weight: 500; font-size: 22px; line-height: 1.4em; }
h3, h5, h6 { margin-bottom: 0.25em; font-weight: 400; font-size: 15px; line-height: 1.5em; color: #161616; }
h4 { margin-bottom: 0.25em; font-size: 20px; line-height: 1.5em; font-weight: 500; color: #161616; }
table { max-width: 100%; background-color: transparent; border-collapse: collapse; border-spacing: 0; }
code, pre { padding: 0 3px 2px; font-family: Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 14px; color: #333; border-radius: 0; }
code { padding: 2px 4px; color: #666; background-color: #f7f7f9; border: 1px solid #e1e1e8; }
blockquote { margin: 0 0 1.6em 0; padding: 16px; background: #fbfbfb; clear: both;
             border: 1px solid #d4d4d4; box-shadow: 0 0 0 1px #f3f3f3; }
blockquote p { margin-bottom: 0; }
q:before, q:after, blockquote:before, blockquote:after { content: ''; }
.hide { display: none; }
.pull-right { float: right; }
.row { display: block; float: left; clear: left; width: 100%; margin: 0; }
.clearfix { *zoom: 1; }  /* IE hack only — no modern effect */
```

Grid primitives actually used on this page:

```css
.container { width: 1200px; margin: 0 auto; padding: 0 12px; }
.col       { float: left; margin-right: 24px; }
.col-2     { width: 176px; }
.col-12    { width: 1176px; margin-right: 0; }
/* .col-last and .unstyled have NO declarations in any loaded stylesheet */
```

---

## 3. Top-to-bottom section order

`<body>` children in document order:

| # | Element | Visible? | Container width | Interaction model |
|---|---|---|---|---|
| 1 | `#header.site-header.refreshed-navbar` | yes | `.container` 1200px | static; `position: fixed`; hover states on nav links |
| 2 | `#system-msgs.row.clearfix` | **empty** | — | renders nothing |
| 3 | `#post-header` | **empty** | — | renders nothing |
| 4 | `#wrapper.container.clearfix` | yes | 1200px (content 1176px) | container only |
| 4a | `#signup-modal-generic.public-signup-modal-experiment.modal.hide.rebrand` | **hidden** (`.hide`) | `.modal` 524px | click-driven from header Sign up / Log in |
| 4b | `.col.col-12.col-last.wiki-main-column` | yes | **max-width 800px, centered** | the article |
| 4b-i | `#wiki-header.wiki-header` (`<h1>`) | yes | 800px | static |
| 4b-ii | `.signup-modal.hide` (legacy modal) | **hidden** | 400px fixed | no controller binds it on this page |
| 4b-iii | `#cmp_wiki_top_editors_id.wiki-top-editors` | **`display:none`** | — | **renders nothing** — see §5.3 |
| 4b-iv | `#wiki-main` → `.summary-container` → `.summary.wiki-content` | yes | 800px | article body; per-heading click toggle (no visual effect on desktop) |
| 4b-v | `.wiki-self-citation` | yes | 800px | **time-driven** — timestamp written by JS at load |
| 4b-vi | `<script id="retrieval-time-content">` | — | — | underscore template, not rendered |
| 4c | `.wiki-overlay` | **`display:none`** | fixed full-screen | renders nothing on this page |
| 4d | `#loggedout-wiki-footer.wiki-footer` | yes | full width | **fixed bottom bar, permanently visible** (see §8.4) |
| 4e | `#signup-modal-wiki.public-signup-modal-experiment.modal.hide.rebrand` | **hidden** | 524px | click-driven |
| 4f | `<div data-controller="util/latex_loader:controller">` | no | — | loads KaTeX |
| 4g | `<div data-controller="util/analytics:init">` + `.ax-event` | no | — | analytics only |
| 5 | `#default-ajax-error.hide`, `#fb-root`, `<script>` × 7 | no | — | renders nothing |

**There is no sidebar, no recommended-courses block, no related-quizzes block, no site footer (`#footer`) on this page.** Those classes exist in `wiki.css` (`.wiki-sidebar`, `.wiki-recommended-courses`, `.wiki-quizzes`, `.wiki-relevant`) but no matching markup is emitted. Do not build them.

---

## 4. Section 1 — Site header

### 4.1 Markup (verbatim structure)

```html
<div class="site-header refreshed-navbar" id="header">
  <div class="container" id="logged-out-header">
    <div class="col">
      <a href="/">
        <img alt="Brilliant" height="24" src="/site_media/version-0/images/brilliant-wordmark-black.svg">
      </a>
    </div>
    <div class="hdr-links has-navbar-icon">
      <span class="hdr-link">
        <a href="/home/">
          <svg class="navbar-icon" width="21" height="20" viewBox="0 0 21 20" fill="none">…</svg>
          Home
        </a>
      </span>
      <span class="hdr-link">
        <a class="" href="/courses/">
          <svg class="navbar-icon" width="21" height="20" viewBox="0 0 21 20" fill="none">…</svg>
          Courses
        </a>
      </span>
    </div>
    <div class="btns">
      <a class="btn signup-btn col-2 ax-click rebrand"
         href="https://brilliant.org/account/signup/?next=/wiki/logarithms/" rel="nofollow"
         data-ax-id="clicked_signup_from_header" data-ax-type="button"
         data-controller="util/ui:genericSignupModal" data-next="">Sign up</a>
      <a class="btn login-link col-2 ax-click rebrand"
         href="https://brilliant.org/account/login/?next=/wiki/logarithms/" rel="nofollow"
         data-ax-id="clicked_login_from_header" data-ax-type="link"
         data-controller="util/ui:genericSignupModal" data-next="" data-show-login="true">Log in</a>
    </div>
  </div>
</div>
```

Both header CTA hrefs carry `?next=/wiki/logarithms/` — i.e. `?next=<current path>`.

### 4.2 Declared CSS

```css
.site-header { position: fixed; left: 0; top: 0; width: 100%; min-width: 1200px;
               border-bottom: 1px solid #d4d4d4; background: #fbfbfb; z-index: 400; }
.hdr-big .site-header { min-height: 60px; border-bottom: 1px solid #ecedef; background: #fff; }
.hdr-big .site-header.refreshed-navbar { box-shadow: 0 0 15px rgba(0,0,0,0.1); border-bottom: 0; }
.hdr-big .site-header .container { display: flex; justify-content: flex-start; align-items: center; margin-top: 4px; }
#logged-out-header { height: 60px; }

/* nav group */
.hdr-links { float: left; width: 398px; margin-right: 48px; }
.hdr-big .hdr-links { display: flex; flex-wrap: nowrap; width: auto; margin: 0; }
.hdr-big .hdr-links.has-navbar-icon { margin-top: 0; }
.hdr-links.has-navbar-icon .hdr-link { padding: 0; margin-right: 0; }
.hdr-links.has-navbar-icon .hdr-link a {
  display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between;
  margin: 0 32px 0 0; padding: 16px 0; gap: 8px;
  text-transform: capitalize; font-weight: 400; font-size: 16px; letter-spacing: normal;
  --navbar-bottom-border-color: transparent;
  position: relative; color: #666666; transition: color 0.2s; }
.hdr-links.has-navbar-icon .hdr-link a::after {
  content: ''; position: absolute; top: 100%; left: 0; width: 100%; height: 2px;
  opacity: 0; background-color: var(--navbar-bottom-border-color);
  transition: transform 0.2s ease-in-out, background-color 0.3s, opacity 0.3s;
  transform: translateY(0px); }
.hdr-links.has-navbar-icon .hdr-link a:hover { --navbar-bottom-border-color: #cccccc; border-radius: 6px; }
.hdr-links.has-navbar-icon .hdr-link a.active { --navbar-bottom-border-color: #000; }
.hdr-links.has-navbar-icon .hdr-link a .navbar-icon { display: flex; --navbar-icon-color: #666666; }
.hdr-links.has-navbar-icon .hdr-link a.active,
.hdr-links.has-navbar-icon .hdr-link a:focus,
.hdr-links.has-navbar-icon .hdr-link a:hover { color: #000; }
.hdr-links.has-navbar-icon .hdr-link a.active .navbar-icon,
.hdr-links.has-navbar-icon .hdr-link a:focus .navbar-icon,
.hdr-links.has-navbar-icon .hdr-link a:hover .navbar-icon { --navbar-icon-color: #000; }
.hdr-links.has-navbar-icon .hdr-link a.active::after,
.hdr-links.has-navbar-icon .hdr-link a:focus::after,
.hdr-links.has-navbar-icon .hdr-link a:hover::after { opacity: 1; transform: translateY(-2px); }
.hdr-links.has-navbar-icon .hdr-link a:focus-visible { outline: none; }
.hdr-links.has-navbar-icon .hdr-link a:focus-visible::before {
  content: ''; position: absolute; top: 4px; bottom: 4px; left: -16px; right: -16px;
  border-radius: 6px; border: 3px solid #2c6fef; }
.hdr-links.has-navbar-icon .hdr-link a svg { flex-shrink: 0; fill: var(--navbar-icon-color); transition: fill 0.3s ease-in-out; }

/* CTA group */
.hdr-big #logged-out-header .btns { flex: 1; }
.btn { padding: 3px 16px; margin-bottom: 0; font-size: 15px; color: #333; background: #f0f0f0;
       outline: none; border-radius: 54px; font-family: 'CoFo Brilliant', Arial, sans-serif;
       font-weight: 500; transition-property: all; transition-duration: 0.3s;
       background-clip: padding-box; display: inline-block; text-align: center;
       line-height: normal; vertical-align: middle; cursor: pointer;
       border: 2px solid transparent; position: relative; touch-action: manipulation; }
.btn:hover, .btn:focus, .btn:active { color: #0277bd; box-shadow: 0 1px 3px rgba(0,0,0,0.3); text-decoration: none; }
.btn:focus-visible { box-shadow: 0 0 0 3px rgba(218,226,255,0.3); }
#logged-out-header .signup-btn, #logged-out-header .login-link {
  float: right; margin: 10px 0 10px 10px; font-weight: 700; font-size: 16px;
  border-radius: 6px; line-height: 2; width: 108px; padding-top: 2px; padding-bottom: 2px; }
#logged-out-header .signup-btn.rebrand { border: 2px solid #29cc57; background: #29cc57; border-radius: 54px; font-weight: 500; }
#logged-out-header .signup-btn { border: 2px solid #2c6fef; background: #2c6fef; color: #fff; }
#logged-out-header .signup-btn.rebrand:hover { box-shadow: none; background: #15b441; border-color: #15b441; }
#logged-out-header .login-link { background: none; border: 2px solid #000000; color: #000000; }
#logged-out-header .login-link.rebrand { background: none; border: 2px solid #cccccc; border-radius: 54px; font-weight: 500; }
#logged-out-header .login-link.rebrand:hover { box-shadow: none; border-color: #000000; }
```

### 4.3 Resolved header geometry (what to build)

- Fixed bar, full width, `min-width: 1200px`, height **60px**, `background: #fff`, `box-shadow: 0 0 15px rgba(0,0,0,.1)`, no bottom border, `z-index: 400`.
- Inner row: `.container` 1200px, `padding: 0 12px`, `display:flex; align-items:center; justify-content:flex-start; margin-top:4px`.
- **Wordmark** — `.col` (`margin-right: 24px`), `<img height="24">`. Source SVG is `114 × 27` viewBox → renders at **101.33 × 24 px**.
- **Nav links** — flex row. Each `<a>`: `padding: 16px 0`, `margin-right: 32px`, `gap: 8px` between icon and label, `font-size: 16px`, `font-weight: 400`, `text-transform: capitalize`, `color: #666666`.
  Hover/focus: text and icon fill go `#000`; a 2px `#cccccc` bar fades in at `top:100%` and slides `translateY(-2px)`.
  `.active` state uses `#000` for the bar (not used on this page — neither link is active).
- **Buttons** — `.btns` is `flex:1`; both buttons `float: right`, so DOM order Sign up → Log in renders as **`Log in` then `Sign up`, Sign up at the far right**. Each: `width: 108px`, `padding: 2px 16px`, `border: 2px solid`, `border-radius: 54px`, `font-size: 16px`, `font-weight: 500`, `line-height: 2` → box height 40px; `margin: 10px 0 10px 10px` → fills the 60px bar.
  - Sign up: bg `#29cc57`, border `#29cc57`, color `#fff`; hover bg/border `#15b441`, no shadow.
  - Log in: bg none, border `#cccccc`, color `#000`; hover border `#000`, no shadow.

### 4.4 Nav icon SVGs (verbatim — the page's only inline icons)

**Home** (`class="navbar-icon" width="21" height="20" viewBox="0 0 21 20" fill="none"`):
```
<g clip-path="url(#clip0_91_1939)">
  <path d="M20.2832 9.37336L10.9098 0L1.53638 9.37336L2.71904 10.556L10.9098 2.36534L19.1005 10.556L20.2832 9.37336Z"/>
  <path d="M4.1984 11.63L10.9096 4.93977L17.6208 11.63V20H13.4183L13.4183 13.3098L8.40061 13.3098L8.40061 20H4.1984V11.63Z"/>
</g>
<defs><clipPath id="clip0_91_1939"><rect width="20" height="20" fill="white" transform="translate(0.536377)"/></clipPath></defs>
```

**Courses** (`class="navbar-icon" width="21" height="20" viewBox="0 0 21 20" fill="none"`):
```
<path d="M4.73594 1.6H17.5359V16H19.1359V0H4.73594V1.6Z"/>
<path d="M4.73594 15.2H10.3359V13.6H4.73594V15.2Z"/>
<path d="M4.73594 6.39999H12.7359V11.2H4.73594V6.39999Z"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.53613 20V3.2H15.9361V20H1.53613ZM3.13613 4.8H14.3361V18.4H3.13613V4.8Z"/>
```

Both paths carry **no `fill` attribute** — they inherit `fill: var(--navbar-icon-color)` from the CSS above.

---

## 5. Section 2 — Article column

### 5.1 Column shell

```html
<div id="wrapper" class="container clearfix" data-controller="">
  <div class="col col-12 col-last wiki-main-column"> … </div>
```

```css
.col.wiki-main-column { max-width: 800px; margin-left: auto; margin-right: auto; padding: 24px 0; float: none; }
#wiki-main { position: relative; }
```

Resolved: `.col-12` gives `width:1176px`, `max-width:800px` clamps it → **800 px wide, horizontally centered inside the 1200px container**, `padding: 24px 0`, no float.

### 5.2 Page title

```html
<header class="wiki-header" id="wiki-header">
  <div class="pull-right"></div>
  <h1>Logarithms</h1>
</header>
```

```css
.wiki-header { position: relative; margin-bottom: 8px; padding-bottom: 0; padding-right: 116px; border-bottom: none; }
.wiki-header h1 { display: inline; font-family: 'CoFo Robert', Georgia, serif; font-weight: 500; font-size: 34px; }
.wiki-header .pull-right { position: absolute; bottom: 12px; right: 0; }
```

`h1`: **CoFo Robert 500 / 34px**, colour `#333` (inherited from `h1..h6`), `line-height: 1.6em` (from base `h1`), `display: inline`. `.pull-right` is empty on this page — it exists but renders nothing.

### 5.3 Contributor byline — RENDERED BUT INVISIBLE

`#cmp_wiki_top_editors_id.wiki-top-editors` is in the DOM but `wiki.css` sets `.wiki-top-editors { display: none; margin-bottom: 24px; }`.
**Do not render it.** Its contents (names, "and 20 others" dropdown, "contributed") are recorded in §6.3 for completeness only.

### 5.4 Article body wrapper

```html
<div id="wiki-main">
  <div class="summary-container" id="cmp_wiki_canonical_page_id">
    <div class="summary wiki-content"
         data-cmp-key="wiki_canonical_page" data-cmp-url="/wiki/logarithms/"
         data-controller="app/wiki:summary" data-page-key="wiki_canonical_page">
      …children…
```

Children, in order:
1. `div#section-pre-header-section.section.collapsed > .section-container` — lede + definition blockquote (no heading)
2. `div.toc.wiki-toc` — "Contents" list
3. …then **8 × alternating pairs**:
   - `div#<slug>.anchor.skill-heading.collapsed[data-controller="app/wiki:expandOrCollapse"] > header.section-header > span.css-sprite-chevrons.chevron + h2`
   - `div#section-<slug>.section.collapsed > div.section-container`

### 5.5 Content CSS (all declared values)

```css
.summary-container .section { margin-bottom: 40px; }
.summary-container .section:not(#section-pre-header-section) { clear: both; }
.summary-container p { margin-bottom: 20px; }
.summary-container p:last-child { margin-bottom: 0; }
.summary-container ol, .summary-container ul { margin: 20px 24px; }
.summary-container li { margin-bottom: 6px; }
.summary-container blockquote { margin-bottom: 20px; }
.summary-container hr { margin: 20px 0; }
.summary-container img { max-width: 576px; }
.summary-container .image-caption.left img,
.summary-container .image-caption.right img { max-width: 476px; }

.summary-container .skill-heading { clear: both; }
.summary-container .skill-heading .section-header { padding-bottom: 0; margin-top: 16px; margin-bottom: 8px; border-bottom: none; }
.summary-container .skill-heading .chevron { display: none; }
.summary-container .skill-heading h2 { float: none; display: inline;
  font-family: 'CoFo Robert', Georgia, serif; font-weight: 500; font-size: 24px; line-height: 1.3; }

/* base .section-header, overridden above where noted */
.section-header { border-bottom: 1px solid #777; padding-bottom: 5px; margin-bottom: 16px; }
.section-header h1, .section-header h2, .section-header h4 { float: left; }
.section-header h1, .section-header h2, .section-header h3, .section-header h4 { margin-bottom: 16px; }

/* anchor offset for the 60px fixed header */
.anchor:before { content: ''; display: block; height: 61px; margin-top: -61px; visibility: hidden; }

/* callout blockquotes */
.wiki-content blockquote { clear: none; padding: 16px; margin-bottom: 24px; background: #f7f7f7; overflow: hidden; }
.wiki-content blockquote blockquote { margin-bottom: 16px; background: #fff; outline: none; }
.wiki-content .definition:before, .wiki-content .example:before,
.wiki-content .proof:before, .wiki-content .theorem:before {
  display: block; margin-bottom: 10px; font-size: 9px; color: #919191;
  line-height: 1.2em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.6px; }
.wiki-content .definition:before { content: 'Definition'; }
.wiki-content .example:before    { content: 'Example'; }
.wiki-content .proof:before      { content: 'Proof'; }
.wiki-content .theorem:before    { content: 'Theorem'; }
.wiki-content .meta { clear: left; padding: 0; font-style: oblique; font-weight: 400; font-size: 12px;
                      color: #919191; line-height: 1.4em; background: #fff; border: 0; box-shadow: none; }
.wiki-content .hidden { display: none; margin-top: 16px; text-indent: -3px; }
.wiki-content .hidden.show { display: block; }

/* tables */
.table { width: 100%; margin-bottom: 1.6em; }
table.table { border: 1px solid #262626; width: auto; }
table.table tr:first-child td { border: 0; }
.table th, .table td { padding: 8px; line-height: 1.6em; text-align: left; vertical-align: top; border-top: 1px solid #333; }
.table th { font-weight: bold; }
.table-wrapper { margin-bottom: 1.6em; overflow-x: auto; }
.table-wrapper .table { margin-bottom: 0; }
.table-wrapper .table td, .table-wrapper .table tr:first-child td { border: 1px solid #333; }
.table-wrapper::-webkit-scrollbar { height: 8px; }
.table-wrapper::-webkit-scrollbar-track { background: #f0f0f0; border-radius: 4px; }
.table-wrapper::-webkit-scrollbar-thumb { background: #d8d8d8; border-radius: 4px; }
```

**Resolved blockquote appearance** (`blockquote.definition` / `blockquote.example`):
padding `16px`; background `#f7f7f7`; border `1px solid #d4d4d4`; box-shadow `0 0 0 1px #f3f3f3`; margin `0 0 20px 0`; `clear: none`; `overflow: hidden`; preceded by the uppercase 9px `#919191` label ("DEFINITION" / "EXAMPLE") with `letter-spacing: .6px` and `margin-bottom: 10px`.
`<h3>` inside a `blockquote.example` = the problem statement: base `h3` → `font-size: 15px; font-weight: 400; line-height: 1.5em; color: #161616; margin-bottom: .25em; font-family: 'CoFo Brilliant'`.
`<p>` inside blockquotes gets `margin-bottom: 20px` (`.summary-container p` beats `blockquote p`), last child `0`.

**Resolved properties-table appearance**: outer `table.table` has `border: 1px solid #262626`, `width: auto`, `border-collapse: collapse`; every `td` has `border: 1px solid #333` and `padding: 8px`, `text-align: left`, `vertical-align: top`, `line-height: 1.6em`. The first row is plain `<td>` cells (not `<th>`) — **the header row is not bold on the original**. Wrapped in `div.table-wrapper` (`overflow-x: auto`, `margin-bottom: 1.6em`).

### 5.6 Table of contents

```html
<div class="toc wiki-toc">
  <h4>Contents</h4>
  <ul class="unstyled">
    <li><a href="#logarithmic-functions-properties-easy">Properties of Logarithms - Basic</a></li>
    …
  </ul>
</div>
```

```css
.wiki-toc { clear: left; padding: 8px 8px 8px 16px; margin-bottom: 40px; margin-left: 16px;
            background: none; border: 0; border-left: 3px solid #f3f3f3;
            border-radius: 0; box-shadow: none; width: 376px; }
.wiki-toc h4 { margin-bottom: 10px; }
.wiki-toc ul { margin: 0; margin-left: 12px; font-size: 14px; }
.wiki-toc li:last-child { margin: 0; }
.wiki-toc li a { color: #777; }
.wiki-toc li a:hover { color: #456DFF; }
.wiki-toc li a g { fill: #777; }
.wiki-toc li a:hover g { fill: #456DFF; }
```

Resolved: **376px wide** block, left rule `3px solid #f3f3f3`, `padding: 8px 8px 8px 16px`, `margin: 0 0 40px 16px`. `h4` "Contents" = CoFo Brilliant 500 / 20px / `#161616`, `margin-bottom: 10px`. `ul.unstyled` has **no** rule removing bullets in any loaded stylesheet → **discs remain**, `margin-left: 12px`, `font-size: 14px`. Links `#777`, hover `#456DFF`. `li` inherits `.summary-container li { margin-bottom: 6px }`.

### 5.7 Embedded "Try It Yourself" problem

Appears once, inside `#section-logarithmic-functions-problem-solving-medium`. Raw markup (note: the original nests a `<div>` inside a `<p>` — invalid HTML the browser reparents; build it as a sibling block):

```html
<div class="problem-modal-container anchor" id="problem-logarithms-in-ap">
  <div class="wiki-problem" data-controller="app/wiki:wikiShowProblemAnswer">
    <div class="problem-container">
      <div class="answer-container solv-details">
        <button class="btn reveal-solution-btn">Reveal the answer</button>
      </div>
      <div class="question-container">
        <p>The following logarithms are in an arithmetic progression:</p>
        <p>\[\log_{2}4 + \log_{2}{16} + \log_{2}{64} + \cdots + x = 42.\]</p>
        <p>If \(x\) can be expressed as \(\log_{2}a,\) find the value of \(a.\)</p>
      </div>
      <div class="solution-container hide"><br><br>The correct answer is: <strong>4096</strong></div>
    </div>
  </div>
</div>
```

```css
.problem-modal-container { clear: both; }
.wiki-problem { width: 100%; padding: 16px; margin-bottom: 24px; margin-left: auto; margin-right: auto;
                background: #fff; overflow: auto; border-radius: 10px; border: 1px solid #d4d4d4;
                box-shadow: 0 0 0 1px #f3f3f3; }
.wiki-problem + .wiki-problem { margin-bottom: 0; }
.wiki-problem:before { content: 'Try It Yourself'; display: block; margin-bottom: 10px; font-size: 9px;
                       color: #919191; line-height: 1.2em; font-weight: 500;
                       text-transform: uppercase; letter-spacing: 0.5px; }
.wiki-problem .problem-container { float: left; width: 100%; }
.instant-try-it-yourself .wiki-problem .problem-container { position: relative; }
.wiki-problem .question-container { padding-right: 24px; margin-right: 276px; overflow: hidden; }
.wiki-problem .answer-container { float: right; width: 276px; }
.wiki-problem .answer-container .btn { width: 100%; }
.wiki-problem.answer-revealed .reveal-solution-btn { display: none; }
.wiki-problem.answer-revealed .solution-container { display: block; }
.wiki-problem img { max-width: 476px; }
.solv-details { position: relative; }
```

Layout: card `width:100%`, `padding:16px`, `border-radius:10px`, `border:1px solid #d4d4d4`, `box-shadow:0 0 0 1px #f3f3f3`, `background:#fff`, `margin-bottom:24px`, preceded by the 9px uppercase `#919191` label **"Try It Yourself"** (`letter-spacing: .5px`). Answer column floats right at **276px**; question column has `margin-right: 276px; padding-right: 24px`. The `.reveal-solution-btn` is a full-width `.btn` (default grey `.btn`: bg `#f0f0f0`, colour `#333`, `border-radius: 54px`, `border: 2px solid transparent`, `padding: 3px 16px`).

### 5.8 Self-citation

```html
<div class="wiki-self-citation" data-controller="app/wiki:getCitationTime">
  <strong>Cite as:</strong> Logarithms. <em>Brilliant.org</em>.
  Retrieved <span class="retrieval-time"></span> from
  <a href="https://brilliant.org/wiki/logarithms/">https://brilliant.org/wiki/logarithms/</a>
</div>
<script id="retrieval-time-content" type="text/template">
  <%- hour %>:<%- minute %>, <%- month %> <%- day %>, <%- year %>,
</script>
```

```css
.wiki-self-citation { clear: both; margin: 48px 0; font-size: 12px; line-height: 1.2em; }
.highlight-citation { animation: anim-highlight 5s; }
@keyframes anim-highlight {
  0%   { background: rgba(255, 197, 0, 0.25); }
  90%  { background: rgba(255, 197, 0, 0.25); }
  100% { background: #fff; }
}
```

`.retrieval-time` is **empty in the HTML** and filled at load by JS (§8.3). Format produced: `HH:MM, Month D, YYYY,` — note the **trailing comma** is part of the template, so the rendered line reads `… Retrieved 14:07, August 21, 2026, from https://…`.

---

## 6. VERBATIM COPY

Every string below is copied byte-for-byte from the HTML. Nothing here is paraphrased. Math is delivered as raw LaTeX inside `\( … \)` (inline) and `\[ … \]` (display) — see §8.5.

### 6.1 Header
```
Home
Courses
Sign up
Log in
```
Logo `alt` text: `Brilliant`

### 6.2 Page title
```
Logarithms
```

### 6.3 Contributor byline — **`display:none`, DO NOT RENDER** (recorded for completeness)
```
Hemang Agarwal , Brody Acquilano , tanveen dhingra , and [20 others] contributed
```
Dropdown `<ul>` items: `Rajdeep Dhingra`, `Justin Wong`, `Aditya Virani`, `Arron Kau`, `Skanda Prasad`, `Daniel Maia`, `Trevor Arashiro`, `Mahindra Jain`, `Bala vidyadharan`, `Pi Han Goh`, `Andrew Hayes`, `Sravanth C.`, `Ram Mohith`, `Calvin Lin`, `Gene Keun Chung`, `Ron Lauterbach`, `Mehul Arora`, `Andrew Ellinor`, `Jimin Khim`, `Eli Ross`.
Dropdown toggle label: `20 others`.

### 6.4 Table of contents
```
Contents
Properties of Logarithms - Basic          → #logarithmic-functions-properties-easy
Worked Examples Using Properties          → #worked-examples-using-properties
Properties of Logarithms - Intermediate   → #logarithmic-functions-properties-medium
Problem Solving - Basic                   → #logarithmic-functions-problem-solving-easy
Problem Solving - Intermediate            → #logarithmic-functions-problem-solving-medium
Problem Solving - Advanced                → #logarithmic-functions-problem-solving-hard
Applications                              → #applications
See Also                                  → #see-also
```

### 6.5 Article body — complete, in document order

Legend: `P:` = `<p>`, `H2:`/`H3:`/`H4:` = heading, `HR` = `<hr>`, `BLOCKQUOTE.x { }` = `<blockquote class="x">`, `TABLE.table { ROW: cell | cell | cell }`, `**bold**` = `<strong>`, `*italic*` = `<em>`, `[text](href)` = `<a class="wiki_link" target="_blank">`.

```

=== <div id="section-pre-header-section" class="section.collapsed"> ===
  <div.section-container> {
    P: A **logarithm** is the [inverse](/wiki/functions-inverses/) of the [exponential function](/wiki/exponential-functions/). Specifically, a logarithm is the power to which a number (the base) must be raised to produce a given number.
    P: For example, \(\log_2 64 = 6,\) because \( 2^6 = 64.\) In general, we have the following definition:
    BLOCKQUOTE.definition {
      P: \( z \) is the **base-\(x\) logarithm of \(y\)** if and only if \( x^z = y \). In typical notation
      P: \[ \log_x y = z \iff x^z = y.\]
    }
  }

=== <div id="-" class="toc.wiki-toc"> ===
  H4: Contents
  UL {
    LI: [Properties of Logarithms - Basic](#logarithmic-functions-properties-easy)
    LI: [Worked Examples Using Properties](#worked-examples-using-properties)
    LI: [Properties of Logarithms - Intermediate](#logarithmic-functions-properties-medium)
    LI: [Problem Solving - Basic](#logarithmic-functions-problem-solving-easy)
    LI: [Problem Solving - Intermediate](#logarithmic-functions-problem-solving-medium)
    LI: [Problem Solving - Advanced](#logarithmic-functions-problem-solving-hard)
    LI: [Applications](#applications)
    LI: [See Also](#see-also)
  }

=== <div id="logarithmic-functions-properties-easy" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Properties of Logarithms - Basic
  }

=== <div id="section-logarithmic-functions-properties-easy" class="section.collapsed"> ===
  <div.section-container> {
    P: First, we must know the basic structure of a logarithm \((\)abbreviated \(\log\) for convenience\().\) \(\log_a{b}=c\) can be rewritten as \(a^c=b,\) where \(a\) is called the **base**, \(c\) the **exponent**, and \(b\) the **argument**. Also, \(\log\) without a base is shorthand for the common \(\log\) of base \(10.\) Now that we know this, we can manipulate logs:
    <div.table-wrapper> {
      TABLE.table {
        ROW: In Math | In English | Example
        ROW: \(\log_a b + \log_a c = \log_a bc\) | When you add logs with the same base, you can merge into one log and multiply their arguments. | \(\log_2 5 + \log_2 6 = \log_2 30\)
        ROW: \(\log_a{b}-\log_a{c} = \log_a \frac{b}{c}\) | The opposite of the above. | \(\log_2{18}-\log_2{6} = \log_2{3}\)
        ROW: \(\log_a b^c = c \cdot \log_a b\) | When your result has an exponent, you can move it to the front of the log. | \(\log_3{\big(5^{-4}\big)} = -4 \cdot \log_3{5}\)
        ROW: \(\log_{a^b}{c}=\frac{1}{b}\log_{a}{c}\) | When the base has an exponent, you can move its reciprocal to the front of the log. | \(\log_{\pi^2}{e}=\frac{1}{2}\log_{\pi}{e}\)
        ROW: \(\log_a b = \frac{\log_c b}{\log_c a}\) | This is the [change of base formula](/wiki/change-of-base-formula/). You can rearrange any log by making a fraction, with the log of the argument in the numerator and the log of the base in the denominator. Any base can be chosen for the logs, but the bases *must* be the same for both logs. | \(\log_2 \pi = \frac{\log \pi}{\log 2}\)
        ROW: \(log_a b=\frac{1}{\log_b a}\) | If you want to switch the base of the log \(a\) with the argument \(b,\) then you take the reciprocal. | \(\log_4 e=\frac{\log_e e}{\log_e 4}=\frac{1}{\log_e 4}\)
        ROW: \({ a }^{ \log _{ a }{ b } } = b\) | When a constant \(a\) is raised to the power \(\log _{ a }{ b },\) the resultant expression is \(b.\) | \({ e }^{ \log _{ e }{ 3 } }=3\)
        ROW: \(\log_{a}{1}=0\) | Any log which has 1 as its argument will be equal to 0. | \(\log_{\pi \cdot e}{1}=0\)
      }
    }
    P: Other properties can be derived from these basic ones, especially when noting that these properties are inversable.
    BLOCKQUOTE.example {
      P: Simplify \(\log_2 \left(\dfrac{32}{9}\right)^2\) as much as possible.
      HR (horizontal rule)
      P: Try to follow the steps and identify what properties were used:
      P: \[\begin{align}
\log_2 \left(\dfrac{32}{9}\right)^2
&=2 \cdot \log_2 \left(\frac{32}{9}\right)\\
&=2 \cdot ( \log_2 32 - \log_2 9)\\
&=2 \cdot \left( \log_2 2^5 -\log_2 3^2\right)\\
&=2 \cdot ( 5 \cdot \log_2 2 - 2 \cdot \log_2 3)\\
&=2 \cdot ( 5 \cdot 1 -2 \cdot \log_2 3)\\
&=10- 4 \log_2 3.
\end{align}\]
      P: Note: \(\log_2 3\) can't be simplified further. Line 1 used the second property, line 2 put thingies into exponential form, line 3 used the third property, and lines 4 and 5 did basic simplification. \(_\square\)
    }
    BLOCKQUOTE.example {
      P: Simplify \[\displaystyle{2\log_4{\sqrt{5}}+\frac{1}{2}\log_2{625}-\log_2{\frac{1}{5}}}.\]
      HR (horizontal rule)
      P: Again, try to follow the steps of the solution:
      P: \[\begin{align}
2\log_{(2^2)}{\big(5^\frac{1}{2}\big)}+\frac{1}{2}\log_2{\big(5^4\big)}-\log_2{\big(5^{-1}\big)}
&=2\frac{\log 5^{\frac{1}{2}}}{\log 2^2}+\frac{1}{2}(4)(\log_2{5})+\log_2{5}\\
&=2\frac{\frac{1}{2}\log 5}{2\log 2}+2\log_2{5}+\log_2{5}\\
&=\frac{1}{2}\frac{\log 5}{\log 2}+3\log_2{5}\\
&=\frac{1}{2}\log_2{5}+3\log_2{5}\\
&=\frac{7}{2}\log_2{5}.
\end{align}\]
      P: The first line shows that it is (usually) best to convert numbers so that they are integers to a power. Note that lines 4 reverses the process of the fourth property. \(_\square\)
    }
  }

=== <div id="worked-examples-using-properties" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Worked Examples Using Properties
  }

=== <div id="section-worked-examples-using-properties" class="section.collapsed"> ===
  <div.section-container> {
    P: \[ \]
\(1.~\log _{ a }{ a } =1\)
    BLOCKQUOTE.example {
      H3: Find the value of \(\log _{ 4 }{ 4 }.\)
      HR (horizontal rule)
      P: Using the property \(\log _{ a }{ a }=1,\) we get \(\log_{ 4 }{ 4 } =1. \ _\square\)
    }
    P: \[ \]
\(2.~\log _{ a }{ (b^c) } =c\log _{ a }{ b } \)
    BLOCKQUOTE.example {
      H3: Find the value of \(\log _{ 2 }{ 16 }.\)
      HR (horizontal rule)
      P: We have
      P: \[\begin{align}
\log _{ 2 }{ 16 } 
&= \log _{ 2 }{ { 2 }^{ 4 } } &&\qquad \big(16={ 2 }^{ 4 }\big)\\
&=4\log _{ 2 }{ 2 } &&\qquad \big(\log { { a }^{ b } } = b\log { a } \big)\\ 
&= 4. \ _\square &&\qquad (\text{by property 1})
\end{align}\]
    }
    P: \[ \]
\(3.~\log _{ a }{ (b \times c) } = \log _{ a }{ b }+ \log _{ a }{ c } \)
    BLOCKQUOTE.example {
      H3: Find the value of \(\log { 90 }\) assuming \(\log { 3 } =0.47\).
      HR (horizontal rule)
      P: We have
      P: \[\begin{align}
\log { 90 } 
&= \log { (9\times 10) } &&\qquad (90= 9 \times 10)\\
&=\log { 9 } + \log { 10 } &&\qquad \big(\log _{ a }{ (b\times c) } =\log _{ a }{ b } +\log _{ a }{ c } \big)\\
&=2\log { 3 } +1 &&\qquad \text{(by properties 2 and 1)}\\
&=2\times 0.47+1\\
&=0.94+1\\
&=1.94. \ _\square
\end{align}\]
    }
    P: \[ \]
\(4.~\displaystyle{\log _{ a }{ \frac { b }{ c } } = \log _{ a }{ b } - \log _{ a }{ c }}\)
    BLOCKQUOTE.example {
      H3: Evaluate \(\log { 0.27 }\) assuming \(\log { 3 } =0.47\).
      HR (horizontal rule)
      P: We have
      P: \[\begin{align}
\log { 0.27 } 
&= \log { \frac { 27 }{ 100 } } \\
&= \log { 27 } - \log { 100 } \\ 
&=3\log{ 3 } - 2\\ 
&=1.41 - 2\\ 
&=-0.59. \ _\square
\end{align}\]
    }
    P: \[ \]
\(5.\) \(\displaystyle{\log_{ a }{ b } = \frac { \log_{ c }{ b } }{ \log_{ c }{ a } }} \)
    BLOCKQUOTE.example {
      H3: Find the value of \(\log_{ 32 }{ 2 }\).
      HR (horizontal rule)
      P: We have
      P: \[\begin{align}
\log_{ 32 }{ 2 }
&=\frac { \log_{ 2 }{ 2 } }{ \log_{ 2 }{ 32 } } \\ 
&=\frac { 1 }{ 5\log_{ 2 }{ 2 } } \\
&=\frac { 1 }{ 5 }\\
&={ 0.2 }. \ _\square
\end{align} \]
    }
  }

=== <div id="logarithmic-functions-properties-medium" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Properties of Logarithms - Intermediate
  }

=== <div id="section-logarithmic-functions-properties-medium" class="section.collapsed"> ===
  <div.section-container> {
    BLOCKQUOTE.example {
      H3: What is the value of \( \log_3 15 + \log_3 81 - \log_3 5 ?\)
      HR (horizontal rule)
      P: Using the properties of logarithms, we can rewrite the given expression as follows:
      P: \[ \begin{align}
\log_3 15 + \log_3 81 - \log_3 5 &= \log_3 15 - \log_3 5 + \log_3 3^4 \\
&= \log_3 \frac{15}{5} + \log_3 3^4 \\
&= \log_3 3+ 4 \log_3 3 \\
&= 5. \ _\square
\end{align}\]
    }
  }

=== <div id="logarithmic-functions-problem-solving-easy" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Problem Solving - Basic
  }

=== <div id="section-logarithmic-functions-problem-solving-easy" class="section.collapsed"> ===
  <div.section-container> {
    BLOCKQUOTE.example {
      H3: What is(are) the solution(s) of the quadratic equation
      P: \[\log 2x + \log(x-1) = \log\big(x^2+3\big) ?\]
      HR (horizontal rule)
      P: We have
      P: \[ \begin{align}
\log 2x + \log(x-1) &= \log(x^2+3) \\
\log 2x(x-1) &= \log (x^2+3) \\
\Rightarrow 2x(x-1) &= x^2 +3 \\
 x^2-2x-3 &= 0 \\
(x+1)(x-3) &= 0 \\
x &= -1, 3.
\end{align} \]
      P: Since the logarithm functions \( \log(x-1)\) and \( \log 2x\) are defined over positive numbers, it must be true that \(x-1>0 \implies x>1\) and \(2x>0 \implies x>0.\) Thus, \(-1\) is can not be the value of \(x,\) implying that the value of \(x\) satisfying the given equation is \(x=3.\) \(_\square\)
    }
    BLOCKQUOTE.example {
      H3: What is the solution(s) of the quadratic equation
      P: \[ 2(\log x)^2 = 7\log x - 3 ?\]
      HR (horizontal rule)
      P: We have
      P: \[\begin{align}
2(\log x)^2 &= 7\log x - 3 \\
2(\log x)^2 - 7\log x +3 &= 0 \\
(\log x -3)(2\log x -1) &= 0 \\
\Rightarrow \log x &= 3, \frac{1}{2} \\
x &= 1000, \sqrt{10}. \ _\square
\end{align} \]
    }
  }

=== <div id="logarithmic-functions-problem-solving-medium" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Problem Solving - Intermediate
  }

=== <div id="section-logarithmic-functions-problem-solving-medium" class="section.collapsed"> ===
  <div.section-container> {
    BLOCKQUOTE.example {
      H3: If the solutions of the quadratic equation \( x^{\log_3 x\,-\,2} = 27 \) are \(a\) and \(b,\) what is \( \log_{a} b + \log_{b} a?\)
      HR (horizontal rule)
      P: Taking logs with base 3 on both sides, we have
      P: \[ \begin{align}
x^{\log_{3} x\,-\,2} &= 27 \\
\Rightarrow (\log_{3} x -2)\log_{3} x &= \log_{3} 27 \\
(\log_{3} x)^2-2\log_{3} x - 3 &= 0 \\
(\log_{3} x +1)(\log_{3} x - 3) &= 0 \\
\log_{3} x &= -1, 3.
\end{align} \]
      P: Since \( \log_{a} b + \log_{b} a \) can be expressed as \(\frac{\log_{3} b}{\log_{3} a} + \frac{\log_{3} a}{\log_{3} b}\) using log with base 3,
      P: \[ \begin{align}
\log_{a} b + \log_{b} a &= \frac{\log_{3} b}{\log_{3} a} + \frac{\log_{3} a}{\log_{3} b} \\
&= \frac{-1}{3} + \frac{3}{-1} \\
&= -\frac{10}{3}. \ _\square
\end{align} \]
    }
    BLOCKQUOTE.example {
      P: If the solutions of the equation \(\log_{2} x + a\log_{x} 8 = b \) are \(2\) and \(\frac{1}{8},\) what are \(a\) and \(b?\)
      HR (horizontal rule)
      P: We have
      P: \[ \begin{align}
\log_{2} x + a\log_{x} 8 &= b \\
\log_{2} x + a\log_{x} 2^3 &= b \\
\log_{2} x + \frac{3a}{\log_{2} x} &= b \\
(\log_{2} x)^2 -b \log_{2} x + 3a &= 0. \qquad (1) \\
\end{align} \]
      P: Since the solutions of the equation \( {(\log_{2} x)}^2 -b \log_{2} x + 3a = 0 \) are \(2\) and \(\frac{1}{8} ,\) substituting \(2\) and \(\frac{1}{8}\) into \((1)\) gives
      P: \[ \begin{align}
(\log_{2} 2)^2 - b \log_{2} 2 + 3a &= 0 \\
\Rightarrow 1-b+3a &= 0, \qquad (2)\\
(\log_{2} \frac{1}{8} )^2 - b \log_{2} \frac{1}{8} + 3a &= 0 \\
\Rightarrow 9+3b+3a &=0. \qquad (3)
\end{align} \]
      P: Solving the simultaneous equations \((2)\) and \((3)\) gives \(a= -1\) and \(b = -2.\) \(_\square\)
    }
    WIKI-PROBLEM WIDGET (div.problem-modal-container.anchor#problem-logarithms-in-ap > div.wiki-problem) {
      CSS ::before LABEL: Try It Yourself
      BUTTON.btn.reveal-solution-btn: Reveal the answer
      QUESTION-CONTAINER {
        P: The following logarithms are in an arithmetic progression:
        P: \[\log_{2}4 + \log_{2}{16} + \log_{2}{64} + \cdots + x = 42.\]
        P: If \(x\) can be expressed as \(\log_{2}a,\) find the value of \(a.\)
      }
      SOLUTION-CONTAINER (class 'hide' until revealed) {
        <br><br>The correct answer is: **4096**
      }
    }
  }

=== <div id="logarithmic-functions-problem-solving-hard" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Problem Solving - Advanced
  }

=== <div id="section-logarithmic-functions-problem-solving-hard" class="section.collapsed"> ===
  <div.section-container> {
    BLOCKQUOTE.example {
      P: What are the solutions of the equation
      P: \[ \log_{x} xy \times \log_{y} xy + \log_{x}(x-y) \times \log_{y} (x-y) = 0?\]
      HR (horizontal rule)
      P: We have
      P: \[ \begin{align}
\log_{x} xy \times \log_{y} xy + \log_{x}(x-y) \times \log_{y} (x-y) &= 0 \\
\frac{\log xy}{\log x} \times \frac{\log xy}{\log y} + \frac{\log(x-y)}{\log x} \times \frac{\log(x-y)}{\log y} &= 0 \\
\frac{(\log xy)^2 + (\log(x-y))^2}{\log x \cdot \log y} &= 0 \\
(\log xy)^2 + (\log(x-y))^2 &= 0 \\
\Rightarrow \log xy &= 0 \text{ and } \log(x-y)= 0. \\
\end{align} \]
      P: Since \(x\) and \(y\) are both positive, this implies that
      P: \[ \begin{align}
xy &= 1 \text{ and } x-y=1 \\
\Rightarrow x&= \frac{\sqrt{5} +1}{2}, y=\frac{\sqrt{5}-1}{2}. \ _\square
\end{align} \]
    }
  }

=== <div id="applications" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: Applications
  }

=== <div id="section-applications" class="section.collapsed"> ===
  <div.section-container> {
    P: \[ \]
**Richter Scale:**
    P: Richter scale was developed by Charles Richter in 1935 to compare the intensities of earthquakes. The amount of energy released in an earthquake is very large, so a logarithmic scale avoids the use of large numbers.
    P: The formula used for these calculations is
    P: \[M= \log_{10}\left(\frac{I}{I_0}\right),\]
    P: where \(M\) is the magnitude on the Richter scale, \(I\) is the intensity of the earthquake being measured, and \(I_0\) is the intensity of a reference earthquake.
    P: Let's do a quick example to clarify how this works.
    P: The 1906 San Francisco earthquake had a magnitude of 8.3 on the Richter scale. At the same time in South America there was an eathquake with magnitude 4.1 that caused only minor damage. How many times more intense was the San Francisco earthquake than the South American one?
    P: Because the magnitude is a base-10 log, the Richter number is actually the exponent that 10 is raised to in order to calculate the intensity of the earthquake. Thus, the difference in magnitudes of the earthquakes can be calculated as follows:
    P: \[M=\log_{10}\left(\frac{10^{8.3}}{10^{4.1}}\right)=4.2.\]
    P: So, to answer the question, the San Francisco earthquake is more intense than the South American one by about \(10^M \approx 15848.93192\) times!
    P: Note that you can just subtract 4.1 from 8.3 and get the same result. But if your math teachers are like mine, they will want you to use logarithms, and this is how it is done. The reason that subtracting the magnitudes works is because of the exponent rule for dividing exponents with the same base.
    P: \[ \]
**Decibel Scale:**
    P: One decibel is one tenth of one bel, named in honor of Alexander Graham Bell. The bel is rarely used without the deci- prefix, deci- meaning one tenth. The decibel scale is used to calculate the difference in intensity between two sounds:
    P: \[L=10\log_{10}\left(\frac{I}{I_0}\right),\]
    P: where \( L\) is the loudness of the sound measured in decibels, \(I\) is the intensity of the sound being measured, and \(I_0\) is the intensity of the sound at the threshold of hearing which is equal to zero decibels.
    P: \[ \]
**\(\text{pH}\) Scale:**
    P: The \(\text{pH}\) scale was invented in 1910 by Dr. Soren Sorenson, Head of Laboratory at Carlsberg Beer Company. The "H" in \(\text{pH}\) stands for hydrogen and the meaning of the "p" in \(\text{pH}\), although disputed, is generally considered to mean the power of hydrogen. This scale is used to measure the acidity or alkalinity of water or water soluble substances including, but definitely not limited to, soil or rainwater. The \(\text{pH}\) scale ranges from 1 to 14, where seven is a neutral point. Values below 7 indicate acidity with 1 being the most acidic. Values above 7 indicate alkalinity with14 being the most alkaline:
    P: \[\text{pH}=-\log_{10}\ce{[H+]},\]
    P: where \(\text{pH}\) is the \(\text{pH}\) number between \(1\) and \(14\) and \(\ce{[H+]}\) is the concentration of hydrogen ions.
  }

=== <div id="see-also" class="anchor.skill-heading.collapsed"> ===
  <header.section-header> {
    <span.css-sprite-chevrons chevron> {
    }
    H2: See Also
  }

=== <div id="section-see-also" class="section.collapsed"> ===
  <div.section-container> {
    UL {
      LI: [Solving Logarithmic Equations](/wiki/solving-logarithmic-equations/)
      LI: [Graphs of Logarithmic Functions](/wiki/logarithmic-functions-graphs/)
      LI: [Solving Logarithmic Inequalities](/wiki/solving-logarithmic-inequalities/)
    }
  }
```

> **Template note.** Per the brief, a rebuild may excerpt this body rather than shipping all ~15 KB. If you excerpt, keep the *structural* set intact — lede paragraph, definition blockquote, TOC, all 8 `h2` headings, at least one `blockquote.example`, the properties `table.table`, the Try-It-Yourself widget, the See Also list — and truncate only *within* a section. Never substitute your own sentences for removed ones; delete whole paragraphs instead.

### 6.6 In-article link targets (all `class="wiki_link" target="_blank"`)

| Anchor text | href | `title` attr |
|---|---|---|
| inverse | `/wiki/functions-inverses/` | `inverse` |
| exponential function | `/wiki/exponential-functions/` | `exponential function` |
| change of base formula | `/wiki/change-of-base-formula/` | `change of base formula` |
| Solving Logarithmic Equations | `/wiki/solving-logarithmic-equations/` | `Solving Logarithmic Equations` |
| Graphs of Logarithmic Functions | `/wiki/logarithmic-functions-graphs/` | `Graphs of Logarithmic Functions` |
| Solving Logarithmic Inequalities | `/wiki/solving-logarithmic-inequalities/` | `Solving Logarithmic Inequalities` |

`.wiki_link` has **no** CSS rule in any loaded stylesheet — links take `body.wiki-page a { color: #456DFF }`, hover `#1245ff`.

### 6.7 Sticky footer CTA bar (verbatim)

```html
<div class="wiki-footer" data-controller="app/wiki:wikiFooter" id="loggedout-wiki-footer">
  <a class="signup-btn content ax-click" rel="nofollow"
     href="https://brilliant.org/account/signup/?next=/wiki/logarithms/"
     data-ax-id="clicked_signup_from_wiki_footer" data-ax-type="button">
    <span class="cta-text-wrap">
      <strong>You're viewing an archive of Brilliant's Wiki, which is no longer maintained.</strong>
      For the best place to learn math, programming, data, and more,
      <span class="cta-link">check out Brilliant's interactive courses</span>.
    </span>
  </a>
</div>
```

Copy, exactly:
```
You're viewing an archive of Brilliant's Wiki, which is no longer maintained.   ← <strong>
For the best place to learn math, programming, data, and more,                  ← plain text
check out Brilliant's interactive courses                                       ← <span class="cta-link">
.                                                                               ← plain full stop, outside the span
```

```css
.wiki-footer { position: fixed !important; bottom: 0; left: 0; width: 100%; min-height: 48px;
               padding: 18px 24px; background: #333; z-index: 1; }
.wiki-footer .content { display: flex; justify-content: center; align-items: center; padding: 0;
                        border: 0; background: none; color: #fff; border-radius: 0; box-shadow: none; }
.wiki-footer .content:hover { color: #fff; }
.wiki-footer .content .cta-text-wrap { color: #fff; font-size: 16px; text-align: center; max-width: 700px; }
.wiki-footer .content .cta-text-wrap .cta-link { color: #29cc57; text-decoration: none;
                                                 border-bottom: 2px solid #29cc57; padding-bottom: 1px; }
.wiki-footer .content .cta-text-wrap .cta-link:hover { color: #15b441; border-bottom-color: #15b441; }
/* present in wiki.css but UNUSED on this page — no .btn-accent element exists here */
.wiki-footer .btn-accent { background: #29cc57; border: 2px solid #29cc57; border-radius: 54px; color: #fff;
                           padding: 2px 0; width: 108px; min-width: 108px; font-weight: 500;
                           font-size: 16px; line-height: 2; white-space: nowrap; }
.wiki-footer .btn-accent:hover { box-shadow: none; background: #15b441; border-color: #15b441; }
```

Resolved: dark `#333` bar pinned to the viewport bottom, `padding: 18px 24px`, `min-height: 48px`. The whole bar is one `<a>` laid out as a centred flex row; text `#fff` / `16px` / centred / `max-width: 700px`. The link phrase is `#29cc57` with a 2px `#29cc57` underline (`padding-bottom: 1px`), hover `#15b441`. `body { padding-bottom: 80px }` reserves the space.

### 6.8 Signup modals — present in DOM, `display:none` by default

Two identical modals differing only in their headline. Both are `<div class="public-signup-modal-experiment modal hide rebrand" data-controller="app/signup:signUpModal">`.

`#signup-modal-generic` headline (`div.text.row`):
```
The best way to learn math and computer science.
```
`#signup-modal-wiki` headline (`div.text.row`):
```
Sign up to read all wikis and quizzes in math, science, and engineering topics.
```

Shared body copy, in DOM order:
```
Log in with Google        ← a.btn.btn-google.signup-social  (span.google.css-sprite-index + text)
Log in with Facebook      ← a.btn.btn-f-b.signup-social     (inline SVG fb-icon + text)
Log in with email         ← a.btn.btn-email
Join using Google         ← a.btn.btn-google.signup-social
Join using email          ← a.btn.btn-email
Reset password            ← a.btn-link.forget   href=/account/password/reset/
New user?                 ← plain text in div.login-alternative > p
Sign up                   ← a.btn-link
Existing user?            ← plain text in div.signup-alternative > p
Log in                    ← a.btn-link
```
Empty containers inside: `div#public-signup-tour.public-signup-left.col.col-last.public-signup-left-experiment`, `div#signup-form-container.signup-form-container`, `div#login-form-container.login-form-container.row`, `span.css-sprite-signup-modal.signup-modal-image`.

Applicable CSS actually present:
```css
.modal { position: relative; width: 524px; padding: 48px 24px; margin: 69px auto;
         background-color: #fff; z-index: 700; }
.hide { display: none; }
.btn-link { padding: 0; border: 0; border-radius: 0; background: none; line-height: inherit;
            font: inherit; vertical-align: baseline; color: #0277bd; outline: none; }
```
`.public-signup-modal-experiment`, `.public-signup-experiment`, `.public-signup-left*`, `.css-sprite-signup-modal`, `.signup-modal-image`, `.css-sprite-index`, `.login-buttons`, `.signup-buttons`, `.btn-google`, `.btn-f-b`, `.btn-email` — **none of these have a declaration in any of the three loaded stylesheets.** Their visual design is therefore unavailable from this page. **Do not invent it.** Either omit both modals or render them hidden with only the documented `.modal` box styling.

### 6.9 Legacy in-column modal `.signup-modal.hide` — present, hidden, no controller binds it

```
Sign up with Facebook     ← a.btn.signup-fb
or                        ← span.or
Sign up manually          ← a.btn.signup-email
Already have an account?  ← p text
Log in here.              ← a
```
```css
.signup-modal .modal-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                          z-index: 899; background: rgba(0,0,0,0.5); }
.signup-modal .modal-content { position: fixed; top: 50%; left: 50%; width: 400px;
                               padding: 48px 24px; margin: -150px 0 0 -200px; background: #fff; z-index: 900; }
.signup-modal .buttons { margin-bottom: 24px; }
.signup-modal .btn { display: block; }
.signup-modal .or { display: block; margin: 16px 0; color: #919191; text-align: center; }
.signup-modal p { margin: 0; }
```
No JS on this page adds/removes its `.hide` class. **Recommend omitting it entirely.**

---

## 7. Asset inventory

### 7.1 Everything this page references

| Asset | Type | Local status | Notes |
|---|---|---|---|
| `/site_media/version-0/images/brilliant-wordmark-black.svg` | image, the only `<img>` on the page | **PRESENT — downloaded during this capture** | HTTP 200, 1,997 bytes, `viewBox="0 0 114 27"`, `fill="black"` paths, rendered `height="24"` (≈101.33 × 24 px). Local: `public/assets/original/brilliant/brilliant.org/site_media/version-0/images/brilliant-wordmark-black.svg` |
| `inline-svg/brilliant-wordmark.svg` | image | **PRESENT** (added by a parallel capture) | Same 114×27 geometry, but `fill="currentColor"` and `style="color:black"`. Local: `public/assets/original/brilliant/brilliant.org/inline-svg/brilliant-wordmark.svg`. Prefer this one if you need the mark to inherit colour; the page itself ships the hard-black variant. |
| Home nav icon | inline SVG | n/a — reproduce from §4.4 | 21 × 20 |
| Courses nav icon | inline SVG | n/a — reproduce from §4.4 | 21 × 20 |
| Facebook icon (`svg.fb-icon`) × 2 | inline SVG, inside hidden modals only | n/a | `fill="#fff"`, no width/height/viewBox attrs |
| `/apple-touch-icon*-precomposed.png` × 8 | favicons | **present** under `public/assets/original/brilliant/brilliant.org/` | all 8 sizes already downloaded |
| `/site_media/version-1/fonts/cofo-brilliant/*.woff2` (6 faces) | font | **present** (as `_next/static/media/cofo_brilliant_*.woff2`) | wired as `font-b-sans` |
| `/site_media/version-1/fonts/cofo-robert/*.woff2` (2 faces) | font | **present** (as `_next/static/media/cofo_robert_medium*.woff2`) | wired as `font-b-serif` |
| `/site_media/version-1/fonts/source-code-pro/*.woff2` (6 faces) | font | **present** | wired as `font-b-mono` — **not used by this page** |
| `/site_media/version-1/fonts/soleil/*.woff2` (4 faces) | font | **missing** | **not used by this page** — declared in the bundle only |
| KaTeX webfonts (20 faces, `/site_media/build/dist/*.woff2`) | font | **missing** | needed only if math is rendered with KaTeX (§8.5) |
| `/site_media/sprite-578ac9c4513/build/sprites/css-sprite-chevrons.png` (+`-x2`) | sprite | **missing** | referenced by `.css-sprite-chevrons`, but that element is `display:none` here → **not needed** |
| `/site_media/images/open-graph/wiki.png` | OG image | **missing** | metadata only |
| `.css-sprite-index`, `.css-sprite-signup-modal` | sprite classes | **no CSS rule exists** in any loaded bundle | the spans render as empty zero-size elements → **Original asset unavailable** |

**No `<video>`, no `<source>`, no `poster`, no CSS `background-image` reaches any element rendered on this page.** The only `url()` in the page HTML is the SVG clip-path reference `url(#clip0_91_1939)`.

### 7.2 Download list

**Nothing left to download.** The one asset this page needed was fetched during this capture:

```
https://brilliant.org/site_media/version-0/images/brilliant-wordmark-black.svg   ← DONE
```

Serve it from:
`/assets/original/brilliant/brilliant.org/site_media/version-0/images/brilliant-wordmark-black.svg`

Alternative already on disk (same geometry, `currentColor` fill):
`/assets/original/brilliant/brilliant.org/inline-svg/brilliant-wordmark.svg`

Optional, only if you choose to render real KaTeX with self-hosted fonts (20 files):
```
https://brilliant.org/site_media/build/dist/dc450f2f0ab2bdfbb690.woff2   (KaTeX_Main 400)
https://brilliant.org/site_media/build/dist/66f9438cf6d3d8ba95b5.woff2   (KaTeX_Main 700)
https://brilliant.org/site_media/build/dist/fe2176f79edaa716e621.woff2   (KaTeX_Main italic 400)
https://brilliant.org/site_media/build/dist/20f389c4120be058d80a.woff2   (KaTeX_Main italic 700)
https://brilliant.org/site_media/build/dist/2076881d48df30458c5e.woff2   (KaTeX_Math italic 400)
https://brilliant.org/site_media/build/dist/3a3042819bc4c2d8cba0.woff2   (KaTeX_Math italic 700)
https://brilliant.org/site_media/build/dist/73ea273a72f4aca30ca5.woff2   (KaTeX_AMS 400)
https://brilliant.org/site_media/build/dist/a1abf90dfd72792a577a.woff2   (KaTeX_Caligraphic 700)
https://brilliant.org/site_media/build/dist/d6484fce1ef428d5bd94.woff2   (KaTeX_Caligraphic 400)
https://brilliant.org/site_media/build/dist/931d67ea207ab37ee693.woff2   (KaTeX_Fraktur 700)
https://brilliant.org/site_media/build/dist/172d3529b26f8cedef6b.woff2   (KaTeX_Fraktur 400)
https://brilliant.org/site_media/build/dist/95591a929f0d32aa282a.woff2   (KaTeX_SansSerif 700)
https://brilliant.org/site_media/build/dist/7d393d382f3e7fb1c637.woff2   (KaTeX_SansSerif italic 400)
https://brilliant.org/site_media/build/dist/cd5e231e0cc53b2cb2c0.woff2   (KaTeX_SansSerif 400)
https://brilliant.org/site_media/build/dist/c81d1b2a4b75d3eded60.woff2   (KaTeX_Script 400)
https://brilliant.org/site_media/build/dist/6eec866c69313624be60.woff2   (KaTeX_Size1)
https://brilliant.org/site_media/build/dist/2960900c4f271311eb36.woff2   (KaTeX_Size2)
https://brilliant.org/site_media/build/dist/e1951519f6f0596f7356.woff2   (KaTeX_Size3)
https://brilliant.org/site_media/build/dist/e418bf257af1052628d8.woff2   (KaTeX_Size4)
https://brilliant.org/site_media/build/dist/c295e7f71970f03c0549.woff2   (KaTeX_Typewriter 400)
```

### 7.3 Stylesheets (all HTTP 200)

| File | Bytes | Load order |
|---|---|---|
| `/site_media/build/dist/brilliant_desktop.fce7cc0f30d808cde7b3.css` | 203,685 | 1 |
| `/site_media/build/dist/wiki.8af42b6e1b09e4d5b9b5.css` | 25,004 | 2 |
| `/site_media/build/dist/feed_page.bfffdb75f0dd47134d36.css` | 13,241 | 3 (contributes nothing to this page beyond sprite URLs) |

Cascade note: on selector-specificity ties, `wiki.css` wins over `brilliant_desktop.css`.

### 7.4 Font stacks declared

```css
@font-face { font-family: 'CoFo Brilliant'; font-display: swap; src: url(…/cofo-brilliant-regular.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Brilliant'; font-weight: 500;  src: url(…/cofo-brilliant-medium.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Brilliant'; font-weight: bold; src: url(…/cofo-brilliant-bold.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Brilliant'; font-style: italic; src: url(…/cofo-brilliant-italic.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Brilliant'; font-weight: 500; font-style: italic; src: url(…/cofo-brilliant-medium-italic.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Brilliant'; font-weight: bold; font-style: italic; src: url(…/cofo-brilliant-bold-italic.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Robert'; font-weight: 500; src: url(…/cofo-robert-medium.woff2) format('woff2'); }
@font-face { font-family: 'CoFo Robert'; font-weight: 500; font-style: italic; src: url(…/cofo-robert-medium-italic.woff2) format('woff2'); }
```

Used on this page: **CoFo Brilliant** (body, all UI, `h4`, buttons) and **CoFo Robert 500** (page `h1` at 34px, section `h2` at 24px). KaTeX uses `KaTeX_Main, Times New Roman, serif`. Nothing else.

---

## 8. Interaction models

| # | Element | Controller | Model | Behaviour |
|---|---|---|---|---|
| 8.1 | `header` inside `.anchor.skill-heading` | `app/wiki:expandOrCollapse` | **click-driven** | Click on the section `<header>` toggles class `collapsed` on the heading div **and** on the next sibling `.section`. **On desktop this has no visual effect** — neither loaded stylesheet declares any `.collapsed` rule. It only matters in the mobile bundle, which this page does not load. Additionally, if `isMobile && location.hash === sectionId`, the header is auto-clicked and scrolled to after a 100 ms delay. |
| 8.2 | `.wiki-problem` | `app/wiki:wikiShowProblemAnswer` | **click-driven** | Clicking `.reveal-solution-btn` adds `answer-revealed` to `.wiki-problem` → button `display:none`, `.solution-container` `display:block`. One-way, no toggle back. |
| 8.3 | `.wiki-self-citation` | `app/wiki:getCitationTime` | **time-driven (once, on load)** | Reads the underscore template from `#retrieval-time-content` and writes `HH:MM, Month D, YYYY,` (zero-padded hour/minute, full month name, no zero-padding on day) into `.retrieval-time` using the **viewer's local clock**. |
| 8.4 | `#loggedout-wiki-footer` | `app/wiki:wikiFooter` | **effectively static on this page** | The controller reads `$('#footer').outerHeight()`; **there is no `#footer` element in this document**, so the height is falsy and the scroll handler is never attached. The bar therefore stays `position: fixed; bottom: 0` for the whole page. (On pages that *do* have a `#footer`, the handler throttles on `scroll` and applies `transform: translate(0, -Npx)` to lift the bar above the real footer.) |
| 8.5 | `div[data-controller="util/latex_loader:controller"]` | `util/latex_loader` | **on-load, async** | Loads KaTeX and renders every `\( … \)` (inline) and `\[ … \]` (display) run in the article. Display math becomes `.katex-display`. The pH section uses **mhchem** (`\ce{[H+]}`), so the mhchem extension is required for full fidelity. |
| 8.6 | `.summary.wiki-content` | `app/wiki:summary` | **hash-driven** | If `location.hash` starts with `citation-`, adds `.highlight-citation` (5 s amber-to-white keyframe) to that element. Also binds `.citation-link` clicks. **No `citation-*` ids and no `.citation-link` elements exist on this page** → inert. |
| 8.7 | Header `Sign up` / `Log in` | `util/ui:genericSignupModal` | **click-driven** | Opens `#signup-modal-generic`; `data-show-login="true"` on the Log in link makes it open in login mode. Since the modal's own styling is absent from the loaded CSS (§6.8), reproducing this is optional. |
| 8.8 | `.wiki-top-editors .dropdown` | Bootstrap `data-toggle="dropdown"` | **click-driven** | Moot — the whole byline is `display: none`. |
| 8.9 | Nav links, buttons, TOC links, `.cta-link` | — | **hover-driven** | Colour/border transitions only. Values in §4.2 and §6.7. |

**There is no scroll-driven behaviour on this page.** No `IntersectionObserver`, no `position: sticky`, no scroll-linked animation. The only two `position: fixed` elements are the header (`z-index: 400`) and the footer bar (`z-index: 1`), both permanently pinned. Sections are anchor-linked only, offset by `.anchor:before { height: 61px; margin-top: -61px }` to clear the 60px header.

**Z-index map:** modal content `900` › modal backdrop `899` › `.modal` `700` › `.site-header` `400` › `.dropdown-menu` `100` › `.wiki-overlay` `1` = `.wiki-footer` `1`.

---

## 9. Responsive behaviour

This URL serves the **desktop bundle only** (`data-is-mobile="false"`). A separate mobile bundle exists server-side and was not served; its rules are therefore **unavailable** and must not be guessed.

Media queries present across the three loaded stylesheets:

| Query | Count | Relevance to this page |
|---|---|---|
| `screen and (min-width: 700px) and (max-width: 1200px)` | 22 | **the only layout breakpoint** |
| `(-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 1.5dppx)` | 36 | 2× sprite swaps only — no sprite is visible here |
| `print` | 1 | wiki.css |
| `(max-width: 960px)` / `(max-width: 320px)` | 1 each | `.privacy-banner` only — not on this page |

### 9.1 Rules that change at 700–1200px (page-relevant only)

```css
body        { min-width: 960px; }
.container  { width: 960px; padding: 0 8px; }
.col        { margin-right: 16px; }
.col-2      { width: 144px; }
.col-12     { width: 944px; margin-right: 0; }
.site-header{ min-width: 960px; }
.hdr-links  { width: 322px; margin-right: 32px; }   /* overridden to auto by .hdr-big .hdr-links */
.hdr-link   { margin-right: 42px; }                 /* overridden to 0 by .hdr-links.has-navbar-icon .hdr-link */
.hdr-link:last-child { margin: 0; }
.hdr-big .hdr-logo  { margin-right: 32px; }         /* .hdr-logo not used on this page */
.hdr-big .hdr-link  { margin-right: 32px; }
.hdr-big .hdr-link a{ letter-spacing: 0.1em; }      /* overridden to normal by the has-navbar-icon rule */
.wiki-problem .question-container { padding-right: 16px; margin-right: 224px; }
.wiki-problem .answer-container   { width: 224px; }
.wiki-problem img { max-width: 384px; }
```

**Net effect at 700–1200px:** the shell narrows to 960px (content 944px), but `.col.wiki-main-column`'s `max-width: 800px` is unchanged, so the article column stays 800px. The only real change inside the article is the Try-It-Yourself widget: answer column 276px → **224px**, question `margin-right` 276px → **224px**, `padding-right` 24px → **16px**.

**Below 700px:** nothing. `body { min-width: 960px }` still applies (the 700px floor means the narrower rule stops matching, reverting `min-width` to `1200px`), so the page simply overflows horizontally and the user pans. There is no mobile layout in what is served here.

### 9.2 Print stylesheet (wiki.css)

```css
@media print {
  body.wiki-page { padding-top: 0; font-size: 20px; }
  body.wiki-page #header,
  body.wiki-page #loggedout-wiki-footer,
  body.wiki-page #wiki-sidebar,
  body.wiki-page .wiki-top-editors,
  body.wiki-page .edit-summary,
  body.wiki-page .edit-section { display: none; }
}
```

---

## 10. Mapping to the project's existing tokens

Only existing tokens from `src/app/globals.css` — define no new ones.

| Original value | Where | Project token |
|---|---|---|
| `#fff` page background | `body.wiki-page` | `bg-b-white` |
| `#000` (nav hover, Log-in border hover, active bar) | header | `text-b-ink` / `border-b-ink` |
| `#29cc57` | Sign-up button, footer `.cta-link` | `bg-b-green` / `text-b-green` / `border-b-green` |
| `#15b441` | hover of both of the above | **no token** — use an arbitrary value `[#15b441]` |
| `#333` footer bar background | `.wiki-footer` | **no token** — arbitrary `[#333]` |
| `#666666` nav link idle | header | **no token** — arbitrary `[#666]` |
| `#cccccc` Log-in border, nav hover bar | header | **no token** — arbitrary `[#ccc]` |
| `#161616` body text, `h4` | global | **no token** — arbitrary `[#161616]` |
| `#333` heading colour (`h1`–`h6`) | global | arbitrary `[#333]` |
| `#456DFF` link colour / TOC hover | `body.wiki-page a` | **no token** — arbitrary `[#456DFF]` |
| `#1245ff` link hover | `body.wiki-page a:hover` | arbitrary `[#1245ff]` |
| `#777` TOC link colour | `.wiki-toc li a` | arbitrary `[#777]` |
| `#919191` callout labels | `.definition:before` etc. | arbitrary `[#919191]` |
| `#f7f7f7` blockquote background | `.wiki-content blockquote` | arbitrary `[#f7f7f7]` |
| `#f3f3f3` TOC left rule, 1px halo | `.wiki-toc`, `box-shadow` | arbitrary `[#f3f3f3]` |
| `#d4d4d4` blockquote/card border | `blockquote`, `.wiki-problem` | arbitrary `[#d4d4d4]` |
| `#333` / `#262626` table borders | `table.table` | arbitrary |
| `rgba(0,0,0,0.1)` header shadow | `.refreshed-navbar` | matches `border-b-line` colour value |
| CoFo Brilliant | body, UI, `h4` | `font-b-sans` |
| CoFo Robert 500 | `h1` 34px, `h2` 24px | `font-b-serif` |

**Do not apply `.b-physical` / `.b-press` anywhere on this page.** The original wiki chrome uses 1px hairline borders plus a flat `0 0 0 1px` halo, and a soft `0 0 15px rgba(0,0,0,.1)` header shadow — not the hard 4px bottom edge.

Container note: neither `.b-shell` (1296px) nor `.b-shell-narrow` (1216px) equals the original's `.container` (**1200px incl. 12px side padding**). The article column is a plain `max-width: 800px; margin-inline: auto`.

---

## 11. Build checklist

1. Fixed 60px header — wordmark (downloaded SVG, `height: 24`), Home + Courses with the two inline SVGs, Log in + Sign up pills right-aligned (Sign up furthest right).
2. `padding-top: 60px; padding-bottom: 80px` on the page root.
3. 1200px outer container; 800px centred article column with `padding: 24px 0`.
4. `h1` in CoFo Robert 500 / 34px, `#333`, `margin-bottom: 8px` on its wrapping `<header>`.
5. Lede paragraphs + `blockquote.definition` with the "DEFINITION" pseudo-label.
6. 376px TOC block with the 3px `#f3f3f3` left rule, bulleted, 14px, `#777` links.
7. Eight `h2` sections (CoFo Robert 500 / 24px), each an anchor target with the 61px scroll offset, `margin-bottom: 40px` per section.
8. Properties table inside `overflow-x: auto`, 1px `#333` cell borders, 8px cell padding, first row **not** bold.
9. `blockquote.example` callouts with the "EXAMPLE" label and an `<hr>` between problem and solution.
10. One Try-It-Yourself card with the "TRY IT YOURSELF" label, 276px right answer column, "Reveal the answer" button, hidden solution `The correct answer is: 4096`.
11. See Also bulleted link list.
12. Self-citation line at 12px with the JS-generated local timestamp.
13. Fixed `#333` bottom bar with the archive notice.
14. **Nothing else.** No sidebar, no related courses, no contributor byline, no site footer, no newsletter, no share buttons, no breadcrumbs, no search.

---

## 12. UNAVAILABLE / NOT EXTRACTED

Everything in this list must render as **nothing**. Do not substitute.

1. ~~Brilliant wordmark~~ — **resolved during this capture.** Downloaded to `public/assets/original/brilliant/brilliant.org/site_media/version-0/images/brilliant-wordmark-black.svg` (1,997 B, 114×27). A `currentColor` variant also exists at `.../inline-svg/brilliant-wordmark.svg`. Nothing is missing here.
2. **`.css-sprite-index` and `.css-sprite-signup-modal` sprite images** — these classes have **no CSS declaration** in any of the three loaded stylesheets, so neither the sprite URL nor the background-position is knowable from this page. *Original asset unavailable.* The spans render as empty zero-size elements — reproduce them as nothing.
3. **`.css-sprite-chevrons` chevron glyph** — the sprite PNG URL is known (`/site_media/sprite-578ac9c4513/build/sprites/css-sprite-chevrons.png`, 2× at 98×71.5) but its `background-position` for `.skill-heading .chevron` is never declared, and the element is `display: none` on desktop regardless. Render nothing.
4. **Mobile layout** — the mobile CSS/JS bundle is served only to `data-is-mobile="true"` clients and was not retrieved. *Original stylesheet unavailable.* Below 700px, reproduce the desktop layout with horizontal overflow exactly as the original does; do not invent a responsive redesign.
5. **Signup-modal visual design** (`#signup-modal-generic`, `#signup-modal-wiki`) — copy and DOM captured (§6.8), but every layout/colour class on them is undeclared in the loaded CSS. *Original component styling unavailable.* Omit, or render hidden with only `.modal`'s documented box.
6. **`.wiki-header .pull-right`** — empty `<div>` in the markup (on logged-in/editor views it holds edit buttons). Renders nothing here.
7. **`#system-msgs`, `#post-header`, `#default-ajax-error`, `#fb-root`** — empty containers. Render nothing.
8. **`.wiki-overlay`** — `display: none`, never toggled by any controller present on this page. Render nothing.
9. **`.wiki-sidebar`, `.wiki-recommended-courses`, `.wiki-quizzes`, `.wiki-relevant`, `.wiki-staff-menu`, `.edit-section-container`, `.summary-text-editor`, `.empty-wiki-container`, `.stub-container`, `.disputed-container`, `.cleanup-container`, `#outdated-wiki-modal`** — styled in `wiki.css` but **no corresponding markup is emitted** for a logged-out reader. Do not build any of them.
10. **Site footer (`#footer`)** — does not exist on this page. This is why the CTA bar never lifts (§8.4).
11. **KaTeX rendering** — the project has **no `katex` dependency** in `package.json`. The original renders all math client-side with KaTeX (+ mhchem for `\ce{[H+]}`). Either add `katex` and its CSS/fonts, or render the LaTeX source as literal text exactly as it appears in the HTML. **Do not paraphrase, simplify, or re-typeset any formula by hand.**
12. **Screenshots / rendered pixel measurements** — this capture was `curl`-only (a browser instance is shared with other agents). Every number in this spec is a *declared* CSS value read from the shipped stylesheets, not a measured computed value. No visual reference image was produced.
13. **Hover/active states not declared in CSS** — none were inferred. Only the transitions listed in §4.2, §5.6 and §6.7 exist.
