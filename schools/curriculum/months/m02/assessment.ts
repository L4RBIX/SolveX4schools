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
 * indices stay inside the list (the p.6 `oral_explanation`). Three blocks, in
 * that order, and deliberately no fourth.
 *
 * ## Why there is no fourth graded task here
 *
 * September's assessment was audited at 32+ minutes against a stated 20,
 * because it carried two coding problems, a bug hunt and an oral question.
 * October's arithmetic is the same and it has no more room: the paper trace is
 * ~5 minutes, the unseen problem ~10, and the oral piece runs alongside while
 * the teacher circulates. That is the entire budget, and it has now turned two
 * candidates away.
 *
 * The first was a `find_bug`. The month does have a bug-finding requirement and
 * it is met where the PDF actually puts it, in `m2.l9` («цикл мен индекс
 * қатесін табу»), not in a check that is already full.
 *
 * The second was written and shipped before it was caught: `m2.as.b3`, an
 * `explain` with four numbered questions about the learner's own b2 solution.
 * Two of those four were the questions `b4` then asked out loud one screen
 * later, so the check spent four minutes buying a second copy of an answer it
 * was about to hear. Its argument — that a question about your own program
 * cannot be recited — was the right argument, and it now lives inside `b4`,
 * which asks it in the mode the PDF names. Four numbered written answers plus
 * three spoken ones was never twenty minutes of work either way.
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
 * verification methods and cite p.6. October's own explanation requirement is
 * stated on p.7, but it is carried here by the p.6 oral block rather than by a
 * block of its own — the same sentence answered, one fewer task on the clock.
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
     * reasons `b4` then asks about, and an author's reference should be the
     * version they are prepared to defend out loud.
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
     * The p.6 oral check («ауызша түсіндіру»), and now the month's only
     * explanation block. It used to have a written twin one screen earlier,
     * `m2.as.b3`, an `explain` whose four numbered questions included «сенің
     * циклің неге тоқтайды» and «i неге 0 мен len(a) - 1 аралығынан шықпайды» —
     * which are questions (1) and (2) of this card in the other order. That was
     * wrong twice over. On the clock, a paper trace plus a from-scratch program
     * plus four written sub-answers plus three spoken ones is not twenty
     * minutes. And in substance, a learner who has just written «`while`
     * алдымен шартты тексереді» does not reason it out again for the teacher —
     * they read their own sheet back. The oral block was checking handwriting.
     *
     * So the three questions are now one line of reasoning instead of three
     * separate ones, and each answer is a different claim. (1) opens on a fact
     * that looks like a crash and is not: the loop ends with i = 6 on a
     * five-element list, and saying why `a[i]` never fired at 6 is the whole of
     * «индекстердің неге шекарадан шықпайтыны». (2) then makes termination
     * depend on the data rather than the shape, and it is not a yes/no — a 0 the
     * walk lands on freezes the program, a 0 it never reads changes nothing, and
     * `[2, 0, 1, 3, 4]` still stops at i = 6. (3) turns that same question on
     * the program the learner wrote in b2, where the honest answer is the
     * opposite: `i += 1` never consults the numbers, so no value can hang it.
     *
     * That third question is what b3 was for and it survives the deletion: it
     * is the one question here nobody can recite, because nobody but the
     * learner knows what they submitted, and it is now asked in the mode
     * October's own sentence names. What did not survive is b3's «тізімде бір
     * ғана күн болса, бағдарламаң нені шығарады?» — a fair question that b2
     * already grades twice, with the hidden cases «5 / 5» and «5 / 7». Asking
     * for it a fourth time out loud spends a minute the check does not have on
     * something it already owns.
     *
     * Settles as `unknown`. A teacher hears it and reads these points; nothing
     * about it is graded 0/1.
     */
    id: "m2.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["loops.while", "loops.for", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Мұғалімге ауызша түсіндір. Алдымен бірінші тапсырманың бағдарламасын есіңе түсір: цикл біткенде i = 6 болды, ал тізімде бар болғаны 5 элемент. (1) Неге бағдарлама индекс қатесімен құламады? (2) Сол тізімдегі сандардың біреуі 0 болса, цикл бәрібір тоқтай ма — нөлдің қай индексте тұрғанының маңызы бар ма? (3) Енді екінші тапсырмада өзің жазған бағдарламаны ал: оның тоқтайтынына неге сенімдісің және оның циклін нөл дәл солай шексіз ете ала ма?",
      ru: "Объясни учителю устно. Сначала вспомни программу из первого задания: когда цикл закончился, i = 6, а в списке всего 5 элементов. (1) Почему программа не упала с ошибкой индекса? (2) Остановится ли этот цикл, если одно из чисел в списке окажется нулём, — важно ли, на каком индексе стоит этот ноль? (3) Теперь возьми программу, которую ты написал во втором задании: почему ты уверен, что она останавливается, и может ли ноль точно так же сделать её цикл бесконечным?",
    },
    expectedPoints: [
      {
        kk: "i = 6 болғанда `a[i]` мүлде оқылмайды: `while` алдымен шартты тексереді, шарт жалған болғандықтан дене орындалмайды. Индекс тізімнен цикл біткеннен кейін ғана шығып кетеді.",
        ru: "При i = 6 `a[i]` не читается вовсе: `while` сначала проверяет условие, оно ложно — и тело не выполняется. Индекс выходит за пределы списка только после окончания цикла.",
      },
      {
        kk: "Жауап нөлдің қай индексте тұрғанына байланысты. Жүріс шынымен баратын индексте 0 тұрса, i өзгермей қалады да, бағдарлама сол индексте мәңгі тұрып қалады — шексіз цикл шығады. Ал жүріс мүлде бармайтын индекстегі нөл ешнәрсені өзгертпейді: `[2, 0, 1, 3, 4]` тізімінде 1-индекстегі нөл оқылмайды, цикл бұрынғыдай i = 6-да тоқтайды. Демек бұл циклдің тоқтауы тізім ұзындығына емес, ішіндегі сандарға байланысты.",
        ru: "Ответ зависит от того, на каком индексе стоит ноль. Если 0 стоит там, куда обход действительно попадает, i перестаёт меняться и программа зависает на этом индексе — получается бесконечный цикл. А ноль на индексе, куда обход вообще не заходит, ничего не меняет: в списке `[2, 0, 1, 3, 4]` ноль по индексу 1 не читается, и цикл всё так же останавливается при i = 6. Значит, остановка этого цикла зависит не от длины списка, а от самих чисел в нём.",
      },
      {
        kk: "Екінші тапсырманың циклі мүлде басқа себеппен тоқтайды: ондағы `i += 1` тізімдегі сандарға қарамайды, сондықтан дене ең көбі len(a) рет орындалады. Нөл тек қосындының өсуін баяулатар еді — бәрі нөл болса, жауап 0 шығады, бірақ цикл бәрібір тоқтайды. `for i in range(len(a))` жазылса да қорытынды сол: қадам саны алдын ала белгілі.",
        ru: "Цикл из второго задания останавливается совсем по другой причине: `i += 1` в нём не смотрит на числа списка, поэтому тело выполнится не больше len(a) раз. Ноль только замедлил бы рост суммы — если бы все числа были нулями, ответ был бы 0, но цикл всё равно закончился бы. Если написано `for i in range(len(a))`, вывод тот же: число шагов известно заранее.",
      },
    ],
  },
];
