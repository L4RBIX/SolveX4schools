import type { LessonBlock } from "../../types";

/**
 * Month 8 · Сәуір — the monthly check. Twenty minutes. PDF p.10.
 *
 * April's «Айлық сынақ» sentence is one line and it names two separate things,
 * in this order:
 *
 *   > Кодқа отырмас бұрын әр аралық нәтиженің нені білдіретінін сөзбен
 *   > тұжырымдайды; тиімді таңдау есебінде стратегияны не негіздейді, не оған
 *   > қарсы мысал келтіреді.
 *
 * Before sitting down to code, state in words what each intermediate result
 * means; and in the greedy problem, either justify the strategy or produce a
 * counterexample to it. «Кодқа отырмас бұрын» is not a stylistic preference —
 * it fixes the order of the check, so the first block here is not a coding
 * task and could not be one. The learner writes the sentence, then writes the
 * program the sentence makes derivable.
 *
 * ## The four blocks, and the clock
 *
 *   b1  explain                   — what `dp[i]` holds, before any code    2 min
 *   b2  verify · unseen_problem   — now write it, blank editor            12 min
 *   b3  test_case                 — break a proposed greedy rule           4 min
 *   b4  verify · oral_explanation — the counterexample, in full            2 min
 *
 * Twenty against a stated twenty, by the validator's own arithmetic, and every
 * minute of it is spoken for: `unseen_problem` costs a flat 12, `test_case` a
 * flat 4, and the two written blocks cost two minutes **per question**, so both
 * are written with exactly one question and neither can cost more. There is no
 * fifth block and no numbered sub-question anywhere, because that is the
 * arithmetic that put September's check at 30 minutes against a stated 20,
 * November's at 34 and December's at 38. The order b1 → b2 also means the
 * clock is honest in the other direction: a learner who spends two minutes
 * naming `dp[i]` spends fewer than twelve on the code, which is the whole
 * argument the programme is making by demanding the words first.
 *
 * ## Why `b2` is a new problem, and what it had to avoid
 *
 * April already owns a lot of dynamic programming, and the check has to be
 * unfamiliar against all of it:
 *
 *   l1   non-overlapping classes · buying the most books with a budget
 *   l2   coin change · knapsack by weight · and, in `m8.l2.b7`, the four
 *        proposed rules — cheapest-first, two largest for the biggest product,
 *        «n-ді 1-ге түсіру» by dividing, and balancing two groups
 *   l3   the staircase: steps of 1 or 2, of 1 or 3, of 1, 2 or 3, a broken step
 *   l4   routes in a grid · the cheapest route in a grid
 *   l5   non-adjacent boxes · the segment with the largest sum
 *   p1–p10  simultaneous classes · coins that work · coins that do not ·
 *           a staircase with broken steps · the largest segment sum ·
 *           non-adjacent numbers · routes in a grid · the cheapest grid route ·
 *           the longest increasing subsequence · a 0/1 knapsack
 *
 * `m8.l2.b7` is why the first draft of this file was thrown away: its third
 * option is «n санын ең аз қадаммен 1-ге түсіру», which had been chosen here as
 * the unseen problem. It is on screen in April already, and a check may not
 * reuse a card the month has shown.
 *
 * So the problem is a **minimum over a one-dimensional table where the cost of
 * a move depends on both of its ends** — posts of different heights in a row,
 * stepping to the next post or over one, effort equal to the difference in
 * height. Nothing in April does that. `m8.l5` maximises over a list, `m8.p8`
 * minimises over a grid where the cost sits in the CELL; here the cost sits in
 * the PAIR, so the two options `dp[i - 1]` and `dp[i - 2]` do not add the same
 * number and a learner who transcribes the staircase rule gets a wrong answer
 * on the visible case. The move set is deliberately the staircase's — that is
 * what makes the transcription tempting, and the month's own point is that the
 * table's meaning, not the table's shape, is what has to be worked out.
 *
 * The initial value is the same trap seen from the other side. Every counting
 * table in April starts `dp[0] = 1`; this one starts `dp[0] = 0`, and the only
 * way to know that is to read it off the sentence `b1` asks for. That is why
 * `b1` asks for `dp[0]` by name.
 *
 * ## The degenerate programs, and the case that kills each
 *
 * Every one of these was written out and executed against the full case set
 * before this file was written. None survives:
 *
 *   · walking post by post, never stepping over one — dies on the VISIBLE case
 *     (says 92, the answer is 2), which is deliberate: the learner who never
 *     considered the second option finds out on screen, not on a hidden case.
 *   · stepping over one post whenever that is possible — dies on case 6
 *     (says 98, the answer is 2).
 *   · the greedy rule «step to whichever of the two nearer posts differs least
 *     in height» — dies on case 5 with either tie-break (says 50, the answer is
 *     30). This is April's own half of the month showing up inside the DP task.
 *   · `dp[i] = min(dp[i - 1], dp[i - 2]) + abs(h[i] - h[i - 1])`, the cost taken
 *     from the wrong end — dies on the visible case, on 5, 6, 7 and 9.
 *   · subtracting without the modulus — dies on case 7 (says -99).
 *   · never filling `dp[1]`, so the first step is free — dies on case 3.
 *   · a loop from i = 1 that reads `dp[i - 2]` as `dp[-1]`, which in Python is
 *     the LAST cell and is silently 0 — dies on cases 3 and 5. This one is
 *     worth the case on its own: it does not crash, and it is right often.
 *   · printing `dp[n - 2]` — dies on the visible case, on 5, 6, 7 and 9.
 *   · maximum instead of minimum — dies on the visible case.
 *   · recomputing each post's answer from scratch instead of storing it — case
 *     10 has 61 posts, so a program shaped like February's recursion makes on
 *     the order of a million million calls and never finishes.
 *
 * ## The requirement a checker cannot see, and which of the three options
 *
 * Output comparison sees one number. It cannot see whether the learner built a
 * table, and this file states no rule that they must — the contract's fourth
 * defect class is exactly a rule the product will not enforce. Of the three
 * honest options this check takes **option 1, make the output impossible
 * without it**: case 10 is 61 posts, which no program that recomputes an
 * already-computed answer can finish, so «әр жауапты бір рет есептеп сақтау» is
 * enforced by the clock rather than by a promise. A memoised recursion holds
 * the same answers in the same list and passes, correctly: it is the table.
 *
 * What option 1 cannot reach is the wording — whether the learner can SAY what
 * their cells hold — and that is `b1`, which a teacher reads. The programme
 * puts those two in exactly this relationship, which is why the check does too.
 *
 * ## The greedy half
 *
 * `b3` proposes «әр ұяшықта мүмкіндігінше алысқа секір» on the minimum-jumps
 * problem. The rule is not one April has already broken — `m8.l2` breaks coin
 * change, the knapsack by weight, dividing by three and balancing two groups,
 * and the practice set breaks «ең үлкен санды ал, көршілерін сыз», «арзан
 * көршіге жүр» and both knapsack ratios — and the problem itself appears
 * nowhere in the month. It is also calibrated: an exhaustive search over every
 * input of up to five cells with values 1..4 finds that the rule is correct on
 * all of them until n reaches 5, and then breaks on 32 of them. So it survives
 * the first few things a learner tries, which is the profile a proposed
 * strategy has to have to teach anything, and the shortest counterexample is
 * five numbers, which is findable in the four minutes budgeted.
 *
 * `test_case` is the honest block for this because the answer IS an input:
 * `breakingInputs` carries it, and it never reaches the browser.
 *
 * ## Programs
 *
 * Two programs appear here — `b2`'s reference solution and `b3`'s proposed
 * rule — and they were compared, byte for byte and by script, against each
 * other and against every program in `m08/l1`–`l5` and `m08/practice`. No
 * duplicate, and no near-duplicate either: nothing in April uses `abs`, and
 * nothing in April has a `while` loop that walks a position forward by a value
 * read out of the list.
 *
 * ## Provenance
 *
 * `b1` and `b3` carry April's own assessment sentence and cite p.10. `b2` and
 * `b4` implement two of the programme's five general verification methods
 * (p.6: «Бейтаныс есептер · Ауызша түсіндіру») and cite that page. No
 * `diagnosticMapping` anywhere: a wrong number on this task is reachable from
 * the missing modulus, the cost taken from the wrong end, an unfilled `dp[1]`
 * or a negative index that reads the last cell, and four causes behind one
 * answer is precisely when the mapping must be left out.
 *
 * ## Deliberately left out
 *
 * `manual_trace`, `find_bug` and `delayed_resolve`, the three verification
 * methods this check does not use. April meets the first two where the PDF puts
 * them — `m8.l3.b6` and `m8.l4.b6` fill tables by hand, `m8.l3.b7` and
 * `m8.l4.b7` are the two repairs — and a fourth graded task would have cost six
 * minutes the twenty does not have. Also left out: asking for the route itself
 * as well as its cost. Restoring the path is a real April idea, it belongs with
 * the grid, and adding it here buys a second coding task on a clock that has no
 * slack at all.
 */
