# Behaviour bible — extracted from the live references

Every entry below was observed directly in the browser. Interaction models are
recorded explicitly because getting one wrong means a rewrite, not a CSS tweak.

## brilliant.org

| Behaviour | Model | Detail |
|---|---|---|
| Nav "Get started" button | **scroll-driven** | Absent at scroll 0 on the homepage; appears alongside "Sign in" past ~600px. The bar itself stays white and pill-shaped throughout. |
| Course-page level indicator | **scroll-driven** | The `LEVEL n` pill is `position: sticky` and swaps which level it shows as each level's node group passes. Verified by scrolling only — no clicks. Active pill: `2px solid #4A5CD6` + `0 4px 0 0 #4A5CD6`. Inactive: `2px solid rgba(255,255,255,0.2)` + matching edge. |
| Lesson node open | **click-driven** | Clicking a node expands an inline detail card *below* it — not a modal — with a centred title and a full-width blue `Start` button. One at a time. |
| Node lock states | static | Locked nodes render the same disc desaturated to ~40% opacity. |
| Raised objects | static | Universal: `2px` border + `box-shadow: <border-colour> 0 4px 0 0`. **No blurred shadow appears anywhere on the product pages.** |
| Homepage hero demo | **drag-driven** | A draggable point on a small chart raises/lowers a beaker fill, with a dashed guide line between them. A cursor graphic hints at it on load. |
| Homepage media panels | scroll-driven reveal | 555×387 r20 pastel panels (`#F0F8FA`, `#E7EEE2`, `#FFEDE0`) hold looping video/animation, revealed on scroll. |
| Scroll-to-top | click | Floating 48px circular button pinned to the bottom of the lesson-path column. |

## elice.io

| Behaviour | Model | Detail |
|---|---|---|
| Product sub-nav underline | **scroll-driven** | The active section underline moves on its own while scrolling (`Education Contents` → `View Contents` → `Main Features` observed without any click). IntersectionObserver, not tabs. |
| Main nav dropdowns | hover-driven | Full-width mega panel drops below the bar with grouped links and small rounded icon tiles. |
| Stat numerals | scroll-driven | Large violet/blue numerals in gradient cards. |
| Feature splits | scroll-driven reveal | Alternating text / product-mockup columns; the mockup is a lavender rounded frame with a floating white UI card inside. |
| Case-study band | static | A dark `#2A2A2A` band breaking the otherwise white page. |
| Radii | static | Buttons `8px`; cards `12–20px`; only the logo pill is fully round. Shadows are soft and blurred — the exact inverse of Brilliant. |

## Accessibility notes carried into the clone
- Brilliant's lesson options are a two-step commit (select, then Check) — preserved.
- Elice's sortable tables need `aria-sort`; charts need legends plus a text alternative.
- Both sites rely on hover for some affordances; the clone adds keyboard equivalents
  (arrow-key divider control, focusable chart dots) without changing the visuals.
