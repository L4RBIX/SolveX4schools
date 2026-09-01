import type { LessonBlock } from "../../types";

/**
 * m2.l9 · «Цикл және индекс қателері» / «Ошибки циклов и индексов». 9 minutes.
 *
 * Skills: `debug.boundary`, `loops.for`, `lists.index`, `loops.while`.
 *
 * PDF p.7 asks for this lesson twice. The October paragraph names four typical
 * errors —
 *
 *   «Типтік қателер: шексіз цикл, соңғы элементті өткізіп жіберу,
 *    индекстің шекарадан шығуы, жинақтаушы айнымалыға қате бастапқы мән беру»
 *
 * — and the practice paragraph then asks separately for «Қосымша — цикл мен
 * индекс қатесін табу және қолмен трассалау». So the lesson carries one block
 * per named error plus two hand traces, and none of it is invented: b1 lists
 * the four, b3/b4/b5 each put one on screen as a program that really
 * misbehaves, and b6 is the fourth (the infinite loop) in the only form that
 * can be shipped honestly.
 *
 * ## Four decisions, taken once, so no block re-litigates them
 *
 * 1. **The non-terminating program is a `test_case`, never a `find_bug`.**
 *    m2.l3 established this and the reason has not changed: the authoring
 *    checker and `content-execution.test.ts` execute both halves of every
 *    `find_bug`, and a program that hangs is killed by the timeout on every
 *    probe. So b6 shows the hang and grades the *input* the learner names,
 *    b7 traces it far enough to watch the values freeze, and b8 repairs it.
 *    Three blocks, one program, in the order a person actually debugs: notice,
 *    trace, fix.
 *
 * 2. **The hang is an index that only advances in one branch.** m2.l3.b5's
 *    infinite loop was arithmetic (`n / 2` sticking at 0). Repeating that shape
 *    here would test whether the learner remembers lesson 3. This one is a
 *    loop-and-index hang — `i += 1;` sitting inside the `if` braces — which is
 *    the form this lesson's skills are about and the form that survives into
 *    every later month's two-pointer and queue code.
 *
 * 3. **`i < n - 1` appears twice, correct once.** b2 traces a neighbour-pair
 *    loop where the `- 1` is exactly right, and b3 debugs a maximum where the
 *    same bound is exactly wrong. A learner who leaves with the rule "minus one
 *    is a bug" has learned a superstition; the pair is there so the rule they
 *    leave with is "count the values `i` takes, then check what the body does
 *    with the largest one".
 *
 * 4. **b3, b4 and b5 all read their list, so all three declare
 *    `symptomInput`.** The checker's fallback probe is a spread of single
 *    numbers, and a single number fed to a program that expects a count and a
 *    list would report "the two programs behave identically" for every one of
 *    them.
 *
 * ## Why b4 is written with `at()`
 *
 * In Python, reading `a[i + 1]` one step past the end raised IndexError and the
 * program stopped — which is what made the bug worth putting on a screen. C++'s
 * `a[i]` does not check: past the end it reads whatever is next in memory and
 * carries on with a number nobody chose. So b4's program uses `a.at(...)`, the
 * checked form `m2.l4.b1` introduces, and the mistake announces itself with
 * `out of range` on both engines instead of producing an answer no test could
 * predict. The prompt says so; the point is not the method, it is that an index
 * error in C++ is silent unless you ask for it to be loud.
 *
 * ## b9 needs no `break`
 *
 * `break` is October's — m2.l8 teaches it and three of that lesson's blocks
 * turn on it — but b9 does not want it. The `&& ans == -1` guard is not a
 * workaround for a missing construct: it is the word FIRST in the statement,
 * written out, which is the part of the problem the two boundary cases (index 0
 * and no such element) actually test.
 */

const P = 7;

