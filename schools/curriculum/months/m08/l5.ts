import type { LessonBlock } from "../../types";

/**
 * m8.l5 · «Тізім бойынша кесте» / «Таблица по списку». 10 minutes.
 *
 * Skills: `dp.core`, `dp.table`, `lists.traverse`.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * April's practice paragraph (PDF p.10) names six families, and three of them
 * are one-dimensional dynamic programming **over a list**:
 *
 *   «тізімнің ең үлкен қосындысы бар бөлігін табу»
 *   «көрші екі санды қатар алмау шартымен таңдау»
 *
 * Both have the same shape — at each position you either take this element or
 * you do not, and the answer is the better of the two — and that shape is not
 * the one the learner met on a counting problem (`m8.l3`, «баспалдақпен неше
 * тәсілмен көтерілу»), where nothing is chosen and nothing is compared. So the
 * fifth lesson exists to teach the comparison itself.
 *
 * The month's explanation clause fixes the method: «Екінші тәсіл қадамдап
 * толтырылатын кесте арқылы беріледі» — the second approach is delivered
 * through a table filled in step by step. There is no `dp_table` visualiser
 * (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1), so the table is
 * filled by hand: `b2` prints one row per step, `b5` makes the learner produce
 * the same rows with a pencil.
 *
 * And April's «Айлық сынақ» sentence decides the ORDER of the cards: «Кодқа
 * отырмас бұрын әр аралық нәтиженің нені білдіретінін сөзбен тұжырымдайды» —
 * before sitting down to code, say in words what each intermediate result
 * means. So the meaning of `dp[i]` is asked twice (`b3`, `b4`) before any card
 * asks for a recurrence, and the fill-blank and both graded tasks come after.
 *
 * `m8.l5` is a new id — the stub had four lessons — and it is taught FOURTH,
 * after `m8.l3`, the way September did it with `m1.l10`. Nothing is renumbered.
 *
 * ## The C++17 migration: what changed, and what did not
 *
 * **The input format changed, in every block that reads.** All five reading
 * blocks used to take «a line of numbers» whose length was implied by the line
 * break. C++ gives a beginner no way to ask where a line ends — `cin >>` reads
 * a number and knows nothing about newlines — so every task here now reads `n`
 * first and then exactly `n` numbers. That is the format `m8.p5` and `m8.p6`
 * already used, so the month is now consistent rather than split. Every case
 * input, `b6`'s `symptomInput` and both prompts carry the count.
 *
 * **No expected answer moved.** The arithmetic is identical: sums of small
 * integers, compared with `>`. Nothing divides, nothing goes near 2^31−1 — the
 * stated bounds put the largest possible answer at 10^6 for the segment sum and
 * 5·10^5 for the boxes — so every table here is honestly `int`, and this is one
 * of the two April lessons where `long long` would be noise rather than care.
 * The bounds are now stated in the prompts, which they were not before, because
 * in C++ "how big can this get" is a question the author must answer for the
 * learner rather than leave to the language.
 *
 * **`b9s` is assembled from eleven pieces rather than ten.** A C++ program
 * carries a frame, so the header and `int main() {` arrive as one given piece
 * and the closing lines as another; the nine pieces between them are the same
 * nine decisions the Python version shuffled. Indentation is a stronger hint in
 * C++ than it was in Python, so the pieces that could be told apart by their
 * indent alone were merged: what is left to decide is order, not spacing.
 *
 * ## Five decisions taken once, so that no block re-litigates them
 *
 * 1. **The empty choice is a stated rule, not a convention the author kept in
 *    their head.** «Тізімнің ең үлкен қосындысы бар бөлігін табу» does not say
 *    whether the empty segment counts, and the two readings give different
 *    answers on all-negative input: 0, or the largest element, which is
 *    negative. That is exactly the silent wrong-answer-key the month's
 *    assessment sentence is aimed at, so the lesson does not pick one and hide
 *    it — it puts BOTH on screen, each with its rule spelled out in kk and ru
 *    and each with an all-negative case that enforces it. `b6` and `b7` require
 *    at least one element; `b8` allows taking no days at all and says so in
 *    capitals, with `3 / -5 -2 -9 → 0` as a VISIBLE case so nobody discovers
 *    the difference from a hidden failure.
 *
 * 2. **That is also what keeps `b8` from being transcription.** The contract's
 *    first defect class is a task whose answer is already on screen, and a
 *    `find_bug` that repairs the program the next `write_code` asks for is
 *    named in it. Here the repaired `b6` and the completed `b7` are correct
 *    programs for the *at least one element* rule and WRONG for `b8` — a
 *    learner who copies either fails the first visible case, and the thing they
 *    then have to think about is precisely the thing this lesson teaches.
 *    `b8`'s own solution resets the running sum to 0, which no program on
 *    screen does.
 *
 * 3. **Three shapes of the same recurrence, on purpose, never twice the same.**
 *    The segment table appears as a `dp` vector with a separate best-so-far scan
 *    (`b4`, `b7`), and as two running variables (`b6`, `b8`); the no-two-adjacent
 *    table appears with explicit `take`/`skip` variables (`b2`, `b5`) and
 *    without them (`b9`, `b9s`). Every list of data in the lesson is different
 *    from every other, so no card's numbers answer another card's question —
 *    `b2` runs on `6 2 3 9 1 8`, `b5` on `2 8 3 3 9 4`, and neither list nor
 *    either answer appears among `b9`'s cases.
 *
 * 4. **The numbers in the no-two-adjacent task are non-negative, and the prompt
 *    says so.** With negative scores the problem needs the same empty-choice
 *    decision as the segment problem, and one such decision per lesson is
 *    enough for fourteen-year-olds. Non-negative also makes `dp[1] = a[0]`
 *    honest: taking the only box never loses.
 *
 * 5. **Nothing structural is required that the checker cannot see.** No prompt
 *    here says "use a table" or "do not use two variables" — `b8` is passed by
 *    any program that prints the right number, which is what the judge compares.
 *    Where this lesson wants a particular method it gets it the way the
 *    contract's option 1 says to: by choosing a rule (`b8`'s empty choice) that
 *    the on-screen alternatives genuinely do not satisfy.
 */
