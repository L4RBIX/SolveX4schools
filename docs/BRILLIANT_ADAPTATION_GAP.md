# Brilliant → SolveX4Schools — adaptation gap

Required before any code changed. Compares what the cloned Brilliant runtime
at `/brilliant/*` actually does against what the custom SolveX routes (`/`,
`/month/1`, `/lesson/m1.l1`) built beside it.

**Finding, stated plainly: the Brilliant runtime was bypassed, not adapted.**
A parallel student UI was built next to a richer one that already worked. Of
93 components inventoried, 92 are reusable and exactly one
is worth removing. Almost none of them were used.

> **Correction, 2026-09-02 — the ask control is gone.** Four places below still
> read as though the home rail and `/program` carry a «Что хочешь разобрать?»
> bar. They did until this release. It was a `<button>` with no `onClick`, no
> state, no handler and no endpoint anywhere in the repository — driven in
> Chromium it produced zero network requests, no navigation and no panel — so it
> was removed from `home-rail.tsx`, `learning-paths.tsx` and `labels.ts` rather
> than wired up. The two plan steps at "Step 3" and "Step 10" that say *drop
> AskBar* / *delete AskBar* are now actually done; the reference-runtime
> descriptions in the tables are left as measured, because they describe
> brilliant.org and that is still what brilliant.org has.
>
> Nova is untouched by it. Nova's four entry points are all inside the lesson —
> the floating avatar, the «Спросить Nova» pill, «Помощь» and «Почему?» — and
> none of them read any label the removal deleted. `L.ask` was the dead bar;
> `L.askNova` is the live pill, and they are one character apart in a grep.
>
> The rail was rebalanced rather than merely shortened: the bar was 72px of the
> column (52px control + one 20px gap) at both 1440 and 375, so the greeting was
> given real weight (20/30 → 26/32) and the weekly-goal card was promoted into
> the space, where it is the one card carrying a number a learner can act on.

---

## 1. Classification of every visible part

Vocabulary as requested: PRESERVED (the Brilliant implementation is used),
REIMPLEMENTED (a worse copy was built), LOST (existed, now absent from the
product surface), DEGRADED (survived but with less fidelity), NOT YET MAPPED.

| Surface | Verdict | What the Brilliant runtime has | What the custom UI did |
|---|---|---|---|
| **Landing hero** | LOST | `hero.tsx` — serif display h1, split composition, autoplaying product clip seeked to 16.5s, `.b-press` CTA physics, mobile `order` reshuffle | No landing exists in the product. `/` was replaced with a vertical month timeline. |
| **Floating nav pill** | LOST | `nav.tsx` — 58px rounded-full bar, AnimatePresence CTA that slides in past 600px of scroll | Replaced by a plain bordered header. |
| **Marketing feature rows** | LOST | `feature-row.tsx` — alternating pastel panels, framer-motion scroll reveal with a staggered copy delay, IntersectionObserver-gated video | Absent. This is the single most reusable component in the tree (zero Brilliant strings) and it was not used. |
| **App header** | LOST | `app/app-header.tsx` — sticky 65px bar, three nav links with an animated active underline, XP/streak pill | Replaced with a bespoke header carrying a language toggle. |
| **Logged-in home** | REIMPLEMENTED | `app/home-rail.tsx` (welcome, ask bar, streak card, leagues card) + `app/course-deck.tsx` (3D perspective card stack, thumbnail switcher rail) | Replaced by a flat vertical list of nine month rows on a spine. The 3D deck, the streak card and the switcher rail were all discarded. |
| **Courses / learning paths** | REIMPLEMENTED | `app/learning-paths.tsx` + `path-tile.tsx` — path rows with category art, horizontal course carousels, per-course progress bars, favourite stars, difficulty eyebrows | Replaced by the same flat month list. No carousel, no tiles, no path grouping. |
| **Course gameboard / milestones** | REIMPLEMENTED | `gameboard/course-gameboard.tsx` — sticky per-level headers, zig-zag node path, click-to-select with a Rive pedestal swap, IntersectionObserver-driven sticky footer CTA, scroll-to-top | Replaced by `month-detail.tsx`: plain rows in boxes. The single largest fidelity loss in the migration. |
| **3D pedestals** | LOST | `gameboard/gameboard-pedestal.tsx` + `app/pedestal.tsx` — Rive `Gameboard Node` artboard with `select`/`active` boolean inputs, purple glow, greyed locked state | Nothing equivalent. Lesson state was rendered as a coloured circle. |
| **Lesson player shell** | REIMPLEMENTED | `lesson/lesson-player.tsx` — fixed inset card whose 2px border IS the verdict channel, horizontal page track on a sampled spring, 80px footer CTA strip | Replaced by a scrolling page with a sticky header and footer. Track, card and border channel all discarded. |
| **Lesson top bar** | REIMPLEMENTED | `lesson/lesson-chrome.tsx` — 592px progress track plus three trailing segment pills, always-mounted nav arrows that fade rather than unmount | Replaced by an equal-width segmented bar. |
| **3D button** | REIMPLEMENTED | `lesson/button-3d.tsx` — variable-driven lift and lip (`--button3d-translate-y`/`--button3d-shadow-y`) collapsing together on press; five verdict variants | Replaced by a flat button with a 0.98 scale. |
| **Koji tutor** | LOST | `lesson/koji.tsx` — real Rive artboard `NEST_Koji_Built`, reaction timelines `success-medium` / `incorrect`, speech bubble matched to the verdict hue | No tutor presence at all in the custom player. |
| **Progress dashboard** | LOST | `app/you-dashboard.tsx` — week/month/year segmented control, summary card, activity tiles, bar chart | Not carried over. |
| **Curriculum manifest** | PRESERVED | n/a — new work | 9 months, 48 skills, September 36/36, validator, traceability. Correct and kept. |
| **Learning Intelligence adapter** | PRESERVED | n/a — new work | Attempt bridge, verdict vocabulary, attestation signer, migration 0007. Correct and kept. |
| **Answer-checking rules** | DEGRADED | n/a — new work | Correct rules, but welded into React components. Now extracted to `schools/learning/checking.ts` so they survive the renderer swap. |
| **Bilingual kk/ru UI** | NOT YET MAPPED | n/a — Brilliant chrome is hardcoded English throughout | The custom tree had a locale provider; every Brilliant label is a literal. Localisation is migration work, not a component gap. |
| **Nine mandated visualisers** | NOT YET MAPPED | `lesson/schedule-grid.tsx` is the closest interactive pattern but is not a substitute | step_execution, loop_trace, binary_search, two_pointers, recursion_tree, bfs_wave, dfs_walk, sorting, dp_table are unbuilt in both trees. |

