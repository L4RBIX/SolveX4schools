import type { LessonBlock } from "../../types";

/**
 * m6.l7 · «Өз бетіңмен шығар» / «Реши сам» — February's independent practice.
 *
 * Ten `write_code` blocks, no starter, no scaffold, nothing on the screen but a
 * statement. This is where February pays into the year's «шамамен 100 толық
 * дербес шешім» (p.11) and where the month's own «Айлық сынақ» sentence —
 * «Тоқтау шарты дұрыс қойылған, өзін-өзі шақыратын функция жазу» (p.9) — is
 * rehearsed before it is graded.
 *
 * ## The clauses of the programme that drive this bank
 *
 * 1. «Нұсқалар аз болғанда барлық мүмкін нұсқаны жүйелі түрде тексеру» — so
 *    p1 and p2 are enumeration, and both prompts count the variants BEFORE the
 *    code, against the ~10⁸ steps per second the year has used since December.
 *    «Жүйелі түрде» is the `i < j` (and `i < j < k`) convention the month
 *    established, and in p2 that convention is the answer rather than a
 *    tidiness rule: the third number must be the one standing LAST.
 * 2. «Функция дәл сондай, бірақ кішірек есепті шешу үшін өзін-өзі шақыратын
 *    тәсіл» — p3 through p10 are all recursion, and every one of them states
 *    what the smaller problem is.
 * 3. The practice families, verbatim: «белгілі қасиеті бар барлық жұп пен
 *    үштікті табу» (p1, p2), «факториал мен дәрежені өзін-өзі шақыру арқылы
 *    есептеу» (p3, p7), «сөз симметриясын осы тәсілмен тексеру» (p5), «0 мен
 *    1-ден тұратын барлық шағын тізбектерді шығару» (p9), «шағын тордағы
 *    жолдар санын есептеу» (p8), «Мықты оқушыларға — шахмат тақтасына
 *    уәзірлерді орналастыру есебі» (p10, advanced only).
 * 4. **The scope limit.** «Күрделі кері қайту тәсілі биыл бүкіл топқа нөлден
 *    жаздырылмайды.» Nothing in p1–p8 is a search with an undo step: they are
 *    an enumeration, or a recursion that returns one number. Only p9 and p10
 *    build variants, and they are the two blocks the whole group does not get —
 *    p9 goes to core and advanced, p10 to advanced alone, which is where the
 *    programme puts the chess-placement family by name.
 *
 * ## WHAT THE C++ MIGRATION CHANGED, TASK BY TASK
 *
 * Three of the ten needed more than a rewrite of their code.
 *
 * **p7 was re-authored, not translated, and it is the only one in the month.**
 * Its Python form asked for aⁿ with a ≤ 9 and n ≤ 5000, and it rested on two
 * facts about Python that are both false here. The first is unbounded
 * integers: one hidden case stored 2¹²⁰⁰ as a 362-digit decimal, and no type
 * this course teaches can hold it — `long long` stops near 9 · 10¹⁸. The
 * second is the recursion limit: the task's whole difficulty was that a
 * one-at-a-time recursion hits CPython's ~1000-frame ceiling at n = 5000, and
 * C++ has no ceiling to hit — 5000 frames is nothing, so the halving would
 * have become an unmotivated flourish.
 *
 * So p7 now asks for **aⁿ modulo 1 000 000 007**, with 0 ≤ a ≤ 1000 and
 * 0 ≤ n ≤ 1 000 000 000. Everything the original taught survives and is now
 * enforced rather than described:
 *   · the answer stays a single integer that fits, because every step is taken
 *     modulo a number smaller than 2³⁰ — `%` is September's operator and
 *     `long long` is September's type, and the prompt says why both are needed
 *     (the product of two values below 10⁹ reaches 10¹⁸);
 *   · halving is no longer a suggestion. A recursion that steps down by one is
 *     a billion frames deep, and a billion frames is not a slow program, it is
 *     a dead one — with no message, because C++ raises nothing. Two hidden
 *     cases at n = 10⁹ make that a verdict;
 *   · the ban on a ready-made shortcut is re-aimed. `**` does not exist in
 *     C++, so forbidding it would be noise; `pow()` from `<cmath>` does exist,
 *     works in `double`, and cannot represent these answers exactly. The
 *     prompt warns about the trap that is real instead of the one that is not.
 *
 * **p3 kept its bounds by widening its type.** 1 ≤ a, b ≤ 15 means the answer
 * reaches 15! = 1 307 674 368 000, which overflows `int` at 13!. The task is
 * unchanged; the reference solution computes in `long long`, the prompt says
 * so, and a hidden `1 15` case pins the largest answer so the type is tested
 * rather than assumed.
 *
 * **p1 and p2 needed only re-checking, and both passed.** At n = 1000 the pair
 * count is 499 500 and at n = 100 the triple count is 161 700, both far inside
 * the ~10⁸ budget the year measures against — that budget was already the C++
 * one, so no bound moved. Their values are small integers throughout.
 *
 * Everything else is arithmetic that did not change: p4 at 10⁹ fits `int` and
 * recurses ten deep; p5's word is at most 40 letters, so 20 frames; p6's
 * C(20, 10) = 184 756 with about 370 000 calls; p8's grid is at most 8 × 8;
 * p9 prints at most C(12, 6) = 924 lines; p10's board is at most 6 × 6.
 *
 * ## Input format
 *
 * Every list-shaped input states its size first. Python's
 * `list(map(int, input().split()))` consumed a LINE, so a program could read
 * "some numbers, then one more number" with no count; `cin >>` reads tokens and
 * cannot see where a line ends. p1 and p2 already had their `n`, p8 has `r` and
 * `c`, and nothing else in this bank reads a list — so no case data moved.
 *
 * ## Not a rerun of the lessons — the rule this bank was authored under
 *
 * Six lessons of February are already written, and the naive reading of the
 * practice families would have produced ten blocks that already exist:
 * `m6.l3.b8` IS the factorial, `m6.l3.b9` IS aⁿ, `m6.l4.b8` IS the symmetry
 * check, `m6.l4.b9` IS the digit sum, `m6.l6.b7` IS printing every 0/1
 * sequence, `m6.l6.b8` IS the grid path count, `m6.l6.b10` IS the queens
 * count, and `m6.l1.b8`/`m6.l1.b9`/`m6.l2.b8` are the pair and triple counts.
 * A practice bank that reissued those is transcription with a longer wait.
 *
 * So every block below keeps its family and moves one joint:
 *
 * | # | family | the joint that moved |
 * |---|---|---|
 * | p1 | pairs with a property | the property is a two-sided distance, so the boundary `≤ d` is the work, not the loop bounds |
 * | p2 | triples with a property | the property depends on WHICH of the three stands last, so `i < j < k` decides the answer |
 * | p3 | factorial by recursion | the product runs from `a` to `b`, so the base case is `a > b` and the empty product is 1 |
 * | p4 | recursion over digits | the value carried back is a maximum, not a sum |
 * | p5 | word symmetry by recursion | the answer is how far the word is from symmetric, so an endpoint-only shortcut is visibly wrong |
 * | p6 | recursion | two arguments shrink at once, and two different base cases both answer 1 |
 * | p7 | power by recursion | the exponent is halved, because at n ≤ 10⁹ the one-at-a-time recursion genuinely dies |
 * | p8 | paths in a small grid | cells are blocked, including possibly the first or the last |
 * | p9 | all 0/1 sequences | exactly k ones, so the generator carries a second parameter and prunes |
 * | p10 | chess placement | rooks, and k of them on an n × n board, so whole rows stay empty |
 *
 * Every program in this file was compared against every program in
 * `m06/l1.ts` … `m06/l6.ts` and against every other program here. No two are
 * the same.
 *
 * ## Requirements a checker cannot see — which of the three options, and why
 *
 * The brief for this bank is ten `write_code` blocks, so option 3 (send it to a
 * human via a paired `explain`) is not available here; the structural half of
 * «өзін-өзі шақыратын функция жазу» is carried by the lessons' explain blocks
 * and by the monthly check, where a teacher reads the program.
 *
 * - **Option 2, stated out loud, for "solve it recursively".** Output
 *   comparison cannot see a function definition, and a `while` loop answers p3,
 *   p4, p5 and p6 correctly. So each of those prompts says the recursion is a
 *   кеңес / совет — advice — and that the checker compares the printed number.
 *   The same sentence `m6.l3.b8` and `m6.l4.b9` already use. A fourteen-year-old
 *   is never told a rule was checked when it was not.
 * - **Option 1 where it genuinely bites, and only there.** Three places:
 *     · p2 — enumerating unordered or doubled triples changes the number, and
 *       the hidden case `8 4 4` (answer 0) fails any solution that asks "is one
 *       of the three the sum of the other two";
 *     · p7 — n runs to 10⁹, and a recursion that steps down by one exhausts the
 *       call stack long before it exhausts the clock. The prompt states this as
 *       a fact about C++ — no error, no message, just a program that stops —
 *       and two hidden cases enforce it;
 *     · p9 — the layout IS the answer (one sequence per line, ascending), so
 *       the block declares `checker: { kind: "exact" }` rather than promising a
 *       format that `token` would quietly ignore.
 * - **`pow()` in p7.** Warned against in the prompt, unenforceable by any
 *   checker, and the prompt says so in that word. See the block comment.
 *
 * ## Output
 *
 * Nine tasks print a single integer; p9 prints lines of `0` and `1`. No program
 * in this file prints a Kazakh or Russian word, so a learner reading either
 * language reasons about the same thing instead of matching glyphs.
 *
 * ## C++
 *
 * February introduces no construct of its own. Everything here is October's
 * loops and `vector`, November's functions and pass-by-reference, September's
 * `%`, `/` and `long long`, plus `max` from `<algorithm>`, `abs` from
 * `<cstdlib>`, and the `string` operations `m6.l4` introduced. Nothing else is
 * included: `<cmath>`'s `pow` is exactly the escape hatch p7 exists to close.
 *
 * ## Tracks
 *
 * p1–p8 go to every route, support included. Support's «нөлден жазу азырақ» is
 * carried by the month's lessons, every one of which substitutes a scaffolded
 * twin at an `s` id; a support learner who never wrote anything alone was never
 * asked to. p9 is core and advanced, p10 advanced only.
 *
 * ## No diagnostic mappings
 *
 * A `write_code` answer is a program, not one of a fixed set of strings, so
 * there is no wrong answer a mapping could name. The failure classes each task
 * is built to expose are named in the block comments instead, next to the case
 * that kills each one — where a reviewer can check the claim by running it.
 */
