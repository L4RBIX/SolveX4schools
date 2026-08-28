import type { LessonBlock } from "../../types";

/**
 * Lesson m3.l1 · «Алғашқы функция» — the first `def` in the year.
 * PDF p.8, November. Skills: `func.define`, `func.reuse`.
 *
 * Two clauses of the programme drive every block below.
 *
 * «Қайталанатын логиканы функцияға бөлу … функцияны бірнеше рет шақыру» —
 * split the repeated logic out, then call it more than once. So no block here
 * shows a function that is called exactly once: the worked example calls twice,
 * the fill-blank calls twice, and the two writing tasks call three times and n
 * times. A function called once is a section heading, and a learner who only
 * ever sees that has no reason to believe any of this was worth the trouble.
 *
 * «Сегіз қысқа сабақ және алты толық талданған мысал» — the month owes six
 * fully worked examples. `m3.l1.b2` is the first of the six: three lines
 * written twice by hand, then written once and given a name.
 *
 * ## The one idea, and where it bites
 *
 * Three months of programs have run top to bottom. `def` is therefore the first
 * line in the year that produces no effect at all when the computer reaches it,
 * and that single fact is what this lesson is for. `m3.l1.b3` is built entirely
 * around it: a program that defines a function and never calls it, wrapped in
 * two prints so the answer is `start` / `end` — the missing `hello` is read as
 * an absence between two words that ARE there, rather than as an empty box that
 * a learner cannot tell apart from a broken exercise.
 *
 * ## What is deliberately not here
 *
 * No parameters (that is l2) and no `return` (l3), and neither may appear in a
 * reference solution before its own lesson. A function with neither still has
 * to get its data from somewhere, so the functions in this lesson read their
 * own input — which is precisely the shape l2 dismantles the moment parameters
 * exist, and the concept block says so out loud instead of leaving the learner
 * to discover that they were taught a temporary habit.
 *
 * The even/odd task at `m3.l1.b7` is the programme's «санның қасиетін
 * тексеретін функция». It PRINTS its verdict rather than returning it; l3
 * rewrites this same family with `return`, and the gap between the two versions
 * is what makes «шығару мен қайтарудың айырмасы» a real question there.
 *
 * ## What the cases cannot see
 *
 * An output test cannot tell a function apart from a loop doing the same work:
 * a learner who ignores `def` completely still passes `m3.l1.b8`. That is why
 * the reorder, the fill-blank and the support twin carry the definition-and-call
 * work structurally — they are the blocks that actually check the month's first
 * skill, not decoration around the two writing tasks.
 */

