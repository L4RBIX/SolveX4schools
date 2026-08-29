import type { LessonBlock } from "../../types";

/**
 * m5.l7 · Екі реттелген тізімді біріктіру — merging two sorted lists in one pass.
 *
 * PDF p.9 names this family by hand in January's practice paragraph: «екі
 * реттелген тізімді біріктіру». The lesson sits in the month's SECOND unit, so
 * the first-half weighting towards «дайын кодты оқу, түзету және толықтыру» no
 * longer binds and a blank editor is allowed again. There is exactly one — b7 —
 * and the support route meets that same problem as a completion at b7s.
 *
 * The month's mastery line is «тізімнің үздіксіз бөлігін екі шекараны жылжыта
 * отырып өңдеу», and the merge is the year's cleanest case of it: two indices
 * that only ever move forward, `len(a) + len(b)` steps between them, and no
 * inner loop anywhere. m5.l4 walks two pointers towards each other from the
 * ends of one list; here they walk forwards through two different lists, which
 * is a different move and is why the family gets its own lesson.
 *
 * Four decisions taken once, so no block below re-litigates them.
 *
 * 1. **The lesson is the TAIL, not the comparison.** Choosing the smaller of
 *    `a[i]` and `b[j]` is one line and nobody gets it wrong twice. What people
 *    get wrong — every year, in every language — is that the main loop ends the
 *    moment ONE list runs out, and the rest of the other list is still part of
 *    the answer. So the tail is the worked example's last step, it is the
 *    find_bug at b5, it is the pair of blanks the support twin fills, and it is
 *    what every one of b7's eight cases kills — the two visible ones included,
 *    so a learner who forgot it does not reach the hidden set before finding
 *    out. The lesson's own vocabulary for it is «қалған бөлік» / «остаток».
 *
 * 2. **What the checker cannot see, said out loud instead of pretended.**
 *    `a + b` followed by `.sort()` produces exactly the right answer, and no
 *    output comparison can tell it from a merge. Declaring "you may not sort"
 *    as a graded rule would be stating a requirement the product does not
 *    enforce — the defect the first adversarial review named. Of the contract's
 *    three honest options this lesson takes **2 and 3**, deliberately and in
 *    that order. Option 1 was considered and rejected: the outputs that a sort
 *    genuinely cannot produce — an origin tag per number, a count of
 *    comparisons — are either a different problem from «екі реттелген тізімді
 *    біріктіру» or depend on how the loop happens to be written, and a task
 *    whose answer depends on the author's loop is worse than an unenforced
 *    rule. So b7 states the single pass as the point of the exercise and admits
 *    in both languages that the automatic check compares only the numbers
 *    (option 2), and b9 sends the claim to a human: the advanced route has to
 *    write down what the merge exploits and how many times it looks at a
 *    number, and a teacher reads it (option 3) — the programme's own «шешімді
 *    жазбаша қорғау» (p.6). Meanwhile the blocks a machine CAN judge are all
 *    unanswerable without the merge: the trace, the two fill_blanks, the
 *    find_bug and b8's repair.
 *
 * 3. **Input shape.** Two lines, each one line of space-separated integers read
 *    as `list(map(int, input().split()))`, each guaranteed non-empty and
 *    already sorted — ascending everywhere except b8, where the direction is
 *    flipped on purpose and both of its prompts shout it. No leading counts:
 *    `len()` is October's, and the two lengths are exactly what the loop
 *    conditions need. Nothing here tests
 *    an empty line — an empty list is a fair merge input but it is a
 *    conversation about `input()` on a blank line, not about merging, and it
 *    would land in the middle of the one lesson where the tail must be the
 *    only surprise.
 *
 * 4. **No two programs in this lesson are the same program, and none of them is
 *    b7's answer.** The merge is a short program and a lesson about it could
 *    easily print the answer four times over — the more so because every block
 *    is mounted at once, so a program in a later card is on screen while the
 *    learner is still working on an earlier one. Deliberately: b1 shows ONE
 *    step and no loop; b2, b3 and b4 run the same shape on three different
 *    pairs of lists, because a prediction and a trace are worthless on data
 *    whose answer is written out on the card above; b5 prints each number as it
 *    takes it, so its repaired form is not what b7 asks for; b6 and b8 merge
 *    DOWNWARDS, so their comparison is a decision rather than a transcription
 *    and neither can be copied into b7 — pasted there, b8's code answers
 *    `2 4 6 1 3 5` to b7's first case; b7s adds the count line that lets a
 *    support learner check their own tail. There is no byte-for-byte repeat in
 *    the file at all, and `scripts/check-blocks.ts` reads the whole `m05`
 *    directory, so there is none against the rest of January either.
 */
