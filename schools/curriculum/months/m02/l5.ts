import type { LessonBlock } from "../../types";

/**
 * m2.l5 · Тізімді қарап шығу — walking a list once, and the maximum.
 *
 * PDF p.7 names three families this lesson owns: «тізімдегі максимум мен
 * минимум», «қосынды және орташа мән», «орташадан үлкен элементтер саны».
 * October may not use `max`, `min` or `sum` — the traversal IS the lesson, and
 * `scripts/check-blocks.ts` rejects a solution that reaches for them.
 *
 * Three decisions taken once here, so no block re-litigates them:
 *
 * 1. **Input shape.** One line of space-separated integers, read as
 *    `a = list(map(int, input().split()))`, with the count taken from `len(a)`.
 *    No leading `n`: a length the learner reads and then never uses is a line
 *    of ceremony, and `len()` is one of the constructs October is here to
 *    teach. Every prompt guarantees at least one number, and nothing in the
 *    lesson tests the empty line — `a[0]` on an empty list is a crash, not a
 *    lesson.
 *
 * 2. **The best-so-far starts at `a[0]`, and that is the whole point.** The
 *    tempting `best = 0` is the PDF's own named typical error («жинақтаушы
 *    айнымалыға қате бастапқы мән беру»), and it is invisible on the friendly
 *    data most courses use. So the worked example, the prediction and one
 *    hidden case in every max-shaped task all run on all-negative input, where
 *    `best = 0` prints a number that is not in the list at all.
 *
 * 3. **The average's output format is declared, not implied.** The average of
 *    integers is usually not an integer, `round()` and f-strings are months
 *    away, and asking for two decimals would attach a formatting rule the
 *    prompt cannot fairly state. So the task asks for the value of `s / len(a)`
 *    printed directly, and the block carries `{kind:"numeric",
 *    absoluteTolerance: 1e-6}`. Absolute rather than relative because one case
 *    has an average of exactly 0.0, where a relative tolerance means nothing.
 *    A learner who prints `2.5`, `2.50` or `2.4999999999999996` all pass; the
 *    prompt states the rule in both languages.
 */
