import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан — the monthly check. Twenty minutes. PDF p.7.
 *
 * October's «Айлық сынақ» sentence names three things and no more:
 *
 *   > Бейтаныс бағдарламадағы цикл мен тізімнің жұмысын қағазда дұрыс қадамдау
 *   > және цикл мен тізім қолданылатын есепті өз бетінше шешу. Оқушы циклдің
 *   > неге тоқтайтынын және индекстердің неге шекарадан шықпайтынын түсіндіреді.
 *
 * So: hand-step an unfamiliar program (`manual_trace`), solve one loop-and-list
 * problem alone (`unseen_problem`), and say why the loop stops and why the
 * indices stay inside the list (an `explain`, plus the p.6 `oral_explanation`).
 * Four blocks, in that order, and deliberately no fifth.
 *
 * ## Why there is no find_bug block here
 *
 * September's assessment was audited at 32+ minutes against a stated 20,
 * because it carried two coding problems, a bug hunt and an oral question.
 * The arithmetic for October is the same and it does not have room: the paper
 * trace is ~5 minutes, the unseen problem ~10, the written answer ~4, and the
 * oral piece runs alongside. A fifth graded task would either push the check
 * past the period or quietly turn one of the others into a rush — and the
 * month already carries its bug-finding requirement where the PDF actually
 * puts it, in `m2.l9` («цикл мен индекс қатесін табу»).
 *
 * ## Why these two programs, and why they are the same idea twice
 *
 * `b1` walks a list by jumping forward by the value it lands on. It is short,
 * it is in no lesson, and it cannot be guessed from the shape — the traversal
 * visits indices 0, 2, 3 and never reads two of the five elements. It also
 * ends with `i = 6` on a list of length 5, which is the exact situation the
 * month's third requirement is about: the index does leave the list, and
 * `a[i]` still never fails, because `while` tests before it steps. That is
 * what `b4` then asks out loud, and it is a question with a real answer rather
 * than a recital of «индекс 0-ден басталады».
 *
 * `b2` is the independent problem: a running total over a list, and the answer
 * is a POSITION (the day the plan is met), not a value. Nothing in lessons 1–9
 * asks for that — l2 accumulates, l5 finds a maximum and counts, l6 walks a
 * string — so the learner cannot pattern-match a solved task onto it. Its
 * cases are eight, seven hidden, and they are chosen to kill named mutants,
 * not to reach a number:
 *
 *   · `>` instead of `>=` on the goal        → «2 2 2 2 / 6», «3 5 1 / 8»
 *   · prints the index, not the day          → «1 2 3 / 1»
 *   · never answers 0 when the goal is missed → «5 / 7», «2 2 2 2 / 9»
 *   · misses the last element                → «2 3 1 4 / 10»
 *   · reports the LAST qualifying day        → the visible sample, «1 2 3 / 1»
 *   · single element, both ways              → «5 / 5» and «5 / 7»
 *
 * Provenance follows September: `verify` blocks implement the five general
 * verification methods and cite p.6; the `explain` block asks October's own
 * two questions and cites p.7.
 */
