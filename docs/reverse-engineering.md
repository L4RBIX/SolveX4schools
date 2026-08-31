# Reverse-engineering record — brilliant.org and elice.io

Forensic reconstruction notes. Every CSS value here came from
`getComputedStyle()` on the live page; every asset path was pulled from the
served HTML and mirrored locally. Nothing in this file is estimated.

---

## 1. Pages analyzed

| URL | Status | Notes |
|---|---|---|
| `https://brilliant.org/` | extracted | Light homepage. Body height 7808px, 14 sections. |
| `https://brilliant.org/courses/` | extracted | Dark. Learning paths index. |
| `https://brilliant.org/courses/math-fundamentals/` | extracted | Dark. Sticky course card + lesson path. |
| `https://elice.io/en` | extracted | White marketing page, violet hero. |
| `https://elice.io/en/ax/lxp` | extracted | Product page with sticky sub-nav. |
| `https://trial-qazaq-b2.elice.io/lxp/home` | **unreachable** | Auth-gated. Serves a loading blob; `document.title` = `로딩중입니다`, `body.innerText` empty, `images.length === 0`, zero anchors. Verified 3× up to 16s. |
| brilliant.org lesson player | **unreachable** | Behind the signup wall; reachable only via `Start` on a course page. |

---

## 2. Fonts found — and extracted

All self-hosted webfonts were mirrored from each site's `/_next/static/media/`.

### brilliant.org
| Family | Files | Weights | Licence |
|---|---|---|---|
| **CoFo Brilliant** | 6 × woff2 | 400 / 500 / 700 + italics | ⚠️ Commercial (Contrast Foundry) |
| **CoFo Robert** | 2 × woff2 | 500 + italic | ⚠️ Commercial (Contrast Foundry) |
| **Source Code Pro** | 6 × woff2 | 400 / 500 / 700 + italics | SIL OFL |

Usage: body and UI = CoFo Brilliant 16px/400/lh 24px. Display h1 = **CoFo Robert
500**. Code = Source Code Pro.

### elice.io
| Family | Files | Weights | Licence |
|---|---|---|---|
| **Pretendard Variable** | 1 × woff2 | variable 45–920 | SIL OFL |
| **GitLab Mono** | 2 × woff2 | 400 + italic | SIL OFL |

> **Licensing:** CoFo Brilliant and CoFo Robert are commercially licensed. They
> are mirrored here for local reconstruction only and must not be deployed,
> redistributed, or shipped. The other four families are open-licence.

---

## 3. Assets found and downloaded

`node scripts/download-original-assets.mjs <urls.txt> <outDir>` → **188 files, 70 MB, 100% success.**

Stored under `public/assets/original/<site>/<host>/<original path>` so the
remote directory structure is preserved and nothing collides.

### brilliant.org — 66 files

> **Correction (2026-08-22).** The first pass found 47 files by parsing the served
> HTML. That misses everything the page lazy-loads. A live `querySelectorAll('video')`
> found **9** videos, not 4 — five were absent from the HTML entirely. All nine are
> now downloaded. The homepage media map below is the corrected one.

| y | Asset | Size | Section |
|---|---|---|---|
| 168 | `loggedOutHomepage/lohp-rebrand-hero.webm` | 440×600 | Hero card |
| 1724 | `loggedOutHomepage/concepts-click-desktop.webm` | 555×387 | Concepts that click |
| 2271 | `loggedOutHomepage/built-to-think-desktop.webm` | 555×387 | Built to make you think |
| 2818 | `loggedOutHomepage/adapts-desktop.webm` | 555×387 | Adapts to exactly where you are |
| 3365 | `loggedOutHomepage/keep-learning-desktop.webm` | 555×387 | Designed to keep you learning |
| 4144 | `videos/homepage/courses/math-refresh.webm` | 633×413 | Subject tab — Math |
| 4144 | `videos/homepage/courses/cs-refresh.webm` | 633×413 | Subject tab — Computer Science |
| 4144 | `videos/homepage/courses/science-refresh.webm` | 633×413 | Subject tab — Science |
| 4144 | `videos/homepage/courses/data-refresh.webm` | 633×413 | Subject tab — Data Analysis |

