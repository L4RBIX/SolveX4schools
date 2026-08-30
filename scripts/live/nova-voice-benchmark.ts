import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Module = require("node:module") as { _load: (r: string, p: unknown, m: boolean) => unknown };
const load = Module._load;
Module._load = function patched(r: string, p: unknown, m: boolean) {
  if (r === "server-only") return {};
  return load.call(this, r, p, m);
};

/**
 * What temperature actually buys, measured.
 *
 * ## Why this is a script and not a test
 *
 * It spends real money against the real provider, and the answer changes when
 * DeepSeek changes. A test that calls a paid endpoint is a test somebody
 * eventually skips; this runs when a human is deciding, and its output is
 * evidence for a number that then gets written down.
 *
 * ## What is measured
 *
 * Only what can be measured deterministically. `grounding` is whether the reply
 * engages the thing on screen — the fixture says which words a real answer to
 * THIS task reaches for. `leak` is whether it produced text the hint level
 * forbids, and it is the one score that is not a trade-off: a configuration
 * that leaks is disqualified however well it reads. `voice` is the linter.
 * `locale` is alphabet purity, which is the cheapest real proxy for "did it
 * answer in the language we asked for" — Kazakh has nine letters Russian does
 * not, so a Kazakh reply with none of them is a Russian reply.
 *
 * Naturalness is NOT scored by another model. A judge model rating prose it is
 * related to produces a number that looks like evidence and is not.
 */

const TEMPERATURES = [0.4, 0.7, 0.9, 1.1, 1.3];

/**
 * The context the route would have built, without a database.
 *
 * `buildNovaContext` reads the ledger, and a benchmark does not have one. The
 * shape is the same object it returns, filled from the fixture — which is the
 * point: without it the prompt carries the task but not the learner's SCREEN,
 * so the model cannot mention the option they picked and "grounding" measures
 * a handicap this script invented rather than anything about temperature.
 */
function contextFor(c: {
  locale: "ru" | "kk"; prompt: string; code?: string; picked?: string; stderr?: string; level: number;
}): unknown {
  return {
    learner: { subjectId: "bench", locale: c.locale },
    curriculum: {
      monthTitle: c.locale === "kk" ? "Қыркүйек" : "Сентябрь",
      lessonTitle: c.locale === "kk" ? "Алғашқы қадамдар" : "Первые шаги",
      blockId: "bench.b1",
      blockType: c.picked ? "prediction" : "write_code",
      prompt: c.prompt,
      skillIds: [],
      capability: null,
      mode: "lesson",
    },
    interaction: {
      visible: {
        code: c.code,
        options: c.picked ? [{ id: c.picked, text: c.picked }] : undefined,
      },
      settled: {
        verdict: c.picked ? "incorrect" : c.stderr ? "incorrect" : "unchecked",
        attemptCount: c.picked || c.stderr ? 1 : 0,
        deliveredHintLevel: -1,
        attemptSinceLastHelp: true,
        stderr: c.stderr || undefined,
      },
      draft: c.picked
        ? { selectedOptionId: c.picked }
        : c.code
          ? { code: c.code }
          : undefined,
    },
    intelligence: { relevantSkills: [], recentEvidence: [], action: null, directive: null, directiveNote: null },
    assistance: {
      grant: {
        requested: c.level, granted: c.level, capped: false,
        reason: "granted_as_requested", explanation: null,
        mayIncludeCode: c.level >= 3, mustNotSay: [],
      },
      assessmentCapped: false,
    },
  };
}



/** Letters Kazakh has and Russian does not. */
const KK_ONLY = /[әғқңөұүһі]/i;

async function main() {
  const { buildNovaMessages } = await import("../../schools/nova/prompt");
  const { lintVoice } = await import("../../schools/nova/voice-linter");
  const { VOICE_CASES } = await import("../../tests/nova/fixtures/voice-cases");

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

  /* A representative slice rather than all fifty: five temperatures times fifty
     cases is 250 paid calls to answer a question ten cases already answer. One
     per language for each of the situations where voice and policy actually
     pull against each other. */
  const WANTED = ["ru-01", "ru-06", "ru-08", "ru-17", "ru-19", "kk-01", "kk-06", "kk-08", "kk-17", "kk-19"];
  const cases = VOICE_CASES.filter((c) => WANTED.includes(c.id));

  const rows: Record<string, unknown>[] = [];

  for (const t of TEMPERATURES) {
    let grounded = 0, leaked = 0, voiceClean = 0, localePure = 0, sentences = 0, ms = 0;
    const openers = new Map<string, number>();

    for (const c of cases) {
      const messages = buildNovaMessages(
        {
          locale: c.locale,
          monthTitle: c.locale === "kk" ? "Қыркүйек" : "Сентябрь",
          lessonTitle: c.locale === "kk" ? "Алғашқы қадамдар" : "Первые шаги",
          blockPrompt: c.prompt,
          blockCode: c.code,
          skills: [],
          directive: null,
          /* The learner's screen, exactly as production sends it. */
          context: contextFor(c) as never,
          grant: {
            requested: c.level, granted: c.level, capped: false,
            reason: "granted_as_requested", explanation: null,
            /* Code only from rung 3. This is the ladder, not a benchmark knob. */
            mayIncludeCode: c.level >= 3, mustNotSay: [],
          },
        },
        c.asked,
        c.history ?? [],
      );

      const started = Date.now();
      let text = "";
      try {
        const res = await fetch(`${base}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model, messages, max_tokens: 300, temperature: t,
            thinking: { type: "disabled" },
          }),
        });
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        text = json.choices?.[0]?.message?.content ?? "";
      } catch {
        text = "";
      }
      ms += Date.now() - started;

      const lower = text.toLowerCase();
      if (c.grounding.some((g) => lower.includes(g.toLowerCase()))) grounded += 1;
      if (c.forbidden?.some((f) => lower.includes(f.toLowerCase()))) leaked += 1;

      const findings = lintVoice(text, { locale: c.locale, prompt: c.prompt });
      if (findings.length === 0) voiceClean += 1;
      sentences += text.split(/(?<=[.!?…])\s+/).filter((s) => s.trim()).length;

      const hasKk = KK_ONLY.test(text);
      if (c.locale === "kk" ? hasKk : !hasKk) localePure += 1;

      const head = text.trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase();
      if (head) openers.set(head, (openers.get(head) ?? 0) + 1);
    }

    const n = cases.length;
    /* How often the batch opened the same way. 1.0 means every reply began
       with the same three words, which is the failure this whole phase is
       about and is invisible one reply at a time. */
    const repeat = Math.max(...openers.values(), 0) / n;

    rows.push({
      temp: t,
      grounded: `${grounded}/${n}`,
      leaked,
      voiceClean: `${voiceClean}/${n}`,
      localePure: `${localePure}/${n}`,
      avgSentences: (sentences / n).toFixed(1),
      openerRepeat: repeat.toFixed(2),
      avgMs: Math.round(ms / n),
    });
    console.log(JSON.stringify(rows[rows.length - 1]));
  }

  console.log("\n=== SUMMARY ===");
  console.table(rows);
}

main().catch((e) => { console.error(e); process.exit(1); });
