/**
 * Text views, for matching against text that does not want to be matched.
 *
 * A safety or injection pattern written as a plain string matches exactly one
 * spelling of the thing it is looking for. The learner who wants to get past it
 * has an unbounded number of other spellings: Cyrillic `о` for Latin `o`,
 * `i g n o r e`, `1gn0re`, a base64 blob, zero-width joiners between every
 * letter. None of those are exotic — they are the first four things anyone
 * tries, and a fourteen-year-old will try them within a week of being told
 * Nova has rules.
 *
 * So nothing matches the message. Everything matches a set of VIEWS of it, and
 * a pattern that hits any view hits. This does not make evasion impossible. It
 * makes the cheap evasions cost more than asking the question honestly, which
 * is the only realistic goal — the gate is layer three of five and is never the
 * thing being relied on. See `docs/nova/JAILBREAK_POSTURE.md`.
 */

/** Zero-width and formatting characters. Invisible, and they break every literal. */
const INVISIBLE = /[­᠎​-‏‪-‮⁠-⁤⁪-⁯﻿]/g;

/**
 * Combining marks, stripped only where they sit on a LATIN letter.
 *
 * `i` followed by a combining dot above survives NFKC, is not `i`, and is one
 * keystroke of evasion. But a blanket NFD-and-strip is a trap: Cyrillic `й` is
 * canonically `и` + U+0306, so stripping every mark rewrites *игнорируй* to
 * *игнорируи* and quietly kills every Russian pattern that ends in `й` — a
 * defence that passes its own tests because the tests were written in English.
 *
 * Restricting the strip to Latin bases keeps `й` and `ё` intact through the
 * NFC recomposition that follows.
 */
const LATIN_WITH_MARKS = /([a-z])[̀-ͯ]+/g;

/**
 * Homoglyphs, folded toward Latin.
 *
 * Only characters that are visually confusable, and only in the direction that
 * reveals a disguised Latin word. The reverse fold is never applied: turning
 * Latin into Cyrillic would corrupt the Russian and Kazakh views, which are
 * where the Russian and Kazakh patterns have to match.
 */
const HOMOGLYPH: Record<string, string> = {
  // Cyrillic
  а: "a", в: "b", с: "c", ԁ: "d", е: "e", ѕ: "s", і: "i", ј: "j", к: "k",
  м: "m", н: "h", о: "o", р: "p", т: "t", у: "y", х: "x", ѵ: "v", ԝ: "w",
  ё: "e", ұ: "y", ү: "y", ө: "o", ә: "a", қ: "k", ғ: "g", ң: "h", һ: "h",
  // Greek
  α: "a", β: "b", γ: "y", ε: "e", ζ: "z", η: "n", ι: "i", κ: "k", μ: "m",
  ν: "v", ο: "o", ρ: "p", τ: "t", υ: "u", χ: "x", ϲ: "c",
  // Latin lookalikes and typography
  ı: "i", ȷ: "j", ł: "l", ø: "o", "’": "'", "‘": "'", "“": '"', "”": '"',
  "–": "-", "—": "-", "‑": "-",
};

/** Leetspeak, folded only in the Latin view. `0` in Kazakh prose is a digit. */
const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b",
  "@": "a", $: "s", "!": "i", "|": "l",
};

export interface TextViews {
  /** NFKC, lowercased, invisibles stripped. Cyrillic intact — RU/KK patterns live here. */
  readonly raw: string;
  /** `raw` with homoglyphs and leetspeak folded toward Latin. EN patterns live here. */
  readonly latin: string;
  /** `raw` with every non-alphanumeric removed. Defeats `i g n o r e` and `i-g-n-o-r-e`. */
  readonly dense: string;
  /** `latin`, densified. Defeats `1 g n 0 r e` written with a Cyrillic `е`. */
  readonly latinDense: string;
  /** Base64 payloads and reversed text, decoded and appended. Empty when there are none. */
  readonly decoded: string;
  /** Every view, for a pattern that does not care which one it hits. */
  readonly all: readonly string[];
}

function fold(text: string, table: Record<string, string>): string {
  let out = "";
  for (const ch of text) out += table[ch] ?? ch;
  return out;
}

const densify = (s: string): string => s.replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * Base64 that decodes to text, and whole-message reversal.
 *
 * A run has to be long enough to be deliberate AND decode to mostly-printable
 * characters, or every hex digest and every long identifier in a learner's
 * paste would decode to noise and then be scanned as if it were prose.
 *
 * Only whole-message reversal is checked, and only when the reversal contains a
 * word worth reversing. Reversing every substring would be a quadratic scan of
 * a 2 000-character field on every request, for an attack nobody has ever run
 * twice.
 */
function decodePayloads(text: string): string {
  const found: string[] = [];

  for (const match of text.matchAll(/[a-z0-9+/]{20,}={0,2}/gi)) {
    const candidate = match[0];
    if (candidate.length % 4 !== 0 && !candidate.includes("=")) continue;
    try {
      const decoded = Buffer.from(candidate, "base64").toString("utf8");
      if (decoded.length < 8) continue;
      const printable = [...decoded].filter((c) => /[\p{L}\p{N}\s.,!?'"-]/u.test(c)).length;
      if (printable / decoded.length > 0.85) found.push(decoded.toLowerCase());
    } catch {
      /* Not base64 after all. */
    }
  }

  const reversed = [...text].reverse().join("").toLowerCase();
  if (/instructions|prompt|system|нұсқау|инструкц|ереже/.test(reversed)) found.push(reversed);

  return found.join("\n");
}

export function viewsOf(input: string): TextViews {
  /* Case is stripped AFTER the payload scan, never before. Base64 is
     case-sensitive, so lowercasing first turns every encoded jailbreak into
     undecodable noise and the decoded view silently becomes dead code — which
     is exactly the kind of defence that passes its own tests and fails in
     production. */
  const cleaned = input.normalize("NFKC").replace(INVISIBLE, "");
  const decoded = decodePayloads(cleaned);

  const raw = cleaned
    .toLowerCase()
    .normalize("NFD")
    .replace(LATIN_WITH_MARKS, "$1")
    .normalize("NFC");

  const latin = fold(fold(raw, HOMOGLYPH), LEET);
  const dense = densify(raw);
  const latinDense = densify(latin);

  return {
    raw,
    latin,
    dense,
    latinDense,
    decoded,
    all: decoded
      ? [raw, latin, dense, latinDense, decoded]
      : [raw, latin, dense, latinDense],
  };
}

/** True when any pattern matches any of the supplied views. */
export function matchesAny(views: readonly string[], patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => views.some((v) => p.test(v)));
}
