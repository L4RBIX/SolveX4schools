import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан · Lesson 6 — «Жолдағы таңбалар» / «Символы в строке». 7 min.
 *
 * PDF p.7 asks for «Жолды таңбалар тізбегі ретінде өңдеу» in the mastery
 * paragraph and names two families in the practice list: «сөздегі дауыстылар
 * саны» and «палиндромды тексеру». Both are written here, and both are written
 * as traversals.
 *
 * ## What C++ changed
 *
 * `string` needs `#include <string>`, and a single character is a `char`
 * written in single quotes — `'a'`, never `"a"`, which is a string of length
 * one. That distinction is the one new type this lesson introduces and the
 * concept card gives it a paragraph.
 *
 * `cin >> s` reads ONE word: it stops at the first space. That is a gift for
 * six of the eight blocks here, which want a single word anyway, and it is a
 * problem for exactly one — `m2.l6.b7`, the palindrome over a phrase. Rather
 * than reach for `getline`, which nothing in October needs and which behaves
 * badly next to `cin >>`, that task now states how many words are coming and
 * reads them one at a time. The exercise is untouched: the learner still builds
 * a new string out of pieces and then pairs `i` with `n - 1 - i`.
 *
 * `s[i]` out of range is not the crash Python's was. For `std::string` the one
 * index past the end is DEFINED — it hands back the invisible terminating
 * character — so `m2.l6.b5`'s bug prints a wrong answer instead of stopping.
 * That is a more useful lesson than a traceback and the prompt says so
 * outright: the index left the word, nothing complained, and the program lied.
 * It is also the reason `m2.l4` taught `at()`.
 *
 * ## What the lesson refuses
 *
 * A ready-made reversal, and the same program twice. `revealFor` hands the
 * repaired program to every learner who answers a `find_bug` correctly, so once
 * `m2.l6.b5` is answered the finished palindrome loop is on screen — which is
 * why `m2.l6.b7` asks for a phrase assembled from words rather than for that
 * loop again, and why `m2.l6.b7s` blanks the three decisions b5 does not make.
 *
 * Output tokens are English (`yes` / `no`) and both prompts name them, so a
 * Russian-track learner is reasoning about the comparison rather than matching
 * a Kazakh word they cannot read.
 */
