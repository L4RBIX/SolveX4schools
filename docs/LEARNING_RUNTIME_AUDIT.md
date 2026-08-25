# Learning runtime audit

Required before wiring anything. Traces the ACTUAL path a student interaction
takes today — not what the imported package is capable of.

**Headline: the intelligence is imported, tested, and connected to nothing.**
One interaction in the entire product constructs a learning event, and that
event's final destination is `console.info`.

---

## The ten questions

### 1. Which student interactions currently emit a learning event? Trace onInteraction from the block to its final destination.

Exactly ONE interaction emits anything: pressing the footer "Check" button while an ATTEMPT block is on screen. Nothing else in the entire app constructs a SchoolInteraction.

Full runtime path (this is the whole path — it is 3 hops and ends in a console log):

1. Block view captures an answer. e.g. `MultipleChoiceView` -> `onSelect={(id) => onAnswer({kind:"option", id})}` (src/components/brilliant/lesson/blocks/index.tsx:133). `onAnswer` is `setAnswer` (school-lesson.tsx:251, only for the block at the current page index — every other page gets `() => {}`). `setAnswer` (school-lesson.tsx:116-125) writes React `useState` only.
2. Learner presses Check. Rendered at school-lesson.tsx:266-270, `onClick={check}`, disabled unless `canCheckAnswer(block, state.answer)`.
3. `check()` (school-lesson.tsx:136-160) grades locally via `checkBlock` (pure, schools/learning/checking.ts:112), sets local state, adds XP, then at school-lesson.tsx:153-159:
   `if (isAttemptBlock(block)) onInteraction?.({ type: "answer_submitted", timestamp: Date.now(), blockType: block.type })`
4. `onInteraction` prop is supplied by LessonRoute (lesson-route.tsx:61) and is defined at lesson-route.tsx:41-45:
   `if (process.env.NODE_ENV !== "production") { console.info("[learning-event]", interaction); }`

TERMINUS: a dev-only `console.info`. In a production build the callback body is a no-op — the event is constructed, passed one frame down, and dropped. It never touches `toGuardEvents`, never touches `schoolHasAttemptSince`, never leaves the browser, and is not even accumulated in an in-memory array.

The only route that mounts this player is src/app/lesson/[lessonId]/page.tsx:64. The other lesson route, /brilliant/lesson (src/app/brilliant/lesson/page.tsx:11 -> lesson-player.tsx), is the original Brilliant clone and emits nothing at all.

Also dead: "Get help" (school-lesson.tsx:282-284), "Why" (292-295), the chat and mic buttons (346-360), the flag and speaker buttons (312-325). None of them has an `onClick`. They are decoration.

*Evidence:* src/components/brilliant/lesson/school-lesson.tsx:136-160 (esp. 153-159); src/components/brilliant/lesson/lesson-route.tsx:41-45,61; src/components/brilliant/lesson/blocks/index.tsx:99,106,133,183,258,329,452,493,515,549,583,624; grep for SchoolInteraction construction across src/ returns exactly one hit: school-lesson.tsx:155 (type: "answer_submitted")

### 2. Which interactions do NOT emit events? Enumerate every block type and say yes/no.

All 16 BlockType values (schools/curriculum/types.ts:82-98), with the actual runtime behaviour:

EMITS `answer_submitted` on Check (in ATTEMPT_BLOCK_TYPES and its view calls onAnswer):
- prediction — YES
- multiple_choice — YES
- find_bug — YES
- fill_blank — YES
- reorder_code — YES
- trace_code — YES
- test_case — YES
- explain — YES (verdict is always "unknown"/unmeasured, but the event fires)
- verify — YES (same)
- write_code — YES (CodeTaskView; verdict "unknown", no sandbox)
- modify_code — YES (same)
- challenge — YES (same)

