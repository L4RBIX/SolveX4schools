# Brilliant clone — animation inventory

Every animated behaviour found in the repository, and where it lands in
SolveX4Schools. Produced by a full-repository sweep, not by filename search —
most of the motion here lives in files whose names say nothing about it.

**121 animations** across 59 files.

**Preservation target: 100%**, minus anything irrelevant to a school product,
legally unusable, broken, or an accessibility problem. Each exception is named.

---

## Motion libraries in use

- motion ^13.1.1 (the Framer Motion successor, imported as `motion/react`) — used in 18 files: AnimatePresence in nav.tsx and lesson-node.tsx; layoutId shared-layout in subject-tabs.tsx; useReducedMotion in 12 files; framer-motion itself is NOT a dependency

- @rive-app/react-canvas ^4.32.1 — useRive in 3 files against 2 local .riv assets: meet_koji.0dced838.riv (24 artboards; artboards MAIN_KojiEntrance and NEST_Koji_Built / state machine BuiltToMakeYouThink) and koji-gameboard.e2320c48.riv (artboard 'Gameboard Node', state machine 'node_all')

- @base-ui/react ^1.3.0 — Accordion (about/our-method.tsx, faq/faq-section.tsx) and Tabs (about/what-we-teach.tsx); its height animation is CSS-driven via --accordion-panel-height plus data-starting-style/data-ending-style, not JS

- Tailwind CSS v4 utilities — transition-*, duration-*, ease-*, delay-*, and one arbitrary animate-[b-shimmer_6400ms_...] utility

- Native CSS @keyframes — b-shimmer, b-shake-x (globals.css); sx-rise, sx-nudge (solvex.css)

- tw-animate-css ^1.4.0 — INSTALLED in package.json but never imported by any CSS or TS file; globals.css only does @import "tailwindcss". Dead dependency.

- No GSAP, no Lottie, no react-spring, no View Transitions API (no viewTransition config in next.config.ts, no ViewTransition import, no ::view-transition CSS), no SVG SMIL (<animate>/<animateTransform>/stroke-dashoffset) anywhere in src/ or public/, and no requestAnimationFrame or setInterval-driven animation loops.


## Global motion tokens

These are the shared rhythm. Anything new must use them rather than inventing a curve.

```
--ease-sx-out: cubic-bezier(0.16, 1, 0.3, 1) — globals.css:91 (SolveX standard out)
--ease-sx-in: cubic-bezier(0.7, 0, 0.84, 0) — globals.css:92 (declared, no call sites in src/)
--ease-sx-spring: cubic-bezier(0.34, 1.56, 0.64, 1) — globals.css:93 (declared, no call sites in src/)
--ease-quint: cubic-bezier(0.23, 1, 0.32, 1) — globals.css:198 (brilliant ease-out-quint; also hardcoded inline as [0.23,1,0.32,1] in 6 components)
--ease-cubic: cubic-bezier(0.33, 1, 0.68, 1) — globals.css:199, used by .b-press
--ease-b-enter: cubic-bezier(0, 0, 0.2, 1) — globals.css:203, lesson player page-fade in (200ms)
--ease-b-exit: cubic-bezier(0.4, 0, 1, 1) — globals.css:204, page-fade out (100ms); token defined but not currently applied by any component
--ease-b-spring: linear(0 0%, ... 1.027 54%, 1.027 60.9%, 1.007 83.2%, 1 100%) — globals.css:212-219; sampled overshoot curve used by the lesson player page track and the CourseDeck 3D stack
--button3d-translate-y (default -4px) — set to 0px on press; lesson/button-3d.tsx
--button3d-shadow-y (default 4px) — set to 0px on press; lesson/button-3d.tsx
--button3d-shadow-color — per-variant lip colour; lesson/button-3d.tsx
--button3d-x-scale (default 1) — elliptical radius divisor on subject/button-3d.tsx and faq/button-3d.tsx
--accordion-panel-height — Base UI, drives the 200ms height transition on about/our-method.tsx and faq/faq-section.tsx
--pill-grad / --pill-grad-hover — subject/course-tabs.tsx, cross-faded over 500ms
--node-x — course-map.tsx, per-node horizontal offset for the zig-zag path
NOTE: there are no duration tokens anywhere. Every duration is inline (0.15s / 0.2s / 0.26s / 0.45s / 0.5s / 0.55s / 0.6s / 0.7s / 6.4s in motion props; 100/150/200/300/500/6400ms in Tailwind utilities). src/lib/motion.ts holds the JS-side timing (enter 0.55s, exit 0.24s, spring 420/34/0.9, softSpring 160/22/1, stagger 0.06s) but only its `enter` export is actually imported.
```

---

## Catalogue

### Hero (1)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/faq/button-3d.tsx` | Shimmer — motion.svg gradient blade (lines 93-108) | mounts with the hero CTA (shimmer prop); repeat: Infinity. `animate` is set to undefined under useReducedMotion so it parks off-stage at left:-100% | left keyframes ['-100%','100%','100%','100%'] and opacity [1,1,0,0] at times [0, 0.25, 0.26, 1] — the sweep is only the first quarter, then it holds invisible, so it reads as an occasional g | 6.4s, infinite · [0.16, 1, 0.7, 1] | /brilliant/faq |

