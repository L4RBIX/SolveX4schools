import type { LessonBlock } from "../../types";

/**
 * m9.c4 · «4-жаттығу жарысы» / «Тренировочное соревнование 4» — 45 minutes.
 *
 * The last of the four practice contests, and the dress rehearsal for the
 * tournament that closes the year. The clauses it answers to are all on PDF
 * p.10:
 *
 * > «төрт 45 минуттық жаттығу жарысы»
 *
 * The format is the programme's: four contests, forty-five minutes, and this is
 * the fourth. The five problems are not the programme's — p.10 specifies the
 * FORMAT and never a problem list — so every block here is `product-authored`
 * and none of them cites a page. The citation belongs to `month-09-may.ts`,
 * which implements the format itself.
 *
 * > «Бұл айда жаңа тақырып жоқ.»
 *
 * No problem below needs a method the year has not already taught. Each block's
 * comment names the month that taught it and the technique it expects, because
 * that naming is the only way a later reader can check the claim rather than
 * take it on trust.
 *
 * ## The one thing this contest does that the other three do not
 *
 * `m9.c4`'s own objectives (see `month-09-may.ts`) are «жыл бойғы тәсілдерді өзі
 * таңдау» — choose the year's techniques yourself — and «талдаудан кейін толық
 * шешіп шығу». So **not one statement below names a month or a method.** c1
 * ends two of its statements by pointing at December's table and January's
 * search by hand, which is right for the first contest of the month; doing it
 * here would answer the question this contest exists to ask. What the
 * statements do carry is the constraints, because a constraint is part of the
 * problem and reading it is part of the skill.
 *
 * ## Coverage, and how these five sit against the other three contests
 *
 * c1 walks the year's first half (Sept/Oct · Oct · Nov · Dec · Jan). c2 takes
 * February twice and March twice, behind an October/November opener. c3 is
 * mixed and leans on April. Between the four, every month of the year is
 * contested — and this one touches all nine on its own:
 *
 * | | month | technique |
 * |---|---|---|
 * | A | Sept + Oct | `//` with a rounding-up boundary, inside one traversal |
 * | B | Oct **or** Dec | an inner counting loop, or sort then neighbours |
 * | C | Nov + Dec + Jan | a helper applied q times, over a sorted list |
 * | D | Feb **or** Mar | a region on a grid — the wave, or recursion |
 * | E | Apr (and why Feb's exhaustive search will not do) | a DP table |
 *
 * B and D are the two problems with more than one right answer, and neither
 * statement says which month to open. That is not vagueness: it is the
 * objective. For D, a flood fill written recursively and one written as March's
 * queue are the same solution and the judge cannot tell them apart, so
 * `n, m ≤ 20` is chosen to keep a recursive walk inside Python's recursion
 * limit at its worst (400 cells). E closes February the other way — by being
 * the problem where «барлық нұсқаны тексеру» is exactly the method that does
 * not finish.
 *
 * Two neighbours are worth naming, because a family recurring across two
 * contests is a fair thing for a reviewer to check. `m9.c2.p4` is also a walk
 * over a grid, but it fills from ONE given cell and reports what the fill did
 * not reach, with four neighbours; D enumerates every region, reports the
 * largest, and counts a corner as a join. The pair is better than either alone:
 * one punishes a diagonal step and the other requires it, which is the year's
 * shortest possible lesson in reading the statement instead of reusing a habit.
 * And `m9.l4.b3` puts a palindrome checker on screen — which is one reason this
 * contest does not ask for one, the other being that October already owns that
 * family outright (m2.l6).
 *
 * ## Structural requirements: which honest option each place took
 *
 * The contract's rule is that a requirement no checker can see is not a
 * requirement, and there are three honest options. This file uses two of them,
 * deliberately:
 *
 * - **C takes option 2 — guidance, graded on the answer.** Its prompt suggests
 *   a helper function that answers one query and says out loud that this is
 *   advice and that the judge compares only the printed lines. Option 1 is
 *   unavailable: no output here becomes impossible without a function. Option 3
 *   would need an `explain` block, and a 45-minute contest of five problems has
 *   no room for one — `m9.l4` («Шешімді қорғау») is where the written defence
 *   lives, and the tournament is where it is marked.
 * - **E takes option 1 — the output is impossible without the method.** Its
 *   last hidden case is forty numbers whose answer is `no`, so a search over
 *   subsets cannot short-circuit and has to look at all of them. Measured:
 *   the table answers in 0.02 s, the plain recursive search does not finish in
 *   12 s, and neither does the same search with the obvious `s > half` pruning.
 *   That is a constraint the other method cannot meet, not a sentence in a
 *   prompt that nothing enforces.
 *
 * Nowhere below does a prompt say «функция жаз», «return қайтар» or «мына
 * әдісті қолдан» as a rule. C's own `skillRefs` follow from that decision: they
 * name `bsearch.*`, `sort.basic` and `perf.time_estimate` and **not** any
 * `func.*` skill, because a judge that sees one number per line cannot produce
 * evidence about whether a function was defined. D declares `graph.regions`,
 * `grid.cells` and `loops.nested` — what both legal traversals have in common —
 * and neither `graph.bfs` nor `recursion.core`, either of which would be a false
 * claim about half the submissions.
 *
 * ## What the skills say in general
 *
 * Each problem declares the YEAR skill it actually measures, not the four
 * `contest.*` skills. Solving E is evidence about a DP table; it is not
 * evidence about how the forty-five minutes were split, and filing it as such
 * would put a number on the one thing this month wants a teacher to watch. The
 * contest skills are declared by the lesson, and `m9.l1`–`m9.l3` are where they
 * are taught and measured.
 *
 * ## Tracks: all five problems on all three routes
 *
 * c1 withholds its hardest problem from Қолдау, which is fair for the first
 * contest of the month. This is the last one before the tournament, and the
 * tournament — see the assessment — puts **five unseen problems in front of
 * every route** and asks for two solved. A rehearsal that hands one route four
 * problems rehearses an event that does not exist. Support's differentiation in
 * May is when help opens and what happens in the three days after («талдаудан
 * кейін толық шешіп шығу»), not a shorter contest.
 *
 * ## What the cases can prove and what they cannot
 *
 * C states n, q ≤ 100 000. That bound is real and it is what rules out a scan
 * of the whole list per query — but the cases here are small, and a correct
 * linear solution passes every one of them. The input a timing case would need
 * is two hundred thousand numbers, which is not a thing a source file should
 * carry. So it is recorded here rather than dressed up, exactly as `m9.c1` did,
 * and no prompt claims the checker times anything. E is the one problem where a
 * case genuinely does separate the methods, and it does it because the answer is
 * `no` at forty items, not because a prompt says so.
 */
