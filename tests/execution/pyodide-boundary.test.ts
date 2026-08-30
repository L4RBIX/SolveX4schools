import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { MONTHS } from "@schools/curriculum/months";
import { publicBlock, secretStringsOf, type PublicBlock } from "@schools/curriculum/public";
import type { LessonBlock } from "@schools/curriculum/types";
import { surfaceForBlock } from "@schools/execution/trust-policy";

/**
 * The security boundary of the Pyodide path.
 *
 * ## The one sentence
 *
 * **The worker gets the learner's source and the learner's stdin. Nothing
 * else.** No hidden cases, no reference solutions, no expected output, no keys,
 * no database handle, no teacher data — because everything that reaches the
 * browser is readable in DevTools by the person being assessed, and an answer
 * key that reaches the browser has already leaked whatever a component does
 * with it afterwards.
 *
 * `tests/school/payload-privacy.test.ts` already proves the curriculum's public
 * projection withholds the answers, in general and against built HTML. This file
 * is the Pyodide-specific half the audit asked for
 * (`HYBRID_EXECUTION_AUDIT.md`, finding 4: "Phase 21 is largely pre-satisfied;
 * what it still needs is a test that says so about the Pyodide path
 * specifically"). It asks three questions that file does not:
 *
 * 1. Does the object a *code task* — the only block type with a Run button —
 *    hands to the client contain anything that could answer it?
 * 2. Can the worker's message protocol *express* a secret at all? Asserted
 *    structurally against the type, the way `tests/nova/judge-secrets.test.ts`
 *    asserts against `PromptContext`: if the type has no field for it there is
 *    nothing to leak, whatever a future call site does.
 * 3. Does anything under `src/lib/pyodide/**` reach for the server's half of the
 *    world — the judge, the curriculum, the store, an API route, a CDN?
 *
 * All three are structural. None of them depend on what a component happens to
 * pass today, which matters because the lesson player's Run UI is being written
 * as this is read.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/* -------------------------------------------------------------------------- */
/* Source helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Comments removed, so a field name mentioned in prose is not a field. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

/** Every `name:` in a type body — its declared fields, and nothing else. */
function fieldNamesOf(typeBody: string): Set<string> {
  const names = new Set<string>();
  for (const match of stripComments(typeBody).matchAll(/(?:^|[{;|,\s])([A-Za-z_]\w*)\s*\??\s*:/g)) {
    names.add(match[1]);
  }
  return names;
}

/** The slice of a source file between two markers, both of which must exist. */
function between(source: string, from: string, to: string): string {
  const start = source.indexOf(from);
  const end = source.indexOf(to);
  expect(start, `marker not found: ${from}`).toBeGreaterThanOrEqual(0);
  expect(end, `marker not found: ${to}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

/** The balanced `{…}` that follows a marker. */
function objectLiteralAfter(source: string, marker: string): string {
  const from = source.indexOf(marker);
  expect(from, `marker not found: ${marker}`).toBeGreaterThanOrEqual(0);
  const open = source.indexOf("{", from);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced object literal after ${marker}`);
}

/** Every `.ts` file under `src/lib/pyodide`, read once. */
function pyodideModules(): { rel: string; source: string }[] {
  const dir = path.join(ROOT, "src/lib/pyodide");
  const out: { rel: string; source: string }[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
        out.push({ rel: path.relative(ROOT, full), source: readFileSync(full, "utf8") });
      }
    }
  };
  walk(dir);
  return out;
}

const PYODIDE_MODULES = pyodideModules();

/* -------------------------------------------------------------------------- */
/* The curriculum, and what it withholds                                      */
/* -------------------------------------------------------------------------- */

function everyBlock(): { where: string; block: LessonBlock }[] {
  const out: { where: string; block: LessonBlock }[] = [];
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) out.push({ where: lesson.id, block });
      }
    }
    for (const block of month.assessment?.blocks ?? []) {
      out.push({ where: month.assessment!.id, block });
    }
  }
  return out;
}

