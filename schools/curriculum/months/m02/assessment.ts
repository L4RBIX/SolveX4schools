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
 * the teacher circulates. That is the entire budget.
 *
 * The month does have a bug-finding requirement and it is met where the PDF
 * actually puts it, in `m2.l9` («цикл мен индекс қатесін табу»), not in a check
 * that is already full.
 *
 * ## Why these two programs, and why they are the same idea twice
 *
 * `b1` walks a list by jumping forward by the value it lands on. It is short,
 * it is in no lesson, and it cannot be guessed from the shape — the traversal
 * visits indices 0, 2, 3 and never reads two of the five elements. It also
 * ends with `i = 6` on a list of length 5, which is the exact situation the
 * month's third requirement is about: the index does leave the list, and
 * `a[i]` is still never evaluated there, because `while` tests before it steps.
 * That is what `b4` then asks out loud, and it is a question with a real answer
 * rather than a recital of «индекс 0-ден басталады».
 *
 * That question matters more in C++ than it did in Python, and `b4` says so.
 * Python would have raised IndexError the moment `a[6]` was read; C++ would
 * have read a number out of somebody else's memory and carried on. So "why did
 * the program not touch a[6]" stops being a curiosity about tracebacks and
 * becomes the only thing standing between this program and a silently wrong
 * answer.
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
 * Input shape follows the rest of the month: the count first, the numbers next,
 * the goal last. See `m2.l4`'s header for why C++ takes the count.
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
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {2, 5, 1, 3, 4};\n" +
      "    int n = a.size();\n" +
      "    int i = 0;\n" +
      "    int c = 0;\n" +
      "    while (i < n) {\n" +
      "        i = i + a[i];\n" +
      "        c += 1;\n" +
      "    }\n" +
      "    cout << c << endl;\n" +
      "    cout << i << endl;\n" +
      "    return 0;\n" +
      "}",
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
        kk: "Цикл i = 6 болғанда тоқтады: `n` = 5, ал 6 < 5 шарты жалған.",
        ru: "Цикл остановился при i = 6: `n` = 5, а условие 6 < 5 ложно.",
      },
    ],
  },
  {
    /*
     * «Цикл мен тізім қолданылатын есепті өз бетінше шешу» — one problem, blank
     * editor, no starter. The month's whole toolkit is needed and nothing more:
     * read a count, read a list, walk it, accumulate, compare against a goal,
     * and report a position rather than a value.
     *
     * The reference is written with `while` and a two-part condition on purpose.
     * A `for` over the indices with a guard is just as correct and passes the
     * same cases — but the `while` form is the one whose two stopping reasons
     * `b4` then asks about, and an author's reference should be the version
     * they are prepared to defend out loud.
     *
     * Elements are ≥ 1, so the running total only grows. That is not decoration:
     * it is what makes "the first day" well defined, and it is the fact the
     * learner leans on when explaining why the loop terminates. The bounds also
     * fit `int` with room to spare — 1000 days at 1000 problems each is a
     * million, and k stops at a million too.
     */
    id: "m2.as.b2",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["lists.traverse", "loops.accumulator", "loops.counter", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk: "Бірінші жолда күндердің саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлінген n бүтін сан: оқушының әр күні шығарған есеп саны, әрқайсысы 1-ден 1000-ға дейін. Үшінші жолда бір бүтін сан k — айлық жоспар (1 ≤ k ≤ 1 000 000). Жиналған есеп саны алғаш рет k-дан кем болмаған күннің нөмірін шығар; күндер бірден нөмірленеді. Егер барлық күннің қосындысы k-ға жетпесе, 0 шығар.",
      ru: "В первой строке дано количество дней n (1 ≤ n ≤ 1000). Во второй строке через пробел даны n целых чисел: сколько задач ученик решил в каждый из дней, каждое от 1 до 1000. В третьей строке одно целое число k — план на месяц (1 ≤ k ≤ 1 000 000). Выведи номер дня, в который накопленная сумма впервые стала не меньше k; дни нумеруются с единицы. Если сумма за все дни так и не достигла k, выведи 0.",
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
      "    for (int j = 0; j < n; j++) {\n" +
      "        cin >> a[j];\n" +
      "    }\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    int total = 0;\n" +
      "    int i = 0;\n" +
      "    while (i < n && total < k) {\n" +
      "        total += a[i];\n" +
      "        i += 1;\n" +
      "    }\n" +
      "    if (total >= k) {\n" +
      "        cout << i;\n" +
      "    } else {\n" +
      "        cout << 0;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* Visible sample: the goal is met in the middle, so a solution that
         reports the LAST qualifying day answers 5 and fails immediately. */
      { input: "5\n3 5 2 6 4\n10", expectedOutput: "3" },
      /* One day, and it is enough — the smallest list there is. */
      { input: "1\n5\n5", expectedOutput: "1", hidden: true },
      /* One day, and it is not enough. Same list, opposite answer. */
      { input: "1\n5\n7", expectedOutput: "0", hidden: true },
      /* All equal, and the total lands exactly on k: `>` instead of `>=`
         answers 4 here. */
      { input: "4\n2 2 2 2\n6", expectedOutput: "3", hidden: true },
      /* All equal, goal never met — a full traversal that ends with no answer. */
      { input: "4\n2 2 2 2\n9", expectedOutput: "0", hidden: true },
      /* The answer is the last element: a loop stopping at n − 1 says 0. */
      { input: "4\n2 3 1 4\n10", expectedOutput: "4", hidden: true },
      /* Day one already meets the goal: printing the index gives 0. */
      { input: "3\n1 2 3\n1", expectedOutput: "1", hidden: true },
      /* Exact hit again, but mid-list and without duplicates, so a `>` that
         survived «2 2 2 2 / 6» by accident does not survive this. */
      { input: "3\n3 5 1\n8", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * The p.6 oral check («ауызша түсіндіру»), and the month's only explanation
     * block. The three questions are one line of reasoning rather than three
     * separate ones, and each answer is a different claim.
     *
     * (1) opens on a fact that looks like a crash and is not: the loop ends
     * with i = 6 on a five-element list, and saying why `a[i]` was never
     * evaluated there is the whole of «индекстердің неге шекарадан
     * шықпайтыны». The C++ version of that question has more at stake than the
     * Python one did — `a[6]` would not have stopped the program, it would have
     * handed back a number from outside the list — and the third expected point
     * says so.
     *
     * (2) then makes termination depend on the data rather than the shape, and
     * it is not a yes/no — a 0 the walk lands on freezes the program, a 0 it
     * never reads changes nothing, and `{2, 0, 1, 3, 4}` still stops at i = 6.
     *
     * (3) turns that same question on the program the learner wrote in b2,
     * where the honest answer is the opposite: `i += 1;` never consults the
     * numbers, so no value can hang it. It is the one question here nobody can
     * recite, because nobody but the learner knows what they submitted.
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
      kk: "Мұғалімге ауызша түсіндір. Алдымен бірінші тапсырманың бағдарламасын есіңе түсір: цикл біткенде i = 6 болды, ал тізімде бар болғаны 5 элемент. (1) Неге бағдарлама тізімнен тыс элементті мүлде оқымады? (2) Сол тізімдегі сандардың біреуі 0 болса, цикл бәрібір тоқтай ма — нөлдің қай индексте тұрғанының маңызы бар ма? (3) Енді екінші тапсырмада өзің жазған бағдарламаны ал: оның тоқтайтынына неге сенімдісің және оның циклін нөл дәл солай шексіз ете ала ма?",
      ru: "Объясни учителю устно. Сначала вспомни программу из первого задания: когда цикл закончился, i = 6, а в списке всего 5 элементов. (1) Почему программа так и не прочитала элемент за пределами списка? (2) Остановится ли этот цикл, если одно из чисел в списке окажется нулём, — важно ли, на каком индексе стоит этот ноль? (3) Теперь возьми программу, которую ты написал во втором задании: почему ты уверен, что она останавливается, и может ли ноль точно так же сделать её цикл бесконечным?",
    },
    expectedPoints: [
      {
        kk: "i = 6 болғанда `a[i]` мүлде оқылмайды: `while` алдымен шартты тексереді, шарт жалған болғандықтан дене орындалмайды. Индекс тізімнен цикл біткеннен кейін ғана шығып кетеді, ал ол кезде оны ешкім қолданбайды.",
        ru: "При i = 6 `a[i]` не читается вовсе: `while` сначала проверяет условие, оно ложно — и тело не выполняется. Индекс выходит за пределы списка только после окончания цикла, когда им уже никто не пользуется.",
      },
      {
        kk: "Егер шарт тексерілмей, `a[6]` оқылып кетсе, C++ бағдарламаны тоқтатпайды: `a[i]` индексті тексермейді, сондықтан тізімнен тыс жердегі кездейсоқ сан алынып, жауап үнсіз бұрмаланар еді. Дәл сондықтан «шарт алдымен тексеріледі» деген сөйлем мұнда жай ғана қызық емес, ол — жауаптың дұрыстығын сақтап тұрған жалғыз нәрсе.",
        ru: "Если бы условие не проверялось и `a[6]` всё-таки прочитали, C++ не остановил бы программу: `a[i]` не проверяет индекс, поэтому взялось бы случайное число за пределами списка и ответ молча испортился бы. Именно поэтому фраза «условие проверяется первым» здесь не любопытный факт, а единственное, что удерживает ответ верным.",
      },
      {
        kk: "Жауап нөлдің қай индексте тұрғанына байланысты. Жүріс шынымен баратын индексте 0 тұрса, i өзгермей қалады да, бағдарлама сол индексте мәңгі тұрып қалады — шексіз цикл шығады. Ал жүріс мүлде бармайтын индекстегі нөл ешнәрсені өзгертпейді: `{2, 0, 1, 3, 4}` тізімінде 1-индекстегі нөл оқылмайды, цикл бұрынғыдай i = 6-да тоқтайды. Демек бұл циклдің тоқтауы тізім ұзындығына емес, ішіндегі сандарға байланысты.",
        ru: "Ответ зависит от того, на каком индексе стоит ноль. Если 0 стоит там, куда обход действительно попадает, i перестаёт меняться и программа зависает на этом индексе — получается бесконечный цикл. А ноль на индексе, куда обход вообще не заходит, ничего не меняет: в списке `{2, 0, 1, 3, 4}` ноль по индексу 1 не читается, и цикл всё так же останавливается при i = 6. Значит, остановка этого цикла зависит не от длины списка, а от самих чисел в нём.",
      },
      {
        kk: "Екінші тапсырманың циклі мүлде басқа себеппен тоқтайды: ондағы `i += 1;` тізімдегі сандарға қарамайды, сондықтан дене ең көбі n рет орындалады. Нөл тек қосындының өсуін баяулатар еді — бәрі нөл болса, жауап 0 шығады, бірақ цикл бәрібір тоқтайды. `for (int i = 0; i < n; i++)` деп жазылса да қорытынды сол: қадам саны алдын ала белгілі.",
        ru: "Цикл из второго задания останавливается совсем по другой причине: `i += 1;` в нём не смотрит на числа списка, поэтому тело выполнится не больше n раз. Ноль только замедлил бы рост суммы — если бы все числа были нулями, ответ был бы 0, но цикл всё равно закончился бы. Если написано `for (int i = 0; i < n; i++)`, вывод тот же: число шагов известно заранее.",
      },
    ],
  },
];