### Navigation (10)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/nav.tsx` | Nav — AnimatePresence 'Get started' pill (line 72-86) | window scroll past SCROLL_TRIGGER = 600px (passive scroll listener -> useState) | opacity 0->1 and x 16px->0 on enter; opacity+x 16 on exit. Under useReducedMotion: opacity only, no x | 0.2s · [0.33, 1, 0.68, 1] (ease-out-cubic) | /brilliant |
| `src/components/brilliant/subject-tabs.tsx` | SubjectTabs — motion.span layoutId pill (lines 193-202) | tab click or roving-tabindex arrow/Home/End keyboard navigation changing `active` | shared-layout (FLIP) travel of the black pill background between tabs — position and size | spring: stiffness 420, damping 36, mass 0.9; {duration: 0} under reduced motion · spring | /brilliant |
| `src/components/brilliant/course-map.tsx` | CourseMap — scroll-to-top button (lines 75-77, 136-138) | click | window.scrollTo({top:0, behavior:'smooth'}) — smooth document scroll; button itself is sticky bottom-6 with .b-press press-sink and hover border change | UA smooth scroll · UA | /brilliant/courses |
| `src/components/brilliant/about/about-header.tsx` | AboutHeader — fixed duplicate bar, motion.div (lines 92-103) | useSyncExternalStore over a passive scroll listener; window.scrollY > 200 | y '-100%' <-> '0%' slide-down of the inert duplicate header | 0.2s ({duration: 0} under useReducedMotion) · easeInOut | /brilliant/about |
| `src/components/brilliant/faq/app-header.tsx` | faq AppHeader — sticky bar (line 25) | scroll (position: sticky top-0 z-999) and any change to the listed properties | transition-[color, background-color, border-color, box-shadow, opacity, transform] | 200ms · ease-in | /brilliant/faq |
| `src/components/brilliant/subject/subject-header.tsx` | SubjectHeader — fixed solid bar B, motion.div (lines 84-114) | passive scroll listener with hysteresis: show above SHOW_AT, hide below HIDE_BELOW | y '-100%' <-> 0 slide-down | spring stiffness 180 damping 25 on reveal; 0.15s easeInOut on hide; {duration: 0} under useReducedMotion · spring in / easeInOut out | /brilliant/math |
| `src/components/brilliant/lesson/lesson-chrome.tsx` | NavArrow — prev/next (lines 152-170) | `enabled` prop; the arrows stay mounted at 52x52 permanently so the progress bar never reflows — only opacity changes | opacity 0 <-> 1; hover text colour white/60 -> white; the SVG is one path rotated 270deg (prev) / 90deg (next) | 300ms · ease-in-out | /brilliant/lesson |
| `src/components/brilliant/app/app-header.tsx` | AppHeader — sticky tab bar (lines 62, 83-84, 124) | scroll (position: sticky top-0 z-999) and hover on tabs / icon buttons | tab text colour white/60 -> white (transition-colors); icon button background -> white/10 | Tailwind default 150ms on tabs, 100ms on the icon button · Tailwind default ease | /brilliant/app/home, /brilliant/app/courses, /brilliant/app/course, /brilliant/app/you |
| `src/components/brilliant/gameboard/course-gameboard.tsx` | ScrollTopButton (lines 155-160, 314-320) | showTop (scroller.scrollTop > 400); click calls scroller.scrollTo({top:0, behavior:'smooth'}) | opacity 0 <-> 1 with pointer-events gating; the click itself smooth-scrolls the fixed container | 300ms fade; UA smooth scroll · Tailwind default ease | /brilliant/app/course |
| `src/components/brilliant/legal/legal-toc.tsx` | LegalToc anchor jumps (lines 12-24) | click on a TOC anchor | KNOWN DEVIATION documented in-source: the original snaps, but globals.css sets scroll-behavior: smooth on <html>, so these jumps animate. No scroll-spy, no IntersectionObserver, no sticky, n | UA smooth scroll · UA | /brilliant/terms-of-use |

### Carousels & horizontal tracks (6)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/testimonials.tsx` | Testimonials — horizontal snap rail (lines 53-77) | user horizontal scroll / drag inside the overflow-x-auto region (tabIndex 0, keyboard reachable) | snap-x snap-mandatory with snap-start on each 280/296px card; scrollbar hidden; page itself never scrolls sideways | UA scroll-snap · UA | /brilliant |
| `src/components/brilliant/lesson/lesson-player.tsx` | LessonPlayer — horizontal page track (lines 93-95) | page state change from Continue / prev arrow | transform translateX(-page * 100%) sliding the slide track | 500ms · ease-b-spring — the sampled linear() curve that overshoots to 1.027 and settles (copied verbatim from the live site; an ease-out substitute reads wrong) | /brilliant/lesson |
| `src/components/brilliant/app/course-deck.tsx` | CourseDeck — thumbnail switcher tiles (lines 120-125) | selection / hover | transition-all: border #7139CC and bg #170B29 when active, border white/20 -> white/40 on hover | 200ms · Tailwind default ease | /brilliant/app/home |
| `src/components/brilliant/app/learning-paths.tsx` | PathRow — horizontal carousel track (lines 160-164) | CarouselEdge prev/next button click; `offset` state stepped by a full page (floor(viewportW / SLIDE_PITCH) * SLIDE_PITCH), clamped to maxOffset | transform translateX(-offset px) of the tile strip | 300ms · ease-out | /brilliant/app/courses |
| `src/components/brilliant/app/learning-paths.tsx` | PathRow — ResizeObserver on the carousel viewport (lines 100-107) | element resize | recomputes viewportW so arrow visibility and page size stay correct after a resize (drives CarouselEdge opacity 0/1) | n/a · n/a | /brilliant/app/courses |
| `src/components/brilliant/app/learning-paths.tsx` | PathRow root + CarouselEdge masks (lines 119, 195-206) | canPrev / canNext state | root transition-opacity duration-150 ease-in; the gradient edge masks are toggled by an inline opacity 0/1 (no transition declared on the mask itself), and each control button is unmounted w | 150ms on the row · ease-in | /brilliant/app/courses |

### Cards (4)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/lesson-node.tsx` | LessonNode — AnimatePresence inline detail card (lines 178-201) | click on an unlocked node toggling `open`; AnimatePresence initial={false} | height 0 <-> 'auto' plus opacity 0 <-> 1, overflow-hidden; pushes the rest of the column down rather than opening as a modal | 0.26s (spread of `enter` from src/lib/motion.ts with duration overridden) · [0.23, 1, 0.32, 1] (EASE_OUT_QUINT) | /brilliant/courses |
| `src/components/sx/month-map.tsx` | MonthMap — month row cards (lines 152-154) | hover on a `ready` month | transition-[border-color, background-color]: border-sx-line -> border-sx-line-strong | 200ms · Tailwind default ease | / |
| `src/components/sx/month-detail.tsx` | MonthDetail — back button and lesson rows (lines 48, 104-106) | hover | transition-colors on the back button; transition-colors duration-200 on lesson row border/background for `ready` lessons | 200ms on the rows, Tailwind default on the back button · Tailwind default ease | /month/[index] |
| `src/app/study/page.tsx` | StudyIndex — route link cards (lines 50, 60) | hover | transition-colors: border #2a2a2a -> #4c4c4c on the card, and the mono label white/30 -> white/60 via group-hover | 150ms on the card, Tailwind default on the label · Tailwind default ease | /study |

