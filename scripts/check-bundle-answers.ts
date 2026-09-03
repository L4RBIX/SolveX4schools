#!/usr/bin/env tsx
/**
 * Answer-key scan of the BUILT client bundle.
 *
 * Sibling of `check-client-bundle.mjs`, which looks for the values of
 * server-only *credentials*. This one looks for the thing a fourteen-year-old
 * actually wants: hidden test cases, reference solutions, fill-in answers and
 * the rest of the curriculum's private half.
 *
 * ## Why it exists
 *
 * `schools/curriculum/public.ts` strips every one of those fields out of the
 * props a page sends. It was doing that correctly. And the built bundle
 * contained all of it anyway — 2,351,507 bytes in one chunk, 255
 * `referenceSolution`, 1,735 `hidden:!0`, 2,166 `expectedOutput`, loaded by
 * `/home`, `/lesson/*`, `/course/*`, `/assessment/*`, `/program` and `/review`.
 * Two client components imported one pure helper each from
 * `schools/curriculum/inventory.ts`, and `inventory.ts` reads `PROGRAM`. A
 * value import is a value import; the bundler followed it and emitted the year.
 *
 * The lesson is the one this file is built around: **a trust boundary enforced
 * only in the layer that formats a response is not enforced.** The projection
 * is right and it is not enough, because the thing it protects can arrive by a
 * route that never passes through it.
 *
 * So the boundary is now stated three times, in three different currencies:
 *
 *   1. `import "server-only"` in `program.ts` and `inventory.ts` — a build
 *      error the moment a client component reaches for the curriculum again.
 *   2. `schools/curriculum/shape.ts` — the pure helpers a browser legitimately
 *      needs, with nothing behind them.
 *   3. This file — reads the emitted bytes and does not care how they got there.
 *
 * ## Why it cannot quietly pass
 *
 * The predecessor gate was green for the whole life of the repository while
 * searching for nothing, because "I could not check" and "I checked and it was
 * clean" printed the same tick. Three rules follow from that, and each is
 * enforced below rather than described:
 *
 *   - **Absent output is a failure, not a skip.** No `.next/static`, or a
 *     `.next/static` with no JavaScript in it, exits non-zero everywhere. The
 *     build runs three steps earlier in `npm run check` and in CI.
 *   - **Coverage is asserted against the manifests.** Every chunk the build
 *     tells the browser to load must be among the files this scan opened. A
 *     walk that silently missed a directory fails here.
 *   - **The detectors are proved on a positive control before use.** A
 *     synthetic chunk carrying every pattern and a real secret is scanned
 *     first, and every detector must fire on it. A regex somebody breaks while
 *     tidying stops the run instead of passing everything.
 *
 * Run: `npm run check:answers` (after `npm run build`).
 */
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { PROGRAM } from "@schools/curriculum/program";
import { secretStringsOf } from "@schools/curriculum/public";
import type { LessonBlock } from "@schools/curriculum/types";

const STATIC_DIR = path.join(".next", "static");
/**
 * Prerendered output — the second half of "what a browser receives".
 *
 * A statically prerendered page ships its RSC payload as a `.rsc` file and its
 * markup as `.html`, and both are served to anyone who asks. `public.ts` is
 * what keeps the answer key out of those props, and this is the check that the
 * projection was actually used: a page that passed an authored `Lesson` instead
 * of a `PublicLesson` would leak here even with a perfectly clean JS bundle.
 */
const PRERENDER_EXTS = [".html", ".rsc", ".body"];
const SERVER_APP_DIR = path.join(".next", "server", "app");
const BUILD_MANIFEST = path.join(".next", "build-manifest.json");

