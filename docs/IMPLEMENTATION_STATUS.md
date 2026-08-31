# SolveX4Schools — implementation status

Honest status of the master brief, section by section. Written to be checked,
not to be reassuring. Every "READY" below is backed by something that runs.

**Date:** 2026-08-26
**Verified by:** `npm run typecheck` (exit 0) · `vitest run` (240/240) ·
`npm run curriculum:validate` (0 errors) · `npm run build` (35 routes) ·
manual walkthrough of `/lesson/m1.l1` in Chrome

---

## 1. Overall verdict: **PARTIALLY READY**

What exists is real and verified. What does not exist is named below rather
than implied to be nearly done.

| Area | Status |
|---|---|
| Curriculum manifest + traceability + validator | **READY** |
| Learning Intelligence import + baseline | **READY** |
| School adapter over the import | **READY** |
| Lesson runtime (data-driven blocks) | **READY** |
| September content | **READY** — 36/36 tasks, matching the PDF exactly |
| Months 2–9 | **PARTIALLY READY** — full structure, no lesson bodies |
| Design system + bilingual UI | **READY** |
| Code execution sandbox | **NOT READY** |
| Auth, school/class/teacher model | **NOT READY** |
| Nova (DeepSeek) | **NOT READY** |
| Arena, contests, practice planner | **NOT READY** |
| Strobi avatar | **NOT READY** — and see §7 |
| Teacher console, reporting | **NOT READY** |

---

## 2. Curriculum — READY

- `schools/curriculum/source-of-truth.ts` — every figure from the 12-page PDF,
  each carrying its page. `шамамен` values are marked approximate rather than
  presented as exact.
- `schools/curriculum/skills.ts` — 48 skills, each tagged with the month that
  introduces it.
- `schools/curriculum/months/` — all nine months with metadata, mastery,
  explanation, end-of-month capability, practice outline, hours, units, lessons
  with objectives and skill refs, and an assessment.
- `schools/curriculum/validate.ts` — `npm run curriculum:validate`.
- `docs/curriculum/CURRICULUM_TRACEABILITY.md` — every PDF requirement mapped
  to the artefact that implements it, with status.

The validator is not decorative. It errors on:

- a block referencing an unknown skill
- a skill declared as introduced in month *N* that no month-*N* lesson teaches
- a month using a skill the taxonomy introduces later (broken progression)
- a diagnostic mapping without a written justification
- a non-draft assessment lacking an unseen problem or an oral explanation
- the months' hours drifting more than 6 points from the mandated 70% practice
- duplicate ids anywhere
- a non-draft lesson containing nothing the learner does

Current output: **0 errors, 0 warnings.**

### One discrepancy, stated rather than smoothed over

The per-month task figures sum to 254 for months 1–8; p.11 summarises the year
as "~250 tasks, of which ~100 fully independent" and calls that a minimum. Both
numbers are the document's. Both are kept. The validator checks against the
per-month figures.

May's `expectedTaskCount` of 25 is the only **derived** figure in the manifest —
the PDF gives no task total for May, only "four contests plus a final
tournament". 4 × 5 + 5 = 25. It is marked as derived in the source and in the
traceability document.

---

## 3. Learning Intelligence — READY

Baseline reproduced before anything was touched:
`docs/integration/LEARNING_INTELLIGENCE_IMPORT_BASELINE.md`

- 58/58 checksums OK
- 209/209 TypeScript tests — **still 209/209 after integration**
- 13/13 Python directive tests
- `tsc --noEmit` clean (after adding `@types/node`, which the export omits —
  a packaging defect, not a source defect)

The golden-fixture gate (`tests/golden.test.ts`, 26 assertions over 10 synthetic
learners) is inside the 209 and is green. **If it goes red, the intelligence
changed.** Nothing in this repo edits `learning-intelligence-core`.

---

## 4. School adapter — READY

`schools/learning/`, documented in `docs/integration/LI_ADAPTER.md`.
31 tests, all green. Four blocking coupling defects closed, none by editing the
export:

1. **`ATTEMPT_EVENTS` (silent).** `hasAttemptSince` gates the whole hint ladder
   and recognises only three code-editor events. A learner answering a
   prediction satisfies none of them, so every hint request would be capped
   forever with no error — the assistant refusing to help a child who is
   visibly trying. `attempts.ts` translates school interactions into the guard's
   vocabulary and delegates. Reading, watching and *asking for help* deliberately
   do not translate.
2. **`task_kind` CHECK (loud).** Migration `0007` widens it to accept `lesson`,
   `practice`, `assessment`, `contest`.
3. **Verdict `timeout` (silent).** The contract maps any status containing
   `timeout` to `null`. In a school sandbox that word means *the learner's
   program was too slow* — the exact evidence December is built on. The sandbox
   vocabulary is now closed; `assertSandboxStatus` throws on `timeout` and names
   both correct replacements.
