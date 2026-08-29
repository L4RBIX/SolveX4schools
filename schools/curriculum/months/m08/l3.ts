import type { LessonBlock } from "../../types";

/**
 * Lesson m8.l3 · «Алдыңғы жауаптар арқылы» / «Через предыдущие ответы». 10 minutes.
 * PDF p.10, April. Skills: `dp.core`, `dp.table`.
 *
 * ## The clauses that drive the file
 *
 * April's mastery sentence has two halves joined by a semicolon, and this
 * lesson owns the second one:
 *
 *   «…екіншісі - кіші жағдайлар үшін табылған жауаптарды пайдаланып үлкен
 *   есепті шешу.»
 *
 * The delivery sentence says how: «Екінші тәсіл **қадамдап толтырылатын кесте**
 * арқылы беріледі» — through a table filled in step by step. And the month's
 * own «Айлық сынақ» fixes the ORDER in which the two halves are asked:
 *
 *   «Кодқа отырмас бұрын **әр аралық нәтиженің нені білдіретінін** сөзбен
 *   тұжырымдайды…»
 *
 * Before sitting down to code, say in words what each intermediate result
 * means. So the meaning of `dp[i]` is asked first and asked repeatedly — b1
 * states it, b3's first reasoning step states it before any number is written,
 * b4 grades it as a sentence, and b8 and b9 restate it inside the prompt so the
 * learner meets the definition and not a template. Nothing in this file hands
 * over a general table-filling program to copy; see the duplicate map below.
 *
 * The PDF family this lesson owns is «баспалдақпен неше тәсілмен көтерілу» —
 * the number of ways to climb the stairs. The other five families named on
 * p.10 belong to `m8.l1`, `m8.l2`, `m8.l4` and `m8.l5`.
 *
 * ## February, turned around
 *
 * `m6.l5.b6` had the learner count the ways to climb `n` steps with a function
 * that calls itself, capped at n ≤ 25, and its prompt says out loud why: «n = 25
 * болғанда функция 200 000-нан астам рет шақырылады, ал әртүрлі сұрақ небәрі 26».
 * It also promises where that waste gets removed — «Дәл осы артық жұмысты
 * сәуірде жоямыз». This is that lesson, and it collects the promise by name in
 * b1's concept and in b9's prompt.
 *
 * ## The visualiser that does not exist
 *
 * `docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1: `dp_table` has no
 * implementation yet. b2 declares it anyway, with a config that names the
 * recurrence, the initial cells and n, so the block lights up the day the
 * visualiser lands. Until then the prompt's last sentence sends the learner to
 * squared paper, and the WEIGHT of the month's «қадамдап толтырылатын кесте»
 * is carried by b6, where the learner fills seven rows in by hand. That is the
 * same work with the learner holding the pen.
 *
 * ## Requirement a checker cannot see — which option, and why
 *
 * b9 would like to say «кестемен жаз» — solve it with a table. Output
 * comparison cannot see a table, so per authoring contract §4 this lesson takes
 * **option 1** and states no rule it cannot enforce:
 *
 * - the constraint does the grading. n goes to 80, and the recursion of
 *   `m6.l5.b6` needs more than 10^16 calls to answer n = 80, so the hidden
 *   `45` and `80` cases kill every solution that recomputes instead of
 *   remembering. The prompt says this in advance, in both languages, so nobody
 *   discovers it only on a hidden case.
 * - what the prompt does NOT claim is that the answer must be a list. A
 *   solution keeping only the last two answers passes, is the same idea in a
 *   thriftier form, and the prompt says so rather than pretending a list is
 *   checked. Telling a fourteen-year-old that a rule was verified when it was
 *   not is the defect being avoided.
 *
 * ## Every program in the lesson, and why no two are the same
 *
 * Five stair variants carry five different programs on purpose, so that the
 * table has to be REBUILT at every card rather than transcribed:
 *
 * | block | steps allowed | shape |
 * |---|---|---|
 * | b1  | — | a table created and one cell filled, to name `[0] * (n + 1)` |
 * | b3  | 1 or 2, n = 6 | seven explicit assignments, NO loop, `print(dp)` |
 * | b5  | — | an invented recurrence with no story at all |
 * | b6  | 1 or 2, step 3 broken | loop from 2, an `if` inside |
 * | b7  | 1 or 3 | loop from 3, three initial cells, one of them wrong |
 * | b8  | 1, 2 or 3 | loop from 3, three holes |
 * | b9  | 1 or 2, n from input | loop from 2 — the only card with this program |
 *
 * The worked example (b3) deliberately writes the six cells out one line each
 * instead of looping: it shows the table being filled left to right, which is
 * what the PDF asks for, and it leaves the step from «алты жол» to «бір цикл»
 * as the learner's own work in b9. That step is the whole task. A worked
 * example that looped would have printed b9's answer on screen a card before
 * asking for it — the defect the first adversarial review found most often.
 *
 * The one deliberate repetition is the support route's: b9s starts from the
 * program the support learner has just completed in b8, and its reference
 * solution is b9's, because a twin and the task it substitutes for are the same
 * problem on two routes that no single learner sees both of.
 *
 * ## The degenerate programs, named, with the case that kills each
 *
 * b9 (ways to climb n steps with 1 or 2):
 * - `print(n)` and `2 ** (n - 1)` both die on the visible `4` (5 ≠ 4, 5 ≠ 8);
 * - `dp[0] = 0` shifts the whole sequence and answers 3 — dies on the visible `4`;
 * - a loop written `range(2, n)` leaves `dp[n]` at 0 — dies on the visible `4`
 *   and again on the hidden `2`;
 * - counting COMBINATIONS instead of sequences (1+1+2 and 2+1+1 as one way)
 *   answers 3 for n = 4 and 4 for n = 7 — dies on both visible cases;
 * - a table built as `[0] * n` raises IndexError everywhere;
 * - anything hard-coding `dp[2]` before the loop crashes on the hidden `1`,
 *   which is the low boundary of the stated range;
 * - printing `dp[n - 1]` answers 3 for n = 4 — dies on the visible case;
 * - the February recursion with no table dies on the hidden `45` and `80`.
 * The two ends of the range, `1` and `80`, are both cases.
 *
 * b9s is the same problem, so it carries the same case set for the same reasons,
 * and the hidden `1` additionally kills the most likely incomplete edit: leaving
 * `dp[2] = 2` in place, which raises IndexError on a table of two cells.
 *
 * b7 (find_bug): the repaired program is nobody's reference solution in this
 * month — it climbs 1 or 3 steps, and no task asks for that — so repairing it
 * cannot be a rehearsal of a later answer.
 *
 * ## No new Python
 *
 * `[0] * (n + 1)` is a list literal multiplied by an integer. It needs no
 * construct that October did not bring, but nothing in the year has WRITTEN it
 * before, so b1 names it in prose and says what it produces — one sentence,
 * which is what defect class 6 of the contract asks for. Everything else here
 * is `for`, `range`, `len`, indexing, `if/else`, `int(input())` and `print`. No
 * import, no `def`, no `sorted`, no comprehension, and every program prints
 * numbers only, so no learner can match a Kazakh or Russian glyph instead of
 * reasoning.
 */

