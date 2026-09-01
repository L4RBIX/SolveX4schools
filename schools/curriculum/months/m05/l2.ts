import type { LessonBlock } from "../../types";

/**
 * m5.l2 · «Шекараны жылжыту» / «Сдвиг границ» — 9 minutes.
 *
 * Skills: `bsearch.boundary`, `debug.boundary`. PDF p.9.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * January's paragraph explains *why* the month is taught the way it is:
 * «Шекарада қателесу оңай болғандықтан, алғашқы екі аптада дайын кодты оқу,
 * түзету және толықтыру көбірек беріледі». This lesson is where that claim is
 * paid for. Of its nine tasks, eight are read / repair / complete — a
 * prediction, a hand trace, two `find_bug`s, a `fill_blank`, a `modify_code`, a
 * `test_case` and the support twin — and exactly one is a blank editor. The
 * blank editor is *substituted* for the support route (b9 → b9s), not removed,
 * which is p.6's «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
 * азырақ».
 *
 * The second clause is «Міндетті визуалды анимация: оқушы іздеу шекараларының
 * қалай жақындағанын көріп, келесі қадамды алдын ала болжайды». The
 * `binary_search` visualiser does not exist yet — the month file records that
 * reduction rather than glossing it — so the predicting half of the clause is
 * carried here by b2 (predict the printed result before running it) and b3
 * (write down `left`, `right` and `mid` at every pass by hand).
 *
 * The practice family this lesson owns is «оны қай орынға кірістіру керек».
 *
 * ## The one decision the family forces
 *
 * "Insertion position" is ambiguous the moment the value is already in the
 * list, so the lesson decides once and says it out loud in **both** prompts of
 * b7, b9 and b9s: the answer is the number of elements **strictly less** than
 * x, which is the index x would take, and which — when x is already there — is
 * the index of its first occurrence. The duplicate cases (`2 2 2 5 5 9`, x = 5)
 * enforce it: a search that lands on the rightmost position answers 5 and
 * fails.
 *
 * ## Three authoring decisions worth stating
 *
 * 1. **b4's buggy program carries a step cap and the prompt says so.** The bug
 *    is `right = mid` under `while left <= right`, which is the lesson's
 *    headline failure: when `left == right` the middle *is* that element, so
 *    the interval stops shrinking and the loop never ends. A genuinely
 *    non-terminating program would burn the checker's ten-second timeout on
 *    every probe and freeze a learner's tab, so `steps < 40` bounds it, the
 *    prompt names the cap as a safety net, and the symptom the learner sees is
 *    `no 40` — all forty steps eaten where three were enough.
 *
 * 2. **b5's bug is `right = mid - 1`, not `left = mid`.** The lesson plan asked
 *    for `left = mid` "which terminates but skips", and that program does not
 *    exist: under `while left <= right` the case `left == right == mid` hangs,
 *    and under `while left < right` the case `right == left + 1` hangs too,
 *    because `mid` is then `left`. Putting a second non-terminating program in
 *    the lesson would have been b4 twice. So b5 takes the mirror error in the
 *    half-open form — the boundary shrinks by one step **too many** and the
 *    answer falls out of the interval — which terminates on every input and
 *    gives the wrong answer on some. b4 and b5 are then the two halves of one
 *    rule: shrink too little and it never stops, shrink too much and it loses
 *    the answer.
 *
 * 3. **The programs are cousins and no two of them are the same program.** A
 *    binary-search lesson repeats the same six-line skeleton by nature; what
 *    must differ is what each card asks for. b2 counts passes, b3 prints the two
 *    boundaries at the end, b4 reports found-ness with a cap, b5 does the same
 *    in the half-open form, b6 completes the half-open index search, b7 prints
 *    the position, b8 is the closed index search with a short initial `right`,
 *    b9 prints the position and whether x is present. Every pair was compared
 *    byte for byte — inside the lesson, across `m05/`, and across every month
 *    already authored. The only pairs that come close are the two `find_bug`s
 *    and their repairs, which is what a `find_bug` is.
 *
 *    Two of those comparisons changed the content rather than confirming it.
 *
 *    b6 was a closed search, and `m5.l1.b8` already prints that program five
 *    lines from identical, while three cards in this lesson print correct closed
 *    updates. Blanking `right = ___` inside a closed search was therefore a
 *    copying exercise with the answer on the neighbouring card. In the half-open
 *    form the copied answer is the wrong one, and the learner has to read the
 *    two lines above the blank to choose — which is this lesson's whole subject.
 *    b8 then moved to the closed form so that the card below b6 does not display
 *    b6's answer; what it displays is the closed pair, which fails b6.
 *
 *    b9s started from the program the learner produces in b7 — the m2.l3.b8s
 *    pattern, a program they have already finished — and `check-blocks` rejected
 *    it, correctly: that makes b7's answer a program the platform prints, which
 *    is transcription for anyone who did not finish b7. So b9s starts from the
 *    same problem written in the other form: the half-open position search, the
 *    pairing b1 states and b5 shows being broken. Support meets a working
 *    position search it has not been handed before, and the edit is the piece b9
 *    adds — report presence, and notice that `left` can equal n.
 *
 * ## What is not graded, and is not pretended to be
 *
 * b9 tells the learner that with n up to 200000 a full scan will not finish in
 * time and the answer should be found by halving the interval. Output
 * comparison sees output, not method, so a linear count would pass. That is
 * **option 2** of the authoring contract's three honest choices: the sentence is
 * written as guidance — «аралықты екіге бөліп ізде», a reason and a piece of
 * advice — and the answer is what is marked. Option 1 was not available (any
 * program producing this answer can be produced by counting) and option 3 would
 * have put a written defence into a nine-minute repair lesson that already
 * carries nine tasks. What is NOT done is stating it as a rule and letting a
 * fourteen-year-old believe the product checked it. `lower_bound` from
 * `<algorithm>` would delete the exercise outright; every loop here is written
 * by hand.
 */

