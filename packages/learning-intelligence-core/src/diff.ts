/**
 * Edit classification: what kind of change did the learner just make?
 *
 * This is the single most informative thing in the learning stream. A Wrong
 * Answer followed by a one-character change is a learner guessing at a
 * boundary. The same Wrong Answer followed by a rewritten control flow is a
 * learner who threw away their model of the problem. Same verdict, same
 * elapsed time, completely different teaching situation — and nothing in
 * SolveX can currently tell them apart.
 *
 * Deterministic heuristics, not a model. Three reasons: it runs on the ingest
 * path and must be fast, its output feeds evidence so it has to be auditable,
 * and a rule that misfires can be read and fixed rather than retrained.
 *
 * Runs SERVER-SIDE. The browser sends source; the classification is ours, so a
 * client cannot label its own thrashing as insight.
 *
 * Not implemented here: `targeted_fix` (a local fix that touches a line
 * implicated by the failing test). It needs failing-line attribution from the
 * verification engine, which is Phase 2. Until then those edits land as
 * `local_fix`, which is true, just less specific.
 */

import { createHash } from "node:crypto";

import type { DiffClass } from "@solvex/learning-contracts";
import { STARTER_TEMPLATES } from "./starterTemplates";

export interface DiffResult {
  diffClass: DiffClass;
  linesAdded: number;
  linesRemoved: number;
  /** Characters on changed lines. A cheap stand-in for true edit distance. */
  editDistance: number;
}

export interface NormalizedCode {
  /** Comments and string bodies removed, whitespace collapsed. */
  stripped: string;
  /** Control-flow token sequence — the structural fingerprint. */
  shape: string;
  /** Numeric literals and comparison operators, in order. */
  literals: string[];
  /**
   * The same code with every non-keyword identifier replaced by a placeholder
   * numbered by first appearance. Two files that differ only in variable names
   * produce the same string, which is how a rename is told from an edit.
   */
  alpha: string;
  /** Non-keyword identifiers in order of appearance, aligned with `alpha`. */
  identifiers: string[];
  identifierCounts: Map<string, number>;
  lines: string[];
  lineCount: number;
}

// ─── Normalisation ───────────────────────────────────────────────────────────

/**
 * Remove comments and string contents.
 *
 * String *bodies* go but the quotes stay, so `print("a")` → `print("")`:
 * changing a message is cosmetic, deleting the call is not. Done with a small
 * state machine rather than regexes, because a `//` inside a string literal
 * would otherwise eat the rest of the line.
 */
export function stripCommentsAndStrings(source: string, language: string): string {
  const isPython = language.startsWith("python");
  const out: string[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];

    // Line comment
    if ((!isPython && ch === "/" && next === "/") || (isPython && ch === "#")) {
      while (i < n && source[i] !== "\n") i += 1;
      continue;
    }
    // Block comment (C-family only)
    if (!isPython && ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    // Triple-quoted string (Python) — also the docstring case
    if (isPython && (ch === '"' || ch === "'") && source[i + 1] === ch && source[i + 2] === ch) {
      const quote = ch.repeat(3);
      i += 3;
      while (i < n && source.slice(i, i + 3) !== quote) i += 1;
      i += 3;
      out.push('""');
      continue;
    }
    // Ordinary string / char literal
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      while (i < n && source[i] !== quote) {
        if (source[i] === "\\") i += 1; // skip escape
        i += 1;
      }
      i += 1;
      out.push(quote + quote);
      continue;
    }

    out.push(ch);
    i += 1;
  }

  return out.join("");
}

/** Structural keywords. Language-agnostic on purpose: SolveX ships C++ and Python. */
const CONTROL_TOKENS = new Set([
  "if", "else", "elif", "for", "while", "do", "switch", "case", "default",
  "return", "break", "continue", "goto", "try", "catch", "except", "finally",
  "def", "class", "struct", "lambda", "yield", "with", "throw", "raise",
]);

const COMPARISON_OPERATORS = /(<=|>=|==|!=|<|>)/g;
const NUMERIC_LITERAL = /\b\d+(?:\.\d+)?\b/g;