const P = 10; // PDF page for all of April

export const M8_L3: LessonBlock[] = [
  {
    /*
     * The month's second half, stated once and without a general program on
     * screen. The card does three jobs: it collects February's promise, it
     * names `[0] * (n + 1)` because no lesson has written it before, and it
     * puts the sentence «dp[i] — … жауабы» in front of every number that
     * follows, which is the assessment's own order.
     */
    id: "m8.l3.b1",
    type: "concept",
    skillRefs: ["dp.core", "dp.table"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "dp[i] — кіші сұрақтың жауабы",
      ru: "dp[i] — ответ на меньший вопрос",
    },
    body: {
      kk:
        "Ақпанда баспалдақ есебін өзін-өзі шақыратын функциямен шештік. Ол дұрыс жауап берді, бірақ бір сұрақтың жауабын қайта-қайта есептеді: `climb(3)` шақырулар ағашында бірнеше рет кездесті. n өскен сайын сол қайталау көбейе берді, сондықтан ол шешімде n ең көбі 25 болатын.\n\n" +
        "Бүгін дәл сол жауаптарды бір-ақ рет есептеп, кестеге жазып қоямыз. Кесте — қарапайым тізім, оны былай жасаймыз:\n\n" +
        "```\ndp = [0] * (n + 1)\n```\n\n" +
        "Бір элементтен тұратын тізімді бүтін санға көбейтсең, сол элемент сонша рет қайталанған тізім шығады: `[0] * 4` дегеніміз — `[0, 0, 0, 0]`. Ұзындығын `n + 1` деп аламыз, өйткені бізге 0-ден n-ге дейінгі, барлығы n + 1 ұяшық керек.\n\n" +
        "Ең маңыздысы — сан емес, мағына. Кестенің әр ұяшығы — бір кіші сұрақтың жауабы, ал сол сұрақты бір сөйлеммен айта білу керек. Мысалы: «dp[i] — жерден i-сатыға көтерілудің тәсілдер саны». Кодқа отырмас бұрын осы сөйлемді өзіңе дауыстап айт. Айта алмасаң, кестені толтыруға әлі ерте: қандай сан жазатыныңды білмейсің деген сөз.",
      ru:
        "В феврале мы решали задачу про лестницу функцией, которая вызывает саму себя. Ответ получался верный, но одна и та же величина считалась заново много раз: вызов `climb(3)` встречался в дереве вызовов несколько раз. Чем больше n, тем больше повторов, поэтому в том решении n было не больше 25.\n\n" +
        "Сегодня мы посчитаем те же ответы по одному разу и запишем их в таблицу. Таблица — это обычный список, и создаём мы её так:\n\n" +
        "```\ndp = [0] * (n + 1)\n```\n\n" +
        "Если список из одного элемента умножить на целое число, получится список, в котором этот элемент повторён столько раз: `[0] * 4` — это `[0, 0, 0, 0]`. Длину берём `n + 1`, потому что нам нужны ячейки с номерами от 0 до n, а их ровно n + 1.\n\n" +
        "Главное здесь не числа, а смысл. Каждая ячейка таблицы — это ответ на один меньший вопрос, и этот вопрос нужно уметь назвать одним предложением. Например: «dp[i] — количество способов подняться с земли на ступеньку i». Проговори это предложение до того, как сядешь за код. Если оно не проговаривается, заполнять таблицу рано: ты ещё не знаешь, какое число в неё записываешь.",
    },
    code:
      "n = 5\n" +
      "dp = [0] * (n + 1)\n" +
      "print(len(dp))\n" +
      "dp[0] = 1\n" +
      "print(dp)",
  },
  {
    /*
     * «Екінші тәсіл қадамдап толтырылатын кесте арқылы беріледі», declared for
     * the visualiser that does not exist yet (RUNTIME_INTEGRATION_REQUIREMENTS
     * §1). Not an attempt block: watching a table fill is not evidence about
     * anything, and b4, b5 and b6 are where the same question is graded.
     *
     * n = 6 is the same staircase b3 reasons through in full, on purpose —
     * seeing the shape first and reading the argument second is the order the
     * programme puts them in, and it is what `m7.l3.b2` and `m7.l3.b3` already
     * do for the BFS wave.
     */
    id: "m8.l3.b2",
    type: "visual_simulation",
    skillRefs: ["dp.table", "dp.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    simulation: "dp_table",
    prompt: {
      kk: "Баспалдақта 6 саты бар, бір аттағанда 1 немесе 2 сатыға көтерілуге болады. Кесте солдан оңға қарай, ұяшықтап толтырылады: `dp[0]` мен `dp[1]` бірден жазылып қойылған, ал қалған әр ұяшық — өзінен бұрынғы екі ұяшықтың қосындысы. Келесі қадамды баспас бұрын өзің айтып ал: қазір қай ұяшық толады, ол қай екі ұяшыққа қарайды және ішінде қандай сан тұрады? Анимация ашылмаса, дәптеріңе екі жолды кесте сыз да — жоғарғы жолға i, төменгі жолға dp[i] — ұяшықтарды солдан оңға өзің толтыр.",
      ru: "На лестнице 6 ступенек, за один шаг можно подняться на 1 или на 2. Таблица заполняется слева направо, по одной ячейке: `dp[0]` и `dp[1]` записаны сразу, а каждая следующая ячейка — сумма двух ячеек перед ней. Прежде чем нажать следующий шаг, проговори: какая ячейка заполняется сейчас, на какие две ячейки она смотрит и какое число в ней окажется? Если анимация не открылась, начерти в тетради таблицу из двух строк — сверху i, снизу dp[i] — и заполни ячейки слева направо сам.",
    },
    config: {
      n: 6,
      cells: "dp[0..6]",
      meaning: "dp[i] = number of ways to climb from the ground to step i",
      initial: { "dp[0]": 1, "dp[1]": 1 },
      recurrence: "dp[i] = dp[i - 1] + dp[i - 2]",
      fillOrder: "left_to_right",
      show: ["index", "value", "sources"],
      askBeforeStep: true,
    },
  },
  {
    /*
     * «Толық талданған мысал» on the family the PDF names. Step 1 is the
     * assessment sentence obeyed literally: the meaning of dp[i] is written
     * before a single number is.
     *
     * The program writes the six cells out one line each and does not loop.
     * That is not a simplification, it is the point: the card shows the table
     * being filled left to right and leaves the move from «алты жол» to «бір
     * цикл» to b9, which is the task. A looping worked example would have put
     * b9's answer on screen six cards before asking for it.
     */
    id: "m8.l3.b3",
    type: "worked_example",
    skillRefs: ["dp.core", "dp.table"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: 6 сатылы баспалдақ",
      ru: "Разобранный пример: лестница из 6 ступенек",
    },
    problem: {
      kk: "Баспалдақта 6 саты бар. Бір аттағанда 1 сатыға немесе 2 сатыға көтерілуге болады. Ең жоғарыға шығудың неше түрлі жолы бар? Екі жол әртүрлі саналады, егер аттаулар тізбегі әртүрлі болса. Ақпанда бұл есепті рекурсиямен шешкенбіз — енді жауаптарды кестеге жазып шығамыз.",
      ru: "На лестнице 6 ступенек. За один шаг можно подняться на 1 ступеньку или на 2. Сколькими разными способами можно подняться до самого верха? Два способа считаются разными, если различается последовательность шагов. В феврале мы решали эту задачу рекурсией — теперь выпишем ответы в таблицу.",
    },
    steps: [
      {
        kk: "Алдымен сұрақты атаймыз, санды емес. `dp[i]` — жерден i-сатыға көтерілудің тәсілдер саны. Мұндағы i — «баспалдақтың биіктігі» емес, «біз тұрған саты». Осы сөйлемсіз кестедегі кез келген сан мағынасыз, ал ол болса — қалғанының бәрі содан шығады.",
        ru: "Сначала называем вопрос, а не число. `dp[i]` — это количество способов подняться с земли на ступеньку i. Здесь i — не «высота лестницы», а «ступенька, на которой мы стоим». Без этого предложения любое число в таблице бессмысленно, а с ним всё остальное выводится само.",
      },
      {
        kk: "Бастапқы мәндер. `dp[0] = 1`: жердеміз, әлі бір де аттау жасамадық — бұл да бір тәсіл, «ешқайда аттамау» тәсілі. Оны 0 деп қойсақ, бүкіл кесте нөлге толады, өйткені барлық сан осы ұяшықтан өсіп шығады. `dp[1] = 1`: бірінші сатыға тек бір ғана жолмен — бір сатылық жалғыз аттаумен — шығуға болады, себебі 2 сатылық аттау бірден асып кетеді.",
        ru: "Начальные значения. `dp[0] = 1`: мы на земле и ещё не сделали ни одного шага — это тоже способ, способ «никуда не шагать». Если поставить здесь 0, вся таблица заполнится нулями, потому что все числа вырастают именно из этой ячейки. `dp[1] = 1`: на первую ступеньку можно попасть единственным образом — одним шагом на 1, ведь шаг на 2 сразу перескочит через неё.",
      },
      {
        kk: "Ереже. i ≥ 2 болсын. i-сатыда тұрған адамның СОҢҒЫ аттауы не 1 саты, не 2 саты болған — үшінші нұсқа жоқ. Бірінші жағдайда ол оған дейін (i − 1)-сатыда тұрған, екіншісінде (i − 2)-сатыда. Бұл екі топтың ортақ жолы жоқ және екеуінен тыс қалатын жол да жоқ, сондықтан жауаптар жай ғана қосылады: `dp[i] = dp[i - 1] + dp[i - 2]`.",
        ru: "Правило. Пусть i ≥ 2. У человека, стоящего на ступеньке i, ПОСЛЕДНИЙ шаг был либо на 1 ступеньку, либо на 2 — третьего варианта нет. В первом случае до этого он стоял на ступеньке (i − 1), во втором — на (i − 2). У этих двух групп нет общих путей и нет пути, который не попал бы ни в одну из них, поэтому ответы просто складываются: `dp[i] = dp[i - 1] + dp[i - 2]`.",
      },
      {
        kk: "Толтырамыз, тек солдан оңға: `dp[2] = 1 + 1 = 2`, `dp[3] = 2 + 1 = 3`, `dp[4] = 3 + 2 = 5`, `dp[5] = 5 + 3 = 8`, `dp[6] = 8 + 5 = 13`. Рет неге дәл осылай? Әр ұяшық өзінен СОЛ ЖАҚТА тұрған екі ұяшыққа ғана қарайды, демек оған кезек жеткенде ол екеуі әлдеқашан жазылып қойған болады.",
        ru: "Заполняем, строго слева направо: `dp[2] = 1 + 1 = 2`, `dp[3] = 2 + 1 = 3`, `dp[4] = 3 + 2 = 5`, `dp[5] = 5 + 3 = 8`, `dp[6] = 8 + 5 = 13`. Почему именно такой порядок? Каждая ячейка смотрит только на две ячейки СЛЕВА от себя, а значит, к моменту её заполнения обе уже записаны.",
      },
      {
        kk: "Бағдарлама. Кестеде жеті ұяшық бар, бағдарламада да жеті жол: әр жол — кестенің бір ұяшығы, ешқандай цикл жоқ, өйткені n алдын ала белгілі, ол — 6. Егер n енгізуден келсе, ереже бойынша толтырылатын жолдарды бір циклге жинауға тура келеді, ал циклдің қай ұяшықтан басталатынын өзің шешесің. Ол — келесі тапсырмалардың жұмысы.",
        ru: "Программа. В таблице семь ячеек, и в программе семь строк: каждая строка — одна ячейка таблицы, никакого цикла нет, ведь n известно заранее и равно 6. Если же n придёт с ввода, строки, которые заполняются по правилу, придётся собрать в один цикл, и с какой ячейки этот цикл начинается, решать будешь ты. Это работа следующих заданий.",
      },
      {
        kk: "Ақпанмен салыстыр. Сол есепті шешкен рекурсия `climb(4)` мен `climb(3)`-ті бірнеше рет қайта есептеген; мұндағы кесте әр ұяшыққа бір-ақ рет сан жазады да, оны сол жерде сақтап тұрады. Жұмыс көлемі баспалдақтың биіктігіне тең — сатылар қанша болса, соншама қосу.",
        ru: "Сравни с февралём. Рекурсия, решавшая ту же задачу, пересчитывала `climb(4)` и `climb(3)` по нескольку раз; здесь таблица записывает число в каждую ячейку ровно один раз и там же его хранит. Объём работы равен высоте лестницы: сколько ступенек, столько и сложений.",
      },
    ],
    code:
      "dp = [0] * 7\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "dp[2] = dp[1] + dp[0]\n" +
      "dp[3] = dp[2] + dp[1]\n" +
      "dp[4] = dp[3] + dp[2]\n" +
      "dp[5] = dp[4] + dp[3]\n" +
      "dp[6] = dp[5] + dp[4]\n" +
      "print(dp)",
    result: {
      kk: "Бағдарлама `[1, 1, 2, 3, 5, 8, 13]` шығарады — бұл толық кесте, dp[0]-ден dp[6]-ға дейін. Есептің жауабы — соңғы ұяшық: 6 сатыға көтерілудің 13 түрлі жолы бар.",
      ru: "Программа выводит `[1, 1, 2, 3, 5, 8, 13]` — это вся таблица целиком, от dp[0] до dp[6]. Ответ задачи — последняя ячейка: подняться на 6 ступенек можно 13 разными способами.",
    },
  },
  {
    /*
     * «Әр аралық нәтиженің нені білдіретінін сөзбен тұжырымдайды» — graded as a
     * sentence, which is the only way to grade it. The distractors are the two
     * off-by-one readings the assessment sentence exists because of, plus one
     * that counts the wrong THING.
     *
     * o2 and o3 are mapped: each names its own cause inside the sentence, so
     * the choice cannot mean two different things. o4 is left unmapped — a
     * learner can land on it by misreading «тәсілдер саны» as «аттаулар саны»
     * carelessly, and carelessness is not a named failure class.
     */
    id: "m8.l3.b4",
    type: "multiple_choice",
    skillRefs: ["dp.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Баспалдақ есебінде (бір аттауда 1 немесе 2 саты) кесте `dp[0] = 1`, `dp[1] = 1` және `dp[i] = dp[i - 1] + dp[i - 2]` ережесімен толтырылды, ал жауап ретінде `dp[n]` шығарылды. Мына төрт сөйлемнің қайсысы `dp[i]`-дің нені білдіретінін ДҰРЫС айтады?",
      ru: "В задаче про лестницу (за шаг 1 или 2 ступеньки) таблицу заполнили по правилам `dp[0] = 1`, `dp[1] = 1` и `dp[i] = dp[i - 1] + dp[i - 2]`, а в качестве ответа вывели `dp[n]`. Какое из четырёх предложений ВЕРНО говорит, что означает `dp[i]`?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "dp[i] — жерден i-сатыға көтерілудің тәсілдер саны.",
          ru: "dp[i] — количество способов подняться с земли на ступеньку i.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "dp[i] — жерден (i + 1)-сатыға көтерілудің тәсілдер саны, өйткені ұяшықтардың нөмірленуі нөлден басталады.",
          ru: "dp[i] — количество способов подняться с земли на ступеньку (i + 1), потому что нумерация ячеек начинается с нуля.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "dp[i] — i-сатыдан баспалдақтың ең жоғарғы сатысына шығудың тәсілдер саны.",
          ru: "dp[i] — количество способов подняться со ступеньки i до самого верха лестницы.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "dp[i] — i-сатыға жету үшін жасалатын аттаулардың саны.",
          ru: "dp[i] — количество шагов, которые нужно сделать, чтобы попасть на ступеньку i.",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "index_shifted_by_one_in_the_table_definition",
        justification:
          "Бұл сөйлем ережені де, кестені де дұрыс қабылдайды, тек нөмірді бірге жылжытады және оның себебін өзі атап тұр: «нөлден басталады». Ондай оқу дұрыс болса, жауап dp[n] емес, dp[n - 1] болар еді — демек нақты бір, жалғыз қате: кесте нөмірінің мағынасын бірге ығыстыру.",
      },
      o3: {
        failureClass: "table_defined_from_the_wrong_end",
        justification:
          "Бұл — кестені қарама-қарсы жағынан анықтау. Осылай оқыса, бастапқы мән төменгі емес, жоғарғы ұяшыққа қойылуға тиіс еді, ал жауап dp[n] емес, dp[0]-ден алынар еді. Экрандағы бағдарлама екеуін де керісінше істейді, сондықтан бұл таңдау тек бір нәрсені білдіреді: кестенің қай ұшы кіші сұрақ екені шатасқан.",
      },
    },
  },
  {
    /*
     * The card with no staircase on it. Every other block in the lesson has a
     * story, and a story lets a learner fill the table from a remembered rule
     * instead of the written one — which is exactly what April says it is NOT
     * teaching («дайын әдісті жаттау емес»). So here there is only a rule and
     * two initial values, and the only way to the answer is to fill four cells.
     *
     * 5 is the one mapped answer: it is dp[4] of the staircase recurrence, and
     * nothing else on the way to this table produces it (dp[3] here is 7).
     * 7 is left unmapped on purpose — reading the table one column early and
     * pairing the wrong two cells both land on it.
     */
    id: "m8.l3.b5",
    type: "prediction",
    skillRefs: ["dp.table", "dp.core"],
    sourceType: "product-authored",
    prompt: {
      kk: "Мұнда ешқандай баспалдақ жоқ: бағдарламада тек ереже мен екі бастапқы мән жазылған, басқа ештеңе жоқ. Кестені қағазда солдан оңға толтырып шық — dp[2], сосын dp[3], сосын dp[4]. Бағдарлама нені шығарады?",
      ru: "Здесь нет никакой лестницы: в программе записаны только правило и два начальных значения, больше ничего. Заполни таблицу на бумаге слева направо — dp[2], потом dp[3], потом dp[4]. Что выведет программа?",
    },
    code:
      "dp = [0] * 5\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "for i in range(2, 5):\n" +
      "    dp[i] = 2 * dp[i - 1] + dp[i - 2]\n" +
      "print(dp[4])",
    answer: "17",
    options: ["17", "11", "7", "5"],
    diagnosticMapping: {
      "5": {
        failureClass: "applied_a_remembered_recurrence_instead_of_the_written_one",
        justification:
          "5 саны — `dp[i] = dp[i - 1] + dp[i - 2]` ережесімен, яғни баспалдақ есебінің ережесімен толтырылған кестенің дәл dp[4] ұяшығы. Экрандағы жолда `dp[i - 1]` екіге көбейтіліп тұр, сондықтан бұл жауап жалғыз нәрсені білдіреді: оқушы жазылған ережені емес, есінде қалған ережені қолданған.",
      },
    },
  },
  {
    /*
     * The month's «қадамдап толтырылатын кесте», carried by the block type that
     * actually works today. Seven rows, filled by hand.
     *
     * The staircase has a broken board, so the table is NOT the one b3 filled
     * and cannot be copied from it: dp[3] is forced to 0, and the interesting
     * work is what that does to dp[4] and dp[5] two columns later. It is also
     * the sharpest test of what dp[i] means — a learner who thinks dp[i]
     * counts steps rather than routes cannot explain a zero in the middle of a
     * rising row.
     *
     * dp[0] and dp[1] are written by the program, so every graded row has the
     * same two columns and the loop variable really exists at each of them.
     */
    id: "m8.l3.b6",
    type: "trace_code",
    skillRefs: ["dp.table", "dp.core", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Баспалдақта 8 саты бар, бір аттағанда 1 немесе 2 сатыға көтерілуге болады. Бірақ 3-сатының тақтайы сынған: оған аяқ басуға болмайды, оның үстінен тек 2 сатылық аттаумен ғана өтуге болады. `dp[i]` — жерден i-сатыға көтерілудің тәсілдер саны.\n\n`dp[0]` мен `dp[1]` бағдарламада жазылып қойған, сен кестені i = 2-ден бастап толтыр. Әр жол — циклдің бір айналымы: `i` бағанына сол айналымдағы i-дің мәнін, `dp[i]` бағанына сол айналымда кестеге жазылған санды жаз. Сынған сатыдан кейінгі екі ұяшыққа ерекше көңіл бөл.",
      ru: "На лестнице 8 ступенек, за один шаг можно подняться на 1 или на 2. Но на третьей ступеньке сломана доска: наступать на неё нельзя, её можно только перешагнуть шагом на 2. `dp[i]` — количество способов подняться с земли на ступеньку i.\n\n`dp[0]` и `dp[1]` уже записаны в программе, а ты заполняешь таблицу начиная с i = 2. Каждая строка — один проход цикла: в столбец `i` запиши значение i на этом проходе, в столбец `dp[i]` — число, записанное на нём в таблицу. Особое внимание удели двум ячейкам после сломанной ступеньки.",
    },
    code:
      "n = 8\n" +
      "bad = 3\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "for i in range(2, n + 1):\n" +
      "    if i == bad:\n" +
      "        dp[i] = 0\n" +
      "    else:\n" +
      "        dp[i] = dp[i - 1] + dp[i - 2]\n" +
      "print(dp[n])",
    steps: [
      { line: 10, vars: { i: "2", "dp[i]": "2" } },
      { line: 8, vars: { i: "3", "dp[i]": "0" } },
      { line: 10, vars: { i: "4", "dp[i]": "2" } },
      { line: 10, vars: { i: "5", "dp[i]": "2" } },
      { line: 10, vars: { i: "6", "dp[i]": "4" } },
      { line: 10, vars: { i: "7", "dp[i]": "6" } },
      { line: 10, vars: { i: "8", "dp[i]": "10" } },
    ],
  },
  {
    /*
     * The initial value, which is where a first table almost always breaks.
     * `dp[0] = 0` is not an arithmetic slip: it is the answer of somebody who
     * read dp[0] as «жерде тұрғанда әлі бір де тәсіл жоқ» instead of «ешқайда
     * аттамау — бір тәсіл», and every number in the table inherits it.
     *
     * The staircase climbs 1 or 3 steps, which no task in this month asks for.
     * So the repaired program is nobody's reference solution — a find_bug whose
     * fix is the next write_code's answer is the defect the first adversarial
     * review found most often, and it is avoided here by construction.
     *
     * symptomInput is required: the fallback probe would run this program on
     * `0`, `1` and other values below 3, where `dp[2] = 1` raises IndexError in
     * BOTH versions and the two would read as behaving identically.
     */
    id: "m8.l3.b7",
    type: "find_bug",
    skillRefs: ["dp.table", "dp.core", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл баспалдақта бір аттағанда 1 сатыға немесе 3 сатыға көтерілуге болады — 2 сатылық аттау жоқ (3 ≤ n ≤ 60). n = 6 болғанда дұрыс жауап 6: алты бірлік аттау; бір 3 сатылық аттау мен үш бірлік аттау (3 санының орны төрт түрлі болады); және 3 + 3. Бағдарлама болса 4 шығарады. Алдымен кестені қағазда өзің толтырып шық, содан кейін бағдарламаның кестесімен салыстыр. Қате қай жолда?",
      ru: "На этой лестнице за один шаг можно подняться на 1 ступеньку или на 3 — шага на 2 нет (3 ≤ n ≤ 60). При n = 6 верный ответ 6: шесть шагов по одной; один шаг на 3 и три шага по одной (тройка может стоять на четырёх разных местах); и 3 + 3. А программа выводит 4. Сначала заполни таблицу на бумаге сам, потом сравни её с таблицей программы. В какой строке ошибка?",
    },
    code:
      "n = int(input())\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 0\n" +
      "dp[1] = 1\n" +
      "dp[2] = 1\n" +
      "for i in range(3, n + 1):\n" +
      "    dp[i] = dp[i - 1] + dp[i - 3]\n" +
      "print(dp[n])",
    buggyLine: 3,
    symptomInput: "6",
    fixedCode:
      "n = int(input())\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "dp[2] = 1\n" +
      "for i in range(3, n + 1):\n" +
      "    dp[i] = dp[i - 1] + dp[i - 3]\n" +
      "print(dp[n])",
    diagnosticMapping: {
      "7": {
        failureClass: "searched_the_recurrence_not_the_initial_values",
        justification:
          "7-жолдағы ереже дұрыс: i-сатыға не (i − 1)-сатыдан бір аттаумен, не (i − 3)-сатыдан үш сатылық аттаумен келеді, басқа жол жоқ. Бұл жауап оқушының қатені кестенің толтыру ережесінен ғана іздеп, ереже мүлде қолданылмайтын бастапқы ұяшықтарды тексермегенін көрсетеді.",
      },
    },
  },
  {
    /*
     * The third step set, and the first time the learner writes a recurrence
     * rather than reading one. Three holes, and each is a different decision:
     * a value that has to be counted by hand (there are two ways to climb two
     * steps: 1 + 1 and 2), the cell the loop may start from (3, because dp[2]
     * is the last one written above it), and the missing summand.
     *
     * The lower bound is 3 on purpose: with dp[0], dp[1] and dp[2] written out
     * before the loop, a table of two cells would raise IndexError, and a
     * prompt that promised n = 1 would be promising something the program does
     * not do.
     */
    id: "m8.l3.b8",
    type: "fill_blank",
    skillRefs: ["dp.table", "dp.core"],
    sourceType: "product-authored",
    prompt: {
      kk: "Енді бір аттағанда 1, 2 немесе 3 сатыға көтерілуге болады (3 ≤ n ≤ 60). `dp[i]` — жерден i-сатыға көтерілудің тәсілдер саны. Бағдарламада үш орын бос: екінші сатыға көтерілудің тәсілдер саны, циклдің қай ұяшықтан басталатыны және ережедегі жетпей тұрған қосылғыш. Үшеуін де толтыр — бірақ алдымен әр ұяшыққа қандай сұрақтың жауабы жазылатынын өзіңе айт.",
      ru: "Теперь за один шаг можно подняться на 1, 2 или 3 ступеньки (3 ≤ n ≤ 60). `dp[i]` — количество способов подняться с земли на ступеньку i. В программе пропущены три места: количество способов подняться на вторую ступеньку, номер ячейки, с которой начинается цикл, и недостающее слагаемое в правиле. Заполни все три — но сначала проговори, ответ на какой вопрос записывается в каждую ячейку.",
    },
    template:
      "n = int(input())\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "dp[2] = ___\n" +
      "for i in range(___, n + 1):\n" +
      "    dp[i] = dp[i - 1] + dp[i - 2] + ___\n" +
      "print(dp[n])",
    blanks: [
      { id: "f1", answer: "2" },
      { id: "f2", answer: "3" },
      { id: "f3", answer: "dp[i - 3]", alternatives: ["dp[i-3]"] },
    ],
  },
  {
    /*
     * The PDF family, «баспалдақпен неше тәсілмен көтерілу», and February's own
     * task with the cap lifted from 25 to 80.
     *
     * The requirement that cannot be checked — "use a table" — is handled by
     * option 1 of contract §4 and by nothing else: at n = 80 the February
     * recursion needs more calls than there are seconds in a hundred million
     * years, so the hidden `45` and `80` do the grading that a sentence in the
     * prompt could not. The prompt warns about it in advance and, deliberately,
     * does NOT claim that the answer has to be a list: keeping only the last
     * two answers passes, is the same idea, and the prompt says so.
     *
     * Nothing on any earlier card in this lesson is this program. b3 fills the
     * same staircase with six separate assignments and no loop; the loops the
     * learner has seen start at 3 and carry a third summand or an `if`. The
     * step from those to this one is the task.
     */
    id: "m8.l3.b9",
    type: "write_code",
    skillRefs: ["dp.core", "dp.table", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Баспалдақта n саты бар (1 ≤ n ≤ 80). Бір аттағанда 1 сатыға немесе 2 сатыға көтерілуге болады. Ең жоғарыға шығудың неше түрлі жолы бар? Екі жол әртүрлі саналады, егер аттаулар тізбегі әртүрлі болса. n = 4 болғанда жауап 5. Тек сол бір санды шығар.\n\nБұл — ақпанда рекурсиямен шешкен есептің дәл өзі, бірақ ол кезде n ең көбі 25 болатын. Енді n 80-ге дейін өседі, ал өзін-өзі шақыратын сол шешім бір жауапты қайта-қайта есептейтіндіктен, мұндай n-ге ешқашан үлгермейді — тексеру уақыты бітеді. Сондықтан әр жауапты бір рет қана есептеп, оны сақтап отыр.\n\nКодқа отырмас бұрын `dp[i]` нені білдіретінін бір сөйлеммен өзіңе айт, сосын бастапқы мәндерді жаз, сосын ережені. Кестенің орнына тек соңғы екі жауапты сақтап отырсаң да болады: бұл — сол идеяның үнемдірек түрі, тексеруші тек шыққан санды салыстырады.",
      ru: "На лестнице n ступенек (1 ≤ n ≤ 80). За один шаг можно подняться на 1 ступеньку или на 2. Сколькими разными способами можно подняться до самого верха? Два способа считаются разными, если различается последовательность шагов. При n = 4 ответ 5. Выведи только это одно число.\n\nЭто ровно та задача, которую мы решали рекурсией в феврале, но тогда n было не больше 25. Теперь n доходит до 80, а то решение с вызовом самой себя пересчитывает один и тот же ответ снова и снова и при таком n не уложится никогда — время проверки закончится раньше. Поэтому каждый ответ нужно посчитать один раз и сохранить.\n\nПрежде чем сесть за код, проговори одним предложением, что означает `dp[i]`, потом запиши начальные значения, потом правило. Вместо таблицы можно хранить только два последних ответа: это та же идея в более экономном виде, а проверяющая программа сравнивает лишь выведенное число.",
    },
    referenceSolution:
      "n = int(input())\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "for i in range(2, n + 1):\n" +
      "    dp[i] = dp[i - 1] + dp[i - 2]\n" +
      "print(dp[n])",
    cases: [
      { input: "4", expectedOutput: "5" },
      { input: "7", expectedOutput: "21" },
      { input: "1", expectedOutput: "1", hidden: true },
      { input: "2", expectedOutput: "2", hidden: true },
      { input: "3", expectedOutput: "3", hidden: true },
      { input: "11", expectedOutput: "144", hidden: true },
      { input: "45", expectedOutput: "1836311903", hidden: true },
      { input: "80", expectedOutput: "37889062373143906", hidden: true },
    ],
  },
  {
    /*
     * The support route's substitute for b9 (p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ»). Same problem, same input format,
     * same cases, reached by editing rather than by an empty screen.
     *
     * Its starting program is the one the support learner has just finished in
     * b8 — the direction the contract requires, backwards to work already
     * completed and never forwards to an answer about to be asked for. b8 sits
     * immediately before this card on the support route, which is the only
     * route that receives it, so «өзің жаңа ғана толықтырған» is true for every
     * learner who reads it.
     *
     * The edit is not cosmetic. Three places have to move — the summands, the
     * cell the loop starts from, and the hand-written line above it — and the
     * hidden `1` fails any submission that leaves `dp[2] = 2` in place, because
     * a table of two cells has no cell number 2.
     *
     * Its reference solution IS b9's, and that is the twin mechanism working as
     * designed: no learner is on both routes, and `tracks.test.ts` and the
     * duplicate check in `check-blocks` both exempt an `s` twin by name.
     */
    id: "m8.l3.b9s",
    type: "modify_code",
    skillRefs: ["dp.core", "dp.table", "loops.for"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Мына бағдарлама — өзің жаңа ғана толықтырған, бір аттағанда 1, 2 немесе 3 сатыға көтерілуге болатын баспалдақ есебі. Оны 1 немесе 2 сатылық аттауға өзгерт: 3 сатылық аттау енді жоқ, қалғаны бұрынғыдай. Жаңа шектеу — 1 ≤ n ≤ 80, демек n = 1 болғанда да бағдарлама қатесіз жұмыс істеуге тиіс. `dp[i]` — жерден i-сатыға көтерілудің тәсілдер саны. n = 4 болғанда жауап 5.\n\nҮш жерді өзгертуге тура келеді: ережедегі қосылғыштар, циклдің қай ұяшықтан басталатыны және цикл алдында қолмен жазылған мәндер. Соңғысын ұмытпа: n = 1 болғанда кестеде екі-ақ ұяшық болады.",
      ru: "Эта программа — та самая, которую ты только что дополнил: лестница, где за один шаг можно подняться на 1, 2 или 3 ступеньки. Переделай её под шаг на 1 или на 2: шага на 3 больше нет, остальное как было. Новое ограничение — 1 ≤ n ≤ 80, значит, программа должна работать без ошибки и при n = 1. `dp[i]` — количество способов подняться с земли на ступеньку i. При n = 4 ответ 5.\n\nИзменить придётся три места: слагаемые в правиле, номер ячейки, с которой начинается цикл, и значения, выписанные вручную перед циклом. Про последнее не забудь: при n = 1 в таблице всего две ячейки.",
    },
    code:
      "n = int(input())\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "dp[2] = 2\n" +
      "for i in range(3, n + 1):\n" +
      "    dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]\n" +
      "print(dp[n])",
    referenceSolution:
      "n = int(input())\n" +
      "dp = [0] * (n + 1)\n" +
      "dp[0] = 1\n" +
      "dp[1] = 1\n" +
      "for i in range(2, n + 1):\n" +
      "    dp[i] = dp[i - 1] + dp[i - 2]\n" +
      "print(dp[n])",
    cases: [
      { input: "4", expectedOutput: "5" },
      { input: "7", expectedOutput: "21" },
      { input: "1", expectedOutput: "1", hidden: true },
      { input: "2", expectedOutput: "2", hidden: true },
      { input: "3", expectedOutput: "3", hidden: true },
      { input: "11", expectedOutput: "144", hidden: true },
      { input: "45", expectedOutput: "1836311903", hidden: true },
      { input: "80", expectedOutput: "37889062373143906", hidden: true },
    ],
  },
];