const P = 9;

export const M5_L2: LessonBlock[] = [
  {
    id: "m5.l2.b1",
    type: "concept",
    skillRefs: ["bsearch.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Үш шешім бір-бірімен келісуге тиіс",
      ru: "Три решения должны быть согласованы",
    },
    body: {
      kk: "Аралықты екіге бөліп іздегенде сен үш шешім қабылдайсың. Біріншісі — цикл шарты: `while (left <= right)` ма, әлде `while (left < right)` ма? Екіншісі — шекараны қалай жылжытасың: `right = mid - 1;` (ортаны лақтырып тастайсың) ба, әлде `right = mid;` (орта аралықта қала береді) ме? Үшіншісі — цикл біткенде не қалады: `left > right` (аралық бос) па, әлде `left == right` (бір ғана орын) ба? Ереже қысқа: ортаны лақтырсаң `<=` жаз, ортаны қалдырсаң `<` жаз. Себебі `left` пен `right` теңескенде `mid` те дәл сол мәнге тең болады — сол сәтте `right = mid` аралықты мүлде кішірейтпейді, ал шарт `<=` болса цикл ешқашан тоқтамайды. Мұны шексіз цикл дейді. Ал `<` шартында аралық бос болмай тұрып `mid` әрқашан `right`-тен кіші, сондықтан `right = mid` шынымен қысқартады. Төмендегі үзінді осылай қысқарады да, үш жолды шығарып тоқтайды.",
      ru: "Когда ты ищешь делением отрезка пополам, ты принимаешь три решения. Первое — условие цикла: `while (left <= right)` или `while (left < right)`? Второе — как сдвигать границу: `right = mid - 1;` (середина выбрасывается) или `right = mid;` (середина остаётся внутри)? Третье — что остаётся, когда цикл закончился: `left > right` (отрезок пуст) или `left == right` (осталось одно место)? Правило короткое: выбрасываешь середину — пиши `<=`, оставляешь середину — пиши `<`. Причина в том, что при равных `left` и `right` середина совпадает с ними обоими: тогда `right = mid` вообще не сокращает отрезок, а с условием `<=` цикл не остановится никогда. Это и есть бесконечный цикл. При условии `<` середина всегда меньше `right`, пока отрезок не пуст, поэтому `right = mid` действительно сокращает его. Фрагмент ниже сокращается именно так и останавливается, напечатав три строки.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int left = 0;\n    int right = 4;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        cout << left << \" \" << mid << \" \" << right << endl;\n        right = mid;\n    }\n    return 0;\n}",
  },
  {
    /* p.9: «оқушы … келесі қадамды алдын ала болжайды». The three decisions
       disagree here — the updates throw the middle away, but the condition is
       `<`, so the last surviving candidate is never looked at. The program
       terminates, which is the point: a boundary mistake usually shows up as a
       calm wrong answer, not as a frozen tab. */
    id: "m5.l2.b2",
    type: "prediction",
    skillRefs: ["bsearch.boundary", "debug.boundary", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама [2, 5, 8, 12, 16] тізімінен 16 санын іздейді. Ол екі мәнді шығарады: цикл денесі неше рет орындалғанын және `yes` (сан табылды) немесе `no` (табылмады) сөзін. Шекараларды қағазда жылжытып көр де, нәтижені болжа.",
      ru: "Программа ищет число 16 в списке [2, 5, 8, 12, 16]. Она выводит два значения: сколько раз выполнилось тело цикла и слово `yes` (число найдено) или `no` (не найдено). Подвигай границы на бумаге и предскажи результат.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {2, 5, 8, 12, 16};\n    int x = 16;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int steps = 0;\n    int found = 0;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        steps = steps + 1;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (found == 1) {\n        cout << steps << \" yes\";\n    } else {\n        cout << steps << \" no\";\n    }\n    return 0;\n}",
    answer: "2 no",
    options: ["2 no", "3 yes", "3 no", "2 yes"],
    diagnosticMapping: {
      /* `3 yes` is reachable one way only: by letting the body run once more at
         left == right == 4. `3 no` is left unmapped on purpose — a miscounted
         pass and a mis-computed mid both produce it. */
      "3 yes": {
        failureClass: "last_candidate_assumed_tested",
        justification:
          "`3 yes` жауабы left мен right 4-те теңескенде цикл тағы бір рет орындалады деп күткенде ғана шығады. `left < right` шарты дәл сол сәтте циклді тоқтатады, демек оқушы шекаралар түйіскенде соңғы үміткердің тексерілмей қалатынын байқамаған.",
      },
    },
  },
  {
    /* p.9's animation clause, delivered by hand while the visualiser does not
       exist: «іздеу шекараларының қалай жақындағанын көріп». The value 30 is
       deliberately absent from the list, so the learner has to write down what
       the loop LEAVES — left = 6, right = 5 — and the closing question makes
       them count the elements below 30 and notice it is the same 6. That
       observation is what b7 then asks them to turn into a program; the answer
       is nowhere on this card. */
    id: "m5.l2.b3",
    bank: {
      role: "extra_practice",
      why:
        "m5.l1.b5 already has the learner hand-trace a closed-interval search for the same missing target, recording left, right and mid on every pass and writing the crossed exit row — the row where left also lands exactly on the count of elements below x. This is that program on a shorter list. Lesson 2's own subject, the half-open form and the pairing of condition with shift, is carried by its other blocks and not by this one.",
    },
    type: "trace_code",
    skillRefs: ["bsearch.core", "bsearch.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама 30 санын іздейді, бірақ тізімде ондай сан жоқ. Цикл денесінің әр айналымынан кейін mid, left және right мәндерін жаз. Соңында: цикл тоқтағанда left пен right қандай мәнде қалды? Тізімде 30-дан кіші неше сан бар екенін санап, left-пен салыстыр.",
      ru: "Этот поиск ищет число 30, но такого числа в списке нет. После каждого прохода тела цикла записывай значения mid, left и right. В конце ответь: на каких значениях остановились left и right? Посчитай, сколько в списке чисел меньше 30, и сравни с left.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {2, 4, 9, 13, 20, 25, 31, 38, 44, 50};\n    int x = 30;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << left << \" \" << right;\n    return 0;\n}",
    steps: [
      { line: 10, vars: { left: "0", right: "9" } },
      { line: 17, vars: { mid: "4", left: "5", right: "9" } },
      { line: 19, vars: { mid: "7", left: "5", right: "6" } },
      { line: 17, vars: { mid: "5", left: "6", right: "6" } },
      { line: 19, vars: { mid: "6", left: "6", right: "5" } },
      { line: 22, vars: { left: "6", right: "5" } },
    ],
  },
  {
    /* p.9: «Қосымша - іздеу шекараларындағы қателерді түзету». The headline
       failure of the month: the updates keep the middle, the condition allows
       left == right, and the interval stops shrinking. Capped at 40 steps so it
       terminates for the checker and for the learner — the prompt says the cap
       is a safety net, because hiding it would teach that this bug is harmless. */
    id: "m5.l2.b4",
    type: "find_bug",
    skillRefs: ["bsearch.boundary", "debug.boundary", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама тізімнен санды іздеп, `yes` (бар) немесе `no` (жоқ) сөзін және қадам санын шығаруы керек. `steps < 40` шарты — қорғаныс: онсыз бұл бағдарлама кейбір енгізуде мүлде тоқтамас еді. x = 20 болғанда ол `no 40` шығарады, яғни 40 қадамның бәрін жұмсаған, ал үш қадам жеткілікті еді. Аралықтың неге кішіреймейтінін тауып, қате тұрған жолды көрсет.",
      ru: "Программа должна искать число в списке и выводить `yes` (есть) или `no` (нет) вместе с числом шагов. Условие `steps < 40` — это страховка: без него на некоторых входах программа не остановилась бы вообще. При x = 20 она выводит `no 40`, то есть израсходовала все 40 шагов, хотя хватило бы трёх. Найди, почему отрезок перестаёт сокращаться, и укажи строку с ошибкой.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {4, 8, 15, 16, 23, 42};\n    int x;\n    cin >> x;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int steps = 0;\n    int found = 0;\n    while (left <= right && steps < 40) {\n        steps = steps + 1;\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid;\n        }\n    }\n    if (found == 1) {\n        cout << \"yes \" << steps;\n    } else {\n        cout << \"no \" << steps;\n    }\n    return 0;\n}",
    buggyLine: 24,
    symptomInput: "20",
    fixedCode: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {4, 8, 15, 16, 23, 42};\n    int x;\n    cin >> x;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int steps = 0;\n    int found = 0;\n    while (left <= right && steps < 40) {\n        steps = steps + 1;\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (found == 1) {\n        cout << \"yes \" << steps;\n    } else {\n        cout << \"no \" << steps;\n    }\n    return 0;\n}",
    diagnosticMapping: {
      "14": {
        failureClass: "blamed_the_loop_condition_not_the_shrink",
        justification:
          "14-жолды таңдау — циклді тоқтататын шартты кінәлау. Бірақ left мен right теңескенде mid те сол мәнге тең болады, сондықтан аралықты кішірейтпей тұрған нәрсе — 24-жол. Шартты `<` етіп өзгерту циклді тоқтатқанмен, соңғы үміткерді тексерусіз қалдырады.",
      },
    },
  },
  {
    /* The mirror error, and the reason it is here rather than a second
       non-terminating program: this one always stops. The half-open form keeps
       the middle (`right = mid`) because `right` counts as OUTSIDE the interval;
       writing `right = mid - 1` there shrinks by one step too many and throws
       the answer out. It is invisible on 10, 15, 25, 35 and 40 — the prompt says
       so, because "I tested it once and it worked" is the habit this lesson is
       against. */
    id: "m5.l2.b5",
    type: "find_bug",
    skillRefs: ["bsearch.boundary", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Мұнда іздеу аралығы басқаша жазылған: оң шекара тізімнің соңынан бір қадам сыртта тұрады (`int right = n;`, мұндағы n — тізім ұзындығы), сондықтан цикл `left < right` болғанда жүреді. Бағдарлама `yes` немесе `no` шығарады. 20 санын іздегенде ол `no` шығарады, ал 20 тізімде бар. 10, 15 немесе 25 сандарында дұрыс жауап береді — бір тексеру жеткіліксіз деген осы. Керек сан аралықтан қалай жоғалып кететінін тауып, қате жолды көрсет.",
      ru: "Здесь отрезок поиска записан иначе: правая граница стоит на один шаг за концом списка (`int right = n;`, где n — длина списка), поэтому цикл идёт, пока `left < right`. Программа выводит `yes` или `no`. При поиске числа 20 она выводит `no`, хотя 20 в списке есть. На числах 10, 15 и 25 она отвечает правильно — вот почему одной проверки мало. Найди, как нужное число исчезает из отрезка, и укажи строку с ошибкой.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {5, 10, 15, 20, 25, 30, 35, 40};\n    int x;\n    cin >> x;\n    int n = a.size();\n    int left = 0;\n    int right = n;\n    int found = 0;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (found == 1) {\n        cout << \"yes\";\n    } else {\n        cout << \"no\";\n    }\n    return 0;\n}",
    buggyLine: 22,
    symptomInput: "20",
    fixedCode: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {5, 10, 15, 20, 25, 30, 35, 40};\n    int x;\n    cin >> x;\n    int n = a.size();\n    int left = 0;\n    int right = n;\n    int found = 0;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid;\n        }\n    }\n    if (found == 1) {\n        cout << \"yes\";\n    } else {\n        cout << \"no\";\n    }\n    return 0;\n}",
    diagnosticMapping: {
      "20": {
        failureClass: "expected_symmetric_boundary_updates",
        justification:
          "20-жолды таңдау екі шекара да бірдей жылжуға тиіс деген ойдан туады. Бұл жазылымда `left = mid + 1` дұрыс, себебі mid тексерілді және сол шекара аралықтың ішінде саналады; ал оң шекара аралықтың сыртында тұрғандықтан дәл mid-те қалуға тиіс.",
      },
    },
  },
  {
    /*
     * p.9: «дайын кодты … толықтыру». Both updates at once — and in the
     * HALF-OPEN form, which is what makes the blanks work rather than decorate.
     *
     * m5.l1 taught the closed form, and this lesson prints correct closed
     * searches on four cards, so blanking `left = ___` / `right = ___` inside a
     * closed search would be a copying exercise: the answer sits on b3, on b4's
     * repair and on b7. Here the loop condition is `<` and the right boundary
     * starts outside the list, so the closed answer — `right = mid - 1`, the one
     * visible on the neighbouring cards and on b8 — is exactly wrong, and it is
     * wrong in the way b5 has just shown. The learner has to read the two lines
     * above the blank and choose, which is the lesson.
     *
     * Not the insertion position, deliberately: the filled template must not be
     * the answer to b7, b9 or b9s.
     */
    id: "m5.l2.b6",
    type: "fill_blank",
    skillRefs: ["bsearch.core", "bsearch.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама x санының тізімдегі индексін шығаруы керек, ал сан болмаса -1. Мұнда аралық ашық жазылған: `right` тізімнің соңынан бір қадам сыртта тұр (`int right = n;`), сондықтан цикл `left < right` болғанда жүреді. Кіріс: бірінші жолда n, екінші жолда n сан, үшінші жолда x. Екі шекара жаңартуын толықтыр. Жаңарту цикл шартымен келісуге тиіс: бір жазылымда тексерілген орта лақтырылады, екіншісінде аралықта қалады — осы бағдарламаның шартына қарап шеш.",
      ru: "Программа должна вывести индекс числа x в списке, а если числа нет — -1. Отрезок здесь записан открытым: `right` стоит на один шаг за концом списка (`int right = n;`), поэтому цикл идёт, пока `left < right`. Ввод: в первой строке n, во второй — n чисел, в третьей — x. Дополни оба обновления границ. Обновление должно быть согласовано с условием цикла: в одной записи проверенная середина выбрасывается, в другой остаётся в отрезке — решай по условию именно этой программы.",
    },
    template: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n;\n    int pos = -1;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        }\n        if (a[mid] < x) {\n            left = ___;\n        } else {\n            right = ___;\n        }\n    }\n    cout << pos;\n    return 0;\n}",
    blanks: [
      { id: "f1", answer: "mid + 1", alternatives: ["mid+1"] },
      { id: "f2", answer: "mid" },
    ],
  },
  {
    /*
     * The family this lesson owns, p.9: «оны қай орынға кірістіру керек».
     *
     * The starting program is the found/not-found search every route has
     * already written — core and advanced in `m5.l1.b9`, support in `m5.l1.b9s`
     * — which is the only direction the contract allows a `modify_code` to run.
     * It is deliberately not byte-identical to either (`found` rather than
     * `pos`, a bare `if` after the equality test rather than an `else if`
     * chain): an exact copy would make l1's
     * write_code a task whose answer this card prints.
     *
     * The edit is structural rather than cosmetic — stop reporting found-ness,
     * stop breaking early, let the boundaries pass each other and print what is
     * left. b3 is where the learner watched `left` come to rest on exactly the
     * count of smaller elements; this card asks for the program, and the
     * observation is theirs to have made.
     */
    id: "m5.l2.b7",
    type: "modify_code",
    skillRefs: ["bsearch.boundary", "bsearch.core", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама санның тізімде бар-жоғын ғана айтады: `yes` немесе `no`. Оны кірістіру орнын шығаратындай өзгерт. Кірістіру орны — x-тен қатаң кіші элементтердің саны; дәл сол индекске x-ті қойсаң, тізім реттелген күйінде қалады. Егер x тізімде бұрыннан бар болса, жауап — оның ең алғаш кездескен орнының индексі. Іздеу табылған санның үстінде тоқтамауы керек: цикл шекаралар қиылысқанша, яғни аралық босағанша жүрсін, содан кейін нәтижені шығар. Кіріс: бірінші жолда n, екінші жолда өспелі реттелген n сан, үшінші жолда x.",
      ru: "Эта программа только сообщает, есть ли число в списке: `yes` или `no`. Измени её так, чтобы она выводила позицию вставки. Позиция вставки — это количество элементов, строго меньших x; если поставить x на этот индекс, список останется упорядоченным. Если x в списке уже есть, ответом будет индекс его первого вхождения. Поиск не должен останавливаться на найденном элементе: пусть цикл идёт, пока границы не пересекутся, то есть пока отрезок не опустеет, а потом выведи результат. Ввод: в первой строке n, во второй — n чисел по возрастанию, в третьей — x.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    int found = 0;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            found = 1;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (found == 1) {\n        cout << \"yes\";\n    } else {\n        cout << \"no\";\n    }\n    return 0;\n}",
    referenceSolution: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << left;\n    return 0;\n}",
    cases: [
      { input: "5\n1 3 5 7 9\n6", expectedOutput: "3" },
      /* Visible on purpose: it is the case where the leftmost rule stated in the
         prompt is the difference between 2 and 3. */
      { input: "5\n1 3 5 7 9\n5", expectedOutput: "2" },
      /* Below everything and above everything — the two ends a search that keeps
         an early `break` or prints `right` never reaches correctly. */
      { input: "5\n1 3 5 7 9\n0", expectedOutput: "0", hidden: true },
      { input: "5\n1 3 5 7 9\n10", expectedOutput: "5", hidden: true },
      /* Duplicates: a rightmost search answers 5 here, a leftmost one 3. */
      { input: "6\n2 2 2 5 5 9\n5", expectedOutput: "3", hidden: true },
      { input: "6\n2 2 2 2 2 2\n2", expectedOutput: "0", hidden: true },
      /* One element, both sides of it. */
      { input: "1\n4\n4", expectedOutput: "0", hidden: true },
      { input: "1\n4\n5", expectedOutput: "1", hidden: true },
      /* The answer at the last position — the case a loop that stops one short
         gets wrong, and the programme names that error by hand. */
      { input: "7\n1 2 3 4 5 6 7\n7", expectedOutput: "6", hidden: true },
    ],
  },
  {
    /*
     * The rule of b1 applied to the boundary b1 does not mention: the INITIAL
     * interval. Closed form, correctly paired condition and updates, and a right
     * boundary that starts one index short — so the last element is outside the
     * interval from line 4 onwards and no amount of correct halving can reach it.
     * A one-element list is the same bug at its smallest: `right` starts at -1
     * and the body never runs.
     *
     * Its visible updates are the CLOSED pair, which is the wrong answer for b6
     * two cards above — so a learner who solves b6 by copying from here fails
     * b6, which is the intended direction of that trap.
     *
     * It is a `test_case` and not a `find_bug` because the work here is naming
     * the input, and because nothing has to be executed to grade that thinking —
     * so the program can be shown broken and left broken.
     */
    id: "m5.l2.b8",
    type: "test_case",
    skillRefs: ["bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Мұнда аралық жабық: цикл `left <= right` болғанда жүреді, тексерілген орта екі жағынан лақтырылады — бұл жұп келісілген. Бірақ үшінші шешім, бастапқы оң шекара, бір қадамға қысқа қойылған. Бағдарлама x табылса оның индексін, табылмаса -1 шығарады. Ол қате жауап беретін енгізу мысалын жаз: бірінші жолда n саны, екінші жолда өспелі реттелген n сан, үшінші жолда x. Осы бастапқы шекарамен қай элемент іздеу аралығына ешқашан кірмейтінін ойлан.",
      ru: "Здесь отрезок замкнутый: цикл идёт, пока `left <= right`, а проверенная середина выбрасывается с обеих сторон — эта пара согласована. Но третье решение, начальная правая граница, задана на один шаг короче. Программа выводит индекс x, если он найден, и -1, если нет. Придумай ввод, на котором ответ будет неверным: в первой строке — n, во второй — n чисел по возрастанию, в третьей — x. Подумай, какой элемент при такой начальной границе вообще не попадает в отрезок поиска.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 2;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        }\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << pos;\n    return 0;\n}",
    breakingInputs: ["4\n1 3 5 7\n7", "1\n4\n4"],
  },
  {
    /* The month's family again, now from an editor, and the lesson's only blank
       one. New work over b7: the presence report, which needs the guard
       `left < n` — when x is greater than everything, `left` is n and there is no
       a[n]. The hidden case `1 3 5 7 9` / 10 is what a missing guard crashes on.
       Support does not receive this block; it receives b9s below. */
    id: "m5.l2.b9",
    type: "write_code",
    skillRefs: ["bsearch.core", "bsearch.boundary", "lists.index", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны, екінші жолда өспелі реттелген n бүтін сан, үшінші жолда x беріледі (1 ≤ n ≤ 200000). Екі мәнді бір жолға, бос орынмен бөліп шығар. Біріншісі — x-тің кірістіру орны, яғни одан қатаң кіші элементтердің саны; x тізімде бар болса, бұл оның алғаш кездескен орнының индексі. Екіншісі — `yes` (x тізімде бар) немесе `no` (жоқ) сөзі. x барлық элементтен үлкен болса, кірістіру орны n-ге тең болады, ал тізімде ондай индекс жоқ — соны ұмытпа. Тізім реттелген, сондықтан аралықты екіге бөліп ізде — n үлкен болғанда тізімді толық қарап шығу уақытқа үлгермейді.",
      ru: "В первой строке дано n, во второй — n целых чисел по возрастанию, в третьей — x (1 ≤ n ≤ 200000). Выведи в одну строку через пробел два значения. Первое — позиция вставки x, то есть количество элементов, строго меньших x; если x в списке есть, это индекс его первого вхождения. Второе — слово `yes` (x в списке есть) или `no` (нет). Если x больше всех элементов, позиция вставки равна n, а такого индекса в списке уже нет — не забудь об этом. Список упорядочен, поэтому ищи делением отрезка пополам — при большом n полный просмотр списка не уложится во время.",
    },
    referenceSolution: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (left < n && a[left] == x) {\n        cout << left << \" yes\";\n    } else {\n        cout << left << \" no\";\n    }\n    return 0;\n}",
    /* The prompt states one line with a space between the two values, so the
       comparison has to be the one the prompt promised. */
    checker: { kind: "exact" },
    cases: [
      { input: "5\n1 3 5 7 9\n6", expectedOutput: "3 no" },
      { input: "5\n1 3 5 7 9\n7", expectedOutput: "3 yes" },
      /* Above everything: the guard case. Without `left < n` this is IndexError. */
      { input: "5\n1 3 5 7 9\n10", expectedOutput: "5 no", hidden: true },
      { input: "5\n1 3 5 7 9\n0", expectedOutput: "0 no", hidden: true },
      /* The answer at the very first and the very last position. */
      { input: "5\n1 3 5 7 9\n1", expectedOutput: "0 yes", hidden: true },
      { input: "5\n1 3 5 7 9\n9", expectedOutput: "4 yes", hidden: true },
      /* Duplicates: a rightmost search reports `5 no` here instead of `3 yes`. */
      { input: "6\n2 2 2 5 5 9\n5", expectedOutput: "3 yes", hidden: true },
      { input: "1\n4\n4", expectedOutput: "0 yes", hidden: true },
      { input: "4\n2 2 2 2\n2", expectedOutput: "0 yes", hidden: true },
      { input: "4\n2 2 2 2\n3", expectedOutput: "4 no", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b9. Same problem, same cases, same checker —
     * p.6's «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ»
     * is substitution, not a shorter month.
     *
     * The starting program is the position search written in the HALF-OPEN form:
     * the right boundary sits one step outside the list, the loop runs while
     * `left < right`, and the middle is kept rather than thrown away. That is
     * exactly the pairing b1 states as the rule and b5 shows being broken, so the
     * support learner reads a second, correct instance of it instead of getting
     * back the program b7 asked them to write. The edit is the piece b9 adds on
     * top of the position search — report presence, and notice that `left` can
     * equal n — and nothing on this card is a copy of anything the lesson has
     * already printed.
     */
    id: "m5.l2.b9s",
    type: "modify_code",
    skillRefs: ["bsearch.core", "bsearch.boundary", "lists.index"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарлама кірістіру орнын дұрыс табады — x-тен қатаң кіші элементтердің санын. Ол іздеудің екінші жазылымын қолданады: оң шекара тізімнің соңынан бір қадам сыртта тұр, цикл `left < right` болғанда жүреді, ал орта аралықта қалады. Циклдің өзін өзгертудің қажеті жоқ. Оған тағы бір нәрсе қос: орыннан кейін бір жолда, бос орынмен бөліп, `yes` (x тізімде бар) немесе `no` (жоқ) сөзін шығар. Абайла: x барлық элементтен үлкен болса, left мәні n-ге тең болады, ал тізімде ондай индекс жоқ — сондықтан a[left] элементін сұрар алдында left < n екенін тексер.",
      ru: "Эта программа правильно находит позицию вставки — количество элементов, строго меньших x. Она использует вторую запись поиска: правая граница стоит на один шаг за концом списка, цикл идёт, пока `left < right`, а середина остаётся внутри отрезка. Сам цикл менять не нужно. Добавь к программе ещё одно: после позиции выведи в той же строке через пробел `yes` (x в списке есть) или `no` (нет). Осторожно: если x больше всех элементов, значение left равно n, а такого индекса в списке нет — поэтому перед обращением к a[left] проверь, что left < n.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid;\n        }\n    }\n    cout << left;\n    return 0;\n}",
    referenceSolution: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n;\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid;\n        }\n    }\n    if (left < n && a[left] == x) {\n        cout << left << \" yes\";\n    } else {\n        cout << left << \" no\";\n    }\n    return 0;\n}",
    checker: { kind: "exact" },
    cases: [
      { input: "5\n1 3 5 7 9\n6", expectedOutput: "3 no" },
      { input: "5\n1 3 5 7 9\n7", expectedOutput: "3 yes" },
      { input: "5\n1 3 5 7 9\n10", expectedOutput: "5 no", hidden: true },
      { input: "5\n1 3 5 7 9\n0", expectedOutput: "0 no", hidden: true },
      { input: "5\n1 3 5 7 9\n1", expectedOutput: "0 yes", hidden: true },
      { input: "5\n1 3 5 7 9\n9", expectedOutput: "4 yes", hidden: true },
      { input: "6\n2 2 2 5 5 9\n5", expectedOutput: "3 yes", hidden: true },
      { input: "4\n2 2 2 2\n3", expectedOutput: "4 no", hidden: true },
    ],
  },
];
