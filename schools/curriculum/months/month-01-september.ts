import type { Month, Lesson, LessonBlock } from "../types";

/**
 * Month 1 · Қыркүйек — reading data, computing, conditions.
 *
 * PDF p.7. This is the only month authored to `published` for the pilot's
 * first term; months 2–9 carry their full structure but their lesson bodies
 * are `draft` until authored and reviewed. That difference is visible in the
 * validator output and in the teacher console — it is not hidden.
 *
 * The PDF promises 36 tasks this month. Every attempt-bearing block below
 * counts toward that figure and `npm run curriculum:validate` reports the
 * real total, never the promised one.
 */

const P = 7; // PDF page for all of September

/* -------------------------------------------------------------------------- */
/* Unit 1 — Кіріс және шығыс                                                   */
/* -------------------------------------------------------------------------- */

const l1Blocks: LessonBlock[] = [
  /*
   * Re-authored for C++17. This lesson used to teach `print` AND `input()` AND
   * `int()`, which is reasonable in Python where each is one call. In C++
   * reading a number needs a declared variable of a chosen type, and that is a
   * bigger idea than a beginner's first lesson can carry on top of the frame.
   * So l1 is OUTPUT ONLY; reading moves to l3, where `int` is taught with it.
   * See docs/cpp17/CPP17_PEDAGOGY.md for the prerequisite graph.
   *
   * The frame is GIVEN in every block here and explained in b3. A learner
   * writes real C++ from the first minute; they do not write `int main()` until
   * l7.
   */
  {
    id: "m1.l1.b1",
    type: "concept",
    skillRefs: ["io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Бағдарлама — бұл нұсқаулар тізбегі",
      ru: "Программа — это последовательность инструкций",
    },
    body: {
      kk: "Компьютер жолдарды жоғарыдан төменге қарай орындайды. `cout <<` — экранға шығару командасы. Әр нұсқаудың соңында нүктелі үтір `;` тұрады: ол компьютерге «бұл нұсқау бітті» дейді. Айналасындағы жолдарды әзірше дайын деп ал — оларды келесі қадамда талдаймыз.",
      ru: "Компьютер выполняет строки сверху вниз. `cout <<` — команда вывода на экран. В конце каждой инструкции стоит точка с запятой `;`: она говорит компьютеру «инструкция закончилась». Строки вокруг пока прими как данность — разберём их на следующем шаге.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Сәлем!";\n    cout << 2 + 2;\n    return 0;\n}',
  },
  {
    id: "m1.l1.b2",
    type: "prediction",
    skillRefs: ["io.print"],
    sourceType: "product-authored",
    /* The Python original asked the same question about `print("2 + 2")`, and
       the distinction it teaches — quotes make it text, and text is not
       computed — is identical in C++. Kept, because it is the single most
       useful idea in the first lesson and it survives the language change
       untouched. */
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады?",
      ru: "Что выведет эта программа?",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "2 + 2";\n    return 0;\n}',
    answer: "2 + 2",
    options: ["4", "2 + 2", '"2 + 2"'],
    diagnosticMapping: {
      // Choosing 4 means the learner did not see the quotes — the only way to
      // arrive at 4 here, so the attribution is unambiguous.
      "4": {
        failureClass: "string_vs_number_confusion",
        justification:
          "Тырнақшаның ішіндегі өрнек есептелмейді. 4 деген жауап тек тырнақшаны байқамағанда шығады.",
      },
    },
  },
  {
    id: "m1.l1.b3",
    type: "concept",
    skillRefs: ["io.print"],
    sourceType: "product-authored",
    /* Earning back the ceremony. b1 said "take these lines as given"; this is
       where that debt is paid, and it is paid before the learner is asked to
       find a bug in them. */
    title: { kk: "Айналасындағы жолдар не үшін керек", ru: "Зачем нужны строки вокруг" },
    body: {
      kk: "`#include <iostream>` — экранмен жұмыс істейтін құралдарды қосады; онсыз `cout` жоқ. `int main() { ... }` — бағдарлама осы жерден басталады, ал `{` мен `}` оның басы мен соңын белгілейді. `return 0;` — «бәрі сәтті бітті» дегені. Бұл төрт жолды әзірге әрдайым осылай жаз; неге дәл солай екенін жыл бойы бөлшектеп ашамыз.",
      ru: "`#include <iostream>` подключает средства для работы с экраном; без него нет `cout`. `int main() { ... }` — отсюда начинается программа, а `{` и `}` отмечают её начало и конец. `return 0;` означает «всё завершилось успешно». Пока просто пиши эти четыре строки всегда одинаково; почему именно так, будем разбирать по частям в течение года.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 2026 - 14;\n    return 0;\n}',
  },
  {
    id: "m1.l1.b4",
    type: "find_bug",
    skillRefs: ["io.print"],
    sourceType: "product-authored",
    /*
     * Re-authored, not translated. The Python version's bug was `n = input()`
     * followed by `n * 2` printing `55` instead of `10` — text repeated rather
     * than a number doubled. C++ has no such behaviour: `"5" * 2` does not
     * compile at all, so there is no wrong ANSWER to find, only a build error.
     *
     * Replaced with the error a beginner in C++ actually makes on day one, and
     * keeps making: a missing semicolon. It is also the first time they meet a
     * compiler message rather than a wrong number, which is a distinction this
     * course has to teach early — the program did not run, so there is nothing
     * to be wrong about.
     */
    prompt: {
      kk: "Бұл бағдарлама тіпті іске қосылмайды: компилятор 6-жолда қате туралы айтады. Шын мәнінде қай жол жөнделуі керек?",
      ru: "Эта программа даже не запускается: компилятор сообщает об ошибке в строке 6. Какую строку на самом деле нужно исправить?",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Сәлем!"\n    cout << 2 + 2;\n    return 0;\n}',
    buggyLine: 5,
    symptomInput: "",
    fixedCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Сәлем!";\n    cout << 2 + 2;\n    return 0;\n}',
    diagnosticMapping: {
      "6": {
        failureClass: "compiler_points_at_the_next_line",
        justification:
          "Компилятор 6-жолда шағымданады, себебі 5-жол әлі бітпеген деп санайды. Нүктелі үтір жоқ болғанда қате көбіне КЕЛЕСІ жолда көрінеді — сондықтан хабарламадағы нөмірден бір жол жоғары қарау керек.",
      },
    },
  },
  {
    id: "m1.l1.b4a",
    type: "worked_example",
    skillRefs: ["io.print", "arith.basic"],
    sourceType: "product-authored",
    title: {
      kk: "Толық талданған мысал: екі жолды шығару",
      ru: "Разобранный пример: вывести две строки",
    },
    problem: {
      kk: "Экранға `Сәлем!` деп жаз, ал келесі жолда 2026 - 14 өрнегінің мәнін шығар.",
      ru: "Выведи на экран `Сәлем!`, а на следующей строке — значение выражения 2026 - 14.",
    },
    steps: [
      {
        kk: "Дайын жақтауды жазамыз: `#include <iostream>`, `using namespace std;` және `int main() { ... return 0; }`.",
        ru: "Пишем готовую рамку: `#include <iostream>`, `using namespace std;` и `int main() { ... return 0; }`.",
      },
      {
        kk: "`cout << \"Сәлем!\";` — тырнақшадағы мәтін сол күйінде шығады, есептелмейді.",
        ru: "`cout << \"Сәлем!\";` — текст в кавычках выводится как есть, он не вычисляется.",
      },
      {
        kk: "`<< endl` жаңа жолға көшіреді. Онсыз екі шығыс бір жолға жабысып қалады.",
        ru: "`<< endl` переводит на новую строку. Без него оба вывода слипнутся в одну строку.",
      },
      {
        kk: "`cout << 2026 - 14;` — мұнда тырнақша жоқ, сондықтан алдымен өрнек есептеледі, содан кейін нәтижесі шығады.",
        ru: "`cout << 2026 - 14;` — здесь кавычек нет, поэтому сначала вычисляется выражение, а потом печатается результат.",
      },
    ],
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Сәлем!" << endl;\n    cout << 2026 - 14;\n    return 0;\n}',
    stdin: "",
    result: { kk: "Сәлем!\n2012", ru: "Сәлем!\n2012" },
  },
  {
    id: "m1.l1.b5",
    type: "write_code",
    skillRefs: ["io.print", "arith.basic"],
    sourceType: "product-authored",
    /*
     * Stage 2 of the scaffold: the frame is given, the learner writes the body.
     * No `cin` — reading is l3 — so the task has a fixed answer and one case
     * with empty input. That is not a weaker task than the Python original's
     * "square the input"; it is the same task the sequence can honestly ask for
     * before types exist. The squaring task moves to l3 and arrives with `int`.
     *
     * The validator warns that this block has no hidden case, and it is right:
     * a learner can write `cout << 56;` and pass without computing anything.
     * That is unavoidable rather than an oversight — with no input there is
     * only one possible answer, so no case can distinguish computing it from
     * knowing it. Adding a second case with the same empty input would silence
     * the warning and protect nothing, which is worse than carrying it.
     *
     * It resolves at l3, where `cin` arrives and a task can vary its answer.
     * This is the only block in the month with the problem, and it is the price
     * of not teaching input in the first lesson of a language where input needs
     * a declared type.
     */
    prompt: {
      kk: "Экранға 7 * 8 өрнегінің мәнін шығар. Тырнақшасыз — санның өзін, мәтінді емес.",
      ru: "Выведи на экран значение выражения 7 * 8. Без кавычек — само число, а не текст.",
    },
    starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 7 * 8;\n    return 0;\n}',
    cases: [{ input: "", expectedOutput: "56" }],
  },
];


