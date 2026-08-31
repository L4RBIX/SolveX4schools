# Page topology and route map

One Next.js app, route-scoped styling. Tokens are prefixed by origin (`b-` /
`e-`) in `globals.css` so the two design systems cannot collide.

| Source | Route | Surface |
|---|---|---|
| — | `/` | Index hub linking to every clone route |
| `brilliant.org/` | `/brilliant` | Light `#F5F3F1` / `#FFF` |
| `brilliant.org/courses/` + `/courses/<slug>/` | `/brilliant/courses` | Dark `#141414` |
| Brilliant lesson player | `/brilliant/lesson` | Dark `#141414` |
| `elice.io/en` + `/en/ax/lxp` | `/elice` | Light `#FFF` / violet |
| Elice LXP student | `/elice/classroom` | App shell on `#F5F6F8` |
| Elice LXP workspace | `/elice/workspace` | App shell on `#F5F6F8` |
| Elice LXP teacher | `/elice/teacher` | App shell on `#F5F6F8` |

## `/brilliant` — section order
1. Nav — fixed floating white pill bar (scroll-driven CTA)
2. Hero — 760px, `#F5F3F1`, h1 76/500/-1.4px, two pill CTAs, award badges, interactive chart card
3. Stats band — 254px, `#FFF`, three cards (30/400/-0.3px)
4. Koji section — centred 60/500/-1.2px heading on `#F5F3F1`
5. Feature rows ×3 — alternating, 555×387 r20 pastel media panels, 36/400/-0.36px headings
6. Footer

## `/brilliant/courses` — section order
1. Course nav — fixed, dark, active-tab underline
2. Page header — "Learning Paths" 30/700
3. Learning paths ×3 — header + `#1E1E1E` r12 panel of 176×176 r20 tiles with connectors
4. Course map — sticky 487×331 course card + scroll-driven sticky level pills + zig-zag lesson nodes + scroll-to-top

## `/brilliant/lesson` — screen order
Chrome (close × / progress segments / hearts) → 7 screens: intro, explanation,
interactive, question, explanation, question, summary. Bottom bar becomes a
feedback bar on commit.

## `/elice` — section order
Nav → sticky product sub-nav (scroll-driven) → violet gradient hero → logo wall →
stat cards → awards row → feature splits ×3 → content card grid (8) →
dark case-study band → footer

## `/elice/*` app routes
Shared `EliceAppShell`: 240px sidebar (Student / Teacher groups), 64px sticky top
bar with search, notifications and avatar, `#F5F6F8` canvas.
- `/elice/classroom` — welcome row, 4 counting stat tiles, course list with filters, continue-learning panel, weekly activity chart, deadlines, lecture page (curriculum rail / video / notes)
- `/elice/workspace` — file explorer, editable highlighted editor, task + AI hints, run/submit bar, streaming console, test results
- `/elice/teacher` — classroom overview (8/17/5), 30-cell class grid, analytics (donut, skill bars, trend line), common mistakes, assignment manager with a modal form, sortable student table

## Known gaps
- `trial-qazaq-b2.elice.io/lxp/home` is auth-gated and serves an empty DOM. The
  three `/elice/*` app routes are reconstructed from Elice's public product
  surface, not extracted from the tenant.
- Brilliant's lesson player sits behind the signup wall. `/brilliant/lesson` is
  reconstructed from the public dark product surface plus Brilliant's documented
  lesson structure.
- No reference imagery, logos or brand assets are copied. Illustrations are
  redrawn as inline SVG and client marks are neutral placeholders.
