import type { LessonBlock } from "../../types";

/**
 * m5.l6 · «Шекарадағы қателер» / «Ошибки на границах». 9 minutes.
 *
 * Skills: `bsearch.boundary`, `debug.boundary`.
 *
 * PDF p.9 asks for this lesson twice. January's explanation paragraph says
 * where the month's mistakes live —
 *
 *   «Шекарада қателесу оңай болғандықтан, алғашқы екі аптада дайын кодты оқу,
 *    түзету және толықтыру көбірек беріледі»
 *
 * — and the practice paragraph then names boundary repair as a family of its
 * own: «Қосымша - іздеу шекараларындағы қателерді түзету». So this lesson is
 * the first clause taken literally: **there is no blank editor in it.** Ten
 * cards, and every one of them reads, traces, completes or repairs a program
 * that is already on the screen. It is the January counterpart of October's
 * `m2.l9`, and it takes the next free number because the stub had five lessons;
 * it is taught third, after `m5.l2`, the way September did it with `m1.l10`.
 *
 * ## Five decisions, taken once, so no block re-litigates them
 *
 * 1. **The non-terminating error is never a `find_bug`.** `check-blocks` and
 *    `content-execution.test.ts` execute both halves of every `find_bug`, and a
 *    program that hangs is killed by the timeout on every probe. October settled
 *    this in `m2.l3` and `m2.l9`; nothing has changed. So error #1 is shown
 *    where a hang can be shown honestly — in `b3`, as a hand trace that is
 *    explicitly capped at ten steps, and in `b8`, where two of the four options
 *    are hangs the learner must recognise without running anything. All three
 *    `find_bug` blocks terminate on every input.
 *
 * 2. **`b2` and `b3` are the same program apart from one token.** The mandated
 *    animation («Міндетті визуалды анимация … оқушы іздеу шекараларының қалай
 *    жақындағанын көреді») does not exist yet, and the month file records that
 *    honestly. The substitute is not a paragraph saying "this one loops
 *    forever": it is two traces of the same eleven lines, one of which converges
 *    on step three and one of which stops changing on step seven. The learner
 *    cannot write a row that differs from the row above it, and that is what
 *    "never terminates" means.
 *
 * 3. **No card shows a repaired program that a later card then asks for.** The
 *    lesson deliberately uses five different search skeletons — half-open
 *    (`b2`, `b3`, `b7`), three-branch closed with a recorded answer (`b4`,
 *    `b5`), two-branch closed with no recorded answer (`b6`), record-and-narrow
 *    to the right (`b9`), record-and-narrow to the left (`b10`) — so that the
 *    fix for one is never the body of another. `b8` asks about a fifth shape,
 *    the one whose `mid` rounds up, precisely because the safe pair for the two
 *    shapes already on screen is already on screen.
 *
 * 4. **`b7` is the only card where the loop is correct.** It is the month's
 *    hardest idea in the smallest form: the boundaries are right, the interval
 *    shrinks, the answer is never discarded — and the program still lies,
 *    because `left` at exit answers «қай орынға кірістіру керек», not «x қай
 *    жерде тұр». A learner who leaves this lesson believing "boundary bug = a
 *    wrong ±1" has learned half of it.
 *
 * 5. **The support twin is `b7s`, not a twin of the repair.** Support is
 *    substitution, not subtraction (p.6), and what support loses here is the one
 *    card that asks a learner to invent a witness from nothing. It gets the same
 *    program with the list and `x` written in, and predicts what it prints —
 *    reading ready code, which is exactly what the January paragraph asks for.
 *    Every repair block stays on the support route, because repair is the thing
 *    the programme says support should get MORE of.
 *
 * ## What `m5.l1` and `m5.l2` already spent, and what is left for this lesson
 *
 * Lesson 2 is «Шекараны жылжыту» and it has already put two of the four errors
 * on the screen as programs: `m5.l2.b4` is a closed interval whose `right = mid`
 * never shrinks (shipped behind a `steps < 40` cap), and `m5.l2.b5` is the
 * half-open form losing its answer to `right = mid - 1`. Re-running either here
 * would be the same card twice with a different list in it. So this lesson takes
 * each error at a place lesson 2 did not reach: error #2 in the `a[mid] == x`
 * branch, where the move that discards the answer is textually identical to the
 * move that is correct one branch below it; error #1 only as a trace and as two
 * of `b8`'s four options, never again as a program to repair. Errors #3 and #4
 * are new to the month entirely.
 *
 * `b7` is the exception and it is deliberate: `m5.l2.b7` has already told the
 * learner what `left` holds when this loop ends. That is the point. Knowing the
 * sentence is not the same as being able to build the input that catches a
 * program relying on it, and this card asks for the second thing.
 *
 * Every `find_bug` declares `symptomInput`: all three bugs need a list and a
 * second line, and the checker's fallback probe is a spread of single numbers —
 * it would report "the two programs behave identically" for every one of them.
 *
 * `bisect` is not imported here or anywhere in January. The programme never
 * teaches it, and a lesson about search boundaries whose programs have no
 * boundaries in them would teach nothing.
 */

