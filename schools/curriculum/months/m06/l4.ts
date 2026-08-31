import type { LessonBlock } from "../../types";

/**
 * m6.l4 · «Тоқтату шарты» / «Базовый случай» — 9 minutes.
 *
 * Skills: `recursion.base_case`, `debug.boundary`. PDF p.9.
 *
 * ## Which clauses of the programme drive this lesson
 *
 * February's mastery paragraph names the technique — «функция дәл сондай,
 * бірақ **кішірек** есепті шешу үшін өзін-өзі шақыратын тәсіл» — and its
 * monthly check names this lesson by hand: «**Тоқтау шарты дұрыс қойылған**,
 * өзін-өзі шақыратын функция жазу…». So the base case is not a footnote to
 * recursion here; it is the thing the month is checked on, and the habit this
 * lesson sells is one sentence long: write the stopping test before you write
 * the call, every time.
 *
 * The practice paragraph's «**сөз симметриясын осы тәсілмен тексеру**» is the
 * family this lesson owns, and `b7`, `b8` and `b8s` are it. «Айдың орталық
 * құралы - шақырулар ағашы» is why `b7` exists at all: the `recursion_tree`
 * visualiser does not exist yet, so the chain of calls is written down by hand
 * instead of watched, which is «Кодты қолмен орындау» — one of the programme's
 * own five verification methods (p.6).
 *
 * ## Seven authoring decisions worth stating
 *
 * 1. **Neither `find_bug` repairs the palindrome.** A `find_bug` whose
 *    `fixedCode` is the program `b8` then asks for hands the answer over — the
 *    defect class the first adversarial review found most often. So `b3` breaks
 *    a different word recursion (counting one letter) and `b4` breaks a list
 *    recursion. Both are the base case failing, which is the lesson; neither is
 *    the palindrome, which is the task.
 *
 * 2. **`b7` traces only the shrinking half of the symmetry check.** `peel`
 *    removes the two outer letters and calls itself; it compares nothing. That
 *    is deliberate: a trace of the finished palindrome check one card before
 *    `b8` asks for it is transcription with extra steps. What the learner reads
 *    off the trace is the chain of substrings and which call stops it — the two
 *    things `b8` then has to get right — while the decision (`s[0]` against the
 *    last letter, and the early `return 0`) stays theirs to write.
 *
 * 3. **The brief's `== 0` bug does not exist in Python, so it is not taught as
 *    if it did.** With the shrink written `s[1:len(s) - 1]`, a one-letter word
 *    slices to `s[1:0]`, which is the empty string — so a base case of only
 *    `len(s) == 0` really does terminate, on odd words too. Executed and
 *    confirmed before anything was written. The bug that IS real is the mirror
 *    of it: `len(s) == 1` alone crashes with IndexError on `abba` and `aa`,
 *    because an even word reaches zero letters and never touches the test.
 *    `len(s) <= 1` covers both landings, which is what `b5` teaches on numbers,
 *    where the parity trap is genuine: stepping down by 2 from an odd `n`
 *    steps straight over `n == 0` and never comes back. No card in this lesson
 *    claims that `== 0` breaks odd words, because it does not.
 *
 * 4. **`RecursionError` appears exactly once, in `b4`, and never as the only
 *    teaching bug.** A crash tells a fourteen-year-old that something is wrong
 *    without telling them what, so the first repair (`b3`) is a wrong ANSWER —
 *    `banana` counted as two letters `a` instead of three — and the runaway is
 *    the second. It is safe to put on screen because Python stops it itself
 *    after about a thousand frames instead of hanging, unlike October's
 *    infinite `while`.
 *
 * 5. **"Write it recursively" is guidance, not a graded rule.** Output
 *    comparison cannot see a `while` loop that produces the same digits, and
 *    no case set a source file can hold will make one time out. Option 2 of the
 *    contract's three, chosen because option 1 is genuinely unavailable —
 *    anything a recursion prints, a loop can print — and because option 3 is
 *    taken as well, for the route the programme requires it of: `b10` is
 *    advanced-only, it asks what the function answers without calling itself
 *    and why every word reaches that case, and a teacher reads it. So the
 *    prompts of `b8` and `b9` say the recursion is the point and that the mark
 *    is on the answer. Neither prompt names the one-line shortcut for the
 *    palindrome — writing `s[::-1]` into a prompt in order to forbid it would
 *    teach it to every learner who had not thought of it.
 *
 * 6. **The degenerate programs, named, with the case that kills each.**
 *    `b8` (symmetry): comparing only the two outer letters dies on `abca`
 *    (visible) and on `abcda` (hidden, odd, ends equal); a base case of
 *    `len(s) <= 2` — stopping one pair short — dies on `abca` and on `ab`;
 *    comparing `s[0]` with `s[1]` instead of with the last letter dies on
 *    `kayak`; a program that always prints `yes` dies on five cases; the
 *    one-letter and two-letter words are both there because they are the two
 *    landings the base case has to cover.
 *    `b9` (digit sum): stopping one digit short (`n < 100`) dies on `99` and
 *    `10`; a base case returning 0 instead of `n` drops the leading digit and
 *    dies on `7`; first-digit-plus-last-digit dies on `1234` and `1002`; `9`
 *    and `10` sit either side of the base case's boundary and `0` is on it.
 *
 * 7. **What is left to other lessons.** «Факториал мен дәрежені өзін-өзі
 *    шақыру арқылы есептеу» is the month's other named number family and it
 *    belongs to `m6.l3` and the practice bank, so this lesson's number
 *    recursion is the digit sum instead — a second function, not a second copy.
 *    Backtracking is not here at all: «күрделі кері қайту тәсілі биыл бүкіл
 *    топқа нөлден жаздырылмайды».
 *
 * Routes: core and advanced write `b8` from the blank editor; support meets the
 * same problem as `b8s`, where the base-case test and the two comparisons are
 * given and the two things this lesson is about — what the smallest word
 * answers, and what the smaller call receives — are the blanks. Support still
 * writes `b9` from scratch. Advanced additionally gets `b10`.
 *
 * Python: `def`, `return`, `if/else`, `len`, `%`, `//`, indexing and slicing.
 * Nothing imported, no `**`, no negative index, no `s[::-1]`.
 */

