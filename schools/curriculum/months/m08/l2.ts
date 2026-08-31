import type { LessonBlock } from "../../types";

/**
 * Lesson m8.l2 · «Қарсы мысал» / «Контрпример». 9 min.
 * PDF p.10, April. Skills: `greedy.counterexample`, `enumerate.all`.
 *
 * ## The clause that makes this the month's central lesson
 *
 * April's «Түсіндіру қалай беріледі» paragraph is unusually blunt about what
 * the platform is for:
 *
 *   «Мұнда маңыздысы - дайын әдісті жаттау емес, қарсы мысал іздеу дағдысы.
 *    Платформа ықтимал стратегияны ұсынып, оқушыдан оны шағын мысалда бұзып
 *    көруді сұрайды.»
 *
 * The platform PROPOSES a strategy and asks the learner to break it. So most of
 * this lesson is the product being wrong on purpose, and `test_case` — whose
 * `breakingInputs` is literally "name the input that breaks it" — is the main
 * event rather than a garnish: `b3` and `b5` are two proposed rules for two
 * different problems, and in both the answer the learner produces IS an input.
 *
 * The family the practice paragraph names drives `b2`, `b3`, `b4` and `b9`:
 *
 *   «соманы ең аз монетамен жинап көріп оның қай кезде қателесетінін табу»
 *
 * — collect the sum with the fewest coins and find WHEN that goes wrong. The
 * two coin sets are the lesson: with 1, 5, 10, 25 the greedy rule is right, and
 * with 1, 3, 4 it takes 4 + 1 + 1 for six where 3 + 3 does it in two. Both sets
 * appear, and the second is worked in full in `b2`.
 *
 * ## The method, and why it is February's
 *
 * «шағын мысалда» — on a SMALL example. That is not a hint about effort, it is
 * the whole technique: when the inputs are small enough, the honest best answer
 * can be computed by checking every variant, and comparing the rule's answer
 * against the honest one over every small input finds the counterexample for
 * you. That is `enumerate.all`, taught in February («Нұсқалар аз болғанда
 * барлық мүмкін нұсқаны жүйелі түрде тексеру»), now pointed at a strategy
 * instead of at a problem. `b8` states the three steps in words; `b6` builds
 * the exhaustive check by transforming a greedy one; `b9` is the full sweep.
 *
 * `b8` also states the limit out loud, because it is the honest half of the
 * method and the half that gets forgotten: agreeing on every small input is not
 * a proof, it only means the counterexample is not small. That sentence is what
 * `b10` then asks the learner to act on.
 *
 * ## The C++17 migration: what changed, and what did not
 *
 * **No number changed.** Every quantity in this lesson is tiny — sums to 40,
 * four items, coin counts under 41 — so nothing here can approach 2^31−1 and
 * `int` is honest everywhere. No `long long` appears and no expected output
 * moved.
 *
 * **The input format did.** Three programs used to read «a line of numbers»
 * whose length was implied by the line break. C++ has no beginner-safe way to
 * do that — `cin >>` does not know where a line ends — so `b3` and `b5` now
 * read a COUNT first and then that many numbers, on three lines instead of two.
 * Their prompts say so and their `breakingInputs` carry the count. `b6`, `b9`
 * and `b9s` needed nothing: their lengths were always fixed at 4 and 3.
 *
 * **One off-by-one is genuinely gone.** `b9s`'s first blank used to be `41`,
 * because Python's `range(1, 41)` stops one short of its bound. C++'s loop is
 * written `n <= 40` and the blank is now the stated upper end itself. That
 * makes one of the five blanks easier; it is not hidden, and the other four are
 * unchanged.
 *
 * **Timing is re-derived, and nothing needed moving.** The exhaustive sweep in
 * `b9` is at most about 200 000 additions over the whole run, and `b6` checks
 * 16 subsets. Both were far inside Python's budget and are far inside C++'s.
 *
 * ## Requirements a checker cannot see: option 1, and it genuinely applies
 *
 * "Your solution must use brute force" is exactly the unenforceable rule the
 * contract's fourth defect class is about — output comparison sees output. No
 * block below states one. It does not need to, because in both coding tasks the
 * enumeration is forced by the ANSWER:
 *
 * - `b9` prints the true minimum next to the greedy one. A program that runs
 *   the rule twice prints `6 3 3` where the visible case wants `6 3 2`, and
 *   nothing but an exhaustive check produces that second number.
 * - `b6` prints the heaviest legal load. The greedy it starts from prints 7 on
 *   the visible case that wants 8, so keeping the rule fails in the open.
 *
 * The written defence in `b10` is the contract's option 3: what a proof is, and
 * what a counterexample would have to contain, is read by a teacher and settles
 * as `unknown`. Nothing below pretends to machine-score an argument.
 *
 * ## Every program here, and why none of them is another's answer
 *
 * Checked with a byte comparison over the whole month, not by eye:
 *
 * - `b2` shows the exhaustive check for ONE fixed target (6 from 1, 3, 4),
 *   written by counting fours and threes and filling the rest with ones.
 * - `b3` shows the greedy for a coin list read from input.
 * - `b4` is that same rule with the list and the sum written in, so it can be
 *   predicted — a shown program, never an answer.
 * - `b5` shows the heaviest-first bag rule; `b6` starts from a different and
 *   weaker bag rule (given order), and its answer is the 16-variant check.
 * - `b9`'s solution is a sweep over forty targets containing both a greedy and
 *   a general enumeration with bounds from the input. Neither `b2`'s fixed
 *   loops nor `b6`'s take-or-leave loops can be transcribed into it.
 * - `b9s` is `b9`'s support twin: its filled template IS `b9`'s solution, which
 *   is the substitution mechanism p.6 asks for, and no learner receives both.
 *
 * ## No new C++
 *
 * April introduces no construct here. `vector<int>` and `push_back` are
 * October's, `sort` is December's, the nested loops are October's, `break` is
 * October's, `cin >>` inside a counted loop is September's and October's. The
 * DP table — `vector<int> dp(n + 1, 0);` — is deliberately NOT here: `m8.l3`
 * introduces it, and a table would answer the coin question by a method this
 * lesson has not earned yet. Every "true best" below is an honest enumeration.
 *
 * ## What is left to the other lessons
 *
 * The interval family and the correct-greedy case are `m8.l1`'s. All four DP
 * lessons are `m8.l3`–`m8.l5`. The coin problem returns in the practice bank
 * (`m8.p2`, `m8.p3`) as two separate tasks — the greedy answer alone, and the
 * true best alone — so nothing here is a rerun of them or they of it.
 */