const P = 9;

export const M5_L6: LessonBlock[] = [
  {
    /*
     * The four errors, each in two lines, each with its tell-tale SHAPE in
     * code — "off-by-one" is not something a learner recognises, but the pair
     * `while left < right` above and `left = mid` below is.
     *
     * The opening pair of conditions is the whole lesson compressed: the
     * interval must really shrink, and the answer must stay inside it. Every
     * later card is one of those two being broken. Error #3 is described
     * without naming the witness list, because b5 is the card that asks for it.
     */
    id: "m5.l6.b1",
    type: "concept",
    skillRefs: ["bsearch.boundary", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Шекарадағы төрт қате",
      ru: "Четыре ошибки на границе",
    },
    body: {
      kk: "Екіге бөліп іздеудегі қате әрдайым дерлік бір жерде — шекараны жылжытатын жолда — тығылады. Іздеу дұрыс болу үшін екі шарт бір мезгілде орындалуы керек: **аралық әр қадамда шынымен қысқаруы тиіс** және **жауап аралықтың ішінен шығып қалмауы тиіс**. Осы екеуінің біреуі бұзылса, төрт таныс қатенің бірі шығады.\n\n1. **Цикл ешқашан тоқтамайды.** Шарт пен жылжу бір-біріне сай емес: жоғарыда `while left < right` тұр, ал денеде `left = mid` жазылған. Аралықта екі сан қалғанда `mid` сол жақтағыға тең болады да, `left` орнынан қозғалмайды.\n\n2. **Жауап аттап кетеді.** `mid` дәл жауаптың өзі болуы мүмкін еді, ал жол оны аралықтан лақтырып тастайды: `right = mid - 1` жазылған, ал керегі `right = mid` болатын. Бағдарлама тоқтайды, бірақ жауап оның аралығында қалмайды.\n\n3. **Индекс пен мән шатасады.** Салыстыруда `a[mid]` емес, `mid` тұр. Мұндай бағдарлама әр санның мәні өз индексіне тең болып қалған тізімде дұрыс жұмыс істейді де, сандар үлкейген бойда бірден бұзылады.\n\n4. **Цикл дұрыс бітеді, бірақ қате айнымалы шығарылады.** Цикл біткен сәтте `left`, `right` және `mid` үш түрлі мәнде тұрады. Жауап солардың қайсысында екенін білу керек, әйтпесе бағдарлама дәл бір қадамға жаңылысады.\n\nБұл төртеуін бір-бірінен ажырататын сенімді әдіс біреу ғана: бағдарламаны қағазда қадамдап орындап, әр қадамда `left`, `right` және `mid` мәндерін жазып отыру.",
      ru: "Ошибка бинарного поиска почти всегда прячется в одном месте — в строке, которая сдвигает границу. Чтобы поиск был верным, одновременно должны выполняться два условия: **интервал на каждом шаге действительно сокращается** и **ответ не выпадает за пределы интервала**. Стоит нарушиться одному из них — получается одна из четырёх знакомых ошибок.\n\n1. **Цикл никогда не останавливается.** Условие и сдвиг не согласованы: сверху стоит `while left < right`, а в теле написано `left = mid`. Когда в интервале остаются два числа, `mid` оказывается равен левому, и `left` не сдвигается с места.\n\n2. **Ответ проскакивает мимо.** `mid` вполне мог оказаться самим ответом, а строка выбрасывает его из интервала: написано `right = mid - 1`, тогда как нужно было `right = mid`. Программа останавливается, но ответа в её интервале уже нет.\n\n3. **Путаются индекс и значение.** В сравнении стоит `mid`, а не `a[mid]`. Такая программа работает верно на списке, где значение каждого числа случайно совпало с его индексом, и ломается сразу же, как только числа становятся крупнее.\n\n4. **Цикл заканчивается правильно, но выводится не та переменная.** В момент выхода `left`, `right` и `mid` хранят три разных значения. Нужно знать, в какой из них лежит ответ, иначе программа промахнётся ровно на один шаг.\n\nОтличить эти четыре ошибки друг от друга надёжно помогает только одно: выполнить программу по шагам на бумаге, записывая на каждом шаге `left`, `right` и `mid`.",
    },
    code:
      "a = [1, 4, 4, 7, 9]\nx = 7\nleft = 0\nright = len(a) - 1\nmid = 0\n\n# 1\nwhile left < right:\n    mid = (left + right) // 2\n    if a[mid] < x:\n        left = mid\n\n# 2\nif a[mid] >= x:\n    right = mid - 1\n\n# 3\nif mid < x:\n    left = mid + 1\n\n# 4\nprint(right)",
  },
  {
    /*
     * The correct search, traced first, so the tool is in hand before it is
     * used on something broken.
     *
     * Six elements and eight rows: three iterations is a hand trace, seven is
     * bookkeeping. What the learner should be able to say at the end is not
     * "it printed 3" but "left and right met, and every number I dropped was
     * one I had already proved could not be the answer" — which is the exact
     * question January's monthly check asks out loud.
     */
    id: "m5.l6.b2",
    type: "trace_code",
    skillRefs: ["bsearch.boundary", "bsearch.core", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама реттелген тізімде `x` санын қай орынға кірістіру керек екенін табады: `x`-тен кіші сандар нешеу — сол сан шығады. Оны қағаздағыдай қадамдап орында: әр қадамда `left`, `right` және `mid` нешеге тең екенін жаз. Соңында өзіңе сұрақ қой: `left` пен `right` неге дәл бір орында түйісті және аралықтан шығарылған әр сан неге жауап бола алмайтын еді?",
      ru: "Эта программа находит, на какое место в упорядоченном списке нужно вставить число `x`: она выводит, сколько чисел меньше `x`. Выполни её по шагам, как на бумаге: на каждом шаге запиши, чему равны `left`, `right` и `mid`. В конце ответь себе на два вопроса: почему `left` и `right` сошлись ровно в одной точке и почему каждое выброшенное из интервала число заведомо не могло быть ответом?",
    },
    code:
      "a = [3, 6, 9, 12, 15, 18]\nx = 12\nleft = 0\nright = len(a)\nwhile left < right:\n    mid = (left + right) // 2\n    if a[mid] < x:\n        left = mid + 1\n    else:\n        right = mid\nprint(left)",
    steps: [
      { line: 4, vars: { left: "0", right: "6" } },
      { line: 6, vars: { left: "0", right: "6", mid: "3" } },
      { line: 10, vars: { left: "0", right: "3", mid: "3" } },
      { line: 6, vars: { left: "0", right: "3", mid: "1" } },
      { line: 8, vars: { left: "2", right: "3", mid: "1" } },
      { line: 6, vars: { left: "2", right: "3", mid: "2" } },
      { line: 8, vars: { left: "3", right: "3", mid: "2" } },
      { line: 11, vars: { left: "3", right: "3", mid: "2" } },
    ],
  },
  {
    /*
     * Error #1, and the only honest way to ship a hang: a trace with a declared
     * step cap, stated in both prompts.
     *
     * The last four rows carry identical values, and writing the same three
     * numbers four times is not busywork — it IS the discovery, because the
     * learner cannot produce a row that differs from the one above it. Six of
     * the ten rows sit on a line that changes nothing. A hang has no
     * interesting steps; that is the point, and it is why this is a trace and
     * not a paragraph.
     */
    id: "m5.l6.b3",
    type: "trace_code",
    skillRefs: ["bsearch.boundary", "debug.boundary", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Дәл сол бағдарлама, тек 8-жолда `left = mid + 1` емес, `left = mid` жазылған. Оны да қадамдап орында, бірақ **он қадамнан кейін өзіңді тоқтат**: бұл цикл өз бетінше ешқашан бітпейді, сондықтан 11-жолға жетпейсің. Мәндер нақты нешінші қадамнан бастап қайталана бастайды және `left` неге енді қозғалмайды?",
      ru: "Та же программа, но в строке 8 написано `left = mid`, а не `left = mid + 1`. Выполни её по шагам, но **останови себя после десяти шагов**: сам по себе этот цикл не закончится никогда, поэтому до строки 11 ты не дойдёшь. С какого именно шага значения начинают повторяться и почему `left` больше не сдвигается?",
    },
    code:
      "a = [3, 6, 9, 12, 15, 18]\nx = 12\nleft = 0\nright = len(a)\nwhile left < right:\n    mid = (left + right) // 2\n    if a[mid] < x:\n        left = mid\n    else:\n        right = mid\nprint(left)",
    steps: [
      { line: 4, vars: { left: "0", right: "6" } },
      { line: 6, vars: { left: "0", right: "6", mid: "3" } },
      { line: 10, vars: { left: "0", right: "3", mid: "3" } },
      { line: 6, vars: { left: "0", right: "3", mid: "1" } },
      { line: 8, vars: { left: "1", right: "3", mid: "1" } },
      { line: 6, vars: { left: "1", right: "3", mid: "2" } },
      { line: 8, vars: { left: "2", right: "3", mid: "2" } },
      { line: 6, vars: { left: "2", right: "3", mid: "2" } },
      { line: 8, vars: { left: "2", right: "3", mid: "2" } },
      { line: 6, vars: { left: "2", right: "3", mid: "2" } },
    ],
  },
  {
    /*
     * Error #2 — «жауап аттап кетеді».
     *
     * The input is the exercise. On `2 4 9` the broken program prints the right
     * answer and on `2 4 4 4 9` it does not: the bug is invisible until the
     * list contains the same number twice, which is the sentence b1 made and
     * this card makes the learner feel. Line 10 has exactly one repair
     * (`right = mid - 1`); shortening the loop or changing line 8 leaves it
     * reporting the last occurrence, so "which line" has one answer.
     */
    id: "m5.l6.b4",
    type: "find_bug",
    skillRefs: ["bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама реттелген тізімде `x` санының БІРІНШІ кездескен орнының индексін шығаруы керек (индекс нөлден басталады), ал `x` тізімде мүлде болмаса — -1. Бірінші жолда тізім, екінші жолда `x` беріледі. `2 4 9` және `4` үшін ол дұрыс жауап — 1 береді, ал `2 4 4 4 9` және `4` үшін 1-дің орнына 3 шығарады. Қате қай жолда?",
      ru: "Программа должна выводить индекс ПЕРВОГО вхождения числа `x` в упорядоченный список (индексы начинаются с нуля), а если `x` в списке нет вообще — -1. В первой строке дан список, во второй — `x`. Для `2 4 9` и `4` она даёт верный ответ — 1, а для `2 4 4 4 9` и `4` выводит 3 вместо 1. В какой строке ошибка?",
    },
    code:
      "a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nans = -1\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] == x:\n        ans = mid\n        left = mid + 1\n    elif a[mid] < x:\n        left = mid + 1\n    else:\n        right = mid - 1\nprint(ans)",
    buggyLine: 10,
    symptomInput: "2 4 4 4 9\n4",
    fixedCode:
      "a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nans = -1\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] == x:\n        ans = mid\n        right = mid - 1\n    elif a[mid] < x:\n        left = mid + 1\n    else:\n        right = mid - 1\nprint(ans)",
    diagnosticMapping: {
      "12": {
        failureClass: "right_move_wrong_branch",
        justification:
          "12-жол `a[mid] < x` тармағында тұр: онда `mid`-тегі және одан солдағы сандардың бәрі `x`-тен кіші, сондықтан сол жақта жоғалатын жауап жоқ. Бұл таңдау оқушының `left = mid + 1` деген мәтінді дұрыс тапқанын, бірақ ол қай шарттың ішінде тұрғанын тексермегенін көрсетеді.",
      },
      "5": {
        failureClass: "blamed_a_value_that_was_overwritten",
        justification:
          "Осы енгізуде бағдарлама 3 шығарады, ал 5-жол `ans`-қа -1 береді — бұл мән басып шығарылғанға дейін екі рет ауыстырылған. Басып шығарылмаған бастапқы мән қате жауапты тудыра алмайды, сондықтан бұл таңдау трассалаудың орнына таныс үлгіні болжаудан шыққан.",
      },
    },
  },
  {
    /*
     * Error #3 — «индекс пен мән шатасады». One line, and only one: line 11
     * compares the INDEX with the value while lines 8 and 14 compare the
     * element with it.
     *
     * Two inputs are quoted in the prompt and they are the whole diagnosis:
     * on `0 1 2 3 4` every value equals its index, so the broken program is
     * indistinguishable from the correct one, and on `10 20 30 40 50` it
     * collapses. A learner who can say why those two lists differ has found
     * the bug without reading line 11 at all.
     *
     * The interval still shrinks on every branch, so this program terminates
     * on every input — which the checker requires and which lets a learner run
     * it.
     */
    id: "m5.l6.b5",
    type: "find_bug",
    skillRefs: ["bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама реттелген тізімде `x` саны бар-жоғын тексеріп, `yes` немесе `no` сөзін шығаруы керек. Бірінші жолда тізім, екінші жолда `x`. `0 1 2 3 4` және `2` үшін ол дұрыс `yes` береді, ал `10 20 30 40 50` және `20` үшін `yes`-тің орнына `no` шығарады. Қате қай жолда?",
      ru: "Программа должна проверить, есть ли число `x` в упорядоченном списке, и вывести слово `yes` или `no`. В первой строке список, во второй — `x`. Для `0 1 2 3 4` и `2` она даёт верное `yes`, а для `10 20 30 40 50` и `20` вместо `yes` выводит `no`. В какой строке ошибка?",
    },
    code:
      'a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nfound = 0\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] == x:\n        found = 1\n        right = mid - 1\n    elif mid < x:\n        left = mid + 1\n    else:\n        right = mid - 1\nif found == 1:\n    print("yes")\nelse:\n    print("no")',
    buggyLine: 11,
    symptomInput: "10 20 30 40 50\n20",
    fixedCode:
      'a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nfound = 0\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] == x:\n        found = 1\n        right = mid - 1\n    elif a[mid] < x:\n        left = mid + 1\n    else:\n        right = mid - 1\nif found == 1:\n    print("yes")\nelse:\n    print("no")',
    diagnosticMapping: {
      "9": {
        failureClass: "blamed_a_line_that_never_ran",
        justification:
          "Осы енгізуде `mid` тек 2, 3, 4 мәндерін алады, ал сол қадамдардағы `a[mid]` — 30, 40, 50: бірде-бірі 20-ға тең емес. Демек 9-жол бір рет те орындалмайды, ал орындалмаған жол `no` деген жауапты тудыра алмайды — бұл таңдау бағдарламаның қадамдап тексерілмегенін көрсетеді.",
      },
    },
  },
  {
    /*
     * Error #4 — «цикл дұрыс бітеді, бірақ қате айнымалы шығарылады». The loop
     * is correct: the interval shrinks, nothing is discarded that could have
     * been the answer, and at exit `right` is `left - 1`. Only line 11 is wrong.
     *
     * The symptom input has x ABSENT from the list on purpose. With
     * `2 4 6 8` and x = 5, changing line 7's `<=` to `<` — the other repair a
     * learner reaches for — leaves the output at 3, so the trap of "I changed
     * something and the sample passed" is closed. On a symptom where x is
     * present that mis-repair prints the right number by coincidence, which is
     * how a task teaches the wrong rule.
     *
     * The answer is a COUNT rather than `left` itself, and that is not
     * decoration. `m5.l2.b7` already has the learner turn a yes/no search into
     * one that prints `left` — so a block whose repair is the line `print(left)`
     * would be answerable from memory of a task they finished two lessons ago,
     * without ever asking what `right` holds at exit. Wrapping the answer in
     * `len(a) - ...` keeps the defect (the wrong one of two variables) and
     * removes the recall shortcut.
     */
    id: "m5.l6.b6",
    type: "find_bug",
    skillRefs: ["bsearch.boundary", "debug.boundary", "compare.operators"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама `x`-тен қатаң ҮЛКЕН сандар тізімде нешеу екенін шығаруы керек. Бірінші жолда реттелген тізім, екінші жолда `x`. `2 4 6 8` және `5` үшін жауап 2 болуы тиіс (5-тен үлкені — 6 мен 8), ал бағдарлама 3 шығарады. Цикл ішіндегі екі жылжу да дұрыс: аралық әр қадамда қысқарады және бірде-бір сан бекерге тасталмайды. Қате қай жолда?",
      ru: "Программа должна выводить, сколько чисел списка строго БОЛЬШЕ `x`. В первой строке упорядоченный список, во второй — `x`. Для `2 4 6 8` и `5` ответ должен быть 2 (больше пяти только 6 и 8), а программа выводит 3. Оба сдвига внутри цикла верны: интервал сокращается на каждом шаге и ни одно число не выброшено зря. В какой строке ошибка?",
    },
    code:
      "a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] <= x:\n        left = mid + 1\n    else:\n        right = mid - 1\nprint(len(a) - right)",
    buggyLine: 11,
    symptomInput: "2 4 6 8\n5",
    fixedCode:
      "a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] <= x:\n        left = mid + 1\n    else:\n        right = mid - 1\nprint(len(a) - left)",
    diagnosticMapping: {
      "8": {
        failureClass: "pattern_matched_a_remembered_bug",
        justification:
          "Жауап дұрысынан дәл бірге артық, ал оқушы `mid + 1` мен `mid`-ті осы аптада ғана ажыратқан, сондықтан 8-жолды таңдау — есте қалған симптомды есте қалған жолға жапсыру. Бірақ 8-жолдағы `+ 1`-ді алып тастасаң, `left` `mid`-те қатып қалады да, цикл мүлде тоқтамайды: демек бұл жауап бағдарламаны қадамдаудан шыға алмайды.",
      },
    },
  },
  {
    /*
     * The hardest idea in the lesson, and the reason it is a `test_case` and
     * not a `find_bug`: there is no line to point at. The loop is the one the
     * learner traced in b2 and it is completely correct — the interval shrinks,
     * the answer is never thrown away, `left` and `right` meet. What it
     * computes is «қай орынға кірістіру керек», and the prompt claims it
     * computes «x қай жерде тұр». Those two agree exactly when x is in the
     * list, so every input that separates them is a witness.
     *
     * The three declared witnesses are three different separations, not one
     * three times: `1 3 5 7` / 4 lands on an index holding a different number,
     * `2 4 6` / 9 prints an index the list does not have at all, and `5` / 1 is
     * the shortest input that lies. Withheld from support, which gets b7s.
     */
    id: "m5.l6.b7",
    type: "test_case",
    skillRefs: ["bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бұл бағдарлама туралы «реттелген тізімде `x` тұрған индексті шығарады» деп жазылған. `1 3 5 7` және `5` үшін ол 2 береді — дұрыс. Бірақ кейбір енгізулерде ол `x` мүлде тұрмаған орынның индексін, тіпті тізімде жоқ индексті де шығарады. Циклдің өзінде қате жоқ: аралық әр қадамда қысқарады, жауап лақтырылмайды. Сондай екі енгізуді жаз және цикл біткенде `left` шын мәнінде нені білдіретінін өз сөзіңмен айт.",
      ru: "Про эту программу написано, что она выводит индекс, на котором в упорядоченном списке стоит `x`. Для `1 3 5 7` и `5` она даёт 2 — верно. Но на некоторых вводах она выводит индекс места, где `x` не стоит вовсе, а иногда и индекс, которого в списке нет. В самом цикле ошибки нет: интервал сокращается на каждом шаге, ответ не выбрасывается. Напиши два таких ввода и объясни своими словами, что на самом деле означает `left` в момент выхода из цикла.",
    },
    code:
      "a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a)\nwhile left < right:\n    mid = (left + right) // 2\n    if a[mid] < x:\n        left = mid + 1\n    else:\n        right = mid\nprint(left)",
    breakingInputs: ["1 3 5 7\n4", "2 4 6\n9", "5\n1"],
  },
  {
    /*
     * Support's substitute for b7. Same program, same lie, but the witness is
     * handed over and the list is written in: what support is short of is not
     * the tracing, it is inventing the input that exposes the gap.
     *
     * A prediction, not a multiple guess at which input breaks it, because the
     * only way to reach `2` is to run the loop by hand — and `-1`, the answer
     * the prompt itself makes available, is what a learner writes when they
     * answer the program's intention instead of its execution. The number -1
     * appears nowhere in the code, which is what makes that mapping safe.
     *
     * Support met this loop once before, in `m5.l2.b9s`, where they added the
     * membership check to it. So this card is that lesson arriving as a
     * consequence rather than as a rule: the same loop, three numbers to carry,
     * and an answer that is only reachable by carrying them.
     */
    id: "m5.l6.b7s",
    type: "prediction",
    skillRefs: ["bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Сол бағдарлама, тек тізім мен `x` ішіне жазылып қойылған. Ол туралы «`x` тұрған индексті шығарады, ал `x` болмаса -1 шығарады» деп жазылған. Оны қағазда қадамдап орында да, бағдарлама НЕ ІСТЕУІ КЕРЕК екенін емес, ЭКРАНҒА шын мәнінде нені шығаратынын таңда.",
      ru: "Та же программа, только список и `x` уже вписаны в неё. Про неё написано: «выводит индекс, на котором стоит `x`, а если `x` нет — выводит -1». Выполни её по шагам на бумаге и выбери не то, что программа ДОЛЖНА была бы вывести, а то, что она на самом деле напечатает на экране.",
    },
    code:
      "a = [1, 3, 5, 7]\nx = 4\nleft = 0\nright = len(a)\nwhile left < right:\n    mid = (left + right) // 2\n    if a[mid] < x:\n        left = mid + 1\n    else:\n        right = mid\nprint(left)",
    answer: "2",
    options: ["-1", "1", "2", "4"],
    diagnosticMapping: {
      "-1": {
        failureClass: "answered_the_intent_not_the_run",
        justification:
          "-1 деген — бағдарлама 4 санын таппаған кезде шығаруы КЕРЕК болатын жауап, әрі оны тапсырманың мәтінінен қадамдамай-ақ көшіріп жазуға болады. Кодта -1 деген сан мүлде жоқ, сондықтан бұл жауап бағдарламаны орындаудан емес, оның мақсатын қайталаудан шыққан.",
      },
    },
  },
  {
    /*
     * «Which of four boundary updates is the safe one», asked about a fifth
     * skeleton on purpose: the safe pairs for the two shapes already on the
     * screen are already on the screen, and an option a learner can recognise
     * from an earlier card is not a question.
     *
     * So the loop here narrows towards the LAST index satisfying the condition,
     * the answer lives in `left` itself rather than in a separate variable, and
     * `mid` is given rounded up — stated in the stem, not asked for. Two of the
     * four options hang (B when `right = mid` meets `mid == right`, C for the
     * same reason), D terminates and reports 3 instead of 2, and only A both
     * finishes and keeps `mid` in the interval when `mid` may be the answer.
     */
    id: "m5.l6.b8",
    type: "multiple_choice",
    skillRefs: ["bsearch.boundary", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "`a = [1, 4, 4, 7, 9]` реттелген тізімінде `a[i] <= x` шарты орындалатын СОҢҒЫ индекс керек; `x = 4` үшін жауап — 2. Мұнда жауап бөлек айнымалыға жазылмайды: цикл біткенде ол `left`-тің өзінде тұруы тиіс. Сондықтан `mid` жоғары қарай дөңгелектенген — аралықта екі сан қалғанда `mid` оң жақтағысын көрсетеді. Кодтағы екі көп нүктенің орнына қандай жылжу қою керек: цикл ӘРҚАШАН тоқтап, әрі `mid` жауап болуы мүмкін кезде аралықтан лақтырылмауы үшін?",
      ru: "В упорядоченном списке `a = [1, 4, 4, 7, 9]` нужен ПОСЛЕДНИЙ индекс, для которого выполняется `a[i] <= x`; при `x = 4` ответ — 2. Отдельной переменной для ответа здесь нет: к моменту выхода из цикла он должен оказаться в самой `left`. Поэтому `mid` округляется вверх — когда в интервале остаются два числа, `mid` указывает на правое. Какие сдвиги нужно поставить вместо многоточий, чтобы цикл ВСЕГДА завершался и чтобы `mid` не выбрасывался из интервала, когда он ещё может оказаться ответом?",
    },
    code:
      "a = [1, 4, 4, 7, 9]\nx = 4\nleft = 0\nright = len(a) - 1\nwhile left < right:\n    mid = (left + right + 1) // 2\n    if a[mid] <= x:\n        ...\n    else:\n        ...\nprint(left)",
    options: [
      {
        id: "a",
        label: {
          kk: "`if` тармағында `left = mid`, `else` тармағында `right = mid - 1`",
          ru: "в ветке `if` — `left = mid`, в ветке `else` — `right = mid - 1`",
        },
      },
      {
        id: "b",
        label: {
          kk: "`if` тармағында `left = mid + 1`, `else` тармағында `right = mid`",
          ru: "в ветке `if` — `left = mid + 1`, в ветке `else` — `right = mid`",
        },
      },
      {
        id: "c",
        label: {
          kk: "`if` тармағында `left = mid`, `else` тармағында `right = mid`",
          ru: "в ветке `if` — `left = mid`, в ветке `else` — `right = mid`",
        },
      },
      {
        id: "d",
        label: {
          kk: "`if` тармағында `left = mid + 1`, `else` тармағында `right = mid - 1`",
          ru: "в ветке `if` — `left = mid + 1`, в ветке `else` — `right = mid - 1`",
        },
      },
    ],
    correctOptionId: "a",
    diagnosticMapping: {
      d: {
        failureClass: "carried_a_remembered_pair_into_a_loop_that_stores_its_answer_in_left",
        justification:
          "`left = mid + 1` мен `right = mid - 1` жұбы — жауабы бөлек айнымалыда сақталатын циклге арналған дұрыс жұп, әрі бұл цикл онымен тоқтайды да. Бірақ мұнда жауап `left`-тің өзінде тұрады, сондықтан `left = mid + 1` дәл жауап болуы мүмкін `mid`-ті аттап кетеді: бұл таңдау есте қалған жұпты жаңа циклдің шартымен салыстырмай қолданудан шығады.",
      },
    },
  },
  {
    /*
     * Completing ready code — «дайын кодты … толықтыру», p.9.
     *
     * `m5.l2.b6` already has the learner fill in a pair of boundary shifts, so
     * repeating `mid + 1` / `mid - 1` in two blanks would be that card again
     * with an extra hole. Here only ONE blank is a shift, and it is the one
     * that has to be reasoned about rather than recalled: `ans` is already
     * recorded before the boundary moves, so `right = mid` would leave the loop
     * spinning while `right = mid - 1` cannot lose anything. The other two are
     * decisions `m5.l2` never asked for — the value that means «ондай элемент
     * жоқ», and the condition that decides when to stop at all.
     *
     * The direction is the mirror of b10's on purpose. Here the recorded answer
     * is a candidate on the left and the search continues leftwards; there it is
     * a candidate on the right and the search continues rightwards. A learner
     * who fills this in by copying the shape of a neighbouring card gets a loop
     * that runs forever.
     */
    id: "m5.l6.b9",
    type: "fill_blank",
    skillRefs: ["bsearch.boundary", "bsearch.core", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама реттелген тізімнен `x`-тен КЕМ ЕМЕС бірінші элементтің индексін табуы керек; ондай элемент болмаса, тізім ұзындығын шығарады. Үш орынды толтыр: «ондай элемент жоқ» дегенді білдіретін бастапқы мән, циклдің жұмыс істеу шарты және оң шекараның жылжуы. Оң шекараны толтырар алдында есіңе ал: `ans`-қа `mid` бір жол жоғарыда жазылып қойылған.",
      ru: "Программа должна найти индекс первого элемента, НЕ МЕНЬШЕГО `x`, в упорядоченном списке; если такого элемента нет — вывести длину списка. Заполни три места: начальное значение, означающее «такого элемента нет», условие работы цикла и сдвиг правой границы. Перед тем как заполнять правую границу, вспомни: `mid` уже записан в `ans` строкой выше.",
    },
    template:
      "a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\nans = ___\nwhile ___:\n    mid = (left + right) // 2\n    if a[mid] >= x:\n        ans = mid\n        right = ___\n    else:\n        left = mid + 1\nprint(ans)",
    blanks: [
      { id: "f1", answer: "len(a)" },
      { id: "f2", answer: "left <= right", alternatives: ["right >= left"] },
      { id: "f3", answer: "mid - 1" },
    ],
  },
  {
    /*
     * The repair, and error #4 again in the form that is genuinely hard: the
     * loop is right, the interval is right, the answer is recorded correctly —
     * and the program still prints the wrong thing, because at exit `pos` is
     * where the answer is and `mid` is merely wherever the last probe landed.
     *
     * The cases are chosen against the four wrong programs, not for a count:
     *   `1 4 6 9` / 7   — visible; `mid` is 3, `a[mid]` is 9, `pos` is 2 and the
     *                     answer is 6, so all four candidate one-line repairs
     *                     give four different numbers here;
     *   `1 4 6 9` / 0   — visible; nothing qualifies, so `none` is on screen once;
     *   `5` / 5         — one element, equal, so a `<` that should be `<=` dies;
     *   `5` / 4         — one element, nothing qualifies;
     *   `2 4 6` / 10    — the answer is the LAST element, which kills a loop
     *                     that stops one short, and where `a[mid]` accidentally
     *                     agrees — this is why case 1 is also present;
     *   `2 4 6` / 2     — the answer is the FIRST element;
     *   `3 3 3` / 3     — every element equal;
     *   `-5 -1 0 3` / -1 — the answer IS -1, which kills any program that uses
     *                     -1 as a "nothing found" value instead of as an index;
     *   `1 2 3 4 5 6 7 8` / 8 — eight elements, answer at the far end.
     *
     * "One line is enough" is GUIDANCE, not a graded rule — option 2 of the
     * three honest choices in the authoring contract. Output comparison cannot
     * see how many lines a learner touched, and a solution that replaces the
     * whole search with a `for` loop over the list answers every case above and
     * is marked correct, which is the right outcome: this block grades the
     * answer. So both prompts say the repair *suffices*, not that it is
     * required, and the sentence that carries the teaching — what `pos` and
     * `mid` mean at exit — is a question the learner asks themselves rather
     * than a constraint the platform pretends to enforce.
     */
    id: "m5.l6.b10",
    type: "modify_code",
    skillRefs: ["bsearch.boundary", "debug.boundary", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама реттелген тізімнен `x`-тен аспайтын (яғни `<= x`) ең ҮЛКЕН санның ӨЗІН шығаруы керек; ондай сан болмаса — `none` сөзін шығарады. Бірінші жолда тізім, екінші жолда `x`. `1 4 6 9` және `7` үшін ол 6-ның орнына 3 шығарады. Цикл дұрыс жұмыс істейді — қате одан кейін тұр. Цикл біткен сәтте `pos` нені, ал `mid` нені білдіретінін өзіңе айтып ал: бір жолды түзету жеткілікті.",
      ru: "Эта программа должна выводить само наибольшее число списка, не превосходящее `x` (то есть `<= x`); если такого числа нет — слово `none`. В первой строке список, во второй — `x`. Для `1 4 6 9` и `7` она выводит 3 вместо 6. Цикл работает правильно — ошибка стоит после него. Скажи себе, что означает `pos` и что означает `mid` в момент выхода из цикла: достаточно исправить одну строку.",
    },
    code:
      'a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\npos = -1\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] <= x:\n        pos = mid\n        left = mid + 1\n    else:\n        right = mid - 1\nif pos == -1:\n    print("none")\nelse:\n    print(mid)',
    referenceSolution:
      'a = list(map(int, input().split()))\nx = int(input())\nleft = 0\nright = len(a) - 1\npos = -1\nwhile left <= right:\n    mid = (left + right) // 2\n    if a[mid] <= x:\n        pos = mid\n        left = mid + 1\n    else:\n        right = mid - 1\nif pos == -1:\n    print("none")\nelse:\n    print(a[pos])',
    cases: [
      { input: "1 4 6 9\n7", expectedOutput: "6" },
      { input: "1 4 6 9\n0", expectedOutput: "none" },
      { input: "5\n5", expectedOutput: "5", hidden: true },
      { input: "5\n4", expectedOutput: "none", hidden: true },
      { input: "2 4 6\n10", expectedOutput: "6", hidden: true },
      { input: "2 4 6\n2", expectedOutput: "2", hidden: true },
      { input: "3 3 3\n3", expectedOutput: "3", hidden: true },
      { input: "-5 -1 0 3\n-1", expectedOutput: "-1", hidden: true },
      { input: "1 2 3 4 5 6 7 8\n8", expectedOutput: "8", hidden: true },
    ],
  },
];
