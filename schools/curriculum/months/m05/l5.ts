import type { LessonBlock } from "../../types";

/**
 * m5.l5 · «Күрделірек есептер» / «Задачи посложнее» — 10 minutes.
 *
 * Skills: `twopointers.core`, `sort.basic`. PDF p.9.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * January's practice paragraph names six families. Five of them are already
 * spoken for by `m5.l1`–`m5.l4` and `m5.l7`; the sixth is this lesson's:
 * «**қайталанбайтын ең ұзын бөлік**» — the longest contiguous piece with no
 * repeated value. The mastery sentence covers it too — «тізімнің үздіксіз
 * бөлігін екі шекараны жылжыта отырып өңдеу» — and the word that matters there
 * is **үздіксіз**: this is a window, not a pair of ends closing in.
 *
 * The month's other requirement, «алғашқы екі аптада дайын кодты оқу, түзету
 * және толықтыру көбірек беріледі», is explicitly about the FIRST two weeks.
 * This lesson is the last teaching card of the month, so a blank editor is
 * normal again — core and advanced write three programs from nothing, and the
 * support route trades the second of them for a completion (`b7` → `b7s`),
 * which is p.6's permanent rule for that route rather than this month's extra
 * one.
 *
 * ## The one idea, and how it differs from m5.l4's
 *
 * `m5.l4` walks two pointers TOWARDS each other from the two ends of one list.
 * `m5.l7` walks two pointers forward through two different lists. Here both
 * pointers walk forward through the SAME list and the piece between them is the
 * answer: `right` advances once per step and drags a new number in, `left` is
 * pulled forward only when the piece stops being valid, and neither ever goes
 * back. That last clause is the whole lesson, and it is what `b4` and `b9` ask
 * about in words.
 *
 * ## Why the re-scan is honest here and not a pretence
 *
 * `set()` and `dict()` are forbidden all year, so the window's validity check
 * has to walk the window: `a[right] in a[left:right]` is a linear scan of the
 * piece, written in the two constructs October already taught. That makes `b6`
 * roughly n · (window length) work, so its prompt caps the input at 1000
 * numbers and says out loud WHY the cap is there. Pretending the check is free,
 * or stating n ≤ 200 000 over a solution that cannot survive it, would teach a
 * lie about the one thing December exists to teach. `b7` and `b8` sort first,
 * and after sorting the same check collapses into a single subtraction — which
 * is exactly why their constraint can be 200 000 and why the lesson's objective
 * is «реттеуді екі шекарамен біріктіру».
 *
 * ## The requirement no checker can see, and which of the three options this is
 *
 * "Solve it with a window" is invisible to output comparison. `b6` can be
 * answered by three nested loops, `b7` and `b8` by a loop over all pairs, and
 * no case set a source file can hold will separate those from a window: the
 * inputs are small precisely because the reference solutions are honest about
 * their own cost.
 *
 * **Option 2 of the authoring contract is taken, deliberately, for all three.**
 * Each prompt gives the window as advice, in both languages, and says plainly
 * that the automatic check compares only the number that comes out. Option 1
 * was drafted and thrown away: the only outputs a window can produce that a
 * brute force cannot are step counts, and a step count depends on how the
 * learner happened to write the loop — a task whose answer depends on the
 * author's loop is worse than an unenforced rule. Option 3 is present as well,
 * but only for one route: `b9` sends the correctness argument to a teacher, and
 * `b9` is advanced-only, so nothing anywhere tells a core learner that a rule
 * was enforced when it was not.
 *
 * ## Four programs, four different outputs, on purpose
 *
 * Every block of a lesson is mounted at once, so whatever sits in `code` is on
 * screen while the learner is still working on the blank editors. The window
 * walk is six lines and a lesson about it could easily print `b6`'s answer four
 * times over. So: `b1` prints the WINDOW ITSELF at every step (`[4, 1, 5, 9,
 * 2]`), `b2` prints the moment of the first shrink, `b3` prints the final left
 * edge and length, `b5` prints the left edge at every step and has no maximum
 * in it at all, and only `b6` computes a maximum. `b7` and `b8` sort first and
 * ask different questions again. No two programs in this file are the same
 * text, and none of them is any other block's answer — measured with a script
 * over the whole of `m05/`, not eyeballed.
 *
 * ## Deliberately left for later
 *
 * No window whose validity check needs a running aggregate (a sum, a maximum
 * over the window) — the running sum belongs beside April's prefix work, and
 * the sliding maximum needs a structure this year never teaches. No `import`,
 * and in particular no `bisect`: this is the month that would be deleted by it.
 */

const P = 9; // PDF page for all of January

