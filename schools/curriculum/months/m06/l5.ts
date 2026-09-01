import type { LessonBlock } from "../../types";

/**
 * Lesson m6.l5 · «Күрделірек есептер» / «Задачи посложнее». 10 minutes.
 * PDF p.9, February. Skills: `recursion.core`, `enumerate.all` — the two halves
 * of the month, finally doing one job together.
 *
 * ## The clause that drives the whole file
 *
 * February's mastery sentence is one sentence with an «және» in the middle:
 *
 *   «Нұсқалар аз болғанда барлық мүмкін нұсқаны жүйелі түрде тексеру **және**
 *   функция дәл сондай, бірақ кішірек есепті шешу үшін өзін-өзі шақыратын
 *   тәсілді түсіну.»
 *
 * `m6.l1` and `m6.l2` taught the first half with nested loops. `m6.l3` and
 * `m6.l4` taught the second half on numbers and words. This lesson is where the
 * conjunction stops being decoration: the enumeration is WRITTEN as a recursion,
 * because the thing being enumerated has a number of choice points that the
 * program only learns at run time. Two nested loops enumerate all pairs; five
 * nested loops enumerate all subsets of five items; nothing written with a fixed
 * number of `for` lines enumerates all subsets of n items, and that gap is the
 * reason this lesson exists rather than being an extra card in `m6.l1`.
 *
 * One tree, three questions, is the spine:
 *
 * - `b1` COUNTS on the take/skip tree (how many subsets weigh exactly 5 kg),
 * - `b5` DECIDES on it (is there such a subset at all — and the card is broken),
 * - `b8` MAXIMISES on it (the heaviest subset that still fits under a limit).
 *
 * Same enumeration, three different things computed from it, three different
 * programs. Naming that out loud is most of what «күрделірек есептер» means.
 *
 * ## THE ONE BOUND THE C++ MIGRATION HAD TO RE-DERIVE
 *
 * `b6`'s staircase is the only place in this lesson where the language changed
 * a number, and it changed it by a lot. The Python prompt capped n at **25**
 * and justified the cap by saying that `climb(25)` costs more than 200 000
 * calls and that anything larger would not finish in time. The call count is
 * right — the tree of `climb(n)` holds exactly 2·Fib(n + 2) − 1 calls, so
 * `climb(25)` is 392 835 of them — but 392 835 calls is a rounding error to a
 * compiler. The cap was a Python cap.
 *
 * Re-derived against the ~10⁸ steps per second the year has used since
 * December:
 *
 *   n = 25   →     392 835 calls   (what the Python prompt was protecting)
 *   n = 35   →  48 315 633 calls   ← the new cap, about half the budget
 *   n = 36   →  78 176 337 calls   still inside it
 *   n = 37   → 126 491 971 calls   past it
 *
 * So `b6` is now **1 ≤ n ≤ 35**, the prompt states 48 million calls against 36
 * distinct questions, and `35` joins `25` as a hidden case so the top of the
 * range is executed rather than described. The recursion is 35 frames deep at
 * worst, which is nowhere near a stack limit — the expensive thing here is the
 * WIDTH of the tree, not its depth, and the prompt says so.
 *
 * Nothing else in the file needed re-deriving. `b7`'s Euclid is a few dozen
 * steps at a billion in either language; `b8`'s 2¹⁶ = 65 536 leaves were
 * already far inside the budget; `b1`'s 32 leaves and `b2`'s 19 calls are
 * arithmetic on a card.
 *
 * ## Overflow, checked
 *
 * `b6` at n = 35 answers 14 930 352 and `b7` never exceeds its inputs, so both
 * stay in `int`. `b8`'s weights are at most 1 000 000 each with at most 16 of
 * them, so the largest sum is 16 000 000 and the limit L reaches 1 000 000 000
 * — all comfortably inside `int`, and the largest hidden case is checked at
 * 15 999 880. No block here needs `long long`.
 *
 * ## «Күрделі кері қайту тәсілі биыл бүкіл топқа нөлден жаздырылмайды»
 *
 * The programme's scope limit, and it is respected literally. Every recursion in
 * this file is a pure return-value recursion: a call takes arguments, returns a
 * number, and touches nothing outside itself. There is no `path` that grows and
 * is then trimmed back, no choice that has to be undone after the deeper call
 * returns. That shape — the real backtracking — lives in `m6.l6`, where the
 * whole group meets it as `trace_code`, `fill_blank`, `modify_code` and
 * `explain`, exactly as the PDF specifies. So the two blank editors here (`b6`,
 * `b7`) and the challenge (`b8`) are not that thing, and no core learner is
 * asked to write an undo from nothing.
 *
 * The lists are passed as `vector<int>& a` — November's pass-by-reference —
 * precisely so that a call does NOT copy the list, and the length is taken once
 * with `int n = a.size();`, which is the recipe the month uses everywhere.
 *
 * ## «Айдың орталық құралы - шақырулар ағашы»
 *
 * `b3` writes the tree of a divide-and-conquer maximum down by hand, seven
 * returns in the order they actually come back, because the `recursion_tree`
 * visualiser does not exist yet
 * (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1). It uses January's
 * safe midpoint `lo + (hi - lo) / 2` rather than `(lo + hi) / 2`, because that
 * is the form January taught and a lesson that quietly drops it teaches the
 * learner that the rule was decorative. `b4` then counts the nodes of a
 * different tree — 19 calls to answer 5 distinct questions — and that number is
 * April's opening, not this month's problem. `m8` («Тиімді таңдау және
 * динамика», p.10) is where the repeated answer gets remembered instead of
 * recomputed; `b6`'s prompt says so in both languages and uses it to justify
 * why n is capped at 35 rather than leaving the cap unexplained.
 *
 * ## Requirements a checker cannot see — which option, and why
 *
 * Three prompts here would like to say «рекурсиямен жаз», and output comparison
 * cannot see a `while` loop that prints the same number. Authoring contract §4
 * offers three honest ways out; this lesson takes **option 2 for the graded
 * code (`b6`, `b7`, `b8`) and option 3 for the structural claims (`b9`)**:
 *
 * - `b6` and `b7` name the recursion as the method being practised and then say,
 *   in both languages, that the checker compares only the printed number. That
 *   is advice a fourteen-year-old can act on, not a rule they will be marked on.
 * - `b8` explains WHY the recursion is the natural instrument — the number of
 *   weights differs from test to test, so no fixed nesting of `for` lines can
 *   walk the variants — and stops there. Option 1 is very nearly available (a
 *   solution enumerating subsets with a bitmask loop would also pass), and
 *   "very nearly" is not a guarantee, so no rule is asserted.
 * - `b9` sends the structural questions to a human: why does the recursion stop,
 *   and how do you know it considered every variant. A teacher reads it, it
 *   settles as `unknown`, and it is «шешімді жазбаша қорғау міндетті» (p.6) for
 *   the route the programme requires it of.
 *
 * Option 1 IS taken where it actually bites: `b7`'s hidden `1000000000 1`
 * kills every solution that walks down one at a time — the subtract-one
 * recursion and the divisor scan both die there, which is a real constraint
 * doing real grading rather than a sentence in a prompt. In C++ the
 * subtract-one recursion dies twice over: a billion nested calls exhaust the
 * stack long before they exhaust the clock, and there is no error message when
 * they do.
 *
 * ## The degenerate programs, named, with the case that kills each
 *
 * `b6` (stairs): `cout << n;` dies on the visible `4`; a doubling answer (8)
 * dies on the same case; one branch only (always 1) dies on the visible `2`;
 * base cases `climb(1)=1, climb(2)=1` shift the whole sequence and die on `3`;
 * a stop written only at `n == 0` with no guard for `n - 2 < 0` never
 * terminates on `1`. `1` and `35` are the two ends of the stated range.
 *
 * `b7` (gcd): `min(a, b)` dies on the visible `12 18`; `a - b` in absolute
 * value survives that one by accident (18 − 12 = 6) and dies on the visible
 * `7 13`; anything that steps down by one — a subtraction recursion, a scan
 * over divisors from the smaller number — dies on `1000000000 1` and
 * `1000000000 999999999`; `1 1` and `1000000000 1000000000` are the two ends.
 *
 * `b8` (heaviest fitting subset): greedy left-to-right takes 3 and 4 and answers
 * 7 on the visible `4 10 / 3 4 5 7`, where 3 + 7 = 10; "the single biggest item
 * that fits" answers 7 there too; "take everything if it fits, else 0" answers 0
 * there and dies again on `1 5 / 5`; ignoring the limit answers 19; assuming the
 * answer always equals L dies on `3 5 / 6 7 8` (0) and `5 11 / 4 4 4 4 4` (8); a
 * solution that must take the first item dies on `3 5 / 3 5 1`; one that never
 * reaches the last item dies on `3 2 / 5 6 2`; `2 0 / 1 2` puts the limit on its
 * own boundary and the 16-weight case makes the whole set nearly fit.
 *
 * ## Support
 *
 * `b8` is the one blank editor withheld from support, so `m6.l5.b8s` is the same
 * problem with the same input format, reached by completing three places rather
 * than by facing an empty screen (p.6: «дайын кодты құрастыру мен толықтыру
 * көбірек»). Support still writes `b6` and `b7` from scratch — «нөлден жазу
 * азырақ» is less, not none. The twin's program is deliberately not a copy of
 * `b8`'s reference solution: it compares the two branches with an explicit `if`
 * where the solution uses `max`, so a learner who later moves to the core route
 * does not meet the same text twice. Neither prompt points at a neighbouring
 * card, because the two blocks sit on different routes.
 *
 * ## No new C++, and nothing borrowed from later
 *
 * Functions with declared return types above `main`, `return`, `if/else`, `||`,
 * `vector<int>&`, indexing, `/` and `%` on `int`, and `max` from `<algorithm>`
 * — all of it September through December. No program prints a Kazakh or Russian
 * word: `b5` is the only card with word output and its tokens are `yes` / `no`,
 * named in both prompts.
 */

