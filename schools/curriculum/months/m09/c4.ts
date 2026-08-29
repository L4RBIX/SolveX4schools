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
 * contested. This one carries six of them in its five problems, plus February
 * as the method two of the constraints rule out — and, deliberately, not March:
 *
 * | | month | technique |
 * |---|---|---|
 * | A | Sept + Oct | `//` with a rounding-up boundary, inside one traversal |
 * | B | Oct **or** Dec | an inner counting loop, or sort then neighbours |
 * | C | Nov + Dec + Jan | a helper applied q times, over a sorted list |
 * | D | Apr | a table over a grid of costs, filled one row at a time |
 * | E | Apr (and why Feb's exhaustive search will not do) | a DP table |
 *
 * B is the problem with two correct solutions from two different months, and
 * its statement says which of them to use no more than the others do. That is
 * not vagueness: it is the objective.
 *
 * D and E are both April, and they are the two places where «барлық нұсқаны
 * тексеру» — February's exhaustive check — is exactly the method that does not
 * finish. February is contested directly in `m9.c2`, twice; meeting it here as
 * the idea a constraint rules out is the other half of the same lesson.
 *
 * ## What this contest deliberately does NOT contain
 *
 * **No wave, and no map.** March is contested three times already — `m9.c2.p4`
 * and `m9.c2.p5`, and the tournament's own D, «Ең үлкен көл», which is the
 * largest connected region on a grid. A rehearsal that hands the learner the
 * tournament's problem the week before is not a rehearsal, so the only grid in
 * this contest is a field of numbers to be filled in, not a map to be walked.
 *
 * **No palindrome, and no words.** October owns that family outright (m2.l6),
 * `m9.l4.b3` puts a full palindrome checker on screen, and `m9.c2.p1` already
 * counts the words in a line that satisfy a property. B asks about duplicates
 * in a list of numbers instead, which nothing in the month asks.
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
 * - **D and E take option 1 — the output is impossible without the method.**
 *   E's last hidden case is forty numbers whose answer is `no`, so a search
 *   over subsets cannot short-circuit and has to look at all of them; D's is a
 *   twenty-row field with up to 5 · 3^19 routes through it. Measured, not
 *   asserted:
 *   E's table answers in 0.02 s while the plain recursive search does not finish
 *   in 12 s and neither does the same search pruned at `s > half`; D's table
 *   answers in 0.02 s while a recursive walk over the routes does not finish in
 *   15 s. That is a constraint the other method cannot meet, not a sentence in
 *   a prompt that nothing enforces.
 *
 * Nowhere below does a prompt say «функция жаз», «return қайтар» or «мына
 * әдісті қолдан» as a rule. C's own `skillRefs` follow from that decision: they
 * name `bsearch.*`, `sort.basic` and `perf.time_estimate` and **not** any
 * `func.*` skill, because a judge that sees one number per line cannot produce
 * evidence about whether a function was defined. B follows the same rule from
 * the other side: it declares no `sort.basic`, because sorting is one of the two
 * ways to answer it and half of the correct submissions never sort at all.
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
 * and no prompt claims the checker times anything. D and E are the two problems
 * where a case genuinely does separate the methods, and they manage it only
 * because a small input can still have an enormous number of routes through it —
 * which C's shape does not allow.
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
      kk: "**A. Экскурсияға автобус.** Мектептің n сыныбы экскурсияға шығады, i-сыныпта a[i] оқушы бар. Бір автобусқа ең көбі k оқушы сияды. Әр сынып бөлек жүреді: бір автобуста екі түрлі сыныптың оқушысы отыра алмайды, ал бір сынып бірнеше автобусқа бөлініп мінсе болады.\n\nБарлық сыныпты тасымалдау үшін ең аз дегенде неше автобус керек?\n\n**Кіріс.** Бірінші жолда бос орынмен бөлінген n мен k сандары (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000000000). Екінші жолда n бүтін сан: a[1] … a[n] (1 ≤ a[i] ≤ 1000000000).\n\n**Шығыс.** Бір бүтін сан — автобустардың ең аз саны.\n\n**Мысал.**\n\n```\n3 10\n15 20 3\n```\n\nЖауап: `5` — бірінші сыныпқа 2 автобус, екіншісіне 2, үшіншісіне 1.",
      ru: "**A. Автобусы на экскурсию.** Из школы на экскурсию едут n классов, в i-м классе a[i] учеников. В один автобус помещается не больше k учеников. Классы едут по отдельности: в одном автобусе не могут оказаться ученики двух разных классов, а вот один класс может ехать в нескольких автобусах.\n\nСколько автобусов нужно самое меньшее, чтобы увезти все классы?\n\n**Вход.** В первой строке через пробел числа n и k (1 ≤ n ≤ 1000, 1 ≤ k ≤ 1000000000). Во второй строке n целых чисел: a[1] … a[n] (1 ≤ a[i] ≤ 1000000000).\n\n**Выход.** Одно целое число — наименьшее количество автобусов.\n\n**Пример.**\n\n```\n3 10\n15 20 3\n```\n\nОтвет: `5` — первому классу 2 автобуса, второму 2, третьему 1.",
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
      kk: "**B. Жалғыз шешілген есептер.** Жаттығу жарысында барлығы n шешім жіберілді. i-шешім a[i] нөмірлі есепке жіберілген; бір есепке бірнеше шешім келуі де мүмкін.\n\nДәл бір шешім келген есептер нешеу?\n\n**Кіріс.** Бірінші жолда n саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n бүтін сан: a[1] … a[n] (1 ≤ a[i] ≤ 1000000000).\n\n**Шығыс.** Бір бүтін сан — тізімде дәл бір рет кездесетін нөмірлердің саны. Ондай нөмір болмаса, 0 шығар.\n\n**Мысал.**\n\n```\n6\n4 5 4 3 5 4\n```\n\nЖауап: `1` — бұл 3 нөмірлі есеп. 4 нөмірге үш шешім, 5 нөмірге екі шешім келген.",
      ru: "**B. Задачи с единственным решением.** На тренировочном соревновании отправили всего n решений. i-е решение отправлено к задаче с номером a[i]; к одной задаче может прийти и несколько решений.\n\nСколько задач получили ровно одно решение?\n\n**Вход.** В первой строке число n (1 ≤ n ≤ 1000). Во второй строке n целых чисел через пробел: a[1] … a[n] (1 ≤ a[i] ≤ 1000000000).\n\n**Выход.** Одно целое число — сколько номеров встречается в списке ровно один раз. Если таких номеров нет, выведи 0.\n\n**Пример.**\n\n```\n6\n4 5 4 3 5 4\n```\n\nОтвет: `1` — это задача с номером 3. К номеру 4 пришло три решения, к номеру 5 — два.",
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
      /* A pair and two singletons, and both ends of the stated range. */
      { input: "4\n3 3 4 1", expectedOutput: "2", hidden: true },
      { input: "2\n1000000000 1", expectedOutput: "2", hidden: true },
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
     * The tournament also has a sorted list with a boundary in it — its B takes
     * the k-th best score and asks who advances, its C searches over the answer
     * — and neither is this problem: one threshold the input names is not q
     * thresholds the learner has to find, and neither of them is a search over a
     * list. Rehearsing the idea while leaving the tournament's questions unseen
     * is the point of a rehearsal.
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
     * D · ten minutes. APRIL: «қадамдап толтырылатын кесте» over a grid of
     * costs, filled one row at a time, where the entry for a cell is the
     * cheapest way of ARRIVING at it — «алдыңғы жауаптар арқылы шешу» with the
     * previous answers being the row above. Only the previous row is ever
     * needed, so the reference keeps two lists rather than a full table; that is
     * a choice, not a requirement, and a learner who builds the whole table gets
     * the same number.
     *
     * WHY THIS IS A TABLE AND NOT A MAP. March is contested three times already
     * — twice in `m9.c2` and once in the tournament itself, whose D is «Ең үлкен
     * көл». A rehearsal that hands the learner the tournament's own problem is
     * not a rehearsal, so the grid here is a field of numbers to fill in rather
     * than a map to walk, and no wave appears in this contest at all.
     *
     * The bound n, m ≤ 200 is what rules out walking every route, and unlike C
     * a case can prove it: the 20 × 5 field below holds up to 5 · 3^19 routes,
     * and every one of them has to be walked before the cheapest is known.
     * Measured
     * — the table answers in 0.02 s and a recursive enumeration of the routes
     * does not finish in 15 s. Option 1 of the authoring contract again.
     *
     * The degenerate programs:
     *   · the smallest number in each row added up, with the neighbour rule
     *     ignored — the 4 × 4 field answers 5 against 8, and the visible sample
     *     already answers 12 against 13;
     *   · a straight vertical line, never stepping sideways — «3 2» / «6 0 / 1 8
     *     / 1 5» answers 8 against 2, and the sample answers 14;
     *   · starting in the leftmost column instead of the cheapest one — the same
     *     «3 2» field, for the same reason and with the same number;
     *   · stepping to the cheapest of the three cells below at every step,
     *     which is the greedy rule that looks obviously right — «2 3» / «2 3 6 /
     *     6 7 1» answers 8, the truth is 4, and it is the only case built for it;
     *   · `prev[j - 1]` written without the `j > 0` guard, which in Python does
     *     not crash: index −1 silently reads the LAST column of the row above.
     *     «4 3» / «1 1 4 / 7 1 0 / 4 9 7 / 4 6 5» answers 9 against 10 for it,
     *     and no other case here does;
     *   · enumerating every route — the 20 × 5 field.
     * n = 1, m = 1 and the 1 × 1 field are all legal inputs, and each of them
     * breaks a loop that assumes there is a row above or a column beside.
     */
    id: "m9.c4.p4",
    type: "challenge",
    skillRefs: ["dp.core", "dp.table", "grid.cells", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "**D. Егістік арқылы арық.** Егістік n жол мен m бағаннан тұратын торға бөлінген. i-жол мен j-бағанда тұрған ұяшықты қазудың құны a[i][j].\n\nЕгістіктің бірінші жолынан соңғы жолына дейін арық қазу керек: әр жолдан дәл бір ұяшық таңдалады. Көрші екі жолда таңдалған ұяшықтардың бағандары бір-бірінен ең көбі бірге өзгешеленуі тиіс — яғни арық тік төмен де, қиғаш төмен де жүре алады. Бірінші жолда қай бағаннан бастау да, соңғы жолда қай бағанда аяқтау да еркін.\n\nАрықтың құны — таңдалған ұяшықтардың құндарының қосындысы. Ең арзан арықтың құны қандай?\n\n**Кіріс.** Бірінші жолда n мен m сандары (1 ≤ n ≤ 200, 1 ≤ m ≤ 200). Келесі n жолдың әрқайсысында бос орынмен бөлінген m бүтін сан (0 ≤ a[i][j] ≤ 1000).\n\n**Шығыс.** Бір бүтін сан — ең арзан арықтың құны.\n\n**Мысал.**\n\n```\n3 3\n2 1 3\n6 5 4\n7 8 9\n```\n\nЖауап: `13` — құны 1, содан кейін 5, содан кейін 7 болатын ұяшықтар таңдалады.",
      ru: "**D. Арык через поле.** Поле разбито на n строк и m столбцов. Прокопать клетку, стоящую в строке i и столбце j, стоит a[i][j].\n\nЧерез поле нужно прокопать арык от первой строки до последней: в каждой строке выбирается ровно одна клетка. Столбцы клеток, выбранных в двух соседних строках, должны отличаться не больше чем на единицу — то есть арык идёт либо прямо вниз, либо вниз по диагонали. С какого столбца начать в первой строке и каким закончить в последней, ты выбираешь сам.\n\nСтоимость арыка — сумма стоимостей выбранных клеток. Какова стоимость самого дешёвого арыка?\n\n**Вход.** В первой строке числа n и m (1 ≤ n ≤ 200, 1 ≤ m ≤ 200). В каждой из следующих n строк m целых чисел через пробел (0 ≤ a[i][j] ≤ 1000).\n\n**Выход.** Одно целое число — стоимость самого дешёвого арыка.\n\n**Пример.**\n\n```\n3 3\n2 1 3\n6 5 4\n7 8 9\n```\n\nОтвет: `13` — выбраны клетки стоимостью 1, затем 5, затем 7.",
    },
    referenceSolution:
      "n, m = map(int, input().split())\n" +
      "a = []\n" +
      "for i in range(n):\n" +
      "    a.append(list(map(int, input().split())))\n" +
      "prev = []\n" +
      "for j in range(m):\n" +
      "    prev.append(a[0][j])\n" +
      "for i in range(1, n):\n" +
      "    cur = []\n" +
      "    for j in range(m):\n" +
      "        best = prev[j]\n" +
      "        if j > 0 and prev[j - 1] < best:\n" +
      "            best = prev[j - 1]\n" +
      "        if j < m - 1 and prev[j + 1] < best:\n" +
      "            best = prev[j + 1]\n" +
      "        cur.append(best + a[i][j])\n" +
      "    prev = cur\n" +
      "answer = prev[0]\n" +
      "for j in range(m):\n" +
      "    if prev[j] < answer:\n" +
      "        answer = prev[j]\n" +
      "print(answer)",
    cases: [
      { input: "3 3\n2 1 3\n6 5 4\n7 8 9", expectedOutput: "13" },
      /* The cheapest first step leads into the expensive row: greedy gives 8. */
      { input: "2 3\n2 3 6\n6 7 1", expectedOutput: "4", hidden: true },
      /* The row minima sit in columns too far apart to be joined: they add to 5,
         and no legal road is that cheap. */
      { input: "4 4\n2 1 9 9\n3 5 1 8\n1 9 0 9\n3 7 8 6", expectedOutput: "8", hidden: true },
      /* The road has to start in the right column and step left: a straight
         line, and a road forced to start at column one, both give 8. */
      { input: "3 2\n6 0\n1 8\n1 5", expectedOutput: "2", hidden: true },
      /* An unguarded prev[j - 1] reads the last column of the row above here. */
      { input: "4 3\n1 1 4\n7 1 0\n4 9 7\n4 6 5", expectedOutput: "10", hidden: true },
      /* One row: the answer is the cheapest cell in it, with no step at all. */
      { input: "1 4\n7 2 9 5", expectedOutput: "2", hidden: true },
      /* One column: there is nothing to choose, so every cell is paid for. */
      { input: "4 1\n3\n1\n4\n1", expectedOutput: "9", hidden: true },
      /* The smallest field there is, and a field where every road is free. */
      { input: "1 1\n0", expectedOutput: "0", hidden: true },
      { input: "3 3\n0 0 0\n0 0 0\n0 0 0", expectedOutput: "0", hidden: true },
      /* Twenty rows of five: 5 · 3^19 routes. Filling the table takes 0.02 s;
         walking the routes one at a time does not finish. */
      {
        input:
          "20 5\n16 41 65 66 83\n14 29 77 80 72\n54 74 71 94 99\n63 97 99 76 57\n31 1 79 11 15\n37 13 58 2 88\n63 87 41 27 51\n33 45 46 49 96\n66 82 10 93 44\n12 72 69 38 37\n59 19 83 91 92\n74 40 4 91 48\n47 60 55 12 52\n75 71 64 15 55\n65 97 77 63 51\n68 34 54 73 62\n66 67 4 74 29\n99 17 7 91 67\n86 14 92 80 55\n61 19 62 30 16",
        expectedOutput: "530",
        hidden: true,
      },
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