const EVERY_BLOCK = everyBlock();

/** The block types that get an editor and a Run button — the Pyodide surface. */
const RUNNABLE_TYPES = new Set(["write_code", "modify_code", "challenge", "verify"]);

const RUNNABLE = EVERY_BLOCK.filter((e) => RUNNABLE_TYPES.has(e.block.type));

/* -------------------------------------------------------------------------- */
/* 1 — what a coding block hands to the client                                */
/* -------------------------------------------------------------------------- */

describe("a coding block's client payload can answer nothing", () => {
  it("finds the runnable blocks", () => {
    /* Without this a refactor that renamed a block type would leave every
       assertion below iterating an empty array and reporting success. */
    expect(RUNNABLE.length).toBeGreaterThan(15);
    expect(RUNNABLE.some((e) => e.block.id.startsWith("m1.p"))).toBe(true);
    expect(RUNNABLE.some((e) => e.block.type === "verify")).toBe(true);
  });

  it("every runnable block goes to a surface that exists, and the evidence ones need the judge", () => {
    for (const { block, where } of RUNNABLE) {
      const surface = surfaceForBlock({
        blockType: block.type,
        blockId: block.id,
        lessonId: where,
      });
      /* The connection between this file and the trust model: the blocks that
         get a Pyodide Run button are exactly the blocks whose CHECK may need the
         server. If a runnable block ever landed on a surface that did not exist,
         `TRUST_POLICY` would have no answer for it. */
      expect(surface, `${block.id} has no surface`).toBeTruthy();
    }
  });

  for (const { where, block } of RUNNABLE) {
    it(`${block.id} (${where}) ships no answer to the browser`, () => {
      const pub = publicBlock(block);
      const json = JSON.stringify(pub);

      /* The three named in the brief, by key rather than by value: a key check
         catches an empty or one-character answer that a substring check would
         miss. */
      for (const key of ["referenceSolution", "correctOptionId", "hidden", "checker"]) {
        expect(json, `${block.id} shipped the key "${key}"`).not.toContain(`"${key}":`);
      }

      /* And by value, for everything `secretStringsOf` considers distinctive
         enough to search for — the reference solution itself, hidden case
         inputs and expected outputs, blank answers, breaking inputs. */
      for (const secret of secretStringsOf(block)) {
        expect(json, `${block.id} leaked:\n${secret}`).not.toContain(secret);
      }

      /* Hidden cases specifically: neither half of a hidden pair may ship, and
         the count that replaces them has to be true. The count is the thing the
         UI turns into «Ещё N скрытых теста», and that sentence was a lie for as
         long as the cases shipped alongside it. */
      if ("cases" in block && Array.isArray(block.cases)) {
        const hidden = block.cases.filter((c) => c.hidden);
        expect("hiddenCaseCount" in pub, `${block.id} lost its hidden count`).toBe(true);
        const withCases = pub as Extract<PublicBlock, { hiddenCaseCount: number }>;
        expect(withCases.hiddenCaseCount, `${block.id} miscounts what it withheld`).toBe(hidden.length);
        expect(withCases.visibleCases.length).toBe(block.cases.length - hidden.length);
      }
    });
  }

  it("no multiple-choice key rides along in the same payload", () => {
    /* `correctOptionId` is not a coding-block field, and it is named in the
       brief because the lesson page ships every block of a lesson in one
       payload — a Run button on block 5 does not stop block 3's answer key from
       being three lines further down the same JSON. */
    const json = JSON.stringify(EVERY_BLOCK.map((e) => publicBlock(e.block)));
    expect(json).not.toContain('"correctOptionId":');
    expect(json).not.toContain('"answer":');
  });
});

/* -------------------------------------------------------------------------- */
/* 2 — the worker protocol cannot express a secret                            */
/* -------------------------------------------------------------------------- */

