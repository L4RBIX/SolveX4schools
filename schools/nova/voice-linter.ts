import type { Locale } from "@schools/curriculum/types";
import { TIRED_OPENER_LIST } from "./voice";

/**
 * A diagnostic, not a filter.
 *
 * ## What this is emphatically not
 *
 * It does not touch the text. Nothing in the request path calls it, and nothing
 * ever should: a rewriter downstream of `validate.ts` would be free to
 * reintroduce the answer the validator had just refused, and the enforcement
 * would be checking a string that no longer reaches the learner.
 *
 * It also is not a second opinion on whether Nova is CORRECT. Grounding,
 * leakage and hint ceilings are decided upstream by machinery that can actually
 * decide them. This counts stylistic tells, and stylistic tells are all it
 * knows: a reply can pass every check here and still be pedagogically useless.
 *
 * ## What it is for
 *
 * Voice regressions are invisible one reply at a time. Nobody reads a single
 * «Давай разберёмся» and files a bug; the failure is that forty replies in a
 * row open the same way, and that only shows up in aggregate. So the fixtures
 * run a batch through this and assert on the RATE — see the voice tests.
 */

export type VoiceFindingCode =
  | "tired_opener"
  | "praise"
  | "process_narration"
  | "multiple_questions"
  | "too_long"
  | "restates_task"
  | "stock_closer"
  | "claims_blindness";

export interface VoiceFinding {
  code: VoiceFindingCode;
  /** The matched fragment, for a human reading the report. Never the whole reply. */
  evidence: string;
}

/** Sentence count, counting `?` and `!` as terminators and tolerating «...». */
function sentences(text: string): string[] {
  return text
    .replace(/\.{3}/g, "…")
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/*
 * Cyrillic needs its own word boundary.
 *
 * `\b` in JavaScript is defined against `\w`, which is `[A-Za-z0-9_]` — so
 * `\bотлично\b` matches nothing at all, in either language, and a praise
 * detector written the obvious way silently detects zero praise forever. The
 * lookarounds below are on `\p{L}` with the `u` flag, which is the boundary
 * that actually exists in these alphabets.
 */
const PRAISE: Record<Locale, RegExp> = {
  ru: /(?<!\p{L})(отлично|молодец|хороший вопрос|прекрасно|замечательно|умница|верно мыслишь)(?!\p{L})/iu,
  kk: /(?<!\p{L})(тамаша|жарайсың|жақсы сұрақ|өте жақсы|дұрыс ойлайсың)(?!\p{L})/iu,
};

/** Announcing the move instead of making it. */
const PROCESS: Record<Locale, RegExp> = {
  ru: /(давай(те)? (разбер|посмотр|подума)|начнём с|разберёмся вместе|сейчас (я )?объясню|шаг за шагом)/i,
  kk: /(кел,? (қара|талда|ойла)|сұрақтан бастай|бірге қарай|қазір түсіндір)/i,
};

/** Saying it cannot see what the platform is already holding. */
const BLINDNESS: Record<Locale, RegExp> = {
  ru: /(не вижу|пока не понимаю,? почему|не знаю,? что у теб|что ты ожидал|какого результата (ты )?ждал)/i,
  kk: /(көріп тұрған жоқпын|неге екенін білмеймін|не күткен едің|қандай нәтиже күткен)/i,
};

/** A question tacked on after the point is made, every single time. */
const STOCK_CLOSER: Record<Locale, RegExp> = {
  ru: /(что (ты )?(попробуешь|выберешь) (дальше|в следующий раз)|какой следующий шаг)\s*\?/i,
  kk: /(келесі жолы не (таңдай|істей)сың|келесі қадам қандай)\s*\?/i,
};

/**
 * Every stylistic tell in one reply.
 *
 * `prompt` is the task statement, so restatement can be detected rather than
 * guessed: a reply that quotes a long run of the prompt verbatim is reading the
 * screen back. Short quotes are fine and often necessary — naming the line is
 * the whole point — so the threshold is a run of words, not any overlap.
 */
export function lintVoice(
  reply: string,
  opts: { locale: Locale; prompt?: string; maxSentences?: number },
): VoiceFinding[] {
  const { locale, prompt, maxSentences = 3 } = opts;
  const out: VoiceFinding[] = [];
  const text = reply.trim();
  if (!text) return out;

  const opener = TIRED_OPENER_LIST[locale].find((o) => {
    const head = o.replace(/[.!…]+$/, "").toLowerCase();
    return text.toLowerCase().startsWith(head.slice(0, Math.min(head.length, 18)));
  });
  if (opener) out.push({ code: "tired_opener", evidence: opener });

  for (const [code, table] of [
    ["praise", PRAISE],
    ["process_narration", PROCESS],
    ["claims_blindness", BLINDNESS],
    ["stock_closer", STOCK_CLOSER],
  ] as const) {
    const m = table[locale].exec(text);
    if (m) out.push({ code, evidence: m[0] });
  }

  const questions = (text.match(/\?/g) ?? []).length;
  if (questions > 1) out.push({ code: "multiple_questions", evidence: `${questions} questions` });

  const n = sentences(text).length;
  if (n > maxSentences) out.push({ code: "too_long", evidence: `${n} sentences` });

  if (prompt) {
    /* Six consecutive words of the task, verbatim. Long enough that naming a
       line or quoting an expression does not trip it, short enough that reading
       the question back does. */
    const words = prompt.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = text.toLowerCase();
    for (let i = 0; i + 6 <= words.length; i++) {
      const run = words.slice(i, i + 6).join(" ");
      if (hay.includes(run)) {
        out.push({ code: "restates_task", evidence: run });
        break;
      }
    }
  }

  return out;
}

/** Aggregate over a batch — the only view in which a voice regression is visible. */
export function voiceReport(
  replies: { reply: string; locale: Locale; prompt?: string }[],
): { total: number; byCode: Record<string, number>; rate: number } {
  const byCode: Record<string, number> = {};
  let flagged = 0;
  for (const r of replies) {
    const findings = lintVoice(r.reply, { locale: r.locale, prompt: r.prompt });
    if (findings.length) flagged += 1;
    for (const f of findings) byCode[f.code] = (byCode[f.code] ?? 0) + 1;
  }
  return { total: replies.length, byCode, rate: replies.length ? flagged / replies.length : 0 };
}
