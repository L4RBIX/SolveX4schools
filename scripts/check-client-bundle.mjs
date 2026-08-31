#!/usr/bin/env node
/**
 * Client-bundle secret scan.
 *
 * Greps the built client chunks for the VALUES of server-only secrets, not
 * their names. The distinction matters: `DEEPSEEK_API_KEY` appears legitimately
 * in the dev labs — once as the Python that proves the sandbox environment is
 * scrubbed, once as a jailbreak prompt Nova must refuse. Failing on the name
 * would train everyone to ignore this check.
 *
 * What must never appear is a value.
 */
import { readdir, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const DIR = ".next/static";
const NAMES = [
  "DEEPSEEK_API_KEY",
  /* The judge's credential. It was missing from this list while
     `EXEC_PROVIDER=judge0_rapidapi` was the configured production provider, so
     the one secret that had most recently been added to the deployment was the
     one secret this scan did not look for. */
  "JUDGE0_RAPIDAPI_KEY",
  "LEARNING_ATTESTATION_SECRET",
  "LEARNING_CRON_SECRET",
  "DATABASE_URL",
];

/**
 * Read `.env.local` and `.env`, the way the app already does.
 *
 * ## Why this is here
 *
 * This scan compares built chunks against the VALUES of secrets, and it reads
 * those values from `process.env`. It is a bare `node` script, so — unlike
 * `next build` — nothing had loaded `.env.local` for it. The result was a gate
 * that could not fail: with no values to search for it printed "only the
 * hardcoded-key pattern was checked" and exited 0, and `npm run check` went
 * green having verified nothing about any real secret.
 *
 * `scripts/live/env-file.ts` solved exactly this for the Judge0 validator and
 * documents the precedence; this is its twin, kept separate only because that
 * one is TypeScript and this runs under plain node.
 *
 * A real environment variable always wins, and `.env.local` beats `.env`.
 */
function loadEnvFiles(files = [".env.local", ".env"]) {
  for (const file of files) {
    let raw;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      continue; // Absent is the normal case for at least one of them.
    }
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const name = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue;
      if (process.env[name] !== undefined) continue; // set by the shell or CI
      let value = trimmed.slice(eq + 1).trim();
      if (value.length >= 2 && (value.startsWith('"') || value.startsWith("'"))) {
        const quote = value[0];
        if (value.endsWith(quote)) value = value.slice(1, -1);
      }
      if (value === "") continue;
      process.env[name] = value;
    }
  }
}

loadEnvFiles();

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (p.endsWith(".js") || p.endsWith(".css")) yield p;
  }
}

const values = NAMES.map((n) => [n, process.env[n]]).filter(
  ([, v]) => typeof v === "string" && v.trim().length >= 8,
);

const problems = [];
let scanned = 0;

try {
  for await (const file of walk(DIR)) {
    scanned += 1;
    const text = await readFile(file, "utf8");
    for (const [name, value] of values) {
      if (text.includes(value)) problems.push(`${name} VALUE found in ${file}`);
    }
    // A provider key pattern, in case one was hardcoded rather than read from env.
    const hardcoded = text.match(/sk-[A-Za-z0-9]{16,}/);
    if (hardcoded) problems.push(`hardcoded API key in ${file}: ${hardcoded[0].slice(0, 8)}…`);
  }
} catch {
  console.error(`[bundle-scan] could not read ${DIR} — run \`npm run build\` first.`);
  /* Exit 0 locally, where "I have not built yet" is a normal state. In CI the
     build ran three steps earlier, so an unreadable directory means the scan
     did not happen and the job must not go green on it. */
  process.exit(process.env.CI ? 1 : 0);
}

console.log(`[bundle-scan] ${scanned} client files scanned`);
if (values.length === 0) {
  const message =
    "no secret values are set in this environment, so only the hardcoded-key " +
    "pattern was checked — nothing was verified about any real secret.";
  /*
   * A gate that cannot fail is not a gate.
   *
   * This branch used to print the note and exit 0, and that is how it behaved
   * everywhere it mattered: nothing loaded `.env.local` for it locally, and the
   * CI step passed no secrets at all, so every green run of `check:bundle` in
   * this repository's history had searched the bundle for nothing. Locally that
   * is a reasonable default — a contributor with no keys still wants
   * `npm run check` to work. In CI it is a false negative wearing a tick.
   */
  if (process.env.CI) {
    console.error(`[bundle-scan] ✗ ${message}`);
    console.error(
      "[bundle-scan] Set the secrets on the workflow step (see .github/workflows/ci.yml) " +
        "or set BUNDLE_SCAN_ALLOW_EMPTY=1 to accept a name-only check.",
    );
    if (!process.env.BUNDLE_SCAN_ALLOW_EMPTY) process.exit(1);
  }
  console.log(`[bundle-scan] ${message}`);
}
if (problems.length > 0) {
  for (const p of problems) console.error(`[bundle-scan] ✗ ${p}`);
  process.exit(1);
}
console.log("[bundle-scan] ✓ no secret values in the client bundle");
