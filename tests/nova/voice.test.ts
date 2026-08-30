import { describe, it, expect } from "vitest";
import { lintVoice, voiceReport } from "@schools/nova/voice-linter";
import { voiceContract, TIRED_OPENER_LIST } from "@schools/nova/voice";
import { RU_CASES, KK_CASES, VOICE_CASES } from "./fixtures/voice-cases";

/**
 * The voice, checked the two ways it can be checked without a model.
 *
 * The linter is checked against text whose verdict is known, so a detector that
 * quietly stops detecting is caught. The contract is checked for the things it
 * must always say, so a later edit cannot drop the length cap or the ban on
 * invented memories and leave a test suite that still passes.
 *
 * What is deliberately NOT here: any assertion about what DeepSeek actually
 * writes. That needs the provider, costs money, and lives in the live benchmark.
 */

describe("the linter catches the tells it exists for", () => {
  it("flags the opener that had become a template", () => {
    const f = lintVoice("Начнём с вопроса. Что здесь происходит?", { locale: "ru" });
    expect(f.map((x) => x.code)).toContain("tired_opener");
  });

  it("flags praise attached to the front of an answer", () => {
    const f = lintVoice("Отлично! Внутри кавычек стоит текст.", { locale: "ru" });
    expect(f.map((x) => x.code)).toContain("praise");
  });

  it("flags narrating the move instead of making it", () => {
    const f = lintVoice("Давай разберёмся вместе.", { locale: "ru" });
    expect(f.map((x) => x.code)).toContain("process_narration");
  });

  it("flags claiming it cannot see what the platform is holding", () => {
    /* The exact sentence from the screenshots that started this work. */
    const f = lintVoice(
      "Я вижу, что ответ не засчитан, но пока не понимаю, почему. Что ты ожидал?",
      { locale: "ru" },
    );
    expect(f.map((x) => x.code)).toContain("claims_blindness");
  });

  it("flags the stock closing question", () => {
    const f = lintVoice("Кавычки важны. Что ты попробуешь дальше?", { locale: "ru" });
    expect(f.map((x) => x.code)).toContain("stock_closer");
  });

  it("flags two questions in one short reply", () => {
    const f = lintVoice("Что внутри кавычек? И что делает print?", { locale: "ru" });
    expect(f.map((x) => x.code)).toContain("multiple_questions");
  });

  it("flags a reply that reads the task back", () => {
    const prompt = "Прочитай число и выведи его вдвое больше значения";
    const f = lintVoice(
      "Задание просит прочитай число и выведи его вдвое больше значения, поэтому смотри на input.",
      { locale: "ru", prompt },
    );
    expect(f.map((x) => x.code)).toContain("restates_task");
  });

  it("does NOT flag a short grounded reply that names the code", () => {
    /* The shape the contract is asking for. If this ever trips, the linter has
       started punishing the thing it exists to encourage. */
    const f = lintVoice(
      'Внутри кавычек в `print("2 + 2")` стоит текст. Что Python делает с текстом в кавычках?',
      { locale: "ru", prompt: "Что выведет эта программа?" },
    );
    expect(f, JSON.stringify(f)).toHaveLength(0);
  });

  it("does NOT flag the Kazakh equivalent", () => {
    const f = lintVoice(
      '`print("2 + 2")` ішіндегі тырнақшаға қара. Тырнақша ішіндегі мәтінмен Python не істейді?',
      { locale: "kk", prompt: "Бұл бағдарлама экранға нені шығарады?" },
    );
    expect(f, JSON.stringify(f)).toHaveLength(0);
  });

  it("flags the same question asked again in new words", () => {
    /* The learner has already answered this. Asking it again with different
       nouns is the conversation walking in place, and it is invisible one reply
       at a time — which is why it needs a check rather than a reviewer. */
    const f = lintVoice("А что находится внутри этих кавычек в строке?", {
      locale: "ru",
      priorQuestion: "Что именно находится внутри кавычек?",
    });
    expect(f.map((x) => x.code)).toContain("repeats_prior_question");
  });

  it("does NOT flag a question that moves to the next idea", () => {
    const f = lintVoice("Тогда сами кавычки появятся на экране или только текст между ними?", {
      locale: "ru",
      priorQuestion: "Что именно находится внутри кавычек?",
    });
    expect(f.map((x) => x.code)).not.toContain("repeats_prior_question");
  });

  it("does not flag forward movement in Kazakh either", () => {
    const f = lintVoice("Онда тырнақшаның өзі экранға шыға ма?", {
      locale: "kk",
      priorQuestion: "Тырнақша ішінде не тұр?",
    });
    expect(f.map((x) => x.code)).not.toContain("repeats_prior_question");
  });

  it("counts a batch rather than a single reply", () => {
    const r = voiceReport([
      { reply: "Начнём с вопроса.", locale: "ru" },
      { reply: "Внутри кавычек текст.", locale: "ru" },
    ]);
    expect(r.total).toBe(2);
    expect(r.rate).toBeCloseTo(0.5);
    expect(r.byCode.tired_opener).toBe(1);
  });
});