export const M2_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * «Бейтаныс бағдарламадағы цикл мен тізімнің жұмысын қағазда дұрыс қадамдау».
     * The program is on the block, in `code` — `m1.as.b3` shipped without it and
     * rendered as a prompt about "this program" above an empty box, which is
     * why the field is now required for this mode.
     *
     * Nothing here is a trap: every element is at least 1, so the walk really
     * does terminate, and the learner who steps honestly gets it right. The
     * one thing it will not tolerate is reading `i = i + a[i]` as "add the new
     * a[i]" — the right-hand side uses the index the step started with, and
     * that is precisely what stepping on paper makes visible.
     */
    id: "m2.as.b1",
    type: "verify",
    mode: "manual_trace",
    skillRefs: ["loops.while", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бұл бағдарламаны бұрын көрген жоқсың. Оны компьютерсіз, қағазда қадамдап орында. Цикл денесі әр рет орындалып болған сайын `i` мен `c`-нің сол сәттегі мәнін жаз. Содан кейін бағдарлама экранға шығаратын екі жолды жаз. Соңында бір сөйлеммен жауап бер: цикл `i`-дің қай мәнінде тоқтады және неге?",
      ru: "Эту программу ты раньше не видел. Выполни её на бумаге, без компьютера. После каждого прохода тела цикла выписывай текущие значения `i` и `c`. Затем запиши две строки, которые программа выведет на экран. В конце одним предложением ответь: при каком значении `i` цикл остановился и почему?",
    },
    code:
      "a = [2, 5, 1, 3, 4]\ni = 0\nc = 0\nwhile i < len(a):\n    i = i + a[i]\n    c += 1\nprint(c)\nprint(i)",
    expectedPoints: [
      {
        kk: "Үш қадам жазылған: бірінші қадамнан кейін i = 2, c = 1; екіншісінен кейін i = 3, c = 2; үшіншісінен кейін i = 6, c = 3.",
        ru: "Выписаны три шага: после первого i = 2, c = 1; после второго i = 3, c = 2; после третьего i = 6, c = 3.",
      },
      {
        kk: "Әр қадамда i-ге дәл сол сәттегі a[i] қосылады: a[0] = 2, сосын a[2] = 1, сосын a[3] = 3. Тізімдегі 5 пен 4 мүлде оқылмайды.",
        ru: "На каждом шаге к i прибавляется именно текущий a[i]: a[0] = 2, затем a[2] = 1, затем a[3] = 3. Числа 5 и 4 из списка не читаются вообще.",
      },
      {
        kk: "Бағдарлама екі жол шығарады: алдымен 3, содан кейін 6.",
        ru: "Программа выводит две строки: сначала 3, потом 6.",
      },
      {
        kk: "Цикл i = 6 болғанда тоқтады: `len(a)` = 5, ал 6 < 5 шарты жалған.",
        ru: "Цикл остановился при i = 6: `len(a)` = 5, а условие 6 < 5 ложно.",
      },
    ],
  },
  {
    /*
     * «Цикл мен тізім қолданылатын есепті өз бетінше шешу» — one problem, blank
     * editor, no starter. The month's whole toolkit is needed and nothing more:
     * read a list, walk it, accumulate, compare against a goal, and report a
     * position rather than a value.
     *
     * The reference is written with `while` and a two-part condition on purpose.
     * A `for` over `range(len(a))` with a guard is just as correct and passes
     * the same cases — but the `while` form is the one whose two stopping
     * reasons `b3` and `b4` then ask about, and an author's reference should be
     * the version they are prepared to defend out loud.
     *
     * Elements are ≥ 1, so the running total only grows. That is not decoration:
     * it is what makes "the first day" well defined, and it is the fact the
     * learner leans on when explaining why the loop terminates.
     */
    id: "m2.as.b2",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["lists.traverse", "loops.accumulator", "loops.counter", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген бүтін сандар беріледі: оқушының әр күні шығарған есеп саны. Күн саны кемінде біреу, әр сан 1-ден 1000-ға дейін. Екінші жолда бір бүтін сан k — айлық жоспар (1 ≤ k ≤ 1 000 000). Жиналған есеп саны алғаш рет k-дан кем болмаған күннің нөмірін шығар; күндер бірден нөмірленеді. Егер барлық күннің қосындысы k-ға жетпесе, 0 шығар.",
      ru: "В первой строке через пробел даны целые числа: сколько задач ученик решил в каждый из дней. Дней хотя бы один, каждое число от 1 до 1000. Во второй строке одно целое число k — план на месяц (1 ≤ k ≤ 1 000 000). Выведи номер дня, в который накопленная сумма впервые стала не меньше k; дни нумеруются с единицы. Если сумма за все дни так и не достигла k, выведи 0.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\nk = int(input())\ntotal = 0\ni = 0\nwhile i < len(a) and total < k:\n    total += a[i]\n    i += 1\nif total >= k:\n    print(i)\nelse:\n    print(0)",
    cases: [
      /* Visible sample: the goal is met in the middle, so a solution that
         reports the LAST qualifying day answers 5 and fails immediately. */
      { input: "3 5 2 6 4\n10", expectedOutput: "3" },
      /* One day, and it is enough — the smallest list there is. */
      { input: "5\n5", expectedOutput: "1", hidden: true },
      /* One day, and it is not enough. Same list, opposite answer. */
      { input: "5\n7", expectedOutput: "0", hidden: true },
      /* All equal, and the total lands exactly on k: `>` instead of `>=`
         answers 4 here. */
      { input: "2 2 2 2\n6", expectedOutput: "3", hidden: true },
      /* All equal, goal never met — a full traversal that ends with no answer. */
      { input: "2 2 2 2\n9", expectedOutput: "0", hidden: true },
      /* The answer is the last element: a loop stopping at len(a) - 1 says 0. */
      { input: "2 3 1 4\n10", expectedOutput: "4", hidden: true },
      /* Day one already meets the goal: printing the index gives 0. */
      { input: "1 2 3\n1", expectedOutput: "1", hidden: true },
      /* Exact hit again, but mid-list and without duplicates, so a `>` that
         survived «2 2 2 2 / 6» by accident does not survive this. */
      { input: "3 5 1\n8", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * October's own explanation requirement, verbatim from p.7: «оқушы циклдің
     * неге тоқтайтынын және индекстердің неге шекарадан шықпайтынын
     * түсіндіреді». It is asked about the learner's OWN solution to b2, which
     * is the only way the answer can be theirs rather than recalled.
     *
     * Written, stored, read by a teacher, never machine-scored — `explain`
     * settles as `unknown` by design, and the marking points below are written
     * so that they fit both shapes a learner may have submitted, the `while`
     * with a compound condition and the `for` over `range(len(a))`.
     */
    id: "m2.as.b3",
    type: "explain",
    skillRefs: ["loops.while", "loops.for", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Екінші есепте өзің жазған бағдарлама туралы жаз. (1) Сенің циклің неге бір кезде міндетті түрде тоқтайды — онда не өзгеріп отырады? (2) Кодтың қай жолын алып тастасаң, цикл шексіз болып қалар еді? (3) `a[i]` жазылған жерде i неге ешқашан 0 мен `len(a) - 1` аралығынан шығып кетпейді? (4) Тізімде бір ғана күн болса, бағдарламаң нені шығарады және неге?",
      ru: "Напиши про свою программу из второй задачи. (1) Почему твой цикл обязательно когда-нибудь остановится — что именно в нём меняется? (2) Какую строку нужно убрать из кода, чтобы цикл стал бесконечным? (3) Почему там, где написано `a[i]`, значение i никогда не выходит за пределы от 0 до `len(a) - 1`? (4) Что выведет твоя программа, если день всего один, и почему?",
    },
    expectedPoints: [
      {
        kk: "Цикл әр қадамда индексті бірге өсіреді, ал шарт оны `len(a)`-мен салыстырады, сондықтан қадам саны тізім ұзындығынан аспайды. `for i in range(len(a))` жазылса да солай: сандар тізбегі шектеулі және таусылады. Бұған қоса қосынды k-дан кем болмай қалса, цикл одан ерте де тоқтауы мүмкін.",
        ru: "На каждом шаге цикл увеличивает индекс на единицу, а условие сравнивает его с `len(a)`, поэтому шагов не больше, чем длина списка. Если написано `for i in range(len(a))` — то же самое: последовательность чисел конечна и заканчивается. Кроме того, цикл может остановиться и раньше — когда накопленная сумма станет не меньше k.",
      },
      {
        kk: "Индексті өсіретін жол (`i += 1`) жоғалып кетсе, шарттағы мән өзгермей қалады да, цикл ешқашан тоқтамайды — бұл шексіз цикл. `for` циклінде мұндай жол жоқ, сондықтан оны шексіз ету мүлде қиын.",
        ru: "Если убрать строку, увеличивающую индекс (`i += 1`), значение в условии перестанет меняться и цикл никогда не остановится — это бесконечный цикл. В цикле `for` такой строки нет, поэтому сделать его бесконечным гораздо труднее.",
      },
      {
        kk: "`while` шартты дене орындалғанға ДЕЙІН тексереді, сондықтан `a[i]` тек i < len(a) ақиқат болғанда ғана оқылады. i мәнінің len(a)-ға тең болатын сәті бар, бірақ ол цикл тоқтағаннан кейін ғана келеді — ол кезде `a[i]` мүлде орындалмайды.",
        ru: "`while` проверяет условие ДО выполнения тела, поэтому `a[i]` читается только тогда, когда i < len(a) истинно. Момент, когда i становится равным len(a), наступает уже после остановки цикла, и `a[i]` там просто не выполняется.",
      },
      {
        kk: "Бір ғана күн болса, len(a) = 1 және дене ең көбі бір рет орындалады. Сол күнгі сан k-дан кем болмаса, жауап 1; кем болса, цикл индекс бойынша тоқтайды да, жауап 0 болады.",
        ru: "Если день всего один, то len(a) = 1 и тело выполнится не больше одного раза. Если число за этот день не меньше k, ответ 1; если меньше — цикл остановится по индексу, и ответ будет 0.",
      },
    ],
  },
  {
    /*
     * The p.6 oral check («ауызша түсіндіру»), pointed at this month's content
     * and at b1's program rather than at b2's — so it is a second, independent
     * question and not the spoken half of b3.
     *
     * The opening fact is deliberately uncomfortable: the loop ends with i = 6
     * on a five-element list, which looks like the index error the month spends
     * a lesson on. Explaining why it is not one requires the learner to say
     * where the test happens relative to the access, and that sentence is the
     * whole of «индекстердің неге шекарадан шықпайтыны».
     *
     * Settles as `unknown`. A teacher hears it and reads these points; nothing
     * about it is graded 0/1.
     */
    id: "m2.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["loops.while", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Мұғалімге ауызша түсіндір. Бірінші тапсырманың бағдарламасын есіңе түсір: цикл біткенде i = 6 болды, ал тізімде бар болғаны 5 элемент. (1) Неге бағдарлама индекс қатесімен құламады? (2) Бұл циклдің тоқтайтынына неге сенімдісің — оны не тоқтатады? (3) Тізімде 0 саны кездессе не болар еді?",
      ru: "Объясни учителю устно. Вспомни программу из первого задания: когда цикл закончился, i = 6, а в списке всего 5 элементов. (1) Почему программа не упала с ошибкой индекса? (2) Почему ты уверен, что этот цикл вообще остановится — что его останавливает? (3) Что было бы, если бы в списке встретился 0?",
    },
    expectedPoints: [
      {
        kk: "i = 6 болғанда `a[i]` мүлде оқылмайды: `while` алдымен шартты тексереді, шарт жалған болғандықтан дене орындалмайды. Индекс тізімнен цикл біткеннен кейін ғана шығып кетеді.",
        ru: "При i = 6 `a[i]` не читается вовсе: `while` сначала проверяет условие, оно ложно — и тело не выполняется. Индекс выходит за пределы списка только после окончания цикла.",
      },
      {
        kk: "Тізімдегі әр сан кемінде 1 болғандықтан, i әр қадамда міндетті түрде өседі. Үнемі өсіп отырған сан ерте ме, кеш пе 5-ке жетеді немесе одан асады, сондықтан цикл тоқтайды.",
        ru: "Так как каждое число в списке не меньше 1, i на каждом шаге обязательно растёт. Постоянно растущее число рано или поздно достигнет 5 или превысит его, поэтому цикл остановится.",
      },
      {
        kk: "Егер кезекті орында 0 тұрса, i өзгермей қалады да, бағдарлама сол индексте мәңгі тұрып қалады — шексіз цикл шығады. Демек циклдің тоқтауы тізімдегі сандарға да байланысты.",
        ru: "Если бы на очередном месте стоял 0, то i перестал бы меняться и программа зависла бы на этом индексе — получился бы бесконечный цикл. Значит, остановка цикла зависит ещё и от самих чисел в списке.",
      },
    ],
  },
];