Totals: **LOST** 7, **REIMPLEMENTED** 6, **PRESERVED** 2, **NOT YET MAPPED** 2, **DEGRADED** 1.

Only three entries are PRESERVED, and all three are curriculum/intelligence work
rather than presentation. Every student-facing surface was either reimplemented
worse or dropped.

---

## 2. Why this was architecturally wrong

Not a matter of taste. Four concrete consequences:

1. **Fidelity was thrown away for free.** 121 animations exist in the clone. The
   custom tree shipped two keyframes (`sx-rise`, `sx-nudge`). The 3D card stack,
   the Rive pedestals, the verdict border channel, the sampled spring on the page
   track, the scroll-revealed nav CTA and the viewport-gated feature videos were
   all present, working, and unused.

2. **Two student UIs cannot both be maintained.** Every future change would have
   had to be made twice, and the worse one was the one users would see.

3. **The reverse-engineering work stopped paying rent.** The measured tokens, the
   Panda-derived button physics and the enumerated Rive artboards were reduced to
   a museum route.

4. **It reads as a homemade LMS.** Side by side, the custom `/month/1` and the
   clone's gameboard are recognisably different products — which is the explicit
   failure condition.

---

## 3. Component reuse verdicts

All 93 components, classified for reuse:

| Verdict | Count | Meaning |
|---|---|---|
| REUSE_EXACTLY | 47 | point it at new data; do not open the file |
| REUSE_WITH_DATA_CHANGES | 29 | swap the content module it reads |
| ADAPT_MINIMALLY | 16 | lift literals into props, keep everything else |
| REMOVE | 1 | meaningless outside Brilliant's business |

**Not one component needed rebuilding.** 1 is worth removing:
`src/components/brilliant/app/app-icons.tsx` — It is a competitor's registered wordmark and has no meaning outside Brilliant — replace with the new brand's wordmark component keeping the same `{className}` signature so AppHeader needs no edit.

### The ten highest-stakes components, adversarially verified

Each was checked by an agent instructed to *refute* the claim that it can be reused.