describe("the contract says the things it must not stop saying", () => {
  for (const locale of ["ru", "kk"] as const) {
    it(`${locale}: caps the length, the moves and the questions`, () => {
      const text = voiceContract(locale).join("\n");
      expect(text).toMatch(/1-3 short sentences/);
      expect(text).toMatch(/One teaching move/);
      expect(text).toMatch(/at most one question/i);
    });

    it(`${locale}: forbids invented humanity`, () => {
      const text = voiceContract(locale).join("\n").toLowerCase();
      expect(text).toContain("never invent a memory");
    });

    it(`${locale}: keeps policy above voice`, () => {
      /* The ordering that makes this safe to ship. If a future edit drops this
         sentence, a model that has been told to be brief has also been told
         nothing about what wins when brevity and the hint ceiling disagree. */
      expect(voiceContract(locale).join("\n")).toMatch(/policy above wins/i);
    });

    it(`${locale}: demands forward movement`, () => {
      expect(voiceContract(locale).join("\n")).toMatch(/build on it|Never re-ask/i);
    });

    it(`${locale}: names its own locale and refuses the other`, () => {
      const text = voiceContract(locale).join("\n");
      expect(text).toContain(locale === "kk" ? "Kazakh only" : "Russian only");
    });

    it(`${locale}: lists tired openers in that language only`, () => {
      const listed = TIRED_OPENER_LIST[locale].join(" ");
      const other = locale === "kk" ? "ru" : "kk";
      /* Cyrillic is shared, so this checks a token that only one list has. */
      const marker = locale === "kk" ? "Жақсы сұрақ!" : "Хороший вопрос!";
      expect(listed).toContain(marker);
      expect(TIRED_OPENER_LIST[other].join(" ")).not.toContain(marker);
    });
  }
});

describe("the fixture set covers what it claims to", () => {
  it("has 25 in each language", () => {
    expect(RU_CASES).toHaveLength(25);
    expect(KK_CASES).toHaveLength(25);
  });

  it("covers all thirteen situations in both languages", () => {
    const wanted = [
      "wrong_mcq", "wrong_prediction", "syntax_error", "runtime_error",
      "string_int_confusion", "condition_boundary", "successful_correction",
      "stuck", "productive_struggle", "assistance_dependent", "strong_learner",
      "assessment", "no_attempt_since_hint",
    ] as const;
    for (const locale of ["ru", "kk"] as const) {
      const seen = new Set(VOICE_CASES.filter((c) => c.locale === locale).map((c) => c.scenario));
      for (const s of wanted) expect(seen, `${locale} is missing ${s}`).toContain(s);
    }
  });

  it("pairs every low-level assistance-dependent case with forbidden solution text", () => {
    /* The cases that exist to prove humanisation did not loosen the ladder are
       worthless if they forgot to say what must not appear. */
    const risky = VOICE_CASES.filter(
      (c) => c.scenario === "assistance_dependent" || c.scenario === "assessment",
    );
    expect(risky.length).toBeGreaterThan(0);
    for (const c of risky) {
      expect(c.forbidden, `${c.id} has no forbidden list`).toBeTruthy();
      expect(c.forbidden!.length, `${c.id} forbids nothing`).toBeGreaterThan(0);
    }
  });

  it("does not pin expected prose anywhere", () => {
    /* A fixture with an `expected` reply is a snapshot wearing a fixture's
       clothes, and it will be updated to whatever the model said. */
    const raw = JSON.stringify(VOICE_CASES);
    expect(raw).not.toMatch(/"expected(Reply|Text)"/);
  });
});
