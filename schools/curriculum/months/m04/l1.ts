import type { LessonBlock } from "../../types";

/**
 * Lesson m4.l1 · «Қадам санын санау» / «Подсчёт числа шагов». 8 min.
 * PDF p.8, December. Skills: `perf.time_estimate`, `loops.nested`.
 *
 * ## The clause that drives every block here
 *
 * December's mastery paragraph is one sentence and it is not about notation:
 *
 *   «Бағдарламаның берілген уақытқа үлгеретінін бағалау. Бұл спорттық
 *    бағдарламалаудың негізгі идеясы: дұрыс жауап тым кеш шықса, қабылданбайды.»
 *
 * A correct answer that arrives too late is rejected. And the practice list
 * names the task type this lesson owns by name — «осы бағдарлама үлгере ме?».
 * So the lesson estimates, and it estimates in numbers a fourteen-year-old can
 * check on paper: a loop over n does n steps, a loop inside a loop does n × m,
 * and the whole month turns on what those numbers are when n is 100 000.
 *
 * ## What is deliberately absent
 *
 * O() notation. The programme never writes it, and a symbol introduced here
 * would let a learner answer «үлгере ме?» by pattern-matching a shape — "two
 * loops, so O(n²), so slow" — which is precisely the reasoning `m4.l1.b5`
 * exists to break: a SINGLE loop over 10⁹ is also too slow. The arithmetic is
 * the tool; the shape is not.
 *
 * ## The one number the month rests on, stated once
 *
 * `m4.l1.b1` states it plainly and every later block uses it without restating
 * it: a computer manages roughly 10⁷–10⁸ simple steps per second. Every
 * judgement block below is built so the verdict is safe on either end of that
 * range — 4 · 10⁶ finishes under both, 10⁹ and 10¹⁰ fail under both. A task
 * whose answer flips depending on where in the range you sit would be teaching
 * the learner to guess, so there is no such task here. `m4.l1.b7` states its
 * 100 000 000 budget inside the task, as an assumption of that task, rather
 * than pretending the rule of thumb is a boundary.
 *
 * ## The five builtins that arrive this month
 *
 * `sum()` and `max()` are used here and announced in `b1`, once, with the
 * reason they were withheld: October's «тізімдегі максимум мен минимум» and
 * November's max/min function ARE the exercise, and a builtin in either month
 * deletes it. The point made in the same breath is the one this lesson needs —
 * `sum(a)` still walks the whole list, so it still costs n steps. A short line
 * is not a free line. `sorted()` arrives in `m4.l3` and is not used here.
 *
 * ## Support
 *
 * `m4.l1.b8` is the one blank editor, so it is the block support substitutes:
 * `m4.l1.b8s` is the same problem completed rather than written. Its scaffold
 * is a one-pass running maximum — a different program from b8's reference
 * solution and from every program shown on a card in this lesson, so a support
 * learner reconstructs a shape rather than transcribing one they have just
 * read.
 */

