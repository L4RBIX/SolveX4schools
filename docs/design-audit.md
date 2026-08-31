# Design audit — brilliant.org and elice.io

Per-page measurements. Every value is from `getComputedStyle()` on the live
page or from the site's own served CSS. Nothing here is estimated; anything
that could not be measured is marked **unmeasured**, not guessed.

---

# BRILLIANT.ORG

## Global

| Property | Value |
|---|---|
| `html` / `body` background | `#FFFFFF` |
| Body type | `16px / 400 / line-height 24px` |
| Body colour | `#000000` |
| Font — UI/body | **CoFo Brilliant** (self-hosted woff2, 400/500/700 + italics) |
| Font — display | **CoFo Robert** (self-hosted woff2, 500 + italic) |
| Font — code | **Source Code Pro** (self-hosted woff2, 6 cuts) |
| Document height (homepage) | 7809px |
| Smooth-scroll library | none — native scrolling |

### Colour tokens
| Role | Value |
|---|---|
| Paper / hero band | `rgb(245,243,241)` `#F5F3F1` |
| Muted text | `rgba(0,0,0,0.4)` |
| Body text in lower sections | `rgba(0,0,0,0.6)` |
| Hairline | `rgba(0,0,0,0.1)` |
| Primary green | `rgb(41,204,87)` `#29CC57` |
| Dark-surface green | `rgb(94,217,129)` `#5ED981` |
| Active blue | `#4A5CD6` (hard edge `#3860BE`) |
| Dark page | `rgb(20,20,20)` `#141414` |
| Dark panel | `rgb(30,30,30)` `#1E1E1E` |
| Dark border/edge | `rgb(76,76,76)` `#4C4C4C` |
| Dark muted | `rgba(255,255,255,0.4)` |
| Dark secondary border | `rgba(255,255,255,0.2)` |
| Pastel — sky | `rgb(240,248,250)` `#F0F8FA` |
| Pastel — mint | `rgb(231,238,226)` `#E7EEE2` |
| Pastel — peach | `rgb(255,237,224)` `#FFEDE0` |

### Shadows
Brilliant uses **no blurred shadows on product surfaces.** Every raised object is:
```
border: 2px solid <colour>;
box-shadow: <same colour> 0px 4px 0px 0px;
```
A hard 4px bottom edge, zero blur. This is the single most identifiable detail
in the system. The homepage hero card is the one exception (a soft card shadow).

### Grid / containers
| Page | Max width |
|---|---|
| Homepage | **1296px** inner (1440 viewport) |
| `/courses` and course detail | **1216px** |

---

## Homepage `/`

| Element | Measured |
|---|---|
| Hero section height | 760px |
| h1 | `76 / 500 / lh 79.8 / ls -1.4px`, max-width 640, renders 590 |
| Hero sub | `20px / lh 29px / rgba(0,0,0,0.4)`, max-width ~420 |
| CTA pill | `radius 9999px`, `padding 12px 20px`, `20 / 500`, height 48 |
| Stats band height | 254px |
| Stats heading | `30 / 400 / lh 37.5 / ls -0.3px` |
| "Meet Koji" | `60 / 500 / lh 66 / ls -1.2px` (CoFo Robert) |
| Feature heading | `36 / 400 / lh 43.2 / ls -0.36px` |
| Feature body | `16 / 400 / lh 24`, max-width 336 |
| Media panel | `555 × 387`, `radius 20px` |
| Wide panel | `1055 × 437`, `radius 24px` |
| Serif section heads (lower page) | `50 / 500` |
| Nav | fixed floating white pill, `radius 32px`, ~56px tall, ~24px side inset |

### Section order (y-offsets at 1512px)
206 hero · 979 stats · 1434 Meet Koji · 1821 Concepts that click ·
2368 Built to make you think · 2906 Adapts to exactly where you are ·
3453 Designed to keep you learning · 3938 From grade 5 to college and beyond ·
4202 Covered subjects · 4843 Always on your schedule · 5355 Built by top learning experts ·
5847 Students, parents, and teachers love us · 6774 The best tutor you'll ever have ·
7709 footer

---

## `/courses` and course detail

| Element | Measured |
|---|---|
| Container | 1216px |
| Path tile | `176 × 176`, `radius 20px`, `padding 40px` |
| Tile border | `2px solid rgb(76,76,76)` |
| Tile shadow | `rgb(76,76,76) 0px 4px 0px 0px` |
| Path panel | `radius 12px`, bg `#1E1E1E`, width 1216 |
| Course card | `487 × 331`, `radius 20px`, `border 2px rgba(255,255,255,0.2)`, `padding 32px` |
| Section heading | `30 / 700` |
| Card title | `24 / 700` |
| Eyebrow | `12 / 700 / ls 0.48px / uppercase / rgba(255,255,255,0.4)` |
| Node + tile label | `16 / 400` |
| Stat row | `14 / 400` |
| Sign-in pill | transparent, `border 2px rgba(255,255,255,0.2)`, `radius 9999`, `padding 16px 20px`, h48 |
| Sign-up pill | `#5ED981`, `radius 54px`, `padding 16px 20px`, h48, `16 / 500` |
| Start button | `#4A5CD6`, `radius 56px`, h48, `16 / 400`, edge `#3860BE` |