const P = 9;

export const M6_L4: LessonBlock[] = [
  {
    id: "m6.l4.b1",
    type: "concept",
    skillRefs: ["recursion.base_case", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    title: {
      kk: "Тоқтату шарты — рекурсияның аяқталатын жері",
      ru: "Базовый случай — место, где рекурсия заканчивается",
    },
    body: {
      kk:
        "Өзін-өзі шақыратын функцияда әрқашан екі бөлік болады. Біріншісі — **тоқтату шарты**: ешкімді шақырмай, жауапты бірден қайтаратын ең кішкентай жағдай. Екіншісі — сол функцияның өзін **кішірек** есеппен шақыратын жол.\n\n" +
        "Ереже қарапайым: тоқтату шартын әрқашан бірінші жаз. Шақыру жолын алдымен жазсаң, функция шексіз тереңдеп кетеді, ал сен мұны әлдеқайда кеш байқайсың.\n\n" +
        "Тоқтату шарты екі түрлі жолмен бұзылады.\n\n" +
        "**Бірінші жол: шарт мүлде жоқ.** Шақырулар тізбегі ешқашан аяқталмайды. Python оны шамамен мың шақырудан кейін өзі үзеді де, `RecursionError` деген қатені шығарады. Бағдарлама мәңгі ілініп қалмайды, бірақ жауап та бермейді.\n\n" +
        "**Екінші жол: шарт бар, бірақ оған ешқашан жетпейміз.** Мұның себебі екеу. Не аргумент кішіреймейді — функция өзін дәл сол мәнмен шақырады. Не аргумент тоқтау нүктесінің үстінен аттап өтеді: мысалы, әр қадамда 2-ге азайып отырған тақ сан 0-ді басып озып, теріс жаққа кетеді. Екеуінің де соңы бірдей — сол `RecursionError`.\n\n" +
        "Төмендегі функция `n` санын 0-ге жеткенше екіге бөліп отырады да, неше бөлу керек болғанын санайды. Мұндағы тоқтату шарты — `n == 0`, яғни жауабы бірден белгілі ең кішкентай жағдай. Ал `n // 2` әр қадамда шынымен кішірейеді және теріс емес сан үшін 0-ге міндетті түрде түседі, сондықтан шартқа жетеміз. Қаңтарда екіге бөліп іздегенде дәл осылай — әр қадамда жарты бөлікті лақтырып отырғанбыз.\n\n" +
        "Бұл сабақта сөзбен де жұмыс істейміз, сондықтан үш жазуды еске түсіріп қоялық: `s[0]` — бірінші әріп, `s[len(s) - 1]` — соңғы әріп, `s[1:]` — бірінші әріпсіз қалған бөлік, ал `s[1:len(s) - 1]` — екі шеткі әріпсіз ішкі бөлік.",
      ru:
        "В функции, которая вызывает саму себя, всегда есть две части. Первая — **базовый случай**: самая маленькая ситуация, в которой ответ возвращается сразу, без единого вызова. Вторая — строка, где функция вызывает саму себя с **меньшей** задачей.\n\n" +
        "Правило простое: базовый случай пиши всегда первым. Если сначала написать вызов, функция будет уходить вглубь бесконечно, а заметишь ты это гораздо позже.\n\n" +
        "Базовый случай ломается двумя способами.\n\n" +
        "**Способ первый: его вообще нет.** Цепочка вызовов не заканчивается никогда. Python обрывает её сам примерно после тысячи вызовов и выдаёт ошибку `RecursionError`. Программа не зависает навсегда, но и ответа не даёт.\n\n" +
        "**Способ второй: он есть, но до него не доходят.** Причин две. Либо аргумент не уменьшается — функция вызывает себя ровно с тем же значением. Либо аргумент перешагивает через точку остановки: например, нечётное число, уменьшаясь каждый раз на 2, проскакивает 0 и уходит в минус. Итог у обеих причин один и тот же — тот же самый `RecursionError`.\n\n" +
        "Функция ниже делит `n` пополам, пока не дойдёт до 0, и считает, сколько делений понадобилось. Базовый случай здесь — `n == 0`, то есть самая маленькая ситуация, ответ для которой известен сразу. А `n // 2` действительно уменьшается на каждом шаге и для неотрицательного числа обязательно опускается до 0, поэтому до условия мы доходим. В январе при двоичном поиске было то же самое: на каждом шаге мы выбрасывали половину.\n\n" +
        "На этом уроке мы работаем и со словами, поэтому вспомним три записи: `s[0]` — первая буква, `s[len(s) - 1]` — последняя, `s[1:]` — то, что осталось без первой буквы, а `s[1:len(s) - 1]` — внутренняя часть без двух крайних букв.",
    },
    code:
      "def half_steps(n):\n" +
      "    if n == 0:\n" +
      "        return 0\n" +
      "    return 1 + half_steps(n // 2)\n" +
      "print(half_steps(20))",
  },
  {
    /*
     * The off-by-one base case, and the prompt says out loud what the function
     * was written FOR so that the gap between intent and code is the whole
     * question. The stopping test fires one step early: the 1 is never added.
     *
     * Only «10» is mapped. It is the sum the function was supposed to produce,
     * and the only way to arrive at it is to trace the intent instead of the
     * written test — 4 + 3 + 2 is 9 no matter how the addition is done, so a
     * slip in the arithmetic cannot land there. «4» and «0» are left unmapped:
     * either can come from stopping at the first return, or from reading
     * `return n` where `return n + total(n - 1)` is written, and two causes
     * means the engine asks instead of telling.
     */
    id: "m6.l4.b2",
    type: "prediction",
    skillRefs: ["recursion.base_case", "func.return"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл функция 1-ден `n`-ге дейінгі сандардың қосындысын есептеу үшін жазылған. Бірақ сұрақ — оның не істеуі керек екенінде емес, шын мәнінде нені шығаратынында. Бағдарлама нені шығарады?",
      ru: "Эта функция написана для того, чтобы считать сумму чисел от 1 до `n`. Но вопрос не в том, что она должна делать, а в том, что она выводит на самом деле. Что выведет программа?",
    },
    code:
      "def total(n):\n" +
      "    if n == 1:\n" +
      "        return 0\n" +
      "    return n + total(n - 1)\n" +
      "print(total(4))",
    answer: "9",
    options: ["10", "9", "4", "0"],
    diagnosticMapping: {
      "10": {
        failureClass: "base_case_read_as_intended_not_as_written",
        justification:
          "10 — бұл 1 + 2 + 3 + 4, яғни функция істеуге тиіс жұмыстың нәтижесі. Кодта жазылған тоқтату шарты `n == 1` болғанда 1-дің орнына 0 қайтарады, сондықтан бірлік қосындыға ешқашан кірмейді. Бұл жауап шартты кодта жазылғандай емес, ойда болғандай оқығанда ғана шығады.",
      },
    },
  },
  {
    /*
     * Repair number one, and it is a wrong ANSWER rather than a crash: the
     * stopping test fires while one letter is still unread, so the last letter
     * of every word is ignored. «Соңғы элементті өткізіп жіберу» is an error
     * October names by hand (PDF p.7) and it survives into recursion unchanged.
     *
     * symptomInput is required and it is a word: the fallback probe is a spread
     * of plain numbers, and `int` never reaches this program at all — `input()`
     * here is text, and on a single digit both versions print 0 and the bug
     * reads as absent.
     *
     * No diagnosticMapping. Naming line 5 could mean «қосу дұрыс емес» or «бұл
     * жол мүлде керек емес», and line 6 could mean either of those about the
     * other branch — several causes per line, so the engine asks.
     */
    id: "m6.l4.b3",
    type: "find_bug",
    skillRefs: ["recursion.base_case", "debug.boundary", "strings.sequence"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама сөзде `a` әрпінің неше рет кездесетінін санауы керек. Функция бірінші әріпті тексеріп, қалған бөлігі үшін өзін қайта шақырады. Бірақ `banana` сөзін бергенде ол 3 емес, 2 шығарады. Қай жол кінәлі және неге?",
      ru: "Программа должна считать, сколько раз в слове встречается буква `a`. Функция проверяет первую букву и вызывает себя для остатка слова. Но на слове `banana` она выводит 2 вместо 3. Какая строка виновата и почему?",
    },
    code:
      "def count_a(s):\n" +
      "    if len(s) == 1:\n" +
      "        return 0\n" +
      '    if s[0] == "a":\n' +
      "        return 1 + count_a(s[1:])\n" +
      "    return count_a(s[1:])\n" +
      "w = input()\n" +
      "print(count_a(w))",
    buggyLine: 2,
    symptomInput: "banana",
    fixedCode:
      "def count_a(s):\n" +
      "    if len(s) == 0:\n" +
      "        return 0\n" +
      '    if s[0] == "a":\n' +
      "        return 1 + count_a(s[1:])\n" +
      "    return count_a(s[1:])\n" +
      "w = input()\n" +
      "print(count_a(w))",
  },
  {
    /*
     * Repair number two: the stopping test is correct and is never reached,
     * because the call passes the same `i` back. The prompt says the base case
     * is fine on purpose — the learner's job is to notice that the ARGUMENT is
     * what has to move, which is the second of the two failure modes `b1`
     * names.
     *
     * This is the lesson's only runaway, and it is safe to show: Python stops
     * it after about a thousand frames with `RecursionError` instead of
     * hanging. It also prints nothing at all, which is why the repaired
     * program printing 12 is a visible difference.
     *
     * symptomInput is declared even though the numeric probe would happen to
     * expose it: `4 1 7` is the list the prompt talks about, and a witness that
     * matches the prompt is worth more than one that merely works.
     */
    id: "m6.l4.b4",
    type: "find_bug",
    skillRefs: ["recursion.base_case", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама тізімдегі сандардың қосындысын рекурсиямен есептеуі керек: `add_from(a, i)` — тізімнің `i` индексінен бастап қалған бөлігінің қосындысы. `4 1 7` енгізгенде 12 шығуы тиіс, бірақ бағдарлама ештеңе шығармай, `RecursionError` қатесімен тоқтайды. Тоқтату шарты дұрыс жазылған. Онда қай жол кінәлі және неге?",
      ru: "Программа должна считать сумму чисел списка рекурсией: `add_from(a, i)` — это сумма остатка списка, начиная с индекса `i`. При вводе `4 1 7` должно получиться 12, но программа ничего не выводит и останавливается с ошибкой `RecursionError`. Базовый случай записан правильно. Тогда какая строка виновата и почему?",
    },
    code:
      "def add_from(a, i):\n" +
      "    if i == len(a):\n" +
      "        return 0\n" +
      "    return a[i] + add_from(a, i)\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(add_from(nums, 0))",
    buggyLine: 4,
    symptomInput: "4 1 7",
    fixedCode:
      "def add_from(a, i):\n" +
      "    if i == len(a):\n" +
      "        return 0\n" +
      "    return a[i] + add_from(a, i + 1)\n" +
      "nums = list(map(int, input().split()))\n" +
      "print(add_from(nums, 0))",
  },
  {
    /*
     * Where the parity trap is REAL. Stepping down by 2, an odd `n` goes
     * 7, 5, 3, 1, −1, −3 … and never equals 0, so `n == 0` is a stopping test
     * the argument walks straight past — the second failure mode from `b1`,
     * now as a choice rather than as prose. All four options were executed:
     * `n <= 0` gives 4, 4, 0, 1 for n = 7, 8, 0, 1; `n == 0` and `n == 1` both
     * die with RecursionError on half the inputs; `n < 0` terminates and
     * quietly counts one jump too many for even n, and answers 1 for n = 0.
     *
     * Only o1 is mapped. o4 is left alone deliberately: it can come from
     * over-correcting the odd case, or from reading «0-ге жетеміз» as «0-ден
     * өтеміз», and two causes means the engine should ask.
     */
    id: "m6.l4.b5",
    type: "multiple_choice",
    skillRefs: ["recursion.base_case", "debug.boundary"],
    sourceType: "product-authored",
    prompt: {
      kk: "`jumps(n)` функциясы `n` санынан 2-ні неше рет алып тастағанда нәтиже 0-ге не одан кіші санға жететінін санауы керек. Мысалы `jumps(8)` — 4, `jumps(7)` — 4, `jumps(1)` — 1, `jumps(0)` — 0. Мұндағы `n` — теріс емес бүтін сан, ол жұп та, тақ та болуы мүмкін. Комментарий тұрған жерге қай тоқтату шартын жазу керек?",
      ru: "Функция `jumps(n)` должна считать, сколько раз нужно вычесть 2 из `n`, чтобы результат стал равен 0 или меньше. Например, `jumps(8)` — это 4, `jumps(7)` — 4, `jumps(1)` — 1, `jumps(0)` — 0. Здесь `n` — неотрицательное целое число, и оно может быть как чётным, так и нечётным. Какое условие остановки нужно поставить на место комментария?",
    },
    code: "def jumps(n):\n    # ???\n    return 1 + jumps(n - 2)",
    options: [
      {
        id: "o1",
        label: {
          kk: "`if n == 0: return 0` — дәл нөлге тигенде тоқтау",
          ru: "`if n == 0: return 0` — остановиться ровно на нуле",
        },
      },
      {
        id: "o2",
        label: {
          kk: "`if n <= 0: return 0` — нөлге не одан төмен түскенде тоқтау",
          ru: "`if n <= 0: return 0` — остановиться на нуле или ниже",
        },
      },
      {
        id: "o3",
        label: {
          kk: "`if n == 1: return 0` — бірге тигенде тоқтау",
          ru: "`if n == 1: return 0` — остановиться на единице",
        },
      },
      {
        id: "o4",
        label: {
          kk: "`if n < 0: return 0` — сан теріс болғанда ғана тоқтау",
          ru: "`if n < 0: return 0` — остановиться только когда число стало отрицательным",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "base_case_skipped_by_parity",
        justification:
          "Тақ `n` үшін мәндер 7, 5, 3, 1, −1, −3 … болып жүреді де, 0-ге ешқашан тең болмайды: шарт орындалмай қалады, ал шақырулар тоқтамайды. Бұл нұсқа тек жұп сандарды тексергенде ғана дұрыс көрінеді, сондықтан таңдау аргумент тоқтау нүктесін аттап өте алатынын ескермегенді көрсетеді.",
      },
    },
  },
  {
    /*
     * The base case is not always «нөл» — it is the smallest case you can still
     * ANSWER. Here that is one letter, because the empty word has no last
     * letter to return, and a learner who has just repaired `b3` (where
     * `len(s) == 1` was the bug) has to notice that the right test depends on
     * the question and not on a fixed number. That tension is the point of the
     * card and it is stated in both prompts.
     *
     * Both blanks have exactly one intended answer. `len(s) == 0` really does
     * fail here — it slices past the end and asks for `s[0]` of an empty
     * string — so the alternatives list carries only the equivalent spelling of
     * the shrink, not a second correct stopping test.
     */
    id: "m6.l4.b6",
    type: "fill_blank",
    skillRefs: ["recursion.base_case", "recursion.core", "strings.sequence"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл функция сөздің соңғы әрпін қайтарады, бірақ индекспен емес: әр шақыруда бірінші әріпті алып тастап, қалған бөлікпен өзін қайта шақырады. Тоқтату шарты — жауабы бірден белгілі ең кішкентай сөз, яғни одан кішісін алсаң, қайтаратын әріп қалмайтын сөз. Екі орынды толықтыр: тоқтау шартындағы санды және кішірейген шақыруға берілетін бөлікті.",
      ru: "Эта функция возвращает последнюю букву слова, но не через индекс: на каждом вызове она убирает первую букву и вызывает себя с остатком. Базовый случай — самое маленькое слово, ответ для которого известен сразу, то есть такое, меньше которого возвращать уже нечего. Дополни два места: число в условии остановки и ту часть, которая передаётся в уменьшенный вызов.",
    },
    template:
      "def last(s):\n" +
      "    if len(s) == ___:\n" +
      "        return s[0]\n" +
      "    return last(___)\n" +
      "w = input()\n" +
      "print(last(w))",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "s[1:]", alternatives: ["s[1:len(s)]"] },
    ],
  },
  {
    /*
     * «Айдың орталық құралы - шақырулар ағашы», written down by hand because
     * the visualiser does not exist yet.
     *
     * `peel` is the shrinking half of the symmetry check and NOTHING else: it
     * compares no letters and decides nothing. That keeps `b8` a task rather
     * than a transcription, and it puts exactly this lesson's two questions on
     * the card — which word does each call receive, and which call is the one
     * that stops. The word is a five-letter palindrome so the chain runs its
     * full length and lands on the one-letter case; `core` then reports which
     * landing happened, which is what `b8`'s stopping test has to cover.
     */
    id: "m6.l4.b7",
    type: "trace_code",
    skillRefs: ["recursion.call_tree", "recursion.base_case", "strings.sequence"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    prompt: {
      kk: "`peel` — сөз симметриясын тексерудің тек қысқарту бөлігі: ол әлі ешнәрсені салыстырмайды, тек екі шеткі әріпті алып тастап, ішкі бөлікпен өзін қайта шақырады. Қағазға `s` бағанын сыз да, 2-жол әр шақыруда қандай сөзді шығаратынын ретімен жаз. Соңында 6-жол орындалғаннан кейінгі `core` мәнін жаз: ол тоқтату шартына неше әріппен келгенімізді көрсетеді.",
      ru: "`peel` — это только уменьшающая половина проверки на симметрию: она пока ничего не сравнивает, а лишь убирает две крайние буквы и вызывает себя с внутренней частью. Начерти на бумаге столбец `s` и выпиши по порядку, какое слово печатает строка 2 на каждом вызове. В конце запиши значение `core` после выполнения строки 6: оно показывает, со сколькими буквами мы пришли к условию остановки.",
    },
    code:
      "def peel(s):\n" +
      "    print(s)\n" +
      "    if len(s) <= 1:\n" +
      "        return len(s)\n" +
      "    return peel(s[1:len(s) - 1])\n" +
      'core = peel("kayak")\n' +
      "print(core)",
    steps: [
      { line: 2, vars: { s: '"kayak"' } },
      { line: 2, vars: { s: '"aya"' } },
      { line: 2, vars: { s: '"y"' } },
      { line: 6, vars: { core: "1" } },
    ],
  },
  {
    /*
     * PDF p.9: «сөз симметриясын осы тәсілмен тексеру». The blank editor, for
     * core and advanced; support meets the same problem at `b8s`.
     *
     * The prompt does not list the two landings of the stopping test — that is
     * the work. It also does not name the one-line reversal shortcut: a prompt
     * that forbids `s[::-1]` by writing it out teaches it to everyone who had
     * not thought of it, and no output comparison could enforce the ban
     * anyway. So the recursion is stated as the point of the exercise and the
     * mark is stated as being on the answer — the contract's option 2 — while
     * `b10` sends the structural question to a teacher for advanced.
     *
     * Cases, one line each, against the programs that are not the method:
     *   kayak, abca   — visible. `abca` is the endpoint-only shortcut's grave
     *                   and also kills a stopping test of `len(s) <= 2`.
     *   abba, aa      — even words: the chain lands on ZERO letters. A test of
     *                   only `len(s) == 1` crashes here with IndexError.
     *   a             — one letter, the other landing.
     *   ab            — two different letters: the second grave of `<= 2`.
     *   abcda         — odd, ends equal, middle not: the endpoint-only
     *                   shortcut's hidden grave.
     *   abcd          — the mismatch is on the outermost pair, first call.
     *   aabbaa, aab   — a longer even palindrome, and an odd non-palindrome.
     *   level         — a second odd palindrome with no repeated neighbours,
     *                   which is what kills `s[0] != s[1]`.
     */
    id: "m6.l4.b8",
    type: "write_code",
    skillRefs: ["recursion.core", "recursion.base_case", "strings.sequence"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Кіші латын әріптерінен тұратын бір сөз беріледі: кемінде бір әріп, бос орын жоқ. Сөз симметриялы ма — солдан оңға да, оңнан солға да оқығанда бірдей ме? Симметриялы болса `yes`, болмаса `no` деген ағылшын сөзін шығар (жауап дәл осы екі сөздің бірі болуы керек). Есепті өзін-өзі шақыратын функциямен шеш: шеткі екі әріпті салыстыр да, қалған ішкі бөлік үшін сол функцияны қайта шақыр. Тоқтату шартын бірінші жаз және сөз қысқарып бара жатқанда шақырулар қандай ең кішкентай сөздерге келетінін алдын ала ойлан. Баға тек шыққан жауап бойынша қойылады, ал жаттығудың мәні — рекурсияны өз қолыңмен жазып көру.",
      ru: "Дано одно слово из строчных латинских букв: хотя бы одна буква, пробелов нет. Симметрично ли слово — читается ли оно одинаково слева направо и справа налево? Если симметрично, выведи английское слово `yes`, иначе — `no` (ответ должен быть ровно одним из этих двух слов). Реши задачу функцией, вызывающей саму себя: сравни две крайние буквы и вызови ту же функцию для оставшейся внутренней части. Условие остановки напиши первым и заранее продумай, к каким самым маленьким словам приходят вызовы, пока слово укорачивается. Оценивается только полученный ответ, а смысл упражнения — написать рекурсию своими руками.",
    },
    referenceSolution:
      "def sym(s):\n" +
      "    if len(s) <= 1:\n" +
      "        return 1\n" +
      "    if s[0] != s[len(s) - 1]:\n" +
      "        return 0\n" +
      "    return sym(s[1:len(s) - 1])\n" +
      "word = input()\n" +
      "if sym(word) == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    cases: [
      { input: "kayak", expectedOutput: "yes" },
      { input: "abca", expectedOutput: "no" },
      { input: "abba", expectedOutput: "yes", hidden: true },
      { input: "a", expectedOutput: "yes", hidden: true },
      { input: "aa", expectedOutput: "yes", hidden: true },
      { input: "ab", expectedOutput: "no", hidden: true },
      { input: "abcda", expectedOutput: "no", hidden: true },
      { input: "abcd", expectedOutput: "no", hidden: true },
      { input: "aabbaa", expectedOutput: "yes", hidden: true },
      { input: "aab", expectedOutput: "no", hidden: true },
      { input: "level", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * SUPPORT SUBSTITUTION for `b8`, not an addition to it. PDF p.6: «дайын
     * кодты құрастыру мен толықтыру көбірек, нөлден жазу азырақ». Support meets
     * the same symmetry problem and still writes `b9` from the blank editor;
     * what is withheld is this one blank editor.
     *
     * What is given away is the stopping TEST, with the reason spelled out in
     * the prompt — that is the scaffolding. What stays open is the pair this
     * lesson is actually about: what the smallest word answers, and what the
     * smaller call receives. The two comparisons are already written, so the
     * card cannot be finished by copying `b7`'s `peel`, which shrinks the same
     * way and decides nothing.
     */
    id: "m6.l4.b8s",
    type: "fill_blank",
    skillRefs: ["recursion.core", "recursion.base_case", "strings.sequence"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бағдарлама сөздің симметриялы екенін тексереді: симметриялы болса `yes`, болмаса `no` деген ағылшын сөзін шығарады. Функция шеткі екі әріпті салыстырады да, ішкі бөлік үшін өзін қайта шақырады. Әр шақыруда сөз дәл екі әріпке қысқарады, сондықтан ол ақырында не бір әріпке, не мүлдем нөл әріпке келеді — `len(s) <= 1` шарты сол екеуін де қамтиды. Екі орынды толықтыр: ең кішкентай сөз үшін қандай жауап қайтарылады және кішірейген шақыруға сөздің қай бөлігі беріледі. Функция симметриялы сөз үшін 1, симметриялы емес сөз үшін 0 қайтарады.",
      ru: "Программа проверяет, симметрично ли слово: если да, она выводит английское слово `yes`, если нет — `no`. Функция сравнивает две крайние буквы и вызывает себя для внутренней части. На каждом вызове слово укорачивается ровно на две буквы, поэтому в конце оно приходит либо к одной букве, либо вообще к нулю букв — условие `len(s) <= 1` покрывает оба случая. Дополни два места: какой ответ возвращается для самого маленького слова и какая часть слова передаётся в уменьшенный вызов. Функция возвращает 1 для симметричного слова и 0 для несимметричного.",
    },
    template:
      "def sym(s):\n" +
      "    if len(s) <= 1:\n" +
      "        return ___\n" +
      "    if s[0] != s[len(s) - 1]:\n" +
      "        return 0\n" +
      "    return sym(___)\n" +
      "word = input()\n" +
      "if sym(word) == 1:\n" +
      '    print("yes")\n' +
      "else:\n" +
      '    print("no")',
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "s[1:len(s) - 1]" },
    ],
  },
  {
    /*
     * The month's number families that the PDF names — «факториал мен дәрежені
     * өзін-өзі шақыру арқылы есептеу» — belong to `m6.l3` and the practice
     * bank, so this is product-authored and deliberately a different function:
     * the digit sum, whose base case is interesting for the same reason the
     * symmetry check's is. `n < 10` is not «нөлге жету», it is «бөлетін ештеңе
     * қалмады», and the answer it returns is `n` itself rather than 0.
     *
     * A `while` loop produces the same digits and no output comparison can see
     * the difference, so the recursion is stated as the point of the exercise
     * and the mark is stated as being on the answer — the contract's option 2,
     * the same choice as `b8`.
     *
     * Against the programs that are not the method:
     *   1234, 7   — visible. 7 kills a base case that returns 0 and so loses
     *               the leading digit; 1234 kills first-digit-plus-last-digit.
     *   9, 10     — either side of the base case's boundary.
     *   0         — on the boundary, and the smallest input the prompt allows.
     *   99        — kills a base case of `n < 100`, which stops one digit short.
     *   1002, 505 — zeros inside the number, which a stopping test written
     *               about the last digit would trip over.
     *   987654321, 1000000000 — the top of the stated range, and a number whose
     *               digits are almost all zero.
     */
    id: "m6.l4.b9",
    type: "write_code",
    skillRefs: [
      "recursion.core",
      "recursion.base_case",
      "arith.remainder",
      "arith.integer_division",
    ],
    sourceType: "product-authored",
    prompt: {
      kk: "Теріс емес бүтін сан `n` беріледі (0 ≤ n ≤ 1 000 000 000). Оның цифрларының қосындысын шығар. Мысалы 1234 үшін жауап 10, ал 7 үшін 7. Кеңес: санның соңғы цифры — `n % 10`, ал одан бұрынғы бөлігі — `n // 10`. Есепті өзін-өзі шақыратын функциямен шеш: тоқтату шартын бірінші жаз да, ол қандай санда орындалатынын және сол кезде нені қайтару керек екенін ойлан. Циклмен жазсаң да жауап дұрыс шығады, баға тек жауап бойынша қойылады — бірақ бұл жаттығудың мәні рекурсияда.",
      ru: "Дано неотрицательное целое число `n` (0 ≤ n ≤ 1 000 000 000). Выведи сумму его цифр. Например, для 1234 ответ 10, а для 7 — это 7. Подсказка: последняя цифра числа — это `n % 10`, а часть перед ней — `n // 10`. Реши задачу функцией, вызывающей саму себя: напиши условие остановки первым и продумай, на каком числе оно срабатывает и что в этот момент нужно вернуть. С циклом ответ тоже получится верным, и оценивается только ответ, — но смысл этого упражнения именно в рекурсии.",
    },
    referenceSolution:
      "def digit_sum(n):\n" +
      "    if n < 10:\n" +
      "        return n\n" +
      "    return n % 10 + digit_sum(n // 10)\n" +
      "x = int(input())\n" +
      "print(digit_sum(x))",
    cases: [
      { input: "1234", expectedOutput: "10" },
      { input: "7", expectedOutput: "7" },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "9", expectedOutput: "9", hidden: true },
      { input: "10", expectedOutput: "1", hidden: true },
      { input: "99", expectedOutput: "18", hidden: true },
      { input: "1002", expectedOutput: "3", hidden: true },
      { input: "505", expectedOutput: "10", hidden: true },
      { input: "987654321", expectedOutput: "45", hidden: true },
      { input: "1000000000", expectedOutput: "1", hidden: true },
    ],
  },
  {
    /*
     * ADVANCED ONLY — «шешімді жазбаша қорғау міндетті» (p.6), and the half of
     * February's monthly check that no machine grades: «Тоқтау шарты дұрыс
     * қойылған … функция жазу». Two questions, two short answers, and they are
     * the two halves of a base case actually working: what it answers, and why
     * every input reaches it.
     *
     * It is also the only place where the structural requirement in `b8`'s
     * prompt is checked by anybody, which is the honest way to state one — a
     * teacher reads it. Advanced receives `b8`, so «жаңа ғана жазған
     * функцияңды» is true for the only route that sees this card; support never
     * meets it, and the card it would have to refer to for them is `b8s`.
     *
     * The marking points carry the nuance an author has to have executed to
     * know: with the shrink written `s[1:len(s) - 1]`, a stopping test of only
     * `len(s) == 0` is CORRECT — a one-letter word slices to the empty string —
     * while `len(s) == 1` alone crashes on `abba`. A learner who writes that
     * `== 0` fails on odd words has said something plausible and false, and the
     * teacher needs to be able to see that.
     */
    id: "m6.l4.b10",
    type: "explain",
    skillRefs: ["recursion.base_case", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Жаңа ғана жазған симметрия функцияңды алдыңа қой да, екі сұраққа қысқа жауап жаз. 1) Ол қай жағдайда өзін мүлде шақырмай, жауапты бірден қайтарады? 2) Кез келген сөз сол жағдайға неге міндетті түрде жетеді — мұны сөздің ұзындығы арқылы дәлелде.",
      ru: "Положи перед собой функцию проверки на симметрию, которую ты только что написал, и ответь коротко на два вопроса. 1) В каком случае она возвращает ответ сразу, вообще не вызывая саму себя? 2) Почему любое слово обязательно доходит до этого случая — обоснуй это через длину слова.",
    },
    expectedPoints: [
      {
        kk: "Тоқтату шарты — сөзде салыстыратын жұп қалмаған жағдай: не бір ғана әріп қалды, не әріп мүлде қалмады. Функция ол кезде «симметриялы» деген жауапты бірден қайтарады, себебі бір әріптен тұратын сөз де, бос сөз де солдан оңға да, оңнан солға да бірдей оқылады.",
        ru: "Базовый случай — это когда сравнивать больше нечего: осталась одна буква либо не осталось ни одной. Тогда функция сразу возвращает ответ «симметрично», потому что и слово из одной буквы, и пустое слово читаются одинаково в обе стороны.",
      },
      {
        kk: "Әр шақыру екі шеткі әріпті алып тастайды, сондықтан ұзындық әр қадамда дәл 2-ге кемиді және ешқашан өспейді. Демек шақырулар тізбегі шектеулі: ұзындықтың жартысындай қадамнан кейін ол міндетті түрде 1-ге не 0-ге түседі.",
        ru: "Каждый вызов убирает две крайние буквы, поэтому длина уменьшается ровно на 2 на каждом шаге и никогда не растёт. Значит, цепочка вызовов конечна: примерно за половину длины шагов она обязательно опустится до 1 или до 0.",
      },
      {
        kk: "Жұп ұзындықтағы сөз нөл әріпке, тақ ұзындықтағы сөз бір әріпке келеді. Сондықтан тоқтату шарты екі қонуды да қамтуы керек: `len(s) <= 1` — соның қысқа жазылуы.",
        ru: "Слово чётной длины приходит к нулю букв, слово нечётной длины — к одной. Поэтому условие остановки должно покрывать обе посадки: `len(s) <= 1` — это как раз краткая запись такого условия.",
      },
      {
        kk: "Мұғалімге ескерту: тек `len(s) == 1` деп жазылған шарт `abba` сөзінде IndexError береді, себебі жұп сөз нөл әріпке келіп, шартқа тимей өтеді. Ал тек `len(s) == 0` деп жазылған нұсқа `s[1:len(s) - 1]` қысқартуымен дұрыс жұмыс істейді: бір әріптен тұратын сөз бос сөзге айналады. Сондықтан «`== 0` тақ сөздерде істемейді» деген жауап сенімді естілгенімен, дұрыс емес.",
        ru: "Замечание для учителя: условие, записанное только как `len(s) == 1`, даёт IndexError на слове `abba`, потому что слово чётной длины приходит к нулю букв и проходит мимо условия. А вариант только с `len(s) == 0` при сокращении `s[1:len(s) - 1]` работает верно: слово из одной буквы превращается в пустое. Поэтому ответ «`== 0` не работает на нечётных словах» звучит убедительно, но неверен.",
      },
    ],
  },
];
