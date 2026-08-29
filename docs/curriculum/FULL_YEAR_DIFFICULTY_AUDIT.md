# Difficulty and independence across the year

Does the curriculum get harder, and does the learner get more independent? Two questions that look like one.

Figures are the **core route, required path** — bank and contest excluded. May's twenty contest problems are classified `contest`, not `core`, which is why May's row looks thin: its independent work is the tournament, and the tournament is not in this table.

## The ratio says independence falls

| Month | Core tasks | Written from nothing | Ratio |
|---|---|---|---|
| 1 Қыркүйек | 44 | 25 | 57% |
| 2 Қазан | 60 | 22 | 37% |
| 3 Қараша | 55 | 18 | 33% |
| 4 Желтоқсан | 50 | 21 | 42% |
| 5 Қаңтар | 58 | 19 | 33% |
| 6 Ақпан | 50 | 18 | 36% |
| 7 Наурыз | 45 | 15 | 33% |
| 8 Сәуір | 43 | 17 | 40% |
| 9 Мамыр | 22 | 4 | 18% |

Read on its own that table says the programme makes learners *less* independent over the year, which would be a serious defect. It is not what is happening.

## What a from-nothing task actually demands

The same tasks, measured by the program the learner has to produce:

| Month | From-nothing tasks | Median lines | Median distinct constructs |
|---|---|---|---|
| 1 Қыркүйек | 25 | **2** | 9 |
| 2 Қазан | 22 | 6 | 13 |
| 3 Қараша | 18 | 11 | 15 |
| 4 Желтоқсан | 21 | 9 | 17 |
| 5 Қаңтар | 19 | 15 | 20 |
| 6 Ақпан | 18 | 9 | 15 |
| 7 Наурыз | 15 | **38** | 25 |
| 8 Сәуір | 17 | 12 | 19 |
| 9 Мамыр | 4 | 10 | 17 |

September's median from-scratch program is **two lines**: read a number, print something about it. March's is **thirty-eight**, a grid traversal with a queue, a distance table and a route walked back from its records.

So the two measures disagree because they measure different things. The count of from-nothing tasks per month is roughly flat, 15 to 25, all year. What changes by an order of magnitude is what one of them is worth. A ratio treats September's two-liner and March's thirty-eight-line search as one unit each, and on that accounting a month can only look less independent by asking for harder work.

The ratio is the wrong metric, and it is the metric a reviewer reaches for first. That is why both tables are here.

## The shape of the fall

The 57% in September is not the top of a slope, it is an artifact of the tasks being small enough that scaffolding would be absurd. There is nothing to give a learner a starter for when the whole program is two lines. From October onward the ratio sits between 33% and 42% with no trend, which is what a deliberate mix looks like rather than a decline.

Scaffolded tasks — `fill_blank`, `reorder_code`, `modify_code`, or a `write_code` with a starter — run 7% to 22% of the core path with no trend either. The remaining half is prediction, tracing, bug-hunting and explanation: the block types the PDF enumerates on p.3 as «Тапсырма түрлері» in its own right, not as scaffolding for coding.

## Differentiation holds all year

From-nothing tasks out of core tasks, per route:

| | m1 | m2 | m3 | m4 | m5 | m6 | m7 | m8 | m9 |
|---|---|---|---|---|---|---|---|---|---|
| support | 18/41 | 13/60 | 9/53 | 13/49 | 11/56 | 13/49 | 10/43 | 10/41 | 1/22 |
| core | 25/44 | 22/60 | 18/55 | 21/50 | 19/58 | 18/50 | 15/45 | 17/43 | 4/22 |
| advanced | 27/46 | 23/63 | 20/59 | 24/55 | 20/61 | 20/55 | 15/47 | 18/46 | 4/23 |

The ordering support < core < advanced holds in every month for from-nothing work — March is the one month where core and advanced tie at 15, and April recovers it. The support route consistently asks for roughly half as many programs from nothing as core, substituting a scaffolded form of the same task, which is what the support twin convention is.

Note what this table also shows: the support route's **total** is barely smaller than core's. That is the same fact `FULL_YEAR_WORKLOAD.md` reaches from the other direction — the support route reduces difficulty, not quantity.

## Not measured here

Whether the difficulty *curve* is right for a fourteen-year-old. These figures say the curve rises and say how steeply, in lines and constructs. They cannot say that March's thirty-eight-line median is reachable by a learner who wrote eleven-line programs in November, and no static measurement can. That is the same pilot the workload question is waiting on.