export const M5_L5: LessonBlock[] = [
  {
    /*
     * «толық талданған мысалдар». There is no separate `concept` card: the
     * reasoning IS the content here, and a concept block would state the rule
     * («left тек алға жылжиды») without the eight windows that make it
     * believable. Steps 1 and 2 carry what a concept block would have said,
     * including the one construct rule this lesson has to honour — `a[l:r]` and
     * `x in ...` are October's, but no prose in the year has named the two of
     * them together, and the whole method rests on that one expression.
     *
     * The program prints the window itself and never computes a maximum, so
     * `b6` is not sitting on this card. The list is `3 1 4 1 5 9 2 5` and it is
     * used nowhere else in the file: the answer for it (5) is written out in
     * `result`, so any block that reused the data would be handing over its own
     * answer.
     */
    id: "m5.l5.b1",
    type: "worked_example",
    skillRefs: ["twopointers.core", "lists.traverse"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: терезе қалай өседі және қашан қысқарады",
      ru: "Разобранный пример: как окно растёт и когда оно сжимается",
    },
    problem: {
      kk: "Тізім берілген: 3 1 4 1 5 9 2 5. Оның қайталанбайтын ең ұзын үздіксіз бөлігін табу керек — қатар тұрған сандардың ішінде бірдей сан екі рет кездеспейтін ең ұзын тізбегін. Төмендегі бағдарлама жауапты бірден бермейді: ол әр қадамда терезенің өзін экранға шығарады, сондықтан оның қалай өсіп, қалай қысқарғанын өз көзіңмен көресің.",
      ru: "Дан список: 3 1 4 1 5 9 2 5. Нужно найти в нём самый длинный непрерывный участок без повторов — самую длинную цепочку идущих подряд чисел, в которой ни одно число не встречается дважды. Программа ниже не выдаёт ответ сразу: на каждом шаге она печатает само окно, поэтому ты своими глазами увидишь, как оно растёт и как сжимается.",
    },
    steps: [
      {
        kk: "Терезе деп тізімнің үздіксіз бөлігін айтамыз. Оны екі сан ұстап тұрады: `left` — бөліктің сол шеті, `right` — оң шеті. Бұл жолы көрсеткіштер бір-біріне қарсы жүрмейді, екеуі де тек оңға жылжиды: `right` әр қадамда бір орынға жылжып, терезеге жаңа сан қосады, ал `left` терезе жарамсыз болып қалғанда ғана алға тартылады.",
        ru: "Окном будем называть непрерывный участок списка. Его держат два числа: `left` — левый край участка, `right` — правый. На этот раз указатели не идут навстречу друг другу, оба движутся только вправо: `right` на каждом шаге сдвигается на одну позицию и втягивает в окно новое число, а `left` подтягивается вперёд только тогда, когда окно перестаёт быть пригодным.",
      },
      {
        kk: "Терезенің жарамдылығы қалай тексеріледі? `a[left:right]` — бұл жаңа санды қоспағандағы терезенің іші (тізімнің бөлігін осылай кесіп алу қазаннан таныс). Ал `x in ...` — сол бөліктің ішінде x кездесе ме деген сұрақ. Егер `a[right]` терезеде бұрыннан бар болса, терезеде екі бірдей сан пайда болды деген сөз. Бұл тексеру терезені түгел қарап шығады, яғни тегін емес — сондықтан бұл сабақтағы бірінші есепте сандардың саны мыңнан аспайды.",
        ru: "Как проверяется пригодность окна? `a[left:right]` — это внутренность окна без нового числа (брать кусок списка срезом мы умеем с октября). А `x in ...` — это вопрос, встречается ли x внутри этого куска. Если `a[right]` в окне уже есть, значит в окне появились два одинаковых числа. Такая проверка просматривает всё окно целиком, то есть она не бесплатна, — поэтому в первой задаче этого урока чисел не больше тысячи.",
      },
      {
        kk: "0, 1, 2-қадамдар: терезеге 3, содан кейін 1, содан кейін 4 кіреді, қайталау жоқ. Терезе өсіп, [3, 1, 4] болады.",
        ru: "Шаги 0, 1, 2: в окно входят 3, затем 1, затем 4, повторов нет. Окно растёт и становится [3, 1, 4].",
      },
      {
        kk: "3-қадам: жаңа сан — 1, ал ол терезеде бұрыннан бар. `left` бір орын алға жылжиды, бірақ [1, 4] терезесінде 1 әлі тұр. Тағы бір жылжиды: терезе [4, 1] болады, енді жарамды. Назар сал — `left` бір рет емес, шарт орындалғанша жылжыды. Сондықтан мұнда `if` емес, `while` тұр.",
        ru: "Шаг 3: новое число — 1, а оно в окне уже есть. `left` сдвигается на одну позицию, но в окне [1, 4] единица всё ещё стоит. Сдвигается ещё раз: окно становится [4, 1] и теперь пригодно. Обрати внимание — `left` сдвинулся не один раз, а столько раз, сколько нужно. Поэтому здесь стоит `while`, а не `if`.",
      },
      {
        kk: "4, 5, 6-қадамдар: 5, 9, 2 кіреді, қайталау жоқ. Терезе [4, 1, 5, 9, 2] болады — ұзындығы бес, әзірге ең ұзыны.",
        ru: "Шаги 4, 5, 6: входят 5, 9, 2, повторов нет. Окно становится [4, 1, 5, 9, 2] — длина пять, пока самое длинное.",
      },
      {
        kk: "7-қадам: жаңа сан — 5, ал ол терезенің ішінде бар. `left` үш рет жылжуға мәжбүр болады, терезе [9, 2, 5] болып қалады.",
        ru: "Шаг 7: новое число — 5, а оно внутри окна есть. `left` вынужден сдвинуться трижды, и окно превращается в [9, 2, 5].",
      },
      {
        kk: "`left` неге ешқашан артқа қайтпайды? Ол бір орынды тастап кетті деген сөз — сол орыннан басталатын терезе сол кезде-ақ жарамсыз болған. Ал `right` әрі қарай жылжығанда терезеге тек жаңа сандар қосылады, сан қосу жарамсыз терезені жарамдыға айналдырмайды. Демек тасталған орындарға қайта оралудың мәні жоқ — және әр сан терезеден ең көбі бір рет шығады.",
        ru: "Почему `left` никогда не возвращается назад? Если он покинул какую-то позицию, значит окно, начинающееся с неё, уже тогда было непригодным. А когда `right` идёт дальше, в окно только добавляются новые числа, и добавление не делает непригодное окно пригодным. Значит, возвращаться к покинутым позициям незачем — и каждое число выходит из окна не более одного раза.",
      },
      {
        kk: "Ең ұзын терезе — [4, 1, 5, 9, 2], ұзындығы 5. Бұл бағдарлама терезелерді көрсетеді; өзің жазатын есепте терезелердің ең үлкен ұзындығын ғана шығару керек болады.",
        ru: "Самое длинное окно — [4, 1, 5, 9, 2], его длина 5. Эта программа показывает окна; в задаче, которую напишешь сам, нужно будет вывести только наибольшую длину окна.",
      },
    ],
    code:
      "a = [3, 1, 4, 1, 5, 9, 2, 5]\n" +
      "left = 0\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] in a[left:right]:\n" +
      "        left = left + 1\n" +
      "    print(a[left:right + 1])",
    result: {
      kk: "Экранға сегіз жол шығады: [3], [3, 1], [3, 1, 4], [4, 1], [4, 1, 5], [4, 1, 5, 9], [4, 1, 5, 9, 2], [9, 2, 5]. Ең ұзыны — жетінші жолдағы [4, 1, 5, 9, 2], онда бес сан бар.",
      ru: "На экран выходит восемь строк: [3], [3, 1], [3, 1, 4], [4, 1], [4, 1, 5], [4, 1, 5, 9], [4, 1, 5, 9, 2], [9, 2, 5]. Самое длинное — седьмая строка, [4, 1, 5, 9, 2], в ней пять чисел.",
    },
  },
  {
    /*
     * Where the window first has to shrink, and where the left edge lands.
     *
     * The data is chosen so that the three wrong answers are three DIFFERENT
     * numbers. The earlier copy of 9 sits at index 2, so:
     *   left = 1  is reachable only by running the `while` body once;
     *   left = 2  is reachable two ways — two iterations, or the rule "left goes
     *             to where the old copy is" — so it is left unmapped;
     *   left = 3  is the truth, and it is what the loop's own condition forces.
     * On a list where the old copy sat at index 1 the first two would collide
     * and neither could honestly be mapped. That is why this list is not
     * `4 9 2 9 6`.
     */
    id: "m5.l5.b2",
    type: "prediction",
    skillRefs: ["twopointers.core", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Терезе тізімді солдан оңға қарай аралайды. Бұл бағдарлама екі санды бос орынмен бөліп шығарады: терезе БІРІНШІ рет қысқаруға мәжбүр болған сәттегі `right` мәні және цикл біткендегі `left` мәні. Бағдарламаны іске қоспас бұрын екі санды да өзің шеш.",
      ru: "Окно проходит по списку слева направо. Программа выводит через пробел два числа: значение `right` в тот момент, когда окну ПЕРВЫЙ раз пришлось сжаться, и значение `left` после завершения цикла. Определи оба числа сам, до запуска программы.",
    },
    code:
      "a = [4, 7, 9, 2, 9, 6]\n" +
      "left = 0\n" +
      "first = -1\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] in a[left:right]:\n" +
      "        left = left + 1\n" +
      "        if first == -1:\n" +
      "            first = right\n" +
      "print(first, left)",
    answer: "4 3",
    options: ["4 3", "4 1", "4 2", "2 3"],
    diagnosticMapping: {
      "4 1": {
        failureClass: "window_shrunk_only_once",
        justification:
          "`left` = 1 болуы `while` денесінің бір-ақ рет орындалғанын білдіреді: 9 саны терезеде 2-орында тұр, сондықтан бір жылжудан кейін де терезеде екі 9 қалады және цикл тоқтамайды. Бұл жауап `while`-ды `if` деп оқығанды көрсетеді.",
      },
      "2 3": {
        failureClass: "shrink_moment_confused_with_duplicate_position",
        justification:
          "Бірінші сан 2 болуы — 9-дың бірінші данасы тұрған орын. Ал бағдарлама қайталанған сан ЕКІНШІ рет кездескен сәттегі `right`-ты жазады, өйткені терезе дәл сол сәтте ғана жарамсыз болады. Бұл жауап екі түрлі орынды шатастырғанды білдіреді.",
      },
      /* «4 2» is deliberately unmapped: it comes either from stopping the while
         one iteration short, or from the rule «left = қайталанған санның орны»
         instead of one past it. Two causes, so the engine asks. */
    },
  },
  {
    /*
     * The hand trace — «Кодты қолмен орындау», one of the programme's own five
     * verification methods, and this month's stand-in for the animation that
     * does not exist yet (see the month file's header).
     *
     * Nothing is printed inside the loop, so the three columns are real work
     * rather than a transcription of the program's own output. Seven passes on
     * seven numbers, and the data earns each row: the duplicate at index 1 makes
     * `left` move on the very first pass (so the learner cannot assume the left
     * edge sits still for a while), index 4 makes it move once, index 6 once
     * more, and the window is never larger than four.
     */
    id: "m5.l5.b3",
    type: "trace_code",
    skillRefs: ["twopointers.core", "loops.while", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Қағазға үш баған сыз: `left`, `right`, `length`. Циклдің әр айналымында 7-жол орындалып болғандағы мәндерді жаз — барлығы жеті жол болады. Соңғы жолда (8-жол) цикл біткендегі `left` пен `length` қалады. Бағдарлама ішінде ештеңе шығармайды, сондықтан әр санды өзің есептеуің керек.",
      ru: "Начерти на бумаге три столбца: `left`, `right`, `length`. Для каждого оборота цикла записывай значения сразу после выполнения строки 7 — всего получится семь строк. В последней строке (строка 8) останутся `left` и `length` на момент выхода из цикла. Внутри цикла программа ничего не печатает, поэтому каждое число придётся посчитать самому.",
    },
    code:
      "a = [4, 4, 5, 6, 4, 7, 5]\n" +
      "left = 0\n" +
      "length = 0\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] in a[left:right]:\n" +
      "        left = left + 1\n" +
      "    length = right - left + 1\n" +
      "print(left, length)",
    steps: [
      { line: 7, vars: { left: "0", right: "0", length: "1" } },
      { line: 7, vars: { left: "1", right: "1", length: "1" } },
      { line: 7, vars: { left: "1", right: "2", length: "2" } },
      { line: 7, vars: { left: "1", right: "3", length: "3" } },
      { line: 7, vars: { left: "2", right: "4", length: "3" } },
      { line: 7, vars: { left: "2", right: "5", length: "4" } },
      { line: 7, vars: { left: "3", right: "6", length: "4" } },
      { line: 8, vars: { left: "3", length: "4" } },
    ],
  },
  {
    /*
     * The month's oral question — «жауаптың неге жоғалып кетпейтіні» — asked
     * about the window instead of about the halving. It is a `multiple_choice`
     * rather than an `explain` because the written defence belongs to `b9` and
     * to the assessment; here the point is to separate the argument from three
     * things that sound like arguments.
     *
     * o4 is left unmapped on purpose: it is a TRUE statement about the loop, so
     * choosing it can mean «шындықты дәлел деп қабылдау» or simply picking the
     * only sentence that is not false. Two causes, so the engine asks.
     */
    id: "m5.l5.b4",
    type: "multiple_choice",
    skillRefs: ["twopointers.core"],
    sourceType: "product-authored",
    prompt: {
      kk: "Терезе әдісінде `left` тек алға жылжиды, ешқашан артқа қайтпайды. Неге бұл дұрыс — тасталып кеткен орындардан басталатын ұзынырақ жауап неге жоғалып кетпейді?",
      ru: "В методе окна `left` двигается только вперёд и никогда не возвращается назад. Почему это правильно — почему не теряется более длинный ответ, который мог бы начинаться в одной из покинутых позиций?",
    },
    options: [
      {
        id: "o1",
        label: {
          kk: "`left` бір орынды тастап кеткен болса, сол орыннан басталатын терезе сол кезде-ақ жарамсыз болған. `right` әрі қарай жылжығанда терезеге тек жаңа сандар қосылады, ал сан қосу жарамсыз терезені жарамдыға айналдырмайды — сондықтан ол орындардан ұзынырақ жауап шықпайды.",
          ru: "Если `left` покинул позицию, то окно, начинающееся с неё, уже тогда было непригодным. Когда `right` идёт дальше, в окно только добавляются новые числа, а добавление не делает непригодное окно пригодным — поэтому с этих позиций более длинный ответ не появится.",
        },
      },
      {
        id: "o2",
        label: {
          kk: "Себебі `left` мен `right` әрқашан бірге, бірдей жылдамдықпен жылжиды.",
          ru: "Потому что `left` и `right` всегда двигаются вместе, с одинаковой скоростью.",
        },
      },
      {
        id: "o3",
        label: {
          kk: "Себебі тізім өсу ретімен реттелген, сондықтан сол жақта кішірек сандар тұрады.",
          ru: "Потому что список отсортирован по возрастанию и слева стоят меньшие числа.",
        },
      },
      {
        id: "o4",
        label: {
          kk: "Себебі `left` ешқашан `right`-тан асып кетпейді.",
          ru: "Потому что `left` никогда не обгоняет `right`.",
        },
      },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "window_walk_confused_with_mirror_walk",
        justification:
          "Екі көрсеткіш те әр қадамда жылжитын жүріс — тізімнің симметриялы екенін тексергендегі жүріс, ол осы айда бөлек өтілді. Терезе әдісінде `right` әр қадамда жылжиды, ал `left` тек терезе жарамсыз болғанда ғана қозғалады. Бұл жауап екі түрлі жүрісті бір деп ойлағанды көрсетеді.",
      },
      o3: {
        failureClass: "window_thought_to_require_sorted_list",
        justification:
          "Қайталанбайтын ең ұзын бөлікті іздегенде тізім реттелмеген күйінде беріледі және әдіс сонда да дұрыс жұмыс істейді. Реттеу бұл сабақтың келесі екі есебінде мүлде басқа себеппен керек болды — айырманы бір азайтумен есептеу үшін. Бұл жауап `left`-тің алға жылжуын реттелгендіктен шығарып отыр, ал ол екеуі бір-біріне тәуелсіз.",
      },
    },
  },
  {
    /*
     * The repair slot. The bug is the classic one: the left edge is thrown all
     * the way to `right` instead of being pulled forward one position at a time,
     * so the window collapses to a single number and every longer piece that
     * started inside it is lost.
     *
     * The program has NO maximum in it — it reports the left edge at every step
     * and nothing else — so its repaired form is not `b6`'s answer, which is the
     * defect class the first adversarial review found most often. What it shares
     * with `b6` is the two-line move that `b1` already prints in full.
     *
     * symptomInput is required: the fallback probe feeds single numbers, and on
     * a single number the `while` never runs at all, so both programs print `0`
     * and the bug reads as absent. On `5 8 3 4 5 9` the broken one collapses a
     * four-number window to one.
     *
     * No diagnosticMapping. Blaming line 4 could mean «шартты `if` деп оқыдым»
     * or «терезенің ішін дұрыс кесіп алмаған» — two causes, so the engine asks.
     */
    id: "m5.l5.b5",
    type: "find_bug",
    skillRefs: ["twopointers.core", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама тізімді солдан оңға қарап шығып, әр қадамда қайталанбайтын терезенің сол шекарасы қай орында тұрғанын жеке жолға жазып отыруы керек. `5 8 3 4 5 9` бергенде ол 0, 0, 0, 0, 1, 1 сандарын шығаруы тиіс еді: бесінші қадамда терезеде екі 5 пайда болғанда сол шекара 0-ден 1-ге ғана жылжиды, ал терезеде [8, 3, 4, 5] қалады. Оның орнына бағдарлама 0, 0, 0, 0, 4, 4 шығарады — терезеде төрт санның орнына біреу ғана қалған. Қай жол кінәлі және неге?",
      ru: "Эта программа должна проходить по списку слева направо и на каждом шаге выводить отдельной строкой, на какой позиции стоит левая граница окна без повторов. При вводе `5 8 3 4 5 9` она должна была вывести 0, 0, 0, 0, 1, 1: на пятом шаге, когда в окне появились две пятёрки, левая граница сдвигается всего с 0 на 1, и в окне остаётся [8, 3, 4, 5]. Вместо этого программа выводит 0, 0, 0, 0, 4, 4 — в окне вместо четырёх чисел осталось одно. Какая строка виновата и почему?",
    },
    code:
      "a = list(map(int, input().split()))\n" +
      "left = 0\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] in a[left:right]:\n" +
      "        left = right\n" +
      "    print(left)",
    buggyLine: 5,
    symptomInput: "5 8 3 4 5 9",
    fixedCode:
      "a = list(map(int, input().split()))\n" +
      "left = 0\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] in a[left:right]:\n" +
      "        left = left + 1\n" +
      "    print(left)",
  },
  {
    /*
     * PDF p.9, verbatim family: «қайталанбайтын ең ұзын бөлік». The blank
     * editor, for all three tracks — this is the family the programme names and
     * support is not given a shorter month; what support is spared is `b7`.
     *
     * The cap of 1000 numbers is in the prompt with its reason, because the
     * reference solution really does re-scan the window and the alternative
     * would be a constraint the reference cannot meet. See the file header for
     * why the window itself is stated as advice (option 2) rather than as a rule
     * nobody checks.
     *
     * The wrong programs this case set is built against, each one run against
     * the whole set before the set was frozen:
     *   prints `len(a)`        → «1 2 3 2 4» (visible), where the answer is 3;
     *   prints 1 always        → «1 2 3 2 4» again;
     *   `if` instead of `while`, so the window shrinks once and stays broken
     *                         → «1 2 3 2 4» (answers 4) and «5 6 6 7» (answers 3);
     *   `left = right`, the collapse b5 repairs
     *                         → «1 2 1 3 4 5 6» (answers 5) and «-1 -2 -1 -3» (2);
     *   compares only NEIGHBOURS, `a[right] == a[right - 1]`
     *                         → «1 2 1» (answers 3) and «9 8 9 8 9» (answers 5);
     *   `range(len(a) - 1)`, the missed last element the programme names by hand
     *                         → «4» (answers 0), «1 2 3 4 5» (4) and «1 1 2 3 4» (3).
     * The two cases the contract asks for by name are both here: the answer
     * being the WHOLE list («1 2 3 4 5») and a single element («4», «7 7 7»),
     * and the answer sitting at the very end («1 1 2 3 4») and at the very start
     * («1 2 3 4 1 1 1»).
     */
    id: "m5.l5.b6",
    type: "write_code",
    skillRefs: ["twopointers.core", "lists.traverse", "loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі (кемінде біреу, ең көбі 1000). Ішінде бірдей сан екі рет кездеспейтін, қатар тұрған сандардың ең ұзын тізбегінің ұзындығын шығар. Мысалы, `1 2 3 2 4` үшін жауап 3: `1 2 3` де, `3 2 4` те үш саннан тұрады, ал төрт саннан тұратын жарамды бөлік жоқ.\n\nКеңес: терезені пайдалан — `right` бір қадам оңға жылжиды, ал терезеде қайталау пайда болса, `left` терезе қайта жарамды болғанша алға тартылады. Терезенің ішін қарап шығу тегін тексеру емес, сондықтан мұнда сандар саны мыңнан аспайды. Автоматты тексеру тек шыққан санды салыстырады, әдісті көрмейді — бірақ есеп дәл осы әдіс үшін жазылған.",
      ru: "В одной строке даны целые числа через пробел (хотя бы одно, не больше 1000). Выведи длину самой длинной цепочки идущих подряд чисел, в которой ни одно число не встречается дважды. Например, для `1 2 3 2 4` ответ 3: и `1 2 3`, и `3 2 4` состоят из трёх чисел, а подходящего участка из четырёх чисел нет.\n\nСовет: пользуйся окном — `right` сдвигается на шаг вправо, а если в окне появился повтор, `left` подтягивается вперёд, пока окно снова не станет пригодным. Просмотр внутренности окна — не бесплатная проверка, поэтому чисел здесь не больше тысячи. Автоматическая проверка сравнивает только выведенное число и метода не видит — но задача написана именно под этот метод.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "left = 0\n" +
      "best = 0\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] in a[left:right]:\n" +
      "        left = left + 1\n" +
      "    if right - left + 1 > best:\n" +
      "        best = right - left + 1\n" +
      "print(best)",
    cases: [
      { input: "1 2 3 2 4", expectedOutput: "3" },
      { input: "7 7 7", expectedOutput: "1" },
      /* Two equal numbers side by side: the window must shrink TWICE, so `if`
         instead of `while` answers 3 here. */
      { input: "5 6 6 7", expectedOutput: "2", hidden: true },
      /* The repeat is not adjacent: a neighbour-only check answers 3. */
      { input: "1 2 1", expectedOutput: "2", hidden: true },
      /* The longest piece begins AFTER the only shrink: `left = right` answers 5. */
      { input: "1 2 1 3 4 5 6", expectedOutput: "6", hidden: true },
      /* One element, and the whole list — the two shapes the contract names. */
      { input: "4", expectedOutput: "1", hidden: true },
      { input: "1 2 3 4 5", expectedOutput: "5", hidden: true },
      /* The answer sits at the very end, then at the very start. */
      { input: "1 1 2 3 4", expectedOutput: "4", hidden: true },
      { input: "1 2 3 4 1 1 1", expectedOutput: "4", hidden: true },
      /* Every window is exactly two long, and no two neighbours are equal. */
      { input: "9 8 9 8 9", expectedOutput: "2", hidden: true },
      /* Negative numbers, so a solution that never called int() shows itself. */
      { input: "-1 -2 -1 -3", expectedOutput: "3", hidden: true },
    ],
  },
  {
    /*
     * The lesson's second objective — «реттеуді екі шекарамен біріктіру» — and
     * the reason it comes after b6 rather than instead of it: sorting is what
     * turns the expensive validity check into one subtraction, and the learner
     * has to have paid for the expensive one first to see what was bought.
     *
     * The boundary is stated in both prompts and it is the real decision: a
     * difference exactly equal to d IS allowed, so the comparison is `> d` and
     * not `>= d`. `4 8` with d = 4 is the case that says so.
     *
     * Against the wrong programs, each run against the whole set:
     *   `>=` instead of `>`  → the visible case (answers 3 instead of 4) and it
     *                          crashes outright on «5 5 5» / 0;
     *   no sort at all       → the visible case (answers 5) and «9 1 2 3» / 2 (4);
     *   NEIGHBOUR gaps, `a[right] - a[right - 1] <= d` counted as a run
     *                        → «1 2 3 4» / 2, where it answers 4 against 3. This
     *                          is the only case that separates it, and it is the
     *                          whole reason that case exists;
     *   `right - left` without the +1 → every case;
     *   prints len(a)        → «10 20 30» / 5;  prints 1 → the visible case.
     * The answer is the whole list («10 1 7 3» / 100), a single element («7» /
     * 0, «1 2 3» / 0), at the end («1 2 100 101 102») and at the start
     * («1 2 3 100 200»).
     */
    id: "m5.l5.b7",
    type: "write_code",
    skillRefs: ["twopointers.core", "sort.basic", "lists.traverse"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген бүтін сандар (кемінде біреу, ең көбі 200 000), екінші жолда теріс емес бүтін сан d беріледі. Сандардың ең үлкен тобын жинау керек: топтағы ең үлкен сан мен ең кіші санның айырмасы d-дан аспауы тиіс. Ондай топта ең көбі неше сан бола алатынын шығар. Айырма дәл d-ға тең болса, топ жарамды деп саналады. Мысалы, `160 172 158 161 175 159` және d = 3 үшін жауап 4: 158, 159, 160, 161 сандары бір топқа сыяды, өйткені 161 − 158 = 3.\n\nКеңес: алдымен сандарды ретте, содан кейін реттелген тізім бойынша бір терезе жүргіз. Реттелген тізімде терезенің ең кішісі — `a[left]`, ең үлкені — `a[right]`, сондықтан жарамдылық бір ғана азайтумен тексеріледі және терезенің ішін қарап шығудың қажеті жоқ. Баға тек шыққан сан бойынша қойылады: тексеру әдісті көрмейді.",
      ru: "В первой строке даны целые числа через пробел (хотя бы одно, не больше 200 000), во второй — неотрицательное целое число d. Нужно собрать самую большую группу чисел так, чтобы разность между наибольшим и наименьшим числом группы не превышала d. Выведи, сколько чисел может оказаться в такой группе. Если разность ровно равна d, группа считается подходящей. Например, для `160 172 158 161 175 159` и d = 3 ответ 4: числа 158, 159, 160, 161 помещаются в одну группу, потому что 161 − 158 = 3.\n\nСовет: сначала отсортируй числа, а затем проведи по отсортированному списку одно окно. В отсортированном списке наименьшее число окна — это `a[left]`, наибольшее — `a[right]`, поэтому пригодность проверяется одним вычитанием и просматривать внутренность окна не нужно. Оценка ставится только по выведенному числу: проверка метода не видит.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "d = int(input())\n" +
      "a.sort()\n" +
      "n = len(a)\n" +
      "left = 0\n" +
      "best = 0\n" +
      "for right in range(n):\n" +
      "    while a[right] - a[left] > d:\n" +
      "        left = left + 1\n" +
      "    if right - left + 1 > best:\n" +
      "        best = right - left + 1\n" +
      "print(best)",
    cases: [
      { input: "160 172 158 161 175 159\n3", expectedOutput: "4" },
      { input: "10 20 30\n5", expectedOutput: "1" },
      /* Neighbour gaps all fit but the group does not: answers 4 instead of 3. */
      { input: "1 2 3 4\n2", expectedOutput: "3", hidden: true },
      /* d = 0: every equal number still counts, and every distinct one does not. */
      { input: "5 5 5\n0", expectedOutput: "3", hidden: true },
      { input: "1 2 3\n0", expectedOutput: "1", hidden: true },
      /* Unsorted input where skipping the sort answers 4. */
      { input: "9 1 2 3\n2", expectedOutput: "3", hidden: true },
      /* The difference is exactly d: `>=` answers 1 here. */
      { input: "4 8\n4", expectedOutput: "2", hidden: true },
      { input: "7\n0", expectedOutput: "1", hidden: true },
      /* The group is at the very end of the sorted list, then at the very start. */
      { input: "1 2 100 101 102\n2", expectedOutput: "3", hidden: true },
      { input: "1 2 3 100 200\n2", expectedOutput: "3", hidden: true },
      { input: "-5 -4 0 7\n1", expectedOutput: "2", hidden: true },
      /* d is large enough that the answer is the whole list. */
      { input: "10 1 7 3\n100", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m5.l5.b7, not an addition to it. PDF p.6:
     * «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ» —
     * support still meets this problem, and still writes b6 from the blank
     * editor; what is withheld is the second blank editor of the lesson.
     *
     * The prompt states the problem in full and never says «жоғарыдағы есеп»:
     * the support route does not receive b7 at all, and a prompt that described
     * the wrong learner's screen is the defect m2.l1.b8s shipped.
     *
     * The third hole used to be the move of the left edge, `left = ___`, and it
     * was a hole in name only. Its answer is `left + 1`, and `left + 1` sits
     * two lines below it, printed twice, inside `right - left + 1`. The
     * payload-privacy sweep is what named it, but a support learner hunting for
     * something to type would have found it first — and there was nothing to
     * decide there in any case: b1, b2 and b3 all print `left = left + 1`, and
     * b5 is a repair of a program that got that exact line wrong, so on the
     * support route the answer had already been on screen four times before
     * this card was reached.
     *
     * So that line is handed over whole — it is the part b1 and b3 already
     * worked through — and the remaining hole grew to swallow the entire
     * `while` condition. That one is copyable from nowhere: every other window
     * in the lesson tests `a[right] in a[left:right]`, the unsorted check, and
     * this is the only card where sorting has collapsed that scan into a
     * subtraction. It still carries the boundary the old operator hole carried,
     * because a difference of exactly d is a valid group and so the comparison
     * is `>` and not `>=`; on top of that the learner now has to say WHICH two
     * numbers are being subtracted, which is the whole of what the sort bought.
     * Blanking `right - left + 1` instead was the other way out of the leak and
     * it was rejected: b3 traces that expression line by line, so it would have
     * been a recollection rather than a decision.
     *
     * Two holes rather than three is the trade m5.l4.b9s made for the same
     * reason. The filled template is still not b7's reference solution — that
     * one keeps the list length in `n` — and no learner meets both.
     */
    id: "m5.l5.b7s",
    type: "fill_blank",
    skillRefs: ["twopointers.core", "sort.basic"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген бүтін сандар, екінші жолда теріс емес бүтін сан d беріледі. Сандардың ең үлкен тобын жинау керек: топтағы ең үлкен сан мен ең кіші санның айырмасы d-дан аспауы тиіс, ал айырма дәл d-ға тең болса, топ жарамды. Бағдарлама сол топтағы сандардың санын шығарады. Терезенің қаңқасы жазылып қойылған, екі орын бос.\n\nБіріншісі — бүкіл әдіс сүйенетін жол: тізім реттелмей тұрып, терезенің шеттеріндегі сандар оның ішіндегі ең кіші және ең үлкен сан болатынына ешқандай кепілдік жоқ. Екіншісі — `while` циклінің шарты, яғни терезені қашан қысқарту керектігі. Реттелгеннен кейін терезедегі ең кіші сан `left` орнында, ең үлкені `right` орнында тұрады, сондықтан шарт сол екі санның айырмасы туралы болады. Айырма дәл d-ға тең болғанда терезе әлі жарамды екенін ұмытпа — салыстыру белгісі осыған байланысты.",
      ru: "В первой строке даны целые числа через пробел, во второй — неотрицательное целое число d. Нужно собрать самую большую группу чисел так, чтобы разность между наибольшим и наименьшим числом группы не превышала d; если разность ровно равна d, группа подходит. Программа выводит количество чисел в такой группе. Каркас окна уже написан, пустых мест два.\n\nПервое — строка, на которой держится весь метод: пока список не упорядочен, ничто не обещает, что числа на краях окна — это наименьшее и наибольшее числа внутри него. Второе — условие цикла `while`, то есть момент, когда окно пора сжимать. После сортировки наименьшее число окна стоит на позиции `left`, а наибольшее — на позиции `right`, поэтому условие говорит о разности этих двух чисел. Не забудь: при разности ровно d окно ещё пригодно — от этого зависит знак сравнения.",
    },
    template:
      "a = list(map(int, input().split()))\n" +
      "d = int(input())\n" +
      "___\n" +
      "left = 0\n" +
      "best = 0\n" +
      "for right in range(len(a)):\n" +
      "    while ___:\n" +
      "        left = left + 1\n" +
      "    if right - left + 1 > best:\n" +
      "        best = right - left + 1\n" +
      "print(best)",
    blanks: [
      { id: "f1", answer: "a.sort()", alternatives: ["a = sorted(a)"] },
      {
        id: "f2",
        answer: "a[right] - a[left] > d",
        alternatives: ["a[right]-a[left] > d", "d < a[right] - a[left]", "a[right] > a[left] + d"],
      },
    ],
  },
  {
    /*
     * The month's «күрделірек есеп»: sorting, a window, and a boundary decision
     * that is not the same boundary as b7's.
     *
     * Two decisions have to be made and neither can be guessed:
     *   1. `> k` and not `>= k` — a difference exactly equal to k counts, and
     *      «10 20 30 40» / 10 is the case that says so;
     *   2. the window ending at `right` contributes `right - left` pairs and NOT
     *      `right - left + 1`, because a number does not pair with itself. Every
     *      case kills the +1 version, and «7» / 5 kills it on its own.
     * The lesson's earlier cards deliberately never print a pair count, so the
     * arithmetic here is a decision rather than a recollection.
     *
     * The other wrong programs: no sort at all answers 3 on «9 1 2» / 1 and 6 on
     * «5 1 9 3» / 4; counting ordered pairs doubles every answer. A nested loop
     * over all pairs is correct and no output comparison can see it — the prompt
     * says so rather than pretending otherwise (option 2, see the file header).
     *
     * Core gets this card because p.6 gives the core route «қалауы бойынша 1-2
     * күрделірек есеп»; support does not, and support is not given a twin of it,
     * because the twin support does receive is b7s and a second scaffold in the
     * same ten minutes would be the whole lesson twice.
     */
    id: "m5.l5.b8",
    type: "challenge",
    skillRefs: ["twopointers.core", "sort.basic", "loops.counter", "debug.boundary"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда бос орынмен бөлінген бүтін сандар (кемінде біреу, ең көбі 200 000), екінші жолда теріс емес бүтін сан k беріледі. Айырмасы k-дан аспайтын жұптардың санын шығар. Жұп деп әр түрлі екі орында тұрған екі санды айтамыз, ал (i, j) мен (j, i) бір ғана жұп болып саналады. Айырма дәл k-ға тең болса, жұп есептеледі. Мысалы, `1 3 4 9` және k = 2 үшін жауап 2 — бұл (1, 3) және (3, 4) жұптары.\n\nКеңес: алдымен ретте, содан кейін бір терезе жүргіз. Реттелген тізімде `right` орнындағы санға жарамды серіктердің бәрі терезенің ішінде қатар тұрады, ал терезенің сол шекарасы ешқашан артқа қайтпайды. Шекараны дұрыс таңдау мұнда шешуші: терезедегі жаңа жұптарды мұқият сана, сан өз-өзімен жұп құрмайды. Тексеру тек шыққан санды салыстырады.",
      ru: "В первой строке даны целые числа через пробел (хотя бы одно, не больше 200 000), во второй — неотрицательное целое число k. Выведи, сколько существует пар чисел, разность которых не превышает k. Парой считаются числа на двух разных позициях, причём (i, j) и (j, i) — это одна и та же пара. Если разность ровно равна k, пара засчитывается. Например, для `1 3 4 9` и k = 2 ответ 2 — это пары (1, 3) и (3, 4).\n\nСовет: сначала отсортируй, затем проведи одно окно. В отсортированном списке все подходящие партнёры для числа на позиции `right` лежат в окне подряд, а левая граница окна никогда не возвращается назад. Правильный выбор границы здесь решает всё: аккуратно посчитай новые пары в окне — число не образует пару само с собой. Проверка сравнивает только выведенное число.",
    },
    referenceSolution:
      "a = list(map(int, input().split()))\n" +
      "k = int(input())\n" +
      "a.sort()\n" +
      "left = 0\n" +
      "total = 0\n" +
      "for right in range(len(a)):\n" +
      "    while a[right] - a[left] > k:\n" +
      "        left = left + 1\n" +
      "    total = total + (right - left)\n" +
      "print(total)",
    cases: [
      { input: "1 3 4 9\n2", expectedOutput: "2" },
      { input: "1 2 3 4 5 6\n2", expectedOutput: "9" },
      /* One element: `right - left + 1` answers 1 where the truth is 0. */
      { input: "7\n5", expectedOutput: "0", hidden: true },
      /* k = 0 both ways: everything equal, then everything distinct. */
      { input: "5 5 5\n0", expectedOutput: "3", hidden: true },
      { input: "1 2 3\n0", expectedOutput: "0", hidden: true },
      { input: "1 1 2 2\n0", expectedOutput: "2", hidden: true },
      /* Unsorted input: skipping the sort answers 3, then 6. */
      { input: "9 1 2\n1", expectedOutput: "1", hidden: true },
      { input: "5 1 9 3\n4", expectedOutput: "4", hidden: true },
      /* Every gap is exactly k: `>=` answers 0 here. */
      { input: "10 20 30 40\n10", expectedOutput: "3", hidden: true },
      /* k large enough that every pair counts, and negatives. */
      { input: "1 2 3 4\n10", expectedOutput: "6", hidden: true },
      { input: "-3 -1 0 5\n2", expectedOutput: "2", hidden: true },
      /* Five equal numbers: the count grows faster than the list does. */
      { input: "1 1 1 1 1\n0", expectedOutput: "10", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED ONLY, and the month's «шешімді жазбаша қорғау міндетті» (p.6).
     * It is also the only place in this lesson where the method itself is
     * checked by anybody: a teacher reads it. That is option 3 of the authoring
     * contract, and it is why b6, b7 and b8 can state the window as advice
     * without anyone being told a rule was enforced that was not.
     *
     * The three questions are chosen so that none of them can be answered by
     * describing what the code does. The third is the one that separates this
     * lesson from m5.l4: sorting is safe for b7 and b8 and FATAL for b6, and a
     * learner who cannot say why will sort the wrong problem in April.
     *
     * Unmeasured by design: it settles as `unknown` and a teacher reads it.
     */
    id: "m5.l5.b9",
    type: "explain",
    skillRefs: ["twopointers.core", "sort.basic"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Осы сабақта жазған терезеңді жазбаша қорға. Үш сұраққа қысқа жауап бер. (1) Бағдарлама әр `right` үшін бір ғана терезені — дәл сол орында аяқталатын ең ұзынын — қарайды. Ұзынырақ жауап неге назардан тыс қалып қоймайды? (2) `left` артқа қайтса не бұзылар еді және оның қайтуы неге ешқашан қажет емес? (3) Соңғы екі есепте алдымен реттеу жасалды. Реттеу ол екі есептің жауабын неге өзгертпейді, реттеуден кейін терезенің жарамдылығын тексеру неге бір ғана азайтуға айналады — және қайталанбайтын ең ұзын бөлікті іздегенде тізімді реттеуге неге болмайды?",
      ru: "Письменно защити окно, которое ты написал на этом уроке. Ответь коротко на три вопроса. (1) Для каждого `right` программа рассматривает всего одно окно — самое длинное из тех, что заканчиваются на этой позиции. Почему при этом более длинный ответ не проходит мимо? (2) Что сломалось бы, если бы `left` возвращался назад, и почему возвращаться никогда не требуется? (3) В последних двух задачах сначала выполнялась сортировка. Почему она не меняет ответ этих двух задач, почему после неё проверка пригодности окна превращается в одно вычитание — и почему в задаче о самом длинном участке без повторов сортировать список нельзя?",
    },
    expectedPoints: [
      {
        kk: "Кез келген жарамды бөлік бір жерде аяқталады. Бағдарлама әр аяқталу орнын бір рет қарайды және сол орында мүмкін болатын ең ұзын терезені ұстап отырады, сондықтан ең ұзын жауап та қаралған терезелердің бірі болып шығады.",
        ru: "Любой подходящий участок где-то заканчивается. Программа рассматривает каждую позицию окончания ровно один раз и держит для неё самое длинное возможное окно, поэтому и самый длинный ответ оказывается одним из рассмотренных окон.",
      },
      {
        kk: "`left` тастап кеткен орындар қайта қарауға тұрмайды: сол орыннан басталатын терезе сол кезде-ақ жарамсыз болған, ал `right` алға жылжығанда терезеге тек жаңа сандар қосылады — қосу жарамсыз терезені жарамдыға айналдырмайды.",
        ru: "К позициям, которые `left` покинул, возвращаться незачем: окно, начинающееся с такой позиции, уже тогда было непригодным, а при движении `right` вперёд в окно только добавляются новые числа — добавление не делает непригодное окно пригодным.",
      },
      {
        kk: "`left` артқа қайтпағандықтан әр сан терезеге бір рет кіріп, бір рет шығады: екі көрсеткіштің жалпы жүрісі тізімнің ұзындығынан аспайды. Артқа қайту осы кепілдікті жойып, бір ғана сан үшін жұмысты қайта-қайта қайталауға мәжбүр етер еді.",
        ru: "Раз `left` не возвращается, каждое число входит в окно один раз и выходит один раз: суммарный ход обоих указателей не превышает длины списка. Возврат назад разрушил бы эту гарантию и заставил бы повторять работу для одного и того же числа снова и снова.",
      },
      {
        kk: "Соңғы екі есепте сұрақ сандардың орналасу ретіне емес, мәндеріне қатысты: топтың ең үлкені мен ең кішісінің айырмасы да, жұптың айырмасы да сандарды жылжытқаннан өзгермейді, сондықтан реттеу жауапты бұзбайды. Ал реттелген тізімде терезедегі ең кіші сан — `a[left]`, ең үлкені — `a[right]`, сол себепті жарамдылықты тексеру үшін бүкіл терезені қарап шығудың орнына бір азайту жеткілікті. Қайталанбайтын ең ұзын бөлік есебінде керісінше: онда сұрақ дәл ҚАТАР тұрған сандар туралы, реттеу көршілерді ауыстырады және есептің өзін өзгертіп жібереді.",
        ru: "В последних двух задачах вопрос касается не порядка чисел, а их значений: и разность между наибольшим и наименьшим числом группы, и разность внутри пары не меняются от перестановки чисел, поэтому сортировка ответ не портит. А в отсортированном списке наименьшее число окна — это `a[left]`, наибольшее — `a[right]`, и потому вместо просмотра всего окна для проверки хватает одного вычитания. В задаче о самом длинном участке без повторов всё наоборот: там вопрос именно о числах, стоящих ПОДРЯД, сортировка меняет соседей и вместе с ними саму задачу.",
      },
    ],
  },
];
