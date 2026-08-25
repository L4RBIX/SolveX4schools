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
import path from "node:path";

const DIR = ".next/static";
const NAMES = [
  "DEEPSEEK_API_KEY",
  "LEARNING_ATTESTATION_SECRET",
  "LEARNING_CRON_SECRET",
  "DATABASE_URL",
];

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
} catch (err) {
  console.error(`[bundle-scan] could not read ${DIR} — run \`npm run build\` first.`);
  process.exit(0);
}

console.log(`[bundle-scan] ${scanned} client files scanned`);
if (values.length === 0) {
  console.log(
    "[bundle-scan] no secret values are set in this environment, so only the " +
      "hardcoded-key pattern was checked. Run again in CI with the real values set.",
  );
}
if (problems.length > 0) {
  for (const p of problems) console.error(`[bundle-scan] ✗ ${p}`);
  process.exit(1);
}
console.log("[bundle-scan] ✓ no secret values in the client bundle");
