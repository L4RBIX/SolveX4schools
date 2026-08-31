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
  /** Visible execution output, when there is any. */
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
  | "syntax_error"
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
    prompt: "Что выведет эта программа?", code: 'print("2 + 2")', picked: '"2 + 2"',
    asked: "Почему ошибка?", level: 0, grounding: ["кавыч"], forbidden: ["2 + 2 без кавычек"] },
  { id: "ru-02", locale: "ru", scenario: "wrong_mcq",
    prompt: "Что выведет эта программа?", code: 'print("2 + 2")', picked: "4",
    asked: "Почему не 4?", level: 1, grounding: ["кавыч"] },
  { id: "ru-03", locale: "ru", scenario: "wrong_prediction",
    prompt: "Что выведет программа при вводе 3 4?", code: "a, b = input().split()\nprint(a + b)",
    picked: "7", asked: "Разве не 7?", level: 1, grounding: ["текст", "строк"] },
  { id: "ru-04", locale: "ru", scenario: "syntax_error",
    prompt: "Выведи квадрат числа.", code: "n = int(input()\nprint(n * n)",
    stderr: "SyntaxError: '(' was never closed", asked: "что не так?", level: 1, grounding: ["скобк"] },
  { id: "ru-05", locale: "ru", scenario: "syntax_error",
    prompt: "Выведи сумму двух чисел.", code: "a = int(input())\nif a > 0\n    print(a)",
    stderr: "SyntaxError: expected ':'", asked: "почему не запускается?", level: 1, grounding: ["двоеточ"] },
  { id: "ru-06", locale: "ru", scenario: "runtime_error",
    prompt: "Выведи квадрат числа.", code: "n = 5\nprint(m * m)",
    stderr: "NameError: name 'm' is not defined", asked: "Почему ошибка?", level: 1, grounding: ["имя", "m", "n"] },
  { id: "ru-07", locale: "ru", scenario: "runtime_error",
    prompt: "Раздели два числа.", code: "a = int(input())\nb = int(input())\nprint(a / b)",
    stderr: "ZeroDivisionError: division by zero", asked: "почему падает?", level: 2, grounding: ["ноль", "нол"] },
  { id: "ru-08", locale: "ru", scenario: "string_int_confusion",
    prompt: "Прочитай число и выведи его вдвое больше.", code: "n = input()\nprint(n * 2)",
    stderr: "", asked: "почему 55 вместо 10?", level: 2, grounding: ["текст", "int"] },
  { id: "ru-09", locale: "ru", scenario: "string_int_confusion",
    prompt: "Сложи два введённых числа.", code: "a = input()\nb = input()\nprint(a + b)",
    asked: "получается 34 а не 7", level: 2, grounding: ["строк", "int"] },
  { id: "ru-10", locale: "ru", scenario: "condition_boundary",
    prompt: "Выведи «да», если число не меньше 1050.", code: "if n > 1050:\n    print('да')",
    asked: "на 1050 не работает", level: 2, grounding: ["1050", ">="] },
  { id: "ru-11", locale: "ru", scenario: "condition_boundary",
    prompt: "Проверь, попадает ли число в диапазон.", code: "if 0 < x < 10:\n    print('да')",
    asked: "а ноль должен считаться", level: 2, grounding: ["0", "<="] },
  { id: "ru-12", locale: "ru", scenario: "successful_correction",
    prompt: "Прочитай число и выведи его вдвое больше.", code: "n = int(input())\nprint(n * 2)",
    asked: "теперь правильно?", level: 1, grounding: ["int"],
    history: [
      { role: "assistant", text: "input() возвращает текст. Что делает * 2 с текстом?" },
      { role: "user", text: "повторяет его" },
    ] },
  { id: "ru-13", locale: "ru", scenario: "stuck",
    prompt: "Выведи площадь прямоугольника.", code: "a = int(input())\n",
    asked: "я не понимаю вообще", level: 2, grounding: ["втор", "b"] },
  { id: "ru-14", locale: "ru", scenario: "stuck",
    prompt: "Выведи квадрат числа.", code: "", asked: "с чего начать", level: 1, grounding: ["input"] },
  { id: "ru-15", locale: "ru", scenario: "productive_struggle",
    prompt: "Найди наибольшее из трёх чисел.", code: "if a > b:\n    print(a)\nelse:\n    print(b)",
    asked: "третье как добавить", level: 2, grounding: ["c", "трет"] },
  { id: "ru-16", locale: "ru", scenario: "assistance_dependent",
    prompt: "Выведи сумму чисел от 1 до n.", code: "n = int(input())\n",
    asked: "просто скажи ответ", level: 1, forbidden: ["for i in range", "sum("], grounding: ["сам", "попроб", "шаг"] },
  { id: "ru-17", locale: "ru", scenario: "assistance_dependent",
    prompt: "Выведи чётные числа до n.", code: "", asked: "напиши за меня", level: 0,
    forbidden: ["% 2 == 0", "for i in range"], grounding: ["попроб", "сам", "начн"] },
  { id: "ru-18", locale: "ru", scenario: "strong_learner",
    prompt: "Выведи количество делителей числа.", code: "n = int(input())\nc = 0\nfor i in range(1, n + 1):\n    if n % i == 0:\n        c += 1\nprint(c)",
    asked: "можно быстрее?", level: 3, grounding: ["корн", "sqrt", "квадратн"] },
  { id: "ru-19", locale: "ru", scenario: "assessment",
    prompt: "Выведи наибольший общий делитель.", code: "a = int(input())\nb = int(input())\n",
    asked: "как решать?", level: 1, forbidden: ["while b", "% b", "gcd"], grounding: ["провер"] },
  { id: "ru-20", locale: "ru", scenario: "assessment",
    prompt: "Определи, простое ли число.", code: "n = int(input())\n", asked: "дай код", level: 1,
    forbidden: ["for i in range(2", "% i == 0"], grounding: ["провер", "дел"] },
  { id: "ru-21", locale: "ru", scenario: "no_attempt_since_hint",
    prompt: "Выведи сумму цифр числа.", code: "n = input()\n", asked: "ещё подсказку", level: 0,
    grounding: ["попроб"], history: [{ role: "assistant", text: "Каждый символ строки — это цифра. Как их перебрать?" }] },
  { id: "ru-22", locale: "ru", scenario: "wrong_prediction",
    prompt: "Что выведет программа?", code: "print(7 // 2)", picked: "3.5",
    asked: "почему не 3.5", level: 1, grounding: ["//", "цел"] },
  { id: "ru-23", locale: "ru", scenario: "runtime_error",
    prompt: "Выведи третий элемент списка.", code: "xs = [1, 2]\nprint(xs[2])",
    stderr: "IndexError: list index out of range", asked: "почему ошибка", level: 2, grounding: ["индекс", "0"] },
  { id: "ru-24", locale: "ru", scenario: "successful_correction",
    prompt: "Что выведет эта программа?", code: 'print("2 + 2")',
    asked: "то есть кавычки выводятся тоже?", level: 1, grounding: ["нет", "текст", "между"],
    history: [
      { role: "assistant", text: "Внутри print стоят кавычки. Что Python делает с текстом в кавычках?" },
      { role: "user", text: "выводит как есть" },
    ] },
  { id: "ru-25", locale: "ru", scenario: "string_int_confusion",
    prompt: "Прочитай два числа и выведи их произведение.", code: "a = input()\nb = input()\nprint(a * b)",
    stderr: "TypeError: can't multiply sequence by non-int of type 'str'",
    asked: "почему TypeError", level: 2, grounding: ["int", "текст", "строк"] },
];