---

# ELICE.IO

## Global

| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Text | `rgb(25,31,40)` `#191F28` |
| Font — UI | **Pretendard Variable** (self-hosted woff2, 45–920) |
| Font — code | **GitLab Mono** (self-hosted woff2, 400 + italic) |
| Container | **1200px** |
| Nav height | 64px · product sub-nav 60px |
| Smooth-scroll library | none — native scrolling |

### Colour tokens
| Role | Value |
|---|---|
| Ink | `rgb(25,31,40)` `#191F28` (1558 occurrences — the dominant colour) |
| Canvas | `#F5F6F8` |
| Hairline | `rgb(233,235,240)` `#E9EBF0` |
| Muted | `rgb(102,113,126)` `#66717E` |
| Faint | `#8B95A1` ⚠️ still unverified |
| Brand violet | `rgb(115,83,234)` `#7353EA` |
| Secondary ink | `rgb(52,62,75)` `#343E4B` |
| Magenta accent | `rgb(184,83,234)` `#B853EA` |
| Violet soft | `#F0EDFD` |
| CTA | `rgb(33,33,33)` `#212121` (577 occurrences) |
| Dark band | `#2A2A2A` |

### Radii and shadows — the inverse of Brilliant
| Element | Value |
|---|---|
| Buttons | **8px** |
| Cards | 12–20px |
| Logo pill | fully round |
| Shadow | soft and blurred, e.g. `0 12px 32px rgba(25,31,40,0.10)` |

**No hard offset edge appears anywhere on Elice.** Mixing the two systems is the
fastest way to make either clone read as wrong.

> **Correction (2026-08-22).** Three Elice tokens were first recorded from
> eyeballing and were wrong. A frequency census of `getComputedStyle()` across
> ~3000 elements on elice.io/en gives the measured values above. The old values
> were `#E5E8EB` (hairline), `#6B7684` (muted) and `#6C4FE0` (violet) — all now
> corrected. `e-faint`, `e-grey`, `e-grey-2`, `e-violet-soft` and `e-blue` were
> also eyeballed and remain **unverified**; they need the same census.

### Mega-menu tiles — not images

The product tiles in the mega-menu are **CSS-drawn**, not assets: 40 × 40,
`border-radius: 12px`, flat `rgb(115,83,234)`, with a 20px FontAwesome glyph
(`book-open-reader`, `code`, `sparkles`, …). No `<img>` appears in the panel.

The `lxp` / `ai-helpy-chat` / `test` / `ai-cloud` / `eci` / `ai-pmdc` PNGs are
**1707–1720 × 764 product screenshots** rendered at **853 × 382**, `object-fit:
cover`, at y ≈ 2148–3000 — a homepage product showcase, with base and `-hover`
twins stacked 77px apart. They are not icons.

### Client logo wall
38 marks served at native `384 × 160` PNG, rendered greyscale at ~40% opacity.

### Case-study media
`2000 × 1125` (16:9) photography from `cdn-cms.elice.io/elice-strapi/`.

---

# Interaction models

Getting one of these wrong is a rewrite, not a CSS fix. Verified by scrolling
*before* clicking.

| Behaviour | Site | Model |
|---|---|---|
| Nav "Get started" appears | Brilliant | **scroll-driven**, threshold ~600px |
| Level indicator swaps | Brilliant | **scroll-driven** — `position: sticky` + IntersectionObserver. **Not tabs.** |
| Lesson node opens | Brilliant | click-driven — expands an inline card *below* the node, not a modal |
| Hero chart | Brilliant | drag-driven — point drives beaker fill + dashed guide |
| Feature media | Brilliant | scroll-driven — clip plays only while in view |
| Subject tabs (grade 5 section) | Brilliant | click-driven — all four panels are in the DOM at once, so a naive y-ordered read interleaves them |
| Product sub-nav underline | Elice | **scroll-driven** — verified moving with zero clicks |
| Mega-menu | Elice | hover-driven, fade + 8px rise |
| Stat numerals | Elice | scroll-driven count-up |
| Feature mockups | Elice | scroll-driven, card rise + 60ms inner stagger |

---

# Unmeasured / unavailable

- **brilliant.org lesson player** — behind the signup wall. No measurements exist.
- **trial-qazaq-b2.elice.io/lxp/home** — auth-gated; serves an empty DOM
  (`title` = `로딩중입니다`, `body.innerText` empty, `images.length === 0`, zero anchors).
  No measurements exist.
- Brilliant homepage: roles for two testimonial authors (Noah, Arianne); closing-band
  sub-copy; full footer legal string; preview-card captions for the Computer Science,
  Science and Data Analysis subject tabs (only Math's `Quadratics` was captured).
- **Resolved since first audit:** all four subject-tab course lists were re-extracted
  by clicking each tab. Section 8 is a single-column list plus an `N additional
  courses` line and a white preview card — *not* the two-column layout first recorded.
  Math has 7 courses + "26 additional courses"; Computer Science 7 + "7 additional
  courses"; Science and Data Analysis 5 each with no additional line.