/* -------------------------------------------------------------------------- */
/* 1. Field-name detectors                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Property names, not values.
 *
 * Minifiers rename identifiers; they do not rename the keys of an object
 * literal, because something might read them by name. That is why the leak was
 * legible as `referenceSolution` in a chunk whose every variable was a letter,
 * and it is why a field-name search is the cheap, reliable detector for
 * "somebody imported the curriculum".
 *
 * Each pattern matches the OBJECT-LITERAL KEY form (`expectedOutput:`), not the
 * bare name. A client component that renders a visible sample case legitimately
 * contains `e.expectedOutput` — data flowing out of `public.ts`, which is what
 * that projection is for — and a detector that fired on it would be noise a
 * reviewer learns to wave through. Data carries keys; rendering carries dots.
 * A leak that somehow carried neither is caught by the VALUE detectors below.
 *
 * Each entry carries the control string it must match. `main()` refuses to
 * scan anything until every one of them has fired on its own control.
 */
const FIELD_DETECTORS: { name: string; pattern: RegExp; control: string }[] = [
  {
    name: "referenceSolution",
    pattern: /(?<![.\w$])referenceSolution\s*:/,
    control: `{referenceSolution:"int main(){}"}`,
  },
  {
    /* `hidden:!0` is how `hidden: true` survives minification; the unminified
       and JSON forms are here so a change of bundler does not silently retire
       the detector. The lookbehind excludes `-`, because `aria-hidden:!0` is
       ordinary JSX and matching it would train everyone to ignore this gate. */
    name: "hidden case flag",
    pattern: /(?<![-.\w$])hidden\s*:\s*(?:!0|true)(?![\w$])/,
    control: `{input:"1",expectedOutput:"2",hidden:!0}`,
  },
  {
    name: "expectedOutput",
    pattern: /(?<![.\w$])expectedOutput\s*:/,
    control: `[{input:"5 7 5",expectedOutput:"7"}]`,
  },
  {
    name: "breakingInputs",
    pattern: /(?<![.\w$])breakingInputs\s*:/,
    control: `{breakingInputs:["0"]}`,
  },
  {
    name: "fixedCode",
    pattern: /(?<![.\w$])fixedCode\s*:/,
    control: `{fixedCode:"int main(){return 0;}"}`,
  },
  {
    name: "diagnosticMapping",
    pattern: /(?<![.\w$])diagnosticMapping\s*:/,
    control: `{diagnosticMapping:{a:{cause:"x",justification:"y"}}}`,
  },
];
/* -------------------------------------------------------------------------- */
/* 2. Value detectors — the curriculum's own secrets                           */
/* -------------------------------------------------------------------------- */

/**
 * The literal strings a leak would consist of.
 *
 * Field names catch a wholesale import. Values catch the subtler shape: a
 * component that inlines one lesson's answers, a generated constant, a fixture
 * that escaped into `src/`. `secretStringsOf` is the same collector
 * `payload-privacy` uses on server payloads, so the two gates cannot disagree
 * about what counts as a secret.
 *
 * Two forms are searched for every secret, because a multi-line
 * `referenceSolution` never appears verbatim in a chunk — it appears as a
 * JavaScript string literal with its newlines escaped:
 *
 *   raw       `#include <iostream>\nint main() {`   (a real newline)
 *   escaped   `#include <iostream>\\nint main() {`  (backslash, n)
 */
function collectSecrets(): { value: string; where: string }[] {
  const out: { value: string; where: string }[] = [];
  const seen = new Set<string>();
  const push = (value: string, where: string) => {
    /* Long enough to be distinctive. `secretStringsOf` applies its own floor
       for a page payload; a 5 MB bundle of minified JavaScript is a much
       noisier haystack, so this one is stricter. Short answers ("7", "yes")
       are covered by the field-name detectors above, which is where a leak of
       them would show up anyway. */
    if (value.length < 24) return;
    if (seen.has(value)) return;
    seen.add(value);
    out.push({ value, where });
  };
  for (const month of PROGRAM.months) {
    const blocks: { block: LessonBlock; where: string }[] = [];
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) blocks.push({ block, where: `${lesson.id}/${block.id}` });
      }
    }
    if (month.assessment) {
      for (const block of month.assessment.blocks) {
        blocks.push({ block, where: `${month.assessment.id}/${block.id}` });
      }
    }
    for (const { block, where } of blocks) {
      for (const secret of secretStringsOf(block)) push(secret, where);
    }
  }
  return out;
}

