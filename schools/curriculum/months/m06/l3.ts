import type { LessonBlock } from "../../types";

/**
 * Lesson m6.l3 · «Өзін шақыратын функция» — first contact with recursion.
 * PDF p.9, February. Skills: `recursion.core`, `recursion.call_tree`,
 * `func.return`. 9 minutes.
 *
 * ## The clauses this lesson answers to
 *
 * «…функция дәл сондай, бірақ кішірек есепті шешу үшін өзін-өзі шақыратын
 * тәсілді түсіну» — the month's mastery sentence, and it is a definition, not
 * a slogan. It says two things a fourteen-year-old has to hold at once: the
 * smaller call is *the same problem*, and it is *smaller*. Everything on the
 * first three cards is built to make both halves visible.
 *
 * «Айдың орталық құралы - шақырулар ағашы. Оқушы бағдарламаның қалай тереңдеп,
 * кейін қалай кері қайтатынын көреді.» The going-down and the coming-back-up
 * are the whole lesson. The `recursion_tree` visualiser does not exist yet
 * (`docs/curriculum/RUNTIME_INTEGRATION_REQUIREMENTS.md` §1 — it renders an
 * honest "not ready" card), so `b3` declares it and the weight is carried by
 * `b6`, a `trace_code` whose grid is literally four rows going down and four
 * rows coming back up, with `depth` rising and then falling in front of the
 * learner's own pen.
 *
 * «факториал мен дәрежені өзін-өзі шақыру арқылы есептеу» — the practice
 * family this lesson owns. `b8` is the factorial, `b9` the power.
 *
 * ## Why the trace is not factorial(4)
 *
 * The brief for this lesson asked for a trace of `fact(4)`. The worked example
 * at `b2` already writes every call and every return of `fact(4)` out in full,
 * in order — that is what the programme asks a worked example to be — so a
 * trace of the same thing on the next card is copying from the card above, the
 * defect the first adversarial review found most often. `b6` traces a digit-sum
 * recursion instead: same shape, same depth, a "smaller problem" that is not
 * `n - 1` (it is «санның соңғы цифрсыз бөлігі»), and an answer nothing on
 * screen has given away.
 *
 * ## `**` is banned in b9, and the ban is stated as advice
 *
 * The exercise IS computing the power by repeated multiplication, so `a ** n`
 * deletes it. But output comparison cannot see which operator produced 1024,
 * and neither can it see whether a function was defined at all — the same is
 * true of "write it recursively" on `b8`. Rather than state a rule the product
 * will not enforce (authoring contract §4), both prompts take **option 2**:
 * they name the method as the method being practised, say in both languages
 * that the checker compares only the printed number, and leave it there. The
 * structural work is graded where it can be: `b5`, `b6`, `b7` and `b9s` all ask
 * about the recursion itself rather than about a number it produced, and `b10`
 * takes **option 3** for the advanced route — a written defence of `power`,
 * read by a teacher, which is also «шешімді жазбаша қорғау міндетті» (p.6).
 *
 * What the case sets CAN see, they do: every solution here is killed on `n = 0`
 * if its stopping condition was transcribed from `b2` (`if n == 1`), which is
 * the single most likely wrong program in the lesson and the reason `0` is
 * hidden in both tasks.
 *
 * ## Deliberately left for later lessons
 *
 * The stopping condition gets one sentence here and no card of its own: it is
 * `m6.l4`'s whole subject («Тоқтату шарты»), including infinite recursion as a
 * diagnosable failure. Generating variants by recursion is `m6.l6`. Nothing in
 * this file imports anything, and no reference solution uses `**`.
 */

const P = 9; // PDF page for all of February

