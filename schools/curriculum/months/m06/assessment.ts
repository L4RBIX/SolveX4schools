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
 *   b2  paper trace of a five-call tree            ~4 min
 *   b3  written, two questions about the base
 *       case of the learner's OWN function         ~3 min
 *   b4  oral, one continuous explanation            — runs alongside, while
 *                                                     the teacher circulates
 *
 * The validator's arithmetic is 12 + 6 + 4 + 2 = 24 against a stated 20, and
 * the number is written down here rather than engineered away. Two ways of
 * reaching 22 were available and both were refused:
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
 * function, and the tree is five calls. Seventeen of the estimated minutes are written work
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
 * month has shown shrinks something visible — `n - 1`, `n // 10`, `s[1:]`,
 * `left - 1` — so «кішірек есеп» has quietly come to mean «кішірек сан». Here
 * `a` doubles and `b` never moves, and the problem still gets smaller, because
 * what shrinks is the distance left to cover. A learner who has understood the
 * month writes the same three lines; a learner who has memorised «аргументті
 * бірге азайт» has nothing to copy. That is also what makes `b3` worth asking:
 * "why is the stopping condition always reached" is a real question here and
 * an empty one for `n - 1`.
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
 *                                        `b`, and Python ends it with
 *                                        RecursionError. This is `b3`'s
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
 * Python: `def`, `return`, `if`, `map`, `input().split()`, `print`. No import
 * of any kind, so no `functools` and no `setrecursionlimit`, and no `**` —
 * February computes by calling, not by operator.
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
     * legal recursion this problem has — thirty nested calls, which is why the
     * stated range is safe to hand a fourteen-year-old who cannot import
     * anything and cannot raise the recursion limit.
     */
    id: "m6.as.b1",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["recursion.core", "recursion.base_case", "func.define", "func.return", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Зертханадағы ыдыста `a` бактерия бар. Әр сағат сайын бактериялар саны дәл екі есе артады. Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: `a` және `b` (1 ≤ a ≤ 1 000 000 000, 1 ≤ b ≤ 1 000 000 000). Бактериялар саны `b` санынан кем болмауы үшін кемінде қанша сағат күту керек — сол бір санды шығар. Егер саны басынан-ақ жеткілікті болса, жауап 0. Тапсырманың шарты: шешім өзін-өзі шақыратын функция болуы керек, себебі бір сағат өткен соң дәл сондай, бірақ күтетін уақыты бір сағатқа азайған есеп қалады. Мұны машина тексермейді — ол тек шыққан санды салыстырады. Функцияңды өзің түсіндіресің: 3-тапсырмада жазбаша, 4-тапсырмада мұғалімге ауызша.",
      ru: "В лабораторной колбе `a` бактерий. Каждый час число бактерий увеличивается ровно вдвое. В одной строке через пробел даны два целых числа: `a` и `b` (1 ≤ a ≤ 1 000 000 000, 1 ≤ b ≤ 1 000 000 000). Выведи одно число — сколько часов нужно подождать как минимум, чтобы бактерий стало не меньше `b`. Если их достаточно с самого начала, ответ равен 0. Условие задания: решение должно быть функцией, вызывающей саму себя, — ведь через час остаётся такая же задача, только ждать в ней нужно на час меньше. Машина это не проверяет: она сравнивает только выведенное число. Свою функцию ты объясняешь сам — письменно в задании 3 и устно учителю в задании 4.",
    },
    referenceSolution:
      "def hours(a, b):\n" +
      "    if a >= b:\n" +
      "        return 0\n" +
      "    return 1 + hours(a * 2, b)\n" +
      "\n" +
      "a, b = map(int, input().split())\n" +
      "print(hours(a, b))",
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
         because 3 // 2 lands on 1 and integer division eats the remainder. */
      { input: "1 3", expectedOutput: "2", hidden: true },
      /* An exact power of two, deep enough that an off-by-one is visible, and
         the number one past it. */
      { input: "2 1024", expectedOutput: "9", hidden: true },
      { input: "2 1025", expectedOutput: "10", hidden: true },
      /* One hour, with `b` immediately above `a`. */
      { input: "6 7", expectedOutput: "1", hidden: true },
      /* The top of the stated range, one step apart — big numbers, tiny
         answer, which is the case a learner who reasoned about magnitudes
         rather than about the recursion tends to get wrong. */
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
     * per level, a repeated call, and a `+` that cannot be evaluated until the
     * left branch has finished. A chain of `n - 1` calls would have made the
     * order question answerable without a tree at all.
     *
     * The name matters and was changed once. The practice bank's `m6.p6` asks
     * for a THREE-term staircase count and calls it `ways`, so a two-term
     * `ways` on this card would carry the identifier of a function the learner
     * wrote an hour earlier — and carry it as the wrong answer to that task,
     * which `m6.p6`'s own visible case exists to kill. The recursion here is
     * the same two-term shape `m6.p6` rules out, which is exactly why it must
     * not wear the same name: «бұрын көрген жоқсың» has to be true when a card
     * says it.
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
      kk: "Бұл бағдарламаны бұрын көрген жоқсың. Оны компьютерсіз, қағазда орында. `rabbits(n)` функциясы n-ші айда неше жұп қоян болатынын санайды. Ережесі бағдарламаның өзінде жазылған: алғашқы екі айда бір-ақ жұп болады, ал одан кейінгі әр айдағы жұптар саны алдыңғы екі айдағы сандардың қосындысына тең. (1) `rabbits(4)` шақыруынан басталатын шақырулар ағашын сал: әр шақырудың астына сол шақыру туғызатын шақыруларды жаз. (2) Бағдарлама шығаратын алты жолды түгел жаз: бес жолда ағылшынша `call` сөзі мен сан тұрады, алтыншы жолда бір сан. Соңында екі шақыруды ата: қайсысы ең бірінші болып жауап қайтарады, қайсысы ең соңында.",
      ru: "Эту программу ты раньше не видел. Выполни её на бумаге, без компьютера. Функция `rabbits(n)` считает, сколько пар кроликов будет в n-м месяце. Правило записано в самой программе: в первые два месяца пара всего одна, а в каждом следующем месяце число пар равно сумме чисел за два предыдущих месяца. (1) Нарисуй дерево вызовов, начиная с `rabbits(4)`: под каждым вызовом выпиши вызовы, которые он порождает. (2) Запиши все шесть строк, которые выведет программа: в пяти строках стоят английское слово `call` и число, в шестой — одно число. В конце назови два вызова: какой из них возвращает ответ самым первым, а какой — самым последним.",
    },
    code:
      "def rabbits(n):\n" +
      '    print("call", n)\n' +
      "    if n <= 2:\n" +
      "        return 1\n" +
      "    return rabbits(n - 1) + rabbits(n - 2)\n" +
      "\n" +
      "print(rabbits(4))",
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
        kk: "`call` жолдарының реті — шақырулардың басталу реті, қайтару реті емес. `rabbits(4)` ішіндегі `rabbits(n - 1)` толық аяқталмайынша, оң жақтағы `rabbits(n - 2)` мүлде басталмайды: қосу амалы сол жақтағы санды алмай тұрып ештеңе қоса алмайды. Сондықтан `call 2` жолы екінші рет `call 1` жолынан кейін ғана шығады.",
        ru: "Порядок строк `call` — это порядок начала вызовов, а не порядок возврата. Пока `rabbits(n - 1)` внутри `rabbits(4)` не завершится полностью, правый вызов `rabbits(n - 2)` вообще не начнётся: сложение не может ничего сложить, пока нет левого числа. Поэтому `call 2` второй раз появляется только после `call 1`.",
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
     * Never machine-scored. Settles as `unknown`; a teacher reads it.
     */
    id: "m6.as.b3",
    type: "explain",
    skillRefs: ["recursion.base_case", "recursion.core", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    prompt: {
      kk: "Жазбаша жауап бер. Бірінші тапсырмада өзің жазған функцияны алдыңа қой. (1) Оның тоқтау шарты қандай және сол шарт орындалғанда функция қандай сан қайтарады, неге дәл сол сан? (2) `a` мен `b` сандарының қалай өзгеретінін ескеріп жаз: функция сол шартқа неге міндетті түрде жетеді — және тоқтау шартын жазған екі жолды өшіріп тастасаң, бағдарлама нақты не істейді?",
      ru: "Ответь письменно. Положи перед собой функцию, которую ты написал в первом задании. (1) Каково её условие остановки и какое число функция возвращает, когда это условие выполнено, — почему именно такое? (2) Учитывая, как меняются `a` и `b`, напиши: почему функция обязательно доходит до этого условия — и что именно сделает программа, если убрать те две строки, в которых условие остановки записано?",
    },
    expectedPoints: [
      {
        kk: "Тоқтау шарты — `a >= b`: бактериялар саны талап етілген деңгейге жеткен немесе одан асып кеткен сәт. Ол орындалғанда функция 0 қайтарады, өйткені бұл жағдайда күтетін ештеңе жоқ — нөл сағат. Тоқтау шартында екі шешім бар және екеуі де дұрыс болуы керек: қашан тоқтау және не қайтару. Шарттың өзі дұрыс болып, қайтаратын саны 1 болса, бағдарламаның барлық жауабы бірге артық шығады.",
        ru: "Условие остановки — `a >= b`: момент, когда бактерий стало не меньше нужного числа. При его выполнении функция возвращает 0, потому что ждать в этом случае нечего — ноль часов. В условии остановки два решения, и оба должны быть верными: когда остановиться и что вернуть. Если само условие правильное, а возвращается 1, все ответы программы окажутся на единицу больше нужного.",
      },
      {
        kk: "Шартқа жету кепілдендірілген, себебі әр шақыруда `a` екі есе артады, ал `b` мүлде өзгермейді. Демек `a` шектеусіз өседі және ерте ме, кеш пе `b` санынан асып түседі. Мұнда «кішірек есеп» деген сан кішірейеді дегенді білдірмейді: кішірейетін нәрсе — қалған қашықтық, яғни `a` санының `b` санына жетуіне қалған сағат саны. Ең үлкен шектеу үшін (`a` = 1, `b` = 1 000 000 000) бұл небәрі отыз шақыру.",
        ru: "Достижение условия гарантировано, потому что при каждом вызове `a` удваивается, а `b` не меняется вовсе. Значит, `a` растёт неограниченно и рано или поздно догоняет `b`. «Меньшая задача» здесь не означает, что уменьшается число: уменьшается оставшееся расстояние — то есть количество часов, которые ещё нужно прождать. При самом большом ограничении (`a` = 1, `b` = 1 000 000 000) это всего тридцать вызовов.",
      },
      {
        kk: "Тоқтау шарты жоқ функцияда өзін шақыруды тоқтататын ешнәрсе қалмайды: `a` екі есе арта береді, ал қайтуға негіз болатын жағдай ешқашан тексерілмейді. Бағдарлама мәңгі ілініп қалмайды — Python шақырулардың тереңдігін өзі санап отырады да, мыңға жуық шақырудан кейін `RecursionError` қатесімен тоқтатады. Экранда сан емес, қате туралы хабарлама шығады.",
        ru: "Если условия остановки нет, ничто не прекращает вызовы: `a` продолжает удваиваться, а случай, дающий основание вернуться, вообще ни разу не проверяется. Программа при этом не зависнет навсегда — Python сам считает глубину вызовов и примерно после тысячи из них останавливает всё ошибкой `RecursionError`. На экране появится не число, а сообщение об ошибке.",
      },
      {
        kk: "Тоқтау шарты тек дұрыс жазылып қана қоймай, оған нақты жету де мүмкін болуы керек. Мысалы, `a >= b` орнына `a == b` деп жазсақ, шарт дұрыс көрінеді, бірақ «3 25» үшін `a` мәндері 3, 6, 12, 24, 48 болып, `b` санының үстінен аттап өтеді де, теңдік ешқашан орындалмайды — сол бағдарлама да `RecursionError` қатесімен бітеді. Сондықтан тоқтау шартын жазғаннан кейін «аргумент осы шартқа шынымен түсе ме?» деген сұрақты бөлек тексеру керек.",
        ru: "Условие остановки должно быть не только верно записано, но и реально достижимо. Например, если вместо `a >= b` написать `a == b`, условие выглядит правильным, но для «3 25» значения `a` идут 3, 6, 12, 24, 48 и перешагивают через `b`, так что равенство не наступает никогда, — такая программа тоже заканчивается ошибкой `RecursionError`. Поэтому после записи условия остановки нужно отдельно проверить вопрос: а попадает ли аргумент в это условие на самом деле.",
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
      kk: "Мұғалімге ауызша түсіндір. Екінші тапсырмада салған ағашыңды алдыңа қой да, шақырулардың ретін саусағыңмен көрсетіп оқып шық. Содан кейін негізгісін түсіндір: сол жақтағы `rabbits(n - 1)` шақыруы неге оң жақтағы `rabbits(n - 2)` шақыруынан бұрын басталады, ағаштың түбіндегі шақырулар неге бәрінен бұрын жауап қайтарады, ал ең бірінші басталған шақыру неге ең соңында жауап береді?",
      ru: "Объясни учителю устно. Положи перед собой дерево, которое нарисовал во втором задании, и проведи пальцем по порядку вызовов, проговаривая их. Затем объясни главное: почему левый вызов `rabbits(n - 1)` начинается раньше правого `rabbits(n - 2)`, почему вызовы на дне дерева возвращают ответ раньше всех и почему вызов, начавшийся самым первым, отвечает самым последним?",
    },
    expectedPoints: [
      {
        kk: "Шақыру өзі бастаған шақырулардың бәрі жауап бермейінше, өзі жауап қайтара алмайды. `rabbits(3)` шақыруы `rabbits(2)` мен `rabbits(1)` шақыруларын бастайды, сондықтан оның жауабы сол екеуінің жауабынан кейін ғана дайын болады. Ағаштың түбіндегі шақырулар — өзі ешкімді шақырмайтындар — сол себепті бірінші болып жауап береді.",
        ru: "Вызов не может вернуть ответ, пока не ответили все вызовы, которые он сам запустил. `rabbits(3)` запускает `rabbits(2)` и `rabbits(1)`, поэтому его ответ готов только после ответов этих двух. Вызовы на самом дне дерева — те, что никого не вызывают, — по этой причине отвечают первыми.",
      },
      {
        kk: "`return rabbits(n - 1) + rabbits(n - 2)` жолында қосу амалы екі санды күтеді. Сол жақтағы шақыру толық аяқталып, сан бермейінше, оң жақтағы шақыру басталмайды да. Сондықтан ағаш алдымен сол жаққа қарай тереңдейді, түбіне жетеді, сосын ғана оң жаққа ауысады.",
        ru: "В строке `return rabbits(n - 1) + rabbits(n - 2)` сложение ждёт два числа. Пока левый вызов не завершится полностью и не даст число, правый вызов даже не начнётся. Поэтому дерево сначала углубляется влево, доходит до дна и только после этого переходит вправо.",
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