export const M6_PRACTICE: LessonBlock[] = [
  {
    /*
     * Rung 1. PDF p.9 family «белгілі қасиеті бар барлық жұпты табу».
     *
     * The month's pair tasks so far ask for a sum (`m6.l1.b5`, `m6.l1.b6`,
     * `m6.l2.b6`) or for an order (`m6.l1.b8`). This one asks for a DISTANCE,
     * which puts the whole difficulty on a boundary the prompt states in words:
     * «айырмасы дәл d-ға тең жұп та саналады». That is the `<` / `<=` decision
     * `debug.boundary` has been about since September, met here inside a
     * February enumeration.
     *
     * `abs` on `int` lives in `<cstdlib>` and the prompt names the header,
     * because a beginner who reaches for `<cmath>` instead gets the `double`
     * overload and a question about types they were not asked.
     *
     * Wrong solutions and the case that kills each:
     *   - inner loop from 0 (every pair twice, plus each element with itself)
     *       → "4 / 1 1 1 1 / 0": 16 vs 6, and the visible case: 13 vs 4;
     *   - `<` instead of `<=`, the boundary the prompt names
     *       → "2 / 3 8 / 5": 0 vs 1;
     *   - a one-sided difference `a[j] - a[i] <= d`, i.e. forgetting the
     *     absolute value on an unsorted list
     *       → visible case: 6 vs 4;
     *   - comparing neighbours only, `a[i]` against `a[i + 1]`
     *       → visible case: 2 vs 4;
     *   - no pair qualifying at all → "3 / 1 100 200 / 1": 0;
     *   - every pair qualifying → "4 / 1 1 1 1 / 0": 6 = 4 · 3 / 2, which is
     *     the formula from `m6.l1.b1` checked against a real answer.
     * Negative temperatures appear in a hidden case because "the difference is
     * the bigger minus the smaller" stops being obvious the moment one of them
     * is below zero.
     *
     * Arithmetic re-checked for C++ and unmoved: at n = 1000 there are 499 500
     * pairs, far inside the ~10⁸ budget, and every value fits an `int`.
     */
    id: "m6.p1",
    type: "write_code",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index", "compare.operators", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "n күндегі ауа температурасы берілген. Бірінші жолда n саны (2 ≤ n ≤ 1000), екінші жолда бос орынмен бөлінген n бүтін сан — әр күннің температурасы (әрқайсысы −50 мен 50 аралығында), үшінші жолда d саны (0 ≤ d ≤ 100). " +
        "Температуралары бір-бірінен d-дан артық ерекшеленбейтін күн жұптары нешеу? Басқаша айтқанда, i < j және |a[i] − a[j]| ≤ d болатын (i, j) жұптарының санын тап. Айырмасы дәл d-ға тең жұп та саналады. Тек сол бір санды шығар. " +
        "Мысалы n = 5, температуралары 10 14 12 20 11, ал d = 2 болса, жауап 4. " +
        "Кодқа отырмас бұрын санап ал: n ең үлкені 1000 болғанда жұптар саны 1000 · 999 / 2 ≈ 500 000, ал бұл бір секундтық 100 000 000 қадамға еркін сыяды — сондықтан барлық жұпты бір-бірлеп қарап шығу мұнда әбден жарамды тәсіл. Барлық сан `int`-ке сыяды. " +
        "Кеңес: бүтін санның модулін `abs` береді, ол `<cstdlib>` тақырыбында тұр.",
      ru:
        "Даны температуры воздуха за n дней. В первой строке число n (2 ≤ n ≤ 1000), во второй — n целых чисел через пробел, температура каждого дня (каждая от −50 до 50), в третьей — число d (0 ≤ d ≤ 100). " +
        "Сколько есть пар дней, температуры которых отличаются не больше чем на d? Другими словами, найди количество пар (i, j) с условием i < j и |a[i] − a[j]| ≤ d. Пара, у которой разность ровно d, тоже считается. Выведи только это одно число. " +
        "Например, при n = 5, температурах 10 14 12 20 11 и d = 2 ответ равен 4. " +
        "Прежде чем садиться за код, посчитай: при n = 1000 пар получается 1000 · 999 / 2 ≈ 500 000, а это свободно укладывается в 100 000 000 шагов за секунду — значит, просмотреть все пары по одной здесь вполне уместно. Все числа помещаются в `int`. " +
        "Подсказка: модуль целого числа даёт `abs`, он находится в заголовке `<cstdlib>`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <cstdlib>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int d;\n" +
      "    cin >> d;\n" +
      "    int close = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            if (abs(a[i] - a[j]) <= d) close = close + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << close;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible. Kills the doubled enumeration (13), the one-sided difference
         (6) and the neighbours-only walk (2) at once, with the sample in front
         of the learner. */
      { input: "5\n10 14 12 20 11\n2", expectedOutput: "4" },
      /* d = 0 and two equal values: the smallest list that has an answer, and
         the doubled enumeration answers 4 here. */
      { input: "2\n5 5\n0", expectedOutput: "1", hidden: true },
      /* Every pair qualifies: 4 · 3 / 2 = 6. The inner loop from 0 gives 16. */
      { input: "4\n1 1 1 1\n0", expectedOutput: "6", hidden: true },
      /* No pair qualifies, so a program that counts something unconditionally
         cannot hide behind a plausible-looking number. */
      { input: "3\n1 100 200\n1", expectedOutput: "0", hidden: true },
      /* Exactly on the boundary: `<` answers 0. */
      { input: "2\n3 8\n5", expectedOutput: "1", hidden: true },
      /* One step past the boundary: `<=` written as `< d + 1` is fine, but
         `<= d + 1` answers 1. */
      { input: "2\n3 9\n5", expectedOutput: "0", hidden: true },
      /* Negatives on both sides of zero. */
      { input: "4\n-5 -3 0 4\n3", expectedOutput: "2", hidden: true },
      /* Repeated values plus a spread tail: the qualifying pairs are not a
         prefix of the list, so a walk that stops early is wrong. */
      { input: "6\n7 7 7 9 11 13\n2", expectedOutput: "8", hidden: true },
    ],
  },
  {
    /*
     * Rung 2. PDF p.9 family «белгілі қасиеті бар барлық үштікті табу».
     *
     * `m6.l1.b9` and `m6.l2.b8` both count triples by their SUM, a property
     * that does not care which index is which — so for those two the `i < j < k`
     * convention is only about not counting the same triple six times. Here the
     * property names a position: the number that must equal the sum is the one
     * standing LAST. That makes the ordering the answer, which is option 1 of
     * the authoring contract's three, and it is why this prompt says nothing
     * about how many `for` lines a solution should have.
     *
     * Wrong solutions and the case that kills each:
     *   - all three loops from 0 → "4 / 0 0 0 0": 64 vs 4, visible case 7 vs 3;
     *   - the order-blind reading, `a[i] + a[j] == a[k] || a[i] + a[k] == a[j]
     *     || a[j] + a[k] == a[i]` → "3 / 8 4 4": 1 vs 0. This is the whole
     *     point of the task and the reason `8 4 4` and `4 4 8` are both cases;
     *   - `k` starting at `i + 1` instead of `j + 1` (triples counted twice and
     *     j = k allowed) → visible case and "6 / 1 1 2 2 3 4" both change;
     *   - no triple qualifying → "3 / 1 1 5": 0;
     *   - every triple qualifying → "4 / 0 0 0 0": 4 = 4 · 3 · 2 / 6, the
     *     formula from `m6.l1.b1` against a real answer;
     *   - duplicates that must each be counted separately → "6 / 1 1 2 2 3 4":
     *     9, where several different index triples carry the same three values.
     *
     * Arithmetic re-checked for C++ and unmoved: 161 700 triples at n = 100,
     * and |a[i]| ≤ 1000 so every sum fits an `int`.
     */
    id: "m6.p2",
    type: "write_code",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бірінші жолда n саны беріледі (3 ≤ n ≤ 100), екінші жолда бос орынмен бөлінген n бүтін сан (әрқайсысы −1000 мен 1000 аралығында). " +
        "Тізімде орындары бойынша i < j < k болатын және a[i] + a[j] дәл a[k]-ға тең болатын (i, j, k) үштіктері нешеу? Тек сол бір санды шығар. " +
        "Рет маңызды: қосылатын екі сан — алдыңғы екеуі, ал қосындыға тең болуы тиіс сан — үшеуінің ішінде тізімде ЕҢ СОҢЫНДА тұрғаны. Мысалы 8 4 4 тізбегінде мұндай үштік жоқ (8 + 4 = 12, ал соңғы сан 4), ал 4 4 8 тізбегінде дәл біреу бар. " +
        "Тағы бір мысал: n = 5 және сандар 1 2 3 5 8 болса, жауап 3 — олар 1 + 2 = 3, 2 + 3 = 5 және 3 + 5 = 8. " +
        "Кодқа отырмас бұрын санап ал: n ең үлкені 100 болғанда үштіктер саны 100 · 99 · 98 / 6 = 161 700, ал бұл секундтық 100 000 000 қадамнан әлдеқайда аз — сондықтан бәрін бір-бірлеп қарап шығуға болады. Барлық сан `int`-ке сыяды.",
      ru:
        "В первой строке дано число n (3 ≤ n ≤ 100), во второй — n целых чисел через пробел (каждое от −1000 до 1000). " +
        "Сколько есть троек (i, j, k), у которых позиции идут в порядке i < j < k и при этом a[i] + a[j] в точности равно a[k]? Выведи только это одно число. " +
        "Порядок важен: складываются два первых числа тройки, а равняться сумме должно то из трёх, которое стоит в списке ПОСЛЕДНИМ. Например, в последовательности 8 4 4 такой тройки нет (8 + 4 = 12, а последнее число 4), а в последовательности 4 4 8 она ровно одна. " +
        "Ещё пример: при n = 5 и числах 1 2 3 5 8 ответ равен 3 — это 1 + 2 = 3, 2 + 3 = 5 и 3 + 5 = 8. " +
        "Прежде чем садиться за код, посчитай: при n = 100 троек будет 100 · 99 · 98 / 6 = 161 700, а это намного меньше 100 000 000 шагов в секунду — значит, перебрать их все по одной можно. Все числа помещаются в `int`.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int triples = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            for (int k = j + 1; k < n; k++) {\n" +
      "                if (a[i] + a[j] == a[k]) triples = triples + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << triples;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible. The doubled enumeration answers 7 here. */
      { input: "5\n1 2 3 5 8", expectedOutput: "3" },
      /* Every triple qualifies: 4 · 3 · 2 / 6 = 4. Loops from 0 answer 64. */
      { input: "4\n0 0 0 0", expectedOutput: "4", hidden: true },
      /* Nothing qualifies. */
      { input: "3\n1 1 5", expectedOutput: "0", hidden: true },
      /* The smallest list that does qualify — and its mirror below. */
      { input: "3\n4 4 8", expectedOutput: "1", hidden: true },
      /* The same three values in the wrong order. The order-blind solution
         answers 1; the intended one answers 0. This case is the task. */
      { input: "3\n8 4 4", expectedOutput: "0", hidden: true },
      /* Duplicates: nine index triples over six values. */
      { input: "6\n1 1 2 2 3 4", expectedOutput: "9", hidden: true },
      /* All three negative — the sum is smaller than both addends, which
         breaks any reasoning that assumed a[k] is the largest. */
      { input: "3\n-2 -3 -5", expectedOutput: "1", hidden: true },
      /* Two equal candidates in the last two positions, so the qualifying
         triples end on the LAST element as well as on the one before it: a
         third loop bounded `k < n - 1` answers 1. */
      { input: "4\n2 3 5 5", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * Rung 3, and the first recursion. PDF p.9 family «факториал ... өзін-өзі
     * шақыру арқылы есептеу».
     *
     * `m6.l3.b8` already asks for n! from 1 to n. Repeating it here would be
     * transcription, so the product runs from `a` to `b` — which is the same
     * recursion with the base case moved somewhere the learner has to think
     * about: it is not "n reached 0", it is "there is nothing left to
     * multiply", and that is `a > b`. The `1 12` case is 12! exactly, so the
     * family connection is checked rather than asserted.
     *
     * THE TYPE, NOT THE BOUNDS, IS WHAT C++ CHANGED. The stated range allows
     * 15!, which is 1 307 674 368 000 — `int` overflows at 13!. The task keeps
     * its bounds and computes in `long long`, the prompt says why, and the
     * hidden `1 15` case makes the largest answer a graded fact.
     *
     * Wrong solutions and the case that kills each:
     *   - base `if (a == b) return 1;`, the classic off-by-one
     *       → "5 5": 1 vs 5, and "3 6": 60 vs 360;
     *   - base `if (a == b) return a;`, which is right for a ≤ b and never
     *     fires when the range is empty
     *       → "7 4": the recursion never stops, against 1;
     *   - recursing on `b` and forgetting `a`, i.e. computing b!
     *       → "3 6": 720 vs 360;
     *   - returning 0 for the empty product → "7 4": 0 vs 1;
     *   - computing in `int` → "1 15": a wrapped, negative-looking number.
     * The single-element range "5 5" and the empty range "7 4" sit next to each
     * other on purpose: they are one step apart and they have different answers.
     */
    id: "m6.p3",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "func.define", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: a және b (1 ≤ a ≤ 15, 1 ≤ b ≤ 15). " +
        "a-дан b-ға дейінгі барлық бүтін санның көбейтіндісін шығар: a · (a + 1) · … · b. " +
        "Егер a > b болса, көбейтетін бірде-бір сан жоқ — ондай жағдайда жауап 1 деп есептейміз (бос көбейтінді). " +
        "Мысалы 3 6 үшін жауап 3 · 4 · 5 · 6 = 360, ал 5 5 үшін жауап 5, ал 7 4 үшін жауап 1. Байқа: a = 1 болғанда бұл b! факториалына айналады. " +
        "Түрін мұқият таңда: ең үлкен жауап 15! = 1 307 674 368 000 болады, ал ол `int`-ке сыймайды (`int` 13!-тен бастап-ақ асып кетеді). Сондықтан есептеуді `long long`-пен жүргіз — қыркүйектің 6-сабағындағыдай. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: a-дан b-ға дейінгі көбейтінді — a мен (a + 1)-ден b-ға дейінгі көбейтіндінің көбейтіндісі. Тоқтау шартын бірінші жаз да, ол дәл қай жағдайда орындалатынын мұқият ойлан. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан рекурсия — міндетті ереже емес, кеңес; бірақ ай соңындағы сынақта дәл осы тәсіл сұралады.",
      ru:
        "В одной строке через пробел даны два целых числа: a и b (1 ≤ a ≤ 15, 1 ≤ b ≤ 15). " +
        "Выведи произведение всех целых чисел от a до b: a · (a + 1) · … · b. " +
        "Если a > b, то умножать нечего — в этом случае ответом считается 1 (пустое произведение). " +
        "Например, для 3 6 ответ 3 · 4 · 5 · 6 = 360, для 5 5 ответ 5, а для 7 4 ответ 1. Обрати внимание: при a = 1 это в точности факториал b!. " +
        "Внимательно выбери тип: наибольший ответ — 15! = 1 307 674 368 000, а он в `int` не помещается (`int` переполняется уже на 13!). Поэтому считай в `long long`, как в шестом уроке сентября. " +
        "Реши задачу функцией, которая вызывает саму себя: произведение от a до b — это a, умноженное на произведение от (a + 1) до b. Сначала напиши базовый случай и внимательно продумай, при каком именно условии он срабатывает. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому рекурсия здесь — совет, а не обязательное правило; но на проверке в конце месяца спросят именно этот приём.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long prod(int a, int b) {\n" +
      "    if (a > b) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return a * prod(a + 1, b);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int a, b;\n" +
      "    cin >> a >> b;\n" +
      "    cout << prod(a, b);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible. `if (a == b) return 1;` answers 60 here. */
      { input: "3 6", expectedOutput: "360" },
      /* One number in the range: the base case must NOT have fired yet. */
      { input: "5 5", expectedOutput: "5", hidden: true },
      /* Empty range. A base case written as `a == b` never fires and the
         recursion does not stop. */
      { input: "7 4", expectedOutput: "1", hidden: true },
      /* 12! — the PDF's factorial, reached through this task's door, and the
         largest answer that still fits an `int`. */
      { input: "1 12", expectedOutput: "479001600", hidden: true },
      /* 15! — past `int` by a factor of six hundred. This case is the type. */
      { input: "1 15", expectedOutput: "1307674368000", hidden: true },
      /* Two numbers, the shortest non-trivial recursion. */
      { input: "2 3", expectedOutput: "6", hidden: true },
      /* Single number away from 1, so `prod(1, b)` reasoning does not help. */
      { input: "10 10", expectedOutput: "10", hidden: true },
      /* a = b = 1: the answer is 1 for a reason that is NOT the empty product,
         which is why the case above it exists. */
      { input: "1 1", expectedOutput: "1", hidden: true },
      /* The widest empty range the bounds allow. */
      { input: "15 1", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * Rung 4. Recursion over the digits of a number, which is the month's
     * `n / 10` ladder (`m6.l3.b6`, `m6.l4.b9`) carrying a MAXIMUM back up
     * instead of a sum. That is the difference the block exists for: a sum can
     * be accumulated in any order, a maximum has to be compared against what
     * came back, and the contract names "any maximum" as a shape whose cases
     * must put the answer at the last position and at the first.
     *
     * `product-authored`: the PDF names the factorial, the power, the symmetry
     * check, the sequences, the grid and the queens, and it does not name a
     * digit family. The recursion is February's; this problem is ours.
     *
     * Wrong solutions and the case that kills each:
     *   - returning the last digit only → "9123": 3 vs 9;
     *   - returning the first digit only, i.e. recursing without comparing
     *       → "1239": 1 vs 9;
     *   - a base case one level too early, `if (n < 100) return n % 10;`
     *       → "9123": 3 vs 9, and "10": 0 vs 1;
     *   - comparing against `n / 10` rather than against what the call
     *     returned → "4926": 492 vs 9;
     *   - n = 0, where the base case has to fire immediately → "0": 0.
     * "555" is the all-equal list in disguise: every digit is the maximum, so a
     * solution that tracks "strictly greater" still has to answer 5.
     *
     * Arithmetic: 10⁹ fits an `int` and the recursion is ten deep.
     */
    id: "m6.p4",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "arith.remainder", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Теріс емес бүтін сан n беріледі (0 ≤ n ≤ 1 000 000 000). Оның цифрларының ішіндегі ең үлкенін шығар. " +
        "Мысалы 4926 үшін жауап 9, 1239 үшін де 9, 555 үшін 5, ал 0 үшін 0. Тек сол бір цифрды шығар. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: санның ең үлкен цифры — оның соңғы цифры (`n % 10`) мен қалған бөлігінің (`n / 10`, бүтін бөлу) ең үлкен цифрының үлкені. Екеуінің үлкенін `max` береді, ол `<algorithm>` тақырыбында тұр. Тоқтау шарты — цифры бір ғана қалған сан: ондай санның ең үлкен цифры өзі. " +
        "Абайла: жауап санның басында да, соңында да тұруы мүмкін, сондықтан шақырудан қайтқан мәнді ұмытпай салыстыр. " +
        "Шектеу `int`-ке сыяды, ал тереңдігі он шақырудан аспайды. Тексеруші тек шыққан санды салыстырады, сондықтан рекурсия — міндетті ереже емес, кеңес; бірақ жаттығудың мәні дәл сонда.",
      ru:
        "Дано неотрицательное целое число n (0 ≤ n ≤ 1 000 000 000). Выведи наибольшую из его цифр. " +
        "Например, для 4926 ответ 9, для 1239 тоже 9, для 555 ответ 5, а для 0 ответ 0. Выведи только эту одну цифру. " +
        "Реши задачу функцией, которая вызывает саму себя: наибольшая цифра числа — это большее из двух, из его последней цифры (`n % 10`) и наибольшей цифры оставшейся части (`n / 10`, целочисленное деление). Большее из двух даёт `max`, он находится в заголовке `<algorithm>`. Базовый случай — число, в котором осталась одна цифра: его наибольшая цифра равна ему самому. " +
        "Будь внимателен: ответ может стоять и в начале числа, и в конце, поэтому обязательно сравнивай со значением, которое вернул вызов. " +
        "Ограничение помещается в `int`, а глубина не превышает десяти вызовов. Проверяющая программа сравнивает только выведенное число, поэтому рекурсия здесь — совет, а не обязательное правило; но смысл упражнения именно в ней.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int big(int n) {\n" +
      "    if (n < 10) {\n" +
      "        return n;\n" +
      "    }\n" +
      "    return max(n % 10, big(n / 10));\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    cout << big(x);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible: the maximum is in the middle, so neither one-digit shortcut
         is obviously wrong until the hidden cases below. */
      { input: "4926", expectedOutput: "9" },
      /* Zero: the base case must fire on the first call. */
      { input: "0", expectedOutput: "0", hidden: true },
      /* One digit. */
      { input: "7", expectedOutput: "7", hidden: true },
      /* The maximum is the FIRST digit: kills "return the last digit". */
      { input: "9123", expectedOutput: "9", hidden: true },
      /* The maximum is the LAST digit: kills a recursion that never compares
         what came back — the error the programme names by hand. */
      { input: "1239", expectedOutput: "9", hidden: true },
      /* Every digit equal. */
      { input: "555", expectedOutput: "5", hidden: true },
      /* A trailing zero, and the answer is the leading digit: the base case
         one level too early answers 0. */
      { input: "10", expectedOutput: "1", hidden: true },
      /* Many zeros, one significant digit, at the top end of the range. */
      { input: "1000000000", expectedOutput: "1", hidden: true },
      /* The whole number is nines: the answer at the boundary of the range. */
      { input: "999999999", expectedOutput: "9", hidden: true },
    ],
  },
  {
    /*
     * Rung 5. PDF p.9 family «сөз симметриясын осы тәсілмен тексеру» —
     * checking a word's symmetry by recursion.
     *
     * `m6.l4.b8` already prints yes / no for that. Reissuing it would be the
     * defect the review named first, so this task asks HOW FAR the word is from
     * symmetric: the number of letter pairs that disagree. Same recursion, same
     * shrinking by two, and the answer is 0 exactly when the word is a
     * palindrome — but now every mismatched pair has to be counted, which is
     * what makes the endpoint shortcut visibly wrong instead of silently lucky.
     *
     * Wrong solutions and the case that kills each:
     *   - comparing only the first and last letter — the shortcut that passed
     *     all seven cases of `m2.p6` and `m3.l7.b7`
     *       → the VISIBLE case "abca": 0 vs 1, and "abcdef": 1 vs 3;
     *   - a base case one pair short, `if (s.size() <= 2) return 0;`
     *       → "ab": 0 vs 1, "abab": 1 vs 2;
     *   - counting letters instead of pairs, i.e. answering 2 for one bad pair
     *       → "abca": 2 vs 1;
     *   - a one-letter word, where the base case must fire at once → "a": 0;
     *   - an even-length word with no middle letter → "ab", "zzzz", "abab";
     *   - an odd-length palindrome whose middle letter has no partner
     *       → "rotor": 0, "abcba": 0.
     * "abcda" is the trap in miniature: the endpoints match and the word is
     * still not symmetric.
     *
     * At most 40 letters, so at most 20 nested calls.
     */
    id: "m6.p5",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "strings.sequence", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Кіші латын әріптерінен тұратын бір сөз беріледі: кемінде бір әріп, ең көбі 40 әріп, бос орын жоқ. " +
        "Сөзді симметриялы ету үшін ең аз неше әріпті өзгерту керек? Симметриялы деп солдан оңға да, оңнан солға да бірдей оқылатын сөзді айтамыз. Бір қадамда кез келген бір әріпті кез келген басқа әріпке ауыстыруға болады. Тек сол бір санды шығар. " +
        "Мысалы `abca` сөзінде сәйкес келмейтін бір ғана жұп бар — екінші әріп b мен үшінші әріп c, — сондықтан жауап 1: бір әріпті өзгерту жеткілікті. `abcdef` үшін жауап 3, `rotor` үшін 0, ал `a` үшін 0. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: шеткі екі әріпті салыстыр (`s[0]` мен `s[s.size() - 1]`), олар әртүрлі болса бірді қос, содан кейін дәл сол функцияны сөздің ішкі бөлігі `s.substr(1, s.size() - 2)` үшін қайта шақыр. Әр шақыруда сөз екі әріпке қысқарады, сондықтан тоқтау шарты бір әріпті де, нөл әріпті де қамтуы керек. Тереңдігі 20-дан аспайды. " +
        "Тек шеткі екі әріпті салыстырып қоюдың жеткіліксіз екенін ескер: `abca` сөзінің шеттері бірдей, ал өзі симметриялы емес. Сөзді төңкеріп алатын дайын тәсілдерді іздеме — мұнда есептің мәні рекурсияда. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан бұл кеңес, міндетті ереже емес.",
      ru:
        "Дано одно слово из строчных латинских букв: не меньше одной буквы и не больше сорока, пробелов нет. " +
        "Сколько букв нужно изменить как минимум, чтобы слово стало симметричным? Симметричным называем слово, которое одинаково читается слева направо и справа налево. За один шаг можно заменить любую одну букву на любую другую. Выведи только это одно число. " +
        "Например, в слове `abca` не совпадает ровно одна пара — вторая буква b и третья буква c, — поэтому ответ 1: достаточно изменить одну букву. Для `abcdef` ответ 3, для `rotor` ответ 0, для `a` ответ 0. " +
        "Реши задачу функцией, которая вызывает саму себя: сравни две крайние буквы (`s[0]` и `s[s.size() - 1]`), прибавь единицу, если они разные, и вызови ту же функцию для внутренней части слова `s.substr(1, s.size() - 2)`. При каждом вызове слово укорачивается на две буквы, поэтому базовый случай должен покрывать и слово из одной буквы, и слово из нуля букв. Глубина не превысит двадцати. " +
        "Учти, что сравнить только две крайние буквы недостаточно: у слова `abca` края совпадают, а симметричным оно не является. Не ищи готовых способов развернуть строку — смысл задачи здесь в рекурсии. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому это совет, а не обязательное правило.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int bad(string s) {\n" +
      "    if (s.size() <= 1) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    int rest = bad(s.substr(1, s.size() - 2));\n" +
      "    if (s[0] != s[s.size() - 1]) {\n" +
      "        return rest + 1;\n" +
      "    }\n" +
      "    return rest;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string word;\n" +
      "    cin >> word;\n" +
      "    cout << bad(word);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible, and it is the endpoints-only killer: the ends match, the
         middle does not. The shortcut answers 0 with the sample on screen. */
      { input: "abca", expectedOutput: "1" },
      /* One letter: the base case fires on the first call. */
      { input: "a", expectedOutput: "0", hidden: true },
      /* Two letters, even length: `if (s.size() <= 2) return 0;` answers 0. */
      { input: "ab", expectedOutput: "1", hidden: true },
      /* Two equal letters. */
      { input: "aa", expectedOutput: "0", hidden: true },
      /* Odd-length palindrome with a lone middle letter. */
      { input: "rotor", expectedOutput: "0", hidden: true },
      /* Every pair wrong: the endpoints-only shortcut answers 1. */
      { input: "abcdef", expectedOutput: "3", hidden: true },
      /* Odd-length palindrome, longer. */
      { input: "abcba", expectedOutput: "0", hidden: true },
      /* Matching ends, one bad pair inside — the same trap as the visible case
         at a different length. */
      { input: "abcda", expectedOutput: "1", hidden: true },
      /* Even length, all letters equal. */
      { input: "zzzz", expectedOutput: "0", hidden: true },
      /* Even length, both pairs wrong: the short base case answers 1. */
      { input: "abab", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * Rung 6, and the first recursion in the bank that takes TWO shrinking
     * arguments. The call tree stops being a chain — «Айдың орталық құралы -
     * шақырулар ағашы» (p.9) — and it stops being a chain in a way the learner
     * has not met: both parameters move, and which of them stops the recursion
     * depends on which of the two base conditions is reached first.
     *
     * `product-authored`: the PDF names the factorial, the power, the symmetry
     * check, the sequences, the grid and the queens. It does not name this one.
     * The recursion is February's; the problem is ours.
     *
     * **Why this and not the stairs.** The obvious "count the ways" recursion
     * is the 1-or-2-step staircase, and that is `m6.l5.b6` — already written,
     * already answered, with the same negative guard a stairs task would need
     * here. A practice bank that reissued it would be transcription plus one
     * term. Choosing k out of n moves the recursion into two dimensions instead.
     *
     * **The recurrence is the grid's, seen from the other side, and that is
     * deliberate.** `m6.l6.b8` counts paths with
     * `paths(r - 1, c) + paths(r, c - 1)`; this counts choices with
     * `choose(n - 1, k - 1) + choose(n - 1, k)`. Same rule, different objects —
     * "the last thing either was taken or it was not" — and the connection is
     * worth a learner noticing, which is why the prompt states the split in
     * exactly those words. The two programs share no line but the `cout`.
     *
     * The answer is also the count this whole bank keeps using: `m6.p2`'s
     * triples are C(n, 3) of them, and the number of lines `m6.p9` prints is
     * C(n, k) exactly. A learner who finishes this one can predict the size of
     * both.
     *
     * n ≤ 20 is chosen so the size claim is true: C(20, 10) = 184 756 and the
     * whole tree is about 370 000 calls, comfortably under the 100 000 000
     * steps a second the year has measured against since December, and the
     * answer fits an `int` with three orders of magnitude to spare. The depth
     * never exceeds 20. April («Тиімді таңдау және динамика», p.10) is where
     * the repetition gets removed; February is where it is allowed to be
     * visible.
     *
     * Wrong solutions and the case that kills each:
     *   - only the `k == 0` base, so `choose(n, n)` descends past it into
     *     k > n and never stops → the VISIBLE case "5 2" and "5 5", "1 1",
     *     "4 1", "6 3" as well;
     *   - only the `k == n` base → "5 2" and "5 0";
     *   - the wrong second term, `choose(n, k - 1)` instead of
     *     `choose(n - 1, k)` — a recursion that shrinks, but not the way the
     *     problem does → "5 2": 4 vs 10;
     *   - both terms shrinking n and neither shrinking k → "5 2": 8 vs 10;
     *   - k = 0 and k = n, the two ends, where the answer is 1 for two
     *     different reasons → "5 0", "5 5", "20 0", "20 20";
     *   - n = 1, the smallest team there is → "1 0", "1 1".
     */
    id: "m6.p6",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "recursion.call_tree", "func.parameters"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Сыныпта n оқушы бар, солардың ішінен k адамдық команда құру керек (0 ≤ k ≤ n ≤ 20). Мұны неше түрлі тәсілмен істеуге болады? Тек сол бір санды шығар. " +
        "Команданың құрамы ғана маңызды, кімнің бірінші таңдалғаны маңызды емес: {Айдана, Бекзат} мен {Бекзат, Айдана} — бір команда. k = 0 болғанда жауап 1: ешкімді алмаудың да бір ғана тәсілі бар. " +
        "Бір жолда бос орынмен бөлінген n мен k беріледі. Мысалы n = 5, k = 2 болса, жауап 10, ал n = 6, k = 3 болса, 20. " +
        "Есепті өзін-өзі шақыратын функциямен шеш. Ойлан: тізімдегі соңғы оқушыны алайық. Ол командаға я кірді, я кірмеді. Кірген болса, қалған n − 1 оқушының ішінен тағы k − 1 адам таңдау керек; кірмеген болса, қалған n − 1 оқушының ішінен түгел k адам таңдау керек. Екі жағдай да бөлек саналады да, қосылады. " +
        "Тоқтау шарттарын мұқият жаз: біреуі емес, ЕКЕУІ керек. Таңдайтын ешкім қалмаған жағдай да, бәрін таңдаудан басқа амал қалмаған жағдай да — екеуі де бірден белгілі жауап береді. Біреуін ұмытсаң, шақырулар тоқтамайды, ал C++ мұны айтпайды: бағдарлама жай ғана үзіліп қалады. " +
        "Мұндай рекурсия бір есепті бірнеше рет қайта есептейді, ал бұл — қалыпты жағдай: ең ауыр жағдайда (n = 20, k = 10) шамамен 370 000 шақыру жасалады, ал бұл секундтық 100 000 000 қадамға еркін сыяды. Жауап та `int`-ке сыяды: ең үлкені 184 756. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан рекурсия — кеңес, міндетті ереже емес.",
      ru:
        "В классе n учеников, из них нужно составить команду из k человек (0 ≤ k ≤ n ≤ 20). Сколькими разными способами это можно сделать? Выведи только это одно число. " +
        "Важен только состав команды, а не то, кого выбрали первым: {Айдана, Бекзат} и {Бекзат, Айдана} — это одна и та же команда. При k = 0 ответ равен 1: не взять никого тоже можно ровно одним способом. " +
        "В одной строке через пробел даны n и k. Например, при n = 5 и k = 2 ответ 10, а при n = 6 и k = 3 ответ 20. " +
        "Реши задачу функцией, которая вызывает саму себя. Подумай: возьмём последнего ученика в списке. Он либо попал в команду, либо нет. Если попал, из оставшихся n − 1 учеников надо выбрать ещё k − 1 человека; если не попал, из оставшихся n − 1 учеников надо выбрать все k человек. Эти два случая считаются отдельно и складываются. " +
        "Аккуратно продумай базовые случаи: их нужно ДВА, а не один. И случай, когда выбирать больше некого, и случай, когда не остаётся ничего, кроме как взять всех, дают ответ сразу. Если забыть один из них, вызовы не прекратятся, а C++ об этом не скажет: программа просто оборвётся. " +
        "Такая рекурсия пересчитывает одну и ту же задачу по нескольку раз, и это нормально: в самом тяжёлом случае (n = 20, k = 10) получается около 370 000 вызовов, а это свободно укладывается в 100 000 000 шагов за секунду. Ответ тоже помещается в `int`: наибольший — 184 756. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому рекурсия здесь — совет, а не обязательное правило.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int choose(int n, int k) {\n" +
      "    if (k == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (k == n) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return choose(n - 1, k - 1) + choose(n - 1, k);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n, k;\n" +
      "    cin >> n >> k;\n" +
      "    cout << choose(n, k);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible, and it kills every mutant listed above on its own: a missing
         base case never stops, the wrong second term answers 4, two
         n-shrinking terms answer 8. */
      { input: "5 2", expectedOutput: "10" },
      /* k = 0: the answer is 1 because there is nothing left to choose. */
      { input: "5 0", expectedOutput: "1", hidden: true },
      /* k = n: the answer is 1 for the OTHER reason, and a solution with only
         the k == 0 base descends into k > n and never comes back. */
      { input: "5 5", expectedOutput: "1", hidden: true },
      /* The smallest class, both ends. */
      { input: "1 0", expectedOutput: "1", hidden: true },
      { input: "1 1", expectedOutput: "1", hidden: true },
      /* k = 1: the answer is n, which is the first value a learner can check
         against common sense. */
      { input: "4 1", expectedOutput: "4", hidden: true },
      { input: "6 3", expectedOutput: "20", hidden: true },
      /* Both ends at the top of the range. */
      { input: "20 0", expectedOutput: "1", hidden: true },
      { input: "20 20", expectedOutput: "1", hidden: true },
      /* The heaviest case the bounds allow: about 370 000 calls, and the number
         the prompt's size argument is about. */
      { input: "20 10", expectedOutput: "184756", hidden: true },
    ],
  },
  {
    /*
     * Rung 7. PDF p.9 family «дәрежені өзін-өзі шақыру арқылы есептеу».
     *
     * RE-AUTHORED FOR C++ RATHER THAN TRANSLATED, and it is the only task in
     * the month that had to be. The Python version asked for aⁿ with a ≤ 9 and
     * n ≤ 5000, and both of its load-bearing facts are false here:
     *
     *   · one hidden case stored 2¹²⁰⁰ as a 362-digit decimal. Python prints
     *     that; C++ has no type for it, and `long long` runs out near 9 · 10¹⁸;
     *   · the task's difficulty was CPython's ~1000-frame recursion ceiling at
     *     n = 5000. C++ has no ceiling at all, so 5000 frames is unremarkable
     *     and the halving would have had no reason to exist.
     *
     * The replacement keeps the family, the method and the two things the
     * original actually taught, and makes both of them enforceable:
     *
     *   · **the answer is taken modulo 1 000 000 007.** `%` is September's
     *     operator. The prompt states the two rules that make it work — take
     *     the remainder after every multiplication, and multiply in `long long`
     *     because two values below 10⁹ make a product near 10¹⁸ — and both are
     *     September facts, not new ones;
     *   · **halving is now forced by the bound, not suggested.** n reaches
     *     10⁹, so a recursion that steps down by one is a billion frames deep.
     *     That is not a slow program, it is a dead one: the stack runs out and
     *     C++ says nothing at all. Halving keeps the depth under about sixty.
     *     Two hidden cases at n = 10⁹ make it a verdict rather than advice.
     *
     * The ban is re-aimed too. `**` does not exist in C++, so forbidding it
     * would be noise; `pow()` from `<cmath>` exists, computes in `double` with
     * about fifteen significant digits, and cannot produce these answers
     * exactly. The prompt warns about the trap that is real.
     *
     * Wrong solutions and the case that kills each:
     *   - `a * power(a, n - 1)` all the way down → "1 1000000000" and
     *     "2 1000000000": the program dies against a printed answer;
     *   - a base case at n == 1 instead of n == 0 → "7 0" and "0 0";
     *   - halving without the odd branch, `power(a, n / 2) * power(a, n / 2)`
     *     for every n → "3 5": 81 vs 243, and "5 1": 1 vs 5;
     *   - forgetting the remainder, or taking it in `int` → "1000 1000000000"
     *     and "2 1000000000";
     *   - a == 0 with n > 0, where the answer is 0 rather than 1 → "0 5";
     *   - 0⁰, which the prompt fixes at 1 because the base case does → "0 0";
     *   - "10 9" is the largest answer that is smaller than the modulus, so a
     *     solution that takes the remainder correctly and one that never needed
     *     to both give 1 000 000 000 — and "10 10" one step later is where the
     *     wrap first shows.
     */
    id: "m6.p7",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "func.define", "func.return", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: a және n (0 ≤ a ≤ 1000, 0 ≤ n ≤ 1 000 000 000). a-ның n-дәрежесін есептеу керек, бірақ ол сан ешбір түрге сыймайтындай үлкен болады. Сондықтан жауап ретінде a-ның n-дәрежесін 1 000 000 007-ге бөлгендегі ҚАЛДЫҒЫН шығар. n = 0 болғанда жауап 1 (a = 0 болғанда да солай: 0⁰ мұнда 1 деп есептеледі). Тек сол бір санды шығар.\n\n" +
        "Қалдықпен жұмыс екі ережеге сүйенеді, екеуі де қыркүйектен таныс. Бірінші: әр көбейтуден кейін бірден `% 1000000007` алып отыр — сонда сандар ешқашан 1 000 000 007-ден аспайды. Екінші: көбейтуді `long long`-пен жүргіз, себебі 10⁹-ға жуық екі санның көбейтіндісі 10¹⁸-ге жетеді, ал ол `int`-ке мүлде сыймайды.\n\n" +
        "Ал мына шектеу — кеңес емес, нақты кедергі. Дәрежені бір-бірден кеміте берсең, рекурсия n деңгей тереңдікке түседі, ал n мұнда миллиардқа дейін жетеді. Сонша шақыруға арналған жад жоқ: бағдарлама ешбір хабарсыз үзіліп қалады, өйткені C++ шақырулардың тереңдігін санамайды және ол туралы ешқандай қате хабарын бермейді. Тереңдікті іске қоспас бұрын өзің есептеп шығуың керек.\n\n" +
        "Дәрежені екіге бөл: n жұп болса, aⁿ — a-ның (n / 2)-дәрежесін БІР рет есептеп, шыққан санды өзіне көбейткенге тең; n тақ болса, aⁿ = a · a^(n−1), сонда дәреже жұпқа айналады. Осылай тереңдік алпыстан аспайды.\n\n" +
        "`<cmath>` тақырыбындағы `pow` функциясын қолданба: ол бөлшек сандармен есептейді және шамамен он бес мәнді цифрды ғана дәл сақтайды, сондықтан мұндағы жауаптарды дәл бере алмайды. Тексеруші тек шыққан санды салыстыратынын білесің — демек бұл сенің адалдығыңа қалдырылған ескерту.",
      ru:
        "В одной строке через пробел даны два целых числа: a и n (0 ≤ a ≤ 1000, 0 ≤ n ≤ 1 000 000 000). Нужно вычислить a в степени n, но это число окажется больше любого типа. Поэтому в ответ выведи ОСТАТОК от деления a в степени n на 1 000 000 007. При n = 0 ответ равен 1 (в том числе при a = 0: 0⁰ здесь считается равным 1). Выведи только это одно число.\n\n" +
        "Работа с остатком держится на двух правилах, и оба знакомы с сентября. Первое: сразу после каждого умножения бери `% 1000000007` — тогда числа никогда не превысят 1 000 000 007. Второе: умножай в `long long`, потому что произведение двух чисел около 10⁹ доходит до 10¹⁸, а в `int` это не помещается совсем.\n\n" +
        "А вот следующее ограничение — не совет, а настоящее препятствие. Если уменьшать степень по единице, рекурсия уйдёт на глубину n, а n здесь доходит до миллиарда. Памяти на столько вызовов нет: программа оборвётся без всякого сообщения, потому что C++ не считает глубину вызовов и никак о ней не предупреждает. Глубину нужно посчитать самому, до запуска.\n\n" +
        "Дели степень пополам: если n чётное, то aⁿ равно значению a в степени (n / 2), посчитанному ОДИН раз и умноженному само на себя; если n нечётное, то aⁿ = a · a^(n−1), и степень становится чётной. Так глубина не превысит шестидесяти.\n\n" +
        "Не пользуйся функцией `pow` из `<cmath>`: она считает в дробных числах и точно хранит лишь около пятнадцати значащих цифр, поэтому нужные здесь ответы выдать точно не может. Ты знаешь, что проверяющая программа сравнивает только выведенное число, — значит, это предупреждение оставлено на твою честность.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long MOD = 1000000007;\n" +
      "\n" +
      "long long power(long long a, long long n) {\n" +
      "    if (n == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (n % 2 == 1) {\n" +
      "        long long rest = power(a, n - 1);\n" +
      "        return a % MOD * rest % MOD;\n" +
      "    }\n" +
      "    long long half = power(a, n / 2);\n" +
      "    return half * half % MOD;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    long long a, n;\n" +
      "    cin >> a >> n;\n" +
      "    cout << power(a, n);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible, and odd: halving with no odd branch answers 81. Small enough
         that the modulus is invisible, which is deliberate — the first case a
         learner sees should be one they can check by hand. */
      { input: "3 5", expectedOutput: "243" },
      /* A power-of-two exponent, all branches even. */
      { input: "2 10", expectedOutput: "1024", hidden: true },
      /* n = 0: a base case at n == 1 recurses past it and never stops. */
      { input: "7 0", expectedOutput: "1", hidden: true },
      /* Base 0, exponent above zero. */
      { input: "0 5", expectedOutput: "0", hidden: true },
      /* n = 1: halving without the odd branch answers 1. */
      { input: "5 1", expectedOutput: "5", hidden: true },
      /* 0⁰, fixed at 1 by the prompt and by the base case. */
      { input: "0 0", expectedOutput: "1", hidden: true },
      { input: "9 3", expectedOutput: "729", hidden: true },
      /* The largest answer still SMALLER than the modulus: 10⁹ exactly. */
      { input: "10 9", expectedOutput: "1000000000", hidden: true },
      /* One step further, and the remainder finally bites: 10¹⁰ mod 1e9+7. */
      { input: "10 10", expectedOutput: "999999937", hidden: true },
      /* Depth: a billion one-at-a-time calls do not exist. The answer is 1, so
         the case stays readable while the constraint does the work. */
      { input: "1 1000000000", expectedOutput: "1", hidden: true },
      /* The same depth with a base that cannot be special-cased, and a
         remainder that only a correct modular multiplication produces. */
      { input: "2 1000000000", expectedOutput: "140625001", hidden: true },
      /* The top of the range in both numbers. */
      { input: "1000 1000000000", expectedOutput: "448979595", hidden: true },
    ],
  },
  {
    /*
     * Rung 8. PDF p.9 family «шағын тордағы жолдар санын есептеу».
     *
     * `m6.l6.b8` counts paths in an empty r × c grid with
     * `paths(r - 1, c) + paths(r, c - 1)`. Here cells can be BLOCKED, so the
     * recursion has to be written over a position rather than over two
     * dimensions, and three separate stopping conditions have to be sorted into
     * the right order: off the board, standing on a blocked cell, standing on
     * the finish. Getting that order wrong is the whole task — a program that
     * returns 1 on reaching the corner before it checks whether the corner is
     * blocked answers the "blocked finish" case incorrectly.
     *
     * The input is the first grid the learner reads in this course, so the
     * prompt states the format completely: `r` and `c` on the first line, then
     * exactly `r` lines of exactly `c` characters, `.` free and `#` blocked.
     * `cin >> row` reads one whitespace-free token, which is exactly one grid
     * row, so no line-reading machinery is needed.
     *
     * The grid is a `vector<string>` passed by reference, and its dimensions
     * are read back out of it with the month's usual `int r = g.size();`
     * recipe, so nothing here is a file-scope variable and nothing is copied
     * per call.
     *
     * Wrong solutions and the case that kills each:
     *   - ignoring `#` entirely → the visible case: 6 vs 2, and "1 1 / #":
     *     1 vs 0;
     *   - checking a neighbour before stepping into it, but never checking the
     *     starting cell → "2 2 / #. / ..": 2 vs 0, and "1 1 / #": 1 vs 0;
     *   - testing "am I at the finish" before "am I blocked"
     *       → "2 2 / .. / .#": a wrong 1 instead of 0;
     *   - returning 1 rather than 0 when the walk leaves the board
     *       → "1 5 / ..#..": a wrong count instead of 0;
     *   - a one-cell grid, where the start IS the finish → "1 1 / .": 1.
     * The 8 × 8 empty board pins the upper end at 3432, which is the number the
     * unblocked recurrence produces, so a solution that is right about walls
     * and wrong about the recurrence cannot hide. The tree is a few thousand
     * calls at a depth of at most 14.
     */
    id: "m6.p8",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "enumerate.all", "lists.index", "strings.sequence"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Тор r жол мен c бағаннан тұрады (1 ≤ r ≤ 8, 1 ≤ c ≤ 8). Бірінші жолда бос орынмен бөлінген r мен c беріледі, содан кейін тордың r жолы келеді; әр жолда дәл c таңба: `.` — бос ұяшық, `#` — бөгелген ұяшық. Тор жолын `string` ретінде `cin >> row;` арқылы оқуға болады — ол бос орынға дейінгі бөлікті алады, ал тор жолында бос орын жоқ. " +
        "Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін жүреміз. Әр қадамда тек бір ұяшық оңға немесе бір ұяшық төмен жүруге болады, ал `#` ұяшыққа мүлдем баспаймыз. Осындай жолдардың саны неше? Тек сол бір санды шығар. " +
        "Бастапқы ұяшықтың өзі де, соңғы ұяшықтың өзі де бөгелген болуы мүмкін — ондай жағдайда жауап 0. " +
        "Мысалы, r = 3, c = 3 және тор мынадай болса:\n" +
        "```\n...\n.#.\n...\n```\n" +
        "жауап 2. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: (i, j) ұяшығынан соңғы ұяшыққа дейінгі жолдардың саны — төмендегі көршісінен басталатын және оң жақтағы көршісінен басталатын жолдардың қосындысы. Тоқтау шарттарын қай ретпен тексеретініңді мұқият ойлан: тордан шығып кету, бөгелген ұяшықта тұру және соңғы ұяшыққа жету — үш түрлі жағдай. " +
        "Бұл рекурсия кейбір ұяшықты бірнеше рет қайта есептейді, бірақ тор 8 × 8-ден аспайтындықтан бұл бір секундқа еркін сыяды, ал тереңдігі он төрттен аспайды.",
      ru:
        "Сетка состоит из r строк и c столбцов (1 ≤ r ≤ 8, 1 ≤ c ≤ 8). В первой строке через пробел даны r и c, затем идут r строк сетки; в каждой ровно c символов: `.` — свободная клетка, `#` — заблокированная. Строку сетки можно прочитать как `string` через `cin >> row;` — он берёт кусок до пробела, а пробелов в строке сетки нет. " +
        "Мы идём из левой верхней клетки в правую нижнюю. За один шаг можно перейти только на одну клетку вправо или на одну клетку вниз, а в клетку `#` заходить нельзя вообще. Сколько существует таких путей? Выведи только это одно число. " +
        "Заблокированной может оказаться и сама начальная клетка, и сама конечная — в этом случае ответ 0. " +
        "Например, при r = 3, c = 3 и такой сетке:\n" +
        "```\n...\n.#.\n...\n```\n" +
        "ответ равен 2. " +
        "Реши задачу функцией, которая вызывает саму себя: число путей из клетки (i, j) до последней клетки равно сумме числа путей, начинающихся у соседа снизу, и числа путей, начинающихся у соседа справа. Внимательно продумай порядок проверок: выход за пределы сетки, нахождение на заблокированной клетке и достижение последней клетки — три разных случая. " +
        "Такая рекурсия пересчитывает некоторые клетки по нескольку раз, но сетка не больше 8 × 8, поэтому в секунду это укладывается свободно, а глубина не превышает четырнадцати.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int paths(vector<string>& g, int i, int j) {\n" +
      "    int r = g.size();\n" +
      "    int c = g[0].size();\n" +
      "    if (i == r || j == c) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    if (g[i][j] == '#') {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    if (i == r - 1 && j == c - 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return paths(g, i + 1, j) + paths(g, i, j + 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int r, c;\n" +
      "    cin >> r >> c;\n" +
      "    vector<string> g(r);\n" +
      "    for (int i = 0; i < r; i++) cin >> g[i];\n" +
      "    cout << paths(g, 0, 0);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible: 6 paths on an empty 3 × 3, 4 of them through the middle. A
         solution that ignores `#` answers 6. */
      { input: "3 3\n...\n.#.\n...", expectedOutput: "2" },
      /* One cell, free: the start IS the finish. */
      { input: "1 1\n.", expectedOutput: "1", hidden: true },
      /* One cell, blocked: kills every solution that never checks the cell it
         is standing on. */
      { input: "1 1\n#", expectedOutput: "0", hidden: true },
      /* Blocked START on a real grid. */
      { input: "2 2\n#.\n..", expectedOutput: "0", hidden: true },
      /* Blocked FINISH: kills the order that returns 1 on arrival before
         testing the cell. */
      { input: "2 2\n..\n.#", expectedOutput: "0", hidden: true },
      /* A single row: only one path exists, and it is a straight line. */
      { input: "1 5\n.....", expectedOutput: "1", hidden: true },
      /* The same row with a wall across it: the answer is 0, not 1. */
      { input: "1 5\n..#..", expectedOutput: "0", hidden: true },
      /* The largest empty board: 3432, the unblocked recurrence's own number. */
      {
        input: "8 8\n........\n........\n........\n........\n........\n........\n........\n........",
        expectedOutput: "3432",
        hidden: true,
      },
      /* Walls in the corners the route does not have to enter. */
      { input: "3 3\n..#\n...\n#..", expectedOutput: "4", hidden: true },
      /* A wall in the middle of a 4 × 4 that narrows but does not close the
         board. */
      { input: "4 4\n....\n.##.\n....\n....", expectedOutput: "5", hidden: true },
    ],
  },
  {
    /*
     * Rung 9, core and advanced. PDF p.9 family «0 мен 1-ден тұратын барлық
     * шағын тізбектерді шығару».
     *
     * `m6.l6.b7` prints every 0/1 sequence of length n, so this one prints only
     * those with exactly k ones. That is one extra parameter and one real
     * decision — the branch that puts a `1` may only be taken while ones are
     * left — and it is the first time in the month that a generator PRUNES
     * instead of enumerating everything and filtering afterwards.
     *
     * Support does not receive it: `m6.l6.b6` and `m6.l6.b8s` are the assembled
     * and completed forms of generation the programme asks support for, and a
     * blank editor over a generator is «нөлден жазу» in the exact place the
     * month says not to put it. Nothing here is backtracking with an undo step:
     * `path` grows only through the ARGUMENT of the call — `path + "0"` builds a
     * new string for the callee and leaves this call's own `path` untouched —
     * so there is nothing to undo.
     *
     * **The layout is the answer, so the checker is `exact`.** One sequence per
     * line, no separator, ascending. Under the default `token` checker a
     * program printing all six sequences on one line, or in descending order,
     * would be graded correct against a prompt that forbids both — the third
     * defect class in the authoring contract, and the reason this is the only
     * block in the bank that declares a checker.
     *
     * Wrong solutions and the case that kills each:
     *   - printing every sequence of length n, ignoring k
     *       → "4 2": 16 lines vs 6;
     *   - taking the `1` branch first, so the output descends
     *       → "4 2" and "2 1", both wrong under `exact` while `token` would
     *         have passed them;
     *   - counting ones instead of tracking them, and printing a sequence with
     *     k ones only when the LAST position decides → "3 1" catches the
     *     ordering, "5 2" the count;
     *   - k = 0 and k = n, the two ends, where exactly one line is printed
     *       → "3 0", "3 3", "4 0", "5 5";
     *   - n = 1, the shortest sequence there is → "1 0", "1 1".
     *
     * At the top of the range, n = 12, the most lines any k can produce is
     * C(12, 6) = 924 — the recursion is twelve deep and the output is small.
     */
    id: "m6.p9",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.call_tree", "enumerate.all", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["core", "advanced"],
    checker: { kind: "exact" },
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: n мен k (1 ≤ n ≤ 12, 0 ≤ k ≤ n). " +
        "Ұзындығы n болатын, тек 0 мен 1 таңбаларынан тұратын және ішінде дәл k бірлігі бар барлық тізбекті шығар. " +
        "Шығару пішімі есептің бір бөлігі: әр тізбек бөлек жолда, таңбалардың арасында ешқандай ажыратқыш жоқ, ал жолдардың реті — өсу реті (әуелі 0-ден басталатындары, содан кейін 1-ден басталатындары; жолдарды сан деп қарасаң, олар кішіден үлкенге қарай тұрады). " +
        "Мысалы n = 4, k = 2 болғанда дәл алты жол шығады, дәл мына ретпен:\n" +
        "```\n0011\n0101\n0110\n1001\n1010\n1100\n```\n" +
        "Есепті өзін-өзі шақыратын функциямен шеш: әр орынға кезекпен алдымен 0, содан кейін 1 қой да, қалған орындар үшін сол функцияны қайта шақыр. Жиналған бөлікті `string path` деп мән бойынша беруге болады, сонда әр шақыру өз көшірмесін алады. Функцияға әлі толтырылмаған орындардың санын да, әлі қоюға болатын бірліктердің санын да беру керек. " +
        "Ойлан: бірлік қоюға бола ма, жоқ па — оны неге алдын ала тексерген дұрыс, ал тізбек толғаннан кейін тексерген қате?",
      ru:
        "В одной строке через пробел даны два целых числа: n и k (1 ≤ n ≤ 12, 0 ≤ k ≤ n). " +
        "Выведи все последовательности длины n, состоящие только из символов 0 и 1 и содержащие ровно k единиц. " +
        "Формат вывода — часть задачи: каждая последовательность на отдельной строке, между символами никаких разделителей, а порядок строк — возрастающий (сначала те, что начинаются с 0, потом те, что начинаются с 1; если смотреть на строки как на числа, они идут от меньшего к большему). " +
        "Например, при n = 4 и k = 2 выводится ровно шесть строк, ровно в таком порядке:\n" +
        "```\n0011\n0101\n0110\n1001\n1010\n1100\n```\n" +
        "Реши задачу функцией, которая вызывает саму себя: на каждое место ставь по очереди сначала 0, затем 1 и вызывай ту же функцию для оставшихся мест. Собранную часть можно передавать как `string path` по значению — тогда каждый вызов получает свою копию. Функции нужно передавать и число ещё не заполненных мест, и число единиц, которые ещё можно поставить. " +
        "Подумай: почему проверять, можно ли поставить единицу, правильно заранее, а не после того, как последовательность уже собрана?",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "void build(string path, int left, int ones) {\n" +
      "    if (left == 0) {\n" +
      "        if (ones == 0) {\n" +
      "            cout << path << endl;\n" +
      "        }\n" +
      "        return;\n" +
      "    }\n" +
      "    build(path + \"0\", left - 1, ones);\n" +
      "    if (ones > 0) {\n" +
      "        build(path + \"1\", left - 1, ones - 1);\n" +
      "    }\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n, k;\n" +
      "    cin >> n >> k;\n" +
      "    build(\"\", n, k);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible, and it is the whole specification: six lines, ascending. A
         generator that ignores k prints sixteen; one that tries 1 first prints
         the same six in the opposite order. */
      { input: "4 2", expectedOutput: "0011\n0101\n0110\n1001\n1010\n1100" },
      /* n = 1, k = 0: one line, one character. */
      { input: "1 0", expectedOutput: "0", hidden: true },
      /* n = 1, k = 1. */
      { input: "1 1", expectedOutput: "1", hidden: true },
      /* k = 0: exactly one sequence, and the `1` branch must never be taken. */
      { input: "3 0", expectedOutput: "000", hidden: true },
      /* k = n: exactly one sequence, and the `0` branch leads nowhere. */
      { input: "3 3", expectedOutput: "111", hidden: true },
      /* The smallest case where order is visible: 01 before 10. */
      { input: "2 1", expectedOutput: "01\n10", hidden: true },
      /* k = n at the top of the range. */
      { input: "5 5", expectedOutput: "11111", hidden: true },
      { input: "4 0", expectedOutput: "0000", hidden: true },
      /* Three lines, each with the single 1 in a different place — the
         ordering test that does not depend on counting. */
      { input: "3 1", expectedOutput: "001\n010\n100", hidden: true },
      /* Ten lines: enough that a wrong order or a missing branch shows. */
      {
        input: "5 2",
        expectedOutput: "00011\n00101\n00110\n01001\n01010\n01100\n10001\n10010\n10100\n11000",
        hidden: true,
      },
    ],
  },
  {
    /*
     * Rung 10, advanced only. The chess-placement family the PDF hands to
     * «Мықты оқушыларға» by name, which is why `tracks: ["advanced"]` here is
     * the source specifying differentiation rather than a product decision.
     *
     * `sourceType: "product-authored"`, deliberately: the PDF names the QUEENS,
     * and the queens count is already `m6.l6.b10`. Reissuing it as practice
     * would be the duplicate the review found twice in November. Rooks on an
     * n × n board with k of them is the same search with the diagonal test
     * removed and a genuinely new decision added — k can be smaller than n, so
     * some rows stay empty, and the recursion must consider BOTH "put a rook in
     * this row" and "leave this row alone". A learner who has understood the
     * queens program still has to find that second branch.
     *
     * This is the one block in the bank that is a search with a choice carried
     * downward, and it is allowed here precisely because it is not «бүкіл
     * топқа»: the programme forbids handing complex backtracking to the whole
     * group from scratch, and this is the advanced route only. There is still
     * no undo to teach — a fresh `vector<int> next = cols;` is built for the
     * deeper call, exactly as `m6.l6.b10` does it, so `pop_back` never appears.
     *
     * `free_col` rather than `free`, because `free` is a C library function and
     * a beginner should not be taught to shadow one.
     *
     * Wrong solutions and the case that kills each:
     *   - no "leave this row empty" branch, so only k = n is counted
     *       → "4 2": 12 vs 72;
     *   - no column check, so two rooks share a column
     *       → "4 2": 96 vs 72, and "3 3": 27 vs 6;
     *   - counting the rooks as distinguishable, i.e. multiplying by k!
     *       → "4 2": 144 vs 72;
     *   - k = 0, where the answer is 1 and not 0 → "6 0", "1 0";
     *   - n = 1, the smallest board → "1 0", "1 1".
     * A self-check for the learner: "3 2" is 18 and "4 2" is 72, which is what
     * the prompt gives them instead of a closed formula — a formula would let
     * the whole search be skipped, and the search is the task.
     *
     * The board is at most 6 × 6, so the search is tiny and the depth is at
     * most 6.
     */
    id: "m6.p10",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.call_tree", "enumerate.all", "recursion.base_case", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk:
        "Мықты оқушыларға. n × n шахмат тақтасына k ладья қою керек, олар бір-біріне тимесін. Ладья тура жүреді, сондықтан екі ладья бір жолда да, бір бағанда да тұрмауы тиіс; диагональ мұнда маңызды емес. " +
        "Бір жолда бос орынмен бөлінген n мен k беріледі (1 ≤ n ≤ 6, 0 ≤ k ≤ n). Осындай орналастырулардың саны неше? Тек сол бір санды шығар. " +
        "Ладьялар бір-бірінен ажыратылмайды: маңыздысы — қай ұяшықтарда фигура тұрғаны, олардың қайсысы бірінші қойылғаны емес. k = 0 болғанда жауап 1: ештеңе қоймаудың да бір ғана тәсілі бар. " +
        "Мысалы n = 4, k = 2 үшін жауап 72, ал n = 3, k = 2 үшін 18. " +
        "Уәзірлер есебінен екі айырмашылығы бар. Біріншісі — диагональды тексерудің қажеті жоқ. Екіншісі маңыздырақ: k тақтаның өлшемінен кіші болуы мүмкін, сондықтан кейбір жолдар мүлдем бос қалады — демек әр жол үшін «мұнда фигура қоямын ба, әлде бұл жолды аттап өтемін бе» деген екі тармақты да қарау керек. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: функцияға қай жолда тұрғаныңды, қандай бағандар бос емес екенін (`vector<int>` түрінде) және әлі неше фигура қою керектігін бер. Тереңірек шақыруға жаңа тізім жасап бер — сонда кері қайтарудың қажеті болмайды.",
      ru:
        "Сильным ученикам. На доску n × n нужно поставить k ладей так, чтобы они не били друг друга. Ладья ходит по прямой, поэтому две ладьи не должны стоять ни в одной строке, ни в одном столбце; диагонали здесь не важны. " +
        "В одной строке через пробел даны n и k (1 ≤ n ≤ 6, 0 ≤ k ≤ n). Сколько существует таких расстановок? Выведи только это одно число. " +
        "Ладьи неразличимы: важно, на каких клетках стоят фигуры, а не в каком порядке их поставили. При k = 0 ответ равен 1: не ставить ничего тоже можно ровно одним способом. " +
        "Например, при n = 4 и k = 2 ответ 72, а при n = 3 и k = 2 ответ 18. " +
        "От задачи о ферзях здесь два отличия. Первое — диагонали проверять не нужно. Второе важнее: k может быть меньше размера доски, поэтому какие-то строки останутся совсем пустыми — значит, для каждой строки надо рассмотреть обе ветки: «ставлю сюда фигуру» и «пропускаю эту строку». " +
        "Реши задачу функцией, которая вызывает саму себя: передавай ей номер текущей строки, список занятых столбцов (`vector<int>`) и число фигур, которые ещё осталось поставить. Для более глубокого вызова собирай новый список — тогда ничего отменять не придётся.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int place(int row, vector<int> cols, int left, int n) {\n" +
      "    if (left == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (row == n) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    int total = place(row + 1, cols, left, n);\n" +
      "    int m = cols.size();\n" +
      "    for (int c = 0; c < n; c++) {\n" +
      "        int free_col = 1;\n" +
      "        for (int i = 0; i < m; i++) {\n" +
      "            if (cols[i] == c) free_col = 0;\n" +
      "        }\n" +
      "        if (free_col == 1) {\n" +
      "            vector<int> next = cols;\n" +
      "            next.push_back(c);\n" +
      "            total = total + place(row + 1, next, left - 1, n);\n" +
      "        }\n" +
      "    }\n" +
      "    return total;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n, k;\n" +
      "    cin >> n >> k;\n" +
      "    vector<int> cols;\n" +
      "    cout << place(0, cols, k, n);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible. No skip-row branch answers 12; no column check answers 96. */
      { input: "4 2", expectedOutput: "72" },
      /* The smallest board with a figure on it. */
      { input: "1 1", expectedOutput: "1", hidden: true },
      /* k = 0 on the smallest board: the answer is 1, not 0. */
      { input: "1 0", expectedOutput: "1", hidden: true },
      /* k = n, so every row is used: this is 3! and the ONLY case the
         skip-row-less solution gets right. */
      { input: "3 3", expectedOutput: "6", hidden: true },
      /* k = n at the top of the range: 6! = 720. */
      { input: "6 6", expectedOutput: "720", hidden: true },
      /* One rook anywhere on a 2 × 2 board. */
      { input: "2 1", expectedOutput: "4", hidden: true },
      /* The self-check value the prompt names. */
      { input: "3 2", expectedOutput: "18", hidden: true },
      /* One row left empty on a 5 × 5 board. */
      { input: "5 4", expectedOutput: "600", hidden: true },
      /* k = 0 on the largest board: nothing placed, one arrangement, and the
         search must stop immediately rather than walk the board. */
      { input: "6 0", expectedOutput: "1", hidden: true },
      /* Half the rows empty on the largest board — the case where the two
         branches carry roughly equal weight. */
      { input: "6 3", expectedOutput: "2400", hidden: true },
    ],
  },
];
