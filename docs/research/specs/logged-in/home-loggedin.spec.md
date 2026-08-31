# Logged-in Home — `/home/`

**Measured:** 2026-08-25, authenticated as `bekarys`, viewport **1470 × 776**
**Status:** layout skeleton measured; component-level styles outstanding.

> **Account state differs from the task brief.** The brief describes a streak card "with 5
> days" filled and a populated dashboard. The live account was at **0 XP with no streak
> started** — the card read `Solve 3 problems to start a streak` with all five day pills
> empty. Layout is cloned from the real DOM; **data is mocked** per the personal-data rule.

---

## Page frame

- `document.documentElement.scrollHeight`: **815px** — the page does not scroll meaningfully
  at desktop height; it is a single view.
- Content block spans x **239 → 1231** = **992px** wide, centred in 1470.
- Two columns: **left 384px** + **gap 52px** + **right 556px**.

## Left rail — sticky

```
panda-ai_flex-start panda-d_none lg:panda-d_flex panda-flex-d_column panda-gap_5
panda-h_fit-content panda-mt_10 lg:panda-min-w_338px 2xl:panda-min-w_384px
panda-pb_7 panda-pos_sticky panda-top_[105px] lg:panda-w_338px 2xl:panda-w_384px
panda-z_docked
```

- **`position: sticky; top: 105px`**
- `display: none` below `lg`; flex column at `lg`+
- Width **338px at `lg`**, **384px at `2xl`** (measured 384 at 1470)
- `gap: 20px` (`gap_5`), `margin-top: 40px` (`mt_10`), `padding-bottom: 28px` (`pb_7`)

Children, measured (x, y, w, h):

| # | Element | Box | Notes |
|---|---|---|---|
| 1 | `Welcome, bekarys` | `239, 105, 384, 30` | mock the name |
| 2 | Ask bar | `239, 155, 384, 52` | pill; `border-radius: full`; placeholder `What do you want to learn?` + `Ask` |
| 3 | Streak card | `239, 227, 384, 248` | |
| 4 | Leagues card wrapper | `239, 495, 384, 108` | flex column, `gap: 20px` |

### Streak card content (verbatim)
`0` · `Streak Charges` · `Solve 3 problems to start a streak` · day pills `T` `W` `Th` `F` `S`

Five day pills, each a circular lightning glyph above its label. `Streak Charges` is a
label on the two pill-shaped slots at the card's top right.

### Leagues card content
`Unlock Leagues` — rendered uppercase via **CSS `text-transform`**, *not* literal text.
Second line `0 of 175 XP`. Shield icon:
`public/assets/original/brilliant/brilliant.org/images/loggedInHomepage/leagues-locked.svg` ✅

> Caught by measurement: searching the DOM for the literal string `UNLOCK LEAGUES` fails.
> Copy the cased source text and apply `text-transform: uppercase`.

## Right column — `Jump back in`

- Heading class `panda-d_none lg:panda-d_block panda-h_30px panda-w_full` — **hidden below `lg`**
- Box `675, 105, 556, 30`
- Below it: a **stacked card deck** (offset siblings visible behind the front card)
- Front card: `Algorithmic Thinking` / `LEVEL 1` / illustration / two lesson rows
  (`The Scheduling Problem`, `Solving Instances`) / `Start` CTA (purple `button3d`)
- Below the deck: a **5-item course thumbnail switcher**

### Responsive — measured
At a **508px** viewport the layout collapses: the left rail disappears entirely, the card
goes full-width, and the **thumbnail switcher is replaced by 5 dots**. The exact breakpoint
was not pinned; Panda's `lg` token governs it.

## Assets ✅ downloaded

| File | Use |
|---|---|
| `chapter/Algorithmic_Thinking-ZSOEgi.png` | course art + thumbnail 1 |
| `chapter/total-AuJUe6.png` | thumbnail 2 |
| `chapter/puzzle-science-vL2Jb1.png` | thumbnail 3 |
| `chapter/Probability_And_Chance-qRuc60.png` | thumbnail 4 |
| `chapter/how-llms-work-xk99Hz.png` | thumbnail 5 |
| `images/loggedInHomepage/leagues-locked.svg` | leagues shield |

No `.riv`, `.webm` or `.mp4` was requested by `/home/` — the resource registry
(`performance.getEntriesByType('resource')`, after a full scroll) listed only
17 woff2, 6 png, 3 svg, 4 json. The streak pillars on this surface are therefore **not**
Rive here.

## Real routes discovered

| Surface | URL |
|---|---|
| Logged-in home | `/home/` |
| Course map | `/courses/algorithms-greedy-dp/` |
| Lesson player | `/courses/algorithms-greedy-dp/scheduling-problem/scheduling-meetings/` |
| Dashboard | `/you/` |

## Outstanding

Computed styles for every card, the ask bar, day pills, the card deck stacking geometry,
the thumbnail switcher, the top nav, and hover/active states.
