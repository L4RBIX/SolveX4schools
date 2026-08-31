import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан — lesson 4, «Тізім және индекс» (8 minutes).
 *
 * PDF p.7. Two clauses of October drive this lesson and neither is optional:
 *
 *   «…тізімге мәндер жинау, элементті индекс арқылы алу…»
 *   «Бөлек тренажер индекстерді көзге көрінетін етеді.»
 *
 * The second is a *separate trainer*, so `m2.l4.b2` is a `visual_simulation`
 * and not a task — the learner looks at the boxes and their numbers before
 * anybody asks them to compute with them. The programme also names
 * «индекстің шекарадан шығуы» among October's four typical errors, which is
 * what `m2.l4.b5` puts on screen as a program that actually crashes.
 *
 * Everything here is written with October's Python only: list literal, `[i]`,
 * `len`, `list(map(int, input().split()))`. No `sorted`, no negative-index
 * shortcut in any solution — `-1` appears exactly once, as a wrong answer to a
 * question about counting from the start.
 */
export const M2_L4: LessonBlock[] = [
  {
    id: "m2.l4.b1",
    type: "concept",
    skillRefs: ["lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Тізім — нөмірленген қораптар қатары",
      ru: "Список — ряд пронумерованных ячеек",
    },
    body: {
      kk: "Тізім — бір атпен сақталған қораптар қатары. Әр қорапта бір мән жатыр, ал әр қораптың өз нөмірі (индексі) бар. Санау бірден емес, нөлден басталады: бірінші қорап — 0, екіншісі — 1, үшіншісі — 2. `a[i]` жазуы i нөмірлі қораптағы мәнді береді. `len(a)` — қораптардың саны; санау нөлден басталғандықтан соңғы қораптың нөмірі `len(a) - 1` болады.",
      ru: "Список — это ряд ячеек, которые хранятся под одним именем. В каждой ячейке лежит одно значение, и у каждой ячейки есть свой номер — индекс. Счёт идёт не с единицы, а с нуля: первая ячейка — 0, вторая — 1, третья — 2. Запись `a[i]` даёт значение из ячейки с номером i. `len(a)` — это количество ячеек; так как счёт начинается с нуля, номер последней ячейки равен `len(a) - 1`.",
    },
    code: "a = [7, 3, 9, 5]\nprint(a[0])\nprint(a[2])\nprint(len(a))",
  },
  {
    /*
     * The trainer the programme asks for by name. It is deliberately NOT an
     * attempt block: «көзге көрінетін етеді» is about seeing the numbering, and
     * scoring a learner for looking at it would produce evidence about nothing.
     * The list here is the same four values as the concept block above, so the
     * boxes on screen are the boxes they have just read about.
     */
    id: "m2.l4.b2",
    type: "visual_simulation",
    skillRefs: ["lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    simulation: "loop_trace",
    prompt: {
      kk: "Қораптарды бірінен соң бірін ашып көр. Жоғарыда — мән, төменде — сол қораптың индексі. Индекс 0-ден `len(a) - 1`-ге дейін жүреді: соңғы қорапта тоқта да, оның нөмірін дауыстап айт.",
      ru: "Открывай ячейки одну за другой. Сверху — значение, снизу — индекс этой ячейки. Индекс идёт от 0 до `len(a) - 1`: остановись на последней ячейке и назови её номер вслух.",
    },
    config: { list: [7, 3, 9, 5], highlight: "index", showLength: true },
  },
  {
    id: "m2.l4.b3",
    type: "prediction",
    skillRefs: ["lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама нені шығарады? Қораптардың нөмірін нөлден бастап санап шық.",
      ru: "Что выведет программа? Посчитай номера ячеек, начиная с нуля.",
    },
    code: "a = [4, 8, 15, 16]\nprint(a[0], a[2], a[len(a) - 1])",
    answer: "4 15 16",
    options: ["4 15 16", "4 8 15", "4 8 16", "8 15 16"],
    diagnosticMapping: {
      /*
       * «4 8 15» is the whole triple shifted one box to the left: a[2] read as
       * "the second element" and a[3] as "the third". Nothing else lands on
       * exactly that combination, so the attribution is safe. «4 8 16» is left
       * unmapped on purpose — it can come from the same shift applied to one
       * term only, or from a plain miscount, and two causes means the engine
       * should ask instead of tell.
       */
      "4 8 15": {
        failureClass: "one_based_index_assumption",
        justification:
          "Бұл жауап әр индексті бірден бастап санағанда ғана шығады: a[2] — екінші элемент, a[3] — үшінші элемент деп оқылған. Үш мәннің үшеуі де бір қорапқа солға жылжыған.",
      },
    },
  },
  {
    id: "m2.l4.b4",
    type: "multiple_choice",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "`a` тізімінде `len(a)` элемент бар. Индекстер басынан бастап 0, 1, 2, … деп саналады. Соңғы элементтің индексі неге тең?",
      ru: "В списке `a` ровно `len(a)` элементов. Индексы считаются от начала: 0, 1, 2, … Чему равен индекс последнего элемента?",
    },
    options: [
      { id: "o1", label: { kk: "len(a)", ru: "len(a)" } },
      { id: "o2", label: { kk: "len(a) - 1", ru: "len(a) - 1" } },
      { id: "o3", label: { kk: "len(a) + 1", ru: "len(a) + 1" } },
      { id: "o4", label: { kk: "-1", ru: "-1" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      /*
       * o4 (`-1`) gets no mapping, and that is the whole reason it is here. In
       * Python `a[-1]` really does reach the last element; a learner who picks
       * it may understand indexing perfectly and simply answer a different
       * question than the one asked (the number counted FROM THE START).
       * Telling that learner they have a misconception would be false.
       */
      o1: {
        failureClass: "off_by_one_last_index",
        justification:
          "`len(a)` — элементтердің саны, ал нөлден санағанда соңғы нөмір одан бір кем. Дәл осы бір қадам асып кету `a[len(a)]` жазылғанда IndexError береді, сондықтан бұл таңдау шекарадан шығу қатесін көрсетеді.",
      },
    },
  },
  {
    /*
     * «индекстің шекарадан шығуы» — one of October's four named typical errors
     * (PDF p.7). The two programs differ the loudest way there is: one prints a
     * number, the other prints nothing at all and stops with IndexError.
     * symptomInput is declared because the fallback probe feeds a single
     * number, and on a single number the broken program still crashes but the
     * fixed one prints — that would pass, yet it would not be the list the
     * lesson is about.
     *
     * No diagnosticMapping: with two lines, choosing line 1 could mean "I think
     * the reading line is wrong" or "I think the list came out one element
     * short". Two causes, so the engine asks.
     */
    id: "m2.l4.b5",
    type: "find_bug",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бағдарлама тізімнің соңғы элементін шығаруы керек. Бірақ `10 20 30` енгізгенде ол ештеңе шығармай, IndexError қатесімен тоқтайды. Қай жол кінәлі және неге?",
      ru: "Программа должна выводить последний элемент списка. Но при вводе `10 20 30` она ничего не выводит и останавливается с ошибкой IndexError. Какая строка виновата и почему?",
    },
    code: "a = list(map(int, input().split()))\nprint(a[len(a)])",
    buggyLine: 2,
    symptomInput: "10 20 30",
    fixedCode: "a = list(map(int, input().split()))\nprint(a[len(a) - 1])",
  },
  {
    id: "m2.l4.b6",
    type: "fill_blank",
    skillRefs: ["lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі, олардың саны тақ. Дәл ортадағы элементті шығаратындай толықтыр. Мысалы `2 7 4` үшін жауап 7, ал `1 2 3 4 5` үшін 3.",
      ru: "В одной строке через пробел даны целые числа, их количество нечётное. Дополни программу так, чтобы она вывела элемент ровно из середины. Например, для `2 7 4` ответ 7, а для `1 2 3 4 5` — 3.",
    },
    template: "a = list(map(int, input().split()))\nm = len(a) ___ 2\nprint(a[___])",
    blanks: [
      { id: "f1", answer: "//" },
      { id: "f2", answer: "m", alternatives: ["len(a) // 2"] },
    ],
  },
  {
    id: "m2.l4.b7",
    type: "write_code",
    skillRefs: ["lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген бүтін сандар беріледі. Екінші жолда бір ғана бүтін сан k беріледі. Индекстер нөлден басталатынын ескеріп, k индексіндегі элементті шығар. k әрқашан дұрыс мән: ол 0-ден бастап, элементтер санынан бір кем санға дейін болады.",
      ru: "В первой строке через пробел даны целые числа. Во второй строке — одно целое число k. Помня, что индексы начинаются с нуля, выведи элемент с индексом k. Число k всегда корректно: от 0 до количества элементов минус один.",
    },
    referenceSolution: "a = list(map(int, input().split()))\nk = int(input())\nprint(a[k])",
    /*
     * k = 0 and k = n-1 are both here because they are the two ends the lesson
     * is about: `a[k - 1]` survives every middle case and dies on k = 0, and
     * `a[k + 1]` survives every middle case and crashes on k = n-1. The
     * single-element list is both ends at once. «9 9 9 2 9» has duplicates but
     * a distinct target, so a solution that returns any old matching value
     * fails it.
     */
    cases: [
      { input: "5 8 13 21\n1", expectedOutput: "8" },
      { input: "5 8 13 21\n0", expectedOutput: "5" },
      { input: "5 8 13 21\n3", expectedOutput: "21", hidden: true },
      { input: "7\n0", expectedOutput: "7", hidden: true },
      { input: "9 9 9 2 9\n3", expectedOutput: "2", hidden: true },
      { input: "-3 10 0 6\n2", expectedOutput: "0", hidden: true },
      { input: "1 2 3 4 5 6 7 8 9 10\n9", expectedOutput: "10", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m2.l4.b8, not an extra block on top of it.
     * PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
     * азырақ». Same problem, same input format, same output — the two indices
     * are the only thing left to think about, and they are exactly what the
     * lesson teaches.
     */
    id: "m2.l4.b8s",
    type: "fill_blank",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Бірінші және соңғы элементті бос орынмен бөліп, бір жолға шығару керек. Код дайын — тек екі индексті қой.",
      ru: "В одной строке через пробел даны целые числа (хотя бы одно). Нужно вывести в одну строку первый и последний элементы, разделив их пробелом. Код готов — расставь только два индекса.",
    },
    template: "a = list(map(int, input().split()))\nprint(a[___], a[len(a) ___ 1])",
    blanks: [
      { id: "f1", answer: "0" },
      { id: "f2", answer: "-" },
    ],
  },
  {
    id: "m2.l4.b8",
    type: "write_code",
    skillRefs: ["lists.index", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу). Тізімнің бірінші және соңғы элементін бос орынмен бөліп, бір жолға шығар.",
      ru: "В одной строке через пробел даны целые числа (хотя бы одно). Выведи в одну строку первый и последний элементы списка, разделив их пробелом.",
    },
    referenceSolution: "a = list(map(int, input().split()))\nprint(a[0], a[len(a) - 1])",
    /*
     * The single-element list is hidden on purpose: it is the case where first
     * and last are the same box, and a learner who wrote `a[len(a)]` or `a[1]`
     * discovers it there rather than on the visible sample.
     */
    cases: [
      { input: "5 8 13 21", expectedOutput: "5 21" },
      { input: "10 20", expectedOutput: "10 20" },
      { input: "7", expectedOutput: "7 7", hidden: true },
      { input: "-4 0 9 -1", expectedOutput: "-4 -1", hidden: true },
      { input: "3 3 3", expectedOutput: "3 3", hidden: true },
      { input: "1 2 3 4 5 6", expectedOutput: "1 6", hidden: true },
    ],
  },
];
