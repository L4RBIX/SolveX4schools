#!/usr/bin/env node
/**
 * Client-bundle secret scan.
 *
 * Greps the built client chunks for the VALUES of server-only secrets, not
 * their names. The distinction matters: `DEEPSEEK_API_KEY` appears legitimately
 * in the dev labs — once as the C++ that proves the sandbox environment is
 * scrubbed, once as a jailbreak prompt Nova must refuse. Failing on the name
 * would train everyone to ignore this check.
 *
 * What must never appear is a value.
 *
 * ## The rule this file is built around
 *
 * **A gate that cannot fail is not a gate** — and the corollary that took two
 * attempts to get right: *a gate that silently checks less than it claims is
 * the same thing wearing a tick.* Every name in `NAMES` is either SEARCHED FOR
 * or REPORTED BY NAME as unsearched. There is no third outcome, and an
 * unsearched name fails the run unless somebody has deliberately, and by name,
 * said otherwise.
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
 * The shortest value this scan will search a bundle for.
 *
 * A short string matches noise. `text.includes("dev")` hits minified
 * identifiers in every chunk, and a check that cries wolf on every run is a
 * check people learn to skip. So a value under this length is NOT searched —
 * and, since this file's whole rule is that nothing is dropped in silence, it
 * is reported as unchecked and fails exactly like an absent one.
 */
const MIN_SEARCHABLE_LENGTH = 8;

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

/* -------------------------------------------------------------------------- */
/* Coverage: every declared name lands in exactly one of these two lists       */
/* -------------------------------------------------------------------------- */

/**
 * The partial-coverage hole this replaced.
 *
 * `NAMES` declared five secrets and the scan searched for four. `LEARNING_CRON_SECRET`
 * has no value in this environment — it has no consumer in the product either,
 * which is exactly why nobody noticed — so the loader dropped it, and the only
 * guard that existed fired on `values.length === 0`: the ALL-empty case. Four
 * out of five is not zero, so the run printed a clean tick having never looked
 * for the fifth.
 *
 * The dangerous version of that is not today. It is the day somebody wires a
 * consumer to `LEARNING_CRON_SECRET`, sets it in production, and forgets the CI
 * `env:` block — at which point this scan silently drops back to four again and
 * still says ✓. Coverage has to be a number the run PRINTS, not an accident of
 * which variables happened to be set.
 */
const checked = [];
const unchecked = [];
for (const name of NAMES) {
  const raw = process.env[name];
  if (typeof raw !== "string" || raw.trim() === "") {
    unchecked.push({ name, why: "no value in this environment" });
    continue;
  }
  const value = raw.trim();
  if (value.length < MIN_SEARCHABLE_LENGTH) {
    /* The length itself is never printed — a short secret is still a secret's
       shape. Only that it is under the floor. */
    unchecked.push({
      name,
      why: `its value is shorter than the ${MIN_SEARCHABLE_LENGTH}-character floor this scan needs to search for it without matching minified noise`,
    });
    continue;
  }
  checked.push([name, value]);
}

/**
 * The opt-out, and it is deliberately awkward.
 *
 * `BUNDLE_SCAN_ALLOW_MISSING=LEARNING_CRON_SECRET,OTHER_NAME` — a comma-separated
 * list of the exact names you are choosing not to check. Not a boolean, on
 * purpose, and the awkwardness is the feature:
 *
 *   - You have to NAME what you are giving up, so the decision is legible in a
 *     workflow file or a shell history rather than hidden behind `=1`.
 *   - It cannot silently cover a secret added to `NAMES` next year. A new name
 *     is a new failure that somebody has to look at, which is the entire point.
 *   - A typo covers nothing, and says so: the name it was meant to excuse still
 *     fails, and the unrecognised entry is reported beside it.
 *
 * It exists for forks that genuinely do not have one of these credentials.
 * It is not for making a red run go green.
 */
const allowMissing = new Set(
  (process.env.BUNDLE_SCAN_ALLOW_MISSING ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== ""),
);

/* -------------------------------------------------------------------------- */
/* The scan                                                                    */
/* -------------------------------------------------------------------------- */

const problems = [];
let scanned = 0;

try {
  for await (const file of walk(DIR)) {
    scanned += 1;
    const text = await readFile(file, "utf8");
    for (const [name, value] of checked) {
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

/* -------------------------------------------------------------------------- */
/* The verdict                                                                 */
/* -------------------------------------------------------------------------- */

console.log(
  `[bundle-scan] ${scanned} client files scanned; ` +
    `${checked.length}/${NAMES.length} declared secrets searched for` +
    (checked.length > 0 ? ` (${checked.map(([n]) => n).join(", ")})` : ""),
);

/** Set by anything that must make the run red. One exit, at the bottom. */
let fatal = false;

/* Stale and unrecognised allow-list entries. Never fatal on their own — the
   thing they failed to excuse is what fails — but always said out loud, because
   an allow-list nobody re-reads is how the next silent hole gets dug. */
for (const entry of allowMissing) {
  if (!NAMES.includes(entry)) {
    console.error(
      `[bundle-scan] ! BUNDLE_SCAN_ALLOW_MISSING names "${entry}", which is not a declared ` +
        "secret. It excuses nothing. Check the spelling against NAMES in this file.",
    );
  } else if (checked.some(([n]) => n === entry)) {
    console.error(
      `[bundle-scan] ! BUNDLE_SCAN_ALLOW_MISSING names "${entry}", which HAS a value here and ` +
        "was searched for anyway. The entry is stale — drop it.",
    );
  }
}

if (unchecked.length === NAMES.length) {
  /*
   * Nothing at all was verified. Kept as its own branch, and its own opt-out,
   * because "this environment has no secrets" is a different statement from
   * "this environment is missing one" and deserves a different sentence.
   */
  const message =
    "no secret values are set in this environment, so only the hardcoded-key " +
    "pattern was checked — nothing was verified about any real secret.";
  /*
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
    if (!process.env.BUNDLE_SCAN_ALLOW_EMPTY) fatal = true;
  } else {
    console.log(`[bundle-scan] ${message}`);
  }
} else if (unchecked.length > 0) {
  /*
   * PARTIAL coverage, and this one is fatal everywhere — CI and laptop alike.
   *
   * An environment holding four of five secrets is a CONFIGURED environment.
   * Somebody set those four; the fifth is a gap in a deployment or a workflow
   * file, not the state of a contributor who has cloned the repo and has no
   * keys at all. That contributor gets the branch above, and still gets a green
   * `npm run check`. This branch is for the case where the scan would otherwise
   * print a tick for coverage it did not have.
   */
  for (const { name, why } of unchecked) {
    if (allowMissing.has(name)) {
      console.log(`[bundle-scan] – ${name} NOT checked (${why}) — allowed by BUNDLE_SCAN_ALLOW_MISSING`);
      continue;
    }
    console.error(`[bundle-scan] ✗ ${name} was NOT checked: ${why}`);
    fatal = true;
  }
  if (fatal) {
    console.error(
      `[bundle-scan] This scan declares ${NAMES.length} secrets and searched for ${checked.length}. ` +
        "A tick here would claim coverage it does not have. Give the missing names a value " +
        "(the CI step's `env:` block, or .env.local), or — if this fork genuinely has no such " +
        "credential — list them by name in BUNDLE_SCAN_ALLOW_MISSING.",
    );
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`[bundle-scan] ✗ ${p}`);
  fatal = true;
}

if (fatal) process.exit(1);

console.log(
  `[bundle-scan] ✓ no secret values in the client bundle ` +
    `(${checked.length}/${NAMES.length} secrets searched for across ${scanned} files)`,
);
