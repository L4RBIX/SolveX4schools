import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const Module = require("node:module") as { _load: (r: string, p: unknown, m: boolean) => unknown };
const load = Module._load;
Module._load = function patched(r: string, p: unknown, m: boolean) {
  if (r === "server-only") return {};
  return load.call(this, r, p, m);
};

/**
 * What Nova actually says, on the chosen configuration, for the record.
 *
 * The benchmark scores; this quotes. A table of ratios is the right artefact
 * for choosing a temperature and the wrong one for answering "does this sound
 * like a person", which a reader has to judge by reading. Prints the linter's
 * verdict beside each reply so a disagreement between the two is visible rather
 * than averaged away.
 */
const IDS = (process.env.CASES ?? "ru-01,ru-06,ru-08,ru-17,ru-19,kk-01,kk-06,kk-08,kk-17,kk-19").split(",");

async function main() {
  const { buildNovaMessages } = await import("../../schools/nova/prompt");
  const { lintVoice } = await import("../../schools/nova/voice-linter");
  const { VOICE_CASES } = await import("../../tests/nova/fixtures/voice-cases");
  const { contextFor } = await import("./nova-bench-context");

  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  const base = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";

  for (const c of VOICE_CASES.filter((x) => IDS.includes(x.id))) {
    const messages = buildNovaMessages(
      {
        locale: c.locale,
        monthTitle: c.locale === "kk" ? "Қыркүйек" : "Сентябрь",
        lessonTitle: c.locale === "kk" ? "Алғашқы қадамдар" : "Первые шаги",
        blockPrompt: c.prompt,
        blockCode: c.code,
        skills: [],
        directive: null,
        grant: {
          requested: c.level, granted: c.level, capped: false,
          reason: "granted_as_requested", explanation: null,
          mayIncludeCode: c.level >= 3, mustNotSay: [],
        },
        context: contextFor(c) as never,
      },
      c.asked,
      c.history ?? [],
    );

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, max_tokens: 300, temperature: 0.4, thinking: { type: "disabled" } }),
    });
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = (json.choices?.[0]?.message?.content ?? "").trim();

    const prior = [...(c.history ?? [])].reverse().find((h) => h.role === "assistant")?.text;
    const findings = lintVoice(text, { locale: c.locale, prompt: c.prompt, priorQuestion: prior });
    const leaked = c.forbidden?.filter((f) => text.toLowerCase().includes(f.toLowerCase())) ?? [];

    console.log(`\n### ${c.id} · ${c.scenario} · L${c.level}`);
    if (c.code) console.log(`code:   ${c.code.replace(/\n/g, " ⏎ ")}`);
    if (c.picked) console.log(`picked: ${c.picked}`);
    if (c.stderr) console.log(`stderr: ${c.stderr}`);
    console.log(`asked:  ${c.asked}`);
    console.log(`NOVA:   ${text.replace(/\n/g, "\n        ")}`);
    console.log(`lint:   ${findings.length ? findings.map((f) => f.code).join(", ") : "clean"}${leaked.length ? `  LEAK: ${leaked.join(",")}` : ""}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
