# Full-year content freeze

**Frozen at `4bc030fb21433a4e093038fd04f9280b2381efb7`** — 2026-08-29, after April and May reached the content their source paragraphs specify.

Authoring is closed. What follows is audit, classification and repair.

## What is frozen

All nine months carry lesson bodies. The figures below are the core route, and they are kept apart on purpose — collapsing them is what produced a year of misleading reporting, and `TASK_COUNT_RECONCILIATION.md` is the account of that.

| Month | PDF «тапсырма» | Practice (comparable) | · independent | · guided coding | · other interaction | Explanation | Assessment | Contest | Bank | All blocks |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 Қыркүйек | 36 | **44** (+8) | 25 | 1 | 18 | 18 | 4 | 0 | 0 | 66 |
| 2 Қазан | 38 | **60** (+22) | 21 | 3 | 36 | 15 | 3 | 0 | 8 | 86 |
| 3 Қараша | 34 | **59** (+25) | 22 | 4 | 33 | 14 | 3 | 0 | 0 | 76 |
| 4 Желтоқсан | 32 | **51** (+19) | 22 | 2 | 27 | 12 | 4 | 0 | 0 | 67 |
| 5 Қаңтар | 30 | **59** (+29) | 19 | 5 | 35 | 12 | 4 | 0 | 0 | 75 |
| 6 Ақпан | 30 | **51** (+21) | 19 | 3 | 29 | 10 | 4 | 0 | 0 | 65 |
| 7 Наурыз | 26 | **48** (+22) | 17 | 2 | 29 | 10 | 4 | 0 | 0 | 62 |
| 8 Сәуір | 28 | **43** (+15) | 17 | 1 | 25 | 13 | 4 | 0 | 0 | 60 |
| 9 Мамыр | 25 | **42** (+17) | 4 | 2 | 16 | 9 | 7 | 20 | 0 | 58 |
| **Year** | **279** | **457** | **166** | 23 | 248 | 113 | 37 | 20 | 8 | 615 |

Regenerate with `npx tsx scripts/reconcile-counts.ts`.

**This table records the freeze commit and is deliberately not updated.** The
core-vs-bank re-audit that followed moved fourteen tasks onto the optional path,
so the current figures are 452 comparable practice tasks and 144 independent,
with 18 in the bank. Reclassification is one of the amendments allowed below;
`TASK_COUNT_RECONCILIATION.md` carries the live numbers.

## Amendments allowed after the freeze

Only these, and each needs its reason stated in the commit:

1. **Replacing or removing a defective task.** A wrong answer key, an unreachable block, an answer leak, a prerequisite violation, a case set that accepts the shortcut the task forbids — or a block that duplicates another in the same assessment and pushes it past its stated duration. Removal was not in this list when the freeze was written, and `m5.as.b2` was removed anyway; the list is corrected rather than the history.
2. **Closing a gap an audit proves.** Not "this month could use more problems" — a named official outcome with no evidence, a missing assessment requirement, a prerequisite with no bridge, a differentiation requirement unmet.
3. **Moving a task between core and bank.** Classification is not authoring; it adds nothing and removes nothing.
4. **Localisation repair** arising from native-speaker review.
5. **Metadata that makes existing content verifiable.** The `stdin` field added to `WorkedExampleBlock` is the precedent: it authored no content, and it let the thirteen worked examples that read input be executed instead of named as unverifiable.

## Not allowed

- More problems because one month looks light beside another
- Variants because generation is cheap
- Anything whose purpose is to move a count toward a number, including toward the PDF's
- Padding the bank to make the core look smaller

## Why freeze here rather than later

The programme's own figures are a floor — «Бұл минимум жиын» (p.11) — and the implementation already sits 64% above it on the comparable measure. Every further task makes the workload question harder to answer and the redundancy audit longer, and neither is served by more content. The remaining risk in this curriculum is not that it is too small.

## Baseline

| | |
|---|---|
| Branch | `curriculum-months-2-9` |
| Branched from | `59bf26b` |
| Baseline snapshot | `fc88245` |
| Freeze | the SHA at the top of this file |

*Counts refreshed 2026-09-05:2026-09-05: 452 / 144 / 506 / 625 after September's beginner lessons — `m1.l0`, `m1.l13` — and the seven code tasks that gained a starter frame; a guided task is not an independent one. See TASK_COUNT_RECONCILIATION.md.*
