import type { LessonBlock } from "../../types";

/**
 * Month 2 · Қазан · Lesson 6 — «Жолдағы таңбалар» / «Символы в строке». 7 min.
 *
 * PDF p.7 asks for «Жолды таңбалар тізбегі ретінде өңдеу» in the mastery
 * paragraph and names two families in the practice list: «сөздегі дауыстылар
 * саны» and «палиндромды тексеру». Both are written here, and both are written
 * as traversals.
 *
 * The one temptation this lesson exists to refuse is `s[::-1]`. A palindrome
 * check written as `s == s[::-1]` is one line, it is correct, and it teaches
 * nothing October is trying to teach: the whole point is that the learner pairs
 * position `i` with position `len(s) - 1 - i` and discovers that the `- 1` is
 * not decoration. So the reference solutions below compare characters in a
 * loop, the find_bug is the missing `- 1`, and slicing appears nowhere in the
 * lesson even though October has met it.
 *
 * Input contract, stated in every prompt in both languages: one line of
 * lowercase Latin letters. Every block here reads a single word with no
 * spaces except `m2.l6.b7` and its support twin, which read a phrase whose
 * words are separated by one space each — and both say so in the statement
 * and again in the example inside it, because dropping those spaces IS the
 * first half of that task. No case smuggles in a capital, a digit or a
 * separator its own prompt did not name.
 *
 * The second thing the lesson refuses, and it took a review to see it: the
 * same program twice. `revealFor` hands the repaired program to every learner
 * who answers a `find_bug` correctly, so once `m2.l6.b5` is answered the
 * finished palindrome loop is on screen — and it used to be, character for
 * character, what `m2.l6.b7` then asked to be written and `m2.l6.b7s` asked to
 * be filled in. `m2.l6.b4`'s template leaks the same way for a different
 * reason: a scaffold has to ship its scaffold, so five of the six lines of a
 * vowel count are public, and that used to be `m2.l6.b6`'s answer. Neither b6
 * nor b7 can be assembled from anything the lesson prints now.
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
      kk: "Жол дегеніміз — бірінен соң бірі тұрған таңбалар тізбегі. Таңбалар нөлден нөмірленеді: `s[0]` — бірінші таңба, `s[1]` — екіншісі. `len(s)` жолдағы таңба санын береді, сондықтан соңғы таңбаның индексі `len(s)` емес, `len(s) - 1`. Ал `for c in s` деп жазсақ, цикл әр таңбаны басынан аяғына дейін кезекпен `c` айнымалысына салады — индексті өзіміз санаудың қажеті жоқ.",
      ru: "Строка — это последовательность символов, стоящих друг за другом. Символы нумеруются с нуля: `s[0]` — первый символ, `s[1]` — второй. `len(s)` даёт количество символов, поэтому индекс последнего равен не `len(s)`, а `len(s) - 1`. А если написать `for c in s`, цикл по очереди положит в переменную `c` каждый символ — от первого до последнего, и считать индексы вручную не нужно.",
    },
    code: 's = "code"\nprint(len(s))  # 4\nprint(s[0])    # c\nfor c in s:\n    print(c)',
  },
  {
    /*
     * The trailing dash is the whole point: the body runs once per character,
     * INCLUDING the last one, so the separator comes out four times for four
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
    code: 's = "abc"\nr = ""\nfor c in s:\n    r = r + c + "-"\nprint(r)',
    answer: "a-b-c-",
    options: ["a-b-c-", "a-b-c", "abc-", "-a-b-c"],
  },
  {
    id: "m2.l6.b3",
    bank: {
      role: "extra_practice",
      why:
        "m2.l4.b4 is this question already: which expression gives the last element, with len versus len - 1 as the same pair of options and the same off-by-one as the mapped failure. Only the sequence type changes, and m2.l6.b1 — the concept card one screen earlier — states that transfer outright, so the block asks the learner to confirm what they have just been told rather than to decide anything.",
    },
    type: "multiple_choice",
    skillRefs: ["strings.sequence", "lists.index"],
    sourceType: "product-authored",
    prompt: {
      kk: "`s = \"python\"` берілген. Қай өрнек жолдың соңғы таңбасын береді?",
      ru: "Дано `s = \"python\"`. Какое выражение даёт последний символ строки?",
    },
    code: 's = "python"',
    options: [
      { id: "o1", label: { kk: "s[len(s)]", ru: "s[len(s)]" } },
      { id: "o2", label: { kk: "s[len(s) - 1]", ru: "s[len(s) - 1]" } },
      { id: "o3", label: { kk: "s[0]", ru: "s[0]" } },
      { id: "o4", label: { kk: "len(s)", ru: "len(s)" } },
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
          "«python» жолында алты таңба бар, бірақ олардың нөмірлері 0-ден 5-ке дейін. `s[len(s)]` дегенді таңдау — соңғы индексті ұзындыққа тең деп есептеу, ал бұл индекс мүлде жоқ: бағдарлама «string index out of range» деп тоқтайды.",
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
      kk: "Сөздегі дауысты әріптерді санайтын циклді толықтыр. Дауыстылар — a, e, i, o, u. Бірінші бос орынға таңбаның дауыстылар тізбегінде бар-жоғын тексеретін сөзді, екіншісіне санағышты бірге өсіретін амалды қой.",
      ru: "Дополни цикл, который считает гласные в слове. Гласные — a, e, i, o, u. В первый пропуск поставь слово, проверяющее, есть ли символ среди гласных, во второй — операцию, увеличивающую счётчик на единицу.",
    },
    template:
      's = input()\nn = 0\nfor c in s:\n    if c ___ "aeiou":\n        n ___ 1\nprint(n)',
    blanks: [
      { id: "f1", answer: "in" },
      { id: "f2", answer: "+=" },
    ],
  },
  {
    /*
     * PDF p.7 names «индекстің шекарадан шығуы» as one of October's four
     * typical errors, and this is that error in its most useful form: the
     * mirror index written as `n - i` instead of `n - 1 - i`. On i = 0 it asks
     * for `s[n]`, which does not exist, so the program does not print a wrong
     * answer — it stops. That is worth meeting once, because the traceback is
     * the clearest teacher of «соңғы индекс — len(s) - 1» there is.
     *
     * symptomInput is mandatory here and the contract says why: the fallback
     * probe is a spread of numbers, and a numeric probe fed to a program that
     * measures a word reports «the two programs behave identically». `level`
     * makes the broken program crash and the repaired one print `yes`.
     *
     * No diagnosticMapping. Blaming line 4 (`range(n // 2)`) has two honest
     * causes — «цикл тым көп айналады» and «ортадағы таңба тексерілмей қалады»
     * — and the second is not even a misunderstanding of this bug.
     */
    id: "m2.l6.b5",
    type: "find_bug",
    skillRefs: ["strings.sequence", "lists.index", "debug.boundary"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бұл бағдарлама сөздің палиндром екенін тексеруі керек: бірінші таңбаны соңғысымен, екіншісін соңынан екіншісімен салыстырады. Бірақ `level` сөзін бергенде ол ештеңе шығармай, «string index out of range» деген қатемен тоқтап қалады. Қай жол кінәлі?",
      ru: "Эта программа должна проверять, является ли слово палиндромом: первый символ сравнивается с последним, второй — со вторым с конца. Но на слове `level` она ничего не выводит и падает с ошибкой «string index out of range». Какая строка виновата?",
    },
    code:
      's = input()\nn = len(s)\nok = 1\nfor i in range(n // 2):\n    if s[i] != s[n - i]:\n        ok = 0\nif ok == 1:\n    print("yes")\nelse:\n    print("no")',
    buggyLine: 5,
    symptomInput: "level",
    fixedCode:
      's = input()\nn = len(s)\nok = 1\nfor i in range(n // 2):\n    if s[i] != s[n - 1 - i]:\n        ok = 0\nif ok == 1:\n    print("yes")\nelse:\n    print("no")',
  },
  {
    /*
     * This block used to BE «сөздегі дауыстылар саны», and its reference
     * solution was `m2.l6.b4` with the two blanks filled in — the same six
     * lines, byte for byte. A fill_blank has to ship its template to the
     * browser or there is no scaffold to complete, so five of those six lines
     * were public two cards earlier, on every route, and the month counted the
     * retyping as one of its independent solutions.
     *
     * The named family does not leave the lesson: b4 is the vowel count, and
     * `m2.p5` counts a letter that is only known at run time. What is asked
     * here is the POSITION of the last vowel — which b4's program cannot be
     * edited into, because `for c in s` never learns where it is standing. The
     * learner has to move to `for i in range(len(s))` and carry the index
     * themselves, which is «жолды таңбалар тізбегі ретінде өңдеу» (p.7) doing
     * actual work, and it makes b4 a model of the vowel test rather than the
     * answer to this task. The task is a variant the programme does not name,
     * so it is product-authored; the citation stays where the family is.
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
      's = input()\nans = -1\nfor i in range(len(s)):\n    if s[i] in "aeiou":\n        ans = i\nprint(ans)',
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
     * PDF p.7: «палиндромды тексеру». The statement moved, and `m2.l6.b5` two
     * cards up is the reason. `revealFor` returns `fixedCode` to every learner
     * who answers a find_bug correctly, and that repaired program WAS this
     * block's reference solution, character for character — so the platform
     * showed the answer and then asked for it back. Support had it worse:
     * `m2.l6.b7s` asked them to drop two tokens into the program they had just
     * been handed finished. The pairing loop is what b5 exists to teach, and a
     * task that asks for it again is asking for a copy of it.
     *
     * The word became a phrase, and the spaces have to go first. The pairing
     * itself is untouched — still `i` against `n - 1 - i` over half the string
     * — but it now runs on a string the learner builds, one character at a
     * time, which is the loop `m2.l6.b2` had them predict the output of. Two
     * things the lesson showed separately, joined by the learner; not one
     * thing the lesson showed whole.
     *
     * The cases:
     *   `step on no pets` — the visible yes. Its spaces sit symmetrically, so
     *                       it does NOT catch a program that forgets to drop
     *                       them, and that is the point of the next two;
     *   `abb a`, `no lemon no melon` — those do: leave the spaces in and both
     *                       come out `no`;
     *   `aba cba`         — the letters are `abacba`: first and last equal,
     *                       middle not. That is the endpoints-only shortcut
     *                       the first review found passing `m2.p6`;
     *   `a b`             — two letters, where `range(n // 2 - 1)` never runs
     *                       and prints `yes`;
     *   `a`               — one letter and no space at all;
     *   `level`           — a plain word, so the phrase framing never quietly
     *                       requires a space to exist.
     */
    id: "m2.l6.b7",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "lists.index", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда бір немесе бірнеше сөз беріледі: тек кіші латын әріптері, сөздер бір бос орынмен бөлінген. Бос орындарды тастап жібергенде, қалған әріптер палиндром құрай ма — алдынан оқығанда да, артынан оқығанда да бірдей ме? Палиндром болса `yes`, болмаса `no` деп шығар. Мысалы, `abb a` жолынан `abba` жиналады, жауабы `yes`; ал `a bc` жолынан `abc` жиналады, жауабы `no`. Алдымен бос орынсыз жаңа жол жинақта, содан кейін таңбаларды жұптап салыстыр: біріншісін соңғысымен, екіншісін соңынан екіншісімен.",
      ru: "В одной строке дано одно или несколько слов: только строчные латинские буквы, слова разделены одним пробелом. Если отбросить пробелы, образуют ли оставшиеся буквы палиндром — читаются ли они одинаково слева направо и справа налево? Выведи `yes`, если да, и `no`, если нет. Например, из строки `abb a` собирается `abba`, ответ `yes`, а из `a bc` собирается `abc`, ответ `no`. Сначала собери новую строку без пробелов, потом сравнивай символы парами: первый с последним, второй со вторым с конца.",
    },
    referenceSolution:
      's = input()\nt = ""\nfor c in s:\n    if c != " ":\n        t = t + c\nn = len(t)\nok = 1\nfor i in range(n // 2):\n    if t[i] != t[n - 1 - i]:\n        ok = 0\nif ok == 1:\n    print("yes")\nelse:\n    print("no")',
    cases: [
      { input: "step on no pets", expectedOutput: "yes" },
      { input: "a bc", expectedOutput: "no" },
      { input: "abb a", expectedOutput: "yes", hidden: true },
      { input: "no lemon no melon", expectedOutput: "yes", hidden: true },
      { input: "aba cba", expectedOutput: "no", hidden: true },
      { input: "a b", expectedOutput: "no", hidden: true },
      { input: "a", expectedOutput: "yes", hidden: true },
      { input: "level", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * Support substitution for `m2.l6.b7`, per PDF p.6: «дайын кодты құрастыру
     * мен толықтыру көбірек, нөлден жазу азырақ». Same phrase, same `yes`/`no`,
     * same two steps — what is withheld is the blank editor, not the problem.
     *
     * It used to blank two tokens of the program `m2.l6.b5` prints in full the
     * moment its bug is found, which on the one route that receives this card
     * is copying with the source open beside it. The three blanks now are the
     * three decisions the task is made of: the test that keeps a character out
     * of the new string, the bound that stops the loop in the middle, and the
     * `- 1` b5 showed crashing when it is missing. Only the last two can be
     * read off b5 — and those are the ones b5 is there to teach.
     *
     * The prompt points at the blanks as `___` rather than calling them «бос
     * орын» the way `m2.l6.b4` does, because in Kazakh «бос орын» is also the
     * space character — and here the space character is the task. Russian
     * keeps «пропуск», which does not collide with «пробел».
     *
     * The block points at no neighbour. Its route never receives `m2.l6.b7`,
     * so «алдыңғы тапсырма» here would mean the vowel index, which is the
     * defect `m2.l1.b8s` was rewritten for.
     */
    id: "m2.l6.b7s",
    type: "fill_blank",
    skillRefs: ["strings.sequence", "loops.for", "lists.index", "loops.accumulator"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Жолдағы әріптер, бос орындарды есепке алмағанда, палиндром құрай ма — соны тексеретін бағдарламаны толықтыр. Бірінші `___` орнына салыстыру амалын қой: таңба бос орын БОЛМАҒАНДА ғана жаңа `t` жолына қосылады. Екінші `___` орнына цикл жолдың тек жартысын айналатындай амалды, үшінші `___` орнына `i`-ші таңба соңынан саналған дұрыс таңбамен салыстырылуы үшін жетпей тұрған санды қой. Мысалы, `abb a` үшін бағдарлама `yes`, ал `a bc` үшін `no` шығаруы керек.",
      ru: "Дополни программу, которая проверяет, образуют ли буквы строки палиндром, если не считать пробелы. Вместо первого `___` поставь операцию сравнения: символ попадает в новую строку `t`, только если он НЕ пробел. Вместо второго `___` — операцию, из-за которой цикл проходит лишь половину строки, вместо третьего — число, которого не хватает, чтобы символ с номером `i` сравнивался с нужным символом с конца. Например, для `abb a` программа должна вывести `yes`, а для `a bc` — `no`.",
    },
    template:
      's = input()\nt = ""\nfor c in s:\n    if c ___ " ":\n        t = t + c\nn = len(t)\nok = 1\nfor i in range(n ___ 2):\n    if t[i] != t[n - ___ - i]:\n        ok = 0\nif ok == 1:\n    print("yes")\nelse:\n    print("no")',
    blanks: [
      { id: "f1", answer: "!=", alternatives: ["not in"] },
      { id: "f2", answer: "//" },
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
     * collected — needs no reverse range and no slice. `level` is a deliberate
     * callback: it comes back unchanged, which is the same fact `m2.l6.b7`
     * printed as `yes`.
     */
    id: "m2.l6.b8",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "loops.accumulator"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ. Сол сөзді кері оқылған күйінде шығар, мысалы `step` → `pets`. Жаңа жолды циклмен, таңбалап жинақта.",
      ru: "В одной строке дано слово: только строчные латинские буквы, пробелов нет. Выведи это слово задом наперёд, например `step` → `pets`. Собирай новую строку в цикле, по одному символу.",
    },
    referenceSolution: 's = input()\nr = ""\nfor c in s:\n    r = c + r\nprint(r)',
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