export const M2_L6: LessonBlock[] = [
  {
    id: "m2.l6.b1",
    type: "concept",
    skillRefs: ["strings.sequence", "loops.for"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    title: {
      kk: "Жол — таңбалар тізбегі",
      ru: "Строка — последовательность символов",
    },
    body: {
      kk: "Жол дегеніміз — бірінен соң бірі тұрған таңбалар тізбегі. C++-та ол `string` деп аталады, ал ол үшін жоғарыға `#include <string>` жолы қосылады.\n\nБір ғана таңбаның өз түрі бар: `char`. Оны ЖАЛҚЫ тырнақшамен жазады — `'a'`. Ал `\"a\"` деп жазсаң, бұл бір таңбадан тұратын ЖОЛ болады, ал жол мен таңба — екі бөлек нәрсе. `c == 'a'` деп салыстырамыз, `c == \"a\"` деп емес.\n\nТаңбалар нөлден нөмірленеді: `s[0]` — бірінші таңба, `s[1]` — екіншісі. `s.size()` жолдағы таңба санын береді, сондықтан соңғы таңбаның индексі `s.size()` емес, `s.size() - 1`. Ал `for (char c : s)` деп жазсақ, цикл әр таңбаны басынан аяғына дейін кезекпен `c` айнымалысына салады — индексті өзіміз санаудың қажеті жоқ.\n\nЖолды оқу: `cin >> s` БІР сөзді оқиды, яғни бірінші бос орынға дейін тоқтайды. Жаңа жолды таңбалап жинауға да болады: `r += c` деген «r-дің соңына c таңбасын қос» дегені.",
      ru: "Строка — это последовательность символов, стоящих друг за другом. В C++ она называется `string`, и для неё сверху добавляется строка `#include <string>`.\n\nУ одного символа свой тип: `char`. Его записывают в ОДИНАРНЫХ кавычках — `'a'`. А `\"a\"` — это уже СТРОКА из одного символа, а строка и символ — разные вещи. Сравниваем `c == 'a'`, а не `c == \"a\"`.\n\nСимволы нумеруются с нуля: `s[0]` — первый символ, `s[1]` — второй. `s.size()` даёт количество символов, поэтому индекс последнего равен не `s.size()`, а `s.size() - 1`. А если написать `for (char c : s)`, цикл по очереди положит в переменную `c` каждый символ — от первого до последнего, и считать индексы вручную не нужно.\n\nЧтение строки: `cin >> s` читает ОДНО слово, то есть останавливается на первом пробеле. Новую строку можно собирать по символам: запись `r += c` означает «допиши символ c в конец r».",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s = \"code\";\n" +
      "    int n = s.size();\n" +
      "    cout << n << endl;      // 4\n" +
      "    cout << s[0] << endl;   // c\n" +
      "    for (char c : s) {\n" +
      "        cout << c << endl;\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * The trailing dash is the whole point: the body runs once per character,
     * INCLUDING the last one, so the separator comes out three times for three
     * characters. It is also the shape `m2.l6.b7` and `m2.l6.b8` both reuse —
     * build a new string one character at a time — met here as a prediction
     * before either asks for it as a task.
     *
     * No diagnosticMapping, deliberately. Two different misreadings land on
     * "a-b-c" (the loop stops one short; or the learner read the INTENT of a
     * separator instead of the code), and two land on "abc-" (the dash is added
     * once after the loop; or `c` holds the whole word and the body runs once).
     * The contract's rule is that an ambiguous distractor gets no mapping — the
     * engine then asks the learner instead of telling them something false.
     */
    id: "m2.l6.b2",
    type: "prediction",
    skillRefs: ["strings.sequence", "loops.for"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бұл бағдарлама экранға нені шығарады?",
      ru: "Что выведет эта программа на экран?",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s = \"abc\";\n" +
      "    string r = \"\";\n" +
      "    for (char c : s) {\n" +
      "        r = r + c + \"-\";\n" +
      "    }\n" +
      "    cout << r;\n" +
      "    return 0;\n" +
      "}",
    answer: "a-b-c-",
    options: ["a-b-c-", "a-b-c", "abc-", "-a-b-c"],
  },
  {
    id: "m2.l6.b3",
    bank: {
      role: "extra_practice",
      why:
        "m2.l4.b4 is this question already: which expression gives the last element, with size versus size - 1 as the same pair of options and the same off-by-one as the mapped failure. Only the sequence type changes, and m2.l6.b1 — the concept card one screen earlier — states that transfer outright, so the block asks the learner to confirm what they have just been told rather than to decide anything.",
    },
    type: "multiple_choice",
    skillRefs: ["strings.sequence", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "`string s = \"python\";` берілген. Қай өрнек жолдың соңғы таңбасын береді?",
      ru: "Дано `string s = \"python\";`. Какое выражение даёт последний символ строки?",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s = \"python\";\n" +
      "    return 0;\n" +
      "}",
    options: [
      { id: "o1", label: { kk: "s[s.size()]", ru: "s[s.size()]" } },
      { id: "o2", label: { kk: "s[s.size() - 1]", ru: "s[s.size() - 1]" } },
      { id: "o3", label: { kk: "s[0]", ru: "s[0]" } },
      { id: "o4", label: { kk: "s.size()", ru: "s.size()" } },
    ],
    correctOptionId: "o2",
    diagnosticMapping: {
      /*
       * o1 is the only option that requires a specific false belief: that the
       * last index equals the length. o3 and o4 are left unmapped — «s[0]» can
       * come from confusing first with last OR from simply misreading the
       * question, and that is two causes, so the pipeline asks instead.
       */
      o1: {
        failureClass: "index_off_by_one_upper_bound",
        justification:
          "«python» жолында алты таңба бар, бірақ олардың нөмірлері 0-ден 5-ке дейін. `s[s.size()]` дегенді таңдау — соңғы индексті ұзындыққа тең деп есептеу. C++ мұнда бағдарламаны тоқтатпайды: `s[s.size()]` жолдың соңындағы көрінбейтін таңбаны береді, сондықтан экранға ештеңе шықпайды да, қате де шықпайды. Дәл сол үнсіздік бұл қатені қауіпті етеді.",
      },
    },
  },
  {
    id: "m2.l6.b4",
    type: "fill_blank",
    skillRefs: ["strings.sequence", "loops.for", "loops.counter"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Сөздегі дауысты әріптерді санайтын циклді толықтыр. Дауыстылар — a, e, i, o, u. Таңба осы бес әріптің КЕЗ КЕЛГЕН БІРІ болса жеткілікті: бірінші орынға сол «немесе» мағынасын беретін логикалық амалды қой (қалған үшеуі көрініп тұр — олар да дәл сондай). Екінші орынға санағышты бірге өсіретін амалды қой.",
      ru: "Дополни цикл, который считает гласные в слове. Гласные — a, e, i, o, u. Достаточно, чтобы символ совпал с ЛЮБОЙ ОДНОЙ из этих пяти букв: в первый пропуск поставь логическую операцию со смыслом «или» (остальные три видны — они точно такие же). Во второй пропуск — операцию, увеличивающую счётчик на единицу.",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s;\n" +
      "    cin >> s;\n" +
      "    int n = 0;\n" +
      "    for (char c : s) {\n" +
      "        if (c == 'a' ___ c == 'e' || c == 'i' || c == 'o' || c == 'u') {\n" +
      "            n ___ 1;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << n;\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "||" },
      { id: "f2", answer: "+=" },
    ],
  },
  {
    /*
     * PDF p.7 names «индекстің шекарадан шығуы» as one of October's four
     * typical errors, and this is that error in its most useful form: the
     * mirror index written as `n - i` instead of `n - 1 - i`. On i = 0 it asks
     * for `s[n]`, one past the last letter.
     *
     * In Python that raised IndexError and the program stopped. C++ does not
     * stop: for `std::string` the index `size()` is defined and returns the
     * invisible terminating character, so the comparison `s[0] != s[n]` is true
     * for every word and the program calmly prints `no` for a palindrome. The
     * prompt says exactly that, because "the index left the word and nothing
     * complained" is the lesson C++ actually has to teach — and the reason
     * `m2.l4.b1` introduced `at()`.
     *
     * symptomInput is mandatory here and the contract says why: the fallback
     * probe is a spread of numbers, and a numeric probe fed to a program that
     * measures a word reports «the two programs behave identically». `level`
     * makes the broken program print `no` and the repaired one `yes`.
     *
     * No diagnosticMapping. Blaming the loop header has two honest causes —
     * «цикл тым көп айналады» and «ортадағы таңба тексерілмей қалады» — and the
     * second is not even a misunderstanding of this bug.
     */
    id: "m2.l6.b5",
    type: "find_bug",
    skillRefs: ["strings.sequence", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бұл бағдарлама сөздің палиндром екенін тексеруі керек: бірінші таңбаны соңғысымен, екіншісін соңынан екіншісімен салыстырады. Бірақ `level` сөзін бергенде ол `yes` емес, `no` шығарады. Бағдарлама құламайды да, ескертпейді де: индекс сөздің шегінен шығып, соңындағы көрінбейтін таңбаға тиіп тұр, ал ол ешбір әріппен тең емес. Қай жол кінәлі?",
      ru: "Эта программа должна проверять, является ли слово палиндромом: первый символ сравнивается с последним, второй — со вторым с конца. Но на слове `level` она выводит `no` вместо `yes`. Программа при этом не падает и ни о чём не предупреждает: индекс вышел за пределы слова и попал на невидимый символ в его конце, а он не равен ни одной букве. Какая строка виновата?",
    },
    code:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s;\n" +
      "    cin >> s;\n" +
      "    int n = s.size();\n" +
      "    int ok = 1;\n" +
      "    for (int i = 0; i < n / 2; i++) {\n" +
      "        if (s[i] != s[n - i]) {\n" +
      "            ok = 0;\n" +
      "        }\n" +
      "    }\n" +
      "    if (ok == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    buggyLine: 11,
    symptomInput: "level",
    fixedCode:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s;\n" +
      "    cin >> s;\n" +
      "    int n = s.size();\n" +
      "    int ok = 1;\n" +
      "    for (int i = 0; i < n / 2; i++) {\n" +
      "        if (s[i] != s[n - 1 - i]) {\n" +
      "            ok = 0;\n" +
      "        }\n" +
      "    }\n" +
      "    if (ok == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
  },
  {
    /*
     * What is asked here is the POSITION of the last vowel — which b4's program
     * cannot be edited into, because `for (char c : s)` never learns where it is
     * standing. The learner has to move to `for (int i = 0; i < n; i++)` and
     * carry the index themselves, which is «жолды таңбалар тізбегі ретінде
     * өңдеу» (p.7) doing actual work, and it makes b4 a model of the vowel test
     * rather than the answer to this task. The task is a variant the programme
     * does not name, so it is product-authored; the citation stays where the
     * family is, at b4.
     *
     * The cases are aimed at named wrong programs:
     *   `programming` — the first vowel is at 2 and the last at 8, so the
     *                   solution that stops at the first one fails in the
     *                   OPEN, where the learner can see why;
     *   `sky`         — no vowel at all: the only case that separates the -1
     *                   sentinel from an `ans` left at 0;
     *   `abc`         — the vowel is at index 0, which a loop starting at 1
     *                   reports as «жоқ»;
     *   `aeiou`, `spa`— the answer sits on the LAST character, i.e. «соңғы
     *                   элементті өткізіп жіберу», named on p.7 by hand;
     *   `banana`      — three vowels, so the index has to be overwritten
     *                   twice rather than kept;
     *   `a`           — one character, and it is the answer.
     */
    id: "m2.l6.b6",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ. Сол сөздегі ең соңғы дауысты әріптің индексін шығар. Индекстер нөлден басталады: `s[0]` — бірінші әріп. Дауыстылар — a, e, i, o, u. Мысалы, `code` сөзінде дауыстылар — o (индексі 1) және e (индексі 3), сондықтан жауап 3. Сөзде дауысты әріп мүлде болмаса, -1 шығар.",
      ru: "В одной строке дано слово: только строчные латинские буквы, пробелов нет. Выведи индекс последней гласной буквы этого слова. Индексы начинаются с нуля: `s[0]` — первая буква. Гласные — a, e, i, o, u. Например, в слове `code` гласные — o (индекс 1) и e (индекс 3), поэтому ответ 3. Если гласных в слове нет совсем, выведи -1.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s;\n" +
      "    cin >> s;\n" +
      "    int n = s.size();\n" +
      "    int ans = -1;\n" +
      "    for (int i = 0; i < n; i++) {\n" +
      "        char c = s[i];\n" +
      "        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {\n" +
      "            ans = i;\n" +
      "        }\n" +
      "    }\n" +
      "    cout << ans;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "programming", expectedOutput: "8" },
      { input: "sky", expectedOutput: "-1" },
      { input: "abc", expectedOutput: "0", hidden: true },
      { input: "aeiou", expectedOutput: "4", hidden: true },
      { input: "spa", expectedOutput: "2", hidden: true },
      { input: "rhythm", expectedOutput: "-1", hidden: true },
      { input: "banana", expectedOutput: "5", hidden: true },
      { input: "a", expectedOutput: "0", hidden: true },
    ],
  },
  {
    /*
     * PDF p.7: «палиндромды тексеру». The statement sits one step away from
     * `m2.l6.b5` on purpose: `revealFor` returns `fixedCode` to every learner
     * who answers a find_bug correctly, so the repaired pairing loop is on
     * screen by the time this card is reached, and a task that asked for that
     * loop again would be asking for a copy of it.
     *
     * So the letters have to be ASSEMBLED before they can be paired. Python
     * read a phrase and dropped the spaces; C++'s `cin >> s` stops at the first
     * space, so the statement says how many words are coming and the learner
     * reads them one at a time, appending each to a string they build — the
     * loop `m2.l6.b2` had them predict the output of. Two things the lesson
     * showed separately, joined by the learner; not one thing it showed whole.
     *
     * The cases:
     *   `step on no pets` — the visible yes, four words;
     *   `a bc`            — the visible no;
     *   `abb a`, `no lemon no melon` — a yes that only appears once the words
     *                       are joined, so a program that tests one word fails;
     *   `aba cba`         — the letters are `abacba`: first and last equal,
     *                       middle not. That is the endpoints-only shortcut;
     *   `a b`             — two letters, where a loop bound of `n / 2 - 1`
     *                       never runs and prints `yes`;
     *   `a`               — one word, one letter;
     *   `level`           — one word, so the phrase framing never quietly
     *                       requires more than one.
     */
    id: "m2.l6.b7",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "lists.index", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бірінші жолда сөздердің саны k беріледі (1 ≤ k ≤ 20). Екінші жолда сол k сөз бос орынмен бөлініп жазылады: тек кіші латын әріптері. Барлық сөзді біріктіріп жазғанда (араларына ештеңе қоймай), шыққан әріптер палиндром құрай ма — алдынан оқығанда да, артынан оқығанда да бірдей ме? Палиндром болса `yes`, болмаса `no` деп шығар. Мысалы, `abb` және `a` сөздерінен `abba` жиналады, жауабы `yes`; ал `a` мен `bc` сөздерінен `abc` жиналады, жауабы `no`. Алдымен сөздерді бір жолға жинақта, содан кейін таңбаларды жұптап салыстыр: біріншісін соңғысымен, екіншісін соңынан екіншісімен.",
      ru: "В первой строке дано количество слов k (1 ≤ k ≤ 20). Во второй строке через пробел записаны эти k слов: только строчные латинские буквы. Если записать все слова подряд, ничего между ними не вставляя, образуют ли получившиеся буквы палиндром — читаются ли они одинаково слева направо и справа налево? Выведи `yes`, если да, и `no`, если нет. Например, из слов `abb` и `a` собирается `abba`, ответ `yes`, а из `a` и `bc` собирается `abc`, ответ `no`. Сначала собери слова в одну строку, потом сравнивай символы парами: первый с последним, второй со вторым с конца.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    string t = \"\";\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        string w;\n" +
      "        cin >> w;\n" +
      "        t += w;\n" +
      "    }\n" +
      "    int n = t.size();\n" +
      "    int ok = 1;\n" +
      "    for (int i = 0; i < n / 2; i++) {\n" +
      "        if (t[i] != t[n - 1 - i]) {\n" +
      "            ok = 0;\n" +
      "        }\n" +
      "    }\n" +
      "    if (ok == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "4\nstep on no pets", expectedOutput: "yes" },
      { input: "2\na bc", expectedOutput: "no" },
      { input: "2\nabb a", expectedOutput: "yes", hidden: true },
      { input: "4\nno lemon no melon", expectedOutput: "yes", hidden: true },
      { input: "2\naba cba", expectedOutput: "no", hidden: true },
      { input: "2\na b", expectedOutput: "no", hidden: true },
      { input: "1\na", expectedOutput: "yes", hidden: true },
      { input: "1\nlevel", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * Support substitution for `m2.l6.b7`, per PDF p.6: «дайын кодты құрастыру
     * мен толықтыру көбірек, нөлден жазу азырақ». Same phrase, same `yes`/`no`,
     * same two steps — what is withheld is the blank editor, not the problem.
     *
     * The three blanks are the three decisions the task is made of: how a word
     * joins the string being built, the bound that stops the loop in the
     * middle, and the `- 1` b5 showed going wrong when it is missing. Only the
     * last two can be read off b5 — and those are the ones b5 is there to teach.
     *
     * The block points at no neighbour. Its route never receives `m2.l6.b7`, so
     * «алдыңғы тапсырма» here would mean the vowel index, which is a different
     * problem.
     */
    id: "m2.l6.b7s",
    type: "fill_blank",
    skillRefs: ["strings.sequence", "loops.for", "lists.index", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Бірінші жолда сөздердің саны k, екінші жолда сол k сөз беріледі. Сөздерді біріктіріп жазғандағы әріптер палиндром құрай ма — соны тексеретін бағдарламаны толықтыр. Бірінші `___` орнына оқылған сөзді `t` жолының соңына жалғайтын амалды қой. Екінші `___` орнына цикл жолдың тек жартысын айналатындай амалды, үшінші `___` орнына `i`-ші таңба соңынан саналған дұрыс таңбамен салыстырылуы үшін жетпей тұрған санды қой. Мысалы, `abb a` үшін бағдарлама `yes`, ал `a bc` үшін `no` шығаруы керек.",
      ru: "В первой строке дано количество слов k, во второй — эти k слов. Дополни программу, которая проверяет, образуют ли буквы этих слов, записанных подряд, палиндром. Вместо первого `___` поставь операцию, которая дописывает прочитанное слово в конец строки `t`. Вместо второго `___` — операцию, из-за которой цикл проходит лишь половину строки, вместо третьего — число, которого не хватает, чтобы символ с номером `i` сравнивался с нужным символом с конца. Например, для `abb a` программа должна вывести `yes`, а для `a bc` — `no`.",
    },
    template:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    int k;\n" +
      "    cin >> k;\n" +
      "    string t = \"\";\n" +
      "    for (int i = 0; i < k; i++) {\n" +
      "        string w;\n" +
      "        cin >> w;\n" +
      "        t ___ w;\n" +
      "    }\n" +
      "    int n = t.size();\n" +
      "    int ok = 1;\n" +
      "    for (int i = 0; i < n ___ 2; i++) {\n" +
      "        if (t[i] != t[n - ___ - i]) {\n" +
      "            ok = 0;\n" +
      "        }\n" +
      "    }\n" +
      "    if (ok == 1) {\n" +
      "        cout << \"yes\";\n" +
      "    } else {\n" +
      "        cout << \"no\";\n" +
      "    }\n" +
      "    return 0;\n" +
      "}",
    blanks: [
      { id: "f1", answer: "+=" },
      { id: "f2", answer: "/" },
      { id: "f3", answer: "1" },
    ],
  },
  {
    /*
     * «Тізімді кері аудару» in the PDF's practice list is about a list; this is
     * the same idea on a string, and it is here because the learner has just
     * spent the lesson pairing `i` with `n - 1 - i` and should see the other
     * way to walk backwards.
     *
     * `r = c + r` — put each new character in FRONT of what is already
     * collected — needs no reverse loop and no library call. `level` is a
     * deliberate callback: it comes back unchanged, which is the same fact
     * `m2.l6.b7` printed as `yes`.
     */
    id: "m2.l6.b8",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ. Сол сөзді кері оқылған күйінде шығар, мысалы `step` → `pets`. Дайын аударып беретін құралдарды қолдануға болмайды — жаңа жолды циклмен, таңбалап жинақта.",
      ru: "В одной строке дано слово: только строчные латинские буквы, пробелов нет. Выведи это слово задом наперёд, например `step` → `pets`. Пользоваться готовыми средствами переворота нельзя — собирай новую строку в цикле, по одному символу.",
    },
    referenceSolution:
      "#include <iostream>\n" +
      "#include <string>\n" +
      "using namespace std;\n" +
      "\n" +
      "int main() {\n" +
      "    string s;\n" +
      "    cin >> s;\n" +
      "    string r = \"\";\n" +
      "    for (char c : s) {\n" +
      "        r = c + r;\n" +
      "    }\n" +
      "    cout << r;\n" +
      "    return 0;\n" +
      "}",
    cases: [
      { input: "step", expectedOutput: "pets" },
      { input: "banana", expectedOutput: "ananab" },
      { input: "a", expectedOutput: "a", hidden: true },
      { input: "ab", expectedOutput: "ba", hidden: true },
      { input: "level", expectedOutput: "level", hidden: true },
      { input: "algorithm", expectedOutput: "mhtirogla", hidden: true },
    ],
  },
];
