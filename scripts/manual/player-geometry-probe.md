# Task player geometry — the checks vitest cannot make

vitest here is node-only: no jsdom, no layout engine. A scroll origin is a
layout fact, so the invariant that matters most can only be measured in a real
browser. `tests/school/player-geometry.test.ts` pins the CSS property that
caused the bug; this measures the consequence.

## The bug, measured

`/assessment/1` at 1440×900, before the fix:

| | |
|---|---|
| scroll container | `clientHeight` 720, `scrollHeight` 912 |
| card top | **96px above the container's first scrollable pixel** |
| `scrollTop` | 0 — and it could not go lower |

`LessonPage` was `flex flex-col items-center justify-center overflow-y-auto`.
`justify-content: center` splits the overflow between both ends; the top end
lands above the scroll origin, and a browser cannot scroll to a negative
offset. The task statement was not off screen — it was **unreachable**.

After: card top `+32` (the container's own `py-8`), `scrollTop: 0`,
`scrollHeight` 841 scrolling its full length.

## The invariant

For every task, at every width:

```
card.top >= scroller.top      // nothing above the scroll origin
document.scrollWidth <= clientWidth   // no page-level horizontal overflow
```

Short content additionally centres: `gapAbove ≈ gapBelow`.
Long content top-anchors: `gapAbove == padding`, and it scrolls.

## Results, real Chrome

Routes × widths, `CLIP` = card above scroll origin, `HOVF` = horizontal overflow:

```
assessment  (coding, LONG)   1440:ok  1280:ok  1024:ok  768:ok  375:ok
lesson l12  (coding)         1440:ok  1280:ok  1024:ok  768:ok  375:ok
lesson l6   (MCQ/explain)    1440:ok  1280:ok  1024:ok  768:ok  375:ok
lesson l4   (trace/reorder)  1440:ok  1280:ok  1024:ok  768:ok  375:ok
lesson l1   (concept SHORT)  1440:ok  1280:ok  1024:ok  768:ok  375:ok
failures: 0
```

Short/long branch, same build:

```
SHORT concept @1440x1400   overflows=false  gapAbove=265  gapBelow=265  -> CENTRED
LONG assessment @1440x900  overflows=true   gapAbove=32   scrolls      -> TOP-ANCHORED
```

## Running it

```js
// with a logged-in storageState
const scroller = [...document.querySelectorAll("div")].find(e =>
  /overflow-y-auto/.test(e.className) && e.querySelector("[data-lesson-page-components]"));
const card = scroller.querySelector("[data-lesson-page-components]");
const s = scroller.getBoundingClientRect(), c = card.getBoundingClientRect();
console.log("clipped above:", Math.round(s.top - c.top));   // must be <= 0
console.log("h-overflow:", document.documentElement.scrollWidth > document.documentElement.clientWidth);
```

`data-lesson-page-components` is the stable hook this probe depends on; the
vitest suite asserts it still exists.
