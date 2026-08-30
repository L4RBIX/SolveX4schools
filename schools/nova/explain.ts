import type { Locale } from "@schools/curriculum/types";

/**
 * The hint policy, said in the learner's language.
 *
 * `grantHintLevel` returns an `explanation` string, and it is English — the
 * core was written for an English product and must not be forked to change
 * that. But a Russian-reading fourteen-year-old meeting "Starting with a
 * question — tell me what you think is happening" has hit the seam between two
 * products, and that is exactly the mixed-language failure this phase exists to
 * remove.
 *
 * So the `reason` code is translated instead of the sentence. The code is a
 * stable enum on the core's side; the wording is ours. The two cannot drift,
 * because an unrecognised reason falls through to a general line rather than
 * leaking the English one.
 *
 * The engine's own vocabulary never reaches the screen either way: a learner
 * sees a sentence, never `capped_by_directive`.
 */

const BY_REASON: Record<string, Record<Locale, string>> = {
  opening_rung: {
    kk: "Сұрақтан бастайық. Не болып жатыр деп ойлайсың? Айтсаң, қайдан қарау керегін көрсетемін.",
    ru: "Начнём с вопроса. Как думаешь, что здесь происходит? Скажешь — покажу, куда смотреть.",
  },
  /* The rung that did not exist when this table was written.
   *
   * `attempt_required` was added to the core alongside the gate that enforces
   * «көмек оқушы өзі бір әрекет жасап көргеннен кейін ғана ашылады», and
   * without an entry here it fell through to the generic line — so the one
   * moment where the learner most needs to be told WHY help is closed was the
   * one moment the product said nothing useful. */
  attempt_required: {
    kk: "Алдымен өзің бір көріп шық — қате болса да. Сосын нақты неге тұрып қалғаныңа көмектесемін.",
    ru: "Сначала попробуй сам — пусть даже неправильно. Потом помогу с тем, на чём ты реально застрял.",
  },
  no_attempt_since_last_hint: {
    kk: "Алдыңғы ішарамен бір нәрсе жасап көрші — содан кейін әрі қарай жүреміз.",
    ru: "Попробуй что-нибудь с прошлой подсказкой — потом пойдём дальше.",
  },
  one_rung_at_a_time: {
    kk: "Бір қадам жеткілікті. Мынаны істеп көр, содан кейін көбірек айтамын.",
    ru: "Пока хватит одного шага. Попробуй это, потом скажу больше.",
  },
  capped_by_directive: {
    kk: "Неге өтпей тұрғанын әлі нақты айта алмаймын, сондықтан болжағаннан гөрі сұрағым келеді.",
    ru: "Пока не могу точно сказать, почему не проходит, поэтому лучше спрошу, чем угадаю.",
  },
  unproductive_struggle_override: {
    kk: "Ұзақ тұрып қалдың. Тікелей айтайын.",
    ru: "Ты застрял надолго. Скажу прямо.",
  },
  learner_override: {
    kk: "Жарайды, тікелей айтамын. Бұл жолы дербес шешім деп саналмайды.",
    ru: "Хорошо, скажу прямо. В этот раз решение не зачтётся как самостоятельное.",
  },
};

/**
 * `null` when nothing needs saying — a grant that matched the request has no
 * explanation to give, and inventing one turns help into a lecture.
 */
export function explainPolicy(reason: string, locale: Locale): string | null {
  if (reason === "granted_as_requested") return null;
  const entry = BY_REASON[reason];
  if (entry) return entry[locale];
  return locale === "kk"
    ? "Әзірге осы деңгейде көмектесемін."
    : "Пока помогу на этом уровне.";
}
