import type { Locale } from "@schools/curriculum/types";

/**
 * School wording for machine-produced prose.
 *
 * The decision engine builds learner-facing sentences in English CP idiom:
 * *"a compile error"*, *"a crash"*, *"the running time"*. Correct for a
 * competitive-programming site; wrong in a Kazakh 9th-grade classroom, where
 * the learner may not read English and "crash" is not a word anyone has taught
 * them.
 *
 * This module re-words the engine's output for the classroom. It **replaces
 * wording only** — the decision itself, the level, the cap and the reasoning
 * all come from the engine untouched. Nothing here can change what the system
 * decides, only how it reads.
 */

export type FailureClass =
  | "edge_case_handling"
  | "complexity_asymptotic"
  | "compile_error"
  | "runtime_error"
  | "memory_limit"
  | "unattributed_failure";

const FAILURE_WORDS: Record<FailureClass, Record<Locale, string>> = {
  edge_case_handling: {
    kk: "шарттың шекарасы",
    ru: "граница условия",
  },
  complexity_asymptotic: {
    kk: "бағдарламаның жылдамдығы",
    ru: "скорость программы",
  },
  compile_error: {
    kk: "жазылу қатесі — бағдарлама басталмай тұрып тоқтады",
    ru: "ошибка записи — программа остановилась ещё до запуска",
  },
  runtime_error: {
    kk: "орындалу кезіндегі қате",
    ru: "ошибка во время выполнения",
  },
  memory_limit: {
    kk: "жады шегі",
    ru: "предел памяти",
  },
  unattributed_failure: {
    kk: "әлі анықталмаған себеп",
    ru: "пока не установленная причина",
  },
};

export function failureWord(failureClass: string, locale: Locale): string {
  const known = FAILURE_WORDS[failureClass as FailureClass];
  return known ? known[locale] : FAILURE_WORDS.unattributed_failure[locale];
}

/**
 * How the assistant introduces itself, per the programme's fourth AI rule:
 * the learner always knows they are talking to a program, not a person
 * (PDF p.4).
 *
 * This string is not optional decoration. It is a curriculum requirement and
 * must appear wherever Nova speaks for the first time in a session.
 */
export const ASSISTANT_DISCLOSURE: Record<Locale, string> = {
  kk: "Мен — бағдарламамын, адам емеспін. Саған дайын шешім бермеймін, ойлануыңа көмектесемін.",
  ru: "Я программа, а не человек. Готовое решение я не дам — помогу тебе думать.",
};

/**
 * Wording for `DIAGNOSE`, the action the engine returns when it does not know
 * why the learner is failing.
 *
 * The phrasing matters more here than anywhere else: this is the state where
 * the honest thing is to ask rather than assert, and any sentence that sounds
 * like a diagnosis would be a lie about a child.
 */
export const DIAGNOSE_OPENING: Record<Locale, string> = {
  kk: "Не болып жатқанын әлі түсінбедім. Шешуді қалай бастағаныңды өз сөзіңмен айтып берші.",
  ru: "Я пока не понял, что происходит. Расскажи своими словами, как ты начал решать.",
};

/**
 * Shown wherever mastery would otherwise be displayed as a number.
 *
 * `unknown` is a real state in the imported model and must survive to the
 * screen. Rendering it as "0%" or hiding the skill would both be false: one
 * claims a measurement that was never taken, the other pretends the skill is
 * not part of the programme.
 */
export const UNKNOWN_MASTERY: Record<Locale, string> = {
  kk: "әлі өлшенбеген",
  ru: "ещё не измерено",
};