| Component | Verdict | Blocking issue |
|---|---|---|
| `hero.tsx` | REUSABLE_AFTER_PROP_EXTRACTION | SCOPE MISMATCH — the biggest one. This component contains no repeater of any kind. It renders exactly: 1 headline, 1 paragraph, 2 CTAs, 2 badges, 1 video. There is no list, no map(), no children slot. |
| `home-rail.tsx` | NEEDS_STRUCTURAL_CHANGE | CONTENT HARDCODED IN JSX: AskBar (lines 109-139) accepts no props at all - 'What do you want to learn?' (line 131) and 'Ask' (line 135) are literals. This alone refutes 'data changes alone'. |
| `course-deck.tsx` | NEEDS_STRUCTURAL_CHANGE | FIXED CARD HEIGHT vs REAL LESSON COUNT (hard). `h-[540px] max-h-[540px]` (79) inside `overflow-hidden` (94) / `overflow-clip` (98), lesson rows `min-h-[60px]` (169), image is `max-h-[150px] w-[150px]  |
| `learning-paths.tsx` | NEEDS_STRUCTURAL_CHANGE | No props at all. `LearningPathsPage()` reads the module-scope `LEARNING_PATHS` const directly, so 'data changes alone' literally means editing paths-data.ts in place — you cannot feed it anything from |
| `path-tile.tsx` | REUSABLE_AFTER_PROP_EXTRACTION | HARDCODED COPY: the badge text "New" is a literal in the JSX (line 339), not a prop — `isNew` only toggles visibility. Data changes alone cannot make it say ЖАҢА / НОВОЕ. |
| `course-gameboard.tsx` | REUSABLE_AFTER_PROP_EXTRACTION | NO PROPS AT ALL. The component is a zero-argument function reading three module singletons. "Data changes alone" today literally means editing course-data.ts in place — you cannot render two different |
| `gameboard-pedestal.tsx` | NEEDS_STRUCTURAL_CHANGE | LEGAL / ASSET: line 29 hardcodes `/assets/original/brilliant/brilliant.org/rive/koji-gameboard.e2320c48.riv` — a 986KB proprietary Brilliant file containing their Koji mascot (input names koji_appear  |
| `lesson-player.tsx` | NEEDS_STRUCTURAL_CHANGE | ZERO PROPS. `export function LessonPlayer()` (line 45). Not 'a const to extract into a prop' — there is no data seam at all. |
| `lesson-chrome.tsx` | REUSABLE_AFTER_PROP_EXTRACTION | It renders NO content and has no surface to render content into: no `children`, no title, no label, no slot. Every DOM node is chrome (close button, invisible spacer, two arrows, one bar, three pills, |
| `schedule-grid.tsx` | NEEDS_STRUCTURAL_CHANGE | HARDCODED CONTENT IN JSX: `hourLabel()` (l.95-99) generates axis labels internally as English 12-hour am/pm. There is no formatter prop. `labelledHours` only chooses WHICH hours get a label, never WHA |

`NEEDS_STRUCTURAL_CHANGE` here means *the component takes no props at all* —
six of the ten import their content directly at module scope. That is a prop
extraction, not a rebuild, and it is the bulk of the migration work.

---

## 4. Migration order

**Step 1 — Extract every checker, contract and rule out of the sx renderers into a pure, React-free domain module. Nothing is deleted yet and no UI changes — this step exists so that when the sx tree goes, the pedagogy does not go with it. Move `Verdict` (4 states), `BlockResult`, `BlockProps`, `lookupFailureClass`, and add checkPrediction / checkMultipleChoice / checkFillBlank / checkReorder / seedOrder / checkFindBug / checkTrace / traceVarNames / checkTestCase / codeTaskResult. Every one keeps its exact current contract, including the test_case 'never wrong' asymmetry and the find_bug trailing-newline strip.**

- `CREATE schools/learning/grading.ts`
- `MODIFY schools/learning/index.ts (re-export grading; keep ./sign unexported so node:crypto never reaches a browser bundle)`
- `READ-ONLY SOURCE src/components/sx/blocks/types.ts`
- `READ-ONLY SOURCE src/components/sx/blocks/choice.tsx`
- `READ-ONLY SOURCE src/components/sx/blocks/code.tsx`
- `READ-ONLY SOURCE src/components/sx/blocks/reading.tsx`
- `READ-ONLY SOURCE src/components/sx/primitives.tsx (Verdict type only)`
- `CREATE tests/school/grading.test.ts`

*Verify:* npx tsc --noEmit passes. New vitest suite covers: checkTestCase returns 'unknown' (not 'wrong') for an unenumerated input; checkFindBug on m1.l1.b4 with picked=2 returns failureClass 'string_vs_number_confusion'; checkPrediction on m1.l1.b2 with '4' returns the same; checkFillBlank on m1.l2.b2 fails when only one blank is right. The sx tree still renders unchanged at /lesson/m1.l1 because nothing imported the new module yet.

**Step 2 — Resolve the Verdict collision and the i18n ownership before any UI is built on top of them. Rename Brilliant's three-state `Verdict` to `GridVerdict` (3 importers only). Add the fourth card-border channel so `unknown` and `partial` are never drawn as failure. Move the locale provider out of the sx namespace and harvest the ~15 kk/ru pairs that are currently inlined at renderer call sites.**

- `MODIFY src/components/brilliant/lesson/schedule-grid.tsx (Verdict → GridVerdict)`
- `MODIFY src/components/brilliant/lesson/koji.tsx (type import + REACTION map gains a neutral arm)`
- `MODIFY src/components/brilliant/lesson/lesson-player.tsx (type import)`
- `CREATE src/components/product/lesson/verdict-channel.ts (Verdict → border/Koji/bubble tone, 4 states)`
- `MODIFY src/app/globals.css (add --color-b-unmeasured for the fourth border state)`
- `MOVE src/components/sx/i18n.tsx → src/components/product/i18n.tsx (harvest the inline pairs: 'Түзетілген нұсқа', 'Мысалдар', the hidden-test-count sentence, the sandbox-not-wired sentence, 'Сенің тексеру мысалың', the teacher-grades-this disclosure, 'Бұл көрнекілік әлі дайын емес', the oral-verify disclosure, 'Жол'/'Строка' + VERIFY_LABEL)`
- `MOVE src/components/sx/icons.tsx IconUnknown + IconPartial → src/components/product/icons.tsx`

*Verify:* npx tsc --noEmit passes; /brilliant/lesson still renders identically (the rename is internal). Grep confirms zero remaining `Verdict` imports from schedule-grid outside the three files. Grep for `{ kk:` inside src/components/sx/blocks/ returns nothing that is not also present in product/i18n.tsx.

**Step 3 — HOME. Give AppHeader/HomeRail/CourseDeck real props, fix the three structural limits that stop the deck holding nine months and eight lessons, and wire the existing (currently unimported) monthsToDeck adapter. Add a client-side progress store so completion has somewhere to land in step 8.**

- `CREATE src/lib/progress.ts (localStorage-backed ProgressSnapshot; try/catch every read and write; renders correctly with no stored value)`
- `MODIFY schools/presentation/adapters.ts (add programmeToHomeRail)`
- `MODIFY src/components/brilliant/app/course-deck.tsx (lesson list min-h-0 overflow-y-auto; thumb rail flex-wrap or overflow-x-auto; wire `done` into the dot at lines 177-179; fix the 'level 1' aria-label at line 147; guard courses[index] against an empty/shrinking array; key on lesson id not title)`
- `MODIFY src/components/brilliant/app/home-rail.tsx (days → months tri-state, wrap the row, add next/link, drop AskBar, drop the 'bekarys' default, make charges/badge/caption props)`
- `MODIFY src/components/brilliant/app/app-header.tsx (LINKS array → prop; hrefs → /, /paths, /you)`
- `REWRITE src/app/page.tsx (AppHeader + HomeRail + CourseDeck fed by MONTHS + progress)`

*Verify:* `/` shows nine month cards in the deck and nine month slots in the rail with no clipping at 1440 and 390. September's card lists all authored lessons and scrolls inside the card; the page body never scrolls sideways. Clicking a month navigates to /month/N. /brilliant/app/home still renders (its literals became defaults).

**Step 4 — SEPTEMBER GAMEBOARD. Prop-extract CourseGameboard, widen GameboardNode with done/locked/kind, wire the existing monthToGameboard adapter, and connect the pedestal's already-enumerated Rive inputs so a completed node looks different from an unstarted one.**

- `MODIFY src/components/brilliant/gameboard/course-gameboard.tsx (add {course, levels, currentLevel} props; delete the module-scope COURSE/LEVELS/CURRENT_LEVEL import; localize 'Jump here'/'Start'/'Level'; fix the -translate-x-[420px] scroll-top button at narrow widths)`
- `MODIFY src/components/brilliant/gameboard/gameboard-pedestal.tsx (wire the `completed` and `padlock` booleans on state machine node_all)`
- `MODIFY src/components/brilliant/gameboard/course-data.ts (keep the interfaces, widen GameboardNode with done?/locked?/kind; delete the Brilliant LEVELS/COURSE literals)`
- `REWRITE src/app/month/[index]/page.tsx (CourseGameboard fed by monthToGameboard; keep generateStaticParams + dynamicParams=false)`

*Verify:* /month/1 shows five levels (u1..u5) plus the September assessment as a cog `review` node closing the last level. Locked/draft nodes render the static SVG with the padlock; the current lesson renders the Rive canvas with Koji. The sticky level headers hand off correctly on scroll and the footer CTA slides away when its own node is on screen. /month/2 renders as an all-locked board, not a 404 and not an empty page.

**Step 5 — LESSON PLAYER SHELL. Replace the fixed two-page PAGES array with a blocks.map on the same horizontal track, keeping the fixed card, the verdict border, the top bar and the Koji dock verbatim. Only the `concept` block renders in this step — the goal is a walkable shell, not a complete renderer set.**

- `CREATE schools/presentation/lesson.ts (lessonToPlayer)`
- `CREATE src/components/product/lesson/curriculum-player.tsx (the shell: LessonTopBar + fixed card + track + footer CTA strip + tutor toolbar + Koji dock)`
- `CREATE src/components/product/lesson/block-stage.tsx (the dispatch switch, WITH the `const exhaustive: never = block` default arm from day one)`
- `CREATE src/components/product/lesson/blocks/concept.tsx`
- `CREATE src/components/product/lesson/code-block.tsx (moved from sx primitives, line numbering intact)`
- `CREATE src/components/product/lesson/inline-code.tsx (renderInlineCode)`
- `REWRITE src/app/lesson/[lessonId]/page.tsx (mount the new player; keep the draft/empty-blocks 404 guard exactly as it is)`

*Verify:* /lesson/m1.l1 opens on the concept block with the scene-setter art, Kazakh body text with backticked `print` rendered as inline code, and a working Button3D 'Continue' that slides the track. LessonTopBar shows 0/3 tasks. Every non-concept block currently renders the never-guard placeholder — and the build FAILS if a block type has no arm. Locale switch flips the body text without leaving the block.

**Step 6 — PREDICTION. Build the option list on the ScheduleGrid cell palette and wire it to checkPrediction/checkMultipleChoice from step 1. This is the first block that produces a BlockResult.**

- `CREATE src/components/product/lesson/blocks/option-list.tsx (aria-pressed cells, b-sched-fill/b-sched-edge resting, b-sched-fill-on selected, disabled once settled, .b-press physics)`
- `CREATE src/components/product/lesson/blocks/prediction.tsx`
- `CREATE src/components/product/lesson/blocks/multiple-choice.tsx`
- `MODIFY src/components/product/lesson/block-stage.tsx (add both arms)`

*Verify:* m1.l1.b2 renders three options ('4', '2 + 2', '"2 + 2"'). Picking '2 + 2' → correct. Picking '4' → wrong AND the extracted checker returns failureClass 'string_vs_number_confusion'. After settling, the correct option is revealed even when it was not the one picked, marked with an icon AND a word, never colour alone. Options stay disabled after check.

**Step 7 — FEEDBACK. Wire the four-state verdict channel end to end: card border, Koji Rive reaction, KojiBubble copy and the footer CTA pair. Wire onInteraction into the attempt bridge — it is currently declared and never passed, which caps the entire hint ladder silently.**

- `MODIFY src/components/product/lesson/curriculum-player.tsx (verdict → card border via verdict-channel.ts; Koji verdict+attempt props; KojiBubble on wrong; footer swaps to Get help / Try again on wrong, Why? / Continue on right, and a NEUTRAL pair on unknown)`
- `MODIFY src/components/brilliant/lesson/koji.tsx (add a useReducedMotion guard — it currently plays reactions regardless; add the neutral/unmeasured arm so an unmeasured answer never fires `incorrect`)`
- `CREATE src/app/api/interactions/route.ts (POST sink calling toGuardEvents from schools/learning/attempts.ts)`
- `MODIFY src/components/product/lesson/curriculum-player.tsx (emit onInteraction ONLY for blocks in ATTEMPT_BLOCK_TYPES — the sx version fires answer_submitted for concept and visual_simulation and relies on far-end filtering)`

*Verify:* A wrong prediction turns the card border #B78900, plays Koji's `incorrect` timeline, shows the bubble, and offers Try again. A correct one turns it #009B2B and awards XP in the top bar. An `unknown` result (reach it via m1.l7's test_case once step 9 lands, or temporarily via a verify block) draws the FOURTH border colour and neither the green nor the amber — and Koji does not play `incorrect`. Reduced-motion: no Rive reaction, no shake, transitions collapse. POST body reaching /api/interactions satisfies schoolHasAttemptSince.

**Step 8 — COMPLETION + MILESTONE. Build the lesson-complete screen carrying the 'unmeasured is shown, never folded away' rule, write the completion into the progress store, and make the gameboard node visibly change because of it. This is the step that closes the loop.**

- `CREATE src/components/product/lesson/lesson-complete.tsx (correct/taskCount + a separate unmeasured count that is never hidden; sx-rise entrance)`
- `MODIFY src/lib/progress.ts (markLessonComplete)`
- `MODIFY src/components/product/lesson/curriculum-player.tsx (write completion on the final block, then route back to /month/1)`
- `MODIFY src/components/brilliant/gameboard/gameboard-pedestal.tsx (confirm the `completed` boolean actually renders differently — verify against the live Rive inputs, do not assume)`

*Verify:* Finishing m1.l1 shows correct/3 plus the unmeasured count if any block reported `unknown`, then returns to /month/1 where the 'Бірінші бағдарлама' node now renders completed and Koji has advanced to 'Бір жолдағы бірнеше сан'. Reload the page: the state survives (localStorage). Clear site data: the board renders correctly with nothing done, no crash.

**Step 9 — REMAINING BLOCK RENDERERS. Fill in the eleven arms the never-guard is still failing on, in the order month 1 actually needs them: find_bug (m1.l1.b4), write_code (m1.l1.b5), fill_blank (m1.l2.b2), trace_code (m1.l3.b2), reorder_code (m1.l4.b3), test_case (m1.l2.b4), explain (m1.l6.b4), reflection, verify (m1.assessment), challenge/modify_code, visual_simulation (honest unavailable stub), arena_problem (visible stub).**

- `CREATE src/components/product/lesson/blocks/find-bug.tsx`
- `CREATE src/components/product/lesson/blocks/code-task.tsx (write_code | modify_code | challenge)`
- `CREATE src/components/product/lesson/blocks/fill-blank.tsx`
- `CREATE src/components/product/lesson/blocks/trace-table.tsx`
- `CREATE src/components/product/lesson/blocks/reorder-code.tsx`
- `CREATE src/components/product/lesson/blocks/test-case.tsx`
- `CREATE src/components/product/lesson/blocks/free-text.tsx (explain | reflection | verify)`
- `CREATE src/components/product/lesson/blocks/simulation-unavailable.tsx`
- `MODIFY src/components/product/lesson/block-stage.tsx (all remaining arms; the never-guard must now compile clean)`

*Verify:* Every lesson in month 1 (m1.l1..m1.l9) plus m1.assessment plays end to end at 1440 and 390 with no placeholder. `npm run curriculum:validate` still passes. No block renders an empty card. write_code with no sandbox says so in kk/ru and reports `unknown` — it does not fake a pass. test_case with an unenumerated input reports `unknown`, not wrong.

**Step 10 — ROADMAP + shell completion. Prop-extract LearningPathsPage, wire the existing programmeToLearningPath adapter, and stand up /paths as the year view. This is the last surface on the slice.**

- `MODIFY src/components/brilliant/app/learning-paths.tsx (add `paths` prop, delete the LEARNING_PATHS module import, delete AskBar, collapse the starred/other split, localize the header strings)`
- `MODIFY src/components/brilliant/app/paths-data.ts (keep the interfaces, delete the 13 Brilliant paths)`
- `CREATE src/app/paths/page.tsx`

*Verify:* /paths shows one path titled with the programme name and nine month tiles in order, each with real completion percent computed over authored lessons only (draft months contribute nothing, not 0% of a large denominator). Carousel arrows work at 1440 and the tiles wrap or scroll at 390. Header nav round-trips / → /paths → /month/1 → /lesson/m1.l1 → back to /month/1.

**Step 11 — DEMOLITION. Delete the sx presentation tree and the Brilliant reference routes, and drop the licence-blocking font declarations. Every extraction from steps 1 and 2 must already be in place — this step is the point of no return.**

- `DELETE src/components/sx/ (entire directory: blocks/, primitives.tsx, lesson-player.tsx, month-map.tsx, month-detail.tsx, icons.tsx, i18n.tsx)`
- `DELETE src/app/brilliant/ (entire route group)`
- `DELETE src/app/study/page.tsx`
- `DELETE src/components/brilliant/koji-section.tsx`
- `DELETE src/components/brilliant/courses-data.ts`
- `DELETE src/components/brilliant/app/app-data.ts`
- `DELETE src/components/brilliant/gameboard/course-data.ts literals`
- `MODIFY src/app/layout.tsx (delete the cofoBrilliant / cofoRobert localFont declarations and their className entries — RELEASE BLOCKER per the file's own note; keep sourceCodePro, it is SIL OFL)`
- `MODIFY src/app/globals.css (delete --font-b-sans/--font-b-serif or repoint them at --font-plex-sans; keep .b-press, .b-physical, .b-eyebrow, .b-glass, @keyframes b-shimmer, @keyframes b-shake-x and the b-* colour tokens — every reused component depends on them)`

*Verify:* `npm run check` passes clean (lint + typecheck + curriculum:validate + test + build). Grep for 'cofo' across src/ returns nothing. Grep for 'brilliant.org' in any component that a SolveX route reaches returns only asset paths from illustrations.ts (which are separately flagged). All six surfaces render at 1440 and 390. Bundle no longer contains the CoFo woff2 files.

---

## 5. Files to delete, and what must come out of them first

| File | Extract before deleting |
|---|---|
| `src/components/sx/blocks/types.ts` | MOVE VERBATIM to schools/learning/grading.ts: `interface BlockResult {verdict; answer?; failureClass?}`, `interface BlockProps<T> {block; onResult; settled; result}`, and `lookupFailureClass(block, answer)` (3 lines, returns undefined in the common and CORRECT |
| `src/components/sx/blocks/choice.tsx` | checkPrediction(block, answer): `answer === block.answer.trim()`, where answer = selected option string when options is non-empty else typed.trim() — the free-text path trims and the option path does not; decide deliberately, do not inherit by accident. checkM |
| `src/components/sx/blocks/code.tsx` | checkFillBlank (all-or-nothing conjunction; answer reported as values.join('|') using RAW untrimmed values — the raw string is the diagnostic record); checkReorder (exact positional id-sequence equality, answer = order.join(',')); seedOrder (must be DETERMINIS |
| `src/components/sx/blocks/reading.tsx` | renderInlineCode(text) — splits on /(`[^`]+`)/g, avoids a markdown dependency; month-01 bodies DO contain backticks so dropping it renders literal backticks to students. checkTrace (all-or-nothing over every declared (step,varName) pair, cell key `${rowIndex}: |
| `src/components/sx/blocks/index.tsx` | The `const exhaustive: never = block` default-arm discipline — it turns a missing renderer into a COMPILE error rather than a blank card in front of a student. Rebuild it in src/components/product/lesson/block-stage.tsx from step 5, BEFORE any block arm is wri |
| `src/components/sx/primitives.tsx` | MOVE VERBATIM: `type Verdict = 'correct'|'wrong'|'partial'|'unknown'` → schools/learning/grading.ts (this is the domain type; Brilliant's three-state one is a UI type and must be adapted at the boundary, never substituted). MOVE VERBATIM: CodeBlock → src/compo |
| `src/components/sx/lesson-player.tsx` | handleResult's contract: store by block.id, then emit onInteraction({type:'answer_submitted', timestamp, blockType}) — exactly the shape toGuardEvents() consumes; feeding raw school events to the export's hasAttemptSince() instead is the silent failure documen |
| `src/components/sx/month-map.tsx` | `stateOf(month, currentMonth): 'ready'|'draft'|'locked'` — derived from units.some(lesson => status !== 'draft' && blocks.length > 0) then index <= currentMonth. Move to schools/presentation/adapters.ts next to monthIsReady(). AND THE HONESTY RULE IN ITS DOC C |
| `src/components/sx/month-detail.tsx` | The per-lesson taskCount (ATTEMPT_BLOCK_TYPES filter) and `ready = status !== 'draft' && blocks.length > 0` derivations — both already duplicated as countTasks()/isLessonReady() in schools/presentation/adapters.ts, so verify they agree before deleting. The thr |
| `src/components/sx/icons.tsx` | MOVE IconUnknown and IconPartial to src/components/product/icons.tsx — they encode the 4-verdict model and Brilliant has no glyph for 'nobody has measured this' or 'partially correct'. They are what stops `unknown` being drawn as a failure. The other 16 icons  |
| `src/components/sx/i18n.tsx` | DO NOT DELETE — MOVE to src/components/product/i18n.tsx. This is the ENTIRE locale mechanism (`t = (v: Localized) => v[locale]`, default 'kk' deliberately because this is a Kazakh programme and Kazakh must not be the alternate) plus the 29-pair UI table. The B |
| `src/app/brilliant/ (entire route group: page.tsx, layout.tsx, courses/, about/, faq/, wiki/, math/, terms-of-use/, lesson/, app/home/, app/courses/, app/you/, app/course/)` | Nothing to extract from the routes themselves — they are composition-order shells. But they are the ONLY consumers of the CoFo faces (layout.tsx applies font-b-sans to every descendant), so deleting them is what unblocks release. Before deleting: confirm every |
| `src/components/brilliant/koji-section.tsx` | The canvas-overflow trick: a 340x447 absolutely positioned canvas inside a 108px relative wrapper with overflow visible and explicit z-0/z-10, so the character's light trail passes BEHIND the heading — a deliberate 339px spill. And the reduced-motion fallback: |
| `src/components/brilliant/courses-data.ts` | Nothing. The type system (LearningPathData / PathTileData / CourseData / LessonNodeData / NodeStatus) is superseded by schools/curriculum/types.ts + schools/presentation/adapters.ts, and the content is Brilliant's Fractions curriculum with US grade bands. Dele |
| `src/components/brilliant/app/app-data.ts` | Nothing but the shape it satisfies: `DeckCourse` is already redeclared as DeckCourseData in schools/presentation/adapters.ts, so the type contract is preserved. The content is Brilliant course names and CDN paths. Same for src/components/brilliant/app/paths-da |
| `src/app/layout.tsx — the cofoBrilliant and cofoRobert localFont declarations (not the file)` | Nothing to extract. This is the RELEASE BLOCKER the file's own comment names: CoFo Brilliant and CoFo Robert are commercially licensed by Contrast Foundry and must not deploy. Delete both declarations and their className entries; keep plexSans, jetbrainsMono a |

---

## 6. Risks

Ordered as the verification pass ranked them. The first is the one that would
ship silently and hurt a child.

1. VERDICT COLLAPSE — the highest-stakes regression. Brilliant's Verdict ('unchecked'|'wrong'|'right') describes whether the UI has been checked; SolveX's ('correct'|'wrong'|'partial'|'unknown') describes what was measured. Any code path that reuses the Brilliant type directly turns 'nobody has measured this' into 'you failed' for a 14-year-old — on explain, reflection, verify, un-sandboxed code, and every unenumerated test_case. The fourth border state, the neutral Koji arm and the neutral footer CTA pair must all land together in step 7 or the failure ships silently, because nothing will throw.

2. test_case 'never wrong' asymmetry silently simplified to a boolean during the rewrite. It is the one rule most likely to look like a bug to whoever ports it, and losing it punishes exactly the thinking the block trains.

3. The `never` exhaustive guard being dropped or weakened while porting the dispatch switch. Without it a block type with no renderer ships as a blank card in front of a class instead of failing the build. Write the guard in step 5 before the first arm, not after the last.

4. onInteraction is declared on LessonPlayerProps and passed by NOBODY today — src/app/lesson/[lessonId]/page.tsx never wires it. If step 7 does not connect it, hasAttemptSince stays false forever, every hint request is capped at the lowest level, and Nova looks broken with no exception, no log and no failing test. In a classroom that reads as the assistant refusing to help a child who is trying.

5. The current handleResult fires answer_submitted for EVERY block including concept and visual_simulation. toGuardEvents filters them out by ATTEMPT_BLOCK_TYPES so nothing breaks downstream today, but the event stream is polluted and the filtering is enforced only at the far end — if the new player emits straight to /api/interactions without the same filter, reading a concept card starts counting as an attempt.

6. CourseDeck's fixed h-[540px] with overflow-hidden and 60px lesson rows leaves room for roughly three rows; month 1 has eight lessons. Without the overflow-y-auto fix in step 3 the majority of September is rendered but unreachable — clipped, not scrolled, with no visual indication anything is missing.

7. The CourseDeck thumbnail rail is `flex justify-center gap-4` with no wrap and 60px minimum tiles: nine months need 668px inside a 540px column, so ~128px overflows the layout. Same class of bug in HomeRail's day row (48px shrink-0 slots, ~332px box, six fit).

8. DeckCourse.done is declared and read nowhere — the completion dot is a hardcoded text-white/20 rect. If step 3 does not wire it, the home deck structurally cannot show progress and steps 8's milestone loop has no visible endpoint on the home screen.

9. Locale reset on every navigation. LocaleProvider keeps locale in useState with no cookie, no URL segment and no storage. Today that is survivable across three routes; across six surfaces plus a lesson player it means a learner who switches to Russian on the home screen is back in Kazakh the moment they open a lesson. Fix during the move in step 2.

10. Half-migrated language mixing. Every Brilliant component is hardcoded English ('Jump back in', 'Start', 'Check', 'Continue', 'Level', 'Lessons', 'Exercises', 'Jump here', 'Unlock Leagues', 'Gift Premium'). Any surface wired to curriculum data before its labels are localized ships a Kazakh curriculum inside an English chrome, which reads as broken rather than bilingual.

11. CoFo font shipping. layout.tsx names this a release blocker itself. The trap is that it is invisible from the component side — hero.tsx, subject-tabs.tsx and the whole app tree only reference `font-b-sans`/`font-b-serif` by class name and inherit the family from an ancestor, so nothing in a component diff shows the licensed face. Only deleting the localFont declarations and repointing the two CSS variables actually removes it.

12. Unlicensed assets shipping under SolveX branding: cs-refresh.webm, the get-started lifestyle photography, meet_koji.0dced838.riv, koji-gameboard.e2320c48.riv, and every chapter PNG that schools/presentation/illustrations.ts resolves. illustrations.ts is honest that the art is temporary and records an `intent` per slot — but honest placeholders still ship. Nine month illustrations plus a mascot are commissioning work, not migration work.

13. Koji is Brilliant's character, not a generic tutor avatar. Preserving the Rive mechanism (steps 5-7) is correct; keeping the character is not. The replacement must expose the same timeline names or the reaction wiring in koji.tsx breaks.

14. koji.tsx plays its reaction timelines with NO useReducedMotion guard. The sx tree honoured the preference per-component; adopting koji.tsx as-is is a straight accessibility regression, and the global CSS kill switch does not touch a Rive canvas.

15. .b-shake on a wrong answer runs 400ms of horizontal jolt. solvex.css documents the opposite intent — the programme is 70% practice and a 14-year-old is wrong several times per lesson by design, so alarm-level feedback at that frequency teaches avoidance. Scope it to a single unsatisfied constraint row, never the block.

16. Tailwind arbitrary values cannot be prop-driven: aspect-[1360/888] and lg:h-[760px] in hero.tsx, h-[540px]/max-h-[540px] and min-w-[60px] in course-deck.tsx, w-[384px]/sticky top-[105px] in home-rail.tsx, translate-x-[420px] in course-gameboard.tsx. The JIT scans literal source text, so every one of these requires a source edit and CLAUDE.md forbids the inline-style escape hatch.

17. Every fixed px box was measured against CoFo metrics and SHORT ENGLISH strings. Kazakh and Russian run materially longer, and solvex.css deliberately sets body text to 17px for Cyrillic legibility. h-10 on the deck's lesson row, w-9 on the streak numeral (a 36px box for a 48px glyph — two digits already clip), min-h-[15px] on the level label, and the 138px gameboard label column will all clip or overflow with real curriculum titles.

18. Adding REQUIRED props to the nullary components (Hero, Nav, StatsBand, Footer, CourseGameboard, LearningPathsPage) breaks the /brilliant/* routes at build time, and those routes are what the reverse-engineering work is measured against. Make every new prop OPTIONAL with the existing literal as its default until step 11 deletes the routes, or lose the visual reference mid-migration.

19. No progress persistence exists today. Without src/lib/progress.ts in step 3, step 8's milestone is unobservable — the lesson completes, the gameboard node does not change, and the whole vertical slice reads as broken even though every part works.

20. localStorage throws outright in some contexts (private windows, previews, browsers blocking site data). Every read and write in progress.ts must be try/catch'd and the board must render correctly with nothing stored, or a locked-down school machine gets a white screen instead of an empty year.

21. generateStaticParams + dynamicParams=false currently excludes draft lessons so a draft URL is a 404 rather than an empty player. Rewriting src/app/lesson/[lessonId]/page.tsx in step 5 must preserve that guard exactly — a blank lesson in front of a student is worse than a missing page, and this is a two-line omission away.

22. The 22 currently-clean routes are the baseline. Deleting src/app/brilliant/ removes 13 of them at once; if anything in the product tree still imports from a deleted data module the failure surfaces as a build error at the end of the migration rather than at the step that caused it. Run npm run check after every step, not only at step 11.

23. Disk pressure. HANDOFF.md records ~3.9GB free of 228GB and a previous ENOSPC that killed a build mid-run; .next alone is ~700MB. Clear .next between full builds or the migration loses work to a disk error rather than a code error.

24. The nine mandated visualisers (step_execution, loop_trace, binary_search, two_pointers, recursion_tree, bfs_wave, dfs_walk, sorting, dp_table) are unbuilt and have no Brilliant equivalent — ScheduleGrid is only the closest interactive pattern, not a substitute. Any plan reading that treats visual_simulation as 'migrated' understates the remaining work by a large margin; step 9 ships an honest unavailable stub, and that is the correct outcome for now, not a finished feature.