const P = 9; // PDF page for all of February

export const M6_L5: LessonBlock[] = [
  {
    /*
     * The join, stated as a worked example rather than a concept, because the
     * move that matters is not «рекурсия деген бар» but the step from «бес
     * кірістірілген цикл» to «бір таңдау, содан кейін дәл сол есеп, бірақ бір
     * гір кем». Step 2 is that move and the rest of the card exists to support
     * it.
     *
     * Step 4 is the one that connects the lesson to `m6.l1`: the two branches
     * are added rather than combined some other way because they partition the
     * variants — nothing in both, nothing outside both. That IS «ешнәрсе қалып
     * қоймайды, ешнәрсе екі рет саналмайды», and it is what `b9` asks advanced
     * to defend in writing.
     *
     * The program names its two branches `take` and `skip` in variables. It
     * could have been one line; two named values are what the reasoning above
     * refers to, and no other program in the month is written this way, so
     * nothing here can be transcribed into `b5` or `b8`.
     *
     * The function is `count_ways` and not `count`: with `using namespace std;`
     * in force, a free function called `count` sits next to `std::count`, and a
     * curriculum should not teach a beginner to build a name collision even
     * where overload resolution happens to survive one.
     */
    id: "m6.l5.b1",
    type: "worked_example",
    skillRefs: ["enumerate.all", "recursion.core", "recursion.base_case", "func.parameters"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: әр гірді не аламыз, не алмаймыз",
      ru: "Разобранный пример: каждую гирю либо берём, либо нет",
    },
    problem: {
      kk: "Таразыға арналған бес гір бар: 3, 1, 4, 2 және 5 кг. Солардың бір бөлігін таңдап, дәл 5 кг жинаудың неше тәсілі бар? Әр гір біреу-ақ, оны екі рет алуға болмайды, ал таңдалған гірлердің реті маңызды емес.",
      ru: "Есть пять гирь для весов: 3, 1, 4, 2 и 5 кг. Сколькими способами можно выбрать часть из них так, чтобы получилось ровно 5 кг? Каждая гиря одна, взять её дважды нельзя, а порядок выбранных гирь значения не имеет.",
    },
    steps: [
      {
        kk: "Осы айдың бірінші сабағындағыдай, алдымен нұсқаларды санаймыз. Әр гір үшін екі-ақ шешім бар: аламыз немесе алмаймыз. Бес гір болғандықтан нұсқа саны 2 · 2 · 2 · 2 · 2 = 32. Отыз екі — түк емес, сондықтан бәрін қарап шығуға толық болады.",
        ru: "Как и на первом уроке этого месяца, сначала считаем варианты. Для каждой гири есть всего два решения: берём или не берём. Гирь пять, поэтому вариантов 2 · 2 · 2 · 2 · 2 = 32. Тридцать два — это пустяк, значит просмотреть их все вполне можно.",
      },
      {
        kk: "Бірақ бес кірістірілген цикл жазып қоюға болмайды. Гірлердің саны өзгерсе, циклдердің саны да өзгеруі керек еді, ал бағдарлама жұмыс істеп тұрғанда кодтағы циклдердің санын өзгерту мүмкін емес. Сондықтан бір ғана гірге қатысты шешімді бір қадам етіп аламыз да, қалғанының бәрін функцияның өзіне тапсырамыз. Дәл осы жерде іріктеу мен рекурсия қосылады.",
        ru: "Но пять вложенных циклов записать нельзя. Если число гирь изменится, должно измениться и число циклов, а менять количество циклов в коде во время работы программы невозможно. Поэтому решение про одну-единственную гирю мы делаем одним шагом, а всё остальное поручаем самой функции. Именно здесь перебор и рекурсия соединяются.",
      },
      {
        kk: "`count_ways(a, i, rest)` дегеніміз — `i` орнынан бастап тұрған гірлермен дәл `rest` килограмм жинаудың тәсілдер саны. Тізім функцияға `vector<int>& a` деп беріледі: сілтеме бойынша, сондықтан әр шақыру көшірме жасамайды. Тармақ екеу. Бірінші: `a[i]` гірін аламыз — сонда жинау керек салмақ `rest - a[i]` болып қалады, ал орын `i + 1`-ге жылжиды. Екінші: алмаймыз — салмақ өзгермейді, тек орын жылжиды.",
        ru: "`count_ways(a, i, rest)` — это количество способов набрать ровно `rest` килограммов гирями, начиная с позиции `i`. Список передаётся в функцию как `vector<int>& a` — по ссылке, поэтому ни один вызов не делает копию. Ветвей две. Первая: берём гирю `a[i]` — тогда набрать останется `rest - a[i]`, а позиция сдвигается на `i + 1`. Вторая: не берём — вес не меняется, сдвигается только позиция.",
      },
      {
        kk: "Екі тармақтың жауабын қосамыз. Неге дәл қосу? Себебі бірде-бір нұсқа екі тармаққа бірдей кірмейді — гір не алынған, не алынбаған, үшінші жағдай жоқ — және әр нұсқа міндетті түрде екеуінің біреуіне кіреді. Бұл — бірінші сабақтағы «ешнәрсе қалып қоймайды, ешнәрсе екі рет саналмайды» ережесінің дәл өзі, тек цикл түрінде емес, рекурсия түрінде жазылған.",
        ru: "Ответы двух ветвей складываем. Почему именно складываем? Потому что ни один вариант не попадает в обе ветви сразу — гиря либо взята, либо нет, третьего не дано — и каждый вариант обязательно попадает в одну из них. Это то самое правило «ничего не теряется и ничего не считается дважды» с первого урока, только записанное рекурсией, а не циклом.",
      },
      {
        kk: "Тоқтату шарты — тізімнің соңы: `i` тізім ұзындығына жеткенде таңдайтын гір қалмайды. Ұзындықты бір рет `int n = a.size();` деп жазып аламыз. Сол сәтте бір ғана нәрсені тексереміз — `rest` дәл нөлге тең бе. Тең болса, біз жинаған нұсқа жарайды, яғни бір тәсіл; тең болмаса, нөл тәсіл. Мұнда «нөл» деген сөз екі түрлі мағынада емес, бір-ақ мағынада: жинау аяқталды, ал салмақ дәл шықпады.",
        ru: "Условие остановки — конец списка: когда `i` дошёл до длины списка, выбирать больше нечего. Длину один раз записываем в `int n = a.size();`. В этот момент проверяем одно — равен ли `rest` ровно нулю. Если равен, собранный вариант подходит, то есть это один способ; если нет — ноль способов. Слово «ноль» здесь не в двух смыслах, а в одном: набор закончен, а вес не совпал.",
      },
      {
        kk: "Ағаштың түбінде 32 жапырақ бар, әрқайсысы — бір нұсқа. Солардың үшеуі ғана 5 кг береді: {5}, {1, 4} және {3, 2}. Функция дәл сол үшеуін санап шығады.",
        ru: "На дне дерева 32 листа, каждый — один вариант. Ровно три из них дают 5 кг: {5}, {1, 4} и {3, 2}. Именно эти три функция и насчитывает.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int count_ways(vector<int>& a, int i, int rest) {\n" +
      "    int n = a.size();\n" +
      "    if (i == n) {\n" +
      "        if (rest == 0) {\n" +
      "            return 1;\n" +
      "        }\n" +
      "        return 0;\n" +
      "    }\n" +
      "    int take = count_ways(a, i + 1, rest - a[i]);\n" +
      "    int skip = count_ways(a, i + 1, rest);\n" +
      "    return take + skip;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> w = {3, 1, 4, 2, 5};\n" +
      "    cout << count_ways(w, 0, 5);\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Бағдарлама экранға 3 шығарады. Шақырулар ағашының 32 жапырағының бәрі қаралды, бірақ есепке солардың үшеуі ғана кірді.",
      ru: "Программа выводит на экран 3. Просмотрены все 32 листа дерева вызовов, но в ответ попали лишь три из них.",
    },
  },
  {
    /*
     * A two-branch recursion the learner has to run themselves, and deliberately
     * NOT a decomposition into fixed steps: the second branch is `n / 2`, not
     * `n - k`. That matters twice over. It keeps the card off `b6`'s territory —
     * nothing here can be turned into the stairs solution by editing a constant —
     * and it needs only ONE base case, because neither `n - 1` nor `n / 2` can
     * go below zero from a non-negative n. So `b6`'s second landing stays the
     * learner's own discovery.
     *
     * The prompt defines "different way" as a different sequence of MOVES, which
     * is what makes moves(1) = 2: from 1, subtracting one and halving both land
     * on 0, and they are two different moves. That definition is load-bearing —
     * it is the whole content of the mapped distractor.
     *
     * «5» carries no mapping and the omission is deliberate: it is what a base
     * case written `n <= 1` produces, and it is also the fourth Fibonacci-ish
     * number a learner reaches by assuming this behaves like a stairs count.
     * Two causes, so the engine asks instead of telling. «16» is 2 · 2 · 2 · 2
     * and is not mapped for the same reason.
     */
    id: "m6.l5.b2",
    type: "prediction",
    skillRefs: ["recursion.core", "func.return", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тақтада n саны тұр. Бір жүрісте не 1 азайтуға, не екіге бөліп бүтін бөлігін алуға болады (`n / 2` — бүтін бөлу, мысалы 5-тен 2 шығады). Нөлге жеткенде ойын бітеді. `moves(n)` — нөлге жетудің тәсілдер саны. Екі тәсіл әртүрлі саналады, егер жүрістердің тізбегі әртүрлі болса — сол сандардан өтсе де. Бағдарлама нені шығарады?",
      ru: "На доске стоит число n. За один ход можно либо вычесть 1, либо разделить на два и взять целую часть (`n / 2` — целочисленное деление, например из 5 получается 2). Как только дошли до нуля, игра окончена. `moves(n)` — это количество способов дойти до нуля. Два способа считаются разными, если различается последовательность ходов, — даже если числа при этом получаются одни и те же. Что выведет программа?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int moves(int n) {\n" +
      "    if (n == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return moves(n - 1) + moves(n / 2);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << moves(4);\n" +
      "    return 0;\n" +
      "}",
    answer: "10",
    options: ["10", "3", "5", "16"],
    diagnosticMapping: {
      "3": {
        failureClass: "move_sequences_confused_with_number_sequences",
        justification:
          "4-тен нөлге түскенде пайда болатын әртүрлі САН тізбектері үшеу: 4-3-2-1-0, 4-3-1-0 және 4-2-1-0. Дәл 3 деген жауап сол сан тізбектерін санағанда шығады. Ал есепте жүрістердің тізбегі саналады: 2-ден 1-ге де, 1-ден 0-ге де екі түрлі жүріспен баруға болады, сондықтан олар бөлек-бөлек саналуы керек.",
      },
    },
  },
  {
    /*
     * «Айдың орталық құралы - шақырулар ағашы», written down rather than
     * watched. Two branches, and here they are literally two halves of the
     * list, so «қай тармақ қаралып жатыр» is answerable from `lo` and `hi`
     * alone — no extra parameter has to be invented to show it.
     *
     * The function is called `largest` on purpose. `m3.l8` wrote a `largest(a)`
     * that walks the list with a `for` and keeps a running `best`; this one does
     * the same job with no loop at all. Naming the callback in the prompt is
     * cheaper than a paragraph about what recursion is FOR.
     *
     * The midpoint is January's safe form, `lo + (hi - lo) / 2`. On four
     * elements it makes no difference to any value in the trace, which is
     * exactly why it belongs here: the habit is worth carrying where it costs
     * nothing, and a lesson that quietly reverted to `(lo + hi) / 2` would be
     * telling the learner that January's rule was decoration.
     *
     * Seven rows, all at the `return`, in the order the returns actually happen.
     * The shape is the payoff: rows 1–3 finish the left half completely before
     * row 4 touches the right half at all, and the row for the whole list is
     * last because it is the call that has been waiting the entire time. The
     * list is {4, 9, 2, 7} — the maximum sits at index 1, inside the left half,
     * so the last row cannot be filled by reading the end of the list.
     */
    id: "m6.l5.b3",
    type: "trace_code",
    skillRefs: ["recursion.call_tree", "recursion.core", "func.return", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "`largest(a, lo, hi)` тізімнің `lo`-дан `hi`-ге дейінгі бөлігіндегі ең үлкен санды қайтарады. Бөлікте бір ғана ұяшық қалса, жауап — сол ұяшық. Әйтпесе бөлік қақ жарылады (қаңтардағы қауіпсіз орта: `lo + (hi - lo) / 2`), әр жартының өз ең үлкені табылады да, солардың үлкені алынады. Қарашада `largest` дәл сол жұмысты циклмен істеген еді; мұнда цикл мүлде жоқ, оның орнына екі шақыру тұр.\n\n16-жол — шақыру нәтижесін қайтарып жатқан сәт. Ол әр орындалған сайын `lo`, `hi` және `answer` мәндерін жаз; жолдар орындалу ретімен жүреді. Әр жолды толтырып отырып өзіңе айт: бұл шақыру тізімнің қай бөлігін қарап тұр? Ең соңғы жол неге бүкіл тізім туралы?",
      ru: "`largest(a, lo, hi)` возвращает наибольшее число в куске списка от `lo` до `hi`. Если в куске осталась одна клетка, ответ — эта клетка. Иначе кусок делится пополам (январская безопасная середина: `lo + (hi - lo) / 2`), в каждой половине находится своё наибольшее, и берётся большее из двух. В ноябре `largest` делал ту же работу циклом; здесь цикла нет совсем, вместо него два вызова.\n\nСтрока 16 — момент, когда вызов возвращает результат. После каждого её выполнения записывай значения `lo`, `hi` и `answer`; строки идут в порядке выполнения. Заполняя очередную строку, проговаривай про себя: какой кусок списка рассматривает этот вызов? Почему самая последняя строка — про весь список?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int largest(vector<int>& a, int lo, int hi) {\n" +
      "    int answer;\n" +
      "    if (lo == hi) {\n" +
      "        answer = a[lo];\n" +
      "    } else {\n" +
      "        int mid = lo + (hi - lo) / 2;\n" +
      "        int left = largest(a, lo, mid);\n" +
      "        int right = largest(a, mid + 1, hi);\n" +
      "        answer = max(left, right);\n" +
      "    }\n" +
      "    return answer;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> nums = {4, 9, 2, 7};\n" +
      "    cout << largest(nums, 0, 3);\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 16, vars: { lo: "0", hi: "0", answer: "4" } },
      { line: 16, vars: { lo: "1", hi: "1", answer: "9" } },
      { line: 16, vars: { lo: "0", hi: "1", answer: "9" } },
      { line: 16, vars: { lo: "2", hi: "2", answer: "2" } },
      { line: 16, vars: { lo: "3", hi: "3", answer: "7" } },
      { line: 16, vars: { lo: "2", hi: "3", answer: "7" } },
      { line: 16, vars: { lo: "0", hi: "3", answer: "9" } },
    ],
  },
  {
    /*
     * The month's central tool turned into a number, and that number is April's
     * opening. No code on this card: the game was on screen two cards ago, the
     * rule fits in one sentence, and reprinting a program in order to ask a
     * question about it is how a card becomes transcription.
     *
     * The tree of moves(4) really does contain 19 nodes — moves(0) ten times,
     * moves(1) five times, moves(2) twice — for five distinct questions. Both
     * halves of every option are live, the way `m6.l1.b4` does it: the count and
     * the claim about the count.
     *
     * o3 («5 шақыру») is left unmapped on purpose. Five is the number of
     * different arguments AND the number of levels the tree is deep, and those
     * are two different misunderstandings, so the engine should ask rather than
     * tell a fourteen-year-old which one they made.
     */
    id: "m6.l5.b4",
    type: "multiple_choice",
    skillRefs: ["recursion.call_tree", "recursion.core", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Осы сабақтың басындағы ойынды еске түсір: `moves(0)` бірді қайтарады, ал n > 0 болғанда `moves(n)` = `moves(n - 1)` + `moves(n / 2)`. `moves(4)` шақырылғандағы шақырулар ағашын қағазға сал да, функцияның барлығы неше рет шақырылғанын сана — ең бірінші `moves(4)` шақыруының өзін де қосып. Қай тұжырым дұрыс?",
      ru: "Вспомни игру из начала этого урока: `moves(0)` возвращает единицу, а при n > 0 `moves(n)` = `moves(n - 1)` + `moves(n / 2)`. Нарисуй на бумаге дерево вызовов для `moves(4)` и посчитай, сколько всего раз была вызвана функция — считая и самый первый вызов `moves(4)`. Какое утверждение верно?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "19 шақыру — ал әртүрлі сұрақ бесеу ғана, moves(0)-ден moves(4)-ке дейін, сондықтан кейбір жауап бірнеше рет қайта есептеледі",
          ru: "19 вызовов — а разных вопросов всего пять, от moves(0) до moves(4), поэтому некоторые ответы вычисляются заново по нескольку раз",
        },
      },
      {
        id: "o2",
        label: {
          kk: "19 шақыру — және бірде-бір сұрақ қайталанбайды, әр шақырудың аргументі өзгеше",
          ru: "19 вызовов — и ни один вопрос не повторяется, у каждого вызова свой аргумент",
        },
      },
      {
        id: "o3",
        label: {
          kk: "5 шақыру — n-нің әр мәні үшін бір реттен",
          ru: "5 вызовов — по одному на каждое значение n",
        },
      },
      {
        id: "o4",
        label: {
          kk: "10 шақыру — тәсілдердің саны қанша болса, шақырулар да сонша",
          ru: "10 вызовов — сколько существует способов, столько и вызовов",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "repeated_subcall_not_noticed",
        justification:
          "Шақырулар саны дұрыс табылған, демек ағаш дұрыс салынған. Бірақ дәл сол ағашта moves(2) екі рет, moves(1) бес рет, moves(0) он рет кездеседі. «Бірде-бір сұрақ қайталанбайды» деген тұжырым ағаштағы аргументтерді бір-бірімен салыстырып шықпағанда ғана жасалады.",
      },
      o4: {
        failureClass: "return_value_read_as_call_count",
        justification:
          "10 — бұл функцияның ЖАУАБЫ, яғни нөлге жетудің тәсілдер саны, ал сұрақ шақырулардың саны туралы еді. Дәл осы сан ойынның жауабын шақырулар санының орнына қойғанда шығады.",
      },
    },
  },
  {
    /*
     * The base cases of a two-branch recursion, merged with an `||` that hides a
     * real difference: «керекті салмақ дәл жиналды» and «гір қалмады» are not
     * the same event, and only the first of them is a way. On `2 3 5` with
     * s = 4 the broken version answers yes to a question whose answer is
     * plainly no — every leaf of the tree reports success.
     *
     * The question this card asks is DECIDE, not COUNT, so its repaired program
     * is nobody's answer here: `b1` counts on the same tree and `b8` maximises
     * on it, and all three programs are different.
     *
     * symptomInput is mandatory: the fallback probe feeds a single number, this
     * program wants a count, a list and then s, and both versions would sit
     * waiting on the probe — the defect would read as absent.
     *
     * The input format gained a leading `n` because `cin >>` reads tokens and
     * cannot find the end of a line by itself.
     */
    id: "m6.l5.b5",
    type: "find_bug",
    skillRefs: ["recursion.base_case", "enumerate.all", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама берілген гірлердің бір бөлігін таңдап, дәл s грамм жинауға бола ма — соны тексеруі керек: болса `yes`, болмаса `no` деген ағылшын сөзін шығарады, басқа сөз шықпайды. Бірінші жолда гірлердің саны n, екінші жолда олардың салмағы бос орынмен бөлініп беріледі (бәрі оң сандар), үшінші жолда s тұр. Бірақ n = 3, гірлер 2 3 5 және s = 4 болғанда бағдарлама `no` орнына `yes` шығарады. Қай жол кінәлі және неге?",
      ru: "Программа должна проверить, можно ли выбрать часть данных гирь так, чтобы получилось ровно s граммов: если можно, она выводит английское слово `yes`, если нет — `no`, других слов она не выводит. В первой строке дано число гирь n, во второй через пробел их веса (все положительные), в третьей — s. Но при n = 3, гирях 2 3 5 и s = 4 программа выводит `yes` вместо `no`. Какая строка виновата и почему?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int can(vector<int>& a, int i, int rest) {\n" +
      "    int n = a.size();\n" +
      "    if (rest == 0 || i == n) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (can(a, i + 1, rest - a[i]) == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return can(a, i + 1, rest);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> w(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> w[i];\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    if (can(w, 0, s) == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 7,
    symptomInput: "3\n2 3 5\n4",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int can(vector<int>& a, int i, int rest) {\n" +
      "    int n = a.size();\n" +
      "    if (rest == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (i == n) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    if (can(a, i + 1, rest - a[i]) == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return can(a, i + 1, rest);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> w(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> w[i];\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    if (can(w, 0, s) == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "8": {
        failureClass: "base_case_value_blamed_for_merged_condition",
        justification:
          "Сегізінші жол — тоқтату шартының жауабы, ал ол `rest == 0` жағдайы үшін дұрыс: керекті салмақ дәл жиналса, бұл шынымен де бір табылған тәсіл. Бұл жолды таңдау — жоғарыдағы шарттың ішінде екі бөлек жағдай бір `||` арқылы қосылып тұрғанын байқамай, қайтарылатын мәнді кінәлағанды білдіреді.",
      },
    },
  },
  {
    /*
     * PDF p.9 names «факториал мен дәрежені», «сөз симметриясы», «0 мен 1-ден
     * тұратын тізбектер» and «тордағы жолдар» — it does not name the stairs, so
     * this is product-authored and does not claim otherwise. What it implements
     * is February's monthly-check sentence, «Тоқтау шарты дұрыс қойылған,
     * өзін-өзі шақыратын функция жазу», on a problem no other lesson owns.
     *
     * THE CAP MOVED FROM 25 TO 35, AND THE PROMPT'S ARITHMETIC MOVED WITH IT.
     * The tree of `climb(n)` holds exactly 2·Fib(n + 2) − 1 calls. The Python
     * prompt's cap of 25 protects against 392 835 of them, which is a Python
     * limit and not a limit at all here. Against ~10⁸ steps per second:
     * n = 35 is 48 315 633 calls, n = 36 is 78 176 337, and n = 37 is
     * 126 491 971 — over. So 35 is the honest cap and it is the number the
     * prompt now argues from, with `35` added as a hidden case so the top of
     * the range is executed rather than promised.
     *
     * Depth is NOT the constraint and the prompt says which one is: 35 nested
     * calls is nothing, while 48 million calls in a tree 35 wide is most of a
     * second. That distinction is the one `m6.l4.b1` asks them to make.
     *
     * "Write it recursively" is guidance, not a graded rule (contract §4,
     * option 2) — a `while` loop printing the same number passes, and the prompt
     * says the checker compares only the number. The half that IS graded is the
     * stopping condition: the hidden `1` kills a solution whose only base case
     * is `n == 0`, because a two-step from n = 1 lands on −1 and walks straight
     * past it — in C++ that program does not stop at all.
     */
    id: "m6.l5.b6",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "enumerate.all"],
    sourceType: "product-authored",
    prompt: {
      kk: "Баспалдақта n қадам бар (1 ≤ n ≤ 35). Бір аттағанда 1 қадамға немесе 2 қадамға көтерілуге болады. Ең жоғарыға шығудың неше түрлі жолы бар? Екі жол әртүрлі саналады, егер аттаулардың тізбегі әртүрлі болса. Мысалы n = 4 болғанда жауап 5. Тек сол бір санды шығар.\n\nn неге небәрі 35? Себебі бұл шешім бір сұрақтың жауабын бірнеше рет қайта есептейді: n = 35 болғанда функция шамамен 48 000 000 рет шақырылады, ал әртүрлі сұрақ небәрі 36 — climb(0)-ден climb(35)-ке дейін. n = 37 болса, шақырулар саны 126 000 000-нан асады да, секундтық 100 000 000 шектен шығады. Байқа: мұнда қымбат тұратын нәрсе — ағаштың ТЕРЕҢДІГІ емес (ол небәрі 35), ал оның ЕНІ. Дәл осы артық жұмысты сәуірде жоямыз: сонда әр жауапты бір рет есептеп, есте сақтауды үйренеміз.\n\nЖауап `int`-ке сыяды: n = 35 үшін ол 14 930 352. Есепті осы айдың тәсілімен — өзін-өзі шақыратын функциямен — жаз. Тексеруші тек шыққан санды салыстырады, сондықтан бұл ереже емес, кеңес; бірақ ай соңындағы сынақта дәл осы тәсіл сұралады. Тоқтату шартын бірінші жаз да, бір аттауда 2 қадам көтерілгенде баспалдақтан асып кетуге бола ма — соны алдын ала ойлан.",
      ru: "На лестнице n ступенек (1 ≤ n ≤ 35). За один шаг можно подняться на 1 ступеньку или на 2. Сколькими разными способами можно подняться до самого верха? Два способа считаются разными, если различается последовательность шагов. Например, при n = 4 ответ 5. Выведи только это одно число.\n\nПочему n не больше 35? Потому что это решение по нескольку раз пересчитывает ответ на один и тот же вопрос: при n = 35 функция вызывается примерно 48 000 000 раз, а разных вопросов всего 36 — от climb(0) до climb(35). Уже при n = 37 вызовов становится больше 126 000 000, и секундный предел в 100 000 000 оказывается пройден. Обрати внимание: дорого здесь обходится не ГЛУБИНА дерева (она всего 35), а его ШИРИНА. Именно эту лишнюю работу мы уберём в апреле: научимся считать каждый ответ один раз и запоминать его.\n\nОтвет помещается в `int`: при n = 35 это 14 930 352. Реши задачу приёмом этого месяца — функцией, вызывающей саму себя. Проверяющая программа сравнивает только выведенное число, так что это совет, а не обязательное правило; но на проверке в конце месяца спросят именно этот приём. Условие остановки напиши первым и заранее продумай: можно ли, шагнув сразу на 2 ступеньки, перескочить через верх лестницы?",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int climb(int n) {\n" +
      "    if (n == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (n < 0) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return climb(n - 1) + climb(n - 2);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    cout << climb(n);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4", expectedOutput: "5" },
      { input: "2", expectedOutput: "2" },
      { input: "1", expectedOutput: "1", hidden: true },
      { input: "3", expectedOutput: "3", hidden: true },
      { input: "5", expectedOutput: "8", hidden: true },
      { input: "12", expectedOutput: "233", hidden: true },
      { input: "25", expectedOutput: "121393", hidden: true },
      { input: "35", expectedOutput: "14930352", hidden: true },
    ],
  },
  {
    /*
     * The lesson's counterweight, and it is here for a reason that only makes
     * sense next to `b6`: a recursion is not slow because it is a recursion. It
     * is slow when it asks the same question again. Euclid's rule shrinks the
     * problem so fast that a billion is over in a few dozen steps, and the
     * learner meets the two extremes on consecutive cards.
     *
     * One call per step, no branching, no undo — well inside the programme's
     * limit for the whole group, and about forty frames deep at worst.
     *
     * "Write it recursively" is guidance again (contract §4, option 2), but the
     * constraint does real grading here, which is option 1 doing the part it can
     * genuinely do: `1000000000 1` and `1000000000 999999999` kill every
     * solution that steps down one at a time, whether it is written as a
     * subtraction recursion or as a scan over the divisors of the smaller
     * number. In C++ the subtraction recursion fails for a second reason worth
     * naming in the prompt: a billion nested calls run out of stack, and there
     * is no message when they do.
     */
    id: "m6.l5.b7",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "arith.remainder", "func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген екі натурал сан беріледі: a және b (1 ≤ a, b ≤ 1 000 000 000). Олардың ең үлкен ортақ бөлгішін шығар — екеуін де қалдықсыз бөлетін сандардың ең үлкенін. Мысалы 12 бен 18 үшін жауап 6.\n\nМұнда рекурсия есептің өз тұжырымынан шығады. Евклид ережесі былай дейді: егер b нөлге тең болса, жауап — a; әйтпесе a мен b-нің ортақ бөлгіштері b мен `a % b`-нің ортақ бөлгіштерімен дәл сол күйінде бірдей. Яғни бір қадамда есеп дәл сондай, бірақ кішірек есепке айналады.\n\nЕң кіші саннан бастап барлық бөлгішті бір-бірлеп тексеру мұнда жарамайды: сандар 1 000 000 000-ға дейін болғандықтан, ондай іріктеу бір секундқа сыймайды. Үлкен санынан кішісін бір-бірлеп алып отыратын рекурсия одан да жаман: ол миллиард рет тереңдейді, ал сонша шақыруға жад жетпейді — бағдарлама ешбір хабарсыз үзіліп қалады. Ал Евклид ережесі бірнеше ондаған қадаммен бітеді, яғни тереңдігі де қырықтан аспайды. Мұны да өзін-өзі шақыратын функциямен жаз — тексеруші тек шыққан санды салыстырады, сондықтан бұл кеңес.",
      ru: "В одной строке через пробел даны два натуральных числа: a и b (1 ≤ a, b ≤ 1 000 000 000). Выведи их наибольший общий делитель — самое большое число, которое делит без остатка и a, и b. Например, для 12 и 18 ответ 6.\n\nРекурсия здесь следует из самой формулировки задачи. Правило Евклида говорит: если b равно нулю, ответ — это a; иначе общие делители a и b ровно те же, что и общие делители b и `a % b`. То есть за один шаг задача превращается в такую же, но меньшую.\n\nПеребирать все делители подряд, начиная с меньшего числа, здесь не годится: числа доходят до 1 000 000 000, и такой перебор не уложится в секунду. Рекурсия, в которой из большего числа раз за разом вычитают меньшее, ещё хуже: она уйдёт вглубь миллиард раз, а памяти на столько вызовов не хватит — программа оборвётся без всякого сообщения. А правило Евклида заканчивается за несколько десятков шагов, то есть и глубина не превысит сорока. Это тоже напиши функцией, вызывающей саму себя, — проверяющая программа сравнивает только выведенное число, так что это совет.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int gcd(int a, int b) {\n" +
      "    if (b == 0) {\n" +
      "        return a;\n" +
      "    }\n" +
      "    return gcd(b, a % b);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int x, y;\n" +
      "    cin >> x >> y;\n" +
      "    cout << gcd(x, y);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "12 18", expectedOutput: "6" },
      { input: "7 13", expectedOutput: "1" },
      { input: "1 1", expectedOutput: "1", hidden: true },
      { input: "10 10", expectedOutput: "10", hidden: true },
      { input: "48 18", expectedOutput: "6", hidden: true },
      { input: "17 51", expectedOutput: "17", hidden: true },
      { input: "1000000000 1", expectedOutput: "1", hidden: true },
      { input: "1000000000 999999999", expectedOutput: "1", hidden: true },
      { input: "1000000000 1000000000", expectedOutput: "1000000000", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for `m6.l5.b8`, not an extra card on top of it. PDF
     * p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ».
     * Same problem, same input format, same limits; three places are open, and
     * they are the three decisions the recursion is made of — where the walk
     * ends, what the limit becomes once a weight is taken, and which of the two
     * branches is the answer.
     *
     * The program is NOT `b8`'s reference solution with holes in it: it compares
     * the branches with an explicit `if` where the solution uses `max`. No
     * learner receives both cards, but a support learner who later moves to the
     * core route should not meet the same text twice.
     *
     * The prompt states the whole problem and points at no neighbouring card:
     * `b8` is stripped on this route, so «жоғарыдағы тапсырма» would name
     * something this learner never sees — the defect found at `m2.l1.b8s`.
     */
    id: "m6.l5.b8s",
    type: "fill_blank",
    skillRefs: ["recursion.core", "enumerate.all", "func.parameters"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "n гір мен L шектеуі берілген. Гірлердің бір бөлігін таңдап, олардың қосынды салмағын мүмкіндігінше үлкен, бірақ L-ден аспайтын етіп жинау керек. Осы ең үлкен қосындыны шығару керек; ештеңе таңдамауға да болады, сонда қосынды 0. Бірінші жолда бос орынмен бөлінген n мен L (1 ≤ n ≤ 16, 0 ≤ L ≤ 1 000 000 000), екінші жолда n гірдің салмағы (әрқайсысы 1-ден 1 000 000-ға дейін).\n\nБағдарлама дайын, бірақ үш жері жоқ. `fit(a, i, room)` — `i` орнынан бастап тұрған гірлермен `room` шектеуіне сыятын ең үлкен қосынды. Тізім `vector<int>& a` деп сілтеме бойынша беріледі, ал ұзындығы `int n = a.size();` жолында алынған. `skip` — гірді алмағандағы жауап, `take` — алғандағы жауап. Толықтыр: іріктеу қай жерде бітеді, гірді алғаннан кейін шектеу қандай болып қалады және екі тармақтың қайсысы жауап болады.",
      ru: "Даны n гирь и ограничение L. Нужно выбрать часть гирь так, чтобы их суммарный вес был как можно больше, но не превышал L. Выведи этот наибольший суммарный вес; можно не брать ничего, тогда сумма равна 0. В первой строке через пробел даны n и L (1 ≤ n ≤ 16, 0 ≤ L ≤ 1 000 000 000), во второй — веса n гирь (каждый от 1 до 1 000 000).\n\nПрограмма готова, но в ней не хватает трёх мест. `fit(a, i, room)` — это наибольшая сумма, которая помещается в ограничение `room`, если брать гири начиная с позиции `i`. Список передаётся по ссылке как `vector<int>& a`, а его длина взята в строке `int n = a.size();`. `skip` — ответ, когда гирю не берут, `take` — когда берут. Дополни: где заканчивается перебор, каким становится ограничение после того, как гирю взяли, и какая из двух ветвей оказывается ответом.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int fit(vector<int>& a, int i, int room) {\n" +
      "    int n = a.size();\n" +
      "    if (i == ___) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    int skip = fit(a, i + 1, room);\n" +
      "    if (a[i] > room) {\n" +
      "        return skip;\n" +
      "    }\n" +
      "    int take = a[i] + fit(a, i + 1, ___);\n" +
      "    if (take > skip) {\n" +
      "        return ___;\n" +
      "    }\n" +
      "    return skip;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n, limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<int> w(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> w[i];\n" +
      "    cout << fit(w, 0, limit);\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "n", alternatives: ["(int)a.size()"] },
      { id: "f2", answer: "room - a[i]", alternatives: ["room-a[i]"] },
      { id: "f3", answer: "take" },
    ],
  },
  {
    /*
     * The lesson's join, asked for in full: an enumeration of every subset, a
     * recursion to carry it, and a limit that makes the answer more than a
     * count. The tree is `b1`'s tree exactly — take this weight or do not — but
     * what comes back up it is a maximum instead of a sum, so no program on any
     * earlier card is the answer to this one.
     *
     * Still not backtracking: `fit` returns a number and changes nothing outside
     * itself, so there is no choice to undo when a call comes back. The
     * programme's «күрделі кері қайту» limit is not in play.
     *
     * The prompt explains why the recursion is the natural instrument — n
     * differs from test to test, so no fixed nesting of `for` lines walks the
     * variants — and asserts no rule, because a solution enumerating subsets
     * with a bitmask would also pass and the product could not tell.
     *
     * Arithmetic: at most 16 weights of at most 1 000 000, so the largest
     * possible sum is 16 000 000 and `int` is right; the tree has 2¹⁶ = 65 536
     * leaves, which is nothing.
     *
     * Core and advanced write it; support meets `m6.l5.b8s`.
     */
    id: "m6.l5.b8",
    type: "challenge",
    skillRefs: ["recursion.core", "enumerate.all", "recursion.call_tree"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "n гір мен L шектеуі берілген. Гірлердің бір бөлігін таңдап, қосынды салмағын мүмкіндігінше үлкен, бірақ L-ден аспайтын етіп жина. Осы ең үлкен қосындыны шығар — тек сол бір санды. Ештеңе таңдамауға да болады, сонда қосынды 0.\n\nБірінші жолда бос орынмен бөлінген n мен L (1 ≤ n ≤ 16, 0 ≤ L ≤ 1 000 000 000), екінші жолда n гірдің салмағы, бос орынмен бөлініп (әрқайсысы 1-ден 1 000 000-ға дейінгі бүтін сан). Мысалы n = 4, L = 10 және салмақтары 3 4 5 7 болса, жауап 10: бұл 3 + 7. Ең үлкен мүмкін қосынды 16 · 1 000 000 = 16 000 000 болғандықтан, `int` жеткілікті.\n\nСыйып тұрғанның бәрін солдан оңға қарай ала беретін ашкөз тәсіл мұнда жарамайды: жаңа ғана айтылған мысалда ол алдымен 3-ті, содан кейін 4-ті алады да, қосындысы 7 болып тоқтап қалады — қалған екі гірдің ешқайсысы енді сыймайды. Нұсқаларды толық қарау керек, ал n = 16 болғанда олардың саны 65 536 — секундтық шектен әлдеқайда аз. Гірлердің саны әр тексеруде әртүрлі болғандықтан, кірістірілген циклдердің саны да әртүрлі болуы керек еді, ал оны кодта жазып қою мүмкін емес. Сондықтан әр гір үшін «аламын / алмаймын» деген екі тармақты сабақтың басындағыдай функцияның өзіне тапсыр.",
      ru: "Даны n гирь и ограничение L. Выбери часть гирь так, чтобы суммарный вес был как можно больше, но не превышал L. Выведи этот наибольший вес — только одно число. Можно не брать ничего, тогда сумма равна 0.\n\nВ первой строке через пробел даны n и L (1 ≤ n ≤ 16, 0 ≤ L ≤ 1 000 000 000), во второй — веса n гирь через пробел (каждый — целое число от 1 до 1 000 000). Например, при n = 4, L = 10 и весах 3 4 5 7 ответ равен 10: это 3 + 7. Наибольшая возможная сумма — 16 · 1 000 000 = 16 000 000, поэтому `int` здесь достаточно.\n\nЖадный способ — брать слева направо всё, что влезает, — здесь не годится: в только что названном примере он возьмёт сначала 3, потом 4 и остановится на сумме 7, потому что ни одна из двух оставшихся гирь туда уже не помещается. Нужно просмотреть все варианты, а при n = 16 их 65 536 — намного меньше секундного предела. Число гирь в каждой проверке своё, поэтому и число вложенных циклов должно было бы меняться, а записать такое в коде невозможно. Значит, две ветви «беру / не беру» для каждой гири поручи самой функции, как в начале урока.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int fit(vector<int>& a, int i, int room) {\n" +
      "    int n = a.size();\n" +
      "    if (i == n) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    int skip = fit(a, i + 1, room);\n" +
      "    if (a[i] > room) {\n" +
      "        return skip;\n" +
      "    }\n" +
      "    int take = a[i] + fit(a, i + 1, room - a[i]);\n" +
      "    return max(take, skip);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n, limit;\n" +
      "    cin >> n >> limit;\n" +
      "    vector<int> w(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> w[i];\n" +
      "    cout << fit(w, 0, limit);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Kills the DESCENDING greedy, which answers 5. The prompt rules out the left-to-right
         greedy by name and this is the next thing a learner tries; m8.l2.b5 exists in April to
         break exactly this rule, and February never asked it. */
      { input: "3 7\n5 4 3", expectedOutput: "7", hidden: true },
      { input: "4 10\n3 4 5 7", expectedOutput: "10" },
      { input: "3 5\n6 7 8", expectedOutput: "0" },
      { input: "1 5\n5", expectedOutput: "5", hidden: true },
      { input: "1 5\n6", expectedOutput: "0", hidden: true },
      { input: "2 0\n1 2", expectedOutput: "0", hidden: true },
      { input: "5 11\n4 4 4 4 4", expectedOutput: "8", hidden: true },
      { input: "3 5\n3 5 1", expectedOutput: "5", hidden: true },
      { input: "3 2\n5 6 2", expectedOutput: "2", hidden: true },
      { input: "6 13\n8 5 5 3 3 2", expectedOutput: "13", hidden: true },
      {
        input: "16 100\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16",
        expectedOutput: "100",
        hidden: true,
      },
      {
        input:
          "16 1000000000\n1000000 999999 999998 999997 999996 999995 999994 999993 " +
          "999992 999991 999990 999989 999988 999987 999986 999985",
        expectedOutput: "15999880",
        hidden: true,
      },
    ],
  },
  {
    /*
     * ADVANCED ONLY — «шешімді жазбаша қорғау міндетті» (p.6) — and it is where
     * the structural claims of `b6` and `b8` are actually checked by somebody
     * (contract §4, option 3). It is also February's own check sentence in
     * advance: «Тоқтау шарты дұрыс қойылған, өзін-өзі шақыратын функция жазу
     * және салынған ағаш бойынша шақыру ретін түсіндіру».
     *
     * Two questions, not four: this is a ten-minute lesson and the written
     * defence has to fit inside it. Both cards it names — the stairs and the
     * weights — are received by the advanced route, so the reference is true for
     * every learner who sees this block.
     *
     * The fourth marking point carries the distinction a teacher needs and a
     * confident wrong answer misses: an argument that SHRINKS is not the same as
     * an argument that LANDS on the stopping value. `climb` needs the second
     * base case precisely because a two-step from n = 1 lands on −1; `fit` needs
     * only one because `i` moves by exactly 1 and cannot skip `n`. The C++
     * consequence is named there too: a missed landing is not an error message,
     * it is a program that stops existing.
     *
     * Never machine-scored: the verdict settles as `unknown` and a teacher
     * reads it.
     */
    id: "m6.l5.b9",
    type: "explain",
    skillRefs: ["recursion.base_case", "recursion.core", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Жаңа ғана жазған екі шешіміңді — баспалдақ есебі мен гірлер есебін — жазбаша қорға. Екі сұраққа қысқа жауап жаз.\n\n1) Әр функция неге тоқтайды? Ол қай жағдайда ешкімді шақырмай жауап береді, және кез келген кіріс сол жағдайға неге міндетті түрде жетеді — мұны әр шақыруда нақты нені кішірейетінін атап көрсетіп дәлелде.\n\n2) Функцияң барлық нұсқаны қарап шыққанына қалай сенімдісің? Гірлер есебіндегі екі тармақты ата да, неге бірде-бір нұсқа екеуіне бірдей кірмейтінін әрі неге бірде-бір нұсқа екеуінен де тыс қалмайтынын түсіндір.\n\nЖауабыңды мұғалім оқиды.",
      ru: "Защити письменно два решения, которые ты только что написал, — задачу про лестницу и задачу про гири. Ответь коротко на два вопроса.\n\n1) Почему каждая функция останавливается? В каком случае она возвращает ответ, никого не вызывая, и почему любой вход обязательно доходит до этого случая — обоснуй это, назвав, что именно уменьшается на каждом вызове.\n\n2) Почему ты уверен, что функция просмотрела все варианты? Назови две ветви в задаче про гири и объясни, почему ни один вариант не попадает в обе сразу и почему ни один не остаётся вне обеих.\n\nТвой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "Баспалдақ есебінде функция ешкімді шақырмай жауап беретін екі жағдай бар: қадам қалмағанда (n = 0) — бұл бір дайын жол, және баспалдақтан асып кеткенде (n теріс) — бұл жол емес, сондықтан 0.",
        ru: "В задаче про лестницу есть два случая, в которых функция отвечает, никого не вызывая: ступенек не осталось (n = 0) — это один готовый способ, и мы перешагнули через верх (n отрицательное) — это не способ, поэтому 0.",
      },
      {
        kk: "Ол жағдайларға міндетті түрде жетеміз, себебі әр шақыруда n не 1-ге, не 2-ге кемиді және ешқашан өспейді. Сондықтан шақырулар тізбегі шектеулі: n ең көбі n қадамнан кейін нөлге не теріс санға түседі, яғни тереңдігі 35-тен аспайды.",
        ru: "До этих случаев мы обязательно доходим, потому что на каждом вызове n уменьшается либо на 1, либо на 2 и никогда не растёт. Значит, цепочка вызовов конечна: не более чем за n шагов n опустится до нуля или уйдёт в минус, то есть глубина не превысит 35.",
      },
      {
        kk: "Гірлер есебінде тоқтату шарты — `i` тізімнің соңына жетуі. Оған әрқашан жетеміз, себебі `i` әр шақыруда дәл 1-ге өседі, ал гірлердің саны шектеулі: салмақтардың қандай болғанына мүлде байланысты емес.",
        ru: "В задаче про гири условие остановки — `i` дошёл до конца списка. До него мы доходим всегда, потому что `i` растёт ровно на 1 на каждом вызове, а число гирь конечно: от самих весов это никак не зависит.",
      },
      {
        kk: "Екі тармақ — «бұл гірді аламын» және «алмаймын». Кез келген нұсқада бұл гір не алынған, не алынбаған, сондықтан ол дәл бір тармаққа кіреді: үшінші мүмкіндік жоқ, ал екеуіне бірдей кіру мүмкін емес. Демек екі тармақтың жауабын салыстыру барлық нұсқаны дәл бір реттен қамтиды.",
        ru: "Две ветви — «беру эту гирю» и «не беру». В любом варианте эта гиря либо взята, либо нет, поэтому вариант попадает ровно в одну ветвь: третьей возможности нет, а попасть в обе сразу невозможно. Значит, сравнение ответов двух ветвей охватывает все варианты ровно по одному разу.",
      },
      {
        kk: "Мұғалімге ескерту: күшті жауап «аргумент кішірейеді» мен «аргумент тоқтау нүктесіне дәл түседі» дегенді ажыратады. Баспалдақ есебінде екінші тоқтату шарты дәл сол себепті керек: n = 1 болғанда 2 қадам аттасақ, −1-ге түсеміз де, нөлдің үстінен аттап өтеміз. Гірлер есебінде екінші шарт керек емес, себебі `i` дәл 1-ге өседі және `n`-ды аттап өте алмайды. C++-та мұның бағасы жоғары: аттап өтілген шарт қате хабары емес, ешбір хабарсыз үзіліп қалатын бағдарлама береді.",
        ru: "Замечание для учителя: сильный ответ различает «аргумент уменьшается» и «аргумент попадает точно в точку остановки». В задаче про лестницу второе условие остановки нужно именно поэтому: при n = 1 шаг на 2 ступеньки приводит к −1, то есть перешагивает через ноль. В задаче про гири второе условие не нужно, потому что `i` растёт ровно на 1 и не может перепрыгнуть через `n`. В C++ цена этой ошибки высока: пропущенное условие даёт не сообщение об ошибке, а программу, которая обрывается молча.",
      },
    ],
  },
];