/** The two spellings one secret can take in emitted JavaScript. */
function needlesFor(value: string): string[] {
  const escaped = JSON.stringify(value).slice(1, -1);
  return escaped === value ? [value] : [value, escaped];
}

/* -------------------------------------------------------------------------- */
/* 3. Coverage — what the build says the browser will load                     */
/* -------------------------------------------------------------------------- */

/** Every file under `dir`, whatever its extension. */
async function walkAll(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkAll(p)));
    else out.push(p);
  }
  return out;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (p.endsWith(".js") || p.endsWith(".css")) out.push(p);
  }
  return out;
}

/**
 * Every `static/**.js` the build tells a browser to fetch.
 *
 * Read from the manifests rather than from the directory, so that the two can
 * be compared. A directory walk alone answers "what did I open"; only the
 * manifest answers "what will a learner actually download", and the gap between
 * those two questions is where a scan quietly stops covering something.
 */
async function referencedChunks(): Promise<Set<string>> {
  const refs = new Set<string>();
  const add = (rel: string) => refs.add(path.normalize(path.join(".next", rel)));

  if (existsSync(BUILD_MANIFEST)) {
    const m = JSON.parse(await readFile(BUILD_MANIFEST, "utf8")) as Record<string, unknown>;
    const lists = [m.rootMainFiles, m.polyfillFiles, m.lowPriorityFiles, ...Object.values((m.pages ?? {}) as Record<string, unknown>)];
    for (const list of lists) {
      if (Array.isArray(list)) for (const f of list) if (typeof f === "string") add(f);
    }
  }

  /* The per-page RSC manifests. These are the ones that named the offending
     chunk on six learner routes, so they are the authoritative list of what a
     signed-in student's browser is told to load. */
  if (existsSync(SERVER_APP_DIR)) {
    for (const file of await walk(SERVER_APP_DIR)) {
      if (!file.endsWith("_client-reference-manifest.js")) continue;
      const text = await readFile(file, "utf8");
      for (const match of text.matchAll(/static\/chunks\/[A-Za-z0-9_.\-/]+\.js/g)) add(match[0]);
    }
  }
  return refs;
}

/* -------------------------------------------------------------------------- */
/* 4. The scan                                                                 */
/* -------------------------------------------------------------------------- */

interface Finding {
  detector: string;
  file: string;
  detail: string;
}

function scanText(text: string, file: string, secrets: { value: string; where: string }[]): Finding[] {
  const found: Finding[] = [];
  for (const d of FIELD_DETECTORS) {
    if (d.pattern.test(text)) {
      const count = text.match(new RegExp(d.pattern.source, "g"))?.length ?? 1;
      found.push({ detector: d.name, file, detail: `${count} occurrence(s)` });
    }
  }
  for (const secret of secrets) {
    for (const needle of needlesFor(secret.value)) {
      if (text.includes(needle)) {
        found.push({
          detector: "curriculum secret VALUE",
          file,
          /* The secret itself is never printed. Its origin is what an engineer
             needs to find the import; the string is what a learner wanted. */
          detail: `a withheld string from ${secret.where} (${secret.value.length} chars)`,
        });
        break;
      }
    }
  }
  return found;
}

