# Schedule Grid — "Client Meetings (hours)"

**Source:** `/courses/algorithms-greedy-dp/scheduling-problem/scheduling-meetings/` → `#page-2`
**Measured:** 2026-08-25, authenticated, viewport 1470 × 776, `color-scheme: dark`
**Status:** ✅ **COMPLETE.** Every value below is from the widget's own stylesheet or
`getComputedStyle()`. Nothing is read off a screenshot.

---

## 1. Architecture — this is not ordinary DOM

The interactive is a **Web Component with an open shadow root**:

```html
<custom-interactive
  authored-name="LessonSchedulingMeetingsV11_Problem1_Solvable"
  data-testid="interactive-LessonSchedulingMeetings_Problem1_Solvable"
  style="color-scheme: dark">
  #shadow-root (open)
    <style>…</style> ×6
    <div class="viz-elm"> … </div>
</custom-interactive>
```

- Rendered by an **Elm** app (`elm-css-style-wrapper`); class names are content hashes
  (`_dcd6ebb5`, …) and **change whenever the style changes**. Never target them; they are
  reproduced here only to document each state's values.
- Host box measured: `465, 222, 540, 339`.
- Every node carries `data-scene-graph-name` + a live `aria-description`. That is the
  cleanest state channel and it is how the states below were read.

### Scene graph

| `data-scene-graph-name` | parent | `aria-description` (initial) |
|---|---|---|
| `scheduler` | — | `toggleable scheduler timeline` |
| `scheduler-constraints` | scheduler | `2 constraints that must be satisfied` |
| `constraint-0` | scheduler-constraints | `"No conflicts" — status: not yet checked` |
| `constraint-1` | scheduler-constraints | `"Accept 2 meetings" — status: not yet checked` |
| `scheduler-timeline` | scheduler | `hours 9 to 17; 3 events, 0 selected` |
| `scheduler-title` | scheduler-timeline | `Client Meetings (hours)` |
| `event-0` | scheduler-timeline | `10 to 12 hours — unselected` |
| `event-1` | scheduler-timeline | `11 to 15 hours — unselected` |
| `event-2` | scheduler-timeline | `14 to 16 hours — unselected` |
| `canonical-answer` | scheduler | `DO NOT REVEAL — Selected events: [event-0, event-2]` |

---

## 2. INTERACTION MODEL — tap to toggle, **not** drag

The brief and `LOGGED_IN_SCOPE.md` both call this a *drag* grid. **It is not.** Evidence,
all from the DOM rather than appearance:

1. Prompt text: `Tap meeting blocks to construct a valid schedule.`
2. Root `aria-description`: **`toggleable` scheduler timeline**
3. Event CSS declares `cursor: pointer` — never `grab`/`grabbing`, and there is no
   `touch-action`/drag styling anywhere in the widget's stylesheet
4. Empirically: a single `click()` on `event-0` flipped it to `selected`

**Confirmed behaviours**

- Tapping a block toggles it. Selection is a set.
- **Conflicting selections are permitted.** `event-0` (10–12) and `event-1` (11–15) overlap
  and both went `selected` with constraints still `not yet checked`.
- **Validation happens only on `Check`** — never on tap.
- After checking, blocks lose `cursor: pointer` and are locked until `Try again`.
- Constraints evaluate **in order and short-circuit**: with constraint-0 failing,
  constraint-1 stayed `not yet checked` even though 2 meetings *were* selected.

### Puzzle data (exact — use verbatim, do not invent)

```ts
const HOUR_START = 9;   // 9am
const HOUR_END   = 17;  // 5pm
const EVENTS = [
  { id: 'event-0', start: 10, end: 12, lane: 0 },
  { id: 'event-1', start: 11, end: 15, lane: 1 },
  { id: 'event-2', start: 14, end: 16, lane: 2 },
];
const ANSWER = ['event-0', 'event-2'];   // non-overlapping, exactly 2
const CONSTRAINTS = ['No conflicts', 'Accept 2 meetings'];
```

---

## 3. Geometry

### Containers

| Node | Class | CSS |
|---|---|---|
| scheduler root | `_242490fe` | `display:flex; flex-direction:column; width:100%; height:100%; gap:20px` |
| constraints | `_3c18fb95` | `display:flex; flex-direction:column; gap:12px` |
| constraint row | `_ba3dbc82` | `display:flex; flex-direction:row; align-items:flex-start; gap:8px; white-space:normal` |
| timeline panel | `_380c4581` | `border-radius:12px; border:2px solid; overflow:auto; font-family:"CoFo Brilliant",sans-serif; user-select:none; -webkit-tap-highlight-color:transparent` |
| title row | `_a2309fd0` | `padding-top:8px; text-align:center; display:flex; align-items:center; justify-content:center; font-weight:500; font-size:16px` |
| grid body | `_1e93b817` | `display:flex; flex-direction:row; border-radius:8px; height:216px; padding-right:8px; padding-top:14px; padding-bottom:18px; margin:8px` |
| axis column | `_7aa0375f` | `min-width:36px; width:auto; height:100%; margin-right:4px; position:relative; overflow:visible` |
| plot column | `_1bd95dc5` | `flex:1; position:relative; height:100%` |

