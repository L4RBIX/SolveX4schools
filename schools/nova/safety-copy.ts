import type { Locale } from "@schools/curriculum/types";
import type { SafetyReason } from "./safety";

/**
 * What Nova says when the model is not allowed to speak.
 *
 * Every string here is delivered verbatim. No language model shapes it, no
 * temperature applies, and it reads the same on the first day of the pilot as
 * on the last. That is the point: the two categories this file exists for — a
 * child in danger, and a child being hurt — are the two where an improvised
 * answer is least acceptable and hardest to review afterwards.
 *
 * ## Rules these strings follow
 *
 * - Nothing here diagnoses. Nova is a programming tutor and says so.
 * - Nothing here promises confidentiality the platform does not provide.
 * - Nothing here is a lecture. A frightened fourteen-year-old stops reading at
 *   the third sentence.
 * - Nothing here mentions a subsystem, a policy, a filter or a rule. A learner
 *   who is told their message "violated a content policy" has learned that the
 *   product is a machine that judges them.
 * - The refusals redirect to the task, because the task is the thing Nova can
 *   actually help with, and offering it is kinder than stopping at "no".
 *
 * ## The phone numbers
 *
 * 111 is Kazakhstan's national child helpline and 112 is the emergency number.
 * BOTH MUST BE CONFIRMED BY THE SCHOOL BEFORE THE PILOT — a wrong number in a
 * crisis response is worse than no number, and this file is not the authority
 * on either. Flagged in `docs/nova/SCHOOL_SAFETY.md` as a release blocker owned
 * by the school, not by engineering.
 */

type Copy = Record<Locale, string>;

const SELF_HARM: Copy = {
  kk: [
    "Осыны маған жазғаның жақсы болды. Мен — оқу көмекшісімін, дәрігер емеспін, ",
    "сондықтан мұны бір өзің көтеріп жүрмегенің маңызды.",
    "\n\nБүгін сенімді ересек адамға — ата-анаңа, мұғаліміңе немесе психологқа — ",
    "айтып шық. Егер қазір қауіпті сезінсең, 112-ге қоңырау шал. Балалар үшін ",
    "тегін сенім телефоны: 111.",
    "\n\nМен осындамын, тапсырмаға қайта оралғың келсе — бірге қараймыз.",
  ].join(""),
  ru: [
    "Хорошо, что ты об этом написал. Я — учебный помощник, а не врач, ",
    "и это слишком важно, чтобы нести это одному.",
    "\n\nПоговори сегодня с взрослым, которому доверяешь: с родителями, учителем ",
    "или школьным психологом. Если тебе сейчас угрожает опасность — позвони 112. ",
    "Бесплатная детская линия доверия: 111.",
    "\n\nЯ здесь. Захочешь вернуться к заданию — разберём вместе.",
  ].join(""),
};

const ABUSE: Copy = {
  kk: [
    "Мұны айту оңай емес. Ешкімнің сені ұруға, қорқытуға немесе мазақтауға ",
    "құқығы жоқ, және бұл сенің кінәң емес.",
    "\n\nМектептегі сенімді ересекке — сынып жетекшісіне, психологқа — немесе ",
    "ата-анаңа айт. Қазір қауіпті болса, 112. Балалар сенім телефоны: 111.",
    "\n\nДайын болсаң, тапсырмаға қайта ораламыз.",
  ].join(""),
  ru: [
    "Это непросто рассказать. Никто не имеет права тебя бить, запугивать ",
    "или травить, и это не твоя вина.",
    "\n\nРасскажи взрослому, которому доверяешь: классному руководителю, ",
    "школьному психологу или родителям. Если опасность прямо сейчас — 112. ",
    "Детская линия доверия: 111.",
    "\n\nКогда будешь готов, вернёмся к заданию.",
  ].join(""),
};

const SEXUAL: Copy = {
  kk: "Бұл тақырыпта сөйлесе алмаймын. Денсаулық туралы сұрағың болса, оны ата-анаңмен немесе мектеп дәрігерімен талқыла. Тапсырмаға оралайық па?",
  ru: "На эту тему я говорить не могу. Если это вопрос о здоровье — обсуди его с родителями или школьным врачом. Вернёмся к заданию?",
};

const VIOLENCE: Copy = {
  kk: "Мұндай нәрсеге көмектеспеймін. Егер біреу сені ренжітіп жүрсе, сенімді ересекке айт. Ал қазір — тапсырмаңа қайта оралайық.",
  ru: "С таким я не помогу. Если тебя кто-то обижает — скажи взрослому, которому доверяешь. А сейчас давай вернёмся к заданию.",
};

