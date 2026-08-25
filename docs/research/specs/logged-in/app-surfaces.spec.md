# Authenticated app surfaces — /home/, /you/, /courses/

**Measured:** 2026-08-25, authenticated, viewport **1470 × 776**, `html[data-theme="dark"]`
**Status:** ✅ built. Every value below came from `getComputedStyle()` or the live DOM.
Where a value was first guessed and later corrected, the correction is noted.

Routes in this repo (the pre-existing logged-out `/brilliant/courses` is untouched):

| Source | Clone |
|---|---|
| `brilliant.org/home/` | `/brilliant/app/home` |
| `brilliant.org/you/` | `/brilliant/app/you` |
| `brilliant.org/courses/` | `/brilliant/app/courses` |

---

## Design tokens — dark arm

Panda's `:root` returns the **light** theme; these were read from an element inside
`html[data-theme="dark"]`, which is the only way to get the right values.

| Token | Value |
|---|---|
| `bg.primary` | `#141414` |
| `bg.elevated` / `bg.secondary` | `#1E1E1E` |
| `bg.tertiary` | `rgba(255,255,255,0.2)` |
| `border.primary` | `rgba(255,255,255,0.2)` |
| `border.secondary` | `rgba(255,255,255,0.05)` |
| `text.primary` | `#FFFFFF` |
| `text.secondary` | `rgba(255,255,255,0.6)` |
| `text.disabled` | `rgba(255,255,255,0.2)` |
| `green.500` / `border.green.bold` | `#29CC57` |
| `pear.500` / `border.pear.bold` | `#D8E82E` |
| `purple.500` / `purple.600` | `#9D62FF` / `#874DE5` |

Measured, not tokenised: chart bar `#456DFF`, summary gradient `#004E16 → #001F09`,
resilience chip `#004E16`/`#5ED981`, initiative chip `#5A2EA3`/`#B689FF`, active course
thumbnail `#170B29` on `#7139CC`, card border `#4C4C4C`.

---

## Shared app header

- 1470 × **65px**, `padding: 0 32px`, `background: #1E1E1E`, bottom border
  `rgba(255,255,255,0.2)`, `box-shadow: 0 0 15px 0 rgba(0,0,0,0.1)`, `sticky`, **z-999**
- Inner row: `max-width: 1216px`, height 64, `space-between`, `gap: 24px`
- Nav links `gap: 32px`; inactive `rgba(255,255,255,0.6)`, active full white + underline
- Icons ship on inconsistent viewBoxes (16 / 17 / 24) — preserved rather than normalised

**"Gift Premium" is a gradient border, not a gradient fill:**

```css
background-image: linear-gradient(#141414, #141414),
                  linear-gradient(86deg, #7491FF 0%, #FF90E0 50%, #F9D25C 100%);
background-clip: padding-box, border-box;
background-origin: border-box, border-box;
border: 2px solid transparent;
border-radius: 9999px;
```

The flat layer fills the padding box; the gradient survives only in the 2px ring.

**Streak bolt** — 19 × 25 viewBox, three custom properties keyed off `data-completed`:
`false` → fill `bg.primary`, stroke `border.primary`, width 2; `true` → fill `pear.500`,
no stroke.

---

## /home/

- Content block **992px** wide: sticky rail **384px** + **52px** gap + column **556px**
- Rail: `position: sticky; top: 105px; z-index: 10`, `gap: 20px`, `margin-top: 40px`,
  `padding-bottom: 28px`; hidden below `lg` (338px wide at `lg`, 384 at `2xl`)

**Ask bar** — a `<button>`, not an input: `h 52`, `radius full`,
`border 2px rgba(255,255,255,0.2)`, `padding: 4px 4px 4px 16px`, lucide-search at 16px in
`rgba(255,255,255,0.6)`, placeholder 14/21 at 40% white, "Ask" chip on `rgba(255,255,255,0.05)`.