const P = 10; // PDF page for all of April

export const M8_L2: LessonBlock[] = [
  {
    id: "m8.l2.b1",
    type: "concept",
    skillRefs: ["greedy.counterexample"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Бір қарсы мысал ережені жояды",
      ru: "Один контрпример убивает правило",
    },
    body: {
      kk: "Ашкөз ереже — ұсыныс, дәлел емес. «Әр қадамда ең тиімдісін ал» деген ой он мысалда дұрыс жауап берсе де, ол әлі ештеңені дәлелдемейді: он мысал — бар болғаны он мысал. Ал ереже бір ғана кірісте ең жақсы жауаптан нашар жауап берсе, бәрі бітті — ереже қате. Мұндағы логика симметриялы емес: сәтті мысалдың саны қанша болса да, ол ережені дәлелдей алмайды, ал бір ғана сәтсіз мысал оны жоққа шығарады. Сол бір кіріс қарсы мысал деп аталады. Сондықтан жаңа ереже ойлап тапқанда бірінші істейтініміз — оны сындыруға тырысу, ал кодқа содан кейін отырамыз.",
      ru: "Жадное правило — это предложение, а не доказательство. Даже если мысль «на каждом шаге бери самое выгодное» дала верный ответ на десяти примерах, она ещё ничего не доказывает: десять примеров — это всего лишь десять примеров. Но если правило хотя бы на одном вводе даёт ответ хуже наилучшего, всё кончено — правило неверно. Логика здесь несимметрична: сколько бы удачных примеров ни было, они правило не доказывают, а один неудачный его опровергает. Такой ввод называется контрпримером. Поэтому, придумав новое правило, первым делом мы пытаемся его сломать, а за код садимся уже потом.",
    },
  },
  {
    /*
     * The programme's own coin setup, worked to the end. The greedy half is
     * arithmetic and belongs in the steps; the code is the exhaustive check for
     * this one target, which is the first time a learner sees a rule and an
     * honest best answer computed side by side.
     *
     * The four ways to make 6 are listed in full because the claim being made
     * is "there is nothing shorter than 3 + 3", and that claim is only honest
     * if the list is complete. Step 4 is where the method turns mechanical.
     */
    id: "m8.l2.b2",
    type: "worked_example",
    skillRefs: ["greedy.counterexample", "greedy.core", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "1, 3, 4 монеталары: ашкөз ереже қай жерде жеңіледі",
      ru: "Монеты 1, 3, 4: где жадное правило проигрывает",
    },
    problem: {
      kk: "Монеталардың номиналдары: 1, 3 және 4. Әр номиналды қалағаныңша рет алуға болады. 6 сомасын ең аз монетамен жинау керек. Ұсынылған ереже: әрқашан сыятын ең үлкен монетаны ал. Ереже дұрыс па?",
      ru: "Номиналы монет: 1, 3 и 4. Каждый номинал можно брать сколько угодно раз. Нужно собрать сумму 6 наименьшим числом монет. Предложенное правило: всегда бери самую крупную монету, которая помещается. Верно ли оно?",
    },
    steps: [
      {
        kk: "Алдымен ережені орындаймыз. 6-ға 4 сыяды: аламыз, қалдық 2. 2-ге 4 те, 3 те сыймайды, сондықтан 1 аламыз — қалдық 1. Тағы 1 аламыз — қалдық 0. Ереже 4 + 1 + 1 деген үш монета берді.",
        ru: "Сначала выполняем правило. В 6 помещается 4: берём, остаток 2. В 2 не помещаются ни 4, ни 3, поэтому берём 1 — остаток 1. Берём ещё 1 — остаток 0. Правило дало 4 + 1 + 1, то есть три монеты.",
      },
      {
        kk: "Енді 6-ны жинаудың барлық тәсілін жазып шығамыз, олар көп емес: 1+1+1+1+1+1 (алты монета), 3+1+1+1 (төрт монета), 4+1+1 (үш монета), 3+3 (екі монета). Тізім осымен бітті, басқа тәсіл жоқ.",
        ru: "Теперь выпишем все способы собрать 6, их немного: 1+1+1+1+1+1 (шесть монет), 3+1+1+1 (четыре монеты), 4+1+1 (три монеты), 3+3 (две монеты). На этом список закончен, других способов нет.",
      },
      {
        kk: "Ең қысқасы — 3 + 3, екі монета. Ереже үшеуін алды, ал екеуі жеткілікті екен. Демек ереже бұзылды. Оның 1, 5, 10, 25 монеталарында әрқашан дұрыс жұмыс істейтіні енді ештеңені құтқармайды: бір қарсы мысал жеткілікті.",
        ru: "Самый короткий способ — 3 + 3, две монеты. Правило взяло три, а хватает двух. Значит, правило сломано. То, что на монетах 1, 5, 10, 25 оно всегда работает верно, теперь ничего не спасает: одного контрпримера достаточно.",
      },
      {
        kk: "Дәл осындай тексеруді машина да істей алады. 6 үшін төрттіктің саны 0 не 1, үштіктің саны 0, 1 не 2, ал қалғанын бірліктермен толтырамыз. Ақпанда істегеніміздей, барлық нұсқаны аралап шығып, ең кіші жалпы санды сақтаймыз. `int best = -1;` дегеніміз «әзірше бірде-бір нұсқа қаралмады».",
        ru: "Такую же проверку умеет делать и машина. Для 6 число четвёрок равно 0 или 1, число троек — 0, 1 или 2, а остаток добираем единицами. Как и в феврале, перебираем все варианты и запоминаем наименьшее общее число. Запись `int best = -1;` означает «пока не рассмотрен ни один вариант».",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int best = -1;\n" +
      "    for (int k = 0; k < 2; k++) {\n" +
      "        for (int j = 0; j < 3; j++) {\n" +
      "            int rest = 6 - 4 * k - 3 * j;\n" +
      "            if (rest >= 0) {\n" +
      "                int total = k + j + rest;\n" +
      "                if (best == -1 || total < best) {\n" +
      "                    best = total;\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Бағдарлама 2 шығарады. Ашкөз ереже үш монета алды, ал шын ең аз саны — екеу.",
      ru: "Программа выводит 2. Жадное правило взяло три монеты, а настоящий минимум — две.",
    },
  },
  {
    /*
     * The first proposal the learner has to break themselves, and the first
     * place `breakingInputs` carries the answer.
     *
     * 1, 3, 4 is excluded by the prompt because `b2` just broke it in full —
     * naming it back would be transcription, not work. The declared witnesses
     * are three different coin sets, each verified: 1 4 5 / 8 (greedy 4 against
     * 4 + 4), 1 5 6 / 10 (greedy 5 against 5 + 5), 1 6 10 / 12 (greedy 3
     * against 6 + 6). Any set whose two larger coins pair up just under a
     * multiple of the largest works, which is the pattern a learner who has
     * understood `b2` will reach for.
     *
     * The input is three lines rather than two: C++ cannot be told where a line
     * of numbers ends, so the count comes first. The witnesses carry it.
     *
     * The prompt asks for the better combination as well as the input, because
     * an input alone is a guess and a teacher cannot tell the two apart.
     */
    id: "m8.l2.b3",
    type: "test_case",
    skillRefs: ["greedy.counterexample", "greedy.core", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама бірінші жолдан k санын — монета номиналдарының санын, екінші жолдан сол k номиналды (өсу ретімен, ең кішісі әрқашан 1), үшінші жолдан соманы оқиды. Ол ашкөз ережені орындайды: әрқашан сыятын ең үлкен монетаны алады, сосын неше монета алғанын шығарады.\n\n`4`\n`1 5 10 25`\n`30`\n\nүшін ол 2 шығарады — дұрыс жауап, әрі осы жиында оны сындыратын сома әлі ешкім таппаған. Ал сен басқа жиынды тап: бағдарлама шын қажеттіден КӨП монета алатын кіріс жаз. Шарттар: монета саны 4-тен аспасын, әр номинал 20-дан, сома да 20-дан аспасын, ең кіші номинал 1 болсын. 1, 3, 4 жиыны есептелмейді — ол жоғарыда талданды. Кірістің қасына аз монетамен жинаудың нақты тәсілін де жаз.",
      ru: "Эта программа читает из первой строки число k — количество номиналов, из второй — сами k номиналов (в порядке возрастания, самый маленький всегда 1), из третьей — сумму. Она выполняет жадное правило: всегда берёт самую крупную монету, которая помещается, а затем печатает, сколько монет взяла.\n\n`4`\n`1 5 10 25`\n`30`\n\nздесь она выводит 2 — верный ответ, и на этом наборе до сих пор никто не нашёл суммы, которая её ломает. А ты найди другой набор: напиши ввод, на котором программа берёт БОЛЬШЕ монет, чем нужно. Условия: монет не больше четырёх, каждый номинал не больше 20, сумма тоже не больше 20, самый маленький номинал равен 1. Набор 1, 3, 4 не засчитывается — он разобран выше. Рядом с вводом напиши и сам способ собрать сумму меньшим числом монет.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    vector<int> c;\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        c.push_back(x);\n" +
      "    }\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    int rest = n;\n" +
      "    int taken = 0;\n" +
      "    for (int i = k - 1; i >= 0; i--) {\n" +
      "        taken = taken + rest / c[i];\n" +
      "        rest = rest % c[i];\n" +
      "    }\n" +
      "    cout << taken;\n" +
      "    return 0;\n" +
      "}",
    breakingInputs: ["3\n1 4 5\n8", "3\n1 5 6\n10", "3\n1 6 10\n12"],
  },
  {
    /*
     * The rule is broken and the learner must still predict what it PRINTS.
     *
     * The prompt hands over the true best (three coins) on purpose, so the only
     * road to the answer 3 is answering the intention instead of the run —
     * which makes that mapping safe. Getting 4 requires actually carrying
     * 10 → 4, 4 → 2 → 1, 1 through the loop.
     *
     * 10 is left unmapped although it is the smallest-coin-first reading: a
     * learner may equally have miscounted the ones, and two causes means the
     * engine asks rather than tells. 5 is a plain slip and also unmapped.
     */
    id: "m8.l2.b4",
    type: "prediction",
    skillRefs: ["greedy.core", "greedy.counterexample"],
    sourceType: "product-authored",
    prompt: {
      kk: "Дәл сол ашкөз ереже, тек монеталар мен сома бағдарламаның ішіне жазылып қойылған. 10 сомасын шын мәнінде үш монетамен жинауға болады: 4 + 3 + 3. Ал бағдарлама экранға нені шығарады? Оны қағазда қадамдап орында да, ереже НЕ ІСТЕУІ КЕРЕК еді дегенді емес, ол шын мәнінде нені басып шығаратынын жаз.",
      ru: "То же самое жадное правило, только монеты и сумма уже вписаны в программу. Сумму 10 на самом деле можно собрать тремя монетами: 4 + 3 + 3. А что напечатает программа? Выполни её по шагам на бумаге и напиши не то, что правилу СЛЕДОВАЛО БЫ сделать, а то, что она действительно выведет.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> c;\n" +
      "    c.push_back(1);\n" +
      "    c.push_back(3);\n" +
      "    c.push_back(4);\n" +
      "    int n = 10;\n" +
      "    int rest = n;\n" +
      "    int taken = 0;\n" +
      "    for (int i = 2; i >= 0; i--) {\n" +
      "        taken = taken + rest / c[i];\n" +
      "        rest = rest % c[i];\n" +
      "    }\n" +
      "    cout << taken;\n" +
      "    return 0;\n" +
      "}",
    answer: "4",
    options: ["3", "4", "5", "10"],
    diagnosticMapping: {
      "3": {
        failureClass: "answered_the_intent_not_the_run",
        justification:
          "Үш монета — тапсырманың өзі айтып тұрған ең жақсы жауап (4 + 3 + 3), ал ашкөз ереже екі төрттік пен екі бірлікті алады. Сондықтан 3 деген жауап тек бағдарламаның орындалуын емес, оның ниетін жазғанда шығады.",
      },
    },
  },
  {
    /*
     * A second proposal, deliberately on a different problem, so the lesson
     * cannot be read as "coins are a special case". Same shape of answer: the
     * learner names the input.
     *
     * All three witnesses were run: 6 5 5 1 / 10 packs 7 against 5 + 5, 9 6 5 /
     * 11 packs 9 against 6 + 5, 8 5 5 / 10 packs 8 against 5 + 5. The sample in
     * the prompt (3 3 4 into 10) fills the bag exactly, so the card opens with
     * the rule succeeding — a proposal nobody has seen succeed is not a
     * proposal, it is a straw man.
     *
     * Three lines rather than two, for the same reason as `b3`.
     */
    id: "m8.l2.b5",
    type: "test_case",
    skillRefs: ["greedy.counterexample", "greedy.core", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Екінші ұсыныс, енді басқа есеп. Бірінші жолда k саны — заттар саны, екінші жолда сол k заттың салмағы (кез келген ретпен), үшінші жолда сөмкенің сыйымдылығы беріледі. Ереже: сыятын ең ауыр затты ал, содан кейін қалғандарының ішінен тағы сыятын ең ауырын ал, солай жалғастыр. Бағдарлама сөмкеге салынған жалпы салмақты шығарады.\n\n`3`\n`3 3 4`\n`10`\n\nүшін ол 10 шығарады — сөмке тап-толық. Осы ережені сындыратын кіріс жаз: дәл сол заттардан сөмкені ауырырақ толтыруға болатын болсын. Шарттар: зат саны 4-тен аспасын, әр салмақ пен сыйымдылық 20-дан аспасын. Қай заттарды алған дұрыс болатынын және жалпы салмағы қанша шығатынын да жаз.",
      ru: "Второе предложение, теперь на другой задаче. В первой строке дано число k — количество предметов, во второй — веса этих k предметов (в произвольном порядке), в третьей — вместимость рюкзака. Правило: возьми самый тяжёлый предмет, который помещается, затем из оставшихся снова самый тяжёлый, который помещается, и так далее. Программа выводит суммарный вес того, что уложено.\n\n`3`\n`3 3 4`\n`10`\n\nздесь она выводит 10 — рюкзак заполнен ровно под завязку. Придумай ввод, который ломает это правило: из тех же предметов рюкзак можно набить тяжелее. Условия: предметов не больше четырёх, каждый вес и вместимость не больше 20. Напиши также, какие предметы стоило взять и какой суммарный вес получается.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "#include <algorithm>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    vector<int> w;\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        w.push_back(x);\n" +
      "    }\n" +
      "    sort(w.begin(), w.end());\n" +
      "    int cap;\n" +
      "    cin >> cap;\n" +
      "    int rest = cap;\n" +
      "    int packed = 0;\n" +
      "    for (int i = k - 1; i >= 0; i--) {\n" +
      "        if (w[i] <= rest) {\n" +
      "            rest = rest - w[i];\n" +
      "            packed = packed + w[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << packed;\n" +
      "    return 0;\n" +
      "}",
    breakingInputs: ["4\n6 5 5 1\n10", "3\n9 6 5\n11", "3\n8 5 5\n10"],
  },
  {
    /*
     * The exhaustive check, built by transforming a rule the learner has just
     * been probing. The starting program is NOT `b5`'s: it is the weaker
     * given-order greedy, so nothing on screen is copied into the answer, and
     * the prompt says which rule it runs.
     *
     * The method is forced by the output rather than by an unenforceable "use
     * brute force" (contract option 1): the visible case 7 4 4 2 / 8 wants 8 and
     * the untouched program prints 7. The hidden cases kill the rest of the
     * shortcuts — 2 3 4 5 / 14 kills `total < cap` written for `<=`, 9 9 9 9 / 5
     * kills a `best` started at -1 or at w[0], 10 1 1 1 / 10 kills a loop that
     * quietly skips the first item, and 9 6 5 1 / 11 kills any surviving greedy.
     *
     * The item count is fixed at four, so nothing about the input format had to
     * change for C++.
     */
    id: "m8.l2.b6",
    type: "modify_code",
    skillRefs: ["enumerate.all", "greedy.counterexample", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Мұндағы ереже одан да қарапайым: бағдарлама дәл 4 заттың салмағын оқиды да, оларды берілген ретімен қарайды — сыйса, салады. `7 4 4 2` және 8 үшін ол 7 шығарады, ал 4 + 4 = 8 деп сөмкені толық толтыруға болады. Бағдарламаны ережеден мүлде бас тартатын етіп өзгерт: әр зат үшін «аламын» және «алмаймын» деген екі нұсқа бар, сондықтан бары — 2 · 2 · 2 · 2 = 16 нұсқа. Барлығын тексеріп, сыйымдылықтан аспайтын ең үлкен жалпы салмақты шығар. Ешбір зат сыймаса, 0 шығар.",
      ru: "Здесь правило ещё проще: программа читает веса ровно четырёх предметов и смотрит их в том порядке, в каком они даны, — помещается, значит кладём. Для `7 4 4 2` и 8 она выводит 7, хотя рюкзак можно набить полностью: 4 + 4 = 8. Переделай программу так, чтобы она вообще отказалась от правила: у каждого предмета два варианта — «беру» и «не беру», значит всего 2 · 2 · 2 · 2 = 16 вариантов. Проверь их все и выведи наибольший суммарный вес, не превышающий вместимости. Если не помещается ни один предмет, выведи 0.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> w;\n" +
      "    for (int i = 0; i < 4; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        w.push_back(x);\n" +
      "    }\n" +
      "    int cap;\n" +
      "    cin >> cap;\n" +
      "    int rest = cap;\n" +
      "    int packed = 0;\n" +
      "    for (int i = 0; i < 4; i++) {\n" +
      "        if (w[i] <= rest) {\n" +
      "            rest = rest - w[i];\n" +
      "            packed = packed + w[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << packed;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> w;\n" +
      "    for (int i = 0; i < 4; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        w.push_back(x);\n" +
      "    }\n" +
      "    int cap;\n" +
      "    cin >> cap;\n" +
      "    int best = 0;\n" +
      "    for (int a = 0; a < 2; a++) {\n" +
      "        for (int b = 0; b < 2; b++) {\n" +
      "            for (int c = 0; c < 2; c++) {\n" +
      "                for (int d = 0; d < 2; d++) {\n" +
      "                    int total = a * w[0] + b * w[1] + c * w[2] + d * w[3];\n" +
      "                    if (total <= cap && total > best) {\n" +
      "                        best = total;\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      /* The prompt says each item may be taken at most once — 16 subsets. A loop allowing each
         item twice answers 5 here and passed every other case. */
      { input: "1 1 1 1\n5", expectedOutput: "4", hidden: true },
      { input: "2 3 4 5\n9", expectedOutput: "9" },
      { input: "7 4 4 2\n8", expectedOutput: "8" },
      { input: "9 6 5 1\n11", expectedOutput: "11", hidden: true },
      { input: "9 9 9 9\n5", expectedOutput: "0", hidden: true },
      { input: "2 3 4 5\n14", expectedOutput: "14", hidden: true },
      { input: "10 1 1 1\n10", expectedOutput: "10", hidden: true },
      { input: "5 5 5 5\n12", expectedOutput: "10", hidden: true },
    ],
  },
  {
    /*
     * Four proposals, exactly one of which cannot be broken. None of them is a
     * rule this lesson has already broken, so the card cannot be answered by
     * elimination from the previous cards — the learner has to try small cases
     * on all four, which is the skill the month is named for.
     *
     * Verified: o1 (cheapest first) matches an exhaustive check on 3000 random
     * price lists — it is genuinely correct, by the exchange argument. o2 fails
     * on -9 -8 1 2 (the two largest give 2, two negatives give 72). o3 fails at
     * n = 10 (10 → 5 → 4 → 2 → 1 is four steps, 10 → 9 → 3 → 1 is three). o4
     * fails on 8 7 6 5 4 (the rule leaves a gap of 4, and 8+7 against 6+5+4 is
     * a gap of 0).
     *
     * No diagnostic mapping. Each wrong option can be chosen for the honest
     * reason "I did not find a counterexample in the time I gave it" as well as
     * for a misconception, and telling those apart from one click is exactly
     * what the mapping rule forbids.
     */
    id: "m8.l2.b7",
    type: "multiple_choice",
    skillRefs: ["greedy.counterexample", "greedy.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Төрт ереже ұсынылды, әрқайсысы өз есебі үшін. Үшеуін шағын мысалмен сындыруға болады, ал біреуін ешқандай мысалмен сындыра алмайсың. Қайсысы бұзылмайды? Асықпа: әрқайсысына кішкентай мысал ойлап тауып, қолмен тексеріп көр.",
      ru: "Предложены четыре правила, каждое для своей задачи. Три из них можно сломать небольшим примером, а одно не ломается ничем. Какое? Не спеши: придумай для каждого маленький пример и проверь его вручную.",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "Ақшаң M теңге, дүкенде бірнеше зат, әрқайсысының бағасы бар. Ең көп зат сатып алу үшін: әрқашан қалғандардың ең арзанын ал.",
          ru: "У тебя M тенге, в магазине несколько товаров со своими ценами. Чтобы купить как можно больше товаров: всегда бери самый дешёвый из оставшихся.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Тізбекте бүтін сандар бар, олардың ішінде теріс сандар да болуы мүмкін. Екі санның ең үлкен көбейтіндісін алу үшін: ең үлкен екі санды ал.",
          ru: "В последовательности целые числа, среди них могут быть и отрицательные. Чтобы получить наибольшее произведение двух чисел: возьми два самых больших числа.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "n санын ең аз қадаммен 1-ге түсіру керек. Бір қадамда 3-ке бөлуге (бөлінсе), 2-ге бөлуге (бөлінсе) немесе 1 азайтуға болады. Ереже: мүмкін болса 3-ке бөл, болмаса 2-ге бөл, болмаса 1 азайт.",
          ru: "Нужно за наименьшее число шагов свести n к 1. За один шаг можно разделить на 3 (если делится), разделить на 2 (если делится) или вычесть 1. Правило: если можно, дели на 3, иначе на 2, иначе вычитай 1.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Сандарды екі топқа бөлу керек, топтардың қосындылары мүмкіндігінше жақын болсын. Ереже: сандарды үлкеннен кішіге қарай алып, әрқайсысын қосындысы кіші тұрған топқа қос.",
          ru: "Нужно разбить числа на две группы так, чтобы суммы групп были как можно ближе. Правило: бери числа от большего к меньшему и каждое добавляй в ту группу, где сумма сейчас меньше.",
        },
      },
    ],
    correctOptionId: "o1",
  },
  {
    id: "m8.l2.b8",
    type: "concept",
    skillRefs: ["greedy.counterexample", "enumerate.all"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Қарсы мысалды машинаға іздет",
      ru: "Пусть контрпример ищет машина",
    },
    body: {
      kk: "Қарсы мысалды бас көзімен іздеудің қажеті жоқ — оны санатып қоюға болады. Үш қадам. Бірінші: ереже беретін жауапты есептейтін кодты жаз. Екінші: сол есептің шын ең жақсы жауабын есептейтін кодты жаз — кіріс кішкентай болса, барлық нұсқаны аралап шығуға болады, бұл ақпандағы толық іріктеу. Үшінші: барлық кішкентай кірісті бірінен соң бірін беріп, екі жауапты салыстыр. Олар алғаш рет айырылған жер — қарсы мысал. Бір ескертпе маңызды: екі жауап барлық кішкентай кірісте бірдей болып шықса, бұл ереженің дұрыстығын ДӘЛЕЛДЕМЕЙДІ. Ол тек қарсы мысалдың кішкентай еместігін білдіреді. Дәлел үшін сөзбен пайымдау керек — оны бүгінгі соңғы тапсырмада жасайсың.",
      ru: "Контрпример не нужно искать глазами — его можно заставить искать машину. Три шага. Первый: напиши код, который считает ответ по правилу. Второй: напиши код, который считает настоящий наилучший ответ той же задачи — если вход маленький, можно перебрать все варианты, это февральский полный перебор. Третий: подавай все маленькие входы один за другим и сравнивай два ответа. Место, где они впервые разошлись, и есть контрпример. Важная оговорка: если на всех маленьких входах ответы совпали, это НЕ доказывает правильность правила. Это значит лишь, что контрпример не маленький. Для доказательства нужно рассуждение словами — им ты и займёшься в последнем задании урока.",
    },
  },
  {
    /*
     * The month's central task: the sweep the concept above describes, on the
     * PDF's own coin family. Withheld from support, which gets b9s.
     *
     * Case design, with the degenerate programs each case kills — every one of
     * these was run against a mutant before the case was kept:
     *
     *   1 3 4    → 6 3 2   visible. Kills "print the greedy answer twice"
     *                      (prints 6 3 3), "never find anything" (none), and
     *                      the smallest-coin-first greedy (reports 3 3 1).
     *   1 5 10   → none    visible. Names the token and shows a rule that
     *                      survives, so `none` is not a curiosity.
     *   1 5 8    → 10 3 2  hidden.
     *   1 4 5    → 8 4 2   hidden.
     *   1 2 3    → none    hidden, a second surviving set.
     *   1 11 12  → 22 11 2 hidden. Kills a sweep that stops at 20 — a natural
     *                      guess, since every counterexample shown so far is
     *                      under 15.
     *   1 20 21  → 40 20 2 hidden. The first failure is EXACTLY 40, so a sweep
     *                      written `n < 40` prints none and dies here.
     *   1 21 22  → none    hidden. The first failure is 42, outside the stated
     *                      range, so a sweep that runs past 40 reports 42 21 2
     *                      and dies. The two together pin the boundary from
     *                      both sides, which is what the prompt promises.
     *
     * Dropping the `break` is killed by the visible cases, so a learner meets it
     * in the open.
     *
     * Cost: the sweep is at most about 200 000 additions in total, which is
     * nothing on either engine — the size here buys correctness, not a timing
     * lesson.
     *
     * The prompt fixes the ORDER of the three numbers and says nothing about
     * layout, which is what `token` promises; there is no line-structure claim
     * for the checker to fail to enforce.
     */
    id: "m8.l2.b9",
    type: "write_code",
    skillRefs: ["greedy.counterexample", "enumerate.all", "perf.compare_solutions", "loops.nested"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда үш номинал беріледі: 1 = c1 < c2 < c3 ≤ 40, ең кішісі әрқашан 1. Ашкөз ереже бұрынғыдай: әрқашан сыятын ең үлкен монетаны ал. 1-ден 40-қа дейінгі (40 да кіреді) әрбір соманы тексеріп шық және ашкөз ереже шын қажеттіден көп монета алатын ЕҢ КІШІ соманы тап. Табылса, үш санды осы ретпен шығар: сол сома, ереже алған монета саны, шын ең аз монета саны. Ондай сома 1-ден 40-қа дейін болмаса, `none` деген ағылшын сөзін шығар. Әр сома үшін нұсқа саны шағын — әр номиналдың саны сомадан аспайды, сондықтан шын ең аз санды барлық нұсқаны аралап табуға толық болады.",
      ru: "В одной строке даны три номинала: 1 = c1 < c2 < c3 ≤ 40, самый маленький всегда 1. Жадное правило прежнее: всегда бери самую крупную монету, которая помещается. Проверь каждую сумму от 1 до 40 включительно и найди НАИМЕНЬШУЮ сумму, на которой правило берёт больше монет, чем нужно. Если такая нашлась, выведи три числа в этом порядке: саму сумму, число монет по правилу и настоящее наименьшее число монет. Если во всём диапазоне от 1 до 40 такой суммы нет, выведи английское слово `none`. Вариантов для каждой суммы немного — количество монет каждого номинала не превосходит самой суммы, поэтому настоящий минимум спокойно ищется полным перебором.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> c;\n" +
      "    for (int i = 0; i < 3; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        c.push_back(x);\n" +
      "    }\n" +
      "    int found = 0;\n" +
      "    for (int n = 1; n <= 40; n++) {\n" +
      "        int rest = n;\n" +
      "        int greedy = 0;\n" +
      "        for (int p = 2; p >= 0; p--) {\n" +
      "            greedy = greedy + rest / c[p];\n" +
      "            rest = rest % c[p];\n" +
      "        }\n" +
      "        int best = -1;\n" +
      "        for (int i = 0; i <= n / c[0]; i++) {\n" +
      "            for (int j = 0; j <= n / c[1]; j++) {\n" +
      "                for (int k = 0; k <= n / c[2]; k++) {\n" +
      "                    if (i * c[0] + j * c[1] + k * c[2] == n) {\n" +
      "                        if (best == -1 || i + j + k < best) {\n" +
      "                            best = i + j + k;\n" +
      "                        }\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "        if (greedy > best) {\n" +
      "            cout << n << \" \" << greedy << \" \" << best;\n" +
      "            found = 1;\n" +
      "            break;\n" +
      "        }\n" +
      "    }\n" +
      "    if (found == 0) {\n" +
      "        cout << \"none\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "1 3 4", expectedOutput: "6 3 2" },
      { input: "1 5 10", expectedOutput: "none" },
      { input: "1 5 8", expectedOutput: "10 3 2", hidden: true },
      { input: "1 4 5", expectedOutput: "8 4 2", hidden: true },
      { input: "1 2 3", expectedOutput: "none", hidden: true },
      { input: "1 11 12", expectedOutput: "22 11 2", hidden: true },
      { input: "1 20 21", expectedOutput: "40 20 2", hidden: true },
      { input: "1 21 22", expectedOutput: "none", hidden: true },
    ],
  },
  {
    /*
     * Support's substitute for b9 — «дайын кодты құрастыру мен толықтыру
     * көбірек» (p.6), the same problem with the structure handed over.
     *
     * The five blanks are the five places where this program can be wrong:
     * the sweep's upper bound, the enumeration bound for the largest coin, the
     * comparison that keeps the smaller total, the direction of the failing test
     * (greedy > best, never the reverse — the rule can only ever take too many),
     * and the token printed when nothing breaks. Everything else is given.
     *
     * One of the five got easier in C++ and it is worth saying so rather than
     * pretending otherwise: Python's `range(1, 41)` stopped one short of its
     * bound, so the first blank used to be an off-by-one worth thinking about.
     * The C++ loop is `n <= ___` and the answer is the stated end itself. The
     * other four are unchanged, and the second — `n / c[2]`, how many of the
     * largest coin can possibly fit — is still the one that needs the argument.
     *
     * The prompt restates the problem in full: support never receives b9, so a
     * reference to "the task above" would point at the multiple choice.
     */
    id: "m8.l2.b9s",
    type: "fill_blank",
    skillRefs: ["greedy.counterexample", "enumerate.all", "loops.nested"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Есеп: бір жолда үш номинал беріледі, 1 = c1 < c2 < c3 ≤ 40, ең кішісі әрқашан 1. Ашкөз ереже — әрқашан сыятын ең үлкен монетаны алу. 1-ден 40-қа дейінгі (40 да кіреді) әрбір соманы тексеріп, ереже шын қажеттіден көп монета алатын ЕҢ КІШІ соманы табу керек. Табылса — сол сома, ереже алған сан және шын ең аз сан осы ретпен шығады; болмаса — `none` деген ағылшын сөзі шығады. Бағдарлама дайын, бірақ бес орын бос қалған. Әрқайсысын толтыр.",
      ru: "Задача: в одной строке даны три номинала, 1 = c1 < c2 < c3 ≤ 40, самый маленький всегда 1. Жадное правило — всегда брать самую крупную монету, которая помещается. Нужно проверить каждую сумму от 1 до 40 включительно и найти НАИМЕНЬШУЮ, на которой правило берёт больше монет, чем нужно. Если она нашлась — выводятся сама сумма, число монет по правилу и настоящий минимум, в этом порядке; если нет — английское слово `none`. Программа уже написана, но в ней пять пропусков. Заполни каждый.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> c;\n" +
      "    for (int i = 0; i < 3; i++) {\n" +
      "        int x;\n" +
      "        cin >> x;\n" +
      "        c.push_back(x);\n" +
      "    }\n" +
      "    int found = 0;\n" +
      "    for (int n = 1; n <= ___; n++) {\n" +
      "        int rest = n;\n" +
      "        int greedy = 0;\n" +
      "        for (int p = 2; p >= 0; p--) {\n" +
      "            greedy = greedy + rest / c[p];\n" +
      "            rest = rest % c[p];\n" +
      "        }\n" +
      "        int best = -1;\n" +
      "        for (int i = 0; i <= n / c[0]; i++) {\n" +
      "            for (int j = 0; j <= n / c[1]; j++) {\n" +
      "                for (int k = 0; k <= ___; k++) {\n" +
      "                    if (i * c[0] + j * c[1] + k * c[2] == n) {\n" +
      "                        if (best == -1 || ___) {\n" +
      "                            best = i + j + k;\n" +
      "                        }\n" +
      "                    }\n" +
      "                }\n" +
      "            }\n" +
      "        }\n" +
      "        if (___) {\n" +
      "            cout << n << \" \" << greedy << \" \" << best;\n" +
      "            found = 1;\n" +
      "            break;\n" +
      "        }\n" +
      "    }\n" +
      "    if (found == 0) {\n" +
      "        cout << ___;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "sweep_end", answer: "40" },
      { id: "third_bound", answer: "n / c[2]" },
      { id: "keep_smaller", answer: "i + j + k < best", alternatives: ["best > i + j + k"] },
      { id: "rule_lost", answer: "greedy > best", alternatives: ["best < greedy", "greedy != best"] },
      { id: "token", answer: "\"none\"" },
    ],
  },
  {
    /*
     * The month's own assessment sentence, rehearsed a lesson early:
     * «тиімді таңдау есебінде стратегияны не негіздейді, не оған қарсы мысал
     * келтіреді» — either justify the strategy or produce a counterexample.
     *
     * The rule given is CORRECT, and that is the point of putting it last. Four
     * cards in a row have broken a proposal, so a learner who has stopped
     * reading and started pattern-matching will hunt for a counterexample that
     * does not exist. The honest answer is the exchange argument, and it is
     * within reach of a fourteen-year-old: swapping a longer task in front of a
     * shorter one changes only those two finishing times and lowers the sum.
     *
     * Contract option 3 — this goes to a human. Written work settles as
     * `unknown`; nothing here is machine-scored, and `expectedPoints` is what
     * the teacher console shows the marker.
     *
     * All three tracks: the programme makes this the month's objective, not an
     * advanced extra.
     */
    id: "m8.l2.b10",
    type: "explain",
    skillRefs: ["greedy.counterexample", "greedy.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Есеп: n тапсырманың әрқайсысының орындалу уақыты берілген, оларды бірінен соң бірін орындаймыз. Тапсырманың бітіру уақыты — оның аяқталған сәті. Барлық бітіру уақыттарының қосындысы мүмкіндігінше аз болуы керек. Ұсынылған ереже: әрқашан қалғандардың ішінен ең қысқасын ал. Мысалы, 4, 1, 3 уақыттары үшін ереже 1, 3, 4 ретін таңдайды: бітіру уақыттары 1, 4, 8 болады, қосындысы 13. Осы ережені не негізде, не оны бұзатын нақты мысал келтір. Жауабыңда екі нәрсе болсын: (1) неге ережені жақсартуға бола ма, болмай ма — соны пайымдап жаз; (2) бірнеше мысалда тексеру мен дәлелдің айырмасын өз сөзіңмен айт.",
      ru: "Задача: даны длительности n заданий, мы выполняем их одно за другим. Время завершения задания — момент, когда оно закончилось. Сумма всех времён завершения должна быть как можно меньше. Предложенное правило: всегда бери самое короткое из оставшихся. Например, для длительностей 4, 1, 3 правило выбирает порядок 1, 3, 4: времена завершения равны 1, 4, 8, их сумма 13. Либо обоснуй это правило, либо приведи конкретный пример, который его ломает. В ответе должно быть два пункта: (1) рассуждение о том, можно ли улучшить порядок, который выбирает правило, или нельзя; (2) своими словами — чем проверка на нескольких примерах отличается от доказательства.",
    },
    expectedPoints: [
      {
        kk: "Ереже қандай ретті таңдайтынын нақты айтады: уақыттарды өсу ретімен қояды, ал мысалда бұл 1, 3, 4 реті және қосындысы 13.",
        ru: "Точно называет порядок, который выбирает правило: длительности идут по возрастанию, в примере это порядок 1, 3, 4 с суммой 13.",
      },
      {
        kk: "Алмастыру пайымдауы: егер қатарда тұрған екі тапсырманың алдыңғысы ұзынырақ болса, оларды орын ауыстырғанда тек осы екеуінің бітіру уақыты өзгереді, ал қосынды кемиді. Демек ең жақсы ретте ұзын тапсырма қысқаның алдында тұра алмайды — ереже дұрыс.",
        ru: "Рассуждение об обмене: если из двух соседних заданий первое длиннее, то при их перестановке меняются только их два времени завершения, а сумма уменьшается. Значит, в наилучшем порядке длинное задание не может стоять перед коротким — правило верно.",
      },
      {
        kk: "Мұнда қарсы мысал жоқ екенін айтады, ал қарсы мысал келтірген оқушы оны толық жазуы керек: нақты уақыттар тізбегі, ереже таңдаған рет, одан жақсы рет және екі қосынды. Бұл төртеуінің бірі жетпесе, ол әлі қарсы мысал емес.",
        ru: "Говорит, что контрпримера здесь нет; а если ученик его всё же приводит, то приводит полностью: конкретный список длительностей, порядок по правилу, лучший порядок и обе суммы. Без любого из этих четырёх пунктов это ещё не контрпример.",
      },
      {
        kk: "Дәлел мен тексерудің айырмасын атайды: бірнеше мысалда сәтті шығу ережені дәлелдемейді, себебі мысал саны шектеулі; ал бір қарсы мысал оны толық жоққа шығарады. Пайымдау барлық кірісті бірден қамтиды, ал тексеру — тек тексерілгенін.",
        ru: "Называет разницу между доказательством и проверкой: удача на нескольких примерах правило не доказывает, потому что примеров конечное число; а один контрпример опровергает его полностью. Рассуждение охватывает сразу все входы, проверка — только проверенные.",
      },
    ],
  },
];
