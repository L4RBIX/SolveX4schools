import type { LessonBlock } from "../../types";

/**
 * Month 9 · Мамыр — the final tournament. Ninety minutes. PDF p.10.
 *
 * ## The clauses that build this file
 *
 * > «бес бейтаныс есептен тұратын қорытынды турнир және екі шешімді ауызша
 * > қорғау»
 *
 * Five unseen problems and two oral defences. That is the whole structure, and
 * it is quoted rather than designed: `b1`–`b5` are the five, `b6` and `b7` are
 * the two. There is no sixth kind of block here, because the programme names no
 * sixth thing.
 *
 * > «Қорытынды турнирде бес есептің кемінде екеуін шешу және өз шешімдерінің
 * > екеуін түсінікті түрде қорғау. Бірі болмаса, екіншісі жеке есепке
 * > алынбайды.»
 *
 * The pass mark is two of five, and the two halves count together or not at
 * all. That relationship lives in the assessment's `description` in
 * `month-09-may.ts` and in `b6`'s prompt, where the learner is told who applies
 * it — the teacher. It is deliberately NOT encoded as a conjunction the machine
 * pretends to score: no block type can express «бірі болмаса, екіншісі есепке
 * алынбайды» honestly, and faking it would put a computed verdict on a rule a
 * person has to apply.
 *
 * > «Бұл айда жаңа тақырып жоқ.»
 *
 * Holds here too, and harder than anywhere else in the year: a final
 * measurement that needed an unseen technique would be measuring the ninety
 * minutes rather than the nine months. Every problem below names, in its
 * comment, the month that taught its method and the technique it expects.
 *
 * ## The five, and the year they walk
 *
 *   A · Қазан      — one traversal of two parallel lists, with a rule   (m2)
 *   B · Желтоқсан  — order the jobs, then accumulate                    (m4)
 *   C · Қаңтар     — binary search over the ANSWER                      (m5)
 *   D · Наурыз     — flood fill, and a property of the whole region     (m7)
 *   E · Сәуір      — a two-dimensional table, filled in order           (m8)
 *
 * September is in all five — each reads its lines and prints one number — and
 * A's halving is September's `//`. The brief's five families (first half;
 * sorting or precomputation; a search; a grid or recursion; greedy or DP) are
 * A, B, C, D, E in that order, and B carries the greedy argument as well as the
 * sort: «әр қадамда ең тиімді нұсқаны таңдап, оның шынымен ең жақсы жауапқа
 * жеткізетінін тексеру» is exactly what the exchange argument for B is.
 *
 * November's functions and February's recursion are the two months without a
 * problem of their own, and both were left out on purpose. «Шешім функция болуы
 * керек» is a requirement output comparison cannot see (the authoring
 * contract's defect class 4), so a November problem would either state a rule
 * nobody enforces or be November's in name only. A February problem would want
 * a recursive fill, and D's grid reaches 100 × 100 = 10 000 cells — a recursion
 * that deep ends in `RecursionError`, and this month may not `import sys` to
 * raise the limit. March's queue is the taught way to walk that grid, so D is
 * March's. Both months are still defended: `b6` and `b7` are about the
 * learner's own code, whatever shape it has.
 *
 * ## Nothing here repeats a problem the year has already set
 *
 * Every program in the curriculum — 669 of them, all nine months — was
 * extracted and compared against these five, byte for byte and ignoring
 * whitespace, by script rather than by eye. That check is necessary and is not
 * sufficient: two different programs can be the same PROBLEM. So the whole
 * problem inventory was read as well, and five candidate problems — three of
 * them already written and passing every gate — were thrown away rather than
 * shipped:
 *
 *   · «how many students share the top score» — `m9.l2.b5` is a `find_bug` on
 *     that exact problem and puts the repaired program on screen earlier in
 *     this same month;
 *   · «the size of the largest region» — `m9.c4.p4`, with corners counting as
 *     neighbours instead of sides;
 *   · «the longest increasing subsequence» — `m8.p9`, April's own practice;
 *   · «the smallest difference between two of the numbers» — `m4.l4`;
 *   · «how many numbers are larger than the one before» — `m2.l9.b4`, again a
 *     `find_bug` with the program on screen.
 *
 * What survives is five problems the year has not set. The METHODS repeat on
 * purpose — C is January the way `m9.c1.p5` is January, D walks the grid the
 * way `m9.c2.p4` and `m9.c4.p4` do — because a tournament that avoided every
 * technique the four practice contests used would be a tournament on the
 * material nobody practised. What must not repeat is the question, and D is the
 * clearest case: `c2.p4` asks which cells a guard cannot reach, `c2.p5` asks
 * for a shortest route through a shop, `c4.p4` asks for the largest region's
 * size, and this asks how many regions never touch the edge. The same walk
 * answers four different questions, and on any given map all four answers
 * differ.
 *
 * ## Ninety minutes, and why the five do not fit into them
 *
 * Ninety is the programme's figure for the tournament, so the 20-minute rule
 * the monthly checks are held to does not apply here. The five are roughly 8,
 * 12, 18, 20 and 25 minutes of work; the two defences are three or four minutes
 * each, heard while the rest of the room is still coding, exactly as
 * `m6.as.b4` is heard. Eighty-three minutes of problems inside eighty minutes
 * of coding is not an oversight: «кемінде екеуін шешу» is the bar, and a
 * tournament everyone finishes measures nothing about choosing what to open
 * next. A learner who spends forty minutes on C has lost D and E, and that is
 * the year's own `contest.time_split` being examined.
 *
 * A is genuinely easy and stays easy. A final tournament where nobody solves
 * anything records a year's work as zero, which is a claim about the class
 * rather than about the learners.
 *
 * ## The structural requirement, and which honest option each block took
 *
 * Nowhere below does a prompt say the solution must define a function, must
 * return rather than print, or must use a named method. Output comparison sees
 * none of that.
 *
 *   · C takes **option 1 — make the output impossible without it.** Its H runs
 *     to 10⁹, and one hidden case, «2 1500000000 / 1000000000 1000000000»,
 *     needs 750 million steps from a solution that tries every H in turn: that
 *     program was written and run, and it passed every other case and ran out
 *     of time on that one — against the ten seconds `check-blocks` allows, and
 *     therefore against the five the judge allows
 *     (`EXECUTION_LIMITS.timeLimitMs`). The statement gives the bound and says
 *     a step-by-step trial will not finish. It names no method — this is an
 *     unseen problem, not a lesson — and the constraint does the work a
 *     sentence would only have claimed.
 *   · A, B, D and E take **option 2 — say nothing structural and grade the
 *     answer.** Their prompts state the problem, the bounds and the output, and
 *     the judge compares the number. A learner who arrives by a route the
 *     comment did not predict is right.
 *   · The tournament as a whole takes **option 3 — send it to a human.** That
 *     is what `b6` and `b7` are, and it is the programme's own arrangement:
 *     «оқушы шешімді өз сөзімен түсіндіруге ... міндетті» (p.4). The defence is
 *     not a consolation for a missing checker; it is half the mark.
 *
 * ## Cases
 *
 * One visible case per problem — the sample the statement already prints — and
 * every other case hidden. A «бейтаныс есеп» that can be passed by echoing the
 * sample measures nothing, and this is the year's last measurement. Each
 * block's comment names the degenerate programs and the case that kills each;
 * every one of them was written out and executed against the full case set
 * before the cases were frozen, not argued about.
 *
 * ## Provenance
 *
 * `b1`–`b5` cite p.6: «Бейтаныс есептер» is the first of the programme's five
 * general verification methods and is what `mode: "unseen_problem"` implements.
 * Two of the five methods appear here and not three, which is the one place
 * this check departs from the other eight: May's own «Айлық сынақ» sentence
 * names exactly two things, and inventing a paper trace or a find-the-bug card
 * to reach a quota would be adding work the programme does not ask for to the
 * one assessment whose length it fixes itself. The month's third method is
 * `delayed_resolve`, and it is in `m9.l3.b3` — «апта сайын ескі есептерді
 * көмексіз қайта орындау» is a weekly habit, not a tournament event, and May is
 * the only month where that mode has a home at all.
 * `b6` and `b7` cite p.10, because the clause that makes them compulsory, fixes
 * their number at two and ties them to the solved problems is May's own
 * sentence and appears nowhere else. In both cases the claim is about the
 * block's mode and its place in the tournament, not about the invented
 * scenarios — the reading the other eight monthly checks use.
 *
 * ## No `tracks`
 *
 * All seven blocks go to all three routes. A final tournament whose support
 * route is four problems produces a result that cannot be compared across a
 * class, and «Қолдау» is a route through the same material, not a shorter year.
 * The differentiation p.6 asks for is carried by the month's lessons —
 * `m9.l1.b8s` and `m9.l4.b6s` are support twins, and the advanced route's
 * compulsory written defence is `m9.l4.b5`. Here everyone gets the same five
 * problems and the same two defences.
 *
 * Python: `input`, `int`, `map`, `split`, `list`, `for`, `while`, `range`,
 * `len`, `.append`, `.sort`, `max`, `//`, `%`, a list of lists, and
 * subscripting a list and a string. No import of any kind, no `set`, no `dict`,
 * no comprehension — the whole year, and nothing after it.
 */
