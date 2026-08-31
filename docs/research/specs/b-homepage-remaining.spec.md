# brilliant.org homepage — sections 7–12 (not yet built)

Extracted live. Section y-offsets are from `getBoundingClientRect().top + scrollY`
at 1512px viewport, total document height **7809px**.

Sections 1–6 (hero, stats band, Meet Koji, three feature rows) are already built.
Everything below is missing from the clone.

## Section order and measured type

| y | Heading | font-size / weight | family |
|---|---|---|---|
| 3453 | Designed to keep you learning | 36 / 400 | CoFo Brilliant |
| 3938 | From grade 5 to college and beyond | 50 / 500 | CoFo Robert |
| 4202 | Covered subjects | 20 / 700 | CoFo Brilliant |
| 4843 | Always on your schedule | 36 / 400 | CoFo Brilliant |
| 5355 | Built by top learning experts | 36 / 400 | CoFo Brilliant |
| 5847 | Students, parents, and teachers love us | 50 / 500 | CoFo Robert |
| 6774 | The best tutor you'll ever have is already here | 50 / 500 | CoFo Robert |

Body paragraphs are `16px / 400`, colour `rgba(0,0,0,0.6)` (note: **0.6**, not the
0.4 used elsewhere on the page).

---

## 7. Designed to keep you learning  (y 3453)
Fourth feature row — same two-column geometry as rows 1–3.

**Body (verbatim):**
> Brilliant is designed to feel like a challenge, not a chore. Streaks, levels, and daily goals motivate you to build on your progress and keep moving forward.

**Media:** ⚠️ Original asset unavailable — the panel is a client-loaded animation
with no standalone file among the extracted assets. Use the remaining unused
extracted clip `/assets/original/brilliant/brilliant.org/videos/homepage/courses/science-refresh.webm`
with its poster, in a `bg-b-sky` / `bg-b-mint` / `bg-b-peach` panel matching the
row-3 alternation. **Do not draw a replacement.**

---

## 8. From grade 5 to college and beyond  (y 3938)
Centred 50/500 CoFo Robert heading, then a **click-driven subject tab bar**, then
a two-column "Covered subjects" list per tab.

**Tabs (verbatim, in order):** `Math`, `Computer Science`, `Science`, `Data Analysis`
- Active pill: `color: #FFFFFF` on a dark fill, `16px / 500`
- Inactive: `color: rgba(0,0,0,0.4)`, `16px / 500`
- INTERACTION MODEL: **click-driven** (no scroll-driven change observed)

**Sub-heading:** `Covered subjects` — `20px / 700`, appears once per column.

**Course list items** — `16px / 400`, `#000`. Extracted (Math column / CS column interleaved by y):
`Arithmetic Thinking`, `Thinking in Code`, `Probability and Chance`, `Thinking in Python`,
`Circuits`, `Probability in Data`, `Visual Algebra`, `Programming with Functions`,
`Digital Circuits`, `Clustering & Classification`, `Solving Equations`, `Algorithmic Thinking`,
`Quantum Computing`, `Regression`, `Quadratics`, `Computer Science Fundamentals`

⚠️ **Partial.** Only the default (Math) tab's lists were captured; the Science and
Data Analysis tab contents were not extracted. Render only the tabs and lists
actually listed above. For tabs whose content is unavailable, render the tab and
an empty state — **do not invent course names.**

---

## 9. Always on your schedule  (y 4843)
Two-column feature row.

**Body (verbatim):**
> Say goodbye to trial-and-error hiring, driving across town, and fitting another thing into your schedule. Koji is there Sunday night before the test, Saturday morning for fun, and the quiet 20 minutes before dinner.

**Media — original asset available:**
`/assets/original/brilliant/brilliant.org/loggedOutHomepage/schedule-desktop.png`
(mobile variant: `schedule-mobile.png`)

---

## 10. Built by top learning experts  (y 5355)
Two-column feature row.

**Body (verbatim):**
> Our curriculum is crafted by award-winning teachers, subject-matter experts, and learning designers from top institutions.

**Media — original asset available:**
`/assets/original/brilliant/brilliant.org/loggedOutHomepage/experts-desktop.png`
(mobile variant: `experts-mobile.png`)

---

## 11. Students, parents, and teachers love us  (y 5847)
Centred 50/500 CoFo Robert heading, then a row of testimonial cards at y≈6050.

**Quotes and attributions (verbatim):**

| Quote | Name | Role |
|---|---|---|
| I learned the basics of Trigonometry in 12 days, I just got into a flow. I’m best in my class now. | Tyler | 10th grader |
| I didn't expect him to learn this fast. He explained how to write algorithms at dinner tonight. | Noah | **none — confirmed absent from the DOM** |
| I wasn’t getting the slope unit in class, but it finally clicked after 20 minutes talking to Koji! | Eliza | 7th grader |
| She'll get stuck on a problem and then yell, 'Never mind, Mom, I got it!' How great is that? | Arianne | **none — confirmed absent from the DOM** |
| They enthusiastically do it outside of class. I had 8th graders say, 'This makes me want to do more math!' | Aaron | Algebra Teacher |

**Corrected 2026-08-22.** The mapping first recorded here was derived from card
order and had Tyler's and Eliza's quotes **swapped**. Re-extracted by walking each
name's own card container; the table above is now correct. Noah and Arianne have
**no role element at all** in the DOM — they were not occluded, so omitting their
role line is the accurate rendering, not a workaround.

Every quote uses curly punctuation (U+2018/U+2019) in the original. Match exactly.

**Portraits — originals available**, one per name:
`/assets/original/brilliant/brilliant.org/images/homepage/testimonials/{tyler,noah,eliza,arianne,aaron}.png`

Name `16px`-ish, role in `rgba(0,0,0,0.4)`. Cards sit in a horizontal row; the
occlusion at capture suggests a carousel/overflow row rather than a static grid.

---

## 12. The best tutor you'll ever have is already here  (y 6774)
Closing CTA band.

**Heading (verbatim, note the missing space in the DOM):**
> The best tutor you'll ever have is already here

**CTA button (verbatim):** `Get started` (y 6957)

⚠️ **Sub-copy unavailable** — no paragraph was captured between the heading and
the button. Render heading + button only.

**Media — original asset available:**
`/assets/original/brilliant/brilliant.org/images/homepage/get-started/photo-desktop-wide.avif`
with `.jpg` fallback; also `photo-desktop` and `photo-mobile` variants.
Use `<picture>` with the avif source first, matching the original's format order.

---

## Footer (y 7709)
**Verbatim (complete):**
`© 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.`

---

## Explicitly unavailable
- Section 7 media (client-loaded animation, no standalone file)
- Science and Data Analysis tab contents in section 8
- Sub-copy in section 12 — **confirmed absent** on two independent reads; not a gap
- ~~Roles for Noah and Arianne~~ — resolved: neither has one
- ~~Full footer legal string~~ — resolved, captured complete