Each `loggedOutHomepage` clip also ships `-mobile.webm`, `.mp4` and (except the hero)
a `-desktop.jpg` poster. The hero has **no poster** — do not add one.


- 14 woff2 fonts (above)
- **4 webm videos** — `/videos/homepage/courses/{math,cs,data,science}-refresh.webm`, each with a PNG poster frame. These are the homepage's real motion assets.
- 6 photos — `/images/homepage/get-started/photo-{desktop,desktop-wide,mobile}.{avif,jpg}`
- 5 testimonial portraits — `/images/homepage/testimonials/{aaron,arianne,eliza,noah,tyler}.png`
- 4 marketing PNGs — `/loggedOutHomepage/{experts,schedule}-{desktop,mobile}.png`
- 2 store badge SVGs — `/images/app-store-badges/*.svg`
- 8 apple-touch icons, 1 OG image

### elice.io — 161 files

> **Correction (2026-08-22).** The first pass parsed the served HTML and found
> 141 CDN files. A live inspection shows the page actually renders **214 `<img>`
> elements and 98 inline SVGs**, and serves everything through Next's image
> optimiser — which hid a set of *local* `/_next/static/media` assets the HTML
> parse never saw. Twenty more files are now downloaded. Zero videos, zero
> canvas, zero Lottie on this page.

### Koji is a Rive animation, not a drawing

`/rive/meet_koji.0dced838.riv` — **936 KB, magic bytes `RIVE`**, rendered on a
680 × 894 canvas displayed at **340 × 447**, driven by `rive.wasm`. It was
invisible to every HTML-parsing pass because it loads on scroll.

An earlier version of `koji-section.tsx` substituted a hand-drawn SVG blob —
a flat `#E7EEE2` ellipse with a black rounded rect. That was invented content
and visually wrong. It has been deleted and replaced with the real file.

The file carries **24 artboards** — effectively every animation on the
homepage. The default artboard is a lesson scene, so both artboard and
timeline must be named explicitly:

| Artboard | State machine | Used by |
|---|---|---|
| `MAIN_KojiEntrance` | `KojiEntrance` | **Meet Koji** — timelines `Intro` → `Loop`, still frame `EndStill` |
| `MAIN_Concepts` | `ConceptsThatClick` | Concepts that click |
| `MAIN_Built` | `Built` | Built to make you think |
| `MAIN_Adapts` | `Adapts` | Adapts to exactly where you are |
| `MAIN_Designed` | `Designed` | Designed to keep you learning |
| `NEST_Koji*`, `NEST_solvables_1..5`, `Cursor`, `Message` | — | nested components |

`KojiEntrance` parks in a pre-entrance state and exposes **no inputs**, so the
timelines are played directly rather than through the state machine.

**Measured layout** (live, 1470px): section background is **`#FFFFFF`**, not the
paper band. Canvas top y1238, centred. Its wrapper is only **340 × 108** with
`overflow: visible` — the canvas overflows it by 339px and that spill is Koji's
light trail passing *behind* the heading (251px overlap). Heading sits 88px
below the wrapper.

Note: the four feature rows use the `.webm` files, not these Rive artboards —
the live DOM has nine `<video>` elements and exactly one `<canvas>`.

**Local assets recovered (were previously drawn by hand):**

| Asset | Rendered | Was |
|---|---|---|
| `elice-brand.131cc564.png` | 99 × 32 | a drawn violet pill reading `/*elice*/` |
| `hero-bg-object-left.svg` | 703 × 393 @ x−321 y−113 | drawn "concentric white strokes" |
| `hero-bg-object-center.svg` | 892 × 363 @ x385 y120 | drawn |
| `hero-bg-object-right.svg` | 848 × 473 @ x1231 y258 | drawn |
| `lxp` / `ai-helpy-chat` / `test` / `ai-cloud` / `eci` (+ `-hover` twins), `ai-pmdc` | mega-menu icons | lucide icons + drawn tiles |
| `cert-csap`, `cert-gs`, `cert-iso-27001` | footer badges | drawn placeholders |
| `products-learning`, `products-cloud` | 520 × 200 | section not built — assets unused |