export function normalizeCode(source: string, language: string): NormalizedCode {
  const stripped = stripCommentsAndStrings(source ?? "", language);

  const lines = stripped
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);

  // Shape: control keywords plus braces, in order. Identifier renames and
  // constant edits leave it untouched, which is exactly what makes it useful
  // for telling "renamed a variable" from "restructured the loop".
  const shapeTokens: string[] = [];
  for (const raw of stripped.split(/([{}();,])|\s+/)) {
    if (!raw) continue;
    if (raw === "{" || raw === "}") {
      shapeTokens.push(raw);
      continue;
    }
    const word = raw.replace(/[^A-Za-z_]/g, "");
    if (word && CONTROL_TOKENS.has(word)) shapeTokens.push(word);
  }
  // Python has no braces; indentation carries the same information.
  if (language.startsWith("python")) {
    for (const line of stripped.split("\n")) {
      const indent = line.match(/^[ \t]*/)?.[0].length ?? 0;
      if (line.trim()) shapeTokens.push(`i${Math.floor(indent / 2)}`);
    }
  }

  const literals = [
    ...(stripped.match(NUMERIC_LITERAL) ?? []),
    ...(stripped.match(COMPARISON_OPERATORS) ?? []),
  ];

  // Alpha-normalisation: every non-keyword identifier becomes a placeholder
  // numbered by first appearance. `total` and `sum` both become `v3`, so a
  // rename collapses to the identical string while any other edit does not.
  const identifiers: string[] = [];
  const identifierCounts = new Map<string, number>();
  const placeholders = new Map<string, string>();
  const alpha = stripped.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (word) => {
    if (CONTROL_TOKENS.has(word)) return word;
    identifiers.push(word);
    identifierCounts.set(word, (identifierCounts.get(word) ?? 0) + 1);
    let placeholder = placeholders.get(word);
    if (!placeholder) {
      placeholder = `v${placeholders.size}`;
      placeholders.set(word, placeholder);
    }
    return placeholder;
  });

  return {
    stripped: lines.join("\n"),
    shape: shapeTokens.join(" "),
    literals,
    alpha: alpha.replace(/\s+/g, " ").trim(),
    identifiers,
    identifierCounts,
    lines,
    lineCount: lines.length,
  };
}

/**
 * Identifiers whose substitution is never a rename.
 *
 * Alpha-equivalence alone cannot tell `total` → `sum` from `min` → `max`: both
 * are one identifier swapped for another at the same position. The second is a
 * semantic change, and one of the most common forms of guessing at a boundary,
 * so treating it as cosmetic would hide exactly the thrashing this classifier
 * exists to surface.
 */
const SEMANTIC_IDENTIFIERS = new Set([
  // Pairs where swapping one for the other is a classic fix attempt.
  "min", "max", "floor", "ceil", "sort", "sorted", "reverse", "reversed",
  "lower_bound", "upper_bound", "begin", "end", "rbegin", "rend",
  "first", "second", "front", "back", "push_back", "pop_back",
  "abs", "round", "swap",
  "true", "false", "nullptr", "None", "True", "False",
]);
// Deliberately NOT here: sum, len, size, count, find, range, insert, erase.
// Those read as function names but are just as often a learner's own variable,
// and denying them would file ordinary renames as edits. The "used at least
// twice before" guard below is what covers them.

/**
 * Did the learner rename things, or change what the code does?
 *
 * Requires alpha-equivalence, identical literals, and — the guard that makes
 * this trustworthy — that every substituted identifier occurred at least twice
 * before. A variable worth renaming is used more than once; a single-site
 * substitution is an edit wearing a rename's clothes.
 */
export function isPureRename(before: NormalizedCode, after: NormalizedCode): boolean {
  if (before.alpha !== after.alpha) return false;
  if (!sameLiterals(before.literals, after.literals)) return false;
  if (before.identifiers.length !== after.identifiers.length) return false;

  for (let i = 0; i < before.identifiers.length; i += 1) {
    const from = before.identifiers[i];
    const to = after.identifiers[i];
    if (from === to) continue;
    if (SEMANTIC_IDENTIFIERS.has(from) || SEMANTIC_IDENTIFIERS.has(to)) return false;
    if ((before.identifierCounts.get(from) ?? 0) < 2) return false;
  }
  return true;
}

