import type { LessonBlock } from "../../types";

/**
 * Month 6 · Ақпан — the monthly check. Twenty minutes. PDF p.9.
 *
 * February's «Айлық сынақ» sentence is one line and it names two things, in
 * this order:
 *
 *   > Тоқтау шарты дұрыс қойылған, өзін-өзі шақыратын функция жазу және
 *   > салынған ағаш бойынша шақыру ретін түсіндіру.
 *
 * Write a self-calling function **with the stopping condition correctly
 * placed**, and explain **the order of calls from the tree that was drawn**.
 * Both halves are graded work, so both are blocks, and the split between them
 * is most of what this file is about: `b1` and `b3` are the first clause, `b2`
 * and `b4` are the second.
 *
 * ## The four blocks and the clock
 *
 *   b1  unseen problem, blank editor              ~10 min
 *   b2  paper trace of a five-call tree            ~5 min
 *   b3  written, two questions about the base
 *       case of the learner's OWN function         ~3 min
 *   b4  oral, one continuous explanation            — runs alongside, while
 *                                                     the teacher circulates
 *
 * The validator's arithmetic is 12 (`unseen_problem`) + 5 (`manual_trace`) +
 * 4 (`explain`, two questions at two minutes) + 2 (`oral_explanation`, one
 * question) = 23 against a stated 20, and the number is written down here
 * rather than engineered away. Two ways of reaching 20 were available and both
 * were refused:
 *
 *   - collapsing `b3` to a single question. Its two questions are two
 *     answers; merging them into one sentence would buy two estimator-minutes
 *     without removing a minute of work, and would leave a fourteen-year-old
 *     marked against four points having been asked one vague thing.
 *   - moving "what happens if the base case is deleted" into `b2`, where a
 *     `manual_trace` is charged a flat six however much it asks. It would fit
 *     there — it is a paper-execution question — but it would be asked about
 *     `rabbits`, and the version worth asking is the one about the function
 *     the learner personally just wrote.
 *
 * What the estimate genuinely over-charges is `b1` and `b2`, both of which sit
 * at the bottom of their categories: the reference solution is a three-line
 * function, and the tree is five calls. Twenty-one of the estimated minutes are written work
 * the whole class does at once; `b4` is the piece the estimator cannot model,
 * because the teacher hears it while everyone else is still on `b1`. If a
 * lesson runs short, `b4` is the block that moves — it is the only one that
 * does not need a desk.
 *
 * The trace is deliberately FIVE calls and not nine. `rabbits(5)` would draw a
 * prettier tree and cost a fourteen-year-old four more minutes of bookkeeping,
 * and this check is on whether they can say what the order MEANS, not on their
 * stamina. `rabbits(4)` still branches, still repeats a call, and still puts
 * the deepest return first.
 *
 * ## Why «екі есе арту» and not one of the five practice families
 *
 * «Бейтаныс есеп» means unseen. February's practice paragraph lists five
 * families — all pairs and triples with a property, factorial and power by
 * self-call, word symmetry the same way, all short 0/1 sequences, paths in a
 * small grid — and every one of them is taught in `m6.l1`–`m6.l6`: the pairs
 * and triples in `l1` and `l2`, factorial and power in `l3`, symmetry in `l4`,
 * the sequences and the grid in `l6`. So none of them can be the unseen
 * problem.
 *
 * Doubling to a threshold is in none of them, and it was chosen for one
 * property the five do not have: **its parameter grows**. Every recursion the
 * month has shown shrinks something visible — `n - 1`, `n / 10`, `s.substr(1)`,
 * `left - 1` — so «кішірек есеп» has quietly come to mean «кішірек сан». Here
 * `a` doubles and `b` never moves, and the problem still gets smaller, because
 * what shrinks is the distance left to cover. A learner who has understood the
 * month writes the same three lines; a learner who has memorised «аргументті
 * бірге азайт» has nothing to copy. That is also what makes `b3` worth asking:
 * "why is the stopping condition always reached" is a real question here and
 * an empty one for `n - 1`.
 *
 * ## What the C++ migration changed, and the one thing it changed in the code
 *
 * Three things, all of them forced:
 *
 * 1. **`b1` computes in `long long`, and the prompt says why.** `a` doubles
 *    until it reaches `b`, and with `b` allowed up to 1 000 000 000 the last
 *    doubling can produce a value near 2 000 000 000 — which is inside `int`,
 *    but only just, with `int` ending at 2 147 483 647. A monthly check is not
 *    the place to sail that close, and «қай түрді аласың» is a question this
 *    course has been asking since September. It is stated as reasoning, not as
 *    a rule: work out the largest value the program can hold, then pick the
 *    type.
 *
 * 2. **`b2`'s program names its two sub-results before adding them, and that
 *    is not a style choice.** In C++ the order in which the two operands of
 *    `+` are evaluated is NOT fixed by the language, so `rabbits(n - 1) +
 *    rabbits(n - 2)` may legally call the right branch first — and this whole
 *    block is a question about the ORDER of the printed calls. Written as
 *
 *        int left = rabbits(n - 1);
 *        int right = rabbits(n - 2);
 *        return left + right;
 *
 *    the order is guaranteed, because two statements run in the order they are
 *    written. The trace is identical to the Python original's; what changed is
 *    that it is now true rather than true-by-luck. `b4`'s third marking point
 *    says so out loud, which turns a language trap into a teachable fact.
 *
 * 3. **`b3` no longer promises `RecursionError`, because there is none.** Its
 *    third and fourth marking points used to say that Python counts the depth
 *    and stops at about a thousand frames with a named error. C++ counts
 *    nothing and raises nothing: the calls consume the stack until it is gone
 *    and the program stops, with no message — and a compiler is even entitled
 *    to turn a recursion that cannot terminate into something else entirely,
 *    so the observed behaviour is not fixed either. The marking points now say
 *    that, and end where `m6.l4.b1` ends: reason about the depth BEFORE
 *    running, because nothing will tell you afterwards.
 *
 * The bounds themselves did not move. 1 ≤ a, b ≤ 1 000 000 000 gives a
 * recursion at most thirty deep — the reasoning `b3`'s second question asks for
 * — and every answer in the case set is between 0 and 30.
 *
 * ## The structural requirement, and which of the three honest options this is
 *
 * "Solve it with a self-calling function" is a requirement output comparison
 * cannot see. Verified rather than assumed: the five-line `while` loop that
 * doubles `a` in place was run against all twelve cases and passes every one, and no case set a
 * source file can hold will change that — anything a recursion prints, a loop
 * can print.
 *
 * So this file takes **option 3 — send it to a human**, and words the prompt
 * with option 2's discipline. `b1`'s prompt states the requirement, and in the
 * same breath states who checks it: the machine compares the printed number,
 * and the learner explains their own function in `b3` in writing and in `b4`
 * out loud, both of which a teacher reads. Nothing here tells a fourteen-year-
 * old that a rule was enforced when it was not. It is also the shape the
 * programme itself asks for — «оқушы шешімді өз сөзімен түсіндіруге міндетті»
 * (p.4) — so the human check is not a consolation prize for a missing
 * checker, it is the assessment.
 *
 * ## The degenerate programs, and the case that kills each
 *
 * Every one of these was written out and executed against the full case set
 * before the cases were frozen, not argued about:
 *
 *   `a > b` instead of `a >= b`        → «3 24» answers 4, «5 5» answers 1,
 *   (the boundary, off by one)           «1 1» answers 1, «2 1024» answers 10
 *   base case returning 1, not 0       → «5 5», «10 3» and «1 1» answer 1;
 *                                        the visible «3 25» answers 5
 *   halving `b` instead of doubling    → the visible «3 25» answers 3, and
 *   `a` (integer division loses it)      «1 3», «2 1025», «1 1000000000» fail
 *   adding `a` each hour instead of    → the visible «3 25» answers 8
 *   doubling
 *   a stopping test of `a == b` only   → never fires on «3 25»; the numbers
 *                                        step 3, 6, 12, 24, 48 straight over
 *                                        `b`, and the calls never stop. In
 *                                        C++ that means the program dies with
 *                                        nothing on screen. This is `b3`'s
 *                                        fourth marking point.
 *
 * The last of those is a deliberate echo, not an accident: `m6.l4.b5` teaches
 * on numbers that a stopping test can be stepped straight over, and its
 * diagnostic mapping is named `base_case_skipped_by_parity`. The assessment
 * asks the same idea about a function the learner wrote themselves, on
 * doubling rather than on parity, which is what an assessment is for.
 *
 * The visible case is «3 25» and it is a middle case on purpose. It kills the
 * three shortcuts that are worth killing in public — the halving, the adding,
 * and the base case that returns 1 — while saying nothing about where the
 * boundary lands, because the boundary IS the thing February is checked on.
 * `a >= b` versus `a > b` shows up only where the doubling hits `b` exactly,
 * and every case that does is hidden.
 *
 * ## No diagnostic mappings here
 *
 * `b1` is graded by running a program and the other three are read by a
 * person. A wrong number in `b1` has several possible causes — the strict
 * comparison, the wrong value returned by the base case, an hour counted
 * before it is needed — and the contract is explicit that an answer with more
 * than one cause gets no mapping, so the pipeline emits `unattributed_failure`
 * and the engine asks instead of telling a fourteen-year-old something false
 * about their own mind.
 *
 * ## What is deliberately left for later
 *
 * `rabbits(2)` is computed twice in `b2`'s tree and the last marking point of
 * `b4` asks the learner to NOTICE that, not to fix it. Remembering an answer
 * so the tree does not recompute it is April's «есте сақтау» (p.10); naming
 * the technique here would spend a month that has not started. Backtracking is
 * not in this check at all — «күрделі кері қайту тәсілі биыл бүкіл топқа
 * нөлден жаздырылмайды» (p.9), and a blank editor is exactly what an unseen
 * problem is.
 *
 * Provenance follows September and January: the three `verify` blocks
 * implement the programme's five general verification methods and cite p.6;
 * the written `explain` implements February's own «Тоқтау шарты дұрыс
 * қойылған» clause and cites p.9. All four blocks go to all three routes —
 * the month's advanced-only written defence is already carried by `m6.l3.b10`,
 * `m6.l4.b10` and `m6.l6.b9`, and a monthly check that differs by route is a
 * check whose result cannot be compared across a class.
 *
 * C++: a function with a declared return type above `main`, `return`, `if`,
 * `cin >>`, `cout <<`, `long long`. Nothing beyond `<iostream>`, so no `<cmath>`
 * — February computes by calling, not by library call.
 */