export const M9_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * A · ~8 minutes. OCTOBER: «тізімді бір рет қарап шығу» over TWO parallel
     * lists (m2.l4, m2.l5), with September's `//` doing the halving and
     * September's `if/else` choosing between the two rules. Nothing else.
     *
     * Two lists read in step with one index is the one shape none of the
     * month's other easy problems has, and it is what makes this problem
     * unseen while staying a five-minute problem: the work is holding `a[i]`
     * and `late[i]` together, not thinking of anything.
     *
     * The degenerate programs, and the case that kills each:
     *   · halving every task                 → the visible sample answers 6
     *     against a truth of 9;
     *   · halving none                       → the sample answers 15;
     *   · halving the ON-TIME ones           → the sample answers 12;
     *   · rounding the half UP               → «1 / 7 / 1» answers 4 (truth 3)
     *     and «4 / 9 9 9 9 / 1 1 1 1» answers 20 (truth 16);
     *   · `/` instead of `//`                → the sample prints `10.0`, which
     *     is not the number and not an integer;
     *   · a loop that stops one short        → «3 / 1 1 100 / 0 0 1» answers 2,
     *     truth 52 — the late task worth a hundred is the LAST one;
     *   · a loop that starts one late        → «3 / 100 1 1 / 1 0 0» answers 2,
     *     truth 52, the same trick at the other end.
     * «2 / 1 1 / 1 0» is the smallest place where halving loses everything: one
     * point halved is zero, and the answer is 1 rather than 2.
     */
    id: "m9.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["lists.traverse", "loops.counter", "arith.integer_division", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**A. Кешіктіріп тапсырылған есептер.** Олимпиадада n есеп ұсынылды. Оқушы бәрін шешті, бірақ кейбірін мерзімінен кейін тапсырды. Мерзімінде тапсырылған есеп үшін оның ұпайы толық беріледі. Кешіктіріп тапсырылған есеп үшін ұпайдың жартысы ғана беріледі, әрі бөлінбесе, кем жағына қарай дөңгелектенеді: 7 ұпайлық есеп кешіктірілсе, 3 ұпай береді.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 100000). Екінші жолда бос орынмен бөлінген n бүтін сан — есептердің ұпайлары (0 ≤ a[i] ≤ 100). Үшінші жолда бос орынмен бөлінген n сан, әрқайсысы 0 не 1: 1 — сол есеп кешіктіріліп тапсырылған, 0 — мерзімінде.\n\n**Шығыс.** Бір бүтін сан — оқушының жалпы ұпайы.\n\n**Мысал.**\n\n```\n3\n5 7 3\n0 1 1\n```\n\nЖауап: `9` — бірінші есеп 5 ұпайын толық береді, 7-нің жартысы 3, 3-тің жартысы 1.",
      ru: "**A. Задачи, сданные с опозданием.** На олимпиаде было n задач. Ученик решил все, но часть сдал после срока. За задачу, сданную вовремя, начисляются все её баллы. За сданную с опозданием — только половина баллов, причём при делении с остатком результат округляется ВНИЗ: задача в 7 баллов, сданная с опозданием, приносит 3 балла.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 100000). Во второй строке n целых чисел через пробел — баллы за задачи (0 ≤ a[i] ≤ 100). В третьей строке n чисел через пробел, каждое 0 или 1: 1 — задача сдана с опозданием, 0 — вовремя.\n\n**Выход.** Одно целое число — общий балл ученика.\n\n**Пример.**\n\n```\n3\n5 7 3\n0 1 1\n```\n\nОтвет: `9` — первая задача даёт все свои 5 баллов, половина от 7 равна 3, половина от 3 равна 1.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "late = list(map(int, input().split()))\n" +
      "total = 0\n" +
      "for i in range(n):\n" +
      "    if late[i] == 1:\n" +
      "        total = total + a[i] // 2\n" +
      "    else:\n" +
      "        total = total + a[i]\n" +
      "print(total)",
    cases: [
      { input: "3\n5 7 3\n0 1 1", expectedOutput: "9" },
      /* One task, late and on time: the smallest legal input both ways, and the
         odd score is where rounding up shows. */
      { input: "1\n7\n1", expectedOutput: "3", hidden: true },
      { input: "1\n7\n0", expectedOutput: "7", hidden: true },
      /* Zero-point tasks, all late: the answer is 0 and nothing crashes. */
      { input: "4\n0 0 0 0\n1 1 1 1", expectedOutput: "0", hidden: true },
      /* Nothing late, then everything late, on the same odd scores. */
      { input: "4\n9 9 9 9\n0 0 0 0", expectedOutput: "36", hidden: true },
      { input: "4\n9 9 9 9\n1 1 1 1", expectedOutput: "16", hidden: true },
      /* The task that matters is the last one, then the first one. */
      { input: "3\n1 1 100\n0 0 1", expectedOutput: "52", hidden: true },
      { input: "3\n100 1 1\n1 0 0", expectedOutput: "52", hidden: true },
      /* One point halved is nothing at all. */
      { input: "2\n1 1\n1 0", expectedOutput: "1", hidden: true },
      /* Alternating, with both even and odd scores halved. */
      { input: "5\n2 4 6 8 10\n1 0 1 0 1", expectedOutput: "21", hidden: true },
    ],
  },
  {
    /*
     * B · ~12 minutes. DECEMBER for the ordering (m4.l3) and OCTOBER for the
     * accumulator (m2.l5); the reason the ordering is the right one is APRIL's
     * «әр қадамда ең тиімді нұсқаны таңдап, оның шынымен ең жақсы жауапқа
     * жеткізетінін тексеру» (m8.l1). The exchange argument is short enough for
     * a fourteen-year-old to find: swap two neighbouring jobs and only their
     * own two waits change, so the shorter one belongs first.
     *
     * The number wanted is the sum of the FINISH times, and a job's own length
     * is counted once for itself and once for everybody still behind it. That
     * is the whole difficulty, and it is why the total printing time is a
     * tempting wrong answer.
     *
     * The visible sample deliberately shows both numbers — 10 for the sorted
     * order and 13 for the order as given — because "sort first" is the idea
     * the problem is about, not a trap worth hiding at problem B.
     *
     * The degenerate programs, and the case that kills each:
     *   · not ordering at all           → «3 / 3 1 2» answers 13, truth 10;
     *     «5 / 5 4 3 2 1» answers 55, truth 35.
     *   · ordering longest-first        → the sample answers 14, and
     *     «5 / 1 2 3 4 5» answers 55.
     *   · printing the total printing
     *     time, i.e. the last finish    → the sample answers 6, «2 / 1 1»
     *     answers 2 against a truth of 3.
     *   · counting the wait BEFORE a
     *     job rather than up to the end
     *     of it                         → «1 / 5» answers 0, truth 5.
     * «2 / 1000000000 1000000000» and «3 / 1 1 1000000000» are the top of the
     * range: the answer runs past 10⁹, which no Python integer minds and a
     * learner should still see once.
     */
    id: "m9.as.b2",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["sort.basic", "loops.accumulator", "greedy.core", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**B. Принтер кезегі.** Мектепте бір ғана принтер бар. n оқушы жұмысын басып шығаруға берді: i-оқушының жұмысы a[i] минут басылады. Лаборант жұмыстарды өзі таңдаған ретпен бірінің артынан бірін басады, аралықта үзіліс жоқ. Оқушының күту уақыты — принтер жұмыс істей бастаған сәттен өз жұмысы басылып біткен сәтке дейінгі минут саны.\n\nЖұмыстардың ретін барлық оқушының күту уақытының қосындысы ең аз болатындай таңда да, сол ең аз қосындыны шығар.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 200000). Екінші жолда бос орынмен бөлінген n бүтін сан a[1] … a[n] (1 ≤ a[i] ≤ 1 000 000 000).\n\n**Шығыс.** Бір бүтін сан — күту уақыттарының ең аз қосындысы.\n\n**Мысал.**\n\n```\n3\n3 1 2\n```\n\nЖауап: `10`. Жұмыстар 1, 2, 3 ретімен басылса, олар 1-, 3- және 6-минутта бітеді: 1 + 3 + 6 = 10. Ал берілген ретпен (3, 1, 2) басылса, 3 + 4 + 6 = 13 болар еді.",
      ru: "**B. Очередь к принтеру.** В школе всего один принтер. n учеников сдали работы на печать: работа i-го ученика печатается a[i] минут. Лаборант печатает работы одну за другой в том порядке, который выберет сам, без перерывов. Время ожидания ученика — это число минут от момента, когда принтер начал работать, до момента, когда его собственная работа допечатана.\n\nВыбери порядок работ так, чтобы сумма времён ожидания всех учеников была наименьшей, и выведи эту наименьшую сумму.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 200000). Во второй строке n целых чисел через пробел: a[1] … a[n] (1 ≤ a[i] ≤ 1 000 000 000).\n\n**Выход.** Одно целое число — наименьшая сумма времён ожидания.\n\n**Пример.**\n\n```\n3\n3 1 2\n```\n\nОтвет: `10`. Если печатать в порядке 1, 2, 3, работы будут готовы на 1-й, 3-й и 6-й минуте: 1 + 3 + 6 = 10. А в том порядке, в каком они даны (3, 1, 2), вышло бы 3 + 4 + 6 = 13.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "run = 0\n" +
      "total = 0\n" +
      "for i in range(n):\n" +
      "    run = run + a[i]\n" +
      "    total = total + run\n" +
      "print(total)",
    cases: [
      { input: "3\n3 1 2", expectedOutput: "10" },
      /* One student: the wait is the job, not zero. */
      { input: "1\n5", expectedOutput: "5", hidden: true },
      /* Two equal jobs: 1 + 2, and the total printing time is only 2. */
      { input: "2\n1 1", expectedOutput: "3", hidden: true },
      /* All equal: the order cannot matter, and the answer is still not 16. */
      { input: "4\n4 4 4 4", expectedOutput: "40", hidden: true },
      /* Already ascending, then exactly reversed: the same answer both times. */
      { input: "5\n1 2 3 4 5", expectedOutput: "35", hidden: true },
      { input: "5\n5 4 3 2 1", expectedOutput: "35", hidden: true },
      /* Unordered, nothing repeated. */
      { input: "4\n7 1 9 3", expectedOutput: "36", hidden: true },
      /* The top of the range: the answer passes 10⁹. */
      { input: "2\n1000000000 1000000000", expectedOutput: "3000000000", hidden: true },
      /* One huge job among small ones: putting it first costs three billion. */
      { input: "3\n1 1 1000000000", expectedOutput: "1000000005", hidden: true },
    ],
  },
  {
    /*
     * C · ~18 minutes. JANUARY: «жауап бойынша іздеу» (m5.l3) — the search runs
     * over the answer H, not over the list, and the check inside it is a
     * month-2 accumulator with a month-1 condition. What the learner has to see
     * is that raising the blade never yields more wood, so the H that work form
     * one unbroken stretch.
     *
     * THE CONSTRAINT IS THE REQUIREMENT. H reaches 10⁹, and the hidden case
     * «2 1500000000 / 1000000000 1000000000» needs 750 million steps from a
     * program that tries every H in turn: that program was written and run, it
     * passed every other case, and on that one it ran past both the ten seconds
     * `check-blocks` allows and the five the judge allows. This is option 1 of
     * the authoring contract — the output is not reachable by the other method
     * — and it is why the prompt can say
     * «біртіндеп сынап көруге уақыт жетпейді» without naming a method. Naming
     * one would make the problem seen, and «бейтаныс есеп» is the point.
     *
     * `m9.c1.p5` is January too, and the file header says why that is intended.
     * The checks differ where it matters: `c1.p5` sums `c[i] // m` and cannot go
     * wrong by arithmetic, this one sums `h[i] - H` over the trees that clear
     * the blade and is wrong the moment a short tree is allowed to contribute.
     *
     * The degenerate programs, and the case that kills each:
     *   · summing `h[i] - H` without skipping the short trees, so a tree under
     *     the blade SUBTRACTS wood → «3 5 / 10 1 1» answers 2 (truth 5),
     *     «5 3 / 100 1 1 1 1» answers 20 (truth 97), «2 1 / 1 1000000000»
     *     answers 500000000 (truth 999999999), and the visible sample answers 9
     *     instead of 11.
     *   · `got > m` where the statement says «кем болмаса», rejecting an exact
     *     fit → «3 5 / 10 1 1» answers 4, «4 4 / 10 10 10 10» answers 8,
     *     «1 1 / 1000000000» answers 999999998.
     *   · a search that cannot return 0 → «3 6 / 1 2 3» and «1 5 / 5» are both
     *     0, and a low bound of 1 answers 1 on each.
     *   · trying every H downwards from the tallest tree → the case with two
     *     billion metres of wood does not finish.
     * In three of the cases the answer is no tree's height, which is the other
     * thing to get wrong here: «жауап ағаштардың бірінің биіктігі» is false.
     */
    id: "m9.as.b3",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["bsearch.core", "bsearch.boundary", "perf.time_estimate", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**C. Отын дайындау.** Мектепке қысқа дәл m метр отын керек. Орманшы n ағашты кесуге рұқсат берді: i-ағаштың биіктігі h[i] метр. Аралайтын машинаның пышағы H биіктігіне бір рет қойылады да, барлық ағаш сол биіктікте кесіледі. Биіктігі H-тан үлкен ағаштан h[i] − H метр отын түседі; биіктігі H-тан аспайтын ағаш мүлде кесілмейді және ештеңе бермейді.\n\nМектеп ағаштарды барынша аз зақымдағысы келеді, сондықтан H-ты барынша жоғары қойғысы келеді. Жиналатын отын m метрден кем болмайтындай ең үлкен бүтін H-ты тап.\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен m (1 ≤ n ≤ 200000, 1 ≤ m ≤ 1 000 000 000 000). Екінші жолда n бүтін сан h[1] … h[n] (1 ≤ h[i] ≤ 1 000 000 000). H = 0 болғанда жиналатын отын m метрден кем болмайтыны кепілдендірілген, сондықтан жауап әрқашан бар.\n\n**Шығыс.** Бір бүтін сан — H-тың ең үлкен мүмкін мәні. Жауап 0 болуы да мүмкін.\n\n**Мысал.**\n\n```\n4 9\n12 8 20 5\n```\n\nЖауап: `11`. H = 11 болғанда 12-ден 1 метр, 20-дан 9 метр, барлығы 10 метр түседі — бұл 9-дан кем емес. Ал H = 12 болғанда небәрі 8 метр түседі, бұл жетпейді.\n\nH мәні миллиардқа дейін жетеді, сондықтан оны 0-ден бастап біртіндеп сынап көруге уақыт жетпейді.",
      ru: "**C. Заготовка дров.** Школе нужно ровно m метров дров на зиму. Лесник разрешил спилить n деревьев: высота i-го дерева равна h[i] метров. Нож пилорамы один раз выставляют на высоту H, и все деревья срезаются на этой высоте. С дерева выше H получается h[i] − H метров дров; дерево, высота которого не превышает H, вообще не режут, и оно ничего не даёт.\n\nШкола хочет повредить деревья как можно меньше, поэтому хочет выставить H как можно выше. Найди наибольшее целое H, при котором дров получится не меньше m метров.\n\n**Вход.** В первой строке через пробел даны n и m (1 ≤ n ≤ 200000, 1 ≤ m ≤ 1 000 000 000 000). Во второй строке n целых чисел h[1] … h[n] (1 ≤ h[i] ≤ 1 000 000 000). Гарантируется, что при H = 0 дров получается не меньше m, поэтому ответ существует всегда.\n\n**Выход.** Одно целое число — наибольшее возможное значение H. Ответ может быть равен и нулю.\n\n**Пример.**\n\n```\n4 9\n12 8 20 5\n```\n\nОтвет: `11`. При H = 11 с дерева высотой 12 получится 1 метр, с дерева высотой 20 — 9 метров, всего 10 метров, а это не меньше девяти. При H = 12 выйдет только 8 метров, и этого мало.\n\nЗначение H доходит до миллиарда, поэтому перебирать его по одному начиная с нуля времени не хватит.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "h = list(map(int, input().split()))\n" +
      "low = 0\n" +
      "high = max(h)\n" +
      "while low < high:\n" +
      "    mid = (low + high + 1) // 2\n" +
      "    got = 0\n" +
      "    for i in range(n):\n" +
      "        if h[i] > mid:\n" +
      "            got = got + h[i] - mid\n" +
      "    if got >= m:\n" +
      "        low = mid\n" +
      "    else:\n" +
      "        high = mid - 1\n" +
      "print(low)",
    cases: [
      { input: "4 9\n12 8 20 5", expectedOutput: "11" },
      /* Every metre is needed: the blade goes to the ground and the answer is 0. */
      { input: "3 6\n1 2 3", expectedOutput: "0", hidden: true },
      { input: "1 5\n5", expectedOutput: "0", hidden: true },
      /* One tree, one metre: the answer is one below the top of the range. */
      { input: "1 1\n1000000000", expectedOutput: "999999999", hidden: true },
      /* All trees equal: an exact fit at H = 9, which `>` rejects. */
      { input: "4 4\n10 10 10 10", expectedOutput: "9", hidden: true },
      /* One tall tree over two short ones: the short trees must contribute
         nothing rather than subtract, and the fit at H = 5 is exact. */
      { input: "3 5\n10 1 1", expectedOutput: "5", hidden: true },
      /* The same shape, further apart: the answer is no tree's height. */
      { input: "5 3\n100 1 1 1 1", expectedOutput: "97", hidden: true },
      /* Two billion metres of wood: a scan over every H does not finish. */
      { input: "2 1500000000\n1000000000 1000000000", expectedOutput: "250000000", hidden: true },
      /* A single metre from a forest of two, one of which is a sapling. */
      { input: "2 1\n1 1000000000", expectedOutput: "999999999", hidden: true },
    ],
  },
  {
    /*
     * D · ~20 minutes. MARCH: «ұяшық және көрші ұяшық» and the wave over a grid
     * (m7.l2, m7.l4), with the queue held as a list plus a head index — March's
     * own device, which is January's two-pointer idea reused. Nothing is
     * imported and no cell is stored as a pair: a cell travels as the single
     * number `r * m + c`, which is the month's own arithmetic.
     *
     * What is new is the QUESTION, and the file header sets it against the
     * month's three other grid problems. The walk visits a region; the property
     * being decided belongs to the whole region and not to any one cell, so the
     * flag has to be raised anywhere inside the walk and read after it ends. A
     * learner who tests the starting cell alone gets a program that is right on
     * most maps.
     *
     * A recursive fill is the other natural solution and is out of reach on
     * purpose: 100 × 100 is 10 000 cells, a solid map recurses that deep, and
     * this month may not `import sys` to raise the limit.
     *
     * The degenerate programs, and the case that kills each:
     *   · counting every lake            → the visible sample answers 3 against
     *     a truth of 2, and the solid 3 × 3 answers 1 against 0.
     *   · counting CELLS of closed lakes → the sample answers 6, and the
     *     five-row map answers 7 against 3.
     *   · testing only the cell the fill
     *     started from                   → «4 6» — the lake that starts deep
     *     inside and crawls out to the last row — answers 1, truth 0.
     *   · testing only the first and last
     *     ROW and forgetting the columns → «5 1» answers 1 and «3 4 / ###.»
     *     answers 1; both are 0.
     *   · counting corners as neighbours → «4 5» with two diagonal cells joins
     *     them into one lake and answers 1, truth 2.
     * The one-row and one-column maps are the edge worth having twice: on them
     * EVERY cell is on the border, so the answer is 0 whatever the water does.
     * «1 1 / #», «1 1 / .» and the map with no water at all are the three
     * smallest inputs and all three are 0 for three different reasons.
     */
    id: "m9.as.b4",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["graph.bfs", "graph.regions", "grid.cells", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**D. Жабық көлдер.** Ауданның картасы n жол мен m бағаннан тұратын тор түрінде берілген: `#` — су, `.` — құрғақ жер.\n\nЕкі су ұяшығы, ортақ қабырғасы болса, яғни бірі екіншісінің дәл үстінде, астында, сол жағында немесе оң жағында тұрса, бір көлге жатады. Тек бұрышымен түйісетін ұяшықтар бір көлге жатпайды. Су ұяшықтарының тізбегі арқылы жалғасқан ұяшықтар да сол көлдің бөлігі саналады.\n\nКөлді ЖАБЫҚ деп атаймыз, егер оның бірде-бір ұяшығы картаның шетінде тұрмаса: яғни бірінші жолда да, соңғы жолда да, бірінші бағанда да, соңғы бағанда да ешбір ұяшығы болмаса.\n\nКартада неше жабық көл бар?\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен m (1 ≤ n ≤ 100, 1 ≤ m ≤ 100). Келесі n жолда картаның жолдары: әрқайсысында дәл m таңба, әр таңба `#` не `.`.\n\n**Шығыс.** Бір бүтін сан — жабық көлдердің саны. Жабық көл болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n5 6\n......\n.##...\n.##.#.\n....#.\n.#....\n```\n\nЖауап: `2`. Картада үш көл бар: төрт ұяшықты көл де, екі ұяшықты көл де жабық, ал соңғы жолдағы жалғыз ұяшық картаның шетінде тұр, сондықтан ол жабық емес.",
      ru: "**D. Закрытые озёра.** Карта района дана в виде таблицы из n строк и m столбцов: `#` — вода, `.` — суша.\n\nДве клетки воды принадлежат одному озеру, если у них есть общая сторона, то есть одна стоит прямо над, под, слева или справа от другой. Клетки, соприкасающиеся только углом, к одному озеру не относятся. Клетки, связанные через цепочку клеток воды, тоже входят в это озеро.\n\nНазовём озеро ЗАКРЫТЫМ, если ни одна его клетка не стоит на краю карты: то есть ни одной его клетки нет ни в первой строке, ни в последней, ни в первом столбце, ни в последнем.\n\nСколько на карте закрытых озёр?\n\n**Вход.** В первой строке через пробел даны n и m (1 ≤ n ≤ 100, 1 ≤ m ≤ 100). В следующих n строках — строки карты: в каждой ровно m символов, каждый из них `#` или `.`.\n\n**Выход.** Одно целое число — количество закрытых озёр. Если закрытых озёр нет, выведи 0.\n\n**Пример.**\n\n```\n5 6\n......\n.##...\n.##.#.\n....#.\n.#....\n```\n\nОтвет: `2`. На карте три озера: и озеро из четырёх клеток, и озеро из двух клеток закрытые, а одиночная клетка в последней строке стоит на краю карты, поэтому закрытой не считается.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "g = []\n" +
      "for i in range(n):\n" +
      "    g.append(input())\n" +
      "seen = []\n" +
      "for i in range(n):\n" +
      "    row = []\n" +
      "    for j in range(m):\n" +
      "        row.append(0)\n" +
      "    seen.append(row)\n" +
      "closed = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(m):\n" +
      '        if g[i][j] == "#" and seen[i][j] == 0:\n' +
      "            seen[i][j] = 1\n" +
      "            queue = [i * m + j]\n" +
      "            head = 0\n" +
      "            touches = 0\n" +
      "            while head < len(queue):\n" +
      "                cell = queue[head]\n" +
      "                head = head + 1\n" +
      "                r = cell // m\n" +
      "                c = cell % m\n" +
      "                if r == 0 or r == n - 1 or c == 0 or c == m - 1:\n" +
      "                    touches = 1\n" +
      '                if r > 0 and g[r - 1][c] == "#" and seen[r - 1][c] == 0:\n' +
      "                    seen[r - 1][c] = 1\n" +
      "                    queue.append((r - 1) * m + c)\n" +
      '                if r < n - 1 and g[r + 1][c] == "#" and seen[r + 1][c] == 0:\n' +
      "                    seen[r + 1][c] = 1\n" +
      "                    queue.append((r + 1) * m + c)\n" +
      '                if c > 0 and g[r][c - 1] == "#" and seen[r][c - 1] == 0:\n' +
      "                    seen[r][c - 1] = 1\n" +
      "                    queue.append(r * m + c - 1)\n" +
      '                if c < m - 1 and g[r][c + 1] == "#" and seen[r][c + 1] == 0:\n' +
      "                    seen[r][c + 1] = 1\n" +
      "                    queue.append(r * m + c + 1)\n" +
      "            if touches == 0:\n" +
      "                closed = closed + 1\n" +
      "print(closed)",
    cases: [
      { input: "5 6\n......\n.##...\n.##.#.\n....#.\n.#....", expectedOutput: "2" },
      /* Water everywhere: one lake, and it is on every edge there is. */
      { input: "3 3\n###\n###\n###", expectedOutput: "0", hidden: true },
      /* One row and one column: every cell is on the border by definition. */
      { input: "1 5\n.###.", expectedOutput: "0", hidden: true },
      { input: "5 1\n.\n#\n#\n#\n.", expectedOutput: "0", hidden: true },
      /* The smallest closed lake there is: one cell in the middle. */
      { input: "3 3\n...\n.#.\n...", expectedOutput: "1", hidden: true },
      /* A 2 × 2 map has no interior at all. */
      { input: "2 2\n##\n##", expectedOutput: "0", hidden: true },
      /* The three smallest inputs, all 0 for different reasons. */
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      { input: "1 1\n.", expectedOutput: "0", hidden: true },
      { input: "3 4\n....\n....\n....", expectedOutput: "0", hidden: true },
      /* A lake touching the LAST COLUMN and nothing else — the map that kills
         a border test written over rows only. */
      { input: "3 4\n....\n###.\n....", expectedOutput: "0", hidden: true },
      /* One lake that begins deep inside and crawls out to the last row: the
         cell the fill starts from is interior, the lake is not. */
      { input: "4 6\n......\n.####.\n....#.\n....##", expectedOutput: "0", hidden: true },
      /* Two cells touching only at a corner: two closed lakes, not one. */
      { input: "4 5\n.....\n.#...\n..#..\n.....", expectedOutput: "2", hidden: true },
      /* Three closed lakes and one on the edge. */
      { input: "5 7\n.......\n.##..#.\n.##....\n....##.\n#......", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * E · ~25 minutes, and the one problem of the five meant to be hard.
     * APRIL: «алдыңғы жауаптар арқылы шешу» and «қадамдап толтырылатын кесте»
     * (m8.l3, m8.l4). The table is two-dimensional, which is the shape m8.l4
     * fills cell by cell for grid routes; here the two axes are the two
     * sequences, and dp[i][j] is the answer for the first i numbers of one and
     * the first j of the other. 200 × 200 is 40 000 cells, so the table costs
     * nothing and the whole difficulty is knowing what a cell means — which is
     * the question April asks by hand: «dp[i] нені білдіреді».
     *
     * THE SAMPLE DOES NOT WARN THAT NEIGHBOURS ARE NOT REQUIRED, the same
     * deliberate choice `m9.c3.p3` documents. On «2 5 7 9» against «5 7 9 1»
     * the longest common block of ADJACENT numbers is 5, 7, 9 — three, which is
     * also the true answer. The statement says in words that deletions may come
     * from anywhere; nothing on screen makes the point, and the hidden cases are
     * where ignoring it costs.
     *
     * The degenerate programs, and the case that kills each:
     *   · the longest common run of ADJACENT numbers → «1 2 3 4 5» against
     *     «1 9 2 9 3» answers 1, truth 3.
     *   · counting the numbers the two lists share, in any order → «1 2 3»
     *     against «3 2 1» answers 3, truth 1; «1 2 1 2» against «2 1 2 1»
     *     answers 4, truth 3.
     *   · walking both lists once and taking the first match found for each
     *     number in turn → «1 3 2» against «3 2 1» answers 1, truth 2: the
     *     greedy match spends the 1 at the far end of the second list and the
     *     pair 3, 2 is lost.
     *   · a table with only the equal-numbers branch and no `else` → the
     *     visible sample already answers 0.
     * The answer can be 0 — «1 2» against «3 4» — and «1 5 / 1 6» is the
     * smallest input where it is, which is worth a case because the year's other
     * length questions all promise at least one.
     */
    id: "m9.as.b5",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["dp.core", "dp.table", "loops.nested", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "**E. Ортақ ішкі тізбек.** Екі сандар тізбегі берілген. Әр тізбектен кез келген сандарды өшіріп тастауға болады, ал өшірілмегендері бастапқы ретімен қалады. Екі тізбектен де ала алатын БІРДЕЙ тізбектің ең үлкен ұзындығын тап.\n\nҚалдырылған сандардың қатар тұруы міндетті емес: араларынан қанша сан өшірілсе де, реті сақталса жеткілікті. Сандар қайталанып келуі мүмкін, әрі әр сан ең көбі бір рет пайдаланылады.\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 200). Екінші жолда бос орынмен бөлінген n бүтін сан. Үшінші жолда m саны (1 ≤ m ≤ 200). Төртінші жолда бос орынмен бөлінген m бүтін сан. Барлық сан 1-ден 1000-ға дейін.\n\n**Шығыс.** Бір бүтін сан — екі тізбекке де ортақ ең ұзын тізбектің ұзындығы. Ортақ ешнәрсе болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n4\n2 5 7 9\n4\n5 7 9 1\n```\n\nЖауап: `3` — бұл 5, 7, 9 тізбегі.",
      ru: "**E. Общая подпоследовательность.** Даны две последовательности чисел. Из каждой можно вычеркнуть любые числа, а невычеркнутые сохраняют исходный порядок. Найди наибольшую длину ОДИНАКОВОЙ последовательности, которую можно получить и из первой, и из второй.\n\nОставленные числа не обязаны стоять рядом: сколько бы чисел ни было вычеркнуто между ними, достаточно, чтобы сохранялся порядок. Числа могут повторяться, и каждое число используется не больше одного раза.\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 200). Во второй строке n целых чисел через пробел. В третьей строке число m (1 ≤ m ≤ 200). В четвёртой строке m целых чисел через пробел. Все числа от 1 до 1000.\n\n**Выход.** Одно целое число — длина самой длинной последовательности, общей для обеих. Если общего нет ничего, выведи 0.\n\n**Пример.**\n\n```\n4\n2 5 7 9\n4\n5 7 9 1\n```\n\nОтвет: `3` — это последовательность 5, 7, 9.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "m = int(input())\n" +
      "b = list(map(int, input().split()))\n" +
      "dp = []\n" +
      "for i in range(n + 1):\n" +
      "    row = []\n" +
      "    for j in range(m + 1):\n" +
      "        row.append(0)\n" +
      "    dp.append(row)\n" +
      "for i in range(1, n + 1):\n" +
      "    for j in range(1, m + 1):\n" +
      "        if a[i - 1] == b[j - 1]:\n" +
      "            dp[i][j] = dp[i - 1][j - 1] + 1\n" +
      "        else:\n" +
      "            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n" +
      "print(dp[n][m])",
    cases: [
      { input: "4\n2 5 7 9\n4\n5 7 9 1", expectedOutput: "3" },
      /* The common numbers are scattered: adjacency gets 1, the answer is 3. */
      { input: "5\n1 2 3 4 5\n5\n1 9 2 9 3", expectedOutput: "3", hidden: true },
      /* The same three numbers in the opposite order: only one survives. */
      { input: "3\n1 2 3\n3\n3 2 1", expectedOutput: "1", hidden: true },
      /* Nothing in common at all. */
      { input: "2\n1 2\n2\n3 4", expectedOutput: "0", hidden: true },
      /* Repeats on both sides: the answer counts them. */
      { input: "3\n7 7 7\n3\n7 7 7", expectedOutput: "3", hidden: true },
      { input: "3\n1 1 1\n1\n1", expectedOutput: "1", hidden: true },
      /* One number each, matching and not: the smallest inputs there are. */
      { input: "1\n5\n1\n5", expectedOutput: "1", hidden: true },
      { input: "1\n5\n1\n6", expectedOutput: "0", hidden: true },
      /* Both lists hold the same two values four times: 2, 1, 2 fits. */
      { input: "4\n1 2 1 2\n4\n2 1 2 1", expectedOutput: "3", hidden: true },
      /* A short reversed tail of a long list. */
      { input: "6\n1 2 3 4 5 6\n3\n6 5 4", expectedOutput: "1", hidden: true },
      /* Taking the first match for each number in turn spends the 1 too early
         and loses the pair 3, 2. */
      { input: "3\n1 3 2\n3\n3 2 1", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * The first defence. «Ауызша түсіндіру» (p.6) carrying May's own clause
     * «екі шешімді ауызша қорғау» (p.10), which is the page cited: the mode
     * belongs to p.6 and appears in every monthly check, but the sentence that
     * makes TWO defences compulsory and ties them to the solved problems is
     * May's alone.
     *
     * The five marking points are the five parts `m9.l4.b1` sets out, in its
     * order and with its meanings — what the program does in one sentence, why
     * that answers the question as worded, why it is right at the edges, how
     * many steps it takes at the largest input, and what breaks if a condition
     * changes. They are repeated here rather than referenced so that the
     * teacher console shows the learner the same five criteria the lesson set
     * them, and so that a marker is not inventing a standard per learner.
     *
     * Which problem is defended is the learner's choice, so each point is
     * written to be markable whatever they pick, with a concrete example from
     * A–E under it. `m9.l4.b1`'s three non-defences — «I tested three
     * examples», «the code is short», «it was accepted last time» — are what
     * point 2 and point 3 are listening against.
     *
     * The grading rule is stated to the learner and attributed to the person
     * who applies it. Nothing here scores the conjunction and the prompt does
     * not imply that anything does.
     *
     * Settles as `unknown`. A teacher hears it, three or four minutes, while
     * the rest of the room is still coding — the arrangement `m6.as.b4` uses.
     */
    id: "m9.as.b6",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["contest.defend", "debug.boundary", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Шығарған есептеріңнің бірін таңдап ал да, мұғалімге ауызша қорғап шық. Қорғаудың бес бөлігі — жыл соңында өткен сол бес бөлік, реті де сол. (1) Бағдарламаң не істейді — бір сөйлеммен. (2) Ол неге дәл осы қойылған сұраққа жауап береді: есеп шартындағы сөзді өз әрекетіңмен байланыстыр. (3) Шеттерде неге дұрыс: ең кіші енгізу, шекарадағы дәл мән, барлық элементі бірдей жағдай — үшеуін де ата. (4) Неге уақытқа үлгереді — «тез» емес, сан: ең үлкен енгізуде шамамен неше қадам болады? (5) Шарттағы бір сан не бір сөз өзгерсе, ең әуелі қай жол бұзылады?\n\nҮш нәрсе қорғау емес: «үш мысалда тексердім», «кодым қысқа», «жіберіп едім, өтіп кетті».\n\nЕскерту: турнирдің ережесі бойынша шешілген есеп пен оның қорғауы бірге қаралады — бірі болмаса, екіншісі жеке есепке алынбайды. Мұны машина емес, мұғалім шешеді.",
      ru: "Выбери одну из решённых задач и защити её устно перед учителем. Пять частей защиты — те самые пять, которые вы разбирали в конце года, и в том же порядке. (1) Что делает твоя программа — одним предложением. (2) Почему это отвечает именно на заданный вопрос: свяжи слова условия со своими действиями. (3) Почему она верна на краях: самый маленький ввод, точное значение на границе, случай, когда все элементы равны, — назови все три. (4) Почему укладывается по времени — не «быстро», а число: сколько примерно шагов получится на самом большом вводе? (5) Если изменить одно число или одно слово в условии, какая строка сломается первой?\n\nТри вещи, которые защитой не являются: «я проверил на трёх примерах», «у меня короткий код», «я отправил, и оно зашло».\n\nУчти: по правилу турнира решённая задача и её защита рассматриваются вместе — одно без другого по отдельности не засчитывается. Решает это не машина, а учитель.",
    },
    expectedPoints: [
      {
        kk: "1-бөлік. Бағдарламаның не істейтінін бір сөйлеммен айтады, кодты жолма-жол оқымайды. Күтілетіні — әрекеттің атауы: «тізімді басынан аяғына дейін бір рет аралаймын да, кешіктірілгендерін жартылап қосамын» (A), «алдымен реттеймін, содан кейін жиналған қосындыны қосып отырамын» (B), «жауап H-ты екіге бөліп іздеймін» (C), «әр көлді толқынмен аралап шығамын» (D), «кестені жолма-жол толтырамын» (E).",
        ru: "Часть 1. Одним предложением говорит, что делает программа, а не читает код построчно. Ожидается название действия: «прохожу по списку один раз и прибавляю просроченные задачи половинками» (A), «сначала сортирую, потом складываю накопленную сумму» (B), «ищу ответ H делением пополам» (C), «обхожу каждое озеро волной» (D), «заполняю таблицу строка за строкой» (E).",
      },
      {
        kk: "2-бөлік. Есеп шартындағы сөзді өз әрекетімен байланыстырады. Мысалы, A-да «жартысы ғана беріледі, кем жағына қарай дөңгелектенеді» деген сөз `// 2` амалына тікелей сәйкес келеді; B-де «ең аз қосынды» деген талап реттеу ретін негіздейді: көрші тұрған екі жұмысты орнымен ауыстырсаң, тек сол екеуінің күтуі өзгереді, сондықтан қысқасы алда тұруы керек; C-де «кем болмаса» дегені `>=` салыстыруы; D-де «бірде-бір ұяшығы шетте тұрмаса» дегені — көлдің БАРЛЫҚ ұяшығы туралы шарт, сондықтан тексеру бүкіл толқын бойында жүреді.",
        ru: "Часть 2. Связывает слова условия со своими действиями. Например, в A слова «половина с округлением вниз» — это ровно операция `// 2`; в B требование «наименьшая сумма» обосновывает порядок сортировки: если поменять местами две соседние работы, изменится ожидание только у этих двух, поэтому короткая должна идти раньше; в C «не меньше» — это сравнение `>=`; в D «ни одна клетка не стоит на краю» — условие про ВСЕ клетки озера, поэтому проверка идёт по всей волне, а не только по стартовой клетке.",
      },
      {
        kk: "3-бөлік. Үш шетті де атайды және бағдарламасы сонда нені шығаратынын біледі: ең кіші енгізу (A мен B-де n = 1, D-де 1 × 1 карта, E-де әр тізбекте бір саннан), шекарадағы дәл мән (C-де жиналған отын дәл m-ге тең болатын H, A-да тақ ұпайдың жартысы), барлығы бірдей болған жағдай (B-де барлық жұмыс бірдей ұзақ, E-де барлық сан бірдей). Бір ғана шетті атап, қалғандарын «сол сияқты» деп өткізіп жіберу бұл бөлікті жаппайды.",
        ru: "Часть 3. Называет все три края и знает, что программа выводит на каждом: самый маленький ввод (n = 1 в A и B, карта 1 × 1 в D, по одному числу в каждой последовательности в E), точное значение на границе (в C — то H, при котором дров ровно m; в A — половина нечётного балла), случай, когда всё одинаково (в B все работы равной длины, в E все числа равны). Назвать один край и сказать про остальные «там так же» — этого недостаточно.",
      },
      {
        kk: "4-бөлік. Уақытты сөзбен емес, санмен бағалайды, әрі сан шарттағы шектеуден шығады: A-да жүз мың, B-де екі жүз мың элементті бір-екі рет аралау, ал B-де реттеудің өзін бөлек атайды; C-де әр тексеру n қадам, ал тексерулер саны отыздан аспайды, себебі әр қадамда іздеу аймағы екі есе қысқарады; D-де әр ұяшық кезекке бір-ақ рет түседі, демек 100 × 100 картада он мыңдай қадам; E-де кесте 200 · 200 = 40 000 ұяшық. Санды атаған соң, оны неге жеткілікті деп санайтынын да айтады.",
        ru: "Часть 4. Оценивает время не словом, а числом, и это число следует из ограничений: в A сто тысяч элементов, в B двести тысяч — это один-два прохода, и сортировка в B называется отдельно; в C каждая проверка стоит n шагов, а самих проверок не больше тридцати, потому что область поиска каждый раз сокращается вдвое; в D каждая клетка попадает в очередь ровно один раз, значит на карте 100 × 100 порядка десяти тысяч шагов; в E таблица — это 200 · 200 = 40 000 клеток. Назвав число, ученик говорит и почему считает его достаточным.",
      },
      {
        kk: "5-бөлік. Шарттың нақты бір өзгерісін алады да, бірінші болып қай жол бұзылатынын көрсетеді. Мысалы: A-да «жартысы» деген сөз «жоғары дөңгелектеніп» болса, `// 2` жолы дұрыс болмай қалады; B-де жұмыстарды таңдау еркіндігі жойылып, рет алдын ала берілсе, `a.sort()` жолы артық та, зиянды да болады; C-де m барлық ағаштан жиналатын отыннан үлкен болса, жауап мүлде болмайды және кепілдік бұзылады; D-де көршілікке бұрыштас ұяшықтар да кірсе, төрт `if`-тің орнына сегізі керек; E-де сандардың реті сақталуы міндетті болмаса, есеп мүлде басқа есепке айналады. «Бәрі бұзылады» деген жауап та, «ештеңе бұзылмайды» деген жауап та дәлелденуі керек.",
        ru: "Часть 5. Берёт конкретное изменение условия и показывает, какая строка сломается первой. Например: в A, если «половина» станет округляться вверх, неверной окажется строка с `// 2`; в B, если порядок работ задан заранее и выбирать его нельзя, строка `a.sort()` становится лишней и вредной; в C, если m больше, чем все дрова со всех деревьев, ответа не существует вовсе и гарантия из условия нарушается; в D, если считать соседями и диагональные клетки, вместо четырёх `if` понадобится восемь; в E, если порядок чисел перестанет иметь значение, задача превратится в совсем другую. И ответ «сломается всё», и ответ «не сломается ничего» требуют обоснования.",
      },
    ],
  },
  {
    /*
     * The second defence, on a DIFFERENT problem — «екі шешімді ауызша қорғау»
     * (p.10) means two, and two defences of one solution is one.
     *
     * It deliberately asks nothing `b6` asks. October's monthly check bought a
     * second copy of an answer its own written block had already taken, and the
     * fix here is that `b6` is the five-part defence `m9.l4` teaches, while this
     * block is about the solution the learner did NOT write: which simple idea
     * was rejected, what refutes it, what in the wording gave it away, and where
     * their own argument is weakest. `m9.l4.b3` and `m9.l4.b5` are the two cards
     * where the object under inspection is an argument rather than a program;
     * this is that skill turned on the learner's own defence, which is the one
     * version of it that cannot be answered from memory.
     *
     * "Choose the hardest problem you solved" is guidance, not a rule a marker
     * enforces: whoever solved exactly two defends their second, and the points
     * below work for any of the five.
     *
     * Settles as `unknown`. Never machine-scored.
     */
    id: "m9.as.b7",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["contest.defend", "greedy.counterexample", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Екінші қорғау — БАСҚА есеп бойынша: біріншісінде айтқаныңды қайталама. Шешкендеріңнің ішіндегі ең қиынын таңдағаның жөн. Мұндағы сұрақ басқаша қойылады: әңгіме сен жазған бағдарлама туралы емес, сен ЖАЗБАҒАН бағдарлама туралы. Төрт нәрсені айт. (1) Есепті оқығанда бірінші ойға келген қарапайым идея қандай еді — оны бір-екі сөйлеммен, нақты айт. (2) Оны немен теріске шығардың: қате болса, жауабы басқаша шығатын нақты кірісті ата; дұрыс, бірақ баяу болса, ол қандай көлемде неше қадам жасайтынын есепте. (3) Шарттың қай жері саған күмән тудырды — қай сан, қай сөз? (4) Енді өз қорғауыңа шабуыл жаса: бес бөліктің қайсысы ең әлсіз, мұғалім қай жерін түртіп көрсе, жауап беруің қиын болар еді?",
      ru: "Вторая защита — по ДРУГОЙ задаче: не повторяй то, о чём рассказывал в первой. Разумно выбрать самую трудную из решённых. Вопрос здесь ставится иначе: речь не о программе, которую ты написал, а о программе, которую ты НЕ стал писать. Расскажи четыре вещи. (1) Какая простая мысль пришла в голову первой, когда ты прочитал условие, — назови её конкретно, в одном-двух предложениях. (2) Чем ты её опроверг: если она неверна — назови конкретный вход, на котором ответ получается другой; если она верна, но медленна — посчитай, сколько шагов она сделает и при каком размере. (3) Какое место условия вызвало у тебя сомнение — какое число, какое слово? (4) А теперь атакуй собственную защиту: какая из пяти частей у тебя самая слабая, куда учителю стоит нажать, чтобы тебе стало трудно отвечать?",
    },
    expectedPoints: [
      {
        kk: "Тастаған идеяны нақты атайды — жалпы сөзбен емес, іске асыруға болатындай етіп. Мысалы: C-де «H-ты ең биік ағаштан бастап бір-бірлеп кеміту»; B-де «берілген ретпен қосындылап шығу» немесе «ең ұзын жұмысты алдыға қою»; D-де «су ұяшықтарын санау» не «шекараны тек бастапқы ұяшық бойынша тексеру»; E-де «қатар тұрған ортақ бөлікті іздеу» не «екеуінде де кездесетін сандарды санау»; A-да «барлық ұпайды қосып, соңында жартылау».",
        ru: "Точно называет отброшенную мысль — не общими словами, а так, что её можно было бы написать. Например: в C — «уменьшать H по единице, начиная с самого высокого дерева»; в B — «просуммировать в том порядке, в каком дано» или «поставить самую длинную работу вперёд»; в D — «сосчитать клетки воды» или «проверять край только по стартовой клетке»; в E — «искать общий кусок из подряд идущих чисел» или «сосчитать числа, встречающиеся в обоих списках»; в A — «сложить все баллы и в конце поделить пополам».",
      },
      {
        kk: "Теріске шығаруы нақты: не қарсы мысал, не сан. Қате идея үшін — жауабы басқаша шығатын кіріс, толығымен айтылады (E-де «1 2 3» мен «3 2 1»: ортақ сандар үшеу, ал ортақ тізбектің ұзындығы бір ғана; D-де шетке шығып кететін жалғыз көл; B-де берілген ретпен 13, ал реттегенде 10). Баяу идея үшін — қадам саны: C-де H миллиардқа жетеді, демек бір-бірлеп кеміту миллиард қадамға дейін созылады, ал он секундта Python шамамен ондаған миллион қадам жасайды.",
        ru: "Опровержение конкретное: либо контрпример, либо число. Для неверной мысли — вход, на котором ответ другой, названный целиком (в E «1 2 3» и «3 2 1»: общих чисел три, а длина общей последовательности всего один; в D — единственное озеро, выходящее к краю; в B — 13 в данном порядке против 10 в отсортированном). Для медленной мысли — число шагов: в C значение H доходит до миллиарда, значит уменьшение по единице растянется на миллиард шагов, а за десять секунд Python успевает порядка десятков миллионов.",
      },
      {
        kk: "Шарттың күмән тудырған жерін көрсетеді — бұл кездейсоқ емес, оқи білу дағдысы. Күтілетін жауаптар: C-де h[i] мен m-нің шектеулері (миллиард пен триллион — бұл «бәрін сынап көруге болмайды» дегенді білдіреді); B-де «лаборант ретті ӨЗІ таңдайды» деген сөз; E-де «қатар тұруы міндетті емес» деген сөйлем; D-де «бірде-бір ұяшығы» деген тіркес; A-да «кем жағына қарай дөңгелектенеді» деген ескерту. Оқушы бұл жерді есепті шығармай тұрып байқағанын да, кейін тексеру кезінде байқағанын да айта алады — екеуі де жарамды, бірақ қайсысы екенін атауы керек.",
        ru: "Показывает место условия, вызвавшее сомнение, — это не случайность, а навык чтения. Ожидаемые ответы: в C — ограничения на h[i] и m (миллиард и триллион означают, что перебрать всё нельзя); в B — слова «лаборант выбирает порядок САМ»; в E — фраза «не обязаны стоять рядом»; в D — оборот «ни одна его клетка»; в A — примечание «округляется вниз». Ученик может сказать, что заметил это до решения или уже при проверке, — годится и то и другое, но сказать, что именно было, он должен.",
      },
      {
        kk: "Өз қорғауының ең әлсіз жерін өзі табады. Бұл — ең маңызды тармақ және оның дұрыс жауабы бір емес. Жарамды жауаптар: «4-бөлікте қадам санын дәл есептемедім, шамамен айттым»; «3-бөлікте барлық элементі бірдей жағдайды тексермедім»; «2-бөліктегі дәлелім шын мәнінде дәлел емес, мысалда солай шыққанын айтқаным»; «реттеу дұрыс екенін алмастыру арқылы негіздедім, бірақ неге кез келген ретті реттелген ретке дейін алмастырып жеткізуге болатынын түсіндірмедім». Жарамсыз жауап — «әлсіз жері жоқ»: бұл жағдайда мұғалім өзі бір тармақты таңдап, сұрақ қоя алады.",
        ru: "Сам находит самое слабое место своей защиты. Это главный пункт, и правильный ответ здесь не один. Годятся: «в части 4 я не посчитал шаги точно, а сказал примерно»; «в части 3 я не проверил случай, когда все элементы равны»; «моё рассуждение во второй части на самом деле не доказательство, а пересказ того, что получилось на примере»; «я обосновал сортировку обменом соседей, но не объяснил, почему любой порядок можно такими обменами довести до отсортированного». Не годится ответ «слабых мест нет»: в этом случае учитель выбирает пункт сам и задаёт вопрос по нему.",
      },
    ],
  },
];
