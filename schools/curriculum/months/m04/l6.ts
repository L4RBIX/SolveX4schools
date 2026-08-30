import type { LessonBlock } from "../../types";

/**
 * m4.l6 · «Күрделірек есептер» / «Задачи посложнее» — 10 minutes.
 *
 * Skills: `precompute.prefix`, `sort.basic`, `perf.compare_solutions`. PDF p.8.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * December's title names two tools — «сұрыптау ЖӘНЕ алдын ала есептеу» — and
 * every earlier lesson of the month teaches one of them at a time: `m4.l3` and
 * `m4.l4` order a list, `m4.l5` fills a prefix table over the list it is given.
 * This is the lesson where the conjunction in the title has to mean something.
 * Every task below needs both, and neither alone is enough:
 *
 *   · sorting without a table answers ONE question quickly and q questions
 *     slowly, which is `m4.l5`'s whole complaint;
 *   · a table without sorting answers every question instantly and answers the
 *     WRONG question, because `p[k]` over an unordered list is the total of the
 *     first k prices as typed in, not of the k cheapest.
 *
 * The second half of that is why `b2`'s fourth plan exists and why `b5` is the
 * find_bug it is. A learner who has only learnt "precompute and it gets fast"
 * picks the fast wrong plan; the point of a synthesis lesson is to make that
 * cost visible once, cheaply, before it costs a contest.
 *
 * Two more clauses are carried directly. «Айдың басты тәсілі - бір есептің екі
 * шешімін салыстыру» is `b2` and `b4`: the same problem, priced twice, and in
 * `b4` the slow solution is on the card and correct — the edit must not change
 * a single answer. «Шешімді жазбаша қорғау міндетті» (p.6, advanced) is `b9`,
 * and its three questions are deliberately not answerable by describing the
 * code: two are about step counts and the third is about why reordering the
 * list does not change the answer.
 *
 * ## The clock that does not exist
 *
 * `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §3: there is no time
 * limit in the content model and the judge reports pass/fail, not duration. So
 * every task here STATES its constraint — n and q up to 200 000, about ten
 * million steps a second, the same single number `m4.l1` established — and the
 * cases are small enough to run. A learner who submits the quadratic solution
 * passes the judge and has still chosen wrong, and `b2`, `b4` and `b9` are
 * where that choice is actually assessed. Nobody is marked wrong by a clock
 * that is not there.
 *
 * ## One convention, inherited unchanged from m4.l5
 *
 * `p = [0] * (n + 1)`, `p[i] = p[i - 1] + a[i - 1]`, so `p[i]` is the sum of
 * the first i elements and `p[0] = 0`. Nothing here introduces a second
 * indexing scheme. What IS new is that the table is filled over the list AFTER
 * `a.sort()`, which turns `p[k]` from "the first k as typed" into "the k
 * smallest" — that single sentence is the lesson.
 *
 * ## Transcription, and what each card is allowed to show
 *
 * An October review found tasks passable by copying a program off a
 * neighbouring card, so every visible program here belongs to a question that
 * is asked nowhere else:
 *
 *   · `b1` hard-codes five prices, reads no input and has no query loop;
 *   · `b4` shows the k-LARGEST total written with an inner loop;
 *   · `b5` shows the k-cheapest AVERAGE, a question no task asks;
 *   · `b7s`'s starting program trims only the m lowest scores, so leaving it
 *     alone fails every case that has m > 0 — which is every case it has.
 *
 * `b6` (k cheapest, total) and `b7` (drop the m lowest and the m highest) are
 * written from scratch, and no card on screen contains either program.
 *
 * ## Python
 *
 * Everything through November, plus this month's `sorted()` and `.sort()`.
 * `min`, `max` and `sum` arrived with them and are deliberately unused: the
 * whole subject is that the total of a range must come from a table filled
 * once, and `sum(a[0:k])` re-walks the range on every question, which is the
 * plan `b2` rejects. No `set`, no `dict`, no comprehension, no import.
 *
 * The only word any program prints is `overlap`, in `b8`, and both prompts
 * name it — a Russian-track learner is never asked to recognise a Kazakh word
 * inside output.
 */

const P = 8; // PDF page for all of December

