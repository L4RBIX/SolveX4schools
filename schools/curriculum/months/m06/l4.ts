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
 * ## THE ONE THING THE C++ MIGRATION CHANGED, AND IT CHANGED THE LESSON
 *
 * Python raises `RecursionError` at about a thousand frames. It is a named,
 * catchable, demonstrable event, and the Python version of this lesson taught
 * on it: `b1` described it, `b4` showed it, `b10`'s marking points named it.
 *
 * **C++ has nothing of the kind.** Nothing counts the depth, nothing raises,
 * nothing can be caught. A recursion that does not stop consumes the call
 * stack until the stack is gone, and then the program dies — with no message
 * a learner can read, and no guarantee about what it prints on the way out.
 * That is undefined behaviour, and it really does differ between the engines
 * this course actually uses, which was measured rather than assumed
 * (`docs/cpp17/CPP17_JUDGE_PARITY.md`): the browser and the CI harness compile
 * at `-O2` and Judge0 compiles at `-O0`. Built at `-O0`, `b4`'s broken program
 * terminates abruptly and prints nothing; built at `-O2` the same source prints
 * `0` and exits cleanly, because a compiler is entitled to assume a function
 * that cannot terminate is never called. Same source, two behaviours, no error
 * either time — and a learner who presses Run and then Submit sees both.
 *
 * So this lesson had to be re-authored rather than translated, and the
 * replacement is the one the pedagogy document asks for: **depth is something
 * you reason about BEFORE you run, not an exception you catch afterwards.**
 *
 *   · `b1` states it as a fact about the machine — every call takes a small
 *     piece of a limited area of memory, a few thousand nested calls are fine,
 *     hundreds of thousands are not — and then says that C++ will not warn you.
 *   · `b4` keeps the runaway as the defect but its prompt describes what the
 *     learner will actually see (nothing, and an abrupt stop) instead of naming
 *     an error that does not exist.
 *   · `b5` is unchanged in substance: an argument that steps over its stopping
 *     value is still the second failure mode, and the consequence is now
 *     "the program dies" rather than "Python complains".
 *   · `b10`'s teacher note was rewritten: in Python the wrong base case gave
 *     `IndexError` on `abba`, which is a defined and visible event; in C++ the
 *     same program reads past the end of a string, which is undefined — it may
 *     crash, and it may quietly answer wrongly, and the second is worse.
 *
 * Every recursion in this file is depth-bounded by its own stated limits: the
 * words are at most 100 letters (depth 50), `digit_sum` is at most ten digits,
 * `half_steps` at most about thirty. Nothing here goes near a thousand frames.
 *
 * ## Words in C++, introduced here because this is where words arrive
 *
 * `b1` adds the string vocabulary the lesson needs and nothing more: `string`,
 * `cin >> s`, `s.size()`, `s[0]` (a single character, so it is compared with
 * single quotes: `s[0] == 'a'`), `s[s.size() - 1]`, `s.substr(1)` and
 * `s.substr(1, s.size() - 2)`. A `string` parameter is taken BY VALUE here, so
 * each call gets its own copy and the caller's word is untouched — which is
 * exactly the behaviour Python's slicing had, and which `m6.l6` then relies on.
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
 * 3. **The `== 0` bug does not exist here either, so it is not taught as if it
 *    did.** With the shrink written `s.substr(1, s.size() - 2)`, a one-letter
 *    word gives `substr(1, …)` with `pos` equal to the length, which is legal
 *    and yields the empty string — so a base case of only `s.size() == 0`
 *    really does terminate, on odd words too. Executed and confirmed on both
 *    the harness compiler and `-O0` before anything was written. The bug that
 *    IS real is the mirror of it: `s.size() == 1` alone reaches zero letters on
 *    an even word, and then `s[s.size() - 1]` indexes a `string` at a position
 *    that does not exist. In Python that was `IndexError`; in C++ it is
 *    undefined behaviour. `s.size() <= 1` covers both landings, which is what
 *    `b5` teaches on numbers, where the parity trap is genuine.
 *
 * 4. **The runaway appears exactly once, in `b4`, and never as the only
 *    teaching bug.** A program that dies without a message tells a
 *    fourteen-year-old that something is wrong without telling them what, so
 *    the first repair (`b3`) is a wrong ANSWER — `banana` counted as two
 *    letters `a` instead of three — and the runaway is the second.
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
 *    is on the answer. Neither prompt names a one-line reversal shortcut —
 *    writing one into a prompt in order to forbid it would teach it to every
 *    learner who had not thought of it.
 *
 * 6. **The degenerate programs, named, with the case that kills each.**
 *    `b8` (symmetry): comparing only the two outer letters dies on `abca`
 *    (visible) and on `abcda` (hidden, odd, ends equal); a base case of
 *    `s.size() <= 2` — stopping one pair short — dies on `abca` and on `ab`;
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
 * C++: functions with a declared return type above `main`, `return`, `if/else`,
 * `string`, `.size()`, `.substr()`, indexing, `%`, `/` on `int`, `vector<int>&`.
 * Nothing beyond `<iostream>`, `<string>` and `<vector>`.
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
        "**Бірінші жол: шарт мүлде жоқ.** Шақырулар тізбегі ешқашан аяқталмайды.\n\n" +
        "**Екінші жол: шарт бар, бірақ оған ешқашан жетпейміз.** Мұның себебі екеу. Не аргумент кішіреймейді — функция өзін дәл сол мәнмен шақырады. Не аргумент тоқтау нүктесінің үстінен аттап өтеді: мысалы, әр қадамда 2-ге азайып отырған тақ сан 0-ді басып озып, теріс жаққа кетеді.\n\n" +
        "**Екеуінің де соңы C++-та бірдей, әрі ол жаман соңы.** Компьютер әр шақыруға арналған мәліметтерді *стек* деп аталатын шектеулі жадта сақтайды. Шақырулар тоқтамаса, сол жад бітеді де, бағдарлама жай ғана күйреп тоқтайды: экранда сан да, түсінікті қате хабары да болмайды. C++ шақырулардың тереңдігін ешқашан санамайды және сені алдын ала ескертпейді. Оның үстіне мұндай бағдарламаның не істейтіні алдын ала белгісіз: бір компьютерде ол күйреп қалады, екіншісінде мүлде басқа сан шығарып, тыныш аяқталады. Сондықтан ережені былай есте сақта: **тереңдікті іске қоспас бұрын ойлап шығу керек.** «Бұл функция ең көбі неше рет тереңдейді?» — деген сұрақтың жауабын жазбас бұрын білу керек. Бірнеше мың шақыру — қалыпты жағдай, ал жүз мыңдап шақыру — қауіпті.\n\n" +
        "Төмендегі функция `n` санын 0-ге жеткенше екіге бөліп отырады да, неше бөлу керек болғанын санайды. Мұндағы тоқтату шарты — `n == 0`, яғни жауабы бірден белгілі ең кішкентай жағдай. Ал `n / 2` (бүтін бөлу) әр қадамда шынымен кішірейеді және теріс емес сан үшін 0-ге міндетті түрде түседі, сондықтан шартқа жетеміз. Тереңдігі де қауіпсіз: `n` миллиард болса да, екіге бөлу отыз шақырудан аспайды. Қаңтарда екіге бөліп іздегенде дәл осылай — әр қадамда жарты бөлікті лақтырып отырғанбыз.\n\n" +
        "Бұл сабақта сөзбен де жұмыс істейміз, сондықтан C++-тағы сөз жазуларын енгізіп алайық. Сөз — `string` түрі, оны `cin >> s;` арқылы оқимыз (бос орынға дейінгі бөлікті алады). `s.size()` — әріптер саны. `s[0]` — бірінші әріп; бұл — бір ғана таңба, сондықтан оны жалқы тырнақшамен салыстырамыз: `s[0] == 'a'`. `s[s.size() - 1]` — соңғы әріп. `s.substr(1)` — бірінші әріпсіз қалған бөлік, ал `s.substr(1, s.size() - 2)` — екі шеткі әріпсіз ішкі бөлік. Функцияға сөзді `string s` деп жіберсек, әр шақыру өзінің көшірмесін алады: іштегі өзгерістер шақырған жақтағы сөзге тимейді.",
      ru:
        "В функции, которая вызывает саму себя, всегда есть две части. Первая — **базовый случай**: самая маленькая ситуация, в которой ответ возвращается сразу, без единого вызова. Вторая — строка, где функция вызывает саму себя с **меньшей** задачей.\n\n" +
        "Правило простое: базовый случай пиши всегда первым. Если сначала написать вызов, функция будет уходить вглубь бесконечно, а заметишь ты это гораздо позже.\n\n" +
        "Базовый случай ломается двумя способами.\n\n" +
        "**Способ первый: его вообще нет.** Цепочка вызовов не заканчивается никогда.\n\n" +
        "**Способ второй: он есть, но до него не доходят.** Причин две. Либо аргумент не уменьшается — функция вызывает себя ровно с тем же значением. Либо аргумент перешагивает через точку остановки: например, нечётное число, уменьшаясь каждый раз на 2, проскакивает 0 и уходит в минус.\n\n" +
        "**Итог у обоих способов в C++ один и тот же, и он неприятный.** Данные каждого вызова компьютер держит в ограниченной области памяти — её называют стеком. Если вызовы не заканчиваются, эта память кончается, и программа просто аварийно обрывается: на экране нет ни числа, ни понятного сообщения об ошибке. C++ никогда не считает глубину вызовов и не предупреждает тебя заранее. Более того, что именно сделает такая программа, заранее неизвестно: на одной машине она обрывается, на другой печатает совсем другое число и завершается спокойно. Поэтому правило запомни так: **о глубине нужно думать ДО запуска.** На вопрос «сколько раз максимум эта функция уйдёт вглубь?» ответ надо знать до того, как нажмёшь «выполнить». Несколько тысяч вызовов — нормально, сотни тысяч — опасно.\n\n" +
        "Функция ниже делит `n` пополам, пока не дойдёт до 0, и считает, сколько делений понадобилось. Базовый случай здесь — `n == 0`, то есть самая маленькая ситуация, ответ для которой известен сразу. А `n / 2` (целочисленное деление) действительно уменьшается на каждом шаге и для неотрицательного числа обязательно опускается до 0, поэтому до условия мы доходим. И глубина безопасна: даже для миллиарда деление пополам укладывается в тридцать вызовов. В январе при двоичном поиске было то же самое: на каждом шаге мы выбрасывали половину.\n\n" +
        "На этом уроке мы работаем и со словами, поэтому введём записи для слов в C++. Слово — это тип `string`, читаем его через `cin >> s;` (он берёт кусок до пробела). `s.size()` — количество букв. `s[0]` — первая буква; это один-единственный символ, поэтому сравниваем его в одинарных кавычках: `s[0] == 'a'`. `s[s.size() - 1]` — последняя буква. `s.substr(1)` — то, что осталось без первой буквы, а `s.substr(1, s.size() - 2)` — внутренняя часть без двух крайних букв. Если передать слово в функцию как `string s`, каждый вызов получит свою копию: изменения внутри не затронут слово вызывающей стороны.",
    },
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int half_steps(int n) {\n" +
      "    if (n == 0) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return 1 + half_steps(n / 2);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << half_steps(20);\n" +
      "    return 0;\n" +
      "}",
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
     * `return n;` where `return n + total(n - 1);` is written, and two causes
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
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int total(int n) {\n" +
      "    if (n == 1) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return n + total(n - 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << total(4);\n" +
      "    return 0;\n" +
      "}",
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
     * of plain numbers, and on a single digit `count_a` returns 0 from both
     * versions, so the bug would read as absent.
     *
     * `string s` is taken by value on purpose — `s.substr(1)` produces a fresh
     * word and each call owns its own copy, which is the same behaviour the
     * Python slice had and which the whole month relies on.
     *
     * No diagnosticMapping. Naming the `+ 1` line could mean «қосу дұрыс емес»
     * or «бұл жол мүлде керек емес», and the line below it could mean either of
     * those about the other branch — several causes per line, so the engine
     * asks.
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
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int count_a(string s) {\n" +
      "    if (s.size() == 1) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    if (s[0] == 'a') {\n" +
      "        return 1 + count_a(s.substr(1));\n" +
      "    }\n" +
      "    return count_a(s.substr(1));\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string w;\n" +
      "    cin >> w;\n" +
      "    cout << count_a(w);\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 6,
    symptomInput: "banana",
    fixedCode:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int count_a(string s) {\n" +
      "    if (s.size() == 0) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    if (s[0] == 'a') {\n" +
      "        return 1 + count_a(s.substr(1));\n" +
      "    }\n" +
      "    return count_a(s.substr(1));\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string w;\n" +
      "    cin >> w;\n" +
      "    cout << count_a(w);\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * Repair number two: the stopping test is correct and is never reached,
     * because the call passes the same `i` back. The prompt says the base case
     * is fine on purpose — the learner's job is to notice that the ARGUMENT is
     * what has to move, which is the second of the two failure modes `b1`
     * names.
     *
     * THIS IS THE BLOCK THE C++ MIGRATION CHANGED MOST, and only in its prompt.
     * The Python version promised `RecursionError`, a named event Python raises
     * at about a thousand frames. C++ raises nothing. Measured on this
     * program's own source before the prompt was written:
     *
     *   built at `-O0`, which is what Judge0 uses  → no output at all,
     *                                                abrupt termination
     *   built at `-O2`, which is what the browser  → prints `0`, exit 0
     *   and the CI harness use
     *
     * Both are legal: a recursion that cannot terminate is undefined behaviour
     * and a compiler may assume it never happens. The flags are not guesswork —
     * they are recorded in `docs/cpp17/CPP17_JUDGE_PARITY.md`, measured by
     * asking each compiler.
     *
     * So the prompt promises the only thing that is true on every engine — the
     * answer 12 does not appear — and then says the rest out loud: what you see
     * instead is not fixed, and there is no error message either way. A learner
     * who presses Run and then Submit will genuinely see two different things,
     * and being told that in advance is better than discovering it and
     * concluding the product is broken. The CI harness sees the `0`; the
     * difference from the repaired program's `12` is what it checks, and it is
     * present under either flag.
     *
     * symptomInput is declared even though the numeric probe would happen to
     * expose it: `3 / 4 1 7` is the list the prompt talks about, and a witness
     * that matches the prompt is worth more than one that merely works.
     *
     * The input format states the count first, which is what `cin >>` needs.
     */
    id: "m6.l4.b4",
    type: "find_bug",
    skillRefs: ["recursion.base_case", "debug.boundary", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бағдарлама тізімдегі сандардың қосындысын рекурсиямен есептеуі керек: `add_from(a, i)` — тізімнің `i` индексінен бастап қалған бөлігінің қосындысы. Бірінші жолда n, екінші жолда n сан беріледі. `3` және `4 1 7` енгізгенде 12 шығуы тиіс, бірақ 12 ешқашан шықпайды. Оның орнына не шығатыны алдын ала бекітілмеген: бір жерде бағдарлама ештеңе шығармай, кенеттен үзіліп қалады, ал басқа жерде тыныш аяқталып, 0 шығарады. Екеуінде де түсінікті қате хабары болмайды — C++ шақырулардың тереңдігін санамайды, сондықтан айтатын ештеңесі жоқ. Сол себепті бұл жердегі жалғыз сенімді нәрсе — дұрыс жауап шықпағаны. Тоқтату шарты дұрыс жазылған. Онда қай жол кінәлі және неге?",
      ru: "Программа должна считать сумму чисел списка рекурсией: `add_from(a, i)` — это сумма остатка списка, начиная с индекса `i`. В первой строке дано n, во второй — n чисел. При вводе `3` и `4 1 7` должно получиться 12, но 12 не появляется никогда. А что появится вместо него — заранее не закреплено: в одном месте программа ничего не выводит и обрывается на полпути, в другом спокойно завершается и печатает 0. Понятного сообщения об ошибке нет ни там, ни там — C++ не считает глубину вызовов, поэтому сказать ему нечего. Единственное, в чём здесь можно быть уверенным, — что правильный ответ не получен. Базовый случай записан правильно. Тогда какая строка виновата и почему?",
    },
    code:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int add_from(vector<int>& a, int i) {\n" +
      "    int n = a.size();\n" +
      "    if (i == n) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return a[i] + add_from(a, i);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> nums[i];\n" +
      "    cout << add_from(nums, 0);\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 10,
    symptomInput: "3\n4 1 7",
    fixedCode:
      "#include <iostream>\n" +
      "#include <vector>\n" +
      "using namespace std;\n" +
      "\n" +
      "int add_from(vector<int>& a, int i) {\n" +
      "    int n = a.size();\n" +
      "    if (i == n) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return a[i] + add_from(a, i + 1);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int n;\n" +
      "    cin >> n;\n" +
      "    vector<int> nums(n);\n" +
      "    for (int i = 0; i < n; i++) cin >> nums[i];\n" +
      "    cout << add_from(nums, 0);\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * Where the parity trap is REAL. Stepping down by 2, an odd `n` goes
     * 7, 5, 3, 1, −1, −3 … and never equals 0, so `n == 0` is a stopping test
     * the argument walks straight past — the second failure mode from `b1`,
     * now as a choice rather than as prose. All four options were reasoned
     * through: `n <= 0` gives 4, 4, 0, 1 for n = 7, 8, 0, 1; `n == 0` and
     * `n == 1` each run away on half the inputs; `n < 0` terminates and quietly
     * counts one jump too many for even n, and answers 1 for n = 0.
     *
     * The snippet is a whole program with the stopping test replaced by a
     * comment, because every snippet in the curriculum is compiled and a bare
     * function is not a program. It is never RUN, which is why it may carry a
     * function that would not stop.
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
    code:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int jumps(int n) {\n" +
      "    // ???\n" +
      "    return 1 + jumps(n - 2);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    cout << jumps(8);\n" +
      "    return 0;\n" +
      "}",
    options: [
      {
        id: "o1",
        label: {
          kk: "`if (n == 0) return 0;` — дәл нөлге тигенде тоқтау",
          ru: "`if (n == 0) return 0;` — остановиться ровно на нуле",
        },
      },
      {
        id: "o2",
        label: {
          kk: "`if (n <= 0) return 0;` — нөлге не одан төмен түскенде тоқтау",
          ru: "`if (n <= 0) return 0;` — остановиться на нуле или ниже",
        },
      },
      {
        id: "o3",
        label: {
          kk: "`if (n == 1) return 0;` — бірге тигенде тоқтау",
          ru: "`if (n == 1) return 0;` — остановиться на единице",
        },
      },
      {
        id: "o4",
        label: {
          kk: "`if (n < 0) return 0;` — сан теріс болғанда ғана тоқтау",
          ru: "`if (n < 0) return 0;` — остановиться только когда число стало отрицательным",
        },
      },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      o1: {
        failureClass: "base_case_skipped_by_parity",
        justification:
          "Тақ `n` үшін мәндер 7, 5, 3, 1, −1, −3 … болып жүреді де, 0-ге ешқашан тең болмайды: шарт орындалмай қалады, ал шақырулар тоқтамайды — C++-та бұл бағдарламаның күйреуіне әкеледі. Бұл нұсқа тек жұп сандарды тексергенде ғана дұрыс көрінеді, сондықтан таңдау аргумент тоқтау нүктесін аттап өте алатынын ескермегенді көрсетеді.",
      },
    },
  },
  {
    /*
     * The base case is not always «нөл» — it is the smallest case you can still
     * ANSWER. Here that is one letter, because the empty word has no last
     * letter to return, and a learner who has just repaired `b3` (where
     * `s.size() == 1` was the bug) has to notice that the right test depends on
     * the question and not on a fixed number. That tension is the point of the
     * card and it is stated in both prompts.
     *
     * The return type is `char`, because a single letter is a `char` and not a
     * `string` — the distinction `b1` introduces one card earlier and the one a
     * learner needs before `b8` compares two letters.
     *
     * Both blanks have exactly one intended answer. `s.size() == 0` really does
     * fail here — it would ask for `s[0]` of an empty word — so the
     * alternatives list carries only the equivalent spelling of the shrink, not
     * a second correct stopping test.
     */
    id: "m6.l4.b6",
    type: "fill_blank",
    skillRefs: ["recursion.base_case", "recursion.core", "strings.sequence"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл функция сөздің соңғы әрпін қайтарады, бірақ индекспен емес: әр шақыруда бірінші әріпті алып тастап, қалған бөлікпен өзін қайта шақырады. Қайтаратын түрі `char` — бір ғана таңба. Тоқтату шарты — жауабы бірден белгілі ең кішкентай сөз, яғни одан кішісін алсаң, қайтаратын әріп қалмайтын сөз. Екі орынды толықтыр: тоқтау шартындағы санды және кішірейген шақыруға берілетін бөлікті.",
      ru: "Эта функция возвращает последнюю букву слова, но не через индекс: на каждом вызове она убирает первую букву и вызывает себя с остатком. Тип возвращаемого значения — `char`, то есть один символ. Базовый случай — самое маленькое слово, ответ для которого известен сразу, то есть такое, меньше которого возвращать уже нечего. Дополни два места: число в условии остановки и ту часть, которая передаётся в уменьшенный вызов.",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "char last(string s) {\n" +
      "    if (s.size() == ___) {\n" +
      "        return s[0];\n" +
      "    }\n" +
      "    return last(___);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string w;\n" +
      "    cin >> w;\n" +
      "    cout << last(w);\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "s.substr(1)", alternatives: ["s.substr(1, s.size() - 1)"] },
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
      kk: "`peel` — сөз симметриясын тексерудің тек қысқарту бөлігі: ол әлі ешнәрсені салыстырмайды, тек екі шеткі әріпті алып тастап, ішкі бөлікпен өзін қайта шақырады. Қағазға `s` бағанын сыз да, 6-жол әр шақыруда қандай сөзді шығаратынын ретімен жаз. Соңында 14-жол орындалғаннан кейінгі `core` мәнін жаз: ол тоқтату шартына неше әріппен келгенімізді көрсетеді.",
      ru: "`peel` — это только уменьшающая половина проверки на симметрию: она пока ничего не сравнивает, а лишь убирает две крайние буквы и вызывает себя с внутренней частью. Начерти на бумаге столбец `s` и выпиши по порядку, какое слово печатает строка 6 на каждом вызове. В конце запиши значение `core` после выполнения строки 14: оно показывает, со сколькими буквами мы пришли к условию остановки.",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int peel(string s) {\n" +
      "    cout << s << endl;\n" +
      "    if (s.size() <= 1) {\n" +
      "        return s.size();\n" +
      "    }\n" +
      "    return peel(s.substr(1, s.size() - 2));\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int core = peel(\"kayak\");\n" +
      "    cout << core;\n" +
      "    return 0;\n" +
      "}",
    steps: [
      { line: 6, vars: { s: '"kayak"' } },
      { line: 6, vars: { s: '"aya"' } },
      { line: 6, vars: { s: '"y"' } },
      { line: 14, vars: { core: "1" } },
    ],
  },
  {
    /*
     * PDF p.9: «сөз симметриясын осы тәсілмен тексеру». The blank editor, for
     * core and advanced; support meets the same problem at `b8s`.
     *
     * The prompt does not list the two landings of the stopping test — that is
     * the work. It also does not name any one-line reversal shortcut: a prompt
     * that forbids one by writing it out teaches it to everyone who had not
     * thought of it, and no output comparison could enforce the ban anyway. So
     * the recursion is stated as the point of the exercise and the mark is
     * stated as being on the answer — the contract's option 2 — while `b10`
     * sends the structural question to a teacher for advanced.
     *
     * The word is capped at 100 letters, which the Python version had no reason
     * to state: here it bounds the recursion depth at 50, comfortably inside
     * anything a stack can hold, and it is the shape of reasoning `b1` asks the
     * learner to do before pressing Run.
     *
     * Cases, one line each, against the programs that are not the method:
     *   kayak, abca   — visible. `abca` is the endpoint-only shortcut's grave
     *                   and also kills a stopping test of `s.size() <= 2`.
     *   abba, aa      — even words: the chain lands on ZERO letters. A test of
     *                   only `s.size() == 1` reads past the end of the string
     *                   here, which is undefined behaviour rather than an
     *                   error message.
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
      kk: "Кіші латын әріптерінен тұратын бір сөз беріледі: кемінде бір әріп, ең көбі 100 әріп, бос орын жоқ. Сөз симметриялы ма — солдан оңға да, оңнан солға да оқығанда бірдей ме? Симметриялы болса `yes`, болмаса `no` деген ағылшын сөзін шығар (жауап дәл осы екі сөздің бірі болуы керек). Есепті өзін-өзі шақыратын функциямен шеш: шеткі екі әріпті салыстыр да, қалған ішкі бөлік үшін сол функцияны қайта шақыр. Тоқтату шартын бірінші жаз және сөз қысқарып бара жатқанда шақырулар қандай ең кішкентай сөздерге келетінін алдын ала ойлан. Тереңдігін де алдын ала есепте: әр шақыру сөзді екі әріпке қысқартады, сондықтан 100 әріпті сөз үшін ең көбі 50 шақыру болады — бұл қауіпсіз. Баға тек шыққан жауап бойынша қойылады, ал жаттығудың мәні — рекурсияны өз қолыңмен жазып көру.",
      ru: "Дано одно слово из строчных латинских букв: не меньше одной буквы и не больше ста, пробелов нет. Симметрично ли слово — читается ли оно одинаково слева направо и справа налево? Если симметрично, выведи английское слово `yes`, иначе — `no` (ответ должен быть ровно одним из этих двух слов). Реши задачу функцией, вызывающей саму себя: сравни две крайние буквы и вызови ту же функцию для оставшейся внутренней части. Условие остановки напиши первым и заранее продумай, к каким самым маленьким словам приходят вызовы, пока слово укорачивается. Глубину тоже посчитай заранее: каждый вызов убирает две буквы, поэтому для слова из ста букв вызовов будет не больше пятидесяти — это безопасно. Оценивается только полученный ответ, а смысл упражнения — написать рекурсию своими руками.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int sym(string s) {\n" +
      "    if (s.size() <= 1) {\n" +
      "        return 1;\n" +
      "    }\n" +
      "    if (s[0] != s[s.size() - 1]) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return sym(s.substr(1, s.size() - 2));\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string word;\n" +
      "    cin >> word;\n" +
      "    if (sym(word) == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
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
      kk: "Бағдарлама сөздің симметриялы екенін тексереді: симметриялы болса `yes`, болмаса `no` деген ағылшын сөзін шығарады. Функция шеткі екі әріпті салыстырады да, ішкі бөлік үшін өзін қайта шақырады. Әр шақыруда сөз дәл екі әріпке қысқарады, сондықтан ол ақырында не бір әріпке, не мүлдем нөл әріпке келеді — `s.size() <= 1` шарты сол екеуін де қамтиды. Екі орынды толықтыр: ең кішкентай сөз үшін қандай жауап қайтарылады және кішірейген шақыруға сөздің қай бөлігі беріледі. Функция симметриялы сөз үшін 1, симметриялы емес сөз үшін 0 қайтарады.",
      ru: "Программа проверяет, симметрично ли слово: если да, она выводит английское слово `yes`, если нет — `no`. Функция сравнивает две крайние буквы и вызывает себя для внутренней части. На каждом вызове слово укорачивается ровно на две буквы, поэтому в конце оно приходит либо к одной букве, либо вообще к нулю букв — условие `s.size() <= 1` покрывает оба случая. Дополни два места: какой ответ возвращается для самого маленького слова и какая часть слова передаётся в уменьшенный вызов. Функция возвращает 1 для симметричного слова и 0 для несимметричного.",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int sym(string s) {\n" +
      "    if (s.size() <= 1) {\n" +
      "        return ___;\n" +
      "    }\n" +
      "    if (s[0] != s[s.size() - 1]) {\n" +
      "        return 0;\n" +
      "    }\n" +
      "    return sym(___);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    string word;\n" +
      "    cin >> word;\n" +
      "    if (sym(word) == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "1" },
      { id: "f2", answer: "s.substr(1, s.size() - 2)" },
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
     * The bound 1 000 000 000 fits in an `int` and gives a recursion ten deep,
     * so nothing here needs `long long` and nothing here is near a stack limit.
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
      kk: "Теріс емес бүтін сан `n` беріледі (0 ≤ n ≤ 1 000 000 000). Оның цифрларының қосындысын шығар. Мысалы 1234 үшін жауап 10, ал 7 үшін 7. Кеңес: санның соңғы цифры — `n % 10`, ал одан бұрынғы бөлігі — `n / 10` (екеуі де бүтін сан болғандықтан, бір сызық бүтін бөлу береді). Есепті өзін-өзі шақыратын функциямен шеш: тоқтату шартын бірінші жаз да, ол қандай санда орындалатынын және сол кезде нені қайтару керек екенін ойлан. Шектеу `int`-ке сыяды, ал тереңдігі ең көбі он шақыру — сондықтан бұл жерде қауіп жоқ. Циклмен жазсаң да жауап дұрыс шығады, баға тек жауап бойынша қойылады — бірақ бұл жаттығудың мәні рекурсияда.",
      ru: "Дано неотрицательное целое число `n` (0 ≤ n ≤ 1 000 000 000). Выведи сумму его цифр. Например, для 1234 ответ 10, а для 7 — это 7. Подсказка: последняя цифра числа — это `n % 10`, а часть перед ней — `n / 10` (оба числа целые, поэтому одна косая черта даёт целочисленное деление). Реши задачу функцией, вызывающей саму себя: напиши условие остановки первым и продумай, на каком числе оно срабатывает и что в этот момент нужно вернуть. Ограничение помещается в `int`, а глубина — не больше десяти вызовов, так что опасности здесь нет. С циклом ответ тоже получится верным, и оценивается только ответ, — но смысл этого упражнения именно в рекурсии.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "using namespace std;\n" +
      "\n" +
      "int digit_sum(int n) {\n" +
      "    if (n < 10) {\n" +
      "        return n;\n" +
      "    }\n" +
      "    return n % 10 + digit_sum(n / 10);\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "    int x;\n" +
      "    cin >> x;\n" +
      "    cout << digit_sum(x);\n" +
      "    return 0;\n" +
      "}",
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
     * THE TEACHER NOTE WAS REWRITTEN FOR C++ and the change is not cosmetic.
     * In Python, a stopping test of only `len(s) == 1` produced `IndexError` on
     * `abba` — a defined, visible, named event, and a teacher could say so. In
     * C++ the same program asks a `string` for the character before its first
     * one, and that is undefined behaviour: it may crash, and it may just as
     * easily print a plausible wrong answer. The note now says that, because a
     * learner who is told "it will crash" and then watches it not crash learns
     * the wrong thing twice. What did NOT change is the other half: with the
     * shrink written `s.substr(1, s.size() - 2)`, a stopping test of only
     * `s.size() == 0` is CORRECT, because a one-letter word gives the empty
     * string. A learner who writes that `== 0` fails on odd words has said
     * something plausible and false, in C++ exactly as in Python.
     */
    id: "m6.l4.b10",
    type: "explain",
    skillRefs: ["recursion.base_case", "recursion.core"],
    sourceType: "curriculum-derived",
    pdfPage: P,
    tracks: ["advanced"],
    prompt: {
      kk: "Жаңа ғана жазған симметрия функцияңды алдыңа қой да, екі сұраққа қысқа жауап жаз. 1) Ол қай жағдайда өзін мүлде шақырмай, жауапты бірден қайтарады? 2) Кез келген сөз сол жағдайға неге міндетті түрде жетеді — мұны сөздің ұзындығы арқылы дәлелде, әрі ең ұзын рұқсат етілген сөз үшін шақырулардың саны қанша болатынын ата.",
      ru: "Положи перед собой функцию проверки на симметрию, которую ты только что написал, и ответь коротко на два вопроса. 1) В каком случае она возвращает ответ сразу, вообще не вызывая саму себя? 2) Почему любое слово обязательно доходит до этого случая — обоснуй это через длину слова и назови, сколько будет вызовов для самого длинного разрешённого слова.",
    },
    expectedPoints: [
      {
        kk: "Тоқтату шарты — сөзде салыстыратын жұп қалмаған жағдай: не бір ғана әріп қалды, не әріп мүлде қалмады. Функция ол кезде «симметриялы» деген жауапты бірден қайтарады, себебі бір әріптен тұратын сөз де, бос сөз де солдан оңға да, оңнан солға да бірдей оқылады.",
        ru: "Базовый случай — это когда сравнивать больше нечего: осталась одна буква либо не осталось ни одной. Тогда функция сразу возвращает ответ «симметрично», потому что и слово из одной буквы, и пустое слово читаются одинаково в обе стороны.",
      },
      {
        kk: "Әр шақыру екі шеткі әріпті алып тастайды, сондықтан ұзындық әр қадамда дәл 2-ге кемиді және ешқашан өспейді. Демек шақырулар тізбегі шектеулі: ұзындықтың жартысындай қадамнан кейін ол міндетті түрде 1-ге не 0-ге түседі. Ең ұзын рұқсат етілген сөз 100 әріп болғандықтан, шақырулар саны 50-ден аспайды — стек үшін бұл түк те емес.",
        ru: "Каждый вызов убирает две крайние буквы, поэтому длина уменьшается ровно на 2 на каждом шаге и никогда не растёт. Значит, цепочка вызовов конечна: примерно за половину длины шагов она обязательно опустится до 1 или до 0. Самое длинное разрешённое слово — сто букв, поэтому вызовов будет не больше пятидесяти, а это для стека совсем немного.",
      },
      {
        kk: "Жұп ұзындықтағы сөз нөл әріпке, тақ ұзындықтағы сөз бір әріпке келеді. Сондықтан тоқтату шарты екі қонуды да қамтуы керек: `s.size() <= 1` — соның қысқа жазылуы.",
        ru: "Слово чётной длины приходит к нулю букв, слово нечётной длины — к одной. Поэтому условие остановки должно покрывать обе посадки: `s.size() <= 1` — это как раз краткая запись такого условия.",
      },
      {
        kk: "Мұғалімге ескерту: тек `s.size() == 1` деп жазылған шарт `abba` сөзінде нөл әріпке келеді де, `s[s.size() - 1]` жоқ орынды сұрайды. C++-та бұл — анықталмаған мінез: бағдарлама күйреуі де мүмкін, ешбір қатесіз жалған жауап шығаруы да мүмкін, ал екіншісі қауіптірек. Тізімнің де, сөздің де шегінен шығып оқу ешқандай қате хабарын бермейді — сондықтан оны тек ойлап отырып қана табуға болады. Ал тек `s.size() == 0` деп жазылған нұсқа `s.substr(1, s.size() - 2)` қысқартуымен дұрыс жұмыс істейді: бір әріптен тұратын сөз бос сөзге айналады. Сондықтан «`== 0` тақ сөздерде істемейді» деген жауап сенімді естілгенімен, дұрыс емес.",
        ru: "Замечание для учителя: условие, записанное только как `s.size() == 1`, на слове `abba` приходит к нулю букв, и тогда `s[s.size() - 1]` запрашивает несуществующую позицию. В C++ это неопределённое поведение: программа может аварийно завершиться, а может без всякой ошибки выдать неверный ответ, и второе опаснее. Чтение за границей строки или списка не даёт никакого сообщения об ошибке — поймать это можно только рассуждением. А вариант только с `s.size() == 0` при сокращении `s.substr(1, s.size() - 2)` работает верно: слово из одной буквы превращается в пустое. Поэтому ответ «`== 0` не работает на нечётных словах» звучит убедительно, но неверен.",
      },
    ],
  },
];