### 3D transforms (8)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/about/button-3d.tsx` | Button3D (about variant) — FACE_BASE (lines 12-15) | group-active/b3d on the anchor; hover on the root | face translate-y from -4px to 0 and box-shadow (hard 4px lip) to none, so the face lands flush on its own lip; root hover:opacity-85 | 100ms · ease-out | /brilliant/about |
| `src/components/brilliant/faq/button-3d.tsx` | Button3D (faq variant) — FACE (lines 25-30) | group-active on the anchor; hover on the root | translate-y -4px -> 0 and shadow 0 4px 0 #15b441 -> none; root hover:opacity-85 | 100ms · ease-out | /brilliant/faq |
| `src/components/brilliant/subject/button-3d.tsx` | Button3D (subject variant) — FACE_BASE + FACE_VARIANTS (lines 16-42, 61) | group-active/b3d and group-hover/b3d; root hover | face translate-y -4px -> 0 with the hard 4px lip collapsing; outline variants also move border-colour and shadow on hover and swap padding on press; root opacity -> 0.85. Radius is driven by | 100ms face, 100ms root opacity · ease-out | /brilliant/math |
| `src/components/brilliant/lesson/button-3d.tsx` | Button3D (lesson variant) — face (lines 72-85) | group-active:enabled; hover on the root | the lift and the lip are both driven by custom properties — --button3d-translate-y (default -4px) and --button3d-shadow-y (default 4px) both set to 0px on press, so the face travels exactly  | 100ms · ease-out | /brilliant/lesson |
| `src/components/brilliant/app/course-deck.tsx` | CourseDeck — 3D stacked card deck (lines 86-95) | thumbnail switcher click changing `index`; each card's depth is recomputed as (i - index + n) % n | transform: translate(x%, y%) scale(s) per depth, reproducing the reference's perspective:1200px / preserve-3d stack where each card behind the front is a further translateZ(-100px). Scales a | 500ms · ease-b-spring — the sampled linear() overshoot curve (globals.css lines 212-219) | /brilliant/app/home |
| `src/components/brilliant/app/course-deck.tsx` | StartButton — purple 3D CTA + shimmer blade (lines 205-255) | CSS animation on mount (infinite); press for the 3D collapse | the 150x56 SVG gradient blade uses animate-[b-shimmer_6400ms_cubic-bezier(.16,1,0.7,1)_infinite] — left -100% -> 100% over the first quarter then opacity to 0. Separately, group-active colla | 6400ms shimmer loop; 100ms press · cubic-bezier(.16, 1, 0.7, 1) shimmer; ease-out press | /brilliant/app/home |
| `src/components/brilliant/app/learning-paths.tsx` | CourseTile — 176x176 art card (lines 238-242) | hover / active | transition-[transform, box-shadow, border-color, background-color]: hover border-white/40; active translate-y-1 -> 0 with shadow 0 4px 0 #4C4C4C -> 0 | 100ms · ease-out | /brilliant/app/courses |
| `src/components/brilliant/gameboard/course-gameboard.tsx` | FooterCard — purple button3d face (lines 293-298) | group-active | translate-y-1 -> 0 and shadow 0 4px 0 var(--color-b-purple-2) -> 0 | 100ms · ease-out | /brilliant/app/course |

