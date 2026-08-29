import type { LessonBlock } from "../../types";

/**
 * m5.l4 · «Екі шекара әдісі» / «Метод двух указателей» — 9 minutes.
 *
 * Skills: `twopointers.core`, `perf.compare_solutions`. PDF p.9.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * The mastery paragraph has two halves and this lesson owns the second:
 * «…**тізімнің үздіксіз бөлігін екі шекараны жылжыта отырып өңдеу**». The
 * practice paragraph then names the family by hand — «**қажетті қосындысы бар
 * жұпты табу**» — and that family is what `b2`, `b6`, `b8` and `b9` are.
 *
 * The month's other requirement, «алғашқы екі аптада дайын кодты оқу, түзету
 * және толықтыру көбірек беріледі», is explicitly about the FIRST two weeks.
 * `m5.u2` is the second half, so the blank-editor weighting here is normal
 * rather than reduced: core and advanced write two programs from scratch, and
 * support gets one blank editor plus a scaffold, which is the permanent p.6
 * rule for that route and not this month's extra one.
 *
 * ## The one idea, and why it is the same idea as December's
 *
 * Two indices that only ever move towards each other remove exactly one number
 * from the segment per step, so the walk ends after fewer than n steps while
 * the nested loop over pairs makes n·(n−1)/2 of them. That is `m4.l2`'s
 * «екі шешімді салыстыру» with a technique attached instead of a formula: in
 * December the fast solution was handed over and counted, here the learner
 * builds it. `b5` is the counting card and it is the one place the two months
 * are named together.
 *
 * ## Four authoring decisions worth stating
 *
 * 1. **The find_bug is deliberately NOT the pair search.** A `find_bug` whose
 *    `fixedCode` is the program the next `write_code` asks for hands the answer
 *    over, which is the first defect class the adversarial review named. So
 *    `b7` breaks the OTHER walk this lesson mentions — the mirror check, where
 *    both indices move every step — and its bug is the one that matters here:
 *    an index moving away from its partner instead of towards it. It is also a
 *    deliberate callback: the learner wrote that walk in October (`m2.p6`), so
 *    the shape is familiar and only the direction is in question.
 *
 * 2. **How repeats are counted in `b9`, decided once and stated in both
 *    prompts.** Equal numbers standing in different positions are different
 *    numbers, but **each position may be used in at most one pair**, and the
 *    answer is the largest number of pairs that can be formed. That rule is
 *    what makes the greedy walk correct — the smallest remaining number's only
 *    possible partner is the largest remaining one — and it is the same
 *    argument the concept block makes. Counting index pairs instead (i < j)
 *    would answer 3 on `1 1 1 3`; the hidden case is there.
 *
 * 3. **"One pass" is guidance, not a graded rule.** A nested loop over pairs is
 *    correct and no output comparison can see the difference; the case data a
 *    source file can hold will never make it time out. So `b8` says in both
 *    languages that the sorted list *lets* you do it in one pass and that the
 *    mark is on the answer. Option 2 of the contract's three, chosen because
 *    option 1 is unavailable here and option 3 belongs to the month's
 *    assessment, which already asks for the oral defence.
 *
 * 4. **No `import`, and no `in` in the search solutions.** `bisect` is the
 *    obvious one, but `s - x in a` is the quieter one: it answers this
 *    lesson's question with a linear scan and no pointers at all. It is left
 *    reachable — the construct is October's — and it is killed on the case
 *    where it pairs a number with itself (`1 3 4 9`, s = 8).
 */

const P = 9;