/** Content address for a code blob. Hash the raw text, not the normalised form. */
export function hashCode(source: string): string {
  return createHash("sha256").update(source ?? "", "utf8").digest("hex");
}

/** Stored alongside the blob so classification survives text deletion. */
export function astShape(source: string, language: string): string {
  const shape = normalizeCode(source, language).shape;
  return shape.length <= 4000 ? shape : createHash("sha256").update(shape).digest("hex");
}

// ─── Line diff ───────────────────────────────────────────────────────────────

/**
 * Line-level added/removed counts via a longest-common-subsequence table.
 *
 * Capped at MAX_LCS lines squared; above that the table costs more than the
 * signal is worth and we fall back to a multiset difference, which
 * over-reports moved lines but never under-reports real change.
 */
const MAX_LCS = 400;

export function lineDiff(before: string[], after: string[]): { added: number; removed: number } {
  if (before.length > MAX_LCS || after.length > MAX_LCS) {
    const counts = new Map<string, number>();
    for (const line of before) counts.set(line, (counts.get(line) ?? 0) + 1);
    let matched = 0;
    for (const line of after) {
      const remaining = counts.get(line) ?? 0;
      if (remaining > 0) {
        counts.set(line, remaining - 1);
        matched += 1;
      }
    }
    return { added: after.length - matched, removed: before.length - matched };
  }

  const m = before.length;
  const n = after.length;
  const table: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      table[i][j] =
        before[i] === after[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const common = table[0][0];
  return { added: n - common, removed: m - common };
}

function changedChars(before: string[], after: string[], added: number, removed: number): number {
  if (added === 0 && removed === 0) return 0;
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  let chars = 0;
  for (const line of after) if (!beforeSet.has(line)) chars += line.length;
  for (const line of before) if (!afterSet.has(line)) chars += line.length;
  return chars;
}

// ─── Classification ──────────────────────────────────────────────────────────

/** Below this, there is nothing there at all. */
const EMPTY_CHARS = 40;
/** A deletion this severe is starting over, not editing. */
const RESET_SURVIVING_FRACTION = 0.35;
const RESET_CEILING_CHARS = 140;

/** Shapes of the starter templates the editor loads, computed once. */
const TEMPLATE_SHAPES: ReadonlyMap<string, string> = new Map(
  Object.entries(STARTER_TEMPLATES).map(([language, template]) => [
    language,
    normalizeCode(template, language).shape,
  ])
);

/**
 * Is this the starter template rather than an attempt at the problem?
 *
 * Compared against the ACTUAL templates the editor loads, not inferred. Two
 * heuristics were tried against the internal replays and both failed on real
 * code: a character-count floor labelled a short-but-correct summation loop as
 * boilerplate, and "has no loop or branch" broke twice over — the Python
 * starter contains `if __name__`, so it never matched, and an idiomatic
 * vectorised Python solution contains no loop at all, so it always did. The
 * template is a known string; there is no reason to guess at it.
 */
function isBoilerplate(code: NormalizedCode, language: string): boolean {
  if (code.stripped.replace(/\s/g, "").length < EMPTY_CHARS) return true;
  const templateShape = TEMPLATE_SHAPES.get(language);
  return templateShape !== undefined && code.shape === templateShape;
}
/** Fraction of lines that must change before an edit reads as a rewrite. */
const STRUCTURAL_LINE_RATIO = 0.6;
/** A `local_fix` touches at most this many lines. */
const LOCAL_FIX_LINES = 3;

export function classifyDiff(
  previous: string | null,
  current: string,
  language: string
): DiffResult {
  // Nothing to compare against — the first snapshot of an episode, or a blob
  // whose text has aged out of retention. Honest label, not a guess.
  if (previous === null || previous === undefined) {
    return { diffClass: "unknown", linesAdded: 0, linesRemoved: 0, editDistance: 0 };
  }

  const before = normalizeCode(previous, language);
  const after = normalizeCode(current, language);

  const { added, removed } = lineDiff(before.lines, after.lines);
  const editDistance = changedChars(before.lines, after.lines, added, removed);

  const base: Omit<DiffResult, "diffClass"> = {
    linesAdded: added,
    linesRemoved: removed,
    editDistance,
  };

  // Identical once comments, strings and whitespace are gone.
  if (before.stripped === after.stripped) {
    return { ...base, diffClass: "cosmetic" };
  }

  // Boilerplate is the pivot for the two most confusable classes, so both are
  // decided here, before anything looks at line counts.
  const beforeIsTemplate = isBoilerplate(before, language);
  const afterIsTemplate = isBoilerplate(after, language);

  // Real work wiped back to a template, or most of it simply deleted. The
  // second clause matters because a learner who gives up rarely restores the
  // exact starter text; they select all and delete.
  const beforeChars = before.stripped.replace(/\s/g, "").length;
  const afterChars = after.stripped.replace(/\s/g, "").length;
  if (!beforeIsTemplate && afterIsTemplate) {
    return { ...base, diffClass: "reset" };
  }
  if (
    !beforeIsTemplate &&
    afterChars < RESET_CEILING_CHARS &&
    afterChars <= beforeChars * RESET_SURVIVING_FRACTION
  ) {
    return { ...base, diffClass: "reset" };
  }

  // A template became a real solution: first authorship, not a rewrite.
  //
  // Checked before `structural` because it is structurally indistinguishable
  // from one — and mislabelling it cost that class its meaning. Across twenty
  // internal replays, 18 of 20 episodes reported `structural` as their second
  // edit purely because writing the first solution replaces the template's
  // control flow. `structural` is supposed to mean "the learner abandoned
  // their model"; it cannot mean that if it also fires for everyone who starts.
  if (beforeIsTemplate && !afterIsTemplate) {
    return { ...base, diffClass: "authored" };
  }

  const shapeUnchanged = before.shape === after.shape;

  // Identifiers changed and nothing else did.
  if (isPureRename(before, after)) {
    return { ...base, diffClass: "cosmetic" };
  }

  // Same structure, one literal or comparison changed. The signature of
  // guessing at a boundary — and, repeated against the same failing test, the
  // cleanest thrashing detector available to us.
  if (shapeUnchanged && added <= 1 && removed <= 1 && literalDelta(before.literals, after.literals) <= 1) {
    return { ...base, diffClass: "constant_tweak" };
  }

  const totalLines = Math.max(before.lineCount, after.lineCount, 1);
  const churn = (added + removed) / totalLines;

  // Control flow materially changed, or most of the body was replaced.
  if (!shapeUnchanged && (churn >= STRUCTURAL_LINE_RATIO || shapeChurn(before.shape, after.shape) >= 0.4)) {
    return { ...base, diffClass: "structural" };
  }

  // Purely additive against unchanged existing structure: handling a case they
  // had missed rather than rethinking the approach.
  if (removed === 0 && added > 0 && after.shape.startsWith(before.shape.slice(0, Math.floor(before.shape.length * 0.9)))) {
    return { ...base, diffClass: "extension" };
  }

  if (added + removed <= LOCAL_FIX_LINES) {
    return { ...base, diffClass: "local_fix" };
  }

  return { ...base, diffClass: churn >= STRUCTURAL_LINE_RATIO ? "structural" : "local_fix" };
}

function sameLiterals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/** How many literal/operator positions differ, counting length change as delta. */
function literalDelta(a: string[], b: string[]): number {
  let delta = Math.abs(a.length - b.length);
  const shared = Math.min(a.length, b.length);
  for (let i = 0; i < shared; i += 1) if (a[i] !== b[i]) delta += 1;
  return delta;
}

/** Normalised token-level difference between two shape strings. */
function shapeChurn(before: string, after: string): number {
  const a = before.split(" ").filter(Boolean);
  const b = after.split(" ").filter(Boolean);
  if (a.length === 0 && b.length === 0) return 0;
  const { added, removed } = lineDiff(a, b);
  return (added + removed) / Math.max(a.length, b.length, 1);
}