export const M4_L6: LessonBlock[] = [
  {
    /*
     * The month's «толық талданған мысал», and the only card in the lesson that
     * shows the two tools meeting. It reads no input on purpose: the query loop
     * and the I/O are what b6 asks the learner to build, so the example stops
     * at the idea and hands over the arithmetic, not the program.
     *
     * Step 1 is the exchange argument, and it is not decoration — without it
     * "take the k cheapest" is a guess. Step 6 is the one b2's fourth plan and
     * b5's bug both come back to.
     */
    id: "m4.l6.b1",
    type: "worked_example",
    skillRefs: ["sort.basic", "precompute.prefix", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: реттеу префикс кестені мағыналы етеді",
      ru: "Разобранный пример: сортировка делает префиксную таблицу осмысленной",
    },
    problem: {
      kk: "Дүкенде бес тауар бар, бағалары: 70, 20, 50, 10, 40. Сатып алушы бірнеше рет сұрайды: «k тауар алсам, ең аз дегенде қанша төлеймін?» k әр жолы басқаша болады, ал жауап әр сұраққа бірден керек.",
      ru: "В магазине пять товаров с ценами 70, 20, 50, 10, 40. Покупатель несколько раз спрашивает: «если я возьму k товаров, сколько заплачу самое меньшее?» k каждый раз другое, а ответ нужен сразу на каждый вопрос.",
    },
    steps: [
      {
        kk: "Алдымен қай k тауарды алу керегін дәлелдейік. Ең арзан k тауарды алмағанбыз дейік — онда таңдалғандардың ішінде ең қымбаты, таңдалмағандардың ішінде одан арзаны бар. Оларды ауыстырсақ, тауар саны сол күйінде қалады, ал төлем азаяды. Демек ең арзан k тауарды алу әрқашан кем дегенде сондай тиімді, ал жауап — ең кіші k бағаның қосындысы.",
        ru: "Сначала докажем, какие k товаров надо брать. Пусть мы взяли не самые дешёвые k — тогда среди выбранных есть самый дорогой, а среди невыбранных найдётся более дешёвый. Поменяем их местами: количество товаров не изменится, а сумма уменьшится. Значит, брать k самых дешёвых всегда не хуже, и ответ — это сумма k наименьших цен.",
      },
      {
        kk: "Реттелмеген тізімде ең кіші k бағаның қай орында тұратыны белгісіз: 10 мен 20 тізімнің әр жерінде шашырап жатыр, сондықтан оларды әр сұрақ сайын іздеуге тура келеді. Реттегеннен кейін дәл сол k баға тізімнің АЛҒАШҚЫ k орнында тұрады. Реттеу «ең арзандары» деген сұрақты «бірінші k орын» деген сұраққа айналдырады.",
        ru: "В неотсортированном списке «k наименьших цен» никак не связаны с позицией: 10 и 20 стоят в разных концах списка, и на каждый вопрос их пришлось бы искать заново. После сортировки ровно эти k цен занимают ПЕРВЫЕ k мест. Сортировка превращает вопрос «какие самые дешёвые» в вопрос «первые k позиций».",
      },
      {
        kk: "Ал алғашқы k элементтің қосындысы — өткен сабақтағы префикс кестенің дәл өзі. Ереже сол күйінде қалады: `p[0] = 0`, ал `p[i] = p[i - 1] + a[i - 1]`, яғни `p[i]` — алғашқы i элементтің қосындысы. Бұл жерде ешқандай жаңа формула жоқ, тек кесте енді РЕТТЕЛГЕН тізім бойынша толтырылады.",
        ru: "А сумма первых k элементов — это ровно та префиксная таблица из прошлого урока. Правило прежнее: `p[0] = 0`, а `p[i] = p[i - 1] + a[i - 1]`, то есть `p[i]` — сумма первых i элементов. Никакой новой формулы здесь нет, просто таблица теперь заполняется по ОТСОРТИРОВАННОМУ списку.",
      },
      {
        kk: "Реттелген тізім: 10, 20, 40, 50, 70. Кестені бір рет толтырамыз: p = [0, 10, 30, 70, 120, 190]. Ішінде алты сан бар, себебі бос бөліктің қосындысы да кестеде тұр.",
        ru: "Отсортированный список: 10, 20, 40, 50, 70. Заполняем таблицу один раз: p = [0, 10, 30, 70, 120, 190]. В ней шесть чисел, потому что сумма пустого участка тоже лежит в таблице.",
      },
      {
        kk: "Енді әр сұрақ бір қарауға айналды: k = 1 болса p[1] = 10, k = 3 болса p[3] = 70, k = 5 болса p[5] = 190. Реттеу де, кестені толтыру да сұрақтар басталғанға дейін бір-ақ рет жасалды және ешбір сұрақ сайын қайталанбайды.",
        ru: "Теперь каждый вопрос — это одно обращение: при k = 1 берём p[1] = 10, при k = 3 — p[3] = 70, при k = 5 — p[5] = 190. И сортировка, и заполнение таблицы сделаны по одному разу до начала вопросов и ни на каком вопросе не повторяются.",
      },
      {
        kk: "Реті маңызды: алдымен реттеу, содан кейін кесте. Егер кестені бастапқы тізім бойынша толтырсақ, p[3] = 70 + 20 + 50 = 140 болып шығады — бұл «тізімде бірінші жазылған үш тауардың» бағасы, мүлде басқа сұрақтың жауабы. Бағдарлама сол күйінде жылдам болады, бірақ дұрыс жауап бермейді.",
        ru: "Порядок важен: сначала сортировка, потом таблица. Если заполнить таблицу по исходному списку, получится p[3] = 70 + 20 + 50 = 140 — это стоимость «первых трёх товаров в том порядке, как их записали», ответ на совсем другой вопрос. Программа при этом останется быстрой, но перестанет быть правильной.",
      },
    ],
    code:
      "a = [70, 20, 50, 10, 40]\n" +
      "n = len(a)\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "print(p)\n" +
      "print(p[1], p[3], p[5])",
    result: {
      kk: "Экранға екі жол шығады: [0, 10, 30, 70, 120, 190], содан кейін 10 70 190. Яғни бір тауар — 10, үш тауар — 70, бес тауар — 190.",
      ru: "На экран выйдут две строки: [0, 10, 30, 70, 120, 190], а затем 10 70 190. То есть один товар — 10, три товара — 70, пять товаров — 190.",
    },
  },
  {
    /*
     * PDF p.8's «осы бағдарлама үлгере ме?» in the shape this lesson needs: the
     * options are PLANS, not verdicts, and one of them is fast and wrong. That
     * is the whole reason this block is not a copy of m4.l2.b4, which asks the
     * four-verdict question about two correct programs.
     *
     * Only o4 is attributed. It is the one option whose step count matches the
     * right answer's exactly, so nobody picks it for being slow — the single
     * available reason is not noticing that the table has to be built over the
     * ordered list. o2 is left unmapped on purpose: "did not multiply the
     * per-question loop by q" and "distrusts the table and pays for safety" both
     * land there, and the contract says an ambiguous distractor gets no mapping.
     */
    id: "m4.l6.b2",
    type: "multiple_choice",
    skillRefs: ["perf.compare_solutions", "perf.time_estimate", "precompute.prefix", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Дүкенде n тауар бар, бағалары берілген (1 ≤ n ≤ 200 000). Одан кейін q сұрақ келеді (1 ≤ q ≤ 200 000), әр сұрақта бір k саны: «ең арзан k тауар барлығы қанша тұрады?» Компьютер бір секундта шамамен он миллион қарапайым қадам жасайды. Төмендегі төрт жоспардың қайсысы дұрыс жауап береді ЖӘНЕ уақытқа үлгереді? Екі шартты да тексер: жылдам болғанның бәрі бірдей дұрыс емес.",
      ru: "В магазине n товаров с известными ценами (1 ≤ n ≤ 200 000). Затем приходит q вопросов (1 ≤ q ≤ 200 000), в каждом одно число k: «сколько всего стоят k самых дешёвых товаров?» Компьютер выполняет около десяти миллионов простых шагов в секунду. Какой из четырёх планов ниже даёт правильный ответ И укладывается во время? Проверь оба условия: не всякий быстрый план правильный.",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Әр сұрақ сайын тізімді қайтадан реттеп, содан кейін алғашқы k бағаны циклмен қосу.",
          ru: "На каждый вопрос заново сортировать список, а потом циклом складывать первые k цен.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Тізімді бір рет реттеп, әр сұрақ сайын алғашқы k бағаны циклмен қосу.",
          ru: "Отсортировать список один раз, а на каждый вопрос циклом складывать первые k цен.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Тізімді бір рет реттеп, префикс кестені бір рет толтырып, әр сұраққа p[k] мәнін бір қараумен алу.",
          ru: "Отсортировать список один раз, один раз заполнить префиксную таблицу и на каждый вопрос брать значение p[k] одним обращением.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Реттемей-ақ, префикс кестені бастапқы тізім бойынша бір рет толтырып, әр сұраққа p[k] мәнін бір қараумен алу.",
          ru: "Не сортируя, один раз заполнить префиксную таблицу по исходному списку и на каждый вопрос брать значение p[k] одним обращением.",
        },
      },
    ],
    correctOptionId: "o3",
    diagnosticMapping: {
      o4: {
        failureClass: "prefix_table_built_over_an_unsorted_list",
        justification:
          "o4 жоспары шынымен жылдам — қадам саны бойынша ол дұрыс жауаптан еш айырмасы жоқ, сондықтан оны баяулығына бола таңдау мүмкін емес. Оны таңдаудың жалғыз себебі: жоспарды тек жылдамдығы бойынша бағалап, кестенің мағынасы реттелген тізімде ғана пайда болатынын ұмыту. Реттелмеген тізімде p[k] — тізімде бірінші жазылған k тауардың бағасы, ал сұрақ ең арзан k тауар туралы.",
      },
    },
  },
  {
    /*
     * The cheapest possible check that the table was built over the RIGHT list,
     * and it is placed before any task needs it. Both mapped options are
     * single-cause: "50 100" can only come from summing `a`, and "10 10" only
     * from believing `sorted(a)` reordered `a` itself.
     *
     * "60 100" is left unmapped — reading p[2] as "the sum of the first three"
     * and counting the table from 1 both produce it.
     */
    id: "m4.l6.b3",
    type: "prediction",
    skillRefs: ["precompute.prefix", "sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Кесте қай тізім бойынша толтырылып жатқанын әр жолда өзіңе айтып отыр. Бағдарлама экранға нені шығарады?",
      ru: "На каждой строке проговаривай себе, по какому именно списку заполняется таблица. Что программа выведет на экран?",
    },
    code:
      "a = [40, 10, 30, 20]\n" +
      "n = len(a)\n" +
      "b = sorted(a)\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + b[i - 1]\n" +
      "print(p[2], p[4])\n" +
      "print(a[0], b[0])",
    answer: "30 100\n40 10",
    options: ["30 100\n40 10", "50 100\n40 10", "30 100\n10 10", "60 100\n40 10"],
    diagnosticMapping: {
      "50 100\n40 10": {
        failureClass: "prefix_table_built_over_an_unsorted_list",
        justification:
          "50 — бұл 40 + 10, яғни бастапқы `a` тізімінің алғашқы екі элементі. Бұл санның шығуының жалғыз жолы бар: кестені `b` емес, `a` бойынша толтыру. Екінші жол дұрыс жазылған, демек оқушы `a` мен `b`-ның басқа-басқа тізім екенін біледі — тек циклдің ішінде қайсысы қосылып жатқанын оқымаған.",
      },
      "30 100\n10 10": {
        failureClass: "sorted_mistaken_for_in_place",
        justification:
          "Бірінші жол дұрыс, демек кесте реттелген тізім бойынша толтырылғаны түсінікті. Ал екінші жолда a[0] орнына 10 шығуының жалғыз себебі бар: `sorted(a)` `a` тізімінің өзін де қайта реттеді деп ойлау. Шын мәнінде `sorted` тек жаңа тізім жасайды, `a` бұрынғы күйінде — оның бірінші элементі 40 болып қалады.",
      },
    },
  },
  {
    /*
     * The month's own device («бір есептің екі шешімін салыстыру») applied to
     * the learner's own hands: the program on the card is CORRECT and the edit
     * must not move a single answer. All seven cases are checked against both
     * programs before shipping, and they agree on every one.
     *
     * The question is the k LARGEST, not the k cheapest, so the index the
     * learner has to reach is `p[n] - p[n - k]` and not `p[k]`. That matters
     * twice: it is a different move from b1's, and it stops b6 from being this
     * block with the loop already deleted.
     *
     * k = 0 is in the cases because the empty sum is where a table without its
     * leading zero, or a `p[n - k]` written as `p[n - k - 1]`, falls over.
     */
    id: "m4.l6.b4",
    type: "modify_code",
    skillRefs: ["precompute.prefix", "perf.compare_solutions", "sort.basic", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама дұрыс жауап береді, бірақ баяу. Бірінші жолда n (1 ≤ n ≤ 200 000), екінші жолда n бүтін ұпай, үшінші жолда сұрақтар саны q (1 ≤ q ≤ 200 000), одан кейін q жол, әрқайсысында бір k саны (0 ≤ k ≤ n). Әр сұрақ үшін ЕҢ ЖОҒАРЫ k ұпайдың қосындысы жеке жолға шығады. Қазіргі нұсқада ішкі цикл әр сұрақ сайын k қадам жасайды, ал ең жаман жағдайда бұл 200 000 × 200 000 = 4·10^10 қадам — секундына он миллион қадам жасайтын компьютер үшін мүлде мүмкін емес. Ішкі циклді алып таста, оның орнына сұрақтар басталғанға дейін БІР рет толтырылатын префикс кестені қой. Шығатын жауаптар өзгермеуі керек.",
      ru: "Эта программа отвечает правильно, но медленно. В первой строке n (1 ≤ n ≤ 200 000), во второй n целых баллов, в третьей количество вопросов q (1 ≤ q ≤ 200 000), далее q строк, в каждой одно число k (0 ≤ k ≤ n). Для каждого вопроса выводится сумма k НАИБОЛЬШИХ баллов, каждый ответ с новой строки. Сейчас внутренний цикл делает k шагов на каждый вопрос, а в худшем случае это 200 000 × 200 000 = 4·10^10 шагов — для компьютера, делающего десять миллионов шагов в секунду, это недостижимо. Убери внутренний цикл и поставь вместо него префиксную таблицу, заполняемую ОДИН раз до начала вопросов. Выводимые ответы измениться не должны.",
    },
    code:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    k = int(input())\n" +
      "    s = 0\n" +
      "    for i in range(n - k, n):\n" +
      "        s = s + a[i]\n" +
      "    print(s)",
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    k = int(input())\n" +
      "    print(p[n] - p[n - k])",
    cases: [
      { input: "5\n70 20 50 10 40\n3\n1\n2\n5", expectedOutput: "70\n120\n190" },
      { input: "1\n8\n2\n0\n1", expectedOutput: "0\n8" },
      /* Already sorted, every k in turn: kills `p[n] - p[k]`, which would answer
         9, 7, 4, 0 here instead of 4, 7, 9, 10. */
      { input: "4\n1 2 3 4\n4\n1\n2\n3\n4", expectedOutput: "4\n7\n9\n10", hidden: true },
      /* All equal plus k = 0: the empty sum has to be 0 and not a[n - 1]. */
      { input: "6\n5 5 5 5 5 5\n2\n0\n3", expectedOutput: "0\n15", hidden: true },
      /* Fully reversed input: kills a solution that dropped the sort along with
         the inner loop. */
      { input: "4\n4 3 2 1\n2\n2\n4", expectedOutput: "7\n10", hidden: true },
      { input: "3\n1000000000 1000000000 1000000000\n1\n3", expectedOutput: "3000000000", hidden: true },
      /* Zeros around a single large value: a solution that took the k largest
         from the FRONT of the sorted list answers 0 and 0 here. */
      { input: "5\n0 0 0 10 0\n2\n1\n2", expectedOutput: "10\n10", hidden: true },
    ],
  },
  {
    /*
     * The lesson's own failure mode, made concrete: the program sorts into `b`,
     * then fills the table out of `a`. Nothing else is wrong, and the last line
     * — which reads `b` and is right — is named in the prompt as evidence that
     * the ordering itself worked. That sentence is what makes line 6 the ONLY
     * defensible answer: without it, "the sort is on the wrong line" is a second
     * reading, and m4.l5.b7 set the precedent of naming the given lines rather
     * than letting a block have two right answers.
     *
     * The question is the AVERAGE of the k cheapest, which is asked in no task
     * in this lesson, so the repaired program is not an answer to b6 or b7.
     *
     * No diagnosticMapping. Line 10 is reachable both from "the error is where
     * the wrong number appeared" and from "the integer division is wrong", and
     * line 3 only by ignoring a sentence in the prompt — neither is a single
     * identifiable cause.
     */
    id: "m4.l6.b5",
    type: "find_bug",
    skillRefs: ["precompute.prefix", "sort.basic", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама әр сұрақ үшін ең арзан k тауардың ОРТАША бағасын бүтін бөлікпен шығаруы керек, ал ең соңғы жолда ең арзан және ең қымбат бағаны шығарады. Енгізу: `5`, содан кейін `70 20 50 10 40`, содан кейін `2`, `1` және `3`. Күтілетін жауап: `10`, `23`, `10 70`. Ал бағдарлама `70`, `46`, `10 70` шығарады. Соңғы жол дұрыс, демек реттеудің өзі жұмыс істеп тұр — қате одан төмен емес, жоғары жақта. Қате қай жолда?",
      ru: "Программа должна для каждого вопроса выводить СРЕДНЮЮ цену k самых дешёвых товаров, с целой частью, а в самой последней строке — самую низкую и самую высокую цену. Ввод: `5`, затем `70 20 50 10 40`, затем `2`, `1` и `3`. Ожидаемый ответ: `10`, `23`, `10 70`. А программа выводит `70`, `46`, `10 70`. Последняя строка верна, значит, сама сортировка работает — ошибка не ниже неё, а выше. В какой строке ошибка?",
    },
    code:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "b = sorted(a)\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    k = int(input())\n" +
      "    print(p[k] // k)\n" +
      "print(b[0], b[n - 1])",
    buggyLine: 6,
    symptomInput: "5\n70 20 50 10 40\n2\n1\n3",
    fixedCode:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "b = sorted(a)\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + b[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    k = int(input())\n" +
      "    print(p[k] // k)\n" +
      "print(b[0], b[n - 1])",
  },
  {
    /*
     * PDF p.8 joins two of the month's families here — «сандарды реттеу» and
     * «тізім бөлігінің қосындысы туралы көп сұраққа тез жауап беру» — and this
     * is the smallest task that needs both. Kept for all three tracks: the
     * support route writes this one and gets b7s instead of b7.
     *
     * k = 0 is legal and is in three cases, because `p[0] = 0` is the part of
     * the convention a learner is most likely to drop when they build the table
     * with a loop of their own.
     */
    id: "m4.l6.b6",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: ["sort.basic", "precompute.prefix", "loops.accumulator", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 200 000). Екінші жолда n бүтін баға, әрқайсысы 1-ден 1 000 000 000-ға дейін. Үшінші жолда сұрақтар саны q (1 ≤ q ≤ 200 000). Одан кейін q жол, әр жолда бір k саны (0 ≤ k ≤ n). Әр сұрақ үшін ең арзан k тауардың жалпы бағасын жеке жолға шығар; k = 0 болса, жауап 0. Әр сұрақ сайын тізімді қайта аралауға уақыт жетпейді — бұл ең жаман жағдайда 4·10^10 қадам. Бір рет реттеп, префикс кестені бір рет толтыр да, әр жауапты бір қараумен ал.",
      ru: "В первой строке число n (1 ≤ n ≤ 200 000). Во второй строке n целых цен, каждая от 1 до 1 000 000 000. В третьей строке количество вопросов q (1 ≤ q ≤ 200 000). Далее q строк, в каждой одно число k (0 ≤ k ≤ n). Для каждого вопроса выведи общую стоимость k самых дешёвых товаров, каждый ответ с новой строки; при k = 0 ответ равен 0. Проходить список заново на каждый вопрос времени не хватит — в худшем случае это 4·10^10 шагов. Отсортируй один раз, один раз заполни префиксную таблицу и бери каждый ответ одним обращением.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    k = int(input())\n" +
      "    print(p[k])",
    cases: [
      { input: "5\n70 20 50 10 40\n3\n1\n3\n5", expectedOutput: "10\n70\n190" },
      { input: "1\n7\n2\n0\n1", expectedOutput: "0\n7" },
      /* k = 0 and k = n on an all-equal list: the two ends of the table. */
      { input: "6\n5 5 5 5 5 5\n2\n0\n6", expectedOutput: "0\n30", hidden: true },
      /* Already sorted, every k: kills `p[n] - p[n - k]`, the k LARGEST, which
         would answer 4, 7, 9, 10 here. */
      { input: "4\n1 2 3 4\n4\n1\n2\n3\n4", expectedOutput: "1\n3\n6\n10", hidden: true },
      /* Fully reversed: kills a solution that never sorted at all. */
      { input: "4\n4 3 2 1\n2\n2\n4", expectedOutput: "3\n10", hidden: true },
      { input: "3\n1000000000 1000000000 1000000000\n1\n3", expectedOutput: "3000000000", hidden: true },
      /* Two elements, k = 0, 1, 2 in order: the cheapest is the SECOND number
         as typed, so a table built before the sort answers 0, 10, 12. */
      { input: "2\n10 2\n3\n0\n1\n2", expectedOutput: "0\n2\n12", hidden: true },
    ],
  },
  {
    /*
     * The second combined task, and deliberately a two-sided one: the answer is
     * `p[n - m] - p[m]`, so the learner has to reach into the table from BOTH
     * ends of the sorted list rather than from the front only. Trimmed judging
     * is the real reason the operation exists, which is why the story is not a
     * shop again.
     *
     * The statement guarantees 2·m < n, so at least one score always survives
     * and the empty-range decision is not asked here — that is b8's job, and
     * splitting them keeps this block about the indices.
     *
     * m = 0 is in the cases: the untrimmed total is `p[n] - p[0]`, which is
     * where a missing leading zero shows up.
     */
    id: "m4.l6.b7",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "write_code",
    skillRefs: ["sort.basic", "precompute.prefix", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Байқауда n қазылық қатысушыға ұпай қойды. Бірінші жолда n (1 ≤ n ≤ 200 000), екінші жолда n бүтін ұпай, әрқайсысы 0-ден 1 000 000 000-ға дейін. Үшінші жолда сұрақтар саны q (1 ≤ q ≤ 200 000), одан кейін q жол, әр жолда бір m саны (0 ≤ m, әрі 2·m < n). Ұйымдастырушылар әр сұрақта былай сұрайды: ең ТӨМЕН m ұпайды және ең ЖОҒАРЫ m ұпайды алып тастасақ, қалғандарының қосындысы қанша? Әр жауапты жеке жолға шығар. 2·m < n болғандықтан кемінде бір ұпай әрқашан қалады. Әр сұрақ сайын қайта санауға уақыт жетпейді: бір рет реттеп, префикс кестені бір рет толтыр.",
      ru: "На конкурсе n судей выставили участнику баллы. В первой строке n (1 ≤ n ≤ 200 000), во второй n целых баллов, каждый от 0 до 1 000 000 000. В третьей строке количество вопросов q (1 ≤ q ≤ 200 000), далее q строк, в каждой одно число m (0 ≤ m и 2·m < n). В каждом вопросе организаторы спрашивают: если убрать m самых НИЗКИХ баллов и m самых ВЫСОКИХ, чему равна сумма оставшихся? Выведи каждый ответ с новой строки. Так как 2·m < n, хотя бы один балл всегда остаётся. Пересчитывать заново на каждый вопрос времени не хватит: отсортируй один раз и один раз заполни префиксную таблицу.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    m = int(input())\n" +
      "    print(p[n - m] - p[m])",
    cases: [
      { input: "5\n70 20 50 10 40\n3\n0\n1\n2", expectedOutput: "190\n110\n40" },
      { input: "1\n9\n1\n0", expectedOutput: "9" },
      /* Repeated values at both ends: 1 appears twice and is also the minimum.
         A solution that trims by VALUE — drop every copy of the m smallest and
         m largest values — answers 25, 14, 0 here instead of 25, 15, 3. The
         statement asks for m POSITIONS, and this is the only case that can tell
         the two readings apart. */
      { input: "7\n3 1 4 1 5 9 2\n3\n0\n1\n3", expectedOutput: "25\n15\n3", hidden: true },
      /* Every score equal: trimming must still remove exactly 2m of them. */
      { input: "3\n5 5 5\n2\n0\n1", expectedOutput: "15\n5", hidden: true },
      { input: "4\n1 2 3 4\n2\n0\n1", expectedOutput: "10\n5", hidden: true },
      /* Every value duplicated and the two ends a hundred apart, so a
         one-position slip is visible in the answer rather than lost in a tie:
         `p[n - m] - p[m - 1]` answers 202 at m = 1 and `p[n - m + 1] - p[m]`
         answers 301, against the correct 201. */
      { input: "6\n100 1 100 1 50 50\n2\n1\n2", expectedOutput: "201\n100", hidden: true },
      /* 2·m = n - 1, the tightest legal trim: exactly one score survives. */
      { input: "5\n1 2 3 4 5\n1\n2", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b7 — same problem, same statement, same cases.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ».
     *
     * The starting program trims only the m LOWEST scores, which is a coherent
     * question with a coherent answer and is not the one being asked. So it
     * cannot be left alone — every case here has an m > 0 on which it is wrong —
     * and what is left to decide is exactly the half b7 is about: where the
     * upper end of the range lands after m scores are dropped from the top.
     *
     * Nothing visible on any card in this lesson is that program: b1 hard-codes
     * its list and has no query loop, b4's shown program has an inner loop and
     * no table at all, and b5's has `b = sorted(a)` and prints an average.
     */
    id: "m4.l6.b7s",
    type: "modify_code",
    skillRefs: ["sort.basic", "precompute.prefix", "lists.index", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама ең ТӨМЕН m ұпайды ғана алып тастайды да, қалғандарының қосындысын шығарады. Оны ең төмен m ұпаймен қатар ең ЖОҒАРЫ m ұпайды да алып тастайтындай өзгерт. Реттеу мен префикс кесте дайын, өзгертетін жер — соңғы жолдағы индекстер. Енгізу пішімі сол күйінде: бірінші жолда n, екінші жолда n ұпай, үшінші жолда сұрақтар саны q, одан кейін q жол, әрқайсысында бір m саны (0 ≤ m, әрі 2·m < n). Әр жауап жеке жолға шығады.",
      ru: "Эта программа убирает только m самых НИЗКИХ баллов и выводит сумму оставшихся. Измени её так, чтобы вместе с m самыми низкими убирались и m самых ВЫСОКИХ. Сортировка и префиксная таблица уже готовы, менять надо индексы в последней строке. Формат ввода прежний: в первой строке n, во второй n баллов, в третьей количество вопросов q, далее q строк, в каждой одно число m (0 ≤ m и 2·m < n). Каждый ответ выводится с новой строки.",
    },
    code:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    m = int(input())\n" +
      "    print(p[n] - p[m])",
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    m = int(input())\n" +
      "    print(p[n - m] - p[m])",
    cases: [
      { input: "5\n70 20 50 10 40\n3\n0\n1\n2", expectedOutput: "190\n110\n40" },
      { input: "7\n3 1 4 1 5 9 2\n3\n0\n1\n3", expectedOutput: "25\n15\n3" },
      { input: "3\n5 5 5\n2\n0\n1", expectedOutput: "15\n5", hidden: true },
      { input: "6\n100 1 100 1 50 50\n2\n1\n2", expectedOutput: "201\n100", hidden: true },
      { input: "5\n1 2 3 4 5\n1\n2", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * The synthesis task: sorting, a table, and a boundary the statement makes
     * the learner decide. Both halves of the answer come out of one table read
     * from opposite ends — `p[n] - p[n - k]` for the k largest and `p[k]` for
     * the k smallest — and the two groups stop being disjoint the moment
     * 2·k > n.
     *
     * The boundary is `>` and not `>=`, and the prompt says so in both
     * languages with the equality case spelled out, because 2·k = n is exactly
     * where the two groups still fit and a learner guessing gets it wrong half
     * the time. The all-fives case is n = 6 with k = 3 and answers 0, not
     * `overlap`; a solution written with `>=` fails it.
     *
     * `overlap` is an English token and both prompts name it.
     */
    id: "m4.l6.b8",
    /* `exact`, because the prompt promises a layout — «жеке жолда» — and the
       default `token` checker tokenises on whitespace, so a program printing
       every answer on one line passed a task that told the learner not to.
       Verified: the reference passes every case unchanged under `exact`. */
    checker: { kind: "exact" },
    type: "challenge",
    skillRefs: ["sort.basic", "precompute.prefix", "debug.boundary", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Дүкенде n тауар бар. Бірінші жолда n (1 ≤ n ≤ 200 000), екінші жолда n бүтін баға, әрқайсысы 1-ден 1 000 000 000-ға дейін. Үшінші жолда сұрақтар саны q (1 ≤ q ≤ 200 000), одан кейін q жол, әр жолда бір k саны (0 ≤ k ≤ n). Әр сұрақ үшін ең ҚЫМБАТ k тауардың жалпы бағасы ең АРЗАН k тауардың жалпы бағасынан қанша артық екенін жеке жолға шығар. Егер бұл екі топ қиылысатын болса, яғни 2·k > n болса, санның орнына ағылшынша `overlap` сөзін шығар. Назар сал: 2·k = n болғанда топтар әлі қиылыспайды — ол жағдайда әдеттегі санды шығару керек. Екі топтың да қосындысы бір ғана префикс кестеден алынады, кесте бір рет толтырылады.",
      ru: "В магазине n товаров. В первой строке n (1 ≤ n ≤ 200 000), во второй n целых цен, каждая от 1 до 1 000 000 000. В третьей строке количество вопросов q (1 ≤ q ≤ 200 000), далее q строк, в каждой одно число k (0 ≤ k ≤ n). Для каждого вопроса выведи с новой строки, насколько общая стоимость k самых ДОРОГИХ товаров больше общей стоимости k самых ДЕШЁВЫХ. Если эти две группы пересекаются, то есть 2·k > n, вместо числа выведи английское слово `overlap`. Обрати внимание: при 2·k = n группы ещё не пересекаются — там нужно вывести обычное число. Суммы обеих групп берутся из одной и той же префиксной таблицы, заполняемой один раз.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "p = [0] * (n + 1)\n" +
      "for i in range(1, n + 1):\n" +
      "    p[i] = p[i - 1] + a[i - 1]\n" +
      "q = int(input())\n" +
      "for j in range(q):\n" +
      "    k = int(input())\n" +
      "    if 2 * k > n:\n" +
      '        print("overlap")\n' +
      "    else:\n" +
      "        print(p[n] - p[n - k] - p[k])",
    cases: [
      { input: "5\n70 20 50 10 40\n3\n1\n2\n3", expectedOutput: "60\n90\noverlap" },
      { input: "4\n1 2 3 4\n3\n0\n2\n3", expectedOutput: "0\n4\noverlap" },
      /* n = 1: k = 0 is a number, k = 1 already overlaps. */
      { input: "1\n5\n2\n0\n1", expectedOutput: "0\noverlap", hidden: true },
      /* 2·k = n exactly, twice: a solution written with `>=` prints overlap here
         and fails. Both answers are 0 because every price is equal. */
      { input: "6\n5 5 5 5 5 5\n2\n3\n2", expectedOutput: "0\n0", hidden: true },
      /* Two items a billion apart: kills a solution that subtracts in the wrong
         direction, which answers -999999999. */
      { input: "2\n1000000000 1\n2\n1\n2", expectedOutput: "999999999\noverlap", hidden: true },
      /* Odd n with duplicates at the bottom: k = 3 is legal (6 < 7), k = 4 is
         not. Kills `p[n] - p[n - k] - p[k - 1]`, which answers 9 at k = 1 and
         16 at k = 3 against the correct 8 and 14. */
      { input: "7\n3 1 4 1 5 9 2\n3\n1\n3\n4", expectedOutput: "8\n14\noverlap", hidden: true },
      { input: "5\n1 2 3 4 5\n1\n2", expectedOutput: "6", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED ONLY. PDF p.6: «шешімді жазбаша қорғау міндетті», and PDF p.8's
     * December sentence: «Шартты алған соң кодқа отырмас бұрын қай шешім уақыт
     * бойынша үлгеретінін айтып, таңдауын негіздейді.»
     *
     * No O() is asked for and none is accepted as an answer on its own — the
     * programme never introduces the notation, and a learner who writes O(n log
     * n) has named a solution rather than defended one. What is asked for is a
     * count and a reason.
     *
     * The third question is the one that separates this from m4.l1's step
     * counting: it is about CORRECTNESS, not speed. A defence that only prices
     * the plan has not explained why reordering the prices leaves the answer
     * alone, and that is the claim the whole lesson rests on.
     *
     * Unmeasured by design: it settles as `unknown` and a teacher reads it.
     */
    id: "m4.l6.b9",
    type: "explain",
    skillRefs: ["perf.compare_solutions", "perf.time_estimate", "precompute.prefix", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Осы сабақта жазған шешіміңді жазбаша қорға. Үш сұраққа жауап бер. O(...) белгісін қолданудың қажеті жоқ — қадамдарды сөзбен айт және санын жаз. (1) Егер әр сұраққа жауапты циклмен қайта санасаң, n = 200 000 және q = 200 000 болғанда барлығы шамамен қанша қадам болар еді және неге бұл секундына он миллион қадам жасайтын компьютерге сыймайды? (2) Сенің шешіміңде реттеу мен кестені толтыру неше рет орындалады, ал бір сұраққа қанша қадам кетеді? Бәрін қосқанда шамамен қанша шығады? (3) Реттегеннен кейін p[k] неге дәл ең арзан k тауардың қосындысы болады — тізімнің ретін өзгерту жауапты неге бұзбайды?",
      ru: "Письменно защити решение, которое ты написал на этом уроке. Ответь на три вопроса. Пользоваться значком O(...) не нужно — назови шаги словами и укажи их количество. (1) Если пересчитывать ответ циклом на каждый вопрос, сколько примерно шагов получится при n = 200 000 и q = 200 000 и почему это не помещается в компьютер, делающий десять миллионов шагов в секунду? (2) Сколько раз в твоём решении выполняется сортировка и сколько раз заполняется таблица, а сколько шагов уходит на один вопрос? Сколько получается всего? (3) Почему после сортировки p[k] — это ровно сумма k самых дешёвых товаров и почему перестановка списка не портит ответ?",
    },
    expectedPoints: [
      {
        kk: "Баяу жоспарда бір сұрақ k қадамға дейін жұмыс істейді, ал k n-ге тең болуы мүмкін. Сұрақ саны q болғандықтан қадамдар қосылмайды, көбейтіледі: 200 000 × 200 000 = 4·10^10. Он миллион қадам бір секунд болса, бұл шамамен төрт мың секунд, яғни бір сағаттан астам — ешқандай уақыт шектеуіне сыймайды.",
        ru: "В медленном плане один вопрос работает до k шагов, а k может быть равно n. Так как вопросов q, шаги не складываются, а умножаются: 200 000 × 200 000 = 4·10^10. Если десять миллионов шагов — это секунда, то получается около четырёх тысяч секунд, больше часа, — ни в какое ограничение это не укладывается.",
      },
      {
        kk: "Жылдам жоспарда реттеу де, кестені толтыру да сұрақтар басталғанға дейін бір-ақ рет жасалады. Кестені толтыру — дәл n қадам. Реттеу одан біраз қымбат, бірақ ол да сұрақтар санына тәуелсіз және n = 200 000 үшін секундтың кішкене бөлігін алады.",
        ru: "В быстром плане и сортировка, и заполнение таблицы делаются ровно один раз, до начала вопросов. Заполнение таблицы — это ровно n шагов. Сортировка дороже, но она тоже не зависит от количества вопросов и при n = 200 000 занимает малую долю секунды.",
      },
      {
        kk: "Кесте дайын болғаннан кейін бір сұраққа кететін жұмыс тұрақты: бір-екі оқу және бір азайту. k қаншалықты үлкен болса да, қадам саны өспейді. Демек барлық сұрақтарға кететін жұмыс шамамен q қадам, ал бүкіл бағдарлама n + q, яғни 400 000 шамасында — он миллионнан әлдеқайда аз, сондықтан үлгереді.",
        ru: "Когда таблица готова, работа на один вопрос постоянна: одно-два обращения и одно вычитание. Насколько бы большим ни было k, число шагов не растёт. Значит, на все вопросы уходит примерно q шагов, а на всю программу — n + q, то есть около 400 000, что намного меньше десяти миллионов, поэтому решение укладывается.",
      },
      {
        kk: "Дұрыстығы: реттеуден кейін тізім өсу ретімен тұрады, сондықтан алғашқы k орында дәл ең кіші k баға тұрады — олардың арасында да, сыртында да одан кіші баға жоқ. Ал p[k] анықтамасы бойынша алғашқы k элементтің қосындысы, демек ол дәл ең арзан k тауардың қосындысы.",
        ru: "Про правильность: после сортировки список идёт по возрастанию, поэтому на первых k местах стоят ровно k наименьших цен — меньшей цены нет ни среди них, ни за их пределами. А p[k] по определению есть сумма первых k элементов, значит, это и есть сумма k самых дешёвых товаров.",
      },
      {
        kk: "Реттеу жауапты бұзбайды, өйткені сұрақта тауарлардың реті мүлде айтылмаған: сұралатыны — қосынды, ал қосынды қосылғыштардың ретіне тәуелді емес. Реттеу тек іздеуді жеңілдетеді, деректі өзгертпейді. Ал егер есепте тауарлардың бастапқы реті маңызды болса (мысалы, «тізімдегі бірінші k тауар»), онда реттеуге болмас еді — сондықтан кестені реттелген тізім бойынша толтыру да, толтырмау да есептің шартына қарай шешіледі.",
        ru: "Сортировка не портит ответ, потому что в вопросе порядок товаров вообще не участвует: спрашивают сумму, а сумма не зависит от порядка слагаемых. Сортировка лишь упрощает поиск, но не меняет сами данные. А вот если бы в задаче был важен исходный порядок (например, «первые k товаров списка»), сортировать было бы нельзя — поэтому строить таблицу по отсортированному списку или нет, решает условие задачи.",
      },
    ],
  },
];