4. **Attestation (indistinguishable from forgery).** Every school submission
   now carries a minted `problem_id`. `sign.ts` is a TypeScript signer written
   against the shipped verifier and checked by round-tripping against it.

Migration `0007` also repairs `solvex_forget_user()` — it called a function from
migration `0001`, which is not part of the export, so consent revocation errored
out. The programme commits to deleting a child's data on request (PDF p.4).

**One bug in my own signer was caught by my own test:** an explicitly-passed
weak secret bypassed validation, since the check only ran on the environment
default. The verifier checks the HMAC, not the key's strength, so nothing
downstream would have noticed. Fixed; the test stays.

---

## 5. Lesson runtime — READY

`src/components/sx/`. Verified by walking `/lesson/m1.l1` end to end in Chrome:
concept → prediction (answered wrong, verdict and correct answer shown) →
concept → find-the-bug (line selected, fixed version revealed) → write-code.

14 block renderers, exhaustive over `BlockType` — a missing renderer is a
compile error, not a blank card in front of a student.

Decisions worth defending:

- **One block at a time**, not a scrolling page. A 45-minute session with
  14-year-olds does not survive a wall of content.
- **"Check" and "Next" are different buttons.** A learner must be able to sit
  with a wrong answer before leaving it.
- **Progress counts only attempt-bearing blocks.** Counting concept cards would
  let a learner "progress" by reading — the illusion the programme's
  verification section exists to prevent.
- **Explanations are never auto-graded.** They settle as `unknown` and go to the
  teacher. No string comparison can tell whether a 14-year-old understood
  something.
- **Reorder uses buttons, not drag.** Drag has no keyboard equivalent and fights
  page scroll on the touch laptops these classrooms use.
- **`unknown` renders as "әлі өлшенбеген"**, in its own neutral colour off the
  success axis, and the completion screen shows the count. Rendering it as 0%
  would claim a measurement never taken.
- **Language switch on every screen.** A learner stuck in one language can read
  the other without leaving the block. Default is Kazakh, not Russian.

---

## 6. Design system — READY

`src/app/globals.css` (tokens) + `src/app/solvex.css` (base).

**Font licensing was a release blocker and is now fixed.** The repo's existing
type is CoFo Brilliant and CoFo Robert, commercially licensed by Contrast
Foundry — the layout's own comment says they must not be deployed. The
SolveX4Schools surface uses IBM Plex Sans and JetBrains Mono, both SIL OFL, both
requested with the `cyrillic-ext` subset because Kazakh needs Ә Ғ Қ Ң Ө Ұ Ү Һ І
beyond the Russian set. Verified rendering in the browser.

**The `/brilliant` routes still load the CoFo faces.** Before any public deploy,
either drop those routes or drop those three `localFont` declarations. Flagged
in `layout.tsx` as a RELEASE BLOCKER.

Contrast measured against the background: primary text 15.2:1, secondary 7.1:1.
The muted tone is 3.6:1 and is never used for body copy.

---

## 7. Strobi — NOT READY, and a licence question for you

`@bible-strong/avatar-react@0.1.0` exists on npm with the API the avatar JSON
expects (`createAvatar`, `AvatarController`). The definition parses: sphere
240³, 25 animations, 28 expressions.

**It is licensed AGPL-3.0-only.** For a paid school product delivered over a
network, AGPL §13 requires offering the complete corresponding source of the
whole work to every user who interacts with it. That is a decision for you, not
for me, so I have not integrated it. Options: get a commercial licence from the
author, reimplement the avatar from the JSON definition (which is data, not
AGPL code), or accept the copyleft.

---

## 8. Not built — no partial credit claimed

- **Code execution sandbox.** The runtime has the seam (`onRun`) and currently
  states plainly that no sandbox is connected rather than faking a pass.
  Running learner-submitted Python on the application server is not an option.
- **Auth and the school/class/teacher/student/enrolment model.** Migration
  `0007` adds `school_subject_scope` so class-scoped access is expressible; the
  query layer and the auth are not written. The export's only access model is a
  flat admin allowlist that reads every learner in the database.
- **Nova.** The hint policy is imported and tested; the DeepSeek boundary,
  prompt-injection resistance, per-learner rate limiting and the disclosure rule
  are not built.
- **Arena, contests, practice planner, teacher console, reporting.**
- **Months 2–9 lesson bodies.** Structure exists and is validated; the bodies
  are `draft`, the validator reports 0 built for them, and the month map and
  lesson routes refuse to open them. A draft lesson URL is a 404, not an empty
  player.

## 9. Data residency

The programme commits to storing student data on servers inside Kazakhstan
(PDF p.4). That is a deployment constraint and cannot be satisfied by code in
this repo. It needs to be answered before the pilot takes a single real student
record.