export const M3_L1: LessonBlock[] = [
  {
    id: "m3.l1.b1",
    type: "concept",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "def: қайталанатын жолдарға ат қою",
      ru: "def: даём имя повторяющимся строкам",
    },
    /* The body has to say what `def` DOES, and the honest answer is "nothing
       yet". Saying only "it creates a function" leaves the learner with a line
       that looks like a command, and the very next block asks them to predict a
       program where believing that is the only way to get the wrong answer. */
    body: {
      kk: "Осы кезге дейін бағдарлама жоғарыдан төменге қарай бір рет орындалып шығатын. `def` — жылдағы бірінші жол, ол өзі ешнәрсе істемейді: компьютер оны оқығанда ешқандай сан оқылмайды, экранға да ештеңе шықпайды. `def` тек «мына жолдардың аты — осы» деп есте сақтап қояды. Функцияға тиесілі жолдар шегініспен жазылады — дәл `if` пен `for`-дағыдай, ал шегініс біткен жерде функция да бітеді. Дене шақырғанда ғана жүреді: функцияның атын жазып, соңына жақша қоямыз — `hello()`. Атын неше рет жазсақ, дене сонша рет орындалады. Әзірге функция қажет деректі өзі оқиды; оған сырттан дерек беруді келесі сабақта үйренеміз.",
      ru: "До сих пор программа выполнялась сверху вниз ровно один раз. `def` — первая строка в году, которая сама по себе не делает ничего: когда компьютер её читает, ни одно число не читается и на экран ничего не выводится. `def` лишь запоминает, что у этих строк теперь есть имя. Строки, принадлежащие функции, пишутся с отступом — точно как у `if` и `for`, а где кончается отступ, там кончается и функция. Тело срабатывает только при вызове: пишем имя функции и ставим скобки — `hello()`. Сколько раз напишем имя, столько раз выполнится тело. Пока функция сама читает нужные ей данные; передавать данные снаружи научимся на следующем уроке.",
    },
    code: 'def hello():\n    print("hello")\n\nhello()\nhello()',
  },
  {
    /* WORKED EXAMPLE 1 of the month's six. «Сегіз қысқа сабақ және алты толық
       талданған мысал» (p.8). The duplicated version is named line by line in
       step 1 rather than shown as a second program: `code` is one runnable
       program, and pasting both versions into it would make it read four lines
       of input and print four answers, which contradicts `result`. */
    id: "m3.l1.b2",
    type: "worked_example",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    title: {
      kk: "Толық талданған мысал: қайталанған үш жолды функцияға шығару",
      ru: "Разобранный пример: выносим три повторяющиеся строки в функцию",
    },
    problem: {
      kk: "Мектепте екі бөлменің еденіне линолеум төселеді. Әр бөлме үшін жеке жолда, бос орынмен бөлініп, оның ұзындығы мен ені беріледі (метрмен). Әр бөлменің ауданын жеке жолға шығар. Мысалы, бірінші жолда «6 5», екінші жолда «4 3» берілсе, жауап 30, содан кейін 12.",
      ru: "В школе на пол двух комнат кладут линолеум. Для каждой комнаты в отдельной строке через пробел даны её длина и ширина (в метрах). Выведи площадь каждой комнаты на отдельной строке. Например, если в первой строке «6 5», а во второй «4 3», ответ — 30, затем 12.",
    },
    steps: [
      {
        kk: "Екі бөлмеге де істейтініміз бірдей: `a, b = map(int, input().split())` — жолды оқимыз, `s = a * b` — көбейтеміз, `print(s)` — шығарамыз. Осы үш жолды екі рет көшіріп жазуға да болады. Бірақ үшінші бөлме қосылса, тағы көшіру керек, ал бір көшірмедегі қатені түзеткенде екіншісін ұмытып кету оңай.",
        ru: "Для обеих комнат мы делаем одно и то же: `a, b = map(int, input().split())` — читаем строку, `s = a * b` — перемножаем, `print(s)` — выводим. Эти три строки можно просто скопировать дважды. Но если добавится третья комната, придётся копировать снова, а исправив ошибку в одной копии, легко забыть про вторую.",
      },
      {
        kk: "`def` осы үш жолға ат береді. Атын өзіміз таңдаймыз — не істейтіні түсінікті болсын: `def room_area():`. Соңында жақша мен қос нүкте тұрады.",
        ru: "`def` даёт этим трём строкам имя. Имя выбираем сами — такое, чтобы было понятно, что оно делает: `def room_area():`. В конце — скобки и двоеточие.",
      },
      {
        kk: "Функцияның денесі — `def` жолынан кейінгі шегініспен жазылған үш жол. Шегініс — функцияның шекарасы: шегініссіз жазылған алғашқы жол енді функцияға кірмейді.",
        ru: "Тело функции — это три строки с отступом после строки `def`. Отступ и есть граница функции: первая же строка без отступа в функцию уже не входит.",
      },
      {
        kk: "Компьютер `def` жолын оқығанда бірде-бір сан оқылмайды, экранға ештеңе шықпайды — ол тек атын есіне сақтайды. Дене бірінші рет `room_area()` деп жазылған жерде ғана жүреді.",
        ru: "Когда компьютер читает строку `def`, не читается ни одно число и на экран ничего не выводится — он только запоминает имя. Тело срабатывает лишь там, где впервые написано `room_area()`.",
      },
      {
        kk: "Екі шақыру — дене екі рет орындалады. Бірінші шақыру бірінші жолды оқиды, екіншісі — келесі жолды. Сондықтан бір ғана рет жазылған код әр жолы жаңа сандармен жұмыс істейді.",
        ru: "Два вызова — тело выполняется дважды. Первый вызов читает первую строку, второй — следующую. Поэтому один-единственный раз написанный код каждый раз работает с новыми числами.",
      },
    ],
    code:
      "def room_area():\n" +
      "    a, b = map(int, input().split())\n" +
      "    s = a * b\n" +
      "    print(s)\n" +
      "\n" +
      "room_area()\n" +
      "room_area()",
    result: {
      kk: "«6 5» және «4 3» енгізгенде: алдымен 30, содан кейін 12 — әрқайсысы жеке жолда.",
      ru: "При вводе «6 5» и «4 3»: сначала 30, затем 12 — каждое на отдельной строке.",
    },
  },
  {
    /* The lesson's diagnostic core: definition is not execution. The two prints
       around the def exist so the correct answer is a visible pair of words and
       not an empty string — an empty answer is indistinguishable, for a
       fourteen-year-old, from an exercise that failed to load. */
    id: "m3.l1.b3",
    type: "prediction",
    skillRefs: ["func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама нені шығарады? Әр шыққан сөз жеке жолда. Функцияның қай жерде шақырылатынына мұқият қара.",
      ru: "Что выведет эта программа? Каждое выведенное слово — на отдельной строке. Внимательно посмотри, где вызывается функция.",
    },
    code: 'print("start")\n\ndef greet():\n    print("hello")\n\nprint("end")',
    answer: "start\nend",
    options: ["start\nend", "start\nhello\nend", "hello\nstart\nend", "start\nend\nhello"],
    /* Only the middle distractor is mapped. "hello" first and "hello" last are
       both compatible with more than one belief — that functions run before the
       program, that they run after it, or simply that this one is called
       somewhere the learner did not look — so naming a cause for either would
       be telling a child something about their own thinking we cannot know. */
    diagnosticMapping: {
      "start\nhello\nend": {
        failureClass: "definition_treated_as_execution",
        justification:
          "`hello` сөзінің дәл `start` пен `end` арасында шығуының бір ғана себебі бар: `def` жолы кәдімгі команда деп оқылып, дене өзі тұрған жерде орындалады деп ойлау. Бұл бағдарламада `greet()` деген шақыру мүлде жоқ, сондықтан дене бірде-бір рет жүрмейді.",
      },
    },
  },
  {
    id: "m3.l1.b4",
    type: "multiple_choice",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жолдар 1-ден 4-ке дейін нөмірленген. Қай жол — функцияның анықтамасы, ал қай жол — оның шақырылуы?",
      ru: "Строки пронумерованы от 1 до 4. Какая строка — определение функции, а какая — её вызов?",
    },
    code: 'def show():\n    print("ok")\nshow()\nprint("bye")',
    options: [
      { id: "o1", label: { kk: "1-жол — анықтама, 3-жол — шақыру", ru: "Строка 1 — определение, строка 3 — вызов" } },
      { id: "o2", label: { kk: "1-жол — анықтама, 2-жол — шақыру", ru: "Строка 1 — определение, строка 2 — вызов" } },
      { id: "o3", label: { kk: "3-жол — анықтама, 1-жол — шақыру", ru: "Строка 3 — определение, строка 1 — вызов" } },
      { id: "o4", label: { kk: "1-жол — анықтама, 4-жол — шақыру", ru: "Строка 1 — определение, строка 4 — вызов" } },
    ],
    correctOptionId: "o1",
    /* o4 carries no mapping: choosing `print("bye")` as the call can come from
       "every line with brackets is a call to something" and equally from "the
       last line must be the call", and those are different lessons to teach. */
    diagnosticMapping: {
      o2: {
        failureClass: "function_body_mistaken_for_call",
        justification:
          "2-жолды шақыру деп таңдау — функцияның денесін оның шақырылуы деп оқығанды білдіреді. Ол жол шегініспен жазылған, яғни әлі функцияның ішінде тұр; шақыру шегініссіз, сол жақ шетінен басталады.",
      },
      o3: {
        failureClass: "definition_and_call_inverted",
        justification:
          "Анықтама мен шақыруды орнымен ауыстыру — функцияны жариялайтын сөз `def` екенін ескермеу. `show()` жолында `def` жоқ, ал 1-жолда бар, сондықтан рөлдер дәл керісінше.",
      },
    },
  },
  {
    /* The order here is unique, and that is checked by hand rather than assumed:
       the three indented lines can only follow their own `def`, `price()` can
       only come after the definition, and the prompt fixes `done` as the last
       thing printed — so `print("done")` cannot float to the front. Two
       identical call lines would have made the sequence ambiguous, which is why
       there is one call here and the repetition lives in b6. */
    id: "m3.l1.b5",
    type: "reorder_code",
    skillRefs: ["func.define"],
    sourceType: "product-authored",
    prompt: {
      kk: "Жолдарды дұрыс ретке қой. Бағдарлама `price` функциясын жариялауы керек: ол бір бүтін сан оқып, оның үш есесін шығарады. Содан кейін функция бір рет шақырылады, ал ең соңында `done` сөзі шығады. Жолдардың бірі — анықтама, бірі — шақыру: қайсысы бұрын тұруға тиіс екенін өзің шеш.",
      ru: "Расставь строки по порядку. Программа должна объявить функцию `price`: она читает одно целое число и выводит его утроенное значение. Затем функция вызывается один раз, а в самом конце выводится слово `done`. Одна из строк — определение, другая — вызов: реши сам, какая из них должна стоять раньше.",
    },
    lines: [
      { id: "q1", code: "def price():" },
      { id: "q2", code: "    n = int(input())" },
      { id: "q3", code: "    print(n * 3)" },
      { id: "q4", code: "price()" },
      { id: "q5", code: 'print("done")' },
    ],
    correctOrder: ["q1", "q2", "q3", "q4", "q5"],
  },
  {
    id: "m3.l1.b6",
    type: "fill_blank",
    skillRefs: ["func.define", "func.reuse"],
    sourceType: "product-authored",
    prompt: {
      kk: "Функция дұрыс жарияланып, екі рет шақырылуы керек. Үш орынды толтыр: жариялау сөзі және екі шақырудағы функцияның аты. Бағдарлама `****` жолын дәл екі рет шығаруы тиіс.",
      ru: "Функция должна быть правильно объявлена и вызвана дважды. Заполни три места: слово объявления и имя функции в двух вызовах. Программа должна вывести строку `****` ровно два раза.",
    },
    template: '___ frame():\n    print("****")\n\n___()\n___()',
    blanks: [
      { id: "f1", answer: "def" },
      { id: "f2", answer: "frame" },
      { id: "f3", answer: "frame" },
    ],
  },
  {
    /* «санның қасиетін тексеретін функция» — named verbatim in November's
       practice paragraph (p.8). Here the verdict is PRINTED, because `return`
       is l3 and may not appear in a solution before it is taught. The tokens
       are English and both prompts name them, so a Russian-track learner is
       reading the same problem and not matching glyphs. */
    id: "m3.l1.b7",
    type: "write_code",
    skillRefs: ["func.define", "func.reuse", "arith.remainder", "cond.if_elif_else"],
    sourceType: "curriculum-derived",
    pdfPage: 8,
    prompt: {
      kk: "Үш бүтін сан беріледі, әрқайсысы жеке жолда (−1000 ≤ сан ≤ 1000). Бір санды оқып, ол жұп болса `even`, тақ болса `odd` деп шығаратын функция жаз. Сол функцияны үш рет шақыр. Әр жауап жеке жолда шығады, сөздер тура осылай ағылшынша жазылады: `even` және `odd`. Нөл — жұп сан.",
      ru: "Даны три целых числа, каждое на отдельной строке (−1000 ≤ число ≤ 1000). Напиши функцию, которая читает одно число и выводит `even`, если оно чётное, и `odd`, если нечётное. Вызови эту функцию три раза. Каждый ответ — на отдельной строке, слова пишутся по-английски именно так: `even` и `odd`. Ноль — чётное число.",
    },
    referenceSolution:
      "def check():\n" +
      "    x = int(input())\n" +
      "    if x % 2 == 0:\n" +
      '        print("even")\n' +
      "    else:\n" +
      '        print("odd")\n' +
      "\n" +
      "check()\n" +
      "check()\n" +
      "check()",
    /* The visible case puts 0 in the open, where a learner who believes zero is
       neither even nor odd finds out with the sample in front of them — and it
       already kills a program that calls the function fewer than three times,
       because the second answer differs from the first. So the hidden cases are
       about the range the prompt promises rather than about the call count:
       the negative half of it, both of its ends, and zero again beside two
       negatives. Note that Python's `%` is already right on negatives — `-3 % 2`
       is 1 — so these are not a trap about the operator; they are here because a
       prompt that declares −1000 legal and never feeds it has promised nothing. */
    cases: [
      { input: "4\n7\n0", expectedOutput: "even\nodd\neven" },
      { input: "-3\n-8\n1", expectedOutput: "odd\neven\nodd", hidden: true },
      { input: "1000\n999\n-1000", expectedOutput: "even\nodd\neven", hidden: true },
      { input: "0\n-2\n-999", expectedOutput: "even\neven\nodd", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for m3.l1.b8 — the same task, assembled instead of
       written. «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
       азырақ» (p.6). The three blanks are the three decisions the task is made
       of: the word that declares a function, how many repetitions the loop
       needs, and the name that is called inside it. The problem statement is
       repeated in full because this route never sees b8. */
    id: "m3.l1.b8s",
    type: "fill_blank",
    skillRefs: ["func.define", "func.reuse", "loops.for"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 20) — одан кейін неше сан келетінін көрсетеді. Келесі n жолда бір-бірден бүтін сан беріледі (0 ≤ сан ≤ 100). Әр санның квадратын жеке жолға шығару керек. Құрылымы дайын — үш орынды толтыр: функцияны жариялайтын сөз, цикл нешеу қайталанатыны және цикл ішінде шақырылатын функцияның аты.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 20) — сколько чисел будет дальше. В следующих n строках дано по одному целому числу (0 ≤ число ≤ 100). Нужно вывести квадрат каждого числа на отдельной строке. Структура уже готова — заполни три места: слово, объявляющее функцию, сколько раз повторяется цикл и имя функции, которую вызываем внутри него.",
    },
    template:
      "___ show():\n" +
      "    x = int(input())\n" +
      "    print(x * x)\n" +
      "\n" +
      "n = int(input())\n" +
      "for i in range(___):\n" +
      "    ___()",
    blanks: [
      { id: "f1", answer: "def" },
      { id: "f2", answer: "n" },
      { id: "f3", answer: "show" },
    ],
  },
  {
    id: "m3.l1.b8",
    type: "write_code",
    skillRefs: ["func.define", "func.reuse", "loops.for"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда n саны беріледі (1 ≤ n ≤ 20) — одан кейін неше сан келетінін көрсетеді. Келесі n жолда бір-бірден бүтін сан беріледі (0 ≤ сан ≤ 100). Бір санды оқып, оның квадратын шығаратын функция жаз, содан кейін сол функцияны дәл n рет шақыр. Әр квадрат жеке жолда шығады.",
      ru: "В первой строке дано число n (1 ≤ n ≤ 20) — сколько чисел будет дальше. В следующих n строках дано по одному целому числу (0 ≤ число ≤ 100). Напиши функцию, которая читает одно число и выводит его квадрат, а затем вызови эту функцию ровно n раз. Каждый квадрат — на отдельной строке.",
    },
    referenceSolution:
      "def show():\n" +
      "    x = int(input())\n" +
      "    print(x * x)\n" +
      "\n" +
      "n = int(input())\n" +
      "for i in range(n):\n" +
      "    show()",
    /* Both visible cases are chosen to fail loudly rather than subtly. «3 2 5 10»
       kills `x + x` and `x * 2` at the second number, in the open. «1 7» is the
       bottom of the stated bound and kills two wrong loops: `range(n - 1)` prints
       nothing at all, and a program that calls the function a fixed three times
       runs out of input and crashes.

       Across the five cases n takes 3, 1, 2, 4 and 5 — deliberately, so that no
       hard-coded number of calls passes the set. The remaining hidden work is
       the value range: 0 at the bottom and 100 at the top, both named by the
       prompt. */
    cases: [
      { input: "3\n2\n5\n10", expectedOutput: "4\n25\n100" },
      { input: "1\n7", expectedOutput: "49" },
      { input: "2\n0\n5", expectedOutput: "0\n25", hidden: true },
      { input: "4\n100\n0\n9\n12", expectedOutput: "10000\n0\n81\n144", hidden: true },
      { input: "5\n1\n2\n3\n4\n5", expectedOutput: "1\n4\n9\n16\n25", hidden: true },
    ],
  },
];