export const M8_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * April's own «Кодқа отырмас бұрын әр аралық нәтиженің нені білдіретінін
     * сөзбен тұжырымдайды», so it cites p.10 and it comes FIRST. Not a coding
     * task, and it is not scored by anything: `explain` settles as `unknown`
     * and a teacher reads it against the four marking points.
     *
     * The prompt states the problem and the proposed table and stops. It does
     * not name the two cells `dp[i]` depends on — that is the work `b2` asks
     * for, and it is derivable from the sentence the learner is being asked to
     * write, which is the entire pedagogical claim April is making.
     *
     * `dp[0]` is asked for by name because it is where April's own habit
     * misfires: every counting table this month starts at 1, and this one
     * starts at 0. A learner who answers 1 has recited rather than reasoned,
     * and the marking points say so in those words.
     *
     * One question. The second clause is not a second answer — it asks the
     * learner to derive a consequence of the sentence they just wrote, which is
     * the same thought continued.
     */
    id: "m8.as.b1",
    type: "explain",
    skillRefs: ["dp.core", "dp.table"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk:
        "Кодқа отырмас бұрын жазбаша жауап бер: бұл тапсырмада код жазудың қажеті жоқ. " +
        "Есеп мынау. Мектеп ауласында биіктіктері әртүрлі n бетон бағана бір қатарға тізілген; олар солдан оңға қарай 0-ден n − 1-ге дейін нөмірленген, ал i нөмірлі бағананың биіктігі — h[i]. " +
        "Оқушы 0 нөмірлі бағанада тұр және соңғы бағанаға жетуі керек. Бір аттауда ол не келесі бағанаға, не біреуін аттап өтіп одан кейінгі бағанаға ғана көше алады. " +
        "Бір аттауға жұмсалатын күш — сол екі бағана биіктігінің айырмасы, яғни үлкенінен кішісін алғандағы сан. Соңғы бағанаға жетуге кететін күштің ең аз қосындысын табу керек. " +
        "Шешімді `dp = [0] * n` кестесінен бастау ұсынылды. Осы кестенің `dp[i]` ұяшығында қандай сан тұрады? " +
        "Оны бір сөйлеммен нақты тұжырымда, содан кейін дәл сол сөйлемнен `dp[0]`-дің мәні қалай шығатынын көрсет.",
      ru:
        "Ответь письменно, до того как сядешь за код: писать программу в этом задании не нужно. " +
        "Задача такая. В школьном дворе в один ряд стоят n бетонных столбов разной высоты; они пронумерованы слева направо от 0 до n − 1, а высота столба с номером i равна h[i]. " +
        "Ученик стоит на столбе с номером 0 и должен добраться до последнего. За один шаг он может перейти либо на следующий столб, либо, перешагнув через один, на столб за ним. " +
        "Усилие на один шаг равно разности высот этих двух столбов, то есть из большей высоты вычитаем меньшую. Нужно найти наименьшую сумму усилий, с которой можно добраться до последнего столба. " +
        "Решение предложено начать с таблицы `dp = [0] * n`. Какое число стоит в ячейке `dp[i]` этой таблицы? " +
        "Сформулируй это одним точным предложением, а затем покажи, как из этого же предложения следует значение `dp[0]`.",
    },
    expectedPoints: [
      {
        kk: "Сөйлем «dp[i] — 0 нөмірлі бағанадан i нөмірлі бағанаға жетуге жұмсалатын күштің ЕҢ АЗ қосындысы» дегенге саяды. Онда үш нәрсенің үшеуі де болуы керек: индекс — бағананың нөмірі (аттаудың реті емес), ұяшықтағы сан — жұмсалған күштің қосындысы, әрі ол қосынды сол бағанаға апаратын барлық жолдардың ішіндегі ең кішісі. Үшеуінің біреуі жоқ болса, сөйлем әлі кестенің мағынасын бермейді.",
        ru: "Предложение сводится к «dp[i] — наименьшая сумма усилий, с которой можно добраться со столба 0 до столба i». В нём должны быть все три вещи: индекс — это номер столба (а не номер шага), число в ячейке — сумма затраченных усилий, и эта сумма наименьшая среди всех путей до этого столба. Если нет хотя бы одной из трёх, предложение ещё не задаёт смысл таблицы.",
      },
      {
        kk: "`dp[0]` = 0, әрі бұл сөйлемнен тікелей шығады: оқушы әуел бастан 0 нөмірлі бағанада тұр, бірде-бір аттау жасалмаған, демек ешқандай күш жұмсалмаған. Мұнда сәуірдің әдеті кедергі жасайды: баспалдақ пен тордағы кестелерде `dp[0] = 1` болатын, өйткені ол кестелердің сөйлемі «неше тәсіл» деп басталады. Бұл кестенің сөйлемі «қанша күш» дейді, сондықтан бастапқы мән нөл. `dp[0] = 1` деп жазған оқушы басқа есептің сөйлемін жаттап алған.",
        ru: "`dp[0]` = 0, и это следует прямо из предложения: на столбе с номером 0 ученик стоит с самого начала, ни одного шага не сделано, значит и усилий не потрачено. Здесь мешает апрельская привычка: в таблицах про лестницу и про сетку было `dp[0] = 1`, потому что предложение тех таблиц начиналось со слов «сколько способов». Предложение этой таблицы говорит «сколько усилий», поэтому начальное значение — ноль. Тот, кто написал `dp[0] = 1`, взял предложение из другой задачи.",
      },
      {
        kk: "Сол сөйлемнен ұяшықтың неге сүйенетіні де шығады. i нөмірлі бағанаға түсетін СОҢҒЫ аттау не i − 1-ден, не i − 2-ден жасалған; үшінші нұсқа жоқ. Демек `dp[i]` осы екі ұяшықтан құралады, ал оларға қосылатын күш бірдей емес: аттау қай бағанадан жасалса, айырма сол бағананың биіктігімен есептеледі. Екі ұяшықтың нөмірі де i-ден кіші, сондықтан кестені солдан оңға толтырғанда екеуі де дайын тұрады.",
        ru: "Из того же предложения следует, на что опирается ячейка. ПОСЛЕДНИЙ шаг, которым попадают на столб i, сделан либо со столба i − 1, либо со столба i − 2, третьего варианта нет. Значит, `dp[i]` собирается из этих двух ячеек, и прибавляемое усилие у них разное: разность берётся с высотой того столба, с которого шагнули. Номера обеих ячеек меньше i, поэтому при заполнении таблицы слева направо обе уже готовы.",
      },
      {
        kk: "Есептің жауабы — `dp[n − 1]`: бұл дәл сол сөйлем, тек i-нің орнында n − 1 тұр. Шекараны да атап өту керек: i = 1 болғанда екі нұсқаның біреуі ғана бар, өйткені −1 нөмірлі бағана жоқ. Ал жарамсыз тұжырымдардың мысалы: «dp[i] — i-ші аттауға жұмсалған күш» немесе «dp[i] — i-бағананың биіктігі». Мұндай кестеден жауап оқылмайды және ұяшықты алдыңғылары арқылы толтыруға болмайды.",
        ru: "Ответ задачи — `dp[n − 1]`: это то же самое предложение, только вместо i стоит n − 1. Стоит назвать и границу: при i = 1 из двух вариантов есть только один, потому что столба с номером −1 не существует. А вот примеры негодных формулировок: «dp[i] — усилие, потраченное на i-й шаг» или «dp[i] — высота столба i». Из такой таблицы ответ не читается, и ячейку нельзя заполнить через предыдущие.",
      },
    ],
  },
  {
    /*
     * «Бейтаныс есеп» (p.6). Blank editor, no starter, no method named in the
     * prompt beyond the problem itself.
     *
     * The same problem `b1` has just been asked to describe, and that is the
     * design rather than a repetition: April's assessment sentence puts the
     * words before the code, so the second card is the first card's sentence
     * cashed in. Nothing about the rule is given away — `b1` asks what a cell
     * HOLDS, `b2` asks for the program that fills it.
     *
     * Eleven cases, one visible. The visible one kills the program that walks
     * post by post and never steps over one: it answers 92 where the answer is
     * 2, on screen, before any hidden case is reached. Case 5 kills the greedy
     * rule with either tie-break and also the negative-index loop; case 6 kills
     * stepping over a post whenever possible; case 7 kills the missing modulus;
     * case 3 kills the unfilled `dp[1]`; case 10 kills recomputation.
     *
     * The reference uses `abs()`, which September's own solutions use. No
     * learner needs it here: both prompts define the effort of a step in words
     * — the larger height minus the smaller — so an `if`/`else` is a complete
     * answer, and nobody is asked for a builtin the year has not talked about.
     *
     * The bound n ≤ 100000 is the problem's, and the last sentence of the
     * prompt says plainly why it matters. It is advice about the shape of a
     * solution, not a rule about its text: the enforcement is case 10, which
     * simply does not finish for a program that recomputes.
     */
    id: "m8.as.b2",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["dp.core", "dp.table", "lists.traverse", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Бірінші тапсырмадағы есеп, енді толық шарттарымен. " +
        "Бірінші жолда n саны беріледі (1 ≤ n ≤ 100000) — қатардағы бағаналардың саны. " +
        "Екінші жолда бос орынмен бөлініп n бүтін сан беріледі — бағаналардың биіктіктері, әрқайсысы 0-ден 10000-ға дейін. Бағаналар солдан оңға қарай 0-ден n − 1-ге дейін нөмірленген. " +
        "Оқушы 0 нөмірлі бағанада тұр және соңғы бағанаға жетуі керек. Бір аттауда i нөмірлі бағанадан тек i + 1 немесе i + 2 нөмірлі бағанаға көшуге болады; артқа қайтуға болмайды. " +
        "i-ден j-ге аттағанда жұмсалатын күш — h[i] мен h[j] айырмасының модулі, яғни үлкен биіктіктен кішісін алғандағы сан. " +
        "Соңғы бағанаға жетуге қажет күштің ең аз қосындысын шығар — жауап бір бүтін сан. " +
        "n = 1 болса, оқушы қазірдің өзінде соңғы бағанада тұр, сондықтан жауап 0. Мысалы, `5` және `1 20 2 30 3` үшін жауап 2. " +
        "Есіңде болсын: n мыңдаған болуы мүмкін, сондықтан бір бағанаға жетудің ең аз күшін қайта-қайта есептейтін шешім уақытқа сыймайды.",
      ru:
        "Та же задача, что и в первом задании, теперь с полными условиями. " +
        "В первой строке дано число n (1 ≤ n ≤ 100000) — количество столбов в ряду. " +
        "Во второй строке через пробел даны n целых чисел — высоты столбов, каждая от 0 до 10000. Столбы пронумерованы слева направо от 0 до n − 1. " +
        "Ученик стоит на столбе с номером 0 и должен добраться до последнего. За один шаг со столба с номером i можно перейти только на столб i + 1 или i + 2; назад ходить нельзя. " +
        "Усилие на шаг с i на j равно модулю разности h[i] и h[j], то есть из большей высоты вычитается меньшая. " +
        "Выведи наименьшую сумму усилий, с которой можно добраться до последнего столба, — ответ одно целое число. " +
        "Если n = 1, ученик уже стоит на последнем столбе, поэтому ответ 0. Например, при `5` и `1 20 2 30 3` ответ 2. " +
        "Имей в виду: n может быть в тысячах, поэтому решение, которое снова и снова пересчитывает наименьшее усилие до одного и того же столба, по времени не пройдёт.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "h = list(map(int, input().split()))\n" +
      "dp = [0] * n\n" +
      "if n > 1:\n" +
      "    dp[1] = abs(h[1] - h[0])\n" +
      "for i in range(2, n):\n" +
      "    dp[i] = min(dp[i - 1] + abs(h[i] - h[i - 1]), dp[i - 2] + abs(h[i] - h[i - 2]))\n" +
      "print(dp[n - 1])",
    cases: [
      /* The stated limit is n ≤ 100000 and the largest case here was 61, so a
         RECURSION — memoised, correct in complexity, the natural shape after
         February — passed the check and then died of RecursionError on real
         input. Python's default depth is 1000; this is 1200, which is the
         cheapest size that reaches the constraint the prompt states. The task
         is unchanged: the reference answers 2877 here as it always did. */
      { input: "1200\n0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3 0 7 4 1 8 5 2 9 6 3", expectedOutput: "2877", hidden: true },

      /* Visible, and chosen to fail the first thing a learner writes: walking
         post by post costs 92 here, while stepping over each tall post costs 2.
         Also kills `min(dp[i-1], dp[i-2]) + abs(h[i] - h[i-1])`, which says 45,
         and printing `dp[n - 2]`, which says 29. */
      { input: "5\n1 20 2 30 3", expectedOutput: "2" },
      /* One post. The loop never runs and the answer is the initial value —
         which is 0 here and 1 in every counting table April has built. */
      { input: "1\n7", expectedOutput: "0", hidden: true },
      /* Two posts: the only cell filled outside the loop. A program that never
         assigns `dp[1]` prints 0, and one whose loop starts at i = 1 reads
         `dp[-1]` — the LAST cell, silently 0 — and also prints 0. */
      { input: "2\n4 9", expectedOutput: "5", hidden: true },
      /* Two posts of equal height. A step is made and nothing is spent, so
         this separates a table that sums differences from one that counts
         steps — and it is the shortest input on which those two disagree. */
      { input: "2\n5 5", expectedOutput: "0", hidden: true },
      /* The greedy trap. Stepping to whichever neighbour differs least in
         height goes 10 → 0 for 10 and is then stuck with 40, total 50; the
         answer is 30. Both tie-breaks lose. The negative-index loop says 20. */
      { input: "4\n10 30 0 40", expectedOutput: "30", hidden: true },
      /* The mirror image: stepping over a post whenever that is possible goes
         0 → 50 → 2 for 98, while the answer is 2. */
      { input: "4\n0 1 50 2", expectedOutput: "2", hidden: true },
      /* Heights that only fall. Without the modulus the sums go negative and
         the program prints -99 instead of 99. */
      { input: "3\n100 10 1", expectedOutput: "99", hidden: true },
      /* Every post the same height: nothing is ever spent, whichever route is
         taken. The all-equal boundary, and the cheapest case for a learner to
         check in their head. The one degenerate it kills — a table that adds 1
         per step instead of a difference in height — is killed by cases 3, 5, 7
         and 9 as well, so this case is a boundary rather than a net. */
      { input: "5\n8 8 8 8 8", expectedOutput: "0", hidden: true },
      /* Heights rising by one. Stepping over a post is never worse and never
         better, so the answer is the total climb, 5. The wrong-end cost says 3
         and `dp[n - 2]` says 4. */
      { input: "6\n1 2 3 4 5 6", expectedOutput: "5", hidden: true },
      /* Sixty-one posts. Nothing here is a special shape — the point is the
         size: a solution that recomputes a post's answer instead of storing it
         is February's recursion and makes on the order of a million million
         calls. Written out and run: it does not finish. */
      {
        input:
          "61\n0 30 7 25 9 2 8 7 34 14 8 9 2 3 8 14 34 28 33 26 13 37 5 7 1 25 21 12 13 21 " +
          "25 23 38 15 13 13 26 37 35 3 3 11 22 8 13 9 24 1 5 33 28 13 13 27 23 12 21 14 30 2 16",
        expectedOutput: "280",
        hidden: true,
      },
      /* Both ends of the stated height range in one row, and the answer is 0:
         the middle post is a trough 10000 deep and stepping over it costs
         nothing at all. Kept because the two extremes of «0-ден 10000-ға дейін»
         should appear somewhere, and because an answer of 0 on heights this
         large is the shortest way to be sure the cell holds a sum of
         differences and not a distance walked. */
      { input: "3\n10000 0 10000", expectedOutput: "0", hidden: true },
    ],
  },
  {
    /*
     * April's own «тиімді таңдау есебінде стратегияны не негіздейді, не оған
     * қарсы мысал келтіреді», so it cites p.10.
     *
     * `test_case` is the honest block for this clause: the answer IS an input,
     * `breakingInputs` is where it lives, and it never reaches the browser.
     *
     * The rule is «мүмкіндігінше алысқа секір» on the minimum-jumps problem.
     * It is not a rule April has already broken and the problem is not one
     * April has already set — checked against all five lessons and the practice
     * set. It is also calibrated by exhaustive search: over every input of at
     * most five cells with values 1..4 the rule is correct on every input of
     * three or four cells and breaks on 32 inputs of five, so it survives what
     * a learner tries first and then loses. The shortest counterexample is five
     * numbers.
     *
     * The sample shown is `2 2 1 1 2`, where the rule is right and the answer
     * is 3 — a working sample with a non-trivial number, so nothing about the
     * shape of a breaking input is given away by it.
     *
     * The prompt asks for the better route alongside the input, because an
     * input on its own is not a counterexample: «ереже неше, шын жауап неше»
     * is what makes it one, and `m8.l2.b10` already marks it that way.
     */
    id: "m8.as.b3",
    type: "test_case",
    skillRefs: ["greedy.counterexample", "greedy.core"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk:
        "Бұл бағдарлама бір жолдан бос орынмен бөлінген сандарды оқиды. `a[i]` — i нөмірлі ұяшықтан алға қарай ең көп дегенде неше ұяшық секіруге болатынын көрсетеді, әр сан кемінде 1. " +
        "Секіру тек алға жасалады және 1-ден `a[i]`-ге дейінгі кез келген қашықтыққа секіруге болады. Мақсат — 0 нөмірлі ұяшықтан соңғы ұяшыққа жету, ал есепте ең аз секіру саны сұралады. " +
        "Бағдарлама ұсынылған ережені орындайды: тұрған ұяшығыңнан мүмкіндігінше алысқа секір. " +
        "`2 2 1 1 2` ендірмесінде ол 3 шығарады — бұл дұрыс жауап. " +
        "Сен ережені бұзатын ендірме тап: бағдарлама шын қажеттіден КӨП секіру шығаратын сандар қатарын жаз. " +
        "Шарттар: сандардың саны алтаудан аспасын, әрқайсысы 1-ден 5-ке дейін болсын. Ендірменің қасына азырақ секірумен жететін жолды да көрсет.",
      ru:
        "Эта программа читает из одной строки числа, разделённые пробелами. `a[i]` — на сколько клеток вперёд можно прыгнуть из клетки с номером i, каждое число не меньше 1. " +
        "Прыгать можно только вперёд и на любое расстояние от 1 до `a[i]`. Цель — попасть из клетки 0 в последнюю клетку, а в задаче спрашивается наименьшее число прыжков. " +
        "Программа выполняет предложенное правило: из той клетки, где стоишь, прыгай как можно дальше. " +
        "На вводе `2 2 1 1 2` она выводит 3 — это верный ответ. " +
        "Найди ввод, который ломает правило: напиши такой набор чисел, на котором программа выводит БОЛЬШЕ прыжков, чем нужно на самом деле. " +
        "Условия: чисел не больше шести, каждое от 1 до 5. Рядом с вводом укажи и сам путь, которым можно добраться за меньшее число прыжков.",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "n = len(a)\n" +
      "pos = 0\n" +
      "jumps = 0\n" +
      "while pos < n - 1:\n" +
      "    pos = pos + a[pos]\n" +
      "    jumps = jumps + 1\n" +
      "print(jumps)",
    /* Verified against an exhaustive minimum-jumps search: on each of these the
       rule prints one more jump than the true minimum. The first is the
       shortest counterexample there is — no input of three or four cells
       breaks the rule at all — and the last two are six cells, so a learner
       who searched at the top of the allowed size finds one there too. */
    breakingInputs: ["2 3 1 1 1", "2 4 1 1 1", "2 3 1 1 4", "3 4 1 1 1 1", "2 3 1 1 1 1"],
  },
  {
    /*
     * «Ауызша түсіндіру» (p.6), pointed at the block the learner has just done.
     *
     * One question. A counterexample is one answer with four parts — the input,
     * what the rule gives, what the true minimum is, and the route that reaches
     * it — and `m8.l2.b10` already marks it that way: «Без любого из этих
     * четырёх пунктов это ещё не контрпример.» Splitting it into four numbered
     * questions would have cost eight minutes for the same answer.
     *
     * The last marking point is for the learner who did not find a breaking
     * input in four minutes. They are not to be told they failed the block:
     * what the teacher listens for is what they tried and what they concluded
     * from it, and the answer «I tried these and the rule held» is the exact
     * distinction April spends `m8.l2` on — «дәлел мен сенімді ажырату».
     *
     * Never machine-scored. Settles as `unknown`.
     */
    id: "m8.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["greedy.counterexample", "greedy.core", "dp.core"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Мұғалімге ауызша жауап бер. Үшінші тапсырмадағы ережеге тапқан қарсы мысалыңды толық көрсет — қандай ендірме алдың, ереже неше секіріс береді, шын ең аз жауап неше және ол қандай жолмен алынады — сосын ереже дәл қай жерде жаңылысатынын өз сөзіңмен түсіндір.",
      ru:
        "Ответь учителю устно. Покажи целиком контрпример, который ты нашёл к правилу из третьего задания: какой ввод ты взял, сколько прыжков даёт правило, чему равен настоящий минимум и каким путём он получается, — а затем своими словами объясни, в каком именно месте правило ошибается.",
    },
    expectedPoints: [
      {
        kk: "Қарсы мысал толық аталады: нақты ендірме, ереже беретін секіріс саны, шын ең аз секіріс саны және сол ең аз жауапқа апаратын жол — қай ұяшықтан қай ұяшыққа. Осы төртеудің біреуі айтылмаса, бұл әлі қарсы мысал емес, жай ғана ендірме. Мысалы, `2 3 1 1 1` ендірмесінде ереже 3 секіріс жасайды (0 → 2 → 3 → 4), ал 2 секірумен жетуге болады: 0 → 1 → 4.",
        ru: "Контрпример назван целиком: конкретный ввод, число прыжков по правилу, настоящее наименьшее число прыжков и путь, которым оно достигается, — из какой клетки в какую. Если не сказано что-то одно из этих четырёх, это ещё не контрпример, а просто ввод. Например, на вводе `2 3 1 1 1` правило делает 3 прыжка (0 → 2 → 3 → 4), а добраться можно за 2: 0 → 1 → 4.",
      },
      {
        kk: "Ереже дәл қай жерде жаңылысатыны айтылады: ең алысқа секіру сол қадамда ең тиімді болып көрінеді, бірақ ол сені `a` мәні кіші ұяшыққа апарып тастауы мүмкін. Қысқарақ секіру `a` мәні үлкен ұяшыққа түсіріп, келесі секірудің өрісін кеңейтеді. Яғни «дәл қазір ең алыс» пен «екі секірістен кейін ең алыс» — екі бөлек нәрсе, ал ереже біріншісін ғана қарайды.",
        ru: "Названо место, где правило ошибается: прыжок как можно дальше кажется самым выгодным на этом шаге, но он может забросить тебя в клетку с маленьким `a`. Более короткий прыжок приводит в клетку с большим `a` и расширяет размах следующего прыжка. То есть «дальше всего прямо сейчас» и «дальше всего через два прыжка» — разные вещи, а правило смотрит только на первое.",
      },
      {
        kk: "Логиканың симметриялы емес екені айтылады: ереже дұрыс шыққан ондаған ендірме оны дәлелдемейді, ал бір ғана қарсы мысал оны толық жоққа шығарады. Сондықтан `2 2 1 1 2` ендірмесінде дұрыс жауап шыққаны ештеңе білдірмейді.",
        ru: "Сказано, что логика здесь несимметрична: десяток вводов, на которых правило дало верный ответ, его не доказывают, а один контрпример полностью его опровергает. Поэтому то, что на вводе `2 2 1 1 2` ответ верный, ещё ни о чём не говорит.",
      },
      {
        kk: "Қарсы мысал таппаған оқушының жауабы да толық болуы мүмкін: қандай ендірмелерді тексердім, оларды қалай таңдадым және бұдан не шығады. Дұрыс қорытынды — «мен тексергендерде ереже бұзылмады», ал «ереже дұрыс» емес. Бұл — сәуірдің басты айырмасы: тексеру мен дәлелдеу бір нәрсе емес.",
        ru: "Ответ ученика, который контрпример не нашёл, тоже может быть полным: какие вводы он проверил, как он их выбирал и что из этого следует. Верный вывод — «на тех вводах, что я проверил, правило не сломалось», а не «правило верное». Это и есть главное различие апреля: проверка и доказательство — не одно и то же.",
      },
    ],
  },
];
