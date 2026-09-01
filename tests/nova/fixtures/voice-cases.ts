import type { Locale } from "@schools/curriculum/types";

/**
 * The situations Nova has to sound right in.
 *
 * ## Why these are situations, not expected replies
 *
 * A fixture that pins the sentence Nova should produce is a fixture that fails
 * the first time the prompt improves, so it gets updated to whatever the model
 * now says, and after two rounds of that it asserts nothing except that the
 * model is deterministic. These carry the SITUATION and the constraints the
 * reply has to satisfy — what it must be grounded in, what it must not say —
 * and the assertions are semantic and stylistic.
 *
 * ## Why RU and KK are written separately
 *
 * Because translating the Russian set would test a Kazakh Nova against Russian
 * pedagogy. `must` terms are the words a native reply would actually reach for,
 * and in Kazakh those are frequently not the calque: a learner asking about a
 * type error hears «мәтін»/«сан», not a transliteration of «строка».
 *
 * ## Why every program here is C++17, and September-shaped
 *
 * The course is C++17 (`YEAR_ONE_LANGUAGE`), procedural, no OOP. A fixture that
 * still showed `print()` and `input()` would be testing Nova's voice against a
 * screen no learner will ever see, and — worse — would quietly certify a tutor
 * that answers a September question in the wrong language. The code below is
 * what is actually on the screen: the frame is given, `cin >>` reads, `cout <<`
 * reports, and nothing in a September case uses a construct September has not
 * taught. The two `strong_learner` cases are the exception and say so: they sit
 * in a later month, which is the only place a loop belongs.
 */
export interface VoiceCase {
  id: string;
  locale: Locale;
  /** Which of the thirteen situations this is. Several cases per situation. */
  scenario: Scenario;
  /** The task as the learner sees it. */
  prompt: string;
  /** What is on screen: starter or learner code. */
  code?: string;
  /** For choice blocks: what they picked. */
  picked?: string;
  /**
   * Visible execution output, when there is any.
   *
   * In C++ this is usually the COMPILER rather than the program: the commonest
   * moment a learner opens this panel is a build that refused, in English,
   * about a line that is frequently not the wrong one. The fixtures carry real
   * diagnostic text for that reason.
   */
  stderr?: string;
  /** What the learner typed into the panel. */
  asked: string;
  /** The granted hint level for this turn. */
  level: 0 | 1 | 2 | 3 | 4;
  /** Substrings the reply must engage with — the concrete thing on screen. */
  grounding: string[];
  /** Substrings that would mean the answer leaked at this level. */
  forbidden?: string[];
  /** Earlier turns, for the cases that test forward movement. */
  history?: { role: "user" | "assistant"; text: string }[];
}

export type Scenario =
  | "wrong_mcq"
  | "wrong_prediction"
  /* Was `syntax_error`, and the rename is the migration in one word: Python
     refused to start a program it could not parse, C++ refuses to BUILD one,
     and the two are not the same conversation — nothing ran, so there is no
     output to reason about and the only evidence is the diagnostic. */
  | "compile_error"
  | "runtime_error"
  | "string_int_confusion"
  | "condition_boundary"
  | "successful_correction"
  | "stuck"
  | "productive_struggle"
  | "assistance_dependent"
  | "strong_learner"
  | "assessment"
  | "no_attempt_since_hint";

