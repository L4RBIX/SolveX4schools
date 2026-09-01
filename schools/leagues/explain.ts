import type { Localized } from "@schools/curriculum/types";
import { LEAGUE_UNLOCK_XP } from "./unlock";

/**
 * What a learner is told about the competition, in one place.
 *
 * ## One explanation, not three
 *
 * §19 wants the week explained on `/league`; §22 wants a «Как работают лиги»
 * surface; the home card wants a sentence under an unlock meter. The obvious
 * shape is three copies of the same paragraph on three screens, and three
 * copies is how a product ends up telling a fourteen-year-old that the week
 * resets on Sunday in one place and on Monday in another.
 *
 * So: the LONG answer is a single Help Center article (`leagues`, in
 * `schools/help/content.ts`), reachable at `LEAGUE_HELP_HREF` and linked from
 * both the league page and the home card. The SHORT lines a screen needs in
 * place are here, and both surfaces import them rather than writing their own.
 *
 * ## Why these are not in `labels.ts`
 *
 * `L` is the presentation layer's shared vocabulary and it already carries
 * thirty league strings. These five are different in kind: they are the
 * league's own EXPLANATION of itself, they are quoted by the help article as
 * well as by the screens, and `{xp}` below is substituted from
 * `LEAGUE_UNLOCK_XP` so that the threshold has exactly one definition. Putting
 * a string that interpolates a league constant into the global label table
 * would put the constant there too, or leave the two free to disagree.
 *
 * `tests/leagues/explain.test.ts` asserts both languages are present and that
 * the Kazakh is not a copy of the Russian — the same guarantee
 * `product-surface.test.ts` gives `L`, which does not scan this file.
 *
 * ## Register
 *
 * Second person, present or future tense, no Russian past participles. The
 * product holds no gender for anybody — `school_accounts` has a name, a school,
 * a role and a credential — so «ты набрал» would misgender roughly half of
 * every class. `labels.ts` states the rule at length; this file follows it.
 */

/** The Help Center article id. Stable — a teacher writes it on a whiteboard. */
export const LEAGUE_HELP_ARTICLE = "leagues";

/** Where the long explanation lives. Linked from `/league` and from the home card. */
export const LEAGUE_HELP_HREF = `/help/${LEAGUE_HELP_ARTICLE}`;

/**
 * The short lines, in both languages.
 *
 * `{xp}` in `unlock` is substituted by the caller with `LEAGUE_UNLOCK_XP` —
 * `withUnlockXp` below does it, so no screen hardcodes 175.
 */
export const LEAGUE_EXPLAIN: {
  weekTitle: Localized;
  weekBody: Localized;
  weekSettles: Localized;
  scope: Localized;
  unlock: Localized;
  helpLink: Localized;
} = {
  weekTitle: {
    kk: "Апта қалай саналады?",
    ru: "Как считается неделя?",
  },
  /* When it starts, when it ends, and what survives the boundary. The last
     clause is the one that gets asked out loud: a learner who sees 0 XP on
     Monday needs to know the league itself did not disappear. */
  weekBody: {
    kk: "Апта дүйсенбіде басталып, жексенбіде аяқталады. Дүйсенбіде осы аптадағы XP қайтадан нөлден саналады, ал лигаң өз орнында қалады.",
    ru: "Неделя начинается в понедельник и заканчивается в воскресенье. В понедельник XP этой недели считается заново с нуля, а твоя лига остаётся на месте.",
  },
  /* What the boundary DOES. Stated as movement, never as a score or a verdict. */
  weekSettles: {
    kk: "Апта аяқталғанда тізімнің жоғарғы бөлігі келесі лигаға көтеріледі, ортасы қалады, ең соңы бір лига төмен жалғастырады.",
    ru: "Когда неделя заканчивается, верх таблицы поднимается в следующую лигу, середина остаётся, а низ продолжает лигой ниже.",
  },
  /* Privacy, in the sentence a learner would actually ask it in. */
  scope: {
    kk: "Тізімде тек өз сыныбыңның оқушылары болады. Әркімнің осы аптада жинаған XP-і ғана көрінеді — жауаптарың да, қателерің де, Nova-дан сұрағаның да ешкімге көрінбейді.",
    ru: "В таблице только ученики твоего класса. Видно лишь, у кого сколько XP за эту неделю, — ни твои ответы, ни ошибки, ни обращения к Nova никто там не увидит.",
  },
  /* `{xp}` is substituted from LEAGUE_UNLOCK_XP by `withUnlockXp`. */
  unlock: {
    kk: "Лига барлық уақытта {xp} XP жинағанда ашылады.",
    ru: "Лига открывается, когда за всё время наберёшь {xp} XP.",
  },
  helpLink: {
    kk: "Лигалар қалай жұмыс істейді",
    ru: "Как работают лиги",
  },
};

/**
 * Substitute the threshold into a line that names it.
 *
 * A function rather than a template literal at the definition, so the constant
 * is imported once and the strings above stay plain data a test can walk.
 */
export function withUnlockXp(text: string): string {
  return text.replace("{xp}", String(LEAGUE_UNLOCK_XP));
}
