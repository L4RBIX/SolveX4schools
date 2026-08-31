# September Pilot Candidate V1 — Content Freeze

September's educational content is **frozen** as of this document. The product
around it continues to change; the tasks, lessons and assessment do not, except
under the amendment rule in §4.

## 1. Identity of the frozen content

| | |
|---|---|
| Frozen at git SHA | `59bf26b` *(working tree; see §5)* |
| Curriculum hash (`sha256` of the serialised `MONTH_01_SEPTEMBER`) | `1f3e4640731ad7667db30ac38c0765a28c27f102e3df4e759df36ad81bd527e8` |
| Source file hash (`sha256`) | `f6779f15478cda70fd8cfbce7d2747b7def19c8674aafc506a425da16d602b8d` |
| Source file | `schools/curriculum/months/month-01-september.ts` |

The curriculum hash is over the serialised month object, not the file, so
comment and formatting changes do not break the freeze but any change to a
prompt, a case, an answer or an ordering does. `npm run curriculum:test-content`
recomputes it.

## 2. What is frozen

| | |
|---|---|
| Units | 5 |
| Lessons | 12 |
| Content blocks | 72 |
| **Attempt blocks ("tasks")** | **54** |
| Assessment blocks | 4 |
| Assessment duration | 20 minutes |
| Programme's promised task count (PDF p.7) | ~36 |
| Lesson status | `implemented` — **not** `published` |
| Assessment status | `implemented` — **not** `published` |

The built count exceeds the promised ~36 because eight requirements the PDF
names were missing and had to be authored. The PDF is explicit that its figures
are a floor («Бұл минимум жиын»).

### Assessment version

`m1.assessment`, four blocks: one unseen coding problem (`m1.as.b1`), one repair
of someone else's program (`m1.as.b2`), one written explanation covering the
PDF's four required reasoning points (`m1.as.b3`), one oral check (`m1.as.b4`).
This replaced a four-block set that was unreachable, ungradable, and contained
one impossible task.

## 3. Verification standing behind the freeze

| Gate | Result |
|---|---|
| `npm run curriculum:test-content` | **260 tests**, 2 skipped |
| `npm run test` | **661 tests**, 2 skipped |
| `npm run lint` | 0 errors |
| `npm run typecheck` | clean |
| `npm run curriculum:validate` | no errors |
| `npm run build` | success |
| Answer-key leak scan (all built `.html`/`.rsc`) | **0 leaks / 54 secrets / 120 files** |

Every reference solution is executed against every one of its own test cases on
each run. That guard was added because the original audit found a wrong answer
key sitting inside a fully green build.

## 4. Amendment rule

September content is frozen for human review. A change to
`schools/curriculum/months/month-01-september.ts` — or to any file the
curriculum hash covers — requires **all four** of:

1. **A reason**, stated in the commit message, that is a defect and not a preference.
2. **A finding it closes** — an audit reference, a reviewer comment from
   `docs/reviews/SEPTEMBER_HUMAN_SIGNOFF.md`, or a pilot incident.
3. **Content tests** proving the change: the executed reference solution, the
   new cases, and where relevant a test that fails without the fix.
4. **A changelog entry** in this file's §6, with the new curriculum hash.

Cosmetic rewrites, "improvements", and additional tasks are out of scope until
the pilot ends. The point of a freeze is that a reviewer's sign-off refers to
something specific.

## 5. Known limitations carried into the pilot

Recorded in `docs/audits/SEPTEMBER_REMEDIATION_REPORT.md` §7 and §10. Summarised
so a reviewer does not have to hunt:

- **Explanation is thinner than the programme implies.** ~20 minutes of
  explanation for the month against a platform share of roughly 33 minutes. The
  four worked examples are the shape the rest should follow.
- **Delayed re-solve** — the programme's fifth independence check. Being built
  as pilot infrastructure, not as content.
- **`test_case` blocks accept one literal breaking input.** A learner who finds
  a different genuinely-breaking input settles `unmeasured` rather than wrong.
- **Nova does not know which Python constructs have been taught** — it knows a
  lesson's skills. Being addressed as product work.
- **Support learners see a thin `m1.l8`** — both challenges are core/advanced by
  design, leaving that lesson short on the support route.
- **The working tree is dirty.** This freeze was taken against uncommitted work
  in a shared tree; §1's SHA is the last commit, not the content's provenance.
  The two hashes are what identify the content. Commit before sign-off.

## 6. Changelog

| Date | Curriculum hash | Change | Finding | Tests |
|---|---|---|---|---|
| Freeze | `1f3e4640…` | Initial freeze — September Pilot Candidate V1 | — | 260 content tests |