export const M6_L3: LessonBlock[] = [
  {
    /*
     * The first program in the month that calls itself, and it deliberately
     * returns NOTHING. «Тереңдеп, кейін кері қайту» is easier to see when the
     * only thing coming back up is the program counter: the second `print` runs
     * after the inner call has finished, and that is the entire idea. Return
     * values arrive one card later, on the factorial, where they carry weight.
     *
     * Tokens are English (`down` / `up`) and both languages name them, per the
     * output-token rule — a Kazakh word here would let a Russian-track learner
     * match glyphs instead of reasoning.
     */
    id: "m6.l3.b1",
    type: "concept",
    skillRefs: ["recursion.core", "func.define"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Функция өзін-өзі шақыра ала ма?",
      ru: "Может ли функция вызвать саму себя?",
    },
    body: {
      kk: "Функция басқа функцияны шақыра алатынын қарашада көрдік. Ал функция дәл өзін шақырса ше? Егер ол өзін дәл сондай, бірақ кішірек есеппен шақырса, бұл — қате емес, тәсіл. Оны рекурсия дейді.\n\nТөмендегі `dive` функциясы үш нәрсе істейді: `down` белгісін өзінің `n` санымен бірге шығарады, сосын өзін бір кіші санмен шақырады, ең соңында `up` белгісін шығарады. `down` және `up` — ағылшын белгілері, бағдарлама басқа сөз шығармайды.\n\nЭкранда алдымен үш `down` жолы, содан кейін үш `up` жолы пайда болады. Мұндағы ең маңыздысы осы: `up` жолы ішкі шақыру толық аяқталмайынша орындалмайды. Шақырылған функция жұмысын бітіргенше, оны шақырған функция сол жерде тұрып күтеді. Сондықтан бағдарлама алдымен ең түбіне дейін тереңдейді, сосын біртіндеп кері қайтады.",
      ru: "В ноябре мы видели, что функция может вызвать другую функцию. А может ли она вызвать саму себя? Если она вызывает себя с такой же, но меньшей задачей — это не ошибка, а приём. Его называют рекурсией.\n\nФункция `dive` ниже делает три вещи: печатает метку `down` вместе со своим числом `n`, затем вызывает саму себя с числом на единицу меньше, и только в самом конце печатает метку `up`. Слова `down` и `up` — английские метки, других слов программа не выводит.\n\nНа экране сначала появятся три строки `down`, а потом три строки `up`. Самое важное здесь вот что: строка с `up` не выполнится, пока внутренний вызов не завершится полностью. Пока вызванная функция не закончила работу, вызвавшая её функция стоит на месте и ждёт. Поэтому программа сначала уходит вглубь до самого дна, а потом постепенно возвращается обратно.",
    },
    code:
      "def dive(n):\n" +
      '    print("down", n)\n' +
      "    if n > 0:\n" +
      "        dive(n - 1)\n" +
      '    print("up", n)\n' +
      "\n" +
      "dive(2)",
  },
  {
    /*
     * «Толық талданған мысалдар» applied to the family the PDF names first:
     * «факториал … өзін-өзі шақыру арқылы есептеу». The reasoning is one move
     * per step, and steps 3 and 4 exist because they are the month's central
     * tool written as prose — every call in the order it happens, then every
     * return in the order it comes back.
     *
     * The stopping condition here is `n == 1`, which is true for the factorial
     * as this example states it (4! down to 1!) and NOT enough for b8, where
     * the input may be 0. That is not a trap: b8's prompt says 0! = 1 in both
     * languages, and a learner who transcribes this program discovers on a
     * hidden case that a stopping condition is a decision, not a decoration.
     * It is the bridge to m6.l4.
     */
    id: "m6.l3.b2",
    type: "worked_example",
    skillRefs: ["recursion.core", "recursion.call_tree", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Толық талданған мысал: 4! рекурсиямен",
      ru: "Разобранный пример: 4! через рекурсию",
    },
    problem: {
      kk: "Факториал деп 1-ден n-ге дейінгі барлық бүтін сандардың көбейтіндісін айтады: 4! = 1 · 2 · 3 · 4 = 24. Осы 24-ті циклмен емес, өзін-өзі шақыратын функциямен есептеп көрейік.",
      ru: "Факториалом называют произведение всех целых чисел от 1 до n: 4! = 1 · 2 · 3 · 4 = 24. Посчитаем эти 24 не циклом, а функцией, которая вызывает саму себя.",
    },
    steps: [
      {
        kk: "Бірінші қадам — үлкен есепті дәл сондай, бірақ кішірек есепке келтіру. 4! = 4 · 3!. Демек 4! есебі 3! есебінен бір-ақ көбейтуге алшақ тұр.",
        ru: "Первый шаг — свести большую задачу к такой же, но меньшей. 4! = 4 · 3!. Значит, задача 4! отстоит от задачи 3! ровно на одно умножение.",
      },
      {
        kk: "Дәл сол ереже әрі қарай да жүреді: 3! = 3 · 2!, ал 2! = 2 · 1!. Бірақ тізбек бір жерде тоқтауы керек, әйтпесе шақырулар шексіз жалғасады. Тоқтайтын жер — 1! = 1: бұл жауапты ешкімнен сұрамай-ақ білеміз.",
        ru: "Дальше действует то же правило: 3! = 3 · 2!, а 2! = 2 · 1!. Но цепочка должна где-то остановиться, иначе вызовы пойдут бесконечно. Место остановки — 1! = 1: этот ответ мы знаем, ни у кого не спрашивая.",
      },
      {
        kk: "Шақырулар төмен қарай осы ретпен жасалады: fact(4) → fact(3) → fact(2) → fact(1). Ең түбіне жеткен сәтте алғашқы үшеуі әлі аяқталған жоқ — үшеуі де өз жауабын күтіп тұр.",
        ru: "Вниз вызовы идут в таком порядке: fact(4) → fact(3) → fact(2) → fact(1). В момент, когда достигнуто дно, первые три ещё не закончились — все три ждут своего ответа.",
      },
      {
        kk: "Енді нәтижелер кері қайта бастайды, ең тереңдегіден бастап: fact(1) 1-ді қайтарады; оны күтіп тұрған fact(2) 2 · 1 = 2-ні қайтарады; fact(3) 3 · 2 = 6-ны қайтарады; ең сыртқы fact(4) 4 · 6 = 24-ті қайтарады.",
        ru: "Теперь результаты начинают возвращаться, начиная с самого глубокого: fact(1) возвращает 1; ждавший его fact(2) возвращает 2 · 1 = 2; fact(3) возвращает 3 · 2 = 6; самый внешний fact(4) возвращает 4 · 6 = 24.",
      },
      {
        kk: "Кодта `if` — тоқтайтын жер, ал `return n * fact(n - 1)` — сол бір қадам. Көбейтуге назар аудар: ол ішкі шақыру нәтиже қайтарғаннан кейін ғана орындалады, өйткені `n *` бөлігінің көбейтетін заты әлі жоқ.",
        ru: "В коде `if` — это место остановки, а `return n * fact(n - 1)` — тот самый один шаг. Обрати внимание на умножение: оно выполняется только после того, как внутренний вызов вернул результат, ведь части `n *` пока не на что умножать.",
      },
    ],
    code:
      "def fact(n):\n" +
      "    if n == 1:\n" +
      "        return 1\n" +
      "    return n * fact(n - 1)\n" +
      "\n" +
      "print(fact(4))",
    result: {
      kk: "`print(fact(4))` экранға 24 шығарады. Барлығы төрт шақыру жасалды және төрт нәтиже қайтты.",
      ru: "`print(fact(4))` выводит на экран 24. Всего было сделано четыре вызова и вернулось четыре результата.",
    },
  },
  {
    /*
     * «Айдың орталық құралы - шақырулар ағашы», declared so it lights up the
     * day the visualiser exists; until then the learner meets the honest
     * placeholder and the prompt's last sentence, which sends them to paper.
     *
     * Not an attempt block: watching a tree unfold is not evidence about
     * anything, and b5, b6 and b10 are where the tree is actually graded. The
     * argument is 4 — the same call the worked example just walked — because
     * the point of this card is to see the SHAPE of what was just read as
     * prose. The two questions it asks (which call is deepest, how many are
     * waiting at that moment) are the two the worked example does not answer.
     */
    id: "m6.l3.b3",
    type: "visual_simulation",
    skillRefs: ["recursion.call_tree"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    simulation: "recursion_tree",
    prompt: {
      kk: "Шақырулар ағашын қадамдап жүргіз. Әр жаңа шақыру — төмен қарай бір бұтақ, ал әр нәтиже — сол бұтақпен жоғары қарай көтерілу. Келесі қадамды баспас бұрын өзің айтып ал: дәл қазір қай шақыру ең тереңде тұр және сол сәтте нәтиже күтіп тұрған неше шақыру бар? Егер анимация ашылмаса, дәл сол ағашты дәптеріңе сал: жоғарыдан төмен — шақырулар, төменнен жоғары — нәтижелер.",
      ru: "Прогони дерево вызовов по шагам. Каждый новый вызов — это ветка вниз, а каждый результат — подъём по той же ветке вверх. Прежде чем нажать следующий шаг, скажи сам: какой вызов сейчас самый глубокий и сколько вызовов в этот момент ждут результата? Если анимация не открылась, нарисуй это же дерево в тетради: сверху вниз — вызовы, снизу вверх — результаты.",
    },
    config: {
      function: "fact",
      definition: "fact(n) = n * fact(n - 1); fact(1) = 1",
      argument: 4,
      show: ["call", "return", "depth"],
      askBeforeStep: true,
    },
  },
  {
    /*
     * Cheap, immediate and diagnostic, on a function that is NOT the factorial:
     * the same shape with `+` instead of `*`, so the learner has to run the
     * chain themselves rather than recall 24.
     *
     * Distractors: 14 is the chain stopped one step early (5+4+3+2), 120 is 5!
     * — multiplication instead of addition — and 5 is "the function returns its
     * argument". Only 14 is mapped: 120 can also be picked by a learner who
     * simply believes recursion means factorial after the previous card, and 5
     * can come from at least two different readings. Two causes means the
     * engine should ask, not tell.
     */
    id: "m6.l3.b4",
    type: "prediction",
    skillRefs: ["recursion.core", "func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "`total(1)` бірді қайтарады, ал басқа n үшін `total(n)` мәні — n мен `total(n - 1)` нәтижесінің қосындысы. Бағдарлама нені шығарады? Ең түпкі шақырудан бастап кері қарай есептеп шық.",
      ru: "`total(1)` возвращает единицу, а для остальных n значение `total(n)` — это сумма n и результата `total(n - 1)`. Что выведет программа? Посчитай, начиная с самого глубокого вызова и двигаясь обратно.",
    },
    code:
      "def total(n):\n" +
      "    if n == 1:\n" +
      "        return 1\n" +
      "    return n + total(n - 1)\n" +
      "\n" +
      "print(total(5))",
    answer: "15",
    options: ["15", "14", "5", "120"],
    diagnosticMapping: {
      "14": {
        failureClass: "recursion_stops_one_step_early",
        justification:
          "14 = 5 + 4 + 3 + 2. Бұл сан тізбек 1-ге жетпей, 2-де тоқтағанда ғана шығады — яғни ең түпкі шақырудың қайтаратын мәні есепке қосылмаған. Басқа жолмен дәл 14 алынбайды.",
      },
    },
  },
  {
    /*
     * The lesson's own question, asked about the function the learner has just
     * predicted the output of — so the code is not reprinted here: repeating a
     * program a card later is transcription, and the definition fits in one
     * sentence.
     *
     * The options are the RETURNED VALUES in order, not the call names. For a
     * chain like this the call names come back in ascending order of argument
     * anyway, so a name-ordering question could be answered correctly by the
     * wrong rule ("smallest first"). Values cannot: 1, 3, 6, 10, 15 requires
     * the learner to know that each waiting call adds its own n to what came
     * back from below.
     *
     * o2 is the exact reverse — right values, wrong direction — which is only
     * reachable by believing the outer call finishes first, so it is mapped.
     * o3 («5, 4, 3, 2, 1») is left unmapped on purpose: it can mean "the
     * function returns its argument" or "I listed the arguments of the calls",
     * and those are different misunderstandings.
     */
    id: "m6.l3.b5",
    type: "multiple_choice",
    skillRefs: ["recursion.call_tree", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Алдыңғы карточкадағы `total` функциясын алайық: `total(1)` бірді қайтарады, ал басқа n үшін `total(n)` = n + `total(n - 1)`. `total(5)` шақырылғанда шақырулар total(5) → total(4) → total(3) → total(2) → total(1) ретімен жасалады. Ал нәтижелер қандай ретпен және қандай мәндермен қайтады?",
      ru: "Возьмём функцию `total` с предыдущей карточки: `total(1)` возвращает единицу, а для остальных n `total(n)` = n + `total(n - 1)`. При вызове `total(5)` вызовы идут в порядке total(5) → total(4) → total(3) → total(2) → total(1). А в каком порядке и с какими значениями возвращаются результаты?",
    },
    options: [
      { id: "o1", label: { kk: "1, 3, 6, 10, 15", ru: "1, 3, 6, 10, 15" } },
      { id: "o2", label: { kk: "15, 10, 6, 3, 1", ru: "15, 10, 6, 3, 1" } },
      { id: "o3", label: { kk: "5, 4, 3, 2, 1", ru: "5, 4, 3, 2, 1" } },
      { id: "o4", label: { kk: "5, 9, 12, 14, 15", ru: "5, 9, 12, 14, 15" } },
    ],
    correctOptionId: "o1",
    diagnosticMapping: {
      o2: {
        failureClass: "outer_call_returns_first",
        justification:
          "Мәндері дұрыс, реті керісінше. Дәл осы тізбекті таңдау — қосындының қалай жиналатынын түсінген, бірақ ең сыртқы шақыру ішкі шақыру аяқталғанша нәтиже бере алады деп ойлаған оқушының жауабы.",
      },
    },
  },
  {
    /*
     * The month's central tool, carried by the block type that actually works
     * today (RUNTIME_INTEGRATION_REQUIREMENTS §1). The programme's own sentence
     * — «оқушы бағдарламаның қалай тереңдеп, кейін қалай кері қайтатынын
     * көреді» — is what this grid IS: four rows at line 2 with `depth` rising
     * 0→3, then four rows at line 7 with `depth` falling 3→0. The number 4926
     * is ours; every digit is different and no two returned values collide, so
     * a learner cannot fill a row by copying the row above it.
     *
     * `depth` takes no part in the arithmetic and the prompt says so. It is
     * there because "how deep are we" is the question the month is about, and a
     * parameter is the only honest way to put it on screen without printing it.
     *
     * The smaller problem here is deliberately not `n - 1`: «дәл сондай, бірақ
     * кішірек» is about the SHAPE of the problem, and stripping the last digit
     * makes that point better than subtracting one.
     */
    id: "m6.l3.b6",
    type: "trace_code",
    skillRefs: ["recursion.call_tree", "recursion.core", "arith.remainder", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "`digit_sum` санның цифрларының қосындысын табады: соңғы цифрды `n % 10` арқылы бөліп алады да, қалған бөлігін `n // 10` етіп өзіне береді. `depth` параметрі есептеуге қатыспайды — ол шақырудың қаншалықты тереңде тұрғанын көрсету үшін ғана қосылған.\n\nКестені толтыр. 2-жол — жаңа шақыру жаңа ғана басталған сәт: сол сәттегі `n` мен `depth` мәндерін жаз. 7-жол — шақыру нәтижесін қайтарып жатқан сәт: `n`, `depth` және `answer` мәндерін жаз. Кестенің бірінші жартысы — төмен қарай тереңдеу, екінші жартысы — кері қайту. `depth` алдымен қалай өсіп, сосын қалай кемитініне қара.",
      ru: "`digit_sum` находит сумму цифр числа: последнюю цифру он отделяет через `n % 10`, а оставшуюся часть `n // 10` передаёт самому себе. Параметр `depth` не участвует в вычислении — он добавлен только чтобы показать, насколько глубоко находится вызов.\n\nЗаполни таблицу. Строка 2 — момент, когда новый вызов только начался: запиши значения `n` и `depth` в этот момент. Строка 7 — момент, когда вызов возвращает результат: запиши `n`, `depth` и `answer`. Первая половина таблицы — углубление вниз, вторая — возврат обратно. Посмотри, как `depth` сначала растёт, а потом убывает.",
    },
    code:
      "def digit_sum(n, depth):\n" +
      "    if n < 10:\n" +
      "        answer = n\n" +
      "    else:\n" +
      "        rest = digit_sum(n // 10, depth + 1)\n" +
      "        answer = n % 10 + rest\n" +
      "    return answer\n" +
      "\n" +
      "print(digit_sum(4926, 0))",
    steps: [
      { line: 2, vars: { n: "4926", depth: "0" } },
      { line: 2, vars: { n: "492", depth: "1" } },
      { line: 2, vars: { n: "49", depth: "2" } },
      { line: 2, vars: { n: "4", depth: "3" } },
      { line: 7, vars: { n: "4", depth: "3", answer: "4" } },
      { line: 7, vars: { n: "49", depth: "2", answer: "13" } },
      { line: 7, vars: { n: "492", depth: "1", answer: "15" } },
      { line: 7, vars: { n: "4926", depth: "0", answer: "21" } },
    ],
  },
  {
    /*
     * «Дайын кодты толықтыру» for every route, not only support — and on a
     * third shape again, so that neither blank is a line the learner has seen.
     * The recursion walks a list by index, which is the shape m6.l6 builds on;
     * the stopping condition is given, because it belongs to m6.l4 and giving
     * it here keeps the two blanks on exactly what this lesson teaches: the
     * value this step contributes, and the same problem one step smaller.
     *
     * `nums` and the parameter `a` are different names on purpose — a learner
     * who thinks the function reads the outer list rather than its parameter
     * has a real misunderstanding, and shadowing would hide it.
     */
    id: "m6.l3.b7",
    type: "fill_blank",
    skillRefs: ["recursion.core", "func.return", "lists.index", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген бүтін сандар беріледі. `tail_sum(a, i)` функциясы `a` тізімінің `i` орнынан бастап соңына дейінгі сандардың қосындысын қайтарады. Тоқтау шарты дайын: `i` тізім ұзындығына жетсе, қосылатын сан қалмайды, сондықтан 0 қайтады. Соңғы жолды толықтыр: осы қадамдағы сан және дәл сондай, бірақ бір қадам кішірек есептің жауабы.",
      ru: "В одной строке через пробел даны целые числа. Функция `tail_sum(a, i)` возвращает сумму чисел списка `a` от позиции `i` и до конца. Условие остановки уже готово: если `i` дошёл до длины списка, складывать больше нечего, поэтому возвращается 0. Дополни последнюю строку: число этого шага и ответ такой же, но на один шаг меньшей задачи.",
    },
    template:
      "def tail_sum(a, i):\n" +
      "    if i == len(a):\n" +
      "        return 0\n" +
      "    return ___ + ___\n" +
      "\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(tail_sum(nums, 0))",
    blanks: [
      { id: "f1", answer: "a[i]" },
      { id: "f2", answer: "tail_sum(a, i + 1)", alternatives: ["tail_sum(a, i+1)"] },
    ],
  },
  {
    /*
     * PDF p.9: «факториал … өзін-өзі шақыру арқылы есептеу».
     *
     * The unenforceable half — "write it recursively" — is stated as the method
     * being practised and NOT as a rule, and the prompt says in both languages
     * that the checker compares the printed number (authoring contract §4,
     * option 2). A loop passes, and a learner is not told otherwise.
     *
     * The enforceable half is the stopping condition, and it is where the cases
     * do real work:
     *   · the program transcribed from b2 (`if n == 1`) recurses forever on 0
     *     → killed by the hidden "0";
     *   · `print(n)` or `print(n * (n - 1))` → killed by the visible "5";
     *   · a stop at `n == 2` → killed by the visible "1";
     *   · a product that runs 1..n-1 → killed by "5" and "12".
     * "12" is also the largest value the prompt allows, so the boundary of the
     * stated range is tested rather than described.
     */
    id: "m6.l3.b8",
    type: "write_code",
    skillRefs: ["recursion.core", "func.define", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір бүтін сан n беріледі (0 ≤ n ≤ 12). n! мәнін шығар. Факториал — 1-ден n-ге дейінгі сандардың көбейтіндісі, ал 0! = 1 деп келісілген. Осы сабақтың тәсілімен — өзін-өзі шақыратын функциямен — жаз. Тексеруші тек шыққан санды салыстырады, сондықтан бұл міндетті ереже емес, кеңес; бірақ ай соңындағы сынақта дәл осы тәсіл сұралады.",
      ru: "Дано одно целое число n (0 ≤ n ≤ 12). Выведи значение n!. Факториал — это произведение чисел от 1 до n, а 0! по договорённости равен 1. Напиши это приёмом сегодняшнего урока — функцией, которая вызывает саму себя. Проверяющая программа сравнивает только выведенное число, так что это совет, а не обязательное правило; но на проверке в конце месяца спросят именно этот приём.",
    },
    referenceSolution:
      "def fact(n):\n" +
      "    if n == 0:\n" +
      "        return 1\n" +
      "    return n * fact(n - 1)\n" +
      "\n" +
      "n = int(input())\n" +
      "print(fact(n))",
    cases: [
      { input: "5", expectedOutput: "120" },
      { input: "1", expectedOutput: "1" },
      { input: "0", expectedOutput: "1", hidden: true },
      { input: "2", expectedOutput: "2", hidden: true },
      { input: "3", expectedOutput: "6", hidden: true },
      { input: "12", expectedOutput: "479001600", hidden: true },
    ],
  },
  {
    /*
     * PDF p.9: «дәрежені өзін-өзі шақыру арқылы есептеу».
     *
     * THE REFERENCE SOLUTION MUST NOT USE `**`, and it does not. Computing the
     * power BY RECURSION is the whole exercise; `a ** n` produces the same
     * number in one character and leaves nothing to learn. `**` has been legal
     * Python since September, so no checker in this repository will stop a
     * learner using it — which is exactly why the prompt says so in words
     * instead of pretending a rule is enforced (authoring contract §4).
     *
     * Degenerate programs and the cases that kill them:
     *   · `print(a * n)` → "2 10" gives 20, not 1024 (visible);
     *   · a stop at `n == 1` returning a → "5 0" recurses forever (hidden);
     *   · a solution that loses the sign of a negative base → "-2 3" (hidden);
     *   · a solution that returns 0 at the bottom → every case;
     *   · "-1 20" pins the even-exponent case, where the sign must cancel.
     * `a ** n` is NOT killable by any case and is not claimed to be.
     */
    id: "m6.l3.b9",
    type: "write_code",
    skillRefs: ["recursion.core", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: a және n (|a| ≤ 10, 0 ≤ n ≤ 20). a-ның n-дәрежесін шығар, яғни a-ны өзіне n рет көбейт; n = 0 болғанда жауап 1. Мұны да өзін-өзі шақыратын функциямен жаз: a-ның n-дәрежесі — a мен a-ның (n − 1)-дәрежесінің көбейтіндісі. `**` операторын қолданба: ол жауапты бірден беріп, тапсырманың өзін жойып жібереді. Тексеруші тек шыққан санды салыстыратынын білесің — демек бұл сенің адалдығыңа қалдырылған кеңес.",
      ru: "В одной строке через пробел даны два целых числа: a и n (|a| ≤ 10, 0 ≤ n ≤ 20). Выведи a в степени n, то есть умножь a на себя n раз; при n = 0 ответ равен 1. Это тоже напиши функцией, которая вызывает саму себя: a в степени n — это произведение a и a в степени (n − 1). Не используй оператор `**`: он выдаёт ответ сразу и уничтожает саму задачу. Ты знаешь, что проверяющая программа сравнивает только выведенное число, — значит, это совет, оставленный на твою честность.",
    },
    referenceSolution:
      "def power(a, n):\n" +
      "    if n == 0:\n" +
      "        return 1\n" +
      "    return a * power(a, n - 1)\n" +
      "\n" +
      "a, n = map(int, input().split())\n" +
      "print(power(a, n))",
    cases: [
      { input: "2 10", expectedOutput: "1024" },
      { input: "7 1", expectedOutput: "7" },
      { input: "5 0", expectedOutput: "1", hidden: true },
      { input: "-2 3", expectedOutput: "-8", hidden: true },
      { input: "-1 20", expectedOutput: "1", hidden: true },
      { input: "3 5", expectedOutput: "243", hidden: true },
      { input: "10 6", expectedOutput: "1000000", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m6.l3.b9 — the same problem, the same input
     * format, the same output, assembled instead of written (PDF p.6:
     * «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ»).
     *
     * Indentation does not solve it. Four lines sit at zero indent and two at
     * one level, so the learner still has to decide (a) that the function must
     * be defined before the line that calls it, (b) that reading comes before
     * calling and calling before printing, and (c) that the stopping check
     * comes before the line that calls again — which is the one decision with a
     * real consequence: put `return a * power(...)` first and the function
     * never stops.
     *
     * The assembled program keeps the result in `ans` before printing it, so it
     * is not byte-identical to b9's reference solution either. No learner
     * receives both cards, but a support learner who later moves to the core
     * route should not meet the same text twice.
     */
    id: "m6.l3.b9s",
    type: "reorder_code",
    skillRefs: ["recursion.core", "func.parameters", "func.return"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Жолдарды дұрыс ретке қой. Бағдарлама бір жолда бос орынмен бөлінген екі бүтін санды оқиды: a және n (|a| ≤ 10, 0 ≤ n ≤ 20), сосын a-ның n-дәрежесін шығарады. Есеп өзін-өзі шақыратын `power` функциясымен шешілген: дәреже нөлге тең болса, жауап — 1, ал басқа жағдайда жауап — a мен бір кіші дәреженің көбейтіндісі. Негізгі бағдарламада үш жол бар: екі санды оқу, `power`-ды шақырып нәтижені `ans` айнымалысына сақтау және `ans`-ті шығару.",
      ru: "Расставь строки по порядку. Программа читает из одной строки два целых числа через пробел: a и n (|a| ≤ 10, 0 ≤ n ≤ 20), а затем выводит a в степени n. Задача решена функцией `power`, которая вызывает саму себя: если степень равна нулю, ответ — 1, а иначе ответ — произведение a и степени на единицу меньшей. В основной программе три строки: чтение двух чисел, вызов `power` с сохранением результата в переменную `ans` и вывод `ans`.",
    },
    lines: [
      { id: "q1", code: "def power(a, n):" },
      { id: "q2", code: "    if n == 0:" },
      { id: "q3", code: "        return 1" },
      { id: "q4", code: "    return a * power(a, n - 1)" },
      { id: "q5", code: "a, n = map(int, input().split())" },
      { id: "q6", code: "ans = power(a, n)" },
      { id: "q7", code: "print(ans)" },
    ],
    correctOrder: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"],
  },
  {
    /*
     * Option 3 from the authoring contract §4, and «шешімді жазбаша қорғау
     * міндетті» (p.6) for the advanced route: the structural claims no checker
     * can see — what the function takes, what it returns, when the
     * multiplication happens — are sent to a human instead of being asserted as
     * rules. It is also February's own assessment sentence rehearsed one lesson
     * early: «салынған ағаш бойынша шақыру ретін түсіндіру».
     *
     * Advanced only, and it names `power`, which the advanced route does
     * receive (b9). Three short answers, not four: this is a nine-minute lesson
     * and the written defence has to fit inside it.
     *
     * Never machine-scored. The verdict for this block settles as `unknown` and
     * a teacher reads it.
     */
    id: "m6.l3.b10",
    type: "explain",
    skillRefs: ["recursion.call_tree", "recursion.core", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Жаңа ғана жазған `power` функцияңды жазбаша қорғап шық. Үш сұраққа қысқа жауап жаз: (1) функция қандай мәндерді қабылдайды және нақты нені қайтарады? (2) `power(2, 3)` шақырылғанда шақырулар қандай ретпен жасалады, ал нәтижелер қандай ретпен әрі қандай мәндермен қайтады? (3) көбейту қай сәтте орындалады — ішкі шақыруға дейін бе, әлде ол нәтиже қайтарғаннан кейін бе? Жауабыңды мұғалім оқиды.",
      ru: "Защити письменно функцию `power`, которую ты только что написал. Ответь коротко на три вопроса: (1) какие значения функция принимает и что именно она возвращает? (2) в каком порядке идут вызовы при `power(2, 3)` и в каком порядке и с какими значениями возвращаются результаты? (3) в какой момент выполняется умножение — до внутреннего вызова или после того, как он вернул результат? Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "`power(a, n)` екі бүтін санды қабылдайды және a-ның n-дәрежесін сан ретінде қайтарады — экранға шығармайды, шығаруды негізгі бағдарлама істейді.",
        ru: "`power(a, n)` принимает два целых числа и возвращает число — a в степени n; на экран она ничего не выводит, выводом занимается основная программа.",
      },
      {
        kk: "Шақырулар: power(2, 3) → power(2, 2) → power(2, 1) → power(2, 0). Барлығы төртеу, ал соңғысы ешкімді шақырмайды.",
        ru: "Вызовы: power(2, 3) → power(2, 2) → power(2, 1) → power(2, 0). Всего их четыре, и последний уже никого не вызывает.",
      },
      {
        kk: "Нәтижелер кері ретпен қайтады: алдымен 1, содан кейін 2, сосын 4, ең соңында 8.",
        ru: "Результаты возвращаются в обратном порядке: сначала 1, затем 2, потом 4 и в самом конце 8.",
      },
      {
        kk: "Көбейту ішкі шақыру нәтиже қайтарғаннан кейін ғана орындалады: оған дейін сыртқы шақырудың көбейтетін заты жоқ, сондықтан ол күтіп тұрады.",
        ru: "Умножение выполняется только после того, как внутренний вызов вернул результат: до этого внешнему вызову не на что умножать, поэтому он ждёт.",
      },
    ],
  },
];