const DRUGS: Copy = {
  kk: "Бұл сұраққа жауап бермеймін. Алаңдатқан нәрсе болса, ата-анаңа немесе мектеп психологына айт. Тапсырмамен жалғастырайық.",
  ru: "На это я не отвечу. Если что-то беспокоит — поговори с родителями или школьным психологом. Давай продолжим с заданием.",
};

const ILLEGAL_ACCESS: Copy = {
  kk: "Басқа біреудің аккаунтына немесе деректеріне кіруге көмектеспеймін. Ал қауіпсіздік қалай жұмыс істейтінін білгің келсе — оны бірге оқи аламыз. Әзірге тапсырмаға оралайық.",
  ru: "Помогать взламывать чужие аккаунты или данные я не буду. А вот как вообще устроена безопасность — об этом можем поговорить. Пока вернёмся к заданию.",
};

const HATE: Copy = {
  kk: "Адамдарды тобына қарап қорлайтын нәрсе жазбаймын. Тапсырмаңмен көмектесе аламын — жалғастырамыз ба?",
  ru: "Я не буду писать то, что унижает людей по признаку их группы. С заданием помочь могу — продолжим?",
};

const PERSONAL_DATA: Copy = {
  kk: "Құпия сөзіңді, карта нөміріңді немесе үй мекенжайыңды ешкімге жіберме — маған да. Мен оларды сұрамаймын және қажет етпеймін. Тапсырмаға оралайық.",
  ru: "Никогда не отправляй никому пароль, номер карты или домашний адрес — мне тоже. Я их не спрашиваю и они мне не нужны. Вернёмся к заданию.",
};

const ACADEMIC_INTEGRITY: Copy = {
  kk: "Бақылау жұмысы кезінде дайын жауап бермеймін — бұл сенің бағаң, менікі емес. Бірақ тақырыпты түсінуге көмектесе аламын: не істеп көрдің және қай жерде тұрып қалдың?",
  ru: "Во время контрольной готовый ответ я не дам — это твоя оценка, не моя. Но разобраться в теме помогу: что ты уже попробовал и на чём застрял?",
};

const PROMPT_EXFILTRATION: Copy = {
  kk: "Ол туралы айта алмаймын. Ал тапсырмаңмен нақты көмектесе аламын — қазір не істеп жатырсың?",
  ru: "Об этом рассказать не могу. А вот с заданием помогу по-настоящему — что у тебя сейчас не получается?",
};

const EXTENDED_OFFTOPIC: Copy = {
  kk: "Аздап әңгімелесуге болады, бірақ мен негізінен оқуыңа көмектесу үшін осындамын. Тапсырманы жалғастырамыз ба, әлде программалау туралы бірдеңе сұрайсың ба?",
  ru: "Немного поболтать можно, но я здесь в основном чтобы помогать с учёбой. Продолжим задание или спросишь что-нибудь про программирование?",
};

/**
 * The last resort.
 *
 * Used when the model produced something the validator rejected twice. It says
 * nothing about why, because the learner did nothing wrong and the reason is
 * ours, and it asks the one question that is useful at every hint level.
 */
const VALIDATOR_FALLBACK: Copy = {
  kk: "Қазір толық жауап құрастыра алмадым. Не істеп көрдің және қандай нәтиже күткен едің?",
  ru: "Сейчас я не смог составить полный ответ. Что ты попробовал и какого результата ждал?",
};

const BY_REASON: Partial<Record<SafetyReason, Copy>> = {
  self_harm: SELF_HARM,
  abuse_disclosure: ABUSE,
  sexual: SEXUAL,
  violence: VIOLENCE,
  drugs: DRUGS,
  illegal_access: ILLEGAL_ACCESS,
  hate: HATE,
  personal_data: PERSONAL_DATA,
  academic_integrity: ACADEMIC_INTEGRITY,
  prompt_exfiltration: PROMPT_EXFILTRATION,
  extended_offtopic: EXTENDED_OFFTOPIC,
};

export function safetyResponse(reason: SafetyReason, locale: Locale): string {
  return (BY_REASON[reason] ?? PROMPT_EXFILTRATION)[locale];
}

export function validatorFallback(locale: Locale): string {
  return VALIDATOR_FALLBACK[locale];
}

/** Exported so a test can assert every reason has distinct, non-empty copy. */
export const SAFETY_COPY = { ...BY_REASON, validator_fallback: VALIDATOR_FALLBACK };
