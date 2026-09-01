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
 * | A | Sept + Oct | `/` with a rounding-up boundary, inside one traversal |
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
 * ## Where the type boundary bites, worked out per problem
 *
 * A: `a[i] + k - 1` reaches 2 · 10⁹ and the bus total reaches 10¹², so `long
 * long` is required twice and the statement says neither. B: at most 1000
 * numbers, so `int`. C: the answer is a sum of q counts and reaches
 * 2.5 · 10¹¹ — `long long`, and the last hidden case is the one that charges
 * for it. D: costs of 1000 over 200 rows is 2 · 10⁵, so `int`. E: a `yes`/`no`,
 * so `int` everywhere.
 *
 * Three `int` problems and two that are not, decided by arithmetic rather than
 * by habit. A month where every reference reaches for `long long` teaches a
 * reflex; `m9.l2.b1` asked for a check, and this is what performing it looks
 * like.
 *
 * ## Structural requirements: which honest option each place took
 *
 * The contract's rule is that a requirement no checker can see is not a
 * requirement, and there are three honest options. This file uses two of them,
 * deliberately:
 *
 * - **C now takes option 1 — the output is impossible without the method**, and
 *   that is the one thing about this file the C++ migration changed. See the
 *   note on `M9_C4_P3_LARGE_CASE` for what it used to be, why it stopped
 *   working, and what it does now. Its «Кеңес» about a helper function stays as
 *   guidance, because the helper is still not something a checker can see; what
 *   is enforced now is the complexity, not the shape.
 * - **D and E take option 1 as well — the output is impossible without the
 *   method.** E's last hidden case is forty numbers whose answer is `no`, so a
 *   search over subsets cannot short-circuit and has to look at all 2⁴⁰ of them;
 *   D's is a twenty-row field with up to 5 · 3¹⁹ routes through it. Both are
 *   EXPONENTIAL counts, which is why the migration did not touch them: C++ being
 *   a hundred times faster than Python moves an exponential wall by two of its
 *   forty steps and nothing else. Measured under C++17 at -O2: E's table answers
 *   in 0.02 s and the recursive search over subsets does not finish; D's table
 *   answers in 0.02 s and a recursive walk over the routes does not finish.
 *
 * Nowhere below does a prompt say «функция жаз», «return қайтар» or «мына
 * әдісті қолдан» as a rule. C's own `skillRefs` follow from that decision: they
 * name `bsearch.*`, `sort.basic` and `perf.time_estimate` and **not** any
 * `func.*` skill, because a judge that sees one number cannot produce evidence
 * about whether a function was defined. B follows the same rule from the other
 * side: it declares no `sort.basic`, because sorting is one of the two ways to
 * answer it and half of the correct submissions never sort at all.
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
 */

/**
 * The seed for `m9.c4.p3`'s largest case, and why that problem was re-authored.
 *
 * ## What it used to be, and why it stopped working
 *
 * C stated n, q ≤ 100 000 and read both the results and the queries from stdin.
 * It could never test that bound: `EXECUTION_LIMITS.maxStdinBytes` is 16 KiB, so
 * a case tops out around 8 190 numbers, and the most work an O(n·q) solution
 * could be made to do was about 1.7 · 10⁷ comparisons. Under Python that took
 * 2.9 s against a 5 s budget — already too close to call — and under C++ the same
 * scan is roughly two hundred times faster, so the task could no longer
 * distinguish a binary search from a linear count at all. The old file said as
 * much, in a paragraph beginning «What the cases can prove».
 *
 * ## What it is now
 *
 * The results and the queries are generated inside the program from one seed, so
 * `500000 500000 12345` is eighteen bytes of stdin and a million numbers of data.
 * Measured under C++17 at -O2: sorting once and binary-searching each query
 * answers in **0.09 s**; counting each query by a full scan is 2.5 · 10¹¹
 * comparisons and was **still running after twenty seconds**. That is a
 * constraint the other method cannot meet — option 1 of the authoring contract —
 * instead of a bound stated in a prompt and enforced by nothing.
 *
 * ## Two consequences worth stating out loud
 *
 * **The output shape changed, and the `exact` checker went with it.** Printing
 * 500 000 answers would be about 3 MB against `EXECUTION_LIMITS.maxOutputBytes`
 * of 64 KiB, so the problem now asks for the SUM of the q answers — one number.
 * The block used to declare `{ kind: "exact" }` because its prompt promised one
 * answer per line; with a single number `exact` and `token` accept exactly the
 * same outputs, so the declaration is gone rather than left standing as
 * decoration.
 *
 * **The sum is what makes `long long` compulsory.** 500 000 queries answered by
 * up to 500 000 athletes each is 2.5 · 10¹¹, a hundred times past `int`, and no
 * small case reaches it. That is a second lesson the old version could not
 * teach, and it arrives without a word in the statement — the bounds are the
 * warning, which is what m9.l2.b1 spent a page on.
 *
 * The recurrence is `int`-safe on purpose: t stays below 1 000 003 and t · 1103
 * is at most 1.1 · 10⁹, inside `int` by a factor of two. The generator is not
 * the trap.
 *
 * ## Why the queries continue the same sequence
 *
 * `x[j] = t[n + j]` rather than a second seed, and that is what makes the
 * `>=` boundary testable. The recurrence's period is 166 667, so any case with
 * n + q past that wraps and the query values start landing exactly on result
 * values. `1 500000 7` is the cheap witness — it answers 5 with `>=` and 3 with
 * `>` — and `100000 100000 1` and the largest case are the same trap at scale.
 * With two independent seeds an exact hit would essentially never happen and the
 * `>` solution would pass everything.
 */