Measured: grid body `475, 335, 520, 216`; axis col `475, 349, 36, 184`;
plot col `515, 349, 472, 184`. Plot height **184px** = 216 − 14 − 18.

### Time → position

8 hours (9→17) over the plot column. Gridlines sit at
**0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100 %** (9 lines).

Event blocks are inset **one 216px-pixel** beyond the hour line on each edge, so the
authored denominator is 108 (= 216/2) rather than 100:

```
top    = ((start - 9) * 13.5 - 0.5) / 108 * 100%
height = ((end - start) * 13.5 + 1)  / 108 * 100%
left   = calc(lane * 33.3333% + 4px)
width  = calc(33.3333% - 8px)
```

Verified against the shipped values:

| event | top | height |
|---|---|---|
| `event-0` (10→12) | `12.037037037037036%` = 13/108 | `25.925925925925924%` = 28/108 |
| `event-1` (11→15) | `24.537037037037038%` = 26.5/108 | `50.925925925925924%` = 55/108 |
| `event-2` (14→16) | `62.03703703703704%` = 67/108 | `25.925925925925924%` = 28/108 |

Each event occupies its **own lane** (0/1/2) — the horizontal offset encodes overlap only.

Common to every event block:
`position:absolute; border-width:2px; border-style:solid; border-radius:4px;
box-sizing:border-box; overflow:hidden` and, once checked,
`transition: background-color 100ms`.

### Gridlines & axis labels

- Gridline: `position:absolute; left:0; width:100%; height:0;
  border-bottom:1px solid rgba(255,255,255,0.2)` *(dark; light = `rgba(0,0,0,0.1)`)*
- Label: `position:absolute; right:0; transform:translateY(-50%); font-size:13px;
  text-align:right; white-space:nowrap; color:#FFFFFF` *(dark)*
- Only **three** labels: `9am` @ `top:0%`, `1pm` @ `top:50%`, `5pm` @ `top:100%`

---

## 4. Colour states — dark theme

The widget authors every colour as `light-dark(<light>, <dark>)`. Dark values below;
light values in parentheses.

### Timeline panel

| State | background | border |
|---|---|---|
| default | `#142563` (`#ECF0FF`) | `#294BC6` (`#ABBDFF`) |
| checked · incorrect | `#4C4C4C` (`#F2F2F2`) | `#666666` (`#CCCCCC`) |
| checked · correct | `#001F09` (`#EAFAEE`) | `#009B2B` (`#9FE8B3`) |

Plot + axis columns: `#000000` (`#FFFFFF`).

### Event blocks

| State | background | border |
|---|---|---|
| unselected | `#142563` (`#ECF0FF`) | `#294BC6` (`#ABBDFF`) |
| unselected **:hover** | `#213C9E` (`#DAE2FF`) | `#375CE3` (`#7491FF`) |
| selected | `#375CE3` (`#7491FF`) | `#7491FF` (`#375CE3`) |
| checked · selected · **wrong** | `#D7A613` (`#F9D25C`) | `#F9D25C` (`#D7A613`) |
| checked · selected · **right** | `#15B441` (`#5ED981`) | `#5ED981` (`#15B441`) |
| checked · unselected | `#383838` (`#F8F8F8`) | `#4C4C4C` (`#E5E5E5`) |

> `:hover` exists **only** on unselected blocks. Selected and post-check blocks have none.

### Constraint rows

| State | icon colour | icon |
|---|---|---|
| not yet checked | `#B3B3B3` (`#808080`) | arrow `→` |
| unsatisfied | `#FCE49D` (`#B78900`) | cross `✕` + shake |
| satisfied | `#5ED981` | check `✓` |

Row height `19.5px`, `display:flex; align-items:center`.

**Shake on unsatisfied** — applied to the row:
```css
animation: _3d343bbe 100ms ease-in-out 4 alternate;
@keyframes _3d343bbe { 0% { transform: translateX(0); } 100% { transform: translateX(4px); } }
```
Total 400ms, oscillating 0 → 4px.

### Icons (16px, `fill="currentColor"`)