export const M9_C4: LessonBlock[] = [
  {
    /*
     * A · five minutes. SEPTEMBER's integer division and its rounding-up
     * boundary (m1.l6, `//` and `%`), applied once per element of a list —
     * OCTOBER's traversal (m2.l5). Nothing else, and nothing later.
     *
     * The whole problem is that the rounding happens PER CLASS. Every wrong
     * program is a program that rounded somewhere else, or not at all:
     *   · one division of the total — «4 5» / «1 1 1 1» answers 1, the truth is
     *     4, and the visible sample already answers 4 instead of 5;
     *   · `a[i] // k`, no rounding up — «1 10» / «1» answers 0 for a class that
     *     plainly needs a bus;
     *   · `a[i] // k + 1`, rounding up unconditionally — «1 10» / «10» answers 2
     *     and «5 3» / «3 3 3 3 3» answers 10, both exactly on the boundary where
     *     the division comes out even;
     *   · a loop that stops one class short, or starts one class late — «2 7» /
     *     «7 1» and «2 7» / «1 7» both answer 1 against a truth of 2. That is
     *     «соңғы элементті өткізіп жіберу», the error October's page names by
     *     hand, and problem A is where it costs the least to meet it.
     *   · `/` instead of `//` — every case, because `5.0` is not `5`.
     */
    id: "m9.c4.p1",
    type: "challenge",
    skillRefs: ["arith.integer_division", "lists.traverse", "loops.for", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "**A. Экскурсияға автобус.** Мектептің n сыныбы экскурсияға шығады, i-сыныпта a[i] оқушы бар. Бір автобусқа ең көбі k оқушы сияды. Әр сынып бөлек жүреді: бір автобуста екі түрлі сыныптың оқушысы отыра алмайды, ал бір сынып бірнеше автобусқа бөлініп мінсе болады.\n\nБарлық сыныпты тасу үшін ең аз дегенде неше автобус керек?\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен k сандары (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000000000). Екінші жолда n бүтін сан: a[1] … a[n] (1 ≤ a[i] ≤ 1000000000).\n\n**Шығыс.** Бір бүтін сан — автобустардың ең аз саны.\n\n**Мысал.**\n\n```\n3 10\n15 20 3\n```\n\nЖауап: `5` — бірінші сыныпқа 2 автобус, екіншісіне 2, үшіншісіне 1.",
      ru: "**A. Автобусы на экскурсию.** На экскурсию едут n классов школы, в i-м классе a[i] учеников. В один автобус помещается не больше k учеников. Классы едут по отдельности: в одном автобусе не могут оказаться ученики двух разных классов, а вот один класс может ехать в нескольких автобусах.\n\nСколько автобусов нужно самое меньшее, чтобы увезти все классы?\n\n**Вход.** В первой строке через пробел числа n и k (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000000000). Во второй строке n целых чисел: a[1] … a[n] (1 ≤ a[i] ≤ 1000000000).\n\n**Выход.** Одно целое число — наименьшее количество автобусов.\n\n**Пример.**\n\n```\n3 10\n15 20 3\n```\n\nОтвет: `5` — первому классу 2 автобуса, второму 2, третьему 1.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "buses = 0\n" +
      "for i in range(n):\n" +
      "    buses = buses + (a[i] + k - 1) // k\n" +
      "print(buses)",
    cases: [
      { input: "3 10\n15 20 3", expectedOutput: "5" },
      /* Every class is far smaller than one bus: dividing the total gives 1. */
      { input: "4 5\n1 1 1 1", expectedOutput: "4", hidden: true },
      /* Exactly on the boundary — one full bus, not two. */
      { input: "1 10\n10", expectedOutput: "1", hidden: true },
      /* One child still needs a whole bus: plain `//` gives 0. */
      { input: "1 10\n1", expectedOutput: "1", hidden: true },
      /* The class that must not be skipped is last, then first. */
      { input: "2 7\n7 1", expectedOutput: "2", hidden: true },
      { input: "2 7\n1 7", expectedOutput: "2", hidden: true },
      /* Every class divides evenly: unconditional rounding up doubles this. */
      { input: "5 3\n3 3 3 3 3", expectedOutput: "5", hidden: true },
      /* One child per bus. */
      { input: "3 1\n5 1 4", expectedOutput: "10", hidden: true },
      /* The top of both stated ranges, and one either side of it. */
      { input: "1 1000000000\n1000000000", expectedOutput: "1", hidden: true },
      { input: "2 1000000000\n999999999 1", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * B · seven minutes, and the one problem here with two correct solutions
     * from two different months. OCTOBER: a second loop inside the first
     * («қарапайым ішкі циклдер», m2.l8) counting how often each value occurs.
     * DECEMBER: `.sort()` first (m4.l7), after which equal values stand next to
     * each other and one pass over the neighbours answers it. n ≤ 1000 is
     * chosen so both finish comfortably; the statement names neither, which is
     * this contest's whole point.
     *
     * The reference below is the December one, written so the first and last
     * elements are handled by the same three lines as everything else — that
     * boundary is where the shorter versions of it break. As with C and D, the
     * block declares only what both routes to the answer have in common:
     * `sort.basic` is absent, because half of the correct solutions never sort
     * anything and evidence about ordering would be a claim about them that is
     * not true.
     *
     * The degenerate programs:
     *   · counting the DISTINCT problem numbers instead of the ones solved once
     *     — the visible sample answers 3 where the truth is 1, and «3» /
     *     «1 1 5» answers 2 against 1;
     *   · the inner loop written `for j in range(i + 1, n)`, so a number is
     *     "alone" whenever nothing after it matches — the sample answers 3, and
     *     «3» / «1 2 1» answers 2 against 1;
     *   · comparing neighbours WITHOUT sorting first — the sample answers 6,
     *     and «3» / «1 2 1» answers 3, because the equal values are not next to
     *     each other until they are put there;
     *   · a run-length version that never closes the LAST run — «3» / «1 1 5»
     *     answers 0, «3» / «1 2 3» answers 2, and «1» / «9» answers 0. That is
     *     «соңғы элементті өткізіп жіберу» again, in the shape it takes once a
     *     list is sorted.
     * The unique value sits last in one case and first in the next, on purpose.
     */
    id: "m9.c4.p2",
    type: "challenge",
    skillRefs: ["lists.traverse", "lists.index", "loops.counter", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "**B. Жалғыз шешілген есептер.** Жаттығу жарысында барлығы n шешім жіберілді. i-шешім a[i] нөмірлі есепке жіберілген; бір есепке бірнеше шешім келуі де мүмкін.\n\nДәл бір шешім келген есептер нешеу?\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n бүтін сан: a[1] … a[n], әрқайсысының абсолют шамасы 1000000000-нан аспайды.\n\n**Шығыс.** Бір бүтін сан — тізімде дәл бір рет кездесетін нөмірлердің саны. Ондай нөмір болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n6\n4 5 4 3 5 4\n```\n\nЖауап: `1` — бұл 3 нөмірлі есеп. 4 нөмірге үш шешім, 5 нөмірге екі шешім келген.",
      ru: "**B. Задачи с единственным решением.** На тренировочном соревновании отправили всего n решений. i-е решение отправлено к задаче с номером a[i]; к одной задаче может прийти и несколько решений.\n\nСколько задач получили ровно одно решение?\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 1000). Во второй строке n целых чисел через пробел: a[1] … a[n], каждое по модулю не больше 1000000000.\n\n**Выход.** Одно целое число — сколько номеров встречается в списке ровно один раз. Если таких номеров нет, выведи 0.\n\n**Пример.**\n\n```\n6\n4 5 4 3 5 4\n```\n\nОтвет: `1` — это задача с номером 3. К номеру 4 пришло три решения, к номеру 5 — два.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "alone = 0\n" +
      "for i in range(n):\n" +
      "    left = 0\n" +
      "    if i > 0 and a[i - 1] == a[i]:\n" +
      "        left = 1\n" +
      "    right = 0\n" +
      "    if i < n - 1 and a[i + 1] == a[i]:\n" +
      "        right = 1\n" +
      "    if left == 0 and right == 0:\n" +
      "        alone = alone + 1\n" +
      "print(alone)",
    cases: [
      { input: "6\n4 5 4 3 5 4", expectedOutput: "1" },
      /* The number that is alone is the largest, then the smallest. */
      { input: "3\n1 1 5", expectedOutput: "1", hidden: true },
      { input: "3\n1 5 5", expectedOutput: "1", hidden: true },
      /* Every number alone, then none of them. */
      { input: "3\n1 2 3", expectedOutput: "3", hidden: true },
      { input: "3\n7 7 7", expectedOutput: "0", hidden: true },
      /* One solution in the whole contest. */
      { input: "1\n9", expectedOutput: "1", hidden: true },
      /* The two equal numbers are not next to each other in the input. */
      { input: "3\n1 2 1", expectedOutput: "1", hidden: true },
      /* Runs of three, two, one and two. */
      { input: "8\n2 2 2 3 3 4 5 5", expectedOutput: "1", hidden: true },
      /* Negative numbers, and both ends of the stated range. */
      { input: "4\n-3 -3 4 -1", expectedOutput: "2", hidden: true },
      { input: "2\n1000000000 -1000000000", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * C · ten minutes, and the first problem here that needs three months at
     * once. DECEMBER to put the results in order (m4.l3, `.sort()`), JANUARY to
     * find the boundary inside them (m5.l2, «екіге бөліп іздеу» over a sorted
     * list), and NOVEMBER to write the search once and call it q times (m3.l3,
     * m3.l5). The list is deliberately given UNSORTED: the ordering step is
     * part of the problem, not part of the input format.
     *
     * THE STRUCTURAL REQUIREMENT. The helper is stated as ADVICE — «кеңес қана»
     * / «это только совет» — with a sentence saying the judge compares the
     * printed lines and nothing else. Option 2 of the contract, chosen because
     * no output here can be made impossible without a function, and because
     * option 3 would need an `explain` block this contest has no minutes for.
     * A learner who writes one long loop has broken no rule and is told so.
     *
     * THE LAYOUT. The prompt states one answer per line, so the block declares
     * `{ kind: "exact" }`. Under the default `token` checker a program printing
     * all q answers on one line would be graded correct against a prompt that
     * says otherwise — `m2.l3.b8`'s defect, and the reason the rule exists.
     *
     * The degenerate programs:
     *   · searching without sorting first — «5 1» / «1 9 1 9 1» / «9» answers 0
     *     where the truth is 2, and the visible sample passes, because the
     *     sample happens to answer correctly from an unsorted list;
     *   · `>` where the statement says «кем емес» — «1 1» / «5» / «5» answers 0
     *     and «4 2» / «7 7 7 7» / «7 8» answers 0 on the first query, both of
     *     which put x exactly on a value that is present;
     *   · an off-by-one on the boundary index — the same two cases, plus
     *     «6 1» / «5 5 5 6 4 4» / «5», where the value on the boundary is
     *     repeated three times;
     *   · x below every result and x above every result — «5 2» / «1 2 3 4 5» /
     *     «1 6» is n and 0 in one case.
     * A linear count per query is CORRECT and passes: see the file header, which
     * says so rather than pretending the bound is enforced.
     */
    id: "m9.c4.p3",
    type: "challenge",
    skillRefs: ["bsearch.core", "bsearch.boundary", "sort.basic", "perf.time_estimate"],
    sourceType: "product-authored",
    checker: { kind: "exact" },
    prompt: {
      kk: "**C. Норманы орындағандар.** Жарысқа n спортшы қатысты, i-спортшы r[i] ұпай жинады. Нәтижелер кез келген ретпен берілген — олар реттелмеген.\n\nЖаттықтырушы q рет сұрақ қояды. Әр сұрақта бір x саны беріледі: ұпайы x-тен кем емес, яғни x-ке тең немесе одан үлкен спортшылар нешеу?\n\n**Кіріс.** Бірінші жолда n мен q сандары (1 ≤ n ≤ 100000, 1 ≤ q ≤ 100000). Екінші жолда n бүтін сан: r[1] … r[n] (1 ≤ r[i] ≤ 1000000000). Үшінші жолда q бүтін сан — сұрақтардың x мәндері (1 ≤ x ≤ 1000000000).\n\n**Шығыс.** q жол шығар: әр сұрақтың жауабы жеке жолда, сұрақтар берілген ретпен.\n\n**Мысал.**\n\n```\n5 3\n10 4 7 4 9\n5 4 11\n```\n\nЖауап:\n\n```\n3\n5\n0\n```\n\nКеңес: бір x үшін жауап беретін көмекші функция жазып, оны әр сұраққа шақырған ыңғайлы. Бұл — кеңес қана, талап емес: тексеру жүйесі тек шыққан жолдарды салыстырады.",
      ru: "**C. Выполнившие норматив.** В соревновании участвовали n спортсменов, i-й набрал r[i] очков. Результаты даны в произвольном порядке — они не отсортированы.\n\nТренер задаёт q вопросов. В каждом вопросе дано одно число x: сколько спортсменов набрали не меньше x очков, то есть ровно x или больше?\n\n**Вход.** В первой строке числа n и q (1 ≤ n ≤ 100000, 1 ≤ q ≤ 100000). Во второй строке n целых чисел: r[1] … r[n] (1 ≤ r[i] ≤ 1000000000). В третьей строке q целых чисел — значения x (1 ≤ x ≤ 1000000000).\n\n**Выход.** Выведи q строк: ответ на каждый вопрос на отдельной строке, в том порядке, в каком заданы вопросы.\n\n**Пример.**\n\n```\n5 3\n10 4 7 4 9\n5 4 11\n```\n\nОтвет:\n\n```\n3\n5\n0\n```\n\nСовет: удобно написать вспомогательную функцию, которая отвечает на один вопрос, и вызывать её для каждого x. Это только совет, а не требование: проверяющая система сравнивает лишь выведенные строки.",
    },
    referenceSolution:
      "def count_at_least(a, x):\n" +
      "    lo = 0\n" +
      "    hi = len(a)\n" +
      "    while lo < hi:\n" +
      "        mid = (lo + hi) // 2\n" +
      "        if a[mid] >= x:\n" +
      "            hi = mid\n" +
      "        else:\n" +
      "            lo = mid + 1\n" +
      "    return len(a) - lo\n" +
      "\n" +
      "n, q = map(int, input().split())\n" +
      "r = list(map(int, input().split()))\n" +
      "r.sort()\n" +
      "asked = list(map(int, input().split()))\n" +
      "for j in range(q):\n" +
      "    print(count_at_least(r, asked[j]))",
    cases: [
      { input: "5 3\n10 4 7 4 9\n5 4 11", expectedOutput: "3\n5\n0" },
      /* One athlete, one question: x exactly on the result, then one above it. */
      { input: "1 1\n5\n5", expectedOutput: "1", hidden: true },
      { input: "1 1\n5\n6", expectedOutput: "0", hidden: true },
      /* Every result identical: `>` instead of `>=` prints 0 here. */
      { input: "4 2\n7 7 7 7\n7 8", expectedOutput: "4\n0", hidden: true },
      /* An unsorted list a binary search would walk straight past. */
      { input: "5 1\n1 9 1 9 1\n9", expectedOutput: "2", hidden: true },
      /* The boundary value appears three times, and 4 sits just below it. */
      { input: "6 1\n5 5 5 6 4 4\n5", expectedOutput: "4", hidden: true },
      /* The top of the value range, and one either side of the middle result. */
      {
        input: "3 3\n1000000000 1 500000000\n1000000000 1 500000001",
        expectedOutput: "1\n3\n1",
        hidden: true,
      },
      /* x below everything, then above everything: n and 0. */
      { input: "5 2\n1 2 3 4 5\n1 6", expectedOutput: "5\n0", hidden: true },
    ],
  },
  {
    /*
     * D · ten minutes. MARCH's «байланысқан аймақтар» on March's own map format
     * — «n m», then n rows of `.` and `#` — walked with the queue m7.l3 built
     * out of two parallel lists and a head index. FEBRUARY's recursion solves it
     * just as well: a recursive flood fill is the same traversal, and `n, m ≤ 20`
     * is chosen so its deepest possible call chain is 400, safely inside
     * Python's limit. The judge cannot tell the two apart and does not try, which
     * is why this block declares `graph.regions`, `grid.cells` and `loops.nested`
     * and neither `graph.bfs` nor `recursion.core`.
     *
     * TWO CLAUSES ARE CHANGED FROM MARCH, AND BOTH ARE IN THE STATEMENT. The
     * regions are made of `#`, not of the free cells March's lessons always
     * used; and two cells are neighbours when they share a side OR a corner —
     * eight neighbours, not four. Both are stated in bold in both languages, so
     * nothing is hidden. What IS deliberate is that the visible sample answers 4
     * under either rule: a learner who pastes a four-neighbour walk from March
     * sees it pass and finds out on the hidden cases, which is precisely what
     * «жеке қателер журналы … тексеру тізіміне айналады» is for.
     *
     * The degenerate programs:
     *   · four neighbours instead of eight — the diagonal chain «5 5» answers 1
     *     where the truth is 5, the corner-touch map answers 2 against 4, and the
     *     checkerboard answers 1 against 8;
     *   · counting the regions instead of measuring the largest — the visible
     *     sample answers 2, and the full map answers 1 against 9;
     *   · marking a cell when it LEAVES the queue instead of when it enters, so
     *     a cell is counted twice — the full 3 × 3 map answers 32 against 9, and
     *     even the visible sample answers 7 against 4. That is m7.l5's whole
     *     subject and a compact block is the only shape that shows it;
     *   · keeping the last region's size instead of the largest — «3 5» with the
     *     big region first answers 1 against 2, and the mirrored map catches the
     *     opposite mistake;
     *   · measuring the free cells by mistake — the visible sample answers 13;
     *   · assuming there is at least one `#` — the snowless yard is 0.
     */
    id: "m9.c4.p4",
    type: "challenge",
    skillRefs: ["graph.regions", "grid.cells", "loops.nested"],
    sourceType: "product-authored",
    prompt: {
      kk: "**D. Ең үлкен қар алаңы.** Аула n жол мен m бағанға бөлінген. Әр ұяшық не бос, не қар басқан.\n\nЕкі қар ұяшығы **ортақ қабырғасы болса да, ортақ бұрышы болса да** көрші саналады — яғни ұяшықтың ең көбі сегіз көршісі бар. Бір-бірімен көрші қар ұяшықтары бір алаң құрайды: бір алаңның кез келген екі ұяшығының арасында тек қар ұяшықтары арқылы жүріп өтуге болады.\n\n**Кіріс.** Бірінші жолда n мен m сандары (1 ≤ n ≤ 20, 1 ≤ m ≤ 20). Келесі n жолдың әрқайсысында дәл m таңба: `.` — бос ұяшық, `#` — қар басқан ұяшық.\n\n**Шығыс.** Бір бүтін сан — ең үлкен алаңдағы қар ұяшықтарының саны. Аулада қар мүлде болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n4 5\n##...\n##...\n...#.\n...##\n```\n\nЖауап: `4`.",
      ru: "**D. Самая большая заснеженная область.** Двор разбит на n строк и m столбцов. Каждая клетка либо свободна, либо занесена снегом.\n\nДве снежные клетки считаются соседними, **если у них есть общая сторона или хотя бы общий угол**, — то есть у клетки не больше восьми соседей. Соседние снежные клетки образуют одну область: между любыми двумя клетками одной области можно пройти только по снежным клеткам.\n\n**Вход.** В первой строке числа n и m (1 ≤ n ≤ 20, 1 ≤ m ≤ 20). В каждой из следующих n строк ровно m символов: `.` — свободная клетка, `#` — клетка со снегом.\n\n**Выход.** Одно целое число — сколько снежных клеток в самой большой области. Если снега во дворе нет совсем, выведи 0.\n\n**Пример.**\n\n```\n4 5\n##...\n##...\n...#.\n...##\n```\n\nОтвет: `4`.",
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
      "dr = [-1, -1, -1, 0, 0, 1, 1, 1]\n" +
      "dc = [-1, 0, 1, -1, 1, -1, 0, 1]\n" +
      "best = 0\n" +
      "for sr in range(n):\n" +
      "    for sc in range(m):\n" +
      '        if g[sr][sc] == "#" and seen[sr][sc] == 0:\n' +
      "            seen[sr][sc] = 1\n" +
      "            qr = [sr]\n" +
      "            qc = [sc]\n" +
      "            head = 0\n" +
      "            size = 0\n" +
      "            while head < len(qr):\n" +
      "                r = qr[head]\n" +
      "                c = qc[head]\n" +
      "                head = head + 1\n" +
      "                size = size + 1\n" +
      "                for t in range(8):\n" +
      "                    nr = r + dr[t]\n" +
      "                    nc = c + dc[t]\n" +
      "                    if nr >= 0 and nr < n and nc >= 0 and nc < m:\n" +
      '                        if g[nr][nc] == "#" and seen[nr][nc] == 0:\n' +
      "                            seen[nr][nc] = 1\n" +
      "                            qr.append(nr)\n" +
      "                            qc.append(nc)\n" +
      "            if size > best:\n" +
      "                best = size\n" +
      "print(best)",
    cases: [
      { input: "4 5\n##...\n##...\n...#.\n...##", expectedOutput: "4" },
      /* A staircase joined only by corners: four neighbours give 1. */
      { input: "5 5\n#....\n.#...\n..#..\n...#.\n....#", expectedOutput: "5", hidden: true },
      /* Two pieces that touch at exactly one corner. */
      { input: "3 3\n##.\n..#\n..#", expectedOutput: "4", hidden: true },
      /* No snow at all, and the whole yard under snow. */
      { input: "2 3\n...\n...", expectedOutput: "0", hidden: true },
      { input: "3 3\n###\n###\n###", expectedOutput: "9", hidden: true },
      /* The smallest maps there are, with and without snow. */
      { input: "1 1\n#", expectedOutput: "1", hidden: true },
      { input: "1 1\n.", expectedOutput: "0", hidden: true },
      /* The biggest region is found last, then first. */
      { input: "3 5\n#....\n.....\n...##", expectedOutput: "2", hidden: true },
      { input: "3 5\n##...\n.....\n....#", expectedOutput: "2", hidden: true },
      /* A checkerboard: eight neighbours make it one region of eight cells. */
      { input: "4 4\n#.#.\n.#.#\n#.#.\n.#.#", expectedOutput: "8", hidden: true },
    ],
  },
  {
    /*
     * E · thirteen minutes, and the hardest problem of the four contests.
     * APRIL: «қадамдап толтырылатын кесте» — a table indexed by a sum, filled
     * one student at a time, where `can[s]` means «осы уақытқа дейін қаралған
     * оқушылардан дәл s ұпай жинауға бола ма». The month's own «алдыңғы
     * жауаптар арқылы шешу», with the previous answers being a whole row.
     *
     * WHY THIS IS ALSO FEBRUARY, AND WHY THE CONSTRAINT IS REAL. «Барлық
     * нұсқаны тексеру» is the first idea anyone has here and it is the one
     * method that does not finish: the last hidden case is forty students whose
     * answer is `no`, so a search over subsets cannot stop early and must look
     * at all 2^40 of them. Measured on this machine: the table answers in
     * 0.02 s; the plain recursive search does not finish in 12 s; neither does
     * the same search pruned at `2 * s > total`. This is option 1 of the
     * authoring contract — the output is impossible without the method — and it
     * is the only place in this file where a method claim is actually enforced.
     *
     * The degenerate programs:
     *   · «қосынды жұп болса — yes» — «4» / «1 1 1 5» answers yes where the
     *     truth is no, and so do «3» / «4 4 4» and «5» / «2 2 2 2 6», the last
     *     of which has every value even and a half that is odd;
     *   · the greedy split (sort descending, add each student to whichever team
     *     is behind) — «5» / «8 7 6 5 4» answers no, the truth is yes: 8 + 7
     *     ties 6 + 5 + 4. The visible sample is deliberately one the greedy
     *     rule gets RIGHT, so nothing on screen warns anybody;
     *   · a table updated in place in increasing order of s, which lets one
     *     student join both teams — «4» / «1 1 1 5» answers yes against no;
     *   · forgetting that a single student can never be split — «1» / «4» is no
     *     even though the total is even.
     * «2» / «3 3» is the smallest yes there is and «2» / «1 2» the smallest no.
     */
    id: "m9.c4.p5",
    type: "challenge",
    skillRefs: ["dp.core", "dp.table", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "**E. Күші тең екі команда.** Сыныпта n оқушы бар, i-оқушының күші a[i] ұпаймен өлшенген. Барлық оқушыны екі командаға бөлу керек, әрі әр оқушы дәл бір командада болуы тиіс. Екі команданың ұпай қосындысы дәл тең болатындай етіп бөлуге бола ма?\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 100). Екінші жолда бос орынмен бөлінген n сан: a[1] … a[n] (1 ≤ a[i] ≤ 100).\n\n**Шығыс.** Бөлуге болса `yes`, болмаса `no` сөзін шығар — латын әріптерімен, тырнақшасыз.\n\n**Мысал.**\n\n```\n4\n1 5 3 3\n```\n\nЖауап: `yes` — бір командада 1 мен 5, екіншісінде 3 пен 3, екеуінің де қосындысы 6.",
      ru: "**E. Две команды равной силы.** В классе n учеников, сила i-го ученика измерена числом a[i]. Всех учеников нужно разбить на две команды, причём каждый ученик попадает ровно в одну команду. Можно ли разбить их так, чтобы суммы очков обеих команд оказались в точности равны?\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 100). Во второй строке n чисел через пробел: a[1] … a[n] (1 ≤ a[i] ≤ 100).\n\n**Выход.** Выведи `yes`, если разбить можно, и `no`, если нельзя, — латинскими буквами, без кавычек.\n\n**Пример.**\n\n```\n4\n1 5 3 3\n```\n\nОтвет: `yes` — в одной команде 1 и 5, в другой 3 и 3, сумма у обеих равна 6.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "total = 0\n" +
      "for i in range(n):\n" +
      "    total = total + a[i]\n" +
      "if total % 2 == 1:\n" +
      '    print("no")\n' +
      "else:\n" +
      "    half = total // 2\n" +
      "    can = [0] * (half + 1)\n" +
      "    can[0] = 1\n" +
      "    for i in range(n):\n" +
      "        nxt = [0] * (half + 1)\n" +
      "        for s in range(half + 1):\n" +
      "            if can[s] == 1:\n" +
      "                nxt[s] = 1\n" +
      "                if s + a[i] <= half:\n" +
      "                    nxt[s + a[i]] = 1\n" +
      "        can = nxt\n" +
      "    if can[half] == 1:\n" +
      '        print("yes")\n' +
      "    else:\n" +
      '        print("no")',
    cases: [
      { input: "4\n1 5 3 3", expectedOutput: "yes" },
      /* The greedy split answers no here. */
      { input: "5\n8 7 6 5 4", expectedOutput: "yes", hidden: true },
      /* Even total, impossible split — and the case that catches a table which
         lets one student join both teams. */
      { input: "4\n1 1 1 5", expectedOutput: "no", hidden: true },
      { input: "3\n4 4 4", expectedOutput: "no", hidden: true },
      /* Every value even, half odd: nothing can reach it. */
      { input: "5\n2 2 2 2 6", expectedOutput: "no", hidden: true },
      /* One student, even total: still no. */
      { input: "1\n4", expectedOutput: "no", hidden: true },
      /* The smallest yes and the smallest no. */
      { input: "2\n3 3", expectedOutput: "yes", hidden: true },
      { input: "2\n1 2", expectedOutput: "no", hidden: true },
      /* Forty students and the answer is no, so a search over subsets has to
         look at every one of them and does not finish. The table does. */
      {
        input: "40\n6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 8",
        expectedOutput: "no",
        hidden: true,
      },
      /* The top of both stated bounds: a hundred students of a hundred points. */
      {
        input:
          "100\n100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100 100",
        expectedOutput: "yes",
        hidden: true,
      },
    ],
  },
];
