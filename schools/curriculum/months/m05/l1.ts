import type { LessonBlock } from "../../types";

/**
 * m5.l1 · «Жарты аралықты тастау» / «Отбрасывание половины» — 9 minutes.
 *
 * Skill: `bsearch.core`. PDF p.9.
 *
 * Three clauses of January's paragraph drive every block below.
 *
 * 1. The mastery sentence: «Реттелген тізімнен керекті мәнді әр қадамда
 *    нұсқалардың жартысын алып тастау арқылы іздеу». So the concept block does
 *    not say "binary search is fast" and move on — it says which two numbers
 *    hold the range, how `mid` is computed from them, and why the half that
 *    cannot contain the answer is thrown away. It also states the arithmetic
 *    once and concretely: a million halved twenty times is one, so twenty
 *    comparisons replace a million.
 *
 * 2. «**Міндетті** визуалды анимация: оқушы іздеу шекараларының қалай
 *    жақындағанын көріп, келесі қадамды алдын ала болжайды» — the strongest
 *    wording in the whole programme. The `binary_search` visualiser does not
 *    exist yet (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1), so
 *    b2 declares it and will light up the day it is built, and the teaching
 *    weight sits meanwhile on two blocks that work today: b5 makes the learner
 *    WRITE `left`, `right` and `mid` at every pass instead of watching them
 *    move, and b4 is the PDF's «келесі қадамды алдын ала болжайды» rendered as
 *    a prediction — one step, one comparison, which half survives.
 *
 * 3. «Шекарада қателесу оңай болғандықтан, алғашқы екі аптада дайын кодты оқу,
 *    түзету және толықтыру көбірек беріледі». This lesson opens the month's
 *    first half, so it carries exactly ONE blank editor (b9), and everything
 *    else is read, complete or repair: a worked example, a trace, a fill-blank
 *    and a modify.
 *
 * ## Why the repair block changes the ORDER of the list and not the reporting
 *
 * The obvious modify for this lesson is "here is a search that prints yes/no,
 * make it print the position" — and it is unusable, in both directions. The
 * lesson player mounts every block at once and Continue is never gated, so
 * whichever of the two programs sits in `code` is on screen while the learner
 * is still working on b9, whose answer is the yes/no search. That is the
 * October defect (`m2.l3.b8s`) with the names changed.
 *
 * So b8 keeps the reporting and flips the ORDER: the list now arrives largest
 * first, and the single line that has to change is the comparison against
 * `a[mid]`. It cannot be answered from memory of the ascending code — the
 * learner has to re-derive which half can still hold the answer, which is this
 * lesson's own objective — and neither the program shown nor the program asked
 * for is b9's answer.
 *
 * ## The one duplicated program, and why it is the sanctioned one
 *
 * `m5.l1.b9s.code` is byte-identical to b7's completed template. That is
 * deliberate and it is the only direction the contract allows: the starting
 * point of a `modify_code` is a program the learner has ALREADY finished. The
 * support route completes it in b7 and then rebuilds its reporting in b9s; the
 * core route never meets b9s at all. b9s and b9 solve the same problem for
 * different routes, which is what a support twin is.
 *
 * ## What this lesson deliberately does not do
 *
 * No `while left < right`, no `right = n`, no half-open range: the four ways to
 * get the boundary wrong belong to `m5.l2` and `m5.l6`, which exist for them.
 * Here every search is the closed range `left <= right` with `mid` excluded on
 * both updates, so the learner meets one correct shape before meeting its
 * failure modes. And no `lower_bound` from `<algorithm>` — importing the answer
 * would delete the month; the loop is written by hand.
 */

const P = 9; // PDF page for all of January