export const M6_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Бейтаныс есептер» (p.6), carrying the first clause of February's own
     * sentence — «тоқтау шарты дұрыс қойылған, өзін-өзі шақыратын функция
     * жазу» (p.9).
     *
     * Blank editor, no starter. The input is one line of two numbers, the shape
     * `m6.l6.b8` reads and the shape `m6.l1.b9` opens with, so a starter would
     * only remove the one part of the work nobody is measuring.
     *
     * Twelve cases, eleven hidden, and they are the problem rather than a
     * count: `1 1` is the smallest legal input in both numbers, `1 2` is one
     * hour above it, `5 5` and `10 3` are the two ways the answer can be zero,
     * `3 24` and `2 1024` are the exact hits where a strict `>` finally shows,
     * `2 1025` is one past a power of two, and `1 1000000000` is the deepest
     * legal recursion this problem has — thirty nested calls, which is the
     * number `b3`'s second question asks the learner to produce, and which is
     * why the stated range is safe to hand a fourteen-year-old in a language
     * that will not warn them about depth.
     */
    id: "m6.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["recursion.core", "recursion.base_case", "func.define", "func.return", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Зертханадағы ыдыста `a` бактерия бар. Әр сағат сайын бактериялар саны дәл екі есе артады. Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: `a` және `b` (1 ≤ a ≤ 1 000 000 000, 1 ≤ b ≤ 1 000 000 000). Бактериялар саны `b` санынан кем болмауы үшін кемінде қанша сағат күту керек — сол бір санды шығар. Егер саны басынан-ақ жеткілікті болса, жауап 0. Тапсырманың шарты: шешім өзін-өзі шақыратын функция болуы керек, себебі бір сағат өткен соң дәл сондай, бірақ күтетін уақыты бір сағатқа азайған есеп қалады. Мұны машина тексермейді — ол тек шыққан санды салыстырады. Функцияңды өзің түсіндіресің: 3-тапсырмада жазбаша, 4-тапсырмада мұғалімге ауызша.\n\nЕкі нәрсені кодқа отырмас бұрын өзің есептеп ал. Біріншісі — түрі: `a` екі еселеніп отырғанда ең үлкен мәні 2 000 000 000-ға жақындай алады, ал `int` 2 147 483 647-де бітеді. Екіншісі — тереңдігі: бірден бастап екі есе арта отырып, миллиардтан асу үшін неше сағат керек? Осы екі сұрақтың жауабын алдын ала біліп ал.",
      ru: "В лабораторной колбе `a` бактерий. Каждый час число бактерий увеличивается ровно вдвое. В одной строке через пробел даны два целых числа: `a` и `b` (1 ≤ a ≤ 1 000 000 000, 1 ≤ b ≤ 1 000 000 000). Выведи одно число — сколько часов нужно подождать как минимум, чтобы бактерий стало не меньше `b`. Если их достаточно с самого начала, ответ равен 0. Условие задания: решение должно быть функцией, вызывающей саму себя, — ведь через час остаётся такая же задача, только ждать в ней нужно на час меньше. Машина это не проверяет: она сравнивает только выведенное число. Свою функцию ты объясняешь сам — письменно в задании 3 и устно учителю в задании 4.\n\nДве вещи посчитай до того, как сядешь за код. Первая — тип: пока `a` удваивается, его наибольшее значение может подойти к 2 000 000 000, а `int` заканчивается на 2 147 483 647. Вторая — глубина: сколько часов нужно, чтобы, удваиваясь от единицы, перевалить за миллиард? Ответы на оба вопроса узнай заранее.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long hours(long long a, long long b) {\n" +
      "    if (a >= b) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return 1 + hours(a * 2, b);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    long long a, b;\n" +
      "    cin >> a >> b;\n" +
      "    cout << hours(a, b);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The only visible case, and a middle one. 3 → 6 → 12 → 24, and 24 is
         still short of 25, so the fourth hour is needed. It kills the halving
         shortcut (answers 3), the base case that returns 1 (answers 5) and
         adding instead of doubling (answers 8) — in public, before a hidden
         case is reached — while revealing nothing about the exact-hit
         boundary, which is what this month is actually checked on. */
      { input: "3 25", expectedOutput: "4" },
      /* The doubling lands exactly on `b`. `a > b` answers 4 here. */
      { input: "3 24", expectedOutput: "3", hidden: true },
      /* Already enough, twice over: equal, and strictly more. A recursion that
         doubles before it tests, or whose base case returns 1, answers 1. */
      { input: "5 5", expectedOutput: "0", hidden: true },
      { input: "10 3", expectedOutput: "0", hidden: true },
      /* The smallest legal input in both numbers, and one hour above it. */
      { input: "1 1", expectedOutput: "0", hidden: true },
      { input: "1 2", expectedOutput: "1", hidden: true },
      /* 1 → 2 → 4 overshoots 3, so the answer is 2 — halving `b` answers 1,
         because 3 / 2 lands on 1 and integer division eats the remainder. */
      { input: "1 3", expectedOutput: "2", hidden: true },
      /* An exact power of two, deep enough that an off-by-one is visible, and
         the number one past it. */
      { input: "2 1024", expectedOutput: "9", hidden: true },
      { input: "2 1025", expectedOutput: "10", hidden: true },
      /* One hour, with `b` immediately above `a`. */
      { input: "6 7", expectedOutput: "1", hidden: true },
      /* The top of the stated range, one step apart — big numbers, tiny
         answer, which is the case a learner who reasoned about magnitudes
         rather than about the recursion tends to get wrong. It is also the
         case where the last doubling reaches 1 999 999 998, which is the
         number the prompt's type question is about. */
      { input: "999999999 1000000000", expectedOutput: "1", hidden: true },
      /* The deepest recursion the constraints allow: thirty nested calls. */
      { input: "1 1000000000", expectedOutput: "30", hidden: true },
    ],
  },
  {
    /*
     * «Кодты қолмен орындау» (p.6), carrying the second clause of February's
     * own sentence — «салынған ағаш бойынша шақыру ретін түсіндіру» (p.9).
     *
     * The program is on the block, in `code`. `m1.as.b3` shipped without it
     * and rendered as a prompt about "this program" over an empty box, which
     * is why the field is now required for this mode.
     *
     * `rabbits` appears in no February lesson and it is not `b1`'s problem, so
     * nothing here is transcription in either direction. It was chosen because
     * it is the smallest program in which the call tree is a TREE: two calls
     * per level, a repeated call, and an addition that cannot happen until the
     * left branch has finished. A chain of `n - 1` calls would have made the
     * order question answerable without a tree at all.
     *
     * THE ADDITION IS SPLIT INTO TWO NAMED STATEMENTS, AND IT HAD TO BE. In
     * C++ the order in which the two operands of `+` are evaluated is not
     * fixed by the language, so `return rabbits(n - 1) + rabbits(n - 2);` may
     * legally run the right branch first — and every question on this card is
     * about the order of the printed lines. Two statements, `left` then
     * `right`, are sequenced by the language, so the trace below is guaranteed
     * rather than lucky. `b4`'s third marking point turns that into a fact the
     * learner is asked to state.
     *
     * The name matters and was changed once. The practice bank's `m6.p6` asks
     * for a team-choosing count and calls it `choose`, and `m6.l5.b6` calls the
     * staircase `climb`, so a `ways` on this card would carry the identifier of
     * a function the learner wrote an hour earlier. «Бұрын көрген жоқсың» has
     * to be true when a card says it.
     *
     * The program prints the English token `call`, named in both prompts, so a
     * learner reading the Russian is not matching glyphs. Read by a teacher —
     * nothing here is graded 0/1.
     */
    id: "m6.as.b2",
    type: "verify",
    mode: "manual_trace",
    skillRefs: ["recursion.call_tree", "recursion.core", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бұл бағдарламаны бұрын көрген жоқсың. Оны компьютерсіз, қағазда орында. `rabbits(n)` функциясы n-ші айда неше жұп қоян болатынын санайды. Ережесі бағдарламаның өзінде жазылған: алғашқы екі айда бір-ақ жұп болады, ал одан кейінгі әр айдағы жұптар саны алдыңғы екі айдағы сандардың қосындысына тең. Екі шақырудың нәтижесі `left` пен `right` айнымалыларына бөлек жазылған — бұл маңызды, себебі сол екі жол қай шақыру бұрын басталатынын анықтап тұр. (1) `rabbits(4)` шақыруынан басталатын шақырулар ағашын сал: әр шақырудың астына сол шақыру туғызатын шақыруларды жаз. (2) Бағдарлама шығаратын алты жолды түгел жаз: бес жолда ағылшынша `call` сөзі мен сан тұрады, алтыншы жолда бір сан. Соңында екі шақыруды ата: қайсысы ең бірінші болып жауап қайтарады, қайсысы ең соңында.",
      ru: "Эту программу ты раньше не видел. Выполни её на бумаге, без компьютера. Функция `rabbits(n)` считает, сколько пар кроликов будет в n-м месяце. Правило записано в самой программе: в первые два месяца пара всего одна, а в каждом следующем месяце число пар равно сумме чисел за два предыдущих месяца. Результаты двух вызовов записаны в отдельные переменные `left` и `right` — это важно, потому что именно эти две строки задают, какой вызов начинается раньше. (1) Нарисуй дерево вызовов, начиная с `rabbits(4)`: под каждым вызовом выпиши вызовы, которые он порождает. (2) Запиши все шесть строк, которые выведет программа: в пяти строках стоят английское слово `call` и число, в шестой — одно число. В конце назови два вызова: какой из них возвращает ответ самым первым, а какой — самым последним.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int rabbits(int n) {\n" +
      "    cout << \"call \" << n << endl;\n" +
      "    if (n <= 2) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    int left = rabbits(n - 1);\n" +
      "    int right = rabbits(n - 2);\n" +
      "    return left + right;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << rabbits(4) << endl;\n" +
      "    return 0;\n" +
      "}",
    expectedPoints: [
      {
        kk: "Ағашта бес шақыру бар. `rabbits(4)` екі шақыру туғызады: `rabbits(3)` және `rabbits(2)`. Ал `rabbits(3)` өз кезегінде `rabbits(2)` мен `rabbits(1)` шақыруларын туғызады. `rabbits(2)` ағашта екі рет кездеседі — бірі `rabbits(3)` шақыруының астында, екіншісі `rabbits(4)` шақыруының астында.",
        ru: "В дереве пять вызовов. `rabbits(4)` порождает два вызова: `rabbits(3)` и `rabbits(2)`. А `rabbits(3)` в свою очередь порождает `rabbits(2)` и `rabbits(1)`. Вызов `rabbits(2)` встречается в дереве дважды — один раз под `rabbits(3)`, другой раз под `rabbits(4)`.",
      },
      {
        kk: "Бағдарлама дәл алты жол шығарады: `call 4`, `call 3`, `call 2`, `call 1`, `call 2`, содан кейін `3`.",
        ru: "Программа выводит ровно шесть строк: `call 4`, `call 3`, `call 2`, `call 1`, `call 2`, а затем `3`.",
      },
      {
        kk: "`call` жолдарының реті — шақырулардың басталу реті, қайтару реті емес. `left` жолы `right` жолынан бұрын тұр, сондықтан `rabbits(n - 1)` толық аяқталмайынша, `rabbits(n - 2)` мүлде басталмайды. Сондықтан `call 2` жолы екінші рет `call 1` жолынан кейін ғана шығады.",
        ru: "Порядок строк `call` — это порядок начала вызовов, а не порядок возврата. Строка с `left` стоит раньше строки с `right`, поэтому, пока `rabbits(n - 1)` не завершится полностью, `rabbits(n - 2)` вообще не начнётся. Поэтому `call 2` второй раз появляется только после `call 1`.",
      },
      {
        kk: "Бірінші болып жауап қайтаратын шақыру — `rabbits(3)` шақыруының астындағы `rabbits(2)`, ол 1 қайтарады. Ең соңында жауап қайтаратын — ең бірінші басталған `rabbits(4)`, ол 3 қайтарады. Аралығында: `rabbits(1)` 1 қайтарады, сосын `rabbits(3)` 2 қайтарады, сосын оң жақтағы `rabbits(2)` 1 қайтарады.",
        ru: "Первым возвращает ответ вызов `rabbits(2)`, стоящий под `rabbits(3)`, — он возвращает 1. Последним возвращает ответ `rabbits(4)`, начавшийся самым первым, — он возвращает 3. Между ними: `rabbits(1)` возвращает 1, затем `rabbits(3)` возвращает 2, затем правый `rabbits(2)` возвращает 1.",
      },
    ],
  },
  {
    /*
     * February's own clause, in writing: «Тоқтау шарты дұрыс қойылған» (p.9).
     *
     * It is asked about the learner's OWN function from `b1`, which is the
     * only version of this question that cannot be answered from the lesson:
     * "what is a base case" has a memorised answer and "what is YOUR base
     * case, and why does `a` reach it" does not. It is also where the
     * structural requirement of `b1` actually lands on a person — a learner
     * who wrote a `while` loop has no base case to name, and says so here.
     *
     * Two numbered questions, two answers each, and the four marking points
     * below are the four claims a complete answer makes. `ExplainBlock` has no
     * `code` field, so nothing is quoted: the function under discussion is the
     * one on the learner's own screen.
     *
     * THE LAST TWO MARKING POINTS WERE REWRITTEN FOR C++. Both used to end on
     * `RecursionError` — a named event Python raises at about a thousand
     * frames, which a teacher could describe and a learner could see. C++ has
     * no such event and gives no such guarantee: the calls consume the stack
     * until it is gone and the program stops with nothing on screen, and a
     * compiler is even permitted to turn a recursion that cannot terminate
     * into something else, so what is actually observed is not fixed. The
     * points now say that, and land where `m6.l4.b1` lands: the depth is
     * something you work out before you press Run.
     *
     * Never machine-scored. Settles as `unknown`; a teacher reads it.
     */
    id: "m6.as.b3",
    type: "explain",
    skillRefs: ["recursion.base_case", "recursion.core", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Жазбаша жауап бер. Бірінші тапсырмада өзің жазған функцияны алдыңа қой. (1) Оның тоқтау шарты қандай және сол шарт орындалғанда функция қандай сан қайтарады, неге дәл сол сан? (2) `a` мен `b` сандарының қалай өзгеретінін ескеріп жаз: функция сол шартқа неге міндетті түрде жетеді, ең терең жағдайда неше шақыру болады — және тоқтау шартын жазған екі жолды өшіріп тастасаң, бағдарлама нақты не істейді?",
      ru: "Ответь письменно. Положи перед собой функцию, которую ты написал в первом задании. (1) Каково её условие остановки и какое число функция возвращает, когда это условие выполнено, — почему именно такое? (2) Учитывая, как меняются `a` и `b`, напиши: почему функция обязательно доходит до этого условия, сколько будет вызовов в самом глубоком случае — и что именно сделает программа, если убрать те две строки, в которых условие остановки записано?",
    },
    expectedPoints: [
      {
        kk: "Тоқтау шарты — `a >= b`: бактериялар саны талап етілген деңгейге жеткен немесе одан асып кеткен сәт. Ол орындалғанда функция 0 қайтарады, өйткені бұл жағдайда күтетін ештеңе жоқ — нөл сағат. Тоқтау шартында екі шешім бар және екеуі де дұрыс болуы керек: қашан тоқтау және не қайтару. Шарттың өзі дұрыс болып, қайтаратын саны 1 болса, бағдарламаның барлық жауабы бірге артық шығады.",
        ru: "Условие остановки — `a >= b`: момент, когда бактерий стало не меньше нужного числа. При его выполнении функция возвращает 0, потому что ждать в этом случае нечего — ноль часов. В условии остановки два решения, и оба должны быть верными: когда остановиться и что вернуть. Если само условие правильное, а возвращается 1, все ответы программы окажутся на единицу больше нужного.",
      },
      {
        kk: "Шартқа жету кепілдендірілген, себебі әр шақыруда `a` екі есе артады, ал `b` мүлде өзгермейді. Демек `a` шектеусіз өседі және ерте ме, кеш пе `b` санынан асып түседі. Мұнда «кішірек есеп» деген сан кішірейеді дегенді білдірмейді: кішірейетін нәрсе — қалған қашықтық, яғни `a` санының `b` санына жетуіне қалған сағат саны. Ең үлкен шектеу үшін (`a` = 1, `b` = 1 000 000 000) бұл небәрі отыз шақыру, өйткені 2³⁰ миллиардтан асады.",
        ru: "Достижение условия гарантировано, потому что при каждом вызове `a` удваивается, а `b` не меняется вовсе. Значит, `a` растёт неограниченно и рано или поздно догоняет `b`. «Меньшая задача» здесь не означает, что уменьшается число: уменьшается оставшееся расстояние — то есть количество часов, которые ещё нужно прождать. При самом большом ограничении (`a` = 1, `b` = 1 000 000 000) это всего тридцать вызовов, потому что 2³⁰ уже больше миллиарда.",
      },
      {
        kk: "Тоқтау шарты жоқ функцияда өзін шақыруды тоқтататын ешнәрсе қалмайды: `a` екі есе арта береді, ал қайтуға негіз болатын жағдай ешқашан тексерілмейді. C++ шақырулардың тереңдігін санамайды және мұндайда ешқандай түсінікті қате хабарын бермейді: шақыруларға арналған жад бітеді де, бағдарлама экранда ештеңе қалдырмай үзіліп қалады. Оның үстіне мұндай бағдарламаның нақты мінезі алдын ала бекітілмеген — компилятор оны басқаша да аудара алады. Сондықтан тереңдікті алдын ала есептеу — бұл жерде мұқияттылық емес, жалғыз амал.",
        ru: "Если условия остановки нет, ничто не прекращает вызовы: `a` продолжает удваиваться, а случай, дающий основание вернуться, вообще ни разу не проверяется. C++ не считает глубину вызовов и не выдаёт при этом никакого понятного сообщения об ошибке: память под вызовы кончается, и программа обрывается, не оставив на экране ничего. Более того, точное поведение такой программы заранее не закреплено — компилятор вправе перевести её и иначе. Поэтому посчитать глубину заранее здесь не аккуратность, а единственный способ.",
      },
      {
        kk: "Тоқтау шарты тек дұрыс жазылып қана қоймай, оған нақты жету де мүмкін болуы керек. Мысалы, `a >= b` орнына `a == b` деп жазсақ, шарт дұрыс көрінеді, бірақ «3 25» үшін `a` мәндері 3, 6, 12, 24, 48 болып, `b` санының үстінен аттап өтеді де, теңдік ешқашан орындалмайды — сол бағдарлама да ешбір хабарсыз үзіліп қалады. Сондықтан тоқтау шартын жазғаннан кейін «аргумент осы шартқа шынымен түсе ме?» деген сұрақты бөлек тексеру керек.",
        ru: "Условие остановки должно быть не только верно записано, но и реально достижимо. Например, если вместо `a >= b` написать `a == b`, условие выглядит правильным, но для «3 25» значения `a` идут 3, 6, 12, 24, 48 и перешагивают через `b`, так что равенство не наступает никогда, — такая программа тоже обрывается без всякого сообщения. Поэтому после записи условия остановки нужно отдельно проверить вопрос: а попадает ли аргумент в это условие на самом деле.",
      },
    ],
  },
  {
    /*
     * «Ауызша түсіндіру» (p.6), over the tree the learner drew in `b2`.
     *
     * `b2` collects the artefacts — the tree, the six printed lines, the first
     * and last returns. This block deliberately collects none of them again:
     * October's check bought a second copy of an answer its own written block
     * had already taken, and the fix is that the questions here are all about
     * MECHANISM. Reading the order aloud is the vehicle; the marking points
     * are why the left branch blocks the right one, why the first call is the
     * last to finish, and what the repeated `rabbits(2)` costs.
     *
     * The third marking point carries the C++ fact `b2`'s code is written
     * around: two statements run in the order they are written, and that is
     * what makes the printed order a fact rather than a hope. A learner who
     * says "the left one is written first, so it runs first" has given the
     * complete answer.
     *
     * A learner who wrote a loop in `b1` still has a full answer here, because
     * the tree belongs to `b2`'s program, not to theirs.
     *
     * Settles as `unknown`. The teacher hears it and reads these points.
     */
    id: "m6.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["recursion.call_tree", "recursion.core", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Мұғалімге ауызша түсіндір. Екінші тапсырмада салған ағашыңды алдыңа қой да, шақырулардың ретін саусағыңмен көрсетіп оқып шық. Содан кейін негізгісін түсіндір: сол жақтағы `rabbits(n - 1)` шақыруы неге оң жақтағы `rabbits(n - 2)` шақыруынан бұрын басталады, ешкімді шақырмайтын шақыру неге өзін бастаған шақырудан бұрын жауап береді, ал ең бірінші басталған шақыру неге ең соңында жауап береді?",
      ru: "Объясни учителю устно. Положи перед собой дерево, которое нарисовал во втором задании, и проведи пальцем по порядку вызовов, проговаривая их. Затем объясни главное: почему левый вызов `rabbits(n - 1)` начинается раньше правого `rabbits(n - 2)`, почему вызов, который никого не вызывает, отвечает раньше того вызова, который его запустил, и почему вызов, начавшийся самым первым, отвечает самым последним?",
    },
    expectedPoints: [
      {
        kk: "Шақыру өзі бастаған шақырулардың бәрі жауап бермейінше, өзі жауап қайтара алмайды. `rabbits(3)` шақыруы `rabbits(2)` мен `rabbits(1)` шақыруларын бастайды, сондықтан оның жауабы сол екеуінің жауабынан кейін ғана дайын болады. Демек өзі ешкімді шақырмайтын шақыру — ағаштың түбіндегі шақыру — өзін бастаған шақырудан әрқашан бұрын жауап береді, ал бүкіл ағашта ең бірінші жауап беретіні де солардың бірі болады.",
        ru: "Вызов не может вернуть ответ, пока не ответили все вызовы, которые он сам запустил. `rabbits(3)` запускает `rabbits(2)` и `rabbits(1)`, поэтому его ответ готов только после ответов этих двух. Значит, вызов, который сам никого не вызывает, — вызов на дне дерева — всегда отвечает раньше того, кто его запустил, и первым во всём дереве отвечает как раз один из таких вызовов.",
      },
      {
        kk: "Бағдарламада екі шақыру екі бөлек жолда тұр: алдымен `left`, содан кейін `right`. Екі нұсқау жазылған ретімен орындалады, сондықтан `rabbits(n - 1)` толық аяқталып, сан бермейінше, `rabbits(n - 2)` мүлде басталмайды. Ағаш алдымен сол жаққа қарай тереңдейді, түбіне жетеді, сосын ғана оң жаққа ауысады.",
        ru: "В программе два вызова стоят двумя отдельными строками: сначала `left`, потом `right`. Две инструкции выполняются в том порядке, в каком записаны, поэтому, пока `rabbits(n - 1)` не завершится полностью и не даст число, правый вызов даже не начнётся. Дерево сначала углубляется влево, доходит до дна и только после этого переходит вправо.",
      },
      {
        kk: "Мұғалімге ескерту: күшті жауап екі жолдың неге бөлек жазылғанын да атайды. `return rabbits(n - 1) + rabbits(n - 2);` деп бір жолға жазсақ, C++ қосудың қай жағын бұрын есептейтінін бекітпейді — компилятор оң жағын бұрын шақыруы да мүмкін, сонда `call` жолдарының реті өзгеріп кетер еді. Екі бөлек нұсқау сол ретті кепілдендіреді.",
        ru: "Замечание для учителя: сильный ответ назовёт и то, зачем две строки записаны раздельно. Если написать `return rabbits(n - 1) + rabbits(n - 2);` одной строкой, C++ не закрепляет, какую сторону сложения вычислять первой, — компилятор вправе вызвать сначала правую, и порядок строк `call` изменился бы. Две отдельные инструкции этот порядок гарантируют.",
      },
      {
        kk: "Шақырулар мен қайтулар бір-бірінің кері реті болатыны содан: әр жаңа шақыру алдыңғысының үстіне қойылады, ал жауап беру кезінде үстіндегісі бірінші алынады. `rabbits(4)` бәрінен бұрын басталды, демек ол ең астында тұр және ең соңында ғана бітеді. Оның жауабы — 3.",
        ru: "Отсюда и то, что порядок возвратов обратен порядку вызовов: каждый новый вызов кладётся поверх предыдущего, а при возврате первым снимается верхний. `rabbits(4)` начался раньше всех, значит, он лежит в самом низу и завершается последним. Его ответ — 3.",
      },
      {
        kk: "Оқушы байқағанын айтады: `rabbits(2)` ағашта екі рет кездеседі және екеуінде де сол 1 санын қайтадан есептейді. Ағаш ештеңе есінде сақтамайды, сондықтан `n` өскенде қайталанатын шақырулар саны тез артады. Бұл — рекурсияның қымбат тұсы, оны кейін бөлек қарастырамыз.",
        ru: "Ученик отмечает наблюдение: `rabbits(2)` встречается в дереве дважды и оба раза заново вычисляет одну и ту же единицу. Дерево ничего не запоминает, поэтому с ростом `n` число повторяющихся вызовов быстро увеличивается. Это дорогая сторона рекурсии, и разбирать её мы будем позже отдельно.",
      },
    ],
  },
];
