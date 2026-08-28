import type { LessonBlock } from "../../types";

/**
 * m2.l3 · «while циклі» / «Цикл while» — 8 minutes.
 *
 * Skills: `loops.while`, `debug.boundary`.
 * PDF p.7 names the infinite loop first in October's list of typical errors
 * («Типтік қателер: шексіз цикл, соңғы элементті өткізіп жіберу, …»), so this
 * lesson is where both of the first two are met head-on.
 *
 * Two authoring decisions worth stating, because they are not obvious:
 *
 * 1. **The genuinely non-terminating program is a `test_case`, not a
 *    `find_bug`.** Every `find_bug` block is executed by the authoring checker
 *    and by `content-execution.test.ts` — a program that loops forever would be
 *    killed by the 10-second timeout on every probe, and the same happens to
 *    the learner in the judge. So the repair block (b4) carries a bug that
 *    TERMINATES and is wrong (`i < n` where the sum needs `i <= n`), and the
 *    infinite loop lives in b5, where naming the input that hangs it IS the
 *    exercise and nothing has to be run to grade the thinking.
 *
 * 2. **The trace (b3) reverses a number, the tasks (b7, b8) sum and print
 *    digits.** All three peel with `% 10` and `// 10`, but none of them is a
 *    transcription of another: the learner has to carry the skeleton across,
 *    not retype an accumulation line they just read.
 *
 * `n = 0` is handled on purpose rather than avoided: `while n > 0` never enters
 * the body, the digit sum is 0, and b7's visible cases say so out loud.
 */

const P = 7;