async function main(): Promise<void> {
  const fail = (msg: string): never => {
    console.error(`[answer-key-scan] ✗ ${msg}`);
    process.exit(1);
  };

  /* --- Self-test. Nothing is trusted until it has caught something. -------- */
  const secrets = collectSecrets();
  if (secrets.length === 0) {
    fail(
      "collected zero curriculum secrets. `secretStringsOf` or `PROGRAM` returned nothing, " +
        "so a value search would pass on any bundle. This scan refuses to run blind.",
    );
  }
  const control = [
    "// synthetic positive control — never shipped",
    ...FIELD_DETECTORS.map((d) => d.control),
    JSON.stringify(secrets[0]!.value),
  ].join("\n");
  const controlFindings = scanText(control, "<positive-control>", [secrets[0]!]);
  const firedOn = new Set(controlFindings.map((f) => f.detector));
  const dead = FIELD_DETECTORS.filter((d) => !firedOn.has(d.name)).map((d) => d.name);
  if (dead.length > 0) {
    fail(`these detectors did not match their own control and would never fire: ${dead.join(", ")}`);
  }
  if (!firedOn.has("curriculum secret VALUE")) {
    fail("the value detector did not find a real secret in its own control — the escaping is wrong.");
  }

  /* --- The bundle must exist. ------------------------------------------- */
  if (!existsSync(STATIC_DIR)) {
    fail(
      `${STATIC_DIR} does not exist. Run \`npm run build\` first. ` +
        "This is a failure and not a skip on purpose: the predecessor of this gate " +
        "exited 0 on a missing directory and was green for months having read nothing.",
    );
  }
  const files = await walk(STATIC_DIR);
  if (files.length === 0) fail(`${STATIC_DIR} exists but holds no .js or .css — nothing was scanned.`);

  const prerendered = existsSync(SERVER_APP_DIR)
    ? (await walkAll(SERVER_APP_DIR)).filter((f) => PRERENDER_EXTS.some((e) => f.endsWith(e)))
    : [];
  if (prerendered.length === 0) {
    fail(
      `${SERVER_APP_DIR} yielded no prerendered .html/.rsc payloads. Either the build did not ` +
        "prerender anything, or this scan's file filter has drifted — both are failures, " +
        "because the alternative is a tick for a half that was never read.",
    );
  }

  /* --- Coverage against the manifests. ---------------------------------- */
  const opened = new Set(files.map((f) => path.normalize(f)));
  const referenced = await referencedChunks();
  const missed = [...referenced].filter((f) => !opened.has(f) && existsSync(f));
  if (missed.length > 0) {
    fail(
      `${missed.length} chunk(s) the build manifests tell a browser to load were not scanned: ` +
        `${missed.slice(0, 5).join(", ")}${missed.length > 5 ? " …" : ""}`,
    );
  }

  /* --- The scan itself. -------------------------------------------------- */
  const findings: Finding[] = [];
  let bytes = 0;
  for (const file of [...files, ...prerendered]) {
    const text = await readFile(file, "utf8");
    bytes += text.length;
    findings.push(...scanText(text, file, secrets));
  }

  console.log(
    `[answer-key-scan] scanned ${files.length} built client files and ${prerendered.length} ` +
      `prerendered payloads (${(bytes / 1_048_576).toFixed(2)} MB) against ` +
      `${FIELD_DETECTORS.length} field detectors and ${secrets.length} withheld curriculum ` +
      `strings; ${referenced.size} manifest-referenced chunks all covered.`,
  );

  if (findings.length > 0) {
    const byFile = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = byFile.get(f.file) ?? [];
      list.push(f);
      byFile.set(f.file, list);
    }
    for (const [file, list] of byFile) {
      console.error(`[answer-key-scan] ✗ ${file}`);
      for (const f of list) console.error(`[answer-key-scan]     ${f.detector}: ${f.detail}`);
    }
    console.error(
      "[answer-key-scan] The curriculum's private half is in the client bundle. " +
        "Find the import: a client component (or something one imports) is pulling a VALUE " +
        "from `schools/curriculum/program`, `inventory`, `months`, or a month file. " +
        "The browser-safe half is `schools/curriculum/shape.ts`; page props go through " +
        "`schools/curriculum/public.ts`.",
    );
    process.exit(1);
  }

  console.log("[answer-key-scan] ✓ no hidden cases, reference solutions or withheld answers in the client bundle");
}

void main().catch((error: unknown) => {
  console.error("[answer-key-scan] ✗ the scan itself failed:", error);
  process.exit(1);
});
