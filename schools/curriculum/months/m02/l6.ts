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
 * Input contract, stated in every prompt in both languages: one line, one word,
 * lowercase Latin letters, no spaces. Every case honours it — no case smuggles
 * in a capital, a digit or a space that no prompt warned about.
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
     * characters. It is also the shape `m2.l6.b8` reuses — build a new string
     * one character at a time — met here as a prediction before it is asked for
     * as a task.
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
     * PDF p.7: «сөздегі дауыстылар саны». The cases are chosen against the
     * wrong solutions, not for a count:
     *   `rhythm`  — zero vowels, so a counter that starts at 1 dies here;
     *   `aeiou`   — every character counts, so a loop that misses the first or
     *               the last element gives 4;
     *   `a`       — one character, which is where `range(len(s) - 1)` gives 0;
     *   `python`  — `y` is not in the vowel set, and a learner who adds it
     *               gets 2;
     *   `queue`   — repeated vowels, so «санағышты нөлдеу» inside the loop
     *               (the accumulator reset the PDF names) gives 1 instead of 4.
     */
    id: "m2.l6.b6",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "loops.counter"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    prompt: {
      kk: "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ. Сол сөздегі дауысты әріптердің санын шығар. Дауыстылар — a, e, i, o, u; басқа әріптердің бәрі дауыссыз саналады.",
      ru: "В одной строке дано слово: только строчные латинские буквы, пробелов нет. Выведи количество гласных букв в этом слове. Гласные — a, e, i, o, u; все остальные буквы считаются согласными.",
    },
    referenceSolution:
      's = input()\nn = 0\nfor c in s:\n    if c in "aeiou":\n        n += 1\nprint(n)',
    cases: [
      { input: "programming", expectedOutput: "3" },
      { input: "python", expectedOutput: "1" },
      { input: "rhythm", expectedOutput: "0", hidden: true },
      { input: "aeiou", expectedOutput: "5", hidden: true },
      { input: "a", expectedOutput: "1", hidden: true },
      { input: "queue", expectedOutput: "4", hidden: true },
    ],
  },
  {
    /*
     * PDF p.7: «палиндромды тексеру». Core and advanced write it from the blank
     * editor; support gets the same problem at `m2.l6.b7s` with the two
     * decisions that matter left as blanks.
     *
     * `ab` is the case that earns its place: a loop written as
     * `range(n // 2 - 1)` never runs on a two-letter word and prints `yes`.
     * `abca` kills the solution that only compares the first and last
     * characters and stops.
     */
    id: "m2.l6.b7",
    type: "write_code",
    skillRefs: ["strings.sequence", "loops.for", "lists.index"],
    sourceType: "curriculum-derived",
    pdfPage: 7,
    tracks: ["core", "advanced"],
    prompt: {
      kk: "Бір жолда сөз беріледі: тек кіші латын әріптері, бос орын жоқ. Ол палиндром ба, яғни алдынан оқығанда да, артынан оқығанда да бірдей ме? Палиндром болса `yes`, болмаса `no` деп шығар. Таңбаларды жұптап салыстыр: біріншісін соңғысымен, екіншісін соңынан екіншісімен, солай жалғастыра бер.",
      ru: "В одной строке дано слово: только строчные латинские буквы, пробелов нет. Является ли оно палиндромом, то есть читается одинаково слева направо и справа налево? Выведи `yes`, если да, и `no`, если нет. Сравнивай символы парами: первый с последним, второй со вторым с конца, и так далее.",
    },
    referenceSolution:
      's = input()\nn = len(s)\nok = 1\nfor i in range(n // 2):\n    if s[i] != s[n - 1 - i]:\n        ok = 0\nif ok == 1:\n    print("yes")\nelse:\n    print("no")',
    cases: [
      { input: "level", expectedOutput: "yes" },
      { input: "world", expectedOutput: "no" },
      { input: "ab", expectedOutput: "no", hidden: true },
      { input: "a", expectedOutput: "yes", hidden: true },
      { input: "abba", expectedOutput: "yes", hidden: true },
      { input: "abca", expectedOutput: "no", hidden: true },
      { input: "racecar", expectedOutput: "yes", hidden: true },
    ],
  },
  {
    /*
     * Support substitution for `m2.l6.b7`, per PDF p.6: «дайын кодты құрастыру
     * мен толықтыру көбірек, нөлден жазу азырақ». Same problem, same output
     * tokens — what is withheld is the blank editor, not the palindrome.
     *
     * The two blanks are exactly the two places the task can go wrong, and
     * nowhere else: the loop bound (`//`, so the halves meet in the middle) and
     * the `- 1` that `m2.l6.b5` has just shown crashing.
     */
    id: "m2.l6.b7s",
    type: "fill_blank",
    skillRefs: ["strings.sequence", "loops.for", "lists.index"],
    sourceType: "product-authored",
    tracks: ["support"],
    prompt: {
      kk: "Палиндромды тексеретін бағдарламаны толықтыр. Цикл жолдың жартысын ғана айналуы керек, ал `i`-ші таңбаны соңынан саналған `i`-ші таңбамен салыстыру керек. Сөз палиндром болса `yes`, болмаса `no` шығады.",
      ru: "Дополни программу проверки палиндрома. Цикл должен пройти только половину строки, а символ с номером `i` нужно сравнить с `i`-м символом с конца. Если слово палиндром, выводится `yes`, иначе `no`.",
    },
    template:
      's = input()\nn = len(s)\nok = 1\nfor i in range(n ___ 2):\n    if s[i] != s[n - ___ - i]:\n        ok = 0\nif ok == 1:\n    print("yes")\nelse:\n    print("no")',
    blanks: [
      { id: "f1", answer: "//" },
      { id: "f2", answer: "1" },
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