export const M5_L1: LessonBlock[] = [
  {
    id: "m5.l1.b1",
    type: "concept",
    skillRefs: ["bsearch.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Ортаңғы элементпен салыстыр да, жартысын таста",
      ru: "Сравни со средним и отбрось половину",
    },
    body: {
      kk: "Тізім өсу ретімен реттелген болса, ортаңғы элементпен бір рет салыстырсақ, элементтердің жартысынан бірден құтыламыз. Іздеу аралығын екі сан ұстап тұрады: `left` — аралықтың сол шеті, `right` — оң шеті. Ортаңғы орын `int mid = left + (right - left) / 2;` арқылы табылады. Бұл `(left + right) / 2` дегенмен дәл бір сан, бірақ қауіпсіз түрі: `left + right` қосындысы `int` шегінен асып кетуі мүмкін, ал `left + (right - left) / 2` ешқашан аспайды. Бүтін сандарды бөлгенде бөлшек бөлігі тасталады, сондықтан `mid` әрқашан бүтін орын болады. Дайын тізімді `vector<int> a = {2, 5, 8};` деп жазуға болады, ал `a.size()` оның ұзындығын береді.\n\nЕгер `a[mid]` ізделетін саннан кіші болса, ол сан тек mid-тен оң жақта жатады: сол жақтың бәрі одан да кіші, оларды қараудың қажеті жоқ. Сонда `left` mid-тен кейінгі орынға көшеді. Ал `a[mid]` үлкен болса, керісінше, `right` mid-тен бұрынғы орынға көшеді. Тізім реттелмеген болса, бұл пайымның күші жоқ: реттелмеген тізімде ортаңғы элемент оның екі жағы туралы ештеңе айтпайды.\n\nМұның пайдасы неде? Миллион элементті бірінен соң бірін қарасаң, миллионға жуық салыстыру керек. Ал әр қадамда жартысын тастасаң: миллион → 500 000 → 250 000 → 125 000 → ... — жиырма қадамнан кейін бір ғана элемент қалады. Жиырма салыстыру мен миллион салыстырудың айырмасы — осы айдың бүкіл мәні.",
      ru: "Если список отсортирован по возрастанию, одного сравнения со средним элементом достаточно, чтобы сразу избавиться от половины элементов. Интервал поиска держат два числа: `left` — левый край интервала, `right` — правый. Середина находится как `int mid = left + (right - left) / 2;`. Это ровно то же число, что и `(left + right) / 2`, но безопасная форма записи: сумма `left + right` может не поместиться в `int`, а `left + (right - left) / 2` не переполнится никогда. При делении целых чисел дробная часть отбрасывается, поэтому `mid` — всегда целая позиция. Готовый список записывается как `vector<int> a = {2, 5, 8};`, а `a.size()` даёт его длину.\n\nЕсли `a[mid]` меньше искомого числа, то это число может лежать только правее mid: всё, что слева, ещё меньше, и смотреть туда незачем. Тогда `left` переходит на позицию после mid. Если же `a[mid]` больше — наоборот, `right` переходит на позицию перед mid. Для неотсортированного списка такое рассуждение не работает: там средний элемент ничего не сообщает о том, что лежит по обе стороны от него.\n\nЗачем это нужно? Если просматривать миллион элементов подряд, понадобится около миллиона сравнений. А если на каждом шаге отбрасывать половину: миллион → 500 000 → 250 000 → 125 000 → … — через двадцать шагов остаётся один элемент. Разница между двадцатью сравнениями и миллионом — это и есть смысл всего месяца.",
    },
    /* Three lines and no loop on purpose: the loop is b3's job, and a concept
       block that printed a whole search would hand b9 its answer on card one. */
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {2, 5, 8, 11, 14, 17, 21, 26, 30};\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int mid = left + (right - left) / 2;\n    cout << left << \" \" << right << \" \" << mid << endl;\n    cout << a[mid];\n    return 0;\n}",
  },
  {
    /*
     * «Міндетті визуалды анимация» — mandatory, and the visualiser is not built
     * yet, so today this renders as the honest "not ready" card. It is declared
     * rather than dropped for two reasons: the block is the requirement's only
     * record inside the content, and the day `SimulationView` learns
     * `binary_search` the lesson gains it without an edit.
     *
     * Not an attempt block. Watching boundaries converge is not evidence that
     * the learner predicted where they would land — b4 collects that.
     */
    id: "m5.l1.b2",
    type: "visual_simulation",
    skillRefs: ["bsearch.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    simulation: "binary_search",
    prompt: {
      kk: "Іздеуді бір-бір қадамнан жүргіз. Әр қадам сайын `left` пен `right` бір-біріне жақындай түседі, ал `mid` солардың дәл ортасына түседі. Келесі қадамды баспас бұрын: `mid` қай орынға түсетінін және аралықтың қай жартысы жоғалатынын өзің айтып ал.",
      ru: "Прогони поиск по одному шагу. С каждым шагом `left` и `right` сближаются, а `mid` попадает ровно между ними. Прежде чем нажать следующий шаг, скажи сам: куда встанет `mid` и какая половина интервала исчезнет.",
    },
    config: {
      list: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100],
      target: 81,
      show: ["left", "right", "mid"],
      askBeforeStep: true,
    },
  },
  {
    /* «толық талданған мысалдар». The reasoning is one move per step and the
       numbers are all written out, because the point of the example is that the
       learner can check every left/right/mid against their own arithmetic. Nine
       elements, three comparisons, and it ends found — the ending that b5 then
       deliberately does not have. */
    id: "m5.l1.b3",
    type: "worked_example",
    skillRefs: ["bsearch.core", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: тоғыз саннан 27-ні табу",
      ru: "Разобранный пример: найти 27 среди девяти чисел",
    },
    problem: {
      kk: "Өсу ретімен реттелген тізім берілген: 3, 6, 9, 14, 20, 27, 31, 38, 45. 27 саны қай орында тұрғанын тап. Орындар нөлден бастап саналады.",
      ru: "Дан список, отсортированный по возрастанию: 3, 6, 9, 14, 20, 27, 31, 38, 45. Найди, на каком месте стоит число 27. Места считаются с нуля.",
    },
    steps: [
      {
        kk: "Тізімде тоғыз сан бар, сондықтан іздеу аралығы бүкіл тізім: `left` = 0, `right` = 8.",
        ru: "В списке девять чисел, поэтому интервал поиска — весь список: `left` = 0, `right` = 8.",
      },
      {
        kk: "`mid` = 0 + (8 - 0) / 2 = 4, ал `a[4]` = 20. 20 < 27, демек 27 тек оң жақта. 0-ден 4-ке дейінгі бес орын түгел жоғалады: `left` = 5.",
        ru: "`mid` = 0 + (8 - 0) / 2 = 4, а `a[4]` = 20. 20 < 27, значит 27 может быть только справа. Пять мест с 0 по 4 исчезают целиком: `left` = 5.",
      },
      {
        kk: "Енді аралық 5-тен 8-ге дейін. `mid` = 5 + (8 - 5) / 2 = 5 + 1 = 6 (3 / 2 бүтін бөлуде 1 болады), ал `a[6]` = 31. 31 > 27, демек 27 сол жақта: `right` = 5.",
        ru: "Теперь интервал от 5 до 8. `mid` = 5 + (8 - 5) / 2 = 5 + 1 = 6 (3 / 2 при целочисленном делении даёт 1), а `a[6]` = 31. 31 > 27, значит 27 слева: `right` = 5.",
      },
      {
        kk: "Аралықта бір ғана орын қалды: `left` = 5, `right` = 5, `mid` = 5. `a[5]` = 27 — іздегеніміз осы, `pos` = 5 болып, цикл `break` арқылы тоқтайды.",
        ru: "В интервале осталось одно место: `left` = 5, `right` = 5, `mid` = 5. `a[5]` = 27 — это то, что искали, `pos` = 5, и цикл останавливается через `break`.",
      },
      {
        kk: "Тоғыз санның ішінен үш салыстырумен таптық. Тізім екі есе ұзарса, бір ғана салыстыру қосылады.",
        ru: "Мы нашли число среди девяти за три сравнения. Если список станет вдвое длиннее, добавится всего одно сравнение.",
      },
    ],
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {3, 6, 9, 14, 20, 27, 31, 38, 45};\n    int x = 27;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << pos;\n    return 0;\n}",
    result: {
      kk: "Бағдарлама 5 шығарады. Цикл денесі бар болғаны үш рет орындалды.",
      ru: "Программа выводит 5. Тело цикла выполнилось всего три раза.",
    },
  },
  {
    /*
     * The PDF's «келесі қадамды алдын ала болжайды», in the block type that
     * works today. One step only: the learner names `mid` and then the two
     * boundaries that survive it.
     *
     * Ten elements, not nine, so that `left + (right - left) / 2` and `a.size() / 2`
     * disagree — 4 against 5. That is what makes the second option worth
     * offering, and it is a real confusion: the middle of the LIST and the
     * middle of the current RANGE are the same thing only on the first step of
     * an odd-length list.
     */
    id: "m5.l1.b4",
    type: "prediction",
    skillRefs: ["bsearch.core", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Тізім өсу ретімен реттелген, іздеп отырғанымыз x = 55. Бағдарлама бір ғана қадам жасайды: алдымен `mid`-ті, содан кейін жаңарған `left` пен `right`-ты бір жолда шығарады. Қай жарты аман қалатынын алдын ала шеш те, үш санды жаз.",
      ru: "Список отсортирован по возрастанию, ищем x = 55. Программа делает один шаг: выводит в одной строке `mid`, а затем обновлённые `left` и `right`. Заранее реши, какая половина уцелеет, и назови три числа.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {5, 9, 13, 18, 24, 30, 37, 41, 55, 62};\n    int x = 55;\n    int left = 0;\n    int right = 9;\n    int mid = left + (right - left) / 2;\n    if (a[mid] < x) {\n        left = mid + 1;\n    } else {\n        right = mid - 1;\n    }\n    cout << mid << \" \" << left << \" \" << right;\n    return 0;\n}",
    answer: "4 5 9",
    options: ["4 5 9", "5 6 9", "4 0 3", "4 4 9"],
    diagnosticMapping: {
      /* Each of the three has exactly one arithmetic route to it, and they are
         three different mistakes. `4 4 9` is left mapped as well: left = 4 is
         reachable only by writing `left = mid`, since mid itself is 4 and no
         other value in the program equals it. */
      "5 6 9": {
        failureClass: "mid_taken_from_list_length",
        justification:
          "mid = 5 болу үшін `a.size() / 2` есептелуі керек, өйткені 0 + (9 - 0) / 2 = 4. Бұл жауап оқушының ортаңғы орынды ағымдағы аралықтан емес, тізімнің ұзындығынан алғанын көрсетеді.",
      },
      "4 0 3": {
        failureClass: "kept_the_half_without_the_answer",
        justification:
          "a[4] = 24, ал x = 55, яғни 24 < 55 және 55 тек оң жақта жатады. 0-ден 3-ке дейінгі аралықты таңдау — салыстыруды кері оқып, жауап жатқан жартысын лақтырып тастау.",
      },
      "4 4 9": {
        failureClass: "mid_not_excluded_from_next_range",
        justification:
          "left = 4 мәні тек `left = mid` деп жазғанда шығады: бағдарламада 4-ке тең басқа сан жоқ. Демек оқушы a[mid] тексерілгенін, оны келесі аралыққа қалдырудың қажеті жоқ екенін ескермеген.",
      },
    },
  },
  {
    /*
     * The mandatory animation's stand-in, and the reason it is not a lighter
     * block: «оқушы іздеу шекараларының қалай жақындағанын көреді» is exactly a
     * table of left/right/mid, so the learner fills it in rather than watching
     * it fill itself. Twelve elements — four passes.
     *
     * It searches for a value that is NOT in the list, which b3 never showed:
     * the boundaries cross, `left` ends up one past `right`, and that crossing
     * is the whole reason the loop terminates. The first row is line 4 so the
     * learner has to count the list to get `right` = 11.
     */
    id: "m5.l1.b5",
    type: "trace_code",
    skillRefs: ["bsearch.core", "loops.while", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарламаны қағаздағыдай қадамдап орында, x = 30. Әр айналымда `mid` жаңа есептелген сәттегі `left`, `right`, `mid` мәндерін жаз. Соңғы жолда цикл неге тоқтағанын өзің көресің: `left` `right`-тан асып кетеді, яғни аралықта бірде-бір орын қалмайды.",
      ru: "Выполни программу пошагово, как на бумаге, при x = 30. Для каждого прохода запиши `left`, `right` и `mid` в тот момент, когда `mid` только что вычислен. В последней строке ты сам увидишь, почему цикл остановился: `left` перескакивает через `right`, то есть в интервале не остаётся ни одного места.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {4, 7, 12, 15, 19, 23, 28, 33, 39, 42, 50, 61};\n    int x = 30;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << pos;\n    return 0;\n}",
    steps: [
      { line: 10, vars: { left: "0", right: "11" } },
      { line: 13, vars: { left: "0", right: "11", mid: "5" } },
      { line: 13, vars: { left: "6", right: "11", mid: "8" } },
      { line: 13, vars: { left: "6", right: "7", mid: "6" } },
      { line: 13, vars: { left: "7", right: "7", mid: "7" } },
      { line: 23, vars: { left: "7", right: "6", pos: "-1" } },
    ],
  },
  {
    /*
     * The arithmetic of the month, asked about a number the concept block does
     * not answer. b1 states the million/twenty pair; 1000 has to be derived,
     * and halving 1000 by hand — 500, 250, 125, 63, 32, 16, 8, 4, 2, 1 — is ten
     * moves a fourteen-year-old can actually make.
     */
    id: "m5.l1.b6",
    type: "multiple_choice",
    skillRefs: ["bsearch.core", "perf.time_estimate"],
    sourceType: "product-authored",
    prompt: {
      kk: "Реттелген тізімде 1000 сан бар. Жартысын тастау әдісі ең нашар жағдайда неше салыстыру жасайды? Санды қағазда бірнеше рет екіге бөліп көр.",
      ru: "В отсортированном списке 1000 чисел. Сколько сравнений в худшем случае сделает метод отбрасывания половины? Подели число пополам на бумаге несколько раз.",
    },
    options: [
      { id: "o1", label: { kk: "Шамамен 1000 салыстыру", ru: "Примерно 1000 сравнений" } },
      { id: "o2", label: { kk: "Шамамен 500 салыстыру", ru: "Примерно 500 сравнений" } },
      { id: "o3", label: { kk: "Шамамен 100 салыстыру", ru: "Примерно 100 сравнений" } },
      { id: "o4", label: { kk: "Шамамен 10 салыстыру", ru: "Примерно 10 сравнений" } },
    ],
    correctOptionId: "o4",
    diagnosticMapping: {
      /* o3 is left unmapped on purpose: 100 is reachable as 1000 / 10, as a
         guess between the two extremes, and as a vague "much less than 1000".
         Three routes, so the pipeline should ask rather than tell. */
      o1: {
        failureClass: "linear_scan_assumed",
        justification:
          "1000 салыстыру — әр элементті бір рет қарау, яғни бірінен соң бірін іздеу. Бұл жауап оқушының жартысын тастау әдісін мүлде қолданбағанын, ескі тәсілді санағанын көрсетеді.",
      },
      o2: {
        failureClass: "halved_once_not_repeatedly",
        justification:
          "500 — бір қадамнан кейінгі аралықтың ҰЗЫНДЫҒЫ, қадам саны емес. Бұл жауап оқушының тізімді бір рет қана екіге бөліп, әрі қарай қайталауды тоқтатқанын білдіреді.",
      },
    },
  },
  {
    /*
     * «дайын кодты ... толықтыру көбірек беріледі», and the two holes are the
     * two lines the whole method lives in: how `mid` is computed from the
     * current boundaries, and how the left boundary moves past it.
     *
     * The program counts its own steps rather than reporting the value, so it
     * is nobody else's answer: b3 and b5 print a position, b9 prints a token.
     * Fifteen elements and four steps, which is 2**4 = 16 > 15 — the same
     * arithmetic b6 asks about, arrived at by running it.
     */
    id: "m5.l1.b7",
    type: "fill_blank",
    skillRefs: ["bsearch.core", "arith.integer_division", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама реттелген тізімнен 20 санын іздейді және іздеу неше қадам жасағанын шығарады. Екі орынды толықтыр: ортаңғы орынды ағымдағы `left` пен `right`-тан есептейтін өрнекті және `a[mid]` кіші болып шыққандағы сол шекараның жаңа мәнін. Толықтырып болған соң, қадам санын қағазда өзің де санап шық.",
      ru: "Программа ищет число 20 в отсортированном списке и выводит, сколько шагов на это ушло. Дополни два места: выражение, которое считает середину из текущих `left` и `right`, и новое значение левой границы, когда `a[mid]` оказался меньше. После этого посчитай число шагов на бумаге сам.",
    },
    template:
      "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {2, 6, 11, 17, 20, 25, 29, 34, 40, 46, 52, 58, 63, 70, 77};\n    int x = 20;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int steps = 0;\n    while (left <= right) {\n        int mid = ___;\n        steps = steps + 1;\n        if (a[mid] == x) {\n            break;\n        } else if (a[mid] < x) {\n            left = ___;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << steps;\n    return 0;\n}",
    blanks: [
      {
        id: "f1",
        answer: "left + (right - left) / 2",
        alternatives: ["(left + right) / 2", "(right + left) / 2", "left + (right - left) / 2;"],
      },
      { id: "f2", answer: "mid + 1" },
    ],
  },
  {
    /*
     * The repair slot. See the file header for why it flips the ORDER of the
     * list instead of the reporting: the presence/position swap would have put
     * b9's answer on screen next to b9.
     *
     * The edit is one comparison, and it cannot be made by pattern-matching —
     * `a[mid] < x` becomes `a[mid] > x` only if the learner re-derives which
     * half can still hold x when the big numbers are on the left. The cases are
     * built to kill the program that was NOT edited: with the list descending,
     * the unchanged comparison walks away from x and prints -1 for 74, 90, 12
     * and 9. `x = 50` is included precisely because it does NOT kill it — 50
     * sits on the first `mid`, so it is the one value the broken program still
     * gets right, and a learner who only tested that value learns why one case
     * is not a test.
     */
    id: "m5.l1.b8",
    type: "modify_code",
    skillRefs: ["bsearch.core", "compare.operators", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама өсу ретімен реттелген тізімнен x санын тауып, оның индексін шығарады, ал таппаса -1 шығарады. Енді тізім кему ретімен беріледі: ең үлкен сан — бірінші орында, ең кішісі — соңғысында, сандар қайталанбайды. Бағдарлама бұрынғыдай индексті тапсын. Бір ғана жол өзгереді: `a[mid]` мен x-ті салыстырғанда іздеген сан қай жақта қалатынын қайта ойлан. Енгізу: бірінші жолда n, екінші жолда n сан, үшінші жолда x.",
      ru: "Эта программа находит число x в списке, отсортированном по возрастанию, и выводит его индекс, а если числа нет — выводит -1. Теперь список приходит по убыванию: самое большое число стоит первым, самое маленькое — последним, числа не повторяются. Программа должна по-прежнему находить индекс. Меняется всего одна строка: заново подумай, с какой стороны остаётся искомое число при сравнении `a[mid]` с x. Ввод: в первой строке n, во второй — n чисел, в третьей — x.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << pos;\n    return 0;\n}",
    referenceSolution:
      "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] > x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << pos;\n    return 0;\n}",
    cases: [
      { input: "7\n90 74 61 50 38 25 12\n74", expectedOutput: "1" },
      { input: "7\n90 74 61 50 38 25 12\n40", expectedOutput: "-1" },
      /* First position and last position — the two the contract names by hand,
         and the two the unedited comparison walks away from. */
      { input: "7\n90 74 61 50 38 25 12\n90", expectedOutput: "0", hidden: true },
      { input: "7\n90 74 61 50 38 25 12\n12", expectedOutput: "6", hidden: true },
      /* The value that sits exactly on the first mid: passes even unedited. */
      { input: "7\n90 74 61 50 38 25 12\n50", expectedOutput: "3", hidden: true },
      /* Absent above every element and below every element: `right = n` instead
         of `n - 1` crashes on the second of these, and a program that always
         prints an index fails both. */
      { input: "7\n90 74 61 50 38 25 12\n95", expectedOutput: "-1", hidden: true },
      { input: "7\n90 74 61 50 38 25 12\n5", expectedOutput: "-1", hidden: true },
      /* Even length, so no element sits on the first mid at all. */
      { input: "8\n100 87 71 63 55 40 22 9\n9", expectedOutput: "7", hidden: true },
      { input: "8\n100 87 71 63 55 40 22 9\n55", expectedOutput: "4", hidden: true },
      /* One element, present and absent: `while left < right` never enters. */
      { input: "1\n5\n5", expectedOutput: "0", hidden: true },
      { input: "1\n5\n9", expectedOutput: "-1", hidden: true },
    ],
  },
  {
    /*
     * The month's own family, «тізімде сан бар ма», and this lesson's ONLY
     * blank editor — p.9 asks the first two weeks to lean the other way.
     *
     * `yes` / `no` are English tokens and both prompts name them, so a learner
     * on the Russian route is reading the same two words the Kazakh one is, and
     * neither is matching glyphs against a translated word.
     *
     * The wrong programs this case set is built against:
     *   - prints `yes` always → cases 2, 5, 6, 8, 10;
     *   - prints `no` always → cases 1, 3, 4, 7, 9;
     *   - checks only the ends of the list → case 1 (x sits strictly inside);
     *   - checks only the first `mid` → cases 3 and 4 (first and last position);
     *   - `while left < right`, which never examines a one-wide range → case 4
     *     (33 is reached only when left == right == 5) and case 7 (n = 1);
     *   - `right = n` instead of `n - 1` → case 6, where left climbs to n and
     *     `a[mid]` raises IndexError;
     *   - `left = mid` with no +1 → hangs, so every case times out.
     * The one wrong program NO case can kill is a linear scan: over the sizes a
     * case file can carry, `x in a` prints the same token just as fast. Of the
     * contract's three honest options that leaves option 2 — the prompt states
     * halving as ADVICE («Кеңес: …» / «Совет: …») and grades the answer, so
     * nobody is told a rule was checked that was not. Option 1 was tried first
     * and rejected: forcing the method into the output means demanding a step
     * count, which would mark a correct search with a different `mid` rounding
     * as wrong.
     */
    id: "m5.l1.b9",
    type: "write_code",
    skillRefs: ["bsearch.core", "loops.while", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны (1 ≤ n ≤ 200 000), екінші жолда өсу ретімен реттелген, қайталанбайтын n бүтін сан, үшінші жолда x саны беріледі. x тізімде бар болса `yes`, жоқ болса `no` деген ағылшын сөзін шығар (басқа ештеңе шығармау керек). Кеңес: тізім реттелген, сондықтан әр қадамда жартысын тастайтын іздеуді жаз — 200 000 элементті бірінен соң бірін қарау тым баяу.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 200 000), во второй — n различных целых чисел, отсортированных по возрастанию, в третьей — число x. Выведи английское слово `yes`, если x есть в списке, и `no`, если его нет (больше ничего выводить не нужно). Совет: список отсортирован, поэтому пиши поиск с отбрасыванием половины — просматривать 200 000 элементов подряд слишком медленно.",
    },
    referenceSolution:
      "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (pos == -1) {\n        cout << \"no\";\n    } else {\n        cout << \"yes\";\n    }\n    return 0;\n}",
    cases: [
      { input: "6\n2 5 9 14 20 33\n14", expectedOutput: "yes" },
      { input: "6\n2 5 9 14 20 33\n7", expectedOutput: "no" },
      { input: "6\n2 5 9 14 20 33\n2", expectedOutput: "yes", hidden: true },
      { input: "6\n2 5 9 14 20 33\n33", expectedOutput: "yes", hidden: true },
      { input: "6\n2 5 9 14 20 33\n1", expectedOutput: "no", hidden: true },
      { input: "6\n2 5 9 14 20 33\n40", expectedOutput: "no", hidden: true },
      { input: "1\n8\n8", expectedOutput: "yes", hidden: true },
      { input: "1\n8\n3", expectedOutput: "no", hidden: true },
      { input: "7\n4 11 19 26 34 41 58\n41", expectedOutput: "yes", hidden: true },
      { input: "7\n4 11 19 26 34 41 58\n30", expectedOutput: "no", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for b9 — same problem, same cases, same tokens.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ», and p.9 says the same thing about this month's first two weeks.
     *
     * The starting program is b7's — the step counter the support learner has
     * just completed themselves — and that identity is deliberate: the contract
     * allows a modify_code to start from a program the learner has ALREADY
     * finished, and forbids it starting from one they are about to be asked
     * for. The search loop is handed over intact and correct; what has to be
     * rebuilt is where the data comes from and what gets reported, which is the
     * part b9 grades on the other routes.
     *
     * The completed program is byte-identical to b9's reference, which is what a
     * support twin IS: the same problem, reached by editing a program the
     * learner has already finished rather than from an empty editor.
     */
    id: "m5.l1.b9s",
    type: "modify_code",
    skillRefs: ["bsearch.core", "loops.while", "io.read"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бұл бағдарламаны сен осы сабақта өзің толықтырдың: ол дайын тізімнен 20 санын іздеп, қадам санын шығарады. Екі нәрсені өзгерт. Біріншіден, тізім мен ізделетін сан пернетақтадан оқылсын: бірінші жолда n, екінші жолда n сан (өсу ретімен, қайталанбайды), үшінші жолда x. Екіншіден, қадам санының орнына x табылса `yes`, табылмаса `no` деген ағылшын сөзі шықсын. Іздеу циклін өзгертудің қажеті жоқ — ол дұрыс жұмыс істеп тұр.",
      ru: "Эту программу ты сам дополнил на этом уроке: она ищет число 20 в готовом списке и выводит количество шагов. Измени две вещи. Во-первых, пусть список и искомое число читаются с клавиатуры: в первой строке n, во второй — n чисел (по возрастанию, без повторов), в третьей — x. Во-вторых, вместо количества шагов пусть выводится английское слово `yes`, если x найден, и `no`, если нет. Цикл поиска менять не нужно — он работает правильно.",
    },
    code: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> a = {2, 6, 11, 17, 20, 25, 29, 34, 40, 46, 52, 58, 63, 70, 77};\n    int x = 20;\n    int n = a.size();\n    int left = 0;\n    int right = n - 1;\n    int steps = 0;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        steps = steps + 1;\n        if (a[mid] == x) {\n            break;\n        } else if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    cout << steps;\n    return 0;\n}",
    referenceSolution:
      "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for (int i = 0; i < n; i++) {\n        cin >> a[i];\n    }\n    int x;\n    cin >> x;\n    int left = 0;\n    int right = n - 1;\n    int pos = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (a[mid] == x) {\n            pos = mid;\n            break;\n        } else if (a[mid] < x) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n    if (pos == -1) {\n        cout << \"no\";\n    } else {\n        cout << \"yes\";\n    }\n    return 0;\n}",
    cases: [
      { input: "6\n2 5 9 14 20 33\n14", expectedOutput: "yes" },
      { input: "6\n2 5 9 14 20 33\n7", expectedOutput: "no" },
      { input: "6\n2 5 9 14 20 33\n2", expectedOutput: "yes", hidden: true },
      { input: "6\n2 5 9 14 20 33\n33", expectedOutput: "yes", hidden: true },
      { input: "6\n2 5 9 14 20 33\n40", expectedOutput: "no", hidden: true },
      { input: "1\n8\n8", expectedOutput: "yes", hidden: true },
      { input: "1\n8\n3", expectedOutput: "no", hidden: true },
      { input: "7\n4 11 19 26 34 41 58\n41", expectedOutput: "yes", hidden: true },
    ],
  },
];