export const M2_L5: LessonBlock[] = [
  {
    id: "m2.l5.b1",
    type: "concept",
    skillRefs: ["lists.traverse", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Тізімнің әр элементін бір рет қарау",
      ru: "Просмотр каждого элемента списка ровно один раз",
    },
    /* Both forms in one block, with the choice between them stated as a rule
       the learner can apply, not as "you may also write". A course that shows
       only `for x in a` leaves the learner stuck the first time a task needs a
       neighbour; a course that shows only `range(len(a))` produces `a[i]`
       everywhere, including where the index is never used. */
    body: {
      kk: "Тізімді екі түрлі жолмен аралауға болады. `for x in a` әр элементтің мәнін кезекпен береді — мәннен басқа ештеңе керек болмаса, осы қысқа әрі қауіпсіз. `for i in range(len(a))` элементтің орнын береді, ал мәнге `a[i]` арқылы жетесің. Орын мына жағдайларда керек: элементтің нөмірін шығару керек, көршісімен (`a[i - 1]`) салыстыру керек немесе екі тізімді бірдей орындарда салыстыру керек. Қалған жағдайдың бәрінде бірінші түрін таңда.",
      ru: "Список можно обойти двумя способами. `for x in a` по очереди даёт значение каждого элемента — если ничего, кроме значения, не нужно, этот способ короче и безопаснее. `for i in range(len(a))` даёт позицию, а до значения ты добираешься через `a[i]`. Позиция нужна в таких случаях: надо вывести номер элемента, надо сравнить его с соседом (`a[i - 1]`) или надо сравнить два списка по одинаковым позициям. Во всех остальных случаях выбирай первый способ.",
    },
    code: "a = [4, 7, 2]\n\nfor x in a:\n    print(x)\n\nfor i in range(len(a)):\n    print(i, a[i])",
  },
  {
    id: "m2.l5.b2",
    type: "worked_example",
    skillRefs: ["lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Толық талданған мысал: ең үлкен мәнді табу",
      ru: "Разобранный пример: находим максимум",
    },
    /* Deliberately all-negative data. On [3, 9, 2] the wrong initialisation
       `best = 0` gives the right answer, so the reasoning below would be a rule
       the learner has no reason to believe. Here it is the difference between
       -2 and a number that never appears in the list. */
    problem: {
      kk: "Астанадағы бес күннің түнгі температурасы берілген: -4, -9, -2, -7, -6. Ең жылы түнді тап, яғни осы бес санның ең үлкенін шығар.",
      ru: "Даны ночные температуры в Астане за пять дней: -4, -9, -2, -7, -6. Найди самую тёплую ночь, то есть выведи наибольшее из этих пяти чисел.",
    },
    steps: [
      {
        kk: "Компьютер бүкіл тізімді бірден «көрмейді». Ол бір ғана нәрсені есінде ұстай алады: осы сәтке дейін кездескен ең үлкен мән. Оны `best` деп атаймыз.",
        ru: "Компьютер не «видит» весь список сразу. Он умеет держать в памяти одно значение: самое большое из уже просмотренных. Назовём его `best`.",
      },
      {
        kk: "`best` қай мәннен басталады? `best = 0` деп жазғың келеді. Бірақ мұнда температураның бәрі теріс: бірде-бір элемент 0-ден үлкен емес, сондықтан цикл `best`-ті мүлде өзгертпейді де, бағдарлама тізімде жоқ 0 санын шығарады.",
        ru: "С какого значения начать `best`? Хочется написать `best = 0`. Но здесь все температуры отрицательные: ни один элемент не больше нуля, поэтому цикл вообще не изменит `best`, и программа выведет 0 — число, которого в списке нет.",
      },
      {
        kk: "Сондықтан бастапқы мәнді тізімнің өзінен аламыз: `best = a[0]`. Енді жауап әрқашан берілген сандардың бірі болады — қандай сандар келсе де.",
        ru: "Поэтому начальное значение берём из самого списка: `best = a[0]`. Теперь ответ всегда будет одним из данных чисел — какими бы они ни оказались.",
      },
      {
        kk: "Цикл әр элементті `best`-пен салыстырады: үлкені шықса, `best` жаңарады. `a[0]` екінші рет тексерілуі зиян емес, себебі `-4 > -4` жалған.",
        ru: "Цикл сравнивает каждый элемент с `best`: если элемент больше, `best` обновляется. Повторная проверка `a[0]` безвредна, ведь `-4 > -4` ложно.",
      },
      {
        kk: "Қадамдар: -4 (бастапқы) → -9 кіші, өзгермейді → -2 үлкен, `best = -2` → -7 кіші → -6 кіші. Жауап: -2.",
        ru: "Шаги: -4 (начало) → -9 меньше, не меняем → -2 больше, `best = -2` → -7 меньше → -6 меньше. Ответ: -2.",
      },
    ],
    code: "a = [-4, -9, -2, -7, -6]\nbest = a[0]\nfor x in a:\n    if x > best:\n        best = x\nprint(best)",
    result: { kk: "Экранға: -2", ru: "На экран: -2" },
  },
  {
    id: "m2.l5.b3",
    type: "prediction",
    skillRefs: ["loops.accumulator", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The prompt is deliberately neutral. "Are you sure it prints -2?" would
       answer the question in the asking; the distractor is what carries the
       diagnosis. */
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады?",
      ru: "Что выведет эта программа?",
    },
    code: "a = [-4, -9, -2, -7, -6]\nbest = 0\nfor x in a:\n    if x > best:\n        best = x\nprint(best)",
    answer: "0",
    options: ["0", "-2", "-9", "-4"],
    diagnosticMapping: {
      /* Only -2 is mapped. -9 is reachable from at least two different
         confusions (the comparison read backwards, or magnitudes compared
         instead of values) and -4 is barely reachable at all, so neither one
         proves anything and both are left for the engine to ask about. */
      "-2": {
        failureClass: "accumulator_initial_value_ignored",
        justification:
          "-2 — тізімдегі шын максимум, бірақ бұл бағдарлама оны шығармайды. Бұл жауапты таңдау экрандағы кодты емес, «максимум табатын код» деген жорамалды оқығанды білдіреді: `best = 0` болғандықтан бірде-бір теріс сан шартқа сай келмейді және цикл `best`-ті бір рет те өзгертпейді.",
      },
    },
  },
  {
    id: "m2.l5.b4",
    type: "trace_code",
    skillRefs: ["lists.traverse", "lists.index", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The step list names the loop header, not every executed line. Naming
       lines 4 and 5 would say out loud how many times the update fired — which
       is the entire question. Recording (i, best) at the moment control returns
       to the header keeps the semantics honest (`best` is the value carried
       into this iteration) and makes the single update at i = 2 visible only to
       a learner who actually compared a[2] with -4. */
    prompt: {
      kk: "Бағдарламаны қағазда қадамдап орында. Цикл басына оралған сайын `i` мен `best`-тің сол сәттегі мәнін жаз.",
      ru: "Выполни программу по шагам на бумаге. Каждый раз, когда управление возвращается к заголовку цикла, записывай текущие значения `i` и `best`.",
    },
    code: "a = [-4, -9, -2, -7, -6]\nbest = a[0]\nfor i in range(1, len(a)):\n    if a[i] > best:\n        best = a[i]\nprint(best)",
    steps: [
      { line: 2, vars: { best: "-4" } },
      { line: 3, vars: { i: "1", best: "-4" } },
      { line: 3, vars: { i: "2", best: "-4" } },
      { line: 3, vars: { i: "3", best: "-2" } },
      { line: 3, vars: { i: "4", best: "-2" } },
      { line: 6, vars: { best: "-2" } },
    ],
  },
  {
    id: "m2.l5.b5",
    type: "fill_blank",
    skillRefs: ["lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* Two blanks, and both are the lesson: the initial value comes from the
       data, and the direction of the comparison is the only difference between
       a minimum and a maximum. A single-blank version would let a learner flip
       one character and never think about where `small` starts. */
    prompt: {
      kk: "Бағдарлама тізімдегі ең кіші мәнді табуы керек. Екі орынды толтыр: `small` қай элементтен басталады және салыстыру белгісі қандай болуы керек.",
      ru: "Программа должна найти минимум списка. Заполни два пропуска: с какого элемента начинается `small` и какой знак сравнения здесь нужен.",
    },
    template:
      "a = list(map(int, input().split()))\nsmall = a[___]\nfor x in a:\n    if x ___ small:\n        small = x\nprint(small)",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "<" },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m2.l5.b6 — the same problem, assembled instead
       of written. PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден
       жазу азырақ». Support meets the maximum, it just does not meet a blank
       editor. */
    id: "m2.l5.b6s",
    type: "reorder_code",
    skillRefs: ["lists.traverse", "loops.for", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    /*
     * Four lines sit at indent 0 and their order is the whole task.
     *
     * The earlier version had three — read, initialise, print — and the
     * deterministic shuffle happened to leave all three already in place, so
     * the remaining three could be ordered by their indents (0, 4, 8) without
     * reading a word. A support task solvable by counting spaces is not a
     * support task, it is a shorter one.
     *
     * The second `print` fixes that from the content side rather than by hoping
     * for a less helpful shuffle: `print(best)` and `print(len(a))` are
     * indistinguishable by indentation, both must land after the loop, and only
     * the prompt says which comes first. `best = a[0]` versus `for x in a:` is a
     * second such decision. Neither is ambiguous — there is exactly one correct
     * order — but neither is derivable from whitespace.
     */
    prompt: {
      kk: "Жолдарды дұрыс ретке қой: бір жолдағы сандар оқылады, ең үлкені табылады, содан кейін АЛДЫМЕН ең үлкен сан, СОСЫН сандардың саны бөлек жолдарға шығады. Бастапқы мән тізімнің бірінші элементінен алынатынын ұмытпа.",
      ru: "Расставь строки по порядку: читаются числа из одной строки, находится наибольшее, а затем выводятся СНАЧАЛА наибольшее число, ПОТОМ количество чисел — каждое на своей строке. Помни, что начальное значение берётся из первого элемента списка.",
    },
    lines: [
      { id: "r1", code: "a = list(map(int, input().split()))" },
      { id: "r2", code: "best = a[0]" },
      { id: "r3", code: "for x in a:" },
      { id: "r4", code: "    if x > best:" },
      { id: "r5", code: "        best = x" },
      { id: "r6", code: "print(best)" },
      { id: "r7", code: "print(len(a))" },
    ],
    correctOrder: ["r1", "r2", "r3", "r4", "r5", "r6", "r7"],
  },
  {
    id: "m2.l5.b6",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Солардың ең үлкенін шығар. `max()` қолдануға болмайды — әр элементті бір рет қарап шығатын циклмен тап.",
      ru: "В одной строке даны целые числа через пробел (хотя бы одно). Выведи наибольшее из них. Пользоваться `max()` нельзя — найди максимум циклом, который просматривает каждый элемент один раз.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\nbest = a[0]\nfor x in a:\n    if x > best:\n        best = x\nprint(best)",
    /* Each case was chosen against a specific wrong program, and each one was
       checked by running that wrong program:
       "5"              → a solution that reads a[1] — it crashes here;
       "-4 -9 -2 -7 -6" → best = 0, which prints 0 on every other case in this
                          set and is only exposed by all-negative data;
       "8 3 1"          → a loop that skips a[0] entirely (maximum first);
       "1 3 8"          → range(len(a) - 1), the missed last element;
       "10 9 8"         → forgetting int(): the split parts are strings, and
                          "9" > "10" lexicographically, so it prints 9;
       "4 4 4"          → all equal, so nothing ever updates and the answer
                          still has to come out. */
    cases: [
      { input: "3 9 2 7", expectedOutput: "9" },
      { input: "5", expectedOutput: "5" },
      { input: "-4 -9 -2 -7 -6", expectedOutput: "-2", hidden: true },
      { input: "8 3 1", expectedOutput: "8", hidden: true },
      { input: "1 3 8", expectedOutput: "8", hidden: true },
      { input: "10 9 8", expectedOutput: "10", hidden: true },
      { input: "4 4 4", expectedOutput: "4", hidden: true },
    ],
  },
  {
    id: "m2.l5.b7",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.accumulator", "arith.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Бірінші жолға олардың қосындысын, екінші жолға орташа мәнін шығар. Орташа мән — қосындыны сандар санына бөлген нәтиже; оны бөлшек күйінде, яғни `s / len(a)` мәнін тікелей шығар. Мысалы, `1 2 3 4` үшін жауап `10` және `2.5`. `sum()` қолдануға болмайды.",
      ru: "В одной строке даны целые числа через пробел (хотя бы одно). В первой строке выведи их сумму, во второй — среднее значение. Среднее — это сумма, делённая на количество чисел; выводи его как дробное число, то есть просто печатай значение `s / len(a)`. Например, для `1 2 3 4` ответ `10` и `2.5`. Пользоваться `sum()` нельзя.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\ns = 0\nfor x in a:\n    s += x\nprint(s)\nprint(s / len(a))",
    /* See the file header: numeric, absolute, and no relative tolerance —
       the "-3 3" case has an average of exactly 0.0, where a relative
       tolerance is a tolerance of nothing. */
    checker: { kind: "numeric", absoluteTolerance: 1e-6 },
    cases: [
      { input: "1 2 3", expectedOutput: "6\n2.0" },
      { input: "1 2 3 4", expectedOutput: "10\n2.5" },
      /* One element: len(a) is 1, and a solution that divides by len(a) - 1
         crashes here instead of quietly producing nonsense. */
      { input: "5", expectedOutput: "5\n5.0", hidden: true },
      /* A non-terminating decimal — this is the case the tolerance exists for. */
      { input: "10 3 3", expectedOutput: "16\n5.333333333333333", hidden: true },
      /* Sum zero: kills `s = a[0]` before the loop, which double-counts. */
      { input: "-3 3", expectedOutput: "0\n0.0", hidden: true },
      { input: "-5 -5 -5", expectedOutput: "-15\n-5.0", hidden: true },
    ],
  },
  {
    id: "m2.l5.b8",
    type: "write_code",
    skillRefs: ["lists.traverse", "loops.counter", "loops.accumulator", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    /* The two-pass structure is stated in the prompt on purpose. This is the
       first task in the course where one traversal is genuinely not enough,
       and a learner who does not see why will write the counter into the first
       loop and compare against a running sum. Naming the reason ("until the
       average is known there is nothing to count") is teaching, not giving the
       answer away — the code is still entirely theirs. */
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Орташа мәннен қатаң үлкен элементтердің санын шығар. Тізімді екі рет аралау керек: біріншісінде қосындыны жинайсың (орташа мән әлі белгісіз болғандықтан санауға ештеңе жоқ), екіншісінде санайсың. Орташа мәнге тең элементтер саналмайды.",
      ru: "В одной строке даны целые числа через пробел (хотя бы одно). Выведи, сколько элементов строго больше среднего значения. Список придётся пройти дважды: на первом проходе копится сумма (пока среднее неизвестно, считать нечего), на втором идёт подсчёт. Элементы, равные среднему, не считаются.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\ns = 0\nfor x in a:\n    s += x\ncnt = 0\nfor x in a:\n    if x > s / len(a):\n        cnt += 1\nprint(cnt)",
    cases: [
      { input: "1 2 3", expectedOutput: "1" },
      /* All equal: the average equals every element, so `>=` in place of `>`
         answers 3 where the correct answer is 0. This case is what makes
         «қатаң үлкен» mean something, and it is visible on purpose — the
         learner should meet the boundary before the hidden cases judge it. */
      { input: "4 4 4", expectedOutput: "0" },
      { input: "5", expectedOutput: "0", hidden: true },
      { input: "1 2 3 4 5", expectedOutput: "2", hidden: true },
      /* Negative data: an answer keyed off "greater than zero" scores 0 here. */
      { input: "-1 -2 -3", expectedOutput: "1", hidden: true },
      /* One outlier drags the average up: 14 / 5 = 2.8, so only 10 qualifies. */
      { input: "10 1 1 1 1", expectedOutput: "1", hidden: true },
      { input: "1 2 3 4", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /* ADVANCED ONLY. Chosen over "the second largest value" because it is the
       block that pays off m2.l5.b1: the comparison is with the PREVIOUS
       element, so `for x in a` cannot express it and the index form stops being
       an alternative style and becomes the only way to write the program. Two
       accumulators (`cur`, `best`) with different reset rules is the second
       thing it teaches. */
    id: "m2.l5.b9",
    type: "write_code",
    skillRefs: ["lists.index", "loops.counter", "lists.traverse"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Қатар тұрған бірдей сандардың ең ұзын тізбегінің ұзындығын шығар. Мысалы, `4 4 4 1 4 4` үшін жауап 3. Мұнда әр элементті көршісімен салыстыру керек, сондықтан `for x in a` жетпейді — индекс керек болады.",
      ru: "В одной строке даны целые числа через пробел (хотя бы одно). Выведи длину самой длинной цепочки одинаковых чисел, идущих подряд. Например, для `4 4 4 1 4 4` ответ 3. Здесь каждый элемент надо сравнивать с соседом, поэтому `for x in a` не хватит — понадобится индекс.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\nbest = 1\ncur = 1\nfor i in range(1, len(a)):\n    if a[i] == a[i - 1]:\n        cur += 1\n    else:\n        cur = 1\n    if cur > best:\n        best = cur\nprint(best)",
    cases: [
      { input: "1 1 2 2 2 3", expectedOutput: "3" },
      { input: "5 5", expectedOutput: "2" },
      /* One element: range(1, 1) is empty, so the answer is the initial 1. A
         solution that starts best at 0 answers 0 here. */
      { input: "7", expectedOutput: "1", hidden: true },
      { input: "1 2 3 4", expectedOutput: "1", hidden: true },
      /* The longest run is not the last one — this kills `print(cur)`. */
      { input: "4 4 4 1 4 4", expectedOutput: "3", hidden: true },
      /* The longest run IS the last one — this kills a program that only
         updates `best` at the moment the run breaks. */
      { input: "1 2 2 3 3 3", expectedOutput: "3", hidden: true },
      { input: "-2 -2 -2 -2", expectedOutput: "4", hidden: true },
    ],
  },
];