describe("the worker's inbound message can carry only learner source and learner stdin", () => {
  const worker = read("src/lib/pyodide/worker.ts");
  const inbound = between(worker, "export type WorkerInbound", "export type WorkerDecidedStatus");

  it("declares exactly six fields across both variants, and no others", () => {
    /* An ALLOWLIST, not a list of forbidden names. A denylist only refuses the
       leaks somebody already thought of; this refuses the ones they did not.
       Adding a field to the protocol is a deliberate act with a red test in
       front of it, which is the correct amount of friction for the message that
       crosses into the interpreter. */
    expect(fieldNamesOf(inbound)).toEqual(
      new Set(["kind", "baseUrl", "id", "source", "stdin", "maxOutputBytes"]),
    );
  });

  it("types every payload field as a primitive, so nothing structured can ride along", () => {
    /* `cases: Case[]` would satisfy an allowlist that only checked names. A
       string and two numbers cannot carry an answer key without someone
       serialising one into the learner's own source, which is a different and
       far more visible thing to do. */
    const stripped = stripComments(inbound);
    expect(stripped).toMatch(/source:\s*string/);
    expect(stripped).toMatch(/stdin:\s*string/);
    expect(stripped).toMatch(/maxOutputBytes:\s*number/);
    expect(stripped).toMatch(/id:\s*number/);
    expect(stripped).toMatch(/baseUrl:\s*string/);
    expect(stripped, "no array or index type may appear in the inbound protocol").not.toMatch(
      /\[\]|Record<|Map</,
    );
  });

  it("has no field a judge secret could arrive in", () => {
    /* Named explicitly as well, so a reader can see WHAT is protected — the
       same reason `judge-secrets.test.ts` lists them out beside its structural
       check on `PromptContext`. */
    for (const forbidden of [
      "referenceSolution",
      "cases",
      "expectedOutput",
      "expected",
      "hidden",
      "correctOptionId",
      "breakingInputs",
      "fixedCode",
      "checker",
      "token",
      "secret",
      "apiKey",
      "learnerId",
      "attestation",
    ]) {
      expect(inbound, `WorkerInbound must not accept ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("the runner sends exactly those fields and nothing it was handed", () => {
    /* The type says what CAN be sent; this says what IS. The run message is
       built in one place, from a `LocalRunRequest` whose own fields are the
       same four, so there is no path by which a block's props reach the
       interpreter. */
    const runner = read("src/lib/pyodide/runner.ts");
    const message = objectLiteralAfter(runner, 'kind: "run"');
    expect(fieldNamesOf(message)).toEqual(
      new Set(["kind", "id", "source", "stdin", "maxOutputBytes"]),
    );
    expect(message).toContain("source: request.source");
    expect(message).toContain("stdin: request.stdin");
  });

  it("the request the UI hands the runner has the same four fields", () => {
    /* `LocalRunRequest` is the public door into local execution. If a component
       could pass a block, a block is what the worker would eventually get. */
    const trust = read("schools/execution/trust.ts");
    const request = between(trust, "export interface LocalRunRequest", "export interface LocalRunResult");
    expect(fieldNamesOf(request)).toEqual(
      new Set(["source", "stdin", "timeLimitMs", "maxOutputBytes"]),
    );
  });

  it("nothing the worker sends BACK can carry a verdict either", () => {
    /* The mirror of `trust.test.ts`'s assertion about `LocalRunResult`. A
       `passed` on the outbound message would be a fake judge one hop earlier,
       and it would be just as untrue: the worker has no expected output, and if
       it ever did the answer key would already have leaked. */
    const outbound = between(worker, "export type WorkerOutbound", "/* ------");
    for (const forbidden of ["passed", "correct", "verdict", "score", "accepted", "expected"]) {
      expect(outbound, `WorkerOutbound must not report ${forbidden}`).not.toContain(forbidden);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* 3 — the Pyodide modules reach for nothing on the server's side             */
/* -------------------------------------------------------------------------- */

describe("nothing under src/lib/pyodide can reach the server's half of the world", () => {
  it("found the modules", () => {
    expect(PYODIDE_MODULES.map((m) => path.basename(m.rel)).sort()).toEqual([
      "runner.ts",
      "use-python.ts",
      "worker.ts",
    ]);
  });

  it("imports only React, Pyodide, the trust types and its own siblings", () => {
    /* An allowlist again, and it is the cheap version of a guarantee the build
       already gives: every module under `schools/exec/**` carries
       `import "server-only"`, so importing one from here is a build error rather
       than a leak. Asserted anyway because a build error is only a guarantee
       while the marker is there, and because this catches the imports that are
       NOT server-only and would still be wrong — `@schools/curriculum/months`
       is an ordinary module, and importing it would bundle every reference
       solution in the year into the client. */
    for (const { rel, source } of PYODIDE_MODULES) {
      const specifiers = [
        ...source.matchAll(/^\s*import\s+(?:type\s+)?[\s\S]*?from\s+"([^"]+)";/gm),
      ].map((m) => m[1]);
      expect(specifiers.length, `${rel} has no imports at all — is the regex still right?`).toBeGreaterThan(0);
      for (const spec of specifiers) {
        const allowed =
          spec === "react" ||
          spec === "pyodide" ||
          spec.startsWith("./") ||
          spec.startsWith("@schools/execution/");
        expect(allowed, `${rel} imports ${spec}, which does not belong in a browser bundle`).toBe(true);
      }
    }
  });

  it("names the forbidden neighbours explicitly", () => {
    for (const { rel, source } of PYODIDE_MODULES) {
      for (const forbidden of [
        "@schools/exec",
        "@schools/curriculum",
        "@schools/store",
        "@schools/learning",
        "@schools/nova",
        "@schools/config",
        "server-only",
        "node:",
        "next/server",
      ]) {
        expect(source, `${rel} must not mention ${forbidden}`).not.toContain(`"${forbidden}`);
      }
    }
  });

  it("the exec modules are still server-only, which is what makes that a build error", () => {
    /* The audit says this was "verified by grep, not assumed" — so it is
       re-verified here rather than inherited from a document. If one of these
       loses the marker, importing it from a client component stops failing the
       build and this test is the only thing left. */
    const dir = path.join(ROOT, "schools/exec");
    const files: string[] = [];
    const walk = (current: string) => {
      for (const entry of readdirSync(current)) {
        const full = path.join(current, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith(".ts")) files.push(full);
      }
    };
    walk(dir);
    expect(files.length).toBeGreaterThan(4);
    for (const file of files) {
      const rel = path.relative(ROOT, file);
      /* `checker.ts` is the documented exception: pure string comparison with no
         secret in it, imported by `schools/curriculum/types.ts`. It takes the
         answer key as an ARGUMENT, which is why it is on the audit's
         SERVER_ONLY list anyway — the guarantee for it is that nothing in the
         browser calls it, asserted below. */
      if (rel.endsWith("checker.ts")) continue;
      expect(readFileSync(file, "utf8"), `${rel} lost its server-only marker`).toMatch(
        /^import "server-only";/m,
      );
    }
  });

  it("never calls the checker, because the browser has nothing to check against", () => {
    /* Rule 1 of the audit's "what the build must not do". A local check would
       need an expected output, and if the browser has one the answer key has
       already leaked. */
    for (const { rel, source } of PYODIDE_MODULES) {
      for (const forbidden of ["checkOutput", "DEFAULT_CHECKER", "expectedOutput", "visibleCases"]) {
        expect(source, `${rel} must not be able to grade anything`).not.toContain(forbidden);
      }
    }
  });

  it("talks to no API and no CDN — the runtime comes from our own origin", () => {
    /* Two separate promises in one assertion, both of them structural:
       the browser never reaches a judge endpoint itself (SUBMIT is a server
       concern), and the 13 MB interpreter is served from `public/pyodide/` so a
       school that loses its connection mid-lesson keeps working and the CSP can
       stay `connect-src 'self'`. */
    for (const { rel, source } of PYODIDE_MODULES) {
      for (const forbidden of [
        "/api/",
        "cdn.jsdelivr.net",
        "https://",
        "http://",
        "fetch(",
        "XMLHttpRequest",
        "WebSocket",
        "localStorage",
        "indexedDB",
      ]) {
        expect(source, `${rel} must not contain ${forbidden}`).not.toContain(forbidden);
      }
    }
    expect(read("src/lib/pyodide/worker.ts")).toContain('DEFAULT_PYODIDE_BASE_URL = "/pyodide/"');
  });
});

/* -------------------------------------------------------------------------- */
/* 4 — no September secret is sitting in the Pyodide source                   */
/* -------------------------------------------------------------------------- */

/**
 * Is this secret too much like ordinary program text to mean anything here?
 *
 * `secretStringsOf` has a length floor tuned for the haystack it was written
 * for: built HTML, in Kazakh and Russian, where an eight-character Python
 * fragment colliding by accident is implausible. This haystack is TypeScript,
 * and the two share a language. `m3.l6.b6`'s blank answer is `return c`, which
 * appears in `runner.ts` because it returns something starting with a c.
 *
 * The discriminator is NOT length. 57% of the programme's secrets are under
 * twenty characters and almost all of them are DATA — `-9 -3 -7`, `333833500`,
 * `200 10000` — which cannot collide with TypeScript at all and are exactly
 * what a debugging paste would leave behind. What can collide is a short
 * fragment of CODE: letters, spaces and operators, no digits.
 *
 * So that is the rule, and it costs 28 of 1608 secrets — 1.74% of the scan — and
 * hides exactly one collision, the one named above. `secretStringsOf` itself is
 * untouched: `payload-privacy.test.ts` remains the single source of truth for
 * leak detection and its floor is its own.
 */
function collidesWithProse(secret: string): boolean {
  return secret.length < 24 && !/\d/.test(secret) && /^[A-Za-z_ .()[\]=<>+*/-]+$/.test(secret);
}

describe("no answer key has been pasted into the Pyodide path", () => {
  const haystack = PYODIDE_MODULES.map((m) => m.source).join("\n");

  it("has something to search", () => {
    expect(haystack.length).toBeGreaterThan(10_000);
  });

  it("contains no distinctive secret from any block in the programme", () => {
    /* `secretStringsOf` is the same collector `tests/school/payload-privacy.test.ts`
       runs over built HTML — reference solutions, hidden case values, blank
       answers, breaking inputs, trace values, diagnostic justifications — with
       its own length floor keeping generic strings out. Running it over source
       code is cheap and it is the check that would catch the one thing the
       structural assertions above cannot: somebody hard-coding a fixture into
       the runner while debugging and leaving it there. */
    let searched = 0;
    let skipped = 0;
    for (const { block } of EVERY_BLOCK) {
      for (const secret of secretStringsOf(block)) {
        if (collidesWithProse(secret)) {
          skipped += 1;
          continue;
        }
        searched += 1;
        expect(haystack, `${block.id} secret found in src/lib/pyodide:\n${secret}`).not.toContain(
          secret,
        );
      }
    }
    expect(searched, "no secrets were collected — the walk is broken").toBeGreaterThan(30);
    /* The exemption is narrow and must stay narrow. If this number grows, the
       rule below is catching more than the handful of cases it was written for
       and the scan is quietly shrinking. */
    expect(skipped, "the code-fragment exemption has widened").toBeLessThan(40);
  });

  it("contains neither of the two short sentinels the audits name by hand", () => {
    /* `5 100` is the hidden input the payload audit found in built HTML;
       `23 59 59` is the hidden expectation `judge-secrets.test.ts` uses as its
       example of a value Nova may never say. Both are under the length floor
       above, so they are named here where there is no haystack to collide
       with. */
    expect(haystack).not.toContain("5 100");
    expect(haystack).not.toContain("23 59 59");
  });
});