**Streak card** — `radius 16`, `border 2px #4C4C4C`, `padding 24`, `gap 8`.
Counter `48px/700/60px`. Day slots 48 × 88, `gap 8`, pitch 71px; the bolt is a 32-viewBox
glyph at 48px inside a 30px ring (`stroke text.primary @ .2`, 1.5px), filled `bg.tertiary`
when unearned. "Streak Charges" is **visually hidden text** beside two battery glyphs.

**Leagues card** — `radius 20`, `border 2px #4C4C4C`, `padding 20`, 64px badge with
`margin-right: 16`. "UNLOCK LEAGUES" is `text-transform: uppercase` over the cased source
string — a DOM search for the uppercase literal finds nothing.

**Card deck** — a genuine 3D stack. An ancestor carries `perspective: 1200px`; each card
behind the front is one further `translateZ(-100px)`:

| depth | measured box | scale |
|---|---|---|
| 0 | 675,155,556,540 | 1 |
| 1 | 734,176,513,498 | 0.9231 = 1200/1300 |
| 2 | 777,194,477,463 | 0.8571 = 1200/1400 |
| 3 | 807,209,445,432 | 0.8 = 1200/1500 |
| 4 | 828,223,417,405 | 0.75 = 1200/1600 |

Border drops to `rgba(255,255,255,0.05)` from depth 2 back. The clone reproduces this with
`translate + scale` from the measured ratios so it holds at any width.

**Card interior** — `bg #1E1E1E`, `radius 16`, `padding-top 20`, body `padding 20`,
`justify-content: space-between`. Title `24/700/30`, level label
`12/700/18, ls .48, uppercase, #7139CC`, art **150 × 150** (its `<a>` is
`display: contents`, which is why a naive extractor skips it).

**Pedestals are inline SVG, not Rive** — 64 × 62. Active carries a `#9D62FF` glow gradient,
a `feGaussianBlur` (stdDeviation 1.533) highlight and the green `#29CC57` marker; locked has
neither, plus a `#000 @ .4` ring.

**Start button** — `button3d` in `#9D62FF` over a `#874DE5` lip, with a **shimmer**: a
150 × 56 blade, `animation: shimmer 6400ms cubic-bezier(.16,1,.7,1) infinite`, gradient stops
`0.27 #F5EFFF → 0.71 white/0` and `0.081302 #F5EFFF → 0.570844 white/0`.

```css
@keyframes shimmer {
  0%   { opacity: 1; left: -100%; }
  25%  { opacity: 1; left: 100%; }
  26%  { opacity: 0; }
  100% { opacity: 0; left: 100%; }
}
```

**Thumbnail switcher** — five 84 × 60 tiles, `gap 16`, `radius 8`, `transition .2s`;
active `#170B29` on `#7139CC`, inactive `#141414` on `rgba(255,255,255,0.2)`; 40px art.

---

## /you/

Shell: 1216px box, inner `gap: 32px; padding: 32px`, sections at `gap: 48px` in a 1152 column.
`h1 "Your progress"` is visually hidden.

**Period header** — paginator `gap 4` with two 44px arrows (both `data-disabled` on the
current week) around a `rgba(255,255,255,0.6)` label; segmented control
`role="radiogroup"`, `bg #1E1E1E`, `radius full`, `padding 4`, `gap 4`; the checked pill is
`bg #141414` + `box-shadow 0 0 15px 0 rgba(0,0,0,.1)`, unchecked `rgba(255,255,255,0.4)`,
`transition: background-color/box-shadow/color .15s ease-out`.

**Weekly summary** — `padding 36`, `radius 20`, `border 2px rgba(255,255,255,0.2)`,
`background-image: linear-gradient(#004E16 0%, #001F09 100%)`, `min-height 176`.
Title `24/700/30`, date `14/21 @ 60%`, bullets in a `<ul>` with `padding-left: 24`.
Koji is `koji-weekly-summary.svg`, absolutely placed at `top: 98px; left: -2px`, drawn with
`transform: matrix(-0.978473, -0.206375, -0.206375, 0.978473, 0, 0)` — a **reflection**, so
it must be copied verbatim, not re-expressed as a rotation.