const RU: VoiceCase[] = [
  { id: "ru-01", locale: "ru", scenario: "wrong_mcq",
    prompt: "Что выведет эта программа?", code: 'cout << "2 + 2";', picked: '"2 + 2"',
    asked: "Почему ошибка?", level: 0, grounding: ["кавыч"], forbidden: ["2 + 2 без кавычек"] },
  { id: "ru-02", locale: "ru", scenario: "wrong_mcq",
    prompt: "Что выведет эта программа?", code: 'cout << "2 + 2";', picked: "4",
    asked: "Почему не 4?", level: 1, grounding: ["кавыч"] },
  { id: "ru-03", locale: "ru", scenario: "wrong_prediction",
    prompt: "Что выведет программа при вводе 3 4?", code: "int a, b;\ncin >> a >> b;\ncout << a + b;",
    picked: "34", asked: "Разве не 34?", level: 1, grounding: ["int", "числ"] },
  { id: "ru-04", locale: "ru", scenario: "compile_error",
    prompt: "Выведи квадрат числа.", code: "int n;\ncin >> n\ncout << n * n;",
    stderr: "main.cpp:6:12: error: expected ';' after expression\n    6 |     cin >> n\n      |            ^\n      |            ;",
    asked: "что не так?", level: 1, grounding: ["точк", "запят", "выше"] },
  { id: "ru-05", locale: "ru", scenario: "compile_error",
    prompt: "Выведи сумму двух чисел.", code: "int a;\ncin >> a;\nif (a > 0) {\n    cout << a;",
    stderr: "main.cpp:9:1: error: expected '}' at end of input",
    asked: "почему не компилируется?", level: 1, grounding: ["скобк", "закр"] },
  { id: "ru-06", locale: "ru", scenario: "compile_error",
    prompt: "Выведи квадрат числа.", code: "int n = 5;\ncout << m * m;",
    stderr: "main.cpp:5:13: error: use of undeclared identifier 'm'",
    asked: "Почему ошибка?", level: 1, grounding: ["m", "n", "объяв"] },
  { id: "ru-07", locale: "ru", scenario: "runtime_error",
    prompt: "Раздели два числа.", code: "int a, b;\ncin >> a >> b;\ncout << a / b;",
    stderr: "", asked: "почему падает при b = 0?", level: 2, grounding: ["ноль", "нол", "провер"] },
  { id: "ru-08", locale: "ru", scenario: "string_int_confusion",
    prompt: "Прочитай число и выведи его вдвое больше.", code: "string n;\ncin >> n;\ncout << n + n;",
    stderr: "", asked: "почему 55 вместо 10?", level: 2, grounding: ["текст", "int"] },
  { id: "ru-09", locale: "ru", scenario: "string_int_confusion",
    prompt: "Сложи два введённых числа.", code: "string a, b;\ncin >> a >> b;\ncout << a + b;",
    asked: "получается 34 а не 7", level: 2, grounding: ["строк", "int"] },
  { id: "ru-10", locale: "ru", scenario: "condition_boundary",
    prompt: "Выведи «да», если число не меньше 1050.", code: 'if (n > 1050) cout << "да";',
    asked: "на 1050 не работает", level: 2, grounding: ["1050", ">="] },
  { id: "ru-11", locale: "ru", scenario: "condition_boundary",
    prompt: "Проверь, попадает ли число в диапазон.", code: 'if (x > 0 && x < 10) cout << "да";',
    asked: "а ноль должен считаться", level: 2, grounding: ["0", ">="] },
  { id: "ru-12", locale: "ru", scenario: "successful_correction",
    prompt: "Прочитай число и выведи его вдвое больше.", code: "int n;\ncin >> n;\ncout << n * 2;",
    asked: "теперь правильно?", level: 1, grounding: ["int"],
    history: [
      { role: "assistant", text: "string хранит текст. Что делает + с двумя кусками текста?" },
      { role: "user", text: "склеивает их" },
    ] },
  { id: "ru-13", locale: "ru", scenario: "stuck",
    prompt: "Выведи площадь прямоугольника.", code: "int a;\ncin >> a;",
    asked: "я не понимаю вообще", level: 2, grounding: ["втор", "b"] },
  { id: "ru-14", locale: "ru", scenario: "stuck",
    prompt: "Выведи квадрат числа.", code: "", asked: "с чего начать", level: 1, grounding: ["cin"] },
  { id: "ru-15", locale: "ru", scenario: "productive_struggle",
    prompt: "Найди наибольшее из трёх чисел.", code: "if (a > b) cout << a;\nelse cout << b;",
    asked: "третье как добавить", level: 2, grounding: ["c", "трет"] },
  { id: "ru-16", locale: "ru", scenario: "assistance_dependent",
    prompt: "Выведи сумму чисел от 1 до n.", code: "int n;\ncin >> n;",
    asked: "просто скажи ответ", level: 1, forbidden: ["for (int i", "n * (n + 1)"], grounding: ["сам", "попроб", "шаг"] },
  { id: "ru-17", locale: "ru", scenario: "assistance_dependent",
    prompt: "Выведи чётные числа до n.", code: "", asked: "напиши за меня", level: 0,
    forbidden: ["% 2 == 0", "for (int i"], grounding: ["попроб", "сам", "начн"] },
  { id: "ru-18", locale: "ru", scenario: "strong_learner",
    /* A later month on purpose: September has no loop, so a task counting
       divisors cannot exist in it and a fixture that pretended otherwise would
       be certifying a hint the sequence forbids. */
    prompt: "Выведи количество делителей числа.",
    code: "int n, c = 0;\ncin >> n;\nfor (int i = 1; i <= n; i++) {\n    if (n % i == 0) c++;\n}\ncout << c;",
    asked: "можно быстрее?", level: 3, grounding: ["корн", "sqrt", "квадратн"] },
  { id: "ru-19", locale: "ru", scenario: "assessment",
    prompt: "Выведи наибольший общий делитель.", code: "int a, b;\ncin >> a >> b;",
    asked: "как решать?", level: 1, forbidden: ["while (b", "a % b", "__gcd"], grounding: ["провер"] },
  { id: "ru-20", locale: "ru", scenario: "assessment",
    prompt: "Определи, делится ли число на 7.", code: "int n;\ncin >> n;", asked: "дай код", level: 1,
    forbidden: ["n % 7 == 0", 'cout << "YES"'], grounding: ["провер", "остат"] },
  { id: "ru-21", locale: "ru", scenario: "no_attempt_since_hint",
    prompt: "Выведи остаток от деления.", code: "int n;\ncin >> n;", asked: "ещё подсказку", level: 0,
    grounding: ["попроб"], history: [{ role: "assistant", text: "Какой оператор даёт остаток, а какой — целую часть?" }] },
  { id: "ru-22", locale: "ru", scenario: "wrong_prediction",
    /* The trap the month is built around. In Python this printed 3.5. */
    prompt: "Что выведет программа?", code: "cout << 7 / 2;", picked: "3.5",
    asked: "почему не 3.5", level: 1, grounding: ["цел", "3"] },
  { id: "ru-23", locale: "ru", scenario: "runtime_error",
    prompt: "Выведи произведение двух чисел.", code: "int a, b;\ncin >> a >> b;\ncout << a * b;",
    stderr: "", asked: "при больших числах выводит минус", level: 2, grounding: ["long long", "переполн"] },
  { id: "ru-24", locale: "ru", scenario: "successful_correction",
    prompt: "Что выведет эта программа?", code: 'cout << "2 + 2";',
    asked: "то есть кавычки выводятся тоже?", level: 1, grounding: ["нет", "текст", "между"],
    history: [
      { role: "assistant", text: "В cout стоят кавычки. Что попадёт на экран — то, что между ними, или сами кавычки?" },
      { role: "user", text: "выводится как есть" },
    ] },
  { id: "ru-25", locale: "ru", scenario: "compile_error",
    prompt: "Выведи наибольшее из двух чисел.", code: "int a = 1;\ndouble b = 2.5;\ncout << max(a, b);",
    stderr: "main.cpp:7:13: error: no matching function for call to 'max'\nnote: candidate template ignored: deduced conflicting types for parameter '_Tp' ('int' vs. 'double')",
    asked: "почему max не работает", level: 2, grounding: ["тип", "int", "double"] },
];