### Scroll reveals (13)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/app/globals.css` | html (base layer) | any in-page hash/anchor jump or window.scrollTo({behavior:'smooth'}) | document scroll position | UA default · UA default | ALL routes (global) |
| `src/components/brilliant/stats-band.tsx` | StatsBand — motion.ul parent + motion.li cards (lines 49-78) | whileInView, viewport once:true amount:0.3 margin:'0px 0px -60px 0px'; parent flips to 'shown' on 'hidden'. useReducedMotion starts the list already shown | per-card opacity 0->1 and y 20->0, released with staggerChildren 0.06s | 0.5s per card, 60ms stagger · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/feature-row.tsx` | FeatureRow — motion.div media panel (lines 143-152) | whileInView, viewport once:true amount:0.4 | opacity 0->1 and y 24->0 (y suppressed under reduced motion) | 0.6s · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/feature-row.tsx` | FeatureRow — motion.div text column (lines 190-201) | whileInView, viewport once:true amount:0.4 | opacity 0->1 and y 16->0 | 0.6s, delay 0.08s · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/koji-section.tsx` | KojiSection — motion.h2 and motion.p (lines 83-104) | whileInView, viewport once:true amount:0.5 | opacity 0->1 and y 20->0 on both; paragraph delayed | 0.55s (paragraph delay 0.08s) · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/subject-tabs.tsx` | SubjectTabs — motion.h2 heading and motion.div tab-bar wrapper (lines 147-163) | whileInView, viewport once:true amount:0.3 | opacity 0->1, y 20->0 (heading) / y 16->0 (bar) | 0.55s; bar delay 0.08s · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/testimonials.tsx` | Testimonials — motion.h2 + motion.ul stagger parent + motion.li cards (lines 39-77) | whileInView; heading once:true amount:0.5, list once:true amount:0.2 margin:'0px 0px -60px 0px' | heading opacity+y 20; each card opacity 0->1, y 20->0 released with staggerChildren 0.06s | 0.55s heading, 0.5s per card, 60ms stagger · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/get-started.tsx` | GetStarted — motion.h2, motion.div CTA wrapper, motion.div photo (lines 32-65) | whileInView; heading/CTA once:true amount:0.4, photo once:true amount:0.15 | heading opacity+y 20; CTA opacity+y 16; photo opacity+y 24 (all y suppressed under reduced motion) | 0.55s / 0.55s+0.08s delay / 0.6s+0.12s delay · [0.23, 1, 0.32, 1] | /brilliant |
| `src/components/brilliant/course-map.tsx` | CourseMap — IntersectionObserver level scroll-spy (lines 55-69) | scroll; observer with rootMargin '-45% 0px -50% 0px', threshold 0 across a thin mid-viewport band, over every [data-level-id] section | which LevelPill reads as active (state -> border/background colour swap), NOT position | n/a (observer); pill colour transition 200ms · n/a | /brilliant/courses |
| `src/components/brilliant/learning-path.tsx` | LearningPath — motion.div per tile (lines 59-65) | whileInView, viewport once:true amount:0.35 | opacity 0->1 and y 16->0, index-based stagger via delay: index * 0.05 | 0.45s, 50ms per-index delay · [0.23, 1, 0.32, 1] (spread of `enter`) | /brilliant/courses |
| `src/components/brilliant/gameboard/course-gameboard.tsx` | CourseGameboard — inner fixed scroller (lines 46-57, 87-88) | scroll inside a position: fixed container (the document itself never scrolls — document.scrollHeight stays at viewport height while the container's scrollHeight was 11573) | drives showTop (scrollTop > 400) for the scroll-to-top button | n/a · n/a | /brilliant/app/course |
| `src/components/brilliant/gameboard/course-gameboard.tsx` | CourseGameboard — IntersectionObserver on the footer node (lines 68-83) | IntersectionObserver rooted on the scroller, threshold 0.6, watching [data-node="<title>"] | sets nodeOnScreen, which hides the sticky FooterCard while its own node is visible and slides it back once you scroll away | n/a (observer); 300ms on the resulting slide · n/a | /brilliant/app/course |
| `src/components/brilliant/gameboard/course-gameboard.tsx` | FooterCard — sticky bottom CTA (lines 269-272) | `hidden` prop from the IntersectionObserver above | transition-all: translate-y-[100px] + opacity 0 <-> translate-y-0 + opacity 100, plus pointer-events gating; position: sticky bottom-10 inside the scroller | 300ms · ease-out | /brilliant/app/course |

### Lesson feedback (8)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/app/globals.css` | @keyframes b-shake-x + .b-shake (lines 314-316, 343-350) | class applied when a scheduler constraint has status 'unsatisfied' after a failed check (key change replays it) | transform translateX(0) -> translateX(4px), 4 iterations, alternate (400ms total, asymmetric not symmetric shake) | 100ms x 4 = 400ms · ease-in-out | /brilliant/lesson (ScheduleGrid constraint rows) |
| `src/app/solvex.css` | @keyframes sx-rise + .sx-rise (lines 106-119) | element mount — new lesson block rendered, verdict banner appears, lesson-complete screen mounts | opacity 0->1 and transform translate3d(0,12px,0) -> translate3d(0,0,0) | 320ms, fill-mode both · var(--ease-sx-out) = cubic-bezier(0.16, 1, 0.3, 1) | /lesson/[lessonId] (LessonPlayer block wrapper + LessonComplete, sx Verdict primitive) |
| `src/app/solvex.css` | @keyframes sx-nudge + .sx-nudge (lines 121-131) — DEFINED BUT NEVER APPLIED anywhere in src/ | intended: wrong answer. Currently: dead CSS, zero call sites | transform translate3d(-5px/0/5px, 0, 0) horizontal nudge | 240ms · var(--ease-sx-out) = cubic-bezier(0.16, 1, 0.3, 1) | none — unused |
| `src/components/brilliant/lesson/lesson-player.tsx` | LessonPlayer — lesson card border (lines 84-90) | verdict state change: unchecked -> wrong -> right | border-color white/20 -> b-warn -> b-ok on the fixed 24px-radius card | 300ms · Tailwind default ease | /brilliant/lesson |
| `src/components/brilliant/lesson/schedule-grid.tsx` | ScheduleGrid — constraint rows, .b-shake (lines 262-267) | status === 'unsatisfied' after a failed check; the React key changes with status so it replays on every failed attempt | transform translateX(0) -> 4px, 4 iterations alternating | 100ms x 4 · ease-in-out | /brilliant/lesson |
| `src/components/sx/lesson-player.tsx` | LessonPlayer — block wrapper .sx-rise (line 158) | block index change — the key={block.id} remounts the div so the animation replays for every new lesson block | opacity 0->1 and translate3d(0,12px,0)->0 | 320ms · var(--ease-sx-out) = cubic-bezier(0.16, 1, 0.3, 1) | /lesson/[lessonId] |
| `src/components/sx/primitives.tsx` | Verdict banner — .sx-rise (line 133) | mount when a block result lands (role=status, aria-live=polite) | opacity + 12px rise of the correct/wrong/unknown verdict row | 320ms · var(--ease-sx-out) | /lesson/[lessonId] |
| `src/components/sx/blocks/code.tsx` | Code block — trace stepper rows and step buttons (lines 182-193, 263-265) | hover / picked state; step buttons disable at the ends | transition-colors on row background and control background/opacity; blank inputs grow via an inline ch-based width | 150ms on the rows; Tailwind default on the controls · Tailwind default ease | /lesson/[lessonId] |

### Progress (4)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/level-pill.tsx` | LevelPill (line 22) | scroll-spy `active` prop flipping from CourseMap's IntersectionObserver | border-color and background colour of the 72px pill | 200ms · Tailwind default ease | /brilliant/courses |
| `src/components/brilliant/lesson/lesson-chrome.tsx` | LessonTopBar — progress fill (lines 85-88) | progress prop change as the learner advances | width 0% -> 100% of the b-ok-progress fill inside the 12px rounded track | 200ms (transition-[width]) · Tailwind default ease | /brilliant/lesson |
| `src/components/brilliant/lesson/lesson-chrome.tsx` | LessonTopBar — segment dots (lines 94-98) | segmentsComplete change | transition-all: background b-ok-progress vs white/5 on each 12x16 dot | 200ms · Tailwind default ease | /brilliant/lesson |
| `src/components/sx/primitives.tsx` | SegmentedProgress (lines 272-276) | `current` prop advancing as blocks are completed | background colour of each 1.5px segment, bg-sx-line-strong -> bg-sx-primary | 300ms · Tailwind default ease | /lesson/[lessonId] |

### Milestones (1)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/gameboard/course-gameboard.tsx` | Level headers + node labels (lines 198-201, 227, 244-248) | scroll (each level header is its own position: sticky top-[41px]) and active/selected state | node label colour white/40 -> white (transition-colors); the level header's offset 460x72 slab background-colour swaps between HEADER_SHADOW_IDLE and HEADER_SHADOW_ACTIVE (transition-colors) | Tailwind default 150ms · Tailwind default ease | /brilliant/app/course |

### Completion (1)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/sx/lesson-player.tsx` | LessonComplete — .sx-rise card (line 205) | mount of the completion screen after the last block | opacity + 12px rise of the whole completion panel | 320ms · var(--ease-sx-out) | /lesson/[lessonId] |

### Rive (3)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/koji-section.tsx` | KojiSection — useRive canvas, meet_koji.0dced838.riv, artboard 'MAIN_KojiEntrance' (lines 52-79) | autoplay:true on mount. Plays timelines ['Intro','Loop'] directly (the state machine parks pre-entrance and exposes no inputs). Under useReducedMotion it holds on timeline ['EndStill'] | Koji's entrance then resting loop on a 340x447 canvas that deliberately overflows its 108px wrapper so his light trail passes behind the heading | Intro then infinite Loop · authored inside the .riv | /brilliant |
| `src/components/brilliant/lesson/koji.tsx` | Koji — useRive canvas, meet_koji.0dced838.riv, artboard 'NEST_Koji_Built', state machine 'BuiltToMakeYouThink' (lines 67-101) | autoplay:true on mount for the idle; a useEffect keyed on [rive, verdict, attempt] fires the reaction. No artboard exposes state-machine inputs, so it falls back to rive.play(name) on a name | reaction timelines — right -> 'success-medium', wrong -> 'incorrect'; idle 'isTalking_idle'. 128x168 CSS px canvas (256x336 backing, DPR 2) pinned to the viewport's left edge at z-856 | per-timeline, authored in the .riv · authored in the .riv | /brilliant/lesson |
| `src/components/brilliant/gameboard/gameboard-pedestal.tsx` | RivePedestal — useRive canvas, koji-gameboard.e2320c48.riv, artboard 'Gameboard Node', state machine 'node_all' (lines 161-210) | only mounted when `animated` (node.active or selected) — clicking a node literally swaps its static <svg> for a <canvas>. Inputs are assigned in a useEffect keyed on [rive, selected, active] | state-machine booleans select, padlock(false), dark-mode(true), start_idle(active); trigger 'koji_appear' fired once per node via a useRef latch. Available inputs: booleans padlock/select/ho | authored in the .riv · authored in the .riv | /brilliant/app/course |

### Video (4)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/components/brilliant/hero.tsx` | HeroClip — <video> autoPlay muted loop playsInline (lines 54-72) | mount effect + onLoadedMetadata + onCanPlay + onEnded; seeks to startAt 16.5s so it opens on a different scene than other players of the same clip | looping cs-refresh.webm (1360x888, 17.4s, 4 scenes) inside a 20px-radius card; poster stands in if autoplay is refused | 17.4s clip, infinite loop · n/a | /brilliant |
| `src/components/brilliant/feature-row.tsx` | FeatureRow — IntersectionObserver video play/pause gate (lines 88-131) | IntersectionObserver threshold 0.25 on the <video>; also loadedmetadata + ended listeners to re-seek video.startAt so shared clips keep per-row offsets. Fully paused when useReducedMotion is | playback of the looping muted webm/mp4 inside the 555x387 pastel panel; object-contain | clip length, looped while on screen · n/a | /brilliant |
| `src/components/brilliant/subject-tabs.tsx` | SubjectTabs — per-tab <video> play/pause effect (lines 105-142) | active tab index change; only the visible tab's clip plays, the rest are paused. Seeks to CLIP_SRC.startAt (1.5s) before first play and on every 'ended'. Never plays under useReducedMotion | looping muted cs-refresh.webm preview inside the white card | 17.4s clip, looped · n/a | /brilliant |
| `src/components/brilliant/subject/course-tabs.tsx` | CoursePanel — <video> autoPlay loop muted playsInline (lines 225-240) | autoPlay={!reduce}; under useReducedMotion the <source> is not even rendered, so only the poster shows | looping webm course preview inside the white 550/700px panel; native media controls hidden via ::-webkit-media-controls | clip length, looped · n/a | /brilliant/math |

### Hover & press (35)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/app/globals.css` | .b-press utility class (lines 269-279) | :active on any non-disabled element carrying .b-press | transform translateY(3px) + box-shadow collapse to 0 1px 0 currentColor; also transitions border-color and background-color | 120ms transform/box-shadow, 160ms border-color/background-color · var(--ease-cubic) = cubic-bezier(0.33, 1, 0.68, 1) | /brilliant, /brilliant/courses (Nav, Hero CTAs, CourseNav, CourseMap scroll-top, LessonNode Start, PathTile, SubjectTabs pills, GetStarted CTA) |
| `src/components/brilliant/nav.tsx` | Nav — PILL_BASE anchors (line 26) | hover / active on the Sign in and Get started pills | hover: -translate-y-px; active: .b-press translateY(3px) + shadow collapse; hover text colour | 120-160ms (from .b-press) · var(--ease-cubic) | /brilliant |
| `src/components/brilliant/hero.tsx` | Hero CTA anchors 'I'm a learner' / 'I'm a parent or teacher' (lines 152-163) | hover / active | hover: -translate-y-px (+ text colour on the outline variant); active: .b-press sink | 120-160ms · var(--ease-cubic) | /brilliant |
| `src/components/brilliant/footer.tsx` | Footer link list and social icons (lines 102, 125) | hover | colour b-muted -> b-ink | Tailwind default 150ms · Tailwind default ease | /brilliant |
| `src/components/brilliant/lesson-node.tsx` | LessonNode — coin SVG token (lines 105-115) | group-hover / group-active on the node button (suppressed when locked) | transform: group-hover -translate-y-[2px], group-active translate-y-[2px] | 150ms (duration-150) · ease-out | /brilliant/courses |
| `src/components/brilliant/lesson-node.tsx` | LessonNode — 'Start' button inside the detail card (line 194) | hover / active | hover brightness-110; active translate-y-[3px] and box-shadow 0 4px -> 0 1px (hard lip collapse), on top of .b-press | 120-160ms · var(--ease-cubic) | /brilliant/courses |
| `src/components/brilliant/path-tile.tsx` | PathTile — .b-physical .b-press tile (lines 329-331) | group hover / group active | hover: border-white/70, text-white/70 and box-shadow 0 4px 0 rgba(255,255,255,0.7); active: translate-y-[3px] + shadow 0 1px 0 currentColor | 120ms transform/shadow, 160ms border/background (.b-press) · var(--ease-cubic) | /brilliant/courses |
| `src/components/brilliant/course-nav.tsx` | CourseNav — Sign in / Get started pills (lines 54, 60) | hover / active | hover border-white/40 or brightness-95; active shadow-none via .b-press | 120-160ms · var(--ease-cubic) | /brilliant/courses |
| `src/components/brilliant/about/what-we-teach.tsx` | WhatWeTeach — Tabs.Tab pills (TAB_CLASS, lines 33-39) | hover / data-[active] | text colour, background (#e5e5e5 on hover above 481px, white when active) and shadow 0 1px 8px #0000000D | none declared (instant) · n/a | /brilliant/about |
| `src/components/brilliant/about/more-reading.tsx` | MoreReading links (lines 41-42) | hover / active | underline decoration colour #456dff, decoration-2, underline-offset-2; active also changes text colour | none declared · n/a | /brilliant/about |
| `src/components/brilliant/about/about-footer.tsx` | AboutFooter links + social icons (lines 103, 176) | hover | border-bottom colour transparent -> #456dff; icon colour #999 -> #456dff | none declared · n/a | /brilliant/about |
| `src/components/brilliant/faq/app-header.tsx` | faq AppHeader — nav link underline pseudo-element (line 40) | hover on the nav link | ::after transform translateY(0) -> -2px, revealing the rgba(0,0,0,0.2) 2px rule; link colour also transitions | 100ms (after:duration-100) · ease-linear | /brilliant/faq |
| `src/components/brilliant/faq/app-header.tsx` | faq AppHeader — Sign in / Get started buttons (lines 52, 59) | hover | box-shadow none -> 0 1px 3px rgba(0,0,0,0.30) | 200ms (transition-shadow) · Tailwind default ease | /brilliant/faq |
| `src/components/brilliant/faq/site-footer.tsx` | SiteFooter links + social icons (lines 112, 152, 187) | hover | border-bottom colour -> #456dff; social icon colour #999 -> #456dff (transition-colors) | Tailwind default 150ms on the icons; none declared on the links · Tailwind default ease | /brilliant/faq |
| `src/components/brilliant/subject/subject-header.tsx` | SubjectHeader — HEADER_BUTTON (lines 27-36) | hover / active | border and background colour (transition-colors) | 100ms · ease-out | /brilliant/math |
| `src/components/brilliant/subject/hero.tsx` | KojiButton — KojiPeek mascot (lines 121-123) | group-hover/koji on the CTA wrapper; xl (min-992px) and up only, hidden below | transform translate-y-full -> 0, sliding the mascot up into a 30px clipping window over the button's top edge | 200ms · ease-out | /brilliant/math |
| `src/components/brilliant/subject/course-tabs.tsx` | CourseTabs — selected pill gradient layer (lines 334-338) | selection state and group-hover/pill | opacity 0 <-> 1 of the gradient underlay; hover swaps background-image from --pill-grad to --pill-grad-hover (adds a black 10% layer) | 500ms · ease-out | /brilliant/math |
| `src/components/brilliant/subject/subject-footer.tsx` | SubjectFooter links and social icons (lines 7, 66) | hover | border-bottom -> #456dff; icon colour #999 -> #456dff | Tailwind default 150ms on icons · Tailwind default ease | /brilliant/math |
| `src/components/brilliant/lesson/lesson-player.tsx` | LessonPlayer — dock and header icon buttons (lines 152, 159, 190, 198) | hover | text colour white/20 -> white/50 or white/60 | Tailwind default 150ms · Tailwind default ease | /brilliant/lesson |
| `src/components/brilliant/lesson/schedule-grid.tsx` | ScheduleGrid — draggable slot blocks and grid (lines 163, 214-220) | hover and selection state on a scheduler block | border-color and background: b-sched-fill/edge -> b-sched-fill-hover/edge-hover; selected state uses b-sched-fill-on/edge-on | 200ms grid, 100ms blocks · Tailwind default ease | /brilliant/lesson |
| `src/components/brilliant/gameboard/gameboard-pedestal.tsx` | LockedPedestal / ReviewPedestal — static SVG variants (lines 74-77, 115-118) | group-hover on the node button | transition-[filter] brightness 1 -> 0.9 on the static pedestal SVG (the cheap path — 48 nodes, no canvas) | 150ms · Tailwind default ease | /brilliant/app/course |
| `src/components/brilliant/app/you-dashboard.tsx` | YouDashboard — period radio pills (lines 70-75) | selection / hover | transition-[background-color, box-shadow, color]: active gets bg-b-bg + shadow 0 0 15px rgba(0,0,0,0.1); inactive text white/40 -> white/70 on hover | 150ms · ease-out | /brilliant/app/you |
| `src/components/brilliant/wiki/wiki-header.tsx` | WikiHeader — nav links (lines 22-29) | hover / focus-visible | colour -> black plus an ::after 2px #ccc rule that transitions translate-y 0 -> -2px and opacity 0 -> 1 together | 200ms on both the link colour and the ::after · ease-in-out on the ::after | /brilliant/wiki |
| `src/components/brilliant/wiki/wiki-header.tsx` | WikiHeader — BTN buttons (lines 39, 87, 94) | hover | transition-all: border-colour and background (#29cc57 -> #15b441 on the green CTA, #ccc -> black on the outline one) | 300ms · Tailwind default ease | /brilliant/wiki |
| `src/components/brilliant/wiki/nav-icons.tsx` | Wiki nav icons (line 10) | group-hover / group-focus-visible | transition-[fill]: fill #666 -> black | 300ms · ease-in-out | /brilliant/wiki |
| `src/components/brilliant/wiki/try-it-yourself.tsx` | TryItYourself — answer option buttons (line 51) | hover / focus | transition-all: text #333 -> #0277bd and box-shadow none -> 0 1px 3px rgba(0,0,0,0.3) | 300ms · Tailwind default ease | /brilliant/wiki |
| `src/components/brilliant/wiki/archive-bar.tsx` | ArchiveBar CTA (line 34) | group-hover | border-bottom and text colour #29cc57 -> #15b441 (transition-colors) | Tailwind default 150ms · Tailwind default ease | /brilliant/wiki |
| `src/components/brilliant/wiki/toc.tsx` | Wiki TOC links (line 52) | hover | colour #777 -> #456DFF | Tailwind default 150ms · Tailwind default ease | /brilliant/wiki |
| `src/components/brilliant/wiki/prose.tsx` | Prose inline links (line 43); same pattern in self-citation.tsx line 42 | hover | colour #456DFF -> #1245ff | Tailwind default 150ms · Tailwind default ease | /brilliant/wiki |
| `src/components/brilliant/legal/legal-footer.tsx` | LegalFooter links and social icons (lines 25-31, 67) | hover | border-bottom -> #456dff, colour -> #456dff. Source explicitly notes NO transition is declared on the original, so these are instant | none — instant by design · n/a | /brilliant/terms-of-use |
| `src/components/sx/lesson-player.tsx` | LessonPlayer — back button and language switch (lines 112, 139-142) | hover / active locale | transition-colors on background and text | Tailwind default 150ms · Tailwind default ease | /lesson/[lessonId] |
| `src/components/sx/primitives.tsx` | Button (lines 39-46) | press (:active) and hover | transition-[transform, background-color, border-color, opacity]; active:scale-[0.98] — deliberately a scale, not a translate, so the block below is not nudged on every tap | 200ms · ease-[var(--ease-sx-out)] = cubic-bezier(0.16, 1, 0.3, 1) | /, /month/[index], /lesson/[lessonId] |
| `src/components/sx/blocks/choice.tsx` | Choice option buttons (lines 51-54) | press and hover (disabled once revealed) | transition-[border-color, background-color, transform]; active:scale-[0.99]; hover border-sx-line -> border-sx-line-strong | 200ms · ease-[var(--ease-sx-out)] | /lesson/[lessonId] |
| `src/components/sx/month-map.tsx` | MonthMap — language switch (lines 83-86) | hover / active locale | transition-colors on the kk/ru toggle | Tailwind default 150ms · Tailwind default ease | / |
| `src/components/ui/button.tsx` | shadcn Button — buttonVariants base (line 9) | hover, focus-visible, active, aria-expanded, aria-invalid, disabled | transition-all covering background, border, ring and transform; active:not-aria-[haspopup]:translate-y-px press nudge; focus-visible:ring-3 | Tailwind default 150ms · Tailwind default ease | none currently — the shadcn Button is not imported by any route or component in src/ |

### Other (23)

| Source | Component | Trigger | Animates | Duration / easing | Route |
|---|---|---|---|---|---|
| `src/app/globals.css` | @media (prefers-reduced-motion: reduce) — global kill switch on *, ::before, ::after | OS reduced-motion setting | animation-duration + transition-duration forced to 0.01ms, animation-iteration-count 1, html scroll-behavior auto | 0.01ms !important · n/a | ALL routes (global) |
| `src/app/globals.css` | @keyframes b-shimmer (lines 325-341) | referenced by animate-[b-shimmer_6400ms_...] utility; infinite loop on mount | left: -100% -> 100% over first 25% of cycle, then opacity 1 -> 0 and holds | 6400ms, infinite · cubic-bezier(.16, 1, 0.7, 1) | /brilliant/app/home (CourseDeck StartButton) |
| `src/app/solvex.css` | @media (prefers-reduced-motion: reduce) scoped to .sx-root (lines 72-81) | OS reduced-motion setting | animation-duration + transition-duration -> 0.01ms, scroll-behavior auto, inside the SolveX product surface only | 0.01ms !important · n/a | /, /month/[index], /lesson/[lessonId] |
| `src/lib/motion.ts` | Shared motion token module (enter, exit, spring, softSpring, rise, fade, stagger, inView) | imported as transition/variants by consuming components | enter 0.55s ease-out-quint [0.23,1,0.32,1]; exit 0.24s ease-out-cubic [0.33,1,0.68,1]; spring stiffness 420 damping 34 mass 0.9; softSpring 160/22/1; rise opacity+y 22px; stagger 0.06s gap;  | 0.55s enter / 0.24s exit · cubic-bezier(0.23,1,0.32,1), cubic-bezier(0.33,1,0.68,1), cubic-bezier(0.645,0.045,0.355,1), springs | consumed on /brilliant/courses (LearningPath, LessonNode). Note: `exit`, `fade`, `softSpring`, `rise`, `stagger`, `inView` and EASE_IN_OUT are exported but currently unimported by any compon |
| `src/components/brilliant/course-map.tsx` | CourseMap — sticky level pill + sticky course card (lines 93, 104) | scroll; browser-native position: sticky (top-20 for the pill, lg:top-24 for the card) | pin/unpin hand-off of the level pill and the left course card | n/a · n/a | /brilliant/courses |
| `src/components/brilliant/course-map.tsx` | CourseMap — zig-zag node offset (line 121) | static layout at lg and up | lg:translate-x-[var(--node-x)] — CSS custom property drives each node's horizontal offset along the path | n/a (static transform) · n/a | /brilliant/courses |
| `src/components/brilliant/about/what-we-teach.tsx` | WhatWeTeach — motion.img inside Base UI Tabs.Panel (lines 106-116) | tab change (only the selected panel mounts, so the img remounts and fades on every switch); Tabs.List has activateOnFocus so arrow keys also fire it | opacity 0->1 of the Math/Coding illustration SVG | 0.7s (0 under useReducedMotion) · [0.25, 0.1, 0.25, 1] (CSS `ease`) | /brilliant/about |
| `src/components/brilliant/about/our-method.tsx` | OurMethod — Base UI Accordion.Panel (lines 104-110) | accordion trigger click; keepMounted with data-starting-style / data-ending-style pinning height to 0 at both ends | height 0 <-> var(--accordion-panel-height) | 200ms · ease-[ease] (CSS `ease`) | /brilliant/about |
| `src/components/brilliant/about/our-method.tsx` | OurMethod — ChevronDown (line 45) | group-data-[panel-open] on the trigger | transform rotate 0 -> 180deg | 200ms · Tailwind default ease | /brilliant/about |
| `src/components/brilliant/faq/faq-section.tsx` | FaqSection — Base UI Accordion.Panel (line 69) | trigger click; keepMounted, single-open, data-starting-style / data-ending-style pin height to 0 | height 0 <-> var(--accordion-panel-height) | 200ms · cubic-bezier(0.25, 0.1, 0.25, 1) | /brilliant/faq |
| `src/components/brilliant/faq/faq-section.tsx` | FaqSection — ChevronDown (line 65) | group-data-[panel-open]/trigger | rotate 0 -> 180deg | 200ms · Tailwind default ease | /brilliant/faq |
| `src/components/brilliant/subject/course-tabs.tsx` | CoursePanel — cross-fade of overlapping tab panels (lines 168-173) | tab click / roving keyboard nav; panels overlap in one grid cell (col-start-1 row-start-1). No auto-advance (disableAutoSlide) and no scroll trigger | opacity 0 <-> 1 plus pointer-events gating — outgoing fades out over 100ms, incoming waits 100ms then fades in over 300ms so they never overlap visibly | in 300ms after 100ms delay; out 100ms · ease-out | /brilliant/math |
| `src/components/brilliant/subject/course-tabs.tsx` | AdditionalCourses — hover popover (lines 68-79) | pointer enter/leave at xl and up; setTimeout(150ms) close delay so the pointer can cross the gap | open/close of the extra-courses list (below xl it is a plain in-place expand button instead) | 150ms close delay · n/a | /brilliant/math |
| `src/components/brilliant/subject/faq.tsx` | AccordionItem — motion.div panel (lines 81-90) | trigger click toggling `open`; initial={false} so no mount animation. Each item toggles independently | height 0 <-> 'auto' with overflow-hidden | 0.2s ({duration: 0} under useReducedMotion) · [0.25, 0.1, 0.25, 1] (CSS `ease`) | /brilliant/math |
| `src/components/brilliant/subject/faq.tsx` | AccordionItem — ChevronDown (lines 72-77) | `open` state | rotate-0 <-> rotate-180 | 200ms · Tailwind default ease | /brilliant/math |
| `src/components/brilliant/lesson/lesson-player.tsx` | LessonPlayer — page fade wrapper, data-visible (lines 77-79) | data-visible flip (currently pinned to 'true'); the reference toggles it on page change | opacity | 200ms in (100ms out in the reference's exit pair) · ease-b-enter = cubic-bezier(0, 0, 0.2, 1); the exit token ease-b-exit = cubic-bezier(0.4, 0, 1, 1) is defined in globals.css but not curre | /brilliant/lesson |
| `src/components/brilliant/app/home-rail.tsx` | HomeRail — left rail (lines 50) | scroll; native position: sticky top-[105px] z-10, 384px wide, lg and up only | pin/unpin of the rail beside the 556px column | n/a · n/a | /brilliant/app/home |
| `src/components/brilliant/gameboard/course-gameboard.tsx` | FooterCard — purple ambience blob (lines 276-280) | mounted with the card; transitions with it | opacity of a 803x386 blur-3xl #9D62FF blob at 40% | 300ms · ease-in-out | /brilliant/app/course |
| `src/components/brilliant/app/you-dashboard.tsx` | YouDashboard — bar chart, summary gradient, arrow glyph (lines 113, 130, 153, 226-256) | render / period change; no transition declared | static — bar heights computed inline as (d.value / Y_MAX) * PLOT_H, the summary card is a linear-gradient(#004E16 -> #001F09), the prev arrow is transform rotate(180 8 8) on the SVG, and the | n/a · n/a | /brilliant/app/you |
| `src/components/brilliant/app/app-icons.tsx` | StreakBolt (lines 120-140) | data-completed state on the original | NOT IMPLEMENTED HERE — the source comment records that the reference transitions stroke, stroke-width, stroke-opacity and fill at lg, driven by three custom properties. Our version swaps fil | n/a in this build · n/a in this build | /brilliant/app/home, /brilliant/app/courses, /brilliant/app/course, /brilliant/app/you |
| `src/components/sx/lesson-player.tsx` | LessonPlayer — sticky header and sticky footer (lines 107, 172) | scroll; header is sticky top-0 z-20, footer is sticky bottom-0 and only mounts once `settled` is true | pin of the bg-sx-bg/92 backdrop-blur-md bars; the footer's appearance is a mount, not a transition | n/a · n/a | /lesson/[lessonId] |
| `src/components/sx/blocks/reading.tsx` | Reading / fill-in inputs and textareas (lines 156-161, 227, 286, 341, 444) | focus | border-colour -> border-sx-primary; no transition declared, so these snap | none — instant · n/a | /lesson/[lessonId] |
| `_quarantine/invented/` | 19 quarantined 'invented' components (lesson-screen, course-card, code-editor, teacher-panel, progress-system, feedback-bar, etc.) | n/a — excluded from the TypeScript project (tsconfig.json line 53) and imported by nothing in src/ | dead motion: 18 imports of motion/react, 43 transition-colors, 24 duration-200, 16 duration-150, 4 transition-transform, 3 animate-spin, 1 transition-shadow, 1 transition-all, 1 duration-300 | n/a · n/a | none — unrouted dead code |
