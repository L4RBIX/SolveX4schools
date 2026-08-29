# Requirement matrix

Every commitment the programme states, and where the implementation meets it.

`source-of-truth.ts` holds the PDF's own commitments as data rather than prose — nine year-end outcomes (p.2), five verification methods (p.6), three learner routes (p.4) — so a machine can ask where each is honoured. Regenerate with `npx tsx scripts/requirement-matrix.ts --markdown`.

**These are counts of evidence, not judgements of sufficiency.** Whether eleven oral defences across nine months make a learner able to argue for a solution aloud is not a question a count answers, and the script prints no verdict. Bank tasks are excluded throughout: evidence a learner may skip is not evidence.

## The one hand-written thing

The nine outcomes are sentences about what a fourteen-year-old can do in May, and nothing in the schema declares which outcome a block serves. So the mapping from outcome to block types is **authored** — the only hand-written mapping in any of these audit scripts — and each row states what it counts and why, in `scripts/requirement-matrix.ts`. A mapping can be wrong and the reason is there to be argued with. What it cannot do is silently disagree with the content, because the counts beside it are computed.

### Nine year-end outcomes (PDF p.2)

| # | Outcome | Evidence counted as | Blocks | Months | Assessed in |
|---|---|---|---|---|---|
| 1 | Есеп шартын оқып, не берілгенін және нені табу керегін ажыратады. | an unseen problem is where reading the statement is the whole first move, and a test_case forces the learner to say what the inputs actually are | 27 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| 2 | Кодқа отырмас бұрын шешу жоспарын құрып, оны сөзбен айтып бере алады. | the only blocks whose answer is a plan or an argument in words rather than a program | 44 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| 3 | Бөтен шешімді көшірмей, бағдарламаны өз бетінше жазады. | a whole program produced from an empty editor; a starter would be the copying this outcome rules out | 204 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| 4 | Бағдарламаны компьютер сияқты қадам-қадаммен қағазда тексереді. | the two block types where the learner is the computer and the machine is not consulted | 40 | 1, 2, 3, 4, 5, 6, 7, 8 | 2, 5, 6, 7 |
| 5 | Өз қатесін тауып, себебін түсініп түзетеді. | repairing a broken program, which is the same act on somebody else's code the outcome asks for on their own | 87 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1 |
| 6 | Қалыптан тыс жағдайларды қоса алып, өзінің тексеру мысалдарын құрастырады. | the only block whose answer IS an input the learner invented | 14 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 8 |
| 7 | Бағдарламаның берілген уақытқа үлгеретінін бағалайды және қажет болса жылдамдатады. | declared by skill rather than by type: the judgement appears as multiple_choice, explain and write_code alike, and what makes it this outcome is the subject | 68 | 4, 5, 6, 7, 8, 9 | 4, 7, 9 |
| 8 | Мектепішілік бағдарламалау жарыстарына қатысады және олардың қалай өтетінін біледі. | May's contest skills, and the tournament blocks that carry them | 43 | 9 | 9 |
| 9 | Шешімінің неге дұрыс екенін ауызша дәлелдейді. | the programme's own named method for this outcome, and the only block a teacher must listen to | 11 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |

### Five verification methods (PDF p.6)

| Method | Blocks | Months | In a monthly check |
|---|---|---|---|
| `unseen_problem` — Бейтаныс есептер | 13 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| `manual_trace` — Кодты қолмен орындау | 4 | 2, 5, 6, 7 | 2, 5, 6, 7 |
| `find_bug` — Қатені табу | 1 | 1 | 1 |
| `oral_explanation` — Ауызша түсіндіру | 11 | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| `delayed_resolve` — Уақыт өте қайта шешу | 1 | 9 | — |

### Three routes (PDF p.4)

| Route | Required tasks visible | Exclusive to this route |
|---|---|---|
| support — Қолдау | 469 | 53 |
| core — Негізгі | 483 | 0 |
| advanced — Тереңдетілген | 511 | 28 |

## What the outcomes say

Every one of the nine has evidence, and eight of the nine have it in most months. Two rows are worth reading twice, and they are the same fact seen from the outcome side:

- **Outcome 5 — «Өз қатесін тауып, себебін түсініп түзетеді».** 87 blocks, every month, **assessed in September alone.**
- **Outcome 6 — «өзінің тексеру мысалдарын құрастырады».** 14 blocks, every month, **assessed in April alone.**

Both are practised all year and formally checked once. The mechanism is below.

Outcome 8 sits only in May, which is correct rather than a gap: the programme puts contests in May and nowhere else.

## What the verification methods say

The five methods on p.6 are how the programme checks that a learner is working independently, and they are not used alike.

| Method | Blocks | Where |
|---|---|---|
| `unseen_problem` | 13 | Every month's check, plus May's five tournament problems |
| `oral_explanation` | 11 | Every month's check, plus May's two defences and one lesson block |
| `manual_trace` | 4 | October, January, February, March only |
| `find_bug` | **1** | September only |
| `delayed_resolve` | **1** | May only |

Two of the five are used once each across a nine-month year.

**`find_bug` as a formal check appears once, in September** — while `find_bug` appears **49 times as an ordinary practice block**. That gap is the finding. Practising bug-hunting forty-nine times is not the same as checking, once a month, that the learner can do it unaided; the programme lists the two separately on p.6 for that reason. A school reading p.6 would expect to see the method in a check more than once a year.

**`delayed_resolve` appears once, in May**, and this one is partly structural: its own definition is a problem «бірнеше аптадан соң қайта беріледі» — given again after several weeks — so it cannot appear in September and needs a stock of earlier problems to draw on. One instance is still thin for a method the programme names as one of five.

`manual_trace` sits in four of nine checks. Less stark, and worth noting beside the skill-matrix finding that five months teach a technique their own check never touches: a 20-minute check holds one unseen problem plus one other thing, and these tables show what that budget actually buys across the year.

Neither is fixed here. Both are changes to what a monthly check contains, which is the same decision `FULL_YEAR_SKILL_MATRIX.md` leaves open, and `FULL_YEAR_WORKLOAD.md` prices.

## What the routes say

`core` has no exclusive tasks — every block a core learner sees is either on all three routes or shared with advanced. That is the differentiation working as designed: support gets 53 substituted tasks of its own, advanced gets 28 additional ones, and core is the baseline both are defined against.

The route totals (469 / 483 / 511) are close together, which is the same fact `FULL_YEAR_WORKLOAD.md` and `FULL_YEAR_DIFFICULTY_AUDIT.md` both arrive at from other directions: the routes differ in what a task demands, not in how many there are.