export const M2_L3: LessonBlock[] = [
  {
    id: "m2.l3.b1",
    type: "concept",
    skillRefs: ["loops.while"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "while: шарт орындалып тұрғанда қайталау",
      ru: "while: повторяем, пока условие верно",
    },
    body: {
      kk: "`for` циклі неше рет қайталанатынын алдын ала біледі. `while` білмейді: ол алдымен шартты тексереді, шарт ақиқат болса денені бір рет орындайды, содан кейін шартты қайтадан тексереді. Сондықтан шартқа кіретін айнымалы дененің ішінде міндетті түрде өзгеруге тиіс. Ол өзгермесе, шарт ешқашан жалған болмайды да, бағдарлама тоқтамайды — мұны шексіз цикл дейді.",
      ru: "Цикл `for` заранее знает, сколько раз повторить. `while` не знает: он сначала проверяет условие, при истинном условии один раз выполняет тело, а потом проверяет условие снова. Поэтому переменная из условия обязана меняться внутри тела. Если она не меняется, условие никогда не станет ложным и программа не остановится — это и есть бесконечный цикл.",
    },
    code: "n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1",
  },
  {
    /* The loop halves, so the learner cannot answer by counting to a visible
       limit — they have to run the condition against the value 1 and decide
       whether the body fires one more time. That decision is the whole block. */
    id: "m2.l3.b2",
    type: "prediction",
    skillRefs: ["loops.while", "loops.counter"],
    sourceType: "product-authored",
    prompt: {
      kk: "Цикл денесі қанша рет орындалатынын алдымен өзің санап шық. Бағдарлама нені шығарады?",
      ru: "Сначала сам посчитай, сколько раз выполнится тело цикла. Что выведет программа?",
    },
    code: "n = 10\nsteps = 0\nwhile n > 1:\n    n = n // 2\n    steps = steps + 1\nprint(n, steps)",
    answer: "1 3",
    options: ["1 3", "0 4", "1 4", "2 3"],
    diagnosticMapping: {
      /* 0 is reachable only by halving 1, and 1 is exactly the value at which
         `n > 1` is false. One cause, no second reading. `1 4` is left
         unmapped: an off-by-one in the counter and a miscount of the passes
         both produce it. */
      "0 4": {
        failureClass: "loop_body_ran_after_condition_failed",
        justification:
          "0 мәні тек 1-ді екіге бөлгенде шығады, ал `n > 1` шарты дәл n = 1 болғанда циклді тоқтатады. Демек оқушы дене орындалар алдында шарттың қайта тексерілетінін ескермеген.",
      },
    },
  },
  {
    /* PDF p.7: «Басты құрал - бағдарламаның қадамдық орындалуы» and
       «қолмен трассалау». The steps stop at the end of each pass rather than
       after every line — six snapshots a learner can actually hold, and the
       middle digit 0 in 407 is there so `r * 10` has to be understood rather
       than guessed from the digits. */
    id: "m2.l3.b3",
    type: "trace_code",
    skillRefs: ["loops.while", "arith.integer_division", "arith.remainder"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "n = 407 болғанда бағдарламаны қағаздағыдай қадамдап орында. Цикл денесінің әр айналымы аяқталған сайын n, d және r мәндерін жаз.",
      ru: "Выполни программу пошагово, как на бумаге, при n = 407. После каждого прохода тела цикла записывай значения n, d и r.",
    },
    code: "n = 407\nr = 0\nwhile n > 0:\n    d = n % 10\n    r = r * 10 + d\n    n = n // 10\nprint(r)",
    steps: [
      { line: 1, vars: { n: "407" } },
      { line: 2, vars: { n: "407", r: "0" } },
      { line: 6, vars: { n: "40", d: "7", r: "7" } },
      { line: 6, vars: { n: "4", d: "0", r: "70" } },
      { line: 6, vars: { n: "0", d: "4", r: "704" } },
      { line: 7, vars: { n: "0", d: "4", r: "704" } },
    ],
  },
  {
    /* «соңғы элементті өткізіп жіберу» — the second typical error named on
       p.7. It terminates, so the learner meets a wrong answer rather than a
       frozen tab, and the defect is in the condition while the symptom appears
       in the sum. */
    id: "m2.l3.b4",
    type: "find_bug",
    skillRefs: ["loops.while", "debug.boundary", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бағдарлама 1-ден n-ге дейінгі сандардың қосындысын есептеуі керек. Бірақ n = 5 болғанда ол 15-тің орнына 10 шығарады. Қате қай жолда?",
      ru: "Программа должна считать сумму чисел от 1 до n. Но при n = 5 она выводит 10 вместо 15. В какой строке ошибка?",
    },
    code: "n = int(input())\ns = 0\ni = 1\nwhile i < n:\n    s = s + i\n    i = i + 1\nprint(s)",
    buggyLine: 4,
    symptomInput: "5",
    fixedCode: "n = int(input())\ns = 0\ni = 1\nwhile i <= n:\n    s = s + i\n    i = i + 1\nprint(s)",
    diagnosticMapping: {
      "5": {
        failureClass: "blamed_the_body_not_the_condition",
        justification:
          "5-жол қосындыны дұрыс жинайды: жетпей тұрған нәрсе — соңғы i, оны цикл мүлде қоспаған. Бұл жауап оқушының қатені цикл шартынан емес, дененің ішінен іздегенін көрсетеді.",
      },
    },
  },
  {
    /* The infinite loop itself, and the only block in the lesson that is never
       executed — `test_case` is graded on the input the learner names, so the
       hanging program can be shown honestly instead of being softened into
       something that terminates. Two different hangs: 0 sticks at 0, and every
       negative sticks at -1 because `// 2` floors. */
    id: "m2.l3.b5",
    type: "test_case",
    skillRefs: ["loops.while", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Бұл бағдарлама n санын 1-ге жеткенше неше рет екіге бөлуге болатынын санайды. Қандай енгізуде ол ешқашан тоқтамайды? Тексеру мысалын жаз және цикл неге тоқтамайтынын түсіндір.",
      ru: "Эта программа считает, сколько раз число n можно поделить на 2, пока не получится 1. На каком вводе она никогда не остановится? Предложи тест и объясни, почему цикл не завершится.",
    },
    code: "n = int(input())\nc = 0\nwhile n != 1:\n    n = n // 2\n    c = c + 1\nprint(c)",
    breakingInputs: ["0", "-6"],
  },
  {
    id: "m2.l3.b6",
    type: "fill_blank",
    skillRefs: ["loops.while", "loops.counter", "arith.integer_division"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама оң санның цифрларының САНЫН есептеуі керек. Циклдің шартын және соңғы цифрды алып тастайтын жолды толықтыр.",
      ru: "Программа должна посчитать КОЛИЧЕСТВО цифр положительного числа. Дополни условие цикла и строку, которая убирает последнюю цифру.",
    },
    template: "n = int(input())\nc = 0\nwhile n ___ 0:\n    c = c + 1\n    n = n ___ 10\nprint(c)",
    blanks: [
      { id: "f1", answer: ">", alternatives: ["!="] },
      { id: "f2", answer: "//" },
    ],
  },
  {
    /* PDF p.7 practice list, verbatim: «цифрлар қосындысы». The 0 case is
       visible on purpose — `while n > 0` never enters the body and the sum
       stays 0, which is the correct answer and the first thing a learner
       assumes must be special-cased. */
    id: "m2.l3.b7",
    type: "write_code",
    skillRefs: ["loops.while", "loops.accumulator", "arith.remainder", "arith.integer_division"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "Теріс емес бүтін n саны беріледі (0 ≤ n ≤ 1 000 000 000). Оның цифрларының қосындысын шығар. n = 0 болса, жауап 0.",
      ru: "Дано целое неотрицательное число n (0 ≤ n ≤ 1 000 000 000). Выведи сумму его цифр. Если n = 0, ответ 0.",
    },
    referenceSolution: "n = int(input())\ns = 0\nwhile n > 0:\n    s = s + n % 10\n    n = n // 10\nprint(s)",
    cases: [
      { input: "407", expectedOutput: "11" },
      { input: "0", expectedOutput: "0" },
      /* 1234 kills `n = n // 100`, which skips every second digit and still
         terminates; 1000 and 10203 kill a loop that stops at the first zero
         digit; 9 is the one-digit case and kills `while n > 10`, which never
         enters the body at all. */
      { input: "9", expectedOutput: "9", hidden: true },
      { input: "1000", expectedOutput: "1", hidden: true },
      { input: "1234", expectedOutput: "10", hidden: true },
      { input: "10203", expectedOutput: "6", hidden: true },
      { input: "999999999", expectedOutput: "81", hidden: true },
    ],
  },
  {
    id: "m2.l3.b8",
    type: "write_code",
    skillRefs: ["loops.while", "arith.remainder", "arith.integer_division"],
    sourceType: "product-authored",
    tracks: ["core", "advanced"],
    prompt: {
      kk: "1 ≤ n ≤ 1 000 000 000 бүтін саны беріледі. Оның цифрларын соңғысынан бастап біріншісіне қарай, әрқайсысын жаңа жолға шығар. Мысалы, 407 үшін үш жолда 7, 0, 4 шығуы керек.",
      ru: "Дано целое число n (1 ≤ n ≤ 1 000 000 000). Выведи его цифры от последней к первой, каждую с новой строки. Например, для 407 в трёх строках должно получиться 7, 0, 4.",
    },
    referenceSolution: "n = int(input())\nwhile n > 0:\n    print(n % 10)\n    n = n // 10",
    cases: [
      { input: "407", expectedOutput: "7\n0\n4" },
      { input: "5", expectedOutput: "5" },
      /* 10 and 1000 are the zero-digit traps: a loop that stops on a zero digit
         prints nothing after it. 1000000000 is the upper bound, nine zeros. */
      { input: "10", expectedOutput: "0\n1", hidden: true },
      { input: "1000", expectedOutput: "0\n0\n0\n1", hidden: true },
      { input: "120034", expectedOutput: "4\n3\n0\n0\n2\n1", hidden: true },
      { input: "1000000000", expectedOutput: "0\n0\n0\n0\n0\n0\n0\n0\n0\n1", hidden: true },
    ],
  },
  {
    /* SUPPORT SUBSTITUTION for b8, same problem, same cases.
       PDF p.6: «дайын кодты құрастыру мен толықтыру көбірек, нөлден жазу
       азырақ» — so the support route meets the identical task with the peeling
       loop already on screen and the edit that matters left to make: the digit
       goes to `print` instead of into an accumulator, and the accumulator
       disappears. Not a shorter lesson, a different door into the same one. */
    id: "m2.l3.b8s",
    type: "modify_code",
    skillRefs: ["loops.while", "arith.remainder", "arith.integer_division"],
    sourceType: "product-authored",
    tracks: ["support"],
    /*
     * The starting program is `m2.l3.b6`'s — the digit COUNTER the learner has
     * just completed themselves — and deliberately not `m2.l3.b7`'s.
     *
     * It was b7's, byte for byte, and b7 is the from-scratch digit-sum task
     * that the support route meets on the immediately preceding card. Since the
     * player mounts every block at once and Continue is never gated, the twin
     * was printing the previous task's answer key one screen ahead of it. The
     * only route affected was the one route that most needed the task.
     *
     * A program the learner has already finished is the right thing to hand
     * them: the edit — stop counting, start printing the peeled digit — is
     * structural rather than transcription, and nothing in the month solves it
     * for them.
     */
    prompt: {
      kk: "Бұл бағдарлама цифрлардың САНЫН есептейді — сен оны жаңа ғана толықтырдың. Енді оны цифрлардың өзін соңғысынан бастап әр жолға бөлек шығаратындай өзгерт. Санағыштың қажеті жоқ. 1 ≤ n ≤ 1 000 000 000.",
      ru: "Эта программа считает КОЛИЧЕСТВО цифр — ты её только что дополнил. Теперь измени её так, чтобы она выводила сами цифры, начиная с последней, каждую с новой строки. Счётчик больше не нужен. 1 ≤ n ≤ 1 000 000 000.",
    },
    code: "n = int(input())\nc = 0\nwhile n > 0:\n    c = c + 1\n    n = n // 10\nprint(c)",
    referenceSolution: "n = int(input())\nwhile n > 0:\n    print(n % 10)\n    n = n // 10",
    cases: [
      { input: "407", expectedOutput: "7\n0\n4" },
      { input: "5", expectedOutput: "5" },
      { input: "10", expectedOutput: "0\n1", hidden: true },
      { input: "1000", expectedOutput: "0\n0\n0\n1", hidden: true },
      { input: "120034", expectedOutput: "4\n3\n0\n0\n2\n1", hidden: true },
    ],
  },
];
