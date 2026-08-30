import "server-only";
import type { Locale } from "@schools/curriculum/types";

/**
 * How Nova talks.
 *
 * ## Why this is a contract and not a second pass
 *
 * The obvious way to make a model sound human is to run its output through
 * another model that rewrites it. We do not, and the reason is not latency
 * (though it doubles it). Everything that decides what Nova may SAY — the hint
 * ceiling, the forbidden literals, the refusal to name a misconception without
 * evidence — is enforced against the text the provider returns. A rewriter sits
 * downstream of that enforcement and is free to reintroduce anything it likes,
 * including the answer, and `validate.ts` would be checking the wrong string.
 *
 * So voice is an instruction inside the SAME trusted generation, and it is
 * subordinate to policy by construction: these lines are rendered above the
 * grounding reminder and below the ladder, and they say so out loud.
 *
 * ## What was actually wrong
 *
 * Two rules in the old STYLE block produced most of it:
 *
 *     - At most 6 sentences unless walking through code at level 3 or 4.
 *     - End by asking what they will try next — the point is that they try.
 *
 * The first licensed a paragraph where a sentence would do. The second MANDATED
 * a formulaic closer, so every reply ended «Келесі жолы не таңдайсың?» /
 * «Что попробуешь дальше?» whether or not it made sense — the product asking
 * for the trailing question and then the transcript reading like a bot.
 *
 * The rest is the ordinary LLM register: a warm-up clause before the point, a
 * compliment before the answer, the task read back before it is addressed.
 */

/**
 * The openers that had become templates.
 *
 * Not a blocklist of forbidden words — each of these is a perfectly good Kazakh
 * or Russian sentence, and a rule that banned them outright would push the model
 * into stranger paraphrases of the same move. They are listed because they had
 * become the DEFAULT: the reply opened this way regardless of what was on
 * screen, which is what makes a tutor sound like a form letter.
 *
 * Written per locale rather than translated. «Давай разберёмся» and «Кел,
 * қарайық» are the same instinct, but the Kazakh sentence a fourteen-year-old
 * in Almaty would flinch at is not the word-for-word rendering of the Russian
 * one, and a single list translated twice produces a Kazakh Nova that sounds
 * like a Russian Nova speaking Kazakh.
 */
const TIRED_OPENERS: Record<Locale, string[]> = {
  ru: [
    "Начнём с...",
    "Давай разберёмся",
    "Давай посмотрим",
    "Хороший вопрос!",
    "Отлично!",
    "Молодец!",
    "Понимаю",
    "Я вижу, что...",
    "Посмотри внимательно...",
    "Обрати внимание...",
    "Как ты думаешь...",
  ],
  kk: [
    "Сұрақтан бастайық",
    "Кел, қарайық",
    "Кел, талдайық",
    "Жақсы сұрақ!",
    "Тамаша!",
    "Жарайсың!",
    "Түсінемін",
    "Мен көріп тұрмын...",
    "Мұқият қара...",
    "Назар аудар...",
    "Қалай ойлайсың...",
  ],
};

/**
 * The voice, as lines for the system prompt.
 *
 * English, like the rest of the prompt: the model is being instructed, not
 * spoken to as a learner. The only locale-specific part is the list of tired
 * openers, because those are facts about the output language.
 */
export function voiceContract(locale: Locale): string[] {
  /*
   * Terse on purpose.
   *
   * The first draft of this block explained its own reasoning to the model and
   * cost 2.5 kB, which took the worst September prompt from 6.9 kB to 9.0 kB
   * and tripped the context ceiling in `privacy-context.test.ts` — a test that
   * exists precisely to catch a context growing quietly, because input tokens
   * are billed and eighteen learners share one monthly cap. The reasoning is
   * worth writing down; it is not worth paying for on every request. So it
   * lives in these comments and the model gets the rules.
   */
  return [
    "",
    "VOICE (policy above wins; if a rule here would say more than your level allows, say less)",
    "- 1-3 short sentences. Longer only if your level allows explanation or code.",
    "- One teaching move. At most one question.",
    "- Open with the thing itself — the line, the value, the character. No warm-up clause.",
    "- Do not restate the task, announce what you are about to do, or say you can see their screen.",
    "- No praise or reassurance before the content. No stock closing question.",
    "- Give the one reason that is true here, not three because three feels complete.",
    "- Never invent a memory, a feeling, a student you taught, or a lived opinion.",
    "- If they answered your last question, build on it. Never re-ask it in new words.",
    `- Do not open with these; they have become templates: ${TIRED_OPENERS[locale].join("; ")}`,
    locale === "kk"
      ? "- Kazakh only, as a Kazakh-speaking teacher talks. Not translated Russian."
      : "- Russian only, the plain register a teacher uses with a 14-year-old.",
  ];
}

/** Exported for the voice linter and its tests. */
export const TIRED_OPENER_LIST = TIRED_OPENERS;
