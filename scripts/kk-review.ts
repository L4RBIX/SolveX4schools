/**
 * A machine consistency review of the Kazakh in a month.
 *
 * ## What this is, and what it is emphatically not
 *
 * It is a lint. It finds the things a machine can be certain about — a missing
 * translation, a Russian function word left inside a Kazakh sentence, the same
 * C++ term rendered three different ways in three lessons, a quotation mark
 * from the wrong language — and it reports them with the block id.
 *
 * **It is not a native review.** It cannot judge whether a sentence is natural,
 * whether a case ending is right, or whether a fourteen-year-old in Almaty
 * would say it that way. Nothing in this repository may claim a native review
 * happened; a person has to do that, and the release report says so plainly.
 *
 *   npx tsx --conditions=react-server scripts/kk-review.ts [monthIndex]
 */
import { MONTHS } from "../schools/curriculum/months";

/** Russian words with no place in a Kazakh sentence. Function words only —
 *  loanwords like «компилятор» are legitimately shared. */
const RUSSIAN_MARKERS = [
  "это", "если", "который", "которая", "которое", "нужно", "чтобы", "просто",
  "значит", "например", "потому", "тогда", "здесь", "сначала", "затем",
  "всегда", "никогда", "число", "строка", "программа", "переменная", "ошибка",
  "ответ", "задача", "пример",
  /* NOT «компьютер» or «экран». Both are ordinary Kazakh — the month writes
     «компьютер жолдарды орындайды» and «экранға шығару», and a lint that flags
     a loanword the language actually uses is a lint people learn to ignore. */
];

/** One C++ idea, and the Kazakh the month should use for it. */
const TERMS: { ru: string; kk: string[] }[] = [
  { ru: "программа", kk: ["бағдарлама"] },
  { ru: "переменная", kk: ["айнымалы"] },
  { ru: "инструкция", kk: ["нұсқау"] },
  { ru: "компилятор", kk: ["компилятор"] },
  { ru: "остаток", kk: ["қалдық"] },
  { ru: "условие", kk: ["шарт"] },
  { ru: "вывод", kk: ["шығару"] },
  { ru: "ввод", kk: ["оқу", "енгізу"] },
  { ru: "строка", kk: ["жол", "мәтін"] },
  { ru: "число", kk: ["сан"] },
];

interface Finding {
  where: string;
  kind: string;
  detail: string;
}

function localizedPairs(id: string, value: unknown, out: [string, { kk: string; ru: string }][]): void {
  if (!value || typeof value !== "object") return;
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (v && typeof v === "object" && "kk" in v && "ru" in v) {
      const pair = v as { kk: unknown; ru: unknown };
      if (typeof pair.kk === "string" && typeof pair.ru === "string") {
        /* A program's OUTPUT is the same in both languages — `Сәлем!` is what
           the program prints, not a sentence somebody forgot to translate. */
        if (!["result", "output", "expectedOutput", "answer"].includes(key)) {
          out.push([`${id}.${key}`, { kk: pair.kk, ru: pair.ru }]);
        }
        continue;
      }
    }
    if (Array.isArray(v)) v.forEach((x, i) => localizedPairs(`${id}.${key}[${i}]`, x, out));
    else if (v && typeof v === "object") localizedPairs(`${id}.${key}`, v, out);
  }
}

function main(): void {
  const index = Number(process.argv[2] ?? 1);
  const month = MONTHS.find((m) => m.index === index);
  if (!month) throw new Error(`no month ${index}`);

  const pairs: [string, { kk: string; ru: string }][] = [];
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      localizedPairs(lesson.id, { title: lesson.title, objectives: lesson.objectives }, pairs);
      for (const block of lesson.blocks) localizedPairs(block.id, block, pairs);
    }
  }
  for (const block of month.assessment?.blocks ?? []) localizedPairs(month.assessment!.id, block, pairs);

  const findings: Finding[] = [];
  /* Which Kazakh word each idea is rendered with, and where. */
  const usage = new Map<string, Map<string, string[]>>();

  for (const [where, { kk, ru }] of pairs) {
    if (!kk.trim()) findings.push({ where, kind: "missing-kk", detail: "empty Kazakh" });
    if (!ru.trim()) findings.push({ where, kind: "missing-ru", detail: "empty Russian" });
    if (kk && kk === ru && /[а-яәғқңөұүһі]/i.test(kk)) {
      findings.push({ where, kind: "untranslated", detail: `identical in both: ${kk.slice(0, 60)}` });
    }

    /* Code spans are shared vocabulary — `cout`, `int`, `cin` — and are never
       translated, so they are removed before the prose is judged. */
    const prose = kk.replace(/`[^`]*`/g, " ").toLowerCase();
    for (const word of RUSSIAN_MARKERS) {
      if (new RegExp(`(^|[^а-яёәғқңөұүһі])${word}([^а-яёәғқңөұүһі]|$)`, "i").test(prose)) {
        findings.push({ where, kind: "russian-in-kk", detail: `«${word}» in the Kazakh text` });
      }
    }

    /* Quotation marks: the month uses «» in both languages. A straight double
       quote in prose is usually a paste from somewhere else. */
    if (/[^`]"[^"]*"/.test(kk.replace(/`[^`]*`/g, " "))) {
      findings.push({ where, kind: "quotes", detail: 'straight " in Kazakh prose' });
    }

    for (const term of TERMS) {
      if (!new RegExp(`(^|[^а-яё])${term.ru}`, "i").test(ru.toLowerCase())) continue;
      const used = term.kk.find((k) => kk.toLowerCase().includes(k));
      const bucket = usage.get(term.ru) ?? new Map<string, string[]>();
      const key = used ?? "(none of the expected words)";
      bucket.set(key, [...(bucket.get(key) ?? []), where]);
      usage.set(term.ru, bucket);
    }
  }

  console.log(`\nKazakh machine review — month ${index} (${month.title.ru})`);
  console.log(`${pairs.length} localized strings checked\n`);

  if (findings.length === 0) console.log("No mechanical issues found.");
  const byKind = new Map<string, Finding[]>();
  for (const f of findings) byKind.set(f.kind, [...(byKind.get(f.kind) ?? []), f]);
  for (const [kind, list] of byKind) {
    console.log(`${kind}: ${list.length}`);
    for (const f of list.slice(0, 8)) console.log(`   ${f.where}: ${f.detail}`);
    if (list.length > 8) console.log(`   … ${list.length - 8} more`);
  }

  console.log("\nTerminology, as actually used:");
  for (const [ru, bucket] of usage) {
    const variants = [...bucket.entries()].map(([kk, w]) => `${kk} (${w.length})`);
    const flag = bucket.size > 1 ? "  ← more than one rendering" : "";
    console.log(`  «${ru}» → ${variants.join(", ")}${flag}`);
    if (bucket.size > 1) {
      for (const [kk, wheres] of bucket) {
        if (kk === "(none of the expected words)") console.log(`      ${kk}: ${wheres.slice(0, 5).join(", ")}`);
      }
    }
  }

  console.log(
    "\nThis is a lint, not a native review. Naturalness, case endings and register " +
      "are not checked here and no document may claim they were.\n",
  );
}

main();
