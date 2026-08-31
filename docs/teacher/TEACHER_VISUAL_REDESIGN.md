# Teacher command centre — visual redesign

A presentation-only pass over the seven teacher routes. No metric formula, query,
threshold or contract field changed. `docs/teacher/TEACHER_METRICS.md` is
unamended, and that is the test: if this document had required a change there,
the redesign would have gone too far.

BEFORE frames: `docs/teacher/screenshots/before/`
AFTER frames: `docs/teacher/screenshots/after/`

---

## The problem, in one sentence

The first build was a **report**: it opened with its methodology and made the
teacher find the names. A teacher with three minutes needs a **briefing** — the
situation, then the names, then the evidence.

Everything below follows from inverting that.

---

## 1. The global system

### Tokens — `src/components/teacher/tokens.ts` (new)

The first build set type and ink inline at every call site. Nothing was wrong
with any single choice, and the result was `text-b-fg/40`, `/45`, `/50`, `/55`,
`/60`, `/70`, `/75` all carrying content, plus five sizes for the same rank of
heading. There was no scale for a choice to be wrong against.

| Group | Contents | Rule |
|---|---|---|
| `TYPE` | `page` 22/28 · `section` 17/24 · `subsection` 15/20 · `rowTitle` 15/20 · `body` 14/20 · `meta` 13/18 · `label` 11 caps | Five ranks, no more. `label` is the ONLY sanctioned small-caps and only names a number. |
| `NUM` | `hero` 30 semibold · `figure` 15 medium · `cell` 14 | Always `tabular-nums`. |
| `INK` | `primary` · `secondary` /70 · `muted` /55 · `faint` /35 | **Nothing carrying content below `/55`.** `faint` is only for a zero in a dense column, where the absence of emphasis IS the information. |
| `SURFACE` `LINE` | `page` · `raised` · `inset` · `hover` · `hair` · `edge` | Themed via `light-dark()` throughout. |
| `GAP` `RADIUS` | `band` 40 · `block` 20 · `heading` · `tight` | One rhythm; no arbitrary margins. |
| `MOTION` | 140ms `ease-out`, `motion-reduce:transition-none` **on the token** | See below. |
| `SHELL` | `max-w-[1400px]` | Wider than the learner's `b-shell` (1296). A class of thirty against forty-eight skills is a wider problem. |

**Why not `@theme`.** Tailwind v4 generates utilities from `@theme`, and
`globals.css` is shared with the learner surface and the reverse-engineering
baseline. A teacher-only type ramp does not belong in the global token space.

**Why `motion-reduce` lives on the token.** The global `prefers-reduced-motion`
block in `solvex.css` is scoped to `.sx-root`, and this surface is not under it.
A component writing its own `transition` therefore opts out of the only
reduced-motion guarantee it had. Putting it on `MOTION.base` makes the safe
thing the default thing, and `tests/teacher/visual-discipline.test.ts` fails any
component that writes a transition without it.

### The shell — one control bar

**Before:** seven stacked bands — eyebrow, 32px class name, month chip,
publication chip, a labelled period row, a freshness sentence, tabs. **~370px**
before a fact about a child, identical on all seven routes. At 768 that was a
third of the viewport spent re-stating what the teacher knew when they clicked.

**After:** two rows, **169px**, sticky.

```
9А  [Month 1 · Reading data]  [Not reviewed]  [Dev mode]      [7 days | Month | Course]
Overview  Students  Skills  Lessons  Assessments  Leaderboard    Computed 21:25  (?)
```

- The «МҰҒАЛІМ КАБИНЕТІ» eyebrow is gone. The wordmark and the tabs already say
  where you are.
- The period control lost its `КЕЗЕҢ` caps caption — «7 күн / Ағымдағы ай / Бүкіл
  курс» is self-describing. The label survives as the radiogroup's accessible
  name, which is where a screen reader wants it.
- The freshness paragraph collapsed to a timestamp plus a `Hint`. The sentence
  that stops a teacher reading a stale projection as live is one click away and
  no longer occupies a row on every route forever.
- **Sticky**, because the class and the period are precisely what you lose track
  of halfway down a thirty-row table.

### The development banner

**Before:** a full-bleed amber strip with 13px medium text, above the content, on
every page. It outranked the attention queue.