```
arrow  viewBox="0 0 16 16"  M6.55239 4.39646L7.97424 2.97461L13.5 8.5004L7.97424 14.0262L6.55239 12.6043L9.65089 9.50584H2.5L2.5 7.49504H9.65098L6.55239 4.39646Z
cross  viewBox="0 0 16 17"  M8 6.62069L4.37931 3L3 4.37931L6.62069 8L3 11.6207L4.37931 13L8 9.37931L11.6207 13L13 11.6207L9.37931 8L13 4.37931L11.6207 3L8 6.62069Z
check  viewBox="0 0 16 16"  M14 4.99965L12.5882 3.58789L6.58824 9.58789L3.41176 6.41141L2 7.82317L6.58827 12.4114L14 4.99965Z
```

### Misc widget classes

- `_1d6ac998` — `font-size:15px; line-height:1.3; color:#FFFFFF` (dark)
- `_3a0361b2` — `font-size:16px; color:#ECF0FF; display:flex; align-items:center;
  justify-content:center; width:100%; height:100%; padding:4px`
- `_bdc2dc55` (tutor overlay) — `position:absolute; inset:0; z-index:39; pointer-events:none`
- `_eca1591f` — `display:none` (used for `canonical-answer`)
- SVG filter defs available to the overlay: `tutor-small-blur`, `tutor-big-blur`,
  `tutor-small-drop-shadow`, `tutor-big-drop-shadow`
- Overlay keyframes:
  ```css
  @keyframes tutorDotPopIn  { 0%{transform:translate(-50%,-50%) scale(0);opacity:0}
                              60%{transform:translate(-50%,-50%) scale(1.12);opacity:1}
                              100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
  @keyframes tutorDotPopOut { 0%{…scale(1);opacity:1} 30%{…scale(1.12);opacity:1}
                              100%{…scale(0);opacity:0} }
  ```

---

## 5. Player chrome per result state

### Lesson card border (`[data-animate][data-panel]`, radius 24px, bg `#141414`)

| State | border |
|---|---|
| default | `2px solid rgba(255,255,255,0.2)` |
| incorrect | `2px solid #B78900` |
| correct | `2px solid #009B2B` |

*(The outer green halo seen on success is not a `box-shadow` on this element — `boxShadow`
computed to `none`. Locate its source before reproducing.)*

### Footer CTAs — all `button3d`, height 48, radius 60px, padding `14px 24px`

The secondary + primary pair always totals **367px**, matching the single-button width.

| State | buttons | face bg | face colour | lip shadow | width |
|---|---|---|---|---|---|
| unanswered | `Check` | `#E5E5E5` | `#000000` | `#B3B3B3` | 367 |
| incorrect | `Get help` | `rgba(255,255,255,0.2)` | `#FFFFFF` | `rgba(255,255,255,0.05)` | 112 |
| | `Try again` | `#F7C325` | `#5C4400` | `#B78900` | 246 |
| correct | `Why?` | `rgba(255,255,255,0.2)` | `#FFFFFF` | `rgba(255,255,255,0.05)` | 100 |
| | `Continue` | `#29CC57` | `#FFFFFF` | `#15B441` | 259 |

`Start over` (with a rotate-ccw icon) sits above the panel, right-aligned; it dims to a
disabled look once an answer has been checked.

### Koji speech bubble — incorrect

Text (verbatim): `Hmm, not quite. Tap the 'Get help' button if you want to work through it together.`

```css
background: #B78900;           /* same hue as the card border */
color: #FFFFFF;
font-size: 16px; line-height: 24px; font-weight: 500;
padding: 12px 20px;
border-radius: 16px 16px 16px 4px;   /* notched toward Koji */
border: 0.5px solid #B78900;
max-width: 262px;
```
Measured box `116, 534, 262, 101`.

### Progress bar (top bar)

- Track `592 × 12`, `rgba(255,255,255,0.2)`, radius 9999px, `overflow:hidden`
- Fill: `background-color: #9FE8B3`, radius 9999px, **`transition: width 0.2s`**
- After solving page 2 the fill measured **113 / 592 px ≈ 19.1%**

### Koji Rive canvas

- CSS box `0, 618, 128, 168` — flush to the viewport's left edge, above the dock
- Backing store `256 × 336` → rendered at **DPR 2**
- Streak popover canvas: CSS `200 × 185`, backing `400 × 370`

---

## 6. Implementation notes

- Reproduce the widget as ordinary React + CSS; there is no need for shadow DOM or Elm.
  Keep the `data-scene-graph-name` attributes — they make the states testable.
- Drive colours from the six-state table, not from ad-hoc conditionals.
- `light-dark()` is used natively; the clone is dark-only unless a light mode is wanted, in
  which case both columns above are already recorded.
- Do **not** reproduce `canonical-answer` as visible DOM. Keep the answer in module state.
- Blocks must become inert after `Check` and re-enable on `Try again`.
