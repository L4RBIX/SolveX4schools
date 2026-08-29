# Russian native review — SolveX4Schools Grade 9

**Nobody who speaks Russian has read this curriculum.** Every string in it was written by an AI agent, checked by other AI agents, and shipped to this document. September is written by an agent too — what a human audited there was its correctness and its structure, not its Kazakh — so its 178 pairs are in scope like every other month's. That is the single largest unverified risk in the release, and no script in this repository can reduce it — the checks below are about the *relationship* between the two languages, not about whether either one is good.

Nothing in this package is marked reviewed. It becomes reviewed when a person signs the table at the end.

## What has already been checked, and what it does not tell you

`npx tsx scripts/l10n-review.ts` compares the Kazakh and Russian of all **1768** learner-facing string pairs on four mechanical signals:

| Signal | What it catches | Found |
|---|---|---|
| identical | A translation that never happened. Only counted when at least one side contains Cyrillic — `len(a) - 1` should be identical. | **3** |
| no Kazakh letters | Russian pasted into the Kazakh field. Run on prose with backticked code removed. | 0 |
| Kazakh letters in Russian | The same slip in reverse. | 0 |
| length outlier | The two sides differ by more than half — usually one lost a sentence. | 0 |

Verified to still fire: Russian injected into a `kk` field trips two signals, Kazakh leaking into `ru` trips one, and genuine prose trips none.

**The three flagged pairs.** Three unit titles are identical in both languages: `Арифметика` (month 1), `Рекурсия` (month 6), `Динамика` (month 8). These are probably correct — all three are international loanwords that take the same form in Kazakh and Russian — and they are left flagged rather than exempted because "probably correct" is a judgement for a native speaker and this document's whole purpose is to route those.

**Beyond those, the pairing is structurally sound and that is all this says.** A sentence can be grammatical, well-paired, correctly translated, and still be the wrong sentence to put in front of a fourteen-year-old. Everything that matters is in the pass below.

## The order to read in

Ordered by what it costs to get wrong, not by where it sits in the file.

| Priority | What | Why first | Count |
|---|---|---|---|
| 1 | Prompts on graded tasks | A learner who misreads one loses the mark for a thing they knew | 587 |
| 2 | Options and blanks | A mistranslated distractor makes a question unanswerable, and the diagnostic mapping then blames the learner for the wrong misconception | 197 |
| 3 | Concepts, worked examples, results, and the titles and objectives around them | A learner who misreads one learns it wrong and carries it | 798 |
| 4 | Expected points | Read by a teacher, who can compensate for an awkward sentence | 186 |

| Month | graded prompts | options and blanks | concepts and worked steps | expected points | Total | Flagged |
|---|---|---|---|---|---|---|
| 1 Қыркүйек | 54 | 12 | 103 | 9 | 178 | 1 |
| 2 Қазан | 85 | 20 | 97 | 15 | 217 | 0 |
| 3 Қараша | 74 | 20 | 106 | 19 | 219 | 0 |
| 4 Желтоқсан | 67 | 32 | 99 | 15 | 213 | 0 |
| 5 Қаңтар | 72 | 20 | 94 | 14 | 200 | 0 |
| 6 Ақпан | 66 | 24 | 77 | 30 | 197 | 1 |
| 7 Наурыз | 60 | 20 | 73 | 29 | 182 | 0 |
| 8 Сәуір | 55 | 20 | 86 | 19 | 180 | 1 |
| 9 Мамыр | 54 | 29 | 63 | 36 | 182 | 0 |
| **Year** | **587** | **197** | **798** | **186** | **1768** | **3** |

## What to look for

Grammar and spelling are the easy part and probably fine. These are the failures an agent produces that read as correct:

1. **School terminology.** Does this use the words Kazakh schools actually use for loop, function, list, index, remainder, sorting? An agent will produce a defensible calque where there is a settled term, and every learner will meet the wrong word all year.

2. **Register.** These are fourteen and fifteen year olds. Prose written for an adult reader is not wrong, it is just not for them.

3. **Prompts that are precise in one language and vague in the other.** The programming matters here: "the smallest such number" and "the position of the smallest such number" are different tasks, and a translation that blurs them makes the task ungradable.

4. **Boundary language.** «кемінде», «аспайды», «кем емес», «үлкен» — inclusive versus exclusive. A great many tasks in this curriculum are graded on exactly the boundary these words state. Getting one wrong makes the hidden test cases wrong, not just the sentence.

5. **The English tokens are deliberate.** Programs print `yes`, `no`, `even`, `odd` in English and the prompts say so. That is intentional — the output is compared byte for byte — so do not translate them; do check that each prompt names them clearly enough that a learner types the right thing.

6. **Untranslatable code.** Identifiers, operators and sample I/O stay as they are. Only the sentence around them is yours.

7. **Russian is the second language here.** The source programme is in Kazakh and the `ru` field is a parallel version for learners who take the Russian route. It has to be a complete, natural Russian statement of the same task — not a gloss of the Kazakh, and not shorter than it. Where the Russian is thinner than the Kazakh, that is a defect in the Russian even though no signal caught it.

8. **A Russian-route learner never sees the Kazakh.** So every reference the Kazakh makes to a lesson, a rule or an earlier task has to survive in the Russian on its own. A prompt that reads correctly only because you have just read its Kazakh twin is not finished.

## How to record findings

One row per string that needs changing. A file path plus block id is enough to find anything: block ids are unique across the year and `npx tsx scripts/task-digest.ts <month>` prints them with their prompts.

| Block id | Field | Problem | Suggested Russian |
|---|---|---|---|
| | | | |

## Sign-off

This curriculum must not be described as reviewed until this table is filled in by a person.

| | |
|---|---|
| Reviewer name | |
| Native Russian speaker | yes / no |
| Teaches Grade 9 or equivalent | yes / no |
| Months reviewed | |
| Priorities reviewed | |
| Date | |
| Signature | |

Partial is fine and honest — "months 1–3, priorities 1 and 2" is a real, useful sign-off. What is not acceptable is an unsigned table and a release note claiming review.
