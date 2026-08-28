import type { LessonBlock } from "../../types";

/**
 * Month 4 · Желтоқсан — the monthly check. Twenty minutes. PDF p.8.
 *
 * December's «Айлық сынақ» sentence is one sentence, and its grammar is the
 * whole specification:
 *
 *   > Шартты алған соң кодқа отырмас бұрын қай шешім уақыт бойынша үлгеретінін
 *   > айтып, таңдауын негіздейді.
 *
 * «Кодқа отырмас бұрын» — *before* sitting down to code. The order is not a
 * suggestion about study habits, it is the thing being assessed: a learner who
 * writes the program first and explains afterwards has not done this check,
 * they have done November's. So the four blocks run in the order the sentence
 * gives them, and the first two are answered with no editor on screen:
 *
 *   b1  the statement, two plans, one verdict          — «қай шешім үлгереді»
 *   b2  the arithmetic behind the verdict, written     — «таңдауын негіздейді»
 *   b3  now write it                                   — p.6, «бейтаныс есептер»
 *   b4  why yours is fast, what breaks the other one   — p.6, «ауызша түсіндіру»
 *
 * Twenty minutes: b1 is under two, b2 is about four, b3 is the ten-to-twelve
 * minute piece, and b4 runs alongside while the teacher walks the room.
 * September's check was audited at 32+ minutes against a stated 20 because it
 * carried two coding problems; there is one here, and it is deliberately small.
 *
 * ## Why both plans are correct
 *
 * The hardest thing to get right in a «үлгере ме?» question is that it must not
 * secretly be a correctness question. If one option is a wrong program, the
 * learner can pick the right answer by spotting the bug and never think about
 * time at all, and the block then reports evidence about `debug.boundary` while
 * claiming to measure `perf.time_estimate`.
 *
 * So plan A and plan B in b1 both produce the same number on every input. They
 * differ only in cost — k full scans against one ordering — and the verdict
 * turns on nothing else. Plan A is not a straw man either: «k рет ең кішісін
 * тауып ал» is exactly what a learner writes before December, and it is the
 * honest generalisation of October's minimum-by-traversal.
 *
 * ## The two numbers the check hands over, and why
 *
 * `m4.l1` installs one figure for the whole month — 10⁷ to 10⁸ simple steps per
 * second — and every judgement block in the month is built so the verdict holds
 * at both ends of that range. Kept here: plan A is 2 · 10¹⁰, which fails by two
 * orders of magnitude at the optimistic end; plan B is under 4.2 · 10⁶, which
 * finishes in under half a second at the pessimistic end. Nothing in this check
 * depends on guessing where inside the range the machine sits.
 *
 * The second figure is new and is *stated in the task* rather than assumed:
 * ordering 200 000 numbers costs roughly 4 000 000 steps. The course never
 * writes n·log n and never will — the programme does not — so the cost of
 * sorting cannot be derived by a Grade 9 from anything they have been taught.
 * It is therefore given as an assumption of this task, the way `m4.l1.b7` gives
 * its per-second budget inside its own prompt. What the learner is asked to do
 * with it is arithmetic they can check: about twenty steps per number, against
 * plan A's hundred thousand scans.
 *
 * ## Why this problem, when the month has already sorted six lists
 *
 * The check has to be unseen, and December's lessons have taken most of the
 * obvious ground: ordering and printing, the third largest by index, the third
 * DISTINCT largest, the smallest adjacent gap, the count of distinct values,
 * the most frequent value, prefix sums and segment queries. Re-dressing any of
 * those is a memory test.
 *
 * What is new here is the *cut*: the k smallest are removed and everything
 * after them is kept. That makes the sorted list a boundary rather than a
 * lookup, and it makes duplicates matter in a way none of the lessons needed —
 * `5 5 5 7` with k = 2 drops two of the three fives, not all values equal to
 * the second smallest. A learner who reaches for "throw away every value equal
 * to the k-th" gets 7 instead of 12. That is the case the block exists for, and
 * it is the reason the statement says out loud that exactly k rounds are
 * dropped, ties included. An unfair hidden case is not a hard hidden case.
 *
 * The scores are allowed to be negative — a round can carry a penalty — which
 * costs nothing to state and kills the accumulator initialised to zero and
 * guarded with `if x > 0`.
 *
 * ## The cases, and the wrong program each one kills
 *
 * Ten cases, nine hidden. Every one was executed against the mutant it exists
 * for before it was written down:
 *
 *   · no sort at all                          → the visible sample answers 17
 *   · drops the k LARGEST                     → the visible sample answers 5
 *   · prints the sum of the k dropped rounds  → the visible sample answers 0
 *   · `range(k + 1, n)` / `range(k - 1, n)`   → the visible sample answers 16 / 24
 *   · drops by value, not by count            → «5 5 5 7» k=2 answers 7, «2 2 2 2 9 1 1» k=3 answers 9
 *   · drops by absolute value                 → «1000 -1000 0» k=1 answers 0
 *   · `range(k, n - 1)`, one short            → «1 0 / -5» answers 0
 *   · indexes `a[k]` when nothing remains     → «1 1» crashes instead of printing 0
 *   · counts only positive scores             → «-8 -8 -8 -8 -8» k=4 answers 0
 *
 * n = 1 appears twice on purpose, once with k = 0 and once with k = 1: the same
 * shortest input is both "nothing is dropped" and "everything is dropped", and
 * the second is where a solution that assumes at least one round survives falls
 * over. k = n and k = 0 are the problem's own two edges and both are covered at
 * n = 6 as well, where an off-by-one has room to show.
 *
 * ## Provenance and tracks
 *
 * September's convention, kept. b1 and b2 implement December's own «Айлық
 * сынақ» sentence and cite page 8; b3 and b4 implement two of the five general
 * verification methods of page 6 — «бейтаныс есептер» and «ауызша түсіндіру» —
 * and cite page 6.
 *
 * No block carries `tracks`. The monthly check is the same twenty minutes for
 * every route: differentiation is in how the month was taught and how early
 * help opened, not in whether a learner is assessed. Advanced's compulsory
 * written defence («шешімді жазбаша қорғау міндетті») is satisfied by the
 * month's lessons, which carry advanced-only blocks; b2 is written work for
 * everyone and does not stand in for it.
 *
 * Nothing here is machine-scored except b1 and b3's cases. b2 and b4 settle as
 * `unknown` and are read by a teacher against the points on the block.
 */