export const M2_L9: LessonBlock[] = [
  {
    id: "m2.l9.b1",
    type: "concept",
    skillRefs: ["debug.boundary", "loops.for", "loops.while", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Циклдің төрт типтік қатесі",
      ru: "Четыре типичные ошибки цикла",
    },
    /* The four are given with their tell-tale SHAPE in code, not just a name,
       because "index out of bounds" is not a thing a learner recognises — the
       pair `i < n` above and `a[i + 1]` below is. The snippet compiles and is
       never executed, which is exactly what lets it show four broken programs
       side by side. The closing sentence is the lesson's objective and the
       reason b2 and b7 exist: the four are distinguished by tracing, not by
       staring. */
    body: {
      kk: "Циклдегі қате әрдайым дерлік бір жерде тығылады — шекарада. Осы айдың төрт типтік қатесі мынау.\n\n1. **Шексіз цикл.** `while` шарты ешқашан жалған болмайды: цикл ішінде оны өзгертетін жол жоқ, немесе бар, бірақ ол бір ғана тармақта орындалады.\n\n2. **Соңғы элемент өткізіліп кетеді.** Цикл шарты `i < n - 1` немесе бастапқы мәні `i = 1` деп жазылған, ал есеп бүкіл тізімді талап етеді. Жауап көбіне дұрыс болып көрінеді — соңғы элемент ең үлкені болғанда ғана бұзылады.\n\n3. **Индекс шекарадан шығады.** Цикл `n - 1` индексіне дейін жетеді, ал дене ішінде `a[i + 1]` тұр. C++-та мұндай қате бағдарламаны тоқтатпайды: `a[i]` индексті тексермейді, сондықтан бағдарлама тізімнен тыс жердегі кездейсоқ санды алып, ештеңе болмағандай жұмысын жалғастыра береді. Дәл сол үнсіздік бұл қатені ең қауіптісі етеді. Күдіктенсең, сол жерде `a[i]` дегенді `a.at(i)` деп ауыстыр: ол индексті тексереді және қате орында бағдарламаны `out of range` хабарымен тоқтатады.\n\n4. **Жинақтаушының бастапқы мәні қате.** `int best = 0;` деп жазылған, ал деректердің ішінде 0-ден үлкен (немесе кіші) сан жоқ. Сонда цикл `best`-ті мүлде өзгертпейді де, бағдарлама тізімде мүлдем кездеспейтін санды жауап деп шығарады.\n\nБұл төртеуін бір-бірінен ажырататын сенімді әдіс біреу ғана: бағдарламаны қағазда қадамдап орындау және әр қадамда `i` мен жинақтаушының мәнін жазып отыру.",
      ru: "Ошибка в цикле почти всегда прячется в одном месте — на границе. Вот четыре типичные ошибки этого месяца.\n\n1. **Бесконечный цикл.** Условие `while` никогда не становится ложным: внутри цикла нет строки, которая его меняет, — или она есть, но выполняется только в одной ветке.\n\n2. **Пропущен последний элемент.** Условие цикла записано как `i < n - 1` или начальное значение взято `i = 1`, а задача требует пройти весь список. Ответ чаще всего выглядит правдоподобно и ломается только тогда, когда последний элемент и есть искомый.\n\n3. **Индекс выходит за границу.** Цикл доходит до индекса `n - 1`, а в теле стоит `a[i + 1]`. В C++ такая ошибка программу не останавливает: `a[i]` не проверяет индекс, поэтому программа возьмёт случайное число за пределами списка и как ни в чём не бывало продолжит работу. Именно эта тишина делает такую ошибку самой опасной. Если есть подозрение — замени в этом месте `a[i]` на `a.at(i)`: он проверяет индекс и останавливает программу с сообщением `out of range`.\n\n4. **Неверное начальное значение накопителя.** Написано `int best = 0;`, а среди данных нет ни одного числа больше (или меньше) нуля. Тогда цикл вообще не меняет `best`, и программа выдаёт в ответ число, которого в списке нет вовсе.\n\nОтличить эти четыре ошибки друг от друга надёжно помогает только одно: выполнить программу по шагам на бумаге, записывая на каждом шаге значения `i` и накопителя.",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {-4, -8, -1};\n" +
      "    int n = a.size();\n" +
      "\n" +
      "    // 1\n" +
      "    int i = 1;\n" +
      "    while (i <= 3) {\n" +
      "        cout << i << endl;\n" +
      "    }\n" +
      "\n" +
      "    // 2\n" +
      "    for (int k = 0; k < n - 1; k++) {\n" +
      "        cout << a[k] << endl;\n" +
      "    }\n" +
      "\n" +
      "    // 3\n" +
      "    for (int k = 0; k < n; k++) {\n" +
      "        cout << a[k] + a[k + 1] << endl;\n" +
      "    }\n" +
      "\n" +
      "    // 4\n" +
      "    int best = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (x > best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best << endl;\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The trace comes BEFORE the three find_bug blocks on purpose. The lesson's
     * second objective is «қатені қағазда трассалау арқылы табу» — find the bug
     * by tracing — and a tool has to be in hand before it is used on something
     * broken. So this program is correct, and what the learner discovers is the
     * fact all three of the following bugs turn on: the largest value `i` takes
     * is `n - 2`, which is exactly why `a[i + 1]` is safe here.
     *
     * Four elements, not five: seven steps is a hand trace, twelve is
     * bookkeeping, and the fourth pair adds nothing the third did not.
     */
    id: "m2.l9.b2",
    type: "trace_code",
    skillRefs: ["loops.for", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама тізімде қатар тұрған тең сандардың жұбын санайды. Оны қағаздағыдай қадамдап орында: әр қадамда `i` мен `c` нешеге тең екенін жаз. Соңында өзіңе сұрақ қой: `i` ең үлкен қандай мәнге жетті және `a[i + 1]` неге бірде-бір рет тізімнен шығып кетпеді?",
      ru: "Эта программа считает пары стоящих рядом одинаковых чисел в списке. Выполни её по шагам, как на бумаге: на каждом шаге запиши, чему равны `i` и `c`. В конце ответь себе на вопрос: какого наибольшего значения достигло `i` и почему `a[i + 1]` ни разу не вышло за пределы списка?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {4, 4, 7, 7};\n" +
      "    int n = a.size();\n" +
      "    int c = 0;\n" +
      "    for (int i = 0; i < n - 1; i++) {\n" +
      "        if (a[i] == a[i + 1]) {\n" +
      "            c = c + 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 8, vars: { c: "0" } },
      { line: 10, vars: { i: "0", c: "0" } },
      { line: 11, vars: { i: "0", c: "1" } },
      { line: 10, vars: { i: "1", c: "1" } },
      { line: 10, vars: { i: "2", c: "1" } },
      { line: 11, vars: { i: "2", c: "2" } },
      { line: 14, vars: { c: "2" } },
    ],
  },
  {
    /*
     * Named error #2: «соңғы элементті өткізіп жіберу».
     *
     * The input is the whole exercise. On `9 3 4 2` the broken program prints
     * the right answer, and on `3 9 4 12` it does not — the bug is invisible
     * until the last element is the one that matters, which is the sentence the
     * concept block made and this block makes the learner feel.
     */
    id: "m2.l9.b3",
    type: "find_bug",
    skillRefs: ["debug.boundary", "loops.for", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама берілген сандардың ең үлкенін шығаруы керек. Бірінші жолда сандардың саны, екінші жолда сандардың өзі оқылады. `4` және `9 3 4 2` енгізгенде ол дұрыс жауап — 9 береді, ал `4` және `3 9 4 12` енгізгенде 12-нің орнына 9 шығарады. Қате қай жолда?",
      ru: "Программа должна выводить наибольшее из данных чисел. В первой строке читается их количество, во второй — сами числа. При вводе `4` и `9 3 4 2` она даёт верный ответ — 9, а при вводе `4` и `3 9 4 12` выводит 9 вместо 12. В какой строке ошибка?",
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
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = a[0];\n" +
      "    for (int i = 0; i < n - 1; i++) {\n" +
      "        if (a[i] > best) {\n" +
      "            best = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 13,
    symptomInput: "4\n3 9 4 12",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = a[0];\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > best) {\n" +
      "            best = a[i];\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "12": {
        failureClass: "misattributed_to_initial_value",
        justification:
          "12-жолдағы `int best = a[0];` дұрыс: жауап әрқашан тізімнің бір элементі болып қалады, әрі мұнда шыққан 9 да тізімде бар сан. Бұл жауап оқушының трассаламай, жаңа ғана оқыған төрт қатенің тізімінен ең таныс «бастапқы мән» үлгісін таңдағанын көрсетеді.",
      },
    },
  },
  {
    /*
     * Named error #3: «индекстің шекарадан шығуы», and the block the file
     * header's `at()` decision exists for.
     *
     * `i < n` is left CORRECT and the neighbour is left wrong, so the repair is
     * unambiguous. The other arrangement — right neighbour, short loop — has two
     * honest fixes (shorten the loop, or guard the access), and a "which line"
     * question with two right answers is a trap, not a task.
     */
    id: "m2.l9.b4",
    type: "find_bug",
    skillRefs: ["lists.index", "debug.boundary", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама тізімде өзінің алдыңғысынан үлкен сандар нешеу екенін санауы керек. Бірінші жолда сандардың саны, екінші жолда сандардың өзі оқылады. `4` және `2 5 3 9` үшін жауап 2 болуы тиіс, бірақ бағдарлама ештеңе шығармай, `out of range` қатесімен тоқтап қалады. Индекстер осы жерде әдейі `at()` арқылы жазылған — сондықтан шекарадан шығу үнсіз өтпей, бірден көрініп тұр. Қате қай жолда?",
      ru: "Программа должна считать, сколько в списке чисел больше своего предыдущего. В первой строке читается их количество, во второй — сами числа. Для `4` и `2 5 3 9` ответ должен быть 2, но программа ничего не выводит и останавливается с ошибкой `out of range`. Индексы здесь намеренно записаны через `at()` — поэтому выход за границу не проходит молча, а виден сразу. В какой строке ошибка?",
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
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a.at(i);\n" +
      "    }\n" +
      "    int c = 0;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a.at(i) > a.at(i + 1)) {\n" +
      "            c += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 14,
    symptomInput: "4\n2 5 3 9",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a.at(i);\n" +
      "    }\n" +
      "    int c = 0;\n" +
      "    for (int i = 1; i < n; i++) {\n" +
      "        if (a.at(i) > a.at(i - 1)) {\n" +
      "            c += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "13": {
        failureClass: "silenced_the_crash_instead_of_fixing_the_neighbour",
        justification:
          "`for (int i = 1; i < n; i++)` — дәл алдыңғысы бар орындардың жиыны, сондықтан ол есепке дұрыс жазылған. 13-жолды таңдау оқушының қатені көріп, циклді қысқартқанын білдіреді: ол құлауды жоюда, ал есеп қай көршімен салыстыру керектігін сұрап тұр.",
      },
    },
  },
  {
    /*
     * Named error #4: «жинақтаушы айнымалыға қате бастапқы мән беру».
     *
     * m2.l5 met this as a maximum on all-negative data. Here it is the mirror —
     * a minimum on all-positive data — so a learner who memorised "best = 0 is
     * wrong when the numbers are negative" is caught: the rule is not about
     * signs, it is that the starting value has to come from the data.
     */
    id: "m2.l9.b5",
    type: "find_bug",
    skillRefs: ["loops.accumulator", "debug.boundary", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама берілген сандардың ең кішісін шығаруы керек; сандардың бәрі оң. Бірінші жолда сандардың саны, екінші жолда сандардың өзі оқылады. `4` және `12 7 19 4` енгізгенде ол 4-тің орнына 0 шығарады — ал 0 деген сан берілген тізімде мүлде жоқ. Қате қай жолда?",
      ru: "Программа должна выводить наименьшее из данных чисел; все числа положительные. В первой строке читается их количество, во второй — сами числа. При вводе `4` и `12 7 19 4` она выводит 0 вместо 4 — а числа 0 в этом списке вообще нет. В какой строке ошибка?",
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
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = 0;\n" +
      "    for (int x : a) {\n" +
      "        if (x < best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 12,
    symptomInput: "4\n12 7 19 4",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int best = a[0];\n" +
      "    for (int x : a) {\n" +
      "        if (x < best) {\n" +
      "            best = x;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << best;\n" +
      "    return 0;\n" +
      "}",
    diagnosticMapping: {
      "14": {
        failureClass: "blamed_a_line_that_never_ran",
        justification:
          "Осы енгізуде 14-жолдағы шарт бірде-бір рет ақиқат болмайды: сандардың бәрі 0-ден үлкен, сондықтан цикл денесі мүлде орындалмайды. Орындалмаған жол қате жауапты тудыра алмайды — бұл таңдау оқушының трассаламай, `<` пен `>` таңбасын шатастырдым деп болжағанын көрсетеді.",
      },
    },
  },
  {
    /*
     * Named error #1: «шексіз цикл». Never graded by running — a `test_case` is
     * graded on the input the learner names — so the hang can be shown as it
     * really is instead of being softened into something that terminates.
     *
     * Three declared witnesses, and they are not the same witness three times:
     * `4 0 7` stops at a zero in the middle, `-5 3` stops at the very first
     * element, and the one-element `0` is the shortest input that hangs at all.
     * Any input whose numbers are all positive runs to the end, which is why
     * the prompt shows one working run first — otherwise the learner looks for
     * a program that is always broken and finds nothing.
     */
    id: "m2.l9.b6",
    type: "test_case",
    skillRefs: ["loops.while", "debug.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама берілген сандардың ішінде оң сандар нешеу екенін санауы керек. Бірінші жолда сандардың саны, екінші жолда сандардың өзі оқылады. `3` және `5 2 3` енгізгенде ол дұрыс жауап — 3 шығарады. Бірақ кейбір енгізулерде ол ешқашан тоқтамайды. Сондай енгізудің бірін толық жаз (санын да, сандарын да) және цикл неге тоқтамайтынын түсіндір.",
      ru: "Эта программа должна считать, сколько положительных чисел среди данных. В первой строке читается их количество, во второй — сами числа. При вводе `3` и `5 2 3` она выводит верный ответ — 3. Но на некоторых вводах она не останавливается никогда. Напиши один такой ввод целиком (и количество, и числа) и объясни, почему цикл не завершается.",
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
      "    for (int j = 0; j < n; j++) {\n" +
      "        cin >> a[j];\n" +
      "    }\n" +
      "    int i = 0;\n" +
      "    int c = 0;\n" +
      "    while (i < n) {\n" +
      "        if (a[i] > 0) {\n" +
      "            c += 1;\n" +
      "            i += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    breakingInputs: ["3\n4 0 7", "2\n-5 3", "1\n0"],
  },
  {
    /*
     * The same program with its list written out, so the trace is definite.
     *
     * This is the block the lesson's second objective is actually about. The
     * last four rows have identical values, and filling in the same two numbers
     * four times is not busywork: it IS the discovery, because the learner
     * cannot write a row that differs from the one above it and that is
     * precisely what "never terminates" means. A hang has no interesting steps,
     * which is the point.
     */
    id: "m2.l9.b7",
    type: "trace_code",
    skillRefs: ["loops.while", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Сол бағдарлама, тек тізімі ішіне жазылып қойылған. Оны қағазда қадамдап орында: әр қадамда `i` мен `c` нешеге тең екенін жаз. Мәндер қай қадамнан бастап өзгеруін тоқтатады және оларды өзгертетін жол неге бір де рет орындалмайды?",
      ru: "Та же программа, только список в неё уже вписан. Выполни её по шагам на бумаге: на каждом шаге запиши, чему равны `i` и `c`. С какого шага значения перестают меняться и почему строка, которая их меняет, больше ни разу не выполняется?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    vector<int> a = {4, 0, 7};\n" +
      "    int n = a.size();\n" +
      "    int i = 0;\n" +
      "    int c = 0;\n" +
      "    while (i < n) {\n" +
      "        if (a[i] > 0) {\n" +
      "            c += 1;\n" +
      "            i += 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 9, vars: { i: "0", c: "0" } },
      { line: 12, vars: { i: "0", c: "1" } },
      { line: 13, vars: { i: "1", c: "1" } },
      { line: 10, vars: { i: "1", c: "1" } },
      { line: 11, vars: { i: "1", c: "1" } },
      { line: 10, vars: { i: "1", c: "1" } },
      { line: 11, vars: { i: "1", c: "1" } },
    ],
  },
  {
    /*
     * The repair, on the program b6 and b7 have already taken apart. One line
     * moves out of the `if` braces.
     *
     * The cases are chosen against the wrong repairs, not for a count:
     *   `3 / 4 0 7`      — the input that used to hang, now visible, answer 2;
     *   `2 / -5 -2`      — nothing counts, so a counter that starts at 1 dies;
     *   `1 / 0`          — one element, and 0 is not positive: `>=` gives 1;
     *   `4 / 0 0 9 0`    — three non-positive elements around one positive, so a
     *                      repair that moves `c += 1;` out of the `if` instead
     *                      of `i += 1;` gives 4;
     *   `5 / -3 8 0 4 -1` — positives at the middle and the far end, so a loop
     *                      that stops one element early gives 1 instead of 2.
     */
    id: "m2.l9.b8",
    type: "modify_code",
    skillRefs: ["loops.while", "loops.counter", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "Осы бағдарламаны түзет: ол қандай сандар берілсе де тоқтап, оң сандардың САНЫН шығарсын. Бір жолдың орнын ауыстыру жеткілікті — оны `if`-тің фигуралы жақшасының ішінде қалдыру керек пе, әлде сыртына шығару керек пе, соны ойлан.",
      ru: "Исправь эту программу так, чтобы она завершалась на любых числах и выводила КОЛИЧЕСТВО положительных. Достаточно переставить одну строку — подумай, должна ли она остаться внутри фигурных скобок `if` или выйти за них.",
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
      "    for (int j = 0; j < n; j++) {\n" +
      "        cin >> a[j];\n" +
      "    }\n" +
      "    int i = 0;\n" +
      "    int c = 0;\n" +
      "    while (i < n) {\n" +
      "        if (a[i] > 0) {\n" +
      "            c += 1;\n" +
      "            i += 1;\n" +
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
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> a(n);\n" +
      "    for (int j = 0; j < n; j++) {\n" +
      "        cin >> a[j];\n" +
      "    }\n" +
      "    int i = 0;\n" +
      "    int c = 0;\n" +
      "    while (i < n) {\n" +
      "        if (a[i] > 0) {\n" +
      "            c += 1;\n" +
      "        }\n" +
      "        i += 1;\n" +
      "    }\n" +
      "    cout << c;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "3\n5 2 3", expectedOutput: "3" },
      { input: "3\n4 0 7", expectedOutput: "2" },
      { input: "2\n-5 -2", expectedOutput: "0", hidden: true },
      { input: "1\n0", expectedOutput: "0", hidden: true },
      { input: "1\n1", expectedOutput: "1", hidden: true },
      { input: "4\n0 0 9 0", expectedOutput: "1", hidden: true },
      { input: "5\n-3 8 0 4 -1", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * The lesson's independent task. Two boundaries and the cases exist for
     * them:
     *   `1 2 3` / 10   — no such element at all, so -1 is printed and a program
     *                    that never initialises `ans` prints something else;
     *   `1 2 9` / 5    — the answer IS the last element, which is the named
     *                    error #2 and the case `i < n - 1` fails;
     *   `9 1 2` / 5    — the answer is index 0, which kills both a loop that
     *                    starts at 1 and `ans = 0` as a "nothing found yet"
     *                    marker;
     *   `5 5 5` / 5    — equal, not greater, so `>=` fails;
     *   `6` / 5        — one element, the shortest legal input;
     *   `-9 -4 -1 0` / -3 — negatives, where "greater than x" and "positive"
     *                    part company;
     *   `1 9 3 7` / 5  — two elements qualify and the FIRST is wanted, so a
     *                    loop that keeps overwriting `ans` prints 3. This one is
     *                    visible: the word «БІРІНШІ» in the statement has to be
     *                    checkable before the learner submits.
     */
    id: "m2.l9.b9",
    type: "write_code",
    skillRefs: ["lists.index", "loops.for", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда сандардың саны n беріледі (1 ≤ n ≤ 1000). Екінші жолда сол n бүтін сан бос орынмен жазылады. Үшінші жолда бүтін сан x беріледі. x-тен қатаң үлкен БІРІНШІ элементтің индексін шығар. Индекс нөлден басталады. Ондай элемент болмаса, -1 шығар.",
      ru: "В первой строке дано количество чисел n (1 ≤ n ≤ 1000). Во второй строке через пробел записаны эти n целых чисел. В третьей строке дано целое число x. Выведи индекс ПЕРВОГО элемента, строго большего x. Индексы начинаются с нуля. Если такого элемента нет, выведи -1.",
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
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    int ans = -1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        if (a[i] > x && ans == -1) {\n" +
      "            ans = i;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ans;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\n1 9 3 7\n5", expectedOutput: "1" },
      { input: "3\n1 2 3\n10", expectedOutput: "-1" },
      { input: "3\n9 1 2\n5", expectedOutput: "0", hidden: true },
      { input: "3\n1 2 9\n5", expectedOutput: "2", hidden: true },
      { input: "3\n5 5 5\n5", expectedOutput: "-1", hidden: true },
      { input: "1\n6\n5", expectedOutput: "0", hidden: true },
      { input: "4\n-9 -4 -1 0\n-3", expectedOutput: "2", hidden: true },
    ],
  },
  {
    /*
     * Support substitution for b9 — the same problem, assembled rather than
     * written from scratch, as the PDF's support route requires («дайын кодты
     * құрастыру мен толықтыру көбірек, нөлден жазу азырақ», p.6).
     *
     * The three blanks are the three decisions the task actually contains and
     * nothing else: what "nothing found yet" is worth, how far the loop goes,
     * and how the program knows it has not found anything yet. The traversal is
     * given, because typing `for (int i = 0; i < n; i++)` a ninth time is not
     * what this learner is short of.
     */
    id: "m2.l9.b9s",
    type: "fill_blank",
    skillRefs: ["lists.index", "loops.for", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Сол есеп, бірақ қаңқасы дайын: бірінші жолда сандардың саны, екіншісінде сандар, үшіншісінде x; x-тен қатаң үлкен БІРІНШІ элементтің индексі керек, болмаса -1. Үш орынды толтыр: жауаптың бастапқы мәні, циклдің шекарасы және «мен әлі ешнәрсе таппадым» дегенді білдіретін тексеру.",
      ru: "Та же задача, но каркас уже готов: в первой строке количество чисел, во второй сами числа, в третьей x; нужен индекс ПЕРВОГО элемента, строго большего x, а если такого нет — -1. Заполни три места: начальное значение ответа, границу цикла и проверку, которая означает «я пока ничего не нашёл».",
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
      "    for (int i = 0; i < n; i++) {\n" +
      "        cin >> a[i];\n" +
      "    }\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    int ans = ___;\n" +
      "    for (int i = 0; i < ___; i++) {\n" +
      "        if (a[i] > x && ans == ___) {\n" +
      "            ans = i;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ans;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "-1" },
      { id: "f2", answer: "n" },
      { id: "f3", answer: "-1" },
    ],
  },
];
