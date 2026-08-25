# Reference Analysis — Brilliant, Elice, Elice LXP

Extracted live via browser automation, 2026-08-21. Values below are from
`getComputedStyle()`, not estimated.

---

## 1. Brilliant — the dark product surface

The marketing homepage (`brilliant.org/`) is light and serif-led. The **product**
(`/courses/`, `/courses/<slug>/`) is dark. The brief asks for "dark premium
background", so the product surface is the reference that matters.

### Tokens

| Token | Value |
|---|---|
| Page background | `rgb(20,20,20)` — #141414 |
| Panel / group surface | `rgb(30,30,30)` — #1E1E1E, radius `12px` |
| Tile surface | `#141414` |
| Tile border | `2px solid rgb(76,76,76)` |
| **Tile shadow** | `rgb(76,76,76) 0 4px 0 0` — a *hard* 4px bottom edge, no blur |
| Tile size / radius | `176 × 176`, radius `20px` |
| Course card | `487 × 331`, radius `20px`, border `2px solid rgba(255,255,255,0.2)`, padding `32px` |
| Accent green (CTA) | `rgb(94,217,129)` — #5ED981, radius `54px`, padding `16px 20px`, height `48`, weight `500` |
| Accent blue (active/primary) | ~`rgb(74,92,214)` — used for the active level border, its 4px edge, and the Start button |
| Eyebrow | `12px / 700 / 0.48px tracking / uppercase / rgba(255,255,255,0.4)` |
| Section heading | `30px / 700 / white` |
| Card title | `24px / 700 / white` |
| Body + node label | `16px / 400`, muted `rgba(255,255,255,0.4)` |
| Stat row | `14px / 400 / white` with a leading icon |
| Container width | `1216px` |

**The hard 4px offset shadow is the signature.** Every tile, level pill, and
primary button carries a solid same-colour bottom edge. It reads as a physical
button and is the single most identifiable Brilliant detail.

### Structure — `/courses/`

```
Courses
├─ TopNav                      dark, wordmark, "Courses" tab w/ underline, Sign in (outline pill) + Sign up (green pill)
├─ PageHeader                  h "Learning Paths" 30/700 + sub 16/muted
└─ LearningPath  (repeated)
   ├─ PathHeader               illustration + eyebrow "GRADES 4–7" + title + description
   └─ PathPanel                #1E1E1E, radius 12
      └─ TileRow               176×176 tiles, connector line between, label under each
         └─ Tile               grade chip top-left, "NEW" green pill top-right, 3D illustration centre
```

### Structure — `/courses/<slug>/`

```
CoursePage                     two columns
├─ CourseCard (sticky, left)   illustration, title 24/700, description, stat row "27 Lessons · 375 Exercises"
└─ LessonPath (right)
   ├─ LevelPill (STICKY)       "LEVEL 1 / Visualize Fractions" — pinned; swaps content as sections scroll past
   │                           active: 2px blue border + 0 4px 0 blue.  inactive: 2px white/20 + matching edge
   ├─ LessonNode × n           3D disc token + label; locked nodes dimmed to white/40
   └─ LevelCheck               a differently-shaped token that closes each level
   └─ ScrollTopButton          floating circular, bottom-left of the column
```

### Behaviours

- **Sticky level indicator is scroll-driven, not click-driven.** The pinned pill
  swaps its level as each level's node group passes. IntersectionObserver pattern.
- **Node click expands an inline detail card** below the node, with a title and a
  full-width blue Start button. It is not a modal.
- Lesson nodes render locked/available/complete as three distinct token treatments.
- Nav is fixed, dark, with a hairline bottom border.
- Cards use no blur shadow anywhere — depth comes from borders and the hard edge.

---

## 2. Elice — the school SaaS layer

### Tokens

| Token | Value |
|---|---|
| Font | Pretendard Variable |
| Body | `#FFFFFF` bg, text `rgb(25,31,40)` |
| Primary CTA | `rgb(33,33,33)` near-black, radius `8px` |
| Brand violet | ~`#6C4FE0`, hero gradient violet → periwinkle with wave line-art |
| Dark band | ~`#2A2A2A` used for the Case Studies section |

### Structure — `/en` and `/en/ax/lxp`

```
EliceProductPage
├─ TopNav                      logo, dropdown nav, Contact (outline) + Try Free Trial (black)
├─ ProductSubNav (STICKY)      product icon + name + section anchors
│                              active underline AUTO-SWITCHES as you scroll — scroll-driven
├─ Hero                        gradient violet, centred, product chip + h1 + sub + 2 CTAs
├─ LogoWall                    institutional client marks, greyscale
├─ StatCards                   large numerals in violet/blue, label under
├─ AwardsRow                   icon + multi-line credential text ×3
├─ FeatureSplit  (repeated)    icon chip + violet eyebrow → 48/700 headline → text one side,
│                              product mockup the other (lavender rounded frame, floating white UI card,
│                              content tree: folder → [수업자료] / [이론] / [퀴즈] rows with type icons)
├─ ContentCardGrid             4-col, ~232×124, radius 12, full-bleed illustrated gradient,
│                              title top-left bold, tech chips (Pandas / NumPy / Python) bottom-left
└─ CaseStudies (dark band)     3-up cards, image + "LXP" kicker + title
```

### Behaviours

- Sticky product sub-nav with scroll-driven active section underline.
- Feature sections alternate text/mockup sides.
- Everything is 8–12px radius; no pill buttons except the nav.

---

## 3. Elice LXP trial — `trial-qazaq-b2.elice.io/lxp/home`

**Not accessible.** Three attempts, up to 16 s of wait each. The page serves only
a violet loading blob, `document.title` stays `로딩중입니다` ("loading"),
`document.body.innerText` is empty, `document.images.length === 0`, and there are
zero anchors in the DOM. It is an authenticated tenant and there is no public
session to read it from.

The LXP product page (`elice.io/en/ax/lxp`) was used in its place for the
classroom / content-tree / dashboard patterns, plus the case-study copy
("An app that allows students and teachers to learn coding that they both find
satisfactory").

---

## 4. Component map — what SolveX takes from where

```
SolveX
│
├─ FROM BRILLIANT ─────────────────────────────────────────────
│  ├─ dark #141414-family ground, panel-on-panel depth
│  ├─ hard 4px offset edge on every raised object     → PhysicalSurface
│  ├─ 176px square tiles in a connected path          → LearningPathRow / PathTile
│  ├─ sticky scroll-driven level indicator            → LevelRail
│  ├─ node → inline expanding detail card             → LessonNode
│  ├─ lesson = story → visual → predict → challenge   → LessonContainer + blocks
│  ├─ locked / available / complete node states       → ProgressSystem
│  └─ eyebrow 12/700/0.48px uppercase white-40        → Eyebrow
│
├─ FROM ELICE ─────────────────────────────────────────────────
│  ├─ sticky product sub-nav, scroll-driven active    → ProductSubNav
│  ├─ classroom dashboard, roster, analytics          → ClassroomDashboard
│  ├─ assignment list + auto-evaluation counts        → AssignmentCard
│  ├─ content tree (folder → theory / quiz / video)   → CourseTree
│  ├─ browser coding environment                      → CodeEditorBlock
│  └─ institutional framing for decision makers       → SchoolOutcomes
│
└─ SOLVEX OWN ─────────────────────────────────────────────────
   ├─ Sol, the AI engineering mentor, in every lesson → SolMascot / MascotController
   ├─ Class Signal grid: 30 students, one screen      → ClassSignalGrid
   └─ cohort triad as the brand palette               → jade / signal / ember
```