**After:** a chip in the control bar, with the full sentence on its `title`. It
still cannot be missed and it no longer competes with a child who has not logged
in for three weeks. It renders only outside production — `gateFor` is the only
thing that sets `bypassedForDevelopment`.

### New primitives

| Primitive | Replaces | Why |
|---|---|---|
| `Hint` | Two lines of prose at the top of every band | A `<details>` disclosure: keyboard-operable, announced as a disclosure, works on touch, needs no JS. A tooltip would fail all four. |
| `Distribution` | A full-width 4px stacked bar with four captions underneath | Count first at figure weight, proportional bar beside it. Zero rows are **kept** — «Awaiting review 0» is a fact, and dropping empty rows would make the list's shape depend on the data. |
| `SpineRow` + `Finding` | A bordered card containing a full-width tinted recommendation panel | **The signature element.** See below. |

### The attention row — the signature element

Five bordered cards, each containing a filled blue panel, read as a stack of
incident logs. The frame around every row competed with the row; the tinted box
competed with the reason it was explaining.

Now: a **2px spine** in the status tone on the left edge, where the eye picks it
up while scanning names, and nothing is boxed. The recommendation keeps its own
line, indented behind a `→`, at metadata weight — present, clearly secondary,
impossible to mistake for the evidence above it.

The layout enforces the reading order a teacher actually asks in:

**WHO** (name, 15px medium) → **WHAT** (status, as a word) → **WHY** (the
finding's own sentence, body ink) → **CONTEXT** (skill, date, muted) → **WHAT TO
DO** (indented, after the arrow).

### What was deliberately NOT done

- **No severity tiers.** `LearnerStatus` has one attention state. HIGH / MEDIUM /
  LOW would be a severity the data does not support. The queue's **order**
  already encodes priority through `FINDING_WEIGHT`, and that ordering is real.
- **No second chart.** The class trend is the only one. Every other "chart"
  opportunity on these pages is a distribution, and a distribution is a list.
- **No icon per row.** Icons went only on the tab rail and empty states, where
  they aid scanning. An icon beside every sentence is decoration.
- **No new metric, no new column, no new API call.** The redesign is net
  subtractive.

---

## 2. Per route

Every pair is `before/<route>-1440.png` → `after/<route>-1440.png`, plus AFTER at
1280 / 1024 / 768 / 375.

### Overview — `/teacher`

| | |
|---|---|
| **Before** | Eight identical stat tiles in two rows of four, then the attention queue starting ~700px down at 1280, each row a bordered card containing a full-width tinted recommendation panel. |
| **After** | Four hero figures — active, attention, ready, required work — then the attention queue at ~465px. Trend, weakest skills, hardest lessons, stretch, assessment. The secondary counters (independent, assisted, median practice) moved to a quiet rail **below** the queue. |

`ОҚУШЫ 20` is gone from position one. The roster survives as the *denominator*
of the other three figures — `17 / 20`, `9 / 20`, `3 / 20` — which is where it
was always useful and never as a headline of its own.

The window label («за 7 дней») is stated **once** under the rail instead of four
times as a subtitle, and «Как посчитаны эти числа?» is a `Hint` where two lines
of prose used to be.

### Students — `/teacher/students`

| | |
|---|---|
| **Before** | Eleven equal-weight columns; six identically-loud filter pills. |
| **After** | Six columns: Student (with its findings line beneath) · Status · Current topic · Required progress · Independent · Last activity. Attempts, practice minutes, active days and help taken moved into an expandable detail row. |

The detail `<tr>` is **always rendered and hidden with the `hidden` attribute**,
never unmounted, so nothing leaves the DOM. The chevron is a real
`<button aria-expanded aria-controls>` carrying the learner's name.

Filters became one segmented group with live counts that sum to the roster
(`Все 20 · Требует внимания 6 · Давно не заходил 1 · Ещё не начал 2 · Готов к
сложному 3 · Идёт нормально 8`).

### Student detail — `/teacher/students/[subjectId]`

| | |
|---|---|
| **Before** | Nine sections of equal weight, each with a heading and a description. A report to be filed. |
| **After** | Name + status, one inline metadata rail, then **«Учебная ситуация»** — a two-column *needs attention / going well* summary directly under the identity. Everything below the first rule is visibly evidence for it. |

Where a learner has no named strength the right column says so in a real
sentence — «Пока недостаточно данных, чтобы назвать сильные стороны» — rather
than rendering an empty panel.

The windowed / cumulative split survives and is now **more** explicit: «За
период · за 7 дней» and «Накопительно · с начала курса». That distinction is
load-bearing and the redesign strengthened rather than smoothed it.

### Skills — `/teacher/skills`

| | |
|---|---|
| **Before** | The class × skill matrix as the DEFAULT view, with twenty full names rotated 90° — 132px of vertical text at 768. |
| **After** | **Skills as rows** by default, sorted by how much of the class needs review, so the answer to the page's question is row one before the teacher touches anything. The matrix is the second tab. |

Each row: a proportional five-state strip, then the five counts each carrying its
own **glyph** (`−` `○` `◑` `●` `▲`), an `sr-only` word and a `title`. The legend
sits directly above the table.

The matrix kept every analytical capability and gained initials-with-full-name
headers, a sticky first column and header, larger cells and cross-highlight.

### Lessons — `/teacher/lessons`

| | |
|---|---|
| **Before** | Eight equal numeric columns; the reader divided `0/5` per row in their head. |
| **After** | Completion is one cell — the share at figure weight, the counts beside it, a `Meter` under both. A short bar in a column of long ones IS the answer to "which lesson". |

Small samples now say so: below five starters the row carries a **neutral** chip
(«Начавших мало — 3 ученика»), never amber. Nothing has gone wrong with a lesson
four people opened, and the redesign refuses to imply a content verdict the
sample cannot support.

### Assessment — `/teacher/assessments`

| | |
|---|---|
| **Before** | The learner table forced a ~1290px minimum and escaped its scroll region at 1280, 1024 and 768. |
| **After** | Five columns at any block count. The per-block columns collapsed into one `BlockStrip` cell whose marks differ by **shape first** (solid = met, ring = attempted but short, hollow = untouched) and tone second, each a `role="img"` with its own accessible name. |

The status distribution became the `Distribution` primitive — four counted rows
with proportional bars, replacing the full-width 4px stacked bar with captions
underneath.

The human-review limitation is now a calm left-ruled note, not an amber warning:
it is a deliberate product boundary, and styling it as an error implied
something had broken.

### Leaderboard — `/teacher/leaderboard`

| | |
|---|---|
| **Before** | A large tinted formula panel above the table, read once and in the way thereafter. |
| **After** | Ranking first. The formula and its component notes moved into a «Как считается рейтинг» `Hint` — still complete, still reachable, one click away. |

Top three get weight and a slightly larger numeral. No medals, no gold/silver/
bronze, no trophies. Tied ranks still share a number and still say so. Unranked
learners stay a separate, calm list with their reason.

---

## 2a. What the five-second test found

A reviewer with no product context, given only `after/overview-1440.png`:

- named the right learners in **~5 seconds**
- got the count right (**9 of 20**)
- identified the right root problem — two learners who have never opened
  anything is an *access* problem, not a teaching one
- knew where to click and why, because the recommendation said so

Two genuine criticisms, both acted on or recorded:

1. **«Үнсіз Бірінші / Екінші»** — literally "Silent First / Second" — read as
   placeholder data sitting at the top of the attention queue, and made the
   reviewer doubt the rest of the screen. Fixed: the demo seeder now uses
   ordinary names. A demo whose most urgent rows look fake teaches the reader to
   distrust the real ones.
2. **«Не проверено — ученикам не открывается»** read as an internal QA label.
   It is not — it is a real production state meaning the month is unpublished,
   and a teacher does need it. Recorded as a gap: the wording is engineer-shaped
   and deserves a pass with a real teacher.

---

## 3. Data integrity

Nothing under `schools/teacher/` changed except additive
`labels-extra/*` string modules. Proof:

```
git diff --stat -- schools/teacher/queries.ts schools/teacher/analysis.ts \
  schools/teacher/leaderboard.ts schools/teacher/build-*.ts \
  schools/teacher/contracts.ts schools/teacher/context.ts
```

is empty. The 1,565-assertion teacher suite — which asserts metric *semantics*,
not rendering — is unchanged and still green.
