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
 * ## What recursion costs in C++, stated where it is first needed
 *
 * A recursive function in C++ is a November function that happens to use its
 * own name. Two November rules do all the work and `b1` says both out loud:
 *
 * - **A declared return type.** `int fact(int n)` — the type comes first, and
 *   it is the type of what the function hands BACK, not of what it takes.
 * - **Definition before use.** The function is written above `main`, exactly
 *   as in November. A function may use its OWN name inside its own body
 *   without anything extra, because by the time the compiler reads the body it
 *   has already read the header line. (Two functions that call each other need
 *   more than that, and no block in this month does.)
 *
 * ## The bounds, re-derived for C++ rather than carried over
 *
 * Python's integers grow without limit; C++'s do not, and both graded tasks
 * here produce numbers that grow fast:
 *
 * - `b8`, the factorial, keeps 0 ≤ n ≤ 12 and stays on `int`. 12! is
 *   479 001 600 and 13! is 6 227 020 800 — over `int` by a factor of three, so
 *   12 is not a round number, it is the last one that fits.
 * - `b9`, the power, had 0 ≤ n ≤ 20 in the Python course, where 10²⁰ printed
 *   fine. It does not fit anything C++ has: `long long` stops at about
 *   9 · 10¹⁸. The bound is now **0 ≤ n ≤ 18** with `long long` throughout, so
 *   the largest legal answer is 10¹⁸ and it is a hidden case. The one case
 *   that had to move is `-1 20` → `-1 18`; it still tests the even exponent.
 *
 * Recursion depth is a non-issue in both: `fact` goes 12 deep and `power` 18.
 *
 * ## `**` does not exist, and the ban it carried had to be re-authored
 *
 * The Python prompt for `b9` forbade `a ** n`, because that operator deletes
 * the exercise. C++ has no `**` at all, so the warning would be noise. What it
 * has instead is `pow()` from `<cmath>`, which is a genuine trap rather than a
 * shortcut: it computes in `double`, and a `double` carries about fifteen
 * significant digits, so `pow(10, 18)` is not guaranteed to print the integer
 * a learner expects. The prompt now warns about that — a true statement about
 * the language, in place of a translated one that was not.
 *
 * The unenforceable half is unchanged: no checker can see whether a function
 * was defined at all, so both prompts take **option 2** — they name the method
 * as the method being practised, say in both languages that the checker
 * compares only the printed number, and leave it there. `b5`, `b6`, `b7` and
 * `b9s` grade the recursion itself rather than a number it produced, and `b10`
 * takes **option 3** for the advanced route — a written defence of `power`,
 * read by a teacher, which is also «шешімді жазбаша қорғау міндетті» (p.6).
 *
 * What the case sets CAN see, they do: every solution here is killed on `n = 0`
 * if its stopping condition was transcribed from `b2` (`if (n == 1)`), which is
 * the single most likely wrong program in the lesson and the reason `0` is
 * hidden in both tasks.
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
 * ## Deliberately left for later lessons
 *
 * The stopping condition gets one sentence here and no card of its own: it is
 * `m6.l4`'s whole subject («Тоқтату шарты»), including runaway recursion as a
 * diagnosable failure. Generating variants by recursion is `m6.l6`. No block
 * here includes anything beyond `<iostream>` and `<vector>`.
 */

const P = 9; // PDF page for all of February