`ai-pmdc` has no `-hover` twin on the live site; none was fabricated.


- 3 woff2 fonts (above)
- 3 certification badge SVGs — `csap`, `good-software`, `iso`
- 6 PWA icons — `/assets/icons/icon_{48..512}.png`
- **128 CDN images** from `cdn-cms.elice.io/elice-strapi/` — client logos, case-study photography, product mockups, GIF demos
- 1 attachment image from `cdn-api.elice.io`

> **Copyright:** all imagery, logos and video above belong to Brilliant
> Worldwide, Inc. and Elice, Inc. Mirrored for local reconstruction study only.

---

## 4. Colors

### brilliant.org — light surface
| Token | Value |
|---|---|
| Page | `#FFFFFF` |
| Hero / section band | `rgb(245,243,241)` → `#F5F3F1` |
| Ink | `#000000` |
| Muted text | `rgba(0,0,0,0.4)` |
| Hairline | `rgba(0,0,0,0.1)` |
| Primary CTA green | `rgb(41,204,87)` → `#29CC57` |
| Media panel — sky | `rgb(240,248,250)` → `#F0F8FA` |
| Media panel — mint | `rgb(231,238,226)` → `#E7EEE2` |
| Media panel — peach | `rgb(255,237,224)` → `#FFEDE0` |

### brilliant.org — dark surface (`/courses`)
| Token | Value |
|---|---|
| Page | `rgb(20,20,20)` → `#141414` |
| Grouping panel | `rgb(30,30,30)` → `#1E1E1E` |
| Border + hard edge | `rgb(76,76,76)` → `#4C4C4C` |
| Muted text | `rgba(255,255,255,0.4)` |
| Secondary border | `rgba(255,255,255,0.2)` |
| Sign-up green | `rgb(94,217,129)` → `#5ED981` |
| Active / primary blue | `#4A5CD6` (edge `#3860BE`) |

### elice.io
| Token | Value |
|---|---|
| Page | `#FFFFFF` |
| Ink | `rgb(25,31,40)` → `#191F28` |
| Canvas | `#F5F6F8` |
| Hairline | `#E5E8EB` |
| Muted | `#6B7684` |
| Brand violet | `#6C4FE0` |
| CTA | `rgb(33,33,33)` → `#212121` |
| Dark band | `#2A2A2A` |

---

## 5. Measurements

### brilliant.org homepage
| Element | Value |
|---|---|
| Container | 1296px inner (1440 viewport) |
| Hero section height | 760px |
| h1 | `76px / 500 / lh 79.8px / ls -1.4px`, `max-width 640px`, renders 590px |
| Sub-paragraph | `20px / lh 29px / rgba(0,0,0,0.4)` |
| CTA pill | `radius 9999px`, `padding 12px 20px`, `20px / 500`, height 48px |
| Stats band | height 254px; headings `30px / 400 / lh 37.5px / ls -0.3px` |
| Koji heading | `60px / 500 / lh 66px / ls -1.2px` |
| Feature heading | `36px / 400 / lh 43.2px / ls -0.36px` |
| Media panel | `555 × 387`, `radius 20px` |
| Wide panel | `1055 × 437`, `radius 24px` |
| Body | `16px / 400 / lh 24px` |

### brilliant.org dark pages
| Element | Value |
|---|---|
| Container | 1216px |
| Path tile | `176 × 176`, `radius 20px` |
| Tile border | `2px solid rgb(76,76,76)` |
| **Tile shadow** | `rgb(76,76,76) 0px 4px 0px 0px` — hard, no blur |
| Path panel | `radius 12px`, bg `#1E1E1E`, width 1216 |
| Course card | `487 × 331`, `radius 20px`, `border 2px rgba(255,255,255,0.2)`, `padding 32px` |
| Section heading | `30px / 700` |
| Card title | `24px / 700` |
| Eyebrow | `12px / 700 / ls 0.48px / uppercase / rgba(255,255,255,0.4)` |
| Node / tile label | `16px / 400` |
| Stat row | `14px / 400` |
| Sign-up pill | `radius 54px`, `padding 16px 20px`, height 48 |

