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
 * ## Not a rerun of the lessons — the rule this bank was authored under
 *
 * Six lessons of February are already written, and the naive reading of the
 * practice families would have produced ten blocks that already exist:
 * `m6.l3.b8` IS the factorial, `m6.l3.b9` IS a^n, `m6.l4.b8` IS the symmetry
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
 * | p7 | power by recursion | the exponent is halved, because at n ≤ 5000 the one-at-a-time recursion genuinely dies |
 * | p8 | paths in a small grid | cells are blocked, including possibly the first or the last |
 * | p9 | all 0/1 sequences | exactly k ones, so the generator carries a second parameter and prunes |
 * | p10 | chess placement | rooks, and k of them on an n × n board, so whole rows stay empty |
 *
 * Every program in this file was compared byte for byte against every program
 * in `m06/l1.ts` … `m06/l6.ts` and against every other program here. No two are
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
 *   comparison cannot see a `def`, and a `while` loop answers p3, p4, p5, p6
 *   and p7 correctly. So each of those prompts says the recursion is a
 *   кеңес / совет — advice — and that the checker compares the printed number.
 *   The same sentence `m6.l3.b8` and `m6.l4.b9` already use. A fourteen-year-old
 *   is never told a rule was checked when it was not.
 * - **Option 1 where it genuinely bites, and only there.** Three places:
 *     · p2 — enumerating unordered or doubled triples changes the number, and
 *       the hidden case `8 4 4` (answer 0) fails any solution that asks "is one
 *       of the three the sum of the other two";
 *     · p7 — n runs to 5000, and a recursion that steps down by one dies with
 *       RecursionError at depth ~1000. The prompt states this as a fact about
 *       Python, not as a rule, and two hidden cases enforce it;
 *     · p9 — the layout IS the answer (one sequence per line, ascending), so
 *       the block declares `checker: { kind: "exact" }` rather than promising a
 *       format that `token` would quietly ignore.
 * - **`**` in p7.** Forbidden by the prompt, unenforceable by any checker, and
 *   the prompt says so in that word. See the block comment.
 *
 * ## Output
 *
 * Nine tasks print a single integer; p9 prints lines of `0` and `1`. No program
 * in this file prints a Kazakh or Russian word, so a learner reading either
 * language reasons about the same thing instead of matching glyphs.
 *
 * ## Python
 *
 * February introduces no construct. Everything here is October's loops and
 * lists, November's `def`/`return`, September's `abs` and `%`, plus `max()` of
 * two numbers, which December brought. No import anywhere: `sys.setrecursionlimit`
 * is exactly the escape hatch p7 exists to close, and there is no `lru_cache` to
 * hide the recomputation p6 and p8 are built to make visible.
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
        "Кодқа отырмас бұрын санап ал: n ең үлкені 1000 болғанда жұптар саны 1000 · 999 / 2 ≈ 500 000, ал бұл бір секундтық 100 000 000 қадамға еркін сыяды — сондықтан барлық жұпты бір-бірлеп қарап шығу мұнда әбден жарамды тәсіл. " +
        "Кеңес: айырманың модулін Python-да `abs` береді.",
      ru:
        "Даны температуры воздуха за n дней. В первой строке число n (2 ≤ n ≤ 1000), во второй — n целых чисел через пробел, температура каждого дня (каждая от −50 до 50), в третьей — число d (0 ≤ d ≤ 100). " +
        "Сколько есть пар дней, температуры которых отличаются не больше чем на d? Другими словами, найди количество пар (i, j) с условием i < j и |a[i] − a[j]| ≤ d. Пара, у которой разность ровно d, тоже считается. Выведи только это одно число. " +
        "Например, при n = 5, температурах 10 14 12 20 11 и d = 2 ответ равен 4. " +
        "Прежде чем садиться за код, посчитай: при n = 1000 пар получается 1000 · 999 / 2 ≈ 500 000, а это свободно укладывается в 100 000 000 шагов за секунду — значит, просмотреть все пары по одной здесь вполне уместно. " +
        "Подсказка: модуль разности в Python даёт `abs`.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "d = int(input())\n" +
      "close = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        if abs(a[i] - a[j]) <= d:\n" +
      "            close = close + 1\n" +
      "print(close)",
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
     *   - the order-blind reading, `a[i] + a[j] == a[k] or a[i] + a[k] == a[j]
     *     or a[j] + a[k] == a[i]` → "3 / 8 4 4": 1 vs 0. This is the whole
     *     point of the task and the reason `8 4 4` and `4 4 8` are both cases;
     *   - `k` starting at `i + 1` instead of `j + 1` (triples counted twice and
     *     j = k allowed) → visible case and "6 / 1 1 2 2 3 4" both change;
     *   - no triple qualifying → "3 / 1 1 5": 0;
     *   - every triple qualifying → "4 / 0 0 0 0": 4 = 4 · 3 · 2 / 6, the
     *     formula from `m6.l1.b1` against a real answer;
     *   - duplicates that must each be counted separately → "6 / 1 1 2 2 3 4":
     *     9, where several different index triples carry the same three values.
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
        "Кодқа отырмас бұрын санап ал: n ең үлкені 100 болғанда үштіктер саны 100 · 99 · 98 / 6 = 161 700, ал бұл секундтық 100 000 000 қадамнан әлдеқайда аз — сондықтан бәрін бір-бірлеп қарап шығуға болады.",
      ru:
        "В первой строке дано число n (3 ≤ n ≤ 100), во второй — n целых чисел через пробел (каждое от −1000 до 1000). " +
        "Сколько есть троек (i, j, k), у которых позиции идут в порядке i < j < k и при этом a[i] + a[j] в точности равно a[k]? Выведи только это одно число. " +
        "Порядок важен: складываются два первых числа тройки, а равняться сумме должно то из трёх, которое стоит в списке ПОСЛЕДНИМ. Например, в последовательности 8 4 4 такой тройки нет (8 + 4 = 12, а последнее число 4), а в последовательности 4 4 8 она ровно одна. " +
        "Ещё пример: при n = 5 и числах 1 2 3 5 8 ответ равен 3 — это 1 + 2 = 3, 2 + 3 = 5 и 3 + 5 = 8. " +
        "Прежде чем садиться за код, посчитай: при n = 100 троек будет 100 · 99 · 98 / 6 = 161 700, а это намного меньше 100 000 000 шагов в секунду — значит, перебрать их все по одной можно.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "triples = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        for k in range(j + 1, n):\n" +
      "            if a[i] + a[j] == a[k]:\n" +
      "                triples = triples + 1\n" +
      "print(triples)",
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
         `range(j + 1, n - 1)` that stops one short answers 1. */
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
     * Wrong solutions and the case that kills each:
     *   - base `if a == b: return 1`, the classic off-by-one
     *       → "5 5": 1 vs 5, and "3 6": 60 vs 360;
     *   - base `if a == b: return a`, which is right for a ≤ b and never fires
     *     when the range is empty
     *       → "7 4": RecursionError vs 1;
     *   - recursing on `b` and forgetting `a`, i.e. computing b!
     *       → "3 6": 720 vs 360;
     *   - returning 0 for the empty product → "7 4": 0 vs 1.
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
        "Есепті өзін-өзі шақыратын функциямен шеш: a-дан b-ға дейінгі көбейтінді — a мен (a + 1)-ден b-ға дейінгі көбейтіндінің көбейтіндісі. Тоқтау шартын бірінші жаз да, ол дәл қай жағдайда орындалатынын мұқият ойлан. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан рекурсия — міндетті ереже емес, кеңес; бірақ ай соңындағы сынақта дәл осы тәсіл сұралады.",
      ru:
        "В одной строке через пробел даны два целых числа: a и b (1 ≤ a ≤ 15, 1 ≤ b ≤ 15). " +
        "Выведи произведение всех целых чисел от a до b: a · (a + 1) · … · b. " +
        "Если a > b, то умножать нечего — в этом случае ответом считается 1 (пустое произведение). " +
        "Например, для 3 6 ответ 3 · 4 · 5 · 6 = 360, для 5 5 ответ 5, а для 7 4 ответ 1. Обрати внимание: при a = 1 это в точности факториал b!. " +
        "Реши задачу функцией, которая вызывает саму себя: произведение от a до b — это a, умноженное на произведение от (a + 1) до b. Сначала напиши базовый случай и внимательно продумай, при каком именно условии он срабатывает. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому рекурсия здесь — совет, а не обязательное правило; но на проверке в конце месяца спросят именно этот приём.",
    },
    referenceSolution:
      "def prod(a, b):\n" +
      "    if a > b:\n" +
      "        return 1\n" +
      "    return a * prod(a + 1, b)\n" +
      "\n" +
      "a, b = map(int, input().split())\n" +
      "print(prod(a, b))",
    cases: [
      /* Visible. `if a == b: return 1` answers 60 here. */
      { input: "3 6", expectedOutput: "360" },
      /* One number in the range: the base case must NOT have fired yet. */
      { input: "5 5", expectedOutput: "5", hidden: true },
      /* Empty range. A base case written as `a == b` never fires and the
         program dies with RecursionError. */
      { input: "7 4", expectedOutput: "1", hidden: true },
      /* 12! — the PDF's factorial, reached through this task's door. */
      { input: "1 12", expectedOutput: "479001600", hidden: true },
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
     * `n // 10` ladder (`m6.l3.b6`, `m6.l4.b9`) carrying a MAXIMUM back up
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
     *   - a base case one level too early, `if n < 100: return n % 10`
     *       → "9123": 3 vs 9, and "10": 0 vs 1;
     *   - comparing against `n // 10` rather than against what the call
     *     returned → "4926": 492 vs 9;
     *   - n = 0, where the base case has to fire immediately → "0": 0.
     * "555" is the all-equal list in disguise: every digit is the maximum, so a
     * solution that tracks "strictly greater" still has to answer 5.
     */
    id: "m6.p4",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "arith.remainder", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk:
        "Теріс емес бүтін сан n беріледі (0 ≤ n ≤ 1 000 000 000). Оның цифрларының ішіндегі ең үлкенін шығар. " +
        "Мысалы 4926 үшін жауап 9, 1239 үшін де 9, 555 үшін 5, ал 0 үшін 0. Тек сол бір цифрды шығар. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: санның ең үлкен цифры — оның соңғы цифры (`n % 10`) мен қалған бөлігінің (`n // 10`) ең үлкен цифрының үлкені. Тоқтау шарты — цифры бір ғана қалған сан: ондай санның ең үлкен цифры өзі. " +
        "Абайла: жауап санның басында да, соңында да тұруы мүмкін, сондықтан шақырудан қайтқан мәнді ұмытпай салыстыр. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан рекурсия — міндетті ереже емес, кеңес; бірақ жаттығудың мәні дәл сонда.",
      ru:
        "Дано неотрицательное целое число n (0 ≤ n ≤ 1 000 000 000). Выведи наибольшую из его цифр. " +
        "Например, для 4926 ответ 9, для 1239 тоже 9, для 555 ответ 5, а для 0 ответ 0. Выведи только эту одну цифру. " +
        "Реши задачу функцией, которая вызывает саму себя: наибольшая цифра числа — это большее из двух, из его последней цифры (`n % 10`) и наибольшей цифры оставшейся части (`n // 10`). Базовый случай — число, в котором осталась одна цифра: его наибольшая цифра равна ему самому. " +
        "Будь внимателен: ответ может стоять и в начале числа, и в конце, поэтому обязательно сравнивай со значением, которое вернул вызов. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому рекурсия здесь — совет, а не обязательное правило; но смысл упражнения именно в ней.",
    },
    referenceSolution:
      "def big(n):\n" +
      "    if n < 10:\n" +
      "        return n\n" +
      "    return max(n % 10, big(n // 10))\n" +
      "\n" +
      "x = int(input())\n" +
      "print(big(x))",
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
     * what makes the October shortcut visibly wrong instead of silently lucky.
     *
     * Wrong solutions and the case that kills each:
     *   - comparing only the first and last letter — the shortcut that passed
     *     all seven cases of `m2.p6` and `m3.l7.b7`
     *       → the VISIBLE case "abca": 0 vs 1, and "abcdef": 1 vs 3;
     *   - a base case one pair short, `if len(s) <= 2: return 0`
     *       → "ab": 0 vs 1, "abab": 1 vs 2;
     *   - counting letters instead of pairs, i.e. answering 2 for one bad pair
     *       → "abca": 2 vs 1;
     *   - a one-letter word, where the base case must fire at once → "a": 0;
     *   - an even-length word with no middle letter → "ab", "zzzz", "abab";
     *   - an odd-length palindrome whose middle letter has no partner
     *       → "rotor": 0, "abcba": 0.
     * "abcda" is the trap in miniature: the endpoints match and the word is
     * still not symmetric.
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
        "Есепті өзін-өзі шақыратын функциямен шеш: шеткі екі әріпті салыстыр, олар әртүрлі болса бірді қос, содан кейін дәл сол функцияны сөздің ішкі бөлігі үшін қайта шақыр. Әр шақыруда сөз екі әріпке қысқарады, сондықтан тоқтау шарты бір әріпті де, нөл әріпті де қамтуы керек. " +
        "Тек шеткі екі әріпті салыстырып қоюдың жеткіліксіз екенін ескер: `abca` сөзінің шеттері бірдей, ал өзі симметриялы емес. Сөзді төңкеретін дайын тәсілдерді (`s[::-1]` сияқты) қолданба — мұнда есептің мәні рекурсияда. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан бұл кеңес, міндетті ереже емес.",
      ru:
        "Дано одно слово из строчных латинских букв: не меньше одной буквы и не больше сорока, пробелов нет. " +
        "Сколько букв нужно изменить как минимум, чтобы слово стало симметричным? Симметричным называем слово, которое одинаково читается слева направо и справа налево. За один шаг можно заменить любую одну букву на любую другую. Выведи только это одно число. " +
        "Например, в слове `abca` не совпадает ровно одна пара — вторая буква b и третья буква c, — поэтому ответ 1: достаточно изменить одну букву. Для `abcdef` ответ 3, для `rotor` ответ 0, для `a` ответ 0. " +
        "Реши задачу функцией, которая вызывает саму себя: сравни две крайние буквы, прибавь единицу, если они разные, и вызови ту же функцию для внутренней части слова. При каждом вызове слово укорачивается на две буквы, поэтому базовый случай должен покрывать и слово из одной буквы, и слово из нуля букв. " +
        "Учти, что сравнить только две крайние буквы недостаточно: у слова `abca` края совпадают, а симметричным оно не является. Не пользуйся готовыми приёмами разворота строки (вроде `s[::-1]`) — смысл задачи здесь в рекурсии. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому это совет, а не обязательное правило.",
    },
    referenceSolution:
      "def bad(s):\n" +
      "    if len(s) <= 1:\n" +
      "        return 0\n" +
      "    rest = bad(s[1:len(s) - 1])\n" +
      "    if s[0] != s[len(s) - 1]:\n" +
      "        return rest + 1\n" +
      "    return rest\n" +
      "\n" +
      "word = input()\n" +
      "print(bad(word))",
    cases: [
      /* Visible, and it is the endpoints-only killer: the ends match, the
         middle does not. The shortcut answers 0 with the sample on screen. */
      { input: "abca", expectedOutput: "1" },
      /* One letter: the base case fires on the first call. */
      { input: "a", expectedOutput: "0", hidden: true },
      /* Two letters, even length: `if len(s) <= 2: return 0` answers 0. */
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
     * already answered, with the same `n < 0` guard a stairs task would need
     * here. A practice bank that reissued it would be transcription plus one
     * term. Choosing k out of n moves the recursion into two dimensions instead.
     *
     * **The recurrence is the grid's, seen from the other side, and that is
     * deliberate.** `m6.l6.b8` counts paths with
     * `paths(r - 1, c) + paths(r, c - 1)`; this counts choices with
     * `choose(n - 1, k - 1) + choose(n - 1, k)`. Same rule, different objects —
     * "the last thing either was taken or it was not" — and the connection is
     * worth a learner noticing, which is why the prompt states the split in
     * exactly those words. The two programs share no line but the `print`.
     *
     * The answer is also the count this whole bank keeps using: `m6.p2`'s
     * triples are C(n, 3) of them, and the number of lines `m6.p9` prints is
     * C(n, k) exactly. A learner who finishes this one can predict the size of
     * both.
     *
     * n ≤ 20 is chosen so the size claim is true: C(20, 10) = 184 756 and the
     * whole tree is 2 · 184 756 − 1 ≈ 370 000 calls, comfortably under the
     * 100 000 000 steps a second the year has measured against since December.
     * April («Тиімді таңдау және динамика», p.10) is where the repetition gets
     * removed; February is where it is allowed to be visible.
     *
     * Wrong solutions and the case that kills each:
     *   - only the `k == 0` base, so `choose(n, n)` descends past it into
     *     k > n and never stops → the VISIBLE case "5 2": RecursionError, and
     *     "5 5", "1 1", "4 1", "6 3" as well;
     *   - only the `k == n` base → "5 2" and "5 0": RecursionError;
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
        "Тоқтау шарттарын мұқият жаз: біреуі емес, ЕКЕУІ керек. Таңдайтын ешкім қалмаған жағдай да, бәрін таңдаудан басқа амал қалмаған жағдай да — екеуі де бірден белгілі жауап береді. Біреуін ұмытсаң, шақырулар түбі жоқ тереңдікке кетеді. " +
        "Мұндай рекурсия бір есепті бірнеше рет қайта есептейді, ал бұл — қалыпты жағдай: ең ауыр жағдайда (n = 20, k = 10) шамамен 370 000 шақыру жасалады, ал бұл секундтық 100 000 000 қадамға еркін сыяды. " +
        "Тексеруші тек шыққан санды салыстырады, сондықтан рекурсия — кеңес, міндетті ереже емес.",
      ru:
        "В классе n учеников, из них нужно составить команду из k человек (0 ≤ k ≤ n ≤ 20). Сколькими разными способами это можно сделать? Выведи только это одно число. " +
        "Важен только состав команды, а не то, кого выбрали первым: {Айдана, Бекзат} и {Бекзат, Айдана} — это одна и та же команда. При k = 0 ответ равен 1: не взять никого тоже можно ровно одним способом. " +
        "В одной строке через пробел даны n и k. Например, при n = 5 и k = 2 ответ 10, а при n = 6 и k = 3 ответ 20. " +
        "Реши задачу функцией, которая вызывает саму себя. Подумай: возьмём последнего ученика в списке. Он либо попал в команду, либо нет. Если попал, из оставшихся n − 1 учеников надо выбрать ещё k − 1 человека; если не попал, из оставшихся n − 1 учеников надо выбрать все k человек. Эти два случая считаются отдельно и складываются. " +
        "Аккуратно продумай базовые случаи: их нужно ДВА, а не один. И случай, когда выбирать больше некого, и случай, когда не остаётся ничего, кроме как взять всех, дают ответ сразу. Если забыть один из них, вызовы провалятся в бездонную глубину. " +
        "Такая рекурсия пересчитывает одну и ту же задачу по нескольку раз, и это нормально: в самом тяжёлом случае (n = 20, k = 10) получается около 370 000 вызовов, а это свободно укладывается в 100 000 000 шагов за секунду. " +
        "Проверяющая программа сравнивает только выведенное число, поэтому рекурсия здесь — совет, а не обязательное правило.",
    },
    referenceSolution:
      "def choose(n, k):\n" +
      "    if k == 0:\n" +
      "        return 1\n" +
      "    if k == n:\n" +
      "        return 1\n" +
      "    return choose(n - 1, k - 1) + choose(n - 1, k)\n" +
      "\n" +
      "n, k = map(int, input().split())\n" +
      "print(choose(n, k))",
    cases: [
      /* Visible, and it kills every mutant listed above on its own: a missing
         base case crashes, the wrong second term answers 4, two n-shrinking
         terms answer 8. */
      { input: "5 2", expectedOutput: "10" },
      /* k = 0: the answer is 1 because there is nothing left to choose. */
      { input: "5 0", expectedOutput: "1", hidden: true },
      /* k = n: the answer is 1 for the OTHER reason, and a solution with only
         the k == 0 base descends into k > n and dies here. */
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
      /* The heaviest case the bounds allow: 370 000 calls, and the number the
         prompt's size argument is about. */
      { input: "20 10", expectedOutput: "184756", hidden: true },
    ],
  },
  {
    /*
     * Rung 7. PDF p.9 family «дәрежені өзін-өзі шақыру арқылы есептеу».
     *
     * `m6.l3.b9` is a^n written as `a * power(a, n - 1)`, with n ≤ 20. Setting
     * the same task again would be transcription, so the exponent runs to 5000
     * — and at that size the one-at-a-time recursion is not merely slow, it is
     * DEAD: CPython stops at a recursion depth of about 1000 and raises
     * RecursionError. Two hidden cases ("1 5000" and "2 1200") make that a
     * verdict rather than a warning, which is option 1 of the contract's three:
     * the required method is enforced by the output, and the prompt states the
     * limit as a fact about Python rather than as a rule.
     *
     * `1 5000` alone would let a learner special-case a == 1, so `2 1200` sits
     * next to it with a 362-digit answer that only real exponentiation reaches.
     *
     * **`**` is forbidden and no checker can see it.** `print(a ** n)` passes
     * every case in this block, and pretending otherwise would be the exact
     * defect the contract's §4 names. So the prompt says it in that word: the
     * whole exercise IS computing the power, `**` deletes the exercise, and the
     * learner is told plainly that the ban rests on their own honesty. There is
     * no import in this file, so `sys.setrecursionlimit` — the other way to
     * dodge the task — is not available either.
     *
     * Wrong solutions and the case that kills each:
     *   - `a * power(a, n - 1)` all the way down → "1 5000" and "2 1200":
     *     RecursionError vs an answer;
     *   - a base case at n == 1 instead of n == 0 → "7 0" and "0 0":
     *     RecursionError vs 1;
     *   - halving without the odd branch, `power(a, n // 2) * power(a, n // 2)`
     *     for every n → "3 5": 81 vs 243, and "5 1": 1 vs 5;
     *   - a == 0 with n > 0, where the answer is 0 rather than 1 → "0 5";
     *   - 0⁰, which the prompt fixes at 1 because the recursion's base case
     *     does → "0 0".
     */
    id: "m6.p7",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "func.define", "func.return", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: a және n (0 ≤ a ≤ 9, 0 ≤ n ≤ 5000). a-ның n-дәрежесін шығар, яғни a-ны өзіне n рет көбейт. n = 0 болғанда жауап 1 (a = 0 болғанда да солай: 0⁰ мұнда 1 деп есептеледі). Тек сол бір санды шығар. " +
        "`**` операторын қолданба: бүкіл тапсырманың мәні — дәрежені өзің есептеу, ал `**` есептің өзін жойып жібереді. Тексеруші тек шыққан санды салыстыратынын білесің, демек бұл тыйым сенің адалдығыңа қалдырылған. " +
        "Ал мына шектеу — кеңес емес, нақты кедергі. Дәрежені бір-бірден кеміте берсең, рекурсия n деңгей тереңдікке түседі, ал Python тереңдік мыңға жеткенде бағдарламаны тоқтатып, RecursionError береді. n мұнда 5000-ға дейін болуы мүмкін, сондықтан ол тәсіл жұмыс істемейді. " +
        "Дәрежені екіге бөл: n жұп болса, aⁿ — a-ның (n / 2)-дәрежесін БІР рет есептеп, шыққан санды өзіне көбейткенге тең; n тақ болса, aⁿ = a · a^(n−1), сонда дәреже жұпқа айналады. Осылай тереңдік 25-тен аспайды. " +
        "Жауап өте үлкен сан болуы мүмкін — Python оны толық көрсете алады.",
      ru:
        "В одной строке через пробел даны два целых числа: a и n (0 ≤ a ≤ 9, 0 ≤ n ≤ 5000). Выведи a в степени n, то есть a, умноженное само на себя n раз. При n = 0 ответ равен 1 (в том числе при a = 0: 0⁰ здесь считается равным 1). Выведи только это одно число. " +
        "Не пользуйся оператором `**`: весь смысл задания в том, чтобы посчитать степень самому, а `**` уничтожает саму задачу. Ты знаешь, что проверяющая программа сравнивает только выведенное число, значит, этот запрет держится на твоей честности. " +
        "А вот следующее ограничение — не совет, а настоящее препятствие. Если уменьшать степень по единице, рекурсия уйдёт на глубину n, а Python на глубине около тысячи останавливает программу и выдаёт RecursionError. Здесь n доходит до 5000, поэтому такой способ просто не сработает. " +
        "Дели степень пополам: если n чётное, то aⁿ равно значению a в степени (n / 2), посчитанному ОДИН раз и умноженному само на себя; если n нечётное, то aⁿ = a · a^(n−1), и степень становится чётной. Так глубина не превысит 25. " +
        "Ответ может оказаться очень большим числом — Python умеет выводить его целиком.",
    },
    referenceSolution:
      "def power(a, n):\n" +
      "    if n == 0:\n" +
      "        return 1\n" +
      "    if n % 2 == 1:\n" +
      "        return a * power(a, n - 1)\n" +
      "    half = power(a, n // 2)\n" +
      "    return half * half\n" +
      "\n" +
      "a, n = map(int, input().split())\n" +
      "print(power(a, n))",
    cases: [
      /* Visible, and odd: halving with no odd branch answers 81. */
      { input: "3 5", expectedOutput: "243" },
      /* A power of two exponent, all branches even. */
      { input: "2 10", expectedOutput: "1024", hidden: true },
      /* n = 0: a base case at n == 1 recurses past it and dies. */
      { input: "7 0", expectedOutput: "1", hidden: true },
      /* Base 0, exponent above zero. */
      { input: "0 5", expectedOutput: "0", hidden: true },
      /* Depth: 5000 one-at-a-time calls is a RecursionError. The answer is
         small so the case stays readable. */
      { input: "1 5000", expectedOutput: "1", hidden: true },
      /* n = 1: halving without the odd branch answers 1. */
      { input: "5 1", expectedOutput: "5", hidden: true },
      /* 0⁰, fixed at 1 by the prompt and by the base case. */
      { input: "0 0", expectedOutput: "1", hidden: true },
      { input: "9 3", expectedOutput: "729", hidden: true },
      /* The second depth case, with a base that cannot be special-cased: 2¹²⁰⁰
         has 362 digits and only a real exponentiation produces it. */
      {
        input: "2 1200",
        expectedOutput:
          "17218479456385750618067377696052635483579924745448689921733236816400740691241745619397484537236046173286370919031961587788584927290816661024991609882728717344659503471655990880884679896520055123906467064419056526231345685268240569209892573766037966584735183775739433978714578587782701380797240772477647874555986712746271362892227516205318914435913511141036261376",
        hidden: true,
      },
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
     * and wrong about the recurrence cannot hide.
     */
    id: "m6.p8",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "enumerate.all", "lists.index", "strings.sequence"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk:
        "Тор r жол мен c бағаннан тұрады (1 ≤ r ≤ 8, 1 ≤ c ≤ 8). Бірінші жолда бос орынмен бөлінген r мен c беріледі, содан кейін тордың r жолы келеді; әр жолда дәл c таңба: `.` — бос ұяшық, `#` — бөгелген ұяшық. " +
        "Сол жақ жоғарғы ұяшықтан оң жақ төменгі ұяшыққа дейін жүреміз. Әр қадамда тек бір ұяшық оңға немесе бір ұяшық төмен жүруге болады, ал `#` ұяшыққа мүлдем баспаймыз. Осындай жолдардың саны неше? Тек сол бір санды шығар. " +
        "Бастапқы ұяшықтың өзі де, соңғы ұяшықтың өзі де бөгелген болуы мүмкін — ондай жағдайда жауап 0. " +
        "Мысалы, r = 3, c = 3 және тор мынадай болса:\n" +
        "```\n...\n.#.\n...\n```\n" +
        "жауап 2. " +
        "Есепті өзін-өзі шақыратын функциямен шеш: (i, j) ұяшығынан соңғы ұяшыққа дейінгі жолдардың саны — төмендегі көршісінен басталатын және оң жақтағы көршісінен басталатын жолдардың қосындысы. Тоқтау шарттарын қай ретпен тексеретініңді мұқият ойлан: тордан шығып кету, бөгелген ұяшықта тұру және соңғы ұяшыққа жету — үш түрлі жағдай. " +
        "Бұл рекурсия кейбір ұяшықты бірнеше рет қайта есептейді, бірақ тор 8 × 8-ден аспайтындықтан бұл бір секундқа еркін сыяды.",
      ru:
        "Сетка состоит из r строк и c столбцов (1 ≤ r ≤ 8, 1 ≤ c ≤ 8). В первой строке через пробел даны r и c, затем идут r строк сетки; в каждой ровно c символов: `.` — свободная клетка, `#` — заблокированная. " +
        "Мы идём из левой верхней клетки в правую нижнюю. За один шаг можно перейти только на одну клетку вправо или на одну клетку вниз, а в клетку `#` заходить нельзя вообще. Сколько существует таких путей? Выведи только это одно число. " +
        "Заблокированной может оказаться и сама начальная клетка, и сама конечная — в этом случае ответ 0. " +
        "Например, при r = 3, c = 3 и такой сетке:\n" +
        "```\n...\n.#.\n...\n```\n" +
        "ответ равен 2. " +
        "Реши задачу функцией, которая вызывает саму себя: число путей из клетки (i, j) до последней клетки равно сумме числа путей, начинающихся у соседа снизу, и числа путей, начинающихся у соседа справа. Внимательно продумай порядок проверок: выход за пределы сетки, нахождение на заблокированной клетке и достижение последней клетки — три разных случая. " +
        "Такая рекурсия пересчитывает некоторые клетки по нескольку раз, но сетка не больше 8 × 8, поэтому в секунду это укладывается свободно.",
    },
    referenceSolution:
      "r, c = map(int, input().split())\n" +
      "g = []\n" +
      "for row in range(r):\n" +
      "    g.append(input())\n" +
      "\n" +
      "def paths(i, j):\n" +
      "    if i == r or j == c:\n" +
      "        return 0\n" +
      '    if g[i][j] == "#":\n' +
      "        return 0\n" +
      "    if i == r - 1 and j == c - 1:\n" +
      "        return 1\n" +
      "    return paths(i + 1, j) + paths(i, j + 1)\n" +
      "\n" +
      "print(paths(0, 0))",
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
     * `path` grows only through the argument of the call, so there is nothing
     * to undo.
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
        "Есепті өзін-өзі шақыратын функциямен шеш: әр орынға кезекпен алдымен 0, содан кейін 1 қой да, қалған орындар үшін сол функцияны қайта шақыр. Функцияға әлі толтырылмаған орындардың санын да, әлі қоюға болатын бірліктердің санын да беру керек. " +
        "Ойлан: бірлік қоюға бола ма, жоқ па — оны неге алдын ала тексерген дұрыс, ал тізбек толғаннан кейін тексерген қате?",
      ru:
        "В одной строке через пробел даны два целых числа: n и k (1 ≤ n ≤ 12, 0 ≤ k ≤ n). " +
        "Выведи все последовательности длины n, состоящие только из символов 0 и 1 и содержащие ровно k единиц. " +
        "Формат вывода — часть задачи: каждая последовательность на отдельной строке, между символами никаких разделителей, а порядок строк — возрастающий (сначала те, что начинаются с 0, потом те, что начинаются с 1; если смотреть на строки как на числа, они идут от меньшего к большему). " +
        "Например, при n = 4 и k = 2 выводится ровно шесть строк, ровно в таком порядке:\n" +
        "```\n0011\n0101\n0110\n1001\n1010\n1100\n```\n" +
        "Реши задачу функцией, которая вызывает саму себя: на каждое место ставь по очереди сначала 0, затем 1 и вызывай ту же функцию для оставшихся мест. Функции нужно передавать и число ещё не заполненных мест, и число единиц, которые ещё можно поставить. " +
        "Подумай: почему проверять, можно ли поставить единицу, правильно заранее, а не после того, как последовательность уже собрана?",
    },
    referenceSolution:
      "def build(path, left, ones):\n" +
      "    if left == 0:\n" +
      "        if ones == 0:\n" +
      "            print(path)\n" +
      "        return\n" +
      '    build(path + "0", left - 1, ones)\n' +
      "    if ones > 0:\n" +
      '        build(path + "1", left - 1, ones - 1)\n' +
      "\n" +
      "n, k = map(int, input().split())\n" +
      'build("", n, k)',
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
     * This is the one block in the bank that is a search with an undo, and it
     * is allowed here precisely because it is not «бүкіл топқа»: the programme
     * forbids handing complex backtracking to the whole group from scratch, and
     * this is the advanced route only. The undo is written the way the month
     * writes it — `cols + [c]` builds a NEW list for the deeper call, so the
     * caller's own list is untouched and there is no `.pop()` to teach.
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
        "Есепті өзін-өзі шақыратын функциямен шеш: функцияға қай жолда тұрғаныңды, қандай бағандар бос емес екенін және әлі неше фигура қою керектігін бер.",
      ru:
        "Сильным ученикам. На доску n × n нужно поставить k ладей так, чтобы они не били друг друга. Ладья ходит по прямой, поэтому две ладьи не должны стоять ни в одной строке, ни в одном столбце; диагонали здесь не важны. " +
        "В одной строке через пробел даны n и k (1 ≤ n ≤ 6, 0 ≤ k ≤ n). Сколько существует таких расстановок? Выведи только это одно число. " +
        "Ладьи неразличимы: важно, на каких клетках стоят фигуры, а не в каком порядке их поставили. При k = 0 ответ равен 1: не ставить ничего тоже можно ровно одним способом. " +
        "Например, при n = 4 и k = 2 ответ 72, а при n = 3 и k = 2 ответ 18. " +
        "От задачи о ферзях здесь два отличия. Первое — диагонали проверять не нужно. Второе важнее: k может быть меньше размера доски, поэтому какие-то строки останутся совсем пустыми — значит, для каждой строки надо рассмотреть обе ветки: «ставлю сюда фигуру» и «пропускаю эту строку». " +
        "Реши задачу функцией, которая вызывает саму себя: передавай ей номер текущей строки, список занятых столбцов и число фигур, которые ещё осталось поставить.",
    },
    referenceSolution:
      "def place(row, cols, left):\n" +
      "    if left == 0:\n" +
      "        return 1\n" +
      "    if row == n:\n" +
      "        return 0\n" +
      "    total = place(row + 1, cols, left)\n" +
      "    c = 0\n" +
      "    while c < n:\n" +
      "        free = 1\n" +
      "        i = 0\n" +
      "        while i < len(cols):\n" +
      "            if cols[i] == c:\n" +
      "                free = 0\n" +
      "            i = i + 1\n" +
      "        if free == 1:\n" +
      "            total = total + place(row + 1, cols + [c], left - 1)\n" +
      "        c = c + 1\n" +
      "    return total\n" +
      "\n" +
      "n, k = map(int, input().split())\n" +
      "print(place(0, [], k))",
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
