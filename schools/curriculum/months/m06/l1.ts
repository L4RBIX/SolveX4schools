import type { LessonBlock } from "../../types";

/**
 * Lesson m6.l1 · «Барлық нұсқаны қарау» / «Перебор всех вариантов». 9 min.
 * PDF p.9, February. Skills: `enumerate.all`, `loops.nested`, `perf.time_estimate`.
 *
 * ## The clause that drives every block here
 *
 * February's mastery paragraph opens with a conditional, and the condition is
 * half the lesson:
 *
 *   «Нұсқалар аз болғанда барлық мүмкін нұсқаны жүйелі түрде тексеру…»
 *
 * *When there are few variants*, check every possible one *systematically*.
 * Both halves are load-bearing and they are taught in that order.
 *
 * - **Few** is a number, and December already taught how to get it. So the
 *   counting comes first: n(n − 1)/2 pairs, n(n − 1)(n − 2)/6 triples, against
 *   the ~10⁸ steps per second the year measures against. Every `write_code`
 *   below hands the learner the count in its own prompt and says why the
 *   enumeration is legitimate at that size — the reasoning December asks for
 *   BEFORE the code, not a decoration on top of it.
 * - **Systematically** means an ordering the learner can defend as complete.
 *   That is the `i < j` convention this lesson establishes and the whole month
 *   keeps: the inner loop is written `for (int j = i + 1; j < n; j++)`, so each
 *   unordered pair is examined exactly once, with the smaller index first.
 *   Triples extend it to `i < j < k`.
 *
 * The failure the convention exists to prevent — an inner loop starting at 0,
 * which counts every pair twice and pairs `i` with itself — is the month's most
 * common enumeration bug, so it is attacked from four sides before anybody
 * writes a loop from scratch: the concept states it, `b3` makes the learner
 * predict the count, `b5` is that exact bug with a witness input, and `b6` puts
 * the inner bound back by hand.
 *
 * ## Requirements a checker cannot see: option 1, and it genuinely applies here
 *
 * The contract's fourth defect class is a structural rule the product does not
 * enforce ("you must use two nested loops"). No block below states one. It does
 * not need to, because in both graded tasks the intended enumeration is forced
 * by the ANSWER rather than by an unenforced instruction:
 *
 * - `b8` counts pairs with `a[i] > a[j]`, a property that only means anything
 *   once the pair is ordered. Enumerate unordered or doubled and the number
 *   comes out different — the visible ascending case prints 0 against the
 *   bug's 6.
 * - `b9` counts triples `i < j < k`. Enumerating all ordered triples multiplies
 *   the answer by six, and the visible sample already shows it: 2 against 18.
 *
 * That is option 1 of the contract's three — make the output impossible without
 * the method — and it is why the prompts state the size argument and then say
 * nothing at all about how many `for` lines the solution should have.
 *
 * ## What is deliberately NOT here
 *
 * Recursion. It arrives in `m6.l3`, and enumeration is taught first because the
 * call tree is easier to believe once the learner has already had to justify
 * that a walk covered every variant. `m6.l2` takes the counting further into
 * the growth table and the early exit; nothing here pre-empts it.
 *
 * ## No new C++
 *
 * February introduces no construct in this lesson. Every program below is
 * October's nested `for` plus October's `vector<int>` read with `cin`. `b1`
 * says so out loud, because a month whose novelty is an *idea* rather than a
 * *keyword* is one a learner can otherwise mistake for magic.
 *
 * The one C++ fact this lesson adds is a scope fact, and it is added where it
 * bites rather than as a rule: `b7`'s last trace row has no `i` and no `j` at
 * all, because a variable declared in the head of a `for` stops existing when
 * the loop ends. In the Python original that row read `i = 3`. It is a real
 * difference and November already taught the rule it follows from.
 *
 * ## Overflow, checked rather than assumed
 *
 * Every count in this lesson is bounded well inside `int`: `b8` at n = 2000 can
 * report at most 2000 · 1999 / 2 = 1 999 000 pairs and `b9` at n = 200 at most
 * 200 · 199 · 198 / 6 = 1 313 400 triples. The values read are |a[i]| ≤ 1000
 * and |s| ≤ 100 000, so no sum of three of them comes near 2³¹ − 1 either. No
 * block here needs `long long`.
 *
 * ## Support
 *
 * `b9` is the harder blank editor, so it is the block support substitutes:
 * `m6.l1.b9s` is the same problem, same cases, reached by extending a working
 * pair counter instead of writing three loops from nothing. Support keeps `b8`
 * — «нөлден жазу азырақ» is less writing from scratch, not none. The starting
 * program handed to `b9s` is the answer to nothing in this lesson: `b5`'s
 * repaired program reads `s` after the list and `b6`'s completed template
 * tests divisibility by 10, so neither can be transcribed into it.
 */

const P = 9; // PDF page for all of February