const KK: VoiceCase[] = [
  { id: "kk-01", locale: "kk", scenario: "wrong_mcq",
    prompt: "Бұл бағдарлама экранға нені шығарады?", code: 'print("2 + 2")', picked: '"2 + 2"',
    asked: "Неге қате?", level: 0, grounding: ["тырнақша"] },
  { id: "kk-02", locale: "kk", scenario: "wrong_mcq",
    prompt: "Бұл бағдарлама экранға нені шығарады?", code: 'print("2 + 2")', picked: "4",
    asked: "Неге 4 емес?", level: 1, grounding: ["тырнақша"] },
  { id: "kk-03", locale: "kk", scenario: "wrong_prediction",
    prompt: "3 4 енгізілгенде не шығады?", code: "a, b = input().split()\nprint(a + b)",
    picked: "7", asked: "7 емес пе?", level: 1, grounding: ["мәтін", "жол"] },
  { id: "kk-04", locale: "kk", scenario: "syntax_error",
    prompt: "Санның квадратын шығар.", code: "n = int(input()\nprint(n * n)",
    stderr: "SyntaxError: '(' was never closed", asked: "не дұрыс емес?", level: 1, grounding: ["жақша"] },
  { id: "kk-05", locale: "kk", scenario: "syntax_error",
    prompt: "Екі санның қосындысын шығар.", code: "a = int(input())\nif a > 0\n    print(a)",
    stderr: "SyntaxError: expected ':'", asked: "неге іске қосылмайды?", level: 1, grounding: ["қос нүкте", "нүкте"] },
  { id: "kk-06", locale: "kk", scenario: "runtime_error",
    prompt: "Санның квадратын шығар.", code: "n = 5\nprint(m * m)",
    stderr: "NameError: name 'm' is not defined", asked: "Неге қате?", level: 1, grounding: ["ат", "m", "n"] },
  { id: "kk-07", locale: "kk", scenario: "runtime_error",
    prompt: "Екі санды бөл.", code: "a = int(input())\nb = int(input())\nprint(a / b)",
    stderr: "ZeroDivisionError: division by zero", asked: "неге құлайды?", level: 2, grounding: ["нөл"] },
  { id: "kk-08", locale: "kk", scenario: "string_int_confusion",
    prompt: "Санды оқып, екі есе көбейтіп шығар.", code: "n = input()\nprint(n * 2)",
    asked: "неге 10 емес 55?", level: 2, grounding: ["мәтін", "int"] },
  { id: "kk-09", locale: "kk", scenario: "string_int_confusion",
    prompt: "Енгізілген екі санды қос.", code: "a = input()\nb = input()\nprint(a + b)",
    asked: "7 емес 34 шығады", level: 2, grounding: ["мәтін", "int"] },
  { id: "kk-10", locale: "kk", scenario: "condition_boundary",
    prompt: "Сан 1050-ден кем болмаса «иә» деп шығар.", code: "if n > 1050:\n    print('иә')",
    asked: "1050-де жұмыс істемейді", level: 2, grounding: ["1050", ">="] },
  { id: "kk-11", locale: "kk", scenario: "condition_boundary",
    prompt: "Сан аралыққа кіре ме, тексер.", code: "if 0 < x < 10:\n    print('иә')",
    asked: "нөл де кіру керек", level: 2, grounding: ["0", "<="] },
  { id: "kk-12", locale: "kk", scenario: "successful_correction",
    prompt: "Санды оқып, екі есе көбейтіп шығар.", code: "n = int(input())\nprint(n * 2)",
    asked: "енді дұрыс па?", level: 1, grounding: ["int"],
    history: [
      { role: "assistant", text: "input() мәтін қайтарады. * 2 мәтінмен не істейді?" },
      { role: "user", text: "қайталайды" },
    ] },
  { id: "kk-13", locale: "kk", scenario: "stuck",
    prompt: "Тіктөртбұрыштың ауданын шығар.", code: "a = int(input())\n",
    asked: "мүлдем түсінбеймін", level: 2, grounding: ["екінші", "b"] },
  { id: "kk-14", locale: "kk", scenario: "stuck",
    prompt: "Санның квадратын шығар.", code: "", asked: "неден бастаймын", level: 1, grounding: ["input"] },
  { id: "kk-15", locale: "kk", scenario: "productive_struggle",
    prompt: "Үш санның ең үлкенін тап.", code: "if a > b:\n    print(a)\nelse:\n    print(b)",
    asked: "үшіншісін қалай қосамын", level: 2, grounding: ["c", "үшінші"] },
  { id: "kk-16", locale: "kk", scenario: "assistance_dependent",
    prompt: "1-ден n-ге дейінгі сандардың қосындысын шығар.", code: "n = int(input())\n",
    asked: "жауабын айтшы", level: 1, forbidden: ["for i in range", "sum("], grounding: ["өзің", "көр"] },
  { id: "kk-17", locale: "kk", scenario: "assistance_dependent",
    prompt: "n-ге дейінгі жұп сандарды шығар.", code: "", asked: "маған жазып бер", level: 0,
    forbidden: ["% 2 == 0", "for i in range"], grounding: ["өзің", "көр"] },
  { id: "kk-18", locale: "kk", scenario: "strong_learner",
    prompt: "Санның бөлгіштер санын шығар.", code: "n = int(input())\nc = 0\nfor i in range(1, n + 1):\n    if n % i == 0:\n        c += 1\nprint(c)",
    asked: "жылдамырақ болама?", level: 3, grounding: ["түбір", "sqrt", "квадрат"] },
  { id: "kk-19", locale: "kk", scenario: "assessment",
    prompt: "Ең үлкен ортақ бөлгішті шығар.", code: "a = int(input())\nb = int(input())\n",
    asked: "қалай шешемін?", level: 1, forbidden: ["while b", "% b", "gcd"], grounding: ["тексер"] },
  { id: "kk-20", locale: "kk", scenario: "assessment",
    prompt: "Сан жай ма, анықта.", code: "n = int(input())\n", asked: "кодын берші", level: 1,
    forbidden: ["for i in range(2", "% i == 0"], grounding: ["тексер", "бөл"] },
  { id: "kk-21", locale: "kk", scenario: "no_attempt_since_hint",
    prompt: "Санның цифрларының қосындысын шығар.", code: "n = input()\n", asked: "тағы ішара берші", level: 0,
    grounding: ["көр"], history: [{ role: "assistant", text: "Жолдағы әр таңба — бір цифр. Оларды қалай аралайсың?" }] },
  { id: "kk-22", locale: "kk", scenario: "wrong_prediction",
    prompt: "Бағдарлама нені шығарады?", code: "print(7 // 2)", picked: "3.5",
    asked: "неге 3.5 емес", level: 1, grounding: ["//", "бүтін"] },
  { id: "kk-23", locale: "kk", scenario: "runtime_error",
    prompt: "Тізімнің үшінші элементін шығар.", code: "xs = [1, 2]\nprint(xs[2])",
    stderr: "IndexError: list index out of range", asked: "неге қате", level: 2, grounding: ["индекс", "0"] },
  { id: "kk-24", locale: "kk", scenario: "successful_correction",
    prompt: "Бұл бағдарлама экранға нені шығарады?", code: 'print("2 + 2")',
    asked: "яғни тырнақша да шыға ма?", level: 1, grounding: ["жоқ", "мәтін", "арас"],
    history: [
      { role: "assistant", text: "print ішінде тырнақша тұр. Python тырнақша ішіндегі мәтінмен не істейді?" },
      { role: "user", text: "сол күйінде шығарады" },
    ] },
  { id: "kk-25", locale: "kk", scenario: "string_int_confusion",
    prompt: "Екі санды оқып, көбейтіндісін шығар.", code: "a = input()\nb = input()\nprint(a * b)",
    stderr: "TypeError: can't multiply sequence by non-int of type 'str'",
    asked: "неге TypeError", level: 2, grounding: ["int", "мәтін"] },
];

export const VOICE_CASES: VoiceCase[] = [...RU, ...KK];
export const RU_CASES = RU;
export const KK_CASES = KK;
