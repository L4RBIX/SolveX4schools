# Submitted work persistence — audit and the change it justified

## What existed, proven against a live row

`learning_submissions` had eight columns: `subject_id`, `submission_id`,
`block_id`, `episode_id`, `claimed_at`, `settled_at`, `verdict`, `response`.

`response` is the **server's reply**, not the learner's work:

```json
{"why":null,"cases":{"total":5,"passed":5},"saved":true,"reveal":null,
 "verdict":"correct","attested":false,"episodeId":"…","unmeasuredReason":null}
```

`grep -n "CODE_TRANSPORT_KEY|code_blobs|blob_hash" src/app/api/learning/submit/route.ts`
returns nothing. Of the 50 keys in `ALLOWED_PAYLOAD_KEYS`, none can carry an
answer. `code_blobs` is keyed by hash alone with no subject or block column —
Arena infrastructure, not a school answer store.

**So the answer reached the route, was graded, and was discarded.**

## Block-type coverage

`BlockAnswer` (`schools/learning/checking.ts`) already models every submission:

| block type | answer kind | persisted now | hydrated | public |
|---|---|---|---|---|
| prediction / multiple_choice | `option {id}` | yes | yes | own choice only — never `correctOptionId` |
| write_code / modify_code / challenge | `text {value}` | yes | yes | own source |
| explain / reflection / written verify | `text {value}` | yes | yes | own prose |
| fill_blank | `blanks {values[]}` | yes | yes | own values |
| reorder_code | `order {ids[]}` | yes | yes | own ordering, ids not content |
| find_bug | `line {line}` | yes | yes | own selection; no `diagnosticMapping` |
| trace_code | `grid {cells}` | yes | yes | own trace |
| test_case | `text {value}` | yes | yes | own input; no witness case |
| concept / acknowledge | `acknowledged` / `none` | stored, nothing to restore | n/a | n/a |

## Oral defence — honest limitation

The product captures **no audio**. "Oral" is a teacher-reviewed status, not a
digital artifact. Where an oral task carries a written preparation field it is
`text` and persists like any other; the spoken part settles `unknown` and stays
`pending_review`. **No oral-answer persistence is claimed.**

## The change

One nullable column, `learning_submissions.answer jsonb` (migration `0021`),
written on the **same UPDATE** that sets `verdict` and `response` inside
`appendEventsAndSettle` — the transaction that already appends the events and is
already guarded by `settled_at is null`.

No new table, no second system, no new vocabulary: the stored value is the
`BlockAnswer` the route already received and graded. Idempotency and atomicity
are inherited rather than re-implemented — a duplicate replay cannot write a
second artifact because it cannot re-settle a settled row.

Read back through the existing path: `settledBlocks` (one query per lesson,
`distinct on (block_id) … order by settled_at desc` — latest attempt) →
`lessonHydration` → `HydratedBlock.submitted` → `statesFrom` → the editor, which
already prefers `answer.value` over `starter`.

`readArtifact()` validates on the way out and returns `undefined` for anything
unrecognised, so a pre-0021 row restores its verdict beside an empty editor
rather than crashing.