export const M8_L5: LessonBlock[] = [
  {
    id: "m8.l5.b1",
    type: "concept",
    skillRefs: ["dp.core", "dp.table"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    title: {
      kk: "Аламыз ба, өткізіп жібереміз бе",
      ru: "Берём или пропускаем",
    },
    /* `vector<int> dp(n + 1, 0)` is the only thing in the lesson a learner has
       not written before — the contract's sixth defect class is a construct
       that appears in code and in no learner-facing sentence — so it is named
       here in prose, with both numbers in the brackets explained. */
    body: {
      kk: "Тізбектегі әр санмен істейтін екі-ақ нәрсе бар: оны аламыз немесе өткізіп жібереміз. Барлық нұсқаны түгел қарап шығу қымбат — он саннан 1024 нұсқа, отыз саннан миллиардтан астам нұсқа шығады.\n\nСондықтан жауаптарды кестеге жинаймыз. `dp[i]` — алғашқы i санды пайдаланғанда алуға болатын ең жақсы жауап. Мұндағы i — элементтің орны емес, элементтердің САНЫ: `dp[0]` — бірде-бір сан қаралмаған жағдай, ал `dp[n]` — бүкіл тізбек қаралған жағдай, яғни есептің түпкі жауабы.\n\nКестенің өзі — қарапайым `vector`: `vector<int> dp(n + 1, 0);` деген жазу n + 1 ұяшық жасайды да, әрқайсысына бірден 0 жазады. Бірінші сан — ұзындығы, екіншісі — бастапқы мән. Ұзындығы n емес, n + 1: бізге 0-ден n-ге дейінгі нөмірлер керек. Жаңа құрал керек емес — бұл қазандағы `vector`-дың өзі.\n\nТүрі неге `int`? Себебі мұндағы сандар кішкентай: ұзындығы 1000-нан аспайтын тізбекте әр сан 1000-нан аспайды, демек ең үлкен жауап миллионға жетер-жетпес, ал `int` 2 147 483 647-ге дейін есептейді. Сәуірдің баспалдақ кестелерін `long long` еткенбіз, өйткені ондағы сандар шынымен де тез өсетін. Түрді әдетке айналдырмай, әр есепте «жауап қаншаға жетеді?» деп өзіңнен сұра.",
      ru: "С каждым числом последовательности можно сделать только две вещи: взять его или пропустить. Перебирать все варианты дорого — для десяти чисел их 1024, для тридцати уже больше миллиарда.\n\nПоэтому ответы складывают в таблицу. `dp[i]` — лучший ответ, которого можно добиться, используя первые i чисел. Здесь i — не позиция элемента, а КОЛИЧЕСТВО элементов: `dp[0]` — случай, когда не рассмотрено ни одного числа, а `dp[n]` — когда рассмотрены все, то есть окончательный ответ задачи.\n\nСама таблица — обычный `vector`: запись `vector<int> dp(n + 1, 0);` создаёт n + 1 ячейку и сразу пишет в каждую 0. Первое число — длина, второе — начальное значение. Длина именно n + 1, а не n: нам нужны номера от 0 до n. Новых средств не требуется — это тот же октябрьский `vector`.\n\nПочему тип `int`? Потому что числа здесь маленькие: в последовательности не длиннее 1000 каждое число не больше 1000, значит наибольший ответ едва дотягивает до миллиона, а `int` считает до 2 147 483 647. Апрельские таблицы про лестницу мы делали из `long long`, потому что там числа действительно быстро растут. Не превращай тип в привычку — в каждой задаче спрашивай себя: «до чего дорастёт ответ?»",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n = 6;\n" +
      "    vector<int> dp(n + 1, 0);\n" +
      "    cout << dp.size() << endl;\n" +
      "    dp[1] = 5;\n" +
      "    cout << dp[0] << \" \" << dp[1] << \" \" << dp[6];\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m8.l5.b2",
    type: "worked_example",
    skillRefs: ["dp.core", "dp.table", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    title: {
      kk: "Толық талданған мысал: көрші екі қорапты бірге алмау",
      ru: "Разобранный пример: не берём две соседние коробки",
    },
    problem: {
      kk: "Сөреде қатарынан алты қорап тұр, ұпайлары: 6, 2, 3, 9, 1, 8. Қалаған қораптарды алуға болады, бірақ қатар тұрған екеуін бірге алуға болмайды. Ең көбі қанша ұпай жинауға болады?",
      ru: "На полке подряд стоят шесть коробок с очками: 6, 2, 3, 9, 1, 8. Брать можно любые коробки, но две стоящие рядом брать вместе нельзя. Сколько очков удастся собрать самое большее?",
    },
    steps: [
      {
        kk: "`dp[i]` — алғашқы i қораптың ішінен, көршілес екеуін бірге алмай жинауға болатын ең үлкен ұпай. Есептің жауабы — `dp[6]`.",
        ru: "`dp[i]` — наибольшее число очков, которое можно собрать из первых i коробок, не беря две соседние. Ответ задачи — это `dp[6]`.",
      },
      {
        kk: "Ең кіші жағдайлардан бастаймыз. Бірде-бір қорап қаралмаса, ұпай да жоқ: `dp[0] = 0` — оны кестені жасаған кезде-ақ жазып қойдық. Бір ғана қорап болса, оны алудан ұтылмаймыз, себебі ұпайлар теріс емес: `dp[1] = a[0] = 6`.",
        ru: "Начинаем с самых маленьких случаев. Если не рассмотрено ни одной коробки, очков нет: `dp[0] = 0` — это записалось само при создании таблицы. Если коробка одна, взять её не вредно — очки неотрицательны: `dp[1] = a[0] = 6`.",
      },
      {
        kk: "i ≥ 2 болғанда нұсқа екеу-ақ. Бірінші нұсқа — i-ші қорапты АЛУ. Тізбекте ол `a[i - 1]` деп жазылады, себебі индекс нөлден басталады; оны алсақ, (i - 1)-ші қорапты алуға болмайды, сондықтан оның алдындағы бәрінен `dp[i - 2]` қалады: `take = dp[i - 2] + a[i - 1]`.",
        ru: "При i ≥ 2 вариантов ровно два. Первый — ВЗЯТЬ i-ю коробку. В последовательности она записана как `a[i - 1]`, потому что индексы начинаются с нуля; если её взять, то (i - 1)-ю брать уже нельзя, и от всего, что было раньше, остаётся `dp[i - 2]`: `take = dp[i - 2] + a[i - 1]`.",
      },
      {
        kk: "Екінші нұсқа — i-ші қорапты АЛМАУ. Онда жауап алдыңғы қадамдағыдай қалады: `skip = dp[i - 1]`. Ал `dp[i]` — осы екеуінің үлкені. Дәл осы салыстыру — бүкіл әдістің өзегі.",
        ru: "Второй вариант — НЕ БРАТЬ i-ю коробку. Тогда ответ остаётся таким же, как на предыдущем шаге: `skip = dp[i - 1]`. А `dp[i]` — это большее из двух. Именно это сравнение и есть суть всего метода.",
      },
      {
        kk: "Кестені солдан оңға толтырамыз. i = 2: take = 0 + 2 = 2, skip = 6 → dp[2] = 6. i = 3: take = 6 + 3 = 9, skip = 6 → dp[3] = 9. i = 4: take = 6 + 9 = 15, skip = 9 → dp[4] = 15. i = 5: take = 9 + 1 = 10, skip = 15 → dp[5] = 15. i = 6: take = 15 + 8 = 23, skip = 15 → dp[6] = 23.",
        ru: "Заполняем таблицу слева направо. i = 2: take = 0 + 2 = 2, skip = 6 → dp[2] = 6. i = 3: take = 6 + 3 = 9, skip = 6 → dp[3] = 9. i = 4: take = 6 + 9 = 15, skip = 9 → dp[4] = 15. i = 5: take = 9 + 1 = 10, skip = 15 → dp[5] = 15. i = 6: take = 15 + 8 = 23, skip = 15 → dp[6] = 23.",
      },
      {
        kk: "Жауап — 23, яғни 1-ші, 4-ші және 6-шы қораптар: 6 + 9 + 8. Наурыздағы «ең үлкенін бірінші ал, көршілерін алып таста» ережесі мұнда да 23 береді, бірақ оған сенуге болмайды: `3 4 3` үшін ол 4 береді, ал дұрыс жауап 6.",
        ru: "Ответ — 23, то есть 1-я, 4-я и 6-я коробки: 6 + 9 + 8. Правило «бери сначала самую большую, а соседние выбрасывай» даёт здесь те же 23, но полагаться на него нельзя: для `3 4 3` оно даёт 4, тогда как верный ответ 6.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    a.push_back(6);\n" +
      "    a.push_back(2);\n" +
      "    a.push_back(3);\n" +
      "    a.push_back(9);\n" +
      "    a.push_back(1);\n" +
      "    a.push_back(8);\n" +
      "    int n = 6;\n" +
      "    vector<int> dp(n + 1, 0);\n" +
      "    dp[1] = a[0];\n" +
      "    for (int i = 2; i <= n; i++) {\n" +
      "        int take = dp[i - 2] + a[i - 1];\n" +
      "        int skip = dp[i - 1];\n" +
      "        if (take > skip) {\n" +
      "            dp[i] = take;\n" +
      "        } else {\n" +
      "            dp[i] = skip;\n" +
      "        }\n" +
      "        cout << i << \" \" << take << \" \" << skip << \" \" << dp[i] << endl;\n" +
      "    }\n" +
      "    cout << dp[n];\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Экранға кестенің бес жолы шығады — әр жолда i, take, skip, dp[i]: `2 2 6 6`, `3 9 6 9`, `4 15 9 15`, `5 10 15 15`, `6 23 15 23`. Соңғы жол — жауап: 23.",
      ru: "На экран выходят пять строк таблицы — в каждой i, take, skip, dp[i]: `2 2 6 6`, `3 9 6 9`, `4 15 9 15`, `5 10 15 15`, `6 23 15 23`. Последняя строка — ответ: 23.",
    },
  },
  {
    /*
     * The meaning of the state, asked before any code is written — April's own
     * «Айлық сынақ» sentence.
     *
     * No `code` field on purpose. The rule is stated in the prompt as a
     * sentence, so the card cannot be answered by pattern-matching against a
     * program, and the previous card's program is not reprinted a third time.
     * Both `b2` and this block are untracked, so «жоғарыдағы кесте» is true on
     * every route.
     */
    id: "m8.l5.b3",
    type: "multiple_choice",
    skillRefs: ["dp.core"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Жоғарыдағы кестені еске түсір: `a` тізбегі — 6, 2, 3, 9, 1, 8, ал әр `dp[i]` (i ≥ 2 болғанда) `dp[i - 2] + a[i - 1]` мен `dp[i - 1]` дегеннің үлкені болып толтырылады. Осы кестедегі `dp[i]` нақты нені білдіреді?",
      ru: "Вспомни таблицу выше: последовательность `a` — это 6, 2, 3, 9, 1, 8, а каждое `dp[i]` (при i ≥ 2) заполняется как большее из `dp[i - 2] + a[i - 1]` и `dp[i - 1]`. Что именно означает `dp[i]` в этой таблице?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Алғашқы i санның ішінен, көршілес екеуін бірге алмай жинауға болатын ең үлкен қосынды",
          ru: "Наибольшая сумма, которую можно собрать из первых i чисел, не беря два соседних",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Алғашқы i санның ішінен, i-ші санды міндетті түрде алып жинауға болатын ең үлкен қосынды",
          ru: "Наибольшая сумма из первых i чисел при условии, что i-е число обязательно взято",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Алғашқы i - 1 санның ішінен, көршілес екеуін бірге алмай жинауға болатын ең үлкен қосынды",
          ru: "Наибольшая сумма из первых i - 1 чисел, если не брать два соседних",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Алғашқы i санның қосындысы",
          ru: "Сумма первых i чисел",
        },
      },
    ],
    correctOptionId: "o1",
    /* Only o2 is mapped. o3 (the off-by-one) and o4 are each reachable from
       more than one confusion — o3 from a shifted reading of the table AND
       from simply miscounting the rows, o4 from ignoring the choice AND from
       not reading the option to the end — so the engine asks instead. */
    diagnosticMapping: {
      o2: {
        failureClass: "dp_state_read_as_ending_at_i",
        justification:
          "o2 — «i-ші сан міндетті түрде алынған» деген оқылым. Егер ол рас болса, ереже `dp[i - 1]` нұсқасын мүлде қарамас еді: `dp[i - 1]` дегеннің өзі — i-ші санды АЛМАУ. Демек бұл жауап екі нұсқаның екіншісі оқылмағанын көрсетеді.",
      },
    },
  },
  {
    /*
     * The second family, met first as a prediction. dp[i] here means «the best
     * sum among the segments that END at i», which is a DIFFERENT state from
     * b3's — and that is the point: the same table machinery, a state the
     * learner has to read rather than assume.
     */
    id: "m8.l5.b4",
    type: "prediction",
    skillRefs: ["dp.core", "dp.table"],
    sourceType: "product-authored",
    prompt: {
      kk: "Мұнда `dp[i]` — `a[i]` элементімен АЯҚТАЛАТЫН, қатарынан келетін бөліктердің ең үлкен қосындысы; бөлікте кемінде бір элемент болуы міндетті. Бағдарлама экранға нені шығарады?",
      ru: "Здесь `dp[i]` — наибольшая сумма среди подряд идущих участков, которые ЗАКАНЧИВАЮТСЯ элементом `a[i]`; в участке обязан быть хотя бы один элемент. Что программа выведет на экран?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    a.push_back(3);\n" +
      "    a.push_back(-4);\n" +
      "    a.push_back(5);\n" +
      "    a.push_back(2);\n" +
      "    vector<int> dp(4, 0);\n" +
      "    dp[0] = a[0];\n" +
      "    for (int i = 1; i < 4; i++) {\n" +
      "        if (dp[i - 1] + a[i] > a[i]) {\n" +
      "            dp[i] = dp[i - 1] + a[i];\n" +
      "        } else {\n" +
      "            dp[i] = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[3];\n" +
      "    return 0;\n" +
      "}",
    answer: "7",
    options: ["7", "6", "5", "2"],
    /* 5 is left unmapped and deliberately: it is both dp[2] (the off-by-one)
       and the largest single element (a different confusion entirely), so it
       proves nothing about which one the learner has. */
    diagnosticMapping: {
      "6": {
        failureClass: "dp_state_read_as_prefix_sum",
        justification:
          "6 — тізбектегі барлық санның қосындысы: 3 - 4 + 5 + 2. Бұл жауапқа `dp[i]` дегенді «осы кезге дейінгі сандардың қосындысы» деп оқығанда ғана келуге болады; ондай оқылымда екі нұсқаны салыстыратын шарттың мәні жоғалады.",
      },
    },
  },
  {
    /*
     * The same machine as b2 on new data, with the debug print removed so the
     * learner produces the rows instead of reading them. The list is different
     * and so is every value in the table, and the answer (17) is not the
     * answer to any other card.
     *
     * Row 5 is where the trace earns its place: take = 15 is bigger than
     * everything the learner has written so far, and it still loses to
     * skip = 17. A learner who fills the column by "the newest number wins"
     * gets that row wrong and nothing else.
     */
    id: "m8.l5.b5",
    type: "trace_code",
    skillRefs: ["dp.table", "dp.core", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Бағдарламаны қағазда орында. Циклдің әр өтуіне бір жол жаз: сол өтудегі `i`, `take`, `skip` және `dp[i]`-ге жазылған мән. Бірінші жол — цикл алдындағы 15-жолдағы `dp[1]`, соңғы жол — 25-жолда экранға шығатын `dp[6]`.",
      ru: "Выполни программу на бумаге. На каждый проход цикла запиши одну строку: `i`, `take`, `skip` и то значение, которое получило `dp[i]` на этом проходе. Первая строка — это `dp[1]` из строки 15, до цикла, последняя — `dp[6]`, которое выводится на экран в строке 25.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a;\n" +
      "    a.push_back(2);\n" +
      "    a.push_back(8);\n" +
      "    a.push_back(3);\n" +
      "    a.push_back(3);\n" +
      "    a.push_back(9);\n" +
      "    a.push_back(4);\n" +
      "    int n = 6;\n" +
      "    vector<int> dp(n + 1, 0);\n" +
      "    dp[1] = a[0];\n" +
      "    for (int i = 2; i <= n; i++) {\n" +
      "        int take = dp[i - 2] + a[i - 1];\n" +
      "        int skip = dp[i - 1];\n" +
      "        if (take > skip) {\n" +
      "            dp[i] = take;\n" +
      "        } else {\n" +
      "            dp[i] = skip;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n];\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 15, vars: { "dp[1]": "2" } },
      { line: 16, vars: { i: "2", take: "8", skip: "2", "dp[i]": "8" } },
      { line: 16, vars: { i: "3", take: "5", skip: "8", "dp[i]": "8" } },
      { line: 16, vars: { i: "4", take: "11", skip: "8", "dp[i]": "11" } },
      { line: 16, vars: { i: "5", take: "17", skip: "11", "dp[i]": "17" } },
      { line: 16, vars: { i: "6", take: "15", skip: "17", "dp[i]": "17" } },
      { line: 25, vars: { "dp[6]": "17" } },
    ],
  },
  {
    /*
     * The empty-choice decision, met as a defect.
     *
     * `symptomInput` is declared and it has to be: on a single number, and on
     * any all-positive list, the broken program and the repaired one agree, so
     * the numeric probe would report them identical. All-negative data is the
     * only witness, which is the whole lesson of the card. In C++ the probe
     * would be worse than useless — a bare `5` would be read as n = 5 and the
     * five numbers after it would never arrive.
     */
    id: "m8.l5.b6",
    type: "find_bug",
    skillRefs: ["dp.core", "debug.boundary", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама күндердің пайдасы берілгенде, қатарынан келетін күндердің ең үлкен қосындысын табуы керек. Бірінші жолда n саны, екінші жолда n күннің пайдасы беріледі. Шарт бойынша кемінде бір күн алынуы МІНДЕТТІ. Бірақ `4` және `-6 -2 -9 -4` енгізгенде ол 0 шығарады, ал бірде-бір күн жиынтығынан 0 қосынды шықпайды. Қай жол кінәлі?",
      ru: "Программа должна находить наибольшую сумму подряд идущих дней, когда дана прибыль каждого дня. В первой строке дано n, во второй — прибыль n дней. По условию хотя бы один день взять ОБЯЗАТЕЛЬНО. Но при вводе `4` и `-6 -2 -9 -4` она выводит 0, хотя ни один набор дней не даёт в сумме 0. Какая строка виновата?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int cur = a[0];\n" +
      "    int best = 0;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (cur + a[i] > a[i]) {\n" +
      "            cur = cur + a[i];\n" +
      "        } else {\n" +
      "            cur = a[i];\n" +
      "        }\n" +
      "        if (cur > best) {\n" +
      "            best = cur;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 13,
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int cur = a[0];\n" +
      "    int best = a[0];\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (cur + a[i] > a[i]) {\n" +
      "            cur = cur + a[i];\n" +
      "        } else {\n" +
      "            cur = a[i];\n" +
      "        }\n" +
      "        if (cur > best) {\n" +
      "            best = cur;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    symptomInput: "4\n-6 -2 -9 -4",
    diagnosticMapping: {
      "12": {
        failureClass: "accumulator_initial_value_ignored",
        justification:
          "12-жол дұрыс: `cur` тізбектің өз элементінен басталады. Бұл жауап `cur` мен `best`-ті бір нәрсе деп оқығанды көрсетеді. Қате 13-жолда: `best` тізбекте мүлде жоқ 0 санынан басталады, сондықтан барлық қосынды теріс болғанда ол бір рет те жаңармайды.",
      },
    },
  },
  {
    /*
     * The better-of-two line, completed. Three blanks and each one is a
     * decision the lesson has argued for: where the best-so-far starts (the
     * defect the card before this one repaired), which of the two options
     * counts as better, and which cell the segment is extended from.
     *
     * The completed program is a correct answer to the "at least one element"
     * rule — and therefore NOT to b8, which is the next graded task. See the
     * file header, decision 2.
     */
    id: "m8.l5.b7",
    type: "fill_blank",
    skillRefs: ["dp.table", "dp.core", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама сандардың ішінен, қатарынан келетін ең үлкен қосындысы бар бөлікті табуы керек. Бірінші жолда n саны, екінші жолда n бүтін сан беріледі. Бөлікте кемінде бір сан болуы міндетті, сондықтан жауап теріс те болуы мүмкін. Мұндағы `dp[i]` — `a[i]` элементімен аяқталатын бөліктердің ең үлкен қосындысы. Үш орынды толтыр.",
      ru: "Программа должна найти среди чисел подряд идущий участок с наибольшей суммой. В первой строке дано n, во второй — n целых чисел. В участке обязан быть хотя бы один элемент, поэтому ответ может оказаться и отрицательным. Здесь `dp[i]` — наибольшая сумма участков, заканчивающихся элементом `a[i]`. Заполни три пропуска.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> dp(n, 0);\n" +
      "    dp[0] = a[0];\n" +
      "    int best = ___;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (dp[i - 1] + a[i] ___ a[i]) {\n" +
      "            dp[i] = dp[___] + a[i];\n" +
      "        } else {\n" +
      "            dp[i] = a[i];\n" +
      "        }\n" +
      "        if (dp[i] > best) {\n" +
      "            best = dp[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "dp[0]", alternatives: ["a[0]"] },
      { id: "f2", answer: ">" },
      { id: "f3", answer: "i - 1", alternatives: ["i-1"] },
    ],
  },
  {
    /*
     * PDF p.10: «тізімнің ең үлкен қосындысы бар бөлігін табу».
     *
     * The rule about the empty choice is the opposite of b6's and b7's, it is
     * stated in capitals in both languages, and `3 / -5 -2 -9 → 0` is VISIBLE
     * so a learner meets the difference before a hidden case judges it.
     *
     * Each case was chosen against a program that is not the intended method,
     * and each of those programs was executed against the whole set:
     *   `3 -5 4 2`  → the sum of the whole list (2), and a loop that stops one
     *                 element short (3);
     *   `-5 -2 -9`  → the "at least one element" rule from b6/b7 (-2);
     *   `4 -1 4`    → adding up only the positive numbers (8), and taking the
     *                 largest single number (4);
     *   `-5 6`      → a running sum that is never reset to 0 (1);
     *   `5 5 -1`    → printing the running sum instead of the best one (9);
     *   `1 2 3`     → the missed last element again, on all-positive data (3);
     *   `-7`        → a best-so-far started at a[0] (-7);
     *   `7`         → one element, the loop body running exactly once.
     *
     * Bounds are stated because C++ makes them the author's job: at n ≤ 1000
     * and |profit| ≤ 1000 the largest possible answer is 10^6, so `int` is
     * honest and no `long long` is needed anywhere in this task.
     */
    id: "m8.l5.b8",
    type: "write_code",
    skillRefs: ["dp.core", "lists.traverse", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    prompt: {
      kk: "Мектеп дүкені бірнеше күн жұмыс істеді. Бірінші жолда n саны — күндер саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлініп n күннің пайдасы беріледі, әр санның модулі 1000-нан аспайды; сан теріс болса, ол күні дүкен зиян шеккен. Қатарынан келетін күндердің кез келген бөлігін таңдап, солардың қосындысын аласың. Ең үлкен қосындыны шығар. НАЗАР АУДАР: алдыңғы карточкалардағыдан айырмашылығы — мұнда бірде-бір күнді таңдамауға да болады, ондай жағдайда қосынды 0-ге тең. Сондықтан барлық күн зиянды болса, жауап 0. Мысалы, `4` және `3 -5 4 2` үшін жауап 6, ал `3` және `-5 -2 -9` үшін жауап 0.",
      ru: "Школьный магазин работал несколько дней. В первой строке дано число n — количество дней (1 ≤ n ≤ 1000). Во второй строке через пробел дана прибыль каждого из n дней, каждое число по модулю не больше 1000; отрицательное число означает, что в этот день магазин сработал в убыток. Ты выбираешь любой участок подряд идущих дней и берёшь их сумму. Выведи наибольшую сумму. ВНИМАНИЕ: в отличие от предыдущих карточек, здесь разрешено не выбирать ни одного дня — тогда сумма равна 0. Поэтому если все дни убыточны, ответ равен 0. Например, для `4` и `3 -5 4 2` ответ 6, а для `3` и `-5 -2 -9` ответ 0.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int cur = 0;\n" +
      "    int best = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        cur = cur + x;\n" +
      "        if (cur < 0) {\n" +
      "            cur = 0;\n" +
      "        }\n" +
      "        if (cur > best) {\n" +
      "            best = cur;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 -5 4 2", expectedOutput: "6" },
      { input: "3\n-5 -2 -9", expectedOutput: "0" },
      { input: "3\n4 -1 4", expectedOutput: "7", hidden: true },
      { input: "2\n-5 6", expectedOutput: "6", hidden: true },
      { input: "3\n5 5 -1", expectedOutput: "10", hidden: true },
      { input: "3\n1 2 3", expectedOutput: "6", hidden: true },
      { input: "1\n-7", expectedOutput: "0", hidden: true },
      { input: "1\n7", expectedOutput: "7", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m8.l5.b9 — the same problem, assembled instead
     * of written from a blank editor. PDF p.6: «дайын кодты құрастыру мен
     * толықтыру көбірек, нөлден жазу азырақ». Support meets the whole family;
     * it just does not meet an empty editor for it.
     *
     * Eleven pieces rather than Python's ten, because a C++ program carries a
     * frame: the first piece is the header and `int main() {`, the last is the
     * output and `return 0; }`. Neither can go anywhere else, and neither is
     * the exercise — the nine between them are.
     *
     * The Python version relied on indentation being uninformative (six of its
     * nine lines sat at indent 0). C++ indentation is a stronger hint, so the
     * decisions were chosen to survive it: `vector<int> a(n, 0)` must precede
     * the loop that fills it, `vector<int> dp(n + 1, 0)` must come after `n` is
     * read and before `dp[1]` is written, `dp[1] = a[0]` must be above the loop
     * and not below it, and the two branch bodies — take and skip — sit at the
     * SAME indent, so which one belongs to the `if` and which to the `else` is
     * decided by the recurrence and by nothing else. That last pair is the
     * exercise.
     */
    id: "m8.l5.b9s",
    type: "reorder_code",
    skillRefs: ["dp.table", "dp.core", "lists.traverse"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бөліктерді дұрыс ретке қой. Бағдарлама бірінші жолдан n санын, екінші жолдан n теріс емес санды оқып, көрші екеуін бірге алмау шартымен жинауға болатын ең үлкен қосындыны шығаруы керек. `dp[i]` — алғашқы i санның ішінен жинауға болатын ең үлкен қосынды: i-ші санды алсаң, оған `dp[i - 2]` қосылады, алмасаң — `dp[i - 1]` сол күйінде қалады. Бірінші және соңғы бөлік — бағдарламаның жақтауы, қалғандарының ретін өзің шеш.",
      ru: "Расставь части по порядку. Программа должна прочитать из первой строки число n, из второй — n неотрицательных чисел, и вывести наибольшую сумму, которую можно собрать, не беря два соседних числа. `dp[i]` — наибольшая сумма, которую можно собрать из первых i чисел: если i-е число взято, к нему прибавляется `dp[i - 2]`, а если не взято, остаётся `dp[i - 1]`. Первая и последняя части — рамка программы, порядок остальных реши сам.",
    },
    lines: [
      {
        id: "r1",
        code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {",
      },
      { id: "r2", code: "    int n;" },
      { id: "r3", code: "    cin >> n;" },
      { id: "r4", code: "    vector<int> a(n, 0);" },
      { id: "r5", code: "    for (int i = 0; i < n; i++) cin >> a[i];" },
      { id: "r6", code: "    vector<int> dp(n + 1, 0);" },
      { id: "r7", code: "    dp[1] = a[0];" },
      { id: "r8", code: "    for (int i = 2; i <= n; i++) {" },
      { id: "r9", code: "        if (dp[i - 2] + a[i - 1] > dp[i - 1]) dp[i] = dp[i - 2] + a[i - 1];" },
      { id: "r10", code: "        else dp[i] = dp[i - 1];" },
      { id: "r11", code: "    }" },
      { id: "r12", code: "    cout << dp[n];\n    return 0;\n}" },
    ],
    correctOrder: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11", "r12"],
  },
  {
    /*
     * PDF p.10: «көрші екі санды қатар алмау шартымен таңдау».
     *
     * The degenerate programs this task exists to refuse, each one executed
     * against the whole case set before the set was frozen:
     *   `5 1 1 5`         → taking every other number (6 either way, answer 10);
     *   `4 5 4`           → the greedy rule from m8.l1: take the largest, drop
     *                       its neighbours (5, answer 8);
     *   `3 8`             → adding the whole list (11), and taking the largest
     *                       single number (8 by luck here, killed by `3 4 5 1`);
     *   `1 9 1`           → a program that always takes the last number (2);
     *   `7`               → a table that assumes at least two numbers — it
     *                       writes past the end of a two-cell table here
     *                       instead of quietly answering;
     *   `9 1 1 9 1 1 9`   → every-other again, on a longer list (20, answer 27);
     *   `1 2 3 4 5`       → a loop written `i < n` instead of `i <= n`, which
     *                       prints an untouched dp[n] (0);
     *   `0 0 0`           → all zeros, where nothing ever updates and the
     *                       answer still has to come out.
     *
     * Bounds: n ≤ 1000 and each score ≤ 1000, so the largest possible answer is
     * 500 000 and `int` is honest.
     */
    id: "m8.l5.b9",
    type: "write_code",
    skillRefs: ["dp.core", "dp.table", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: 10,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі — қатарынан тұрған қораптардың саны (1 ≤ n ≤ 1000). Екінші жолда бос орынмен бөлініп n теріс емес бүтін сан беріледі — қораптардың ұпайлары, әрқайсысы 1000-нан аспайды. Қалаған қорапты алуға болады, бірақ қатар тұрған екеуін бірге алуға болмайды. Жинауға болатын ең үлкен ұпайды шығар. Мысалы, `4` және `3 4 5 1` үшін жауап 8 (3 пен 5), ал `4` және `5 1 1 5` үшін жауап 10.",
      ru: "В первой строке дано число n — количество коробок, стоящих подряд (1 ≤ n ≤ 1000). Во второй строке через пробел даны n неотрицательных целых чисел — очки коробок, каждое не больше 1000. Брать можно любые коробки, но две стоящие рядом брать вместе нельзя. Выведи наибольшее число очков, которое удастся собрать. Например, для `4` и `3 4 5 1` ответ 8 (3 и 5), а для `4` и `5 1 1 5` ответ 10.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n, 0);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    vector<int> dp(n + 1, 0);\n" +
      "    dp[1] = a[0];\n" +
      "    for (int i = 2; i <= n; i++) {\n" +
      "        if (dp[i - 2] + a[i - 1] > dp[i - 1]) {\n" +
      "            dp[i] = dp[i - 2] + a[i - 1];\n" +
      "        } else {\n" +
      "            dp[i] = dp[i - 1];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << dp[n];\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n3 4 5 1", expectedOutput: "8" },
      { input: "4\n5 1 1 5", expectedOutput: "10" },
      { input: "3\n4 5 4", expectedOutput: "8", hidden: true },
      { input: "1\n7", expectedOutput: "7", hidden: true },
      { input: "2\n3 8", expectedOutput: "8", hidden: true },
      { input: "3\n1 9 1", expectedOutput: "9", hidden: true },
      { input: "3\n0 0 0", expectedOutput: "0", hidden: true },
      { input: "7\n9 1 1 9 1 1 9", expectedOutput: "27", hidden: true },
      { input: "5\n1 2 3 4 5", expectedOutput: "9", hidden: true },
    ],
  },
];