const M9_C4_P3_LARGE_CASE = "500000 500000 12345";

export const M9_C4: LessonBlock[] = [
  {
    /*
     * A · five minutes. SEPTEMBER's integer division and its rounding-up
     * boundary (m1.l6, `/` and `%`), applied once per element of a vector —
     * OCTOBER's traversal (m2.l5). Nothing else, and nothing later.
     *
     * All values are positive, so `/` truncates the way Python's `//` floored
     * and every expected output is unchanged. The rounding-up idiom
     * `(a + k - 1) / k` is the same in both languages; what is NOT the same is
     * that `a[i] + k - 1` reaches 2 · 10⁹ and overflows an `int`, and that the
     * bus total reaches 10¹². Both are `long long` here and the statement says
     * neither — the bounds are the warning.
     *
     * The whole problem is that the rounding happens PER CLASS. Every wrong
     * program is a program that rounded somewhere else, or not at all:
     *   · one division of the total — «4 5» / «1 1 1 1» answers 1, the truth is
     *     4, and the visible sample already answers 4 instead of 5;
     *   · `a[i] / k`, no rounding up — «1 10» / «1» answers 0 for a class that
     *     plainly needs a bus;
     *   · `a[i] / k + 1`, rounding up unconditionally — «1 10» / «10» answers 2
     *     and «5 3» / «3 3 3 3 3» answers 10, both exactly on the boundary where
     *     the division comes out even;
     *   · a loop that stops one class short, or starts one class late — «2 7» /
     *     «7 1» and «2 7» / «1 7» both answer 1 against a truth of 2. That is
     *     «соңғы элементті өткізіп жіберу», the error October's page names by
     *     hand, and problem A is where it costs the least to meet it.
     *   · an `int` anywhere in the arithmetic — the last two cases, silently.
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
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    long long k;\n" +
      "    cin >> n >> k;\n" +
      "    vector<long long> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    long long buses = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        buses = buses + (a[i] + k - 1) / k;\n" +
      "    }\n" +
      "    cout << buses;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3 10\n15 20 3", expectedOutput: "5" },
      /* Every class is far smaller than one bus: dividing the total gives 1. */
      { input: "4 5\n1 1 1 1", expectedOutput: "4", hidden: true },
      /* Exactly on the boundary — one full bus, not two. */
      { input: "1 10\n10", expectedOutput: "1", hidden: true },
      /* One child still needs a whole bus: plain `/` gives 0. */
      { input: "1 10\n1", expectedOutput: "1", hidden: true },
      /* The class that must not be skipped is last, then first. */
      { input: "2 7\n7 1", expectedOutput: "2", hidden: true },
      { input: "2 7\n1 7", expectedOutput: "2", hidden: true },
      /* Every class divides evenly: unconditional rounding up doubles this. */
      { input: "5 3\n3 3 3 3 3", expectedOutput: "5", hidden: true },
      /* One child per bus. */
      { input: "3 1\n5 1 4", expectedOutput: "10", hidden: true },
      /* The top of both stated ranges, and one either side of it. These are the
         two cases where `a[i] + k - 1` leaves `int`. */
      { input: "1 1000000000\n1000000000", expectedOutput: "1", hidden: true },
      { input: "2 1000000000\n999999999 1", expectedOutput: "2", hidden: true },
      /* A thousand classes of a billion children each, one child per bus: the
         answer is 10¹², which no `int` total can hold. */
      { input: "2 1\n1000000000 1000000000", expectedOutput: "2000000000", hidden: true },
    ],
  },
  {
    /*
     * B · seven minutes, and the one problem here with two correct solutions
     * from two different months. OCTOBER: a second loop inside the first
     * («қарапайым ішкі циклдер», m2.l8) counting how often each value occurs.
     * DECEMBER: `sort(a.begin(), a.end())` first (m4.l7), after which equal
     * values stand next to each other and one pass over the neighbours answers
     * it. n ≤ 1000 is chosen so both finish comfortably; the statement names
     * neither, which is this contest's whole point.
     *
     * The reference below is the December one, written so the first and last
     * elements are handled by the same lines as everything else — that boundary
     * is where the shorter versions of it break. As with C and D, the block
     * declares only what both routes to the answer have in common: `sort.basic`
     * is absent, because half of the correct solutions never sort anything and
     * evidence about ordering would be a claim about them that is not true.
     *
     * Everything is `int`: at most 1000 submissions, so the answer is at most
     * 1000, and the values themselves are only ever compared, never added.
     *
     * The degenerate programs:
     *   · counting the DISTINCT problem numbers instead of the ones solved once
     *     — the visible sample answers 3 where the truth is 1, and «3» /
     *     «1 1 5» answers 2 against 1;
     *   · the inner loop written from i + 1, so a number is "alone" whenever
     *     nothing after it matches — the sample answers 3, and «3» / «1 2 1»
     *     answers 2 against 1;
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
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    sort(a.begin(), a.end());\n" +
      "    int alone = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int left = 0;\n" +
      "        if (i > 0 && a[i - 1] == a[i]) left = 1;\n" +
      "        int right = 0;\n" +
      "        if (i < n - 1 && a[i + 1] == a[i]) right = 1;\n" +
      "        if (left == 0 && right == 0) alone = alone + 1;\n" +
      "    }\n" +
      "    cout << alone;\n" +
      "    return 0;\n" +
      "}",
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
     * once. DECEMBER to put the results in order (m4.l3, `sort`), JANUARY to
     * find the boundary inside them (m5.l2, «екіге бөліп іздеу» over a sorted
     * list), and NOVEMBER to write the search once and call it q times (m3.l3,
     * m3.l5). The results are deliberately generated in a scrambled order: the
     * ordering step is part of the problem, not part of the input format.
     *
     * THE PROBLEM THAT WAS RE-AUTHORED, and the whole story is on
     * `M9_C4_P3_LARGE_CASE` — what it used to be, why 16 KiB of stdin could
     * never enforce its bound, why C++ made that strictly worse, and what
     * generating the data from a seed buys. The question is unchanged: for each
     * of q thresholds, how many results reach it. What changed is that the data
     * is computed instead of listed, and that the output is the SUM of the q
     * answers rather than q lines — 500 000 lines would be 3 MB against a 64 KiB
     * output ceiling.
     *
     * THE STRUCTURAL REQUIREMENT. The helper is stated as ADVICE — «кеңес қана»
     * / «это только совет» — because a checker still cannot see a function.
     * What IS enforced now is the complexity, by the last hidden case, and that
     * is option 1 of the contract rather than the option 2 this block used to
     * take.
     *
     * `long long` is compulsory for the answer and nothing says so: 500 000
     * queries of up to 500 000 athletes is 2.5 · 10¹¹.
     *
     * The tournament also has a sorted list with a boundary in it — its B takes
     * the k-th best score and asks who advances, its C searches over the answer
     * — and neither is this problem: one threshold the input names is not q
     * thresholds the learner has to find, and neither of them is a search over a
     * list. Rehearsing the idea while leaving the tournament's questions unseen
     * is the point of a rehearsal.
     *
     * The degenerate programs:
     *   · counting each query with a full scan — correct, and the last hidden
     *     case does not finish;
     *   · searching without sorting first — «5 3 0» answers 4 instead of 7,
     *     because the generated results are not in order;
     *   · `>` where the statement says «кем емес» — «1 500000 7» answers 3
     *     instead of 5, and the two large cases differ as well: the recurrence
     *     repeats after 166 667 terms, so once n + q passes that, query values
     *     land exactly on result values;
     *   · an `int` total — the last hidden case, silently;
     *   · a generator that advances t BEFORE storing t[0] — every case,
     *     starting with the sample, which is why the sample prints its numbers.
     */
    id: "m9.c4.p3",
    type: "challenge",
    skillRefs: ["bsearch.core", "bsearch.boundary", "sort.basic", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "**C. Норманы орындағандар.** Жарысқа n спортшы қатысты, i-спортшы r[i] ұпай жинады. Нәтижелер реттелмеген.\n\nЖаттықтырушы q сұрақ қояды. j-сұрақта x[j] саны беріледі: ұпайы x[j]-ден кем емес, яғни оған тең немесе одан үлкен спортшылар нешеу?\n\n**Кіріс.** Бір жолда бос орынмен бөлінген үш бүтін сан: n, q және s (1 ≤ n ≤ 500000, 1 ≤ q ≤ 500000, 0 ≤ s ≤ 1000002).\n\nНәтижелер де, сұрақтар да тізім түрінде берілмейді — оларды бағдарламаның өзі есептейді. Бір миллион санды шартқа жазып қою мүмкін емес.\n\nt[0] = s, ал i ≥ 1 үшін t[i] = (t[i−1] · 1103 + 12345) mod 1000003.\ni-спортшының ұпайы r[i] = t[i], мұндағы i = 0 … n−1.\nj-сұрақтың мәні x[j] = t[n + j], мұндағы j = 0 … q−1.\n\n**Шығыс.** Бір бүтін сан — q сұрақтың жауаптарының ҚОСЫНДЫСЫ. Әр жауапты бөлек шығарудың қажеті жоқ.\n\n**Мысал.** n = 5, q = 3, s = 0 болғанда:\n\n```\nt = 0 12345 628841 621889 953857 113460 158350 671873\nұпайлар:  0 12345 628841 621889 953857\nсұрақтар: 113460 158350 671873\nжауаптар: 3 3 1\n```\n\nЖауап: `7` — бұл 3 + 3 + 1.\n\nn мен q екеуі де жарты миллионға жетеді, сондықтан әр сұраққа бүкіл тізімді қарап шығуға уақыт жетпейді: ол 2,5 · 10¹¹ қадам болар еді, ал C++ бір секундта шамамен 100 000 000 қадам жасайды.\n\nКеңес: бір x үшін жауап беретін көмекші функция жазып, оны әр сұраққа шақырған ыңғайлы. Бұл — кеңес қана, талап емес: тексеру жүйесі тек шыққан санды салыстырады.",
      ru: "**C. Выполнившие норматив.** В соревновании участвовали n спортсменов, i-й набрал r[i] очков. Результаты не отсортированы.\n\nТренер задаёт q вопросов. В j-м вопросе дано число x[j]: сколько спортсменов набрали не меньше x[j] очков, то есть ровно столько же или больше?\n\n**Вход.** В одной строке через пробел даны три целых числа: n, q и s (1 ≤ n ≤ 500000, 1 ≤ q ≤ 500000, 0 ≤ s ≤ 1000002).\n\nНи результаты, ни вопросы списком не даются — их вычисляет сама программа. Миллион чисел в условие не впишешь.\n\nt[0] = s, а при i ≥ 1 t[i] = (t[i−1] · 1103 + 12345) mod 1000003.\nОчки i-го спортсмена r[i] = t[i], где i = 0 … n−1.\nЗначение j-го вопроса x[j] = t[n + j], где j = 0 … q−1.\n\n**Выход.** Одно целое число — СУММА ответов на все q вопросов. Выводить ответы по отдельности не нужно.\n\n**Пример.** При n = 5, q = 3, s = 0:\n\n```\nt = 0 12345 628841 621889 953857 113460 158350 671873\nочки:    0 12345 628841 621889 953857\nвопросы: 113460 158350 671873\nответы:  3 3 1\n```\n\nОтвет: `7` — это 3 + 3 + 1.\n\nИ n, и q доходят до полумиллиона, поэтому просматривать весь список на каждый вопрос времени не хватит: это было бы 2,5 · 10¹¹ шагов, а C++ успевает около 100 000 000 шагов в секунду.\n\nСовет: удобно написать вспомогательную функцию, которая отвечает на один вопрос, и вызывать её для каждого x. Это только совет, а не требование: проверяющая система сравнивает только выведенное число.",
    },
    referenceSolution:
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long count_at_least(vector<long long> &a, long long x) {\n" +
      "    long long lo = 0;\n" +
      "    long long hi = a.size();\n" +
      "    while (lo < hi) {\n" +
      "        long long mid = (lo + hi) / 2;\n" +
      "        if (a[mid] >= x) hi = mid;\n" +
      "        else lo = mid + 1;\n" +
      "    }\n" +
      "    return (long long)a.size() - lo;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    long long n, q, s;\n" +
      "    cin >> n >> q >> s;\n" +
      "    vector<long long> t(n + q);\n" +
      "    long long cur = s;\n" +
      "    for (long long i = 0; i < n + q; i++) {\n" +
      "        t[i] = cur;\n" +
      "        cur = (cur * 1103 + 12345) % 1000003;\n" +
      "    }\n" +
      "    vector<long long> r(t.begin(), t.begin() + n);\n" +
      "    sort(r.begin(), r.end());\n" +
      "    long long total = 0;\n" +
      "    for (long long j = 0; j < q; j++) {\n" +
      "        total = total + count_at_least(r, t[n + j]);\n" +
      "    }\n" +
      "    cout << total;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 3 0", expectedOutput: "7" },
      { input: "10 10 42", expectedOutput: "49" },
      /* The smallest legal input, twice: once where the single result clears the
         single query and once where it does not. */
      { input: "1 1 896", expectedOutput: "1", hidden: true },
      { input: "1 1 0", expectedOutput: "0", hidden: true },
      /* Fewer results than questions, and the reverse. */
      { input: "3 7 5", expectedOutput: "7", hidden: true },
      { input: "500000 1 7", expectedOutput: "163145", hidden: true },
      /* One result and half a million questions: the sequence wraps past its own
         period, so query values land exactly on the result. `>` answers 3. */
      { input: "1 500000 7", expectedOutput: "5", hidden: true },
      /* A hundred thousand of each: the answer passes 2³¹ already, and the wrap
         makes exact hits common. */
      { input: "100000 100000 1", expectedOutput: "4984477364", hidden: true },
      /* The stated bound, enforced. See M9_C4_P3_LARGE_CASE: sort plus binary
         search answers in 0.09 s and a scan per query does not finish. */
      { input: M9_C4_P3_LARGE_CASE, expectedOutput: "125001184686", hidden: true },
    ],
  },
  {
    /*
     * D · ten minutes. APRIL: «қадамдап толтырылатын кесте» over a grid of
     * costs, filled one row at a time, where the entry for a cell is the
     * cheapest way of ARRIVING at it — «алдыңғы жауаптар арқылы шешу» with the
     * previous answers being the row above. Only the previous row is ever
     * needed, so the reference keeps two vectors rather than a full table; that
     * is a choice, not a requirement, and a learner who builds the whole table
     * gets the same number.
     *
     * WHY THIS IS A TABLE AND NOT A MAP. March is contested three times already
     * — twice in `m9.c2` and once in the tournament itself, whose D is «Ең үлкен
     * көл». A rehearsal that hands the learner the tournament's own problem is
     * not a rehearsal, so the grid here is a field of numbers to fill in rather
     * than a map to walk, and no wave appears in this contest at all.
     *
     * The bound n, m ≤ 200 is what rules out walking every route, and unlike
     * C's old version a case can prove it without any help from the input size:
     * the 20 × 5 field below holds up to 5 · 3¹⁹ routes, an EXPONENTIAL count,
     * and every one of them has to be walked before the cheapest is known.
     * Measured under C++17 at -O2 — the table answers in 0.02 s and a recursive
     * enumeration of the routes does not finish. That is why this block needed
     * nothing from the migration: a hundredfold constant factor does not touch
     * 3¹⁹.
     *
     * Costs of at most 1000 over at most 200 rows is 200 000, so `int` is right
     * throughout and no `long long` appears.
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
     *   · `prev[j - 1]` written without the `j > 0` guard. In Python that did
     *     not crash — index −1 read the LAST column of the row above — so the
     *     defect had one predictable wrong answer. In C++ it is undefined
     *     behaviour: the program reads memory that is not the row, and may stop
     *     with nothing readable attached or print anything at all. «4 3» /
     *     «1 1 4 / 7 1 0 / 4 9 7 / 4 6 5» is the case built for it; the truth is
     *     10 and no outcome of the unguarded version is reliably 10;
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
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, m;\n" +
      "    cin >> n >> m;\n" +
      "    vector<vector<int>> a(n, vector<int>(m, 0));\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < m; j++) cin >> a[i][j];\n" +
      "    }\n" +
      "    vector<int> prev(m, 0);\n" +
      "    for (int j = 0; j < m; j++) prev[j] = a[0][j];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        vector<int> cur(m, 0);\n" +
      "        for (int j = 0; j < m; j++) {\n" +
      "            int best = prev[j];\n" +
      "            if (j > 0 && prev[j - 1] < best) best = prev[j - 1];\n" +
      "            if (j < m - 1 && prev[j + 1] < best) best = prev[j + 1];\n" +
      "            cur[j] = best + a[i][j];\n" +
      "        }\n" +
      "        prev = cur;\n" +
      "    }\n" +
      "    int answer = prev[0];\n" +
      "    for (int j = 0; j < m; j++) {\n" +
      "        if (prev[j] < answer) answer = prev[j];\n" +
      "    }\n" +
      "    cout << answer;\n" +
      "    return 0;\n" +
      "}",
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
      /* An unguarded prev[j - 1] reads outside the row here. */
      { input: "4 3\n1 1 4\n7 1 0\n4 9 7\n4 6 5", expectedOutput: "10", hidden: true },
      /* One row: the answer is the cheapest cell in it, with no step at all. */
      { input: "1 4\n7 2 9 5", expectedOutput: "2", hidden: true },
      /* One column: there is nothing to choose, so every cell is paid for. */
      { input: "4 1\n3\n1\n4\n1", expectedOutput: "9", hidden: true },
      /* The smallest field there is, and a field where every road is free. */
      { input: "1 1\n0", expectedOutput: "0", hidden: true },
      { input: "3 3\n0 0 0\n0 0 0\n0 0 0", expectedOutput: "0", hidden: true },
      /* Twenty rows of five: 5 · 3¹⁹ routes. Filling the table takes 0.02 s;
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
     * at all 2⁴⁰ of them. Measured under C++17 at -O2: the table answers in
     * 0.02 s; the plain recursive search does not finish, and neither does the
     * same search pruned at `2 * s > total`. This is option 1 of the authoring
     * contract — the output is impossible without the method — and it survived
     * the migration untouched because 2⁴⁰ is exponential and a faster language
     * buys about six of its forty doublings.
     *
     * At most 100 students of at most 100 points is a total of 10 000 and a half
     * of 5 000, so the table is 5 001 entries of `int` and nothing here can
     * leave it.
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
      "#include <bits/stdc++.h>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int total = 0;\n" +
      "    for (int i = 0; i < n; i++) total = total + a[i];\n" +
      "    if (total % 2 == 1) {\n" +
      '        cout << "no";\n' +
      "        return 0;\n" +
      "    }\n" +
      "    int half = total / 2;\n" +
      "    vector<int> can(half + 1, 0);\n" +
      "    can[0] = 1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        vector<int> nxt(half + 1, 0);\n" +
      "        for (int s = 0; s <= half; s++) {\n" +
      "            if (can[s] == 1) {\n" +
      "                nxt[s] = 1;\n" +
      "                if (s + a[i] <= half) nxt[s + a[i]] = 1;\n" +
      "            }\n" +
      "        }\n" +
      "        can = nxt;\n" +
      "    }\n" +
      '    if (can[half] == 1) cout << "yes";\n' +
      '    else cout << "no";\n' +
      "    return 0;\n" +
      "}",
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