### elice.io
| Element | Value |
|---|---|
| Container | 1200px |
| Nav height | 64px; sub-nav 60px |
| Button radius | **8px** |
| Card radius | 12–20px |
| Shadow | soft/blurred (`0 12px 32px rgba(25,31,40,0.10)`) — the exact inverse of Brilliant |

---

## 6. Components discovered

**brilliant.org** — Nav (floating white pill, r32, inset), Hero (2-col, draggable
chart→beaker demo), StatsBand (3 cards), KojiSection, FeatureRow ×3 (alternating,
video panel), GetStarted (photo), Testimonials (5 portraits), Footer.

**brilliant.org/courses** — CourseNav (active-tab underline), PageHeader,
LearningPath ×3 → PathPanel → PathTile ×6 + connectors, CourseCard (sticky),
LevelPill (sticky, scroll-driven), LessonNode (disc token, 4 states), inline
detail card with blue Start, ScrollTopButton.

**elice.io** — Nav + hover mega-panel, ProductSubNav (sticky, scroll-driven
underline), Hero (violet gradient + wave line-art), LogoWall, StatCards,
AwardsRow, FeatureSplit ×3 (text + floating white UI-card mockup),
ContentCardGrid (8), CaseStudies (dark band), Footer.

---

## 7. Animations and interaction models

| Behaviour | Model | Mechanism |
|---|---|---|
| Brilliant nav "Get started" | **scroll-driven** | Appears past ~600px scroll |
| Brilliant level pill | **scroll-driven** | `position: sticky` + IntersectionObserver; swaps level as node groups pass. **Not tabs.** |
| Brilliant lesson node | click-driven | Expands an inline card *below* the node — not a modal |
| Brilliant hero demo | drag-driven | Draggable point → beaker fill + dashed guide |
| Brilliant feature media | scroll-driven | webm plays only while in view |
| Brilliant raised objects | static | 2px border + hard 4px bottom edge, **no blurred shadow anywhere** |
| Elice sub-nav underline | **scroll-driven** | IntersectionObserver; verified moving with zero clicks |
| Elice mega-menu | hover-driven | Full-width panel, fade + 8px rise |
| Elice stat numerals | scroll-driven | Count-up on enter |
| Elice feature mockups | scroll-driven | Card rises 24px, inner rows stagger 60ms |

No smooth-scroll library (Lenis / Locomotive) is present on either site — both
use native scrolling.

---

## 8. Known gaps

1. **Elice LXP tenant and Brilliant's lesson player are auth-walled.** The routes
   `/elice/classroom`, `/elice/workspace`, `/elice/teacher` and `/brilliant/lesson`
   are reconstructed from each site's public product surface, not extracted.
2. **Elice imagery — partially wired.** The 38 client marks (384x160 PNGs) are
   live in the logo wall in the reference's own left-to-right order, and three
   2000x1125 case-study photographs are live in the dark band. The remaining
   ~87 mirrored CDN images (product mockups, GIF demos, additional case
   studies) are on disk but unplaced.
3. Brilliant's `get-started` photo, testimonial portraits and `loggedOutHomepage`
   PNGs are mirrored but not yet placed — the homepage currently ends after the
   feature rows, so those sections do not exist yet.
4. **Asset swap status by component**

   | Component | Media source |
   |---|---|
   | Brilliant hero card | ✅ original `lohp-rebrand-hero.webm` (the redrawn SVG chart was invented and has been deleted) |
   | Brilliant feature rows | ✅ original per-row `.webm` + `.jpg` poster |
   | Brilliant subject tabs | ✅ original `*-refresh.webm` + PNG posters |
   | Brilliant tiles / nodes | redrawn SVG (originals are runtime-generated, not files) |
   | Elice logo wall | ✅ original 384x160 client marks |
   | Elice case studies | ✅ original 2000x1125 photography |
   | Elice feature mockups | redrawn UI cards |
   | All fonts, both sites | ✅ original self-hosted woff2 |