const l2Blocks: LessonBlock[] = [
  /*
   * The lesson the language change hit hardest, because the thing it used to
   * teach no longer exists.
   *
   * `a, b = map(int, input().split())` is one Python line with four ideas
   * inside it — read, split, convert, unpack — and the three opening blocks
   * here existed to take that incantation apart. `cin >> a >> b;` has none of
   * them: `>>` skips whitespace itself and converts according to the type the
   * variable was declared with, so there is nothing to split and nothing to
   * convert.
   *
   * Two ideas are left, and they are the two C++ charges for where Python gave
   * them away: a variable must be DECLARED with a type before anything can be
   * read into it, and `cout` inserts no separator, so the space between two
   * answers is something the author writes. Every graded task from here to May
   * needs both, so they are taught rather than assumed.
   */
  {
    id: "m1.l2.b1",
    type: "concept",
    skillRefs: ["io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Санды айнымалыға оқу", ru: "Читаем число в переменную" },
    body: {
      kk: "C++-та айнымалыны алдымен жариялау керек: `int a;` дегені «a — бүтін сан». Содан кейін `cin >> a;` пернетақтадан бір санды оқып, оны `a`-ға салады. Бірнеше санды қатарынан оқуға болады: `cin >> a >> b;`. `>>` бос орындар мен жол ауысуын өзі аттап өтеді, сондықтан жолды бөліктерге бөлудің қажеті жоқ.",
      ru: "В C++ переменную сначала объявляют: `int a;` означает «a — целое число». Затем `cin >> a;` читает с клавиатуры одно число и кладёт его в `a`. Несколько чисел читаются подряд: `cin >> a >> b;`. Оператор `>>` сам пропускает пробелы и переводы строки, поэтому разрезать строку на части не нужно.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a << endl;\n    cout << b << endl;\n    return 0;\n}',
  },
  {
    id: "m1.l2.b1a",
    type: "prediction",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "product-authored",
    /*
     * The Python original asked the same question about `a + b` after
     * `split()`, and its answer — `34` — taught that the pieces are still text.
     * C++ has no such moment: `>>` into an `int` gives a number and nothing
     * else. The same answer survives for a different and equally important
     * reason, which is why this block is re-aimed rather than dropped: `<<`
     * chains values with NOTHING between them, so `a` and `b` come out glued.
     * Both wrong options below are misconceptions a beginner really holds, and
     * each of them can be reached only one way.
     */
    prompt: {
      kk: "Пернетақтадан `3 4` енгізілді. Бағдарлама нені шығарады?",
      ru: "С клавиатуры ввели `3 4`. Что выведет программа?",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a << b;\n    return 0;\n}',
    stdin: "3 4",
    answer: "34",
    options: ["7", "34", "3 4", "12"],
    diagnosticMapping: {
      "7": {
        failureClass: "output_chain_read_as_addition",
        justification:
          "7 деген жауапқа жету үшін `<<` таңбасын қосу деп оқу керек. `<<` ешнәрсені қоспайды — ол мәнді экранға жібереді, сондықтан екі сан бірінен соң бірі шығады.",
      },
      "3 4": {
        failureClass: "cout_assumed_to_insert_a_space",
        justification:
          "«3 4» деп жауап беру `cout` мәндердің арасына бос орын қояды деп ойлағанды білдіреді. Ол ешқандай бөлгіш қоспайды: бос орын керек болса, оны бағдарламада өзің жазасың.",
      },
    },
  },
  {
    id: "m1.l2.b1b",
    type: "concept",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Бір жолда бірнеше жауап", ru: "Несколько ответов в одной строке" },
    body: {
      kk: "`cout` мәндердің арасына ештеңе қоспайды, сондықтан `cout << a << b;` екі санды жабыстырып жібереді. Бөлгішті өзің жазасың: `cout << a << \" \" << b;` — тырнақшадағы бос орын да жеке мән. Жаңа жолға көшу үшін `endl` қолданылады.",
      ru: "`cout` ничего не вставляет между значениями, поэтому `cout << a << b;` склеит два числа. Разделитель пишешь сам: `cout << a << \" \" << b;` — пробел в кавычках это тоже отдельное значение. Для перехода на новую строку используется `endl`.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << " " << a * b;\n    return 0;\n}',
  },
  {
    id: "m1.l2.b2",
    type: "fill_blank",
    skillRefs: ["io.read"],
    sourceType: "product-authored",
    prompt: {
      kk: "Үш санды оқып, қосындысын шығаратындай толықтыр. Бірінші орынға айнымалылардың түрі, екіншісіне экранға жіберу таңбасы керек.",
      ru: "Дополни так, чтобы прочитать три числа и вывести их сумму. В первый пропуск нужен тип переменных, во второй — знак вывода на экран.",
    },
    template:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    ___ a, b, c;\n    cin >> a >> b >> c;\n    cout ___ a + b + c;\n    return 0;\n}',
    blanks: [
      { id: "f1", answer: "int" },
      { id: "f2", answer: "<<" },
    ],
  },
  /*
   * SUPPORT SUBSTITUTIONS.
   *
   * The programme's support route is not "the same month with the hard problems
   * removed" — the PDF says «дайын кодты құрастыру мен толықтыру КӨБІРЕК, нөлден
   * жазу АЗЫРАҚ»: MORE assembling and completing, LESS writing from scratch.
   * Filtering by track was only half the fix; without these blocks, support was
   * still core minus a few problems, and the assembly count was identical for
   * all three routes.
   *
   * Each pair below is the SAME problem twice: a blank editor for core and
   * advanced, and a scaffolded form for support. Substitution rather than
   * addition, so a support learner meets every idea the month teaches and is
   * not quietly given a shorter curriculum.
   */
  {
    id: "m1.l2.b3s",
    type: "fill_blank",
    skillRefs: ["io.read", "arith.basic"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Тіктөртбұрыштың ауданы мен периметрін шығаратындай толықтыр. Аудан — қабырғалардың көбейтіндісі, периметр — барлық қабырғаның қосындысы.",
      ru: "Дополни так, чтобы вывести площадь и периметр прямоугольника. Площадь — произведение сторон, периметр — сумма всех сторон.",
    },
    template:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a ___ b << " " << 2 * (a ___ b);\n    return 0;\n}',
    blanks: [
      { id: "f1", answer: "*" },
      { id: "f2", answer: "+" },
    ],
  },
  {
    id: "m1.l2.b3",
    type: "write_code",
    skillRefs: ["io.read", "arith.basic"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    /* Scaffold stage 3 — the frame is given and locked, the learner declares
       the variables and reads them. See docs/cpp17/CPP17_PEDAGOGY.md: the frame
       is given until it has been earned back, and it is not required of a
       learner until the else-if lesson. */
    prompt: {
      kk: "Тіктөртбұрыштың екі қабырғасы беріледі (1 ≤ a, b ≤ 1000). Ауданы мен периметрін бос орынмен бөліп шығар.",
      ru: "Даны две стороны прямоугольника (1 ≤ a, b ≤ 1000). Выведи площадь и периметр через пробел.",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a * b << " " << 2 * (a + b);\n    return 0;\n}',
    cases: [
      { input: "3 4", expectedOutput: "12 14" },
      { input: "1 1", expectedOutput: "1 4" },
      { input: "10 7", expectedOutput: "70 34", hidden: true },
    ],
  },
  {
    /* PDF p.7 names «сандардың қосындысы мен көбейтіндісі». The sum was covered
       by the fill-blank above; the product had no task at all.

       The bounds are new and they are not decoration: `int` stops at 2147483647
       and `long long` is not taught this month, so a product of two inputs must
       be kept inside it by the statement rather than by luck. */
    id: "m1.l2.b3a",
    type: "write_code",
    skillRefs: ["io.read", "arith.basic", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Екі бүтін сан беріледі (-1000 ≤ a, b ≤ 1000). Алдымен олардың қосындысын, содан кейін көбейтіндісін бос орынмен бөліп шығар.",
      ru: "Даны два целых числа (-1000 ≤ a, b ≤ 1000). Выведи сначала их сумму, затем произведение — через пробел.",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << " " << a * b;\n    return 0;\n}',
    cases: [
      { input: "3 4", expectedOutput: "7 12" },
      { input: "5 0", expectedOutput: "5 0" },
      { input: "1 1", expectedOutput: "2 1", hidden: true },
      { input: "-2 6", expectedOutput: "4 -12", hidden: true },
      { input: "100 100", expectedOutput: "200 10000", hidden: true },
    ],
  },
  {
    /*
     * RE-AUTHORED, not translated. The Python original showed `a // b` and
     * named `5 0` as the input that breaks it — a `ZeroDivisionError`, which is
     * a defined, catchable event in Python. In C++ dividing by zero is
     * UNDEFINED BEHAVIOUR: there is no exception, no guaranteed crash and
     * nothing a judge can be asked to observe, so the task has no C++
     * translation and CPP17_PEDAGOGY.md says so in as many words.
     *
     * It is also a division task two lessons before division is taught.
     *
     * What replaces it is the C++ trap that sits in the same place — `cin >> n`
     * on something that is not a number does not throw and does not stop the
     * program. It leaves the variable at 0 and carries on, so the program
     * prints a confident wrong answer. That is a defined behaviour, it is
     * reachable with only what this lesson has taught, and finding it is
     * exactly the skill the block is for.
     */
    id: "m1.l2.b4",
    type: "test_case",
    skillRefs: ["io.read", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама екі санның қосындысын шығаруы керек. Ол қандай енгізуде дұрыс емес жауап береді? Өз тексеру мысалыңды ұсын. Кеңес: әр енгізу сан бола бермейді.",
      ru: "Эта программа должна выводить сумму двух чисел. На каком вводе она даст неверный ответ? Предложи свой тест. Подсказка: не всякий ввод является числом.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n    return 0;\n}',
    breakingInputs: ["3 x"],
  },
];

/* -------------------------------------------------------------------------- */
/* Unit 2 — Арифметика                                                         */
/* -------------------------------------------------------------------------- */

const l3Blocks: LessonBlock[] = [
  {
    id: "m1.l3.b1",
    type: "concept",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Бүтін бөлу және қалдық", ru: "Целочисленное деление и остаток" },
    /*
     * Python's `//` FLOORS, so the Python version of this block had to defer
     * the negative case as a later topic — `-7 // 2` is `-4`, which is not
     * "throw the fraction away".
     *
     * C++ truncates towards zero, and that rule is short enough to state in one
     * sentence and true everywhere, so the deferral is gone: `-7 / 2` is `-3`
     * and `-7 % 2` is `-1`, the remainder taking the sign of the dividend. A
     * month whose parity task has `-3` and `-8` among its hidden cases should
     * not be leaving the learner to guess that.
     */
    body: {
      kk: "Екі бүтін сан бөлінгенде `a / b` толық бөліндіні береді, ал бөлшек бөлігі лақтырылып тасталады: `17 / 5` — 3. `a % b` болса қалдықты береді: `17 % 5` — 2. Екеуі бірге «толық неше рет сыйды және нешеуі артты» деген сұраққа жауап береді. Теріс сан кездессе, C++ бөліндіні нөлге қарай қысқартады, ал қалдық бөлінгіштің таңбасын алады: `-7 / 2` — -3, `-7 % 2` — -1.",
      ru: "При делении двух целых чисел `a / b` даёт целую часть частного, а дробная часть просто отбрасывается: `17 / 5` — это 3. А `a % b` даёт остаток: `17 % 5` — это 2. Вместе они отвечают на вопрос «сколько раз поместилось целиком и сколько осталось». Для отрицательных чисел C++ отбрасывает дробную часть в сторону нуля, а остаток берёт знак делимого: `-7 / 2` — это -3, `-7 % 2` — это -1.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 17 / 5 << endl;   // 3\n    cout << 17 % 5 << endl;   // 2\n    cout << -7 / 2 << endl;   // -3\n    cout << -7 % 2 << endl;   // -1\n    return 0;\n}',
  },
  {
    id: "m1.l3.b2",
    type: "visual_simulation",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "product-authored",
    simulation: "step_execution",
    prompt: {
      kk: "17 кәмпитті 5 балаға бөлгенде не болатынын қадамдап көр.",
      ru: "Посмотри пошагово, что происходит при делении 17 конфет между 5 детьми.",
    },
    config: { total: 17, groups: 5 },
  },
  {
    id: "m1.l3.b3",
    type: "prediction",
    skillRefs: ["arith.remainder"],
    sourceType: "product-authored",
    prompt: { kk: "Нәтижесі қандай?", ru: "Каков результат?" },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 7 % 2;\n    return 0;\n}',
    answer: "1",
    options: ["0", "1", "3", "3.5"],
    diagnosticMapping: {
      "3": {
        failureClass: "remainder_vs_quotient_swap",
        justification:
          "3 — бұл 7 / 2 нәтижесі. Оны таңдау `%` пен `/` орындарын ауыстырғанды білдіреді.",
      },
      "3.5": {
        failureClass: "integer_operators_read_as_school_division",
        justification:
          "3.5 — қағаздағы бөлудің жауабы. Оны таңдау `%` амалын бөлу деп оқығанды және бүтін сандармен жұмыс істеп тұрғанын байқамағанды білдіреді.",
      },
    },
  },
  {
    id: "m1.l3.b4",
    type: "write_code",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Секундпен берілген уақыт беріледі (0 ≤ t ≤ 100000). Оны минут пен секундқа айналдыр. Мысалы 125 → «2 5».",
      ru: "Дано время в секундах (0 ≤ t ≤ 100000). Переведи его в минуты и секунды. Например 125 → «2 5».",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int t;\n    cin >> t;\n    cout << t / 60 << " " << t % 60;\n    return 0;\n}',
    cases: [
      { input: "125", expectedOutput: "2 5" },
      { input: "60", expectedOutput: "1 0" },
      { input: "59", expectedOutput: "0 59", hidden: true },
      { input: "3600", expectedOutput: "60 0", hidden: true },
    ],
  },
  {
    /*
     * Was the even/odd task, which needs `if`/`else` — one full lesson before
     * Unit 3 introduces conditions at m1.l4.b1. A learner following the month
     * in order met a branch before anyone had explained what a branch is. The
     * parity task now lives at m1.l4.b5, immediately after `if`/`else` is
     * taught, and this slot carries pure `/`-and-`%` work instead: it codes
     * the very simulation the learner has just stepped through in m1.l3.b2
     * (17 sweets, 5 children), which is what that visualiser is there for.
     */
    id: "m1.l3.b5",
    type: "write_code",
    skillRefs: ["arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "n кәмпитті k балаға тең бөлеміз (0 ≤ n ≤ 100000, 1 ≤ k ≤ 100). Әрқайсысына нешеуден тиеді және нешеуі артып қалады? Екі санды бос орынмен бөліп шығар.",
      ru: "n конфет делим поровну между k детьми (0 ≤ n ≤ 100000, 1 ≤ k ≤ 100). Сколько достанется каждому и сколько конфет останется? Выведи два числа через пробел.",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, k;\n    cin >> n >> k;\n    cout << n / k << " " << n % k;\n    return 0;\n}',
    cases: [
      { input: "17 5", expectedOutput: "3 2" },
      { input: "10 2", expectedOutput: "5 0" },
      { input: "3 5", expectedOutput: "0 3", hidden: true },
      { input: "100 7", expectedOutput: "14 2", hidden: true },
      { input: "0 4", expectedOutput: "0 0", hidden: true },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Unit 3 — Шарттар                                                            */
/* -------------------------------------------------------------------------- */

const l4Blocks: LessonBlock[] = [
  {
    id: "m1.l4.b1",
    type: "concept",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    /* Indentation is not what groups statements in C++ — braces are, and a
       lesson that said otherwise would be teaching a rule the compiler does
       not have. The learner still indents, because a human reads it; the
       point of the block is that the two are different claims. */
    title: { kk: "if және else", ru: "if и else" },
    body: {
      kk: "`if` жақшасындағы шарт орындалса — бір тармақ, орындалмаса `else` тармағы жүреді. Тармаққа қай жолдар кіретінін фигуралық жақшалар `{ }` шешеді, шегініс емес: шегініс адамға оқуға ыңғайлы болу үшін ғана. Салыстыру таңбалары: `<`, `>`, `<=`, `>=`, `==` (тең), `!=` (тең емес). Теңдікті тексергенде екі теңдік таңбасы қойылатынын ұмытпа.",
      ru: "Если условие в скобках после `if` истинно — выполняется одна ветка, иначе — ветка `else`. Какие строки попадают в ветку, решают фигурные скобки `{ }`, а не отступ: отступ нужен только человеку, который читает код. Знаки сравнения: `<`, `>`, `<=`, `>=`, `==` (равно), `!=` (не равно). При проверке равенства не забывай про два знака равенства.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    if (n > 0) {\n        cout << "positive";\n    } else {\n        cout << "not positive";\n    }\n    return 0;\n}',
  },
  {
    id: "m1.l4.b2",
    type: "trace_code",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    /* The old program was `if n > 3` with `n = 5` — the branch was decided by a
       comparison the learner could answer at a glance, and the step list then
       named the branch line, which said which branch had run before they traced
       anything. Now the branch turns on `7 % 3`, so the learner has to compute
       `x` at step 2 to know where the third step goes. The step list still names
       the line taken, but by then they have already done the work it would have
       given away. */
    prompt: {
      kk: "n = 7 болғанда бағдарламаны қағаздағыдай қадамдап орында. Әр жолдан кейін айнымалылардың мәнін жаз.",
      ru: "Выполни программу пошагово, как на бумаге, при n = 7. После каждой строки запиши значения переменных.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 7;\n    int x = n % 3;\n    if (x == 1) {\n        x = x + 10;\n    } else {\n        x = x - 10;\n    }\n    cout << x;\n    return 0;\n}',
    steps: [
      { line: 5, vars: { n: "7" } },
      { line: 6, vars: { n: "7", x: "1" } },
      { line: 8, vars: { n: "7", x: "11" } },
      { line: 12, vars: { n: "7", x: "11" } },
    ],
  },
  {
    id: "m1.l4.b3",
    type: "reorder_code",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "product-authored",
    /*
     * The Russian prompt used to quote «көп» and «аз» — untranslated Kazakh —
     * and the program printed those same Kazakh literals, so a Russian-track
     * learner could order the lines by matching glyphs without reading the
     * condition. `code` is a plain string and cannot be localised, so the
     * program prints the English tokens the month already uses for graded
     * output, and both prompts name them.
     *
     * The frame arrives as two chunks rather than as five separate lines. It is
     * given, not taught, at this point in the month, and shuffling `#include`
     * against `return 0;` would be a puzzle about ceremony rather than about
     * the condition. The braces ARE shuffled, because pairing them is the thing
     * C++ adds to this task and Python did not have.
     */
    prompt: {
      kk: "Жолдарды дұрыс ретке қой: сан оқылады, ол 100-ден үлкен болса «many», әйтпесе «few» шығады. Фигуралық жақшалардың орнына мұқият қара.",
      ru: "Расставь строки: читается число, если оно больше 100 — выводится «many», иначе «few». Внимательно следи за местом фигурных скобок.",
    },
    lines: [
      { id: "r6", code: "#include <iostream>\nusing namespace std;\n\nint main() {" },
      { id: "r1", code: "    int n;\n    cin >> n;" },
      { id: "r2", code: "    if (n > 100) {" },
      { id: "r3", code: '        cout << "many";' },
      { id: "r4", code: "    } else {" },
      { id: "r5", code: '        cout << "few";' },
      { id: "r8", code: "    }" },
      { id: "r7", code: "    return 0;\n}" },
    ],
    correctOrder: ["r6", "r1", "r2", "r3", "r4", "r5", "r8", "r7"],
  },
  {
    id: "m1.l4.b4",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "product-authored",
    /* Scaffold stage 4 — the frame AND the reading are given; what is left is
       the condition, which is the whole of what this lesson teaches. */
    prompt: {
      kk: "Екі сан беріледі. Үлкенін шығар. Тең болса, кез келгенін шығар.",
      ru: "Даны два числа. Выведи большее. Если равны — любое из них.",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    if (a > b) {\n        cout << a;\n    } else {\n        cout << b;\n    }\n    return 0;\n}',
    cases: [
      { input: "3 7", expectedOutput: "7" },
      { input: "9 2", expectedOutput: "9" },
      { input: "4 4", expectedOutput: "4", hidden: true },
      { input: "-5 -9", expectedOutput: "-5", hidden: true },
    ],
  },
  {
    /* Relocated from m1.l3.b5. Parity is a `%` task, but writing it needs
       `if`/`else`, and in Unit 2 it demanded a branch a full lesson before
       anyone had explained what a branch was. Here it is the first thing the
       learner writes with the condition they have just met.

       The negative cases survive the language change and are worth keeping for
       a reason that is new: `-3 % 2` is `-1` in C++ and `1` in Python, and the
       task is written so that both answers land on «odd». A learner comparing
       `n % 2 == 0` gets the right answer either way; one who wrote
       `n % 2 == 1` would not, and the hidden `-3` is what tells them. */
    id: "m1.l4.b5",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бүтін сан беріледі. Ол жұп болса «even», тақ болса «odd» шығар.",
      ru: "Дано целое число. Если оно чётное — выведи «even», если нечётное — «odd».",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    if (n % 2 == 0) {\n        cout << "even";\n    } else {\n        cout << "odd";\n    }\n    return 0;\n}',
    cases: [
      { input: "4", expectedOutput: "even" },
      { input: "7", expectedOutput: "odd" },
      { input: "0", expectedOutput: "even", hidden: true },
      { input: "-3", expectedOutput: "odd", hidden: true },
      { input: "-8", expectedOutput: "even", hidden: true },
    ],
  },
];

const l5Blocks: LessonBlock[] = [
  {
    id: "m1.l5.b1",
    type: "concept",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "else if тізбегі", ru: "Цепочка else if" },
    /*
     * This is where the frame stops being given.
     *
     * CPP17_PEDAGOGY.md's prerequisite table has `#include`, `int main`, `{}`
     * and `return 0` as "given as scaffold — required l7", and this is the
     * seventh lesson in teaching order. Every graded task from here on ships
     * without a `starter`, so the learner writes the whole program. Saying so
     * out loud in the lesson is the difference between a scaffold that is
     * removed and one that quietly disappears.
     */
    body: {
      kk: "Үш немесе одан көп жағдай болса, `else if` қолданылады. Тексеру жоғарыдан төмен жүреді және бірінші сәйкес келген тармақ орындалғаннан кейін қалғандары мүлде қаралмайды. Бүгіннен бастап жақтауды — `#include <iostream>`, `using namespace std;`, `int main() { ... return 0; }` — өзің жазасың: ол алты сабақ бойы дайын беріліп келді, енді сенікі.",
      ru: "Если случаев три и больше, используется `else if`. Проверка идёт сверху вниз, и после первой подошедшей ветки остальные не рассматриваются вовсе. С этого урока рамку — `#include <iostream>`, `using namespace std;`, `int main() { ... return 0; }` — ты пишешь сам: шесть уроков она выдавалась готовой, теперь она твоя.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    if (n > 0) {\n        cout << "positive";\n    } else if (n < 0) {\n        cout << "negative";\n    } else {\n        cout << "zero";\n    }\n    return 0;\n}',
  },
  {
    id: "m1.l5.b2",
    type: "prediction",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "product-authored",
    prompt: {
      kk: "n = 10 болғанда не шығады?",
      ru: "Что выведется при n = 10?",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n = 10;\n    if (n > 5) {\n        cout << "A";\n    } else if (n > 8) {\n        cout << "B";\n    } else {\n        cout << "C";\n    }\n    return 0;\n}',
    answer: "A",
    options: ["A", "B", "C", "A B"],
    diagnosticMapping: {
      B: {
        failureClass: "elif_chain_short_circuit_missed",
        justification:
          "B тек барлық шарт тексеріледі деп ойлағанда таңдалады. Шын мәнінде бірінші сәйкес тармақтан кейін тізбек тоқтайды.",
      },
      "A B": {
        failureClass: "elif_chain_short_circuit_missed",
        justification:
          "Екі тармақтың бірге орындалуы мүмкін емес — бұл да тізбектің тоқтайтынын түсінбегенді көрсетеді.",
      },
    },
  },
  {
    id: "m1.l5.b3s",
    type: "fill_blank",
    skillRefs: ["cond.if_elif_else", "compare.operators", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Тізбектің құрылымы дайын — тек шектерді қой. 85 және одан жоғары «5», 70-тен жоғары «4», 50-ден жоғары «3», қалғаны «2». Шекара мәнінің өзі кіретінін ұмытпа.",
      ru: "Структура цепочки готова — расставь только границы. 85 и выше «5», от 70 «4», от 50 «3», остальное «2». Не забудь, что само граничное значение входит.",
    },
    template:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int b;\n    cin >> b;\n    if (b >= ___) {\n        cout << 5;\n    } else if (b >= ___) {\n        cout << 4;\n    } else if (b >= ___) {\n        cout << 3;\n    } else {\n        cout << 2;\n    }\n    return 0;\n}',
    blanks: [
      { id: "f1", answer: "85" },
      { id: "f2", answer: "70" },
      { id: "f3", answer: "50" },
    ],
  },
  {
    id: "m1.l5.b3",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Баға беріледі (0–100). 85 және одан жоғары — «5», 70–84 — «4», 50–69 — «3», қалғаны — «2».",
      ru: "Дан балл (0–100). 85 и выше — «5», 70–84 — «4», 50–69 — «3», остальное — «2».",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int b;\n    cin >> b;\n    if (b >= 85) {\n        cout << 5;\n    } else if (b >= 70) {\n        cout << 4;\n    } else if (b >= 50) {\n        cout << 3;\n    } else {\n        cout << 2;\n    }\n    return 0;\n}',
    /* Every band is now exercised, and every threshold is probed at n-1 / n.
       The old set produced only 5, 4 and 2 — never 3 — so a submission with the
       entire `else if (b >= 50)` branch deleted passed all six cases. The
       50–69 band is one of the three thresholds this task exists to teach. */
    cases: [
      { input: "90", expectedOutput: "5" },
      { input: "85", expectedOutput: "5" },
      { input: "84", expectedOutput: "4", hidden: true },
      { input: "70", expectedOutput: "4", hidden: true },
      { input: "69", expectedOutput: "3", hidden: true },
      { input: "50", expectedOutput: "3", hidden: true },
      { input: "49", expectedOutput: "2", hidden: true },
      { input: "0", expectedOutput: "2", hidden: true },
      { input: "100", expectedOutput: "5", hidden: true },
    ],
  },
  {
    id: "m1.l5.b3a",
    type: "worked_example",
    skillRefs: ["cond.if_elif_else", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: бірнеше тармақ", ru: "Разобранный пример: несколько веток" },
    problem: {
      kk: "Ауа температурасы беріледі. 25-тен жоғары болса «hot», 10-нан 25-ке дейін «warm», қалғанда «cold» шығар.",
      ru: "Дана температура воздуха. Выше 25 — «hot», от 10 до 25 — «warm», иначе «cold».",
    },
    steps: [
      {
        kk: "Үш жағдай бар, сондықтан `if` — `else if` — `else` тізбегін құрамыз.",
        ru: "Случаев три, поэтому строим цепочку `if` — `else if` — `else`.",
      },
      {
        kk: "Ең жоғарғы шектен бастаймыз: `t > 25`. Егер бұл орындалса, қалған тармақтар мүлде қаралмайды.",
        ru: "Начинаем с самой верхней границы: `t > 25`. Если она сработала, остальные ветки уже не проверяются.",
      },
      {
        kk: "Екінші тармақта `t >= 10` жеткілікті: бірінші шарт өтпегендіктен, мұнда келген сан 25-тен аспайтыны өзінен-өзі белгілі. `t >= 10 && t <= 25` деп жазудың қажеті жоқ.",
        ru: "Во второй ветке достаточно `t >= 10`: раз первое условие не сработало, сюда попадают только числа не больше 25. Писать `t >= 10 && t <= 25` не нужно.",
      },
      {
        kk: "Шекараны тексереміз: 25 — «warm» (себебі 25 > 25 жалған), 26 — «hot», 10 — «warm», 9 — «cold».",
        ru: "Проверяем границы: 25 — «warm» (ведь 25 > 25 ложно), 26 — «hot», 10 — «warm», 9 — «cold».",
      },
    ],
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int t;\n    cin >> t;\n    if (t > 25) {\n        cout << "hot";\n    } else if (t >= 10) {\n        cout << "warm";\n    } else {\n        cout << "cold";\n    }\n    return 0;\n}',
    stdin: "25",
    result: { kk: "25 енгізгенде: warm", ru: "При вводе 25: warm" },
  },
  {
    /* PDF p.7 names «таңбасы». The sign program existed only as the worked
       example in m1.l5.b1, so the learner read it and never wrote one. This
       asks for the numeric signum rather than the words that concept prints,
       so it is a task rather than a transcription. */
    id: "m1.l5.b3b",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Сан беріледі (-1000000 ≤ n ≤ 1000000). Ол оң болса 1, теріс болса -1, нөл болса 0 шығар.",
      ru: "Дано число (-1000000 ≤ n ≤ 1000000). Если оно положительное — выведи 1, отрицательное — -1, ноль — 0.",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    if (n > 0) {\n        cout << 1;\n    } else if (n < 0) {\n        cout << -1;\n    } else {\n        cout << 0;\n    }\n    return 0;\n}',
    cases: [
      { input: "7", expectedOutput: "1" },
      { input: "-3", expectedOutput: "-1" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "1", expectedOutput: "1", hidden: true },
      { input: "-1", expectedOutput: "-1", hidden: true },
      { input: "1000000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m1.l5.b4",
    type: "find_bug",
    skillRefs: ["cond.if_elif_else", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "85 балл «4» деп шығып тұр. Қате қай жолда?",
      ru: "Балл 85 выводится как «4». В какой строке ошибка?",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int b;\n    cin >> b;\n    if (b > 85) {\n        cout << 5;\n    } else if (b >= 70) {\n        cout << 4;\n    } else {\n        cout << 3;\n    }\n    return 0;\n}',
    buggyLine: 7,
    symptomInput: "85",
    fixedCode:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int b;\n    cin >> b;\n    if (b >= 85) {\n        cout << 5;\n    } else if (b >= 70) {\n        cout << 4;\n    } else {\n        cout << 3;\n    }\n    return 0;\n}',
    /* Keyed to the branch that FIRED, not to the answer. `checkBlock` only
       consults the mapping when the learner is WRONG, so a mapping keyed on the
       correct line attributed nothing at all. Blaming line 9 is the real
       misconception here: the learner sees "85 printed 4", finds the branch
       that printed 4, and repairs the branch that fired instead of the one that
       wrongly let the value through. */
    diagnosticMapping: {
      "9": {
        failureClass: "blamed_the_branch_that_fired",
        justification:
          "9-жол — бұл шыққан жауапты БАСҚАН тармақ, бірақ қате онда емес. 85 мұнда тек бірінші шарт оны өткізіп жібергендіктен жетті. Себепті шыққан жерден емес, жоғарыдан іздеу керек.",
      },
    },
  },
];

const l6Blocks: LessonBlock[] = [
  {
    id: "m1.l6.b1",
    type: "concept",
    skillRefs: ["logic.and_or_not"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "&&, || және !", ru: "&&, || и !" },
    body: {
      kk: "`&&` — екеуі де ақиқат болғанда ғана ақиқат. `||` — кем дегенде біреуі ақиқат болса жеткілікті. `!` — мәнді керісінше айналдырады. Теңдікті терістеудің қысқа жазылуы бар: `x != 7` дегеніміз `!(x == 7)` дегенмен бірдей, `!=` — «тең емес». Шекараны қоса салыстыру үшін `<=` және `>=` бар: `x <= 7` — «7-ден кіші немесе тең». C++-та ақиқат 1 болып, жалған 0 болып шығады — сондықтан төмендегі бағдарлама әріп емес, сан басып шығарады.",
      ru: "`&&` истинно только когда истинны оба. `||` — достаточно хотя бы одного. `!` меняет значение на противоположное. У отрицания равенства есть короткая запись: `x != 7` — это то же самое, что `!(x == 7)`, а `!=` читается «не равно». Чтобы сравнить, включая границу, есть `<=` и `>=`: `x <= 7` — «меньше или равно 7». В C++ истина печатается как 1, а ложь как 0 — поэтому программа ниже выводит цифры, а не слова.",
    },
    /* The last two operators are not decoration. `m1.l6.b3` and `m1.l6.b3s` —
       two blocks later, on all three routes — solve the leap year with
       `y % 100 != 0`, and `<=` is needed by `m1.l8.b2` and by `m1.as.b1`,
       SEPTEMBER'S OWN MONTHLY CHECK. Both belong here rather than in the blocks
       that need them: this is the lesson about composing conditions, and «not
       equal» is one.

       The parentheses around every comparison are load-bearing and new to C++:
       `<<` binds TIGHTER than `>` and `<`, so `cout << x > 0` parses as
       `(cout << x) > 0` and does not mean what it looks like. */
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x = 7;\n    cout << (x > 0 && x < 10) << endl;   // 1\n    cout << (x < 0 || x > 5) << endl;    // 1\n    cout << !(x == 7) << endl;           // 0\n    cout << (x != 7) << endl;            // 0\n    cout << (x <= 7) << endl;            // 1\n    return 0;\n}',
  },
  {
    id: "m1.l6.b2",
    type: "multiple_choice",
    skillRefs: ["logic.and_or_not", "compare.operators"],
    sourceType: "product-authored",
    prompt: {
      kk: "«x 10 мен 20-ның аралығында (шектерін қоса)» деген шартты қалай жазамыз?",
      ru: "Как записать условие «x в промежутке от 10 до 20 включительно»?",
    },
    options: [
      { id: "o1", label: { kk: "x >= 10 && x <= 20", ru: "x >= 10 && x <= 20" } },
      { id: "o2", label: { kk: "x >= 10 || x <= 20", ru: "x >= 10 || x <= 20" } },
      { id: "o3", label: { kk: "x > 10 && x < 20", ru: "x > 10 && x < 20" } },
      { id: "o4", label: { kk: "x >= 20 && x <= 10", ru: "x >= 20 && x <= 10" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "and_or_swap",
        justification:
          "`||` нұсқасы кез келген сан үшін ақиқат болады. Оны таңдау — `&&` пен `||` мағынасын ауыстырғаны.",
      },
      o3: {
        failureClass: "strict_vs_inclusive_boundary",
        justification:
          "Дұрыс логика, бірақ 10 мен 20 шығып қалған. Бұл тек шекараны қоспау қатесі.",
      },
      o4: {
        failureClass: "swapped_interval_bounds",
        justification:
          "Шектер орындары ауысып кеткен: бір сан бір мезгілде 20-дан үлкен әрі 10-нан кіші бола алмайды, сондықтан бұл шарт ешқашан ақиқат болмайды. Кез келген санды қойып көрсең, бірден көрінеді.",
      },
    },
  },
  {
    /* `!` was shown once in a concept sample and then appeared only inside a
       WRONG option — never required by a correct answer anywhere in the month.
       This asks the learner to reason about what negating a condition does to
       its boundary, which is the one place `!` earns its keep in September. */
    id: "m1.l6.b2a",
    type: "multiple_choice",
    skillRefs: ["logic.and_or_not", "compare.operators", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "`!(x < 10)` шартына қайсысы дәл тең?",
      ru: "Какое условие в точности равносильно `!(x < 10)`?",
    },
    options: [
      { id: "o1", label: { kk: "x >= 10", ru: "x >= 10" } },
      { id: "o2", label: { kk: "x > 10", ru: "x > 10" } },
      { id: "o3", label: { kk: "x <= 10", ru: "x <= 10" } },
      { id: "o4", label: { kk: "x != 10", ru: "x != 10" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "strict_vs_inclusive_boundary",
        justification:
          "`x < 10` жалған болатын сандар — 10 және одан үлкендер. Демек 10-ның өзі кіреді. `x > 10` деп жазу дәл 10 мәнін жоғалтады.",
      },
    },
  },
  {
    id: "m1.l6.b2b",
    type: "write_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Кинотеатрда 12 жасқа толмағандарға және 65 жастан асқандарға жеңілдік бар. Жас беріледі. Жеңілдігі ЖОҚ адам үшін «full», бары үшін «discount» шығар.",
      ru: "В кинотеатре скидка тем, кому меньше 12, и тем, кому больше 65. Дан возраст. Для того, у кого скидки НЕТ, выведи «full», иначе «discount».",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int age;\n    cin >> age;\n    if (!(age < 12 || age > 65)) {\n        cout << "full";\n    } else {\n        cout << "discount";\n    }\n    return 0;\n}',
    cases: [
      { input: "30", expectedOutput: "full" },
      { input: "8", expectedOutput: "discount" },
      { input: "12", expectedOutput: "full", hidden: true },
      { input: "11", expectedOutput: "discount", hidden: true },
      { input: "65", expectedOutput: "full", hidden: true },
      { input: "66", expectedOutput: "discount", hidden: true },
    ],
  },
  {
    id: "m1.l6.b3s",
    type: "modify_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама тек «4-ке бөліне ме?» дегенді тексереді, сондықтан 1900 жылды кібісе деп қате айтады. Ережені толықтыр: 100-ге бөлінсе, тек 400-ге бөлінгенде ғана кібісе.",
      ru: "Эта программа проверяет только «делится ли на 4», поэтому ошибочно считает 1900 високосным. Дополни правило: если год делится на 100, то високосный он только при делении на 400.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int y;\n    cin >> y;\n    if (y % 4 == 0) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int y;\n    cin >> y;\n    if (y % 400 == 0 || (y % 4 == 0 && y % 100 != 0)) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    cases: [
      { input: "2024", expectedOutput: "yes" },
      { input: "1900", expectedOutput: "no" },
      { input: "2000", expectedOutput: "yes", hidden: true },
      { input: "2023", expectedOutput: "no", hidden: true },
      { input: "2100", expectedOutput: "no", hidden: true },
    ],
  },
  {
    id: "m1.l6.b3",
    type: "write_code",
    skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
    /* Was `curriculum-derived, pdfPage: 7`. Leap year appears nowhere in the
       PDF's September practice list; it is a product-authored task serving the
       and/or/not requirement. The validator only checks that a page number
       EXISTS, never that the content is on that page, so the claim passed —
       and `sourceType` exists precisely so nobody can later mistake an authored
       drill for something the approved programme specified. */
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Жыл беріледі. Ол кібісе жыл ба? «yes» немесе «no» шығар. Ереже: 4-ке бөлінеді, бірақ 100-ге бөлінсе, тек 400-ге бөлінгенде ғана кібісе.",
      ru: "Дан год. Високосный ли он? Выведи «yes» или «no». Правило: делится на 4, но если делится на 100 — только если делится на 400.",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int y;\n    cin >> y;\n    if (y % 400 == 0 || (y % 4 == 0 && y % 100 != 0)) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    cases: [
      { input: "2024", expectedOutput: "yes" },
      { input: "1900", expectedOutput: "no" },
      { input: "2000", expectedOutput: "yes", hidden: true },
      { input: "2023", expectedOutput: "no", hidden: true },
      { input: "2100", expectedOutput: "no", hidden: true },
    ],
  },
  {
    id: "m1.l6.b4",
    type: "explain",
    skillRefs: ["logic.and_or_not"],
    /* Follows m1.l6.b3, so it inherits its provenance. */
    sourceType: "product-authored",
    prompt: {
      kk: "Кібісе жыл есебінде 1900 неге кібісе емес, ал 2000 неге кібісе? Өз сөзіңмен түсіндір.",
      ru: "Почему 1900 не високосный, а 2000 — високосный? Объясни своими словами.",
    },
    expectedPoints: [
      {
        kk: "1900 мен 2000 екеуі де 4-ке және 100-ге бөлінеді, сондықтан бірінші ереже жеткіліксіз.",
        ru: "И 1900, и 2000 делятся на 4 и на 100, поэтому первого правила недостаточно.",
      },
      {
        kk: "Айырмасы 400-де: 2000 400-ге бөлінеді, 1900 бөлінбейді.",
        ru: "Разница в 400: 2000 делится на 400, 1900 — нет.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Unit 4 — Шекаралар, қателер, дербес шешу                                    */
/* -------------------------------------------------------------------------- */

const l7Blocks: LessonBlock[] = [
  {
    id: "m1.l7.b1",
    type: "concept",
    skillRefs: ["debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Шарт шекарасы", ru: "Граница условия" },
    body: {
      kk: "Қателердің көбі дәл шекарада жасырынады. Бағдарламаны тексергенде әрқашан шекаралық мәндерді бөлек сына: шарттағы санның өзін, одан бір кем және бір артық мәнді. Төмендегі бағдарлама үшін бұл — 9, 10 және 11.",
      ru: "Большая часть ошибок прячется ровно на границе. Проверяя программу, всегда отдельно пробуй граничные значения: само число из условия, на единицу меньше и на единицу больше. Для программы ниже это 9, 10 и 11.",
    },
    /* Was a bare Python comment with no program under it. A comment-only file
       is a legal translation unit, so it would have compiled and taught
       nothing; the rule is worth more attached to something runnable. */
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    cin >> x;\n    if (x >= 10) {\n        cout << "ok";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
  },
  {
    id: "m1.l7.b1a",
    type: "worked_example",
    skillRefs: ["debug.boundary", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: шекарада не болады", ru: "Разобранный пример: что происходит на границе" },
    problem: {
      kk: "Аттракционға бойы 120 см және одан жоғары балаларды жібереді. Бой беріледі. «yes» немесе «no» шығар.",
      ru: "На аттракцион пускают детей ростом 120 см и выше. Дан рост. Выведи «yes» или «no».",
    },
    steps: [
      {
        kk: "Ереже «120 және одан жоғары» дейді. Демек 120-ның өзі рұқсат етілген — бұл шешуші сөз.",
        ru: "Правило говорит «120 и выше». Значит само 120 разрешено — это ключевое слово.",
      },
      {
        kk: "`h > 120` деп жазсақ, дәл 120 см бала «no» алады. Ереже бұзылды, ал бағдарлама құламайды — сондықтан қате көзге түспейді.",
        ru: "Если написать `h > 120`, ребёнок ростом ровно 120 получит «no». Правило нарушено, а программа не падает — поэтому ошибку не видно.",
      },
      {
        kk: "Дұрысы — `h >= 120`. Айырма бір ғана таңбада, ал нәтижесі бір ғана мәнде: 120-да.",
        ru: "Правильно — `h >= 120`. Разница в одном символе, а сказывается ровно на одном значении: на 120.",
      },
      {
        kk: "Сондықтан кез келген шартты үш мәнмен тексер: шарттағы санның өзі, одан бір кем, одан бір артық. Мұнда 119, 120, 121.",
        ru: "Поэтому любое условие проверяй тремя значениями: само число из условия, на единицу меньше и на единицу больше. Здесь 119, 120, 121.",
      },
    ],
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int h;\n    cin >> h;\n    if (h >= 120) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    stdin: "120",
    result: { kk: "119 → no, 120 → yes, 121 → yes", ru: "119 → no, 120 → yes, 121 → yes" },
  },
  {
    id: "m1.l7.b2",
    type: "test_case",
    skillRefs: ["debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама «18 жастан бастап рұқсат» деген ережені орындауы керек, бірақ орындамайды. Оны әшкерелейтін енгізу мысалын жаз.",
      ru: "Программа должна выполнять правило «доступ с 18 лет», но не выполняет. Напиши ввод, который это вскроет.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int age;\n    cin >> age;\n    if (age > 18) {\n        cout << "ok";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    breakingInputs: ["18"],
  },
  {
    id: "m1.l7.b3",
    type: "modify_code",
    skillRefs: ["debug.boundary", "cond.if_elif_else"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жоғарыдағы бағдарламаны түзет: дәл 18 жаста да «ok» шығуы керек.",
      ru: "Исправь программу выше: ровно в 18 лет тоже должно выводиться «ok».",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int age;\n    cin >> age;\n    if (age > 18) {\n        cout << "ok";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int age;\n    cin >> age;\n    if (age >= 18) {\n        cout << "ok";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    /* The old three cases (18/17/19) were passed by `age != 17`, which is
       wrong for every age below 17. Far-from-boundary cases on both sides now
       make the boundary the only thing that can satisfy the set. */
    cases: [
      { input: "18", expectedOutput: "ok" },
      { input: "17", expectedOutput: "no" },
      { input: "19", expectedOutput: "ok", hidden: true },
      { input: "5", expectedOutput: "no", hidden: true },
      { input: "0", expectedOutput: "no", hidden: true },
      { input: "60", expectedOutput: "ok", hidden: true },
    ],
  },
  {
    id: "m1.l7.b4s",
    type: "reorder_code",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Жолдарды дұрыс ретке қой. Үшбұрыш құрауға болатыны — кез келген екі қабырғаның қосындысы үшіншісінен үлкен болса.",
      ru: "Расставь строки по порядку. Треугольник можно составить, если сумма любых двух сторон больше третьей.",
    },
    lines: [
      { id: "t6", code: "#include <iostream>\nusing namespace std;\n\nint main() {" },
      { id: "t1", code: "    int a, b, c;\n    cin >> a >> b >> c;" },
      { id: "t2", code: "    if (a + b > c && a + c > b && b + c > a) {" },
      { id: "t3", code: '        cout << "yes";' },
      { id: "t4", code: "    } else {" },
      { id: "t5", code: '        cout << "no";' },
      { id: "t8", code: "    }" },
      { id: "t7", code: "    return 0;\n}" },
    ],
    correctOrder: ["t6", "t1", "t2", "t3", "t4", "t5", "t8", "t7"],
  },
  {
    id: "m1.l7.b4",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Үш кесіндінің ұзындығы беріледі (1 ≤ a, b, c ≤ 1000). Олардан үшбұрыш құрауға бола ма? «yes» немесе «no».",
      ru: "Даны длины трёх отрезков (1 ≤ a, b, c ≤ 1000). Можно ли составить треугольник? «yes» или «no».",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    if (a + b > c && a + c > b && b + c > a) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    cases: [
      { input: "3 4 5", expectedOutput: "yes" },
      { input: "1 2 3", expectedOutput: "no" },
      { input: "10 1 1", expectedOutput: "no", hidden: true },
      { input: "5 5 5", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    id: "m1.l7.b5",
    type: "reflection",
    skillRefs: ["debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Осы аптада қай қате саған екі реттен көп кездесті? Оны келесі жолы қалай ертерек байқайсың?",
      ru: "Какая ошибка встретилась тебе на этой неделе больше двух раз? Как заметишь её раньше в следующий раз?",
    },
  },
];

const l8Blocks: LessonBlock[] = [
  {
    /* The support twin m1.l8 never had.
     *
     * Every other September lesson that scopes a block by track pairs it with
     * one — l2.b3s, l5.b3s, l6.b3s, l7.b4s. This lesson scoped two blocks and
     * paired neither, and the all-routes `b3` stood in for the missing path:
     * the only thing a support learner could see here, and about work they
     * could not reach. With `b3` scoped correctly, support would have had an
     * empty lesson — the one lesson in the year that projects to nothing.
     *
     * A `write_code` with the reading and the printing already there, so what
     * is left is the wrap-around itself. Support meets no `challenge` block in
     * any ordinary lesson all year (0 of 19; the rest are May's contests, where
     * every route gets the same problems), so a twin rather than widening b1.
     *
     * The shift-to-zero, wrap, shift-back idiom is m1.l8.b1's whole subject and
     * this asks for exactly it: `(d - 1 + n) % 7 + 1`. The 0-day and the
     * exact-week cases are what punish `d + n % 7`, which is the mistake this
     * scaffolding is shaped to expose rather than hide.
     *
     * The scaffold here is not the frame — that was handed back at m1.l5 — it
     * is the reading and the printing, which is what makes this the support
     * twin rather than a second copy of b1. */
    id: "m1.l8.b1s",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk:
        "Күн нөмірі беріледі (1 — дүйсенбі, 2 — сейсенбі, … 7 — жексенбі) және одан кейін " +
        "N күн өтті (0 ≤ N ≤ 1000). Қай күн болатынын шығар. Оқу мен шығару дайын тұр — саналатын жолды " +
        "ғана жаз. Кеңес: алдымен нөмірді 0-ден бастап санауға көшір, 7-ге бөлгендегі " +
        "қалдықты ал, содан кейін қайтадан 1-ден санауға қайт.",
      ru:
        "Дан номер дня (1 — понедельник, 2 — вторник, … 7 — воскресенье) и число N — " +
        "сколько дней прошло (0 ≤ N ≤ 1000). Выведи, какой это будет день. Чтение и вывод уже написаны — " +
        "напиши только строку, которая считает. Подсказка: сначала переведи номер в счёт " +
        "от нуля, возьми остаток от деления на 7, потом вернись к счёту от единицы.",
    },
    starter:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int d, n;\n    cin >> d >> n;\n    int answer = 0;\n    cout << answer;\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int d, n;\n    cin >> d >> n;\n    int answer = (d - 1 + n) % 7 + 1;\n    cout << answer;\n    return 0;\n}',
    cases: [
      { input: "1 3", expectedOutput: "4" },
      { input: "7 1", expectedOutput: "1" },
      /* Zero days: the answer is the day you started on. Kills `d + n % 7 + 1`. */
      { input: "3 0", expectedOutput: "3", hidden: true },
      /* A whole week: back where you began. Kills anything that forgets to wrap. */
      { input: "7 7", expectedOutput: "7", hidden: true },
      { input: "5 100", expectedOutput: "7", hidden: true },
      /* Sunday plus one, the wrap point that a missing `- 1` gets wrong. */
      { input: "6 2", expectedOutput: "1", hidden: true },
    ],
  },
  {
    id: "m1.l8.b1",
    type: "challenge",
    skillRefs: ["cond.if_elif_else", "arith.remainder"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Күн нөмірі беріледі (1 — дүйсенбі … 7 — жексенбі) және N күн өтті (0 ≤ N ≤ 1000). Қай күн болатынын шығар.",
      ru: "Дан номер дня (1 — понедельник … 7 — воскресенье) и прошло N дней (0 ≤ N ≤ 1000). Выведи, какой будет день.",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int d, n;\n    cin >> d >> n;\n    cout << (d - 1 + n) % 7 + 1;\n    return 0;\n}',
    cases: [
      { input: "1 3", expectedOutput: "4" },
      { input: "7 1", expectedOutput: "1" },
      /* Was "1". Day 5 plus 100 days: 100 % 7 == 2, so 5 + 2 == 7. The
         reference solution above prints 7, and 7 is the arithmetic truth —
         the stored key was simply wrong, and every correct submission failed
         on it invisibly. `curriculum:test-content` now executes every
         reference solution against every case, so this class of defect cannot
         reach a learner again. */
      { input: "5 100", expectedOutput: "7", hidden: true },
      { input: "3 0", expectedOutput: "3", hidden: true },
      { input: "7 7", expectedOutput: "7", hidden: true },
    ],
  },
  {
    id: "m1.l8.b2",
    type: "challenge",
    skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["advanced"],
    /* The Kazakh said the dimensions of a ROOM and a door were given; the graded
       solution reads the WARDROBE and the doorway. A Kazakh-track learner was
       solving a different problem from the one being marked. Both versions now
       state the same four inputs in the same order — which neither did. */
    prompt: {
      kk: "Бір жолда төрт сан беріледі: шкафтың өлшемдері a мен b, содан кейін есік ойығының өлшемдері x пен y (барлығы 1-ден 1000-ға дейін). Шкаф есіктен өте ме? Шкафты бұруға болады. «yes» немесе «no» шығар.",
      ru: "В одной строке даны четыре числа: размеры шкафа a и b, затем размеры дверного проёма x и y (все от 1 до 1000). Пройдёт ли шкаф в проём? Шкаф можно поворачивать. Выведи «yes» или «no».",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, x, y;\n    cin >> a >> b >> x >> y;\n    if ((a <= x && b <= y) || (a <= y && b <= x)) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
    cases: [
      { input: "2 5 3 6", expectedOutput: "yes" },
      { input: "5 2 3 6", expectedOutput: "yes" },
      { input: "7 7 6 8", expectedOutput: "no", hidden: true },
      { input: "3 3 3 3", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    id: "m1.l8.b3",
    /* Advanced only, because the problem it asks about is.
       «Соңғы есепте неге екі нұсқаны да тексеру керек болды?» — the last
       problem, and the two orientations, are m1.l8.b2, the wardrobe, which
       is `tracks: ["advanced"]`. Carrying no `tracks` itself, this block
       rendered on all three routes: a core learner was asked why BOTH
       orientations had to be checked in a day-of-week problem that has
       none, and a support learner opened this lesson to find it contained
       nothing else at all. */
    tracks: ["advanced"],
    type: "explain",
    skillRefs: ["cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Соңғы есепте неге екі нұсқаны да тексеру керек болды? Тек біреуін тексерсек не бұзылады?",
      ru: "Почему в последней задаче нужно было проверять оба варианта? Что сломается, если проверить только один?",
    },
    expectedPoints: [
      {
        kk: "Шкафты 90 градусқа бұруға болады, сондықтан a мен b рөлдерін ауыстырады.",
        ru: "Шкаф можно повернуть на 90 градусов, поэтому a и b меняются ролями.",
      },
      {
        kk: "Бір ғана нұсқаны тексерсек, бұрғанда сыятын шкафты «сыймайды» деп қате айтамыз.",
        ru: "Проверив один вариант, мы ошибочно скажем «не пройдёт» про шкаф, который проходит после поворота.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Blocks authored to close gaps the forensic audit found                      */
/*                                                                            */
/* Lesson ids below continue the authoring sequence (l10, l11, l12); their     */
/* teaching position is set by where they sit in the `units` array at the      */
/* bottom of this file, not by their number.                                   */
/* -------------------------------------------------------------------------- */

/**
 * Unit 2, taught BEFORE `%`.
 *
 * The PDF's first mastery line for September is «бүтін және бөлшек сандардың
 * айырмасын түсіну», and the monthly check requires the learner to explain why
 * they chose an integer or a fractional type.
 *
 * In Python that distinction was a choice between two OPERATORS — `/` and `//`
 * — and the month simply never used the first one. In C++ it is a choice
 * between two TYPES wearing one operator, which is worse: `7 / 2` is `3` and
 * says nothing about having discarded anything. CPP17_PEDAGOGY.md calls this
 * the single most likely way a task's expected output silently becomes wrong,
 * so it is taught here, before any task divides anything.
 */
const l10Blocks: LessonBlock[] = [
  {
    id: "m1.l10.b1",
    type: "concept",
    skillRefs: ["types.int_float", "arith.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Екі түрлі бөлу", ru: "Два разных деления" },
    body: {
      kk: "C++-та бөлудің таңбасы біреу — `/` — бірақ амал екеу. Екі жағы да бүтін сан болса, нәтиже де бүтін болады да, бөлшек бөлігі лақтырылады: `7 / 2` — 3, 3.5 емес. Бөлшек жауап керек болса, бір жағын бөлшек ет: `7 / 2.0` — 3.5. Бөлшек сандардың түрі — `double`, ал үтірдің орнына нүкте қойылады: `2.0`, `0.5`. `cout` бөлшек санды артық нөлдерсіз шығарады, сондықтан `10 / 5.0` экранда жай ғана 2 болып көрінеді. Тағы бір шек: `int` шамамен ±2 миллиардқа дейінгі сандарды ғана ұстайды, одан үлкені үшін `long long` бар.",
      ru: "В C++ знак деления один — `/` — но операций две. Если обе стороны целые, результат тоже целый, а дробная часть отбрасывается: `7 / 2` — это 3, а не 3.5. Нужен дробный ответ — сделай дробной одну из сторон: `7 / 2.0` даёт 3.5. Тип дробных чисел называется `double`, и вместо запятой в нём ставится точка: `2.0`, `0.5`. Печатая дробное число, `cout` не показывает лишние нули, поэтому `10 / 5.0` выглядит на экране просто как 2. И ещё одна граница: `int` хранит числа примерно до ±2 миллиардов, а для больших есть `long long`.",
    },
    /* Every line here is measured output, not a remembered one: `0.5 * 8`
       prints `4` and not `4.0`, which is the first thing a learner coming from
       a calculator does not expect. The `long long` line is shown rather than
       required — September has no task that needs it, and the audit rule in
       CPP17_PEDAGOGY.md is that no task's bounds may exceed `int` before it is
       taught. Every statement in this month is bounded so that none does. */
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 7 / 2 << endl;      // 3\n    cout << 7 / 2.0 << endl;    // 3.5\n    cout << 10 / 5 << endl;     // 2\n    cout << 0.5 * 8 << endl;    // 4\n    long long big = 3000000000;\n    cout << big * 2 << endl;    // 6000000000\n    return 0;\n}',
  },
  {
    id: "m1.l10.b2",
    type: "prediction",
    skillRefs: ["types.int_float"],
    sourceType: "product-authored",
    /* The Python original asked what `10 / 5` prints and the answer was `2.0` —
       "true division always returns a float". C++ makes the opposite mistake
       the dangerous one, and it is the mistake that silently changes an answer
       rather than its formatting, so the block now asks the question in that
       direction. */
    prompt: {
      kk: "Экранға не шығады?",
      ru: "Что появится на экране?",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << 9 / 4;\n    return 0;\n}',
    answer: "2",
    options: ["2", "2.25", "3", "2.5"],
    diagnosticMapping: {
      "2.25": {
        failureClass: "int_division_expected_a_fraction",
        justification:
          "2.25 — қағаздағы бөлудің жауабы. Екі сан да бүтін болғандықтан, C++ бөлшек бөлігін лақтырып тастайды. Бөлшек жауап алу үшін бір жағын `4.0` деп жазу керек еді.",
      },
      "3": {
        failureClass: "int_division_assumed_to_round",
        justification:
          "3 деген жауап нәтиже дөңгелектенеді деп ойлағанда шығады. C++ дөңгелектемейді, ол бөлшек бөлігін жай ғана алып тастайды, сондықтан 2.25-тен 2 қалады.",
      },
    },
  },
  {
    id: "m1.l10.b3",
    type: "worked_example",
    skillRefs: ["types.int_float", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Толық талданған мысал: қай бөлуді таңдау керек", ru: "Разобранный пример: какое деление выбрать" },
    problem: {
      kk: "48 оқушыны 5 автобусқа отырғызамыз. Әр автобусқа кемінде нешеу отырады? Мысал: 48 және 5 берілсе, жауап 9.",
      ru: "48 учеников рассаживаем в 5 автобусов. Сколько человек точно поместится в каждый? Пример: даны 48 и 5, ответ 9.",
    },
    steps: [
      {
        kk: "Не сұралып тұр: әр автобусқа кепілді түрде нешеу тиеді. Демек жауап — адам саны, ал адам саны бүтін.",
        ru: "Что спрашивают: сколько человек гарантированно достанется каждому автобусу. Значит ответ — количество людей, а оно целое.",
      },
      {
        kk: "`48 / 5.0` жазсақ, 9.6 шығады. 9.6 адам деген мағынасыз, ендеше бөлшек бөлу бұл жерде дұрыс емес.",
        ru: "Если написать `48 / 5.0`, получится 9.6. «9.6 человека» — бессмыслица, значит дробное деление здесь не подходит.",
      },
      {
        kk: "`n` мен `k` екеуі де `int` болғандықтан, `n / k` бүтін бөлінді береді: 9. Дәл осы — әрқайсысына кепілді тиетін сан.",
        ru: "Раз `n` и `k` объявлены как `int`, выражение `n / k` даёт целое частное: 9. Это и есть число, которое гарантированно достанется каждому.",
      },
      {
        kk: "Қалғанын да білгіміз келсе, `48 % 5` = 3 — орын таппаған үш оқушы.",
        ru: "Если нужен и остаток, `48 % 5` = 3 — три ученика, которым места не хватило.",
      },
    ],
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, k;\n    cin >> n >> k;\n    cout << n / k;\n    return 0;\n}',
    stdin: "48 5",
    result: { kk: "48 5 енгізгенде: 9", ru: "При вводе 48 5: 9" },
  },
  {
    id: "m1.l10.b4",
    type: "multiple_choice",
    skillRefs: ["types.int_float", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "Қай есепте жауап бөлшек болуы мүмкін, сондықтан `double` керек?",
      ru: "В какой задаче ответ может быть дробным, и поэтому нужен `double`?",
    },
    options: [
      { id: "o1", label: { kk: "Үш бағаның орташа мәнін табу", ru: "Найти среднее из трёх оценок" } },
      { id: "o2", label: { kk: "n кәмпитті k балаға тең бөлу", ru: "Разделить n конфет между k детьми поровну" } },
      { id: "o3", label: { kk: "Санның соңғы цифрын табу", ru: "Найти последнюю цифру числа" } },
      { id: "o4", label: { kk: "n жәшікті тасуға неше рейс керегін табу", ru: "Сколько рейсов нужно для n ящиков" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "fractional_where_integer_required",
        justification:
          "Кәмпит бүтін затпен саналады, сондықтан жауап бөлшек бола алмайды. Мұнда бүтін бөлу мен `%` керек, `double` емес.",
      },
    },
  },
  {
    id: "m1.l10.b5",
    type: "write_code",
    skillRefs: ["types.int_float", "arith.basic", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Үш баға беріледі (0 ≤ әрқайсысы ≤ 100). Олардың орташа мәнін шығар. Жауап бөлшек болуы мүмкін, сондықтан бөлудің бір жағын `3.0` деп жаз.",
      ru: "Даны три оценки (каждая от 0 до 100). Выведи их среднее. Ответ может быть дробным, поэтому пиши деление на `3.0`.",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    cout << (a + b + c) / 3.0;\n    return 0;\n}',
    /*
     * The one block in the month that declares a checker, and the reason is the
     * language change.
     *
     * Python printed `4.333333333333333` — seventeen digits — and the answer key
     * could be that string. `cout` prints six significant digits by default, so
     * the same program produces `4.33333`, and a learner who writes
     * `setprecision` or divides in a different order can legitimately produce
     * `4.3333333`. Under the default token comparison all of those are wrong
     * answers about arithmetic, which they are not.
     *
     * The tolerance is a thousandth because this is an average of whole marks
     * out of 100: no decision anyone makes on the answer changes at the third
     * decimal, and it still fails the learner who prints `4` for 13 / 3.
     */
    checker: { kind: "numeric", absoluteTolerance: 0.001 },
    cases: [
      { input: "4 5 3", expectedOutput: "4" },
      { input: "5 5 5", expectedOutput: "5" },
      { input: "4 4 5", expectedOutput: "4.33333", hidden: true },
      { input: "0 0 1", expectedOutput: "0.333333", hidden: true },
    ],
  },
];

/**
 * Unit 1, taught after the first program.
 *
 * PDF p.7: «Сан мен мәтінді оқу». September read text exactly once — in
 * m1.l1.b4, where the string was the BUG the learner was asked to remove. A
 * month that only ever shows text as a mistake teaches that text input is a
 * mistake.
 *
 * This is also the lesson where a variable is DECLARED for the first time, and
 * that is not a footnote in C++: `cin` cannot read anything until something has
 * been declared to read it into, so the type comes first and the reading second.
 * Text is the honest place to start, because `string` needs no arithmetic to
 * explain it.
 */
const l11Blocks: LessonBlock[] = [
  {
    id: "m1.l11.b1",
    type: "concept",
    skillRefs: ["io.read", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Мәтінді мәтін күйінде қалдыру", ru: "Оставляем текст текстом" },
    body: {
      kk: "C++-та әр айнымалының түрі алдын ала айтылады. Мәтін үшін `string` бар: `string name;` дегеннен кейін `cin >> name;` пернетақтадан бір сөзді оқиды. Сол сөзді ешнәрсеге айналдырудың қажеті жоқ — `cout` оны сол күйінде шығара береді. Сандарды оқу үшін `int` алынады; түрі есептің өзінен шығады, сондықтан есімді `int`-ке оқуға болмайды. `string` қолданғанда жоғарыға `#include <string>` жолын қосамыз.",
      ru: "В C++ тип каждой переменной объявляется заранее. Для текста есть `string`: после `string name;` строка `cin >> name;` читает с клавиатуры одно слово. Превращать это слово ни во что не нужно — `cout` выведет его как есть. Для чисел берут `int`; тип диктует сама задача, поэтому имя в `int` читать нельзя. Когда используется `string`, сверху добавляется строка `#include <string>`.",
    },
    code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cin >> name;\n    cout << "Hello, " << name;\n    return 0;\n}',
  },
  {
    id: "m1.l11.b2",
    type: "write_code",
    skillRefs: ["io.read", "io.print"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір жолда есім беріледі (бос орынсыз бір сөз). `Hello, <есім>!` түрінде сәлемдесу шығар. Мысалы `Aidana` үшін жауап: `Hello, Aidana!`",
      ru: "В одной строке дано имя (одно слово без пробелов). Выведи приветствие вида `Hello, <имя>!` Например, для `Aidana` ответ: `Hello, Aidana!`",
    },
    starter:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    // Мұнда жаз / Напиши здесь\n    return 0;\n}',
    referenceSolution:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cin >> name;\n    cout << "Hello, " << name << "!";\n    return 0;\n}',
    cases: [
      { input: "Aidana", expectedOutput: "Hello, Aidana!" },
      { input: "Bek", expectedOutput: "Hello, Bek!" },
      { input: "Zhanel", expectedOutput: "Hello, Zhanel!", hidden: true },
      { input: "A", expectedOutput: "Hello, A!", hidden: true },
    ],
  },
  {
    id: "m1.l11.b3",
    type: "find_bug",
    skillRefs: ["io.read", "types.int_float"],
    sourceType: "product-authored",
    /*
     * RE-AUTHORED. The Python version's bug was `int(input())` on a name, and
     * the prompt said the program CRASHES — which it does, loudly, with a
     * ValueError naming the line.
     *
     * C++ does not crash. `cin >> n` on text that is not a number fails
     * silently: the variable is left at 0, no exception is raised, and the
     * program prints a confident `Hello, 0`. That is a worse bug and a more
     * useful one, because the only evidence the learner gets is a wrong answer,
     * and the wrong answer is in a line that is not the broken one.
     */
    prompt: {
      kk: "Бұл бағдарлама есімді оқып, оны шығаруы керек. Ол құламайды, бірақ кез келген есім енгізгенде `Hello, 0` деп жазады. Қате қай жолда?",
      ru: "Программа должна прочитать имя и вывести его. Она не падает, но на любом имени печатает `Hello, 0`. В какой строке ошибка?",
    },
    code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    int name;\n    cin >> name;\n    cout << "Hello, " << name;\n    return 0;\n}',
    buggyLine: 6,
    symptomInput: "Aidana",
    fixedCode:
      '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string name;\n    cin >> name;\n    cout << "Hello, " << name;\n    return 0;\n}',
    diagnosticMapping: {
      "7": {
        failureClass: "blamed_the_read_not_the_declared_type",
        justification:
          "7-жол дұрыс жазылған: `cin >> name;` айнымалыға нені оқу керегін оның ТҮРІНЕН біледі. Қате 6-жолда — есім `int` деп жарияланған, сондықтан оқу сәтсіз бітіп, айнымалыда 0 қалады.",
      },
    },
  },
];

/**
 * Unit 3, taught after `else if`.
 *
 * PDF p.7 names two discount tasks — «жеңілдікпен сатып алу құны» and
 * «жеңілдік деңгейін таңдау» — and September had neither: the words
 * «жеңілдік», «скидк» and «процент» appeared zero times in the month. They are
 * also the only place in the PDF's own practice list where percentage
 * arithmetic arises, which is where the integer-versus-fractional choice
 * becomes a decision rather than a definition.
 */
const l12Blocks: LessonBlock[] = [
  {
    id: "m1.l12.b1",
    type: "concept",
    skillRefs: ["arith.basic", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: { kk: "Пайыз және жеңілдік", ru: "Проценты и скидка" },
    /* The Python version of this block warned that `/` would produce `1200.0`
       instead of `1200`. In C++ that warning is empty — with two `int` operands
       the answer is already 1200 — so the block warns about the thing C++ makes
       easy to get wrong instead: the ORDER of the multiplication and the
       division, which changes the answer whenever the price is not a round
       hundred. */
    body: {
      kk: "Бағаның p пайызы — `баға * p / 100`. Жеңілдіктен кейінгі құн — бағадан сол бөлікті алып тастау. Теңге бүтін болғандықтан бұл жерде бүтін бөлу дәл келеді: `int` сандар бөлінгенде бөлшек бөлігі өзінен-өзі лақтырылады. Тәртібіне мұқият бол: алдымен көбейт, содан кейін бөл. `990 * 10 / 100` — 99, ал `990 / 100 * 10` — 90, себебі бірінші бөлу 9,9-ды 9-ға дейін қысқартып жібереді.",
      ru: "p процентов от цены — это `цена * p / 100`. Стоимость со скидкой — цена минус эта часть. Тенге целые, поэтому целочисленное деление здесь как раз кстати: у `int` дробная часть отбрасывается сама. Следи за порядком: сначала умножай, потом дели. `990 * 10 / 100` — это 99, а `990 / 100 * 10` — уже 90, потому что первое деление обрезает 9,9 до 9.",
    },
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int price = 1500;\n    int p = 20;\n    cout << price - price * p / 100;   // 1200\n    return 0;\n}',
  },
  {
    id: "m1.l12.b2",
    type: "write_code",
    skillRefs: ["arith.basic", "arith.integer_division", "io.read"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Тауар бағасы a теңге (0 ≤ a ≤ 1000000) және жеңілдік p пайыз (0 ≤ p ≤ 100) беріледі. Сатып алушы қанша төлейді? Жауап бүтін теңге.",
      ru: "Даны цена товара a тенге (0 ≤ a ≤ 1000000) и скидка p процентов (0 ≤ p ≤ 100). Сколько заплатит покупатель? Ответ — целое число тенге.",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, p;\n    cin >> a >> p;\n    cout << a - a * p / 100;\n    return 0;\n}',
    cases: [
      { input: "1500 20", expectedOutput: "1200" },
      { input: "1000 0", expectedOutput: "1000" },
      { input: "1000 100", expectedOutput: "0", hidden: true },
      { input: "999 10", expectedOutput: "900", hidden: true },
      { input: "250 50", expectedOutput: "125", hidden: true },
    ],
  },
  {
    id: "m1.l12.b3",
    type: "write_code",
    skillRefs: ["cond.if_elif_else", "arith.basic", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Дүкенде жеңілдік сома бойынша беріледі: 10000 теңге және одан жоғары — 10 пайыз, 5000-нан 9999-ға дейін — 5 пайыз, одан төмен — жеңілдік жоқ. Сатып алу сомасы беріледі (0 ≤ s ≤ 1000000). Төленетін соманы шығар.",
      ru: "В магазине скидка зависит от суммы: 10000 тенге и выше — 10 процентов, от 5000 до 9999 — 5 процентов, ниже — без скидки. Дана сумма покупки (0 ≤ s ≤ 1000000). Выведи сумму к оплате.",
    },
    referenceSolution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int s;\n    cin >> s;\n    if (s >= 10000) {\n        cout << s - s * 10 / 100;\n    } else if (s >= 5000) {\n        cout << s - s * 5 / 100;\n    } else {\n        cout << s;\n    }\n    return 0;\n}',
    cases: [
      { input: "12000", expectedOutput: "10800" },
      { input: "7000", expectedOutput: "6650" },
      { input: "10000", expectedOutput: "9000", hidden: true },
      { input: "9999", expectedOutput: "9500", hidden: true },
      { input: "5000", expectedOutput: "4750", hidden: true },
      { input: "4999", expectedOutput: "4999", hidden: true },
      { input: "0", expectedOutput: "0", hidden: true },
    ],
  },
];

/* -------------------------------------------------------------------------- */

function lesson(
  id: string,
  kk: string,
  ru: string,
  minutes: number,
  objectives: { kk: string; ru: string }[],
  skillRefs: string[],
  blocks: LessonBlock[],
): Lesson {
  return {
    id,
    title: { kk, ru },
    estimatedMinutes: minutes,
    objectives,
    skillRefs,
    blocks,
    sourceType: "curriculum-derived",
    pdfPage: P,
    status: "implemented",
  };
}


/* -------------------------------------------------------------------------- */
/* Unit 5 — Дербес жаттығу                                                     */
/*                                                                            */
/* The programme promises ~100 fully independent solutions across the year     */
/* (PDF p.11). These are the September share: no worked example precedes them, */
/* no scaffold is offered, and the learner writes the whole program — frame    */
/* included, which is the acceptance bar CPP17_PEDAGOGY.md sets for the month. */
/* -------------------------------------------------------------------------- */

interface PracticeSpec {
  id: string;
  kk: string;
  ru: string;
  skills: string[];
  solution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
  tracks?: ("support" | "core" | "advanced")[];
}

const practiceSpecs: PracticeSpec[] = [
  {
    id: "m1.p1",
    kk: "Үш санның ең үлкенін шығар (-1000000 ≤ әрқайсысы ≤ 1000000).",
    ru: "Выведи наибольшее из трёх чисел (каждое от -1000000 до 1000000).",
    skills: ["cond.if_elif_else", "compare.operators"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    int m = a;\n    if (b > m) {\n        m = b;\n    }\n    if (c > m) {\n        m = c;\n    }\n    cout << m;\n    return 0;\n}',
    cases: [
      { input: "3 9 5", expectedOutput: "9" },
      { input: "7 2 1", expectedOutput: "7", hidden: true },
      { input: "4 4 4", expectedOutput: "4", hidden: true },
      { input: "-9 -3 -7", expectedOutput: "-3", hidden: true },
    ],
  },
  {
    /* The statement names its own range, and in C++ it has to for a second
       reason as well as the first.
       The first: the hidden case used to be -47 → "7", which the only solution
       September teaches (`n % 10`) cannot produce — the sign of the remainder
       follows the dividend in C++ (-47 % 10 is -7) and the divisor in Python
       (3). Either way the answer is not 7, so a learner who had understood `%`
       perfectly was failed against `arith.remainder`, the very skill they had
       just demonstrated.
       The second: `int` stops at 2147483647, and `long long` is not taught this
       month, so an upper bound is part of the statement rather than a hope. */
    id: "m1.p2",
    kk: "Теріс емес бүтін сан беріледі (0 ≤ n ≤ 1000000000). Оның соңғы цифрын шығар.",
    ru: "Дано неотрицательное целое число (0 ≤ n ≤ 1000000000). Выведи его последнюю цифру.",
    skills: ["arith.remainder"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    cout << n % 10;\n    return 0;\n}',
    cases: [
      { input: "1234", expectedOutput: "4" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "7", expectedOutput: "7", hidden: true },
      { input: "10", expectedOutput: "0", hidden: true },
      { input: "47", expectedOutput: "7", hidden: true },
      { input: "100", expectedOutput: "0", hidden: true },
    ],
  },
  {
    id: "m1.p3",
    kk: "Екі таңбалы санның (10 ≤ n ≤ 99) цифрларының қосындысын шығар.",
    ru: "Выведи сумму цифр двузначного числа (10 ≤ n ≤ 99).",
    skills: ["arith.integer_division", "arith.remainder"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    cout << n / 10 + n % 10;\n    return 0;\n}',
    cases: [
      { input: "47", expectedOutput: "11" },
      { input: "10", expectedOutput: "1", hidden: true },
      { input: "99", expectedOutput: "18", hidden: true },
    ],
  },
  {
    id: "m1.p4",
    kk: "Дүкенде бір дәптер a теңге (1 ≤ a ≤ 100000). b теңгеге (0 ≤ b ≤ 1000000) қанша дәптер алуға болады және қанша теңге қалады?",
    ru: "Тетрадь стоит a тенге (1 ≤ a ≤ 100000). Сколько тетрадей можно купить на b тенге (0 ≤ b ≤ 1000000) и сколько останется?",
    skills: ["arith.integer_division", "arith.remainder"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << b / a << " " << b % a;\n    return 0;\n}',
    cases: [
      { input: "150 1000", expectedOutput: "6 100" },
      { input: "200 200", expectedOutput: "1 0", hidden: true },
      { input: "300 100", expectedOutput: "0 100", hidden: true },
    ],
  },
  {
    id: "m1.p5",
    kk: "Нүктенің координаталары беріледі (-1000 ≤ x, y ≤ 1000). Ол қай ширекте жатыр? Өстің бойында жатса 0 шығар.",
    ru: "Даны координаты точки (-1000 ≤ x, y ≤ 1000). В какой она четверти? Если на оси — выведи 0.",
    skills: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int x, y;\n    cin >> x >> y;\n    if (x == 0 || y == 0) {\n        cout << 0;\n    } else if (x > 0 && y > 0) {\n        cout << 1;\n    } else if (x < 0 && y > 0) {\n        cout << 2;\n    } else if (x < 0 && y < 0) {\n        cout << 3;\n    } else {\n        cout << 4;\n    }\n    return 0;\n}',
    cases: [
      { input: "2 3", expectedOutput: "1" },
      { input: "-2 3", expectedOutput: "2", hidden: true },
      { input: "-2 -3", expectedOutput: "3", hidden: true },
      { input: "2 -3", expectedOutput: "4", hidden: true },
      { input: "0 5", expectedOutput: "0", hidden: true },
    ],
  },
  {
    id: "m1.p6",
    kk: "Жүк көлігіне бір жолы k жәшік сыяды (1 ≤ k ≤ 1000). n жәшікті (0 ≤ n ≤ 1000000) тасу үшін неше рейс керек?",
    ru: "В грузовик помещается k ящиков за раз (1 ≤ k ≤ 1000). Сколько рейсов нужно для n ящиков (0 ≤ n ≤ 1000000)?",
    skills: ["arith.integer_division", "arith.remainder", "cond.if_elif_else"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, k;\n    cin >> n >> k;\n    cout << (n + k - 1) / k;\n    return 0;\n}',
    cases: [
      { input: "10 3", expectedOutput: "4" },
      { input: "9 3", expectedOutput: "3", hidden: true },
      { input: "1 5", expectedOutput: "1", hidden: true },
      { input: "0 5", expectedOutput: "0", hidden: true },
    ],
    tracks: ["core", "advanced"],
  },
  {
    id: "m1.p7",
    kk: "Үш санның екеуі тең, біреуі бөлек. Бөлек санды шығар.",
    ru: "Из трёх чисел два равны, одно отличается. Выведи отличающееся.",
    skills: ["cond.if_elif_else", "compare.operators"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b, c;\n    cin >> a >> b >> c;\n    if (a == b) {\n        cout << c;\n    } else if (a == c) {\n        cout << b;\n    } else {\n        cout << a;\n    }\n    return 0;\n}',
    cases: [
      { input: "5 5 7", expectedOutput: "7" },
      { input: "5 7 5", expectedOutput: "7", hidden: true },
      { input: "7 5 5", expectedOutput: "7", hidden: true },
    ],
    tracks: ["core", "advanced"],
  },
  {
    /* PDF p.7 names «секундты САҒАТ пен минутқа айналдыру». m1.l3.b4 converts
       seconds to minutes and seconds — one application of `/` and `%`. The
       named task needs two, applied in sequence, which is a real step up and
       the reason the PDF asks for hours rather than minutes. */
    id: "m1.p9",
    kk: "Секундпен берілген уақыт беріледі (0 ≤ t ≤ 86399). Оны сағат, минут және секунд түрінде бос орынмен бөліп шығар. Мысалы 3725 → «1 2 5».",
    ru: "Дано время в секундах (0 ≤ t ≤ 86399). Выведи его как часы, минуты и секунды через пробел. Например 3725 → «1 2 5».",
    skills: ["arith.integer_division", "arith.remainder"],
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int t;\n    cin >> t;\n    cout << t / 3600 << " " << t % 3600 / 60 << " " << t % 60;\n    return 0;\n}',
    cases: [
      { input: "3725", expectedOutput: "1 2 5" },
      { input: "0", expectedOutput: "0 0 0", hidden: true },
      { input: "59", expectedOutput: "0 0 59", hidden: true },
      { input: "3600", expectedOutput: "1 0 0", hidden: true },
      { input: "86399", expectedOutput: "23 59 59", hidden: true },
    ],
  },
  {
    id: "m1.p8",
    /* The Kazakh asked for the angle «тіл мен сан аралығында» — between a hand
       and a *number* — which is not a quantity this task computes. The Russian
       asked the real question. They now ask the same one. */
    kk: "Сағат 12 сағаттық форматта. h сағат (0 ≤ h ≤ 23) және m минут (0 ≤ m ≤ 59) берілген. Сағат тілі мен минут тілінің арасындағы бұрыш неше градус? Жауаптың бүтін бөлігін шығар.",
    ru: "Часы 12-часовые. Даны h часов (0 ≤ h ≤ 23) и m минут (0 ≤ m ≤ 59). Каков угол между часовой и минутной стрелками в градусах? Выведи целую часть ответа.",
    skills: ["arith.basic", "arith.remainder", "cond.if_elif_else"],
    /*
     * RE-DERIVED for C++, twice over.
     *
     * The difference is still taken with `if`/`else` rather than `abs()`, for
     * the reason the Python version recorded: `abs` is first shown in MONTH
     * FOUR and September has no skill for it, so a reference solution using it
     * would be written in a language the learner had not been given.
     *
     * What is new is that the arithmetic is now entirely integer. The Python
     * solution computed the hour hand as `(h % 12) * 30 + m * 0.5` — a float —
     * and then took `int(d)`. In C++ that needs both `double` and an explicit
     * cast back, and a cast is not a September construct.
     *
     * Measuring in HALF-degrees removes both: the hour hand sits at
     * `(h % 12) * 60 + m` half-degrees and the minute hand at `m * 12`, the
     * whole circle is 720, and the answer in whole degrees is the half-degree
     * difference divided by two — which truncates, which is exactly the
     * «бүтін бөлігі» the statement asks for. Verified against the float version
     * on all 720 clock positions.
     */
    solution:
      '#include <iostream>\nusing namespace std;\n\nint main() {\n    int h, m;\n    cin >> h >> m;\n    int hh = (h % 12) * 60 + m;\n    int mm = m * 12;\n    int d;\n    if (hh > mm) {\n        d = hh - mm;\n    } else {\n        d = mm - hh;\n    }\n    if (d > 360) {\n        d = 720 - d;\n    }\n    cout << d / 2;\n    return 0;\n}',
    cases: [
      { input: "3 0", expectedOutput: "90" },
      { input: "12 0", expectedOutput: "0", hidden: true },
      { input: "6 0", expectedOutput: "180", hidden: true },
      { input: "9 30", expectedOutput: "105", hidden: true },
    ],
    tracks: ["advanced"],
  },
];

const practiceBlocks: LessonBlock[] = practiceSpecs.map((spec) => ({
  id: spec.id,
  type: "write_code",
  skillRefs: spec.skills,
  sourceType: "product-authored",
  tracks: spec.tracks,
  prompt: { kk: spec.kk, ru: spec.ru },
  referenceSolution: spec.solution,
  cases: spec.cases,
}));
export const MONTH_01_SEPTEMBER: Month = {
  index: 1,
  monthName: { kk: "Қыркүйек", ru: "Сентябрь" },
  title: {
    kk: "Деректерді оқу, есептеу және шарттар",
    ru: "Чтение данных, вычисления и условия",
  },
  mastery: {
    kk: "Деректерді оқу және жауапты шығару, бүтін және бөлшек сандар, арифметикалық амалдар, бүтін бөлу мен қалдық, салыстыру, if / else if / else шарттары, логикалық амалдар.",
    ru: "Чтение данных и вывод ответа, целые и дробные числа, арифметические операции, целочисленное деление и остаток, сравнение, условия if / else if / else, логические операции.",
  },
  explanation: {
    kk: "Әр тақырып бойынша 5-8 минуттық қысқа түсіндіру: бір ғана идея, содан кейін бірден жаттығу. Мұғалім сабақта дайын мысалды ойлау барысын дауыстап айта отырып талдайды.",
    ru: "По каждой теме короткое объяснение на 5–8 минут: одна идея, затем сразу практика. На занятии учитель разбирает готовый пример, проговаривая ход мысли вслух.",
  },
  endOfMonthCapability: {
    kk: "Оқушы деректерді оқып, есептеп, шарт арқылы жауап таңдайтын қарапайым бағдарламаларды өз бетінше жаза алады және шарт шекарасындағы қателерді таба алады.",
    ru: "Ученик самостоятельно пишет простые программы, которые читают данные, вычисляют и выбирают ответ по условию, и находит ошибки на границе условия.",
  },
  expectedTaskCount: 36,
  practiceOutline: {
    kk: "Қарапайым есептеулер, шарт бойынша жауап таңдау, шекараларды тексеру, дайын кодтағы қатені табу және түзету, өз тексеру мысалдарын құрастыру.",
    ru: "Простые вычисления, выбор ответа по условию, проверка границ, поиск и исправление ошибки в готовом коде, составление собственных тестов.",
  },
  theoryHours: 2.5,
  practiceHours: 6,
  sourceType: "curriculum-derived",
  pdfPage: P,
  illustrationId: "month-01",
  units: [
    {
      id: "m1.u1",
      title: { kk: "Кіріс және шығыс", ru: "Ввод и вывод" },
      sourceType: "curriculum-derived",
      lessons: [
        /* Objectives narrowed with the C++ re-authoring: this lesson no longer
           reads input. `cin` needs a declared variable of a chosen type, which
           is l3's work, so "преобразование ввода в число" moved there with it.
           What replaced it is the frame and the semicolon — ceremony Python
           does not have and a C++ beginner cannot avoid. */
        lesson(
          "m1.l1",
          "Бірінші бағдарлама",
          "Первая программа",
          12,
          [
            { kk: "Экранға мәтін мен санды шығару", ru: "Вывод текста и числа на экран" },
            { kk: "Бағдарлама жақтауын тану және нүктелі үтірді қоя білу", ru: "Узнавать рамку программы и ставить точку с запятой" },
          ],
          ["io.print", "arith.basic"],
          l1Blocks,
        ),
        /* PDF p.7 opens with «Сан мен мәтінді оқу». Text used to appear in
           the month exactly once, as the thing a find_bug asked the learner to
           remove — so it taught that text input is a mistake. In C++ this is
           also the first lesson where anything is DECLARED: `cin` cannot read
           until a type has been chosen, and `string` is the type that needs no
           arithmetic to explain. */
        lesson(
          "m1.l11",
          "Мәтінмен жұмыс",
          "Работа с текстом",
          6,
          [
            { kk: "Мәтінді айналдырмай оқу және шығару", ru: "Читать и выводить текст без преобразования" },
            { kk: "Айнымалыға int пен string түрінің қайсысы керегін ажырату", ru: "Различать, когда переменной нужен тип int, а когда string" },
          ],
          ["io.read", "io.print"],
          l11Blocks,
        ),
        lesson(
          "m1.l2",
          "Бір жолдағы бірнеше сан",
          "Несколько чисел в строке",
          10,
          [
            { kk: "Бос орынмен бөлінген сандарды оқу", ru: "Чтение чисел через пробел" },
            { kk: "Бірнеше мәнді бір жолға шығару", ru: "Вывод нескольких значений в строку" },
          ],
          ["io.read", "io.print", "arith.basic"],
          l2Blocks,
        ),
      ],
    },
    {
      id: "m1.u2",
      title: { kk: "Арифметика", ru: "Арифметика" },
      sourceType: "curriculum-derived",
      lessons: [
        /* Taught first, because «бүтін және бөлшек сандардың айырмасын түсіну»
           is the PDF's first mastery line for September and the month contained
           no fractional number at all. The monthly check then asked the learner
           to justify a type choice they had never been offered. In C++ the
           stakes are higher than in Python: `7 / 2` is `3` and announces
           nothing, so this lesson comes before any task divides anything. */
        lesson(
          "m1.l10",
          "Екі түрлі бөлу",
          "Два разных деления",
          8,
          [
            { kk: "Бүтін бөлу мен бөлшек бөлудің айырмасын түсіну", ru: "Понимать разницу между целочисленным и дробным делением" },
            { kk: "Есепке қарап бүтін не бөлшек нәтиже керегін таңдау", ru: "Выбирать целый или дробный результат по смыслу задачи" },
          ],
          ["types.int_float", "arith.basic", "arith.integer_division"],
          l10Blocks,
        ),
        lesson(
          "m1.l3",
          "Бүтін бөлу және қалдық",
          "Целочисленное деление и остаток",
          8,
          [
            { kk: "/ және % амалдарын ажырату", ru: "Различать операции / и %" },
            { kk: "«Толық нешеу сыйды және нешеуі қалды» есептерін шығару", ru: "Решать задачи «сколько поместилось целиком и сколько осталось»" },
          ],
          ["arith.integer_division", "arith.remainder", "arith.basic"],
          l3Blocks,
        ),
      ],
    },
    {
      id: "m1.u3",
      title: { kk: "Шарттар", ru: "Условия" },
      sourceType: "curriculum-derived",
      lessons: [
        lesson(
          "m1.l4",
          "if және else",
          "if и else",
          8,
          [
            { kk: "Шарт бойынша екі жолдың бірін таңдау", ru: "Выбор одной из двух веток по условию" },
            { kk: "Фигуралық жақшаның мағынасын түсіну", ru: "Понимать смысл фигурных скобок" },
          ],
          ["cond.if_elif_else", "compare.operators"],
          l4Blocks,
        ),
        lesson(
          "m1.l5",
          "else if тізбегі",
          "Цепочка else if",
          8,
          [
            { kk: "Үш және одан көп жағдайды өңдеу", ru: "Обработка трёх и более случаев" },
            { kk: "Тізбектің бірінші сәйкестікте тоқтайтынын түсіну", ru: "Понимать остановку цепочки на первом совпадении" },
          ],
          ["cond.if_elif_else", "compare.operators", "debug.boundary"],
          l5Blocks,
        ),
        /* PDF p.7 names two discount tasks — «жеңілдікпен сатып алу құны» and
           «жеңілдік деңгейін таңдау» — and September had neither: «жеңілдік»,
           «скидка» and «процент» appeared zero times. They are also the only
           place in the PDF's own list where percentage arithmetic arises, which
           is where choosing `//` over `/` becomes a decision rather than a
           definition. Placed after `elif`, because the second one needs it. */
        lesson(
          "m1.l12",
          "Пайыз және жеңілдік",
          "Проценты и скидка",
          9,
          [
            { kk: "Пайызды бүтін арифметикамен есептеу", ru: "Считать проценты целочисленной арифметикой" },
            { kk: "Сома бойынша жеңілдік деңгейін таңдау", ru: "Выбирать уровень скидки по сумме" },
          ],
          ["arith.basic", "arith.integer_division", "cond.if_elif_else", "debug.boundary"],
          l12Blocks,
        ),
        lesson(
          "m1.l6",
          "Логикалық амалдар",
          "Логические операции",
          8,
          [
            { kk: "&&, || және ! мағынасын ажырату", ru: "Различать смысл &&, || и !" },
            { kk: "Күрделі шартты бөліктерге жіктеу", ru: "Разбирать сложное условие на части" },
          ],
          ["logic.and_or_not", "compare.operators", "cond.if_elif_else"],
          l6Blocks,
        ),
      ],
    },
    {
      id: "m1.u4",
      title: { kk: "Шекаралар мен қателер", ru: "Границы и ошибки" },
      sourceType: "curriculum-derived",
      lessons: [
        lesson(
          "m1.l7",
          "Шекараны тексеру",
          "Проверка границы",
          8,
          [
            { kk: "Шекаралық мәндерді бөлек сынау", ru: "Отдельно проверять граничные значения" },
            { kk: "Өз тексеру мысалын құрастыру", ru: "Составлять собственный тест" },
          ],
          ["debug.boundary", "cond.if_elif_else"],
          l7Blocks,
        ),
        lesson(
          "m1.l8",
          "Күрделірек есептер",
          "Задачи посложнее",
          10,
          [
            { kk: "Бірнеше шартты біріктіру", ru: "Комбинировать несколько условий" },
            { kk: "Шешімнің дұрыстығын дәлелдеу", ru: "Обосновывать правильность решения" },
          ],
          ["cond.if_elif_else", "logic.and_or_not", "arith.remainder"],
          l8Blocks,
        ),
      ],
    },
    {
      id: "m1.u5",
      title: { kk: "Дербес жаттығу", ru: "Самостоятельная практика" },
      sourceType: "product-authored",
      lessons: [
        lesson(
          "m1.l9",
          "Өз бетіңмен шығар",
          "Реши сам",
          12,
          [
            { kk: "Есепті талдаудан кодқа дейін өз бетінше өту", ru: "Пройти путь от разбора условия до кода самостоятельно" },
            { kk: "Шешімді тапсырар алдында өзің тексеру", ru: "Проверять решение самому перед отправкой" },
          ],
          ["cond.if_elif_else", "arith.remainder", "arith.integer_division", "logic.and_or_not", "compare.operators"],
          practiceBlocks,
        ),
      ],
    },
  ],
  assessment: {
    id: "m1.assessment",
    title: { kk: "Қыркүйек айының тексерісі", ru: "Проверка за сентябрь" },
    minutes: 20,
    /*
     * Restructured against PDF p.7, which asks for ONE unseen problem in twenty
     * minutes plus an explanation — not four graded tasks. The old shape was
     * two unseen coding problems, a bug hunt and an oral question, which timed
     * at 32+ minutes, and its explanation block asked the generic p.6 question
     * instead of September's own.
     *
     * Three defects are closed here:
     *   · the find-bug block had no `code` field, so the learner met "find the
     *     error in this program" with no program on screen;
     *   · its reference solution was byte-identical to the worked example in
     *     m1.l5.b1, so the answer had already been read in lesson 5;
     *   · nothing anywhere asked the two things p.7 requires the learner to
     *     explain — the type choice, and where division, the condition boundary
     *     or very large values give a wrong result. `m1.as.b3` now asks exactly
     *     that, in writing, and is never machine-scored.
     */
    description: {
      kk: "Жиырма минуттық тексеріс: бұрын талданбаған бір есеп, бөтен бағдарламадағы қатені түзету және шешімнің неге дұрыс екенін жазбаша түсіндіру.",
      ru: "Проверка на двадцать минут: одна ранее не разобранная задача, исправление ошибки в чужой программе и письменное объяснение, почему решение верно.",
    },
    sourceType: "curriculum-derived",
    pdfPage: P,
    status: "implemented",
    blocks: [
      {
        /* The unseen problem. Reads data, computes, and turns on one condition
           with a real boundary (17:30 passes, 17:31 does not) — which is what
           m1.as.b3 then asks the learner to reason about. */
        id: "m1.as.b1",
        type: "verify",
        mode: "unseen_problem",
        skillRefs: ["cond.if_elif_else", "logic.and_or_not", "debug.boundary", "io.read"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Бір жолда екі сан беріледі: сағат h (0 ≤ h ≤ 23) және минут m (0 ≤ m ≤ 59). Уақыт 09:00 мен 17:30 аралығында ма (шектерін қоса)? «yes» немесе «no» шығар.",
          ru: "В одной строке даны два числа: часы h (0 ≤ h ≤ 23) и минуты m (0 ≤ m ≤ 59). Время в промежутке 09:00–17:30 включительно? Выведи «yes» или «no».",
        },
        referenceSolution:
          '#include <iostream>\nusing namespace std;\n\nint main() {\n    int h, m;\n    cin >> h >> m;\n    int t = h * 60 + m;\n    if (t >= 9 * 60 && t <= 17 * 60 + 30) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
        cases: [
          { input: "9 0", expectedOutput: "yes" },
          { input: "17 30", expectedOutput: "yes", hidden: true },
          { input: "17 31", expectedOutput: "no", hidden: true },
          { input: "8 59", expectedOutput: "no", hidden: true },
          { input: "12 0", expectedOutput: "yes", hidden: true },
          { input: "0 0", expectedOutput: "no", hidden: true },
          { input: "23 59", expectedOutput: "no", hidden: true },
        ],
      },
      {
        /* Fixing someone else's program — PDF p.7, «бөтен бағдарламаны түзету».
           The bug is an `&&`/`||` swap: a distinct class from the month's other
           three repairs (a missing semicolon in m1.l1.b4, a silently failed
           `cin >>` in m1.l11.b3, `>` vs `>=` in m1.l5.b4), and the program is on
           screen because `VerifyBlock` carries `code`. */
        id: "m1.as.b2",
        type: "verify",
        mode: "find_bug",
        skillRefs: ["logic.and_or_not", "cond.if_elif_else"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Оқушы емтиханнан өту үшін ұпайы кемінде 50 ЖӘНЕ сабаққа қатысуы кемінде 80 болуы керек. Бұл бағдарлама 90 ұпай, 10 қатысуы бар оқушыны да өткізіп жіберіп тұр. Қатені тауып, түзетілген бағдарламаны толық жаз.",
          ru: "Ученик сдаёт экзамен, если его балл не меньше 50 И посещаемость не меньше 80. Эта программа пропускает даже ученика с баллом 90 и посещаемостью 10. Найди ошибку и напиши исправленную программу целиком.",
        },
        code:
          '#include <iostream>\nusing namespace std;\n\nint main() {\n    int score, days;\n    cin >> score >> days;\n    if (score >= 50 || days >= 80) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
        referenceSolution:
          '#include <iostream>\nusing namespace std;\n\nint main() {\n    int score, days;\n    cin >> score >> days;\n    if (score >= 50 && days >= 80) {\n        cout << "yes";\n    } else {\n        cout << "no";\n    }\n    return 0;\n}',
        cases: [
          { input: "90 95", expectedOutput: "yes" },
          { input: "90 10", expectedOutput: "no", hidden: true },
          { input: "40 95", expectedOutput: "no", hidden: true },
          { input: "50 80", expectedOutput: "yes", hidden: true },
          { input: "49 80", expectedOutput: "no", hidden: true },
          { input: "50 79", expectedOutput: "no", hidden: true },
        ],
      },
      {
        /* September's own explanation requirement, verbatim from PDF p.7:
           «бүтін немесе бөлшек типті неге таңдағанын және бөлу, шарт шекарасы
           немесе өте үлкен сандар қай жерде қате нәтиже беруі мүмкін екенін
           түсіндіреді». Written, stored, read by a teacher, never auto-scored —
           `explain` settles as `unknown` by design. */
        id: "m1.as.b3",
        type: "explain",
        skillRefs: ["types.int_float", "arith.integer_division", "debug.boundary"],
        sourceType: "curriculum-derived",
        pdfPage: P,
        prompt: {
          kk: "Бірінші есеп бойынша жаз: (1) уақытты неге `int` деп санадың, `double` керек пе еді? (2) минутты кері қайтару үшін `t / 60` жазсаң не жоғалады? (3) дәл 17:30 неге «yes», ал 17:31 неге «no» — шекара қай жерде? (4) сағат саны өте үлкен болса, `int` не істейді?",
          ru: "По первой задаче напиши: (1) почему ты считал время в `int` — нужен ли был `double`? (2) что потеряется, если попробовать вернуть часы обратно через `t / 60`? (3) почему ровно 17:30 — это «yes», а 17:31 — «no»: где именно проходит граница? (4) что сделает `int`, если число часов окажется очень большим?",
        },
        expectedPoints: [
          {
            kk: "Минут пен сағат — бүтін шамалар, сондықтан `int` жеткілікті; `double` қажет емес және салыстыруды қиындатар еді.",
            ru: "Часы и минуты — целые величины, поэтому достаточно `int`; `double` не нужен и только усложнил бы сравнение.",
          },
          {
            kk: "Екі жағы да `int` болғанда `/` бөлшек бөлігін лақтырып тастайды: 1050 / 60 — 17, ал қалған 30 минут жоғалады. Бұл есепте бөлу мүлде қажет емес — көбейту жеткілікті.",
            ru: "Когда обе стороны `int`, `/` отбрасывает дробную часть: 1050 / 60 — это 17, а оставшиеся 30 минут пропадают. В этой задаче деление вообще не нужно — достаточно умножения.",
          },
          {
            kk: "Шекара 17*60+30 = 1050 минутта. `<=` қолданылғандықтан 1050 өзі кіреді, ал 1051 кірмейді. `<` жазсақ, 17:30 жоғалып кетер еді.",
            ru: "Граница проходит на 17*60+30 = 1050 минутах. Так как использовано `<=`, само значение 1050 входит, а 1051 — нет. Если написать `<`, то 17:30 потерялось бы.",
          },
          {
            kk: "`int` шамамен 2 миллиардқа дейін ғана сақтайды. h өте үлкен болса, `h * 60` сол шектен асып кетеді де, жауап үнсіз бұрмаланады — тіпті теріс сан шығуы мүмкін. Мұндай мәндер күтілсе, `long long` алу керек.",
            ru: "`int` хранит числа примерно до двух миллиардов. Если h очень большое, `h * 60` выйдет за этот предел, и ответ молча исказится — может получиться даже отрицательное число. Когда такие значения ожидаются, нужен `long long`.",
          },
        ],
      },
      {
        /* The p.6 oral check, unchanged in intent and now answerable: the
           renderer gives it a real response control instead of a dead card. */
        id: "m1.as.b4",
        type: "verify",
        mode: "oral_explanation",
        skillRefs: ["cond.if_elif_else"],
        sourceType: "curriculum-derived",
        pdfPage: 6,
        prompt: {
          kk: "Мұғалімге қысқаша айт: түзетілген бағдарламада `||` орнына неге `&&` тұруы керек? Шарт өзгерсе не бұзылады?",
          ru: "Коротко объясни учителю: почему в исправленной программе должно стоять `&&`, а не `||`? Что сломается, если изменить условие?",
        },
        expectedPoints: [
          {
            kk: "`||` — екі шарттың біреуі жеткілікті, сондықтан қатысуы нашар оқушы да өтіп кетеді. `&&` — екеуі де орындалуы керек.",
            ru: "`||` — достаточно одного из условий, поэтому проходит и ученик с плохой посещаемостью. `&&` требует выполнения обоих.",
          },
        ],
      },
    ],
  },
};