EMITS NOTHING:
- concept — NO. Not in ATTEMPT_BLOCK_TYPES, so `footerMode("unchecked", false)` returns "advance" (lesson-verdict.ts:118) — there is no Check button, so `check()` never runs.
- visual_simulation — NO. Same reason. SimulationView (blocks/index.tsx:669-681) has no answer capture and is a "visualiser pending" placeholder.
- reflection — NO, and this one is a trap: ReflectionView DOES capture text via `onAnswer` (blocks/index.tsx:549), but "reflection" is not in ATTEMPT_BLOCK_TYPES, so the footer shows "Continue" and `check()` is never reachable. The typed answer is collected into state and then thrown away.
- arena_problem — NO, despite being listed in ATTEMPT_BLOCK_TYPES (types.ts:124). Its view (blocks/index.tsx:720-722) renders only `<BlockPrompt>` and never calls `onAnswer`, so the answer stays `NO_ANSWER`. `canCheck` returns false for `kind: "none"` (checking.ts:73-74), so the Check button is permanently disabled. An arena_problem block is a hard dead end in the player — the learner cannot advance past it and cannot emit anything. This is a live bug, not just a gap.

Also, of the 11 SchoolInteractionType values defined at schools/learning/attempts.ts:44-59, exactly ONE (`answer_submitted`) is ever constructed. `answer_changed` (the debounced-typing/dragging signal the guard's `code_changed_debounced` maps from), `hint_requested`, `solution_revealed`, `lesson_opened`, `block_viewed`, `concept_read`, `simulation_played`, `run_clicked`, `code_changed_debounced` and `submit_clicked` have zero producers in src/.

*Evidence:* schools/curriculum/types.ts:82-98 (BlockType), :113-127 (ATTEMPT_BLOCK_TYPES); src/components/brilliant/lesson/lesson-verdict.ts:117-122 (footerMode); schools/learning/checking.ts:59-61 (isAttemptBlock), :69-90 (canCheck), :115-118 (concept/visual_simulation/reflection -> "unknown"), :216-233 (explain/verify/code/arena -> "unknown"); src/components/brilliant/lesson/blocks/index.tsx:542-555 (ReflectionView), :669-681 (SimulationView), :720-722 (arena_problem); schools/learning/attempts.ts:44-59

### 3. Where are events persisted? (If nowhere, say so plainly.)

NOWHERE. Not persisted, not transmitted, not even buffered.

Hard evidence of absence across the whole of src/:
- `grep -rn "fetch(" src/` -> zero hits
- `find src -name "route.ts"` -> zero results; `find . -type d -name api` (excl. node_modules) -> zero results
- `grep -rn "use server" src/ schools/ packages/` -> zero hits
- `grep -rniE "supabase|prisma|drizzle|postgres|sqlite|mongoose|sql" src/` -> zero hits
- `grep -rn "sendBeacon|XMLHttpRequest|axios|fetch(" src schools packages` -> zero hits

The schema for the ledger exists and is unused: database/migrations/0003_learning_events.sql defines `learning_subjects` / the events tables and its own header says it is "written only by the server through /api/learning/*" — that route does not exist in this repository. contracts/learning-event.schema.json and packages/learning-contracts/src/events.ts define the taxonomy; nothing in src/ imports either. `grep -rn "@solvex" src/` returns NONE — src/ has no dependency on learning-contracts, learning-intelligence-core or nova-core at all.

The event lives for the duration of one `console.info` call and is garbage collected.

*Evidence:* grep sweeps over src/ (fetch, route.ts, api dir, 'use server', db clients, beacon/axios) all empty; database/migrations/0003_learning_events.sql:14-16 references /api/learning/* which does not exist; contracts/learning-event.schema.json and packages/learning-contracts/src/events.ts:24-53 have zero importers in src/

### 4. Is LearnerState persisted anywhere?

No — worse than that, LearnerState is never CONSTRUCTED at runtime, so there is nothing to persist.

`buildLearnerState` is defined at packages/learning-intelligence-core/src/learnerState.ts:260. Every caller is a test: tests/golden.test.ts:67, tests/unit/learnerState.test.ts:123/147/165/191/197/200/208/218/226/234/242/321, tests/unit/decisionEngine.test.ts:46/208, tests/unit/novaRuntime.test.ts:212. Zero callers in src/ or schools/.

contracts/learner-state.schema.json and database/migrations/0006_learner_state.sql exist (database/README.md:95 calls `learner_state` "L4. What decide() reads"), but nothing writes them and no client can reach them.

*Evidence:* packages/learning-intelligence-core/src/learnerState.ts:260; callers only under tests/ (golden.test.ts:67, unit/learnerState.test.ts, unit/decisionEngine.test.ts:46, unit/novaRuntime.test.ts:212); grep -rn "@solvex" src/ -> NONE; contracts/learner-state.schema.json; database/migrations/0006_learner_state.sql; database/README.md:95

### 5. Is reduction automatic, manual, or absent?

ABSENT at runtime. It is implemented and exercised only by unit tests.

`reduceEpisode` (packages/learning-intelligence-core/src/episode.ts:180) is referenced in exactly three places: its own definition, the barrel re-export (packages/learning-intelligence-core/src/index.ts:19), and tests/unit/episode.test.ts. There is no scheduler, no cron, no route handler, no effect, no manual trigger, no CLI that calls it. The only CLI in the repo is schools/curriculum/cli.ts, which validates curriculum content, not learner data.

Since there are no persisted events (Q3), there is also no input a reducer could run on.

*Evidence:* packages/learning-intelligence-core/src/episode.ts:180 (reduceEpisode), :49 (REDUCER_VERSION=5), :311 (independence_weight computed here); packages/learning-intelligence-core/src/index.ts:19; only other references are tests/unit/episode.test.ts; schools/curriculum/cli.ts is a content validator

### 6. Does the Decision Engine run on real student activity? Where is decide() called from, if anywhere?

No. `decide()` never executes outside the test suite.

Definition: packages/learning-intelligence-core/src/decisionEngine.ts:457. Every call site is a test file — tests/golden.test.ts:70/116/129/153/236/286/301/334/339/340, tests/unit/decisionEngine.test.ts:50/81/82/95/107/118/128/135/141/148/154/165/178/185/196/202/209, tests/unit/novaRuntime.test.ts:212. It is exported from the barrel at packages/learning-intelligence-core/src/index.ts:51, and that barrel has zero importers in src/.

Even if it were called, it takes a `LearnerState` which nothing builds (Q4), which in turn is folded from `ReducedEpisode`s which nothing reduces (Q5), which come from events nobody stores (Q3). The pipeline is disconnected at all four joints, not just the last one.

*Evidence:* packages/learning-intelligence-core/src/decisionEngine.ts:457; packages/learning-intelligence-core/src/index.ts:51; call sites exclusively in tests/golden.test.ts and tests/unit/{decisionEngine,novaRuntime}.test.ts; grep -rn "@solvex|learning-intelligence-core" src/ -> NONE

### 7. Does Nova receive a real NovaDirective? Is there ANY Nova UI or route?

No, and no. `grep -rni "nova" src/` returns ZERO hits. There is no Nova component, no Nova route, no Nova hook, no chat panel, no directive plumbing anywhere in the application.

NovaDirective is a type produced only by the four builders inside decisionEngine.ts (askDirective:145, explainDirective:159, withholdDirective:175, directDirective:187), all reached only through `decide()` — which never runs (Q6). `novaIndicator` (packages/nova-core/src/novaRuntime.ts:249) and the Python model (packages/nova-core/python/nova_directive.py:43) are consumed only by tests/unit/novaRuntime.test.ts and tests/python/test_nova_directive.py.

The UI that would be Nova's front door — the chat and mic buttons at school-lesson.tsx:346-360, plus "Get help" at :282-284 — have no click handlers at all. They render, they hover, they do nothing.

*Evidence:* grep -rni "nova" src/ -> NONE; packages/learning-intelligence-core/src/decisionEngine.ts:92 (interface), :145,:159,:175,:187 (builders); packages/nova-core/src/novaRuntime.ts:249; contracts/nova-directive.schema.json; src/components/brilliant/lesson/school-lesson.tsx:282-284,292-295,346-360 (no onClick)

### 8. Does hint escalation see school attempts? Is grantHintLevel called anywhere in src/?

No, and no. `grantHintLevel` is defined at packages/nova-core/src/novaRuntime.ts:108 and called only from tests/golden.test.ts (237,251,262,273,287,302) and tests/unit/novaRuntime.test.ts (16 call sites). Zero calls in src/.

The attempt bridge is built and connected at NEITHER end. `schoolHasAttemptSince` (schools/learning/attempts.ts:110) and `toGuardEvents` (:90) are re-exported by schools/learning/index.ts:33-35 and called only by tests/school/adapter.test.ts. The player imports `SchoolInteraction` as a TYPE ONLY (school-lesson.tsx:14, lesson-route.tsx:5 — both `import type`), so not one byte of attempts.ts ends up in the browser bundle.

So the exact failure documented in attempts.ts:9-23 and lesson-route.tsx:36-39 is live today, just one layer earlier than described: there is no hint request path at all, so the cap is not merely stuck at the lowest level — there is no ladder. If someone wires a Nova call tomorrow using `grantHintLevel` directly, `hasAttemptSinceLastHint` will be false forever, because nothing accumulates the interactions the bridge needs.

*Evidence:* packages/nova-core/src/novaRuntime.ts:108 (grantHintLevel), :162 (the hasAttemptSinceLastHint gate), :223 (hasAttemptSince); schools/learning/attempts.ts:90,110,118; schools/learning/index.ts:32-38; callers only in tests/golden.test.ts, tests/unit/novaRuntime.test.ts, tests/school/adapter.test.ts; type-only imports at src/components/brilliant/lesson/school-lesson.tsx:14 and lesson-route.tsx:5

### 9. Does independent evidence survive navigation/reload? What exactly persists today and where?

No. Independent evidence does not survive — it is never produced in the first place. `independence_weight` is computed at exactly one place, packages/learning-intelligence-core/src/episode.ts:311, inside `reduceEpisode`, which never runs (Q5). The Decision Engine's independence branches (decisionEngine.ts:388, :418) and interventionMemory's `independence_weight >= 1` checks (:110,:143,:160,:171) are unreachable code in this deployment.

What ACTUALLY persists, exhaustively — two localStorage keys, both browser-local, both anonymous, both wiped by clearing site data:
1. `solvex.progress.v1` (src/lib/progress.ts:26) — `{ completedLessons: string[], currentLessonId: string|null, currentMonth: number }`. Written by `markLessonComplete` (:119) and `setCurrentLesson` (:129). Read by `useProgress` (:154) in year-roadmap.tsx:24, school-home.tsx:36, month-board.tsx:24. Every access is try/caught, so a browser blocking site data degrades to "nothing recorded" silently.
2. `solvex.locale.v1` (src/components/sx/i18n.tsx:36) — the kk/ru language choice.

What is LOST on reload or navigation away: every per-block answer, every verdict, every attempt counter, and the XP total. All four live in `useState` inside SchoolLesson (school-lesson.tsx:102-105: `page`, `states`, `xp`, `done`). Leave the lesson mid-way and the entire session is gone; the only trace is `currentLessonId`, and even that is nulled the moment the lesson completes (progress.ts:124).

*Evidence:* packages/learning-intelligence-core/src/episode.ts:158,311; packages/learning-intelligence-core/src/decisionEngine.ts:388,418; packages/learning-intelligence-core/src/interventionMemory.ts:110,143,160,171; src/lib/progress.ts:26,40-67,119-134,154-156; src/components/sx/i18n.tsx:36,54,86; src/components/brilliant/lesson/school-lesson.tsx:102-105; consumers: year-roadmap.tsx:24, school-home.tsx:36, month-board.tsx:24

### 10. Does lesson completion mutate real learner state, or only localStorage?

Only localStorage — and it discards almost everything it computed on the way there.

Path: last block -> `advance()` (school-lesson.tsx:171-185) builds a `LessonSummary` `{lessonId, correct, wrong, unmeasured, attempts}` from the local `states` map and calls `onComplete` (:178). `onComplete` in lesson-route.tsx:47-52 is:

    (summary) => { markLessonComplete(summary.lessonId); }

It uses `summary.lessonId` and NOTHING else. The correct / wrong / unmeasured / attempts counts — the only per-lesson performance data the app ever computes — are constructed and immediately dropped on the floor.

`markLessonComplete` (src/lib/progress.ts:119-127) pushes the id into `completedLessons`, nulls `currentLessonId`, writes the JSON blob to `window.localStorage`, and notifies the `useSyncExternalStore` listeners so the gameboard repaints. That is the entire mutation. No network call, no server action, no learner_state row, no skill update, no misconception record, no episode.

Two further caveats on the summary's honesty even as a display value: `correct`/`wrong`/`unmeasured` are derived from `Object.values(states)`, which only contains blocks the learner actually checked, while `attempts` is `blocks.filter(isAttemptBlock).length` — the total possible, not the total tried. The two numbers come from different denominators.

*Evidence:* src/components/brilliant/lesson/school-lesson.tsx:171-185 (advance, summary construction), :111-114 (attemptCount); src/components/brilliant/lesson/lesson-route.tsx:47-52 (onComplete uses only lessonId); src/lib/progress.ts:119-127 (markLessonComplete -> write() -> window.localStorage.setItem at :63)

---

## What emits an event today

- prediction — Check pressed → answer_submitted (school-lesson.tsx:153-159)
- multiple_choice — Check pressed → answer_submitted
- find_bug — Check pressed → answer_submitted
- fill_blank — Check pressed → answer_submitted
- reorder_code — Check pressed → answer_submitted
- trace_code — Check pressed → answer_submitted
- test_case — Check pressed → answer_submitted
- explain — Check pressed → answer_submitted (verdict always unmeasured)
- verify — Check pressed → answer_submitted (verdict always unmeasured)
- write_code — Check pressed → answer_submitted (verdict always unmeasured, no sandbox)
- modify_code — Check pressed → answer_submitted (verdict always unmeasured, no sandbox)
- challenge — Check pressed → answer_submitted (verdict always unmeasured, no sandbox)

## What does not

- concept — not an attempt block; footer shows Continue, check() unreachable
- visual_simulation — not an attempt block; placeholder view, no answer capture
- reflection — captures text via onAnswer (blocks/index.tsx:549) but not in ATTEMPT_BLOCK_TYPES, so check() is unreachable and the text is discarded
- arena_problem — IS in ATTEMPT_BLOCK_TYPES but its view never calls onAnswer, so canCheck() is permanently false and the Check button never enables; hard dead end in the player
- Get help button (school-lesson.tsx:282-284) — no onClick
- Why button (school-lesson.tsx:292-295) — no onClick
- Chat with tutor button (school-lesson.tsx:346-352) — no onClick
- Answer with voice / mic button (school-lesson.tsx:353-360) — no onClick
- Report problem / flag button (school-lesson.tsx:312-318) — no onClick
- Read aloud / speaker button (school-lesson.tsx:319-325) — no onClick
- Opening a lesson — setCurrentLesson writes localStorage; no lesson_opened interaction is constructed
- Viewing/paging between blocks — setPage only; no block_viewed or concept_read
- Typing or dragging an answer before Check — setAnswer only; answer_changed is never constructed anywhere in src/
- Retry — clears verdict locally; emits nothing
- Lesson completion — markLessonComplete(lessonId) to localStorage; emits no learning event
- /brilliant/lesson (LessonPlayer, the original clone) — no interaction emission of any kind

---

## Gaps to close

1. No transport layer exists at all: zero fetch(), zero route.ts, zero 'use server', zero DB client anywhere in src/. `find . -type d -name api` (excl. node_modules) returns nothing, yet database/migrations/0003_learning_events.sql:14-16 documents /api/learning/* as the writer.

2. src/ has ZERO imports from @solvex/learning-contracts, @solvex/learning-intelligence-core or @solvex/nova-core. The tsconfig paths (tsconfig.json) resolve them, but no application file references them. The three packages are compiled and tested, never shipped.

3. The SchoolInteraction type is imported `import type` only (school-lesson.tsx:14, lesson-route.tsx:5), so schools/learning/attempts.ts — toGuardEvents, schoolHasAttemptSince, isAttempt — is erased at build time and present in no bundle.

4. No interaction buffer exists. Events are not appended to any array, ref, or store, so even an in-memory schoolHasAttemptSince() call would have nothing to pass.

5. LessonSummary (correct/wrong/unmeasured/attempts) is computed at school-lesson.tsx:176-184 and discarded — onComplete consumes only summary.lessonId.

6. arena_problem is a live blocking bug: listed as an attempt block (types.ts:124) but its view captures no answer, so Check stays disabled and the learner cannot proceed past such a block.

7. No auth/subject identity exists anywhere, so even a wired ingest route would have no key to attribute events to. lesson-route.tsx:36-39 names this as the reason the seam is unwired; src/app/page.tsx:11 hardcodes learnerName="Bekarys".

8. Everything under packages/ (decide, buildLearnerState, reduceEpisode, grantHintLevel, novaIndicator, interventionMemory, attestation signing) is exercised exclusively by tests/. The test suite proves the logic is correct; it proves nothing about the product, because the product does not call it.

9. Migrations 0003/0004/0006/0007 and all four contracts/*.schema.json describe a system that has no runtime counterpart in this repo.