export const M6_L1: LessonBlock[] = [
  {
    id: "m6.l1.b1",
    type: "concept",
    skillRefs: ["enumerate.all", "loops.nested", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Алдымен сана, содан кейін қара",
      ru: "Сначала посчитай, потом перебирай",
    },
    /* Two claims, in the programme's own order. The count is first because
       «нұсқалар аз болғанда» is a condition and a condition has to be checked,
       and the ordering is second because «жүйелі түрде» is a promise about
       completeness that only a defensible order can keep.

       The n(n − 1)(n − 2)/6 line spells out where the 6 comes from. Without it
       the formula is a spell, and `b4`'s second distractor — 20 · 19 · 18 — is
       precisely the learner who has the numerator and not the division. */
    body: {
      kk:
        "Кейбір есептерде айла іздеудің қажеті жоқ: нұсқалар аз болса, олардың бәрін бір-бірлеп қарап шығуға болады. Бұл — толық іріктеу. Бірақ «бәрін қарап шығу» деген сөздің екі шарты бар, әрі екеуі де маңызды.\n\n" +
        "Бірінші шарт — алдымен сана. Кодқа отырмас бұрын нұсқалардың нақты санын шығар. n элементтің ішінен `i < j` болатын жұптарды алайық. Бірінші элементпен жұп құра алатын, одан кейін тұрған n − 1 элемент бар; екіншісімен — n − 2; ...; соңғысымен — 0. Барлығы n(n − 1)/2 жұп. Үштіктер үшін сан n(n − 1)(n − 2)/6 болады: алымдағы n(n − 1)(n − 2) — үш индексті ретімен таңдау саны, ал үш элементтен тұратын әрбір жиынды 6 түрлі ретпен жазуға болатындықтан, оны 6-ға бөлеміз — бізге сол алты жазудың біреуі ғана керек. Желтоқсаннан келе жатқан өлшем сол күйінде: компьютер бір секундта шамамен 100 000 000 қарапайым қадам жасайды.\n\n" +
        "Екінші шарт — жүйелілік. Бірде-бір нұсқа қалып қоймауы және бірде-бір нұсқа екі рет қаралмауы керек. Дәл осыны `i < j` реті қамтамасыз етеді: ішкі цикл `for (int j = i + 1; j < n; j++)` деп жазылады, сондықтан j әрқашан i-ден кейін жүреді және {i, j} жұбы дәл бір рет — кіші индексі бірінші тұрған күйінде — қаралады. Ал ішкі цикл `j = 0`-ден басталса, әр жұп екі рет қаралады (бір рет (i, j) түрінде, бір рет (j, i) түрінде), оның үстіне i-дің өзімен жұптасуы да есепке кіріп кетеді. Бұл — іріктеудегі ең жиі кездесетін қате, және оны бүкіл ай бойы осылай жазып жүріп болдырмаймыз. Үштіктер де солай: i < j < k, яғни үшінші цикл `k = j + 1`-ден басталады.\n\n" +
        "Ақпанда жаңа C++ командасы жоқ. Бар болғаны қазанда үйренген цикл ішіндегі циклді жаңаша реттеп жазамыз — бірақ дәл сол рет есептің жауабын өзгертеді.",
      ru:
        "В некоторых задачах не нужно искать хитрость: если вариантов немного, можно просмотреть их все по одному. Это и есть полный перебор. Но у слов «просмотреть все» есть два условия, и оба важны.\n\n" +
        "Первое условие — сначала посчитай. Прежде чем садиться за код, найди точное число вариантов. Возьмём пары с условием `i < j` среди n элементов. С первым элементом могут составить пару n − 1 стоящих после него элементов, со вторым — n − 2, ..., с последним — 0. Всего n(n − 1)/2 пар. Для троек число равно n(n − 1)(n − 2)/6: в числителе n(n − 1)(n − 2) — это количество способов выбрать три индекса по порядку, а делим на 6 потому, что любой набор из трёх элементов можно записать в 6 разных порядках, а нам нужна ровно одна такая запись. Мерка, пришедшая из декабря, остаётся прежней: компьютер делает примерно 100 000 000 простых шагов в секунду.\n\n" +
        "Второе условие — систематичность. Ни один вариант не должен потеряться и ни один не должен быть просмотрен дважды. Именно это обеспечивает порядок `i < j`: внутренний цикл пишется как `for (int j = i + 1; j < n; j++)`, поэтому j всегда идёт после i, и пара {i, j} рассматривается ровно один раз — в записи, где меньший индекс стоит первым. А если внутренний цикл начать с `j = 0`, каждая пара будет просмотрена дважды (один раз как (i, j), другой как (j, i)), да ещё и i попадёт в напарники сам себе. Это самая частая ошибка перебора, и весь месяц мы избегаем её именно такой записью. С тройками так же: i < j < k, то есть третий цикл начинается с `k = j + 1`.\n\n" +
        "Новых команд C++ в феврале нет. Мы всего лишь по-новому расставляем границы цикла внутри цикла, знакомого с октября, — но именно эта расстановка меняет ответ задачи.",
    },
    /* Three pairs printed, not counted: the learner should SEE the order the
       convention produces before any counter is put next to it. Deliberately
       not a `c = c + 1` program, so nothing on this card is the shape `b3`,
       `b7`, `b8` or `b9` will ask for. */
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {5, 8, 2};\n" +
      "    for (int i = 0; i < 3; i++) {\n" +
      "        for (int j = i + 1; j < 3; j++) {\n" +
      "            cout << a[i] << \" \" << a[j] << endl;   // 5 8 / 5 2 / 8 2\n" +
      "        }\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
  },
  {
    id: "m6.l1.b2",
    type: "worked_example",
    skillRefs: ["enumerate.all", "loops.nested", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: қосындысы 5-ке тең жұптар",
      ru: "Разобранный пример: пары с суммой 5",
    },
    problem: {
      kk: "Тізім берілген: a = {2, 7, 4, 1, 3}. Қосындысы дәл 5-ке тең болатын жұптар нешеу? Бағдарлама екі санды шығарсын: табылған жұптар санын және қаралған жұптар санын.",
      ru: "Дан список a = {2, 7, 4, 1, 3}. Сколько в нём пар с суммой ровно 5? Программа должна вывести два числа: количество найденных пар и количество просмотренных пар.",
    },
    /* Step 5 is the reason this block exists and is a worked_example rather
       than a concept: the second counter is not part of the answer, it is the
       PROOF that the walk was complete. A learner who never prints `checked`
       has no way to notice that their inner loop started in the wrong place —
       which is exactly the position `b5` puts them in. */
    steps: [
      {
        kk: "Алдымен санаймыз. Тізімде 5 элемент бар, демек `i < j` болатын жұптар саны 5 · 4 / 2 = 10. Он деген — түк емес, сондықтан барлығын қарап шығуға толық болады.",
        ru: "Сначала считаем. В списке 5 элементов, значит пар с условием `i < j` ровно 5 · 4 / 2 = 10. Десять — это пустяк, поэтому просмотреть их все совершенно точно можно.",
      },
      {
        kk: "Ретті бекітеміз: i сыртқы циклде 0-ден жүреді, ал j ішкі циклде әрқашан i + 1-ден басталады. Сонда жұптар мына ретпен келеді: (0,1), (0,2), (0,3), (0,4), (1,2), (1,3), (1,4), (2,3), (2,4), (3,4). Ешқайсысы қайталанбайды және ешқайсысы қалып қоймайды.",
        ru: "Закрепляем порядок: i во внешнем цикле идёт с 0, а j во внутреннем всегда начинается с i + 1. Тогда пары идут так: (0,1), (0,2), (0,3), (0,4), (1,2), (1,3), (1,4), (2,3), (2,4), (3,4). Ни одна не повторяется и ни одна не теряется.",
      },
      {
        kk: "Екі санағыш аламыз. `found` — шарт орындалған жұптарды санайды, ал `checked` — қаралған жұптардың бәрін санайды, шарт орындалды ма, жоқ па, оған қарамай. Екіншісі жауапқа кірмейді, бірақ ол бізге керек — себебі соңында `checked` формуладағы 10-ға тең болуы тиіс.",
        ru: "Берём два счётчика. `found` считает пары, для которых условие выполнилось, а `checked` считает все просмотренные пары, независимо от условия. Второй в ответ не входит, но он нам нужен: в конце `checked` обязан совпасть с 10 из формулы.",
      },
      {
        kk: "Қосындыларды ретімен жазып шығамыз: 2+7=9, 2+4=6, 2+1=3, 2+3=5 ✓, 7+4=11, 7+1=8, 7+3=10, 4+1=5 ✓, 4+3=7, 1+3=4. Он қосынды, солардың екеуі 5-ке тең.",
        ru: "Выписываем суммы по порядку: 2+7=9, 2+4=6, 2+1=3, 2+3=5 ✓, 7+4=11, 7+1=8, 7+3=10, 4+1=5 ✓, 4+3=7, 1+3=4. Десять сумм, из них две равны 5.",
      },
      {
        kk: "Соңғы қадам — тексеру. `checked` дәл 10 шықты, яғни формула мен цикл келісті. Егер экранда 20 тұрса, ішкі цикл `j = 0`-ден басталған және әр жұп екі рет қаралған; егер 15 тұрса, ішкі цикл `j = i`-ден басталған және әр элемент өзімен жұптасқан. Бұл сан — іріктеудің дұрыстығын тексеретін ең қарапайым құрал.",
        ru: "Последний шаг — проверка. `checked` вышел ровно 10, значит формула и цикл сошлись. Если бы на экране было 20, внутренний цикл начинался бы с `j = 0` и каждая пара просматривалась бы дважды; если бы 15 — внутренний цикл начинался бы с `j = i` и каждый элемент попал бы в пару сам с собой. Это число — самый простой способ проверить, что перебор верен.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {2, 7, 4, 1, 3};\n" +
      "    int found = 0;\n" +
      "    int checked = 0;\n" +
      "    for (int i = 0; i < 5; i++) {\n" +
      "        for (int j = i + 1; j < 5; j++) {\n" +
      "            checked = checked + 1;\n" +
      "            if (a[i] + a[j] == 5) {\n" +
      "                found = found + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << found << endl;\n" +
      "    cout << checked;\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Экранға екі жол шығады: алдымен 2 (табылған жұптар), содан кейін 10 (қаралған жұптар).",
      ru: "На экран выводятся две строки: сначала 2 (найденные пары), затем 10 (просмотренные пары).",
    },
  },
  {
    id: "m6.l1.b3",
    type: "prediction",
    skillRefs: ["enumerate.all", "loops.nested", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарламада тізім де, шарт та жоқ — ол тек жұптарды санайды. n = 6 болғанда экранға қандай сан шығады?",
      ru: "В этой программе нет ни списка, ни условия — она только считает пары. Какое число выведется на экран при n = 6?",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n = 6;\n" +
      "    int pairs = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            pairs = pairs + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << pairs;\n" +
      "    return 0;\n" +
      "}",
    answer: "15",
    options: ["15", "21", "30", "36"],
    /* 30 carries no mapping, and the omission is deliberate. It is n(n − 1),
       which two different misunderstandings reach: reading the inner loop as
       starting at 0 and remembering to skip j == i, or reading the loop
       correctly and believing (i, j) and (j, i) are two different pairs. The
       first is about the code, the second about the definition of a pair, and
       telling a fourteen-year-old which one they made would be a guess. The
       engine asks instead. */
    diagnosticMapping: {
      "36": {
        failureClass: "nested_range_ignores_start",
        justification:
          "36 = 6 · 6, яғни ішкі цикл сыртқы циклдің әр қадамында толық n рет айналады деп есептелген. `j = i + 1` деген бастапқы мән ескерілмегенде ғана дәл осы сан шығады.",
      },
      "21": {
        failureClass: "self_pair_included",
        justification:
          "21 = 15 + 6, яғни дұрыс санға әр элементтің өзімен құрған алты «жұбы» қосылған. Ішкі цикл `j = i`-ден басталады деп оқылғанда, немесе i-дің өзі серік деп саналғанда, дәл осы сан шығады.",
      },
    },
  },
  {
    id: "m6.l1.b4",
    type: "multiple_choice",
    skillRefs: ["enumerate.all", "perf.time_estimate"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    /* Curriculum-derived and cited at p.9 because the question IS February's
       own condition made operational: «нұсқалар аз болғанда» is a claim about
       a number, so the month has to ask what the number is and what counts as
       few. The n, the four counts and the verdicts are product decisions
       serving it; December's ~10⁸ budget is restated in the prompt rather than
       assumed, since it is the only thing that turns 1140 into a verdict.

       No code on this card, on purpose. Showing the triple-loop skeleton here
       would hand `b9` its own structure two screens early; the learner is meant
       to get the triple count from the formula in `b1` and build the third loop
       themselves. The verdict half is live: `o4` has the count right and the
       second-per-step comparison missing, which is the exact shape-matching
       `m4.l1` was written to break. */
    prompt: {
      kk: "Тізімде n = 20 сан бар. Бағдарлама i < j < k болатын барлық (i, j, k) үштігін дәл бір реттен қарап шығады. Үштіктер нешеу және бағдарлама бір секундке үлгере ме? Компьютер секундына шамамен 100 000 000 қарапайым қадам жасайды деп есепте.",
      ru: "В списке n = 20 чисел. Программа ровно по одному разу просматривает все тройки (i, j, k) с условием i < j < k. Сколько всего троек и уложится ли программа в одну секунду? Считай, что компьютер делает примерно 100 000 000 простых шагов в секунду.",
    },
    options: [
      { id: "o1", label: { kk: "1140 үштік — бір секундке еркін үлгереді", ru: "1140 троек — свободно укладывается в секунду" } },
      { id: "o2", label: { kk: "6840 үштік — бір секундке еркін үлгереді", ru: "6840 троек — свободно укладывается в секунду" } },
      { id: "o3", label: { kk: "8000 үштік — бір секундке еркін үлгереді", ru: "8000 троек — свободно укладывается в секунду" } },
      { id: "o4", label: { kk: "1140 үштік — бір секундке үлгермейді", ru: "1140 троек — в секунду не укладывается" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "combination_counted_as_ordered",
        justification:
          "6840 = 20 · 19 · 18 — бұл үш индексті РЕТІМЕН таңдау саны, яғни әр үштік алты түрлі ретпен алты рет саналған. i < j < k шарты сол алты жазудың біреуін ғана қалдырады, сондықтан жауап 6-ға бөлінуі керек еді.",
      },
      o3: {
        failureClass: "nested_range_ignores_start",
        justification:
          "8000 = 20 · 20 · 20 — үш циклдің үшеуі де толық n рет айналады деп есептелген. Мұнда бір индекс екі рет те, тіпті үш рет те қайталана алады, ал i < j < k шарты оны мүлде рұқсат етпейді.",
      },
      o4: {
        failureClass: "step_budget_not_applied",
        justification:
          "Үштіктердің саны дұрыс табылған, бірақ ол секундтық шамамен салыстырылмаған. 1140 қадам — 100 000 000-нан ондаған мың есе аз, сондықтан дұрыс саннан кейінгі жауап «үлгермейді» бола алмайды.",
      },
    },
  },
  {
    id: "m6.l1.b5",
    type: "find_bug",
    skillRefs: ["enumerate.all", "loops.nested", "debug.boundary"],
    /* Product-authored, and deliberately not cited: p.9 names the pair family
       that carries this card, but it names no typical errors the way October's
       page does, and the defect is what a find_bug actually is. Claiming
       curriculum provenance for an invented bug is exactly what the field
       exists to prevent.

       symptomInput is mandatory here: the numeric probe feeds a
       single number, and this program needs three lines of input before it can
       show anything at all. The witness is chosen to expose BOTH symptoms at
       once — 1 2 3 4 3 with s = 6 has two genuine pairs (2+4 and 3+3 at two
       different positions), which the broken loop counts in both directions,
       and it also contains a 3 that pairs with ITSELF to make 6. Correct 2,
       broken 6.

       Both programs compile: the defect is a wrong ANSWER, not a refusal to
       build, so the harness has to provoke it and the witness above is what
       provokes it. */
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама қосындысы s-ке тең жұптарды санауы керек. Бірақ 5 сан 1 2 3 4 3 және s = 6 берілгенде ол 2-нің орнына 6 шығарады. Қай жол кінәлі?",
      ru: "Эта программа должна считать пары с суммой s. Но при 5 числах 1 2 3 4 3 и s = 6 она выводит 6 вместо 2. Какая строка виновата?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = 0; j < n; j++) {\n" +
      "            if (a[i] + a[j] == s) c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 14,
    symptomInput: "5\n1 2 3 4 3\n6",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int s;\n" +
      "    cin >> s;\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            if (a[i] + a[j] == s) c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      /* Line 15 is the condition, and it is correct: `a[i] + a[j] == s` is the
         property word for word. Choosing it means the learner looked for the
         defect where the ARITHMETIC is and never questioned which pairs the
         loops hand to it — the one reading of this program that lands there. */
      "15": {
        failureClass: "condition_blamed_for_loop_bounds",
        justification:
          "Он бесінші жол — шарттың өзі, ал ол есептің тұжырымымен сөзбе-сөз сәйкес: қосынды s-ке тең бе, солай тексеріліп тұр. Оны таңдау — қатені арифметикадан іздеп, циклдер шартқа ҚАНДАЙ жұптарды беріп тұрғанын мүлде тексермегенді білдіреді.",
      },
    },
  },
  {
    id: "m6.l1.b6",
    type: "fill_blank",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index"],
    sourceType: "product-authored",
    /* The bound put back by hand, on a third property so that neither the
       worked example's sum nor `b5`'s repaired program can be copied into it.
       The end bound is a blank too: `n` is easy, but leaving it filled in would
       let a learner answer the whole card by pattern-matching `i + 1` against
       the concept block without ever deciding where the walk stops. */
    prompt: {
      kk: "Бірінші жолда n оқылады, екінші жолда n бүтін сан. Бағдарлама қосындысы 10-ға қалдықсыз бөлінетін жұптардың санын шығаруы керек. Ішкі циклдің екі шекарасын қой: әр жұп дәл бір рет қаралуы тиіс, ал бірде-бір элемент өзімен жұптаспауы керек. Мысалы n = 5 және сандар 3 7 5 5 10 болса, жауап 2 (3 + 7 және 5 + 5).",
      ru: "В первой строке читается n, во второй — n целых чисел. Программа должна вывести количество пар, сумма которых делится на 10 без остатка. Расставь обе границы внутреннего цикла: каждая пара должна быть просмотрена ровно один раз, и ни один элемент не должен попасть в пару сам с собой. Например, при n = 5 и числах 3 7 5 5 10 ответ 2 (3 + 7 и 5 + 5).",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = ___; j < ___; j++) {\n" +
      "            if ((a[i] + a[j]) % 10 == 0) c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "i + 1", alternatives: ["i+1"] },
      { id: "f2", answer: "n", alternatives: ["(int)a.size()"] },
    ],
  },
  {
    id: "m6.l1.b7",
    type: "trace_code",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index"],
    /* Product-authored. Step-by-step execution is October's instrument (p.7),
       not February's — p.9 names «шақырулар ағашы», which is m6.l3's card — so
       this block inherits a method rather than implementing a clause, and it
       does not claim otherwise. Six rows, one per pass of the inner body, so
       the learner writes out the very order `b2` argued for.

       The property is `a[j] - a[i] == 2`, chosen because it is the one shape on
       this card where the ORDER of the two indices changes the value — a[j]
       minus a[i], not the other way round — so the trace cannot be filled in by
       treating the pair as unordered.

       The last row is where C++ differs from the Python original and the
       difference is the point of the row. In Python the loop variable survived
       the loop and the row read `i = 3`. Here `i` and `j` are declared in the
       heads of their `for` statements, so at line 13 neither exists — November's
       block scope, met as a consequence rather than as a rule. The row
       therefore carries only `found`, and the prompt asks why. */
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама айырмасы дәл 2-ге тең жұптарды санайды: артқы сан алдыңғыдан 2-ге үлкен болуы керек. Ішкі циклдің денесі әр орындалғаннан кейінгі `i`, `j` және `found` мәндерін жаз. Соңғы жол — циклдерден кейінгі `cout`: онда `found` бар да, `i` мен `j` мүлде жоқ. Неге? Қарашадағы блок ережесін еске түсір: `for` жақшасының ішінде жарияланған айнымалы сол циклмен бірге бітеді.",
      ru: "Программа считает пары, у которых разность ровно 2: число, стоящее позже, должно быть на 2 больше стоящего раньше. Запиши значения `i`, `j` и `found` после каждого выполнения тела внутреннего цикла. Последняя строка — `cout` уже после циклов: там есть `found`, а `i` и `j` нет вообще. Почему? Вспомни правило блока из ноября: переменная, объявленная в круглых скобках `for`, заканчивается вместе с этим циклом.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {1, 4, 3, 6};\n" +
      "    int found = 0;\n" +
      "    for (int i = 0; i < 4; i++) {\n" +
      "        for (int j = i + 1; j < 4; j++) {\n" +
      "            if (a[j] - a[i] == 2) found = found + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << found;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 7, vars: { found: "0" } },
      { line: 10, vars: { i: "0", j: "1", found: "0" } },
      { line: 10, vars: { i: "0", j: "2", found: "1" } },
      { line: 10, vars: { i: "0", j: "3", found: "1" } },
      { line: 10, vars: { i: "1", j: "2", found: "1" } },
      { line: 10, vars: { i: "1", j: "3", found: "2" } },
      { line: 10, vars: { i: "2", j: "3", found: "2" } },
      { line: 13, vars: { found: "2" } },
    ],
  },
  {
    id: "m6.l1.b8",
    type: "write_code",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index", "compare.operators", "perf.time_estimate"],
    /* PDF p.9: «белгілі қасиеті бар барлық жұп ... табу». The property is
     * chosen so that the i < j convention is not a tidiness rule but the
     * ANSWER: `a[i] > a[j]` is a statement about which of the two stands
     * earlier, so an enumeration that drops the order produces a different
     * number and the checker sees it. That is why no prompt here says "use two
     * nested loops" — the requirement is enforced by the output, which is
     * option 1 of the contract's three.
     *
     * Wrong solutions and the case that kills each:
     *   - inner loop from 0 (each pair twice)      → "4 / 1 2 3 4": 6 vs 0,
     *     and it is a VISIBLE case, so the learner meets it with the sample in
     *     front of them;
     *   - `>=` instead of `>`                      → "2 / 3 3": 1 vs 0, and
     *     "6 / 2 2 1 3 3 1": 9 vs 6;
     *   - inner loop `j < n - 1`, one short        → "4 / 1 2 5 3": 0 vs 1,
     *     the only qualifying pair ends on the LAST element;
     *   - `<` instead of `>`                       → visible case: 6 vs 4;
     *   - comparing neighbours only (a[i] > a[i+1])→ visible case: 2 vs 4;
     *   - n = 1, no pairs at all                   → "1 / 7": 0.
     * The descending case pins the upper end: 5 elements, 10 pairs, all of them
     * qualifying, which is n(n − 1)/2 checked against the formula in `b1`.
     *
     * Overflow: at n = 2000 the answer is at most 1 999 000, so `int` is the
     * right type and nothing here needs `long long`. */
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Кезекке n оқушы тұрды. Бірінші жолда n беріледі (1 ≤ n ≤ 2000), екінші жолда — кезекте тұру ретімен олардың бойлары, бос орынмен бөлініп (әр бойы 1-ден 250-ге дейінгі бүтін сан). Алдында тұрған оқушы артында тұрғаннан ҚАТАҢ биік болатын жұптар нешеу? Басқаша айтқанда, i < j және a[i] > a[j] болатын (i, j) жұптарының санын тап. Тек сол бір санды шығар. Мысалы 1 5 2 4 3 үшін жауап 4. Есептеп көр: n ең үлкені 2000 болғанда жұптар саны 2000 · 1999 / 2 ≈ 2 000 000, ал бұл бір секундке еркін сыяды — сондықтан мұнда барлық жұпты қарап шығуға толық болады. Жауап та 2 000 000-нан аспайды, сондықтан `int` жеткілікті.",
      ru: "В очередь встали n учеников. В первой строке дано n (1 ≤ n ≤ 2000), во второй — их рост в порядке очереди, через пробел (каждый рост — целое число от 1 до 250). Сколько есть пар, в которых стоящий впереди СТРОГО выше стоящего позади? Другими словами, найди количество пар (i, j), для которых i < j и a[i] > a[j]. Выведи только это одно число. Например, для 1 5 2 4 3 ответ 4. Прикинь сам: при наибольшем n = 2000 пар получается 2000 · 1999 / 2 ≈ 2 000 000, а столько свободно укладывается в секунду — значит, здесь вполне можно просмотреть все пары. Ответ тоже не больше 2 000 000, так что `int` здесь достаточно.",
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
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            if (a[i] > a[j]) c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5\n1 5 2 4 3", expectedOutput: "4" },
      { input: "4\n1 2 3 4", expectedOutput: "0" },
      { input: "1\n7", expectedOutput: "0", hidden: true },
      { input: "2\n3 3", expectedOutput: "0", hidden: true },
      { input: "4\n1 2 5 3", expectedOutput: "1", hidden: true },
      { input: "5\n5 4 3 2 1", expectedOutput: "10", hidden: true },
      { input: "6\n2 2 1 3 3 1", expectedOutput: "6", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m6.l1.b9 — «дайын кодты құрастыру мен толықтыру
     * көбірек, нөлден жазу азырақ» (p.6). Same problem, same input format, same
     * cases, so the mark means the same thing on both routes; the difference is
     * that the three loops are reached by extending two rather than by facing
     * an empty editor.
     *
     * The starting program is a working pair counter, and it is the answer to
     * nothing this lesson asks for. `b5`'s repaired program is the nearest
     * neighbour and it is a different program: it reads `s` after the list,
     * this one takes `n` and `s` together on the first line. `b6`'s completed
     * template tests divisibility by 10. So a support learner has this shape in
     * their head from having read and repaired it, which is the point, but has
     * nothing to transcribe.
     *
     * The prompt states the problem in full and points at no neighbouring card:
     * on the support route `b9` is stripped by `blocksForTrack`, so "the task
     * above" would name a card this learner never receives — the defect found
     * at `m2.l1.b8s`.
     */
    id: "m6.l1.b9s",
    type: "modify_code",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index", "perf.time_estimate"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Төменде дұрыс жұмыс істейтін дайын бағдарлама тұр: ол қосындысы s-ке тең ЖҰПТАРДЫ санайды. Оны ҮШТІКТЕРДІ санайтын етіп өзгерт. Кіріс сол күйінде қалады: бірінші жолда бос орынмен бөлінген n мен s (1 ≤ n ≤ 200, −100 000 ≤ s ≤ 100 000), екінші жолда n бүтін сан (әрқайсысы −1000 мен 1000 аралығында). Қосындысы дәл s-ке тең және i < j < k шартын қанағаттандыратын (i, j, k) үштіктерінің санын шығар — тек сол бір санды. Мысалы n = 5, s = 10 және сандар 1 2 3 4 5 болса, жауап 2: бұл 1 + 4 + 5 және 2 + 3 + 5. Ойлан: үшінші цикл қай жерден басталса, әр үштік дәл бір рет қаралады?",
      ru: "Ниже готовая, правильно работающая программа: она считает ПАРЫ с суммой s. Переделай её так, чтобы она считала ТРОЙКИ. Ввод остаётся прежним: в первой строке через пробел n и s (1 ≤ n ≤ 200, −100 000 ≤ s ≤ 100 000), во второй — n целых чисел (каждое от −1000 до 1000). Выведи количество троек (i, j, k), у которых сумма ровно s и выполнено i < j < k, — только это одно число. Например, при n = 5, s = 10 и числах 1 2 3 4 5 ответ 2: это 1 + 4 + 5 и 2 + 3 + 5. Подумай: откуда должен начинаться третий цикл, чтобы каждая тройка была просмотрена ровно один раз?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, s;\n" +
      "    cin >> n >> s;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            if (a[i] + a[j] == s) c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, s;\n" +
      "    cin >> n >> s;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            for (int k = j + 1; k < n; k++) {\n" +
      "                if (a[i] + a[j] + a[k] == s) c = c + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    /* The first visible case is chosen so the UNCHANGED program fails it in the
       open: the pair counter prints 0 where 2 is expected, because no two of
       1 2 3 4 5 add up to 10. Handing back the starter cannot pass. */
    cases: [
      { input: "5 10\n1 2 3 4 5", expectedOutput: "2" },
      { input: "4 6\n1 2 3 4", expectedOutput: "1" },
      { input: "2 5\n2 3", expectedOutput: "0", hidden: true },
      { input: "3 0\n0 0 0", expectedOutput: "1", hidden: true },
      { input: "5 0\n0 0 0 0 0", expectedOutput: "10", hidden: true },
      { input: "6 12\n4 4 4 4 4 4", expectedOutput: "20", hidden: true },
      { input: "5 100\n1 2 3 4 5", expectedOutput: "0", hidden: true },
      { input: "5 0\n-3 1 2 -1 4", expectedOutput: "2", hidden: true },
      { input: "4 9\n1 2 3 6", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m6.l1.b9",
    type: "write_code",
    skillRefs: ["enumerate.all", "loops.nested", "lists.index", "perf.time_estimate"],
    /* PDF p.9: «белгілі қасиеті бар барлық ... үштікті табу». The lesson's one
     * genuinely independent task, and `i < j < k` is again forced by the
     * answer rather than by an instruction — enumerating ordered triples
     * multiplies the count by six, which the VISIBLE sample already exposes
     * (18 against 2).
     *
     * Wrong solutions and the case that kills each:
     *   - all three loops from 0            → visible "5 10 / 1 2 3 4 5": 18 vs 2;
     *   - third loop from i + 1, not j + 1  → same visible case: 5 vs 2;
     *   - third loop bounded `k < n - 1`    → "4 9 / 1 2 3 6": 0 vs 1, the only
     *     qualifying triple ends on the LAST element;
     *   - consecutive triples only          → visible case: 0 vs 2;
     *   - assuming n ≥ 3                    → "2 5 / 2 3": the loops must simply
     *     produce 0, not crash;
     *   - none / all of the triples qualify → "5 100 / 1 2 3 4 5" gives 0 and
     *     "5 0 / 0 0 0 0 0" gives 10, which is C(5,3) from `b1`'s formula.
     * "3 0 / 0 0 0" is the smallest input that has a triple at all, and
     * "5 0 / -3 1 2 -1 4" keeps negative numbers in the picture so nobody
     * reaches for a shortcut that assumes the sum only grows.
     *
     * Overflow: |a[i]| ≤ 1000 so a triple sum is at most 3000, and at n = 200
     * the count is at most 1 313 400. `int` throughout. */
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген екі бүтін сан беріледі — n мен s (1 ≤ n ≤ 200, −100 000 ≤ s ≤ 100 000), екінші жолда бос орынмен бөлінген n бүтін сан (әрқайсысы −1000 мен 1000 аралығында, теріс те болуы мүмкін). Қосындысы дәл s-ке тең және i < j < k шартын қанағаттандыратын (i, j, k) үштіктері нешеу? Тек сол бір санды шығар. Мысалы n = 5, s = 10 және сандар 1 2 3 4 5 болса, жауап 2: бұл 1 + 4 + 5 және 2 + 3 + 5. Кодқа отырмас бұрын санап ал: n ең үлкені 200 болғанда үштіктер саны 200 · 199 · 198 / 6 ≈ 1 300 000, ал бұл бір секундке еркін сыяды — сондықтан бәрін бір-бірлеп қарап шығу мұнда әбден жарамды тәсіл.",
      ru: "В первой строке через пробел даны два целых числа — n и s (1 ≤ n ≤ 200, −100 000 ≤ s ≤ 100 000), во второй — n целых чисел через пробел (каждое от −1000 до 1000, они могут быть отрицательными). Сколько существует троек (i, j, k), у которых сумма ровно s и выполнено i < j < k? Выведи только это одно число. Например, при n = 5, s = 10 и числах 1 2 3 4 5 ответ 2: это 1 + 4 + 5 и 2 + 3 + 5. Прежде чем садиться за код, посчитай: при наибольшем n = 200 троек получается 200 · 199 · 198 / 6 ≈ 1 300 000, и это свободно укладывается в секунду — значит, просмотреть их все по одной здесь вполне годный способ.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n, s;\n" +
      "    cin >> n >> s;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> a[i];\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        for (int j = i + 1; j < n; j++) {\n" +
      "            for (int k = j + 1; k < n; k++) {\n" +
      "                if (a[i] + a[j] + a[k] == s) c = c + 1;\n" +
      "            }\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "5 10\n1 2 3 4 5", expectedOutput: "2" },
      { input: "4 6\n1 2 3 4", expectedOutput: "1" },
      { input: "2 5\n2 3", expectedOutput: "0", hidden: true },
      { input: "3 0\n0 0 0", expectedOutput: "1", hidden: true },
      { input: "5 0\n0 0 0 0 0", expectedOutput: "10", hidden: true },
      { input: "6 12\n4 4 4 4 4 4", expectedOutput: "20", hidden: true },
      { input: "5 100\n1 2 3 4 5", expectedOutput: "0", hidden: true },
      { input: "5 0\n-3 1 2 -1 4", expectedOutput: "2", hidden: true },
      { input: "4 9\n1 2 3 6", expectedOutput: "1", hidden: true },
    ],
  },
];