**Stat tiles** — two, `flex 1`, `min-height 107`, `padding 16px 24px`, `radius 20`,
`border 2px rgba(255,255,255,0.2)`; label `14/21 @ 60%` with a 12px info button at 30% white;
value `30/700/37.5`.

**Problems-solved chart** — plain DOM, no chart library. Card `radius 20`, inner
`padding 24px 32px`, `gap 32`. Plot height **161px**, five gridlines
(`border-top rgba(255,255,255,0.05)`), y ticks 0–8 at 40.25px per 2 units, seven flex columns,
bars **56px wide**, `radius 4px 4px 0 0`, `#456DFF`.
**A zero value still paints a 2px stub** — easy to get wrong by rendering nothing.
The same data is repeated in a visually-hidden `<table>`.

Live data: Aug 19–25 2026 → `[0, 0, 4, 0, 0, 0, 2]` (Wed…Tue).

**Strengths** — `grid-template-columns: 568px 568px`, `gap 16`; card `padding 36`,
`radius 16`, `gap 20`; 48px chip circle — Resilience `#004E16`/`#5ED981` with lucide-arrow-up,
Initiative `#5A2EA3`/`#B689FF` with lucide-message-circle.

---

## /courses/

Page height **7816px**: 13 learning paths — 2 starred ("Your learning paths") and 11 under
"Other learning paths". 80 unique images; 78 downloaded (see below).

**Path header** — `padding: 24px 0 24px 24px`, row `gap: 40px`, category art **80 × 80**;
text column `max-width: 580px`, `gap 8`; right group `gap 12`, star button 44px on `#1E1E1E`.

**Carousel** — slab `bg #1E1E1E`, `radius 12`, `margin-top 12`, `padding: 74px 0 40px`.
Track is `display: flex` moved by **`transform`**, not native scroll. Slides
`width 182.703 + margin-right 16` → **198.703px pitch**. A 64px end mask
`linear-gradient(90deg, #1E1E1E 0%, rgba(248,248,248,0) 103.85%)` sits over each edge with a
48px `rgba(255,255,255,0.1)` arrow button on top.

**Course tile** — 176 × 176 art card, `padding 39.98`, `radius 20`, `border 2px #4C4C4C`,
and the site's 3D lift: `translateY(-4px)` + `box-shadow 0 4px 0 0 #4C4C4C`,
`transition: transform .1s ease-out, box-shadow .1s ease-out, border-color .2s, background-color .2s`.
Art 92 × 92. The age badge (`ALL AGES`, `GRADES 4–7`, …) appears **only on the first tile of a
row**, pinned at `top/left: 12px`, `12/700/13.2, ls .48, uppercase, 40% white`.
Started courses carry a 140 × 4 progress track, `rgba(255,255,255,0.2)`, `radius full`.

---

## Assets downloaded (205 files total under `public/assets/original/brilliant/`)

- 13 category images → `ds055uzetaobb.cloudfront.net/category-images/`
- 65 course/chapter images → `ds055uzetaobb.cloudfront.net/brioche/chapter/`
  (fetched at `?width=204`; `creative-coding-dsGE0e.png` 502'd on that path and was taken
  from the un-transformed `/chapter/` original instead)
- `brilliant.org/images/learnerDashboard/koji-weekly-summary.svg`
- `brilliant.org/images/loggedInHomepage/leagues-locked.svg`
- `brioche/uploads/lessons/scene-setter-final-FtktQS.png`

## Known gaps

- Responsive behaviour at 768 / 390 not captured for any of the three surfaces.
- `/courses/` course-tile progress percentages are approximations of the rendered bar width;
  the exact per-course values were not read out.
- The `Start over` icon in the lesson player remains hand-drawn (flagged in `icons.tsx`).
- Hover/active states were captured only where CSS rules exposed them.