export const M5_L7: LessonBlock[] = [
  {
    id: "m5.l7.b1",
    type: "concept",
    skillRefs: ["twopointers.core", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Екі реттелген тізімді біріктіру",
      ru: "Слияние двух отсортированных списков",
    },
    /* The body has to earn the method, not announce it. The sentence that does
       the work is "the next number is either a[i] or b[j] — there is no third
       option": everything else in the lesson, including why the tail can simply
       be copied, follows from it. */
    body: {
      kk: "Екі тізім де өсу ретімен реттелген, ал біріктірілген нәтиже де реттелген болуы керек. Ол үшін тізімдерді жалғап, қайтадан реттеудің қажеті жоқ: реттелгендік — қолымызда бар дайын ақпарат, оны лақтырып тастамай пайдаланған дұрыс.\n\nӘр тізімге бір көрсеткіш қоямыз: `i` — бірінші тізімде, `j` — екіншісінде. Екеуі де өз тізіміндегі әлі алынбаған ең кіші санды көрсетіп тұрады. Демек келесі шығуға тиіс сан не `a[i]`, не `b[j]` — үшінші нұсқа жоқ. Кішісін аламыз да, дәл сол тізімнің көрсеткішін бір қадам жылжытамыз; екіншісі орнында қалады. Төмендегі код — осындай қадамның біреуі ғана.\n\nЕң маңыздысы — соңы. Бір көрсеткіш өз тізімінің ұзындығына жеткенде салыстыратын ештеңе қалмайды, ал екінші тізімде сандар әлі тұр. Ол қалған бөлік өз ішінде реттелген және оның әр саны шығып қойған сандардың бәрінен кіші емес, сондықтан оны сол қалпында, ретімен көшіріп жазу жеткілікті. Осы қалған бөлікті ұмыту — біріктірудегі ең жиі қате.",
      ru: "Оба списка отсортированы по возрастанию, и результат слияния тоже должен быть отсортирован. Склеивать списки и сортировать заново для этого не нужно: упорядоченность — это готовая информация, которая у нас уже есть, и разумнее ею воспользоваться, чем выбросить.\n\nСтавим на каждый список свой указатель: `i` — на первый, `j` — на второй. Каждый показывает на наименьшее ещё не взятое число своего списка. Значит, следующим должно выйти либо `a[i]`, либо `b[j]` — третьего варианта нет. Берём меньшее и сдвигаем на один шаг только тот указатель, из чьего списка взяли; второй остаётся на месте. Код ниже — ровно один такой шаг.\n\nСамое важное — конец. Когда один указатель доходит до длины своего списка, сравнивать больше нечего, а во втором списке числа ещё остались. Этот остаток уже упорядочен внутри себя, и каждое его число не меньше всех уже выведенных, поэтому его достаточно переписать подряд, как есть. Забыть про остаток — самая частая ошибка при слиянии.",
    },
    code:
      "a = [1, 4, 7]\n" +
      "b = [2, 3, 9]\n" +
      "i = 0\n" +
      "j = 0\n" +
      "if a[i] <= b[j]:\n" +
      "    print(a[i])\n" +
      "    i += 1\n" +
      "else:\n" +
      "    print(b[j])\n" +
      "    j += 1",
  },
  {
    id: "m5.l7.b2",
    type: "worked_example",
    skillRefs: ["twopointers.core", "lists.traverse", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    title: {
      kk: "Толық талданған мысал: [1, 4, 7] мен [2, 3, 9] тізімдерін біріктіру",
      ru: "Разобранный пример: сливаем [1, 4, 7] и [2, 3, 9]",
    },
    problem: {
      kk: "Екі реттелген тізім берілген: `a = [1, 4, 7]` және `b = [2, 3, 9]`. Оларды бір реттелген тізімге біріктір және сандарды бос орынмен бөліп шығар.",
      ru: "Даны два отсортированных списка: `a = [1, 4, 7]` и `b = [2, 3, 9]`. Слей их в один отсортированный список и выведи числа через пробел.",
    },
    /* Five comparisons written out, then the tail as a step of its own. The
       tail is deliberately the LAST reasoning step and not a footnote on the
       fifth: it is the move the loop cannot make, and the learner has to see
       that the loop is over before it happens. */
    steps: [
      {
        kk: "Нәтижені жинау үшін бос `res` тізімін ашамыз. `res.append(x)` — тізімнің соңына бір сан қосу деген сөз. Екі көрсеткіш те нөлден басталады: `i = 0`, `j = 0`.",
        ru: "Для ответа заводим пустой список `res`. `res.append(x)` — это добавить одно число в конец списка. Оба указателя начинаются с нуля: `i = 0`, `j = 0`.",
      },
      {
        kk: "1-қадам: `a[0]` = 1, `b[0]` = 2. Кішісі — 1, сондықтан 1 нәтижеге кетеді және `i` = 1 болады. res = [1].",
        ru: "Шаг 1: `a[0]` = 1, `b[0]` = 2. Меньшее — 1, поэтому 1 уходит в ответ и `i` становится 1. res = [1].",
      },
      {
        kk: "2-қадам: `a[1]` = 4, `b[0]` = 2. Енді екінші тізімдегі сан кіші: 2 нәтижеге кетеді, `j` = 1. `i` қозғалмайды. res = [1, 2].",
        ru: "Шаг 2: `a[1]` = 4, `b[0]` = 2. Теперь меньше число из второго списка: 2 уходит в ответ, `j` = 1. `i` не двигается. res = [1, 2].",
      },
      {
        kk: "3-қадам: `a[1]` = 4, `b[1]` = 3. 3 кіші: res = [1, 2, 3], `j` = 2.",
        ru: "Шаг 3: `a[1]` = 4, `b[1]` = 3. Меньше 3: res = [1, 2, 3], `j` = 2.",
      },
      {
        kk: "4-қадам: `a[1]` = 4, `b[2]` = 9. 4 кіші: res = [1, 2, 3, 4], `i` = 2.",
        ru: "Шаг 4: `a[1]` = 4, `b[2]` = 9. Меньше 4: res = [1, 2, 3, 4], `i` = 2.",
      },
      {
        kk: "5-қадам: `a[2]` = 7, `b[2]` = 9. 7 кіші: res = [1, 2, 3, 4, 7], `i` = 3. Енді `i` = 3 = `len(a)`, яғни бірінші тізім түгел таусылды және басты цикл тоқтайды.",
        ru: "Шаг 5: `a[2]` = 7, `b[2]` = 9. Меньше 7: res = [1, 2, 3, 4, 7], `i` = 3. Теперь `i` = 3 = `len(a)`, то есть первый список закончился и главный цикл останавливается.",
      },
      {
        kk: "Қалған бөлік: `b`-да 9 әлі тұр. Оны салыстыратын ештеңе жоқ, бірақ ол — жауаптың бөлігі. Сондықтан басты циклден кейін қалған сандарды ретімен көшіріп жазатын екі қысқа цикл тұрады: біреуі `a`-да қалғандарын, екіншісі `b`-да қалғандарын көшіреді. Осы жолы жұмыс істейтіні — екіншісі. res = [1, 2, 3, 4, 7, 9]: барлығы алты сан, дәл `len(a) + len(b)`.",
        ru: "Остаток: в `b` ещё лежит 9. Сравнивать её не с чем, но она — часть ответа. Поэтому после главного цикла стоят два коротких цикла, переписывающих остаток подряд: один переписывает остаток `a`, другой — остаток `b`. В этот раз сработает второй. res = [1, 2, 3, 4, 7, 9]: всего шесть чисел, ровно `len(a) + len(b)`.",
      },
    ],
    code:
      "a = [1, 4, 7]\n" +
      "b = [2, 3, 9]\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] <= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))',
    result: { kk: "Экранға: 1 2 3 4 7 9", ru: "На экран: 1 2 3 4 7 9" },
  },
  {
    id: "m5.l7.b3",
    type: "prediction",
    skillRefs: ["twopointers.core", "lists.traverse"],
    sourceType: "product-authored",
    /* New data on purpose: on [1, 4, 7] and [2, 3, 9] the answer is written out
       on the card above, and a prediction whose answer is already on screen
       measures reading, not simulating. Here the first list starts with the
       LARGER number and its tail is the part left over, so neither the order of
       the first move nor the identity of the leftover list carries over from
       the worked example. */
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады?",
      ru: "Что выведет эта программа?",
    },
    code:
      "a = [2, 5, 9]\n" +
      "b = [1, 3, 4]\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] <= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))',
    answer: "1 2 3 4 5 9",
    options: ["1 2 3 4 5 9", "1 2 3 4", "2 5 9 1 3 4", "2 1 5 3 9 4"],
    diagnosticMapping: {
      /* Exactly the output of the main loop with both tail loops deleted, and
         there is no other route to those four numbers in that order. */
      "1 2 3 4": {
        failureClass: "merge_tail_dropped",
        justification:
          "1 2 3 4 — басты цикл `j` = 3 болып тоқтаған сәттегі нәтиже. Бұл жауапты таңдау басты циклден кейінгі екі қысқа циклді оқымағанды білдіреді: `a`-да қалған 5 пен 9 көшірілмей қалған.",
      },
      /* Both lists in their original order, one after the other: the learner
         read `+` into a program that has no `+` in it. Nothing else produces
         this sequence. */
      "2 5 9 1 3 4": {
        failureClass: "merge_treated_as_concatenation",
        justification:
          "2 5 9 1 3 4 — бұл екі тізімді жай ғана бірінің артынан бірін жазу. Бағдарламада ондай жол жоқ: әр қадамда салыстыру бар, сондықтан бұл жауап біріктіруді жалғау деп түсінгенді көрсетеді.",
      },
      /* Strict alternation regardless of value — the learner thinks the two
         pointers take turns rather than that the comparison decides. */
      "2 1 5 3 9 4": {
        failureClass: "merge_alternates_lists",
        justification:
          "2 1 5 3 9 4 — көрсеткіштер кезекпен жылжыған нәтиже. Бұл жауап `if a[i] <= b[j]` шартының рөлін елемегенді білдіреді: қай тізімнен алу керегін кезек емес, салыстыру шешеді.",
      },
    },
  },
  {
    id: "m5.l7.b4",
    type: "trace_code",
    skillRefs: ["twopointers.core", "lists.index", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    /* Short lists on purpose: with a = [3, 8] and b = [1, 12] the main loop
       runs three times and BOTH tail loops get a row — the empty one and the
       working one. The empty row is the row that matters. A learner who thinks
       "the leftovers get copied" without asking WHICH list still has numbers
       in it will write something moving at line 13, where nothing moves — and
       the two rows at line 16 are where the copying actually happens. */
    prompt: {
      kk: "Бағдарламаны қағазда қадамдап орында. Үш `while` жолының әрқайсысына басқару келген сайын — соның ішінде шарт жалған болып, цикл бітетін сәтте де — сол кездегі `i`, `j` және `res` мәндерін жаз. Соңғы жол — `print`. `res`-ті тізім түрінде жаз, мысалы `[1, 3]`.",
      ru: "Выполни программу по шагам на бумаге. Каждый раз, когда управление приходит на одну из трёх строк `while` — в том числе в тот момент, когда условие ложно и цикл заканчивается, — записывай текущие значения `i`, `j` и `res`. Последняя строка — `print`. Список `res` записывай в виде списка, например `[1, 3]`.",
    },
    code:
      "a = [3, 8]\n" +
      "b = [1, 12]\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] <= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))',
    steps: [
      { line: 6, vars: { i: "0", j: "0", res: "[]" } },
      { line: 6, vars: { i: "0", j: "1", res: "[1]" } },
      { line: 6, vars: { i: "1", j: "1", res: "[1, 3]" } },
      { line: 6, vars: { i: "2", j: "1", res: "[1, 3, 8]" } },
      { line: 13, vars: { i: "2", j: "1", res: "[1, 3, 8]" } },
      { line: 16, vars: { i: "2", j: "1", res: "[1, 3, 8]" } },
      { line: 16, vars: { i: "2", j: "2", res: "[1, 3, 8, 12]" } },
      { line: 19, vars: { i: "2", j: "2", res: "[1, 3, 8, 12]" } },
    ],
  },
  {
    id: "m5.l7.b5",
    type: "find_bug",
    skillRefs: ["twopointers.core", "debug.boundary"],
    sourceType: "product-authored",
    /* The data is the worked example's, deliberately: the learner already knows
       what 1 4 7 and 2 3 9 must produce, so the missing 9 is visible without
       any new reasoning about the merge itself. The question is where the loss
       happens, not what the answer was.

       The program prints each number as it takes it instead of collecting them
       in a list. That is not decoration: it keeps the repaired program from
       being a byte-copy of b7's answer, which is the "find_bug that repairs the
       program the next write_code asks for" defect. */
    prompt: {
      kk: "Бұл бағдарлама екі реттелген тізімді біріктіріп, әр санды бөлек жолға шығаруы керек. Бірінші жолға `1 4 7`, екінші жолға `2 3 9` бергенде ол 1, 2, 3, 4, 7 сандарын шығарады да, 9-ды мүлде шығармайды. Қай жол кінәлі — яғни бағдарламаны тым ерте тоқтататын жол қайсы және одан кейін не істелуі керек еді?",
      ru: "Эта программа должна слить два отсортированных списка и вывести каждое число на отдельной строке. При вводе `1 4 7` в первой строке и `2 3 9` во второй она выводит 1, 2, 3, 4, 7 и не выводит 9 вообще. Какая строка виновата — то есть какая строка останавливает программу слишком рано и что должно происходить после неё?",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] <= b[j]:\n" +
      "        print(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        print(b[j])\n" +
      "        j += 1",
    buggyLine: 5,
    symptomInput: "1 4 7\n2 3 9",
    fixedCode:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] <= b[j]:\n" +
      "        print(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        print(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    print(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    print(b[j])\n" +
      "    j += 1",
  },
  {
    id: "m5.l7.b6",
    type: "fill_blank",
    skillRefs: ["twopointers.core", "sort.basic", "compare.operators"],
    sourceType: "product-authored",
    /* Descending, and that is the whole design. A blank over `<=` on an
       ascending merge is a transcription of the card above; a blank over the
       comparison on a DESCENDING merge is a decision the learner can only make
       by knowing what the comparison is for. The two pointer blanks are the
       other half of the same idea: the index that moves is the index the number
       came from, and swapping them is the classic way to lose numbers and
       duplicate others.

       `>` is accepted alongside `>=`: with equal values the two produce the
       same output, and marking one of them wrong would be marking a rule the
       task never stated. */
    prompt: {
      kk: "Бұл жолы екі тізім де КЕМУ ретімен реттелген (үлкеннен кішіге), және нәтиже де кему ретімен шығуы керек. Үш орынды толтыр: салыстыру белгісі қандай болуы керек және әр тармақта қай көрсеткіш жылжиды. Дұрыс жауапта экранға `9 7 6 5 5 2 1` шығады.",
      ru: "На этот раз оба списка отсортированы по УБЫВАНИЮ (от большего к меньшему), и результат тоже должен идти по убыванию. Заполни три пропуска: какой нужен знак сравнения и какой указатель сдвигается в каждой ветке. При верном ответе на экран выйдет `9 7 6 5 5 2 1`.",
    },
    template:
      "a = [9, 6, 5, 2]\n" +
      "b = [7, 5, 1]\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] ___ b[j]:\n" +
      "        res.append(a[i])\n" +
      "        ___ += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        ___ += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))',
    blanks: [
      { id: "f1", answer: ">=", alternatives: [">"] },
      { id: "f2", answer: "i" },
      { id: "f3", answer: "j" },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m5.l7.b7 — the same merge, completed instead of
       written from nothing. PDF p.6: «дайын кодты құрастыру мен толықтыру
       көбірек, нөлден жазу азырақ».

       The two blanks are the two tail conditions, which is the only part of
       this program a support learner should be spending their thinking on, and
       the second output line is not filler: `len(res)` is how they check their
       own answer without a teacher. If the printed count is smaller than the
       two lengths added together, the tail was lost — the prompt says so, and
       that turns the lesson's one hard idea into something the learner can
       verify on their own screen. m2.l5.b6s uses the same device. */
    /*
     * The two tail conditions were the blanks, and the main loop's header —
     * printed four lines above them — is `while i < len(a) and j < len(b):`.
     * Both answers were on screen, so a support learner copied them.
     * `payload-privacy` caught it: a blank answer is a secret and it appeared
     * verbatim in the template.
     *
     * Merge code cannot avoid repeating those two tests, so the fix is to blank
     * EVERY occurrence rather than to find an expression that occurs once. With
     * the header blanked as well, the template contains neither answer, and the
     * learner has to decide the same thing three times in three different
     * shapes: both lists still have numbers (`and`), then each list alone.
     *
     * That is also the better lesson. The tail exists precisely because the
     * main loop's condition is an AND — it stops the moment EITHER list runs
     * out — and writing the three conditions next to each other is what makes
     * that visible.
     */
    id: "m5.l7.b7s",
    type: "fill_blank",
    skillRefs: ["twopointers.core", "lists.traverse", "loops.while"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Екі жол беріледі, әр жолда бос орынмен бөлінген бүтін сандар тұр (әр жолда кемінде бір сан), және әр жол өсу ретімен реттелген. Бағдарлама екі тізімді біріктіріп, бірінші жолға барлық сандарды бос орынмен бөліп, екінші жолға сол сандардың санын шығарады. Үш циклдің шартын толтыр. Біріншісі — басты цикл: ол ЕКІ тізімде де сан қалғанда ғана жүреді, сондықтан оның шарты екі бөліктен тұрады. Қалған екеуі — басты цикл біткен соң қалған бөлікті көшіретін циклдер, әрқайсысы бір тізімді ғана қарайды. Екінші жолдағы сан өзіңді тексереді: егер ол екі тізімнің ұзындықтарының қосындысынан кем болса, қалған бөлік жоғалып кеткен.",
      ru: "Даны две строки, в каждой — целые числа через пробел (не меньше одного числа в строке), и каждая строка отсортирована по возрастанию. Программа сливает списки и выводит в первой строке все числа через пробел, а во второй — их количество. Заполни условия трёх циклов. Первый — главный: он работает, только пока числа остались в ОБОИХ списках, поэтому его условие состоит из двух частей. Остальные два переписывают остаток после главного цикла, и каждый смотрит только на один список. Число во второй строке проверяет тебя: если оно меньше суммы длин двух списков, значит остаток потерялся.",
    },
    template:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while ___:\n" +
      "    if a[i] <= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while ___:\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while ___:\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))\n' +
      "print(len(res))",
    blanks: [
      { id: "f1", answer: "i < len(a) and j < len(b)", alternatives: ["j < len(b) and i < len(a)"] },
      { id: "f2", answer: "i < len(a)", alternatives: ["len(a) > i"] },
      { id: "f3", answer: "j < len(b)", alternatives: ["len(b) > j"] },
    ],
  },
  {
    id: "m5.l7.b7",
    type: "write_code",
    skillRefs: ["twopointers.core", "lists.traverse", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["core", "advanced"],
    /* PDF p.9, verbatim family: «екі реттелген тізімді біріктіру».

       The prompt states the single pass as the point of the exercise and says
       plainly that the automatic check cannot see it. That wording is chosen:
       `sorted(a + b)` passes every case below and always will, so declaring "no
       sorting" as a graded rule would be a promise the product does not keep.
       What the cases DO see is everything else, and they see it hard — see the
       comment on each one. */
    prompt: {
      kk: "Екі жол беріледі. Әр жолда бос орынмен бөлінген бүтін сандар тұр (әр жолда кемінде бір сан), және әр жол өсу ретімен реттелген. Осы екі тізімді бір реттелген тізімге біріктіріп, барлық сандарды бір жолға, бос орынмен бөліп шығар. Мысалы, `1 3 5` және `2 4 6` үшін жауап `1 2 3 4 5 6`.\n\nЖаттығудың мәні — бір өту: екі көрсеткішті алға жылжыта отырып, әр санды дәл бір рет қарау. Сондықтан екі тізімді қосып, `sorted()` немесе `.sort()` шақырма — жауап дұрыс шығар еді, бірақ тапсырманың өзі жоғалады. Автоматты тексеру тек шыққан сандарды салыстырады және бұл ережені көре алмайды, сондықтан оны сақтау — өз мойныңда.",
      ru: "Даны две строки. В каждой строке — целые числа через пробел (не меньше одного числа в строке), и каждая строка уже отсортирована по возрастанию. Слей эти два списка в один отсортированный и выведи все числа в одну строку через пробел. Например, для `1 3 5` и `2 4 6` ответ `1 2 3 4 5 6`.\n\nСмысл упражнения — один проход: два указателя двигаются вперёд, и каждое число просматривается ровно один раз. Поэтому не склеивай списки и не вызывай `sorted()` или `.sort()` — ответ получился бы верным, а само упражнение исчезло бы. Автоматическая проверка сравнивает только выведенные числа и этого правила не видит, так что соблюсти его — твоя ответственность.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] <= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))',
    /* The prompt names the layout — one line, single spaces — so the checker
       enforces the layout. `token` here would be a promise that only the values
       matter, which is not what the prompt says, and the two must agree.
       `exact` is safe to use here only because the first case is VISIBLE and
       carries the shape: a learner who prints the right numbers with a stray
       trailing space or one per line is told so on a case they can see, not on
       a hidden one they cannot. */
    checker: { kind: "exact" },
    /* Every case was chosen against a program that is not a merge, and every
       one of those programs was run against the whole set:

       "1 3 5" / "2 4 6"      → the tail dropped entirely (prints 1 2 3 4 5);
                                also kills the walk that advances `i` in both
                                branches, and plain concatenation.
       "2 4" / "1 3 5 7"      → a tail of TWO elements, and the leftover is in
                                the second list.
       "1 2 3" / "7 8 9 10"   → the whole of the first list comes out before the
                                whole of the second, and four numbers are lost
                                if the tail loops are missing.
       "7 8 9 10" / "1 2 3"   → the mirror. This is the only case that kills a
                                solution which copies b's tail but not a's, and
                                that asymmetry is exactly what a learner who
                                writes one tail loop produces.
       "5" / "5"              → one element each, equal. `a[1]` crashes here,
                                and so does any loop that assumes two elements.
       "-9 -4 0" / "-5 -2 3"  → negative numbers, which is where a solution that
                                forgot `map(int, ...)` finally shows: as text,
                                "-9" sorts after "-5".
       "1 1 1" / "1 1"        → everything equal, so every comparison takes the
                                same branch and the count still has to be five.
       "2 2 4" / "1 2 5"      → duplicates on both sides, none of which may be
                                dropped. */
    cases: [
      { input: "1 3 5\n2 4 6", expectedOutput: "1 2 3 4 5 6" },
      { input: "2 4\n1 3 5 7", expectedOutput: "1 2 3 4 5 7" },
      { input: "1 2 3\n7 8 9 10", expectedOutput: "1 2 3 7 8 9 10", hidden: true },
      { input: "7 8 9 10\n1 2 3", expectedOutput: "1 2 3 7 8 9 10", hidden: true },
      { input: "5\n5", expectedOutput: "5 5", hidden: true },
      { input: "-9 -4 0\n-5 -2 3", expectedOutput: "-9 -5 -4 -2 0 3", hidden: true },
      { input: "1 1 1\n1 1", expectedOutput: "1 1 1 1 1", hidden: true },
      { input: "2 2 4\n1 2 5", expectedOutput: "1 2 2 2 4 5", hidden: true },
    ],
  },
  {
    id: "m5.l7.b8",
    type: "modify_code",
    skillRefs: ["twopointers.core", "lists.index", "arith.integer_division"],
    sourceType: "product-authored",
    /* ## Why the program on screen here merges DOWNWARDS
       The obvious starting point is b7's own answer with one line changed — and
       it is unusable. Every block of a lesson is mounted at once, so whatever
       sits in `code` is on screen while a core learner is still working on b7,
       and an ascending merge there hands them eighteen of their nineteen lines.
       `check-blocks` refuses the byte-identical version of this, and the
       almost-identical version is the same defect with a line repainted.

       So this card keeps the question and flips the DIRECTION, the way m5.l1.b8
       does: both input lines arrive largest-first, and the program shown merges
       with `>=`. Copied into b7 it produces `2 4 6 1 3 5` for b7's own first
       case — it is not that task's answer and cannot be mistaken for it. What
       the learner has already completed is exactly this program's core, at b6,
       where the descending merge was the fill-blank; here it reads real input
       and gets a new ending.

       What is left on screen after the flip is a merge body the learner has
       already met four times — b2 writes it out, b3 predicts it, b4 traces it,
       b6 completes it — so this card leaks nothing b7 did not already have to
       live with. A lesson about merging cannot hide a merge; it can only refuse
       to hand over the exact program it is asking for, which is what the
       comparison line does.

       The prompt says «төмендегі бағдарлама», never "the program you wrote":
       the support route arrives having completed b7s, not b7, and a card that
       described the wrong learner's screen is the defect m2.l1.b8s shipped.

       Only the last line changes, and that is the point — the merged list is
       already the answer to a question nobody asked yet. The total count is
       guaranteed odd, so no averaging, rounding or float formatting enters a
       lesson that is about none of them; and the middle of a list is the same
       element whether you count from the left or from the right, which is why
       the descending order costs the median nothing. */
    prompt: {
      kk: "Төмендегі бағдарлама екі тізімді біріктіреді. Мұндағы екі кіріс жолы да КЕМУ ретімен реттелген (үлкеннен кішіге), сондықтан біріктірілген тізім де кему ретімен шығады. Оны өзгерт: бағдарлама енді бүкіл тізімді емес, тек сол тізімнің дәл ортасында тұрған санды — медиананы — шығарсын. Екі жолдағы сандардың жалпы саны әрқашан тақ, сондықтан орта әрқашан біреу, ал тізімнің ортасы қай шеттен санасаң да сол орында тұрады. Мысалы, `30 20 10` және `25 15` үшін біріккен тізім 30 25 20 15 10, ал жауап — 20. Біріктіру циклдерін бұзба: өзгеретіні тек соңғы жол.",
      ru: "Программа ниже сливает два списка. На этот раз обе входные строки отсортированы по УБЫВАНИЮ (от большего к меньшему), поэтому и слитый список выходит по убыванию. Измени её: пусть она выводит не весь список, а только число, стоящее ровно в его середине, — медиану. Общее количество чисел в двух строках всегда нечётное, поэтому середина всегда одна, а середина списка стоит на одном и том же месте, с какого конца ни считай. Например, для `30 20 10` и `25 15` слитый список — 30 25 20 15 10, а ответ — 20. Не ломай циклы слияния: меняется только последняя строка.",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] >= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      'print(" ".join(map(str, res)))',
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "b = list(map(int, input().split()))\n" +
      "i = 0\n" +
      "j = 0\n" +
      "res = []\n" +
      "while i < len(a) and j < len(b):\n" +
      "    if a[i] >= b[j]:\n" +
      "        res.append(a[i])\n" +
      "        i += 1\n" +
      "    else:\n" +
      "        res.append(b[j])\n" +
      "        j += 1\n" +
      "while i < len(a):\n" +
      "    res.append(a[i])\n" +
      "    i += 1\n" +
      "while j < len(b):\n" +
      "    res.append(b[j])\n" +
      "    j += 1\n" +
      "print(res[len(res) // 2])",
    /* One number and no layout claimed, so the default comparison is the honest
       one. Every case was run against the wrong programs it is here to kill:

       "30 20 10" / "25 15"       → `res[len(res) // 2 - 1]` answers 25, and
                                    `res[len(a)]` answers 15;
       "5" / "2 1"                → the median of the FIRST list only answers 5;
       "4 3 2 1" / "300 200 100"  → the tail dropped answers 200, because the
                                    main loop empties `b` after three numbers;
       "3 2 1" / "7 6 5 4"        → the tail dropped answers 5, and the median
                                    lands in the second list;
       "-1 -5" / "0 -3 -9"        → negatives, and the answer is negative;
       "4 4 4" / "4 4"            → all equal: the one shape where the direction
                                    of the comparison stops mattering, so only
                                    the tail and the index arithmetic can fail;
       "4 3 2 1" / "6"            → the leftover is the whole of the first list
                                    after a single number came out of the
                                    second.

       Six of the seven also kill an ascending `<=` left in the comparison — what
       a learner who edited the print line without reading the prompt submits.
       The all-equal case is the one that cannot: with every number the same,
       the direction of the comparison stops mattering, which is precisely why
       it is not the only case here. */
    cases: [
      { input: "30 20 10\n25 15", expectedOutput: "20" },
      { input: "5\n2 1", expectedOutput: "2" },
      { input: "4 3 2 1\n300 200 100", expectedOutput: "4", hidden: true },
      { input: "3 2 1\n7 6 5 4", expectedOutput: "4", hidden: true },
      { input: "-1 -5\n0 -3 -9", expectedOutput: "-3", hidden: true },
      { input: "4 4 4\n4 4", expectedOutput: "4", hidden: true },
      { input: "4 3 2 1\n6", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /* ADVANCED ONLY, and the month's «шешімді жазбаша қорғау міндетті» (p.6).
       It is also the only place in this lesson where the "one pass, no sorting"
       requirement is actually checked by anybody: a teacher reads it. Three
       questions, three short answers — the third is the one that makes the
       first two worth asking, because a learner who cannot say what the merge
       exploits will keep reaching for `.sort()` in March. */
    id: "m5.l7.b9",
    type: "explain",
    skillRefs: ["twopointers.core", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: 9,
    tracks: ["advanced"],
    prompt: {
      kk: "Біріктіру бірде-бір санды жоғалтпайтынын өз сөзіңмен дәлелде. Үш сұраққа қысқа жауап жаз. 1) Неге әр қадамда тек `a[i]` мен `b[j]`-ді салыстыру жеткілікті — қалған сандарды неге қараудың қажеті жоқ? 2) Басты цикл қашан тоқтайды және содан кейін не істелуі керек? 3) Екі тізімді қосып, қайта реттеуге де болар еді. Сенің бағдарламаң оның орнына нені пайдаланады және әр санға неше рет қарайды?",
      ru: "Докажи своими словами, что слияние не теряет ни одного числа. Ответь коротко на три вопроса. 1) Почему на каждом шаге достаточно сравнить только `a[i]` и `b[j]` — почему остальные числа можно не смотреть? 2) Когда останавливается главный цикл и что нужно сделать после него? 3) Можно было бы склеить списки и отсортировать заново. Что твоя программа использует вместо этого и сколько раз она смотрит на каждое число?",
    },
    expectedPoints: [
      {
        kk: "Екі тізім де реттелген, сондықтан әр тізімдегі әлі алынбаған ең кіші сан — оның көрсеткіші тұрған сан. Демек барлық қалған сандардың ең кішісі не `a[i]`, не `b[j]`: үшінші нұсқа жоқ.",
        ru: "Оба списка отсортированы, поэтому наименьшее ещё не взятое число каждого списка — это как раз то, на котором стоит его указатель. Значит, наименьшее из всех оставшихся — либо `a[i]`, либо `b[j]`: третьего варианта нет.",
      },
      {
        kk: "Басты цикл бір көрсеткіш өз тізімінің ұзындығына жеткенде тоқтайды, яғни сол тізім түгел таусылғанда. Одан кейін екінші тізімнің қалған бөлігін ретімен көшіріп жазу керек.",
        ru: "Главный цикл останавливается, когда один из указателей доходит до длины своего списка, то есть когда этот список полностью закончился. После этого нужно подряд переписать остаток второго списка.",
      },
      {
        kk: "Қалған бөлікті қайта реттеудің қажеті жоқ: ол өз ішінде реттелген және оның әр саны шығып қойған сандардың бәрінен кіші емес.",
        ru: "Остаток не нужно сортировать заново: внутри себя он уже упорядочен, и каждое его число не меньше всех уже выведенных.",
      },
      {
        kk: "Бағдарлама тізімдердің реттелгенін пайдаланады — бұл бізге тегін келген дайын ақпарат. Әр сан дәл бір рет қаралады, барлығы `len(a) + len(b)` қадам; ал қосып, қайта реттеу сол реттелгендікті лақтырып тастап, жұмысты қайтадан бастау болар еді.",
        ru: "Программа пользуется тем, что списки уже отсортированы, — это готовая информация, доставшаяся даром. Каждое число просматривается ровно один раз, всего `len(a) + len(b)` шагов; а склеить и отсортировать заново означало бы выбросить эту упорядоченность и начать работу с нуля.",
      },
    ],
  },
];