export const M4_ASSESSMENT: LessonBlock[] = [
  {
    /*
     * The judgement, and it deliberately shows no code.
     *
     * `m4.l2` is the month's side-by-side comparison of two PROGRAMS; this is
     * the same decision made one step earlier, from the statement and a plan
     * described in words, which is what «кодқа отырмас бұрын» actually means.
     * Putting two programs on this card would turn the check into a reading
     * exercise and would let a learner answer by counting `for` keywords — the
     * exact reflex `m4.l1.b5` exists to break.
     *
     * Every option carries a step count for BOTH plans, in the same shape, so
     * no option can be picked off by its formatting — the first draft of this
     * block put the arithmetic only in the correct answer, which let a learner
     * choose the longest line and be right. The count is now what distinguishes
     * the options, and it is also what makes two of them diagnostically clean:
     *
     *   o1 · 400 000 for plan A is reachable exactly one way — one pass for the
     *        sum plus one pass to find the minimum, with the k repetitions never
     *        multiplied in at all.
     *   o3 · 40 000 000 000 for plan B is reachable exactly one way — pricing
     *        the ordering at n × n, in place of the figure the prompt hands over.
     *
     * o4 is left unmapped on purpose, and it is the one that gets both counts
     * right and the verdict wrong. Inside the month that pattern is already
     * diagnosed — `m4.l1.b5` names it `time_budget_rule_not_applied` — but on an
     * assessment card, where a learner has four options and two minutes, it is
     * just as reachable by elimination. An assessment is the worst place to
     * attribute a cause on thin evidence: the pipeline emits
     * `unattributed_failure`, the engine asks, and nobody tells a fourteen-year-
     * old something false about their own mind on the strength of a guess.
     */
    id: "m4.as.b1",
    type: "multiple_choice",
    skillRefs: ["perf.time_estimate", "perf.compare_solutions", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Есептің шарты. Турнирде n раунд ойналды, әр раундта ойыншы ұпай жинады; ұпай теріс те болуы мүмкін. Қорытынды нәтижені шығарғанда ең нашар k раунд есептен шығарылады, ал қалған раундтардың ұпайлары қосылады. Шектеулер: n ең көбі 200 000, k нөл мен n аралығында, әр ұпай -1000 мен 1000 аралығында. Уақыт шегі — 1 секунд.\n" +
        "Кодқа отырмас бұрын екі жоспарды таразыла. Екеуі де дұрыс жауап береді — сұрақ тек уақыт туралы.\n" +
        "А жоспары. Алдымен барлық ұпайдың қосындысын тап. Содан кейін k рет мынаны қайтала: бүкіл тізімді басынан аяғына дейін қарап шығып, әлі сызылмаған ең кіші ұпайды тап, оны қосындыдан шығар да, сызып таста.\n" +
        "Б жоспары. Тізімді бір рет реттеп ал. Содан кейін реттелген тізімнің алғашқы k ұпайын аттап өтіп, қалғандарын қос.\n" +
        "Есептеу үшін екі шаманы қолдан: компьютер бір секундта 10 000 000-нан 100 000 000-ға дейін қарапайым қадам жасайды, ал 200 000 санды реттеу шамамен 4 000 000 қадам тұрады.\n" +
        "n = 200 000, k = 100 000 болғанда әр жоспар шамамен қанша қадам жасайды және қайсысы 1 секундке үлгереді?",
      ru:
        "Условие задачи. На турнире сыграно n раундов, в каждом игрок набрал очки; очки могут быть и отрицательными. При подведении итога k худших раундов не учитываются, а очки остальных раундов складываются. Ограничения: n не больше 200 000, k от нуля до n, каждое значение очков от -1000 до 1000. Ограничение по времени — 1 секунда.\n" +
        "Прежде чем сесть за код, взвесь два плана. Оба дают верный ответ — вопрос только во времени.\n" +
        "План А. Сначала найди сумму всех очков. Затем повтори k раз: пройди список целиком от начала до конца, найди наименьшее ещё не вычеркнутое значение, вычти его из суммы и вычеркни.\n" +
        "План Б. Отсортируй список один раз. Затем пропусти первые k значений отсортированного списка и сложи остальные.\n" +
        "Для подсчёта пользуйся двумя величинами: компьютер делает от 10 000 000 до 100 000 000 простых шагов в секунду, а сортировка 200 000 чисел стоит примерно 4 000 000 шагов.\n" +
        "Сколько примерно шагов сделает каждый план при n = 200 000 и k = 100 000 и какой из них уложится в 1 секунду?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "А ≈ 400 000 қадам, Б ≈ 4 100 000 қадам: екеуі де үлгереді, тіпті А жоспары жылдамырақ",
          ru: "А ≈ 400 000 шагов, Б ≈ 4 100 000 шагов: уложатся оба, и план А даже быстрее",
        },
      },
      {
        id: "o2",
        label: {
          kk: "А ≈ 20 000 000 000 қадам, Б ≈ 4 100 000 қадам: тек Б жоспары үлгереді",
          ru: "А ≈ 20 000 000 000 шагов, Б ≈ 4 100 000 шагов: уложится только план Б",
        },
      },
      {
        id: "o3",
        label: {
          kk: "А ≈ 20 000 000 000 қадам, Б ≈ 40 000 000 000 қадам: екеуі де үлгермейді",
          ru: "А ≈ 20 000 000 000 шагов, Б ≈ 40 000 000 000 шагов: не уложится ни один",
        },
      },
      {
        id: "o4",
        label: {
          kk: "А ≈ 20 000 000 000 қадам, Б ≈ 4 100 000 қадам: екеуі де үлгереді",
          ru: "А ≈ 20 000 000 000 шагов, Б ≈ 4 100 000 шагов: уложатся оба",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "repeat_count_read_as_constant",
        justification:
          "А жоспарына 400 000 қадам жазудың жалғыз жолы бар: қосындыға бір өту (200 000) және ең кішісін іздеуге тағы бір өту (200 000). Яғни «k рет қайтала» деген сөйлем мүлде көбейтілмеген. Шын мәнінде тізім k = 100 000 рет қаралады, ал қайталау саны тұрақты емес — ол шарттағы сандармен бірге өседі.",
      },
      o3: {
        failureClass: "sort_cost_overestimated",
        justification:
          "Б жоспарына 40 000 000 000 қадам жазудың жалғыз жолы — реттеудің бағасын n × n = 200 000 × 200 000 деп есептеу. Ал реттеудің бағасы шартта тікелей берілген: шамамен 4 000 000 қадам. Демек мұнда берілген шама қолданылмай, реттеу «бүкіл тізімді қайта құратын ең қымбат амал» деп болжанған. А жоспарының саны дұрыс табылған, сондықтан қате көбейту ережесінде емес, дәл реттеудің бағасында.",
      },
    },
  },
  {
    /*
     * «Таңдауын негіздейді», verbatim from p.8, and the justification is worth
     * more than the verdict: b1 has four options and a lucky guess is a
     * one-in-four event, whereas 20 000 000 000 does not appear on a page by
     * accident.
     *
     * Four numbered questions, four marking points, in the same order, so a
     * teacher reads down the page rather than hunting. Point 4 is the one that
     * separates a learner who applied a rule from one who understood it: plan A
     * is not a bad plan, it is a plan whose cost is written in the CONSTRAINTS,
     * and at k ≤ 500 it is perfectly acceptable. A learner who cannot name a k
     * at which the slow plan wins has learnt "nested is bad" and not much else.
     *
     * Written, stored, read by a teacher. `explain` settles as `unknown`.
     */
    id: "m4.as.b2",
    type: "explain",
    skillRefs: ["perf.time_estimate", "perf.compare_solutions"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk:
        "Бірінші тапсырмадағы таңдауыңды жазбаша негізде. Жауабыңды төрт нөмірленген тармақпен жаз.\n" +
        "(1) А жоспары n = 200 000, k = 100 000 үшін шамамен қанша қадам жасайды? Санды жаз және оның қайдан шыққанын көрсет.\n" +
        "(2) Б жоспары қанша қадам жасайды? Реттеудің бағасын және қосудың бағасын бөлек ата.\n" +
        "(3) Екі санды да секундтық шамамен салыстыр: қайсысы 1 секундке сыяды, қайсысы сыймайды? Айырма шамамен неше есе?\n" +
        "(4) Шекара қайда? n = 200 000 өзгермейді деп есепте: k мәні қандай болса, А жоспары да үлгеретін еді?",
      ru:
        "Письменно обоснуй свой выбор из первого задания. Ответ запиши четырьмя пронумерованными пунктами.\n" +
        "(1) Сколько примерно шагов сделает план А при n = 200 000 и k = 100 000? Напиши число и покажи, откуда оно взялось.\n" +
        "(2) Сколько шагов сделает план Б? Назови отдельно стоимость сортировки и стоимость сложения.\n" +
        "(3) Сравни оба числа с числом шагов в секунду: какое укладывается в 1 секунду, какое нет? Во сколько примерно раз разница?\n" +
        "(4) Где проходит граница? Считай, что n = 200 000 не меняется: при каком k план А тоже уложился бы?",
    },
    expectedPoints: [
      {
        kk: "А жоспарының саны есептелген: ең кіші ұпайды табу үшін тізімді толық қарап шығу керек, ол 200 000 қадам, және бұл k = 100 000 рет қайталанады. Демек 100 000 × 200 000 = 20 000 000 000 қадам. Басында бір рет есептелетін жалпы қосындының 200 000 қадамы бұл санның қасында мүлде байқалмайды — бағдарламаның уақытын оның ең қымбат бөлігі шешеді.",
        ru: "Посчитано число шагов плана А: чтобы найти наименьшее значение, список нужно пройти целиком — это 200 000 шагов, и повторяется это k = 100 000 раз. Значит, 100 000 × 200 000 = 20 000 000 000 шагов. Те 200 000 шагов, что уходят на подсчёт общей суммы в начале, рядом с этим числом просто не видны — время программы определяет её самая дорогая часть.",
      },
      {
        kk: "Б жоспарының екі бөлігі бөлек аталған: реттеу бір-ақ рет орындалады және шарт бойынша шамамен 4 000 000 қадам тұрады, ал одан кейінгі қосу — қалған 100 000 ұпайды бір рет қарап шығу. Барлығы 4 100 000-нан аспайды. Реттеудің бағасы әр санға жиырма шақты қадам болып шығады, яғни тізімге бір рет қарап шығудан бірнеше есе ғана қымбат.",
        ru: "Две части плана Б названы отдельно: сортировка выполняется один-единственный раз и по условию стоит примерно 4 000 000 шагов, а последующее сложение — это один проход по оставшимся 100 000 значениям. Всего не больше 4 100 000. Получается, что сортировка стоит около двадцати шагов на число, то есть всего в несколько раз дороже одного прохода по списку.",
      },
      {
        kk: "Екі сан да секундтық шамамен салыстырылған. Ең жақсы жағдайда секундына 100 000 000 қадам: 20 000 000 000 : 100 000 000 = 200, яғни А жоспарына кемінде екі жүз секунд керек, ал бізде бір секунд бар. Б жоспарының 4 100 000 қадамы ең баяу бағамен де (секундына 10 000 000) жарты секундтен аз. Айырма шамамен бес мың есе, сондықтан жауап секундтық шаманың қай шетін алсақ та өзгермейді.",
        ru: "Оба числа сопоставлены с числом шагов в секунду. В лучшем случае это 100 000 000 шагов: 20 000 000 000 : 100 000 000 = 200, то есть плану А нужно не меньше двухсот секунд, а у нас есть одна. А 4 100 000 шагов плана Б даже при самой медленной оценке (10 000 000 шагов в секунду) — меньше половины секунды. Разница примерно в пять тысяч раз, поэтому ответ не меняется, какой бы край оценки мы ни взяли.",
      },
      {
        kk: "Шекара аталған: А жоспары қате емес, ол тек осы өлшемде баяу. Оның бағасы k × 200 000, сондықтан ол 100 000 000 қадамға k шамамен 500-ге дейін болғанда ғана сыяды. Егер шартта k ең көбі 100 деп жазылса, А жоспарын жазуға әбден болар еді. Шешімнің жарамдылығын кодтың сыртқы түрі емес, шарттағы сандар шешеді.",
        ru: "Названа граница: план А не ошибочен, он просто медленный именно на этом размере. Его цена — k × 200 000, поэтому в 100 000 000 шагов он укладывается лишь примерно до k = 500. Если бы в условии стояло k не больше 100, план А был бы вполне пригоден. Годность решения определяет не внешний вид кода, а числа в условии.",
      },
    ],
  },
  {
    /*
     * «Бейтаныс есептер», p.6 — and now the editor opens. No starter: the
     * programme's word is «өз бетінше», and the plan the learner is about to
     * type is the one they already argued for two blocks ago.
     *
     * The statement carries three things it would be unfair to omit. The time
     * limit, because the whole check is about it. The tie rule — exactly k
     * rounds are dropped, equal scores included — because two hidden cases turn
     * on it and a hidden case that punishes a reading the statement permits is
     * not a test, it is a trap. And k = n, spelled out as "print 0", because
     * "the sum of nothing" is a genuine question at fourteen and the answer
     * belongs in the statement rather than in a stack trace.
     *
     * The reference is written the way a learner is expected to write it: sort
     * in place, then one loop from k to n - 1. `sum(a[k:])` is shorter, arrives
     * this month and passes every case; it is not what is defended here because
     * the explicit loop is the version whose step count b2 has just been asked
     * to justify.
     */
    id: "m4.as.b3",
    type: "verify",
    mode: "unseen_problem",
    skillRefs: ["sort.basic", "lists.traverse", "loops.for", "perf.time_estimate", "io.read", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Енді сол шешімді жаз.\n" +
        "Турнирде n раунд ойналды. Әр раундта ойыншы ұпай жинады; кейбір раундтарда ұпай теріс болуы мүмкін — бұл айыппұл. Қорытынды нәтижені шығарғанда ойыншының ең нашар k раунды есептен шығарылады, ал қалған раундтардың ұпайлары қосылады.\n" +
        "Есептен шығарылатын раундтардың саны әрқашан дәл k. Бірдей ұпайлы раундтар кездессе де, олардың бәрі емес, дәл қанша керек болса, сонша раунд қана алынып тасталады.\n" +
        "Кіріс. Бірінші жолда бос орынмен бөлінген екі бүтін сан: n және k, мұнда 1 ≤ n ≤ 200 000 және 0 ≤ k ≤ n. Екінші жолда бос орынмен бөлінген n бүтін сан — раундтардың ұпайлары, әрқайсысы -1000 мен 1000 аралығында.\n" +
        "Шығыс. Бір ғана сан: есептен шығарылмаған раундтардың ұпайларының қосындысы. k = n болса, бірде-бір раунд қалмайды — ондай жағдайда 0 шығар.\n" +
        "Мысал. `5 2` және `7 -3 9 3 5` берілсе, ұпайларды өсу ретімен қойғанда -3 3 5 7 9 болады; ең нашар екеуі, яғни -3 пен 3, алынып тасталады, қалғаны 5 + 7 + 9 = 21. Жауап: `21`.\n" +
        "Уақыт шегі — 1 секунд, сондықтан бірінші тапсырмада үлгереді деп таңдаған жоспарыңды жаз.",
      ru:
        "Теперь напиши это решение.\n" +
        "На турнире сыграно n раундов. В каждом раунде игрок набрал очки; в некоторых раундах очки могут быть отрицательными — это штраф. При подведении итога k худших раундов игрока не учитываются, а очки остальных раундов складываются.\n" +
        "Отбрасывается всегда ровно k раундов. Даже если встретятся раунды с одинаковыми очками, убираются не все они, а ровно столько, сколько нужно.\n" +
        "Ввод. В первой строке через пробел два целых числа: n и k, где 1 ≤ n ≤ 200 000 и 0 ≤ k ≤ n. Во второй строке через пробел n целых чисел — очки раундов, каждое от -1000 до 1000.\n" +
        "Вывод. Одно число: сумма очков тех раундов, которые не были отброшены. Если k = n, не остаётся ни одного раунда — в этом случае выведи 0.\n" +
        "Пример. Для `5 2` и `7 -3 9 3 5` очки по возрастанию дают -3 3 5 7 9; два худших, то есть -3 и 3, отбрасываются, остаётся 5 + 7 + 9 = 21. Ответ: `21`.\n" +
        "Ограничение по времени — 1 секунда, поэтому пиши тот план, который в первом задании ты счёл укладывающимся.",
    },
    referenceSolution:
      "n, k = map(int, input().split())\n" +
      "a = list(map(int, input().split()))\n" +
      "a.sort()\n" +
      "total = 0\n" +
      "for i in range(k, n):\n" +
      "    total = total + a[i]\n" +
      "print(total)",
    cases: [
      /* The visible sample, and it is doing real work. Unsorted, with a negative
         among the two dropped rounds: no sort answers 17, dropping the k largest
         answers 5, summing the dropped rounds answers 0, and the two off-by-one
         ranges answer 16 and 24. Five mutants die before the learner submits. */
      { input: "5 2\n7 -3 9 3 5", expectedOutput: "21" },
      /* n = 1, nothing dropped. The shortest input on which a loop that stops
         one element short (`range(k, n - 1)`) prints 0 instead of the score. */
      { input: "1 0\n-5", expectedOutput: "-5", hidden: true },
      /* n = 1, everything dropped. k = n at its smallest: a solution that
         assumes at least one round survives indexes a[1] and crashes here. */
      { input: "1 1\n-5", expectedOutput: "0", hidden: true },
      /* The duplicates case the problem exists for. Dropping every value equal
         to the second smallest removes all three fives and answers 7. */
      { input: "4 2\n5 5 5 7", expectedOutput: "12", hidden: true },
      /* k = n with room for an off-by-one to show: the loop must not run at all. */
      { input: "6 6\n1 2 3 4 5 6", expectedOutput: "0", hidden: true },
      /* k = 0, the other edge, on an unsorted list with negatives: nothing is
         dropped and the answer is the whole sum. */
      { input: "6 0\n-1 -2 -3 4 5 6", expectedOutput: "9", hidden: true },
      /* All equal, all negative. A total that only accumulates positive scores,
         or one guarded with `if x > 0`, answers 0 instead of -8. */
      { input: "5 4\n-8 -8 -8 -8 -8", expectedOutput: "-8", hidden: true },
      /* The general shape: negatives, duplicates and the cut falling between
         two equal values is not required here — this is the case that simply
         has to be right when everything above is. */
      { input: "8 3\n-4 -1 0 6 2 -7 3 3", expectedOutput: "14", hidden: true },
      /* Duplicates straddling the cut: the three dropped rounds are 1, 1 and one
         of the four twos. Dropping by value answers 9. */
      { input: "7 3\n2 2 2 2 9 1 1", expectedOutput: "15", hidden: true },
      /* Both ends of the stated value range, one dropped and one kept. Choosing
         the round to drop by absolute value removes 0 and answers 0. */
      { input: "3 1\n1000 -1000 0", expectedOutput: "1000", hidden: true },
    ],
  },
  {
    /*
     * «Ауызша түсіндіру», p.6, asked about the learner's OWN program — the only
     * way the answer can be theirs rather than recalled from b2.
     *
     * Question 3 is the one that is not a rephrasing of anything earlier in the
     * check, and it is the one worth the most. The slow plan's cost is k × n and
     * depends on neither the values nor their order, so there is no "unlucky
     * input" to invent: any large n and k does it. A learner who answers
     * "a reversed list" or "all equal numbers" has imported the idea of a worst
     * case from somewhere it does not apply, and the marking point says so
     * plainly so the teacher can correct it in the same breath.
     *
     * Settles as `unknown`. Nothing here is graded 0/1.
     */
    id: "m4.as.b4",
    type: "verify",
    mode: "oral_explanation",
    skillRefs: ["perf.compare_solutions", "perf.time_estimate", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: 6,
    prompt: {
      kk:
        "Мұғалімге ауызша жауап бер.\n" +
        "(1) Өзің жазған бағдарлама қандай бөліктерден тұрады және әрқайсысы шамамен қанша қадам жасайды? Неге ол 1 секундке үлгереді?\n" +
        "(2) Бірінші тапсырмадағы баяу жоспарды құлату үшін қандай кіріс берер едің? n мен k-ны нақты сандармен ата.\n" +
        "(3) Сол кірістегі ұпайлардың МӘНІ маңызды ма? Баяу жоспардың уақыты неге байланысты — сандардың мәніне ме, әлде тек n мен k-ға ма?\n" +
        "(4) Екі жоспар да бірдей дұрыс жауап беретінін ескерсек, баяу жоспар неге қабылданбайды?",
      ru:
        "Ответь учителю устно.\n" +
        "(1) Из каких частей состоит написанная тобой программа и сколько примерно шагов делает каждая? Почему она укладывается в 1 секунду?\n" +
        "(2) Какой ввод ты бы подал, чтобы медленный план из первого задания не уложился? Назови n и k конкретными числами.\n" +
        "(3) Важны ли в этом вводе САМИ значения очков? От чего зависит время медленного плана — от значений чисел или только от n и k?\n" +
        "(4) Учитывая, что оба плана дают один и тот же верный ответ, почему медленный план не принимается?",
    },
    expectedPoints: [
      {
        kk: "Өз бағдарламасының бөліктері мен бағасы аталған: бір рет реттеу (шамамен 4 000 000 қадам) және тізімді бір рет қарап шығып қосу (200 000-нан аспайтын қадам). Ішкі цикл жоқ, сондықтан ешбір қадам k-ға көбейтілмейді, ал жалпы сан 5 000 000-нан аз — бұл секундтық шаманың кез келген шетінде бір секундтен әлдеқайда аз.",
        ru: "Названы части собственной программы и их цена: одна сортировка (примерно 4 000 000 шагов) и один проход по списку со сложением (не больше 200 000 шагов). Вложенного цикла нет, поэтому ни один шаг не умножается на k, а всего получается меньше 5 000 000 — это заметно меньше секунды при любом краю оценки шагов в секунду.",
      },
      {
        kk: "Баяу жоспарды құлататын кіріс нақты сандармен аталған: мысалы, n = 200 000 және k = 100 000, ұпайлар кез келген. Оқушы бұл кірісте А жоспарының 20 000 000 000 қадам жасайтынын және оның бір секундке сыймайтынын көрсете алады.",
        ru: "Ввод, на котором медленный план не укладывается, назван конкретными числами: например, n = 200 000 и k = 100 000, а очки любые. Ученик может показать, что на таком вводе план А делает 20 000 000 000 шагов и в секунду не укладывается.",
      },
      {
        kk: "Ең маңыздысы айтылған: А жоспарының уақыты ұпайлардың мәніне де, олардың орналасу ретіне де байланысты емес — ол қандай тізім берілсе де әрқашан k × n қадам жасайды. Сондықтан «кері реттелген тізім» немесе «бәрі бірдей сан» сияқты арнайы жағдай ойлап табудың қажеті жоқ: n мен k үлкен болса жеткілікті. Керісінше, k кішкентай болса (мысалы, k = 1), сол жоспар бірден бітеді — «баяу шешім» деген нәрсе кірістен бөлек емес, ол тек шарттағы сандармен бірге мағына табады.",
        ru: "Сказано главное: время плана А не зависит ни от значений очков, ни от их порядка — на любом списке он делает ровно k × n шагов. Поэтому не нужно придумывать особый случай вроде «список в обратном порядке» или «все числа одинаковые»: достаточно того, что n и k велики. И наоборот, при маленьком k (скажем, k = 1) тот же план заканчивается мгновенно — «медленное решение» не существует отдельно от ввода, оно имеет смысл только вместе с числами из условия.",
      },
      {
        kk: "Дұрыстық пен жылдамдық ажыратылған: екі жоспар да барлық кірісте бірдей жауап береді, демек баяу жоспар қате емес. Ол тек кеш аяқталады, ал жарыста дұрыс жауап тым кеш шықса, қабылданбайды. Сондықтан шешімді таңдау кодты жазбас бұрын, шарттағы сандарға қарап жасалады.",
        ru: "Разделены правильность и скорость: оба плана на любом вводе дают одинаковый ответ, значит медленный план не ошибочен. Он просто заканчивает слишком поздно, а на соревновании правильный ответ, полученный слишком поздно, не принимается. Поэтому решение выбирают до того, как пишут код, — глядя на числа в условии.",
      },
    ],
  },
];