const KK: VoiceCase[] = [
  { id: "kk-01", locale: "kk", scenario: "wrong_mcq",
    prompt: "Бұл бағдарлама экранға нені шығарады?", code: 'cout << "2 + 2";', picked: '"2 + 2"',
    asked: "Неге қате?", level: 0, grounding: ["тырнақша"] },
  { id: "kk-02", locale: "kk", scenario: "wrong_mcq",
    prompt: "Бұл бағдарлама экранға нені шығарады?", code: 'cout << "2 + 2";', picked: "4",
    asked: "Неге 4 емес?", level: 1, grounding: ["тырнақша"] },
  { id: "kk-03", locale: "kk", scenario: "wrong_prediction",
    prompt: "3 4 енгізілгенде не шығады?", code: "int a, b;\ncin >> a >> b;\ncout << a + b;",
    picked: "34", asked: "34 емес пе?", level: 1, grounding: ["int", "сан"] },
  { id: "kk-04", locale: "kk", scenario: "compile_error",
    prompt: "Санның квадратын шығар.", code: "int n;\ncin >> n\ncout << n * n;",
    stderr: "main.cpp:6:12: error: expected ';' after expression\n    6 |     cin >> n\n      |            ^\n      |            ;",
    asked: "не дұрыс емес?", level: 1, grounding: ["нүктелі үтір", "жоғар"] },
  { id: "kk-05", locale: "kk", scenario: "compile_error",
    prompt: "Екі санның қосындысын шығар.", code: "int a;\ncin >> a;\nif (a > 0) {\n    cout << a;",
    stderr: "main.cpp:9:1: error: expected '}' at end of input",
    asked: "неге компиляция болмайды?", level: 1, grounding: ["жақша", "жаб"] },
  { id: "kk-06", locale: "kk", scenario: "compile_error",
    prompt: "Санның квадратын шығар.", code: "int n = 5;\ncout << m * m;",
    stderr: "main.cpp:5:13: error: use of undeclared identifier 'm'",
    asked: "Неге қате?", level: 1, grounding: ["m", "n", "жария"] },
  { id: "kk-07", locale: "kk", scenario: "runtime_error",
    prompt: "Екі санды бөл.", code: "int a, b;\ncin >> a >> b;\ncout << a / b;",
    stderr: "", asked: "b нөл болса неге құлайды?", level: 2, grounding: ["нөл", "тексер"] },
  { id: "kk-08", locale: "kk", scenario: "string_int_confusion",
    prompt: "Санды оқып, екі есе көбейтіп шығар.", code: "string n;\ncin >> n;\ncout << n + n;",
    asked: "неге 10 емес 55?", level: 2, grounding: ["мәтін", "int"] },
  { id: "kk-09", locale: "kk", scenario: "string_int_confusion",
    prompt: "Енгізілген екі санды қос.", code: "string a, b;\ncin >> a >> b;\ncout << a + b;",
    asked: "7 емес 34 шығады", level: 2, grounding: ["мәтін", "int"] },
  { id: "kk-10", locale: "kk", scenario: "condition_boundary",
    prompt: "Сан 1050-ден кем болмаса «иә» деп шығар.", code: 'if (n > 1050) cout << "иә";',
    asked: "1050-де жұмыс істемейді", level: 2, grounding: ["1050", ">="] },
  { id: "kk-11", locale: "kk", scenario: "condition_boundary",
    prompt: "Сан аралыққа кіре ме, тексер.", code: 'if (x > 0 && x < 10) cout << "иә";',
    asked: "нөл де кіру керек", level: 2, grounding: ["0", ">="] },
  { id: "kk-12", locale: "kk", scenario: "successful_correction",
    prompt: "Санды оқып, екі есе көбейтіп шығар.", code: "int n;\ncin >> n;\ncout << n * 2;",
    asked: "енді дұрыс па?", level: 1, grounding: ["int"],
    history: [
      { role: "assistant", text: "string мәтін сақтайды. Екі мәтінді + не істейді?" },
      { role: "user", text: "біріктіреді" },
    ] },
  { id: "kk-13", locale: "kk", scenario: "stuck",
    prompt: "Тіктөртбұрыштың ауданын шығар.", code: "int a;\ncin >> a;",
    asked: "мүлдем түсінбеймін", level: 2, grounding: ["екінші", "b"] },
  { id: "kk-14", locale: "kk", scenario: "stuck",
    prompt: "Санның квадратын шығар.", code: "", asked: "неден бастаймын", level: 1, grounding: ["cin"] },
  { id: "kk-15", locale: "kk", scenario: "productive_struggle",
    prompt: "Үш санның ең үлкенін тап.", code: "if (a > b) cout << a;\nelse cout << b;",
    asked: "үшіншісін қалай қосамын", level: 2, grounding: ["c", "үшінші"] },
  { id: "kk-16", locale: "kk", scenario: "assistance_dependent",
    prompt: "1-ден n-ге дейінгі сандардың қосындысын шығар.", code: "int n;\ncin >> n;",
    asked: "жауабын айтшы", level: 1, forbidden: ["for (int i", "n * (n + 1)"], grounding: ["өзің", "көр"] },
  { id: "kk-17", locale: "kk", scenario: "assistance_dependent",
    prompt: "n-ге дейінгі жұп сандарды шығар.", code: "", asked: "маған жазып бер", level: 0,
    forbidden: ["% 2 == 0", "for (int i"], grounding: ["өзің", "көр"] },
  { id: "kk-18", locale: "kk", scenario: "strong_learner",
    /* A later month, for the same reason as ru-18. */
    prompt: "Санның бөлгіштер санын шығар.",
    code: "int n, c = 0;\ncin >> n;\nfor (int i = 1; i <= n; i++) {\n    if (n % i == 0) c++;\n}\ncout << c;",
    asked: "жылдамырақ болама?", level: 3, grounding: ["түбір", "sqrt", "квадрат"] },
  { id: "kk-19", locale: "kk", scenario: "assessment",
    prompt: "Ең үлкен ортақ бөлгішті шығар.", code: "int a, b;\ncin >> a >> b;",
    asked: "қалай шешемін?", level: 1, forbidden: ["while (b", "a % b", "__gcd"], grounding: ["тексер"] },
  { id: "kk-20", locale: "kk", scenario: "assessment",
    prompt: "Сан 7-ге бөліне ме, анықта.", code: "int n;\ncin >> n;", asked: "кодын берші", level: 1,
    forbidden: ["n % 7 == 0", 'cout << "YES"'], grounding: ["тексер", "қалды"] },
  { id: "kk-21", locale: "kk", scenario: "no_attempt_since_hint",
    prompt: "Бөлудің қалдығын шығар.", code: "int n;\ncin >> n;", asked: "тағы ішара берші", level: 0,
    grounding: ["көр"], history: [{ role: "assistant", text: "Қай амал қалдық береді, қайсысы бүтін бөлікті береді?" }] },
  { id: "kk-22", locale: "kk", scenario: "wrong_prediction",
    prompt: "Бағдарлама нені шығарады?", code: "cout << 7 / 2;", picked: "3.5",
    asked: "неге 3.5 емес", level: 1, grounding: ["бүтін", "3"] },
  { id: "kk-23", locale: "kk", scenario: "runtime_error",
    prompt: "Екі санның көбейтіндісін шығар.", code: "int a, b;\ncin >> a >> b;\ncout << a * b;",
    stderr: "", asked: "үлкен сандарда минус шығады", level: 2, grounding: ["long long", "асып"] },
  { id: "kk-24", locale: "kk", scenario: "successful_correction",
    prompt: "Бұл бағдарлама экранға нені шығарады?", code: 'cout << "2 + 2";',
    asked: "яғни тырнақша да шыға ма?", level: 1, grounding: ["жоқ", "мәтін", "арас"],
    history: [
      { role: "assistant", text: "cout ішінде тырнақша тұр. Экранға арасындағы мәтін бе, әлде тырнақшаның өзі ме?" },
      { role: "user", text: "сол күйінде шығарады" },
    ] },
  { id: "kk-25", locale: "kk", scenario: "compile_error",
    prompt: "Екі санның үлкенін шығар.", code: "int a = 1;\ndouble b = 2.5;\ncout << max(a, b);",
    stderr: "main.cpp:7:13: error: no matching function for call to 'max'\nnote: candidate template ignored: deduced conflicting types for parameter '_Tp' ('int' vs. 'double')",
    asked: "неге max жұмыс істемейді", level: 2, grounding: ["түр", "int", "double"] },
];

export const VOICE_CASES: VoiceCase[] = [...RU, ...KK];
export const RU_CASES = RU;
export const KK_CASES = KK;