export const M6_L3: LessonBlock[] = [
  {
    /*
     * The first program in the month that calls itself, and it deliberately
     * returns NOTHING — `void`, which November taught. «Тереңдеп, кейін кері
     * қайту» is easier to see when the only thing coming back up is the program
     * counter: the second `cout` runs after the inner call has finished, and
     * that is the entire idea. Return values arrive one card later, on the
     * factorial, where they carry weight.
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
      kk: "Функция басқа функцияны шақыра алатынын қарашада көрдік. Ал функция дәл өзін шақырса ше? Егер ол өзін дәл сондай, бірақ кішірек есеппен шақырса, бұл — қате емес, тәсіл. Оны рекурсия дейді.\n\nЖаңа ереже жоқ: бұл — қарашадағы функцияның дәл өзі. Екі талап сол күйінде қалады. Біріншісі — қайтаратын түрі жазылуы керек: `void dive(int n)` дегендегі `void` — «бұл функция ешнәрсе қайтармайды» дегені. Екіншісі — функция өзін пайдаланатын жолдан ЖОҒАРЫ тұруы керек, сондықтан ол `main`-нен бұрын жазылады. Функцияның өз атын өз денесінің ішінде қолдануына ештеңе кедергі емес: компилятор дененің ішіне жеткенде тақырып жолын оқып қойған болады.\n\nТөмендегі `dive` функциясы үш нәрсе істейді: `down` белгісін өзінің `n` санымен бірге шығарады, сосын өзін бір кіші санмен шақырады, ең соңында `up` белгісін шығарады. `down` және `up` — ағылшын белгілері, бағдарлама басқа сөз шығармайды.\n\nЭкранда алдымен үш `down` жолы, содан кейін үш `up` жолы пайда болады. Мұндағы ең маңыздысы осы: `up` жолы ішкі шақыру толық аяқталмайынша орындалмайды. Шақырылған функция жұмысын бітіргенше, оны шақырған функция сол жерде тұрып күтеді. Сондықтан бағдарлама алдымен ең түбіне дейін тереңдейді, сосын біртіндеп кері қайтады.",
      ru: "В ноябре мы видели, что функция может вызвать другую функцию. А может ли она вызвать саму себя? Если она вызывает себя с такой же, но меньшей задачей — это не ошибка, а приём. Его называют рекурсией.\n\nНового правила тут нет: это в точности ноябрьская функция. Оба требования остаются прежними. Первое — нужно написать тип возвращаемого значения: `void` в записи `void dive(int n)` означает «эта функция ничего не возвращает». Второе — функция должна стоять ВЫШЕ строки, которая ею пользуется, поэтому её пишут до `main`. Использовать собственное имя внутри собственного тела функции ничто не мешает: к моменту, когда компилятор доходит до тела, строку заголовка он уже прочитал.\n\nФункция `dive` ниже делает три вещи: печатает метку `down` вместе со своим числом `n`, затем вызывает саму себя с числом на единицу меньше, и только в самом конце печатает метку `up`. Слова `down` и `up` — английские метки, других слов программа не выводит.\n\nНа экране сначала появятся три строки `down`, а потом три строки `up`. Самое важное здесь вот что: строка с `up` не выполнится, пока внутренний вызов не завершится полностью. Пока вызванная функция не закончила работу, вызвавшая её функция стоит на месте и ждёт. Поэтому программа сначала уходит вглубь до самого дна, а потом постепенно возвращается обратно.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "void dive(int n) {\n" +
      "    cout << \"down \" << n << endl;\n" +
      "    if (n > 0) {\n" +
      "        dive(n - 1);\n" +
      "    }\n" +
      "    cout << \"up \" << n << endl;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    dive(2);\n" +
      "    return 0;\n" +
      "}",
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
        kk: "Функцияны жазамыз. Қайтаратын түрі — `int`, себебі жауап бүтін сан; функцияның өзі `main`-нен жоғары тұрады, ал ішінде өз атын қолданады — қарашадағы екі ереже, жаңасы жоқ.",
        ru: "Пишем функцию. Тип возвращаемого значения — `int`, потому что ответ целый; сама функция стоит выше `main`, а внутри пользуется собственным именем — оба правила ноябрьские, новых нет.",
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
        kk: "Кодта `if` — тоқтайтын жер, ал `return n * fact(n - 1);` — сол бір қадам. Көбейтуге назар аудар: ол ішкі шақыру нәтиже қайтарғаннан кейін ғана орындалады, өйткені `n *` бөлігінің көбейтетін заты әлі жоқ.",
        ru: "В коде `if` — это место остановки, а `return n * fact(n - 1);` — тот самый один шаг. Обрати внимание на умножение: оно выполняется только после того, как внутренний вызов вернул результат, ведь части `n *` пока не на что умножать.",
      },
    ],
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int fact(int n) {\n" +
      "    if (n == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return n * fact(n - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << fact(4);\n" +
      "    return 0;\n" +
      "}",
    stdin: "",
    result: {
      kk: "Бағдарлама экранға 24 шығарады. Барлығы төрт шақыру жасалды және төрт нәтиже қайтты.",
      ru: "Программа выводит на экран 24. Всего было сделано четыре вызова и вернулось четыре результата.",
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
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int total(int n) {\n" +
      "    if (n == 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return n + total(n - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << total(5);\n" +
      "    return 0;\n" +
      "}",
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
     * көреді» — is what this grid IS: four rows at the base-case test with
     * `depth` rising 0→3, then four rows at the `return` with `depth` falling
     * 3→0. The number 4926 is ours; every digit is different and no two
     * returned values collide, so a learner cannot fill a row by copying the
     * row above it.
     *
     * `depth` takes no part in the arithmetic and the prompt says so. It is
     * there because "how deep are we" is the question the month is about, and a
     * parameter is the only honest way to put it on screen without printing it.
     *
     * The smaller problem here is deliberately not `n - 1`: «дәл сондай, бірақ
     * кішірек» is about the SHAPE of the problem, and stripping the last digit
     * makes that point better than subtracting one.
     *
     * `n / 10` rather than Python's `n // 10`: on `int` the single slash IS
     * integer division, which September's l4 taught and which the prompt
     * restates in one clause, because the value here is never negative and the
     * truncation question therefore never arises.
     */
    id: "m6.l3.b6",
    type: "trace_code",
    skillRefs: ["recursion.call_tree", "recursion.core", "arith.remainder", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "`digit_sum` санның цифрларының қосындысын табады: соңғы цифрды `n % 10` арқылы бөліп алады да, қалған бөлігін `n / 10` етіп өзіне береді (екеуі де бүтін сан, сондықтан бір сызық — бүтін бөлу, қыркүйектегідей). `depth` параметрі есептеуге қатыспайды — ол шақырудың қаншалықты тереңде тұрғанын көрсету үшін ғана қосылған.\n\nКестені толтыр. 6-жол — жаңа шақыру тоқтату шартын тексеріп жатқан сәт: сол сәттегі `n` мен `depth` мәндерін жаз. 12-жол — шақыру нәтижесін қайтарып жатқан сәт: `n`, `depth` және `answer` мәндерін жаз. Кестенің бірінші жартысы — төмен қарай тереңдеу, екінші жартысы — кері қайту. `depth` алдымен қалай өсіп, сосын қалай кемитініне қара.",
      ru: "`digit_sum` находит сумму цифр числа: последнюю цифру он отделяет через `n % 10`, а оставшуюся часть `n / 10` передаёт самому себе (оба числа целые, поэтому одна косая черта — это целочисленное деление, как в сентябре). Параметр `depth` не участвует в вычислении — он добавлен только чтобы показать, насколько глубоко находится вызов.\n\nЗаполни таблицу. Строка 6 — момент, когда новый вызов проверяет условие остановки: запиши значения `n` и `depth` в этот момент. Строка 12 — момент, когда вызов возвращает результат: запиши `n`, `depth` и `answer`. Первая половина таблицы — углубление вниз, вторая — возврат обратно. Посмотри, как `depth` сначала растёт, а потом убывает.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n, int depth) {\n" +
      "    int answer;\n" +
      "    if (n < 10) {\n" +
      "        answer = n;\n" +
      "    } else {\n" +
      "        int rest = digit_sum(n / 10, depth + 1);\n" +
      "        answer = n % 10 + rest;\n" +
      "    }\n" +
      "    return answer;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << digit_sum(4926, 0);\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 6, vars: { n: "4926", depth: "0" } },
      { line: 6, vars: { n: "492", depth: "1" } },
      { line: 6, vars: { n: "49", depth: "2" } },
      { line: 6, vars: { n: "4", depth: "3" } },
      { line: 12, vars: { n: "4", depth: "3", answer: "4" } },
      { line: 12, vars: { n: "49", depth: "2", answer: "13" } },
      { line: 12, vars: { n: "492", depth: "1", answer: "15" } },
      { line: 12, vars: { n: "4926", depth: "0", answer: "21" } },
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
     *
     * Two C++ mechanics appear here for the first time in the month and both
     * are stated in the prompt rather than smuggled in:
     *
     *   · `vector<int>& a` — November's pass-by-reference, used so that the
     *     list is not copied on every one of the calls. Without the `&` each
     *     call would duplicate the whole list, which is the exact bug `m6.l4`
     *     puts in front of the learner later.
     *   · `int n = a.size();` — `a.size()` is not an `int`, so the length is
     *     written into one on its own line and every comparison after it is
     *     plain. This is the recipe the whole month uses.
     */
    id: "m6.l3.b7",
    type: "fill_blank",
    skillRefs: ["recursion.core", "func.return", "lists.index", "lists.traverse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бірінші жолда n саны, екінші жолда бос орынмен бөлінген n бүтін сан беріледі. `tail_sum(a, i)` функциясы `a` тізімінің `i` орнынан бастап соңына дейінгі сандардың қосындысын қайтарады. Тізім функцияға `vector<int>& a` түрінде беріледі — қарашадағы сілтеме бойынша беру: онсыз әр шақыру бүкіл тізімнің көшірмесін жасар еді. Ұзындықты бір рет `int n = a.size();` деп жазып аламыз, сонда салыстырулардың бәрі қарапайым болады. Тоқтау шарты дайын: `i` тізім ұзындығына жетсе, қосылатын сан қалмайды, сондықтан 0 қайтады. Соңғы жолды толықтыр: осы қадамдағы сан және дәл сондай, бірақ бір қадам кішірек есептің жауабы.",
      ru: "В первой строке дано n, во второй — n целых чисел через пробел. Функция `tail_sum(a, i)` возвращает сумму чисел списка `a` от позиции `i` и до конца. Список передаётся в функцию как `vector<int>& a` — это ноябрьская передача по ссылке: без неё каждый вызов делал бы копию всего списка. Длину один раз записываем в `int n = a.size();`, и тогда все сравнения становятся простыми. Условие остановки уже готово: если `i` дошёл до длины списка, складывать больше нечего, поэтому возвращается 0. Дополни последнюю строку: число этого шага и ответ такой же, но на один шаг меньшей задачи.",
    },
    template:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int tail_sum(vector<int>& a, int i) {\n" +
      "    int n = a.size();\n" +
      "    if (i == n) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return ___ + ___;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> nums[i];\n" +
      "    cout << tail_sum(nums, 0);\n" +
      "    return 0;\n" +
      "}",
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
     *   · the program transcribed from b2 (`if (n == 1)`) recurses without end
     *     on 0 → killed by the hidden "0";
     *   · `cout << n;` or `cout << n * (n - 1);` → killed by the visible "5";
     *   · a stop at `n == 2` → killed by the visible "1";
     *   · a product that runs 1..n-1 → killed by "5" and "12".
     *
     * The bound 12 is not a round number and the prompt says why: 12! is
     * 479 001 600 and fits in an `int` with room to spare, while 13! is
     * 6 227 020 800 and does not. In Python the bound was arbitrary; in C++ it
     * is the last value that is true.
     */
    id: "m6.l3.b8",
    type: "write_code",
    skillRefs: ["recursion.core", "func.define", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бір бүтін сан n беріледі (0 ≤ n ≤ 12). n! мәнін шығар. Факториал — 1-ден n-ге дейінгі сандардың көбейтіндісі, ал 0! = 1 деп келісілген. Шектеу неге дәл 12? Себебі 12! = 479 001 600 әлі `int`-ке сыяды, ал 13! = 6 227 020 800 сыймайды — сондықтан бұл жерде `int` жеткілікті. Осы сабақтың тәсілімен — өзін-өзі шақыратын функциямен — жаз. Тексеруші тек шыққан санды салыстырады, сондықтан бұл міндетті ереже емес, кеңес; бірақ ай соңындағы сынақта дәл осы тәсіл сұралады.",
      ru: "Дано одно целое число n (0 ≤ n ≤ 12). Выведи значение n!. Факториал — это произведение чисел от 1 до n, а 0! по договорённости равен 1. Почему предел именно 12? Потому что 12! = 479 001 600 ещё помещается в `int`, а 13! = 6 227 020 800 уже нет, — значит, здесь `int` достаточно. Напиши это приёмом сегодняшнего урока — функцией, которая вызывает саму себя. Проверяющая программа сравнивает только выведенное число, так что это совет, а не обязательное правило; но на проверке в конце месяца спросят именно этот приём.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int fact(int n) {\n" +
      "    if (n == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return n * fact(n - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    cout << fact(n);\n" +
      "    return 0;\n" +
      "}",
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
     * THE RANGE MOVED, AND IT HAD TO. The Python version allowed 0 ≤ n ≤ 20
     * with |a| ≤ 10, so the largest answer was 10²⁰ — a number Python prints
     * and C++ cannot hold in any type this course teaches (`long long` stops
     * near 9 · 10¹⁸). The exponent is now bounded at 18, the whole computation
     * runs in `long long`, and the largest legal answer 10¹⁸ is a hidden case,
     * so the widened type is tested rather than assumed. The Python case
     * `-1 20` became `-1 18`, which still checks that an even exponent cancels
     * the sign.
     *
     * THE BAN WAS RE-AUTHORED TOO. `a ** n` does not exist in C++, so
     * forbidding it would be noise. `pow()` from `<cmath>` does exist and is a
     * real trap rather than a shortcut: it works in `double`, which carries
     * about fifteen significant digits, so on the large cases here it can print
     * something that is not the integer answer. The prompt says that, which is
     * a true statement about the language instead of a translated one.
     *
     * Degenerate programs and the cases that kill them:
     *   · `cout << a * n;` → "2 10" gives 20, not 1024 (visible);
     *   · a stop at `n == 1` returning a → "5 0" never stops (hidden);
     *   · a solution that loses the sign of a negative base → "-2 3" (hidden);
     *   · a solution that returns 0 at the bottom → every case;
     *   · "-1 18" pins the even-exponent case, where the sign must cancel;
     *   · "10 18" pins the top of the range and the `long long` requirement —
     *     an `int` accumulator wraps long before it.
     */
    id: "m6.l3.b9",
    type: "write_code",
    skillRefs: ["recursion.core", "func.parameters", "func.return"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бос орынмен бөлінген екі бүтін сан беріледі: a және n (|a| ≤ 10, 0 ≤ n ≤ 18). a-ның n-дәрежесін шығар, яғни a-ны өзіне n рет көбейт; n = 0 болғанда жауап 1. Мұны да өзін-өзі шақыратын функциямен жаз: a-ның n-дәрежесі — a мен a-ның (n − 1)-дәрежесінің көбейтіндісі.\n\nЖауап 10¹⁸-ге дейін жетуі мүмкін, ал ол `int`-ке мүлде сыймайды — сондықтан есептеуді `long long`-пен жүргіз (қыркүйектің 6-сабағы). Дәреже неге 18-ден аспайды? Себебі `long long` шамамен 9 · 10¹⁸-ге дейін ғана шыдайды, ал 10¹⁹ одан асып кетеді.\n\n`<cmath>` кітапханасындағы `pow` функциясын қолданба: ол бөлшек сандармен жұмыс істейді және шамамен он бес мәнді цифрды ғана дәл сақтайды, сондықтан үлкен жауаптарда бүтін санның орнына жуықтаған мән беруі мүмкін. Тексеруші тек шыққан санды салыстыратынын білесің — демек бұл сенің адалдығыңа қалдырылған кеңес.",
      ru: "В одной строке через пробел даны два целых числа: a и n (|a| ≤ 10, 0 ≤ n ≤ 18). Выведи a в степени n, то есть умножь a на себя n раз; при n = 0 ответ равен 1. Это тоже напиши функцией, которая вызывает саму себя: a в степени n — это произведение a и a в степени (n − 1).\n\nОтвет может доходить до 10¹⁸, а это в `int` не помещается совсем, — поэтому считай в `long long` (сентябрь, урок 6). Почему степень не больше 18? Потому что `long long` выдерживает примерно до 9 · 10¹⁸, а 10¹⁹ уже больше.\n\nНе пользуйся функцией `pow` из `<cmath>`: она работает с дробными числами и точно хранит лишь около пятнадцати значащих цифр, поэтому на больших ответах может дать приближение вместо целого числа. Ты знаешь, что проверяющая программа сравнивает только выведенное число, — значит, это совет, оставленный на твою честность.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "long long power(long long a, int n) {\n" +
      "    if (n == 0) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    return a * power(a, n - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    long long a;\n" +
      "    int n;\n" +
      "    cin >> a >> n;\n" +
      "    cout << power(a, n);\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "2 10", expectedOutput: "1024" },
      { input: "7 1", expectedOutput: "7" },
      { input: "5 0", expectedOutput: "1", hidden: true },
      { input: "-2 3", expectedOutput: "-8", hidden: true },
      { input: "-1 18", expectedOutput: "1", hidden: true },
      { input: "3 5", expectedOutput: "243", hidden: true },
      { input: "10 6", expectedOutput: "1000000", hidden: true },
      { input: "10 18", expectedOutput: "1000000000000000000", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for m6.l3.b9 — the same problem, the same input
     * format, the same output, assembled instead of written (PDF p.6:
     * «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ»).
     *
     * Braces do not solve it. The learner still has to decide (a) that the
     * function must be defined before the line that calls it, (b) that reading
     * comes before calling and calling before printing, and (c) that the
     * stopping check comes before the line that calls again — which is the one
     * decision with a real consequence: put `return a * power(...)` first and
     * the function never stops.
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
      kk: "Бөліктерді дұрыс ретке қой. Бағдарлама бір жолда бос орынмен бөлінген екі бүтін санды оқиды: a және n (|a| ≤ 10, 0 ≤ n ≤ 18), сосын a-ның n-дәрежесін шығарады. Жауап 10¹⁸-ге жетуі мүмкін, сондықтан бәрі `long long`-пен есептеледі. Есеп өзін-өзі шақыратын `power` функциясымен шешілген: дәреже нөлге тең болса, жауап — 1, ал басқа жағдайда жауап — a мен бір кіші дәреженің көбейтіндісі. Үш нәрсені ойлан: функция оны шақыратын жолдан жоғары тұруы керек; `main` ішінде алдымен оқу, содан кейін шақыру, соңында шығару; ал функцияның ішінде тоқтау шарты өзін қайта шақыратын жолдан бұрын тұруы керек.",
      ru: "Расставь части по порядку. Программа читает из одной строки два целых числа через пробел: a и n (|a| ≤ 10, 0 ≤ n ≤ 18), а затем выводит a в степени n. Ответ может доходить до 10¹⁸, поэтому всё считается в `long long`. Задача решена функцией `power`, которая вызывает саму себя: если степень равна нулю, ответ — 1, а иначе ответ — произведение a и степени на единицу меньшей. Продумай три вещи: функция должна стоять выше строки, которая её вызывает; внутри `main` сначала чтение, потом вызов, потом вывод; а внутри функции условие остановки должно стоять раньше строки, которая вызывает её снова.",
    },
    lines: [
      { id: "q1", code: "#include <iostream>\nusing namespace std;" },
      { id: "q2", code: "long long power(long long a, int n) {" },
      { id: "q3", code: "    if (n == 0) return 1;" },
      { id: "q4", code: "    return a * power(a, n - 1);" },
      { id: "q5", code: "}" },
      { id: "q6", code: "int main() {\n    long long a;\n    int n;\n    cin >> a >> n;" },
      { id: "q7", code: "    long long ans = power(a, n);" },
      { id: "q8", code: "    cout << ans;\n    return 0;\n}" },
    ],
    correctOrder: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"],
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
      kk: "Жаңа ғана жазған `power` функцияңды жазбаша қорғап шық. Үш сұраққа қысқа жауап жаз: (1) функция қандай мәндерді қабылдайды, қандай түрде және нақты нені қайтарады? (2) `power(2, 3)` шақырылғанда шақырулар қандай ретпен жасалады, ал нәтижелер қандай ретпен әрі қандай мәндермен қайтады? (3) көбейту қай сәтте орындалады — ішкі шақыруға дейін бе, әлде ол нәтиже қайтарғаннан кейін бе? Жауабыңды мұғалім оқиды.",
      ru: "Защити письменно функцию `power`, которую ты только что написал. Ответь коротко на три вопроса: (1) какие значения функция принимает, какого типа и что именно она возвращает? (2) в каком порядке идут вызовы при `power(2, 3)` и в каком порядке и с какими значениями возвращаются результаты? (3) в какой момент выполняется умножение — до внутреннего вызова или после того, как он вернул результат? Твой ответ прочитает учитель.",
    },
    expectedPoints: [
      {
        kk: "`power(a, n)` екі санды қабылдайды және a-ның n-дәрежесін `long long` түрінде қайтарады — экранға шығармайды, шығаруды негізгі бағдарлама істейді. Түрі `long long` болуының себебі — жауап 10¹⁸-ге дейін жетеді.",
        ru: "`power(a, n)` принимает два числа и возвращает a в степени n значением типа `long long`; на экран она ничего не выводит, выводом занимается основная программа. Тип `long long` взят потому, что ответ доходит до 10¹⁸.",
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