export const M4_L1: LessonBlock[] = [
  {
    id: "m4.l1.b1",
    type: "concept",
    skillRefs: ["perf.time_estimate", "loops.for", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Қадамдарды санау және секундтық шама",
      ru: "Считаем шаги и оцениваем секунду",
    },
    /*
     * Three rules and one number, and nothing else. The temptation is to
     * introduce O() here; the programme never does, and a symbol would let the
     * learner judge by the shape of the code instead of by its step count —
     * which is the exact error b5 is built to catch.
     */
    body: {
      kk:
        "Желтоқсанның бір ғана сұрағы бар: бағдарлама берілген уақытқа үлгере ме? Жарыста дұрыс жауап тым кеш шықса, қабылданбайды — сондықтан кодқа отырмас бұрын шешімнің қанша қадам жасайтынын санап алған дұрыс.\n\n" +
        "Санау ережелері қарапайым. `for i in range(n)` циклінің денесі дәл n рет орындалады, яғни n қадам. Екі цикл қатар тұрса — бірі бітіп, екіншісі басталса — қадамдар қосылады: n + m. Ал бір циклдің ішінде екіншісі тұрса, ішкі цикл сыртқы циклдің әр қадамында толықтай айналады, сондықтан қадамдар қосылмайды, көбейтіледі: n × m.\n\n" +
        "Енді бүкіл ай сүйенетін жалғыз сан: компьютер бір секундта шамамен 10 000 000-нан 100 000 000-ға дейін қарапайым қадам жасайды. Осыдан үш қорытынды шығады. 1 000 000 қадам — лезде бітеді. 1 000 000 000 қадам — бір секундке үлгермейді. Ал n = 100 000 болғанда n × n = 10 000 000 000 қадам, яғни он миллиард — мұнда үміт мүлде жоқ.\n\n" +
        "Тағы бір жаңалық: осы айдан бастап Python-ның дайын `sum(a)`, `min(a)`, `max(a)` амалдарын қолдануға болады. Қазан мен қарашада біз оларды әдейі циклмен өз қолымызбен жаздық — сол цикл үйретілетін нәрсенің өзі еді. Бірақ есіңде болсын: `sum(a)` да іштей тізімді басынан аяғына дейін қарап шығады, яғни n қадам жасайды. Қысқа жазылған амал — тегін амал емес. Тізімді реттейтін `sorted` осы айдың келесі сабақтарында келеді.",
      ru:
        "У декабря один вопрос: уложится ли программа в отведённое время? На соревновании правильный ответ, полученный слишком поздно, не принимается — поэтому, прежде чем сесть за код, стоит посчитать, сколько шагов сделает решение.\n\n" +
        "Правила подсчёта простые. Тело цикла `for i in range(n)` выполняется ровно n раз, то есть n шагов. Если два цикла идут подряд — один закончился, начался второй — шаги складываются: n + m. А если один цикл стоит внутри другого, внутренний прокручивается целиком на каждом шаге внешнего, поэтому шаги не складываются, а умножаются: n × m.\n\n" +
        "И теперь единственное число, на которое опирается весь месяц: компьютер делает примерно от 10 000 000 до 100 000 000 простых шагов в секунду. Отсюда три вывода. 1 000 000 шагов — заканчивается мгновенно. 1 000 000 000 шагов — в секунду не укладывается. А при n = 100 000 произведение n × n даёт 10 000 000 000 шагов, десять миллиардов — здесь надежды нет вовсе.\n\n" +
        "Ещё одна новость: с этого месяца можно пользоваться готовыми `sum(a)`, `min(a)`, `max(a)`. В октябре и ноябре мы писали их циклом вручную намеренно — этот цикл и был тем, чему учили. Но помни: `sum(a)` тоже проходит список от начала до конца, то есть делает n шагов. Коротко записанная операция — не бесплатная операция. Сортировка `sorted` появится на следующих уроках этого месяца.",
    },
    code:
      "n = 1000\n" +
      "\n" +
      "single = 0\n" +
      "for i in range(n):\n" +
      "    single = single + 1\n" +
      "\n" +
      "double = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(n):\n" +
      "        double = double + 1\n" +
      "\n" +
      "print(single)  # 1000\n" +
      "print(double)  # 1000000",
  },
  {
    /*
     * The month's «толық талданған мысал» in its cheapest useful form: one
     * program, two parts, one verdict. Both parts are counted, and the second
     * point of the example is the one a step count makes obvious and prose does
     * not — 100 000 + 5 000 000 000 is 5 000 000 000. The cheap half of a
     * program never rescues the expensive half, and a learner who has seen that
     * arithmetic once stops trying to optimise the wrong loop.
     *
     * `sum(a)` is the first use of a December builtin in the lesson, and step 1
     * says out loud that it still costs n. Announced in b1, paid for here.
     */
    id: "m4.l1.b2",
    type: "worked_example",
    skillRefs: ["perf.time_estimate", "loops.nested", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: бір бағдарлама, екі баға",
      ru: "Разобранный пример: одна программа, две оценки",
    },
    problem: {
      kk: "Олимпиадаға n оқушы қатысты, әрқайсысы бір ұпай жинады. Ұйымдастырушыға екі сан керек: барлық ұпайдың қосындысы және ұпайлары дәл бірдей оқушылардың неше жұбы бар екені. Мысалы, 6 оқушының ұпайлары 4 7 4 1 7 4 болса, қосынды 27, ал бірдей ұпайлы жұптар саны 4 — үш төрттіктен үш жұп және екі жетіліктен бір жұп. Төмендегі бағдарлама дәл осыны істейді. Сұрақ: n = 100 000 болғанда ол бір секундке үлгере ме?",
      ru: "В олимпиаде участвовали n учеников, каждый набрал по одному баллу. Организатору нужны два числа: сумма всех баллов и количество пар учеников с в точности одинаковыми баллами. Например, если у 6 учеников баллы 4 7 4 1 7 4, то сумма равна 27, а пар с одинаковыми баллами — 4: три пары из трёх четвёрок и одна пара из двух семёрок. Программа ниже делает именно это. Вопрос: уложится ли она в одну секунду при n = 100 000?",
    },
    steps: [
      {
        kk: "Бірінші бөлік — `sum(a)`. Ол тізімдегі әр санды бір рет қосады, демек n қадам жасайды. n = 100 000 болса — 100 000 қадам. Секундына ондаған миллион қадам жасайтын компьютер үшін бұл көзді ашып жұмғанша.",
        ru: "Первая часть — `sum(a)`. Она прибавляет каждое число списка ровно один раз, то есть делает n шагов. При n = 100 000 это 100 000 шагов. Для компьютера, делающего десятки миллионов шагов в секунду, это мгновение.",
      },
      {
        kk: "Екінші бөлік — циклдің ішіндегі цикл. Сыртқы цикл `i` бойынша n рет айналады, ал оның әр қадамында ішкі цикл `j` бойынша i-ден кейінгі барлық элементті қарап шығады. Демек салыстырулар саны — `i < j` болатын барлық (i, j) жұбының саны, яғни n × (n − 1) / 2.",
        ru: "Вторая часть — цикл внутри цикла. Внешний цикл по `i` прокручивается n раз, и на каждом его шаге внутренний цикл по `j` просматривает все элементы после i-го. Значит, число сравнений равно числу всех пар (i, j) с условием `i < j`, то есть n × (n − 1) / 2.",
      },
      {
        kk: "n = 100 000 үшін санаймыз: 100 000 × 99 999 / 2 ≈ 5 000 000 000. Бес миллиард салыстыру.",
        ru: "Считаем для n = 100 000: 100 000 × 99 999 / 2 ≈ 5 000 000 000. Пять миллиардов сравнений.",
      },
      {
        kk: "Ережеге саламыз: секундына ең жақсы жағдайда 100 000 000 қадам. 5 000 000 000 : 100 000 000 = 50. Яғни кемінде елу секунд керек, ал бізде бір секунд бар.",
        ru: "Подставляем в правило: в лучшем случае 100 000 000 шагов в секунду. 5 000 000 000 : 100 000 000 = 50. То есть нужно минимум пятьдесят секунд, а у нас есть одна.",
      },
      {
        kk: "Қосындыны есептейтін 100 000 қадам бұл фонда мүлде байқалмайды: 100 000 + 5 000 000 000 ≈ 5 000 000 000. Бағдарламаның уақытын әрқашан оның ең қымбат бөлігі шешеді, сондықтан жылдамдатуды сол жерден бастау керек.",
        ru: "Сто тысяч шагов на сумму на этом фоне вообще не видны: 100 000 + 5 000 000 000 ≈ 5 000 000 000. Время программы всегда определяет её самая дорогая часть — ускорять надо именно её.",
      },
      {
        kk: "Жауап: үлгермейді. Бірінші бөлігі дұрыс әрі жылдам, бірақ екінші бөлігі бүкіл бағдарламаны құлатады. Жауаптың дұрыстығы мұнда көмектеспейді — ол жай ғана кеш келеді.",
        ru: "Ответ: не уложится. Первая часть верна и быстра, но вторая роняет всю программу. Правильность ответа тут не спасает — он просто придёт поздно.",
      },
    ],
    code:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "\n" +
      "print(sum(a))\n" +
      "\n" +
      "pairs = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        if a[i] == a[j]:\n" +
      "            pairs = pairs + 1\n" +
      "print(pairs)",
    stdin: "6\n4 7 4 1 7 4",
    result: {
      kk: "6 оқушы үшін (4 7 4 1 7 4) экранға 27, содан кейін 4 шығады — лезде. Ал n = 100 000 болғанда бірінші сан бірден шығады да, екіншісін компьютер елу секундтан аса санайды: бұл шешім үлгермейді.",
      ru: "Для 6 учеников (4 7 4 1 7 4) на экран выйдет 27, затем 4 — мгновенно. А при n = 100 000 первое число появится сразу, но второе компьютер будет считать больше пятидесяти секунд: это решение не укладывается.",
    },
  },
  {
    /*
     * Two counters, not one, so the answer separates «сыртқы дене неше рет» from
     * «ішкі дене неше рет». A single number would let «12» be read as 3 × 4
     * without ever locating where the 12 comes from.
     *
     * `3 7` is the only option that requires one specific belief — that the two
     * loop lengths add — so it is the only one mapped. `3 4` is left unmapped
     * on purpose: it can come from «ішкі цикл бүкіл бағдарламада бір рет
     * айналады» or from simply reading the inner `range(4)` and reporting it,
     * and those are two different misunderstandings with the same answer.
     */
    id: "m4.l1.b3",
    type: "prediction",
    skillRefs: ["loops.nested", "loops.counter", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады? Бірінші сан — сыртқы циклдің денесі неше рет орындалғаны, екіншісі — ішкі циклдің денесі неше рет орындалғаны.",
      ru: "Что выведет эта программа? Первое число — сколько раз выполнилось тело внешнего цикла, второе — сколько раз выполнилось тело внутреннего.",
    },
    code:
      "outer = 0\n" +
      "inner = 0\n" +
      "for i in range(3):\n" +
      "    outer = outer + 1\n" +
      "    for j in range(4):\n" +
      "        inner = inner + 1\n" +
      "print(outer, inner)",
    answer: "3 12",
    options: ["3 12", "3 7", "3 4", "12 12"],
    diagnosticMapping: {
      "3 7": {
        failureClass: "nested_loop_added_not_multiplied",
        justification:
          "3 + 4 = 7. Бұл жауап тек циклдерді қатар тұрған екі цикл деп оқығанда шығады. Шын мәнінде ішкі цикл сыртқы циклдің әр қадамында толық төрт рет айналады, сондықтан қадамдар қосылмай, көбейтіледі: 3 × 4 = 12.",
      },
    },
  },
  {
    /*
     * PDF p.8 names «осы бағдарлама үлгере ме?» as a task type; this is the
     * first of the lesson's two judgements and the one whose verdict is «no».
     *
     * The distractors are the three miscounts this program actually invites:
     * n (the inner loop contributes nothing), n + n (the loops are read as
     * consecutive), and n³ (the comparison inside is counted as a third loop).
     * Only the first is mapped — arriving at exactly 100 000 for a program with
     * two nested loops has one cause and it is stated in the justification.
     * `200 000` is left unmapped: adding the loop lengths and believing the
     * inner loop runs once per program both land there.
     */
    id: "m4.l1.b4",
    type: "multiple_choice",
    skillRefs: ["perf.time_estimate", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Тізімде n = 100 000 сан бар. Бағдарлама кез келген екі санның қосындысының ең үлкенін іздейді. Ол шамамен қанша қадам жасайды және бір секундке үлгере ме? Компьютер секундына ең жақсы жағдайда 100 000 000 қарапайым қадам жасайды деп есепте.",
      ru: "В списке n = 100 000 чисел. Программа ищет наибольшую сумму двух любых чисел. Сколько примерно шагов она сделает и уложится ли в одну секунду? Считай, что компьютер делает в лучшем случае 100 000 000 простых шагов в секунду.",
    },
    code:
      "n = 100000\n" +
      "a = list(map(int, input().split()))\n" +
      "best = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(n):\n" +
      "        if a[i] + a[j] > best:\n" +
      "            best = a[i] + a[j]\n" +
      "print(best)",
    options: [
      {
        id: "o1",
        label: {
          kk: "Шамамен 100 000 қадам — үлгереді",
          ru: "Примерно 100 000 шагов — успеет",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Шамамен 200 000 қадам — үлгереді",
          ru: "Примерно 200 000 шагов — успеет",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Шамамен 10 000 000 000 қадам — үлгермейді",
          ru: "Примерно 10 000 000 000 шагов — не успеет",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Шамамен 1 000 000 000 000 000 қадам — үлгермейді",
          ru: "Примерно 1 000 000 000 000 000 шагов — не успеет",
        },
      },
    ],
    correctOptionId: "o3",
    diagnosticMapping: {
      o1: {
        failureClass: "nested_loop_ignored",
        justification:
          "100 000 — бұл тек сыртқы циклдің айналымы. Екі кірістірілген циклі бар бағдарламада дәл осы санға келу үшін ішкі циклді мүлде санамау керек: ол сыртқы циклдің әр қадамында тағы 100 000 рет айналады, сондықтан қадам саны 100 000 емес, 100 000 × 100 000.",
      },
    },
  },
  {
    /*
     * The second judgement, and it exists to break the rule the first one is
     * about to install: «екі цикл — баяу, бір цикл — жылдам». Here there is one
     * loop and it is far too slow, because the constraint says n reaches 10⁹.
     * Speed is decided by the step count, never by the shape of the code — which
     * is also why this lesson never writes O().
     *
     * Both mapped options are unambiguous for different reasons. `o1` states its
     * own reasoning in the label, so choosing it IS the claim that loop count
     * decides. `o3` gets the count exactly right and the verdict wrong, which
     * can only mean the per-second figure was never applied.
     */
    id: "m4.l1.b5",
    type: "multiple_choice",
    skillRefs: ["perf.time_estimate", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бұл бағдарламада ішкі цикл жоқ, бар болғаны біреу. Бірақ есептің шартында n мәні 1 000 000 000-ға дейін жетуі мүмкін деп жазылған. Ең үлкен n үшін бағдарлама шамамен қанша қадам жасайды және бір секундке үлгере ме? Компьютер секундына ең жақсы жағдайда 100 000 000 қарапайым қадам жасайды деп есепте.",
      ru: "В этой программе нет вложенного цикла — он всего один. Но в условии задачи сказано, что n может доходить до 1 000 000 000. Сколько примерно шагов сделает программа при наибольшем n и уложится ли она в одну секунду? Считай, что компьютер делает в лучшем случае 100 000 000 простых шагов в секунду.",
    },
    code:
      "n = int(input())\n" +
      "total = 0\n" +
      "for i in range(n):\n" +
      "    total = total + i\n" +
      "print(total)",
    options: [
      {
        id: "o1",
        label: {
          kk: "Цикл біреу ғана, сондықтан n қандай болса да үлгереді",
          ru: "Цикл всего один, поэтому уложится при любом n",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Шамамен 1 000 000 000 қадам — үлгермейді",
          ru: "Примерно 1 000 000 000 шагов — не успеет",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Шамамен 1 000 000 000 қадам — үлгереді",
          ru: "Примерно 1 000 000 000 шагов — успеет",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Шамамен 1 000 000 қадам — үлгереді",
          ru: "Примерно 1 000 000 шагов — успеет",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "speed_judged_by_shape_not_count",
        justification:
          "Бұл нұсқа өз ішінде дәлелін де айтып тұр: шешім циклдің САНЫНА қарап қабылданған. Уақытты цикл саны емес, қадам саны шешеді — бір ғана цикл миллиард рет айналса, ол екі кірістірілген циклден де баяу болады.",
      },
      o3: {
        failureClass: "time_budget_rule_not_applied",
        justification:
          "Қадам саны дәл дұрыс есептелген, бірақ ол секундтық шамамен салыстырылмаған. Секундына 100 000 000 қадам жасайтын компьютер 1 000 000 000 қадамға кемінде он секунд жұмсайды, сондықтан дұрыс есептен кейінгі жауап «үлгереді» бола алмайды.",
      },
    },
  },
  {
    /*
     * The count stops being something the learner is told and becomes something
     * they watch: `c` is on screen and the table makes them write down its value
     * after every execution of line 5.
     *
     * The triangular bound is the reason this block is worth eight lines. The
     * last row is line 6, and it deliberately carries no `j`: at i = 3 the range
     * `range(4, 4)` is empty, so the inner body never runs and `c` does not
     * move. Printing a `j` there would show a step that never happened. What
     * the learner should leave with is the shape of the count — 3 + 2 + 1 + 0,
     * not 4 × 4 — which is exactly the sum m4.l1.b7 asks them to generalise.
     */
    id: "m4.l1.b6",
    type: "trace_code",
    skillRefs: ["loops.nested", "loops.counter", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "Мұнда `c` — қадам санағышы: ішкі циклдің денесі әр орындалғанда бірге өседі. Кестені толтыр — ішкі дене әр орындалғанда `i`, `j` және `c` мәндері қандай болады? Соңғы жолда `i` мәні неге өзгерді, ал `c` неге өзгермей қалды?",
      ru: "Здесь `c` — счётчик шагов: он увеличивается на единицу при каждом выполнении тела внутреннего цикла. Заполни таблицу — какими будут `i`, `j` и `c` при каждом выполнении внутреннего тела? В последней строке подумай, почему `i` изменился, а `c` остался прежним.",
    },
    code:
      "n = 4\n" +
      "c = 0\n" +
      "for i in range(n):\n" +
      "    for j in range(i + 1, n):\n" +
      "        c = c + 1\n" +
      "print(c)",
    steps: [
      { line: 2, vars: { c: "0" } },
      { line: 5, vars: { i: "0", j: "1", c: "1" } },
      { line: 5, vars: { i: "0", j: "2", c: "2" } },
      { line: 5, vars: { i: "0", j: "3", c: "3" } },
      { line: 5, vars: { i: "1", j: "2", c: "4" } },
      { line: 5, vars: { i: "1", j: "3", c: "5" } },
      { line: 5, vars: { i: "2", j: "3", c: "6" } },
      { line: 6, vars: { i: "3", c: "6" } },
    ],
  },
  {
    /*
     * PDF p.8's «осы бағдарлама үлгере ме?» written as a program instead of as
     * an opinion: the learner encodes the month's rule and the machine checks
     * the arithmetic. n reaches 10⁹, so counting the pairs with a loop is
     * itself the thing the task is about — the count has to be computed, not
     * iterated.
     *
     * The two cases that earn their place are 14142 and 14143, the neighbours
     * either side of the 100 000 000 budget: 99 991 011 → yes, 100 005 153 → no.
     * They kill a solution that judges by n rather than by the pair count, and
     * a solution whose comparison faces the wrong way. `1` kills the formula
     * written as n × n / 2, which gives 0.5 there — and `/` instead of `//`
     * fails everything from 100000 upward by printing a float.
     */
    id: "m4.l1.b7",
    type: "write_code",
    skillRefs: [
      "perf.time_estimate",
      "arith.basic",
      "arith.integer_division",
      "cond.if_elif_else",
      "io.read",
    ],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Бағдарлама n элементтен тұратын тізімнің барлық жұбын бір рет қарап шығады: `i < j` болатын әр (i, j) жұбы үшін бір қадам. Бірінші элемент үшін одан кейінгі n − 1 элемент қаралады, екіншісі үшін n − 2, ..., соңғысы үшін 0. Бір жолда бүтін n беріледі (1 ≤ n ≤ 1 000 000 000). Екі жолға жауап шығар: бірінші жолға — қадамдардың саны (бүтін сан), екінші жолға — сол сан 100 000 000-нан аспаса `yes`, ал одан үлкен болса `no` деген сөз. Бұл есепте бағдарлама 100 000 000 қадамға дейін бір секундке үлгереді деп есептейміз. n үлкен болғандықтан қадамдарды циклмен санауға болмайды — қосындыны формуламен тап.",
      ru: "Программа один раз просматривает все пары списка из n элементов: по одному шагу на каждую пару (i, j) с условием `i < j`. Для первого элемента просматриваются следующие за ним n − 1 элементов, для второго — n − 2, ..., для последнего — 0. В одной строке дано целое n (1 ≤ n ≤ 1 000 000 000). Выведи ответ на двух строках: в первой — число шагов (целое число), во второй — слово `yes`, если это число не превышает 100 000 000, и слово `no`, если оно больше. В этой задаче считаем, что до 100 000 000 шагов программа укладывается в одну секунду. Поскольку n велико, считать шаги циклом нельзя — найди сумму по формуле.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "steps = n * (n - 1) // 2\n" +
      "print(steps)\n" +
      "if steps <= 100000000:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    cases: [
      { input: "2", expectedOutput: "1\nyes" },
      { input: "1000", expectedOutput: "499500\nyes" },
      { input: "1", expectedOutput: "0\nyes", hidden: true },
      { input: "4", expectedOutput: "6\nyes", hidden: true },
      { input: "14142", expectedOutput: "99991011\nyes", hidden: true },
      { input: "14143", expectedOutput: "100005153\nno", hidden: true },
      { input: "100000", expectedOutput: "4999950000\nno", hidden: true },
      { input: "1000000000", expectedOutput: "499999999500000000\nno", hidden: true },
    ],
  },
  {
    /*
     * The lesson's point applied in the other direction: the obvious solution is
     * fine, and the learner is asked to establish that BEFORE writing it. The
     * prompt hands over the constraint and the count — two passes over 100 000
     * elements is 200 000 steps — so the reasoning is done in the statement and
     * the code is allowed to be simple. December is not a month in which every
     * naive solution is wrong.
     *
     * Cases are chosen against the wrong solutions rather than for a number:
     * all-equal (a scan that stops at the first maximum gives 1), all-negative
     * (a counter starting from `best = 0` gives 0), a single element, and a
     * strictly increasing list where the maximum is last (a loop that stops one
     * short misses it).
     */
    id: "m4.l1.b8",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.counter", "perf.time_estimate", "io.read"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Мектеп олимпиадасына n оқушы қатысты. Бірінші жолда n беріледі (1 ≤ n ≤ 100 000), екінші жолда — сол n оқушының ұпайлары, бос орынмен бөлініп (әр ұпай −1 000 000 мен 1 000 000 аралығында, теріс те болуы мүмкін). Ең жоғары ұпайды және дәл сол ұпайды алған оқушылардың санын бір жолға, бос орынмен бөліп шығар. Кодқа отырмас бұрын жоспарыңның бағасын шығар: тізімді екі рет қарап шығу 2 × 100 000 = 200 000 қадам, ал бұл бір секундке еркін сыяды — сондықтан мұнда қарапайым шешім жеткілікті.",
      ru: "В школьной олимпиаде участвовали n учеников. В первой строке дано n (1 ≤ n ≤ 100 000), во второй — баллы этих n учеников через пробел (каждый балл от −1 000 000 до 1 000 000, они могут быть отрицательными). Выведи в одну строку через пробел наибольший балл и количество учеников, набравших ровно его. Прежде чем сесть за код, оцени свой план: два прохода по списку — это 2 × 100 000 = 200 000 шагов, а столько свободно укладывается в одну секунду, поэтому здесь достаточно простого решения.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "best = max(a)\n" +
      "c = 0\n" +
      "for x in a:\n" +
      "    if x == best:\n" +
      "        c = c + 1\n" +
      "print(best, c)",
    cases: [
      { input: "5\n3 9 1 9 4", expectedOutput: "9 2" },
      { input: "1\n7", expectedOutput: "7 1" },
      { input: "4\n2 2 2 2", expectedOutput: "2 4", hidden: true },
      { input: "3\n-5 -1 -9", expectedOutput: "-1 1", hidden: true },
      { input: "6\n1 2 3 4 5 6", expectedOutput: "6 1", hidden: true },
      { input: "7\n-1000000 -1000000 -3 -1000000 -3 -7 -3", expectedOutput: "-3 3", hidden: true },
    ],
  },
  {
    /*
     * Support substitution for m4.l1.b8, per PDF p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ». Same problem, same output, same
     * constraint — what is withheld is the blank editor.
     *
     * The scaffold is deliberately NOT b8's reference solution with holes in it.
     * It is the one-pass version: the maximum and the counter move together,
     * which makes the three blanks the three places this problem can actually
     * go wrong. `range(1, ...)` because `a[0]` is already counted; `c = 1`, not
     * `c = 0`, when a new maximum appears, because the element that set it
     * counts as the first one; and `elif`, not `if`, because after `best` has
     * just been reassigned the second test would be true as well and the same
     * student would be counted twice.
     */
    id: "m4.l1.b8s",
    type: "fill_blank",
    skillRefs: ["lists.traverse", "loops.counter", "lists.index", "perf.time_estimate"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Сол есеп: бірінші жолда оқушылар саны n (1 ≤ n ≤ 100 000), екінші жолда ұпайлар беріледі; ең жоғары ұпайды және сол ұпайды алған оқушылар санын бос орынмен бөліп шығару керек. Бағдарлама тізімді бір-ақ рет қарап шығады — 100 000 қадам, бұл бір секундке еркін сыяды. Үш бос орынды толтыр. Біріншісі — цикл қай индекстен басталады (`a[0]` есепке алынып қойған). Екіншісі — жаңа ең жоғары ұпай табылғанда санағыш нешеге тең болуы керек. Үшіншісі — келесі тексеруді бастайтын кілт сөз: жаңа максимум табылған жағдайда бұл тексеру орындалмауы тиіс.",
      ru: "Та же задача: в первой строке число учеников n (1 ≤ n ≤ 100 000), во второй — баллы; нужно вывести через пробел наибольший балл и количество набравших ровно его. Программа проходит список всего один раз — 100 000 шагов, это свободно укладывается в секунду. Заполни три пропуска. Первый — с какого индекса начинается цикл (`a[0]` уже учтён). Второй — чему должен равняться счётчик, когда найден новый наибольший балл. Третий — ключевое слово, начинающее следующую проверку: если новый максимум только что найден, эта проверка выполняться не должна.",
    },
    template:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "best = a[0]\n" +
      "c = 1\n" +
      "for i in range(___, len(a)):\n" +
      "    if a[i] > best:\n" +
      "        best = a[i]\n" +
      "        c = ___\n" +
      "    ___ a[i] == best:\n" +
      "        c = c + 1\n" +
      "print(best, c)",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "1" },
      { id: "f3", answer: "elif" },
    ],
  },
];