export const M5_L4: LessonBlock[] = [
  {
    id: "m5.l4.b1",
    type: "concept",
    skillRefs: ["twopointers.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Екі көрсеткіш: біреуі басынан, біреуі соңынан",
      ru: "Два указателя: один с начала, другой с конца",
    },
    body: {
      kk:
        "Тізім өспелі ретпен реттелген болсын. Екі көрсеткіш аламыз: `left` тізімнің басында тұрады (индексі 0), `right` соңында тұрады (индексі `len(a) - 1`). Олардың астындағы сандардың қосындысы — `a[left] + a[right]`.\n\n" +
        "Мақсат — қосындысы `s` болатын жұп табу. Әр қадамда осы қосындыны `s`-пен салыстырамыз, ал ереже екеу.\n\n" +
        "**Қосынды тым кіші болса, `left` бір қадам оңға жылжиды.** Себебі қалған сандардың ішінде `a[left]`-тің ең үлкен серігі — `a[right]`, ал онымен де қосынды `s`-ке жетпей тұр. Кішірек серікпен ол одан да аз болады. Демек `a[left]` ешқандай жұпқа жарамайды, оны сегменттен алып тастауға болады.\n\n" +
        "**Қосынды тым үлкен болса, `right` бір қадам солға жылжиды.** Себебі қалғандардың ішінде `a[right]`-тің ең кіші серігі — `a[left]`, ал онымен де қосынды `s`-тен асып тұр. Үлкенірек серікпен ол одан да көп болады. Демек `a[right]` де жарамайды.\n\n" +
        "Әр қадамда дәл бір сан шығып қалады, ал көрсеткіштер ешқашан кері қайтпайды. Сондықтан олар кездескенше жасалатын қадам саны `n`-нен аз: жауап та жоғалмайды, уақыт та үнемделеді. Барлық жұпты қарайтын ішкі цикл `n · (n − 1) / 2` жұп тексереді, ал бұл әдіс бір ғана өтуде бітеді.\n\n" +
        "Желтоқсанда бір есептің баяу және жылдам шешімін қатар қойып салыстырғанбыз. Бұл — сол салыстырудың екінші жағы: жылдам шешімнің өзі қайдан шығатыны.\n\n" +
        "Ескерту: екі көрсеткішпен жүрудің басқа түрі де бар — онда екеуі де әр қадамда жылжиды (мысалы, тізімнің симметриялы екенін тексергенде). Ондай жүрісті осы сабақта бір рет жөндейміз. Ал қосындысы бар жұпты іздегенде әр қадамда тек біреуі жылжиды.",
      ru:
        "Пусть список отсортирован по возрастанию. Возьмём два указателя: `left` стоит в начале списка (индекс 0), `right` — в конце (индекс `len(a) - 1`). Сумма чисел под ними — это `a[left] + a[right]`.\n\n" +
        "Цель — найти пару с суммой `s`. На каждом шаге сравниваем текущую сумму с `s`, и правил ровно два.\n\n" +
        "**Сумма слишком мала — `left` сдвигается на шаг вправо.** Ведь среди оставшихся чисел самый большой партнёр для `a[left]` — это `a[right]`, а даже с ним сумма не дотягивает до `s`. С меньшим партнёром она будет ещё меньше. Значит, `a[left]` не подходит ни к одной паре, и его можно убрать из отрезка.\n\n" +
        "**Сумма слишком велика — `right` сдвигается на шаг влево.** Ведь среди оставшихся самый маленький партнёр для `a[right]` — это `a[left]`, а даже с ним сумма превышает `s`. С бо́льшим партнёром она будет ещё больше. Значит, `a[right]` тоже не подходит.\n\n" +
        "На каждом шаге выбывает ровно одно число, и указатели никогда не идут назад. Поэтому до их встречи будет меньше `n` шагов: и ответ не теряется, и время экономится. Вложенный цикл по всем парам проверяет `n · (n − 1) / 2` пар, а этот способ укладывается в один проход.\n\n" +
        "В декабре мы ставили рядом медленное и быстрое решение одной задачи и сравнивали их. Это — вторая сторона того же сравнения: откуда берётся само быстрое решение.\n\n" +
        "Замечание: бывает и другой ход с двумя указателями — там на каждом шаге двигаются оба (например, при проверке списка на зеркальность). Такой ход мы один раз починим на этом уроке. А при поиске пары с нужной суммой на каждом шаге двигается только один.",
    },
    code: "a = [4, 7, 10, 15, 21]\nleft = 0\nright = len(a) - 1\nprint(a[left] + a[right])",
  },
  {
    /*
     * «толық талданған мысал». Every move of both pointers is written out,
     * because the rule without the argument behind it is a coin flip the
     * learner has to memorise — and the argument («қалғандардың ішіндегі ең
     * үлкен серігі») is exactly what `b9` needs again when it counts pairs.
     *
     * The program prints the two VALUES of the pair. `b6` prints the two
     * indices, `b8` prints yes/no and `b4` prints a step count: four different
     * outputs on the same walk, so nothing on a later card is transcribed from
     * this one.
     */
    id: "m5.l4.b2",
    type: "worked_example",
    skillRefs: ["twopointers.core", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: қосындысы 18 болатын жұп",
      ru: "Разобранный пример: пара с суммой 18",
    },
    problem: {
      kk: "Реттелген тізім `1 4 6 9 12 15 20` берілген, ізделетін қосынды 18. Қосындысы дәл 18 болатын екі санды тауып, оларды бос орынмен бөліп шығару керек. Ондай жұп болмаса `none` деген сөз шығады. Әр қадамда қай көрсеткіш неге жылжитынын жазып отырамыз.",
      ru: "Дан отсортированный список `1 4 6 9 12 15 20`, искомая сумма — 18. Нужно найти два числа с суммой ровно 18 и вывести их через пробел. Если такой пары нет, выводится слово `none`. На каждом шаге записываем, какой указатель сдвигается и почему.",
    },
    steps: [
      {
        kk: "`left = 0` (сан 1), `right = 6` (сан 20). Қосынды 1 + 20 = 21, ал бізге 18 керек — тым үлкен. 20-ның ең кіші серігі — 1, онымен де асып тұр. Демек 20 жарамайды: `right` 5-ке жылжиды.",
        ru: "`left = 0` (число 1), `right = 6` (число 20). Сумма 1 + 20 = 21, а нужно 18 — слишком много. Самый маленький партнёр для 20 — это 1, и даже с ним перебор. Значит, 20 не подходит: `right` сдвигается на 5.",
      },
      {
        kk: "`left = 0` (сан 1), `right = 5` (сан 15). Қосынды 1 + 15 = 16 — тым кіші. Қалғандардың ішінде 1-дің ең үлкен серігі 15 еді, онымен де жетпей тұр. Демек 1 жарамайды: `left` 1-ге жылжиды.",
        ru: "`left = 0` (число 1), `right = 5` (число 15). Сумма 1 + 15 = 16 — слишком мало. Среди оставшихся самым большим партнёром для 1 было 15, и даже с ним не хватает. Значит, 1 не подходит: `left` сдвигается на 1.",
      },
      {
        kk: "`left = 1` (сан 4), `right = 5` (сан 15). Қосынды 4 + 15 = 19 — 18-ден бір артық. Ереже бойынша `right` 4-ке жылжиды.",
        ru: "`left = 1` (число 4), `right = 5` (число 15). Сумма 4 + 15 = 19 — на единицу больше 18. По правилу `right` сдвигается на 4.",
      },
      {
        kk: "`left = 1` (сан 4), `right = 4` (сан 12). Қосынды 4 + 12 = 16 — тым кіші, енді 4 те жарамайды: `left` 2-ге жылжиды.",
        ru: "`left = 1` (число 4), `right = 4` (число 12). Сумма 4 + 12 = 16 — слишком мало, теперь и 4 не подходит: `left` сдвигается на 2.",
      },
      {
        kk: "`left = 2` (сан 6), `right = 4` (сан 12). Қосынды 6 + 12 = 18 — дәл сол. Жұп табылды, цикл тоқтайды.",
        ru: "`left = 2` (число 6), `right = 4` (число 12). Сумма 6 + 12 = 18 — ровно то, что нужно. Пара найдена, цикл останавливается.",
      },
      {
        kk: "Барлығы бес қосынды есептелді. Ішкі циклмен жазсақ, 7 санның 7 · 6 / 2 = 21 жұбын тексеруге тура келер еді. Айырма кішкентай тізімде байқалмайды, бірақ мыңдаған санда ол шешуші.",
        ru: "Всего посчитано пять сумм. Если писать вложенным циклом, пришлось бы проверить 7 · 6 / 2 = 21 пару из 7 чисел. На маленьком списке разница незаметна, но на тысячах чисел она решает всё.",
      },
    ],
    code:
      "a = [1, 4, 6, 9, 12, 15, 20]\n" +
      "target = 18\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "found = 0\n" +
      "while left < right:\n" +
      "    t = a[left] + a[right]\n" +
      "    if t == target:\n" +
      "        found = 1\n" +
      "        break\n" +
      "    if t < target:\n" +
      "        left = left + 1\n" +
      "    else:\n" +
      "        right = right - 1\n" +
      "if found == 1:\n" +
      "    print(a[left], a[right])\n" +
      "else:\n" +
      '    print("none")',
    result: {
      kk: "Экранға `6 12` шығады — бес қадамнан кейін табылған жұп.",
      ru: "На экран выводится `6 12` — пара, найденная за пять шагов.",
    },
  },
  {
    /*
     * The whole card is one move of the walk, and the answer is the pair of new
     * indices rather than the word «left»/«right»: naming the direction is half
     * the rule, naming which index changed is the other half.
     *
     * «1 4» is left unmapped on purpose. It can mean «ешқайсысы жылжымайды»,
     * but it can equally come from a learner who counted the list from 1 and so
     * read a[1] as 3 and a[4] as 14 — that gives 17, exactly the target, and
     * nothing moves. Two causes, so the engine asks instead of telling.
     */
    id: "m5.l4.b3",
    type: "prediction",
    skillRefs: ["twopointers.core", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "Тізім реттелген, ізделетін қосынды `target = 17`. Көрсеткіштер қазір `left = 1` және `right = 4` орындарында тұр. Бағдарлама бір ғана қадам жасайды да, жаңа `left` пен `right` мәнін бос орынмен бөліп шығарады. Не шығады?",
      ru: "Список отсортирован, искомая сумма `target = 17`. Указатели сейчас стоят на `left = 1` и `right = 4`. Программа делает ровно один шаг и выводит новые значения `left` и `right` через пробел. Что она выведет?",
    },
    code:
      "a = [3, 6, 9, 14, 20]\n" +
      "target = 17\n" +
      "left = 1\n" +
      "right = 4\n" +
      "if a[left] + a[right] < target:\n" +
      "    left = left + 1\n" +
      "else:\n" +
      "    right = right - 1\n" +
      "print(left, right)",
    answer: "1 3",
    options: ["1 3", "2 4", "1 4", "2 3"],
    diagnosticMapping: {
      "2 4": {
        failureClass: "two_pointer_move_rule_inverted",
        justification:
          "Қосынды 6 + 20 = 26, ал `target` 17 — қосынды тым үлкен, сондықтан `right` солға жылжуы керек. `2 4` жауабы `left`-тің жылжығанын білдіреді, яғни ереже теріс қолданылған: тым үлкен қосындыны одан әрі үлкейтетін бағыт таңдалған.",
      },
    },
  },
  {
    /*
     * The month's mandatory animation does not exist yet (see the month file's
     * header), so the walk is traced by hand instead of watched — «Кодты қолмен
     * орындау» is one of the programme's own five verification methods, and the
     * three columns are exactly the three the animation would have shown.
     *
     * The program counts its own steps, which is what `b5` then asks about at
     * a size no one can trace: six steps on eight numbers, against the 28 pairs
     * a nested loop would check.
     */
    id: "m5.l4.b4",
    type: "trace_code",
    skillRefs: ["twopointers.core", "loops.while", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Қағазға үш баған сыз: `left`, `right`, `t`. Циклдің әр айналымында 7-жол орындалғаннан кейінгі мәндерді жаз. Цикл тоқтағанда `steps` нешеге тең болатынын да көрсет.",
      ru: "Начерти на бумаге три столбца: `left`, `right`, `t`. На каждом обороте цикла записывай значения после выполнения строки 7. Когда цикл остановится, укажи ещё и чему равно `steps`.",
    },
    code:
      "a = [2, 5, 7, 9, 12, 16, 20, 27]\n" +
      "target = 19\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "steps = 0\n" +
      "while left < right:\n" +
      "    t = a[left] + a[right]\n" +
      "    steps = steps + 1\n" +
      "    if t == target:\n" +
      "        break\n" +
      "    if t < target:\n" +
      "        left = left + 1\n" +
      "    else:\n" +
      "        right = right - 1\n" +
      "print(steps)",
    steps: [
      { line: 7, vars: { left: "0", right: "7", t: "29" } },
      { line: 7, vars: { left: "0", right: "6", t: "22" } },
      { line: 7, vars: { left: "0", right: "5", t: "18" } },
      { line: 7, vars: { left: "1", right: "5", t: "21" } },
      { line: 7, vars: { left: "1", right: "4", t: "17" } },
      { line: 7, vars: { left: "2", right: "4", t: "19" } },
      { line: 15, vars: { left: "2", right: "4", t: "19", steps: "6" } },
    ],
  },
  {
    /*
     * The counting card, and the one place December and January are named
     * together. The prompt says «әр жұпты бір рет тексереді» so that the
     * nested-loop figure is n·(n−1)/2 and not n², which is what makes o4 a
     * wrong answer rather than a rounding argument.
     *
     * Only o3 is mapped. o2 and o4 both have more than one route into them —
     * a miscounted nested loop, or a guess at the order of magnitude — and a
     * mapping that fits two causes tells a fourteen-year-old something false.
     */
    id: "m5.l4.b5",
    type: "multiple_choice",
    skillRefs: ["perf.compare_solutions", "twopointers.core"],
    sourceType: "product-authored",
    prompt: {
      kk: "Реттелген тізімде n = 100 000 сан бар, солардың ішінен қосындысы s болатын жұпты іздейміз. Бірінші шешім — ішкі цикл: ол әр жұпты бір рет тексереді. Екінші шешім — екі көрсеткіш: әр қадамда біреуі ғана жылжиды және олар ешқашан кері қайтпайды. Әрқайсысы ең көбі қанша жұмыс жасайды?",
      ru: "В отсортированном списке n = 100 000 чисел, среди них ищем пару с суммой s. Первое решение — вложенный цикл: он проверяет каждую пару по одному разу. Второе решение — два указателя: на каждом шаге сдвигается только один, и назад они не возвращаются. Сколько работы в худшем случае делает каждое?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "шамамен 5 000 000 000 жұп және 100 000-нан аз қадам",
          ru: "около 5 000 000 000 пар и меньше 100 000 шагов",
        },
      },
      {
        id: "o2",
        label: {
          kk: "шамамен 100 000 жұп және 100 000 қадам",
          ru: "около 100 000 пар и 100 000 шагов",
        },
      },
      {
        id: "o3",
        label: {
          kk: "шамамен 5 000 000 000 жұп және 5 000 000 000 қадам",
          ru: "около 5 000 000 000 пар и 5 000 000 000 шагов",
        },
      },
      {
        id: "o4",
        label: {
          kk: "шамамен 200 000 жұп және 100 000 қадам",
          ru: "около 200 000 пар и 100 000 шагов",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o3: {
        failureClass: "two_pointer_cost_read_as_all_pairs",
        justification:
          "Ішкі циклдің саны дұрыс аталған, ал екі көрсеткішке де сол сан қойылған. Бұл жауап екі көрсеткіш те барлық жұпты қарайды деп ойлағанда ғана шығады — яғни әр қадамда бір сан біржола шығып қалатыны байқалмаған.",
      },
    },
  },
  {
    /*
     * The two move rules, and nothing else, are the blanks. The loop condition
     * is `!= s` rather than `left < right` on purpose: the pair is guaranteed
     * to exist here, so the stopping rule is «қосынды табылды», and `b8` is
     * then the first card where it may NOT exist and the learner has to invent
     * a different guard. That is a real decision left for the blank editor
     * instead of being handed over here.
     *
     * Printing the two indices keeps this program distinct from `b2` (values),
     * `b4` (step count) and `b8` (yes/no).
     */
    id: "m5.l4.b6",
    type: "fill_blank",
    skillRefs: ["twopointers.core", "loops.while"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда өспелі ретпен реттелген сандар, екінші жолда қосынды `s` беріледі. Қосындысы `s` болатын жұп міндетті түрде бар, сондықтан цикл сол қосынды табылғанда тоқтайды. Бағдарлама сол екі санның индексін (нөлден басталатын нөмірін) бос орынмен бөліп шығарады. Екі жылжу ережесін толықтыр.",
      ru: "В первой строке даны числа, отсортированные по возрастанию, во второй — сумма `s`. Пара с суммой `s` гарантированно существует, поэтому цикл останавливается, когда эта сумма найдена. Программа выводит индексы этих двух чисел (нумерация с нуля) через пробел. Дополни два правила сдвига.",
    },
    template:
      "a = list(map(int, input().split()))\n" +
      "s = int(input())\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "while a[left] + a[right] != s:\n" +
      "    if a[left] + a[right] < s:\n" +
      "        left = ___\n" +
      "    else:\n" +
      "        right = ___\n" +
      "print(left, right)",
    blanks: [
      { id: "f1", answer: "left + 1" },
      { id: "f2", answer: "right - 1" },
    ],
  },
  {
    /*
     * The other two-pointer walk the concept block names: the mirror check,
     * where BOTH indices move on every step. It is here rather than the pair
     * search on purpose — a find_bug whose repaired program is the one `b8`
     * then asks for would hand the answer over, and that is the defect class
     * the first adversarial review found most often.
     *
     * The learner wrote this walk in October (m2.p6), so the shape is known and
     * only the direction is in doubt, which is precisely this month's idea.
     *
     * symptomInput is required: the fallback probe feeds single numbers, and on
     * a single number the loop never runs, so both programs print `yes` and the
     * bug reads as absent. On `1 2 2 1` the broken one walks off the end.
     *
     * No diagnosticMapping. Blaming line 8 could mean «сол көрсеткіш те қате
     * жылжиды» or «екеуі бірге жылжымауы керек» — two causes, so the engine
     * asks instead of telling.
     */
    id: "m5.l4.b7",
    type: "find_bug",
    skillRefs: ["twopointers.core", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама тізімнің айнадағыдай симметриялы екенін тексеруі керек: бірінші санды соңғысымен, екіншісін соңынан екіншісімен салыстырады, солай ортаға қарай жүреді. Симметриялы болса `yes`, болмаса `no` шығуы тиіс. Мұнда екі көрсеткіш те әр қадамда жылжиды. Бірақ `1 2 2 1` енгізгенде бағдарлама `yes` шығармай, «list index out of range» деген қатемен тоқтап қалады. Қай жол кінәлі және неге?",
      ru: "Эта программа должна проверять, зеркально ли симметричен список: первое число сравнивается с последним, второе — со вторым с конца, и так к середине. Если список симметричен, нужно вывести `yes`, иначе `no`. Здесь на каждом шаге двигаются оба указателя. Но при вводе `1 2 2 1` программа не выводит `yes`, а останавливается с ошибкой «list index out of range». Какая строка виновата и почему?",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "same = 1\n" +
      "while left < right:\n" +
      "    if a[left] != a[right]:\n" +
      "        same = 0\n" +
      "    left = left + 1\n" +
      "    right = right + 1\n" +
      "if same == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    buggyLine: 9,
    symptomInput: "1 2 2 1",
    fixedCode:
      "a = list(map(int, input().split()))\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "same = 1\n" +
      "while left < right:\n" +
      "    if a[left] != a[right]:\n" +
      "        same = 0\n" +
      "    left = left + 1\n" +
      "    right = right - 1\n" +
      "if same == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
  },
  {
    /*
     * PDF p.9: «қажетті қосындысы бар жұпты табу». The blank editor, for all
     * three tracks — this is the family the programme names, and support is not
     * given a shorter month; what support is spared is the harder `b9`.
     *
     * The prompt says the sorted list LETS you finish in one pass and that the
     * mark is on the answer. A nested loop is correct and cannot be
     * distinguished by output comparison, and no case set a source file can
     * hold will make it time out — so it is stated as advice, not as a rule
     * the learner is told was checked.
     *
     * The cases are chosen against the wrong programs, one line each:
     *   `1 3 4 9` / 8   — the ONLY case that kills two of them at once: the
     *                     guard written `left <= right`, which pairs 4 with
     *                     itself, and `s - x in a`, which is the same mistake
     *                     written as a linear scan with no pointers at all.
     *   `1 4 5 9` / 9   — the pair is adjacent and in the middle: kills both
     *                     «тек шеткі екеуін тексеру» and a walk that stops one
     *                     step early.
     *   `1 … 10` / 19   — the answer sits on the LAST two positions.
     *   `1 … 10` / 3    — and on the first two.
     *   `2 3 5 8 13 21` — both pointers must move before the pair is found, so
     *                     the inverted move rule dies here.
     *   `5 7` / 12, 11  — the two-element list, both answers.
     *   `1 1` / 2       — equal values in two different positions really are a
     *                     pair; `-5 -1 0 3 8` keeps negatives in the set.
     */
    id: "m5.l4.b8",
    type: "write_code",
    skillRefs: ["twopointers.core", "lists.index", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бірінші жолда өспелі ретпен реттелген бүтін сандар беріледі (кемінде екеу, бірдей сандар кездесуі мүмкін). Екінші жолда бүтін сан `s` беріледі. Тізімде қосындысы дәл `s` болатын, әр түрлі екі орында тұрған сан бар ма? Бар болса `yes`, болмаса `no` деген сөзді шығар. Бір орындағы санды екі рет қосуға болмайды: жұп екі бөлек орыннан алынады. Кеңес: тізім реттелген, сондықтан оны екі көрсеткішпен бір өтуде шешуге болады — баға тек жауап бойынша қойылады.",
      ru: "В первой строке даны целые числа, отсортированные по возрастанию (их хотя бы два, одинаковые числа встречаться могут). Во второй строке дано целое число `s`. Есть ли в списке два числа на разных позициях, сумма которых ровно `s`? Если есть, выведи слово `yes`, если нет — `no`. Одно и то же число с одной позиции нельзя брать дважды: пара берётся с двух разных позиций. Совет: список отсортирован, поэтому задачу можно решить двумя указателями за один проход — оценивается только ответ.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "s = int(input())\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "found = 0\n" +
      "while left < right and found == 0:\n" +
      "    if a[left] + a[right] == s:\n" +
      "        found = 1\n" +
      "    elif a[left] + a[right] < s:\n" +
      "        left = left + 1\n" +
      "    else:\n" +
      "        right = right - 1\n" +
      "if found == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    cases: [
      { input: "1 4 5 9\n9", expectedOutput: "yes" },
      { input: "2 4 6\n11", expectedOutput: "no" },
      { input: "2 3 5 8 13 21\n16", expectedOutput: "yes", hidden: true },
      { input: "1 3 4 9\n8", expectedOutput: "no", hidden: true },
      { input: "5 7\n12", expectedOutput: "yes", hidden: true },
      { input: "5 7\n11", expectedOutput: "no", hidden: true },
      { input: "1 1\n2", expectedOutput: "yes", hidden: true },
      { input: "-5 -1 0 3 8\n-6", expectedOutput: "yes", hidden: true },
      { input: "1 2 3 4 5 6 7 8 9 10\n19", expectedOutput: "yes", hidden: true },
      { input: "1 2 3 4 5 6 7 8 9 10\n3", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * The counting variant. Not the PDF's own wording — the programme says
     * «жұпты табу», find the pair — so this is product-authored, and it exists
     * because the pairing rule is what forces the learner to move BOTH
     * pointers on a match instead of one.
     *
     * The repeat rule is stated in both prompts and illustrated with the two
     * visible cases: equal numbers in different positions are different
     * numbers, each position is used at most once, and the answer is the
     * largest number of pairs. The greedy walk is correct for exactly that
     * question, by the argument the concept block already made: the smallest
     * remaining number's only possible partner is the largest remaining one.
     *
     * Against the wrong programs:
     *   `1 1 1 3` / 4   — index pairs (i < j) would answer 3. The two-pointer
     *                     count answers 1, because the single 3 can be used
     *                     once.
     *   `1 1 3` / 4     — a match that advances only `left` counts the 3 twice.
     *   `2 2 2 2` / 4   — a walk that stops at the first match answers 1.
     *   `1 3 4` / 8     — the guard written `left <= right` pairs 4 with itself
     *                     and answers 1 where the truth is 0.
     *   `1 2 3 4 5 6`   — every number is used: the answer IS the whole list.
     *   `5` / 5         — one element, so the loop never runs.
     *   `3 7` / 10      — the whole list is exactly one pair.
     */
    id: "m5.l4.b9",
    type: "write_code",
    skillRefs: ["twopointers.core", "loops.counter", "lists.index"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда өспелі ретпен реттелген бүтін сандар беріледі (кемінде біреу, бірдей сандар кездесуі мүмкін). Екінші жолда бүтін сан `s` беріледі. Сандарды жұптастырамыз: әр жұптың қосындысы дәл `s` болуы керек, ал әр орындағы сан ең көбі бір жұпқа кіреді. Ең көп неше жұп құруға болады? Сол санды шығар. Мысалы `1 2 3 4` тізімі мен `s = 5` үшін жауап 2 — (1, 4) және (2, 3). Ал `2 2 2 5` тізімі мен `s = 4` үшін жауап 1: екі екілік бір жұп құрады, ал үшінші екіліктің серігі қалмайды.",
      ru: "В первой строке даны целые числа, отсортированные по возрастанию (хотя бы одно, одинаковые числа встречаться могут). Во второй строке дано целое число `s`. Составляем пары: сумма каждой пары должна быть ровно `s`, а число с каждой позиции входит не более чем в одну пару. Сколько пар удастся составить самое большее? Выведи это число. Например, для списка `1 2 3 4` и `s = 5` ответ 2 — это (1, 4) и (2, 3). А для списка `2 2 2 5` и `s = 4` ответ 1: две двойки образуют пару, а третьей двойке партнёра уже не остаётся.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "s = int(input())\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "count = 0\n" +
      "while left < right:\n" +
      "    t = a[left] + a[right]\n" +
      "    if t == s:\n" +
      "        count = count + 1\n" +
      "        left = left + 1\n" +
      "        right = right - 1\n" +
      "    elif t < s:\n" +
      "        left = left + 1\n" +
      "    else:\n" +
      "        right = right - 1\n" +
      "print(count)",
    cases: [
      { input: "1 2 3 4\n5", expectedOutput: "2" },
      { input: "2 2 2 5\n4", expectedOutput: "1" },
      { input: "1 2 3\n100", expectedOutput: "0", hidden: true },
      { input: "1 1 1 3\n4", expectedOutput: "1", hidden: true },
      { input: "1 1 3\n4", expectedOutput: "1", hidden: true },
      { input: "2 2 2 2\n4", expectedOutput: "2", hidden: true },
      { input: "1 3 4\n8", expectedOutput: "0", hidden: true },
      { input: "5\n5", expectedOutput: "0", hidden: true },
      { input: "3 7\n10", expectedOutput: "1", hidden: true },
      { input: "-4 -1 0 1 5 9\n5", expectedOutput: "2", hidden: true },
      { input: "1 2 3 4 5 6\n7", expectedOutput: "3", hidden: true },
      { input: "2 2 3 3\n5", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m5.l4.b9, not an addition to it. PDF p.6:
     * «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ» —
     * support still meets the counting problem, and still writes `b8` from the
     * blank editor; what is withheld is the second blank editor.
     *
     * The two branches that are already written are the moves the learner has
     * seen twice by now; the branch left open is the one this task adds and the
     * one `b9` exists for — the match, where the counter grows and BOTH
     * pointers move because both numbers have been used up. The prompt gives
     * the reason and not the three lines.
     *
     * Its branch order (< / > / else) and its names differ from `b9`'s
     * reference (== / < / else, with `t`), so the filled template is not a copy
     * of any program in this lesson.
     */
    id: "m5.l4.b9s",
    type: "fill_blank",
    skillRefs: ["twopointers.core", "loops.counter", "lists.index"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бағдарлама реттелген тізімнен қосындысы `s` болатын жұптарды санауы керек: әр орындағы сан ең көбі бір жұпқа кіреді. Қосынды тым кіші не тым үлкен болғандағы екі тармақ жазылып қойған. Соңғы тармақ — қосынды дәл `s` болған жағдай: онда жұп табылды, ал оның екі саны да пайдаланылып кетті, сондықтан екеуін де сегменттен шығару керек. Үш орынды толықтыр.",
      ru: "Программа должна считать пары с суммой `s` в отсортированном списке: число с каждой позиции входит не более чем в одну пару. Две ветки — когда сумма слишком мала и когда слишком велика — уже написаны. Последняя ветка — случай, когда сумма ровно `s`: пара найдена, и оба её числа уже использованы, поэтому оба нужно убрать из отрезка. Дополни три места.",
    },
    template:
      "a = list(map(int, input().split()))\n" +
      "s = int(input())\n" +
      "left = 0\n" +
      "right = len(a) - 1\n" +
      "pairs = 0\n" +
      "while left < right:\n" +
      "    if a[left] + a[right] < s:\n" +
      "        left = left + 1\n" +
      "    elif a[left] + a[right] > s:\n" +
      "        right = right - 1\n" +
      "    else:\n" +
      "        pairs = ___\n" +
      "        left = ___\n" +
      "        right = ___\n" +
      "print(pairs)",
    blanks: [
      { id: "f1", answer: "pairs + 1" },
      { id: "f2", answer: "left + 1" },
      { id: "f3", answer: "right - 1" },
    ],
  },
];
